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
export function fateCards() {
  const cards = [];
  const push = (name, system, n) => {
    for (let i = 0; i < n; i++) {
      cards.push({ name, type: "fate", face: 0, faces: [{ name }], system });
    }
  };
  push("Miss", { special: "miss", value: 0 }, 1);
  push("−2", { value: -2 }, 1);
  push("−1", { value: -1 }, 4);
  push("±0", { value: 0 }, 8);
  push("+1", { value: 1 }, 4);
  push("+2", { value: 2 }, 1);
  push("Critical", { special: "crit", value: 0 }, 1);
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
    name: "Heavy Swing", copies: 2,
    primary: [{ verb: "strike", mod: 1 }],
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
    primary: [{ text: "Target enemy must attack you next turn" }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Weapon Swap", copies: 1,
    primary: [{ verb: "ready" }],
    secondary: [{ verb: "strike" }]
  }
];

/* -------------------------------------------- */
/*  Goblin deck                                 */
/* -------------------------------------------- */

/**
 * Six cards, each a full turn. One is drawn per NPC *type* per round, face down, and every goblin
 * acts on it at its own place in the initiative order (core-rules 3, Intent).
 *
 * Note that Cower is a tactical retreat, not a rout: a Cower goblin comes back. Conflating the two
 * was a real bug in the simulator for several runs.
 */
export const GOBLIN_DECK = [
  {
    name: "Stab & Scurry",
    sequence: [{ verb: "strike" }, { verb: "move", param: 2 }]
  },
  {
    name: "Rush",
    sequence: [{ verb: "move", param: 3 }, { verb: "strike" }]
  },
  {
    name: "Swarm",
    sequence: [
      { verb: "move", param: 2 },
      { verb: "strike", mod: 1, text: "if another goblin is next to the target" }
    ]
  },
  {
    name: "Cower",
    sequence: [{ verb: "move", param: 3, text: "away from the nearest enemy" }]
  },
  {
    name: "Dirty Trick",
    sequence: [{ verb: "strike", text: "target is Dazed (1)" }]
  },
  {
    name: "Throw Rock",
    sequence: [{ verb: "strike", range: 4, text: "1 damage, ignores the item" }]
  }
];

/* -------------------------------------------- */
/*  Slates                                      */
/* -------------------------------------------- */

const verb = (value, extra = {}) => ({ value, ...extra });

/** Player gear. Weight in whole kilograms, value in gold. */
export const ITEMS = [
  {
    name: "Longsword", slot: "hands", fits: ["back"], hands: 1, tags: ["heavy", "melee"],
    weight: 2, value: 15, kind: "Weapon",
    blurb: "A plain cruciform blade, kept sharp.",
    verbs: { strike: verb(3), defend: verb(1) }
  },
  {
    name: "Dagger", slot: "hands", fits: ["belt"], hands: 1, tags: ["light", "melee", "thrown"],
    weight: 0, value: 2, kind: "Weapon",
    blurb: "Short, quick, and easy to hide.",
    verbs: { strike: verb(2, { range: 3, text: "range 3 thrown" }) }
  },
  {
    name: "Shortbow", slot: "hands", fits: ["back"], hands: 2, tags: ["ranged"],
    weight: 1, value: 25, kind: "Weapon",
    blurb: "Horn and sinew, strung short for close country.",
    verbs: { strike: verb(2, { range: 6 }) }
  },
  {
    name: "Staff of Healing", slot: "hands", fits: ["back"], hands: 2, tags: ["arcane", "melee"],
    weight: 2, value: 0, kind: "Implement", group: "make",
    blurb: "Pale wood, warm to the touch.",
    verbs: { strike: verb(1), cast: verb(3, { range: 2, text: "Heal 3" }), defend: verb(1) }
  },
  {
    name: "Fire Wand", slot: "hands", fits: ["belt"], hands: 1, tags: ["arcane"],
    weight: 0, value: 0, kind: "Implement", group: "make",
    blurb: "Blackened at the tip, and warm even unused.",
    // Blast hits everyone in the area, allies included. It is the default and the cheap one.
    verbs: { cast: verb(2, { range: 4, area: 1, areaKind: "blast" }) }
  },
  {
    name: "Wooden Shield", slot: "hands", fits: ["back"], hands: 1, tags: ["shield"],
    weight: 3, value: 10, kind: "Shield",
    blurb: "Banded oak, scarred across the face.",
    verbs: { strike: verb(1), defend: verb(2) }
  },
  {
    name: "Leather Armor", slot: "body", hands: 1, tags: ["armor"],
    weight: 5, value: 20, armor: 1, kind: "Armor",
    blurb: "Boiled and riveted, and it still smells of the tannery."
  },
  {
    name: "Healing Potion", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 50, consumed: true, kind: "Consumable",
    blurb: "Thick, red, and tastes of iron.",
    verbs: { use: verb(4, { text: "Heal 4, then discard the item" }) }
  },
  {
    name: "Smoke Bomb", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 40, consumed: true, kind: "Consumable",
    blurb: "A waxed clay ball, heavier than it looks.",
    verbs: { use: verb(null, { text: "You become Invisible (1)" }) }
  }
];

/**
 * NPC gear, tuned separately from player gear (core-rules 9). A Goblin Spear and a player's spear
 * can share a name and differ in value: an NPC's weapon is the knob that sets how dangerous it is.
 *
 * Both are Strike 3, which is the rule in practice -- keep a weak enemy at least 2 above the
 * heroes' armor, or flat armor cancels its hits rather than reducing them.
 */
export const NPC_GEAR = [
  {
    name: "Goblin Spear", slot: "hands", fits: ["back"], hands: 1, tags: ["melee"],
    weight: 2, value: 0, npcGear: true, kind: "Weapon",
    verbs: { strike: verb(3) }
  },
  {
    name: "Goblin Shortbow", slot: "hands", fits: ["back"], hands: 2, tags: ["ranged"],
    weight: 1, value: 0, npcGear: true, kind: "Weapon",
    verbs: { strike: verb(3, { range: 6 }) }
  }
];

/**
 * Features. A passive feature is simply true and stays small; anything that would swing a fight
 * needs a recharge. `grants` holds the flat traits the derived stats read -- those are NOT
 * bonus-grouped, because a group caps bonuses to one action while these change a standing number.
 */
export const FEATURES = [
  {
    name: "Strong", group: "body",
    text: "+1 damage on Strike with Heavy items.",
    bonus: { verb: "strike", value: 1, requiresTag: "heavy" }
  },
  {
    name: "Good Aim", group: "training",
    text: "+2 range on Ranged and Thrown items.",
    bonus: { verb: "strike", range: 2, requiresTag: "ranged" }
  },
  {
    name: "Quick",
    text: "Hand size +1.",
    grants: { handSize: 1 }
  },
  {
    name: "Tough",
    text: "+4 max Health.",
    grants: { health: 4 }
  },
  {
    name: "Arcane Focus", group: "power",
    text: "+1 to all Cast values.",
    bonus: { verb: "cast", value: 1 }
  },
  {
    name: "Steady",
    text: "You don't become Dazed.",
    active: { text: "Drain: you don't become Dazed.", boundary: "combat" }
  },
  {
    name: "Alert",
    text: "You draw with advantage on initiative."
  },
  {
    name: "Packhorse",
    text: "+20 kg carry allowance.",
    grants: { carry: 20 }
  }
];

/* -------------------------------------------- */
/*  Actors                                      */
/* -------------------------------------------- */

/**
 * The pregenerated starter Warrior. Character creation is deferred until after the first playtest,
 * so this is what you play: copy it rather than building one.
 *
 * 12 Health, Leather Armor (armor 1), Longsword, Wooden Shield, a Healing Potion and Strong -- the
 * same loadout every simulation run used, so the measured win rates apply to it directly.
 */
export const WARRIOR = {
  name: "Starter Warrior",
  type: "character",
  system: {
    health: { value: 12, base: 12 },
    way: "strength",
    rest: { tokens: 1, max: 1 },
    cash: { gold: 20 }
  },
  equipped: ["Longsword", "Wooden Shield", "Leather Armor", "Healing Potion"],
  pack: ["Dagger"],
  features: ["Strong"]
};

/**
 * The goblin. Tactics are Pack Tactics and Cowardly, with target priority Weakest.
 *
 * Simulation says Cowardly as written hands back more than Pack Tactics takes -- four goblins with
 * both are EASIER than four with no tactics at all. The proposed fix (the survivors break once half
 * the group is down) is still [OPEN] in the rules, so the keyword here is as written and the
 * playtest should watch for goblins trickling away one at a time.
 */
export const GOBLIN = {
  name: "Goblin",
  type: "npc",
  system: {
    health: { value: 5, base: 5 },
    kind: "goblin",
    armorBase: 0,
    tactics: ["packTactics", "cowardly"],
    targetPriority: "weakest"
  },
  equipped: ["Goblin Spear"]
};

/** Same deck, same type, different gear -- which is the point of NPCs drawing values from items. */
export const GOBLIN_ARCHER = {
  name: "Goblin Archer",
  type: "npc",
  system: {
    health: { value: 5, base: 5 },
    kind: "goblin",
    armorBase: 0,
    tactics: ["packTactics", "cowardly"],
    targetPriority: "weakest"
  },
  equipped: ["Goblin Shortbow"]
};

/* -------------------------------------------- */
/*  Encounters                                  */
/* -------------------------------------------- */

/**
 * Measured against one starter Warrior, so these are a tuning yardstick rather than a party
 * difficulty table. A mixed group is a tier harder than a uniform one of the same size.
 */
export const ENCOUNTERS = [
  { label: "3 goblins with spears", difficulty: "Easy", winRate: "99.4%" },
  { label: "4 goblins with spears", difficulty: "Moderate", winRate: "93.2%" },
  { label: "5 goblins with spears", difficulty: "Hard", winRate: "75.9%" },
  { label: "4 goblins, 2 spears + 2 bows", difficulty: "Deadly", winRate: "64.6%" }
];
