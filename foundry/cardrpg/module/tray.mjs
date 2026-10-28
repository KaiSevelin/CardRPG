/**
 * The combat HUD.
 *
 * A sheet is something you open, consult and close. That is wrong for this game's core loop, where
 * every turn means picking two halves from five cards whose legality depends on your conditions,
 * your equipped items and which card you already used. So this is a wide panel along the bottom:
 *
 *   left   -- Items, Features, Conditions
 *   centre -- Actions in combat; Skills out of it (that deck is a later slice)
 *   right  -- the play area, then Fate and Discard
 *
 * The play area holds two stacks of overlapping cards, primary then secondary: the action card at
 * the base and everything modifying it laid on top. A card in play is in a stack and nowhere else.
 *
 * Staging order is play order: halves resolve in the order you clicked them, which is how the
 * rules' "either order" is expressed without a separate sequencing step.
 */

import { CARDRPG } from "./config.mjs";
import { deckOf, discardCards, catchBreath, refill, cardName } from "./decks.mjs";
import { resolveAttack, resolveDefend, resolveHeal, resolveUse, collectBonuses } from "./resolve.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/* -------------------------------------------- */

export class CardRPGTray extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    /** Staged halves, in click order. @type {{cardId: string, half: string}[]} */
    this.staged = [];
    /**
     * Which half each played item is serving: "primary" or "secondary".
     *
     * A card says the verb and the item says the value, so a longsword that both strikes and
     * defends is ambiguous once both halves are staged. The answer is read off the play area: the
     * stack a slate sits in *is* the half it serves. An item with one verb has nothing to choose
     * and never appears here.
     *
     * @type {Map<string, string>}
     */
    this.roles = new Map();
    /**
     * Which card each stack is turned to, as an offset rather than an index, so the carousel can
     * keep counting past either end of a stack whose length changes under it.
     *
     * @type {{primary: number, secondary: number}}
     */
    this.tops = { primary: 0, secondary: 0 };

    /**
     * Slates put into play under pressure and not yet paid for, by id.
     *
     * Outside combat equipping is free. Inside one it costs a Ready, which is the whole reason the
     * verb exists (core-rules 4) -- but the cost is settled when the turn is played, along with
     * every other verb, rather than gating the click that arranges the stack. So this is a debt:
     * it is cleared by a Play that carries enough Ready halves, or by putting the slate back.
     *
     * @type {Set<string>}
     */
    this.pendingEquips = new Set();
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
      endTurn: CardRPGTray.#onEndTurn,
      playSlate: CardRPGTray.#onPlaySlate,
      shiftStack: CardRPGTray.#onShiftStack,
      unstack: CardRPGTray.#onUnstack,
      moveHalf: CardRPGTray.#onMoveHalf,
      dealHand: CardRPGTray.#onDealHand,
      // A face-down pile is not openable; the click is absorbed rather than erroring.
      openPile: CardRPGTray.#onOpenPile,
      flipCard: CardRPGTray.#onFlipCard,
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
      playArea: this.#playArea(),
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
   * The play area: two stacks of overlapping cards above the Fate deck.
   *
   * A stack is one action and everything modifying it -- the card half staged at its base, then the
   * slates assigned to that half. Primary on the left, secondary on the right, so where a card sits
   * *is* what it is doing; there is no stamp to read and no order to remember. A stack stands
   * without an action card too, because gear is equipped long before a hand is dealt.
   *
   * Only the front card reads in full; the rest show their names above it. The carousel turns the
   * stack over rather than taking it apart.
   */
  #playArea() {
    const system = this.actor.system;
    const blocked = system.blockedIcons ?? new Set();
    const dazed = (system.activeConditions ?? []).some(c => c.key === "dazed");

    return ["primary", "secondary"].map(half => {
      const cards = [];

      const entry = this.staged.find(s => s.half === half);
      const base = entry ? this.#actionCard(entry, half, blocked, dazed) : null;
      if (base) cards.push(base);

      for (const slate of this.#assigned(half)) {
        const card = slate.type === "feature"
          ? this.#featureCard(slate, true)
          : this.#itemCard(slate, true);
        // Only a slate with a half to choose can be moved; the rest serve whatever needs them.
        const movable = slate.type === "item" && slate.system.availableVerbs.length > 1;
        cards.push(Object.assign(card, {
          // An arrow that points, not one that swaps: the rules already spend ⇄ on Ready.
          moveTo: movable ? (half === "primary" ? "secondary" : "primary") : null,
          moveArrow: half === "primary" ? "→" : "←",
          tip: `Modifying the ${half} action. Click to take it out of play.`
        }));
      }

      // Rotate so the card the carousel landed on is drawn last, which puts it in front.
      const n = cards.length;
      const top = n ? ((this.tops[half] % n) + n) % n : 0;
      return {
        half,
        label: half === "primary" ? "Primary" : "Secondary",
        count: n,
        // How far the stack reaches, in cards, so the CSS can give it a height.
        span: Math.max(1, n),
        cards: cards.map((_, k) => cards[(top + 1 + k) % n]),
        carousel: n > 1
      };
    });
  }

  /**
   * The slates assigned to a half.
   *
   * An item that could modify more than one action sits in the stack it was put in. One with a
   * single verb had nothing to choose, and a Drained feature has no half at all, so both ride with
   * the primary -- where they can still be seen and taken back out.
   */
  #assigned(half) {
    const items = this.actor.items.filter(i =>
      i.type === "item" && i.system.equipped && this.#stackOf(i) === half);
    const features = half === "primary"
      ? this.actor.items.filter(f => f.type === "feature" && f.system.isActive && f.system.drained)
      : [];
    return [...items, ...features];
  }

  /** Which stack a played item is shown in. Resolution uses #itemFor, which is subtler than this. */
  #stackOf(item) {
    if (item.system.availableVerbs.length < 2) return "primary";
    return this.roles.get(item.id) ?? "primary";
  }

  /** The staged half, as the card at the base of its stack. */
  #actionCard(entry, half, blocked, dazed) {
    const card = deckOf(this.actor, "actionHand")?.cards.get(entry.cardId);
    if (!card) return null;
    const face = this.#renderCard(card, blocked, dazed).halves.find(h => h.name === half);
    return {
      id: card.id,
      name: cardName(card),
      action: true,
      icon: face?.icon,
      lines: [face?.text ?? "—"],
      // Play order is still click order, so the base card says where it falls in the turn.
      note: `${half} half · step ${this.staged.findIndex(s => s.half === half) + 1}`,
      tip: "The action this stack builds. Click to take it back — the stack goes with it."
    };
  }

  /** One item, as a card. `played` means equipped. */
  #itemCard(i, played) {
    const verbs = Object.entries(i.system.verbs ?? {}).filter(([, l]) => l.value !== null || l.text);
    // Only a slate that could modify more than one action has a half to choose.
    const choosy = i.system.availableVerbs.length > 1;
    const serving = played
      ? verbs.filter(([v]) => ["primary", "secondary"].some(h => this.#itemFor(v, h)?.id === i.id))
        .map(([v]) => v)
      : [];
    return {
      id: i.id,
      name: i.name,
      group: i.system.group || "",
      flippable: true,
      flipped: this.flipped.has(i.id),
      played,
      tip: played
        ? "In play. Click to take it out."
        : choosy
          ? "Click to play it on the primary stack. You can move it to the secondary from there."
          : "Click to put it into play.",
      blurb: i.system.blurb,
      lines: verbs
        .map(([v, l]) => `${v} ${l.value ?? ""}${l.range ? ` \u00b7 range ${l.range}` : ""}`
          + `${l.area ? ` \u00b7 ${l.areaKind || "blast"} ${l.area}` : ""}`)
        .concat(i.system.armor ? [`armor ${i.system.armor}`] : []),
      // Which verbs this item is actually serving, so two weapons are never ambiguous.
      note: serving.length ? `in use for ${serving.join(", ")}` : [...(i.system.tags ?? [])].join(", "),
      facts: [
        { label: "Value", value: `${i.system.value} g` },
        { label: "Weight", value: `${i.system.weight} kg` },
        { label: "Type", value: i.system.kind || "\u2014" },
        { label: "Slot", value: i.system.slot }
      ]
    };
  }

  /** One feature, as a card. A passive feature is never playable: it is simply true. */
  #featureCard(f, played) {
    const passive = !f.system.isActive;
    return {
      id: f.id,
      name: f.name,
      group: f.system.group || "",
      played,
      passive,
      tip: passive ? "Passive: nothing to play."
        : played ? "Drained. Click to take it out of play."
          : "Click to use it. That Drains it until it recharges.",
      lines: [f.system.text].filter(Boolean),
      note: passive
        ? "Passive \u2014 always on"
        : `Recharges: ${f.system.rechargeLabel ?? "\u2014"}`
    };
  }

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

  /**
   * Whichever deck is open, spread beside it -- holding only what is NOT in play, since what is in
   * play is already on the scene.
   */
  #viewer() {
    if (!this.openPile) return null;

    if (this.openPile === "items") {
      const cards = this.actor.items
        .filter(i => i.type === "item" && !i.system.equipped)
        .map(i => this.#itemCard(i, false));
      return { label: "Items", count: `${cards.length}`, cards };
    }

    if (this.openPile === "features") {
      // Passive features show but cannot be picked up: there is nothing to decide about them.
      const cards = this.actor.items
        .filter(i => i.type === "feature" && !(i.system.isActive && i.system.drained))
        .map(f => this.#featureCard(f, false));
      return { label: "Features", count: `${cards.length}`, cards };
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
          passive: true,
          lines: [c.duration ? `Duration ${c.duration}` : "No duration"],
          note: creator
            ? `Ticks down on ${creator}'s turn`
            : (cfg.derived ? "From carried weight" : "Ticks on your own turn")
        };
      });
      return { label: "Conditions", count: `${cards.length}`, cards };
    }

    const stack = deckOf(this.actor, this.openPile);
    const labels = { actionDiscard: "Discard", fateDiscard: "Fate discard" };
    const cards = (stack?.cards.contents ?? []).map(c => ({
      id: c.id,
      name: cardName(c),
      harm: c.type === "wound" || c.type === "taint",
      flipped: false,
      // A discard is a record, not a slate: there is nothing to put into play.
      passive: true,
      lines: [CardRPGTray.#cardDetail(c)]
    }));
    return { label: labels[this.openPile] ?? this.openPile, count: `${cards.length}`, cards };
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
          const item = this.#itemFor(step.verb, name);
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
   * The item a verb will actually use on a given half.
   *
   * An item stamped for this half wins. Then one at "any" -- a slate with a single verb, which had
   * nothing to choose. Anything else in play is a last resort. So a longsword on the primary and a
   * shield on the secondary strike and defend respectively, with nothing to set beyond the clicks
   * that put them there.
   */
  #itemFor(verb, half = "primary") {
    const candidates = this.#itemsFor(verb);
    if (candidates.length < 2) return candidates[0] ?? null;
    const choosy = i => i.system.availableVerbs.length > 1;
    const rank = i => {
      const role = this.roles.get(i.id) ?? (choosy(i) ? "primary" : "any");
      return role === half ? 0 : role === "any" ? 1 : 2;
    };
    // #itemsFor already orders by value, and sort is stable, so equal ranks keep the better item.
    return [...candidates].sort((a, b) => rank(a) - rank(b))[0];
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

  /** Turn a slate over. The back is where value, weight and type live, never the front. */
  static #onFlipCard(event, target) {
    const id = target.dataset.cardId;
    this.flipped.has(id) ? this.flipped.delete(id) : this.flipped.add(id);
    this.render();
  }

  static #onClear() {
    this.staged = [];
    this.tops = { primary: 0, secondary: 0 };
    this.render();
  }

  static async #onPlay() {
    if (!this.staged.length) return;
    const hand = deckOf(this.actor, "actionHand");
    const targets = [...(game.user.targets ?? [])].map(t => t.actor).filter(a => a);

    if (!await this.#settleReady(hand)) return;

    for (const { cardId, half } of this.staged) {
      const card = hand?.cards.get(cardId);
      if (!card) continue;
      for (const step of card.system[half] ?? []) await this.#resolveStep(step, half, targets);
    }

    await discardCards(this.actor, this.staged.map(s => s.cardId));
    this.staged = [];
    this.tops = { primary: 0, secondary: 0 };
    this.render();
  }

  /**
   * Resolve Ready, for the whole turn at once, before any other step runs.
   *
   * Every other verb resolves when you play it. Ready used to be the exception: it had to be played
   * *before* the slate it pays for, so arranging the stacks ran backwards from everything else. Now
   * the arranging is free and the turn you play has to cover it -- one Ready per slate that went
   * into play under pressure.
   *
   * @returns {Promise<boolean>} false if the turn cannot pay, in which case nothing is resolved.
   */
  async #settleReady(hand) {
    // Out of combat equipping is free, so a debt carried out of a fight simply lapses.
    if (!game.combat?.started) {
      this.pendingEquips.clear();
      return true;
    }
    const owed = [...this.pendingEquips].map(id => this.actor.items.get(id)).filter(i => i);
    if (!owed.length) return true;

    const readies = this.staged.reduce((n, { cardId, half }) => n
      + (hand?.cards.get(cardId)?.system[half] ?? []).filter(s => s.verb === "ready").length, 0);
    const names = owed.map(i => i.name).join(", ");

    if (readies < owed.length) {
      ui.notifications.warn(
        `${names} went into play under pressure: that costs ${owed.length} Ready, and this turn `
        + `plays ${readies}. Stage a half showing Ready, or take it back out of play.`);
      return false;
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> readies `
        + `<em>${names}</em>.</p></div>`
    });
    this.pendingEquips.clear();
    return true;
  }

  async #resolveStep(step, half, targets) {
    const actor = this.actor;

    switch (step.verb) {
      case "strike":
      case "cast": {
        if (!targets.length) return ui.notifications.warn("Target a token first.");
        const item = this.#itemFor(step.verb, half);
        if (!item) return ui.notifications.warn(`Nothing equipped can ${step.verb}.`);
        await resolveAttack(actor, { verb: step.verb, item, mod: step.mod ?? 0, targets, step });
        return;
      }

      case "defend": {
        const item = this.#itemFor("defend", half);
        if (!item) return ui.notifications.warn("Nothing equipped can defend.");
        await resolveDefend(actor, { item, half });
        return;
      }

      case "heal":
        await resolveHeal(actor, { amount: step.param ?? 0 });
        return;

      case "use": {
        const item = this.#itemFor("use", half);
        if (!item) return ui.notifications.warn("No usable item equipped. Equip a potion first.");
        await resolveUse(actor, { item, target: targets[0] ?? actor });
        return;
      }

      /*
       * Ready grants an equip or a swap, and it is settled in #settleReady before any step runs --
       * by then the slate it pays for is already in play. Nothing is left to do per step.
       */
      case "ready":
        return;

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

  /**
   * Put a slate into play. An item in play is equipped; a feature in play is Drained.
   *
   * Only the decks hold slates that are out of play, so this only ever moves a card in -- taking
   * one back out happens in the play area, where it is sitting. A slate with a half to choose lands
   * on the primary stack and can be moved from there.
   *
   * Arranging the stacks is free. Inside a combat the arrangement still has to be paid for with a
   * **Ready**, but that is settled when the turn is played (#settleReady), so the click that moves
   * a slate never has to come second to the card half that pays for it.
   */
  static async #onPlaySlate(event, target) {
    const slate = this.actor.items.get(target.dataset.slateId);
    if (!slate) return;

    if (slate.type === "feature") {
      if (!slate.system.isActive) {
        return ui.notifications.info("A passive feature is simply true; there is nothing to play.");
      }
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
      return this.render();
    }

    if (slate.system.equipped) {
      return ui.notifications.info("Already in play. Take it back out from the play area.");
    }
    if (!await CardRPGTray.#hasRoom(this.actor, slate)) return;

    await slate.update({ "system.equipped": true });
    // Out of combat this is free, so there is nothing to settle and nothing to remember.
    if (game.combat?.started) this.pendingEquips.add(slate.id);
    if (slate.system.availableVerbs.length > 1) this.roles.set(slate.id, "primary");
    this.render();
  }

  /* -------------------------------------------- */

  /** Turn a stack over. Only the front card reads in full, so this is how you see the rest. */
  static #onShiftStack(event, target) {
    const { half, dir } = target.dataset;
    this.tops[half] = (this.tops[half] ?? 0) + Number(dir);
    this.render();
  }

  /**
   * Take one card out of a stack, after confirming. One card: a modifier leaves play, an action
   * card goes back to hand, and in neither case does anything else in the stack move.
   */
  static async #onUnstack(event, target) {
    const { half, slateId } = target.dataset;

    if (!slateId) {
      const ok = await CardRPGTray.#confirm(`Take back the ${half} action?`,
        `<p>The card goes back to your hand. The rest of the ${half} stack stays in play.</p>`);
      if (!ok) return;
      this.staged = this.staged.filter(s => s.half !== half);
      return this.render();
    }

    const slate = this.actor.items.get(slateId);
    if (!slate) return;
    const ok = await CardRPGTray.#confirm(`Take ${slate.name} out of play?`,
      slate.type === "feature"
        ? "<p>It stops being Drained and goes back to the Features deck.</p>"
        : "<p>It goes back to the Items deck. Playing it again in a combat costs a Ready.</p>");
    if (!ok) return;
    await this.#takeOut(slate);
    this.render();
  }

  /**
   * Out of play: an item is unequipped, a feature stops being Drained.
   *
   * Free, and it cancels the Ready the slate owed -- a slate that is no longer in play never got
   * readied, so there is nothing left to pay for.
   */
  async #takeOut(slate) {
    await slate.update(slate.type === "feature"
      ? { "system.drained": false, "system.drainedFor": null }
      : { "system.equipped": false });
    this.roles.delete(slate.id);
    this.pendingEquips.delete(slate.id);
  }

  /** Move a modifier to the other stack. Free and reversible, so it asks nothing. */
  static #onMoveHalf(event, target) {
    const slate = this.actor.items.get(target.dataset.slateId);
    if (!slate) return;
    this.roles.set(slate.id, this.#stackOf(slate) === "primary" ? "secondary" : "primary");
    this.render();
  }

  static #confirm(title, content) {
    return foundry.applications.api.DialogV2.confirm({
      window: { title },
      content: `<div class="cardrpg">${content}</div>`,
      modal: true,
      // Closing the dialog is a "no", not an error to catch at every call site.
      rejectClose: false
    });
  }

  /** Slot capacity, counting a two-handed item as both hands. */
  static async #hasRoom(actor, item) {
    const slot = item.system.slot;
    const capacity = CARDRPG.slots[slot]?.capacity;
    if (capacity === null || capacity === undefined) return true;
    const used = actor.items
      .filter(i => i.type === "item" && i.system.equipped && i.system.slot === slot)
      .reduce((n, i) => n + (i.system.isTwoHanded ? 2 : 1), 0);
    const needs = item.system.hands === 2 && slot === "hands" ? 2 : 1;
    if (used + needs > capacity) {
      ui.notifications.warn(`No room: ${slot} holds ${capacity}. Take something out of play first.`);
      return false;
    }
    return true;
  }

  static async #onEndTurn() {
    if (!game.combat) return ui.notifications.warn("No combat running.");
    await game.combat.nextTurn();
  }

  static async #onBreathe() {
    await catchBreath(this.actor);
    this.staged = [];
    this.tops = { primary: 0, secondary: 0 };
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
