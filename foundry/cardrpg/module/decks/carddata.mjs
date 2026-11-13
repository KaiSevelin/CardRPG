/**
 * The shape each kind of card is created with. One builder per deck, because what a
 * skill card needs and what an intent card needs stopped being the same thing early.
 *
 * Part of the deck layer: see decks.mjs, which is the one door onto all of it.
 */

import { artIn, backOf } from "./art.mjs";

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

/**
 * **One intruder, as a Card** -- and one builder where there were five hand-written literals.
 *
 * `resolveWound`, `resolveTaint`, `resolveFear`, `resolveDoubt` and `dealIntruder` each wrote
 * their own `{ name, type, system }` out by hand, which was fine while a card was three fields
 * and stopped being fine the moment it had a picture: five places to add an `img`, and the one
 * that was missed would have been a card that quietly wore Foundry's placeholder.
 *
 * The name carries the flavour where a kind has two -- Taint is a disease or a horror depending
 * on which deck it goes in -- because the name is what resolves the art, and the two are
 * genuinely different pictures.
 */
export function harmCardData(kind, { source = "", flavour = "" } = {}) {
  const name = kind === "taint"
    ? (flavour === "mind" ? "Taint (mind)" : "Taint (body)")
    : kind[0].toUpperCase() + kind.slice(1);
  const art = artIn({ name });
  return {
    name,
    type: kind,
    ...(art ? { faces: [{ name, img: art }], face: 0 } : {}),
    system: { source, ...(kind === "taint" ? { flavour } : {}) }
  };
}

/** One face of the critical deck, as a Card. Face up from the moment it is drawn. */
export function critCardData(def) {
  return {
    name: def.name,
    type: "crit",
    /*
     * **No back, and that half of the old exemption still holds.** It is turned over the instant
     * a Critical lands and read out, so it is never face down in front of anybody -- the same
     * reason a hand and a discard have none.
     *
     * **A face, which the same sentence was wrongly used to rule out.**  [FIXED 2026-11-13] The
     * brief said this deck *needs neither faces nor a back* and then gave only the argument
     * above, which is about being face down. Applied to the face it says the opposite: this is
     * the one card in the game that is ONLY ever seen face up, read out to the table, at the
     * loudest moment a fight has. Seven faces over twelve cards.
     */
    face: 0,
    faces: [{ name: def.name, ...(artIn(def) ? { img: artIn(def) } : {}) }],
    system: {
      doubles: !!def.doubles,
      draws: def.draws ?? 0,
      text: def.text ?? "",
      ...(def.effect ? { effect: def.effect } : {})
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