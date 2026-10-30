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
  range: { label: "CARDRPG.Effect.Range", icon: "bullseye" },
  blast: { label: "CARDRPG.Effect.Blast", icon: "mushroom-cloud" },
  aimed: { label: "CARDRPG.Effect.Aimed", icon: "laser-sparks" },
  advantage: { label: "CARDRPG.Effect.Advantage", icon: "thumb-up" },
  disadvantage: { label: "CARDRPG.Effect.Disadvantage", icon: "thumb-down" },
  charging: { label: "CARDRPG.Effect.Charging", icon: "charging" }
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
  invisible: { label: "CARDRPG.Condition.Invisible", icon: "invisible" },
  // Fire annihilates with water in both its states: a wet target steams, a frozen one thaws.
  burning: {
    label: "CARDRPG.Condition.Burning",
    icon: "fire-silhouette",
    valued: true,
    cancels: ["wet", "frozen"]
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
  unconscious: { label: "CARDRPG.Condition.Unconscious", icon: "knockout", blocksReactions: true },
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
  blessed: { label: "CARDRPG.Condition.Blessed", icon: "aura", noDuration: true },
  cursed: { label: "CARDRPG.Condition.Cursed", icon: "imprisoned", noDuration: true },
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
CARDRPG.fateRank = { miss: -99, crit: 99 };

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

CARDRPG.ways = {
  strength: "CARDRPG.Way.Strength",
  shade: "CARDRPG.Way.Shade",
  mind: "CARDRPG.Way.Mind"
};

/** Printed reactions. Brace is universal and never blocked, so it isn't listed here. */
CARDRPG.reactions = {
  parry: { label: "CARDRPG.Reaction.Parry", kind: "reduce" },
  block: { label: "CARDRPG.Reaction.Block", kind: "reduce" },
  sidestep: { label: "CARDRPG.Reaction.Sidestep", kind: "other" },
  use: { label: "CARDRPG.Reaction.Use", kind: "other" },
  bodyguard: { label: "CARDRPG.Reaction.Bodyguard", kind: "redirect" }
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
CARDRPG.defaults = {
  handSize: 5,
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
  reactionTimer: 20
};
