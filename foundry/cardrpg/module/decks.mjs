/**
 * Deck operations: the engine the tray sits on.
 *
 * Cards physically move between documents rather than being flagged in place, because the game is
 * built on card counting -- a face-up fate discard with k cards left means a 2/k chance of a swing,
 * and that only works if the piles are real.
 *
 * Every draw picks random ids rather than relying on sort order. Drawing n random cards without
 * replacement is distributionally identical to drawing from a shuffled deck, and it keeps the
 * randomness somewhere we control.
 */

import { CARDRPG } from "./config.mjs";

/* -------------------------------------------- */
/*  Primitives                                  */
/* -------------------------------------------- */

/** The Cards document behind one of an actor's deck slots. */
export function deckOf(actor, which) {
  const id = actor.system.decks?.[which];
  const doc = id ? game.cards.get(id) : null;
  if (!doc) console.warn(`Card RPG | ${actor.name} has no '${which}' deck wired up`);
  return doc;
}

/**
 * Move `n` random cards from one pile to another. Returns the cards that moved.
 *
 * Cards.pass marks a card `drawn` when it leaves a deck, and refuses to pass one that is already
 * drawn. Passing a card BACK into a deck does not clear that flag, so a card returned by Catch
 * Breath or after combat would be stuck -- the next draw out of the deck throws "may not pass Card
 * X which has already been drawn". Clearing it on the way in is the fix.
 */
export async function moveRandom(from, to, n = 1) {
  if (!from || !to || n <= 0) return [];
  const pool = from.cards.contents;
  if (!pool.length) return [];

  const ids = [];
  const remaining = [...pool];
  for (let i = 0; i < Math.min(n, pool.length); i++) {
    ids.push(remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0].id);
  }
  return move(from, to, ids);
}

/** Move specific cards, clearing `drawn` when they land back in a deck. */
export async function move(from, to, ids) {
  if (!from || !to || !ids?.length) return [];
  const moved = (await from.pass(to, ids, { chatNotification: false })) ?? [];
  if (to.type === "deck" && moved.length) {
    await to.updateEmbeddedDocuments("Card", moved.map(c => ({ _id: c.id, drawn: false })));
  }
  return moved;
}

/** A card's readable name, never Foundry's "Unknown (<deck>)" placeholder for a faceless card. */
export function cardName(card) {
  return card?.faces?.[0]?.name || card?._source?.name || card?.name || "?";
}

/**
 * Repair a stack in place. Self-healing, because a world built before these fixes is already in
 * the bad state and should not need rebuilding:
 *
 *  - cards sitting in a deck but flagged `drawn`, which makes the next draw throw;
 *  - cards with no face, which Foundry displays as "Unknown (<deck>)".
 */
export async function normalizeDeck(stack) {
  if (!stack) return 0;
  const fixes = [];
  for (const card of stack.cards) {
    const update = { _id: card.id };
    let needed = false;
    if (stack.type === "deck" && card.drawn) { update.drawn = false; needed = true; }
    if (!card.faces?.length) {
      const name = card._source?.name || card.name;
      if (name && !name.startsWith("Unknown")) {
        update.faces = [{ name }];
        update.face = 0;
        needed = true;
      }
    }
    if (needed) fixes.push(update);
  }
  if (!fixes.length) return 0;
  await stack.updateEmbeddedDocuments("Card", fixes);
  console.log(`Card RPG | repaired ${fixes.length} cards in ${stack.name}`);
  return fixes.length;
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
  if (deck.cards.size < need) await reshuffleFate(actor);

  const drawn = await moveRandom(deck, discard, need);
  if (!drawn.length) return { result: value, drawn: [], used: null, reshuffled: false };

  const rank = card => card.system.special ? CARDRPG.fateRank[card.system.special] : card.system.value;
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

  // Either card being a Miss or Critical reshuffles the deck.
  const reshuffled = drawn.some(c => c.system.special);
  if (reshuffled) await reshuffleFate(actor);

  return { result, drawn, used, reshuffled, temporary: temporary.length };
}

/** Apply a fate card to a value, without relying on the data model being live. */
export function applyFate(value, card) {
  if (card.system.special === "miss") return 0;
  if (card.system.special === "crit") return value * 2;
  return Math.max(0, value + (card.system.value ?? 0));
}

/** Everything back into the fate deck, shuffled. */
export async function reshuffleFate(actor) {
  const deck = deckOf(actor, "fate");
  const discard = deckOf(actor, "fateDiscard");
  if (!deck) return;
  if (discard?.cards.size) await move(discard, deck, discard.cards.map(c => c.id));
  await normalizeDeck(deck);
  await deck.shuffle({ chatNotification: false });
}

/* -------------------------------------------- */
/*  The action deck                             */
/* -------------------------------------------- */

/**
 * Refill the hand at the start of a round.
 *
 * Taint resolves the moment it is drawn -- 1 damage ignoring armor, discard, and draw NO
 * replacement -- so the hand legitimately comes up short. A Wound just sits in the hand as a dead
 * card until the end of the turn.
 */
export async function refill(actor) {
  const deck = deckOf(actor, "action");
  const hand = deckOf(actor, "actionHand");
  const discard = deckOf(actor, "actionDiscard");
  if (!deck || !hand) return { drawn: 0, taint: 0 };

  // Repair every pile, not just the deck: a card drawn before the fix is sitting in the hand.
  for (const which of ["action", "actionHand", "actionDiscard", "actionSpent", "fate", "fateDiscard"]) {
    await normalizeDeck(deckOf(actor, which));
  }

  const size = actor.system.handSize?.max ?? CARDRPG.defaults.handSize;
  let drawn = 0;
  let taint = 0;

  while (hand.cards.size < size && deck.cards.size > 0) {
    const [card] = await moveRandom(deck, hand, 1);
    if (!card) break;

    if (card.type === "taint") {
      // Resolves at once, and costs the slot: no replacement is drawn.
      await applyTaint(actor, card);
      await move(hand, discard, [card.id]);
      taint++;
      break;
    }
    drawn++;
  }

  return { drawn, taint };
}

/** Taint: 1 damage ignoring armor. */
async function applyTaint(actor, card) {
  const health = Math.max(0, actor.system.health.value - 1);
  await actor.update({ "system.health.value": health });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p><strong>${actor.name}</strong> draws <em>${card.name}</em>: 1 damage, ignoring armor. `
      + `No replacement card.</p>`
  });
}

/** Play card halves: both cards go to the discard. */
export async function discardCards(actor, cardIds) {
  const hand = deckOf(actor, "actionHand");
  const discard = deckOf(actor, "actionDiscard");
  return move(hand, discard, cardIds);
}

/**
 * Catch Breath. Spend your whole turn to recover **half** the discard pile, rounded up, at random;
 * one of the cards left behind is Spent, and the rest stay in the discard.
 *
 * You never get the whole pile back, so a second Catch Breath recovers half of what remains. Only a
 * rest truly restores you -- and because the recovery is half of whatever is there, breathing early
 * with a thin discard costs a turn for almost nothing.
 */
export async function catchBreath(actor) {
  const deck = deckOf(actor, "action");
  const discard = deckOf(actor, "actionDiscard");
  const spent = deckOf(actor, "actionSpent");
  if (!deck || !discard) return null;

  const size = discard.cards.size;
  if (!size) return { recovered: 0, spent: null, left: 0 };

  const take = Math.ceil(size / 2);
  const recovered = await moveRandom(discard, deck, take);
  await deck.shuffle({ chatNotification: false });

  // One of those left behind is Spent, and stays out until a rest.
  let spentCard = null;
  if (discard.cards.size && spent) {
    [spentCard] = await moveRandom(discard, spent, 1);
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p><strong>${actor.name}</strong> catches breath: recovered ${recovered.length} of ${size}`
      + (spentCard ? `, spent <em>${spentCard.name}</em>` : "")
      + `, ${discard.cards.size} still in the discard.</p>`
  });

  return { recovered: recovered.length, spent: spentCard, left: discard.cards.size };
}

/**
 * Becoming Overloaded sets aside random cards as Spent; dropping below it shuffles them back.
 * This is the one derived state that mutates card state, so it fires on the transition rather than
 * on every recompute.
 */
export async function setOverloaded(actor, overloaded) {
  const deck = deckOf(actor, "action");
  const hand = deckOf(actor, "actionHand");
  const spent = deckOf(actor, "actionSpent");
  if (!deck || !spent) return;

  const flagged = actor.getFlag("cardrpg", "overloadedSpent") ?? [];

  if (overloaded && !flagged.length) {
    const n = game.settings.get("cardrpg", "overloadedSpent");
    // Normally you pick a load up between fights, when the deck is whole; mid-fight it comes off
    // the draw pile, or the hand if that is empty.
    let moved = await moveRandom(deck, spent, n);
    if (moved.length < n && hand) {
      moved = moved.concat(await moveRandom(hand, spent, n - moved.length));
    }
    await actor.setFlag("cardrpg", "overloadedSpent", moved.map(c => c.id));
    if (moved.length) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<p><strong>${actor.name}</strong> is <strong>Overloaded</strong>: `
          + `${moved.length} cards set aside as Spent.</p>`
      });
    }
  } else if (!overloaded && flagged.length) {
    const ids = flagged.filter(id => spent.cards.get(id));
    if (ids.length) {
      await move(spent, deck, ids);
      await deck.shuffle({ chatNotification: false });
    }
    await actor.unsetFlag("cardrpg", "overloadedSpent");
  }
}

/* -------------------------------------------- */
/*  Between fights                              */
/* -------------------------------------------- */

/** After combat: hand and discard go back into the deck. Spent cards stay out. */
export async function afterCombat(actor) {
  const deck = deckOf(actor, "action");
  for (const which of ["actionHand", "actionDiscard"]) {
    const pile = deckOf(actor, which);
    if (pile?.cards.size) await move(pile, deck, pile.cards.map(c => c.id));
  }
  await deck?.shuffle({ chatNotification: false });
  await actor.update({ "system.block": 0, "system.blockPersists": false });
}

/** A rest returns Spent cards. A long rest also heals 5 and removes a Wound. */
export async function rest(actor, { long = false } = {}) {
  const deck = deckOf(actor, "action");
  const spent = deckOf(actor, "actionSpent");

  if (spent?.cards.size) {
    // Cards set aside by being Overloaded come back when the load is dropped, not on a rest.
    const held = actor.getFlag("cardrpg", "overloadedSpent") ?? [];
    const ids = spent.cards.filter(c => !held.includes(c.id)).map(c => c.id);
    if (ids.length) await move(spent, deck, ids);
  }
  await deck?.shuffle({ chatNotification: false });

  const update = {};
  const heal = long ? 5 : 1;
  update["system.health.value"] = Math.min(actor.system.health.max, actor.system.health.value + heal);
  if (long) update["system.rest.tokens"] = actor.system.rest.max;
  else update["system.rest.tokens"] = Math.max(0, actor.system.rest.tokens - 1);
  await actor.update(update);

  return { heal, long };
}
