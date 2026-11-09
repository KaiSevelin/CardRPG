/**
 * The fate deck: drawing from it, what a drawn card does to a number, and the Wild that
 * sends you to another deck entirely.
 *
 * Part of the deck layer: see decks.mjs, which is the one door onto all of it.
 */

import { CARDRPG } from "../config.mjs";
import { allStacks, available, cardName, deckOf, move, moveRandom, normalizeDeck } from "./stacks.mjs";

/* -------------------------------------------- */
/*  Wild Magic                                  */
/* -------------------------------------------- */

/**
 * A Wild came out of the fate deck, so a surge comes out of the Wild Magic deck (core-rules 6).
 *
 * The deck is **shared by the world, not owned by a caster**: a surge is the world answering, and
 * one deck means the table sees the same twelve possibilities every time, which is what makes them
 * learnable. It cycles like any other -- draw to the discard, reshuffle when it runs dry -- so a
 * table that has seen *Misfire* knows it is out of the deck for a while, and that is information
 * worth having.
 *
 * Returns the card so the caller may resolve its steps; the steps themselves are resolved by
 * whoever has a target to resolve them against (resolve.mjs), because this module moves cards.
 */
export async function drawWildMagic(actor) {
  const deck = game.cards?.getName?.("Wild Magic");
  const discard = game.cards?.getName?.("Wild Magic Discard");
  if (!deck) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="cardrpg"><p><strong>${actor.name}</strong> draws <strong>Wild</strong>: `
        + `the action resolves at its plain value. <em>No Wild Magic deck in this world &mdash; the `
        + `GM reads the surge.</em></p></div>`
    });
    return null;
  }

  if (!available(deck).length && discard?.cards.size) {
    await move(discard, deck, discard.cards.map(c => c.id));
    await deck.shuffle({ chatNotification: false });
  }
  const [card] = await moveRandom(deck, discard ?? deck, 1);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> draws <strong>Wild</strong>: `
      + `the action resolves at its plain value, and the magic surges &mdash; `
      + `<strong>${card ? cardName(card) : "nothing left"}</strong>`
      + (card?.system?.line ? `: ${card.system.line}` : "")
      + `.</p><p class="cr-note">The Wild card stays in the fate deck.</p></div>`
  });
  return card ?? null;
}

/* -------------------------------------------- */
/*  Fate                                        */
/* -------------------------------------------- */

/**
 * Draw fate and apply it to a value.
 *
 * Advantage draws two and keeps the better, disadvantage the worse, and both cards are discarded
 * either way -- so advantage burns through the deck twice as fast, which is itself a cost.
 *
 * Miss and Critical each trigger a reshuffle, which is why the deck always still holds one of each
 * between reshuffles and the remaining count is a live risk readout.
 *
 * @param {Actor} actor
 * @param {number} value      The value to modify.
 * @param {number} mode       +1 advantage, -1 disadvantage, 0 normal.
 * @returns {Promise<object>} { result, drawn, used, reshuffled }
 */
export async function drawFate(actor, value, mode = 0) {
  const deck = deckOf(actor, "fate");
  const discard = deckOf(actor, "fateDiscard");
  if (!deck) return { result: value, drawn: [], used: null, reshuffled: false };

  // Refill before drawing if the deck can't cover it, so a draw never comes up short.
  const need = mode === 0 ? 1 : 2;
  if (available(deck).length < need) await reshuffleFate(actor);

  const drawn = await moveRandom(deck, discard, need);
  if (!drawn.length) return { result: value, drawn: [], used: null, reshuffled: false };

  const rank = CARDRPG.fateValueOf;
  const used = mode === 0
    ? drawn[0]
    : drawn.reduce((best, card) => {
      const better = rank(card) > rank(best);
      return (mode > 0 ? better : !better) ? card : best;
    });

  const result = used.system.apply ? used.system.apply(value) : applyFate(value, used);

  // A Blessed or Cursed card is removed when drawn, whether or not it was the one used.
  const temporary = drawn.filter(c => c.system.temporary);
  for (const card of temporary) await card.delete();

  /*
   * Either card being a Miss or Critical reshuffles the deck -- and a Wild does NOT, which is the
   * whole of what makes it permanent. Asking whether the card is special would reshuffle on a Wild
   * and quietly undo the one thing it is for.
   */
  const reshuffled = drawn.some(c => CARDRPG.fateSpecials[c.system.special]?.reshuffles);
  if (reshuffled) await reshuffleFate(actor);

  /*
   * A Wild is announced wherever it is drawn, rather than by each caller: it is the one fate card
   * whose result is a question for the table (the Wild Magic draw, ideas.md) instead of a number,
   * and a heal, an initiative and a Strike would otherwise each have to remember to mention it.
   */
  const wilds = drawn.filter(c => c.system.special === "wild").length;
  for (let i = 0; i < wilds; i++) await drawWildMagic(actor);

  return { result, drawn, used, reshuffled, temporary: temporary.length, wilds };
}

/** Apply a fate card to a value, without relying on the data model being live. */
export function applyFate(value, card) {
  if (card.system.special === "miss") return 0;
  if (card.system.special === "crit") return value * 2;
  // "The spell still happens" (ideas.md): a Wild is a plain resolution and a question afterwards.
  if (card.system.special === "wild") return Math.max(0, value);
  return Math.max(0, value + (card.system.value ?? 0));
}

/**
 * Put a special card into an actor's fate deck and shuffle.
 *
 * The one insertion path, because there are now two reasons to insert and they differ in exactly
 * one field: **Blessed and Cursed** shuffle in a `temporary` copy the rules remove when it is drawn
 * (core-rules 6), and a **Wild** is permanent -- it stays until a long rest at least, and Shadow
 * Magic's is for good (specializations.md). Writing the second one out beside the first is how the
 * two would drift.
 *
 * @returns {Promise<number>} how many cards went in.
 */
export async function addFateCards(actor, { special, count = 1, temporary = false, source = "" } = {}) {
  const rule = CARDRPG.fateSpecials[special];
  const deck = deckOf(actor, "fate");
  if (!rule || !deck || count < 1) return 0;

  const label = game.i18n.localize(rule.label);
  await deck.createEmbeddedDocuments("Card", Array.from({ length: count }, () => ({
    name: temporary ? `${label} (temporary)` : label,
    type: "fate",
    system: { special, temporary, source }
  })));
  await deck.shuffle({ chatNotification: false });
  return count;
}

/** Everything back into the fate deck, shuffled. */
export async function reshuffleFate(actor) {
  const deck = deckOf(actor, "fate");
  const discard = deckOf(actor, "fateDiscard");
  if (!deck) return;
  if (discard?.cards.size) await move(discard, deck, discard.cards.map(c => c.id));
  await normalizeDeck(deck, allStacks(actor));
  await deck.shuffle({ chatNotification: false });
}