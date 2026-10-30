/**
 * Builds the playtest content into the world.
 *
 * Deliberately not a compendium build: the content lives in content.mjs as data, and this creates
 * the documents directly. No build tooling, playable immediately, and the same data compiles to
 * LevelDB packs later without being rewritten.
 */

import { CARDRPG } from "./config.mjs";
import {
  fateCards, WARRIOR_DECK, GOBLIN_DECK, ITEMS, NPC_GEAR, FEATURES, FORMULAS,
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
async function makeCards(name, type, tag, cards = []) {
  const existing = findExisting(game.cards, tag);
  if (existing) return existing;
  return Cards.create({ name, type, cards, ...stamp(tag) });
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
function slateData(entry, type) {
  const { name, group, active, grants, bonus, text, copies, ...rest } = entry;
  return {
    name,
    type,
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
      system: {
        primary: def.primary ?? [],
        secondary: def.secondary ?? [],
        reaction: def.reaction ?? "",
        costs: def.costs ?? {}
      }
    }))
  );
  const warriorHand = await makeCards("Starter Warrior — Hand", "hand", "warrior.hand");
  const warriorDiscard = await makeCards("Starter Warrior — Discard", "pile", "warrior.discard");
  const warriorSpent = await makeCards("Starter Warrior — Spent", "pile", "warrior.spent");
  const warriorFate = await makeCards("Starter Warrior — Fate Deck", "deck", "warrior.fate", fateCards());
  const warriorFateDiscard = await makeCards("Starter Warrior — Fate Discard", "pile", "warrior.fateDiscard");
  note("warrior decks ready");

  /* --- the goblins' decks, which belong to the TYPE ----------------------
   * Five goblins reference one action deck, one fate deck and one intent pile. Place them as
   * UNLINKED tokens: each then gets its own health while sharing these ids. Linked tokens would
   * share health too, which they must not. */
  const goblinDeck = await makeCards(
    "Goblin — Action Deck", "deck", "goblin.action",
    GOBLIN_DECK.map(def => ({
      name: def.name,
      type: "npc",
      // Intent cards are turned face down when drawn; the face is what a reveal turns up.
      face: 0,
      faces: [{ name: def.name }],
      back: { name: "Goblin" },
      system: { kind: "goblin", sequence: def.sequence }
    }))
  );
  const goblinDiscard = await makeCards("Goblin — Discard", "pile", "goblin.discard");
  const goblinFate = await makeCards("Goblin — Fate Deck", "deck", "goblin.fate", fateCards());
  const goblinFateDiscard = await makeCards("Goblin — Fate Discard", "pile", "goblin.fateDiscard");
  // Each NPC type has its own fate deck, so a Cursed goblin doesn't hex the ogre beside it.
  const goblinIntent = await makeCards("Goblin — Intent", "pile", "goblin.intent");
  note("goblin decks ready");

  /* --- slates, created as world Items so they can be dragged onto actors --- */
  const slateDefs = [
    ...ITEMS.map(i => ({ ...slateData(i, "item"), tag: `item.${i.name}` })),
    ...NPC_GEAR.map(i => ({ ...slateData(i, "item"), tag: `item.${i.name}` })),
    ...FEATURES.map(f => ({ ...slateData(f, "feature"), tag: `feature.${f.name}` })),
    // Spells are slates too, and these four are the combo mechanic in playable form.
    ...FORMULAS.map(f => ({ ...slateData(f, "spell"), tag: `spell.${f.name}` }))
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

    const actor = await Actor.create({
      name: def.name,
      type: def.type,
      system: { ...def.system, decks },
      items: embedded,
      // Unlinked, so each token keeps its own health while sharing the type's decks.
      prototypeToken: { actorLink: false, name: def.name },
      ...stamp(tag)
    });
    made.actors++;
    return actor;
  };

  await buildActor(WARRIOR, {
    action: warriorDeck.id,
    actionHand: warriorHand.id,
    actionDiscard: warriorDiscard.id,
    actionSpent: warriorSpent.id,
    fate: warriorFate.id,
    fateDiscard: warriorFateDiscard.id
  });

  const goblinDecks = {
    action: goblinDeck.id,
    actionDiscard: goblinDiscard.id,
    fate: goblinFate.id,
    fateDiscard: goblinFateDiscard.id,
    intent: goblinIntent.id
  };
  await buildActor(GOBLIN, goblinDecks);
  await buildActor(GOBLIN_ARCHER, goblinDecks);

  note(`done: ${made.actors} actors, ${made.slates} slates`);
  ui.notifications.info(
    `Card RPG: ${made.actors} actors and ${made.slates} slates created. ` +
    `Place goblins as unlinked tokens so they share one deck but keep their own health.`
  );
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
