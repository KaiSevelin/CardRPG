/**
 * What a pile of slates grants, as arithmetic.
 *
 * **Both actor models do this sum and only one of them did it.** `CharacterData` walked its
 * features and equipped items adding up Health, hand size, carry, deck maximum and spell slots;
 * `NpcData` added none of them, so a monster's feature granting 4 Health read correctly on its
 * sheet, passed every check, and changed no number. The field existed and the reader did not.
 *
 * It lives here, in a module that touches **no Foundry global**, for the reason `checkOutcome` was
 * pulled out of a resolver: a data model cannot be imported outside Foundry, so arithmetic left
 * inside one can only ever be *read* by the validator and never *asked*. This one is asked.
 *
 * The rule it encodes is one sentence and worth keeping in one place: **a feature is simply true,
 * an item has to be equipped.** That is what makes a ring granting a spell slot something you can
 * take off (equipment.md 9.2), and what makes a looted amulet stop working when it comes off the
 * thing you looted it from.
 */

/** Does this slate's grant count right now? */
export function slateCounts(slate) {
  if (!slate) return false;
  if (slate.type === "feature") return true;
  /*
   * **A spell grants nothing standing**, and that is the whole of it now.
   *
   * This used to let a PERMANENT formula count the way a feature counts, which was the right answer
   * to the wrong question: a thing with nothing to equip and nothing to prepare is not a formula at
   * all. The nine that needed it are features, so what is left is the rule in its original form --
   * a feature is simply true, an item has to be equipped, and a spell does its work when cast.
   */
  return slate.type === "item" && !!slate.system?.equipped;
}

/**
 * Sum the named grants over a pile of slates.
 *
 * `keys` is the caller's, not a constant here, because the two models read different sets: a
 * character has all five, and an NPC has a field for **Health alone** -- it holds no hand and never
 * exhausts (core-rules 9), has no encumbrance, and has neither a deck maximum nor a spell slot. A
 * grant naming one of those on a monster is content pointed at a field that does not exist, which
 * the validator refuses rather than this function silently adding to nothing.
 */
export function sumGrants(slates, keys) {
  const out = {};
  for (const key of keys) out[key] = 0;
  for (const slate of slates ?? []) {
    if (!slateCounts(slate)) continue;
    for (const key of keys) out[key] += slate.system?.grants?.[key] ?? 0;
  }
  return out;
}

/** The keys a character's sheet can raise. */
export const CHARACTER_GRANTS = ["health", "handSize", "carry", "deckMax", "spellSlots",
  /* Flat armour, which had no home in the game until the Graven line needed one: a worn
   * item's `armor` is a number and a feature's is `doubleWhenOverloaded`, so a thing that
   * simply makes you harder to hurt had nowhere to say so. */
  "armor"];

/** And the one an NPC has somewhere to put. */
export const NPC_GRANTS = ["health"];
