/**
 * Where a card is and how it gets somewhere else: finding a stack, what is drawable in
 * it, moving between them, and the reserve a card can be held under.
 *
 * Part of the deck layer: see decks.mjs, which is the one door onto all of it.
 */

import { isDeadCard } from "./intruders.mjs";

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
  const moved = (await from.pass(to, ids, { chatNotification: false })) ?? [];
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