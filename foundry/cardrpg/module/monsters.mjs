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

/**
 * Every creature the roster produces: each base, then each of its variants.
 *
 * **Passives are filled in after the expansion and not before**, so a variant's six scores come
 * off its OWN health and capabilities: a Goblin Chief is a lieutenant and a Goblin Sneak is a
 * stealthy one, and both of those are things the delta changed. An authored override on a base
 * still reaches its variants, because `applyVariant` carries `system` across -- which is right, a
 * variant of a specialist is a specialist.
 */
export function expandRoster(bases, variants) {
  const out = [];
  for (const base of bases) {
    out.push(base);
    for (const delta of variants[base.system?.kind] ?? []) out.push(applyVariant(base, delta));
  }
  return out.map(withPassives);
}

/* -------------------------------------------- */
/*  What it is good at                          */
/* -------------------------------------------- */

/**
 * **A creature's six passive scores, derived the way its deck is.**  [BUILT 2026-11-15]
 *
 * Every creature in the roster carried `passive: 4` -- not authored, the schema's initial value --
 * and `passiveScore` returns that one number for all six approaches. So the opposed difficulty the
 * GM's board suggests was **4 for every creature in the game**: the same number for sneaking past
 * the Cat God as for out-arguing a townsfolk, and the same saving throw against being held whether
 * the target was a Scrip or the Troll King. A knob that reads 4 on all seventy-five creatures is
 * not a knob.
 *
 * Derived rather than typed, for the reason a deck is derived: seventy-five creatures times six
 * approaches is four hundred and fifty numbers, and four hundred and fifty hand-typed numbers are
 * four hundred and fifty chances to be inconsistent about what a goblin is. A creature already
 * declares what it is -- its health and its capabilities -- and that is enough to say what it is
 * hard to beat at.
 *
 * **The baseline is its weight class**, on the ladder the roster's own table is built on: chaff,
 * rank and file, lieutenant, general, great, god. Health is the stated measure of that -- *every
 * number is a multiple of the one creature that was measured* -- so it is what the tier reads.
 *
 * **The temperament does the mental three.** `feral`, `drilled` and `wits` are exclusive and every
 * creature has exactly one, which makes them the one axis in the data that already says whether a
 * thing can think, obey or only act. A beast has no Lore worth the name; a soldier has training
 * and no learning; something that reasons and speaks is better at all three than either.
 *
 * **The rest do the physical three**, each capability shifting the approach it actually speaks to:
 * `brute` is Might, `fast` is Agility, `stealth` is Shadow, and a thing built to batter down a
 * gate is not built to tumble or to go unheard.
 *
 * **Bounded, and floored at the human floor.** No approach moves more than 3 from the tier, so the
 * weight class stays the thing that is read first and no pile of capabilities turns a goblin into
 * a god at one thing. Nothing falls below 2, which is `SKILL_FLOOR`: the passive of a character
 * with no card of an approach at all, and therefore what *bad at this* already means in this game.
 *
 * **An authored number always wins**, which is what the roster's `passives` overrides are for: the
 * derivation knows what a capability says and not what a creature IS, and five creatures in the
 * roster are a specialist at something their capabilities under-state.
 */

/** The weight classes the roster's own table is built on, read off health. */
const TIERS = [
  { upTo: 4, passive: 2, of: "chaff" },
  { upTo: 11, passive: 3, of: "rank and file" },
  { upTo: 23, passive: 4, of: "lieutenant" },
  { upTo: 44, passive: 5, of: "general" },
  { upTo: 59, passive: 6, of: "great" },
  { upTo: Infinity, passive: 7, of: "god" }
];

/**
 * **What each capability says about each approach**, as shifts from the tier.
 *
 * Read down a column rather than across a row: this is a statement about the approaches, which is
 * why `brute` appears three times. A battering thing is better at Might *and* worse at Agility and
 * Shadow, and all three of those are the same fact about it.
 *
 * The three temperaments are in here with the rest, because they are capabilities -- that is how
 * `needs` can read them -- and because keeping them separate would mean two tables with one job.
 */
const SPEAKS_TO = {
  might: { brute: 2, siege: 1, grapple: 1, reach: 1 },
  agility: {
    fast: 2, flight: 1, swim: 1,
    brute: -1, siege: -1, dormant: -1, shelter: -1
  },
  shadow: {
    stealth: 2, burrow: 1, dormant: 1,
    brute: -1, siege: -1, pack: -1, commander: -1
  },
  wits: { wits: 1, drilled: 1, commander: 1, feral: -1 },
  /* **Lore takes nothing from the `wits` temperament**, which it did until the table was read
   * back: it made every goblin in the world as well read as a Normal difficulty. Lore is what a
   * thing has studied, not whether it can think -- so a caster and a summoner have it and a
   * literate goblin has whatever its weight class has. */
  lore: { caster: 2, summon: 1, drilled: -1, feral: -2 },
  presence: { commander: 2, wits: 1, drain: 1, terrify: 1, feral: -1 }
};

/** How far a pile of capabilities may move one approach off the tier, and the floor underneath. */
const SHIFT_CAP = 3;
const FLOOR = 2;

/**
 * The six scores for one creature, from its health and its capabilities.
 *
 * `authored` is anything the roster said itself, and it is copied over the top rather than
 * clamped: a number a person typed is a decision, and the bounds here exist to keep *derivation*
 * modest rather than to argue with the author.
 */
export function passivesOf({ health = 0, capabilities = [], authored = {} } = {}) {
  const tier = TIERS.find(t => health <= t.upTo);
  const have = capsOf(capabilities);
  const out = { passive: authored.passive ?? tier.passive, passives: {} };

  for (const [approach, says] of Object.entries(SPEAKS_TO)) {
    const shift = Object.entries(says)
      .filter(([cap]) => have.has(cap))
      .reduce((n, [, by]) => n + by, 0);
    const bounded = Math.max(-SHIFT_CAP, Math.min(SHIFT_CAP, shift));
    out.passives[approach] = Math.max(FLOOR, out.passive + bounded);
  }

  /*
   * **A creature that cannot leave its square does not dodge.** The Queen is the only one, and she
   * is also the creature that proves `move` is worth deriving (`capsOf`): *the one who rules it
   * all*, rooted, speed 0. Giving her a general's Agility because nothing in her capabilities
   * mentions moving would be the derivation answering a question nobody asked it.
   */
  if (!have.has("move")) out.passives.agility = FLOOR;

  return { ...out, passives: { ...out.passives, ...(authored.passives ?? {}) } };
}

/** Fill in a creature's passive scores, leaving anything the roster authored alone. */
export function withPassives(creature) {
  const system = creature.system ?? {};
  const { passive, passives } = passivesOf({
    health: system.health?.base ?? 0,
    capabilities: system.capabilities,
    authored: { passive: system.passive, passives: system.passives }
  });
  return { ...creature, system: { ...system, passive, passives } };
}
