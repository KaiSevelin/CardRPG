/**
 * The tray: what you play from.
 *
 * A sheet is something you open, consult and close. That is wrong for this game's core loop, where
 * every turn means picking two halves from five cards whose legality depends on your conditions,
 * your equipped items and which card you already used. So the hand lives in its own always-open
 * window (foundry/hud-spec.md).
 *
 * Staging order is play order: the halves resolve in the order you clicked them, which is how the
 * rules' "either order" gets expressed without a separate sequencing step.
 */

import { CARDRPG } from "./config.mjs";
import { deckOf, discardCards, catchBreath, refill } from "./decks.mjs";
import { resolveAttack, resolveDefend, resolveHeal, resolveUse, collectBonuses } from "./resolve.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/* -------------------------------------------- */

export class CardRPGTray extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    /** Staged halves, in click order. @type {{cardId: string, half: string}[]} */
    this.staged = [];
  }

  static DEFAULT_OPTIONS = {
    classes: ["cardrpg", "cr-tray-app"],
    position: { width: 880, height: 420 },
    window: { title: "Card RPG", resizable: true, minimizable: true },
    actions: {
      stage: CardRPGTray.#onStage,
      clear: CardRPGTray.#onClear,
      play: CardRPGTray.#onPlay,
      breathe: CardRPGTray.#onBreathe,
      refill: CardRPGTray.#onRefill
    }
  };

  static PARTS = {
    main: { template: "systems/cardrpg/templates/tray.hbs" }
  };

  /** One tray per actor, so re-opening focuses rather than duplicating. */
  static #open = new Map();

  static openFor(actor) {
    if (!actor) return null;
    let tray = CardRPGTray.#open.get(actor.id);
    if (!tray) {
      tray = new CardRPGTray(actor);
      CardRPGTray.#open.set(actor.id, tray);
    }
    tray.render({ force: true });
    return tray;
  }

  get title() {
    return `${this.actor.name} — tray`;
  }

  async close(options) {
    CardRPGTray.#open.delete(this.actor.id);
    return super.close(options);
  }

  /* -------------------------------------------- */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const system = actor.system;
    const blocked = system.blockedIcons ?? new Set();
    const hand = deckOf(actor, "actionHand");

    const dazed = (system.activeConditions ?? []).some(c => c.key === "dazed");
    const stunned = (system.activeConditions ?? []).some(c => c.key === "stunned");

    const cards = (hand?.cards.contents ?? []).map(card => this.#renderCard(card, blocked, dazed));
    const counts = system.deckCounts ?? {};
    const deckTotal = Math.max(1, (counts.draw ?? 0) + (counts.discard ?? 0) + (counts.hand ?? 0));

    return Object.assign(context, {
      actor,
      system,
      config: CARDRPG,

      cards,
      staged: this.staged.map(s => {
        const card = hand?.cards.get(s.cardId);
        return { ...s, name: card?.name ?? "?" };
      }),
      canPlay: this.staged.length > 0,

      // Dazed removes the secondary entirely; Exhausted does the same and kills reactions too.
      dazed,
      stunned,
      exhausted: system.exhausted,

      conditions: (system.activeConditions ?? []).map(c => ({
        ...c,
        label: game.i18n.localize(CARDRPG.conditions[c.key]?.label ?? c.key),
        icon: CARDRPG.conditions[c.key]?.icon
      })),

      equipped: actor.items
        .filter(i => i.type === "item" && i.system.equipped)
        .map(i => ({
          name: i.name,
          lines: Object.entries(i.system.verbs ?? {})
            .filter(([, line]) => line.value !== null)
            .map(([verb, line]) => `${verb} ${line.value}`)
            .join(" · "),
          armor: i.system.armor
        })),

      counts,
      // The draw pile is the tension meter, so it gets a bar.
      drawPct: Math.round(100 * (counts.draw ?? 0) / deckTotal),
      // With k fate cards left the chance of a swing is 2/k, because Miss and Critical both
      // reshuffle and the deck therefore always holds one of each between reshuffles.
      fateSwing: game.settings.get("cardrpg", "showFateSwing") && counts.fate
        ? Math.min(100, Math.round(200 / counts.fate))
        : null,
      targets: [...(game.user.targets ?? [])].map(t => t.name)
    });
  }

  /* -------------------------------------------- */

  /**
   * Fold resolution steps 1-3 into the face: item base, card modifier, features. Steps 4-6 need a
   * target, so they wait. Nobody should compute Longsword 3 + Strong 1 sixty times a session.
   */
  #renderCard(card, blockedIcons, dazed) {
    const actor = this.actor;

    const half = (name, steps) => {
      const icons = [];
      const bits = [];

      for (const step of steps ?? []) {
        const icon = CARDRPG.verbs[step.verb]?.icon ?? CARDRPG.effects[step.verb]?.icon ?? null;
        if (icon) icons.push(icon);

        let text = step.verb ? game.i18n.localize(CARDRPG.verbs[step.verb]?.label
          ?? CARDRPG.effects[step.verb]?.label ?? step.verb) : "";

        if (step.verb === "strike" || step.verb === "cast") {
          const item = this.#itemFor(step.verb);
          const base = item?.system.verbs?.[step.verb]?.value;
          if (base !== null && base !== undefined) {
            const bonuses = collectBonuses(actor, step.verb, item);
            text += ` ${base + (step.mod ?? 0) + bonuses.total}`;
          } else if (step.mod) {
            text += ` ${step.mod > 0 ? "+" : ""}${step.mod}`;
          }
        } else if (step.param !== null && step.param !== undefined) {
          text += ` ${step.param}`;
        } else if (step.mod !== null && step.mod !== undefined) {
          text += ` ${step.mod > 0 ? "+" : ""}${step.mod}`;
        }

        if (step.text) text += ` (${step.text})`;
        bits.push(text.trim());
      }

      const iconBlocked = icons.some(i => blockedIcons.has(i));
      return {
        name,
        text: bits.join(", ") || "—",
        icon: CARDRPG.halfIcons[name],
        // Blocked halves are greyed in place, never hidden, so the player learns why.
        blocked: iconBlocked || (name === "secondary" && dazed),
        staged: this.staged.some(s => s.cardId === card.id && s.half === name),
        empty: !steps?.length
      };
    };

    // A Wound takes a hand slot and can't be played -- not even for Brace.
    if (card.type === "wound" || card.type === "taint") {
      return { id: card.id, name: card.name, harm: true, halves: [] };
    }

    return {
      id: card.id,
      name: card.name,
      harm: false,
      halves: [half("primary", card.system.primary), half("secondary", card.system.secondary)],
      reaction: card.system.reaction
        ? game.i18n.localize(CARDRPG.reactions[card.system.reaction]?.label ?? card.system.reaction)
        : null
    };
  }

  /** The equipped item that can serve a verb. */
  #itemFor(verb) {
    return this.actor.items.find(i =>
      i.type === "item" && i.system.equipped && i.system.verbs?.[verb]?.value !== null
      && i.system.verbs?.[verb]?.value !== undefined);
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /** Stage a half. One primary and one secondary, from two different cards. */
  static async #onStage(event, target) {
    const { cardId, half } = target.dataset;
    const already = this.staged.findIndex(s => s.cardId === cardId && s.half === half);
    if (already >= 0) {
      this.staged.splice(already, 1);
      return this.render();
    }

    if (this.staged.some(s => s.half === half)) {
      ui.notifications.warn(`You already have a ${half} staged.`);
      return;
    }
    // You can never use both halves of the same card.
    if (this.staged.some(s => s.cardId === cardId)) {
      ui.notifications.warn("Both halves must come from different cards.");
      return;
    }
    if (half === "secondary" && this.staged.length && this.actor.system.exhausted) {
      ui.notifications.warn("Exhausted: one card per turn.");
      return;
    }

    this.staged.push({ cardId, half });
    this.render();
  }

  static #onClear() {
    this.staged = [];
    this.render();
  }

  /** Resolve the staged halves in click order, then discard both cards. */
  static async #onPlay() {
    if (!this.staged.length) return;
    const hand = deckOf(this.actor, "actionHand");
    const targets = [...(game.user.targets ?? [])].map(t => t.actor).filter(a => a);

    for (const { cardId, half } of this.staged) {
      const card = hand?.cards.get(cardId);
      if (!card) continue;
      for (const step of card.system[half] ?? []) {
        await this.#resolveStep(step, half, targets);
      }
    }

    await discardCards(this.actor, this.staged.map(s => s.cardId));
    this.staged = [];
    this.render();
  }

  async #resolveStep(step, half, targets) {
    const actor = this.actor;

    switch (step.verb) {
      case "strike":
      case "cast": {
        if (!targets.length) {
          ui.notifications.warn("Target a token first.");
          return;
        }
        const item = this.#itemFor(step.verb);
        if (!item) {
          ui.notifications.warn(`Nothing equipped can ${step.verb}.`);
          return;
        }
        await resolveAttack(actor, {
          verb: step.verb, item, mod: step.mod ?? 0, targets, step
        });
        return;
      }

      case "defend":
        await resolveDefend(actor, { item: this.#itemFor("defend"), half });
        return;

      case "heal":
        await resolveHeal(actor, { amount: step.param ?? 0 });
        return;

      case "use": {
        const belt = actor.items.find(i =>
          i.type === "item" && i.system.equipped && i.system.verbs?.use?.text !== undefined
          && (i.system.verbs.use.value !== null || i.system.verbs.use.text));
        if (!belt) {
          ui.notifications.warn("No usable item equipped.");
          return;
        }
        await resolveUse(actor, { item: belt, target: targets[0] ?? actor });
        return;
      }

      // Movement happens on the grid, and Ready is bookkeeping -- both are narrated, not simulated.
      default:
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div class="cardrpg"><p><strong>${actor.name}</strong>: `
            + `${step.verb ?? ""}${step.param ? ` ${step.param}` : ""}`
            + `${step.text ? ` — ${step.text}` : ""}</p></div>`
        });
    }
  }

  static async #onBreathe() {
    await catchBreath(this.actor);
    this.staged = [];
    this.render();
  }

  static async #onRefill() {
    await refill(this.actor);
    this.render();
  }
}

/* -------------------------------------------- */

/** Keep every open tray in step with the documents behind it. */
export function registerTrayHooks() {
  const refresh = doc => {
    const actor = doc instanceof Actor ? doc : doc.parent;
    if (!actor) return;
    for (const app of Object.values(ui.windows ?? {})) {
      if (app instanceof CardRPGTray && app.actor?.id === actor.id) app.render();
    }
  };

  Hooks.on("updateActor", refresh);
  Hooks.on("createItem", refresh);
  Hooks.on("updateItem", refresh);
  Hooks.on("deleteItem", refresh);

  // A card moving between piles is the commonest reason the tray is stale.
  for (const hook of ["createCard", "updateCard", "deleteCard", "updateCards"]) {
    Hooks.on(hook, () => {
      for (const app of Object.values(ui.windows ?? {})) {
        if (app instanceof CardRPGTray) app.render();
      }
    });
  }
}
