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
check("manifest declares Card subtypes", Object.keys(manifest.documentTypes.Card ?? {}).length, 5);
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
  check("conditions found in config", conditions.size, 21);

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
  check("conditions that can be shaken off", shakeable.length, 12);

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
  check("removed by Shake Off", buckets.shake ?? 0, 12);
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
check("stepField keys read from source", stepKeys.size, 15);

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
check("triggers declared", triggers.join(", "), "hit, allyHit, arrival");

const reactionLines = [...reactionBlock
  .slice(reactionBlock.indexOf("CARDRPG.reactions = {"))
  .matchAll(/^  ([a-zA-Z]+): \{([^}]*)\}/gm)]
  .map(m => ({ key: m[1], body: m[2] }));
check("reactions declared", reactionLines.map(r => r.key).join(", "),
  "parry, block, sidestep, counter, use, bodyguard");

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
  "sidestep, counter");
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
const carried = [...content.WARRIOR_DECK, ...content.WAY_CARDS];
const printed = carried.filter(c => c.reaction);
check("starter cards with a printed reaction",
  content.WARRIOR_DECK.filter(c => c.reaction).length, 4);
check("cards with a printed reaction", printed.length, 6);
const strayPrinted = printed.filter(c => !reactionKeys.includes(c.reaction))
  .map(c => `${c.name}: ${c.reaction}`);
check("cards printing a reaction that does not exist",
  strayPrinted.length ? strayPrinted.join(", ") : "none", "none");
/*
 * Bodyguard is implemented against nothing: it is in the config, the resolver fires it, and no card
 * in the game prints it. That is worth asserting rather than leaving to be noticed, and it is why
 * equipment.md 12 carries it as an [OPEN].
 */
const unprinted = reactionKeys.filter(k => !printed.some(c => c.reaction === k));
check("reactions no card prints", unprinted.length ? unprinted.join(", ") : "none", "bodyguard");
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
check("the school it prices knows the card exists",
  /\*\*the card exists now\*\* \(core-rules §6\)/.test(
    fs.readFileSync(path.join(root, "../../rules/specializations.md"), "utf8")) ? "yes" : "no", "yes");
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
check("whose it is, is open",
  /\*\*\[OPEN\]\*\* who gets it\./.test(coreRules) ? "yes" : "no", "yes");

/* -------------------------------------------- */

console.log(failures
  ? `\n${failures} FAILURE${failures === 1 ? "" : "S"}`
  : "\nall checks pass");
process.exit(failures ? 1 : 0);
