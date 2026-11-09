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
  NODES, COMMON_POOL, WAY_CARDS, SHADE_POOL, STRENGTH_POOL, MIND_POOL, FAITH_POOL, LANGUAGES,
  FORMULAS, SHADOW_FORMULAS,
  SHADE_SIGNATURES, TACTICS, STRENGTH_SIGNATURES, STRENGTH_TACTICS,
  MIND_SIGNATURES, MIND_TACTICS, FAITH_SIGNATURES, FAITH_TACTICS
} from "./content.mjs";

/**
 * Every Signature, and every Tactic, from whichever Way wrote them. A Way adds a pair of exports
 * and nothing here changes -- which is the same shape leveling.md 8 asks of an add-on.
 */
export const SIGNATURES = [...SHADE_SIGNATURES, ...STRENGTH_SIGNATURES, ...MIND_SIGNATURES,
  ...FAITH_SIGNATURES];
export const ALL_TACTICS = { ...TACTICS, ...STRENGTH_TACTICS, ...MIND_TACTICS, ...FAITH_TACTICS };
import { deckOf, allStacks, actionCardData, artIn } from "./decks.mjs";
/* The approach list, imported rather than reached through the global: `graphFaults` is called
 * by the offline validator, where Foundry's globals do not exist, and config.mjs fills this
 * object at module scope so an import is enough. */
import { CARDRPG } from "./config.mjs";
/* Where a picture lives, derived from the list that commissioned it rather than written down. */
/* The one shape a slate takes, shared with the setup routine rather than spelled twice. */
import { slateData } from "./setup.mjs";

export const ROOT = "root";

/**
 * The cards a node may hand out, by name. A node granting a card content has not built yet is a
 * node that silently gives nothing, so the validator refuses one -- this map is what it checks
 * against.
 */
export const POOL = new Map([...COMMON_POOL, ...WAY_CARDS, ...SHADE_POOL, ...STRENGTH_POOL,
  ...SIGNATURES.filter(s => s.kind === "card")].map(c => [c.name, c]));

/**
 * The formulas a node may hand out, by name -- the spell half of `POOL`, and a separate map
 * because a spell is a different document type and the two can never be confused for each other.
 *
 * It gathers the four Elemental formulas and the one Shadow formula that were content before this
 * Way had a graph. Those were on the starter actor because the setup routine put them there, and
 * nothing ever GRANTED one; Rain and Lightning in particular are the pair the `when` clause was
 * written to demonstrate, and they are two nodes on one branch now.
 */
/*
 * Every teaching a school or a god may hand over.
 *
 * A Signature counts when it has a **source**, which is the school or god that teaches it. The
 * first version filtered by `kind !== "card"` -- by what a Signature is not -- and let in the four
 * Way Signatures, so a list about schools reported *The Kit* and *One Trick* as formulas belonging
 * to no section of the world document.
 */
export const TEACHINGS = [...MIND_POOL, ...FAITH_POOL, ...FORMULAS, ...SHADOW_FORMULAS,
  ...SIGNATURES.filter(s => s.kind !== "card" && s.source)];

/**
 * **The cards a node may offer a choice from, by pool.**  **[BUILT 2026-11-07]**
 *
 * The twin of `SPELLS_BY_SOURCE`, and it exists for the reason 4a of the levelling rules gives
 * for that one: *a pool larger than the nodes that draw on it is a menu nobody can order from.*
 * 4a measured that against the spell lists -- 147 formulas, three nodes a branch, 95 of them on no
 * node at all -- and settled that a node may name a **source** instead of a spell.
 *
 * The same section calls a named grant *the right shape for a card pool, where a Way's thirteen
 * cards meet about twenty pool nodes*, and that sentence has expired: the martial pools hold **35**
 * cards and **21 of them are on no node at all**. Six in ten. So the condition 4a was written for
 * now holds on the card side too, and the mechanism generalises rather than being invented again.
 *
 * A card's `pool` is what a spell's `source` is, so the map is the same two lines -- with two
 * differences that both come from a rule rather than from taste: the name a node writes is its own
 * **title**, and the **top rung of the cost ladder is not on a menu**. Both are explained below.
 *
 * The **common pool** has no menu, because a menu sits behind the title whose list it offers and
 * the common pool is nobody's title. Its four unplaced cards stay a named-grant gap.
 */
/*
 * **The source a node names is its own title**, which is the rule 4a already checks for the
 * schools: a menu sits directly behind the title whose list it offers, and the two strings have to
 * be the same string. A Way's title is `Shade` and `Warrior`, so those are the names here -- not
 * "Way of Shade", which reads better and would put the menu behind nothing.
 */
export const CARD_SOURCES = { shade: "Shade", strength: "Warrior" };

/**
 * **What the top rung of the cost ladder does to a menu, and why one card is not on one.**
 *
 * A spell menu limits itself. way-cards 1.4 makes **strength the slot cost**, so a caster offered a
 * strength-5 miracle on their first day can take it and cannot cast it -- the budget is the fence,
 * and `grantSpellChoice` sorts cheapest-first because of it.
 *
 * **A card has no such fence.** A card in the deck is playable the turn it is drawn, so a menu
 * offering a whole pool hands over its dearest card as readily as its cheapest. On the Shade and
 * common lists that is survivable: the dearest pay **Strain 1** or **Spent**, which way-cards 1.3
 * calls *a few per deck* and *at most 2 in a 16-card deck*. One card is not survivable, and it is
 * the one the ladder itself singles out: *Nothing Held Back* pays **Spent AND Strain**, the top
 * rung, which 1.3 reserves at **once in a deck**.
 *
 * So a menu offers every rung but the top one, and the top rung stays under a **named** grant where
 * the branch decides when it arrives. That is not a special case for one card -- it is the ladder's
 * own "once in a deck" read as a rule about who hands it over.
 */
export const topRung = card => [card?.costs?.primary, card?.costs?.secondary]
  .some(half => half?.spent && half?.strain);

export const CARDS_BY_SOURCE = (() => {
  const out = new Map();
  for (const card of [...SHADE_POOL, ...STRENGTH_POOL]) {
    const label = CARD_SOURCES[card.pool];
    if (!label || topRung(card)) continue;
    if (!out.has(label)) out.set(label, []);
    out.get(label).push(card);
  }
  for (const list of out.values()) list.sort((a, b) => a.name.localeCompare(b.name));
  return out;
})();

/** What a menu offers, whichever kind of list it names. One question, one answer. */
export const choiceList = source =>
  SPELLS_BY_SOURCE.get(source) ?? CARDS_BY_SOURCE.get(source) ?? null;

/**
 * **What kind of slate a teaching is.**
 *
 * A pool entry used to carry no `kind` and be a spell by that silence, which was fine while every
 * teaching was a formula. Nine of them are features now -- all seven of Tattoo Magic and the two
 * renunciations Asceticism ends in -- because *a thing usable without being equipped or prepared is
 * a feature*, and none of the nine is ever prepared. So the silence has to mean something explicit.
 *
 * **It asks by the values that answer, because `kind` on content carries two vocabularies.** On a
 * Signature it is the slate type -- spell, feature, item, card. On the five Elemental and Shadow
 * formulas written before this Way had a graph it is the SPELL kind, formula or miracle, which
 * every other spell derives from its node (`spellKindOf` below). `t.kind ?? "spell"` read the
 * second vocabulary as if it were the first and quietly dropped Rain, Lightning, Frost, Scorch and
 * Step Through out of the spell list.
 */
export const SLATE_KINDS = ["feature", "item"];
export const teachingKind = t => SLATE_KINDS.includes(t.kind) ? t.kind : "spell";

export const SPELLS = new Map(
  TEACHINGS.filter(t => teachingKind(t) === "spell").map(f => [f.name, f]));

/**
 * Every formula and miracle, grouped by the school or god that may teach it.
 *
 * **A pool is a menu, and this is the menu.** way-cards 3 writes the minor-node content as pools
 * rather than as assignments -- *a pool is a set of cards the minor nodes along a branch draw
 * from* -- and for a card that was always enough, because a card pool is a dozen cards and a Way
 * has about twenty pool nodes to spend on them. A school's list is not like that: twelve schools
 * and twelve gods hold a hundred and forty-seven formulas between them, and a school branch has
 * three nodes. Naming one formula per node left ninety-five of them written down and unreachable.
 *
 * So a node may name a SOURCE instead of a spell, and the player picks. `source` is a plain string
 * on the content for exactly this reason (data/items.mjs): an add-on's thirteenth school indexes
 * itself here without a config edit.
 *
 * **Teachings, not formulas.** Tattoo Magic teaches seven things and not one of them is a formula,
 * and Asceticism's ladder ends in two renunciations you cannot prepare either -- so a menu built
 * from `SPELLS` would have shown one school as empty and another as missing its top two rungs.
 * What a school teaches is what it teaches; which document it arrives as is a question about gates.
 */
export const SPELLS_BY_SOURCE = (() => {
  const out = new Map();
  for (const spell of TEACHINGS) {
    if (!spell.source) continue;
    if (!out.has(spell.source)) out.set(spell.source, []);
    out.get(spell.source).push(spell);
  }
  for (const list of out.values()) list.sort((a, b) => a.strength - b.strength
    || a.name.localeCompare(b.name));
  return out;
})();

/**
 * The nodes in play: core content, plus whatever a world has added or replaced.
 *
 * leveling.md 8 describes the graph as **assembled at runtime** from every installed source rather
 * than authored as one tree, and this is that assembly. `NODES` is the core array and never
 * changes; this is the list the engine actually reads, and `rebuildGraph` is the only thing that
 * replaces its contents.
 *
 * Mutated in place rather than reassigned, because every importer holds this binding: a module
 * that got the array at import time has to see the same array afterwards, or half the engine would
 * be answering questions about a graph nobody is playing on.
 */
export const LIVE_NODES = [...NODES];

/** Every node by id. */
export const GRAPH = new Map();

/**
 * Read forwards, stored backwards (leveling 8): a node names what it follows and nothing names its
 * successors, which is what lets an add-on hang a branch off core content without core knowing.
 * The forward index is therefore computed, never authored.
 */
export const SUCCESSORS = new Map();

/** Longest path from the root, which is what a layered layout and the sideways rule both want. */
export const DEPTH = new Map();

/**
 * The **cheapest legal route** to each node: the smallest set of nodes you must already own before
 * it becomes takeable. `REACH.get(id).size + 1` is the earliest level at which you can hold it.
 *
 * This is not `DEPTH`, and the difference is the whole of leveling.md 7. DEPTH is the longest path
 * from the root, which is what a layered layout wants -- every edge pointing forward, no title
 * drawn above its own trunk. REACH is what *level 6* means: six nodes owned, whatever route.
 *
 * They part company wherever a graph stops being a tree:
 *
 *   - a node reached by a **crossing** has a long route and a short one, and DEPTH takes the long
 *     one, so it overstates how early you can have it;
 *   - an **`all`** node needs *every* prerequisite, so its cheapest route is not its shallowest
 *     predecessor but the **union** of all of them. Assassin measured as a tier-2 title one level
 *     early until this existed, and that was the measurement being wrong rather than the content.
 */
export const REACH = new Map();

/* -------------------------------------------- */
/*  Assembling the graph                        */
/* -------------------------------------------- */

/**
 * Fill the four indexes from `LIVE_NODES`. Every map is cleared and refilled rather than replaced,
 * so the bindings every other module imported stay the ones being answered from.
 */
function reindex() {
  GRAPH.clear();
  for (const node of LIVE_NODES) GRAPH.set(node.id, node);

  SUCCESSORS.clear();
  for (const node of LIVE_NODES) SUCCESSORS.set(node.id, []);
  for (const node of LIVE_NODES) {
    for (const prereq of node.after ?? []) SUCCESSORS.get(prereq)?.push(node.id);
  }

  DEPTH.clear();
  const deep = id => {
    if (DEPTH.has(id)) return DEPTH.get(id);
    const after = GRAPH.get(id)?.after ?? [];
    /* Set before recursing, so a cycle in bad content returns rather than overflowing the stack --
     * `graphFaults` is what refuses it, and this must survive long enough to be told off. */
    DEPTH.set(id, 0);
    const d = after.length ? Math.max(...after.map(deep)) + 1 : 0;
    DEPTH.set(id, d);
    return d;
  };
  for (const node of LIVE_NODES) deep(node.id);

  REACH.clear();
  const cheapest = id => {
    if (REACH.has(id)) return REACH.get(id);
    const node = GRAPH.get(id);
    const after = node?.after ?? [];
    REACH.set(id, new Set());                       // cycle guard; `graphFaults` refuses cycles
    let out;
    if (!after.length) out = new Set();
    else if (node.all) {
      /* Every one of them, so the cost is the union of what each needs plus each itself. */
      out = new Set();
      for (const prereq of after) {
        for (const owned of cheapest(prereq)) out.add(owned);
        out.add(prereq);
      }
    } else {
      /* Any one of them, so the cheapest. */
      out = null;
      for (const prereq of after) {
        const via = new Set([...cheapest(prereq), prereq]);
        if (!out || via.size < out.size) out = via;
      }
    }
    REACH.set(id, out);
    return out;
  };
  for (const node of LIVE_NODES) cheapest(node.id);
}

reindex();

/**
 * What is wrong with a proposed set of nodes, as sentences.
 *
 * leveling.md 8 names both of these as the price of a graph assembled at runtime: *every
 * prerequisite must resolve and the whole thing must stay acyclic*. A third is the cost of letting
 * a world replace a node rather than only add one -- two nodes with one id is two different things
 * wearing a name an add-on depends on.
 *
 * Nothing is committed until this comes back empty, because a half-applied graph is worse than a
 * rejected one: a character derives everything from it.
 */
export function graphFaults(nodes) {
  const faults = [];
  const byId = new Map();
  for (const node of nodes) {
    if (!node?.id) { faults.push("a node with no id"); continue; }
    if (byId.has(node.id)) faults.push(`two nodes share the id ${node.id}`);
    byId.set(node.id, node);
  }
  for (const node of nodes) {
    for (const prereq of node.after ?? []) {
      if (!byId.has(prereq)) faults.push(`${node.id} follows ${prereq}, which does not exist`);
    }
  }
  /* Acyclic, by colouring: grey means "on the stack", which is what a back edge arrives at. */
  const colour = new Map();
  const walk = id => {
    if (colour.get(id) === "black") return;
    if (colour.get(id) === "grey") { faults.push(`${id} is in a cycle`); return; }
    colour.set(id, "grey");
    for (const prereq of byId.get(id)?.after ?? []) walk(prereq);
    colour.set(id, "black");
  };
  for (const node of nodes) walk(node.id);
  /*
   * A choice has to have something to choose from. A node naming a school nobody wrote is a node
   * that offers a player an empty list and spends their level doing it, which is worse than a node
   * that grants nothing: the level is gone either way and this one looked like a reward.
   */
  for (const node of nodes) {
    const from = node?.grants?.choose?.from;
    if (from && !choiceList(from)) {
      faults.push(`${node.id} offers a choice from ${from}, which has nothing in it`);
    }
    /* A language the world does not have is a reward that reads as flavour and means nothing --
     * the same failure as a node granting a card nobody wrote, caught in the same place. */
    const tongue = node?.grants?.language;
    if (tongue && !LANGUAGE_NAMES.has(tongue)) {
      faults.push(`${node.id} teaches ${tongue}, which is not a language of Firma`);
    }
    /* An expertise or a mastery in an approach nobody has is a reward that can never apply, and
     * "any" is not one either: a wild card serves every approach, an expertise in one does not. */
    for (const key of ["expertise", "mastery"]) {
      const approach = node?.grants?.[key];
      if (!approach) continue;
      if (!(approach in CARDRPG.approaches) || approach === "any") {
        faults.push(`${node.id} grants ${key} in ${approach}, which is not an approach`);
      }
    }
  }
  return [...new Set(faults)];
}

/**
 * Assemble the graph from core content plus a world's own edits, and reindex.
 *
 * `added` replaces a node when it carries an id core already uses and adds one when it does not;
 * `removed` drops a core node. Both are refused outright if the result would not be a graph, and
 * the core array is never touched -- so a bad edit set is a message and not a broken world.
 *
 * @returns {string[]} the faults, empty when the rebuild was committed
 */
export function rebuildGraph({ added = [], removed = [] } = {}) {
  const merged = new Map(NODES.map(n => [n.id, n]));
  for (const id of removed) merged.delete(id);
  for (const node of added) merged.set(node.id, node);

  const next = [...merged.values()];
  const faults = graphFaults(next);
  if (faults.length) return faults;

  LIVE_NODES.length = 0;
  LIVE_NODES.push(...next);
  reindex();
  return [];
}

/**
 * The earliest level at which a node can be held: the nodes it needs plus itself, and **not** the
 * root -- section 7 counts level as the nodes you own not counting the root, so this counts the same
 * way or the two numbers would never agree.
 */
export function levelFor(id) {
  const needs = REACH.get(id);
  if (!needs) return 1;
  return [...needs].filter(n => n !== ROOT).length + 1;
}

/**
 * How many titles deep a node sits on its cheapest route: a Way root is 0, the titles off its trunk
 * are 1, theirs are 2. The unit section 7's consistency is measured in, because comparing a tier-2
 * title against a tier-1 one says nothing.
 */
export function tierOf(id) {
  return [...(REACH.get(id) ?? [])].filter(n => GRAPH.get(n)?.title).length;
}

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
  for (const node of LIVE_NODES) {
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
    for (const node of LIVE_NODES) {
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
  return LIVE_NODES.filter(n => canTake(n.id, owned, closed)).map(n => n.id);
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
  return deepestTitled(owned)?.title ?? null;
}

/**
 * The deepest titled node owned, and **the tie-break is the interesting part.**
 *
 * Three Ways never produced a tie: their titles sit at different depths, so *the deepest title you
 * own* ordered them completely. Way of Faith is wide -- twelve gods are siblings at one depth -- so
 * a devotee of Valtor and Sessyfyn owns two titles that are exactly as deep as each other, and the
 * rule said nothing at all about that case.
 *
 * It is settled by **the order the nodes were taken**, which costs nothing because `system.nodes`
 * is an array and an array remembers: the ids are in acquisition order, so the set this iterates is
 * a character's history. The comparison is strictly greater-than, so an exact tie keeps the
 * EARLIER node -- **your first vow is the one that names you**, and the second god of a pantheon
 * adds miracles without changing how you stand. That also makes it stable: a priest who swears
 * again does not silently re-style themselves.
 */
function deepestTitled(owned) {
  let best = null;
  for (const id of owned) {
    const node = GRAPH.get(id);
    if (!node?.title) continue;
    if (!best || (DEPTH.get(id) ?? 0) > (DEPTH.get(best.id) ?? 0)) best = node;
  }
  return best;
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
  /* The same node `titleOf` picked, by the same tie-break: a title and its Tactic are one choice. */
  const best = deepestTitled(owned);
  return best?.tactic
    ? { name: best.tactic, text: ALL_TACTICS[best.tactic] ?? "", from: best.title }
    : null;
}

/** The content a node hands over as a slate, by name: the Signatures, so far. */
export const SLATES = new Map(SIGNATURES.map(s => [s.name, s]));

/**
 * Every teaching by name, so a school's menu can hand over what the school actually teaches.
 *
 * `SLATES` holds Signatures and `SPELLS` holds formulas, and the nine features a school teaches are
 * in neither: eight of them are pool entries, which `SLATES` never saw, and none of them is a spell
 * any more. A menu that could only look in one of the two maps would have shown Tattoo Magic as an
 * empty school.
 */
export const TEACHINGS_BY_NAME = new Map(TEACHINGS.map(t => [t.name, t]));

/** The nine, by name, so a node teaching a tongue nobody speaks is a fault and not a typo. */
export const LANGUAGE_NAMES = new Set(LANGUAGES.map(l => l.name));

/** And the nine themselves, so the node editor can offer them with the world's own gloss. */
export { LANGUAGES };

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
    trainings: [], knowHow: [], languages: [], cards: [], features: [], spells: [], prunes: 0,
    /*
     * The two steps a skill card can climb (skill-rules 8). **Expertise is a question and mastery
     * is a number**, which is why they are kept apart: an expertise asks the player which card to
     * raise, the way a prune asks which to drop, and a mastery is read off the owned set every
     * time a passive is computed.
     */
    expertise: [], masteries: [],
    /* Whether any sworn god lets this character cast with both hands full. */
    freehandCast: false,
    /* The sources a character has been offered a choice from, which is not the same as what they
     * chose: the spell itself is a document and is counted by the book, not by this. */
    choices: [],
    /*
     * The one thing a node can do that is not addition. Every other grant raises a number; The
     * First's Obedience says *your spell slots are capped at 3, for ever* -- which is why that god
     * has no strength-4 and no strength-5 miracle (way-cards 3.5). `null` is no cap, and two caps
     * take the lower, because an obedience is not negotiated down by taking another one.
     */
    slotCap: null
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
    if (g.language) out.languages.push(g.language);
    if (g.expertise) out.expertise.push(g.expertise);
    if (g.mastery) out.masteries.push(g.mastery);
    if (g.card) out.cards.push(g.card);
    if (g.feature) out.features.push(g.feature);
    if (g.spell) out.spells.push(g.spell);
    if (g.choose?.from) out.choices.push(g.choose.from);
    /*
     * **The one gift that is a rule rather than a number.** Vax's club is his holy symbol,
     * which in the engine means his miracles do not want the empty hand every other prepared
     * spell wants. The prose says so on the node for the player; this is the half a resolver
     * can read.
     */
    if (g.freehandCast) out.freehandCast = true;
    if (g.caps?.spellSlots !== undefined) {
      out.slotCap = out.slotCap === null
        ? g.caps.spellSlots
        : Math.min(out.slotCap, g.caps.spellSlots);
    }
  }
  return out;
}

/**
 * The standing terms a character lives under: one per god sworn to.
 *
 * **An Obedience is a Tactic's opposite number and the difference is the point.** A Tactic is your
 * *deepest* title's and you have exactly one (way-cards 2.5); an Obedience is **every** god's, and
 * a devotee of two of The Five pays both. So this returns a list where `tacticOf` returns one --
 * and both are derived rather than granted, for the same reason: nothing un-grants a slate.
 *
 * `gift` is there only for the four gods who are alone in their religion. A religion of one must be
 * worth it (specializations.md), so each lone god bends a rule the other eleven obey, and the gift
 * is printed beside the obedience because they are the two halves of one bargain.
 */
export function termsOf(owned) {
  const out = [];
  for (const id of owned) {
    const node = GRAPH.get(id);
    if (!node?.obedience) continue;
    out.push({ god: node.title ?? node.name, obedience: node.obedience, gift: node.gift ?? "" });
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
  if (g.choose?.from) {
    lines.push(game.i18n.format("CARDRPG.Level.Choose", {
      source: g.choose.from, n: choiceList(g.choose.from)?.length ?? 0
    }));
  }
  if (g.training) lines.push(`${game.i18n.localize("CARDRPG.Level.Training")}: ${g.training}`);
  if (g.knowHow) lines.push(`${game.i18n.localize("CARDRPG.Level.KnowHow")}: ${g.knowHow}`);
  if (g.language) {
    lines.push(`${game.i18n.localize("CARDRPG.Level.Language")}: ${g.language}`);
  }
  if (g.expertise) {
    lines.push(game.i18n.format("CARDRPG.Level.Expertise",
      { approach: game.i18n.localize(CARDRPG.approaches[g.expertise]?.label ?? g.expertise) }));
  }
  if (g.mastery) {
    lines.push(game.i18n.format("CARDRPG.Level.Mastery",
      { approach: game.i18n.localize(CARDRPG.approaches[g.mastery]?.label ?? g.mastery) }));
  }
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
  return LIVE_NODES
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
  if (grants.spell) await grantSpell(actor, grants.spell, id);
  /* A menu names either kind of list, and which one decides the document that gets made. */
  if (grants.choose?.from) {
    await (CARDS_BY_SOURCE.has(grants.choose.from)
      ? grantCardChoice(actor, grants.choose.from)
      : grantSpellChoice(actor, grants.choose.from, id));
  }
  if (grants.expertise) await raiseSkillCard(actor, grants.expertise);
  for (let i = 0; i < (grants.prune ?? 0); i++) await prune(actor);
  return true;
}

/**
 * **The fields a content entry contributes to a document, with the graph's own fields removed.**
 *
 * An entry carries two kinds of field. Some are the thing itself -- text, a bonus, a strength, an
 * effect -- and some are how the LEVELLING GRAPH handles it: `kind` says which document to make,
 * `node` which node hands it over, `needs` what it requires first, `pool` which Way teaches it.
 * The second kind must not reach the document, because a data model drops a key it does not know
 * without saying so: a Signature feature packed with its own `kind: "feature"` puts that string in
 * `system.kind`, which the feature schema has no field for, and the loss is silent.
 *
 * One function because there are three callers now rather than two. `grantSlate` and `grantSpell`
 * each stripped their own list, which held while they were the only ways a content entry became a
 * document; the compendium builder is the third, and it got the list wrong.
 */
export function slateFieldsOf(def) {
  const { kind, node, needs, pool, ...fields } = def;
  /*
   * **And the picture, resolved here while the original entry is still in hand.**
   *
   * `art.mjs` derives a path from the list a piece is on, and it recognises the piece by being
   * handed the very object content declared. This function's whole job is to make a NEW object
   * out of that one, so everything downstream of it -- the pack builder, a node's grant, a
   * resolver's source -- was asking about an object that is on no list.
   *
   * It worked for all but six pieces, because a name is enough when a name is unique, and it
   * failed for exactly the six the book uses twice: *The Kit* is a Signature and an item, *The
   * Long Step* is a Wild card and a formula. Three documents came out of the packs with no `img`.
   * Resolving it at the one place the original is still available fixes all of them at once.
   *
   * **Through `artIn`, which is the one answer to this question.** This line used to spell the
   * rule out itself -- `fields.art || artPathOf(def)` -- and it was the third place in the system
   * to do so. The third copy is how the second one gets found: the shortest of the three, in
   * levelup.mjs, left out the derivation and so resolved a picture for none of 207 nodes.
   *
   * This copy left out the other half, the guard against Foundry's own `icons/svg/` placeholders,
   * so a piece whose entry carried one wrote the placeholder into the slate as though somebody had
   * chosen it. Gone with the duplication rather than fixed beside it.
   */
  const art = artIn(def);
  return art ? { ...fields, art } : fields;
}

/**
 * **A spell's `kind` is its Way, not its content.** A formula is studied and paid for once in your
 * own substance; a miracle is granted and paid for every time you ask (data/items.mjs). Both are
 * spells, and which one a given formula is depends entirely on who taught it -- so it is derived
 * from the node or the pool rather than written on the entry.
 */
export function spellKindOf(source) {
  return String(source).startsWith("faith") ? "miracle" : "formula";
}

/**
 * A feature or item slate from content. Like a card and unlike a number, a slate is a document: it
 * is created once and it stays created, which is why a Signature feature carries only text and the
 * node carries any figure (rules/leveling.md 9).
 */
async function grantSlate(actor, name, type) {
  /* A Signature first, then any teaching: eight of the nine features a school teaches are pool
   * entries, which `SLATES` has never held. */
  const def = SLATES.get(name) ?? TEACHINGS_BY_NAME.get(name);
  if (!def) {
    ui.notifications?.warn(game.i18n.format("CARDRPG.Level.NoSlate", { name }));
    return false;
  }
  await actor.createEmbeddedDocuments("Item", [slateData(slateFieldsOf(def), type)]);
  return true;
}

/**
 * A formula or a miracle. The third document a node can hand over, and the first that arrives
 * **unprepared**.
 *
 * That is not a detail. `slotCost` is zero while a spell is still in the book (data/items.mjs), so
 * granting a strength-4 formula to a caster with three slots costs nothing and breaks nothing -- the
 * book holds what the budget cannot, and the slots that arrive later are what make it castable. A
 * node that handed over a PREPARED spell would be a node that quietly spent your budget for you.
 *
 * `kind` -- formula or miracle -- is read off the Way rather than carried on the content, because
 * that distinction simply IS the Way: data/items.mjs says so in the field's own documentation. A
 * formula is studied and paid for once in your own substance; a miracle is granted and paid for
 * every time you ask.
 */
async function grantSpell(actor, name, nodeId) {
  const def = SPELLS.get(name);
  if (!def) {
    ui.notifications?.warn(game.i18n.format("CARDRPG.Level.NoSpell", { name }));
    return false;
  }
  await actor.createEmbeddedDocuments("Item", [slateData({
    ...slateFieldsOf(def),
    kind: spellKindOf(nodeId),
    prepared: false
  }, "spell")]);
  return true;
}

/**
 * One spell of your choice from a school's or a god's list.
 *
 * The second reward that has to ask, and it asks for the opposite reason to a prune: a prune is
 * asked about because only the player knows which card has gone dead, and this is asked about
 * because a school's list is a **menu** and picking off it is the decision the branch was walked
 * for. way-cards 3.4 argues it from the bottom of the ladder -- *a two-slot caster must be able to
 * prepare something from this school on their first day, which is what the 1 and the 2 are for* --
 * and that argument is about the LIST holding both, which only means something if the caster picks.
 *
 * What a player already has is left out of the list rather than greyed: a node that can hand over
 * nothing new says so instead of charging a level for a duplicate.
 */
async function grantSpellChoice(actor, source, nodeId) {
  const list = SPELLS_BY_SOURCE.get(source) ?? [];
  /*
   * Held, whichever kind it arrived as. A school that teaches features would otherwise offer the
   * same tattoo twice -- the filter read spells alone, because until Tattoo Magic every teaching
   * was one.
   */
  const held = new Set(actor.items
    .filter(i => i.type === "spell" || i.type === "feature").map(i => i.name));
  const open = list.filter(spell => !held.has(spell.name));
  if (!open.length) {
    ui.notifications?.warn(game.i18n.format("CARDRPG.Level.NothingLeft", { source }));
    return false;
  }

  /* Cheapest first, because strength IS the slot cost and a two-slot caster is reading for a 1. */
  const options = open.map(spell =>
    `<option value="${foundry.utils.escapeHTML(spell.name)}">`
    + `${foundry.utils.escapeHTML(spell.name)} (${spell.strength})</option>`).join("");

  const chosen = await foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.format("CARDRPG.Level.ChooseTitle", { source }) },
    content: `<p>${game.i18n.localize("CARDRPG.Level.ChooseBody")}</p>
      <select name="spell" style="width: 100%">${options}</select>`,
    ok: {
      label: game.i18n.localize("CARDRPG.Level.ChooseConfirm"),
      callback: (event, button) => button.form.elements.spell.value
    },
    rejectClose: false
  });
  if (!chosen) return false;
  /*
   * **And the one branch.** What a school teaches is what it teaches; which document it arrives as
   * is a question about gates, and the gate is what `kind` names. A formula arrives unprepared and
   * costs nothing until it is prepared; a tattoo arrives finished.
   */
  const def = TEACHINGS_BY_NAME.get(chosen);
  return teachingKind(def) === "feature"
    ? grantSlate(actor, chosen, "feature")
    : grantSpell(actor, chosen, nodeId);
}

/**
 * A prune, which is the one reward that cannot be handed over without asking: section 4 calls it
 * *remove one card from a deck, permanently*, and only the player knows which card has gone dead.
 *
 * It is also the only reward that can make a character illegal, so the deck minimum is checked
 * before the question is asked rather than after it is answered (core-rules 8).
 */
/**
 * Expertise: raise one skill card of an approach by 1, to the cap of 3 (skill-rules 8).
 *
 * **The upgrade that section 8 describes and nothing could do.** *Replace a card with one of the
 * same approach and value +1* is what this is, done in place rather than by swapping documents --
 * the card keeps its name and its edge, which is what makes it the same card having got better
 * rather than a different card arriving.
 *
 * **It asks**, like a prune and for the same reason: only the player knows which of their Lore
 * cards they actually play. A card already at the cap cannot be raised and is not offered, and an
 * approach with nothing below the cap says so and changes nothing -- taking the node is still
 * worth it for everything else on it, and the offer is recorded on the character either way.
 *
 * A wild is left out on purpose. An Inspiration is *any approach, value 1* (skill-rules 1) and
 * raising it would make it any approach at 2, which is the one card in the deck whose whole point
 * is that it is never the wrong card and never a good one.
 */
export async function raiseSkillCard(actor, approach) {
  const cap = 3;
  const cards = allStacks(actor)
    .flatMap(stack => stack.cards.contents)
    .filter(card => card.type === "skill" && !card.system?.wild
      && card.system?.approach === approach && (card.system?.value ?? 0) < cap);

  const label = game.i18n.localize(CARDRPG.approaches[approach]?.label ?? approach);
  if (!cards.length) {
    ui.notifications?.info(game.i18n.format("CARDRPG.Level.ExpertiseNone", { approach: label }));
    return false;
  }

  const options = cards.sort((a, b) => (b.system.value ?? 0) - (a.system.value ?? 0)
    || a.name.localeCompare(b.name))
    .map(card => `<option value="${card.id}">${foundry.utils.escapeHTML(card.name)}`
      + ` (${card.system.value} \u2192 ${(card.system.value ?? 0) + 1})</option>`).join("");

  const chosen = await foundry.applications.api.DialogV2.prompt({
    window: {
      title: game.i18n.format("CARDRPG.Level.ExpertiseTitle", { approach: label })
    },
    content: `<p>${game.i18n.format("CARDRPG.Level.ExpertiseBody", { approach: label })}</p>
      <select name="card" style="width: 100%">${options}</select>`,
    ok: {
      label: game.i18n.localize("CARDRPG.Level.ExpertiseConfirm"),
      callback: (event, button) => button.form.elements.card.value
    },
    rejectClose: false
  });
  if (!chosen) return false;

  const card = cards.find(c => c.id === chosen);
  if (!card) return false;
  await card.update({ "system.value": Math.min(cap, (card.system.value ?? 0) + 1) });
  ui.notifications?.info(game.i18n.format("CARDRPG.Level.ExpertiseDone",
    { card: card.name, value: card.system.value }));
  return true;
}

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

/**
 * **One card of the player's choosing, from a pool.**  **[BUILT 2026-11-07]**
 *
 * `grantSpellChoice`'s opposite number, and deliberately the same shape: the offer is everything in
 * the source they do not already hold, a source with nothing left to give says so rather than
 * spending the level on a duplicate, and the player answers once.
 *
 * Two things differ, and both follow from a card being a card. **What counts as already held is the
 * action deck**, not the item list -- a card is a document in a deck, which is why `grantCard`
 * above exists at all. And the list is sorted by **name** rather than by cost: a spell's strength
 * is its slot price and a caster reading for a 1 wants the cheap end first, where a pool card has
 * no such number and alphabetical is the only honest order.
 */
async function grantCardChoice(actor, source) {
  const deck = deckOf(actor, "action");
  const list = CARDS_BY_SOURCE.get(source) ?? [];
  if (!deck) return false;
  const held = new Set(deck.cards.map(c => c.name));
  const open = list.filter(card => !held.has(card.name));
  if (!open.length) {
    ui.notifications?.warn(game.i18n.format("CARDRPG.Level.NothingLeft", { source }));
    return false;
  }
  const options = open.map(card =>
    `<option value="${foundry.utils.escapeHTML(card.name)}">`
    + `${foundry.utils.escapeHTML(card.name)}</option>`).join("");
  const chosen = await foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.format("CARDRPG.Level.Choose", { source, n: open.length }) },
    content: `<select name="card">${options}</select>`,
    ok: { callback: (_event, button) => button.form.elements.card.value }
  }).catch(() => null);
  if (!chosen) return false;
  return grantCard(actor, chosen);
}
