/**
 * Actor data models.
 *
 * The governing principle (foundry/actor-schema.md): store the minimum, derive the rest. Carried
 * weight, encumbrance, max health, armor, hand size, deck size and exhaustion are all computed from
 * cards and slates. Store any of them and they go stale the moment a slate moves.
 */

import { CARDRPG } from "../config.mjs";
import { available } from "../decks.mjs";
import {
  ownedIds, grantsOf, levelOf, titleOf, tacticOf, termsOf, waysOf, frontier
} from "../graph.mjs";
/* The one place the grant sum lives, in a module with no Foundry global so the validator can ask
 * it rather than read it. */
import { sumGrants, CHARACTER_GRANTS, NPC_GRANTS, adaptedNames, injuryBites } from "../grants.mjs";

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
     * prints it only when it is there -- so most tokens still show one number.
     *
     * The floor is 0, not 1, because Poisoned 0 is a real rung: the nausea with no damage behind it.
     * A valued condition is free to have a bottom rung that does nothing but its side effect.
     */
    value: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
    creatorId: new fields.StringField({ required: false, blank: true, initial: "" }),
    /*
     * **A bonus this instance of the condition carries.**
     *
     * The second thing a condition has been able to hold: `creatorId` was the first, and the
     * conditions document names it as the precedent -- *Compelled stores who compelled*. A tattoo
     * grants +2 Strike with Heavy items and another grants +2 Strike flat, and both are Graven, so
     * the payload cannot live on the config.
     */
    bonus: new fields.SchemaField({
      verb: new fields.StringField({ required: false, blank: true, initial: "" }),
      value: new fields.NumberField({ integer: true, nullable: true, initial: null }),
      requiresTag: new fields.StringField({ required: false, blank: true, initial: "" })
    })
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

/**
 * **How many things a slot really holds, for either kind of actor.**
 *
 * Shared for the same reason `blockedReactionsOf` is: the tray's `#makeRoom` equips gear onto
 * whatever actor it was handed, and a monster is one of those. A method on the character model
 * alone would have thrown the first time a GM put a sword in a troll's hand.
 */
/**
 * **The injuries on this actor whose arithmetic still applies.**
 *
 * One list, asked by all four readers below, because *Adapted* has to reach every one of them or
 * it is a levelling option that works on a sheet and not in a fight. The fifth reader is the
 * grant sum, which does this inside `sumGrants` for the same reason.
 */
function bitingInjuries(system) {
  const slates = [...(system.parent?.items ?? [])];
  const adapted = adaptedNames(slates);
  return slates.filter(s => injuryBites(s, adapted));
}

function slotCapacityOf(system, slot) {
  const base = CARDRPG.slots[slot]?.capacity;
  if (base === null || base === undefined) return base;
  if (slot !== "hands") return base;
  let lost = 0;
  for (const slate of bitingInjuries(system)) lost += slate.system.takes?.handSlots ?? 0;
  return Math.max(0, base - lost);
}

/**
 * **Reactions switched off right now (core-rules 3), for either kind of actor.**
 *
 * This getter was written out **twice**, identically, once in each actor model -- which is the
 * defect this project keeps finding, and the reason to fix it here rather than later is that
 * injuries are the third thing that can take a reaction away. Adding them to one copy and not
 * the other would have left a maimed character reacting on their own sheet and not in a fight,
 * and every check would still have passed. The DEAD set in combat_sim.py was the same lesson in
 * another language on the same day.
 *
 * Three sentences that must not share a field, and now visibly do not:
 *
 * - a **condition** takes all of them (Stunned, Unconscious);
 * - **worn gear** takes the ones it names, and a stowed thing takes nothing -- Plate in the pack
 *   is luggage;
 * - an **injury** takes the ones it names and there is nothing to take off, which is what makes
 *   it an injury. `firstRoundOnly` is the one dial on that: *Shattered nerves* blocks only in
 *   round 1, so the hero who survives the opening keeps their reactions for the rest of it.
 */
/**
 * **How far a printed line really reaches, which nothing has ever worked out.**
 *
 * **[FOUND IN CODE 2026-11-08]** `bonus.range` has been a field on the item and feature schemas
 * since tools were built, and **no code has ever read it**. `collectBonuses` skips a bonus with
 * no `value` on its first line, and only ever sums `value` -- so **Good Aim**, a shipped feature
 * whose entire text is *"+2 range on Ranged and Thrown items"*, has done nothing at all since the
 * day it was written. The sheet and the tray print `l.range` straight off the item.
 *
 * It came to light from the other direction: *Lost Eye* is *"range -2 with a ranged weapon"*, and
 * writing it as a negative `bonus.range` would have been the same nothing with a minus sign.
 *
 * This is the same defect as `bonus.approach` on a feature, one field along: **the field existed
 * and the reader did not.** Range is never *enforced* by the engine -- figures are pushed around
 * by hand, like Move -- so what a modifier to it can change is the number printed on the line,
 * which is exactly where the player reads it. That makes this the counterpart of `movePlayed`.
 *
 * Floored at 1: a ranged line that reaches zero squares is not a weapon, and two lost eyes is
 * not a thing the cap allows anyway.
 */
function rangeOnLine(system, line, item) {
  const base = line?.range ?? null;
  if (base === null) return null;
  let n = 0;
  const slates = [...(system.parent?.items ?? [])];
  const adapted = adaptedNames(slates);
  for (const slate of slates) {
    const bonus = slate.system?.bonus;
    if (!bonus?.range || bonus.verb !== "strike") continue;
    /* An adapted Lost Eye reaches as far as it ever did. */
    if (slate.type === "injury" && !injuryBites(slate, adapted)) continue;
    /* Equipped-or-standing, the same law grants.mjs encodes: a ring in the pack grants nothing. */
    if (slate.type === "item"
      && (!slate.system.equipped || CARDRPG.slots[slate.system.equippedSlot]?.stows)) continue;
    if (slate.system.drained) continue;
    /* The tag is about the weapon the line belongs to, not the slate carrying the bonus. */
    if (bonus.requiresTag && !(item?.system?.tags ?? []).includes(bonus.requiresTag)) continue;
    n += bonus.range;
  }
  return Math.max(1, base + n);
}

function blockedReactionsOf(system) {
  const blocked = new Set();
  if (system.noReactions) return new Set(Object.keys(CARDRPG.reactions));
  const round = game.combat?.round ?? 0;
  for (const slate of bitingInjuries(system)) {
    if (slate.system.firstRoundOnly && round > 1) continue;
    for (const key of slate.system.blocksReactions ?? []) blocked.add(key);
  }
  for (const slate of system.parent?.items ?? []) {
    if (slate.type !== "item" || !slate.system.equipped) continue;
    if (CARDRPG.slots[slate.system.equippedSlot]?.stows) continue;
    for (const key of slate.system.blocksReactions ?? []) blocked.add(key);
  }
  return blocked;
}

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const d = CARDRPG.defaults;
    return {
      health: healthField(12),

      // Transient: cleared at the start of your turn. A Defend primary holds for the round.
      block: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      blockPersists: new fields.BooleanField({ initial: false }),
      /*
       * Standing behind something (core-rules 11): ranged attacks against this figure have
       * disadvantage. Declared by the GM rather than traced across the canvas -- see advantageFor
       * in resolve.mjs for why automatic cover from figures is deliberately not computed.
       */
      cover: new fields.BooleanField({ initial: false }),

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
      /**
       * **The weapon and the formula this character reaches for without being asked.**
       *
       * Two ids, at most one of each, and the thing they are for is a tray that does not have to
       * ask: staging a Strike should put a weapon in the stack and staging a Cast should put a
       * formula there, without a second click whose answer is the same every turn of the game.
       *
       * **It is a preference and not a rule**, which is the whole of why it lives here rather than
       * anywhere the engine reads. `resolveAttack` still takes the item it is handed and `itemFor`
       * still works out what can serve a verb; nothing downstream knows this field exists. A
       * default that silently changed what an action *did* would be a rule written in a settings
       * panel, which is the worst place to keep one.
       *
       * Blank is a real answer. A character holding two swords and preferring neither should be
       * asked, because for them it is a decision every turn rather than a formality.
       */
      defaults: new fields.SchemaField({
        weapon: new fields.StringField({ required: false, blank: true, initial: "" }),
        spell: new fields.StringField({ required: false, blank: true, initial: "" })
      }),

      decks: new fields.SchemaField({
        action: new fields.DocumentIdField(),
        actionHand: new fields.DocumentIdField(),
        actionDiscard: new fields.DocumentIdField(),
        actionSpent: new fields.DocumentIdField(),
        fate: new fields.DocumentIdField(),
        fateDiscard: new fields.DocumentIdField(),
        /*
         * The skill deck (skill-rules 1), and `skill` is the id `passiveScore` has been reading
         * since it was written. It was never declared, so it was always undefined and a character's
         * passive score was always the flat 2 an NPC uses. Three stacks like the action side, and
         * for the same reasons -- except the discard does NOT come back by itself: skill-rules 1 is
         * explicit that it returns on a rest and not on a shuffle.
         */
        skill: new fields.DocumentIdField(),
        skillHand: new fields.DocumentIdField(),
        skillDiscard: new fields.DocumentIdField(),
        /*
         * **Where a quarantined card waits.** A transformation takes some of the player's own cards
         * out of play and gives them back when it ends, and "gives back" is movement rather than a
         * flag -- a flag on a card would have to be respected by every place that offers one.
         *
         * It is a pile and not a deck, so it gets no back: nothing is ever drawn from it and
         * nobody looks at it face down. It is a shelf.
         */
        quarantine: new fields.DocumentIdField()
      }),

      conditions: conditionField(),

      /*
       * The levelling graph, and the whole of it: rules/leveling.md 9 says a character stores only
       * the list of node ids they own, and that level, title, frontier and every reward derive from
       * that list. Ordered, because the order they were taken in is the only record of the route.
       *
       * `pending` is what a level-up button may spend. It exists because section 2 says *the GM
       * says when* -- without a counter the GM grants nothing and a player could level at will.
       */
      nodes: new fields.ArrayField(new fields.StringField()),
      levels: new fields.SchemaField({
        pending: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      way: new fields.StringField({ required: false, blank: true, initial: "", choices: [...Object.keys(CARDRPG.ways), ""] }),
      background: new fields.StringField({ required: false, blank: true, initial: "" }),

      // Structured, because training changes a number: an untrained user caps a tool bonus at +1.
      trainings: new fields.ArrayField(new fields.StringField()),
      // Prose, because know-how names a situation no engine can evaluate.
      knowHow: new fields.ArrayField(new fields.StringField()),
      /*
       * Languages, which are binary the way a training is: you read Reversed or you do not. Stored
       * here as well as derived from the graph because a background gives what you grew up with
       * (rules/backgrounds.md) and the graph gives what you studied.
       */
      languages: new fields.ArrayField(new fields.StringField()),

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

    /*
     * --- what features and worn items grant
     *
     * A feature is simply true; an item has to be EQUIPPED, which is what makes a ring that grants
     * a spell slot a thing you can take off (rules/equipment.md 9.2). Items were excluded here
     * until the magic items were written, so a granting item silently granted nothing.
     */
    const grants = sumGrants(slates, CHARACTER_GRANTS);

    /*
     * --- and what the levelling graph grants
     *
     * The same accumulator, deliberately: a node granting Health is summed by the line that sums a
     * ring granting Health. This is where leveling.md 9's promise is kept or broken -- nothing is
     * copied onto the sheet, so a node definition corrected tomorrow fixes every character who
     * took it and there is nothing to migrate.
     */
    const owned = ownedIds(this.parent);
    const fromNodes = grantsOf(owned);
    for (const k of Object.keys(grants)) grants[k] += fromNodes[k] ?? 0;

    this.level = levelOf(owned);
    this.title = titleOf(owned);
    /* One Tactic, the deepest title's, derived rather than granted -- way-cards 2.5 says you only
     * ever have that one, and a slate per title would accumulate them. */
    this.tactic = tacticOf(owned);
    /* And every god's standing terms, which unlike a Tactic accumulate: you pay all of them. */
    this.terms = termsOf(owned);
    this.waysOwned = waysOf(owned);
    this.frontier = frontier(owned);
    /* Trainings and know-how are additive rather than overwritten: a background gives some and the
     * graph gives more (leveling 4, "the skill side"), and the stored ones stay editable. */
    this.learned = {
      trainings: [...new Set([...this.trainings, ...fromNodes.trainings])],
      knowHow: [...this.knowHow, ...fromNodes.knowHow],
      /* Deduped like a training and for the same reason: two nodes may teach one tongue, and
       * knowing Imperial twice is knowing Imperial. */
      languages: [...new Set([...this.languages, ...fromNodes.languages])].sort(),
      /*
       * Masteries are derived and never stored: a mastery raises a passive score, and a passive is
       * computed from the deck every time it is asked for (resolve.mjs). Nothing to migrate when a
       * node is corrected, which is leveling 9's promise.
       */
      masteries: [...fromNodes.masteries].sort(),
      /* What the graph has offered. Whether a card was actually raised lives on the card. */
      expertise: [...fromNodes.expertise].sort()
    };

    // --- taint and afflicted (counted from the decks, so derived)
    const taint = this.#countCards("taint");
    this.taint = taint;
    this.afflicted = taint.total >= d.afflictedAt;
    this.wounds = this.#countCards("wound").total;

    // --- health
    this.health.max = Math.max(1,
      this.health.base + grants.health - (this.afflicted ? d.afflictedHealthPenalty : 0));
    this.health.value = Math.min(this.health.value, this.health.max);

    // --- rest tokens. The stored max is the base, as health's is; a node may add to it (section 4).
    this.rest.max = this.rest.max + fromNodes.restTokens;
    this.rest.tokens = Math.min(this.rest.tokens, this.rest.max);

    /*
     * --- spell slots
     * Measured in formula strength, not in spells: a strength-3 formula fills three. `used` is
     * derived from the prepared slates, so nothing can drift out of step with what is on the sheet,
     * and over-preparation shows as a negative `free` rather than being silently refused here --
     * the sheet is where that is reported, as it is for deck size.
     */
    this.spellSlots.max = this.spellSlots.base + grants.spellSlots;
    /*
     * And the one grant that is not addition: The First's Obedience caps the budget for good, so
     * the cap is applied after everything that raises it. Nothing else in the game does this, which
     * is why it is a line here rather than a mechanism.
     */
    if (fromNodes.slotCap !== null) {
      this.spellSlots.max = Math.min(this.spellSlots.max, fromNodes.slotCap);
    }
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

    /*
     * --- armor, from every WORN slot, after anything that has eaten it
     *
     * `worn` rather than `=== "body"`: a helmet in the head slot contributed nothing whatever it
     * said, which made five of the ten slots unusable for armour and is why nothing had ever been
     * written for cloak, head, neck, fingers or feet (rules/equipment.md 5).
     */
    this.armor = grants.armor + slates
      .filter(i => i.type === "item" && CARDRPG.slots[i.system.equippedSlot]?.worn)
      .reduce((n, i) => n + (i.system.armorNow ?? i.system.armor ?? 0), 0);

    /*
     * --- armour again, for the one feature that reads the encumbrance tier
     *
     * This has to come after the tier is known, which is why it is not up with the armour sum: the
     * Ironclad doubles armour only while Overloaded, and Overloaded is itself derived from weight.
     */
    this.armorDoubled = false;

    // --- carried weight and encumbrance
    this.carry.bonus = grants.carry;
    this.carry.max = this.carry.base + grants.carry;
    // Everything you own is on you: equipped, or in the pack. There is nowhere else to put it.
    const gear = slates
      .filter(i => i.type === "item")
      .reduce((n, i) => n + (i.system.weight ?? 0), 0);
    this.carry.value = gear + Math.floor(this.cash.gold / d.goldPerKilo);
    this.encumbrance = CharacterData.encumbranceTier(this.carry.value, this.carry.max);
    if (["overloaded", "immobile"].includes(this.encumbrance)
      && slates.some(i => i.type === "feature" && i.system.armor?.doubleWhenOverloaded)) {
      this.armor *= 2;
      this.armorDoubled = true;
    }

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

  /**
   * Conditions, including the ones nobody applies: two the encumbrance tier computes, and the ink.
   *
   * **A feature whose step applies a permanent condition IS that condition.** It is derived rather
   * than applied, and that is the whole reason the Graven line can be a feature at all: there is no
   * grant-time hook to forget to run, nothing to clean up when the feature is deleted, and no way
   * for the document and the condition to disagree about whether the tattoo is there. A tattoo is
   * on you because the tattoo is on you.
   *
   * The gate is the condition's own `permanent` flag, not the step's timing. A feature that applied
   * a TIMED condition would need something to apply it at a moment, and a moment is what a feature
   * does not have -- so only a permanent one is derived, which gives that flag a second job beyond
   * telling the removal table there is no answer.
   *
   * `creatorId` is the feature's own id, so two tattoos are two conditions and the sheet can say
   * which is which. They share a group -- the condition's key -- so their bonuses cap each other.
   */
  get activeConditions() {
    const list = this.conditions.map(c => ({ ...c }));
    if (this.encumbrance === "burdened") list.push({ key: "burdened", duration: null, creatorId: "" });
    if (this.encumbrance === "overloaded" || this.encumbrance === "immobile") {
      list.push({ key: "overloaded", duration: null, creatorId: "" });
    }
    for (const slate of this.parent?.items ?? []) {
      if (slate.type !== "feature") continue;
      const step = slate.system?.effect;
      if (!step?.condition || !CARDRPG.conditions[step.condition]?.permanent) continue;
      list.push({
        key: step.condition, duration: null, creatorId: slate.id,
        ...(step.bonus?.value
          ? { bonus: { verb: step.bonus.verb ?? "", value: step.bonus.value,
            requiresTag: step.bonus.requiresTag ?? "" } }
          : {})
      });
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

  /** True while a condition costs you the whole turn (Halted). */
  get noTurn() {
    return this.activeConditions.some(c => CARDRPG.conditions[c.key]?.blocksTurn);
  }

  /** True while a condition costs you your reactions (Stunned, Unconscious). */
  get noReactions() {
    return this.activeConditions.some(c => CARDRPG.conditions[c.key]?.blocksReactions);
  }

  /**
   * **The default for a verb, resolved rather than trusted.**
   *
   * An id outlives the thing it names: a default weapon can be dropped, sold, unequipped, slung
   * over a back or corroded past use, and a stale id would put a ghost in the stack. So this asks
   * the actor every time and answers `null` the moment the answer stops being true.
   *
   * **A spell has to be prepared and an item has to be equipped**, which are two laws that already
   * exist rather than new ones (core-rules 4; `payToCast`). Neither is softened for being a
   * favourite. And it has to be able to do the thing -- a shield is equipped and strikes with
   * nothing -- so the verb is checked against what the slate actually offers.
   */
  defaultFor(verb) {
    const id = verb === "cast" ? this.defaults?.spell : this.defaults?.weapon;
    if (!id) return null;
    const slate = this.parent?.items?.get(id);
    if (!slate) return null;
    if (slate.type === "spell") return slate.system.prepared ? slate : null;
    if (slate.type !== "item") return null;
    if (!slate.system.equipped) return null;
    if (CARDRPG.slots[slate.system.equippedSlot]?.stows) return null;
    return slate.system.availableVerbs.includes(verb) ? slate : null;
  }

  /** Reactions switched off right now (core-rules 3). One answer for both models, above. */
  get blockedReactions() {
    return blockedReactionsOf(this);
  }

  /** A printed range as it actually reads, once Good Aim and a lost eye have had their say. */
  rangeOnLine(line, item) {
    return rangeOnLine(this, line, item);
  }

  /**
   * True while a condition halves your Move (Slowed, Burdened, Overloaded). Move is never resolved
   * by the engine -- figures are pushed around by hand -- so what this changes is the number on the
   * card face, which is exactly where a player needs to be told.
   */
  get moveHalved() {
    return this.activeConditions.some(c => CARDRPG.conditions[c.key]?.halvesMove);
  }

  /** How much a condition takes off a Move after halving. The highest applies; they do not add. */
  get moveReduction() {
    let worst = 0;
    for (const c of this.activeConditions) {
      if (CARDRPG.conditions[c.key]?.reducesMove) worst = Math.max(worst, c.value ?? 1);
    }
    return worst;
  }

  /**
   * **How much an injury takes off a Move, which is a different subtraction with a different
   * floor** -- and folding the two together was a real bug, caught by measuring it.
   *
   * ideas.md wrote *Bad leg: all Move values -1 (**minimum 1**)*, and that parenthesis is the
   * whole of this comment. Dropped, a bad leg measured at **-25.4 win rate** against the published
   * encounters and **-38.5 against archers** -- 40.0% down to 1.5%, seven times the most
   * expensive card in the game. The cause is not that -1 is harsh: it is that the starter deck's
   * commonest Move value **is** 1, so a flat -1 with a floor of zero does not slow the hero down,
   * it deletes half their movement, and the archer fight is entirely about closing.
   *
   * So the two subtractions keep their own floors, and the sentence each one is reads cleanly:
   * **a bad leg slows you (floor 1); a frozen leg stops you (floor 0).** The highest injury
   * applies rather than the sum, as conditions already do.
   */
  get injuryMoveReduction() {
    let worst = 0;
    for (const slate of bitingInjuries(this)) {
      worst = Math.max(worst, slate.system.takes?.move ?? 0);
    }
    return worst;
  }

  /**
   * **How many hands this slot really holds**, which was `CARDRPG.slots[slot].capacity` read
   * straight out of config in two places -- the sheet's slot panel and the tray's `#makeRoom`.
   *
   * Two readers of one constant is how a rule comes to be true in whichever place was edited
   * last, and *Lost hand* is the first thing in the game that makes the constant wrong. So it is
   * a derived number now and both callers ask for it.
   *
   * `null` stays `null`: the pack has no capacity and an injury does not give it one.
   */
  slotCapacity(slot) {
    return slotCapacityOf(this, slot);
  }

  /**
   * A printed Move value as it actually plays (core-rules 7, 8).
   *
   * In order, and the order is the rule: the **injury** first, which can never take you below 1
   * square; then **halved** if a condition halves it; then the **condition's** own reduction,
   * which can take you to 0. A leg that healed wrong is not the same sentence as a leg frozen to
   * the ground, and before they were the same subtraction.
   */
  movePlayed(printed) {
    const injured = printed > 0
      ? Math.max(1, printed - this.injuryMoveReduction)
      : printed;
    const halved = this.moveHalved ? Math.floor(injured / 2) : injured;
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
      /*
       * Standing behind something (core-rules 11): ranged attacks against this figure have
       * disadvantage. Declared by the GM rather than traced across the canvas -- see advantageFor
       * in resolve.mjs for why automatic cover from figures is deliberately not computed.
       */
      cover: new fields.BooleanField({ initial: false }),

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

      /*
       * **How far it moves when a card says "your speed".** An intent card prints a shape and the
       * creature supplies the numbers (core-rules 9), exactly as a card half takes its Strike off
       * the item -- so `Close In` is three squares for a goblin and eight for a rush spider, from
       * one card. Zero is a real value: the Queen does not move.
       */
      speed: new fields.NumberField({ required: true, integer: true, min: 0, initial: 3 }),
      /*
       * **What it can do, which is what its deck is built from.** A card lists the capabilities it
       * needs and a creature draws the subset it qualifies for (monsters.mjs), so a Goblin Archer
       * earns *Loose* by being able to shoot and a spearman does not.
       */
      capabilities: new fields.ArrayField(new fields.StringField({
        choices: Object.keys(CARDRPG.capabilities)
      })),
      /*
       * The condition this creature's attacks carry, if any: one card in the pool is *Strike, and
       * it carries whatever you carry*, which is how a goblin's dirty trick, a slitherer's venom, a
       * Keres' disease and a Strigoi's bite are one card.
       */
      signature: new fields.SchemaField({
        condition: new fields.StringField({
          required: false, blank: true, initial: "",
          choices: [...Object.keys(CARDRPG.conditions), ""]
        }),
        intensity: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
        duration: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null })
      }),
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
      .filter(i => CARDRPG.slots[i.system.equippedSlot]?.worn)
      .reduce((n, i) => n + (i.system.armorNow ?? i.system.armor ?? 0), 0);

    /*
     * --- what a monster's features and gear grant
     *
     * **This line did not exist, and its absence was silent.** `CharacterData` sums the `grants` of
     * every feature and every equipped item -- Health, hand size, carry, deck max, spell slots --
     * and this model summed none of them: `health.max` was `health.base` and nothing else. So a
     * feature called *Thick Hide* granting 4 Health read correctly on the sheet, passed every
     * check, and changed no number. The field existed and the reader did not, which is the shape
     * this project keeps digging out.
     *
     * **Health is the only one summed here, and that is not laziness.** An NPC holds no hand and
     * never exhausts (core-rules 9), has no encumbrance, and has neither a deck maximum nor a spell
     * slot in its schema -- so the other four keys have nothing to raise. A grant that names one is
     * content pointed at a field this model does not have, which is why the validator refuses it
     * rather than this function quietly adding it to nothing.
     *
     * The same shape as the character's, deliberately: a feature is simply true, an item has to be
     * EQUIPPED, so a looted amulet stops working when it is taken off the thing you looted it from.
     */
    const granted = sumGrants(this.parent.items, NPC_GRANTS);

    this.health.max = Math.max(1, this.health.base + granted.health);
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

  /** As the character's. An NPC has no encumbrance, so `conditions` is the whole list. */
  get noReactions() {
    return this.conditions.some(c => CARDRPG.conditions[c.key]?.blocksReactions);
  }

  get blockedReactions() {
    return blockedReactionsOf(this);
  }

  /** A monster can lose a hand too, and the tray equips gear through this. */
  slotCapacity(slot) {
    return slotCapacityOf(this, slot);
  }

  /** And a monster with a bow reads its range the same way. */
  rangeOnLine(line, item) {
    return rangeOnLine(this, line, item);
  }
}
