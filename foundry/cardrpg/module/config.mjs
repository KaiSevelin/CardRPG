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

/** Skill-card approaches. Out of scope for the combat playtest, kept for completeness. */
CARDRPG.approaches = {
  might: { label: "CARDRPG.Approach.Might", icon: "mighty-force" },
  agility: { label: "CARDRPG.Approach.Agility", icon: "run" },
  shadow: { label: "CARDRPG.Approach.Shadow", icon: "spy" },
  wits: { label: "CARDRPG.Approach.Wits", icon: "all-seeing-eye" },
  lore: { label: "CARDRPG.Approach.Lore", icon: "book-cover" },
  presence: { label: "CARDRPG.Approach.Presence", icon: "embraced-energy" },
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
 */
CARDRPG.conditions = {
  dazed: { label: "CARDRPG.Condition.Dazed", icon: "surprised", blocksSecondary: true },
  slowed: { label: "CARDRPG.Condition.Slowed", icon: "tortoise", halvesMove: true },
  stunned: { label: "CARDRPG.Condition.Stunned", icon: "brain-freeze", blocksReactions: true },
  invisible: { label: "CARDRPG.Condition.Invisible", icon: "invisible" },
  burning: { label: "CARDRPG.Condition.Burning", icon: "fire-silhouette" },
  prone: { label: "CARDRPG.Condition.Prone", icon: "falling" },
  unconscious: { label: "CARDRPG.Condition.Unconscious", icon: "knockout", blocksReactions: true },
  grappled: { label: "CARDRPG.Condition.Grappled", icon: "luchador", blocks: ["boot-prints"] },
  silenced: { label: "CARDRPG.Condition.Silenced", icon: "silenced", blocks: ["magic-swirl"] },
  disarmed: { label: "CARDRPG.Condition.Disarmed", icon: "drop-weapon", blocks: ["school-bag"] },
  blessed: { label: "CARDRPG.Condition.Blessed", icon: "aura", noDuration: true },
  cursed: { label: "CARDRPG.Condition.Cursed", icon: "imprisoned", noDuration: true },
  burdened: {
    label: "CARDRPG.Condition.Burdened",
    icon: "wooden-crate",
    noDuration: true,
    derived: true,
    halvesMove: true
  },
  overloaded: {
    label: "CARDRPG.Condition.Overloaded",
    icon: "duffel-bag",
    noDuration: true,
    derived: true,
    halvesMove: true
  }
};

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

/** Equipment slots. The pack is unbounded by slots and bounded by weight instead. */
CARDRPG.slots = {
  hands: { label: "CARDRPG.Slot.Hands", icon: "hand", capacity: 2 },
  body: { label: "CARDRPG.Slot.Body", icon: "person", capacity: 1 },
  belt: { label: "CARDRPG.Slot.Belt", icon: "belt", capacity: 2 },
  pack: { label: "CARDRPG.Slot.Pack", icon: "knapsack", capacity: null }
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
  woundAt: 5,
  reactionTimer: 20
};
