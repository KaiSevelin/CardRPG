/**
 * Slate data models -- Foundry Items.
 *
 * A slate is laid out face up and never shuffled (core-rules 1). Items, features, injuries and
 * secrets are slates; anything drawn from a deck is a Card instead. Combat playtest scope covers
 * `item` and `feature`.
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

      /** What casting it does. Same shape as a card step, so a spell may apply a condition. */
      effect: stepField(),

      group: groupField(),
      ...drainFields(),

      description: new fields.HTMLField()
    };
  }

  /** What this costs out of the budget right now. Nothing, while it is still in the book. */
  get slotCost() {
    return this.prepared ? this.strength : 0;
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
      ...drainFields(),

      /**
       * A numeric bonus to one verb. This is what makes Strong computable rather than prose, and
       * it is the thing a bonus group caps: one bonus per group per action.
       */
      bonus: new fields.SchemaField({
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
       * Flat traits the derived stats read. These are NOT bonus-grouped: a group caps bonuses to
       * one action, while these change a standing number (core-rules 4, 5).
       */
      grants: new fields.SchemaField({
        health: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        handSize: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        carry: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        deckMax: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        spellSlots: new fields.NumberField({ required: true, integer: true, initial: 0 })
      }),

      description: new fields.HTMLField()
    };
  }

  /** Passive or active is the pricing dial: a passive feature is simply true. */
  get isPassive() {
    return !this.isActive;
  }
}
