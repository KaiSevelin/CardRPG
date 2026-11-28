/**
 * Where a card is and how it gets somewhere else: finding a stack, what is drawable in
 * it, moving between them, and the reserve a card can be held under.
 *
 * Part of the deck layer: see decks.mjs, which is the one door onto all of it.
 */

import { isDeadCard, isIntruder, intruderLine } from "./intruders.mjs";

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
 * The critical deck and its discard, which belong to the world rather than to anybody.
 *
 * One deck for the table, because both sides crit: a goblin that rolls one draws from the same
 * ten cards a player does. Two decks would be two tunings of one rule.
 */
export function critStacks() {
  const find = tag => game.cards?.find(c => c.getFlag("cardrpg", "cardrpgContent") === tag) ?? null;
  return { deck: find("crit-deck"), discard: find("crit-discard") };
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
 * **The top of a stack, in the order it will come off.**  [BUILT 2026-11-22]
 *
 * `available` says WHICH cards are really there and says nothing about order; this says which are
 * on top. Foundry orders a stack by `sort` and its own `TOP` draw mode means the lowest -- so the
 * top is the front of that order, and a shuffle is Foundry assigning new `sort` values.
 *
 * Nothing needed this while every draw was random. **Read N** (core-rules 6) is *look at the top N
 * cards of one fate deck and put them back in any order*, which is a sentence about an order, and
 * `readDeck` sat in the schema for a fortnight naming whose deck a Read looks at while fate was
 * drawn with `moveRandom` -- so there was no top to look at and no order to arrange.
 */
export function topOf(stack, n = 1) {
  return available(stack)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .slice(0, Math.max(0, n));
}

/**
 * Draw `n` off the top. Returns the cards **in the order they were on the deck**.
 *
 * The order of the return is not a nicety: a plain fate draw uses `drawn[0]` and an advantage draw
 * compares two, so a draw that handed back its two cards the other way round would quietly use the
 * second card as the first. `Cards#pass` makes no promise about the order of what it returns, so
 * the ids are put back in the order they were asked for rather than trusted.
 *
 * **Distributionally this is the same as `moveRandom` on a shuffled deck**, which is what makes it
 * safe to swap underneath every fate draw in the game: `reshuffleFate` has always shuffled, and a
 * new deck is shuffled when it is built. What changes is that the deck now HAS an order, so an
 * order a player arranged is the order the cards come off in.
 */
export async function moveTop(from, to, n = 1) {
  if (!from || !to || n <= 0) return [];
  const want = topOf(from, n).map(c => c.id);
  if (!want.length) return [];
  const moved = await move(from, to, want);
  const byId = new Map(moved.map(c => [c.id, c]));
  return want.map(id => byId.get(id)).filter(c => c);
}

/**
 * **Put these cards back in this order**, keeping them where they are in the stack.
 *
 * The `sort` values they already hold are collected and dealt back out in the new order, so the
 * block of cards stays exactly where it was and only their order within it changes. Writing fresh
 * numbers instead would have to guess at a gap that does not collide with the rest of the deck,
 * and a Read is not allowed to move a card up the deck -- only to arrange the ones it looked at.
 */
export async function reorderTop(stack, ids = []) {
  const cards = ids.map(id => stack?.cards?.get(id)).filter(c => c);
  if (cards.length < 2) return cards;
  const slots = cards.map(c => c.sort ?? 0).sort((a, b) => a - b);
  await stack.updateEmbeddedDocuments("Card",
    cards.map((card, k) => ({ _id: card.id, sort: slots[k] })));
  return cards;
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

/**
 * Move specific cards, clearing `drawn` when they land back in a deck -- and clearing `reserved`
 * wherever they land.
 *
 * Reserved has to die here, at the one chokepoint every card passes through, and not at any of the
 * places that move cards. A reserved card that came back from the discard still turned sideways
 * would quietly erode a player's defence with nobody told: they would react with four cards one
 * fight and three the next and never learn why. Every card enters a hand upright.
 */
export async function move(from, to, ids) {
  if (!from || !to || !ids?.length) return [];
  /*
   * **A card that has already gone is not moved, and does not take the routine down with it.**
   * **[FIXED 2026-11-24]**
   *
   * `Cards#pass` throws on an id that is not in the source, and it throws for the WHOLE call -- so
   * one stale id loses every other card in the same move. That is the wrong failure mode for the
   * one door every card movement goes through, because the ids reaching it are often read a tick
   * or two earlier and this game has several routines that sweep piles without being awaited:
   * `deleteCombat` runs `afterCombat` that way by design.
   *
   * Twice measured today. A probe that ended a fight and refilled in the same breath threw
   * *Card "..." does not exist*, taking a hand of five with it; and a rest returning the skill
   * discard threw *you may not pass...* about one run in three, which lost the whole return.
   *
   * **Said out loud rather than swallowed.** A stale id means something moved a card while this
   * call was being assembled, and that is worth knowing even though it is survivable -- so the
   * ones that are gone are named and the rest still move.
   */
  /*
   * **And "there" is `available`, not `cards.has`.**  **[FIXED 2026-11-28]**
   *
   * The filter below used to ask whether the id was in `from.cards`, which is the wrong question
   * by this file's own definition: *a card sitting in its home deck flagged `drawn` is not in the
   * deck in any meaningful sense -- it is out on loan*, which is the sentence `available` was
   * written for and which `topOf` and `moveRandom` both already use.
   *
   * Foundry's rule is exactly that one. `Cards#pass` throws **You may not pass Card X which has
   * already been drawn** when `(this.type === "deck") && card.isHome && card.drawn`, and it throws
   * for the whole call -- so one card out on loan lost every other card in the same move.
   *
   * **Measured rather than reasoned about**: this threw in three of six full live runs on
   * 2026-11-27 and 2026-11-28, always in *a rest brings back everything a rest brings back*, and
   * each time it took the rest of that probe's rows with it. It is the sibling of the fix recorded
   * above -- that one caught the id that was not in the stack at all, and this is the id that is
   * in it and is not really there.
   */
  const here = new Set(available(from).map(c => c.id));
  const present = ids.filter(id => here.has(id));
  if (present.length !== ids.length) {
    const gone = ids.filter(id => !here.has(id));
    console.warn(`cardrpg | ${gone.length} card(s) were not in ${from.name} to move: `
      + `${gone.join(", ")}. The rest were moved.`);
  }
  if (!present.length) return [];
  const moved = (await from.pass(to, present, { chatNotification: false })) ?? [];
  if (moved.length) {
    const home = to.type === "deck";
    const fixes = moved
      .filter(c => home || c.getFlag("cardrpg", RESERVED))
      .map(c => ({ _id: c.id, ...(home ? { drawn: false } : {}), [`flags.cardrpg.-=${RESERVED}`]: null }));
    if (fixes.length) await to.updateEmbeddedDocuments("Card", fixes);
  }
  return moved;
}

/* -------------------------------------------- */
/*  Reserved: the only decision a reaction takes */
/* -------------------------------------------- */

/**
 * The flag behind a card turned sideways.
 *
 * Reactions resolve automatically (core-rules 3), so this is where the player's judgment lives
 * instead: a card turned sideways is **reserved** and will not react. It still counts toward hand
 * size, both its halves still play, and turning it costs nothing -- it is a declaration, not an
 * action. That is what lets the engine's policy be greedy rather than clever: it never has to guess
 * whether you would rather have kept a card, because you have already said.
 *
 * A flag on the Card document rather than a field on the card's data model, because the model is
 * the card's PRINTED content -- shared by every copy in the deck -- and reserved is one copy at one
 * moment. The player owns their own hand, so this is the one part of a reaction that needs nobody's
 * permission but theirs.
 */
export const RESERVED = "reserved";

/** Is this card turned sideways? */
export function isReserved(card) {
  return !!card?.getFlag?.("cardrpg", RESERVED);
}

/** Turn a card sideways, or back upright. Free, and legal at any time. */
export async function reserveCard(card, on = null) {
  if (!card) return false;
  const next = on === null ? !isReserved(card) : !!on;
  if (next) await card.setFlag("cardrpg", RESERVED, true);
  else await card.unsetFlag("cardrpg", RESERVED);
  return next;
}
/**
 * **Turn a whole hand sideways, or bring it all back upright.**  **[BUILT 2026-11-12]**
 *
 * One gate for both callers -- the tray's button and the automatic disarm when a turn's actions are
 * done -- and it takes the **state to end in** rather than toggling card by card. That is not
 * tidiness: the button did toggle, with `if (isReserved(card) !== down) continue`, which skips
 * exactly the cards that need changing and changes the ones that do not. *Hold all* turned the held
 * cards upright and left the upright ones alone, every time it was pressed. A target state cannot
 * be inverted by getting a comparison the wrong way round.
 *
 * **Dead cards are turned with the rest.** A Wound cannot react in the first place, so sideways
 * means nothing to it; but leaving it upright would make a hand that reads as not-all-held while
 * nothing in it can be held any further, which is a button that lies about what it will do.
 *
 * @returns {Promise<number>} how many cards actually moved, so a caller can stay quiet about none.
 */
export async function reserveHand(actor, on = true) {
  const hand = deckOf(actor, "actionHand");
  let changed = 0;
  for (const card of hand?.cards.contents ?? []) {
    if (isReserved(card) === !!on) continue;
    await reserveCard(card, on);
    changed++;
  }
  return changed;
}

/**
 * The cards in a hand that may react: upright, and not a dead card.
 *
 * An intruder is never one: a Wound "can't be played, not even for Brace" (core-rules 8) and Taint
 * resolves the moment it is drawn, so neither is a card you can spend on a reaction -- the one
 * exception to "no card in your hand is dead", and the reason it is tested here rather than in the
 * resolver. It asks `isDeadCard` rather than naming the types, so a new kind of intruder is one
 * row in the table above and not an edit here.
 */
export function uprightCards(actor) {
  // Asked of every neighbour of every lethal hit, and an NPC holds no hand at all (core-rules 9),
  // so the absence is tested rather than reported: deckOf warns, and this is not a misconfiguration.
  if (!actor?.system?.decks?.actionHand) return [];
  const hand = deckOf(actor, "actionHand");
  return (hand?.cards.contents ?? []).filter(c => !isDeadCard(c) && !isReserved(c));
}

/** A card's readable name, never Foundry's "Unknown (<deck>)" placeholder for a faceless card. */
export function cardName(card) {
  return card?.faces?.[0]?.name || card?._source?.name || card?.name || "?";
}

/**
 * **A card in one line, for a list rather than a hand.**  [BUILT 2026-11-14]
 *
 * The HUD paints a card: a picture, two halves with their resolved values, a reaction row and a
 * tooltip apiece. A **list** of cards wants none of that -- it wants to be scannable, and twenty
 * painted cards in a column is a hand you cannot read.
 *
 * So this is the other register: what the card does, in printed values, with nothing resolved
 * against the character holding it. It is the register a deck list wants and the one a discard
 * pile wanted all along -- the tray had a private copy of exactly this, and the character sheet
 * was about to need a second one the day it learned to show a deck.
 *
 * Printed and not resolved, deliberately. A deck list is about what you own, and *Strike 4 with
 * the sword you happen to be holding* is a fact about this moment rather than about the card.
 */
export function cardLine(card) {
  if (!card) return "";
  if (card.type === "fate") {
    return card.system.special === "miss" ? "Miss — the action does nothing, then reshuffle"
      : card.system.special === "crit" ? "Critical — double the value, then reshuffle"
        : `${card.system.value > 0 ? "+" : ""}${card.system.value}`;
  }
  // One line per intruder, read from the table that defines them rather than retyped here.
  if (isIntruder(card)) return intruderLine(card);
  if (card.type === "skill") {
    const worth = card.system.wild ? "any" : (card.system.approach ?? "");
    return `${worth} ${card.system.value ?? 0}`
      + (card.system.edge ? ` · edge: ${card.system.edge}` : "");
  }
  const steps = list => (list ?? [])
    .map(s => `${s.verb ?? ""}${s.param ? ` ${s.param}` : ""}`
      + `${s.mod ? ` ${s.mod > 0 ? "+" : ""}${s.mod}` : ""}`)
    .join(", ");
  /* An intent card is a sequence rather than two halves, so it has one side and says so. */
  if (card.type === "npc") return steps(card.system.sequence);
  return `${steps(card.system.primary)} / ${steps(card.system.secondary)}`;
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
/**
 * **Sift: take n cards out of the draw pile to be looked at.**  [BUILT 2026-11-16]
 *
 * core-rules 8 says *the top card of your draw pile*, and **this deck has no top.** Every draw
 * here picks random ids, because *drawing n random cards without replacement is distributionally
 * identical to drawing from a shuffled deck, and it keeps the randomness somewhere we control* --
 * so there is no next card to peek at, only cards to judge. What Sift honestly is in this engine
 * is **n out of the pile, seen, and binned if you like**, which buys what the rule says it buys:
 * a worse next hand traded for a better one after that.
 *
 * Without replacement, the same way a draw is, so one card cannot be shown twice in one Sift.
 *
 * Nothing is moved here. Seeing is not taking, and the decision about what goes belongs to the
 * player -- which is also what makes this half testable without a dialog in front of it.
 */
export function cardsToSift(actor, n = 1) {
  const pile = deckOf(actor, "action");
  const pool = available(pile);
  if (!pool.length) return [];
  const rest = [...pool];
  const seen = [];
  for (let i = 0; i < Math.min(Math.max(1, n), pool.length); i++) {
    seen.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
  }
  return seen;
}

/**
 * **And bin the ones they rejected**, which costs the fight nothing: the discard is what the next
 * cycle brings back. The ids come from the player, so they are checked against the pile rather
 * than trusted -- a card already drawn is not in the draw pile in any meaningful sense, and
 * `available` is the function that knows it.
 */
export async function binSifted(actor, ids = []) {
  const pile = deckOf(actor, "action");
  const bin = deckOf(actor, "actionDiscard");
  if (!pile || !bin || !ids.length) return [];
  const live = new Set(available(pile).map(c => c.id));
  const real = ids.filter(id => live.has(id));
  if (!real.length) return [];
  return move(pile, bin, real);
}
