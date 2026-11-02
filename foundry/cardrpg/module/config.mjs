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
  lift: { label: "CARDRPG.Effect.Lift", icon: "magic-palm" }
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
 * Conditions carry a duration AND a creator: the duration ticks at the start of the creator's turn,
 * or the victim's if the creator has left combat (core-rules 7). Foundry's token status overlays
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
  offBalance: { label: "CARDRPG.Condition.OffBalance", icon: "foot-trip", opening: true },
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


/** Item tags. Heavy and Light are mechanical -- Strong reads them -- and are NOT weight. */
CARDRPG.itemTags = [
  "heavy", "light", "melee", "ranged", "thrown", "arcane", "shield", "armor", "consumable"
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
CARDRPG.readDecks = {
  own: "CARDRPG.Read.Own",
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
  beforeFight: "CARDRPG.Timing.BeforeFight",
  permanent: "CARDRPG.Timing.Permanent"
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
  shelter: "CARDRPG.Capability.Shelter"
};

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
