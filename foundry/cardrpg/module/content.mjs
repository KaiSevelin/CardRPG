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
    // The condition rides on the Strike, so it lands when the Strike does -- no save, no second
    // fate draw (core-rules 7).
    name: "Dirty Trick",
    sequence: [{ verb: "strike", condition: "dazed", duration: 1 }]
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
  },
  /* ---- melee, one per speciality the world document names ------------------
   * worldinfo/Firma.md's "Specialization -- Way of Strength" chapter lists fifteen weapon
   * specialities as empty headings. The list is derived from that rather than invented, which is
   * the same discipline the magic schools' prices got (rules/equipment.md 2).
   */
  {
    name: "Arming Sword", slot: "hands", fits: ["back"], hands: 1, tags: ["melee"],
    weight: 1, value: 12, kind: "Weapon",
    blurb: "A plain single-handed blade. Every town has a smith who makes them.",
    verbs: { strike: verb(3), defend: verb(1) }
  },
  {
    name: "Greatsword", slot: "hands", hands: 2, tags: ["heavy", "melee"],
    weight: 3, value: 40, kind: "Weapon",
    blurb: "Four feet of edge. Both hands, and nothing held back.",
    verbs: { strike: verb(5) }
  },
  {
    name: "Great Axe", slot: "hands", hands: 2, tags: ["heavy", "melee"],
    weight: 4, value: 30, kind: "Weapon",
    blurb: "Cheaper than a greatsword and it does not care.",
    verbs: { strike: verb(5) }
  },
  {
    name: "Mace", slot: "hands", fits: ["belt"], hands: 1, tags: ["heavy", "melee"],
    weight: 2, value: 10, kind: "Weapon",
    blurb: "Flanged. It does not cut, which is the point against a man in mail.",
    verbs: { strike: verb(3, { text: "ignores 1 armor" }) }
  },
  {
    name: "Warhammer", slot: "hands", fits: ["back"], hands: 1, tags: ["heavy", "melee"],
    weight: 3, value: 25, kind: "Weapon",
    blurb: "A beak on one side for the plate and a hammer on the other for the man in it.",
    verbs: { strike: verb(4, { text: "ignores 1 armor" }) }
  },
  {
    name: "Spear", slot: "hands", fits: ["back"], hands: 1, tags: ["melee", "thrown"],
    weight: 2, value: 8, kind: "Weapon",
    blurb: "The cheapest thing that keeps a man at arm's length.",
    verbs: { strike: verb(3, { range: 3, text: "range 3 thrown" }) }
  },
  {
    name: "Halberd", slot: "hands", hands: 2, tags: ["heavy", "melee"],
    weight: 3, value: 35, kind: "Weapon",
    blurb: "Axe, spike and hook on a six-foot shaft. Reaches over the man in front of you.",
    verbs: { strike: verb(4, { range: 2, text: "reach 2" }) }
  },
  {
    name: "Pike", slot: "hands", hands: 2, tags: ["heavy", "melee"],
    weight: 4, value: 20, kind: "Weapon",
    // Useless adjacent is the price of reach 3: a pikeman wants somebody in front of them, which
    // is the whole of a formation.
    blurb: "Eighteen feet. Magnificent in a line and worthless on your own.",
    verbs: { strike: verb(3, { range: 3, text: "reach 3; useless adjacent" }) }
  },
  {
    name: "Lance", slot: "hands", hands: 1, tags: ["heavy", "melee"],
    weight: 3, value: 30, kind: "Weapon",
    blurb: "A couched lance is a horse's weight arriving at one point. Needs the horse.",
    verbs: { strike: verb(5, { text: "needs a mount" }) }
  },
  {
    name: "Trident", slot: "hands", fits: ["back"], hands: 1, tags: ["melee"],
    weight: 2, value: 18, kind: "Weapon",
    blurb: "Arena work. The crowd likes the shape of it.",
    verbs: { strike: verb(3, { range: 2, text: "reach 2" }) }
  },
  {
    name: "Net", slot: "hands", fits: ["belt"], hands: 1, tags: ["light", "thrown"],
    weight: 1, value: 5, kind: "Weapon",
    blurb: "Weighted at the edges. The other half of a trident.",
    verbs: { strike: verb(0, { range: 3, text: "Grappled (1), resist Might 5" }) }
  },

  /* ---- bows and crossbows ---- */
  {
    name: "Longbow", slot: "hands", fits: ["back"], hands: 2, tags: ["heavy", "ranged"],
    weight: 2, value: 50, kind: "Weapon",
    // The longbow's whole argument against a crossbow that hits harder: it fires every turn.
    blurb: "A yew stave taller than the archer. No reload -- that is what you are buying.",
    verbs: { strike: verb(3, { range: 10 }) }
  },
  {
    name: "Crossbow", slot: "hands", fits: ["back"], hands: 2, tags: ["ranged"],
    weight: 3, value: 60, kind: "Weapon",
    blurb: "Anyone can be taught one in a week, which is why lords dislike them.",
    verbs: { strike: verb(4, { range: 8, text: "ignores 1 armor; Ready to reload" }) }
  },
  {
    name: "Heavy Crossbow", slot: "hands", hands: 2, tags: ["heavy", "ranged"],
    weight: 5, value: 120, kind: "Weapon",
    blurb: "Cranked with a windlass. It goes through a shield and the arm behind it.",
    verbs: { strike: verb(5, { range: 10, text: "ignores 1 armor; Ready to reload" }) }
  },

  /* ---- firearms: matchlocks, and the reason plate stopped being worth its weight ---- */
  {
    name: "Matchlock Pistol", slot: "hands", fits: ["belt"], hands: 1, tags: ["ranged"],
    weight: 1, value: 70, kind: "Weapon",
    blurb: "One hand, so it goes beside a sword. A brace of them is two shots before a reload.",
    verbs: { strike: verb(3, { range: 4, text: "ignores 2 armor; Ready to reload" }) }
  },
  {
    name: "Arquebus", slot: "hands", fits: ["back"], hands: 2, tags: ["heavy", "ranged"],
    weight: 4, value: 90, kind: "Weapon",
    blurb: "Loud, slow, and it does not care what you are wearing.",
    verbs: { strike: verb(5, { range: 8, text: "ignores 2 armor; Ready to reload" }) }
  },
  {
    name: "Matchlock Musket", slot: "hands", hands: 2, tags: ["heavy", "ranged"],
    weight: 5, value: 150, kind: "Weapon",
    blurb: "A rest to fire it from and a minute to load it. Worth both.",
    verbs: { strike: verb(6, { range: 12, text: "ignores 2 armor; Ready to reload" }) }
  },

  /* ---- armour: four rungs, bought with kilograms, because armor is a cliff edge ---- */
  {
    name: "Mail Shirt", slot: "body", tags: ["armor"],
    weight: 9, value: 70, kind: "Armor", armor: 2,
    blurb: "Riveted rings to the hip. The soldier's compromise for eight hundred years."
  },
  {
    name: "Brigandine", slot: "body", tags: ["armor", "heavy"],
    weight: 12, value: 140, kind: "Armor", armor: 3,
    blurb: "Plates riveted between canvas. Heavy enough that you stop dodging.",
    text: "Blocks Sidestep reactions."
  },
  {
    name: "Plate", slot: "body", tags: ["armor", "heavy"],
    weight: 20, value: 400, kind: "Armor", armor: 4,
    // Half a 40 kg allowance: Plate is a bet that nothing will out-range you.
    blurb: "Half your carry allowance, and nothing short of a ball goes through it.",
    text: "Blocks Sidestep reactions."
  },
  {
    name: "Buckler", slot: "hands", fits: ["belt"], hands: 1, tags: ["shield"],
    weight: 1, value: 6, kind: "Shield",
    blurb: "A fist-sized iron plate. Better than the hand behind it.",
    verbs: { defend: verb(1) }
  },
  {
    name: "Kite Shield", slot: "hands", fits: ["back"], hands: 1, tags: ["shield"],
    weight: 4, value: 24, kind: "Shield",
    blurb: "Long enough to cover the leg a horseman cannot move.",
    verbs: { defend: verb(2, { text: "Defend 3 against Ranged" }) }
  },
  {
    name: "Tower Shield", slot: "hands", hands: 1, tags: ["shield", "heavy"],
    weight: 8, value: 45, kind: "Shield",
    blurb: "A wall for a man who has decided not to go anywhere.",
    verbs: { defend: verb(3, { text: "your Move is halved while it is in hand" }) }
  },
  {
    name: "Light Helm", slot: "head", tags: ["armor"],
    weight: 1, value: 15, kind: "Armor", armor: 1,
    blurb: "An open kettle. You can still hear and still see."
  },
  {
    name: "Great Helm", slot: "head", tags: ["armor", "heavy"],
    weight: 3, value: 40, kind: "Armor", armor: 1,
    blurb: "Safe, and you cannot hear a thing through it.",
    text: "Disadvantage on Wits checks."
  },

  /* ---- the five worn slots that had no item in them at all ---- */
  {
    name: "Travelling Cloak", slot: "cloak", weight: 2, value: 8, kind: "Station", group: "station",
    blurb: "Oiled wool. The difference between a wet night and an unbearable one.",
    bonus: { approach: "shadow", value: 1, situation: "outdoors, and you stay dry" }
  },
  {
    name: "Fine Clothes", slot: "body", weight: 2, value: 30, kind: "Station", group: "station",
    blurb: "Cut well enough that nobody asks who you are.",
    bonus: { approach: "presence", value: 1, situation: "nobles and merchants" }
  },
  {
    name: "Signet Ring", slot: "fingers", weight: 0, value: 60, kind: "Station", group: "station",
    blurb: "A house, a seal, and somebody who will answer for you.",
    bonus: { approach: "presence", value: 1, situation: "where your house is known" }
  },
  {
    name: "Pilgrim's Token", slot: "neck", weight: 0, value: 3, kind: "Power", group: "power",
    blurb: "Tin, stamped at a shrine. Worth nothing and proof of everything.",
    bonus: { approach: "lore", value: 1, situation: "matters of one named faith" }
  },
  {
    name: "Marching Boots", slot: "feet", weight: 1, value: 12, kind: "Make", group: "make",
    blurb: "Nailed soles. Rubble and mud stop being a decision.",
    text: "Difficult ground costs you 1 instead of 2."
  },

  /* ---- tools: the eight documented since the first draft, plus two ----------
   * None of these existed in the system, and the reason was the schema rather than neglect: the
   * item bonus field was combat-verb shaped only, so "Shadow +2 on locks" could not be written
   * down. They carry the only examples of the Tool, Station and Power bonus groups (core-rules 5).
   */
  {
    name: "Lockpicks", slot: "belt", weight: 0, value: 25, kind: "Tool", group: "tool",
    blurb: "A roll of picks and a torsion wrench, in oiled cloth.",
    bonus: { approach: "shadow", value: 2, situation: "locks and mechanisms" }
  },
  {
    name: "Climbing Rope", slot: "pack", weight: 3, value: 5, kind: "Tool", group: "tool",
    blurb: "Fifty feet of hemp. Nobody falls alone.",
    bonus: { approach: "might", value: 1, situation: "climbing" }
  },
  {
    name: "Healer's Kit", slot: "pack", weight: 2, value: 20, kind: "Tool", group: "tool",
    blurb: "Needle, gut, lint and spirit.",
    bonus: { approach: "lore", value: 2, situation: "treating wounds; removes 1 Wound on a Normal 5" }
  },
  {
    name: "Repair Kit", slot: "pack", weight: 3, value: 30, kind: "Tool", group: "tool",
    blurb: "Files, rivets, pitch and wire. What acid leaves behind is work, not loss.",
    bonus: { approach: "lore", value: 2, situation: "repairs; overnight it clears 1 Corrode" }
  },
  {
    name: "Hunting Traps", slot: "pack", weight: 4, value: 15, kind: "Tool", group: "tool",
    blurb: "Jaws and a stake. Patience, mostly.",
    bonus: { approach: "wits", value: 1, situation: "tracking and trapping animals" }
  },
  {
    name: "Lantern", slot: "hands", hands: 1, weight: 2, value: 5, kind: "Tool", group: "tool",
    // Shadowed squares are now defined (core-rules 11) and a whole school reads them, so a lantern
    // is an answer to a Shadow mage -- which a 5-gold item should not be by accident.
    blurb: "Horn panes and a tallow dip. The squares it lights are not shadowed.",
    bonus: { approach: "wits", value: 1, situation: "anything you need to see in the dark" }
  },
  {
    name: "The Kit", slot: "pack", weight: 3, value: 0, kind: "Tool", group: "tool",
    blurb: "A burglar's whole trade in a roll of canvas, and they never put it down.",
    bonus: { approach: "shadow", value: 2, situation: "every Hard physical obstacle counts as Normal" }
  },
  {
    name: "Holy Symbol", slot: "hands", hands: 1, weight: 0, value: 10, kind: "Power", group: "power",
    blurb: "Whose, and how openly, is the only question that matters in Firma.",
    bonus: { approach: "lore", value: 1, situation: "religion and undead" }
  },
  {
    name: "Gaming Set", slot: "pack", weight: 1, value: 5, kind: "Station", group: "station",
    blurb: "Dice, a board and a cup. Soldiers will tell a stranger anything over it.",
    bonus: { approach: "presence", value: 1, situation: "soldiers, taverns, gamblers" }
  },
  {
    name: "Smith's Hammer", slot: "pack", weight: 2, value: 18, kind: "Make", group: "make",
    blurb: "A cross-pein and a sense of what metal wants.",
    bonus: { approach: "lore", value: 2, situation: "metalwork; repairs 1 Corrode overnight" }
  },

  /* ---- consumables: the Brewer's craft, and the cheap answer to a condition ---- */
  {
    name: "Antidote", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 35, kind: "Consumable", consumed: true,
    blurb: "Charcoal, milk thistle and something the brewer will not name.",
    verbs: { use: verb(2, { text: "Shake Off 2, Poisoned only" }) }
  },
  {
    name: "Flask of Ink", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable", "thrown"],
    weight: 0, value: 20, kind: "Consumable", consumed: true,
    blurb: "Cuttlefish black. It finds what is not there to be seen.",
    verbs: { use: verb(0, { range: 3, area: 1, areaKind: "blast", text: "ends Invisible in the area" }) }
  },
  {
    name: "Flask of Oil", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable", "thrown"],
    weight: 0, value: 10, kind: "Consumable", consumed: true,
    blurb: "Lamp oil, thrown low.",
    verbs: { use: verb(0, { range: 3, text: "Off-Balance (1), no save" }) }
  },
  {
    name: "Firepot", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable", "thrown"],
    weight: 1, value: 45, kind: "Consumable", consumed: true,
    blurb: "Pitch and naphtha in a clay shell. It keeps burning.",
    verbs: { use: verb(0, { range: 3, area: 1, areaKind: "blast", text: "Burning 1 (2)" }) }
  },
  {
    name: "Cleansing Draught", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 150, kind: "Consumable", consumed: true,
    // 150 gold on purpose: a cheap cure would make gold the counter to half the content.
    blurb: "A temple brews it and does not sell it gladly.",
    verbs: { use: verb(1, { text: "remove 1 Taint that is not bound" }) }
  },
  {
    name: "Caltrops", slot: "pack", tags: ["consumable"],
    weight: 2, value: 12, kind: "Consumable", consumed: true,
    blurb: "A handful of iron, however it lands.",
    verbs: { use: verb(0, { area: 2, text: "the area is difficult ground for the fight" }) }
  },

  /* ---- magic items: three crafts, three groups --------------------------------
   * worldinfo/Firma.md names the makers -- smiths make exceptional weapons and armour, jewellers
   * make magical jewellery, brewers make potions -- and they land on three bonus groups, two of
   * which had nothing in them at all (rules/equipment.md 9).
   */
  {
    name: "Fine Longsword", slot: "hands", fits: ["back"], hands: 1, tags: ["heavy", "melee"],
    weight: 2, value: 90, kind: "Make", group: "make",
    blurb: "A smith's mark near the hilt, and worth asking after.",
    verbs: { strike: verb(3), defend: verb(1) },
    bonus: { verb: "strike", value: 1 }
  },
  {
    name: "Masterwork Crossbow", slot: "hands", fits: ["back"], hands: 2, tags: ["ranged"],
    weight: 3, value: 300, kind: "Make", group: "make",
    // The best thing in the catalogue and not magic: it buys back the Ready.
    blurb: "A steel prod and a goat's-foot lever. It reloads in the hand.",
    verbs: { strike: verb(4, { range: 8, text: "ignores 1 armor; reloads on a free hand, not a Ready" }) }
  },
  {
    name: "Focus Pendant", slot: "neck", weight: 0, value: 400, kind: "Power", group: "power",
    blurb: "Jeweller's work. The stone is not the point; the setting is.",
    bonus: { verb: "cast", value: 1 }
  },
  {
    name: "Ring of the Open Hand", slot: "fingers", weight: 0, value: 600,
    kind: "Power", group: "power",
    // Answers a rule rather than a number: core-rules 4 says a spell needs a free hand.
    blurb: "Plain silver, worn thin. The gesture is already in it.",
    text: "You may Cast without a free hand."
  },
  {
    name: "Reliquary Band", slot: "fingers", weight: 0, value: 350, kind: "Power", group: "power",
    blurb: "A splinter of someone's finger under glass.",
    grants: { spellSlots: 1 }
  },
  {
    name: "Cloak of the Grey", slot: "cloak", weight: 1, value: 500, kind: "Wonder", group: "wonder",
    blurb: "It is the colour of whatever is behind it.",
    active: { text: "Become Invisible (1).", boundary: "combat" }
  },
  {
    name: "Amulet of the Mended Thread", slot: "neck", weight: 0, value: 800,
    kind: "Wonder", group: "wonder",
    // The First's miracle for sale: a god asks for a spell slot for ever, a jeweller for a rest.
    blurb: "A knotted thread in amber. The knot is tied, not drawn.",
    active: { text: "When you would drop to 0 Health, drop to 1 instead.", boundary: "longRest" }
  },
  {
    name: "Boots of the Long Step", slot: "feet", weight: 1, value: 450,
    kind: "Wonder", group: "wonder",
    blurb: "The soles are never quite worn in the same places twice.",
    active: { text: "Teleport to any square you can see within 6.", boundary: "combat" }
  },
  {
    name: "Helm of the Watchful", slot: "head", tags: ["armor"],
    weight: 2, value: 1500, kind: "Wonder", group: "wonder", armor: 1,
    // Passive is dearer than active (core-rules 4), and this is the proof: no Drain, no recharge,
    // nothing to remember, and it deletes a condition worth 4.0 points of win rate.
    blurb: "Nothing comes at you from a side you were not already watching.",
    text: "You are never surprised and cannot be Dazed."
  },
  {
    name: "The Quenched Blade", slot: "hands", fits: ["back"], hands: 1, tags: ["heavy", "melee"],
    weight: 2, value: 2000, kind: "Wonder", group: "wonder",
    blurb: "Quenched in something that is still angry about it.",
    verbs: { strike: verb(3, { text: "on a hit, Burning 1 (1)" }), defend: verb(1) }
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
/*  Formulas                                    */
/* -------------------------------------------- */

/**
 * Four Elemental formulas, and they are here for one reason: they are the combo mechanic running.
 * Rain sets the opening, and the other three read it in the three different ways a `when` clause is
 * allowed to (data/cards.mjs) -- more damage, a harder save, and nothing at all.
 *
 * Together they cost 6 spell slots, which is three times what a first Way of Mind node grants
 * (core-rules 4). That is the honest price of a combo and the reason slot progression is a reward
 * worth having: the pair is what the extra slots are FOR.
 */
export const FORMULAS = [
  {
    name: "Rain", strength: 2, kind: "formula", source: "Elemental Magic",
    description: "<p>A squall out of nothing, over three squares, and the water does not care who "
      + "it lands on. It is not an attack and nothing resists it.</p>",
    // No verb: a step with a condition and no verb IS the condition, and an opening never saves.
    effect: {
      range: 4, area: 3, areaKind: "blast",
      condition: "wet", duration: 1,
      text: "no damage"
    }
  },
  {
    name: "Lightning", strength: 2, kind: "formula", source: "Elemental Magic",
    description: "<p>Reads a Wet target two ways at once: harder to shrug off, and it hurts more. "
      + "Against a dry one it is still a Cast that tries to stun, which is the point &mdash; the "
      + "opening sharpens the card, it does not switch it on.</p>",
    effect: {
      verb: "cast", range: 4,
      condition: "stunned", duration: 1, resist: "lore", dc: 7,
      when: { needs: "wet", mod: 2, dc: 9 }
    }
  },
  {
    name: "Frost", strength: 1, kind: "formula", source: "Elemental Magic",
    description: "<p>One target, one round, no damage. Against a Wet target the water is already "
      + "there to freeze, so the save goes from Normal to Heroic and nothing else changes.</p>",
    effect: {
      range: 3,
      condition: "slowed", duration: 1, resist: "agility", dc: 5,
      when: { needs: "wet", dc: 9 }
    }
  },
  {
    name: "Scorch", strength: 1, kind: "formula", source: "Elemental Magic",
    description: "<p>Carries no combo clause at all, and is still the proof that an opening is not "
      + "always worth having: water and fire cancel, so a Wet target takes the Cast and sheds the "
      + "Burning. The interaction is on Burning, where the rules put it.</p>",
    effect: { verb: "cast", range: 4, condition: "burning", duration: 1 }
  }
];

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
