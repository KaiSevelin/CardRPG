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
function stepField() {
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
    // A few words only, for what icons can't express (Taunt, Parry). Prose goes on the sheet.
    text: new fields.StringField({ required: false, blank: true, initial: "" })
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
      source: new fields.StringField({ required: false, blank: true, initial: "" })
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
