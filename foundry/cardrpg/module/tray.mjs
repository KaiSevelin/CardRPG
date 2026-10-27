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
    /** Collapsed to the status bar. Skills are consulted, not played from, so out of combat the
     *  HUD is usually in the way until you want it. */
    this.collapsed = false;
    /** Which pile is open, if any. @type {string|null} */
    this.openPile = null;
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
      toggleCollapse: CardRPGTray.#onToggleCollapse,
      dealHand: CardRPGTray.#onDealHand,
      // A face-down pile is not openable; the click is absorbed rather than erroring.
      none: () => {},
      openPile: CardRPGTray.#onOpenPile,
      closeViewer: CardRPGTray.#onCloseViewer,
      peek: CardRPGTray.#onPeek,
      reveal: CardRPGTray.#onReveal
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
      piles: this.#piles(combat),
      viewer: this.#viewer(combat),

      collapsed: this.collapsed,
      // Out of combat the centre panel becomes the skill deck, which is a later slice.
      centreLabel: myCombatant ? "Actions" : "Skills",
      skillsPlaceholder: !myCombatant,

      inCombat: !!myCombatant,
      myTurn: combat?.combatant?.actor?.id === actor.id,
      turnOwner: combat?.combatant?.name ?? "",
      targets: [...(game.user.targets ?? [])].map(t => t.name).join(", "),
      drawPct: Math.round(100 * (counts.draw ?? 0) / deckTotal)
    });
  }

  /* -------------------------------------------- */

  /**
   * The decks, as backs with a count.
   *
   * Openable or not is a rules question, not a UI one: a face-up pile can be looked through, a
   * shuffled face-down one cannot. Your own draw pile staying shut is the whole reason the deck is
   * a stamina clock rather than a menu.
   */
  #piles(combat) {
    const counts = this.actor.system.deckCounts ?? {};
    const dealt = this.dealtAt === CardRPGTray.#turnKey(combat);

    const piles = [
      {
        id: "action", label: "Action deck", count: counts.draw ?? 0,
        action: "dealHand", spent: dealt,
        tip: dealt
          ? "Already dealt this turn. You draw again next turn."
          : "Deal a hand, up to your hand size."
      },
      {
        id: "actionDiscard", label: "Discard", count: counts.discard ?? 0,
        action: "openPile", tip: "Face up. Catch Breath recovers half of it, at random."
      },
      {
        id: "actionSpent", label: "Spent", count: counts.spent ?? 0,
        action: "openPile", tip: "Out until a rest."
      },
      {
        id: "fate", label: "Fate", count: counts.fate ?? 0,
        action: "none", tip: "Shuffled and face down. Miss and Critical each reshuffle it."
      },
      {
        id: "fateDiscard", label: "Fate discard", count: counts.fateDiscard ?? 0,
        action: "openPile",
        tip: "Face up, which is what makes counting possible."
      }
    ];

    // One intent pile per NPC type in the fight, face down until the first of its type acts.
    for (const npc of this.#npcDecks(combat)) {
      piles.push({
        id: `intent:${npc.kind}`, label: `${npc.kind} intent`, count: npc.revealed ? 1 : "?",
        action: npc.revealed || game.user.isGM ? "openPile" : "none",
        tip: npc.revealed
          ? `Revealed: ${npc.card}`
          : "Face down until the first of its type acts. Foresee flips it."
      });
    }

    return piles.map(p => ({ ...p, open: this.openPile === p.id }));
  }

  /** The contents of whichever pile is open. */
  #viewer(combat) {
    if (!this.openPile) return null;

    if (this.openPile.startsWith("intent:")) {
      const kind = this.openPile.slice(7);
      const info = this.#npcIntent(kind);
      const card = info?.card;
      return {
        label: `${kind} intent`,
        count: card ? 1 : 0,
        cards: card ? [{ name: cardName(card), detail: CardRPGTray.#sequenceText(card) }] : []
      };
    }

    const stack = deckOf(this.actor, this.openPile);
    const labels = {
      actionDiscard: "Discard", actionSpent: "Spent", fateDiscard: "Fate discard"
    };
    const cards = (stack?.cards.contents ?? []).map(c => ({
      name: cardName(c),
      harm: c.type === "wound" || c.type === "taint",
      detail: CardRPGTray.#cardDetail(c)
    }));
    return { label: labels[this.openPile] ?? this.openPile, count: cards.length, cards };
  }

  static #sequenceText(card) {
    return (card.system.sequence ?? [])
      .map((s, i) => `${i + 1}. ${s.verb ?? ""}${s.param ? ` ${s.param}` : ""}${s.text ? ` (${s.text})` : ""}`)
      .join("  ");
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

  /** The face-up fate discard, which is what makes counting possible. */
  #fateInfo() {
    const discard = deckOf(this.actor, "fateDiscard");
    const cards = discard?.cards.contents ?? [];
    const label = c => c.system.special === "miss" ? "Miss"
      : c.system.special === "crit" ? "Crit"
        : (c.system.value > 0 ? `+${c.system.value}` : String(c.system.value));
    return {
      lastFate: cards.length ? label(cards.at(-1)) : null,
      fateDiscard: cards.slice(-14).map(c => ({ label: label(c), special: !!c.system.special }))
    };
  }

  /** One intent card per NPC type in the fight, face down until the first of its type acts. */
  #npcDecks(combat) {
    if (!combat) return [];
    const seen = new Map();
    for (const combatant of combat.combatants) {
      const npc = combatant.actor;
      if (npc?.type !== "npc") continue;
      const kind = npc.system.kind || npc.name;
      if (seen.has(kind)) continue;

      const intent = deckOf(npc, "intent");
      const deck = deckOf(npc, "action");
      const card = intent?.cards.contents[0];
      seen.set(kind, {
        kind,
        revealed: !!intent?.getFlag("cardrpg", "revealed"),
        card: card ? cardName(card) : "—",
        deck: deck?.cards.size ?? 0
      });
    }
    return [...seen.values()];
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
          // Show the best equipped option, so the face is never a bare verb.
          const item = this.#itemsFor(step.verb)[0];
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

  /** Every equipped item that can serve a verb, best first. */
  #itemsFor(verb) {
    return this.actor.items
      .filter(i => i.type === "item" && i.system.equipped
        && (i.system.verbs?.[verb]?.value !== null || i.system.verbs?.[verb]?.text))
      .sort((a, b) => (b.system.verbs[verb].value ?? 0) - (a.system.verbs[verb].value ?? 0));
  }

  /** Ask which item, when more than one qualifies. Choosing a weapon is a real decision. */
  static async #chooseItem(items, verb) {
    if (!items.length) return null;
    if (items.length === 1) return items[0];
    const chosen = await DialogV2.wait({
      window: { title: `Which item for ${verb}?` },
      content: `<p>More than one equipped item can ${verb}.</p>`,
      buttons: items.map(i => {
        const line = i.system.verbs[verb];
        const detail = line.value !== null ? ` (${line.value}${line.range ? `, range ${line.range}` : ""})` : "";
        return { action: i.id, label: `${i.name}${detail}` };
      })
    }).catch(() => null);
    return items.find(i => i.id === chosen) ?? null;
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

  static #onToggleCollapse() {
    this.collapsed = !this.collapsed;
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
        const item = await CardRPGTray.#chooseItem(this.#itemsFor(step.verb), step.verb);
        if (!item) return ui.notifications.warn(`Nothing equipped can ${step.verb}.`);
        await resolveAttack(actor, { verb: step.verb, item, mod: step.mod ?? 0, targets, step });
        return;
      }

      case "defend": {
        const item = await CardRPGTray.#chooseItem(this.#itemsFor("defend"), "defend");
        if (!item) return ui.notifications.warn("Nothing equipped can defend.");
        await resolveDefend(actor, { item, half });
        return;
      }

      case "heal":
        await resolveHeal(actor, { amount: step.param ?? 0 });
        return;

      case "use": {
        const item = await CardRPGTray.#chooseItem(this.#itemsFor("use"), "use");
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

  static async #onPeek(event, target) {
    const info = this.#npcIntent(target.dataset.kind);
    if (info?.card) ui.notifications.info(`${target.dataset.kind} intent: ${cardName(info.card)}`);
  }

  static async #onReveal(event, target) {
    const { revealIntent } = await import("./combat.mjs");
    const info = this.#npcIntent(target.dataset.kind);
    if (info?.actor) await revealIntent(info.actor);
    this.render();
  }

  #npcIntent(kind) {
    const combatant = game.combat?.combatants.find(c =>
      c.actor?.type === "npc" && (c.actor.system.kind || c.actor.name) === kind);
    const actor = combatant?.actor;
    if (!actor) return null;
    return { actor, card: deckOf(actor, "intent")?.cards.contents[0] ?? null };
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
