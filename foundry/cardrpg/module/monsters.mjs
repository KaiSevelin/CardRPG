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

/**
 * The cards from a pool that those capabilities earn, for the creature of this `kind`.
 *
 * **`only` is the one way a card belongs to a named creature rather than to a capability**, and it
 * exists because three creatures' whole point was unsayable in capabilities. The Queen *spends
 * every turn on the army instead* and drew the smallest deck in the game -- seven cards, fewer than
 * a beetle, and the same seven as the Five Legs Adjutant. A Skaah is *full of something worse* and
 * had no way to let it out. A Processor *is what a scene looks like before the fight* and its deck
 * was the generic eight and nothing else.
 *
 * It is a list of kinds and not a single one because a variant has its own `kind` (`applyVariant`
 * below), so a card for the Skaah that did not name `skaah-bloated` would be missing from the
 * fuller of the two. Naming them is the honest form: a prefix convention would have the engine
 * guessing which kinds are the same creature, and nothing else in the system guesses that.
 *
 * `needs` still applies on top, so an `only` card may also ask for a capability and both hold.
 */
/**
 * **Is this card one creature's alone?**
 *
 * An intent with `only` names the kinds that may draw it, and all three that exist name **one
 * creature** -- *The Hive Obeys* is the queen's, *Open the Hold* is the Skaah's in both of its
 * forms, *Carry It Off* is the Processor's and its driller. A base and its variant are the same
 * creature, which is why the field is a list of kinds rather than one kind.
 *
 * It is worth a predicate because it is worth **showing**. Four cards in five in an NPC deck are
 * the same four whichever creature you are looking at -- that finding is why the common pool
 * exists -- so the rare card belonging to this creature and nothing else is the one a GM should
 * be able to pick out of a hand without reading it. A deck where everything looks equally generic
 * hides its own best card.
 *
 * `sole` rather than `only` as a name, because `only` is the field and this is the question.
 */
export function isSole(card) {
  return (card?.only?.length ?? 0) > 0;
}

export function deckFor(caps, pool, kind = "") {
  const have = capsOf(caps);
  return pool.filter(card =>
    (!card.only?.length || card.only.includes(kind))
    && (card.needs ?? []).every(need => have.has(need)));
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
    note: delta.note ?? base.note ?? "",
    /* A variant keeps its OWN look only. Inheriting the base's here made the art brief print the
     * same sentence twice -- once as *A Scrip: ...* and again as *This one ...*. Pairing a
     * variant with its base is the art layer's job; the engine has no business knowing it. */
    ...(delta.look ? { look: delta.look } : {})
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
