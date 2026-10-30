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
    verbs: { strike: verb(3, { ignores: 1, text: "ignores 1 armor" }) }
  },
  {
    name: "Warhammer", slot: "hands", fits: ["back"], hands: 1, tags: ["heavy", "melee"],
    weight: 3, value: 25, kind: "Weapon",
    blurb: "A beak on one side for the plate and a hammer on the other for the man in it.",
    verbs: { strike: verb(4, { ignores: 1, text: "ignores 1 armor" }) }
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
    verbs: { strike: verb(4, { ignores: 1, range: 8, text: "ignores 1 armor; Ready to reload" }) }
  },
  {
    name: "Heavy Crossbow", slot: "hands", hands: 2, tags: ["heavy", "ranged"],
    weight: 5, value: 120, kind: "Weapon",
    blurb: "Cranked with a windlass. It goes through a shield and the arm behind it.",
    verbs: { strike: verb(5, { ignores: 1, range: 10, text: "ignores 1 armor; Ready to reload" }) }
  },

  /* ---- firearms: matchlocks, and the reason plate stopped being worth its weight ---- */
  {
    name: "Matchlock Pistol", slot: "hands", fits: ["belt"], hands: 1, tags: ["ranged"],
    weight: 1, value: 70, kind: "Weapon",
    blurb: "One hand, so it goes beside a sword. A brace of them is two shots before a reload.",
    verbs: { strike: verb(3, { ignores: 2, range: 4, text: "ignores 2 armor; Ready to reload" }) }
  },
  {
    name: "Arquebus", slot: "hands", fits: ["back"], hands: 2, tags: ["heavy", "ranged"],
    weight: 4, value: 90, kind: "Weapon",
    blurb: "Loud, slow, and it does not care what you are wearing.",
    verbs: { strike: verb(5, { ignores: 2, range: 8, text: "ignores 2 armor; Ready to reload" }) }
  },
  {
    name: "Matchlock Musket", slot: "hands", hands: 2, tags: ["heavy", "ranged"],
    weight: 5, value: 150, kind: "Weapon",
    blurb: "A rest to fire it from and a minute to load it. Worth both.",
    verbs: { strike: verb(6, { ignores: 2, range: 12, text: "ignores 2 armor; Ready to reload" }) }
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
    verbs: { strike: verb(4, { ignores: 1, range: 8, text: "ignores 1 armor; reloads on a free hand, not a Ready" }) }
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
  },
  /* ---- smith and jeweller, two more each ---- */
  {
    name: "Balanced Dagger", slot: "hands", fits: ["belt"], hands: 1,
    tags: ["light", "melee", "thrown"],
    weight: 0, value: 70, kind: "Make", group: "make",
    blurb: "Weighted at the tang. It goes where you looked.",
    verbs: { strike: verb(3, { range: 5, text: "range 5 thrown" }) }
  },
  {
    name: "Proofed Mail", slot: "body", tags: ["armor"],
    weight: 9, value: 320, kind: "Make", group: "make", armor: 3,
    // Brigandine's armour at mail's weight, and no Sidestep penalty: that is the whole craft.
    blurb: "Tested against a bodkin at ten paces and dented, not pierced."
  },
  {
    name: "Warden's Seal", slot: "fingers", weight: 0, value: 500,
    kind: "Power", group: "power",
    blurb: "A tower in relief, worn smooth by thumbs that are not yours.",
    bonus: { verb: "defend", value: 1 }
  },

  /* ---- minor wonders: 50 to 150 gold ---------------------------------------
   * One mechanic each, and none of them changes a fight -- each changes one turn in it. The list
   * was generated from a coverage audit: fourteen mechanics in the rules had no item touching them
   * (rules/equipment.md 9.4).
   */
  {
    name: "Whetstone of the Last Edge", slot: "pack", weight: 1, value: 60,
    kind: "Wonder", group: "wonder",
    blurb: "It takes something back out of a blade that has given everything.",
    active: { text: "One Spent card returns to your discard.", boundary: "longRest" }
  },
  {
    name: "Tinker's Thimble", slot: "fingers", weight: 0, value: 80,
    kind: "Wonder", group: "wonder",
    blurb: "Brass, and far too small for whoever made it.",
    text: "Strain costs you one card fewer, to a minimum of 1."
  },
  {
    name: "Pilgrim's Shoes", slot: "feet", weight: 1, value: 90,
    kind: "Wonder", group: "wonder",
    blurb: "Worn by somebody who got where they were going.",
    text: "One extra rest token on every long rest."
  },
  {
    name: "Cracked Spyglass", slot: "pack", weight: 1, value: 150,
    kind: "Wonder", group: "wonder",
    blurb: "The crack does not matter. What you see through it has not happened yet.",
    text: "Foresee one extra type at the start of a fight."
  },

  /* ---- lesser wonders: 300 to 700 gold ---- */
  {
    name: "Quartermaster's Belt", slot: "belt", weight: 1, value: 300,
    kind: "Wonder", group: "wonder",
    blurb: "Everything hangs lighter on it. Nobody knows why and nobody asks twice.",
    grants: { carry: 15 }
  },
  {
    name: "Hollow Boots", slot: "feet", weight: 1, value: 350,
    kind: "Wonder", group: "wonder",
    blurb: "They sound like a far larger man coming.",
    active: { text: "Shove an adjacent enemy 2 squares.", boundary: "combat" }
  },
  {
    name: "Marked Arrowhead", slot: "belt", weight: 0, value: 350,
    kind: "Wonder", group: "wonder",
    // An opening is read by EVERYBODY's cards, so a party with no Shade can now set one.
    blurb: "It has not been fired. It does not need to be.",
    active: { text: "One enemy you can see is Marked (1).", boundary: "combat" }
  },
  {
    name: "Deep Pockets", slot: "cloak", weight: 1, value: 400,
    kind: "Wonder", group: "wonder",
    blurb: "More in them than went in, and never what you wanted.",
    grants: { deckMax: 2 }
  },
  {
    name: "Cairn Stone", slot: "pack", weight: 4, value: 450,
    kind: "Wonder", group: "wonder",
    blurb: "Set it down and the ground agrees to be taller.",
    text: "Set it down: its square is high ground for the rest of the fight."
  },
  {
    name: "Gorget of the Turned Blade", slot: "neck", weight: 1, value: 450,
    kind: "Wonder", group: "wonder",
    blurb: "Three old cuts in it, none of them deep.",
    active: { text: "Block 3 as a reaction.", boundary: "combat" }
  },
  {
    name: "Accuser's Ring", slot: "fingers", weight: 0, value: 500,
    kind: "Wonder", group: "wonder",
    blurb: "It is cold on the finger that points.",
    active: { text: "One enemy within 3 is Judged (1).", boundary: "combat" }
  },
  {
    name: "Beggar's Bowl", slot: "pack", weight: 1, value: 500,
    kind: "Wonder", group: "wonder",
    blurb: "Whatever is dropped in it stops being anybody's.",
    active: { text: "Lift Blessed or Cursed from anyone adjacent.", boundary: "longRest" }
  },
  {
    name: "Hourglass Charm", slot: "neck", weight: 0, value: 550,
    kind: "Wonder", group: "wonder",
    blurb: "The sand has not moved since you found it.",
    active: { text: "Swap your place in the initiative order with a willing ally.", boundary: "combat" }
  },
  {
    name: "Gambler's Coin", slot: "fingers", weight: 0, value: 600,
    kind: "Wonder", group: "wonder",
    blurb: "It lands how you need it to, which is not the same as how you want it to.",
    active: { text: "Read 3 on your own fate deck.", boundary: "combat" }
  },

  /* ---- greater wonders: 800 to 2000 gold ---- */
  {
    name: "Surgeon's Pin", slot: "neck", weight: 0, value: 900,
    kind: "Wonder", group: "wonder",
    blurb: "Silver, and it has closed worse than this.",
    active: { text: "Remove one Wound from an ally.", boundary: "longRest" }
  },
  {
    name: "Mantle of the Unburdened", slot: "cloak", weight: 1, value: 900,
    kind: "Wonder", group: "wonder",
    // The counterpart to Plate -- and the one item that would ruin an Ironclad, whose Signature
    // wants to be Overloaded. Loot that is wrong for a build is as good a find as loot that is right.
    blurb: "Everything you carry belongs to the cloak while you wear it.",
    text: "You are never Burdened or Overloaded, whatever you carry."
  },
  {
    name: "Reaver's Edge", slot: "hands", fits: ["back"], hands: 1, tags: ["heavy", "melee"],
    weight: 2, value: 1300, kind: "Wonder", group: "wonder",
    blurb: "It eats what it meets, slowly, and starts with the armour.",
    verbs: { strike: verb(4, { text: "on a Critical, Corrode 1" }) }
  },
  {
    name: "Crown of the Quiet Mind", slot: "head", weight: 1, value: 1400,
    kind: "Wonder", group: "wonder",
    blurb: "Thin gold. Nothing in your head hurries while it is on.",
    grants: { handSize: 1 }
  },
  {
    name: "Pact Iron", slot: "fingers", weight: 0, value: 1600,
    kind: "Wonder", group: "wonder",
    blurb: "Cold iron takes a debt and holds it for a while.",
    active: { text: "One Taint card is set aside for the rest of the fight.", boundary: "longRest" }
  },

  /* ---- relics: and what they take ------------------------------------------
   * Not much better than a greater wonder -- DIFFERENT, because each carries an obligation the GM
   * writes down and holds (leveling.md 4). An obligation in TEXT is the loosest rung and the right
   * one here: a sentence everyone can read is enough when the item is why they can read it.
   */
  {
    name: "Sessyfyn's Tear", slot: "neck", weight: 0, value: 3000,
    kind: "Relic", group: "wonder",
    // Charges the goddess's own obedience, which way-cards 3.5 asks of her priests.
    blurb: "Seawater that has not dried in four hundred years.",
    active: { text: "Any one fate draw on the field is drawn again.", boundary: "combat" },
    text: "Obligation: a permanent Miss AND a permanent Critical in your fate deck."
  },
  {
    name: "The Black Lantern", slot: "hands", hands: 1, weight: 2, value: 3500,
    kind: "Relic", group: "wonder",
    // The only item that makes the battlefield worse for everyone, which a Shadow mage wants and
    // nobody else does.
    blurb: "It is lit. You can tell because of how much less you can see.",
    text: "Every square within 3 is shadowed, your enemies' included. "
      + "Obligation: you may never carry any other light."
  },
  {
    name: "The Hungry Blade", slot: "hands", fits: ["back"], hands: 1, tags: ["heavy", "melee"],
    weight: 2, value: 4000, kind: "Relic", group: "wonder",
    // Punishes you for carrying it BADLY rather than for carrying it: free in the fights it is for.
    blurb: "It is not sharp. It does not need to be sharp.",
    verbs: { strike: verb(5, { text: "when it kills, heal 2" }) },
    text: "Obligation: a bound Taint the first round of each fight it does not kill."
  },
  {
    name: "The Pale Crown", slot: "head", weight: 1, value: 5000,
    kind: "Relic", group: "wonder",
    blurb: "Bone, and lighter than bone should be.",
    grants: { spellSlots: 2 },
    text: "Obligation: you may never wear armour, and nobody but you may heal you."
  },
  /* ---- potions: the Brewer's craft ---- */
  {
    name: "Tincture of the Clear Eye", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 30, kind: "Potion", consumed: true,
    blurb: "Cloudy, and it stings going down.",
    verbs: { use: verb(0, { text: "Shake Off 1 on anything" }) }
  },
  {
    name: "Potion of Stone", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 40, kind: "Potion", consumed: true,
    blurb: "Grit in the bottom of the flask, and it settles in you the same way.",
    verbs: { use: verb(0, { text: "for the fight you cannot be moved -- and your Move is 0" }) }
  },
  {
    name: "Brewer's Reserve", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 45, kind: "Potion", consumed: true,
    blurb: "The brewer keeps a cask of it back and will not say what is in it.",
    verbs: { use: verb(0, { text: "your next Cast is +2" }) }
  },
  {
    name: "Greater Healing Potion", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 150, kind: "Potion", consumed: true,
    blurb: "Twice the price of the ordinary sort and rather more than twice the work.",
    verbs: { use: verb(0, { text: "Heal 8" }) }
  },
  {
    name: "Potion of the Hare", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 55, kind: "Potion", consumed: true,
    blurb: "It tastes of running, which is not a taste anyone can describe.",
    verbs: { use: verb(0, { text: "for the fight your Move values are +2" }) }
  },
  {
    name: "Potion of the Bear", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 60, kind: "Potion", consumed: true,
    blurb: "Thick as honey. You will want both hands to lift the bottle.",
    verbs: { use: verb(0, { text: "for the scene, carry +20 kg and Might +2" }) }
  },
  {
    name: "Philtre of Borrowed Courage", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 65, kind: "Potion", consumed: true,
    blurb: "Somebody else's nerve, and they are not getting it back.",
    verbs: { use: verb(0, { text: "for the fight you cannot be Compelled" }) }
  },
  {
    name: "Potion of the Owl", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 70, kind: "Potion", consumed: true,
    blurb: "Your eyes do not change. What they are willing to see does.",
    verbs: { use: verb(0, { text: "for the fight no square is shadowed for you" }) }
  },
  {
    name: "Draught of Second Breath", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 90, kind: "Potion", consumed: true,
    blurb: "One swallow and your lungs believe the fight has just started.",
    verbs: { use: verb(0, { text: "Catch Breath without spending your turn" }) }
  },
  {
    name: "Potion of the Quick Hand", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 110, kind: "Potion", consumed: true,
    blurb: "You will have put the bottle down before you remember drinking it.",
    verbs: { use: verb(0, { text: "one extra reaction this round" }) }
  },
  {
    name: "Potion of Iron Skin", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 120, kind: "Potion", consumed: true,
    blurb: "It goes down like filings and sits there like a breastplate.",
    verbs: { use: verb(0, { text: "for the fight, armor +2" }) }
  },
  {
    name: "Elixir of the Long Night", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 200, kind: "Potion", consumed: true,
    blurb: "It lends. It is very clear about lending.",
    verbs: { use: verb(0, { text: "+6 temporary Health; it fades at your next rest" }) }
  },

  /* ---- magical ammunition (core-rules 4) ---- */
  {
    name: "Blunt Head", slot: "belt", tags: ["consumable"],
    weight: 0, value: 20, kind: "Ammunition", consumed: true,
    blurb: "No point at all, which is the point.",
    text: "Bow or crossbow. The target is Off-Balance (1). No save."
  },
  {
    name: "Bodkin Points", slot: "belt", tags: ["consumable"],
    weight: 0, value: 25, kind: "Ammunition", consumed: true,
    blurb: "A square spike, hardened. It is looking for a gap and will make one.",
    text: "Bow or crossbow. Ignores 2 armor."
  },
  {
    name: "Hollow Bolt", slot: "belt", tags: ["consumable"],
    weight: 0, value: 30, kind: "Ammunition", consumed: true,
    blurb: "The shaft unscrews. A fiddly, brilliant, disreputable idea.",
    text: "Crossbow. Carries one potion; whatever you hit drinks it."
  },
  {
    name: "Screaming Shaft", slot: "belt", tags: ["consumable"],
    weight: 0, value: 35, kind: "Ammunition", consumed: true,
    blurb: "Bored through so the air goes through it wrong.",
    text: "Bow. Dazed (1), resist Presence 5."
  },
  {
    name: "Chalked Shaft", slot: "belt", tags: ["consumable"],
    weight: 0, value: 40, kind: "Ammunition", consumed: true,
    blurb: "It leaves a smear that everyone can see and nobody can wipe off.",
    text: "Bow or crossbow. The target is Marked (1). No save."
  },
  {
    name: "Moth-wing Fletching", slot: "belt", tags: ["consumable"],
    weight: 0, value: 40, kind: "Ammunition", consumed: true,
    blurb: "It does not fly straight. It arrives anyway.",
    text: "Bow. This shot ignores cover entirely."
  },
  {
    name: "Oil-wrapped Shaft", slot: "belt", tags: ["consumable"],
    weight: 0, value: 45, kind: "Ammunition", consumed: true,
    blurb: "Tow and pitch below the head. Lit from the match in your teeth.",
    text: "Bow or crossbow. Burning 1 (2)."
  },
  {
    name: "Net Bolt", slot: "belt", tags: ["consumable"],
    weight: 0, value: 50, kind: "Ammunition", consumed: true,
    blurb: "A folded net on a blunt head. It opens in the air.",
    text: "Crossbow. Grappled (1), resist Might 5."
  },
  {
    name: "Whistling Shaft", slot: "belt", tags: ["consumable"],
    weight: 0, value: 55, kind: "Ammunition", consumed: true,
    blurb: "Whoever it passes becomes very interested in who sent it.",
    text: "Bow. The target is Compelled (1) -- at you."
  },
  {
    name: "Frost-dipped Bolt", slot: "belt", tags: ["consumable"],
    weight: 0, value: 60, kind: "Ammunition", consumed: true,
    blurb: "Cold enough that the quiver frosts around it.",
    text: "Crossbow. Frozen 1 (1)."
  },
  {
    name: "Grapnel Bolt", slot: "belt", tags: ["consumable"],
    weight: 0, value: 70, kind: "Ammunition", consumed: true,
    blurb: "Barbed, with fifty feet of silk line. A bolt for closing.",
    text: "Crossbow. YOU are pulled to a square adjacent to the target."
  },
  {
    name: "Thunder-shot", slot: "belt", tags: ["consumable"],
    weight: 0, value: 80, kind: "Ammunition", consumed: true,
    blurb: "A paper cartridge of scrap. Nothing else gives a non-caster an area.",
    text: "Firearm only. The shot is Blast 1 on the target's square."
  },
  {
    name: "Silvered Head", slot: "belt", tags: ["consumable"],
    weight: 0, value: 90, kind: "Ammunition", consumed: true,
    blurb: "Silver remembers what it was aimed at.",
    text: "Bow or crossbow. You may target an Invisible enemy you have seen this fight."
  },

  /* ---- the conditions no item could inflict ---- */
  {
    name: "Loose Cobble", slot: "pack", weight: 4, value: 300,
    kind: "Wonder", group: "wonder",
    // Not a Drain, and the cheapest here, because it is a trap: set it down and that is the item.
    // The Trapmaker's Set without the Trapmaker -- a mechanic, not a Signature.
    blurb: "It was part of a street once and has not forgiven anyone.",
    text: "Set it down. The first enemy to enter its square is Off-Balance (1)."
  },
  {
    name: "Drowned Bell", slot: "belt", weight: 2, value: 400,
    kind: "Wonder", group: "wonder",
    blurb: "It rings wet. There is no water in it.",
    active: { text: "Everything within 2 is Wet (1).", boundary: "combat" }
  },
  {
    name: "Hooked Gauntlet", slot: "hands", hands: 1, weight: 2, value: 600,
    kind: "Wonder", group: "wonder",
    blurb: "Three hooks along the knuckle, set the wrong way round.",
    active: { text: "An adjacent enemy is Disarmed (1), resist Might 5.", boundary: "combat" }
  },
  {
    name: "Thunderstone", slot: "pack", weight: 1, value: 650,
    kind: "Wonder", group: "wonder",
    blurb: "Throw it down hard. Do not be holding it.",
    active: { text: "One enemy within 3 is Stunned (1), resist Might 7.", boundary: "combat" }
  },
  {
    name: "Gag of the Nine", slot: "neck", weight: 0, value: 700,
    kind: "Wonder", group: "wonder",
    // Silenced is the only condition that can empty a turn, and only a caster's. A Drain at range 3
    // is a specific answer to enemy magic; two of these should not silence everybody.
    blurb: "Nine knots in a cord. Somebody counted them out loud, once.",
    active: { text: "One enemy within 3 is Silenced (1), resist Lore 5.", boundary: "combat" }
  },
  {
    name: "Winter Cloak", slot: "cloak", weight: 2, value: 750,
    kind: "Wonder", group: "wonder",
    blurb: "The hem is always a little frozen, in any season.",
    active: { text: "Everything adjacent to you is Slowed (1).", boundary: "combat" }
  },
  {
    name: "Serpent's Tooth Ring", slot: "fingers", weight: 0, value: 850,
    kind: "Wonder", group: "wonder",
    blurb: "A fang set as a stone, still wet at the root.",
    active: { text: "One adjacent enemy is Poisoned 1 (2).", boundary: "combat" }
  },

  /* ---- the systems still untouched ---- */
  {
    name: "Locked Casket", slot: "pack", weight: 3, value: 500,
    kind: "Wonder", group: "wonder",
    blurb: "No hinge, no seam, and a keyhole that is not for a key.",
    text: "Holds one secret. Nobody but you may learn it, by any means."
  },
  {
    name: "Surveyor's Chain", slot: "pack", weight: 2, value: 600,
    kind: "Wonder", group: "wonder",
    blurb: "Sixty-six feet of brass links that measure what matters rather than what is there.",
    text: "In a challenge, your first Progress each scene is free."
  },
  {
    name: "Far-sight Monocle", slot: "head", weight: 0, value: 700,
    kind: "Wonder", group: "wonder",
    blurb: "Ground by somebody who had opinions about distance.",
    text: "Your Ranged items' range is doubled."
  },
  {
    name: "Mnemonic Stone", slot: "fingers", weight: 0, value: 800,
    kind: "Wonder", group: "wonder",
    blurb: "Worn smooth by a thumb that was trying to remember something.",
    text: "One extra skill card in your skill deck, of any approach you already have."
  },
  {
    name: "Vagrant's Charm", slot: "neck", weight: 0, value: 950,
    kind: "Wonder", group: "wonder",
    // Exhausted is the one state that is nobody's fault: it comes from an empty draw pile and
    // cannot be resisted, and until now nothing answered it but a Catch Breath.
    blurb: "A knot of road-dust and hair. Its owner never sat down.",
    text: "You are never Exhausted."
  },
  {
    name: "Discriminating Wand", slot: "hands", hands: 1, tags: ["arcane"],
    weight: 0, value: 1100, kind: "Wonder", group: "wonder",
    // Section 11: "Aimed belongs on precise or discriminating magic, and should cost more."
    blurb: "It knows whose side everyone is on, which is more than most people do.",
    text: "Your Blasts count as Aimed."
  },
  {
    name: "The Scrivener's Knife", slot: "pack", weight: 0, value: 1200,
    kind: "Wonder", group: "wonder",
    // The only item that touches deck-building mid-campaign, and a rope to hang yourself with: a
    // 12-card deck pruned well matches a full 16 and pruned badly collapses to 45%.
    blurb: "For cutting out what should not have been written.",
    active: { text: "Prune one card from your action deck for the rest of the day.", boundary: "longRest" }
  },
  {
    name: "The Unquiet Quiver", slot: "back", weight: 2, value: 4500,
    kind: "Relic", group: "wonder",
    // Worth exactly as much as the ammunition you own: a bare quiver is 4500 gold of nothing.
    blurb: "It rattles when there is nothing in it.",
    text: "Every piece of magical ammunition you fire returns to it when the fight ends. "
      + "Obligation: it will not hold ordinary arrows, and you may carry no other quiver."
  },
  /* ---- cursed items (rules/equipment.md 11.4) ---- */
  {
    name: "Blade of the Eager Hand", slot: "hands", fits: ["back"], hands: 1,
    tags: ["heavy", "melee"],
    weight: 2, value: 0, kind: "Wonder", group: "wonder",
    identified: false, unidentifiedName: "an old sword, very sharp",
    // Loud rather than hidden: a greatsword in one hand, and you cannot choose your target. Nearly
    // free for somebody fighting alone, which is the most interesting thing a curse can be.
    blurb: "It wants to be swung and it is not fussy about at what.",
    verbs: { strike: verb(5) },
    curse: "You must Strike the nearest living creature every turn, ally or not. Lifted by a Cleansing."
  },
  {
    name: "Ring of Open Hands", slot: "fingers", weight: 0, value: 0,
    kind: "Power", group: "power",
    identified: false, unidentifiedName: "a plain silver ring",
    blurb: "Almost the ring you were hoping for.",
    text: "You may Cast without a free hand.",
    curse: "You may never hold anything in your other hand again. Lifted by the jeweller who made it, who is dead."
  },
  {
    name: "Cloak of the Grey Road", slot: "cloak", weight: 1, value: 0,
    kind: "Wonder", group: "wonder",
    identified: false, unidentifiedName: "a grey travelling cloak",
    blurb: "The road is grey. So is everything you are now to your friends.",
    active: { text: "Become Invisible (1).", boundary: "combat" },
    curse: "Allies may not target you with anything beneficial either. Lifted by a cure."
  },
  {
    name: "Boots of the Longer Step", slot: "feet", weight: 1, value: 0,
    kind: "Wonder", group: "wonder",
    identified: false, unidentifiedName: "good boots, barely worn",
    // A curse should punish a BUILD, not a player: these are a disaster for a Trapmaker or an
    // Artillerist, whose whole tactic is standing still.
    blurb: "They were barely worn because their owner could not stop.",
    text: "Your Move values are +2.",
    curse: "You may never end your turn in the square you began it in. Lifted by walking a pilgrimage barefoot."
  },
  {
    name: "Amulet of the Fed Thread", slot: "neck", weight: 0, value: 0,
    kind: "Wonder", group: "wonder",
    identified: false, unidentifiedName: "a knotted thread in amber",
    blurb: "The thread is mended. Something had to pay out the length.",
    active: { text: "When you would drop to 0 Health, drop to 1 instead.", boundary: "longRest" },
    curse: "Each time it saves you, one ally takes 3 damage. Lifted by dying anyway."
  },
  {
    name: "Gauntlet of the Open Palm", slot: "hands", hands: 1, tags: ["armor"],
    weight: 2, value: 0, kind: "Wonder", group: "wonder",
    identified: false, unidentifiedName: "a fine plated gauntlet",
    blurb: "Beautifully made, and it will not close.",
    bonus: { verb: "defend", value: 1 },
    curse: "You may not hold a weapon in that hand. Lifted by a Cleansing."
  },

  /* ---- bad potions: what an unidentified bottle might be ---- */
  {
    name: "Grey Water", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 5, kind: "Potion", consumed: true,
    identified: false, unidentifiedName: "a dark bottle",
    blurb: "Somebody corked it carefully, which is the cruellest part.",
    verbs: { use: verb(0, { text: "Nothing at all. It is water." }) }
  },
  {
    name: "Philtre of the Loose Tongue", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 15, kind: "Potion", consumed: true,
    identified: false, unidentifiedName: "a dark bottle",
    blurb: "You will mean to stop talking.",
    verbs: { use: verb(0, { text: "you must say what you intend before each of your turns" }) }
  },
  {
    name: "Draught of Lead", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 20, kind: "Potion", consumed: true,
    identified: false, unidentifiedName: "a dark bottle",
    blurb: "Heavier than it looks, and so are you now.",
    verbs: { use: verb(0, { text: "for the fight your Move is 0" }) }
  },
  {
    name: "Oil of Mislaid Courage", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 20, kind: "Potion", consumed: true,
    identified: false, unidentifiedName: "a dark bottle",
    blurb: "Whatever was going to make you flinch has been taken out.",
    verbs: { use: verb(0, { text: "for the fight you may play no reactions" }) }
  },
  {
    name: "Draught of the Hollow", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 25, kind: "Potion", consumed: true,
    identified: false, unidentifiedName: "a dark bottle",
    blurb: "It empties something you were not keeping track of.",
    verbs: { use: verb(0, { text: "for the fight your hand size is 1 lower" }) }
  },
  {
    name: "Bottle of Borrowed Pain", slot: "belt", fits: ["hands"], hands: 1, tags: ["consumable"],
    weight: 0, value: 30, kind: "Potion", consumed: true,
    identified: false, unidentifiedName: "a dark bottle",
    blurb: "It does not heal you. It postpones you.",
    verbs: { use: verb(0, { text: "Heal 4 -- and take 4 when the fight ends" }) }
  },

  /* ---- poisons, applied with a Ready ---- */
  {
    name: "Blade Venom", slot: "belt", tags: ["consumable"],
    weight: 0, value: 40, kind: "Poison", consumed: true,
    blurb: "Brewed from something that was already unpleasant.",
    text: "Apply with a Ready. Next Strike that hits: Poisoned 1 (2), resist Might 5."
  },
  {
    name: "Drowsing Oil", slot: "belt", tags: ["consumable"],
    weight: 0, value: 50, kind: "Poison", consumed: true,
    blurb: "It does not kill. It makes a man slow about objecting.",
    text: "Apply with a Ready. Next Strike that hits: Dazed (2), resist Might 5."
  },
  {
    name: "Weeping Resin", slot: "belt", tags: ["consumable"],
    weight: 0, value: 60, kind: "Poison", consumed: true,
    blurb: "The wound will not close while it is in there.",
    text: "Apply with a Ready. Next Strike that hits: the target cannot be healed for 2 rounds. No save."
  },
  {
    name: "Serpent's Milk", slot: "belt", tags: ["consumable"],
    weight: 0, value: 70, kind: "Poison", consumed: true,
    blurb: "Milked, strained and kept cold. No damage in it at all.",
    text: "Apply with a Ready. Next Strike that hits: Poisoned 0 (3) -- no damage, three rounds without a secondary."
  },
  {
    name: "Grave-cap Extract", slot: "belt", tags: ["consumable"],
    weight: 0, value: 90, kind: "Poison", consumed: true,
    blurb: "The cap grows on what is under the cairn, not on the cairn.",
    text: "Apply with a Ready. Next Strike that hits: Poisoned 2 (2), resist Might 7."
  },
  {
    name: "Assassin's Tincture", slot: "belt", tags: ["consumable"],
    weight: 0, value: 120, kind: "Poison", consumed: true,
    blurb: "They finish the sentence they were saying.",
    text: "Apply with a Ready. Next Strike that hits: Poisoned 1 (2), beginning at the start of their next turn. No save."
  },
  {
    name: "Black Lotus", slot: "belt", tags: ["consumable"],
    weight: 0, value: 250, kind: "Poison", consumed: true,
    blurb: "Illegal in every district, which is how you know the price is right.",
    text: "Apply with a Ready. Next Strike that hits: Poisoned 3 (2), resist Might 9."
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
