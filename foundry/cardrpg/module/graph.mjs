/**
 * The levelling graph.
 *
 * The nodes are content ([content.mjs]{@link ./content.mjs}, `NODES`); this is the engine that
 * reads them. rules/leveling.md is the specification, and three of its claims are load-bearing
 * here:
 *
 *   9. A character stores only **the list of node ids they own**. Level, title, frontier and every
 *      reward derive from that list. So `takeNode` pushes one id and writes nothing else -- a node
 *      definition corrected tomorrow fixes every character who took it, with nothing to migrate.
 *      The moment a level-up copies `+1 Health` onto the sheet, that promise is gone.
 *
 *   1. Eligibility is NOT adjacency. `after[]` is any-one-of, `all` makes it every-one-of, and an
 *      exclusive family closes its rivals for good. A pane that offered every node touching an
 *      owned one would offer level-ups the rules refuse.
 *
 *   3. The only thing that makes a frontier shrink is an exclusive group -- and what it closes is
 *      not only its rivals but everything reachable only through them. That is why `reachable`
 *      exists beside `frontier`: a player needs to see the difference between *not yet* and
 *      *never again*, and only the second is worth a confirmation.
 */

import {
  NODES, COMMON_POOL, WAY_CARDS,
  SHADE_SIGNATURES, TACTICS, STRENGTH_SIGNATURES, STRENGTH_TACTICS
} from "./content.mjs";

/**
 * Every Signature, and every Tactic, from whichever Way wrote them. A Way adds a pair of exports
 * and nothing here changes -- which is the same shape leveling.md 8 asks of an add-on.
 */
export const SIGNATURES = [...SHADE_SIGNATURES, ...STRENGTH_SIGNATURES];
export const ALL_TACTICS = { ...TACTICS, ...STRENGTH_TACTICS };
import { deckOf, allStacks, actionCardData } from "./decks.mjs";
/* The one shape a slate takes, shared with the setup routine rather than spelled twice. */
import { slateData } from "./setup.mjs";

export const ROOT = "root";

/**
 * The cards a node may hand out, by name. A node granting a card content has not built yet is a
 * node that silently gives nothing, so the validator refuses one -- this map is what it checks
 * against.
 */
export const POOL = new Map([...COMMON_POOL, ...WAY_CARDS,
  ...SIGNATURES.filter(s => s.kind === "card")].map(c => [c.name, c]));

/** Every node by id. */
export const GRAPH = new Map(NODES.map(n => [n.id, n]));

/**
 * Read forwards, stored backwards (leveling 8): a node names what it follows and nothing names its
 * successors, which is what lets an add-on hang a branch off core content without core knowing.
 * The forward index is therefore computed, never authored.
 */
export const SUCCESSORS = (() => {
  const out = new Map(NODES.map(n => [n.id, []]));
  for (const node of NODES) {
    for (const prereq of node.after ?? []) out.get(prereq)?.push(node.id);
  }
  return out;
})();

/** Longest path from the root, which is what a layered layout and the sideways rule both want. */
export const DEPTH = (() => {
  const depth = new Map();
  const visit = id => {
    if (depth.has(id)) return depth.get(id);
    const node = GRAPH.get(id);
    const after = node?.after ?? [];
    /* Set before recursing, so a cycle in bad content returns rather than overflowing the stack --
     * the validator is what refuses it, and this must survive long enough to be told off. */
    depth.set(id, 0);
    const d = after.length ? Math.max(...after.map(visit)) + 1 : 0;
    depth.set(id, d);
    return d;
  };
  for (const node of NODES) visit(node.id);
  return depth;
})();

/* -------------------------------------------- */
/*  What a character owns                       */
/* -------------------------------------------- */

/** The owned set, root included: everyone stands on the root and never stops owning it (§6). */
export function ownedIds(actor) {
  return new Set([ROOT, ...(actor?.system?.nodes ?? [])]);
}

/**
 * Nodes closed for good, with the family/creed rule of §3: taking a node closes every node of the
 * same family with a *different* creed. A flat group is the special case where each node's creed is
 * its own, so this one rule describes both.
 */
export function closedIds(owned) {
  const sworn = new Map();            // family -> the creed this character is sworn to
  for (const id of owned) {
    const node = GRAPH.get(id);
    if (node?.exclusive) sworn.set(node.exclusive, node.creed ?? node.id);
  }
  const closed = new Set();
  if (!sworn.size) return closed;
  for (const node of NODES) {
    if (!node.exclusive || !sworn.has(node.exclusive)) continue;
    if ((node.creed ?? node.id) !== sworn.get(node.exclusive)) closed.add(node.id);
  }
  return closed;
}

/**
 * Still possible, ever: everything a character could reach from here if they spent every level on
 * it. Anything outside this set is closed for good -- either closed directly, or reachable only
 * through something that is, which §3 says goes with it.
 */
export function reachable(owned, closed = closedIds(owned)) {
  const live = new Set(owned);
  let grew = true;
  while (grew) {
    grew = false;
    for (const node of NODES) {
      if (live.has(node.id) || closed.has(node.id)) continue;
      if (satisfied(node, live)) { live.add(node.id); grew = true; }
    }
  }
  return live;
}

/** Whether a node's prerequisites are met by a set: any one of them, or all when `all` is set. */
function satisfied(node, have) {
  const after = node.after ?? [];
  if (!after.length) return false;                      // only the root, and that is owned already
  return node.all ? after.every(p => have.has(p)) : after.some(p => have.has(p));
}

/**
 * Can this node be taken *now*? Not "is it next to something I own" -- `after[]` and the exclusive
 * groups are the rule, and this function is the only place that decides. The pane and the accept
 * path both call it, so a node the pane offers is a node the engine will accept.
 */
export function canTake(id, owned, closed = closedIds(owned)) {
  if (owned.has(id) || closed.has(id)) return false;
  const node = GRAPH.get(id);
  return !!node && satisfied(node, owned);
}

/** Every node takeable this level: the frontier of §3. */
export function frontier(owned, closed = closedIds(owned)) {
  return NODES.filter(n => canTake(n.id, owned, closed)).map(n => n.id);
}

/**
 * Four states, which is what the pane paints. Three of them are not "available": a node may be
 * owned, takeable now, possible later, or closed for good -- and only the last is irreversible,
 * so only the last is worth stopping a player over.
 */
export function stateOf(id, owned, closed = closedIds(owned), live = null) {
  if (owned.has(id)) return "owned";
  if (closed.has(id)) return "closed";
  if (canTake(id, owned, closed)) return "available";
  return (live ?? reachable(owned, closed)).has(id) ? "later" : "closed";
}

/* -------------------------------------------- */
/*  What owning them means                      */
/* -------------------------------------------- */

/** Level is the number of nodes you own, not counting the root (§7). */
export function levelOf(owned) {
  return [...owned].filter(id => id !== ROOT).length;
}

/** Your title is the deepest specialization node you own (§5). */
export function titleOf(owned) {
  let best = null;
  for (const id of owned) {
    const node = GRAPH.get(id);
    if (!node?.title) continue;
    if (!best || (DEPTH.get(id) ?? 0) > (DEPTH.get(best.id) ?? 0)) best = node;
  }
  return best?.title ?? null;
}

/**
 * Your Tactic: the one your deepest title carries, and only that one.
 *
 * way-cards 2.5 says *you only ever have your deepest title's*, so this is derived beside the title
 * rather than granted as a slate. Granting them would give a Cutpurse-Gambler both, which is
 * exactly the accumulation the rule exists to prevent -- and there is no un-granting a slate when a
 * deeper title arrives.
 */
export function tacticOf(owned) {
  let best = null;
  for (const id of owned) {
    const node = GRAPH.get(id);
    if (!node?.tactic) continue;
    if (!best || (DEPTH.get(id) ?? 0) > (DEPTH.get(best.id) ?? 0)) best = node;
  }
  return best
    ? { name: best.tactic, text: ALL_TACTICS[best.tactic] ?? "", from: best.title }
    : null;
}

/** The content a node hands over as a slate, by name: the Signatures, so far. */
export const SLATES = new Map(SIGNATURES.map(s => [s.name, s]));

/** The Ways a character has set foot in, which is derived rather than chosen on a sheet. */
export function waysOf(owned) {
  return [...owned].filter(id => GRAPH.get(id)?.after?.includes(ROOT));
}

/**
 * What the owned nodes add up to. The numeric keys deliberately match the accumulator
 * `CharacterData.prepareDerivedData` already uses for features and worn items, so a node granting
 * Health is summed by the same line that sums a ring granting Health, and nothing is stored.
 */
export function grantsOf(owned) {
  const out = {
    health: 0, handSize: 0, carry: 0, deckMax: 0, spellSlots: 0, restTokens: 0,
    trainings: [], knowHow: [], cards: [], features: [], spells: [], prunes: 0
  };
  for (const id of owned) {
    const g = GRAPH.get(id)?.grants;
    if (!g) continue;
    for (const key of ["health", "handSize", "carry", "deckMax", "spellSlots", "restTokens"]) {
      out[key] += g[key] ?? 0;
    }
    out.prunes += g.prune ?? 0;
    if (g.training) out.trainings.push(g.training);
    if (g.knowHow) out.knowHow.push(g.knowHow);
    if (g.card) out.cards.push(g.card);
    if (g.feature) out.features.push(g.feature);
    if (g.spell) out.spells.push(g.spell);
  }
  return out;
}

/* -------------------------------------------- */
/*  Reading a node out loud                     */
/* -------------------------------------------- */

/** How a grant reads on the pane: one line each, in the order §4 lists the reward kinds. */
export function describeGrants(node) {
  const g = node?.grants ?? {};
  const lines = [];
  const number = (key, label) => {
    if (g[key]) lines.push(`${label} +${g[key]}`);
  };
  if (g.card) lines.push(`${game.i18n.localize("CARDRPG.Level.Card")}: ${g.card}`);
  if (g.feature) lines.push(`${game.i18n.localize("CARDRPG.Level.Feature")}: ${g.feature}`);
  if (g.spell) lines.push(`${game.i18n.localize("CARDRPG.Level.Spell")}: ${g.spell}`);
  if (g.training) lines.push(`${game.i18n.localize("CARDRPG.Level.Training")}: ${g.training}`);
  if (g.knowHow) lines.push(`${game.i18n.localize("CARDRPG.Level.KnowHow")}: ${g.knowHow}`);
  number("health", game.i18n.localize("CARDRPG.Health"));
  number("handSize", game.i18n.localize("CARDRPG.HandSize"));
  number("carry", game.i18n.localize("CARDRPG.Carry"));
  number("deckMax", game.i18n.localize("CARDRPG.DeckMax"));
  number("spellSlots", game.i18n.localize("CARDRPG.SpellSlots"));
  number("restTokens", game.i18n.localize("CARDRPG.RestTokens"));
  if (g.prune) lines.push(game.i18n.localize("CARDRPG.Level.Prune"));
  return lines;
}

/**
 * What taking this node would shut, by name. An exclusive node is the one irreversible level-up in
 * the game, so accept-or-cancel is not enough on its own: the player is told what they are giving
 * up before they give it up, not afterwards.
 */
export function wouldClose(id, owned) {
  const node = GRAPH.get(id);
  if (!node?.exclusive) return [];
  const after = new Set([...owned, id]);
  const stillLive = reachable(after, closedIds(after));
  return NODES
    .filter(n => !after.has(n.id) && !stillLive.has(n.id) && reachable(owned).has(n.id))
    .map(n => n.name ?? n.id);
}

/* -------------------------------------------- */
/*  Spending the level                          */
/* -------------------------------------------- */

/**
 * Take a node. One array push and one counter, because §9 says so -- the Health, the slots and the
 * title all move because they were never stored.
 *
 * A card grant is the exception, and it has to be: a card is a document in a deck, not a number to
 * derive. Nothing else here touches the world.
 */
export async function takeNode(actor, id) {
  const owned = ownedIds(actor);
  if (!canTake(id, owned)) {
    ui.notifications?.warn(game.i18n.format("CARDRPG.Level.NotAvailable",
      { name: GRAPH.get(id)?.name ?? id }));
    return false;
  }
  if ((actor.system.levels?.pending ?? 0) < 1) {
    ui.notifications?.warn(game.i18n.localize("CARDRPG.Level.NoneToSpend"));
    return false;
  }
  await actor.update({
    "system.nodes": [...(actor.system.nodes ?? []), id],
    "system.levels.pending": actor.system.levels.pending - 1
  });

  const grants = GRAPH.get(id)?.grants ?? {};
  if (grants.card) await grantCard(actor, grants.card);
  if (grants.feature) await grantSlate(actor, grants.feature, "feature");
  if (grants.item) await grantSlate(actor, grants.item, "item");
  for (let i = 0; i < (grants.prune ?? 0); i++) await prune(actor);
  return true;
}

/**
 * A feature or item slate from content. Like a card and unlike a number, a slate is a document: it
 * is created once and it stays created, which is why a Signature feature carries only text and the
 * node carries any figure (rules/leveling.md 9).
 */
async function grantSlate(actor, name, type) {
  const def = SLATES.get(name);
  if (!def) {
    ui.notifications?.warn(game.i18n.format("CARDRPG.Level.NoSlate", { name }));
    return false;
  }
  const { kind, node, needs, ...fields } = def;
  await actor.createEmbeddedDocuments("Item", [slateData(fields, type)]);
  return true;
}

/**
 * A prune, which is the one reward that cannot be handed over without asking: section 4 calls it
 * *remove one card from a deck, permanently*, and only the player knows which card has gone dead.
 *
 * It is also the only reward that can make a character illegal, so the deck minimum is checked
 * before the question is asked rather than after it is answered (core-rules 8).
 */
export async function prune(actor) {
  const cards = allStacks(actor)
    .flatMap(stack => stack.cards.contents)
    .filter(card => card.type === "action");

  if (cards.length <= (actor.system.actionDeck?.min ?? 0)) {
    ui.notifications?.warn(game.i18n.format("CARDRPG.Level.PruneFloor",
      { min: actor.system.actionDeck?.min ?? 0 }));
    return false;
  }

  /* Sorted and counted, because a deck holds three Strikes and "which Strike" is not a question. */
  const counts = new Map();
  for (const card of cards) counts.set(card.name, (counts.get(card.name) ?? 0) + 1);
  const options = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, n]) => `<option value="${foundry.utils.escapeHTML(name)}">`
      + `${foundry.utils.escapeHTML(name)}${n > 1 ? ` (${n})` : ""}</option>`).join("");

  /* Reached through the global rather than destructured at module scope: this module is imported by
   * the offline validator, where `foundry` does not exist, and the engine's testability depends on
   * it staying that way. */
  const chosen = await foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.localize("CARDRPG.Level.PruneTitle") },
    content: `<p>${game.i18n.localize("CARDRPG.Level.PruneBody")}</p>
      <select name="card" style="width: 100%">${options}</select>`,
    ok: {
      label: game.i18n.localize("CARDRPG.Level.PruneConfirm"),
      callback: (event, button) => button.form.elements.card.value
    },
    rejectClose: false
  });
  if (!chosen) return false;

  /* Whichever copy is easiest to reach: they are identical documents by this point. */
  const victim = cards.find(card => card.name === chosen);
  if (!victim) return false;
  await victim.delete();
  ui.notifications?.info(game.i18n.format("CARDRPG.Level.Pruned", { name: chosen }));
  return true;
}

/**
 * The one reward that cannot be derived. Health is a number and comes back from `grantsOf` every
 * time the sheet is prepared; a card is a document in a deck, so it has to be created once and it
 * stays created. That asymmetry is why `grants.card` is the only key `takeNode` acts on.
 */
async function grantCard(actor, name) {
  const def = POOL.get(name);
  const deck = deckOf(actor, "action");
  if (!def || !deck) {
    ui.notifications?.warn(game.i18n.format("CARDRPG.Level.NoCard", { name }));
    return false;
  }
  await deck.createEmbeddedDocuments("Card", [actionCardData(def)]);
  return true;
}
