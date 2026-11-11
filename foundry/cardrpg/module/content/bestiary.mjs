/**
 * The roster. Creatures, the deltas that make a variant one, the humans, the goblin
 * line the starter world is built from, and the encounters they are met in.
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */

import { applyVariant } from "../monsters.mjs";

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
   * named groupings, the Grey are the Rote District's assassin sect, the Mummers and Berserkers
   * are how the Five are worshipped in the Fiord, the Salt Barons ran the north coast, and the
   * Furnace District's refugee engineers brought gunpowder and their own language with them.
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
    note: "the East District's only remaining export, and it walks to the Rote to be sold",
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
    note: "the Rote District's traditional sect, and the central Rote used to be a state",
    look: "a city killer in plain western dress: dark wool coat to the knee, close hood, gloves, "
      + "a thin blade held reversed along the forearm. **Nothing wrapped, no veil, nothing "
      + "eastern about it** -- this is somebody who can stand in a doorway on the Rote "
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
    look: "a north-coast sailor turned quiet trader: oilskin, a knitted cap, salt-stained boots, "
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
    note: "Furnace District refugees who kept their trade, their language and their lack of a god",
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
   * It also settles where they belong. The Rote District is the Hyena Desert, ruled by emirs
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
      /* `terrify` is what makes it the one goblin that reaches a player's hand: the glamour the
       * elves taught it is half a curse and half a fright, and *Rattle* is the fright. */
      health: 1, speed: -1, caps: ["+caster", "+terrify"], tactics: ["+tainting"],
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
   * and a secret police in its own groupings, and the two churches are the Core District's
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
      look: "a north-coast magnate gone slightly to seed: a good coat over sea-weathered skin, "
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
      note: "the Furnace District built the trains and the sea defences, and this is what is left",
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

export const ROSTER = [GOBLIN, ...MONSTERS];

export const ENCOUNTERS = [
  { label: "3 goblins with spears", difficulty: "Easy", winRate: "99.4%" },
  { label: "4 goblins with spears", difficulty: "Moderate", winRate: "93.2%" },
  { label: "5 goblins with spears", difficulty: "Hard", winRate: "75.9%" },
  { label: "4 goblins, 2 spears + 2 bows", difficulty: "Deadly", winRate: "64.6%" }
];