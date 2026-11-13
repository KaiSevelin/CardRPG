/**
 * The cards every character can meet: the two starter decks, the common pool, the Way
 * cards, Wild Magic, the skill deck and the backs every deck is turned face down with.
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */
/**
 * Playtest content, as data.
 *
 * This is the starter set from rules/starter-cards.md: one Warrior action deck, the goblin NPC deck,
 * player gear, NPC gear and features. Plain data rather than compiled packs, so it can be edited
 * here and later compiled to LevelDB for distribution without rewriting anything.
 *
 * Numbers here are content, not code -- they have moved four times already and will move again.
 */

/* -------------------------------------------- */
/*  Fate deck                                   */
/* -------------------------------------------- */

/**
 * The fixed 20: 1 Miss, 1 -2, 4 -1, 8 +0, 4 +1, 1 +2, 1 Critical.
 * Miss and Critical both reshuffle, so between reshuffles the deck always holds one of each --
 * which is what makes the remaining count a live risk readout.
 */
/*
 * **Both pictures are arguments, not imports.**  [2026-11-13]
 *
 * `back` has always been one: the content layer must not reach into the art layer, and `art` is
 * here for the same reason and more sharply. `content -> decks/art -> art -> content` closes a
 * cycle around the entire catalogue, so the resolver is handed in by the caller that already
 * holds both -- the setup routine, and the pack builder beside it.
 *
 * A fate card is asked for by RUNG rather than by name because a glyph cannot be a filename: the
 * slug of `+1` is the empty string and so is the slug of the plus-or-minus zero, so three of the
 * eight would resolve to one file. The piece is called *Plus One* on the shelf; the card keeps
 * its glyph.
 */
export function fateCards(back = "", art = () => "") {
  const cards = [];
  const push = (key, name, system, n) => {
    const img = art(key);
    for (let i = 0; i < n; i++) {
      /* A fate card's back is the one a table sees most: the deck is face down by design, and
       * that is what makes a thin one a risk rather than a lookup (core-rules 6). */
      cards.push({
        name, type: "fate", face: 0, faces: [{ name, ...(img ? { img } : {}) }],
        ...(back ? { back: { img: back } } : {}),
        system
      });
    }
  };
  push("miss", "Miss", { special: "miss", value: 0 }, 1);
  push("minusTwo", "−2", { value: -2 }, 1);
  push("minusOne", "−1", { value: -1 }, 4);
  push("zero", "±0", { value: 0 }, 8);
  push("plusOne", "+1", { value: 1 }, 4);
  push("plusTwo", "+2", { value: 2 }, 1);
  push("critical", "Critical", { special: "crit", value: 0 }, 1);
  return cards;
}

/* -------------------------------------------- */
/*  Warrior action deck                         */
/* -------------------------------------------- */

/**
 * 16 cards. Four carry Ready (2x Draw Steel, Quick Hands, Weapon Swap); Weapon Swap shows Ready on
 * its primary, so you can swap and still Strike in the same turn.
 *
 * Weapon Swap's secondary is a Strike, which simulation found to be the strongest thing in the
 * deck. The decision stands that such cards are levelling rewards rather than starter cards, but
 * the starter deck keeps its one copy until levelling exists.
 */
export const WARRIOR_DECK = [
  {
    name: "Strike", copies: 3, reaction: "parry",
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    /*
     * **The swing that goes through, against the blow that goes round.**
     *
     * This and *Measure* in the common pool were the same card: `Strike +1 · / Move 1`, differing
     * only in a reaction line, which is not something a player reads when choosing. They are now
     * the two halves of the defence rule -- weight beats armour, placement beats a shield -- and
     * the pair is the clearest statement of that rule in the game.
     */
    name: "Heavy Swing", copies: 2,
    primary: [{ verb: "strike", mod: 1, ignores: 2 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Lunge", copies: 1,
    primary: [{ verb: "move", param: 2 }, { verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Shield Up", copies: 2, reaction: "block",
    primary: [{ verb: "defend", text: "Block applies to every attack until your next turn" }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Advance", copies: 2, reaction: "sidestep",
    primary: [{ verb: "move", param: 3 }],
    secondary: [{ verb: "move", param: 2 }]
  },
  {
    name: "Draw Steel", copies: 2,
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "ready" }]
  },
  {
    /*
     * The one card whose reaction answers a hit with something other than armour. Its trigger used
     * to be "any time on another's turn", which is not an event -- so it was the one reaction no
     * engine could fire and no prompt could open at. It answers a hit now, and it answers it by
     * trading the reduction away (core-rules 3).
     */
    name: "Quick Hands", copies: 1, reaction: "use",
    primary: [{ verb: "use" }],
    secondary: [{ verb: "ready" }]
  },
  {
    // The deck's one Spent card, and the example the rules are written around: a heal worth having
    // once, not a heal worth having every time the discard comes back round.
    name: "Second Wind", copies: 1,
    primary: [{ verb: "heal", param: 2 }],
    secondary: [{ verb: "use" }],
    costs: { primary: { spent: true } }
  },
  {
    name: "Taunt", copies: 1,
    // The game's oldest compulsion, and it used to be prose with no save at all. It is Compelled
    // now, which is the condition core-rules 7's resist table named before anything implemented it.
    primary: [{ condition: "compelled", duration: 1, resist: "presence", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Weapon Swap", copies: 1,
    primary: [{ verb: "ready" }],
    secondary: [{ verb: "strike" }]
  }
];


/* -------------------------------------------- */
/*  Shade action deck                           */
/* -------------------------------------------- */

/**
 * **The second chassis, and the first thing two Ways could be compared on.**
 *
 * Every figure this project has published about a Way was measured on the Warrior's sixteen,
 * because it was the only deck there was. That made one question unanswerable and nobody had said
 * so: a Way of Shade career played a sword and a shield, so *are Shade's cards worse, or only
 * worse matched to a lone melee?* way-cards 1.2 and 1.3 each end on the same sentence -- *the
 * difference between those two readings is a simulator that models a Way* -- and a simulator
 * cannot model a Way it has no deck for.
 *
 * **It is built to the Warrior deck's own budget, and that is the whole method.** Sixteen cards in
 * ten designs, nine Strike halves, eight reaction copies across four designs, four cards carrying
 * Ready, one Spent, no Strain, one heal, one condition, two Use halves and eight printed Move on
 * primaries -- each of those is the Warrior's number, pinned in the validator against both decks so
 * neither can drift from the other. What differs is **shape**: the blade is Light, the defence is a
 * printed Block rather than a shield, the reactions step instead of blocking, and two more points
 * of Move sit on secondaries, which way-cards 1.6 calls the cheapest space in the game.
 *
 * Holding the budget is what makes the comparison mean anything. Two decks of different size would
 * have measured size; these measure the shape, which is the thing a Way *is*.
 *
 * > **[MEASURED 2026-11-07] The deck is worth -3.4 points of win rate against the Warrior's on the
 * > published encounters, and the whole of it is one reaction.**
 * >
 * > Same gear, 3000 fights, seed 1: **-1.0** against three spears, **-2.8** against four, **-3.5**
 * > against five and **-6.4** against two spears and two bows. The gap widens with the pressure,
 * > which is the shape of a deck short of defence rather than short of damage.
 * >
 * > Three isolations say where it comes from, and the first two are the surprise:
 * >
 * > | Variant | Mean |
 * > |---|---|
 * > | Shade as written | 71.0 |
 * > | its defensive primary made a **persistent shield Defend**, as *Shield Up* is | **71.0** |
 * > | its defensive primary raised to **Block 4** | 69.2 |
 * > | one design's reaction changed from **Sidestep** to **Block** | **73.5** |
 * >
 * > **The defensive primary is not worth anything measurable and the reaction is worth the entire
 * > gap.** Handing *Shed the Blow* the persistent shield Defend off *Shield Up* -- the most valuable
 * > primary in the starter deck by the published figures -- moves nothing at all, and raising its
 * > printed Block makes the deck *worse*, because the AI then spends turns not striking. Printing
 * > **Block** on one Shade design instead of Sidestep recovers 2.5 of the 3.4.
 * >
 * > So Shade starts behind by one reaction, and **the reaction is the shield**: Block is *your
 * > shield's Defend value +1* (core-rules 3), and a Shade carries no shield. This sharpens a
 * > published figure rather than repeating it -- specializations.md measured *the shield* at
 * > **0.4 to 1.8** by taking its Defend value away and keeping the deck, and what that could not
 * > see is that the shield's worth is in the **reaction it unlocks**, not in the number printed on
 * > it. The deck is left at -3.4 rather than levelled with a Block it cannot carry, and the trade
 * > is stated in starter-cards.md rather than buried in a card.
 *
 * > **[MEASURED 2026-11-07] And it settles what a Way is worth: the deck is 4 points and the
 * > shopping list is 36.** A two-by-two of both decks against both kits (Longsword, Wooden Shield
 * > and Leather against Dagger and no shield) gives a **deck** main effect of **+4.0** to the
 * > Warrior, a **gear** main effect of **+35.8**, and an interaction of **-1.1** -- so the two
 * > factors barely talk to each other and one of them is nine times the other. The 4.0 is the same
 * > number the career table reports between the Ways at tier 2 (Strength 66.8, Shade 62.8), which
 * > means that gap was never about the careers: it is this deck, counted twice.
 *
 * **Two gaps are declared rather than quietly carried.** No piece of art is commissioned for these
 * ten designs, so the deck is deliberately **not on an art shelf** -- a shelved piece with no file
 * is a path Foundry resolves to nothing, and a brief is not the place for cards no session can be
 * dealt yet. And `setup.mjs` still deals the Warrior: choosing between the two chassis is character
 * creation, which core-rules 12 defers until after the first playtest on purpose. Both are pinned.
 */
export const SHADE_DECK = [
  {
    /*
     * The Warrior's *Strike*, and Parry stays on it. That is not a flavour choice: Parry is the
     * reaction a blade in the hand gives you, and the isolation above is what says moving a
     * reaction off a three-copy card is the most expensive edit available to this deck.
     */
    name: "Knife Work", copies: 3, reaction: "parry",
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    /*
     * Shade's dedicated +1, which way-cards 1.2 allows a starter deck exactly one of. *Heavy
     * Swing* buys its +1 with weight and spends it going through two points of armour; this one
     * buys the same +1 with placement and pays for it by **requiring a Light item**, so it is the
     * one card in the deck a Shade cannot play with somebody else's longsword.
     */
    name: "Open Vein", copies: 2,
    primary: [{ verb: "strike", mod: 1, requires: { tag: "light" } }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    // *Lunge*, and the one shape both Ways share: way-cards 1.2 lists Move-then-Strike as the
    // cheapest two-verb half to balance, and a knife closes the same way a sword does.
    name: "Slip In", copies: 1,
    primary: [{ verb: "move", param: 2 }, { verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    /*
     * The defensive primary, and the deck's answer to carrying no shield: a **printed Block 2**,
     * which is the soak a shield gives without the shield. It is one-shot where *Shield Up* is
     * persistent, and the measurement says that difference is worth nothing anybody can see --
     * what a Shade loses for having no shield is the Block *reaction*, not this half.
     */
    name: "Shed the Blow", copies: 2, reaction: "sidestep",
    primary: [{ verb: "block", param: 2 }],
    secondary: [{ verb: "move", param: 2 }]
  },
  {
    // *Advance*. The Move 3 primary is where the Way's claim on Position starts, and this is the
    // only card in either starter deck that is pure movement on both halves.
    name: "Quick Step", copies: 2, reaction: "sidestep",
    primary: [{ verb: "move", param: 3 }],
    secondary: [{ verb: "move", param: 2 }]
  },
  {
    name: "Draw the Knife", copies: 2,
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "ready" }]
  },
  {
    // *Quick Hands*, down to the reaction: the Use trigger answers the hit after this one, and a
    // thief with a belt is the character it was written for.
    name: "Light Fingers", copies: 1, reaction: "use",
    primary: [{ verb: "use" }],
    secondary: [{ verb: "ready" }]
  },
  {
    // The deck's one Spent card, at the floor way-cards 1.3 sets and not above it.
    name: "Bind the Wound", copies: 1,
    primary: [{ verb: "heal", param: 2 }],
    secondary: [{ verb: "use" }],
    costs: { primary: { spent: true } }
  },
  {
    /*
     * The deck's one condition, and it is **Dazed** where the Warrior's is Compelled. *Taunt*
     * pulls an enemy onto you, which is a card for somebody who wants to be hit; a Shade would
     * rather take the turn away. Same rung on way-cards 1.6's ladder, opposite intent -- and the
     * pool's *Mock* is this card grown up, which is the relationship *Strike* and *Heavy Swing*
     * have with half of Way of Strength.
     */
    name: "Jeer", copies: 1,
    primary: [{ condition: "dazed", duration: 1, resist: "presence", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    /*
     * *Weapon Swap*'s opposite number, carrying the same declared exception: Strike on a secondary
     * is a levelling reward rather than a starter card (way-cards 1.2), and each starter deck keeps
     * exactly **one** copy. Giving Shade none would have put the asymmetry inside the thing being
     * measured -- the budget is the method, so the exception is held in common.
     */
    name: "Off Hand", copies: 1,
    primary: [{ verb: "ready" }],
    secondary: [{ verb: "strike" }]
  }
];


/* -------------------------------------------- */
/*  Wild Magic                                  */
/* -------------------------------------------- */

/**
 * The Wild Magic deck (core-rules 6, from ideas.md). Drawn from when a **Wild** comes out of a fate
 * deck, which for a Shadow mage is every spell they have ever cast catching up with them.
 *
 * **Five good, four bad, three both: a slight edge to the good, and a real tail.** The edge is
 * deliberate and so is the tail, and the reason the edge does not make Shadow Magic free is
 * arithmetic the fate deck already settles: a Wild resolves at **plain value**, so adding Wilds
 * dilutes the Miss and the Critical equally and takes variance OUT of the fate deck. The price of
 * Shadow Magic was therefore never going to be found in an average -- it is that **you cannot
 * predict your own turns**, and that is what *Misfire* and *Backlash* are for.
 *
 * Nine of the twelve are **steps**, so the engine resolves them with the code that lands any card's
 * condition. The three that are not are the three it has no verb for, and they say so.
 */
export const WILD_MAGIC = [
  /* --- good: five of twelve */
  {
    name: "Echo", copies: 1, turn: "good",
    text: "The Cast resolves a second time, against the same target."
  },
  {
    name: "Blink", copies: 2, turn: "good",
    steps: [{ verb: "move", param: 3, text: "ignoring figures and difficult ground" }]
  },
  {
    name: "Veil", copies: 1, turn: "good",
    steps: [{ condition: "invisible", duration: 1 }]
  },
  {
    // Reaches into the deck that sent you here, which is the loop worth having: a surge can make
    // your fate swingy again, and the mirror of it four entries down can make it worse.
    name: "Second Sight", copies: 1, turn: "good",
    steps: [{ condition: "blessed" }]
  },

  /* --- bad: four of twelve */
  {
    name: "Backlash", copies: 2, turn: "bad",
    steps: [{ condition: "dazed", duration: 1 }]
  },
  {
    name: "Misfire", copies: 1, turn: "bad",
    text: "The Cast resolves against the nearest creature instead, ally or not."
  },
  {
    name: "Residue", copies: 1, turn: "bad",
    steps: [{ condition: "cursed" }]
  },

  /* --- both: three of twelve, and each is both at the same moment */
  {
    name: "Glare", copies: 1, turn: "both",
    text: "The Cast becomes a Blast 2 around its target, whoever is standing in it."
  },
  {
    // The shadow opens in both directions: unseen, and read.
    name: "Open Door", copies: 1, turn: "both",
    steps: [{ condition: "invisible", duration: 1 }, { condition: "marked", duration: 2 }]
  },
  {
    name: "The Long Step", copies: 1, turn: "both",
    steps: [
      { verb: "move", param: 3, text: "ignoring figures and difficult ground" },
      { condition: "prone", duration: 1 }
    ]
  }
];

/* -------------------------------------------- */
/*  Way cards                                   */
/* -------------------------------------------- */

/**
 * Way-card content, which is otherwise unwritten: way-cards 3 is 62 cards waiting on the Way graphs
 * and "nothing here is simulated".
 *
 * These two are here for one reason, and it is a rule rather than a preference: **they are the only
 * cards in that document whose reaction no existing key could express.** Every other reaction in
 * the pools is Parry, Block, Sidestep, Use or Brace -- twelve of fourteen -- so the five keys were
 * the right five, and these two are what was missing. Carrying them means neither new mechanic
 * ships against no content, which is the state ⚡ Bodyguard is still in (equipment.md 12).
 */
export const WAY_CARDS = [
  {
    // Way of Strength 3.2. The card that gives the four reach weapons something to do.
    name: "Set Spear", copies: 1, way: "strength", reaction: "counter",
    primary: [{ verb: "defend" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "an enemy ending its move adjacent takes your Strike"
  },
  {
    // Way of Shade 3.3, and the only card in the document that needs a number on its ⚡ row.
    name: "Roll With It", copies: 1, way: "shade", reaction: "sidestep", reactionParam: 2,
    primary: [{ verb: "move", param: 3 }],
    secondary: [{ verb: "move", param: 2 }],
    text: "Sidestep 2, and you may end next to a different enemy"
  }
];

/* -------------------------------------------- */
/*  The common pool                             */
/* -------------------------------------------- */

/**
 * Six deliberately dull cards (rules/way-cards.md 3.1). Any Way's minor nodes may grant these, and
 * two minor nodes in three draw from a pool rather than carrying content written for them
 * (rules/leveling.md 1) -- so these six are the backbone the Signatures are felt against.
 *
 * Off-Hand Blow is the one that answers an open question: core-rules 3 asks where Strike-on-a-
 * secondary cards come from, and the answer is here, at -1, as the first ordinary card any fighter
 * is handed. Dig In is the deck's second and last Spent card -- the ladder caps a 16-card deck at
 * two and the Warrior already carries Second Wind, so no branch may offer a third.
 */
export const COMMON_POOL = [
  {
    name: "Off-Hand Blow", copies: 1, pool: "common", needs: [],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "strike", mod: -1 }]
  },
  {
    /* The other half of the pair *Heavy Swing* opens: placement rather than weight, so it goes
     * round a raised shield and not through plate. See the note on Heavy Swing. */
    name: "Measure", copies: 1, pool: "common", needs: [], reaction: "parry",
    primary: [{ verb: "strike", mod: 1, ignoresBlock: true }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Hold the Line", copies: 1, pool: "common", needs: [], reaction: "parry",
    primary: [{ verb: "defend" }],
    secondary: [{ verb: "strike", mod: -1 }]
  },
  {
    name: "Press", copies: 1, pool: "common", needs: [], reaction: "sidestep",
    primary: [{ verb: "strike" }, { verb: "move", param: 1 }],
    secondary: [{ verb: "move", param: 2 }]
  },
  {
    name: "Both Hands", copies: 1, pool: "common", needs: [], reaction: "use",
    primary: [{ verb: "ready" }, { verb: "strike" }],
    secondary: [{ verb: "ready" }]
  },
  {
    /*
     * No printed reaction, although way-cards 3.1 prints Brace in its reaction column. Brace is
     * the FLOOR under a card that prints nothing (core-rules 3, resolve.mjs reactionsFor), so
     * printing it is not merely redundant -- it is the one spelling that could switch it off, since
     * the rule gives Brace to a card *without* a printed reaction. Dig In gets Brace by having
     * none.
     */
    name: "Dig In", copies: 1, pool: "common", needs: [],
    primary: [{ verb: "heal", param: 2 }],
    secondary: [{ verb: "move", param: 1 }],
    costs: { primary: { spent: true } }
  }
];

/**
 * The starter Warrior's skill deck (skill-rules 1).
 *
 * **Fifteen cards, all six approaches, nobody locked out.** That is the composition rule and it is
 * the reason a skill deck is a deck rather than a stat line: *anyone can try anything*, and the Way
 * decides which approaches come up often and high rather than which ones exist.
 *
 * Way of Strength means *lots of Might and Agility*, so the shape here is 4 Might and 3 Agility at
 * values 2 and 3, against one each of the four approaches a warrior is not: Shadow, Wits, Lore and
 * Presence at value 1. A specialist plays their best approach often and still draws hands without
 * it, which is where the helping rule earns its place.
 *
 * `edge` is what the card does whether or not the check succeeds, and it is **prose on purpose**:
 * *ask the GM one yes/no question about the scene* is not a computation and should not pretend to
 * be one. Four of the fifteen carry one, which is the document's *some cards also have a small
 * edge* read as a ratio rather than as a maybe.
 *
 * And one Inspiration: any approach, value 1, *draw 1 skill card*. The one card in the deck that is
 * never the wrong card, which is what makes it worth a slot that could have held a 3.
 */
export const WARRIOR_SKILLS = [
  { name: "Set Your Feet", approach: "might", value: 3, copies: 1 },
  { name: "Heave", approach: "might", value: 2, copies: 2 },
  {
    name: "Break It", approach: "might", value: 1, copies: 1,
    edge: "Something gives whether or not you get through: the GM says what broke."
  },
  { name: "Quick Hands", approach: "agility", value: 2, copies: 2 },
  {
    name: "Keep Your Footing", approach: "agility", value: 1, copies: 1,
    edge: "You do not fall, whatever else happens."
  },
  { name: "Out of the Light", approach: "shadow", value: 1, copies: 2 },
  {
    name: "Sharp Eyes", approach: "wits", value: 1, copies: 2,
    edge: "Ask the GM one yes-or-no question about the scene."
  },
  { name: "Soldier's Learning", approach: "lore", value: 1, copies: 2 },
  {
    name: "The Loud Voice", approach: "presence", value: 1, copies: 1,
    edge: "Everyone nearby hears you, and knows it was you."
  },
  {
    name: "Inspiration", approach: "", value: 1, copies: 1, wild: true,
    edge: "Draw 1 skill card."
  }
];

/* -------------------------------------------- */

/**
 * The deck backs.
 *
 * **A back is one picture per deck, not one per card**, and it does one job: it says which deck a
 * face-down card came from. That is why there are five of these and three hundred of everything
 * else -- and why they are worth drawing first in practice, since a back is on the table from the
 * first second of play and a face only when somebody holds it.
 *
 * **Wound and Taint have no back of their own, deliberately.** Both go *into* the action deck
 * (core-rules 8), and a Wound you could see coming would not be a Wound: they wear the action
 * back like everything else in there, which is the whole threat.
 *
 * NPC decks are keyed by **creature kind**, because `NpcCardData.kind` says the back shows that and
 * nothing else -- a goblin's intent deck should be recognisable across the table as a goblin's.
 * One kind today; a new creature brings a new back with it.
 */
export const DECK_BACKS = {
  action: {
    label: "The action deck",
    art: "",
    note: "Face down in front of every player, all game. Cards from the common pool and all four "
      + "Ways mix in one deck, so this is NOT a Way's back -- the deck is yours, not Shade's."
  },
  fate: {
    label: "The fate deck",
    art: "",
    note: "The back players see most: it is shuffled and face down by design, and that is what "
      + "makes a thin deck a risk rather than a lookup. Twenty cards, drawn from constantly."
  },
  /*
   * **The note is the art direction, and *the scene side's deck* is not a picture.**
   *
   * It said that, and the back came back with a dagger at its centre -- because a sentence about
   * which half of the rules a deck belongs to tells an artist nothing, and the gap gets filled
   * with whatever a fantasy card back usually has on it, which is a blade. A skill deck covered
   * in weapons is also the exact failure the rest of the note warns about: it has to read as NOT
   * the action deck, and a blade is the action deck's whole vocabulary.
   */
  /*
   * **The ritual twist deck's back, and the one the general twist deck should have been wearing.**
   *
   * Both are the GM's, and both are drawn when something goes partly wrong -- so this one has to
   * read as *not* the twist back while sitting beside it on the same side of the table. The twist
   * back is a fork: one line arriving and leaving as two, a complication branching. This one is
   * the opposite motion.
   */
  ritual: {
    label: "The ritual twist deck",
    art: "",
    note: "Drawn when a ritual goes wrong, and a ritual is days of work on something that does "
      + "not want to be undone. Where the twist back is a fork branching outward, this is a line "
      + "that has been drawn back on itself: a single stroke that leaves the bottom edge, rises, "
      + "and returns to the same edge a little to one side -- a loop that does not close, with "
      + "open paper inside it and around it. The subject is that it comes BACK. No knot, no "
      + "spiral, no star, no candle, no circle of runes and nothing that could be read as a "
      + "summoning diagram; the price of a ritual is never a monster arriving. One stroke, and "
      + "the gap where it fails to close is the whole of it."
  },
  skill: {
    label: "The skill deck",
    art: "",
    note: "What you do when you are NOT fighting: climbing, listening, lifting, picking a lock, "
      + "talking someone round. **No weapon of any kind on this one** -- no blade, no point, no "
      + "hilt, no arrowhead. A hand, a key, an eye, a knot, a lens: the tools of a scene. It has "
      + "to read as clearly NOT the action deck at a glance, since both are face down in front "
      + "of the same player."
  },
  /*
   * **The three slate decks, and the day the previous note was waiting for has arrived.**
   *
   * What stood here said there was no `item`, `feature` or `condition` back because nothing had a
   * face-down state to show, and that the day an unexpanded view wanted one, the entries should be
   * added here and `backOf` would already answer for them. That day is this one: the three piles
   * down the left of the tray are collapsed whenever they are not the open one -- `#leftDecks()`
   * has carried `open: this.openPile === d.id` all along -- and a collapsed pile is a face-down
   * deck by every test this file applies. It was drawing a hatched gradient because there was no
   * picture to draw.
   *
   * **The schema does not move**, exactly as that note promised. A slate is still an Item and
   * still never shuffled or dealt; what changed is that the pile it lives in now wears a picture
   * when it is shut, which is one `--cr-art` on a button.
   *
   * **The notes below are FORMS, not categories, and that is the lesson this table has already
   * paid for twice.** `skill` said *the scene side's deck* and came back with a dagger on it,
   * because a sentence about which half of the rules a deck belongs to tells an artist nothing and
   * the gap gets filled with whatever a fantasy card back usually has. `twist` named *a knot* and
   * *a thing turning* and lost two shots to the gate, because a knot fills its own space and
   * leaves no paper for a contour and a turning thing is rotationally rather than bilaterally
   * symmetrical. So each of these names one centred, bilaterally symmetrical object that leaves
   * paper around it, and says what it must not be.
   */
  item: {
    label: "The item deck",
    art: "",
    note: "Your gear, face down. **A strap through a plain square buckle, seen flat and from the "
      + "front**, the tongue centred and the strap running off both top and bottom edges. A "
      + "buckle is the one thing every carried object in this game has in common and it is "
      + "bilaterally symmetrical by construction. **No weapon, no blade, no pack, no pile of "
      + "loot** -- one fastening, drawn large, with bare paper either side of it."
  },
  feature: {
    label: "The feature deck",
    art: "",
    note: "What is permanently true about you. **A keystone at the top of a shallow arch**: the "
      + "wedge-shaped stone dead centre, two or three voussoirs falling away to left and right, "
      + "and nothing above it. A feature is always on and load-bearing, and a keystone is the "
      + "stone that holds the rest up while doing nothing at all. **Not a laurel, not a crest, "
      + "not a shield shape** -- masonry, with the joints drawn."
  },
  condition: {
    label: "The condition deck",
    art: "",
    note: "What has been put on you, and what will wear off. **A plain open iron band -- a collar "
      + "or a manacle -- hinged at the bottom centre and standing open**, the two halves rising "
      + "symmetrically and not quite meeting at the top. Open, because a condition ends. **No "
      + "chain, no lock, no key, no wrist and no neck in it** -- the band alone, and the gap at "
      + "the top is the subject."
  },
  /*
   * **The fourth pile, and it is a deck rather than a corner of the item deck.**
   *
   * A spell is a slate like an item and a feature -- `sheets.mjs` has `isItem`, `isFeature` and
   * `isSpell` -- which is why it reads as though it ought to live in the item pile. It does not:
   * `#leftDecks()` filters the item pile to `i.type === "item"`, and the spell pile appears beside
   * it only for an actor that has spells, so a non-caster never sees a fourth deck at all.
   *
   * The device is the one the deck's own comment argues for: unprepared spells are the book, and
   * the book is most of what a caster owns, while the count on the pile is what can be CAST. A
   * page block with markers in it says both halves of that in one object -- the bulk is the book
   * and the few ribbons are the prepared ones.
   */
  spell: {
    label: "The spell deck",
    art: "",
    note: "A caster's book, and the few pages of it ready today. **A closed book seen square from "
      + "the fore-edge, spine away, so the picture is the page block itself** -- the stacked edges "
      + "of the leaves drawn as fine horizontal lines, with three ribbon markers hanging from the "
      + "middle of the block, the centre one longest. Symmetrical about the middle ribbon. **No "
      + "cover decoration, no clasp, no strap, no buckle** (that is the item deck's device), and "
      + "**no star, no pentagram, no rune, no candle and no hand** -- paper, thread and nothing "
      + "else, with bare paper either side of the block."
  },

  /*
   * **The GM's deck, which was wearing the skill deck's back.**
   *
   * Thirty twists, face down in front of the GM all game, drawn when a check goes partly wrong --
   * a deck by every test this file applies, and the only one with no back of its own. It took
   * `backOf("skill")` instead, so across the table the GM's deck and a player's skill deck were
   * the same picture. The whole point of a back is to say which deck a face-down card came from.
   */
  twist: {
    label: "The twist deck",
    art: "",
    /*
     * **Two of the four forms this used to name fought the capsule, and both shots lost.**
     *
     * It said *a knot, a fork, a crack, a thing turning*, and got a double spiral in a wash that
     * filled every corner, twice: 0.9% then 1.2% bare paper against a floor of 5%, and symmetry
     * 0.83 then 0.80. Neither was bad luck. A KNOT is a form that fills its own space, so there
     * is no paper left for the contour to sit against; a THING TURNING is rotationally
     * symmetrical and not mirror-symmetrical, which is the half of symmetry that matters when
     * half the table is reading the card upside down. A CRACK is asymmetric by definition.
     *
     * Only the fork survives, and it is the best of the four anyway: it is what a Partial IS.
     */
    note: "The GM's deck, and the only one on their side of the table. Drawn when something goes "
      + "partly wrong, so the back is a promise of a complication rather than a threat: **a "
      + "fork** -- one line arriving and leaving as two, mirrored left to right, with open paper "
      + "around it. No knot, no spiral, no coil: nothing that fills its own space or turns rather "
      + "than mirrors. Not a weapon and not a monster -- the price of a Partial is never an attack."
  },
  wild: {
    label: "The Wild Magic deck",
    art: "",
    note: "Drawn only when a Wild comes out of a fate deck, so its back is a promise that "
      + "something strange is about to happen."
  },
  /*
   * **One intent back for every creature in the world, and no per-kind exceptions.**
   *
   * There was a goblin back here, on the argument that a goblin's intents should be recognisable
   * across the table as a goblin's. It is a good argument and it loses to arithmetic: forty-seven
   * kinds is forty-seven pieces of back art, drawn so that a player can identify a deck that is
   * sitting in front of the creature it belongs to.
   *
   * `buildCreature` still asks for `npc.${kind}` before falling back to this, so a kind that
   * earns its own back later costs one entry here and no code -- but nothing claims one today,
   * and `validate.mjs` pins that, so the fallback cannot quietly stop being the only path.
   */
  npc: {
    label: "Intent, any creature",
    art: "",
    note: "The back on every creature's intent deck in the game. A face-down intent says *this "
      + "thing is about to act*, and which thing it is is already on the table in front of you -- "
      + "so the back carries the threat rather than the species."
  }
};