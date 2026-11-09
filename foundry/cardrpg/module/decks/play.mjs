/**
 * What a turn and a rest do to the decks -- refilling a hand, spending it, catching
 * breath, and putting everything back afterwards.
 *
 * Part of the deck layer: see decks.mjs, which is the one door onto all of it.
 */

import { CARDRPG } from "../config.mjs";
import { afterDrawing, costsTheSlot, drawEffect } from "./intruders.mjs";
import { allStacks, available, deckOf, move, moveRandom, normalizeDeck } from "./stacks.mjs";

/**
 * Take a card out of the game entirely, wherever it happens to be sitting.
 *
 * **A dealt card is a copy.** `Cards#pass` marks the home card `drawn` and creates a second
 * document in the destination, which is what stops a deck dealing the same card twice -- so
 * deleting the copy in a hand leaves the home card in the deck, flagged, invisible and permanently
 * unavailable. The deck would quietly be one card smaller with nothing to say why, and
 * `normalizeDeck` would not rescue it: that function RESTORES the flag rather than clearing it,
 * on purpose, because clearing it across a deck is what used to let a deck deal a card twice.
 *
 * So it goes home first and dies there. Two operations for what looks like one, and the comment is
 * the reason it is not one.
 */
export async function removeCard(actor, card) {
  if (!card) return false;
  const parent = card.parent;
  /*
   * **The home deck is searched for, not assumed to be the action deck.**
   *
   * It used to be `deckOf(actor, "action")`, which was true of every caller until an injury owned
   * a **Doubt**: that card lives in the **skill** deck, and the old test
   * `deck.cards.get(card.id)` would simply have come back empty, fallen through to
   * `card.delete()` and deleted the dealt copy -- leaving the home card flagged `drawn` and
   * invisible. That is precisely the silent deck-shrink this function exists to prevent, one deck
   * over, and it would have shown up as a skill deck quietly two cards smaller after a Cleansing.
   *
   * `Cards#pass` deals a COPY and marks the home card drawn, and `normalizeDeck` *restores* that
   * flag rather than clearing it -- so the copy has to go home before it can be destroyed, and
   * which pile home is depends on the card.
   */
  const home = allStacks(actor).find(s => s.id !== parent?.id && s.cards.get(card.id));
  if (home) {
    await move(parent, home, [card.id]);
    await home.cards.get(card.id)?.delete();
    return true;
  }
  await card.delete();
  return true;
}

/* -------------------------------------------- */
/*  The action deck                             */
/* -------------------------------------------- */

/**
 * Refill the hand at the start of a round.
 *
 * An intruder that resolves on draw does so here, and the table says what that costs. Taint takes
 * its damage and the slot with it, so the hand legitimately comes up a card short. Fear moves you
 * and replaces itself, so a full hand stays full and what it spends is the square you were
 * standing in. A Wound does nothing on arrival and just sits there as a dead card until the end
 * of the turn.
 *
 * **The shortfall used to be wrong, and it was wrong in the expensive direction.** The old code
 * `break`-ed out of the refill on the first Taint, which does not mean "draw no replacement" --
 * it means "stop refilling". A hand of five that drew its Taint fourth came up with three cards
 * rather than four, and a second Taint behind it cost nothing at all because the loop had already
 * gone. The shortfall is counted now and the refill carries on, which is what core-rules 8 says:
 * *you don't draw a replacement, so your hand is one card short* -- one per dose.
 */
export async function refill(actor, { handlers = {} } = {}) {
  const deck = deckOf(actor, "action");
  const hand = deckOf(actor, "actionHand");
  const discard = deckOf(actor, "actionDiscard");
  if (!deck || !hand) return { drawn: 0, taint: 0 };

  // Repair every pile, not just the deck: each one is where a copy of a deck card might be.
  const stacks = allStacks(actor);
  for (const stack of stacks) await normalizeDeck(stack, stacks);

  const size = actor.system.handSize?.max ?? CARDRPG.defaults.handSize;
  let drawn = 0;
  let short = 0;            // slots an intruder took away with it, so the hand comes up short
  const resolved = {};      // how many of each kind resolved on the way in

  while (hand.cards.size + short < size && available(deck).length > 0) {
    const [card] = await moveRandom(deck, hand, 1);
    if (!card) break;

    const effect = drawEffect(card);
    if (effect) {
      /*
       * It resolves as it is dealt and then goes to the discard. Whether it also costs the slot is
       * the card's own dial and not a case here; a kind that replaces itself simply does not add
       * to `short`, and the loop carries on filling the hand.
       */
      /*
       * A kind with nothing to resolve it is the defect this table was built to close, and it can
       * only happen now by a caller omitting a handler -- so it says so instead of doing nothing.
       */
      const resolveIt = handlers[effect] ?? ON_DRAW[effect];
      if (!resolveIt) {
        ui.notifications?.error(`A ${effect} card was drawn and nothing can resolve it.`);
        console.error(`Card RPG | refill: no handler for "${effect}"`);
      }
      await resolveIt?.(actor, card);
      resolved[effect] = (resolved[effect] ?? 0) + 1;
      if (afterDrawing(card) === "gone") await removeCard(actor, card);
      else await move(hand, discard, [card.id]);
      if (costsTheSlot(card)) short++;
      continue;
    }
    drawn++;
  }

  return {
    drawn, short,
    taint: resolved.taint ?? 0,
    fear: resolved.fear ?? 0,
    rage: resolved.rage ?? 0
  };
}

/*
 * **What each kind does as it is dealt**, keyed by the `onDraw` in the table above.
 *
 * A table rather than the if/else chain this was: with two kinds a chain is shorter, with three it
 * is a list of names in a second place, which is the whole defect the intruder table exists to
 * close. Declared after the functions it names so each one is a plain declaration rather than a
 * forward reference.
 */
const ON_DRAW = { taint: applyTaint, fear: applyFear };

/**
 * **And the kinds this module cannot resolve by itself**, which the caller has to hand it.
 *
 * `rage` is a Strike: fate is drawn, armour applies, the target may react. That is the resolver's
 * job, and reaching for it from here meant decks.mjs and resolve.mjs imported each other -- broken
 * at runtime by a deferred `import()`, which is a cycle with better manners rather than no cycle.
 *
 * Named here rather than left implicit so the completeness check below still has both halves to
 * add up: every kind the intruder table says resolves on draw is either in `ON_DRAW` or in this
 * list, and a kind in neither is a card that would silently do nothing when drawn.
 */
const FROM_CALLER = ["rage"];

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

/**
 * Fear: one square directly away from the nearest enemy, and then the card is gone.
 *
 * **What it spends is the square you chose to be standing in, and nothing else.** A replacement
 * IS drawn, unlike Taint, so a full hand stays full -- the whole price is tempo and position. That
 * makes it the first intruder whose cost depends on how well you were doing: it is worth most
 * against the Way whose stated thesis is that *standing next to somebody is worth something*, and
 * very nearly nothing to an archer who wanted the distance anyway. The asymmetry is the point.
 * Fear routs a front line and leaves the back one exactly where it was.
 *
 * It moves the token itself where it can, the way `sidestep` does and for the same reason: a
 * forced move the player makes by hand is a forced move the player can quietly not make. With no
 * tokens on a scene it says so and leaves the step to the GM, which is what `pullShooterTo` does.
 *
 * Two ways it can buy nothing, and both are legal. **Nothing to flee from** -- drawn with no enemy
 * on the board, which is what happens when a fight ends before your deck has cycled. And
 * **cornered**: every square that is further away is occupied or off the grid, so you stand there
 * and are afraid. The card is spent either way, because the card's text is what it tells you to
 * do and not what it achieves.
 */
export async function applyFear(actor, card) {
  const say = text => ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> draws <em>${card.name}</em>: `
      + `${text}</p></div>`
  });

  const token = actor?.getActiveTokens?.()[0];
  const cell = canvas?.grid?.size;
  if (!token || !canvas?.ready || !cell) {
    await say("move 1 square directly away from the nearest enemy. <em>No token placed &mdash; the "
      + "GM moves it.</em>");
    return;
  }

  const hostile = canvas.tokens.placeables.filter(t =>
    t.id !== token.id && t.document?.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE);
  if (!hostile.length) {
    await say("nothing on the board to be afraid of. The card is spent and you stand your ground.");
    return;
  }

  /* Chebyshev throughout, because the scene's diagonals are equidistant (core-rules 11). */
  const cheb = (ax, ay, bx, by) => Math.max(Math.abs(ax - bx), Math.abs(ay - by)) / cell;
  const from = hostile.reduce((a, b) =>
    (cheb(b.x, b.y, token.x, token.y) < cheb(a.x, a.y, token.x, token.y) ? b : a));

  const taken = new Set(canvas.tokens.placeables
    .filter(t => t.id !== token.id)
    .map(t => `${t.x},${t.y}`));
  const here = cheb(token.x, token.y, from.x, from.y);

  const legal = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const x = token.x + dx * cell;
      const y = token.y + dy * cell;
      if (taken.has(`${x},${y}`)) continue;
      // A step that does not increase the distance is not flight, whatever direction it faces.
      if (cheb(x, y, from.x, from.y) <= here) continue;
      legal.push({ x, y });
    }
  }
  if (!legal.length) {
    await say(`cornered by <strong>${from.document.name}</strong> &mdash; there is nowhere further `
      + `to go. The card is spent.`);
    return;
  }

  // The furthest of them, so the flight is the best step available rather than an arbitrary one.
  const to = legal.reduce((a, b) =>
    (cheb(b.x, b.y, from.x, from.y) > cheb(a.x, a.y, from.x, from.y) ? b : a));
  await token.document.update({ x: to.x, y: to.y });
  await say(`1 square away from <strong>${from.document.name}</strong>. A replacement card is `
    + `drawn &mdash; what this costs is the square.`);
}

/** Move cards out of the hand and into the discard: played halves, and Strain paid from hand. */
export async function discardCards(actor, cardIds) {
  const hand = deckOf(actor, "actionHand");
  const discard = deckOf(actor, "actionDiscard");
  return move(hand, discard, cardIds);
}

/**
 * Draw up to the skill hand size, which happens **at the start of a scene** rather than on a turn.
 *
 * That is the whole difference between the two decks' rhythms and it is a difference in kind: an
 * action hand refills once a round because a round is a thing the engine knows about, and a scene
 * is a thing only the GM knows about (skill-rules 1: *the GM says when a new scene starts, e.g. a
 * new location, a new conversation, or time passing*). So this is not on a hook -- nothing could
 * raise it -- and it is the same shape as granting a level: the GM says when.
 *
 * **The discard does not come back here.** skill-rules is explicit that it returns on a rest and
 * not on a shuffle, so a deck that has run out stays run out until somebody rests, and the
 * improvising rule is what a character has instead.
 */
export async function dealSkillHand(actor) {
  const deck = deckOf(actor, "skill");
  const hand = deckOf(actor, "skillHand");
  if (!deck || !hand) return { drawn: 0, cleared: 0 };

  /*
   * **A Doubt is discarded when the scene it clogged ends** (core-rules 8), and this is the only
   * moment the engine is ever told that a scene ended: the skill hand is dealt at the start of one
   * and nothing else marks the boundary. So the old fright goes out before the new hand comes in,
   * which is that sentence read from the only hook there is. It goes to the skill discard like any
   * played card, and the skill discard comes back on a rest rather than on a shuffle -- so a Doubt
   * costs one scene now and waits to cost another.
   */
  const stale = [...hand.cards].filter(c => c.type === "doubt");
  if (stale.length) await discardSkillCards(actor, stale.map(c => c.id));

  const size = CARDRPG.defaults.skillHandSize;
  const want = Math.max(0, size - hand.cards.size);
  if (!want) return { drawn: 0, cleared: stale.length };
  const moved = await moveRandom(deck, hand, want);
  return { drawn: moved.length, cleared: stale.length };
}

/** A played skill card goes to the skill discard, which only a rest brings back. */
export async function discardSkillCards(actor, cardIds) {
  return move(deckOf(actor, "skillHand"), deckOf(actor, "skillDiscard"), cardIds);
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
  if ((discard?.cards.size ?? 0) < CARDRPG.defaults.breathRecovery) return false;

  /*
   * **A Compulsion is the one intruder that takes an option rather than a resource** (core-rules 8),
   * and it is tested here rather than in the tray because the tray is one caller of three and the
   * rule is about whether the breath is legal, not about whether a button is drawn.
   */
  const hand = deckOf(actor, "actionHand");
  return ![...(hand?.cards ?? [])].some(c => c.type === "compulsion");
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
  await clearFear(actor);
  const deck = deckOf(actor, "action");
  for (const which of ["actionHand", "actionDiscard"]) {
    const pile = deckOf(actor, which);
    if (pile?.cards.size) await move(pile, deck, pile.cards.map(c => c.id));
  }
  await deck?.shuffle({ chatNotification: false });
  await actor.update({ "system.block": 0, "system.blockPersists": false });
}

/**
 * Fear does not outlive the fight that caused it (core-rules 8).
 *
 * A Wound and a Taint are swept back into the deck by `afterCombat` because they are supposed to
 * still be there next time; a Fear card that was never drawn is a fright nobody is owed any more.
 * The piles go first and through `removeCard`, because a card sitting in a hand may be a copy whose
 * home is in the deck -- and then the deck itself, for the ones that were never dealt.
 */
async function clearFear(actor) {
  let gone = 0;
  for (const which of ["actionHand", "actionDiscard"]) {
    const pile = deckOf(actor, which);
    for (const card of [...(pile?.cards ?? [])]) {
      if (card.type !== "fear") continue;
      await removeCard(actor, card);
      gone++;
    }
  }
  const deck = deckOf(actor, "action");
  for (const card of [...(deck?.cards ?? [])]) {
    if (card.type !== "fear") continue;
    await card.delete();
    gone++;
  }
  return gone;
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
