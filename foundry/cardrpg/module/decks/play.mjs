/**
 * What a turn and a rest do to the decks -- refilling a hand, spending it, catching
 * breath, and putting everything back afterwards.
 *
 * Part of the deck layer: see decks.mjs, which is the one door onto all of it.
 */

import { CARDRPG } from "../config.mjs";
import { afterDrawing, costsTheSlot, drawEffect } from "./intruders.mjs";
import {
  allStacks, available, deckOf, move, moveRandom, normalizeDeck, reserveHand
} from "./stacks.mjs";

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
 *
 * **And the hand comes upright first**, because a round is a fresh question. See the note on
 * `roused` below.
 */
export async function refill(actor, { handlers = {} } = {}) {
  const deck = deckOf(actor, "action");
  const hand = deckOf(actor, "actionHand");
  const discard = deckOf(actor, "actionDiscard");
  if (!deck || !hand) return { drawn: 0, taint: 0 };

  // Repair every pile, not just the deck: each one is where a copy of a deck card might be.
  const stacks = allStacks(actor);
  for (const stack of stacks) await normalizeDeck(stack, stacks);

  /*
   * **The hand comes up before it is filled.**  **[FIXED 2026-11-22]**
   *
   * `move` clears `reserved` on every card it moves, which made *everything you draw arrives
   * upright* true of the cards that arrive and false of the cards that stay. A turn ends by
   * turning the whole hand sideways (`#disarmHand`), so the leftovers were still sideways a round
   * later, under a row of upright new ones -- the player's hand slowly going down and staying down
   * while nobody said so.
   *
   * The disarm is a default for a turn that is OVER. A refill is the next turn beginning, and
   * core-rules 3 makes it a fresh question: you declare what you will spend each round, and the
   * declaration does not carry. So it is cleared here, at the start of the round, for the whole
   * hand rather than for the cards that happened to move.
   *
   * Counted and returned rather than announced: the cards visibly stand up, and the one thing
   * worth a notification is the disarm, which is the direction that costs the player something.
   */
  const roused = await reserveHand(actor, false);

  const size = actor.system.handSize?.max ?? CARDRPG.defaults.handSize;
  let drawn = 0;
  let short = 0;            // slots an intruder took away with it, so the hand comes up short
  const resolved = {};      // how many of each kind resolved on the way in

  while (hand.cards.size + short < size) {
    /*
     * **The deck is a cycle and the cycle is free** (core-rules 8). An empty draw pile with
     * stamina left is the discard shuffled back, which costs nothing and no turn -- so a thin
     * deck means the same cards come round sooner rather than a shorter fight.
     *
     * With no stamina left it does NOT cycle, which is what makes 0 a wall: `spendStamina` has
     * already emptied the draw pile into the discard, and this is the line that leaves it there.
     */
    if (!available(deck).length && discard?.cards.size && (actor.system?.stamina?.value ?? 0) > 0) {
      await move(discard, deck, discard.cards.map(c => c.id));
      await deck.shuffle({ chatNotification: false });
    }
    if (!available(deck).length) break;

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
    drawn, short, roused,
    taint: resolved.taint ?? 0,
    fear: resolved.fear ?? 0,
    rage: resolved.rage ?? 0
  };
}

/**
 * **How many cards a hand is still missing, which is not the same as how many were drawn.**
 * **[BUILT 2026-11-22]**
 *
 * `drawn` is 0 for a player holding a full hand, and the deck button read that as *your draw pile
 * is empty* -- a warning about a problem they did not have, pointing them at Catch Breath for
 * stamina they need not spend. The question *did the deck run out* is a question about the hand.
 *
 * `short` is the part that cannot be read off the hand: an intruder that was dealt, resolved and
 * binned took a slot with it, so a hand of four with one Fear behind it is full rather than one
 * card down. The caller has that number from its own `refill` and passes it back in.
 *
 * One predicate, because two readers must agree: the turn-start deal whispers the GM, the deck
 * button warns the player, and a hand that is short for one of them is short for both.
 */
export function handShort(actor, short = 0) {
  const size = actor?.system?.handSize?.max ?? 0;
  if (!size) return 0;
  const held = deckOf(actor, "actionHand")?.cards.size ?? 0;
  return Math.max(0, size - held - short);
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
 * **A card you play costs 1 stamina, and nothing you did not play costs any** (core-rules 8).
 *
 * One gate for every play site -- the turn's two halves through `retireCards`, and the reaction
 * through `spendReaction` -- because a budget three places decrement separately is three rules,
 * and the `DEAD` set in resolve.mjs is this project's standing proof of how that ends.
 *
 * **It is deliberately not called from `discardCards`.** A card reaches the discard for reasons
 * that are not playing it: a Wound retired at the end of a turn, an intruder resolved on the way
 * into a hand, a card knocked out of your grip by a heavy hit, Strain. Charging stamina there
 * would charge for all of them, and core-rules 8 says plainly that it charges for none.
 *
 * **At 0 the rest of the draw pile is discarded.** That is the whole of the wall and it needs no
 * new state: the discard is still there, so a breath can still reach the stat, and the cards come
 * back the moment there is stamina to cycle them with.
 *
 * @param {Actor} actor
 * @param {number} n How many cards were played.
 */
export async function spendStamina(actor, n = 1) {
  const stamina = actor.system?.stamina;
  if (!stamina || n <= 0) return null;
  /*
   * **And nothing is spent outside a fight.**  **[FIXED 2026-11-23]**
   *
   * Stamina measures ONE FIGHT -- that is why `afterCombat` hands all of it back, and the note
   * there says so. Outside a fight there is no fight for it to measure, and nothing ever hands it
   * back either: `afterCombat` runs when a combat ENDS, so a combat that never started never ends
   * and every point spent in the corridor was gone for the evening. Six doors opened put a
   * character on the floor of their own stamina with the draw pile emptied into the discard, and
   * the only cure was to start a fight and finish it.
   *
   * It is the same ruling as the turn's two halves (core-rules 3): out there the same turn never
   * ends, so a cost that is paid back at the end of a turn can never be paid back at all.
   */
  if (!game.combat?.started) return null;

  const left = Math.max(0, stamina.value - n);
  await actor.update({ "system.stamina.value": left });

  let dumped = 0;
  if (left === 0) {
    const deck = deckOf(actor, "action");
    const discard = deckOf(actor, "actionDiscard");
    const ids = available(deck).map(c => c.id);
    if (ids.length && discard) {
      await move(deck, discard, ids);
      dumped = ids.length;
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p><strong>${actor.name}</strong> is out of <strong>stamina</strong>`
        + (dumped ? `: ${dumped} cards left the draw pile.` : ".")
        + ` Nothing left but to catch breath.</p>`
    });
  }
  return { left, dumped };
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
  /*
   * **Outside a fight a played card is not put away at all.**  **[FIXED 2026-11-23]**
   *
   * Reported from a table as *the action deck gets empty even outside a fight*, and that is
   * exactly what happened: each card played in the corridor went to the discard, the hand drew a
   * replacement off the draw pile, and nothing ever brought either back -- `afterCombat` is the
   * one routine that sweeps the piles into the deck and it runs when a FIGHT ends. So an evening
   * of talking and searching ran the deck down to nothing, permanently, and the player had done
   * nothing wrong.
   *
   * core-rules 3 already rules the half of this that is about the budget: *outside a fight there
   * is no budget at all*, because a turn's pair of halves holds only while a turn comes round
   * again. The card itself is the same argument and the same sentence -- the discard is where a
   * card waits for a refill, and out there nothing refills.
   *
   * So the card stays in your hand, which is also what the table expects: open a door, then open
   * another, with the same card. A cost the fiction wants is the GM's to ask for.
   *
   * **A half printed Spent is not spent either**, for the one reason Spent exists -- it is out
   * *for the rest of the fight* (core-rules 8), and there is no fight for it to be out of.
   */
  if (!game.combat?.started) return [];

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
  /*
   * Both halves cost the same 1, whether the card went to the discard or to the Spent pile:
   * core-rules 8 charges for *playing*, and Spent is already a steeper price in cards.
   */
  await spendStamina(actor, discards.length + burns.length);
  return burns;
}

/**
 * Can this actor Catch Breath at all?
 *
 * **[2026-11-12]** The gate used to be *the discard has to cover the recovery in full*, because a
 * breath moved two cards out of it. A breath moves no cards now -- it buys back the stat, and the
 * cycle returns the cards on its own -- so the only thing that can make one pointless is having
 * nothing to buy back. Breathing at full stamina is refused rather than wasted.
 */
export function canCatchBreath(actor) {
  const stamina = actor.system?.stamina;
  if (stamina && stamina.value >= stamina.max) return false;

  /*
   * **A Compulsion is the one intruder that takes an option rather than a resource** (core-rules 8),
   * and it is tested here rather than in the tray because the tray is one caller of three and the
   * rule is about whether the breath is legal, not about whether a button is drawn.
   */
  const hand = deckOf(actor, "actionHand");
  return ![...(hand?.cards ?? [])].some(c => c.type === "compulsion");
}

/**
 * Catch Breath. Spend your whole turn, playing nothing, and regain **2 stamina**.
 *
 * **Never above your maximum**, so breathing before you have run out is refused rather than
 * wasted. Two, because two stamina is one full turn: the trade is this turn for a normal one next
 * round, which is what keeps a breath a way to keep playing and never a way to get back on top.
 *
 * **There is no limit on how often**, so running out is an interval and not an ending -- a hero at
 * the end of their stamina fights on at half rate for as long as the fight lasts. That is the
 * ruling of 2026-11-12 and the alternative was a wall, which ends a character's participation
 * rather than slowing it.
 *
 * **[2026-11-12] It moves no cards.** It used to shuffle two out of the discard at random, and the
 * randomness was load-bearing because choosing would have made a recovery into a tutor. The deck
 * now cycles for free the moment the draw pile empties, so moving cards here would change which
 * card comes next and not how many more there are -- the only thing a breath can usefully buy is
 * the stat. `refill` does the shuffling, as a consequence of having stamina rather than as a
 * reward for spending a turn.
 *
 * @returns {Promise<object|null>} null when there is no stamina to buy back.
 */
export async function catchBreath(actor) {
  const stamina = actor.system?.stamina;
  if (!stamina || stamina.value >= stamina.max) return null;

  const take = CARDRPG.defaults.breathRecovery;
  const left = Math.min(stamina.max, stamina.value + take);
  await actor.update({ "system.stamina.value": left });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<p><strong>${actor.name}</strong> catches breath: `
      + `<strong>${left - stamina.value}</strong> stamina back, ${left} of ${stamina.max} left.</p>`
  });

  return { recovered: left - stamina.value, left, max: stamina.max };
}

/*
 * **[2026-11-12] `setOverloaded` is gone, and so is the flag, the setting and the rest's special
 * case for the cards it held.**
 *
 * It set aside two random cards as Spent and shuffled them back when the load came off: thirty-odd
 * lines, a flag, a world setting and a branch in `rest`, all to mutate card state on a transition
 * of a derived value. core-rules 8 always said Overloaded *costs you stamina* and charged it in
 * cards because the deck WAS the stamina.
 *
 * Measured once they were two things, two cards set aside was worth -0.1 / -0.2 / +0.8 / -0.5 --
 * nothing at all, because a card nobody played costs nothing. Two stamina is -2.0 / -5.7 / -10.2 /
 * -8.3, against the old reading's measured -2.3 / -6.5 / -11.2 / -8.5.
 *
 * So it is now one clause on `stamina.max` in `CharacterData.prepareDerivedData`, beside the
 * afflicted Health penalty it reads exactly like. A derived cost for a derived state, which is
 * what it should always have been.
 */

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
  /*
   * **Stamina comes back in full when the fight ends**, because it measures one fight. What a
   * fight costs you past its own end is Spent cards, Wounds and Taint -- the things `afterCombat`
   * deliberately does not sweep up.
   */
  await actor.update({
    "system.block": 0,
    "system.blockPersists": false,
    "system.stamina.value": actor.system.stamina?.max ?? CARDRPG.defaults.stamina
  });
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

/**
 * **Take one Wound out of a character, wherever it is sitting.**  **[BUILT 2026-11-24]**
 *
 * There was no such routine. The rules give a Wound two ways out -- *a long rest removes 1* and
 * *treatment: a Lore check with a Healer's Kit removes 1* -- and **neither had an engine path**,
 * so a Wound was permanent in practice: swept into the deck at the end of a fight and dealt back
 * into the hand for ever after, one card of a hand of five gone to a hit taken weeks ago.
 *
 * One routine, because there are two ways out and the cards must leave the same way whichever it
 * was -- the argument `liftInjury` makes about its own intruders, and the reason this takes the
 * `how` rather than knowing it: a long rest and a Healer's Kit remove the same card for different
 * reasons, and the chat line is the only place that difference exists.
 *
 * **Any stack, because a Wound travels.** It is created in the discard, swept into the deck by
 * `afterCombat`, and dealt into the hand by a refill -- so asking one pile would find nothing
 * about two thirds of the time. `removeCard` is what copes with a dealt card being a copy whose
 * home is in the deck.
 *
 * @returns {Promise<boolean>} whether one was found and taken.
 */
export async function removeWound(actor, { how = "rest" } = {}) {
  for (const stack of allStacks(actor)) {
    const wound = [...(stack?.cards ?? [])].find(c => c.type === "wound");
    if (!wound) continue;
    await removeCard(actor, wound);
    return true;
  }
  return false;
}

/**
 * **A rest, and all of what one does.**
 *
 * It returned the action deck's Spent cards, healed, and set the rest tokens. Three other things
 * the rules give a rest it did not do, and two of them were described in this file's own comments:
 *
 * - **The skill deck never came back.**  **[FIXED 2026-11-24]** skill-rules 1 is explicit --
 *   *the skill discard pile is not reshuffled automatically; it comes back on a short rest (needs
 *   a rest token) or a long rest* -- and `dealSkillHand` relies on it in as many words: *a deck
 *   that has run out stays run out until somebody rests*. Nobody resting ever brought it back, so
 *   a skill deck drained across a session for good: every check played, every Strain paid at
 *   preparing, every Doubt cleared at a scene's end. The same defect the action deck was reported
 *   for on 2026-11-23, in the other deck, found by sweeping for fields nothing reads.
 * - **A long rest removed no Wound.**  **[FIXED 2026-11-24]** The Rests table says *Wounds:
 *   remove 1*, and the one-line comment that used to sit on this function said so too. It healed
 *   5 and removed nothing, and **nothing anywhere else removed a Wound either** -- so a Wound was
 *   permanent, and the treatment the rules offer (a Lore check with a Healer's Kit) had no engine
 *   path to pay out into. `removeWound` is that path now and this is its first caller.
 * - **And a rest said nothing at all.** Reported as *the button should work*: a short rest with a
 *   full hand, full health and no Spent cards changed one invisible number and posted no line, so
 *   pressing it looked like pressing nothing. It reports now, every time, even when the answer is
 *   that there was nothing to put right.
 *
 * **A short rest costs a token, and that is refused here rather than only on the button.** The
 * sheet disables the button at nought, which is a real gate for a player and no gate at all for a
 * macro -- the same door-and-window distinction `payToCast` was given on 2026-11-24.
 *
 * @returns {Promise<object|null>} what the rest did, or null if it was refused.
 */
export async function rest(actor, { long = false } = {}) {
  const deck = deckOf(actor, "action");
  const spent = deckOf(actor, "actionSpent");

  if (!long && (actor.system.rest?.tokens ?? 0) < 1) {
    ui.notifications?.warn(`${actor.name} has no rest token left. A short rest costs one; `
      + "a long rest returns them all.");
    return null;
  }

  const returned = spent?.cards.size ?? 0;
  if (returned) {
    /*
     * Every Spent card comes back. There is no longer a set held out by being Overloaded: that
     * drawback is two points of stamina now and never touches a card.
     */
    await move(spent, deck, spent.cards.map(c => c.id));
  }
  await deck?.shuffle({ chatNotification: false });

  /*
   * **And the skill deck, on either rest.** A pile rather than a Spent stack, because the skill
   * side has no Spent pile: a played skill card goes to the discard and the discard is what a rest
   * returns (skill-rules 1). Shuffled, because what comes back must not come back in the order it
   * was played.
   */
  const skill = deckOf(actor, "skill");
  const skillDiscard = deckOf(actor, "skillDiscard");
  const relearned = skillDiscard?.cards.size ?? 0;
  if (relearned && skill) {
    await move(skillDiscard, skill, skillDiscard.cards.map(c => c.id));
    await skill.shuffle({ chatNotification: false });
  }

  /*
   * **A long rest takes one Wound**, which is the Rests table read literally. A short one does
   * not: that asymmetry is the whole reason there are two rests.
   */
  const wound = long ? await removeWound(actor, { how: "a long rest" }) : false;

  const update = { "system.stamina.value": actor.system.stamina?.max ?? CARDRPG.defaults.stamina };
  const heal = long ? 5 : 1;
  /* What was actually gained rather than what was offered: *heals 5* beside a character who was
   * one short of full is a line that is wrong about the only number it carries. */
  const before = actor.system.health.value;
  update["system.health.value"] = Math.min(actor.system.health.max, before + heal);
  const healed = update["system.health.value"] - before;
  if (long) update["system.rest.tokens"] = actor.system.rest.max;
  else update["system.rest.tokens"] = Math.max(0, actor.system.rest.tokens - 1);
  await actor.update(update);

  /*
   * **And the slates a rest brings back, which nothing ever did.**  **[FIXED 2026-11-24]**
   *
   * `CARDRPG.recharges` has held three boundaries since drained slates were built -- `combat`,
   * `shortRest`, `longRest` -- and only the first was ever honoured: `onCombatEnd` clears the
   * fight's own, and **nothing anywhere read the other two.** So a feature printed *recharges: a
   * long rest* was drained for the rest of the campaign, and the comment on Ward Magic's
   * counterspell promised *back on a rest* about a field no routine looked at. Three places said
   * a rest restores things and the routine that rests did not.
   *
   * **A spell's recharge is a rule rather than a printed field.**  **[RULED 2026-11-24]** Casting
   * a prepared spell consumes the preparation (`payToCast`) and a **long rest** is what puts it
   * back, for every spell: no spell in the content prints a boundary, so reading one would have
   * made the new rule apply to none of them. A feature still obeys what it prints.
   */
  const woken = [];
  for (const slate of actor.items ?? []) {
    if (!slate.system?.drained) continue;
    const boundary = slate.system.active?.boundary ?? "";
    const back = slate.type === "spell"
      ? long
      : boundary === "shortRest" || (boundary === "longRest" && long);
    if (!back) continue;
    await slate.update({ "system.drained": false, "system.drainedFor": null });
    woken.push(slate.name);
  }
  /*
   * **It says what it did, every time.**  **[FIXED 2026-11-24]**
   *
   * Reported as *the button should work*, and the button did work: a short rest moved health,
   * stamina and a token, and if the character was unhurt with nothing Spent it moved none of
   * them visibly and posted nothing. A control that cannot be told from a broken one is a broken
   * control.
   *
   * So the line is unconditional and lists only what actually happened -- and when nothing did,
   * it says that too, because *there was nothing to put right* is the answer the player wanted
   * and could not get.
   */
  const did = [];
  if (healed) did.push(`heals <strong>${healed}</strong>`);
  if (returned) did.push(`takes back <strong>${returned}</strong> Spent card`
    + `${returned === 1 ? "" : "s"}`);
  if (relearned) did.push(`shuffles <strong>${relearned}</strong> skill card`
    + `${relearned === 1 ? "" : "s"} back into the skill deck`);
  if (wound) did.push("sheds a <strong>Wound</strong>");
  if (woken.length) did.push(`has <em>${woken.join("</em>, <em>")}</em> ready again`);

  const left = actor.system.rest?.tokens ?? 0;
  const tokens = long
    ? `Rest tokens back to <strong>${left}</strong>.`
    : `<strong>${left}</strong> rest token${left === 1 ? "" : "s"} left.`;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> takes `
      + `${long ? "a long rest" : "a short rest"}`
      + (did.length ? ` and ${did.join(", ")}.` : " and there was nothing to put right.")
      + `</p><p class="cr-note">${tokens}</p></div>`
  });

  return { heal: healed, long, woken, returned, relearned, wound };
}
