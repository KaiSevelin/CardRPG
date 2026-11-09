/**
 * What a card and a stack are LOOKING at: the face, the back, and the one resolver that
 * derives a path when the content does not spell one.
 *
 * Part of the deck layer: see decks.mjs, which is the one door onto all of it.
 */

import { DECK_BACKS } from "../content.mjs";
import { artPathOf, backPath } from "../art.mjs";

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