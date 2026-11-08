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
 * The rule it encodes is one sentence and worth keeping in one place: **what you are is simply
 * true, an item has to be equipped.** It used to read *a feature is simply true*, and an injury is
 * the thing that made the wider word the right one -- there is nothing to equip and nothing to
 * prepare, and *Lost hand* grants its -1 carry by the same law a feature grants its +4 Health.
 *
 * The other half is what makes a ring granting a spell slot something you can take off
 * (equipment.md 9.2), and what makes a looted amulet stop working when it comes off the thing you
 * looted it from.
 */

/**
 * The slate kinds that are **simply true**: nothing to equip, nothing to prepare.
 *
 * A set rather than two comparisons, because this file has one job and the list of kinds that do
 * not need equipping is the whole of it. The same shape as the DEAD set in combat_sim.py and the
 * intruder table in decks.mjs, and for the same reason: a fourth kind should be a word here.
 */
const STANDING = new Set(["feature", "injury"]);

/**
 * **Which injuries this pile of slates has adapted around.**
 *
 * *Adapted* is ideas.md's release valve, and the only levelling option in the game that points at
 * another slate: **ignore one injury's penalty.** The injury stays on the sheet, because the eye
 * is still gone and the story is still true -- what switches off is the arithmetic.
 *
 * It lives here, in the module that touches no Foundry global, for the same reason the grant sum
 * does: **five different readers have to agree about it.** An injury's numbers are read by the
 * grant sum, the move reduction, the hand-slot capacity, the blocked reactions and the printed
 * range, and an Adapted that reached four of the five would be a feature that works on a sheet
 * and not in a fight. That is this project's signature defect, found five times already.
 *
 * Matched **by name**, which is what a player picks from a list. Every category but Maiming is
 * capped at one, so a name is unambiguous on a sheet; two maimings of the same name is the case
 * it cannot tell apart, and content holds no duplicate names by construction.
 */
export function adaptedNames(slates) {
  const out = new Set();
  for (const slate of slates ?? []) {
    if (slate?.type === "feature" && slate.system?.adapts) out.add(slate.system.adapts);
  }
  return out;
}

/**
 * Does this injury's arithmetic apply, or has it been adapted around?
 *
 * The question every reader of an injury number asks first, so *ignore one injury's penalty* is
 * one sentence in one place rather than five tests that have to be kept in step.
 */
export function injuryBites(slate, adapted) {
  if (slate?.type !== "injury") return false;
  return !adapted?.has(slate.name);
}

/** Does this slate's grant count right now? */
export function slateCounts(slate) {
  if (!slate) return false;
  if (STANDING.has(slate.type)) return true;
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
  /* An adapted injury grants nothing -- which for an injury means it takes nothing. */
  const adapted = adaptedNames(slates);
  for (const slate of slates ?? []) {
    if (!slateCounts(slate)) continue;
    if (slate.type === "injury" && !injuryBites(slate, adapted)) continue;
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
