/**
 * Dump every **martial career** and the cards it holds, for `sim/careers_sim.py`.
 *
 * The simulator is Python and the content is JavaScript, so something has to cross. This writes the
 * smallest thing that will do it: each career's cheapest-route grants (leveling.md §7.1) and the
 * definition of every card any of them can hold. Nothing is interpreted here -- the translation
 * from a `{verb, mod, param}` step to something the simulator can execute lives on the Python side,
 * where the verbs it can execute are also written down.
 *
 * **Why only Shade and Strength.** The simulator has no spell engine, so a Way of Mind or Way of
 * Faith career would be measured without the thing it is made of. Those two Ways are a separate
 * job and pretending otherwise would produce numbers that look comparable and are not.
 *
 *   node test/careers-export.mjs
 */
import fs from "node:fs";
import path from "node:path";
import * as content from "./../module/content.mjs";
import * as graph from "./../module/graph.mjs";

/* Every pool a minor node or a title can hand a card out of (way-cards.md §3.1--§3.3). */
const CARD_SOURCES = ["COMMON_POOL", "SHADE_POOL", "STRENGTH_POOL", "WARRIOR_DECK", "WAY_CARDS",
  "SHADE_SIGNATURES", "STRENGTH_SIGNATURES"];
const cardDefs = new Map();
for (const key of CARD_SOURCES) {
  for (const card of content[key] ?? []) if (card?.name) cardDefs.set(card.name, card);
}

const MARTIAL = ["shade", "strength"];
const careers = [];
for (const node of content.NODES) {
  if (!node.title || !MARTIAL.includes(node.id.split(".")[0])) continue;
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

const shape = card => ({
  name: card.name, copies: card.copies ?? 1,
  primary: card.primary ?? [], secondary: card.secondary ?? [],
  reaction: card.reaction ?? null, reactionParam: card.reactionParam ?? null,
  costs: card.costs ?? null
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
  /* Only the cards a career can actually hold, plus the starter sixteen, which is the chassis
   * every career is measured on because character creation does not exist yet (core-rules §13). */
  cards: [...held].sort().map(name => shape(cardDefs.get(name))),
  starter: (content.WARRIOR_DECK ?? []).map(shape)
};
const dest = path.join(import.meta.dirname, "../../../sim/careers.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + "\n");
console.log(`${careers.length} careers, ${out.cards.length} cards, `
  + `${out.starter.length} starter cards -> ${path.relative(process.cwd(), dest)}`);
