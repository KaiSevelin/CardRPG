/**
 * The intent pool: what an NPC does on its turn, earned by capability rather than
 * written per creature (core-rules 3).
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */

/* -------------------------------------------- */
/*  The intent pool                             */
/* -------------------------------------------- */

/**
 * The common intent pool (core-rules 9).
 *
 * **A card is a shape and the creature supplies the numbers.** That is the same split a player's
 * card has always had -- *a card half says what you do; the item says how well* (config.mjs) -- and
 * it is what lets one pool serve a roster: `Close In` is three squares for a goblin and six for a
 * warg because `move` with no `param` means *your speed*, and the Strike comes off whatever the
 * creature fights with.
 *
 * **A card earns its place by capability, not by name.** `needs` lists what a creature must be able
 * to do; its deck is the subset it qualifies for. So adding a monster is declaring what it can do,
 * and a card added here joins every creature that already qualifies without anybody revisiting them.
 *
 * **Five shapes need nothing and three need only that the creature can move**, which is eight for
 * anything with legs and five for the one thing without them. A first pass had four, and
 * twenty-seven of the fifty-five creatures landed on five cards or fewer: four universals plus
 * one special. The floor is what generic shapes buy, and they are the cheap half of a pool.
 *
 * `move` is the one capability a card asks for that no creature declares, because it is derived
 * from having legs, wings, fins or a tunnel -- and the Queen, who has none of them, is what makes
 * asking for it worth the trouble rather than assuming it.
 *
 * Nothing here carries a condition except through the creature: *Envenom* applies **your own**, so
 * one card is a goblin's dirty trick, a slitherer's venom, a Keres' disease and a Strigoi's bite.
 */
export const INTENTS = [
  /* --- the five anything can draw -------------------------------------------------------------
   *
   * **It was eight, and eight was between 67% and 100% of every deck in the game.** Median 80%:
   * four cards in five were the same four cards whichever creature you were looking at, and the
   * Processor's deck was the universal eight and nothing at all besides. Specials sat on top of
   * that sameness rather than displacing it.
   *
   * Three of the eight left, and none of them was ever really universal -- *Hold the Line* spends
   * your turn putting Block on the creature beside you, *Set and Wait* holds a reaction back for
   * whoever comes, *Take Stock* does nothing this round so as to shake a condition off. Those are
   * things a disciplined thing does and a hungry thing does not. They are gated on temperament now
   * (config.mjs `temperaments`), which every creature has exactly one of, and the five that remain
   * are the ones that really are true of a beetle and a general alike: close, hit and step, hit
   * twice, hit everything next to you, and leave when it is going badly.
   */
  {
    name: "Close In", needs: ["move"], text: "Move your speed, then Strike.",
    sequence: [{ verb: "move" }, { verb: "strike" }]
  },
  {
    name: "Strike and Step", needs: ["move"], text: "Strike, then move your speed away.",
    sequence: [{ verb: "strike" }, { verb: "move" }]
  },
  {
    name: "Press", needs: [],
    text: "Strike, and Strike again at −1. Nothing clever, twice.",
    sequence: [{ verb: "strike" }, { verb: "strike", mod: -1 }]
  },
  {
    name: "Lash Out", needs: [],
    text: "Strike every figure adjacent to you, friend or not.",
    sequence: [{ verb: "strike", area: 1, areaKind: "blast" }]
  },
  {
    name: "Give Ground", needs: ["move"],
    text: "Move your speed away from the nearest enemy. A hurt thing that can leave, does.",
    sequence: [{ verb: "move" }]
  },

  /* --- drilled: it is part of something, and spends turns on the thing it is part of ----------
   *
   * Both of these were universal, and both are about somebody else: one hands Block to the
   * creature beside you, the other keeps a reaction back for whoever arrives. `drilled` is
   * equivalent to a `shieldWall`, `bodyguard` or `commander` tactic (config.mjs), so the line
   * infantry, the walls that walk and every officer in the Horde draw them, and the things that
   * hunt alone no longer do.
   */
  {
    name: "Set and Wait", needs: ["drilled"],
    text: "Defend, and keep a reaction for whoever comes.",
    sequence: [{ verb: "defend" }]
  },
  {
    name: "Hold the Line", needs: ["drilled"],
    text: "Defend, and an ally adjacent to you gains Block 1.",
    sequence: [{ verb: "defend" }, { verb: "block", param: 1, range: 1 }]
  },

  /* --- feral: no plan beyond the body, and the body is enough --------------------------------- */
  {
    name: "Gorge", needs: ["feral"],
    text: "Strike, and eat what comes away: shake one condition off yourself.",
    /* The feral answer to *Take Stock*, and a better-shaped card than it: a thing with no mind
     * does not take stock, it feeds, and feeding is an attack rather than a wasted round. */
    sequence: [{ verb: "strike" }, { verb: "shake", param: 1 }]
  },
  {
    name: "Thrash", needs: ["feral", "move"],
    text: "Strike every figure adjacent to you, then move your speed away from all of them.",
    sequence: [{ verb: "strike", area: 1, areaKind: "blast" }, { verb: "move" }]
  },
  {
    name: "Knock It Down", needs: ["feral"],
    text: "Strike with the whole weight of you; on a hit the target is Prone.",
    /* The only Prone in the pool. Twenty-eight intents and nothing in them put anybody on the
     * ground, which for a roster of charging animals was a gap rather than a decision. */
    sequence: [{ verb: "strike", condition: "prone", duration: 1 }]
  },

  /* --- wits: it can see past the thing in front of it ----------------------------------------- */
  {
    name: "Take Stock", needs: ["wits"],
    text: "Nothing this round, and shake one condition off.",
    sequence: [{ verb: "shake", param: 1 }]
  },
  {
    name: "Pick the Soft One", needs: ["wits", "move"],
    text: "Move your speed and Strike whoever is least ready for it, round the shield rather "
      + "than through it: Block does not answer this.",
    /* The monster side's first use of `ignoresBlock`, and the reason it reads as cunning rather
     * than as strength: going round a guard is a choice, and going through one is a number. */
    sequence: [{ verb: "move" }, { verb: "strike", ignoresBlock: true }]
  },
  {
    name: "Spoil the Ground", needs: ["wits"],
    text: "Nothing at anybody: one square within reach is a trap now, and stays one.",
    sequence: [{ verb: "ready", ground: { shape: "square", effects: ["trap"] } }]
  },

  /* --- reach and distance --------------------------------------------------------------------- */
  {
    name: "Loose", needs: ["ranged"], text: "Strike at your weapon's range.",
    sequence: [{ verb: "strike" }]
  },
  {
    name: "Spray", needs: ["spray"],
    text: "Strike everything in the area, at range. Whatever you breathe, you breathe it on "
      + "your own kind too.",
    sequence: [{ verb: "strike", areaKind: "blast" }]
  },
  {
    name: "Long Arm", needs: ["reach"],
    text: "Strike at reach without closing, and stay where you are.",
    sequence: [{ verb: "strike" }]
  },

  /* --- speed and weight ----------------------------------------------------------------------- */
  {
    name: "Charge", needs: ["fast", "move"],
    text: "Move double your speed in a straight line, then Strike. The distance is the damage.",
    sequence: [{ verb: "move" }, { verb: "strike", mod: 1 }]
  },
  {
    name: "Bull Through", needs: ["brute", "move"],
    text: "Move your speed through a figure in the way, pushing it aside, then Strike.",
    sequence: [{ verb: "move" }, { verb: "strike" }]
  },
  /*
   * --- four intents that answer armour, and the arithmetic that sized them ---
   *
   * The roster could already pierce, but only as a property of **what a creature is**: a Tail Club
   * ignores 2, an Acid Spray ignores 2, and 22 of the roster's 82 attacks carry a number. What it
   * could not do was have a **round** where it went for the gap -- two intents in thirty-seven
   * touched either flag.
   *
   * **The sizing constraint is the deck, and it is severe.** An intent deck is 7 to 14 cards
   * (median 10) and core-rules 3 draws one card per **type**, so a card fires roughly once a
   * fight -- and when it does, *every creature of that type* acts on it. Against a character in
   * Plate:
   *
   * | | per attacker | five of them |
   * |---|---|---|
   * | `ignores: 2` | 3 - (4-2) = **1** | 5 in that round |
   * | `ignoresArmour` | **3** | **15**, which kills a 12-Health hero outright |
   *
   * So the two flags cannot share a gate. A **number** is safe on a broad capability; a **total**
   * bypass is only safe where swarms cannot reach it, and that is a fact about the roster rather
   * than a judgement: of the eight creatures with `grapple`, **none** has `pack`. The base Goblin
   * has `wits`, which is why `wits` gets the number and not the bypass.
   */
  {
    name: "Find the Joint", needs: ["wits"],
    text: "Strike where the harness is buckled rather than where it is thickest: ignores 2 armour.",
    sequence: [{ verb: "strike", ignores: 2 }]
  },
  {
    /*
     * The total bypass, and it is safe here for a reason that is counted rather than felt: no
     * creature in the roster has both `grapple` and `pack`, so this can never be multiplied by a
     * swarm. *Drag Down* already applies Grappled on the same gate, so the pair is a real sequence
     * a GM can play: hold it still, then put the point where you like.
     */
    /*
     * **The text was rewritten because an image model would not draw the first one** (`art.mjs`,
     * ART_REFUSED). The rule is untouched -- a grapple creature striking what it already holds,
     * past armour -- but the brief is generated from this line, and a brief that reads as a pinned
     * body under a weapon is a brief that gets refused however it is worded.
     *
     * The rewrite is better anyway, which is the argument for making it rather than retrying:
     * *where it is held* now means **where the armour is held**, the strap and the buckle under a
     * hand that is already there. That is what the card's name says, and the old line did not.
     *
     * Not the same card as *Prise It Open*, and the difference is worth keeping straight: that one
     * levers a harness open as a two-round setup and leaves the target Exposed for anybody, while
     * this one goes through the gap it is already holding, once, now.
     */
    name: "Where It Is Held", needs: ["grapple"],
    text: "A hand already on the strap. Armour does not apply: it is not holding anything on.",
    sequence: [{ verb: "strike", ignoresArmour: true }]
  },
  {
    /*
     * Conditional, which is how a broad gate can carry the total bypass: ten of the forty-four
     * feral creatures run in packs, and none of them can use this until something has knocked the
     * target off balance. The same shape as *Between the Plates*, whose gap is a Mark.
     */
    name: "Worry It", needs: ["feral"],
    text: "Tear at a target already off balance, and armour does not come into it.",
    sequence: [{ verb: "strike", when: { needs: "offBalance", ignoresArmour: true } }]
  },
  {
    /*
     * **The setup, which is what makes the rest of these affordable.**
     *
     * `exposed` is **armour counting 0** for a turn, and it is the answer to a problem a flag could
     * not solve: on the NPC side a piercing card is drawn once per *type*, so `ignoresArmour` on a
     * swarm is five attackers at full damage in one round and `ignores: 2` is almost nothing.
     * Exposing instead makes the big hit cost **two** rounds, lets the second one come from
     * somebody else, shows on the token while it lasts, and can be Shaken Off -- none of which a
     * flag on a step could do.
     *
     * It zeroes rather than reduces, which is the version worth what the target was relying on: 4
     * points against Plate and 1 against Leather. A flat -2 was worth most to whoever had least to
     * lose, which is backwards -- and that is not an argument, it is now a measurement. Swapping
     * this card to `ignores: 1` costs the hero **5.0** points of win rate in Leather and **0.0**
     * in Plate, because ignoring 1 of 1 armour is ignoring all of it. The regressive version is
     * the one that hurts the lightly armoured character.
     *
     * `brute` because it is a thing done with weight: 24 creatures have it and only two run in
     * packs.
     *
     * **[2026-11-08] This card is why the condition clock changed.** The comment here used to say
     * the two-round play *belongs to the big single enemies that need it*, and a big single enemy
     * was the one creature that could not collect it: durations ticked at the START of their
     * creator's turn, so an Exposed set here was gone before the brute that set it swung again.
     * The second attacker had to be a creature of another type, and of the 24 with `brute` only
     * **2** run in packs. The card measured at **0.3 / 1.1 / 0.6** points of the hero's win rate
     * at armour 1 / 3 / 4 -- against five attackers all acting on one intent card, nobody attacked
     * during the window it opened at all.
     *
     * **[MEASURED 2026-11-09] The clock now runs from the end of the creator's turn to the end of
     * their next, and the same card measures 2.1 / 4.6 / 2.5** -- four times what it was, with
     * nothing about the card changed. The creature that spends a turn levering a harness open is
     * the one who gets to hit the gap. That is the whole of what *setup and payoff* was supposed
     * to mean, and for as long as the clock ran the other way this card was the proof it did not.
     * 2500 fights a cell, five spears.
     *
     * **It is also the only thing in the game besides the Critical that applies Exposed, and no
     * player card may join it** (2026-11-08 decision; conditions.md 9). A player's route to Exposed
     * is *Find the Gap* out of the critical deck and nothing else, which is what keeps a condition
     * that takes a whole defence to nothing on the far side of a 5% draw rather than on a schedule.
     * The validator pins the applier list both ways round.
     */
    name: "Prise It Open", needs: ["brute"],
    text: "Get into the harness and lever. Exposed: their armour counts 0 for a turn.",
    sequence: [{ verb: "strike", condition: "exposed", duration: 1 }]
  },
  {
    /*
     * **And the other setup, which nothing on this side of the table could do.**
     *
     * Three cards apply Off Balance and **all three are the players'** -- so four cards keyed off
     * it, *Worry It* among them, and a monster had no way to make its own opening. A card gated on
     * a condition its own side cannot create is dead content, which is this project's commonest
     * defect wearing a different hat.
     *
     * `pack` and `move`, because this is the thing a swarm is for: one of them takes your legs
     * and the rest are already on top of you. Off Balance now costs a point of Block as well as
     * being an opening, so the round it buys is worth having.
     */
    name: "Take the Legs", needs: ["pack", "move"],
    text: "Move and Strike low; on a hit the target is Off Balance.",
    sequence: [{ verb: "move" }, { verb: "strike", condition: "offBalance", duration: 1 }]
  },
  {
    /*
     * The other axis, which was thinner still: one intent in thirty-seven went round a shield.
     * `fast` rather than `wits` because this is about being quicker than the arm holding it, and
     * because Block is a smaller number than armour -- going round one is worth less than going
     * through the other, so a broader gate is affordable.
     */
    name: "Round the Guard", needs: ["fast"],
    text: "Strike before the shield comes across. Block does not answer this.",
    sequence: [{ verb: "strike", ignoresBlock: true }]
  },
  {
    name: "Bring It Down", needs: ["siege"],
    text: "Strike a door, a wall or a held position, ignoring its armour entirely.",
    /* `ignores: 99` said this by being a number larger than any armour in the game, which is a
     * promise about the roster rather than about the card. The named field says it outright. */
    sequence: [{ verb: "strike", ignoresArmour: true }]
  },

  /* --- numbers -------------------------------------------------------------------------------- */
  {
    name: "Swarm", needs: ["pack", "move"],
    text: "Move, then Strike at +1 for each ally already adjacent to your target.",
    sequence: [{ verb: "move" }, { verb: "strike", mod: 1 }]
  },
  {
    name: "Drag Down", needs: ["grapple"],
    text: "Strike; on a hit the target is Grappled and goes nowhere.",
    sequence: [{ verb: "strike", condition: "grappled", duration: 1 }]
  },

  /* --- what it leaves behind ------------------------------------------------------------------- */
  {
    name: "Envenom", needs: ["venom"],
    text: "Strike; on a hit it carries whatever you carry.",
    sequence: [{ verb: "strike" }]
  },
  {
    /*
     * The only card in the pool that takes a card out of a player's hand, and the discard is a
     * text rider on a Strike for the same reason Envenom's venom is: the engine has no verb for
     * it. Discard and never Spent -- what a discard costs is the round, because a breath brings it
     * back, and Spent off a card an enemy redraws every other round takes the fight away.
     *
     * The PLAYER chooses which card. It is still a tax, and the choice is what keeps it from being
     * a fishing expedition; GM's choice is a different card and belongs to an elite with a face-up
     * reaction. And it aims itself -- four reserved reactions is four things to lose, while a
     * player who already spent their hand eats a plain Strike.
     */
    name: "Rattle", needs: ["terrify"],
    text: "Strike, and the target discards one card out of their hand — their choice.",
    sequence: [{ verb: "strike" }]
  },
  {
    name: "Feed", needs: ["drain"],
    text: "Strike an adjacent figure and heal what you took out of it.",
    sequence: [{ verb: "strike" }, { verb: "heal" }]
  },

  /* --- arriving and leaving -------------------------------------------------------------------- */
  {
    name: "Go Under", needs: ["burrow"],
    text: "Leave the map. Next round you arrive anywhere you could have walked to.",
    sequence: [{ verb: "move" }]
  },
  {
    name: "Submerge", needs: ["swim"],
    text: "Go under the water. Next round you surface anywhere along it.",
    sequence: [{ verb: "move" }]
  },
  {
    name: "Stoop", needs: ["flight"],
    text: "Arrive from above: move twice your speed, then Strike.",
    sequence: [{ verb: "move" }, { verb: "strike" }]
  },
  {
    name: "Fade", needs: ["stealth", "move"],
    text: "Move your speed and become Hidden. You were never standing there.",
    sequence: [{ verb: "move" }, { verb: "strike", condition: "invisible", duration: 1 }]
  },
  {
    name: "Lie Still", needs: ["dormant"],
    text: "Nothing at all, and the next Strike you make cannot be answered by a reaction.",
    sequence: []
  },

  /* --- the ones that act on somebody else ------------------------------------------------------ */
  {
    name: "Order", needs: ["commander"],
    text: "An ally within sight acts again, or moves its speed. You do nothing yourself.",
    sequence: []
  },
  {
    name: "Call More", needs: ["summon"],
    text: "Something arrives at the edge of the scene. The GM says what and how much.",
    sequence: []
  },
  {
    name: "Work the Weave", needs: ["caster"],
    text: "Cast one from your own short list.",
    sequence: [{ verb: "cast" }]
  },
  {
    name: "Carry", needs: ["transport", "move"],
    text: "A willing ally rides: it moves with you, and may still act when you stop.",
    sequence: [{ verb: "move" }]
  },
  {
    name: "Shelter", needs: ["shelter"],
    text: "Allies within 1 cannot be targeted at range while you stand.",
    sequence: [{ verb: "defend" }]
  },

  /* --- three cards that belong to a creature rather than to a capability -----------------------
   *
   * **The only authored cards in the pool, and the list is closed at three.** `only` names the
   * kinds that draw them (`deckFor` in monsters.mjs), and each one exists because a creature's
   * whole stated point could not be said in capabilities:
   *
   *  - The Queen *spends every turn on the army instead* -- and drew seven cards, the smallest
   *    deck in the game, the same seven as the Five Legs Adjutant.
   *  - The Skaah is *a drop ship, balloon-like, gigantic, and full of something worse* -- with no
   *    card anywhere that let the something out.
   *  - The Processor *is what a scene looks like before the fight* -- and its deck was the eight
   *    universals and nothing else, the only creature in the game with no card of its own at all.
   *
   * Three is the whole budget. A fourth would mean the capability that should have carried it was
   * missing, and the honest fix for that is a capability.
   *
   * These are also the **only intent cards whose art may show a creature**: the ban on species
   * markers is there because an intent back sits behind a goblin and a dragon alike, and a card
   * exactly one kind can ever draw has no such problem.
   */
  {
    name: "The Hive Obeys", only: ["queen"], needs: ["commander"],
    text: "Three allies within sight each move their speed, or one of them acts twice. "
      + "She does nothing herself but decide.",
    sequence: []
  },
  {
    name: "Open the Hold", only: ["skaah", "skaah-bloated"], needs: ["transport"],
    text: "The belly splits along the seam: whatever it was carrying is on the ground beside it, "
      + "and may act this round.",
    sequence: []
  },
  {
    name: "Carry It Off", only: ["processor", "processor-driller"], needs: ["move"],
    text: "Move your speed, take hold of a figure already down, and leave with it. "
      + "The Horde eats what it wins.",
    sequence: [{ verb: "move" }]
  }
];