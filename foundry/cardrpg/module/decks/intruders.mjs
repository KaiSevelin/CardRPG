/**
 * The cards nobody chose to put in a deck -- what they are, which pile they come from,
 * and what drawing one costs. The table is the rule; see core-rules 8.
 *
 * Part of the deck layer: see decks.mjs, which is the one door onto all of it.
 */

/* -------------------------------------------- */
/*  Intruders                                  */
/* -------------------------------------------- */

/**
 * **The cards in your deck that nobody chose to put there.**  **[BUILT 2026-11-08]**
 *
 * A Wound, a Taint and a Fear card are not content. Nothing in the catalogue deals them to you as
 * a card, no node grants one and no deck was ever built with one in it -- they arrive because
 * something happened to you, they sit in a pile that is otherwise entirely your own choices, and
 * they come round again on that pile's own clock.
 *
 * That is a category, and it had been three hand-written disjunctions: `type === "wound" ||
 * type === "taint"` in this file, in the card sheet and in the tray. Which is this project's own
 * recurring defect wearing a new hat -- a rule stated in three places and true in whichever one
 * somebody last edited. A fourth kind of intruder would have been spendable for a Brace in one of
 * them and rendered as an ordinary playable card in another, and nothing would have said so.
 *
 * Three dials, and the table below is the whole of it:
 *
 *  - `dead`   -- may not be played, and may not be spent on a reaction. Every intruder so far is,
 *                and it is the one exception to *no card in your hand is dead* (core-rules 3).
 *  - `onDraw` -- it resolves as it is dealt rather than waiting to be played. Taint takes its
 *                damage, Fear moves you, and a Wound does nothing at all but take up the slot.
 *  - `short`  -- it costs the slot as well: no replacement is drawn and the hand legitimately
 *                comes up one card shorter. **This is the dial that sets the price**, and
 *                core-rules 8 records why -- a card that replaces itself is very nearly free,
 *                because dilution cannot bite until the draw pile empties.
 *  - `deck`   -- whose deck it clogs, which is the dial that sets the CLOCK. The action deck
 *                recycles every Catch Breath, so an intruder there is priced per fight; the skill
 *                discard comes back only on a rest (skill-rules 1), so one there is priced per
 *                session. Taint is `"either"` because its own flavour picks, body or mind.
 *  - `after`  -- where it goes once it has resolved. The discard, where it will come round again
 *                until something lifts it, or `"gone"` -- out of the game, which is how a kind of
 *                harm that does not last is written. Fear is the first of those: it is spent the
 *                moment it is drawn, and a shriek you have already flinched at is not still owed.
 *
 * Which pile it lands in is a fourth dial and belongs to whatever deals it rather than here: the
 * discard, where it comes round at a moment nobody chose, or straight into the hand, where it
 * resolves at once. `resolveTaint` has carried that parameter since Taint was built, and every
 * intruder gets it for nothing.
 */
export const INTRUDERS = {
  /* A Wound never resolves on draw at all: the player discards it at the end of their turn, so
   * it has no `after` of its own and stays in the hand until then. */
  wound: {
    dead: true, onDraw: null, short: false, after: null, deck: "action",
    line: "Can't be played. Discard at the end of your turn."
  },
  taint: {
    dead: true, onDraw: "taint", short: true, after: "discard", deck: "either",
    line: "When drawn: 1 damage, ignoring armor. Discard, and draw no replacement."
  },
  fear: {
    dead: true, onDraw: "fear", short: false, after: "gone", deck: "action",
    line: "When drawn: move 1 square directly away from the nearest enemy, then discard."
  },
  /*
   * Doubt is the first intruder in the SKILL deck, and nothing about it is new except that -- it is
   * a Wound on a slower clock. It does nothing when drawn, cannot be played, and sits in a hand of
   * four until the scene ends. That is why it needed no new effect and why it is expensive anyway:
   * the action deck launders itself every Catch Breath, and the skill discard comes back only on a
   * rest. Which deck an intruder lands in is most of what it costs.
   */
  doubt: {
    dead: true, onDraw: null, short: false, after: null, deck: "skill",
    line: "Can't be played. Discard it when the scene ends."
  },
  /*
   * Rage is the first intruder whose cost lands on somebody who did not draw it, and the target is
   * named by a RULE rather than chosen: the nearest creature, and the lowest Health of those tied.
   * GM's choice or holder's choice would both turn it into an argument about whose fault the dead
   * cleric was, and the rule is what keeps it a card instead.
   */
  rage: {
    dead: true, onDraw: "rage", short: false, after: "discard", deck: "action",
    line: "When drawn: Strike the nearest creature, ally or enemy. Then discard."
  },
  /*
   * Compulsion takes an OPTION rather than a resource, which is the cheapest kind of intruder to
   * build and the nastiest to hold: the draw pile is the loss condition (core-rules 8) and Catch
   * Breath is the only thing that refills it. It is also what makes every other action-deck
   * intruder cost what it is supposed to -- dilution cannot bite until the pile empties, and this
   * is the card that stops you emptying it on your own terms.
   */
  compulsion: {
    dead: true, onDraw: null, short: false, after: null, deck: "action",
    line: "Can't be played, and you may not Catch Breath. Discard at the end of your turn."
  },
  /*
   * Confusion is the only intruder that goes into an ENEMY's deck, and the one that answers the
   * question Wounds could not: core-rules 3 draws intent one card per TYPE, so a species shares the
   * deck a Wound would have gone in. That is fatal for a Wound and exactly right for this -- what
   * you are corrupting is the type's PLAN, which is a thing a species really does share. It is
   * worth more against a swarm than against an elite for the same reason Forestall is, which is the
   * one shape of enemy-facing effect in this game that does not reward sniping the biggest thing.
   */
  confusion: {
    dead: true, onDraw: null, short: false, after: null, deck: "action",
    line: "No plan: every creature of this type may only Move this round."
  }
};

/** Is this one of the cards nobody chose to put in the deck? */
export function isIntruder(card) {
  return !!card?.type && Object.hasOwn(INTRUDERS, card.type);
}

/** Can this card never be played -- not even for Brace? */
export function isDeadCard(card) {
  return !!INTRUDERS[card?.type]?.dead;
}

/** What resolves the moment this card is dealt, or null if nothing does. */
export function drawEffect(card) {
  return INTRUDERS[card?.type]?.onDraw ?? null;
}

/** Does it take the slot with it, leaving the hand a card short? */
export function costsTheSlot(card) {
  return !!INTRUDERS[card?.type]?.short;
}

/**
 * Which stack a dose of this kind arrives in, slow or fast.
 *
 * The two dials of core-rules 8 read as one expression: the kind's own deck, and then the discard
 * where it comes round at a moment nobody chose or the hand where it resolves at once. Taint is the
 * exception and says so in the table -- its flavour picks the deck, so it answers null here and
 * keeps its own line.
 */
export function intruderStack(kind, fast = false) {
  const deck = INTRUDERS[kind]?.deck;
  if (!deck || deck === "either") return null;
  return fast ? `${deck}Hand` : `${deck}Discard`;
}

/** Where it goes once it has resolved: "discard", "gone", or null if it never resolves itself. */
export function afterDrawing(card) {
  return INTRUDERS[card?.type]?.after ?? null;
}

/**
 * What the card says, for whoever is printing it.
 *
 * The sheet and the tray both print this and they had written their own wordings -- the tray said
 * "Dead card. Discard at the end of your turn." where the card face says "Can't be played." Two
 * texts for one card is the same defect as two predicates for one category, so the line lives with
 * the dials that explain it.
 */
export function intruderLine(card) {
  return INTRUDERS[card?.type]?.line ?? "";
}