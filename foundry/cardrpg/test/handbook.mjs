/**
 * Write the handbook's three reference chapters: items, features and spells.
 *
 * Run with: node test/handbook.mjs
 *
 * **Why this is generated and the rest of the handbook is not.** The prose in
 * `rules/players-handbook.md` is written for a reader and changes when the rules change, which is
 * rare and deliberate. These three chapters are three hundred rows of catalogue that change every
 * time somebody prices an item or writes a spell, and a catalogue copied by hand is a catalogue
 * that is wrong by the end of the week. This project has paid for that lesson twice: the art brief
 * and the prompt book both sat stale while every count in the suite agreed, because a count cannot
 * see a sentence.
 *
 * It writes between markers and leaves everything else in the file alone, so the handbook stays one
 * document a player can read front to back rather than three.
 */
import fs from "node:fs";
import path from "node:path";
import * as CONTENT from "../module/content.mjs";
const { ITEMS, FEATURES } = CONTENT;
import { SPELLS } from "../module/graph.mjs";

const OUT = path.join(import.meta.dirname, "..", "..", "..", "rules", "players-handbook.md");

/** Content writes descriptions as HTML, and a handbook table wants a sentence. */
const plain = html => String(html ?? "")
  .replace(/<[^>]+>/g, " ").replace(/&mdash;/g, ",").replace(/&[a-z]+;/g, " ")
  .replace(/\s+/g, " ").trim();

/** A table cell may not contain the character that ends a table cell. */
const cell = s => plain(s).replace(/\|/g, "/");

/* -------------------------------------------- */
/*  Items                                       */
/* -------------------------------------------- */

/**
 * What an item DOES, in as few characters as carry the point: the verbs it serves, the armour it
 * is, the bonus it grants. A player looking down a list of a hundred and fifty wants the number.
 */
function does(item) {
  const bits = [];
  for (const [verb, line] of Object.entries(item.verbs ?? {})) {
    if (line?.value === null || line?.value === undefined) continue;
    bits.push(`${verb[0].toUpperCase()}${verb.slice(1)} ${line.value}`);
  }
  if (item.armor) bits.push(`Armor ${item.armor}`);
  if (item.bonus?.value) {
    bits.push(`${item.bonus.approach} +${item.bonus.value}`
      + (item.bonus.situation ? ` (${item.bonus.situation})` : ""));
  }
  if (item.shot?.condition) bits.push(item.shot.condition);
  return bits.join(", ");
}

function itemChapter() {
  const kinds = [...new Set(ITEMS.map(i => i.kind))];
  const out = [];
  for (const kind of kinds) {
    const rows = ITEMS.filter(i => i.kind === kind);
    out.push(`### ${kind}${rows.length === 1 ? "" : "s"}`, "");
    out.push("| Item | Slot | Weight | Gold | What it does | What it is |",
      "|---|---|---|---|---|---|");
    for (const i of rows) {
      out.push(`| **${i.name}** | ${i.slot ?? ""}${i.hands ? ` (${i.hands}h)` : ""} `
        + `| ${i.weight ?? 0} | ${i.value ?? 0} | ${cell(does(i))} | ${cell(i.blurb)} |`);
    }
    out.push("");
  }
  return out;
}

/* -------------------------------------------- */
/*  Features and spells                         */
/* -------------------------------------------- */

function featureChapter() {
  const out = ["| Feature | What it does |", "|---|---|"];
  for (const f of FEATURES) out.push(`| **${f.name}** | ${cell(f.text || f.description)} |`);
  out.push("");
  return out;
}

function spellChapter() {
  const bySource = new Map();
  for (const s of SPELLS.values()) {
    if (!bySource.has(s.source)) bySource.set(s.source, []);
    bySource.get(s.source).push(s);
  }
  const out = [];
  for (const [source, spells] of bySource) {
    out.push(`### ${source}`, "");
    out.push("| Spell | Strength | What it does |", "|---|---|---|");
    for (const s of spells.sort((a, b) => (a.strength ?? 0) - (b.strength ?? 0))) {
      const cost = s.cost?.health ? ` Costs ${s.cost.health} Health.` : "";
      out.push(`| **${s.name}** | ${s.strength ?? ""} | ${cell(s.description)}${cost} |`);
    }
    out.push("");
  }
  return out;
}

/* -------------------------------------------- */
/*  Action cards                                */
/* -------------------------------------------- */

/**
 * One half of a card, as a player reads it off the face: the verb, then whatever number or
 * condition the step carries. A half with nothing in it is a half the card does not have.
 */
function half(steps) {
  if (!steps?.length) return "";
  return steps.map(s => {
    const verb = s.verb ? s.verb[0].toUpperCase() + s.verb.slice(1) : "";
    const bits = [verb];
    if (s.mod) bits.push(s.mod > 0 ? `+${s.mod}` : `${s.mod}`);
    if (s.param !== null && s.param !== undefined) bits.push(String(s.param));
    if (s.ignoresArmour) bits.push("(ignores armour)");
    else if (s.ignores) bits.push(`(ignores ${s.ignores} armour)`);
    if (s.ignoresBlock) bits.push("(ignores Block)");
    if (s.area) bits.push(`in an area of ${s.area}`);
    if (s.range) bits.push(`at range ${s.range}`);
    if (s.condition) {
      bits.push(`→ ${s.condition}${s.duration ? ` (${s.duration})` : ""}`);
    }
    if (s.when?.needs) bits.push(`when they are ${s.when.needs}`);
    return bits.filter(Boolean).join(" ");
  }).join(", then ");
}

/**
 * **Cards only.** The Way pools carry spells as well, and those have their own chapter; a Signature
 * may be a standing feature rather than a card, and those are not played from a hand at all. What
 * belongs here is what you can hold.
 */
const isCard = e => !!(e.primary?.length || e.secondary?.length || e.reaction);

function actionChapter() {
  const shelves = [
    ["The starter Warrior's deck", CONTENT.WARRIOR_DECK],
    ["The starter Shade's deck", CONTENT.SHADE_DECK],
    ["The common pool, which any Way may draw from", CONTENT.COMMON_POOL],
    ["Way of Strength", [...CONTENT.STRENGTH_POOL, ...CONTENT.STRENGTH_SIGNATURES]],
    ["Way of Shade", [...CONTENT.SHADE_POOL, ...CONTENT.SHADE_SIGNATURES]],
    ["Way of Mind", [...CONTENT.MIND_POOL, ...CONTENT.MIND_SIGNATURES]],
    ["Way of Faith", [...CONTENT.FAITH_POOL, ...CONTENT.FAITH_SIGNATURES]],
    ["Way cards", CONTENT.WAY_CARDS]
  ];
  const out = [];
  for (const [label, list] of shelves) {
    const cards = (list ?? []).filter(isCard);
    if (!cards.length) continue;
    out.push(`### ${label}`, "");
    out.push("| Card | What it is | Primary | Secondary | Reaction | Copies |",
      "|---|---|---|---|---|---|");
    for (const c of cards) {
      /* The blurb says what it is; a card's own `text` qualifies the rule, and a reader wants
       * both in the one place they are looking. */
      const note = cell(c.text || c.description);
      const what = [CONTENT.CARD_BLURBS[c.name] ?? "", note ? `*${note}*` : ""]
        .filter(Boolean).join(" ");
      out.push(`| **${c.name}** | ${what} | ${cell(half(c.primary)) || "–"} `
        + `| ${cell(half(c.secondary)) || "–"} | ${c.reaction ?? "–"} `
        + `| ${c.copies ?? 1} |`);
    }
    out.push("");
  }
  return out;
}

/* -------------------------------------------- */

export const CHAPTERS = {
  actions: actionChapter,
  items: itemChapter,
  features: featureChapter,
  spells: spellChapter
};

/** Replace what lies between a pair of markers, and leave the rest of the file alone. */
export function fill(text) {
  let out = text;
  for (const [name, build] of Object.entries(CHAPTERS)) {
    const open = `<!-- generated: ${name} -->`;
    const close = `<!-- /generated: ${name} -->`;
    const a = out.indexOf(open);
    const b = out.indexOf(close);
    if (a < 0 || b < 0) throw new Error(`no markers for "${name}" in the handbook`);
    out = out.slice(0, a + open.length) + "\n\n" + build().join("\n").trimEnd() + "\n\n"
      + out.slice(b);
  }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("handbook.mjs")) {
  const before = fs.readFileSync(OUT, "utf8");
  const after = fill(before);
  fs.writeFileSync(OUT, after, "utf8");
  const cards = CHAPTERS.actions().filter(l => l.startsWith("| **")).length;
  console.log(`wrote the handbook's reference chapters: ${cards} action cards, `
    + `${ITEMS.length} items, ${FEATURES.length} features, ${SPELLS.size} spells`);
}
