/**
 * Build the system's compendium packs. Run with: node test/build-packs.mjs
 *
 * **The content tables stay the one source of truth, and the packs are built from them.** A pack
 * edited by hand in Foundry and a table edited by hand in the repository are two sources that
 * drift, and the drift is invisible: a world imports from the pack, the validator reads the table,
 * and both pass while disagreeing. So this runs the same direction everything else in this project
 * runs -- content out -- and `test/validate.mjs` checks the result against the tables that made it.
 *
 * Two artefacts come out of it:
 *
 *   - `packs/_source/<pack>/*.json`, one file per document. This is what version control is for:
 *     a diff on a LevelDB is unreadable, and a diff on these is a sentence.
 *   - `packs/<pack>/`, the LevelDB Foundry actually loads, compiled from the sources by Foundry's
 *     own packer rather than by a key scheme guessed from the outside.
 *
 * Both are committed, because a system that ships only the sources ships no compendium at all.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";

import * as content from "../module/content.mjs";
import {
  POOL, SPELLS, SIGNATURES, TEACHINGS, teachingKind, slateFieldsOf, spellKindOf
} from "../module/graph.mjs";
import { expandRoster } from "../module/monsters.mjs";
import { slateData } from "../module/setup.mjs";
import { actionCardData, skillCardData, twistCardData, npcCardData, artIn, backOf }
  from "../module/decks.mjs";

const root = path.join(import.meta.dirname, "..");
const PACKS = path.join(root, "packs");
const SOURCE = path.join(PACKS, "_source");

/* -------------------------------------------- */
/*  Identity                                    */
/* -------------------------------------------- */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * A document id: sixteen characters of `[A-Za-z0-9]`, derived from a stable key.
 *
 * **Derived rather than random, because an id is a promise.** A world that imports a creature
 * keeps the pack's id in the actor's `_stats.compendiumSource`, a journal link holds it, and a
 * node that grants an item would hold it too. Regenerating the packs with fresh ids would break
 * every one of those silently -- the link resolves to nothing and the sheet shows a blank. So the
 * id is a hash of what the document IS, and running this twice produces the same pack twice.
 *
 * The key includes the pack, so two packs may hold a document of the same name without colliding,
 * and renaming a document DOES change its id: a rename is a new document as far as a link is
 * concerned, and pretending otherwise is the more confusing of the two behaviours.
 */
export function id16(key) {
  const digest = crypto.createHash("sha256").update(key).digest();
  let out = "";
  for (let i = 0; i < 16; i++) out += ALPHABET[digest[i] % ALPHABET.length];
  return out;
}

/** A filename from a document name, matching the art list's rule so one slug rule governs both. */
export function fileSlug(name) {
  return String(name).toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* -------------------------------------------- */
/*  Document shapes                             */
/* -------------------------------------------- */

/**
 * One Item, in the shape the setup routine builds -- `slateData`, the same function, rather than a
 * second spelling of it. A pack whose documents are shaped differently from a world's documents is
 * a pack that works until somebody drags one out.
 */
function itemDoc(entry, type, pack) {
  const _id = id16(`${pack}:${entry.name}`);
  return { _id, _key: `!items!${_id}`, ...slateData(slateOf(entry, type), type) };
}

/**
 * A content entry as the document's own fields: the graph's fields stripped by `slateFieldsOf`,
 * and a spell's Way put back as its `kind`.
 *
 * **A spell in a pack arrives unprepared, like a spell a node hands over.** `slotCost` is zero
 * while a formula is still in the book, so a strength-4 formula dragged onto a caster with three
 * slots costs nothing and breaks nothing -- the book holds what the budget cannot, and preparing
 * it is the player's decision rather than the compendium's.
 */
function slateOf(entry, type) {
  const fields = slateFieldsOf(entry);
  if (type !== "spell") return fields;
  /*
   * The Way, from whichever the entry carries: a pool spell names its pool, a Signature its node,
   * and the five formulas written before either existed carry `kind: "formula"` themselves.
   *
   * `entry.kind` is only usable when it IS a Way. On a Signature it is the discriminator -- the
   * string "spell" -- and taking it at face value would file twenty-three miracles and formulas
   * as a `kind` the schema's choices do not include.
   */
  const declared = entry.kind === "formula" || entry.kind === "miracle" ? entry.kind : null;
  return {
    ...fields,
    kind: declared ?? spellKindOf(entry.pool ?? entry.node),
    prepared: false
  };
}

/**
 * One Actor, with its gear and features embedded.
 *
 * `system.decks` is deliberately absent: those are ids of Cards documents in a world, and a
 * compendium has no world to point at. The schema fills it with its own default, and the setup
 * routine is what wires a real one up.
 */
function actorDoc(def, pack) {
  const _id = id16(`${pack}:${def.name}`);
  const items = [];
  for (const [names, type, equipped] of [
    [def.equipped ?? [], "item", true],
    [def.pack ?? [], "item", false],
    [def.features ?? [], "feature", false]
  ]) {
    for (const name of names) {
      const source = SLATE_SOURCES.get(name);
      if (!source) {
        FAULTS.push(`${def.name} carries "${name}", which is in no content table`);
        continue;
      }
      const childId = id16(`${pack}:${def.name}:${name}`);
      const data = slateData(source.entry, source.type);
      items.push({
        _id: childId,
        _key: `!actors.items!${_id}.${childId}`,
        ...data,
        system: { ...data.system, ...(equipped ? { equipped: true } : {}) }
      });
    }
  }
  const art = artIn(def);
  return {
    _id,
    _key: `!actors!${_id}`,
    name: def.name,
    type: def.type,
    ...(art ? { img: art } : {}),
    system: { ...def.system },
    items,
    prototypeToken: {
      actorLink: false, name: def.name, ...(art ? { texture: { src: art } } : {})
    }
  };
}

/**
 * One Cards document, with its cards embedded.
 *
 * The card shapes come from `decks.mjs` -- the same four builders the world uses -- so a card in
 * the pack and a card the setup routine deals are the same document twice, not two documents that
 * resemble each other.
 */
function cardsDoc({ name, back, build, list }, pack) {
  const _id = id16(`${pack}:${name}`);
  const seen = new Map();
  const cards = list.map((entry, index) => {
    const data = build(entry);
    /* A deck holds copies: four Noise cards are four documents with one name, so the key has to
     * be the copy and not the name, or the packer rejects the deck for a duplicate key. */
    const n = (seen.get(data.name) ?? 0) + 1;
    seen.set(data.name, n);
    const childId = id16(`${pack}:${name}:${data.name}:${n}`);
    return { _id: childId, _key: `!cards.cards!${_id}.${childId}`, sort: (index + 1) * 100, ...data };
  });
  const art = back ? backOf(back) : "";
  return {
    _id,
    _key: `!cards!${_id}`,
    name,
    type: "deck",
    ...(art ? { img: art } : {}),
    cards
  };
}

/* -------------------------------------------- */
/*  What goes in                                */
/* -------------------------------------------- */

const FAULTS = [];

/**
 * Every slate in the game, by name, with the document type it becomes.
 *
 * The classification is **asked of `graph.mjs`**, not decided here: `POOL` is what a node may hand
 * over as a card, `SPELLS` as a spell, and a Signature carries its own `kind`. A second opinion
 * about whether *Step Through* is a spell or a card is a second rule, and two rules drift.
 */
/*
 * **The features a school teaches**, which are not Signatures and not in `FEATURES`.
 *
 * Eight pool entries: all seven of Tattoo Magic and one of Asceticism's two renunciations (the
 * other, *Graven Strength*, is a Signature and goes in its own pack). They were in the spells pack
 * until the law moved them, and a slate in no pack is a slate a GM cannot drag onto a sheet.
 */
const SIGNATURE_NAMES = new Set(SIGNATURES.map(s => s.name));
const TAUGHT_FEATURES = TEACHINGS.filter(t =>
  teachingKind(t) === "feature" && !SIGNATURE_NAMES.has(t.name));

const SLATE_SOURCES = new Map();
export const SLATE_CLASHES = [];
for (const [table, list, type] of [
  ["ITEMS", content.ITEMS, "item"], ["NPC_GEAR", content.NPC_GEAR, "item"],
  ["NATURAL_WEAPONS", content.NATURAL_WEAPONS, "item"],
  ["FEATURES", content.FEATURES, "feature"],
  ["TAUGHT_FEATURES", TAUGHT_FEATURES, "feature"],
  ["SPELLS", [...SPELLS.values()], "spell"],
  ["SIGNATURES", SIGNATURES.filter(s => s.kind !== "card"), s => s.kind]
]) {
  for (const entry of list) {
    const resolved = typeof type === "function" ? type(entry) : type;
    const had = SLATE_SOURCES.get(entry.name);
    /* The same object twice is one slate seen through two tables, not two slates: `SPELLS` is
     * built from the Signatures among others, so every Signature spell appears in both. */
    if (had?.entry === entry) continue;
    if (had) {
      /*
       * **Two slates of one name, and whichever was declared first wins.** That is a coin flip
       * dressed as a rule, so it is recorded rather than resolved: an actor carrying the name gets
       * one of them and a GM dragging from a pack gets the other. `The Kit` is the live case --
       * the catalogue's Tool and the Burglar's Signature, same name, different text.
       */
      if (had.type === resolved) {
        SLATE_CLASHES.push(`${entry.name}: ${had.table} and ${table}, both ${resolved}`);
      }
      continue;
    }
    SLATE_SOURCES.set(entry.name, { entry, type: resolved, table });
  }
}

const expand = (defs, build) => defs.flatMap(def =>
  Array.from({ length: def.copies ?? 1 }, () => build(def)));

/** The Signatures that are spells, so the spell pack can leave them to the Signature pack. */
const SIGNATURE_SPELLS = new Set(SIGNATURES.filter(s => s.kind === "spell").map(s => s.name));

const CREATURES = expandRoster(content.ROSTER, content.VARIANTS);

/**
 * The packs, each one document type, in the order they are worth browsing.
 *
 * **Grouped by what a GM is looking for, not by which table it came from.** A pack per table would
 * put the four Elemental formulas in one compendium and the hundred and nineteen school formulas in
 * another, which is a filing system that serves the code rather than the table.
 */
const PACK_PLAN = [
  {
    name: "creatures", label: "Creatures", type: "Actor", folder: "Card RPG",
    docs: () => CREATURES.map(c => actorDoc(c, "creatures"))
  },
  {
    name: "characters", label: "Pregenerated Characters", type: "Actor", folder: "Card RPG",
    docs: () => [actorDoc(content.WARRIOR, "characters")]
  },
  {
    name: "items", label: "Items", type: "Item", folder: "Card RPG",
    docs: () => [
      ...content.ITEMS.map(i => itemDoc(i, "item", "items")),
      ...content.NPC_GEAR.map(i => itemDoc(i, "item", "items")),
      ...content.NATURAL_WEAPONS.map(i => itemDoc(i, "item", "items"))
    ]
  },
  {
    name: "features", label: "Features", type: "Item", folder: "Card RPG",
    docs: () => [
      ...content.FEATURES.map(f => itemDoc(f, "feature", "features")),
      ...TAUGHT_FEATURES.map(f => itemDoc(f, "feature", "features"))
    ]
  },
  {
    name: "spells", label: "Formulas and Miracles", type: "Item", folder: "Card RPG",
    docs: () => [...SPELLS.values()]
      .filter(s => !SIGNATURE_SPELLS.has(s.name))
      .map(s => itemDoc(s, "spell", "spells"))
  },
  /*
   * **A title's own content, in its own pack.** A Signature is not a thing a shop sells or a
   * school teaches, and filing it with them is how *The Kit* came to be two different Items with
   * one name: the Burglar's Signature and the catalogue's Tool, both `The Kit`, different text.
   * One pack cannot hold two documents of a name -- they would share an id -- and the round trip
   * through the packer is what noticed.
   *
   * A pack is typed by document CLASS and not by subtype, so one Item pack holds all thirty: the
   * six features, the one item and the twenty-three spells. The twenty-one that are cards are in
   * the Signature Cards deck below, because a Card is a different class and cannot come here.
   */
  {
    name: "signatures", label: "Signatures", type: "Item", folder: "Card RPG",
    docs: () => SIGNATURES.filter(s => s.kind !== "card")
      .map(s => itemDoc(s, s.kind, "signatures"))
  },
  {
    name: "decks", label: "Decks", type: "Cards", folder: "Card RPG",
    docs: () => [
      { name: "Starter Warrior — Action Deck", back: "action",
        build: actionCardData, list: expand(content.WARRIOR_DECK, d => d) },
      { name: "The Common Pool", back: "action", build: actionCardData,
        list: expand(content.COMMON_POOL, d => d) },
      { name: "Way of Shade — Pool", back: "action", build: actionCardData,
        list: expand(content.SHADE_POOL, d => d) },
      { name: "Way of Strength — Pool", back: "action", build: actionCardData,
        list: expand(content.STRENGTH_POOL, d => d) },
      { name: "Way Cards", back: "action", build: actionCardData,
        list: expand(content.WAY_CARDS, d => d) },
      { name: "Signature Cards", back: "action", build: actionCardData,
        list: [...POOL.values()].filter(c => SIGNATURES.some(s => s.name === c.name)) },
      { name: "Skill Cards", back: "skill", build: skillCardData, list: content.WARRIOR_SKILLS },
      { name: "Wild Magic", back: "wild", build: actionCardData, list: content.WILD_MAGIC },
      { name: "The Fate Deck", back: "fate", build: c => c, list: content.fateCards() },
      { name: "The Twist Deck", back: "skill", build: twistCardData,
        list: expand(content.TWISTS, d => d) },
      /* The pool itself, not one creature's share of it: a GM browsing the compendium wants to
       * read the twenty-eight shapes, and `buildCreature` deals each creature the subset its
       * capabilities earn (core-rules 9). */
      { name: "The Intent Pool", back: "npc",
        build: c => npcCardData(c, { kind: "", creature: "Intent", back: backOf("npc") }),
        list: content.INTENTS }
    ].map(deck => cardsDoc(deck, "decks"))
  }
];

/* -------------------------------------------- */
/*  Writing                                     */
/* -------------------------------------------- */

async function build() {
  const summary = [];
  for (const plan of PACK_PLAN) {
    const docs = plan.docs();
    const dir = path.join(SOURCE, plan.name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });

    const names = new Set();
    for (const doc of docs) {
      const file = fileSlug(doc.name);
      if (names.has(file)) FAULTS.push(`${plan.name}: two documents file as "${file}"`);
      names.add(file);
      fs.writeFileSync(path.join(dir, `${file}.json`), serializeDoc(doc), "utf8");
    }

    const dest = path.join(PACKS, plan.name);
    fs.rmSync(dest, { recursive: true, force: true });
    await compilePack(dir, dest);

    /*
     * **And read it back.** Nothing here has run inside Foundry, so the one thing that can be
     * checked offline is that the packer accepted every document and gives it back unchanged --
     * which catches a malformed key, a duplicate id and a document the hierarchy swallowed, all
     * three of which produce a pack that loads and is missing things.
     */
    const check = path.join(SOURCE, `.roundtrip-${plan.name}`);
    fs.rmSync(check, { recursive: true, force: true });
    await extractPack(dest, check, { clean: true });
    const back = fs.readdirSync(check).filter(f => f.endsWith(".json"));
    if (back.length !== docs.length) {
      FAULTS.push(`${plan.name}: packed ${docs.length} documents and read back ${back.length}`);
    }
    const byId = new Map(back.map(f => {
      const doc = JSON.parse(fs.readFileSync(path.join(check, f), "utf8"));
      return [doc._id, doc];
    }));
    for (const doc of docs) {
      const got = byId.get(doc._id);
      if (!got) { FAULTS.push(`${plan.name}: ${doc.name} did not come back`); continue; }
      if (got.name !== doc.name) FAULTS.push(`${plan.name}: ${doc.name} came back as ${got.name}`);
      const kids = (doc.items ?? doc.cards ?? []).length;
      const gotKids = (got.items ?? got.cards ?? []).length;
      if (kids !== gotKids) {
        FAULTS.push(`${plan.name}: ${doc.name} had ${kids} embedded and came back with ${gotKids}`);
      }
    }
    fs.rmSync(check, { recursive: true, force: true });

    const embedded = docs.reduce((n, d) => n + (d.items ?? d.cards ?? []).length, 0);
    summary.push({ ...plan, count: docs.length, embedded });
  }
  return summary;
}

/* -------------------------------------------- */

/**
 * The documents each pack should hold, right now, built but not written.
 *
 * **This is what makes the committed packs checkable.** The validator reads the files on disk and
 * compares them with this, the same way it reads the art list and compares it with the content --
 * because a pack built in February and a table edited in March both pass every check about
 * themselves while disagreeing with each other. A stale pack is the failure mode that matters:
 * Foundry loads it, the GM drags out a goblin with the old Health, and nothing anywhere says so.
 */
export function planDocuments() {
  return PACK_PLAN.map(p => ({
    name: p.name, label: p.label, type: p.type, docs: p.docs(), faults: [...FAULTS]
  }));
}

/** The one serialization, shared, so the comparison cannot fail on whitespace alone. */
export const serializeDoc = doc => `${JSON.stringify(doc, null, 2)}\n`;

/*
 * Written when run as a script, not when imported -- the same arrangement the art list generator
 * is in, and for the same reason: the validator imports this file for `id16` and `fileSlug`,
 * because "a document's id is the hash of its key" has to be checked with the builder's own hash.
 * A copy of a rule is a second rule, and two rules drift.
 */
if (process.argv[1] && process.argv[1].endsWith("build-packs.mjs")) await main();

async function main() {

const summary = await build();

/*
 * The manifest, rewritten rather than hand-edited: a pack on disk that the manifest does not
 * declare is a pack Foundry never shows, and a pack the manifest declares that is not on disk
 * stops the system loading at all. One of those is invisible and the other is fatal, so neither
 * is left to somebody remembering.
 */
const manifestPath = path.join(root, "system.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
/*
 * **A pack entry carries no `folder`.** Folder membership is `packFolders` and only `packFolders`:
 * the manifest schema has no folder property on a pack, so one written there is a key Foundry
 * ignores -- and a pack that quietly fails to land in its folder looks exactly like a pack that
 * landed in the right one, because the sidebar shows it either way.
 */
manifest.packs = summary.map(p => ({
  name: p.name,
  label: p.label,
  path: `packs/${p.name}`,
  type: p.type,
  system: "cardrpg",
  ownership: { PLAYER: "OBSERVER", TRUSTED: "OBSERVER", ASSISTANT: "OWNER" }
}));
manifest.packFolders = [{
  name: "Card RPG",
  sorting: "m",
  color: "#5b2333",
  packs: summary.map(p => p.name)
}];
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

for (const p of summary) {
  console.log(`${p.name.padEnd(12)} ${String(p.count).padStart(4)} ${p.type}`
    + (p.embedded ? `, ${p.embedded} embedded` : ""));
}
const total = summary.reduce((n, p) => n + p.count, 0);
const embedded = summary.reduce((n, p) => n + p.embedded, 0);
console.log(`\n${summary.length} packs, ${total} documents, ${embedded} embedded`);
for (const clash of SLATE_CLASHES) console.log(`note: two slates named ${clash}`);
if (FAULTS.length) {
  console.error(`\n${FAULTS.length} FAULT${FAULTS.length === 1 ? "" : "S"}`);
  for (const f of FAULTS) console.error(`  ${f}`);
  process.exitCode = 1;
}

}
