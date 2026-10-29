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

check("icon files on disk", onDisk.size, 64);
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

console.log(failures
  ? `\n${failures} FAILURE${failures === 1 ? "" : "S"}`
  : "\nall checks pass");
process.exit(failures ? 1 : 0);
