/**
 * Way of Shade: its pool, its Signatures and the Tactics its titles carry.
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */

/* -------------------------------------------- */
/*  The two Way pools                           */
/* -------------------------------------------- */

/**
 * way-cards.md 3.2 and 3.3: the cards a Way's **minor** nodes draw from. Until now every minor node
 * in both Ways granted one of the six common cards, which made the backbone identical in a Way
 * about position and a Way about weight.
 *
 * **`needs` means the engine would have to compute something and cannot.** It does not mean "the
 * engine does not do this": Move is never resolved by the engine at all -- figures are pushed around
 * by hand (core-rules 11) -- so *ignoring difficult ground*, *through enemy squares* and *push 2* are
 * complete cards with a sentence the table applies, not gaps. Drawing that line is what makes the
 * column worth counting, and it moves one Signature (*Over and Past*) from gap to built.
 *
 * Roll With It (Shade) and Set Spear (Strength) are not repeated here: both have been in WAY_CARDS
 * since the reach weapons and the reaction row were built.
 */
export const SHADE_POOL = [
  {
    /*
     * The best setter in the game, and it should be: the only one that works at ANY range. Marked
     * is a *call* rather than a state (core-rules 7), which is why it takes no save -- you cannot
     * resist somebody's opinion of you, you can only wait for them to stop saying it.
     */
    name: "Call the Shot", copies: 1, pool: "shade", needs: [],
    primary: [{ verb: "strike" }],
    secondary: [{ condition: "marked", duration: 1 }],
    text: "Marked on any enemy you can see, at any range."
  },
  /*
   * --- the three cards that answer armour, and why they are Shade's ---
   *
   * **Way of Shade bypasses; Way of Strength breaks.** That is the split, and it was already half
   * written: *Between the Plates* goes through plate against a Marked target, *Heavy Swing* takes
   * two points off by hitting harder. Shade's strikes are mod 0 and &minus;1 where Strength's run
   * to +2, so the Way is already the worse one at delivering damage -- what it should be is the
   * one that does not need to.
   *
   * The three mechanisms the engine has are genuinely different, and one card each is why these
   * are three cards rather than one:
   *
   * | Card | Mechanism | Reads as |
   * |---|---|---|
   * | *Find the Seam* | `ignoresArmour` | **through** it, whatever it is |
   * | *Half-Hilt* | `ignores: 2` | through **two points** of it, and out-armoured by more |
   * | *Round the Shield* | `ignoresBlock` + `ignoresCover` | not through at all, **around** |
   *
   * core-rules 5 keeps armour and Block separate on purpose -- `ignores` comes off armour and
   * never off Block -- so the third is not a stronger version of the first two, it answers a
   * different defence. A raised shield and a plate cuirass are two problems and a knife has two
   * answers.
   *
   * **Every one of them is paid for in damage**, which is the Way's price for this: &minus;1 on
   * two of the three, and all three want a `light` weapon, so none of them can be carried by the
   * character who also hits hardest. They are reachable through *shade.repertoire*, which offers a
   * choice from the Shade pool, so they need no node of their own.
   */
  {
    name: "Find the Seam", copies: 1, pool: "shade", needs: [],
    primary: [{ verb: "strike", mod: -1, ignoresArmour: true, requires: { tag: "light" } }],
    secondary: [{ verb: "move", param: 1 }],
    text: "Armour does not apply. A point weaker than a plain Strike."
  },
  {
    /*
     * **No reaction on this one, and that is a check rather than a taste.** A requirement is checked
     * where the tray picks an item and a reaction never goes through the tray -- it fires on somebody
     * else's turn, from the resolver, with no face to grey out. A card carrying both would gate
     * silently, which the suite already refuses, so a Shade card that asks for a light weapon
     * cannot also be a Parry.
     *
     * The text says nothing about what it is held in either: "both hands" is a kit requirement, and
     * a card that prints one in words while the field carries another is this project's recurring
     * defect in its oldest form.
     */
    name: "Half-Hilt", copies: 1, pool: "shade", needs: [],
    primary: [{ verb: "strike", ignores: 2, requires: { tag: "light" } }],
    secondary: [{ verb: "move", param: 1 }],
    text: "Ignores 2 armour. Reversed grip, straight into the gap."
  },
  {
    name: "Round the Shield", copies: 1, pool: "shade", needs: [],
    primary: [{
      verb: "strike", mod: -1, range: 3,
      ignoresBlock: true, ignoresCover: true, requires: { tag: "light" }
    }],
    secondary: [{ verb: "move", param: 1 }],
    text: "A thrown knife that answers neither a raised shield nor cover. Range 3."
  },
  {
    name: "Between the Plates", copies: 1, pool: "shade", needs: [],
    /* The Mark IS the gap, so the ignore hangs off the opening rather than off the step. It was
     * `text: "ignores armor"` inside the clause, which printed correctly and did nothing. */
    primary: [{ verb: "strike", when: { needs: "marked", ignoresArmour: true } }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Take the Shot", copies: 1, pool: "shade", needs: [],
    primary: [{
      verb: "strike", mod: 1, requires: { tag: "ranged" },
      when: { needs: "marked", advantage: true }
    }],
    secondary: [{ verb: "move", param: 2 }]
  },
  {
    name: "Pin the Shadow", copies: 1, pool: "shade", needs: [],
    primary: [{
      verb: "strike", requires: { tag: "ranged" },
      condition: "slowed", duration: 1, resist: "agility", dc: 5,
      when: { needs: "marked", dc: 7 }
    }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Cut and Run", copies: 1, pool: "shade", needs: [],
    primary: [{ verb: "strike" }, { verb: "move", param: 2 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Light Feet", copies: 1, pool: "shade", needs: [], reaction: "sidestep",
    primary: [{ verb: "move", param: 3 }],
    secondary: [{ verb: "move", param: 2 }],
    text: "Ignoring difficult ground."
  },
  {
    name: "Slip the Knot", copies: 1, pool: "shade", needs: [], reaction: "sidestep",
    primary: [{ verb: "move", param: 2 }],
    secondary: [{ verb: "shake", param: 1 }]
  },
  {
    /*
     * The requirement is on BOTH halves, because the card is about the knife rather than about the
     * throw: a Second Knife thrown from a greatsword is not a thing, and neither is the follow-up.
     */
    name: "Second Knife", copies: 1, pool: "shade", needs: [],
    primary: [{ verb: "strike", range: 3, requires: { tag: "light" } }],
    secondary: [{ verb: "strike", mod: -1, requires: { tag: "light" } }]
  },
  {
    name: "Mock", copies: 1, pool: "shade", needs: [],
    primary: [{ condition: "dazed", duration: 1, resist: "presence", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Sleight", copies: 1, pool: "shade", needs: [], reaction: "use",
    primary: [{ verb: "use" }, { verb: "strike" }],
    secondary: [{ verb: "ready" }]
  },
  {
    name: "Vanish", copies: 1, pool: "shade", needs: [],
    primary: [{ condition: "invisible", duration: 1 }],
    secondary: [{ verb: "move", param: 2 }],
    costs: { primary: { strain: 1 } },
    text: "On yourself."
  },
  {
    /*
     * --- two cards that look into your own deck, and why neither of them bins anything ---
     *
     * core-rules 8 gives the plain top-card peek to EVERYBODY, free, so a card half granting *that*
     * would print a line everyone already has -- the trap that killed the first draft of *Graven
     * Sight*. These grant DEPTH instead, and depth is safe where choice is not: the no-repeat fence
     * on Sift exists to stop a dig, and nothing that changes nothing can dig. So these two need no
     * limit and may be played every time they are drawn.
     *
     * The binning version is deliberately absent from both. It would want `oncePer` set to a fight,
     * which `CARDRPG.limits` does not offer yet, and without that a one-of-sixteen Sift comes back
     * on every Catch Breath and the deck stops having a bottom. Asceticism keeps the bin.
     */
    name: "Count the Odds", copies: 1, pool: "shade",
    needs: ["seeing further than the top card of your own draw pile"],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "sift", param: 2 }],
    reaction: "parry",
    text: "The secondary is seeing only, so you may not reorder them, and you discard nothing."
  },
  {
    name: "Scout Ahead", copies: 1, pool: "shade",
    needs: ["seeing further than the top card of your own draw pile"],
    primary: [{ verb: "move", param: 3 }],
    secondary: [{ verb: "sift", param: 3 }],
    reaction: "sidestep",
    text: "Seeing only, and one card deeper than most: you looked where you were going."
  },
  {
    name: "Smoke and Go", copies: 1, pool: "shade", needs: [],
    primary: [{ condition: "invisible", duration: 1 }, { verb: "move", param: 2 }],
    secondary: [{ verb: "use" }],
    costs: { primary: { spent: true } },
    text: "On yourself."
  }
];

/* -------------------------------------------- */
/*  Way of Shade's Signatures and Tactics       */
/* -------------------------------------------- */

/**
 * The twelve Signatures (rules/way-cards.md 2.2), as content a node can actually grant.
 *
 * `kind` says which document it becomes -- an action card, a feature slate or an item slate -- and
 * it must match the key the granting node uses, or the node names one thing and hands over another.
 *
 * `needs` is the honest part. A Signature whose effect the engine cannot work out is not a bug to
 * hide behind prose: it is a named gap, and this column is the Way of Shade engine backlog read off
 * the content rather than guessed at. Three of the twelve are fully computable; the other nine each
 * name exactly what is missing, and the validator asserts that list so closing one shows up.
 *
 * The three defects worth knowing, all of them the shape this project keeps meeting, and all three
 * now **[FIXED]**:
 *
 *   - **Foresee was a named effect nobody implemented.** The first reading of this was wrong: it is
 *     not a missing *verb*, because core-rules 6 says Foresee "needs no icon of its own" -- it is a
 *     named effect, like Taunt and Stabilize. What was missing was the effect itself, so Foresee
 *     now sits in `CARDRPG.effects` beside Heal and Blast, and `resolveForesee` whispers one NPC
 *     type's intent card to the player. Point Man's remaining gap is narrower and real: the *extra*
 *     type needs to know who is furthest forward, which no engine computes.
 *   - **Heckle was a reaction *"when an enemy acts"*, which is not a trigger.** There are two
 *     events in the game, a hit landing and an enemy arriving. The identical defect was already
 *     fixed on *Quick Hands*, whose trigger used to be "any time on another's turn" -- and the cure
 *     is the same: point it at a real event. It fires on **arrival** now, which is the moment it
 *     reads best, since the enemy walks into reach and attacks on the same turn.
 *   - **Lift collided with `resolveLift`, which does something else.** The engine's removed a
 *     *condition* from a target; the Cutpurse's *Lift* steals a *card* from their deck. Same word,
 *     two mechanics, like `range` meaning both thrown range and melee reach. The published card
 *     keeps its name and the function is `liftCondition`.
 */
export const SHADE_SIGNATURES = [
  {
    /*
     * The Way's keystone, and the one that needed a new field rather than a new mechanism: the
     * card-level `when` clause names ONE opening on purpose, and a build whose whole claim is "I
     * hit whatever you set up" needs any of them. Openings were already a computed list in config
     * and nothing read it at the feature level.
     */
    name: "The Opening", kind: "feature", node: "shade.thief", needs: [],
    text: "Advantage against anyone carrying an opening -- whoever set it.",
    advantage: { vsOpening: true }
  },
  {
    name: "Point Man", kind: "card", node: "shade.scout",
    needs: ["the extra type, which needs to know who is furthest forward"],
    primary: [{ verb: "foresee" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "While you are the furthest forward of your party, Foresee one extra type."
  },
  {
    name: "Named", kind: "card", node: "shade.duellist",
    needs: ["a reaction that also Strikes"],
    primary: [{ verb: "strike" }],
    secondary: [{ condition: "marked", duration: 1 }],
    reaction: "parry",
    text: "Name one enemy. Against it, your Parry also Strikes for 1."
  },
  {
    name: "One Opening", kind: "card", node: "shade.assassin",
    needs: ["doubling, and a clause that reads any opening"],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    costs: { primary: { spent: true } },
    text: "Against a target that is unaware or carrying an opening, the damage is doubled."
  },
  {
    name: "Lift", kind: "card", node: "shade.cutpurse",
    needs: ["taking a card from another deck"],
    /* The name is the card's. The engine's condition-removal is `liftCondition` now. */
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "On a hit, take one card from the target's own deck. It is yours now, and it is in your "
      + "deck for good."
  },
  {
    /*
     * An item rather than a card or a feature, and the only Signature that is. Weight 3 you may
     * never put down IS the Burglar's price (Preparation / weight) expressed as a thing you carry,
     * which is why it reads as an item and not as a sentence.
     */
    /* No price: a Signature is granted, not bought -- and `cost` is a SPELL's field anyway, which
     * is why this one was dropped on the way into the document rather than stored as zero. */
    name: "The Kit", kind: "item", node: "shade.burglar", needs: [],
    slot: "pack", weight: 3,
    text: "You may never put it down. Every Hard physical obstacle becomes Normal."
  },
  {
    name: "Loose and Step", kind: "card", node: "shade.archer", needs: [],
    primary: [{ verb: "strike", requires: { tag: "ranged" } }, { verb: "move", param: 1 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Set", kind: "card", node: "shade.trapmaker",
    /* The gap this card was queued under was "placing a trap on a square", and `ground` is that:
     * a shape, a square, and a trap the first to enter sets off. What the trap DOES is the step's
     * own condition and the Strike value it borrows. */
    needs: [],
    primary: [{
      verb: "ready", condition: "slowed", intensity: 2,
      ground: { shape: "square", effects: ["trap"] },
      text: "an adjacent square; the first enemy to enter takes your Strike value"
    }],
    secondary: [{ verb: "ready" }],
    text: "Place a trap on an adjacent square."
  },
  {
    name: "Over and Past", kind: "card", node: "shade.acrobat",
    needs: ["moving through an occupied square"],
    primary: [{ verb: "move", param: 3 }],
    secondary: [{ verb: "move", param: 1 }],
    reaction: "sidestep",
    text: "You may move through enemy squares."
  },
  {
    name: "Heckle", kind: "card", node: "shade.bard", needs: [],
    primary: [{ condition: "heckled", duration: 1, resist: "presence", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }],
    reaction: "heckle",
    text: "An enemy arriving next to you draws fate with disadvantage until your next turn."
  },
  {
    name: "Double or Nothing", kind: "card", node: "shade.gambler",
    needs: ["two fate draws that both apply"],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "Draw two fate cards -- both apply, added together. Variance, not advantage."
  },
  {
    /*
     * The slots are on the NODE, not here. A number carried by a granted slate is a number in a
     * document, and a document can be deleted; a number on a node is derived every time the sheet
     * is prepared and cannot drift (rules/leveling.md 9). So a Signature feature carries the text
     * and the node carries the figure -- which the validator enforces for all of them.
     */
    name: "One Trick", kind: "feature", node: "shade.half-mage", needs: [],
    text: "You may prepare from any one school you have ever seen cast."
  }
];

/**
 * The twelve Tactics (way-cards 2.5): a standing feature that makes a different **position**
 * correct, always on and never a number.
 *
 * **These are not granted.** way-cards says *you only ever have your deepest title's*, so a Tactic
 * is a property of the title you currently hold, not a slate you accumulate -- otherwise a
 * Cutpurse-Gambler would carry both. It is derived in `graph.mjs` beside the title itself, from
 * this table, keyed by the Tactic's name as the node prints it.
 */
export const TACTICS = {
  "Never Where You Looked":
    "An enemy that attacks you and misses may not attack you again this round.",
  "Furthest Forward":
    "While no ally is nearer the enemy than you, you have cover from every figure on the field, "
    + "not only those in the line.",
  "One at a Time":
    "While exactly one enemy is adjacent to you, it has disadvantage against you and you have "
    + "advantage against it.",
  "From Behind": "You have advantage against any enemy that is adjacent to one of your allies.",
  "Light Fingers":
    "The first time each fight you end your turn adjacent to an enemy that has not attacked you, "
    + "take one item from its belt.",
  "Through the Window":
    "You ignore difficult ground, and no enemy blocks your movement in a square that holds an "
    + "obstacle.",
  "Overwatch":
    "Once a round, when an enemy ends its movement in your line of sight and within range, "
    + "Strike it as a reaction.",
  "The Ground You Chose":
    "Every square you have occupied this fight is difficult ground for your enemies.",
  "Never Cornered":
    "When you are attacked, you may Move 1 as a reaction before damage is worked out.",
  "The Running Commentary":
    "An enemy within 3 of you that would draw fate with advantage draws normally instead.",
  "The Long Odds":
    "While two or more enemies are adjacent to you, you draw fate with advantage.",
  "One Hand Free":
    "You may Cast with a weapon in your other hand. Casting never needs a hand free."
};