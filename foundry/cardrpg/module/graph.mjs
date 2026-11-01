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

import { NODES, COMMON_POOL, WAY_CARDS } from "./content.mjs";
import { deckOf, actionCardData } from "./decks.mjs";

export const ROOT = "root";

/**
 * The cards a node may hand out, by name. A node granting a card content has not built yet is a
 * node that silently gives nothing, so the validator refuses one -- this map is what it checks
 * against.
 */
export const POOL = new Map([...COMMON_POOL, ...WAY_CARDS].map(c => [c.name, c]));

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

  const card = GRAPH.get(id)?.grants?.card;
  if (card) await grantCard(actor, card);
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
