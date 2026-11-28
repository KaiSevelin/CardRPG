/**
 * Dump every **martial career** and the cards it holds, for `sim/careers_sim.py`.
 *
 * The simulator is Python and the content is JavaScript, so something has to cross. This writes the
 * smallest thing that will do it: each career's cheapest-route grants (leveling.md §7.1) and the
 * definition of every card any of them can hold. Nothing is interpreted here -- the translation
 * from a `{verb, mod, param}` step to something the simulator can execute lives on the Python side,
 * where the verbs it can execute are also written down.
 *
 * **[CHANGED 2026-11-27] All four Ways now cross, because the simulator can cast.** This file used
 * to export Shade and Strength alone, on the grounds that *the simulator has no spell engine, so a
 * Way of Mind or Way of Faith career would be measured without the thing it is made of*. It has
 * one now: an implement's Cast line, a prepared formula, the slot it is spent out of, and the
 * damage, healing, Block, Shake Off and area each of those can carry. So the 32 magical careers
 * are measurable, and what remains unplayable is **a condition hung on an enemy** -- which the
 * Python side counts per career and prints, the same way it already counts unmodelled steps.
 *
 * Three things cross that did not: every career of all four Ways, the **definition of every
 * formula** any of them is granted (`spells`), and **all three starter decks** rather than the
 * Warrior's alone (`chassis`), so a caster can be measured on the chassis built for one.
 *
 * **[ADDED 2026-11-27] And the MENU each career can reach, which is the thing a cheapest route
 * structurally cannot see.** leveling.md §4a puts one menu node behind every school, every god and
 * each martial Way -- *one formula or miracle of their choice from that source's list* -- and says
 * in as many words why none of them is ever on a career's route: **a menu is a level you may spend,
 * never one you must**, so all twenty-six are leaves nothing depends on.
 *
 * The consequence was a measurement that read as content. Every magical career crossed with the
 * one or two formulas its branch names, 25 of 30 of them with nothing a simulator could cast, and
 * that looked like a starved Way rather than like a route that had not spent a level. So `menus`
 * carries the sources on the career's **frontier** -- what one more level buys -- and `sources`
 * carries what each of those offers, in the order §4a offers it: **cheapest first**.
 *
 *   node test/careers-export.mjs
 */
import fs from "node:fs";
import path from "node:path";
import * as content from "./../module/content.mjs";
import * as graph from "./../module/graph.mjs";

/*
 * Every pool a minor node or a title can hand a card out of (way-cards.md §3.1--§3.3). The two
 * magical Ways' signature lists are here since 2026-11-27, and they had to be: five titles --
 * *Shim and Wedge*, *The Writ*, *The Order's Shield*, *The Long Silence*, *The Scourge* -- grant a
 * card defined only there, and the export throws by name when one is missing, which is how they
 * were found rather than guessed at.
 */
const CARD_SOURCES = ["COMMON_POOL", "SHADE_POOL", "STRENGTH_POOL", "MIND_CARDS",
  "FAITH_CARDS", "WARRIOR_DECK", "WAY_CARDS",
  "SHADE_SIGNATURES", "STRENGTH_SIGNATURES", "MIND_SIGNATURES", "FAITH_SIGNATURES"];
const cardDefs = new Map();
for (const key of CARD_SOURCES) {
  for (const card of content[key] ?? []) if (card?.name) cardDefs.set(card.name, card);
}

/*
 * Every array a granted **formula** can be defined in. Six rather than two, because a school's
 * spells and a title's signature spell are different lists, and Shadow Magic's formulas are a
 * third -- so a list of the two pools would have gone stale on the first signature.
 */
const SPELL_SOURCES = ["MIND_POOL", "FAITH_POOL", "MIND_SIGNATURES", "FAITH_SIGNATURES",
  "FORMULAS", "SHADOW_FORMULAS"];
const spellDefs = new Map();
for (const key of SPELL_SOURCES) {
  for (const spell of content[key] ?? []) if (spell?.name) spellDefs.set(spell.name, spell);
}

/* All four. The two magical ones were held back until there was a spell engine to measure them. */
const WAYS = ["shade", "strength", "mind", "faith"];
const careers = [];
for (const node of content.NODES) {
  if (!node.title || !WAYS.includes(node.id.split(".")[0])) continue;
  /* The cheapest legal route, which is what "level 8" means, plus the title itself. */
  const owned = new Set([graph.ROOT, ...(graph.REACH.get(node.id) ?? []), node.id]);
  const g = graph.grantsOf(owned);
  careers.push({
    id: node.id, title: node.title, way: node.id.split(".")[0],
    tier: graph.tierOf(node.id), level: graph.levelFor(node.id),
    axis: node.axis ?? null, resource: node.resource ?? null,
    signature: node.signature ?? null, tactic: node.tactic ?? null,
    health: g.health, handSize: g.handSize, carry: g.carry, deckMax: g.deckMax,
    prunes: g.prunes, spellSlots: g.spellSlots, restTokens: g.restTokens,
    cards: g.cards, features: g.features, spells: g.spells,
    expertise: g.expertise, masteries: g.masteries, trainings: g.trainings,
    /*
     * **What one more level would buy from a list**, which is a different question from what the
     * route granted. `frontier` is the engine's own answer to *what can be taken now*, so this is
     * not a guess about adjacency -- it is the same function the levelling pane paints with.
     */
    menus: graph.frontier(owned).map(id => graph.GRAPH.get(id))
      .filter(n => n?.grants?.choose?.from).map(n => n.grants.choose.from),
    /*
     * **The rewards a fight cannot see** (leveling.md §4). A win rate prices a card and is blind to
     * a know-how, so a career measured only in the arena is measured on part of its pay. These are
     * counted here so `careers_sim.py` can put the two ledgers side by side.
     */
    knowHow: g.knowHow, languages: g.languages, choices: g.choices
  });
}
careers.sort((a, b) => a.way.localeCompare(b.way) || a.level - b.level
  || a.title.localeCompare(b.title));

const held = new Set(careers.flatMap(c => c.cards));
const missing = [...held].filter(name => !cardDefs.has(name));
if (missing.length) throw new Error(`cards held by a career with no definition: ${missing.join(", ")}`);

const known = new Set(careers.flatMap(c => c.spells));
const unknown = [...known].filter(name => !spellDefs.has(name));
if (unknown.length) throw new Error(`spells known by a career with no definition: ${unknown.join(", ")}`);

/*
 * **Every menu, and what it offers in the order it offers it.** `choiceList` is the engine's own
 * menu and `SPELLS_BY_SOURCE` has already sorted it by strength then name, which **is** §4a's
 * *cheapest first* -- so nothing here decides an order.
 *
 * Filtered to teachings that are spells, because a school may teach something else: all seven of
 * Tattoo Magic's are **features** and Asceticism ends in two renunciations, none of which is ever
 * prepared. A menu of those is a real menu and not a spell list.
 */
const sources = {};
for (const source of new Set(careers.flatMap(c => c.menus))) {
  /*
   * `SPELLS_BY_SOURCE` and not `choiceList`, which falls back to the CARD pool for a source that
   * teaches no spells -- so the two martial menus, *What You Favour* and *What You Lean On*, came
   * back as 38 "formulas" that are cards. A card menu is a real menu and a different question;
   * it is left out of this file rather than renamed.
   */
  const list = (graph.SPELLS_BY_SOURCE.get(source) ?? [])
    .filter(t => graph.teachingKind(t) === "spell");
  sources[source] = list.map(t => t.name);
  for (const t of list) spellDefs.set(t.name, t);
}
/* The definitions a menu pick could need, on top of the ones a route grants. */
const offered = new Set([...known, ...Object.values(sources).flat()]);

const shape = card => ({
  name: card.name, copies: card.copies ?? 1,
  primary: card.primary ?? [], secondary: card.secondary ?? [],
  reaction: card.reaction ?? null, reactionParam: card.reactionParam ?? null,
  costs: card.costs ?? null
});

/*
 * A formula, uninterpreted. `strength` is the slot cost **and** the power band (core-rules §4), and
 * `effect` is the same `{verb, range, mod, condition, ...}` block the engine reads -- so the
 * translation into something a simulator can resolve happens on the Python side, next to the list
 * of what it can resolve, exactly as it does for a card's steps.
 */
const spellShape = spell => ({
  name: spell.name, strength: spell.strength ?? 0,
  pool: spell.pool ?? null, source: spell.source ?? null,
  cost: spell.cost ?? null, effect: spell.effect ?? null, reaction: spell.reaction ?? null
});

/*
 * **Which trainings actually unlock a number**, computed here rather than typed into the Python.
 *
 * skill-rules §2 caps an untrained user at +1, so a training is worth something exactly when some
 * tool printed **above** +1 names it. `careers_offduty.py` used to hold its own list of three and
 * it went stale the same afternoon the catalogue grew two more -- which is the failure this file
 * exists to prevent, so the answer crosses with the data instead of beside it.
 */
const liveTrainings = [...new Set((content.ITEMS ?? [])
  .filter(i => (i.bonus?.value ?? 0) > 1 && (i.bonus?.training ?? "").trim())
  .map(i => ({ training: i.bonus.training.trim(), value: i.bonus.value, tool: i.name })))];

const out = {
  generated: "test/careers-export.mjs",
  careers,
  liveTrainings,
  /* Only the cards a career can actually hold. */
  cards: [...held].sort().map(name => shape(cardDefs.get(name))),
  /* Every formula a career is granted **or could be offered** by a menu on its frontier. */
  spells: [...offered].sort().map(name => spellShape(spellDefs.get(name))),
  /* And the menus themselves: source -> the names it offers, cheapest first (leveling.md §4a). */
  sources,
  /*
   * **All three starter decks** (starter-cards.md). Character creation does not exist yet
   * (core-rules §12), so a career is measured on a starter chassis rather than on a deck of its
   * own -- and there are three of those now, which is the difference between measuring a caster
   * with a Warrior's nine Strike halves and measuring one with nine Cast halves.
   */
  chassis: {
    Warrior: (content.WARRIOR_DECK ?? []).map(shape),
    Shade: (content.SHADE_DECK ?? []).map(shape),
    Caster: (content.CASTER_DECK ?? []).map(shape)
  },
  /*
   * The skill deck, for `sim/skill_hand.py`. It crosses as the approach and value of every copy,
   * because that is all a hand of four is: which approaches you are holding and how good they are.
   * Written out per copy rather than as a composition, so the Python side counts cards rather than
   * trusting a number somebody typed.
   */
  skills: (content.WARRIOR_SKILLS ?? []).flatMap(c =>
    Array.from({ length: c.copies ?? 1 }, () => ({
      name: c.name, approach: c.wild ? "any" : c.approach, value: c.value
    })))
};
const dest = path.join(import.meta.dirname, "../../../sim/careers.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + "\n");
console.log(`${careers.length} careers, ${out.cards.length} cards, ${out.spells.length} spells, `
  + `${Object.keys(out.sources).length} menus, `
  + `${Object.keys(out.chassis).length} starter chassis, ${out.skills.length} skill cards `
  + `-> ${path.relative(process.cwd(), dest)}`);
