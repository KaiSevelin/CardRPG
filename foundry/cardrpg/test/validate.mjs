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
check("stepField keys read from source", stepKeys.size, 14);

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

console.log(failures
  ? `\n${failures} FAILURE${failures === 1 ? "" : "S"}`
  : "\nall checks pass");
process.exit(failures ? 1 : 0);
