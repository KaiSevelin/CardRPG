/**
 * Static configuration for Card RPG.
 *
 * Icon keys are the kebab-case game-icons.net filenames, so the filename doubles as the enum key
 * (see rules/icons.md). Nothing here is a tuning value -- numbers that playtesting might move live
 * in system settings or compendium data, never in code.
 */

export const CARDRPG = {};

/* -------------------------------------------- */
/*  Icons                                       */
/* -------------------------------------------- */

/** Card anatomy: the three halves. */
CARDRPG.halfIcons = {
  primary: "rank-3",
  secondary: "rank-2",
  reaction: "electric"
};

/** The six core verbs. A card half says what you do; the item says how well. */
CARDRPG.verbs = {
  strike: { label: "CARDRPG.Verb.Strike", icon: "sword-wound", needsItem: true },
  cast: { label: "CARDRPG.Verb.Cast", icon: "magic-swirl", needsItem: true },
  defend: { label: "CARDRPG.Verb.Defend", icon: "shield-reflect", needsItem: true },
  use: { label: "CARDRPG.Verb.Use", icon: "potion-ball", needsItem: true },
  move: { label: "CARDRPG.Verb.Move", icon: "boot-prints", needsItem: false },
  ready: { label: "CARDRPG.Verb.Ready", icon: "school-bag", needsItem: false }
};

/** Effects and targeting markers. Heal is an effect, not a verb. */
CARDRPG.effects = {
  heal: { label: "CARDRPG.Effect.Heal", icon: "healing" },
  /*
   * Block, given to somebody else.
   *
   * The same word as the `block` reaction below and deliberately so: they are one concept reached
   * from two directions -- a shield answering a hit, and a shield held over the man beside you. The
   * engine already has `use` as both a verb and a reaction for the same reason.
   *
   * Four pieces of content were waiting on it (way-cards: Shield Wall, Shoulder to Shoulder, No
   * Step Back, The Shield Line) and three of them are a whole Way's thesis: Infantry, Valtor and
   * Vax are all the same idea, which is that standing next to somebody should be worth something.
   */
  block: { label: "CARDRPG.Effect.Block", icon: "shield-reflect" },
  /*
   * **Conjure: something that was not on the field is on it now.**
   *
   * Six steps did this in prose -- *a corpse within 2 rises and fights for you until the fight
   * ends*, *a minor god becomes present and fights as an ally for the rest of the fight* -- and
   * `summon` is a capability a creature holds and an intent card reads, so the monster side asks
   * for it too. The configuration is on the step (`conjure`), because what separates the lesser
   * necromancy from the greater is entirely a matter of how many, how long and at what price.
   */
  conjure: { label: "CARDRPG.Effect.Conjure", icon: "puppet" },
  /*
   * **Shape: you are something else for a while.**
   *
   * A form names a creature and the creature supplies the numbers, which is the same split a card
   * and an item have had since the beginning. So a form is delivered as an ITEM -- the creature's
   * own natural weapon, equipped -- and that is not a trick to avoid writing a mechanism: a body
   * IS what you fight with, and `Claws` is already an item with a Strike on it.
   *
   * What a form does not touch: your deck, your Health and your conditions. The deck is the
   * character in this game, so a shape that replaced it would be a different character wearing
   * your name; and a bear that forgets it was poisoned is a way out of a condition that no card
   * should hand over for free.
   */
  shape: { label: "CARDRPG.Effect.Shape", icon: "squid-head" },
  /*
   * Foresee: look at one NPC type's intent card for this round (core-rules 6).
   *
   * core-rules says it "needs no icon of its own", meaning no new entry in the six-verb vocabulary
   * -- and it does not get one. It sits here beside Heal, Range and Blast, which are effects rather
   * than verbs and all carry an icon, because a card half has to print SOMETHING. Its worth changes
   * every round by design: a lot when the enemy acts late, nothing when it acts first and reveals
   * the card for free.
   */
  foresee: { label: "CARDRPG.Effect.Foresee", icon: "all-seeing-eye" },
  /*
   * Forestall: discard one NPC type's intent card for this round; it draws a new one, face down
   * (core-rules 3). Foresee's twin, and it carries an icon for the same reason Foresee does -- a
   * card half has to print something. It is a REROLL and not a cancellation: a type that loses its
   * turn outright is worth more than any card should buy, so the turn survives and only the plan
   * dies. Worth more against a swarm than against a boss, because an intent card is drawn per
   * type -- the one enemy-facing effect in the game that does not reward sniping the elite.
   */
  forestall: { label: "CARDRPG.Effect.Forestall", icon: "card-random" },
  /*
   * Sift N: look at the top N of your own draw pile and you may discard what you saw (core-rules
   * 8). Deliberately NOT `foresee` with a different deck, and deliberately not Read: an action deck
   * is drawn as a batch at a known moment, so reordering its top is choosing your next hand, which
   * is a tutor and is banned. See and reject, never see and arrange.
   */
  sift: { label: "CARDRPG.Effect.Sift", icon: "card-pick" },
  range: { label: "CARDRPG.Effect.Range", icon: "bullseye" },
  blast: { label: "CARDRPG.Effect.Blast", icon: "mushroom-cloud" },
  aimed: { label: "CARDRPG.Effect.Aimed", icon: "laser-sparks" },
  advantage: { label: "CARDRPG.Effect.Advantage", icon: "thumb-up" },
  disadvantage: { label: "CARDRPG.Effect.Disadvantage", icon: "thumb-down" },
  charging: { label: "CARDRPG.Effect.Charging", icon: "charging" },
  /*
   * Shake Off N: take N off the duration of one condition, which ends at 0 (core-rules 7). It pays
   * in the number the condition already has rather than removing it outright, so a (1) is shrugged
   * away and a (3) takes real effort -- and no card is ever a hard counter to a big condition.
   */
  shake: { label: "CARDRPG.Effect.Shake", icon: "breaking-chain" },
  /*
   * Tainting N: N Taint cards into a deck you play from (core-rules 8). Disease, corruption and
   * cursed places -- NOT poison, which is the `poisoned` condition below. The line between them is
   * whether it outlives the fight: a venom does not, a plague does.
   */
  tainting: { label: "CARDRPG.Effect.Tainting", icon: "virus" },
  /*
   * Corrode N: N off the target's armor, until it is repaired. This is how ACID works, and it is
   * the only thing in the game that spends GEAR -- a resource leveling 5a.1 names ("gear you can
   * lose") and nothing implemented.
   */
  corrode: { label: "CARDRPG.Effect.Corrode", icon: "melting-metal" },
  /*
   * Lift: remove a condition that has no duration to spend, which is the other half of Shake Off.
   *
   *   Shake Off spends a duration. Lift removes what has no duration to spend.
   *
   * Only the `liftable` ones -- the two that live in a deck rather than on the character. The
   * openings are excluded on purpose, the derived pair answer to arithmetic, and Unconscious answers
   * to Health. When Cleansing is built, Taint is the third thing this should reach.
   */
  lift: { label: "CARDRPG.Effect.Lift", icon: "magic-palm" },
  /*
   * **Maiming: draw two for the injury and take the worse.**
   *
   * It does not inflict an injury, and that is the whole design. Permanence passes through one
   * moment in the game -- the fate draw when you fall Unconscious (core-rules 8) -- and a thing
   * that reads *permanently blind the target* would put the most consequential rule in the game
   * in as many places as there are cards. This project has paid for that shape twice: the Wound
   * threshold was a constant read in two places, and `wound || taint` was written out three
   * times before the intruder table closed it. One gate, many modifiers.
   *
   * `param` 2 is the normal dose and the disadvantage shape the game already uses everywhere:
   * draw that many, keep the worst. A Healer's Kit in reach is the same dial pointed the other
   * way, and the two cancel without a rule saying they do.
   *
   * It is rare on purpose. Nothing in a pool carries it -- a named threat does, and a trap does,
   * and the price of a drop that forces the draw without the drop is that it belongs to a
   * creature with a name.
   */
  maiming: { label: "CARDRPG.Effect.Maiming", icon: "knee-bandage" }
};

/**
 * What a half costs to play, as icons (core-rules 8).
 *
 * Deliberately NOT in `verbs` or `effects`, which is where the Blocked-icons test looks. A cost is
 * not something the half does, and a condition that switched off every card showing Strain would be
 * a rule nobody wrote. Keeping the two maps apart means such a condition has to be opted into --
 * the icons exist, and a future "Winded" can name them, but nothing blocks them by accident.
 *
 * `strain` takes a BARE number, so it reads as a parameter like Move 3 or Range 4, not as a
 * modifier (card-layout 1.3). `spent` takes none: a card is spent or it is not.
 */
CARDRPG.costIcons = {
  spent: { label: "CARDRPG.Cost.Spent", icon: "card-burn" },
  strain: { label: "CARDRPG.Cost.Strain", icon: "card-discard" }
};

/**
 * The piles that show as a line of icons in the character panel rather than as a deck on the table.
 *
 * A deck back is a big object that says "draw me". These three are not drawn from: Fate is drawn by
 * the rules, not by you, and the two discards are records. Keyed by pile id, which is what the
 * link's `data-pile` carries.
 *
 * Discard shares the Strain icon on purpose -- both mean the discard pile, and that is the point.
 */
CARDRPG.pileIcons = {
  fateDiscard: "card-random",
  actionDiscard: "card-discard",
  actionSpent: "card-burn"
};

/**
 * The difficulty a saving throw is compared against (skill-rules 2). Shared with skill checks, so a
 * condition printed "resist Might 5" is asking for the same 5 a Normal skill check asks for.
 */
CARDRPG.difficulties = { easy: 3, normal: 5, hard: 7, heroic: 9 };

/** Skill-card approaches. Out of scope for the combat playtest, kept for completeness. */
CARDRPG.approaches = {
  might: { label: "CARDRPG.Approach.Might", icon: "mighty-force" },
  agility: { label: "CARDRPG.Approach.Agility", icon: "run" },
  shadow: { label: "CARDRPG.Approach.Shadow", icon: "spy" },
  wits: { label: "CARDRPG.Approach.Wits", icon: "all-seeing-eye" },
  lore: { label: "CARDRPG.Approach.Lore", icon: "book-cover" },
  presence: { label: "CARDRPG.Approach.Presence", icon: "embrassed-energy" },
  any: { label: "CARDRPG.Approach.Any", icon: "misdirection" }
};

/* -------------------------------------------- */
/*  Conditions                                  */
/* -------------------------------------------- */

/**
 * Conditions carry a duration, a creator AND the round they landed in: the duration ticks at the
 * **end** of the creator's turn, or the victim's if the creator has left combat, and never on the
 * turn it was applied (core-rules 7). Foundry's token status overlays
 * can't express that, so the tray owns conditions and these are our own records.
 *
 * `blocks` lists the icon keys a condition switches off (core-rules 10, Blocked icons).
 * `derived` marks the two that are computed from carried weight rather than applied by anyone.
 *
 * `opening` marks the four that do **nothing at all** by themselves (core-rules 7). They exist to
 * be read by other cards, and -- this is the whole reason the set stays small -- an opening carries
 * no rules of its own, so adding a card that reads one costs no table entry anywhere. Every combo
 * in the game is a `when` clause on some card half (see stepField in data/cards.mjs).
 *
 * `valued` marks the two that carry an INTENSITY as well as a duration -- Burning 3 (2) is three
 * damage a turn for two turns. It is opt-in for a reason: a second number on every token is a cost
 * every condition pays, and only fire and ice have a reading between "a candle" and "a dragon".
 * Everything else on the list is binary, and Dazed 3 would mean nothing.
 *
 * `cancels` names conditions this one annihilates with: neither lands on a target already
 * carrying the other, and whichever arrives second ends the first WITHOUT itself landing. It is
 * symmetric data on purpose -- both halves of the pair carry it, so nothing has to search backwards
 * -- and it exists for one pair, Wet against Burning, which every table would rule this way
 * whatever the book said. The rules sentence lives on **Burning**, not on Wet, which keeps the
 * promise that an opening carries no rules of its own (core-rules 7).
 */
CARDRPG.conditions = {
  dazed: { label: "CARDRPG.Condition.Dazed", icon: "surprised", blocksSecondary: true },
  slowed: { label: "CARDRPG.Condition.Slowed", icon: "tortoise", halvesMove: true },
  stunned: { label: "CARDRPG.Condition.Stunned", icon: "brain-freeze", blocksReactions: true },
  /*
   * **Halted: the whole turn does not happen.**
   *
   * Dazed costs you a half and Stunned your reactions; this costs the turn. Two cards asked for it
   * in prose -- *an adjacent enemy's action does not happen*, *an adjacent enemy's whole turn does
   * not happen* -- and there was no condition between "one half" and "unconscious" to carry it.
   *
   * It takes `blocksSecondary` as well, which is not belt and braces: a turn that does not happen
   * has no halves in it, and a reader that only knew about `blocksTurn` would grey out the wrong
   * thing. Same reason Unconscious carries `blocksReactions`.
   */
  halted: {
    label: "CARDRPG.Condition.Halted",
    icon: "hourglass",
    blocksTurn: true,
    blocksSecondary: true,
    blocksReactions: true
  },
  /*
   * `grantsAdvantage` rather than a key the resolver looks for by name. advantageFor used to test
   * `includes("invisible")` directly, which is the hardcoded-by-key pattern the condition flags
   * exist to replace -- and it is what left `heckled` below with nowhere to say what it does.
   */
  invisible: {
    label: "CARDRPG.Condition.Invisible", icon: "invisible", grantsAdvantage: true
  },
  /*
   * Heckled: you draw fate with disadvantage.
   *
   * The Bard's Signature, and the first condition that touches the fate deck rather than the body
   * or the board. Nobody else applies it -- Signature shape 5, *a condition in your hands only*.
   *
   * It is NOT an opening: an opening is a setup worth nothing on its own that a combo pays off, and
   * this one is already worth something by itself. Adding it to that list would sharpen every combo
   * clause in the game, which is not what the Bard is for.
   */
  heckled: {
    label: "CARDRPG.Condition.Heckled", icon: "thumb-down", drawsWithDisadvantage: true
  },
  // Fire annihilates with water in both its states: a wet target steams, a frozen one thaws.
  burning: {
    label: "CARDRPG.Condition.Burning",
    icon: "fire-silhouette",
    valued: true,
    damagePerTurn: true,
    cancels: ["wet", "frozen"]
  },
  /*
   * Poisoned N: Dazed, and N damage at the start of your turn.
   *
   * It is **Burning plus Dazed**, and that is deliberate -- the Dazed rides along at every value,
   * which is what makes a poison not a fire with a different icon, and it is why the scale starts at
   * **0**. Poisoned 0 is the nausea alone: no damage, still sick. Burning has no such rung.
   *
   * The Dazed is `blocksSecondary`, the flag Dazed itself uses, so it costs no code at all.
   *
   * No `cancels`: water puts out a fire and does nothing for a poison. That one absence is the other
   * half of what separates them.
   */
  poisoned: {
    label: "CARDRPG.Condition.Poisoned",
    icon: "vomiting",
    valued: true,
    damagePerTurn: true,
    blocksSecondary: true
  },
  /*
   * Frozen is cold's answer to Burning and the mirror of it in shape as well as fiction: Burning
   * spends its value on Health, Frozen spends it on Move. It REDUCES rather than halves, which is
   * what makes it worth having beside Slowed, and at value >= your Move you are stuck -- but you
   * still play both halves and keep your reactions, so core-rules 7's ban on taking a turn away
   * holds. That is also what separates it from Grappled, which blocks the Move half outright.
   */
  /**
 * **Exposed N: armour counts N less while it lasts.**
 *
 * The alternative to a card that ignores armour, and a better one for a reason the measurements
 * made plain. A piercing **card** is a flag on one step: it fires or it does not, it is invisible
 * until the damage is totalled, and sizing it is hopeless on the NPC side -- an intent is drawn
 * once per *type*, so `ignoresArmour` on a swarm's card is five attackers at full damage in the
 * same round and `ignores: 2` is almost nothing. There is no number between them.
 *
 * A **condition** has every property the flag lacks -- and since it zeroes the defence, it is only
 * fair to say that it *does* override rather than compose, which an earlier version of this comment
 * claimed as a virtue. Three of the four reasons survive that honestly, and they were always the
 * load-bearing three.
 *
 * It is **visible** -- it shows on the token and the sheet, and the armour figure a player reads
 * goes to 0, which is the difference between a rule and a surprise. It is **setup and payoff**, so
 * the big hit costs two actions and the second one can be somebody else's; a flag on a step was
 * one action by one creature. And it can be **Shaken Off**, which means it is answerable, where a
 * flag never was.
 *
 * The fourth reason is replaced by a better one: it is **proportional**. See below.
 *
 * **Exposed takes armour to 0**, not down by a number. Not `valued`: there is no depth to write,
 * only a duration, which is the one dial that matters -- a turn of no armour at all.
 *
 * Zeroing rather than reducing is what makes it *proportional*, and proportion was always the
 * whole argument for a condition here. It costs the character in Plate 4 points and the one in
 * Leather 1, so it is worth exactly as much as what the target was relying on. A flat -2 was
 * worth most to whoever had least to lose, which is backwards.
 *
 * It is also the only shape under which Exposed ever beats doubling a Critical. Doubling adds the
 * printed damage; Exposed adds the armour. So Exposed wins when `armour > printed damage`, and
 * against a goblin spear printing 3 that means rung 4 and nowhere else -- which is precisely the
 * rung this condition was written for.
 *
 * **Not an opening**, deliberately. Openings are the four a combo clause may key off and the
 * Thief's Signature hits *whatever you set up*; a fifth would widen that card silently and the
 * count of four is pinned in three places. This is a number, not a tell.
 */
  exposed: {
    label: "CARDRPG.Condition.Exposed", icon: "drop-weapon", zeroesArmour: true
  },
  frozen: {
    label: "CARDRPG.Condition.Frozen",
    icon: "frozen-body",
    valued: true,
    reducesMove: true,
    cancels: ["burning"]
  },
  prone: { label: "CARDRPG.Condition.Prone", icon: "falling" },
  /*
   * noDuration because Unconscious is not timed -- it means 0 Health and lasts until treated
   * (core-rules 8). Without the flag, combat.mjs cleared it when the fight ended and a downed
   * character stood up for free. It is also what keeps Shake Off away from it.
   */
  unconscious: {
    label: "CARDRPG.Condition.Unconscious",
    icon: "knockout",
    blocksReactions: true,
    noDuration: true
  },
  grappled: { label: "CARDRPG.Condition.Grappled", icon: "luchador", blocks: ["boot-prints"] },
  silenced: { label: "CARDRPG.Condition.Silenced", icon: "silenced", blocks: ["magic-swirl"] },
  disarmed: { label: "CARDRPG.Condition.Disarmed", icon: "drop-weapon", blocks: ["school-bag"] },
  /*
   * Compelled takes away WHO you attack, not whether you attack, which is the only shape a
   * compulsion may have while core-rules 7 forbids taking a turn away. It needs no target field:
   * the one you must attack is the creator, and `creatorId` already holds that. Fagar's miracle,
   * which points an enemy at its own ally instead, stays prose for exactly that reason.
   *
   * Not machine-enforced -- targets are chosen by whoever is playing the figure, so this is a
   * reminder on the tray, the same way Taunt has always been.
   */
  compelled: { label: "CARDRPG.Condition.Compelled", icon: "puppet" },
  /*
   * These two are markers for something that happens in the FATE deck: applying one shuffles a
   * temporary card in, and the rules remove it when it is drawn (core-rules 6). `temporaryFate`
   * names which card, so the mechanism is data rather than two special cases in the resolver.
   *
   * The plumbing for the card itself was built long ago -- `temporary` on the face, and drawFate
   * deleting it when drawn -- and nothing ever created one, so Blessed and Cursed were markers with
   * no effect behind them until now.
   */
  /*
   * **Graven: a tattoo, and the bonus it carries.**
   *
   * The Graven line used to be a `bonus` on the spell slate, which made it standing, invisible and
   * unremovable -- nothing on the token said it and nothing could end it. As a condition it shows,
   * and the bonus rides on the condition instance rather than on this config, because each tattoo
   * grants a different one: +2 Strike with Heavy items is not +2 Strike.
   *
   * `noDuration` because a tattoo is permanent, which is the same flag Blessed uses for a thing
   * that lasts until something takes it away. Not `liftable`: it is carved in.
   */
  graven: {
    label: "CARDRPG.Condition.Graven",
    icon: "aura",
    noDuration: true,
    /*
     * **Nothing takes it off**, and it has to say so rather than be recognised by having no flags.
     * The suite sorts every condition into one of the ways it can end -- Health, weight, the clock,
     * a Lift, a Shake -- and a condition in none of them is one whose removal nobody decided. This
     * one's removal IS decided: never. A tattoo is ink in your skin.
     */
    permanent: true
  },
  blessed: {
    label: "CARDRPG.Condition.Blessed",
    icon: "aura",
    noDuration: true,
    liftable: true,
    temporaryFate: "crit"
  },
  cursed: {
    label: "CARDRPG.Condition.Cursed",
    icon: "imprisoned",
    noDuration: true,
    liftable: true,
    temporaryFate: "miss"
  },
  burdened: {
    label: "CARDRPG.Condition.Burdened",
    icon: "weight-crush",
    noDuration: true,
    derived: true,
    halvesMove: true
  },
  overloaded: {
    label: "CARDRPG.Condition.Overloaded",
    icon: "weight",
    noDuration: true,
    derived: true,
    halvesMove: true
  },

  // --- Openings. One per Way, and each does nothing until a card reads it.
  wet: { label: "CARDRPG.Condition.Wet", icon: "droplets", opening: true, cancels: ["burning"] },
  /*
   * **Off Balance now takes a point of Block as well as being an opening.**
   *
   * It was `{ opening: true }` and nothing else -- a pure tell, which three cards apply and four
   * key off. That is a legitimate shape for an opening, and it is also a condition whose own name
   * says a defence should be worse: somebody off balance is not getting their shield across.
   *
   * It is the Block half of what Exposed is for armour: **Block counts 0** for the duration, not
   * one less. Not `valued` for the same reason Exposed is not -- there is no depth to write, and
   * the shield is either across you or it is not.
   *
   * **This one is set far more cheaply than Exposed, and that is the thing to watch.** Exposed has
   * two appliers in the whole game and both are a Critical or a brute's intent. Off-Balance has a
   * dozen, several of them free and unsaveable -- a Flask of Oil is 10 g, a Blunt Head arrow 20 g,
   * a Loose Cobble sits on the floor. At one point off Block that was a fair trade for a
   * consumable; at *all* of it, a 10 g flask switches off a Tower Shield. The measurement in
   * core-rules 7 is the one to read before pricing any new applier.
   */
  offBalance: {
    label: "CARDRPG.Condition.OffBalance", icon: "foot-trip", opening: true, zeroesBlock: true
  },
  marked: { label: "CARDRPG.Condition.Marked", icon: "crosshair", opening: true },
  judged: { label: "CARDRPG.Condition.Judged", icon: "scales", opening: true }
};

/**
 * Can this condition be shaken off (core-rules 7)?
 *
 * Derived from the flags already there rather than a flag of its own, so it cannot drift: you may
 * shake off what is being DONE to you, never what is simply TRUE of you. An `opening` is a state
 * and does nothing to shrug off; a `noDuration` condition has no number to take from -- Blessed and
 * Cursed are in a deck, Burdened and Overloaded are on your back, Unconscious is your Health.
 */
CARDRPG.shakeable = key => {
  const cfg = CARDRPG.conditions[key];
  return !!cfg && !cfg.opening && !cfg.noDuration;
};

/**
 * Can this condition be **lifted** (core-rules 7)? The complement of `shakeable`: it has no duration
 * to spend, and something can still take it away.
 *
 * Between them the two predicates and three stated exceptions cover every condition exactly once --
 * shakeable, liftable, `derived` (drop weight), `opening` (the clock, by design) and Unconscious
 * (Health). The validator checks that partition is still exhaustive.
 */
CARDRPG.liftable = key => !!CARDRPG.conditions[key]?.liftable;

/** The openings, as a list, for the places that need to offer or test only those. */
CARDRPG.openings = Object.entries(CARDRPG.conditions)
  .filter(([, cfg]) => cfg.opening)
  .map(([key]) => key);

/* -------------------------------------------- */
/*  Fate                                        */
/* -------------------------------------------- */

/** The fixed 20-card fate deck. Miss and Critical both trigger a reshuffle. */
CARDRPG.fateDeck = [
  { special: "miss", count: 1, icon: "blindfold" },
  { value: -2, count: 1 },
  { value: -1, count: 4 },
  { value: 0, count: 8 },
  { value: 1, count: 4 },
  { value: 2, count: 1 },
  { special: "crit", count: 1, icon: "punch-blast" }
];

/** Better/worse order, for advantage and disadvantage. */
/**
 * The fate deck's special cards: what each is worth when advantage compares two, and whether
 * drawing it reshuffles the deck.
 *
 * This was `fateRank`, a bare map of two numbers, and the "is it special" test was written out
 * three separate times -- in decks.mjs, combat.mjs and the card's own data model. Wild is the card
 * that would have broken all three differently, because it is the first special that does **not**
 * reshuffle: Miss and Critical are swings and clear the deck, a Wild is a permanent passenger.
 *
 * `swing` is what the 2/k readout counts (hud-spec 4.2). Exactly one Miss and one Critical sit in
 * the deck between reshuffles, which is the whole basis of that number -- so a card that is special
 * without being a swing has to be marked, not inferred.
 */
CARDRPG.fateSpecials = {
  miss: { label: "CARDRPG.Fate.Miss", rank: -99, reshuffles: true, swing: true },
  crit: { label: "CARDRPG.Fate.Critical", rank: 99, reshuffles: true, swing: true },
  /*
   * Wild (ideas.md, *Wild magic and miscasts*). Promised in five documents -- Shadow Magic's whole
   * price is "a permanent Wild card per formula" (specializations.md) -- and absent from the deck
   * until now, so the school could not be priced at all.
   *
   * **The action resolves at its plain value**: "the spell still happens". That makes a Wild a
   * flattening card rather than a bad one -- no swing in either direction, and no Miss -- and the
   * cost is that it is permanent, it dilutes the deck, and it is the one draw that hands the table
   * a question instead of a number.
   */
  wild: { label: "CARDRPG.Fate.Wild", rank: 0, reshuffles: false, swing: false }
};

/** What a special fate card is worth against another, or the card's own value when it is plain. */
CARDRPG.fateValueOf = card =>
  (card?.system?.special
    ? CARDRPG.fateSpecials[card.system.special]?.rank ?? 0
    : card?.system?.value ?? 0);

/* -------------------------------------------- */
/*  Slates                                      */
/* -------------------------------------------- */

/**
 * Equipment slots, in two kinds.
 *
 * HOT slots change during a fight, and Ready is what pays for the change: hands, belt, and the back
 * you can reach over your shoulder. Their capacity is a decision you make under pressure.
 *
 * WORN slots change between fights and never during one, so there is nothing for Ready to price.
 * Their count is a loot budget instead -- somewhere for treasure to land. A slot says WHERE a thing
 * sits, which is why chain mail and a cloak coexist; what it DOES, and whether two of them stack,
 * is the bonus group (section 5). The two axes are deliberately independent.
 *
 * The pack is unbounded by slots and bounded by weight instead.
 */
CARDRPG.slots = {
  hands: { label: "CARDRPG.Slot.Hands", icon: "hand", capacity: 2, worn: false },
  /*
   * Over the shoulder. `stows` means the slot CARRIES rather than USES: a slung blade is on you,
   * but it is not in your hand, so it strikes with nothing and grants nothing.
   *
   * Slinging costs a Ready; drawing from it is free. That is the whole point of the slot -- it is
   * a swap you pay for before the fight and spend during it. Everything else in your pack costs a
   * Ready at the moment you want it, which is the moment you can least afford one.
   */
  back: { label: "CARDRPG.Slot.Back", icon: "scabbard", capacity: 1, worn: false, stows: true },
  // Free: a belt is within reach of the hand already holding something. Everything on it is the
  // kind of thing you grab without thinking -- that is what a belt is for, and charging a Ready
  // for it made the potion you brought a potion you never drank.
  belt: { label: "CARDRPG.Slot.Belt", icon: "belt", capacity: 2, worn: false, freeEquip: true },

  body: { label: "CARDRPG.Slot.Body", icon: "person", capacity: 1, worn: true },
  cloak: { label: "CARDRPG.Slot.Cloak", icon: "cloak", capacity: 1, worn: true },
  head: { label: "CARDRPG.Slot.Head", icon: "light-helm", capacity: 1, worn: true },
  neck: { label: "CARDRPG.Slot.Neck", icon: "gem-pendant", capacity: 1, worn: true },
  fingers: { label: "CARDRPG.Slot.Fingers", icon: "diamond-ring", capacity: 2, worn: true },
  feet: { label: "CARDRPG.Slot.Feet", icon: "fur-boot", capacity: 1, worn: true },

  pack: { label: "CARDRPG.Slot.Pack", icon: "knapsack", capacity: null, worn: false }
};


/**
 * Item tags. Heavy and Light are mechanical -- Strong reads them -- and are NOT weight.
 *
 * **`natural` was declared by fourteen items and was not in here**, so the schema refused it on
 * every one of them: every natural weapon, and the four pieces of gear a monster owns rather than
 * carries. Foundry drops an invalid choice rather than failing the document, so offline the tag read
 * back from the content tables exactly as written while in the game it was simply gone -- and the
 * suite's own check *required* it, which is a check enforcing a value the schema rejects.
 *
 * **[GAP] Nothing reads `natural`.** `npcGear` is what keeps monster kit out of the player pickers,
 * and `hands: 0` is what makes a weapon part of a body. The tag means *a monster's own, not loot*,
 * which is true of all fourteen, and it is in the vocabulary now because fourteen entries and one
 * check say it should be -- but until something asks for it, it is a field nothing reads.
 */
CARDRPG.itemTags = [
  "heavy", "light", "melee", "ranged", "thrown", "arcane", "shield", "armor", "consumable",
  "natural"
];

/*
 * Which ammunition a ranged weapon takes (core-rules 4, "an arrow is not a ball").
 *
 * Three classes and no more, because the rule they serve is a rule about SUITABILITY and nothing
 * else: a piece either fits the weapon in your hands or it does not. They are deliberately NOT
 * item tags -- `heavy` already does two unrelated jobs in that list, marking weight class and
 * gating Strong's bonus, and a fourth meaning for the same flat enum is how that happened.
 *
 * A weapon names the one class it takes; a piece of ammunition names every class it suits.
 */
CARDRPG.ammoKinds = {
  bow: { label: "CARDRPG.Ammo.Bow" },
  crossbow: { label: "CARDRPG.Ammo.Crossbow" },
  firearm: { label: "CARDRPG.Ammo.Firearm" }
};

/*
 * The four pieces of ammunition that are not a step.
 *
 * Nine of the thirteen are a condition, which is a `shot` step and needs nothing here. These four
 * each do something no step shape can say, so each gets one named behaviour the resolver switches
 * on -- an enum rather than four booleans, because no piece has two of them and an enum keeps the
 * switch exhaustive.
 */
CARDRPG.shotEffects = {
  // Cancels the disadvantage a target in cover gives (core-rules 11).
  ignoresCover: { label: "CARDRPG.Shot.IgnoresCover" },
  // Pulls the SHOOTER to the target, the only thing in the catalogue that moves the person firing.
  pullsShooter: { label: "CARDRPG.Shot.PullsShooter" },
  // Permits a target that Invisible would otherwise protect. Inert until conditions.md 10 is
  // settled -- while Invisible hands out advantage instead of stopping a target, there is nothing
  // for this to permit, and the validator holds the field to that.
  seesInvisible: { label: "CARDRPG.Shot.SeesInvisible" },
  // Delivers another slate's Use line at range: whatever you hit drinks it.
  carriesPotion: { label: "CARDRPG.Shot.CarriesPotion" }
};

/**
 * Bonus groups. One action or check may take at most one bonus from each (core-rules 5).
 * Only bonus contributions are grouped; whatever supplies a base value is exempt.
 */
CARDRPG.bonusGroups = {
  body: { label: "CARDRPG.Group.Body", number: 1 },
  training: { label: "CARDRPG.Group.Training", number: 2 },
  tool: { label: "CARDRPG.Group.Tool", number: 3 },
  make: { label: "CARDRPG.Group.Make", number: 4 },
  power: { label: "CARDRPG.Group.Power", number: 5 },
  station: { label: "CARDRPG.Group.Station", number: 6 },
  wonder: { label: "CARDRPG.Group.Wonder", number: 7 }
};

/** Recharge boundaries for an active ability. A numeric recharge counts the owner's turns. */
CARDRPG.recharges = {
  combat: "CARDRPG.Recharge.Combat",
  shortRest: "CARDRPG.Recharge.ShortRest",
  longRest: "CARDRPG.Recharge.LongRest"
};

/* -------------------------------------------- */
/*  Characters and NPCs                         */
/* -------------------------------------------- */

/**
 * The elements an elementalist may hold, and the exclusivity is the whole point: taking one closes
 * the others for good (leveling.md 3, `exclusive: "element"` with the element as the `creed`).
 *
 * No new mechanism was needed. The nested exclusive group was built for Way of Faith -- a family
 * with a creed per religion -- and generalised on purpose so an add-on's pantheon would be
 * correctly exclusive without a rules change. This is its second user, and the first that is not
 * a god.
 *
 * The rule it supplies was already overdue: *Wall of the Sphere* and *The Sphere Entire* both read
 * "a line of **your element**" (way-cards 3.4) and nothing anywhere said how an elementalist came
 * to have one.
 */
CARDRPG.elements = {
  fire: { label: "CARDRPG.Element.Fire", condition: "burning" },
  frost: { label: "CARDRPG.Element.Frost", condition: "frozen" },
  storm: { label: "CARDRPG.Element.Storm", condition: "stunned" },
  water: { label: "CARDRPG.Element.Water", condition: "wet" }
};

CARDRPG.ways = {
  strength: "CARDRPG.Way.Strength",
  shade: "CARDRPG.Way.Shade",
  mind: "CARDRPG.Way.Mind",
  /* A whole chapter of rules/specializations.md, and it was missing from the vocabulary -- so the
   * sheet's Way dropdown could not offer it and the graph's fourth root had no label. */
  faith: "CARDRPG.Way.Faith"
};

/**
 * What a reaction fires on. There are two events in the whole game -- a hit landed, and an enemy
 * arrived -- and `allyHit` is the first of them seen from one square over.
 *
 * Two is what makes automatic reactions tractable. It was four until Use was given Brace's trigger
 * (core-rules 3): Use fired on "any time on another's turn", which is not an event, so there was
 * nothing an engine could dispatch on and nothing a prompt could open at.
 */
/*
 * **A trigger is not a mechanism, it is an event site**, and that is why five documents asked for
 * "a new trigger" over this project's life and none of them got one. `reactionsFor(actor, trigger)`
 * has been generic since it was written, so a key here costs one line; what each one needs is
 * somewhere in the code that RAISES it. `hit` is raised in the attack resolver, `arrival` by a
 * token ending its move, `allyHit` inside the redirect step -- and `cast` could not be raised at
 * all until a spell could be cast, which is a thing that started working one commit ago.
 */
CARDRPG.reactionTriggers = {
  hit: "CARDRPG.Trigger.Hit",
  allyHit: "CARDRPG.Trigger.AllyHit",
  arrival: "CARDRPG.Trigger.Arrival",
  cast: "CARDRPG.Trigger.Cast",
  /* A failed skill check, which could not be an event until something resolved a check. */
  check: "CARDRPG.Trigger.Check"
};

/**
 * Printed reactions. Brace is universal and never blocked, so it isn't listed here -- it is what
 * every upright card in your hand can do, which is why no card is ever dead.
 *
 * `kind` is the resolution class (core-rules 3): redirection resolves before reduction, because it
 * changes WHO is being hit. `use` sits in the reduction step without reducing anything, because it
 * is the ALTERNATIVE to reducing -- one reaction per trigger is what makes that a choice.
 *
 * `bonus` is what the reaction adds to the item's own Defend line, and `melee` marks the one that
 * only answers a melee Strike. Both are fields rather than cases in the resolver, so a Way card
 * that prints a better Parry is content.
 */
CARDRPG.reactions = {
  parry: { label: "CARDRPG.Reaction.Parry", kind: "reduce", trigger: "hit", melee: true, bonus: 0 },
  block: { label: "CARDRPG.Reaction.Block", kind: "reduce", trigger: "hit", needsTag: "shield", bonus: 1 },
  sidestep: { label: "CARDRPG.Reaction.Sidestep", kind: "other", trigger: "arrival", valued: true },
  /*
   * The only reaction that answers by dealing damage, and the only one with a weapon requirement:
   * `needsReach` 2, because a free Strike at every arrival for anyone holding a knife is a large
   * amount of power (a card with Strike on its secondary shortens a fight by a whole round), while
   * the same thing on a shaft is what the four reach weapons in the catalogue were missing. It is
   * written on *Set Spear* (way-cards 3.2) and it reaches over the man in front of you.
   */
  counter: { label: "CARDRPG.Reaction.Counter", kind: "other", trigger: "arrival", needsReach: 2 },
  use: { label: "CARDRPG.Reaction.Use", kind: "reduce", trigger: "hit" },
  /*
   * The Bard's. way-cards printed it as a reaction "when an enemy acts", which is not an event the
   * game has -- the identical defect already fixed on Quick Hands, whose trigger used to be "any
   * time on another's turn". An enemy ARRIVING is an event, and it is the moment the heckle lands:
   * the enemy walks into reach and attacks on the same turn, with its draw already spoiled.
   */
  heckle: { label: "CARDRPG.Reaction.Heckle", kind: "other", trigger: "arrival" },
  bodyguard: { label: "CARDRPG.Reaction.Bodyguard", kind: "redirect", trigger: "allyHit" },

  /*
   * The two that live on a **spell** rather than on a card, which is the first time a reaction has
   * not been something you hold in your hand.
   *
   * way-cards 3.4 argued for this from the simulation and it is worth repeating: *a dispel on a
   * drawn card is nearly worthless because it is in hand 31% of turns* -- so a counterspell on an
   * action card is a card you have when you do not need it. On a **prepared** spell it is there
   * every fight, costs no half, and is paid for out of the slot budget. That is the only surface
   * worth putting a dispel on, and it is why Ward Magic's axis is Reactions.
   *
   * `spell: true` is what tells `reactionsFor` to look in the spell book instead of the hand.
   */
  unmake: {
    label: "CARDRPG.Reaction.Unmake", kind: "other", trigger: "cast", spell: true
  },
  mend: {
    label: "CARDRPG.Reaction.Mend", kind: "other", trigger: "allyHit", spell: true
  },
  /*
   * Spiritualism's, and the third reaction that lives on a prepared spell. It answers a FAILED
   * CHECK, which is the one trigger that is not about an attack at all -- a god intervening in the
   * ordinary business of trying something and not managing it.
   */
  bargain: {
    label: "CARDRPG.Reaction.Bargain", kind: "other", trigger: "check", spell: true
  }
};


/** NPC tactic keywords. `revealed` is tracked per actor, not here. */
CARDRPG.tactics = {
  packTactics: "CARDRPG.Tactic.PackTactics",
  skirmisher: "CARDRPG.Tactic.Skirmisher",
  ambusher: "CARDRPG.Tactic.Ambusher",
  sniper: "CARDRPG.Tactic.Sniper",
  shieldWall: "CARDRPG.Tactic.ShieldWall",
  bodyguard: "CARDRPG.Tactic.Bodyguard",
  brute: "CARDRPG.Tactic.Brute",
  grappler: "CARDRPG.Tactic.Grappler",
  commander: "CARDRPG.Tactic.Commander",
  cowardly: "CARDRPG.Tactic.Cowardly",
  tainting: "CARDRPG.Tactic.Tainting"
};

/**
 * What a creature can do, which is what earns a card its place in that creature's deck
 * (core-rules 9).
 *
 * **Every one of these is read by an intent card.** That is the rule the list obeys and the reason
 * it is shorter than the roster's vocabulary: a creature's description may call it armoured, clever,
 * big or slow, and those are stats, AI quality or flavour -- they belong in `armorBase`, in a
 * tactic keyword, or nowhere. A capability no card asks for would be a field nothing reads, which
 * is the defect this project keeps digging out of its own history.
 *
 * `move` is deliberately absent: it is derived from having legs, wings, fins or a tunnel
 * (monsters.mjs `capsOf`), and the Queen -- rooted, unique -- is the creature that proves deriving
 * it was worth the trouble.
 */
/**
 * **When a step may be played**, which the cards used to say in prose and the engine could not read.
 *
 * Six values, every one of them a phrase already written on a card rather than a category invented
 * for the table: a Signature that reads *ritual: overnight a ruin becomes a house* is a ritual, and
 * one that reads *permanent: +3 armor* is not a step at all.
 */
/**
 * **How a spell's price is worked out**, for the three that are not a flat number.
 *
 * This is what the prose was actually carrying. *Costs 1 Health per ally*, *half your current
 * Health, rounded up*, *Strain your entire hand* -- the amounts were always expressible on
 * `SpellSlateData.cost`; it is **per ally** that had nowhere to go.
 *
 * `perAlly` multiplies by whoever benefits, which is how a Blood Mage pays for helping a crowd;
 * `halfCurrent` is The Last Drop asking half of what is left; `wholeHand` is Valtor's Own asking
 * all of it. A blank scale is a flat amount.
 */
CARDRPG.costScales = {
  perAlly: "CARDRPG.CostScale.PerAlly",
  halfCurrent: "CARDRPG.CostScale.HalfCurrent",
  wholeHand: "CARDRPG.CostScale.WholeHand"
};

/**
 * **The shape a piece of ground takes.** Five, and every one is a shape a card asks for: a line
 * across the field, an area of your element, the squares next to you, the whole map, one square.
 */
CARDRPG.groundShapes = {
  line: "CARDRPG.Ground.Line",
  area: "CARDRPG.Ground.Area",
  adjacent: "CARDRPG.Ground.Adjacent",
  wholeMap: "CARDRPG.Ground.WholeMap",
  square: "CARDRPG.Ground.Square"
};

/**
 * **What the ground then does**, as a ticked list rather than a field each.
 *
 * Every value is a property a card already names, and several cards name two or three at once --
 * *difficult ground, cover, and 2 damage at the start of your turn* is one zone with three
 * properties, which is exactly what a list is for and a column of booleans is not.
 *
 * `shadowed` is the Way of Shade's whole terrain: three other cards READ a shadowed square without
 * making one, which is why making one has to be sayable.
 */
CARDRPG.groundEffects = {
  cover: "CARDRPG.Ground.Cover",
  difficult: "CARDRPG.Ground.Difficult",
  shadowed: "CARDRPG.Ground.Shadowed",
  impassable: "CARDRPG.Ground.Impassable",
  trap: "CARDRPG.Ground.Trap"
};

/**
 * **Who a step is for.**
 *
 * The oldest assumption in the game, and the one nothing ever wrote down: a step targets an ENEMY,
 * because the first step anybody wrote was a Strike. Twenty-nine steps affect allies and had no way
 * to say so -- *an ally's next check cannot fail*, *adjacent allies gain your armor as Block* --
 * so the engine could not tell a blessing from an attack.
 *
 * Blank still means one enemy, which is what every card in the game has always meant by saying
 * nothing. The value exists anyway, for the card that wants to be explicit about it.
 */
CARDRPG.targets = {
  self: "CARDRPG.Target.Self",
  oneEnemy: "CARDRPG.Target.OneEnemy",
  enemiesInRange: "CARDRPG.Target.EnemiesInRange",
  oneAlly: "CARDRPG.Target.OneAlly",
  alliesInRange: "CARDRPG.Target.AlliesInRange",
  adjacentAllies: "CARDRPG.Target.AdjacentAllies",
  everyAlly: "CARDRPG.Target.EveryAlly",
  selfAndAllies: "CARDRPG.Target.SelfAndAllies",
  everyone: "CARDRPG.Target.Everyone"
};

/**
 * **How often a step may be played**, for the three that say so.
 *
 * Two values, not three: no card in the game says "once per fight" on its own -- the one that comes
 * closest says *once per pact per fight*, which is a different and narrower thing. A plain
 * per-fight limit arrives with the first card that wants one, because a value nobody writes is an
 * entry in a dropdown and nothing else.
 */
CARDRPG.limits = {
  day: "CARDRPG.Limit.Day",
  pactPerFight: "CARDRPG.Limit.PactPerFight"
};

/**
 * **Whose fate deck a Read looks at** (core-rules 6).
 *
 * Four steps carried this in prose and two of them carried it as a rider on something else, which
 * is why the field is here rather than inside the foresee effect: a Read can be the action or it
 * can be the smaller half of one.
 */
/*
 * **`own` was dropped on 2026-11-07, and what it cost is worth recording.** It had exactly one user
 * -- Divination's *Where It Will Land* -- and that was the formula contradicting its own node's
 * stated price: *no divination of yours may look at or reorder your own fate deck, ever*. Fixing
 * the formula left the value with nobody. The Gambler's Coin still reads its holder's own deck, but
 * it is an Item and this enum is a Card field, so its Read stays prose. A value that is only an
 * entry in a dropdown is the defect this project keeps digging out of its own history.
 */
CARDRPG.readDecks = {
  other: "CARDRPG.Read.Other",
  target: "CARDRPG.Read.Target",
  all: "CARDRPG.Read.All"
};

/**
 * **A state of your own that a step waits on**, which eleven steps described in prose.
 *
 * Every value is a phrase off a card rather than a category invented for the table, and the list
 * is long because the cards are specific: *while your hand is empty* and *while your hand is
 * exactly one card* are two different builds, and a Way is built on each.
 *
 * Most of these the engine can see for itself -- hand size, deck size, whether both hands are free,
 * whether an ally is near -- which is the point: a condition the software can read is a condition
 * it can SHOW, and a card whose whole design is an empty hand should say so on its face.
 */
CARDRPG.whileStates = {
  handEmpty: "CARDRPG.While.HandEmpty",
  handsEmpty: "CARDRPG.While.HandsEmpty",
  oneCard: "CARDRPG.While.OneCard",
  handAndDeckEmpty: "CARDRPG.While.HandAndDeckEmpty",
  thinDeck: "CARDRPG.While.ThinDeck",
  noAllyNear: "CARDRPG.While.NoAllyNear",
  spendSecondary: "CARDRPG.While.SpendSecondary",
  spendSecondaryEachRound: "CARDRPG.While.SpendSecondaryEachRound",
  upkeep: "CARDRPG.While.Upkeep"
};

CARDRPG.timings = {
  reaction: "CARDRPG.Timing.Reaction",
  ritual: "CARDRPG.Timing.Ritual",
  outOfCombat: "CARDRPG.Timing.OutOfCombat",
  beforeFight: "CARDRPG.Timing.BeforeFight"
};
/*
 * There was a `permanent` here, and it was a slot budget wearing a timing's clothes: it said *this
 * formula can never be prepared* rather than when anything happens. The content it described is
 * nine features now, and a feature is permanent by having no gate to pass, so the word had nothing
 * left to mean on a step.
 */

/**
 * **Permanent harm, and the ritual that lifts each kind.**
 *
 * An injury is the fourth slate kind. core-rules 1 has listed it as one since the slate table was
 * written -- *"item slates, feature slates, secret slates, permanent injuries"* -- and items.mjs
 * names the same four in its own first paragraph. Three of them had a data model.
 *
 * **A category exists for exactly one reason: so a ritual can name one.** That is the whole of its
 * job, and it is why the ritual is a field here rather than prose somewhere else -- a category
 * whose `ritual` nothing reads would be a value that is only an entry in a dropdown, which is the
 * defect this project keeps finding. `liftRitual` reads it, and the one-per-category cap on the
 * sheet reads the keys.
 *
 * **`cap` is how many of this kind you may carry, and only one category is uncapped.**
 *
 * Every other cap is 1, which is what keeps a character from stacking into a death spiral. A
 * **Maiming** is uncapped because the cap read absurdly there and nowhere else: one ritual regrows
 * an eye and a leg alike, so they are one category, and a cap that follows the ritual was telling
 * a one-eyed character their legs were safe for ever.
 *
 * It is not free. Measured against the published encounters, a *Bad Leg* alone is **-8.1** win
 * rate and **-21.1** against archers; *Rotted* is -5.4 and *Lost Hand* -1.6. Three maimings is
 * more than two of the most expensive card in the game, stacked. What keeps that from being a
 * spiral is the thing ideas.md specified for it and nothing had built: **Adapted**, which switches
 * one injury's penalty off and leaves the injury on the sheet. Uncapping without it would have
 * taken out a brake and not fitted the one designed to replace it.
 *
 * A `null` cap is uncapped; it is not the absence of an answer, which is why every category
 * states one.
 *
 * `progress` and `pressure` are a **challenge** (skill-rules 3 and 6), not a check, and the world
 * document is what chose that: Ritual Magic's price is *"Time, and a recipe that can go wrong"*,
 * which is a Progress track and a Pressure track in the two words it took to say it. Cleansing's
 * numbers are not new here -- core-rules 8 has published them as Lore, Progress 4 since Taint was
 * written, and this is the table that finally holds them.
 *
 * **Obligation lifts for nobody, and `ritual: null` is how it says so.** Bound Taint already has
 * this exact asymmetry -- *neither a cure nor Cleansing lifts it; the obligation names the one
 * thing that does* -- and keeping it is what stops a ritual list becoming a laundry service. The
 * four that lift are a service. The fifth is a story, and it is the GM's.
 */
CARDRPG.injuryCategories = {
  /* Flesh and bone that did not grow back: an eye, fingers, a hand, a leg that sets wrong. */
  maiming: {
    label: "CARDRPG.Injury.Maiming", icon: "severed-hand",
    ritual: "Regrowth", approach: "lore", progress: 6, pressure: 4,
    /* The one uncapped kind. A Regrowth lifts ONE, so three maimings is three rituals. */
    cap: null
  },
  /* Nerve, memory and conviction. The body is whole and something behind it is not. */
  breaking: {
    label: "CARDRPG.Injury.Breaking", icon: "oppression",
    ritual: "Quieting", approach: "presence", progress: 6, pressure: 4, cap: 1
  },
  /*
   * Somebody did this on purpose, which is the only category that names a person -- so the ritual
   * has to name them too, and `needsName` is the dial that says a recipe alone is not enough.
   * That is also the one gate in the four that a party cannot buy its way through.
   */
  curse: {
    label: "CARDRPG.Injury.Curse", icon: "bottled-bolt",
    ritual: "Unbinding", approach: "lore", progress: 8, pressure: 3, needsName: true,
    cap: 1
  },
  /* Taint nobody ever cured, gone past the point a cure reaches. Cleansing's own numbers. */
  corruption: {
    label: "CARDRPG.Injury.Corruption", icon: "virus",
    ritual: "Cleansing", approach: "lore", progress: 4, pressure: 4, cap: 1
  },
  /* A pact, a debt, a curse you picked up knowingly. No ritual, on purpose. */
  obligation: {
    label: "CARDRPG.Injury.Obligation", icon: "lock-spy",
    ritual: null, approach: null, progress: null, pressure: null, cap: 1
  }
};

/**
 * **How much a permanent injury costs you, as the one number the engine can price.**
 *
 * Every injury in content.mjs says what it does in fields that already existed -- a negative
 * `bonus`, a negative `grants`, a blocked reaction, a step. This is the exception that is not a
 * field: *lasting* injuries heal after days of rest and permanent ones do not, and the difference
 * between them is a number of days rather than a different mechanism.
 *
 * Zero means permanent. It is zero and not null because the sheet subtracts it from a rest count,
 * and a null would have to be special-cased in the one place that reads it.
 */
CARDRPG.injuryHealsIn = { lasting: 14, permanent: 0 };

/**
 * **The lesser rituals: the ones that are not about a permanent injury.**
 *
 * A second table rather than more rows in `injuryCategories`, because a category of injury and a
 * thing a ritual can mend are not the same kind of key -- the four above exist so a **ritual can
 * name a category**, and these name no category at all. Putting them in one table would have made
 * `cap`, `needsName` and the one-per-category rule meaningless on three of its seven rows.
 *
 * **Each one has to earn itself against something that already exists**, which is the test a
 * Burden card failed and a Hex passed by turning out to be a Miss:
 *
 * - `wounds` against **treatment** (Lore 5 and a Healer's Kit) and a **long rest**, both of which
 *   take **one** Wound. This takes *all* of them, which is a different thing to want: a party
 *   limping out of three fights has a deck nobody can play, and one Wound a night is not an
 *   answer to it.
 * - `lasting` against the fourteen days a lasting injury takes anyway. It spends them at once,
 *   and nothing else in the game accelerates that -- the four category rituals lift the
 *   **permanent** kind and have nothing to say about the other.
 * - `held` against **Shake Off**, which spends a condition's duration. These are the conditions
 *   with **no duration to spend** -- Blessed, Cursed, the `liftable` ones -- which is the other
 *   half of that rule and exactly what the `lift` effect was written for.
 *
 * There is deliberately **no Taint recipe**: a Cleansing already removes Taint (core-rules 8), and
 * a second one would be the fourth name for a rule this game states twice already.
 *
 * They are cheap in Progress and that is the point: a ritual specialist should be the person who
 * tidies up after a fight, which is a thing worth being and is not worth eight checks.
 */
CARDRPG.lesserRituals = {
  wounds: {
    label: "CARDRPG.Ritual.Mending", ritual: "Mending", approach: "lore", progress: 2, pressure: 4,
    text: "Removes every Wound from one character's deck."
  },
  lasting: {
    label: "CARDRPG.Ritual.QuietNight", ritual: "Quiet Night", approach: "presence",
    progress: 2, pressure: 3,
    text: "A lasting injury's remaining days of rest are spent at once."
  },
  held: {
    label: "CARDRPG.Ritual.Unknotting", ritual: "Unknotting", approach: "lore",
    progress: 3, pressure: 3,
    text: "Lifts one condition that has no duration to spend \u2014 what Shake Off cannot reach."
  }
};

CARDRPG.capabilities = {
  /* how it gets about */
  legs: "CARDRPG.Capability.Legs",
  flight: "CARDRPG.Capability.Flight",
  swim: "CARDRPG.Capability.Swim",
  burrow: "CARDRPG.Capability.Burrow",
  /* how it reaches you */
  ranged: "CARDRPG.Capability.Ranged",
  reach: "CARDRPG.Capability.Reach",
  spray: "CARDRPG.Capability.Spray",
  /* how it closes */
  fast: "CARDRPG.Capability.Fast",
  brute: "CARDRPG.Capability.Brute",
  siege: "CARDRPG.Capability.Siege",
  /* what it does with numbers */
  pack: "CARDRPG.Capability.Pack",
  grapple: "CARDRPG.Capability.Grapple",
  /* what it leaves behind */
  venom: "CARDRPG.Capability.Venom",
  drain: "CARDRPG.Capability.Drain",
  /* arriving and leaving */
  stealth: "CARDRPG.Capability.Stealth",
  dormant: "CARDRPG.Capability.Dormant",
  /* what it does to somebody else */
  commander: "CARDRPG.Capability.Commander",
  summon: "CARDRPG.Capability.Summon",
  caster: "CARDRPG.Capability.Caster",
  transport: "CARDRPG.Capability.Transport",
  shelter: "CARDRPG.Capability.Shelter",
  /*
   * `terrify` is the only capability that reaches a player's HAND, and it exists because holding
   * reactions had no counter. core-rules 3 calls turning your whole hand sideways "a character
   * playing for their turns rather than their skin" and means it -- but against an enemy that can
   * only deal damage, holding is free. It is a capability rather than a temperament because a
   * shrieking thing and a calculating thing can both make you flinch.
   */
  terrify: "CARDRPG.Capability.Terrify",
  /*
   * --- temperament: what it does when nothing obvious presents itself ---
   *
   * **Every creature in the game has exactly one of these three, and the suite holds them
   * exclusive.** They are here because eight cards in the pool were drawn by all forty-seven
   * creatures -- the same eight were between 67% and 100% of every deck in the game, median 80%,
   * and the Processor's deck was the generic eight and nothing else. A roster whose decks agree
   * four times in five does not feel like a roster, however many special cards sit on top.
   *
   * Three of those eight were never universal in the fiction, only in the data: *Hold the Line*
   * spends your turn giving an ally Block, *Set and Wait* holds a reaction for whoever comes, and
   * *Take Stock* does nothing this round in order to shake a condition off. A Flat Bug drew all
   * three, and so did a Goblin Chief, and nothing in the deck could tell you which was which.
   *
   * So temperament is the gate, and it had to be a capability rather than a field of its own,
   * because `needs` reads capabilities and nothing else (`intentNeeds` below). Three flags where
   * one enumeration would do is the price of that, and the exclusivity check is what keeps the
   * price honest.
   *
   * `drilled` is not declared freely: it is **equivalent to holding a `shieldWall`, `bodyguard` or
   * `commander` tactic**, which is the same statement said in the field the AI already reads, and
   * the suite fails if the two ever disagree. That is the one place in this file where a tactic
   * became load-bearing, and it earned it -- `shieldWall` meant *it holds a line* and did nothing
   * mechanical with the meaning.
   */
  drilled: "CARDRPG.Capability.Drilled",
  feral: "CARDRPG.Capability.Feral",
  wits: "CARDRPG.Capability.Wits"
};

/**
 * The three temperaments, and the tactics that decide the first of them.
 *
 * Exported as data rather than written into the validator, for the reason `MOVERS` is in
 * monsters.mjs: an invariant the suite can **ask about** is one a new creature cannot quietly
 * break.
 */
CARDRPG.temperaments = ["drilled", "feral", "wits"];
CARDRPG.drilledTactics = ["shieldWall", "bodyguard", "commander"];

/**
 * **What an intent card may require.** The capabilities, plus `move`.
 *
 * `move` is not a capability and must not become one: `capsOf` (monsters.mjs) derives it from legs,
 * flight, swim or burrow, so no creature is ever *given* it and the roster sweep excludes it by
 * name for exactly that reason. But `needs` is a different question from `capabilities` -- it asks
 * what a card demands, not what a body has -- and it drew its choices from the capabilities alone.
 *
 * So eight of the twenty-eight intents named a value the schema refused, and a Card whose `needs`
 * is refused does not load at all: Close In, Strike and Step, Give Ground, Charge, Bull Through,
 * Swarm, Fade and Carry were absent from every NPC deck in play, which is every way a monster has
 * of closing distance. Offline the content read back exactly as written.
 */
CARDRPG.intentNeeds = [...Object.keys(CARDRPG.capabilities), "move"];

CARDRPG.targetPriorities = {
  nearest: "CARDRPG.Priority.Nearest",
  weakest: "CARDRPG.Priority.Weakest",
  caster: "CARDRPG.Priority.Caster",
  lastAttacker: "CARDRPG.Priority.LastAttacker",
  leader: "CARDRPG.Priority.Leader"
};

/* -------------------------------------------- */
/*  Defaults                                    */
/* -------------------------------------------- */

/** Rules defaults. Exposed so a world can override them without a system release. */
/** The deck a Wild fate card sends you to (ideas.md, core-rules 6). */
CARDRPG.wildDeck = "wildMagic";

CARDRPG.defaults = {
  handSize: 5,
  /* The skill hand is four and it refills per SCENE, not per round (skill-rules 1). */
  skillHandSize: 4,
  carryLimit: 40,
  actionDeckMax: 20,
  actionDeckMin: 12,
  goldPerKilo: 100,
  afflictedAt: 3,
  afflictedHealthPenalty: 3,
  overloadedSpent: 2,
  // Exactly the Exhausted threshold (core-rules 8): breathing buys one turn that is not Exhausted.
  breathRecovery: 2,
  woundAt: 5,
  /*
   * What Brace takes off, and the floor under every reaction: any upright card in your hand stops
   * this much (core-rules 3). A number here rather than in the resolver, because it is the one
   * reaction with no item behind it to read a value from.
   */
  brace: 1
};
