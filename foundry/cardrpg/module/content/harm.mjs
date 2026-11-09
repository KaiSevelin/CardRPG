/**
 * What a deck can deal you that is not damage: injuries, twists, the faces of the cards
 * nobody chose to put in a deck, and what a Critical did.
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */

/**
 * Every base creature in the game, in one list.
 *
 * The goblin is declared below the table rather than inside it, because it is older than the table
 * and `createStarterContent` builds it by name -- but it belongs to the roster, and it is the only
 * creature in it whose numbers were measured rather than reasoned, so everything else is a ratio to
 * this entry (sim/analysis-2026-10-21.md onward).
 */
/**
 * **The fourteen permanent injuries, and what each one is written in.**
 *
 * Nothing here is a new mechanism, which is the claim worth checking rather than believing:
 *
 * | Written in | Existed for | Used by |
 * |---|---|---|
 * | a negative `bonus.range` | Good Aim, which had no reader until now | Lost Eye |
 * | a negative `grants` | a feature that raises a standing number | Lost Hand, Shaken Faith, Rotted |
 * | `takes.move` | Frozen's `moveReduction` | Bad Leg |
 * | `takes.handSlots` | the hands slot's capacity | Lost Hand |
 * | `blocksReactions` | Plate taking your Parry | Shattered Nerves |
 * | `takes.fateMiss` | `resolveHex`, and Shadow Magic's own price | Hexed Blood |
 * | `intruder` | the whole intruder table (core-rules 8) | five of them |
 * | prose | the table adjudicating | Lost Fingers, Scarred Face |
 *
 * **Twelve of the fourteen are a number the engine reads.** The two that are prose are prose for a
 * stated reason rather than for want of trying: *Scarred Face* cuts both ways and the direction
 * depends on who is looking at you, and *Lost Fingers* is a **cap** rather than a penalty -- it
 * makes a fine tool behave as if untrained, and nothing on a slate can reach the untrained cap
 * where it is applied. That is the honest `[OPEN]` in this table, and it is one field away.
 *
 * **Five of them carry intruder cards, and that is where a permanent condition gets teeth.** A
 * flat -1 is the same every round and a card is not: *Night Fears* moves you when the deck
 * decides, and *The Eager Hand* swings at whoever is nearest. The curse the engine could not
 * enforce (equipment.md 11's `[OPEN]`) is enforced by owning cards.
 *
 * **The distribution is lopsided on purpose, and it is worth seeing.** Five of the fourteen are
 * Maimings, because ideas.md's six examples were all written as what a sword does to a body. With
 * a cap of one injury per category, that means a character who has lost an eye can never lose a
 * leg -- the same ritual regrows both, so they are one category, and the cap follows the ritual
 * rather than the anatomy. **[OPEN]** Whether that is too coarse is a question for play, and the
 * dial is a Maiming/Blinding split with a second ritual behind it. It is not a question the
 * arithmetic can answer.
 */
export const INJURIES = [
  /* --- Maiming: flesh and bone that did not grow back. Lifted by a Regrowth. --- */
  {
    name: "Lost Eye", category: "maiming",
    text: "Range &minus;2 with a ranged weapon. Disadvantage on Wits checks that need both eyes.",
    bonus: { verb: "strike", range: -2, requiresTag: "ranged" },
    description: "<p>Depth is a thing you had and now estimate. The bow still draws; the arrow "
      + "lands where you guessed.</p>"
  },
  {
    name: "Lost Fingers", category: "maiming",
    text: "Fine tools give at most +1, as if you were untrained with them.",
    description: "<p>A lockpick needs three fingers and patience. You have the patience.</p>"
  },
  {
    name: "Lost Hand", category: "maiming",
    text: "One hand slot instead of two. You may carry less.",
    takes: { handSlots: 1 }, grants: { carry: -2 },
    description: "<p>A shield or a sword, and never the pair. A hook helps with the second "
      + "problem and not the first.</p>"
  },
  {
    name: "Bad Leg", category: "maiming",
    text: "Every Move value you play is &minus;1.",
    takes: { move: 1 },
    description: "<p>It set wrong, and it set. You walk everywhere you used to walk, and you "
      + "arrive after everyone else.</p>"
  },
  {
    name: "Scarred Face", category: "maiming",
    text: "Disadvantage on Presence with strangers. Advantage when you mean to frighten them.",
    description: "<p>The first thing anyone learns about you, before you have said a word. "
      + "Sometimes that is the whole negotiation.</p>"
  },

  /* --- Breaking: nerve, memory and conviction. Lifted by a Quieting. --- */
  {
    name: "Shattered Nerves", category: "breaking",
    text: "You may play no reactions in the first round of a combat.",
    blocksReactions: ["parry", "block", "sidestep", "counter", "use", "heckle", "bodyguard",
      "unmake", "mend", "bargain"],
    firstRoundOnly: true,
    description: "<p>The fight starts and you are somewhere else for a moment. Brace is still "
      + "yours &mdash; it is the one nobody can take (core-rules 3).</p>"
  },
  {
    name: "Shaken Faith", category: "breaking",
    text: "One spell slot fewer. What you knew is still written down.",
    grants: { spellSlots: -1 },
    description: "<p>The formula is intact and the conviction is not, and only one of those is "
      + "the part that casts.</p>"
  },
  {
    name: "Night Fears", category: "breaking",
    text: "A Fear card is in your action deck, and no rest takes it out.",
    intruder: { kind: "fear", amount: 1 },
    description: "<p>It comes up when it comes up, and you are one square further from whatever "
      + "you were about to do.</p>"
  },

  /* --- Curse: somebody did this on purpose, so the ritual has to name them. --- */
  {
    name: "Hexed Blood", category: "curse",
    text: "A permanent Miss in your fate deck. It survives every reshuffle.",
    takes: { fateMiss: 1 },
    description: "<p>Measured at &minus;3.5 against the published encounters &mdash; five Wounds, "
      + "in one card that is drawn for every action you take. Shadow Magic buys the gentler "
      + "version of this willingly, one Wild per formula.</p>"
  },
  {
    name: "The Eager Hand", category: "curse",
    text: "Two Rage cards in your action deck. Each strikes the nearest creature, ally or enemy.",
    intruder: { kind: "rage", amount: 2 },
    description: "<p>The curse the Blade of the Eager Hand has carried in prose since equipment.md "
      + "11.4 was written, in the cards that do what the prose says. Put the blade down and the "
      + "hand still wants it.</p>"
  },
  {
    name: "Compelled Step", category: "curse",
    text: "A Compulsion card in your action deck. While it is in hand you may not Catch Breath.",
    intruder: { kind: "compulsion", amount: 1 },
    description: "<p>Somebody decided you would not be allowed to stop, and then went away.</p>"
  },

  /* --- Corruption: Taint that went past the point a cure reaches. Lifted by a Cleansing. --- */
  {
    name: "Rotted", category: "corruption",
    text: "Maximum Health &minus;2. A cure does nothing; the rot is what you are made of now.",
    grants: { health: -2 },
    description: "<p>Afflicted ends when you are under three Taint (core-rules 8). This does "
      + "not end.</p>"
  },
  {
    name: "Hollow Eyes", category: "corruption",
    text: "Two Doubt cards in your skill deck. They clear when a scene ends, and come back.",
    intruder: { kind: "doubt", amount: 2 },
    description: "<p>The skill deck returns on a rest and not on a breath, which is why a Doubt "
      + "costs more than a Wound (skill-rules 1). Two of them, for as long as this lasts.</p>"
  },

  /*
   * --- Obligation: no ritual, on purpose. ---
   *
   * Bound Taint has had this asymmetry since it was written -- *neither a cure nor Cleansing lifts
   * it; the obligation names the one thing that does* -- and keeping it is what stops the ritual
   * list becoming a laundry service. The four that lift are a service; this is a story.
   */
  {
    name: "The Debt", category: "obligation",
    text: "A Compulsion card in your action deck. No ritual lifts it. The one who is owed says what does.",
    intruder: { kind: "compulsion", amount: 1 },
    description: "<p>You agreed to this, which is the whole difference between it and a curse "
      + "&mdash; and the reason no amount of Lore will undo it (leveling.md 4).</p>"
  }
];

/* -------------------------------------------- */

/**
 * The nine languages of Firma, read off the world's own list (worldinfo/Firma.md, *Languages*).
 *
 * **A language is a levelling reward and not a stat**, which is why it lives here beside the
 * trainings rather than in the character model: `grants: { language: "Elvish" }` is the same shape
 * as a training, and for the same reason -- a node hands it over, the sheet derives it, and nothing
 * is copied onto a character that a corrected node could not fix.
 *
 * The `of` line is the world's, not ours. It is what decides where a language is taught: a tongue
 * is learned where its speakers are studied, so the school that knows who owes whom among the
 * elf-kin is the school that teaches Elvish.
 */
/**
 * The twist deck (skill-rules 4): what a Partial costs and what a Fail does instead.
 *
 * **Thirty cards of eight kinds, and the counts are the tone rather than arithmetic.** Strain,
 * Noise, Time, Gear, Arrival and Opening are common, so most twists push the story sideways; Hurt
 * and Secret are rare, so they land hard when they come. Changing a count changes what the game
 * feels like, which is why the numbers live in one place and are checked against the document.
 *
 * **Each twist is a question, not a script.** The card names the kind of trouble and the GM says
 * what it looks like here, which is why `cost` is prose and there is no effect field: *Hurt* is
 * *lose 2 Health, or gain a condition that fits*, and no engine chooses between those.
 *
 * Two of them are not only prose. **Time** adds a second point of Pressure in a challenge (4,
 * *twists stack with the challenge tracks*), and **Opening** is the fail-forward valve -- *this one
 * gives* -- so both are flagged for the challenge code rather than left to be read.
 */
export const TWISTS = [
  { name: "Noise", copies: 4, cost: "Attention. The opposition now knows something is wrong." },
  { name: "Time", copies: 4, pressure: 1,
    cost: "The clock. Pressure +1 on top of the normal cost." },
  { name: "Gear", copies: 4,
    cost: "A tool. It breaks or is lost: no tool bonus until repaired or replaced." },
  { name: "Strain", copies: 5,
    cost: "Cards. Discard 1 skill card of the GM's choice from your hand." },
  { name: "Hurt", copies: 3, cost: "Health. Lose 2 Health, or gain a condition that fits." },
  { name: "Arrival", copies: 4, cost: "Someone new. A third party walks into the scene." },
  { name: "Secret", copies: 2,
    cost: "Information, in either direction. You learn something unwelcome, or they learn "
      + "something about you." },
  { name: "Opening", copies: 4, gives: true,
    cost: "Nothing \u2014 this one gives. The complication also creates an opportunity." }
];

/**
 * **The ritual twist deck: what happens when a recipe goes wrong.**
 *
 * Ritual Magic's price is *"Time, and a recipe that can go wrong"* (specializations.md), and the
 * second half of that had no cards. A ritual is a downtime challenge, so a Partial or a Fail
 * already draws a twist -- and drawing from `TWISTS` was the wrong answer for a reason worth
 * writing down.
 *
 * **A second deck has to earn itself, or it is a fourth name for a rule this file already has.**
 * That is the mistake a Burden card would have been, and the one a Hex avoided by turning out to
 * be a Miss. What earns this one is that a ritual's failures are *about the thing being lifted*:
 * every card here is the injury, the curse or the god answering back, which is not a shape any
 * general twist can take. *Noise* costs you attention; **It Answers** costs you the attention of
 * the one who did this to you.
 *
 * Eight kinds, 24 cards, and the same card model the twist deck uses -- a name, a prose cost, and
 * two fields for the two that are not only prose. **Which deck it is drawn from is the whole
 * difference**, which is the lesson the intruder table paid for: the deck a card lands in is the
 * dial, and here it is the only one that was needed.
 *
 * **Nothing here inflicts an injury**, and that is deliberate rather than an oversight. Permanence
 * passes through one gate in this game -- the fate draw on falling Unconscious (core-rules 8) --
 * and a ritual twist that handed out a fresh injury would be the second, which is how the most
 * consequential rule in a game comes to be stated in two places. **It Sets** is the worst card
 * here and it does the other thing instead: it makes the injury *bound*, which is Bound Taint's
 * existing rule and needs no new vocabulary.
 */
export const RITUAL_TWISTS = [
  { name: "Backlash", copies: 4,
    cost: "The working turns. The subject takes 2 damage, ignoring armor." },
  { name: "It Answers", copies: 4,
    cost: "Whatever did this knows the ritual is happening. The curser, the god, the rot "
      + "itself \u2014 and it has time to arrive before you finish." },
  { name: "Residue", copies: 3,
    cost: "Magic leaves marks. 1 Taint into the subject's deck, in the flavour that fits." },
  { name: "Deeper", copies: 3,
    cost: "The injury speaks for itself: it lands as a condition that fits, for the rest of the "
      + "ritual. A bad leg is Slowed, a shattered nerve is Stunned." },
  { name: "Spoiled", copies: 3,
    cost: "A component is consumed wrongly. No further check until it is replaced, and the GM "
      + "says what replacing it takes." },
  { name: "Not Alone", copies: 3,
    cost: "The working reaches somebody else present. One ally takes a Doubt, or the condition "
      + "the subject just took." },
  { name: "The Long Way", copies: 3, pressure: 1,
    cost: "The recipe was wrong about the order. Pressure +1, and the next check needs a "
      + "different approach than the one you have been using." },
  /*
   * One copy, and it is the only card in either twist deck that changes a character permanently
   * -- by *closing* a door rather than opening one, which is the only way to do that without
   * becoming a second gate for permanence.
   */
  { name: "It Sets", copies: 1,
    cost: "The injury becomes **bound**: no ritual lifts it until the GM's own condition is met, "
      + "the way an obligation's Taint is bound (core-rules \u00a78). The recipe is not spent." }
];

/**
 * **The faces of the cards nobody chose to put in a deck.**
 *
 * The brief used to say *"Wounds and Taint. Two faces, fixed... one picture each at most"* and
 * list them under what does not need art. That was written when there were two; there are seven,
 * and the argument did not survive the fifth. **These are the cards a player stares at.** A Wound
 * is dead weight in a hand of five, a Fear moves you, a Compulsion forbids the one thing that
 * refills your deck -- they are read more often than most of the content that was drawn, and a
 * negative card that is only a dark rectangle is the one card in the game with nothing to look at.
 *
 * It lives here rather than beside the `INTRUDERS` dial table because an art shelf is read from
 * content.mjs and the dials are in decks.mjs, which imports the art module -- so a shelf reaching
 * the other way would close a circle. The validator checks the two lists against each other in
 * **both** directions, which is the arrangement that makes a second list safe to have at all.
 *
 * Taint has two faces because core-rules 8 splits it by which deck it goes into, and the two are
 * genuinely different pictures: a disease and a horror.
 */
export const HARM_FACES = [
  { name: "Wound", kind: "wound" },
  { name: "Taint (body)", kind: "taint" },
  { name: "Taint (mind)", kind: "taint" },
  { name: "Fear", kind: "fear" },
  { name: "Doubt", kind: "doubt" },
  { name: "Rage", kind: "rage" },
  { name: "Compulsion", kind: "compulsion" },
  { name: "Confusion", kind: "confusion" }
];

/**
 * **The critical deck: what a critical hit actually does.**
 *
 * A Critical doubled, and that was the whole of it. Doubling is the right *common* answer and a
 * poor *only* answer, because it scales backwards against the thing a critical ought to beat:
 * against four points of armour a doubled Strike of 3 gets **2** through, and the card whose
 * entire purpose is *this one gets through* was being flattened by the rung it should punish.
 *
 * So a Critical now draws, and doubling is one face of seven. The other six are mechanisms this
 * game already has, which is the test a new deck has to pass -- a deck that needed new rules
 * would be a fourth name for something. *Stove In* and *Turn the Edge* are the newest pair and
 * they pass it too: Corrode was built for acid and had no other applier, and Blunt is Corrode one
 * printed number over:
 *
 * | Face | Is | Copies |
 * |---|---|---|
 * | *Through and Through* | the old behaviour, doubled | **4** |
 * | *Find the Gap* | **Exposed** -- armour counts 0, from after this hit | 2 |
 * | *Off the Feet* | **Off-Balance** -- Block counts 0, from after this hit | 2 |
 * | *Driven Down* | **Halted** -- the next turn does not happen | 1 |
 * | *Stove In* | **Corrode 1** -- their armour is a point worse, for good | 1 |
 * | *Turn the Edge* | **Blunt 1** -- their weapon strikes for a point less, for good | 1 |
 * | *Both* | draw two others and take both | 1 |
 *
 * **Four of twelve still double**, which is the number that matters: a Critical remains the card
 * you want, and eight times in twelve it buys something a doubled number could not. Exposed and Off
 * Balance are the two that answer armour and Block, and they are worth more than doubling exactly
 * where doubling is worth least -- against a defended target, which is what section 5 says a
 * Critical is for.
 *
 * **[2026-11-09] But not on the hit that drew them.** The rider lands after the damage now
 * (`drawCritEffect` returns it and `resolveAttack` applies it beside the ammunition's condition),
 * so a condition face is a **trade** rather than a discount: give up the double, and the next
 * attack on that target meets no armour or no Block. It is only worth taking because the same
 * change made `duration: 1` reach the attacker's own next turn -- under the old clock the face
 * handed its benefit to whoever moved next, which is not a trade anybody would make.
 *
 * The deck is worth **+0.4 to +4.3** points of win rate to a hero in Leather and **-0.1 to -0.9**
 * to one in Plate; it was +6.8 at the top of that range before the ordering changed. Which way the
 * tilt should run is still open and still one word (`doubles`) in the faces below.
 * [MEASURED 2026-11-09, 2500 fights a cell.]
 *
 * **Attacks only.** A Critical on a check or a heal still simply doubles: `apply` is untouched,
 * and this deck is about what a critical hit does to a body. A Lore check that drew *Off the Feet*
 * would be a deck reaching somewhere it has no business.
 *
 * **Both draws two OTHERS**, so it cannot find itself. One sentence rather than a recursion rule,
 * and it is the same decision the fate deck makes about a Wild: the strange face does not compound.
 */
export const CRIT_EFFECTS = [
  {
    name: "Through and Through", copies: 4, doubles: true,
    text: "Double the damage, as a Critical always did."
  },
  {
    name: "Find the Gap", copies: 2,
    effect: { condition: "exposed", duration: 1 },
    text: "Exposed: their armour counts 0 until the end of your next turn. "
      + "Not this hit, and not doubled."
  },
  {
    name: "Off the Feet", copies: 2,
    effect: { condition: "offBalance", duration: 1 },
    text: "Off Balance: their Block counts 0 until the end of your next turn, and it is an "
      + "opening. Not this hit, and not doubled."
  },
  {
    name: "Driven Down", copies: 1,
    effect: { condition: "halted", duration: 1 },
    text: "Halted: their next turn does not happen. Not doubled."
  },
  /*
   * **The two faces that do not wear off**, and they are the reason the deck grew rather than
   * being re-cut: every other face here is spent by the end of the round after it, and a critical
   * hit that leaves a mark on the gear is a different kind of memorable.
   *
   * They are one copy each, like *Driven Down*, because permanence is worth more than it measures.
   * Nothing here can take a number below 0 and nothing here destroys an item: a breastplate at
   * armour 0 is still a breastplate and still repairable, which is what keeps these from being a
   * way to delete 300 gold of plate with a lucky card (core-rules 8).
   */
  {
    name: "Stove In", copies: 1,
    effect: { verb: "corrode", param: 1 },
    text: "Their armour is 1 worse until it is repaired. Permanent, and not doubled."
  },
  {
    name: "Turn the Edge", copies: 1,
    effect: { verb: "blunt", param: 1 },
    text: "Their weapon strikes for 1 less until it is repaired. Permanent, and not doubled."
  },
  {
    name: "Both", copies: 1, draws: 2,
    text: "Draw two others and take both."
  }
];