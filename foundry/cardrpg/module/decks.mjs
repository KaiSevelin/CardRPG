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

/** Every Cards document an actor owns, so a repair can see where a copy might be sitting. */
export function allStacks(actor) {
  return Object.values(actor?.system.decks ?? {})
    .map(id => (id ? game.cards.get(id) : null))
    .filter(s => s);
}

/**
 * What a stack can actually deal.
 *
 * A card sitting in its home deck flagged `drawn` is not in the deck in any meaningful sense: it is
 * out on loan, and the copy in your hand is the real one. Foundry counts it in `cards.size` all the
 * same, so anything that draws has to filter it out or it will try to deal the same card twice.
 */
export function available(stack) {
  if (!stack) return [];
  return stack.type === "deck" ? stack.cards.filter(c => !c.drawn) : stack.cards.contents;
}

/**
 * Move `n` random cards from one pile to another. Returns the cards that moved.
 *
 * Cards.pass marks a card `drawn` when it leaves a deck and refuses to pass it again, which is what
 * stops a deck dealing the same card twice. So the pool is what is really there, never a card that
 * is already out.
 */
export async function moveRandom(from, to, n = 1) {
  if (!from || !to || n <= 0) return [];
  const pool = available(from);
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
 *  - cards with no face, which Foundry displays as "Unknown (<deck>)";
 *  - a home card whose copy is sitting in another pile but which has lost its `drawn` flag.
 *
 * That second one is the dangerous state, and this function used to *cause* it. `drawn` on a card
 * in its home deck means "a copy of me is live elsewhere"; it is exactly how Cards#pass refuses to
 * deal the same card twice. Clearing it across a deck -- which this did, to silence that refusal --
 * lets the deck deal a card that is already out, and the create then fails with
 * "The _id [...] already exists within the parent collection". So the flag is now restored, never
 * cleared, and `available()` keeps the refusal from being reached in the first place.
 *
 * @param {Cards} stack          The stack to repair.
 * @param {Cards[]} [elsewhere]  The other stacks a copy could be sitting in.
 */
export async function normalizeDeck(stack, elsewhere = []) {
  if (!stack) return 0;

  const onLoan = new Set();
  for (const other of elsewhere) {
    if (!other || other.id === stack.id || other.type === "deck") continue;
    for (const card of other.cards) onLoan.add(card.id);
  }

  const fixes = [];
  for (const card of stack.cards) {
    const update = { _id: card.id };
    let needed = false;
    if (stack.type === "deck" && card.isHome && !card.drawn && onLoan.has(card.id)) {
      update.drawn = true;
      needed = true;
    }
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
  if (available(deck).length < need) await reshuffleFate(actor);

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
  await normalizeDeck(deck, allStacks(actor));
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

  // Repair every pile, not just the deck: each one is where a copy of a deck card might be.
  const stacks = allStacks(actor);
  for (const stack of stacks) await normalizeDeck(stack, stacks);

  const size = actor.system.handSize?.max ?? CARDRPG.defaults.handSize;
  let drawn = 0;
  let taint = 0;

  while (hand.cards.size < size && available(deck).length > 0) {
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

/** Move cards out of the hand and into the discard: played halves, and Strain paid from hand. */
export async function discardCards(actor, cardIds) {
  const hand = deckOf(actor, "actionHand");
  const discard = deckOf(actor, "actionDiscard");
  return move(hand, discard, cardIds);
}

/**
 * Put played cards away, each according to what the half it was played for costs.
 *
 * Almost every card goes to the discard and comes back on a Catch Breath. A half printed *Spent*
 * retires its card to the Spent pile instead: out for the rest of the fight, back on a rest. That
 * is the only way a card leaves the loop by the player's own choice (core-rules 8).
 *
 * @param {Actor} actor
 * @param {{cardId: string, half: string}[]} plays  The halves that were just resolved.
 * @returns {Promise<Card[]>} the cards that were Spent, for the chat line.
 */
export async function retireCards(actor, plays) {
  const hand = deckOf(actor, "actionHand");
  if (!hand) return [];

  const spentPile = deckOf(actor, "actionSpent");
  const burns = [];
  const discards = [];

  for (const { cardId, half } of plays) {
    const card = hand.cards.get(cardId);
    if (!card) continue;
    // Only action cards carry costs; a Wound played as a dead card has no system.costs at all.
    if (spentPile && card.system?.isSpentBy?.(half)) burns.push(card);
    else discards.push(card.id);
  }

  if (discards.length) await discardCards(actor, discards);
  if (burns.length) await move(hand, spentPile, burns.map(c => c.id));
  return burns;
}

/** Can this actor Catch Breath at all? The discard has to cover the recovery in full. */
export function canCatchBreath(actor) {
  const discard = deckOf(actor, "actionDiscard");
  return (discard?.cards.size ?? 0) >= CARDRPG.defaults.breathRecovery;
}

/**
 * Catch Breath. Spend your whole turn to recover **2** cards from the discard, at random.
 *
 * Two, because two is the Exhausted threshold (core-rules 8): a breath buys exactly one turn that
 * is not Exhausted, and no more. A fixed, small recovery means breathing never bails you out of a
 * fight -- it keeps you playing one more round, at the price of this one.
 *
 * Nothing is Spent by breathing. The discard is a cycle, not a drain: breathe often enough and
 * every card in it comes back, and what the breath costs is the turn. What leaves the deck for good
 * is what the player chose to spend -- a half printed *Spent*, or the weight they chose to carry.
 *
 * The recovery is random, because choosing would turn a recovery into a tutor.
 *
 * @returns {Promise<object|null>} null when the discard cannot cover the recovery in full.
 */
export async function catchBreath(actor) {
  const deck = deckOf(actor, "action");
  const discard = deckOf(actor, "actionDiscard");
  if (!deck || !discard) return null;

  // All or nothing: a partial breath would let a one-card discard buy a whole turn.
  const take = CARDRPG.defaults.breathRecovery;
  if (discard.cards.size < take) return null;

  const recovered = await moveRandom(discard, deck, take);
  await deck.shuffle({ chatNotification: false });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p><strong>${actor.name}</strong> catches breath: recovered ${recovered.length}`
      + `, ${discard.cards.size} still in the discard.</p>`
  });

  return { recovered: recovered.length, left: discard.cards.size };
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
