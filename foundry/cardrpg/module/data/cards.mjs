/**
 * Card data models -- Foundry Cards.
 *
 * A card lives in a deck: shuffled, drawn, played, discarded (core-rules 1). Faces render from
 * this data, never from a stored image, because conditions switch individual icons off at runtime
 * (core-rules 10, Blocked icons).
 */

import { CARDRPG } from "../config.mjs";

const fields = foundry.data.fields;

/* -------------------------------------------- */
/*  A step                                      */
/* -------------------------------------------- */

/**
 * One icon with its number. Both action-card halves and NPC sequences are ordered lists of these.
 *
 * `mod` is a SIGNED number and means a modifier (+1). `param` is a BARE number and means a
 * parameter (Move 3, Range 4). That distinction is the whole numeric convention on a face
 * (card-layout 1.3), so the schema keeps the two apart rather than relying on a renderer.
 */
/*
 * Exported, because a spell slate's effect is the same shape as a card step: a verb line that may
 * also carry a condition. Writing it twice would let the two drift, and the condition fields are
 * exactly the part that must not.
 */
export function stepField() {
  return new fields.SchemaField({
    verb: new fields.StringField({
      required: false, blank: true, initial: "",
      choices: [...Object.keys(CARDRPG.verbs), ...Object.keys(CARDRPG.effects), ""]
    }),
    mod: new fields.NumberField({ integer: true, nullable: true, initial: null }),
    param: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
    range: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
    area: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
    areaKind: new fields.StringField({
      required: false, blank: true, initial: "", choices: ["", "blast", "aimed"]
    }),
    /*
     * A condition this step puts on its target (core-rules 7).
     *
     * `condition` names it and `duration` says for how long. `resist` and `dc` are what the target
     * saves against, and they are what decides HOW it lands:
     *
     * - with `resist`, the condition IS the action and the target makes a saving throw;
     * - without it, the condition rides on an attack and lands when the attack does.
     *
     * `lesser` overrides the default partial result, which is half the duration.
     */
    condition: new fields.StringField({
      required: false, blank: true, initial: "",
      choices: [...Object.keys(CARDRPG.conditions), ""]
    }),
    duration: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
    /*
     * Intensity, for a `valued` condition: Burning 3 (2). Ignored by the ones without it.
     * The floor is 0 because Poisoned 0 -- all nausea, no damage -- is the bottom of that scale.
     */
    intensity: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
    resist: new fields.StringField({
      required: false, blank: true, initial: "",
      choices: [...Object.keys(CARDRPG.approaches), ""]
    }),
    dc: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
    lesser: new fields.StringField({
      required: false, blank: true, initial: "",
      choices: [...Object.keys(CARDRPG.conditions), ""]
    }),

    /*
     * The combo clause: what this half does EXTRA against a target that already carries an
     * **opening** (core-rules 7). `needs` names the opening; the other three are what knowing about
     * it is worth.
     *
     * An opening never GATES. There is no field here for "only against a Wet target", on purpose:
     * a half that does nothing without its setup is a card you hold all fight waiting for a draw
     * that never comes. So this only ever sharpens -- `mod` more damage, `advantage` on the draw,
     * `dc` a harder save for the condition the half was already printing.
     *
     * `dc` is how a combo lands a condition without gating one: Lightning always tries to Stun,
     * and against a Wet target it tries at Heroic instead of Normal.
     *
     * Because the clause lives here, on the half that reads the opening, NO interaction table
     * exists -- adding a card adds one combo and changes nothing else in the game.
     *
     * `needs` takes an OPENING, not any condition. A half may of course be better against a Prone
     * or an Overloaded target -- but those conditions already do plenty by themselves, so a card
     * reading one is ordinary card text and belongs in `text`. This clause is for the case the
     * keyword exists for: a setup that is worth nothing on its own, where the sharpening IS the
     * payment. The validator enforces the same thing from the content side.
     */
    when: new fields.SchemaField({
      needs: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...CARDRPG.openings, ""]
      }),
      mod: new fields.NumberField({ integer: true, nullable: true, initial: null }),
      advantage: new fields.BooleanField({ initial: false }),
      dc: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
      text: new fields.StringField({ required: false, blank: true, initial: "" })
    }),

    // A few words only, for what icons can't express (Taunt, Parry). Prose goes on the sheet.
    text: new fields.StringField({ required: false, blank: true, initial: "" })
  });
}

/* -------------------------------------------- */
/*  What a half costs to play                   */
/* -------------------------------------------- */

/**
 * The price of playing one half, paid before the half resolves.
 *
 * The action deck is a closed loop: the discard always comes back on a Catch Breath, so nothing
 * leaves the deck unless the player decides it should. These two fields are that decision.
 *
 * `spent` retires the card to the Spent pile instead of the discard -- gone for the fight, back on
 * a rest. It is the once-a-fight card.
 *
 * `strain` discards that many OTHER cards from the hand, the player's choice. Those go to the
 * discard like anything else, so Strain costs the round rather than the fight.
 *
 * Both sit on the half, not on the card, because every other thing a card does sits on the half.
 * A card can be a spell on one side and a step sideways on the other, and burning the card to take
 * the step sideways should be the player's mistake to make, not the schema's.
 */
function costField() {
  return new fields.SchemaField({
    spent: new fields.BooleanField({ initial: false }),
    strain: new fields.NumberField({ integer: true, min: 0, initial: 0 })
  });
}

/** The icon a step draws, resolved from the verb or effect key. */
export function stepIcon(step) {
  return CARDRPG.verbs[step.verb]?.icon ?? CARDRPG.effects[step.verb]?.icon ?? null;
}

/* -------------------------------------------- */
/*  Action card                                 */
/* -------------------------------------------- */

export class ActionCardData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      primary: new fields.ArrayField(stepField()),
      secondary: new fields.ArrayField(stepField()),
      costs: new fields.SchemaField({
        primary: costField(),
        secondary: costField()
      }),
      reaction: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...Object.keys(CARDRPG.reactions), ""]
      }),
      // Reserved: which Way's list this belongs to. Waits on the Way trees.
      way: new fields.StringField({ required: false, blank: true, initial: "" }),
      tree: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }

  /** The icon keys a half shows, for the blocked-icon test. */
  iconsFor(half) {
    return (this[half] ?? []).map(stepIcon).filter(i => i);
  }

  /**
   * Can this half be played right now? A blocked icon switches off any half that shows it, and the
   * other half of the same card may still be playable (core-rules 10).
   */
  isHalfBlocked(half, blockedIcons) {
    return this.iconsFor(half).some(icon => blockedIcons.has(icon));
  }

  /** What playing this half costs. Always an object, so callers never guard. */
  costFor(half) {
    return this.costs?.[half] ?? { spent: false, strain: 0 };
  }

  /** Does playing this half retire the card to the Spent pile rather than the discard? */
  isSpentBy(half) {
    return !!this.costFor(half).spent;
  }

  get hasReaction() {
    return !!this.reaction;
  }
}

/* -------------------------------------------- */
/*  Fate card                                   */
/* -------------------------------------------- */

export class FateCardData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      value: new fields.NumberField({ integer: true, nullable: true, initial: 0 }),
      special: new fields.StringField({
        required: false, blank: true, initial: "", choices: ["", "miss", "crit"]
      }),
      /**
       * Blessed and Cursed shuffle in TEMPORARY copies which the rules remove when drawn
       * (core-rules 6) -- impossible if they are indistinguishable from the permanent ones, so the
       * face has to show it too.
       */
      temporary: new fields.BooleanField({ initial: false })
    };
  }

  /** Miss < -2 < -1 < 0 < +1 < +2 < Critical, for advantage and disadvantage. */
  get rank() {
    if (this.special) return CARDRPG.fateRank[this.special];
    return this.value;
  }

  /** Apply this card to a value. A Miss does nothing; a Critical doubles. */
  apply(value) {
    if (this.special === "miss") return 0;
    if (this.special === "crit") return value * 2;
    return Math.max(0, value + this.value);
  }

  /** Miss and Critical both trigger a reshuffle, which is what makes the fate counter a risk dial. */
  get reshuffles() {
    return !!this.special;
  }

  get label() {
    if (this.special === "miss") return game.i18n.localize("CARDRPG.Fate.Miss");
    if (this.special === "crit") return game.i18n.localize("CARDRPG.Fate.Critical");
    return this.value > 0 ? `+${this.value}` : String(this.value);
  }
}

/* -------------------------------------------- */
/*  NPC card                                    */
/* -------------------------------------------- */

export class NpcCardData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      /** The creature type that owns this deck. Its back shows this and nothing else. */
      kind: new fields.StringField({ required: true, blank: true, initial: "" }),
      /** Ordered and numbered on the face: "Move 3, then Strike" is not "Strike, then Move 2". */
      sequence: new fields.ArrayField(stepField())
    };
  }
}

/* -------------------------------------------- */
/*  Wound and Taint                             */
/* -------------------------------------------- */

/**
 * A Wound takes a hand slot, can't be played -- not even for Brace -- and is discarded at the end
 * of your turn. No fields: the text and face are fixed.
 */
export class WoundCardData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      source: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }
}

/**
 * Taint resolves the moment it is drawn: 1 damage ignoring armor, discard, draw no replacement.
 * One subtype with a flavour field rather than two subtypes; the flavour picks the face.
 */
export class TaintCardData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      flavour: new fields.StringField({
        required: true, initial: "body", choices: ["body", "mind"]
      }),
      source: new fields.StringField({ required: false, blank: true, initial: "" }),
      /**
       * Bound Taint came from an obligation, not from a sickness: no cure or Cleansing lifts it,
       * only whatever the obligation names (core-rules 8, leveling 4). It still counts toward
       * Afflicted, so a school that buys power this way shows it on the third purchase.
       */
      bound: new fields.BooleanField({ initial: false })
    };
  }

  /** Body taint goes in the action deck, mind taint in the skill deck (core-rules 8). */
  get deck() {
    return this.flavour === "body" ? "action" : "skill";
  }

  get icon() {
    return this.flavour === "body" ? "vomiting" : "squid-head";
  }
}
