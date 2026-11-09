

/*
 * **One door, twelve rooms.** This file was 8,883 lines and 48 exports, which is a neighbourhood
 * rather than a module: every table in the game, edited daily, in one place where a careless save
 * could take all of it. The tables are unchanged and still arrive from here, so nothing that reads
 * content had to learn where anything moved -- the split is in the writing, not in the reading.
 *
 * They are grouped the way the game is: the four Ways are four files because a Way is a thing in
 * the rules, not a section heading. The only couplings that survived the split are the three that
 * are real -- the roster is built from the goblin and the monsters, the archer from the goblin and
 * a variant, a forgery from the thing it forges -- and each of those pairs stayed in one file.
 */
export * from "./content/cards.mjs";
export * from "./content/way-shade.mjs";
export * from "./content/way-strength.mjs";
export * from "./content/way-mind.mjs";
export * from "./content/way-faith.mjs";
export * from "./content/gear.mjs";
export * from "./content/bestiary.mjs";
export * from "./content/intents.mjs";
export * from "./content/magic.mjs";
export * from "./content/harm.mjs";
export * from "./content/characters.mjs";
export * from "./content/nodes.mjs";
