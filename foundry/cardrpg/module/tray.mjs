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
import {
  deckOf, discardCards, retireCards, catchBreath, canCatchBreath, refill, cardName, artOf,
  dealSkillHand, discardSkillCards, pileBack,
  isReserved, reserveCard, uprightCards, isIntruder, intruderLine
} from "./decks.mjs";
import {
  resolveAttack, resolveDefend, resolveHeal, resolveUse, resolveCondition, resolveShake,
  reachableAmmo, isUsable,
  resolveTaint, resolveCorrode, liftCondition, resolveForesee, collectBonuses,
  resolveConjure, resolveShape,
  itemMeets, requireText, payToCast, answerCast, grantBlock, resolveCheck, passiveScore
} from "./resolve.mjs";
import {
  readCall, setCall, clearCall, describeCall, cardAnswers, bestTool, helpOptions,
  readChallenge, startChallenge, endChallenge, catchBreathInChallenge, drawTwist, twistCounts,
  partyPassives, readAgainst
} from "./checks.mjs";

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
      frontCard: CardRPGTray.#onFrontCard,
      moveHalf: CardRPGTray.#onMoveHalf,
      dealHand: CardRPGTray.#onDealHand,
      // A face-down pile is not openable; the click is absorbed rather than erroring.
      openPile: CardRPGTray.#onOpenPile,
      flipCard: CardRPGTray.#onFlipCard,
      // The reaction row is the only thing on a card in hand you can click that does not play it.
      reserve: CardRPGTray.#onReserve,
      // The scene side: the GM says when a scene starts, and a card is played AT a difficulty.
      dealSkills: CardRPGTray.#onDealSkills,
      check: CardRPGTray.#onCheck,
      // The GM's half of a check, and withdrawing it again (skill-rules 2, step 1).
      callCheck: CardRPGTray.#onCallCheck,
      clearCall: CardRPGTray.#onClearCall,
      // A challenge is two tracks and a GM who starts and ends it (skill-rules 3).
      startChallenge: CardRPGTray.#onStartChallenge,
      endChallenge: CardRPGTray.#onEndChallenge,
      // Catch Breath on the skill side, which costs Pressure rather than a turn.
      breatheScene: CardRPGTray.#onBreatheScene,
      // The GM's own deck, drawn by hand because the rules say it is never forced.
      twist: CardRPGTray.#onTwist,
      // The GM's passive panel, folded open or shut and remembered per client.
      togglePassives: CardRPGTray.#onTogglePassives,
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

  /**
   * Sit the right column clear of Foundry's own sidebar, whatever width it is right now.
   *
   * The sidebar collapses to a rail of buttons and expands again, so a fixed width in the
   * stylesheet is wrong half the time: too small and the column covers the chat and combat
   * buttons, too large and it floats a card's width away from them. Measure the real element.
   */
  #fitSidebar() {
    const layer = this.element?.classList?.contains("cr-hud-layer")
      ? this.element
      : this.element?.querySelector(".cr-hud-layer");
    if (!layer) return;

    // Ask Foundry for its own sidebar before guessing at element ids, which have moved between
    // versions. `ui.sidebar.element` is a bare node in v13+ and a jQuery wrapper before that.
    const own = ui.sidebar?.element;
    const candidates = [
      own instanceof HTMLElement ? own : (own?.[0] ?? null),
      document.getElementById("sidebar"),
      document.getElementById("ui-right")
    ];

    // The FIRST plausible answer wins, narrowest first -- not the leftmost edge of any of them.
    // #ui-right can be a container far wider than the bar inside it, and taking its edge parked
    // the whole column in the middle of the canvas.
    for (const node of candidates) {
      const rect = node?.getBoundingClientRect?.();
      if (!rect || rect.width <= 0) continue;
      const width = window.innerWidth - rect.left;
      // A sidebar narrower than a button or wider than a third of the screen is a measurement of
      // something else; leave the stylesheet's fallback alone rather than trust it.
      if (width < 24 || width > Math.min(420, window.innerWidth / 3)) continue;
      layer.style.setProperty("--cr-sidebar", `${Math.round(width) + 12}px`);
      return;
    }
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    this.#fitSidebar();
  }

  /** Re-measure when the sidebar opens or shuts, without re-rendering the whole HUD. */
  static refitAll() {
    for (const tray of CardRPGTray.openTrays) tray.#fitSidebar();
  }

  /* -------------------------------------------- */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const system = actor.system;
    const blocked = system.blockedIcons ?? new Set();
    const hand = deckOf(actor, "actionHand");

    const active = (system.activeConditions ?? []);
    const dazed = system.noSecondary;
    const encumbered = active.find(c => c.key === "burdened" || c.key === "overloaded");

    const combat = game.combat;
    const myCombatant = combat?.combatants.find(c => c.actor?.id === actor.id);
    const counts = system.deckCounts ?? {};
    const deckTotal = Math.max(1, (counts.draw ?? 0) + (counts.discard ?? 0) + (counts.hand ?? 0));
    const fateTotal = (counts.fate ?? 0) + (counts.fateDiscard ?? 0);

    const slates = actor.items.filter(i => i.type === "item");
    const describeItem = i => ({
      id: i.id,
      name: i.name,
      group: i.system.group || "",
      weight: i.system.weight,
      lines: Object.entries(i.system.verbs ?? {})
        .filter(([, l]) => l.value !== null)
        // Range is asked of the actor, not read off the item: Good Aim lengthens it and a lost
        // eye shortens it, and neither had a reader until the injuries were built.
        .map(([v, l]) => `${v} ${l.value}`
          + ((r => r ? `/r${r}` : "")(actor.system.rangeOnLine(l, i)))
          + (l.reach ? `/reach ${l.reach}` : ""))
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
      // A turn is one primary and one secondary. Dazed or Exhausted cuts you to the primary alone,
      // and then one half is the whole turn -- so the button waits for what you are allowed to play.
      canPlay: (dazed || system.exhausted)
        ? this.staged.some(s => s.half === "primary")
        : ["primary", "secondary"].every(h => this.staged.some(s => s.half === h)),
      // Clear empties the play area, so it is live whenever there is anything in it to empty.
      canClear: this.staged.length > 0
        || ["primary", "secondary"].some(h => this.#assigned(h).length > 0),
      // A breath recovers a fixed 2, so a discard that cannot cover it buys nothing: the button
      // says so by being dead, rather than by taking the turn and handing back one card.
      canBreathe: canCatchBreath(this.actor),
      breathRecovery: CARDRPG.defaults.breathRecovery,
      playHint: (dazed || system.exhausted)
        ? "Primary only this turn."
        : "Needs a primary and a secondary, from two different cards.",

      dazed,
      stunned: system.noReactions,
      /*
       * How many cards are available to react with. Public, the way hand SIZE is public and hand
       * contents are not (hud-spec 7) -- and with reactions automatic it is the most informative
       * number on the board: it says exactly how much defence this character has left.
       */
      upright: uprightCards(actor).length,
      reserved: (hand?.cards.contents ?? []).filter(c => isReserved(c)).length,
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
      /*
       * Against the deck's REAL size, not a hardcoded 20. A Wild is a permanent passenger
       * (ideas.md), so a fate deck can be larger than the printed twenty -- and this bar read over
       * 100% the moment one went in.
       */
      fatePct: Math.round(100 * (counts.fate ?? 0) / Math.max(1, fateTotal)),
      // Exactly one Miss and one Critical between reshuffles, which is what makes 2/k true. Wilds
      // do not reshuffle and are not swings, so they are in `k` and not in the 2.
      fateSwing: counts.fate ? Math.min(100, Math.round(200 / counts.fate)) : null,
      playArea: this.#playArea(),
      leftDecks: this.#leftDecks(),
      actionDeck: this.#actionDeck(combat),
      pileLinks: this.#pileLinks(),
      viewer: this.#viewer(),

      /*
       * The scene tray (hud-spec 5), shown whenever no Combat is active. It is the same window in
       * a different mode rather than a second application, because the fate deck spans both and a
       * second window would have to show it twice.
       */
      scene: myCombatant ? null : this.#sceneTray(),
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
        const item = slate.type === "item";
        // Only a slate with a half to choose can be moved; the rest serve whatever needs them.
        const movable = item && slate.system.availableVerbs.length > 1;
        cards.push(Object.assign(
          item ? this.#itemCard(slate, true) : this.#featureCard(slate),
          {
            slate: true,
            // A feature is in a stack only because it has been used, so fading it says nothing.
            disabled: item && slate.system.drained,
            // An arrow that points, not one that swaps: the rules already spend ⇄ on Ready.
            moveTo: movable ? (half === "primary" ? "secondary" : "primary") : null,
            moveArrow: half === "primary" ? "→" : "←",
            tip: slate.system.drained && item
              ? `Disabled until it recharges: ${slate.system.rechargeLabel ?? "—"}. `
                + "Click to put it back in the Items deck."
              : `In the ${half} stack. Click to put it back in its deck.`
          }));
      }

      // Where each card sits before the carousel turns anything, so clicking a name can turn to it.
      cards.forEach((card, slot) => { card.slot = slot; });

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
   * An item that could modify more than one action sits in the stack it was put in; one with a
   * single verb had nothing to choose, and a used feature has no half at all, so both ride with
   * the primary.
   */
  #assigned(half) {
    const items = this.actor.items.filter(i =>
      i.type === "item" && i.system.equipped
      && !CARDRPG.slots[i.system.equippedSlot]?.worn
      && !CARDRPG.slots[i.system.equippedSlot]?.stows
      && this.#stackOf(i) === half);
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
      costs: face?.costs ?? [],
      // Play order is still click order, so the base card says where it falls in the turn.
      note: `${half} half · step ${this.staged.findIndex(s => s.half === half) + 1}`,
      tip: "The action this stack builds. Click to take it back — the stack goes with it."
    };
  }

  /**
   * One spell, as a card. Only a prepared one is clickable; the rest are the book.
   *
   * The lines read the step rather than prose, so a formula whose numbers are edited in content
   * says the new numbers here without anything being rewritten -- the same reason a card face is
   * rendered from data and never from a stored image (data/cards.mjs).
   */
  #spellCard(slate) {
    const e = slate.system.effect ?? {};
    const lines = [];
    const verb = e.verb
      ? game.i18n.localize(CARDRPG.verbs[e.verb]?.label ?? CARDRPG.effects[e.verb]?.label ?? e.verb)
      : "";
    const value = e.mod ?? null;
    if (verb || value !== null) lines.push(`${verb}${value ? ` ${value}` : ""}`.trim());
    if (e.condition) {
      const cfg = CARDRPG.conditions[e.condition] ?? {};
      const fierce = cfg.valued ? ` ${Math.max(1, e.intensity ?? 1)}` : "";
      lines.push(`${game.i18n.localize(cfg.label ?? e.condition)}${fierce}`
        + ` (${Math.max(1, e.duration ?? 1)})`
        + (e.resist
          ? ` \u00b7 resist ${game.i18n.localize(CARDRPG.approaches[e.resist]?.label ?? e.resist)}`
            + ` ${e.dc ?? CARDRPG.difficulties.normal}`
          : ""));
    }
    if (e.range) lines.push(`Range ${e.range}`);
    if (e.text) lines.push(e.text);

    const cost = slate.system.cost?.health ?? 0;
    const prepared = slate.system.prepared;
    return {
      id: slate.id,
      name: slate.name,
      art: artOf(slate),
      icon: CARDRPG.verbs.cast?.icon ?? null,
      lines: lines.length ? lines : ["\u2014"],
      /* The book is not clickable: you change what is prepared between fights, never during one. */
      passive: !prepared,
      note: `${slate.system.source || "—"} \u00b7 ${slate.system.strength} slot`
        + `${slate.system.strength === 1 ? "" : "s"}`
        + (cost ? ` \u00b7 costs ${cost} Health` : ""),
      tip: prepared
        ? `Cast it.${cost ? ` It costs ${cost} Health.` : ""}`
        : "In your book. What is prepared changes between fights, not during one."
    };
  }

  /** One item, as a card. `played` means equipped. */
  #itemCard(i, played) {
    const verbs = Object.entries(i.system.verbs ?? {}).filter(([, l]) => l.value !== null || l.text);
    // Only a slate that could modify more than one action has a half to choose.
    const choosy = i.system.availableVerbs.length > 1;
    // Where it IS if it is on; where it COULD go if it is not.
    const label = key => game.i18n.localize(CARDRPG.slots[key]?.label ?? key);
    const allowed = i.system.allowedSlots ?? [i.system.slot];
    const slotKey = i.system.equippedSlot ?? allowed[0];
    const slot = CARDRPG.slots[slotKey] ?? {};
    const fighting = !!game.combat?.started;
    const serving = played
      ? verbs.filter(([v]) => ["primary", "secondary"].some(h => this.#itemFor(v, h)?.id === i.id))
        .map(([v]) => v)
      : [];
    return {
      id: i.id,
      name: i.name,
      art: artOf(i),
      group: i.system.group || "",
      flippable: true,
      flipped: this.flipped.has(i.id),
      played,
      disabled: i.system.drained,
      // A worn slate is simply on, like a passive feature: it never enters a stack, and in a fight
      // it cannot come off either.
      passive: slot.worn && i.system.equipped,
      tip: slot.worn && allowed.length < 2
        ? (i.system.equipped
          ? `Worn on your ${label(slotKey).toLowerCase()}. Its bonus is simply on.`
          : fighting
            ? `Worn, not wielded: your ${label(slotKey).toLowerCase()} changes between fights, `
              + "not during one."
            : `Click to put it on your ${label(slotKey).toLowerCase()}.`)
        : allowed.length > 1 && !i.system.equipped
          ? `Fits your ${allowed.map(k => label(k).toLowerCase()).join(" or ")}. Click and choose.`
          : CARDRPG.slots[i.system.equippedSlot]?.stows
            ? `Slung on your ${label(i.system.equippedSlot).toLowerCase()}, so it strikes with `
              + "nothing from there. Click to draw it — free, you paid the Ready to sling it."
            : !i.system.equipped && CARDRPG.slots[slotKey]?.freeEquip
              ? `Click to hang it on your ${label(slotKey).toLowerCase()}. No Ready to pay.`
              : played
                ? "In play. Click it to put it back in the Items deck."
                : choosy
                  ? "Click to equip it on the primary stack. You can move it to the secondary from there."
                  : fighting
                    ? "Click to take it out of your pack. That is a Ready."
                    : "Click to equip it.",
      blurb: i.system.blurb,
      lines: verbs
        // Same question, same asker: the printed range is a derived number now.
        .map(([v, l]) => `${v} ${l.value ?? ""}`
          + ((r => r ? ` \u00b7 range ${r}` : "")(actor.system.rangeOnLine(l, i)))
          + `${l.reach ? ` \u00b7 reach ${l.reach}${l.reachMin > 1 ? ` from ${l.reachMin}` : ""}` : ""}`
          + `${l.area ? ` \u00b7 ${l.areaKind || "blast"} ${l.area}` : ""}`)
        .concat(i.system.armor ? [`armor ${i.system.armor}`] : []),
      // Which verbs this item is actually serving, so two weapons are never ambiguous. A verb is
      // the whole phrase -- "serving use" reads badly, "the Use half" reads as the thing it is.
      note: serving.length
        ? `serves the ${serving.join(" and ")} half${serving.length > 1 ? "s" : ""}`
        : [...(i.system.tags ?? [])].join(", "),
      facts: [
        { label: "Value", value: `${i.system.value} g` },
        { label: "Weight", value: `${i.system.weight} kg` },
        { label: "Type", value: i.system.kind || "\u2014" },
        {
          label: i.system.equipped ? "In" : "Fits",
          value: i.system.equipped ? label(slotKey) : allowed.map(label).join(" / ")
        }
      ]
    };
  }

  /**
   * One feature, as a card.
   *
   * A feature is never in or out of play -- it is part of you. A passive one is simply true; an
   * active one can be used, which disables it for a while. So the only state it has is available
   * or disabled, and neither is something you can undo by hand.
   */
  #featureCard(f) {
    const passive = !f.system.isActive;
    const disabled = f.system.drained;
    const recharge = f.system.rechargeLabel ?? "\u2014";
    return {
      id: f.id,
      name: f.name,
      art: artOf(f),
      group: f.system.group || "",
      disabled,
      // Nothing to click on either: a passive feature has no use, a disabled one is spent.
      passive: passive || disabled,
      tip: passive ? "Passive: always on, nothing to use."
        : disabled ? `Used. Disabled until it recharges: ${recharge}.`
          : "Click to use it. That disables it until it recharges.",
      lines: [f.system.text].filter(Boolean),
      note: passive ? "Passive \u2014 always on"
        : disabled ? `Disabled \u00b7 recharges ${recharge}`
          : `Recharges: ${recharge}`
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
    const spells = this.actor.items.filter(i => i.type === "spell");
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
      /*
       * A fourth deck, and it is a deck rather than a rail for a reason: unprepared spells are the
       * book, and the book is most of what a caster owns. The count is what you can CAST, because
       * a number that included the book would tell a player the opposite of what they need.
       */
      ...(spells.length ? [{
        id: "spells",
        label: "Spells",
        count: spells.filter(s => s.system.prepared).length,
        tip: `${spells.filter(s => s.system.prepared).length} prepared, `
          + `${spells.filter(s => !s.system.prepared).length} in the book. `
          + `${this.actor.system.spellSlots?.free ?? 0} of `
          + `${this.actor.system.spellSlots?.max ?? 0} slots free.`
      }] : []),
      {
        id: "conditions", label: "Conditions", count: conditions.length,
        tip: "What is on you. A duration ticks down on its creator's turn."
      }
    ].map(d => ({
      ...d,
      open: this.openPile === d.id,
      /*
       * **A shut pile is a face-down deck, so it wears that deck's back.** Read for the shut state
       * only: an open pile is showing its cards, and a back behind them is a picture nobody can
       * see paid for in a texture load. `pileBack` owns the pile-id-to-deck-key mapping.
       */
      art: this.openPile === d.id ? "" : pileBack(d.id)
    }));
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
  #pileLinks() {
    const counts = this.actor.system.deckCounts ?? {};
    const swing = counts.fate ? Math.min(100, Math.round(200 / counts.fate)) : null;
    const breath = CARDRPG.defaults.breathRecovery;

    const links = [
      {
        id: "fateDiscard", label: "Fate", count: counts.fate ?? 0,
        tip: `Fate deck: ${counts.fate ?? 0} face down, ${counts.fateDiscard ?? 0} drawn`
          + (swing ? `, ${swing}% chance the next is a swing` : "")
          + ". Click to look through the discard."
      },
      {
        id: "actionDiscard", label: "Discard", count: counts.discard ?? 0,
        tip: `Your discard pile. Catch Breath takes ${breath} of these at random, and the rest `
          + "waits for the next breath — nothing in here is lost. Click to look through it."
      }
    ];

    // Spent appears only once it has something in it, so it means something when it is there.
    if (counts.spent) {
      links.push({
        id: "actionSpent", label: "Spent", count: counts.spent,
        tip: "Out of the fight. Spent cards come back on a short or long rest. Click to look "
          + "through them."
      });
    }

    return links.map(l => ({
      ...l, icon: CARDRPG.pileIcons[l.id], open: this.openPile === l.id
    }));
  }

  /**
   * Whichever deck is open, spread beside it -- holding only what is NOT in play, since what is in
   * play is already on the scene.
   */
  #viewer() {
    if (!this.openPile) return null;

    if (this.openPile === "items") {
      // Not in use: in the pack, or slung on your back. Both are things you can still pick up.
      const cards = this.actor.items
        .filter(i => i.type === "item"
          && (!i.system.equipped || CARDRPG.slots[i.system.equippedSlot]?.stows))
        .map(i => this.#itemCard(i, false));
      return { label: "Items", count: `${cards.length}`, cards };
    }

    if (this.openPile === "features") {
      // Every feature, always: none of them is ever out of play, so none of them is ever missing.
      const cards = this.actor.items
        .filter(i => i.type === "feature")
        .map(f => this.#featureCard(f));
      return { label: "Features", count: `${cards.length}`, cards };
    }

    if (this.openPile === "spells") {
      /*
       * Prepared first, because those are the ones you can do something with, and the book after
       * -- greyed, because *the caster who prepared the wrong spells has prepared the wrong
       * spells* is the whole point of a slot budget and the sheet should not soften it.
       */
      const order = (a, b) => (b.system.prepared ? 1 : 0) - (a.system.prepared ? 1 : 0)
        || a.name.localeCompare(b.name);
      const cards = this.actor.items.filter(i => i.type === "spell").sort(order)
        .map(s => this.#spellCard(s));
      return { label: "Spells", count: `${cards.length}`, cards };
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
          lines: [
            ...(c.value ? [`Intensity ${c.value}`] : []),
            c.duration ? `Duration ${c.duration}` : "No duration"
          ],
          note: creator
            ? `Ticks down on ${creator}'s turn`
            : (cfg.derived ? "From carried weight" : "Ticks on your own turn")
        };
      });
      return { label: "Conditions", count: `${cards.length}`, cards };
    }

    const stack = deckOf(this.actor, this.openPile);
    const labels = { actionDiscard: "Discard", fateDiscard: "Fate discard", actionSpent: "Spent" };
    const cards = (stack?.cards.contents ?? []).map(c => ({
      id: c.id,
      name: cardName(c),
      harm: isIntruder(c),
      /* One creature's own card, which is the one worth spotting in a hand. */
      sole: isSole(c.system),
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
    // One line per intruder, read from the table that defines them rather than retyped here.
    if (isIntruder(card)) return intruderLine(card);
    const half = (name, steps) => (steps ?? [])
      .map(s => `${s.verb ?? ""}${s.param ? ` ${s.param}` : ""}${s.mod ? ` ${s.mod > 0 ? "+" : ""}${s.mod}` : ""}`)
      .join(", ");
    return `${half("p", card.system.primary)} / ${half("s", card.system.secondary)}`;
  }

  /**
   * The scene side: the skill hand, the six passive scores, and the counts.
   *
   * **Values are not pre-resolved here**, and that is the one real difference from the combat tray
   * (hud-spec 5): a tool bonus is situational -- *Shadow +2 (locks)* -- so the card shows its base
   * and the check asks which tool. Combat answers the same question by where the slate sits, and
   * there is no equivalent place to put a lockpick.
   *
   * **A passive score is static.** It is the best card of an approach in the WHOLE deck plus 2,
   * counting the discard, so it does not move during play and renders as a constant rather than a
   * live stat (skill-rules 2).
   */
  #sceneTray() {
    const actor = this.actor;
    const hand = deckOf(actor, "skillHand");
    const deck = deckOf(actor, "skill");
    const discard = deckOf(actor, "skillDiscard");

    const cards = [...(hand?.cards?.contents ?? [])].map(card => ({
      id: card.id,
      name: card.name,
      art: artOf(card),
      wild: !!card.system.wild,
      approach: card.system.wild
        ? game.i18n.localize("CARDRPG.Approach.Any")
        : game.i18n.localize(CARDRPG.approaches[card.system.approach]?.label ?? card.system.approach),
      icon: card.system.wild
        ? CARDRPG.approaches.any?.icon
        : CARDRPG.approaches[card.system.approach]?.icon,
      value: card.system.value,
      edge: card.system.edge ?? "",
      /* Whether this card may answer the call at all: the approach must fit the description, and a
       * wild fits any. Cards that cannot are dimmed rather than hidden, the same way a blocked
       * card half is (hud-spec 3.2) -- hiding them would hide the reason. */
      canAnswer: cardAnswers(card, readCall())
    })).sort((a, b) => b.value - a.value || a.approach.localeCompare(b.approach));

    const call = readCall();
    for (const card of cards) card.answers = !call || card.canAnswer;

    return {
      cards,
      /*
       * The obstacle in front of the party, which is the GM's half of a check and the half the
       * first build left to the player (skill-rules 2, step 1). A banner rather than a dialog
       * field: it is true until the GM withdraws it, and several characters answer the same one in
       * turn inside a challenge.
       */
      call: call ? { ...call, label: describeCall(call) } : null,
      isGM: game.user.isGM,
      /*
       * The two tracks, as fractions and as widths. A challenge shows only while one is running
       * (hud-spec 5), and both tracks are printed even when one has not moved: *how much can go
       * wrong before this turns ugly* is the number a player is deciding against.
       */
      challenge: (() => {
        const live = readChallenge();
        if (!live) return null;
        const pct = (n, max) => `${Math.min(100, Math.round(100 * n / max))}%`;
        return {
          ...live,
          progressPct: pct(live.progress, live.progressMax),
          pressurePct: pct(live.pressure, live.pressureMax)
        };
      })(),
      twists: game.user.isGM ? twistCounts() : null,
      /*
       * **What the party notices, for the GM only.** Not a secret-roll panel: a passive score is
       * static by design (hud-spec 5), which is exactly what makes it safe to read in the open.
       * When a call is live each row is marked against it, because the only rows that need a check
       * are the ones a card could still carry.
       */
      passives_gm: (() => {
        if (!game.user.isGM) return null;
        const open = game.settings.get("cardrpg", "passivesOpen");
        const reading = partyPassives(passiveScore);
        const best = actorName => {
          const actor = game.actors.getName(actorName);
          const hand = actor ? deckOf(actor, "skillHand") : null;
          const cards = [...(hand?.cards?.contents ?? [])];
          if (!cards.length) return 0;
          return Math.max(...cards.map(c => (call && call.approach !== "any"
            ? (c.system.worth?.(call.approach) ?? 0) : c.system.value) ?? 0));
        };
        return {
          open,
          fromScene: reading.fromScene,
          party: reading.party.join(", "),
          rows: reading.rows.map(row => {
            /* Marked only against a call that names this approach, or an open one: a Wits call
             * says nothing about whether anybody could manage the Might obstacle. */
            const mark = call && (call.approach === "any" || call.approach === row.key)
              ? readAgainst(row.best, call.dc, best(row.who))
              : "";
            /* The tooltip is built here rather than in the template: three branches of prose in a
             * `data-tooltip` attribute is markup doing arithmetic's job, and the template has one
             * comparison helper where this needs three. */
            const said = {
              over: game.i18n.localize("CARDRPG.Check.PassiveOver"),
              close: game.i18n.localize("CARDRPG.Check.PassiveClose"),
              under: game.i18n.localize("CARDRPG.Check.PassiveUnder")
            }[mark] ?? "";
            return {
              ...row,
              mark,
              tip: `${row.label} ${row.best} — ${row.who}`
                + (said ? ` · ${said}` : "")
            };
          })
        };
      })(),
      /* The six, always all six: a deck that covers every approach is the composition rule. */
      passives: Object.entries(CARDRPG.approaches)
        .filter(([key]) => key !== "any")
        .map(([key, cfg]) => ({
          key,
          label: game.i18n.localize(cfg.label ?? key),
          icon: cfg.icon,
          score: passiveScore(actor, key)
        })),
      deck: deck?.cards?.size ?? 0,
      discard: discard?.cards?.size ?? 0,
      full: cards.length >= CARDRPG.defaults.skillHandSize,
      /* Deck and hand both empty is the improvising case, and it is worth saying out loud. */
      improvising: !cards.length && !(deck?.cards?.size ?? 0)
    };
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
      /* Why this half cannot be played, when it cannot: a kit requirement nothing in hand meets. */
      let unmet = "";

      for (const step of steps ?? []) {
        const icon = CARDRPG.verbs[step.verb]?.icon ?? CARDRPG.effects[step.verb]?.icon ?? null;
        if (icon) icons.push(icon);

        let text = step.verb
          ? game.i18n.localize(CARDRPG.verbs[step.verb]?.label ?? CARDRPG.effects[step.verb]?.label ?? step.verb)
          : "";

        if (step.verb === "strike" || step.verb === "cast") {
          // The face shows the item the player chose, so "Strike 4" is never a guess.
          const item = this.#itemFor(step.verb, name, step.requires);
          /*
           * A kit requirement is printed from the field, never from the card's prose, and the same
           * call that printed the number decided whether anything meets it -- so the face and the
           * click cannot disagree about whether this half is playable.
           */
          const need = requireText(step.requires);
          if (need && !item) unmet = need;
          const base = item?.system.verbs?.[step.verb]?.value;
          if (base !== null && base !== undefined) {
            text += ` ${base + (step.mod ?? 0) + collectBonuses(this.actor, step.verb, item).total}`;
          } else if (step.mod) text += ` ${step.mod > 0 ? "+" : ""}${step.mod}`;
          if (need) text += ` · ${need}`;
        } else if (step.param !== null && step.param !== undefined) {
          /*
           * Move as it actually plays: halved by Slowed, Burdened or Overloaded, then reduced by
           * Frozen, floored at 0 (core-rules 7). The face has to show the real number -- a Slowed
           * Advance that still reads "Move 3" is a lie the player acts on.
           */
          const played = step.verb === "move"
            ? this.actor.system.movePlayed(step.param)
            : step.param;
          text += ` ${played}`;
          if (played !== step.param) text += `\u00a0(was ${step.param})`;
        }
        else if (step.mod !== null && step.mod !== undefined) {
          text += ` ${step.mod > 0 ? "+" : ""}${step.mod}`;
        }

        if (step.condition) {
          const name = game.i18n.localize(CARDRPG.conditions[step.condition]?.label ?? step.condition);
          // A valued condition prints its intensity before its duration: Burning 3 (2).
          const fierce = CARDRPG.conditions[step.condition]?.valued
            ? ` ${Math.max(1, step.intensity ?? 1)}` : "";
          text += `${text ? " " : ""}${name}${fierce} (${Math.max(1, step.duration ?? 1)})`;
          if (step.resist) {
            const approach = CARDRPG.approaches[step.resist];
            text += ` · resist ${game.i18n.localize(approach?.label ?? step.resist)} `
              + `${step.dc ?? CARDRPG.difficulties.normal}`;
          }
          const icon = CARDRPG.conditions[step.condition]?.icon;
          if (icon) icons.push(icon);
        }

        /*
         * The combo clause. Printed after the verb and the condition, because that is the order it
         * is read in: what the half does, then what it does extra against an opening.
         */
        if (step.when?.needs) {
          const w = step.when;
          const opening = game.i18n.localize(CARDRPG.conditions[w.needs]?.label ?? w.needs);
          const extra = [];
          if (w.mod) extra.push(`${w.mod > 0 ? "+" : ""}${w.mod}`);
          if (w.advantage) extra.push(game.i18n.localize(CARDRPG.effects.advantage?.label ?? "advantage"));
          if (w.dc) extra.push(`resist ${w.dc}`);
          if (w.text) extra.push(w.text);
          if (extra.length) text += `${text ? " " : ""}vs ${opening}: ${extra.join(", ")}`;
        }

        if (step.text) text += ` (${step.text})`;
        bits.push(text.trim());
      }

      // What the half costs is part of the half, printed with it wherever the half is shown.
      // Icons, like everything else on a face: card space is limited (core-rules 10). Strain takes
      // a bare number, so it reads as a parameter the way Move 3 does; Spent takes none.
      const { spent, strain } = card.system.costFor?.(name) ?? {};
      const costs = [];
      if (spent) {
        costs.push({
          icon: CARDRPG.costIcons.spent.icon,
          value: null,
          tip: "Spent: this card goes out for the rest of the fight when you play this half. "
            + "It comes back on a short or long rest."
        });
      }
      if (strain) {
        costs.push({
          icon: CARDRPG.costIcons.strain.icon,
          value: strain,
          tip: `Strain ${strain}: discard ${strain} other card${strain === 1 ? "" : "s"} from your `
            + "hand to play this half. They go to the discard, so a Catch Breath brings them back."
        });
      }

      return {
        name,
        text: bits.join(", ") || "—",
        costs,
        icon: CARDRPG.halfIcons[name],
        blocked: icons.some(i => blockedIcons.has(i)) || (name === "secondary" && dazed) || !!unmet,
        /*
         * Why, in words. The sentence used to be fixed in the template, which was fine while a
         * half could only ever be switched off by a Blocked icon; a kit requirement is a second
         * reason, and a player who cannot tell them apart will go looking for the condition.
         */
        tip: unmet
          ? `Needs ${unmet} in hand. Ready something that is, or play the other half.`
          : "Blocked right now. The other half may still be playable, and Brace never is.",
        staged: this.staged.some(s => s.cardId === card.id && s.half === name)
      };
    };

    if (isIntruder(card)) {
      return { id: card.id, name: cardName(card), harm: true, art: artOf(card), halves: [] };
    }
    return {
      id: card.id,
      name: cardName(card),
      harm: false,
      art: artOf(card),
      halves: [half("primary", card.system.primary), half("secondary", card.system.secondary)],
      reaction: this.#reactionRow(card)
    };
  }

  /**
   * The third row: what this card would do on someone else's turn, and the switch that stops it.
   *
   * Reactions resolve automatically (core-rules 3), so there is nothing to click at the moment a
   * hit lands -- which leaves exactly one decision, taken in advance and at leisure: whether this
   * card is available to spend at all. Turning it sideways is that decision, and the row that says
   * what the card would do is the switch that stops it doing it.
   *
   * A card with no printed reaction reads "Brace", because that is what it is.
   */
  #reactionRow(card) {
    const key = card.system.reaction || "";
    const rule = key ? CARDRPG.reactions[key] : null;
    const off = this.actor.system.blockedReactions ?? new Set();
    const label = key
      ? game.i18n.localize(rule?.label ?? key)
      : game.i18n.localize("CARDRPG.Reaction.Brace");
    const reserved = isReserved(card);

    // A reaction a drawback has taken away is greyed in place like a blocked half, never hidden:
    // Plate takes the Sidestep, and a player who cannot see what it took will think it took nothing.
    const gone = !!key && off.has(key);
    const trigger = game.i18n.localize(
      CARDRPG.reactionTriggers[rule?.trigger ?? "hit"] ?? CARDRPG.reactionTriggers.hit);

    return {
      label,
      reserved,
      blocked: gone,
      tip: gone
        ? `${label} is switched off by what you are wearing. The card is still yours to play.`
        : reserved
          ? `Turned sideways: ${label} will NOT fire. It still counts toward your hand and both `
            + `halves still play. Click to turn it back upright.`
          : `${label} fires by itself when ${trigger}, if the hit would Wound you or drop you. `
            + `The card goes to your discard. Click to turn it sideways and keep it.`
    };
  }

  /**
   * Turn a card sideways, or back upright. Free, and legal at any time -- including in the middle
   * of somebody else's turn, which is the whole point of a standing decision.
   */
  static async #onReserve(event, target) {
    const hand = deckOf(this.actor, "actionHand");
    const card = hand?.cards.get(target.dataset.cardId);
    if (!card) return;
    await reserveCard(card);
    this.render();
  }

  /**
   * The item a verb will actually use on a given half.
   *
   * An item stamped for this half wins. Then one at "any" -- a slate with a single verb, which had
   * nothing to choose. Anything else in play is a last resort. So a longsword on the primary and a
   * shield on the secondary strike and defend respectively, with nothing to set beyond the clicks
   * that put them there.
   */
  #itemFor(verb, half = "primary", requires = null) {
    const candidates = this.#itemsFor(verb, requires);
    if (candidates.length < 2) return candidates[0] ?? null;
    const choosy = i => i.system.availableVerbs.length > 1;
    const rank = i => {
      const role = this.roles.get(i.id) ?? (choosy(i) ? "primary" : "any");
      return role === half ? 0 : role === "any" ? 1 : 2;
    };
    // #itemsFor already orders by value, and sort is stable, so equal ranks keep the better item.
    return [...candidates].sort((a, b) => rank(a) - rank(b))[0];
  }

  /**
   * Every equipped item that can serve a verb, best first.
   *
   * `requires` is the step's kit requirement (data/cards.mjs), and it narrows the list BEFORE the
   * sort rather than after the pick -- which is the whole of the fix. A Shade holding a bow and a
   * dagger has a better Strike with the dagger, so a Take the Shot that asked for the best item
   * and then checked it would refuse to fire a bow the character is holding.
   */
  #itemsFor(verb, requires = null) {
    return this.actor.items
      .filter(i => i.type === "item" && i.system.equipped
        && !CARDRPG.slots[i.system.equippedSlot]?.stows
        && (i.system.verbs?.[verb]?.value !== null || i.system.verbs?.[verb]?.text))
      .filter(i => itemMeets(i, requires))
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
    /*
     * Every kind that resolved on the way in counts as something having happened: a refill that
     * dealt nothing but a Fear is not an empty draw pile, and warning about one would send the
     * player looking for a problem they do not have.
     */
    const { drawn, taint, fear, rage } = await refill(this.actor);
    this.dealtAt = key;
    if (!drawn && !taint && !fear && !rage) {
      ui.notifications.warn("Draw pile is empty. Catch Breath to recover some.");
    }
    this.render();
  }

  /**
   * Draw up to the skill hand size. The GM says when, because a scene is not an event the engine
   * has -- the same reason granting a level is a GM action and not a hook.
   */
  static async #onDealSkills() {
    if (!game.user.isGM) {
      return ui.notifications.info("The GM says when a new scene starts.");
    }
    const { drawn } = await dealSkillHand(this.actor);
    if (!drawn) ui.notifications.info("Nothing to draw: the skill deck is empty until a rest.");
    this.render();
  }

  /**
   * The GM's half of a check: name the obstacle (skill-rules 2, step 1).
   *
   * **This step existed in the rules and not in the software.** The dialog below used to offer
   * every difficulty to whoever clicked their own card, so the player set the difficulty of their
   * own obstacle. A call is set here, read by every tray, and answered with one card.
   */
  static async #onCallCheck() {
    if (!game.user.isGM) return ui.notifications.info(game.i18n.localize("CARDRPG.Check.GMCalls"));
    if (!game.scenes?.active) {
      return ui.notifications.warn(game.i18n.localize("CARDRPG.Check.NoScene"));
    }
    const current = readCall();
    const difficulties = Object.entries(CARDRPG.difficulties)
      .map(([name, dc]) => `<option value="${dc}"${current?.dc === dc ? " selected" : ""}>`
        + `${name} (${dc})</option>`).join("");
    const approaches = [`<option value="any">`
      + `${game.i18n.localize("CARDRPG.Check.AnyApproach")}</option>`,
    ...Object.entries(CARDRPG.approaches).filter(([key]) => key !== "any")
      .map(([key, cfg]) => `<option value="${key}"`
        + `${current?.approach === key ? " selected" : ""}>`
        + `${game.i18n.localize(cfg.label ?? key)}</option>`)].join("");

    const answer = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize("CARDRPG.Check.CallTitle") },
      content: `<div class="cardrpg cr-check">
        <p class="cr-note">${game.i18n.localize("CARDRPG.Check.CallBody")}</p>
        <label>${game.i18n.localize("CARDRPG.Check.Difficulty")}
          <select name="dc">${difficulties}</select></label>
        <label>${game.i18n.localize("CARDRPG.Check.Approach")}
          <select name="approach">${approaches}</select></label>
        <label>${game.i18n.localize("CARDRPG.Check.Edge")} <select name="mode">
          <option value="0">${game.i18n.localize("CARDRPG.Check.Even")}</option>
          <option value="1">${game.i18n.localize("CARDRPG.Check.Advantage")}</option>
          <option value="-1">${game.i18n.localize("CARDRPG.Check.Disadvantage")}</option>
        </select></label>
        <label>${game.i18n.localize("CARDRPG.Check.Note")}
          <input type="text" name="note" value="${foundry.utils.escapeHTML(current?.note ?? "")}"></label>
      </div>`,
      ok: {
        label: game.i18n.localize("CARDRPG.Check.CallConfirm"),
        callback: (ev, button) => ({
          dc: Number(button.form.elements.dc.value),
          approach: button.form.elements.approach.value,
          mode: Number(button.form.elements.mode.value),
          note: button.form.elements.note.value
        })
      },
      rejectClose: false
    });
    if (!answer) return;

    const call = await setCall(answer);
    /* A chat line as well as the banner: the banner is the state of the table and the message is
     * its history, which is what a log is for. */
    await ChatMessage.create({
      content: `<div class="cardrpg"><p><strong>${describeCall(call)}</strong>`
        + `${answer.note ? ` &mdash; ${foundry.utils.escapeHTML(answer.note)}` : ""}</p></div>`
    });
    for (const tray of CardRPGTray.openTrays) tray.render();
  }

  /**
   * Begin a challenge: two numbers and a line about what it is (skill-rules 3).
   *
   * The defaults are the example's -- Progress 5, Pressure 3 -- because a GM reaching for this
   * button mid-sentence should not have to invent a pair of numbers, and those two are the pair the
   * rules worked through.
   */
  static async #onStartChallenge() {
    if (!game.user.isGM) return ui.notifications.info(game.i18n.localize("CARDRPG.Check.GMCalls"));
    const live = readChallenge();
    const answer = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize("CARDRPG.Challenge.Title") },
      content: `<div class="cardrpg cr-check">
        <p class="cr-note">${game.i18n.localize("CARDRPG.Challenge.Body")}</p>
        <label>${game.i18n.localize("CARDRPG.Challenge.Progress")}
          <input type="number" name="progress" min="1" value="${live?.progressMax ?? 5}"></label>
        <label>${game.i18n.localize("CARDRPG.Challenge.Pressure")}
          <input type="number" name="pressure" min="1" value="${live?.pressureMax ?? 3}"></label>
        <label>${game.i18n.localize("CARDRPG.Check.Note")}
          <input type="text" name="note" value="${foundry.utils.escapeHTML(live?.note ?? "")}"></label>
      </div>`,
      ok: {
        label: game.i18n.localize("CARDRPG.Challenge.Begin"),
        callback: (ev, button) => ({
          progressMax: Number(button.form.elements.progress.value),
          pressureMax: Number(button.form.elements.pressure.value),
          note: button.form.elements.note.value
        })
      },
      rejectClose: false
    });
    if (!answer) return;
    await startChallenge(answer);
    await ChatMessage.create({
      content: `<div class="cardrpg"><p><strong>${answer.note
        || game.i18n.localize("CARDRPG.Challenge.Title")}</strong> &mdash; Progress 0/`
        + `${answer.progressMax} &middot; Pressure 0/${answer.pressureMax}</p></div>`
    });
    for (const tray of CardRPGTray.openTrays) tray.render();
  }

  /** End it. Either track filling is a reason, and so is the GM deciding it is over. */
  static async #onEndChallenge() {
    if (!game.user.isGM) return;
    await endChallenge();
    for (const tray of CardRPGTray.openTrays) tray.render();
  }

  /**
   * Catch Breath inside a challenge (skill-rules 3), which is not the combat one.
   *
   * Pressure +1, the discard comes back, **one card of your choice** is set aside as Spent, and you
   * draw up to hand size. The choice is the player's and the dialog asks for it, the same way a
   * prune does: only they know which card they can do without today.
   */
  static async #onBreatheScene() {
    const live = readChallenge();
    if (!live) return ui.notifications.info(game.i18n.localize("CARDRPG.Challenge.NotInOne"));
    const deck = deckOf(this.actor, "skill");
    const discard = deckOf(this.actor, "skillDiscard");
    const pool = [...(discard?.cards?.contents ?? []), ...(deck?.cards?.contents ?? [])];
    const answer = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize("CARDRPG.Challenge.Breathe") },
      content: `<div class="cardrpg cr-check">
        <p class="cr-note">${game.i18n.localize("CARDRPG.Challenge.BreatheBody")}</p>
        <label>${game.i18n.localize("CARDRPG.Challenge.SetAside")} <select name="spent">
          <option value="">${game.i18n.localize("CARDRPG.Challenge.NoneAside")}</option>
          ${pool.map(c => `<option value="${c.id}">${foundry.utils.escapeHTML(c.name)}`
            + ` (${c.system.value})</option>`).join("")}
        </select></label>
      </div>`,
      ok: {
        label: game.i18n.localize("CARDRPG.Challenge.Breathe"),
        callback: (ev, button) => ({ spent: button.form.elements.spent.value })
      },
      rejectClose: false
    });
    if (!answer) return;
    await catchBreathInChallenge(this.actor, answer.spent || null);
    this.render();
  }

  /**
   * Draw a twist, or two to pick from (skill-rules 4).
   *
   * **A button and never a consequence**, which is the rule rather than a UI choice: *the GM can
   * always choose a cost directly... the deck is there for when inspiration runs out, not to
   * override the GM*. A Partial's chat line says a twist is owed; whether the deck answers is the
   * GM's decision, and so is putting one back that makes no sense here.
   */
  static async #onTwist(event, target) {
    if (!game.user.isGM) return;
    await drawTwist({ two: target.dataset.two === "yes" });
    for (const tray of CardRPGTray.openTrays) tray.render();
  }

  /**
   * Fold the passive panel open or shut.
   *
   * A client setting rather than state on the tray, so a GM who folds it away once finds it away
   * after a reload -- which is what makes it collapsible rather than merely foldable.
   */
  static async #onTogglePassives() {
    if (!game.user.isGM) return;
    await game.settings.set("cardrpg", "passivesOpen",
      !game.settings.get("cardrpg", "passivesOpen"));
    this.render();
  }

  /** Withdraw it. The obstacle is gone, or it was the wrong call. */
  static async #onClearCall() {
    if (!game.user.isGM) return;
    await clearCall();
    for (const tray of CardRPGTray.openTrays) tray.render();
  }

  /**
   * Answer the call with one card (skill-rules 2).
   *
   * **One dialog, and only for the parts that are still a decision.** The difficulty is the GM's
   * and comes from the call; the approach is the call's when it named one; the tool is chosen for
   * the character because the engine knows what is equipped and what it serves. What is left is
   * what the rules leave to the player: whether to spend a second card pushing, whether anybody
   * helped, and -- for a wild -- which approach they are claiming.
   *
   * When none of those is available the check resolves on the click, with no dialog at all. That is
   * the common case at a table: a called obstacle, a card that fits, no tool, no push, no helper.
   */
  static async #onCheck(event, target) {
    const hand = deckOf(this.actor, "skillHand");
    const card = hand?.cards.get(target.dataset.cardId);
    if (!card) return;

    const call = readCall();
    /*
     * **A player cannot set their own difficulty**, which is step 1 of the rules belonging to the
     * GM. Without a call there is nothing to answer, and the GM is one button away -- so this
     * refuses rather than guessing a Normal 5, which would be the same defect wearing a default.
     */
    if (!call && !game.user.isGM) {
      return ui.notifications.info(game.i18n.localize("CARDRPG.Check.WaitForCall"));
    }
    if (call && !cardAnswers(card, call)) {
      return ui.notifications.warn(game.i18n.format("CARDRPG.Check.WrongApproach",
        { card: card.name, approach: describeCall(call) }));
    }

    /* A wild claims an approach; anything else has one. A call that names one settles it. */
    const called = call && call.approach !== "any" ? call.approach : null;
    const own = card.system.wild ? null : card.system.approach;
    const approach = called ?? own;

    const pushable = [...hand.cards.contents]
      .filter(c => c.id !== card.id
        && (approach ? c.system.serves(approach) : c.system.value > 0));
    const tool = approach ? bestTool(this.actor, approach) : null;
    const tools = this.actor.items.filter(i => i.type === "item" && i.system.equipped
      && i.system.bonus?.approach);
    const helpers = helpOptions(this.actor);

    /* What is still a decision. An empty list means the click was the whole check. */
    const asks = [
      !approach ? "approach" : null,
      tools.length ? "tool" : null,
      pushable.length ? "push" : null,
      helpers ? "help" : null,
      !call ? "dc" : null
    ].filter(Boolean);

    let answer = {
      approach, dc: call?.dc ?? CARDRPG.difficulties.normal, mode: call?.mode ?? 0,
      tool: tool?.id ?? "", push: "", help: 0
    };

    if (asks.length) {
      const row = (label, body) => `<label>${label} ${body}</label>`;
      const fields = [
        asks.includes("dc") ? row(game.i18n.localize("CARDRPG.Check.Difficulty"),
          `<select name="dc">${Object.entries(CARDRPG.difficulties)
            .map(([name, dc]) => `<option value="${dc}">${name} (${dc})</option>`).join("")}`
          + "</select>") : "",
        asks.includes("approach") ? row(game.i18n.localize("CARDRPG.Check.Approach"),
          `<select name="approach">${Object.entries(CARDRPG.approaches)
            .filter(([key]) => key !== "any")
            .map(([key, cfg]) => `<option value="${key}">`
              + `${game.i18n.localize(cfg.label ?? key)}</option>`).join("")}</select>`) : "",
        asks.includes("tool") ? row(game.i18n.localize("CARDRPG.Check.Tool"),
          `<select name="tool"><option value="">`
          + `${game.i18n.localize("CARDRPG.Check.NoTool")}</option>`
          + tools.map(i => `<option value="${i.id}"${i.id === tool?.id ? " selected" : ""}>`
            + `${foundry.utils.escapeHTML(i.name)} (${i.system.bonus.approach} `
            + `+${i.system.bonus.value ?? 0}${i.system.bonus.situation
              ? `, ${foundry.utils.escapeHTML(i.system.bonus.situation)}` : ""})</option>`).join("")
          + "</select>") : "",
        asks.includes("push") ? row(game.i18n.localize("CARDRPG.Check.Push"),
          `<select name="push"><option value="">`
          + `${game.i18n.localize("CARDRPG.Check.NoPush")}</option>`
          + pushable.map(c => `<option value="${c.id}">${foundry.utils.escapeHTML(c.name)}`
            + ` (${c.system.value})</option>`).join("") + "</select>") : "",
        asks.includes("help") ? row(game.i18n.localize("CARDRPG.Check.Help"),
          `<select name="help"><option value="0">`
          + `${game.i18n.localize("CARDRPG.Check.NoHelp")}</option>`
          + `<option value="1">+1</option>`
          + `<option value="2">+2 (${game.i18n.localize("CARDRPG.Check.SameApproach")})</option>`
          + "</select>") : ""
      ].filter(Boolean).join("");

      const got = await foundry.applications.api.DialogV2.prompt({
        window: { title: `${card.name}` },
        content: `<div class="cardrpg cr-check">`
          + (call ? `<p class="cr-note"><strong>${describeCall(call)}</strong>`
            + `${call.note ? ` &mdash; ${foundry.utils.escapeHTML(call.note)}` : ""}</p>` : "")
          + fields + "</div>",
        ok: {
          label: game.i18n.localize("CARDRPG.Check.Make"),
          callback: (ev, button) => {
            const f = button.form.elements;
            return {
              dc: f.dc ? Number(f.dc.value) : (call?.dc ?? CARDRPG.difficulties.normal),
              approach: f.approach ? f.approach.value : approach,
              tool: f.tool ? f.tool.value : (tool?.id ?? ""),
              push: f.push ? f.push.value : "",
              help: f.help ? Number(f.help.value) : 0
            };
          }
        },
        rejectClose: false
      });
      if (!got) return;
      answer = { ...answer, ...got };
    }

    const pushed = answer.push ? hand.cards.get(answer.push) : null;
    await resolveCheck(this.actor, {
      approach: answer.approach,
      dc: answer.dc,
      mode: answer.mode,
      card,
      push: pushed,
      help: answer.help,
      item: answer.tool ? this.actor.items.get(answer.tool) : null
    });

    /* Played cards go to the skill discard, and the push went with them. */
    await discardSkillCards(this.actor, [card.id, ...(pushed ? [pushed.id] : [])]);
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

  /** Empty the play area: both action cards back to hand, every slate back to its deck. */
  static async #onClear() {
    for (const half of ["primary", "secondary"]) {
      for (const slate of this.#assigned(half)) await this.#takeOut(slate);
    }
    this.staged = [];
    this.tops = { primary: 0, secondary: 0 };
    this.render();
  }

  static async #onPlay() {
    if (!this.staged.length) return;
    const hand = deckOf(this.actor, "actionHand");
    const targets = [...(game.user.targets ?? [])].map(t => t.actor).filter(a => a);

    if (!await this.#settleReady(hand)) return;
    if (!await this.#settleStrain(hand)) return;

    for (const { cardId, half } of this.staged) {
      const card = hand?.cards.get(cardId);
      if (!card) continue;
      for (const step of card.system[half] ?? []) await this.#resolveStep(step, half, targets);
    }

    // Each card goes where the half it was played for sends it: the discard, or out for the fight.
    const burned = await retireCards(this.actor, this.staged);
    if (burned.length) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> spends `
          + `<em>${burned.map(c => cardName(c)).join(", ")}</em> — out until a rest.</p></div>`
      });
    }
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

  /**
   * Pay the Strain the staged halves print, before any of them resolves.
   *
   * Strain is a cost in cards: discard that many OTHER cards from your hand. The cards you are
   * playing are not other cards, so a half can never pay for itself, and a hand too thin to cover
   * the bill refuses the turn rather than part-paying it -- the same shape as an unpaid Ready.
   *
   * The player picks which cards go. Catch Breath recovers at random because choosing there would
   * be a free upgrade; here the choosing IS the cost, and taking it away would leave a flat tax
   * with no decision in it.
   *
   * @returns {Promise<boolean>} false if the turn cannot pay, in which case nothing is resolved.
   */
  async #settleStrain(hand) {
    const owed = this.staged.reduce((n, { cardId, half }) =>
      n + (hand?.cards.get(cardId)?.system.costFor?.(half)?.strain ?? 0), 0);
    if (!owed) return true;

    const playing = new Set(this.staged.map(s => s.cardId));
    const payable = (hand?.cards.contents ?? []).filter(c => !playing.has(c.id));
    if (payable.length < owed) {
      ui.notifications.warn(
        `This turn strains ${owed}, and your hand holds ${payable.length} other `
        + `card${payable.length === 1 ? "" : "s"}. Stage something cheaper, or draw first.`);
      return false;
    }

    const picked = await CardRPGTray.#payStrain(payable, owed);
    if (!picked) return false;

    const names = picked.map(id => cardName(hand.cards.get(id))).join(", ");
    await discardCards(this.actor, picked);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> strains ${owed}, `
        + `discarding <em>${names}</em>.</p></div>`
    });
    return true;
  }

  /**
   * Ask for the cards one at a time, rather than as a form with a count to police.
   *
   * One card per prompt means the dialog cannot be answered wrongly: there is no way to tick three
   * boxes when the bill is two, and no way to confirm having ticked none. Backing out of any
   * prompt cancels the whole turn, because a half-paid cost is not a cost.
   *
   * @returns {Promise<string[]|null>} the chosen card ids, or null if the player backed out.
   */
  static async #payStrain(cards, owed) {
    const left = [...cards];
    const picked = [];

    for (let i = 1; i <= owed; i++) {
      const chosen = await foundry.applications.api.DialogV2.wait({
        window: { title: `Strain ${owed}` },
        content: `<div class="cardrpg"><p>Discard a card from your hand to pay for this turn `
          + `(${i} of ${owed}). It goes to the discard, so a Catch Breath brings it back.</p></div>`,
        buttons: [
          ...left.map(c => ({ action: c.id, label: cardName(c) })),
          { action: "cancel", label: "Don't play", callback: () => null }
        ],
        modal: true,
        rejectClose: false
      });
      if (!chosen) return null;
      picked.push(chosen);
      left.splice(left.findIndex(c => c.id === chosen), 1);
    }
    return picked;
  }

  /**
   * Nock one piece of magical ammunition, if any is within reach (core-rules 4).
   *
   * Nocking costs no half of its own, so this is a question and not an action: the plain shot is
   * the default button, because a player who has to decline their own quiver on every Strike will
   * stop carrying one. Nothing is asked at all unless the weapon takes ammunition and a suitable
   * piece is on the belt.
   */
  async #nock(weapon) {
    const pieces = reachableAmmo(this.actor, weapon);
    if (!pieces.length) return { ammo: null, payload: null };

    const chosen = await foundry.applications.api.DialogV2.wait({
      window: { title: `${weapon.name}: nock a shaft` },
      content: `<div class="cardrpg"><p>One piece per Strike, and it is gone whether the shot `
        + `lands or misses.</p></div>`,
      buttons: [
        ...pieces.map(piece => ({
          action: piece.id,
          label: piece.system.shotLine ? `${piece.name} — ${piece.system.shotLine}` : piece.name
        })),
        { action: "plain", label: "Plain shot", default: true }
      ],
      rejectClose: false
    });
    const ammo = pieces.find(piece => piece.id === chosen) ?? null;
    if (!ammo) return { ammo: null, payload: null };

    /*
     * A Hollow Bolt is the one piece that needs a second question, because what it does is deliver
     * something else: the potion is the effect and the bolt is only the range.
     */
    if (ammo.system.shotEffect !== "carriesPotion") return { ammo, payload: null };

    const potions = this.actor.items.filter(i =>
      i.type === "item" && i.id !== ammo.id && isUsable(i)
      && i.system.equipped && CARDRPG.slots[i.system.equippedSlot]?.freeEquip
    );
    if (!potions.length) {
      ui.notifications.warn(`${ammo.name} has nothing to carry — put a potion on your belt.`);
      return { ammo: null, payload: null };
    }

    const which = await foundry.applications.api.DialogV2.wait({
      window: { title: `${ammo.name}: what does it carry?` },
      content: `<div class="cardrpg"><p>Whatever you hit drinks it.</p></div>`,
      buttons: [
        ...potions.map(potion => ({ action: potion.id, label: potion.name })),
        { action: "none", label: "Nothing — fire it empty" }
      ],
      rejectClose: false
    });
    return { ammo, payload: potions.find(potion => potion.id === which) ?? null };
  }

  /**
   * Resolve one step.
   *
   * `source` is the slate the step came from, when it came from one. A card half has no source and
   * finds an item for its verb; a spell IS the source and answers `verbs.cast` itself, which is
   * what lets one function resolve both without a branch per verb.
   */
  async #resolveStep(step, half, targets, source = null) {
    const actor = this.actor;

    switch (step.verb) {
      case "strike":
      case "cast": {
        if (!targets.length) return ui.notifications.warn("Target a token first.");
        const item = source ?? this.#itemFor(step.verb, half, step.requires);
        if (!item) {
          const need = requireText(step.requires);
          return ui.notifications.warn(need
            ? `This ${step.verb} needs ${need} in hand.`
            : `Nothing equipped can ${step.verb}.`);
        }
        const { ammo, payload } = step.verb === "strike"
          ? await this.#nock(item)
          : { ammo: null, payload: null };
        await resolveAttack(actor, {
          verb: step.verb, item, mod: step.mod ?? 0, targets, step, ammo, payload
        });
        // A condition printed on the same step rides in with the attack.
        if (step.condition) {
          for (const target of targets) await resolveCondition(actor, { step, target });
        }
        return;
      }

      case "defend": {
        const item = this.#itemFor("defend", half);
        if (!item) return ui.notifications.warn("Nothing equipped can defend.");
        await resolveDefend(actor, { item, half });
        return;
      }

      /*
       * Block, given away. `param` is how much and `area` is how far, 1 being adjacent -- which is
       * the same pair of fields a Blast uses, because *every ally within 2* is the same shape of
       * statement as *everything within 2* and should not need a second vocabulary.
       */
      case "block": {
        const given = await grantBlock(actor, {
          amount: step.param ?? 0,
          radius: step.area ?? 1
        });
        if (!given.length) {
          return ui.notifications.info("Nobody is standing close enough to cover.");
        }
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div class="cardrpg"><p><strong>${actor.name}</strong> covers `
            + given.map(g => `${g.actor.name} (Block ${g.block})`).join(", ")
            + " until the start of their next turn.</p></div>"
        });
        return;
      }

      case "shake": {
        /*
         * Shedding a condition is a decision, so the player picks which one; the engine only ever
         * narrows the list to what core-rules 7 allows to be shaken at all.
         *
         * `step.condition` on a shake half means "this one only" rather than "apply this" -- that is
         * how a targeted counter is written (way-cards 3.6). It needs no field of its own, and it
         * means a narrow spell cannot be played as a wide one by mistake.
         */
        const who = targets[0] ?? actor;
        const options = (who.system.activeConditions ?? [])
          .filter(c => CARDRPG.shakeable(c.key))
          .filter(c => !step.condition || c.key === step.condition);
        if (!options.length) {
          ui.notifications.info(`${who.name} has nothing to shake off.`);
          break;
        }
        const key = options.length === 1 ? options[0].key : await foundry.applications.api.DialogV2.wait({
          window: { title: `Shake Off ${step.param ?? 1}` },
          content: `<div class="cardrpg"><p>Which condition does `
            + `${who.name} shake off?</p></div>`,
          buttons: [
            ...options.map(c => ({
              action: c.key,
              label: `${game.i18n.localize(CARDRPG.conditions[c.key]?.label ?? c.key)} (${c.duration})`
            })),
            { action: "cancel", label: "None", callback: () => null }
          ],
          modal: true,
          rejectClose: false
        });
        if (key) await resolveShake(actor, { amount: step.param ?? 1, target: who, key });
        break;
      }

      /*
       * Poison and acid. Both take a target, and neither is a condition: Tainting deals cards into
       * a deck and Corrode eats the armour itself (core-rules 8).
       */
      case "tainting":
        for (const t of targets.length ? targets : [actor]) {
          await resolveTaint(actor, {
            amount: step.param ?? 1,
            target: t,
            // `text` carries "fast" for a dose that drops you now rather than later.
            fast: /fast/i.test(step.text ?? "")
          });
        }
        break;

      case "corrode":
        for (const t of targets) await resolveCorrode(actor, { amount: step.param ?? 1, target: t });
        break;

      case "lift": {
        // The complement of shake: what has no duration to spend. Same pick-one shape.
        const who = targets[0] ?? actor;
        const options = (who.system.activeConditions ?? [])
          .filter(c => CARDRPG.liftable(c.key))
          .filter(c => !step.condition || c.key === step.condition);
        if (!options.length) {
          ui.notifications.info(`${who.name} has nothing to lift.`);
          break;
        }
        const key = options.length === 1 ? options[0].key : await foundry.applications.api.DialogV2.wait({
          window: { title: "Lift" },
          content: `<div class="cardrpg"><p>Which does ${who.name} have lifted?</p></div>`,
          buttons: [
            ...options.map(c => ({
              action: c.key,
              label: game.i18n.localize(CARDRPG.conditions[c.key]?.label ?? c.key)
            })),
            { action: "cancel", label: "None", callback: () => null }
          ],
          modal: true,
          rejectClose: false
        });
        if (key) await liftCondition(actor, { target: who, key });
        break;
      }

      /*
       * Foresee names one NPC TYPE, not a token: every goblin shares one intent card (core-rules
       * 6, 9). With one type in the fight there is nothing to ask.
       */
      case "foresee": {
        const kinds = new Map();
        for (const combatant of game.combat?.combatants ?? []) {
          const npc = combatant.actor;
          if (npc?.type !== "npc") continue;
          kinds.set(npc.system.kind || npc.name, npc);
        }
        if (!kinds.size) return ui.notifications.info("No enemy types in this fight to read.");
        const names = [...kinds.keys()];
        const pick = names.length === 1 ? names[0]
          : await foundry.applications.api.DialogV2.wait({
            window: { title: game.i18n.localize("CARDRPG.Effect.Foresee") },
            content: `<div class="cardrpg"><p>Whose intent do you read?</p></div>`,
            buttons: [
              ...names.map(n => ({ action: n, label: n })),
              { action: "cancel", label: "None", callback: () => null }
            ],
            modal: true,
            rejectClose: false
          });
        if (pick && kinds.has(pick)) await resolveForesee(actor, kinds.get(pick));
        return;
      }

      case "heal":
        await resolveHeal(actor, { amount: step.param ?? 0 });
        return;

      /*
       * Conjuring and shaping both read their own sub-schema rather than the step's bare numbers,
       * because what separates the lesser necromancy from the greater is entirely how many, how
       * long and at what price -- and that was six cards' worth of prose before it was a field.
       */
      case "conjure":
        await resolveConjure(actor, { step });
        return;

      case "shape":
        await resolveShape(actor, { step });
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

      /*
       * A condition with no verb of its own: the effect IS the action, so it saves. One that rides
       * on a Strike or Cast is handled below, after that verb has resolved.
       */
      case "":
        if (step.condition) {
          if (!targets.length) return ui.notifications.warn("Target a token first.");
          for (const target of targets) await resolveCondition(actor, { step, target });
          return;
        }
        /*
         * **And a step that is only prose FALLS THROUGH to the announcement**, rather than
         * breaking out of a switch that is the end of this method.
         *
         * It used to break, which meant seventy-five steps did nothing when played -- no effect,
         * no prompt, not even a line in chat. The branch below announces any verb the engine does
         * not recognise, so the position was exactly backwards: a step with a made-up verb reached
         * the table and a step with a blank one was discarded. `initial: ""` on the schema is what
         * hid it, because content omits the key and the data model fills it in.
         *
         * The table resolves these, and that is fine -- a hundred and twenty-seven of them say
         * things no engine should try to adjudicate. What is not fine is the table never hearing
         * about it.
         */
        /* falls through */

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
   * Use a feature, or equip an item.
   *
   * Neither ever goes *out* of play. A feature is part of you: using an active one disables it
   * until it recharges, and that is the only state it has. An item comes off only when a Ready
   * swaps something else in, so a full slot asks what this item replaces instead of refusing.
   *
   * Arranging is free. Inside a combat it still has to be paid for with a **Ready**, but that is
   * settled when the turn is played (#settleReady), so the click that arranges a stack never has
   * to come second to the card half that pays for it.
   */
  static async #onPlaySlate(event, target) {
    const slate = this.actor.items.get(target.dataset.slateId);
    if (!slate) return;

    /*
     * A spell is the third kind of slate and the first that RESOLVES when clicked. An item is
     * arranged and a feature is used; a spell is cast, which means paying for it and then running
     * its effect through the very code that runs a card half -- `#resolveStep` -- because a
     * spell's effect and a card's step are one shape (data/cards.mjs).
     */
    if (slate.type === "spell") {
      const targets = [...(game.user.targets ?? [])].map(t => t.actor).filter(a => a);
      if (!await payToCast(this.actor, slate)) return;
      /*
       * The price is paid before the ward fires, and that is deliberate: *Unmake* stops the spell
       * from RESOLVING, not from being attempted, so the Health and the slot are gone either way.
       * A counterspell that also refunded the cast would be strictly better than not being cast at.
       */
      const warded = await answerCast(this.actor, slate.name);
      if (warded) return this.render();
      await this.#resolveStep(slate.system.effect, "primary", targets, slate);
      return this.render();
    }

    if (slate.type === "feature") {
      if (!slate.system.isActive) {
        return ui.notifications.info("A passive feature is always on; there is nothing to use.");
      }
      if (slate.system.drained) {
        return ui.notifications.info(
          `${slate.name} is used up. It recharges on its own: ${slate.system.rechargeLabel ?? "—"}.`);
      }
      await slate.update({
        "system.drained": true,
        "system.drainedFor": slate.system.active.turns ?? null
      });
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> uses `
          + `<em>${slate.name}</em>: ${slate.system.active.text}</p></div>`
      });
      return this.render();
    }

    // Slung on your back: not in use, so clicking it DRAWS it -- and the draw is free, because
    // the Ready was paid when it went over your shoulder.
    const slung = !!CARDRPG.slots[slate.system.equippedSlot]?.stows;
    if (slate.system.equipped && !slung) return ui.notifications.info("Already equipped.");

    const into = slung
      ? slate.system.allowedSlots.filter(k => !CARDRPG.slots[k]?.stows)
      : slate.system.allowedSlots;
    if (!into.length) return ui.notifications.warn(`${slate.name} has nowhere to go but your back.`);

    const slot = await CardRPGTray.#chooseSlot(slate, into);
    if (!slot) return;
    if (!CardRPGTray.#canEquipNow(slate, slot)) return;

    const displaced = await CardRPGTray.#makeRoom(this.actor, slate, slot);
    if (displaced === null) return;
    for (const other of displaced) {
      await other.update({ "system.equipped": false, "system.equippedTo": "" });
      this.roles.delete(other.id);
      this.pendingEquips.delete(other.id);
    }

    await slate.update({ "system.equipped": true, "system.equippedTo": slot });
    // Three things cost nothing: being out of combat, the belt, and drawing what you already slung.
    const free = slung || CARDRPG.slots[slot]?.freeEquip;
    if (game.combat?.started && !free) this.pendingEquips.add(slate.id);
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
   * Take a card out of a stack.
   *
   * A slate goes back to the deck it came from. The action card at the base takes the whole stack
   * with it: its modifiers were assigned to that action, so without it they have nothing to modify.
   */
  static async #onUnstack(event, target) {
    const { half, slateId } = target.dataset;

    if (slateId) {
      const slate = this.actor.items.get(slateId);
      if (slate) await this.#takeOut(slate);
      return this.render();
    }

    for (const slate of this.#assigned(half)) await this.#takeOut(slate);
    this.staged = this.staged.filter(s => s.half !== half);
    this.tops[half] = 0;
    this.render();
  }

  /**
   * Back to its deck: an item is unequipped, a used feature stops being used up.
   *
   * It also cancels the Ready the slate owed -- a slate that is not in play was never readied.
   */
  async #takeOut(slate) {
    await slate.update(slate.type === "feature"
      ? { "system.drained": false, "system.drainedFor": null }
      : { "system.equipped": false, "system.equippedTo": "" });
    this.roles.delete(slate.id);
    this.pendingEquips.delete(slate.id);
  }

  /** Clicking a card's name turns the stack to it, rather than taking it out. */
  static #onFrontCard(event, target) {
    const { half, slot } = target.dataset;
    this.tops[half] = Number(slot);
    this.render();
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

  /**
   * Make room in a slot, which is the only way an equipped item ever comes off.
   *
   * An item never simply leaves play. It is displaced, by another item, in a Ready -- so a full
   * slot does not refuse the equip, it asks what this item replaces. A two-hander going into two
   * occupied hands replaces both, and still costs the one Ready, because one item came in.
   *
   * @returns {Promise<Item[]|null>} what to unequip (possibly none), or null if the player backed out.
   */
  /**
   * Which slot is this going in?
   *
   * Most things go one place and are never asked about. A dagger fits a hand or a belt and a potion
   * fits a belt or a hand, so those ask -- and the asking is the point: where a thing sits decides
   * what a Ready can reach and whether it is in the way. Plate mail lists one slot and so never
   * asks, which is the whole rule about what fits where; there is no second rule by item type.
   *
   * @returns {Promise<string|null>} the chosen slot, or null if the player backed out.
   */
  static async #chooseSlot(slate, allowed = slate.system.allowedSlots ?? [slate.system.slot]) {
    if (allowed.length < 2) return allowed[0] ?? null;

    const label = key => game.i18n.localize(CARDRPG.slots[key]?.label ?? key);
    return await foundry.applications.api.DialogV2.wait({
      window: { title: `Where does ${slate.name} go?` },
      content: `<div class="cardrpg"><p><strong>${slate.name}</strong> fits more than one place, `
        + "and where it sits decides what it can do and what a Ready can reach.</p></div>",
      buttons: [
        ...allowed.map(key => ({ action: key, label: label(key) })),
        { action: "cancel", label: "Cancel", callback: () => null }
      ],
      modal: true,
      rejectClose: false
    }) ?? null;
  }

  /**
   * May this slate go on right now?
   *
   * Everything you are not using is in the pack, and everything in the pack can be reached -- for
   * a Ready (core-rules 4). So there is nothing here about reach, and only one rule bites:
   *
   * A **worn** slot does not change mid-fight at all. Nobody swaps rings while being stabbed, and
   * pricing it in Ready would be friction with no decision in it.
   */
  static #canEquipNow(slate, into) {
    if (!game.combat?.started) return true;

    const slot = CARDRPG.slots[into] ?? {};
    if (slot.worn) {
      ui.notifications.warn(
        `${slate.name} is worn, not wielded: ${game.i18n.localize(slot.label)} changes between `
        + "fights, not during one.");
      return false;
    }
    return true;
  }

  static async #makeRoom(actor, item, slot = item.system.slot) {
    // Asked of the actor, not of config: a hand this character no longer has is not a hand.
    const capacity = actor.system.slotCapacity(slot);
    if (capacity === null || capacity === undefined) return [];

    const size = i => (i.system.isTwoHanded ? 2 : 1);
    const here = actor.items.filter(i => i.type === "item" && i.system.equippedSlot === slot);
    const used = here.reduce((n, i) => n + size(i), 0);
    // Two hands are two hands. Slung over a back or hung on a belt, the same weapon is one object.
    const needs = item.system.hands === 2 && slot === "hands" ? 2 : 1;

    const free = used + needs - capacity;
    if (free <= 0) return [];

    /*
     * One Ready changes ONE equipped item, so the only legal swap is a single item for a single
     * item. A two-hander going into a hand holding a sword and a shield would turn over two, and
     * that is two Readies -- take one off first and the swap becomes legal.
     *
     * This used to offer clearing the whole slot at once, which was one Ready doing the work of
     * two.
     */
    const options = here.filter(i => size(i) >= free).map(i => [i]);
    if (!options.length) {
      const slotName = game.i18n.localize(CARDRPG.slots[slot]?.label ?? slot).toLowerCase();
      ui.notifications.warn(here.length
        ? `One Ready changes one item, and ${item.name} would turn over your whole ${slotName} `
          + `(${here.map(i => i.name).join(", ")}). Take one off first.`
        : `Your ${slotName} cannot take ${item.name}.`);
      return null;
    }

    const buttons = options.map((set, index) => ({
      action: String(index),
      label: set.map(i => i.name).join(" + "),
      callback: () => set
    }));
    const noReady = !!CARDRPG.slots[slot]?.freeEquip;
    const chosen = await foundry.applications.api.DialogV2.wait({
      window: { title: `${noReady ? "Swap" : "Ready"}: what does ${item.name} replace?` },
      content: `<div class="cardrpg"><p>Your `
        + `${game.i18n.localize(CARDRPG.slots[slot]?.label ?? slot).toLowerCase()} is full. `
        + `Equipping <strong>${item.name}</strong> means swapping something out`
        + (noReady ? ", which costs nothing." : ", and the swap is the Ready.")
        + "</p></div>",
      buttons: [...buttons, { action: "cancel", label: "Cancel", callback: () => null }],
      modal: true,
      rejectClose: false
    });
    return chosen ?? null;
  }

  static async #onEndTurn() {
    if (!game.combat) return ui.notifications.warn("No combat running.");
    await game.combat.nextTurn();
  }

  static async #onBreathe() {
    const result = await catchBreath(this.actor);
    if (!result) {
      return ui.notifications.warn(
        `Not enough in the discard to catch breath: it recovers `
        + `${CARDRPG.defaults.breathRecovery} cards, all or nothing.`);
    }
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

  // Collapsing the sidebar moves the edge the right column is measured against.
  Hooks.on("collapseSidebar", () => CardRPGTray.refitAll());
  window.addEventListener("resize", () => CardRPGTray.refitAll());

  Hooks.on("updateActor", refreshFor);
  Hooks.on("createItem", refreshFor);
  Hooks.on("updateItem", refreshFor);
  Hooks.on("deleteItem", refreshFor);

  // A card doesn't say whose it is, and neither does a combat change, so refresh everything.
  /* `updateScene` is the call for a check: it lives as a scene flag, so every tray reads the one
   * the GM set and redraws when it changes (checks.mjs). */
  for (const hook of ["createCard", "updateCard", "deleteCard", "createCards", "updateCards",
    "deleteCards", "updateCombat", "deleteCombat", "updateScene"]) {
    Hooks.on(hook, refreshAll);
  }

  // Every one of these is a TRANSITION. Reloading Foundry mid-combat fires none of them, so the
  // HUD stayed shut until the fight was ended and restarted; catch the fight already in progress.
  Hooks.on("combatStart", combat => CardRPGTray.autoOpen(combat));
  Hooks.on("combatTurn", combat => CardRPGTray.autoOpen(combat));
  Hooks.on("combatRound", combat => CardRPGTray.autoOpen(combat));

  // On "ready" the canvas may not be up, and autoOpen looks at the controlled token to decide who
  // is playing; "canvasReady" runs again once it is, and opening twice is a no-op.
  const resume = () => {
    const combat = game.combats?.active ?? game.combat;
    if (combat?.started) CardRPGTray.autoOpen(combat);
  };
  Hooks.once("ready", resume);
  Hooks.on("canvasReady", resume);
}
