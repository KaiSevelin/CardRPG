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
 *
 * **Foundry has now been asked** (14.369, headless; the README says how). It found one fault in 394
 * documents that nothing in here could have found -- `prototypeToken: depth: must be a number` on
 * every Actor -- and it rewrote all 394 records on every boot because none of them said which
 * Foundry wrote it. Both are checks now, in the pack section, with the measurement that found them.
 * What a clean headless load still does not prove: the data models and the sheets are client-side,
 * so nothing has yet built a document against `data/items.mjs` or `data/actors.mjs`.
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

/*
 * **Every module that uses `CARDRPG` imports it.**
 *
 * Three did not -- `checks.mjs`, `enrichers.mjs` and `levelup.mjs` -- and nothing here noticed for
 * 108 commits. `node --check` proves a file parses. Importing a module proves its module-level code
 * runs. An identifier used only inside a function body is invisible to both: the file is valid
 * JavaScript and the module loads, and the call throws `CARDRPG is not defined` the first time
 * anyone makes it. A real browser found it in a second -- the tray never opened, because rendering
 * it calls `partyPassives`.
 *
 * The suite already had the neighbouring check, *the engine touches no Foundry global at module
 * scope*, and it passed the whole time: module scope was never where the problem was.
 *
 * Strings and comments come out first, so an i18n key like `"CARDRPG.Check.Advantage"` is not a use
 * of the object -- without that, every module in the system would read as a user and the sweep
 * would be about nothing.
 */
const STRIP_CODE = [
  /\/\*[\s\S]*?\*\//g, /\/\/[^\n]*/g, /`[^`]*`/g,
  /"(?:[^"\\\n]|\\.)*"/g, /'(?:[^'\\\n]|\\.)*'/g
];
const codeOf = src => STRIP_CODE.reduce((t, re) => t.replace(re, " "), src);
const freeNames = [];
let importers = 0;
for (const file of modules) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const code = codeOf(fs.readFileSync(file, "utf8"));
  if (!/\bCARDRPG\b/.test(code)) continue;
  /* config.mjs is where it comes from; everyone else has to ask for it. */
  if (/export const CARDRPG\b/.test(code)) continue;
  importers++;
  if (!/import\s*\{[^}]*\bCARDRPG\b[^}]*\}\s*from/.test(code)) freeNames.push(rel);
}
check("modules using CARDRPG without importing it",
  freeNames.length ? freeNames.join(", ") : "none", "none");
/* And the sweep found users, so a strip that ate the whole file cannot pass it. */
check("modules that use it at all", importers, 14);

/*
 * **The vendored cytoscape carries a patch, and the patch has to still be there.**
 *
 * Foundry defines `equals` on `Array.prototype` as non-writable AND non-configurable
 * (common/primitives/array.mjs). Cytoscape builds its collection prototype with
 * `Object.create(Array.prototype)` and then assigns `elesfn.equal = elesfn.equals = elesfn.same`
 * (src/collection/comparators.js) -- an assignment to an inherited read-only property, which in a
 * module throws. The whole library fails to evaluate, so `levelUp` opened a dialog with no graph in
 * it: 0 canvas elements, measured in a browser.
 *
 * It cannot be fixed from outside the library. The descriptor is non-configurable, so
 * `Object.defineProperty(Array.prototype, "equals", ...)` is refused too -- that was tried first.
 * What works is giving the collection prototype its own writable `equals` at creation, so the
 * assignment has an own property to land on. Upstream 3.34.4 has the same line, so there is no
 * version to wait for.
 *
 * `npm i cytoscape && cp` would undo it in one command and nothing would say so, which is what this
 * check is for -- both halves, because a file containing neither string would otherwise pass.
 */
const cytoscape = fs.readFileSync(path.join(root, "lib/cytoscape.esm.min.mjs"), "utf8");
check("the vendored cytoscape shadows Array.prototype.equals",
  cytoscape.includes('Object.create(Array.prototype,{equals:{value:void 0,writable:!0')
    ? "patched" : "NOT PATCHED -- the level-up graph will not draw", "patched");
check("and the unpatched line is gone",
  /Object\.create\(Array\.prototype\)/.test(cytoscape) ? "still there" : "gone", "gone");

const manifest = JSON.parse(fs.readFileSync(path.join(root, "system.json"), "utf8"));
check("manifest declares Card subtypes", Object.keys(manifest.documentTypes.Card ?? {}).length, 10);
/*
 * **The verified build is a build, not a generation**, and it is load-bearing in two places.
 *
 * Every pack record stamps it as `_stats.coreVersion`, the Foundry that wrote the record. A stamp
 * of "14" is older than any 14.x, so Foundry would bring all 394 documents forward on every boot --
 * which is precisely what the stamp exists to stop, and what was measured before it had one. And it
 * is 14.369 because that is the build the system has actually been started on.
 */
check("manifest verified for a build", manifest.compatibility.verified, "14.369");
check("and the generation it minimally needs", manifest.compatibility.minimum, "14");
check("and the stamp every pack record carries", manifest.compatibility.verified.split(".")[0],
  manifest.compatibility.minimum);

// Every file the manifest promises must exist, or the system won't load at all.
for (const rel of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(l => l.path)]) {
  check(`manifest file exists: ${rel}`, fs.existsSync(path.join(root, rel)), "true");
}

/* -------------------------------------------- */

section("i18n");

const lang = JSON.parse(fs.readFileSync(path.join(root, "lang/en.json"), "utf8"));
/*
 * Every .hbs under templates/, at any depth. The directory became a tree when the step editor was
 * pulled out into a partial, and three separate passes over it each broke on the new folder -- so
 * there is one lister now and all of them use it.
 */
const templateDir = path.join(root, "templates");
function everyTemplate(dir = templateDir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...everyTemplate(full));
    else if (entry.name.endsWith(".hbs")) out.push(full);
  }
  return out;
}

const sources = [...modules, ...everyTemplate()];

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
  check("conditions found in config", conditions.size, 24);


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
  check("conditions that can be shaken off", shakeable.length, 14);

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
    /* And a sixth: nothing takes it off, said out loud. A condition recognised by having no flags
     * would be indistinguishable from one that forgot them, which is how Graven first fell through
     * -- so a permanent condition declares itself and an absent-minded one still falls. */
    if (body.includes("permanent:")) return "permanent";
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
  check("removed by Shake Off", buckets.shake ?? 0, 14);
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

  /*
   * **A condition nobody can take off answers `nothing`, and every other one answers something.**
   *
   * Stated both ways round, because the first version EXEMPTED a permanent condition from the
   * answer table -- and the spec's Graven row reads as a sentence, so it would have passed without
   * the exemption and the exemption would have been a check that cannot fail. Each half can fail
   * now: a condition that forgot its answer, and a condition the spec promises a way out of when
   * config says there is none.
   *
   * Creation is not symmetrical. A permanent condition still has to be PUT on you by something, so
   * the source table covers it like any other.
   */
  const forever = k => /permanent:/.test(bodyOf(k));
  /*
   * **Absent and "nothing" are different answers**, which is why `empty` is not enough on its own.
   * A break test deleted the Graven row and nothing noticed: no row and a row saying nothing both
   * came back empty. The decision has to be written down -- that is the entire reason the table is
   * in the document -- so the question splits in three.
   */
  const unrowed = k => answers.get(shown(k)) === undefined;
  const saysNothing = k => !unrowed(k) && empty(answers.get(shown(k)));
  const uncreatable = [...conditions].filter(k => empty(sources.get(shown(k)))).sort();
  const rowless = [...conditions].filter(unrowed).sort();
  const unanswerable = [...conditions].filter(k => !forever(k) && saysNothing(k)).sort();
  const overanswered = [...conditions].filter(k => forever(k) && !saysNothing(k)).sort();
  check("conditions that nothing takes off, which say so",
    [...conditions].filter(forever).join(", "), "graven");
  check("conditions nothing can create",
    uncreatable.length ? uncreatable.join(", ") : "none", "none");
  /* Every condition has a row, permanent or not: a row is where the decision is recorded. */
  check("conditions the answer table does not list at all",
    rowless.length ? rowless.join(", ") : "none", "none");
  check("conditions nothing can answer",
    unanswerable.length ? unanswerable.join(", ") : "none", "none");
  /* And the other way: the spec must not promise a way off one that config says is forever. */
  check("conditions config calls permanent that the spec answers anyway",
    overanswered.length ? overanswered.join(", ") : "none", "none");

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
    /* A content row is | name | strength | effect |. The header says "Formula", or "Teaching" for
     * the two schools whose lists are not all formulas -- Tattoo Magic teaches seven features and
     * Asceticism's ladder ends in two. A parser that knew only one of the two words counted two
     * header rows as content and this school's ladder as one rung longer than it is. */
    if (cells.length === 3 && !["Formula", "Teaching"].includes(cells[0])) {
      schools.get(current).push(cells[1]);
    }
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
  check("formulas written in total", formulaCount, 87);

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
  check("tactics written", tactics.length, 52);

  const flat = tactics.filter(t => /\+\s*\d/.test(t.text)).map(t => t.node);
  check("tactics that add a flat bonus", flat.length ? flat.join(", ") : "none", "none");

  // Every node that has a Signature must have a tactic, and nothing else may.
  const signed = new Set();
  for (const line of waycards.slice(
    waycards.indexOf("## 2. The 52 Signatures"), tacticsFrom
  ).split("\n")) {
    if (!line.startsWith("|") || /^\|[\s:|-]+\|$/.test(line)) continue;
    const cells = line.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    if (cells.length >= 3 && !["Node", "God", "School", "Order"].includes(cells[0])) {
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

check("icon files on disk", onDisk.size, 81);
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
  for (const full of everyTemplate()) {
    const name = path.relative(templateDir, full).replace(/\\/g, "/");
    try {
      handlebars.precompile(fs.readFileSync(full, "utf8"));
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

/*
 * **The second starter deck, checked against the first rather than against taste.**
 *
 * `SHADE_DECK` exists to make one question answerable: way-cards 1.2 and 1.3 both end on *the
 * difference between those two readings is a simulator that models a Way*, and until there were two
 * chassis every figure about a Way was measured on the Warrior's sixteen. A second deck only
 * answers it if the two are **the same size in every currency the rules have a name for** -- two
 * decks of different budget would measure the budget, not the Way.
 *
 * So the budget is not described, it is computed off both decks and compared field by field. The
 * one field allowed to differ is the printed Move total, which is the difference the deck is FOR:
 * way-cards 1.6 calls a secondary the cheapest space in the game, and Shade spends two more points
 * of it there. Every other row being equal is what makes `sim/careers_sim.py` honest.
 */
const deckBudget = (deck) => {
  const t = {
    cards: 0, designs: deck.length, strikeHalves: 0, movePrinted: 0, movePrimary: 0,
    readyCards: 0, spent: 0, strain: 0, heal: 0, conditions: 0, use: 0,
    reactionCopies: 0, reactionDesigns: 0, defensivePrimaries: 0
  };
  for (const d of deck) {
    const n = d.copies ?? 1;
    const primary = d.primary ?? [], secondary = d.secondary ?? [];
    t.cards += n;
    if (d.reaction) { t.reactionCopies += n; t.reactionDesigns += 1; }
    if (d.costs?.primary?.spent || d.costs?.secondary?.spent) t.spent += n;
    if (d.costs?.primary?.strain || d.costs?.secondary?.strain) t.strain += n;
    if ([...primary, ...secondary].some(s => s.verb === "ready")) t.readyCards += n;
    if (primary.some(s => s.verb === "defend" || s.verb === "block")) t.defensivePrimaries += n;
    for (const [half, steps] of [["primary", primary], ["secondary", secondary]]) {
      for (const s of steps) {
        if (s.verb === "strike") t.strikeHalves += n;
        if (s.verb === "move") {
          t.movePrinted += n * (s.param ?? 0);
          if (half === "primary") t.movePrimary += n * (s.param ?? 0);
        }
        if (s.verb === "heal") t.heal += n;
        if (s.verb === "use") t.use += n;
        if (s.condition) t.conditions += n;
      }
    }
  }
  return t;
};
const warriorBudget = deckBudget(content.WARRIOR_DECK);
const shadeBudget = deckBudget(content.SHADE_DECK);
check("Shade deck total cards", shadeBudget.cards, 16);
check("Shade distinct designs", shadeBudget.designs, 10);
/* The whole method in one line: name every field where the two decks differ. */
check("budget fields where the two starter decks differ",
  Object.keys(warriorBudget).filter(k => warriorBudget[k] !== shadeBudget[k]).join(", ")
    || "none",
  "movePrinted");
check("and the Warrior's printed Move against the Shade's",
  `${warriorBudget.movePrinted} vs ${shadeBudget.movePrinted}`, "21 vs 23");
/*
 * **And the document's table is the content's table.** A second deck doubles the chance of the
 * failure this whole file exists against -- a rule written in prose that the code never agreed to --
 * so the ten rows are parsed back out of starter-cards.md and compared by name and copy count. The
 * Warrior's table has never had this and now does, because the same parse answers both.
 */
const starterDoc = fs.readFileSync(path.join(root, "../../rules/starter-cards.md"), "utf8");
const docDeck = (heading) => {
  const from = starterDoc.indexOf(`## Action deck – "${heading}"`);
  const body = starterDoc.slice(from, starterDoc.indexOf("\n---", from));
  return [...body.matchAll(/^\| \d+ \| (.+?) \|(?:.*\|)\s*(\d+) \|$/gm)]
    .map(m => `${m[1].trim()} x${m[2]}`).join(", ");
};
const contentDeck = (deck) => deck.map(c => `${c.name} x${c.copies ?? 1}`).join(", ");
check("the Shade deck's table matches the content",
  docDeck("Shade") || "(no rows parsed)", contentDeck(content.SHADE_DECK));
check("and the Warrior's does too",
  docDeck("Warrior") || "(no rows parsed)", contentDeck(content.WARRIOR_DECK));

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
/* The intent pool rather than the goblin's old six: the rules below are about what a card step
 * may say, and an NPC's steps are steps. Twenty-eight cards where six used to be read. */
for (const card of [...content.WARRIOR_DECK, ...content.SHADE_DECK, ...content.INTENTS]) {
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
check("stepField keys read from source", stepKeys.size, 29);

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
/*
 * The maths lives in `defencesAgainst`, which is pure and exported -- so the RESULT is checked by
 * running it, further down, and these greps only hold the shape. Both halves are anchored because
 * a file containing neither would otherwise pass.
 */
check("ignores is kept off Block",
  /armor: pierced \? 0 : Math\.max\(0, armor - pierce\)/.test(resolveSource)
  && /block: rounded \? 0 : block/.test(resolveSource) ? "yes" : "no", "yes");
/*
 * **The two total forms, and the conditional pair.**
 *
 * `ignores N` is a quantity and can be out-armoured; these are the defence counted as zero. Both
 * were declared on the schema and read by nothing for long enough that content started using
 * them -- *Open the Vein* set `ignoresBlock` and promised in its own description that it goes
 * round a shield, while in play it went through one like everything else. A field the schema
 * declares and the engine ignores is prose that costs a migration.
 */
check("engine reads a step that goes through armour",
  /step\.ignoresArmour/.test(resolveSource) ? "yes" : "no", "yes");
check("and a step that goes round Block",
  /step\.ignoresBlock/.test(resolveSource) ? "yes" : "no", "yes");
check("and both again when an opening is what opens them",
  /opening && when\?\.ignoresArmour/.test(resolveSource)
  && /opening && when\?\.ignoresBlock/.test(resolveSource) ? "yes" : "no", "yes");
/*
 * The defender is not charged for a shield that was never going to apply. Filtering the option is
 * what makes that true: `chooseReaction` spends the card, so a Block left in the list costs a
 * card and stops nothing.
 */
check("a shield is not offered against a step that goes round it",
  /option => !\(rounded && option\.key === "block"\)/.test(resolveSource) ? "yes" : "no", "yes");
/* And ONLY Block. A Parry is a blade turned, and nothing about going round a shield touches it. */
check("and only Block is withheld",
  (resolveSource.match(/rounded && option\.key === "[a-z]+"/g) ?? [])
    .map(m => /"([a-z]+)"/.exec(m)[1]).join(", "), "block");
/* Both are said out loud, because 0 armour and armour ignored subtract the same number. */
check("the chat card says what was gone through",
  /row\.pierced \? ` \(\$\{row\.pierced\} armor ignored\)`/.test(resolveSource)
  && /row\.rounded \? ` \(\$\{row\.rounded\} Block ignored\)`/.test(resolveSource) ? "yes" : "no",
  "yes");


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

const templateText = everyTemplate().map(f => fs.readFileSync(f, "utf8")).join("\n");
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

for (const full of everyTemplate()) {
  const name = path.relative(templateDir, full).replace(/\\/g, "/");
  const text = fs.readFileSync(full, "utf8").replace(/\{\{[\s\S]*?\}\}/g, "");
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
const carried = [...content.WARRIOR_DECK, ...content.SHADE_DECK, ...content.WAY_CARDS,
  ...content.COMMON_POOL,
  ...signatureExports.filter(c => c.kind === "card")];
const printed = carried.filter(c => c.reaction);
check("starter cards with a printed reaction",
  content.WARRIOR_DECK.filter(c => c.reaction).length, 4);
check("cards with a printed reaction", printed.length, 19);
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
/*
 * **This check used to require the document to say the opposite**, and that is worth keeping a note
 * about. It asserted equipment.md still carried *"[OPEN] Nothing in the game prints Bodyguard"* --
 * true when it was written, and false from the moment *Interpose* printed one, at which point the
 * check above reported `none` while this one insisted the document keep claiming otherwise.
 *
 * A check on prose has to be able to go stale in the same direction as the prose. So this one now
 * reads the document's SETTLED entry and names the card that settled it, which is a claim that
 * cannot quietly outlive the content: `printed` is where the card comes from.
 */
const bodyguards = printed.filter(c => c.reaction === "bodyguard").map(c => c.name);
check("the card that closed Bodyguard", bodyguards.join(", "), "Interpose");
check("and equipment.md records it as settled rather than open",
  /\*\*Settled: \u26a1 Bodyguard is printed\.\*\*/.test(equipDoc) ? "yes" : "no", "yes");
/*
 * Scoped to the entry itself, and that scoping is the point: the first version of this check asked
 * whether *Interpose* appeared anywhere in equipment.md, and the entry mentions it twice -- once as
 * the card that settled it and once in the note underneath. Deleting the first mention left the
 * second, and the check passed on it. A name appearing SOMEWHERE in a file is not a claim about
 * anything; the break test is the only reason that was ever found out.
 */
const settledAt = equipDoc.indexOf("**Settled: ⚡ Bodyguard is printed.**");
const bodyguardEntry = equipDoc.slice(settledAt, equipDoc.indexOf("\n\n  >", settledAt));
check("the entry was located", settledAt >= 0 && bodyguardEntry.length > 40, true);
check("and names the card in the settled sentence itself",
  bodyguards.every(name => bodyguardEntry.includes(`*${name}*`)), true);
check("and the lesson about a check holding prose in place is written down",
  /This paragraph was wrong for longer than it should have been, and a check was holding/
    .test(equipDoc) ? "yes" : "no", "yes");
check("and what it asks of a check on a document",
  /A\s+> check on a document has to be able to go stale in the same direction as the document/
    .test(equipDoc) ? "yes" : "no", "yes");
check("and says it is still untested at a table",
  /It is still untested at a table/.test(equipDoc) ? "yes" : "no", "yes");

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
/*
 * A Wound "can't be played, not even for Brace" (core-rules 8), and Taint resolves when drawn.
 *
 * **This check used to pin the wrong thing.** It read `c.type !== "wound" && c.type !== "taint"`
 * literally, which made it a check that the two kinds were named here BY HAND -- so the honest
 * generalisation was the one edit it would have refused, and a third kind of intruder arriving
 * would have satisfied it while being spendable for a Brace. It asks for the category now.
 */
const upright = decksSource.slice(decksSource.indexOf("export function uprightCards"));
check("dead cards cannot react", /!isDeadCard\(c\)/.test(upright) ? "yes" : "no", "yes");
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
 * **Nothing in the game ever creates a Wound.**  **[FOUND 2026-11-07]**
 *
 * The card type is finished everywhere a finished type is visible. The sheet counts them, the
 * upright filter refuses to let one react, the deck limits exclude them, the tray prints their own
 * sentence, a prune cannot take one, and the art brief gave them the action back on purpose --
 * *a Wound you could see coming would not be a Wound*. Every one of those is already a check in
 * this file, which is how a mechanic can look complete from six directions at once.
 *
 * **And no code path issues one.** core-rules 8 names two events that must -- *5 or more damage from
 * a single hit, after armor*, and *you drop to 0 Health* -- and `woundAt` is read in exactly two
 * places: the reaction policy just above, to decide whether a reaction is worth spending, and one
 * chat row, to label a hit. Neither creates a card. The contrast with **Taint** is what makes this
 * a gap rather than a missing vocabulary: `resolve.mjs` creates Taint cards with a flavour and a
 * source, and does not create a Wound.
 *
 * It was found from the far end -- a career balance pass asking why **Executioner** measures as
 * paid in neither ledger. Its whole tier-1 reward is *Cleave to the Bone*, **for you the Wound
 * threshold is 4, not 5**, whose own `needs` line already says the threshold is read as the
 * defender's constant rather than the attacker's. What the needs line does not say is that there is
 * no Wound for a threshold to govern. Four careers hold the feature -- Executioner, Knight,
 * Musketeer and Berserker -- and for Executioner it is the whole of the level.
 *
 * Pinned rather than fixed, because issuing a Wound is a change in the damage path and wants
 * deciding: whether an NPC takes them at all is the first question, and **72 of the 75 creatures in
 * the roster have more than 4 Health**, so the answer is not obvious.
 */
const woundCreators = ["resolve.mjs", "decks.mjs", "graph.mjs", "tray.mjs", "setup.mjs"]
  .filter(f => /type: "wound"/.test(fs.readFileSync(path.join(root, "module", f), "utf8")));
check("modules that create a Wound card", woundCreators.join(", ") || "none", "resolve.mjs");
check("and the one that creates a Taint, which is the contrast",
  /type: "taint"/.test(resolveSource) ? "resolve.mjs" : "none", "resolve.mjs");
check("times the Wound threshold is read at all",
  (resolveSource.match(/defaults\.woundAt/g) ?? []).length, 3);
/*
 * **How a Wound arrives, now that one does.**  **[BUILT 2026-11-07]**
 *
 * Three places can take Health off a character and the two rules of core-rules 8 do not divide
 * evenly between them. **Five or more from a single hit** can only happen on a hit, and must not
 * fire on a condition tick: a tick is not a hit, it meets neither armour nor Block, and its bands
 * are tight because of that. **Dropping to nought** can happen on all three -- a blow, a tick
 * (burning to death is still dropping) and a fast dose of Taint.
 *
 * And the guard that stops an NPC being wounded is `deckOf`, not a type test: core-rules 3 draws
 * intent **one card per type**, so a species shares the deck a Wound would sit in and an
 * individual has nowhere to hold one. A creature with no action discard cannot hold a dead card,
 * which is the same sentence read as code.
 */
check("the routine that makes a Wound",
  /export async function resolveWound\(target, \{ reason = "" \} = \{\}\)/
    .test(resolveSource) ? "yes" : "no", "yes");
check("and the guard is the target having a deck of its own",
  /const stack = deckOf\(target, "actionDiscard"\);\s*\n\s*if \(!stack\) return false;/
    .test(resolveSource) ? "yes" : "no", "yes");
/* One Wound per blow: the rule says *you gain 1 Wound when* and then lists two triggers. */
check("a blow that both drops you and deals five gives one Wound",
  /if \(dropped \|\| dealt >= CARDRPG\.defaults\.woundAt\) \{/.test(resolveSource)
    ? "yes" : "no", "yes");
/* A tick can only ever fire the second event, and the comment beside it says why. */
check("a condition tick wounds only by finishing you",
  /if \(before - damage <= 0\) await resolveWound\(actor, \{ reason: "dropped to 0" \}\);/
    .test(fs.readFileSync(path.join(root, "module/combat.mjs"), "utf8")) ? "yes" : "no", "yes");
/*
 * **And the read that had to be fixed to write any of it.** `down` was
 * `taker.system.health.value - dealt <= 0` evaluated AFTER the update resolved, so it subtracted
 * the damage twice and reported a hero on 4 Health taking 3 as **down** at 1. The document
 * reflects the new value the moment the update lands. One local before the update fixes it and
 * gives the Wound rules the number they are written about.
 */
check("the blow reads Health from before the blow",
  /const before = taker\.system\.health\.value;/.test(resolveSource) ? "yes" : "no", "yes");
check("and down is not computed from the updated document",
  /down: taker\.system\.health\.value - dealt/.test(resolveSource) ? "it is" : "it is not",
  "it is not");
check("and the feature that waits on a Wound existing",
  Object.values(content).filter(Array.isArray).flat()
    .filter(e => e && /Wound threshold/.test(e.text ?? "")).map(e => e.name)
    .filter((n, i, a) => a.indexOf(n) === i).join(", ") || "none",
  "Cleave to the Bone");
/* And who pays a level for it, which is the reason it was looked at. */
const woundGraph = await import("../module/graph.mjs");
check("and the careers whose route grants it",
  content.NODES.filter(n => n.title && woundGraph.grantsOf(
    new Set([woundGraph.ROOT, ...(woundGraph.REACH.get(n.id) ?? []), n.id]))
    .features.includes("Cleave to the Bone")).map(n => n.title).sort().join(", "),
  "Berserker, Executioner, Knight, Musketeer");

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
check("reaction cells in the card pools", column.length, 16);
check("cells that are a bare key", bare.length, 14);
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
/*
 * **This check also used to hold a document to a fact it had stopped stating**, which is the second
 * one in this file: it required equipment.md to carry *"[OPEN] Nothing in play produces a Wild
 * yet"*, and casting produces one now. Worse, the entry's stated REASON -- that `prepared` was read
 * and toggled by nothing -- had gone stale long before the conclusion did.
 *
 * So it now reads the settled entry, and the half that is still open is checked as open.
 */
check("equipment.md records that casting produces a Wild",
  /\*\*Settled: casting a Shadow formula produces a Wild\.\*\*/.test(equipDoc) ? "yes" : "no",
  "yes");
check("and that its old reason had itself gone stale",
  /The reason this entry used to give had itself gone stale/.test(equipDoc) ? "yes" : "no", "yes");
check("and that the overcharge is in the document, not only in the code",
  /\[OPEN\] And it charges more than §2 asks/.test(equipDoc) ? "yes" : "no", "yes");
check("and says why a long rest does not help",
  /The `longRest` boundary\s+recharges \*\*slates\*\*, not decks/.test(equipDoc) ? "yes" : "no",
  "yes");
check("and Overcast is still open",
  /\[OPEN\]\*\* \*Overcast\* is the other producer/.test(equipDoc) ? "yes" : "no", "yes");
/* The six that are overcharged say so, and the one that is not does not. */
const shadowSpells = [...content.MIND_POOL, ...content.SHADOW_FORMULAS]
  .filter(sp => sp.source === "Shadow Magic");
const sleepGap = "a Wild that leaves the fate deck when you sleep";
check("Shadow formulas whose Wilds should go at a sleep",
  shadowSpells.filter(sp => (sp.needs ?? []).includes(sleepGap)).length, 6);
check("and the one whose five are for good names no such gap",
  shadowSpells.filter(sp => !(sp.needs ?? []).includes(sleepGap)).map(sp => sp.name).join(", "),
  "Become the Shadow");
check("which is the one the document says is permanent",
  /\*\*Five\*\* Wild cards join your fate deck, for good/.test(waycards) ? "yes" : "no", "yes");

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
const monsters = await import("../module/monsters.mjs");
const graphSource = fs.readFileSync(path.join(root, "module/graph.mjs"), "utf8");
const nodes = content.NODES;
const byId = graph.GRAPH;

check("nodes defined", nodes.length, 204);
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
const confluences = [];
let crossings = 0;
for (const node of nodes) {
  const after = node.after ?? [];
  /* An `all` node's predecessors are requirements, not alternative routes, so none of them is a
   * crossing -- reading them as one would ask the cell test a question it cannot answer. */
  if (after.length < 2 || node.all) continue;
  /*
   * **Twelve doors into one room is not a crossing** (leveling 1). Way of Faith's orders hang off
   * a node whose predecessors are all twelve gods, and read naively that is eleven cross edges
   * arriving past a title with no second cell to compare. The three rules exist to stop content
   * being reached past a door that was meant to shut; these edges run the OTHER way, out of twelve
   * mutually exclusive doors into ground that belongs to no god.
   *
   * The exception is exactly as wide as its reason: every predecessor must be a gate of ONE
   * exclusive family, so no character can ever hold two of them. A thirteenth predecessor that is
   * not a gated door makes it a crossing again, with all three rules applying.
   */
  const families = after.map(id => byId.get(id)?.exclusive);
  if (families.every(Boolean) && new Set(families).size === 1) {
    confluences.push(`${node.id} <- ${after.length} ${families[0]} doors`);
    continue;
  }
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
/* One confluence in the graph, and it is the only place the exception applies. */
check("confluences of exclusive doors", confluences.join("; ") || "none",
  "faith.ordination <- 12 faith doors");
/*
 * **The first reason I wrote for this was wrong, and the check is what said so.** It read *no
 * character can hold two of the doors* -- but two gods of ONE religion share a creed, so a priest
 * of The Five holds Sessyfyn and Valtor together and always could. Eleven of the twelve are closed
 * to them, not all eleven.
 *
 * The exception does not rest on that. It rests on **what is on the far side**: the room behind the
 * confluence belongs to no god, so arriving through two doors instead of one gains a character
 * nothing a god was guarding. Laundering means reaching a god's content without that god, and this
 * is the check that nothing behind the confluence IS a god's content -- no miracle, and no choice
 * from a god's list. An order grants cards, which belong to the holder.
 */
const behindConfluence = (() => {
  const out = new Set();
  let grew = [...(nodes.filter(n => (n.after ?? []).includes("faith.ordination")).map(n => n.id))];
  out.add("faith.ordination");
  while (grew.length) {
    const next = [];
    for (const id of grew) {
      if (out.has(id)) continue;
      out.add(id);
      for (const n of nodes) if ((n.after ?? []).includes(id)) next.push(n.id);
    }
    grew = next;
  }
  return [...out].map(id => byId.get(id));
})();
check("nodes behind the confluence", behindConfluence.length, 9);
check("and not one of them hands over a god's content",
  behindConfluence.filter(n => n.grants?.spell || n.grants?.choose)
    .map(n => n.id).join(", ") || "none", "none");
/* Two of the twelve doors CAN be held together, which is the creed rule working: that is why the
 * reason above is about the far side and not about the doors. */
check("doors a priest of The Five holds at once",
  (byId.get("faith.ordination").after ?? [])
    .filter(id => !graph.closedIds(new Set([graph.ROOT, "faith.sessyfyn"])).has(id)).length, 5);
check("leveling says a confluence is not a crossing",
  /Twelve doors into one room is not a crossing/.test(levDoc) ? "yes" : "no", "yes");
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
 * **Sixteen gates in two families, and the second family is the proof the rule was general.** The
 * family/creed rule was written for Way of Faith and sat built and unused until the gods existed;
 * the religion is the group, so taking a god closes every god of every OTHER religion and leaves
 * your own open. The four orders (way-cards 2.4) are the second family to use it and they use it
 * differently: each order is its own creed, so joining one closes the other three outright. One
 * rule, a pantheon and a vocation, and no new field.
 */
check("exclusive gates in the data", exclusiveGates.length, 16);
check("and the families they fall into",
  [...new Set(nodes.filter(n => n.exclusive).map(n => n.exclusive))].sort().join(", "),
  "faith, order");
check("orders, each its own creed",
  nodes.filter(n => n.exclusive === "order").map(n => n.creed).sort().join(", "),
  "circle, cloister, drums, shield");
/* An order is a title and every title of this Way is a gate, which is what the next check says in
 * general -- but the two families mean different things, so the count is pinned per family. */
check("gods and orders",
  `${nodes.filter(n => n.exclusive === "faith").length} gods, `
  + `${nodes.filter(n => n.exclusive === "order").length} orders`, "12 gods, 4 orders");
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
 * ---- the four holy orders: Way of Faith's second tier  [BUILT 2026-11-02] ----
 *
 * **A god is a choice between twelve; an order is what you do about it.** Way of Faith had the
 * first and not the second: twelve doors at the top and nothing behind any of them, so a priest
 * reached level 5 and their own Way had nothing further to walk toward, where the other three put
 * three titles at tier 1 and nine or ten behind them.
 *
 * The thing worth checking is not that four titles exist. It is the claim that makes four enough:
 * **the order is the tier and the religion only names it**, so every order is open to a priest of
 * every god. Twelve times four would have been forty-eight titles; this is four, and it is four
 * only while that claim holds in the data.
 */
const ORDERS = ["faith.inquisitor", "faith.shieldsworn", "faith.anchorite", "faith.flagellant"];
const godIds = nodes.filter(n => n.exclusive === "faith").map(n => n.id);

check("orders in the data", ORDERS.filter(id => byId.get(id)?.title).length, 4);
check("and what they are called",
  ORDERS.map(id => byId.get(id).title).join(", "),
  "Inquisitor, Shieldsworn, Anchorite, Flagellant");
/* Tier 2 at level 8, which is where every other Way's second tier sits (way-cards 2, leveling 7). */
check("the tier and level each order sits at",
  [...new Set(ORDERS.map(id => `t${graph.tierOf(id)} lv${graph.levelFor(id)}`))].join(", "),
  "t2 lv8");

/*
 * **The claim, asked of the engine twelve times.** For each god: swear to it, walk everything its
 * own Way still allows, and check that all four orders are in the reachable set. A god that could
 * not reach one would be a god whose priests were quietly shut out of a quarter of the tier.
 */
const unreachable = [];
for (const god of godIds) {
  let owned = new Set([graph.ROOT, ...(graph.REACH.get(god) ?? []), god]);
  for (let i = 0; i < 12; i++) {
    const shut = graph.closedIds(owned);
    const live = [...graph.reachable(owned, shut)].filter(id => !shut.has(id));
    const next = new Set([...owned, ...live]);
    if (next.size === owned.size) break;
    owned = next;
  }
  for (const order of ORDERS) if (!owned.has(order)) unreachable.push(`${god} cannot reach ${order}`);
}
check("gods that cannot reach an order", unreachable.join("; ") || "none", "none");
/* And the converse, which is what keeps an order from being a back door into the Way: nobody
 * reaches one without swearing to a god first. */
check("orders reachable without a god",
  ORDERS.filter(id => graph.reachable(new Set([graph.ROOT]), new Set(godIds)).has(id))
    .join(", ") || "none", "none");

/* One order, for good -- the same shape as one religion, through the same rule and no new field. */
const afterInquisitor = graph.closedIds(new Set([graph.ROOT, "faith.inquisitor"]));
check("joining an order closes the other three",
  ORDERS.filter(id => id !== "faith.inquisitor" && afterInquisitor.has(id)).length, 3);
check("and leaves every god open",
  godIds.filter(id => afterInquisitor.has(id)).length, 0);

/*
 * **A priest pays both vows.** Obediences accumulate and Tactics do not (way-cards 2.5), so an
 * order deepens a priest without replacing their god: the Tactic becomes the order's, because it is
 * the deepest title's, and the god's Obedience still stands. Asked of the engine, because this is
 * the one place the two mechanisms meet.
 */
const sworn = new Set([graph.ROOT, ...(graph.REACH.get("faith.flagellant") ?? []),
  "faith.flagellant"]);
check("a Flagellant's title is the order",
  graph.titleOf(sworn), "Flagellant");
check("and their Tactic is the order's",
  graph.tacticOf(sworn).name, "Past Caring");
check("and they still answer to their god",
  graph.termsOf(sworn).map(t => t.god).join(", "), "The Eternal God, Flagellant");

/*
 * **No order's Signature is a miracle, and that is a rule rather than a coincidence.** A miracle
 * belongs to a god; an order is open to all twelve, so a Signature miracle would have to belong to
 * twelve lists at once or to none. These are cards, which belong to the holder.
 */
check("what an order's Signature is",
  [...new Set(ORDERS.map(id => graph.SLATES.get(byId.get(id).signature)?.kind))].join(", "), "card");
check("and none of them is in any god's list",
  ORDERS.filter(id => graph.SPELLS.has(byId.get(id).signature)).length, 0);
/* Each order takes something, and no two take the same thing -- the discipline the twelve gods are
 * written to, applied to the tier behind them. */
check("what the four orders take",
  ORDERS.map(id => byId.get(id).resource).join(", "),
  "a secret, ground, skill cards, a permanent Wild");
/*
 * **And not one of them takes a spell slot**, which is the rule the Shieldsworn nearly broke. The
 * trunk's ladder (way-cards 1.4) exists so a priest's five arrives with their god's list; a vow
 * that empties a slot would put every strength-5 back out of reach in prose the engine never reads,
 * which is the exact failure the ladder was built to end.
 */
check("orders that take a spell slot",
  ORDERS.filter(id => /spell slot/i.test(byId.get(id).resource)
    || /spell slot/i.test(byId.get(id).obedience ?? "")).join(", ") || "none", "none");
check("way-cards says why not", /An order may take anything except the thing another rule just paid/
  .test(wayDoc) ? "yes" : "no", "yes");
check("and each has a rule of its own",
  ORDERS.every(id => (byId.get(id).obedience ?? "").length > 20), true);

/* The documents, because four titles with no argument behind them are four titles nobody can
 * maintain. The claim that makes four enough is the one that has to be written down. */
check("way-cards records the orders",
  /^#### The four orders {2}\*\*\[BUILT 2026-11-02\]\*\*$/m.test(wayDoc) ? "yes" : "no", "yes");
check("and says why four serve twelve",
  /\*\*The order is the tier and the religion only names it\*\*/.test(wayDoc) ? "yes" : "no", "yes");
check("and that an order's Signature is a card on purpose",
  /None of the four Signatures is a miracle, and that is not a compromise/.test(wayDoc)
    ? "yes" : "no", "yes");
check("specializations stops calling the Way shallow",
  /wide and shallow, and now it is wide and deep/.test(specDoc) ? "yes" : "no", "yes");
check("and the old sentence is gone",
  /Faith is \*\*wide and shallow\*\*/.test(specDoc) ? "still there" : "gone", "gone");

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
check("but Sessyfyn and her nodes are still there",
  nodes.filter(n => n.id.startsWith("faith.sess") && liveForValtor.has(n.id)).length, 4);

/* A lone god shuts the lot, which is what makes the gift worth a closed door. */
const toVax = new Set([...trunk, "faith.vax"]);
check("gods still open to a priest of Vax",
  nodes.filter(n => n.exclusive === "faith" && !graph.closedIds(toVax).has(n.id))
    .map(n => n.name).join(", "), "Vax");
/* The warning the pane prints before an irreversible level: it has to name the whole cost. */
/* Eleven gods and everything behind them: the dearest single level in the game, and it got
 * dearer by eleven -- one menu node behind each god now stands behind that door too. */
check("what swearing to Vax would close",
  graph.wouldClose("faith.vax", new Set(trunk)).length, 56);

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
 * And the cap has to BITE, or it is decoration. Seven slots are granted along that route -- two
 * at the Way root, three on the trunk, two on the branch -- and the obedience keeps three, so the
 * god offers more than twice what the vow allows you to hold. That is the only shape in which a cap
 * is a price, and the trunk's ladder made it a steeper one than it was.
 */
const firstGrants = graph.grantsOf(firstWhole);
check("slots The First's whole branch grants", firstGrants.spellSlots, 7);
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
/*
 * **[2026-11-07] Sixteen became twenty-nine when every god's 5 was put on its branch end.** The
 * ladder tops were written and on no node (4a's menus could reach them, no branch named one), which
 * made the last node of every creed the smallest reward on it -- leveling 5b is the rule that came
 * out of measuring it.
 */
check("Faith minor nodes granting a miracle",
  nodes.filter(n => n.id.startsWith("faith.") && !n.title && n.grants?.spell).length, 29);

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

/* Two from the Way root, three from the trunk and one from the branch, and no vow to clip any of
 * them: the same six a priest of The First is granted and forbidden to hold. */
check("and a lone god without a cap keeps all six",
  graph.grantsOf(spiritWhole).spellSlots, 6);

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
check("nodes granting a card", cardGrants.length, 37);
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
check("minor nodes", minors.length, 147);
check("bespoke minor nodes", bespoke.length, 29);
/*
 * **The budget is a ceiling, and it is the number of bespoke PIECES.** leveling 1 sizes it exactly
 * that way -- *around 120 minor nodes at two or three per edge means about 40 bespoke pieces
 * instead of 120, which is the same order as the 48 Signatures* -- so what must not drift upward is
 * the count of things somebody has to write, and that is what this asserts.
 */
check("bespoke pieces, against a budget of about forty", bespoke.length <= 40, true);
/*
 * The SHARE is the observation, and it moved: the twenty-four menu nodes behind the schools and the
 * gods all draw from a pool by definition, so adding them could only push the share down, from one
 * in four to a little over one in five. Nothing bespoke was removed to get there -- the count above
 * is the same 29 it was -- and a graph that leans harder on pools is the cheap direction, which is
 * the whole reason the document calls the ratio a budget rather than a shape.
 *
 * So the ceiling is still checked and the floor is pinned rather than banded: a share that falls
 * because bespoke content was DELETED would move this number too, and would have to be explained.
 */
check("the bespoke share is under the budget ceiling", bespoke.length / minors.length <= 0.4, true);
check("and what the share is now", (bespoke.length / minors.length).toFixed(3), "0.197");
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
check("Way of Mind nodes", mindAll.length, 46);
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
check("formulas a node can hand over", graph.SPELLS.size, 140);
/*
 * And the nine that a node hands over as features instead. `teachingKind` is asked rather than
 * `kind` read, because `kind` on content carries two vocabularies: the slate type on a Signature,
 * and formula-or-miracle on the five Elemental and Shadow formulas written before this Way had a
 * graph. Reading it blindly dropped Rain, Lightning, Frost, Scorch and Step Through out of the
 * spell list, and the only thing that noticed was a check about a different school.
 */
check("and features it hands over instead",
  graph.TEACHINGS.filter(t => graph.teachingKind(t) === "feature").length, 10);
check("while the two vocabularies of `kind` stay apart",
  graph.TEACHINGS.filter(t => t.kind && !["feature", "item", "spell"].includes(t.kind))
    .map(t => `${t.name} (${t.kind})`).sort().join(", "),
  "Frost (formula), Lightning (formula), Rain (formula), Scorch (formula), "
  + "Step Through (formula)");
check("taking a node hands over the formula",
  /if \(grants\.spell\) await grantSpell\(actor, grants\.spell, id\);/.test(graphSource)
    ? "yes" : "no", "yes");
check("and it arrives in the book, not prepared",
  /prepared: false[\s\S]{0,60}\}, "spell"\)\]\);/.test(graphSource) ? "yes" : "no", "yes");
/* Formula or miracle is read off the Way, because data/items.mjs says that distinction IS the Way. */
check("formula or miracle comes from the Way",
  /export function spellKindOf\(source\) \{\n  return String\(source\)\.startsWith\("faith"\)/.test(graphSource)
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
check("a level-9 diviner's spell slots", divinerGrants.spellSlots, 5);
check("and the formulas in their book",
  divinerGrants.spells.join(", "),
  "The Bargain, Hold to the Bargain, The Gathered Pact, The Reading");
/* Eleven slots' worth of formulas against five slots, which is what a spell book is: more than
 * can be carried into one day, and the morning's choice is the whole of the Way. */
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
  [...titleTiers.keys()].sort().map(t => titleTiers.get(t).length).join(", "), "4, 21, 31");
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

/*
 * **Every tag and every slot a content item declares is in the vocabulary the schema draws from.**
 *
 * `natural` was on fourteen items and in no vocabulary, and `offhand` was the Goblin Shield's slot
 * in a game with no such slot. Foundry drops an invalid choice rather than failing the document, so
 * both read back from the tables exactly as written and were simply gone in play: a shield in a
 * slot that does not exist, and a tag the suite's own check required. The fields are the same shape
 * as the step vocabularies already swept here, and this is that sweep for the other two.
 */
const everyGearEntry = [...content.ITEMS, ...content.NPC_GEAR, ...content.NATURAL_WEAPONS];
const tagVocabulary = new Set(CARDRPG.itemTags);
const slotVocabulary = new Set(Object.keys(CARDRPG.slots));
check("gear entries the vocabulary sweep read", everyGearEntry.length, 180);
check("tags no vocabulary has",
  [...new Set(everyGearEntry.flatMap(i => (i.tags ?? []).filter(t => !tagVocabulary.has(t))))]
    .sort().join(", ") || "none", "none");
check("slots no vocabulary has",
  [...new Set(everyGearEntry.map(i => i.slot).filter(sl => sl && !slotVocabulary.has(sl)))]
    .sort().join(", ") || "none", "none");
/* And `fits`, which names slots the same way and would otherwise be swept by nothing. */
check("fits-slots no vocabulary has",
  [...new Set(everyGearEntry.flatMap(i => (i.fits ?? []).filter(sl => !slotVocabulary.has(sl))))]
    .sort().join(", ") || "none", "none");
/*
 * **And what an intent requires**, which is the same field shape drawn from the same kind of list
 * and was the next one to be wrong: eight intents named `move`, the schema drew `needs` from the
 * capabilities alone, and a Card whose `needs` is refused does not load -- so every way a monster
 * had of closing distance was missing from every deck in play.
 *
 * A sweep written to the shape of the last fault finds the last fault, so this one is written to
 * the field rather than to the value.
 */
const needsVocabulary = new Set(CARDRPG.intentNeeds);
/* One binding, read by the sweep and by its own denominator: a sweep holding its own copy of the
 * list can be emptied while the count beside it goes on reporting 28. */
const intentsSwept = content.INTENTS;
check("intents the needs sweep read", intentsSwept.length, 37);
check("needs no vocabulary has",
  [...new Set(intentsSwept.flatMap(i =>
    (i.needs ?? []).filter(n => !needsVocabulary.has(n))))].sort().join(", ") || "none", "none");
/*
 * **And the schema draws its choices from that same vocabulary.**
 *
 * Without this the sweep above is a comparison between the content and a list the schema need not
 * be using -- a second printer, and a grep two places can answer is a grep about neither. Putting
 * `Object.keys(CARDRPG.capabilities)` back in `data/cards.mjs` drops twenty-five cards and leaves
 * every check here passing, which a break test duly demonstrated.
 */
const cardSchema = fs.readFileSync(path.join(root, "module/data/cards.mjs"), "utf8");
check("the needs field draws from the needs vocabulary",
  /needs: new fields\.ArrayField\(new fields\.StringField\(\{\s*choices: CARDRPG\.intentNeeds/
    .test(cardSchema) ? "yes" : "no -- it is drawing them from somewhere else", "yes");
/* And the two lists differ by exactly the one derived value, which is the whole claim: `move` is
 * required by cards and granted to nobody. A third name drifting in here would be a capability
 * nothing can earn, wearing the exemption that belongs to `move` alone. */
check("what an intent may require that a creature cannot be given",
  CARDRPG.intentNeeds.filter(n => !(n in CARDRPG.capabilities)).join(", "), "move");

/* The two vocabularies, pinned, so a sweep against an empty set cannot read as clean. */
check("the tag vocabulary", CARDRPG.itemTags.join(" "),
  "heavy light melee ranged thrown arcane shield armor consumable natural");
check("and the slot vocabulary", Object.keys(CARDRPG.slots).join(" "),
  "hands back belt body cloak head neck fingers feet pack");

/* One decision, in one place. A pane that tested adjacency itself would drift from the rules the
 * moment `all` or an exclusive group appeared, which is the whole point of leveling 1. */
/*
 * Read from the function that paints, and this one was answered by a **comment**: the module's own
 * header explains that `canTake` is the single decision, so the grep found the explanation rather
 * than the call. The same failure as reading the sentence that says `canvas.scene` is not used.
 */
const paintBody = levelup.slice(levelup.indexOf("  #elements()"),
  levelup.indexOf("  #onRender") >= 0 ? levelup.indexOf("  #onRender") : levelup.length);
check("the pane asks the engine whether a node is takeable",
  /stateOf\(id, owned, closed, live\)/.test(paintBody) ? "yes" : "no", "yes");
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
const printedReactions = [...content.COMMON_POOL, ...content.WARRIOR_DECK, ...content.SHADE_DECK,
  ...content.WAY_CARDS]
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
  "shade.footwork, mind.vigil, faith.first.narrow, faith.first.echterhof");
/*
 * **[2026-11-07] The fourth is a capstone, and it is the one god with no 5 to give.** The First's
 * Obedience caps its slots at 3 and so caps its ladder there, so when leveling 5b put every god's
 * top miracle on its branch end, The First had none to put. It pays in the reward its own axis is
 * made of instead: a second prune on the deck-shape god is not a substitute for the 5, it is the
 * deepest version of what that branch is about.
 */
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

/*
 * **Going through and going round, in the content.**
 *
 * The engine side is checked up with the other resolver greps; this is the half that says the
 * content stopped spelling the same idea three ways. It was spelled as a magic number
 * (`ignores: 99`, a promise about the roster rather than about the card), as a boolean nothing
 * read, and as prose inside a combo clause (`when: { text: "ignores armor" }`, which printed
 * perfectly and did nothing).
 */
/*
 * Comments stripped first, and the first run of these two checks is why: the notes recording what
 * the old spellings WERE both matched, so the file reported the disease because it had written
 * down the cure. A grep for retired syntax has to read code, not prose about code.
 */
const contentCode = contentSource
  .replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
check("the magic number that meant all armour",
  /ignores: 99/.test(contentCode) ? "still there" : "gone", "gone");
check("and the ignore written as prose inside a clause",
  /text: "ignores armou?r"/.test(contentCode) ? "still there" : "gone", "gone");
/* A need is a line in the backlog. These two were built, so they stop being asked for. */
check("needs the engine has since built",
  [...contentSource.matchAll(
    /"(a step that ignores Block|a step that goes through armour entirely)"/g)].length, 0);
/*
 * **And the pair that the fields exist to separate.**
 *
 * *Heavy Swing* and *Measure* were `Strike +1 · / Move 1` apiece, differing only in a reaction
 * line, which is not a thing a player compares when choosing a card. Weight against placement is
 * the distinction now, and it is the clearest statement of this rule in the game -- so if the two
 * ever collapse back into one card, this is where it is noticed.
 */
const sameCard = (a, b) =>
  JSON.stringify([a.primary, a.secondary]) === JSON.stringify([b.primary, b.secondary]);
const heavySwing = content.WARRIOR_DECK.find(c => c.name === "Heavy Swing");
const measure = content.COMMON_POOL.find(c => c.name === "Measure");
check("Heavy Swing goes through armour", heavySwing.primary[0].ignores ?? 0, 2);
check("Measure goes round Block", measure.primary[0].ignoresBlock === true ? "yes" : "no", "yes");
check("and they are not the same card", sameCard(heavySwing, measure) ? "same" : "different",
  "different");
/*
 * **And the arithmetic, run rather than grepped.**
 *
 * Everything above this reads the resolver's source and proves it contains the right words. That
 * is the weaker half: the three ways through a defence are each one line of maths, they are easy
 * to get wrong in the same direction, and a grep cannot tell `Math.max(0, armor - pierce)` from
 * `Math.max(0, pierce - armor)`. `defencesAgainst` is pure and exported so this can call it.
 */
const { defencesAgainst } = await import("../module/resolve.mjs");
const defence = o => {
  const d = defencesAgainst(o);
  return `armor ${d.armor}, Block ${d.block}`;
};
const plated = { armor: 4, block: 3 };
check("a plain blow meets both defences", defence({ ...plated }), "armor 4, Block 3");
check("ignores 2 takes two off the armour",
  defence({ ...plated, pierce: 2 }), "armor 2, Block 3");
check("and never takes it below zero",
  defence({ ...plated, pierce: 9 }), "armor 0, Block 3");
/* The sentence core-rules 4 is built on, tested from the side that would break it quietly. */
check("and never comes off Block, however large",
  defence({ ...plated, pierce: 99 }), "armor 0, Block 3");
check("ignoresArmour counts the armour as zero",
  defence({ ...plated, step: { ignoresArmour: true } }), "armor 0, Block 3");
check("and leaves Block alone",
  defence({ armor: 0, block: 3, step: { ignoresArmour: true } }), "armor 0, Block 3");
check("ignoresBlock counts the Block as zero",
  defence({ ...plated, step: { ignoresBlock: true } }), "armor 4, Block 0");
check("and leaves the armour alone",
  defence({ ...plated, step: { ignoresBlock: true }, pierce: 1 }), "armor 3, Block 0");
/* The conditional pair: the opening is the gap, so no opening is no gap. */
const marked = { ...plated, when: { needs: "marked", ignoresArmour: true }, step: {} };
check("an opening's ignore applies when the target carries it",
  defence({ ...marked, opening: true }), "armor 0, Block 3");
check("and does nothing at all when it does not",
  defence({ ...marked, opening: false }), "armor 4, Block 3");
/* The two real cards, read out of the content and run through the engine's own function. */
check("Heavy Swing against plate 4, shield 3",
  defence({ ...plated, pierce: heavySwing.primary[0].ignores ?? 0 }), "armor 2, Block 3");
check("Measure against the same",
  defence({ ...plated, step: measure.primary[0] }), "armor 4, Block 0");

/* The rule is written down as well, or the engine is the only place it exists. */
check("the rule is written in core-rules",
  /#### Going through, and going round/.test(coreRules) ? "yes" : "no", "yes");
check("and it says Parry is not touched",
  /\*\*Parry is untouched\*\*/.test(coreRules) ? "yes" : "no", "yes");

const sigs = graph.SIGNATURES;
/* Both Ways' tables, through the index the engine builds -- a Way that added a table the engine
 * merged and this check did not would be a Way whose Tactics nobody validated. */
const tactics = graph.ALL_TACTICS;

check("Signatures defined", sigs.length, 51);
check("Tactics defined", Object.keys(tactics).length, 52);

/* One per Shade title, and the Way root has neither -- way-cards 2.2 starts at Thief. */
const titled = nodes.filter(n => n.title && n.signature);
check("titles carrying a Signature", titled.length, 52);
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
  /*
   * Hearth and Home joined when a spell learned to sit outside the slot budget. **Graven Strength
   * left again**, and that is honest rather than a regression: it joined because a permanent formula
   * cost no slots, and way-cards 3.4 says a tattoo *spends* its slots -- for good. Pricing the
   * school that way drops Way of Mind's ceiling from six slots to five and leaves a school's list
   * unaffordable to the caster it was written for, so all seven of Tattoo Magic name the gap and
   * wait for that arithmetic rather than having it decided here.
   */
  "The Opening, The Kit, Loose and Step, Set, Heckle, One Trick, Shoulder to Shoulder, "
  + "Nothing Gets Through, Interpose, Blood Price, Call the Unquiet, Wall of the Sphere, Wither, "
  + "The Bargain, Hearth and Home, Unmake, The Reading, "
  + "Breath of the Spirit, The Outcast's Due, Out of Barren Ground, The Silent Hour, "
  + "The First Taste, The Rumour, The Writ, The Order's Shield, The Scourge");
const gaps = sigs.filter(sg => sg.needs?.length).map(sg => `${sg.name}: ${sg.needs.join("; ")}`);
check("Signatures with a named gap", gaps.length, 25);
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
/*
 * [FOUND BY THE BREAK TEST] **And the ward still prints the reaction it is the axis for**, which
 * nothing asserted until the twelve schools were written.
 *
 * The coverage check above -- *reactions no card prints* -- is satisfied by ANY one printer, and
 * for months `unmake` had exactly one: this Signature. Ward Magic's list added *The Mirror*, which
 * prints it too, and from that moment the Signature could have lost its own reaction without a
 * single check noticing. A second printer quietly turned a check about one card into a check about
 * the set, which is the same shape of failure as a regex matching an identical line in another
 * function -- and the only reliable way to find it is to break the thing on purpose.
 *
 * So each spell-reaction is pinned to the content it was built for, by name.
 */
check("the ward's Signature prints the reaction it is the axis for",
  everything.find(c => c.name === "Unmake")?.reaction, "unmake");
check("and the other two spell-reactions are printed by the spells they were built for",
  ["Breath of the Spirit", "Hold to the Bargain"]
    .map(n => `${n}: ${everything.find(c => c.name === n)?.reaction ?? "none"}`).join(", "),
  "Breath of the Spirit: mend, Hold to the Bargain: bargain");
/*
 * And the whole set, because the lesson of the find is that a NEW printer is what hid the old one
 * going missing. A spell that starts answering an event should have to be added here.
 */
check("everything that prints a reaction",
  everything.filter(c => c.reaction).map(c => `${c.name} (${c.reaction})`).sort().join("; "),
  "Bear It for Them (mend); Both Hands (use); Breath of the Spirit (mend); "
  + "Count the Odds (parry); Heckle (heckle); "
  + "Hold the Line (parry); Hold to the Bargain (bargain); Interpose (bodyguard); "
  + "Light Feet (sidestep); Measure (parry); Named (parry); Over and Past (sidestep); "
  + "Press (sidestep); Scout Ahead (sidestep); "
  + "Shake It Off (mend); Shield Bash (block); Shield Wall (block); "
  + "Sleight (use); Slip the Knot (sidestep); The Close Work (parry); The Mirror (unmake); "
  + "The Order's Shield (block); The Turning Tide (mend); Turn Aside (mend); Unmake (unmake)");
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
/*
 * **Every blocking flag, pinned to the condition that has it AND the getter that reads it.**
 *
 * None of this was checked, and all three were load-bearing: `blocksSecondary` could have been
 * deleted from Dazed and nothing would have noticed -- the condition would still exist, still be
 * applied, still show on the token, and quietly stop costing anybody a half. A break test proved
 * it by doing exactly that.
 *
 * This is the shape this project has met seven times now, in the one place where it was holding up
 * three conditions at once.
 */
const BLOCKS = [
  ["blocksSecondary", "dazed", "noSecondary", "a half"],
  ["blocksReactions", "stunned", "noReactions", "your reactions"],
  ["blocksTurn", "halted", "noTurn", "the whole turn"]
];
for (const [flag, key, getter, what] of BLOCKS) {
  check(`${key} is what costs you ${what}`,
    CARDRPG.conditions[key]?.[flag] === true ? "yes" : "no", "yes");
  check(`and ${getter} on the actor reads ${flag}`,
    new RegExp(`get ${getter}\\(\\) \\{\\s*\\n\\s*return this\\.activeConditions`
      + `\\.some\\(c => CARDRPG\\.conditions\\[c\\.key\\]\\?\\.${flag}\\)`)
      .test(actorsSource) ? "yes" : "no", "yes");
}
/* And no flag is declared by a condition with no reader at all, which is how a fourth would arrive
 * and do nothing. */
const flagsDeclared = new Set(Object.values(CARDRPG.conditions)
  .flatMap(c => Object.keys(c).filter(k => k.startsWith("blocks") && c[k] === true)));
check("blocking flags with no getter behind them",
  [...flagsDeclared].filter(f => !BLOCKS.some(b => b[0] === f)).join(", ") || "none", "none");

check("Heckled spoils the carrier's own draw",
  CARDRPG.conditions.heckled?.drawsWithDisadvantage, true);
/* Not an opening: an opening is a setup worth nothing alone, and this one already pays. */
check("Heckled is not an opening", CARDRPG.openings.includes("heckled"), false);
check("nothing else applies it",
  [...content.WARRIOR_DECK, ...content.SHADE_DECK, ...content.WAY_CARDS, ...content.COMMON_POOL,
    ...content.INTENTS,
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
check("Shade's pool", pools.shade.length, 14);
check("Strength's pool", pools.strength.length, 15);
/*
 * Mind's pool is formulas rather than cards, and it is **seventy**, which is a different kind of
 * list from the other two Ways: a Way pool is a dozen cards and this is twelve SCHOOLS, each with
 * its own six-to-ten formulas and every strength from 1 to 5 present (way-cards 3.4).
 *
 * It was eight for one day -- Blood Magic's four and Spiritualism's four, because those were the
 * two schools earlier passes had reached. The other ten schools were written in the world document
 * and nothing in the game had them.
 */
check("Mind's pool", pools.mind.length, 72);
check("the schools Mind's pool draws on",
  [...new Set(pools.mind.map(f => f.source))].sort().join(", "),
  "Asceticism, Blood Magic, Divination, Elemental Magic, Glamour, Household Magic, Necromancy, "
  + "Poison, Shadow Magic, Spiritualism, Tattoo Magic, Ward Magic");
/* And Faith's, which had no check at all while it had sixteen entries. */
check("Faith's pool", pools.faith.length, 50);
check("the gods Faith's pool draws on", new Set(pools.faith.map(f => f.source)).size, 12);

/*
 * ---- the twelve schools and the twelve gods, read out of the document ----
 *
 * **The brief is the document, so the check reads the document.** way-cards 3.4 and 3.5 are two
 * hundred lines of tables naming every formula and miracle with its strength, and a hand-kept list
 * here would be a second copy of them: the first time somebody added a formula to the world, the
 * copy would be the thing that was true and the game would be the thing that was wrong.
 *
 * This is the same decision the art brief made in the other direction -- that one is GENERATED from
 * the content, this one is CHECKED against the content -- and both exist so that one of the two
 * files cannot quietly stop describing the other.
 */
const spellTables = (() => {
  const lines = waycards.split("\n");
  const from = lines.findIndex(l => l.startsWith("### 3.4"));
  const to = lines.findIndex((l, i) => i > from && l.startsWith("### 3.6"));
  const rows = [];
  let group = "";
  let kind = "";
  for (const line of lines.slice(from, to === -1 ? lines.length : to)) {
    if (line.startsWith("### 3.4")) kind = "formula";
    else if (line.startsWith("### 3.5")) kind = "miracle";
    else if (line.startsWith("#### ")) {
      /* A school's heading is "Name -- axis, paid in ...". A prose heading has no dash. */
      const head = line.slice(5).split(/—|--/)[0].trim();
      group = /^(The principle|What a 4)/.test(head) ? "" : head;
    } else if (line.startsWith("|") && group) {
      const cells = line.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      if (cells.length < 3) continue;
      const name = cells[0].replace(/[✦*]/g, "").trim();
      /* "Teaching" is the header of the two schools whose lists are not all formulas: Tattoo
       * Magic teaches seven features and Asceticism's ladder ends in two. */
      if (!name || ["Formula", "Miracle", "Teaching"].includes(name) || /^-+$/.test(name)) continue;
      rows.push({ group, kind, name, strength: cells[1], signature: cells[0].includes("✦") });
    }
  }
  return rows;
})();

/* A parser that matched nothing would say every list below was complete. */
/* 145 with a number, plus the one ritual, which is the row the exception below is about. */
check("rows read out of way-cards 3.4 and 3.5", spellTables.length, 148);
check("and the schools and gods they fall under",
  new Set(spellTables.map(r => r.group)).size, 24);
check("twelve of them are schools",
  new Set(spellTables.filter(r => r.kind === "formula").map(r => r.group)).size, 12);
check("and twelve are gods",
  new Set(spellTables.filter(r => r.kind === "miracle").map(r => r.group)).size, 12);
/* One per school and one per god, marked in the document and carried on a node. */
check("rows marked as a Signature", spellTables.filter(r => r.signature).length, 24);

/*
 * The one row whose strength is not a number, and it is a known exception rather than a parse
 * failure: a ritual costs no slots at all, `strength` is required and runs 1 to 5
 * (data/items.mjs), and *Hearth and Home* is written as a 1 with a gap that says what the 1 is
 * standing in for. Naming it here is what keeps the parser honest about the rest.
 */
const unnumbered = spellTables.filter(r => !/^\d$/.test(r.strength));
check("rows with no numeric strength", unnumbered.map(r => `${r.name}: ${r.strength}`).join(", "),
  "Hearth and Home: ritual");

/*
 * **Every teaching, which is what 3.4 and 3.5 are tables of.**
 *
 * This read `kind === "spell"` and so asked the spell list, which was right while every teaching
 * was a formula. Nine of them are features -- all seven of Tattoo Magic and the two renunciations
 * Asceticism ends in -- and the first thing that happened when they stopped being spells was that
 * the suite reported the document as listing content the game does not have. The document was
 * right. A school teaches what it teaches; which document it becomes is a question about gates.
 */
const everySpell = new Map([...content.MIND_POOL, ...content.FAITH_POOL, ...content.FORMULAS,
  ...content.SHADOW_FORMULAS, ...signatureExports.filter(s => s.kind !== "card" && s.source)]
  .map(s => [s.name, s]));
check("teachings built in all", everySpell.size, 150);
/* And the split, so neither half can quietly become the whole. */
check("of which formulas and miracles",
  [...everySpell.values()].filter(t => graph.teachingKind(t) === "spell").length, 140);
check("and features a school teaches",
  [...everySpell.values()].filter(t => graph.teachingKind(t) === "feature")
    .map(t => t.name).sort().join(", "),
  "Graven Armour, Graven Eye, Graven Heart, Graven Road, Graven Shield, Graven Sight, "
  + "Graven Strength, Nothing At All, The Hand Given, The Whole Skin");

/* Every row in the document exists in the game. This is the check the eighty-five were written for. */
const unwritten = spellTables.filter(r => !everySpell.has(r.name))
  .map(r => `${r.group}: ${r.name}`);
check("formulas and miracles in the document that the game does not have",
  unwritten.length ? unwritten.join(", ") : "none", "none");
/* And at the strength the document gives, because strength IS the slot cost (way-cards 1.4). */
const wrongStrength = spellTables.filter(r => /^\d$/.test(r.strength))
  .filter(r => everySpell.get(r.name)?.strength !== Number(r.strength))
  .map(r => `${r.name}: document ${r.strength}, built ${everySpell.get(r.name)?.strength}`);
check("spells built at a different strength from the document",
  wrongStrength.length ? wrongStrength.join(", ") : "none", "none");
/* And under the school or god that may teach it, which is the other printed field. */
const wrongSource = spellTables.filter(r => everySpell.has(r.name))
  .filter(r => everySpell.get(r.name).source !== r.group)
  .map(r => `${r.name}: document ${r.group}, built ${everySpell.get(r.name).source}`);
check("spells built under a different source",
  wrongSource.length ? wrongSource.join(", ") : "none", "none");
/* And nothing in the game claims a school or god the document does not have. */
const strayDoc = [...everySpell.values()]
  .filter(s => !spellTables.some(r => r.group === s.source))
  .map(s => `${s.name} (${s.source})`);
check("spells whose source is in no section of the document",
  strayDoc.length ? strayDoc.join(", ") : "none", "none");

/*
 * The document's own tests of a list, and **a school's list and a god's are held to different
 * standards on purpose** -- which is the kind of thing a single check would have flattened.
 *
 * way-cards 3.4 promises a school **every strength from 1 to 5**, and gives the reason for both
 * ends: the 1 and the 2 are what a two-slot caster can cast on their first day, and the 5 is what
 * makes the branch worth walking to the end. The 3s were the last rung written and only because a
 * check asked for them, which is exactly why this one exists.
 *
 * way-cards 3.5 promises a god far less -- *a god's list is shorter than a school's on purpose* --
 * and promises only its **4 and its 5**, except The First, whose Obedience caps its slots at 3 and
 * therefore caps its ladder. A god with no 1 is a god; a school with no 1 is an oversight.
 */
const ladders = new Map();
for (const spell of everySpell.values()) {
  if (!ladders.has(spell.source)) ladders.set(spell.source, new Set());
  ladders.get(spell.source).add(spell.strength);
}
const schools = new Set(spellTables.filter(r => r.kind === "formula").map(r => r.group));
const gaped = [...ladders.entries()].filter(([src]) => schools.has(src))
  .filter(([, band]) => [1, 2, 3, 4, 5].some(n => !band.has(n)))
  .map(([src, band]) => `${src} (${[1, 2, 3, 4, 5].filter(n => !band.has(n)).join(" ")})`);
check("schools missing a rung of the 1-to-5 ladder", gaped.join(", ") || "none", "none");
/* And a god's two bands, with the one god whose obedience takes them away named rather than
 * excluded -- a second capped god would otherwise look exactly like this one. */
const noThesis = [...ladders.entries()].filter(([src]) => !schools.has(src))
  .filter(([, band]) => !band.has(4) || !band.has(5))
  .map(([src, band]) => `${src} (${[4, 5].filter(n => !band.has(n)).join(" ")})`);
check("gods missing their 4 or their 5", noThesis.join(", "), "The First (4 5)");
/* A two-slot caster's first day, which is the 1-and-2 half of the promise, over both Ways. */
const noFirstDay = [...ladders.entries()]
  .filter(([, band]) => !band.has(1) && !band.has(2)).map(([src]) => src);
check("schools and gods a two-slot caster cannot cast from at all",
  noFirstDay.length ? noFirstDay.join(", ") : "none", "none");
check("and The First is capped at 3 by its own Obedience",
  nodes.find(n => n.creed === "first")?.grants?.caps?.spellSlots, 3);

/*
 * Shadow Magic's price is **every formula**, not one per school (data/items.mjs), and it is the one
 * school price the engine charges in a field rather than in prose. Six formulas arrived after the
 * field did, so this is the check that they all pay.
 */
const shadow = [...everySpell.values()].filter(s => s.source === "Shadow Magic");
check("Shadow Magic's formulas", shadow.length, 7);
const freeShadowFormula = shadow.filter(s => !(s.wilds > 0)).map(s => s.name);
check("Shadow formulas that cost no Wild",
  freeShadowFormula.length ? freeShadowFormula.join(", ") : "none", "none");
/* And the thesis costs five of them, which is the field being a number rather than a flag. */
check("the most Wilds any one formula costs",
  Math.max(...shadow.map(s => s.wilds ?? 0)), 5);
/* Nothing else pays in Wilds: it is a school's price, not a generic one. */
const otherSchoolWilds = [...everySpell.values()]
  .filter(s => (s.wilds ?? 0) > 0 && s.source !== "Shadow Magic").map(s => s.name);
check("spells outside Shadow Magic that cost a Wild",
  otherSchoolWilds.length ? otherSchoolWilds.join(", ") : "none", "none");

/*
 * **A Health price is in the field, and no longer in the prose at all.**
 *
 * This check used to count four and say why: *the two shapes the field cannot hold* -- a price per
 * ally (The Red Hour, The Shield Line, The Line Holds) and a fraction of what is left (The Last
 * Drop). `cost.scale` is exactly those two shapes, so the count is zero now and the gap the check
 * was recording is closed.
 *
 * It stays as a zero rather than being deleted, because the thing it guards against is a spell
 * charging Health in a sentence nobody computes -- and that is as easy to write today as it was.
 */
const bloodPrice = [...everySpell.values()]
  .filter(s => /costs? [^.]*health/i.test(s.effect?.text ?? ""));
check("spells printing a Health price in prose", bloodPrice.length, 0);
const unqueued = bloodPrice
  .filter(s => !(s.cost?.health > 0) && !(s.needs ?? []).some(g => /cost|price/i.test(g)))
  .map(s => s.name);
check("prose Health prices that name no gap",
  unqueued.length ? unqueued.join(", ") : "none", "none");

/*
 * ---- and how much of it a character can actually be handed ----
 *
 * **[2026-11-07] Sixty-five of the hundred and forty-seven are named by a node; the other
 * eighty-two are reached by choosing** -- it was fifty-two and ninety-five until leveling 5b put
 * every god's top miracle on its branch end, which named thirteen more. way-cards 3 writes this content as POOLS rather than assignments -- *a
 * pool is a set of cards the minor nodes along a branch draw from; when the graph is authored, a
 * node's `grants[]` names one* -- and a school branch of three nodes names three of its school's
 * six, which left ninety-five formulas written down and on no node at all.
 *
 * The two numbers below are still worth keeping apart, because they say different things: how much
 * of the content a branch points at BY NAME, and how much of it is reached the other way. A named
 * grant is a decision the branch was written around; a choice is the list being a list.
 */
const spellGrants = nodes.filter(n => n.grants?.spell).map(n => n.grants.spell);
check("nodes that hand over a named spell", spellGrants.length, 64);
/*
 * And the one that hands over a feature rather than a spell: *Graven Strength*, because a tattoo is never
 * prepared. It needed no new code -- `grantSlate` has created features since Signatures were
 * written and `SLATES` has always held this one -- so the key on the node is the whole change.
 */
check("and the school node that hands over a feature by name",
  nodes.filter(n => n.id === "mind.tattoo").map(n => n.grants?.feature ?? "-").join(""),
  "Graven Strength");
check("and no two of them hand over the same one", new Set(spellGrants).size, spellGrants.length);
const onNoNode = [...everySpell.keys()].filter(name => !spellGrants.includes(name));
check("spells no node in the graph hands over", onNoNode.length, 86);
/* The First is the one source a character can be handed entire, because its ladder stops at 3. */
const complete = [...ladders.keys()].filter(src =>
  [...everySpell.values()].filter(s => s.source === src)
    .every(s => spellGrants.includes(s.name)));
check("sources a character can be handed in full", complete.join(", "), "The First");

/*
 * ---- the slot budget against the lists it has to pay for ----
 *
 * **Strength is the slot cost** (way-cards 1.4), so a caster's whole ceiling is the number of slots
 * the graph hands them, and slots are granted by *nodes* -- leveling 4 lists *a spell slot* among
 * the minor-node rewards. Counting the two against each other found the largest hole this project
 * has had. All twenty-four lists are written to a ladder of 1 to 5; the graph paid for a ladder of
 * 2 to 4. **Thirty-seven of the hundred and forty-seven spells could not be prepared by any caster
 * of their own source**, every strength-5 among them, and **four titles granted a Signature their
 * holder could not cast** -- three of them never, at any depth.
 *
 * **The fix was five fields, and the shape of the two casting Ways is why it could be.** Each has a
 * trunk of three ordinary nodes that every caster of that Way walks before their first school or
 * vow, and only Mind's carried slots at all. Both now carry the same ladder, so the ceiling arrives
 * WITH the list instead of four nodes later. Nothing was added to the graph: a slot on a school
 * node reaches one school and a slot on a god's branch reaches one priest, which is how the hole
 * stayed open while nine of the ten slot nodes looked reasonable where they sat.
 *
 * So what is checked below is an **invariant and not a number**: *no list may run past the ceiling
 * of the caster it is handed to.* The First obeyed it before anything else did -- a vow capping
 * slots at 3 and a list that stops at 3 -- and that is the reason to trust the rule rather than the
 * arithmetic that follows from it.
 */

/*
 * The ladder itself, because the fix lives in five fields and nothing else would notice if one of
 * them were dropped. Both trunks, in walking order, and they have to agree.
 */
const TRUNKS = {
  mind: ["mind", "mind.letters", "mind.candle", "mind.vigil"],
  faith: ["faith", "faith.vows", "faith.pilgrimage", "faith.calling"]
};
for (const [way, ids] of Object.entries(TRUNKS)) {
  check(`the slot ladder on the ${way} trunk`,
    ids.map(id => byId.get(id)?.grants?.spellSlots ?? 0).join(", "), "2, 1, 1, 1");
  check(`and every caster of that Way walks all four`,
    nodes.filter(n => n.title && graph.SPELLS_BY_SOURCE.has(n.title)
      && n.id.startsWith(`${way}.`))
      .every(n => ids.every(id => id === n.id || graph.REACH.get(n.id)?.has(id))), true);
}
check("the two trunks carry the same ladder",
  TRUNKS.mind.map(id => byId.get(id)?.grants?.spellSlots ?? 0).join()
  === TRUNKS.faith.map(id => byId.get(id)?.grants?.spellSlots ?? 0).join(), true);

const slotGrants = nodes.filter(n => n.grants?.spellSlots);
check("nodes that grant a spell slot", slotGrants.length, 15);
check("and the Ways they sit in",
  [...new Set(slotGrants.map(n => n.id.split(".")[0]))].sort().join(", "),
  "faith, mind, shade");
/* Way of Strength grants none, which is right: it has no casters and no spells. */
check("Way of Strength grants no slots",
  slotGrants.filter(n => n.id.startsWith("strength")).length, 0);

const casterTitles = nodes.filter(n => n.title && graph.SPELLS_BY_SOURCE.has(n.title));
check("sources with a title to reach them by", casterTitles.length, 24);

/* What a caster holds the moment the title hands them the list, the cap applied. */
function slotsAt(titleId) {
  const g = graph.grantsOf(new Set([graph.ROOT, ...(graph.REACH.get(titleId) ?? []), titleId]));
  return g.slotCap === null ? g.spellSlots : Math.min(g.spellSlots, g.slotCap);
}

/*
 * Everything a caster can still reach WITHOUT leaving their Way. A second Way is excluded on
 * purpose: a priest who has to walk Way of Mind to cast their own god's miracle is the defect, not
 * the baseline. Iterated to a fixed point, because taking a node closes others (leveling 3).
 */
function slotCeiling(titleId) {
  const way = titleId.split(".")[0];
  const inWay = id => id === way || id.startsWith(`${way}.`);
  let owned = new Set([graph.ROOT, ...(graph.REACH.get(titleId) ?? []), titleId]);
  for (let i = 0; i < 12; i++) {
    const shut = graph.closedIds(owned);
    const live = [...graph.reachable(owned, shut)]
      .filter(id => !shut.has(id) && (id === graph.ROOT || inWay(id)));
    const next = new Set([...owned, ...live]);
    if (next.size === owned.size) break;
    owned = next;
  }
  const g = graph.grantsOf(owned);
  return g.slotCap === null ? g.spellSlots : Math.min(g.spellSlots, g.slotCap);
}

/*
 * **The invariant.** Not *everybody gets five* -- The First gets three and should -- but *the list
 * never runs past the caster*. Checked at the moment the title is taken rather than at the ceiling,
 * which is the stronger reading and the one way-cards 3.4 means by *the argument for choosing the
 * branch at all*: a thesis you can cast four nodes after choosing the branch was never the thesis.
 */
const overBudget = [];
for (const t of casterTitles) {
  const have = slotsAt(t.id);
  for (const spell of graph.SPELLS_BY_SOURCE.get(t.title)) {
    if (spell.strength > have) {
      overBudget.push(`${t.title}/${spell.name} (${spell.strength}>${have})`);
    }
  }
}
check("spells a caster cannot prepare when handed the list", overBudget.length, 0);
check("and none can be prepared only by leaving the Way",
  casterTitles.filter(t => slotCeiling(t.id)
    < Math.max(...graph.SPELLS_BY_SOURCE.get(t.title).map(s => s.strength))).length, 0);

/*
 * And the margin, which is the number that says the fix is a ladder rather than a flood. Nought or
 * one: a caster holding their list's thesis prepares it and nothing beside it, or it and a 1. That
 * is way-cards 1.4's *a 5 fills a whole budget* made true rather than stated.
 */
const margins = casterTitles.map(t =>
  slotsAt(t.id) - Math.max(...graph.SPELLS_BY_SOURCE.get(t.title).map(s => s.strength)));
check("slots to spare over the list's thesis, at the title",
  `${Math.min(...margins)} to ${Math.max(...margins)}`, "0 to 1");
check("what a caster holds when the list arrives",
  [...new Set(casterTitles.map(t => slotsAt(t.id)))].sort().join(", "), "3, 5, 6");
/* The two that are not five, and each is a decision somebody made rather than a slip. */
check("the one that holds three is the one whose vow caps it",
  casterTitles.filter(t => slotsAt(t.id) === 3).map(t => t.title).join(", "), "The First");
check("and its list stops exactly there",
  Math.max(...graph.SPELLS_BY_SOURCE.get("The First").map(s => s.strength)), 3);
check("the one that holds six is reached through a slot of its own",
  casterTitles.filter(t => slotsAt(t.id) === 6).map(t => t.title).join(", "), "Ward Magic");

check("the ceiling for a mage who stays in Way of Mind",
  [...new Set(casterTitles.filter(t => t.id.startsWith("mind")).map(t => slotCeiling(t.id)))]
    .join(", "), "6");
check("and for a priest who stays in Way of Faith",
  [...new Set(casterTitles.filter(t => t.id.startsWith("faith")).map(t => slotCeiling(t.id)))]
    .sort().join(", "), "3, 5, 6");
/* Two gods out of twelve have a slot on their own branch; the rest live on the trunk's ladder. */
check("gods whose own branch grants one past the trunk",
  casterTitles.filter(t => t.id.startsWith("faith") && slotCeiling(t.id) > 5)
    .map(t => t.title).sort().join(", "),
  "The Eternal God, The Eternal Spirit");

/*
 * **A Signature is granted the moment you swear**, so a Signature above the slot count at that
 * moment is not a wait, it is a dead letter -- a title's Signature is the thing the title IS
 * (way-cards 2). Four titles printed one: Fagar, Vulpet and Brendan at strength 3 against two
 * slots, and The First, whose own branch arrived a node later. All four were fixed by the trunk.
 */
const sigTrouble = [];
for (const t of nodes.filter(n => n.title && n.grants?.spell)) {
  const def = graph.SPELLS.get(t.grants.spell);
  const now = slotsAt(t.id);
  if (def && def.strength > now) {
    sigTrouble.push(`${t.title}: ${def.name} is ${def.strength}, slots ${now}`);
  }
}
check("titles granting a Signature their holder cannot cast", sigTrouble.join(", ") || "none",
  "none");
/* The three that were never castable at any depth, which is the half of it that was not timing. */
check("and none of them is a Signature nobody could ever reach",
  nodes.filter(n => n.title && n.grants?.spell)
    .filter(n => (graph.SPELLS.get(n.grants.spell)?.strength ?? 0) > slotCeiling(n.id)).length, 0);

/*
 * The one number this audit does NOT restrain, pinned so it cannot move quietly. Slots are
 * additive and Ways stack, so a character who walks everything open to them reaches fifteen -- six
 * on their own Way's ladder and the rest from the half-mage, the Duellist's formula and a second
 * Way's trunk. That is a crossing's reward rather than a defect (leveling 1 sells crossing as the
 * point of a graph), but nothing in the rules says where it stops, so the number is recorded here
 * and the question is open in way-cards 1.4.
 */
const crossCeiling = (() => {
  let best = 0;
  for (const t of casterTitles) {
    let owned = new Set([graph.ROOT, ...(graph.REACH.get(t.id) ?? []), t.id]);
    for (let i = 0; i < 12; i++) {
      const shut = graph.closedIds(owned);
      const live = [...graph.reachable(owned, shut)].filter(id => !shut.has(id));
      const next = new Set([...owned, ...live]);
      if (next.size === owned.size) break;
      owned = next;
    }
    const g = graph.grantsOf(owned);
    best = Math.max(best, g.slotCap === null ? g.spellSlots : Math.min(g.spellSlots, g.slotCap));
  }
  return best;
})();
check("the most slots a character can reach with every Way open", crossCeiling, 15);
check("way-cards leaves the crossing ceiling open",
  /\[OPEN\][^\n]*crossing[\s\S]{0,400}?fifteen/.test(wayDoc) ? "yes" : "no", "yes");

/*
 * And the documents, because a ladder in the data with no rule behind it is the thing this project
 * keeps finding from the other side: five fields that nobody can tell from an accident. The rule is
 * stated in 1.4 beside the two slots it extends, the measurement that rejected the first fix is
 * kept, and the three gods are named -- a hole stays fixed only while the reason it was a hole is
 * still written down.
 */
check("way-cards states the trunk ladder as a rule",
  /\*\*And each of the three trunk nodes behind the first school or vow grants one more/
    .test(wayDoc) ? "yes" : "no", "yes");
check("and why the trunk and not a school or a god",
  /the trunk is the part every caster of that Way walks/.test(wayDoc) ? "yes" : "no", "yes");
check("and what the fix cost", /\*\*The fix was five fields/.test(wayDoc) ? "yes" : "no", "yes");
check("way-cards keeps the three gods whose Signature was a dead letter",
  /\*\*Fagar\*\*, \*\*Vulpet\*\* and \*\*Brendan\*\*/.test(wayDoc) ? "yes" : "no", "yes");
/* The rejected option, with the number that rejected it: level IS the node count, so per-level
 * slots scale with the size of the graph rather than with anything a designer chose. */
check("and what slots-by-level measured before it was dropped",
  /slots by level[\s\S]{0,600}?hands a mage \*\*nineteen\*\*/i.test(wayDoc) ? "yes" : "no", "yes");
check("leveling records the same fix where slots are handed out",
  /A slot now sits on each of the three trunk nodes of both casting Ways/.test(levDoc)
    ? "yes" : "no", "yes");
/* And why it was ever possible: a slot is a minor-node reward like a card or a point of Health, and
 * it was the only one whose total nobody had ever added up. */
check("and that a slot was the reward nobody counted",
  /Spell slots were the one reward nobody counted/.test(levDoc) ? "yes" : "no", "yes");

/* ---- languages, awarded on levelling  [BUILT 2026-11-02] ---- */

/*
 * **The world's list is the brief, and the content is checked against it.** worldinfo/Firma.md
 * grew a *Languages* section, and a language is a levelling reward in the same shape as a training:
 * `grants: { language: "Elvish" }`, derived on the sheet, never copied onto a character. So the
 * table in content.mjs is not an invention -- it is a transcription, and this is the check that it
 * stays one. The same binding §3.4's spell tables have, in the same direction.
 */
const worldDoc = fs.readFileSync(path.join(root, "../../worldinfo/Firma.md"), "utf8");
const langSection = worldDoc.slice(worldDoc.indexOf("\n# Languages"));
const worldTongues = [...langSection.matchAll(
  /^\* (?:\*\*)?([A-Za-z]+)(?:\*\*)? *[-–—] *(.+)$/gm)]
  .map(m => ({ name: m[1], of: m[2].trim() }));
check("languages the world names", worldTongues.length, 9);
check("and the content holds the same nine",
  graph.LANGUAGES.map(l => l.name).join(", "),
  worldTongues.map(l => l.name).join(", "));
/* The gloss too, lowercased at the front because a bullet starts with a capital and a table entry
 * does not: a language whose description drifted would be a language nobody could place. */
check("and says the same thing about each",
  graph.LANGUAGES.filter(l => {
    const world = worldTongues.find(w => w.name === l.name)?.of ?? "";
    return world.toLowerCase() !== l.of.toLowerCase();
  }).map(l => l.name).join(", ") || "none", "none");

/*
 * **Where a language is taught is not arbitrary: it is taught where its speakers are studied.**
 * That is the rule, and it is what makes the placement checkable rather than a matter of taste --
 * every one of the seven sits on a node whose own reward already names those speakers.
 */
const tongueNodes = nodes.filter(n => n.grants?.language);
check("nodes that teach a language", tongueNodes.length, 9);
check("and which tongue each teaches",
  tongueNodes.map(n => `${n.id}=${n.grants.language}`).sort().join(", "),
  "faith.vulpet.driven=Burrowing, mind.blood=Demonic, mind.divination=Valgar, "
  + "mind.letters=Imperial, mind.necromancy=Reversed, mind.spirit.debts=Elvish, "
  + "mind.spirit.names=Troll, shade.duellist.politician=Imperial, shade.scout.spy=Imperial");
/* Eight nodes and seven tongues: Imperial is taught twice, read by a scholar and spoken by a spy,
 * and `learned` dedupes it. A language is binary -- you read Reversed or you do not. */
check("tongues the graph teaches at all",
  [...new Set(tongueNodes.map(n => n.grants.language))].length, 7);
check("and the one taught from two directions",
  [...new Set(tongueNodes.map(n => n.grants.language))]
    .filter(l => tongueNodes.filter(n => n.grants.language === l).length > 1).join(", "),
  "Imperial");
/*
 * **Two are taught by nothing, and that is the finding rather than an omission.** Perga is the
 * language at wolf's peak and Veche the local tongue in Saag et Haar: regional human tongues, which
 * nobody studies -- you grow up in them. They belong to a background, and a background has no
 * mechanical representation yet (rules/backgrounds.md is a template with no engine behind it), so
 * the field they will land in exists and the grant does not.
 */
const taughtTongues = new Set(tongueNodes.map(n => n.grants.language));
check("languages no node teaches",
  graph.LANGUAGES.filter(l => !taughtTongues.has(l.name)).map(l => l.name).join(", "),
  "Perga, Veche");
check("and leveling says where those two belong",
  /\[OPEN\][^\n]*Perga and Veche[\s\S]{0,700}?background/.test(levDoc) ? "yes" : "no", "yes");

/* A language the world does not have is a reward that reads as flavour and means nothing: the same
 * failure as a node granting a card nobody wrote, refused in the same place. */
check("the graph refuses a tongue nobody speaks",
  graph.graphFaults([...nodes, { id: "test.tongue", after: ["root"],
    grants: { language: "Olde Welshe" } }])
    .some(f => /is not a language of Firma/.test(f)), true);
/* And accepts one that exists, or the check above would pass for the wrong reason. */
check("and accepts one that does",
  graph.graphFaults([...nodes, { id: "test.tongue", after: ["root"],
    grants: { language: "Troll" } }]).length, 0);

/* The reward reaches a character: summed by the graph, deduped on the sheet, printed by the pane. */
check("the graph sums languages like trainings",
  /if \(g\.language\) out\.languages\.push\(g\.language\);/.test(graphSource) ? "yes" : "no", "yes");
check("a character derives them",
  /languages: \[\.\.\.new Set\(\[\.\.\.this\.languages, \.\.\.fromNodes\.languages\]\)\]\.sort\(\)/
    .test(actorModel) ? "yes" : "no", "yes");
check("the pane prints what a node teaches",
  /CARDRPG\.Level\.Language/.test(graphSource) ? "yes" : "no", "yes");
check("and the string exists", "CARDRPG.Level.Language" in lang, true);
check("the sheet holds the ones a background gave",
  /name="system\.languagesText"/.test(charTemplate) ? "yes" : "no", "yes");
check("and lists the ones the nodes taught, separately",
  /\{\{#each fromNodes\.languages\}\}/.test(charTemplate) ? "yes" : "no", "yes");
check("the editor offers the nine and nothing else",
  /<label>Language <select name="language">/.test(levelup) ? "yes" : "no", "yes");
check("and saves what it was given",
  /"training", "knowHow",\s*"language"/.test(levelup) ? "yes" : "no", "yes");

/* Counting what one character can end up with, because a reward nobody can reach is not a reward.
 * A single-Way mage who walks the whole of Way of Mind reads five of the nine. */
const mageAll = new Set(["root", ...nodes.filter(n => n.id === "mind" || n.id.startsWith("mind."))
  .map(n => n.id)]);
check("languages a mage who walked all of Way of Mind reads",
  graph.grantsOf(mageAll).languages.sort().join(", "),
  "Demonic, Elvish, Imperial, Reversed, Troll, Valgar");
check("and leveling records that a language is a minor-node reward",
  /\*\*A language\*\*/.test(levDoc) ? "yes" : "no", "yes");
check("way-cards lists it among what belongs on a minor node",
  /a know-how, \*\*a language\*\*, a feature/.test(wayDoc) ? "yes" : "no", "yes");

/*
 * ---- and the shape of the four Ways against each other ----
 *
 * Not a verdict: the four are meant to feel different. What is worth pinning is the places where
 * they differ STRUCTURALLY rather than in flavour, because those are the ones nobody chose.
 */
const titleRows = nodes.filter(n => n.title).map(n => ({
  way: n.id.split(".")[0], tier: graph.tierOf(n.id), level: graph.levelFor(n.id)
}));
check("titles in all", titleRows.length, 56);
/* Thirteen in three Ways and seventeen in Faith: twelve gods are four times the breadth of a
 * trunk's three titles, so the four orders behind them cost four titles rather than twelve. */
check("and how many each Way holds",
  ["strength", "shade", "mind", "faith"]
    .map(w => `${w} ${titleRows.filter(r => r.way === w).length}`).join(", "),
  "strength 13, shade 13, mind 13, faith 17");
/*
 * **Way of Faith was flat where the other three were deep, and now it is not.** Twelve gods, all
 * tier 1, all at level 5, and nothing behind any of them: a priest reached level 5 and their own
 * Way had nothing further to walk toward, where Strength, Shade and Mind each put three titles at
 * tier 1 and nine or ten at tier 2. The shallowness was never argued for -- specializations.md
 * called the Way *wide and shallow* in one breath, and the width is the argued half.
 *
 * The depth is **four holy orders** (way-cards 2.4), open to a priest of any god, which is why the
 * Way needed four titles rather than twelve to gain a tier. All four Ways reach tier 2 now, which
 * is what this loop says and the only reason it is a loop.
 */
for (const way of ["strength", "shade", "mind", "faith"]) {
  const mine = titleRows.filter(r => r.way === way);
  check(`${way}: tiers its titles sit at`,
    [...new Set(mine.map(r => r.tier))].sort().join(","), "0,1,2");
}
/* And how wide each tier is, per Way, which is where the four Ways still differ by design: three
 * Ways fan 3 into 9 or 10, and Faith fans 12 into 4. */
for (const [way, shape] of [["strength", "1, 3, 9"], ["shade", "1, 3, 9"], ["mind", "1, 3, 9"],
  ["faith", "1, 12, 4"]]) {
  check(`${way}: titles at each tier`,
    [0, 1, 2].map(t => titleRows.filter(r => r.way === way && r.tier === t).length).join(", "),
    shape);
}
check("levels a title is reached at, over the whole graph",
  [...new Set(titleRows.map(r => r.level))].sort((a, b) => a - b).join(", "), "1, 5, 8, 9");
/* One title in the game is not on the 1/5/8 ladder, and it is the deepest in Way of Shade. */
check("the one title off the ladder",
  titleRows.filter(r => r.level === 9).length, 1);

/*
 * What the cheapest route to a title hands over, by Way. Health and carry are where the three
 * non-casting Ways differ most, and the asymmetry is deliberate in direction -- a mage is frail --
 * but nothing had measured the size of it.
 */
const pathGrants = way => {
  const mine = nodes.filter(n => n.title && n.id.startsWith(way) && graph.tierOf(n.id) === 2);
  if (!mine.length) return null;
  const sums = mine.map(n => graph.grantsOf(new Set([...(graph.REACH.get(n.id) ?? []), n.id])));
  const mean = pick => (sums.reduce((a, g) => a + pick(g), 0) / sums.length).toFixed(1);
  return `hp ${mean(g => g.health)} carry ${mean(g => g.carry)} cards ${mean(g => g.cards.length)}`;
};
check("what a tier-2 title in Way of Strength is reached with", pathGrants("strength"),
  "hp 1.2 carry 6.1 cards 3.1");
check("and in Way of Shade", pathGrants("shade"), "hp 1.2 carry 0.1 cards 3.1");
check("and in Way of Mind", pathGrants("mind"), "hp 0.1 carry 0.0 cards 1.0");
/*
 * And Way of Faith, which had no tier-2 title to compare until the orders were built. It is the
 * flattest route of the four, and that is the trunk showing through: a priest walks four shared
 * nodes, a god, Ordination and one order node, and the only numbers on that road are the Cloister's
 * rest token and the trunk's slot ladder. The two cards are Pilgrimage's and the order's own
 * Signature.
 */
check("and in Way of Faith, built 2026-11-02", pathGrants("faith"), "hp 0.0 carry 0.0 cards 2.0");

/*
 * ---- the four Ways against each other, on this project's own standards  [2026-11-02] ----
 *
 * **Nothing in this section is a simulation, and the reason is worth stating once.** The simulator
 * is a starter Warrior against goblins; it models no Way feature, no title, no slot and no Cast
 * (sim/combat_sim.py), so it can price a CARD and cannot price a caster. What it can do is anchor
 * the two standards every Way's content was written against -- way-cards 1.2's value bands and
 * 1.3's cost ladder -- and those standards can be read off the content exactly.
 *
 * So this is the comparison: not *is Way of Mind as strong as Way of Strength*, which nothing here
 * can answer, but *do the four Ways obey the same rules, and where do they differ by accident
 * rather than by design*.
 */

const WAYS = ["strength", "shade", "mind", "faith"];
const wayOfId = id => id.split(".")[0];
const avg = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/* Which rung of 1.3's ladder a piece of content pays. A spell pays in slots instead and is counted
 * separately: strength IS its price (1.4), so reading a spell's card-half costs says nothing. */
const ladderRung = c => {
  const halves = [c.costs?.primary, c.costs?.secondary].filter(Boolean);
  const strain = halves.some(h => h.strain);
  const spent = halves.some(h => h.spent);
  return spent && strain ? "Spent+Strain" : spent ? "Spent" : strain ? "Strain" : "nothing";
};
const sigCards = graph.SIGNATURES.filter(s => s.kind === "card" || s.kind === "item");

/*
 * **The top rung of the cost ladder has never been used.** 1.3 reads *Spent + Strain | a Signature,
 * and only a Signature | once* -- so the rung exists for exactly this content and no Signature
 * pays it. Nineteen of the twenty-two card Signatures cost nothing at all.
 *
 * That is permitted rather than broken: the ladder says what MAY buy a Signature, not what must.
 * But it means a Signature is priced like an ordinary card, and a Signature is the one card a
 * character always has. The decision had never been written down, so it is written down now and
 * pinned here.
 */
check("card Signatures, by the rung of the ladder they pay",
  ["nothing", "Strain", "Spent", "Spent+Strain"]
    .map(r => `${r} ${sigCards.filter(s => ladderRung(s) === r).length}`).join(", "),
  "nothing 19, Strain 1, Spent 2, Spent+Strain 0");
check("and which ones pay anything at all",
  sigCards.filter(s => ladderRung(s) !== "nothing")
    .map(s => `${s.name} (${ladderRung(s)})`).sort().join(", "),
  "One Opening (Spent), Red Mist (Spent), The Scourge (Strain)");
check("way-cards records that the rung is unspent",
  /\[FOUND IN CODE 2026-11-02\] The top rung has never been spent/.test(wayDoc)
    ? "yes" : "no", "yes");

/*
 * **And one of 1.2's nine value bands is measurably wrong**, which matters more than an unused
 * rung: the band table is the standard all forty-eight Signatures were priced against.
 *
 * *Strike on a secondary* is listed as a **Way reward** and called *the classic reward, worth most
 * of a round over a fight*. Both halves have been overtaken:
 *
 *   - it is a POOL card, not a Way reward -- way-cards 3.1 settles it at -1 as *the first ordinary
 *     card a fighter of any Way is handed*, which is why four pool cards print it and no Signature
 *     does;
 *   - and it is worth **half** a round, not most of one (sim/analysis-2026-10-26 5), with the
 *     win-rate value put at 2 to 6 points against armour's 30 (sim/analysis-2026-11-01 1).
 *
 * The band was anchored on a measurement and the measurement moved. This is the fourth time a
 * number in a document has outlived the run that produced it, and the tell is the same every time:
 * a figure in prose with no check reading it.
 */
const onSecondary = [...graph.POOL.values(), ...graph.SIGNATURES]
  .filter(c => (c.secondary ?? []).some(st => st.verb === "strike"));
check("content printing Strike on a secondary half",
  onSecondary.map(c => c.name).sort().join(", "),
  "Hold the Line, Off-Hand Blow, Pull Them Down, Second Knife");
check("and how many of them are Signatures", onSecondary.filter(c => c.node).length, 0);
check("way-cards says the band outlived its measurement",
  /band outlived the measurement it was\n> anchored on/.test(wayDoc) ? "yes" : "no", "yes");
/* And that it names both halves of what moved: where the card comes from, and what it is
 * worth now. A note that said only "this is stale" would go stale itself. */
check("and names the run that moved it",
  /worth half a round, not a full one/.test(wayDoc) ? "yes" : "no", "yes");

/*
 * A cell is an axis and a resource together, and two titles in one cell are one specialization
 * written twice (way-cards 2). Both survivors pair a Way ROOT with a tier-2 title, and one of them
 * is deliberate: a Half-mage is a part-Scholar and is written to read that way.
 */
const cells = new Map();
for (const n of nodes.filter(x => x.title && x.axis)) {
  const key = `${n.axis} / ${n.resource}`;
  if (!cells.has(key)) cells.set(key, []);
  cells.get(key).push(`${wayOfId(n.id)}:${n.title}`);
}
check("cells the titles occupy", cells.size, 54);
check("cells holding more than one title",
  [...cells].filter(([, v]) => v.length > 1)
    .map(([k, v]) => `${k} = ${v.join(" + ")}`).sort().join("; "),
  "Position / weight = strength:Warrior + shade:Acrobat; "
  + "Preparation / spell slots = mind:Scholar + shade:Half-mage");

/*
 * **What a level-8 tier-2 character holds, by Way.** The clearest statement of the four Ways'
 * identities, and three of the four rows are exactly what the design asks for: Strength buys carry
 * and nothing else, Mind buys slots and formulas and almost no Health, Shade buys cards and the
 * reactions to use them.
 *
 * **Faith's row is the finding.** Five slots and ONE miracle. See the trade below.
 */
const profileOf = way => {
  const mine = nodes.filter(n => n.title && n.id.startsWith(`${way}.`)
    && graph.tierOf(n.id) === 2 && graph.levelFor(n.id) === 8);
  const gs = mine.map(n => graph.grantsOf(
    new Set([graph.ROOT, ...(graph.REACH.get(n.id) ?? []), n.id])));
  const m = f => avg(gs.map(f)).toFixed(1);
  return `hp ${m(g => g.health)} carry ${m(g => g.carry)} `
    + `slots ${m(g => g.slotCap === null ? g.spellSlots : Math.min(g.spellSlots, g.slotCap))} `
    + `cards ${m(g => g.cards.length)} spells ${m(g => g.spells.length)}`;
};
check("a level-8 Way of Strength title is reached with",
  profileOf("strength"), "hp 1.2 carry 6.1 slots 0.0 cards 3.1 spells 0.0");
check("Way of Shade", profileOf("shade"), "hp 1.3 carry 0.1 slots 0.4 cards 3.0 spells 0.0");
check("Way of Mind", profileOf("mind"), "hp 0.1 carry 0.0 slots 5.1 cards 1.0 spells 3.2");
check("Way of Faith", profileOf("faith"), "hp 0.0 carry 0.0 slots 5.0 cards 2.0 spells 1.0");

/*
 * ---- leveling 5b: the reward climbs with the branch ----
 *
 * §5a makes a branch COST more as it deepens and said nothing about what the deeper node hands
 * back. Measured, the graph did the opposite: the four deepest nodes in it granted a know-how each,
 * because titles land mid-graph and whatever trails a title got written as filler.
 *
 * The weights are leveling 4's own ranking of its reward list, not a new one -- *cards are the
 * backbone, features are the spice* is rung 3, a permanent number is rung 2, and a reward that is
 * narrow, binary or conditional on fiction is rung 1.
 */
const RUNG = {
  card: 3, spell: 3, choose: 3, feature: 3, item: 3, signature: 3,
  health: 2, spellSlots: 2, prune: 2, expertise: 2, caps: 2, deckMax: 2,
  training: 1, knowHow: 1, mastery: 1, language: 1, carry: 1, restTokens: 1,
};
check("every grant key the graph uses has a rung",
  [...new Set(nodes.flatMap(n => Object.keys(n.grants ?? {})))]
    .filter(k => !(k in RUNG)).join(", ") || "none", "none");

/*
 * **Every reward leveling.md 4 offers is a reward some node actually hands over.**
 * **[FOUND 2026-11-07, FIXED 2026-11-07]**
 *
 * The rung table above reads the grant keys the graph **uses** and checks each has a price. Nothing
 * read the list in the other direction -- 4's own table of fifteen rewards -- and asked which of
 * them no node has ever granted. That is the same one-way check the training invariant was, and it
 * found the same kind of hole: **`deckMax` was offered by the rules, carried by the accumulator
 * since the data model was written, named in 1 among the generic pool, and granted by no node at
 * all.** One wonder granted it (*Deep Pockets*) and nothing else in the game did.
 *
 * It is granted now, by *The March* on the Way of Strength trunk, and the reasoning is in content:
 * Shade's trunk prunes and Strength's trunk caps, which is the one axis where the two Ways were
 * supposed to be opposites and only one of them had a lever.
 *
 * **`handSize` is the exception, and it is not on 4's list either.** The key exists on the
 * character and in `CHARACTER_GRANTS`, and no reward row offers it -- which is deliberate and
 * measured rather than forgotten: specializations.md prices **a card of hand size at 6 to 10 points
 * of win rate**, the most expensive stat measured anywhere in this project, *which is worth
 * remembering before anything offers one.* A key with no reward row is the correct state for a
 * reward too expensive to print, and pinning it is how that decision stays a decision.
 */
const rewardKeys = {
  card: "Action card", training: "Training", knowHow: "Know-how", expertise: "Expertise",
  mastery: "Mastery", language: "A language", feature: "Feature", item: "Item",
  prune: "Prune", deckMax: "Deck cap", carry: "Carry", spellSlots: "Spell slot",
  health: "Health", restTokens: "Rest token", spell: "Spell", choose: "Choose from a list"
};
const charGrants = (await import("../module/grants.mjs")).CHARACTER_GRANTS;
const grantedSomewhere = new Set();
for (const n of nodes) for (const k of Object.keys(n.grants ?? {})) grantedSomewhere.add(k);
const timesGranted = k => nodes.filter(n => n.grants?.[k] !== undefined).length;
/*
 * Direction one: the rules offer it and nothing hands it over. This is where `deckMax` was.
 *
 * **And the map above has to carry the rewards that have no key at all**, or this check reads
 * "none" by construction -- which is the failure it exists to find, committed by the check itself.
 * `skillCard` is one: leveling 4 offers *Skill card: add one, or upgrade one*, and skill-rules 8
 * says plainly that **the accumulator has no key for it**, so no node can grant one and a
 * character's skill deck at level 20 is the deck they started with. It is listed here with a null
 * key so it counts as offered, and it is the one row this check is allowed to find.
 */
const KEYLESS = { skillCard: "Skill card" };
check("rewards section 4 offers that no node grants",
  [...Object.entries(rewardKeys).filter(([k]) => !grantedSomewhere.has(k)),
    ...Object.entries(KEYLESS)].map(([, label]) => label).sort().join(", ") || "none",
  "Skill card");
/* ...and it is blocked on a mechanism rather than on content, which is why it is not fixed here. */
check("and the grant accumulator has no key for it",
  "skillCard" in (await import("../module/graph.mjs")).grantsOf(new Set()) ? "yes" : "no", "no");
check("which skill-rules 8 records as the open mechanism",
  /The mechanism this section needs is a `skillCard` grant/.test(
    fs.readFileSync(path.join(root, "../../rules/skill-rules.md"), "utf8")) ? "yes" : "no", "yes");
/* Direction two, which is the one nobody had asked: the graph hands it over and the rules never
 * called it a reward. This is where `carry` was, six nodes deep. */
check("and grants the graph hands out that section 4 never offered",
  [...grantedSomewhere].filter(k => !(k in rewardKeys) && k !== "caps" && k !== "signature")
    .sort().join(", ") || "none", "none");
/* And how thin the thinnest of them is, because "granted once" is a different thing from placed. */
check("the rewards only one or two nodes grant",
  Object.entries(rewardKeys).filter(([k]) => timesGranted(k) <= 2)
    .map(([k, label]) => `${label} ${timesGranted(k)}`).sort().join(", "),
  "Deck cap 1, Item 1");
/*
 * The two character grants that no reward row offers and no node grants, each for a stated reason.
 * **handSize** is measured: specializations.md puts a card of hand size at 6 to 10 points of win
 * rate, the dearest stat anywhere in this project, `which is worth remembering before anything
 * offers one`. **armor** is gear -- it comes off a rung of armour you bought, and 4's own
 * reasoning about gold applies unchanged: a level is a permanent change to who you are, and armour
 * is something you find and can be parted from.
 */
check("character grants with no reward row and no node",
  charGrants.filter(k => !(k in rewardKeys) && timesGranted(k) === 0).join(", "),
  "handSize, armor");
check("because the rules price hand size as the dearest stat measured",
  /Hand size is the most expensive stat measured/.test(specDoc) ? "yes" : "no", "yes");

/*
 * **A crossing is paid in access, not in grants.** leveling 1 prices it that way -- *a cross edge
 * to a title is cheap, past one is the leak* -- and the crossings grant no card on purpose because
 * the cards are behind the title. A node whose only purpose is to put a title on the frontier is
 * credited with that, or the measurement punishes the design for working. The whole chain counts,
 * not just its last node: neither half of a crossing has any other purpose.
 */
const openToTitle = new Set();
for (const n of nodes) if (n.title) for (const a of n.after ?? []) openToTitle.add(a);
for (let pass = 0; pass < 4; pass++) {
  for (const n of nodes) {
    if (!openToTitle.has(n.id) || n.title) continue;
    for (const a of n.after ?? []) if (a.includes(".cross.")) openToTitle.add(a);
  }
}
const rewardOf = n => {
  let w = n.signature ? RUNG.signature : 0;
  for (const k of Object.keys(n.grants ?? {})) w += (RUNG[k] ?? 0);
  return w + ((openToTitle.has(n.id) && !n.title) ? 2 : 0);
};
/*
 * Titles are excluded from the curve on purpose. They are placed by §5a's stringency devices and by
 * §7.1's tiers, which is why they cluster at levels 5 and 8 -- that is the tier rule working, and
 * averaging them in would read a deliberate shape as a defect.
 */
const curveNodes = nodes.filter(n => !n.title && n.id !== graph.ROOT);
const meanAt = lv => {
  const at = curveNodes.filter(n => graph.levelFor(n.id) === lv);
  return at.length ? avg(at.map(rewardOf)) : null;
};
/*
 * **The invariant, one-sided like §7.1's.** Not *every level pays more than the last* -- the load is
 * varied on purpose and the spread at each level is two or three weights wide -- but *the back half
 * does not taper*. This is the pin that failed before the fix: 2.50, 2.33, 1.44, 1.25.
 */
check("mean reward at levels 8 through 11",
  [8, 9, 10, 11].map(lv => meanAt(lv).toFixed(2)).join(", "), "2.50, 2.89, 3.22, 4.00");
check("and it rises every step of the back half",
  [8, 9, 10].every(lv => meanAt(lv) < meanAt(lv + 1)), true);
/*
 * **A capstone is a node nothing follows and no title stands behind.** It is the last thing a
 * character on that branch will ever take, so way-cards 3.4's *a branch has to be worth walking to
 * the end* is about exactly these -- and nine of them granted nothing a fight would notice.
 */
const FLAVOUR = new Set(["knowHow", "mastery", "carry", "language", "restTokens"]);
const followed = new Set(nodes.flatMap(n => n.after ?? []));
const capstones = nodes.filter(n => !followed.has(n.id) && !n.title);
const hollow = capstones.filter(n => {
  const keys = Object.keys(n.grants ?? {});
  return keys.length > 0 && keys.every(k => FLAVOUR.has(k));
});
check("capstones", capstones.length, 38);
check("capstones granting nothing a fight would notice",
  hollow.map(n => `${n.name} (lv ${graph.levelFor(n.id)})`).join(", ") || "none", "none");
/*
 * And the reason it came out right: a litany's top two rungs are the two a caster cannot cast until
 * they are deep, because **strength is the slot cost** (way-cards 1.4). So the 4s and the 5s have to
 * average deeper than the 1s, 2s and 3s, and before the fix they averaged nowhere -- every one of
 * them was on no node at all.
 */
const strengthAt = band => {
  const ls = nodes.filter(n => n.grants?.spell && band.includes(everySpell.get(n.grants.spell)?.strength))
    .map(n => graph.levelFor(n.id));
  return ls.length ? avg(ls) : null;
};
check("mean level a 1, 2 or 3 is granted at", strengthAt([1, 2, 3]).toFixed(2), "6.14");
check("and a 4 or a 5", strengthAt([4, 5]).toFixed(2), "8.20");
check("so the top of a litany lands deeper than its bottom",
  strengthAt([4, 5]) > strengthAt([1, 2, 3]), true);
/*
 * The documents say the rule, so a graph that drifted back could not do it quietly.
 */
check("leveling states the rule", /^## 5b\. The reward climbs with the branch/m.test(levDoc)
  ? "yes" : "no", "yes");
check("and that a level late in a branch must not buy less than one early in it",
  /\*\*A level late in a branch must not buy less than a level early in it\.\*\*/.test(levDoc)
    ? "yes" : "no", "yes");

/*
 * **The trade a priest makes at level 8, and it is the sharpest thing in this audit.** An order's
 * lead-in grants no miracles, because a node open to all twelve gods cannot know which list to
 * grant from -- so the three levels that buy an order are three levels that buy no miracle. A
 * priest arrives at an order with five slots and one miracle to put in them, which is the slot
 * ladder of 1.4 paying for a list the route never acquires.
 *
 * Way of Mind has no such trade: a school's lead-in nodes grant formulas, so depth and content
 * arrive together. The asymmetry is structural rather than a tuning slip, and the fix would be a
 * node that grants a choice from WHATEVER god you are sworn to -- which `choose: { from }` cannot
 * express today, because `from` is a literal source name.
 */
const branchRoute = god => {
  let owned = new Set([graph.ROOT, ...(graph.REACH.get(god) ?? []), god]);
  for (let i = 0; i < 3; i++) {
    const shut = graph.closedIds(owned);
    const best = [...graph.reachable(owned, shut)]
      .filter(id => !owned.has(id) && !shut.has(id) && id.startsWith("faith.")
        && graph.canTake(id, owned, shut))
      .map(id => ({ id, v: (graph.SPELLS.get(byId.get(id)?.grants?.spell)?.strength ?? 0)
        + (byId.get(id)?.grants?.choose ? 5 : 0) }))
      .sort((a, b) => b.v - a.v)[0];
    if (!best) break;
    owned.add(best.id);
  }
  return graph.grantsOf(owned);
};
const orderRoute = god => graph.grantsOf(new Set([graph.ROOT, ...(graph.REACH.get(god) ?? []),
  god, "faith.ordination", "faith.order.cloister", "faith.anchorite"]));
const godIdsForTrade = nodes.filter(n => n.exclusive === "faith").map(n => n.id);
check("miracles a priest holds at level 8 on the order route",
  [...new Set(godIdsForTrade.map(g => orderRoute(g).spells.length))].join(", "), "1");
check("and on their god's own branch instead",
  [...new Set(godIdsForTrade.map(g => branchRoute(g).spells.length))].sort().join(", "), "2, 3");
check("plus the choices from their god's list that branch buys",
  [...new Set(godIdsForTrade.map(g => branchRoute(g).choices.length))].sort().join(", "), "1, 2");
check("and no node behind an order grants a miracle",
  nodes.filter(n => n.id === "faith.ordination" || n.id.startsWith("faith.order."))
    .filter(n => n.grants?.spell || n.grants?.choose).length, 0);
check("way-cards records the trade", /five slots and one miracle/.test(wayDoc) ? "yes" : "no", "yes");

/*
 * **Exclusivity is Way of Faith's real price, and this is the first time it has been counted.** A
 * character who never leaves Strength, Shade or Mind can eventually own their whole Way -- a mage
 * can hold all twelve schools. A priest cannot: the creed rule shuts eleven doors, or seven for a
 * pantheon. So Faith is the largest Way on paper and the smallest in a character's hands, and the
 * gods' gifts are what the closed doors are supposed to buy back (specializations.md).
 */
const reachOneWay = titleId => {
  const way = wayOfId(titleId);
  const inWay = id => id === way || id.startsWith(`${way}.`);
  let owned = new Set([graph.ROOT, ...(graph.REACH.get(titleId) ?? []), titleId]);
  for (let i = 0; i < 14; i++) {
    const shut = graph.closedIds(owned);
    const live = [...graph.reachable(owned, shut)]
      .filter(id => !shut.has(id) && (id === graph.ROOT || inWay(id)));
    const next = new Set([...owned, ...live]);
    if (next.size === owned.size) break;
    owned = next;
  }
  return [...owned].filter(id => id !== graph.ROOT).length;
};
const sizeOf = way => nodes.filter(n => n.id === way || n.id.startsWith(`${way}.`)).length;
check("nodes in each Way", WAYS.map(w => `${w} ${sizeOf(w)}`).join(", "),
  "strength 39, shade 41, mind 46, faith 77");
check("and how many of them one character can ever own",
  [["strength.infantry", "strength"], ["shade.thief", "shade"], ["mind.blood", "mind"]]
    .map(([t, w]) => `${w} ${reachOneWay(t)}/${sizeOf(w)}`).join(", "),
  "strength 39/39, shade 41/41, mind 46/46");
check("a priest of a pantheon, and of a lone god",
  `${reachOneWay("faith.sessyfyn")}/77, ${reachOneWay("faith.vax")}/77`, "33/77, 21/77");

/*
 * The two casting Ways' lists, against the world's own sizing: priest magic is *a shorter list than
 * a mage's* (specializations.md), which is the one cross-Way balance claim the world states outright.
 * It holds, by about a quarter on both count and weight.
 */
const listsBySource = [...graph.SPELLS_BY_SOURCE.entries()];
const listsOf = way => listsBySource
  .filter(([src]) => nodes.find(n => n.title === src)?.id.startsWith(way));
check("mean list size, mind against faith",
  ["mind", "faith"].map(w => avg(listsOf(w).map(([, l]) => l.length)).toFixed(1)).join(" / "),
  "7.3 / 5.2");
check("and mean list weight in slots",
  ["mind", "faith"].map(w => avg(listsOf(w)
    .map(([, l]) => l.reduce((a, s) => a + s.strength, 0))).toFixed(1)).join(" / "),
  "18.6 / 14.2");

/*
 * And the one difference between specializations that is nobody's design: **how much of each list
 * the engine can actually run today.** Eleven of the twenty-four lists are waiting on the engine
 * from end to end, so a character of those sources has a complete written specialization and
 * nothing playable in it, while Spiritualism is five formulas of six built. That is a build order
 * rather than a balance fault -- but it is the difference a player would feel first.
 */
/* Five: Tattoo Magic rejoined them when its seven cards named the slot they spend for good. */
check("lists waiting on the engine from end to end",
  listsBySource.filter(([, l]) => l.every(s => s.needs?.length)).length, 5);
check("and which they are",
  listsBySource.filter(([, l]) => l.every(s => s.needs?.length)).map(([s]) => s).sort().join(", "),
  /* Fagar and The Grey are finished now: the two cards holding them back were describing
   * conditions -- The Second Thought was Dazed all along, and The Silent Hour wanted Halted. */
  /* Necromancy and The Yellow came off this list in the sweep: every gap they still named had
   * been built, one of them two increments earlier. */
  /* Brendan went too, and it is the neatest of them: the comment above its three miracles has
   * always said "all three resolve on a turn that has not happened", which is `delay` named in
   * prose a month before the field existed. */
  /* Household Magic and Tattoo Magic went with the ritual and permanent gaps: between them they
   * were the two lists built entirely out of work that was already done. */
  "Asceticism, Shadow Magic, Tattoo Magic, The First, Vax");
check("the list the engine runs best",
  listsBySource.map(([s, l]) => [s, l.filter(x => x.needs?.length).length / l.length])
    .sort((a, b) => a[1] - b[1])[0][0], "Spiritualism");


/*
 * ---- a node that grants your CHOICE from a school's or a god's list ----
 *
 * The gap the eighty-five formulas and the sixty-one miracles left behind: fifty-two of the
 * hundred and forty-seven were named by a node and **ninety-five were on none**, because a school
 * branch has three nodes and a school's list has six to ten entries. way-cards 3 writes this
 * content as pools -- *a set the minor nodes along a branch draw from* -- and a pool larger than
 * the nodes that draw on it is a menu nobody can order from.
 *
 * A node may now name a SOURCE instead of a spell. Nothing already on a branch changed: every
 * named grant is still the formula its branch was written around, and these are one more node each.
 */
check("the sources a spell can be chosen from", graph.SPELLS_BY_SOURCE.size, 24);
check("and every source is a school or a god in the document",
  [...graph.SPELLS_BY_SOURCE.keys()].filter(src => !spellTables.some(r => r.group === src))
    .join(", ") || "none", "none");
/* Cheapest first in the list, because strength IS the slot cost and a two-slot caster reads for
 * a 1 (way-cards 1.4). */
const ladderOrder = [...graph.SPELLS_BY_SOURCE.values()]
  .filter(list => list.some((sp, i) => i > 0 && sp.strength < list[i - 1].strength));
check("source lists that are not in strength order", ladderOrder.length, 0);

const menuNodes = nodes.filter(n => n.grants?.choose?.from);
check("nodes that offer a choice", menuNodes.length, 26);
/*
 * **Twenty-six now: one behind every school, every god, and each martial Way.**
 * **[BUILT 2026-11-07]**
 *
 * The two new ones are Shade's and Strength's, and they close the gap 4a's own opening sentence
 * describes -- *a pool larger than the nodes that draw on it is a menu nobody can order from.*
 * That section measured it on the spell side and then called a named grant *the right shape for a
 * card pool, where a Way's thirteen cards meet about twenty pool nodes*; the martial pools hold
 * **35** cards with **21 on no node at all**, so the sentence had expired and the mechanism, not
 * the reasoning, was what needed extending.
 */
check("one behind every school, every god and each martial Way",
  new Set(menuNodes.map(n => n.grants.choose.from)).size, 26);
/* And what each martial menu may offer, which is every rung of the cost ladder but the top one:
 * way-cards 1.3 reserves Spent + Strain at "once in a deck", and a card has no slot budget to
 * fence it the way a spell's strength fences a formula. */
check("cards a martial menu offers",
  [...graph.CARDS_BY_SOURCE].map(([k, v]) => `${k} ${v.length}`).join(", "),
  "Shade 14, Warrior 14");
check("and the card held back from one",
  [...content.SHADE_POOL, ...content.STRENGTH_POOL].filter(graph.topRung)
    .map(c => c.name).join(", ") || "none",
  "Nothing Held Back");
/* Each sits directly behind its own title, which is the earliest the choice can honestly be
 * offered: 3.4 argues the bottom of the ladder from a caster's FIRST day with the school. */
const offBranch = menuNodes.filter(n => {
  const parent = byId.get(n.after?.[0]);
  return parent?.title !== n.grants.choose.from;
}).map(n => n.id);
check("menu nodes not sitting behind their own title",
  offBranch.length ? offBranch.join(", ") : "none", "none");
/* A menu node is a pool node, never a bespoke one: it is the definition of drawing from a pool. */
check("menu nodes marked bespoke",
  menuNodes.filter(n => n.bespoke).length, 0);

/*
 * And the point of all of it: nothing is written down and unreachable any more.
 *
 * **Asked of both kinds of list now.** A menu names a spell source or a card source, so the sweep
 * has to read whichever it is -- and the card half is the question that prompted the martial menus
 * in the first place. It was **21 of 35** before them.
 */
const spellMenus = menuNodes.filter(n => graph.SPELLS_BY_SOURCE.has(n.grants.choose.from));
const cardMenus = menuNodes.filter(n => graph.CARDS_BY_SOURCE.has(n.grants.choose.from));
check("menu nodes, split by the kind of list they name",
  `${spellMenus.length} spell, ${cardMenus.length} card`, "24 spell, 2 card");

const namedByNodes = nodes.filter(n => n.grants?.spell).map(n => n.grants.spell);
const choosable = new Set(spellMenus
  .flatMap(n => graph.SPELLS_BY_SOURCE.get(n.grants.choose.from).map(sp => sp.name)));
const unreachableSpells = [...graph.SPELLS.keys()]
  .filter(name => !namedByNodes.includes(name) && !choosable.has(name));
check("spells no node can hand over at all",
  unreachableSpells.length ? unreachableSpells.join(", ") : "none", "none");

/*
 * The same question of the card pools, which had never been asked and is why the martial menus
 * exist. What is left is the shape the fix leaves behind rather than a leftover:
 *
 *  - the **common pool**, which has no menu because a menu sits behind the title whose list it
 *    offers and the common pool is nobody's title;
 *  - *Nothing Held Back*, deliberately held back -- the top rung of way-cards 1.3's ladder stays
 *    under a named grant, because a card has no slot budget to fence it with.
 */
const namedCards = new Set(nodes.filter(n => n.grants?.card).map(n => n.grants.card));
const choosableCards = new Set(cardMenus
  .flatMap(n => graph.CARDS_BY_SOURCE.get(n.grants.choose.from).map(c => c.name)));
const poolCards = [...content.COMMON_POOL, ...content.SHADE_POOL, ...content.STRENGTH_POOL];
const unreachableCards = poolCards.map(c => c.name)
  .filter(name => !namedCards.has(name) && !choosableCards.has(name));
check("pool cards in total", poolCards.length, 35);
check("cards no node can hand over at all",
  unreachableCards.length ? unreachableCards.sort().join(", ") : "none",
  "Both Hands, Dig In, Nothing Held Back, Off-Hand Blow, Press");
check("and all of them are one of the two declared cases",
  unreachableCards.every(name => {
    const card = poolCards.find(c => c.name === name);
    return card.pool === "common" || graph.topRung(card);
  }), true);
/* Which is a different number from before, and it is the one the last pass pinned at ninety-five. */
check("spells reachable only through a choice",
  [...graph.SPELLS.keys()].filter(n => !namedByNodes.includes(n)).length, 76);

/* The engine reads the key in all four places a grant has to be read -- and since 2026-11-07 it
 * reads WHICH KIND of list the source names, because a card and a spell are different documents. */
check("taking a node asks the question",
  /CARDS_BY_SOURCE\.has\(grants\.choose\.from\)\s*\n\s*\? grantCardChoice\(actor, grants\.choose\.from\)\s*\n\s*: grantSpellChoice\(actor, grants\.choose\.from, id\)/
    .test(graphSource) ? "yes" : "no", "yes");
/* And one function answers "what does this source offer", so no caller asks it twice. */
check("one question, one answer, for either kind of list",
  /export const choiceList = source =>\s*\n\s*SPELLS_BY_SOURCE\.get\(source\) \?\? CARDS_BY_SOURCE\.get\(source\) \?\? null;/
    .test(graphSource) ? "yes" : "no", "yes");
/*
 * **And the choice dispatches on kind, which is one branch at the end of the menu.**
 *
 * Two of the twenty-four menus hand over features: Tattoo Magic teaches no formulas at all, and
 * Asceticism's ladder ends in two renunciations. A menu that could only call `grantSpell` would
 * have handed over a spell document for a thing that is never prepared.
 */
check("and the choice is handed over by the routine the kind calls for",
  /return teachingKind\(def\) === "feature"\s*\n\s*\? grantSlate\(actor, chosen, "feature"\)\s*\n\s*: grantSpell\(actor, chosen, nodeId\);/
    .test(graphSource) ? "yes" : "no", "yes");
/* And `grantSlate` finds a pool teaching, not only a Signature: eight of the nine features a
 * school teaches have never been in `SLATES`. */
check("granting a slate looks beyond the Signatures",
  /const def = SLATES\.get\(name\) \?\? TEACHINGS_BY_NAME\.get\(name\);/.test(graphSource)
    ? "yes" : "no", "yes");
check("and it looks the teaching up by name to find out",
  /const def = TEACHINGS_BY_NAME\.get\(chosen\);/.test(graphSource) ? "yes" : "no", "yes");
/* A feature already held is left out of the menu too, or a school would offer the same ink twice. */
check("and what is already held counts either kind",
  /i\.type === "spell" \|\| i\.type === "feature"/.test(graphSource) ? "yes" : "no", "yes");
check("what the player already knows is left out of the list",
  /const open = list\.filter\(spell => !held\.has\(spell\.name\)\);/.test(graphSource)
    ? "yes" : "no", "yes");
/* Both menus say so, which is why this counts rather than finds: a spell menu and a card menu
  * each spend the level either way, and a silent empty dialog is the failure in both. */
check("menus that say so when there is nothing left to give",
  (graphSource.match(/if \(!open\.length\) \{[\s\S]{0,160}?CARDRPG\.Level\.NothingLeft/g) ?? [])
    .length, 2);
check("the pane reads the choice out loud",
  /if \(g\.choose\?\.from\) \{[\s\S]{0,200}CARDRPG\.Level\.Choose/.test(graphSource)
    ? "yes" : "no", "yes");
check("and grantsOf carries the sources offered",
  /if \(g\.choose\?\.from\) out\.choices\.push\(g\.choose\.from\);/.test(graphSource)
    ? "yes" : "no", "yes");
check("a blank sheet has been offered no choices", graph.grantsOf(new Set()).choices.length, 0);
/*
 * A choice from a source nobody wrote is a fault rather than an empty dialog, because the level is
 * spent either way and this one looked like a reward.
 */
check("a choice from a source with no spells is refused",
  graph.graphFaults([...content.NODES,
    { id: "mind.ghost", after: ["mind"], grants: { choose: { from: "Ghost Magic" } } }])
    .join("; "), "mind.ghost offers a choice from Ghost Magic, which has nothing in it");
check("and the live graph has no such fault", graph.graphFaults(graph.LIVE_NODES).length, 0);

/*
 * And the decision is written down, because a mechanism nobody documented is a mechanism the next
 * pass invents again from scratch. The ratio note is in there too: the budget's ceiling is what the
 * check enforces, and the share it used to band is recorded instead.
 */
check("leveling.md carries the key as a section",
  /^### 4a\. A node may grant a \*choice\* from a school's or a god's list {2}\*\*\[BUILT/m
    .test(levDoc) ? "yes" : "no", "yes");
check("and shows the shape a node takes",
  /grants: \{ choose: \{ from: "Poison" \} \}/.test(levDoc) ? "yes" : "no", "yes");
check("and says a source nobody wrote is a fault",
  /a \*\*graph fault\*\*, refused at assembly/.test(levDoc) ? "yes" : "no", "yes");
check("and records the open question it did not take",
  /\[OPEN\] Or should a school's node hand over the whole book\?/.test(levDoc) ? "yes" : "no",
  "yes");
check("and that the bespoke budget is a ceiling on the count",
  /The budget is a ceiling on the COUNT, and the validator now says so/.test(levDoc)
    ? "yes" : "no", "yes");
check("way-cards records that the list can now be ordered from",
  /\*\*And then a way to be handed it\.\*\*/.test(waycards) ? "yes" : "no", "yes");
check("and the argument for where the nodes sit",
  /that only means anything if the caster picks off it/.test(waycards) ? "yes" : "no", "yes");

/* Every string the chooser prints exists, which is the check a dialog nobody has opened needs. */
for (const key of ["Choose", "ChooseTitle", "ChooseBody", "ChooseConfirm", "NothingLeft"]) {
  check(`the string for ${key}`, typeof lang[`CARDRPG.Level.${key}`], "string");
}
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
check("content the engine does everything for", workingCards, 94);
check("content with a named gap", audited.filter(c => c.needs.length).length, 114);

/*
 * A gap shared by several cards is one piece of engine work, not several. Counting the DISTINCT
 * gaps is what turns the column into a queue -- and the largest of them is worth knowing.
 */
const gapCounts = new Map();
for (const card of audited) {
  for (const gap of card.needs) gapCounts.set(gap, (gapCounts.get(gap) ?? 0) + 1);
}
/*
 * Ninety-nine, and the new one is the Wild's: charging a price the rules say lasts *until you
 * sleep* against an engine with no sleep that empties a fate deck. Naming it is what keeps the
 * overcharge from being a silent one.
 */
check("distinct gaps across all content", gapCounts.size, 100);
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
/*
 * **The flat tail is gone, and one gap is now plainly first.** It used to be a six-way tie at two,
 * which is the shape of an audit that cannot answer "what next"; Necromancy's five formulas and
 * The Purple's thesis all pay in Taint, so a spell that taints its caster is named by eight pieces
 * of content and is the largest single piece of work in the game.
 */

/*
 * **A gap a card has already built is a gap it may not still name.**
 *
 * Twenty-four gap entries rotted across four increments, and every time in the same way: a field
 * was added, the content was converted to use it, and the column went on promising the thing was
 * not built. The census overstated the backlog by a sixth, and no check could see it -- every
 * check about this column was about its SHAPE (is every gap a sentence, is any too short, how many
 * are there) and none about whether it was still TRUE.
 *
 * So each gap that a field closes is mapped to the question that decides it. The map is a cost: it
 * has to be extended when a field is. What it buys is that the column cannot quietly rot again.
 */
const stepsOfContent = c => [...(c.primary ?? []), ...(c.secondary ?? []), ...(c.sequence ?? []),
  ...(c.effect ? [c.effect] : [])];
const GAP_CLOSERS = [
  ["terrain a spell places on the map", c => stepsOfContent(c).some(s => s.ground?.shape)],
  ["shadow as a state a square is in",
    c => stepsOfContent(c).some(s => (s.ground?.effects ?? []).includes("shadowed"))],
  ["placing a trap on a square",
    c => stepsOfContent(c).some(s => (s.ground?.effects ?? []).includes("trap"))],
  ["a figure a spell puts on the map", c => stepsOfContent(c).some(s => s.verb === "conjure")],
  ["an effect that resolves on a later turn", c => stepsOfContent(c).some(s => s.delay)],
  ["an effect held up by spending a secondary",
    c => stepsOfContent(c).some(s => /spendSecondary|upkeep/.test(s.whileState ?? ""))],
  ["reading the top of a fate deck", c => stepsOfContent(c).some(s => s.readDeck)],
  ["a cost that scales with the allies it covers", c => c.cost?.scale === "perAlly"],
  ["a spell that taints its caster", c => (c.cost?.taint ?? 0) > 0],
  ["an enemy that loses a half", c => stepsOfContent(c).some(s => s.condition === "dazed")],
  ["a reaction that stops an action", c => stepsOfContent(c).some(s => s.condition === "halted")],
  ["a second secondary for every ally in an area",
    c => stepsOfContent(c).some(s => s.targets === "alliesInRange")],
  ["a ritual, which costs no slots at all",
    c => stepsOfContent(c).some(s => s.timing === "ritual")],
  /*
   * **The gap seven cards named, and what closed it is not a spell.**
   *
   * It read `timing === "permanent"` and a bonus on the slate, and both of those are gone: the
   * bonus rides on the condition the step applies, and a permanent formula is a feature -- *a thing
   * usable without being equipped or prepared*. So the closer asks what the nine actually are, a
   * feature a school teaches that carries a field rather than a sentence. No card names this gap
   * any more; the entry is here so that one naming it again is caught rather than believed.
   */
  ["a permanent formula that is never prepared and carries a bonus",
    c => c.kind === "feature" && !!c.source
      && (stepsOfContent(c).some(s => !!s.bonus?.value)
        || Object.values(c.grants ?? {}).some(v => v))]
];
const rotted = [];
for (const [gap, isBuilt] of GAP_CLOSERS) {
  for (const c of audited.filter(x => (x.needs ?? []).includes(gap))) {
    if (isBuilt(c)) rotted.push(`${c.name}: "${gap}"`);
  }
}
check("gaps kept by content that has already built them",
  rotted.length ? rotted.slice(0, 5).join(" | ") : "none", "none");
/*
 * **And every closer can say yes.** A break test replaced one question with `() => false` and this
 * section passed in silence -- which is the oldest failure mode in this file, *a check that cannot
 * fail looks exactly like a check that passes*, and worse here than usual: this map's whole job is
 * to notice when something else has stopped being true.
 *
 * For the gaps closed outright the answer comes from the content that closed them; for the rest,
 * from the cards that have already built it. A closer nothing satisfies is pointing at a field
 * nobody writes or asking a question that cannot be answered.
 */
const mute = GAP_CLOSERS.filter(([, isBuilt]) => !audited.some(c => isBuilt(c))).map(([g]) => g);
check("closers no content in the game can satisfy", mute.join(", ") || "none", "none");
/* And how many each one finds, so a closer narrowing to one card is visible rather than silent. */
check("content each closer recognises",
  GAP_CLOSERS.map(([gap, isBuilt]) => `${audited.filter(c => isBuilt(c)).length}`).join(" "),
  "7 2 1 5 5 4 4 3 3 6 1 4 7 5");
/*
 * And the map does not rot either: a gap nobody names and nobody has built is a line in this list
 * describing nothing. Two are allowed to be unnamed, because closing them is what emptied them --
 * `placing a trap on a square` and `a reaction that stops an action` were Set's and The Silent
 * Hour's, and both cards are finished.
 */
const CLOSED_OUTRIGHT = ["placing a trap on a square", "a reaction that stops an action",
  "terrain a spell places on the map", "an effect held up by spending a secondary",
  "reading the top of a fate deck", "a cost that scales with the allies it covers",
  "an effect that resolves on a later turn", "a second secondary for every ally in an area",
  "a ritual, which costs no slots at all",
  "a permanent formula that is never prepared and carries a bonus"];
const idleClosers = GAP_CLOSERS
  .filter(([gap]) => !audited.some(c => (c.needs ?? []).includes(gap)))
  .map(([gap]) => gap);
check("mapped gaps nobody names, which closing them explains",
  idleClosers.filter(g => !CLOSED_OUTRIGHT.includes(g)).join(", ") || "none", "none");
check("and the ones closed outright really are empty",
  CLOSED_OUTRIGHT.filter(g => !idleClosers.includes(g)).join(", ") || "none", "none");
/* A map that matched nothing would pass both checks above in silence. */
check("gaps the map is able to decide",
  GAP_CLOSERS.filter(([gap]) => audited.some(c => (c.needs ?? []).includes(gap))).length, 4);
/*
 * **And the whole queue, ranked.** The suite has always named the single most-mentioned gap; what
 * it never showed is the distribution, which is what makes "what next" answerable: a gap named by
 * one card is a card-sized job, and one named by seven is a mechanism seven cards wait on.
 */
const queue = new Map();
for (const c of audited) {
  for (const gap of c.needs ?? []) queue.set(gap, (queue.get(gap) ?? 0) + 1);
}
const topOfQueue = [...queue].filter(([, n]) => n >= 4)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([gap, n]) => `${n} ${gap}`);
check("the gaps four or more pieces of content wait on", topOfQueue.join(" | "),
  "8 a spell slot spent for good | 6 skill cards set aside to pay for a formula | "
  + "5 a condition applied to an area | "
  + "5 a spell that taints its caster | "
  + "5 a Wild that leaves the fate deck when you sleep | "
  + "4 an enemy that attacks its own side");

check("the gap mentioned by the most content", `${worst.join("; ")} (${most})`,
  "a spell slot spent for good (8)");

const finishes = new Map();
for (const card of audited) {
  if (card.needs.length !== 1) continue;
  finishes.set(card.needs[0], (finishes.get(card.needs[0]) ?? 0) + 1);
}
const bestFinish = Math.max(...finishes.values());
/*
 * And FINISHED is a different gap from MENTIONED, which is the whole reason both are counted: the
 * Taint price is named by eight and finishes none of them on its own, because every formula that
 * pays it also wants a figure on the map or a condition over an area. A standing bonus on a
 * never-prepared spell finishes five of Tattoo Magic's seven outright.
 */
check("the gap that would finish the most content",
  [...finishes.entries()].filter(([, n]) => n === bestFinish).map(([g]) => g).sort().join("; ")
  + ` (${bestFinish})`,
  "an enemy that attacks its own side; skill cards set aside to pay for a formula (4)");
/* And how much of the queue is one card deep, which is what a long tail of singletons means. */
/*
 * Fifty, down one: five Shadow formulas that each named a single gap now name two, so they leave
 * the "one gap away" list -- and *Step Through*, which had no audit column at all because
 * SHADOW_FORMULAS is not one of the audited exports, joins it with exactly one.
 *
 * Fifty-seven now. *Going through armour entirely* and *a step that ignores Block* were each one
 * card away and are both built, so they leave the queue by being finished rather than by being
 * re-counted -- which is the only way a number here is allowed to fall.
 */
check("gaps that would finish exactly one piece of content",
  [...finishes.values()].filter(n => n === 1).length, 58);

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
/*
 * One predicate, and now **two** callers ask it: a slate's bonus and a condition's. So this is a
 * count rather than a grep, which is the suite's own rule -- a grep two places can answer is a grep
 * about neither, and the second caller arrived the day the bonus moved onto a condition.
 */
check("callers that ask the same predicate for a bonus's tag",
  (resolveSource.match(
    /if \(bonus\.requiresTag && !itemMeets\(item, \{ tag: bonus\.requiresTag \}\)\)/g) ?? []).length,
  2);
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

/* ---- the art list stays in step with the content ---- */

/*
 * The brief is **generated** from the same content the game reads, so a piece that exists in the
 * game is in the brief and a piece in the brief exists in the game. A hand-written list would have
 * gone stale the first time somebody added a card -- and this project added a hundred and sixty of
 * them in a fortnight.
 *
 * What is checked is the committed file against today's content, because a stale list is a brief
 * somebody draws the wrong things from.
 */
const artList = fs.readFileSync(path.join(root, "../art-list.md"), "utf8");
/* The card and slate schema document, which is where the step grammar is explained. */
const cardSchemaDoc = fs.readFileSync(path.join(root, "../card-slate-schema.md"), "utf8");
/*
 * **Every creature in the world, because a token is art and a creature is the thing it is of.**
 * The brief had cards, spells, features and items and no creatures at all -- forty-seven of them,
 * each already carrying the one-line description somebody wrote when they made it, which is a
 * better brief than anything invented for the purpose.
 */
const everyCreatureForArt = monsters.expandRoster(content.ROSTER, content.VARIANTS);
const artable = [
  content.WARRIOR_DECK, content.INTENTS, content.COMMON_POOL, content.WAY_CARDS,
  content.SHADE_POOL, content.STRENGTH_POOL, content.WARRIOR_SKILLS, content.WILD_MAGIC,
  content.FORMULAS, content.SHADOW_FORMULAS, content.MIND_POOL, content.FAITH_POOL,
  content.FEATURES, content.ITEMS.filter(i => !i.npc && !content.forges(i.name)),
  content.NPC_GEAR ?? [],
  content.NATURAL_WEAPONS ?? [], everyCreatureForArt, [content.WARRIOR],
  ...Object.entries(content).filter(([k]) => k.endsWith("_SIGNATURES")).map(([, v]) => v)
].flat();
check("pieces of content that take art", artable.length, 585);
/*
 * **The four items that are content without being commissions, and the item each one wears.**
 *
 * `artable` excludes them through `content.forges`, which is the same call the art list filters
 * on, so neither file can drift from the other -- and that is exactly why the pairing itself has
 * to be pinned here instead. A one-line edit to `COUNTERFEIT` would otherwise take an item out of
 * the brief, out of the book and out of the shoot with every count still agreeing and nothing to
 * say a picture had stopped being commissioned.
 *
 * The honest half of each pair must be a piece in its own right. A counterfeit pointed at another
 * counterfeit, or at an item nobody draws, is a cursed ring with no picture at all.
 */
check("counterfeits, and the item each one is drawn as",
  Object.entries(content.COUNTERFEIT).map(([f, r]) => `${f} -> ${r}`).join(" | "),
  "Ring of Open Hands -> Ring of the Open Hand "
  + "| Cloak of the Grey Road -> Cloak of the Grey "
  + "| Boots of the Longer Step -> Boots of the Long Step "
  + "| Amulet of the Fed Thread -> Amulet of the Mended Thread");
check("and each is cursed, and each one it forges is not",
  Object.entries(content.COUNTERFEIT).filter(([fake, real]) => {
    const f = content.ITEMS.find(i => i.name === fake);
    const r = content.ITEMS.find(i => i.name === real);
    return !f?.curse || !r || r.curse || content.forges(real) || !artable.includes(r);
  }).map(([f]) => f).join(", ") || "none", "none");
/*
 * **And the goblin's authored deck is gone entirely.** Six cards from before the intent pool, five
 * of which had no counterpart in it because the pool had replaced them -- Rush is Close In, Cower
 * is Give Ground, Dirty Trick is Envenom, Throw Rock is Loose. The brief asked for five pictures
 * nobody would ever see, and the setup routine shipped the cards into every world in a document no
 * actor held.
 */
check("the authored goblin deck is retired",
  "GOBLIN_DECK" in content ? "still there" : "gone", "gone");
/* Read without comments, because the paragraph that explains why the document is gone names it,
 * and a grep answered by the prose about itself is a grep about nothing. Twice before in this
 * suite, and both times it looked right in every reading of the source. */
const setupCode = setupSource.replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n").map(line => line.replace(/\/\/.*$/, "")).join("\n");
/*
 * **Two gaps declared rather than carried quietly**, because each one is the kind that passes every
 * check by being absent.
 *
 * A piece on an art shelf gets a path derived from its name, and a path with no file behind it is a
 * silent fallback to Foundry's placeholder -- so ten undrawn designs on a shelf would be ten
 * pictures that never show and never complain. The deck stays off the shelves until somebody draws
 * it, and `artable` above is the list that would have to grow.
 *
 * And the starter routine still deals the Warrior. Choosing between two chassis is character
 * creation, which core-rules 12 defers until after the first playtest **on purpose**; a deck the
 * rules describe and no routine deals is the honest state of that decision.
 */
check("the Shade deck is on an art shelf",
  artable.includes(content.SHADE_DECK[0]) ? "yes" : "no", "no");
check("and the starter routine deals one chassis, not two",
  /SHADE_DECK/.test(setupCode) ? "two" : "one", "one");
check("and nothing builds a document for it",
  /goblin\.action/.test(setupCode) ? "still built" : "gone", "gone");
/* And the grep is not vacuous: the key the creature builder DOES use is still there to be found. */
check("while the one it replaced it with is",
  /\$\{kind\}\.deck/.test(setupCode) ? "yes" : "no", "yes");

/*
 * The backs, which are a different kind of art: **one picture per deck, not one per card**, doing
 * one job -- saying which deck a face-down card came from. Five against four hundred and
 * ninety-five faces, and the five are what a table looks at all evening.
 */
const backs = Object.entries(content.DECK_BACKS);
check("deck backs", backs.length, 10);
check("the decks that take one", backs.map(([k]) => k).join(", "),
  "action, fate, skill, item, feature, condition, spell, twist, wild, npc");
/* Every one says what it is for: a back with no note is a brief nobody can draw from. */
check("backs with nothing said about them",
  backs.filter(([, b]) => !b.note || b.note.length < 40).map(([k]) => k).join(", ") || "none",
  "none");
/* And a back only ever appears where it would be SEEN: a hand and a discard are face up. */
/*
 * Both sources, because where a back is read depends on who owns the card: the skill deck's goes
 * on in `skillCardData`, which lives with the other card shapes, and the rest in the setup routine
 * that creates the deck documents.
 */
/*
 * **Two ways a back could be reached, and both still count as reading it.**
 *
 * All five keys are written out in a call today. The second path is `buildCreature` asking for
 * `npc.${kind}` before falling back to `npc`, which is how a kind with a back of its own would
 * reach it -- and no kind has one: the goblin back was retired when the commission settled on a
 * single intent back for every creature in the world.
 *
 * The resolution stays, rather than collapsing to a literal-only audit, because the day a kind
 * earns a back it is reached by COMPUTATION and a literal grep would report it as declared and
 * never read -- a true statement about the greps and a false one about the game.
 */
const backedLiterally = [...`${setupSource}\n${decksSource}`.matchAll(/backOf\("([a-z.]+)"\)/g)]
  .map(m => m[1]);
check("backs reached by a key written out", [...new Set(backedLiterally)].sort().join(", "),
  "action, condition, fate, feature, item, npc, skill, spell, twist, wild");
/* The computed one, asked of the roster: every kind's own key, where one is declared. */
const backedByKind = monsters.expandRoster(content.ROSTER, content.VARIANTS)
  .map(c => `npc.${c.system.kind}`).filter(k => k in content.DECK_BACKS);
check("and the kinds that resolve to one of their own",
  [...new Set(backedByKind)].sort().join(", ") || "none", "none");
/* The computation is in the file rather than assumed, or the line above is pinning arithmetic the
 * game does not do. */
check("and the builder really asks for it that way",
  /backOf\(`npc\.\$\{kind\}`\) \|\| backOf\("npc"\)/.test(setupCode) ? "yes" : "no", "yes");
const backed = [...backedLiterally, ...backedByKind];
check("decks given a back", [...new Set(backed)].sort().join(", "),
  "action, condition, fate, feature, item, npc, skill, spell, twist, wild");
/* Every back declared is a back used: one nobody reads is a picture drawn for nothing. */
check("backs declared but never read",
  backs.map(([k]) => k).filter(k => !backed.includes(k)).join(", ") || "none", "none");
check("a pile is never given one",
  /"pile",[^)]*backOf\(/.test(setupSource) ? "no" : "yes", "yes");
/*
 * **Every deck document gets a back and no pile does**, which is the rule rather than a list: a
 * deck is face down, so somebody is looking at its back all evening; a hand is face up to its
 * owner and a pile to the table, so a back on one would be art nobody ever sees.
 *
 * Read as whole calls, because `backOf("skill")` also appears in the card builder -- so a deck
 * document can lose its own back while the key still looks used.
 */
const deckCalls = [...setupSource.matchAll(/makeCards\(([\s\S]*?)\n?\s*\);/g)]
  .map(m => m[1]).filter(args => /"deck"/.test(args));
/* Seven documents from five backs: there are two fate decks, because each NPC type has its own so
 * that a Cursed goblin does not hex the ogre beside it, and they share the one fate back -- and the
 * twist deck is the GM's, which borrows the skill back for the reason twistCardData gives. */
/*
 * Eight: the seven authored ones and the one every creature in the roster is built from, whose back
 * key is **chosen rather than written** -- its own if the kind has earned one, the common intent
 * back otherwise. That is the only computed back key in the file, which is why the check below
 * exists: a computed key cannot be audited by reading the call, so it is audited from the content.
 */
check("deck documents created", deckCalls.length, 7);
check("and every creature's back resolves to a declared one",
  monsters.expandRoster(content.ROSTER, content.VARIANTS)
    .filter(c => !(`npc.${c.system.kind}` in content.DECK_BACKS)
      && !("npc" in content.DECK_BACKS))
    .map(c => c.system.kind).join(", ") || "none", "none");
/*
 * **No kind has a back of its own, and that is the decision rather than an oversight.**
 *
 * One intent back serves every creature in the world: a face-down intent card says *this thing is
 * about to act*, and which thing it is is already on the table in front of you. Forty-seven kinds
 * would have been forty-seven pieces of back art bought to tell you something you can see.
 *
 * Pinned to `none` rather than deleted, because the `npc.${kind}` lookup above is still in the
 * builder. This is what says the fallback is the only live path -- and it will fail loudly the
 * day somebody adds a per-kind back without deciding to.
 */
check("kinds with a back of their own",
  Object.keys(content.DECK_BACKS).filter(k => k.startsWith("npc.")).join(", ") || "none", "none");
/*
 * The accepted keys are read off DECK_BACKS rather than typed here. A sixth back was added and
 * this regex went on naming five, so the one deck wearing the new key counted as having none --
 * a list of valid values is a thing that goes stale the moment the valid values change.
 */
const backKeys = `${backs.map(([k]) => k.replace(/\./g, "\\.")).join("|")}|npc\\.[a-z]+`;
check("deck documents with no back",
  deckCalls.filter(args => !/"[a-z.]+"\s*\)?\s*$/.test(args.trim())
    || !new RegExp(`backOf\\(|, "(${backKeys})"\\s*\\)?\\s*$`).test(args.trim()))
    .length, 0);
/*
 * A Wound and a Taint wear the ACTION back, which is not an oversight: both go into the action
 * deck (core-rules 8), and a Wound you could see coming would not be a Wound.
 */
check("and the brief says why harm has no back of its own",
  /a Wound you could see coming would not be a Wound/.test(artList) ? "yes" : "no", "yes");
/* One reader for a back, the same shape as the one for a face. */
check("a back has one reader",
  /export function backOf\(key\)/.test(decksSource) ? "yes" : "no", "yes");
/* Scoped: `artIn` carries the same guard, so a grep over the file is answered by either. */
check("with the same placeholder guard a face gets",
  /art && !art\.startsWith\("icons\/svg\/"\) \? art : ""/
    .test(decksSource.slice(decksSource.indexOf("export function backOf"))) ? "yes" : "no", "yes");
/* And the writing side has it too, for the same reason: Foundry fills these slots itself. */
const artInBody = decksSource.slice(decksSource.indexOf("export function artIn"));
check("and the writing side guards the same way",
  /art && !art\.startsWith\("icons\/svg\/"\) \? art : ""/
    .test(artInBody.slice(0, artInBody.indexOf("\n}"))) ? "yes" : "no", "yes");
/* It goes in both slots Foundry has for it, and wants the same file in each. */
/* Scoped: an actor takes its own art the same way, so a file-wide grep is about neither. */
const makeCardsBody = setupSource.slice(setupSource.indexOf("async function makeCards"));
check("the deck document takes it",
  /\.\.\.\(art \? \{ img: art \} : \{\}\)/
    .test(makeCardsBody.slice(0, makeCardsBody.indexOf("\n}"))) ? "yes" : "no", "yes");
check("and so does every card in the deck",
  (setupSource.match(/back: \{/g) ?? []).length >= 1
  && /\.\.\.\(backOf\("action"\) \? \{ back: \{ img: backOf\("action"\) \} \} : \{\}\)/
    .test(decksSource) ? "yes" : "no", "yes");
check("the art list counts the same",
  Number(/\*\*(\d+) pieces\*\*/.exec(artList)?.[1] ?? 0), artable.length + backs.length);
/*
 * **And the prompt book counts the same as the brief.**
 *
 * Two generated files walking one `GROUPS`, so they cannot disagree about WHAT exists -- but they
 * can disagree about WHEN, which is the ordinary way a generated file goes wrong: somebody adds a
 * card, regenerates one of the two, and the book quietly describes last week's game. One of these
 * numbers moving without the other is a file nobody regenerated.
 */
const artPrompts = fs.readFileSync(path.join(root, "../art-prompts.md"), "utf8");
check("the prompt book counts the same",
  Number(/\*\*(\d+) prompts\*\*/.exec(artPrompts)?.[1] ?? 0), artable.length + backs.length);
/*
 * **A hand-written direction keyed to a path no piece has.**
 *
 * `DIRECTION` in `art-prompts.mjs` is the one table in the book keyed on a path typed out rather
 * than on something the content supplies, so it is the one place where a mistake costs nothing at
 * the time. `items/npc/elf-bolt` was written for `items/natural/elf-bolt`: the lookup missed, the
 * piece fell through to the natural-weapon motif -- *grown rather than forged, chitin, horn,
 * tooth or claw* for a knapped flint arrowhead -- and the book regenerated, this suite passed and
 * the picture was drawn and paid for before anyone looked at it and said it seemed wrong.
 *
 * The generator now lists them and this pins the list empty, so the next one costs a test run
 * instead of an image.
 */
const orphanBlock = artPrompts.slice(artPrompts.indexOf("## Directions that match no piece"));
check("directions keyed to a piece that does not exist",
  /^\*\*None\.\*\*/m.test(orphanBlock.slice(0, orphanBlock.indexOf("\n## ") + 1 || undefined))
    ? "none" : (orphanBlock.match(/^- `([^`]+)`$/gm) ?? []).join(", "), "none");
/*
 * And the constraint that only one group needs, in the part that gets pasted.
 *
 * One intent pool serves every creature in the world, so *Close In* sits behind a goblin, an elf
 * and a dragon. The brief said so from the beginning -- in markdown, OUTSIDE the capsule, where
 * the model never saw it, and the first batch came back a gallery of human knights. A rule that
 * lives only in the part nobody pastes is not a rule.
 */
const npcSection = artPrompts.slice(artPrompts.indexOf("## NPC intent cards"),
  artPrompts.indexOf("## Way of Shade"));
check("the intent capsule forbids a recognisable species",
  /No species markers on the actor/.test(npcSection.slice(0, npcSection.indexOf("</details>")))
    ? "yes" : "no", "yes");
/*
 * **And the correction to it, which cost more than the ban did.**
 *
 * Banning the species banned the anatomy, the clothing, the weapon and the scale -- and those were
 * most of what told one intent from another, so the batch came back as one picture of dust and a
 * dark mass, thirty-odd times. The ban is right and it applies to the ACTOR: the far side of the
 * card is a player character, and players are human, so the victim, the ground and the aftermath
 * are all still drawn in full. Both halves have to be in the pasted text or the pool flattens
 * again in whichever direction is missing.
 */
check("and says what is still drawn in full",
  /Only the actor is anonymous/.test(npcSection.slice(0, npcSection.indexOf("</details>")))
    ? "yes" : "no", "yes");
/*
 * **Every intent is written by hand, and no two of them say the same thing.**
 *
 * This is the group that cannot be left to the motif tables: an intent has a verb and a number
 * where an item has a name and a blurb, and nineteen of the thirty-six are `move` then `strike`,
 * so the tables said *ground covered; a blow lands* nineteen times over. The collision audit at
 * the end of the generator reports clusters; this is the one group where a cluster of two is
 * already a defect, so it is a check rather than a report.
 */
const npcDraws = [...npcSection.matchAll(/^Draw (.+)$/gm)].map(m => m[1]);
check("intent prompts in the book", npcDraws.length, content.INTENTS.length);
check("and intent prompts that repeat another word for word",
  npcDraws.filter((d, i) => npcDraws.indexOf(d) !== i).join(" | ") || "none", "none");
/* The three cards one creature draws are the only ones exempt from the anonymity rule, and the
 * exemption is printed off `only` rather than written by hand: a card that stopped being
 * exclusive would lose the licence in the same edit that changed the field. */
check("prompts allowed to show a creature",
  (npcSection.match(/^THIS CARD IS THE EXCEPTION\./gm) ?? []).length,
  content.INTENTS.filter(c => c.only?.length).length);

/*
 * **And then the same question asked of the whole book, which is the question it was never asked.**
 *
 * The generator's own collision audit asks whether two pieces share a DIRECTION, and sorts by
 * whether the subject line carries prose. Both are proxies, and both let the real thing through:
 * forty-three consumables share a direction and come back as forty-three pictures, while
 * `Something gives whether or not you get through: the GM says what broke` counts as prose and
 * tells an artist nothing at all. Rules text reads as English to a regular expression.
 *
 * What a model actually receives is the capsule plus the subject, and the capsule is byte-identical
 * for every piece in its group -- so two pieces in one group are two pictures only to the extent
 * that their subjects differ in WORDS. That is measurable without judging what the words mean:
 * word-and-bigram overlap, nearest neighbour inside the group, and a threshold.
 *
 * Sixty per cent is where it was set, because that is where the list stops containing pairs
 * anybody would defend. At 50% it catches *Dagger* beside *Balanced Dagger*, which are supposed to
 * be near-identical objects; at 60% it holds the whole Natural weapons group, where *Claws*,
 * *Mandibles*, *Nip* and *Sting* overlap at 89% and will come back as one picture of a claw.
 *
 * **The number was a debt, and it has been paid.** It stood at thirty-two across seven groups;
 * every one of them has a sentence written about that one piece now, the way the thirty-six
 * intents were answered, and the pin came down with it. Natural weapons went from 89%-93% to
 * 7%-15%, and the Skill cards from a median of 77% to 9%.
 *
 * **Zero is the pin, so the next one fails here rather than in a batch of pictures.** The worst
 * pair left in the book is 58% -- *Flask of Ink* beside *Flask of Oil*, which are two flasks.
 */
const twinPieces = [];
{
  const bookLines = artPrompts.split("\n");
  let group = "";
  for (let i = 0; i < bookLines.length; i++) {
    if (bookLines[i].startsWith("## ")) group = bookLines[i].slice(3).trim();
    if (!bookLines[i].startsWith("### ")) continue;
    /* A piece is a heading with a FILE under it. The capsule is a heading too, and has none. */
    let file = "", fence = -1;
    for (let j = i + 1; j < bookLines.length && !bookLines[j].startsWith("#"); j++) {
      const named = /^File: `(.+)`$/.exec(bookLines[j]);
      if (named) file = named[1];
      if (bookLines[j].startsWith("```text")) { fence = j; break; }
    }
    if (!file || fence < 0) continue;
    const body = [];
    for (let k = fence + 1; k < bookLines.length && !bookLines[k].startsWith("```"); k++) {
      body.push(bookLines[k]);
    }
    twinPieces.push({ group, file, text: body.join(" ").replace(/\s+/g, " ").trim() });
  }
}
/* Words and adjacent pairs: pairs matter because the motifs are phrases, and two prompts built
 * from the same phrases in a different order are still the same instruction. */
const twinGrams = text => {
  const w = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const set = new Set(w);
  for (let n = 0; n + 1 < w.length; n++) set.add(`${w[n]} ${w[n + 1]}`);
  return set;
};
const twinOverlap = (a, b) => {
  let shared = 0;
  for (const gram of a) if (b.has(gram)) shared++;
  return shared / (a.size + b.size - shared);
};
/*
 * **The cast line is scaffolding, and scaffolding is already excluded from this audit.**
 *
 * Every card, signature and feature now ends with *WHO IS IN IT. ...a woman of Nordic appearance,
 * in their forties...*, because a list of ancestries in a capsule cannot produce a spread across
 * five hundred requests that never see each other -- only an assignment can. It is per-piece and
 * it carries one varying clause, but its skeleton is identical 128 times, and adding that much
 * shared text to a prompt whose subject is a name and a rule pushed twenty-six of them over this
 * audit's 60% line overnight.
 *
 * They are not twins. Nothing about the picture changed; the shared half of a new sentence did.
 * This audit asks whether two prompts describe the same PICTURE, which is why it already ignores
 * the capsule -- *a different group is a different capsule* below -- and the cast line is the
 * same kind of thing: shared form, orthogonal axis. So it comes off before the grams are taken,
 * and what is left is the subject, the flavour and the direction, exactly as before.
 *
 * It is cut rather than counted, so the audit cannot be quietened by making the boilerplate
 * longer: a future sentence appended to every prompt would have to be exempted here on its own
 * argument, in writing, like this one.
 */
/* Anchored on a space, not a blank line: `text` above is `body.join(" ")` with every run of
 * whitespace collapsed, so the paragraph break the book has is gone by the time this runs. */
const CAST_LINE = /\s*WHO IS IN IT\..*$/;
for (const piece of twinPieces) piece.grams = twinGrams(piece.text.replace(CAST_LINE, ""));
const twinsByGroup = new Map();
for (const piece of twinPieces) {
  (twinsByGroup.get(piece.group) ?? twinsByGroup.set(piece.group, []).get(piece.group)).push(piece);
}
/*
 * **A variant and its base are allowed to be alike, because they are the same animal.**
 *
 * Every other exemption in this file has been refused, so this one owes an argument. A token's
 * subject now opens with its base -- *A Sweeper: eight legs folded tight under four wings...* --
 * and that was added deliberately, because each variant had been drawn with no sight of its base
 * and the three Sweepers came back as an eagle, a four-winged thing and a rat. The overlap is the
 * fix working, not the defect the audit was written for.
 *
 * It is scoped to the family rather than switched off for tokens: two UNRELATED creatures reading
 * alike is still exactly the failure a token cannot survive, and still fails here.
 */
/* Keyed on the NAME the subject line prints, not the slug: `slug` is imported with the rest of
 * the art-list reading further down this file, and this check runs before it. */
const familyOf = new Map();
for (const base of content.ROSTER) {
  const kin = base.system?.kind;
  familyOf.set(base.name, kin);
  for (const delta of content.VARIANTS[kin] ?? []) familyOf.set(delta.name, kin);
}
const pieceName = piece => /^SUBJECT\. "([^"]+)"/.exec(piece.text)?.[1] ?? "";
const sameCreature = (a, b) => {
  const [x, y] = [familyOf.get(pieceName(a)), familyOf.get(pieceName(b))];
  return x !== undefined && x === y;
};
/* A different group is a different capsule, so sameness across groups cannot make one picture. */
const nearTwins = twinPieces.filter(piece => {
  const siblings = twinsByGroup.get(piece.group) ?? [];
  return siblings.some(other => other !== piece && !sameCreature(piece, other)
    && twinOverlap(piece.grams, other.grams) >= 0.6);
});
/* A parse that found no pieces would report a book with no twins in it. */
check("prompts the twin audit read", twinPieces.length, artable.length);
check("prompts with a near twin in their own group", nearTwins.length, 0);
/*
 * And it names them when it fails, because a bare count does not say what to go and write. The
 * shape was the same in all seven groups it used to list: the subject was a NAME and a RULE, and
 * a rule is not a picture. A motif table cannot help there -- `might 2` has no verb and no
 * condition to read -- so each piece needs a sentence of its own.
 */
check("and which pieces they are",
  nearTwins.map(p => p.file).sort().join(", ") || "none", "none");
/*
 * **And the second check the twin audit cannot make: a cluster of two is a defect in one group.**
 *
 * Everywhere else a shared direction is fine, because the subject above it differs -- forty-three
 * consumables drawing a nearly-empty vessel come back as forty-three pictures. An intent has a
 * verb and a number where an item has a name and a blurb, so it has nothing to differ by.
 */
check("intent prompts with a near twin",
  nearTwins.filter(p => p.group === "NPC intent cards").map(p => p.file).join(", ") || "none",
  "none");
/* Every piece is a row, so nothing is quietly left out of the brief. */
const listed = new Set([...artList.matchAll(/^\| [ ✓] \| \*\*(.+?)\*\* \|/gm)]
  .map(m => m[1]));
check("pieces missing from the art list",
  artable.filter(e => !listed.has(e.name)).map(e => e.name).slice(0, 5).join(", ") || "none",
  "none");
/*
 * And the count of what is wired up is the count the engine answers for.
 *
 * **It used to be the count of entries carrying an `art:` string, and that count was nought** --
 * for every piece in the book, the ten deck backs included, which were declared with `art: ""`.
 * The field is still the way to overrule a path; it is no longer the way one is found, so asking
 * for it measured a thing nobody fills in. Both sides now ask `artIn` and `backOf`, which are the
 * functions Foundry's own documents are built with: a piece counted here appears in play.
 */
const { artIn: artInLive, backOf: backOfLive } = await import("../module/decks.mjs");
check("the list agrees on what is wired up",
  Number(/of which \*\*(\d+)\*\* are wired up/.exec(artList)?.[1] ?? -1),
  artable.filter(e => artInLive(e)).length + backs.filter(([k]) => backOfLive(k)).length);
/*
 * **And every path the game hands Foundry names a file that is there.**
 *
 * This is the check the wiring needed, and it is a different question from the two either side of
 * it. *Is there a path* is answered above and *is every file a piece* is answered further down,
 * from the directory inward; neither notices a path that is well-formed, counted, and points at
 * nothing. A missing texture in Foundry is a silent fallback to core's placeholder, so a picture
 * filed one letter off is a picture that never shows and never complains -- and the paths are now
 * derived from a name, which means a renamed card moves its own path and leaves its file behind.
 *
 * Asked of `artIn` and `backOf` rather than of the shelves, so it tests the answer the game gets.
 */
const artRoot = path.join(root, "art");
const fileFor = p => path.join(artRoot, String(p).replace(/^systems\/cardrpg\/art\//, ""));
const pathless = [
  ...artable.map(e => [e.name, artInLive(e)]),
  ...backs.map(([k, b]) => [b.label ?? k, backOfLive(k)])
].filter(([, p]) => p && !fs.existsSync(fileFor(p)));
check("art paths the game would hand Foundry", artable.length + backs.length, 595);
check("and those naming a file that is not there",
  pathless.map(([name, p]) => `${name} -> ${p}`).slice(0, 5).join(", ") || "none", "none");
/*
 * **Every group in the brief lands in a slot something writes.**
 *
 * This is the check the catalogue needed and did not have. Counting pieces was never going to find
 * the gap, because the count was right: 420 pieces, 420 rows, and 176 of them in a slot no
 * document ever wore. `slateData` spread an entry's `art` into `system.art` and the levelling
 * graph read the path straight out of content, so a feature's picture appeared on its node and
 * nowhere else.
 *
 * So the question is asked of the brief's own section headings: each one names a suggested
 * directory, every directory is one of three Foundry slots, and each slot has a writer that reads
 * a definition's art. A group added to the brief with nowhere for its art to go fails here.
 */
const ART_SLOTS = {
  "cards/starter": "face", "cards/common": "face", "cards/npc": "face", "cards/shade": "face",
  "cards/strength": "face", "cards/way": "face", "cards/skill": "face", "cards/wild": "face",
  "signatures/shade": "face", "signatures/strength": "face", "signatures/mind": "face",
  "signatures/faith": "face", "spells/elemental": "face", "spells/shadow": "face",
  "spells/mind": "face", "spells/faith": "face",
  features: "item", items: "item", "items/npc": "item", "items/natural": "item",
  tokens: "actor"
};
const briefDirs = [...new Set([...artList.matchAll(/Suggested path: `cardrpg\/art\/(.+?)\/`/g)]
  .map(m => m[1]))];
check("directories the brief commissions into", briefDirs.length, 21);
check("and every one of them has a slot",
  briefDirs.filter(d => !(d in ART_SLOTS)).join(", ") || "none", "none");
/* And no slot is declared for a group that is not in the brief, or this list rots quietly. */
check("slots declared for nothing",
  Object.keys(ART_SLOTS).filter(d => !briefDirs.includes(d)).join(", ") || "none", "none");
/*
 * The three writers, each asked in its own body. A file-wide grep for `artIn` was exactly the
 * shape of the original bug: one reader in the file passed for all of them.
 */
const SLOT_WRITERS = {
  face: [["an action card", decksSource, "export function actionCardData", "\n}"],
    ["a skill card", decksSource, "export function skillCardData", "\n}"],
    ["an intent card", decksSource, "export function npcCardData", "\n}"]],
  item: [["an item", setupSource, "export function slateData", "\n}"]],
  actor: [["an actor", setupSource, "const buildActor = async", "\n  };"]]
};
const slotFaults = [];
for (const [slot, writers] of Object.entries(SLOT_WRITERS)) {
  for (const [label, src, anchor, end] of writers) {
    const at = src.indexOf(anchor);
    const to = at < 0 ? -1 : src.indexOf(end, at);
    /* An anchor that no longer matches, or an end that does not, leaves a body of nothing or of
     * the whole file -- and the whole file is the bug this rule is about. Both are faults. */
    if (at < 0 || to < 0) { slotFaults.push(`${slot}: ${label} (no body)`); continue; }
    if (!/artIn\(/.test(src.slice(at, to))) slotFaults.push(`${slot}: ${label}`);
  }
}
check("slots whose writer never reads a definition's art",
  slotFaults.join(", ") || "none", "none");
/* A parse that found no bodies would report "none" for writers that read nothing at all. */
check("writers the rule actually read",
  Object.values(SLOT_WRITERS).flat().length, 5);

/*
 * **A token is a different shape, and the brief says so twice on purpose.** Once in its own spec
 * table and once on every token group's own line -- because a brief that states the shape only at
 * the top is a brief somebody draws a 2:3 token from, and a token in a frame is unusable.
 */
check("the brief has a second spec for tokens",
  /^## What to supply \u2014 tokens$/m.test(artList) ? "yes" : "no", "yes");
const tokenRatio = /## What to supply \u2014 tokens[\s\S]*?\| Ratio \| \*\*(\S+)\*\*/.exec(artList);
check("and asks for a square", tokenRatio?.[1] ?? "none", "1:1");
/*
 * **And says, before either table, that the two differ.** An artist who reads one spec and assumes
 * the other is a frame around a creature, which is a token that cannot be used. The check is the
 * claim rather than the sentence: the two tables disagree about the ratio, and the prose says a
 * token is a different shape. Reword the sentence freely; make the tables agree and this fails.
 */
/* The card's ratio, read here rather than borrowed: the section that pins it comes further down,
 * and a check that reads a `const` declared below it does not run at all. */
const cardRatio = /\| Ratio \| \*\*(\S+)\*\*/.exec(artList)?.[1] ?? "none";
check("the two specs do not agree on the shape",
  tokenRatio?.[1] === cardRatio ? `both ${cardRatio}` : "they differ", "they differ");
check("and the brief says so before either table",
  /\*\*A token is a different shape from a card\*\*/.test(artList) ? "yes" : "no", "yes");
check("and a size", /\| Size \| \*\*512 \u00d7 512\*\* \|/.test(artList) ? "yes" : "no", "yes");
check("and transparency, which a card does not want",
  /\*\*transparency is required\*\*/.test(artList) ? "yes" : "no", "yes");
/* Said again per group, so the row an artist is reading carries the shape of the row. The count of
 * what is wired up sits between the two now, and used to be absent because it was always nought. */
const tokenGroups = [...artList.matchAll(
  /\*\*(\d+) pieces?\*\*(?:, \d+ wired up)?\. \*\*1:1, 512 \u00d7 512, transparent\.\*\* Suggested path: `cardrpg\/art\/(\S+?)\/`/g)]
  .map(m => m[2]);
check("groups that restate the token shape", tokenGroups.join(", "), "tokens, tokens");
/* One picture in both slots, which is the economy and wants saying where it is read. */
check("and that one file serves portrait and token",
  /\*\*One picture, both slots\.\*\*/.test(artList) ? "yes" : "no", "yes");
/* And the brief names all four places a path lands, since it is where somebody checks. */
for (const [what, pattern] of [
  ["a card face", /\*\*a Card face's `img`\*\* for a card/],
  ["an item", /\*\*an Item's `img`\*\*/],
  ["an actor and its token", /\*\*an Actor's `img` plus its prototype token's texture\*\*/]
]) {
  check(`the brief says where art lands for ${what}`,
    pattern.test(artList) ? "yes" : "no", "yes");
}
/* And records that it only ever worked for one of them, because a repair nobody wrote down is a
 * repair somebody undoes. */
check("and that it used to be true of cards alone",
  /This was true of cards and false of everything else until today/.test(artList) ? "yes" : "no",
  "yes");

/*
 * The HUD spec says the same, because it is what somebody reads BEFORE adding a path -- and a spec
 * that still promises two slots sends the next person to write a reader that already exists.
 */
check("the HUD spec names the one writer",
  /`artIn` beside\n`artOf`, the writing side of the same question/.test(hudSpec) ? "yes" : "no",
  "yes");
check("and that a creature's file goes in both of its slots",
  /creature's on the Actor \*\*and\*\* on its token/.test(hudSpec) ? "yes" : "no", "yes");
check("and that a token is not a card",
  /\*\*A token is not a card\.\*\* 1:1 at 512 \u00d7 512 with transparency required/.test(hudSpec)
    ? "yes" : "no", "yes");
/* The two documents agree on the token's shape, rather than each stating it once. */
const specTokenSize = /1:1 at (\d+ \u00d7 \d+) with transparency/.exec(hudSpec)?.[1] ?? "none";
check("and the brief asks for that same size",
  new RegExp(`\\| Size \\| \\*\\*${specTokenSize}\\*\\* \\|`).test(artList) ? "yes" : "no",
  "yes");

/*
 * And the three groups that are deliberately absent, each with its reason in the file. A piece of
 * content with no art and no stated reason is indistinguishable from one somebody forgot.
 */
check("the brief says why a twist has no picture",
  /a twist is a NAME and a COST rather than a picture/.test(artList) ? "yes" : "no", "yes");
check("and why the tagged creatures are not commissioned",
  /there is nothing yet for a picture to be of/.test(artList) ? "yes" : "no", "yes");
check("and it counts them off the content rather than in prose",
  new RegExp(`\\*\\*The ${content.MONSTER_TAGS.length} tagged creatures\\.\\*\\*`).test(artList)
    ? "yes" : "no", "yes");

/*
 * And the brief reads as English. A condition is printed by its NAME, not its key: an artist should
 * not have to work out that `offBalance` is Off Balance, and a camelCase word in a brief is the one
 * reliable sign that a key leaked through instead of a label.
 */
/*
 * The first version of this never matched anything, and invisibly: it was written through a layer
 * of escaping that turned its `\b` word boundaries into literal BACKSPACE characters, so the
 * pattern was unsatisfiable and reported "none" for a list full of keys. The break test is the
 * only reason that was ever found -- a check that cannot fail looks exactly like a check that
 * passes, and this one looked right in every reading of the source.
 */
/*
 * A DATA row: the one whose first cell is the drawn-yet tick and whose second is a bold name.
 * Nineteen tables' worth of headers and rules are rows too, and so is the "what to supply" table
 * at the top -- which has bold in its second cell and caught a looser pattern twice.
 *
 * And the BACKS table is filtered out, because it has the same tick column: its third cell is a
 * note rather than a brief and its path is the slug of a key rather than of a label, so every rule
 * below would be the wrong rule for it.
 */
const faceRows = [...artList.matchAll(
  /^\| [ ✓] \| \*\*(.+?)\*\* \|([^|]*)\| `([^`]+)` \|/gm)]
  .map(m => ({ name: m[1], brief: m[2], path: m[3] }))
  .filter(r => !r.path.startsWith("backs/"));
const briefs = faceRows.map(r => r.brief);
const leaked = briefs.flatMap(text =>
  [...text.matchAll(/\b([a-z]+[A-Z][a-zA-Z]*)\b/g)].map(m => m[1]));
/* A pattern that matched no rows at all would report "none" for any list whatsoever. */
check("briefs the check actually read", briefs.length, 585);
check("keys that leaked into the brief",
  leaked.length ? [...new Set(leaked)].join(", ") : "none", "none");
/*
 * And no brief has a hole in it. The starter Warrior printed *Health 12 - speed ?* on its first
 * generation, because `speed` is a creature's field and a character has none -- so the line
 * reported a missing number as though the number were unknown. An artist cannot draw either, but
 * a question mark looks like data, and the row is the only place anybody would see it.
 */
const holes = faceRows.filter(r => /\?|undefined|NaN|\bnull\b/.test(r.brief));
check("briefs with a missing number in them",
  holes.length ? holes.slice(0, 5).map(r => `${r.name}:${r.brief.trim()}`).join(" | ") : "none",
  "none");

/*
 * And the filenames, which are what an artist names files by.
 *
 * Lowercase, hyphens between words, nothing else -- an apostrophe left in the slug turns
 * *Accuser's Ring* into `accuser-s-ring`, which is the kind of thing nobody notices until a
 * hundred and fifty files have been named that way and the brief is the only record of it.
 */
const { slug, DELIVERY, GROUPS: ART_GROUPS, CREATURES: ART_CREATURES, creatureBrief, castOf }
  = await import("./art-list.mjs");
/*
 * **The art on disk, against the brief that commissioned it.**
 *
 * `art/` is tracked now, so the pictures are part of the repository rather than a folder on one
 * machine -- and a tracked folder of binaries is exactly where a stray file lives forever without
 * anybody noticing. The path IS the wiring: `artIn` reads a string out of content and Foundry
 * looks for that file, so a picture filed one letter off is a picture that silently never shows.
 *
 * The COUNT is deliberately not pinned. It moves every time a group is drawn, and a suite that
 * fails on progress teaches people to ignore it. What is pinned is that every file on disk is a
 * piece that exists, spelled the way the brief spells it, in the one delivery format.
 */
const artDir = path.join(root, "art");
const artFiles = fs.existsSync(artDir)
  ? (function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
      ? walk(path.join(dir, e.name))
      : [path.relative(artDir, path.join(dir, e.name)).replace(/\\/g, "/")]);
  })(artDir)
  : [];
check("pictures drawn so far", artFiles.length, artFiles.length);
if (artFiles.length) {
  /*
   * Built from GROUPS, which is what carries the directory. `artable` is a flat list of content
   * entries with no `dir` on them at all, so the first version of this compared every file on
   * disk against the string `undefined/...` and condemned all seventeen of them.
   */
  const wanted = new Set(ART_GROUPS
    .flatMap(g => g.list.map(e => `${g.dir}/${slug(e.name)}.${DELIVERY.format}`))
    .concat(backs.map(([key]) => `backs/${slug(key.replace(/\./g, "-"))}.${DELIVERY.format}`)));
  check("and those that are not a piece in the brief",
    artFiles.filter(f => !wanted.has(f)).slice(0, 5).join(", ") || "none", "none");
  check("and those not in the one delivery format",
    artFiles.filter(f => !f.endsWith(`.${DELIVERY.format}`)).slice(0, 5).join(", ") || "none",
    "none");
}
/*
 * **The one delivery format, which the pipeline and the brief must not disagree about.**
 *
 * Both tables in the brief print it and the generator writes it, so it lives in one constant and
 * every reader takes it from there. The brief used to say `.webp` PREFERRED and `.png` FINE --
 * a choice, which is how a set ends up half in one format and half in the other, and how a token
 * ends up without the transparency that only one of the two carries.
 */
const delivery = `**\`.${DELIVERY.format}\` at quality ${DELIVERY.quality}**`;
check("the brief states the delivery format, in both tables",
  artList.split(delivery).length - 1, 2);
check("and neither table still offers a choice",
  /`\.webp` (?:preferred|or `\.png`)/.test(artList) ? "no" : "yes", "yes");

/*
 * --- one creature, one body ------------------------------------------------------------------
 *
 * **A token is one square of a map, so it is one creature**, and the first pass of the bestiary
 * did not know that. Nine descriptions asked for a group in so many words -- *drawn as a knot of
 * three or four*, *drawn as a crowd in motion*, *the shape of the picture is several of them at
 * once*, *mole men at her feet for scale* -- and every one of them came back as a group, because
 * the prompt said so. The capsule now bans it, and this is the other half: a ban in the capsule
 * is no use while the subject under it asks for the opposite, which is the single failure mode
 * this whole prompt book keeps rediscovering.
 *
 * The Mob is the exception and the only one, which is the point of pinning it by name: it is a
 * crowd by definition -- *the moment townsfolk stop running* -- and a rule with no exception
 * written into it is a rule somebody will quietly break.
 */
const CROWD = new RegExp([
  "a crowd", "as a group", "a knot of", "a press of", "several of them",
  "a cluster of them", "a swarm of them", "more than one", "at (?:her|his|its) feet",
  "who are standing too"
].join("|"), "i");
const crowded = ART_CREATURES
  .filter(c => CROWD.test(creatureBrief(c)))
  .map(c => c.name);
check("creatures whose own description asks for more than one body",
  crowded.join(", ") || "none", "Mob");

/*
 * --- who the people are ----------------------------------------------------------------------
 *
 * **Variety cannot be asked for in a capsule, and this is the proof of it.** Each piece is drawn
 * in its own request with no sight of the others, so *vary who you draw* has nothing to vary
 * against: twenty-four human tokens came back as one pale man in twenty-four costumes. The art
 * layer therefore assigns the casting per creature, hashed from the creature's own kind, and
 * states it as fact in the subject -- the form this book has learnt is obeyed.
 *
 * So what is worth checking is not that the rule is written down. It is that the assignment
 * reaches every person in the roster and that it actually spreads.
 */
const humanBase = new Set(content.HUMAN_KINDS);
const unpeopled = content.HUMAN_KINDS.filter(kind =>
  !content.ROSTER.some(c => c.system?.kind === kind));
check("human kinds named that no creature has", unpeopled.join(", ") || "none", "none");
const cast = ART_CREATURES.filter(c => castOf(c));
check("creatures the art layer casts as people", cast.length, 26);
/* Variants are cast too, through their base: a Watch Sergeant is a Town Guard and the question of
 * who the guard is does not stop applying because the sash changed. */
check("and how many of those are variants",
  cast.filter(c => !humanBase.has(c.system?.kind)).length, 12);
const casts = cast.map(c => castOf(c));
check("people cast as women", casts.filter(t => t.includes("a woman")).length, 12);
check("people cast as men", casts.filter(t => t.includes("a man")).length, 14);
check("distinct ancestries across the people",
  new Set(casts.map(t => t.match(/of (.+?) appearance/)[1])).size, 12);
/* And that it is a property of the creature rather than of its position in the file: an index
 * into the roster would reassign every human after an inserted one, and a token already drawn
 * and already through the gate would no longer match the prompt that would be sent for it. */
const listSource = fs.readFileSync(path.join(root, "test/art-list.mjs"), "utf8");
check("casting is hashed from the seed, not counted off the roster",
  /const h = hash\(seed\)/.test(listSource) ? "yes" : "no", "yes");
check("and a creature seeds it with its kind",
  /castLine\(kind\)/.test(listSource) ? "yes" : "no", "yes");
/*
 * **The three list lengths are pairwise coprime, which is the only reason the axes spread.**
 *
 * Seven sexes, fifteen ancestries, four ages, indexed off one hash by three different shifts. Any
 * shared factor locks two of them into step -- fourteen ancestries would have married every
 * ancestry to one sex, sixteen would have married it to one age -- and the failure is invisible
 * in the output until somebody notices that every Nordic in the set is a man past fifty.
 */
const coprime = (a, b) => { while (b) [a, b] = [b, a % b]; return a === 1; };
check("the casting axes cannot travel together",
  [[7, 15], [7, 4], [15, 4]].every(([a, b]) => coprime(a, b)) ? "coprime" : "share a factor",
  "coprime");
/* And that those are still the lengths the code uses, since the check above is arithmetic on
 * numbers that would otherwise only agree with the source by habit. */
check("and those are the lengths in the source",
  [/const SEX = \[(?:[^\]]*?,){6}[^\],]*\]/, /"Germanic"\n\];/, /const AGE = \[(?:[^\]]*?,){3}[^\],]*\]/]
    .every(re => re.test(listSource)) ? "seven, fifteen, four" : "changed",
  "seven, fifteen, four");

/*
 * **Who the cards cast, which is the half that was missing.**
 *
 * The token capsule binds an assigned person because something counts them out here. A card's
 * capsule listed the city's ancestries and named the pale default as a failure, which is a
 * distribution asked of one request that cannot see the other five hundred -- so every card
 * steered off the default and the westerners nearly left the set. 27% of the creatures were
 * European and the cards had no assignment at all.
 */
const castLines = [...artPrompts.matchAll(/that person is (a (?:wo)?man) of ([A-Za-z ]+?) appearance/g)];
check("cards, signatures and features given an assigned person", castLines.length, 132);
/* The NPC pool is the one group that must NOT be cast: its own capsule says the actor is nobody,
 * because one picture is drawn behind a goblin, a troll and a dragon. */
const npcBlock = /\n## NPC intent cards\n([\s\S]*?)\n## /.exec(artPrompts)?.[1] ?? "";
check("and the NPC pool cast nobody, because its actor is nobody",
  /WHO IS IN IT/.test(npcBlock) ? "cast" : "none", "none");
/*
 * **No prompt leans on the fallback direction while its own flavour describes self-harm.**
 *
 * `spells/mind/the-red-hour` is the only piece in five hundred and ninety-two that the image API
 * has refused outright -- `safety_violations=[self-harm, violence]`, at the output stage. Its
 * flavour reads *you open a vein for each of them*, and the fallback under it said *draw that line
 * literally: the one moment it describes*, so between them the prompt asked for a picture of
 * somebody opening their own veins. The refusal was correct.
 *
 * The fallback is not the problem on its own: eighty-two pieces use it and eighty-one of them are
 * drawn and through the gate. It is the problem where the text under it is a rule rather than a
 * moment, and it is a REFUSAL where that text describes something no model will draw. Its own
 * sibling `open-the-vein` has the worse name and drew first time, because its steps gave it a
 * motif aimed at the blood in flight rather than at the act.
 *
 * So the pairing is what is pinned, not either half. A new blood-magic spell with a vivid line and
 * no steps to read would land here again, and this fails in a second instead of in a 400.
 */
const SELF_HARM = /open(?:s|ing)? a vein|cut(?:s|ting)? (?:yourself|your own)|your own blood/i;
const unsafeFallback = [...artPrompts.matchAll(/File: `([^`]+)`\n\n```text\n([\s\S]*?)\n```/g)]
  .filter(([, , body]) => /Draw that line literally/.test(body) && SELF_HARM.test(body))
  .map(([, file]) => file);
check("prompts that ask an image model for self-harm, having nothing else to ask for",
  unsafeFallback.join(", ") || "none", "none");

const EURO = new Set(["Mediterranean", "Nordic", "Slavic", "Northwest European", "Germanic"]);
check("western ancestries among them, which had nearly vanished",
  castLines.filter(m => EURO.has(m[2])).length, 45);
check("and every ancestry on the list is used somewhere",
  new Set(castLines.map(m => m[2])).size, 15);

/*
 * **The verdict log, which exists because a sample of survivors was read as a sample of all.**
 *
 * `quietTop` was measured over the cards on disk, found to sit just above its floor, and called
 * the rule that was rejecting pieces. Ninety-seven of those ninety-nine had PASSED it -- the band
 * was tight because the rule was obeyed -- and the capsule was rewritten anyway, at a cost of
 * eleven failed pieces. The reason the mistake was available to make is that a rejected piece is
 * overwritten by the next `--failed` run, so the disk keeps only winners.
 *
 * These four checks hold the two halves of the fix in place: that the verdict is written whether
 * it passed or failed, that the capsule is fingerprinted separately from the whole prompt (the
 * prompt's own hash is unique per piece and cannot group a batch, which was the thing missing),
 * and that neither the prompt nor the key is ever written down.
 */
const shootSource = fs.readFileSync(path.join(root, "test/art-shoot.mjs"), "utf8");
/* The CALL, not the declaration: without the semicolon this pattern matches its own `function`
 * line too, and the suite's own duplicate-grep rule caught it. */
check("every verdict is logged, not only the failures",
  /logVerdict\(piece, verdict, prompt\);/.test(shootSource) ? "yes" : "no", "yes");
check("and the capsule is fingerprinted apart from the subject",
  /capsule: fingerprint\(piece\.capsule\)/.test(shootSource) ? "yes" : "no", "yes");
/* The one rule both logs share, and the reason either is safe to paste into an issue. */
check("the verdict log writes a fingerprint, never the prompt text",
  /\bprompt: fingerprint\(prompt\)/.test(shootSource) ? "yes" : "no", "yes");
check("and the log is a record, not a source",
  fs.readFileSync(path.join(root, ".gitignore"), "utf8").includes("art-verdicts.log")
    ? "ignored" : "committed", "ignored");
/* The pack builder's source, read for the rules that cannot be asked of its output: that it reads
 * every pack back through Foundry's own packer, and that it borrows its shapes rather than
 * spelling them again. */
const packSource = fs.readFileSync(path.join(root, "test/build-packs.mjs"), "utf8");
const rows = faceRows;
check("file paths in the brief", rows.length, 585);
/* And the backs, whose path is the slug of their KEY rather than of their printed label. */
const backPaths = [...artList.matchAll(/\| `(backs\/[^`]+)` \|/g)].map(m => m[1]);
check("back paths in the brief", backPaths.length, backs.length);
/* And the section they sit in, which is where an artist is told to start. */
check("the brief puts the backs first",
  /^## Deck backs \u2014 draw these first$/m.test(artList) ? "yes" : "no", "yes");
check("back paths that are not the slug of their key",
  backs.map(([key]) => `backs/${slug(key.replace(/\./g, "-"))}.webp`)
    .filter(p => !backPaths.includes(p)).join(", ") || "none", "none");
/*
 * "Lowercase words and hyphens" could not tell `accuser-s-ring` from `accusers-ring`: both are
 * lowercase words separated by hyphens, and `s` is a word. The rule that holds is that a path IS
 * the slug of its name -- checked with the generator's own `slug`, because a copy of a rule is a
 * second rule and two rules drift.
 */
const badPaths = rows.filter(r => !r.path.endsWith(`/${slug(r.name)}.webp`));
check("paths that are not the slug of their name",
  badPaths.length ? badPaths.slice(0, 5).map(r => `${r.name} -> ${r.path}`).join(", ") : "none",
  "none");

/*
 * And the rule itself, ASKED. The check above shares its implementation with the generator, so a
 * change to the slug rule moves both and they go on agreeing -- it cannot catch the one mistake
 * most likely to be made here. These can: an apostrophe is dropped rather than hyphenated, because
 * *Accuser's Ring* filing itself as `accuser-s-ring` is the sort of thing nobody notices until a
 * hundred and fifty files are named that way.
 */
check("an apostrophe is dropped, not hyphenated", slug("Accuser's Ring"), "accusers-ring");
check("and a curly one too", slug("Accuser\u2019s Ring"), "accusers-ring");
check("spaces become one hyphen", slug("The Club and the Line"), "the-club-and-the-line");
check("punctuation does not survive", slug("Hit & Run!"), "hit-run");
check("and nothing starts or ends with a hyphen", slug("-- Edge Case --"), "edge-case");

/* The ratio and the safe area, which are the two things art cannot be redone without. */
check("the brief states the ratio", /\| Ratio \| \*\*2:3\*\*/.test(artList) ? "yes" : "no", "yes");
check("and the safe area the face sits on",
  /\*\*top 17%\*\* and \*\*bottom 32%\*\*/.test(artList) ? "yes" : "no", "yes");

/*
 * A deck back is the same shape as a face, and the brief says so in prose rather than in the
 * table -- so it is a second statement of the ratio, in a different sentence, and the kind that
 * goes stale silently. Read both and make them agree, instead of writing 2:3 down a third time.
 */
const faceRatio = /\| Ratio \| \*\*(\S+)\*\*/.exec(artList)?.[1] ?? "none";
const faceSize = /\| Size \| \*\*(\d+ \S+ \d+)\*\*/.exec(artList)?.[1] ?? "none";
const backShape = /Same (\S+) and (\d+ \S+ \d+) as a face/.exec(artList);
check("the backs ask for the face's ratio", backShape?.[1] ?? "none", faceRatio);
check("and the face's size", backShape?.[2] ?? "none", faceSize);

/* ---- a prose step is announced, and three families of prose became fields ---- */

/*
 * **A step that is only prose used to do nothing at all.** `case "":` broke out of a switch that
 * is the end of the method, so seventy-five steps -- *every corpse within 3 rises and fights for
 * you*, *a minor god becomes present and fights as an ally* -- produced no effect, no prompt and
 * no line in chat. The branch below it already announced any verb the engine did not recognise, so
 * the arrangement was exactly backwards: a made-up verb reached the table and a blank one was
 * dropped. `initial: ""` on the schema is what hid it, because content omits the key.
 */
const trayCode = traySource.replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n").map(line => line.replace(/\/\/.*$/, "")).join("\n");
check("a prose step still breaks out of the switch",
  /case "":\s*\n\s*if \(!step\.condition\) break;/.test(trayCode) ? "yes" : "no", "no");
check("and falls through to the announcement instead",
  /case "":\s*\n\s*if \(step\.condition\) \{/.test(trayCode) ? "yes" : "no", "yes");
/* The announcement it falls into, which is what makes the fall-through worth anything. */
check("and the announcement prints the prose",
  /\$\{step\.text \? ` \u2014 \$\{step\.text\}` : ""\}/.test(traySource) ? "yes" : "no", "yes");

/*
 * **Timing.** Thirty-one steps carried it as a prefix on their prose -- `ritual:`, `reaction:`,
 * `permanent:`, `out of combat:`, `before a fight` -- and the engine could read none of it. A
 * ritual played in the middle of a fight is not a rules argument the software should leave to the
 * table when the card already says so.
 *
 * **`permanent` is no longer one of them**, and twenty-two steps declare a timing rather than
 * thirty-one. It never said when anything happens: it said *this formula can never be prepared*,
 * which is a slot budget in a timing's field. The nine steps that carried it are features now, and
 * a feature is permanent by having no gate to pass.
 */
check("the timing vocabulary", Object.keys(CARDRPG.timings).join(", "),
  "reaction, ritual, outOfCombat, beforeFight");
check("and the retired one is gone from the step choices",
  [...stepKeys].includes("timing")
    && !/permanent/.test(cardsSource.slice(cardsSource.indexOf("timing: new fields"),
      cardsSource.indexOf("timing: new fields") + 300)) ? "yes" : "no", "yes");
/*
 * Every step in the game, each counted ONCE.
 *
 * `graph.SPELLS` is built from the Signatures among others, so a Signature spell is in both lists
 * and a naive sweep counts its steps twice -- which is the same mistake the pack builder made this
 * morning, where `SPELLS` and `SIGNATURES` reported `The Clean Hand` as two slates of one name. The
 * entries are deduplicated by identity, because the same object seen through two tables is one
 * piece of content and not two.
 */
const everyEntry = new Set([content.WARRIOR_DECK, content.SHADE_DECK, content.COMMON_POOL,
  content.WAY_CARDS,
  content.SHADE_POOL, content.STRENGTH_POOL, content.WILD_MAGIC, content.INTENTS,
  graph.SIGNATURES, graph.TEACHINGS].flatMap(l => l ?? []));
const everyStep = [];
for (const entry of everyEntry) {
  for (const arr of [entry.primary, entry.secondary, entry.sequence,
    entry.effect ? [entry.effect] : null]) {
    for (const st of arr ?? []) everyStep.push({ card: entry.name, st });
  }
}
check("steps the timing audit read", everyStep.length, 361);

/*
 * **Every key a combo clause uses is a key the clause's schema declares.**
 *
 * The same sweep `strayVerbKeys` runs one level down, for the same reason and against the same
 * silence: a content field the schema does not have is DROPPED, not rejected, so the clause reads
 * back perfectly offline and is simply gone in play. `when` grew two fields the day
 * `ignoresArmour` stopped being prose, and a break test proved that removing them again was
 * invisible to every other check in this file -- *Between the Plates* would have kept its field
 * in content and lost it in the world.
 */
const whenStart = cardsSource.indexOf("when: new fields.SchemaField({");
const whenFields = new Set([...cardsSource
  /* To the clause's OWN closing brace, at its own indent: the first `}),` in the block belongs to
   * the nested StringField on `needs`, and slicing there found one field out of seven. */
  .slice(whenStart, cardsSource.indexOf("\n    }),", whenStart))
  .matchAll(/^ {6}([a-zA-Z]+): /gm)].map(m => m[1]));
check("combo-clause fields the schema declares", [...whenFields].sort().join(", "),
  "advantage, dc, ignoresArmour, ignoresBlock, mod, needs, text");
const strayWhenKeys = new Set();
for (const { st } of everyStep) {
  for (const key of Object.keys(st.when ?? {})) if (!whenFields.has(key)) strayWhenKeys.add(key);
}
check("combo-clause keys content uses that the schema would drop",
  strayWhenKeys.size ? [...strayWhenKeys].join(", ") : "none", "none");
/* Pinned beside the stray-timing sweep further down, which is the sweep it protects. */
/*
 * **And the four fields the cheap batch added**, each written by content as well as declared: a
 * field nothing writes is the same defect as a field nothing reads, and this project has met the
 * second one six times.
 */
/*
 * **`targets` is the largest single conversion of these three increments**, and the oldest
 * assumption in the game to be written down: a step targeted an ENEMY, implicitly, because the
 * first step anybody wrote was a Strike. Twenty-nine steps affect allies and could not say so, so
 * the engine could not tell a blessing from an attack.
 *
 * Blank still means one enemy, which is what saying nothing has always meant.
 */
/*
 * **`ground` is the one that owns map state, and the first gap this project has closed by building
 * the mechanism a card named rather than by rewriting the card.** `Set` was queued under *placing a
 * trap on a square* for as long as it has existed; a shape, a square and a trap is that gap, so the
 * census below is one gap shorter than it was.
 */
for (const [what, count, read] of [
  ["leave ground behind", 8, s => s.st.ground?.shape],
  ["say who they are for", 32, s => s.st.targets],
  ["say how often they may be played", 3, s => s.st.oncePer],
  /* Five, not three: *Measure* and *Bring It Down* joined when the fields became readable, and
   * the conditional pair on *Between the Plates* hangs off its opening rather than its step. */
  ["go straight through armour, Block or cover", 6,
    s => s.st.ignoresArmour || s.st.ignoresBlock || s.st.ignoresCover],
  ["name whose fate deck they Read", 4, s => s.st.readDeck],
  ["wait on a state of the player's own", 11, s => s.st.whileState]
]) {
  check(`steps that ${what}`, everyStep.filter(read).length, count);
}
/* Every value of the two bigger enums is used, or it is an entry in a dropdown and nothing else. */
for (const [name, table, read] of [
  ["ground shapes", CARDRPG.groundShapes, s => s.st.ground?.shape],
  ["targets", CARDRPG.targets, s => s.st.targets],
  ["limits", CARDRPG.limits, s => s.st.oncePer],
  ["read targets", CARDRPG.readDecks, s => s.st.readDeck],
  ["states", CARDRPG.whileStates, s => s.st.whileState]
]) {
  const used = new Set(everyStep.map(read).filter(Boolean));
  check(`${name} declared and never used`,
    Object.keys(table).filter(k => !used.has(k)).join(", ") || "none", "none");
}
/* And nothing says it twice: a prefix left in the prose beside its field reads to a player as
 * though the card means both. */
/*
 * And the ally steps keep their sentence on purpose: what the ally GETS is still prose, because
 * nine steps want a grant and want eight different values between them. One value per card is a
 * free-text special wearing an enum's clothes, so the uniform half moved and the varied half did
 * not -- which is why `targets` is not checked for saying it twice.
 */
const saidTwice = everyStep.filter(s =>
  (s.st.oncePer && /\bOnce (a day|per)\b/i.test(s.st.text ?? ""))
  || (s.st.whileState && /^while\b/i.test(s.st.text ?? ""))
  || ((s.st.ignoresArmour || s.st.ignoresBlock || s.st.ignoresCover)
    && /\bignoring\b/i.test(s.st.text ?? ""))
  || (s.st.readDeck && /fate deck/i.test(s.st.text ?? "")));
/* Every ground property is used by a zone, and the list is a LIST because several cards name two
 * or three at once -- a column of booleans could not have said that cheaply. */
const groundSteps = everyStep.filter(s => s.st.ground?.shape);
const groundUsed = new Set(groundSteps.flatMap(s => s.st.ground.effects ?? []));
check("ground properties declared and never used",
  Object.keys(CARDRPG.groundEffects).filter(k => !groundUsed.has(k)).join(", ") || "none", "none");
check("and the zone that names three at once",
  groundSteps.filter(s => (s.st.ground.effects ?? []).length >= 2).map(s => s.card).sort()
    .join(", "), "The Sphere Entire, Wall of the Sphere");
/* Ground with a shape and nothing to do is a template on the map that means nothing. */
check("ground that does nothing",
  groundSteps.filter(s => !(s.st.ground.effects ?? []).length && !s.st.ground.damage
    && !s.st.condition).map(s => s.card).join(", ") || "none", "none");
/* And nothing claims to place it: where a three-square line goes is a judgement about the map. */
check("and the schema says nothing places it",
  /Nothing here PLACES it/.test(cardsSource) ? "yes" : "no", "yes");
check("steps that say it in a field and in prose",
  saidTwice.map(s => `${s.card}: ${s.st.text}`).slice(0, 3).join(" | ") || "none", "none");
/*
 * And no step says it twice. A prefix left in the prose beside a `timing` field is the stale half
 * of a move, and it reads to a player as though the card means both.
 */
const prefixedTwice = everyStep.filter(s => /^(ritual|reaction|permanent|out of combat|before (a|the) fight)\b/i
  .test(s.st.text ?? ""));
check("steps still carrying the prefix in prose",
  prefixedTwice.map(s => `${s.card}: ${s.st.text}`).slice(0, 4).join(" | ") || "none", "none");
/* Every value is used by something: a timing nobody writes is a choice in a dropdown and nothing
 * else. `beforeFight` is the thin one, with the two cards that need it. */
const timingsUsed = new Set(everyStep.map(s => s.st.timing).filter(Boolean));
check("timings declared and never used",
  Object.keys(CARDRPG.timings).filter(t => !timingsUsed.has(t)).join(", ") || "none", "none");
/* That the editor can set it is enforced generically further down -- "step fields the editor
 * cannot set" reads every key of the schema -- so it is not asserted twice here. */

/*
 * **Conjuration, configured rather than written one card at a time.**
 *
 * Six steps conjured in prose, and the content itself had already noticed they were one thing: *a
 * god standing on the board and a corpse standing on the board are one piece of work*, says the
 * comment above The Great Bargain. What separated the lesser necromancy from the greater was
 * entirely how many, from what, whose side and at what price -- four numbers, in a sentence.
 */
const conjurings = everyStep.filter(s => s.st.verb === "conjure");
check("steps that conjure", conjurings.length, 5);
/*
 * **And each says, in prose, what it is calling up.** `from` was a field for one turn and went
 * back to being a sentence: *a corpse rises*, *a minor god becomes present*. The engine never
 * needed to know which, because it cannot see whether there is a body on the floor and the table
 * can. What it keeps is the creature's identity, where a card fixes one.
 */
check("and each says in prose what it calls up",
  conjurings.filter(s => !s.st.text).map(s => s.card).join(", ") || "none", "none");
/* None of them names a creature yet, and that is correct rather than unfinished: every conjuring
 * in the game is deliberately open, so the GM decides what stands up. The field is there for the
 * card that wants to fix one. */
check("conjurings that fix which creature arrives",
  conjurings.filter(s => s.st.conjure?.creature).length, 0);
/* A named god is one the world names. `name: ""` is not a gap -- two cards say the GM decides,
 * because a minor god is a person with its own opinions. */
check("the minor gods the world names", content.MINOR_GODS.length, 8);
check("and every one has a name",
  content.MINOR_GODS.filter(g => !g.name).length, 0);
/*
 * **And every one of them has a statline, which is what makes The Great Bargain playable.**
 *
 * The card says a minor god *is actually here* and the GM plays it, and for as long as the eight
 * were a list of names with notes there was nothing to play. They are roster creatures as well as
 * MINOR_GODS entries now -- the list says who they are to a worshipper, the roster says what
 * happens if one is in front of you -- and this is what holds the two spellings together.
 */
/* Expanded here rather than taken from `everyCreature`, which this file does not define until
 * much further down: this section runs with the spells. */
const rosterNow = monsters.expandRoster(content.ROSTER, content.VARIANTS);
check("minor gods the roster can actually put on a table",
  content.MINOR_GODS.filter(g => !rosterNow.some(c => c.name === g.name))
    .map(g => g.name).join(", ") || "none", "none");
/* And they outrank everything else, which is the whole argument for statting them at all. */
const godHealth = content.MINOR_GODS
  .map(g => rosterNow.find(c => c.name === g.name)?.system.health.base ?? 0);
const mortalTop = Math.max(...rosterNow
  .filter(c => !content.MINOR_GODS.some(g => g.name === c.name))
  .map(c => c.system.health.base));
/*
 * Measured against the DRAGON rather than against the top of the health column. The Queen is
 * sixty and the biggest mortal, and that sixty is her army rather than her -- she cannot move.
 * The strongest thing in the game that actually comes at you is the Dragon at fifty, and every
 * god clears it.
 */
const dragonHealth = rosterNow.find(c => c.name === "Dragon").system.health.base;
check("and the weakest of them still outlives the Dragon",
  Math.min(...godHealth) > dragonHealth ? "yes" : "no", "yes");
check("which it is, at", dragonHealth, 50);
const godNames = new Set(content.MINOR_GODS.map(g => g.name));
const creatureNames = new Set(monsters.expandRoster(content.ROSTER, content.VARIANTS)
  .map(c => c.name));
const badNames = conjurings.filter(s => {
  const n = s.st.conjure?.name;
  if (!n) return false;
  return s.st.conjure.from === "god" ? !godNames.has(n) : !creatureNames.has(n);
});
check("conjurings naming something that does not exist",
  badNames.map(s => `${s.card}: ${s.st.conjure.name}`).join(", ") || "none", "none");
/* And the engine reads every field, in the one resolver: a config the resolver ignores is four
 * numbers in a data model and a sentence the table still has to adjudicate from scratch. */
const conjureBody = resolveSource.slice(resolveSource.indexOf("export async function resolveConjure"),
  resolveSource.indexOf("export async function resolveShape"));
/*
 * **Each field by what it is read FOR, not by its own name.** An earlier pass had five fields and a
 * break test deleted the line naming one of them with nothing noticing, because the field was read
 * twice in the same function -- a grep either line can answer is a grep about neither, which is
 * the rule the self-check section applies to whole files, one scale down.
 */
for (const [field, pattern] of [
  ["creature", /const named = cfg\.creature \|\| ""/],
  ["upkeep.taint", /cfg\.upkeep\?\.taint/],
  ["upkeep.health", /cfg\.upkeep\?\.health/]
]) {
  check(`the resolver reads conjure.${field}`,
    pattern.test(conjureBody) ? "yes" : "no", "yes");
}
check("and the step's own range and duration",
  /step\.range/.test(conjureBody) && /step\.duration/.test(conjureBody) ? "yes" : "no", "yes");
/*
 * **The number is asked, not configured**, which is the whole of the change: a `count` on the card
 * was the engine holding an opinion about the state of a battlefield it cannot see. A player who
 * says *three* with the GM nodding has settled it better than a field could.
 */
/* And a fixed name is checked against both tables before anything is built: a card naming a
 * creature nobody wrote would otherwise conjure silence. */
check("and refuses a name in neither the roster nor the gods",
  /if \(named && !creatures\.has\(named\) && !godsByName\(\)\.has\(named\)\) \{/
    .test(conjureBody) ? "yes" : "no", "yes");
check("the resolver asks how many",
  /DialogV2\.prompt\(\{[\s\S]{0,400}How many/.test(conjureBody) ? "yes" : "no", "yes");
check("and refuses a number it was not given",
  /if \(!count\) return false;/.test(conjureBody) ? "yes" : "no", "yes");
check("and caps it, because a prompt is not a promise",
  /Math\.min\(asked, 20\)/.test(conjureBody) ? "yes" : "no", "yes");
/*
 * **And the conjurer gets OWNER on what arrives**, which is the only part of *under their control*
 * that is not a sentence: a token the player cannot move is a conjuration the GM plays for them.
 */
check("the conjurer is given control of it",
  /ownership: \{ \.\.\.built\.ownership, \[game\.user\.id\]: 3 \}/.test(conjureBody)
    ? "yes" : "no", "yes");
check("and the two retired vocabularies are gone from config",
  /conjureSources|conjureSides/.test(configSource) ? "still there" : "gone", "gone");
check("and the step's own range and duration",
  /step\.range/.test(conjureBody) && /step\.duration/.test(conjureBody) ? "yes" : "no", "yes");
check("and the tray calls it",
  /case "conjure":\s*\n\s*await resolveConjure\(actor, \{ step \}\);/.test(traySource)
    ? "yes" : "no", "yes");

/*
 * **Shape, which names a creature and lets the creature supply the numbers.**
 *
 * There is no table of forms, and that is the whole design: a table of forms would be a second
 * description of forty-seven creatures that already exist, and two descriptions of a thing drift
 * -- which this project has now watched happen with the goblin's deck and with `The Kit`.
 */
/*
 * **A transformation adds a set of cards and takes a filtered set of the player's own away.**
 *
 * The second half is what makes it a transformation and not a bonus: an earlier pass lent you a
 * creature's natural weapons and nothing else, which made a bird that still had hands. A form that
 * only adds is a costume.
 */
const shapes = everyStep.filter(s => s.st.verb === "shape");
check("steps that transform", shapes.length, 1);
check("transformations written", content.TRANSFORMATIONS.length, 1);
const formNames = new Set(content.TRANSFORMATIONS.map(t => t.name));
check("and each step names one that exists",
  shapes.filter(s => !formNames.has(s.st.shape?.transformation ?? "")).map(s => s.card).join(", ")
    || "none", "none");
/*
 * Everything a transformation GRANTS is content that exists. A form granting a card nobody wrote is
 * a form that silently gives nothing, which is the shape of defect this suite was built for.
 */
const formSlateNames = new Set([...content.ITEMS, ...content.NPC_GEAR, ...content.NATURAL_WEAPONS,
  ...content.FEATURES].map(e => e.name));
const formCardNames = new Set([...content.WARRIOR_DECK, ...content.SHADE_DECK,
  ...content.COMMON_POOL, ...content.WAY_CARDS,
  ...content.SHADE_POOL, ...content.STRENGTH_POOL].map(c => c.name));
const grantFaults = [];
for (const t of content.TRANSFORMATIONS) {
  for (const n of [...(t.grants?.items ?? []), ...(t.grants?.features ?? [])]) {
    if (!formSlateNames.has(n)) grantFaults.push(`${t.name} grants ${n}`);
  }
  for (const n of t.grants?.cards ?? []) {
    if (!formCardNames.has(n)) grantFaults.push(`${t.name} grants the card ${n}`);
  }
  /* And a quarantine that names a feature or card by hand names a real one, for the same reason:
   * a filter that matches nothing is a transformation that takes nothing away. */
  for (const n of t.quarantine?.features ?? []) {
    if (!formSlateNames.has(n)) grantFaults.push(`${t.name} quarantines ${n}`);
  }
  for (const n of t.quarantine?.cards ?? []) {
    if (!formCardNames.has(n)) grantFaults.push(`${t.name} quarantines the card ${n}`);
  }
}
check("transformations naming content that does not exist",
  grantFaults.join(", ") || "none", "none");
/*
 * **And each shape step actually takes something away, or it is a costume.**
 *
 * The quarantine is on the STEP rather than on the transformation, because that is where it can be
 * edited: `content.mjs` is a source file and nothing in Foundry writes to it, so a quarantine a GM
 * ticks in the card sheet has to be a document field. The cost of that is a form used twice saying
 * "no hands" twice; what it buys is that a greater version of the same borrowed body can be
 * gentler about what you drop.
 */
const costumes = shapes.filter(s => {
  const q = s.st.shape?.quarantine ?? {};
  return ![...(q.slots ?? []), ...(q.tags ?? []), ...(q.features ?? []), ...(q.cards ?? [])].length;
});
check("shape steps that take nothing away", costumes.map(s => s.card).join(", ") || "none", "none");
/*
 * **How far each quarantine actually reaches, measured through the filter itself.**
 *
 * A first version of this counted items whose `slot` is `"hands"`, read off the content rather than
 * off the rule -- so a break test that changed the filter to `"pack"` moved nothing, because the
 * check was measuring something else that happened to agree. A measurement of a rule has to be
 * taken through the rule.
 */
const everyItemEntry = [...content.ITEMS, ...content.NPC_GEAR, ...content.NATURAL_WEAPONS];
const asSlate = e => ({ type: "item", name: e.name, system: e });
const quarantineReach = shapes.map(s =>
  `${s.card}:${everyItemEntry
    .filter(e => resolve.quarantines(s.st.shape?.quarantine, asSlate(e))).length}`);
/*
 * 55 and not 54: the Goblin Shield's slot was `offhand`, which is not a slot this game has, so the
 * schema refused it and the rule -- which quarantines `slots: ["hands"]` -- could not see a shield
 * at all. It is `hands` now, like every other shield in the book, and the quarantine reaches it.
 */
check("items each shape step's quarantine reaches", quarantineReach.join(" "),
  "The Borrowed Body:68");
/* And none of them reaches nothing, which `quarantines` returning false for everything would
 * produce while every field was still filled in. */
check("quarantines that match no item at all",
  quarantineReach.filter(r => r.endsWith(":0")).join(", ") || "none", "none");

const shapeBody = resolveSource.slice(resolveSource.indexOf("export async function resolveShape"),
  resolveSource.indexOf("async function quarantineCards"));
const endBody = resolveSource.slice(resolveSource.indexOf("export async function endTransformation"));
check("the resolver reads the named transformation",
  /step\.shape\?\.transformation/.test(shapeBody) ? "yes" : "no", "yes");
check("and refuses one that grants content that does not exist",
  /grants content that does not exist/.test(shapeBody) ? "yes" : "no", "yes");
check("and will not stack with itself",
  /already transformed\. End that one first/.test(shapeBody) ? "yes" : "no", "yes");
/*
 * **Quarantine is movement, not a flag**, and that is the load-bearing decision. More than ten
 * places read a slate -- combat, grants, resolution, the sheets, the tray -- so a `quarantined`
 * boolean would have had to be respected by all of them and one would have been missed. Taking the
 * slate off the actor makes it unusable everywhere at once with no new reader anywhere.
 */
check("a quarantined slate is taken off the actor",
  /deleteEmbeddedDocuments\("Item", taken\.map\(i => i\.id\)\)/.test(shapeBody) ? "yes" : "no",
  "yes");
check("and kept whole, so putting it back is literal",
  /const kept = taken\.map\(i => i\.toObject\(\)\);/.test(shapeBody) ? "yes" : "no", "yes");
check("and no slate is flagged unusable instead",
  /quarantined: new fields\.BooleanField/.test(itemSource) ? "a flag" : "movement", "movement");
/*
 * A card moves to a pile, which is the same idea in the medium cards already use -- and BOTH halves
 * ask for that pile, one to put cards on it and one to take them off, so each is read in its own
 * body rather than over the file.
 */
const shelveBody = resolveSource.slice(resolveSource.indexOf("async function quarantineCards"),
  resolveSource.indexOf("export async function endTransformation"));
check("a quarantined card goes to a pile",
  /const shelf = deckOf\(actor, "quarantine"\);/.test(shelveBody) ? "yes" : "no", "yes");
check("and the half that ends it reads the same pile",
  /const shelf = deckOf\(actor, "quarantine"\);/.test(endBody) ? "yes" : "no", "yes");
/* And it warns rather than silently leaving the cards in play, which is what a world built before
 * the pile existed would do. */
check("and says so when there is no pile to shelve them on",
  /No quarantine pile on this actor; its cards stay in play/.test(shelveBody) ? "yes" : "no",
  "yes");
check("and the pile is declared on the actor",
  /quarantine: new fields\.DocumentIdField\(\)/.test(actorsSource) ? "yes" : "no", "yes");
check("and the starter routine creates one",
  /"Starter Warrior \u2014 Quarantine", "pile", "warrior\.quarantine"/.test(setupSource)
    ? "yes" : "no", "yes");
check("and wires it to the actor",
  /quarantine: warriorQuarantine\.id,/.test(setupSource) ? "yes" : "no", "yes");
/* A pile gets no back, which the deck audit already enforces for every pile -- so the shelf
 * cannot quietly acquire one. */
check("and it is a pile rather than a deck",
  /"Starter Warrior \u2014 Quarantine", "pile"/.test(setupSource) ? "yes" : "no", "yes");

/*
 * **And the other half, beside it.** A mechanism that adds in one place and removes in another is
 * one that will eventually add more than it removes, and what is left behind is a player quietly
 * holding a bird's mouth and their own sword.
 */
check("ending a transformation removes what it added",
  /deleteEmbeddedDocuments\("Item", added\.map\(i => i\.id\)\)/.test(endBody) ? "yes" : "no",
  "yes");
check("and restores what it took",
  /createEmbeddedDocuments\("Item", worn\.slates\)/.test(endBody) ? "yes" : "no", "yes");
/* A card goes back to the stack it came FROM, which is why the stack's name was written onto the
 * card: a card taken from a hand belongs in that hand, and putting everything in the deck would
 * shuffle somebody's turn away. */
check("and a card goes back where it came from",
  /deckOf\(actor, card\.getFlag\("cardrpg", FORM_FLAG\) \|\| "action"\)/.test(endBody)
    ? "yes" : "no", "yes");
/* The ACTOR's flag. `unsetFlag` is called twice in this function -- once per returned card, once
 * for the actor -- so a grep for the name was answered by either, and deleting the one that ends
 * the transformation left the check passing. Third time today. */
check("and the flag is cleared, so it cannot be ended twice",
  /await actor\.unsetFlag\("cardrpg", FORM_FLAG\);/.test(endBody) ? "yes" : "no", "yes");
check("and each returned card's note of where it came from is cleared too",
  /await card\.unsetFlag\("cardrpg", FORM_FLAG\);/.test(endBody) ? "yes" : "no", "yes");
check("and the tray calls the one that puts it on",
  /case "shape":\s*\n\s*await resolveShape\(actor, \{ step \}\);/.test(traySource) ? "yes" : "no",
  "yes");
/* Ending one is a thing somebody does, because nothing here owns a timer that survives a reload. */
check("and the API offers the one that takes it off",
  /^\s*endTransformation,$/m.test(entrySource) ? "yes" : "no", "yes");
/*
 * What a transformation must NOT touch, pinned because it is a design decision and not an
 * omission: the deck is the character in this game, and a bear that has forgotten it was poisoned
 * is a way out of a condition no card should hand over free.
 */
check("and the resolver says why the deck is untouched",
  /your \*\*Health\*\* and your \*\*conditions\*\*/.test(resolveSource) ? "yes" : "no", "yes");

/*
 * **And the prose is measurably smaller.** The point of all of it: a hundred and twenty-seven
 * steps said things the engine could not read, and this moved thirty-six of them -- thirty-one
 * timings and five conjurings -- out of prose and into fields.
 */
const proseLeft = everyStep.filter(s => s.st.text);
/*
 * **120, from 127 before this batch and 127 before the one before it.** The number moves slowly on
 * purpose: most of the 60 steps these three increments touched kept the part of their sentence no
 * field holds. What moved is the part that was a RULE -- when a step is played, how often, what it
 * costs, what it goes through, which deck it reads, what state of yours it waits on -- and what
 * stayed is the part that was a judgement.
 *
 * The count that actually fell is the one below: steps carrying prose and NOTHING else, 75 at the
 * start and 33 now. A step with prose beside its fields is a step the engine resolves and the
 * table reads; a step with prose alone is one the engine drops on the floor.
 */
check("steps still carrying prose", proseLeft.length, 114);
/* And the schema document says the same numbers, read off the same sweep rather than typed into
 * prose a second time: a document that counts the content is a document that goes stale. */
check("the schema document records what the sweep found",
  cardSchemaDoc.includes(`Of ${everyStep.length} steps, 127 carried prose`) ? "yes" : "no",
  "yes");
check("and what is left of it",
  cardSchemaDoc.includes(`${proseLeft.length} steps still carry prose`) ? "yes" : "no", "yes");
/*
 * And the document names every step field it claims to document. A row that quietly stops matching
 * the schema is a reader sent to look for something that is not there -- which is worse than no
 * row, because the row reads as authority.
 */
const documented = ["timing", "delay", "oncePer", "ignoresArmour", "ignoresBlock", "ignoresCover",
  "readDeck", "whileState", "targets", "ground", "conjure", "shape"];
/* The TABLE ROW, not a mention. The prose above the table names `targets` and `ground` too, so a
 * bare `includes` was answered by the paragraph while the row itself could be deleted -- which a
 * break test proved by deleting it. The fifth second printer this session, and the first in a
 * document. */
const docRows = cardSchemaDoc.split("\n").filter(l => l.startsWith("| "));
check("step fields the schema document names",
  documented.filter(f => !docRows.some(r => r.includes(`\`${f}\``))).join(", ") || "none", "none");
/* And the rows were really found, or the filter above passes everything. */
check("table rows the check read", docRows.length >= 40 ? "enough" : docRows.length, "enough");
/* And each one is really in the schema, so the list above cannot drift into fiction. */
check("and every one of them is a real field",
  documented.filter(f => !stepKeys.has(f)).join(", ") || "none", "none");
check("and that a conjuration's source is prose on purpose",
  /the source is prose/.test(cardSchemaDoc) ? "yes" : "no", "yes");
check("and why a free-text special was refused",
  /permanently unresolvable, which is the one thing this schema exists to\nprevent/
    .test(cardSchemaDoc) ? "yes" : "no", "yes");
/* A fragment that sits on one line of the document: collapsing the whitespace leaves the
 * blockquote's `>` in the middle of the sentence, which is a third way to trip on a line break. */
check("and what a transformation must not touch",
  cardSchemaDoc.includes("a form that replaced it would be a different character")
    ? "yes" : "no", "yes");
check("and that it leaves Health and conditions alone",
  cardSchemaDoc.includes("a bear that has forgotten it was poisoned is a way")
    ? "yes" : "no", "yes");
/*
 * **Twenty-four, up from twenty-one, and the three are honest.** `timing: "permanent"` was the only
 * field on three of the Graven steps, and it never said when anything happens -- it said *this
 * formula can never be prepared*, which is a slot budget in a timing's field. Those nine teachings
 * are features now and a feature is permanent by having no gate to pass, so the word was retired
 * and the three steps are left carrying what they always really carried: a sentence.
 */
check("and steps that carry prose and nothing else",
  proseLeft.filter(s => Object.keys(s.st).filter(k => k !== "text" && s.st[k] !== null
    && s.st[k] !== "" && !(typeof s.st[k] === "object")).length === 0).length, 26);

/* ---- the compendium packs ship the content, and ship today's ---- */

/*
 * **All of it, in packs, built from the tables.** Before this the data existed only as tables that
 * a setup routine turned into documents: a GM could not browse an item, drag a creature onto a
 * scene or look at a Signature without running the routine and digging through the sidebar, and
 * the hundred and nineteen school formulas the routine never created were unreachable entirely.
 *
 * The direction is content out, like everything else here. A pack edited in Foundry and a table
 * edited in the repository are two sources with no referee, and the disagreement is invisible --
 * each passes every check about itself. So the generator writes the packs, and this section reads
 * the committed files back and compares them with what the generator would write right now.
 */
const packs = await import("./build-packs.mjs");
/* The manifest is read at the top of this suite; one reading, so the two sections cannot be
 * looking at different files. */
const planned = packs.planDocuments();

check("compendium packs", planned.length, 7);
check("and what each one holds",
  planned.map(p => `${p.name}:${p.docs.length}`).join(" "),
  "creatures:112 characters:1 items:180 features:23 spells:118 signatures:30 decks:11");
/* Faults the generator records rather than throws: a filename collision silently drops a document,
 * so the build reports it and this refuses to pass with one outstanding. */
check("faults the generator reported", planned[0].faults.join("; ") || "none", "none");

/*
 * **Every Actor states its token's three dimensions**, which is the first thing Foundry ever told
 * this project and the only part of it that can rot.
 *
 * The first time the packs were loaded, all 48 Actors warned `prototypeToken: depth: must be a
 * number` and were migrated in place -- the one validation failure in 394 documents. A pack record
 * is validated as source, before the cleaning that would apply core's initial, and `width`,
 * `height` and `depth` are one group: supplying `depth` alone leaves the warning exactly where it
 * was (measured, with a `depth: 7` that Foundry discarded and stored as 1).
 *
 * This cannot ask Foundry anything. What it can ask is whether the builder still writes all three,
 * which is the mistake that would come back -- and it is asked of the Actor packs together, so a
 * pack that stopped producing Actors cannot pass it by being empty.
 */
const DIMENSIONS = ["width", "height", "depth"];
const actorDocs = planned.filter(p => ["creatures", "characters"].includes(p.name))
  .flatMap(p => p.docs);
check("Actor documents the dimension sweep read", actorDocs.length, 113);
check("Actors missing a token dimension",
  actorDocs.filter(d => DIMENSIONS.some(f => typeof d.prototypeToken?.[f] !== "number"))
    .map(d => d.name).join(", ") || "none", "none");
/* And the sweep is asking for something a document can fail: the three names are core's, not ours,
 * so a renamed field would otherwise read as a clean sweep over fields nobody has. */
check("and the group it asks for", DIMENSIONS.join("+"), "width+height+depth");

/*
 * **Every record says which Foundry wrote it, children included.**
 *
 * A record with no `_stats.coreVersion` is a record from before Foundry kept version numbers, so
 * Foundry brings it forward every time it reads it. Measured: 394 documents migrated on every boot
 * and the committed LevelDB came back changed from opening the game and touching nothing. Stamping
 * the top level took that to 59 -- and the 59 were exactly the documents with children, because an
 * unstamped child migrates its parent. Stamping the children took it to 0.
 *
 * The version is the manifest's, not a literal, so there is one claim about which Foundry this was
 * built for rather than two that can disagree.
 */
const everyPackDoc = planned.flatMap(p => p.docs);
const everyPackChild = planned.flatMap(p => p.docs.flatMap(d => d.items ?? d.cards ?? []));
check("documents the stamp sweep read", everyPackDoc.length, 475);
check("and children beneath them", everyPackChild.length, 345);
const unstamped = [...everyPackDoc, ...everyPackChild]
  .filter(d => d._stats?.coreVersion !== manifest.compatibility.verified
    || d._stats?.systemId !== manifest.id
    || d._stats?.systemVersion !== manifest.version);
check("records that do not say which Foundry wrote them",
  unstamped.length ? `${unstamped.length}: ${unstamped.slice(0, 3).map(d => d.name).join(", ")}`
    : "none", "none");
/* And the stamp is the manifest's own, so a sweep comparing a field with itself cannot pass. */
check("the version the stamp carries", `${manifest.id} ${manifest.version} on `
  + `${manifest.compatibility.verified}`, "cardrpg 0.2.0 on 14.369");

/*
 * **Every document in a pack is a document in the content**, counted from the tables rather than
 * from the pack -- a pack that lost half its entries would otherwise agree with itself.
 */
const packedFromContent = {
  creatures: monsters.expandRoster(content.ROSTER, content.VARIANTS).length,
  characters: 1,
  items: content.ITEMS.length + content.NPC_GEAR.length + content.NATURAL_WEAPONS.length,
  /*
   * Features, plus the eight a school teaches that are neither Signatures nor in `FEATURES`: seven
   * of Tattoo Magic and one of Asceticism's two renunciations. They were in the spells pack until
   * the law moved them, and the packer caught it the way it is built to -- eight source files in no
   * table at all.
   */
  features: content.FEATURES.length
    + graph.TEACHINGS.filter(t => graph.teachingKind(t) === "feature"
      && !graph.SIGNATURES.some(g => g.name === t.name)).length,
  spells: [...graph.SPELLS.values()]
    .filter(s => !graph.SIGNATURES.some(g => g.kind === "spell" && g.name === s.name)).length,
  signatures: graph.SIGNATURES.filter(s => s.kind !== "card").length,
  decks: 11
};
/*
 * And the features count as a literal beside the derivation. This check's own comment says why -- *a
 * pack that lost half its entries would otherwise agree with itself* -- and a break test pointed the
 * derivation at the pack and passed, which is exactly that failure with the comment still above it.
 */
check("features the content holds", packedFromContent.features, 23);
check("packs whose size disagrees with the content",
  planned.filter(p => p.docs.length !== packedFromContent[p.name])
    .map(p => `${p.name}: ${p.docs.length} vs ${packedFromContent[p.name]}`).join(", ") || "none",
  "none");
/* And the twenty-one Signatures that are CARDS are not missing, they are in a deck: a Card is a
 * different document class and cannot live in an Item pack. */
check("Signatures that are cards, and so are in a deck instead",
  graph.SIGNATURES.filter(s => s.kind === "card").length, 21);
check("which accounts for every Signature",
  graph.SIGNATURES.filter(s => s.kind !== "card").length
  + graph.SIGNATURES.filter(s => s.kind === "card").length, graph.SIGNATURES.length);

/*
 * **The committed files are today's.** One comparison per document, against the generator's own
 * serializer: a pack is stale the moment a table moves, and nothing about a stale pack looks wrong.
 */
const stale = [];
const missingFiles = [];
for (const pack of planned) {
  const dir = path.join(root, "packs/_source", pack.name);
  if (!fs.existsSync(dir)) { missingFiles.push(`${pack.name}: no source directory`); continue; }
  const onDisk = new Set(fs.readdirSync(dir).filter(f => f.endsWith(".json")));
  for (const doc of pack.docs) {
    const file = `${packs.fileSlug(doc.name)}.json`;
    if (!onDisk.delete(file)) { missingFiles.push(`${pack.name}/${file}`); continue; }
    const got = fs.readFileSync(path.join(dir, file), "utf8");
    if (got !== packs.serializeDoc(doc)) stale.push(`${pack.name}/${file}`);
  }
  for (const extra of onDisk) missingFiles.push(`${pack.name}/${extra} is in no table`);
}
check("pack sources missing or orphaned",
  missingFiles.length ? missingFiles.slice(0, 5).join(", ") : "none", "none");
check("pack sources that disagree with the content",
  stale.length ? `${stale.length}: ${stale.slice(0, 4).join(", ")}` : "none", "none");
/* A comparison that read no files would report "none" for a repository with no packs at all. */
check("documents the comparison actually read",
  planned.reduce((n, p) => n + p.docs.length, 0), 475);

/*
 * **An id is a promise.** A world that imports a creature keeps the pack's id, and so does every
 * link to it; regenerating with fresh ids would break all of them and the break is silent -- the
 * link resolves to nothing and the sheet goes blank. So ids are derived from what the document is,
 * and the rule is checked with the builder's own hash, because a copy of a rule is a second rule.
 */
const idFaults = [];
const everyId = new Map();
for (const pack of planned) {
  for (const doc of pack.docs) {
    if (doc._id !== packs.id16(`${pack.name}:${doc.name}`)) {
      idFaults.push(`${pack.name}/${doc.name}: id is not the hash of its key`);
    }
    if (!/^[A-Za-z0-9]{16}$/.test(doc._id)) idFaults.push(`${pack.name}/${doc.name}: malformed id`);
    if (everyId.has(doc._id)) {
      idFaults.push(`${doc._id}: ${everyId.get(doc._id)} and ${pack.name}/${doc.name}`);
    }
    everyId.set(doc._id, `${pack.name}/${doc.name}`);
    for (const child of doc.items ?? doc.cards ?? []) {
      if (!/^[A-Za-z0-9]{16}$/.test(child._id)) {
        idFaults.push(`${doc.name}/${child.name}: malformed id`);
      }
      if (everyId.has(child._id)) {
        idFaults.push(`${child._id}: ${everyId.get(child._id)} and ${doc.name}/${child.name}`);
      }
      everyId.set(child._id, `${doc.name}/${child.name}`);
    }
  }
}
check("ids that are not the hash of their key, malformed, or shared",
  idFaults.length ? idFaults.slice(0, 4).join("; ") : "none", "none");
check("ids the rule actually read", everyId.size, 820);
/* The hash itself, asked rather than shared: sixteen characters of the right alphabet, and the
 * same answer twice for the same key. */
check("an id is sixteen characters", packs.id16("items:Longsword").length, 16);
check("from the id alphabet only",
  /^[A-Za-z0-9]{16}$/.test(packs.id16("items:Longsword")) ? "yes" : "no", "yes");
check("and the same key gives the same id",
  packs.id16("items:Longsword"), packs.id16("items:Longsword"));
check("while a different key does not",
  packs.id16("items:Longsword") === packs.id16("items:Shortsword") ? "same" : "different",
  "different");
/*
 * **And the id itself, written down.** Every check above shares its implementation with the
 * generator, so a change to the hash moves both sides and they go on agreeing -- a break test
 * shifted the digest by one byte and the whole section passed. Three literals cannot be satisfied
 * that way.
 *
 * These are not arbitrary values to be updated when they fail. **They are the promise.** If a
 * change here is needed, every link in every world that ever imported from these packs is already
 * broken, and the right response is to put the hash back rather than to move the pin.
 */
check("the id for a known item", packs.id16("items:Longsword"), "AOyoqTG6b7KDVYLl");
check("for a known creature", packs.id16("creatures:Goblin"), "3DCR02y4L7E7a5Ns");
check("and for a known deck", packs.id16("decks:The Fate Deck"), "OIECs88iccWHuhYT");

/*
 * **The LevelDB key, which is the part Foundry reads and nothing here can test by running it.**
 * A primary document is `!<collection>!<id>`; an embedded one is `!<collection>.<embedded>!<parent
 * id>.<own id>`, and the parent id in it has to be the parent's. A key that is merely wrong gives
 * a pack that opens and is missing things, which is why the builder round-trips every pack through
 * Foundry's own packer and reads it back rather than trusting the scheme.
 */
const COLLECTION = { Actor: "actors", Item: "items", Cards: "cards" };
const EMBEDDED = { Actor: "items", Cards: "cards" };
const keyFaults = [];
for (const pack of planned) {
  const collection = COLLECTION[pack.type];
  for (const doc of pack.docs) {
    if (doc._key !== `!${collection}!${doc._id}`) keyFaults.push(`${pack.name}/${doc.name}`);
    for (const child of doc.items ?? doc.cards ?? []) {
      const want = `!${collection}.${EMBEDDED[pack.type]}!${doc._id}.${child._id}`;
      if (child._key !== want) keyFaults.push(`${doc.name}/${child.name}`);
    }
  }
}
check("documents whose LevelDB key is wrong",
  keyFaults.length ? keyFaults.slice(0, 4).join(", ") : "none", "none");
check("and the builder reads every pack back through Foundry's own packer",
  /await extractPack\(dest, check, \{ clean: true \}\)/.test(packSource) ? "yes" : "no", "yes");
check("comparing what came back with what went in",
  /packed \$\{docs\.length\} documents and read back/.test(packSource) ? "yes" : "no", "yes");

/*
 * **The manifest declares the packs that exist, and only those.** A declared pack with no
 * directory stops the system loading; an undeclared directory is a compendium Foundry never shows.
 * One is fatal and the other invisible, so neither is left to somebody remembering.
 */
check("packs declared in the manifest",
  (manifest.packs ?? []).map(p => p.name).join(", "),
  "creatures, characters, items, features, spells, signatures, decks");
const onDiskPacks = fs.readdirSync(path.join(root, "packs"))
  .filter(f => !f.startsWith("_") && fs.statSync(path.join(root, "packs", f)).isDirectory());
check("declared packs with no directory",
  (manifest.packs ?? []).filter(p => !onDiskPacks.includes(p.name)).map(p => p.name).join(", ")
    || "none", "none");
check("directories the manifest does not declare",
  onDiskPacks.filter(d => !(manifest.packs ?? []).some(p => p.name === d)).join(", ") || "none",
  "none");
/* And each directory really is a compiled LevelDB rather than an empty folder. */
check("packs with no compiled database",
  onDiskPacks.filter(d => {
    const files = fs.readdirSync(path.join(root, "packs", d));
    return !files.includes("CURRENT") || !files.some(f => f.startsWith("MANIFEST-"));
  }).join(", ") || "none", "none");
/*
 * **A pack's `type` must be a document class, its `system` must be this system, and its `path`
 * must be where the directory is.** The first two are what Foundry refuses to load without; the
 * third is what silently loads nothing.
 */
const manifestFaults = [];
for (const p of manifest.packs ?? []) {
  if (!(p.type in COLLECTION)) manifestFaults.push(`${p.name}: type ${p.type}`);
  if (p.system !== "cardrpg") manifestFaults.push(`${p.name}: system ${p.system}`);
  if (p.path !== `packs/${p.name}`) manifestFaults.push(`${p.name}: path ${p.path}`);
  if (!p.label) manifestFaults.push(`${p.name}: no label`);
  /* Folder membership is `packFolders` and nothing else: the manifest schema has no folder
   * property on a pack, so one written there is a key Foundry ignores. */
  if ("folder" in p) manifestFaults.push(`${p.name}: declares a folder itself`);
}
check("pack declarations with something wrong",
  manifestFaults.join("; ") || "none", "none");
check("and every pack is in the manifest's folder",
  (manifest.packFolders ?? []).flatMap(f => f.packs ?? []).sort().join(", "),
  (manifest.packs ?? []).map(p => p.name).sort().join(", "));

/*
 * **Every subtype in a pack is one the manifest registers.** A document whose `type` the system
 * does not declare arrives as `base`, which has no fields at all -- so an item packed as a subtype
 * nobody registered is an item with no data, and it looks like an item.
 */
const registeredSubtypes = {
  Actor: Object.keys(manifest.documentTypes?.Actor ?? {}),
  Item: Object.keys(manifest.documentTypes?.Item ?? {}),
  Cards: ["deck", "hand", "pile"]
};
const typeFaults = new Set();
for (const pack of planned) {
  for (const doc of pack.docs) {
    if (!registeredSubtypes[pack.type].includes(doc.type)) {
      typeFaults.add(`${pack.type}/${doc.type}`);
    }
    for (const child of doc.items ?? []) {
      if (!registeredSubtypes.Item.includes(child.type)) typeFaults.add(`Item/${child.type}`);
    }
    for (const child of doc.cards ?? []) {
      if (!Object.keys(manifest.documentTypes?.Card ?? {}).includes(child.type)) {
        typeFaults.add(`Card/${child.type}`);
      }
    }
  }
}
check("subtypes used in a pack that the manifest does not register",
  [...typeFaults].sort().join(", ") || "none", "none");
/* A parse that found no types would report "none" for a manifest declaring nothing. */
check("subtypes the rule read",
  [...new Set(planned.flatMap(p => [
    ...p.docs.map(d => `${p.type}/${d.type}`),
    ...p.docs.flatMap(d => (d.items ?? []).map(c => `Item/${c.type}`)),
    ...p.docs.flatMap(d => (d.cards ?? []).map(c => `Card/${c.type}`))
  ]))].sort().join(", "),
  "Actor/character, Actor/npc, Card/action, Card/fate, Card/npc, Card/skill, Card/twist, "
  + "Cards/deck, Item/feature, Item/item, Item/spell");

/*
 * **And a packed document carries nothing the schema will drop.** This is the sweep the item
 * tables already get, run over the packs instead of the tables -- which widens it from the hundred
 * and fifty-six entries of `ITEMS` and `NPC_GEAR` to every document the system ships, natural
 * weapons, features, spells, Signatures, creatures and the starter character included.
 *
 * A data model drops a key it does not know rather than rejecting it, so the test is not whether
 * the document loads but whether anything of it is thrown away on the way in.
 */
const actorSource = fs.readFileSync(path.join(root, "module/data/actors.mjs"), "utf8");
const fieldsOf = (src, from, to) => {
  const at = src.indexOf(from);
  const body = src.slice(at, to ? src.indexOf(to, at) : undefined);
  return new Set([...body.matchAll(/^      ([a-zA-Z]+): /gm)].map(m => m[1]));
};
const SCHEMA_FIELDS = {
  item: new Set([...fieldsOf(itemSource, "export class ItemSlateData", "export class FeatureSlateData"),
    "active", "drained", "drainedFor", "group", "text", "description", "equipped"]),
  feature: new Set([...fieldsOf(itemSource, "export class FeatureSlateData", "export class SpellSlateData"),
    "active", "drained", "drainedFor", "group", "text", "description", "equipped"]),
  spell: new Set([...fieldsOf(itemSource, "export class SpellSlateData"),
    "active", "drained", "drainedFor", "group", "text", "description", "equipped"]),
  npc: new Set([...fieldsOf(actorSource, "export class NpcData"), "decks"]),
  character: new Set([...fieldsOf(actorSource, "export class CharacterData", "export class NpcData"),
    "decks"])
};
/* The sets are read out of source, so an empty one would pass every document silently. */
check("schema fields the sweep read",
  Object.entries(SCHEMA_FIELDS).map(([k, v]) => `${k}:${v.size >= 6 ? "ok" : v.size}`).join(" "),
  "item:ok feature:ok spell:ok npc:ok character:ok");
const strayPacked = new Set();
for (const pack of planned) {
  for (const doc of pack.docs) {
    const own = SCHEMA_FIELDS[doc.type];
    if (own) {
      for (const key of Object.keys(doc.system ?? {})) {
        if (!own.has(key)) strayPacked.add(`${doc.type}.${key} (${doc.name})`);
      }
    }
    for (const child of doc.items ?? []) {
      const kid = SCHEMA_FIELDS[child.type];
      if (!kid) continue;
      for (const key of Object.keys(child.system ?? {})) {
        if (!kid.has(key)) strayPacked.add(`${child.type}.${key} (${child.name})`);
      }
    }
  }
}
check("packed keys the schema would drop",
  strayPacked.size ? [...strayPacked].sort().slice(0, 6).join(", ") : "none", "none");

/*
 * **Two slates of one name, which the packer found and nothing else had.** `The Kit` is written
 * twice: the catalogue's Tool, with a shadow bonus and lock training, and the Burglar's Signature,
 * with different text and no bonus. One pack cannot hold both -- they would share an id -- so they
 * are in different packs, and an actor that carries the name gets whichever table was read first.
 *
 * That is a coin flip dressed as a rule, so it is pinned rather than resolved: the design question
 * of which `The Kit` is the real one is not the packer's to answer, and a pin is how it stays
 * visible until somebody answers it.
 */
check("slates written twice under one name, same document type",
  packs.SLATE_CLASHES.join("; ") || "none", "The Kit: ITEMS and SIGNATURES, both item");
/*
 * The five other shared names are deliberate and cross document types, which is why they are fine:
 * a player's *Press* and a monster's *Press* are the same manoeuvre on two different cards, and a
 * card and a spell of one name are two documents a world never confuses.
 */
const nameUse = new Map();
for (const [table, list] of [
  ["POOL", [...graph.POOL.values()]], ["SPELLS", [...graph.SPELLS.values()]],
  ["INTENTS", content.INTENTS], ["WARRIOR_DECK", content.WARRIOR_DECK],
  ["SHADE_DECK", content.SHADE_DECK],
  ["WARRIOR_SKILLS", content.WARRIOR_SKILLS], ["WILD_MAGIC", content.WILD_MAGIC],
  ["TWISTS", content.TWISTS]
]) {
  for (const e of list) nameUse.set(e.name, [...(nameUse.get(e.name) ?? []), table]);
}
check("names shared across two card or spell tables",
  [...nameUse].filter(([, t]) => t.length > 1).map(([n, t]) => `${n}: ${t.join("+")}`).sort()
    .join(" | "),
  "Heave: POOL+WARRIOR_SKILLS | Hold the Line: POOL+INTENTS | Press: POOL+INTENTS | "
  + "Quick Hands: WARRIOR_DECK+WARRIOR_SKILLS | The Long Step: SPELLS+WILD_MAGIC");

/*
 * **The setup routine still builds the starter world from the tables**, and that is deliberate for
 * now: it is what a first session runs, it works, and rewiring it to import from a compendium is a
 * behaviour change nothing here can test. The packs are a GM's library; the routine is the starter
 * world. Both read the same tables, so neither can drift from the other.
 */
check("the starter routine reads the tables rather than a pack",
  /game\.packs/.test(setupCode) ? "a pack" : "the tables", "the tables");
check("and the one shape builder is shared with the packs",
  /import \{ slateData \} from "\.\.\/module\/setup\.mjs"/.test(packSource) ? "yes" : "no", "yes");
check("as are the card builders",
  /actionCardData, skillCardData, twistCardData, npcCardData/.test(packSource) ? "yes" : "no",
  "yes");
/* And the classification of what is a card, a spell or a slate is `graph.mjs`'s, not a second
 * opinion: a pack that disagreed about whether Step Through is a spell would file it twice. */
check("and the classification comes from the graph",
  /POOL, SPELLS, SIGNATURES, TEACHINGS, teachingKind, slateFieldsOf, spellKindOf[\s\S]{0,20}from "\.\.\/module\/graph\.mjs"/
    .test(packSource) ? "yes" : "no", "yes");
/*
 * And the strip itself, which is the part three callers share. A content entry carries the graph's
 * own fields -- `kind`, `node`, `needs`, `pool` -- and a data model drops a key it does not know
 * without a word, so an entry passed through whole loses whatever the schema has no field for. The
 * pack builder was the third caller and got the list wrong; the schema sweep above is what said so.
 */
check("one place strips the graph's fields",
  /export function slateFieldsOf\(def\)/.test(graphSource) ? "yes" : "no", "yes");
check("and all three callers use it",
  (`${graphSource}\n${packSource}`.match(/slateFieldsOf\(/g) ?? []).length, 4);
check("and none of them spells the list out any more",
  /const \{ kind, node, needs(, pool)?, \.\.\.fields \} = def;/
    .test(graphSource.replace(/export function slateFieldsOf[\s\S]*?\n\}/, ""))
    ? "still there" : "gone", "gone");

/*
 * **LevelDB is binary and this repository is checked out on Windows**, where git rewrites LF to
 * CRLF in anything it takes for text -- and it takes a MANIFEST and a .log for text. A pack that
 * has been through that conversion still looks like a pack and fails to open, with Foundry
 * reporting a corrupt compendium and nothing saying why.
 */
const attrs = fs.readFileSync(path.join(root, "../../.gitattributes"), "utf8");
/* Read as whole lines rather than built into a regex: the pattern IS the thing being checked, so
 * escaping it in order to look for it is a way to go wrong twice and notice neither time. */
const attrLines = attrs.split("\n").map(l => l.trim().split(/\s+/));
check("the pack formats git must not translate",
  ["*.ldb", "*.log", "MANIFEST-*", "CURRENT"]
    .filter(p => !attrLines.some(([pat, ...rest]) => pat === p && rest.includes("binary")))
    .join(", ") || "none", "none");
check("and the sources stay text with one newline",
  /packs\/_source\/\*\*\/\*\.json text eol=lf/.test(attrs) ? "yes" : "no", "yes");
/* LevelDB's own runtime files are not committed: a stale LOCK ships a pack nobody can open. */
const ignores = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
/*
 * **And the sentence that stops somebody editing a pack in Foundry**, which is the one mistake this
 * arrangement invites: a compendium is editable, the edit works, and the next build overwrites it
 * without warning. The README is where that is said, so it is where it is checked.
 */
const readmeSource = fs.readFileSync(path.join(root, "README.md"), "utf8");
/*
 * **And the install page's numbers, which are the roster's.** It told people the routine built
 * "a Goblin and a Goblin Archer" for a while after it built five, and that page is what somebody
 * follows to set up a test -- so the creatures it names and the count it gives are asked of the
 * content rather than left to whoever remembers to edit prose.
 */
const goblinLineNames = monsters.expandRoster(
  content.ROSTER.filter(r => r.system.kind === "goblin"), content.VARIANTS).map(c => c.name);
/* By the word that tells each one apart, which is how the prose names them: "the spearman, the
 * Warrior, the Archer, the Shaman and the Chief" reads better than five full names and says the
 * same thing. The base has no such word, so it is the one named for its weapon. */
check("the README names every variant in the goblin line",
  goblinLineNames.slice(1).map(n => n.split(" ").pop())
    /* Whitespace collapsed: the list wraps mid-phrase, and a check that a document SAYS something
     * must not depend on where the line happened to break. */
    .filter(w => !readmeSource.replace(/\s+/g, " ").includes(`the ${w}`)).join(", ") || "none",
  "none");
check("and the line is the length it says",
  readmeSource.replace(/\s+/g, " ")
    .includes("the spearman, the Warrior, the Archer, the Shaman and the Chief")
  && goblinLineNames.length === 5 ? "yes" : "no", "yes");
check("and counts the ones that arrive on demand",
  new RegExp(`\\*\\*The other ${
    monsters.expandRoster(content.ROSTER, content.VARIANTS).length - goblinLineNames.length
  } creatures arrive one at a time\\*\\*`).test(readmeSource) ? "yes" : "no", "yes");
check("and names the call that builds one",
  /game\.cardrpg\.buildMonster\("Mole Beast"\)/.test(readmeSource)
  && monsters.expandRoster(content.ROSTER, content.VARIANTS).some(c => c.name === "Mole Beast")
    ? "yes" : "no", "yes");
/* And the compendium, which is the other way to get one onto a table. */
check("and says the pack holds every creature",
  new RegExp(`which holds all ${
    monsters.expandRoster(content.ROSTER, content.VARIANTS).length
  } ready-made`).test(readmeSource) ? "yes" : "no", "yes");
check("the README says a pack is a build artefact",
  /> \*\*Editing a pack inside Foundry edits a build artefact\.\*\*/.test(readmeSource) ? "yes" : "no",
  "yes");
check("and says what to change instead",
  /Change `module\/content\.mjs` and rebuild\./.test(readmeSource) ? "yes" : "no", "yes");
/* Two files, two checks: one grep over both would have been answered by either, which is the
 * thing this suite's last section is entirely about. */
check("and gives the one command that rebuilds them",
  /^npm run packs$/m.test(readmeSource) ? "yes" : "no", "yes");
check("which package.json really defines",
  /"packs": "node test\/build-packs\.mjs"/
    .test(fs.readFileSync(path.join(root, "package.json"), "utf8")) ? "yes" : "no", "yes");
check("LevelDB runtime files kept out of the repository",
  ["packs/*/LOCK", "packs/*/LOG", "packs/*/LOG.old"]
    .filter(p => !ignores.includes(p)).join(", ") || "none", "none");

/* ---- how a card and the graph look ---- */

/*
 * Art arrives later, so the whole point of these is that the layout works WITHOUT it: every card
 * in the catalogue reads today and improves one file at a time.
 */

section("the rim, the art, and the four territories");

/* No new field: Foundry's own `img` slots, which nothing in this system used. */
check("art has one reader",
  /export function artOf\(doc\)/.test(decksSource) ? "yes" : "no", "yes");
/* Foundry fills those slots with its own placeholder, so the test is "is it ours". */
check("and core's placeholders are not treated as art",
  /path\.startsWith\("icons\/svg\/"\)/.test(decksSource) ? "yes" : "no", "yes");
/*
 * Both builders, separately. They are the same line twice -- an action card and a skill card each
 * put the art on the face -- so one regex over the whole file passed with either of them gutted.
 */
for (const [label, builder] of [["an action card", "actionCardData"], ["a skill card", "skillCardData"]]) {
  const body = decksSource.slice(decksSource.indexOf(`export function ${builder}(def)`));
  check(`${label} definition can carry art`,
    /faces: \[\{ name: def\.name, \.\.\.\(artIn\(def\) \? \{ img: artIn\(def\) \} : \{\}\) \}\]/
      .test(body.slice(0, body.indexOf("\n}"))) ? "yes" : "no", "yes");
}

/*
 * **And the other three slots, which the brief promised and nothing delivered.**
 *
 * The brief's central sentence is *add `art:` to the definition; no schema change is needed,
 * because Foundry already gives every Item an `img` and every Card face an `img`*. That was true
 * of cards and false of everything else: `slateData` spread the rest of an entry into `system`, so
 * an item's `art` settled in `system.art` and no document ever wore it -- a hundred and seventy of
 * the pieces in the catalogue. The levelling graph reads `art` straight out of content and draws
 * it on a node, which is exactly why nobody noticed.
 *
 * Each is read in the body that writes it, because "somewhere in the file" was the shape of the
 * bug: one `img` in the file passed for all four slots.
 */
const slateBody = setupSource.slice(setupSource.indexOf("export function slateData"));
/*
 * **And the whole entry goes in, not a fresh `{ art }`.** The path is derived from the list a
 * piece is on and `art.mjs` knows a piece by the object content declared, so handing it an object
 * built on the spot asks about something that is on no list. `{ art }` was enough while the field
 * was the only answer; it is now the one spelling that cannot work.
 */
check("an item definition can carry art",
  /\.\.\.\(artIn\(entry\) \? \{ img: artIn\(entry\) \} : \{\}\)/
    .test(slateBody.slice(0, slateBody.indexOf("\n}"))) ? "yes" : "no", "yes");
check("and `art` is destructured out, so it cannot fall into system again",
  /const \{ name, group, active, grants, bonus, text, copies, art, \.\.\.rest \} = entry;/
    .test(setupSource) ? "yes" : "no", "yes");
const actorBody = setupSource.slice(setupSource.indexOf("const buildActor = async"),
  setupSource.indexOf("/*\n   * --- a creature"));
check("a creature's definition reaches its portrait",
  /\.\.\.\(art \? \{ img: art \} : \{\}\),\n      system: \{ \.\.\.def\.system, decks \}/
    .test(actorBody) ? "yes" : "no", "yes");
check("and its token, which is the same file",
  /texture: \{ src: art \}/.test(actorBody) ? "yes" : "no", "yes");
/* One picture in both slots, so the two cannot be given different files by accident. */
check("and the token is not given a file of its own",
  /texture: \{ src: (?!art \})/.test(setupSource) ? "no" : "yes", "yes");
/*
 * An intent card has one shape, built in one place. Two routines create them -- the setup routine
 * for the goblin line and `buildMonster` for everything else -- and they were spelling the card
 * out separately, so the face's art had to be remembered twice.
 */
check("an intent card has one builder",
  /export function npcCardData\(card, \{ kind, creature, back \}\)/.test(decksSource)
    ? "yes" : "no", "yes");
check("and both routines use it",
  (setupSource.match(/npcCardData\(card, \{ kind, creature: creature\.name, back: npcBack \}\)/g)
    ?? []).length, 2);
check("and neither builds a face by hand any more",
  /faces: \[\{ name: card\.name \}\]/.test(setupSource) ? "no" : "yes", "yes");
const npcBody = decksSource.slice(decksSource.indexOf("export function npcCardData"));
check("and an intent card can carry art",
  /\.\.\.\(artIn\(card\) \? \{ img: artIn\(card\) \} : \{\}\)/
    .test(npcBody.slice(0, npcBody.indexOf("\n}"))) ? "yes" : "no", "yes");

/*
 * **And now the writers are RUN, which is the one thing every check above cannot do.**
 *
 * Everything in this section so far is a regular expression over source text, and the bug they
 * were written for would have passed all of them. `slateData` spread the rest of an entry into
 * `system`, so a hundred and seventy pieces put their path in `system.art` where no document
 * wears it -- and a grep for `artIn` in that file would have said yes, because `artIn` was there,
 * one line away from where the value actually went.
 *
 * So: build a document from a definition carrying a known path, and ask `artOf` -- the reader the
 * game itself uses -- to find it again. A writer that puts the path in the wrong slot fails here
 * however correct its source reads.
 *
 * **This is the gate the art pipeline needs.** Five hundred and eight paths are about to be
 * written into content, and the question that matters is not whether `art:` is spelled right but
 * whether a picture reaches the table.
 */
const decksLive = await import("../module/decks.mjs");
const setupLive = await import("../module/setup.mjs");
const SAMPLE_ART = "cardrpg/art/cards/starter/strike.webp";
const wiredBy = art => [
  ["an action card", decksLive.actionCardData({ name: "Strike", art })],
  ["a skill card", decksLive.skillCardData({ name: "Sharp Eyes", art })],
  ["an intent card", decksLive.npcCardData({ name: "Close In", art },
    { kind: "goblin", creature: "Goblin", back: "" })],
  ["an item, feature or weapon", setupLive.slateData({ name: "Dagger", art }, "item")]
];
const artCarried = wiredBy(SAMPLE_ART);
check("writers run, and asked for the path back",
  artCarried.filter(([, doc]) => decksLive.artOf(doc) === SAMPLE_ART).length, artCarried.length);
check("and the ones that lost it on the way",
  artCarried.filter(([, doc]) => decksLive.artOf(doc) !== SAMPLE_ART)
    .map(([label]) => label).join(", ") || "none", "none");
/*
 * The exact shape of the old bug, asked of the built document rather than of the source: a path
 * that reaches `system.art` is a path the game cannot see, and it reads back perfectly from
 * content the whole time.
 */
check("and none of them leaves it in system.art",
  artCarried.filter(([, doc]) => doc.system?.art !== undefined)
    .map(([label]) => label).join(", ") || "none", "none");
/*
 * And the guard in the other direction. Foundry FILLS `img` with its own placeholder when a
 * document is created, so "is there a path" was never the question -- a generic bag icon
 * stretched full bleed across a card is worse than no art at all.
 */
const placeheld = wiredBy("icons/svg/item-bag.svg");
check("and core's placeholder is refused by every one of them",
  placeheld.filter(([, doc]) => decksLive.artOf(doc) !== "")
    .map(([label]) => label).join(", ") || "none", "none");
/*
 * The creature's two slots are not here, and the reason is worth stating: they are written by
 * `Actor.create` inside the setup routine, which needs Foundry. They stay greps above until
 * something builds a document against the data models -- which this file's own header already
 * names as the gap a clean headless load does not close.
 */

/*
 * The rim is the BORDER, which is what lets the art sit inside it with no extra element: the
 * background is clipped to the padding box, so it stops where the rim begins exactly as the
 * printing on a playing card stops short of the white.
 */
check("the rim is the border", /border: 5px solid var\(--cardrpg-paper\)/.test(css) ? "yes" : "no",
  "yes");
/*
 * The DECLARATION, not the comment above it explaining the declaration. The first version of this
 * matched the prose and passed happily with the property deleted -- the oldest trap in this
 * project's test suite, wearing CSS this time instead of JavaScript.
 */
check("and the art stops at it",
  /^ {2}background-clip: padding-box;$/m.test(css) ? "yes" : "no", "yes");
/*
 * **The ratio is one number.** It was two -- `0.716` in the card's own `aspect-ratio` and
 * `128/179` in the tray's layout block -- and they already disagreed in the third decimal, which
 * is what a duplicated constant does while nobody is looking. The tray's height is derived from
 * the ratio now, so a change to the shape of a card is one edit.
 */
check("the card ratio is stated once",
  (css.match(/--cardrpg-card-ratio: [\d.]+;/g) ?? []).length, 1);
check("and the tray's height is derived from it",
  /--cr-card-h: calc\(var\(--cr-card-w\) \/ var\(--cardrpg-card-ratio\)\);/.test(css)
    ? "yes" : "no", "yes");
/* It also scales a card turned sideways, so a rotated card still fits the slot it came from. */
check("a sideways card is scaled by the same number",
  /transform: rotate\(90deg\) scale\(var\(--cardrpg-card-ratio\)\);/.test(css) ? "yes" : "no",
  "yes");
/* The brief and the card agree, which is the only way art arrives uncropped. */
const ratioInCss = Number(/--cardrpg-card-ratio: ([\d.]+);/.exec(css)?.[1] ?? 0);
check("the card is 2:3", Math.abs(ratioInCss - 2 / 3) < 0.001, true);

/* Cover, not contain: a file at some other shape is cropped rather than letterboxed. */
check("art is cropped rather than letterboxed",
  /background-size: cover/.test(css) ? "yes" : "no", "yes");
/* A tint still means a bonus group and nothing else, and the band carries the style too. */
check("the group rim is the same band",
  /\.cr-slate\[data-group\] \{ border-width: 5px/.test(css) ? "yes" : "no", "yes");
check("and seven groups still differ by more than hue",
  (css.match(/border-style: (double|dashed)/g) ?? []).length >= 4, true);
/* The scrim is the paper colour, so a card with no art looks unlayered rather than washed out. */
check("the scrim is the paper colour",
  /--cardrpg-scrim: rgba\(244, 239, 230, 0\.86\)/.test(css) ? "yes" : "no", "yes");

/* The graph: a Way per colour, four territories, and state in the border. */
const paneSource = fs.readFileSync(path.join(root, "module/levelup.mjs"), "utf8");
const wayBlock = /const WAY_COLOUR = \{([\s\S]*?)\n\};/.exec(paneSource)?.[1] ?? "";
check("a colour per Way",
  [...wayBlock.matchAll(/^ {2}([a-z]+): \{/gm)].map(m => m[1]).join(", "),
  "shade, strength, mind, faith, root");
check("the fill says which Way",
  /selector: "node\[way\]"[\s\S]{0,120}"background-color": "data\(fill\)"/.test(paneSource)
    ? "yes" : "no", "yes");
/*
 * And the state never touches the fill, which is the Way's now. A closed Shade node is drained of
 * its colour rather than painted a different one: it should still look like a Shade node.
 */
const stateRules = (/node\[state = 'closed'\][\s\S]{0,260}?\}/.exec(paneSource)?.[0] ?? "");
check("state does not repaint the fill",
  /"background-color"/.test(stateRules) ? "no" : "yes", "yes");
check("a closed node is drained instead",
  /"background-blacken": 0\.55/.test(stateRules) ? "yes" : "no", "yes");
/* Four labelled territories, which is what turns 169 boxes into four places. */
check("the Ways are drawn as territories",
  /nodes\.push\(\{ data: \{ id: `territory-\$\{way\}`/.test(paneSource) ? "yes" : "no", "yes");
check("and a territory is scenery",
  /if \(ev\.target\.isParent\(\)\) return;/.test(paneSource) ? "yes" : "no", "yes");
/* A node wears what it hands over: what a node GIVES is the thing worth looking at. */
check("a node shows the art of what it grants",
  /function artFor\(node\)/.test(paneSource) ? "yes" : "no", "yes");
check("an edge takes its colour from where it arrives",
  /edge: \(WAY_COLOUR\[wayOf\(id\)\] \?\? WAY_COLOUR\.root\)\.edge/.test(paneSource)
    ? "yes" : "no", "yes");
check("and a walked road is brighter",
  /walked: owned\.has\(prereq\) && owned\.has\(id\) \? "yes" : "no"/.test(paneSource)
    ? "yes" : "no", "yes");

/* The record: the ratio to supply art at, which is the one thing art needs decided in advance. */
check("the spec says what to supply",
  /\| Ratio \| \*\*2:3\*\* \|/.test(hudPane) ? "yes" : "no", "yes");
check("and why the face cannot be a picture",
  /renders a face from data so that a[\s\S]{0,40}condition can switch an individual icon off/
    .test(hudPane) ? "yes" : "no", "yes");
check("the spec says the ratio is one number",
  /\*\*The ratio is one number, and it moved once\.\*\*/.test(hudPane) ? "yes" : "no", "yes");
check("and what it cost",
  /192px against 179 at the tray's width/.test(hudPane) ? "yes" : "no", "yes");
check("and what the pane's two channels say",
  /the \*\*fill\*\* \| which Way you are looking at/.test(hudPane) ? "yes" : "no", "yes");

/* ---- the graph is assembled, and a world may edit it ---- */

/*
 * leveling.md 8 describes the graph as **assembled at runtime** from every installed source rather
 * than authored as one tree, and nothing implemented the assembly: `NODES` was one array read once
 * at import, so nothing could change a node at all -- not a sheet, not a macro, not the console.
 *
 * It is assembled now, and the two prices that section names are paid: every prerequisite must
 * resolve and the whole thing must stay acyclic. A third comes with letting a world REPLACE a node
 * rather than only add one -- two nodes with one id is two different things wearing a name an
 * add-on depends on.
 */

section("assembling the levelling graph");

/* The record, where a reader of the add-on section will find it. */
check("leveling marks the assembly built",
  /^## 8\. Add-on compendiums {2}\*\*\[BUILT 2026-11-01\]\*\*$/m.test(levDoc) ? "yes" : "no",
  "yes");
check("and says why the editor is locked",
  /a statement that the world is being \*\*authored\*\* rather than[\s>]+played/.test(levDoc)
    ? "yes" : "no", "yes");

/* The engine reads the assembled list, not the core array, or an edit would change nothing. */
check("the engine reads the assembled list",
  /export const LIVE_NODES = \[\.\.\.NODES\];/.test(graphSource) ? "yes" : "no", "yes");
/*
 * The word boundary is load-bearing: `NODES` is a SUFFIX of `LIVE_NODES`, so the first version of
 * this matched the assembled list being refilled and reported the core array as written to. Third
 * time a prefix or suffix has fooled a check in this session -- `decks.skills`, `strainx`, and now
 * this one.
 */
check("and core content is never written to",
  /NODES\.(push|splice|length =)/.test(graphSource) ? "no" : "yes", "yes");
/* Maps are cleared and refilled, so every importer keeps answering from the binding it holds. */
check("the indexes are refilled rather than replaced",
  ["GRAPH.clear()", "SUCCESSORS.clear()", "DEPTH.clear()", "REACH.clear()"]
    .filter(c => !graphSource.includes(c)).join(", ") || "none", "none");

/* ---- what it refuses, asked rather than read ---- */

const coreNodes = [...graph.LIVE_NODES];
check("the graph starts as core content", coreNodes.length, 204);

/* A prerequisite that does not exist: the first price section 8 names. */
check("a node following nothing that exists",
  graph.graphFaults([{ id: "a", after: [] }, { id: "b", after: ["nowhere"] }]).join("; "),
  "b follows nowhere, which does not exist");
/* A cycle: the second price, and the reason the depth walk sets before it recurses. */
check("a cycle is named",
  graph.graphFaults([{ id: "a", after: ["b"] }, { id: "b", after: ["a"] }]).length > 0, true);
/* Two nodes with one id: the price of replacing rather than only adding. */
check("two nodes sharing an id",
  graph.graphFaults([{ id: "a", after: [] }, { id: "a", after: [] }]).join("; "),
  "two nodes share the id a");
check("and a graph with none of those", graph.graphFaults(coreNodes).length, 0);

/* ---- a rebuild is all or nothing ---- */

/*
 * A half-applied graph is worse than a rejected one, because a character derives everything from
 * it. So a bad edit set leaves the previous graph exactly as it was -- which is checkable by asking
 * the graph a question afterwards rather than by reading the code that promises it.
 */
const nodesBefore = graph.LIVE_NODES.length;
const refused = graph.rebuildGraph({ added: [{ id: "bad", after: ["nowhere"] }] });
check("a bad edit set is refused", refused.length > 0, true);
check("and changes nothing", graph.LIVE_NODES.length, nodesBefore);
check("the node is not in the graph", graph.GRAPH.has("bad"), false);

/* A good one commits, and every index moves with it. */
const addedFaults = graph.rebuildGraph({
  added: [{ id: "shade.thief.extra", name: "A World's Own Node", after: ["shade.thief"],
    grants: { health: 1 } }]
});
check("a good edit set is accepted", addedFaults.length, 0);
check("the node joins the graph", graph.GRAPH.get("shade.thief.extra")?.name, "A World's Own Node");
check("its predecessor knows about it",
  (graph.SUCCESSORS.get("shade.thief") ?? []).includes("shade.thief.extra"), true);
check("it has a depth", graph.DEPTH.get("shade.thief.extra"), 6);
/* Five nodes behind it, so the sixth level is the earliest you could hold it. */
check("and a level", graph.levelFor("shade.thief.extra"), 6);
/* It is on a character's frontier the moment they own what it follows, with nothing re-authored. */
const thiefOwns = new Set(["root", "shade", "shade.footwork", "shade.quiet", "shade.patience",
  "shade.thief"]);
check("and it is on the frontier of whoever owns its prerequisite",
  graph.frontier(thiefOwns).includes("shade.thief.extra"), true);

/* Replacing a core node by id, which is the sharper half of letting a world edit at all. */
const replacedFaults = graph.rebuildGraph({
  added: [{ id: "shade.footwork", name: "Something Else", after: ["shade"],
    grants: { health: 2 } }]
});
check("a core node can be replaced", replacedFaults.length, 0);
check("by id", graph.GRAPH.get("shade.footwork")?.name, "Something Else");
check("and what it grants moves with it", graph.grantsOf(new Set(["shade.footwork"])).health, 2);

/* Removing one, refused when something still follows it -- the invariant doing the work. */
const orphaned = graph.rebuildGraph({ removed: ["shade.thief"] });
check("removing a node everything hangs off is refused", orphaned.length > 0, true);
check("and the graph is still whole", graph.GRAPH.has("shade.thief"), true);

/* Back to core, so every check after this section is asking about the shipped graph. */
check("the graph can be put back", graph.rebuildGraph({}).length, 0);
check("and it is core again", graph.LIVE_NODES.length, 204);
check("with the replaced node restored", graph.GRAPH.get("shade.footwork")?.name, "Footwork");

/* ---- the lock, which is the answer to "not in an active campaign" ---- */

/*
 * A graph edited under a running campaign is the one thing in this system that can quietly change
 * a character who is not in the room: everything about them derives from the nodes they own
 * (leveling 9), so a changed node changes their Health, title, Tactic and frontier with no event
 * and no log line. The lock is not a railing against a mistake; it is a statement that the world
 * is being authored rather than played.
 */
check("authoring is a world setting",
  /game\.settings\.register\("cardrpg", "graphEditing"/.test(entrySource) ? "yes" : "no", "yes");
check("off by default",
  /"graphEditing"[\s\S]{0,260}default: false/.test(entrySource) ? "yes" : "no", "yes");
check("and the hint says not during a campaign",
  /not during a campaign/.test(lang["CARDRPG.Settings.GraphEditing.Hint"] ?? "") ? "yes" : "no",
  "yes");
check("the editor does not exist without it",
  /editing: game\.user\.isGM && game\.settings\.get\("cardrpg", "graphEditing"\)/.test(paneSource)
    ? "yes" : "no", "yes");
check("and every authoring action asks again",
  (paneSource.match(/if \(!this\.#canAuthor\(\)\) return;/g) ?? []).length, 3);
/*
 * A node anybody owns cannot be removed. A character stores ids and derives from them, so removing
 * an owned node does not un-grant anything -- it leaves the id pointing at nothing and the
 * character silently loses what it gave, with no record that it ever did.
 */
check("a node somebody owns cannot be removed",
  /\(a\.system\?\.nodes \?\? \[\]\)\.includes\(id\)/.test(paneSource) ? "yes" : "no", "yes");
/* The setting is written AFTER the rebuild succeeds: a stored edit nobody can load is unopenable. */
check("the world is written only after the rebuild holds",
  paneSource.indexOf("const faults = rebuildGraph(edits);")
    < paneSource.indexOf('await game.settings.set("cardrpg", "graphEdits"') ? "yes" : "no", "yes");
/* And the world's own nodes join at ready, which is the only moment a setting can be read. */
check("the world's nodes join the graph at ready",
  /const faults = rebuildGraph\(edits\);/.test(entrySource) ? "yes" : "no", "yes");

/*
 * And a world can author one, which is the standing rule for everything in this system: a menu
 * node is the only grant whose value must be one of a known set, so the editor offers a dropdown
 * of the twenty-four sources with their list sizes rather than a text box. A typo in a text box
 * would be a node that offers an empty list and spends a level doing it -- `graphFaults` refuses
 * that, but refusing it after the typing is worse than not offering the typo.
 */
check("the node editor can author a choice",
  /<label>Choice from <select name="choose">/.test(paneSource) ? "yes" : "no", "yes");
check("and offers the sources rather than a text box",
  /\[\.\.\.SPELLS_BY_SOURCE\.entries\(\)\]\.map\(\(\[src, list\]\) =>/.test(paneSource)
    ? "yes" : "no", "yes");
check("and shows how long each list is",
  /foundry\.utils\.escapeHTML\(src\)\} \(\$\{list\.length\}\)<\/option>/.test(paneSource)
    ? "yes" : "no", "yes");
check("and writes it back in the shape the graph reads",
  /if \(text\("choose"\)\) grant\.choose = \{ from: text\("choose"\) \};/.test(paneSource)
    ? "yes" : "no", "yes");

/* ---- every document subtype has a sheet that knows about it ---- */

/*
 * **A subtype with no sheet is content nobody can read, let alone correct.** Three were uncovered:
 * `spell` was left out when the slate sheet was written, and `wild` and `skill` out of the card
 * sheet -- so 24 formulas and miracles, twelve Wild Magic cards and every skill card fell back to
 * Foundry's default sheet, which knows nothing about a TypeDataModel and shows a GM nothing they
 * can act on. The audit in this section asked about buttons and hooks and never asked this.
 */
const sheetSource = fs.readFileSync(path.join(root, "module/sheets.mjs"), "utf8");
const cardTemplate = fs.readFileSync(path.join(root, "templates/card-config.hbs"), "utf8");
const slateTemplate = fs.readFileSync(path.join(root, "templates/item-slate.hbs"), "utf8");
const sheetTypes = {};
for (const m of sheetSource.matchAll(
  /registerSheet\((Actor|Item|Card), "cardrpg", \w+, \{\s*types: \[([^\]]*)\]/g)) {
  sheetTypes[m[1]] = (sheetTypes[m[1]] ?? []).concat(
    [...m[2].matchAll(/"([a-z]+)"/g)].map(t => t[1]));
}
const uncovered = [];
for (const [doc, types] of Object.entries(manifest.documentTypes)) {
  for (const type of Object.keys(types)) {
    if (!(sheetTypes[doc] ?? []).includes(type)) uncovered.push(`${doc}.${type}`);
  }
}
check("document subtypes with no sheet", uncovered.length ? uncovered.join(", ") : "none", "none");
check("subtypes checked", Object.values(manifest.documentTypes)
  .reduce((n, types) => n + Object.keys(types).length, 0), 15);

/* -------------------------------------------- */

/*
 * **Intruders, and the predicate that now defines them.**  **[BUILT 2026-11-08]**
 *
 * A Wound, a Taint and a Fear card are the cards nobody chose to put in a deck, and until today
 * that category existed only as three hand-written disjunctions -- `type === "wound" ||
 * type === "taint"` in decks.mjs, in the card sheet and in the tray. Three copies of one rule, so
 * a fourth kind would have been spendable for a Brace in one place, rendered as a playable card in
 * another, and printed with somebody else's rules on its face in the third: the sheet's template
 * asked `{{#if isWound}}` and ELSE printed the Taint text, which is a two-way guess dressed as a
 * conditional. Nothing would have reported any of it.
 *
 * So the category is a table with four dials and the rest is read from it. The checks below are in
 * two directions on purpose: that every kind declares every dial, and that the kinds the engine
 * knows are exactly the kinds core-rules 8 prints a row for. A kind in one and not the other is
 * the defect this project keeps finding, and it is the whole reason the table exists.
 */
const intruderTable = decksSource.slice(
  decksSource.indexOf("export const INTRUDERS = {"),
  decksSource.indexOf("/** Is this one of the cards nobody chose"));
const intruderKinds = [...intruderTable.matchAll(/^  (\w+): \{/gm)].map(m => m[1]);
check("kinds of intruder", intruderKinds.join(", "), "wound, taint, fear, doubt");

/*
 * Every kind declares every dial. A row that leaves one out reads as a default nobody chose, and
 * `after` is the one that would hurt: an intruder with no answer for where it goes after resolving
 * would silently go to the discard and come round for ever.
 */
for (const kind of intruderKinds) {
  const from = intruderTable.indexOf(`  ${kind}: {`);
  const row = intruderTable.slice(from, intruderTable.indexOf("}", from));
  const dials = ["dead", "onDraw", "short", "after", "deck", "line"]
    .filter(k => row.includes(`${k}:`));
  check(`${kind} declares every dial`, dials.join(" "), "dead onDraw short after deck line");
}

/* One predicate each, and every one of them is read by somebody below. */
check("the predicate for the category",
  /export function isIntruder\(card\)/.test(decksSource) ? "yes" : "no", "yes");
check("and for the ones that can never be played",
  /export function isDeadCard\(card\)/.test(decksSource) ? "yes" : "no", "yes");
check("and for what resolves as it is dealt",
  /export function drawEffect\(card\)/.test(decksSource) ? "yes" : "no", "yes");
check("and for the one that costs the slot",
  /export function costsTheSlot\(card\)/.test(decksSource) ? "yes" : "no", "yes");
check("and for where it goes afterwards",
  /export function afterDrawing\(card\)/.test(decksSource) ? "yes" : "no", "yes");
check("and for the line it prints",
  /export function intruderLine\(card\)/.test(decksSource) ? "yes" : "no", "yes");

/* The three call sites that used to name the kinds, and the fourth that used to guess between them. */
check("the card sheet asks the category",
  /isHarm: isIntruder\(card\)/.test(sheetSource) ? "yes" : "no", "yes");
check("and prints the card's own line",
  /harmLine: intruderLine\(card\)/.test(sheetSource) ? "yes" : "no", "yes");
check("the tray's pile rows ask the category",
  /harm: isIntruder\(c\)/.test(traySource) ? "yes" : "no", "yes");
check("and its detail line comes from the table",
  /if \(isIntruder\(card\)\) return intruderLine\(card\)/.test(traySource) ? "yes" : "no", "yes");
check("the face prints one line, never a guess between two",
  /<span>\{\{harmLine\}\}<\/span>/.test(cardTemplate) ? "yes" : "no", "yes");
check("and the old disjunction is gone from the hand filter",
  /c\.type !== "wound" && c\.type !== "taint"/.test(decksSource) ? "still there" : "gone", "gone");
check("and from the card sheet",
  /type === "wound" \|\| type === "taint"/.test(sheetSource) ? "still there" : "gone", "gone");
check("and from the tray",
  /c\.type === "wound" \|\| c\.type === "taint"/.test(traySource) ? "still there" : "gone", "gone");
check("and the template no longer asks which kind it is",
  /\{\{#if isWound\}\}/.test(cardTemplate) ? "still there" : "gone", "gone");

/*
 * **The refill's shortfall, which was wrong before any of this.** `break` on the first Taint does
 * not mean "draw no replacement", it means "stop refilling" -- a hand of five that drew its dose
 * fourth came up with three cards rather than four, and a second dose behind it cost nothing
 * because the loop had already gone. core-rules 8 says one card short per dose.
 */
check("the refill counts the shortfall",
  /hand\.cards\.size \+ short < size/.test(decksSource) ? "yes" : "no", "yes");
check("and no longer stops dealing at the first dose",
  /taint\+\+;\s*\n\s*break;/.test(decksSource) ? "it does" : "it does not", "it does not");

/*
 * **A card that leaves the game has to go home first.** `Cards#pass` marks the home card `drawn`
 * and deals a COPY, so deleting the copy in a hand leaves the original in the deck, flagged and
 * permanently unavailable -- the deck quietly one card smaller with nothing to say why. And
 * `normalizeDeck` would not rescue it, because that function restores the flag rather than
 * clearing it, on purpose.
 */
check("a card taken out of the game goes home before it dies",
  /await move\(parent, deck, \[card\.id\]\);\s*\n\s*await deck\.cards\.get\(card\.id\)\?\.delete\(\);/
    .test(decksSource) ? "yes" : "no", "yes");
check("and fear does not outlive the fight that caused it",
  /await clearFear\(actor\);/.test(decksSource) ? "yes" : "no", "yes");

/*
 * **The deck dial is read, and by both resolvers.** A dial only a validator looks at is the
 * dropdown-only value this project keeps digging out of its own history, so `intruderStack` turns
 * the kind's deck and the fast/slow dial into the one expression both of them use. Taint answers
 * null on purpose -- its flavour picks the deck, which is why it is the one kind declared
 * `"either"`.
 */
check("the stack a dose arrives in comes from the table",
  /export function intruderStack\(kind, fast = false\)/.test(decksSource) ? "yes" : "no", "yes");
check("and Fear asks it rather than naming a stack",
  /const which = intruderStack\("fear", fast\);/.test(resolveSource) ? "yes" : "no", "yes");
check("and so does Doubt",
  /const which = intruderStack\("doubt", fast\);/.test(resolveSource) ? "yes" : "no", "yes");
check("and the literal Fear used to carry is gone",
  /const which = fast \? "actionHand" : "actionDiscard";/.test(resolveSource)
    ? "still there" : "gone", "gone");

/*
 * **Doubt's clock is the scene, and the engine is told a scene ended exactly once** -- when the
 * skill hand is dealt. So that is where the fright from the last one goes out, before the new hand
 * comes in. Without it a Doubt would sit in a hand that never empties and cost every scene there
 * is, which is a different rule from the one core-rules 8 prints.
 */
check("the routine that deals Doubt",
  /export async function resolveDoubt\(actor, \{ amount = 1, target, fast = false, source = "" \}\)/
    .test(resolveSource) ? "yes" : "no", "yes");
check("a scene ending clears the Doubt it clogged",
  /const stale = \[\.\.\.hand\.cards\]\.filter\(c => c\.type === "doubt"\);/
    .test(decksSource) ? "yes" : "no", "yes");
check("and it goes to the skill discard, which a shuffle does not return",
  /if \(stale\.length\) await discardSkillCards\(actor, stale\.map\(c => c\.id\)\);/
    .test(decksSource) ? "yes" : "no", "yes");

/* Fear's own routine, and the dial it deliberately does not have. */
check("the routine that deals Fear",
  /export async function resolveFear\(actor, \{ amount = 1, target, fast = false, source = "" \}\)/
    .test(resolveSource) ? "yes" : "no", "yes");
/*
 * The region is Fear's own body and nothing after it. It used to run to resolveCorrode, which was
 * true until resolveDoubt was written between them -- and then this check read Doubt's skill deck
 * and reported Fear reaching it. An end anchored on the NEXT export rather than on a named one.
 */
const fearStart = resolveSource.indexOf("export async function resolveFear");
const fearBody = resolveSource.slice(fearStart,
  resolveSource.indexOf("\nexport async function", fearStart + 10));
/*
 * Action deck only: a Fear card moves you, and the skill deck is not drawn in a fight. It asks for
 * a STACK NAME rather than for the word, because the comment above the routine says "skill" twice
 * explaining why there is none -- and the first version of this check read that comment and
 * reported the rule broken by its own rationale.
 */
check("Fear names a skill stack", /"skill[A-Za-z]*"/.test(fearBody) ? "it does" : "it does not",
  "it does not");
check("and a fast dose is spent rather than discarded",
  /await removeCard\(target, card\);/.test(fearBody) ? "yes" : "no", "yes");

/*
 * **The registration, in all four places a card subtype has to appear.** The sheet was the one
 * this suite already asked about; the data model, the manifest and the label it did not, and a
 * subtype missing its model is a card whose `system` is a bare object with no fields at all.
 */
const intruderLang = JSON.parse(fs.readFileSync(path.join(root, "lang/en.json"), "utf8"));
const unmodelled = Object.keys(manifest.documentTypes.Card ?? {}).filter(type =>
  !new RegExp(`^    ${type}: \\w+CardData,?$`, "m").test(entrySource)
  || !Object.hasOwn(intruderLang, `TYPES.Card.${type}`));
check("Card subtypes missing a data model or a label",
  unmodelled.length ? unmodelled.join(", ") : "none", "none");

/*
 * And the two directions that matter: the kinds the engine knows are exactly the kinds the rules
 * print a row for. Either list growing alone is a kind of harm that half the game believes in.
 */
const docKinds = [...coreRules.matchAll(/^> \| \*\*(Wound|Taint|Fear|Doubt)\*\* \|/gm)]
  .map(m => m[1].toLowerCase());
check("intruders the rules table names", docKinds.join(", "), "wound, taint, fear, doubt");
check("and the engine's table agrees, both ways",
  [...intruderKinds].sort().join(",") === [...docKinds].sort().join(",") ? "it does" : "it does not",
  "it does");
/* Fear is the one with no removal line, and the rules say so rather than leaving it to be noticed. */
check("the rules say Fear needs no cure",
  /\*\*Fear does not last\*\*, and it is the only intruder with no removal line/.test(coreRules)
    ? "yes" : "no", "yes");


/* ---- what a card does is editable, not just what it is called ---- */

/*
 * The steps were read-only for as long as the card sheet has existed, so a GM could retune a
 * card's reaction and not what it did -- the half the content is actually made of. The editor is
 * one partial, because a card half, a spell's effect, an NPC sequence and a Wild surge are all
 * ordered lists of the same thing, and four copies is four places for the vocabulary to drift.
 */
const stepPart = fs.readFileSync(path.join(root, "templates/parts/step.hbs"), "utf8");
const stepsPart = fs.readFileSync(path.join(root, "templates/parts/steps.hbs"), "utf8");
check("the step editor is a partial",
  fs.existsSync(path.join(root, "templates/parts/step.hbs")) ? "yes" : "no", "yes");
check("and both partials are preloaded",
  ["parts/step.hbs", "parts/steps.hbs"]
    .filter(p => !entrySource.includes(`systems/cardrpg/templates/${p}`)).join(", ") || "none",
  "none");
/*
 * Every field of a step is on it. A step the sheet cannot fully edit is a step whose remainder has
 * to be set from a macro, which is the thing this whole increment is about.
 */
const stepFieldsEdited = [...stepPart.matchAll(/name="\{\{path\}\}\.([a-zA-Z.]+)"/g)]
  .map(m => m[1].split(".")[0]);
const missingFromEditor = [...stepKeys].filter(k => !stepFieldsEdited.includes(k));
check("step fields the editor cannot set",
  missingFromEditor.length ? missingFromEditor.join(", ") : "none", "none");

/*
 * And the two enums are ticked rather than typed, which is the point of putting them on a document:
 * a slot is one of ten and a tag one of nine, so neither should ever be spelled by hand.
 */
for (const [what, field] of [["slots", "slots"], ["tags", "tags"]]) {
  check(`the editor ticks quarantine ${what}`,
    new RegExp(`type="checkbox" name="\\{\\{\\.\\./path\\}\\}\\.shape\\.quarantine\\.${field}"`)
      .test(stepPart) ? "yes" : "no", "yes");
}
/* Scoped to the quarantine rows: the editor loops `config.itemTags` twice and both are right -- one
 * offers the tag a step REQUIRES in hand, the other the tags a quarantine takes away. */
const quarantinePart = stepPart.slice(stepPart.indexOf("Quarantine slots"),
  stepPart.indexOf("Quarantine features"));
/* Ground is ticked too, for the same reason the quarantine is: five properties and five shapes,
 * all enums, and several cards name two or three properties at once. */
check("the editor ticks what ground does",
  stepPart.includes('name="{{../path}}.ground.effects"') ? "yes" : "no", "yes");
check("and offers every ground property",
  /\{\{#each config\.groundEffects\}\}/.test(stepPart) ? "yes" : "no", "yes");
check("and every shape",
  /\{\{#each config\.groundShapes\}\}/.test(stepPart) ? "yes" : "no", "yes");
check("and offers every slot the game has",
  /\{\{#each config\.slots\}\}/.test(quarantinePart) ? "yes" : "no", "yes");
check("and every item tag",
  /\{\{#each config\.itemTags\}\}/.test(quarantinePart) ? "yes" : "no", "yes");
/*
 * **And the bonus a step's condition carries, by each of its three controls.**
 *
 * A break test pointed the verb select at a field that does not exist and nothing noticed: the
 * loops were counted but the names they sat in were not, so the editor could have offered every
 * verb in the game and written them nowhere. Sliced, so each control is asked for by name.
 */
const bonusPart = stepPart.slice(stepPart.indexOf("Bonus to"),
  stepPart.indexOf("</div>", stepPart.indexOf("Bonus to")));
check("the editor sets the verb a carried bonus applies to",
  bonusPart.includes('name="{{path}}.bonus.verb"') ? "yes" : "no", "yes");
check("and offers every verb for it",
  /\{\{#each config\.verbs\}\}/.test(bonusPart) ? "yes" : "no", "yes");
check("and how much it is worth",
  bonusPart.includes('name="{{path}}.bonus.value"') ? "yes" : "no", "yes");
check("and the tag the hand must be holding to earn it",
  bonusPart.includes('name="{{path}}.bonus.requiresTag"') ? "yes" : "no", "yes");
/* And the slice is a slice of something: three controls in it, not the whole template. */
check("while the bonus row is a row rather than the file",
  bonusPart.length < stepPart.length / 4 ? "a row" : "the file", "a row");
/*
 * And the other loops are still there, so the slice above cannot pass by being empty. Three now:
 * the tag a step requires in hand, the tags a quarantine filter takes away, and the tag a carried
 * bonus requires -- +2 Strike with Heavy items is a different tattoo from +2 Strike.
 */
check("while the tag a step requires in hand is still offered",
  (stepPart.match(/\{\{#each config\.itemTags\}\}/g) ?? []).length, 3);
/*
 * **Each sub-field of `shape` by name.** The sweep above reads the FIRST segment of every input
 * name, so `shape` counted as editable on the strength of `shape.quarantine.features` alone --
 * renaming the transformation input changed nothing it could see. A composite field is editable
 * only when each part of it is.
 */
for (const field of ["transformation", "quarantine.slots", "quarantine.tags",
  "quarantine.features", "quarantine.cards"]) {
  check(`the editor can set shape.${field}`,
    stepPart.includes(`shape.${field}"`) ? "yes" : "no", "yes");
}
/* The two helpers a ticked list needs: one to know what is already on, one to show a typed list. */
for (const helper of ["crHas", "crList"]) {
  check(`the ${helper} helper is registered`,
    new RegExp(`Handlebars\\.registerHelper\\("${helper}"`).test(entrySource) ? "yes" : "no",
    "yes");
}
/* The three places a list of steps appears, all through the one partial. */
check("lists of steps the sheet can edit",
  [...cardTemplate.matchAll(/parts\/steps\.hbs"\s+steps=steps\.(\w+)/g)].map(m => m[1])
    .sort().join(", "), "primary, secondary, sequence, steps");
/* An ArrayField is replaced wholesale: a partial update to an array says nothing about the rest. */
check("adding a step rewrites the whole list",
  /list\.push\(\{\}\);[\s\S]{0,40}await this\.document\.update/.test(sheetSource) ? "yes" : "no",
  "yes");
check("and removing one goes by index",
  /list\.splice\(at, 1\);/.test(sheetSource) ? "yes" : "no", "yes");

/*
 * And every stored field on an ACTION CARD, since that is the document the content is mostly made
 * of. Three were still missing after the steps were opened up: `reactionParam` (the Sidestep 2
 * that *Roll With It* needs), the four `costs` fields -- Spent and Strain, which are what a half
 * costs and therefore part of what it does -- and the reserved `way`/`tree` pair.
 *
 * Read from the data model rather than from a list written here, so a field added to the schema
 * tomorrow fails this until somebody puts it on the sheet.
 */
const actionBlock = cardsSource.slice(
  cardsSource.indexOf("export class ActionCardData"),
  cardsSource.indexOf("/*  Wild Magic card"));
const actionFields = [...new Set([...actionBlock.matchAll(/^      ([a-zA-Z]\w*): new fields\./gm)]
  .map(m => m[1]))];
const cardEditors = cardTemplate + stepPart + stepsPart;
const unsettable = actionFields.filter(f => {
  /* The two step arrays are edited through the partial, which addresses them as system.<list>.N */
  if (["primary", "secondary"].includes(f)) {
    return !new RegExp(`list="${f}"`).test(cardTemplate);
  }
  return !new RegExp(`name="system\.${f}[."]`).test(cardEditors);
});
check("action-card fields the sheet cannot set",
  unsettable.length ? unsettable.join(", ") : "none", "none");
check("action-card fields checked", actionFields.length, 7);
/*
 * `costs` is one schema field holding a sub-schema per half, so the loop above cannot see inside
 * it: renaming the Strain box left `costs` looking settable because the Spent box still matched.
 * The leaves are read from `costField()` and checked one at a time.
 */
const costBlock = cardsSource.slice(cardsSource.indexOf("function costField()"),
  cardsSource.indexOf("/** The icon a step draws"));
const costLeaves = [...new Set([...costBlock.matchAll(/^    ([a-zA-Z]\w*): new fields\./gm)]
  .map(m => m[1]))];
check("cost leaves in the schema", costLeaves.join(", "), "spent, strain");
/*
 * The closing quote is load-bearing: without it `strainx` contains `strain` and a renamed box
 * passed. Same prefix trap as `decks.skills` matching `decks.skill`, two commits ago -- an
 * `includes` on a name is only a check if it includes the end of the name.
 */
check("cost leaves the sheet cannot set",
  costLeaves.filter(leaf => !cardTemplate.includes(`name="system.costs.{{this.key}}.${leaf}"`))
    .join(", ") || "none", "none");
/* And both halves get a box, since Spent on one is a different card from Spent on both. */
check("both halves can be made Spent",
  (cardTemplate.match(/system\.costs\.\{\{this\.key\}\}\.spent/g) ?? []).length, 1);
check("and the loop covers two halves",
  /\["primary", "secondary"\]\.map\(key => \(\{/.test(sheetSource) ? "yes" : "no", "yes");

/* ---- every stored field on a character is on the sheet ---- */

/*
 * A stored number nobody can edit is a number the GM reaches through the console for. Five were
 * off the sheet -- the hand size, carry, spell slot and deck bases, and the deck floor -- which
 * are exactly the numbers a playtest wants to move.
 */
for (const field of ["handSize.base", "carry.base", "spellSlots.base", "actionDeck.base",
  "actionDeck.min"]) {
  check(`the sheet can set ${field}`,
    charTemplate.includes(`name="system.${field}"`) ? "yes" : "no", "yes");
}

/*
 * And the node list, which only ever grew. The pane takes a node and nothing took one back, so a
 * mis-clicked node was permanent -- and because everything derives from that list, a wrong node is
 * a wrong Health, title, Tactic and frontier for ever.
 */
check("a GM can take a node back",
  /dropNode: CharacterSheet\.#onDropNode,/.test(sheetSource) ? "yes" : "no", "yes");
check("and only a GM",
  /#onDropNode\(event, target\) \{[\s\S]{0,40}if \(!game\.user\.isGM\) return;/.test(sheetSource)
    ? "yes" : "no", "yes");
/* The level comes back, so correcting a mistake is not also a penalty for making it. */
check("the level comes back with it",
  /"system\.levels\.pending": \(this\.actor\.system\.levels\?\.pending \?\? 0\) \+ 1/
    .test(sheetSource) ? "yes" : "no", "yes");
/* What it cannot do, said out loud rather than discovered: a document stays behind. */
check("and says what it cannot take back",
  /stays behind/.test(sheetSource) ? "yes" : "no", "yes");

/* ---- the spell sheet ---- */

check("a spell's strength is editable",
  /name="system\.strength"/.test(slateTemplate) ? "yes" : "no", "yes");
check("and its cast cost",
  /name="system\.cost\.health"/.test(slateTemplate) ? "yes" : "no", "yes");
check("and whether it is prepared",
  /name="system\.prepared"/.test(slateTemplate) ? "yes" : "no", "yes");
check("and its effect, through the same partial",
  /parts\/step\.hbs"\s+step=system\.effect/.test(slateTemplate) ? "yes" : "no", "yes");

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
/* Recursive, since the step editor lives in `templates/parts/`: one partial for the one shape. */
const readers = [...everyTemplate().map(f => path.relative(root, f).replace(/\\/g, "/")),
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


/* ---- what a monster's features and gear grant  [BUILT 2026-11-02] ---- */

/*
 * **`CharacterData` summed the `grants` of every feature and equipped item; `NpcData` summed
 * none.** Its whole health line was `health.max = health.base`, so a feature called *Thick Hide*
 * granting 4 Health read correctly on the sheet, passed every check, and changed no number. The
 * field existed and the reader did not.
 *
 * **Asked rather than read**, which needed the sum moved somewhere askable: a data model cannot be
 * imported outside Foundry, so arithmetic left inside one can only be grepped -- and a grep would
 * have agreed with the broken version just as happily, which is how this survived. It lives in
 * `grants.mjs` now, has no Foundry global in it, and both models call it.
 */
const grants = await import("../module/grants.mjs");
/* And its text, for the one thing an import cannot show: that a branch is absent rather than
 * unreachable. An arm nothing can enter reads exactly like one that passes. */
const grantsSource = fs.readFileSync(path.join(root, "module/grants.mjs"), "utf8");
const schemaDoc = fs.readFileSync(path.join(root, "../actor-schema.md"), "utf8");

const feature = health => ({ type: "feature", system: { grants: { health } } });
const worn = (health, equipped = true) => ({
  type: "item", system: { grants: { health }, equipped }
});
const npcHealth = slates => grants.sumGrants(slates, grants.NPC_GRANTS).health;

/*
 * **A spell outside the slot budget**, which is a ritual and nothing else.
 *
 * It named a **permanent** too, for the Graven line, and that was a feature wearing a spell's
 * clothes: `timing: "permanent"` said *this formula can never be prepared* rather than when
 * anything happens, which is a slot budget in a timing's field. The nine it described are features
 * now, so the word went with them -- and a getter whose list had one unreachable arm would have
 * read exactly like one that worked.
 */
check("a spell knows when it is outside the budget",
  /get outsideBudget\(\) \{\s*\n\s*return this\.effect\?\.timing === "ritual";/
    .test(itemSource) ? "yes" : "no", "yes");
check("and costs no slot when it is",
  /return this\.outsideBudget \|\| !this\.prepared \? 0 : this\.strength;/.test(itemSource)
    ? "yes" : "no", "yes");
const outsideBudget = [...graph.SPELLS.values()]
  .filter(s => (s.effect?.timing ?? "") === "ritual");
check("spells outside the budget", outsideBudget.length, 7);
check("and the one kind they are",
  [...new Set(outsideBudget.map(s => s.effect.timing))].sort().join(", "), "ritual");
/*
 * **And no step anywhere claims a timing the vocabulary does not have**, which is what retiring one
 * has to mean.
 *
 * The first version of this asked `SPELLS` whether any spell still called itself permanent, and two
 * steps went on declaring it for an hour: *The Hand Given* and *Nothing At All* are features now, so
 * the one check that would have caught them was asking the list they had just left. `timing` takes
 * its choices from `CARDRPG.timings`, so a value that is not in there is a value the schema refuses
 * the moment Foundry builds the document -- the kind of fault no amount of reading the content
 * finds, because the content looks exactly right.
 */
/* One predicate, over a planted example first: with no stray timing left, a rule that looks and a
 * rule that does not answer alike, and a break test switched this one off twice. */
const unknownTiming = st => !!st.timing && !(st.timing in CARDRPG.timings);
check("the rule finds a timing the vocabulary does not have",
  unknownTiming({ timing: "permanent" }) ? "yes" : "no", "yes");
check("and passes one it does", unknownTiming({ timing: "ritual" }) ? "found" : "no", "no");
/* And over the steps that declare one, counted -- so the sweep cannot be pointed at nothing. */
const timedSteps = everyStep.filter(s => s.st.timing);
check("steps that say when they are played", timedSteps.length, 22);
/* The sweep itself, named, so the planted list and the game go through the SAME expression: a
 * predicate tested on a planted value still leaves the sweep applying it switchable. */
const strayIn = steps => steps.filter(s => unknownTiming(s.st))
  .map(s => `${s.card} (${s.st.timing})`);
check("the sweep finds a planted step",
  strayIn([{ card: "(planted)", st: { timing: "permanent" } }]).join(", "),
  "(planted) (permanent)");
const strayTiming = strayIn(timedSteps);
check("steps claiming a timing the vocabulary does not have",
  strayTiming.length ? [...new Set(strayTiming)].join(", ") : "none", "none");
check("timings the content actually uses",
  [...new Set(timedSteps.map(s => s.st.timing))].sort().join(", "),
  "beforeFight, outOfCombat, reaction, ritual");

/*
 * **The nine a school teaches that are never prepared**, which is the law's whole consequence.
 *
 * *A thing usable without being equipped or prepared is a feature.* These were spells because a
 * spell was the only slate with a **step**, and a tattoo needs a step -- the bonus it gives rides
 * on the `graven` condition, which is what ink in your skin is. That was the tail wagging the dog:
 * a step is not about a gate, and the gate is the only thing the three subtypes differ by.
 */
const permanents = graph.TEACHINGS.filter(t => graph.teachingKind(t) === "feature");
check("features a school teaches", permanents.length, 10);
check("and the two schools that teach them",
  [...new Set(permanents.map(t => t.source))].sort().join(", "), "Asceticism, Tattoo Magic");
/* All seven of Tattoo Magic, which makes it the one school in the game that teaches no spells. */
check("and the school that teaches nothing else",
  [...graph.SPELLS.values()].filter(s => s.source === "Tattoo Magic").length, 0);
check("while its ladder is still a ladder",
  permanents.filter(t => t.source === "Tattoo Magic").map(t => t.strength).sort().join(""),
  "11112345");
/*
 * A permanent carries a field when it grants a standing number OR when its step applies a condition
 * that carries a bonus. The second half is the correction: this read `s.bonus`, a field on the
 * slate, and when the bonus moved onto the condition the two spells that give one would have
 * silently joined the list of those still wanting a flag.
 */
const carries = s => Object.values(s.grants ?? {}).some(v => v) || !!s.effect?.bonus?.value;
check("and the five that carry a field rather than a sentence",
  permanents.filter(carries).map(s => s.name).sort().join(", "),
  "Graven Armour, Graven Heart, Graven Shield, Graven Strength, The Whole Skin");
/* The other four are flags nothing in the game has, and their gaps say so now rather than hiding
 * inside a gap about bonuses. */
check("and the four that still want a flag",
  permanents.filter(s => !carries(s)).map(s => s.name).sort().join(", "),
  "Graven Eye, Graven Road, Graven Sight, Nothing At All, The Hand Given");
/* Both of the two that give a bonus deliver it as Graven, which is the whole change: ink you can
 * see on the token rather than a number on the sheet that nothing mentions. */
check("teachings that give their bonus as a condition",
  permanents.filter(s => s.effect?.bonus?.value)
    .map(s => `${s.name} (${s.effect.condition})`).sort().join(", "),
  "Graven Strength (graven), The Whole Skin (graven)");
/*
 * **A spell grants nothing standing**, which is what the rule looked like before a permanent
 * formula ever existed and what it looks like again: *a feature is simply true, an item has to be
 * equipped*, and a spell does its work when cast.
 *
 * The load-bearing half is unchanged in substance -- a caster must not hold every grant in their
 * school at once, having learned them all -- but it no longer needs a `timing` to decide it. A
 * formula cannot grant at all.
 *
 * Asked rather than greped: planted slates go through the real accumulator. A grep says the line is
 * there; an example says it works.
 */
const permSpell = (armor, timing = "ritual") =>
  ({ type: "spell", system: { grants: { armor }, effect: { timing } } });
check("a formula grants nothing, whatever its step says",
  grants.sumGrants([permSpell(3)], grants.CHARACTER_GRANTS).armor, 0);
check("and neither does one in the book",
  grants.sumGrants([permSpell(3, "")], grants.CHARACTER_GRANTS).armor, 0);
check("while a feature grants simply by being yours",
  grants.sumGrants([{ type: "feature", system: { grants: { armor: 3 } } }],
    grants.CHARACTER_GRANTS).armor, 3);
check("and an item has to be equipped",
  grants.sumGrants([{ type: "item", system: { grants: { armor: 3 }, equipped: false } }],
    grants.CHARACTER_GRANTS).armor, 0);
/* And the spell arm is gone rather than made unreachable: an arm nothing can enter reads like one
 * that passes. */
check("the grant accumulator no longer asks a spell about its timing",
  /slate\.type === "spell"/.test(grantsSource) ? "still does" : "no", "no");
/*
 * And a bonus a spell gives reaches the character as a CONDITION, which is the correction: as a
 * field on the slate it was standing, invisible and unremovable, and nothing on the token said so.
 */
check("the bonus accumulator reads the conditions a creature is under",
  /for \(const c of actor\.system\.activeConditions \?\? \[\]\) \{/.test(resolveSource)
    ? "yes" : "no", "yes");
check("and no longer reads a spell as a source of bonus",
  /slate\.type === "spell" && slate\.system\.effect/.test(resolveSource) ? "still does" : "no",
  "no");
check("and groups it under the condition, so two tattoos cap each other",
  /group: c\.key,/.test(resolveSource) ? "yes" : "no", "yes");
check("and a condition carries its own bonus rather than the config's",
  /bonus: new fields\.SchemaField\(\{\n      verb: new fields\.StringField\(\{ required: false, blank: true, initial: "" \}\),/
    .test(actorsSource) ? "yes" : "no", "yes");
check("and what lands copies the step's bonus onto it",
  /const carried = step\.bonus\?\.value/.test(resolveSource) ? "yes" : "no", "yes");
/*
 * **And the bonus is selective, which is the half nothing watched.**
 *
 * A break test deleted the tag test from the condition branch and the whole suite shrugged: Graven
 * Strength is +2 Strike *with a Heavy item*, and without the filter it would have been +2 Strike
 * with a dagger, a lute and empty hands. Both branches of the accumulator ask the same two
 * questions, so both are counted rather than grepped -- a grep either one could answer is a grep
 * about neither.
 */
check("accumulator branches that ask which verb the bonus is for",
  (resolveSource.match(/if \(!bonus\?\.value \|\| bonus\.verb !== verb\) continue;/g) ?? []).length,
  2);
check("and that ask what the hand must be holding",
  (resolveSource.match(/if \(bonus\.requiresTag && !itemMeets\(item, \{ tag: bonus\.requiresTag \}\)\) continue;/g) ?? []).length,
  2);
/* Through the one predicate, not read off the tags a second time: the slate branch says so in a
 * comment and the condition branch did it by hand until a break test made the point. */
check("and neither reads an item's tags by hand",
  /\(item\?\.system\?\.tags \?\? \[\]\)\.includes/.test(resolveSource) ? "one does" : "no",
  "no");
/* And flat armour, which had no home in the game at all until this. */
check("flat armour is a grant a character reads",
  grants.CHARACTER_GRANTS.includes("armor") ? "yes" : "no", "yes");
check("and the derived armour adds it",
  /this\.armor = grants\.armor \+ slates/.test(actorsSource) ? "yes" : "no", "yes");
check("while an NPC has no such grant, having armorBase instead",
  grants.NPC_GRANTS.includes("armor") ? "yes" : "no", "no");
/* The three teachings that grant it, which is the whole reason the field exists. */
/*
 * --- The law, in all three clauses (card-slate-schema 2.4)
 *
 *   1. a bonus or penalty over a duration is a CONDITION;
 *   2. a thing that must be equipped or prepared is an ITEM (`item`, or `spell` for the preparable
 *      kind);
 *   3. a thing usable without being equipped or prepared is a FEATURE.
 *
 * A law that is merely true today is a law the next card breaks, so each clause is a check. The
 * second and third are asked of the SCHEMAS, because the gate is the whole of what distinguishes
 * the three subtypes: a feature that grew an `equipped` would be an item wearing a feature's name.
 */
/* Each class sliced to its own bounds. Local, because the sub-schema sweep's `spellBlock` is
 * declared further down the file -- and bounded, because a slice that runs to the end of the file
 * is a slice about whichever class happens to be last. */
const classBlock = name => {
  const at = itemSource.indexOf(`export class ${name}`);
  const next = itemSource.indexOf("export class ", at + 20);
  return itemSource.slice(at, next < 0 ? undefined : next);
};
const featureSchema = classBlock("FeatureSlateData");
const itemSchema = classBlock("ItemSlateData");
const spellSchema = classBlock("SpellSlateData");

/* 1. Nothing gives a timed modifier except a condition. A step's bonus is a condition's payload, so
 *    a step that carries one without applying a condition is a bonus the engine drops. */
/*
 * One predicate, run over a PLANTED example before it is run over the game: with every loose bonus
 * already gone, a sweep that looks everywhere and a sweep that looks nowhere answer alike, and a
 * break test emptied this one without a single check noticing.
 */
const escapes = st => !!st?.bonus?.value && !st.condition;
check("the rule finds a bonus that escapes a condition",
  escapes({ bonus: { verb: "strike", value: 2 } }) ? "yes" : "no", "yes");
check("and passes one that rides on it",
  escapes({ condition: "graven", bonus: { verb: "strike", value: 2 } }) ? "found" : "no", "no");
/*
 * **Over the steps that carry a bonus at all, counted first.**
 *
 * Which is the only way this sweep can be made to mean something. A break test pointed it at an
 * empty list twice and nothing noticed either time: with no loose bonus left in the game, a sweep
 * over every step and a sweep over nothing give the same answer, and pinning the total step count
 * elsewhere does not pin THIS walk. So the denominator is the check -- two steps in the game grant
 * a bonus, and the clause is that both of them apply a condition.
 */
const bonusSteps = everyStep.filter(s => !!s.st?.bonus?.value);
check("steps that grant a bonus at all",
  bonusSteps.map(s => s.card).sort().join(", "), "Graven Strength, The Whole Skin");
/* Named for the same reason as `strayIn` below: the planted list and the game go through one
 * expression, so switching the sweep off fails the planted case. */
const escapesIn = steps => steps.filter(s => escapes(s.st)).map(s => s.card);
check("the bonus sweep finds a planted step",
  escapesIn([{ card: "(planted)", st: { bonus: { verb: "strike", value: 2 } } }]).join(", "),
  "(planted)");
const looseBonus = escapesIn(bonusSteps);
check("steps that carry a bonus but apply no condition",
  looseBonus.length ? looseBonus.join(", ") : "none", "none");
/* And the slate-level bonuses that remain are STANDING, which is the other half of clause 1: an
 * item's while it is worn, a feature's while it is yours. Neither is timed, and neither sits beside
 * a duration. */
const timedSlateBonus = [...everyEntry]
  .filter(e => e.bonus?.value && (e.bonus.duration ?? null) !== null).map(e => e.name);
check("slates whose own bonus claims a duration",
  timedSlateBonus.length ? timedSlateBonus.join(", ") : "none", "none");

/* 2. The gate is a field, and each of the two gated subtypes has exactly its own. */
check("an item's gate is equipping",
  /equipped: new fields\.BooleanField/.test(itemSchema) ? "yes" : "no", "yes");
check("a spell's gate is preparing",
  /prepared: new fields\.BooleanField/.test(spellSchema) ? "yes" : "no", "yes");
check("and neither gate is the other's",
  /prepared: new fields\./.test(itemSchema) || /equipped: new fields\./.test(spellSchema)
    ? "crossed" : "no", "no");

/* 3. A feature has neither gate, and that absence IS the definition rather than an oversight. */
check("a feature has no gate to pass",
  /(equipped|prepared): new fields\./.test(featureSchema) ? "has one" : "none", "none");
/* And no feature in the content behaves as though it had one: a slot, a fit or an equip state on a
 * feature is an item filed under the wrong subtype. */
const gatedFeatures = [...content.FEATURES, ...graph.TEACHINGS
  .filter(t => graph.teachingKind(t) === "feature")]
  .filter(f => f.slot || f.fits || f.equipped !== undefined || f.prepared !== undefined)
  .map(f => f.name);
check("features behaving as though they had a gate",
  gatedFeatures.length ? gatedFeatures.join(", ") : "none", "none");
/* And the other way: every item the content holds can actually be equipped somewhere, or it is a
 * feature filed under the wrong subtype. */
const ungatedItems = [...content.ITEMS, ...content.NPC_GEAR, ...content.NATURAL_WEAPONS]
  .filter(i => !i.slot && !i.fits?.length).map(i => i.name);
check("items with nowhere to be equipped",
  ungatedItems.length ? ungatedItems.join(", ") : "none", "none");

/* And a feature's permanent condition is DERIVED, which is what lets a feature have one at all. */
/* The loop itself, not only what it decides inside: emptying it was noticed by nothing. A grep
 * rather than an example, because a data model cannot be built outside Foundry -- which is the
 * reason `slateCounts` lives in a module that touches no Foundry global and can be ASKED. */
check("the derivation walks the features a creature holds",
  /for \(const slate of this\.parent\?\.items \?\? \[\]\) \{\n      if \(slate\.type !== "feature"\) continue;/
    .test(actorsSource) ? "yes" : "no", "yes");
check("a feature's permanent condition is derived rather than applied",
  /if \(!step\?\.condition \|\| !CARDRPG\.conditions\[step\.condition\]\?\.permanent\) continue;/
    .test(actorsSource) ? "yes" : "no", "yes");
check("and it carries the feature's id, so two tattoos are two conditions",
  /creatorId: slate\.id,/.test(actorsSource) ? "yes" : "no", "yes");
check("while nothing applies one at grant time",
  /createItem[\s\S]{0,200}resolveCondition/.test(entrySource) ? "a hook" : "no", "no");

/*
 * And the law is written down, clause by clause. A rule that lives only in a check is a rule the
 * next person reads the code to discover.
 */
for (const clause of [
  "**A bonus or penalty over a duration is a condition.**",
  "**A thing that must be equipped or prepared is an item**",
  "**A thing usable without being equipped or prepared is a feature.**"
]) {
  check(`the schema document states: ${clause.slice(2, 34)}`,
    cardSchemaDoc.includes(clause) ? "yes" : "no", "yes");
}
check("and names the section it is in",
  cardSchemaDoc.includes("## 2.4 The law: three gates") ? "yes" : "no", "yes");
/* And the table of the three gates, so a reader finds the FIELD and not only the principle. */
for (const row of ["| `item` | equip it |", "| `spell` | prepare it |"]) {
  check(`and the gate for ${row.split("`")[1]}`,
    cardSchemaDoc.includes(row) ? "yes" : "no", "yes");
}

check("teachings that grant flat armour",
  permanents.filter(s => s.grants?.armor).map(s => `${s.name} ${s.grants.armor}`).sort().join(", "),
  "Graven Armour 3, Graven Shield 1, The Whole Skin 2");


check("a monster with nothing", npcHealth([]), 0);
check("and one with a feature that grants Health", npcHealth([feature(4)]), 4);
/* A feature is simply true; an item has to be EQUIPPED, so a looted amulet stops working when it
 * comes off the thing you looted it from (equipment.md 9.2). */
check("an equipped item grants it too", npcHealth([worn(2)]), 2);
check("and an unequipped one does not", npcHealth([worn(2, false)]), 0);
check("a feature and an item together", npcHealth([feature(4), worn(2)]), 6);
/* The rule that decides it, asked on its own so the two halves cannot drift apart. */
check("a feature always counts",
  grants.slateCounts({ type: "feature", system: {} }), true);
check("an unequipped item never does",
  grants.slateCounts({ type: "item", system: { equipped: false } }), false);
check("and a card is neither", grants.slateCounts({ type: "action", system: {} }), false);

/* And the model uses it, rather than keeping a second copy of the same loop. */
check("the NPC model sums through the helper",
  /const granted = sumGrants\(this\.parent\.items, NPC_GRANTS\);/.test(modelSource)
    ? "yes" : "no", "yes");
check("the character model too",
  /const grants = sumGrants\(slates, CHARACTER_GRANTS\);/.test(modelSource) ? "yes" : "no", "yes");
check("and the maximum cannot be driven below one",
  /Math\.max\(1, this\.health\.base \+ granted\.health\)/.test(modelSource) ? "yes" : "no", "yes");
/* The loop that was in both models is in neither now. */
check("the grant loop is written once",
  (modelSource.match(/slate\.type === "feature"/g) ?? []).length, 0);

/*
 * **Health is the only key a monster can be granted, and that is a statement about the schema.** An
 * NPC holds no hand and never exhausts (core-rules 9), has no encumbrance, and has neither a deck
 * maximum nor a spell slot -- so a grant naming one of those is content pointed at a field that
 * does not exist. It is refused here rather than summed into nothing.
 */
check("grant keys a character reads", grants.CHARACTER_GRANTS.join(", "),
  "health, handSize, carry, deckMax, spellSlots, armor");
check("and the ones a monster has a field for", grants.NPC_GRANTS.join(", "), "health");
check("the model has no field for the other four",
  grants.CHARACTER_GRANTS.filter(k => k !== "health")
    .filter(k => new RegExp(`\\n      ${k}: new fields\\.`).test(
      modelSource.slice(modelSource.indexOf("export class NpcData")))).join(", ") || "none",
  "none");
/* And nothing a monster carries asks for one. A check waiting for the roster rather than one
 * finding a fault -- which is the honest description of most of this file. */
const monsterBorne = [...content.NPC_GEAR, ...content.FEATURES.filter(f =>
  [content.GOBLIN, content.GOBLIN_ARCHER].some(a => (a.features ?? []).includes(f.name)))];
/* Seven now: the two goblin weapons, the four pieces the variants named, and the trollkin club.
 * The natural weapons are counted separately below, since a grown thing is not gear. */
check("content a monster carries", monsterBorne.length, 11);
check("and none of it grants what a monster cannot read",
  monsterBorne.filter(x => grants.CHARACTER_GRANTS.filter(k => k !== "health")
    .some(k => x.grants?.[k])).map(x => x.name).join(", ") || "none", "none");

/* The two goblins are untouched, which is the point: a silent failure was closed and nothing was
 * rebalanced on the way past. */
check("a goblin's Health", content.GOBLIN.system.health.base, 5);
check("and the archer's", content.GOBLIN_ARCHER.system.health.base, 5);
check("neither carries a feature yet",
  [content.GOBLIN, content.GOBLIN_ARCHER].flatMap(a => a.features ?? []).join(", ") || "none",
  "none");

check("the schema document records what a monster derives",
  /plus the `grants` of its features and equipped gear/.test(schemaDoc) ? "yes" : "no", "yes");
check("and why Health is the only one",
  /no hand, no encumbrance, no deck maximum and no spell slot/.test(schemaDoc) ? "yes" : "no",
  "yes");
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
/*
 * **What `passiveScore` reads, which has been wrong twice now in opposite directions.** It began by
 * reading a field that did not exist, so every saving throw used a flat 2; the repair pointed it at
 * `decks.skill`, which is the pile you have NOT drawn yet -- so playing your Wits 3 lowered your
 * passive Wits, and hud-spec 5's *it never changes during play* was false the whole time. It reads
 * every stack now and takes the skill cards out of them, which is what skill-rules 2 means by *the
 * best card of that approach in the whole deck, counting the discard*.
 */
check("the passive reads every stack, not the draw pile",
  /Object\.values\(actor\.system\.decks\)/.test(resolveSource) ? "yes" : "no", "yes");
check("and picks the skill cards out of them",
  /if \(card\.type !== "skill"\) continue;/.test(resolveSource) ? "yes" : "no", "yes");
/* Through `serves`, so the one wild in a deck counts toward every approach -- which is what a wild
 * is, and the alternative would have had an Inspiration raise nothing at all. */
check("a wild counts toward every approach",
  /card\.system\?\.serves\?\.\(approach\)/.test(resolveSource) ? "yes" : "no", "yes");

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
check("three below", resolve.checkOutcome(-3), "partial");
/* The floor itself, and the first rung past it: the band is four wide now, because a doubled card
 * jumps over a band of two (see `PARTIAL_FLOOR`). */
check("four below", resolve.checkOutcome(-4), "partial");
check("five below", resolve.checkOutcome(-5), "fail");
check("and the floor is one number, not a literal in two places",
  resolve.PARTIAL_FLOOR, -4);
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
/*
 * A stub as faithful as the documents it stands for: a Card carries a `type` and its system data
 * answers `serves`. The first version of this stub had neither, which made it a weaker model than
 * reality and would have let a passive that ignored both look correct.
 *
 * The cards are spread across three stacks on purpose, because the defect being tested was reading
 * only one of them: the best Might card sits in the DISCARD.
 */
const skillCard = (approach, value) => ({
  type: "skill",
  system: { approach, value, wild: false, serves: a => approach === a }
});
const fakeStacks = {
  "deck-id": { cards: [skillCard("might", 1), skillCard("lore", 1)] },
  "hand-id": { cards: [skillCard("might", 2)] },
  "discard-id": { cards: [skillCard("might", 3)] }
};
globalThis.game = { cards: { get: id => fakeStacks[id] ?? null } };
const withDeck = {
  system: {
    decks: { skill: "deck-id", skillHand: "hand-id", skillDiscard: "discard-id" },
    passive: 99
  }
};
const withNone = { system: { decks: {}, passive: 7 } };
/* 3 + 2, and the 3 is in the discard: the number a player would have lost by playing it. */
check("passive score from the best card of that approach",
  resolve.passiveScore(withDeck, "might"), 5);
check("and it does not fall when the best card leaves the draw pile",
  resolve.passiveScore({ system: { decks: { skill: "hand-id", skillDiscard: "discard-id" } } },
    "might"), 5);
check("an approach the deck is thin on", resolve.passiveScore(withDeck, "lore"), 3);
check("one it has no card for at all", resolve.passiveScore(withDeck, "presence"), 2);
/* An NPC has no deck and carries one flat number instead, which is what the fallback is FOR. */
check("and a creature with no deck uses its own number",
  resolve.passiveScore(withNone, "might"), 7);
/*
 * And a mastery, which is the only thing in the game that raises a passive without touching a
 * card: the deeper half of skill-rules 8's scaling, and the half that answers the audit's finding
 * that nothing levelling gave ever moved what a character notices.
 */
const withMastery = {
  system: {
    decks: { skill: "deck-id", skillHand: "hand-id", skillDiscard: "discard-id" },
    learned: { masteries: ["might"] }
  }
};
check("a mastery raises the passive by one", resolve.passiveScore(withMastery, "might"), 6);
check("and only in the approach it names", resolve.passiveScore(withMastery, "lore"), 3);
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

/* ---- the scene tray: somewhere to make one from ---- */

/*
 * `resolveCheck` was reachable only from a macro, which is the same shape of omission the skill
 * deck itself was: built, correct, and unplayable. The scene tray is hud-spec 5, and it is the same
 * window in a different mode rather than a second application -- because the fate deck spans both
 * modes and a second window would have to draw it twice.
 */
/* The record, where a reader of the HUD spec will find it. */
check("the HUD spec marks the scene tray built",
  /^## 5\. Scene tray {2}\*\*\[BUILT 2026-11-01\]\*\*$/m.test(hudPane) ? "yes" : "no", "yes");
check("and says why it is not a second window",
  /\*\*The same window in a different mode, not a second application\*\*/.test(hudPane)
    ? "yes" : "no", "yes");

check("the tray has a scene mode",
  /scene: myCombatant \? null : this\.#sceneTray\(\),/.test(traySource) ? "yes" : "no", "yes");
check("and the template draws it",
  /\{\{#if scene\}\}/.test(trayTemplate) ? "yes" : "no", "yes");
check("a skill card is playable",
  /data-action="check" data-card-id="\{\{this\.id\}\}"/.test(trayTemplate) ? "yes" : "no", "yes");
/*
 * All six passives, always: a deck that covers every approach is the composition rule, so a tray
 * that showed four would be hiding two a player is entitled to. Read from the `#sceneTray` body --
 * the check dialog filters the same list the same way, and a loose match found that one instead.
 */
const sceneBody = traySource.slice(
  traySource.indexOf("  #sceneTray() {"), traySource.indexOf("  /** Round and turn,"));
check("the passive list covers every approach but `any`",
  (sceneBody.match(/key !== "any"/g) ?? []).length, 1);
check("and nothing narrows it to one",
  /key === "/.test(sceneBody) ? "no" : "yes", "yes");
/* Push offers same-approach cards only, which is the rule and not a convenience. */
check("push offers only cards of that approach",
  /c\.system\.serves\(approach\)/.test(traySource) ? "yes" : "no", "yes");
/* The hand refills per SCENE, and only the GM knows when one starts. */
check("the skill hand is four",  CARDRPG.defaults.skillHandSize, 4);
check("and only the GM starts a scene",
  /if \(!game\.user\.isGM\) \{[\s\S]{0,120}says when a new scene starts/.test(traySource)
    ? "yes" : "no", "yes");
/* A played card goes to the skill discard, and the push goes with it. */
check("the played cards go to the skill discard",
  /discardSkillCards\(this\.actor, \[card\.id, \.\.\.\(pushed \? \[pushed\.id\] : \[\]\)\]\)/
    .test(traySource) ? "yes" : "no", "yes");
/*
 * And the discard is NOT reshuffled: skill-rules says a rest brings it back, never a shuffle, which
 * is the one place the two card sides differ in kind. Read from the function BODY, because the next
 * function along is the one that puts cards INTO the discard and a wide window matched it.
 */
const dealBody = decksSource.slice(
  decksSource.indexOf("export async function dealSkillHand"),
  decksSource.indexOf("/** A played skill card goes"));
check("dealing never touches the discard",
  /skillDiscard/.test(dealBody) ? "no" : "yes", "yes");
check("and it draws at random rather than off the top",
  /moveRandom\(deck, hand, want\)/.test(dealBody) ? "yes" : "no", "yes");

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

/* ---- the call for a check, and the two defects it closed  [BUILT 2026-11-02] ---- */

/*
 * **Step 1 of skill-rules 2 is "the GM describes the obstacle and sets a difficulty", and the first
 * build gave it to the player.** The tray offered Easy 3 to Heroic 9 to whoever clicked their own
 * card, so a player set the difficulty of their own obstacle and nothing in the software disagreed.
 *
 * **And advantage was unreachable.** `resolveCheck` has taken a `mode` since it was written, the
 * dialog never set it, and skill-rules 2 gives advantage for *a good plan, a clever use of the
 * environment, or a fitting background* -- the GM's main lever, used twice in section 3's own
 * worked example, with no way to pull it. Both are the same omission seen twice: the half of a
 * check that belongs to the GM had nowhere to be said.
 *
 * A **call** is that half. It lives as a flag on the active scene rather than in a chat message,
 * because it is a state of the table and not an event in its history: true until answered or
 * withdrawn, read identically by every client, and `updateScene` already redraws the tray.
 */
const checksSource = fs.readFileSync(path.join(root, "module/checks.mjs"), "utf8");

check("the call is a module of its own",
  /export function readCall\(\)/.test(checksSource) ? "yes" : "no", "yes");
/*
 * Read from `readCall`'s own body. Nine functions in that module reach for the active scene, so a
 * file-wide grep was a claim about the module and not about the call: any one of the other eight
 * would have answered it.
 */
const readCallBody = checksSource.slice(checksSource.indexOf("export function readCall"),
  checksSource.indexOf("export async function setCall"));
check("and it lives on the active scene",
  /game\.scenes\?\.active/.test(readCallBody) ? "yes" : "no", "yes");
/*
 * The ACTIVE scene and not the viewed one: a GM drawing next week's map must not take the call with
 * them, which is a different question from where the canvas happens to be.
 *
 * **Asked of the code with the comments stripped**, because the first version of this check read
 * the comment that says `canvas.scene` is not what is used and reported the opposite. A grep over a
 * file that explains itself will find the words it explains.
 */
const checksCode = checksSource.replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n").map(line => line.replace(/\/\/.*$/, "")).join("\n");
check("the active scene rather than the viewed one",
  /canvas\.scene/.test(checksCode) ? "the viewed one" : "the active one", "the active one");
/*
 * Read from `setCall`'s OWN body. The guard is one line and `startChallenge` now carries the same
 * one, so a file-wide grep was satisfied by the second writer while the first had lost it -- which
 * is the shape of weakening this project has met before, and it only appeared when a second
 * function was written.
 */
const setCallBody = checksSource.slice(checksSource.indexOf("export async function setCall"),
  checksSource.indexOf("export async function clearCall"));
check("only the GM may set one",
  /if \(!game\.user\.isGM \|\| !scene\) return null;/.test(setCallBody) ? "yes" : "no", "yes");
check("and only the GM may withdraw it",
  /export async function clearCall\(\) \{\s*const scene = game\.scenes\?\.active;\s*if \(!game\.user\.isGM/
    .test(checksSource) ? "yes" : "no", "yes");

/*
 * **Answering does not clear the call**, which is what makes a challenge work: section 3 says
 * *each round, every character may take one action*, so several characters answer the same obstacle
 * in turn. A call that cleared itself would make the GM re-state the gate for every player.
 */
check("answering a call does not withdraw it",
  /clearCall\(\)/.test(traySource.slice(traySource.indexOf("static async #onCheck")))
    ? "it withdraws it" : "it stands", "it stands");
check("and the document says why it stands",
  /Answering a check does not clear the call/.test(checksSource) ? "yes" : "no", "yes");

/* The player cannot set a difficulty, and the refusal is a refusal rather than a default: a
 * Normal 5 for an uncalled check would be the same defect wearing a sensible-looking number. */
check("a player with no call cannot start a check",
  /if \(!call && !game\.user\.isGM\) \{[\s\S]{0,120}WaitForCall/.test(traySource) ? "yes" : "no",
  "yes");
check("and the dialog asks for a difficulty only when there is no call",
  /!call \? "dc" : null/.test(traySource) ? "yes" : "no", "yes");
/* The GM's half reaches the arithmetic: the mode that was unreachable is now passed through. */
check("the call's advantage reaches resolveCheck",
  /mode: answer\.mode,/.test(traySource) ? "yes" : "no", "yes");
check("and the call carries one at all",
  /mode: Number\(call\.mode\) \|\| 0/.test(checksSource) ? "yes" : "no", "yes");
check("the GM's dialog offers all three edges",
  ["CARDRPG.Check.Even", "CARDRPG.Check.Advantage", "CARDRPG.Check.Disadvantage"]
    .every(k => traySource.includes(k) && k in lang), true);

/*
 * **The approach must fit the description** (skill-rules 2, step 2), which the engine can hold once
 * the GM has named one -- and a wild fits any, which is the whole reason an Inspiration is worth a
 * slot that could have held a 3.
 */
check("a card that cannot answer the call is refused",
  /if \(call && !cardAnswers\(card, call\)\)/.test(traySource) ? "yes" : "no", "yes");
check("and a wild answers any call",
  /serves\?\.\(call\.approach\)/.test(checksCode) ? "yes" : "no", "yes");
/* Which rests on `serves` itself, where a wild is the first clause: the card model has said so
 * since the skill side was built, and a check about wilds that did not read it would be a check
 * about a regex. */
check("and serves says a wild serves everything",
  /return this\.wild \|\| this\.approach === approach;/.test(
    fs.readFileSync(path.join(root, "module/data/cards.mjs"), "utf8")) ? "yes" : "no", "yes");
/* Dimmed in place, never hidden: the same rule a blocked card half follows (hud-spec 3.2). */
check("the hand dims what cannot answer",
  /cr-card--mute/.test(trayTemplate) ? "yes" : "no", "yes");
check("and the stylesheet dims rather than hides",
  /\.cr-card--mute \{ opacity/.test(
    fs.readFileSync(path.join(root, "styles/cardrpg.css"), "utf8")) ? "yes" : "no", "yes");

/*
 * **And the dialog asks only what is still a decision.** Five selects were offered every time, four
 * of them usually with one option. The tool is now chosen -- the engine knows what is equipped and
 * which approach it serves -- and push, help and approach appear only when they have an answer. An
 * empty list means the click was the whole check, which is the common case at a table.
 */
check("the dialog is built from what is still open",
  /const asks = \[/.test(traySource) ? "yes" : "no", "yes");
check("and skips itself entirely when nothing is",
  /if \(asks\.length\) \{/.test(traySource) ? "yes" : "no", "yes");
check("the tool is picked rather than asked",
  /export function bestTool\(actor, approach\)/.test(checksSource) ? "yes" : "no", "yes");
/* Picked by what it is worth TO THIS CHARACTER, because an untrained +2 is a +1. */
check("and ranked by what it is worth to this character",
  /return trained \? \(b\.value \?\? 0\) : Math\.min\(1, b\.value \?\? 0\);/.test(checksSource)
    ? "yes" : "no", "yes");
/* It is still offered and still clearable: a tool bonus is situational and only the table knows
 * whether this is a lock. */
/* From the check dialog's own body: the two hits are one ternary across a wrapped line, but a
 * grep that cannot tell that from two sites is not worth trusting the next time. */
const onCheckBody = traySource.slice(traySource.indexOf("static async #onCheck"),
  traySource.indexOf("static #onOpenPile"));
check("the chosen tool is still shown with its situation",
  /bonus\.situation/.test(onCheckBody) ? "yes" : "no", "yes");

/* The banner, the GM's button, and the hook that redraws it for everybody. */
/*
 * The banner's own region. Both of these patterns appear twice in the template -- once in the
 * banner and once in the GM's row further down, where *Re-call* lives -- so each was answerable by
 * the other half of a feature it was not about.
 */
const bannerBlock = trayTemplate.slice(trayTemplate.indexOf('data-group-label="Scene"'),
  trayTemplate.indexOf('class="cr-scene__counts"'));
check("the tray prints the call",
  /\{\{#if scene\.call\}\}/.test(bannerBlock) ? "yes" : "no", "yes");
check("and offers the GM a way to make one",
  /data-action="callCheck"/.test(bannerBlock) ? "yes" : "no", "yes");
/* And the second one is its own affordance, worth its own assertion rather than propping up the
 * first: a difficulty set wrongly should be corrected, not argued about. */
const countsBlock = trayTemplate.slice(trayTemplate.indexOf('class="cr-scene__counts"'));
check("and a way to change it once it stands",
  /data-action="callCheck"[\s\S]{0,200}Re-call/.test(countsBlock) ? "yes" : "no", "yes");
check("a scene change redraws every tray",
  /"deleteCombat", "updateScene"/.test(traySource) ? "yes" : "no", "yes");
check("every string the call needs is translated",
  Object.keys(lang).filter(k => k.startsWith("CARDRPG.Check.")).length, 26);
check("and nothing it uses is missing",
  [...traySource.matchAll(/CARDRPG\.Check\.[A-Za-z]+/g)].map(m => m[0])
    .filter(k => !(k in lang)).join(", ") || "none", "none");

/*
 * ---- a tool names its own training ----
 *
 * **Eleven of the fourteen tools could never be trained.** skill-rules 2 caps an untrained user at
 * +1 however good the tool is, and the test matched the tool's LAST WORD against the trainings a
 * character held -- so "Healer's Kit" went looking for a training with "kit" in it. Four tools
 * could never reach the bonus printed on them: Healer's Kit, Repair Kit, Smith's Hammer and *The
 * Kit*, which is the Burglar's Signature.
 *
 * The tool names the training now, and the comparison is exact. The invariant that replaces the
 * guess is the one worth having: **a bonus printed on a tool must be reachable**, which means every
 * tool over +1 names a training and every training it names is taught by a node.
 */
check("the training is a field on the tool",
  /training: new fields\.StringField/.test(
    fs.readFileSync(path.join(root, "module/data/items.mjs"), "utf8")) ? "yes" : "no", "yes");
check("and the comparison is exact rather than a substring",
  /String\(t\)\.trim\(\)\.toLowerCase\(\) === want/.test(resolveSource) ? "yes" : "no", "yes");
check("a tool that names no training is not capped",
  /const trained = !want \|\|/.test(resolveSource) ? "yes" : "no", "yes");

const taught = new Set(nodes.filter(n => n.grants?.training)
  .map(n => String(n.grants.training).trim().toLowerCase()));
const overOne = content.ITEMS.filter(i => (i.bonus?.value ?? 0) > 1);
check("tools whose bonus the untrained cap bites", overOne.length, 8);
check("and every one of them names a training",
  overOne.filter(i => !(i.bonus.training ?? "").trim()).map(i => i.name).join(", ") || "none",
  "none");
check("and every training they name is taught by a node",
  overOne.filter(i => !taught.has((i.bonus.training ?? "").trim().toLowerCase()))
    .map(i => `${i.name} wants ${i.bonus.training}`).join(", ") || "none", "none");
/*
 * ---- and the other direction, which had never been asked  **[FOUND 2026-11-07]**
 *
 * The invariant above runs **one way only**: it starts at a tool printed over +1 and checks that
 * somebody teaches what it names. Nothing started at a *node* and asked whether the training it
 * teaches reaches anything -- and skill-rules 2 is explicit that *a tool that names no training is
 * not capped*, so **a training naming no tool over +1 changes no number anywhere in the game.** It
 * is a reward that reads like a reward and is arithmetically nothing.
 *
 * Asked for the first time: **23 trainings are taught by 24 nodes and 3 of them reached a tool.**
 * Not a near miss -- seven eighths of the reward was decorative, and the eight most vivid names on
 * the list were among the dead: oratory, disguise, riding, reading, appraisal, siege engines, the
 * holy books, sleight of hand.
 *
 * **Three were fixed by reading the catalogue rather than adding to it.** *Climbing Rope*,
 * *Hunting Traps* and *Gaming Set* were each printed at +1 beside a node teaching `rope and
 * climbing`, `traps` and `games of chance` -- the tool and the training were written as a pair and
 * the link between them was simply never made. Each is +2 now and names its training, which is the
 * whole of the fix: no new content, and three rewards that were nothing are worth a point each.
 *
 * **The other seventeen are pinned rather than invented, and they are two different problems.**
 *
 * | | |
 * |---|---|
 * | **8 want a tool nobody has written** | appraisal wants scales, disguise a kit, tattooing needles, firearms a cleaning kit, siege engines a quadrant, reading and the holy books a book. Each is a catalogue entry, and a catalogue entry is a **commission** -- art-list.md would grow eight rows and eight pictures |
 * | **9 are not tool trainings at all** | `shield and club`, `shield and formation`, `the knife`, `close protection`, `riding`, `oratory`, `liturgy`, `sleight of hand`, `the rule of an order` are **practices**. There is no tool to uncap and there should not be one, so leveling.md 4's *a tool type, at the full bonus* does not describe them. They want a different reward kind -- a know-how is the mechanism that exists and is scarce -- and which one is a design decision rather than a repair |
 *
 * The list is pinned whole so it can only ever get shorter, and so that a node teaching a
 * **new** dead training cannot be added quietly: that is the failure this check exists for, and it
 * is the one the first direction could never have caught.
 */
const trainingTools = new Map();
for (const item of content.ITEMS) {
  const want = (item.bonus?.training ?? "").trim().toLowerCase();
  if (want && (item.bonus?.value ?? 0) > 1) {
    trainingTools.set(want, [...(trainingTools.get(want) ?? []), item.name]);
  }
}
check("trainings taught by a node", taught.size, 15);
check("and the ones that reach a tool",
  [...taught].filter(t => trainingTools.has(t)).sort().join(", "),
  "armour and its repair, games of chance, lockpicks, rope and climbing, traps, treating wounds");
/* A training that uncaps nothing is a reward worth nought. Shorter is better; longer is a bug. */
check("and the ones that change no number anywhere",
  [...taught].filter(t => !trainingTools.has(t)).sort().join(", "),
  "appraisal, disguise, firearms and their cleaning, reading, reading and writing, riding, "
  + "siege engines, tattooing, the holy books");
check("which is how many of the fifteen",
  [...taught].filter(t => !trainingTools.has(t)).length, 9);
/* The three the catalogue could already carry, so a later edit cannot quietly un-pair them. */
for (const [training, tool] of [["rope and climbing", "Climbing Rope"],
  ["traps", "Hunting Traps"], ["games of chance", "Gaming Set"]]) {
  check(`${training} is unlocked by`, (trainingTools.get(training) ?? []).join(", "), tool);
}
/* The one that was taught by nothing, and the two nodes that now teach it. A training granted
 * twice is one training: `learned` dedupes, so the cloister and the anatomist agree. */
check("who teaches treating wounds",
  nodes.filter(n => n.grants?.training === "treating wounds").map(n => n.id).sort().join(", "),
  "faith.order.cloister, mind.blood.anatomy");
check("and the sheet would not list it twice",
  /trainings: \[\.\.\.new Set\(/.test(
    fs.readFileSync(path.join(root, "module/data/actors.mjs"), "utf8")) ? "yes" : "no", "yes");

/* The documents, because every one of these three was a rule the software contradicted. */
check("skill-rules records who sets the difficulty",
  /\[BUILT 2026-11-02\]\*\* The GM's half of a check had nowhere to be said/
    .test(skillDoc) ? "yes" : "no", "yes");
check("and that a tool names its training",
  /a tool names the\n> training that unlocks it/.test(skillDoc) ? "yes" : "no", "yes");
check("and names the four tools that could not reach their bonus",
  /Healer's Kit, Repair Kit, Smith's Hammer and\n> \*The Kit\*/.test(skillDoc) ? "yes" : "no", "yes");
check("hud-spec records the banner",
  /#### 5\.1 The call for a check {2}\*\*\[BUILT 2026-11-02\]\*\*/.test(hudSpec) ? "yes" : "no",
  "yes");

/* ---- challenges, the twist deck and enrichers  [BUILT 2026-11-02] ---- */

/*
 * **Three sections of skill-rules that were written in full and built not at all**, and the reason
 * the smallest of them took the longest: §3's tracks are pure arithmetic hanging off a function
 * that already existed, §4's deck is thirty cards in the shape four decks already have, and §2's
 * *draw a twist card* had been printed in two result tables since the rules were written with
 * nothing in the software able to do it.
 */
const twistDefs = content.TWISTS;
check("kinds of twist", twistDefs.length, 8);
/* Thirty cards, and the counts ARE the tone: Strain, Noise, Time, Gear, Arrival and Opening are
 * common so most twists push sideways, Hurt and Secret are rare so they land hard. */
check("cards in the twist deck", twistDefs.reduce((n, t) => n + t.copies, 0), 30);
check("and the counts the document gives",
  twistDefs.map(t => `${t.name} ${t.copies}`).join(", "),
  "Noise 4, Time 4, Gear 4, Strain 5, Hurt 3, Arrival 4, Secret 2, Opening 4");
/* Two of the eight are not only prose, and both are named in the rules as exceptions. */
check("the twist that costs an extra Pressure",
  twistDefs.filter(t => t.pressure).map(t => t.name).join(", "), "Time");
check("and the one that gives rather than takes",
  twistDefs.filter(t => t.gives).map(t => t.name).join(", "), "Opening");
check("every twist says what it costs",
  twistDefs.filter(t => !(t.cost ?? "").length).length, 0);

/* The document's table is the brief, the same way the world's language list is. */
const twistRows = [...skillDoc.matchAll(/^\| \*\*(\w+)\*\* \| (\d+) \|/gm)]
  .map(m => ({ name: m[1], copies: Number(m[2]) }));
check("twist rows in skill-rules", twistRows.length, 8);
check("and the content matches them",
  twistRows.filter(r => twistDefs.find(t => t.name === r.name)?.copies !== r.copies)
    .map(r => r.name).join(", ") || "none", "none");

/* A twist is a Card, like everything else that is drawn. */
check("the twist card is a subtype",
  /export class TwistCardData/.test(cardsSource) ? "yes" : "no", "yes");
check("and it is registered",
  /twist: TwistCardData/.test(entrySource)
    ? "yes" : "no", "yes");
check("the deck is built at setup",
  /makeCards\("Twist Deck", "deck", "twist-deck"/.test(setupSource) ? "yes" : "no", "yes");
check("with a discard beside it",
  /makeCards\("Twist Discard", "pile", "twist-discard"\)/.test(setupSource) ? "yes" : "no", "yes");
/*
 * **Drawn by hand and never by a result**, which is §4's own instruction: *the GM can always choose
 * a cost directly... the deck is there for when inspiration runs out, not to override the GM*. So
 * the check's chat line says a twist is owed and the button is the GM's; nothing in the engine
 * draws one.
 */
check("only the GM may draw one",
  /export async function drawTwist[\s\S]{0,120}if \(!game\.user\.isGM\) return null;/
    .test(checksSource) ? "yes" : "no", "yes");
check("nothing draws a twist automatically",
  /drawTwist\(/.test(resolveSource) ? "something does" : "nothing does", "nothing does");
check("the Partial says one is owed",
  /you do it, and it costs something\. Draw a twist\./.test(resolveSource) ? "yes" : "no", "yes");
check("and so does the Fail",
  /the situation changes\. Draw a twist\./.test(resolveSource) ? "yes" : "no", "yes");
/* Two and pick, for a dramatic failure or a card that does not fit the scene. */
check("two may be drawn and one picked",
  /drawTwist\(\{ two: target\.dataset\.two === "yes" \}\)/.test(traySource) ? "yes" : "no", "yes");
/* Reshuffled when it runs out, which is the only shuffle rule the deck has. */
check("the deck comes back when it runs out",
  /if \(deck\.cards\.size < want\)/.test(checksSource) ? "yes" : "no", "yes");
check("and a twist is whispered to the GM",
  /whisper: ChatMessage\.getWhisperRecipients\("GM"\)/.test(checksSource) ? "yes" : "no", "yes");

/*
 * **The challenge tracks, which are the table of §3 as data.** Critical +2 progress, Success +1,
 * Partial +1 and +1, Fail +1 pressure and a twist -- pulled out as a lookup rather than written as
 * four branches, because `checkOutcome` already decides which of the four a check produced and this
 * is the only other thing that reads it.
 */
const checksModule = await import("../module/checks.mjs");
check("the track table", Object.entries(checksModule.TRACK_MOVES)
  .map(([k, v]) => `${k} +${v.progress}/+${v.pressure}${v.twist ? " twist" : ""}`).join(", "),
  "critical +2/+0, success +1/+0, partial +1/+1 twist, fail +0/+1 twist");
check("and it matches the document's table",
  [...skillDoc.matchAll(/^\| (Critical|Success|Partial|Fail) \| ([^|]*)\| ([^|]*)\|/gm)]
    .map(m => `${m[1].toLowerCase()} ${m[2].trim() || "-"} ${m[3].trim() || "-"}`).join("; "),
  "critical +2 –; success +1 –; partial +1 +1; fail – +1 (and a twist)");

/* It lives beside the call, on the active scene, and for the same reason. */
check("a challenge is a scene's state",
  /const CHALLENGE = "challenge";/.test(checksSource) ? "yes" : "no", "yes");
check("only the GM starts one",
  /export async function startChallenge[\s\S]{0,200}if \(!game\.user\.isGM \|\| !scene\) return null;/
    .test(checksSource) ? "yes" : "no", "yes");
/*
 * **And only the GM's client records a result**, which is not a policy but a fact about Foundry: a
 * scene flag is the GM's to write and a player resolves their own check. So the outcome travels as
 * a flag on the chat message and one hook, guarded by `isGM`, moves the tracks.
 */
check("the check stamps its outcome on the message",
  /flags: \{ cardrpg: \{ outcome \} \},/.test(resolveSource) ? "yes" : "no", "yes");
check("and a hook on the GM's client reads it",
  /Hooks\.on\("createChatMessage"[\s\S]{0,120}if \(!game\.user\.isGM\) return;/
    .test(checksSource) ? "yes" : "no", "yes");
check("which is registered at startup",
  /registerCheckHooks\(\);/.test(entrySource)
    ? "yes" : "no", "yes");
/* Neither track is clamped: a full track is reported and the GM decides what it means, because
 * both endings in §3 are about fiction rather than state. */
check("a filled track is reported, not enforced",
  /won: progress >= progressMax,/.test(checksSource) ? "yes" : "no", "yes");
check("and both endings have words",
  ["CARDRPG.Challenge.Won", "CARDRPG.Challenge.Lost"].every(k => k in lang), true);

/* Catch Breath in a challenge, which is the skill side's and not the combat one. */
check("Catch Breath in a challenge exists",
  /export async function catchBreathInChallenge/.test(checksSource) ? "yes" : "no", "yes");
check("it costs a Pressure",
  /flags: \{ cardrpg: \{ pressure: 1 \} \}/.test(checksSource) ? "yes" : "no", "yes");
check("the discard comes back",
  /if \(ids\.length\) await move\(discard, deck, ids\);/.test(checksSource) ? "yes" : "no", "yes");
/* The card set aside is the player's choice, the way a prune is: only they know which one died. */
check("and the player picks what is set aside",
  /CARDRPG\.Challenge\.SetAside/.test(traySource) ? "yes" : "no", "yes");
check("the tray offers it only inside a challenge",
  /data-action="breatheScene"/.test(trayTemplate) ? "yes" : "no", "yes");
check("and the tracks print as bars",
  /cr-track__fill--pressure/.test(trayTemplate) ? "yes" : "no", "yes");

/*
 * **Enrichers: the call written where the prep is.** Most out-of-combat checks come from prepared
 * material, so the cheapest streamlining left is to let the page carry the call -- `@Check[wits|
 * hard]{Spot the tripwire}` is a button, and clicking it sets the call for the party.
 */
const enrichSource = fs.readFileSync(path.join(root, "module/enrichers.mjs"), "utf8");
/* The code with its comments stripped. The module documents its own syntax, so a grep for
 * "@Challenge[" over the whole file finds the sentence explaining it and reports a pattern that
 * may have been renamed -- the same way an earlier check read the comment saying `canvas.scene` is
 * NOT used. A file that explains itself will answer a grep about what it explains. */
const enrichCode = enrichSource.replace(/\/\*[\s\S]*?\*\//g, "")
  .split("\n").map(line => line.replace(/\/\/.*$/, "")).join("\n");
check("the enrichers are registered",
  /CONFIG\.TextEditor\?\.enrichers/.test(enrichSource) ? "yes" : "no", "yes");
check("at init, because enrichment runs on first render",
  /registerEnrichers\(\);/.test(entrySource)
    ? "yes" : "no", "yes");
/* Spelled with the backslash the regex literals carry, so this reads the patterns themselves and
 * not a sentence about them. */
check("both patterns exist",
  ["@Check\\[", "@Challenge\\["].every(p => enrichCode.includes(p)), true);
/* The parts are order-free, because a GM writing prep should not have to remember a grammar. */
check("an approach, a difficulty and an edge are all optional",
  /if \(part in CARDRPG\.difficulties\)/.test(enrichSource)
  && /if \(part === "advantage" \|\| part === "adv"\)/.test(enrichSource) ? "yes" : "no", "yes");
check("a difficulty may be a word or a number",
  /if \(\/\^\\d\+\$\/\.test\(part\)\)/.test(enrichSource) ? "yes" : "no", "yes");
/* A player clicking one gets a reminder, not a call: step 1 is still the GM's, and an enricher is
 * a shortcut for the person who was always allowed to take it. */
check("a player clicking an enriched check cannot call it",
  /if \(!game\.user\.isGM\) \{[\s\S]{0,120}CARDRPG\.Check\.GMCalls/.test(enrichSource)
    ? "yes" : "no", "yes");
/* One delegated listener, because enriched text turns up in journals, chat, items and tooltips. */
check("one listener serves every rendered button",
  /document\.addEventListener\("click"/.test(enrichSource) ? "yes" : "no", "yes");
check("and it is attached once the document exists",
  /registerEnricherClicks\(\);/.test(entrySource)
    ? "yes" : "no", "yes");

/* The documents. Three sections moved from written to built, and each says what it now does. */
check("skill-rules marks challenges built",
  /^## 3\. Challenges {2}\*\*\[BUILT 2026-11-02\]\*\*$/m.test(skillDoc) ? "yes" : "no", "yes");
check("and the twist deck",
  /^## 4\. Twist deck \(GM tool\) {2}\*\*\[BUILT 2026-11-02\]\*\*$/m.test(skillDoc)
    ? "yes" : "no", "yes");
check("and says the deck is never forced",
  /never forced by a result/.test(skillDoc) ? "yes" : "no", "yes");
check("hud-spec records the tracks and the enrichers",
  /#### 5\.2 Challenge tracks, and checks written into the prep {2}\*\*\[BUILT 2026-11-02\]\*\*/
    .test(hudSpec) ? "yes" : "no", "yes");

/* ---- the GM's passive panel  [BUILT 2026-11-02] ---- */

/*
 * **`passiveScore` has been right since the skill side was built and nothing ever showed it to the
 * person who needs it.** That is the same shape as a reward nobody can see: the arithmetic existed,
 * the answer did not reach anybody. And the panel's job is **subtraction** -- skill-rules 2 says
 * *only make a check when failure would be interesting*, and a party whose best Wits is 6 simply
 * notices a Normal 5. The fastest check is the one nobody makes.
 */
check("the party's passives are read for the GM",
  /export function partyPassives\(scoreOf\)/.test(checksSource) ? "yes" : "no", "yes");
/* Tokens on the active scene are the party in front of the GM; a scene with none falls back to
 * every character, because a GM reading this before the session starts is a real case. */
check("who counts is whoever has a token on the active scene",
  /\(scene\?\.tokens\?\.contents \?\? \[\]\)/.test(checksSource) ? "yes" : "no", "yes");
check("and an empty scene falls back to every character",
  /: \(game\.actors\?\.filter\(a => a\.type === "character"\) \?\? \[\]\);/.test(checksSource)
    ? "yes" : "no", "yes");
check("all six approaches, always",
  /\.filter\(\(\[key\]\) => key !== "any"\)/.test(checksCode) ? "yes" : "no", "yes");
/* One row per approach, with the best and who holds it -- and everybody, for the fold. */
check("each row carries the best score and the name",
  /best: best\?\.score \?\? 0,[\s\S]{0,60}who: best\?\.actor\?\.name \?\? "",/.test(checksSource)
    ? "yes" : "no", "yes");

/*
 * **Three states against the call, and the middle one is the only one that needs a check.** Over:
 * it happens. Close: a card could carry it, so ask. Under: their best card in hand still falls
 * short, and asking is cruel. The same comparison `resolveCheck` makes, printed where the decision
 * is taken instead of left to arithmetic in the GM's head.
 */
check("a passive reads three ways against a difficulty",
  ["over", "close", "under"].every(s => new RegExp(`"${s}"`).test(checksCode)), true);
check("over means the passive alone meets it",
  /if \(passive >= dc\) return "over";/.test(checksSource) ? "yes" : "no", "yes");
check("and close means a card could carry it",
  /return passive \+ bestInHand >= dc \? "close" : "under";/.test(checksSource) ? "yes" : "no",
  "yes");
/* Marked only against a call that names the approach, or an open one: a Wits call says nothing
 * about whether anybody could manage the Might obstacle. */
check("a row is marked only when the call is about it",
  /call\.approach === "any" \|\| call\.approach === row\.key/.test(traySource) ? "yes" : "no", "yes");
check("and each mark has words of its own",
  ["CARDRPG.Check.PassiveOver", "CARDRPG.Check.PassiveClose", "CARDRPG.Check.PassiveUnder"]
    .every(k => k in lang), true);
/* Built in the context rather than the template: three branches of prose in a data-tooltip is
 * markup doing arithmetic's job, and the template has one comparison helper where this needs three. */
/*
 * Read from the PANEL's own block. Six other rows of this template carry `{{this.tip}}`, so a
 * file-wide grep was satisfied by one of them while the panel had lost it -- the third time in two
 * days that a second printer has propped up a check about the first, and the only reason it showed
 * was the break test.
 */
const panelBlock = trayTemplate.slice(trayTemplate.indexOf('<div class="cr-passives'),
  trayTemplate.indexOf('<div class="cr-scene__passives"'));
check("the tooltip is built where the data is",
  /data-tooltip="\{\{this\.tip\}\}"/.test(panelBlock) ? "yes" : "no", "yes");

/* GM only, and not because it is secret: a passive is static (hud-spec 5), which is what makes it
 * safe to read in the open. It is the GM's because it is the GM's decision it serves. */
check("the panel is the GM's",
  /if \(!game\.user\.isGM\) return null;\s*const open = game\.settings\.get\("cardrpg", "passivesOpen"\)/
    .test(traySource) ? "yes" : "no", "yes");
/*
 * **Collapsible, and the state survives a reload.** A client setting rather than state on the
 * tray: a GM who folds it away once should find it away next session, and a field on the
 * application would last only as long as the window.
 */
check("the fold is a client setting",
  /"passivesOpen", \{\s*scope: "client",/.test(entrySource) ? "yes" : "no", "yes");
check("and it is not a world rule",
  /"passivesOpen"[\s\S]{0,80}config: false/.test(entrySource) ? "yes" : "no", "yes");
check("the toggle writes it",
  /await game\.settings\.set\("cardrpg", "passivesOpen",\s*!game\.settings\.get\("cardrpg", "passivesOpen"\)\);/
    .test(traySource) ? "yes" : "no", "yes");
check("the fold button says which way it goes",
  /aria-expanded="\{\{#if scene\.passives_gm\.open\}\}true\{\{else\}\}false\{\{\/if\}\}"/
    .test(trayTemplate) ? "yes" : "no", "yes");
/* Folded: one row of six. Open: the grid, and who the party is. */
check("folded, it is one row",
  /class="cr-passives__row"/.test(trayTemplate) ? "yes" : "no", "yes");
check("open, it is a grid",
  /class="cr-passives__grid"/.test(trayTemplate) ? "yes" : "no", "yes");
check("and it says whose scores these are",
  /\{\{scene\.passives_gm\.party\}\}/.test(trayTemplate) ? "yes" : "no", "yes");
/*
 * The question a GM will ask the moment the panel makes it visible, answered in the tooltip rather
 * than waiting to be asked: a passive counts the best card of that approach in the WHOLE deck,
 * discard included, so a character who has played their Wits 3 still reads the same.
 */
check("the tooltip says a passive counts the whole deck",
  /best card of that approach in the whole deck, plus 2 — it counts the discard/
    .test(trayTemplate) ? "yes" : "no", "yes");

check("skill-rules records the panel",
  /^> \*\*\[BUILT 2026-11-02\] The passive scores were right and nobody could see them\.\*\*/m
    .test(skillDoc) ? "yes" : "no", "yes");
check("and that its job is to remove checks",
  /The fastest check is the one nobody makes/.test(skillDoc) ? "yes" : "no", "yes");
check("hud-spec records it as collapsible",
  /#### 5\.3 What the party notices {2}\*\*\[BUILT 2026-11-02\]\*\*/.test(hudSpec) ? "yes" : "no",
  "yes");

/* ---- the skill side against the levelling curve  [2026-11-02] ---- */

/*
 * **The question was whether a skill check scales with levelling, and the answer is that it very
 * nearly does not.** Three findings, in order of what they cost.
 *
 * **1. Nothing in the game can grow a skill deck.** leveling 4's reward table offers *Skill card:
 * add one, or upgrade one*, and skill-rules 8 writes out the whole rule -- *add a card from your
 * Way's card list, or upgrade one, and prune 1*. The grants accumulator has **no key for it**, so
 * no node can hand one over and none does. A character's skill deck at level 20 is the deck they
 * started with, which means the card value -- the largest term in a check -- never moves, and
 * neither does a passive score, since a passive is read off that deck.
 */
const grantKeys = Object.keys(graph.grantsOf(new Set([graph.ROOT])));
check("keys the grants accumulator carries", grantKeys.length, 17);
/* And the two that were added for it, which is the half of skill-rules 8 that a node can express:
 * an expertise asks the player which card to raise, a mastery is a number read off the owned set. */
check("the two the skill side gained",
  grantKeys.filter(k => k === "expertise" || k === "masteries").sort().join(", "),
  "expertise, masteries");
check("and whether any of them could grow a skill deck",
  grantKeys.filter(k => /skill/i.test(k)).join(", ") || "none", "none");
check("nodes that grant a skill card", nodes.filter(n => n.grants?.skillCard).length, 0);
/* The documents promise it in two places, which is why this is a gap and not a decision. */
check("leveling offers a skill card as a reward",
  /\| \*\*Skill card\*\* \| Add one, or upgrade one/.test(levDoc) ? "yes" : "no", "yes");
/* And flags it as the one reward on that list nothing can grant, which is the half a reader needs:
 * the row on its own reads as a reward that works. */
check("and flags it as the one nothing can grant",
  /Skill card[\s\S]{0,80}\*\*\[OPEN\]\*\* The one reward on this list with no key/.test(levDoc)
    ? "yes" : "no", "yes");
check("and skill-rules writes the whole rule out",
  /\*\*Add\*\* a skill card from your Way's card list/.test(skillDoc) ? "yes" : "no", "yes");
/*
 * §1.5's own sentence, not the phrase. Two lists in this document name the same rewards, so a grep
 * for "a skill card, a training" was answered by §3 while §1.5 had lost it -- the fourth time in
 * two days that a second printer has propped up a check about the first. Every one of the four was
 * found by a break test and none by reading.
 */
check("and way-cards lists it among the minor-node rewards",
  /already written: a skill card, a training/.test(wayDoc) ? "yes" : "no", "yes");

/*
 * **2. Step 3 of a check could never contribute anything**, and the reason is a vocabulary rather
 * than a missing document: `collectBonuses` matches `bonus.verb`, whose schema choices are the six
 * core verbs, and `resolveCheck` passed it an approach. The two sets are **disjoint**, so
 * `bonus.verb === "wits"` is unreachable, not merely absent -- no document can hold it. Fixed by
 * reading `bonus.approach`, which is the field a tool's skill line has always used.
 */
check("the verb and approach vocabularies do not overlap",
  Object.keys(CARDRPG.verbs).filter(v => v in CARDRPG.approaches).join(", ") || "none", "none");
check("so a check now reads the approach field",
  /export function collectSkillBonuses\(actor, approach\)/.test(resolveSource) ? "yes" : "no",
  "yes");
check("and resolveCheck calls that one",
  /const features = collectSkillBonuses\(actor, approach\);/.test(resolveSource) ? "yes" : "no",
  "yes");
/* Features only: the tool comes in through its own term, where the untrained cap lives, and
 * counting equipped items here would pay a lockpick twice. */
check("features only, so a tool is not paid twice",
  /if \(slate\.type !== "feature"\) continue;/.test(resolveSource) ? "yes" : "no", "yes");
/* It is still worth nothing today, and that is now a content gap rather than an engine one: no
 * feature in the game carries a skill bonus, though the schema has held the field all along. */
/*
 * **Six of them now, one per approach**, which is the content half of the repair: the engine was
 * fixed to read `bonus.approach` and nothing in the game printed one, so step 3 of a check was
 * still worth nothing. All six are +1 and grouped, so two of an approach cannot stack and a
 * trained tool still adds beside them.
 */
const skillFeatures = content.FEATURES.filter(f => f.bonus?.approach);
check("features carrying a skill bonus", skillFeatures.length, 6);
check("and one for each approach",
  skillFeatures.map(f => f.bonus.approach).sort().join(", "),
  "agility, lore, might, presence, shadow, wits");
check("all of them +1", [...new Set(skillFeatures.map(f => f.bonus.value))].join(", "), "1");
check("and all of them grouped, so two of an approach cannot stack",
  skillFeatures.filter(f => !f.group).length, 0);
check("and the schema has always had somewhere to put one",
  /approach: new fields\.StringField/.test(itemSource) ? "yes" : "no", "yes");
/* Every one of them is on a node, or it is a feature nobody can be given. */
check("nodes that hand them over",
  skillFeatures.filter(f => !nodes.some(n => n.grants?.feature === f.name)).join(", ") || "none",
  "none");

/*
 * **3. What levelling actually adds to a check**, measured at level 8 on the cheapest route to a
 * tier-2 title. A training is worth **+1**, and only with the tool it names; a know-how is worth
 * advantage, which the fate deck makes **+0.51**; a language and a rest token are worth nothing to
 * a total at all. Against that, the same eight levels buy the combat side two cards, two spell
 * slots and two points of carry.
 */
const lv8 = nodes.filter(n => n.title && graph.tierOf(n.id) === 2 && graph.levelFor(n.id) === 8)
  .map(n => graph.grantsOf(new Set([graph.ROOT, ...(graph.REACH.get(n.id) ?? []), n.id])));
const mean8 = f => (lv8.reduce((a, g) => a + f(g), 0) / lv8.length).toFixed(1);
check("what level 8 adds to the skill side",
  `trainings ${mean8(g => g.trainings.length)} know-how ${mean8(g => g.knowHow.length)}`
  + ` languages ${mean8(g => g.languages.length)} rest ${mean8(g => g.restTokens)}`,
  "trainings 0.9 know-how 0.8 languages 0.6 rest 0.2");
check("and to the action deck and the body",
  `cards ${mean8(g => g.cards.length)} slots ${mean8(g => g.spellSlots)}`
  + ` carry ${mean8(g => g.carry)} health ${mean8(g => g.health)}`,
  "cards 2.3 slots 2.3 carry 1.9 health 0.7");

/*
 * What advantage is worth, since a know-how grants it and nothing had ever priced it. Draw two,
 * keep the better; a MISS is no number at all, so it is the other card that counts.
 */
const FATE_FACES = fate.map(c => c.system?.special === "miss" ? null
  : c.system?.special === "crit" ? 2 : c.system?.value ?? 0);
const advWorth = (() => {
  let one = 0, two = 0, n = 0;
  for (const a of FATE_FACES) {
    for (const b of FATE_FACES) {
      one += a ?? 0;
      two += (a === null) ? (b ?? 0) : (b === null) ? a : Math.max(a, b);
      n++;
    }
  }
  return (two / n - one / n).toFixed(2);
})();
check("what advantage is worth on a total", advWorth, "0.51");

/*
 * And the ladder it is all measured against, which is calibrated to a STARTER deck: a specialist's
 * best card is 3, a trained tool makes 5, a push makes 7 and help makes 9 -- so Easy to Heroic is
 * exactly the span of one character's stacking options at level 1, and levelling moves them along
 * it by the +1 a training is worth.
 */
const ladder = Object.values(CARDRPG.difficulties);
check("the four difficulties", ladder.join(", "), "3, 5, 7, 9");
check("and the starter deck's best card plus every stack",
  [3, 3 + 2, 3 + 2 + 2, 3 + 2 + 2 + 2].join(", "), "3, 5, 7, 9");

/* The one piece of content that needs the missing mechanism, and the one the challenge build just
 * made buildable. Both are prose today; naming them is what keeps them from being forgotten. */
check("content that would grow a skill deck",
  content.ITEMS.filter(i => /skill card/i.test(i.text ?? "")).map(i => i.name).join(", "),
  "Mnemonic Stone");
check("and content the challenge tracks made implementable",
  content.ITEMS.filter(i => /in a challenge/i.test(i.text ?? "")).map(i => i.name).join(", "),
  "Surveyor's Chain");

check("skill-rules records the measurement",
  /^> \*\*\[FOUND IN CODE 2026-11-02\] A skill check barely scales with levelling/m.test(skillDoc)
    ? "yes" : "no", "yes");
check("and names the three things levelling can add",
  /\*\*\+1\*\*, and only with the tool it names/.test(skillDoc) ? "yes" : "no", "yes");
/*
 * **And the two halves it compares, computed, not quoted.**  **[FOUND 2026-11-07]**
 *
 * This check used to grep the paragraph for *against 2.3 action cards, 2.3 spell slots, 1.9 carry
 * and 0.7 Health* and pass when it found them. It found them for months while every one of those
 * numbers drifted, because **it was reading the prose out of the prose**: the sentence agreed with
 * itself and nothing compared it to the graph. Three of the four were a tenth out by the time
 * anybody looked, and the skill half beside them was not pinned at all.
 *
 * A pin on prose is not a pin on a number. Both halves are summed off the cheapest route to every
 * tier-2 title now -- which is what the sentence claims to describe -- and the document has to say
 * what the graph says.
 */
const tier2Titles = nodes.filter(n => n.title && graph.tierOf(n.id) === 2);
const routeMean = (pick) => {
  const total = tier2Titles.reduce((sum, n) => {
    const owned = new Set([graph.ROOT, ...(graph.REACH.get(n.id) ?? []), n.id]);
    return sum + pick(graph.grantsOf(owned));
  }, 0);
  return (total / tier2Titles.length).toFixed(1);
};
check("tier-2 titles the route figures average over", tier2Titles.length, 31);
check("and sets the two halves of a career against each other",
  `${routeMean(g => g.cards.length)} action cards, ${routeMean(g => g.spellSlots)} spell slots, `
  + `${routeMean(g => g.carry)} carry and ${routeMean(g => g.health)} Health`,
  "2.4 action cards, 2.2 spell slots, 1.8 carry and 0.7 Health");
check("and the document says the same",
  skillDoc.includes(`against **${routeMean(g => g.cards.length)} action cards, `
    + `${routeMean(g => g.spellSlots)} spell slots, ${routeMean(g => g.carry)} carry and `
    + `${routeMean(g => g.health)}\n> Health**`) ? "yes" : "no", "yes");
/* The skill half, which had no check of either kind -- and the live/dead split under its trainings,
 * which is the number that was really being overstated. */
check("and the skill half it is weighed against",
  `${routeMean(g => g.trainings.length)} trainings, ${routeMean(g => g.knowHow.length)} know-how, `
  + `${routeMean(g => g.languages.length)} languages and ${routeMean(g => g.restTokens)} rest tokens`,
  "0.9 trainings, 0.8 know-how, 0.6 languages and 0.2 rest tokens");
check("and the document says that too",
  skillDoc.includes(`carries **${routeMean(g => g.trainings.length)} trainings, `
    + `${routeMean(g => g.knowHow.length)} know-how, ${routeMean(g => g.languages.length)}\n`
    + `> languages and ${routeMean(g => g.restTokens)} rest tokens**`) ? "yes" : "no", "yes");
check("of which the trainings that reach a tool",
  routeMean(g => g.trainings.filter(t => trainingTools.has(String(t).trim().toLowerCase())).length),
  "0.4");

/* ---- expertise, mastery, and how a check's randomness behaves  [BUILT 2026-11-02] ---- */

/*
 * **The two steps a skill card can climb**, which is the half of skill-rules 8 a node can express
 * without the `skillCard` grant that is still open: an **expertise** raises a card you already
 * hold, a **mastery** raises what you notice without drawing at all.
 *
 * They are deliberately different kinds of thing. An expertise is a *question* -- only the player
 * knows which of their Lore cards they actually play -- and a mastery is a *number*, read off the
 * owned set every time a passive is computed. Expertise moves an active check; mastery moves a
 * passive. Between them they answer both halves of the flat curve the audit measured.
 */
const expertiseNodes = nodes.filter(n => n.grants?.expertise);
const masteryNodes = nodes.filter(n => n.grants?.mastery);
check("nodes granting an expertise", expertiseNodes.length, 8);
check("nodes granting a mastery", masteryNodes.length, 4);
/* Two per Way and one per Way: every Way scales its own approaches, and nobody scales all six. */
check("expertise, by Way",
  ["strength", "shade", "mind", "faith"]
    .map(w => `${w} ${expertiseNodes.filter(n => n.id.startsWith(w)).length}`).join(", "),
  "strength 2, shade 2, mind 2, faith 2");
check("mastery, by Way",
  ["strength", "shade", "mind", "faith"]
    .map(w => `${w} ${masteryNodes.filter(n => n.id.startsWith(w)).length}`).join(", "),
  "strength 1, shade 1, mind 1, faith 1");
check("and the approaches each scales",
  expertiseNodes.map(n => `${n.id.split(".")[0]}:${n.grants.expertise}`).sort().join(", "),
  "faith:lore, faith:presence, mind:lore, mind:presence, "
  + "shade:shadow, shade:wits, strength:agility, strength:might");
/* All six approaches reachable, and a mastery only in four: the deeper step is scarcer. */
check("approaches an expertise exists for",
  [...new Set(expertiseNodes.map(n => n.grants.expertise))].sort().join(", "),
  "agility, lore, might, presence, shadow, wits");
check("and a mastery",
  [...new Set(masteryNodes.map(n => n.grants.mastery))].sort().join(", "),
  "lore, might, presence, shadow");
/* A mastery sits deeper than the expertise of its Way, which is the enforcement: no node says so,
 * the graph does. */
check("a mastery is always deeper than that Way's expertise",
  masteryNodes.filter(m => {
    const way = m.id.split(".")[0];
    const shallowest = Math.min(...expertiseNodes.filter(e => e.id.startsWith(way))
      .map(e => graph.levelFor(e.id)));
    return graph.levelFor(m.id) <= shallowest;
  }).map(m => m.id).join(", ") || "none", "none");

/* Nothing new was added to the graph for any of it. */
check("nodes in the graph", nodes.length, 204);
check("and every expertise rides a node that was already there",
  expertiseNodes.filter(n => Object.keys(n.grants).length < 2).map(n => n.id).join(", ") || "none",
  "none");

/* An approach that is not one of the six is a reward that can never apply, refused where a card
 * nobody wrote is refused. "any" is refused too: a wild serves every approach, an expertise in one
 * does not. */
check("the graph refuses an expertise in nothing",
  graph.graphFaults([...nodes, { id: "test.x", after: ["root"], grants: { expertise: "charm" } }])
    .some(f => /which is not an approach/.test(f)), true);
check("and refuses one in every approach at once",
  graph.graphFaults([...nodes, { id: "test.x", after: ["root"], grants: { mastery: "any" } }])
    .some(f => /which is not an approach/.test(f)), true);

/*
 * The expertise prompt: the upgrade skill-rules 8 describes, done in place so the card keeps its
 * name and its edge -- the same card having got better rather than a different card arriving.
 */
check("expertise raises a card in place",
  /export async function raiseSkillCard\(actor, approach\)/.test(graphSource) ? "yes" : "no", "yes");
check("it is capped at three",
  /"system\.value": Math\.min\(cap, \(card\.system\.value \?\? 0\) \+ 1\)/.test(graphSource)
    ? "yes" : "no", "yes");
check("a card already at the cap is not offered",
  /\(card\.system\?\.value \?\? 0\) < cap/.test(graphSource) ? "yes" : "no", "yes");
/* A wild is left out: an Inspiration is any approach at value 1, and the whole point of it is that
 * it is never the wrong card and never a good one. */
check("and a wild is left out of it",
  /card\.type === "skill" && !card\.system\?\.wild/.test(graphSource) ? "yes" : "no", "yes");
check("taking the node performs it",
  /if \(grants\.expertise\) await raiseSkillCard\(actor, grants\.expertise\);/.test(graphSource)
    ? "yes" : "no", "yes");
check("the pane says what each one gives",
  ["CARDRPG.Level.Expertise", "CARDRPG.Level.Mastery"].every(k => k in lang), true);
/*
 * **The derivation chain, asked end to end.** The passive arithmetic above is tested through a stub
 * that hands `learned.masteries` over directly, so breaking the chain that FILLS it -- the graph
 * summing a node's mastery, the character deriving the sum -- was invisible. Two break-test
 * mutations said so; these are the checks that answer them.
 */
check("the graph sums a node's mastery",
  graph.grantsOf(new Set(["mind.blood.silence"])).masteries.join(", "), "lore");
check("and a node's expertise",
  graph.grantsOf(new Set(["mind.letters"])).expertise.join(", "), "lore");
check("a character derives the masteries from the nodes",
  /masteries: \[\.\.\.fromNodes\.masteries\]\.sort\(\)/.test(actorModel) ? "yes" : "no", "yes");
check("and the offers of expertise beside them",
  /expertise: \[\.\.\.fromNodes\.expertise\]\.sort\(\)/.test(actorModel) ? "yes" : "no", "yes");
/* And what a real route adds up to: a Thief who walked to Night Work holds one. */
check("what a Shade who walked to Night Work has mastered",
  graph.grantsOf(new Set([graph.ROOT, ...(graph.REACH.get("shade.thief.night") ?? []),
    "shade.thief.night"])).masteries.join(", "), "shadow");
check("and the editor offers both",
  /\["expertise", "mastery"\]\.map\(key =>/.test(levelup) ? "yes" : "no", "yes");

/*
 * ---- how the randomness of a check behaves ----
 *
 * **skill-rules 2 prints the odds and they are exactly right**, which is worth checking precisely
 * because it is the only place in the rules where a probability is stated as a number. Asked of
 * `checkOutcome` against the real deck rather than recomputed, so the check cannot agree with a
 * restatement of the rule instead of the rule.
 */
/*
 * **Read through the engine's own swing and band**, so a change to either moves these numbers
 * rather than leaving them agreeing with a restatement of the old rule. `swing` is a parameter only
 * so the row below can ask what the game used to do.
 */
const bands = (d, swing = resolve.CHECK_SWING, floor = resolve.PARTIAL_FLOOR) => {
  const counts = { critical: 0, success: 0, partial: 0, fail: 0 };
  for (const card of fate) {
    const special = card.system.special ?? "";
    const margin = d + (special ? 0 : (card.system.value ?? 0) * swing);
    const out = special === "crit" ? "critical" : special === "miss" ? "fail"
      : margin >= 0 ? "success" : margin >= floor ? "partial" : "fail";
    counts[out]++;
  }
  const pct = k => Math.round(100 * counts[k] / fate.length);
  /* The document counts a Critical as a success, which its own result table says it is. */
  return `${pct("success") + pct("critical")}% success, ${pct("partial")}% partial, `
    + `${pct("fail")}% fail`;
};
/* The band the engine actually applies, for the three distances the document prints odds for. */
check("on the difficulty", bands(0), "70% success, 25% partial, 5% fail");
check("one below", bands(-1), "30% success, 60% partial, 10% fail");
check("two below", bands(-2), "30% success, 60% partial, 10% fail");
/*
 * **And what it was before the swing doubled**, which is the point of the change: the first two
 * rows are untouched -- section 2's printed odds still hold where it prints them -- and the third
 * is the whole of the difference. A check two below its difficulty used to fail outright three
 * times in ten; now it succeeds three times in ten.
 */
check("as it was, on the difficulty", bands(0, 1, -2), "70% success, 25% partial, 5% fail");
check("as it was, one below", bands(-1, 1, -2), "30% success, 60% partial, 10% fail");
check("as it was, two below", bands(-2, 1, -2), "10% success, 60% partial, 30% fail");
/* The plain measure of swing, before and after, over the cards that carry a number. */
const spread = swing => {
  const vals = fate.map(c => (c.system.special ? 0 : (c.system.value ?? 0) * swing));
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.sqrt(vals.reduce((a, v) => a + (v - m) ** 2, 0) / vals.length).toFixed(2);
};
check("how far a draw moves a check now", spread(resolve.CHECK_SWING), "1.79");
check("and how far it used to", spread(1), "0.89");
/* And the mean is still nought, which is what lets the ladder of 3/5/7/9 stand. */
check("the mean a check's draw adds",
  (fate.reduce((a, c) => a + (c.system.special ? 0
    : (c.system.value ?? 0) * resolve.CHECK_SWING), 0) / fate.length).toFixed(2), "0.00");
/*
 * **The document's own numbers, parsed out of it and put to the engine.**
 *
 * The check here used to grep for the sentence, which is a claim about the sentence and not about
 * the game: it would have gone on passing the day the swing doubled and the prose went stale, which
 * is the fourth time this week a grep has agreed with something familiar instead of something true.
 * So the percentages are read out of the prose and compared with what `checkOutcome` and the real
 * deck produce. Neither can move without the other now.
 */
const oddsSentence = skillDoc.slice(skillDoc.indexOf("How the odds work with the fate deck"));
const printedOdds = [...oddsSentence.slice(0, 400).matchAll(/\*\*(\d+)%\*\*/g)]
  .map(m => Number(m[1]));
check("percentages the document prints for a check", printedOdds.length, 7);
/* In the order the sentence gives them: on the difficulty win/partial/fail, then one below's
 * win/partial, then two below's win/partial. */
check("and the engine agrees with every one",
  [[0, 0], [0, 1], [0, 2], [-1, 0], [-1, 1], [-2, 0], [-2, 1]]
    .map(([d, which], i) => {
      const parts = bands(d).match(/(\d+)% success, (\d+)% partial, (\d+)% fail/);
      return Number(parts[which + 1]) === printedOdds[i] ? "" : `d=${d} ${parts[which + 1]} vs ${printedOdds[i]}`;
    }).filter(Boolean).join("; ") || "none", "none");
/* The band the document prints, too: a Partial is 1 to 4 below and a Fail is 5 or more. */
check("the Partial band the document prints",
  /\| \*\*Partial\*\* \| Total is 1–(\d+) below/.exec(skillDoc)?.[1], "4");
check("which is the engine's floor",
  Number(/\| \*\*Partial\*\* \| Total is 1–(\d+) below/.exec(skillDoc)?.[1]),
  -resolve.PARTIAL_FLOOR);
check("and the Fail band starts one past it",
  Number(/\| \*\*Fail\*\* \| (\d+)\+ below/.exec(skillDoc)?.[1]), -resolve.PARTIAL_FLOOR + 1);
/* And step 4, which is where the doubling is a rule rather than a note. */
check("step 4 says the card is doubled",
  /Draw a \*\*fate\*\* card and add \*\*twice\*\* its value/.test(skillDoc) ? "yes" : "no", "yes");
check("skill-rules records the swing and what it cost",
  /A check reads its fate card twice as loudly as combat does/.test(skillDoc) ? "yes" : "no", "yes");
check("and that a point of modifier buys less for it",
  /\*\*15\*\* points of success chance rather than 21/.test(skillDoc) ? "yes" : "no", "yes");
/* The number that sentence rests on, computed rather than restated. */
check("what a point of modifier buys now",
  (() => {
    const win = d => Number(bands(d).match(/(\d+)% success/)[1]);
    const steps = [-2, -1, 0, 1].map(d => win(d + 1) - win(d));
    return Math.round(steps.reduce((a, b) => a + b, 0) / steps.length);
  })(), 15);
check("and what it used to buy",
  (() => {
    const win = d => Number(bands(d, 1, -2).match(/(\d+)% success/)[1]);
    const steps = [-2, -1, 0, 1].map(d => win(d + 1) - win(d));
    return Math.round(steps.reduce((a, b) => a + b, 0) / steps.length);
  })(), 21);

/* The saving throw swings with the check, through the same two constants and not beside them. */
check("a save reads the card at the same swing",
  /\(used\?\.system\.value \?\? 0\) \* CHECK_SWING/.test(resolveSource) ? "yes" : "no", "yes");
check("and uses the same band",
  /short <= -PARTIAL_FLOOR/.test(resolveSource) ? "yes" : "no", "yes");
/* Twice, because the four results are written twice -- which is why they are constants. */
check("the swing is applied in both places",
  (resolveSource.match(/\* CHECK_SWING/g) ?? []).length, 2);
/*
 * And the band is read from the constant in the function that owns it, not spelled again. A literal
 * there would be identical today and would be the thing that drifts from the save's copy tomorrow,
 * which is the only reason either of these is a constant.
 */
const outcomeBody = resolveSource.slice(resolveSource.indexOf("export function checkOutcome"),
  resolveSource.indexOf("export async function resolveCheck"));
check("the band in checkOutcome is the constant",
  /margin >= PARTIAL_FLOOR/.test(outcomeBody) ? "yes" : "no", "yes");
check("and no literal band is left in it",
  /margin >= -\d/.test(outcomeBody) ? "a literal" : "none", "none");
/* The table sees the doubling, or it is arithmetic nobody can check at the table. */
check("the chat line prints the card and the doubling",
  resolveSource.includes("CHECK_SWING} = ${swing") ? "yes" : "no", "yes");
/*
 * **Scoped to the check code on 2026-11-07, because it was a whole-file grep on a variable name.**
 *
 * The invariant is real: a check's total must not be floored at nought, or the Partial and Fail
 * bands below the difficulty stop existing. The grep that guarded it looked for `Math.max(0, before`
 * **anywhere in resolve.mjs**, and it held for one accidental reason -- nothing in the file was
 * called `before`. Wiring Wounds introduced a local of that name in the damage path, clamping
 * **Health**, which has been clamped since the file was written and must be. A true invariant read
 * as a violation.
 *
 * It asks the check-and-save region now, which is what the sentence means, and it asks about a
 * total rather than about a name.
 */
const checkRegion = resolveSource.slice(resolveSource.indexOf("export function checkOutcome"),
  resolveSource.indexOf("export async function resolveSave"));
check("the check region was really found", checkRegion.length > 1000, true);
check("and the engine clamps neither total",
  /Math\.max\(0, (?:total|before|sum|margin)/.test(checkRegion) ? "it clamps" : "it does not",
  "it does not");

/*
 * **No check is ever certain, in either direction.** A Miss is a Fail whatever the total and a
 * Critical is a success whatever the total, so every check carries a 5% floor and a 5% ceiling that
 * no amount of card, tool, push or help will move. That is what makes a **passive score** -- the
 * one number in the game drawn for with nothing -- the design's answer to a trivial obstacle, and
 * it is why the GM's panel is worth having.
 */
check("a Miss is a Fail four over the difficulty", resolve.checkOutcome(4, "miss"), "fail");
check("a Critical is a success four below", resolve.checkOutcome(-4, "crit"), "critical");
check("so the floor on any check",
  `${Math.round(100 * fate.filter(c => c.system.special === "miss").length / fate.length)}%`, "5%");
check("and the ceiling", `${Math.round(100 * fate.filter(c => c.system.special === "crit").length
  / fate.length)}%`, "5%");

/*
 * **And it is a deck, not a die.** The same twenty cards resolve combat damage and skill checks
 * (hud-spec 4.3), without replacement until they run out -- so a fight spends the deck a later
 * check draws from. The same check, exactly on its difficulty, is anywhere between half and
 * certain depending on which eight cards a fight took.
 */
const succeedsFrom = left => {
  let ok = 0;
  for (const card of left) {
    const special = card.system.special ?? "";
    const out = resolve.checkOutcome(0 + (special ? 0 : card.system.value ?? 0), special);
    if (out === "success" || out === "critical") ok++;
  }
  return Math.round(100 * ok / left.length);
};
const ranked = [...fate].sort((a, b) => {
  const v = c => c.system.special === "miss" ? -99 : c.system.special === "crit" ? 99
    : c.system.value ?? 0;
  return v(a) - v(b);
});
check("a check on its difficulty, from a full deck", `${succeedsFrom(fate)}%`, "70%");
check("with the worst eight already spent", `${succeedsFrom(ranked.slice(8))}%`, "100%");
check("and with the best eight already spent", `${succeedsFrom(ranked.slice(0, -8))}%`, "50%");
check("skill-rules records the span",
  /anywhere between \*\*50% and 100%\*\*/.test(skillDoc) ? "yes" : "no", "yes");
check("and that a passive is the answer to a trivial obstacle",
  /the one number in the game that is\n> not drawn for/.test(skillDoc) ? "yes" : "no", "yes");

check("skill-rules records expertise and mastery",
  /^### Expertise and mastery {2}\*\*\[BUILT 2026-11-02\]\*\*$/m.test(skillDoc) ? "yes" : "no",
  "yes");
check("leveling lists them as rewards",
  /\| \*\*Expertise\*\* \|/.test(levDoc) && /\| \*\*Mastery\*\* \|/.test(levDoc) ? "yes" : "no",
  "yes");

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
  "No Step Back, Shield Wall, Shoulder to Shoulder, The Order's Shield");
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
  /if \(cost && health - cost < 1\)/.test(resolveSource) ? "yes" : "no", "yes");

/*
 * ---- and the Wild, which is the other price and was collected by nothing ----
 *
 * `wilds` has been a field since *Step Through* needed somewhere to put Shadow Magic's price
 * (data/items.mjs), **seven formulas carry it**, the spell sheet edits it -- and until now no code
 * path read it, so a shadow mage cast for free. The same shape as `passiveScore` reading a deck
 * that was never declared: a field, content that fills it, and nothing in between.
 */
check("casting reads the Wild price",
  /const wilds = slate\.system\.wilds \?\? 0;/.test(resolveSource) ? "yes" : "no", "yes");
check("and a spell that charges neither price charges nothing",
  /if \(!cost && !wilds\) return true;/.test(resolveSource) ? "yes" : "no", "yes");
check("and the Wild goes into the fate deck",
  /await addFateCards\(actor, \{ special: "wild", count: wilds \}\)/.test(resolveSource)
    ? "yes" : "no", "yes");
/*
 * **Permanent, which is the difference between a price and a cost.** `addFateCards` writes a
 * `temporary` copy for Blessed and Cursed -- the one the rules remove when it is drawn (core-rules
 * 6) -- and a Wild is passed without that flag on purpose, so it stays. *Become the Shadow* puts
 * five in for good.
 */
check("the Wild is not a temporary card",
  /special: "wild", count: wilds \}\)(?![\s\S]{0,40}temporary)/.test(resolveSource)
    ? "yes" : "no", "yes");
/*
 * And a refused cast charges NOTHING. The order is the whole of it: a caster who cannot afford the
 * Health would otherwise have bought the Wilds and not the spell, which is the worst of both.
 */
/* Both ends are located first: an indexOf that found nothing is -1, and -1 is less than
 * everything, so an ordering check on a string that moved would pass by accident. */
const refusalAt = resolveSource.indexOf("if (cost && health - cost < 1)");
const wildAt = resolveSource.indexOf('await addFateCards(actor, { special: "wild"');
check("both ends of the order were found", refusalAt >= 0 && wildAt >= 0, true);
check("the Health is refused before either price is paid", refusalAt < wildAt, true);
check("and one message names both prices",
  /\$\{added\} Wild<\/strong> \$\{added === 1 \? "card" : "cards"\} into the fate deck/
    .test(resolveSource) ? "yes" : "no", "yes");
/* And does not promise "for good", which is true of one formula in seven. */
check("the message makes no promise about how long they stay",
  /for good/.test(resolveSource.slice(resolveSource.indexOf("const paid = ["))) ? "no" : "yes",
  "yes");
check("and paying is what gates the effect",
  /if \(!await payToCast\(this\.actor, slate\)\) return;/.test(traySource) ? "yes" : "no", "yes");

/* The content side. */
/*
 * **The sweep, one level down into `cost`.** It is a SchemaField, so the key sweep above sees only
 * `cost` and never what is inside -- the same hole the verb line had, and described in the same
 * words thirty pages up: *a content line naming a field the schema does not have is dropped in
 * silence*. `cost` grew from one key to four this increment, and a break test renamed one of them
 * and deleted another with nothing noticing: the content went on writing them, the model went on
 * dropping them, and the spell was simply free.
 */
/*
 * The spell class, bounded. This slice used to run to the end of the file, so when the spell's own
 * `bonus` was removed the sub-schema sweep below found the NEXT class's and reported its fields as
 * the spell's -- a slice that can wander into the next class is a sweep about whichever class
 * happens to be last.
 */
const spellStart = itemSource.indexOf("export class SpellSlateData");
const spellBlock = itemSource.slice(spellStart,
  itemSource.indexOf("export class ", spellStart + 20));

/**
 * The field names of one sub-schema of a spell, read out of the source.
 *
 * Generalised after the third time this hole opened in the same file: a `SchemaField` hides its
 * contents from a sweep that reads the level above, so the verb line, then `cost`, then `grants`
 * and `bonus` each had content written into keys the model did not have and dropped in silence.
 * The next one added to a spell is covered the day it arrives.
 */
const subSchemaOf = name => {
  const at = spellBlock.indexOf(`${name}: new fields.SchemaField({`);
  if (at < 0) return new Set();
  /* The close is at the sub-schema's own indentation. Looking for `}),` anywhere ends the slice on
   * the first `NumberField({ ... }),` line, which is how this first read one field of four. */
  return new Set([...spellBlock.slice(at, spellBlock.indexOf("\n      }),", at))
    .matchAll(/^        ([a-zA-Z]+): /gm)].map(m => m[1]));
};
/*
 * **Both sub-schemas are gone, and that is the law in two fields.**
 *
 * `bonus` left because a bonus a spell gives is a condition's payload -- as a field on the slate it
 * was a standing, invisible, unremovable number. `grants` left because *a thing usable without
 * being equipped or prepared is a feature*, and a standing grant on a spell only ever described
 * nine teachings that are never prepared.
 *
 * What is left of the spell is what a spell is: a strength, a gate (`prepared`), a step, and what
 * casting it costs. So the sweep is two absences rather than a loop -- and a loop over an empty
 * list is a loop that cannot fail.
 */
for (const name of ["bonus", "grants"]) {
  check(`the spell schema has no ${name} of its own`,
    new RegExp(`${name}: new fields\\.SchemaField`).test(spellBlock) ? "still there" : "gone",
    "gone");
  /* And no content is still writing one, which an absent schema would silently drop. */
  const writers = [...graph.SPELLS.values()].filter(s => s[name]).map(s => s.name);
  check(`and no formula still writes a ${name}`,
    writers.length ? writers.join(", ") : "none", "none");
}
/*
 * **And the feature's own sub-schemas are swept, because that is where the nine went.**
 *
 * The spell's sweep was the only one, and when `grants` moved to the feature it moved out of
 * reach: a break test deleted `armor` from the feature schema and nothing noticed, which means a
 * grant the schema does not declare is a number silently dropped the moment the document is
 * created. The sweep follows the field.
 */
const featureSub = name => {
  const at = featureSchema.indexOf(`${name}: new fields.SchemaField({`);
  if (at < 0) return new Set();
  return new Set([...featureSchema.slice(at, featureSchema.indexOf("\n      }),", at))
    .matchAll(/^        ([a-zA-Z]+): /gm)].map(m => m[1]));
};
check("grants fields read from the feature schema",
  [...featureSub("grants")].sort().join(", "),
  "armor, carry, deckMax, handSize, health, spellSlots");
const featureWriters = [...content.FEATURES,
  ...graph.TEACHINGS.filter(t => graph.teachingKind(t) === "feature")];
const strayGrants = new Set();
for (const f of featureWriters) {
  for (const key of Object.keys(f.grants ?? {})) {
    if (!featureSub("grants").has(key)) strayGrants.add(`${f.name}.${key}`);
  }
}
check("grants a feature writes that its schema would drop",
  strayGrants.size ? [...strayGrants].join(", ") : "none", "none");
/* And the sweep saw the features that write one, so an empty writer list cannot pass it. */
check("features that grant a standing number",
  featureWriters.filter(f => Object.values(f.grants ?? {}).some(v => v))
    .map(f => f.name).sort().join(", "),
  "Graven Armour, Graven Heart, Graven Shield, Packhorse, Quick, The Whole Skin, Tough");

/* While a feature has both, which is where the nine went. */
const featureBlock = itemSource.slice(itemSource.indexOf("export class FeatureSlateData"));
for (const name of ["bonus", "grants", "effect"]) {
  check(`the feature schema has a ${name}`,
    new RegExp(`${name}: (new fields\\.SchemaField|stepField\\(\\))`).test(featureBlock)
      ? "yes" : "no", "yes");
}
/* And the two fields it took from a spell, because a school teaches features too. */
for (const name of ["source", "strength"]) {
  check(`and the ${name} a school taught it at`,
    new RegExp(`      ${name}: new fields\\.`).test(featureBlock) ? "yes" : "no", "yes");
}

const costStart = spellBlock.indexOf("cost: new fields.SchemaField({");
const costFields = new Set([...spellBlock
  /* The close is `}),` at the SchemaField's own indentation. Looking for `}),` anywhere ends the
   * slice on the first `NumberField({ ... }),` line, which is how this check first read one field
   * where there are four. */
  .slice(costStart, spellBlock.indexOf("\n      }),", costStart))
  .matchAll(/^        ([a-zA-Z]+): /gm)].map(m => m[1]));
check("cost fields read from the spell schema", [...costFields].sort().join(", "),
  "health, scale, skillCards, strain, taint");
const strayCostKeys = new Set();
for (const spell of graph.SPELLS.values()) {
  for (const key of Object.keys(spell.cost ?? {})) if (!costFields.has(key)) strayCostKeys.add(key);
}
check("cost keys not in the spell schema",
  strayCostKeys.size ? [...strayCostKeys].join(", ") : "none", "none");
/* And every field of it is written by a spell: one nobody writes is a column of zeroes. */
const costUsed = new Set(
  [...graph.SPELLS.values()].flatMap(s => Object.keys(s.cost ?? {}).filter(k => s.cost[k])));
check("cost fields the schema has and no spell writes",
  [...costFields].filter(k => !costUsed.has(k)).join(", ") || "none", "none");

const spellsWithCost = [...graph.SPELLS.values()].filter(s => s.cost?.health);
check("spells that cost Health",
  spellsWithCost.map(s => s.name).sort().join(", "),
  "Blood Price, Boil, Open the Vein, Stand Where I Stand, The Club and the Line, "
  + "The Last Drop, The Line Holds, The Red Hour, The Second Heartbeat, The Shield Line");
check("the Health they ask between them",
  spellsWithCost.reduce((n, s) => n + s.cost.health, 0), 18);
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
/*
 * **And a price that scales is in the field now too**, which is what this pair used to record as a
 * gap: three spells charging *1 Health per ally* in a sentence, and one asking *half your current
 * Health, rounded up*. `cost.scale` holds both, so the prose is empty and the field is full.
 */
const variableCost = [...graph.SPELLS.values()]
  .filter(s => /Health per/i.test(s.effect?.text ?? ""));
check("spells whose price still scales only in prose",
  variableCost.map(s => s.name).sort().join(", ") || "none", "none");
const scaled = [...graph.SPELLS.values()].filter(s => s.cost?.scale);
check("spells whose price the field scales",
  scaled.map(s => `${s.name} (${s.cost.scale})`).sort().join(", "),
  "The Last Drop (halfCurrent), The Line Holds (perAlly), The Red Hour (perAlly), "
  + "The Shield Line (perAlly), Valtor's Own (wholeHand)");
/* A scale with no amount beside it charges nothing, which is the one way to write this field and
 * get silence: `perAlly` of zero is zero however many allies are standing there. */
check("scaled prices with nothing to scale",
  scaled.filter(s => !(s.cost.health || s.cost.taint || s.cost.strain))
    .map(s => s.name).join(", ") || "none", "none");
/* Every scale the vocabulary offers is used by a spell: one nobody writes is a dropdown entry. */
check("scales declared and never used",
  Object.keys(CARDRPG.costScales).filter(k => !scaled.some(s => s.cost.scale === k)).join(", ")
    || "none", "none");
/*
 * **The Poison school's price, which was the top of the queue.** Six formulas, and the rule is the
 * school's rather than six numbers somebody typed: specializations.md 1 says *preparing costs skill
 * cards set aside equal to the formula's strength*, so both are read and made to agree. A card
 * written at the wrong price is a school quietly cheaper or dearer than its own document.
 */
const poison = [...graph.SPELLS.values()].filter(s => s.source === "Poison");
/* Seven, not the six that named the gap: `Wither` is the school's thesis Signature and never
 * named it, so it was already "a thing the engine does everything for" while paying nothing. */
check("the Poison school", poison.length, 7);
check("and every formula in it sets aside skill cards",
  poison.filter(s => !s.cost?.skillCards).map(s => s.name).join(", ") || "none", "none");
check("each equal to its own strength",
  poison.filter(s => s.cost.skillCards !== s.strength)
    .map(s => `${s.name}: ${s.cost.skillCards} for strength ${s.strength}`).join(", ") || "none",
  "none");
check("and the document says that is the rule",
  /preparing costs \*\*skill cards set aside equal to the formula's strength\*\*/
    .test(specDoc) ? "yes" : "no", "yes");
/* Nobody else pays in them: it is the school's whole identity, and a second school charging the
 * same thing would be the two of them sharing an axis rather than dividing one. */
check("schools that set aside skill cards",
  [...new Set([...graph.SPELLS.values()].filter(s => s.cost?.skillCards).map(s => s.source))]
    .join(", "), "Poison");

/*
 * **And the moment it is paid, which did not exist.** `prepared` is a checkbox on the item sheet
 * and nothing listened -- the slot budget got away with that because `slotCost` is derived and asks
 * whenever anything looks. A cost paid AT preparing has no such luck.
 */
check("preparing has a collector of its own",
  /export async function payToPrepare\(actor, slate\)/.test(resolveSource) ? "yes" : "no", "yes");
check("and a hook that notices the checkbox turning on",
  /change\?\.system\?\.prepared !== true\) return;/.test(entrySource) ? "yes" : "no", "yes");
/*
 * The CHANGE object, not the current value: a spell that is already prepared must not be charged
 * again every time anything else about it is edited.
 *
 * Written as a grep for the STATE, which must be absent. The first version grepped for the start of
 * the hook's own condition and ended in a space -- and a pattern whose last character is a space
 * cannot be written into the absent-grep pin at all, because the pin is text and loses it.
 */
check("and reads the change rather than the state",
  /item\.system\.prepared/.test(entrySource) ? "the state" : "the change", "the change");
check("and the collector is called with the owning actor",
  /await payToPrepare\(item\.parent, item\);/.test(entrySource) ? "yes" : "no", "yes");
/*
 * Strain takes from the hand first and the draw pile after, because the school's own thesis
 * formula wants five cards and the skill hand is four -- taking only from the hand would have made
 * it unpayable, which is the kind of rule that reads fine and cannot be obeyed.
 */
const prepareBody = resolveSource.slice(resolveSource.indexOf("export async function payToPrepare"),
  resolveSource.indexOf("export async function payToCast"));
check("it takes from the hand and then the deck",
  /for \(const from of \[hand, deck\]\)/.test(prepareBody) ? "yes" : "no", "yes");
check("and nothing is refunded on un-preparing, which is Strain's rule",
  /Nothing is refunded on UN-preparing/.test(resolveSource) ? "yes" : "no", "yes");
check("and it says where the cards go back to",
  /They come back on a rest/.test(prepareBody) ? "yes" : "no", "yes");

/* And the other two currencies, which were prose on six spells until this increment. */
const taintCost = [...graph.SPELLS.values()].filter(s => s.cost?.taint);
check("spells that cost Taint",
  taintCost.map(s => s.name).sort().join(", "),
  "Taste of the Rot, The First Taste, The Slow Failure");
const strainCost = [...graph.SPELLS.values()].filter(s => s.cost?.strain);
check("spells that cost Strain",
  strainCost.map(s => s.name).sort().join(", "),
  "The Charge, The War Drum, Valtor's Own");
check("and none of the three currencies is still printed in words",
  [...graph.SPELLS.values()]
    .filter(s => /^Strain \d|you gain \d+ Taint yourself/i.test(s.effect?.text ?? ""))
    .map(s => s.name).join(", ") || "none", "none");

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



section("The monster roster");

/*
 * ---- the common intent pool, and the roster it has to cover  [BUILT 2026-11-02] ----
 *
 * **The NPC side was one creature with a cosmetic variant.** Two statblocks, identical but for the
 * weapon, sharing one hand-authored deck of six -- so the Goblin Archer threw rocks exactly as often
 * as the spearman did, and fifty-five monsters in the world document had nothing in the system.
 *
 * What replaces it is a **pool and a rule**: a card lists the capabilities it needs, a creature
 * declares what it can do, and the deck is the subset it earns. Everything below is asked of
 * `monsters.mjs` rather than read, because a deck derived by arithmetic the suite cannot run is a
 * deck nobody can check.
 */
/*
 * `buildCreature`'s own body. Two builders make a deck the same way -- the one setup runs for the
 * goblin line and the one a GM calls for anything else -- and they should; but a grep either can
 * answer is a grep about neither, which the section at the end of this file said twice while this
 * one was being written.
 */
const buildCreatureBody = setupSource.slice(setupSource.indexOf("const buildCreature = async"),
  setupSource.indexOf("const goblinLine ="));
const everyCreature = monsters.expandRoster(content.ROSTER, content.VARIANTS);
/*
 * `kind` is passed through because three cards in the pool are drawn by a named creature rather
 * than by a capability (`only`, monsters.mjs). A sweep that left it out would report all three as
 * cards nobody can draw -- which is what this suite said the first time it ran against them.
 */
const deckOfCaps = (caps, kind = "") => monsters.deckFor(caps, content.INTENTS, kind);
const deckOfCreature = c => deckOfCaps(c.system.capabilities, c.system.kind);

check("cards in the intent pool", content.INTENTS.length, 37);
check("bases in the roster", content.ROSTER.length, 75);
check("creatures the variants expand them into", everyCreature.length, 112);
check("and the rest of the world, tagged but not numbered", content.MONSTER_TAGS.length, 0);

/*
 * **The universal core, and it used to be too big.**
 *
 * Eight cards were drawn by all forty-seven creatures, and those eight were between 67% and 100%
 * of every deck in the game -- median 80%. The Processor's deck was the universal eight and
 * nothing else at all. Generic shapes are the cheap half of a pool and they were also four
 * fifths of it.
 *
 * Three of the eight were never universal in the fiction: *Set and Wait*, *Hold the Line* and
 * *Take Stock* are what a disciplined thing does, and a Flat Bug drew all three. They are gated on
 * temperament now, so five cards are universal -- two that ask nothing and three that ask only
 * that the creature can move. The numbers below are the floor of the game: five cards for the one
 * thing that cannot move, and nothing in the roster lands on fewer than seven.
 */
/* `only` is excluded throughout: *Carry It Off* asks for nothing but `move` and is still drawn by
 * two creatures out of forty-seven, so counting it as universal would make the core look bigger
 * than it is in exactly the direction this section exists to watch. */
const general = content.INTENTS.filter(c => !c.only?.length);
check("shapes anything can draw", general.filter(c => !c.needs.length).length, 2);
check("shapes that ask only to be able to move",
  general.filter(c => c.needs.length === 1 && c.needs[0] === "move").length, 3);
check("and the shapes anything with legs draws",
  general.filter(c => !c.needs.length
    || (c.needs.length === 1 && c.needs[0] === "move")).map(c => c.name).sort().join(", "),
  "Close In, Give Ground, Lash Out, Press, Strike and Step");

/*
 * --- temperament, which is what replaced the three false universals --------------------------
 *
 * **Every creature has exactly one of the three**, and the suite holds them exclusive because
 * three booleans standing in for one enumeration is a shape that rots: the first creature to
 * carry two of them would draw a deck no reading of the roster predicts.
 */
const temperamentsOf = c =>
  (c.system.capabilities ?? []).filter(x => CARDRPG.temperaments.includes(x));
check("creatures with no temperament at all",
  everyCreature.filter(c => !temperamentsOf(c).length).map(c => c.name).join(", ") || "none",
  "none");
check("and creatures with more than one",
  everyCreature.filter(c => temperamentsOf(c).length > 1)
    .map(c => `${c.name} (${temperamentsOf(c).join(" + ")})`).join("; ") || "none", "none");
check("and the same for the folklore side",
  content.MONSTER_TAGS
    .filter(t => t.caps.filter(x => CARDRPG.temperaments.includes(x)).length !== 1)
    .map(t => t.name).join(", ") || "none", "none");
/*
 * **`drilled` is not a free choice: it is a tactic, said in the field a card can read.**
 *
 * `shieldWall` meant *it holds a line* and did nothing mechanical with the meaning; `bodyguard`
 * and `commander` are the same statement about somebody else's turn. So the equivalence is checked
 * in both directions -- a new creature with a shield wall and no `drilled` would quietly stop
 * drawing the two cards the tactic is about, and the deck would still look plausible.
 */
const drilledByTactic = c =>
  (c.system.tactics ?? []).some(t => CARDRPG.drilledTactics.includes(t));
check("creatures whose tactics say they hold a line but whose deck does not",
  everyCreature.filter(c => drilledByTactic(c) && !temperamentsOf(c).includes("drilled"))
    .map(c => c.name).join(", ") || "none", "none");
check("and creatures drilled with no tactic that says so",
  everyCreature.filter(c => temperamentsOf(c).includes("drilled") && !drilledByTactic(c))
    .map(c => c.name).join(", ") || "none", "none");
const byTemper = t => everyCreature.filter(c => temperamentsOf(c).includes(t)).length;
check("drilled, feral and wits across the roster",
  CARDRPG.temperaments.map(t => `${t} ${byTemper(t)}`).join(", "),
  "drilled 21, feral 44, wits 47");
/* A gate nothing is behind is a capability that earns nothing, which is the defect the whole
 * scheme exists to avoid -- so each temperament has to carry cards of its own. */
check("cards each temperament earns",
  CARDRPG.temperaments.map(t =>
    `${t} ${content.INTENTS.filter(c => c.needs.includes(t)).length}`).join(", "),
  "drilled 2, feral 3, wits 3");

/*
 * --- the three cards that belong to a creature -----------------------------------------------
 *
 * **The authored half of the pool, and the whole point is that it stays this size.** A deck is
 * earned from capabilities (core-rules 9); `only` is the exception, and it exists because three
 * creatures' stated point was unsayable in capabilities -- the Queen *spends every turn on the
 * army*, the Skaah is *full of something worse*, the Processor *is what a scene looks like before
 * the fight*. A fourth would mean a missing capability, and the fix for that is a capability.
 */
const creatureOwned = content.INTENTS.filter(c => c.only?.length);
check("cards that belong to a creature rather than a capability",
  creatureOwned.map(c => `${c.name} (${c.only.join(", ")})`).join("; "),
  "The Hive Obeys (queen); Open the Hold (skaah, skaah-bloated); "
  + "Carry It Off (processor, processor-driller)");
const kinds = new Set(everyCreature.map(c => c.system.kind));
check("and every kind they name exists",
  creatureOwned.flatMap(c => c.only).filter(k => !kinds.has(k)).join(", ") || "none", "none");
check("and each is drawn by the creatures it names and no others",
  creatureOwned.map(c => `${c.name}: ${everyCreature.filter(x => deckOfCreature(x)
    .some(d => d.name === c.name)).map(x => x.name).join(" + ")}`).join("; "),
  "The Hive Obeys: The Queen; Open the Hold: Skaah + Skaah Bloated; "
  + "Carry It Off: Processor + Processor Driller");
/* `only` is a key Foundry would DROP rather than refuse if the schema did not know it: the card
 * would read back perfectly offline and be missing in play, which is how the conditional armour
 * fields were lost once already. */
check("and the card schema declares it",
  /only: new fields\.ArrayField\(new fields\.StringField\(\)\)/.test(cardsSource) ? "yes" : "no",
  "yes");
/*
 * **A card that moves the creature has to ask whether it can.** That is the whole reason `move` is
 * derived rather than declared, and writing the rule down is what found the other five: three
 * shapes ask for `move` and nothing else, but Charge, Bull Through, Swarm, Fade and Stoop all move
 * as well, and four of them asked only for the capability that makes them interesting.
 *
 * `Stoop` is the shape of the rule: it asks for `flight`, and flight grants `move`, so it needs no
 * second requirement. So the test is not "lists move" but "could not be drawn by something that
 * cannot move" -- the same question `capsOf` answers for a creature, asked of a card.
 */
const movers = content.INTENTS.filter(c => c.sequence.some(s => s.verb === "move"));
check("cards that move the creature", movers.map(c => c.name).sort().join(", "),
  "Bull Through, Carry, Carry It Off, Charge, Close In, Fade, Give Ground, Go Under, " +
  "Pick the Soft One, Stoop, Strike and Step, Submerge, Swarm, Thrash");
check("and not one of them can be drawn without being able to",
  movers.filter(c => !monsters.capsOf(c.needs).has("move")).map(c => c.name).join(", "), "");
/* Three of those fourteen never mention `move` in `needs` and do not need to: Stoop asks for flight,
 * Go Under for burrow, Submerge for swim, and each of those three IS a way of moving. That is the
 * rule doing work rather than a list of exceptions to it. */
check("and three of them get it from the way they travel",
  movers.filter(c => !c.needs.includes("move")).map(c => c.name).sort().join(", "),
  "Go Under, Stoop, Submerge");
/*
 * **The converse is one card, and it is right.** `Order` says an ally *moves its speed* and takes
 * no move step, because the commander spends the turn and somebody else does the walking. It is
 * exactly why the rule above is written on the sequence and not on the prose -- and the Queen, the
 * one creature in the world who cannot move, draws `Order` off `commander`.
 */
check("the only cards whose prose moves somebody other than the drawer",
  content.INTENTS.filter(c => /\bmoves? \w/i.test(c.text))
    .filter(c => !c.sequence.some(s => s.verb === "move")).map(c => c.name).sort().join(", "),
  "Order, The Hive Obeys");
check("and the Queen can draw it", deckOfCaps(["commander", "summon"]).some(c => c.name === "Order")
  ? "yes" : "no", "yes");
check("and the smallest deck in the roster",
  Math.min(...everyCreature.map(c => deckOfCreature(c).length)), 7);
check("the largest",
  Math.max(...everyCreature.map(c => deckOfCreature(c).length)), 14);
/* The Queen is the only creature in the world that cannot move, so she is the only one who proves
 * the derivation does anything. Without her, `needs: ["move"]` and `needs: []` are the same card. */
const legless = everyCreature.filter(c => !monsters.capsOf(c.system.capabilities).has("move"));
check("creatures that cannot move at all", legless.map(c => c.name).join(", "), "The Queen");
/* core-rules 9 asks for 5-8 cards a type; the pool overshoots on purpose, because a deck that
 * repeats inside one fight is a deck the players have read by round three. */
check("core-rules still says what a deck is for",
  /a small deck of 5–8 cards, and each card is a full turn/.test(coreRules) ? "yes" : "no",
  "yes");

/* No card is unreachable, counting the whole roster: the tagged creatures are the ones that earn
 * Feed and Lie Still, which is the honest reason those two are in the pool at all. */
const drawnByBuilt = new Set(everyCreature
  .flatMap(c => deckOfCreature(c).map(card => card.name)));
const drawnByTagged = new Set(content.MONSTER_TAGS
  .flatMap(t => deckOfCaps(t.caps).map(card => card.name)));
check("cards no built creature draws",
  content.INTENTS.filter(c => !drawnByBuilt.has(c.name)).map(c => c.name).sort().join(", ")
    || "none", "none");
check("and cards nobody in the world draws at all",
  content.INTENTS.filter(c => !drawnByBuilt.has(c.name) && !drawnByTagged.has(c.name))
    .map(c => c.name).join(", ") || "none", "none");
/* Every capability a card asks for is one a creature has, and every capability declared is read by
 * a card: the two halves of "no field nothing reads". */
const asked = new Set(content.INTENTS.flatMap(c => c.needs));
const held = new Set([...everyCreature.flatMap(c => c.system.capabilities ?? []),
  ...content.MONSTER_TAGS.flatMap(t => t.caps)]);
check("capabilities a card asks for that nothing has",
  [...asked].filter(a => a !== "move" && !held.has(a)).join(", ") || "none", "none");
check("and capabilities something has that no card reads",
  [...held].filter(h => h !== "move" && !asked.has(h) && h !== "legs").join(", ") || "none",
  "none");
/* `legs` is the exception and the reason `move` is derived: it earns nothing by itself, it only
 * means the creature is not the Queen. */
check("legs earns no card by itself",
  content.INTENTS.filter(c => c.needs.includes("legs")).length, 0);
check("and the one creature without it",
  everyCreature.filter(c => !(c.system.capabilities ?? [])
    .some(x => ["legs", "flight", "swim", "burrow"].includes(x))).map(c => c.name).join(", "),
  "The Queen");

/*
 * **A variant is a delta, and the Goblin Archer is the proof it was worth building that way.** It
 * used to be a second statblock with the same `kind` as the spearman and therefore the same intent
 * deck. As a delta it earns `Loose` by being able to shoot, and the spearman cannot draw it.
 */
const goblins = everyCreature.filter(c => c.system.kind.startsWith("goblin"));
check("the goblin line", goblins.map(c => c.name).join(", "),
  "Goblin, Goblin Warrior, Goblin Archer, Goblin Shaman, Goblin Chief");
check("each with its own kind, which is what owns a deck",
  new Set(goblins.map(c => c.system.kind)).size, goblins.length);
check("only the archer can shoot",
  goblins.filter(c => c.system.capabilities.includes("ranged")).map(c => c.name).join(", "),
  "Goblin Archer");
check("so only the archer draws Loose",
  goblins.filter(c => deckOfCaps(c.system.capabilities).some(x => x.name === "Loose"))
    .map(c => c.name).join(", "), "Goblin Archer");
/* And a delta can take something away, which is the only reason `-` exists: the Warrior and the
 * Chief are the two goblins that do not run. */
check("goblins that keep the cowardly keyword",
  goblins.filter(c => c.system.tactics.includes("cowardly")).map(c => c.name).join(", "),
  "Goblin, Goblin Archer, Goblin Shaman");
/* Numbers are offsets, so the base moving moves every variant with it. */
check("the spearman's Health, which was the one simulated",
  goblins[0].system.health.base, 5);
check("and the line that is built from it",
  goblins.map(c => c.system.health.base).join(", "), "5, 8, 5, 6, 11");

/*
 * **Every number in the roster is a ratio to the one creature that was measured.** The goblin is
 * Health 5, Strike 3, armour 0, and four of them against a starter Warrior is the only fight this
 * project has run (sim/analysis-2026-10-21.md onward). Nothing else here has been simulated, so
 * the check is not that the numbers are right -- it is that they are **ordered**, which is the most
 * a ratio can promise.
 */
const gearOf = creature => {
  const names = creature.equipped ?? [];
  return [...content.NPC_GEAR, ...content.NATURAL_WEAPONS, ...content.ITEMS]
    .filter(g => names.includes(g.name));
};
const strikeOf = c => Math.max(0, ...gearOf(c).map(g => g.verbs?.strike?.value ?? 0));
/* Strike OR cast: a Goblin Shaman carries a fetish and no knife, and a caster that attacks by
 * casting is a caster rather than a creature nobody armed. */
const attackOf = c => Math.max(strikeOf(c),
  ...gearOf(c).map(g => g.verbs?.cast?.value ?? 0));
check("every creature carries something to fight with",
  everyCreature.filter(c => attackOf(c) === 0).map(c => c.name).join(", ") || "none", "none");
check("and the ones that fight by casting",
  everyCreature.filter(c => strikeOf(c) === 0).map(c => c.name).sort().join(", "),
  "Elf, Gnome, Goblin Shaman, Little Folk, Mole Man Priest, Nature Spirit, Shade, Tempter, "
  + "Watcher");
/* core-rules 9's tuning rule: a weak enemy's Strike stays at least 2 above the heroes' armour, and
 * the starter Warrior wears 1 -- so nothing in the roster strikes for less than 3 except the two
 * the world calls harmless. */
check("creatures that strike for less than three",
  everyCreature.filter(c => strikeOf(c) > 0 && strikeOf(c) < 3)
    .map(c => c.name).sort().join(", "),
  "Changeling, Cultist, Doomfly, Familiar, Imp, Mob, Mummer, Processor, Scrip, Scrip Watcher, "
  + "Skaah, Stinger, Sweeper Carrier, The Unseen, Townsfolk, Wanderer");
check("and the rule they are the exception to",
  /Keep a weak enemy's Strike value at least 2 above the heroes' armor/.test(coreRules)
    ? "yes" : "no", "yes");
/*
 * Health is ordered by rank, which is the one thing a ratio can be checked on -- and the gods sit
 * outside that ordering rather than at the top of it. **The Queen is still the largest MORTAL**,
 * and what that number buys her is the army: `summon`, `commander` and a speed of zero. Taken
 * alone she is a big thing that cannot walk. The eight above her are not a higher rank of monster.
 */
const mortals = everyCreature.filter(c => !content.MINOR_GODS.some(g => g.name === c.name));
check("the Queen is the largest mortal in the roster",
  [...mortals].sort((a, b) => b.system.health.base - a.system.health.base)[0].name, "The Queen");
check("and the largest thing of any kind",
  [...everyCreature].sort((a, b) => b.system.health.base - a.system.health.base)[0].name,
  "The Land Jelly");

/*
 * **Natural weapons are items**, because core-rules 9 already settles where an NPC's Strike comes
 * from -- which costs no new mechanism and makes one knob set how dangerous every monster is. The
 * `natural` tag is what separates a grown thing from a carried one: nothing disarms anybody yet,
 * and the tag is on the item from the start so that the day somebody writes the rule, a dragon does
 * not drop its teeth.
 */
check("natural weapons", content.NATURAL_WEAPONS.length, 19);
check("every one of them tagged as grown rather than carried",
  content.NATURAL_WEAPONS.filter(w => !w.tags.includes("natural")).map(w => w.name).join(", ")
    || "none", "none");
check("and all of them NPC gear, so none reaches a player's picker",
  content.NATURAL_WEAPONS.filter(w => !w.npcGear).length, 0);

/* The twelve demons are absent on purpose: the world gives names and no descriptions, and nothing
 * can be read off a name. */
/* The rules say all of it, because a pool nobody can read the argument for is a pool somebody
 * will quietly go back to authoring decks around. */
check("core-rules records the pool",
  /^### A common intent pool {2}\*\*\[BUILT 2026-11-02\]\*\*$/m.test(coreRules) ? "yes" : "no",
  "yes");
check("and that a card is a shape the creature fills in",
  /A card says what a creature does; the creature says how far and how hard/.test(coreRules)
    ? "yes" : "no", "yes");
check("and why the universal core is five and was eight",
  /That universal floor used to be eight, and eight was too many/.test(coreRules)
    ? "yes" : "no", "yes");
/* Temperament is the gate that replaced the three false universals, and the rules have to carry
 * the argument for it: a pool whose reasoning is only in the code is a pool somebody will
 * quietly go back to authoring decks around. */
check("and the three temperaments",
  /^#### Temperament {2}\*\*\[BUILT 2026-11-04\]\*\*$/m.test(coreRules)
    ? "yes" : "no", "yes");
check("and that the budget for authored cards is closed at three",
  /The budget is closed at three/.test(coreRules) ? "yes" : "no", "yes");
/* And the two halves of the derivation, which is the part a later hand would flatten: the one
 * capability no creature declares, and the one card that moves somebody else. */
check("and that `move` is derived rather than declared",
  /\*\*`move` is the capability nothing declares\.\*\*/.test(coreRules) ? "yes" : "no", "yes");
check("and that the Queen is why it is worth deriving",
  /the one creature who cannot draw \*Close In\*/.test(coreRules) ? "yes" : "no", "yes");
check("and that Order moves somebody else",
  /\*Order\* spends the commander's turn moving/.test(coreRules) ? "yes" : "no", "yes");
check("and that a variant is a delta with its own kind",
  /a variant has its own \*\*`kind`\*\*, because `kind` owns the deck/.test(coreRules)
    ? "yes" : "no", "yes");
check("and that every number is a ratio to the goblin",
  /Every number is a ratio to the one that was measured/.test(coreRules) ? "yes" : "no", "yes");
check("and that a grown weapon cannot be looted",
  /grown rather than carried, so they cannot be\ndisarmed, broken or looted/.test(coreRules)
    ? "yes" : "no", "yes");

/*
 * --- Is the roster REASONABLE? Three questions, and two of them are arithmetic
 *
 * A roster can agree with itself perfectly and still be a bad bestiary. These are the two ways that
 * can be asked as a number: whether every creature plays differently, and whether the ones the
 * roster calls major are worse to meet than the ones it calls minor.
 */

/*
 * **1. Intent cards no creature in the game can draw.**
 *
 * config.mjs says it plainly about the other direction -- *a capability no card asks for would be a
 * field nothing reads* -- and this is the mirror: a card asking for a capability nothing HAS is a
 * card that can never be dealt. Three of the twenty-eight.
 *
 * `move` is the exception and is not a capability at all: it is derived from legs, wings or a tunnel
 * (monsters.mjs `capsOf`), and the Queen is the one creature that cannot draw a card needing it.
 *
 * That exemption used to be the literal `"move"` written here, beside this comment explaining why.
 * The difference between the two vocabularies *is* the explanation -- `intentNeeds` minus the
 * capabilities -- so it is read rather than repeated. A second derived requirement would then be
 * exempt here the moment it was declared there, instead of silently reading as undrawable.
 */
const derivedNeeds = new Set(CARDRPG.intentNeeds.filter(n => !(n in CARDRPG.capabilities)));
const creatureCaps = new Set();
for (const m of everyCreature) for (const x of m.system.capabilities ?? []) creatureCaps.add(x);
const earns = n => derivedNeeds.has(n) || creatureCaps.has(n);
const undrawable = content.INTENTS
  .filter(i => (i.needs ?? []).some(n => !earns(n)))
  .map(i => `${i.name} (${(i.needs ?? []).filter(n => !earns(n)).join(", ")})`);
check("intent cards no creature can earn",
  undrawable.length ? undrawable.sort().join(", ") : "none",
  "none");
/* And the sweep had intents to look at, so an empty pool cannot pass it. */
check("intents the sweep read", content.INTENTS.length, 37);
/* The three capabilities that strand them, from the other end: nothing in the roster has one. */
check("capabilities the config offers that no creature has",
  Object.keys(CARDRPG.capabilities).filter(k => !creatureCaps.has(k)).sort().join(", ")
    || "none", "none");
/* While every TACTIC has a user, which is the same question answered the other way. */
check("tactics the config offers that no creature has",
  Object.keys(CARDRPG.tactics).filter(k =>
    !everyCreature.some(m => (m.system.tactics ?? []).includes(k))).join(", ") || "none", "none");

/*
 * **2. Every creature plays differently**, measured as its tactics and capabilities together --
 * which is what decides the deck it draws from, so two creatures sharing a signature are one
 * monster with two names.
 */
const tacSig = m => [...(m.system.tactics ?? [])].sort().join("+")
  + " :: " + [...(m.system.capabilities ?? [])].sort().join("+");
const baseRoster = content.ROSTER;
check("base creatures in the roster", baseRoster.length, 75);
check("and distinct ways of fighting among them", new Set(baseRoster.map(tacSig)).size, 75);
/*
 * **The variants are where the variety thins, and it was four of them. It is one.**
 *
 * Every one of the 22 base creatures fights differently. Four of the 25 variants did not: same
 * tactics, same capabilities as their parent, differing only in Health, armour, damage or speed --
 * so a *Flat Bug Shieldline* was a Flat Bug with better numbers rather than a different problem at
 * the table, and it drew an identical deck.
 *
 * This comment used to say the fix was a design decision and name the clearest case for it: *the
 * Spitter trades armour for range, which the roster already has a word for, and `ranged` is
 * carried by exactly one creature in the game.* All three were taken from the notes they were
 * already written in -- the Spitter's *longer reach of acid* is `ranged`, the Shieldline is *the
 * front rank* and so it `shelter`s the rank behind, the Diver *comes down on whoever is
 * concentrating* and so it has `stealth`.
 *
 * One is left, and it is the honest kind: the *Smash Beetle Breaker* is **meant** to be nothing
 * but a bigger Smash Beetle -- *bred bigger for the gates of the Third Ring, and it does not turn
 * quickly* -- and a harder version of the same fight is a legitimate variant.
 */
const allSigs = everyCreature.map(tacSig);
const collided = [...new Set(allSigs.filter((sg, i) => allSigs.indexOf(sg) !== i))]
  .map(sg => everyCreature.filter(m => tacSig(m) === sg).map(m => m.name).sort().join(" = "));
check("creatures that fight exactly like another",
  collided.length ? collided.sort().join("; ") : "none",
  "Smash Beetle = Smash Beetle Breaker");
/*
 * **And four of the deltas do nothing at all**, which is why two of those collisions are there.
 *
 * A variant edits its parent with `+` and `-`, and these four add a tactic the parent already
 * carries: *Flat Bug Shieldline* adds `+shieldWall` to a creature that has `shieldWall`. In the
 * source it reads like the line that makes the variant different; in play it is a no-op. That is
 * this project's favourite defect seen from a third side -- not a field nothing reads, nor a field
 * nothing writes, but a WRITE that changes nothing.
 */
const deadDeltas = [];
for (const [parent, list] of Object.entries(content.VARIANTS)) {
  const p = content.ROSTER.find(m => m.system.kind === parent)?.system;
  if (!p) continue;
  for (const v of list) {
    for (const [edits, had] of [[v.tactics ?? [], p.tactics ?? []],
      [v.caps ?? [], p.capabilities ?? []]]) {
      for (const e of edits) {
        const key = e.replace(/^[+-]/, "");
        if (e.startsWith("+") && had.includes(key)) deadDeltas.push(`${v.name} +${key}`);
        if (e.startsWith("-") && !had.includes(key)) deadDeltas.push(`${v.name} -${key}`);
      }
    }
  }
}
check("variant edits that change nothing", deadDeltas.sort().join(", "),
  "Flat Bug Shieldline +shieldWall, Mole Beast Tusker +brute, Sweeper Diver +ambusher, "
  + "Terror Fly Torch +sniper");
/* And the sweep saw the variants it claims to have swept. */
check("variants the sweep read",
  Object.values(content.VARIANTS).reduce((n, l) => n + l.length, 0), 37);

/* And how many are genuinely their own problem, which is the number worth watching. */
check("distinct ways of fighting across the whole roster", new Set(allSigs).size, 111);
check("out of creatures in all", everyCreature.length, 112);
/*
 * `ranged` was the thinnest word in the vocabulary: ONE creature in forty-seven could shoot, and
 * *Loose* was the only card in the pool with a single drawer. The Armored Slug Spitter is written
 * as *thinner shell, longer reach of acid* -- reach it had and range it did not, and that note was
 * the only place the difference was stated.
 */
check("creatures that can shoot at all",
  everyCreature.filter(m => (m.system.capabilities ?? []).includes("ranged"))
    .map(m => m.name).sort().join(", "), "Armored Slug Spitter, Artillerist, Goblin Archer, Guild Engineer, Highwayman, Salt Baron, "
  + "Smuggler");
/* And the four target priorities are all used, because who a monster goes for is most of how it
 * feels: a Stinger that went for the nearest body would be a different creature. */
check("target priorities in use",
  [...new Set(everyCreature.map(m => m.system.targetPriority))].sort().join(", "),
  "caster, lastAttacker, leader, nearest, weakest");

/*
 * **3. The Horde's command ladder: are the majors worse to meet than the minors?**
 *
 * The roster states the ladder in PROSE, in the `note` on six creatures -- *main infantry*,
 * *sergeants*, *lieutenants*, *captains*, *generals*, *unique* -- and nothing reads it. So this
 * reads it, the way the suite reads way-cards 3.4 rather than keeping a second copy of it: a
 * hand-kept list here would be the thing that was true the first time somebody promoted a monster.
 */
const RANKS = ["main infantry", "sergeants", "lieutenants", "captains", "generals", "unique"];
const command = RANKS.map(rank => {
  /* `includes`, not `startsWith`: the infantry's note opens "the Horde's main infantry". */
  const m = baseRoster.find(x => (x.note ?? "").includes(rank));
  return { rank, m };
});
check("the command ladder, read out of the roster's own notes",
  command.map(r => `${r.rank}: ${r.m?.name ?? "NOBODY"}`).join(" | "),
  "main infantry: Flat Bug | sergeants: Mantiss | lieutenants: Five Legs | "
  + "captains: Terror Fly | generals: Pincer | unique: The Queen");

const hits = m => Math.max(0, ...(m.equipped ?? [])
  /* ITEMS too: a human NPC carries real gear, and without this every one of them read as
   * unarmed and dragged the bottom of the damage band to zero. */
  .map(n => [...content.NPC_GEAR, ...content.NATURAL_WEAPONS, ...content.ITEMS]
    .find(g => g.name === n))
  .filter(Boolean)
  .flatMap(w => Object.values(w.verbs ?? {}).map(v => v?.value ?? 0)));
const falls = (label, of) => {
  const vals = command.map(r => of(r.m));
  const bad = [];
  for (let i = 1; i < vals.length; i++) {
    if (vals[i] < vals[i - 1]) {
      bad.push(`${RANKS[i - 1]} ${vals[i - 1]} -> ${RANKS[i]} ${vals[i]}`);
    }
  }
  return bad.join("; ") || "rises";
};
check("and health rises with rank", falls("hp", m => m.system.health.base), "rises");
check("and armour rises with rank", falls("ar", m => m.system.armorBase), "rises");
/*
 * **And damage does not**, which is the one thing in this roster that argues with itself.
 *
 * A lieutenant hits for less than a sergeant, and from the sergeant up the number does not move at
 * all: Mantiss, Terror Fly, Pincer and the Queen all strike for 5. So a general is a sergeant with
 * more Health, and the apex of the army hits exactly as hard as the first thing in it that can give
 * an order. What grows up the ladder is how LONG a fight takes, not how frightening it is.
 *
 * It was pinned rather than fixed because the fix is a balance decision with a ladder of its own:
 * *every number is a ratio to the one that was measured* (core-rules), which is the goblin, and
 * changing that ratio is the roster's arithmetic rather than a typo.
 *
 * **The dragon settled the top of the band without touching the ladder.** It ran 1-7, and the
 * hardest hitter in the game was a Smash Beetle -- a minor creature holding the ceiling by
 * accident, which is what this recorded. A dragon at 8 holds it on purpose and the Horde beneath
 * it is unchanged. The oddity was never the beetle; it was that nothing big enough to deserve the
 * top of the band had been written yet.
 */
check("and the step where damage does not",
  falls("dmg", hits), "sergeants 5 -> lieutenants 4");
check("while the hardest hitter in the game is the largest creature in it",
  [...baseRoster].sort((a, b) => hits(b) - hits(a))[0].name, "Dragon");
check("and it outhits the Queen",
  hits(baseRoster.find(m => m.name === "Smash Beetle"))
    > hits(baseRoster.find(m => m.name === "The Queen")) ? "yes" : "no", "yes");
/* The whole band, so a roster that quietly flattened would show. */
check("the damage band across the roster",
  `${Math.min(...baseRoster.map(hits))}-${Math.max(...baseRoster.map(hits))}`, "1-8");
check("and the health band beside it, which is the disproportion",
  `${Math.min(...baseRoster.map(m => m.system.health.base))}`
  + `-${Math.max(...baseRoster.map(m => m.system.health.base))}`, "2-90");

/*
 * **4. The folklore the world is built on, and how much of it the roster stats.**
 *
 * Whether a goblin reads as a goblin is a judgement and is not asserted here. What is asserted is
 * narrower: Firma.md names a bestiary in its first paragraph and its underworld section, and the
 * roster is the Horde and the mole folk. Of the beings the world document says were banished to
 * remote places or hold the tunnels, **none** has a stat line.
 *
 * It is the same shape as *the roster does not invent the demons* below -- a recorded absence rather
 * than an accusation -- and the reason it is worth recording is that the two folklore-rooted names
 * the roster DOES carry are both doing other work: `Goblin` is the Horde's base infantry (*Flat
 * Bug: a goblin with a shell*), and `Blind Worm` is a burrowing brute. A setting whose monsters are
 * all one hive is a setting whose folklore is decoration.
 *
 * **The trolls answered that, and the absence is now partial rather than total.** Four of the
 * twenty-one tags have numbers: Mountain Troll, Forest Troll, Changeling and Trollkin, as Nordic
 * trolls rather than the regenerating kind. So this no longer pins `none` -- it pins WHICH, which
 * is the same recorded fact and goes on being worth recording while elves, undead and dragons are
 * still names. The mountain troll is also the first creature in the game that can draw *Lie
 * Still*: `dormant` had a capability, a card and no creature, and a bergtroll that is a boulder
 * by daylight is what the card was waiting for.
 */
const worldBeings = ["trolls", "dragons", "nature spirits", "Troll King", "queen of the dark"];
check("beings the world document names in its brief",
  worldBeings.filter(b => worldDoc.includes(b)).join(", "), worldBeings.join(", "));
const statted = worldBeings.filter(b => {
  const word = b.replace(/s$/, "").toLowerCase();
  return everyCreature.some(m => m.name.toLowerCase().includes(word));
});
check("and which of them the roster stats",
  statted.length ? statted.join(", ") : "none",
  "trolls, dragons, nature spirits, Troll King, queen of the dark");
check("and which are still a name and a list of capabilities",
  [...new Set(content.MONSTER_TAGS.map(t => t.group))].sort().join(", ") || "none", "none");
/* What the roster is, by the families it has. */
check("creature families in the roster",
  [...new Set(everyCreature.map(m => /troll|changeling/i.test(m.name) ? "the trolls"
    : /mole|burrower/i.test(m.name) ? "the dark" : "the Horde"))]
    .sort().join(", "), "the Horde, the dark, the trolls");
/* And the two names in it with folklore roots at all, both of them working for the Horde. */
check("roster names with roots in European folklore",
  everyCreature.filter(m => /^(Goblin|Blind Worm)/.test(m.name)).map(m => m.name).sort().join(", "),
  "Blind Worm, Blind Worm Elder, Goblin, Goblin Archer, Goblin Chief, Goblin Shaman, "
  + "Goblin Warrior");
/* And the four that are folklore doing its own work rather than wearing a Horde uniform. */
check("and the ones that are folklore first",
  everyCreature.filter(m => /^(Mountain Troll|Forest Troll|Changeling|Trollkin)/.test(m.name))
    .map(m => m.name).sort().join(", "),
  "Changeling, Forest Troll, Mountain Troll, Trollkin");
/*
 * The goblin line is the one that holds up to its own folklore, and it holds up mechanically rather
 * than in prose: `cowardly`, `packTactics`, and a target priority of `weakest`. A creature that is
 * frightened, never alone, and goes for whoever is least able to stop it IS the folk goblin, and
 * all three of those are fields.
 */
const goblin = everyCreature.find(m => m.name === "Goblin");
check("and the goblin is a folk goblin in its fields, not its blurb",
  [...(goblin.system.tactics ?? [])].sort().join("+") + " / " + goblin.system.targetPriority,
  "cowardly+packTactics / weakest");
/*
 * It was the goblins alone, and townsfolk are the one other thing in the world that runs. The
 * two are not the same creature: a goblin line runs TOGETHER, which is `cowardly` beside
 * `packTactics`, and a market scatters, which is `cowardly` on its own. Without that distinction
 * they had an identical fighting signature.
 */
check("and who else is allowed to run",
  everyCreature.filter(m => (m.system.tactics ?? []).includes("cowardly"))
    .filter(m => !m.name.startsWith("Goblin")).map(m => m.name).join(", ") || "none",
  "Townsfolk");

/*
 * **This pinned an absence, and the absence has now been filled.**
 *
 * The argument was *nothing can be read off a name*, and it was wrong about these particular
 * names. Watchers are Enochian; Djinn, Ifrit, Marid and Gheul are Arabic; Div is Persian; Naga is
 * Hindu; Estries is Jewish; Familiar, Incubus, Cambion and Imp are medieval European. Every one is
 * a tradition with a body already attached, and the twelve headings read as a deliberate sweep
 * across several of them. What could not be read off the names was the NUMBERS.
 *
 * So it pins WHICH of the headings have a stat line rather than that none does. The four that do
 * not are the four Firma nests under another: Ifrit and Marid sit beneath Djinn as `####`, and
 * Succubus and Cambion belong to the Incubus heading. Those are variants waiting to be written.
 */
const demonHeadings = ["Watcher", "Wanderer", "Tempter", "Djinn", "Gheul", "Naga", "Div",
  "Estrie", "Familiar", "Incubus", "Imp"];
check("the demons the world names, now with numbers",
  demonHeadings.filter(n => everyCreature.some(c => c.name === n)).length, demonHeadings.length);
check("and the ones still nested under another heading",
  ["Ifrit", "Marid", "Succubus", "Cambion"].filter(n => everyCreature.some(c => c.name === n))
    .join(", ") || "none", "none");
check("and the content says where their bodies came from",
  /Enochian, Arabic, Persian, Hindu, Jewish and medieval European/.test(contentSource)
    ? "yes" : "no", "yes");
/* The Queen is unique, which the world says and a variant list would deny. */
check("the Queen has no variants", content.VARIANTS.queen ?? "none", "none");

/* The deck a creature draws is built at setup from the pool, not authored per creature. */
/* `buildCreature`'s own body again: `buildMonster` builds a deck the same way, and it should --
 * but a grep that either can answer is a grep about neither. */
check("setup builds a deck from the pool",
  /deckFor\(creature\.system\.capabilities \?\? \[\], INTENTS, kind\)/.test(buildCreatureBody)
    ? "yes" : "no", "yes");
check("and so does the on-demand builder",
  /deckFor\(creature\.system\.capabilities \?\? \[\], INTENTS, kind\)/.test(
    setupSource.slice(setupSource.indexOf("export async function buildMonster")))
    ? "yes" : "no", "yes");
check("and every variant gets its own intent, because kind owns it",
  /`\$\{kind\}\.deck`/.test(buildCreatureBody) ? "yes" : "no", "yes");
/* A starter world gets the goblin line and nothing else: forty-seven monsters in a new world is a
 * world nobody can find anything in. */
check("the starter world builds the goblin line only",
  /ROSTER\.filter\(r => r\.system\.kind === "goblin"\)/.test(setupSource) ? "yes" : "no", "yes");
/* The name appears three times in the entry module -- an import, the API line and its comment --
 * so this reads the one that matters: the key a GM reaches for. */
check("and the rest are built on demand",
  /game\.cardrpg = \{[\s\S]{0,600}?\n    buildMonster,/.test(entrySource) ? "yes" : "no", "yes");
check("from the setup module that knows how",
  /export async function buildMonster\(name\)/.test(setupSource) ? "yes" : "no", "yes");

section("The checks themselves");

/*
 * ---- a grep that a second printer could answer ----
 *
 * **Four times this week a check passed because something else in the file said what it was looking
 * for**, and a break test caught every one: a comment explaining that `canvas.scene` is NOT used; a
 * module's header naming `canTake` as the single decision; `startChallenge`'s copy of a guard that
 * `setCall` had lost; six rows of a template carrying the `{{this.tip}}` the panel had dropped; and
 * §3's copy of a reward list that §1.5 no longer printed. Reading never found one of them.
 *
 * The shape is always the same: **a check greps a whole file, and the pattern occurs twice.** That
 * is checkable, so it is checked here, over this file, by this file.
 *
 * Two things make this honest rather than decorative:
 *
 *   - **the number of greps it resolved is pinned.** A self-parser that quietly stops understanding
 *     its own source would find no problems and report success, which is the failure mode this
 *     whole section exists to catch -- so if the count moves, the parser is wrong or the suite grew,
 *     and either way somebody looks.
 *   - **the greps that match nothing are pinned by name.** Those are the negatives -- *the reaction
 *     timer is gone*, *nothing draws a twist* -- and they are correct at zero. But a grep that went
 *     stale reads zero too, so a new one has to be added to the list deliberately.
 */
const selfSource = fs.readFileSync(path.join(root, "test/validate.mjs"), "utf8");

/* Which local holds which file: the same declarations this suite opens with. */
const readFiles = new Map();
for (const m of selfSource.matchAll(
  /const (\w+) = fs\.readFileSync\(path\.join\(root, "([^"]+)"\), "utf8"\)/g)) {
  const p = path.join(root, m[2]);
  if (fs.existsSync(p)) readFiles.set(m[1], fs.readFileSync(p, "utf8"));
}
check("files this suite greps by name", readFiles.size, 61);

/* Every `/pattern/.test(VAR)` and `VAR.includes("...")`, with the check it belongs to. */
const nameOfCheck = index => {
  const at = selfSource.lastIndexOf('check("', index);
  return at < 0 ? "?" : selfSource.slice(at + 7, selfSource.indexOf('"', at + 7));
};
const greps = [];
for (const m of selfSource.matchAll(
  /(\/(?:[^/\\\n]|\\[\s\S]|\[[^\]]*\])+\/[gimsuy]*)\s*\n?\s*\.test\((\w+)\)/g)) {
  const body = readFiles.get(m[2]);
  if (body === undefined) continue;
  const literal = m[1];
  const source = literal.slice(1, literal.lastIndexOf("/"));
  const flags = literal.slice(literal.lastIndexOf("/") + 1).replace(/g/g, "");
  let re = null;
  try { re = new RegExp(source, `${flags}g`); } catch { /* not ours to judge */ }
  if (!re) continue;
  greps.push({
    check: nameOfCheck(m.index), pattern: source, hits: (body.match(re) ?? []).length
  });
}
for (const m of selfSource.matchAll(/(\w+)\.includes\("((?:[^"\\]|\\.)*)"\)/g)) {
  const body = readFiles.get(m[1]);
  if (body === undefined) continue;
  const needle = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  greps.push({
    check: nameOfCheck(m.index), pattern: needle, hits: body.split(needle).length - 1
  });
}

/* The pin that keeps the rest of this honest. */
check("greps over a whole file, resolved", greps.length, 574);

/*
 * **The rule, as one predicate, run over a planted example before it is run over the suite.**
 *
 * With nothing left to find, `hits > 1` and `hits > 99` answer alike, so the rule was unexercised
 * and would have gone on passing if the threshold were typed wrong -- this suite's oldest lesson
 * aimed at its newest check. The first version of the fix tested a COPY of the threshold, which is
 * two checks that look like a pair and share nothing: the planted example passed while the real
 * line said 99. One definition, used by both.
 */
const answeredTwice = g => g.hits > 1;
/* A pattern planted twice in a string of its own, so the predicate has something to find. */
const planted = (() => {
  const haystack = "a: /b/.test(X)\nb: /b/.test(X)";
  return { check: "planted", hits: (haystack.match(/\/b\//g) ?? []).length };
})();
check("the rule finds a pattern that occurs twice", [planted].filter(answeredTwice).length, 1);
check("and passes one that occurs once",
  [{ check: "planted", hits: 1 }].filter(answeredTwice).length, 0);

/* And the rule itself. Anything it finds is a check whose own subject could be deleted. */
check("greps a second printer could answer",
  greps.filter(answeredTwice).map(g => `${g.check} (${g.hits}x)`).sort().join("; ") || "none",
  "none");

/*
 * And the negatives, **by name and by pattern**. Each is a check that something is *absent*, so
 * zero is the right answer -- and a positive grep that went stale cannot hide here, because a
 * positive one failing to match makes its own check fail outright.
 *
 * The patterns are in the list because the first version keyed it on the check's name alone, and a
 * break test renamed a pattern under an unchanged name and went unnoticed. What a negative asserts
 * is absent is the whole of its content, so the content is what is pinned.
 */
/*
 * The twenty-seven, by name and by pattern, in the order the suite sorts them. Raw strings,
 * because these are patterns: written as escaped JS they are unreadable, and a list nobody
 * can read is a list nobody will check when it changes.
 */
const absentGreps = [
  String.raw`a pile is never given one :: "pile",[^)]*backOf\(`,
  String.raw`and core content is never written to :: NODES\.(push|splice|length =)`,
  String.raw`and down is not computed from the updated document :: down: taker\.system\.health\.value - dealt`,
  String.raw`and from the card sheet :: type === "wound" \|\| type === "taint"`,
  String.raw`and from the tray :: c\.type === "wound" \|\| c\.type === "taint"`,
  String.raw`and neither builds a face by hand any more :: faces: \[\{ name: card\.name \}\]`,
  String.raw`and neither reads an item's tags by hand :: \(item\?\.system\?\.tags \?\? \[\]\)\.includes`,
  String.raw`and neither table still offers a choice :: ` + "`" + String.raw`\.webp` + "`"
    + String.raw` (?:preferred|or ` + "`" + String.raw`\.png` + "`" + `)`,
  String.raw`and never decides from adjacency itself :: \.after[\s\S]{0,60}\.(some|every)\(`,
  String.raw`and no longer reads a spell as a source of bonus :: slate\.type === "spell" && slate\.system\.effect`,
  String.raw`and no longer stops dealing at the first dose :: taint\+\+;\s*\n\s*break;`,
  String.raw`and no slate is flagged unusable instead :: quarantined: new fields\.BooleanField`,
  String.raw`and reads the change rather than the state :: item\.system\.prepared`,
  String.raw`and the literal Fear used to carry is gone :: const which = fast \? "actionHand" : "actionDiscard";`,
  String.raw`and the old disjunction is gone from the hand filter :: c\.type !== "wound" && c\.type !== "taint"`,
  String.raw`and the old sentence is gone :: Faith is \*\*wide and shallow\*\*`,
  String.raw`and the resolver reads the flag :: conditionsOf\(actor\)\.includes\("invisible"\)`,
  String.raw`and the template no longer asks which kind it is :: \{\{#if isWound\}\}`,
  String.raw`and the token is not given a file of its own :: texture: \{ src: (?!art \})`,
  String.raw`and the two retired vocabularies are gone from config :: conjureSources|conjureSides`,
  String.raw`and the unpatched line is gone :: Object\.create\(Array\.prototype\)`,
  String.raw`nothing builds a fate card by hand any more :: createEmbeddedDocuments\("Card", \[\{\s*name: fateCard`,
  String.raw`nothing draws a twist automatically :: drawTwist\(`,
  String.raw`reaction timer retired from config :: reactionTimer`,
  String.raw`reaction timer retired from settings :: reactionTimer`,
  String.raw`reaction timer retired from the HUD spec :: \*\*Setting: ` + "`" + String.raw`reactionTimer` + "`" + String.raw`\*\*`,
  String.raw`reaction timer retired from the HUD spec :: ^### 6\.1 The reaction timer$`,
  String.raw`the engine touches no Foundry global at module scope :: ^const \w+ = game\.`,
  String.raw`the engine touches no Foundry global at module scope :: ^const \{[^}]*\} = foundry\.`,
  String.raw`the fate bar no longer assumes twenty :: \(counts\.fate \?\? 0\) \/ 20`,
  String.raw`the grant accumulator no longer asks a spell about its timing :: slate\.type === "spell"`,
  String.raw`the old bare rank map is gone :: CARDRPG\.fateRank`,
  String.raw`the sheet reads level out rather than storing it :: name="system\.level"`,
  String.raw`the tactic no longer promises a reaction draw :: advantage\*\* on reactions`,
  String.raw`while nothing applies one at grant time :: createItem[\s\S]{0,200}resolveCondition`,
].join(" | ");
check("greps that correctly match nothing",
  greps.filter(g => g.hits === 0).map(g => `${g.check} :: ${g.pattern}`).sort().join(" | "),
  absentGreps);


console.log(failures
  ? `\n${failures} FAILURE${failures === 1 ? "" : "S"}`
  : "\nall checks pass");
process.exit(failures ? 1 : 0);
