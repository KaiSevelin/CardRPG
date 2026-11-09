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

/* The deck backs, which are content: one picture per deck rather than one per card. */
import { artPathOf, backPath } from "./art.mjs";

/*
 * **One door, six rooms.** This file was 1,221 lines and 48 exports -- finding a stack, painting a
 * card, drawing fate, refilling a hand and putting it all back after a fight -- which is a layer
 * rather than a module. Everything still arrives from here, so nothing that reads the deck layer
 * had to learn where anything moved.
 *
 * The rooms are ordered by what they know about: `stacks` knows where cards are, `art` what they
 * look like, `carddata` what shape each kind is made in, `intruders` what the unwanted ones cost,
 * `fate` the deck that answers questions, and `play` what a turn does to all of it. Nothing below
 * imports anything above it.
 */
export * from "./decks/stacks.mjs";
export * from "./decks/art.mjs";
export * from "./decks/carddata.mjs";
export * from "./decks/intruders.mjs";
export * from "./decks/fate.mjs";
export * from "./decks/play.mjs";
