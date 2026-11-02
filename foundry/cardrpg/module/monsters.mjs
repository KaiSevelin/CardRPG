/**
 * What a monster can do, and therefore what it draws.
 *
 * Two pure functions and no Foundry global, for the reason `grants.mjs` has none: the validator can
 * **ask** this rather than read it, and a deck derived by arithmetic the suite cannot run is a deck
 * nobody can check.
 *
 * **A deck is not authored, it is earned.** Each intent card in the pool lists the capabilities a
 * creature must have; a creature's deck is the subset it qualifies for. That is what makes the pool
 * worth having: a card added to it joins every creature that already qualifies, and a monster is
 * declared by what it can do rather than by writing out eight cards for it.
 *
 * **And a variant is a delta.** Numbers are offsets from the base, so correcting a base moves every
 * variant with it; capabilities are `+added` and `-removed`, so a Goblin Archer earns *Loose* by
 * being able to shoot and a spearman does not. The pair in the world today share one deck and both
 * throw rocks, which is the defect this replaces rather than inherits.
 */

/** Anything that can leave the square it is in satisfies `move`. */
const MOVERS = ["legs", "flight", "swim", "burrow"];

/**
 * The capabilities a creature actually has, with the implied one filled in.
 *
 * `move` is never declared: it falls out of having legs, wings, fins or a tunnel, and the Queen --
 * rooted, *the one who rules it all* -- is the creature that proves it is worth deriving rather than
 * typing, because she is the only one in the roster without it.
 */
export function capsOf(caps = []) {
  const set = new Set(caps);
  if (caps.some(c => MOVERS.includes(c))) set.add("move");
  return set;
}

/** The cards from a pool that those capabilities earn. */
export function deckFor(caps, pool) {
  const have = capsOf(caps);
  return pool.filter(card => (card.needs ?? []).every(need => have.has(need)));
}

/**
 * Apply a variant's delta to a base.
 *
 * Health, armour and speed are **offsets**; gear, priority and the signature condition **replace**;
 * capabilities and tactics are edited with `+` and `-`, which is the only form that lets a variant
 * take something away -- a Goblin Warrior is the one that does **not** run, and `-cowardly` is how
 * that is said.
 */
export function applyVariant(base, delta) {
  const edit = (list, changes) => {
    const out = new Set(list ?? []);
    for (const change of changes ?? []) {
      if (change.startsWith("-")) out.delete(change.slice(1));
      else out.add(change.startsWith("+") ? change.slice(1) : change);
    }
    return [...out];
  };
  const system = base.system ?? {};
  return {
    name: delta.name,
    type: "npc",
    system: {
      ...system,
      kind: delta.kind,
      health: {
        value: Math.max(1, (system.health?.base ?? 1) + (delta.health ?? 0)),
        base: Math.max(1, (system.health?.base ?? 1) + (delta.health ?? 0))
      },
      armorBase: Math.max(0, (system.armorBase ?? 0) + (delta.armour ?? 0)),
      speed: Math.max(0, (system.speed ?? 0) + (delta.speed ?? 0)),
      capabilities: edit(system.capabilities, delta.caps),
      tactics: edit(system.tactics, delta.tactics),
      targetPriority: delta.priority ?? system.targetPriority,
      ...(delta.signature || system.signature
        ? { signature: delta.signature ?? system.signature } : {})
    },
    equipped: delta.gear ?? base.equipped ?? [],
    note: delta.note ?? base.note ?? ""
  };
}

/** Every creature the roster produces: each base, then each of its variants. */
export function expandRoster(bases, variants) {
  const out = [];
  for (const base of bases) {
    out.push(base);
    for (const delta of variants[base.system?.kind] ?? []) out.push(applyVariant(base, delta));
  }
  return out;
}
