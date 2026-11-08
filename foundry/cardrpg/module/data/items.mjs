/**
 * Slate data models -- Foundry Items.
 *
 * A slate is laid out face up and never shuffled (core-rules 1). Items, features, injuries and
 * secrets are slates; anything drawn from a deck is a Card instead. Combat playtest scope covers
 * `item` and `feature`.
 *
 * **This paragraph named four kinds and the file held three**, for as long as it has existed, and
 * core-rules 1's own slate table names the same four -- *"item slates, feature slates, secret
 * slates, permanent injuries"*. An injury is now the fourth. Secrets are still prose, and they are
 * prose for a reason the injury did not have: a secret is a slate the GM keeps and the player
 * cannot read, so nothing on the character sheet is its home.
 */

import { CARDRPG } from "../config.mjs";
import { stepField } from "./cards.mjs";

const fields = foundry.data.fields;

/* -------------------------------------------- */
/*  Shared                                      */
/* -------------------------------------------- */

/**
 * An active ability: using it Drains the slate until its recharge comes round (core-rules 4).
 * A numeric recharge counts the owner's turns; a boundary waits for combat's end or a rest.
 * At most one active ability per slate, or a sideways slate is ambiguous.
 */
function activeField() {
  return new fields.SchemaField({
    text: new fields.StringField({ required: false, blank: true, initial: "" }),
    turns: new fields.NumberField({ integer: true, min: 1, nullable: true, initial: null }),
    boundary: new fields.StringField({
      required: false, blank: true, initial: "", choices: [...Object.keys(CARDRPG.recharges), ""]
    })
  });
}

/** Bonus group, present only on a slate that grants a numeric bonus (core-rules 5). */
function groupField() {
  return new fields.StringField({
    required: false, blank: true, initial: "",
    choices: [...Object.keys(CARDRPG.bonusGroups), ""]
  });
}

/** State shared by anything with an active ability. */
function drainFields() {
  return {
    active: activeField(),
    drained: new fields.BooleanField({ initial: false }),
    drainedFor: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null })
  };
}

/** Mixin behaviour for Drained slates. */
class SlateData extends foundry.abstract.TypeDataModel {
  /** Does this slate have an active ability at all? */
  get isActive() {
    return !!(this.active?.text);
  }

  /** How the recharge reads on the face: a turn count or a boundary word. */
  get rechargeLabel() {
    if (!this.isActive) return null;
    if (this.active.turns) return String(this.active.turns);
    if (this.active.boundary) return game.i18n.localize(CARDRPG.recharges[this.active.boundary]);
    return null;
  }

  /** Is the ability available right now? */
  get ready() {
    return this.isActive && !this.drained;
  }
}

/* -------------------------------------------- */
/*  Spell slate                                 */
/* -------------------------------------------- */

/**
 * A spell is a slate, like a sword or a potion (core-rules 4) -- but what it occupies is a **spell
 * slot**, not a slot on your body, so it is deliberately absent from CARDRPG.slots. Spell slots are
 * a budget on the actor, the way carry weight and deck size are, and `strength` is what a formula
 * spends out of it.
 *
 * `strength` 1-5 comes straight from the world document, where every magic school states it, and it
 * is the slot cost: a strength-3 formula fills three slots. That is why "some spells cost more than
 * one slot" needed no rule of its own.
 *
 * Unprepared spells are not thrown away -- they sit in the spell book, which is this slate with
 * `prepared: false`. Only prepared spells can be cast.
 */
export class SpellSlateData extends SlateData {
  static defineSchema() {
    return {
      strength: new fields.NumberField({
        required: true, integer: true, min: 1, max: 5, initial: 1
      }),
      /**
       * A formula is studied and a miracle is granted, which is the whole difference between Way of
       * Mind and Way of Faith: a formula is paid for once, in your own substance, and a miracle is
       * paid for continuously, in obedience. Mechanically the slate is the same, so this field is
       * what lets content and the validator tell them apart.
       */
      kind: new fields.StringField({
        required: true, initial: "formula", choices: ["formula", "miracle"]
      }),
      /**
       * The school or god it comes from. A plain string rather than an enum: the twelve schools and
       * twelve gods are content, and an add-on's thirteenth must not need a config edit.
       */
      source: new fields.StringField({ required: false, blank: true, initial: "" }),

      /** In your head, or in the book. Changed between fights, never during one. */
      prepared: new fields.BooleanField({ initial: false }),

      /*
       * Which event this one answers, for a spell that is cast on somebody else's turn.
       *
       * The same field an action card carries (data/cards.mjs) and for the same reason, but the
       * spending is different: a card reaction is paid by discarding the card, and a spell reaction
       * by **draining the slate** -- which is what Ward Magic's *Spent* means on something that was
       * never in your hand. The drain machinery was already here for item abilities.
       */
      reaction: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...Object.keys(CARDRPG.reactions), ""]
      }),

      /*
       * Which element this one is, for the schools that have them.
       *
       * *Wall of the Sphere* and *The Sphere Entire* both read "a line of **your element**"
       * (way-cards 3.4) and nothing in the rules said how an elementalist came to have one. An
       * elementalist picks **one** and is closed out of the others for good -- `exclusive: "element"`
       * with the element as the `creed` (leveling.md 3), which is the Way of Faith machinery with
       * its second user and its first that is not a god.
       *
       * Blank for every school that does not have elements, which is eleven of the twelve.
       */
      element: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...Object.keys(CARDRPG.elements), ""]
      }),

      /*
       * Wild fate cards that casting this adds to your own deck (core-rules 6).
       *
       * Shadow Magic's whole price, and it is **every spell**, not one per formula: the more a
       * shadow mage reaches, the less they can predict their own luck. A number rather than a
       * boolean because a strength-3 formula reaching further should cost more of the same thing.
       */
      wilds: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),

      /** What casting it does. Same shape as a card step, so a spell may apply a condition. */
      effect: stepField(),

      /*
       * What casting it costs, over and above the slot it occupies.
       *
       * **Six pieces of content were waiting on this one field** and the audit named it the largest
       * gap in the game: three of Blood Magic's formulas and three of Vax's miracles. Two Ways
       * arrived at the same mechanism from opposite ends -- a mage spending their own substance to
       * buy power, and a war god who counts his priest's blood first -- which is the clearest sign
       * a thing belongs in the schema rather than on a card.
       *
       * Health and nothing else, for now. Strain and Spent are costs a CARD HALF pays
       * (data/cards.mjs) and a spell is not a card half; Valtor's *every miracle costs Strain 1* is
       * an obedience, and obediences are the GM's. This is the one price the engine can charge,
       * because Health is a number it already keeps.
       */
      /*
       * **What casting it costs you**, beyond the slot its strength fills.
       *
       * `health` is Blood Magic's price and has been here since there were spells. `taint` is what
       * the Grey asks, and `strain` is cards off your own hand -- both were carried in prose on ten
       * spells, which is also where `scale` was: *Costs 1 Health per ally* is the one shape the
       * amount alone could not say.
       *
       * The step does NOT get a cost of its own, deliberately. A price in two places is a spell
       * that can be charged for twice, by two readers, and `costs` on a card half is already the
       * other half of this idea for a card that is not a spell.
       */
      cost: new fields.SchemaField({
        health: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        taint: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        strain: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        /*
         * **Skill cards set aside to PREPARE it**, which is the Poison school's whole price and
         * the only cost in the game paid at preparing rather than at casting.
         *
         * specializations.md 1 states the rule -- *preparing costs skill cards set aside equal to
         * the formula's strength* -- and names the mechanism as Strain on the skill deck.
         * core-rules 1208 says what Strain is: discard N, and they come back. The skill discard
         * returns on a rest, which makes this per-rest, which is per-preparation: you prepare after
         * a rest and the cards are back by the next one, when you would re-prepare anyway.
         *
         * It is its own currency rather than `strain` with a deck beside it, because the two are
         * not the same thing being spent. Blood Magic pays in *your own substance* and Poison in
         * *your competence outside the fight* (specializations.md 5) -- one is Health and one is
         * the deck you make skill checks with.
         */
        skillCards: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        scale: new fields.StringField({
          required: false, blank: true, initial: "",
          choices: [...Object.keys(CARDRPG.costScales), ""]
        })
      }),

      group: groupField(),
      ...drainFields(),

      description: new fields.HTMLField()
    };
  }

  /** What this costs out of the budget right now. Nothing, while it is still in the book. */
  get slotCost() {
    return this.outsideBudget || !this.prepared ? 0 : this.strength;
  }

  /**
   * **True for a spell that can never be prepared, and so never costs a slot.**
   *
   * One kind now: a **ritual**, which is overnight work and not a thing you hold ready. `timing`
   * has said so since it was built, and a slate can read its own effect, so this is a getter rather
   * than a field -- a second place to say "this is a ritual" is a second place for it to disagree
   * with the first.
   *
   * It used to name **permanent** too, for the Graven line. A permanent is not a spell any more: a
   * thing that needs no preparing is a feature, and the exemption went with the content. Leaving
   * the word here would have been an arm nothing could reach.
   */
  get outsideBudget() {
    return this.effect?.timing === "ritual";
  }

  /**
   * A spell, shaped like an item that can Cast -- which is what lets `resolveAttack` resolve one.
   *
   * **A spell is its own weapon.** Every attack in the game reads its base value off the item in
   * hand, and a formula has no item: *Blood Price* is 4 damage because the formula says 4, not
   * because of what you are holding. Rather than a second resolver for spells, the slate answers
   * the question the resolver asks -- so a spell goes through the same six steps a Strike does,
   * takes the same fate draw, and comes off armour and Block the same way.
   *
   * The step's `mod` is the value, because that is where a formula's number already lived.
   */
  get verbs() {
    const e = this.effect ?? {};
    return {
      cast: {
        value: e.mod ?? 0,
        range: e.range ?? 1,
        area: e.area ?? 0,
        text: e.text ?? ""
      }
    };
  }

  /**
   * A prepared spell needs a free hand and speech; an item's own Cast line needs only the item in
   * hand (core-rules 4). A spell slate is always the first kind -- that is what makes it a spell
   * rather than a wand -- so this is true by construction and stated for the resolver to read.
   */
  get needsFreeHand() {
    return true;
  }
}

/* -------------------------------------------- */
/*  Item slate                                  */
/* -------------------------------------------- */

export class ItemSlateData extends SlateData {
  static defineSchema() {
    const verbLine = () => new fields.SchemaField({
      value: new fields.NumberField({ integer: true, nullable: true, initial: null }),
      range: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
      /*
       * How far this line reaches in MELEE, and the nearest square it still works in.
       *
       * `range` was doing both jobs and the difference lived in the verb's `text`: "range 3 thrown"
       * on a dagger and "reach 2" on a halberd are the same field with opposite meanings, and
       * `resolveAttack` reads `range > 1` as "this is a ranged attack" -- so a halberd took the
       * ranged-in-melee disadvantage for being long, which is the opposite of what reach is.
       *
       * `reachMin` is the Pike's "useless adjacent", also prose until now: a reach band of 2-3
       * means somebody has to be in front of you. It is what stops a pikeman countering an arrival
       * (core-rules 11) -- the enemy arrives adjacent, which is the one place a pike cannot hit.
       */
      reach: new fields.NumberField({ integer: true, min: 1, nullable: true, initial: null }),
      reachMin: new fields.NumberField({ integer: true, min: 1, nullable: true, initial: null }),
      area: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
      areaKind: new fields.StringField({
        required: false, blank: true, initial: "", choices: ["", "blast", "aimed"]
      }),
      /*
       * How much of the target's armour this line goes straight through (equipment.md 1.3).
       *
       * It was prose on the verb's `text` for as long as firearms have existed, and prose is not a
       * rule: resolve.mjs subtracted the whole of a target's armour and eight items quietly
       * promised otherwise. Simulation is what made it urgent -- against armoured infantry an
       * arquebus wins 46.5% of fights and a longsword 0.8%, and that entire gap is this number
       * (../../sim/analysis-2026-10-30.md 13).
       */
      ignores: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
      text: new fields.StringField({ required: false, blank: true, initial: "" })
    });

    return {
      /**
       * Where this belongs by default, and where it goes if it only goes one place. Plate mail is
       * `body` and nothing else; a dagger is `hands` and also fits a belt.
       */
      slot: new fields.StringField({
        required: true, initial: "pack", choices: Object.keys(CARDRPG.slots)
      }),
      /**
       * The OTHER slots this will go in. Content, not state: it says what is physically possible,
       * which is why a potion can list `hands` and armor lists nothing. Together with `slot` it is
       * the whole answer to "can this go there" -- there is no separate rule by item type.
       */
      fits: new fields.SetField(new fields.StringField({ choices: Object.keys(CARDRPG.slots) })),

      hands: new fields.NumberField({ required: true, integer: true, min: 1, max: 2, initial: 1 }),
      equipped: new fields.BooleanField({ initial: false }),
      /** Which slot it is in RIGHT NOW. Blank means `slot`, which covers everything inflexible. */
      equippedTo: new fields.StringField({ required: false, blank: true, initial: "" }),

      tags: new fields.SetField(new fields.StringField({ choices: CARDRPG.itemTags })),

      /*
       * Reactions this slate takes away while it is worn (core-rules 3).
       *
       * Heavy Armor's whole drawback was the sentence "Blocks Sidestep reactions." on Brigandine
       * and Plate, and prose is not a rule: nothing in the engine could read it, so the simulator
       * charged Plate for it (combat_sim.py, `heavy_armor`) and the game handed it back for free.
       * That is the same gap `ignores N armor` and the ammunition `For` column each had.
       *
       * A SET of named reactions rather than a boolean, because a condition takes them ALL
       * (Stunned) and a worn thing takes the ones it names -- two different sentences that must not
       * share one field. Deliberately NOT an item tag: `heavy` already does two unrelated jobs.
       */
      blocksReactions: new fields.SetField(
        new fields.StringField({ choices: Object.keys(CARDRPG.reactions) })
      ),

      /**
       * Whole kilograms; anything under a kilo is 0 unless bundled (core-rules 4).
       * Weight is NOT the heavy/light tags: weight is what a thing costs to haul, the tags are how
       * it handles when wielded, and Strong reads the tags. Neither derives from the other.
       */
      weight: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),

      /*
       * Which class of ammunition this weapon takes (core-rules 4). Blank for everything that is
       * not a ranged weapon, which is most of the catalogue.
       *
       * "It must suit the weapon: an arrow is not a ball" was prose in two documents and prose on
       * the item's own `text`, which is exactly what `ignores N armor` was until last commit --
       * nothing stopped a Silvered Head going down a musket. This is the weapon's half of the
       * answer and `ammoFor` below is the piece's.
       */
      ammo: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...Object.keys(CARDRPG.ammoKinds), ""]
      }),

      verbs: new fields.SchemaField({
        strike: verbLine(),
        cast: verbLine(),
        defend: verbLine(),
        use: verbLine()
      }),

      armor: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      /**
       * How much of this slate's armor has been eaten away, by acid or anything else that spends
       * gear (core-rules 8). Printed `armor` stays what the item IS, so a repair is a reset to 0
       * rather than guesswork about what the number used to be.
       */
      corroded: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),

      /*
       * What wearing this raises, the same shape a feature uses -- a ring that grants a spell slot,
       * a belt that grants carry. Counted only while EQUIPPED, which is the difference between an
       * item's grant and a feature's.
       */
      grants: new fields.SchemaField({
        health: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        handSize: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        carry: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        deckMax: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        spellSlots: new fields.NumberField({ required: true, integer: true, initial: 0 })
      }),
      consumed: new fields.BooleanField({ initial: false }),

      /*
       * Ammunition: which weapons this piece suits, what it adds to the shot, and the one thing
       * it does that no step can say.
       *
       * `ammoFor` is non-empty on exactly the thirteen pieces and empty everywhere else, so it is
       * also the test for "is this ammunition" that does not go through the back-face `kind`.
       *
       * `shot` is a STEP, which is the whole reason this needed so little: a card's half and a
       * piece of ammunition are the same shape, so nine of the thirteen are a condition the card
       * did not print and the resolver already knew how to land. It rides the Strike and costs no
       * half of its own -- a magic arrow that cost an action would never be worth firing.
       */
      ammoFor: new fields.SetField(
        new fields.StringField({ choices: Object.keys(CARDRPG.ammoKinds) })
      ),
      shot: stepField(),
      shotEffect: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...Object.keys(CARDRPG.shotEffects), ""]
      }),

      /*
       * Identified, and what it looks like until it is.
       *
       * `initial: true` because most items are a sword, and a sword needs no examining. Loot sets
       * it false, and an unidentified item may still be USED -- you can swing an unmarked blade,
       * you simply do not know what you are swinging. That is what makes a curse work at all.
       */
      identified: new fields.BooleanField({ initial: true }),
      unidentifiedName: new fields.StringField({ required: false, blank: true, initial: "" }),

      /**
       * **The category of permanent injury this item is the recipe for**, or blank.
       *
       * This closes the `[OPEN]` the four rituals were carried at: they were **spells**, and on a
       * spell `strength` is the **slot cost** -- *a strength-3 formula fills three slots*. But a
       * ritual is the first slate in the game that is never **prepared** and never **cast**: what
       * resolves one is winning a challenge, not `payToCast`. So a slot cost had nothing to mean,
       * and any number above zero quietly told a non-mage with no slots that the ritual was closed
       * to them -- the exact opposite of the world document's *"anyone literate can do it."*
       *
       * **The gate is the recipe, so the recipe is a thing you find.** That sentence was in the
       * design before this field existed, and it names an item rather than a formula: a recipe is
       * bought, stolen, copied and lent, and a GM hands one out the way they hand out a key. It
       * also puts the scarcity somewhere a party can act on, which a spell slot never was.
       *
       * The challenge's numbers stay in `CARDRPG.injuryCategories`, where one category names one
       * ritual, so there is still exactly one place that says what a Regrowth costs.
       */
      ritual: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...Object.keys(CARDRPG.injuryCategories), ""]
      }),

      /*
       * The curse, as the obligation it is. Its PRESENCE is what makes an item cursed, so there is
       * no second boolean to disagree with -- the same shape `temporaryFate` uses on a condition.
       *
       * leveling.md 4 already says what an obligation means: it cannot be removed, the GM holds it,
       * and the text names the one thing that lifts it. A cursed item is an obligation you picked
       * up, so it needs no machinery of its own.
       */
      curse: new fields.StringField({ required: false, blank: true, initial: "" }),

      group: groupField(),
      ...drainFields(),

      /** As on a feature: a numeric bonus to one verb, capped by this slate's group. */
      bonus: new fields.SchemaField({
        verb: new fields.StringField({
          required: false, blank: true, initial: "",
          choices: [...Object.keys(CARDRPG.verbs), ""]
        }),
        value: new fields.NumberField({ integer: true, nullable: true, initial: null }),
        range: new fields.NumberField({ integer: true, nullable: true, initial: null }),
        requiresTag: new fields.StringField({
          required: false, blank: true, initial: "",
          choices: [...CARDRPG.itemTags, ""]
        }),
        /*
         * A tool's skill line -- "Shadow +2 on locks and mechanisms" (skill-rules 2). Until this
         * existed the bonus field was combat-verb shaped only, so the eight tools documented since
         * the first draft of starter-cards.md could not be expressed at all, which is why none of
         * them was ever in the system. `situation` is prose because the table adjudicates it.
         */
        approach: new fields.StringField({
          required: false, blank: true, initial: "",
          choices: [...Object.keys(CARDRPG.approaches), ""]
        }),
        /*
         * **The training that unlocks the full bonus**, named by the tool rather than guessed from
         * its own name.
         *
         * skill-rules 2 caps an untrained user at +1 however good the tool is, and the first
         * implementation matched the tool's last word against the character's trainings: "Healer's
         * Kit" looked for a training containing "kit". **Eleven of the fourteen tools could never
         * be trained**, and four could never reach their printed bonus at all -- Healer's Kit,
         * Repair Kit, Smith's Hammer and *The Kit*, which is the Burglar's Signature.
         *
         * Blank means there is nothing to be trained in, which is the honest reading for a tool
         * whose bonus is +1: the cap exists because the training does.
         */
        training: new fields.StringField({ required: false, blank: true, initial: "" }),
        situation: new fields.StringField({ required: false, blank: true, initial: "" })
      }),

      /** NPC gear is tuned separately from player gear, so it must not leak into player pickers. */
      npcGear: new fields.BooleanField({ initial: false }),

      // Back-face fields (card-layout 2, tier 3).
      kind: new fields.StringField({ required: false, blank: true, initial: "" }),
      blurb: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.HTMLField()
    };
  }

  /**
   * Is this magical ammunition? Suiting at least one weapon is the whole of it -- a piece that
   * suits nothing is not a shot, it is a pebble, and the validator refuses one.
   */
  get isAmmunition() {
    return (this.ammoFor?.size ?? 0) > 0;
  }

  /** Does this piece suit that weapon? Both halves have to agree, or an arrow goes down a musket. */
  suits(weapon) {
    const takes = weapon?.system?.ammo;
    return !!takes && !!this.ammoFor?.has(takes);
  }

  /** What a piece of ammunition promises, for the nock dialog and the chat card. */
  get shotLine() {
    return this.text || this.blurb || "";
  }

  /** Is this a cursed item? The curse text being there is the whole of it. */
  get cursed() {
    return !!this.curse;
  }

  /** Is this a ritual recipe? The same shape of question as `cursed`. */
  get isRecipe() {
    return !!this.ritual;
  }

  /** The challenge this recipe lets a party run, or null. */
  get ritualChallenge() {
    const cat = CARDRPG.injuryCategories[this.ritual];
    if (!cat?.ritual) return null;
    return {
      name: cat.ritual, lifts: this.ritual, approach: cat.approach,
      progress: cat.progress, pressure: cat.pressure, needsName: !!cat.needsName
    };
  }

  /**
   * What to put in front of the player. An unidentified item shows what it LOOKS like and nothing
   * it does -- including, pointedly, its curse. The GM reads the real fields off the same slate.
   */
  get shownName() {
    if (this.identified) return null;
    return this.unidentifiedName || "an unfamiliar item";
  }

  /**
   * Armor this slate actually gives, after anything that has eaten it. Printed `armor` stays what
   * the item IS, so repairing is a reset of `corroded` to 0 rather than guesswork about what the
   * number used to be.
   */
  get armorNow() {
    return Math.max(0, (this.armor ?? 0) - (this.corroded ?? 0));
  }

  /** Which verbs this item can actually serve. */
  get availableVerbs() {
    return Object.entries(this.verbs)
      .filter(([, line]) => line.value !== null || line.text)
      .map(([verb]) => verb);
  }

  /** Every slot this could go in, default first. */
  get allowedSlots() {
    return [this.slot, ...this.fits].filter((s, i, all) => all.indexOf(s) === i);
  }

  /** The slot it occupies now, or null when it is not equipped at all. */
  get equippedSlot() {
    if (!this.equipped) return null;
    return this.allowedSlots.includes(this.equippedTo) ? this.equippedTo : this.slot;
  }

  /** A two-hander is only two-handed while it is in the hands. Slung, it is one object on a back. */
  get isTwoHanded() {
    return this.equippedSlot === "hands" && this.hands === 2;
  }
}

/* -------------------------------------------- */
/*  Feature slate                               */
/* -------------------------------------------- */

export class FeatureSlateData extends SlateData {
  static defineSchema() {
    return {
      text: new fields.StringField({ required: false, blank: true, initial: "" }),
      group: groupField(),

      /**
       * **The one injury this feature adapts around**, by name. Blank on every other feature.
       *
       * ideas.md's *Adapted: ignore one injury's penalty* is the only levelling option in the game
       * that points at **another slate**, which is why it has to be a field: no amount of negative
       * `grants` can express *ignore that other thing*.
       *
       * The injury is not removed. A **Regrowth** removes one; this leaves it on the sheet with
       * its arithmetic switched off, which is the difference between healing and learning to live
       * with it -- and the reason the scar is still there for a GM to write into a scene.
       *
       * It also exists because Maimings are **uncapped** (config.mjs). Three of them measure past
       * two of the most expensive card in the game, so the brake had to be fitted before the cap
       * came off.
       *
       * Read through `adaptedNames` in grants.mjs by **every** reader of an injury's numbers,
       * because there are five of them -- the grant sum, the move reduction, the hand-slot
       * capacity, the blocked reactions and the printed range -- and an Adapted that reached four
       * would be a feature that works on a sheet and not in a fight.
       */
      adapts: new fields.StringField({ required: false, blank: true, initial: "" }),
      ...drainFields(),

      /**
       * **Where it was taught, and at what rank.**
       *
       * These are a spell's two fields and a feature has them for the same reason a spell does: a
       * school teaches, and what it teaches is not always a formula. All seven of Tattoo Magic's
       * teachings are ink, and Asceticism's ladder ends in two renunciations -- none of them is
       * ever prepared, so by the law none of them is a spell.
       *
       * `strength` is a **rank**, not a cost. On a spell it is both, because the rank is what the
       * slot budget spends; a feature has no budget to spend, so what is left is the school's
       * ladder -- which the menu still sorts by, and which is what the GM prices the thing at.
       * Zero for a feature no school taught, which is most of them.
       */
      source: new fields.StringField({ required: false, blank: true, initial: "" }),
      strength: new fields.NumberField({
        required: true, integer: true, min: 0, max: 5, initial: 0
      }),

      /**
       * A numeric bonus to one verb. This is what makes Strong computable rather than prose, and
       * it is the thing a bonus group caps: one bonus per group per action.
       */
      bonus: new fields.SchemaField({
        /**
         * **Which approach it helps on a check, which is the half of this field that was missing.**
         *
         * `collectSkillBonuses` reads `bonus.approach` **on features only** -- the tool comes in
         * through its own term, where the untrained cap lives -- and it has read that field since
         * step 3 of a check was repaired. The field was never here. **Six features** in
         * `FEATURES` exist for nothing else (*"+1 on Might checks"*), and for every one of them
         * `bonus.approach` was a key Foundry strips off `system` before anything can read it.
         * The fourteen other entries that set it are **items**, where the field is real -- which
         * is exactly why the mistake was invisible.
         *
         * So step 3 still returned **0 for every check ever made**, after the repair that was
         * written to stop it doing that. The note on `collectSkillBonuses` says *a tool's skill
         * line lives in `bonus.approach` (data/items.mjs), which is the field this reads* -- true
         * of the item sixty lines up, and that is the whole mistake. The reader was pointed at a
         * real field on the wrong model.
         *
         * It is the same defect as the one in this module's own header, turned around. There it
         * was *the field existed and the reader did not*; here the reader existed and the field
         * did not, and both passed every check because a dropped key reads as absent rather than
         * as wrong.
         */
        approach: new fields.StringField({
          required: false, blank: true, initial: "",
          choices: [...Object.keys(CARDRPG.approaches), ""]
        }),
        verb: new fields.StringField({
          required: false, blank: true, initial: "",
          choices: [...Object.keys(CARDRPG.verbs), ""]
        }),
        value: new fields.NumberField({ integer: true, nullable: true, initial: null }),
        range: new fields.NumberField({ integer: true, nullable: true, initial: null }),
        // Reads the item in hand, not the feature: Strong wants a Heavy weapon.
        requiresTag: new fields.StringField({
          required: false, blank: true, initial: "",
          choices: [...CARDRPG.itemTags, ""]
        })
      }),

      /**
       * What this feature does to the armour it is worn with, read in `prepareDerivedData`.
       *
       * `doubleWhenOverloaded` is the Ironclad's Signature and the only thing in the game that
       * WANTS you over the carry limit. Both halves of it were already derived -- the armour total
       * and the encumbrance tier -- so this is a line rather than a mechanism, which is what makes
       * it the cheapest of Way of Strength's twelve to build.
       */
      armor: new fields.SchemaField({
        doubleWhenOverloaded: new fields.BooleanField({ initial: false })
      }),

      /**
       * Advantage this feature grants on an attack, read by `advantageFor` in resolve.mjs.
       *
       * `vsOpening` is the one case the card-level `when` clause cannot express. That clause names
       * **one** opening on purpose (cards.mjs explains why: one card, one combo, no interaction
       * table), and a build whose entire claim is *I hit whatever you set up* needs any of them.
       * Openings have been a computed list in config since conditions were written and nothing read
       * it at the feature level -- which is why the Thief's Signature had nowhere to live.
       */
      advantage: new fields.SchemaField({
        vsOpening: new fields.BooleanField({ initial: false })
      }),

      /**
       * Flat traits the derived stats read. These are NOT bonus-grouped: a group caps bonuses to
       * one action, while these change a standing number (core-rules 4, 5).
       */
      grants: new fields.SchemaField({
        health: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        handSize: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        carry: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        deckMax: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        spellSlots: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        /*
         * **Flat armour, which had no home anywhere.** A worn item's `armor` is a number and this
         * `armor` schema above is `doubleWhenOverloaded` and nothing else -- so a feature or a
         * formula that simply makes you harder to hurt had nowhere to say so, and three of the
         * Graven line said it in prose. It is a grant and not a bonus because it changes a
         * standing number rather than one action (core-rules 4, 5).
         */
        armor: new fields.NumberField({ required: true, integer: true, initial: 0 })
      }),

      /**
       * **What it does beyond a standing number**, in the one vocabulary the game has for that.
       *
       * A feature could grant and it could bonus, and it could do neither of those things at all:
       * *Graven Strength* puts ink in your skin, and the +2 Strike it gives rides on the `graven`
       * condition that ink is. Without a step a feature had no way to apply one, which is why the
       * Graven line sat among the spells -- a spell has a step, and a tattoo needed what a step
       * does rather than anything a spell does.
       *
       * It is the same `stepField()` a spell's effect uses. The law's point is that the three
       * subtypes are one vocabulary with three gates, and a step is not about a gate.
       */
      effect: stepField(),

      description: new fields.HTMLField()
    };
  }

  /** Passive or active is the pricing dial: a passive feature is simply true. */
  get isPassive() {
    return !this.isActive;
  }
}

/* -------------------------------------------- */
/*  Injury slate                                */
/* -------------------------------------------- */

/**
 * **An injury is a feature you did not choose.**
 *
 * It extends the feature slate rather than standing beside it, and that inheritance is the whole
 * argument for building it this way: every one of the six injuries in ideas.md says what it does
 * in a field a feature already had. *Lost eye* is a negative `bonus.range`. *Lost hand* is a
 * negative `grants`. *Shattered nerves* is a blocked reaction. *Bad leg* is a step. Nothing here
 * is a new mechanism -- though one of the fields turned out to have no reader, which is its own
 * note on `rangeOnLine` in data/actors.mjs.
 *
 * What it adds is the three things a feature cannot say:
 *
 * 1. `category` -- so a ritual can name it, and so the cap can count it.
 * 2. `healsIn` -- days of rest, or 0 for permanent. The *lasting* injury from the same fate draw
 *    is not a different mechanism, it is this number.
 * 3. `blocksReactions` -- which only worn gear had, because only worn gear could take one away.
 *
 * **It is not a condition, and that is deliberate.** A condition carries a duration and can be
 * Shaken Off (core-rules 7); a permanent condition would be a duration field that lies and a
 * Shake Off that has to be special-cased. Nothing here needs special-casing: a slate is simply
 * true, which is what permanent means in the vocabulary this game already has.
 */
export class InjurySlateData extends FeatureSlateData {
  static defineSchema() {
    return {
      ...super.defineSchema(),

      /**
       * Which of the five kinds this is, and therefore which ritual lifts it (config.mjs).
       *
       * Required and not blank, because an injury no ritual can name is the one thing this field
       * exists to prevent -- and `obligation` is a real answer, not the absence of one.
       */
      category: new fields.StringField({
        required: true, blank: false, initial: "maiming",
        choices: Object.keys(CARDRPG.injuryCategories)
      }),

      /**
       * Days of rest that heal it, or **0 for permanent**.
       *
       * The fate draw on falling Unconscious has three outcomes and this is the field that tells
       * two of them apart (core-rules 8): a Miss leaves a 0 and a -2 or -1 leaves a count of
       * days. One number rather than two subtypes, because a lasting injury and a permanent one
       * do the same thing to a character for as long as they last.
       */
      healsIn: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),

      /**
       * Reactions this injury switches off, the same SetField worn gear uses.
       *
       * It is here and not on the feature slate because of what the two mean: a feature is
       * something you can do, and the things that take a reaction away are the things done TO
       * you -- a condition, Plate, and now this. *Shattered nerves* is the first of them that is
       * neither temporary nor removable by taking it off.
       */
      blocksReactions: new fields.SetField(
        new fields.StringField({ choices: Object.keys(CARDRPG.reactions) })
      ),

      /**
       * Whether the block is only for the opening round.
       *
       * ideas.md wrote *"blocks reactions on your first turn of each combat"* and the engine knows
       * **rounds**, not per-character firsts, so this reads round 1. The difference is a half-turn
       * for whoever acts late in the order, and naming the round is worth more than hiding that:
       * a rule the engine can enforce beats a rule that reads better and has to be remembered.
       */
      firstRoundOnly: new fields.BooleanField({ initial: false }),

      /**
       * **What an injury takes, which is `grants` pointed the other way.**
       *
       * A negative `grants` already covers the five standing numbers a feature can raise, so
       * *Lost hand* takes its carry that way and needs nothing here. These two are the numbers
       * `grants` has no key for, because until now nothing could lower them:
       *
       * - `move` comes off every Move value you play, which `movePlayed` already computes for
       *   Frozen. It joins that number rather than adding a second one, and so inherits its
       *   rule: **the highest applies, they do not add.** A bad leg and a frozen one are one bad
       *   leg, which is both the simpler sentence and the kinder one.
       * - `handSlots` comes off the capacity of the hands slot. Only the hands, because that is
       *   the only slot an injury can close -- a belt does not care whether you have a hand, and
       *   a back even less.
       *
       * **Not expressed as a condition with no duration.** That was the other way to build all of
       * this and it is a worse one: a condition carries a duration and can be Shaken Off
       * (core-rules 7), so a permanent one is a duration that lies next to a Shake Off that has
       * to be told to refuse. A slate is simply true, and that is already what permanent means.
       */
      takes: new fields.SchemaField({
        move: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        handSlots: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        /**
         * **Permanent Miss cards in your fate deck**, which is what a Hex is (core-rules 8).
         *
         * Not a new mechanism: `resolveHex` deals these already, built on `addFateCards`, which
         * has dealt them since the deck existed. What this field adds is that the slate now
         * *remembers* them, so lifting the injury can take back exactly what applying it dealt.
         *
         * It is also the most expensive thing an injury can carry, and the number is known:
         * **-3.5 win rate per card** against the published encounters, measured 2026-11-08.
         * One is five Wounds. Two should be a story the whole table remembers.
         */
        fateMiss: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      /**
       * **Intruder cards this injury owns**, and the answer to a question equipment.md asks.
       *
       * equipment.md 11 carries an `[OPEN]`: *"Nothing in the engine enforces a curse. `curse` is
       * a string and `identified` a boolean, and both are honest records the GM reads... or it is
       * a text obligation after all."* This is the enforcement. A curse whose obligation is a
       * **card in your deck** enforces itself, because the engine already moves the card: the
       * Blade of the Eager Hand's *"you must Strike the nearest living creature every turn, ally
       * or not"* is `applyRage`'s rule word for word, written in prose two months earlier.
       *
       * It is also what makes a permanent condition **dynamic** rather than a flat penalty. A
       * negative number on a slate is the same every round; a card that comes up when the deck
       * decides is the thing the intruder table was built for, and an injury is how one stops
       * leaving. The escalation reads in one line: **a card that keeps coming back is a slate,
       * and the slate is what a ritual can name.**
       *
       * `kind` has no `choices`, deliberately. The list lives in `INTRUDERS` in decks.mjs, and a
       * data model that imported it would reach a module full of Foundry globals from the one
       * layer that must not need them. The validator checks every kind against that table
       * instead, which is this project's answer to content pointed at a value that does not
       * exist -- and the check is the better place for it, because it can also refuse a kind
       * whose deck makes no sense for a person.
       */
      intruder: new fields.SchemaField({
        kind: new fields.StringField({ required: false, blank: true, initial: "" }),
        amount: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      /**
       * **What it cost to get, in the GM's own words.** An injury that nobody can tell the story
       * of is a penalty, and the one thing ideas.md asks of this list is that it *"becomes part of
       * the character"*. Free text, because what hit you is fiction.
       */
      cause: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }

  /** Permanent, or merely lasting? Zero days of rest is what permanent means here. */
  get permanent() {
    return this.healsIn === 0;
  }

  /** The ritual that lifts this kind, or null for an obligation -- which lifts for nobody. */
  get liftedBy() {
    return CARDRPG.injuryCategories[this.category]?.ritual ?? null;
  }

  /**
   * The challenge that lifting it is, or null.
   *
   * A ritual is a **challenge** and not a check (skill-rules 3, 6), and the reason is in the world
   * document rather than here: Ritual Magic's price is *"Time, and a recipe that can go wrong"*,
   * which is a Progress track and a Pressure track already. A check could only ever say whether
   * it worked.
   */
  get ritual() {
    const cat = CARDRPG.injuryCategories[this.category];
    if (!cat?.ritual) return null;
    return {
      name: cat.ritual, approach: cat.approach,
      progress: cat.progress, pressure: cat.pressure,
      needsName: !!cat.needsName
    };
  }
}
