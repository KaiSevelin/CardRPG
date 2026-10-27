/**
 * Slate data models -- Foundry Items.
 *
 * A slate is laid out face up and never shuffled (core-rules 1). Items, features, injuries and
 * secrets are slates; anything drawn from a deck is a Card instead. Combat playtest scope covers
 * `item` and `feature`.
 */

import { CARDRPG } from "../config.mjs";

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
      text: new fields.StringField({ required: false, blank: true, initial: "" })
    });

    return {
      slot: new fields.StringField({
        required: true, initial: "pack", choices: Object.keys(CARDRPG.slots)
      }),
      hands: new fields.NumberField({ required: true, integer: true, min: 1, max: 2, initial: 1 }),
      equipped: new fields.BooleanField({ initial: false }),
      // Deep in the pack: still owned, but not counted as carried for a quick swap.
      stowedAway: new fields.BooleanField({ initial: false }),

      tags: new fields.SetField(new fields.StringField({ choices: CARDRPG.itemTags })),

      /**
       * Whole kilograms; anything under a kilo is 0 unless bundled (core-rules 4).
       * Weight is NOT the heavy/light tags: weight is what a thing costs to haul, the tags are how
       * it handles when wielded, and Strong reads the tags. Neither derives from the other.
       */
      weight: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),

      verbs: new fields.SchemaField({
        strike: verbLine(),
        cast: verbLine(),
        defend: verbLine(),
        use: verbLine()
      }),

      armor: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      consumed: new fields.BooleanField({ initial: false }),

      group: groupField(),
      ...drainFields(),

      /** NPC gear is tuned separately from player gear, so it must not leak into player pickers. */
      npcGear: new fields.BooleanField({ initial: false }),

      // Back-face fields (card-layout 2, tier 3).
      kind: new fields.StringField({ required: false, blank: true, initial: "" }),
      blurb: new fields.StringField({ required: false, blank: true, initial: "" }),
      description: new fields.HTMLField()
    };
  }

  /** Which verbs this item can actually serve. */
  get availableVerbs() {
    return Object.entries(this.verbs)
      .filter(([, line]) => line.value !== null || line.text)
      .map(([verb]) => verb);
  }

  get isTwoHanded() {
    return this.slot === "hands" && this.hands === 2;
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
       * Flat traits the derived stats read. These are NOT bonus-grouped: a group caps bonuses to
       * one action, while these change a standing number (core-rules 4, 5).
       */
      grants: new fields.SchemaField({
        health: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        handSize: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        carry: new fields.NumberField({ required: true, integer: true, initial: 0 }),
        deckMax: new fields.NumberField({ required: true, integer: true, initial: 0 })
      }),

      description: new fields.HTMLField()
    };
  }

  /** Passive or active is the pricing dial: a passive feature is simply true. */
  get isPassive() {
    return !this.isActive;
  }
}
