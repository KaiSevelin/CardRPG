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
  /*
   * **[GATE 2026-11-13] 8.9% of bare top against a floor of 10%**, which is the one rule an arm
   * entering the frame is most likely to break. The brief said *from the frame's edge* and left
   * the model to pick one; naming the edge costs a word and keeps the gesture out of the strip
   * the card prints its name on.
   */
  heckled: "A thumb turned down at the end of a bare arm thrust in from the lower edge, drawn large and crude. Whoever it belongs to is not in the picture.",
  burning: "Heavy cloth catching: one corner curling black, the flame eating inward along a line. No figure, no torch, no pyre -- fabric and the edge of the burn.",
  poisoned: "A shallow bowl tipped over on the ground, a dark residue running out of it in one slow line. Nothing drinking, nobody holding it.",
  exposed: "A breastplate strap cut through, the ends hanging apart, the plate swinging away from what it covered. The body only as the shape it is leaving.",
  frozen: "A boot taken into a sheet of grey ice, the ice risen past the ankle and holding it. Cut off at the shin; nothing above.",
  prone: "Ground seen from very low down: a scatter of grit at eye height and the horizon near the top edge. The viewer is the one who is down.",
  unconscious: "An open hand lying palm-up on the ground, fingers slack and apart, the arm running out of frame. Still, and not dead.",
  grappled: "Two hands locked around one forearm from opposite sides, gripping hard enough to mark it. Hands and arm only; no faces and no bodies.",
  silenced: "A mouth closed in the middle of a word -- nothing but lips and jaw, with a single stroke sealing the line of them. No gag, no hand, no cross.",
  disarmed: "A sword hilt-down in the dirt where it fell and still rocking, with the open hand that dropped it at the top edge of the frame.",
  /*
   * **[REFUSED 2026-11-13, REWRITTEN] `safety_violations=[self-harm, violence]`, at the OUTPUT
   * stage.** The brief asked for a taut string running down to a wrist with the hand already
   * turning, and a cord to a cropped limb is a ligature to a classifier whatever the sentence
   * around it says. It is the same finding `ART_REFUSED`'s own note records about *Where It Is
   * Held*: **the words were never the problem, the composition was**, and no rewording of a
   * string tied to a wrist was going to pass.
   *
   * So the body goes entirely. Compulsion is not restraint -- it takes away what you may CHOOSE
   * and nothing else (conditions.md 1.1) -- and a walk that turns against the walker says that
   * without a person in the frame to do it to.
   */
  compelled: "A line of footprints in dust turning hard mid-stride: the last two face a way the first three were not going. No figure, no cord, no hand.",
  graven: "Fresh ink worked into a forearm, the lines raised and the skin still angry around them. Close enough that it is skin and ink and nothing else.",
  blessed: "A thin shaft of outside light falling across a worn stone floor: one bright edge, and no source anywhere in the frame.",
  cursed: "A hairline crack running the full height of a plain stone, fine at the top and open at the bottom. Nothing else on the stone.",
  burdened: "A pack strap biting into a dropped shoulder, the cloth bunched where it has pulled. No face and no pack -- strap, shoulder, and the dent.",
  overloaded: "A pack that has given way: the bottom seam split, its contents going into the dirt. From behind and below, nothing identifiable in what falls.",
  wet: "Water running off a flat surface in one sheet, the last of it beading along the lower edge. No rain, no vessel, no figure.",
  offBalance: "One foot caught on a raised root, the heel already lifting and the weight gone past where it can be recovered. Below the knee only.",
  marked: "A chalk cross on a plain wooden door, drawn fast and recently, the dust still on the boards beneath it.",
  judged: "A pair of hand-scales hanging still with one pan lower than the other, against bare paper. Nothing in either pan.",
  /* Imbued is power on loan from somebody much older, and the hard part is drawing the loan
   * rather than the lender: a god in the frame would be a conjuration, which is the exact
   * thing this condition exists instead of. So the evidence is in what the hands are doing
   * and what is coming off them. */
  imbued: "A pair of open hands held low, lit from inside the skin rather than from the room, the glow strongest at the knuckles and dying at the wrists. No face, no figure above the forearms, nothing held.",
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

/**
 * **What an injury's picture is of.**  [BUILT 2026-11-14]
 *
 * Injuries were on no shelf, so fourteen slates a character carries for the rest of their life --
 * and reads on their own sheet more often than they read most cards -- had nothing on them. The
 * same silence that hid the conditions: the brief counts what is on a shelf, and a thing on no
 * shelf cannot be reported as missing.
 *
 * **Draw what is left behind, never the harm.** This is the conditions shelf's rule one step
 * further, and it is a rule twice over.
 *
 * It is the **house style**: every shelf in this book but the titles draws an object, a gesture or
 * a place, because one picture has to serve a goblin, a dragon and the player, and a figure in the
 * frame is the wrong figure for most of the table. An injury is worse than most -- *Lost Hand* on
 * a drawn body is somebody else's character for ever.
 *
 * And it is what an image model will actually draw. `ART_REFUSED` records the precedent: *Where It
 * Is Held* was refused for its composition rather than its words, and no rewording of that
 * sentence was going to pass; rewritten to the object and the aftermath -- *a hand already on the
 * strap* -- it drew first time, and the card is better for it. A brief that asks for a wound is a
 * brief that gets refused, retried and refused again, and the honest fix is not to soften the
 * wording until it slips through. It is to draw the right subject.
 *
 * So: **the thing that compensates, the thing that no longer works, or the record of it.** No
 * bodies, no blood, no mutilation, no faces. The eye-patch rather than the eye; the stick rather
 * than the leg; the loaf rather than the flesh.
 */
export const INJURY_LOOKS = {
  "Lost Eye": "A plain cloth eye-patch hooked over the corner of a shaving mirror, the mirror "
    + "showing only the wall behind. Nobody reflected.",
  /*
   * **[REFUSED 2026-11-14] violence + illicit, at the OUTPUT stage.** The first wording was *a
   * lockpick lying across a lock that has not turned, beside a leather glove with two of its
   * fingers stitched flat*, and it earned both categories honestly: a lockpick in a lock is a
   * burglary whatever the sentence around it says, and a glove described by the fingers it is
   * missing invites the hand that is missing them.
   *
   * Rewritten rather than reworded, which is what `ART_REFUSED` already records about the last
   * one: *the words were never the problem, the composition was.* The injury is **fine work you
   * can no longer do**, so the picture is the fine work. It is warmer too -- steel and grey
   * leather are a cool subject and brass and boxwood are not.
   */
  "Lost Fingers": "A roll of fine engraver's tools in tan leather on cream cloth, the two smallest "
    + "out of their loops and set apart. Brass and boxwood.",
  "Lost Hand": "A pair of gauntlets on a workbench: the left worn soft and shaped by use, the "
    + "right still bright and unmarked. Nobody wearing either.",
  "Bad Leg": "One boot worn through along its outer edge, and a walking stick polished smooth at "
    + "the grip leaning against it. No feet in frame.",
  "Scarred Face": "A hand-mirror turned face-down on folded linen, a jar of salve open beside it "
    + "and a clean strip half unrolled. Nothing reflected.",
  /* **[GATE 2026-11-14] cool 3.3%, bare paper 4.7% against a floor of 5%.** A cup on a plank
   * table is a grey subject on a dark ground unless somebody says otherwise. Naming the light and
   * the wood costs a clause and buys both numbers. */
  /* **[FIGURE 2026-11-14]** Came back as a woman with her head in her hands behind the cup.
   * The shelf forbids a person and the shelf now says so in the prompt; the clause is here as
   * well because a cup on a table is an invitation to draw whoever is sitting at it. */
  "Shattered Nerves": "A full cup of pale tea alone on a sunlit pine table, low in frame, its "
    + "surface ringed with fine tremors. Honey and cream, the top bare. Nobody at the table.",
  "Shaken Faith": "A holy symbol on a snapped cord in the bottom of an open satchel, half under a "
    + "folded prayer sheet. Nobody wearing it.",
  /* **[FIGURE 2026-11-14]** *An empty cot* was not enough: it came back with somebody sitting
   * up in it. The emptiness has to be the subject rather than an adjective. */
  "Night Fears": "A candle guttering beside a cot nobody is in, the blanket thrown back and the "
    + "bed empty, the dark of the room pressing on a small ring of light. No figure.",
  "Hexed Blood": "A stoppered glass vial of something dark on a slate, and one spilt drop beside "
    + "it that has eaten a pale ring into the stone.",
  "The Eager Hand": "An empty scabbard buckled shut on a belt, and across bare boards the sword "
    + "that belongs in it, point sunk into a plank.",
  /* **[FIGURE 2026-11-14]** Footprints are the evidence of a walker, and the model drew the
   * walker. Said plainly: the prints are what is left, and whoever made them is gone. */
  "Compelled Step": "A single line of muddy footprints crossing a bare stone floor dead straight, "
    + "passing an open door without turning toward it. The prints alone -- nobody in the room, "
    + "and nobody in the doorway.",
  /* **[GATE 2026-11-14] ink at 9.4% from the top against a floor of 10%**, and the palette fault
   * before it was the brief's own doing: it asked for **grey-green**, the one hue band the
   * capsule forbids. A brief that names a cool colour and then fails for cool pixels is a brief
   * arguing with itself. Warm spoil, and the subject pushed down out of the name panel. */
  "Rotted": "A cut loaf low on a scrubbed pale board, the crumb gone dark amber and brown-black "
    + "right through to the crust. The top bare.",
  "Hollow Eyes": "A plain wooden mask face-up on a table, its eye-holes cut clean through to the "
    + "dark grain beneath. Nobody behind it.",
  /* **[GATE 2026-11-14] bare paper 4.2% against a floor of 5%.** A ledger is the one subject on
   * this shelf made OF paper, so the fix is to let the page be bright rather than tea-stained:
   * it supplies the light the gate is looking for. */
  /* **[FIGURE 2026-11-14]** The gate rewrite that brightened the page dropped the *no hand, no
   * quill* clause that was in the first version, and a man leaning over the book is what came
   * back. Both halves are wanted: the bright page for the gate, the empty chair for the shelf. */
  "The Debt": "An open ledger alone low in frame, pages bright bare cream, one line written in "
    + "brown ink and the sum column empty. A red wax seal. No hand, no quill, nobody at the desk."
};

/**
 * The fourteen, as pieces. Built from the content rather than listed again, so an injury added to
 * the game arrives in the brief the same day and is reported as still to shoot until somebody
 * draws it -- the arrangement `CONDITION_PIECES` is in, for the same reason.
 *
 * **A name and a blurb and nothing else**, which is the other half of that arrangement and the
 * half that was got wrong first.  [FIXED 2026-11-14] The entries were spread whole, carrying
 * `text` and `description`, and the shelf was pointed at `nodeBrief` -- which reads `lore`, a
 * field an injury has not got. So every injury was commissioned with **an empty subject line**:
 * the style capsule and nothing to draw.
 *
 * The brief printed an em dash in the subject column for all fourteen and nobody read the column.
 * What the model did with no subject was draw the NAME, so *Bad Leg* came back as a bandaged leg
 * on a crutch -- a human figure, which is the one thing this shelf forbids, and it passed the
 * gate because the gate measures composition and cannot see a subject.
 */
export const INJURY_PIECES = content.INJURIES.map(i => ({
  name: i.name,
  blurb: INJURY_LOOKS[i.name] ?? ""
}));

/*
 * **[WITHDRAWN 2026-11-14] There was a `HARM_LOOKS` for the harm faces here too, and it was
 * a second answer to a question already answered.**
 *
 * It was written because the blank-brief check named these eight beside the fourteen injuries,
 * and the inference from that was wrong. An injury had nothing anywhere: no `lore`, no blurb and
 * no entry in `DIRECTION`, so it really was commissioned with a style capsule and nothing to
 * draw. A harm face has a `DIRECTION` entry and always had -- *an arm bound tight and held
 * close, doing nothing and plainly unable to* -- and a direction REPLACES the piece's own
 * sentence rather than following it, which is the rule `art-prompts.mjs` learned from
 * forty-nine refusals.
 *
 * So the pictures were never blind. What the check measures is `art-list.md`'s subject column,
 * and an em dash there is the truth about a card whose own text is a name and a kind: the
 * sentence that says what to draw lives in the prompt book, which is the document that says it.
 * The check has been taught the difference rather than fed eight sentences to quiet it.
 *
 * Eight directions written here would have been eight pictures the brief describes and the game
 * does not contain -- cards creased and foxed, in a shelf whose art is bodies carrying what has
 * already happened to them. A second copy of a fact is a fact that can drift, and this one
 * drifted before it was a day old.
 */

/**
 * **The fate deck's eight faces.**  [BUILT 2026-11-13]
 *
 * This shelf is here because the argument against it was two claims and only one of them was
 * true. The brief said *twenty cards that are a number and a reshuffle marker; they want a design,
 * not twenty illustrations* -- and **it is not twenty.** It is **eight faces over twenty cards**,
 * which is the ratio the twist deck is already drawn at: one *Noise* picture serves four *Noise*
 * cards. *Not twenty illustrations* was used to conclude *no illustrations*, and that does not
 * follow from it.
 *
 * What survives from the old argument, and governs every line below: **the number is the
 * information.** A fate card is read in a row at tiny size and the player has to see `+1` the
 * instant it lands, so these are not eight scenes. They are a ground with weight, and the glyph
 * stays the subject.
 *
 * **So the shelf is a gradient rather than a set.** How much ink a card carries says how much the
 * card does: *Zero* is nearly bare paper and is the commonest card in the deck, one and two are a
 * stroke and a stroke gone wrong, and **Miss and Critical are the only two that are really
 * pictures** -- which they have earned, because they are the two that reshuffle the deck and
 * decide the fight (core-rules 6). No other shelf in the game reads in an order.
 *
 * **Named in words, because a glyph cannot be a filename.** `slug("+1")` is the empty string and
 * so is `slug("\u00b10")`, so three of these would collide on nothing at all. The *card* keeps its
 * glyph; the piece is called *Plus One* and files itself as `fate/plus-one.webp`. The engine asks
 * by key, like a condition, since neither has a name a path can be derived from.
 */
export const FATE_PIECES = [
  { key: "miss", name: "Miss",
    blurb: "A blade's arc drawn through empty air and nothing in it: the stroke complete, the thing it was aimed at not there. No figure and no target." },
  { key: "minusTwo", name: "Minus Two",
    blurb: "A wash that has run where it was not wanted -- a heavy bloom spreading off the edge of its own stroke, the shape lost under it." },
  { key: "minusOne", name: "Minus One",
    blurb: "One confident stroke with the brush lifted halfway: a clean start, a gap, and a thinner finish that does not match it." },
  { key: "zero", name: "Zero",
    blurb: "The quietest card in the game, and it is the one seen most. A single flat tide-line of wash across the frame and almost nothing above or below it." },
  { key: "plusOne", name: "Plus One",
    /* [GATE] 9.1% of bare top against a floor of 10. "Stopping cleanly where it meant to" says
     * nothing about WHERE, and a stroke rising from the bottom will run to the top unless told. */
    blurb: "One stroke rising from the lower edge and stopping well short of the top, with open paper all round it. Nothing crosses it." },
  { key: "plusTwo", name: "Plus Two",
    /* [GATE] 9.9%, and the brief asked for it: "high in the frame" is the top strip. */
    blurb: "Two strokes crossing above the middle and clear of the top edge, the ink pooling dark and deliberate where they meet." },
  { key: "critical", name: "Critical",
    /* [GATE] 2.4% cool against a ceiling of 1.0. The palette allows nothing outside the warm
     * band, and "broken white" is how you ask a model for a cold highlight without meaning to. */
    blurb: "All of it going through at once: ink at its darkest in one place, bare cream paper hard against it, no gradient and no cold light." },
  { key: "wild", name: "Wild",
    blurb: "Ink let into water: a bloom going somewhere nobody chose, the edge still moving and the shape not settled. No symmetry and no centre." },
];

/**
 * **The levelling graph's own pictures.**  [BUILT 2026-11-13]
 *
 * The brief used to list *the levelling graph's nodes* under what does not need art, on the
 * grounds that *a node wears the art of what it hands over, so drawing a Signature draws its node
 * too*. That was true of what the GRAPH draws and false of what the pane does: the description
 * panel shows a title, an axis, a resource and three paragraphs of prose, and a borrowed card
 * face is a picture of the reward rather than of the person.
 *
 * Three shelves, because the three ask for different pictures and say so in their own briefs:
 *
 * - **origins** are a PLACE, and every one of them is a real place in the world file.
 * - **backgrounds** are a trade, seen as the work rather than as a portrait.
 * - **titles** are a person -- the only shelf in this book that is, which is the whole reason
 *   these were worth commissioning instead of borrowed.
 *
 * Every piece's brief is derived from the node's own `lore`, which is authored once and read by
 * both the pane and the prompt book. A second description written beside the first would drift
 * the first time somebody rewrote one of them.
 */
const titled = content.NODES.filter(n => n.title);
export const ORIGIN_PIECES = content.NODES.filter(n => n.exclusive === "origin");
export const BACKGROUND_PIECES = content.NODES.filter(n => n.exclusive === "background");
export const TITLE_PIECES = titled;

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
  /*
   * **The two magical Ways' cards**, under `cards/` and not under `spells/`, which is the one
   * thing worth saying about these two rows: `spells/mind` and `spells/faith` below are the
   * formulas and the miracles, and a card is a different object with a different back. The lists
   * are named differently in the content for the same reason.
   */
  { key: "cards/mind", list: content.MIND_CARDS },
  { key: "cards/faith", list: content.FAITH_CARDS },
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
  /*
   * **The fate deck, which the brief argued out of existence on a miscount.** Eight faces over
   * twenty cards, read in a row at tiny size with the number doing the work -- so the shelf is a
   * gradient of weight rather than eight scenes. `FATE_PIECES` says why.
   */
  /*
   * **The critical deck, whose exemption only ever argued half of itself.** The brief said it
   * *needs neither faces nor a back*, and then gave one reason -- a card is turned face up the
   * instant a Critical lands and is never face down in front of anybody. That is an argument
   * about the BACK, and the no-back half still stands (`critCardData` deliberately writes none).
   * For the face it argues the other way: this is the one card in the game that is only ever
   * seen face up, read out to the table, at the loudest moment a fight has.
   */
  { key: "cards/crit", list: content.CRIT_EFFECTS },
  { key: "cards/fate", list: FATE_PIECES },

  /*
   * **The graph's three, and the only shelf in this book whose subject is a person.** A title is
   * somebody a player becomes; an origin is where they are from; a background is what they did
   * before. See the note above `ORIGIN_PIECES` for why these stopped being borrowed.
   */
  { key: "nodes/origin", list: ORIGIN_PIECES },
  { key: "nodes/background", list: BACKGROUND_PIECES },
  { key: "nodes/title", list: TITLE_PIECES },
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
  /*
   * **Injuries, which were on no shelf either.** Fourteen slates a character carries for the rest
   * of their life, read on their own sheet more often than most cards are read, and every one of
   * them blank. See `INJURY_LOOKS` for what they are pictures OF, which is the part that needed
   * deciding before any of them could be commissioned.
   */
  { key: "injuries", list: INJURY_PIECES },
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

/*
 * **A graph node is never resolved by name, so it never enters that index.**  [2026-11-13]
 *
 * `BY_NAME` exists for one caller: a variant creature, rebuilt fresh by `applyVariant` every time
 * it is asked for, so the object a builder holds was never the object this file indexed. Nothing
 * else needs it -- and the three node shelves in particular never could, because the pane and the
 * engine both hold the node itself.
 *
 * Letting them in cost something real and immediately. Four titles share a name with a creature --
 * **Artillerist, Berserker, The Purple and Flagellant** -- so the collision detector did exactly
 * what it is for and struck all four out of the index, which took the four CREATURES' tokens with
 * them. A node that cannot be looked up by name loses nothing; a variant creature loses its only
 * route. One line, and the names stop competing for an index only one of them uses.
 */
const NAMELESS = new Set(["nodes/origin", "nodes/background", "nodes/title"]);

for (const shelf of SHELVES) {
  for (const entry of shelf.list) {
    BY_ENTRY.set(entry, fileOf(shelf, entry));
    if (NAMELESS.has(shelf.key)) continue;
    if (BY_NAME.has(entry.name)) { AMBIGUOUS.push(entry.name); BY_NAME.delete(entry.name); }
    else if (!AMBIGUOUS.includes(entry.name)) BY_NAME.set(entry.name, fileOf(shelf, entry));
  }
}

/**
 * **Which slate type a shelf holds, for the shelves that hold slates.**  [BUILT 2026-11-14]
 *
 * The three card-like documents a character carries -- an item, a feature, a formula -- are the
 * only ones that can be looked up from a *document* rather than from a content object, because a
 * document knows its `type` and its `name` and nothing else about where it came from. Every other
 * shelf is left out deliberately: a creature's token and a card's face are reached through
 * `BY_ENTRY` by whatever built them, and a shelf that cannot be addressed this way should answer
 * nothing rather than answer a guess.
 */
const SLATE_SHELVES = {
  items: "item",
  "items/npc": "item",
  "items/natural": "item",
  features: "feature",
  injuries: "injury",
  "spells/elemental": "spell",
  "spells/shadow": "spell",
  "spells/mind": "spell",
  "spells/faith": "spell",
  /*
   * **A signature shelf holds whatever the signature IS**, which is three of the four kinds: the
   * Shade's are features, an item and cards; Tattoo Magic's are spells and a feature. So these
   * four have no default -- the entry says, and an entry that says nothing is a card and not a
   * slate at all.
   */
  "signatures/shade": "",
  "signatures/strength": "",
  "signatures/mind": "",
  "signatures/faith": ""
};

/**
 * **The document type a content entry becomes, when the entry has an opinion.**
 *
 * `kind` is an overloaded field and that is the whole of the care needed here. On an **item** it
 * is a category -- Weapon, Potion, Ammunition. On a **spell** it is the Way -- formula or miracle.
 * On a **signature** and on the two mixed pools it is the document type, because those lists hold
 * more than one kind of thing and something has to say which.
 *
 * So only the three slate types and `card` are read; anything else is a word about something
 * other than this question and the shelf's own answer stands. That rule holds for every list in
 * the book without a list of exceptions, which is what makes it safe to leave for the next pool.
 */
const DOC_KINDS = new Set(["item", "feature", "spell", "card"]);

const slateTypeOf = (shelf, entry) => {
  const said = DOC_KINDS.has(entry?.kind) ? entry.kind : "";
  const type = said || SLATE_SHELVES[shelf.key] || "";
  return type === "card" ? "" : type;
};

/**
 * **The picture a SLATE wears, derived from its type and its name.**  [BUILT 2026-11-14]
 *
 * `slateData` stamps a path onto an Item's `img` when the document is made, and `resyncArt`
 * repairs one that was made before the art was wired. Both of those are **writes**, and a write
 * only reaches the documents that exist when it runs: a slate dragged in from a module, built by a
 * macro, created by hand, or embedded on an actor by a world that was last rebuilt before its
 * picture was drawn carries an empty `img` and no amount of re-running setup on *this* world will
 * find it.
 *
 * So the same rule is readable at render time too. The path is **derived** -- the shelf's
 * directory and the slug of the name -- so asking for it costs a map lookup and can never
 * disagree with what the write would have stamped.
 *
 * Keyed on type **and** name, for the reason `resyncArt` already states: six names in the book
 * belong to two pieces each, and a feature wearing an item's picture is worse than wearing none.
 * A name that is ambiguous *within one type* is struck out here the same way `BY_NAME` strikes
 * one out across all of them.
 */
const BY_SLATE = new Map();
const SLATE_CLASH = new Set();

for (const shelf of SHELVES) {
  if (!(shelf.key in SLATE_SHELVES)) continue;
  for (const entry of shelf.list) {
    const type = slateTypeOf(shelf, entry);
    if (!type) continue;
    const key = `${type}:${entry.name}`;
    if (SLATE_CLASH.has(key)) continue;
    if (BY_SLATE.has(key)) { SLATE_CLASH.add(key); BY_SLATE.delete(key); continue; }
    BY_SLATE.set(key, fileOf(shelf, entry));
  }
}

/**
 * **The two shelves that hold a FIGURE rather than a card**, and the one picture each wears.
 *
 * A creature's token and the starter Warrior's are the same kind of thing -- which is why they
 * share `tokens/` in the first place -- and both go in the same two slots on a document:
 * `Actor.img` and `prototypeToken.texture.src`. Indexed by name because that is all a document
 * has to offer, which is the same reason `BY_NAME` exists for a variant creature.
 */
const TOKEN_SHELVES = new Set(["tokens", "tokens/warrior"]);
const BY_FIGURE = new Map();
for (const shelf of SHELVES) {
  if (!TOKEN_SHELVES.has(shelf.key)) continue;
  for (const entry of shelf.list) BY_FIGURE.set(entry.name, fileOf(shelf, entry));
}

/** The picture a creature or a hero is drawn in, by name, or nothing. */
export function figurePath(name) {
  return name ? BY_FIGURE.get(name) ?? "" : "";
}

/**
 * The file a slate of this type and name is drawn in, or nothing.
 *
 * **One name in the book answers nothing here, and should.** *The Kit* is both an item in the
 * catalogue and the Shade's signature item, two different pieces with two different pictures, so
 * asking by name cannot tell them apart -- and a wrong picture is worse than none. Both documents
 * still wear theirs: they are built from the definition itself, through `BY_ENTRY`, which is
 * exact. This is the fallback for a document whose stamp was never applied, and a fallback that
 * guessed between two pictures would be the one thing worse than a blank card.
 */
export function slatePath(type, name) {
  if (!type || !name) return "";
  const forged = content.forges(name);
  return BY_SLATE.get(`${type}:${forged || name}`) ?? "";
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
