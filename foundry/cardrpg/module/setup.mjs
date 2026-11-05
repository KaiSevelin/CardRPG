/**
 * Builds the playtest content into the world.
 *
 * Deliberately not a compendium build: the content lives in content.mjs as data, and this creates
 * the documents directly. No build tooling, playable immediately, and the same data compiles to
 * LevelDB packs later without being rewritten.
 */

import { CARDRPG } from "./config.mjs";
/* The one shape a skill card takes, shared with anything that grants one rather than spelled here. */
import { skillCardData, twistCardData, npcCardData, backOf, artIn } from "./decks.mjs";
/* A deck is the subset of the pool a creature's capabilities earn, and a variant is a delta from
 * its base. Both are arithmetic, and both live where the validator can ask them. */
import { deckFor, expandRoster } from "./monsters.mjs";
import {
  fateCards, WARRIOR_DECK, ITEMS, NPC_GEAR, FEATURES, FORMULAS, WARRIOR_SKILLS,
  TWISTS, INTENTS, NATURAL_WEAPONS, ROSTER, VARIANTS,
  SHADOW_FORMULAS, WILD_MAGIC,
  WARRIOR, GOBLIN, GOBLIN_ARCHER
} from "./content.mjs";

const FLAG = "cardrpgContent";

/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */

/** Mark what we created, so a second run can find it instead of duplicating it. */
function stamp(tag) {
  return { flags: { cardrpg: { [FLAG]: tag } } };
}

function findExisting(collection, tag) {
  return collection.find(d => d.getFlag("cardrpg", FLAG) === tag);
}

/** A Cards document: core provides deck, hand and pile; our subtypes live on the cards inside. */
async function makeCards(name, type, tag, cards = [], back = "") {
  const existing = findExisting(game.cards, tag);
  if (existing) return existing;
  /* `img` is what Foundry shows for the stack, which is the back of the deck as a pile of cards. */
  const art = back ? backOf(back) : "";
  return Cards.create({ name, type, cards, ...(art ? { img: art } : {}), ...stamp(tag) });
}

/** Expand a card definition's `copies` into that many Card documents. */
function expand(defs, build) {
  const out = [];
  for (const def of defs) {
    for (let i = 0; i < (def.copies ?? 1); i++) out.push(build(def));
  }
  return out;
}

/** Slate data from a content entry, filling in what the schema expects. */
export function slateData(entry, type) {
  const { name, group, active, grants, bonus, text, copies, art, ...rest } = entry;
  return {
    name,
    type,
    /*
     * **An Item's own `img`, which is where the brief said this would go.** `art` used to fall
     * into `...rest` and land in `system.art`, so every item, feature, piece of NPC gear and
     * natural weapon in the catalogue -- a hundred and seventy of the four hundred and twenty
     * pieces -- had a path in content that no document ever wore. The levelling graph read it
     * straight from content and showed it on a node, which is what made the gap invisible.
     */
    ...(artIn({ art }) ? { img: artIn({ art }) } : {}),
    system: {
      ...rest,
      ...(group ? { group } : {}),
      ...(active ? { active } : {}),
      ...(grants ? { grants } : {}),
      ...(bonus ? { bonus } : {}),
      ...(text !== undefined ? { text } : {})
    }
  };
}

/* -------------------------------------------- */
/*  The routine                                 */
/* -------------------------------------------- */

/**
 * Create the starter Warrior, the goblins, their decks and all the slates.
 * Safe to run twice: anything already stamped is reused rather than duplicated.
 */
export async function createStarterContent() {
  if (!game.user.isGM) {
    ui.notifications.error("Only the GM can create starter content.");
    return;
  }

  const made = { cards: 0, actors: 0, slates: 0, reused: 0 };
  const note = msg => console.log(`Card RPG | ${msg}`);

  /* --- the Warrior's six Cards documents ---------------------------------
   * Discard and Spent must be separate piles: Catch Breath shuffles the discard back, and Spent
   * cards survive it until a rest. Flagging cards inside one pile would mean filtering on every
   * shuffle. */
  const warriorDeck = await makeCards(
    "Starter Warrior — Action Deck", "deck", "warrior.action",
    expand(WARRIOR_DECK, def => ({
      name: def.name,
      type: "action",
      // A Card with no face is face-down, and Foundry then shows "Unknown (<deck>)" instead of
      // its name. Every card here is meant to be readable in hand, so it gets a face.
      face: 0,
      faces: [{ name: def.name }],
      ...(backOf("action") ? { back: { img: backOf("action") } } : {}),
      system: {
        primary: def.primary ?? [],
        secondary: def.secondary ?? [],
        reaction: def.reaction ?? "",
        costs: def.costs ?? {}
      }
    })),
    "action"
  );
  const warriorHand = await makeCards("Starter Warrior — Hand", "hand", "warrior.hand");
  const warriorDiscard = await makeCards("Starter Warrior — Discard", "pile", "warrior.discard");
  const warriorSpent = await makeCards("Starter Warrior — Spent", "pile", "warrior.spent");
  /*
   * **The shelf a transformation puts cards on.** A form quarantines some of what the player owns
   * and gives it back when it ends, and "gives back" is movement rather than a flag -- a flag on a
   * card would have to be respected by every place that offers one.
   *
   * A pile and not a deck, so it gets no back: nothing is drawn from it and nobody sees it face
   * down. Empty in every world until somebody transforms.
   */
  const warriorQuarantine = await makeCards(
    "Starter Warrior — Quarantine", "pile", "warrior.quarantine");
  const warriorFate = await makeCards(
    "Starter Warrior — Fate Deck", "deck", "warrior.fate", fateCards(backOf("fate")), "fate");
  const warriorFateDiscard = await makeCards("Starter Warrior — Fate Discard", "pile", "warrior.fateDiscard");
  note("warrior decks ready");

  /* --- the goblins' fate deck, which belongs to the TYPE ----------------------
   *
   * Every goblin in the line references this one deck, and each is placed as an UNLINKED token so
   * it keeps its own health while sharing the id. Linked tokens would share health too, which they
   * must not.
   *
   * **The action deck and the piles are `buildCreature`'s to make**, because a creature's deck is
   * earned from the intent pool rather than authored (core-rules 9). This routine used to build a
   * `goblin.action` document from six hand-written cards as well, and point nothing at it: five of
   * those six had no counterpart in the pool because the pool had replaced them, so the only thing
   * it did was ship six dead cards into every world.
   */
  const goblinFate = await makeCards(
    "Goblin — Fate Deck", "deck", "goblin.fate", fateCards(backOf("fate")), "fate");
  const goblinFateDiscard = await makeCards("Goblin — Fate Discard", "pile", "goblin.fateDiscard");
  // Each NPC type has its own fate deck, so a Cursed goblin doesn't hex the ogre beside it.

  /*
   * The Wild Magic deck belongs to the WORLD, not to a caster: a surge is the world answering, and
   * one deck means the table meets the same twelve possibilities every time, which is what makes
   * them learnable. It cycles like any other deck, so a table that has seen Misfire knows it is out
   * for a while -- information worth having, and the same reason the fate discard is face up.
   */
  await makeCards("Wild Magic", "deck", "wild.deck",
    expand(WILD_MAGIC, def => ({
      name: def.name,
      type: "wild",
      faces: [{ name: def.name }],
      face: 0,
      ...(backOf("wild") ? { back: { img: backOf("wild") } } : {}),
      system: { steps: def.steps ?? [], turn: def.turn, text: def.text ?? "" }
    })), "wild");
  await makeCards("Wild Magic Discard", "pile", "wild.discard");
  note("goblin decks ready");

  /* --- slates, created as world Items so they can be dragged onto actors --- */
  const slateDefs = [
    ...ITEMS.map(i => ({ ...slateData(i, "item"), tag: `item.${i.name}` })),
    ...NPC_GEAR.map(i => ({ ...slateData(i, "item"), tag: `item.${i.name}` })),
    ...FEATURES.map(f => ({ ...slateData(f, "feature"), tag: `feature.${f.name}` })),
    // Spells are slates too, and these four are the combo mechanic in playable form.
    ...FORMULAS.map(f => ({ ...slateData(f, "spell"), tag: `spell.${f.name}` })),
    ...SHADOW_FORMULAS.map(f => ({ ...slateData(f, "spell"), tag: `spell.${f.name}` })),
    /* What a creature with no hands fights with. An item, because core-rules 9 already settles it:
     * NPCs take their Strike off an item, which is the one knob that sets how dangerous they are. */
    ...NATURAL_WEAPONS.map(w => ({ ...slateData(w, "item"), tag: `item.${w.name}` }))
  ];

  const slates = {};
  const toCreate = [];
  for (const def of slateDefs) {
    const existing = findExisting(game.items, def.tag);
    if (existing) {
      slates[def.name] = existing;
      made.reused++;
      continue;
    }
    const { tag, ...data } = def;
    toCreate.push({ ...data, ...stamp(tag) });
  }
  if (toCreate.length) {
    for (const doc of await Item.createDocuments(toCreate)) {
      slates[doc.name] = doc;
      made.slates++;
    }
  }
  note(`slates ready (${made.slates} new, ${made.reused} reused)`);

  /* --- actors, with their slates embedded and their decks wired up --- */
  const buildActor = async (def, decks) => {
    const tag = `actor.${def.name}`;
    const existing = findExisting(game.actors, tag);
    if (existing) return existing;

    const embedded = [];
    for (const name of def.equipped ?? []) {
      const source = slates[name];
      if (!source) continue;
      embedded.push({ ...source.toObject(), system: { ...source.system.toObject(), equipped: true } });
    }
    for (const name of [...(def.pack ?? []), ...(def.features ?? [])]) {
      if (slates[name]) embedded.push(slates[name].toObject());
    }

    /*
     * **One picture, both slots.** Foundry keeps a portrait on `Actor.img` and a map token on
     * `prototypeToken.texture.src`, and a creature wants the same file in each for the same reason
     * a deck back does: the thing on the map and the thing on the sheet are the same creature, and
     * two files is two things to draw and one to forget. A separate portrait is a field to add the
     * day somebody wants one, not a field to leave empty until then.
     */
    const art = artIn(def);
    const actor = await Actor.create({
      name: def.name,
      type: def.type,
      ...(art ? { img: art } : {}),
      system: { ...def.system, decks },
      items: embedded,
      // Unlinked, so each token keeps its own health while sharing the type's decks.
      prototypeToken: {
        actorLink: false, name: def.name, ...(art ? { texture: { src: art } } : {})
      },
      ...stamp(tag)
    });
    made.actors++;
    return actor;
  };

  /*
   * --- a creature, with the deck its capabilities earn
   *
   * **One deck per `kind`, built from the common pool rather than authored.** Each intent card
   * lists what a creature must be able to do (core-rules 9) and the creature draws the subset it
   * qualifies for -- so forty-seven creatures come out of twenty-seven cards, and a card added to
   * the pool joins every creature that already qualifies without anybody revisiting them.
   *
   * `kind` owns the deck and the intent, so **every variant has its own**: a Goblin Archer sharing
   * the spearman's `kind` would share its intent card, which is exactly the defect the pair in this
   * world had until today -- both drew *Throw Rock*.
   *
   * **The fate deck is shared across a creature's variants**, which is a reading of core-rules 6
   * rather than a shortcut: the rule exists so a hex on the goblins does not touch the ogre, and a
   * Goblin Archer is not an ogre. One per base; the intent is per kind.
   */
  const buildCreature = async (creature, fate) => {
    const kind = creature.system.kind;
    const npcBack = backOf(`npc.${kind}`) || backOf("npc");
    const cards = deckFor(creature.system.capabilities ?? [], INTENTS, kind)
      .map(card => npcCardData(card, { kind, creature: creature.name, back: npcBack }));
    const deck = await makeCards(`${creature.name} \u2014 Intents`, "deck", `${kind}.deck`,
      cards, backOf(`npc.${kind}`) ? `npc.${kind}` : "npc");
    const discard = await makeCards(`${creature.name} \u2014 Discard`, "pile", `${kind}.discard`);
    const intent = await makeCards(`${creature.name} \u2014 Intent`, "pile", `${kind}.intent`);
    made.decks += 3;
    return buildActor(creature, {
      action: deck.id, actionDiscard: discard.id, intent: intent.id,
      fate: fate.deck.id, fateDiscard: fate.discard.id
    });
  };

  /*
   * The goblin line, which is five creatures from one base: the spearman who was simulated, and
   * four deltas who were not. Everything else in `ROSTER` is built on demand through
   * `game.cardrpg.buildMonster`, because a starter world with forty-seven monsters in it is a
   * starter world nobody can find anything in.
   */
  const goblinLine = expandRoster(ROSTER.filter(r => r.system.kind === "goblin"), VARIANTS);
  for (const creature of goblinLine) {
    await buildCreature(creature, { deck: goblinFate, discard: goblinFateDiscard });
  }
  note(`the goblin line: ${goblinLine.length} creatures`);

  /*
   * The skill side's three stacks. The discard is a `pile` like the action discard and is NOT
   * shuffled back by anything automatic: skill-rules 1 says it returns on a rest, which is the one
   * place the two sides differ in kind rather than in content.
   */
  const warriorSkills = await makeCards("Warrior Skills", "deck", "warrior-skills",
    expand(WARRIOR_SKILLS, def => skillCardData(def)), "skill");
  const warriorSkillHand = await makeCards("Warrior Skill Hand", "hand", "warrior-skill-hand");
  const warriorSkillDiscard = await makeCards("Warrior Skill Discard", "pile",
    "warrior-skill-discard");
  made.decks += 3;

  /*
   * **The GM's twist deck, which belongs to the world and not to a character.** Thirty cards of
   * eight kinds (skill-rules 4), and a discard beside it -- a `pile`, like every other discard, and
   * reshuffled when the deck runs out rather than on a rest, because the rules say *shuffle when the
   * deck runs out* and nothing else.
   */
  const twists = await makeCards("Twist Deck", "deck", "twist-deck",
    expand(TWISTS, def => twistCardData(def)), "skill");
  await makeCards("Twist Discard", "pile", "twist-discard");
  made.decks += 2;

  await buildActor(WARRIOR, {
    action: warriorDeck.id,
    actionHand: warriorHand.id,
    actionDiscard: warriorDiscard.id,
    actionSpent: warriorSpent.id,
      quarantine: warriorQuarantine.id,
    fate: warriorFate.id,
    fateDiscard: warriorFateDiscard.id,
    skill: warriorSkills.id,
    skillHand: warriorSkillHand.id,
    skillDiscard: warriorSkillDiscard.id
  });

  /*
   * The hand-authored goblin deck and the two actors that shared it are gone: the line above builds
   * all five goblins from the pool, each with its own `kind` and therefore its own intent. The old
   * pair shared one deck, which is why both of them threw rocks.
   */

  note(`done: ${made.actors} actors, ${made.slates} slates`);
  ui.notifications.info(
    `Card RPG: ${made.actors} actors and ${made.slates} slates created. ` +
    `Place goblins as unlinked tokens so they share one deck but keep their own health.`
  );
}

/* -------------------------------------------- */
/*  One creature, on demand                     */
/* -------------------------------------------- */

/**
 * Build any creature in the roster by name.
 *
 * **The starter world holds the goblin line and nothing else**, because forty-seven monsters in a
 * new world is a world nobody can find anything in -- and because most of them are not what the
 * next session needs. The roster is content either way; this is how one of it arrives.
 *
 * What it makes is what `createStarterContent` makes for a goblin: the natural weapon or gear the
 * creature carries, the intent deck its capabilities earn from the common pool, a discard, the
 * intent pile, and a fate deck shared with the rest of its base's variants (core-rules 6 -- the
 * rule is that a hex on the goblins must not touch the ogre, and a Goblin Archer is not an ogre).
 *
 * Idempotent, like everything in this file: asking twice returns the creature that exists.
 */
export async function buildMonster(name) {
  if (!game.user.isGM) {
    ui.notifications?.warn("Only the GM builds creatures.");
    return null;
  }
  const creature = expandRoster(ROSTER, VARIANTS).find(c => c.name === name);
  if (!creature) {
    const names = expandRoster(ROSTER, VARIANTS).map(c => c.name).join(", ");
    ui.notifications?.warn(`No creature called ${name}. The roster is: ${names}`);
    return null;
  }

  const existing = findExisting(game.actors, `actor.${creature.name}`);
  if (existing) return existing;

  /* Its gear, made once and reused: five mole men share one pick. */
  const slates = {};
  for (const gearName of creature.equipped ?? []) {
    const def = [...NPC_GEAR, ...NATURAL_WEAPONS].find(g => g.name === gearName);
    if (!def) continue;
    const found = findExisting(game.items, `item.${gearName}`);
    if (found) { slates[gearName] = found; continue; }
    const { tag, ...data } = { ...slateData(def, "item"), tag: `item.${gearName}` };
    const [made] = await Item.createDocuments([{ ...data, flags: { cardrpg: { [FLAG]: tag } } }]);
    slates[gearName] = made;
  }

  const kind = creature.system.kind;
  const base = ROSTER.find(r => (VARIANTS[r.system.kind] ?? [])
    .some(v => v.kind === kind)) ?? creature;
  const baseKind = base.system.kind;
  const npcBack = backOf(`npc.${kind}`) || backOf("npc");

  const cards = deckFor(creature.system.capabilities ?? [], INTENTS, kind)
    .map(card => npcCardData(card, { kind, creature: creature.name, back: npcBack }));

  const find = tag => game.cards.find(d => d.getFlag("cardrpg", FLAG) === tag);
  const art = backOf(`npc.${kind}`) ? `npc.${kind}` : "npc";
  const deck = find(`${kind}.deck`)
    ?? await Cards.create({
      name: `${creature.name} \u2014 Intents`, type: "deck", cards,
      ...(backOf(art) ? { img: backOf(art) } : {}),
      flags: { cardrpg: { [FLAG]: `${kind}.deck` } }
    });
  const discard = find(`${kind}.discard`)
    ?? await Cards.create({
      name: `${creature.name} \u2014 Discard`, type: "pile",
      flags: { cardrpg: { [FLAG]: `${kind}.discard` } }
    });
  const intent = find(`${kind}.intent`)
    ?? await Cards.create({
      name: `${creature.name} \u2014 Intent`, type: "pile",
      flags: { cardrpg: { [FLAG]: `${kind}.intent` } }
    });
  /* One fate deck per base, shared by its variants. */
  const fate = find(`${baseKind}.fate`)
    ?? await Cards.create({
      name: `${base.name} \u2014 Fate Deck`, type: "deck", cards: fateCards(backOf("fate")),
      ...(backOf("fate") ? { img: backOf("fate") } : {}),
      flags: { cardrpg: { [FLAG]: `${baseKind}.fate` } }
    });
  const fateDiscard = find(`${baseKind}.fateDiscard`)
    ?? await Cards.create({
      name: `${base.name} \u2014 Fate Discard`, type: "pile",
      flags: { cardrpg: { [FLAG]: `${baseKind}.fateDiscard` } }
    });

  const embedded = [];
  for (const gearName of creature.equipped ?? []) {
    const source = slates[gearName];
    if (!source) continue;
    embedded.push({
      ...source.toObject(),
      system: { ...source.system.toObject(), equipped: true }
    });
  }

  const actor = await Actor.create({
    name: creature.name,
    type: "npc",
    system: {
      ...creature.system,
      decks: {
        action: deck.id, actionDiscard: discard.id, intent: intent.id,
        fate: fate.id, fateDiscard: fateDiscard.id
      }
    },
    items: embedded,
    prototypeToken: { actorLink: false, name: creature.name },
    flags: { cardrpg: { [FLAG]: `actor.${creature.name}` } }
  });
  ui.notifications?.info(`${creature.name}: ${cards.length} intents, `
    + `Health ${creature.system.health.base}, speed ${creature.system.speed}.`);
  return actor;
}

/* -------------------------------------------- */
/*  Discoverability                             */
/* -------------------------------------------- */

/**
 * Leave a macro behind rather than making the GM remember a console call. Created once; if it is
 * deleted we take that as a decision and don't recreate it.
 */
export async function ensureSetupMacro() {
  if (!game.user.isGM) return;
  const tag = "macro.setup";
  if (findExisting(game.macros, tag)) return;
  if (game.settings.get("cardrpg", "setupMacroMade")) return;

  await Macro.create({
    name: "Card RPG: Create starter content",
    type: "script",
    scope: "global",
    command: "game.cardrpg.createStarterContent();",
    img: "icons/svg/card-hand.svg",
    ...stamp(tag)
  });
  await game.settings.set("cardrpg", "setupMacroMade", true);
  console.log("Card RPG | setup macro created");
}
