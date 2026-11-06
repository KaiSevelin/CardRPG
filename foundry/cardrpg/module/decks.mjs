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
/* The deck backs, which are content: one picture per deck rather than one per card. */
import { DECK_BACKS } from "./content.mjs";

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
 * The art on a card or a slate, or nothing.
 *
 * **No new field was needed.** Foundry gives every Item an `img` and every Card face an `img`, and
 * neither was used by anything in this system -- so art is a path in content rather than a schema
 * change, and the two built-in slots are exactly the two places art belongs.
 *
 * Foundry also FILLS those slots with a default when a document is created, so the test is not
 * "is there a path" but "is it ours": anything under `icons/svg/` is core's placeholder set, and a
 * generic bag icon stretched full-bleed across a card would be worse than no art at all.
 */
export function artOf(doc) {
  const path = doc?.faces?.[0]?.img || doc?.img || "";
  if (!path || path.startsWith("icons/svg/")) return "";
  return path;
}

/**
 * The art a CONTENT definition carries, or nothing -- the writing side of `artOf`.
 *
 * `artOf` answers "what picture is on this document"; this answers "what picture should go on the
 * document we are about to make", and both need the same `icons/svg/` guard for the same reason.
 * One spelling, because the three builders below and the two in the setup routine all need it and
 * five copies of a guard is four chances to forget it.
 *
 * It exists because the brief's central promise -- *add `art:` to the definition and no schema
 * change is needed* -- was only true of cards. An Item's `art` fell into `slateData`'s `...rest`
 * and settled in `system.art`, where nothing reads it, which was a hundred and seventy of the four
 * hundred and twenty pieces commissioned.
 */
export function artIn(def) {
  const art = def?.art ?? "";
  return art && !art.startsWith("icons/svg/") ? art : "";
}

/**
 * The back of a deck, by its key in `DECK_BACKS`, or nothing.
 *
 * A back goes in two slots and wants the same file in both: `Cards.img`, which is what Foundry
 * shows for the stack, and `Card.back.img`, which is what a face-down card shows. One answer here
 * rather than two spellings of the same path -- and the same `icons/svg/` guard a face gets, since
 * Foundry fills these slots with its own placeholder too.
 */
export function backOf(key) {
  const art = DECK_BACKS[key]?.art ?? "";
  return art && !art.startsWith("icons/svg/") ? art : "";
}

/**
 * The back a collapsed slate pile wears, by the pile's id in the tray.
 *
 * **The three piles down the left of the tray are face-down decks whenever they are shut**, which
 * is what `openPile` has always meant, and a shut deck showing a hatched gradient is a deck with
 * no back rather than a deck that wants none. Items, features and conditions have one now.
 *
 * **Written out rather than derived, and the suite is why.** The pile ids are plural -- they label
 * a stack in the UI -- and `DECK_BACKS` is keyed on the singular, like the document type a slate
 * actually has. Trimming an `s` would have worked and would also have made these three invisible
 * to the check that every declared back is read by something, which greps this file for the key
 * spelled out. That check is the reason a back cannot be declared and quietly never drawn, so it
 * is worth three lines of repetition to stay inside it.
 *
 * `spells` is a pile too and deliberately gets nothing: it has no entry in `DECK_BACKS`, and the
 * same check would fail the moment one was added without a picture behind it.
 */
export function pileBack(id) {
  if (id === "items") return backOf("item");
  if (id === "features") return backOf("feature");
  if (id === "conditions") return backOf("condition");
  return "";
}

/** A Card document from a content definition. One shape in one place: the starter decks and the
 * levelling graph both create action cards, and two spellings of the same thing would drift.
 *
 * A Card with no face is face-down, and Foundry then shows "Unknown (<deck>)" instead of its name.
 * Everything here is meant to be readable in hand, so it gets a face.
 */
/**
 * One skill card, in the one shape the setup routine and anything that grants one both use -- the
 * same arrangement `actionCardData` is in, and for the same reason: two places building a card
 * document is two places to get it wrong.
 */
export function skillCardData(def) {
  const back = backOf("skill");
  return {
    name: def.name,
    type: "skill",
    face: 0,
    faces: [{ name: def.name, ...(artIn(def) ? { img: artIn(def) } : {}) }],
    ...(back ? { back: { img: back } } : {}),
    system: {
      approach: def.approach ?? "",
      value: def.value ?? 1,
      wild: !!def.wild,
      ...(def.edge !== undefined ? { edge: def.edge } : {})
    }
  };
}

/**
 * One twist, as a Card. The name is the kind and the face is the cost, which is all a twist is.
 *
 * It shares the skill back, because a twist is drawn in a scene and not in a fight -- and because
 * the GM's deck having its own art would be a piece of art for a deck only one person ever sees.
 */
export function twistCardData(def) {
  return {
    name: def.name,
    type: "twist",
    /* Its own back, not the skill deck's: the GM's deck is face down opposite a player's
     * skill deck all game, and two decks wearing one picture is the one thing a back must not do. */
    img: backOf("twist") || undefined,
    system: {
      cost: def.cost ?? "",
      pressure: def.pressure ?? 0,
      gives: !!def.gives
    }
  };
}

export function actionCardData(def) {
  return {
    name: def.name,
    type: "action",
    face: 0,
    /* The face carries the art, which is where Foundry already keeps a card's picture. */
    faces: [{ name: def.name, ...(artIn(def) ? { img: artIn(def) } : {}) }],
    /*
     * And the back says which deck it came from. A Wound and a Taint wear this one too, on
     * purpose: both go INTO the action deck (core-rules 8), and a Wound you could see coming
     * would not be a Wound.
     */
    ...(backOf("action") ? { back: { img: backOf("action") } } : {}),
    system: {
      primary: def.primary ?? [],
      secondary: def.secondary ?? [],
      reaction: def.reaction ?? "",
      ...(def.reactionParam !== undefined ? { reactionParam: def.reactionParam } : {}),
      costs: def.costs ?? {},
      ...(def.text !== undefined ? { text: def.text } : {})
    }
  };
}

/**
 * One NPC intent card, in the shape both builders use.
 *
 * The setup routine builds the goblin line and `buildMonster` builds everything else on demand,
 * and they were spelling this out separately -- so the face's art had to be added twice or it
 * would be added once, which is the failure mode the suite's own self-check section is about.
 *
 * The back is the creature, because that is all a face-down intent shows: its own if the kind has
 * earned one, the common intent back otherwise.
 */
export function npcCardData(card, { kind, creature, back }) {
  return {
    name: card.name,
    type: "npc",
    // Turned face down when drawn; the face is what a reveal turns up.
    face: 0,
    faces: [{ name: card.name, ...(artIn(card) ? { img: artIn(card) } : {}) }],
    back: { name: creature, ...(back ? { img: back } : {}) },
    system: {
      kind, sequence: card.sequence, needs: card.needs ?? [],
      only: card.only ?? [], text: card.text ?? ""
    }
  };
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
 * A Wound "can't be played, not even for Brace" (core-rules 8) and Taint resolves the moment it is
 * drawn, so neither is a card you can spend on a reaction -- which is the one exception to "no card
 * in your hand is dead", and the reason it is tested here rather than in the resolver.
 */
export function uprightCards(actor) {
  // Asked of every neighbour of every lethal hit, and an NPC holds no hand at all (core-rules 9),
  // so the absence is tested rather than reported: deckOf warns, and this is not a misconfiguration.
  if (!actor?.system?.decks?.actionHand) return [];
  const hand = deckOf(actor, "actionHand");
  return (hand?.cards.contents ?? []).filter(c =>
    c.type !== "wound" && c.type !== "taint" && !isReserved(c));
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
export async function addFateCards(actor, { special, count = 1, temporary = false } = {}) {
  const rule = CARDRPG.fateSpecials[special];
  const deck = deckOf(actor, "fate");
  if (!rule || !deck || count < 1) return 0;

  const label = game.i18n.localize(rule.label);
  await deck.createEmbeddedDocuments("Card", Array.from({ length: count }, () => ({
    name: temporary ? `${label} (temporary)` : label,
    type: "fate",
    system: { special, temporary }
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
  if (!deck || !hand) return { drawn: 0 };

  const size = CARDRPG.defaults.skillHandSize;
  const want = Math.max(0, size - hand.cards.size);
  if (!want) return { drawn: 0 };
  const moved = await moveRandom(deck, hand, want);
  return { drawn: moved.length };
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
