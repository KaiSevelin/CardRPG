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
import { artPathOf, backPath } from "./art.mjs";

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
 *
 * **`def.art` still wins, and it is still the documented way to overrule this.** What changed is
 * the fallback: for 588 pieces nobody ever wrote the string, so the field was empty everywhere and
 * `artIn` answered nothing for everything. The path is derivable -- the group's directory and the
 * slug of the name -- so `art.mjs` derives it from the one list that commissioned the picture, and
 * a definition only carries `art:` when it wants a file the rule would not have named.
 */
export function artIn(def) {
  const art = def?.art || artPathOf(def);
  return art && !art.startsWith("icons/svg/") ? art : "";
}

/**
 * The back of a deck, by its key in `DECK_BACKS`, or nothing.
 *
 * A back goes in two slots and wants the same file in both: `Cards.img`, which is what Foundry
 * shows for the stack, and `Card.back.img`, which is what a face-down card shows. One answer here
 * rather than two spellings of the same path -- and the same `icons/svg/` guard a face gets, since
 * Foundry fills these slots with its own placeholder too.
 *
 * A declared back with no `art:` of its own takes the derived path, the same way a card does --
 * all ten were declared with `art: ""` and the four newest were drawn months after the field was
 * added. An UNDECLARED key still answers nothing: `backPath` would happily name a file for a deck
 * that does not exist, and a back is the one picture two decks must never share.
 */
export function backOf(key) {
  const art = DECK_BACKS[key] ? DECK_BACKS[key].art || backPath(key) : "";
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
 * `spells` is here too, and it is a deck rather than a corner of the item pile: `#leftDecks()`
 * filters items to `i.type === "item"`, and the spell pile is built only for an actor that has
 * spells, so a non-caster never sees a fourth deck to wonder about.
 */
export function pileBack(id) {
  if (id === "items") return backOf("item");
  if (id === "features") return backOf("feature");
  if (id === "conditions") return backOf("condition");
  if (id === "spells") return backOf("spell");
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
 * **Its own back, and the comment here used to say the opposite.** It read *"it shares the skill
 * back... the GM's deck having its own art would be a piece of art for a deck only one person
 * ever sees"*, three lines above a comment saying *"its own back, not the skill deck's"* -- one
 * decision changed and one half of the prose edited, which is this project's signature defect
 * landing in a doc comment. The code was right: `backs/twist.webp` is drawn, with a brief of its
 * own, and the GM's deck is face down opposite a player's skill deck all game. Two decks wearing
 * one picture is the one thing a back must not do.
 *
 * `back` is a parameter because there are **two** twist decks now. A ritual twist is the same
 * card -- a name and a prose cost -- drawn from a different deck, and which deck it came from is
 * the whole difference. That is the intruder table's lesson in another place: the deck is the
 * dial, so it is an argument rather than a second function.
 */
export function twistCardData(def, back = "twist") {
  return {
    name: def.name,
    type: "twist",
    img: backOf(back) || undefined,
    system: {
      cost: def.cost ?? "",
      pressure: def.pressure ?? 0,
      gives: !!def.gives
    }
  };
}

/*
 * **The two keys written out**, which is what makes the audit on them work: the suite greps this
 * module for calls with a literal key, and a back reached only through a variable would read as
 * declared-and-never-used -- a true statement about the greps and a false one about the game.
 *
 * The sentence above deliberately does not quote the call it is about. It did, and the grep read
 * the comment: a back named `key` appeared in the audit's own output, invented by the prose
 * explaining the audit. The suite warns about this exact shape twice -- *a grep answered by the
 * prose about itself is a grep about nothing* -- and it is easier to walk into than it looks.
 */
export const TWIST_BACKS = [backOf("twist"), backOf("ritual")];

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
 * Rage: Strike the nearest creature, whatever it is.
 *
 * **The target is a rule, not a choice.** Nearest by Chebyshev, and the lowest Health of any tied --
 * so a player cannot aim their own affliction at the enemy and a GM cannot aim it at the cleric.
 * That is the whole of what makes this a card rather than a table argument, and the tie-break
 * matters more than it looks: ties are common on a square grid, and "nearest" alone would have left
 * the choice sitting there unmade.
 *
 * It goes through `resolveAttack`, so it is a real Strike: fate is drawn, armour applies, and the
 * target may react to it exactly as to any other hit. An ally can Block their friend's swing, which
 * is both correct and the reason this is survivable.
 *
 * The import is dynamic because resolve.mjs imports this module -- the same shape combat.mjs
 * already uses to reach `afterCombat`. Nothing is loaded twice; by the time a card is drawn the
 * resolver has been in memory since init.
 */
export async function applyRage(actor, card) {
  const say = text => ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> draws <em>${card.name}</em>: `
      + `${text}</p></div>`
  });

  const token = actor?.getActiveTokens?.()[0];
  const cell = canvas?.grid?.size;
  if (!token || !canvas?.ready || !cell) {
    await say("Strike the nearest creature, ally or enemy. <em>No token placed &mdash; the GM "
      + "resolves it.</em>");
    return;
  }

  const others = canvas.tokens.placeables.filter(t => t.id !== token.id && t.actor);
  if (!others.length) {
    await say("nothing within reach of it. The card is spent and the swing goes nowhere.");
    return;
  }

  const cheb = t => Math.max(Math.abs(t.x - token.x), Math.abs(t.y - token.y)) / cell;
  const health = t => t.actor?.system?.health?.value ?? Infinity;
  const victim = others.reduce((a, b) => {
    const d = cheb(b) - cheb(a);
    if (d < 0) return b;
    if (d > 0) return a;
    return health(b) < health(a) ? b : a;     // the rule's tie-break, not a preference
  });

  const weapon = actor.items?.find(i => (i.system?.verbs?.strike?.value ?? null) !== null);
  if (!weapon) {
    await say(`nothing equipped to swing at <strong>${victim.document.name}</strong>. The card is `
      + `spent.`);
    return;
  }

  const { resolveAttack } = await import("./resolve.mjs");
  await say(`a Strike at <strong>${victim.document.name}</strong> &mdash; the nearest creature, `
    + `ally or enemy.`);
  await resolveAttack(actor, { verb: "strike", item: weapon, targets: [victim.actor] });
}

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
      await ON_DRAW[effect]?.(actor, card);
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
const ON_DRAW = { taint: applyTaint, fear: applyFear, rage: applyRage };

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
