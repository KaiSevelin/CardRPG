/**
 * Actor data models.
 *
 * The governing principle (foundry/actor-schema.md): store the minimum, derive the rest. Carried
 * weight, encumbrance, max health, armor, hand size, deck size and exhaustion are all computed from
 * cards and slates. Store any of them and they go stale the moment a slate moves.
 */

import { CARDRPG } from "../config.mjs";
import { available } from "../decks.mjs";

const fields = foundry.data.fields;

/* -------------------------------------------- */
/*  Shared                                      */
/* -------------------------------------------- */

/**
 * A condition instance. The creator is load-bearing: the duration ticks at the start of the
 * creator's turn, or the victim's if the creator has left combat (core-rules 7).
 */
function conditionField() {
  return new fields.ArrayField(new fields.SchemaField({
    key: new fields.StringField({ required: true, choices: Object.keys(CARDRPG.conditions) }),
    duration: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
    /*
     * Intensity, for the conditions whose config says `valued`. Null everywhere else, and the tray
     * prints it only when it is there -- so seventeen of nineteen tokens still show one number.
     */
    value: new fields.NumberField({ integer: true, min: 1, nullable: true, initial: null }),
    creatorId: new fields.StringField({ required: false, blank: true, initial: "" })
  }));
}

/** Health, with the base stored and the max derived. */
function healthField(base) {
  return new fields.SchemaField({
    value: new fields.NumberField({ required: true, integer: true, min: 0, initial: base }),
    base: new fields.NumberField({ required: true, integer: true, min: 1, initial: base })
  });
}

/* -------------------------------------------- */
/*  Character                                   */
/* -------------------------------------------- */

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const d = CARDRPG.defaults;
    return {
      health: healthField(12),

      // Transient: cleared at the start of your turn. A Defend primary holds for the round.
      block: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      blockPersists: new fields.BooleanField({ initial: false }),

      cash: new fields.SchemaField({
        gold: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      rest: new fields.SchemaField({
        tokens: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
        max: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 })
      }),

      // Only the base is stored; bonus, max and the carried total are derived.
      carry: new fields.SchemaField({
        base: new fields.NumberField({ required: true, integer: true, min: 0, initial: d.carryLimit })
      }),

      actionDeck: new fields.SchemaField({
        base: new fields.NumberField({ required: true, integer: true, min: 1, initial: d.actionDeckMax })
      }),

      handSize: new fields.SchemaField({
        base: new fields.NumberField({ required: true, integer: true, min: 1, initial: d.handSize })
      }),

      /*
       * How much formula strength you may have prepared at once (core-rules 4). Stored as a base
       * like carry and deck size, because levelling raises it and features may too. Zero for
       * anyone who has never taken a Way of Mind or Way of Faith node, which is most characters.
       */
      spellSlots: new fields.SchemaField({
        base: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      // The Cards documents this character plays from. Copies of an actor share these ids, which is
      // how NPCs of one type come to share a deck -- see npc below.
      decks: new fields.SchemaField({
        action: new fields.DocumentIdField(),
        actionHand: new fields.DocumentIdField(),
        actionDiscard: new fields.DocumentIdField(),
        actionSpent: new fields.DocumentIdField(),
        fate: new fields.DocumentIdField(),
        fateDiscard: new fields.DocumentIdField()
      }),

      conditions: conditionField(),

      way: new fields.StringField({ required: false, blank: true, initial: "", choices: [...Object.keys(CARDRPG.ways), ""] }),
      background: new fields.StringField({ required: false, blank: true, initial: "" }),

      // Structured, because training changes a number: an untrained user caps a tool bonus at +1.
      trainings: new fields.ArrayField(new fields.StringField()),
      // Prose, because know-how names a situation no engine can evaluate.
      knowHow: new fields.ArrayField(new fields.StringField()),

      biography: new fields.HTMLField(),
      appearance: new fields.HTMLField(),

      // GM tier: data on a character that its own player must not see (actor-schema 7.1).
      gmNotes: new fields.HTMLField()
    };
  }

  /* -------------------------------------------- */

  /** Everything computed. Runs again whenever a slate or card moves. */
  prepareDerivedData() {
    const d = CARDRPG.defaults;
    const slates = this.parent.items;

    // --- what the features grant
    const grants = { health: 0, handSize: 0, carry: 0, deckMax: 0, spellSlots: 0 };
    for (const slate of slates) {
      if (slate.type !== "feature") continue;
      for (const k of Object.keys(grants)) grants[k] += slate.system.grants?.[k] ?? 0;
    }

    // --- taint and afflicted (counted from the decks, so derived)
    const taint = this.#countCards("taint");
    this.taint = taint;
    this.afflicted = taint.total >= d.afflictedAt;
    this.wounds = this.#countCards("wound").total;

    // --- health
    this.health.max = Math.max(1,
      this.health.base + grants.health - (this.afflicted ? d.afflictedHealthPenalty : 0));
    this.health.value = Math.min(this.health.value, this.health.max);

    /*
     * --- spell slots
     * Measured in formula strength, not in spells: a strength-3 formula fills three. `used` is
     * derived from the prepared slates, so nothing can drift out of step with what is on the sheet,
     * and over-preparation shows as a negative `free` rather than being silently refused here --
     * the sheet is where that is reported, as it is for deck size.
     */
    this.spellSlots.max = this.spellSlots.base + grants.spellSlots;
    this.spellSlots.used = slates
      .filter(i => i.type === "spell")
      .reduce((n, i) => n + (i.system.slotCost ?? 0), 0);
    this.spellSlots.free = this.spellSlots.max - this.spellSlots.used;

    // --- hand size and deck limits
    this.handSize.max = this.handSize.base + grants.handSize;
    this.actionDeck.bonus = grants.deckMax;
    this.actionDeck.max = this.actionDeck.base + grants.deckMax;
    this.actionDeck.min = d.actionDeckMin;
    // Wounds and Taint don't count toward the limit, so a wounded character is never locked out.
    this.actionDeck.size = this.#countCards("action").total;

    // --- armor, from the equipped body slate, after anything that has eaten it
    this.armor = slates
      .filter(i => i.type === "item" && i.system.equippedSlot === "body")
      .reduce((n, i) => n + (i.system.armorNow ?? i.system.armor ?? 0), 0);

    // --- carried weight and encumbrance
    this.carry.bonus = grants.carry;
    this.carry.max = this.carry.base + grants.carry;
    // Everything you own is on you: equipped, or in the pack. There is nowhere else to put it.
    const gear = slates
      .filter(i => i.type === "item")
      .reduce((n, i) => n + (i.system.weight ?? 0), 0);
    this.carry.value = gear + Math.floor(this.cash.gold / d.goldPerKilo);
    this.encumbrance = CharacterData.encumbranceTier(this.carry.value, this.carry.max);

    // --- exhaustion is a deck fact, so it is derived too
    const hand = this.#deck("actionHand");
    const draw = this.#deck("action");
    // A card flagged `drawn` is out in the hand, not in the pile, so it is not counted here --
    // otherwise the draw bar reads full while the deck has nothing left to give.
    const left = available(draw).length;
    this.exhausted = left === 0 && (hand?.cards.size ?? 0) < 2;

    this.deckCounts = {
      draw: left,
      hand: hand?.cards.size ?? 0,
      discard: this.#deck("actionDiscard")?.cards.size ?? 0,
      spent: this.#deck("actionSpent")?.cards.size ?? 0,
      fate: available(this.#deck("fate")).length,
      fateDiscard: this.#deck("fateDiscard")?.cards.size ?? 0
    };

    // Chance the next fate draw is a swing. Miss and Critical both reshuffle, so between
    // reshuffles the deck always still holds exactly one of each: 2/k with k cards left.
    this.fateSwing = this.deckCounts.fate > 0
      ? Math.min(1, 2 / this.deckCounts.fate)
      : null;
  }

  /* -------------------------------------------- */

  /**
   * Three tiers, where the limit is its name. Over double you can't pick it up at all.
   * @returns {"unburdened"|"burdened"|"overloaded"|"immobile"}
   */
  static encumbranceTier(carried, max) {
    if (carried <= max) return "unburdened";
    if (carried <= max * 1.5) return "burdened";
    if (carried <= max * 2) return "overloaded";
    return "immobile";
  }

  /** Conditions, including the two the encumbrance tier computes rather than anyone applying. */
  get activeConditions() {
    const list = this.conditions.map(c => ({ ...c }));
    if (this.encumbrance === "burdened") list.push({ key: "burdened", duration: null, creatorId: "" });
    if (this.encumbrance === "overloaded" || this.encumbrance === "immobile") {
      list.push({ key: "overloaded", duration: null, creatorId: "" });
    }
    return list;
  }

  /** Icon keys switched off right now, by condition or by an item drawback. */
  get blockedIcons() {
    const blocked = new Set();
    for (const c of this.activeConditions) {
      for (const icon of CARDRPG.conditions[c.key]?.blocks ?? []) blocked.add(icon);
    }
    return blocked;
  }

  /*
   * The three conditions below used to be hardcoded by key in the tray, or not implemented at all,
   * while config.mjs carried flags for them that nothing read. These make the flags the truth, the
   * way `blocks` already is: a new condition that costs a secondary needs a config entry and
   * nothing else.
   */

  /** True while a condition costs you your secondary (Dazed). */
  get noSecondary() {
    return this.activeConditions.some(c => CARDRPG.conditions[c.key]?.blocksSecondary);
  }

  /** True while a condition costs you your reactions (Stunned, Unconscious). */
  get noReactions() {
    return this.activeConditions.some(c => CARDRPG.conditions[c.key]?.blocksReactions);
  }

  /**
   * True while a condition halves your Move (Slowed, Burdened, Overloaded). Move is never resolved
   * by the engine -- figures are pushed around by hand -- so what this changes is the number on the
   * card face, which is exactly where a player needs to be told.
   */
  get moveHalved() {
    return this.activeConditions.some(c => CARDRPG.conditions[c.key]?.halvesMove);
  }

  /** How much is taken off a Move after halving (Frozen). The highest applies; they do not add. */
  get moveReduction() {
    let worst = 0;
    for (const c of this.activeConditions) {
      if (CARDRPG.conditions[c.key]?.reducesMove) worst = Math.max(worst, c.value ?? 1);
    }
    return worst;
  }

  /** A printed Move value as it actually plays: halved, then reduced, floored at 0 (core-rules 7). */
  movePlayed(printed) {
    const halved = this.moveHalved ? Math.floor(printed / 2) : printed;
    return Math.max(0, halved - this.moveReduction);
  }

  /* -------------------------------------------- */

  #deck(which) {
    const id = this.decks?.[which];
    return id ? game.cards?.get(id) : null;
  }

  /** Count cards of a subtype across draw, hand, discard and spent. */
  #countCards(type) {
    const out = { total: 0, body: 0, mind: 0 };
    for (const which of ["action", "actionHand", "actionDiscard", "actionSpent"]) {
      for (const card of this.#deck(which)?.cards ?? []) {
        if (card.type !== type) continue;
        out.total++;
        if (card.system?.flavour) out[card.system.flavour]++;
      }
    }
    return out;
  }
}

/* -------------------------------------------- */
/*  NPC                                         */
/* -------------------------------------------- */

export class NpcData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      health: healthField(5),
      block: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      blockPersists: new fields.BooleanField({ initial: false }),

      /**
       * The creature type. An NPC's action deck, fate deck and intent card all belong to the TYPE,
       * not the actor (core-rules 3, 6, 9): five goblins reference one of each. Unlinked tokens of
       * one prototype get their own health while sharing these ids, which is exactly what we want.
       */
      kind: new fields.StringField({ required: true, blank: true, initial: "" }),

      decks: new fields.SchemaField({
        action: new fields.DocumentIdField(),
        actionDiscard: new fields.DocumentIdField(),
        fate: new fields.DocumentIdField(),
        fateDiscard: new fields.DocumentIdField(),
        intent: new fields.DocumentIdField()
      }),

      /*
       * An NPC's passive score, used for every approach when it saves against a condition
       * (core-rules 7). A character derives this from their skill deck; an NPC has none, so it
       * carries one flat number instead -- which is also the only knob needed to say how hard a
       * monster is to hold, blind or frighten.
       */
      passive: new fields.NumberField({ required: true, integer: true, min: 0, initial: 4 }),

      // Flat, for a creature with no body slate. Overridden by gear when it has some.
      armorBase: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),

      tactics: new fields.ArrayField(new fields.StringField({ choices: Object.keys(CARDRPG.tactics) })),
      targetPriority: new fields.StringField({
        required: true, initial: "nearest", choices: Object.keys(CARDRPG.targetPriorities)
      }),

      // revealed is mechanical, not cosmetic: the rules give four ways for players to learn one.
      motivations: new fields.ArrayField(new fields.SchemaField({
        text: new fields.StringField({ required: true }),
        revealed: new fields.BooleanField({ initial: false })
      })),
      revealedTactics: new fields.ArrayField(new fields.StringField()),

      elite: new fields.BooleanField({ initial: false }),
      conditions: conditionField(),
      notes: new fields.HTMLField()
    };
  }

  prepareDerivedData() {
    const gear = this.parent.items.filter(i => i.type === "item" && i.system.equipped);
    this.armor = this.armorBase + gear
      .filter(i => i.system.equippedSlot === "body")
      .reduce((n, i) => n + (i.system.armorNow ?? i.system.armor ?? 0), 0);
    this.health.max = this.health.base;
    this.health.value = Math.min(this.health.value, this.health.max);
    // NPCs never exhaust and hold no hand (core-rules 9).
    this.exhausted = false;
  }

  get activeConditions() {
    return this.conditions.map(c => ({ ...c }));
  }

  get blockedIcons() {
    const blocked = new Set();
    for (const c of this.conditions) {
      for (const icon of CARDRPG.conditions[c.key]?.blocks ?? []) blocked.add(icon);
    }
    return blocked;
  }
}
