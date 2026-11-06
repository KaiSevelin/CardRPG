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
export function fateCards(back = "") {
  const cards = [];
  const push = (name, system, n) => {
    for (let i = 0; i < n; i++) {
      /* A fate card's back is the one a table sees most: the deck is face down by design, and
       * that is what makes a thin one a risk rather than a lookup (core-rules 6). */
      cards.push({
        name, type: "fate", face: 0, faces: [{ name }],
        ...(back ? { back: { img: back } } : {}),
        system
      });
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
/*  Transformations                             */
/* -------------------------------------------- */

/**
 * **A transformation is a set of cards added and a set of your own taken away.**
 *
 * Two halves, and the second is the one that makes it a transformation rather than a bonus. A form
 * that only ADDS is a costume: you become a bird and keep your sword. So each one names what it
 * gives and what it takes, and a `shape` step names the transformation.
 *
 * **`grants`** is content by name -- items and features become slates on the actor, cards are dealt
 * into the action deck -- and every name is checked against the tables, because a form that grants
 * a card nobody wrote is a form that silently gives nothing.
 *
 * **What it COSTS is on the card**, in the `shape` step's own `quarantine` -- a filter of the
 * player's items, features and cards that go out of play while the form is worn. It lives there
 * rather than here because that is where it can be edited: `content.mjs` is a source file and
 * nothing in Foundry writes to it.
 *
 * What is quarantined is **taken off the actor and kept**, not flagged. More than ten places read a
 * slate, and a flag would have to be respected by all of them.
 */
export const TRANSFORMATIONS = [
  {
    /**
     * **[PLACEHOLDER]** One transformation, so the mechanism is exercised by content as well as
     * declared. The Doomfly is in the roster and it flies, which is the clearest thing a borrowed
     * body can be worth; replace it freely.
     *
     * `Nip` is what you have instead of hands. **What it costs is on the card**, not here: the
     * quarantine is a field on the `shape` step so that a GM can tick it, and so that a greater
     * version of the same borrowed body can be gentler about what you drop.
     */
    name: "Doomfly",
    blurb: "Four wings and a mouth.",
    grants: { items: ["Nip"], features: [], cards: [] }
  }
];

/* -------------------------------------------- */
/*  Minor gods                                  */
/* -------------------------------------------- */

/**
 * **The eight minor gods the world names**, which is what a conjuration may call by name.
 *
 * Firma.md is unusually specific about these and the specificity is the point: *unlike the other
 * gods, the minor gods demonstrably exist* -- a hundred or so nature spirits and beings forced into
 * isolated places and underground by Athor's conquest. They *grant no miracles, but they are the
 * basis of the Spiritualism school*, so a spell that calls one is not a prayer. It is a
 * negotiation with somebody who is actually there.
 *
 * Eight of a hundred or so, which is what the document gives. The rest are absent because the
 * document does not name them, and `name: ""` on a conjuration already means *the GM decides*.
 *
 * Fahlas appears twice in the world and deliberately so: he is the necromancer king of Saag et
 * Haar who *has lived 400 years and become a minor god*, which makes him the one entry here that
 * a party might also meet as a ruler.
 */
export const MINOR_GODS = [
  { name: "The Winter Lady", note: "the Silent are her cult" },
  { name: "Queen of the Dark", note: "" },
  { name: "The Troll King", note: "essentially all trolls follow him" },
  { name: "Baal Fagor", note: "the Soot Club try to summon him" },
  { name: "The Land Jelly", note: "the Dancers use drugs to speak with it" },
  { name: "The Cat God", note: "" },
  { name: "Fahlas", note: "the necromancer king of Saag et Haar, 400 years old" },
  { name: "Mother Longhand", note: "" }
];

/* -------------------------------------------- */
/*  Slates                                      */
/* -------------------------------------------- */

import { applyVariant } from "./monsters.mjs";

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
    name: "Shortbow", ammo: "bow", slot: "hands", fits: ["back"], hands: 2, tags: ["ranged"],
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
    verbs: { strike: verb(4, { reach: 2, text: "reach 2" }) }
  },
  {
    name: "Pike", slot: "hands", hands: 2, tags: ["heavy", "melee"],
    weight: 4, value: 20, kind: "Weapon",
    // Useless adjacent is the price of reach 3: a pikeman wants somebody in front of them, which
    // is the whole of a formation.
    blurb: "Eighteen feet. Magnificent in a line and worthless on your own.",
    verbs: { strike: verb(3, { reach: 3, reachMin: 2, text: "reach 3; useless adjacent" }) }
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
    verbs: { strike: verb(3, { reach: 2, text: "reach 2" }) }
  },
  {
    name: "Net", slot: "hands", fits: ["belt"], hands: 1, tags: ["light", "thrown"],
    weight: 1, value: 5, kind: "Weapon",
    blurb: "Weighted at the edges. The other half of a trident.",
    verbs: { strike: verb(0, { range: 3, text: "Grappled (1), resist Might 5" }) }
  },

  /* ---- bows and crossbows ---- */
  {
    name: "Longbow", ammo: "bow", slot: "hands", fits: ["back"], hands: 2, tags: ["heavy", "ranged"],
    weight: 2, value: 50, kind: "Weapon",
    // The longbow's whole argument against a crossbow that hits harder: it fires every turn.
    blurb: "A yew stave taller than the archer. No reload -- that is what you are buying.",
    verbs: { strike: verb(3, { range: 10 }) }
  },
  {
    name: "Crossbow", ammo: "crossbow", slot: "hands", fits: ["back"], hands: 2, tags: ["ranged"],
    weight: 3, value: 60, kind: "Weapon",
    blurb: "Anyone can be taught one in a week, which is why lords dislike them.",
    verbs: { strike: verb(4, { ignores: 1, range: 8, text: "ignores 1 armor; Ready to reload" }) }
  },
  {
    name: "Heavy Crossbow", ammo: "crossbow", slot: "hands", hands: 2, tags: ["heavy", "ranged"],
    weight: 5, value: 120, kind: "Weapon",
    blurb: "Cranked with a windlass. It goes through a shield and the arm behind it.",
    verbs: { strike: verb(5, { ignores: 1, range: 10, text: "ignores 1 armor; Ready to reload" }) }
  },

  /* ---- firearms: matchlocks, and the reason plate stopped being worth its weight ---- */
  {
    name: "Matchlock Pistol", ammo: "firearm", slot: "hands", fits: ["belt"], hands: 1, tags: ["ranged"],
    weight: 1, value: 70, kind: "Weapon",
    blurb: "One hand, so it goes beside a sword. A brace of them is two shots before a reload.",
    verbs: { strike: verb(3, { ignores: 2, range: 4, text: "ignores 2 armor; Ready to reload" }) }
  },
  {
    name: "Arquebus", ammo: "firearm", slot: "hands", fits: ["back"], hands: 2, tags: ["heavy", "ranged"],
    weight: 4, value: 90, kind: "Weapon",
    blurb: "Loud, slow, and it does not care what you are wearing.",
    verbs: { strike: verb(5, { ignores: 2, range: 8, text: "ignores 2 armor; Ready to reload" }) }
  },
  {
    name: "Matchlock Musket", ammo: "firearm", slot: "hands", hands: 2, tags: ["heavy", "ranged"],
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
    blocksReactions: ["sidestep"],
    text: "Blocks Sidestep reactions."
  },
  {
    name: "Plate", slot: "body", tags: ["armor", "heavy"],
    weight: 20, value: 400, kind: "Armor", armor: 4,
    // Half a 40 kg allowance: Plate is a bet that nothing will out-range you.
    blurb: "Half your carry allowance, and nothing short of a ball goes through it.",
    blocksReactions: ["sidestep"],
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
    bonus: { approach: "shadow", value: 2, training: "lockpicks",
      situation: "locks and mechanisms" }
  },
  {
    name: "Climbing Rope", slot: "pack", weight: 3, value: 5, kind: "Tool", group: "tool",
    blurb: "Fifty feet of hemp. Nobody falls alone.",
    bonus: { approach: "might", value: 1, situation: "climbing" }
  },
  {
    name: "Healer's Kit", slot: "pack", weight: 2, value: 20, kind: "Tool", group: "tool",
    blurb: "Needle, gut, lint and spirit.",
    bonus: { approach: "lore", value: 2, training: "treating wounds",
      situation: "treating wounds; removes 1 Wound on a Normal 5" }
  },
  {
    name: "Repair Kit", slot: "pack", weight: 3, value: 30, kind: "Tool", group: "tool",
    blurb: "Files, rivets, pitch and wire. What acid leaves behind is work, not loss.",
    bonus: { approach: "lore", value: 2, training: "armour and its repair",
      situation: "repairs; overnight it clears 1 Corrode" }
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
    bonus: { approach: "shadow", value: 2, training: "lockpicks",
      situation: "every Hard physical obstacle counts as Normal" }
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
    bonus: { approach: "lore", value: 2, training: "armour and its repair",
      situation: "metalwork; repairs 1 Corrode overnight" }
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
    name: "Masterwork Crossbow", ammo: "crossbow", slot: "hands", fits: ["back"], hands: 2, tags: ["ranged"],
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
    ammoFor: ["bow", "crossbow"],
    shot: { condition: "offBalance", duration: 1 },
    blurb: "No point at all, which is the point.",
    text: "Bow or crossbow. The target is Off-Balance (1). No save."
  },
  {
    name: "Bodkin Points", slot: "belt", tags: ["consumable"],
    weight: 0, value: 25, kind: "Ammunition", consumed: true,
    ammoFor: ["bow", "crossbow"],
    // The only piece that is a number rather than a condition, and it adds to the
    // weapon's own: a bodkin on a crossbow ignores 3 between them.
    shot: { ignores: 2 },
    blurb: "A square spike, hardened. It is looking for a gap and will make one.",
    text: "Bow or crossbow. Ignores 2 armor."
  },
  {
    name: "Hollow Bolt", slot: "belt", tags: ["consumable"],
    weight: 0, value: 30, kind: "Ammunition", consumed: true,
    ammoFor: ["crossbow"],
    shotEffect: "carriesPotion",
    blurb: "The shaft unscrews. A fiddly, brilliant, disreputable idea.",
    text: "Crossbow. Carries one potion; whatever you hit drinks it."
  },
  {
    name: "Screaming Shaft", slot: "belt", tags: ["consumable"],
    weight: 0, value: 35, kind: "Ammunition", consumed: true,
    ammoFor: ["bow"],
    shot: { condition: "dazed", duration: 1, resist: "presence", dc: 5 },
    blurb: "Bored through so the air goes through it wrong.",
    text: "Bow. Dazed (1), resist Presence 5."
  },
  {
    name: "Chalked Shaft", slot: "belt", tags: ["consumable"],
    weight: 0, value: 40, kind: "Ammunition", consumed: true,
    ammoFor: ["bow", "crossbow"],
    shot: { condition: "marked", duration: 1 },
    blurb: "It leaves a smear that everyone can see and nobody can wipe off.",
    text: "Bow or crossbow. The target is Marked (1). No save."
  },
  {
    name: "Moth-wing Fletching", slot: "belt", tags: ["consumable"],
    weight: 0, value: 40, kind: "Ammunition", consumed: true,
    ammoFor: ["bow"],
    shotEffect: "ignoresCover",
    blurb: "It does not fly straight. It arrives anyway.",
    text: "Bow. This shot ignores cover entirely."
  },
  {
    name: "Oil-wrapped Shaft", slot: "belt", tags: ["consumable"],
    weight: 0, value: 45, kind: "Ammunition", consumed: true,
    ammoFor: ["bow", "crossbow"],
    shot: { condition: "burning", duration: 2, intensity: 1 },
    blurb: "Tow and pitch below the head. Lit from the match in your teeth.",
    text: "Bow or crossbow. Burning 1 (2)."
  },
  {
    name: "Net Bolt", slot: "belt", tags: ["consumable"],
    weight: 0, value: 50, kind: "Ammunition", consumed: true,
    ammoFor: ["crossbow"],
    shot: { condition: "grappled", duration: 1, resist: "might", dc: 5 },
    blurb: "A folded net on a blunt head. It opens in the air.",
    text: "Crossbow. Grappled (1), resist Might 5."
  },
  {
    name: "Whistling Shaft", slot: "belt", tags: ["consumable"],
    weight: 0, value: 55, kind: "Ammunition", consumed: true,
    ammoFor: ["bow"],
    shot: { condition: "compelled", duration: 1 },
    blurb: "Whoever it passes becomes very interested in who sent it.",
    text: "Bow. The target is Compelled (1) -- at you."
  },
  {
    name: "Frost-dipped Bolt", slot: "belt", tags: ["consumable"],
    weight: 0, value: 60, kind: "Ammunition", consumed: true,
    ammoFor: ["crossbow"],
    shot: { condition: "frozen", duration: 1, intensity: 1 },
    blurb: "Cold enough that the quiver frosts around it.",
    text: "Crossbow. Frozen 1 (1)."
  },
  {
    name: "Grapnel Bolt", slot: "belt", tags: ["consumable"],
    weight: 0, value: 70, kind: "Ammunition", consumed: true,
    ammoFor: ["crossbow"],
    shotEffect: "pullsShooter",
    blurb: "Barbed, with fifty feet of silk line. A bolt for closing.",
    text: "Crossbow. YOU are pulled to a square adjacent to the target."
  },
  {
    name: "Thunder-shot", slot: "belt", tags: ["consumable"],
    weight: 0, value: 80, kind: "Ammunition", consumed: true,
    ammoFor: ["firearm"],
    // The one area a non-caster can buy, so it is the step fields rather than a hook.
    shot: { area: 1, areaKind: "blast" },
    blurb: "A paper cartridge of scrap. Nothing else gives a non-caster an area.",
    text: "Firearm only. The shot is Blast 1 on the target's square."
  },
  {
    name: "Silvered Head", slot: "belt", tags: ["consumable"],
    weight: 0, value: 90, kind: "Ammunition", consumed: true,
    ammoFor: ["bow", "crossbow"],
    shotEffect: "seesInvisible",
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

/**
 * NPC gear, tuned separately from player gear (core-rules 9). A Goblin Spear and a player's spear
 * can share a name and differ in value: an NPC's weapon is the knob that sets how dangerous it is.
 *
 * Both are Strike 3, which is the rule in practice -- keep a weak enemy at least 2 above the
 * heroes' armor, or flat armor cancels its hits rather than reducing them.
 */
export const NPC_GEAR = [
  /* A demon casts through the mark it was bound or banished with, which is the only part of the
   * Third Side it brings across with it. */
  {
    name: "Demon's Sigil", slot: "hands", hands: 1, tags: ["arcane"],
    weight: 0, value: 0, npcGear: true, kind: "Focus",
    verbs: { cast: verb(5, { range: 5 }) }
  },
  /* What a cultist of a local god casts through. The districts are full of small gods and every
   * one of them has a figure somebody carved badly. */
  {
    name: "Carved Idol", slot: "hands", hands: 1, tags: ["arcane"],
    weight: 1, value: 0, npcGear: true, kind: "Focus",
    verbs: { cast: verb(3, { range: 4 }) }
  },
  /* A trollkin's stick is gear rather than natural: it was picked up, and it can be taken away. */
  {
    name: "Troll Club", slot: "hands", fits: ["back"], hands: 1, tags: ["melee", "heavy"],
    weight: 3, value: 0, npcGear: true, kind: "Weapon",
    verbs: { strike: verb(4) }
  },
  /*
   * **The Tarnkappe is gear on purpose, because the folklore is a mechanic.**
   *
   * The German Alp wears a small grey cap and the stories agree on what follows: take the cap and
   * you take the Alp's power, and it will beg for it back. That is a lootable item with an active
   * on it, not a line of description -- so it is one here, and it is the only piece of NPC gear in
   * the game whose loss matters more to the creature than to the party.
   */
  {
    name: "Tarnkappe", slot: "head", weight: 0, value: 0, npcGear: true, kind: "Wonder",
    group: "wonder",
    blurb: "A small grey cap, greasy with age. The Alp will want it back.",
    active: { text: "Become Invisible (1).", boundary: "combat" }
  },
  /* A shade has no hands to speak of; what it casts through is the light at a grave. */
  {
    name: "Grave Candle", slot: "hands", hands: 1, tags: ["arcane"],
    weight: 0, value: 0, npcGear: true, kind: "Focus",
    verbs: { cast: verb(4, { range: 4 }) }
  },
  {
    name: "Goblin Spear", slot: "hands", fits: ["back"], hands: 1, tags: ["melee"],
    weight: 2, value: 0, npcGear: true, kind: "Weapon",
    verbs: { strike: verb(3) }
  },
  {
    name: "Goblin Shortbow", ammo: "bow", slot: "hands", fits: ["back"], hands: 2, tags: ["ranged"],
    weight: 1, value: 0, npcGear: true, kind: "Weapon",
    verbs: { strike: verb(3, { range: 6 }) }
  },
  {
    /* A shield is the one piece of NPC gear that changes how a fight feels rather than how much it
     * hurts: it is what makes a Goblin Warrior worth killing before the spearmen. */
    /* `hands`, like every other shield in the book: there is no `offhand` slot and never was, so
     * the schema refused this one and fell back -- a shield in a slot the game does not have. */
    name: "Goblin Shield", slot: "hands", hands: 1, tags: ["shield", "natural"],
    weight: 2, value: 0, npcGear: true, kind: "Shield",
    armor: 1, verbs: { defend: verb(2) }
  },
  {
    name: "Goblin Fetish", slot: "hands", hands: 1, tags: ["arcane", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Focus",
    verbs: { cast: verb(3, { range: 4 }) }
  },
  {
    name: "Mole Pick", slot: "hands", hands: 1, tags: ["melee", "natural"],
    weight: 2, value: 0, npcGear: true, kind: "Weapon",
    verbs: { strike: verb(4, { ignores: 1 }) }
  },
  {
    name: "Dark Lantern", slot: "hands", hands: 1, tags: ["arcane", "natural"],
    weight: 1, value: 0, npcGear: true, kind: "Focus",
    verbs: { cast: verb(4, { range: 3 }) }
  }
];

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

/* -------------------------------------------- */
/*  Natural weapons                             */
/* -------------------------------------------- */

/**
 * What a creature with no hands fights with.
 *
 * core-rules 9 settles this already: *NPCs still use items for their Strike and Cast values, so
 * the same goblin deck works for a spear goblin and a bow goblin.* A mandible is therefore an item,
 * which costs no new mechanism and makes the one knob that sets how dangerous a monster is the same
 * knob for every monster.
 *
 * The **`natural` tag** is what separates these from a goblin's spear: a thing grown rather than
 * carried cannot be disarmed, broken or looted. Nothing in the engine disarms anybody yet, so the
 * tag is a label the table reads and a thing the validator can insist on -- but it is on the item
 * from the start rather than added once somebody writes a disarm rule and finds a dragon dropping
 * its teeth.
 */
export const NATURAL_WEAPONS = [
  /*
   * **The two a troll is born with.** Both are `natural` for the same reason the mandibles are:
   * nothing disarms a troll of its hands, and a thrown rock is not loot. `Thrown Stone` is the
   * roster's only ranged natural that is not a spray -- it is what `siege` looks like when the
   * creature holding it is big enough to pick the wall up.
   */
  {
    name: "Troll Fists", slot: "hands", hands: 0, tags: ["melee", "heavy", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(6) }
  },
  /*
   * **Elf-shot, which the whole hidden-folk family shares.**
   *
   * Across Scandinavia and the British Isles the same object is blamed for the same thing: a
   * neolithic flint arrowhead turned up in a field, held to be the dart the hidden folk shoot
   * cattle and sleepers with, and a sudden pain with no wound is *elfshot*. One piece of content
   * for all four, because the folklore does not distinguish between them either.
   */
  {
    name: "Elf-Bolt", slot: "hands", hands: 1, tags: ["arcane", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Focus",
    verbs: { cast: verb(4, { range: 5 }) }
  },
  /* The two the undead are born with -- or rather the two they get back. */
  {
    name: "Draining Bite", slot: "hands", hands: 0, tags: ["melee", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(4) }
  },
  {
    name: "Grave-Cold Hands", slot: "hands", hands: 0, tags: ["melee", "heavy", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(5) }
  },
  /* The Winter Lady's, and the only cold thing in a catalogue of fire and acid. */
  {
    name: "Killing Frost", slot: "hands", hands: 0, tags: ["ranged", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(7, { range: 5, area: 2, ignores: 3 }) }
  },
  /* What a demon has instead of a weapon. The Third Side is lava flows and black mountains, and
   * the things that live there do not pick anything up. */
  {
    name: "Burning Grasp", slot: "hands", hands: 0, tags: ["melee", "heavy", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(6, { ignores: 1 }) }
  },
  /* The worm-kin. `Dragon Jaws` is the hardest single strike in the game, and `Crushing Coils`
   * is the only natural weapon that grapples -- a serpent has no hands to do it with. */
  {
    name: "Dragon Jaws", slot: "hands", hands: 0, tags: ["melee", "heavy", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(8, { ignores: 2 }) }
  },
  {
    name: "Crushing Coils", slot: "hands", hands: 0, tags: ["melee", "heavy", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(6, { reach: 2 }) }
  },
  {
    name: "Thrown Stone", slot: "hands", hands: 0, tags: ["ranged", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(5, { range: 5, ignores: 1 }) }
  },
  {
    name: "Mandibles", slot: "hands", hands: 0, tags: ["melee", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(3) }
  },
  {
    name: "Heavy Mandibles", slot: "hands", hands: 0, tags: ["melee", "heavy", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(5) }
  },
  {
    name: "Claws", slot: "hands", hands: 0, tags: ["melee", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(4) }
  },
  {
    name: "Sting", slot: "hands", hands: 0, tags: ["melee", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(2) }
  },
  {
    name: "Tusks", slot: "hands", hands: 0, tags: ["melee", "heavy", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(6, { reach: 2 }) }
  },
  {
    /* A club on a long tail (Firma.md), which is what reach IS: it hits at two and not at one. */
    name: "Tail Club", slot: "hands", hands: 0, tags: ["melee", "heavy", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(7, { reach: 2, ignores: 2 }) }
  },
  {
    name: "Grasping Claws", slot: "hands", hands: 0, tags: ["melee", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(5, { reach: 2 }) }
  },
  {
    name: "Acid Spray", slot: "hands", hands: 0, tags: ["ranged", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(4, { range: 3, area: 1, ignores: 2 }) }
  },
  {
    name: "Fire Spray", slot: "hands", hands: 0, tags: ["ranged", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(5, { range: 4, area: 2, ignores: 1 }) }
  },
  {
    /* Harmless means harmless: the world says so of Scrips and Processors, and a creature the
     * party can ignore is a creature the party has to decide to ignore. */
    name: "Nip", slot: "hands", hands: 0, tags: ["melee", "natural"],
    weight: 0, value: 0, npcGear: true, kind: "Natural",
    verbs: { strike: verb(1) }
  }
];

/* -------------------------------------------- */
/*  The roster                                  */
/* -------------------------------------------- */

/**
 * The Horde and the burrowers, with numbers.
 *
 * **Every number is a multiple of the one creature that was measured.** A goblin is Health 5,
 * Strike 3, armour 0, and the simulator ran four of them against a starter Warrior until the shape
 * of that fight was known (sim/analysis-2026-10-21.md onward). Nothing else in this table has been
 * simulated, so nothing else is claimed: these are **ratios to a goblin**, stated as ratios, and
 * the tuning rule they obey is core-rules 9's -- *keep a weak enemy's Strike at least 2 above the
 * heroes' armour*, which is why the floor here is 3 and not 2.
 *
 * | | Health | Strike | armour |
 * |---|---|---|---|
 * | a goblin, measured | 5 | 3 | 0 |
 * | Horde infantry | 5 | 3 | 1 |
 * | a lieutenant | 15 | 5 | 2 |
 * | a general | 25 | 5 | 3 |
 * | the Queen | 60 | 4 | 4 |
 *
 * **Capabilities, not decks.** Each creature declares what it can do and its intent deck is the
 * subset of the pool it qualifies for, which is why `capabilities` is the longest line on most of
 * these and why none of them lists a card.
 */
export const MONSTERS = [

  /* --- the Horde: an army, so it has infantry, air, cavalry, engineers and officers ----------- */
  {
    name: "Flat Bug", type: "npc",
    system: {
      health: { value: 5, base: 5 }, kind: "flat-bug", armorBase: 1, speed: 3,
      capabilities: ["legs", "pack", "drilled"],
      tactics: ["packTactics", "shieldWall"], targetPriority: "nearest"
    },
    equipped: ["Mandibles"],
    note: "the Horde's main infantry: a goblin with a shell and no fear",
    look: "a low broad arachnid plated front to back, EIGHT legs splayed under a flat shell. No "
      + "goblin and no humanoid head of any kind: the head is a wedge of jaw set into the shell"
  },
  {
    name: "Scrip", type: "npc",
    system: {
      health: { value: 2, base: 2 }, kind: "scrip", armorBase: 0, speed: 6,
      capabilities: ["flight", "pack", "feral"],
      tactics: ["skirmisher"], targetPriority: "nearest"
    },
    equipped: ["Nip"],
    note: "eyes and ears, and harmless: the question is whether you spend a turn on one",
    look: "small and quick on EIGHT thin legs, more eye than body -- a cluster of eyes over a "
      + "trunk barely bigger than a fist. One of them and not a swarm"
  },
  {
    name: "Sweeper", type: "npc",
    system: {
      health: { value: 8, base: 8 }, kind: "sweeper", armorBase: 1, speed: 7,
      capabilities: ["flight", "fast", "feral"],
      tactics: ["skirmisher", "ambusher"], targetPriority: "weakest"
    },
    equipped: ["Claws"],
    note: "the air force: four wings and a dive",
    look: "EIGHT legs folded tight under four wings. Not a bird and not a bat: the wings are thin "
      + "and veined off a segmented body, and there are no feathers anywhere on it"
  },
  {
    name: "Mantiss", type: "npc",
    system: {
      health: { value: 12, base: 12 }, kind: "mantiss", armorBase: 2, speed: 4,
      capabilities: ["legs", "reach", "commander", "drilled"],
      tactics: ["commander", "skirmisher"], targetPriority: "leader"
    },
    equipped: ["Grasping Claws"],
    note: "sergeants: the first thing in the Horde that gives an order",
    look: "EIGHT legs, the front pair long and folded like a mantis's and the other six walking. "
      + "Upright over them, taller than the infantry, with a narrow swivelling head"
  },
  {
    name: "Smash Beetle", type: "npc",
    system: {
      health: { value: 20, base: 20 }, kind: "smash-beetle", armorBase: 3, speed: 2,
      capabilities: ["legs", "brute", "siege", "reach", "feral"],
      tactics: ["brute"], targetPriority: "nearest"
    },
    equipped: ["Tail Club"],
    note: "it is here for the wall, and you are in the way of the wall"
  },
  {
    name: "Rush Spider", type: "npc",
    system: {
      health: { value: 10, base: 10 }, kind: "rush-spider", armorBase: 1, speed: 8,
      capabilities: ["legs", "fast", "transport", "feral"],
      tactics: ["skirmisher"], targetPriority: "weakest"
    },
    equipped: ["Mandibles"],
    note: "cavalry: it arrives before you have finished deciding"
  },
  {
    name: "Mega Beetle", type: "npc",
    system: {
      health: { value: 30, base: 30 }, kind: "mega-beetle", armorBase: 4, speed: 2,
      capabilities: ["legs", "shelter", "drilled"],
      tactics: ["shieldWall", "bodyguard"], targetPriority: "nearest"
    },
    equipped: ["Heavy Mandibles"],
    note: "a wall that walks: the Scrips under its wings are the point of it"
  },
  {
    name: "Slitherer", type: "npc",
    system: {
      health: { value: 7, base: 7 }, kind: "slitherer", armorBase: 1, speed: 4,
      capabilities: ["legs", "stealth", "venom", "feral"],
      tactics: ["ambusher"], targetPriority: "weakest",
      signature: { condition: "poisoned", intensity: 2, duration: 2 }
    },
    equipped: ["Mandibles"],
    note: "silent and venomous: the two words the world gives it, and both are mechanical",
    look: "a long low body dragging between EIGHT short legs set wide along its sides -- it "
      + "slithers because the body is on the ground, not because it has no legs"
  },
  {
    name: "Stinger", type: "npc",
    system: {
      health: { value: 6, base: 6 }, kind: "stinger", armorBase: 0, speed: 6,
      capabilities: ["flight", "venom", "feral"],
      tactics: ["skirmisher"], targetPriority: "caster",
      signature: { condition: "poisoned", intensity: 1, duration: 3 }
    },
    equipped: ["Sting"],
    note: "it goes for whoever is concentrating"
  },
  {
    name: "Blind Worm", type: "npc",
    system: {
      health: { value: 14, base: 14 }, kind: "blind-worm", armorBase: 2, speed: 3,
      capabilities: ["burrow", "brute", "feral"],
      tactics: ["ambusher"], targetPriority: "nearest"
    },
    equipped: ["Heavy Mandibles"],
    note: "no sight and a sense for vibration: it finds whoever moved",
    look: "a thick blind tube of segmented muscle, heavy mandibles at the head end and no eyes "
      + "anywhere on it. **Purplish red** -- the raw dark red-violet of muscle or of an "
      + "earthworm's flush, wet-looking, deeper in the creases between the segments. Drawn "
      + "coming up out of broken ground"
  },
  {
    name: "Armored Slug", type: "npc",
    system: {
      health: { value: 16, base: 16 }, kind: "armored-slug", armorBase: 4, speed: 1,
      capabilities: ["legs", "spray", "feral"],
      tactics: ["sniper"], targetPriority: "nearest"
    },
    equipped: ["Acid Spray"],
    note: "slow, armoured, and it does not need to reach you"
  },
  {
    name: "Five Legs", type: "npc",
    system: {
      health: { value: 15, base: 15 }, kind: "five-legs", armorBase: 2, speed: 4,
      capabilities: ["legs", "commander", "drilled"],
      tactics: ["commander", "packTactics"], targetPriority: "leader"
    },
    equipped: ["Claws"],
    note: "lieutenants, fairly intelligent: it spends its turn on somebody else's",
    look: "FIVE-FOLD RADIAL: five identical limbs spaced evenly around a domed carapace, no head "
      + "and no front or back, like a starfish built as a predator. Nothing else here is radial"
  },
  {
    name: "Terror Fly", type: "npc",
    system: {
      health: { value: 18, base: 18 }, kind: "terror-fly", armorBase: 2, speed: 6,
      capabilities: ["flight", "spray", "commander", "drilled"],
      tactics: ["commander", "sniper"], targetPriority: "weakest",
      signature: { condition: "burning", intensity: 2, duration: 2 }
    },
    equipped: ["Fire Spray"],
    note: "captains, and the first thing in the roster that burns ground"
  },
  {
    name: "Pincer", type: "npc",
    system: {
      health: { value: 25, base: 25 }, kind: "pincer", armorBase: 3, speed: 4,
      capabilities: ["legs", "grapple", "commander", "reach", "drilled"],
      tactics: ["commander", "grappler"], targetPriority: "leader"
    },
    equipped: ["Grasping Claws"],
    note: "generals, intelligent, armoured: it takes somebody out of the fight rather than down"
  },
  {
    name: "The Queen", type: "npc",
    system: {
      health: { value: 60, base: 60 }, kind: "queen", armorBase: 4, speed: 0,
      capabilities: ["commander", "summon", "drilled"],
      tactics: ["commander"], targetPriority: "nearest"
    },
    equipped: ["Heavy Mandibles"],
    note: "unique, rooted, and the only thing here that cannot walk: she spends every turn "
      + "on the army instead",
    look: "enormous and rooted to the floor, armoured in overlapping plate like a siege engine, "
      + "heavy jaws and a crown of horn. The most frightening thing in the set: more armour "
      + "than the Marshal and more mass than anything that walks"
  },
  {
    name: "Processor", type: "npc",
    system: {
      health: { value: 4, base: 4 }, kind: "processor", armorBase: 1, speed: 3,
      capabilities: ["legs", "wits"],
      tactics: [], targetPriority: "nearest"
    },
    equipped: ["Nip"],
    note: "workers: they build, and they are what a scene looks like before the fight",
    look: "a single worker, unarmoured and unarmed, built for carrying rather than fighting: a "
      + "low six-legged body with the front pair held up and loaded, mouthparts busy. Caught "
      + "mid-task and not looking up"
  },
  {
    name: "Doomfly", type: "npc",
    system: {
      health: { value: 12, base: 12 }, kind: "doomfly", armorBase: 1, speed: 7,
      capabilities: ["flight", "transport", "feral"],
      tactics: [], targetPriority: "nearest"
    },
    equipped: ["Nip"],
    note: "transport: it is how everything else arrived"
  },
  {
    name: "Skaah", type: "npc",
    system: {
      health: { value: 40, base: 40 }, kind: "skaah", armorBase: 2, speed: 4,
      capabilities: ["flight", "transport", "shelter", "drilled"],
      tactics: ["bodyguard"], targetPriority: "nearest"
    },
    equipped: ["Nip"],
    note: "a drop ship: balloon-like, gigantic, and full of something worse"
  },

  /* --- the burrower group -------------------------------------------------------------------- */
  {
    name: "Mole Beast", type: "npc",
    system: {
      health: { value: 22, base: 22 }, kind: "mole-beast", armorBase: 2, speed: 3,
      capabilities: ["burrow", "brute", "reach", "feral"],
      tactics: ["brute", "ambusher"], targetPriority: "nearest"
    },
    equipped: ["Tusks"],
    note: "it comes up underneath, which is what Go Under is for",
    look: "a true mole, enlarged: a barrel of muscle with a pink snout, tiny buried eyes and huge "
      + "outward-turned digging forelimbs. Fur, not chitin -- it is not one of the Horde"
  },
  {
    name: "Mole Man", type: "npc",
    system: {
      health: { value: 8, base: 8 }, kind: "mole-man", armorBase: 1, speed: 3,
      capabilities: ["burrow", "legs", "pack", "wits"],
      tactics: ["packTactics"], targetPriority: "weakest"
    },
    equipped: ["Mole Pick"],
    note: "followers of the Queen of the Dark, and the only burrower that carries a tool"
  },
  {
    name: "Burrower", type: "npc",
    system: {
      health: { value: 18, base: 18 }, kind: "burrower", armorBase: 2, speed: 5,
      capabilities: ["burrow", "transport", "feral"],
      tactics: [], targetPriority: "nearest"
    },
    equipped: ["Mandibles"],
    note: "worms, and the steeds of the mole men: it is how they arrive under you",
    look: "one great pale ringed worm, as thick as a barrel, blind, with a ring of rasping plates "
      + "where a face would be. Drawn head-first out of broken ground with the body trailing "
      + "back into it. No rider in the picture"
  },

  /* --- the trolls, which are the first thing here that is not an insect or a goblin -----------
   *
   * **Nordic trolls, not the regenerating green kind.** A bergtroll is a piece of the mountain
   * that moves at night and is a boulder again by morning, and that is not flavour here: it is
   * exactly what `dormant` does. *Lie Still* has been sitting in the intent pool with no creature
   * able to draw it -- the capability, the card and the folklore all say the same thing, and the
   * card was written before anybody noticed which creature it was waiting for.
   *
   * The capabilities were already chosen when these were tags, so none of them is invented here.
   * What is new is the numbers, the bodies and the weapons, which is the half a tag does not have.
   */
  {
    name: "Mountain Troll", type: "npc",
    system: {
      health: { value: 34, base: 34 }, kind: "mountain-troll", armorBase: 4, speed: 2,
      capabilities: ["legs", "brute", "dormant", "siege", "feral"],
      tactics: ["brute"], targetPriority: "nearest"
    },
    equipped: ["Troll Fists", "Thrown Stone"],
    note: "it was a boulder when you walked past it, and it will be a boulder again by morning",
    look: "a bergtroll: a hunched mass of grey stone-hide with lichen and moss growing on its "
      + "back and shoulders, a great hooked nose, small deep-set eyes and a mouth too wide. "
      + "Vast, slow and mineral -- more cliff than animal, and no green skin anywhere"
  },
  {
    name: "Forest Troll", type: "npc",
    system: {
      health: { value: 20, base: 20 }, kind: "forest-troll", armorBase: 2, speed: 4,
      capabilities: ["legs", "brute", "stealth", "feral"],
      tactics: ["ambusher", "brute"], targetPriority: "weakest"
    },
    equipped: ["Troll Fists"],
    note: "it has been standing among the trunks the whole time you were deciding where to camp",
    look: "a skogstroll: long-limbed and hunched, hide like wet bark with lichen in the seams, a "
      + "cow's tail it keeps tucked, and a face that is nearly a person's and wrong about it"
  },
  {
    name: "Changeling", type: "npc",
    system: {
      health: { value: 8, base: 8 }, kind: "changeling", armorBase: 0, speed: 4,
      capabilities: ["legs", "stealth", "wits"],
      /* Not `cowardly`: that is the goblins own tactic and the suite pins it to them. A
       * changeling does not run when found -- it has not been found for years. */
      tactics: ["ambusher"], targetPriority: "weakest"
    },
    equipped: ["Nip"],
    note: "the one left in the cradle: it has been in the house for years and nobody said so",
    look: "a byting: child-sized and child-shaped and not a child -- the proportions a little "
      + "off, the head a little large, the hands too long, old in the eyes. Dressed in human "
      + "clothes that fit badly. Nothing monstrous on it at a glance, which is the whole horror"
  },
  {
    name: "Trollkin", type: "npc",
    system: {
      health: { value: 10, base: 10 }, kind: "trollkin", armorBase: 1, speed: 4,
      capabilities: ["legs", "pack", "wits"],
      tactics: ["packTactics"], targetPriority: "weakest"
    },
    equipped: ["Troll Club"],
    note: "the small folk under the hill: there are more of them and they know the ground",
    look: "knee-high to a person and broad, grey-brown and leathery, with a troll's nose and a "
      + "troll's ears on a body built low to the ground. Rough homespun and a stick. One of "
      + "many, drawn alone: a single figure in the frame, and what is unsettling about it is how "
      + "plainly it is not the only one"
  },

  /* --- the returning dead, nine of them, each from somewhere ----------------------------------
   *
   * **Nine traditions rather than nine ranks of one monster.** A Draugr is Norse and guards its
   * own howe; an Alp is German and sits on a sleeper's chest; Keres are Greek and work a
   * battlefield; a Lugat is Albanian and bloated. They share `drain` and a direction of travel and
   * nothing else, and the point of taking them from folklore is that each one already knows what
   * it wants -- which is the half a statblock cannot invent.
   *
   * Two more pieces of vocabulary find their creature here. `drain` had *Feed* and nobody to draw
   * it, `caster` had *Work the Weave* and nobody to draw it, and `lastAttacker` has been sitting
   * in the config as a target priority no creature used. A revenant pursues the one who wronged
   * it until the debt is paid; that IS `lastAttacker`, and the enumeration was waiting for it.
   */
  {
    name: "Draugr", type: "npc",
    system: {
      health: { value: 30, base: 30 }, kind: "draugr", armorBase: 3, speed: 3,
      capabilities: ["legs", "brute", "dormant", "feral"],
      tactics: ["brute", "ambusher"], targetPriority: "nearest"
    },
    equipped: ["Grave-Cold Hands"],
    note: "it is not hunting you. You are standing in its barrow and it wants you to put that down",
    look: "a barrow-dweller: a corpse swollen far past the size it was alive, hel-bla -- the "
      + "blue-black of a drowned man -- in the rotted remains of good clothes, with grave-goods still "
      + "on it. Heavy, slow, and far too strong. Not a skeleton: there is too much of it left"
  },
  {
    name: "Revenant", type: "npc",
    system: {
      health: { value: 24, base: 24 }, kind: "revenant", armorBase: 2, speed: 4,
      capabilities: ["legs", "brute", "feral"],
      /* It goes for whoever last hit it, and keeps going, which is the whole of the folklore. */
      tactics: ["brute"], targetPriority: "lastAttacker"
    },
    equipped: ["Grave-Cold Hands"],
    note: "it came back for one person and it has not worked out yet that you are not them",
    look: "a body walking with a purpose and nothing else: dried rather than rotted, the clothes "
      + "it was buried in, the wound that killed it still open and not bleeding. The face is "
      + "intact and recognisable, which is the worst thing about it"
  },
  {
    name: "Strigoi", type: "npc",
    system: {
      health: { value: 28, base: 28 }, kind: "strigoi", armorBase: 2, speed: 4,
      capabilities: ["legs", "drain", "caster", "commander", "stealth", "wits"],
      /* The commander CAPABILITY, which earns it Order, but not the commander TACTIC: the suite
       * holds that tactic equivalent to `drilled`, and this thing is `wits`. Which is right --
       * a strigoi walks the village dead out after it, it does not drill them into a line. */
      tactics: ["ambusher"], targetPriority: "caster"
    },
    equipped: ["Draining Bite"],
    note: "it went home first, which is how the village knew. The others followed it out",
    look: "the troubled dead of the Romanian stories: gaunt and upright and almost presentable, "
      + "dressed as a living person of standing, with too-long nails and a mouth that does not "
      + "close properly. It does not shamble. It arrives"
  },
  {
    name: "Lugat", type: "npc",
    system: {
      health: { value: 22, base: 22 }, kind: "lugat", armorBase: 2, speed: 3,
      capabilities: ["legs", "drain", "brute", "feral"],
      tactics: ["brute"], targetPriority: "nearest"
    },
    equipped: ["Draining Bite"],
    note: "it comes back to eat and little else, and the stories say a wolf will settle it",
    look: "the Albanian kind: bloated and tight-skinned, still wound in its shroud with the "
      + "wrapping split, moving with a full belly's slowness. Fat rather than gaunt, which is "
      + "what separates it from every other corpse here"
  },
  {
    name: "Alp", type: "npc",
    system: {
      health: { value: 12, base: 12 }, kind: "alp", armorBase: 0, speed: 4,
      capabilities: ["legs", "drain", "stealth", "wits"],
      tactics: ["ambusher"], targetPriority: "weakest"
    },
    equipped: ["Draining Bite", "Tarnkappe"],
    note: "it sits on the chest of whoever fell asleep, and the cap is the whole of its power",
    look: "a small hunched night-thing wearing a shabby grey cap pulled low -- the Tarnkappe, "
      + "and it is the only thing on it that reads as clothing. Thin, long-fingered, far too "
      + "light for its size, drawn crouching as though on someone's ribs"
  },
  {
    name: "Dhampir", type: "npc",
    system: {
      health: { value: 14, base: 14 }, kind: "dhampir", armorBase: 1, speed: 5,
      capabilities: ["legs", "drain", "wits"],
      tactics: ["skirmisher"], targetPriority: "caster"
    },
    equipped: ["Draining Bite"],
    note: "half of it is alive, and that half hunts the other half's father for money",
    look: "a living person, which is the point: a lean traveller in worn coat and boots, nothing "
      + "undead about the body at all. Only the eyes are wrong, and they know it. The only thing "
      + "in this group that casts a shadow"
  },
  {
    name: "Keres", type: "npc",
    system: {
      health: { value: 8, base: 8 }, kind: "keres", armorBase: 0, speed: 6,
      capabilities: ["legs", "venom", "pack", "feral"],
      tactics: ["packTactics", "skirmisher"], targetPriority: "weakest"
    },
    equipped: ["Claws"],
    note: "they work a battlefield, and they are not waiting for anybody to finish dying",
    look: "one Greek death-spirit: a dark ragged woman, gaunt, bloodied to the elbow, teeth "
      + "bared, stooping low over the ground towards something already down. **A single figure** "
      + "-- there are others working the same field and not one of them is in this picture"
  },
  {
    name: "Chupacabra", type: "npc",
    system: {
      health: { value: 10, base: 10 }, kind: "chupacabra", armorBase: 1, speed: 7,
      capabilities: ["legs", "pack", "drain", "fast", "feral"],
      tactics: ["packTactics", "skirmisher"], targetPriority: "weakest"
    },
    equipped: ["Draining Bite"],
    note: "it goes through a pen in a night and leaves every animal in it unmarked but empty",
    look: "a lean hairless quadruped, grey and leathery, with a ridge of stiff spines down the "
      + "back, a long muzzle and oversized hind legs built for springing. An animal, not a "
      + "person: the only one of these nine that goes on four legs"
  },
  {
    name: "Shade", type: "npc",
    system: {
      health: { value: 10, base: 10 }, kind: "shade", armorBase: 0, speed: 5,
      capabilities: ["legs", "stealth", "caster", "wits"],
      tactics: ["ambusher"], targetPriority: "caster"
    },
    equipped: ["Grave Candle"],
    note: "the part that stayed, and it has been repeating one evening for a very long time",
    look: "barely there: the shape of a person in thin grey wash, the edges losing themselves "
      + "into the paper, carrying a single guttering candle that is the most solid thing in the "
      + "picture. No chains, no skull, no sheet -- just somebody almost rubbed out"
  },

  /* --- the hidden folk, who are not Tolkien's -------------------------------------------------
   *
   * **Nordic, and small, and offended.** An alf is not a tall archer: the folklore is dancing in a
   * meadow at dawn, a ring of flattened grass, a sudden pain blamed on a flint arrowhead, and a
   * farm spirit that will wreck a byre over a forgotten bowl of porridge. All four are `caster`
   * and `wits` and none of them is a fighter -- they are what happens when you are rude to the
   * ground you live on.
   */
  {
    name: "Elf", type: "npc",
    system: {
      health: { value: 16, base: 16 }, kind: "elf", armorBase: 1, speed: 5,
      capabilities: ["legs", "caster", "stealth", "wits"],
      tactics: ["ambusher", "skirmisher"], targetPriority: "caster"
    },
    equipped: ["Elf-Bolt"],
    note: "they were dancing where the grass is flat, and you walked through the middle of it",
    look: "an alva of the Nordic kind, not a tall archer: slight, pale and barefoot in a thin "
      + "shift, hair unbound, drawn mid-step as if still dancing and only half attending to you. "
      + "**The whole figure glitters** -- a fine dust of light caught on the skin, the hair and "
      + "the shift, as though it had been rolled in frost or crushed glass, and the air "
      + "immediately around it sparkles too. Beautiful and slightly wrong in the proportions. "
      + "No armour, no bow, no pointed helm"
  },
  {
    name: "Gnome", type: "npc",
    system: {
      health: { value: 14, base: 14 }, kind: "gnome", armorBase: 1, speed: 3,
      capabilities: ["legs", "caster", "wits"],
      tactics: ["ambusher"], targetPriority: "nearest"
    },
    equipped: ["Elf-Bolt"],
    note: "the farm is its farm. Somebody forgot the porridge and now the byre is a problem",
    look: "a tomte: knee-high, old-man-faced, grey homespun and a red knitted cap, with a beard "
      + "far too long for the body under it. Carries itself like the owner of the place. "
      + "Enormously strong for its size, which should show in the hands and the stance"
  },
  {
    name: "Little Folk", type: "npc",
    system: {
      health: { value: 10, base: 10 }, kind: "little-folk", armorBase: 1, speed: 4,
      capabilities: ["legs", "caster", "stealth", "wits"],
      /* Not `ambusher`: that is the Shade, with the same four capabilities, and the two would
       * have been the same creature twice. They are many and they move -- a skirmisher. */
      tactics: ["skirmisher"], targetPriority: "weakest"
    },
    equipped: ["Elf-Bolt"],
    note: "de underjordiska: they live under the floor you are standing on and they were here first",
    look: "one of the vattar, the underground people: small, grey and earthen, dressed like a "
      + "poor farmer of no particular century, with a flat look and no expression to read. "
      + "Drawn half out of the ground: never fully in the open, and never in company -- one "
      + "figure and no second one anywhere"
  },
  {
    name: "Nature Spirit", type: "npc",
    system: {
      health: { value: 20, base: 20 }, kind: "nature-spirit", armorBase: 1, speed: 5,
      capabilities: ["legs", "caster", "wits"],
      tactics: ["skirmisher", "ambusher"], targetPriority: "caster"
    },
    equipped: ["Elf-Bolt"],
    note: "a ra: the forest or the lake has an owner, and you have been taking without asking",
    look: "a skogsra: from the front a tall woman made of the wood -- bark-grained skin, moss in "
      + "the hair, eyes like a deer's -- and from any other angle hollow, the back open like a "
      + "rotted trunk. Draw her turning, so both are true at once. That hollow is the whole point"
  },

  /* --- the worms, which is what a dragon is here -----------------------------------------------
   *
   * **Lindworm first and dragon second**, because that is the order the north tells it in: a worm
   * is a serpent that got old and large, and wings are a late southern addition. The Sea Serpent
   * closes the last gap in the capability vocabulary -- `swim` has had *Submerge* waiting for it
   * since the intent pool was written, and nothing in the roster could go under the water.
   */
  {
    name: "Dragon", type: "npc",
    system: {
      health: { value: 50, base: 50 }, kind: "dragon", armorBase: 5, speed: 6,
      capabilities: ["flight", "spray", "brute", "caster", "wits"],
      tactics: ["brute"], targetPriority: "nearest"
    },
    /* No focus: a dragon is not casting THROUGH anything. The hidden folk shoot elf-bolts and
     * a shaman holds a fetish; this one is the source itself, and the capability stands alone. */
    equipped: ["Dragon Jaws", "Fire Spray"],
    note: "old, awake, and able to hold a conversation it has no intention of being swayed by",
    look: "the biggest thing in the bestiary: a long-bodied winged worm, more serpent than "
      + "lizard, with a narrow head and an old intelligence in it. **Scaled in bright silver** "
      + "-- the scales metallic and polished like plate armour, hard white highlights running "
      + "along every edge and the light sliding off it as off steel. Wings like a bat's and far "
      + "too large. It should dwarf everything drawn beside it"
  },
  {
    name: "Lindworm", type: "npc",
    system: {
      health: { value: 34, base: 34 }, kind: "lindworm", armorBase: 3, speed: 4,
      capabilities: ["legs", "spray", "brute", "feral"],
      tactics: ["brute", "ambusher"], targetPriority: "nearest"
    },
    equipped: ["Dragon Jaws", "Acid Spray"],
    note: "a worm that kept growing: no wings, two legs, and it has been under the church for years",
    look: "a wingless serpent-dragon of the Nordic kind: a long heavy body with ONE pair of "
      + "forelegs at the front and nothing behind, dragging the rest. **Ferocious, not sluggish** "
      + "-- the head low and driving forward, jaws wide open on a mouthful of back-curved teeth, "
      + "gums drawn back, the small eyes fixed on what is in front of it. Scarred, filthy scale. "
      + "No wings at all -- that is what makes it a lindworm and not a dragon"
  },
  {
    name: "Sea Serpent", type: "npc",
    system: {
      health: { value: 40, base: 40 }, kind: "sea-serpent", armorBase: 3, speed: 6,
      capabilities: ["swim", "brute", "grapple", "feral"],
      tactics: ["grappler", "brute"], targetPriority: "nearest"
    },
    equipped: ["Crushing Coils", "Dragon Jaws"],
    note: "the lake has one and the village has always known it: this is the year it was seen twice",
    look: "a vast limbless water-worm, drawn as a series of humps breaking a flat surface with "
      + "the head low and forward at one end -- the shape of every lake-monster sighting ever "
      + "reported. Most of it is under the water and should stay there"
  },
  {
    name: "Wyvern", type: "npc",
    system: {
      health: { value: 22, base: 22 }, kind: "wyvern", armorBase: 2, speed: 8,
      capabilities: ["flight", "venom", "fast", "feral"],
      tactics: ["skirmisher"], targetPriority: "weakest"
    },
    equipped: ["Claws"],
    note: "it hunts like a hawk and it is not large enough to be interesting until it is on you",
    look: "a two-legged winged worm, hawk-sized rather than dragon-sized: wings and hind legs "
      + "and nothing else, built entirely for the stoop. **The tail grows out of the base of the "
      + "spine in one unbroken line** and tapers from there to a barbed point -- it is part of "
      + "the body and continuous with it, never a separate whip-shape floating near the hips. "
      + "Lean and quick where the dragon is heavy"
  },

  /* --- people, which is what most fights are actually against ---------------------------------
   *
   * **The group that was missing, and it was the obvious one.** Sixty-eight creatures and not one
   * of them a person: every encounter the roster could build was a monster encounter, in a setting
   * whose own world document is four hundred lines about districts, churches, guilds and who is
   * feuding with whom. A bandit on the South Road is the commonest fight in Firma and there was
   * nothing to put on the table for it.
   *
   * Half of these are the generic folk any game needs -- townsfolk, a guard, a bandit, a cultist,
   * a mercenary -- and half are read straight off `worldinfo/Firma.md` rather than invented: the
   * Flagellants and the Holy Shield and the Black Circle are the Church of the Eternal God's own
   * named groupings, the Grey are the Fourth District's assassin sect, the Mummers and Berserkers
   * are how the Five are worshipped in the Second, the Salt Barons ran the west coast, and the
   * Fifth District's refugee engineers brought gunpowder and their own language with them.
   *
   * **They carry ITEMS rather than creature gear**, which is new: a guard's Spear is the Spear a
   * player loots off it. That is what a human is, mechanically -- a body with a kit.
   */
  {
    name: "Townsfolk", type: "npc",
    system: {
      health: { value: 4, base: 4 }, kind: "townsfolk", armorBase: 0, speed: 3,
      capabilities: ["legs", "pack", "wits"],
      /* Cowardly WITHOUT packTactics, which is the goblin and would have been it twice. A
       * goblin line runs together; a market scatters. */
      tactics: ["cowardly"], targetPriority: "weakest"
    },
    equipped: ["Dagger"],
    note: "they are not a fight. They are what a fight happens in the middle of",
    look: "one ordinary working person of no particular century: apron, patched wool, boots worn "
      + "down on one side, a basket or a bundle still in the hands. Already turning away from "
      + "whatever is happening. The dagger at the belt has only ever cut bread"
  },
  {
    name: "Town Guard", type: "npc",
    system: {
      health: { value: 10, base: 10 }, kind: "town-guard", armorBase: 2, speed: 3,
      /* `reach` because the thing it actually holds is a spear -- and because without it this
       * fought exactly like a Flat Bug Shieldline, down to the tactic pair. */
      capabilities: ["legs", "pack", "reach", "shelter", "drilled"],
      tactics: ["shieldWall", "packTactics"], targetPriority: "nearest"
    },
    equipped: ["Spear", "Wooden Shield", "Leather Armor", "Light Helm"],
    note: "paid badly to stand in a doorway, and will do exactly that for as long as it takes",
    look: "a watchman in a padded coat and an open kettle helm with a spear and a round shield, "
      + "a town's badge on the shield and nothing else to mark them. Tired rather than fierce"
  },
  {
    name: "Bandit", type: "npc",
    system: {
      health: { value: 8, base: 8 }, kind: "bandit", armorBase: 1, speed: 4,
      capabilities: ["legs", "pack", "stealth", "wits"],
      tactics: ["ambusher", "packTactics"], targetPriority: "weakest"
    },
    equipped: ["Arming Sword", "Leather Armor"],
    note: "the South Road is long and the council that governs it sits a week away",
    look: "one roadside robber in mismatched gear: a good sword, a bad coat, a hood or a scarf "
      + "across the face. Everything worn looks taken off somebody else, because it was"
  },
  {
    name: "Cultist", type: "npc",
    system: {
      health: { value: 8, base: 8 }, kind: "cultist", armorBase: 0, speed: 4,
      capabilities: ["legs", "pack", "caster", "wits"],
      tactics: ["packTactics"], targetPriority: "caster"
    },
    equipped: ["Carved Idol", "Dagger"],
    note: "a small god with few enough followers that it answers each of them personally",
    look: "one worshipper of something local and unofficial: plain robes over ordinary clothes, a "
      + "crude carved figure held in both hands, the face lit from below. Not a hooded skeleton "
      + "-- this is somebody from the next village and you would know them in daylight"
  },
  {
    name: "Mercenary", type: "npc",
    system: {
      health: { value: 12, base: 12 }, kind: "mercenary", armorBase: 3, speed: 4,
      capabilities: ["legs", "brute", "reach", "drilled"],
      tactics: ["bodyguard", "brute"], targetPriority: "nearest"
    },
    equipped: ["Halberd", "Brigandine"],
    note: "the Sixth District's only remaining export, and it walks to the Fourth to be sold",
    look: "a hardened soldier out of the eastern forests: brigandine over travelling clothes, a "
      + "halberd, an old scar and a bedroll. Professional, unbothered, and nobody's idea of a "
      + "hero"
  },
  {
    name: "Flagellant", type: "npc",
    system: {
      health: { value: 10, base: 10 }, kind: "flagellant", armorBase: 0, speed: 4,
      capabilities: ["legs", "pack", "feral"],
      tactics: ["packTactics", "brute"], targetPriority: "nearest"
    },
    equipped: ["Mace"],
    note: "the Church's most committed, and the Church does not always know where they are",
    look: "stripped to the shoulders under a rough habit, back and shoulders a mess of old and new "
      + "scourging, a knotted cord at the belt and a mace in the hand. Ecstatic rather than "
      + "angry, which is worse"
  },
  {
    name: "Holy Shield", type: "npc",
    system: {
      health: { value: 18, base: 18 }, kind: "holy-shield", armorBase: 4, speed: 3,
      capabilities: ["legs", "brute", "shelter", "drilled"],
      tactics: ["shieldWall", "bodyguard"], targetPriority: "nearest"
    },
    equipped: ["Longsword", "Kite Shield", "Plate", "Great Helm"],
    note: "the Church of the Eternal God's military spearhead, and it does not negotiate",
    look: "a knight of the order in full plate and a great helm, kite shield up, the faith's "
      + "mark on the surcoat. Heavy, closed, and faceless -- the helm has no opening worth "
      + "drawing a face in"
  },
  {
    name: "Black Circle", type: "npc",
    system: {
      health: { value: 14, base: 14 }, kind: "black-circle", armorBase: 2, speed: 3,
      capabilities: ["legs", "stealth", "commander", "wits"],
      tactics: ["ambusher"], targetPriority: "caster"
    },
    equipped: ["Arming Sword", "Mail Shirt"],
    note: "the religious secret police, and it has already spoken to three people about you",
    look: "a plain dark coat over mail, gloves, a flat wide hat, a sheaf of papers in one hand. "
      + "Reads as an official rather than a soldier. The only frightening thing about the figure "
      + "is how unhurried it is"
  },
  {
    name: "Grey Assassin", type: "npc",
    system: {
      health: { value: 10, base: 10 }, kind: "grey-assassin", armorBase: 1, speed: 6,
      capabilities: ["legs", "stealth", "venom", "fast", "wits"],
      tactics: ["ambusher", "skirmisher"], targetPriority: "caster"
    },
    equipped: ["Balanced Dagger", "Blade Venom"],
    note: "the Fourth District's traditional sect, and the central Rote used to be a state",
    look: "a city killer in plain western dress: dark wool coat to the knee, close hood, gloves, "
      + "a thin blade held reversed along the forearm. **Nothing wrapped, no veil, nothing "
      + "eastern about it** -- this is somebody who can stand in a doorway on the Fourth "
      + "District's own streets and be taken for a clerk. Nothing worn on it rattles"
  },
  {
    name: "Mummer", type: "npc",
    system: {
      health: { value: 8, base: 8 }, kind: "mummer", armorBase: 0, speed: 5,
      capabilities: ["legs", "pack", "wits"],
      tactics: ["skirmisher"], targetPriority: "weakest"
    },
    equipped: ["Dagger"],
    note: "a religious procession of the Five that sings, drinks and does not stop for you",
    look: "one reveller in a carved animal mask -- a goat, horns and all -- over ordinary "
      + "festival clothes, with ribbons at the sleeves and a drinking horn in hand. Mid-step and "
      + "mid-song, alone in the frame. The mask is the picture, and it is not a human face"
  },
  {
    name: "Berserker", type: "npc",
    system: {
      health: { value: 14, base: 14 }, kind: "berserker", armorBase: 0, speed: 5,
      capabilities: ["legs", "brute", "fast", "feral"],
      tactics: ["brute"], targetPriority: "nearest"
    },
    equipped: ["Great Axe"],
    note: "drums and dancing first, and by the time it reaches you the drums are still going",
    look: "bare-armed and unarmoured, a great axe in both hands, hair matted and the pupils "
      + "wrong. Pelts at the shoulder rather than armour. Caught mid-stride with no guard up at "
      + "all, because guarding is not part of it"
  },
  {
    name: "Smuggler", type: "npc",
    system: {
      health: { value: 10, base: 10 }, kind: "smuggler", armorBase: 1, speed: 4,
      capabilities: ["legs", "ranged", "stealth", "wits"],
      tactics: ["sniper", "ambusher"], targetPriority: "caster"
    },
    equipped: ["Crossbow", "Leather Armor"],
    note: "the Salt Barons are gone and the routes they ran are not, and somebody still runs them",
    look: "a west-coast sailor turned quiet trader: oilskin, a knitted cap, salt-stained boots, "
      + "a crossbow held low and ready. **The figure and the crossbow and nothing else** -- no "
      + "crates, no barrels, no bundles, no cargo, no quay. The goods are elsewhere, which is "
      + "the point of the trade"
  },
  {
    name: "Guild Engineer", type: "npc",
    system: {
      health: { value: 12, base: 12 }, kind: "guild-engineer", armorBase: 2, speed: 3,
      capabilities: ["legs", "ranged", "siege", "wits"],
      tactics: ["sniper"], targetPriority: "nearest"
    },
    equipped: ["Arquebus", "Brigandine"],
    note: "Fifth District refugees who kept their trade, their language and their lack of a god",
    look: "an engineer caught at the work rather than at the gun: sleeves rolled over a leather "
      + "apron, a cloth cap, both hands on a tool -- a crank, a measuring rod, a length of chain "
      + "-- and the arquebus slung across the back where it is out of the way. Standing upright "
      + "and busy. **No goggles, nothing aimed, nothing braced**"
  },

  /* --- the demons, which were twelve headings with nothing under them --------------------------
   *
   * **Firma gives the names and not one word else.** `### Watchers`, `### Djinn` with `#### Ifrit`
   * and `#### Marid` beneath it, then Gheul, Naga, Div, Estries, Familiars, Incubi/Succubi,
   * Cambion and Imp -- every one an empty heading. This file recorded that as a deliberate absence
   * for as long as it was true: *nothing can be read off a name*.
   *
   * Which was wrong about these particular names. They are not invented words; every one is a real
   * tradition with a body already attached, and the list reads as a deliberate sweep
   * across several of them -- Enochian, Arabic, Persian, Hindu, Jewish and medieval European. So
   * the folklore supplies what the document does not, the same way it did for the trolls.
   *
   * It also settles where they belong. The Fourth District is the Hyena Desert, ruled by emirs
   * from a Ziggurat, and the ghul of Arabic folklore is **a grave demon**: it lives where the
   * dead are buried and it eats what it finds there. The Djinn, the Ifrit, the Marid and the Div
   * all come from the same part of the map. That was already in the geography.
   *
   * The hyena is deliberately not drawn, and it is the one place the folklore was not followed.
   * A ghul takes that shape in some tellings and the desert is named for it -- but on the table a
   * hyena-headed biped is a gnoll, a creature out of a different game entirely, and the drawing
   * came back as one. What the Gheul keeps is the graveyard, which is the part of the folklore
   * nothing else in the roster occupies.
   *
   * They are from the Third Side (Firma: *the demons took over the Third Side*), so none of them
   * is native here -- each one is present because something called it, which is why the sigil is
   * the only thing any of them carries.
   */
  {
    name: "Watcher", type: "npc",
    system: {
      health: { value: 26, base: 26 }, kind: "watcher", armorBase: 2, speed: 5,
      capabilities: ["flight", "caster", "commander", "wits"],
      tactics: ["sniper"], targetPriority: "caster"
    },
    equipped: ["Demon's Sigil"],
    note: "a Grigori: it was set to watch and it came down instead, and it has been here since",
    look: "tall, still and frontal, with far too many eyes -- down the arms, across the chest, "
      + "open in the wings. Not bestial and not beautiful: a watching thing in the shape of a "
      + "person, drawn facing the viewer dead-on, which nothing else in the set does"
  },
  {
    name: "Wanderer", type: "npc",
    system: {
      health: { value: 18, base: 18 }, kind: "wanderer", armorBase: 1, speed: 7,
      capabilities: ["legs", "fast", "transport", "wits"],
      tactics: ["skirmisher"], targetPriority: "weakest"
    },
    equipped: ["Dagger"],
    note: "it is going somewhere and it will take you there whether or not you agreed to come",
    look: "a traveller that does not resolve: layered road clothes, a staff, a pack -- and the "
      + "parts of it furthest from the centre are smeared into motion, as though half of it has "
      + "already left. Never drawn standing still"
  },
  {
    name: "Tempter", type: "npc",
    system: {
      health: { value: 20, base: 20 }, kind: "tempter", armorBase: 1, speed: 4,
      capabilities: ["legs", "caster", "summon", "wits"],
      tactics: ["ambusher"], targetPriority: "caster"
    },
    equipped: ["Demon's Sigil"],
    note: "it has not asked you for anything yet, and it will not ask for the thing it wants",
    look: "immaculate and entirely at ease: good clothes a century out of date, hands open and "
      + "empty, a slight pleasant expression. Nothing visibly wrong until you look for a shadow "
      + "and find it pointing the wrong way"
  },
  {
    name: "Djinn", type: "npc",
    system: {
      health: { value: 24, base: 24 }, kind: "djinn", armorBase: 1, speed: 6,
      capabilities: ["flight", "caster", "spray", "wits"],
      tactics: ["sniper", "skirmisher"], targetPriority: "leader"
    },
    equipped: ["Demon's Sigil", "Fire Spray"],
    note: "bound once, a long time ago, and the terms of it are still being argued over",
    look: "a person, and a whole one: two legs, two feet, two hands, a face that holds still. "
      + "Fine robes actually worn as cloth, gold at the wrists, dark unblinking eyes. **No wind, "
      + "no smoke, no dust, no vapour, nothing trailing off and nothing transparent** -- the only "
      + "thing not human about it is that the heels are a hand's breadth clear of the ground and "
      + "nothing is holding them up"
  },
  {
    name: "Gheul", type: "npc",
    system: {
      health: { value: 14, base: 14 }, kind: "gheul", armorBase: 1, speed: 5,
      capabilities: ["legs", "pack", "drain", "feral"],
      tactics: ["packTactics", "ambusher"], targetPriority: "weakest"
    },
    equipped: ["Draining Bite"],
    note: "it lives where the graves are, and it was at the burial before you were",
    look: "a graveyard demon: man-high and man-shaped and wrong in every joint, grey skin drawn "
      + "tight over the skull, a mouth far too wide for the jaw, no nose to speak of, fingers "
      + "long enough to dig with and used for it. Crouched over turned earth, grave-dirt to the "
      + "elbow. **No animal head at all** -- nothing of the hyena, the dog or the jackal in it"
  },
  {
    name: "Naga", type: "npc",
    system: {
      health: { value: 30, base: 30 }, kind: "naga", armorBase: 3, speed: 4,
      capabilities: ["swim", "grapple", "caster", "wits"],
      tactics: ["grappler", "ambusher"], targetPriority: "nearest"
    },
    equipped: ["Crushing Coils", "Demon's Sigil"],
    note: "it has guarded the same water and the same hoard since before anybody asked it to",
    look: "serpent from the waist down and something close to human above, with a hood of "
      + "scaled skin flared behind the head and heavy jewellery it was not given. Half-submerged, "
      + "coiled rather than swimming"
  },
  {
    name: "Div", type: "npc",
    system: {
      health: { value: 38, base: 38 }, kind: "div", armorBase: 3, speed: 3,
      capabilities: ["legs", "brute", "siege", "feral"],
      tactics: ["brute"], targetPriority: "nearest"
    },
    equipped: ["Burning Grasp"],
    note: "the Shahnameh kind: enormous, horned, and it throws what it is standing next to",
    look: "a giant of the Persian stories: horned, tusked, skin like cracked basalt with heat in "
      + "the splits, far taller than a person and roughly built. Carrying something architectural "
      + "it has just pulled out of the ground"
  },
  {
    name: "Estrie", type: "npc",
    system: {
      health: { value: 16, base: 16 }, kind: "estrie", armorBase: 1, speed: 6,
      capabilities: ["flight", "drain", "stealth", "feral"],
      tactics: ["ambusher"], targetPriority: "weakest"
    },
    equipped: ["Draining Bite"],
    note: "it has to drink, and it has to be let in, and it is very good at the second part",
    look: "a woman at a glance and not on a second look: hair unbound and far too long, moving "
      + "as though in water, feet not quite meeting the ground, mouth dark. The hair is the "
      + "picture -- that is where its strength is kept"
  },
  {
    name: "Familiar", type: "npc",
    system: {
      health: { value: 6, base: 6 }, kind: "familiar", armorBase: 0, speed: 5,
      capabilities: ["legs", "stealth", "wits"],
      tactics: ["skirmisher"], targetPriority: "caster"
    },
    equipped: ["Nip"],
    note: "it belongs to somebody, and finding out who is the actual encounter",
    look: "a hare, and anatomically exactly a hare: **four legs, no more and no fewer**, every "
      + "limb and joint where a hare's belongs. What is wrong is not the body -- it is the "
      + "attention. Pupils that do not match, a person's patience behind them, and it has been "
      + "looking at you for some time. Ordinary at a distance and unbearable close up. Drawn "
      + "sitting upright, watching, not attacking"
  },
  {
    name: "Incubus", type: "npc",
    system: {
      health: { value: 18, base: 18 }, kind: "incubus", armorBase: 1, speed: 5,
      capabilities: ["legs", "caster", "drain", "stealth", "wits"],
      tactics: ["ambusher"], targetPriority: "weakest"
    },
    equipped: ["Demon's Sigil", "Draining Bite"],
    note: "it comes at night and takes a little, and it intends to come back for years",
    look: "beautiful and subtly over-designed -- the proportions a shade too even, the hair too "
      + "deliberate -- bare-shouldered, drawn leaning in from the edge of the frame as though "
      + "over a bed. Small dark horns half-hidden. Nothing exposed that a card could not print"
  },
  {
    name: "Imp", type: "npc",
    system: {
      health: { value: 6, base: 6 }, kind: "imp", armorBase: 0, speed: 7,
      capabilities: ["flight", "fast", "stealth", "wits"],
      tactics: ["skirmisher"], targetPriority: "weakest"
    },
    equipped: ["Nip"],
    note: "the smallest thing the Third Side sends, and the hardest to make leave",
    look: "cat-sized, leathery, bat-winged, all elbows and grin, perched on something it has no "
      + "business perching on. Drawn small in the frame on purpose -- scale is the joke, and it "
      + "is the only thing here that looks like it is enjoying itself"
  },

  /* --- the minor gods, who sit above everything else in this file ------------------------------
   *
   * **They outclass the Queen and they outclass the Dragon, and the Queen is the reason to say so
   * out loud.** She is Health 60 and the top of the roster, and her power is the army -- `summon`
   * and `commander` and a speed of zero. Taken alone she is a large thing that cannot walk. A
   * minor god is the other way round: *demonstrably exists, has mastered ageing, exists on more
   * than one Side and recreates itself unless killed on all of them* (Firma). None of that is a
   * statline, but what it argues for is.
   *
   * So the health band runs to 90 here rather than 60, and six of the eight carry a capability
   * nothing else in the game has at that scale. They are not a tier of monster; they are what a
   * strength-5 spell is for, and **The Great Bargain now holds one for three rounds** rather than
   * a fight, because the price of the difference is that it does not stay.
   *
   * They are roster creatures as well as `MINOR_GODS` entries, and that is not duplication -- the
   * list says who they are to a worshipper, these say what happens if one is standing in front of
   * you. The suite pins that the two agree on all eight names. It also closes a real gap:
   * `resolveConjure` would accept a god's name and build nothing, because it only built things
   * `creaturesByName()` knew about.
   */
  {
    name: "The Winter Lady", type: "npc",
    system: {
      health: { value: 65, base: 65 }, kind: "winter-lady", armorBase: 4, speed: 5,
      capabilities: ["legs", "spray", "caster", "commander", "stealth", "wits"],
      tactics: ["sniper", "ambusher"], targetPriority: "caster"
    },
    equipped: ["Killing Frost", "Elf-Bolt"],
    note: "elf-born, and the Silent are her cult. The cold that arrives before the weather does",
    look: "a tall elven woman made of winter: skin the white of old ice with the grey of it "
      + "underneath, hair and gown drifting upward rather than down, bare feet not melting what "
      + "she stands on. Beautiful, composed, and the air around her visibly colder"
  },
  {
    name: "Queen of the Dark", type: "npc",
    system: {
      health: { value: 70, base: 70 }, kind: "dark-queen", armorBase: 5, speed: 3,
      capabilities: ["burrow", "caster", "summon", "commander", "shelter", "wits"],
      tactics: ["ambusher"], targetPriority: "caster"
    },
    equipped: ["Dark Lantern", "Grave-Cold Hands"],
    note: "what the mole folk go deep enough to find, and she grants to those who manage it",
    look: "an immense seated figure in the dark, more cave formation than body, with a crown of "
      + "rock and a face only suggested. **Alone** -- no mole men, no attendants, no court, "
      + "nothing else alive in the frame; the scale comes from how completely she fills it. The "
      + "one light in the picture is the shuttered lantern in her hand"
  },
  {
    name: "The Troll King", type: "npc",
    system: {
      health: { value: 85, base: 85 }, kind: "troll-king", armorBase: 6, speed: 4,
      capabilities: ["legs", "brute", "siege", "dormant", "commander", "feral"],
      tactics: ["brute"], targetPriority: "nearest"
    },
    equipped: ["Troll Fists", "Thrown Stone"],
    note: "essentially all trolls follow him, and he has been a hill for most of living memory",
    look: "a bergtroll grown past any scale a troll should reach -- a moving ridge of stone-hide "
      + "with full-sized pines rooted along its back and shoulders, a crude iron crown half "
      + "swallowed by the hide it was put on. The trolls around its feet are knee-high"
  },
  {
    name: "Baal Fagor", type: "npc",
    system: {
      health: { value: 68, base: 68 }, kind: "baal-fagor", armorBase: 5, speed: 5,
      capabilities: ["flight", "spray", "brute", "caster", "summon", "feral"],
      tactics: ["brute", "sniper"], targetPriority: "leader"
    },
    equipped: ["Burning Grasp", "Fire Spray", "Demon's Sigil"],
    note: "demon-born, and the Soot Club keep trying to summon him, which is going to work once",
    look: "a demon that became a god: enormous, horned, cracked black hide with fire in every "
      + "split, wings of smoke rather than membrane. Everything within reach of it is already "
      + "burning. Grander and more deliberate than the Div, which is merely large"
  },
  {
    name: "The Land Jelly", type: "npc",
    system: {
      health: { value: 90, base: 90 }, kind: "land-jelly", armorBase: 3, speed: 1,
      capabilities: ["swim", "grapple", "drain", "shelter", "transport", "dormant", "feral"],
      tactics: ["grappler"], targetPriority: "nearest"
    },
    equipped: ["Crushing Coils"],
    note: "older than the elves, and the Dancers need drugs to say anything to it at all",
    look: "a vast translucent mass filling the whole frame, with things suspended inside it that "
      + "are clearly older than the picture -- bones, worked stone, a boat. No face, no front, no "
      + "limbs. The biggest and least animal thing in the set"
  },
  {
    name: "The Cat God", type: "npc",
    system: {
      health: { value: 55, base: 55 }, kind: "cat-god", armorBase: 4, speed: 9,
      capabilities: ["legs", "fast", "stealth", "venom", "reach", "wits"],
      tactics: ["ambusher", "skirmisher"], targetPriority: "weakest"
    },
    equipped: ["Grasping Claws"],
    note: "animal-born, entirely uninterested, and the fastest thing anybody has written down",
    look: "a cat the size of a cart horse and in no way a lion: the exact proportions and "
      + "indifference of a domestic cat, scaled up, sitting. Too many shadows behind it for the "
      + "light in the frame. Nothing about the pose suggests it has agreed to be here"
  },
  {
    name: "Fahlas", type: "npc",
    system: {
      health: { value: 60, base: 60 }, kind: "fahlas", armorBase: 4, speed: 4,
      capabilities: ["legs", "caster", "summon", "commander", "drain", "wits"],
      tactics: ["ambusher"], targetPriority: "caster"
    },
    equipped: ["Grave Candle", "Arming Sword"],
    note: "the necromancer king of Saag et Haar: four hundred years old and still holding court",
    look: "a human king who did not stop: court dress four centuries out of fashion and perfectly "
      + "kept, a thin dry face that is still a face, a circlet. **One figure and nothing else** "
      + "-- no court, no attendants, no standing dead anywhere in the frame, and he is alone in "
      + "it. The "
      + "only minor god you could mistake for a living man"
  },
  {
    name: "Mother Longhand", type: "npc",
    system: {
      health: { value: 72, base: 72 }, kind: "mother-longhand", armorBase: 4, speed: 5,
      capabilities: ["legs", "reach", "grapple", "caster", "stealth", "feral"],
      tactics: ["grappler", "ambusher"], targetPriority: "weakest"
    },
    equipped: ["Grasping Claws", "Elf-Bolt"],
    note: "a nature spirit that kept growing: the forest has an owner and she is further off "
      + "than she looks",
    look: "a ra grown enormous and wrong: the bark-and-moss body of a skogsra on a frame three "
      + "times too tall, with arms that reach most of the way across the picture and hands at "
      + "the end of them bigger than a person. The hollow back is still there"
  }
];

/**
 * And the rest of the roster, tagged and not numbered.
 *
 * **Capabilities without statblocks**, which is a deliberate half: the deck a creature would draw
 * is computable from these alone, so the pool can be checked against the whole roster while only
 * two groups carry numbers. A creature here is written down, not built -- and the validator counts
 * them so the difference cannot be mistaken for completeness.
 *
 * The twelve demons are **not here at all**: Firma.md gives Watchers, Wanderers, Tempters, Djinn,
 * Gheul, Naga, Div, Estries, Familiars, Incubi/Succubi, Cambion and Imp as names with no
 * description. Nothing can be read off a name, so nothing is claimed.
 */
export const MONSTER_TAGS = [



];

/**
 * Variants: a base, and a handful of deltas.
 *
 * **A variant draws a different deck, which is the whole reason this is a scheme rather than a
 * naming convention.** A deck is the subset of the intent pool a creature's capabilities earn, so a
 * Goblin Archer with `ranged` draws *Loose* and a spearman does not -- where today the two share one
 * deck and both throw rocks, which is the defect this fixes rather than inherits.
 *
 * Numbers are **deltas and never absolutes**, so correcting a base moves every variant with it and
 * the goblin-as-unit calibration holds across the roster. `+cap` adds and `-cap` removes; a missing
 * field is the base's.
 *
 * `kind` is its own for each variant, because `kind` is what owns a deck and an intent card
 * (actor-schema 5): sharing it is sharing the turn.
 */
export const VARIANTS = {
  /* --- the goblins, who were the whole roster until now ---------------------------------------
   *
   * The spearman keeps the numbers that were simulated. Everything here is a delta from him, which
   * is also the honest way to say that none of these four has been simulated at all.
   */
  goblin: [
    {
      name: "Goblin Warrior", kind: "goblin-warrior",
      health: 3, armour: 1, caps: ["+brute", "+drilled", "-wits"], tactics: ["+shieldWall", "-cowardly"],
      gear: ["Goblin Spear", "Goblin Shield"], priority: "nearest",
      note: "the one that does not run: a shield, a shell of discipline, and no Cower"
    },
    {
      name: "Goblin Archer", kind: "goblin-archer",
      caps: ["+ranged"], tactics: ["+sniper"], gear: ["Goblin Shortbow"], priority: "caster",
      note: "it earns Loose by being able to shoot, which the spearman cannot"
    },
    {
      name: "Goblin Shaman", kind: "goblin-shaman",
      health: 1, speed: -1, caps: ["+caster"], tactics: ["+tainting"],
      gear: ["Goblin Fetish"], priority: "weakest",
      signature: { condition: "cursed", duration: 2 },
      note: "the elves taught it enough glamour to be dangerous and not enough to be free"
    },
    {
      name: "Goblin Chief", kind: "goblin-chief",
      health: 6, armour: 1, caps: ["+commander", "+drilled", "-wits"], tactics: ["+commander", "-cowardly"],
      gear: ["Goblin Spear", "Goblin Shield"], priority: "leader",
      note: "kill it and the Cower comes back to everybody else"
    }
  ],

  /* --- the Horde ------------------------------------------------------------------------------ */
  "flat-bug": [
    {
      name: "Flat Bug Shieldline", kind: "flat-bug-shield",
      health: 2, armour: 1, speed: -1, caps: ["+shelter"], tactics: ["+shieldWall"],
      priority: "nearest",
      note: "the front rank, which is where the Horde's armour actually is"
    },
    {
      name: "Flat Bug Runner", kind: "flat-bug-runner",
      health: -1, armour: -1, speed: 2, caps: ["+fast", "+feral", "-drilled"], tactics: ["+skirmisher", "-shieldWall"],
      note: "sent ahead to find out where you are, and dies finding out"
    }
  ],
  scrip: [
    {
      name: "Scrip Watcher", kind: "scrip-watcher",
      speed: 1, caps: ["+stealth"], tactics: ["+ambusher"],
      note: "the one that is still watching after you killed the others"
    }
  ],
  sweeper: [
    {
      name: "Sweeper Diver", kind: "sweeper-diver",
      health: -2, speed: 2, caps: ["+stealth"], tactics: ["+ambusher"], priority: "caster",
      note: "it comes down on whoever is concentrating"
    },
    {
      name: "Sweeper Carrier", kind: "sweeper-carrier",
      health: 4, speed: -1, caps: ["+transport"], gear: ["Nip"],
      note: "it is carrying something, and the something is the encounter"
    }
  ],
  mantiss: [
    {
      name: "Mantiss Veteran", kind: "mantiss-veteran",
      health: 6, armour: 1, caps: ["+grapple"], tactics: ["+grappler"],
      note: "it has done this before and takes you out of the fight first"
    }
  ],
  "smash-beetle": [
    {
      name: "Smash Beetle Breaker", kind: "smash-beetle-breaker",
      health: 8, armour: 1, speed: -1,
      note: "bred bigger for the gates of the Third Ring, and it does not turn quickly"
    }
  ],
  "rush-spider": [
    {
      name: "Rush Spider Rider", kind: "rush-spider-rider",
      health: 4, caps: ["+pack"], tactics: ["+packTactics"],
      note: "carrying a Mole Man, which is two statblocks arriving as one problem"
    }
  ],
  slitherer: [
    {
      name: "Slitherer Brood", kind: "slitherer-brood",
      health: -3, speed: 1, caps: ["+pack"], tactics: ["+packTactics"],
      signature: { condition: "poisoned", intensity: 1, duration: 2 },
      note: "smaller, and there are always more of them than you counted",
      look: "is smaller and leaner, the same animal at two-thirds the size, and it is drawn "
        + "alone -- the others it travels with are not in the picture"
    }
  ],
  stinger: [
    {
      name: "Stinger Drone", kind: "stinger-drone",
      health: 4, caps: ["+spray"], gear: ["Acid Spray"], tactics: ["+sniper"],
      note: "the sting became a nozzle somewhere in the hive's history"
    }
  ],
  "blind-worm": [
    {
      name: "Blind Worm Elder", kind: "blind-worm-elder",
      health: 10, armour: 1, caps: ["+grapple"], tactics: ["+grappler"],
      note: "old enough to have learned that a held thing stops moving and stops being felt",
      look: "is longer and thicker and the same purplish red, jaws at one end and the body simply "
        + "ending at the other. ONE BODY AND NO TAIL: no second tapering limb, no stinger, "
        + "nothing trailing"
    }
  ],
  "armored-slug": [
    {
      name: "Armored Slug Spitter", kind: "armored-slug-spitter",
      health: -4, armour: -1, speed: 1, caps: ["+ranged"], priority: "caster",
      note: "thinner shell, longer reach of acid: it is here to ruin somebody's concentration"
    }
  ],
  "five-legs": [
    {
      name: "Five Legs Adjutant", kind: "five-legs-adjutant",
      health: -3, caps: ["+summon"], tactics: ["-packTactics"],
      note: "it does not fight at all: it calls the next wave"
    }
  ],
  "terror-fly": [
    {
      name: "Terror Fly Torch", kind: "terror-fly-torch",
      health: -4, caps: ["-commander", "+feral", "-drilled"], tactics: ["-commander", "+sniper"],
      signature: { condition: "burning", intensity: 3, duration: 2 },
      note: "all the fire and none of the authority"
    }
  ],
  pincer: [
    {
      name: "Pincer Marshal", kind: "pincer-marshal",
      health: 10, armour: 1, caps: ["+summon"],
      note: "a general who can call for more is the fight not ending",
      look: "the largest armoured form in the Horde, heavy pincers held high and a thick plated hood "
        + "over the front. NO FLAGS, no banners, no standards, no insignia, no cloth of any kind"
    }
  ],
  processor: [
    {
      name: "Processor Driller", kind: "processor-driller",
      health: 2, caps: ["+burrow", "+siege"], gear: ["Mandibles"],
      note: "what the Horde uses instead of a siege engine, and the reason walls fall from below"
    }
  ],
  skaah: [
    {
      name: "Skaah Bloated", kind: "skaah-bloated",
      health: 20, armour: -1, speed: -1, caps: ["+spray"], gear: ["Acid Spray"],
      note: "full, low and leaking: it is going to come down somewhere"
    }
  ],

  /* --- the burrowers -------------------------------------------------------------------------- */
  "mole-beast": [
    {
      name: "Mole Beast Tusker", kind: "mole-beast-tusker",
      health: 8, armour: 1, caps: ["+siege"], tactics: ["+brute"],
      note: "the one the mole men dig behind"
    }
  ],
  "mole-man": [
    {
      name: "Mole Man Digger", kind: "mole-man-digger",
      caps: ["+siege"], gear: ["Mole Pick"], tactics: ["-packTactics"],
      note: "it is not fighting you, it is getting through the floor you are standing on",
      look: "carries a MOLE PICK: a short-hafted single-bladed digging pick, the haft cut short for "
        + "swinging in a tunnel. Not a spear, not a polearm, not a lamp"
    },
    {
      name: "Mole Man Priest", kind: "mole-man-priest",
      health: 2, speed: -1, caps: ["+caster"], gear: ["Dark Lantern"], priority: "weakest",
      tactics: ["+tainting"],
      signature: { condition: "cursed", duration: 2 },
      note: "the Queen of the Dark grants to those who go deep enough, and it has",
      look: "carries a DARK LANTERN and nothing else: a shuttered lantern in one hand, one slit "
        + "open. No staff, no rod, no crook -- both arms and both hands whole and unpierced"
    }
  ],
  burrower: [
    {
      name: "Burrower Brood Mother", kind: "burrower-mother",
      health: 12, armour: 1, speed: -2, caps: ["+summon", "-transport"],
      note: "it stopped being a steed when it started laying"
    }
  ],

  /* --- people, where a variant is usually a rank or a rival church ---------------------------
   *
   * **Two of these are not upgrades, and that is the point.** The Holy Sword and God's Spirit are
   * the Church of the Eternal Spirit's answers to the Holy Shield and the Black Circle -- the same
   * job for the other faith, which is how Firma describes them: each church lists a knightly order
   * and a secret police in its own groupings, and the two churches are the First District's
   * standing argument. Statting them as variants says they are the same creature wearing the
   * other badge, which is both cheaper and truer than writing them twice.
   */
  townsfolk: [
    {
      name: "Mob", kind: "mob",
      health: 4, speed: 1, caps: ["+brute"], tactics: ["+packTactics", "-cowardly"],
      priority: "nearest",
      note: "the moment townsfolk stop running is the moment they become a different problem",
      look: "the same working people, no longer leaving: faces front, hands full of whatever was "
        + "to hand -- a hayfork, a cobble, a bottle. Drawn as a press of bodies with no space "
        + "between them, and they are not all the same person: different ages, different "
        + "colours, men and women together. Frightened and coming anyway. **This is the one "
        + "creature in the roster that is deliberately more than one body**"
    }
  ],
  "town-guard": [
    {
      name: "Watch Sergeant", kind: "watch-sergeant",
      health: 4, armour: 1, caps: ["+commander"], tactics: ["+commander"],
      gear: ["Halberd", "Mail Shirt", "Light Helm"], priority: "leader",
      note: "twenty years on the same four streets, and it knows which door you came out of",
      look: "an older watchman with a halberd and a mail shirt instead of a spear and a coat, a "
        + "sergeant's sash and a horn at the belt. Shouting rather than fighting"
    }
  ],
  bandit: [
    {
      name: "Highwayman", kind: "highwayman",
      health: 2, armour: 1, speed: 2, caps: ["+ranged", "+fast", "-pack"],
      tactics: ["+skirmisher", "-packTactics"],
      gear: ["Matchlock Pistol", "Arming Sword", "Brigandine"], priority: "caster",
      note: "it works a road rather than a camp, and it owns a horse and a pistol and a good coat",
      look: "mounted-class robbery: a long riding coat, boots to the knee, a scarf to the eyes "
        + "and a matchlock pistol levelled. Better dressed than the band it came from, which is "
        + "the whole of its character"
    }
  ],
  cultist: [
    {
      name: "Cult Priest", kind: "cult-priest",
      health: 6, armour: 1, caps: ["+commander"],
      gear: ["Carved Idol", "Mace"], priority: "weakest",
      note: "the one the small god actually speaks to, or says it does, which is the same thing",
      look: "the same plain robes with one piece of real finery on top -- a heavy pectoral, a "
        + "painted stole, a crown of something -- and the carved idol held overhead rather than "
        + "cradled. Eyes closed, mouth open mid-word. Alone in the frame -- the crowd it is "
        + "talking to is not in the picture"
    }
  ],
  mercenary: [
    {
      name: "Mercenary Captain", kind: "mercenary-captain",
      health: 6, armour: 1, caps: ["+commander"], tactics: ["+commander", "-bodyguard"],
      gear: ["Greatsword", "Brigandine", "Great Helm"], priority: "leader",
      note: "it is paid for the squadron and not for itself, and it fights like somebody counting",
      look: "the same hard soldier with a greatsword and a closed helm under one arm, a captain's "
        + "sash and a whistle. Older, scarred across the hands, and watching the field rather "
        + "than the man in front of it"
    }
  ],
  flagellant: [
    {
      name: "Ecstatic", kind: "ecstatic",
      health: 4, speed: 1, caps: ["+fast"], tactics: ["+skirmisher"],
      gear: ["Warhammer"], priority: "caster",
      note: "it has stopped feeling the scourge, which the order takes as proof rather than worry",
      look: "further gone than the rest: the habit discarded entirely, the body a map of old "
        + "scarring, a warhammer in both hands and the head thrown back. Running, not marching"
    }
  ],
  "holy-shield": [
    {
      name: "Holy Sword", kind: "holy-sword",
      /* `commander` rather than another brute: Firma calls it the faith's military SPEARHEAD,
       * and without it this fought exactly like a Mercenary down to the tactic pair.
       *
       * **And it carries a sword, which it is named for.** The first pass armed it with a pike
       * and took `+reach` to match -- a defensible way to tell it from the Holy Shield, and the
       * one thing an order called the Holy SWORD cannot be holding. The longsword comes back,
       * `reach` goes with the pike, and what separates the two knights is now what it should
       * have been: the Shield has a shield and holds a line, the Sword has neither and gives
       * the orders. */
      speed: 1, caps: ["-shelter", "+commander"],
      tactics: ["-shieldWall", "+commander"],
      gear: ["Longsword", "Mail Shirt", "Great Helm"], priority: "leader",
      note: "the Eternal Spirit's order of knights, and the Holy Shield's oldest argument",
      look: "the other church's knight: mail rather than plate, **a longsword held in both "
        + "hands** and no shield at all, a surcoat with a different mark on it. Lighter, faster "
        + "and visibly poorer -- the two orders are not equally funded and both of them know it"
    }
  ],
  "black-circle": [
    {
      name: "God's Spirit", kind: "gods-spirit",
      speed: 1, caps: ["+fast", "-commander"], tactics: ["+skirmisher"],
      gear: ["Balanced Dagger", "Leather Armor"], priority: "weakest",
      note: "the Eternal Spirit's own secret police, and it does not bring papers",
      look: "where the Black Circle looks like an official, this looks like nobody: ordinary "
        + "travelling clothes, no insignia, no hat, hands empty until they are not. The one in "
        + "the room you would not describe afterwards"
    }
  ],
  "grey-assassin": [
    {
      name: "The Purple", kind: "purple",
      health: 2, speed: -1, caps: ["-fast"], tactics: ["+sniper", "-skirmisher"],
      gear: ["Crossbow", "Blade Venom", "Serpent's Milk"], priority: "leader",
      note: "the sect's poison experts: it would rather not be in the room when it works",
      /* The crossbow stays in the kit and leaves the picture, which is the one place in the
       * roster where those two come apart. It is a poisoner: the vials are what the token has to
       * say at sixty pixels, and a crossbow laid beside them read as the subject instead. The
       * statline still carries it, because that is what a player loots. */
      look: "the same plain western coat, in deep purple-dyed wool and better cut, hood back, "
        + "kneeling over a flat case of stoppered vials open across one knee. **No crossbow "
        + "anywhere in the picture, and no blade either** -- the vials are the whole of it. "
        + "Working rather than stalking"
    },
    {
      name: "The Unseen", kind: "unseen",
      /* No `bodyguard`: that is a drilled tactic and this is `wits`. It waits; it does not hold. */
      health: 2, armour: 1, caps: ["-venom"], tactics: ["-skirmisher"],
      gear: ["Dagger", "Leather Armor"], priority: "caster",
      note: "an order of assassins that walks the church's path, which it considers a distinction",
      look: "a western monastic at a glance -- plain habit, cord belt, hood up, hands inside the "
        + "sleeves -- and nothing about the stance belongs to a monk. The dagger is not visible "
        + "and is obviously there"
    }
  ],
  smuggler: [
    {
      name: "Salt Baron", kind: "salt-baron",
      health: 6, armour: 1, caps: ["+commander", "+pack"], tactics: ["+packTactics"],
      gear: ["Matchlock Pistol", "Arming Sword", "Fine Clothes"], priority: "leader",
      note: "the association is a hundred years dead and the title is still worth killing over",
      look: "a west-coast magnate gone slightly to seed: a good coat over sea-weathered skin, "
        + "rings, a pistol worn openly on the hip. Standing on a quay as though it were owned, "
        + "because at one point it was"
    }
  ],
  "guild-engineer": [
    {
      name: "Artillerist", kind: "artillerist",
      /* Likewise: a gun on a rest is not a shield wall, whatever it looks like from the front. */
      health: 2, armour: 1, speed: -1, caps: ["+reach"],
      gear: ["Matchlock Musket", "Brigandine"], priority: "leader",
      note: "the Fifth District built the trains and the sea defences, and this is what is left",
      look: "the same engineer, but down behind a long musket on a forked rest and sighting along "
        + "it: shoulders low, cheek to the stock, goggles down over the eyes, a second charge "
        + "between the teeth. The gun is the whole silhouette where the Engineer's was the tools"
    }
  ]
};


/**
 * The creatures that are people.
 *
 * **Named here because the art layer has to ask, and because the answer is not derivable.** A
 * Mercenary and a Div are both two-legged and roughly person-shaped; only one of them is a human
 * being out of this world's own streets, and nothing in a statline says which. Variants are not
 * listed: a Watch Sergeant is a Town Guard, and the art layer already knows which base a variant
 * belongs to.
 *
 * It exists for one job. Every human token came back as the same person -- a pale man in his
 * thirties -- because each piece is drawn in its own request with no sight of the others, so a
 * prompt saying *vary this* has nothing to vary against. The art layer assigns a sex, an ancestry
 * and an age per creature instead, and it needs to know which creatures the question applies to.
 *
 * The rest of the bestiary is deliberately out of it: an alf is Nordic, a div is Persian, a keres
 * is Greek and a gheul comes out of Arabic folklore. Those have an ancestry already, written into
 * what they are, and reassigning it would be a different kind of wrong.
 */
export const HUMAN_KINDS = [
  "townsfolk", "town-guard", "bandit", "cultist", "mercenary", "flagellant", "holy-shield",
  "black-circle", "grey-assassin", "mummer", "berserker", "smuggler", "guild-engineer",
  /* And the one outside the group: half of a Dhampir is a living man, and *a living person,
   * which is the point* is the first line of its description. */
  "dhampir"
];


/**
 * Features. A passive feature is simply true and stays small; anything that would swing a fight
 * needs a recharge. `grants` holds the flat traits the derived stats read -- those are NOT
 * bonus-grouped, because a group caps bonuses to one action while these change a standing number.
 */
export const FEATURES = [
  /*
   * --- six features that help a skill check, one per approach ---
   *
   * **The schema has held `bonus.approach` since tools were built and no feature ever used it**,
   * so step 3 of a check (skill-rules 2) had nothing to add even after the engine was repaired to
   * look in the right field. These are what it reads.
   *
   * All six are **+1 and grouped**, which is what keeps them from being the thing that breaks the
   * ladder: a group caps one bonus per action (core-rules 5), so two features of one approach do
   * not stack, and a trained tool still adds beside them because a tool is a different half of the
   * sum. One point is also exactly what the audit found levelling was worth to a check -- these
   * double that, rather than replacing the arithmetic with a bigger number.
   */
  {
    name: "Hard Hands", group: "training",
    text: "+1 on Might checks. Lifting, breaking, and not letting go.",
    bonus: { approach: "might", value: 1 }
  },
  {
    name: "Light Step", group: "training",
    text: "+1 on Agility checks. Where to put a foot, decided before you need it.",
    bonus: { approach: "agility", value: 1 }
  },
  {
    name: "Quiet Worker", group: "training",
    text: "+1 on Shadow checks. Slowly is quietly, and you have the patience for it.",
    bonus: { approach: "shadow", value: 1 }
  },
  {
    name: "Quick Eye", group: "training",
    text: "+1 on Wits checks. You notice the thing that is about to happen.",
    bonus: { approach: "wits", value: 1 }
  },
  {
    name: "Well Read", group: "training",
    text: "+1 on Lore checks. Somebody has written this down, and you have read them.",
    bonus: { approach: "lore", value: 1 }
  },
  {
    name: "Good Name", group: "training",
    text: "+1 on Presence checks. People have heard of you, and most of it was good.",
    bonus: { approach: "presence", value: 1 }
  },
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
    /*
     * **The two fields the roster reads, on the one creature that was measured.** `speed` is what
     * `move` with no number means on an intent card, and `capabilities` is what earns a card its
     * place in this creature's deck -- so the goblin's three squares and its pack instinct are now
     * the same kind of statement as a dragon's wings.
     */
    speed: 3,
    capabilities: ["legs", "pack", "wits"],
    tactics: ["packTactics", "cowardly"],
    targetPriority: "weakest"
  },
  equipped: ["Goblin Spear"]
};

/** Same deck, same type, different gear -- which is the point of NPCs drawing values from items. */
/**
 * **The archer is a variant now, and that is a repair rather than a tidy-up.**
 *
 * It used to be a second statblock identical to the spearman -- same Health, same armour, same
 * tactics, the same `kind`, and therefore **the same intent deck**: both drew *Throw Rock*, so the
 * melee goblin shot as often as the archer did and the archer differed only by holding a bow.
 *
 * As a delta it differs where it should: `+ranged` earns it *Loose* from the pool, `sniper` changes
 * how it picks, `caster` priority sends it after whoever is concentrating, and its own `kind` gives
 * it its own intent. Derived from the base so the two cannot drift apart again.
 */
export const GOBLIN_ARCHER = applyVariant(GOBLIN, VARIANTS.goblin
  .find(v => v.kind === "goblin-archer"));

/**
 * Every base creature in the game, in one list.
 *
 * The goblin is declared below the table rather than inside it, because it is older than the table
 * and `createStarterContent` builds it by name -- but it belongs to the roster, and it is the only
 * creature in it whose numbers were measured rather than reasoned, so everything else is a ratio to
 * this entry (sim/analysis-2026-10-21.md onward).
 */
export const ROSTER = [GOBLIN, ...MONSTERS];

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
    name: "Rain", strength: 2, kind: "formula", source: "Elemental Magic", element: "water",
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
    name: "Lightning", strength: 2, kind: "formula", source: "Elemental Magic", element: "storm",
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
    name: "Frost", strength: 1, kind: "formula", source: "Elemental Magic", element: "frost",
    description: "<p>One target, one round, no damage. Against a Wet target the water is already "
      + "there to freeze, so the save goes from Normal to Heroic and nothing else changes.</p>",
    effect: {
      range: 3,
      condition: "slowed", duration: 1, resist: "agility", dc: 5,
      when: { needs: "wet", dc: 9 }
    }
  },
  {
    name: "Scorch", strength: 1, kind: "formula", source: "Elemental Magic", element: "fire",
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
/**
 * The one Shadow Magic formula the documents specify, here because `wilds` would otherwise be a
 * field with nothing in it. Its teleport is a sentence: **movement is manual everywhere in this
 * engine** (core-rules 12), so a step across the room is adjudicated exactly as a Move 3 is.
 *
 * What is NOT a sentence is the price, and that is the point of carrying it.
 */
export const SHADOW_FORMULAS = [
  {
    name: "Step Through", strength: 2, kind: "formula", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep"],
    description: "<p>You are in the shadow, and then you are in another one. Every reach into the "
      + "dark leaves something of the dark in you: a <strong>Wild</strong> card joins your fate "
      + "deck, and it does not leave until you have slept.</p>",
    effect: { text: "teleport to any shadowed square you can see" }
  }
];

export const ENCOUNTERS = [
  { label: "3 goblins with spears", difficulty: "Easy", winRate: "99.4%" },
  { label: "4 goblins with spears", difficulty: "Moderate", winRate: "93.2%" },
  { label: "5 goblins with spears", difficulty: "Hard", winRate: "75.9%" },
  { label: "4 goblins, 2 spears + 2 bows", difficulty: "Deadly", winRate: "64.6%" }
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

/* -------------------------------------------- */
/*  The two Way pools                           */
/* -------------------------------------------- */

/**
 * way-cards.md 3.2 and 3.3: the cards a Way's **minor** nodes draw from. Until now every minor node
 * in both Ways granted one of the six common cards, which made the backbone identical in a Way
 * about position and a Way about weight.
 *
 * **`needs` means the engine would have to compute something and cannot.** It does not mean "the
 * engine does not do this": Move is never resolved by the engine at all -- figures are pushed around
 * by hand (core-rules 11) -- so *ignoring difficult ground*, *through enemy squares* and *push 2* are
 * complete cards with a sentence the table applies, not gaps. Drawing that line is what makes the
 * column worth counting, and it moves one Signature (*Over and Past*) from gap to built.
 *
 * Roll With It (Shade) and Set Spear (Strength) are not repeated here: both have been in WAY_CARDS
 * since the reach weapons and the reaction row were built.
 */
export const SHADE_POOL = [
  {
    /*
     * The best setter in the game, and it should be: the only one that works at ANY range. Marked
     * is a *call* rather than a state (core-rules 7), which is why it takes no save -- you cannot
     * resist somebody's opinion of you, you can only wait for them to stop saying it.
     */
    name: "Call the Shot", copies: 1, pool: "shade", needs: [],
    primary: [{ verb: "strike" }],
    secondary: [{ condition: "marked", duration: 1 }],
    text: "Marked on any enemy you can see, at any range."
  },
  {
    name: "Between the Plates", copies: 1, pool: "shade", needs: [],
    /* The Mark IS the gap, so the ignore hangs off the opening rather than off the step. It was
     * `text: "ignores armor"` inside the clause, which printed correctly and did nothing. */
    primary: [{ verb: "strike", when: { needs: "marked", ignoresArmour: true } }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Take the Shot", copies: 1, pool: "shade", needs: [],
    primary: [{
      verb: "strike", mod: 1, requires: { tag: "ranged" },
      when: { needs: "marked", advantage: true }
    }],
    secondary: [{ verb: "move", param: 2 }]
  },
  {
    name: "Pin the Shadow", copies: 1, pool: "shade", needs: [],
    primary: [{
      verb: "strike", requires: { tag: "ranged" },
      condition: "slowed", duration: 1, resist: "agility", dc: 5,
      when: { needs: "marked", dc: 7 }
    }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Cut and Run", copies: 1, pool: "shade", needs: [],
    primary: [{ verb: "strike" }, { verb: "move", param: 2 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Light Feet", copies: 1, pool: "shade", needs: [], reaction: "sidestep",
    primary: [{ verb: "move", param: 3 }],
    secondary: [{ verb: "move", param: 2 }],
    text: "Ignoring difficult ground."
  },
  {
    name: "Slip the Knot", copies: 1, pool: "shade", needs: [], reaction: "sidestep",
    primary: [{ verb: "move", param: 2 }],
    secondary: [{ verb: "shake", param: 1 }]
  },
  {
    /*
     * The requirement is on BOTH halves, because the card is about the knife rather than about the
     * throw: a Second Knife thrown from a greatsword is not a thing, and neither is the follow-up.
     */
    name: "Second Knife", copies: 1, pool: "shade", needs: [],
    primary: [{ verb: "strike", range: 3, requires: { tag: "light" } }],
    secondary: [{ verb: "strike", mod: -1, requires: { tag: "light" } }]
  },
  {
    name: "Mock", copies: 1, pool: "shade", needs: [],
    primary: [{ condition: "dazed", duration: 1, resist: "presence", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Sleight", copies: 1, pool: "shade", needs: [], reaction: "use",
    primary: [{ verb: "use" }, { verb: "strike" }],
    secondary: [{ verb: "ready" }]
  },
  {
    name: "Vanish", copies: 1, pool: "shade", needs: [],
    primary: [{ condition: "invisible", duration: 1 }],
    secondary: [{ verb: "move", param: 2 }],
    costs: { primary: { strain: 1 } },
    text: "On yourself."
  },
  {
    name: "Smoke and Go", copies: 1, pool: "shade", needs: [],
    primary: [{ condition: "invisible", duration: 1 }, { verb: "move", param: 2 }],
    secondary: [{ verb: "use" }],
    costs: { primary: { spent: true } },
    text: "On yourself."
  }
];

/**
 * way-cards 3.2. Weight, armor, Block, adjacency and the Wound threshold are the levers the major
 * nodes own; these touch them without taking them.
 *
 * Three of the fourteen read **Off-Balance** and each reads it differently -- more damage, a harder
 * save on a condition the card was already attempting, and the same again on a longer one. That is
 * the whole of the reader table, deliberately, so the band has worked instances rather than an
 * assertion.
 */
export const STRENGTH_POOL = [
  {
    name: "Shoulder Check", copies: 1, pool: "strength", needs: [],
    primary: [{ verb: "strike" }],
    secondary: [{ condition: "offBalance", duration: 1 }],
    text: "Adjacent."
  },
  {
    name: "Shield Bash", copies: 1, pool: "strength",
    needs: ["a Strike that deals no damage"], reaction: "block",
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "No damage: push 2 and step into the square it left."
  },
  {
    name: "Hammerblow", copies: 1, pool: "strength", needs: [],
    primary: [{ verb: "strike", when: { needs: "offBalance", mod: 2 } }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Sweep the Leg", copies: 1, pool: "strength", needs: [],
    primary: [{
      verb: "strike", condition: "prone", duration: 1, resist: "agility", dc: 5,
      when: { needs: "offBalance", dc: 9 }
    }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    /*
     * Possibly the strongest card in the document, and the saving throw is what carries it:
     * Grappled (2) costs its victim 18.3 points of win rate against a mixed group, because blocking
     * Move is blocking the most valuable thing a figure does (sim/analysis-2026-10-30.md 7).
     */
    name: "Overbear", copies: 1, pool: "strength", needs: [],
    primary: [{
      condition: "grappled", duration: 2, resist: "might", dc: 5,
      when: { needs: "offBalance", dc: 7 }
    }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Shield Wall", copies: 1, pool: "strength",
    needs: [], reaction: "block",
    primary: [{ verb: "defend" }],
    /* The second half is the card: a Defend that also reaches the man beside you. */
    secondary: [{ verb: "defend" }, { verb: "block", param: 1, area: 1 }]
  },
  {
    /*
     * `bothHands` is held in two hands NOW, not an item that could take two -- so the Ready on the
     * secondary is the card's own answer to being dealt it with a shield up.
     */
    name: "Two-Hand It", copies: 1, pool: "strength", needs: [],
    primary: [{ verb: "strike", mod: 2, requires: { bothHands: true } }],
    secondary: [{ verb: "ready" }]
  },
  {
    name: "Heave", copies: 1, pool: "strength",
    needs: ["a Move that ignores your own encumbrance"],
    primary: [{ verb: "move", param: 2 }],
    secondary: [{ verb: "ready" }],
    text: "Carrying any weight without being Slowed."
  },
  {
    /*
     * No printed reaction, although way-cards 3.2 prints Brace. Brace is the floor under a card
     * that prints NOTHING (core-rules 3), so printing it is the one spelling that could switch it
     * off -- the same correction Dig In needed.
     */
    name: "Armoured Advance", copies: 1, pool: "strength",
    needs: ["a transient bonus to armour"],
    primary: [{ verb: "move", param: 3 }],
    secondary: [{ verb: "move", param: 1 }],
    text: "Your armor counts +1 until your next turn."
  },
  {
    /*
     * The clause names Prone and Grappled, which are NOT openings -- so it is card text rather than
     * a `when` clause, exactly as cards.mjs says it should be: that clause is for a setup worth
     * nothing on its own, and being Prone already does plenty.
     */
    name: "Pull Them Down", copies: 1, pool: "strength", needs: [],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "strike", mod: -1 }],
    text: "The secondary only against a Prone or Grappled target."
  },
  {
    name: "Beat the Blade", copies: 1, pool: "strength", needs: [],
    primary: [{
      verb: "strike", condition: "disarmed", duration: 1, resist: "might", dc: 5
    }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Roar", copies: 1, pool: "strength",
    needs: ["a condition applied to an area"],
    primary: [{ condition: "compelled", duration: 1, resist: "presence", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }],
    costs: { primary: { strain: 1 } },
    text: "Every adjacent enemy."
  },
  {
    /* Brace by printing nothing, as above. */
    name: "Walk It Off", copies: 1, pool: "strength", needs: [],
    primary: [{ verb: "heal", param: 2 }, { verb: "shake", param: 2 }],
    secondary: [{ verb: "move", param: 1 }],
    costs: { primary: { spent: true } },
    text: "On yourself."
  }
];

/* -------------------------------------------- */
/*  Way of Shade's Signatures and Tactics       */
/* -------------------------------------------- */

/**
 * The twelve Signatures (rules/way-cards.md 2.2), as content a node can actually grant.
 *
 * `kind` says which document it becomes -- an action card, a feature slate or an item slate -- and
 * it must match the key the granting node uses, or the node names one thing and hands over another.
 *
 * `needs` is the honest part. A Signature whose effect the engine cannot work out is not a bug to
 * hide behind prose: it is a named gap, and this column is the Way of Shade engine backlog read off
 * the content rather than guessed at. Three of the twelve are fully computable; the other nine each
 * name exactly what is missing, and the validator asserts that list so closing one shows up.
 *
 * The three defects worth knowing, all of them the shape this project keeps meeting, and all three
 * now **[FIXED]**:
 *
 *   - **Foresee was a named effect nobody implemented.** The first reading of this was wrong: it is
 *     not a missing *verb*, because core-rules 6 says Foresee "needs no icon of its own" -- it is a
 *     named effect, like Taunt and Stabilize. What was missing was the effect itself, so Foresee
 *     now sits in `CARDRPG.effects` beside Heal and Blast, and `resolveForesee` whispers one NPC
 *     type's intent card to the player. Point Man's remaining gap is narrower and real: the *extra*
 *     type needs to know who is furthest forward, which no engine computes.
 *   - **Heckle was a reaction *"when an enemy acts"*, which is not a trigger.** There are two
 *     events in the game, a hit landing and an enemy arriving. The identical defect was already
 *     fixed on *Quick Hands*, whose trigger used to be "any time on another's turn" -- and the cure
 *     is the same: point it at a real event. It fires on **arrival** now, which is the moment it
 *     reads best, since the enemy walks into reach and attacks on the same turn.
 *   - **Lift collided with `resolveLift`, which does something else.** The engine's removed a
 *     *condition* from a target; the Cutpurse's *Lift* steals a *card* from their deck. Same word,
 *     two mechanics, like `range` meaning both thrown range and melee reach. The published card
 *     keeps its name and the function is `liftCondition`.
 */
export const SHADE_SIGNATURES = [
  {
    /*
     * The Way's keystone, and the one that needed a new field rather than a new mechanism: the
     * card-level `when` clause names ONE opening on purpose, and a build whose whole claim is "I
     * hit whatever you set up" needs any of them. Openings were already a computed list in config
     * and nothing read it at the feature level.
     */
    name: "The Opening", kind: "feature", node: "shade.thief", needs: [],
    text: "Advantage against anyone carrying an opening -- whoever set it.",
    advantage: { vsOpening: true }
  },
  {
    name: "Point Man", kind: "card", node: "shade.scout",
    needs: ["the extra type, which needs to know who is furthest forward"],
    primary: [{ verb: "foresee" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "While you are the furthest forward of your party, Foresee one extra type."
  },
  {
    name: "Named", kind: "card", node: "shade.duellist",
    needs: ["a reaction that also Strikes"],
    primary: [{ verb: "strike" }],
    secondary: [{ condition: "marked", duration: 1 }],
    reaction: "parry",
    text: "Name one enemy. Against it, your Parry also Strikes for 1."
  },
  {
    name: "One Opening", kind: "card", node: "shade.assassin",
    needs: ["doubling, and a clause that reads any opening"],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    costs: { primary: { spent: true } },
    text: "Against a target that is unaware or carrying an opening, the damage is doubled."
  },
  {
    name: "Lift", kind: "card", node: "shade.cutpurse",
    needs: ["taking a card from another deck"],
    /* The name is the card's. The engine's condition-removal is `liftCondition` now. */
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "On a hit, take one card from the target's own deck. It is yours now, and it is in your "
      + "deck for good."
  },
  {
    /*
     * An item rather than a card or a feature, and the only Signature that is. Weight 3 you may
     * never put down IS the Burglar's price (Preparation / weight) expressed as a thing you carry,
     * which is why it reads as an item and not as a sentence.
     */
    /* No price: a Signature is granted, not bought -- and `cost` is a SPELL's field anyway, which
     * is why this one was dropped on the way into the document rather than stored as zero. */
    name: "The Kit", kind: "item", node: "shade.burglar", needs: [],
    slot: "pack", weight: 3,
    text: "You may never put it down. Every Hard physical obstacle becomes Normal."
  },
  {
    name: "Loose and Step", kind: "card", node: "shade.archer", needs: [],
    primary: [{ verb: "strike", requires: { tag: "ranged" } }, { verb: "move", param: 1 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "Set", kind: "card", node: "shade.trapmaker",
    /* The gap this card was queued under was "placing a trap on a square", and `ground` is that:
     * a shape, a square, and a trap the first to enter sets off. What the trap DOES is the step's
     * own condition and the Strike value it borrows. */
    needs: [],
    primary: [{
      verb: "ready", condition: "slowed", intensity: 2,
      ground: { shape: "square", effects: ["trap"] },
      text: "an adjacent square; the first enemy to enter takes your Strike value"
    }],
    secondary: [{ verb: "ready" }],
    text: "Place a trap on an adjacent square."
  },
  {
    name: "Over and Past", kind: "card", node: "shade.acrobat",
    needs: ["moving through an occupied square"],
    primary: [{ verb: "move", param: 3 }],
    secondary: [{ verb: "move", param: 1 }],
    reaction: "sidestep",
    text: "You may move through enemy squares."
  },
  {
    name: "Heckle", kind: "card", node: "shade.bard", needs: [],
    primary: [{ condition: "heckled", duration: 1, resist: "presence", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }],
    reaction: "heckle",
    text: "An enemy arriving next to you draws fate with disadvantage until your next turn."
  },
  {
    name: "Double or Nothing", kind: "card", node: "shade.gambler",
    needs: ["two fate draws that both apply"],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "Draw two fate cards -- both apply, added together. Variance, not advantage."
  },
  {
    /*
     * The slots are on the NODE, not here. A number carried by a granted slate is a number in a
     * document, and a document can be deleted; a number on a node is derived every time the sheet
     * is prepared and cannot drift (rules/leveling.md 9). So a Signature feature carries the text
     * and the node carries the figure -- which the validator enforces for all of them.
     */
    name: "One Trick", kind: "feature", node: "shade.half-mage", needs: [],
    text: "You may prepare from any one school you have ever seen cast."
  }
];

/**
 * The twelve Tactics (way-cards 2.5): a standing feature that makes a different **position**
 * correct, always on and never a number.
 *
 * **These are not granted.** way-cards says *you only ever have your deepest title's*, so a Tactic
 * is a property of the title you currently hold, not a slate you accumulate -- otherwise a
 * Cutpurse-Gambler would carry both. It is derived in `graph.mjs` beside the title itself, from
 * this table, keyed by the Tactic's name as the node prints it.
 */
export const TACTICS = {
  "Never Where You Looked":
    "An enemy that attacks you and misses may not attack you again this round.",
  "Furthest Forward":
    "While no ally is nearer the enemy than you, you have cover from every figure on the field, "
    + "not only those in the line.",
  "One at a Time":
    "While exactly one enemy is adjacent to you, it has disadvantage against you and you have "
    + "advantage against it.",
  "From Behind": "You have advantage against any enemy that is adjacent to one of your allies.",
  "Light Fingers":
    "The first time each fight you end your turn adjacent to an enemy that has not attacked you, "
    + "take one item from its belt.",
  "Through the Window":
    "You ignore difficult ground, and no enemy blocks your movement in a square that holds an "
    + "obstacle.",
  "Overwatch":
    "Once a round, when an enemy ends its movement in your line of sight and within range, "
    + "Strike it as a reaction.",
  "The Ground You Chose":
    "Every square you have occupied this fight is difficult ground for your enemies.",
  "Never Cornered":
    "When you are attacked, you may Move 1 as a reaction before damage is worked out.",
  "The Running Commentary":
    "An enemy within 3 of you that would draw fate with advantage draws normally instead.",
  "The Long Odds":
    "While two or more enemies are adjacent to you, you draw fate with advantage.",
  "One Hand Free":
    "You may Cast with a weapon in your other hand. Casting never needs a hand free."
};

/* -------------------------------------------- */
/*  Way of Strength's Signatures and Tactics    */
/* -------------------------------------------- */

/**
 * The twelve of way-cards.md 2.1, in the same shape as Shade's: `kind` says which document it
 * becomes, and `needs` names what the engine lacks when it lacks something.
 *
 * **way-cards says two of these "cost the rules nothing at all". One does.** *Interpose* really is
 * free: the `bodyguard` reaction and `redirectHit` were written into the reaction order before any
 * node claimed them, so the card is the claim and nothing else. *Cleave to the Bone* is not, and
 * the reason is worth having: the Wound threshold is a **constant read in two places**, one of them
 * the reaction policy, and moving it to *4 for this attacker* means threading the attacker's number
 * into `chooseReaction` -- which is the function whose whole virtue is that it has no tuned
 * constants in it. One number, two readers, and a signature change. Not nothing.
 *
 * *Interpose* also closes a gap the validator has been reporting since reactions were built: the
 * `bodyguard` reaction was the one nothing in the content printed.
 */
export const STRENGTH_SIGNATURES = [
  {
    /*
     * The Infantry Signature, and the whole Way's thesis: standing next to somebody is worth
     * something. It was prose from the day it was written and is now two steps.
     */
    name: "Shoulder to Shoulder", kind: "card", node: "strength.infantry",
    needs: [],
    primary: [{ verb: "strike" }, { verb: "block", param: 1, area: 1 }],
    secondary: [{ verb: "move", param: 1 }]
  },
  {
    name: "The Wall", kind: "feature", node: "strength.guardian",
    needs: ["an exception to highest-wins, which no bonus group has"],
    text: "Your Blocks stack. You are the one exception to highest-wins."
  },
  {
    /*
     * Built, and it is the node that earned Way of Strength its new resource: the Way root pays in
     * weight now, and this is the build that wants to be over the limit. Armour and encumbrance are
     * both already derived, so doubling one when the other says Overloaded is a line in
     * prepareDerivedData rather than a mechanism.
     */
    name: "Nothing Gets Through", kind: "feature", node: "strength.ironclad", needs: [],
    text: "While you are Overloaded, your armor counts double.",
    armor: { doubleWhenOverloaded: true }
  },
  {
    /*
     * A sixth card wanted the field, and the check written to confirm the other five is what found
     * it: "Ranged." was the first word of its text, doing nothing. Its own gap is the rest of that
     * sentence, so this one is half closed and still carries a `needs`.
     */
    name: "Ranging Shot", kind: "card", node: "strength.artillerist",
    needs: ["the Blast alternative, which has to know you did not Move"],
    primary: [{ verb: "strike", area: 1, areaKind: "aimed", requires: { tag: "ranged" } }],
    secondary: [{ verb: "ready" }],
    text: "Blast instead of Aimed, if you did not Move this turn."
  },
  {
    /*
     * The fourth reaction in the documents whose trigger is not an event -- after Quick Hands,
     * Heckle and the Bard's old wording. "On an ally's turn" is a span, not a moment. The game has
     * `allyHit`, which is a moment, but it is not this one.
     */
    name: "On My Call", kind: "card", node: "strength.tactician",
    /* Two things in one string until the column became a list, which is what a list is for. */
    needs: ["a reaction trigger on an ally's turn", "swapping a card's halves"],
    primary: [{ verb: "ready" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "On an ally's turn: they may play a card in their hand halves swapped, its secondary as a "
      + "primary."
  },
  {
    name: "Cleave to the Bone", kind: "feature", node: "strength.executioner",
    needs: ["the Wound threshold as the attacker's, where the reaction policy reads a constant"],
    text: "For you, the Wound threshold is 4, not 5."
  },
  {
    name: "The Lance", kind: "card", node: "strength.knight",
    needs: ["advantage conditional on how far you moved"],
    primary: [{ verb: "move", param: 3 }, { verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    text: "Advantage if you moved at least 2. Needs the mount."
  },
  {
    name: "Red Mist", kind: "card", node: "strength.berserker",
    needs: ["drawing back up to hand size mid-turn"],
    primary: [{ verb: "strike" }],
    secondary: [{ verb: "move", param: 1 }],
    costs: { primary: { spent: true } },
    text: "Then draw back up to your hand size at once."
  },
  {
    name: "Loaded Before the Bell", kind: "feature", node: "strength.musketeer",
    needs: ["a loaded state to begin a fight in, since reload is still prose"],
    text: "You begin every combat already loaded, and the first shot of a fight is +2."
  },
  {
    name: "Play to the Crowd", kind: "card", node: "strength.gladiator",
    needs: ["a reaction that grants Block and applies a condition"],
    primary: [{ condition: "compelled", duration: 1, resist: "presence", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }],
    text: "When you are hit: gain Block 2, and the attacker is Compelled (1) -- no save, because "
      + "you have already been hit once."
  },
  {
    name: "Get a Grip", kind: "card", node: "strength.street-fighter",
    needs: ["waiving a save when both hands are empty"],
    primary: [{ condition: "grappled", duration: 2, resist: "might", dc: 5 }],
    secondary: [{ verb: "move", param: 1 }],
    text: "No save at all if both your hands are empty."
  },
  {
    /*
     * Free, and the only Signature in either Way that was already implemented before it was
     * written down: core-rules 3's redirection step and `redirectHit` are this card. Printing it
     * also closes the one reaction nothing in the content carried.
     */
    name: "Interpose", kind: "card", node: "strength.bodyguard", needs: [],
    primary: [{ verb: "defend" }],
    secondary: [{ verb: "move", param: 1 }],
    reaction: "bodyguard",
    text: "Take a hit meant for an adjacent ally."
  }
];

/**
 * Way of Strength's Tactics (way-cards 2.5), derived from the deepest title like Shade's.
 *
 * **Infantry's was renamed.** The document called both its Signature and its Tactic *Shoulder to
 * Shoulder*, so a player would hold a card and carry a standing feature with one name doing two
 * different things -- the card grants an ally Block, the tactic stops either of you being moved.
 * *The Line* is what the tactic is about, and it sits beside Guardian's *The Door* in register.
 */
export const STRENGTH_TACTICS = {
  "The Line":
    "While an ally is adjacent to you, neither of you can be moved against your will.",
  "The Door":
    "An enemy adjacent to you that would move to another square adjacent to you must stop instead. "
    + "You do not pin them; you stop them getting past.",
  "Immovable": "Forced movement never moves you, and difficult ground costs you nothing.",
  "Ranging": "If you did not Move this turn, your ranged attacks ignore cover.",
  "The Call":
    "At the start of a round, name a square. The first ally to end movement there draws fate with "
    + "advantage on their next action.",
  "No Second Thought":
    "When an enemy drops to 0 Health from your Strike, Move 1 at once.",
  "The Charge":
    "If you moved 3 or more squares in a straight line this turn, your Strike cannot be answered by "
    + "a reaction.",
  "Forward Only":
    "You may never move away from the nearest enemy -- and while two or more enemies are adjacent "
    + "to you, you cannot be Dazed or Compelled.",
  "The Firing Step":
    "You may not Strike an adjacent enemy at all -- and your ranged attacks never take the "
    + "ranged-in-melee penalty.",
  "The Crowd Wants Blood":
    "While you are the nearest target to the enemy, your reactions fire even when the hit is not "
    + "serious.",
  "The Alley":
    "While both your hands are empty, an enemy adjacent to you may not Move away except by forced "
    + "movement.",
  "Never Leave Them":
    "When an ally moves, you may Move 1 as a reaction to follow -- and figures never block that "
    + "move."
};

/* -------------------------------------------- */

/**
 * Way of Mind's minor-node formulas (way-cards 3.4).
 *
 * **A minor node grants its TIER-1 school's formula, never the destination's**, and that is the
 * whole of leveling.md 7's note about this Way: *the only cross edges worth wanting in Mind would
 * arrive at a school's deeper nodes -- formulas without the school's cost, the forbidden kind.* A
 * node on the run from Blood Magic to Necromancy is still a Blood node, so it hands out Blood's
 * list. You cannot buy a necromancer's formulas without buying the Taint that pays for them.
 *
 * Elemental Magic needed none of these: **Rain, Lightning, Frost and Scorch already exist**
 * (`FORMULAS`, written to demonstrate the combo mechanic), so its four runs hand those over and the
 * Rain-plus-Lightning pair is reachable by levelling for the first time rather than by fiat.
 *
 * Some of these are dearer than a young caster's whole budget -- *The Red Hour* is 4 against the
 * three slots this branch has granted by then. That is deliberate and it is what a spell book is
 * for: **the book holds what the budget cannot**, and the slots that arrive later are what make it
 * castable. A formula is never wasted, only unprepared.
 */
export const MIND_POOL = [
  {
    name: "Open the Vein", strength: 1, pool: "mind", source: "Blood Magic",
    /*
     * Not the armour gap: `ignores` comes off armour and never off Block, which core-rules 5 is
     * explicit about -- so going round a shield is a second field. It is read now, and the
     * description has stopped being a claim the engine contradicted.
     */
    needs: [],
    cost: { health: 1 },
    description: "<p>Your own blood, thrown. It goes round a shield rather than through it.</p>",
    effect: { verb: "cast", range: 2, mod: 3, ignoresBlock: true }
  },
  {
    /*
     * The one piece of content the Health cost finished outright, and it is worth knowing why:
     * everything else on the list wanted a second thing as well. A condition with a saving throw
     * is the oldest finished part of the engine, so this had only ever been waiting on the price.
     */
    name: "Boil", strength: 3, pool: "mind", source: "Blood Magic",
    needs: [],
    cost: { health: 2 },
    description: "<p>Not your blood this time. Theirs, and it does not stop.</p>",
    effect: {
      verb: "cast", condition: "burning", intensity: 3, duration: 2, resist: "might", dc: 7
    }
  },
  {
    /*
     * The only card or formula in the game that grants a second primary, which is what Blood
     * Magic's axis means: Tempo is bought with blood and nothing else buys it at all.
     */
    name: "The Second Heartbeat", strength: 3, pool: "mind", source: "Blood Magic",
    needs: ["a second primary in one turn"],
    cost: { health: 4 },
    description: "<p>Two hearts for one turn. The second one is paid for.</p>",
    effect: { text: "Spent: play a second primary this turn" }
  },
  {
    name: "The Red Hour", strength: 4, pool: "mind", source: "Blood Magic",
    /* A Health cost per ALLY, so the same variable price The Shield Line pays and the same gap. */
    needs: [],
    description: "<p>You open a vein for each of them, and for an hour nobody is tired.</p>",
    cost: { health: 1, scale: "perAlly" },
    effect: { range: 2, duration: 1, targets: "alliesInRange",
    text: "every ally within 2 may play a second secondary" }
  },

  {
    name: "The Small Pact", strength: 1, pool: "mind", source: "Spiritualism",
    needs: [],
    description: "<p>Name the god you are pacted with, and it does the thing written on the pact. "
      + "The same thing, every time &mdash; which is what makes this a spell and not a wish.</p>",
    effect: { text: "the god grants the favour written on your pact" }
  },
  {
    name: "Hold to the Bargain", strength: 2, pool: "mind", source: "Spiritualism",
    /*
     * The card that proved a merged gap can be three jobs: it wanted a RESOLVER, not a trigger,
     * because nothing in the engine resolved a skill check. Now something does, and the trigger
     * it needed fell out of the resolver the way `cast` fell out of casting.
     */
    needs: [],
    reaction: "bargain",
    description: "<p>It was going to fail. Something intervened, once, because it owes you.</p>",
    effect: {
      timing: "reaction", oncePer: "pactPerFight",
      targets: "oneAlly",
      text: "an ally's failed check becomes a Partial"
    }
  },
  {
    name: "The Nine Names", strength: 1, pool: "mind", source: "Spiritualism",
    needs: [],
    description: "<p>Out of combat. A minor god names who in this place it is angry with, and will "
      + "not say why.</p>",
    effect: { timing: "outOfCombat", text: "a minor god names who here it is angry with" }
  },
  /**
   * **[PLACEHOLDER]** One spell so `shape` is written by content as well as read by the engine --
   * a field nothing writes is the same defect as a field nothing reads.
   *
   * The Doomfly is named because it is in the roster and it flies, which is the clearest thing a
   * borrowed shape can be worth. Spiritualism is the school because the minor gods *are* a hundred
   * or so nature spirits (Firma.md) and this is asking one for the loan of its body. Replace the
   * creature, the strength and the name freely: what the increment settles is the mechanism.
   */
  {
    name: "The Borrowed Body", strength: 3, pool: "mind", source: "Spiritualism",
    needs: [],
    description: "<p>A spirit lends you its shape. Your deck, your Health and whatever is wrong "
      + "with you come along &mdash; a body is what you fight with, not who you are.</p>",
    effect: {
      verb: "shape", duration: 2,
      /* Both hands, which is the whole point of being a fly: every weapon, shield and implement
       * you were carrying is on the floor until you are yourself again. */
      shape: { transformation: "Doomfly", quarantine: { slots: ["hands"] } }
    }
  },
  {
    name: "The Gathered Pact", strength: 4, pool: "mind", source: "Spiritualism",
    needs: [],
    description: "<p>Every pact at once, called in on the same turn. Each god does exactly what it "
      + "promised and no more, which is why this is worth four slots and not five.</p>",
    effect: { text: "every god you are pacted with grants its written favour, this turn" }
  },

  /*
   * Blood Magic's thesis, and the one formula whose PRICE the engine cannot state. Every other
   * Health cost in the game is a number (`cost.health`); this one is half of whatever you have
   * left, so it is cheap when you are winning and nearly suicide when you are not. That is the
   * spell. A fixed number would be a different card.
   */
  {
    name: "The Last Drop", strength: 5, pool: "mind", source: "Blood Magic",
    needs: ["a whole turn taken again, now",
      "a Health cost that is a fraction of what you have left"],
    description: "<p>You will not be standing afterwards. You will have had two turns.</p>",
    cost: { health: 1, scale: "halfCurrent" },
    effect: { text: "take your whole turn again, now" }
  },

  /*
   * --- Necromancy, five formulas, and every one of them taints ---
   *
   * The school prices itself and the arithmetic is the point: a bound Taint per formula, three
   * Taint is Afflicted (core-rules 8), so a necromancer who learns four of these cannot stand up.
   * Nobody balanced that; it falls out of the price. The gap is the same string on all five,
   * because a gap shared by five formulas is one piece of work.
   */
  {
    name: "Grave Chill", strength: 2, pool: "mind", source: "Necromancy",
    needs: ["a spell that taints its caster", "a condition applied to an area"],
    description: "<p>The cold that comes off a body, aimed. Two squares of it, and everything in "
      + "them is slow to understand what happened.</p>",
    effect: {
      verb: "cast", area: 2, areaKind: "aimed",
      condition: "dazed", duration: 1, resist: "might", dc: 5
    }
  },
  {
    name: "The Long Preparation", strength: 1, pool: "mind", source: "Necromancy",
    needs: ["a spell that taints its caster",
      "a bonus against one enemy type, named before the fight"],
    description: "<p>You read about them the night before. It is not insight; it is homework, and "
      + "it only works on the thing you did it for.</p>",
    effect: { timing: "beforeFight", text: "name one enemy type: your Casts against it are +2 all fight" }
  },
  {
    /*
     * Out of combat, three questions, and the engine has nothing to do. A corpse answering is the
     * GM's job in the same way Move is the table's -- so this is a FINISHED formula with one gap,
     * and the gap is the price rather than the spell.
     */
    name: "Ask the Dead", strength: 1, pool: "mind", source: "Necromancy",
    needs: ["a spell that taints its caster"],
    description: "<p>It answers three questions truthfully, as far as it knew &mdash; which is "
      + "usually less than you hoped and occasionally much more.</p>",
    effect: { timing: "outOfCombat", text: "a corpse answers three questions, as truthfully as it knew" }
  },
  {
    name: "The Risen Rank", strength: 4, pool: "mind", source: "Necromancy",
    needs: ["a spell that taints its caster"],
    description: "<p>Every body within three squares, up at once, for one round. Then they are "
      + "bodies again, and the ground is worse than it was.</p>",
    effect: {
      verb: "conjure", range: 3, duration: 1,
      /* The rank is a number the player and the GM settle from what is actually lying there;
       * what this card fixes is the one round, which is what it costs for being a rank. */
      conjure: { creature: "" },
      text: "corpses rise, and fall again when the round ends"
    }
  },
  {
    /*
     * The school's 5, and its price is the only one in the game that grows while the spell is
     * still running: a Taint for every round your friend stayed up. Stopping early is a decision
     * the caster makes against their own deck, which is what makes this Preparation.
     */
    name: "The Grave's Bargain", strength: 5, pool: "mind", source: "Necromancy",
    needs: ["a spell that taints its caster", "a price that grows for every round an effect lasts"],
    description: "<p>They stand up at one Health, and they are themselves, and they know. When "
      + "the fight ends they are dead again, and you are a little less alive for it.</p>",
    effect: {
      verb: "conjure",
      conjure: { creature: "", upkeep: { taint: 1 } },
      /* The one thing no field carries: it is an ALLY's body, and they come back at 1. */
      targets: "oneAlly",
      text: "a dead ally, and they stand at 1 Health"
    }
  },

  /*
   * --- Elemental Magic, five more, and the one that belongs to no sphere ---
   *
   * [FOUND IN CODE] *Flesh of the Earth* is an ACID formula in a school with four spheres --
   * fire, frost, storm, water (config.mjs) -- and acid is none of them. Earth is not an element an
   * elementalist may hold, so this formula cannot read "your element" the way the two Sphere
   * spells do: it is the school's one element-free formula and its `element` is blank on purpose.
   *
   * That is not a defect in the engine. `Corrode` is a built effect and the formula resolves; what
   * it cannot be is EXCLUSIVE, which is the whole point of holding a sphere.
   */
  {
    name: "Flesh of the Earth", strength: 2, pool: "mind", source: "Elemental Magic",
    needs: [],
    description: "<p>Acid, which is nobody's sphere. It eats the armour as well as the man, and "
      + "the man notices second.</p>",
    effect: {
      verb: "cast", range: 3, condition: "burning", intensity: 1, duration: 2,
      text: "and Corrode 1: it eats the armour as well as the man"
    }
  },
  {
    /*
     * Water used sideways, and the shortest proof that this school's axis is Position: it deals
     * nothing, saves nothing, and takes a man out of a grapple he was going to lose.
     */
    name: "Slippery", strength: 1, pool: "mind", source: "Elemental Magic", element: "water",
    needs: [],
    description: "<p>Not enough water to drown in. Exactly enough to be impossible to hold.</p>",
    effect: {
      verb: "shake", param: 1, condition: "grappled", range: 2,
      text: "until your next turn they cannot be Grappled again"
    }
  },
  {
    name: "The Sphere Entire", strength: 4, pool: "mind", source: "Elemental Magic",
    needs: [],
    description: "<p>Five squares of whichever sphere is yours, and standing in it costs you "
      + "something every turn you stay.</p>",
    effect: {
      range: 3, area: 5,
      ground: { shape: "area", effects: ["difficult", "cover"], damage: 2 },
      /* The element stays prose because the caster picks it, and which one it is changes nothing
       * the engine does to the ground. */
      text: "of your element"
    }
  },
  {
    name: "The Standing Flood", strength: 3, pool: "mind", source: "Elemental Magic",
    element: "water",
    needs: [],
    description: "<p>Deep water where there was a floor. Everything in it is Wet, which is the "
      + "opening half this school is built to set up.</p>",
    effect: {
      range: 3, area: 3, condition: "wet", intensity: 2,
      ground: { shape: "area", effects: ["difficult"] },
      text: "deep water: and its Move is halved"
    }
  },
  {
    /*
     * The school's 5, and the only spell in the game that is as often worse for the caster as for
     * the enemy: the line does not care which side asked for it.
     */
    name: "Unmake the Ground", strength: 5, pool: "mind", source: "Elemental Magic",
    needs: [],
    description: "<p>A line across the battlefield that is no longer there. For the rest of the "
      + "fight, nobody crosses it &mdash; you included, which is the half of this that gets "
      + "casters killed.</p>",
    effect: {
      targets: "everyone",
      ground: { shape: "line", effects: ["impassable"] },
      text: "all fight"
    }
  },

  /*
   * --- Poison, six formulas, and a price the engine DOES keep ---
   *
   * Skill cards set aside, equal to the strength (specializations.md 2) -- which is a price on the
   * deck a character makes checks with, and the engine keeps that deck (data/actors.mjs). So it is
   * a gap rather than a sentence, and it is the same gap six times.
   *
   * Everything else in this school is a condition with a saving throw, which is the oldest
   * finished part of the engine. Four of the six need nothing else at all.
   */
  {
    name: "Slick", strength: 1, pool: "mind", source: "Poison",
    cost: { skillCards: 1 },
    needs: ["skill cards set aside to pay for a formula"],
    description: "<p>Oil of something. No save: a man whose feet have gone is not resisting "
      + "anything.</p>",
    effect: { range: 3, condition: "offBalance", duration: 1 }
  },
  {
    name: "The Quick Dose", strength: 3, pool: "mind", source: "Poison",
    cost: { skillCards: 3 },
    needs: ["skill cards set aside to pay for a formula"],
    description: "<p>Adjacent, because it has to go in them. Two rounds, two damage a round, and "
      + "armour is no part of the conversation.</p>",
    effect: {
      verb: "cast", condition: "poisoned", intensity: 2, duration: 2, resist: "might", dc: 7
    }
  },
  {
    /*
     * Poisoned 0 -- all nausea, no damage -- is why `intensity` has a floor of 0 rather than 1
     * (data/cards.mjs). This is the formula that floor was written for, and it was written before
     * this one existed to need it.
     */
    name: "The Long Dose", strength: 1, pool: "mind", source: "Poison",
    cost: { skillCards: 1 },
    needs: ["skill cards set aside to pay for a formula"],
    description: "<p>No damage at all. Three rounds of a man who cannot use his off hand, which "
      + "in a fight is worse than three damage and lasts longer.</p>",
    effect: {
      verb: "cast", range: 2, condition: "poisoned", intensity: 0, duration: 3,
      resist: "might", dc: 5
    }
  },
  {
    name: "The Grey Sickness", strength: 2, pool: "mind", source: "Poison",
    cost: { skillCards: 2 },
    needs: ["skill cards set aside to pay for a formula"],
    description: "<p>Not a poison. A disease, which is the difference between a bad afternoon and "
      + "something still with them next week.</p>",
    effect: {
      verb: "tainting", param: 1, resist: "might", dc: 7, text: "slow: a disease, not a poison"
    }
  },
  {
    name: "The Shared Cup", strength: 4, pool: "mind", source: "Poison",
    cost: { skillCards: 4 },
    needs: ["skill cards set aside to pay for a formula", "a condition applied to an area"],
    description: "<p>Everyone who drank. Three rounds of it, over three squares, and the save is "
      + "the only mercy in the formula.</p>",
    effect: {
      verb: "cast", area: 3, areaKind: "aimed",
      condition: "poisoned", intensity: 1, duration: 3, resist: "might", dc: 7
    }
  },
  {
    /*
     * The school's 5, and the only price in the game that is REFUNDED: kill the man and you set
     * nothing aside. A poisoner who finishes the job pays nothing, and one who does not pays five
     * skill cards -- which is the school's axis, Control, written as a bill.
     */
    name: "The Kingmaker's Draught", strength: 5, pool: "mind", source: "Poison",
    cost: { skillCards: 5 },
    needs: ["skill cards set aside to pay for a formula",
      "a price refunded when the target dies carrying the condition"],
    description: "<p>Three rounds of three, no save, and no cost at all if it finishes him. If it "
      + "does not, you have paid five cards for an angry survivor who knows your face.</p>",
    effect: {
      condition: "poisoned", intensity: 3, duration: 3,
      text: "no save. If it dies while poisoned, set aside no skill cards for this formula"
    }
  },

  /*
   * --- Glamour, seven formulas, and the school the engine was readiest for ---
   *
   * An elven debt is the price, and nobody computes a debt -- the GM holds it, the way a secret and
   * a pact are held -- so it is not in the gap column (way-cards 3.4). What is left is conditions
   * and saving throws, and three of the seven need nothing at all.
   *
   * **Blessed and Cursed exist and nothing cast them** (way-cards 1.7), which was true of Cursed
   * until this list: *A Word for You* blesses and nothing anywhere cursed. *The Evil Eye* is the
   * other half of a pair that has been half-built since conditions.md was written.
   */
  {
    name: "Wrong Face", strength: 2, pool: "mind", source: "Glamour",
    needs: [],
    description: "<p>Your face is briefly somebody they were not expecting. Two rounds of trying "
      + "to work out what they are looking at.</p>",
    effect: { verb: "cast", condition: "dazed", duration: 2, resist: "wits", dc: 7 }
  },
  {
    name: "The Evil Eye", strength: 2, pool: "mind", source: "Glamour",
    needs: [],
    description: "<p>A temporary Miss in their fate deck, until it is drawn. The condition "
      + "shuffles the card in by itself (core-rules 6), which is why the pair of these needed no "
      + "mechanism of their own.</p>",
    effect: { range: 3, condition: "cursed" }
  },
  {
    name: "Ink Spray", strength: 1, pool: "mind", source: "Glamour",
    needs: ["ending a condition over a whole area",
      "a condition nobody may gain for a round"],
    description: "<p>Two squares of ink in the air. Nobody in it is invisible, and nobody in it "
      + "is going to be.</p>",
    effect: {
      verb: "blast", area: 2,
      text: "end Invisible in the area, and nothing in it may become Invisible until your next turn"
    }
  },
  {
    /*
     * The ending is built -- `shake` has ended a named condition since the first potion -- and the
     * second half is not. Granting ONE ally an extra secondary is not the job *The Red Hour* wants
     * (every ally in an area, at a Health cost per head), so it is a second gap rather than the
     * same one worded twice: building this would finish this card and not that one.
     */
    name: "A Clear Head", strength: 1, pool: "mind", source: "Glamour",
    needs: ["an ally granted an extra secondary this turn"],
    description: "<p>You say the thing they needed to hear, and they come back to themselves in "
      + "time to do something about it.</p>",
    effect: {
      verb: "shake", param: 1, condition: "dazed", range: 3,
      text: "and they may play a secondary this turn even if they already have"
    }
  },
  {
    name: "The Crowded Room", strength: 4, pool: "mind", source: "Glamour",
    needs: ["an enemy that attacks its own side"],
    description: "<p>For one round nobody can tell who is who, and the fate deck decides who "
      + "swings at whom. It is as likely to help them as you.</p>",
    effect: {
      text: "until your next turn every enemy attacks a random figure in reach, chosen by a "
        + "fate draw"
    }
  },
  {
    name: "The Face of a Friend", strength: 3, pool: "mind", source: "Glamour",
    needs: ["an enemy that counts you as an ally"],
    description: "<p>It will not attack you. It will take a hit meant for you. It will do both "
      + "until the moment you attack it, and then it will remember everything.</p>",
    effect: {
      range: 3,
      targets: "oneEnemy",
      text: "one enemy treats you as an ally -- it will not attack you and will take a hit for "
        + "you -- until you attack it"
    }
  },
  {
    /*
     * The school's 5 and the only one of the eighty-five that has no combat behaviour at all. That
     * is Glamour's thesis: the fight you do not have is the one a glamourist wins.
     */
    name: "The Long Masquerade", strength: 5, pool: "mind", source: "Glamour",
    needs: [],
    description: "<p>Out of combat: you and your whole party are other people for a day. Only "
      + "magic sees through it, and most places have none.</p>",
    effect: {
      timing: "outOfCombat", text: "you and your whole party appear to be other people for a day"
    }
  },

  /*
   * --- Tattoo Magic, seven teachings, and not one of them is a formula ---
   *
   * **A tattoo is never prepared**, and that one fact decides what these are. *A thing usable
   * without being equipped or prepared is a feature* -- so all seven are features, and the school
   * is the one school in the game that teaches no spells.
   *
   * They kept `kind: "spell"` for a long time because a spell was the only slate with a **step**,
   * and a tattoo needs a step: the bonus it gives rides on the `graven` condition, which is what
   * ink in your skin IS. That was the tail wagging the dog. A feature has a step now, and what a
   * spell has that a feature does not is `prepared` -- nothing these seven will ever use.
   *
   * `strength` stays, as the school's ladder and the GM's price. It is no longer a slot cost,
   * because a feature has no budget to spend; what it costs you is the secret the GM writes down,
   * which is not a cost in the engine's sense at all. It is a hostage.
   */
  {
    name: "Graven Eye", kind: "feature", strength: 1, pool: "mind", source: "Tattoo Magic",
    needs: ["a trait that stops you being surprised",
      "a spell slot spent for good"],
    description: "<p>An eye on the back of your neck that is not decorative. You are never "
      + "surprised again, and you never sleep quite as well.</p>",
    effect: { text: "you are never surprised" }
  },
  {
    name: "Graven Shield", kind: "feature", strength: 2, pool: "mind", source: "Tattoo Magic",
    needs: ["a spell slot spent for good"],
    description: "<p>A shield you cannot put down, drawn across your back by somebody who knew "
      + "what they were doing.</p>",
    /* No step at all: what it does is a grant, and a feature is permanent without saying so. */
    grants: { armor: 1 }
  },
  {
    name: "Graven Road", kind: "feature", strength: 1, pool: "mind", source: "Tattoo Magic",
    needs: ["a trait that ignores a halved Move",
      "a spell slot spent for good"],
    description: "<p>A road down the inside of both legs. Slowed, Burdened and Overloaded all "
      + "still land on you; none of them slows you down.</p>",
    effect: { text: "your Move is never halved" }
  },
  {
    /*
     * The one tattoo with a drawback rather than a price, and it is a drawback the engine would
     * have to tell a lie to carry: Burdened is DERIVED from what you are carrying (data/actors.mjs),
     * so a Burdened that an empty pack does not lift is a second mechanism wearing its name.
     */
    name: "Graven Armour", kind: "feature", strength: 4, pool: "mind", source: "Tattoo Magic",
    needs: ["Burdened that no amount of dropping weight lifts",
      "an encumbrance tier set by something other than weight",
      "a spell slot spent for good"],
    description: "<p>Plate, in ink, over everything. It weighs nothing and you are never again "
      + "anything but weighed down.</p>",
    grants: { armor: 3 },
    effect: {
      /* The price stays prose: counting as Burdened whatever you carry is the encumbrance tier
       * set by something other than weight, and nothing in the game can say that yet. */
      text: "you count as Burdened always, whatever you carry"
    }
  },
  {
    name: "Graven Heart", kind: "feature", strength: 3, pool: "mind", source: "Tattoo Magic",
    needs: ["a spell slot spent for good"],
    description: "<p>A second heart, drawn over the first. The GM writes down a secret worth six "
      + "Health, and you will find out which one when it matters.</p>",
    grants: { health: 6 }
  },
  {
    /*
     * The school's 5, and the one teaching in the game that takes the school away: a mage covered
     * in the whole skin is a fighter with good armour and no book.
     */
    name: "The Whole Skin", kind: "feature", strength: 5, pool: "mind", source: "Tattoo Magic",
    needs: ["immunity to a named condition, which nothing grants",
      "a ban on preparing any further spell",
      "a condition that can never land on you",
      "a spell slot spent for good"],
    description: "<p>There is no skin left to write on. It is the last thing you ever learn, and "
      + "afterwards you are something else wearing a mage's name.</p>",
    grants: { armor: 2, health: 4 },
    effect: {
      condition: "graven",
      bonus: { verb: "strike", value: 2 },
      /* Two things no field holds: a condition that never lands on you, and a spell budget closed
       * for good. Both are the price of the school's 5 and both are still prose. */
      text: "Burning never lands. You may never prepare another spell"
    }
  },

  /*
   * --- Asceticism, six formulas, and the school that reads your own hand ---
   *
   * Two different emptinesses, and keeping them apart is the whole of this school's wiring:
   *
   * - an empty **card hand**, which *Nothing Left to Take* and *The Empty Deck* read; and
   * - empty **hands**, meaning no item held, which *Empty Hand* and *Nothing to Carry* read.
   *
   * The engine knows about a free hand (`needsFreeHand`, `requires.bothHands`) because casting and
   * two-handed weapons needed it, and it has never been asked whether BOTH hands hold nothing.
   * Those are two gaps with two names on purpose; one word covering both would be the kind of merge
   * that finishes neither card.
   *
   * The price is parts of your body, and unlike a secret or a debt this one the engine does keep:
   * hands are what hold items.
   */
  {
    name: "Empty Hand", strength: 1, pool: "mind", source: "Asceticism",
    needs: ["empty hands as a state the engine can read",
      "a Strike made with no item, at your own Might"],
    description: "<p>No weapon, and no need of one. It is not a better Strike than a sword; it is "
      + "a Strike you cannot be parted from.</p>",
    effect: {
      whileState: "handsEmpty", text: "you may Strike with no item, at your own Might"
    }
  },
  {
    name: "Nothing to Carry", strength: 1, pool: "mind", source: "Asceticism",
    needs: ["empty hands as a state the engine can read"],
    description: "<p>Nothing in either hand, and nothing anybody can take out of them. The bonus "
      + "to Casts is incidental; the point is that Disarm stops being a word.</p>",
    effect: {
      whileState: "handsEmpty",
      text: "+2 to all Casts, and you cannot be Disarmed"
    }
  },
  {
    name: "The Last Card", strength: 2, pool: "mind", source: "Asceticism",
    needs: ["playing one card for both halves"],
    description: "<p>One card left, and it does both jobs. A hand of one is the worst hand in the "
      + "game and this is the formula that makes it the best.</p>",
    effect: {
      whileState: "oneCard",
      text: "you may play that card for both halves"
    }
  },
  {
    /*
     * The same gap *Nothing Left to Take* named, and deliberately the same STRING: a rule that can
     * read an empty hand finishes both, which is the test for whether two gaps are one.
     */
    name: "The Empty Deck", strength: 4, pool: "mind", source: "Asceticism",
    needs: ["a rule that reads your own hand being empty"],
    description: "<p>Nothing in your hand, nothing left to draw, and nothing anybody can do to "
      + "you. It is the shortest window in the game and it is absolute.</p>",
    effect: {
      whileState: "handAndDeckEmpty",
      text: "you cannot be harmed at all"
    }
  },
  {
    name: "The Hand Given", kind: "feature", strength: 3, pool: "mind", source: "Asceticism",
    needs: ["a hand given up, which the engine counts for holding things",
      "a bare Strike that counts as a weapon"],
    description: "<p>It costs a hand. What is left strikes like a Heavy weapon, for ever, and you "
      + "will never hold a shield again.</p>",
    /* No timing: a feature is permanent by having no gate to pass, and `permanent` is not a
     * timing the step schema offers any more. */
    effect: { text: "and it costs a hand: your bare Strike is a Heavy weapon at Strike 4" }
  },
  {
    /*
     * The school's 5, and the only content in the game that argues with the deck floor: the
     * minimum exists so a character cannot prune themselves into a deck of nothing (core-rules 8),
     * and this spell sets a deck of four on purpose. The floor is a rule and this is an exception
     * to it, which is exactly the kind of thing that must be in the schema rather than in prose.
     */
    name: "Nothing At All", kind: "feature", strength: 5, pool: "mind", source: "Asceticism",
    needs: ["a hand given up, which the engine counts for holding things",
      "a deck size below the floor the rules set"],
    description: "<p>Four cards, all of them in your hand, every turn. You have given away a hand "
      + "and most of a deck, and what is left is a man who always has exactly the right card.</p>",
    effect: {
      text: "your action deck becomes 4 cards, you hold all four, and may play any two "
        + "halves. Costs a hand"
    }
  },

  /*
   * --- Shadow Magic, six more, and a price that is already a field ---
   *
   * `wilds` was built when *Step Through* needed somewhere to put the school's price, and it was
   * built as a NUMBER rather than a flag on purpose: "a strength-3 formula reaching further should
   * cost more of the same thing" (data/items.mjs). *Become the Shadow* is what that was for -- five
   * Wild cards, for good, which is a third of a fate deck a shadow mage can no longer predict.
   *
   * What the school does NOT have is a shadowed square. Every one of these reads one, and the map
   * does not know which squares are dark; that is one gap shared by six formulas.
   *
   * **And *The Long Step* is the rule-3a case in a spell.** It does nothing unless you begin and
   * end in shadow, which looks exactly like the gating an opening is forbidden to do (way-cards
   * 1.6) -- except that where you are standing is yours to arrange and a drawn card is not. A
   * caster who prepared this chose to fight in the dark.
   */
  {
    name: "Longer Shadow", strength: 1, pool: "mind", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep"],
    description: "<p>The dark you are standing in reaches one square further, all the way "
      + "round, which is enough to make the next formula work.</p>",
    effect: { duration: 1, ground: { shape: "adjacent", effects: ["shadowed"] } }
  },
  {
    name: "The Long Step", strength: 1, pool: "mind", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep",
      "shadow as a state a square is in"],
    description: "<p>Four squares, through whatever is in between, so long as both ends are "
      + "dark. Movement is a sentence the table applies (core-rules 11), so the only thing the "
      + "engine would have to know is which squares are shadowed.</p>",
    effect: { verb: "move", mod: 4, text: "through anything, if you begin and end in shadow" }
  },
  {
    name: "Cast No Shadow", strength: 2, pool: "mind", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep",
      "a limit on who may target you at all"],
    description: "<p>For one round you are only there if they are standing next to you. Archers "
      + "and casters are simply out of the conversation.</p>",
    effect: { text: "until your next turn nothing further than 1 square away can target you" }
  },
  {
    name: "The Shadow Road", strength: 4, pool: "mind", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep",
      "shadow as a state a square is in"],
    description: "<p>You take them with you. The whole front rank arrives behind the enemy line "
      + "at once, which is the only thing in this school that wins a fight outright.</p>",
    effect: {
      area: 1,
      targets: "selfAndAllies",
      text: "you and every ally within 1 teleport to any shadowed square on the map"
    }
  },
  {
    name: "The Borrowed Dark", strength: 3, pool: "mind", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep"],
    description: "<p>Every square on the map, dark at once &mdash; for your allies as much as for "
      + "you, and for anyone else who knows what to do with it.</p>",
    effect: { duration: 1, ground: { shape: "wholeMap", effects: ["shadowed"] } }
  },
  {
    /*
     * The school's 5, and the only formula whose price is the reason not to cast it: five Wilds is
     * a third of a fate deck gone unpredictable for ever. A shadow mage who casts this twice is
     * playing a different game afterwards.
     */
    name: "Become the Shadow", strength: 5, pool: "mind", source: "Shadow Magic",
    wilds: 5,
    needs: ["shadow as a state a square is in", "a limit on who may target you at all"],
    description: "<p>Not in a shadow: in every shadow, at once, until the fight ends. Nothing "
      + "can reach you and you can reach anything standing in the dark.</p>",
    effect: {
      text: "until the fight ends you are in every shadow at once: Strike from any shadowed "
        + "square, and nothing can target you"
    }
  },

  /*
   * --- Spiritualism's last rung ---
   *
   * The same gap Call the Unquiet named, and the same string: a god standing on the board and a
   * corpse standing on the board are one piece of work. What is different is who decides what it
   * does, and that is the GM both times.
   */
  {
    name: "The Great Bargain", strength: 5, pool: "mind", source: "Spiritualism",
    needs: [],
    /*
     * **Three rounds, not the fight.** It said *for the rest of the fight* while the gods had no
     * numbers, which made the duration somebody else's problem. They have numbers now and they
     * outclass everything else in the file -- Health 55 to 90 against a Dragon's 50 -- so an
     * open-ended one is not a strength-5 spell, it is the end of the encounter. What a god will
     * actually give is a few rounds, and leaving is part of the bargain.
     */
    description: "<p>It is actually here, for three rounds. The GM plays it as an ally and then "
      + "it goes, and afterwards it takes something the GM chooses &mdash; which is the only "
      + "honest way to price a favour that large.</p>",
    effect: {
      verb: "conjure",
      conjure: { creature: "" },
      duration: 3,
      targets: "self",
      text: "a minor god becomes present and fights as an ally for three rounds"
    }
  },

  /*
   * --- Household Magic, six formulas, and not one of them is cast in a fight ---
   *
   * All six are rituals, so all six carry the gap *Hearth and Home* named: `strength` is required
   * and runs 1 to 5 (data/items.mjs), and a ritual costs no slots at all. Six formulas written as
   * numbers that are standing in for nothing.
   *
   * This is the school a party notices most and the engine notices least, which is the clearest
   * case in the twelve of the difference between a rule and a sentence.
   */
  {
    name: "The Clean Pot", strength: 1, pool: "mind", source: "Household Magic",
    needs: [],
    description: "<p>Food never spoils and water is always safe. A day's rations for the party, "
      + "every day, for ever &mdash; which quietly deletes a whole column of the equipment "
      + "list.</p>",
    effect: { timing: "ritual", text: "a day's rations for the party, every day" }
  },
  {
    /*
     * Corrode eats armour permanently (core-rules 8) and nothing in the game ever put it back.
     * This is the inverse, and it is the one Household formula whose effect the engine would have
     * to compute rather than narrate.
     */
    name: "The Mended Seam", strength: 1, pool: "mind", source: "Household Magic",
    needs: ["repairing an item, which Corrode has no inverse for"],
    description: "<p>One item, overnight, including corroded armour &mdash; which until now was "
      + "the only damage in the game nothing undid.</p>",
    effect: { timing: "ritual", text: "repair one item overnight, including corroded armour" }
  },
  {
    name: "The Unlatched Door", strength: 2, pool: "mind", source: "Household Magic",
    needs: [],
    description: "<p>Any door or lock that was ever opened by somebody who lived there opens for "
      + "you. Most doors were, which is the joke and also the spell.</p>",
    effect: { timing: "ritual", text: "a door ever opened by one who lived there opens for you" }
  },
  {
    name: "The House That Was", strength: 4, pool: "mind", source: "Household Magic",
    needs: ["a rest that counts as a night in a town"],
    description: "<p>Overnight a ruin is a house again: warm, defensible, and worth sleeping in. "
      + "The party rests as though they had reached somewhere.</p>",
    effect: { timing: "ritual", text: "overnight a ruin becomes a house, and the party rests as in a town" }
  },
  {
    name: "The Long Table", strength: 3, pool: "mind", source: "Household Magic",
    needs: ["every Wound shed and every rest token returned"],
    description: "<p>One meal, taken together, and nobody is carrying anything from before it. "
      + "Once a day, and the elf-kin keep the tally &mdash; which is this school's price doing "
      + "exactly what a price should.</p>",
    effect: {
      timing: "ritual", oncePer: "day",
      text: "the party sheds every Wound and all rest tokens return"
    }
  },
  {
    name: "The Door Home", strength: 5, pool: "mind", source: "Household Magic",
    needs: [],
    description: "<p>A door you have opened before becomes a door to any other door you have "
      + "opened before. It is the school's thesis: a householder is never far from anywhere "
      + "they have been.</p>",
    effect: {
      timing: "ritual", oncePer: "day",
      text: "a door you have opened leads to any other you have opened"
    }
  },

  /*
   * --- Ward Magic, seven formulas, and the only school whose axis is reactions ---
   *
   * Two reaction keys live on a spell rather than a card (config.mjs): `unmake`, which answers a
   * **cast**, and `mend`, which answers an **ally being hit**. Both were built for this school and
   * both are event sites rather than effects -- which is why three of these name a `reaction` and
   * then name a gap for what the reaction DOES.
   *
   * Spent is the price, and on a thing that was never in your hand Spent means the slate drains
   * until a rest. That machinery has been here since item abilities.
   */
  {
    name: "Turn Aside", strength: 2, pool: "mind", source: "Ward Magic",
    reaction: "mend",
    needs: ["an ally's Block counted double for one attack"],
    description: "<p>You do not stop the blow; you make their shield worth twice what it was for "
      + "exactly as long as it takes.</p>",
    effect: { range: 3, timing: "reaction", targets: "oneAlly",
    text: "one ally's Block counts double against this attack" }
  },
  {
    name: "The Shut Mouth", strength: 2, pool: "mind", source: "Ward Magic",
    needs: [],
    description: "<p>A caster who cannot speak is a man in a robe. Lore resists it, because the "
      + "ones who understand the word are the ones who can get out from under it.</p>",
    effect: {
      verb: "cast", range: 3, condition: "silenced", duration: 1, resist: "lore", dc: 7
    }
  },
  {
    /*
     * Shake Off 3 ends anything the game can print, and the verb has existed since the first
     * potion. What is new is the TIMING: this is the same mechanism on somebody else's turn, which
     * `mend` is the event site for.
     */
    name: "Shake It Off", strength: 2, pool: "mind", source: "Ward Magic",
    reaction: "mend",
    needs: [],
    description: "<p>Whatever is on them, off, on the turn it happened rather than on yours. "
      + "Three is enough for anything the game can print.</p>",
    effect: { verb: "shake", param: 3, range: 3 }
  },
  {
    name: "The Unbound Tongue", strength: 1, pool: "mind", source: "Ward Magic",
    needs: [],
    description: "<p>The cheapest formula in the school and the one that beats the school: a "
      + "warder with this prepared cannot be silenced out of the fight.</p>",
    effect: { verb: "shake", param: 1, condition: "silenced", range: 3 }
  },
  {
    name: "The Standing Ward", strength: 4, pool: "mind", source: "Ward Magic",
    needs: ["no Cast resolving at all, for a round"],
    description: "<p>Spent: for one round there is no magic on the field. Yours included, which "
      + "is what makes this a ward and not an attack.</p>",
    effect: { text: "Spent: until your next turn no Cast resolves at all, anywhere -- yours too" }
  },
  {
    name: "The Mirror", strength: 3, pool: "mind", source: "Ward Magic",
    reaction: "unmake",
    needs: ["a Cast that resolves against its own caster"],
    description: "<p>Not stopped. Returned, in full, to the man who sent it &mdash; which is "
      + "worse for him than for you and is the whole reason to prepare this instead of Unmake.</p>",
    effect: { timing: "reaction", text: "Spent: a Cast aimed at you resolves against its own caster" }
  },
  {
    /*
     * The school's 5, and the only content in the game that reaches into another character's
     * SHEET: the slot stays and the spell leaves it. That is a day-long edit to somebody else's
     * prepared list, which nothing else in the engine does.
     */
    name: "The Broken Word", strength: 5, pool: "mind", source: "Ward Magic",
    needs: ["a spell unlearned by its caster for a day"],
    description: "<p>They still have the slot. They no longer have the words, and will not until "
      + "tomorrow &mdash; which to a caster is worse than a wound.</p>",
    effect: {
      text: "Spent: one spell or miracle is unlearned by its caster for the rest of the day"
    }
  },

  /*
   * --- Divination, five more, and the school that pays in somebody else's turn ---
   *
   * `foresee` is a declared verb and reading a fate deck is not built (the same gap *The Reading*
   * named), so four of the six carry one string between them. The prophecy half is the GM's and is
   * not a gap: a prophecy the player does not get to read is not something the engine could keep.
   */
  {
    name: "Where It Will Land", strength: 1, pool: "mind", source: "Divination",
    needs: [],
    description: "<p>Your own deck, one card down. The cheapest certainty in the game.</p>",
    effect: { verb: "foresee", param: 1, readDeck: "own" }
  },
  {
    name: "The Mark of Things to Come", strength: 2, pool: "mind", source: "Divination",
    needs: [],
    description: "<p>Marked at any range, and you know what its luck is about to do. The "
      + "condition lands by itself; the reading is the half that does not.</p>",
    effect: {
      range: 99, condition: "marked", duration: 1, readDeck: "target",
      /* The Read rides on the Mark rather than being the action, so the amount stays prose:
       * `foresee` is not this step's verb and giving it one would change what the card does. */
      text: "and Read 1"
    }
  },
  {
    name: "The Long Look", strength: 3, pool: "mind", source: "Divination",
    needs: [],
    description: "<p>One question about the next scene, answered truthfully &mdash; and the GM "
      + "writes a prophecy you do not get to read. The price is the better half of the "
      + "formula.</p>",
    effect: {
      timing: "outOfCombat", text: "one true answer about the next scene, and the GM writes a prophecy"
    }
  },
  {
    name: "The Open Book", strength: 4, pool: "mind", source: "Divination",
    needs: ["advantage granted to every ally for a round"],
    description: "<p>For one round the whole party is lucky and you can see why. Two cards down "
      + "each of their decks, and a better draw on top of it.</p>",
    effect: {
      duration: 1, readDeck: "all",
      targets: "everyAlly",
      text: "every ally draws fate with advantage, and Read 2"
    }
  },
  {
    /*
     * The school's 5, and it is read before the fight starts rather than during it -- which is
     * what Preparation means in a school whose axis is Support. Three prophecies is the largest
     * price in the twelve that the engine does not touch at all.
     */
    name: "The Whole Thread", strength: 5, pool: "mind", source: "Divination",
    needs: ["an enemy's intent cards, shown in order"],
    description: "<p>The whole fight, in order, before it starts. The GM writes three prophecies "
      + "for it, and a diviner who uses this twice in a week is in a story they no longer "
      + "steer.</p>",
    effect: {
      timing: "beforeFight", text: "the GM shows the enemy's intent cards for the whole fight, in order"
    }
  },
];

/* -------------------------------------------- */

/**
 * Way of Mind's twelve Signatures (way-cards 2.3). Every one is a **spell**, which is the first
 * time a node has granted a document of that type -- Shade handed out cards, a feature and an item.
 *
 * **Eleven entries for twelve schools**, because *Step Through* has been content since Shadow
 * Magic's price needed somewhere to live (`SHADOW_FORMULAS`). The Shadow node points at it rather
 * than at a second copy, exactly as Strength's reach cards were not written twice.
 *
 * The audit is thinner here than in the other two Ways and the reason is structural: a school's
 * content is a spell, and **a spell does fewer things the engine already has verbs for**. Where a
 * card modifies a Strike you already resolve, a formula puts a figure on the map, places terrain,
 * reads a deck or spends its slots for good. Those are mechanisms, not modifiers.
 *
 * What is NOT in this column is a school's **price**, unless the engine would have to charge it. A
 * secret the GM writes down, an elven debt, a pact, a finger: nobody computes those, so they are
 * not gaps (the definition is in way-cards 2). Health, a bound Taint, skill cards set aside and a
 * permanent Wild **are** tracked by the engine, so those prices are gaps and are named as such.
 */
export const MIND_SIGNATURES = [
  {
    name: "Blood Price", kind: "spell", node: "mind.blood", strength: 2, source: "Blood Magic",
    /* Both halves are built now: the Health always was, and the armour is `ignoresArmour`. */
    needs: [],
    cost: { health: 2 },
    description: "<p>Four damage at three squares, and nothing between you and it matters. The "
      + "two Health are not a drawback; they are the school.</p>",
    effect: { verb: "cast", range: 3, mod: 4, ignoresArmour: true }
  },
  {
    name: "Call the Unquiet", kind: "spell", node: "mind.necromancy", strength: 3,
    source: "Necromancy",
    needs: [],
    description: "<p>It does not know it died. It will stop when the fight does.</p>",
    effect: {
      verb: "conjure", range: 2,
      /* A body on the field is what it needs, and the table can see whether there is one. */
      conjure: { creature: "" },
      text: "a corpse rises and fights for you"
    }
  },
  {
    /*
     * "A line of **your element**" is the oldest piece of prose in this document that is not a
     * rule, and it is NOT in the gap column -- because the mechanism exists. `CARDRPG.elements`
     * and `exclusive: "element"` were built for exactly this; what is missing is a node that
     * hands one over, which is content and is in the open list rather than here.
     */
    name: "Wall of the Sphere", kind: "spell", node: "mind.elemental", strength: 2,
    source: "Elemental Magic",
    needs: [],
    description: "<p>Three squares of whichever sphere is yours. Stand behind it and the ground in "
      + "front of you is no longer anybody's.</p>",
    effect: {
      range: 3, area: 3, duration: 1,
      ground: { shape: "line", effects: ["cover", "difficult"] },
      text: "of your element"
    }
  },
  {
    /*
     * The one Signature in this Way the engine does everything for, and it is worth noticing why:
     * Poison's whole content is conditions with saving throws, and conditions with saving throws
     * are the part of the engine that has been finished longest.
     */
    name: "Wither", kind: "spell", node: "mind.poison", strength: 2, source: "Poison",
    needs: [],
    /* The school's thesis Signature, and it pays the school's price like the other six -- it never
     * named the gap, which is why the sweep found it only when the check counted the school. */
    cost: { skillCards: 2 },
    description: "<p>Dazed while it lasts, and one damage a turn that armour does not stop.</p>",
    effect: {
      verb: "cast", condition: "poisoned", intensity: 1, duration: 2, resist: "might", dc: 5
    }
  },
  {
    name: "Not Here", kind: "spell", node: "mind.glamour", strength: 2, source: "Glamour",
    needs: ["a condition that ends when you act"],
    description: "<p>You are standing exactly where you are standing. Nobody can be told so.</p>",
    effect: {
      condition: "invisible", duration: 1, text: "until you attack or are attacked"
    }
  },
  {
    /*
     * A tattoo is the one spell that is never prepared: it spends its slots for good and is always
     * on. The slate can hold the slots (`strength`) and the drain machinery, but it has nowhere to
     * put a BONUS -- SpellSlateData has no `bonus` field, because until now a spell only ever did
     * something when cast. That is this school's gap, and it is the whole school's.
     */
    name: "Graven Strength", kind: "feature", node: "mind.tattoo", strength: 1,
    source: "Tattoo Magic",
    needs: ["a spell slot spent for good"],
    description: "<p>It is on your arm. It does not need remembering, and it never comes off.</p>",
    effect: {
      condition: "graven",
      /* The bonus rides on the condition, so the tattoo SHOWS on the token instead of being a
       * standing number nobody can see -- and `activeConditions` derives it from the feature, so
       * nothing has to apply it and nothing can leave it behind. */
      bonus: { verb: "strike", value: 2, requiresTag: "heavy" }
    }
  },
  {
    name: "Nothing Left to Take", kind: "spell", node: "mind.asceticism", strength: 1,
    source: "Asceticism",
    needs: ["a rule that reads your own hand being empty"],
    description: "<p>There is nothing in your hand and nothing left to lose, and the second "
      + "follows from the first.</p>",
    effect: {
      whileState: "handEmpty", text: "you cannot be reduced below 1 Health"
    }
  },
  {
    name: "The Bargain", kind: "spell", node: "mind.spiritualism", strength: 3,
    source: "Spiritualism",
    needs: [],
    description: "<p>A minor god acts, once. <strong>The GM decides how</strong>, and that is not "
      + "a hole in the spell &mdash; it is the spell.</p>",
    effect: {
      verb: "conjure",
      /* No name: a minor god is a person with its own opinions, and a spell that told one whom
       * to fight would have misunderstood the arrangement. */
      conjure: { creature: "" },
      text: "it acts once; the GM decides how"
    }
  },
  {
    /*
     * A ritual has NO slot cost, and `strength` is required and runs 1-5 (data/items.mjs) -- so
     * the one out-of-combat Signature is the one piece of content the slate cannot store honestly.
     * It is written as a 1 and the gap says what the 1 is standing in for.
     */
    name: "Hearth and Home", kind: "spell", node: "mind.household", strength: 1,
    source: "Household Magic",
    needs: [],
    description: "<p>Out of combat: a camp nobody unfriendly can find, for one night. A ritual, so "
      + "anyone literate could do it &mdash; but somebody has to know the words.</p>",
    effect: { timing: "ritual", text: "a camp nobody unfriendly can find, for one night" }
  },
  {
    /*
     * Two triggers exist, `hit` and `arrival` (config.mjs). A ward answers a CAST, which is
     * neither -- and it is the fourth document to ask for a trigger the engine does not have,
     * after Quick Hands, Heckle and On My Call. The difference is that this one is a whole
     * school's axis rather than one card's flavour.
     */
    name: "Unmake", kind: "spell", node: "mind.ward", strength: 2, source: "Ward Magic",
    needs: [],
    /*
     * The first reaction in the game that is not a card in your hand, and way-cards 3.4 argued for
     * exactly that from the simulation: a dispel on a drawn card is in hand 31% of turns and is
     * therefore nearly worthless, while a PREPARED one is there every fight and costs no half.
     * Spent, on a thing that was never in your hand, is the slate draining until a rest.
     */
    reaction: "unmake",
    description: "<p>You have felt this one before. That is the only reason you can stop it: a "
      + "warder's book is a record of what the party has survived &mdash; which is a condition on "
      + "LEARNING it, held by the GM, not something the engine tests.</p>",
    effect: { text: "a Cast you have survived before does not resolve" }
  },
  {
    name: "The Reading", kind: "spell", node: "mind.divination", strength: 2, source: "Divination",
    needs: [],
    description: "<p>Three cards down somebody else's luck. Never your own &mdash; a diviner who "
      + "could stack their own deck would be a damage school wearing a robe.</p>",
    effect: { verb: "foresee", param: 3, readDeck: "other" }
  }
];

/* -------------------------------------------- */

/**
 * Way of Mind's Tactics (way-cards 2.5), derived from the deepest title like the other two Ways.
 *
 * Every one is about **where a caster stands**, which the document states as the Way's thesis: a
 * caster's hard problem is not what to cast but ranged-in-melee, line of sight and their own Blast.
 * None of the twelve adds a number, which is the rule that keeps forty-eight of these from being
 * power creep (way-cards 2.5, rule 2).
 */
export const MIND_TACTICS = {
  "Your Own Blood Is Nearest":
    "You may always Cast on yourself whatever the spell's range, and never take disadvantage "
    + "for it.",
  "The Dead Are Furniture":
    "Corpses are cover for you and difficult ground for your enemies.",
  "The Sphere Holds":
    "Your own Blast spares you alone, whatever the card says.",
  "The Patient Hand":
    "An enemy you have put a condition on this fight has disadvantage against you.",
  "Never Quite There":
    "Ranged attacks against you from more than 3 squares always have disadvantage.",
  "Nothing to Prepare":
    "You may Cast with both hands full, and Silenced does not stop you -- your spells are on your "
    + "skin, not in your mouth.",
  "The Still Point":
    "If you did not Move this turn, you cannot be moved and attacks against you have disadvantage.",
  "At Home in the Dark":
    "While you stand in a shadowed square, enemies more than 2 squares away cannot target you "
    + "at all.",
  "Something Is Always Listening":
    "You know whether any square within 6 is shadowed, high ground or difficult ground before "
    + "anyone steps on it.",
  "The House Helps":
    "Indoors you ignore difficult ground, and you know where every door is before you see it.",
  "The Standing Guard":
    "One extra reaction each round, usable only to answer a Cast.",
  "Already Seen":
    "You are never surprised, and at the start of any round you may swap your place in the "
    + "initiative order with a willing ally's."
};

/* -------------------------------------------- */

/**
 * Way of Faith's twelve Signature miracles (way-cards 2.4).
 *
 * A miracle is the same slate as a formula and is paid for at the opposite end: *a school is what it
 * cost you to LEARN, a god is what it costs you to ASK* (way-cards 3.5). So nothing here carries a
 * learning price, and every god carries an **Obedience** instead -- which is on the node, not here,
 * because it applies to everything the god ever grants.
 *
 * **The largest gap in the game is now a spell that costs Health to cast**, at six pieces of
 * content: three of Blood Magic's and three of Vax's. Two Ways arrived at the same mechanism from
 * opposite directions -- a mage spending their own substance to buy power, and a war god counting
 * his priest's blood first -- and neither can be built without it.
 */
export const FAITH_SIGNATURES = [
  {
    name: "The Clean Hand", kind: "spell", node: "faith.eternalgod", strength: 2,
    source: "The Eternal God",
    needs: ["a promise that the next draw cannot fail"],
    description: "<p>An ally's next check or attack cannot fail. One cheaper on a brother or "
      + "sister in faith, which is the third tenet made arithmetic.</p>",
    effect: { range: 3, targets: "oneAlly",
    text: "an ally's next check or attack cannot fail" }
  },
  {
    name: "Breath of the Spirit", kind: "spell", node: "faith.eternalspirit", strength: 2,
    source: "The Eternal Spirit",
    /*
     * This one wanted no new trigger at all: `allyHit` has existed since the Bodyguard redirect,
     * and an ally about to be dropped is the same event whether you take the blow or mend it. It
     * was in the queue under *a reaction trigger beyond hit and arrival* because the gap had been
     * merged with Unmake's -- and that merge was wrong, which is this increment's lesson.
     */
    needs: [],
    reaction: "mend",
    description: "<p>Reaction: heal an ally 3, at any range, ignoring cover. The spirit drifts "
      + "through all the air, so distance is not a question for it.</p>",
    effect: {
      verb: "heal", param: 3, timing: "reaction", range: 99, ignoresCover: true
    }
  },
  {
    name: "The Tide Knows", kind: "spell", node: "faith.sessyfyn", strength: 2, source: "Sessyfyn",
    needs: ["two fate draws that both apply"],
    description: "<p>An ally draws fate twice on their next action and keeps both. The sea is not "
      + "fair.</p>",
    effect: { range: 3, targets: "oneAlly",
    text: "an ally draws fate twice on their next action and keeps both" }
  },
  {
    name: "The Drum", kind: "spell", node: "faith.valtor", strength: 1, source: "Valtor",
    needs: ["a bonus that waits for your next Strike"],
    description: "<p>It starts somewhere behind you and it is already in your arms.</p>",
    effect: { text: "your next Strike this turn is +3" }
  },
  {
    name: "The Borrowed Face", kind: "spell", node: "faith.fagar", strength: 3, source: "Fagar",
    needs: ["an enemy that attacks its own side"],
    description: "<p>Spent: one enemy spends this round attacking its own ally. It works once, "
      + "which is the god.</p>",
    effect: { range: 3, targets: "oneEnemy",
    text: "Spent: one enemy spends this round attacking its own ally" }
  },
  {
    /*
     * The one Faith Signature the engine does everything for, and the same shape as Mind's single
     * one: a condition in an area with a saving throw. That part of the engine has been finished
     * longest, so it is where content lands intact.
     */
    name: "The Outcast's Due", kind: "spell", node: "faith.vulpet", strength: 3, source: "Vulpet",
    needs: [],
    description: "<p>Every enemy next to you turns on you, because the outcast is who the crowd "
      + "turns on. That is not a side effect; it is the prayer.</p>",
    effect: {
      verb: "cast", area: 1, areaKind: "blast",
      condition: "compelled", duration: 2, resist: "presence", dc: 5
    }
  },
  {
    name: "Out of Barren Ground", kind: "spell", node: "faith.brendan", strength: 3,
    source: "Brendan",
    needs: [],
    description: "<p>Plant it. At the start of your second turn after, every ally within 2 heals "
      + "4. Nothing he gives arrives when you ask for it.</p>",
    effect: {
      verb: "heal", param: 4, range: 2, targets: "alliesInRange", delay: 2
    }
  },
  {
    name: "The Silent Hour", kind: "spell", node: "faith.grey", strength: 2, source: "The Grey",
    needs: [],
    description: "<p>Reaction, adjacent only: an enemy's action does not happen. Close enough to "
      + "touch, which is where the knife is.</p>",
    /*
     * **Dazed, not Halted**, and the difference is the ladder The Grey is built on: this is an
     * ACTION denied at strength 2 and The Grey Hour is the WHOLE TURN at strength 4. Both were
     * given Halted when the condition was built, which flattened a deliberate pair into two
     * identical cards -- and the break test found it by matching one anchor twice.
     */
    effect: { range: 1, timing: "reaction", condition: "dazed", duration: 1 }
  },
  {
    name: "The First Taste", kind: "spell", node: "faith.purple", strength: 2,
    source: "The Purple",
    needs: [],
    description: "<p>Tainting 2 on one adjacent enemy, and 1 Taint for you. You are the first to "
      + "taste it, always.</p>",
    cost: { taint: 1 },
    effect: { verb: "tainting", param: 2, range: 1 }
  },
  {
    name: "The Rumour", kind: "spell", node: "faith.yellow", strength: 2, source: "The Yellow",
    needs: [],
    description: "<p>Name a lie before the fight. One enemy type acts as if it were true, for as "
      + "long as you keep spending a secondary on it.</p>",
    effect: {
      whileState: "upkeep", text: "one enemy type acts as though a named lie were true"
    }
  },
  {
    name: "The Club and the Line", kind: "spell", node: "faith.vax", strength: 2, source: "Vax",
    /*
     * The Health is built. What is not is the value: *Strike* every adjacent enemy means the club's
     * own number, and a spell is its own weapon (data/items.mjs) -- so a miracle that borrows the
     * weapon in hand is the one shape the new verb line cannot answer.
     */
    needs: ["a spell that strikes with the weapon in hand"],
    cost: { health: 2 },
    description: "<p>Strike every adjacent enemy. No free hand needed, because the club is the "
      + "holy symbol &mdash; which is the gift on the node, not on the card.</p>",
    effect: { verb: "cast", area: 1, areaKind: "blast", text: "with the weapon in hand" }
  },
  {
    name: "The Long Night", kind: "spell", node: "faith.first", strength: 3, source: "The First",
    needs: ["damage that heals the caster"],
    description: "<p>Drain 3 Health from an adjacent living target and gain it. The only renewable "
      + "pool in the game, and the node says what it costs to have one.</p>",
    effect: { verb: "cast", range: 1, mod: 3, text: "you gain the Health you take" }
  },

  /* --- the four orders' Signatures, and none of them is a miracle ---
   *
   * **A miracle belongs to a god and an order does not.** An order is open to a priest of any of
   * the twelve, so a Signature miracle would have to belong to twelve lists at once or to none;
   * these are cards, which belong to the holder. That is not a compromise -- way-cards 2 gives a
   * Signature as a card in nineteen other places, and *what you do in the god's service* is an
   * action rather than a prayer.
   *
   * Three of the four need nothing the engine does not already do, which is a change from the way
   * this Way's content has gone until now: Judged is an opening and openings are published rather
   * than resisted, `block` is already Block given to somebody else, and Strain is a cost a card
   * half has always been able to pay.
   */
  {
    /*
     * The Inquisitor publishes an opening and nothing else, which is the whole design. Judged
     * does *nothing by itself* (conditions.md 1.2) and is never resisted, so this card's worth is
     * entirely in what the rest of the party is already written to do with an opening -- and it
     * makes Way of Faith the Way that hands openings out, where Shade takes them.
     */
    name: "The Writ", kind: "card", node: "faith.inquisitor", needs: [],
    primary: [{ condition: "judged", range: 6, duration: 2 }],
    secondary: [{ verb: "move", param: 1 }],
    text: "No save, at range 6. Being named is not something you resist, and the whole field may "
      + "act on it."
  },
  {
    /* Block given away rather than kept: the effect `block` already is, pointed at the ally and
     * never at the holder, which is the order's rule written as a card. */
    name: "The Order's Shield", kind: "card", node: "faith.shieldsworn", needs: [],
    primary: [{ verb: "defend" }, { verb: "block", param: 2, range: 1 }],
    secondary: [{ verb: "block", param: 1, range: 1 }],
    reaction: "block",
    text: "The Block goes to an adjacent ally and never to you. The order does not defend itself."
  },
  {
    /*
     * The one gap of the four, and it is the order's whole method: a step that pays off a turn in
     * which you did NOT move. `charging` reads the opposite -- a turn in which you did -- so the
     * engine has half of this already and the half it has is the wrong half.
     */
    name: "The Long Silence", kind: "card", node: "faith.anchorite",
    needs: ["a step that reads a turn in which you did not move"],
    primary: [{ verb: "ready", param: 2 }],
    secondary: [{ verb: "shake", param: 1 }],
    text: "Only if you did not move this round. Stillness is the whole of the order's method."
  },
  {
    /* Strain before the blow, which is Valtor's bargain bought with a card instead of a god. */
    name: "The Scourge", kind: "card", node: "faith.flagellant", needs: [],
    primary: [{ verb: "strike", mod: 2 }],
    secondary: [{ verb: "move", param: 2 }],
    costs: { primary: { strain: 1 } },
    text: "Strain 1, paid before the blow lands. The drums, the dance and the whip make the same "
      + "argument: pay first, strike harder."
  }
];

/* -------------------------------------------- */

/**
 * The miracles a Faith minor node hands over (way-cards 3.5).
 *
 * The same rule Mind's pool follows, and easier here: a god's branch leads nowhere but deeper into
 * that god, so a minor node's miracle is always its own god's. Nothing on a Valtor run could hand
 * out a miracle of The Grey without an edge between religions, and there are none -- the religions
 * are the exclusive groups.
 */
export const FAITH_POOL = [
  {
    name: "Name the Guilty", strength: 1, pool: "faith", source: "The Eternal God", needs: [],
    description: "<p>No save. Being named is not something you resist.</p>",
    /* No verb: a step with a condition and no verb IS the condition, and an opening never saves. */
    effect: { range: 6, condition: "judged", duration: 1 }
  },
  {
    name: "Steady the Hand", strength: 1, pool: "faith", source: "The Eternal God",
    needs: ["judging whoever applied a condition"],
    description: "<p>Ends Compelled on an ally, and accuses whoever did it. Answer and accuse, "
      + "which is what a targeted counter has to do to be worth a slot (way-cards 3.6).</p>",
    effect: { verb: "shake", param: 1, condition: "compelled", range: 3 }
  },
  {
    name: "Lay On", strength: 1, pool: "faith", source: "The Eternal Spirit", needs: [],
    description: "<p>Hands, and three squares of air between you.</p>",
    effect: { verb: "heal", param: 2, range: 3 }
  },
  {
    name: "A Word for You", strength: 1, pool: "faith", source: "The Eternal Spirit", needs: [],
    description: "<p>Blessed: a temporary Critical in their fate deck, until it is drawn. The "
      + "condition shuffles the card in by itself (core-rules 6).</p>",
    effect: { range: 3, condition: "blessed" }
  },
  {
    name: "Undertow", strength: 2, pool: "faith", source: "Sessyfyn", needs: [],
    description: "<p>Wet, and everything in it moved a square you choose. Moving figures is a "
      + "sentence the table applies (core-rules 11), so this card is complete.</p>",
    effect: {
      verb: "cast", range: 3, area: 2, areaKind: "blast", condition: "wet", duration: 1,
      text: "every target is moved 1 square you choose"
    }
  },
  {
    name: "No Step Back", strength: 2, pool: "faith", source: "Valtor",
    needs: [],
    description: "<p>Every ally within 2 gains Block 2 until your next turn. Valtor's answer to "
      + "being outnumbered is that nobody moves.</p>",
    effect: { verb: "block", param: 2, area: 2 }
  },
  {
    name: "The Second Thought", strength: 1, pool: "faith", source: "Fagar",
    /* The gap said "an enemy that loses a half", and Dazed IS that: `blocksSecondary` has
     * been on it since there were conditions, `noSecondary` reads it on the actor, and the tray
     * greys the half out. The card described a built mechanic in prose for as long as it existed. */
    needs: [],
    description: "<p>One enemy spends its secondary this round doing nothing.</p>",
    effect: { range: 3, condition: "dazed", duration: 1, resist: "presence", dc: 7 }
  },
  {
    name: "Alone on the Road", strength: 1, pool: "faith", source: "Vulpet",
    needs: ["an effect that reads how far away your allies are"],
    description: "<p>While no ally is within 2 squares, heal 2 at the start of your turn. The only "
      + "healing a priest of hers can ever receive.</p>",
    effect: {
      verb: "heal", param: 2, whileState: "noAllyNear", text: "at the start of your turn"
    }
  },
  {
    name: "Full Belly", strength: 1, pool: "faith", source: "Brendan",
    needs: ["a one-off bonus to the next rest"],
    description: "<p>Out of combat: the party's next rest returns one extra rest token.</p>",
    effect: { text: "the party's next rest returns one extra rest token" }
  },
  {
    name: "Grey Judgement", strength: 2, pool: "faith", source: "The Grey",
    needs: ["moving a figure's place in the round"],
    description: "<p>A Judged adjacent enemy acts last in the round, whatever its initiative.</p>",
    effect: { range: 1, text: "a Judged adjacent enemy acts last this round" }
  },
  {
    name: "Taste of the Rot", strength: 1, pool: "faith", source: "The Purple",
    needs: [],
    description: "<p>One adjacent enemy: 1 damage and Off-Balance, no save. A Miss costs you a "
      + "Taint, which is the god being paid whether or not it worked.</p>",
    cost: { taint: 1 },
    effect: {
      verb: "cast", range: 1, mod: 1, condition: "offBalance", duration: 1,
      /* The trigger stays prose: the price is only paid on a Miss, and when a cost is conditional
       * it is the condition the engine cannot read rather than the number. */
      text: "the Taint only on a Miss"
    }
  },
  {
    name: "The Planted Word", strength: 1, pool: "faith", source: "The Yellow",
    needs: [],
    description: "<p>Name one enemy type before the fight. While you spend a secondary each round, "
      + "that type cannot play reactions.</p>",
    effect: {
      whileState: "spendSecondary", text: "one enemy type cannot play reactions"
    }
  },
  {
    name: "Stand Where I Stand", strength: 1, pool: "faith", source: "Vax",
    needs: ["a floor under an ally's Health"],
    cost: { health: 2 },
    description: "<p>Allies adjacent to you cannot be reduced below 1 Health until your next "
      + "turn. Costs 2 Health, because his miracles are paid in yours.</p>",
    effect: { range: 1, targets: "adjacentAllies",
    text: "adjacent allies cannot be reduced below 1 Health" }
  },
  {
    /*
     * The one Health price the field cannot hold: *1 Health per ally* is a cost that depends on
     * where everyone is standing, and `cost.health` is a number. A variable price is a second
     * mechanism, not a bigger number, so it stays in the queue and says so.
     */
    /*
     * Still blocked, and on two different things now that the Block grant exists: the price scales
     * with the line and the AMOUNT is the caster's own armour rather than a number on the card.
     * Both are reasons a fixed `param` cannot hold it, and naming them apart is what the list is
     * for -- the old single string hid that this card needed two unrelated mechanisms.
     */
    name: "The Shield Line", strength: 2, pool: "faith", source: "Vax",
    needs: ["Block equal to the caster's own armour"],
    description: "<p>Every ally adjacent to you gains your armor value as Block until your next "
      + "turn. One Health per ally, so a long line is a dear one.</p>",
    cost: { health: 1, scale: "perAlly" },
    effect: { range: 1, targets: "adjacentAllies",
    text: "adjacent allies gain your armor as Block" }
  },
  {
    name: "Measure of the Debt", strength: 2, pool: "faith", source: "The First",
    needs: ["an event when a figure's Health reaches zero"],
    description: "<p>A Judged enemy that dies this round pays you 3 Health. The debt is collected "
      + "whether or not you were the one who called it in.</p>",
    effect: { text: "a Judged enemy that dies this round: you gain 3 Health" }
  },
  {
    /*
     * The one miracle that charges a god's own coin on the card as well as in the obedience, and it
     * charges it FOR GOOD: each time it saves you there is less of you left to save with. A priest
     * of The First who has survived four times cannot cast at all.
     */
    name: "What Does Not Die", strength: 3, pool: "faith", source: "The First",
    needs: ["an event when a figure's Health reaches zero"],
    description: "<p>When you would drop to 0 Health, drop to 1 instead &mdash; and lose a spell "
      + "slot permanently.</p>",
    effect: { text: "drop to 1 instead of 0, and lose a spell slot for good" }
  },

  /*
   * --- The Eternal God, four miracles, and the one that reads its own opening ---
   *
   * *The Weight of It* only works on a **Judged** enemy, which looks like the gating an opening is
   * forbidden to do (way-cards 1.6) -- and is not, for the reason rule 3a gives: Judged is applied
   * by *Name the Guilty*, which is a miracle of the same god and in the same book. A priest who
   * prepared both arranged this; nobody is waiting on a draw.
   */
  {
    name: "The Weight of It", strength: 2, pool: "faith", source: "The Eternal God",
    needs: ["armour counted as zero against everyone"],
    description: "<p>Named, and then weighed. For one round its armour is worth nothing to "
      + "anybody on the field, which is a gift to the whole line rather than to you.</p>",
    effect: {
      range: 6,
      text: "a Judged enemy's armor counts 0 against everyone until your next turn"
    }
  },
  {
    /*
     * The only content in the game that makes a spell CHEAPER, and it is priced in the one
     * resource a priest of the clean body is supposed to spend: cards. A ten-card deck is four
     * below a Warrior's and the reason to accept that is here.
     */
    name: "The Narrow Path", strength: 1, pool: "faith", source: "The Eternal God",
    needs: ["a slot cost that a deck size changes"],
    description: "<p>Less to carry, less to remember, and the words come easier. A thin deck is "
      + "the clean body, written as arithmetic.</p>",
    effect: {
      whileState: "thinDeck",
      /* Not a price this step pays but a discount on every other: `cost` is what a step charges,
       * and a spell that makes OTHER spells cheaper has nowhere to put that yet. */
      text: "your miracles cost 1 slot less (min 1)"
    }
  },
  {
    name: "The Clean Field", strength: 4, pool: "faith", source: "The Eternal God",
    needs: ["an enemy that loses a half"],
    description: "<p>For one round nobody on the other side does anything but their main business. "
      + "It is the same mechanism as Fagar's small trick, over the whole field.</p>",
    effect: { text: "until your next turn no enemy may play a secondary" }
  },
  {
    name: "The Body Made Clean", strength: 5, pool: "faith", source: "The Eternal God",
    needs: ["healing and lifting over every ally at once",
      "a deck size an effect sets until the day ends"],
    description: "<p>Everybody whole, and nothing on anybody. You will play the rest of the day "
      + "out of six cards, which is the god's point: the body is clean and the hand is "
      + "empty.</p>",
    effect: {
      targets: "everyAlly",
      text: "every ally is healed to full and every condition is Lifted and Shaken off. Your "
        + "action deck is 6 cards for the rest of the day"
    }
  },

  /*
   * --- The Eternal Spirit, four miracles, and the only one that takes a condition onto itself ---
   */
  {
    name: "Bear It for Them", strength: 2, pool: "faith", source: "The Eternal Spirit",
    reaction: "mend",
    needs: ["a condition moved from one figure to another"],
    description: "<p>Whatever is on them is on you instead, at its full duration. The Spirit's "
      + "priests are the only ones who can do this and the only ones who would.</p>",
    effect: { range: 3, timing: "reaction", targets: "oneAlly",
    text: "move one condition off an ally and onto yourself" }
  },
  {
    /*
     * Blessed and Cursed each shuffle a card into a fate deck by themselves (core-rules 6), so
     * lifting the condition takes its card with it -- the condition OWNS the card. That is why
     * this miracle, which reads as though it needed a second mechanism, needs none.
     */
    name: "A Word Withdrawn", strength: 1, pool: "faith", source: "The Eternal Spirit",
    needs: [],
    description: "<p>The marker and the card both: a blessing withdrawn is a Critical taken back "
      + "out of the deck, and a curse withdrawn is a Miss. It works on anybody, including the "
      + "enemy you blessed by mistake.</p>",
    effect: { verb: "lift", range: 3, condition: "blessed", text: "or Cursed" }
  },
  {
    name: "The Air Between", strength: 4, pool: "faith", source: "The Eternal Spirit",
    needs: ["an extra reaction on one trigger"],
    description: "<p>For one round everybody answers twice. The reaction policy allows one per "
      + "trigger and this is the only thing in the game that argues with it.</p>",
    effect: { targets: "everyAlly",
    text: "until your next turn every ally may take one extra reaction per trigger" }
  },
  {
    name: "Breath for the Dying", strength: 5, pool: "faith", source: "The Eternal Spirit",
    needs: ["an event when a figure's Health reaches zero",
      "a ban on carrying anything for the rest of the day"],
    description: "<p>Everybody who had fallen is standing, at half. You will carry nothing at all "
      + "until tomorrow, which in a dungeon is a real price and not a flourish.</p>",
    effect: {
      targets: "everyAlly",
      text: "every ally at 0 Health stands at half Health. You may carry nothing for the rest "
        + "of the day"
    }
  },

  /*
   * --- Sessyfyn, three miracles, and a price that was already a condition ---
   *
   * *The Turning Tide* pays with "a temporary Miss in your own fate deck", which is **Cursed**
   * exactly as conditions.md defines it -- so the god's price needed no mechanism at all. It is the
   * clearest case in the twenty-four of a price that was already in the engine under another name.
   */
  {
    name: "The Turning Tide", strength: 2, pool: "faith", source: "Sessyfyn",
    reaction: "mend",
    needs: ["a reaction trigger on an ally's turn"],
    description: "<p>The sea is not fair. They draw again and must keep the second card, and a "
      + "Miss joins your own deck for having asked.</p>",
    effect: {
      range: 3, condition: "cursed",
      timing: "reaction", targets: "oneAlly",
      text: "an ally redraws a fate card and keeps the second. The Cursed is yours"
    }
  },
  {
    name: "The Spring Tide", strength: 4, pool: "faith", source: "Sessyfyn",
    needs: ["two fate draws that both apply"],
    description: "<p>For one round the whole party has the tide with them: two cards each, and "
      + "both of them count.</p>",
    effect: { targets: "everyAlly",
    text: "until your next turn every ally draws fate twice and keeps both" }
  },
  {
    /*
     * The god's 5, and the only miracle that changes the game rather than the fight: one deck for
     * everybody means your luck and theirs are the same luck. A priest of the sea thinks that is
     * obviously correct.
     */
    name: "The Sea Decides", strength: 5, pool: "faith", source: "Sessyfyn",
    needs: ["one fate deck shared by the whole field"],
    description: "<p>Every fate deck on the field, shuffled into one. For the rest of the fight "
      + "nobody has their own luck, which is the fairest thing the sea has ever done.</p>",
    effect: { text: "shuffle every fate deck on the field into one; everyone draws from it" }
  },

  /*
   * --- Valtor, three miracles, and a price that is NOT a gap ---
   *
   * Every miracle of Valtor's costs Strain, and Strain is a cost a card half pays
   * (data/items.mjs). On a miracle it is an **obedience** -- the GM's, like a vow -- which is why
   * none of these carries a gap for it. The war god counts his priest's blood first and the engine
   * is not asked to do the counting.
   */
  {
    name: "The Charge", strength: 2, pool: "faith", source: "Valtor",
    needs: [],
    description: "<p>Strain 2, and the whole line moves at once. Movement is a sentence the table "
      + "applies (core-rules 11), so this miracle is finished as written.</p>",
    cost: { strain: 2 },
    effect: { area: 2, targets: "alliesInRange",
    text: "every ally within 2 may Move their full value, at once, now" }
  },
  {
    name: "The War Drum", strength: 4, pool: "faith", source: "Valtor",
    needs: ["a whole turn taken again, now"],
    description: "<p>Strain 3, and everybody near you goes again. The same mechanism Blood "
      + "Magic's thesis wants, bought with pain instead of blood.</p>",
    cost: { strain: 3 },
    effect: { area: 2, targets: "alliesInRange",
    text: "every ally within 2 takes their whole turn again, now" }
  },
  {
    name: "Valtor's Own", strength: 5, pool: "faith", source: "Valtor",
    needs: ["two secondaries every turn until the fight ends"],
    description: "<p>Your whole hand, strained, and for the rest of the fight you act like three "
      + "men. There is nothing left to play it with, which is the god's idea of a bargain.</p>",
    cost: { strain: 1, scale: "wholeHand" },
    effect: {
      text: "for the rest of the fight you play a primary and two secondaries each turn"
    }
  },

  /*
   * --- Fagar, three miracles, and the intent cards ---
   *
   * Two miracles of two different gods want to look at the enemy's **intent card** -- Fagar's
   * small one and Divination's thesis -- and they carry one string between them, because showing a
   * player an intent card is one piece of work whichever god asked.
   */
  {
    name: "The Second Face", strength: 1, pool: "faith", source: "Fagar",
    needs: ["an enemy's intent cards, shown in order"],
    description: "<p>Spent: you know what one of them is going to do before anybody moves. "
      + "Fagar's whole theology is that this is enough.</p>",
    effect: { text: "Spent: read one enemy's intent card for this round before anyone acts" }
  },
  {
    name: "The Mask of the Captain", strength: 4, pool: "faith", source: "Fagar",
    needs: ["playing an enemy's turn for them"],
    description: "<p>For one round it is yours: you play its turn, with its cards, against its "
      + "own side. The trick works once and everybody remembers your face afterwards.</p>",
    effect: { text: "one enemy obeys you for a round -- you play its turn" }
  },
  {
    name: "Everyone Wears His Face", strength: 5, pool: "faith", source: "Fagar",
    needs: ["an enemy that attacks its own side"],
    description: "<p>For one round no enemy can tell friend from foe, and every attack they make "
      + "lands on one of their own. It is the same mechanism Glamour's 4 wants, done once and "
      + "for certain rather than at random.</p>",
    effect: { targets: "enemiesInRange",
    text: "until your next turn every enemy attack targets another enemy" }
  },

  /*
   * --- Vulpet, three miracles, and the god who makes you worth helping least ---
   */
  {
    name: "Nobody's Friend", strength: 2, pool: "faith", source: "Vulpet",
    needs: ["an ally forbidden to heal or shield one figure"],
    description: "<p>One of them is alone now: nobody will heal it, step in front of it or take a "
      + "hit for it. Vulpet's priests understand this condition from the inside.</p>",
    effect: {
      range: 3,
      targets: "oneEnemy",
      text: "until your next turn no ally may Heal, Interpose for, or redirect a hit from one enemy"
    }
  },
  {
    name: "The Driven Out", strength: 4, pool: "faith", source: "Vulpet",
    needs: ["a condition applied to an area", "Block that counts how many it caught"],
    description: "<p>Everything within three squares wants you and nothing else, and you are "
      + "three Block better off for each one of them. It is a good trade and a terrible "
      + "position.</p>",
    effect: {
      area: 3, condition: "compelled", duration: 1, resist: "presence", dc: 7,
      text: "and you gain Block 3 for each enemy Compelled"
    }
  },
  {
    /*
     * The god's 5, and the only miracle whose drawback is the whole point: you have removed the
     * fight and you are lying on the floor by yourself when it comes back. Vulpet is the god of
     * the outcast and this is what she offers.
     */
    name: "The Land Beneath", strength: 5, pool: "faith", source: "Vulpet",
    needs: ["a figure taken off the board and put back later"],
    description: "<p>The ground opens and takes them. They are back at the start of your third "
      + "turn, and you are Prone, and alone, and it is entirely your own doing.</p>",
    effect: {
      area: 2,
      targets: "enemiesInRange",
      delay: 3,
      /* The delay is when they COME BACK, which is the one thing this card needed a field for.
       * The rest -- gone in the meantime, and you Prone for doing it -- is still prose. */
      text: "every enemy within 2 is gone until then. You are Prone"
    }
  },

  /*
   * --- Brendan, three miracles, and all three resolve on a turn that has not happened ---
   *
   * One string between them, and it is the string *On the Third Day* named: growth out of barren
   * ground is a god whose miracles are all delayed, and a delayed effect is one mechanism however
   * many turns it waits.
   */
  {
    name: "The Slow Mercy", strength: 2, pool: "faith", source: "Brendan",
    needs: [],
    description: "<p>Name them now. At the start of your third turn they are whole, which is "
      + "either too late or exactly right.</p>",
    effect: {
      range: 3, targets: "oneAlly",
      delay: 3,
      text: "healed to full"
    }
  },
  {
    name: "The Orchard", strength: 4, pool: "faith", source: "Brendan",
    needs: [],
    description: "<p>Two turns from now the whole party heals four and sheds something. Planting "
      + "is the god's only verb.</p>",
    effect: {
      verb: "heal", param: 4, targets: "everyAlly", delay: 2,
      text: "and sheds one condition"
    }
  },
  {
    /*
     * The god's 5, and it raises the dead on a four-turn delay -- which means casting it is a bet
     * that the fight lasts. Brendan does not do anything quickly and will not start now.
     */
    name: "What Grows Out of Us", strength: 5, pool: "faith", source: "Brendan",
    needs: ["a figure a spell puts on the map"],
    description: "<p>Four turns. Then everybody stands up, including the ones who had stopped "
      + "being people and started being ground.</p>",
    effect: {
      targets: "everyAlly", delay: 4,
      text: "every ally including the dead stands at full Health"
    }
  },

  /*
   * --- The Grey, three miracles, all adjacent, and the shortest card in the game ---
   */
  {
    name: "The Close Work", strength: 2, pool: "faith", source: "The Grey",
    reaction: "parry",
    needs: ["an enemy that attacks its own side"],
    description: "<p>You move his arm. The man behind him takes it, and neither of them "
      + "understands what happened.</p>",
    effect: { timing: "reaction", text: "adjacent: an enemy's Strike hits the nearest other enemy instead" }
  },
  {
    name: "The Grey Hour", strength: 4, pool: "faith", source: "The Grey",
    /* One gap closed and one left: Halted is the condition that denies a turn, but a trigger
     * AT THE START of an enemy's turn is still something nothing in the engine offers. */
    needs: ["a trigger at the start of an enemy's turn"],
    description: "<p>Its whole turn does not happen. Not interrupted &mdash; it simply never "
      + "took place, and the round moves on without it.</p>",
    effect: { range: 1, timing: "reaction", condition: "halted", duration: 1 }
  },
  {
    /*
     * The god's 5, and the only content in the game that kills without a draw. It is a sentence
     * long because there is nothing to resolve: no save, no fate card, no armour, no Block. The
     * price is the god's own, paid continuously, and the knife is the whole theology.
     */
    name: "The Silent Knife", strength: 5, pool: "faith", source: "The Grey",
    needs: ["a kill with no draw and no save of any kind"],
    description: "<p>Adjacent only. One enemy is dead. There is no roll of any kind, which is "
      + "what a god of the silent approach has instead of a spell.</p>",
    effect: { text: "adjacent: one enemy is dead. No save, no fate draw, no roll of any kind" }
  },

  /*
   * --- The Purple, three miracles, and a disease is not a poison ---
   *
   * `tainting` is a built verb with a slow and a fast form (config.mjs), which is why this god's
   * small miracles need nothing: the mechanism arrived with Taint itself.
   */
  {
    name: "The Brewer's Tithe", strength: 2, pool: "faith", source: "The Purple",
    needs: [],
    description: "<p>Slow, and still there next week. A disease rather than a poison, which is "
      + "the distinction the whole cult is built on.</p>",
    effect: { verb: "tainting", param: 2, text: "slow: a disease, not a poison" }
  },
  {
    name: "The Poisoned Well", strength: 4, pool: "faith", source: "The Purple",
    needs: ["a condition applied to an area"],
    description: "<p>Three squares of it, fast. Everything standing in the water carries it "
      + "away.</p>",
    effect: { verb: "tainting", param: 1, area: 3, areaKind: "blast", text: "fast" }
  },
  {
    name: "The Slow Failure", strength: 5, pool: "faith", source: "The Purple",
    needs: [],
    description: "<p>Tainting 3 on them and two Taint on you &mdash; which with the first taste "
      + "is Afflicted. A priest of The Purple who casts their thesis is ill for good.</p>",
    cost: { taint: 2 },
    effect: { verb: "tainting", param: 3 }
  },

  /*
   * --- The Yellow, three miracles, and two of them are held up by a secondary ---
   *
   * The same mechanism *The Long Con* wants, and the same string: an effect that lasts only while
   * you keep paying a half every round is one piece of work, and this god has three users of it.
   */
  {
    name: "Half a Truth", strength: 2, pool: "faith", source: "The Yellow",
    needs: ["an ally the enemy acts as though absent"],
    description: "<p>Name one of your own. For a round the enemy fights as though they were not "
      + "on the field at all, which is as good as cover and better than armour.</p>",
    effect: {
      targets: "enemiesInRange",
      text: "until your next turn enemies act as though one ally you name were not there"
    }
  },
  {
    name: "The Whole Cloth", strength: 4, pool: "faith", source: "The Yellow",
    needs: ["an enemy that counts you as an ally"],
    description: "<p>While you keep paying a half every round, one whole kind of enemy believes "
      + "the party are its own. Stop paying and the room remembers.</p>",
    effect: {
      whileState: "spendSecondaryEachRound",
      text: "one enemy type believes the party are its own"
    }
  },
  {
    /*
     * The god's 5, and the only miracle that edits the fiction rather than the fight: the GM runs
     * the fight as though the lie had always been true. There is nothing for the engine to do and
     * that is not a gap -- it is the largest thing in the twelve gods and it is all table.
     */
    name: "The Lie That Held", strength: 5, pool: "faith", source: "The Yellow",
    needs: [],
    description: "<p>Name the lie before the fight. While you spend a secondary each round it is "
      + "true, and the GM runs the fight as though it always had been.</p>",
    effect: {
      whileState: "spendSecondaryEachRound",
      text: "a lie named before the fight is true"
    }
  },

  /*
   * --- Vax, two miracles, and the god who bills you per man ---
   *
   * *The Line Holds* pays 2 Health per ally, which is the same variable price *The Red Hour* and
   * *The Shield Line* pay and the same string. Three pieces of content from two Ways want one
   * mechanism, which is the clearest sign it belongs in the schema.
   */
  {
    name: "The Line Holds", strength: 4, pool: "faith", source: "Vax",
    needs: ["immunity to a named condition, which nothing grants"],
    description: "<p>Nobody beside you is moved, knocked down or turned. It costs two Health a "
      + "man, and Vax expects you to count them first.</p>",
    cost: { health: 2, scale: "perAlly" },
    effect: {
      duration: 1,
      targets: "adjacentAllies",
      text: "allies adjacent to you cannot be moved, knocked Prone or Compelled"
    }
  },
  {
    /*
     * The god's 5, and the only miracle in the game that moves damage ONTO the caster as a
     * standing rule rather than once. "It will cost enough" is the document's own pricing and it
     * is right: a priest of Vax holding a line of four is taking four men's hits.
     */
    name: "The Sixth District", strength: 5, pool: "faith", source: "Vax",
    needs: ["damage dealt to an ally dealt to you instead",
      "allies that share the caster's armor"],
    description: "<p>Your armour is theirs, your Block is theirs, and everything aimed at them "
      + "arrives in you. It will cost enough, which is how Vax prices war plainly.</p>",
    effect: {
      targets: "adjacentAllies",
      text: "until the fight ends every adjacent ally shares your armor and Block, and damage "
        + "dealt to them is dealt to you instead"
    }
  },
];

/* -------------------------------------------- */

/**
 * Way of Faith's Tactics (way-cards 2.5). Each is shaped by its god's Obedience, because a priest's
 * tactics are not theirs.
 */
/*
 * **Two were renamed, and both for the reason that renamed Infantry's.** The document gives Vax
 * *The Line*, which Way of Strength's Infantry already carries, and gives The First *What Does Not
 * Die*, which is the name of one of The First's own miracles. A player holding a card and carrying
 * a standing feature with one name doing two different things is the defect the collision check
 * exists to refuse, so way-cards 2.5 now prints the names below.
 */
export const FAITH_TACTICS = {
  "No Shelter for the Guilty":
    "Enemies get no cover from figures against you.",
  "Where the Air Goes":
    "You may reach any ally you can see, ignoring cover and range, for anything that heals or "
    + "helps.",
  "The Tide Comes In":
    "At the start of each round, move any one willing ally 1 square.",
  "The Drum Does Not Stop":
    "You may never Defend -- and if you moved toward an enemy this turn, your Strike cannot be "
    + "answered by a reaction.",
  "Nobody Remembers Your Face":
    "The first enemy to attack you each fight draws fate with disadvantage.",
  "Alone and Unafraid":
    "While no ally is within 2, you cannot be Compelled and enemies have disadvantage against you.",
  "Roots":
    "A square you have stood in for a whole round is high ground for you and difficult ground for "
    + "your enemies.",
  "Close Enough to Touch":
    "Moving into a square adjacent to an enemy costs you nothing, even out of difficult ground, "
    + "and never sets off a reaction.",
  "The Cup Passes":
    "An enemy will not willingly end its movement adjacent to you; doing so costs it a half.",
  "Nobody Knows Where You Are":
    "Enemies treat you as standing where you were at the start of the round.",
  "The Line of Vax":
    "While two or more allies are adjacent to you, none of you can be moved and none of you is "
    + "blocked by cover.",
  "What Is Left":
    "At 0 Health you keep acting as though at 1 until the end of the round in which you fell.",

  /* --- the four orders ---
   *
   * A god's Tactic is shaped by its Obedience; an order's is shaped by its rule, which is the same
   * bargain one layer down. None of the four names a number, because that is the standing rule for
   * a thing that is always on (way-cards 2.5).
   */
  "Nobody Lies Twice":
    "An enemy carrying an opening you put there may not take a reaction against you.",
  "Nobody Falls Beside You":
    "An ally adjacent to you may not be moved against their will, and cover between the two of "
    + "you does not exist.",
  "The Empty Cell":
    "You cannot be Burdened or Overloaded, and no card may be taken or lifted from any deck of "
    + "yours.",
  "Past Caring":
    "While your Health is half or less you cannot be Compelled or Heckled, and leaving a square "
    + "adjacent to an enemy never sets off a reaction."
};

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

export const LANGUAGES = [
  { name: "Imperial", of: "the old language and the diplomatic lingua franca" },
  { name: "Valgar", of: "lost language from the fifth district" },
  { name: "Perga", of: "the language at wolf's peak" },
  { name: "Veche", of: "the local tongue in Saag et Haar" },
  { name: "Elvish", of: "lingua franca within the elf group and most of lesser gods" },
  { name: "Demonic", of: "lingua franca in the demon group" },
  { name: "Troll", of: "lingua franca in the troll group" },
  { name: "Reversed", of: "reversed elvish used by undead" },
  { name: "Burrowing", of: "lingua franca of the burrower group" }
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

/* -------------------------------------------- */
/*  The levelling graph                         */
/* -------------------------------------------- */

/**
 * Nodes (rules/leveling.md 9). Content, not code: the engine in graph.mjs reads this, and nothing
 * here knows how eligibility works.
 *
 *   id         stable and namespaced; an add-on depends on it, so it is renamed about as freely
 *              as a database column (leveling 8)
 *   after[]    the nodes this may follow. ANY ONE of them being owned is enough, unless `all`
 *   all        true when every prerequisite is required -- how depth takes commitment, and what
 *              keeps a cross edge from laundering an exclusive choice (leveling 1)
 *   title      the title this confers, if it is a major node
 *   exclusive  the exclusion family, and `creed` the religion within it (leveling 3)
 *   grants     the reward, fixed. Numbers flow into prepareDerivedData beside the ones features
 *              and worn items grant; nothing is copied onto the sheet, so a corrected node fixes
 *              every character who took it (leveling 9)
 *   bespoke    content written for this node and nowhere else. Two minor nodes in three are NOT
 *              bespoke: they draw on a pool, which is the content budget leveling 1 sets
 *
 * All four Ways are built. `exclusive` and `creed` were written for Way of Faith and sat unused
 * until it existed; the twelve gods are their first content, and the religion is the group.
 *
 * The cross edges are the part worth reading twice. A cross edge is an edge like any other, so it
 * carries its own minor nodes. Attach one straight to the far title and a Cutpurse reaches Gambler
 * two levels sooner than a Duellist does, which is the shortcut leveling 1 forbids; attach it to
 * the far title's own lead-in minors and you have handed out Gambler's run without Gambler. So each
 * crossing is a short chain of its own: the Dream Guild teaches you, and being taught takes levels.
 */
export const NODES = [
  { id: "root", name: "Root", after: [] },

  /* --- the four Ways, all of them on your frontier for life (leveling 6) --- */
  {
    id: "shade", name: "Way of Shade", after: ["root"], title: "Shade",
    axis: "Position", resource: "halves"
  },
  {
    id: "strength", name: "Way of Strength", after: ["root"], title: "Warrior",
    axis: "Position", resource: "weight"
  },
  /*
   * **Both of these grant two slots, and neither did.** way-cards 1.4 says it in one line -- *a
   * first Way of Mind or Way of Faith node grants 2 spell slots* -- and `spellSlots.base` starts
   * at 0 for everyone, so a character who had walked into Way of Mind could prepare nothing at
   * all. Two is the smallest number that is a decision: one strength-2 formula, or two 1s.
   */
  {
    id: "mind", name: "Way of Mind", after: ["root"], title: "Scholar",
    axis: "Preparation", resource: "spell slots",
    grants: { spellSlots: 2 }
  },
  {
    id: "faith", name: "Way of Faith", after: ["root"], title: "Sworn",
    axis: "Support", resource: "an obligation",
    grants: { spellSlots: 2 }
  },

  /* --- the Shade trunk: three ordinary nodes before the first title --- */
  /*
   * A card AND a prune, which section 4 says is how a branch keeps a deck from drifting upward
   * every level without spending a whole level on pruning. It sits on the trunk rather than on the
   * Cutpurse run on purpose: Cutpurse PAYS in deck size, and handing its own branch a prune would
   * refund the price.
   */
  {
    id: "shade.footwork", name: "Footwork", after: ["shade"],
    grants: { card: "Measure", prune: 1 }
  },
  { id: "shade.quiet", name: "Quiet Hands", after: ["shade.footwork"],
    grants: { training: "lockpicks", expertise: "shadow" } },
  { id: "shade.patience", name: "Patience", after: ["shade.quiet"], grants: { health: 1 } },

  /* --- the three titles off the trunk --- */
  {
    id: "shade.thief", name: "Thief", after: ["shade.patience"], title: "Thief",
    axis: "Control", resource: "a slot kept free",
    signature: "The Opening", tactic: "Never Where You Looked",
    grants: { feature: "The Opening" }
  },
  {
    id: "shade.scout", name: "Scout", after: ["shade.patience"], title: "Scout",
    axis: "Support", resource: "being alone",
    signature: "Point Man", tactic: "Furthest Forward",
    grants: { card: "Point Man" }
  },
  {
    id: "shade.duellist", name: "Duellist", after: ["shade.patience"], title: "Duellist",
    axis: "Reactions", resource: "halves",
    signature: "Named", tactic: "One at a Time",
    grants: { card: "Named" }
  },

  /* --- Thief's three --- */
  { id: "shade.thief.wait", name: "The Wait", after: ["shade.thief"], grants: { card: "Cut and Run" } },
  {
    id: "shade.thief.shadowing", name: "Shadowing", after: ["shade.thief.wait"], bespoke: true,
    grants: { knowHow: "following someone through a city without being seen",
      feature: "Quiet Worker" }
  },
  {
    /*
     * The one node in the graph that requires ALL of its prerequisites, which is leveling 5a's
     * "depth takes commitment" made real: specializations.md says a dabbler reaches the first node
     * of anything and only an investment reaches Assassin, so Assassin wants two of Thief's three
     * runs walked rather than one. It is also the only content that exercises the `all` flag, and
     * an untested flag is a flag that does not work.
     */
    id: "shade.assassin", name: "Assassin", all: true,
    after: ["shade.thief.shadowing", "shade.thief.crowds"], title: "Assassin",
    axis: "Tempo", resource: "Spent",
    signature: "One Opening", tactic: "From Behind",
    grants: { card: "One Opening" }
  },

  { id: "shade.thief.crowds", name: "Crowds", after: ["shade.thief"], grants: { card: "Second Knife" } },
  {
    /* specializations.md demotes Fence to a cluster of minor nodes on the way to Cutpurse. */
    id: "shade.thief.fence", name: "Fence", after: ["shade.thief.crowds"], bespoke: true,
    grants: { knowHow: "valuing stolen goods, and the contact who buys them", training: "appraisal" }
  },
  {
    id: "shade.cutpurse", name: "Cutpurse", after: ["shade.thief.fence"], title: "Cutpurse",
    axis: "Deck shape", resource: "deck size",
    signature: "Lift", tactic: "Light Fingers",
    grants: { card: "Lift" }
  },

  { id: "shade.thief.ropework", name: "Ropework", after: ["shade.thief"], grants: { training: "rope and climbing" } },
  { id: "shade.thief.night", name: "Night Work", after: ["shade.thief.ropework"],
    grants: { carry: 1, mastery: "shadow" } },
  {
    id: "shade.burglar", name: "Burglar", after: ["shade.thief.night"], title: "Burglar",
    axis: "Preparation", resource: "weight",
    signature: "The Kit", tactic: "Through the Window",
    grants: { item: "The Kit" }
  },

  /* --- Scout's two --- */
  { id: "shade.scout.ranges", name: "Ranges", after: ["shade.scout"], grants: { card: "Call the Shot" } },
  { id: "shade.scout.breathing", name: "Breathing", after: ["shade.scout.ranges"], grants: { health: 1 } },
  {
    id: "shade.archer", name: "Archer", after: ["shade.scout.breathing"], title: "Archer",
    axis: "Position", resource: "range",
    signature: "Loose and Step", tactic: "Overwatch",
    grants: { card: "Loose and Step" }
  },

  { id: "shade.scout.groundwork", name: "Groundwork", after: ["shade.scout"],
    grants: { restTokens: 1, expertise: "wits" } },
  {
    /* And Spy, the second of the three demoted professions. */
    id: "shade.scout.spy", name: "Spy", after: ["shade.scout.groundwork"], bespoke: true,
    /* The same tongue from the other side: a scholar reads Imperial and a spy speaks it. Two
     * nodes may teach one language, and `learned` dedupes them (data/actors.mjs). */
    grants: { knowHow: "courts and crowded cities", training: "disguise", language: "Imperial" }
  },
  {
    id: "shade.trapmaker", name: "Trapmaker", after: ["shade.scout.spy", "shade.cross.wire"],
    title: "Trapmaker",
    axis: "Preparation", resource: "a turn spent early",
    signature: "Set", tactic: "The Ground You Chose",
    grants: { card: "Set" }
  },

  /* --- Duellist's four --- */
  { id: "shade.duellist.balance", name: "Balance", after: ["shade.duellist"], grants: { card: "Light Feet" } },
  { id: "shade.duellist.tumbling", name: "Tumbling", after: ["shade.duellist.balance"],
    grants: { knowHow: "falling", feature: "Light Step" } },
  {
    id: "shade.acrobat", name: "Acrobat", after: ["shade.duellist.tumbling", "shade.cross.ledges"],
    title: "Acrobat", axis: "Position", resource: "weight",
    signature: "Over and Past", tactic: "Never Cornered",
    grants: { card: "Over and Past" }
  },

  { id: "shade.duellist.timing", name: "Timing", after: ["shade.duellist"], grants: { card: "Mock" } },
  {
    /* Politician, the third. It sits on the way to Bard, which is where the room already was. */
    id: "shade.duellist.politician", name: "Politician", after: ["shade.duellist.timing"], bespoke: true,
    grants: { knowHow: "a council chamber that has already decided", training: "oratory" }
  },
  {
    id: "shade.bard", name: "Bard", after: ["shade.duellist.politician"], title: "Bard",
    axis: "Reactions", resource: "someone else's turn",
    signature: "Heckle", tactic: "The Running Commentary",
    grants: { card: "Heckle" }
  },

  { id: "shade.duellist.nerve", name: "Nerve", after: ["shade.duellist"], grants: { health: 1 } },
  {
    id: "shade.duellist.cards", name: "Card Sense", after: ["shade.duellist.nerve"], bespoke: true,
    grants: { knowHow: "games of chance, and who is cheating at them" }
  },
  {
    id: "shade.gambler", name: "Gambler", after: ["shade.duellist.cards", "shade.cross.odds"],
    title: "Gambler", axis: "Deck shape", resource: "the fate deck",
    signature: "Double or Nothing", tactic: "The Long Odds",
    grants: { card: "Double or Nothing" }
  },

  { id: "shade.duellist.letters", name: "Letters", after: ["shade.duellist"], grants: { training: "reading" } },
  {
    id: "shade.duellist.formula", name: "The First Formula", after: ["shade.duellist.letters"],
    bespoke: true, grants: { spellSlots: 1 }
  },
  {
    id: "shade.half-mage", name: "Half-mage", after: ["shade.duellist.formula"], title: "Half-mage",
    axis: "Preparation", resource: "spell slots",
    signature: "One Trick", tactic: "One Hand Free",
    grants: { spellSlots: 2, feature: "One Trick" }
  },

  /*
   * --- the three cross edges, each a short chain of its own
   *
   * None of them grants a card. A crossing teaches you about the other trade; the cards are behind
   * the title, which is the whole of leveling 1's "a cross edge to a title is cheap, past one is
   * the leak".
   */
  { id: "shade.cross.odds1", name: "The Tables", after: ["shade.cutpurse"], grants: { training: "games of chance" } },
  {
    id: "shade.cross.odds", name: "Long Odds", after: ["shade.cross.odds1"], bespoke: true,
    grants: { knowHow: "which of the Guild's tables are honest" }
  },

  { id: "shade.cross.wire1", name: "Tripwire", after: ["shade.burglar"], grants: { training: "traps" } },
  {
    id: "shade.cross.wire", name: "The Second Door", after: ["shade.cross.wire1"], bespoke: true,
    grants: { knowHow: "where a house is weakest from the inside" }
  },

  { id: "shade.cross.ledges1", name: "Ledges", after: ["shade.burglar"], grants: { carry: 1 } },
  {
    id: "shade.cross.ledges", name: "Rooftops", after: ["shade.cross.ledges1"], bespoke: true,
    grants: { knowHow: "rooftops, and what carries weight up there" }
  }
,
/* --- the Strength trunk: three ordinary nodes before the first title --- */
  /* Expertise sits where a Way already teaches that kind of work, two per Way, in the
   * approaches skill-rules 1 says the Way is thick in. */
  { id: "strength.drill", name: "Drill", after: ["strength"],
    grants: { card: "Hold the Line", expertise: "might" } },
  { id: "strength.march", name: "The March", after: ["strength.drill"], grants: { carry: 5 } },
  { id: "strength.scars", name: "Old Scars", after: ["strength.march"], grants: { health: 1 } },

  /* --- the three titles off the trunk: how you stand, how you strike, who you stand in front of --- */
  {
    id: "strength.infantry", name: "Infantry", after: ["strength.scars"], title: "Infantry",
    axis: "Position", resource: "an ally",
    signature: "Shoulder to Shoulder", tactic: "The Line",
    grants: { card: "Shoulder to Shoulder" }
  },
  {
    id: "strength.executioner", name: "Executioner", after: ["strength.scars"],
    title: "Executioner", axis: "Tempo", resource: "halves",
    signature: "Cleave to the Bone", tactic: "No Second Thought",
    grants: { feature: "Cleave to the Bone" }
  },
  {
    id: "strength.gladiator", name: "Gladiator", after: ["strength.scars"], title: "Gladiator",
    axis: "Reactions", resource: "Health",
    signature: "Play to the Crowd", tactic: "The Crowd Wants Blood",
    grants: { card: "Play to the Crowd" }
  },

  /* --- Infantry's four --- */
  { id: "strength.infantry.shields", name: "Shieldwork", after: ["strength.infantry"], grants: { card: "Shoulder Check" } },
  {
    id: "strength.infantry.watch", name: "The Watch", after: ["strength.infantry.shields"],
    bespoke: true, grants: { knowHow: "standing a watch, and what the night sounds like" }
  },
  {
    id: "strength.guardian", name: "Guardian", after: ["strength.infantry.watch"],
    title: "Guardian", axis: "Reactions", resource: "a slot kept free",
    signature: "The Wall", tactic: "The Door",
    grants: { feature: "The Wall" }
  },

  /* Mastery is the deeper step and raises what you notice rather than what you can push, so
   * one per Way, behind a title rather than on a trunk. */
  { id: "strength.infantry.load", name: "Load-Bearing", after: ["strength.infantry"],
    grants: { carry: 10, mastery: "might" } },
  {
    id: "strength.infantry.armoury", name: "Armoury", after: ["strength.infantry.load"],
    bespoke: true, grants: { training: "armour and its repair", knowHow: "what a dent means" }
  },
  {
    id: "strength.ironclad", name: "Ironclad", after: ["strength.infantry.armoury"],
    title: "Ironclad", axis: "Deck shape", resource: "weight",
    signature: "Nothing Gets Through", tactic: "Immovable",
    grants: { feature: "Nothing Gets Through" }
  },

  { id: "strength.infantry.crews", name: "Crews", after: ["strength.infantry"], grants: { card: "Heave" } },
  {
    id: "strength.infantry.siege", name: "Siegework", after: ["strength.infantry.crews"],
    bespoke: true, grants: { training: "siege engines" }
  },
  {
    id: "strength.artillerist", name: "Artillerist", after: ["strength.infantry.siege"],
    title: "Artillerist", axis: "Position", resource: "ground",
    signature: "Ranging Shot", tactic: "Ranging",
    grants: { card: "Ranging Shot" }
  },

  { id: "strength.infantry.orders", name: "Orders", after: ["strength.infantry"], grants: { card: "Shield Wall" } },
  {
    id: "strength.infantry.maps", name: "Maps", after: ["strength.infantry.orders"],
    bespoke: true, grants: { knowHow: "ground you have not walked, from a map of it" }
  },
  {
    id: "strength.tactician", name: "Tactician", after: ["strength.infantry.maps"],
    title: "Tactician", axis: "Support", resource: "halves",
    signature: "On My Call", tactic: "The Call",
    grants: { card: "On My Call" }
  },

  /* --- Executioner's three --- */
  { id: "strength.exec.seat", name: "The Seat", after: ["strength.executioner"], grants: { training: "riding" } },
  {
    id: "strength.exec.stable", name: "Stablework", after: ["strength.exec.seat"],
    /* Reading an animal that has decided something is Wits, and this node already says so. */
    bespoke: true, grants: { knowHow: "a horse that is about to refuse", feature: "Quick Eye" }
  },
  {
    id: "strength.knight", name: "Knight", after: ["strength.exec.stable"], title: "Knight",
    axis: "Position", resource: "gear you can lose",
    signature: "The Lance", tactic: "The Charge",
    grants: { card: "The Lance" }
  },

  { id: "strength.exec.temper", name: "Temper", after: ["strength.executioner"], grants: { card: "Hammerblow" } },
  { id: "strength.exec.fury", name: "Fury", after: ["strength.exec.temper"], grants: { health: 1 } },
  {
    id: "strength.berserker", name: "Berserker",
    after: ["strength.exec.fury", "strength.cross.rage"], title: "Berserker",
    axis: "Deck shape", resource: "Spent",
    signature: "Red Mist", tactic: "Forward Only",
    grants: { card: "Red Mist" }
  },

  { id: "strength.exec.powder", name: "Powder", after: ["strength.executioner"], grants: { card: "Two-Hand It" } },
  {
    id: "strength.exec.drillshot", name: "The Volley", after: ["strength.exec.powder"],
    bespoke: true, grants: { training: "firearms and their cleaning" }
  },
  {
    id: "strength.musketeer", name: "Musketeer", after: ["strength.exec.drillshot"],
    title: "Musketeer", axis: "Preparation", resource: "range",
    signature: "Loaded Before the Bell", tactic: "The Firing Step",
    grants: { feature: "Loaded Before the Bell" }
  },

  /* --- Gladiator's two --- */
  { id: "strength.glad.hands", name: "Bare Hands", after: ["strength.gladiator"],
    grants: { card: "Pull Them Down", expertise: "agility" } },
  {
    id: "strength.glad.alley", name: "Alley Work", after: ["strength.glad.hands"],
    bespoke: true, grants: { knowHow: "a crowd that is about to turn", feature: "Good Name" }
  },
  {
    id: "strength.street-fighter", name: "Street Fighter", after: ["strength.glad.alley"],
    title: "Street Fighter", axis: "Control", resource: "a weapon's value",
    signature: "Get a Grip", tactic: "The Alley",
    grants: { card: "Get a Grip" }
  },

  { id: "strength.glad.ward", name: "Warding", after: ["strength.gladiator"], grants: { card: "Beat the Blade" } },
  { id: "strength.glad.shadow", name: "The Shadow", after: ["strength.glad.ward"], grants: { health: 1 } },
  {
    id: "strength.bodyguard", name: "Bodyguard",
    after: ["strength.glad.shadow", "strength.cross.door"], title: "Bodyguard",
    axis: "Reactions", resource: "ground",
    signature: "Interpose", tactic: "Never Leave Them",
    grants: { card: "Interpose" }
  },

  /*
   * --- the two crossings, each its own short chain
   *
   * Guardian to Bodyguard on the axis, Ironclad to Berserker on the axis
   * (specializations.md, Way of Strength). Neither grants a card: a crossing teaches you about the
   * other trade and the cards stay behind the title.
   */
  { id: "strength.cross.door1", name: "One Charge", after: ["strength.guardian"], grants: { training: "close protection" } },
  {
    id: "strength.cross.door", name: "The One You Keep", after: ["strength.cross.door1"],
    bespoke: true, grants: { knowHow: "a room, and which door in it matters" }
  },

  { id: "strength.cross.rage1", name: "Weight of It", after: ["strength.ironclad"], grants: { carry: 5 } },
  {
    id: "strength.cross.rage", name: "Let It Out", after: ["strength.cross.rage1"],
    bespoke: true, grants: { knowHow: "when armour stops being protection" }
  },

  /*
   * --- Way of Mind: the twelve schools
   *
   * Grouped by **what the price takes**, which is way-cards 3.4's own principle -- *what makes a
   * formula belong to its school is not what it does, it is what it costs* -- read one level up. The
   * three trunk schools are the three kinds of creditor:
   *
   *   BLOOD MAGIC   your own substance pays: Health, a bound Taint, an empty hand, your competence
   *   ELEMENTAL     the table pays: coin, a card gone for the fight, a Wild in your luck, a place
   *   SPIRITUALISM  a person pays, and remembers: a debt, a secret, a pact, a prophecy
   *
   * **This Way has no cross edges, and that is a decision rather than an omission**
   * (leveling.md 1): the only ones worth wanting would arrive at a school's deeper nodes, which is
   * formulas without the school's cost -- the forbidden kind. Shade and Strength cross because
   * their content is cards and a card is a card; Mind's content IS its price.
   */

  /* --- the Mind trunk: three ordinary nodes before the first school ---
   *
   * **The trunk carries the slot ladder, and the two casting Ways carry the same one.** Strength
   * is the slot cost (way-cards 1.4), so the trunk is the only place a slot can be granted and be
   * certain to arrive: on a school node it reaches one school, on a god's branch one god. Two at
   * the root and one on each of the three trunk nodes is five by the time a caster holds a list
   * written to five -- which is 3.4's thesis formula prepared alone and nothing beside it, exactly
   * the way 1.4 says a 5 should read.
   */
  {
    id: "mind.letters", name: "Letters", after: ["mind"],
    /* **Imperial** is *the old language and the diplomatic lingua franca* (worldinfo/Firma.md), so
     * it belongs where reading does: the first node of the scholar's trunk teaches the alphabet
     * that everything else in this Way is written in. */
    grants: { training: "reading and writing", spellSlots: 1, language: "Imperial",
      expertise: "lore" }
  },
  {
    /* The common card a caster gets is the one about spacing, because where to stand is the hard
     * problem this whole Way's Tactics are written about (way-cards 2.5). */
    id: "mind.candle", name: "The Candle", after: ["mind.letters"],
    grants: { card: "Measure", spellSlots: 1 }
  },
  {
    /*
     * A prune, and the reasoning is the exact mirror of Shade's. Cutpurse pays in deck size, so a
     * prune on its branch would refund the price; a caster's power is not in their action deck at
     * all, so thinning it costs this Way nothing and is pure gain. The same reward reads as a
     * refund in one Way and as a gift in another, which is what it means for a price to be real.
     */
    id: "mind.vigil", name: "The Long Vigil", after: ["mind.candle"],
    grants: { spellSlots: 1, prune: 1 }
  },

  /* --- the three schools off the trunk --- */
  {
    id: "mind.blood", name: "Blood Magic", after: ["mind.vigil"], title: "Blood Magic",
    axis: "Tempo", resource: "your own Health",
    signature: "Blood Price", tactic: "Your Own Blood Is Nearest",
    /* **Demonic**, because blood is the currency it is spoken in: the demons hold the Third Side
     * and let the necromancers use it *in exchange for human sacrifices* (Firma.md). The school
     * whose price is its own Health is the school that can afford the conversation. */
    grants: { spell: "Blood Price", language: "Demonic" }
  },
  {
    id: "mind.elemental", name: "Elemental Magic", after: ["mind.vigil"], title: "Elemental Magic",
    axis: "Position", resource: "reagents",
    signature: "Wall of the Sphere", tactic: "The Sphere Holds",
    grants: { spell: "Wall of the Sphere" }
  },
  {
    id: "mind.spiritualism", name: "Spiritualism", after: ["mind.vigil"], title: "Spiritualism",
    axis: "Preparation", resource: "a pact",
    signature: "The Bargain", tactic: "Something Is Always Listening",
    grants: { spell: "The Bargain" }
  },

  /* --- Blood's three --- */
  {
    id: "mind.blood.vein", name: "The Vein", after: ["mind.blood"],
    grants: { spell: "Open the Vein" }
  },
  {
    id: "mind.blood.anatomy", name: "Anatomy", after: ["mind.blood.vein"], bespoke: true,
    /* The other half of "treating wounds": a mage who knows what a body is made of can use a
     * Healer's Kit to its printed value, and a training granted twice is one training (actors.mjs
     * dedupes `learned`). */
    grants: { knowHow: "what a body is made of, living or dead", training: "treating wounds",
      feature: "Well Read" }
  },
  {
    id: "mind.necromancy", name: "Necromancy", after: ["mind.blood.anatomy"], title: "Necromancy",
    axis: "Preparation", resource: "a bound Taint",
    signature: "Call the Unquiet", tactic: "The Dead Are Furniture",
    /* **Reversed** is *reversed elvish used by undead* (Firma.md), so it is the one language in
     * the world that is a derivation rather than a tongue -- and the school that calls the unquiet
     * is the only one with anybody to practise it on. */
    grants: { spell: "Call the Unquiet", language: "Reversed" }
  },

  {
    id: "mind.blood.fasting", name: "Fasting", after: ["mind.blood"],
    grants: { spell: "Boil" }
  },
  { id: "mind.blood.silence", name: "Silence", after: ["mind.blood.fasting"],
    grants: { health: 1, mastery: "lore" } },
  {
    id: "mind.asceticism", name: "Asceticism", after: ["mind.blood.silence"], title: "Asceticism",
    axis: "Deck shape", resource: "an empty hand",
    signature: "Nothing Left to Take", tactic: "The Still Point",
    grants: { spell: "Nothing Left to Take" }
  },

  {
    id: "mind.blood.doses", name: "Doses", after: ["mind.blood"],
    grants: { spell: "The Second Heartbeat" }
  },
  {
    id: "mind.blood.measures", name: "Measures", after: ["mind.blood.doses"],
    grants: { spell: "The Red Hour" }
  },
  {
    id: "mind.poison", name: "Poison", after: ["mind.blood.measures"], title: "Poison",
    axis: "Control", resource: "skill cards",
    signature: "Wither", tactic: "The Patient Hand",
    grants: { spell: "Wither" }
  },

  /* --- Elemental's three ---
   *
   * These four nodes are why the combo pair is finally reachable. Rain and Lightning have been
   * content since the `when` clause was written, and nothing in the game handed either of them
   * over: they were on the actor because the setup routine put them there. Now they are two nodes
   * on one branch, six slots between them, which is the price way-cards 1.4 says a combo costs.
   */
  { id: "mind.elem.rain", name: "The Rain Sign", after: ["mind.elemental"], grants: { spell: "Rain" } },
  {
    id: "mind.elem.dark", name: "The Dark Sphere", after: ["mind.elem.rain"], bespoke: true,
    grants: { knowHow: "which places hold shadow, and at what hour" }
  },
  {
    id: "mind.shadow", name: "Shadow Magic", after: ["mind.elem.dark"], title: "Shadow Magic",
    axis: "Position", resource: "a permanent Wild",
    signature: "Step Through", tactic: "At Home in the Dark",
    grants: { spell: "Step Through" }
  },

  {
    id: "mind.elem.storm", name: "The Storm Sign", after: ["mind.elemental"],
    grants: { spell: "Lightning" }
  },
  { id: "mind.elem.circles", name: "Circles", after: ["mind.elem.storm"], grants: { spellSlots: 1 } },
  {
    id: "mind.ward", name: "Ward Magic", after: ["mind.elem.circles"], title: "Ward Magic",
    axis: "Reactions", resource: "Spent",
    signature: "Unmake", tactic: "The Standing Guard",
    grants: { spell: "Unmake" }
  },

  {
    id: "mind.elem.frost", name: "The Frost Sign", after: ["mind.elemental"],
    grants: { spell: "Frost" }
  },
  {
    id: "mind.elem.hearth", name: "The Hearth", after: ["mind.elem.frost"],
    grants: { spell: "Scorch" }
  },
  {
    id: "mind.household", name: "Household Magic", after: ["mind.elem.hearth"],
    title: "Household Magic",
    /*
     * specializations.md leaves this one [OPEN]: the out-of-combat schools do not fit a six-axis
     * template built for a fight. It is given **Support / a place you know** rather than left
     * cell-less, because a node with no cell cannot be checked against its siblings at all -- and
     * the honest reading is that a household mage supports a party between fights, which is the
     * same axis the Tactician and the Divinator sit on for different reasons.
     */
    axis: "Support", resource: "a place you know",
    signature: "Hearth and Home", tactic: "The House Helps",
    grants: { spell: "Hearth and Home" }
  },

  /* --- Spiritualism's three --- */
  {
    /* The node is not called "The Small Pact": the spell is, and two pieces of content may not
     * share a name (the check that found Infantry's Signature wearing its Tactic's). */
    id: "mind.spirit.pact", name: "The First Pact", after: ["mind.spiritualism"],
    /* A pact is a negotiation before it is a formula, which is why Presence is what it teaches. */
    grants: { spell: "The Small Pact", expertise: "presence" }
  },
  {
    id: "mind.spirit.debts", name: "Debts", after: ["mind.spirit.pact"], bespoke: true,
    /* **Elvish** is the elves' lingua franca *and most of the lesser gods'* (Firma.md), which is
     * this school's whole subject -- and this node already knows who owes whom among them. */
    grants: { knowHow: "who owes whom among the elf-kin", language: "Elvish" }
  },
  {
    id: "mind.glamour", name: "Glamour", after: ["mind.spirit.debts"], title: "Glamour",
    axis: "Control", resource: "an elven debt",
    signature: "Not Here", tactic: "Never Quite There",
    grants: { spell: "Not Here" }
  },

  {
    id: "mind.spirit.names", name: "Nine Names", after: ["mind.spiritualism"],
    /* **Troll**, because the Troll King is a minor god and *essentially all trolls follow* him
     * (Firma.md): the node that learns the names of spirits learns the tongue of the largest
     * following any of them has. */
    grants: { spell: "The Nine Names", language: "Troll" }
  },
  {
    id: "mind.spirit.skin", name: "Skin and Ink", after: ["mind.spirit.names"],
    grants: { training: "tattooing" }
  },
  {
    id: "mind.tattoo", name: "Tattoo Magic", after: ["mind.spirit.skin"], title: "Tattoo Magic",
    axis: "Deck shape", resource: "a secret",
    signature: "Graven Strength", tactic: "Nothing to Prepare",
    /*
     * A feature, not a spell: a tattoo is never prepared. `grantSlate` has created features since
     * Signatures were written and `SLATES` has always held this one, so the key is the only change.
     *
     * What it SPENDS is not here, and that is a gap rather than an omission. way-cards 3.4 prices
     * this school in capacity -- *a tattoo spends its slots permanently* -- and the obvious shape
     * for it, a negative `spellSlots` on this node, drops Way of Mind's ceiling from six slots to
     * five and leaves one school's list unaffordable to the caster it was written for. That is the
     * Way ladder's arithmetic, not this school's, so all seven cards name the gap and wait.
     */
    grants: { feature: "Graven Strength" }
  },

  {
    id: "mind.spirit.omens", name: "Omens", after: ["mind.spiritualism"],
    grants: { spell: "Hold to the Bargain" }
  },
  {
    id: "mind.spirit.gathered", name: "The Gathered", after: ["mind.spirit.omens"],
    grants: { spell: "The Gathered Pact" }
  },
  {
    id: "mind.divination", name: "Divination", after: ["mind.spirit.gathered"], title: "Divination",
    axis: "Support", resource: "someone else's turn",
    signature: "The Reading", tactic: "Already Seen",
    /* **Valgar** is a *lost* language from the fifth district (Firma.md), and a lost language is
     * not learned from a speaker. It is read, which is what this school is for. */
    grants: { spell: "The Reading", language: "Valgar" }
  },

  /*
   * --- Way of Faith: twelve gods, and the only Way whose first step closes the others
   *
   * The inverse of every other Way. Shade, Strength and Mind are narrow and deep -- three titles
   * off a trunk and nine behind them. Faith is **wide and shallow**: twelve doors at the top,
   * because here *the choice is the content* (specializations.md).
   *
   * **The religion is the exclusive group**, nested inside the `faith` family: taking a god closes
   * every god of every other religion for good, and leaves your own religion's open. Nothing new
   * was needed for that -- `exclusive` with a `creed` was written for exactly this and has been
   * built and unused since the day it was written. This is its first content.
   *
   * **A religion's size is its price.** Serve a pantheon and you may add its other gods later, a
   * level each, going wider; serve a lone god and you never will -- so a lone god's branch runs
   * **four nodes deeper**, which is how many spare doors The Five has. That is leveling.md 7's
   * depth consistency applied to a Way that spends its depth sideways.
   *
   * Twelve siblings cannot lean on seven axes without repeating, and the pigeonhole principle says
   * so before anyone writes a word. So this Way is distinguished by what it TAKES: twelve
   * different resources, so all twelve cells are distinct on the resource alone.
   */

  /* --- the Faith trunk: three ordinary nodes before the first vow ---
   *
   * The same slot ladder as the Mind trunk above, for the same reason: twelve gods are siblings,
   * so a slot on any one branch is a slot eleven priests never see. The First is untouched by it --
   * its Obedience caps slots at 3 and its list stops at 3, which is the one place in the content
   * where a list and a ceiling were written to each other on purpose.
   *
   * No prune here, and the reason is a god. The Eternal God's Obedience is *your action deck may
   * hold no more than 12 cards*; a prune on the shared trunk would pre-pay that price for a
   * character who has not sworn to him yet, and hand every other priest a reward he has to earn.
   */
  { id: "faith.vows", name: "Vows", after: ["faith"],
    grants: { training: "liturgy", spellSlots: 1 } },
  {
    id: "faith.pilgrimage", name: "Pilgrimage", after: ["faith.vows"],
    grants: { card: "Hold the Line", spellSlots: 1, expertise: "presence" }
  },
  { id: "faith.calling", name: "The Calling", after: ["faith.pilgrimage"],
    grants: { restTokens: 1, spellSlots: 1 } },

  /* --- the four lone gods: one door, no second god ever, and a branch four nodes deeper --- */
  {
    id: "faith.eternalgod", name: "The Eternal God", after: ["faith.calling"],
    title: "The Eternal God", exclusive: "faith", creed: "eternal-god",
    axis: "Control", resource: "deck size",
    signature: "The Clean Hand", tactic: "No Shelter for the Guilty",
    obedience: "Your action deck may hold no more than 12 cards, and the faith names what may "
      + "not be in it.",
    gift: "Solidarity: his miracles cast on a brother or sister in faith cost one less -- no "
      + "Strain, no Spent.",
    grants: { spell: "The Clean Hand" }
  },
  { id: "faith.eg.rule", name: "The Rule", after: ["faith.eternalgod"], grants: { spell: "Name the Guilty" } },
  { id: "faith.eg.fast", name: "The Fast", after: ["faith.eg.rule"], grants: { health: 1 } },
  {
    id: "faith.eg.office", name: "The Night Office", after: ["faith.eg.fast"],
    grants: { spell: "Steady the Hand" }
  },
  { id: "faith.eg.scripture", name: "Scripture", after: ["faith.eg.office"],
    grants: { training: "the holy books", expertise: "lore" } },
  { id: "faith.eg.clean", name: "The Clean Body", after: ["faith.eg.scripture"], grants: { spellSlots: 1 } },
  {
    id: "faith.eg.alms", name: "Alms", after: ["faith.eg.clean"], bespoke: true,
    grants: { knowHow: "which houses of the faith will take you in" }
  },

  {
    id: "faith.eternalspirit", name: "The Eternal Spirit", after: ["faith.calling"],
    title: "The Eternal Spirit", exclusive: "faith", creed: "eternal-spirit",
    axis: "Reactions", resource: "weight",
    signature: "Breath of the Spirit", tactic: "Where the Air Goes",
    obedience: "You must stay Unburdened, and wear no armour heavier than Leather.",
    gift: "The spirit drifts through all the air: his miracles ignore range and cover.",
    grants: { spell: "Breath of the Spirit" }
  },
  { id: "faith.es.breath", name: "Breath", after: ["faith.eternalspirit"], grants: { spell: "Lay On" } },
  { id: "faith.es.word", name: "The Given Word", after: ["faith.es.breath"], grants: { spell: "A Word for You" } },
  { id: "faith.es.air", name: "The Open Air", after: ["faith.es.word"], grants: { carry: 1 } },
  { id: "faith.es.unseen", name: "The Unseen", after: ["faith.es.air"], grants: { restTokens: 1 } },
  { id: "faith.es.hand", name: "The Open Hand", after: ["faith.es.unseen"], grants: { spellSlots: 1 } },
  {
    id: "faith.es.distance", name: "Distance", after: ["faith.es.hand"], bespoke: true,
    grants: { knowHow: "how far a voice carries, and where it will not", mastery: "presence" }
  },

  {
    id: "faith.vax", name: "Vax", after: ["faith.calling"], title: "Vax",
    exclusive: "faith", creed: "vax",
    axis: "Position", resource: "Health",
    signature: "The Club and the Line", tactic: "The Line of Vax",
    obedience: "Every miracle costs at least 1 Health, and the card may ask more.",
    gift: "His miracles need no free hand: the spiked club is the holy symbol. Nothing else in "
      + "the game sets aside the free-hand rule, and it is what makes a cleric-fighter possible.",
    grants: { spell: "The Club and the Line" }
  },
  { id: "faith.vax.club", name: "The Club", after: ["faith.vax"], grants: { spell: "Stand Where I Stand" } },
  { id: "faith.vax.shield", name: "The Shield", after: ["faith.vax.club"], grants: { spell: "The Shield Line" } },
  { id: "faith.vax.ranks", name: "The Ranks", after: ["faith.vax.shield"], grants: { health: 1 } },
  { id: "faith.vax.drill", name: "Drill", after: ["faith.vax.ranks"],
    grants: { training: "shield and club", feature: "Hard Hands" } },
  { id: "faith.vax.blood", name: "Blood Paid", after: ["faith.vax.drill"], grants: { health: 1 } },
  {
    id: "faith.vax.sixth", name: "The Sixth", after: ["faith.vax.blood"], bespoke: true,
    grants: { knowHow: "the Sixth District, and who owes the temple" }
  },

  {
    /*
     * The one node in the game that CAPS a derived maximum rather than raising it. Every other
     * grant adds; this says *your spell slots are capped at 3, for ever*, which is why The First
     * has no strength-4 and no strength-5 miracle -- the obedience bites at the top of the ladder
     * as well as the bottom (way-cards 3.5).
     */
    id: "faith.first", name: "The First", after: ["faith.calling"], title: "The First",
    exclusive: "faith", creed: "first",
    axis: "Deck shape", resource: "spell slots",
    signature: "The Long Night", tactic: "What Is Left",
    obedience: "Your spell slots are capped at 3, for ever.",
    gift: "His miracles return what they take: Health drained from a living target comes back "
      + "to you, which is the only renewable pool in the game.",
    grants: { spell: "The Long Night", caps: { spellSlots: 3 } }
  },
  { id: "faith.first.debt", name: "The Debt", after: ["faith.first"], grants: { spell: "Measure of the Debt" } },
  {
    id: "faith.first.watch", name: "The Long Watch", after: ["faith.first.debt"],
    grants: { spell: "What Does Not Die" }
  },
  {
    /*
     * Way of Faith's only prune, and it is on the god who wants a narrow deck anyway -- *few
     * slots, and a deck narrow enough to hold them* (way-cards 3.5), which is one node.
     */
    id: "faith.first.narrow", name: "The Narrow Deck", after: ["faith.first.watch"],
    grants: { spellSlots: 1, prune: 1 }
  },
  { id: "faith.first.blood", name: "The Blood", after: ["faith.first.narrow"], grants: { health: 1 } },
  {
    /*
     * The fourth slot, which the cap eats. That is deliberate and it is the only way an obedience
     * can be a price rather than a decoration: the god offers more than you may hold, and what
     * stops you is the vow. A priest of The First who walks the whole branch is granted four slots
     * and keeps three, for ever.
     */
    id: "faith.first.rest", name: "The Long Sleep", after: ["faith.first.blood"],
    grants: { spellSlots: 1 }
  },
  {
    id: "faith.first.echterhof", name: "Echterhof", after: ["faith.first.rest"], bespoke: true,
    grants: { knowHow: "Echterhof, and what is buried under it" }
  },

  /* --- The Five: five doors, four of them re-openable, so each branch runs two nodes --- */
  {
    id: "faith.sessyfyn", name: "Sessyfyn", after: ["faith.calling"], title: "Sessyfyn",
    exclusive: "faith", creed: "five",
    axis: "Support", resource: "the fate deck",
    signature: "The Tide Knows", tactic: "The Tide Comes In",
    obedience: "A permanent Miss AND a permanent Critical in your fate deck. Not one or the other.",
    grants: { spell: "The Tide Knows" }
  },
  { id: "faith.sess.tides", name: "The Tides", after: ["faith.sessyfyn"], grants: { spell: "Undertow" } },
  {
    id: "faith.sess.salt", name: "Salt Wisdom", after: ["faith.sess.tides"], bespoke: true,
    grants: { knowHow: "the sea, and what it does not forgive" }
  },

  {
    id: "faith.valtor", name: "Valtor", after: ["faith.calling"], title: "Valtor",
    exclusive: "faith", creed: "five",
    axis: "Tempo", resource: "Strain",
    signature: "The Drum", tactic: "The Drum Does Not Stop",
    obedience: "Every miracle costs Strain 1 on top of its slots.",
    grants: { spell: "The Drum" }
  },
  { id: "faith.valtor.drums", name: "The Drums", after: ["faith.valtor"], grants: { spell: "No Step Back" } },
  { id: "faith.valtor.fury", name: "Fury", after: ["faith.valtor.drums"], grants: { health: 1 } },

  {
    id: "faith.fagar", name: "Fagar", after: ["faith.calling"], title: "Fagar",
    exclusive: "faith", creed: "five",
    axis: "Control", resource: "Spent",
    signature: "The Borrowed Face", tactic: "Nobody Remembers Your Face",
    obedience: "Each miracle may be cast once per fight. A trick works once.",
    grants: { spell: "The Borrowed Face" }
  },
  { id: "faith.fagar.masks", name: "Masks", after: ["faith.fagar"], grants: { spell: "The Second Thought" } },
  { id: "faith.fagar.trick", name: "The Trick", after: ["faith.fagar.masks"], grants: { training: "sleight of hand" } },

  {
    id: "faith.vulpet", name: "Vulpet", after: ["faith.calling"], title: "Vulpet",
    exclusive: "faith", creed: "five",
    axis: "Preparation", resource: "an ally",
    signature: "The Outcast's Due", tactic: "Alone and Unafraid",
    obedience: "You may not accept help: no ally may Heal you, Interpose for you, or Shake a "
      + "condition off you.",
    grants: { spell: "The Outcast's Due" }
  },
  { id: "faith.vulpet.road", name: "The Road", after: ["faith.vulpet"], grants: { spell: "Alone on the Road" } },
  {
    id: "faith.vulpet.driven", name: "Driven Out", after: ["faith.vulpet.road"], bespoke: true,
    /* **Burrowing**, the lingua franca of the burrower group (Firma.md). Vulpet was driven out by
     * everyone and became ruler of the land beneath, and the mole men down there follow the Queen
     * of the Dark: this node already knows where the unwanted go, and this is what they speak. */
    grants: { knowHow: "where the unwanted go, and who feeds them", language: "Burrowing" }
  },

  {
    id: "faith.brendan", name: "Brendan", after: ["faith.calling"], title: "Brendan",
    exclusive: "faith", creed: "five",
    axis: "Support", resource: "a turn spent early",
    signature: "Out of Barren Ground", tactic: "Roots",
    obedience: "Nothing he gives arrives on the turn you ask for it: every miracle resolves at "
      + "the start of your next turn at the earliest.",
    grants: { spell: "Out of Barren Ground" }
  },
  { id: "faith.brendan.seed", name: "The Seed", after: ["faith.brendan"], grants: { spell: "Full Belly" } },
  { id: "faith.brendan.ground", name: "Slow Ground", after: ["faith.brendan.seed"], grants: { restTokens: 1 } },

  /* --- The Grey: three doors, matching its three holy books and three sects --- */
  {
    id: "faith.grey", name: "The Grey", after: ["faith.calling"], title: "The Grey",
    exclusive: "faith", creed: "grey",
    axis: "Reactions", resource: "range",
    signature: "The Silent Hour", tactic: "Close Enough to Touch",
    obedience: "Adjacent only. Every miracle of The Grey reaches one square and no further.",
    grants: { spell: "The Silent Hour" }
  },
  { id: "faith.grey.quiet", name: "The Quiet Step", after: ["faith.grey"], grants: { spell: "Grey Judgement" } },
  { id: "faith.grey.arm", name: "Arm's Length", after: ["faith.grey.quiet"], grants: { training: "the knife" } },

  {
    id: "faith.purple", name: "The Purple", after: ["faith.calling"], title: "The Purple",
    exclusive: "faith", creed: "grey",
    axis: "Control", resource: "Taint",
    signature: "The First Taste", tactic: "The Cup Passes",
    obedience: "The first miracle you cast each fight gives you 1 Taint. You are the first to "
      + "taste it, always.",
    grants: { spell: "The First Taste" }
  },
  { id: "faith.purple.dose", name: "The Dose", after: ["faith.purple"], grants: { spell: "Taste of the Rot" } },
  {
    id: "faith.purple.cup", name: "The Cup", after: ["faith.purple.dose"], bespoke: true,
    grants: { knowHow: "what is in the water, and who put it there" }
  },

  {
    id: "faith.yellow", name: "The Yellow", after: ["faith.calling"], title: "The Yellow",
    exclusive: "faith", creed: "grey",
    axis: "Preparation", resource: "halves",
    signature: "The Rumour", tactic: "Nobody Knows Where You Are",
    obedience: "A lie must be kept up: every miracle ends the moment you fail to spend a "
      + "secondary on it.",
    grants: { spell: "The Rumour" }
  },
  { id: "faith.yellow.whispers", name: "Whispers", after: ["faith.yellow"], grants: { spell: "The Planted Word" } },
  {
    id: "faith.yellow.network", name: "The Network", after: ["faith.yellow.whispers"], bespoke: true,
    grants: { knowHow: "who carries a rumour, and how fast" }
  },

  /* --- the twenty-four menu nodes ---
   *
   * One behind every school and every god: **one formula or miracle of your choice from that
   * source's list**.
   *
   * Ninety-five of the hundred and forty-seven spells were on no node at all, and these are what
   * reach them. Nothing above changed to make room: every named grant on every branch is still
   * exactly the formula the branch was written around -- Rain and Lightning are still two nodes six
   * slots apart, which is the price way-cards 1.4 says a combo costs -- and this is one more node
   * on each branch rather than a rewrite of the ones there.
   *
   * They sit immediately behind the title, which is the earliest the choice can honestly be
   * offered: way-cards 3.4 argues the bottom of the ladder from a caster's FIRST day with the
   * school, and a node three steps further in would be arguing about their fourth.
   *
   * **Nine of these are the first thing behind their title.** The deep schools -- Necromancy,
   * Poison, Glamour, Tattoo, Asceticism, Shadow, Household, Ward, Divination -- are the level-8
   * ones a character crosses two branches to reach, and until now they were leaves: you arrived,
   * took the Signature, and the school had nothing else in it. A branch has to be worth walking to
   * the end (way-cards 3.4), and six formulas you could not be taught is not an end.
   */
  { id: "mind.blood.book", name: "The Opened Book", after: ["mind.blood"],
    grants: { choose: { from: "Blood Magic" } } },
  { id: "mind.elem.pages", name: "The Sphere's Pages", after: ["mind.elemental"],
    grants: { choose: { from: "Elemental Magic" } } },
  { id: "mind.spirit.written", name: "Another Pact Written", after: ["mind.spiritualism"],
    grants: { choose: { from: "Spiritualism" } } },
  { id: "mind.necro.ledger", name: "The Grave Ledger", after: ["mind.necromancy"],
    grants: { choose: { from: "Necromancy" } } },
  { id: "mind.poison.shelf", name: "The Apothecary's Shelf", after: ["mind.poison"],
    grants: { choose: { from: "Poison" } } },
  { id: "mind.glamour.face", name: "A Borrowed Face", after: ["mind.glamour"],
    grants: { choose: { from: "Glamour" } } },
  { id: "mind.tattoo.clean", name: "Skin Still Clean", after: ["mind.tattoo"],
    grants: { choose: { from: "Tattoo Magic" } } },
  { id: "mind.ascetic.given", name: "One More Thing Given", after: ["mind.asceticism"],
    grants: { choose: { from: "Asceticism" } } },
  { id: "mind.shadow.deeper", name: "A Deeper Dark", after: ["mind.shadow"],
    grants: { choose: { from: "Shadow Magic" } } },
  { id: "mind.house.book", name: "The Household Book", after: ["mind.household"],
    grants: { choose: { from: "Household Magic" } } },
  { id: "mind.ward.record", name: "The Warder's Record", after: ["mind.ward"],
    grants: { choose: { from: "Ward Magic" } } },
  { id: "mind.div.thread", name: "Another Thread", after: ["mind.divination"],
    grants: { choose: { from: "Divination" } } },

  /* And the twelve gods. A miracle costs nothing to learn -- a god grants it (way-cards 1.4) -- so
   * what a priest is choosing here is which part of the litany they know, not what it cost them. */
  { id: "faith.eg.recited", name: "The Rule Recited", after: ["faith.eternalgod"],
    grants: { choose: { from: "The Eternal God" } } },
  { id: "faith.es.another", name: "Another Word", after: ["faith.eternalspirit"],
    grants: { choose: { from: "The Eternal Spirit" } } },
  { id: "faith.vax.order", name: "The Next Order", after: ["faith.vax"],
    grants: { choose: { from: "Vax" } } },
  { id: "faith.first.else", name: "What Else Does Not Die", after: ["faith.first"],
    grants: { choose: { from: "The First" } } },
  { id: "faith.sess.next", name: "The Next Tide", after: ["faith.sessyfyn"],
    grants: { choose: { from: "Sessyfyn" } } },
  { id: "faith.valtor.again", name: "The Drum Again", after: ["faith.valtor"],
    grants: { choose: { from: "Valtor" } } },
  { id: "faith.fagar.another", name: "Another Mask", after: ["faith.fagar"],
    grants: { choose: { from: "Fagar" } } },
  { id: "faith.vulpet.further", name: "Further Out", after: ["faith.vulpet"],
    grants: { choose: { from: "Vulpet" } } },
  { id: "faith.brendan.season", name: "Another Season", after: ["faith.brendan"],
    grants: { choose: { from: "Brendan" } } },
  { id: "faith.grey.quieter", name: "Quieter Still", after: ["faith.grey"],
    grants: { choose: { from: "The Grey" } } },
  { id: "faith.purple.stronger", name: "A Stronger Dose", after: ["faith.purple"],
    grants: { choose: { from: "The Purple" } } },
  { id: "faith.yellow.longer", name: "A Longer Lie", after: ["faith.yellow"],
    grants: { choose: { from: "The Yellow" } } },

  /* --- the four holy orders: Way of Faith's second tier ---
   *
   * **A god is a choice between twelve. An order is what you do about it**, and until now this Way
   * had the first and not the second: twelve doors at the top and nothing behind any of them, where
   * the other three Ways put three titles at tier 1 and nine or ten behind them. A priest reached
   * level 5 and had nothing left in their own Way to walk toward.
   *
   * **The world wrote these before the rules did.** Every religion's *Groupings* section in
   * Firma.md lists the same kinds of institution under different names -- a religious secret police
   * (the Black Circle, God's Spirit), an order of knights (the Holy Shield, the Holy Sword), a
   * monastic order (the White Brothers, the Black Sisters, the Devoted) and the extreme (the
   * Flagellants, the Berserkers, the Mummers) -- and specializations.md listed all of it as content
   * that was reaching the rules through nothing at all.
   *
   * **So the order is the tier and the religion only names it**, which is what keeps this from
   * being twelve times four: an order is open to a priest of any god, so four titles serve twelve
   * where forty-eight would be needed to give each god its own. `faith.ordination` is `after` all
   * twelve, and `after` is OR (graph.mjs `satisfied`), so one god is enough and no god is special.
   *
   * **`exclusive: "order"` is the second family the group rule has ever had**, and it is the proof
   * that the rule was written general rather than for the gods: one order, for good, the same way
   * one religion is for good. A priest pays BOTH vows, because `termsOf` accumulates every
   * obedience owned and only the Tactic is singular -- so the deepest title's Tactic is now the
   * order's and the god's Obedience still stands.
   */
  { id: "faith.ordination", name: "Ordination",
    after: ["faith.eternalgod", "faith.eternalspirit", "faith.vax", "faith.first",
      "faith.sessyfyn", "faith.valtor", "faith.fagar", "faith.vulpet", "faith.brendan",
      "faith.grey", "faith.purple", "faith.yellow"],
    grants: { training: "the rule of an order" } },

  /* One path node each, so the order arrives at level 8 like every other tier-2 title, and so the
   * level spent getting there is a level spent on the order rather than on the god. */
  { id: "faith.order.circle", name: "The Black Circle", after: ["faith.ordination"],
    grants: { knowHow: "who in a congregation is lying, and to whom" } },
  { id: "faith.order.shield", name: "The Holy Shield", after: ["faith.ordination"],
    grants: { training: "shield and formation" } },
  { id: "faith.order.cloister", name: "The Cloister", after: ["faith.ordination"],
    /* The infirmary is monastic in this world as in ours, and the training was the one a tool
     * named and no node taught: a Healer's Kit is Lore +2 and was capped at +1 for ever. */
    grants: { restTokens: 1, training: "treating wounds" } },
  { id: "faith.order.drums", name: "The Drums", after: ["faith.ordination"],
    grants: { knowHow: "working a crowd into a state" } },

  {
    id: "faith.inquisitor", name: "Inquisitor", after: ["faith.order.circle"],
    title: "Inquisitor", exclusive: "order", creed: "circle",
    axis: "Control", resource: "a secret",
    signature: "The Writ", tactic: "Nobody Lies Twice",
    obedience: "You hold one thing about every ally that the others do not know, and the order "
      + "may ask you for it.",
    grants: { card: "The Writ" }
  },
  {
    id: "faith.shieldsworn", name: "Shieldsworn", after: ["faith.order.shield"],
    title: "Shieldsworn", exclusive: "order", creed: "shield",
    /*
     * **This order wrote itself as taking a kept-free spell slot first, and that is the one thing
     * it must not take.** way-cards 1.4's invariant is that no list runs past the caster it is
     * handed to, and the whole trunk ladder exists to make a priest's five arrive with their god's
     * list -- a vow that empties one slot puts every god's strength-5 back out of reach, for a
     * quarter of the tier, in prose that no code path reads. It takes ground instead, which is
     * what a shield wall actually costs.
     */
    /*
     * **Support, not Position, and the cell test is what asked the question.** Position/ground is
     * the Artillerist's cell (way-cards 2.1) and two titles in one cell are the same
     * specialization written twice. Support is also the truer half: this order's Signature gives
     * its Block away and its Tactic guards the figure beside it, neither of which is about where
     * the holder stands.
     */
    axis: "Support", resource: "ground",
    signature: "The Order's Shield", tactic: "Nobody Falls Beside You",
    obedience: "You may not give ground: while an ally stands further forward than you, you may "
      + "not move away from the enemy.",
    grants: { card: "The Order's Shield" }
  },
  {
    id: "faith.anchorite", name: "Anchorite", after: ["faith.order.cloister"],
    title: "Anchorite", exclusive: "order", creed: "cloister",
    axis: "Deck shape", resource: "skill cards",
    signature: "The Long Silence", tactic: "The Empty Cell",
    obedience: "Three skill cards are set aside each morning and are not yours until the next. "
      + "The cloister keeps them.",
    grants: { card: "The Long Silence" }
  },
  {
    id: "faith.flagellant", name: "Flagellant", after: ["faith.order.drums"],
    title: "Flagellant", exclusive: "order", creed: "drums",
    axis: "Tempo", resource: "a permanent Wild",
    signature: "The Scourge", tactic: "Past Caring",
    obedience: "One Wild stays in your fate deck for good. An ecstasy is not a thing you put "
      + "down.",
    grants: { card: "The Scourge" }
  },
];
