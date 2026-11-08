/**
 * Where every picture in the game is, derived from the same list that commissioned it.
 *
 * **The brief promised this field and nothing ever filled it.** *Add `art:` to the definition and
 * no schema change is needed* was true -- `artIn` reads it, `slateData` puts it on an Item's `img`,
 * the pack builder puts it on an Actor's `img` and its token's `texture.src` -- and for 588 pieces
 * the string was never written. Ten deck backs carried `art: ""`. The pictures sat in `art/`,
 * correctly named, read by nothing.
 *
 * They are not typed out here either, because the rule was already written down twice: **a path is
 * the group's directory plus the slug of the name**, and the group a piece belongs to is the list
 * that commissioned it. So this file holds that pairing once, derives the path from it, and
 * `test/art-list.mjs` reads the same table to write the brief. One table, three readers -- the
 * brief, the prompt book and the game -- which is the arrangement the brief's own header demands:
 * *two generated files reading one GROUPS cannot disagree*.
 *
 * **It lives in `module/` and not in `test/` because the game is now one of the readers.** The
 * pairing used to sit in the brief generator, which module code cannot import; `slug` and
 * `DELIVERY` moved here with it, and the brief re-exports them so the one slug rule still governs
 * every filename.
 */

import * as content from "./content.mjs";
import { expandRoster } from "./monsters.mjs";

/**
 * The one delivery format. Both tables in the brief print it, the shoot writes it and every path
 * below ends in it, so it is one constant rather than four spellings of `webp`.
 */
export const DELIVERY = { format: "webp", quality: 80 };

/**
 * **Absolute from Foundry's data root, because a relative path here is a bug with a record.**
 * `cardrpg.mjs` carries the scar: a relative icon path resolved against the stylesheet and became
 * `systems/cardrpg/styles/systems/cardrpg/icons/...`. Every other path in this system is spelled
 * `systems/cardrpg/...` and so is this one.
 */
const ROOT = "systems/cardrpg/art";

/**
 * A filename from a card's name: lowercase, hyphenated, nothing else.
 *
 * An apostrophe is DROPPED rather than hyphenated, or *Accuser's Ring* files itself as
 * `accuser-s-ring` -- which is the sort of thing nobody notices until a hundred and fifty files
 * are named that way.
 */
export function slug(name) {
  return String(name).toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The file a deck back wears, from its key in `DECK_BACKS`. */
export function backPath(key) {
  return `${ROOT}/backs/${slug(String(key).replace(/\./g, "-"))}.${DELIVERY.format}`;
}

/**
 * **Every shelf of art in the game: a directory, and the content that goes in it.**
 *
 * `key` names the shelf and `dir` is where its files live, and they differ in exactly one place --
 * the two token shelves share `tokens/`, because the starter Warrior's token is the same kind of
 * picture as a creature's and belongs beside them.
 *
 * The order is the brief's order, which is **what unblocks play** rather than size: the starter
 * deck is what a first session touches and the hundred and seventy-six items are what it does not.
 */
export const SHELVES = [
  { key: "cards/starter", list: content.WARRIOR_DECK },
  { key: "cards/common", list: content.COMMON_POOL },
  { key: "cards/npc", list: content.INTENTS },
  { key: "cards/shade", list: content.SHADE_POOL },
  { key: "cards/strength", list: content.STRENGTH_POOL },
  { key: "cards/way", list: content.WAY_CARDS },
  { key: "cards/skill", list: content.WARRIOR_SKILLS },
  { key: "cards/wild", list: content.WILD_MAGIC },
  /*
   * **The ritual twist deck has faces, and the general twist deck does not.**
   *
   * That asymmetry is a decision rather than an oversight, and the art list states the other half
   * of it: a twist is *"a NAME and a COST rather than a picture... the GM's own deck, and art for
   * a deck one person ever sees is art nobody at the table looks at."* Every word of that is still
   * true of `TWISTS`.
   *
   * It is not true here. A ritual is a **downtime challenge the whole party runs**, over days, on
   * one of their own characters -- so a ritual twist is turned face up in front of four people who
   * have been working toward this for a session, and what it shows them is the thing they are
   * trying to undo pushing back. That is the one GM deck with an audience.
   */
  { key: "cards/ritual", list: content.RITUAL_TWISTS },
  /*
   * The intruders. They are the only cards in the game a player does not want, which makes them
   * the ones a player looks at hardest -- and they had no pictures because the decision was taken
   * when there were two of them.
   */
  { key: "cards/harm", list: content.HARM_FACES },

  { key: "signatures/shade", list: content.SHADE_SIGNATURES },
  { key: "signatures/strength", list: content.STRENGTH_SIGNATURES },
  { key: "signatures/mind", list: content.MIND_SIGNATURES },
  { key: "signatures/faith", list: content.FAITH_SIGNATURES },

  { key: "spells/elemental", list: content.FORMULAS },
  { key: "spells/shadow", list: content.SHADOW_FORMULAS },
  { key: "spells/mind", list: content.MIND_POOL },
  { key: "spells/faith", list: content.FAITH_POOL },

  { key: "features", list: content.FEATURES },
  /* A counterfeit is not a piece: it wears the picture of the item it forges, resolved below. */
  { key: "items", list: content.ITEMS.filter(i => !i.npc && !content.forges(i.name)) },
  { key: "items/npc", list: content.NPC_GEAR ?? [] },
  { key: "items/natural", list: content.NATURAL_WEAPONS ?? [] },

  { key: "tokens", dir: "tokens", kind: "token",
    list: expandRoster(content.ROSTER, content.VARIANTS) },
  { key: "tokens/warrior", dir: "tokens", kind: "token", list: [content.WARRIOR] }
].map(shelf => ({ ...shelf, dir: shelf.dir ?? shelf.key }));

/** The path a piece's file sits at, from the shelf it is on and its own name. */
const fileOf = (shelf, entry) => `${ROOT}/${shelf.dir}/${slug(entry.name)}.${DELIVERY.format}`;

/**
 * **Two indexes, because two kinds of caller ask.**
 *
 * `BY_ENTRY` is keyed on the content object itself, which is exact: it tells *Hold the Line* the
 * card from *Hold the Line* the intent without being asked which one is meant. Every builder that
 * is handed a definition straight out of content resolves here.
 *
 * `BY_NAME` is for the one caller that cannot: a variant creature is built fresh by `applyVariant`
 * every time it is asked for -- deliberately, since *pairing a variant with its base is the art
 * layer's job* (monsters.mjs) -- so the object a builder holds is never the object this file
 * indexed. A name is all there is to go on, and for a creature a name is enough.
 *
 * **Six names in the book belong to two pieces each**, and they are left out of `BY_NAME` rather
 * than resolved to a guess: *Quick Hands*, *Hold the Line*, *Press*, *Heave*, *The Long Step* and
 * *The Kit*. All six are reached through `BY_ENTRY`, and a wrong picture is worse than none.
 */
const BY_ENTRY = new Map();
const BY_NAME = new Map();
export const AMBIGUOUS = [];

for (const shelf of SHELVES) {
  for (const entry of shelf.list) {
    BY_ENTRY.set(entry, fileOf(shelf, entry));
    if (BY_NAME.has(entry.name)) { AMBIGUOUS.push(entry.name); BY_NAME.delete(entry.name); }
    else if (!AMBIGUOUS.includes(entry.name)) BY_NAME.set(entry.name, fileOf(shelf, entry));
  }
}

/**
 * The picture a content definition wears, or nothing.
 *
 * A counterfeit asks by name and is answered with the honest item's file: *Ring of Open Hands* is
 * built to be impossible to tell from *Ring of the Open Hand*, so it is drawn once and worn twice.
 */
export function artPathOf(def) {
  if (!def) return "";
  const forged = def.name ? content.forges(def.name) : "";
  if (forged) return BY_NAME.get(forged) ?? "";
  return BY_ENTRY.get(def) ?? (def.name ? BY_NAME.get(def.name) ?? "" : "");
}

/** Every path this file can produce, for a suite that wants to count them. */
export function everyArtPath() {
  return [...new Set([...BY_ENTRY.values()])];
}
