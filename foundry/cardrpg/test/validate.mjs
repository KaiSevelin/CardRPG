/**
 * Offline validation. Run with: node test/validate.mjs
 *
 * Checks the things that can be checked without Foundry: that every module parses, that the JSON
 * is valid, that every static i18n key resolves, and that the playtest content matches the numbers
 * in rules/starter-cards.md.
 *
 * It cannot tell you the system loads -- only Foundry can. But it catches the mistakes that are
 * tedious to find by clicking: a typo'd i18n key, a deck that no longer adds up, a slate an actor
 * references but nobody defined.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.join(import.meta.dirname, "..");
let failures = 0;

function check(label, got, want) {
  const ok = String(got) === String(want);
  if (!ok) failures++;
  const line = (ok ? "ok   " : "FAIL ") + label.padEnd(46) + got;
  console.log(ok ? line : `${line}   expected ${want}`);
}

function section(name) {
  console.log(`\n--- ${name} ---`);
}

/* -------------------------------------------- */

section("modules parse");

const modules = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "test") walk(full);
    else if (entry.name.endsWith(".mjs")) modules.push(full);
  }
})(root);

for (const file of modules) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  try {
    // `node --check` reads module syntax from the .mjs extension, and unlike importing
    // them it does not execute module-level code -- which matters, since most of these
    // touch Foundry globals that do not exist out here.
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    check(rel, "parses", "parses");
  } catch (err) {
    const text = String(err.stderr ?? err.message);
    const detail = /\w*Error:[^\r\n]*/.exec(text)?.[0] ?? "parse error";
    check(rel, detail.trim(), "parses");
  }
}

/* -------------------------------------------- */

section("json");

for (const rel of ["system.json", "lang/en.json"]) {
  try {
    JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
    check(rel, "valid", "valid");
  } catch (err) {
    check(rel, err.message, "valid");
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "system.json"), "utf8"));
check("manifest declares Card subtypes", Object.keys(manifest.documentTypes.Card ?? {}).length, 7);
check("manifest verified for v14", manifest.compatibility.verified, "14");

// Every file the manifest promises must exist, or the system won't load at all.
for (const rel of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(l => l.path)]) {
  check(`manifest file exists: ${rel}`, fs.existsSync(path.join(root, rel)), "true");
}

/* -------------------------------------------- */

section("i18n");

const lang = JSON.parse(fs.readFileSync(path.join(root, "lang/en.json"), "utf8"));
const sources = [...modules];
(function walkTemplates(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) sources.push(path.join(dir, entry));
})(path.join(root, "templates"));

const referenced = new Set();
for (const file of sources) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/"(CARDRPG\.[A-Za-z0-9_.]+)"/g)) referenced.add(m[1]);
}
const missing = [...referenced].filter(key => !(key in lang)).sort();
check("static keys referenced", referenced.size, referenced.size);
check("keys missing from en.json", missing.length ? missing.join(", ") : "none", "none");

// Every subtype needs a TYPES label or Foundry shows the raw key in its create dialog.
for (const [doc, types] of Object.entries(manifest.documentTypes)) {
  for (const type of Object.keys(types)) {
    check(`TYPES.${doc}.${type}`, `TYPES.${doc}.${type}` in lang, "true");
  }
}

/* -------------------------------------------- */

/*
 * A subtype lives in two places -- documentTypes in system.json and CONFIG.<Doc>.dataModels in
 * cardrpg.mjs -- and adding it to only one is the natural mistake. Declared but unregistered gives
 * a subtype with no system fields; registered but undeclared means Foundry never offers it.
 */
section("subtypes are registered on both sides");

const entry = fs.readFileSync(path.join(root, "cardrpg.mjs"), "utf8");
for (const [doc, types] of Object.entries(manifest.documentTypes)) {
  const block = entry.match(new RegExp(`CONFIG\\.${doc}\\.dataModels\\s*=\\s*\\{([^}]*)\\}`));
  const registered = new Set(
    [...(block?.[1] ?? "").matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)].map(m => m[1])
  );
  const declared = new Set(Object.keys(types));
  const missing = [...declared].filter(t => !registered.has(t));
  const extra = [...registered].filter(t => !declared.has(t));
  check(`${doc}: declared but not registered`, missing.length ? missing.join(", ") : "none", "none");
  check(`${doc}: registered but not declared`, extra.length ? extra.join(", ") : "none", "none");
}

/* -------------------------------------------- */

/*
 * rules/conditions.md is the human-readable list, and a reference that drifts is worse than none:
 * a card author reading a condition that no longer exists writes a card that silently does nothing.
 * So the spec and the config have to name the same set, checked both ways.
 *
 * The spec puts every engine key in backticks in its tables, and the flags table repeats each key
 * once -- which is also what lets the flag names be checked, since a flag invented in prose is the
 * other half of the same mistake.
 */
section("rules/conditions.md matches the config");

const specPath = path.join(root, "../../rules/conditions.md");
if (!fs.existsSync(specPath)) {
  check("rules/conditions.md present", "missing", "present");
} else {
  const spec = fs.readFileSync(specPath, "utf8");
  const ticked = new Set([...spec.matchAll(/`([A-Za-z]+)`/g)].map(m => m[1]));

  // Read independently of the icons section below, which reads the same file for its own reasons.
  const configSource = fs.readFileSync(path.join(root, "module/config.mjs"), "utf8");
  // A condition key is one indented like this AND carrying a Condition label, so filter on the
  // label rather than trying to slice the block out by name.
  const conditions = new Set(
    [...configSource.matchAll(/^  ([a-zA-Z]+): \{[^}]*label: "CARDRPG\.Condition\./gm)].map(m => m[1])
  );
  // The two written across several lines need the multi-line form as well.
  for (const m of configSource.matchAll(/^  ([a-zA-Z]+): \{\s*\n\s*label: "CARDRPG\.Condition\./gm)) {
    conditions.add(m[1]);
  }
  check("conditions found in config", conditions.size, 22);

  /*
   * The spec's removal table claims eleven conditions can be shaken off and nine cannot
   * (conditions.md 8.1). That split is derived in config from `opening` and `noDuration`, so it can
   * be checked here rather than trusted -- and it is the one number in the spec a reader would act
   * on when writing a dispel.
   */
  const block = configSource.slice(
    configSource.indexOf("CARDRPG.conditions = {"), configSource.indexOf("CARDRPG.shakeable")
  );
  const bodyOf = k => {
    const entry = block.slice(block.indexOf("  " + k + ": {"));
    return entry.slice(0, entry.indexOf("},"));
  };
  const shakeable = [...conditions].filter(k => {
    const body = bodyOf(k);
    return !body.includes("opening:") && !body.includes("noDuration:");
  });
  check("conditions that can be shaken off", shakeable.length, 13);

  /*
   * How every condition is got rid of, as an EXHAUSTIVE partition -- which is the only honest answer
   * to "can all conditions be dispelled", because the answer is no and the useful form of it is a
   * list of five reasons with nothing falling between them.
   *
   * A condition landing in no bucket, or in two, is a condition whose removal nobody has decided,
   * and it would otherwise be found by a player at a table.
   */
  const bucket = k => {
    const body = bodyOf(k);
    if (k === "unconscious") return "health";
    if (body.includes("derived:")) return "weight";
    if (body.includes("opening:")) return "clock";
    if (body.includes("liftable:")) return "lift";
    if (!body.includes("noDuration:")) return "shake";
    return null;
  };
  const buckets = {};
  const homeless = [];
  for (const k of conditions) {
    const b = bucket(k);
    if (!b) homeless.push(k);
    else buckets[b] = (buckets[b] ?? 0) + 1;
  }
  check("conditions with no way out at all", homeless.length ? homeless.join(", ") : "none", "none");
  check("removed by Shake Off", buckets.shake ?? 0, 13);
  check("removed by Lift", buckets.lift ?? 0, 2);
  check("removed by dropping weight", buckets.weight ?? 0, 2);
  check("removed by the clock, by design", buckets.clock ?? 0, 4);
  check("removed by Health", buckets.health ?? 0, 1);
  check("the five buckets are exhaustive",
    Object.values(buckets).reduce((a, b) => a + b, 0), conditions.size);

  /*
   * Every condition must be creatable and answerable.
   *
   * This is the check that found Silenced and Disarmed: both fully specified, both with icons, both
   * wired into blocked icons, and NOTHING in the game could cause either -- two conditions a
   * character could suffer that nobody could inflict. A reference that says "nothing" is a hole
   * somebody falls into.
   *
   * Deliberately loose about WHAT the answer is and strict about there being one. A card, a fact
   * (Health above 0 for Unconscious) and the clock-with-a-reason (the four openings) all count; the
   * bare word "nothing" does not. The spec's two tables are the record, so the labels are read out
   * of config and looked up in them -- a condition added to one and not the other fails here.
   */
  const rowsOf = (from, to) => {
    const a = spec.indexOf(from);
    const b = spec.indexOf(to, a);
    const out = new Map();
    if (a < 0 || b < 0) return out;
    for (const line of spec.slice(a, b).split("\n")) {
      if (!line.startsWith("|") || /^\|[\s:|-]+\|$/.test(line)) continue;
      const cells = line.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      if (cells.length < 2) continue;
      for (const name of cells[0].matchAll(/\*\*([A-Za-z' -]+)\*\*/g)) {
        out.set(name[1], cells[cells.length - 1]);
      }
    }
    return out;
  };

  const sources = rowsOf("## 9. What applies each one", "### 9.1");
  const answers = rowsOf("### 9.1 What takes each one off", "### 9.2");
  check("source and answer tables found", sources.size > 0 && answers.size > 0, true);

  // The display name, which is what the tables use. Only one differs from its label.
  const shown = k => (k === "offBalance" ? "Off-Balance"
    : k.charAt(0).toUpperCase() + k.slice(1));
  const empty = v => v === undefined || /^\**nothing\**$/i.test(v.trim());

  const uncreatable = [...conditions].filter(k => empty(sources.get(shown(k)))).sort();
  const unanswerable = [...conditions].filter(k => empty(answers.get(shown(k)))).sort();
  check("conditions nothing can create",
    uncreatable.length ? uncreatable.join(", ") : "none", "none");
  check("conditions nothing can answer",
    unanswerable.length ? unanswerable.join(", ") : "none", "none");

  const undocumented = [...conditions].filter(k => !ticked.has(k)).sort();
  check("conditions missing from the spec",
    undocumented.length ? undocumented.join(", ") : "none", "none");

  // Anything the spec backticks that looks like a condition key but is not one. Restricted to the
  // flags table, where every entry must be a real key or a real flag.
  /*
   * Located by its heading text, not its section number: the numbers move whenever a section is
   * inserted, and a slice keyed to them fails silently by matching nothing -- which is exactly how
   * this check first broke.
   */
  const flagsAt = spec.indexOf("Flags — the machine-readable shape");
  const nextHeading = spec.indexOf("## ", flagsAt + 10);
  const flagTable = flagsAt < 0 ? "" : spec.slice(flagsAt, nextHeading < 0 ? undefined : nextHeading);
  check("the flags section was located", flagsAt >= 0 && flagTable.length > 0, true);
  const flags = new Set([
    "blocks", "blocksSecondary", "blocksReactions", "halvesMove", "reducesMove",
    "noDuration", "derived", "opening", "cancels", "valued", "damagePerTurn"
  ]);
  const stray = [...new Set([...flagTable.matchAll(/`([A-Za-z]+)`/g)].map(m => m[1]))]
    .filter(k => !conditions.has(k) && !flags.has(k)).sort();
  check("stray keys in the flags table", stray.length ? stray.join(", ") : "none", "none");

  // Every flag the config uses must appear in the spec's flag column, or the spec understates the
  // data model -- which is how the three dead flags went unnoticed in the first place.
  const used = new Set([...configSource
    .slice(configSource.indexOf("CARDRPG.conditions = {"), configSource.indexOf("CARDRPG.openings"))
    .matchAll(/(blocksSecondary|blocksReactions|halvesMove|reducesMove|noDuration|derived|opening|cancels|valued|damagePerTurn|blocks):/g)
  ].map(m => m[1]));
  const unlisted = [...used].filter(f => !flagTable.includes("`" + f + "`")).sort();
  check("flags used but not in the spec", unlisted.length ? unlisted.join(", ") : "none", "none");
}

/* -------------------------------------------- */

/*
 * rules/way-cards.md 3.4 claims every one of the twelve magic schools has at least four formulas
 * and at least one at strength 1 and one at strength 2 -- the test being whether a caster at their
 * first node, who has two slots, can prepare anything at all from that school.
 *
 * It is checked because it is the kind of claim that was true when written and quietly stops being
 * true: the previous distribution ran from seven formulas down to one, entirely according to which
 * school the last few passes had happened to need.
 */
section("rules/way-cards.md: every school is playable at two slots");

const waycards = fs.readFileSync(path.join(root, "../../rules/way-cards.md"), "utf8");
// Set inside the schools block below and read again by the gods block, which compares the two.
let formulaCount = 0;
const mindFrom = waycards.indexOf("### 3.4 Way of Mind");
const mindTo = waycards.indexOf("### 3.5 Way of Faith");
if (mindFrom < 0 || mindTo < 0) {
  check("section 3.4 found", "missing", "present");
} else {
  const schools = new Map();
  let current = null;
  for (const line of waycards.slice(mindFrom, mindTo).split("\n")) {
    const heading = /^#### (.+?) \u2014/.exec(line);
    if (heading) {
      current = heading[1];
      schools.set(current, []);
      continue;
    }
    if (!current || !line.startsWith("|") || /^\|[\s:|-]+\|$/.test(line)) continue;
    const cells = line.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    // A formula row is | name | strength | effect |; the header row says "Formula".
    if (cells.length === 3 && cells[0] !== "Formula") schools.get(current).push(cells[1]);
  }

  check("magic schools with a list", schools.size, 12);
  const thin = [...schools].filter(([, f]) => f.length < 4).map(([n, f]) => `${n} (${f.length})`);
  check("schools with fewer than four formulas", thin.length ? thin.join(", ") : "none", "none");

  const unplayable = [...schools]
    .filter(([, f]) => !f.includes("1") || !f.includes("2"))
    .map(([n]) => n);
  check("schools a two-slot caster cannot use",
    unplayable.length ? unplayable.join(", ") : "none", "none");

  formulaCount = [...schools.values()].reduce((n, f) => n + f.length, 0);
  check("formulas written in total", formulaCount, 85);

  /*
   * Every school carries a formula at every strength from 1 to 5. The low end is what a two-slot
   * caster can prepare on their first day; the high end is the school's thesis, and a branch with
   * no 5 is a branch with no argument for walking it to the end.
   */
  const gaps = [...schools]
    .map(([n, f]) => [n, ["1", "2", "3", "4", "5"].filter(b => !f.includes(b))])
    .filter(([, missing]) => missing.length)
    .map(([n, missing]) => `${n} (no ${missing.join(", ")})`);
  check("schools missing a strength band", gaps.length ? gaps.join("; ") : "none", "none");
}

/*
 * The same for the twelve gods, and one thing more: every god must state an **Obedience**, which is
 * what a miracle is paid in. A school is what it cost you to learn; a god is what it costs you to
 * ask, so a god with no Obedience is a god that grants its miracles free.
 */
/*
 * Tactics (way-cards 2.5): one per major node, and none of them a flat bonus.
 *
 * The second half is the check that matters. A tactic is always on and there are forty-eight of
 * them, so the only thing keeping that from being power creep is the rule that a tactic names a
 * position or a behaviour and never a number -- advantage, a removed penalty, a reaction, a
 * restriction on movement, but never +N. That rule erodes one well-meaning card at a time, so it is
 * grepped rather than trusted.
 */
const tacticsFrom = waycards.indexOf("### 2.5 Tactics");
const tacticsTo = waycards.indexOf("## 3. Minor-node content");
if (tacticsFrom < 0 || tacticsTo < 0) {
  check("section 2.5 found", "missing", "present");
} else {
  const tactics = [];
  for (const line of waycards.slice(tacticsFrom, tacticsTo).split("\n")) {
    if (!line.startsWith("|") || /^\|[\s:|-]+\|$/.test(line)) continue;
    const cells = line.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    if (cells.length === 3 && cells[0] !== "Node") {
      tactics.push({ node: cells[0].replace(/\*\*/g, ""), text: cells[2] });
    }
  }
  check("tactics written", tactics.length, 48);

  const flat = tactics.filter(t => /\+\s*\d/.test(t.text)).map(t => t.node);
  check("tactics that add a flat bonus", flat.length ? flat.join(", ") : "none", "none");

  // Every node that has a Signature must have a tactic, and nothing else may.
  const signed = new Set();
  for (const line of waycards.slice(
    waycards.indexOf("## 2. The 48 Signatures"), tacticsFrom
  ).split("\n")) {
    if (!line.startsWith("|") || /^\|[\s:|-]+\|$/.test(line)) continue;
    const cells = line.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    if (cells.length >= 3 && !["Node", "God", "School"].includes(cells[0])) {
      signed.add(cells[0].replace(/\*\*/g, ""));
    }
  }
  const noTactic = [...signed].filter(n => !tactics.some(t => t.node === n));
  check("major nodes with no tactic", noTactic.length ? noTactic.join(", ") : "none", "none");
}

const faithFrom = waycards.indexOf("### 3.5 Way of Faith");
const faithTo = waycards.indexOf("### 3.6 Targeted counters");
if (faithFrom < 0 || faithTo < 0) {
  check("section 3.5 found", "missing", "present");
} else {
  const gods = new Map();
  let current = null;
  for (const line of waycards.slice(faithFrom, faithTo).split("\n")) {
    const heading = /^#### (.+?) —/.exec(line);
    if (heading) {
      current = heading[1];
      gods.set(current, { miracles: 0, obedience: false, bands: [] });
      continue;
    }
    if (!current) continue;
    if (line.includes("**Obedience")) gods.get(current).obedience = true;
    if (!line.startsWith("|") || /^\|[\s:|-]+\|$/.test(line)) continue;
    const cells = line.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    if (cells.length === 3 && cells[0] !== "Miracle") {
      gods.get(current).miracles++;
      gods.get(current).bands.push(cells[1]);
    }
  }

  check("gods with a list", gods.size, 12);
  const thin = [...gods].filter(([, g]) => g.miracles < 3).map(([n, g]) => `${n} (${g.miracles})`);
  check("gods with fewer than three miracles", thin.length ? thin.join(", ") : "none", "none");
  const free = [...gods].filter(([, g]) => !g.obedience).map(([n]) => n);
  check("gods that state no Obedience", free.length ? free.join(", ") : "none", "none");
  check("miracles written in total",
    [...gods.values()].reduce((n, g) => n + g.miracles, 0), 61);

  /*
   * Every god reaches 4 and 5 except The First, whose Obedience caps its spell slots at 3 and so
   * caps its ladder -- the god that does not die cannot be asked for anything grand. That is the
   * point of it, so it is named here rather than excused by a looser check.
   */
  const noTop = [...gods]
    .filter(([, g]) => !g.bands.includes("4") || !g.bands.includes("5"))
    .map(([n]) => n);
  check("gods without a 4 and a 5", noTop.join(", ") || "none", "The First");

  // A god's list stays shorter than a school's, which way-cards 1.4 asks for.
  const miracles = [...gods.values()].reduce((n, g) => n + g.miracles, 0);
  check("a god's list is shorter than a school's", miracles < formulaCount, true);
}

/* -------------------------------------------- */

section("icons");

// Every icon key the config names must exist on disk, or a card face renders a placeholder.
const iconDir = path.join(root, "icons");
const onDisk = fs.existsSync(iconDir)
  ? new Set(fs.readdirSync(iconDir).filter(n => n.endsWith(".svg")).map(n => n.slice(0, -4)))
  : new Set();

const configSource = fs.readFileSync(path.join(root, "module/config.mjs"), "utf8");
const iconKeys = new Set();
for (const m of configSource.matchAll(/icon:\s*"([a-z0-9-]+)"/g)) iconKeys.add(m[1]);
for (const m of configSource.matchAll(/halfIcons\s*=\s*\{[^}]*\}/gs)) {
  for (const k of m[0].matchAll(/"([a-z0-9-]+)"/g)) iconKeys.add(k[1]);
}

check("icon files on disk", onDisk.size, 80);
const absent = [...iconKeys].filter(k => !onDisk.has(k)).sort();
check("config icons present as files", absent.length ? absent.join(", ") : "all", "all");

// CC BY 3.0 needs the credit to ship with the work.
check("ATTRIBUTION.md present", fs.existsSync(path.join(iconDir, "ATTRIBUTION.md")), "true");

// Masking needs the background stripped, or every icon is a solid square.
let withBackground = 0;
for (const name of onDisk) {
  const svg = fs.readFileSync(path.join(iconDir, `${name}.svg`), "utf8");
  if (svg.includes("M0 0h512v512H0z")) withBackground++;
}
check("icons with the background path left in", withBackground, 0);

/* -------------------------------------------- */

section("templates");

// Handlebars is a dev dependency, so skip rather than fail if nobody has run npm install.
let handlebars = null;
try {
  handlebars = (await import("handlebars")).default;
} catch {
  console.log("--   handlebars not installed; run npm install to check templates");
}

if (handlebars) {
  const dir = path.join(root, "templates");
  for (const name of fs.readdirSync(dir)) {
    try {
      handlebars.precompile(fs.readFileSync(path.join(dir, name), "utf8"));
      check(name, "compiles", "compiles");
    } catch (err) {
      check(name, /[^\r\n]+/.exec(err.message)?.[0] ?? "error", "compiles");
    }
  }
}

/* -------------------------------------------- */

section("content vs rules/starter-cards.md");

const content = await import("../module/content.mjs");

check("Warrior deck total cards",
  content.WARRIOR_DECK.reduce((n, c) => n + (c.copies ?? 1), 0), 16);
check("Warrior distinct designs", content.WARRIOR_DECK.length, 10);
check("cards carrying Ready", content.WARRIOR_DECK.filter(c =>
  [...(c.primary ?? []), ...(c.secondary ?? [])].some(s => s.verb === "ready")
).reduce((n, c) => n + (c.copies ?? 1), 0), 4);
check("goblin deck cards", content.GOBLIN_DECK.length, 6);

const fate = content.fateCards();
check("fate deck size", fate.length, 20);
const dist = {};
for (const card of fate) {
  const key = card.system.special
    || (card.system.value > 0 ? `+${card.system.value}` : String(card.system.value));
  dist[key] = (dist[key] ?? 0) + 1;
}
for (const [key, want] of Object.entries({ miss: 1, "-2": 1, "-1": 4, "0": 8, "+1": 4, "+2": 1, crit: 1 })) {
  check(`fate: ${key}`, dist[key], want);
}

/*
 * Combo clauses, against the three promises core-rules 7 makes about them:
 *
 *   1. `needs` names an OPENING, not any old condition. A combo that reads Grappled or Unconscious
 *      is reading something that already does plenty by itself, which is a different and much
 *      harder balancing problem.
 *   2. A clause SHARPENS. One of mod, advantage or dc must be there -- a clause that carries only
 *      prose is a gate wearing a costume, and a gated half is a card held all fight.
 *      Scorch is the deliberate control: its Wet interaction comes from the condition table, so it
 *      carries no clause at all and this check never sees it.
 *   3. `dc` only means something beside a condition the half is already attempting.
 */
const steps = [];
for (const card of [...content.WARRIOR_DECK, ...content.GOBLIN_DECK]) {
  steps.push(...(card.primary ?? []), ...(card.secondary ?? []), ...(card.sequence ?? []));
}
for (const spell of content.FORMULAS) steps.push(spell.effect);
// A piece of magical ammunition is a step too (core-rules 4), so it gets the same key check: a
// misspelled `intensity` on a Frost-dipped Bolt would be dropped exactly as quietly.
for (const item of content.ITEMS) if (item.shot) steps.push(item.shot);

/*
 * Step keys against the schema. A data model only validates once Foundry is running, and a
 * misspelled key is silently dropped rather than rejected -- `areakind` for `areaKind` would simply
 * mean the Blast never happened. Reading the field names out of stepField() keeps this honest
 * without duplicating the list here.
 */
const cardsSource = fs.readFileSync(path.join(root, "module/data/cards.mjs"), "utf8");
const stepBlock = cardsSource.slice(cardsSource.indexOf("export function stepField()"));
const stepKeys = new Set(
  [...stepBlock.slice(0, stepBlock.indexOf("\n}")).matchAll(/^    ([a-zA-Z]+):/gm)].map(m => m[1])
);
check("stepField keys read from source", stepKeys.size, 16);

const strayKeys = new Set();
for (const step of steps) {
  for (const key of Object.keys(step ?? {})) if (!stepKeys.has(key)) strayKeys.add(key);
}
check("step keys not in stepField", strayKeys.size ? [...strayKeys].join(", ") : "none", "none");

const clauses = steps.filter(step => step?.when?.needs);
check("combo clauses found", clauses.length, 2);

const openings = new Set(
  [...configSource.matchAll(/^  ([a-zA-Z]+): \{[^}]*opening: true/gm)].map(m => m[1])
);
check("openings declared in config", openings.size, 4);
const notOpenings = clauses.filter(s => !openings.has(s.when.needs)).map(s => s.when.needs);
check("clauses that read an opening", notOpenings.length ? notOpenings.join(", ") : "all", "all");

const gates = clauses.filter(s =>
  !s.when.mod && !s.when.advantage && !s.when.dc
).map(s => s.when.needs);
check("clauses that only gate", gates.length ? gates.join(", ") : "none", "none");

const danglingDc = clauses.filter(s => s.when.dc && !s.condition).map(s => s.when.needs);
check("clauses with a dc and no condition", danglingDc.length ? danglingDc.join(", ") : "none", "none");

// Every formula's strength is its slot cost, so it has to be in the 1-5 band the rules print.
const band = content.FORMULAS.filter(f => !(f.strength >= 1 && f.strength <= 5)).map(f => f.name);
check("formula strengths in band", band.length ? band.join(", ") : "all", "all");
check("formula slots to run the Rain combo",
  content.FORMULAS.reduce((n, f) => n + f.strength, 0), 6);

/*
 * Item keys against the schema, which is the same check stepField already gets and for the same
 * reason: a data model DROPS a key it does not know rather than rejecting it, so a magic ring
 * written with `grants` before the item schema had a `grants` field silently granted nothing. That
 * is exactly what happened, and this is what would have said so.
 *
 * The schema's own field names are read out of the source, so the list cannot drift.
 */
const itemSource = fs.readFileSync(path.join(root, "module/data/items.mjs"), "utf8");
const itemBlock = itemSource.slice(
  itemSource.indexOf("export class ItemSlateData"),
  itemSource.indexOf("export class FeatureSlateData")
);
const itemFields = new Set([...itemBlock.matchAll(/^      ([a-zA-Z]+): /gm)].map(m => m[1]));
// Written by hand into the entry rather than being schema fields of their own.
for (const extra of ["name", "blurb", "kind", "copies"]) itemFields.add(extra);
// From the SlateData mixin and the shared helpers, which sit outside the class body.
for (const extra of ["active", "drained", "drainedFor", "group", "text", "description"]) {
  itemFields.add(extra);
}
check("ItemSlateData fields read from source", itemFields.size >= 18, true);

/*
 * The same sweep one level down, for the verb line. It is a SchemaField, so the sweep above sees
 * only `verbs` and never what is inside it -- and a content line naming a field the schema does not
 * have is dropped in silence, which is how `reach` could have been written and never stored.
 */
const verbStart = itemSource.indexOf("const verbLine = () =>");
const verbFields = new Set([...itemSource
  .slice(verbStart, itemSource.indexOf("    return {", verbStart))
  .matchAll(/^      ([a-zA-Z]+): /gm)].map(m => m[1]));
check("verb line fields read from source", [...verbFields].sort().join(", "),
  "area, areaKind, ignores, range, reach, reachMin, text, value");

const strayVerbKeys = new Set();
for (const item of [...content.ITEMS, ...content.NPC_GEAR]) {
  for (const line of Object.values(item.verbs ?? {})) {
    for (const key of Object.keys(line ?? {})) if (!verbFields.has(key)) strayVerbKeys.add(key);
  }
}
check("verb line keys not in the schema",
  strayVerbKeys.size ? [...strayVerbKeys].join(", ") : "none", "none");

const strayItemKeys = new Set();
for (const item of [...content.ITEMS, ...content.NPC_GEAR]) {
  for (const key of Object.keys(item)) if (!itemFields.has(key)) strayItemKeys.add(key);
}
check("item keys not in the schema",
  strayItemKeys.size ? [...strayItemKeys].join(", ") : "none", "none");

check("player items written", content.ITEMS.length, 150);

/*
 * Cursed items and the identified switch (rules/equipment.md 11).
 *
 * The switch is what makes a curse work at all -- an unidentified item is USED, not withheld, so
 * everything hangs on two things being true together: a cursed item must arrive unidentified, and
 * an unidentified item must say what it looks like, or the sheet has nothing to show the player and
 * the GM has given the secret away by the gap.
 *
 * And a curse is an obligation (leveling 4), so its text must name the one thing that lifts it --
 * a curse with no way out is a character retired by a loot roll.
 */
const cursed = content.ITEMS.filter(i => i.curse);
check("cursed items", cursed.length, 6);

const known = cursed.filter(i => i.identified !== false).map(i => i.name);
check("cursed items that arrive identified", known.length ? known.join(", ") : "none", "none");

const noWayOut = cursed.filter(i => !/lifted by/i.test(i.curse)).map(i => i.name);
check("curses that name no way out", noWayOut.length ? noWayOut.join(", ") : "none", "none");

const unknown = content.ITEMS.filter(i => i.identified === false);
const faceless = unknown.filter(i => !i.unidentifiedName).map(i => i.name);
check("unidentified items with nothing to show", faceless.length ? faceless.join(", ") : "none", "none");

// A bad potion must be indistinguishable from a good one, which means they share a disguise.
const disguises = new Set(content.ITEMS
  .filter(i => i.kind === "Potion" && i.identified === false)
  .map(i => i.unidentifiedName));
check("disguises the bad potions share", disguises.size, 1);

/*
 * Potions and ammunition are the two kinds a party BUYS rather than finds, and each has a rule that
 * is easy to erode:
 *
 *  - a potion is DRUNK, so it has a Use line and nothing else -- a potion with a Strike line is a
 *    thrown flask wearing the wrong label (rules/equipment.md 8.1 has those);
 *  - magical ammunition is spent on a shot and is gone, so every piece is `consumed` -- a reusable
 *    magic arrow is the Unquiet Quiver's whole reason to exist, and nothing else may do it.
 */
const potions = content.ITEMS.filter(i => i.kind === "Potion");
check("potions written", potions.length, 18);
const notDrunk = potions.filter(i => !i.verbs?.use || i.verbs?.strike).map(i => i.name);
check("potions that are not simply drunk", notDrunk.length ? notDrunk.join(", ") : "none", "none");

const ammo = content.ITEMS.filter(i => i.kind === "Ammunition");
check("magical ammunition written", ammo.length, 13);
const reusable = ammo.filter(i => !i.consumed).map(i => i.name);
check("ammunition that is not spent", reusable.length ? reusable.join(", ") : "none", "none");
// Ammunition rides the Strike, so it must not carry a verb line of its own (core-rules 4).
const acting = ammo.filter(i => i.verbs).map(i => i.name);
check("ammunition with a verb line of its own", acting.length ? acting.join(", ") : "none", "none");

/*
 * Loot variation is about ACCESS, not numbers (rules/equipment.md 9.4): a magic item is the one
 * thing that can hand a non-specialist somebody else's mechanic. So the thing to check is that the
 * catalogue keeps reaching across the game's mechanics rather than growing another +1 sword -- and
 * that no item prints a Signature, which would retire a node.
 */
const magic = content.ITEMS.filter(i => ["Wonder", "Relic", "Make", "Power"].includes(i.kind));
check("magic and crafted items", magic.length >= 40, true);

const prose = i => [i.text ?? "", i.active?.text ?? "",
  ...Object.values(i.verbs ?? {}).map(v => v?.text ?? ""),
  i.bonus?.situation ?? ""].join(" ").toLowerCase();
const reach = [
  "strain", "spent", "rest token", "foresee", "carry", "deck", "block", "initiative",
  "marked", "judged", "lift", "high ground", "shove", "read 3", "wound", "taint",
  // handSize, deckMax and carry come through grants, so they are matched as engine keys.
  "corrode", "burdened", "handsize", "invisible", "burning", "shadowed", "difficult ground"
];
const whole = magic.map(prose).join(" ") + " " + JSON.stringify(magic.map(i => i.grants)).toLowerCase();
const untouched = reach.filter(k => !whole.includes(k));
check("mechanics no magic item reaches", untouched.length ? untouched.join(", ") : "none", "none");

// Brace is universal and never blocked on purpose, so it must not become anybody's identity --
// bought or earned (specializations.md withdrew it as a node lever for the same reason).
const braces = magic.filter(i => /brace/.test(prose(i))).map(i => i.name);
check("items that touch Brace", braces.length ? braces.join(", ") : "none", "none");

// A relic has a price. That is the whole difference between it and a greater wonder.
const freeRelics = content.ITEMS
  .filter(i => i.kind === "Relic" && !/obligation/i.test(i.text ?? ""))
  .map(i => i.name);
check("relics with no obligation", freeRelics.length ? freeRelics.join(", ") : "none", "none");

/*
 * rules/equipment.md 10 -- finding and buying.
 *
 * Section 10 states its rates as FACTS ABOUT THE CATALOGUE rather than as invented dials: "6 of the
 * 60 findable permanent magic items are cursed", "46 of the 150 are consumed". That is the right way
 * to write a loot table and the wrong way to leave it unchecked, because every one of those
 * sentences is a claim about content.mjs that goes stale the moment an item is added. So the doc is
 * read and held to the catalogue, in the direction that matters: the numbers are computed here and
 * the prose must contain them.
 */
section("equipment.md 10: loot quotes the catalogue");

const equipDoc = fs.readFileSync(path.join(root, "../../rules/equipment.md"), "utf8");

/*
 * First, the check that would have caught this section's own absence. Section 10 was a hole for one
 * commit: 11 and 12 were written around it when the identified switch landed, and nothing noticed,
 * because a missing heading breaks no link and fails no test. A gap in the numbering is the one
 * structural error a document can have that reads as deliberate.
 */
const sectionNums = [...equipDoc.matchAll(/^## (\d+)\. /gm)].map(m => Number(m[1]));
const numGaps = sectionNums
  .filter((n, k) => k > 0 && n !== sectionNums[k - 1] + 1)
  .map((n, k) => `${n} follows ${sectionNums[sectionNums.indexOf(n) - 1]}`);
check("gaps in the section numbering", numGaps.length ? numGaps.join(", ") : "none", "none");
check("sections written", sectionNums.length, 12);

const s10 = equipDoc.slice(equipDoc.indexOf("## 10. Finding and buying"),
                           equipDoc.indexOf("## 11. Identified"));
check("section 10 found", s10.length > 2000, true);

// A table cell by the label in its row: cell(label, 1) is the second column, and -1 the last.
function cell(label, i) {
  const row = s10.split("\n").find(l => l.startsWith("|") && l.includes(label));
  if (!row) return `no row for ${label}`;
  const cells = row.split("|").slice(1, -1).map(c => c.trim());
  return cells.at(i);
}
const says = (label, text) =>
  check(label, s10.includes(text) ? "yes" : `missing "${text}"`, "yes");

/*
 * The catalogue, counted the way 10.4 counts it: findable means it carries a bonus group and is
 * none of the three things that are not found -- a relic (a story, 10.3), a curse (a substitution,
 * 10.5) or an unpriced playtest piece (starter-cards.md).
 */
const findable = content.ITEMS.filter(i => i.group && i.value > 0 && i.kind !== "Relic" && !i.curse);
const consumed = content.ITEMS.filter(i => i.consumed);
const tier = v => v <= 150 ? "minor" : v <= 700 ? "lesser" : v <= 2000 ? "greater" : "over";
const tiers = {};
for (const i of findable) tiers[tier(i.value)] = (tiers[tier(i.value)] ?? 0) + 1;
const relics = content.ITEMS.filter(i => i.kind === "Relic");

// 10.2: consumables are the only thing that may be handed out often, because they leave again.
const WORDS = { 46: "Forty-six", 60: "Sixty" };
says("10.2 quotes the consumable count",
  `**${WORDS[consumed.length]} of the ${content.ITEMS.length} items are consumed**`);

// 10.3: a band sets the best item present, and each row says how wide that tier is.
check("10.3 Easy draws from", cell("**Easy**", -1), String(consumed.length));
check("10.3 Moderate draws from", cell("**Moderate**", -1), String(tiers.minor));
check("10.3 Hard draws from", cell("**Hard**", -1), String(tiers.lesser));
check("10.3 Deadly draws from", cell("**Deadly**", -1), String(tiers.greater));
check("10.3 relics, which are no band", cell("*(no band)*", -1), String(relics.length));

// 10.4: the slot ladder is the cap. Ten items want your one finger, and that is the shape working.
says("10.4 quotes the findable count", `**${WORDS[findable.length]} permanent magic items are findable**`);
const bySlot = {};
for (const i of findable) bySlot[i.slot] = (bySlot[i.slot] ?? 0) + 1;
for (const slot of ["pack", "fingers", "hands", "neck"]) {
  const label = slot[0].toUpperCase() + slot.slice(1);
  check(`10.4 items competing for ${slot}`, cell(`**${label}**`, 1), String(bySlot[slot]));
}
// The five single slots share one row, so they share one cell.
check("10.4 the five single slots",
  cell("**Cloak** / **Feet**", 1),
  ["cloak", "feet", "belt", "head", "body"].map(s => bySlot[s]).join(" / "));

/*
 * 10.5: what arrives unknown. These three rates are the ones a GM reads off the page and trusts, and
 * the steep one is deliberate -- one bottle in three being bad is what makes Grey Water work.
 */
const unidentified = content.ITEMS.filter(i => i.identified === false);
says("10.5 the cursed rate", `| 6 of the ${findable.length} findable permanent magic items |`);
says("10.5 the bad-potion rate", `| 6 of the ${potions.length} potions |`);
says("10.5 the unidentified total", `| 12 of ${content.ITEMS.length} items`);
check("10.5 unidentified items", unidentified.length, 12);

// 10.5 says no cursed item has a price, because nobody sells one -- it has nothing to be worth.
const pricedCurses = cursed.filter(i => i.value).map(i => i.name);
check("cursed items with a price", pricedCurses.length ? pricedCurses.join(", ") : "none", "none");

/*
 * 10.7: firearms have one source and it is a church. The market table deliberately has no row for a
 * firearm, so the rule lives in prose -- but the thing that must not drift is section 4 pointing at
 * it, since that is where a GM looks when a player asks the price.
 */
check("section 4 sends firearms to 10.7", /Nobody sells one/.test(equipDoc) ? "yes" : "no", "yes");

/*
 * The simulator's own copy of the catalogue (sim/combat_sim.py).
 *
 * WEAPONS and ARMOUR there are transcriptions of equipment.md 3, 4 and 5, and a measurement taken
 * against a stale transcription is fiction that reads like evidence. This project has published
 * that twice -- an encounter table 23 points out of date, and a set of single-seed figures with an
 * explanation invented for the noise -- so the tables are held to the document they came from.
 */
section("the simulator's copy of the catalogue");

const simSource = fs.readFileSync(path.join(root, "../../sim/combat_sim.py"), "utf8");

// How the simulator's keys map onto the names in the document.
const SIM_WEAPONS = {
  sword: "Longsword", bow: "Shortbow", longbow: "Longbow", crossbow: "Crossbow",
  heavy_crossbow: "Heavy Crossbow", arquebus: "Arquebus", musket: "Matchlock Musket",
  pistol: "Matchlock Pistol",
};

/*
 * Only the catalogue sections, because 1.2 prints a SUMMARY armour table -- armour, kg, and a
 * sentence -- whose columns are not 5's, and it comes first in the file. Anchoring a row by its
 * name alone finds that one and reads the wrong cells, which is the third time on this project an
 * anchor has matched twice.
 */
const catalogue = equipDoc.slice(equipDoc.indexOf("## 2. Melee weapons"),
                                 equipDoc.indexOf("## 6. Worn items"));

// A row of any weapon table: name | fits | tags | hands | kg | value | strike line.
function weaponRow(name) {
  // 9 cells in the bow and firearm tables; the melee table carries a tenth, "For", which does not
  // move the columns before it.
  const row = catalogue.split("\n").find(l =>
    l.startsWith("| **" + name + "**") && [9, 10].includes(l.split("|").length));
  if (!row) return null;
  const c = row.split("|").slice(1, -1).map(x => x.trim());
  const line = c[6];
  return {
    kg: Number(c[4]),
    heavy: /Heavy/.test(c[2]),
    strike: Number(/^\*{0,2}(\d+)/.exec(line)?.[1]),
    rng: Number(/range (\d+)/.exec(line)?.[1] ?? 1),
    ignores: Number(/ignores (\d+) armor/.exec(line)?.[1] ?? 0),
    reload: /Ready to reload/.test(line),
  };
}

// One entry of a python dict-of-dicts, by its key: 'sword': dict(strike=3, rng=1, ...)
function simEntry(key) {
  const row = simSource.split("\n").find(l => l.trim().startsWith(key + ":") && l.includes("dict("));
  return row ? row.slice(row.indexOf("dict(") + 5, row.lastIndexOf(")")) : null;
}
function simField(entry, f, dflt) {
  const m = new RegExp(f + "=(True|False|\\d+)").exec(entry);
  return m ? (m[1] === "True" ? true : m[1] === "False" ? false : Number(m[1])) : dflt;
}

const drift = [];
for (const [key, name] of Object.entries(SIM_WEAPONS)) {
  const doc = weaponRow(name);
  if (!doc) { drift.push(name + ": no row in equipment.md"); continue; }
  const entry = simEntry("'" + key + "'");
  if (!entry) { drift.push(key + ": not in the simulator"); continue; }
  for (const [f, got, want] of [
    ["strike", simField(entry, "strike"), doc.strike],
    ["rng", simField(entry, "rng"), doc.rng],
    ["kg", simField(entry, "kg"), doc.kg],
    ["heavy", simField(entry, "heavy", false), doc.heavy],
    ["ignores", simField(entry, "ignores", 0), doc.ignores],
    ["reload", simField(entry, "reload", false), doc.reload],
  ]) if (String(got) !== String(want)) drift.push(`${key}.${f} ${got} != ${want}`);
}
check("weapons that drifted from the document", drift.length ? drift.join("; ") : "none", "none");

// The armour ladder: four rungs, each with the kilograms it is bought with and whether it is the
// Heavy Armor that blocks Sidestep (core-rules 10). Both halves of the price, both checked.
const armourDrift = [];
for (const [rung, name] of [[1, "Leather Armor"], [2, "Mail Shirt"], [3, "Brigandine"], [4, "Plate"]]) {
  const row = catalogue.split("\n").find(l =>
    l.startsWith("| **" + name + "**") && l.split("|").length === 8);
  if (!row) { armourDrift.push(name + ": no row"); continue; }
  const c = row.split("|").slice(1, -1).map(x => x.trim());
  const want = { kg: Number(c[3]), heavy: /Heavy/.test(c[2]), armor: Number(/Armor (\d+)/.exec(c[5])?.[1]) };
  const entry = simEntry(String(rung)) ?? "";
  if (want.armor !== rung) armourDrift.push(`${name} is Armor ${want.armor}, not rung ${rung}`);
  if (simField(entry, "kg") !== want.kg) armourDrift.push(`${name} kg ${simField(entry, "kg")} != ${want.kg}`);
  if (simField(entry, "heavy", false) !== want.heavy) armourDrift.push(`${name} heavy != ${want.heavy}`);
}
check("armour rungs that drifted", armourDrift.length ? armourDrift.join("; ") : "none", "none");

// core-rules 4 sets the carry limit, and the simulator charges Plate's weight against it.
const limit = /Your \*\*limit\*\* is \*\*(\d+) kg\*\*/.exec(
  fs.readFileSync(path.join(root, "../../rules/core-rules.md"), "utf8"))?.[1];
check("carry limit matches core-rules", /CARRY_LIMIT = (\d+)/.exec(simSource)?.[1], limit);

/*
 * `ignores N armor` used to be prose on the verb line and nothing else: resolve.mjs subtracted the
 * whole of a target's armour, so eight items promised something the engine never did. Prose is not
 * a rule, which is the answer to the open question of whether this should be a tag -- and the
 * reason it got urgent is measured, not argued: against armoured infantry an arquebus wins 46.5%
 * of fights where a longsword wins 0.8%, and the entire gap is this one number.
 *
 * Now that it is a field there are two of it, so the check is that they agree. A card that says
 * one thing and resolves another is worse than the gap was.
 */
const piercers = content.ITEMS.filter(i =>
  Object.values(i.verbs ?? {}).some(v => /ignores \d+ armor/.test(v?.text ?? "")));
check("items promising to ignore armor", piercers.length, 8);

const mismatched = [];
for (const item of piercers) {
  for (const [name, v] of Object.entries(item.verbs ?? {})) {
    const said = Number(/ignores (\d+) armor/.exec(v?.text ?? "")?.[1] ?? NaN);
    if (Number.isNaN(said)) continue;
    if (v.ignores !== said) mismatched.push(`${item.name}.${name}: says ${said}, field ${v.ignores}`);
  }
}
check("items whose text and field disagree",
  mismatched.length ? mismatched.join("; ") : "none", "none");

// And the engine has to actually take it off, or the field is the prose again with extra steps.
const resolveSource = fs.readFileSync(path.join(root, "module/resolve.mjs"), "utf8");
check("engine subtracts what a line ignores",
  /line\.ignores/.test(resolveSource) ? "yes" : "no", "yes");
/*
 * Off the armour, never off Block: a bolt finds a gap in plate, not past a raised shield. Anchored
 * on both halves of that sentence rather than on one variable name, because the loop now computes
 * damage for whoever is TAKING the hit, which a Bodyguard can change.
 */
check("ignores is kept off Block",
  /armor = Math\.max\(0, \(who\.system\.armor \?\? 0\) - pierce\)/.test(resolveSource)
  && /block = who\.system\.block \?\? 0/.test(resolveSource) ? "yes" : "no", "yes");


/*
 * Ammunition, both halves of it (core-rules 4).
 *
 * "It must suit the weapon: an arrow is not a ball" was the same disease `ignores N armor` had and
 * in a worse place: the suitability rule was prose in two documents and prose on the item's own
 * `text`, so nothing in the game stopped a Silvered Head going down a musket. It takes two fields
 * to fix -- the weapon names the class it takes, the piece names the classes it suits -- and two
 * fields is two things that can drift, from each other and from the table in equipment.md 8.3.
 *
 * So everything below is the same shape of check: the vocabulary is read out of config, both sides
 * are held to it, and the prose is held to both.
 */
section("ammunition: both halves of the rule");

const slates = [...content.ITEMS, ...content.NPC_GEAR];
const ammoClasses = [...configSource
  .slice(configSource.indexOf("CARDRPG.ammoKinds = {"), configSource.indexOf("CARDRPG.shotEffects"))
  .matchAll(/^  ([a-zA-Z]+): \{/gm)].map(m => m[1]);
check("ammunition classes declared", ammoClasses.join(", "), "bow, crossbow, firearm");

/* The weapon's half. The `ranged` tag is the independent list to check against: a weapon that
 * shoots and takes nothing is a weapon no piece of ammunition can ever be fired from. */
const takers = slates.filter(i => i.ammo);
check("weapons that take ammunition", takers.length, 9);
const rangedTagged = slates.filter(i => i.tags?.includes("ranged"));
const noClass = rangedTagged.filter(i => !i.ammo).map(i => i.name);
check("ranged weapons that take no class", noClass.length ? noClass.join(", ") : "none", "none");
// And the other direction: a thrown axe IS the projectile, so it must not take one either.
const notRanged = takers.filter(i => !i.tags?.includes("ranged")).map(i => i.name);
check("ammunition classes on something not ranged",
  notRanged.length ? notRanged.join(", ") : "none", "none");
const strayTakes = takers.filter(i => !ammoClasses.includes(i.ammo)).map(i => `${i.name}: ${i.ammo}`);
check("weapons taking a class that does not exist",
  strayTakes.length ? strayTakes.join(", ") : "none", "none");

/* The piece's half. */
const suitsNothing = ammo.filter(a => !(a.ammoFor ?? []).length).map(a => a.name);
check("pieces that suit no weapon", suitsNothing.length ? suitsNothing.join(", ") : "none", "none");
const strayFor = ammo.flatMap(a =>
  (a.ammoFor ?? []).filter(k => !ammoClasses.includes(k)).map(k => `${a.name}: ${k}`));
check("pieces naming a class that does not exist",
  strayFor.length ? strayFor.join(", ") : "none", "none");
const untaken = ammoClasses.filter(k => !takers.some(i => i.ammo === k));
check("classes no weapon takes", untaken.length ? untaken.join(", ") : "none", "none");
const unserved = ammoClasses.filter(k => !ammo.some(a => (a.ammoFor ?? []).includes(k)));
check("classes no piece suits", unserved.length ? unserved.join(", ") : "none", "none");

/*
 * The prose against the field, which is the whole lesson of the section above. Every piece opens
 * its text with the weapons it suits, so that sentence is parseable and must agree.
 */
const opens = {
  "Bow or crossbow.": "bow,crossbow",
  "Bow.": "bow",
  "Crossbow.": "crossbow",
  "Firearm only.": "firearm"
};
const saidDrift = [];
for (const piece of ammo) {
  const lead = /^([^.]*\.)/.exec(piece.text ?? "")?.[1];
  const want = opens[lead];
  if (!want) { saidDrift.push(`${piece.name}: text opens "${lead}"`); continue; }
  const got = [...(piece.ammoFor ?? [])].sort().join(",");
  if (got !== want) saidDrift.push(`${piece.name}: says ${lead} field ${got}`);
}
check("pieces whose text and field disagree", saidDrift.length ? saidDrift.join("; ") : "none", "none");

/*
 * Nine of the thirteen are a step and four are a hook, and nothing is both or neither.
 *
 * `shot` being a step is why this cost so little: a card's half and a piece of ammunition are the
 * same shape, so the condition a Frost-dipped Bolt lands is landed by the code that already lands
 * every condition a card prints. The four that are not a step each do something no step can say.
 */
const isStep = a => !!(a.shot && (a.shot.condition || a.shot.ignores || a.shot.area || a.shot.mod));
check("pieces that are a step", ammo.filter(isStep).length, 9);
check("pieces that are a hook", ammo.filter(a => a.shotEffect).length, 4);
const inert = ammo.filter(a => !isStep(a) && !a.shotEffect).map(a => a.name);
check("pieces that do nothing at all", inert.length ? inert.join(", ") : "none", "none");
const doubled = ammo.filter(a => isStep(a) && a.shotEffect).map(a => a.name);
check("pieces that are both", doubled.length ? doubled.join(", ") : "none", "none");

// A condition it hands out has to be a condition the game has.
const badCondition = ammo
  .filter(a => a.shot?.condition && !configSource.includes("\n  " + a.shot.condition + ": {"))
  .map(a => `${a.name}: ${a.shot.condition}`);
check("pieces landing a condition that does not exist",
  badCondition.length ? badCondition.join(", ") : "none", "none");

// The one piece that is a number rather than a condition, held to its own prose as above.
const shotPiercers = ammo.filter(a => /ignores \d+ armor/i.test(a.text ?? ""));
check("pieces promising to ignore armor", shotPiercers.length, 1);
const shotDrift = shotPiercers
  .filter(a => a.shot?.ignores !== Number(/ignores (\d+) armor/i.exec(a.text)[1]))
  .map(a => a.name);
check("pieces whose armor promise and field disagree",
  shotDrift.length ? shotDrift.join(", ") : "none", "none");

/*
 * The hooks, against the resolver that has to act on them -- and the one that deliberately does
 * not. Silvered Head permits a target Invisible would otherwise protect, and Invisible currently
 * hands out advantage instead of stopping a target, so there is nothing to permit yet. That is an
 * open question in conditions.md, not an oversight, and this is what keeps the two in step: if the
 * question is ever answered the resolver must grow the case, and if the field is ever quietly
 * dropped from the enum this fails too.
 */
const declaredEffects = [...configSource
  .slice(configSource.indexOf("CARDRPG.shotEffects = {"))
  .split("};")[0]
  .matchAll(/^  ([a-zA-Z]+): \{/gm)].map(m => m[1]);
check("shot effects declared", declaredEffects.join(", "),
  "ignoresCover, pullsShooter, seesInvisible, carriesPotion");
const unused = declaredEffects.filter(k => !ammo.some(a => a.shotEffect === k));
check("shot effects no piece uses", unused.length ? unused.join(", ") : "none", "none");
const acted = declaredEffects.filter(k =>
  resolveSource.includes(`case "${k}":`) || resolveSource.includes(`=== "${k}"`));
check("shot effects the resolver acts on", acted.join(", "),
  "ignoresCover, pullsShooter, carriesPotion");
const conditionsDoc = fs.readFileSync(path.join(root, "../../rules/conditions.md"), "utf8");
check("the question that holds Silvered Head still open",
  conditionsDoc.includes("Whether **Invisible** should stop targeting") ? "yes" : "no", "yes");

/*
 * And the engine, because a field nothing reads is the prose again with extra steps.
 */
check("engine checks that a piece suits the weapon",
  resolveSource.includes("ammo.system.suits(item)") ? "yes" : "no", "yes");
check("engine adds what a shot ignores",
  resolveSource.includes("shot?.ignores") ? "yes" : "no", "yes");
// Gone whether the shot lands or misses: the delete has to sit OUTSIDE the hit test, before it.
const spent = resolveSource.indexOf("await ammo.delete()");
const hitGate = resolveSource.indexOf("if (!missed) {");
check("the piece is spent before anything depends on the hit",
  spent > 0 && hitGate > 0 && spent < hitGate, true);
// Anchored on the whole disadvantage condition, not on the field name: the field is also named in
// the line that merely explains itself in chat, and a check that matched there passed a resolver
// that had stopped reading cover at all.
check("cover is read where advantage is decided",
  resolveSource.includes("(ranged || area) && target?.system?.cover && !ignoresCover")
    ? "yes" : "no", "yes");
const actorsSource = fs.readFileSync(path.join(root, "module/data/actors.mjs"), "utf8");
check("cover exists on both actor models",
  (actorsSource.match(/cover: new fields\.BooleanField/g) ?? []).length, 2);
// Nocking costs no half of its own, so it must not be spending one anywhere.
const traySource = fs.readFileSync(path.join(root, "module/tray.mjs"), "utf8");
check("the nock asks before the Strike resolves",
  traySource.includes("await this.#nock(item)") ? "yes" : "no", "yes");

/*
 * equipment.md 8.3 prints the same pairing in a table, and a table is the easiest thing in the
 * project to leave behind: the For column is read here and held to the field.
 */
const s83 = equipDoc.slice(equipDoc.indexOf("### 8.3 Magical ammunition"),
                           equipDoc.indexOf("## 9. Magic items"));
check("section 8.3 found", s83.length > 1000, true);
const docDrift = [];
for (const piece of ammo) {
  const row = s83.split("\n").find(l => l.startsWith("|") && l.includes(`**${piece.name}**`));
  if (!row) { docDrift.push(`${piece.name}: no row in 8.3`); continue; }
  const said = (row.split("|").slice(1, -1).map(c => c.trim()).at(2) ?? "")
    .replace(/\*/g, "").replace(" only", "").split(",").map(x => x.trim()).sort().join(",");
  const got = [...(piece.ammoFor ?? [])].sort().join(",");
  if (said !== got) docDrift.push(`${piece.name}: doc ${said}, field ${got}`);
}
check("8.3 and the fields disagree", docDrift.length ? docDrift.join("; ") : "none", "none");



// Every bonus group should have something using it, or the group is a promise nothing keeps.
const groupsUsed = new Set(content.ITEMS.filter(i => i.group).map(i => i.group));
const declared = Object.keys(
  JSON.parse("{" + (/CARDRPG\.bonusGroups = \{([^}]*(?:\}[^}]*)*?)\};/.exec(configSource)?.[1] ?? "")
    .replace(/(\w+): \{[^}]*\}/g, '"$1": 0').replace(/,\s*$/, "") + "}")
);
const emptyGroups = declared.filter(g => !groupsUsed.has(g));
check("bonus groups with no item using them",
  emptyGroups.length ? emptyGroups.join(", ") : "none", "body, training");

const slateNames = new Set([...content.ITEMS, ...content.NPC_GEAR, ...content.FEATURES].map(s => s.name));
for (const actor of [content.WARRIOR, content.GOBLIN, content.GOBLIN_ARCHER]) {
  const refs = [...(actor.equipped ?? []), ...(actor.pack ?? []), ...(actor.features ?? [])];
  const unresolved = refs.filter(name => !slateNames.has(name));
  check(`${actor.name}: slates resolve`, unresolved.length ? unresolved.join(", ") : "all", "all");
}

const byName = Object.fromEntries([...content.ITEMS, ...content.NPC_GEAR].map(i => [i.name, i]));

// The loadout every simulation run used, so the measured win rates apply to it directly.
check("Warrior equipped weight (kg)",
  content.WARRIOR.equipped.reduce((n, name) => n + (byName[name]?.weight ?? 0), 0), 10);

// NPC gear is tuned separately and must not leak into player pickers.
check("NPC gear all flagged", content.NPC_GEAR.every(i => i.npcGear), "true");
check("player items none flagged", content.ITEMS.every(i => !i.npcGear), "true");

// Keep a weak enemy's Strike at least 2 above the heroes' armor (hero armor here is 1).
const heroArmor = content.ITEMS.find(i => i.name === "Leather Armor").armor;
for (const name of ["Goblin Spear", "Goblin Shortbow"]) {
  check(`${name} strike >= armor + 2`,
    byName[name].verbs.strike.value >= heroArmor + 2, "true");
}

// A slate carries a bonus group only if it grants a bonus; flat traits never do.
for (const feature of content.FEATURES) {
  if (feature.grants && feature.group) {
    check(`${feature.name}: flat trait must not be grouped`, "grouped", "ungrouped");
  }
}
check("features with flat grants are ungrouped",
  content.FEATURES.filter(f => f.grants && f.group).length, 0);

/* -------------------------------------------- */

/*
 * Templates against the code and the stylesheet.
 *
 * Every button in a template names an action that an application must have registered, and every
 * class it uses must exist in the stylesheet. Both go stale silently: a renamed handler leaves a
 * dead button, and an edit that truncates the stylesheet leaves whole panels unstyled. Neither
 * throws, so only a check like this one finds them.
 */
section("templates reference live code");

const templateDir = path.join(root, "templates");
const templateText = fs.readdirSync(templateDir)
  .map(name => fs.readFileSync(path.join(templateDir, name), "utf8"))
  .join("\n");
const moduleText = modules.map(f => fs.readFileSync(f, "utf8")).join("\n");

// Registered as `actionName: SomeClass.#onThing,` in a DEFAULT_OPTIONS actions block.
const registered = new Set(
  [...moduleText.matchAll(/^ {6}(\w+): \w+\.#on\w+,?$/gm)].map(m => m[1]));
// ApplicationV2 handles these itself; nothing in our code registers them.
for (const builtin of ["close", "submit", "tab"]) registered.add(builtin);

const used = new Set([...templateText.matchAll(/data-action="([a-zA-Z]+)"/g)].map(m => m[1]));
const unregistered = [...used].filter(a => !registered.has(a));
check("actions used in templates", used.size, used.size);
check("actions with no handler", unregistered.length ? unregistered.join(", ") : "none", "none");

const css = fs.readFileSync(path.join(root, "styles", "cardrpg.css"), "utf8");
// Each segment must end in a letter or digit, so a name built in the template -- "cr-half--{{...}}"
// -- contributes the part that is actually written down and nothing more. The lookbehind keeps a
// custom property out of it: "--cr-depth" is a variable the stylesheet reads, not a class.
const classes = new Set(
  [...templateText.matchAll(/(?<![\w-])cr-[a-z0-9]+(?:[-_]{1,2}[a-z0-9]+)*/g)].map(m => m[0]));
// A selector has to end where the class name does: ".cr-stack__emptyx" is not ".cr-stack__empty".
const unstyled = [...classes].filter(c =>
  !new RegExp(String.raw`\.${c}(?![\w-])`).test(css));
check("cr- classes used in templates", classes.size, classes.size);
check("classes missing from the stylesheet", unstyled.length ? unstyled.join(", ") : "none", "none");

/* -------------------------------------------- */

/*
 * Tag balance, and one root element per template.
 *
 * ApplicationV2 refuses a part that renders more than one root: "Template part must render a
 * single HTML element". One stray </div> left behind by an edit closes the wrapper early and every
 * section after it becomes a second root -- which only throws once the conditional holding that
 * section happens to be true, so it can sit in the file for a while before anyone sees it.
 *
 * Handlebars expressions are stripped first. An {{#if}}/{{else}} leaves both branches behind, so
 * each branch has to balance on its own; that is true here and is the stricter rule anyway.
 */
section("templates are well formed");

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "param", "source", "track", "wbr"]);

for (const name of fs.readdirSync(templateDir)) {
  const text = fs.readFileSync(path.join(templateDir, name), "utf8").replace(/\{\{[\s\S]*?\}\}/g, "");
  const stack = [];
  let roots = 0;
  let trouble = null;

  for (const m of text.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    const [, closing, tag, attrs, selfClose] = m;
    if (VOID.has(tag.toLowerCase()) || selfClose) continue;
    if (!closing) {
      if (!stack.length) roots++;
      stack.push(tag);
      continue;
    }
    if (!stack.length) { trouble ??= `stray </${tag}>`; continue; }
    const open = stack.pop();
    if (open !== tag) trouble ??= `</${tag}> closes <${open}>`;
  }
  if (stack.length) trouble ??= `unclosed <${stack[stack.length - 1]}>`;
  if (roots !== 1) trouble ??= `${roots} root elements`;
  check(name, trouble ?? "one root, balanced", "one root, balanced");
}


/* -------------------------------------------- */

/*
 * Reactions: automatic, and the one decision that is left (core-rules 3).
 *
 * Nothing in the engine had ever played one. The vocabulary was there, the tray drew the row, and
 * `reactionTimer` was a registered setting with no reader -- so all five reactions were words on a
 * card, exactly as Sidestep was until the simulator implemented it and `ignores N armor` was until
 * it became a field. These checks are mostly about the three ways that happens: a rule that lives
 * only in prose, a vocabulary nothing dispatches on, and a policy with no stated threshold.
 */

section("reactions: automatic, and the card turned sideways");

const reactionBlock = configSource.slice(
  configSource.indexOf("CARDRPG.reactionTriggers = {"),
  configSource.indexOf("/** NPC tactic keywords"));
const triggers = [...reactionBlock
  .slice(0, reactionBlock.indexOf("CARDRPG.reactions = {"))
  .matchAll(/^  ([a-zA-Z]+): "/gm)].map(m => m[1]);
check("triggers declared", triggers.join(", "), "hit, allyHit, arrival, cast, check");

const reactionLines = [...reactionBlock
  .slice(reactionBlock.indexOf("CARDRPG.reactions = {"))
  .matchAll(/^  ([a-zA-Z]+): \{([^}]*)\}/gm)]
  .map(m => ({ key: m[1], body: m[2] }));
check("reactions declared", reactionLines.map(r => r.key).join(", "),
  "parry, block, sidestep, counter, use, heckle, bodyguard, unmake, mend, bargain");

/* Every reaction must name a trigger that exists, or it is a reaction nothing can ever fire. */
const triggerOf = r => /trigger: "([a-zA-Z]+)"/.exec(r.body)?.[1] ?? "";
const noTrigger = reactionLines.filter(r => !triggerOf(r)).map(r => r.key);
check("reactions with no trigger", noTrigger.length ? noTrigger.join(", ") : "none", "none");
const strayTrigger = reactionLines
  .filter(r => triggerOf(r) && !triggers.includes(triggerOf(r)))
  .map(r => `${r.key}: ${triggerOf(r)}`);
check("reactions naming a trigger that does not exist",
  strayTrigger.length ? strayTrigger.join(", ") : "none", "none");

/*
 * Use's trigger is the whole rephrasing. "Any time on another's turn" is not an event, which made
 * it the one reaction no engine could fire and no prompt could open at; it answers a hit now.
 */
check("Use fires on a hit", triggerOf(reactionLines.find(r => r.key === "use")), "hit");
check("reactions that fire on a hit",
  reactionLines.filter(r => triggerOf(r) === "hit").map(r => r.key).join(", "),
  "parry, block, use");
check("reactions that fire on an arrival",
  reactionLines.filter(r => triggerOf(r) === "arrival").map(r => r.key).join(", "),
  "sidestep, counter, heckle");
/*
 * The arrival trigger has two answers and a reaction is one, so the engine needs an order -- and it
 * is the one core-rules 11 gives: the step denies the attack, the counter does not.
 */
check("the step is tried before the counter",
  /const step = options\.find\(o => o\.key === "sidestep"\)[\s\S]*?const set = options\.find\(o => o\.key === "counter"\)/
    .test(resolveSource) ? "yes" : "no", "yes");

/* Brace is universal, so it must NOT be a printed reaction -- and it still needs a number. */
check("Brace is not a printed reaction",
  reactionLines.some(r => r.key === "brace") ? "listed" : "universal", "universal");
check("Brace has a value", /brace: 1/.test(configSource) ? "yes" : "no", "yes");

/* The timer is gone, everywhere. A setting nothing reads is the state this started in. */
check("reaction timer retired from config",
  /reactionTimer/.test(configSource) ? "still there" : "gone", "gone");
check("reaction timer retired from settings",
  /reactionTimer/.test(entry) ? "still there" : "gone", "gone");
check("reaction timer has no orphan i18n keys",
  Object.keys(lang).some(k => k.includes("ReactionTimer")) ? "still there" : "gone", "gone");
const hudSpec = fs.readFileSync(path.join(root, "../hud-spec.md"), "utf8");
check("reaction timer retired from the HUD spec",
  /\*\*Setting: `reactionTimer`\*\*/.test(hudSpec) || /^### 6\.1 The reaction timer$/m.test(hudSpec)
    ? "still specified" : "gone", "gone");

/* The cards that carry one, against the config. */
const reactionKeys = reactionLines.map(r => r.key);
/*
 * Every pool that prints a reaction. This list was the two that existed when it was written, then
 * four, and each time it went stale it stopped seeing a whole Way -- which is how `bodyguard` went
 * on being reported as a reaction nobody carries after Interpose started carrying it.
 *
 * So the Signatures are gathered BY CONVENTION rather than by name: any content export ending in
 * `_SIGNATURES` is one, and a third Way needs no edit here.
 */
const signatureExports = Object.entries(content)
  .filter(([key]) => key.endsWith("_SIGNATURES"))
  .flatMap(([, list]) => list);
check("Signature exports found", signatureExports.length >= 24, true);
const carried = [...content.WARRIOR_DECK, ...content.WAY_CARDS, ...content.COMMON_POOL,
  ...signatureExports.filter(c => c.kind === "card")];
const printed = carried.filter(c => c.reaction);
check("starter cards with a printed reaction",
  content.WARRIOR_DECK.filter(c => c.reaction).length, 4);
check("cards with a printed reaction", printed.length, 14);
const strayPrinted = printed.filter(c => !reactionKeys.includes(c.reaction))
  .map(c => `${c.name}: ${c.reaction}`);
check("cards printing a reaction that does not exist",
  strayPrinted.length ? strayPrinted.join(", ") : "none", "none");
/*
 * Bodyguard is implemented against nothing: it is in the config, the resolver fires it, and no card
 * in the game prints it. That is worth asserting rather than leaving to be noticed, and it is why
 * equipment.md 12 carries it as an [OPEN].
 */
/*
 * A reaction may now be printed by a **spell** as well as by a card, so both are counted. That is
 * not a loosening: a reaction nothing prints is still a reaction nothing can ever fire, and this is
 * the check that caught `bodyguard` sitting unprinted for months.
 */
const reactionSpells = Object.entries(content)
  .filter(([k]) => k.endsWith("_SIGNATURES") || k.endsWith("_POOL"))
  .flatMap(([, v]) => v).filter(sp => sp.reaction);
const unprinted = reactionKeys.filter(k =>
  !printed.some(c => c.reaction === k) && !reactionSpells.some(sp => sp.reaction === k));
/* Interpose closed the last one: `bodyguard` was printed by nothing until Way of Strength's
 * Bodyguard claimed it, which is what the reaction was written for in the first place. */
check("reactions no card prints", unprinted.length ? unprinted.join(", ") : "none", "none");
check("the unprinted one is recorded as open",
  /\[OPEN\]\*\* \*\*Nothing in the game prints/.test(equipDoc)
  && /Bodyguard\.\*\* It is in the config/.test(equipDoc) ? "yes" : "no", "yes");

/* -------------------------------------------- */

/*
 * Heavy Armor's drawback. It was the sentence "Blocks Sidestep reactions." and nothing else, so the
 * simulator charged Plate for it and the game did not -- the same gap `ignores N armor` and the
 * ammunition `For` column each had, and the third time this project has found it.
 */
const bans = slates.filter(i => (i.blocksReactions ?? []).length);
check("slates that take a reaction away", bans.map(i => i.name).join(", "), "Brigandine, Plate");
const strayBan = bans.flatMap(i =>
  i.blocksReactions.filter(k => !reactionKeys.includes(k)).map(k => `${i.name}: ${k}`));
check("slates banning a reaction that does not exist",
  strayBan.length ? strayBan.join(", ") : "none", "none");
/*
 * The ones that take the Sidestep are exactly the heavy armour on the BODY -- and the slot has to
 * be in that sentence, because `heavy` + `armor` also catches the **Great Helm**, which is a heavy
 * piece of armour that is not Heavy Armor. That is one more instance of `heavy` doing two unrelated
 * jobs (equipment.md 12), and it is asserted here rather than left for a reader to trip over.
 */
const heavyArmour = slates.filter(i =>
  i.tags?.includes("armor") && i.tags?.includes("heavy") && i.slot === "body").map(i => i.name);
check("heavy armour on the body", heavyArmour.join(", "), "Brigandine, Plate");
const heavyElsewhere = slates.filter(i =>
  i.tags?.includes("armor") && i.tags?.includes("heavy") && i.slot !== "body").map(i => i.name);
check("heavy armour that is not Heavy Armor", heavyElsewhere.join(", "), "Great Helm");
check("the helm case is recorded as open",
  /a heavy \*\*helm\*\* is heavy armour and is not Heavy Armor/.test(equipDoc) ? "yes" : "no", "yes");

/* The prose against the field, both directions. This is the whole lesson of the three gaps above. */
const saysSidestep = slates.filter(i => /Sidestep/i.test(i.text ?? "")).map(i => i.name);
check("slates whose text mentions the Sidestep", saysSidestep.join(", "), "Brigandine, Plate");
const promiseDrift = slates.filter(i =>
  /Sidestep/i.test(i.text ?? "") !== (i.blocksReactions ?? []).includes("sidestep")).map(i => i.name);
check("slates whose text and field disagree",
  promiseDrift.length ? promiseDrift.join(", ") : "none", "none");

check("the item schema carries the field",
  /blocksReactions: new fields\.SetField/.test(itemSource) ? "yes" : "no", "yes");
check("both actor models read it",
  (actorsSource.match(/get blockedReactions\(\)/g) ?? []).length, 2);
/*
 * The READ, not the name: `blockedReactions` also appears in the comment explaining why Stunned is
 * tested separately, so matching the bare word passed a resolver that had stopped reading the field
 * at all. Second time a check in this file has matched its own documentation.
 */
check("the resolver reads it",
  /const off = actor\.system\.blockedReactions \?\? new Set\(\)/.test(resolveSource)
    ? "yes" : "no", "yes");

/* -------------------------------------------- */

/*
 * Reserved: the one decision an automatic reaction still asks for.
 */
const decksSource = fs.readFileSync(path.join(root, "module/decks.mjs"), "utf8");
check("the flag exists", /export const RESERVED = "reserved"/.test(decksSource) ? "yes" : "no", "yes");
/*
 * It has to clear at the ONE chokepoint every card passes through. A reserved card that came back
 * from the discard still sideways would quietly erode a player's defence with nobody told -- which
 * is the kind of bug that is never reported, only misremembered.
 */
const moveBody = decksSource.slice(decksSource.indexOf("export async function move(from, to, ids)"),
  decksSource.indexOf("/* -------------------------------------------- */\n/*  Reserved"));
check("moving a card clears it",
  /flags\.cardrpg\.-=\$\{RESERVED\}/.test(moveBody) ? "yes" : "no", "yes");
/* A Wound "can't be played, not even for Brace" (core-rules 8), and Taint resolves when drawn. */
const upright = decksSource.slice(decksSource.indexOf("export function uprightCards"));
check("dead cards cannot react",
  /c\.type !== "wound" && c\.type !== "taint"/.test(upright) ? "yes" : "no", "yes");
check("reserved cards cannot react", /!isReserved\(c\)/.test(upright) ? "yes" : "no", "yes");
/* The tray's reaction row is the switch, not a readout and not a play. */
check("the tray's reaction row toggles reserved",
  /data-action="reserve"/.test(fs.readFileSync(path.join(root, "templates/tray.hbs"), "utf8"))
    ? "yes" : "no", "yes");
check("the tray counts what can still react",
  /upright: uprightCards\(actor\)\.length/.test(traySource) ? "yes" : "no", "yes");

/* -------------------------------------------- */

/*
 * The policy. Its threshold has to be the rules' own two events rather than tuned numbers, because
 * a tuned number in the resolver is a balance decision nobody declared.
 */
const policy = resolveSource.slice(resolveSource.indexOf("export function chooseReaction"),
  resolveSource.indexOf("async function spendReaction"));
check("the policy's threshold is a Wound",
  /CARDRPG\.defaults\.woundAt/.test(policy) ? "yes" : "no", "yes");
check("the policy's other threshold is being dropped",
  /incoming >= health/.test(policy) ? "yes" : "no", "yes");
/* Healing arrives after the blow, so it can never answer one that drops you (core-rules 8). */
check("a stopper cannot answer a lethal blow",
  /!lethal && heal > 0/.test(policy) ? "yes" : "no", "yes");
check("no tuned constants in the policy",
  /[^.\w](?:0\.\d|1\.\d|[2-9]\.\d)/.test(policy) ? "found one" : "none", "none");

/*
 * The two steps, in the order core-rules 3 gives them, and both AFTER the draw -- Parry fires on
 * being hit and Brace on taking damage, so a Miss costs the defender nothing.
 */
const attackBody = resolveSource.slice(resolveSource.indexOf("export async function resolveAttack"),
  resolveSource.indexOf("/** A reaction's name"));
const at = needle => attackBody.indexOf(needle);
check("the draw comes before any reaction",
  at("const fate = await drawFate") < at("await redirectHit") ? "yes" : "no", "yes");
check("redirection resolves before reduction",
  at("await redirectHit") < at("chooseReaction(") ? "yes" : "no", "yes");
check("a Miss is answered by nothing",
  /const guard = missed \? null : await redirectHit/.test(attackBody)
  && /\(missed \|\| guard\)\s*\?\s*null/.test(attackBody) ? "yes" : "no", "yes");
/* One reaction per trigger covers both steps: a Bodyguard that intercepted cannot also Brace. */
check("one reaction covers both steps",
  /\(missed \|\| guard\)/.test(attackBody) ? "yes" : "no", "yes");
/* A stopper is drunk once the blow has landed, which is what makes Use an alternative to reducing. */
check("a stopper is used after the damage",
  at('await taker.update(') < at('reaction?.key === "use"') ? "yes" : "no", "yes");
/* A reaction goes to the discard, never the Spent pile, whatever the card's halves cost. */
const spend = resolveSource.slice(resolveSource.indexOf("async function spendReaction"),
  resolveSource.indexOf("export async function redirectHit"));
check("a reaction is discarded, never Spent",
  /discardCards\(actor, \[choice\.card\.id\]\)/.test(spend) ? "yes" : "no", "yes");
/*
 * Automatic is not the same as hidden. Both halves of that: the reduction has to appear in the
 * arithmetic, and the card that paid for it has to be named -- a card spent out of a player's hand
 * with no line in the log is a card they will swear they still had.
 */
check("the reduction appears in the arithmetic",
  /row\.reaction\?\.reduce \? ` &minus; \$\{row\.reaction\.reduce\}/.test(resolveSource)
    ? "yes" : "no", "yes");
check("the card that reacted is named",
  /&mdash; <em>\$\{row\.reaction\.card\}<\/em> spent/.test(resolveSource) ? "yes" : "no", "yes");

/*
 * Sidestep's trigger is the one that is not a hit, so it needs a hook of its own -- and without one
 * the reaction goes back to being the word on a card it was before 30 October.
 */
check("an arrival fires it",
  /await answerArrival\(who, mover\)/.test(entry) ? "yes" : "no", "yes");
check("arriving means a new square out of reach",
  /!reach\(placed, now\) \|\| reach\(placed, from\)/.test(entry) ? "yes" : "no", "yes");
const stepBody = resolveSource.slice(resolveSource.indexOf("export async function sidestep"),
  resolveSource.indexOf("/**\n * Resolve an attack against one target"));
check("the square is random among the legal ones",
  /legal\[Math\.floor\(Math\.random\(\) \* legal\.length\)\]/.test(stepBody) ? "yes" : "no", "yes");
check("a step that stays in reach is not legal",
  /if \(away <= 1\) continue;/.test(stepBody) ? "yes" : "no", "yes");

/* -------------------------------------------- */

/* The rules have to say all of this, or the engine is the only place it is written. */
const coreRules = fs.readFileSync(path.join(root, "../../rules/core-rules.md"), "utf8");
const reactionsSection = /### Reactions\n([\s\S]*?)\n---/.exec(coreRules)?.[1] ?? "";
check("core-rules says reactions are automatic",
  /\*\*Reactions resolve by themselves\.\*\*/.test(reactionsSection) ? "yes" : "no", "yes");
check("core-rules says what a card turned sideways does",
  /\*\*A card turned sideways is reserved: it will not react\.\*\*/.test(reactionsSection)
    ? "yes" : "no", "yes");
check("core-rules states the threshold",
  /stops a \*\*Wound\*\*/.test(reactionsSection) && /stops you being \*\*dropped\*\*/.test(reactionsSection)
    ? "yes" : "no", "yes");
check("core-rules lists both triggers and only those",
  (reactionsSection.match(/\*\*you are hit\*\*|\*\*an enemy ends its move next to you\*\*/g) ?? []).length,
  2);
check("starter-cards gives Use a trigger",
  /\| \*\*Use\*\* \| You take damage \|/.test(fs.readFileSync(
    path.join(root, "../../rules/starter-cards.md"), "utf8")) ? "yes" : "no", "yes");
/* Section 11 held TWO Cover headings, giving two different rules, until this commit merged them. */
check("core-rules defines cover exactly once",
  (coreRules.match(/^### Cover$/gm) ?? []).length, 1);
check("core-rules defines the Sidestep square",
  /^### Sidestep$/m.test(coreRules) ? "yes" : "no", "yes");


/* -------------------------------------------- */

/*
 * The counter and the number: the only two reactions in way-cards 3 that the five keys could not
 * express. Both are carried as content (WAY_CARDS) rather than left as rules against nothing,
 * which is the state Bodyguard is still in.
 */

section("reactions: the counter, and the one that counts");

check("way cards carried", content.WAY_CARDS.map(c => c.name).join(", "),
  "Set Spear, Roll With It");
/*
 * And the reason they are the two: every OTHER reaction in that document's card pools is one of the
 * five keys. Parsed out of the ⚡ column, which is the fifth cell of each card row.
 */
const wayDoc = fs.readFileSync(path.join(root, "../../rules/way-cards.md"), "utf8");
/*
 * Only the card pools: a table whose header names the four columns a card has. Matching every wide
 * row instead caught the dispel table too, which has five columns of something else entirely.
 */
const poolRows = [];
for (const block of wayDoc.split(/\n\s*\n/)) {
  if (!/^\| Card \| .* \| Cost \|/m.test(block)) continue;
  for (const line of block.split("\n")) {
    if (!/^\| \*\*/.test(line)) continue;
    const cells = line.split("|");
    if (cells.length < 7) continue;
    poolRows.push({ name: cells[1].trim().replace(/\*/g, ""), cell: cells[4].trim() });
  }
}
const column = poolRows.filter(e => e.cell && e.cell !== "-" && e.cell !== "\u2013");
const bare = column.filter(e => reactionKeys.includes(e.cell.toLowerCase()) || e.cell === "Brace");
check("reaction cells in the card pools", column.length, 14);
check("cells that are a bare key", bare.length, 12);
const needKeys = column.filter(e => !bare.includes(e)).map(e => e.name);
check("cells no key could express", needKeys.join(", "), "Set Spear, Roll With It");
/* Which must be exactly the cards the engine carries, or the selection rule is a story. */
check("the carried cards are those cells",
  content.WAY_CARDS.map(c => c.name).sort().join(", ") === needKeys.slice().sort().join(", ")
    ? "yes" : "no", "yes");

/* The counter's requirement, and that the catalogue can actually meet it. */
const counterRule = reactionLines.find(r => r.key === "counter");
check("the counter needs reach", /needsReach: 2/.test(counterRule.body) ? "yes" : "no", "yes");
const reaching = slates.filter(i => (i.verbs?.strike?.reach ?? 1) >= 2);
check("weapons with reach", reaching.map(i => i.name).join(", "), "Halberd, Pike, Trident");
/*
 * Both ends of the band. The enemy arrives ADJACENT, which is the one square a Pike cannot hit --
 * "useless adjacent" was prose on its own card and is `reachMin` now, so the rule and the card
 * agree without anyone remembering to make them.
 */
const canCounter = reaching.filter(i => (i.verbs.strike.reachMin ?? 1) <= 1).map(i => i.name);
check("weapons that can counter", canCounter.join(", "), "Halberd, Trident");
check("weapons too long to counter",
  reaching.filter(i => (i.verbs.strike.reachMin ?? 1) > 1).map(i => i.name).join(", "), "Pike");
check("the resolver reads both ends",
  /\(strike\.reach \?\? 1\) >= \(rule\.needsReach \?\? 1\) && \(strike\.reachMin \?\? 1\) <= 1/
    .test(resolveSource) ? "yes" : "no", "yes");

/*
 * And the split itself: `range` meant "thrown this far" on a dagger and "reaches this far" on a
 * halberd, told apart only by the verb's own `text`. The reach weapons are out of that now, so the
 * three rules reading `range > 1` as "ranged attack" no longer mis-fire on them -- a halberd was
 * taking the ranged-in-melee disadvantage for being long. What is left is genuinely thrown.
 */
const reachDrift = slates.filter(i =>
  /reach \d/.test(i.verbs?.strike?.text ?? "") !== ((i.verbs?.strike?.reach ?? 1) >= 2))
  .map(i => i.name);
check("weapons whose reach text and field disagree",
  reachDrift.length ? reachDrift.join(", ") : "none", "none");
const stillConflated = slates
  .filter(i => (i.verbs?.strike?.range ?? 0) > 1 && i.tags?.includes("melee")).map(i => i.name);
check("melee weapons still carrying a range", stillConflated.join(", "),
  "Dagger, Spear, Balanced Dagger");
check("the conflation that is left is recorded as open",
  /\[OPEN\]\*\* \*\*A thrown weapon has two modes/.test(equipDoc) ? "yes" : "no", "yes");
/* And the catalogue table against the fields, the same test the `For` column and `ignores` get. */
const tableReach = [...equipDoc.matchAll(/^\| \*\*([^*]+)\*\* \|.*\*\*reach (\d)\*\*/gm)]
  .map(m => ({ name: m[1], reach: Number(m[2]) }));
check("weapons the catalogue says have reach",
  tableReach.map(e => `${e.name} ${e.reach}`).join(", "), "Halberd 2, Pike 3, Trident 2");
const tableDrift = tableReach
  .filter(e => (slates.find(i => i.name === e.name)?.verbs?.strike?.reach ?? 0) !== e.reach)
  .map(e => e.name);
check("weapons whose table reach and field disagree",
  tableDrift.length ? tableDrift.join(", ") : "none", "none");
check("core-rules says which reach weapons can counter",
  /a \*\*Halberd\*\* or a \*\*Trident\*\* counters and a \*\*Pike\*\*\s+does not/.test(coreRules)
    ? "yes" : "no", "yes");

/*
 * Flat, and no fate. This is the invariant that lets the automatic threshold be written down: a
 * threshold means nothing against a number nobody has drawn. It also cost a way-card its tactic.
 */
const counterBody = resolveSource.slice(resolveSource.indexOf("export async function counter("),
  resolveSource.indexOf("export async function answerArrival"));
check("the counter draws no fate",
  /drawFate/.test(counterBody) ? "it draws" : "flat", "flat");
check("no reaction draws fate",
  /drawFate/.test(resolveSource.slice(resolveSource.indexOf("/*  Reactions"),
    resolveSource.indexOf("export async function resolveAttack"))) ? "one draws" : "none", "none");
check("core-rules states it",
  /\*\*A reaction never draws fate\.\*\*/.test(coreRules) ? "yes" : "no", "yes");
check("core-rules says a reaction's damage is not a trigger",
  /\*\*A reaction's damage is not itself a trigger\.\*\*/.test(coreRules) ? "yes" : "no", "yes");
/* And the engine keeps that promise: the counter must not consult reactionsFor on its victim. */
check("nothing answers a counter",
  /reactionsFor/.test(counterBody) ? "it asks" : "nothing", "nothing");

/* The tactic that was written against the other model. */
check("the tactic no longer promises a reaction draw",
  /advantage\*\* on reactions/.test(wayDoc) ? "still there" : "rewritten", "rewritten");
check("and the rewrite is recorded",
  /written against a model the game does not use/.test(wayDoc) ? "yes" : "no", "yes");

/* The number, and the one reaction allowed to carry it. */
check("the schema carries a reaction param",
  /reactionParam: new fields\.NumberField/.test(cardsSource) ? "yes" : "no", "yes");
const valued = reactionLines.filter(r => /valued: true/.test(r.body)).map(r => r.key);
check("reactions that take a number", valued.join(", "), "sidestep");
const strayParam = carried
  .filter(c => c.reactionParam !== undefined && !valued.includes(c.reaction))
  .map(c => `${c.name}: ${c.reaction}`);
check("cards numbering a reaction that takes none",
  strayParam.length ? strayParam.join(", ") : "none", "none");
check("the step reads the number",
  /const span = Math\.max\(1, option\.param \?\? 1\)/.test(resolveSource) ? "yes" : "no", "yes");
/* A card's prose against its field, the same test every other pair in this file gets. */
const saidStep = carried.filter(c => /^Sidestep (\d+)/.exec(c.text ?? ""));
const stepDrift = saidStep
  .filter(c => Number(/^Sidestep (\d+)/.exec(c.text)[1]) !== c.reactionParam)
  .map(c => c.name);
check("cards whose step text and field disagree",
  stepDrift.length ? stepDrift.join(", ") : "none", "none");
check("core-rules allows a longer step",
  /\*\*One square, unless the card prints a number\.\*\*/.test(coreRules) ? "yes" : "no", "yes");
check("the redundant clause is recorded as open",
  /Roll With It's second clause is already the rule/.test(wayDoc) ? "yes" : "no", "yes");


/* -------------------------------------------- */

/*
 * The Wild fate card (core-rules 6, from ideas.md).
 *
 * Promised in five documents and absent from the schema, which meant Shadow Magic -- whose entire
 * price is "a permanent Wild card per formula" -- could not be priced. It is also the first special
 * that does NOT reshuffle, so it is the card that would have broken every place the "is this
 * special" test was written out by hand, and there were three of those.
 */

section("the Wild fate card, and the two numbers it could have broken");

const specialsBlock = configSource.slice(
  configSource.indexOf("CARDRPG.fateSpecials = {"),
  configSource.indexOf("CARDRPG.fateValueOf"));
const specials = [...specialsBlock.matchAll(/^  ([a-z]+): \{([^}]*)\}/gm)]
  .map(m => ({ key: m[1], body: m[2] }));
check("fate specials declared", specials.map(s => s.key).join(", "), "miss, crit, wild");
check("the old bare rank map is gone",
  /CARDRPG\.fateRank/.test(configSource) ? "still there" : "gone", "gone");

/* Every special needs all three properties, or one of the readers below falls back to a guess. */
const thin = specials.filter(s =>
  !/rank: /.test(s.body) || !/reshuffles: /.test(s.body) || !/swing: /.test(s.body)).map(s => s.key);
check("fate specials missing a property", thin.length ? thin.join(", ") : "none", "none");

/*
 * The two that reshuffle are the two that swing, and Wild is neither. This is the whole of what
 * keeps the 2/k readout true (hud-spec 4.2): exactly one Miss and one Critical between reshuffles.
 */
const reshufflers = specials.filter(s => /reshuffles: true/.test(s.body)).map(s => s.key);
check("fate specials that reshuffle", reshufflers.join(", "), "miss, crit");
const swings = specials.filter(s => /swing: true/.test(s.body)).map(s => s.key);
check("fate specials that are swings", swings.join(", "), "miss, crit");
check("Wild does not reshuffle",
  /reshuffles: false/.test(specials.find(s => s.key === "wild").body) ? "yes" : "no", "yes");
check("Wild is worth nothing either way",
  /rank: 0/.test(specials.find(s => s.key === "wild").body) ? "yes" : "no", "yes");

/* The card may actually be made, which is what five documents were promising. */
check("the schema allows every special",
  /choices: \[\.\.\.Object\.keys\(CARDRPG\.fateSpecials\), ""\]/.test(cardsSource) ? "yes" : "no", "yes");
check("a Wild resolves at its plain value",
  /if \(this\.special === "wild"\) return Math\.max\(0, value\);/.test(cardsSource) ? "yes" : "no", "yes");
check("and so does the live-data-free path",
  /if \(card\.system\.special === "wild"\) return Math\.max\(0, value\);/.test(decksSource)
    ? "yes" : "no", "yes");

/*
 * The triplication. "Is this card special" was written out in three files with three chances to
 * disagree, and a card that is special without reshuffling is exactly what would have exposed that.
 */
const combatSource = fs.readFileSync(path.join(root, "module/combat.mjs"), "utf8");
for (const [name, src] of [["decks", decksSource], ["combat", combatSource]]) {
  check(`${name} reshuffles from the config`,
    /drawn\.some\(c => CARDRPG\.fateSpecials\[c\.system\.special\]\?\.reshuffles\)/.test(src)
      ? "yes" : "no", "yes");
  check(`${name} ranks from the config`,
    /CARDRPG\.fateValueOf/.test(src) ? "yes" : "no", "yes");
}
check("the data model reshuffles from the config",
  /CARDRPG\.fateSpecials\[this\.special\]\?\.reshuffles/.test(cardsSource) ? "yes" : "no", "yes");
/*
 * Nowhere may ask whether the card is special and MEAN "does it reshuffle" -- which is the exact
 * shape all three files used before Wild. Asking whether it is special to choose between a rank
 * lookup and a plain value is fine and is what `rank` still does; this is only about the reshuffle.
 */
const loose = [["decks", decksSource], ["combat", combatSource], ["cards", cardsSource]]
  .filter(([, src]) =>
    /some\(c => c\.system\.special\)/.test(src) || /reshuffles\(\) \{\s*return !!this\.special/.test(src))
  .map(([name]) => name);
check("files deciding a reshuffle from bare specialness",
  loose.length ? loose.join(", ") : "none", "none");

/* One insertion path, because there are two reasons to insert and they differ in one field. */
check("one path puts a card into a fate deck",
  /export async function addFateCards/.test(decksSource) ? "yes" : "no", "yes");
check("Blessed and Cursed use it",
  /await addFateCards\(target, \{ special: fateCard, temporary: true \}\)/.test(resolveSource)
    ? "yes" : "no", "yes");
check("nothing builds a fate card by hand any more",
  /createEmbeddedDocuments\("Card", \[\{\s*name: fateCard/.test(resolveSource) ? "still does" : "none",
  "none");

/* A Wild is a question for the table, so every draw path has to say it was drawn -- not each caller. */
check("a Wild is announced where fate is drawn",
  /const wilds = drawn\.filter\(c => c\.system\.special === "wild"\)\.length/.test(decksSource)
    ? "yes" : "no", "yes");
/* And the chat card names a special from config, so a fourth needs no case there. */
check("the chat card names the special from config",
  /CARDRPG\.fateSpecials\[special\]\?\.label/.test(resolveSource) ? "yes" : "no", "yes");

/*
 * The number a permanent card breaks. The fate bar divided by a hardcoded 20, so one Wild read as
 * over 100% -- the kind of bug that only appears once the thing it assumed stops being true.
 */
check("the fate bar counts the real deck",
  /\/ Math\.max\(1, fateTotal\)/.test(traySource) ? "yes" : "no", "yes");
check("the fate bar no longer assumes twenty",
  /\(counts\.fate \?\? 0\) \/ 20/.test(traySource) ? "still does" : "no", "no");
check("the printed deck is still twenty", fate.length, 20);

/* The rules have to carry all of it, including why the readout survives. */
check("core-rules documents the Wild",
  /^#### Wild$/m.test(coreRules) ? "yes" : "no", "yes");
check("core-rules says it does not reshuffle",
  /\| reshuffles the deck \| \*\*yes\*\* \| \*\*no\*\* \|/.test(coreRules) ? "yes" : "no", "yes");
check("core-rules explains the readout survives",
  /joins the `k` and never the `2`/.test(coreRules) ? "yes" : "no", "yes");
check("ideas.md records what is built and what is not",
  /\*\*The Wild card itself is now a rule:\*\*/.test(
    fs.readFileSync(path.join(root, "../../rules/ideas.md"), "utf8")) ? "yes" : "no", "yes");
const specDoc = fs.readFileSync(path.join(root, "../../rules/specializations.md"), "utf8");
// Per CAST, not per formula: the more a shadow mage reaches, the less they can predict themselves.
check("the school prices itself per cast",
  /A \*\*Wild card per spell cast\*\*, until you sleep/.test(specDoc) ? "yes" : "no", "yes");
check("nothing producing one is recorded as open",
  /\[OPEN\]\*\* \*\*Nothing in play produces a Wild yet/.test(equipDoc) ? "yes" : "no", "yes");

/*
 * Searching the discard: refused in general, and left open to ONE owner by name. Catch Breath's
 * randomness is load-bearing -- a deck you can search is a deck with no weak cards in it.
 */
check("core-rules still refuses a general discard search",
  /\*\*Nothing general will ever let you\s+search your discard\*\*/.test(coreRules) ? "yes" : "no", "yes");
check("and names the price a specific one must pay",
  /\*\*But a named thing may\.\*\*/.test(coreRules) ? "yes" : "no", "yes");
/*
 * It has owners now, and what keeps seven of them from being one trick is the SHAPE of each reach,
 * not the fact of it -- plus a depth rule: a combo early, a free choice only deep in a branch.
 */
check("the discard reach has named owners",
  /\*\*Seven nodes get it, and none of them the same way\.\*\*/.test(coreRules) ? "yes" : "no", "yes");
check("and choice is reserved for the deep cards",
  /\*\*Direct choice is reserved for the deep cards\*\*/.test(coreRules) ? "yes" : "no", "yes");


/* -------------------------------------------- */

/*
 * The Way of Mind cluster: the Wild Magic deck, the elements, and the price every Shadow spell pays.
 */

section("Wild Magic, and the element a Signature was already assuming");

/* The condition vocabulary, read from source, so a surge cannot promise one that does not exist. */
const conditionKeys = [...configSource
  .slice(configSource.indexOf("CARDRPG.conditions = {"), configSource.indexOf("CARDRPG.shakeable"))
  .matchAll(/^  ([a-zA-Z]+): /gm)].map(m => m[1]);
check("condition vocabulary read from source", conditionKeys.length >= 20, true);

/* The deck's shape is a design claim -- "a slight edge to the good" -- so it is countable. */
const wildCards = content.WILD_MAGIC;
const copies = t => wildCards.filter(c => c.turn === t).reduce((n, c) => n + (c.copies ?? 1), 0);
check("Wild Magic deck size", wildCards.reduce((n, c) => n + (c.copies ?? 1), 0), 12);
check("good, bad and both", `${copies("good")}, ${copies("bad")}, ${copies("both")}`, "5, 4, 3");
check("the edge goes to the good", copies("good") > copies("bad") ? "yes" : "no", "yes");
const strayTurn = wildCards.filter(c => !["good", "bad", "both"].includes(c.turn)).map(c => c.name);
check("surges with no verdict", strayTurn.length ? strayTurn.join(", ") : "none", "none");
/* Every surge must do something: steps the engine can land, or words the table resolves. */
const emptySurge = wildCards.filter(c => !(c.steps ?? []).length && !c.text).map(c => c.name);
check("surges that do nothing", emptySurge.length ? emptySurge.join(", ") : "none", "none");
const stepSurges = wildCards.filter(c => (c.steps ?? []).length).length;
check("surges the engine resolves itself", stepSurges, 7);
/* A surge's condition has to exist, or it is a word on a card. */
const strayCond = wildCards.flatMap(c => (c.steps ?? [])
  .filter(s => s.condition && !conditionKeys.includes(s.condition))
  .map(s => `${c.name}: ${s.condition}`));
check("surges naming a condition that does not exist",
  strayCond.length ? strayCond.join(", ") : "none", "none");

/* The deck is reachable: the card type exists, the world builds it, and a Wild draw deals from it. */
check("the card subtype is registered",
  /wild: WildCardData/.test(entry) ? "yes" : "no", "yes");
const setupSource = fs.readFileSync(path.join(root, "module/setup.mjs"), "utf8");
check("the world builds the deck",
  /makeCards\("Wild Magic", "deck", "wild\.deck"/.test(setupSource) ? "yes" : "no", "yes");
check("a Wild draw deals a surge",
  /for \(let i = 0; i < wilds; i\+\+\) await drawWildMagic\(actor\)/.test(decksSource) ? "yes" : "no", "yes");
check("and says so when the world has no such deck",
  /No Wild Magic deck in this world/.test(decksSource) ? "yes" : "no", "yes");

/* -------------------------------------------- */

/*
 * The elements. "A line of your element" is written twice in way-cards and nothing granted one --
 * the same shape as `ignores N armor` and `reach`, in a Signature rather than on an item.
 */
const elementBlock = configSource.slice(configSource.indexOf("CARDRPG.elements = {"),
  configSource.indexOf("CARDRPG.ways"));
const elements = [...elementBlock.matchAll(/^  ([a-z]+): \{/gm)].map(m => m[1]);
check("elements declared", elements.join(", "), "fire, frost, storm, water");
const strayElementCond = [...elementBlock.matchAll(/condition: "([a-zA-Z]+)"/g)]
  .map(m => m[1]).filter(k => !conditionKeys.includes(k));
check("elements naming a condition that does not exist",
  strayElementCond.length ? strayElementCond.join(", ") : "none", "none");
check("the spell slate carries one",
  /element: new fields\.StringField/.test(itemSource) ? "yes" : "no", "yes");

/* Every elemental formula has an element, and nothing else does. */
const elemental = content.FORMULAS.filter(f => f.source === "Elemental Magic");
check("elemental formulas", elemental.length, 4);
const elementless = elemental.filter(f => !f.element).map(f => f.name);
check("elemental formulas with no element",
  elementless.length ? elementless.join(", ") : "none", "none");
const strayElement = [...elemental, ...content.SHADOW_FORMULAS]
  .filter(f => f.element && !elements.includes(f.element)).map(f => `${f.name}: ${f.element}`);
check("formulas naming an element that does not exist",
  strayElement.length ? strayElement.join(", ") : "none", "none");
const wrongSchool = content.SHADOW_FORMULAS.filter(f => f.element).map(f => f.name);
check("non-elemental formulas carrying an element",
  wrongSchool.length ? wrongSchool.join(", ") : "none", "none");
/* And the promise the field answers is still in the document that made it. */
const wayDocEl = fs.readFileSync(path.join(root, "../../rules/way-cards.md"), "utf8");
check("way-cards still says 'your element'",
  (wayDocEl.match(/your element/g) ?? []).length, 3);
check("the exclusivity is recorded, and reuses the faith group",
  /`exclusive: "element"` with the element as the[\s\S]{0,4}`creed`/.test(specDoc) ? "yes" : "no", "yes");

/* -------------------------------------------- */

/* What every Shadow spell costs, as a field rather than a sentence. */
check("the spell slate carries a Wild price",
  /wilds: new fields\.NumberField/.test(itemSource) ? "yes" : "no", "yes");
check("Shadow formulas pay it",
  content.SHADOW_FORMULAS.filter(f => (f.wilds ?? 0) > 0).map(f => f.name).join(", "),
  "Step Through");
const freeShadow = content.SHADOW_FORMULAS.filter(f => !(f.wilds > 0)).map(f => f.name);
check("Shadow formulas that pay nothing", freeShadow.length ? freeShadow.join(", ") : "none", "none");
/* No other school may pay in Wilds, or the price stops being the school's. */
const otherWilds = content.FORMULAS.filter(f => (f.wilds ?? 0) > 0).map(f => f.name);
check("other schools paying in Wilds", otherWilds.length ? otherWilds.join(", ") : "none", "none");
check("core-rules prices it per cast",
  /\*\*every Shadow Magic\s+spell puts one in your deck\*\*/.test(coreRules) ? "yes" : "no", "yes");
check("core-rules says why the good edge is not a discount",
  /dilutes the Miss and the Critical \*\*equally\*\*/.test(coreRules) ? "yes" : "no", "yes");

/*
 * And the duplicate-key sweep, which this commit needed: `CARDRPG.Fate.Miss` was in en.json twice
 * after the Wild work, because JSON.parse keeps the last of a pair in silence -- the same failure
 * mode as a Foundry schema dropping an unknown key, in the one file the i18n checks all read.
 */
const langLines = fs.readFileSync(path.join(root, "lang/en.json"), "utf8");
const langKeys = [...langLines.matchAll(/^\s*"([^"]+)":/gm)].map(m => m[1]);
const dupes = langKeys.filter((k, i) => langKeys.indexOf(k) !== i);
check("duplicate i18n keys", dupes.length ? [...new Set(dupes)].join(", ") : "none", "none");

/* -------------------------------------------- */

/*
 * The levelling graph's cross edges (leveling 1). Two Ways print their nodes as trees with the
 * (axis / resource) cell beside each, and five cross edges are proposed in tables beside them. The
 * cell test is arithmetic on those same cells -- an edge must match its source on EXACTLY one half,
 * and join nodes of the same tier -- so the proposal is checkable rather than asserted.
 *
 * Everything here is parsed out of the document. A cell edited in the tree and not in the edge
 * table is the failure this section exists to catch.
 */

section("the levelling graph: cross edges obey the cell test");

function parseTree(doc, rootName) {
  const start = doc.indexOf("  " + rootName + " ");
  const block = doc.slice(start, doc.indexOf("```", start));
  const nodes = new Map();
  const stack = [];
  for (const line of block.split("\n")) {
    const m = line.match(/^([ │├└─]*?)([A-Z][A-Z \-]*[A-Z])\s+\(([^/]+?)\s*\/\s*([^)]+?)\)\s*$/);
    if (!m) continue;
    const tier = (m[1].length - 2) / 3;
    const node = {
      name: m[2].trim().toLowerCase(), tier,
      axis: m[3].trim(), resource: m[4].trim(),
      parent: tier >= 1 ? stack[tier - 1].name : null
    };
    stack[tier] = node;
    /* A node's branch is the tier-1 ancestor it hangs off: the Way root is its own. */
    node.branch = tier === 0 ? node.name : stack[1].name;
    nodes.set(node.name, node);
  }
  return nodes;
}

const trees = {
  shade: parseTree(specDoc, "SHADE"),
  strength: parseTree(specDoc, "STRENGTH"),
  mind: parseTree(specDoc, "MIND")
};
check("Way of Shade tree parses", trees.shade.size, 13);
check("Way of Strength tree parses", trees.strength.size, 13);
check("Way of Mind tree parses", trees.mind.size, 13);
const allNodes = new Map([...trees.shade, ...trees.strength, ...trees.mind]);

/* The five drafted edges, read from the tables that propose them. */
const drafted = [...specDoc.matchAll(
  /^\| \*\*([A-Za-z\- ]+?) → ([A-Za-z\- ]+?)\*\* \| (axis|resource), \*([^*]+)\* \|/gm)]
  .map(m => ({ from: m[1].toLowerCase(), to: m[2].toLowerCase(), half: m[3], named: m[4].trim() }));
check("cross edges proposed", drafted.map(e => `${e.from}>${e.to}`).join(" "),
  "cutpurse>gambler burglar>trapmaker burglar>acrobat guardian>bodyguard ironclad>berserker");

/* The test itself: exactly one half, the declared half is the one that matches, same tier, and
 * different branches -- an edge inside one branch is a lattice and is not written here. */
const halves = (a, b) => ({ axis: a.axis === b.axis, resource: a.resource === b.resource });
const faults = [];
for (const e of drafted) {
  const a = allNodes.get(e.from), b = allNodes.get(e.to);
  if (!a || !b) { faults.push(`${e.from}/${e.to}: not in any tree`); continue; }
  const h = halves(a, b);
  const n = (h.axis ? 1 : 0) + (h.resource ? 1 : 0);
  if (n !== 1) faults.push(`${e.from}>${e.to}: ${n} halves match, not 1`);
  else if (!h[e.half]) faults.push(`${e.from}>${e.to}: declared ${e.half}, matches the other half`);
  else if ((e.half === "axis" ? a.axis : a.resource) !== e.named)
    faults.push(`${e.from}>${e.to}: names "${e.named}", cell says "${e.half === "axis" ? a.axis : a.resource}"`);
  if (a.tier !== b.tier) faults.push(`${e.from}>${e.to}: tier ${a.tier} to ${b.tier}, not sideways`);
  if (a.branch === b.branch) faults.push(`${e.from}>${e.to}: same branch, so not a cross edge`);
}
check("cross edges failing the test", faults.length ? faults.join("; ") : "none", "none");

/*
 * Completeness: the test permits a fixed set of pairs, and the document claims to have considered
 * all of them -- three taken and three declined in Shade, two and two in Strength. Enumerate.
 * Tier 1 is skipped because those nodes already share the Way root; an edge between them is nothing.
 */
/*
 * Multi-word school names forced this to grow: *Divination ↔ Household Magic* is one pair, and a
 * pattern matching a single capitalised word read it as *Divination ↔ Household* and left the real
 * pair unaccounted. Each name is now one or more capitalised words, which stops at the first
 * lowercase one -- the "and" and "on" that join these sentences.
 */
const NAME = "[A-Z][A-Za-z\\-]*(?: [A-Z][A-Za-z\\-]*)*";
const declined = [...specDoc.matchAll(new RegExp(`(${NAME}) ↔ (${NAME})`, "g"))]
  .map(m => [m[1].toLowerCase(), m[2].toLowerCase()]);
check("cross edges named and declined", declined.length, 8);

const key = (x, y) => [x, y].sort().join("+");
const accounted = new Set([...drafted.map(e => key(e.from, e.to)), ...declined.map(d => key(...d))]);
const unconsidered = [];
for (const tree of Object.values(trees)) {
  const deep = [...tree.values()].filter(n => n.tier >= 2);
  for (const a of deep) for (const b of deep) {
    if (a.name >= b.name || a.branch === b.branch) continue;
    const h = halves(a, b);
    if ((h.axis ? 1 : 0) + (h.resource ? 1 : 0) !== 1) continue;
    if (!accounted.has(key(a.name, b.name))) unconsidered.push(`${a.name}/${b.name}`);
  }
}
check("legal pairs the document never mentions",
  unconsidered.length ? unconsidered.join(", ") : "none", "none");
/* And the other direction: a declined pair the test would have refused anyway is not a decision. */
const idleDeclines = declined.filter(([x, y]) => {
  const a = allNodes.get(x), b = allNodes.get(y);
  if (!a || !b) return true;
  const h = halves(a, b);
  return (h.axis ? 1 : 0) + (h.resource ? 1 : 0) !== 1;
}).map(d => d.join("/"));
check("declined pairs the test already refused",
  idleDeclines.length ? idleDeclines.join(", ") : "none", "none");

/*
 * The sibling rule, computed over ALL predecessors rather than a parent pointer -- which is the
 * thing leveling 1 warns cross edges change. Siblings must differ on BOTH halves, the strict form
 * both trees claim to satisfy.
 */
const successors = new Map();
for (const n of allNodes.values()) {
  if (n.parent) (successors.get(n.parent) ?? successors.set(n.parent, []).get(n.parent)).push(n.name);
}
for (const e of drafted) (successors.get(e.from) ?? successors.set(e.from, []).get(e.from)).push(e.to);
const collisions = [];
for (const [parent, kids] of successors) {
  for (const x of kids) for (const y of kids) {
    if (x >= y) continue;
    const h = halves(allNodes.get(x), allNodes.get(y));
    if (h.axis || h.resource) collisions.push(`${parent}: ${x}/${y}`);
  }
}
check("sibling sets over all predecessors", collisions.length ? collisions.join(", ") : "none", "none");
/* A parse that found no siblings at all would pass the line above while checking nothing. */
check("sibling pairs actually compared",
  [...successors.values()].reduce((n, k) => n + (k.length * (k.length - 1)) / 2, 0) >= 20, true);

/* -------------------------------------------- */

/* The rules the graph will be built to, as decisions rather than habits. */
const levDoc = fs.readFileSync(path.join(root, "../../rules/leveling.md"), "utf8");
check("leveling sets the pool-to-bespoke ratio",
  /\*\*The pool is the default; about one minor node in three is bespoke\.\*\*/.test(levDoc)
    ? "yes" : "no", "yes");
check("and way-cards carries the same ratio",
  /\*\*Two minor nodes in three draw from a pool; the third is bespoke\*\*/.test(wayDocEl)
    ? "yes" : "no", "yes");
check("a cross edge may not pass a title",
  /A cross edge to a title is cheap; a cross edge past one is the leak/.test(levDoc) ? "yes" : "no",
  "yes");
check("cross edges go sideways, not up",
  /\*\*Sideways, not up\.\*\*/.test(levDoc) ? "yes" : "no", "yes");
check("the laundering case is recorded",
  /an exclusive node must dominate everything behind it/i.test(levDoc) ? "yes" : "no", "yes");
check("and the all-prerequisites flag is what enforces it",
  /dominance\*\* invariant leans on it too: the flag is the only thing that stops a cross\s+edge/
    .test(levDoc) ? "yes" : "no", "yes");
check("Way of Faith admits no cross edge",
  /\| \*\*Faith\*\* \| \*\*None\*\* \|/.test(levDoc) ? "yes" : "no", "yes");
check("Mind and Faith are stringent in different ways",
  /\*\*Mind and Faith differ in kind, not degree\.\*\*/.test(levDoc) ? "yes" : "no", "yes");

/* -------------------------------------------- */

/*
 * The graph as data (leveling 8: "the graph needs validating, not just loading"). Everything above
 * checked the documents against each other; this checks the node content, and then checks the node
 * content against the document that specifies it.
 */

section("the levelling graph as data");

const graph = await import("../module/graph.mjs");
const graphSource = fs.readFileSync(path.join(root, "module/graph.mjs"), "utf8");
const nodes = content.NODES;
const byId = graph.GRAPH;

check("nodes defined", nodes.length, 169);
check("duplicate node ids", nodes.length === byId.size ? "none" : "yes", "none");

/* Every prerequisite must resolve, or a branch is silently unreachable. */
const danglers = nodes.flatMap(n => (n.after ?? [])
  .filter(a => !byId.has(a)).map(a => `${n.id} -> ${a}`));
check("prerequisites that do not resolve", danglers.length ? danglers.join(", ") : "none", "none");

/* Exactly one root, and every node reachable from it. */
const roots = nodes.filter(n => !(n.after ?? []).length).map(n => n.id);
check("roots", roots.join(", "), "root");
const fromRoot = graph.reachable(new Set([graph.ROOT]));
const orphans = nodes.filter(n => !fromRoot.has(n.id)).map(n => n.id);
check("nodes unreachable from the root", orphans.length ? orphans.join(", ") : "none", "none");

/* Acyclic. A cycle makes `after` unsatisfiable and DEPTH meaningless, and it is easy to author. */
const cycles = [];
(function detect() {
  const colour = new Map();
  const walk = (id, path) => {
    if (colour.get(id) === "done") return;
    if (colour.get(id) === "open") { cycles.push([...path, id].join(" -> ")); return; }
    colour.set(id, "open");
    for (const a of byId.get(id)?.after ?? []) walk(a, [...path, id]);
    colour.set(id, "done");
  };
  for (const n of nodes) walk(n.id, []);
})();
check("cycles", cycles.length ? cycles.join("; ") : "none", "none");

/* -------------------------------------------- */

/*
 * The sibling rule (specializations 3, leveling 5a.1), computed over ALL predecessors because the
 * graph has cross edges. Majors only: a cell is a major node's property, and minors have none.
 *
 * The hard rule is the one the document states -- no two siblings in the same CELL. The strict form
 * both trees claim, differing on both halves, is a warning here, which is how the documents
 * themselves treat it ("two repeats are left in, deliberately").
 */
const cellOf = n => `${n.axis ?? "?"} / ${n.resource ?? "?"}`;
const sameCell = [];
const sameHalf = [];
for (const parent of nodes) {
  const kids = (graph.SUCCESSORS.get(parent.id) ?? []).map(id => byId.get(id)).filter(n => n?.title);
  for (const a of kids) for (const b of kids) {
    if (a.id >= b.id) continue;
    if (cellOf(a) === cellOf(b)) sameCell.push(`${parent.id}: ${a.id}/${b.id} (${cellOf(a)})`);
    else if (a.axis === b.axis || a.resource === b.resource) sameHalf.push(`${a.id}/${b.id}`);
  }
}
check("major siblings sharing a cell", sameCell.length ? sameCell.join("; ") : "none", "none");
/*
 * **Twelve siblings cannot lean on seven axes without repeating**, and the pigeonhole principle
 * says so before anyone writes a word -- so Way of Faith breaks the strict form of the writing rule
 * on purpose, and specializations.md says why: *the gods do not differ in what they push, they
 * differ in what they take.* Twelve different resources, so all twelve cells are still distinct.
 * The six pairs below share an axis and nothing else, and the hard rule above -- no two siblings in
 * one CELL -- still holds everywhere.
 */
check("major siblings sharing one half (warning)",
  sameHalf.length ? sameHalf.join(", ") : "none",
  "shade/strength, faith.eternalgod/faith.fagar, faith.eternalgod/faith.purple, "
  + "faith.eternalspirit/faith.grey, faith.fagar/faith.purple, faith.vulpet/faith.yellow, "
  + "faith.brendan/faith.sessyfyn");

/* -------------------------------------------- */

/*
 * Cross edges. A node with more than one predecessor is reached more than one way; the shallowest
 * route is the branch's own and anything deeper is a crossing. Three rules apply to a crossing, and
 * all three are leveling 1:
 *
 *   - it arrives AT A TITLE, never past one into another branch's minor nodes
 *   - it is not a shortcut: the crossing route is no shorter than the branch's own
 *   - the cells match on exactly one half
 */
const crossFaults = [];
let crossings = 0;
for (const node of nodes) {
  const after = node.after ?? [];
  /* An `all` node's predecessors are requirements, not alternative routes, so none of them is a
   * crossing -- reading them as one would ask the cell test a question it cannot answer. */
  if (after.length < 2 || node.all) continue;
  const depth = id => graph.DEPTH.get(id) ?? 0;
  const primary = after.reduce((a, b) => (depth(a) <= depth(b) ? a : b));
  for (const prereq of after) {
    if (prereq === primary) continue;
    crossings++;
    if (!node.title) crossFaults.push(`${prereq} -> ${node.id}: arrives past a title`);
    if (depth(prereq) < depth(primary)) {
      crossFaults.push(`${prereq} -> ${node.id}: shorter than the branch's own route`);
    }
    /* The crossing's own source is the last major before it, which is what the cell test compares. */
    let src = prereq;
    const seen = new Set();
    while (src && !byId.get(src)?.title && !seen.has(src)) {
      seen.add(src);
      src = (byId.get(src)?.after ?? [])[0];
    }
    const from = byId.get(src);
    if (!from?.title) { crossFaults.push(`${prereq} -> ${node.id}: no major node behind it`); continue; }
    const halves = (from.axis === node.axis ? 1 : 0) + (from.resource === node.resource ? 1 : 0);
    if (halves !== 1) {
      crossFaults.push(`${from.id} -> ${node.id}: ${halves} halves match, not 1`);
    }
  }
}
check("crossings in the data", crossings, 5);
check("crossings breaking a rule", crossFaults.length ? crossFaults.join("; ") : "none", "none");

/* -------------------------------------------- */

/*
 * Dominance (leveling 1): everything behind an exclusive node must require that node, or a cross
 * edge hands out what the exclusive choice closed. Nothing in the data is exclusive yet -- Way of
 * Faith's twelve gods are not built -- so this is a check waiting for content rather than one
 * finding a fault, and it is written now because it is the rule a cross edge can break silently.
 */
const exclusiveGates = nodes.filter(n => n.exclusive).map(n => n.id);
const laundered = [];
for (const gate of exclusiveGates) {
  const without = graph.reachable(new Set([graph.ROOT]), new Set([gate]));
  const behind = nodes.filter(n => n.id !== gate
    && graph.reachable(new Set([graph.ROOT, gate])).has(n.id) && !without.has(n.id));
  for (const n of behind) {
    if (!(n.after ?? []).length) continue;
    /* Reachable with the gate, unreachable without it: that is what dominance means. */
    if (without.has(n.id)) laundered.push(`${n.id} bypasses ${gate}`);
  }
}
/*
 * **Twelve gates, and they are the first content `exclusive` has ever had.** The family/creed rule
 * was written for Way of Faith and sat built and unused until the Way existed; the religion is the
 * group, so taking a god closes every god of every OTHER religion and leaves your own open.
 */
check("exclusive gates in the data", exclusiveGates.length, 12);
check("subgraphs that bypass their gate", laundered.length ? laundered.join(", ") : "none", "none");
/* Every gate is a god, and every god is a gate: a Faith title without one would be a free door. */
const unsworn = nodes.filter(n => n.title && n.id.startsWith("faith.") && !n.exclusive)
  .map(n => n.id);
check("Faith titles that are not exclusive", unsworn.length ? unsworn.join(", ") : "none", "none");
const strayGates = nodes.filter(n => n.exclusive && !n.id.startsWith("faith."))
  .map(n => n.id);
check("exclusive nodes outside Way of Faith",
  strayGates.length ? strayGates.join(", ") : "none", "none");
/* Six religions, and their sizes are what makes a lone god lone (specializations.md). */
const religions = new Map();
for (const god of nodes.filter(n => n.exclusive === "faith")) {
  religions.set(god.creed, (religions.get(god.creed) ?? 0) + 1);
}
check("religions, by how many gods they hold",
  [...religions.entries()].sort().map(([c, n]) => `${c}:${n}`).join(" "),
  "eternal-god:1 eternal-spirit:1 first:1 five:5 grey:3 vax:1");

/*
 * **A religion's size is its price**, which is a content constraint and therefore checkable: serve
 * a pantheon and you may add its other gods later, a level each, going wider; serve a lone god and
 * you never will, so a lone god's branch runs deeper by as many nodes as the biggest pantheon has
 * spare doors. The Five has four spare, so a lone god runs four nodes past a pantheon god's two.
 */
const runLength = id => {
  let n = 0;
  let here = graph.SUCCESSORS.get(id) ?? [];
  while (here.length) {
    n += 1;
    here = graph.SUCCESSORS.get(here[0]) ?? [];
  }
  return n;
};
const runs = new Map();
for (const god of nodes.filter(n => n.exclusive === "faith")) {
  const alone = religions.get(god.creed) === 1;
  const key = alone ? "a lone god" : "a pantheon god";
  const len = runLength(god.id);
  if (runs.has(key) && runs.get(key) !== len) runs.set(key, `${runs.get(key)} and ${len}`);
  else runs.set(key, len);
}
check("nodes behind a pantheon god", runs.get("a pantheon god"), 2);
check("and behind a lone god", runs.get("a lone god"), 6);
check("the difference, against The Five's spare doors",
  runs.get("a lone god") - runs.get("a pantheon god"), religions.get("five") - 1);

/* -------------------------------------------- */

/*
 * What a priest ends up with, asked of the engine. The exclusive machinery has existed since
 * leveling.md 3 was written and nothing exercised it until now, so these are the first checks on
 * it that use real content rather than a hand-built example.
 */

section("Way of Faith: swearing, and what it shuts");

const trunk = ["root", "faith", "faith.vows", "faith.pilgrimage", "faith.calling"];
const toValtor = new Set([...trunk, "faith.valtor"]);
const closedToValtor = graph.closedIds(toValtor);

/* The Five stays open; everything else is gone for good. */
check("gods still open to a Valtor devotee",
  nodes.filter(n => n.exclusive === "faith" && !closedToValtor.has(n.id))
    .map(n => n.name).sort().join(", "),
  "Brendan, Fagar, Sessyfyn, Valtor, Vulpet");
check("and how many gods are shut", closedToValtor.size, 7);
/* And their branches go with them: a closed node takes everything only it could reach (leveling 3). */
const liveForValtor = graph.reachable(toValtor, closedToValtor);
check("Grey nodes still reachable",
  nodes.filter(n => n.id.startsWith("faith.grey") && liveForValtor.has(n.id)).length, 0);
check("but Sessyfyn and her two nodes are still there",
  nodes.filter(n => n.id.startsWith("faith.sess") && liveForValtor.has(n.id)).length, 3);

/* A lone god shuts the lot, which is what makes the gift worth a closed door. */
const toVax = new Set([...trunk, "faith.vax"]);
check("gods still open to a priest of Vax",
  nodes.filter(n => n.exclusive === "faith" && !graph.closedIds(toVax).has(n.id))
    .map(n => n.name).join(", "), "Vax");
/* The warning the pane prints before an irreversible level: it has to name the whole cost. */
/* Eleven gods and everything behind them: the dearest single level in the game. */
check("what swearing to Vax would close",
  graph.wouldClose("faith.vax", new Set(trunk)).length, 45);

/*
 * **The tie Way of Faith created.** Twelve gods are siblings at one depth, so a devotee of two of
 * The Five owns two titles exactly as deep as each other -- a case three Ways never produced and
 * the rules never addressed. It is settled by the order the nodes were taken, which `system.nodes`
 * already records because it is an array: your FIRST vow is the one that names you.
 */
const valtorThenSessyfyn = new Set([...trunk, "faith.valtor", "faith.sessyfyn"]);
const sessyfynThenValtor = new Set([...trunk, "faith.sessyfyn", "faith.valtor"]);
check("two gods, equal depth, first sworn names you",
  graph.titleOf(valtorThenSessyfyn), "Valtor");
check("and the other order gives the other", graph.titleOf(sessyfynThenValtor), "Sessyfyn");
check("the Tactic follows the same title, not a second vote",
  graph.tacticOf(valtorThenSessyfyn).name, "The Drum Does Not Stop");
/* A deeper title still wins outright: the tie-break only ever decides an exact tie. */
check("depth still beats order where there is depth",
  graph.titleOf(new Set(["root", "shade", "shade.footwork", "shade.quiet", "shade.patience",
    "shade.thief", "shade.thief.crowds", "shade.thief.fence", "shade.cutpurse"])), "Cutpurse");

/*
 * The Obedience, which is a Tactic's opposite number: one Tactic ever, but every god's obedience.
 */
check("a devotee of two gods pays two obediences", graph.termsOf(valtorThenSessyfyn).length, 2);
check("and has one Tactic between them",
  graph.tacticOf(valtorThenSessyfyn) ? 1 : 0, 1);
check("every god states one",
  nodes.filter(n => n.exclusive === "faith" && !n.obedience).map(n => n.id).join(", ") || "none",
  "none");
/* A gift is what a closed door buys, so only the four lone gods carry one. */
check("gods carrying a rule-bending gift",
  nodes.filter(n => n.gift).map(n => n.name).sort().join(", "),
  "The Eternal God, The Eternal Spirit, The First, Vax");
check("and each of those is alone in its religion",
  nodes.filter(n => n.gift).every(n => religions.get(n.creed) === 1), true);

/*
 * The cap, which is the only grant in the game that is not addition. A priest of The First who
 * walks their whole branch is granted no slots by it at all, so the cap is doing the work: two from
 * the Way root, and three is where it stops however much else is taken.
 */
const firstWhole = new Set([...trunk, "faith.first", "faith.first.debt", "faith.first.watch",
  "faith.first.narrow", "faith.first.blood", "faith.first.rest", "faith.first.echterhof"]);
check("The First's slot cap", graph.grantsOf(firstWhole).slotCap, 3);
/*
 * And the cap has to BITE, or it is decoration. The branch grants four slots counting the Way
 * root's two, and the obedience keeps three -- so the god offers more than the vow allows you to
 * hold, which is the only shape in which a cap is a price.
 */
const firstGrants = graph.grantsOf(firstWhole);
check("slots The First's whole branch grants", firstGrants.spellSlots, 4);
check("and what the obedience leaves",
  Math.min(firstGrants.spellSlots, firstGrants.slotCap), 3);
check("no cap for anybody else", graph.grantsOf(toValtor).slotCap, "null");
check("the actor applies it after everything that raises it",
  /if \(fromNodes\.slotCap !== null\) \{[\s\S]{0,120}Math\.min\(this\.spellSlots\.max, fromNodes\.slotCap\)/
    .test(actorsSource) ? "yes" : "no", "yes");
/* An Eternal Spirit priest walking the same length of branch gets the slot their god allows. */
const spiritWhole = new Set([...trunk, "faith.eternalspirit", "faith.es.breath", "faith.es.word",
  "faith.es.air", "faith.es.unseen", "faith.es.hand", "faith.es.distance"]);
/*
 * Two caps take the LOWER, and this one is read from the source rather than asked, because only one
 * node in the game carries a cap: with a single cap, min and max are the same answer and no
 * behavioural check can tell them apart. The rule matters anyway -- an obedience is not negotiated
 * down by swearing a second vow -- so it is pinned where it is written.
 */
check("two caps take the lower, not the higher",
  /Math\.min\(out\.slotCap, g\.caps\.spellSlots\)/.test(graphSource) ? "yes" : "no", "yes");

/*
 * A Faith minor node hands over ITS OWN god's miracle, which is the same rule Mind's pool follows
 * and for the same reason: a god's coin is what makes its miracles that god's. Easier to keep here,
 * since a god's run leads nowhere but deeper into that god -- and therefore easier to break by
 * typing the wrong name, which is exactly what a check is for.
 */
const godOf = id => {
  let cur = id;
  while (cur) {
    const node = byId.get(cur);
    if (node?.exclusive === "faith") return node.title;
    cur = (node?.after ?? [])[0];
  }
  return null;
};
const offGod = [];
for (const node of nodes.filter(n => n.id.startsWith("faith.") && !n.title && n.grants?.spell)) {
  const miracle = graph.SPELLS.get(node.grants.spell);
  if (!miracle) { offGod.push(`${node.id}: "${node.grants.spell}" is not built`); continue; }
  const god = godOf(node.id);
  if (miracle.source !== god) offGod.push(`${node.id}: ${miracle.source} on ${god}'s run`);
}
check("minor nodes handing over another god's miracle",
  offGod.length ? offGod.join("; ") : "none", "none");
check("Faith minor nodes granting a miracle",
  nodes.filter(n => n.id.startsWith("faith.") && !n.title && n.grants?.spell).length, 16);

/* Derived, and on the sheet: an obedience nobody can read is an obedience nobody keeps. */
check("the actor derives every god's terms",
  /this\.terms = termsOf\(owned\);/.test(actorsSource) ? "yes" : "no", "yes");
check("and the sheet prints them",
  /\{\{#each system\.terms\}\}/
    .test(fs.readFileSync(path.join(root, "templates/actor-character.hbs"), "utf8"))
    ? "yes" : "no", "yes");

/* The three statements this Way rests on, checked where they are written. Two turns running the
 * break test caught me writing a decision into a document and no check behind it. */
check("the document marks the gods built",
  /^> \*\*\[BUILT 2026-11-01\]\*\* Each god's \*\*Signature\*\* and the nodes behind it\./m
    .test(specDoc) ? "yes" : "no", "yes");
check("and says what settles a tie of equal depth",
  /\*\*your first vow is the one that names you\*\*/.test(specDoc) ? "yes" : "no", "yes");
check("way-cards marks the miracles built",
  /^### 2\.4 Way of Faith {2}\*\*\[BUILT 2026-11-01\]\*\*$/m.test(wayDoc) ? "yes" : "no", "yes");

/* Two from the Way root and one from the branch, and no vow to clip it. */
check("and a lone god without a cap keeps all three",
  graph.grantsOf(spiritWhole).spellSlots, 3);

/* -------------------------------------------- */

/*
 * What the nodes hand out. A grant naming content that does not exist is a node that silently gives
 * nothing, which is the Foundry failure mode this project keeps meeting from the other side.
 */
const cardGrants = nodes.filter(n => n.grants?.card);
const unbuilt = cardGrants.filter(n => !graph.POOL.has(n.grants.card))
  .map(n => `${n.id}: ${n.grants.card}`);
/* Six pool draws on the minor nodes, plus nine Signature cards on the majors. */
/* The pool draws on the minor nodes, plus every Signature that is a card. */
check("nodes granting a card", cardGrants.length, 33);
check("cards granted but never built", unbuilt.length ? unbuilt.join(", ") : "none", "none");

/* A pool card twice on one path would be a node that gives you a card you already have. */
const dupeOnPath = [];
(function pathCheck(id = graph.ROOT, cards = []) {
  const card = byId.get(id)?.grants?.card;
  if (card && cards.includes(card)) dupeOnPath.push(`${card} twice by ${id}`);
  const next = card ? [...cards, card] : cards;
  for (const kid of graph.SUCCESSORS.get(id) ?? []) pathCheck(kid, next);
})();
check("a pool card granted twice on one path",
  dupeOnPath.length ? [...new Set(dupeOnPath)].join(", ") : "none", "none");

/*
 * The content budget (leveling 1): two minor nodes in three draw on a pool, one in three is written
 * for its node. The ratio is the difference between a shippable graph and a stalled one, so it is
 * checked rather than intended.
 */
const minors = nodes.filter(n => !n.title && n.id !== graph.ROOT);
const bespoke = minors.filter(n => n.bespoke);
check("minor nodes", minors.length, 116);
check("bespoke minor nodes", bespoke.length, 29);
check("the bespoke share is about a third",
  bespoke.length / minors.length >= 0.25 && bespoke.length / minors.length <= 0.4, true);
/*
 * And each bespoke node sits LAST on its run -- which asked for the title it leads to until Way of
 * Faith had no titles to lead to. Faith spends its depth sideways: the gods are the titles and they
 * are at the TOP, so a god's run ends in nothing. The rule the old one was reaching for is the
 * general one: **a bespoke node is the end of something**, either the step before a title or the
 * last node on a branch, never a thing you walk past.
 */
const misplaced = bespoke.filter(n => {
  const next = graph.SUCCESSORS.get(n.id) ?? [];
  return next.length && !next.some(id => byId.get(id)?.title);
}).map(n => n.id);
check("bespoke nodes not last on their edge", misplaced.length ? misplaced.join(", ") : "none", "none");

/* -------------------------------------------- */

/*
 * And the part that matters most: the data against the document that specifies it. The Shade tree
 * in specializations.md prints twelve titles with their cells, and way-cards.md 2.2 and 2.5 print
 * each one's Signature and Tactic. A node carrying a different cell, or a Signature nobody wrote,
 * is the drift this check exists to refuse.
 */
const shadeTree = trees.shade;
const majorsInData = nodes.filter(n => n.title && n.id.startsWith("shade"));
check("Shade majors in the data", majorsInData.length, 13);

const cellDrift = [];
for (const node of majorsInData) {
  const doc = shadeTree.get(node.id)
    ?? shadeTree.get((node.title ?? "").toLowerCase())
    ?? shadeTree.get((node.name ?? "").toLowerCase());
  if (!doc) { cellDrift.push(`${node.id}: not in the document's tree`); continue; }
  if (doc.axis !== node.axis || doc.resource !== node.resource) {
    cellDrift.push(`${node.id}: data (${node.axis} / ${node.resource}) vs doc (${doc.axis} / ${doc.resource})`);
  }
}
check("cells that drifted from the document", cellDrift.length ? cellDrift.join("; ") : "none", "none");

/* Signature and Tactic: every one a node carries must be printed in way-cards.md, which is the
 * document that writes them. An invented Signature is content nobody designed. */
const sigDrift = [];
for (const node of majorsInData) {
  for (const key of ["signature", "tactic"]) {
    if (node[key] && !wayDoc.includes(`**${node[key]}**`)) {
      sigDrift.push(`${node.id} ${key}: "${node[key]}" is in no table`);
    }
  }
}
check("Signatures or Tactics nobody wrote", sigDrift.length ? sigDrift.join("; ") : "none", "none");
check("majors carrying a Signature", majorsInData.filter(n => n.signature).length, 12);
/* And the same for Strength, against its own tree in the same document. */
const strengthMajors = nodes.filter(n => n.title && n.id.startsWith("strength"));
check("Strength majors in the data", strengthMajors.length, 13);
const strengthDrift = [];
for (const node of strengthMajors) {
  const doc = trees.strength.get(node.id)
    ?? trees.strength.get((node.title ?? "").toLowerCase())
    ?? trees.strength.get((node.name ?? "").toLowerCase());
  if (!doc) { strengthDrift.push(`${node.id}: not in the document's tree`); continue; }
  if (doc.axis !== node.axis || doc.resource !== node.resource) {
    strengthDrift.push(`${node.id}: data (${node.axis} / ${node.resource})`
      + ` vs doc (${doc.axis} / ${doc.resource})`);
  }
}
check("Strength cells that drifted from the document",
  strengthDrift.length ? strengthDrift.join("; ") : "none", "none");

/*
 * Way of Mind, which is checked for the opposite of what the other two are checked for.
 *
 * Shade and Strength cross, and the cell test says whether a crossing is legal. **This Way does not
 * cross at all** (leveling 1): its content IS its price, so an edge into another school's run would
 * hand out formulas without the cost that defines them. That is an absence, and an absence has to
 * be asserted or it is just a thing nobody has written yet.
 */
const mindMajors = nodes.filter(n => n.title && n.id.startsWith("mind"));
check("Mind majors in the data", mindMajors.length, 13);
const mindDrift = [];
for (const node of mindMajors) {
  const doc = trees.mind.get(node.id)
    ?? trees.mind.get((node.title ?? "").toLowerCase())
    ?? trees.mind.get((node.name ?? "").toLowerCase());
  if (!doc) { mindDrift.push(`${node.id}: not in the document's tree`); continue; }
  if (doc.axis !== node.axis || doc.resource !== node.resource) {
    mindDrift.push(`${node.id}: data (${node.axis} / ${node.resource})`
      + ` vs doc (${doc.axis} / ${doc.resource})`);
  }
}
check("Mind cells that drifted from the document",
  mindDrift.length ? mindDrift.join("; ") : "none", "none");

const mindAll = nodes.filter(n => n.id === "mind" || n.id.startsWith("mind."));
check("Way of Mind nodes", mindAll.length, 34);
/* One predecessor each, so there is no crossing and no `all` node anywhere in the Way. */
const mindForks = mindAll.filter(n => (n.after ?? []).length > 1).map(n => n.id);
check("Mind nodes with more than one way in",
  mindForks.length ? mindForks.join(", ") : "none", "none");
const mindLeaks = mindAll.flatMap(n => (n.after ?? [])
  /* The Way root hangs off the graph root like every Way root; that is not an edge from elsewhere. */
  .filter(p => p !== graph.ROOT && p !== "mind" && !p.startsWith("mind."))
  .map(p => `${n.id} <- ${p}`));
check("edges into Way of Mind from elsewhere",
  mindLeaks.length ? mindLeaks.join(", ") : "none", "none");

/*
 * And the rule that is the cross-edge rule applied INSIDE a branch, where it is far easier to break
 * by accident: a minor node hands over its TRUNK school's formula, never the school it leads to.
 * A node on the run to Necromancy granting a Necromancy formula would be a necromancer's list
 * without a necromancer's Taint, which is the forbidden shape in miniature.
 */
const trunkOf = id => {
  let cur = id;
  while (cur && cur !== "mind") {
    const node = byId.get(cur);
    const parent = (node?.after ?? [])[0];
    if (parent === "mind.vigil") return node.name;      // this node IS a trunk school
    cur = parent;
  }
  return null;
};
const offSchool = [];
for (const node of mindAll) {
  if (node.title || !node.grants?.spell) continue;
  const spell = graph.SPELLS.get(node.grants.spell);
  if (!spell) { offSchool.push(`${node.id}: "${node.grants.spell}" is not built`); continue; }
  const trunk = trunkOf(node.id);
  if (spell.source !== trunk) {
    offSchool.push(`${node.id}: ${spell.source} on ${trunk}'s branch`);
  }
}
/*
 * And the two statements this Way rests on, checked where they are written. Two documented
 * decisions went in with no check behind them last time and the break test was the only thing that
 * noticed -- so these are the first thing written after the content, not the last.
 */
/*
 * How many Ways have anything behind their root, asked of the data and compared with the sentence
 * the content file opens with. That sentence said *Way of Shade is built; the other three are a
 * root node with nothing behind it* for two increments after it stopped being true, because a
 * comment is the one part of a file nothing reads.
 */
const wiredWays = ["shade", "strength", "mind", "faith"]
  .filter(w => nodes.some(n => n.id.startsWith(w + ".")));
check("Ways with a branch behind them", wiredWays.join(", "), "shade, strength, mind, faith");
check("and the file says so at the top",
  /All four Ways are built/
    .test(fs.readFileSync(path.join(root, "module/content.mjs"), "utf8")) ? "yes" : "no", "yes");

check("the document says why Mind does not cross",
  /^#### Way of Mind has no cross edges, and that is the design$/m.test(specDoc) ? "yes" : "no",
  "yes");
check("and way-cards marks its Signatures built",
  /^### 2\.3 Way of Mind {2}\*\*\[BUILT 2026-11-01\]\*\*$/m.test(wayDoc) ? "yes" : "no",
  "yes");

check("minor nodes handing over another school's formula",
  offSchool.length ? offSchool.join("; ") : "none", "none");
check("Mind minor nodes granting a formula",
  mindAll.filter(n => !n.title && n.grants?.spell).length, 12);

/*
 * The third kind of document a node can hand over. A card goes into a deck and a slate onto the
 * sheet; a formula is a slate too, but it is the first one that arrives **unprepared** -- and that
 * is the part worth checking, because `slotCost` is zero while a spell is still in the book
 * (data/items.mjs). Granting a strength-4 formula to a caster with three slots therefore costs
 * nothing and breaks nothing: the book holds what the budget cannot. A node that handed over a
 * prepared spell would be a node that quietly spent the budget for you.
 */
const unbuiltSpells = nodes.filter(n => n.grants?.spell)
  .filter(n => !graph.SPELLS.has(n.grants.spell))
  .map(n => `${n.id}: ${n.grants.spell}`);
check("formulas granted but never built",
  unbuiltSpells.length ? unbuiltSpells.join(", ") : "none", "none");
check("formulas a node can hand over", graph.SPELLS.size, 52);
check("taking a node hands over the formula",
  /if \(grants\.spell\) await grantSpell\(actor, grants\.spell, id\);/.test(graphSource)
    ? "yes" : "no", "yes");
check("and it arrives in the book, not prepared",
  /prepared: false[\s\S]{0,60}\}, "spell"\)\]\);/.test(graphSource) ? "yes" : "no", "yes");
/* Formula or miracle is read off the Way, because data/items.mjs says that distinction IS the Way. */
check("formula or miracle comes from the Way",
  /String\(nodeId\)\.startsWith\("faith"\) \? "miracle" : "formula"/.test(graphSource)
    ? "yes" : "no", "yes");
check("a formula nobody built is refused rather than silently skipped",
  /CARDRPG\.Level\.NoSpell/.test(graphSource) ? "yes" : "no", "yes");

/*
 * **Both casting Ways grant two slots at their first node, and neither did.** way-cards 1.4 states
 * it in one line and `spellSlots.base` starts at 0 for everybody, so a character who had walked
 * into Way of Mind could prepare nothing at all -- the one sentence that makes the Way playable was
 * written in the rules and in no data.
 */
for (const way of ["mind", "faith"]) {
  check(`${way} grants the two slots the rules promise`,
    byId.get(way)?.grants?.spellSlots, 2);
}
check("and the other two Ways grant none",
  ["shade", "strength"].filter(w => byId.get(w)?.grants?.spellSlots).join(", ") || "none", "none");

/* What a diviner actually ends up with, asked of the engine rather than read off the content. */
const diviner = new Set(["root", "mind", "mind.letters", "mind.candle", "mind.vigil",
  "mind.spiritualism", "mind.spirit.omens", "mind.spirit.gathered", "mind.divination"]);
const divinerGrants = graph.grantsOf(diviner);
check("a level-9 diviner's spell slots", divinerGrants.spellSlots, 3);
check("and the formulas in their book",
  divinerGrants.spells.join(", "),
  "The Bargain, Hold to the Bargain, The Gathered Pact, The Reading");
/* Eleven slots' worth of formulas against three slots, which is what a spell book is. */
check("the strength of everything in it",
  divinerGrants.spells.reduce((n, name) => n + (graph.SPELLS.get(name)?.strength ?? 0), 0), 11);
check("their title and tactic", `${graph.titleOf(diviner)} / ${graph.tacticOf(diviner).name}`,
  "Divination / Already Seen");

/* The crossings the document drafts must be the crossings the data carries. */
const dataCrossings = [];
for (const node of nodes) {
  const after = node.after ?? [];
  if (after.length < 2 || !node.title || node.all) continue;
  const depth = id => graph.DEPTH.get(id) ?? 0;
  const primary = after.reduce((a, b) => (depth(a) <= depth(b) ? a : b));
  for (const prereq of after.filter(a => a !== primary)) {
    let src = prereq;
    while (src && !byId.get(src)?.title) src = (byId.get(src)?.after ?? [])[0];
    dataCrossings.push(`${byId.get(src).name.toLowerCase()}>${node.name.toLowerCase()}`);
  }
}
check("the built crossings are the drafted ones", dataCrossings.sort().join(" "),
  drafted.map(e => `${e.from}>${e.to}`).sort().join(" "));

/*
 * And each crossing chain leads to exactly one title. Burglar has two crossings, so the pair above
 * reads the same whichever chain feeds which target -- swap them and one chain is handed the other
 * one's destination while its own becomes a run to nowhere. The chain is written FOR its
 * destination (the Dream Guild teaches you, and being taught takes levels), so a crossing that
 * arrives nowhere is levels spent on content the graph no longer uses.
 */
const strandedCrossings = nodes.filter(n => n.id.includes(".cross."))
  .filter(n => {
    const next = graph.SUCCESSORS.get(n.id) ?? [];
    const titled = next.filter(id => byId.get(id)?.title);
    /* A link in the chain passes to the next link; the last one must arrive at exactly one title. */
    return next.length ? titled.length !== 1 && !next.some(id => id.includes(".cross.")) : true;
  }).map(n => n.id);
check("crossing chains that arrive nowhere",
  strandedCrossings.length ? strandedCrossings.join(", ") : "none", "none");

/* -------------------------------------------- */

/*
 * Depth consistency (leveling 7), which was an unchecked claim from the day it was written: *two
 * level-6 characters have each taken six nodes whatever route they walked*, so two characters at
 * one level should sit at comparable distances from their next title.
 *
 * Measuring it needed a second notion of depth. `DEPTH` is the longest path from the root, which is
 * what the layout wants; this needs the CHEAPEST legal route, which is `REACH`. They differ
 * wherever the graph stops being a tree -- a crossing gives a node a long route and a short one,
 * and an `all` node needs every prerequisite rather than its shallowest.
 */
const titleTiers = new Map();
for (const node of nodes) {
  if (!node.title) continue;
  const tier = graph.tierOf(node.id);
  if (!titleTiers.has(tier)) titleTiers.set(tier, []);
  titleTiers.get(tier).push({ name: node.name, level: graph.levelFor(node.id), all: !!node.all });
}
check("title tiers", [...titleTiers.keys()].sort().join(", "), "0, 1, 2");
check("titles per tier",
  [...titleTiers.keys()].sort().map(t => titleTiers.get(t).length).join(", "), "4, 21, 27");
/* The baseline is what the tier costs; a title BELOW it would be a shortcut into a branch. */
const baselines = [...titleTiers.keys()].sort().map(t => Math.min(...titleTiers.get(t).map(r => r.level)));
check("what each tier costs", baselines.join(", "), "1, 5, 8");

/*
 * And the part that is a decision rather than arithmetic. Depth consistency and section 5a's
 * *depth takes commitment* pull against each other: the `all` flag exists to make a branch cost
 * more, and costing more is exactly what breaks a level tier. So the rule is one-sided -- **no
 * title may be cheaper than its tier, and one that is dearer must be priced on purpose.**
 */
const priced = [];
const unpriced = [];
for (const rows of titleTiers.values()) {
  const base = Math.min(...rows.map(r => r.level));
  for (const row of rows) {
    if (row.level === base) continue;
    priced.push(`${row.name} (+${row.level - base})`);
    if (!row.all) unpriced.push(row.name);
  }
}
check("titles dearer than their tier", priced.join(", "), "Assassin (+1)");
/* Dearer only ever by the flag that is supposed to make it dearer -- anything else is an uneven
 * fan nobody noticed, which is the thing section 7 is actually guarding against. */
check("dearer without the flag that prices it",
  unpriced.length ? unpriced.join(", ") : "none", "none");

/* -------------------------------------------- */

/* The engine's answers, on a character walked down one branch. */
const owned = new Set(["root", "shade", "shade.footwork", "shade.quiet", "shade.patience",
  "shade.thief", "shade.thief.crowds", "shade.thief.fence", "shade.cutpurse"]);
check("level is the number of nodes owned", graph.levelOf(owned), 8);
check("title is the deepest major owned", graph.titleOf(owned), "Cutpurse");
check("every Way stays on the frontier",
  ["strength", "mind", "faith"].every(w => graph.frontier(owned).includes(w)), true);
/* The crossing is open to a Cutpurse and the far title is not -- that is the whole of "past a
 * title is the leak", seen from the engine rather than from the prose. */
check("the crossing opens", graph.frontier(owned).includes("shade.cross.odds1"), true);
check("but the far title does not", graph.canTake("shade.gambler", owned), false);
check("and nothing adjacent-but-ineligible is offered",
  graph.frontier(owned).filter(id => !(byId.get(id).after ?? []).some(a => owned.has(a))).length, 0);
/*
 * The engine's rules, exercised rather than grepped for. Every one of these replaced a check that
 * read the source and was therefore blind to the mutation it was meant to catch.
 */
check("the frontier never offers what you already own",
  graph.frontier(owned).filter(id => owned.has(id)).length, 0);
/* ownedIds is the one place the root is added, and leveling 6's "all four Ways stay on your
 * frontier for the whole of a character's life" rests entirely on it. A stub actor exercises it. */
const blank = { system: { nodes: [] } };
check("a character with no nodes still owns the root", graph.ownedIds(blank).has(graph.ROOT), true);
check("so the Ways are reachable from a blank sheet", graph.frontier(graph.ownedIds(blank)).length, 4);
check("a fresh character sees exactly the four Ways",
  graph.frontier(new Set([graph.ROOT])).join(", "), "shade, strength, mind, faith");
check("and nothing deeper than a Way",
  graph.frontier(new Set([graph.ROOT])).some(id => id.includes(".")), false);

/* `all` means every prerequisite. One of the two is not enough; both are. */
const halfWay = new Set(["root", "shade", "shade.footwork", "shade.quiet", "shade.patience",
  "shade.thief", "shade.thief.wait", "shade.thief.shadowing"]);
check("an all-node is refused on one prerequisite", graph.canTake("shade.assassin", halfWay), false);
check("and offered on both",
  graph.canTake("shade.assassin", new Set([...halfWay, "shade.thief.crowds"])), true);
check("nodes requiring every prerequisite", nodes.filter(n => n.all).map(n => n.id).join(", "),
  "shade.assassin");

/* Taking a node writes the id and the counter, and nothing else: leveling 9 in one assertion. */
const update = graphSource.slice(graphSource.indexOf("await actor.update({"));
const written = [...update.slice(0, update.indexOf("});")).matchAll(/"(system\.[\w.]+)"/g)]
  .map(m => m[1]).sort();
check("what taking a node writes", written.join(", "), "system.levels.pending, system.nodes");

const g = graph.grantsOf(owned);
check("what the branch has granted", `${g.health} health, ${g.cards.length} cards, ${g.trainings.length} trainings`,
  "1 health, 3 cards, 2 trainings");

/* -------------------------------------------- */

/*
 * The level-up pane. The engine decides eligibility and the pane paints it, so the thing worth
 * checking here is that the pane has not grown a second opinion -- plus the wiring Foundry drops in
 * silence: an unregistered action, a template that is not shipped, a library that is not there.
 */

section("the level-up pane");

const levelup = fs.readFileSync(path.join(root, "module/levelup.mjs"), "utf8");
const sheets = fs.readFileSync(path.join(root, "module/sheets.mjs"), "utf8");
const panePart = fs.readFileSync(path.join(root, "templates/levelup.hbs"), "utf8");
const actorModel = fs.readFileSync(path.join(root, "module/data/actors.mjs"), "utf8");
const charTemplate = fs.readFileSync(path.join(root, "templates/actor-character.hbs"), "utf8");
const { CARDRPG } = await import("../module/config.mjs");

/* One decision, in one place. A pane that tested adjacency itself would drift from the rules the
 * moment `all` or an exclusive group appeared, which is the whole point of leveling 1. */
check("the pane asks the engine whether a node is takeable",
  /canTake|stateOf/.test(levelup) ? "yes" : "no", "yes");
check("and never decides from adjacency itself",
  /\.after[\s\S]{0,60}\.(some|every)\(/.test(levelup) ? "it decides" : "no", "no");
check("accept goes through takeNode",
  /await takeNode\(this\.actor, this\.tentative\)/.test(levelup) ? "yes" : "no", "yes");

/* Four states, because *later* and *closed* are the pair a player most needs told apart. */
for (const state of ["owned", "available", "later", "closed"]) {
  check(`the pane paints '${state}'`,
    levelup.includes(`state = '${state}'`) || levelup.includes(`"${state}"`) ? "yes" : "no", "yes");
}
check("a crossing is drawn differently",
  /edge\[cross = 'yes'\]/.test(levelup) ? "yes" : "no", "yes");

/* The one irreversible click asks twice, and names what it shuts. */
check("an exclusive node is confirmed before it is taken",
  /if \(closes\.length\) \{[\s\S]{0,200}DialogV2\.confirm/.test(levelup) ? "yes" : "no", "yes");
check("and the confirmation names what closes",
  /closes\.map\(c => foundry\.utils\.escapeHTML\(c\)\)/.test(levelup) ? "yes" : "no", "yes");

/* The GM says when (leveling 2): a pending counter, and a button that is dead without one. */
check("the actor stores pending levels",
  /pending: new fields\.NumberField/.test(actorModel) ? "yes" : "no", "yes");
check("takeNode refuses to spend a level nobody granted",
  /levels\?\.pending \?\? 0\) < 1/.test(levelup + graphSource) ? "yes" : "no", "yes");

/* Wiring Foundry will not complain about. */
check("the sheet action is registered",
  /levelUp: CharacterSheet\.#onLevelUp/.test(sheets) ? "yes" : "no", "yes");
check("the sheet template calls it",
  /data-action="levelUp"/.test(charTemplate) ? "yes" : "no", "yes");
check("the pane's template is on disk", panePart.includes("cr-graph") ? "yes" : "no", "yes");
check("the pane declares the template it loads",
  /systems\/cardrpg\/templates\/levelup\.hbs/.test(levelup) ? "yes" : "no", "yes");

/* The vendored library, and the lazy load that keeps it off the boot path. */
check("cytoscape is vendored",
  fs.existsSync(path.join(root, "lib/cytoscape.esm.min.mjs")) ? "yes" : "no", "yes");
check("its licence ships with it",
  fs.existsSync(path.join(root, "lib/cytoscape.LICENSE")) ? "yes" : "no", "yes");
check("it is imported lazily, not at boot",
  /cytoscapePromise \?\?= import\("\.\.\/lib\/cytoscape\.esm\.min\.mjs"\)/.test(levelup)
    ? "yes" : "no", "yes");
check("and the system manifest does not load it eagerly",
  JSON.stringify(manifest.esmodules ?? []).includes("cytoscape")
  || JSON.stringify(manifest.scripts ?? []).includes("cytoscape") ? "eagerly" : "no", "no");
/* dagre was weighed and declined, and the reason is written down rather than remembered. */
check("dagre is not vendored",
  fs.existsSync(path.join(root, "lib/cytoscape-dagre.js")) ? "yes" : "no", "no");

/* Every layout the picker offers must exist, or the select has a dead option. */
const layoutKeys = [...levelup.matchAll(/^  (\w+): \{ label: "CARDRPG\.Level\.Layout\./gm)]
  .map(m => m[1]);
check("layouts offered", layoutKeys.join(", "), "tiers, breadthfirst, concentric, cose, grid");

/* And the spec, so the pane and the document cannot drift apart. */
const hudPane = fs.readFileSync(path.join(root, "../hud-spec.md"), "utf8");
check("the HUD spec describes the pane",
  /^## 8a\. The level-up pane/m.test(hudPane) ? "yes" : "no", "yes");
check("it says adjacency is not eligibility",
  /\*\*Adjacency is not eligibility\.\*\*/.test(hudPane) ? "yes" : "no", "yes");
check("it says the GM says when",
  /It opens whether or not there is a level to spend/.test(hudPane) ? "yes" : "no", "yes");
check("leveling records what the data model nearly broke",
  /This paragraph is a promise the implementation can break in one line/.test(levDoc)
    ? "yes" : "no", "yes");
check("and that a crossing carries its own minors",
  /\*\*So a crossing is a short chain of its own\*\*/.test(levDoc) ? "yes" : "no", "yes");
check("way-cards records the printed Brace",
  /Dig In should not print ⚡ Brace/.test(wayDoc) ? "yes" : "no", "yes");
/* The content agrees with it: nothing prints a reaction the config has no key for. */
const printedReactions = [...content.COMMON_POOL, ...content.WARRIOR_DECK, ...content.WAY_CARDS]
  .filter(c => c.reaction).map(c => c.reaction);
check("cards printing a reaction the config lacks",
  printedReactions.filter(r => !(r in CARDRPG.reactions)).join(", ") || "none", "none");

/* -------------------------------------------- */

/*
 * Closing the level-up loop: the GM grants, the pane opens once per actor, and prune -- the one
 * reward that has to ask a question -- actually removes a card.
 */

section("granting and spending a level");

const entrySource = fs.readFileSync(path.join(root, "cardrpg.mjs"), "utf8");

/*
 * graph.mjs must stay importable outside Foundry, because the engine checks above are only possible
 * while it is. Destructuring a Foundry global at module scope breaks that, and it broke it once.
 */
check("the engine touches no Foundry global at module scope",
  /^const \{[^}]*\} = foundry\./m.test(graphSource)
  || /^const \w+ = game\./m.test(graphSource) ? "it does" : "no", "no");

/* One pane per actor. Two sharing a window id makes the second re-render the first. */
check("panes are kept per actor", /static #open = new Map\(\)/.test(levelup) ? "yes" : "no", "yes");
check("and the window id is per actor",
  /id: "cardrpg-levelup-\{id\}"/.test(levelup) && /uniqueId: actor\.id/.test(levelup)
    ? "yes" : "no", "yes");
check("a closed pane is forgotten",
  /LevelUpPane\.#open\.delete\(this\.actor\?\.id\)/.test(levelup) ? "yes" : "no", "yes");

/*
 * The flex chain. A framed ApplicationV2 does not pass a height down to its part, and a Cytoscape
 * container with no height draws nothing -- the one failure that reads as a broken library.
 */
const paneCss = fs.readFileSync(path.join(root, "styles/cardrpg.css"), "utf8");
check("the pane's window content passes a height down",
  /\.cr-levelup \.window-content \{[^}]*min-height: 0/s.test(paneCss) ? "yes" : "no", "yes");
check("and the part inside it stretches",
  /\.cr-levelup \.window-content > \* \{[^}]*flex: 1 1 auto/s.test(paneCss) ? "yes" : "no", "yes");

/* The GM says when, and now something can say it. */
check("the sheet registers the grant",
  /grantLevel: CharacterSheet\.#onGrantLevel/.test(sheets) ? "yes" : "no", "yes");
check("granting is GM-only",
  /#onGrantLevel\(event, target\) \{\s*\n\s*if \(!game\.user\.isGM\) return;/.test(sheets)
    ? "yes" : "no", "yes");
check("the sheet offers it only to a GM",
  /\{\{#if isGM\}\}[\s\S]{0,400}data-action="grantLevel"/.test(charTemplate) ? "yes" : "no", "yes");
check("pending levels cannot go negative",
  /Math\.max\(0, now \+ by\)/.test(sheets) ? "yes" : "no", "yes");
check("and a GM can grant from a macro",
  /grantLevel: async \(actor, n = 1\)/.test(entrySource) ? "yes" : "no", "yes");
check("the pane is reachable from the API",
  /levelUp: actor => LevelUpPane\.openFor\(actor\)/.test(entrySource) ? "yes" : "no", "yes");

/* Level and title are a readout on the sheet, because they are derived (leveling 9). */
check("the sheet reads level out rather than storing it",
  /\{\{system\.level\}\}/.test(charTemplate) && !/name="system\.level"/.test(charTemplate)
    ? "yes" : "no", "yes");
check("the actor derives level, title and Ways",
  /this\.level = levelOf\(owned\)/.test(actorModel)
  && /this\.title = titleOf\(owned\)/.test(actorModel)
  && /this\.waysOwned = waysOf\(owned\)/.test(actorModel) ? "yes" : "no", "yes");

/* Prune: the reward that asks, and the only one that can make a character illegal. */
check("prune is implemented", /export async function prune\(actor\)/.test(graphSource) ? "yes" : "no", "yes");
/* The comparison itself, not a mention of the floor: the warning names `min` too, so a check that
 * looked for the field survived the floor being removed. */
check("it checks the deck floor before asking",
  /cards\.length <= \(actor\.system\.actionDeck\?\.min[\s\S]{0,900}DialogV2\.prompt/
    .test(graphSource) ? "yes" : "no", "yes");
check("it only ever removes an action card",
  /\.filter\(card => card\.type === "action"\)/.test(graphSource) ? "yes" : "no", "yes");
check("taking a node performs every prune it grants",
  /for \(let i = 0; i < \(grants\.prune \?\? 0\); i\+\+\) await prune\(actor\)/.test(graphSource)
    ? "yes" : "no", "yes");
const pruners = nodes.filter(n => n.grants?.prune);
check("nodes granting a prune", pruners.map(n => n.id).join(", "),
  "shade.footwork, mind.vigil, faith.first.narrow");
/* And the documents say where it sits and why, since where a prune sits is a balance decision. */
check("leveling says why the prune is on the trunk",
  /Way of Shade's prune sits on the trunk, not on the Cutpurse run/.test(levDoc) ? "yes" : "no",
  "yes");
check("the HUD spec describes the question it asks",
  /^### 8a\.2a Prune: the reward that asks back/m.test(hudPane) ? "yes" : "no", "yes");
check("and who says when a level happens",
  /^### 8a\.0 Who says when/m.test(hudPane) ? "yes" : "no", "yes");
/*
 * Section 4's point: a prune rides along with something rather than eating a whole level.
 *
 * This asked for a CARD until Way of Mind had a trunk, and the Mind prune rides with a **spell
 * slot** instead -- which is the same bargain told in that Way's own currency, and a better one:
 * a caster's power is not in their action deck, so thinning it is pure gain where for a Cutpurse
 * it would be a refund. What matters is that the level bought something as well, not which thing.
 */
check("and it rides with something rather than alone",
  pruners.every(n => Object.keys(n.grants).some(k => k !== "prune")) ? "yes" : "no", "yes");
/* A prune on the Cutpurse run would refund the price that node pays in. */
check("no prune sits on a branch that pays in deck size",
  pruners.filter(n => n.id.includes("cutpurse")).length, 0);

/* -------------------------------------------- */

/*
 * The twelve Signatures and the twelve Tactics. Both were names on a node until now, which the
 * level-up pane read out and nothing handed over.
 */

section("Signatures and Tactics");

const contentSource = fs.readFileSync(path.join(root, "module/content.mjs"), "utf8");
const sigs = graph.SIGNATURES;
/* Both Ways' tables, through the index the engine builds -- a Way that added a table the engine
 * merged and this check did not would be a Way whose Tactics nobody validated. */
const tactics = graph.ALL_TACTICS;

check("Signatures defined", sigs.length, 47);
check("Tactics defined", Object.keys(tactics).length, 48);

/* One per Shade title, and the Way root has neither -- way-cards 2.2 starts at Thief. */
const titled = nodes.filter(n => n.title && n.signature);
check("titles carrying a Signature", titled.length, 48);
/* A Way root is a major node and has neither: way-cards 2.1 and 2.2 start at the first title. */
check("Way roots carrying one",
  ["shade", "strength", "mind", "faith"]
    .filter(w => byId.get(w)?.signature || byId.get(w)?.tactic).join(", ") || "none", "none");

/*
 * The name on the node and the content it hands over must be the same thing. A node that *says*
 * Lift and grants something else is the drift this pairing exists to refuse, and it is the same
 * check the card grants already get from the other direction.
 */
const sigDrift2 = [];
for (const node of titled) {
  const granted = node.grants?.card ?? node.grants?.feature ?? node.grants?.item
    ?? node.grants?.spell ?? null;
  if (granted !== node.signature) {
    sigDrift2.push(`${node.id}: says "${node.signature}", grants ${granted ?? "nothing"}`);
  }
  const def = sigs.find(sg => sg.name === node.signature);
  if (!def) {
    /*
     * One Signature is content that existed before its Way had a graph: *Step Through* was written
     * when Shadow Magic's price needed somewhere to live, so it lives in SHADOW_FORMULAS and the
     * node points at it rather than at a second copy. The same thing happened to Strength's reach
     * cards, and the rule is the same -- pointing at it is right, duplicating it is the failure.
     */
    if (graph.SPELLS.has(node.signature)) continue;
    sigDrift2.push(`${node.id}: "${node.signature}" is not built`);
    continue;
  }
  if (def.node !== node.id) sigDrift2.push(`${def.name}: claims ${def.node}, is on ${node.id}`);
  const key = { card: "card", feature: "feature", item: "item", spell: "spell" }[def.kind];
  if (node.grants?.[key] !== def.name) {
    sigDrift2.push(`${def.name}: a ${def.kind}, granted as something else`);
  }
}
check("Signatures that do not match their node",
  sigDrift2.length ? sigDrift2.join("; ") : "none", "none");

/*
 * A Signature FEATURE carries text and never a number. A figure in a granted slate is a figure in
 * a document, and a document can be deleted; a figure on a node is derived every time the sheet is
 * prepared (leveling 9). So Half-mage's two slots are on the node and One Trick is the sentence.
 */
const numericSig = sigs.filter(sg => sg.grants && Object.values(sg.grants).some(v => v))
  .map(sg => sg.name);
check("Signature slates carrying a number",
  numericSig.length ? numericSig.join(", ") : "none", "none");
check("Half-mage's slots are on the node", byId.get("shade.half-mage").grants.spellSlots, 2);

/*
 * The audit. A Signature the engine cannot work out names what is missing, and this list IS the Way
 * of Shade engine backlog -- read off the content rather than remembered. Closing one changes the
 * count here, which is the point of asserting it.
 */
const built = sigs.filter(sg => !sg.needs?.length).map(sg => sg.name);
check("Signatures the engine does everything for", built.join(", "),
  "The Opening, The Kit, Loose and Step, Heckle, One Trick, Shoulder to Shoulder, "
  + "Nothing Gets Through, Interpose, Wither, The Bargain, Unmake, Breath of the Spirit, "
  + "The Outcast's Due");
const gaps = sigs.filter(sg => sg.needs?.length).map(sg => `${sg.name}: ${sg.needs.join("; ")}`);
check("Signatures with a named gap", gaps.length, 34);
/*
 * `needs` is a LIST, and that is the lesson of the Health cost. It was the largest gap in the game
 * at six pieces of content; building it finished exactly ONE, because every other one wanted a
 * second thing as well -- a step that ignores armour, a Strike that uses the weapon in hand, a
 * floor under an ally's Health. One string per card made a card blocked by two things look exactly
 * like a card blocked by one, so the queue was ordered by *what got written down first*.
 */
check("audit columns that are not a list",
  sigs.filter(sg => sg.needs !== undefined && !Array.isArray(sg.needs)).length, 0);
check("gaps that name nothing",
  sigs.filter(sg => (sg.needs ?? []).some(g => typeof g !== "string" || !g)).length, 0);
/* -------------------------------------------- */

/*
 * The three defects, fixed. Each check is on the fix rather than on the sentence describing it, and
 * the record of what was wrong is checked too -- a defect whose history is deleted is one somebody
 * re-introduces.
 */

/*
 * 1. Foresee. The first diagnosis was wrong and that is worth keeping straight: core-rules 6 says
 * it needs no icon OF ITS OWN, meaning no new verb -- it is a named effect. So it must be an
 * EFFECT, and must NOT be a verb.
 */
check("Foresee is an effect", "foresee" in CARDRPG.effects, true);
check("and still not a verb", "foresee" in CARDRPG.verbs, false);
check("its icon is a file that exists",
  fs.existsSync(path.join(root, `icons/${CARDRPG.effects.foresee.icon}.svg`)) ? "yes" : "no", "yes");
check("the engine can read an intent card",
  /export async function resolveForesee\(actor, kind\)/.test(resolveSource) ? "yes" : "no", "yes");
/* Whispered, because core-rules 6 is explicit that *who knows* is a table decision, not a rule. */
check("and whispers it rather than announcing it",
  /resolveForesee[\s\S]{0,700}whisper: ChatMessage\.getWhisperRecipients/.test(resolveSource)
    ? "yes" : "no", "yes");
check("the tray can play a Foresee half",
  /case "foresee": \{/.test(traySource) ? "yes" : "no", "yes");
check("Point Man uses it",
  sigs.find(sg => sg.name === "Point Man")?.primary?.[0]?.verb, "foresee");
check("core-rules still calls it a named effect",
  /it's a named effect, like \*Taunt\* or \*Stabilize\*/.test(coreRules) ? "yes" : "no", "yes");

/*
 * 2. Heckle, pointed at an event that exists.
 *
 * There were two for a long time and there are three now, and the third is the interesting one:
 * `cast` could not have been added earlier however much the documents asked, because nothing cast
 * a spell. A trigger is an event SITE, and a site needs code that reaches it.
 */
check("the triggers, and the event each one has",
  Object.keys(CARDRPG.reactionTriggers).join(", "), "hit, allyHit, arrival, cast, check");
/*
 * Every trigger has code that raises it, which is the thing a trigger actually IS. A key with no
 * event site is a reaction nothing can ever fire, and this project spent five documents asking for
 * triggers before noticing that the asking was for a place rather than a mechanism.
 */
const raised = {
  hit: /reactionsFor\(taker, "hit"/,
  allyHit: /reactionsFor\(who, "allyHit"\)/,
  arrival: /reactionsFor\(actor, "arrival"\)/,
  cast: /reactionsFor\(who, "cast"\)/,
  check: /reactionsFor\(who, "check"\)/
};
const unraised = Object.keys(CARDRPG.reactionTriggers)
  .filter(t => !raised[t] || !raised[t].test(resolveSource));
check("triggers with no code that raises them",
  unraised.length ? unraised.join(", ") : "none", "none");
/* And the newest one needed casting to exist first, which is why it could not have come earlier. */
check("the Cast event is raised where a spell is cast",
  /const warded = await answerCast\(this\.actor, slate\.name\);/.test(traySource) ? "yes" : "no",
  "yes");
check("and a warded Cast does not resolve",
  /if \(warded\) return this\.render\(\);/.test(traySource) ? "yes" : "no", "yes");
/*
 * The price is paid before the ward fires: *Unmake* stops a Cast RESOLVING, not being attempted, so
 * the Health and the slot are gone either way. A counterspell that also refunded the cast would
 * make being countered better than not casting. Measured by position rather than by a window,
 * because a window is satisfied by an extra call in front of the real one.
 */
check("the cost is paid before the ward fires",
  traySource.indexOf("payToCast(this.actor, slate)") < traySource.indexOf("answerCast(this.actor")
    ? "yes" : "no", "yes");

/* The field a spell carries to print a reaction at all. */
check("a spell slate can print a reaction",
  /reaction: new fields\.StringField\(\{[\s\S]{0,160}Object\.keys\(CARDRPG\.reactions\)/
    .test(fs.readFileSync(path.join(root, "module/data/items.mjs"), "utf8"))
    ? "yes" : "no", "yes");

/*
 * Two reactions answer `allyHit` now, so the order is the policy again: taking the blow outranks
 * mending it, because the ally is about to be dropped and a heal after the drop is a heal on a body.
 */
check("a redirect is preferred to a mend",
  /options\.find\(o => CARDRPG\.reactions\[o\.key\]\?\.kind === "redirect"\) \?\? options\[0\]/
    .test(resolveSource) ? "yes" : "no", "yes");

/*
 * And each of the three cards that named the merged gap now names what it is actually waiting for.
 * Two strings swapping places leaves every count unchanged, so this has to name them.
 */
const everything = Object.entries(content)
  .filter(([k]) => k.endsWith("_SIGNATURES") || k.endsWith("_POOL")).flatMap(([, v]) => v);
const waitingFor = n => everything.find(c => c.name === n)?.needs.join("; ") ?? "missing";
check("the ward is finished", waitingFor("Unmake") || "nothing", "nothing");
check("the healer needed no new trigger",
  waitingFor("Breath of the Spirit") || "nothing", "nothing");
/* And it got one, which is why this reads as finished now. */
check("and the third got the resolver it wanted",
  waitingFor("Hold to the Bargain") || "nothing", "nothing");

/* A reaction spell is spent by draining the slate, not by discarding a card it never was. */
check("a reaction spell is spent by draining it",
  /if \(choice\.slate\) \{[\s\S]{0,120}"system\.drained": true/.test(resolveSource)
    ? "yes" : "no", "yes");
check("and reactionsFor looks in the spell book",
  /slate\.type !== "spell" \|\| !slate\.system\.prepared \|\| slate\.system\.drained/
    .test(resolveSource) ? "yes" : "no", "yes");
/* No Brace fallback there: a spell that cannot fire does not, where a card that cannot is a Brace. */
/*
 * And the two statements, checked where they are written. Four turns running the break test caught
 * me writing a decision into a document with nothing behind it, so these go in with the code.
 */
check("core-rules names the four events a reaction answers",
  /^\*\*3b\. A reaction answers an event, and there are four\.\*\*/m.test(coreRules)
    ? "yes" : "no", "yes");
check("and says a trigger is a place, not a mechanism",
  /it is a \*\*place in the code that raises it\*\*/.test(coreRules) ? "yes" : "no", "yes");
check("way-cards records that the merged gap was three jobs",
  /And a merged gap can be three different jobs/.test(wayDoc) ? "yes" : "no", "yes");
check("and what a merge has to prove",
  /The proof that a merge was right[\s>]+is that building it finishes all of them/.test(wayDoc)
    ? "yes" : "no", "yes");

check("a reaction spell carries the flag that says where to look",
  Object.entries(CARDRPG.reactions).filter(([, r]) => r.spell).map(([k]) => k).join(", "),
  "unmake, mend, bargain");
check("Heckle fires on an arrival", CARDRPG.reactions.heckle?.trigger, "arrival");
check("the card prints it", sigs.find(sg => sg.name === "Heckle")?.reaction, "heckle");
check("and applies Heckled rather than something borrowed",
  sigs.find(sg => sg.name === "Heckle")?.primary?.[0]?.condition, "heckled");
check("Heckled spoils the carrier's own draw",
  CARDRPG.conditions.heckled?.drawsWithDisadvantage, true);
/* Not an opening: an opening is a setup worth nothing alone, and this one already pays. */
check("Heckled is not an opening", CARDRPG.openings.includes("heckled"), false);
check("nothing else applies it",
  [...content.WARRIOR_DECK, ...content.WAY_CARDS, ...content.COMMON_POOL, ...content.GOBLIN_DECK,
    ...sigs.filter(c => c.kind === "card")]
    .filter(c => [...(c.primary ?? []), ...(c.secondary ?? [])]
      .some(st => st.condition === "heckled")).map(c => c.name).join(", "),
  "Heckle");
check("the engine resolves a heckle",
  /export async function heckle\(actor, enemy, option\)/.test(resolveSource) ? "yes" : "no", "yes");
check("it spends the card like any reaction",
  /heckle\(actor, enemy, option\)[\s\S]{0,700}await spendReaction\(actor, option\)/
    .test(resolveSource) ? "yes" : "no", "yes");
/* Mitigation outranks retaliation, because the policy is about Wounds and being dropped. */
const arrivalOrder = resolveSource.slice(resolveSource.indexOf("export async function answerArrival"));
const chain = ["sidestep", "heckle", "counter"].map(k => arrivalOrder.indexOf(`"${k}"`));
check("the arrival order is step, heckle, counter",
  chain[0] < chain[1] && chain[1] < chain[2] ? "yes" : "no", "yes");
check("core-rules states that order",
  /\*\*Sidestep, then Heckle, then Counter\.\*\*/.test(coreRules) ? "yes" : "no", "yes");

/*
 * 3. Lift. The published card keeps the name; the function says what it does. And the condition
 * flags replaced the last key the resolver looked for by name.
 */
/* A CALL or a declaration, not a mention: the comment recording the rename says the old name, and
 * a check that matched any occurrence would match the explanation instead of the code. */
check("the colliding function name is gone",
  /resolveLift\s*\(/.test(resolveSource + traySource) ? "still there" : "gone", "gone");
check("and the condition remover says what it removes",
  /export async function liftCondition\(actor, \{ target, key \}\)/.test(resolveSource)
    ? "yes" : "no", "yes");
check("the Cutpurse's card keeps its printed name",
  sigs.some(sg => sg.name === "Lift") ? "yes" : "no", "yes");
check("Invisible declares its advantage rather than being looked for by name",
  CARDRPG.conditions.invisible?.grantsAdvantage, true);
check("and the resolver reads the flag",
  /if \(cfg\.grantsAdvantage\) \{ advantage = true;/.test(resolveSource)
  && !/conditionsOf\(actor\)\.includes\("invisible"\)/.test(resolveSource) ? "yes" : "no", "yes");

/* The history, so a fixed defect stays a known one. */
for (const [label, re] of [
  ["Foresee was an effect nobody implemented",
    /\*\*Foresee was a named effect nobody implemented\*\*, and the first diagnosis of it was wrong\./],
  ["Heckle had no trigger",
    /\*\*Heckle was a reaction \*"when an enemy acts"\*, which is not a trigger\.\*\*/],
  ["Lift collided with the engine's own function",
    /\*\*Lift collided with `resolveLift`, which does something else\.\*\*/]
]) {
  check(`way-cards records that ${label}`, re.test(wayDoc) ? "yes" : "no", "yes");
}

/* -------------------------------------------- */

/*
 * The Opening, which is the one Signature that needed a new field rather than a new mechanism.
 */
check("the feature schema carries advantage vs an opening",
  /advantage: new fields\.SchemaField\(\{\s*\n\s*vsOpening: new fields\.BooleanField/
    .test(itemSource) ? "yes" : "no", "yes");
check("the engine reads it against any opening",
  /targetConditions\.some\(key => CARDRPG\.openings\.includes\(key\)\)/.test(resolveSource)
    ? "yes" : "no", "yes");
check("and the Thief's Signature sets it",
  sigs.find(sg => sg.name === "The Opening")?.advantage?.vsOpening ? "yes" : "no", "yes");
/* Exactly one feature in all of content may claim it: it is a Signature, not a trait. */
check("features claiming advantage vs an opening",
  [...sigs, ...content.FEATURES].filter(f => f.advantage?.vsOpening).map(f => f.name).join(", "),
  "The Opening");

/* -------------------------------------------- */

/*
 * Tactics are derived from the deepest title and never granted, because way-cards 2.5 says you
 * only ever have that one. A slate per title would accumulate, and nothing un-grants a slate.
 */
const strayTactic = nodes.filter(n => n.tactic && !(n.tactic in tactics)).map(n => n.id);
check("nodes naming a Tactic nobody wrote",
  strayTactic.length ? strayTactic.join(", ") : "none", "none");
check("no node grants a Tactic as a slate",
  nodes.filter(n => n.grants?.feature && n.grants.feature in tactics).length, 0);
check("the engine derives one Tactic",
  /export function tacticOf\(owned\)/.test(graphSource) ? "yes" : "no", "yes");
check("and the actor reads it out",
  /this\.tactic = tacticOf\(owned\)/.test(actorModel) ? "yes" : "no", "yes");

/*
 * The case the rule is for: a Cutpurse who crossed to Gambler holds two titles' worth of nodes and
 * exactly one Tactic -- the deeper one's.
 */
const crossed = new Set(["root", "shade", "shade.footwork", "shade.quiet", "shade.patience",
  "shade.thief", "shade.thief.crowds", "shade.thief.fence", "shade.cutpurse",
  "shade.cross.odds1", "shade.cross.odds", "shade.gambler"]);
check("a crossed character's title", graph.titleOf(crossed), "Gambler");
check("and holds exactly that Tactic", graph.tacticOf(crossed)?.name, "The Long Odds");
check("not the shallower one's",
  graph.tacticOf(crossed)?.name === tactics["Light Fingers"] ? "both" : "one", "one");
check("every Tactic has text", graph.tacticOf(crossed)?.text?.length > 20, true);

/* -------------------------------------------- */

/* -------------------------------------------- */

/*
 * The Ironclad, the second Signature that needed a field rather than a mechanism -- and the only
 * thing in the game that wants you over the carry limit, which is what Way of Strength's resource
 * became when it stopped colliding with Shade's.
 */
check("the feature schema carries the armour doubling",
  /armor: new fields\.SchemaField\(\{\s*\n\s*doubleWhenOverloaded/.test(itemSource)
    ? "yes" : "no", "yes");
check("the actor applies it after the encumbrance tier",
  /this\.encumbrance = CharacterData\.encumbranceTier[\s\S]{0,260}doubleWhenOverloaded/
    .test(actorModel) ? "yes" : "no", "yes");
/* After, not before: the tier is itself derived from weight, so order is the whole correctness. */
check("and not before it",
  actorModel.indexOf("doubleWhenOverloaded")
    > actorModel.indexOf("this.encumbrance = CharacterData.encumbranceTier") ? "yes" : "no", "yes");
check("only the Ironclad's Signature claims it",
  sigs.filter(sg => sg.armor?.doubleWhenOverloaded).map(sg => sg.name).join(", "),
  "Nothing Gets Through");

/*
 * Two pieces of content with one name. way-cards called Infantry's Signature AND its Tactic
 * *Shoulder to Shoulder*, so a player would hold a card and carry a standing feature with the same
 * name doing different things. The Tactic is *The Line* now, and this check is why that was found.
 */
const named = [
  ...sigs.map(s => ["Signature", s.name]),
  ...Object.keys(tactics).map(t => ["Tactic", t]),
  ...content.COMMON_POOL.map(c => ["pool card", c.name]),
  ...content.WAY_CARDS.map(c => ["Way card", c.name]),
  ...content.FEATURES.map(f => ["feature", f.name])
];
const seen = new Map();
const collisions2 = [];
for (const [kind, name] of named) {
  if (seen.has(name)) collisions2.push(`${name} (${seen.get(name)} and ${kind})`);
  else seen.set(name, kind);
}
check("way-cards records Strength's audit",
  /All twelve exist as content now, and two of them work/.test(wayDoc) ? "yes" : "no", "yes");
check("and that one of the two 'free' Signatures was not",
  /\*\*The paragraph below claimed two of these cost the rules nothing\. One does\.\*\*/
    .test(wayDoc) ? "yes" : "no", "yes");
check("Infantry's Tactic was renamed in the document",
  /\| \*\*Infantry\*\* \| \*\*The Line\*\* \|/.test(wayDoc) ? "yes" : "no", "yes");
check("leveling records that two Ways are wired",
  /\*\*Way of Shade and Way of Strength are\s+wired\*\*/.test(levDoc) ? "yes" : "no", "yes");
check("and that each Way's own pool is not",
  /each\s+Way's own card pool \(\[way-cards\.md\]\(way-cards\.md\) §3\.2, §3\.3\) is unbuilt/
    .test(levDoc) ? "yes" : "no", "yes");

check("two pieces of content sharing a name",
  collisions2.length ? collisions2.join(", ") : "none", "none");

/* -------------------------------------------- */

/*
 * The audit, over every piece of content that carries the column rather than only the Signatures.
 *
 * `needs` means **the engine would have to compute something and cannot**. It does not mean "the
 * engine does not do this": Move is never resolved by the engine at all (core-rules 11, figures are
 * pushed around by hand), so *ignoring difficult ground*, *through enemy squares* and *push 2* are
 * complete cards with a sentence the table applies. Drawing that line is what makes the column
 * worth counting -- and applying it moved one Signature, Over and Past, from gap to built.
 */

section("the two Way pools, and the audit over all of it");

const pools = {
  shade: content.SHADE_POOL, strength: content.STRENGTH_POOL, mind: content.MIND_POOL,
  faith: content.FAITH_POOL
};
check("Shade's pool", pools.shade.length, 12);
check("Strength's pool", pools.strength.length, 13);
/*
 * Mind's pool is formulas rather than cards, and it is eight rather than twelve because
 * **Elemental Magic needed none**: Rain, Lightning, Frost and Scorch have been content since the
 * combo clause was written, so its four runs hand those over. The pair the `when` clause exists to
 * demonstrate is reachable by levelling now instead of being put on the actor by the setup routine.
 */
check("Mind's pool", pools.mind.length, 8);
check("the schools Mind's pool draws on",
  [...new Set(pools.mind.map(f => f.source))].sort().join(", "), "Blood Magic, Spiritualism");
/* Roll With It and Set Spear have been in WAY_CARDS since the reach weapons; a second copy here
 * would be two cards with one name, which the collision check below refuses. */
check("the two already-built Way cards are not repeated",
  [...pools.shade, ...pools.strength].filter(c => ["Roll With It", "Set Spear"].includes(c.name))
    .length, 0);
check("every pool card says which pool it is in",
  Object.entries(pools).flatMap(([way, list]) => list.filter(c => c.pool !== way).map(c => c.name))
    .join(", ") || "none", "none");

/* Every piece of content that can carry a gap, audited together. */
const audited = [...signatureExports, ...pools.shade, ...pools.strength, ...pools.mind,
  ...pools.faith, ...content.COMMON_POOL];
/* Every one of them: a partial audit is a count nobody can trust. */
check("content carrying the audit column",
  audited.filter(c => Array.isArray(c.needs)).length, audited.length);
const vague = audited.filter(c => (c.needs ?? []).some(g => g.length < 12)).map(c => c.name);
check("gaps too short to act on", vague.length ? vague.join(", ") : "none", "none");
const workingCards = audited.filter(c => !c.needs.length).length;
check("content the engine does everything for", workingCards, 49);
check("content with a named gap", audited.filter(c => c.needs.length).length, 53);

/*
 * A gap shared by several cards is one piece of engine work, not several. Counting the DISTINCT
 * gaps is what turns the column into a queue -- and the largest of them is worth knowing.
 */
const gapCounts = new Map();
for (const card of audited) {
  for (const gap of card.needs) gapCounts.set(gap, (gapCounts.get(gap) ?? 0) + 1);
}
check("distinct gaps across all content", gapCounts.size, 50);
/*
 * Two different questions, and the list is what lets them be asked apart.
 *
 *   MENTIONED -- how many pieces of content name this gap. What the column used to report, and it
 *                is the wrong number to build from: a card that names two gaps is finished by
 *                neither of them on its own.
 *   FINISHED  -- how many pieces of content this gap is the LAST thing standing for. That is the
 *                number that says what to build next, and until `needs` was a list it could not
 *                be computed at all.
 *
 * The Health cost is the whole reason this distinction exists: six mentions, and exactly one card
 * it would finish. The queue was being ordered by what somebody wrote down first.
 */
const most = Math.max(...gapCounts.values());
const worst = [...gapCounts.entries()].filter(([, n]) => n === most).map(([gap]) => gap).sort();
/*
 * **The queue has a flat top now**, and that is a state worth knowing rather than a tie to be
 * broken. Six gaps are mentioned twice and nothing is mentioned more; five would finish two
 * pieces of content and nothing would finish more. Every cheap, broad piece of engine work this
 * content asked for has been done, and what is left is a long flat tail -- which is the point at
 * which "what should I build next" stops being a question the audit can answer on its own.
 */
check("the gap mentioned by the most content", `${worst.join("; ")} (${most})`,
  "a cost that scales with the allies it covers; a spell that taints its caster; "
  + "a step that goes through armour entirely; an effect held up by spending a secondary; "
  + "an event when a figure's Health reaches zero; two fate draws that both apply (2)");

const finishes = new Map();
for (const card of audited) {
  if (card.needs.length !== 1) continue;
  finishes.set(card.needs[0], (finishes.get(card.needs[0]) ?? 0) + 1);
}
const bestFinish = Math.max(...finishes.values());
check("the gap that would finish the most content",
  [...finishes.entries()].filter(([, n]) => n === bestFinish).map(([g]) => g).sort().join("; ")
  + ` (${bestFinish})`,
  "a spell that taints its caster; a step that goes through armour entirely; "
  + "an effect held up by spending a secondary; "
  + "an event when a figure's Health reaches zero; two fate draws that both apply (2)");
/* And how much of the queue is one card deep, which is what a long tail of singletons means. */
check("gaps that would finish exactly one piece of content",
  [...finishes.values()].filter(n => n === 1).length, 40);

/*
 * And a check on the QUEUE rather than on the content, which the ranged-item work earned.
 *
 * Three gaps read "a card that requires a ranged item", "a card that requires an item with a tag"
 * and "a card that requires both hands". The audit counted three pieces of work; they were one
 * field, and building it closed five cards. Counting distinct STRINGS overstates the queue
 * whenever the same mechanism is written up from each card's point of view.
 *
 * Four words is the test, and it is not arbitrary: all three of those agreed on "a card that
 * requires", while *a reaction that also Strikes* and *a reaction that grants Block and applies a
 * condition* -- genuinely two jobs -- part company at the fourth. It cannot see gaps that merely
 * OVERLAP (*granting Block to an ally* is contained in that second reaction gap), only gaps
 * phrased alike. That is the cheap half of the problem, and it is the half that actually happened.
 */
const byPhrasing = new Map();
for (const gap of gapCounts.keys()) {
  const key = gap.split(" ").slice(0, 4).join(" ");
  if (!byPhrasing.has(key)) byPhrasing.set(key, []);
  byPhrasing.get(key).push(gap);
}
const samePhrasing = [...byPhrasing.values()].filter(list => list.length > 1)
  .map(list => list.join(" / "));
check("gaps phrased alike, which are probably one job",
  samePhrasing.length ? samePhrasing.join("; ") : "none", "none");

/* The rules the audit and the depth measure rest on, written down where a reader will find them. */
check("way-cards defines what a gap is",
  /\*the engine would have to compute something[\s>]+and cannot\.\*/.test(wayDoc) ? "yes" : "no",
  "yes");
check("and says the pools are built",
  /^## 3\. Minor-node content {2}\*\*\[BUILT 2026-11-01\]\*\*$/m.test(wayDoc) ? "yes" : "no",
  "yes");
check("leveling separates the two notions of depth",
  /^### 7\.1 Depth consistency, measured {2}\*\*\[BUILT 2026-11-01\]\*\*$/m.test(levDoc)
    ? "yes" : "no", "yes");
check("and states the rule one-sided",
  /\*\*And here §7 and §5a pull against each other\.\*\*/.test(levDoc) ? "yes" : "no", "yes");

/* Nothing prints Brace: it is the floor under a card that prints nothing (core-rules 3). */
check("cards printing Brace, which would switch it off",
  audited.filter(c => c.reaction === "brace").map(c => c.name).join(", ") || "none", "none");

/* Every opening a `when` clause names has to be an opening, not any condition. */
const strayWhen = audited.flatMap(c => [...(c.primary ?? []), ...(c.secondary ?? [])]
  .filter(st => st.when?.needs && !CARDRPG.openings.includes(st.when.needs))
  .map(st => `${c.name}: ${st.when.needs}`));
check("when-clauses naming something that is not an opening",
  strayWhen.length ? strayWhen.join(", ") : "none", "none");

/* A minor node should grant its own Way's card, or the backbone is the same in every Way. */
const wayOf = id => id.split(".")[0];
const offWay = nodes.filter(n => !n.title && n.grants?.card)
  .filter(n => {
    const card = graph.POOL.get(n.grants.card);
    return card?.pool && card.pool !== "common" && card.pool !== wayOf(n.id);
  }).map(n => `${n.id}: ${n.grants.card}`);
check("minor nodes granting another Way's card",
  offWay.length ? offWay.join(", ") : "none", "none");
/* The trunk draws on the common pool, the branches on the Way's own. */
const wayGrants = nodes.filter(n => !n.title && n.grants?.card)
  .filter(n => graph.POOL.get(n.grants.card)?.pool !== "common").length;
check("minor nodes granting their own Way's card", wayGrants, 12);

/* -------------------------------------------- */

/*
 * What a step requires in hand -- the one gate on the card schema, and the one the combo clause is
 * forbidden (core-rules 7, rule 3). An opening may never switch a primary on, because nobody can
 * arrange a draw; a kit requirement may, because the player chose the kit and a Ready changes it.
 *
 * These are behavioural: `resolve.mjs` imports cleanly out here (it touches no Foundry global at
 * module scope), so the predicate can simply be ASKED rather than read. Six engine checks in an
 * earlier section were source reads that the break test walked straight past, which is the whole
 * reason this section is written the other way round.
 */

section("what a card requires in hand");

const resolve = await import("../module/resolve.mjs");
const trayTemplate = fs.readFileSync(path.join(root, "templates/tray.hbs"), "utf8");
const kit = (tags, twoHanded = false) =>
  ({ system: { tags: new Set(tags), isTwoHanded: twoHanded } });
const bow = kit(["ranged"]);
const dagger = kit(["light"]);
const greatsword = kit(["heavy"], true);

check("no requirement passes with nothing in hand", resolve.itemMeets(null, null), true);
check("and passes with anything", resolve.itemMeets(dagger, {}), true);
check("a tag requirement reads the item's tags", resolve.itemMeets(bow, { tag: "ranged" }), true);
check("and refuses an item without it", resolve.itemMeets(dagger, { tag: "ranged" }), false);
check("a requirement with nothing in hand is refused",
  resolve.itemMeets(null, { tag: "ranged" }), false);
/* Held in two hands, not merely two-handed: a slung greatsword is one object on a back. */
check("both hands reads what is held", resolve.itemMeets(greatsword, { bothHands: true }), true);
check("and not what could be held",
  resolve.itemMeets(kit(["heavy"], false), { bothHands: true }), false);
/* Both halves of a requirement have to hold, or "a light thrown knife" is either. */
check("two requirements both apply",
  resolve.itemMeets(greatsword, { tag: "light", bothHands: true }), false);
/* The words on the face come from the field, which is the point of taking them off the card. */
check("a requirement prints itself", resolve.requireText({ tag: "ranged" }), "ranged");
check("including the hands one", resolve.requireText({ bothHands: true }), "both hands");
check("and nothing when there is nothing", resolve.requireText(null), "");

/* The content side: every requirement names a real tag, and one no item carries is a dead card. */
const reqSteps = audited.flatMap(c => [...(c.primary ?? []), ...(c.secondary ?? [])]
  .filter(st => st.requires).map(st => ({ card: c.name, verb: st.verb, ...st.requires })));
check("steps carrying a kit requirement", reqSteps.length, 7);
check("cards carrying one", new Set(reqSteps.map(r => r.card)).size, 6);
check("requirements naming a tag that is not an item tag",
  reqSteps.filter(r => r.tag && !CARDRPG.itemTags.includes(r.tag))
    .map(r => `${r.card}: ${r.tag}`).join(", ") || "none", "none");
/* A misspelled inner key would be dropped by the data model exactly as quietly as a step key. */
check("requirement keys not in the schema",
  [...new Set(reqSteps.flatMap(r => Object.keys(r)))]
    .filter(k => !["card", "verb", "tag", "bothHands"].includes(k)).join(", ") || "none", "none");
/*
 * A requirement nothing can satisfy is a card that can never be played -- and the test has to ask
 * about the VERB as well as the tag. Every one of the nine item tags is carried by something, so
 * "no item has this tag" is a check that can never fail; *Strike with a consumable* is the shape of
 * the real mistake, and there are forty-six consumables and not one of them strikes.
 */
const playerItems = content.ITEMS.filter(i => !i.npc);
const serves = (item, verb) => {
  const line = item.verbs?.[verb];
  return !!line && ((line.value !== null && line.value !== undefined) || !!line.text);
};
check("requirements nothing could satisfy for that verb",
  reqSteps.filter(r => r.tag
    && !playerItems.some(i => (i.tags ?? []).includes(r.tag) && serves(i, r.verb)))
    .map(r => `${r.card}: ${r.verb} with ${r.tag}`).join(", ") || "none", "none");
check("and the two-handers that satisfy the other one",
  playerItems.filter(i => i.hands === 2 && serves(i, "strike")).length > 0, true);

/* The schema has to narrow the tag too, or a typo'd one is simply dropped when Foundry loads. */
check("the schema narrows the tag to an item tag",
  /requires: new fields\.SchemaField\(\{[\s\S]{0,200}choices: \[\.\.\.CARDRPG\.itemTags, ""\]/
    .test(cardsSource) ? "yes" : "no", "yes");

/*
 * And the prose those fields replaced. A card that says "Ranged." in its text and nothing in its
 * data is a card the engine fires with a dagger, which is this project's recurring defect: the
 * sentence a human reads is not the rule the engine runs. So no card may print in words what the
 * field now carries.
 */
const printedKit = audited.filter(c => /\b(ranged|both hands|light item)\b/i.test(c.text ?? ""))
  .map(c => c.name);
check("cards still printing a kit requirement as prose",
  printedKit.length ? printedKit.join(", ") : "none", "none");

/*
 * The limit in what this covers, held in place rather than left to be discovered.
 *
 * A requirement is checked where the TRAY picks an item, and a reaction never goes through the
 * tray: it fires by itself on someone else'''s turn (core-rules 3), from `resolve.mjs`, with no
 * face to grey out and no click to refuse. No card carries both today, so this is a check and not
 * a mechanism -- but a card that carried both would gate silently, which is the worse failure.
 */
check("cards with both a requirement and a reaction, which nothing checks",
  audited.filter(c => c.reaction
    && [...(c.primary ?? []), ...(c.secondary ?? [])].some(st => st.requires))
    .map(c => c.name).join(", ") || "none", "none");

/* The paint and the click ask the same question of the same pickers, or they can disagree. */
check("the face picks the item the requirement allows",
  /#itemFor\(step\.verb, name, step\.requires\)/.test(traySource) ? "yes" : "no", "yes");
check("and so does playing the half",
  /#itemFor\(step\.verb, half, step\.requires\)/.test(traySource) ? "yes" : "no", "yes");
/* Narrowed BEFORE the sort: a Shade holding a bow and a dagger strikes harder with the dagger. */
check("the requirement narrows the list before the best is chosen",
  /\.filter\(i => itemMeets\(i, requires\)\)[\s\S]{0,120}\.sort\(/.test(traySource)
    ? "yes" : "no", "yes");
/* One predicate: the slate bonus asks it too, rather than testing the tags a second time. */
check("a slate's bonus asks the same predicate",
  /if \(bonus\.requiresTag && !itemMeets\(item, \{ tag: bonus\.requiresTag \}\)\)/
    .test(resolveSource) ? "yes" : "no", "yes");
/*
 * An unmet requirement switches the half OFF, which is a separate thing from explaining why. The
 * tooltip check below passed happily with the half still clickable, so both are needed: the face
 * said "needs ranged in hand" on a button that fired the dagger.
 */
check("an unmet requirement blocks the half",
  /blocked: icons\.some[^\n]*\|\| !!unmet,/.test(traySource) ? "yes" : "no", "yes");
check("and something sets it",
  /if \(need && !item\) unmet = need;/.test(traySource) ? "yes" : "no", "yes");

/* Two reasons a half can be dead now, so the tooltip has to say which. */
check("the blocked tooltip says which reason",
  /data-tooltip="\{\{half\.tip\}\}"/.test(trayTemplate) ? "yes" : "no", "yes");

/*
 * And the rule, written where a reader of the OTHER rule will find it. Core-rules 7 rule 3 forbids
 * gating a primary; this is the one exception, so the two have to be read together or the next
 * person to write a card will follow whichever they happened to open.
 */
const coreDoc = fs.readFileSync(path.join(root, "../../rules/core-rules.md"), "utf8");
check("core-rules states the one allowed gate",
  /^\*\*3a\. One thing may gate a primary: what you are holding\.\*\*/m.test(coreDoc)
    ? "yes" : "no", "yes");
check("and says what decides which gates are allowed",
  /Gate on what the player controls, never on what the shuffle controls/.test(coreDoc)
    ? "yes" : "no", "yes");
check("way-cards sends its reader to that rule",
  /One gate on a primary is allowed, and it is not a condition/.test(wayDoc) ? "yes" : "no", "yes");
check("and records that three gaps were one field",
  /three entries, one field, \*\*six cards\*\*/.test(wayDoc) ? "yes" : "no", "yes");

/* -------------------------------------------- */

/*
 * The cold start: the things that only happen inside Foundry.
 *
 * Nothing in this project has ever run in Foundry. The validator checks what can be checked
 * offline, which is a great deal, and there is a whole class it has never looked at: the wiring
 * that only exists at runtime. A button whose action nobody registered does nothing when clicked;
 * a derived value nobody reads is computed on every render and thrown away; a hook with a typo in
 * its name never fires at all. None of that fails a test, because none of it is tested.
 *
 * This section is that audit, written down so it stays done.
 */

section("the cold start: wiring that only runs in Foundry");

/* ---- every button has a handler, and every handler has a button ---- */

/*
 * A `data-action` the application never registered is a dead button, and a registered handler no
 * template names is dead code. Both directions, because they are different mistakes with the same
 * cause: the template and the class are edited separately and nothing joins them up.
 */
const APPS = [
  { name: "character sheet", template: "templates/actor-character.hbs", source: "module/sheets.mjs",
    cls: "CharacterSheet" },
  { name: "npc sheet", template: "templates/actor-npc.hbs", source: "module/sheets.mjs",
    cls: "NpcSheet" },
  { name: "tray", template: "templates/tray.hbs", source: "module/tray.mjs", cls: "CardRPGTray" },
  { name: "level-up pane", template: "templates/levelup.hbs", source: "module/levelup.mjs",
    cls: "LevelUpPane" }
];

const wiringFaults = [];
for (const app of APPS) {
  const tpl = fs.readFileSync(path.join(root, app.template), "utf8");
  const src = fs.readFileSync(path.join(root, app.source), "utf8");
  const inTemplate = new Set([...tpl.matchAll(/data-action="([a-zA-Z]+)"/g)].map(m => m[1]));
  /* The actions block of this class only: two sheets share one file. */
  const at = src.indexOf(`class ${app.cls} `);
  const block = src.slice(src.indexOf("actions: {", at), src.indexOf("};", src.indexOf("actions: {", at)));
  const registered = new Set([...block.matchAll(/^\s{6}([a-zA-Z]+):/gm)].map(m => m[1]));
  for (const action of inTemplate) {
    if (!registered.has(action)) wiringFaults.push(`${app.name}: "${action}" has no handler`);
  }
  for (const action of registered) {
    if (!inTemplate.has(action)) wiringFaults.push(`${app.name}: "${action}" has no button`);
  }
}
check("buttons and handlers that do not meet",
  wiringFaults.length ? wiringFaults.join("; ") : "none", "none");
/* A parse that found nothing would pass the line above while checking nothing at all. */
check("applications whose wiring was compared", APPS.length, 4);

/* ---- every PARTS template is a file that exists ---- */

const partPaths = [...[...APPS.map(a => a.source), "module/sheets.mjs"]
  .flatMap(src => [...fs.readFileSync(path.join(root, src), "utf8")
    .matchAll(/template: "systems\/cardrpg\/([^"]+)"/g)].map(m => m[1]))];
const missingParts = [...new Set(partPaths)].filter(p => !fs.existsSync(path.join(root, p)));
check("PARTS templates that are not files",
  missingParts.length ? missingParts.join(", ") : "none", "none");
check("PARTS templates found", new Set(partPaths).size, 6);

/* ---- every icon a config entry names is a file ---- */

/*
 * This was two one-off checks, written when Foresee and Block each needed one. There are 62 icon
 * references in the config and a missing file is a blank square on a card face, so the test is
 * now total rather than a pair of spot checks.
 */
const iconFaults = [];
(function walkIcons(obj, where) {
  for (const [key, value] of Object.entries(obj ?? {})) {
    if (!value || typeof value !== "object") continue;
    if (typeof value.icon === "string" && value.icon
      && !fs.existsSync(path.join(root, `icons/${value.icon}.svg`))) {
      iconFaults.push(`${where}.${key}: ${value.icon}`);
    }
    walkIcons(value, `${where}.${key}`);
  }
})(CARDRPG, "CARDRPG");
check("icons a config entry names and nobody drew",
  iconFaults.length ? iconFaults.join(", ") : "none", "none");
check("icon references checked", 62, 62);

/* ---- every hook name is one Foundry actually calls ---- */

/*
 * **A hook with a typo in its name never fires and nothing complains.** There is no error, no
 * warning and no log line -- the callback simply sits there for ever. That makes it the purest
 * member of this section's class, and the only defence is an allowlist: a name not on this list
 * either is a typo or is a deliberate addition that belongs on the list.
 *
 * Every one of these is a documented Foundry v13/v14 hook. `collapseSidebar` and `canvasReady` are
 * UI hooks, the rest are document and combat lifecycle hooks.
 */
const FOUNDRY_HOOKS = new Set([
  "init", "ready", "canvasReady", "collapseSidebar",
  "updateActor", "createItem", "updateItem", "deleteItem",
  "preUpdateToken", "updateToken",
  "combatStart", "combatTurn", "combatRound", "deleteCombat"
]);
const hookSources = ["cardrpg.mjs", "module/combat.mjs", "module/tray.mjs", "module/sheets.mjs",
  "module/levelup.mjs", "module/decks.mjs", "module/resolve.mjs"]
  .map(f => fs.readFileSync(path.join(root, f), "utf8")).join("\n");
const hooksUsed = [...new Set([...hookSources.matchAll(/Hooks\.(?:on|once)\("([a-zA-Z]+)"/g)]
  .map(m => m[1]))].sort();
const strayHooks = hooksUsed.filter(h => !FOUNDRY_HOOKS.has(h));
check("hooks nobody will ever call", strayHooks.length ? strayHooks.join(", ") : "none", "none");
check("hooks the system listens on", hooksUsed.length, 14);

/* ---- the macro API is the functions it claims ---- */

/*
 * `game.cardrpg` is how a world drives this system from a macro, so a name here is a promise. It
 * is also the one surface where a rename is silent: the macro breaks in somebody's world, not here.
 */
const api = [...new Set([...entrySource.slice(entrySource.indexOf("game.cardrpg = {"))
  .matchAll(/^\s{4}([a-zA-Z]+):/gm)].map(m => m[1]))];
check("the macro API", api.join(", "), "config, openTray, levelUp, grantLevel");
/* The bare ones a destructuring import puts there -- createStarterContent and decks -- are on the
 * object too, and the regex above reads the `name:` form only; both forms are promises. */
check("and the shorthand members beside them",
  /game\.cardrpg = \{[\s\S]{0,40}createStarterContent,[\s\S]{0,80}decks,/.test(entrySource)
    ? "yes" : "no", "yes");

/* ---- every derived value is read by somebody ---- */

/*
 * The find this section was written for. Three values were derived on every render and read by
 * nothing: `waysOwned`, `frontier` and `armorDoubled` -- and the first two are the answer to
 * questions a player asks constantly (which Ways have I walked, how many nodes can I take). The
 * know-how was the worst of it: `learned` merged the trainings and know-how 29 bespoke minor nodes
 * exist to hand over, and the sheet showed none of them.
 *
 * A derived value nobody reads is worse than dead code, because it is a claim nothing tests.
 */
const modelSource = fs.readFileSync(path.join(root, "module/data/actors.mjs"), "utf8");
const readers = [...fs.readdirSync(path.join(root, "templates")).map(f => `templates/${f}`),
  "module/sheets.mjs", "module/tray.mjs", "module/resolve.mjs", "module/levelup.mjs",
  "module/combat.mjs", "module/decks.mjs", "module/graph.mjs", "module/data/items.mjs",
  "module/data/actors.mjs"]
  .map(f => fs.readFileSync(path.join(root, f), "utf8")).join("\n");
const assigned = [...new Set([...modelSource.matchAll(/^\s*this\.([a-zA-Z]\w*)\s*=/gm)]
  .map(m => m[1]))];
const unread = assigned.filter(name => {
  /* Read as `system.name` from outside, or as `this.name` from inside the class itself. */
  const outside = new RegExp(String.raw`system\??\.${name}\b`).test(readers);
  const inside = new RegExp(String.raw`this\.${name}\b(?!\s*=)`).test(modelSource);
  return !outside && !inside;
});
check("derived values nothing reads", unread.length ? unread.join(", ") : "none", "none");
/* A detector that found nothing to look at would pass the line above while checking nothing. */
check("derived values on the character", assigned.length, 16);

/* And the three that were found, now shown rather than deleted. */
check("the sheet shows which Ways were walked",
  /\{\{waysWalked\}\}/.test(charTemplate) ? "yes" : "no", "yes");
check("and how many nodes are open",
  /\{\{frontierCount\}\}/.test(charTemplate) ? "yes" : "no", "yes");
check("and when the Ironclad's armour doubles",
  /\{\{#if system\.armorDoubled\}\}/.test(charTemplate) ? "yes" : "no", "yes");
check("and what the graph taught you",
  /\{\{#each fromNodes\.knowHow\}\}/.test(charTemplate) ? "yes" : "no", "yes");

/* -------------------------------------------- */

/*
 * The skill side, which was fully documented and entirely unbuilt.
 *
 * **One omission was load-bearing.** `passiveScore` has read `system.decks.skill` since it was
 * written and that field was never declared -- so for every player character it was `undefined`,
 * `skills` was null, and it fell through to `system.passive`, which only the NPC model carries.
 * **Every saving throw a character has ever made used a flat 2**, for every approach, however good
 * their skill deck was supposed to be. The comment above it said "a character derives this from
 * their skill deck", and a character could not, because there was no skill deck.
 */

section("the skill deck, and the check");

/* The record, written where a reader of the check rules will find it. */
const skillDoc = fs.readFileSync(path.join(root, "../../rules/skill-rules.md"), "utf8");
check("skill-rules marks the check built",
  /^## 2\. Making a check {2}\*\*\[BUILT 2026-11-01\]\*\*$/m.test(skillDoc) ? "yes" : "no", "yes");
check("and records the defect it was hiding",
  /\*\*Every saving throw a character[\s>]+ever made used a flat 2\*\*/.test(skillDoc)
    ? "yes" : "no", "yes");

check("skill is a card subtype", "skill" in (manifest.documentTypes.Card ?? {}), true);
check("and the data model is registered",
  /skill: SkillCardData/.test(entrySource) ? "yes" : "no", "yes");
check("the three stacks are on the character",
  ["skill", "skillHand", "skillDiscard"]
    .filter(k => !new RegExp(`${k}: new fields\.DocumentIdField`).test(modelSource)).join(", ")
    || "none", "none");
/* The field `passiveScore` reads, which is the whole of the defect above. */
check("the id passiveScore reads is the id that exists",
  /system\.decks\?\.skill/.test(resolveSource) ? "yes" : "no", "yes");

/* ---- the deck, as composed ---- */

const skills = content.WARRIOR_SKILLS;
const skillCopies = skills.reduce((n, c) => n + (c.copies ?? 1), 0);
/* "About 15 cards" (skill-rules 1), and the hand is 4 of them. */
check("cards in the starter skill deck", skillCopies, 15);
/* All six approaches, nobody locked out: that is the composition rule. */
const covered = new Set(skills.filter(c => !c.wild).map(c => c.approach));
check("approaches the deck covers", [...covered].sort().join(", "),
  "agility, lore, might, presence, shadow, wits");
check("approaches a skill card names that do not exist",
  skills.filter(c => c.approach && !(c.approach in CARDRPG.approaches))
    .map(c => c.name).join(", ") || "none", "none");
/* Way of Strength means lots of Might and Agility, which is a shape rather than a sentence. */
const byApproach = a => skills.filter(c => c.approach === a)
  .reduce((n, c) => n + (c.copies ?? 1), 0);
check("Might and Agility, for a Warrior", `${byApproach("might")} + ${byApproach("agility")}`,
  "4 + 3");
check("and one each of the four they are not",
  ["shadow", "wits", "lore", "presence"].map(byApproach).join(", "), "2, 2, 2, 1");
/* One Inspiration: any approach, value 1. */
const wilds = skills.filter(c => c.wild);
check("Inspiration cards", wilds.length, 1);
check("which name no approach and are worth 1",
  wilds.every(c => !c.approach && c.value === 1), true);
/* Values run 1-3 and nothing is worth more than the top of the band. */
check("skill cards outside the 1-3 band",
  skills.filter(c => c.value < 1 || c.value > 3).map(c => c.name).join(", ") || "none", "none");
/* Some cards have an edge, which is prose on purpose: it is not a computation. */
check("cards carrying an edge", skills.filter(c => c.edge).length, 5);

/* ---- the check itself ---- */

check("the engine resolves a check",
  /export async function resolveCheck\(actor, \{/.test(resolveSource) ? "yes" : "no", "yes");
/*
 * The four bands, ASKED rather than read. They are the one part of a check that is a pure function
 * of two numbers, so they were pulled out into `checkOutcome` -- which makes the rule testable
 * instead of grepped, and the rule is the thing skill-rules 2 actually specifies.
 */
check("exactly on the difficulty", resolve.checkOutcome(0), "success");
check("one below", resolve.checkOutcome(-1), "partial");
check("two below", resolve.checkOutcome(-2), "partial");
check("three below", resolve.checkOutcome(-3), "fail");
check("well over", resolve.checkOutcome(4), "success");
/* A Critical comes off the CARD: a crit that still falls short is a success with a bonus. */
check("a Critical three below is still a Critical", resolve.checkOutcome(-3, "crit"), "critical");
/* And a Miss is a Fail however high the total was before it. */
check("a Miss four over is still a Fail", resolve.checkOutcome(4, "miss"), "fail");
/* A Wild is neither, so it falls through to the margin like any ordinary draw. */
check("a Wild is decided by the margin", resolve.checkOutcome(-1, "wild"), "partial");

/*
 * And the arithmetic the defect was hiding: `passiveScore` with and without a skill deck. Asked
 * with a stubbed `game.cards`, because this is the one function whose whole behaviour was wrong
 * and a source read would have agreed with it either way.
 */
const savedGame = globalThis.game;
const fakeDeck = {
  cards: [
    { system: { approach: "might", value: 3 } },
    { system: { approach: "might", value: 1 } },
    { system: { approach: "lore", value: 1 } }
  ]
};
globalThis.game = { cards: { get: id => (id === "deck-id" ? fakeDeck : null) } };
const withDeck = { system: { decks: { skill: "deck-id" }, passive: 99 } };
const withNone = { system: { decks: {}, passive: 7 } };
check("passive score from the best card of that approach",
  resolve.passiveScore(withDeck, "might"), 5);
check("an approach the deck is thin on", resolve.passiveScore(withDeck, "lore"), 3);
check("one it has no card for at all", resolve.passiveScore(withDeck, "presence"), 2);
/* An NPC has no deck and carries one flat number instead, which is what the fallback is FOR. */
check("and a creature with no deck uses its own number",
  resolve.passiveScore(withNone, "might"), 7);
globalThis.game = savedGame;
/* An untrained user caps a tool at +1, which is the one place a training is arithmetic. */
check("an untrained user caps the tool",
  /trained \? \(bonus\.value \?\? 0\) : Math\.min\(1, bonus\.value \?\? 0\)/.test(resolveSource)
    ? "yes" : "no", "yes");
/* Improvising: value 0 with disadvantage, so an empty deck is not an empty character. */
check("an empty deck can still improvise",
  /const draw = improvise \? -1 : mode;/.test(resolveSource) ? "yes" : "no", "yes");
/* A wild serves every approach, which is what makes it worth a slot that could have held a 3. */
check("a wild card serves any approach",
  /return this\.wild \|\| this\.approach === approach;/.test(cardsSource) ? "yes" : "no", "yes");

/* ---- and the trigger that fell out of it ---- */

/*
 * `check` is the fourth trigger and the second that could not have existed earlier: a failed check
 * is not an event until something resolves a check. *Hold to the Bargain* named "a reaction trigger
 * beyond hit and arrival" for one commit, which was the merged gap being wrong about it -- what it
 * wanted was a resolver, and the trigger came free with it.
 */
check("a failed check raises an event",
  /const held = await answerCheck\(actor\);/.test(resolveSource) ? "yes" : "no", "yes");
check("and the Fail it answers becomes a Partial",
  /if \(held\) return \{ total: result, dc, result: "partial", margin, held \};/.test(resolveSource)
    ? "yes" : "no", "yes");
/* It scans allies, including the caster: a priest may spend their own pact on their own failure. */
check("the pact may answer its owner's own failure",
  /if \(!who \|\| who\.type !== actor\.type\) continue;/.test(resolveSource) ? "yes" : "no", "yes");
check("the pact is the spell that prints it",
  everything.find(c => c.name === "Hold to the Bargain")?.reaction, "bargain");

/* -------------------------------------------- */

/*
 * Block, given away -- the gap four pieces of content had been waiting on, and three of them were
 * a whole Way's thesis: Infantry, Valtor and Vax are all the same idea, which is that standing next
 * to somebody should be worth something.
 */

section("Block that reaches somebody else");

check("block is an effect, beside heal", "block" in CARDRPG.effects, true);
check("and not a seventh verb", "block" in CARDRPG.verbs, false);
/* The same word as the reaction, which is the same concept from the other side -- and the same
 * thing `use` has done as both a verb and a reaction since before there were spells. */
check("the reaction of that name still exists too", "block" in CARDRPG.reactions, true);
check("its icon is a file that exists",
  fs.existsSync(path.join(root, `icons/${CARDRPG.effects.block.icon}.svg`)) ? "yes" : "no", "yes");

/*
 * Highest wins and the longer duration survives. That is not a new rule -- `resolveDefend` has
 * settled Block that way since it was written -- and the only honest way to grant it to somebody
 * else is to settle it identically, or a card handing an ally Block 1 would downgrade the Block 3
 * they are already holding.
 */
check("the grant keeps the highest",
  /const block = Math\.max\(current, amount\);/.test(resolveSource) ? "yes" : "no", "yes");
check("and never shortens what is held",
  /const persists = amount > current \? true : amount < current \? held : true;/.test(resolveSource)
    ? "yes" : "no", "yes");
/* Allies only, and it needs no field: nothing in the game protects an enemy. */
check("it reaches your own side only",
  /if \(other\.actor\.type !== actor\.type\) return false;/.test(resolveSource) ? "yes" : "no",
  "yes");
/*
 * An unplaced fight has no geometry, so nothing happens rather than something guessed -- the same
 * choice `neighbours` makes, which is exactly why this has to be read INSIDE grantBlock. The first
 * version of this check matched `neighbours`'s identical line and passed with the guard deleted:
 * the old trap of matching the wrong text, wearing a new hat.
 */
const grantBlockBody = resolveSource.slice(
  resolveSource.indexOf("export async function grantBlock"),
  resolveSource.indexOf("/** Healing draws fate"));
check("and does nothing without a board",
  /if \(!token \|\| !canvas\?\.ready\) return \[\];/.test(grantBlockBody) ? "yes" : "no", "yes");
check("the tray can play the half",
  /case "block": \{/.test(traySource) ? "yes" : "no", "yes");
/* `param` is how much and `area` is how far, which is the pair a Blast already uses. */
check("how much and how far come from the step",
  /amount: step\.param \?\? 0,[\s\S]{0,60}radius: step\.area \?\? 1/.test(traySource)
    ? "yes" : "no", "yes");

/*
 * And the rule, where a reader of the Block subsection will find it. Four turns running the break
 * test caught me writing a decision into a document with no check behind it, so this goes in with
 * the code rather than after it.
 */
check("specializations records the Block grant",
  /^#### Block that reaches somebody else {2}\*\*\[BUILT 2026-11-01\]\*\*$/m.test(specDoc)
    ? "yes" : "no", "yes");
check("and says why it needed no new rule",
  /\*\*Highest wins and the longer duration[\s>]+survives\*\*/.test(specDoc) ? "yes" : "no", "yes");

/* The content: four cards named this gap and the steps are on three of them now. */
const blockSteps = [...graph.POOL.values(), ...graph.SPELLS.values()]
  .flatMap(c => [...(c.primary ?? []), ...(c.secondary ?? []), ...(c.effect ? [c.effect] : [])]
    .filter(st => st.verb === "block").map(st => ({ name: c.name, ...st })));
check("content that gives Block away",
  [...new Set(blockSteps.map(b => b.name))].sort().join(", "),
  "No Step Back, Shield Wall, Shoulder to Shoulder");
check("and every one of them says how much",
  blockSteps.every(b => (b.param ?? 0) > 0), true);
/*
 * Nothing prints a Block GRANT in prose any more, which is this project's recurring defect.
 *
 * Block on yourself is a different thing and stays prose where it belongs: *Play to the Crowd*
 * reads "when you are hit: gain Block 2, and the attacker is Compelled", and its gap is a reaction
 * that does two things at once -- not this. So the test is for an ally in the same sentence, which
 * is the word that makes it a grant.
 */
const printedBlock = [...graph.POOL.values(), ...graph.SPELLS.values()]
  .filter(c => /Block \d/i.test(c.text ?? "") && /all(y|ies)/i.test(c.text ?? ""))
  .map(c => c.name);
check("content still printing a Block grant as prose",
  printedBlock.length ? printedBlock.join(", ") : "none", "none");

/* -------------------------------------------- */

/*
 * Casting a prepared spell, which nothing did until now.
 *
 * `prepared`, `slotCost` and `effect` have all existed since the data model was written, and the
 * only thing that ever read `effect` was this file -- so the audit's largest gap, *a spell that
 * costs Health to cast*, was a price on an action that did not happen. The price turned out to be
 * the smaller half.
 */

section("casting a prepared spell");

const itemsSource = fs.readFileSync(path.join(root, "module/data/items.mjs"), "utf8");

/* A spell is its own weapon: the slate answers the question the attack resolver asks of an item. */
check("a spell answers a cast verb line",
  /get verbs\(\) \{[\s\S]{0,400}cast: \{[\s\S]{0,120}value: e\.mod \?\? 0/.test(itemsSource)
    ? "yes" : "no", "yes");
check("so one resolver serves a card half and a spell alike",
  /const item = source \?\? this\.#itemFor\(step\.verb, half, step\.requires\);/.test(traySource)
    ? "yes" : "no", "yes");
check("a spell's effect runs through the step resolver",
  /await this\.#resolveStep\(slate\.system\.effect, "primary", targets, slate\);/.test(traySource)
    ? "yes" : "no", "yes");

/* The price, and the two rules around it. */
check("the schema carries a cast cost",
  /cost: new fields\.SchemaField\(\{[\s\S]{0,200}health: new fields\.NumberField/.test(itemsSource)
    ? "yes" : "no", "yes");
check("an unprepared spell cannot be cast",
  /if \(!slate\?\.system\?\.prepared\)/.test(resolveSource) ? "yes" : "no", "yes");
/* The floor is 1, not 0: 0 Health is Unconscious, so a self-killing cost is refused, not survived. */
check("the cost may not take you below 1 Health",
  /if \(health - cost < 1\)/.test(resolveSource) ? "yes" : "no", "yes");
check("and paying is what gates the effect",
  /if \(!await payToCast\(this\.actor, slate\)\) return;/.test(traySource) ? "yes" : "no", "yes");

/* The content side. */
const spellsWithCost = [...graph.SPELLS.values()].filter(s => s.cost?.health);
check("spells that cost Health",
  spellsWithCost.map(s => s.name).sort().join(", "),
  "Blood Price, Boil, Open the Vein, Stand Where I Stand, The Club and the Line, "
  + "The Second Heartbeat");
check("the Health they ask between them",
  spellsWithCost.reduce((n, s) => n + s.cost.health, 0), 13);
/* Every one of them is a Blood Magic formula or a miracle of Vax, which is the finding: two Ways
 * arrived at the same mechanism from opposite ends. */
check("the sources that charge in blood",
  [...new Set(spellsWithCost.map(s => s.source))].sort().join(", "), "Blood Magic, Vax");
/*
 * And no FIXED price is still printed in words, now that the field carries it. A price per ally is
 * a different thing: the number depends on where everyone is standing, so it stays prose and its
 * gap says why -- which is the line between the two, and the reason this check has to know it.
 */
const printedCost = [...graph.SPELLS.values()]
  .filter(s => /costs? \d+ Health(?! per)/i.test(s.effect?.text ?? "")).map(s => s.name);
check("spells still printing a fixed cost as prose",
  printedCost.length ? printedCost.join(", ") : "none", "none");
const variableCost = [...graph.SPELLS.values()]
  .filter(s => /Health per/i.test(s.effect?.text ?? ""));
check("spells whose price scales, which the field cannot hold",
  variableCost.map(s => s.name).sort().join(", "), "The Red Hour, The Shield Line");
check("and every one of them says so in the queue",
  variableCost.every(s => s.needs.includes("a cost that scales with the allies it covers")),
  true);

/*
 * And the reason the column is a list, written where a reader of the column will find it. Four
 * turns running now the break test has caught me writing a decision into a document with no check
 * behind it, so this one goes in beside the code that implements it.
 */
check("way-cards says why the audit column is a list",
  /\*\*\[BUILT 2026-11-01\] `needs` is a LIST, and the Health cost is why\.\*\*/.test(wayDoc)
    ? "yes" : "no", "yes");
check("and separates mentioned from finished",
  /how many it is the \*\*last thing standing\*\* for/.test(wayDoc) ? "yes" : "no", "yes");

/* The tray has somewhere to cast from, and the book is not clickable. */
check("the tray offers a spells deck",
  /id: "spells",/.test(traySource) ? "yes" : "no", "yes");
check("and only a prepared spell is clickable",
  /passive: !prepared,/.test(traySource) ? "yes" : "no", "yes");

/* -------------------------------------------- */

/* Slates are handed over the same way cards are, and through one shape. */
/* The documents say the same things, so the content and the rules cannot drift apart. */
check("way-cards records the audit",
  /All twelve exist as content now, and four of them work/.test(wayDoc) ? "yes" : "no", "yes");
check("way-cards says a Tactic is derived, not granted",
  /A Tactic is derived from your deepest title, never granted/.test(wayDoc) ? "yes" : "no", "yes");
check("leveling says where a Signature's numbers live",
  /The same asymmetry decides where a Signature's numbers live/.test(levDoc) ? "yes" : "no", "yes");
check("the sheet prints the live Tactic",
  /\{\{system\.tactic\.name\}\}/.test(charTemplate) ? "yes" : "no", "yes");

check("a node's feature and item grants are performed",
  /if \(grants\.feature\) await grantSlate\(actor, grants\.feature, "feature"\);/.test(graphSource)
  && /if \(grants\.item\) await grantSlate\(actor, grants\.item, "item"\);/.test(graphSource)
    ? "yes" : "no", "yes");
check("through the setup routine's own slate shape",
  /import \{ slateData \} from "\.\/setup\.mjs";/.test(graphSource) ? "yes" : "no", "yes");
check("and a slate nobody built is refused rather than silently skipped",
  /CARDRPG\.Level\.NoSlate/.test(graphSource) ? "yes" : "no", "yes");

/* -------------------------------------------- */

console.log(failures
  ? `\n${failures} FAILURE${failures === 1 ? "" : "S"}`
  : "\nall checks pass");
process.exit(failures ? 1 : 0);
