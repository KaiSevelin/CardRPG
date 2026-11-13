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
import { CARDRPG } from "./config.mjs";

/**
 * The one delivery format. Both tables in the brief print it, the shoot writes it and every path
 * below ends in it, so it is one constant rather than four spellings of `webp`.
 */
export const DELIVERY = { format: "webp", quality: 80 };

/**
 * **Briefs an image model refused to draw, and what was asked for instead.**
 *
 * A refusal is a **state**, not a gap. Without this list a blocked piece is indistinguishable from
 * one nobody has got to yet: it sits in the queue looking pending, somebody re-runs it, it is
 * refused again, and the only record is in a chat log. Naming it here costs one line and makes the
 * re-write reviewable.
 *
 * It is keyed on the piece's **name** rather than its path, because the name is what survives a
 * shelf moving, and the value is the reason -- which is the part worth keeping. A reason of "the
 * brief was rewritten" with no new refusal means the entry can go.
 *
 * Kept beside `DELIVERY` because both are facts about *supplying* art rather than about the game,
 * and `art-list.mjs` already reads this file for exactly that.
 *
 * **Empty, which is the resting state**, and the same arrangement the shoot queue settled into: a
 * name belongs here only while its file is genuinely absent, so the validator fails both ways --
 * a missing file with no entry, and an entry whose file has arrived. A list that keeps dead names
 * is a list nobody reads.
 *
 * It held one entry for about an hour. *Where It Is Held* was refused as "Strike a target it
 * already has hold of": the words were never the problem, the composition was -- an immobilised
 * figure under a weapon -- and no rewording of that sentence was going to pass. Rewritten to the
 * hand and the harness ("A hand already on the strap"), it drew first time. The card reads better
 * for it, which is the argument for rewriting a refused brief rather than retrying it, and the
 * reason this constant is worth keeping now that it is empty.
 */
export const ART_REFUSED = {};

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
/**
 * **A condition's name, from its key.** `offBalance` becomes `Off-Balance`; everything else is one
 * word and becomes itself with a capital.
 *
 * Derived rather than written down, because the English name is already written down once -- in
 * `lang/en.json`, against the label key -- and a second copy in the engine is a second fact that
 * can drift. The suite checks this derivation against that file, so a condition whose name stops
 * matching its key fails rather than filing its picture under a name nobody uses.
 */
export const conditionName = key =>
  key.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/^./, c => c.toUpperCase());

/**
 * **What a condition's picture is of.**  [BUILT 2026-11-13]
 *
 * Conditions had a back and no faces, and they were on no shelf -- so the brief reported every
 * piece in the game drawn while twenty-five cards a player reads every fight had nothing on them.
 * That is the silence that hid the Shade starter deck for months: the brief counts what is on a
 * shelf, and a thing on no shelf cannot be counted as missing.
 *
 * **Draw the condition, never the sufferer.** This is `cards/npc`'s problem exactly -- one picture
 * has to serve a goblin, a dragon and the player, so a figure in the frame is the wrong figure for
 * three quarters of the table. Each of these is one object or one gesture, close, with the body
 * kept out or cropped to a limb. It is also the only way twenty-five of them do not come back as
 * twenty-five people pulling faces.
 *
 * The prose lives here beside the shelf rather than in `config.mjs`, for the same reason `MAPS`
 * does: it is art direction and nothing in the rules reads it. What a condition blocks, how long
 * it lasts and who can lift it stay in config, and this adds no second copy of any of it.
 */
export const CONDITION_LOOKS = {
  dazed: "A struck bell still moving, seen side-on, the ring drawn as doubled edges around the rim. No head, no face, no stars.",
  slowed: "Thick mud closing over the print of one boot, the print already losing its shape. The foot has gone; the hole it made is what is left.",
  stunned: "An open hand falling away from a grip it has lost, fingers still curled to the shape of what they held. The thing itself is out of frame below.",
  halted: "An hourglass lying on its side on bare ground, both bulbs half full and nothing moving between them. No sand falling, no hand, no table.",
  invisible: "A doorway with wet footprints coming through it and stopping, the last pair only half printed. Nobody in the frame.",
  heckled: "A thumb turned down at the end of a bare arm thrust in from the frame's edge, drawn large and crude. Whoever it belongs to is not in the picture.",
  burning: "Heavy cloth catching: one corner curling black, the flame eating inward along a line. No figure, no torch, no pyre -- fabric and the edge of the burn.",
  poisoned: "A shallow bowl tipped over on the ground, a dark residue running out of it in one slow line. Nothing drinking, nobody holding it.",
  exposed: "A breastplate strap cut through, the ends hanging apart, the plate swinging away from what it covered. The body only as the shape it is leaving.",
  frozen: "A boot taken into a sheet of grey ice, the ice risen past the ankle and holding it. Cut off at the shin; nothing above.",
  prone: "Ground seen from very low down: a scatter of grit at eye height and the horizon near the top edge. The viewer is the one who is down.",
  unconscious: "An open hand lying palm-up on the ground, fingers slack and apart, the arm running out of frame. Still, and not dead.",
  grappled: "Two hands locked around one forearm from opposite sides, gripping hard enough to mark it. Hands and arm only; no faces and no bodies.",
  silenced: "A mouth closed in the middle of a word -- nothing but lips and jaw, with a single stroke sealing the line of them. No gag, no hand, no cross.",
  disarmed: "A sword hilt-down in the dirt where it fell and still rocking, with the open hand that dropped it at the top edge of the frame.",
  compelled: "One string running from the top of the frame down to a wrist, taut, the hand at the end of it already turning. Nothing above the string.",
  graven: "Fresh ink worked into a forearm, the lines raised and the skin still angry around them. Close enough that it is skin and ink and nothing else.",
  blessed: "A thin shaft of outside light falling across a worn stone floor: one bright edge, and no source anywhere in the frame.",
  cursed: "A hairline crack running the full height of a plain stone, fine at the top and open at the bottom. Nothing else on the stone.",
  burdened: "A pack strap biting into a dropped shoulder, the cloth bunched where it has pulled. No face and no pack -- strap, shoulder, and the dent.",
  overloaded: "A pack that has given way: the bottom seam split, its contents going into the dirt. From behind and below, nothing identifiable in what falls.",
  wet: "Water running off a flat surface in one sheet, the last of it beading along the lower edge. No rain, no vessel, no figure.",
  offBalance: "One foot caught on a raised root, the heel already lifting and the weight gone past where it can be recovered. Below the knee only.",
  marked: "A chalk cross on a plain wooden door, drawn fast and recently, the dust still on the boards beneath it.",
  judged: "A pair of hand-scales hanging still with one pan lower than the other, against bare paper. Nothing in either pan.",
};

/**
 * The shelf: every condition the config declares, in the order it declares them.
 *
 * Built from `CARDRPG.conditions` rather than listed again, so a condition added to the game
 * arrives in the brief the same day and is reported as still to shoot until somebody draws it.
 */
export const CONDITION_PIECES = Object.keys(CARDRPG.conditions).map(key => ({
  key,
  name: conditionName(key),
  blurb: CONDITION_LOOKS[key] ?? ""
}));

export const SHELVES = [
  { key: "cards/starter", list: content.WARRIOR_DECK },
  /*
   * **[FOUND BY A READER 2026-11-09] The other starter deck, which was on no shelf.**
   *
   * `cards/starter` held the Warrior and nothing held the Shade, so ten of the twenty cards a
   * first session touches were never commissioned -- and the brief could not say so, because it
   * counts what is on a shelf and reported 622 of 622 drawn the whole time. The handbook page
   * rendering ten blank rows is what found it.
   */
  { key: "cards/shade-starter", list: content.SHADE_DECK },
  { key: "cards/common", list: content.COMMON_POOL },
  { key: "cards/npc", list: content.INTENTS },
  { key: "cards/shade", list: content.SHADE_POOL },
  { key: "cards/strength", list: content.STRENGTH_POOL },
  { key: "cards/way", list: content.WAY_CARDS },
  { key: "cards/skill", list: content.WARRIOR_SKILLS },
  { key: "cards/wild", list: content.WILD_MAGIC },
  /*
   * **Both twist decks have faces, and the argument that one should not was wrong.**
   *
   * The brief used to say a twist is *"a NAME and a COST rather than a picture... the GM's own
   * deck, and art for a deck one person ever sees is art nobody at the table looks at"*, and drew
   * the ritual deck on the grounds that a ritual twist is turned face up in front of the party.
   *
   * The premise does not survive being said out loud: **the GM is somebody at the table.** They
   * draw from this deck more often than any player draws from any other, they are the one person
   * who will see all thirty cards in a session, and a deck somebody reads from constantly is
   * exactly the deck worth drawing. Audience size was never the right measure.
   */
  { key: "cards/twist", list: content.TWISTS },
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

  /*
   * **Conditions, which look like a deck to a player and were on no shelf at all.** The pile
   * sits face down beside the action deck wearing a back of its own, and every card in it
   * was blank paper with a word on it.
   */
  { key: "conditions", list: CONDITION_PIECES },
  { key: "features", list: content.FEATURES },
  /* A counterfeit is not a piece: it wears the picture of the item it forges, resolved below. */
  { key: "items", list: content.ITEMS.filter(i => !i.npc && !content.forges(i.name)) },
  { key: "items/npc", list: content.NPC_GEAR ?? [] },
  { key: "items/natural", list: content.NATURAL_WEAPONS ?? [] },

  { key: "tokens", dir: "tokens", kind: "token",
    list: expandRoster(content.ROSTER, content.VARIANTS) },
  { key: "tokens/warrior", dir: "tokens", kind: "token", list: [content.WARRIOR] }
].map(shelf => ({ ...shelf, dir: shelf.dir ?? shelf.key }));

/**
 * **Maps, which are art and are deliberately not a shelf.**
 *
 * **[BUILT 2026-11-09]** Everything under `art/` has to be a piece somebody can account for --
 * the suite asserts it, and that check has earned its keep. A map is still art, so it needs an
 * entry; but it is not a piece of the CATALOGUE, and making it one would be wrong in three
 * separate ways:
 *
 * - The brief exists to tell an artist what to draw next, and a map is not drawn next. It is one
 *   commissioned artefact, directed by hand over a long afternoon, not a row in a queue of 643.
 * - The capsule is written for a card: portrait, 2:3, a bare strip under the name panel, one
 *   subject cropped close. Every clause of it is wrong for a continent.
 * - The gate measures a card: `quietTop` against the name panel, `inWindow` against the rules
 *   text. A landscape map fails all of it while being perfectly good.
 *
 * So maps are a short declared list of their own. The invariant the suite cares about is
 * unchanged -- every file under `art/` is named somewhere -- it is simply named here rather than
 * in `SHELVES`.
 *
 * **[2026-11-11] There were four reasons and the fourth has gone.** It read *a shelf implies a
 * slug-per-entry naming rule, which a map does not need because there is one of them*. There are
 * two now, and `mapPath` has always put them through the same `slug` as everything else, so that
 * reason was describing the list's length rather than anything about maps. The three above are
 * about what a map IS and hold at any count.
 */
export const MAPS = [
  { name: "Firma", blurb: "The continent, coast to coast: land and sea, with no borders, no "
    + "names and nothing built. Everything political goes on top of it as a layer." },
  /*
   * The layer that blurb promises, drawn onto a copy rather than over the top: the six districts
   * with their borders and their names, the enclaves ringed, and every place the world's file
   * mentions labelled. The plain one stays because it is the one to redraw on -- a border moves
   * and a district gets renamed roughly every other week, and annotation is the perishable part.
   */
  { name: "Firma Annotated", blurb: "The same continent with the politics on: district borders "
    + "and names, the enclaves ringed, seas and ranges and every settled place labelled." }
];

/** Where a map's file sits. Same slug rule as everything else, different list. */
export const mapPath = name => `${ROOT}/maps/${slug(name)}.${DELIVERY.format}`;

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
