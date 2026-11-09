/**
 * Way of Strength: its pool, its Signatures and the Tactics its titles carry.
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */

/**
 * way-cards 3.2. Weight, armor, Block, adjacency and the Wound threshold are the levers the major
 * nodes own; these touch them without taking them.
 *
 * Three of the fourteen read **Off-Balance** and each reads it differently -- more damage, a harder
 * save on a condition the card was already attempting, and the same again on a longer one. That is
 * the whole of the reader table, deliberately, so the band has worked instances rather than an
 * assertion.
 */
export const STRENGTH_POOL = [
  {
    name: "Shoulder Check", copies: 1, pool: "strength", needs: [],
    primary: [{ verb: "strike" }],
    secondary: [{ condition: "offBalance", duration: 1 }],
    text: "Adjacent."
  },
  {
    name: "Shield Bash", copies: 1, pool: "strength",
    needs: ["a Strike that deals no damage"], reaction: "block",
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "No damage: push 2 and step into the square it left."
  },
  {
    name: "Hammerblow", copies: 1, pool: "strength", needs: [],
    primary: [{ verb: "strike", when: { needs: "offBalance", mod: 2 } }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Sweep the Leg", copies: 1, pool: "strength", needs: [],
    primary: [{
      verb: "strike", condition: "prone", duration: 1, resist: "agility", dc: 5,
      when: { needs: "offBalance", dc: 9 }
    }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    /*
     * Possibly the strongest card in the document, and the saving throw is what carries it:
     * Grappled (2) costs its victim 18.3 points of win rate against a mixed group, because blocking
     * Move is blocking the most valuable thing a figure does (sim/analysis-2026-10-30.md 7).
     */
    name: "Overbear", copies: 1, pool: "strength", needs: [],
    primary: [{
      condition: "grappled", duration: 2, resist: "might", dc: 5,
      when: { needs: "offBalance", dc: 7 }
    }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Shield Wall", copies: 1, pool: "strength",
    needs: [], reaction: "block",
    primary: [{ verb: "defend" }],
    /* The second half is the card: a Defend that also reaches the man beside you. */
    secondary: [{ verb: "defend" }, { verb: "block", param: 1, area: 1 }]
  },
  {
    /*
     * `bothHands` is held in two hands NOW, not an item that could take two -- so the Ready on the
     * secondary is the card's own answer to being dealt it with a shield up.
     */
    name: "Two-Hand It", copies: 1, pool: "strength", needs: [],
    primary: [{ verb: "strike", mod: 2, requires: { bothHands: true } }],
    secondary: [{ verb: "ready" }]
  },
  {
    name: "Heave", copies: 1, pool: "strength",
    needs: ["a Move that ignores your own encumbrance"],
    primary: [{ verb: "move", param: 2 }],
    secondary: [{ verb: "ready" }],
    text: "Carrying any weight without being Slowed."
  },
  {
    /*
     * No printed reaction, although way-cards 3.2 prints Brace. Brace is the floor under a card
     * that prints NOTHING (core-rules 3), so printing it is the one spelling that could switch it
     * off -- the same correction Dig In needed.
     */
    name: "Armoured Advance", copies: 1, pool: "strength",
    needs: ["a transient bonus to armour"],
    primary: [{ verb: "move", param: 3 }],
    secondary: [{ verb: "move", param: 1 }],
    text: "Your armor counts +1 until your next turn."
  },
  {
    /*
     * The clause names Prone and Grappled, which are NOT openings -- so it is card text rather than
     * a `when` clause, exactly as cards.mjs says it should be: that clause is for a setup worth
     * nothing on its own, and being Prone already does plenty.
     */
    name: "Pull Them Down", copies: 1, pool: "strength", needs: [],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "strike", mod: -1 }],
    text: "The secondary only against a Prone or Grappled target."
  },
  {
    name: "Beat the Blade", copies: 1, pool: "strength", needs: [],
    primary: [{
      verb: "strike", condition: "disarmed", duration: 1, resist: "might", dc: 5
    }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Roar", copies: 1, pool: "strength",
    needs: ["a condition applied to an area"],
    primary: [{ condition: "compelled", duration: 1, resist: "presence", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }],
    costs: { primary: { strain: 1 } },
    text: "Every adjacent enemy."
  },
  {
    /* Brace by printing nothing, as above. */
    name: "Walk It Off", copies: 1, pool: "strength", needs: [],
    primary: [{ verb: "heal", param: 2 }, { verb: "shake", param: 2 }],
    secondary: [{ verb: "move", param: 1 }],
    costs: { primary: { spent: true } },
    text: "On yourself."
  },
  {
    /*
     * The first card in the game to pay the top of way-cards 1.3 -- Spent AND Strain -- and the
     * scaling is what keeps it from being a trap. "Strain your hand but one" strains NOTHING once
     * your hand is down to this card and one other, so a flat bonus would be free exactly when a
     * desperation card should cost most. +1 per card strained inverts that.
     *
     * It prints no secondary and no reaction on purpose. Forcing the kept card to be played empties
     * your hand by the end of the round, so you cannot react at all -- and nothing had to print
     * that, which is the cost core-rules 3 charges for turning a whole hand sideways, read the
     * other way round.
     */
    name: "Nothing Held Back", copies: 1, pool: "strength",
    needs: ["Strain of every card in hand but one",
      "a kept card the engine makes you play this turn",
      "a Strike that scales with the number of cards strained"],
    primary: [{ verb: "strike" }],
    secondary: [],
    costs: { primary: { spent: true, strain: 1 } },
    text: "Strain your hand but one, and that card must be played this turn. Strike +1 per card "
      + "strained."
  },
  {
    /*
     * Forestall on a secondary, where it competes with the Move 1 every other card offers -- which
     * is the right price, since mobility is the most valuable thing a figure does. The card is
     * deliberately worth nothing some rounds: a Forestall spent on a type that has already acted
     * is spent on nothing, and one spent blind may hand them something worse. It wants a Foresee
     * first, and it wants the enemy to be MANY.
     */
    name: "Call It", copies: 1, pool: "strength",
    needs: ["Forestall — discarding a type's intent card and drawing it a new one"],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "forestall", param: 1 }],
    text: "The secondary names one NPC type."
  }
];

/* -------------------------------------------- */
/*  Way of Strength's Signatures and Tactics    */
/* -------------------------------------------- */

/**
 * The twelve of way-cards.md 2.1, in the same shape as Shade's: `kind` says which document it
 * becomes, and `needs` names what the engine lacks when it lacks something.
 *
 * **way-cards says two of these "cost the rules nothing at all". One does.** *Interpose* really is
 * free: the `bodyguard` reaction and `redirectHit` were written into the reaction order before any
 * node claimed them, so the card is the claim and nothing else. *Cleave to the Bone* is not, and
 * the reason is worth having: the Wound threshold is a **constant read in two places**, one of them
 * the reaction policy, and moving it to *4 for this attacker* means threading the attacker's number
 * into `chooseReaction` -- which is the function whose whole virtue is that it has no tuned
 * constants in it. One number, two readers, and a signature change. Not nothing.
 *
 * *Interpose* also closes a gap the validator has been reporting since reactions were built: the
 * `bodyguard` reaction was the one nothing in the content printed.
 */
export const STRENGTH_SIGNATURES = [
  {
    /*
     * The Infantry Signature, and the whole Way's thesis: standing next to somebody is worth
     * something. It was prose from the day it was written and is now two steps.
     */
    name: "Shoulder to Shoulder", kind: "card", node: "strength.infantry",
    needs: [],
    primary: [{ verb: "strike" }, { verb: "block", param: 1, area: 1 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "The Wall", kind: "feature", node: "strength.guardian",
    needs: ["an exception to highest-wins, which no bonus group has"],
    text: "Your Blocks stack. You are the one exception to highest-wins."
  },
  {
    /*
     * Built, and it is the node that earned Way of Strength its new resource: the Way root pays in
     * weight now, and this is the build that wants to be over the limit. Armour and encumbrance are
     * both already derived, so doubling one when the other says Overloaded is a line in
     * prepareDerivedData rather than a mechanism.
     */
    name: "Nothing Gets Through", kind: "feature", node: "strength.ironclad", needs: [],
    text: "While you are Overloaded, your armor counts double.",
    armor: { doubleWhenOverloaded: true }
  },
  {
    /*
     * A sixth card wanted the field, and the check written to confirm the other five is what found
     * it: "Ranged." was the first word of its text, doing nothing. Its own gap is the rest of that
     * sentence, so this one is half closed and still carries a `needs`.
     */
    name: "Ranging Shot", kind: "card", node: "strength.artillerist",
    needs: ["the Blast alternative, which has to know you did not Move"],
    primary: [{ verb: "strike", area: 1, areaKind: "aimed", requires: { tag: "ranged" } }],
    secondary: [{ verb: "ready" }],
    text: "Blast instead of Aimed, if you did not Move this turn."
  },
  {
    /*
     * The fourth reaction in the documents whose trigger is not an event -- after Quick Hands,
     * Heckle and the Bard's old wording. "On an ally's turn" is a span, not a moment. The game has
     * `allyHit`, which is a moment, but it is not this one.
     */
    name: "On My Call", kind: "card", node: "strength.tactician",
    /* Two things in one string until the column became a list, which is what a list is for. */
    needs: ["a reaction trigger on an ally's turn", "swapping a card's halves"],
    primary: [{ verb: "ready" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "On an ally's turn: they may play a card in their hand halves swapped, its secondary as a "
      + "primary."
  },
  {
    name: "Cleave to the Bone", kind: "feature", node: "strength.executioner",
    needs: ["a target that can hold a Wound, which an NPC cannot: core-rules 3 draws intent one card per TYPE, so a species shares the deck a Wound would go in"],
    text: "For you, the Wound threshold is 4, not 5."
  },
  {
    name: "The Lance", kind: "card", node: "strength.knight",
    needs: ["advantage conditional on how far you moved"],
    primary: [{ verb: "move", param: 3 }, { verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "Advantage if you moved at least 2. Needs the mount."
  },
  {
    name: "Red Mist", kind: "card", node: "strength.berserker",
    needs: ["drawing back up to hand size mid-turn"],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    costs: { primary: { spent: true } },
    text: "Then draw back up to your hand size at once."
  },
  {
    name: "Loaded Before the Bell", kind: "feature", node: "strength.musketeer",
    needs: ["a loaded state to begin a fight in, since reload is still prose"],
    text: "You begin every combat already loaded, and the first shot of a fight is +2."
  },
  {
    name: "Play to the Crowd", kind: "card", node: "strength.gladiator",
    needs: ["a reaction that grants Block and applies a condition"],
    primary: [{ condition: "compelled", duration: 1, resist: "presence", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }],
    text: "When you are hit: gain Block 2, and the attacker is Compelled (1) -- no save, because "
      + "you have already been hit once."
  },
  {
    name: "Get a Grip", kind: "card", node: "strength.street-fighter",
    needs: ["waiving a save when both hands are empty"],
    primary: [{ condition: "grappled", duration: 2, resist: "might", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }],
    text: "No save at all if both your hands are empty."
  },
  {
    /*
     * Free, and the only Signature in either Way that was already implemented before it was
     * written down: core-rules 3's redirection step and `redirectHit` are this card. Printing it
     * also closes the one reaction nothing in the content carried.
     */
    name: "Interpose", kind: "card", node: "strength.bodyguard", needs: [],
    primary: [{ verb: "defend" }],
    secondary: [{ verb: "move", param: 1 }],
    reaction: "bodyguard",
    text: "Take a hit meant for an adjacent ally."
  }
];

/**
 * Way of Strength's Tactics (way-cards 2.5), derived from the deepest title like Shade's.
 *
 * **Infantry's was renamed.** The document called both its Signature and its Tactic *Shoulder to
 * Shoulder*, so a player would hold a card and carry a standing feature with one name doing two
 * different things -- the card grants an ally Block, the tactic stops either of you being moved.
 * *The Line* is what the tactic is about, and it sits beside Guardian's *The Door* in register.
 */
export const STRENGTH_TACTICS = {
  "The Line":
    "While an ally is adjacent to you, neither of you can be moved against your will.",
  "The Door":
    "An enemy adjacent to you that would move to another square adjacent to you must stop instead. "
    + "You do not pin them; you stop them getting past.",
  "Immovable": "Forced movement never moves you, and difficult ground costs you nothing.",
  "Ranging": "If you did not Move this turn, your ranged attacks ignore cover.",
  "The Call":
    "At the start of a round, name a square. The first ally to end movement there draws fate with "
    + "advantage on their next action.",
  "No Second Thought":
    "When an enemy drops to 0 Health from your Strike, Move 1 at once.",
  "The Charge":
    "If you moved 3 or more squares in a straight line this turn, your Strike cannot be answered by "
    + "a reaction.",
  "Forward Only":
    "You may never move away from the nearest enemy -- and while two or more enemies are adjacent "
    + "to you, you cannot be Dazed or Compelled.",
  "The Firing Step":
    "You may not Strike an adjacent enemy at all -- and your ranged attacks never take the "
    + "ranged-in-melee penalty.",
  "The Crowd Wants Blood":
    "While you are the nearest target to the enemy, your reactions fire even when the hit is not "
    + "serious.",
  "The Alley":
    "While both your hands are empty, an enemy adjacent to you may not Move away except by forced "
    + "movement.",
  "Never Leave Them":
    "When an ally moves, you may Move 1 as a reaction to follow -- and figures never block that "
    + "move."
};