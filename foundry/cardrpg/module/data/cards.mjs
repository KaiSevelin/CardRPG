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
     * How much of the target's armour this step goes straight through.
     *
     * The same number `verbLine` carries, one level down: there it is a property of the WEAPON
     * (a crossbow finds a gap in plate) and here it is a property of the SHOT (so do Bodkin
     * Points, fired from a weapon that does not). They add, because a bodkin on a crossbow is
     * both things at once, and both come off armour and never off Block (core-rules 5).
     */
    ignores: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
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
     * **How long after this turn the step waits before it happens.** `duration` says how long an
     * effect lasts; this says when it starts.
     *
     * Three steps said it in prose -- *at the start of your second turn after*, *at the start of
     * your third turn after this* -- and a delayed effect that the engine cannot see is one the
     * table forgets, because the card is back in the discard by the time it matters.
     */
    delay: new fields.NumberField({ integer: true, min: 1, nullable: true, initial: null }),
    /*
     * **When this step may be played at all**, which is a different question from what it does.
     *
     * Thirty-two steps carried this in prose and the engine could not read any of it: nine said
     * `permanent:`, nine `reaction:`, seven `ritual:`, four `out of combat:`, two `Strain N`, one
     * `before a fight`. A ritual played in the middle of a fight is not a rules argument the
     * software should leave to the table when the card already says so.
     *
     * `permanent` is the odd one and the reason this is not just a boolean: nine steps beginning
     * *permanent: +1 armor* are not steps at all. They are passive grants wearing a step's
     * clothes, and naming the timing is what makes that visible.
     */
    timing: new fields.StringField({
      required: false, blank: true, initial: "",
      choices: [...Object.keys(CARDRPG.timings), ""]
    }),
    /*
     * **How often it may be played at all.** Three steps say *Once a day* or *Once per pact per
     * fight*, and a limit the engine cannot read is a limit the table forgets at the exact moment
     * it matters, which is the second time somebody wants to use it.
     */
    /*
     * **Ground this step leaves behind**, which seven steps carried in prose because nothing in
     * this system owned map state.
     *
     * `shape` is where it goes and `effects` is what it does, as a ticked list because several
     * cards name two or three properties at once: *difficult ground, cover, and 2 damage at the
     * start of your turn* is one zone, not three. `damage` is what standing in it costs per turn,
     * and the condition a zone applies is the step's own `condition` and `intensity` -- a Standing
     * Flood makes everything in it Wet (2), and Wet is a condition the game already has.
     *
     * The step's `duration` says how long the ground lasts, and `area` or `range` how big it is.
     * Nothing here PLACES it: where a three-square line goes is a judgement about the map, and the
     * one thing worse than no automation is automation that puts a wall through the party.
     */
    ground: new fields.SchemaField({
      shape: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...Object.keys(CARDRPG.groundShapes), ""]
      }),
      effects: new fields.ArrayField(new fields.StringField({
        choices: Object.keys(CARDRPG.groundEffects)
      })),
      damage: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null })
    }),
    /*
     * **Who this step is for**, which twenty-nine steps carried in prose.
     *
     * Blank means one enemy, because that is what every card in the game has always meant by
     * saying nothing -- a step was a Strike before it was anything else. What the field buys is
     * that a blessing stops looking like an attack: the engine can offer the right tokens, and a
     * card that heals every ally within 2 can say so in a form something reads.
     *
     * There is deliberately no field for WHAT the ally gets. Nine steps want one and want eight
     * different values between them, which is one per card -- an enum that size is a free-text
     * special in disguise, so the grant stays prose and the targeting does not.
     */
    targets: new fields.StringField({
      required: false, blank: true, initial: "",
      choices: [...Object.keys(CARDRPG.targets), ""]
    }),
    /*
     * **A bonus this step's condition carries**, in the shape an item and a feature already use.
     *
     * It is here rather than on a spell slate because a bonus a spell gives should be a thing you
     * can SEE: the Graven line was a standing, invisible, unremovable +2 on the sheet, and nothing
     * on the token said so. Applied as a condition it shows, it has a duration, and it comes off
     * however that condition comes off.
     *
     * The payload rides on the condition instance rather than on the condition's config, because
     * each tattoo grants a different one -- +2 Strike with Heavy items is not +2 Strike, and both
     * are Graven.
     */
    bonus: new fields.SchemaField({
      verb: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...Object.keys(CARDRPG.verbs), ""]
      }),
      value: new fields.NumberField({ integer: true, nullable: true, initial: null }),
      requiresTag: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...CARDRPG.itemTags, ""]
      })
    }),
    oncePer: new fields.StringField({
      required: false, blank: true, initial: "",
      choices: [...Object.keys(CARDRPG.limits), ""]
    }),
    /*
     * **What this step goes straight through.** `ignores` above is a NUMBER of armour points, which
     * is the ordinary case -- a bodkin finds a gap. These three are all of it, and Block and cover
     * are not armour: core-rules 5 is explicit that `ignores` comes off armour and never off Block,
     * so each needs saying separately or the engine subtracts the wrong thing.
     */
    ignoresArmour: new fields.BooleanField({ initial: false }),
    ignoresBlock: new fields.BooleanField({ initial: false }),
    ignoresCover: new fields.BooleanField({ initial: false }),
    /*
     * **Whose fate deck a Read looks at** (core-rules 6). `foresee` has always had a number and
     * never a target, so *Read 3 on any one fate deck except your own* and *on your own fate deck*
     * were the same step as far as the engine could tell.
     */
    readDeck: new fields.StringField({
      required: false, blank: true, initial: "",
      choices: [...Object.keys(CARDRPG.readDecks), ""]
    }),
    /*
     * **A state of your own this step waits on**: *while your hand is empty*, *while both hands are
     * empty*, *while your hand is exactly one card*. Eleven steps, and whole builds rest on them.
     *
     * Most of these the engine can see for itself, which is the point of naming them: a condition
     * the software can read is a condition it can show, and a card whose entire design is an empty
     * hand should say so on its face rather than in a sentence underneath.
     */
    whileState: new fields.StringField({
      required: false, blank: true, initial: "",
      choices: [...Object.keys(CARDRPG.whileStates), ""]
    }),

    /*
     * **What a `conjure` step calls up, and what it costs to keep.**
     *
     * Two fields, and the shortness is the design. A first pass had five -- `from`, `name`,
     * `count`, `side`, `upkeep` -- and three of them were the software deciding things a table
     * decides better: whether a body is available to rise, how many of them there are, and whose
     * side the thing fights on. A spell that has already said *a corpse within 2* does not also
     * need the engine's opinion on whether there is one.
     *
     * So the card configures **which creature**, and the number is asked at play. `creature` is a
     * name in the roster, which resolves to the creature's compendium id -- the ids are a hash of
     * the pack and the name, so the name IS the id and nobody has to write sixteen characters of
     * hash onto a card.
     *
     * A blank `creature` is not a gap: two cards say *the GM decides*, because a minor god is a
     * person with its own opinions and a spell that commanded one would have misunderstood the
     * arrangement.
     *
     * `upkeep` stays, because a price paid *per round the thing stands* is a rule rather than a
     * judgement -- it is what The Grave's Bargain already printed: *one bound Taint per round they
     * stood*.
     */
    conjure: new fields.SchemaField({
      creature: new fields.StringField({ required: false, blank: true, initial: "" }),
      upkeep: new fields.SchemaField({
        taint: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null }),
        health: new fields.NumberField({ integer: true, min: 0, nullable: true, initial: null })
      })
    }),

    /*
     * **What a `shape` step turns you into**: the name of a transformation (content.mjs).
     *
     * One field, because a transformation is a thing in its own right -- a set of cards it adds and
     * a filter of your own it takes away -- and that does not fit on a step. An earlier pass named
     * a ROSTER CREATURE here and lent you its natural weapons, which made a bird that still had
     * hands: a form that only adds is a costume.
     *
     * The step's own `duration` says how long you hold it.
     */
    shape: new fields.SchemaField({
      transformation: new fields.StringField({ required: false, blank: true, initial: "" }),
      /*
       * **What the form costs you while you wear it**, and it is on the step rather than on the
       * transformation because this is where it can be EDITED: `content.mjs` is a source file and
       * nothing in Foundry writes to it, so a quarantine a GM ticks in the card sheet has to be a
       * document field.
       *
       * The trade is that a form used by two cards says "no hands" twice. What it buys is that a
       * greater version of a spell can be gentler -- the same borrowed body, and this time you keep
       * your sword.
       *
       * `slots` and `tags` are enums, so they are checkboxes; `features` and `cards` are named by
       * hand because there are few enough of each to say. No `kinds`: an item's kind is a free
       * string with no enum behind it, so it could never have been a checkbox, and these two reach
       * everything it would.
       */
      quarantine: new fields.SchemaField({
        slots: new fields.ArrayField(new fields.StringField({
          choices: Object.keys(CARDRPG.slots)
        })),
        tags: new fields.ArrayField(new fields.StringField({ choices: CARDRPG.itemTags })),
        features: new fields.ArrayField(new fields.StringField()),
        cards: new fields.ArrayField(new fields.StringField())
      })
    }),
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

    /*
     * What this step needs IN HAND before it can be played at all.
     *
     * The one gate on the schema, and it is allowed exactly where the combo clause above is not.
     * An opening may never gate a primary (core-rules 7, rule 3) because nobody can arrange a
     * draw: a half that waits for one is a card held all fight. Your own kit is the opposite --
     * you chose it at the shop and a Ready changes it mid-fight -- so *this Strike is ranged* is a
     * build decision, not a wait on luck. **Gate on what the player controls, never on what the
     * shuffle controls**, and the two fields sit next to each other so the difference is visible.
     *
     * `tag` is an item tag (`ranged`, `light`, `heavy`), read off the item that would serve the
     * verb. `bothHands` is a boolean rather than a number because there is one hand requirement in
     * the game and it is "both" -- and it means a two-hander actually HELD in two hands
     * (`isTwoHanded`), not an item that could take two while it is slung on a back.
     *
     * This is also what three cards were doing in prose, printing "Ranged." in their text. A
     * printed sentence cannot narrow which weapon the engine picks up, so the engine picked the
     * dagger: prose is not a rule, for the sixth or seventh time.
     */
    requires: new fields.SchemaField({
      tag: new fields.StringField({
        required: false, blank: true, initial: "",
        choices: [...CARDRPG.itemTags, ""]
      }),
      bothHands: new fields.BooleanField({ initial: false })
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
      /*
       * How much, for a reaction that takes a number. Only `sidestep` does -- it is `valued` in
       * config, the same way a condition that carries an intensity is -- and *Roll With It*
       * (way-cards 3.3) is the one card in the document that needs it: `Sidestep 2`.
       *
       * A second field beside the key rather than a schema around both, which is the house idiom:
       * a condition and its intensity live beside each other too, and the validator is what holds
       * them together -- here, by refusing a number on a reaction that does not take one.
       */
      reactionParam: new fields.NumberField({
        integer: true, min: 1, nullable: true, initial: null
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
/*  Wild Magic card                             */
/* -------------------------------------------- */

/**
 * A Wild Magic card, drawn when a Wild comes out of a fate deck (core-rules 6).
 *
 * `steps` and nothing else, which is the same observation that made ammunition cheap: a card's
 * half, a piece of ammunition and a wild surge are all **a step**, so the code that lands a
 * condition from a card lands these too. Two of the twelve are a single step; the rest are two, or
 * a sentence the table resolves because the engine has no verb for it.
 */
export class WildCardData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      steps: new fields.ArrayField(stepField()),
      /**
       * Good, bad, or both -- declared rather than inferred from the steps, because what a surge is
       * WORTH depends on where everyone is standing. *Glare* widens your own Blast: a gift with a
       * clear field and a disaster beside an ally, and no reading of its step can tell which.
       *
       * It is also the only way to hold the deck to its design: a slight edge to the good
       * (specializations.md), which is a claim about the counts and therefore checkable.
       */
      turn: new fields.StringField({
        required: true, initial: "good", choices: ["good", "bad", "both"]
      }),
      text: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }

  /** What the face reads, which is the words when there are words and the steps otherwise. */
  get line() {
    return this.text || "";
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
        required: false, blank: true, initial: "",
        choices: [...Object.keys(CARDRPG.fateSpecials), ""]
      }),
      /**
       * Blessed and Cursed shuffle in TEMPORARY copies which the rules remove when drawn
       * (core-rules 6) -- impossible if they are indistinguishable from the permanent ones, so the
       * face has to show it too.
       */
      temporary: new fields.BooleanField({ initial: false })
    };
  }

  /** Miss < -2 < -1 < 0 < Wild < +1 < +2 < Critical, for advantage and disadvantage. */
  get rank() {
    if (this.special) return CARDRPG.fateSpecials[this.special]?.rank ?? 0;
    return this.value;
  }

  /**
   * Apply this card to a value. A Miss does nothing; a Critical doubles; a **Wild leaves it alone**
   * -- "the spell still happens" (ideas.md), and what follows is the Wild Magic draw, not a number.
   */
  apply(value) {
    if (this.special === "miss") return 0;
    if (this.special === "crit") return value * 2;
    if (this.special === "wild") return Math.max(0, value);
    return Math.max(0, value + this.value);
  }

  /**
   * Miss and Critical trigger a reshuffle, which is what makes the fate counter a risk dial -- and
   * a Wild does not, which is why this cannot simply ask whether the card is special.
   */
  get reshuffles() {
    return !!CARDRPG.fateSpecials[this.special]?.reshuffles;
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
      sequence: new fields.ArrayField(stepField()),
      /**
       * What a creature must be able to do to hold this card (core-rules 9).
       *
       * Kept on the card as well as in the pool so a GM who builds a creature by hand can be told
       * why a card does or does not belong to it. The deck itself is already the subset, so nothing
       * at the table reads this -- it is the card explaining itself, which is the job the `kind` on
       * its back has always done.
       */
      /*
       * `intentNeeds`, not `capabilities`: the two differ by `move`, which is derived rather than
       * granted, and drawing from the capabilities alone refused it on eight cards -- and a Card
       * whose `needs` is refused does not load at all.
       */
      needs: new fields.ArrayField(new fields.StringField({
        choices: CARDRPG.intentNeeds
      })),
      /** The shape in words, for the face: the engine resolves the sequence, the GM reads this. */
      text: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }
}

/* -------------------------------------------- */
/*  Skill card                                  */
/* -------------------------------------------- */

/**
 * A skill card: one **approach** and a **value** (skill-rules 1).
 *
 * This is the oldest documented thing in the project with no code behind it, and the omission was
 * load-bearing rather than cosmetic. `passiveScore` reads `system.decks.skill` -- a field that was
 * never declared -- so for every player character it fell through to `system.passive`, which only
 * the NPC model has. **Every saving throw a character has ever made used a flat 2**, for every
 * approach, however good their deck was supposed to be.
 *
 * `edge` is a sentence that happens when the card is played *even if the check fails*, which is
 * what makes a skill card a card rather than a die: skill-rules prints *Edge: ask the GM one
 * yes/no question about the scene.* The engine does not resolve it, the table does -- the same
 * footing as a Move.
 *
 * `wild` is the Inspiration card: any approach, value 1, one or two per deck. A separate flag
 * rather than an `any` approach, because `any` already means something else in `CARDRPG.approaches`
 * (a tool that helps with everything) and the two must not be confused.
 */
export class SkillCardData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      approach: new fields.StringField({
        required: true, blank: true, initial: "",
        choices: [...Object.keys(CARDRPG.approaches), ""]
      }),
      value: new fields.NumberField({ required: true, integer: true, min: 0, max: 3, initial: 1 }),
      /** Any approach, value 1. The one card in a skill deck that is never the wrong card. */
      wild: new fields.BooleanField({ initial: false }),
      /** What playing it does regardless of the result. Prose: the table resolves it. */
      edge: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }

  /** Does this card serve that approach? A wild serves all six. */
  serves(approach) {
    return this.wild || this.approach === approach;
  }

  /** What it is worth on a check of that approach, or null when it does not serve it at all. */
  worth(approach) {
    return this.serves(approach) ? this.value : null;
  }
}

/* -------------------------------------------- */
/*  Twist                                       */
/* -------------------------------------------- */

/**
 * A twist (skill-rules 4): the price of a Partial, or what happens instead on a Fail.
 *
 * **Almost all prose, and that is the design rather than a shortfall.** *Hurt* is *lose 2 Health,
 * or gain a condition that fits*, and nothing in an engine chooses between those -- the card names
 * the kind of trouble and the GM says what it looks like here. The two fields that are not prose
 * are the two the rules make arithmetic: `pressure` is Time's extra point in a challenge, and
 * `gives` marks Opening as the one twist that hands something over.
 */
export class TwistCardData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      /** What it costs, in the GM's hands. */
      cost: new fields.StringField({ required: true, blank: true, initial: "" }),
      /** Pressure beyond the normal cost. Only Time has any (skill-rules 4). */
      pressure: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
      /** The fail-forward valve: this one gives rather than takes. */
      gives: new fields.BooleanField({ initial: false })
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
