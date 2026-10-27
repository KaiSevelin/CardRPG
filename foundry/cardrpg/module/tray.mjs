/**
 * The combat HUD.
 *
 * A sheet is something you open, consult and close. That is wrong for this game's core loop, where
 * every turn means picking two halves from five cards whose legality depends on your conditions,
 * your equipped items and which card you already used. So this is a wide panel along the bottom:
 *
 *   left   -- Items, Features, Conditions
 *   centre -- Actions in combat; Skills out of it (that deck is a later slice)
 *   right  -- Fate, and the NPC intent decks
 *
 * Staging order is play order: halves resolve in the order you clicked them, which is how the
 * rules' "either order" is expressed without a separate sequencing step.
 */

import { CARDRPG } from "./config.mjs";
import { deckOf, discardCards, catchBreath, refill, cardName } from "./decks.mjs";
import { resolveAttack, resolveDefend, resolveHeal, resolveUse, collectBonuses } from "./resolve.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

/* -------------------------------------------- */

export class CardRPGTray extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    /** Staged halves, in click order. @type {{cardId: string, half: string}[]} */
    this.staged = [];
    /**
     * Which equipped item serves which verb, chosen by the player.
     *
     * The card says the verb and the item says the value, so with two weapons in hand the card
     * face is ambiguous until this is set. Picking it on the item itself beats a dialog at play
     * time: you decide what you are fighting with before you swing, not during.
     *
     * @type {Record<string, string>}
     */
    this.activeItems = {};
    /** Which deck is open, if any. @type {string|null} */
    this.openPile = null;
    /** Slates currently turned over, showing value, weight and type. @type {Set<string>} */
    this.flipped = new Set();
    /** The round:turn a hand was last dealt, so the deck goes inert until the next turn. */
    this.dealtAt = null;
  }

  static DEFAULT_OPTIONS = {
    classes: ["cardrpg", "cr-hud-app"],
    // A HUD, not a window: no frame, no title bar, and positioned by CSS against the screen edges
    // rather than by drag coordinates. The panels sit over the canvas like Foundry's own controls.
    window: { frame: false, positioned: false },
    actions: {
      stage: CardRPGTray.#onStage,
      clear: CardRPGTray.#onClear,
      play: CardRPGTray.#onPlay,
      breathe: CardRPGTray.#onBreathe,
      refill: CardRPGTray.#onRefill,
      endTurn: CardRPGTray.#onEndTurn,
      equip: CardRPGTray.#onEquip,
      unequip: CardRPGTray.#onUnequip,
      toggleDrain: CardRPGTray.#onToggleDrain,
      setActive: CardRPGTray.#onSetActive,
      dealHand: CardRPGTray.#onDealHand,
      // A face-down pile is not openable; the click is absorbed rather than erroring.
      openPile: CardRPGTray.#onOpenPile,
      flipCard: CardRPGTray.#onFlipCard,
      closeViewer: CardRPGTray.#onCloseViewer,
    }
  };

  static PARTS = {
    main: { template: "systems/cardrpg/templates/tray.hbs" }
  };

  static #open = new Map();

  static openFor(actor) {
    if (!actor || actor.type !== "character") {
      if (actor) ui.notifications.warn("The HUD is for characters; NPCs are run from their sheet.");
      return null;
    }
    // One HUD at a time: it covers the screen edges, so two would fight for the same space.
    for (const other of CardRPGTray.openTrays) {
      if (other.actor?.id !== actor.id) other.close();
    }
    let tray = CardRPGTray.#open.get(actor.id);
    if (!tray) {
      tray = new CardRPGTray(actor);
      CardRPGTray.#open.set(actor.id, tray);
    }
    tray.render({ force: true });
    return tray;
  }

  /** Every open HUD, from the ApplicationV2 registry (ui.windows holds only V1 windows). */
  static get openTrays() {
    const instances = foundry.applications?.instances;
    return instances ? [...instances.values()].filter(a => a instanceof CardRPGTray) : [];
  }

  /**
   * Open the HUD for whoever this user is playing.
   *
   * A GM running a solo playtest owns every actor, so "pick the one you own" is no help. Prefer the
   * assigned character, then a selected token, then — for a GM — the only player character in the
   * fight, which is the usual playtest shape.
   */
  static autoOpen(combat) {
    if (!combat) return;
    const inCombat = id => combat.combatants.some(c => c.actor?.id === id);

    const assigned = game.user.character;
    if (assigned?.type === "character" && inCombat(assigned.id)) return CardRPGTray.openFor(assigned);

    const selected = canvas?.tokens?.controlled?.[0]?.actor;
    if (selected?.type === "character" && inCombat(selected.id)) return CardRPGTray.openFor(selected);

    const characters = combat.combatants
      .map(c => c.actor)
      .filter(a => a?.type === "character" && (game.user.isGM || a.isOwner));
    const unique = [...new Map(characters.map(a => [a.id, a])).values()];
    if (unique.length === 1) CardRPGTray.openFor(unique[0]);
  }

  get title() {
    return `${this.actor.name} — HUD`;
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

    const active = (system.activeConditions ?? []);
    const dazed = active.some(c => c.key === "dazed");
    const encumbered = active.find(c => c.key === "burdened" || c.key === "overloaded");

    const combat = game.combat;
    const myCombatant = combat?.combatants.find(c => c.actor?.id === actor.id);
    const counts = system.deckCounts ?? {};
    const deckTotal = Math.max(1, (counts.draw ?? 0) + (counts.discard ?? 0) + (counts.hand ?? 0));

    const slates = actor.items.filter(i => i.type === "item");
    const describeItem = i => ({
      id: i.id,
      name: i.name,
      group: i.system.group || "",
      weight: i.system.weight,
      lines: Object.entries(i.system.verbs ?? {})
        .filter(([, l]) => l.value !== null)
        .map(([v, l]) => `${v} ${l.value}${l.range ? `/r${l.range}` : ""}`)
        .join(" · ") || (i.system.armor ? `armor ${i.system.armor}` : "")
    });

    return Object.assign(context, {
      actor,
      system,
      config: CARDRPG,
      isGM: game.user.isGM,

      cards: (hand?.cards.contents ?? []).map(card => this.#renderCard(card, blocked, dazed)),
      staged: this.staged.map((s, i) => ({
        ...s, order: i + 1, name: cardName(hand?.cards.get(s.cardId))
      })),
      canPlay: this.staged.length > 0,

      dazed,
      stunned: active.some(c => c.key === "stunned"),
      exhausted: system.exhausted,
      encumbered: encumbered
        ? game.i18n.localize(CARDRPG.conditions[encumbered.key].label)
        : null,

      conditions: active.map(c => ({
        ...c,
        label: game.i18n.localize(CARDRPG.conditions[c.key]?.label ?? c.key),
        icon: CARDRPG.conditions[c.key]?.icon,
        creator: c.creatorId ? game.actors.get(c.creatorId)?.name ?? null : null
      })),

      equipped: slates.filter(i => i.system.equipped).map(describeItem),
      pack: slates.filter(i => !i.system.equipped).map(describeItem),

      features: actor.items.filter(i => i.type === "feature").map(f => ({
        id: f.id,
        name: f.name,
        text: f.system.text,
        group: f.system.group || "",
        drained: f.system.drained,
        recharge: f.system.rechargeLabel,
        rechargeIcon: CARDRPG.effects.charging.icon
      })),

      counts,
      fatePct: Math.round(100 * (counts.fate ?? 0) / 20),
      fateSwing: counts.fate ? Math.min(100, Math.round(200 / counts.fate)) : null,
      leftDecks: this.#leftDecks(),
      actionDeck: this.#actionDeck(combat),
      rightDecks: this.#rightDecks(),
      viewer: this.#viewer(),

      inCombat: !!myCombatant,
      myTurn: combat?.combatant?.actor?.id === actor.id,
      turnOwner: combat?.combatant?.name ?? "",
      targets: [...(game.user.targets ?? [])].map(t => t.name).join(", "),
      drawPct: Math.round(100 * (counts.draw ?? 0) / deckTotal)
    });
  }

  /* -------------------------------------------- */

  /**
   * The three decks stacked down the left: Items, Features, Conditions.
   *
   * Items and features are slates, not cards -- they are never shuffled or drawn. They are shown
   * as decks because they are the same printed size and a stack is how you hold them at a table.
   */
  #leftDecks() {
    const items = this.actor.items.filter(i => i.type === "item");
    const features = this.actor.items.filter(i => i.type === "feature");
    const conditions = this.actor.system.activeConditions ?? [];

    return [
      {
        id: "items", label: "Items", count: items.length,
        tip: "Your gear. Turn a card over for its value, weight and type."
      },
      {
        id: "features", label: "Features", count: features.length,
        tip: "Passive ones are simply true; an active one Drains when used."
      },
      {
        id: "conditions", label: "Conditions", count: conditions.length,
        tip: "What is on you. A duration ticks down on its creator's turn."
      }
    ].map(d => ({ ...d, open: this.openPile === d.id }));
  }

  /**
   * The action deck, in the bottom-left corner. Clicking it deals a hand; it then goes inert until
   * the next turn, because the hand refills once a round and dealing repeatedly would just be
   * drawing your deck away.
   */
  #actionDeck(combat) {
    const dealt = this.dealtAt === CardRPGTray.#turnKey(combat);
    return {
      label: "Action deck",
      count: this.actor.system.deckCounts?.draw ?? 0,
      spent: dealt,
      // The deck says what it will do next, under its name.
      state: dealt ? "cards dealt" : "draw",
      tip: dealt
        ? "Already dealt this turn. You draw again next turn."
        : "Deal a hand, up to your hand size."
    };
  }

  /**
   * Fate above, Discard below, in the bottom-right.
   *
   * The fate deck itself cannot be opened: it is shuffled and face down, and that is the whole
   * reason a thin deck is a risk rather than a lookup. Its discard is face up, which is what makes
   * counting possible.
   */
  #rightDecks() {
    const counts = this.actor.system.deckCounts ?? {};
    const swing = counts.fate ? Math.min(100, Math.round(200 / counts.fate)) : null;
    return [
      {
        id: "fateDiscard", label: "Fate", count: counts.fate ?? 0, action: "openPile",
        tip: `Face down. ${counts.fateDiscard ?? 0} drawn`
          + (swing ? `, ${swing}% chance the next is a swing` : "")
          + ". Click to look through the discard."
      },
      {
        id: "actionDiscard", label: "Discard", count: counts.discard ?? 0, action: "openPile",
        tip: `Face up. ${counts.spent ?? 0} Spent as well; Catch Breath recovers half of this, at random.`
      }
    ].map(d => ({ ...d, open: this.openPile === d.id }));
  }

  /** Whichever deck is open, spread as a vertical hand beside it. */
  #viewer() {
    if (!this.openPile) return null;
    const left = ["items", "features", "conditions"].includes(this.openPile);
    const flipped = id => this.flipped.has(id);

    if (this.openPile === "items") {
      const cards = this.actor.items.filter(i => i.type === "item").map(i => ({
        id: i.id,
        name: i.name,
        group: i.system.group || "",
        flippable: true,
        flipped: flipped(i.id),
        blurb: i.system.blurb,
        lines: Object.entries(i.system.verbs ?? {})
          .filter(([, l]) => l.value !== null || l.text)
          .map(([v, l]) => `${v} ${l.value ?? ""}${l.range ? ` · range ${l.range}` : ""}`
            + `${l.area ? ` · ${l.areaKind || "blast"} ${l.area}` : ""}`)
          .concat(i.system.armor ? [`armor ${i.system.armor}`] : []),
        note: [...(i.system.tags ?? [])].join(", "),
        facts: [
          { label: "Value", value: `${i.system.value} g` },
          { label: "Weight", value: `${i.system.weight} kg` },
          { label: "Type", value: i.system.kind || "\u2014" },
          { label: "Slot", value: i.system.slot }
        ],
        buttons: [
          {
            action: i.system.equipped ? "unequip" : "equip",
            label: i.system.equipped ? "Unequip" : "Equip",
            verb: "",
            active: false
          },
          // One button per verb this item can serve, so the choice is made on the item.
          ...(i.system.equipped
            ? Object.entries(i.system.verbs ?? {})
              .filter(([, l]) => l.value !== null || l.text)
              .map(([v]) => ({
                action: "setActive",
                verb: v,
                label: v,
                active: this.#itemFor(v)?.id === i.id
              }))
            : [])
        ]
      }));
      return { label: "Items", side: "left", count: `${cards.length} slates`, cards };
    }

    if (this.openPile === "features") {
      const cards = this.actor.items.filter(i => i.type === "feature").map(f => ({
        id: f.id,
        name: f.name,
        group: f.system.group || "",
        flipped: false,
        lines: [f.system.text].filter(Boolean),
        note: f.system.rechargeLabel
          ? `Recharges: ${f.system.rechargeLabel}${f.system.drained ? " — Drained" : ""}`
          : "Passive",
        buttons: f.system.isActive
          ? [{
            action: "toggleDrain",
            label: f.system.drained ? "Restore" : "Use",
            verb: "",
            active: f.system.drained
          }]
          : []
      }));
      return { label: "Features", side: "left", count: `${cards.length} slates`, cards };
    }

    if (this.openPile === "conditions") {
      const cards = (this.actor.system.activeConditions ?? []).map((c, index) => {
        const cfg = CARDRPG.conditions[c.key] ?? {};
        const creator = c.creatorId ? game.actors.get(c.creatorId)?.name : null;
        return {
          id: `condition-${index}`,
          name: game.i18n.localize(cfg.label ?? c.key),
          icon: cfg.icon,
          harm: true,
          flipped: false,
          lines: [c.duration ? `Duration ${c.duration}` : "No duration"],
          note: creator
            ? `Ticks down at the start of ${creator}'s turn`
            : (cfg.derived ? "From carried weight" : "Ticks on your own turn")
        };
      });
      return { label: "Conditions", side: "left", count: `${cards.length}`, cards };
    }

    const stack = deckOf(this.actor, this.openPile);
    const labels = { actionDiscard: "Discard", fateDiscard: "Fate discard" };
    const cards = (stack?.cards.contents ?? []).map(c => ({
      id: c.id,
      name: cardName(c),
      harm: c.type === "wound" || c.type === "taint",
      flipped: false,
      lines: [CardRPGTray.#cardDetail(c)]
    }));
    return {
      label: labels[this.openPile] ?? this.openPile,
      side: left ? "left" : "right",
      count: `${cards.length}`,
      cards
    };
  }

  static #cardDetail(card) {
    if (card.type === "fate") {
      return card.system.special === "miss" ? "Miss — the action does nothing, then reshuffle"
        : card.system.special === "crit" ? "Critical — double the value, then reshuffle"
          : `${card.system.value > 0 ? "+" : ""}${card.system.value}`;
    }
    if (card.type === "wound") return "Dead card. Discard at the end of your turn.";
    if (card.type === "taint") return "1 damage when drawn, ignoring armor.";
    const half = (name, steps) => (steps ?? [])
      .map(s => `${s.verb ?? ""}${s.param ? ` ${s.param}` : ""}${s.mod ? ` ${s.mod > 0 ? "+" : ""}${s.mod}` : ""}`)
      .join(", ");
    return `${half("p", card.system.primary)} / ${half("s", card.system.secondary)}`;
  }

  /** Round and turn, so the action deck can go inert until the next turn. */
  static #turnKey(combat) {
    return combat ? `${combat.round}:${combat.turn}` : "no-combat";
  }

  /**
   * Fold resolution steps 1-3 into the face: item base, card modifier, features. Steps 4-6 need a
   * target, so they wait until the half is played.
   */
  #renderCard(card, blockedIcons, dazed) {
    const half = (name, steps) => {
      const icons = [];
      const bits = [];

      for (const step of steps ?? []) {
        const icon = CARDRPG.verbs[step.verb]?.icon ?? CARDRPG.effects[step.verb]?.icon ?? null;
        if (icon) icons.push(icon);

        let text = step.verb
          ? game.i18n.localize(CARDRPG.verbs[step.verb]?.label ?? CARDRPG.effects[step.verb]?.label ?? step.verb)
          : "";

        if (step.verb === "strike" || step.verb === "cast") {
          // The face shows the item the player chose, so "Strike 4" is never a guess.
          const item = this.#itemFor(step.verb);
          const base = item?.system.verbs?.[step.verb]?.value;
          if (base !== null && base !== undefined) {
            text += ` ${base + (step.mod ?? 0) + collectBonuses(this.actor, step.verb, item).total}`;
          } else if (step.mod) text += ` ${step.mod > 0 ? "+" : ""}${step.mod}`;
        } else if (step.param !== null && step.param !== undefined) text += ` ${step.param}`;
        else if (step.mod !== null && step.mod !== undefined) {
          text += ` ${step.mod > 0 ? "+" : ""}${step.mod}`;
        }

        if (step.text) text += ` (${step.text})`;
        bits.push(text.trim());
      }

      return {
        name,
        text: bits.join(", ") || "—",
        icon: CARDRPG.halfIcons[name],
        blocked: icons.some(i => blockedIcons.has(i)) || (name === "secondary" && dazed),
        staged: this.staged.some(s => s.cardId === card.id && s.half === name)
      };
    };

    if (card.type === "wound" || card.type === "taint") {
      return { id: card.id, name: cardName(card), harm: true, halves: [] };
    }
    return {
      id: card.id,
      name: cardName(card),
      harm: false,
      halves: [half("primary", card.system.primary), half("secondary", card.system.secondary)],
      reaction: card.system.reaction
        ? game.i18n.localize(CARDRPG.reactions[card.system.reaction]?.label ?? card.system.reaction)
        : null
    };
  }

  /**
   * The item a verb will actually use: whatever the player picked, or the best one if they have
   * not picked. Never a silent guess between two weapons without saying which.
   */
  #itemFor(verb) {
    const candidates = this.#itemsFor(verb);
    const chosen = candidates.find(i => i.id === this.activeItems[verb]);
    return chosen ?? candidates[0] ?? null;
  }

  /** Every equipped item that can serve a verb, best first. */
  #itemsFor(verb) {
    return this.actor.items
      .filter(i => i.type === "item" && i.system.equipped
        && (i.system.verbs?.[verb]?.value !== null || i.system.verbs?.[verb]?.text))
      .sort((a, b) => (b.system.verbs[verb].value ?? 0) - (a.system.verbs[verb].value ?? 0));
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static async #onStage(event, target) {
    const { cardId, half } = target.dataset;
    const already = this.staged.findIndex(s => s.cardId === cardId && s.half === half);
    if (already >= 0) {
      this.staged.splice(already, 1);
      return this.render();
    }
    if (this.staged.some(s => s.half === half)) {
      return ui.notifications.warn(`You already have a ${half} staged.`);
    }
    if (this.staged.some(s => s.cardId === cardId)) {
      return ui.notifications.warn("Both halves must come from different cards.");
    }
    if (this.staged.length && this.actor.system.exhausted) {
      return ui.notifications.warn("Exhausted: one card per turn.");
    }
    this.staged.push({ cardId, half });
    this.render();
  }

  /** Choose which equipped item a verb uses. */
  static #onSetActive(event, target) {
    const { slateId, verb } = target.dataset;
    this.activeItems[verb] = this.activeItems[verb] === slateId ? null : slateId;
    this.render();
  }

  /**
   * Clicking the action deck deals a hand, then the deck goes inert until the next turn -- the
   * hand refills once a round, so dealing repeatedly would just be drawing your deck away.
   */
  static async #onDealHand() {
    const key = CardRPGTray.#turnKey(game.combat);
    if (this.dealtAt === key) {
      return ui.notifications.info("Already dealt this turn. You draw again next turn.");
    }
    const { drawn, taint } = await refill(this.actor);
    this.dealtAt = key;
    if (!drawn && !taint) ui.notifications.warn("Draw pile is empty. Catch Breath to recover some.");
    this.render();
  }

  /** Clicking an open pile shuts it again. */
  static #onOpenPile(event, target) {
    const id = target.dataset.pile;
    this.openPile = this.openPile === id ? null : id;
    this.render();
  }

  static #onCloseViewer() {
    this.openPile = null;
    this.render();
  }

  /** Turn a slate over. The back is where value, weight and type live, never the front. */
  static #onFlipCard(event, target) {
    const id = target.dataset.cardId;
    this.flipped.has(id) ? this.flipped.delete(id) : this.flipped.add(id);
    this.render();
  }

  static #onClear() {
    this.staged = [];
    this.render();
  }

  static async #onPlay() {
    if (!this.staged.length) return;
    const hand = deckOf(this.actor, "actionHand");
    const targets = [...(game.user.targets ?? [])].map(t => t.actor).filter(a => a);

    for (const { cardId, half } of this.staged) {
      const card = hand?.cards.get(cardId);
      if (!card) continue;
      for (const step of card.system[half] ?? []) await this.#resolveStep(step, half, targets);
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
        if (!targets.length) return ui.notifications.warn("Target a token first.");
        const item = this.#itemFor(step.verb);
        if (!item) return ui.notifications.warn(`Nothing equipped can ${step.verb}.`);
        await resolveAttack(actor, { verb: step.verb, item, mod: step.mod ?? 0, targets, step });
        return;
      }

      case "defend": {
        const item = this.#itemFor("defend");
        if (!item) return ui.notifications.warn("Nothing equipped can defend.");
        await resolveDefend(actor, { item, half });
        return;
      }

      case "heal":
        await resolveHeal(actor, { amount: step.param ?? 0 });
        return;

      case "use": {
        const item = this.#itemFor("use");
        if (!item) return ui.notifications.warn("No usable item equipped. Equip a potion first.");
        await resolveUse(actor, { item, target: targets[0] ?? actor });
        return;
      }

      // Ready: equip or swap one item from the pack. This is the whole point of the verb, so it
      // opens the pack rather than being narrated.
      case "ready": {
        const pack = actor.items.filter(i => i.type === "item" && !i.system.equipped);
        if (!pack.length) return ui.notifications.warn("Nothing in the pack to ready.");
        const chosen = await DialogV2.wait({
          window: { title: "Ready an item" },
          content: `<p>Equip one item from your pack.</p>`,
          buttons: pack.map(i => ({ action: i.id, label: `${i.name} (${i.system.slot})` }))
        }).catch(() => null);
        const item = pack.find(i => i.id === chosen);
        if (item) await CardRPGTray.#equipItem(actor, item);
        return;
      }

      default:
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div class="cardrpg"><p><strong>${actor.name}</strong>: `
            + `${step.verb ?? ""}${step.param ? ` ${step.param}` : ""}`
            + `${step.text ? ` — ${step.text}` : ""}</p></div>`
        });
    }
  }

  /* -------------------------------------------- */

  /** Equip, respecting slot capacity. A two-handed item fills both hand slots. */
  static async #equipItem(actor, item) {
    const slot = item.system.slot;
    const capacity = CARDRPG.slots[slot]?.capacity;
    if (capacity !== null && capacity !== undefined) {
      const used = actor.items
        .filter(i => i.type === "item" && i.system.equipped && i.system.slot === slot)
        .reduce((n, i) => n + (i.system.isTwoHanded ? 2 : 1), 0);
      const needs = item.system.hands === 2 && slot === "hands" ? 2 : 1;
      if (used + needs > capacity) {
        return ui.notifications.warn(
          `No room: ${slot} holds ${capacity}. Unequip something first.`);
      }
    }
    await item.update({ "system.equipped": true });
  }

  static async #onEquip(event, target) {
    const item = this.actor.items.get(target.dataset.slateId);
    if (item) await CardRPGTray.#equipItem(this.actor, item);
  }

  static async #onUnequip(event, target) {
    await this.actor.items.get(target.dataset.slateId)?.update({ "system.equipped": false });
  }

  static async #onToggleDrain(event, target) {
    const slate = this.actor.items.get(target.dataset.slateId);
    if (!slate?.system.isActive) return;
    const drained = !slate.system.drained;
    await slate.update({
      "system.drained": drained,
      "system.drainedFor": drained ? (slate.system.active.turns ?? null) : null
    });
    if (drained) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> uses `
          + `<em>${slate.name}</em>: ${slate.system.active.text}</p></div>`
      });
    }
  }

  static async #onEndTurn() {
    if (!game.combat) return ui.notifications.warn("No combat running.");
    await game.combat.nextTurn();
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

/**
 * Keep every open HUD in step with the documents behind it.
 *
 * Open ApplicationV2 windows live in `foundry.applications.instances`; `ui.windows` holds only
 * ApplicationV1 windows, so looking there finds nothing.
 */
export function registerTrayHooks() {
  const refreshFor = doc => {
    const actor = doc instanceof Actor ? doc : doc.parent;
    if (!actor) return;
    for (const tray of CardRPGTray.openTrays) if (tray.actor?.id === actor.id) tray.render();
  };
  const refreshAll = () => {
    for (const tray of CardRPGTray.openTrays) tray.render();
  };

  Hooks.on("updateActor", refreshFor);
  Hooks.on("createItem", refreshFor);
  Hooks.on("updateItem", refreshFor);
  Hooks.on("deleteItem", refreshFor);

  // A card doesn't say whose it is, and neither does a combat change, so refresh everything.
  for (const hook of ["createCard", "updateCard", "deleteCard", "createCards", "updateCards",
    "deleteCards", "updateCombat", "deleteCombat"]) {
    Hooks.on(hook, refreshAll);
  }

  Hooks.on("combatStart", combat => CardRPGTray.autoOpen(combat));
  Hooks.on("combatTurn", combat => CardRPGTray.autoOpen(combat));
  Hooks.on("combatRound", combat => CardRPGTray.autoOpen(combat));
}
