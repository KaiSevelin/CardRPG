/**
 * Write the prompt book. Run with: node test/art-prompts.mjs
 *
 * One prompt per piece in the art list, in the style the six-flavour test picked: brush and ink
 * wash. It is **generated from the same GROUPS the art list walks**, so the brief and the prompt
 * book cannot disagree about what exists -- a prompt book that lists 494 pieces beside a brief
 * that lists 501 is a second printer, and the only reliable cure for a second printer is not
 * having one.
 *
 * ## What is generated and what is written by hand
 *
 * The SUBJECT of each prompt is generated: the piece's name, the brief the content already
 * writes, and one motif clause per verb and condition the piece actually uses. That last part is
 * the whole idea. A style makes 501 pictures look alike; a motif table makes them *read* alike --
 * every Strike card shares a gesture, so the table learns the art the way it learned the icons.
 *
 * The motif tables and the style capsules are written by hand, once, and they are short on
 * purpose: six verbs, fifteen effects, twenty-four conditions. A vocabulary with no motif prints
 * `[GAP]` into the file rather than falling through silently, because a missing motif is a
 * picture nobody thought about and should look like one.
 */

import fs from "node:fs";
import path from "node:path";
import { CARDRPG } from "../module/config.mjs";
import * as content from "../module/content.mjs";
import {
  CREATURES, DELIVERY, GROUPS, backs, brief, conditionName, creatureBrief, slug
} from "./art-list.mjs";

const root = path.join(import.meta.dirname, "..");
const OUT = path.join(root, "..", "art-prompts.md");

/* -------------------------------------------- */
/*  The palette, read from the game              */
/* -------------------------------------------- */

/**
 * The four Ways' colours, taken from `WAY_COLOUR` in `module/levelup.mjs`.
 *
 * **Read out of the source text rather than imported**, because that module touches a Foundry
 * global while it evaluates and cannot be loaded outside the browser -- so the alternative was a
 * second copy of four pairs of hex values, drifting quietly the first time the graph was
 * repainted. A grep over a whole file is the same move `validate.mjs` makes for the same reason.
 *
 * It throws rather than falling back. A palette that silently reverts to grey would produce 501
 * grey pictures and no error.
 */
function wayColours() {
  const src = fs.readFileSync(path.join(root, "module/levelup.mjs"), "utf8");
  const block = src.match(/const WAY_COLOUR = \{([\s\S]*?)\n\};/);
  if (!block) throw new Error("WAY_COLOUR not found in module/levelup.mjs -- has it been renamed?");
  const out = {};
  for (const m of block[1].matchAll(/(\w+):\s*\{\s*fill:\s*"(#[0-9a-f]{6})",\s*edge:\s*"(#[0-9a-f]{6})"/g)) {
    out[m[1]] = { fill: m[2], edge: m[3] };
  }
  for (const way of Object.keys(CARDRPG.ways)) {
    if (!out[way]) throw new Error(`no colour read for the Way of ${way}`);
  }
  return out;
}

const WAY = wayColours();

/** The card stock, from the CSS tokens, so the art and the frame around it cannot disagree. */
function stock() {
  const css = fs.readFileSync(path.join(root, "styles/cardrpg.css"), "utf8");
  const pick = name => {
    const m = css.match(new RegExp(`--cardrpg-${name}:\\s*(#[0-9a-f]{6})`));
    if (!m) throw new Error(`--cardrpg-${name} not found in styles/cardrpg.css`);
    return m[1];
  };
  return { ink: pick("ink"), paper: pick("paper"), rule: pick("rule") };
}

const STOCK = stock();

/* Which Way a group belongs to, where it belongs to one. Everything else is neutral. */
const WAY_OF_DIR = {
  "cards/shade": "shade", "signatures/shade": "shade", "spells/shadow": "shade",
  "cards/strength": "strength", "signatures/strength": "strength",
  "signatures/mind": "mind", "spells/mind": "mind",
  "signatures/faith": "faith", "spells/faith": "faith"
};

function accentFor(dir) {
  const way = WAY_OF_DIR[dir];
  if (!way) {
    return `- One chromatic accent only: **${WAY.strength.edge}**, a warm brick red. Use it on the\n`
      + "  one thing the picture is about, and nowhere else.";
  }
  const label = `Way of ${way[0].toUpperCase()}${way.slice(1)}`;
  return `- This group is the **${label}**, so its one chromatic accent is **${WAY[way].edge}**,\n`
    + `  deepening to **${WAY[way].fill}** in the darkest wash. Use it on the one thing the\n`
    + "  picture is about, and nowhere else. No other hue appears.";
}

/* -------------------------------------------- */
/*  The style capsules                           */
/* -------------------------------------------- */

/*
 * Brush and ink wash, written against the three things it got wrong in the six-flavour test
 * rather than against an idea of what it looks like.
 *
 * At 128px with the wordiest card's text, flavour 2 went grey and muddy -- it was the prettiest
 * at 300px and nearly invisible at the size the game actually draws. So the capsule forbids the
 * three mechanisms of that failure by name: neutral grey, an all-soft edge, and an evenly toned
 * field with nothing to separate against.
 */
const WASH = `Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black ${STOCK.ink} and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare ${STOCK.paper} paper, near white**, and there is a lot of it.
- The darkest line is **near-black ${STOCK.ink}**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.`;

const FORMAT_FACE = `- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.`;

/*
 * The composition rule, and the one thing the test actually changed.
 *
 * "Keep the focal point at about 30% of the height" produced six full standing figures with their
 * heads above the panel line, because a full figure is what anyone draws from that sentence. It is
 * written as a CROP here instead, which is an instruction an image model can follow.
 */
/*
 * The focal example is per group, because naming one is naming a subject. *A face, a blade's
 * edge* is the right pair for twenty groups and exactly wrong for the intent pool, where a face
 * and a blade are the two things the card must not contain -- a capsule that forbade them in one
 * paragraph and asked for them in the next.
 */
const FOCAL = {
  "cards/npc": "the point of contact, the place the ground is marked, the gap where the distance "
    + "went"
};
/*
 * **The second rewrite, and this one has twenty-two generated cards behind it.**
 *
 * The crop wording got the crop and lost the height. Of the seventeen faces in the first real
 * batch, FIFTEEN put dark mass inside the top 13% -- helmets and heads, exactly where the card
 * prints its own name -- and SIXTEEN had the centre of their ink below 43%, median 57%, which is
 * the half the rules text covers. The rule asked for 28% and got 57%.
 *
 * Three things were wrong with how it was written, and none of them was the measurement:
 *
 * 1. **A percentage is not an instruction.** *Sits at 28% of the height* is a number a model
 *    cannot act on. *The top quarter is empty* is a picture, and a picture is followable.
 * 2. **It said the opposite of itself.** *Draw that area fully; put nothing there that matters*
 *    asks for an area both filled and empty, and the batch resolved the contradiction by putting
 *    a head there -- which is what goes at the top of a figure.
 * 3. **It never said what to leave out.** A three-quarter crop of a person has a head, and a head
 *    goes at the top, so the head went at the top. The ban has to be named.
 *
 * And the empty quarter does a second job the batch also failed: it is bare paper, so it is the
 * light the wash rules kept asking for and not getting. Fourteen of the twenty-two had no pixel
 * lighter than L235 and none darker than L35 -- a mid-toned field, the third style failure by
 * name. One instruction fixes both, because the quarter has to be paper for the composition to
 * work and paper is white.
 */
/*
 * **The third version, and the second one was overcorrected by a measurement.**
 *
 * *The top quarter is empty* plus *the bottom half is scenery* leaves the subject a quarter of
 * the frame to live in, and the first card generated from it resolved that by keeping the empty
 * quarter -- 37% of it -- and letting everything else sprawl below. The tone half worked
 * completely: true black 0.0% to 18.8%, bare paper 0.3% to 51.9%. The placement went the other
 * way, and **4% of its dark ink landed in the band the card leaves clear**, against 35% for the
 * picture it replaced. A better drawing, and a worse card.
 *
 * What was wrong was asking with two exclusions. Both pushed, neither said where to stand. This
 * version names the place positively and leaves the body free to fall out of frame below it,
 * because a figure that reaches the bottom edge was never the problem -- a figure whose FACE is
 * down there is.
 */
/*
 * **The fourth version, and the first three each failed in a way the next one answered.**
 *
 * v1 asked for a focal at 28% and got heads under the name panel. v2 emptied the top quarter and
 * got a subject that sprawled below the rules text -- 4% of its ink in the band the card leaves
 * clear. v3 asked for the action in the upper third and said *the body carries on down, that is
 * wanted*, and got 18.7%: a portrait whose face was in the right place and whose dark cloak
 * filled the entire bottom half.
 *
 * Which is the lesson. **The score is not won by where the subject starts, it is won by the
 * bottom half being LIGHT.** The one card in the first batch that cleared 45% did it with a pale
 * ground under a braced figure; every version since has invited a dark mass down there in so
 * many words -- *the body carries on down* is an instruction to put ink in the worst place on the
 * card. So this version says where the dark lives and says the rest goes pale, which is also what
 * brush and wash does when it is working.
 */
const composeFace = dir => `- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- ${FOCAL[dir]
    ?? "a face, a blade's edge, the point of the gesture"} -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.`;

/*
 * **The face capsule banned "cool hue" and got green, which is the back capsule's bug twice.**
 *
 * The backs said *no cyan, no magenta, no neon* and came back teal and violet, because teal is
 * none of those three; that was fixed by naming the hues. The FACE capsule was left saying *no
 * cool hue anywhere*, which is the same vagueness in a different dress -- nobody calls grass
 * cool. So *Close In* asks for a strip of trodden ground, the ground arrives as grass, and 4.4%
 * of the card is 60-150 degrees. Four intents failed this way.
 *
 * Naming the hues is half of it. The other half is that a fantasy picture puts grass on the
 * ground unless told otherwise, and most of these cards have ground in them, so the ban has to
 * say so out loud rather than leave the artist to deduce it from a hex code.
 */
const PALETTE_BASE = `- Line and darks: **${STOCK.ink}**
- Paper and lights: **${STOCK.paper}**
- Mid tone: **${STOCK.rule}**`;

/*
 * **What one group needs that the others do not.**
 *
 * The NPC intent pool is the only group in the set whose pictures are not of anybody. One pool
 * serves every creature in the world (core-rules 9), so *Close In* sits behind a goblin, an elf
 * and a dragon in the same fight -- and the first run of these prompts came back as a gallery of
 * human knights, because "a playing card in a tabletop fantasy RPG" plus a brush and a blow is a
 * knight unless something says otherwise.
 *
 * It said otherwise, in the group's own line -- and that line was printed as markdown OUTSIDE the
 * capsule, where the model never saw it. A rule that is only in the part nobody pastes is not a
 * rule. Both halves below are new: the group line goes INTO the capsule, and the pool gets the
 * constraint spelled out as something an artist can check their own work against.
 */
/*
 * **And the second half, which is the correction to the first.**
 *
 * The constraint block above worked and cost too much. Banning the species banned the anatomy,
 * the weapon, the clothing and the scale -- and those were doing most of the work of telling one
 * intent from another, so the prompts came back as one picture of dust and a dark mass, thirty-odd
 * times. The ban was right; applying it to the whole frame was not.
 *
 * **And a third correction, which is a conflict rather than a mistake.** *One limb or one edge
 * entering frame* is the right instruction for an anonymous actor and it is also an invitation to
 * touch the frame edge -- including the top, where the card prints its own name. Sixteen of the
 * first thirty-five intents put ink inside that strip, and three of four re-shoots came back at
 * 8.6%, 9.4% and 9.6% against a floor of 10: close enough to be obedience, consistent enough to
 * be the prompt rather than the dice. The same shape as the dagger on the skill back and the knot
 * on the twist back -- a group's own direction quietly excluding what the capsule asked for. The
 * fix belongs in the direction, never in the floor.
 *
 * **Only the actor is shared.** The card is drawn by a goblin and a dragon alike, so the thing
 * acting has to be unreadable -- but the thing being acted on is a player character, and players
 * are human. So the receiving end, the ground, and the aftermath can all be drawn in full detail,
 * and that is where the difference between these cards now lives.
 */
const EXTRA = {
  "cards/npc": `WHO IS DOING IT. **The actor is nobody, and that overrides everything below.**
This one picture is used by every creature that has earned the card, so it must not show what kind
of thing is acting.

- No species markers on the actor: no human face, no human proportions, no armour or clothing
  belonging to a people, no scales, no fur, no feathers, no wings, no recognisable weapon from any
  culture.
- **Nothing in frame may say how big the actor is.** Scale gives it away even when anatomy does
  not, so no doorways, no trees, no furniture and no horizon that implies a standing height.
- If the actor must appear at all it is a dark anonymous mass, cropped hard, reading as motion
  rather than as anatomy. One limb or one edge entering frame beats a whole creature every time --
  **entering from a side or from below, never from the top.** The strip of bare paper across the
  top of the picture is the one edge nothing crosses, the actor included.
- Where the subject below names a weapon, read it as *whatever this creature strikes with*: an
  edge, a claw, a mass, a mandible. Never a sword.

WHAT IS STILL DRAWN IN FULL. **Only the actor is anonymous -- nothing else in the frame is.**
The far side of this card is a player character, and players are human.

- The receiving end is a person, drawn as one: a hand, a boot, a shoulder, a raised shield, a
  dropped blade, a guard pointing the wrong way, a figure going down.
- The ground is a person's ground: churned dirt, a splintered door, the broken crust of a trap,
  two furrows where somebody's heels dragged.
- Aftermath is a subject in its own right: dust still falling, a wake closing over, a print half
  filled in, a mark on skin doing more than the blow that made it.
- **This is the whole of what separates these cards.** The actor is a dark mass on every one of
  them; if the action is generic too then the pool is one picture over and over. Draw the subject
  line literally, specifically, and in detail.`
};

/*
 * **A group that bans a subject has to stop asking for it two paragraphs later.**
 *
 * The intent pool's constraint block forbids a face and a weapon, and the composition paragraph
 * named *a face, a blade's edge* as the thing to put at 28% -- one capsule contradicting itself,
 * which is the shape of mistake that survives review because each half reads correctly on its
 * own. Tying the two tables together means the next constraint block cannot be added without
 * someone looking at the focal example.
 */
for (const dir of Object.keys(EXTRA)) {
  if (!FOCAL[dir]) {
    throw new Error(`${dir} has a constraint block but still uses the default focal example `
      + "-- check they do not contradict each other, then add one to FOCAL");
  }
}

/** The face capsule, per group, because the accent and the constraints are the group's. */
function faceCapsule(dir) {
  return `A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. ${FRAME[dir] ?? ""}
${EXTRA[dir] ? `\n${EXTRA[dir]}\n` : ""}
FORMAT.
${FORMAT_FACE}

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
${composeFace(dir)}

PALETTE.
${PALETTE_BASE}
${accentFor(dir)}
- Desaturated and earthy. ${WAY_OF_DIR[dir]
  ? "Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and\n  the warm greys between them."
  : "Warm throughout."} **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

STYLE.
${WASH}`;
}

/*
 * The token capsule. A token is a different object from a card, and the contradiction has to be
 * stated: this style is wash on paper, and a token has no paper -- it sits on a map.
 */
/*
 * **A token is not held to the palette, and that is a decision rather than an oversight.**
 *
 * The warm sepia is a CARD rule: a hand of cards is a printed set and has to look like one. A
 * token is a miniature on a map, seen beside other miniatures and never beside a card at a size
 * where the difference shows -- so a mossy troll should be green and a drowned draugr should be
 * hel-bla, and holding either to red-and-amber buys nothing and costs the creature.
 *
 * The gate knows this too: it scores a token on size, alpha and nothing about hue.
 */
const TOKEN_CAPSULE = `A single creature token for a virtual tabletop.

FORMAT.
- Square, aspect ratio exactly 1:1, 1024 x 1024.
- **The background must be fully transparent.** A token sits on a map, not in a frame, so any
  background is a square of the wrong colour around the creature.
- ABSOLUTELY NO TEXT, no base, no plinth, no ground shadow, no circular border or ring.

COMPOSITION.
- **The whole creature**, head to foot or nose to tail, filling the square edge to edge. Nothing
  is printed over a token, so there is no safe area.
- Seen from **above at a three-quarter angle**, consistently, as a figure on a table is seen by
  the people around it. Never a portrait, never a side elevation.
- The silhouette does the work: this will be looked at beside twenty other tokens at 60 pixels,
  and the only question that matters is *which creature is that*.

PALETTE.
- **The creature is its own colour.** Draw it as the thing actually is: a mossy troll is green, a
  drowned corpse is hel-bla, a hairless hide is grey. Nothing here is held to the warm palette the
  cards use.
- Desaturated and natural rather than bright -- this is still ink and wash, not poster paint -- but
  the hue belongs to the animal and not to the deck.
- Line and darks stay **${STOCK.ink}**, so a token reads as drawn by the same hand.

STYLE.
${WASH}

**And the paper is not there.** This style is wash on paper everywhere else in the set; here the
paper is the map underneath, so the brushwork stays and the ground does not. The creature's outer
edge is a brush edge -- ragged, varied, alive -- against full transparency, never a cut-out line
and never a white halo.`;

/* A back is the one piece in the set with the whole card to itself. */
/*
 * **The accent the capsule promised and never named.**
 *
 * It said *one chromatic accent only, named per deck below* -- and no deck below named one, so
 * for five backs the only instruction about colour was that there should be a colour. Two of the
 * five invented one: the skill back came back teal and the Wild Magic back violet, 4.3% and 3.4%
 * of the frame outside the warm palette, in a set whose whole premise is that it is warm.
 *
 * The ban is also spelled out by name now rather than as the category *cool*. The capsule said
 * "no cyan, no magenta, no neon", and teal is none of those three.
 */
const BACK_CAPSULE = `The back of a deck of cards in a tabletop fantasy RPG.

FORMAT.
${FORMAT_FACE}

COMPOSITION.
- **No safe area.** Nothing is printed over a back, so the whole card is yours.
- A back does one job: it says which deck a face-down card came from, across a table, at a
  glance, all evening. It is a **design**, not an illustration -- symmetrical or near, centred,
  and legible upside down, because half the table sees it that way.
- It must be unmistakable beside the other backs in this set at **128 pixels**.

PALETTE.
${PALETTE_BASE}
- One chromatic accent only: **${WAY.strength.edge}**, a warm brick red, on the device itself.
- Warm, desaturated, earthy. **No cyan, no teal, no blue, no green, no purple, no magenta, no
  neon.** Every hue in the picture is between red and amber. There are no exceptions to this.

STYLE.
${WASH}`;

/* -------------------------------------------- */
/*  The motifs                                   */
/* -------------------------------------------- */

/*
 * One fixed image per word in the game's vocabulary.
 *
 * This is the half of "consistent" that a style cannot do. A style makes 501 pictures look like
 * each other; this makes them MEAN like each other -- every Strike is the same instant, every
 * Grappled is the same hold -- so a player reads a new card's art before reading its text.
 */
const VERB_MOTIF = {
  strike: "the instant a blow lands, the weapon already through -- never wound up, never posing",
  cast: "a shape held in the air between the hands, half-finished and still forming",
  defend: "a guard closing: shield, forearm or shoulder set against something off-frame",
  use: "a hand working an object, the object mid-use rather than held up to be seen",
  move: "ground covered -- weight forward, the last footfall still behind",
  ready: "a weapon coming to hand, caught between carried and held"
};

/**
 * The short form of a motif, for when the step has qualifiers of its own to carry the picture.
 *
 * **A motif is a whole sentence, and a whole sentence does not take a suffix well.** Appending
 * qualifiers to the long form gave every Strike card the same eighty characters before anything
 * distinguishing arrived, and a card with two Strikes on it printed the stock phrase twice. With
 * qualifiers the stem leads and the qualifiers ARE the picture; without them the long form stands
 * alone, which is what it was written for.
 */
const VERB_STEM = {
  strike: "the blow landing", cast: "the shape forming between the hands",
  defend: "the guard closing", use: "the object mid-use",
  move: "the ground covered", ready: "the weapon coming to hand"
};

const EFFECT_STEM = {
  heal: "the wound closing", block: "the blow stopped flat", conjure: "the arrival",
  shape: "matter bending", foresee: "the moment shown twice", range: "the distance crossed",
  blast: "the force travelling out", aimed: "the single line", advantage: "the second chance",
  disadvantage: "the ground against you", charging: "the mass committed", shake: "footing lost",
  tainting: "the wrongness spreading", corrode: "metal giving way", lift: "the weight taken off"
};

const EFFECT_MOTIF = {
  heal: "a wound closing, or breath coming back",
  block: "a blow stopped flat, its force going sideways",
  conjure: "something arriving that was not there a moment ago",
  shape: "matter bending to a hand",
  foresee: "the moment before a thing happens, shown twice",
  range: "distance crossed by the eye and not the body",
  blast: "an edge of force travelling outward",
  aimed: "one line, from eye to target, and nothing else in frame",
  advantage: "two chances where there was one",
  disadvantage: "the ground itself against you",
  charging: "mass already committed, past the point of stopping",
  shake: "footing lost",
  tainting: "something going wrong under the skin",
  corrode: "metal giving way",
  lift: "a weight taken off"
};

const CONDITION_MOTIF = {
  dazed: "sight swimming", slowed: "movement dragging, as if through water",
  stunned: "a body gone still in the middle of an action", halted: "stopped dead at a line",
  invisible: "only the shape the air makes", heckled: "attention pulled the wrong way",
  burning: "fire taking hold", poisoned: "colour draining out",
  frozen: "ice closing over", prone: "down, and the ground very close",
  unconscious: "gone slack", grappled: "held, and not letting go",
  silenced: "a mouth stopped", disarmed: "a weapon leaving the hand",
  compelled: "pulled toward something against the will",
  graven: "a mark cut into flesh and holding", blessed: "light that chose someone",
  cursed: "a shadow that chose someone", burdened: "carrying too much",
  overloaded: "past what can be carried at all", wet: "soaked through",
  offBalance: "weight in the wrong place", marked: "singled out of a crowd",
  judged: "seen, and found wanting"
};

/* An item is a thing, so its motif comes from what KIND of thing it is. */
const TAG_MOTIF = {
  shield: "a shield, face on and slightly turned, its edge nicked from use",
  armor: "armour as worn metal and strap, not as a costume",
  consumable: "a vessel, and whatever is in it is nearly gone",
  natural: "grown rather than forged -- chitin, horn, tooth or claw, still part of a body",
  arcane: "an object that is doing something while nobody holds it",
  thrown: "an object mid-flight, the hand that threw it out of frame",
  ranged: "the weapon drawn and held at tension",
  heavy: "weight: the object sits, and the surface under it knows",
  light: "quickness: the object is balanced on almost nothing",
  melee: "an edge, worn and sharpened back more than once"
};

/*
 * An item that does nothing on a card still belongs to one of the seven bonus groups, and the
 * group is the most useful thing anybody knows about it: `Wonder` and `Tool` want different
 * pictures of the same ring. Without this every one of the 166 items got the same sentence.
 */
const GROUP_MOTIF = {
  body: "something worn against the skin, shaped by the body that wore it",
  training: "an object that means nothing except in trained hands",
  tool: "a tool worn exactly where a hand goes and nowhere else",
  make: "made well, by somebody who signed nothing",
  power: "an object with more inside it than its size allows",
  station: "a thing that says who somebody is before they speak",
  wonder: "an object behaving as though it were awake"
};

/**
 * Per-piece directions, which override the motif tables entirely.
 *
 * **A motif table flattens on purpose, and sometimes it flattens too far.** Eight cards in this
 * game are built on `defend`, so eight cards were being told to draw *a guard closing: shield,
 * forearm or shoulder set against something off-frame* -- and they are eight different ideas.
 * *Shield Up* is cover that lasts a round; *Hold the Line* is ground not being given up; *Set
 * Spear* is a shaft braced in the earth. Same verb, same sentence, eight identical pictures.
 *
 * Keyed by the piece's own path, so an override cannot drift onto the wrong card, and reported by
 * the collision audit at the bottom of this file, so the next cluster is found rather than
 * noticed. The audit is the point: this table is where it gets answered, one cluster at a time.
 */
const DIRECTION = {
  "cards/starter/shield-up":
    "a shield brought fully up and settled, the body behind it made small. This is cover meant to "
    + "last a while rather than a parry -- nothing in the frame is moving",
  "cards/common/hold-the-line":
    "boots planted on ground that is not being given up, guard high and the weapon still working. "
    + "The subject is the line under the feet, not the shield above them",
  "cards/strength/shield-wall":
    "shields locked edge to edge, more than one pair of hands in frame, the seam between two of "
    + "them dead centre",
  "cards/way/set-spear":
    "a spear butt driven into the ground and braced underfoot, the point levelled outward and "
    + "steady. Nobody is holding it up; the earth is",
  "signatures/strength/interpose":
    "the step across -- a body arriving in the path of a blow meant for somebody else, caught "
    + "between the two of them",

  /*
   * **Two cards whose names mean more than their steps do.**
   *
   * *Dig In* and *Second Wind* are the same two steps -- `Heal 2`, Spent -- and the motif table
   * can only say *a wound closing*, which is a picture of healing and not a picture of either
   * card. The names are the content here: one recovers by going to ground and the other by
   * getting back up, and no amount of reading the steps will recover that.
   */
  "cards/common/dig-in":
    "somebody going to ground instead of forward: down on one knee behind whatever cover there "
    + "is, a hand pressed hard against a wound, breath coming back. The recovery is in refusing "
    + "to advance, so nothing in the frame is moving",
  "cards/starter/second-wind":
    "a fighter back on their feet and finding the next breath -- chest working, head coming up, "
    + "the moment the body agrees to keep going",

  /*
   * **And two that are the same card.** `Strike +1 · / Move 1` for both; the only thing that
   * differs is the reaction line, Brace against Parry, which is not a picture. So the direction
   * has to come from the names, and the names are opposites: force against judgement.
   */
  "cards/starter/heavy-swing":
    "a swing with everything behind it, caught at the bottom of its arc -- the committed blow of "
    + "somebody who decided before they moved",
  "cards/common/measure":
    "a blow placed exactly, the point going into a gap the width of a hand. Precision rather than "
    + "force, and the opposite of a heavy swing",

  /*
   * --- all thirty-six intents, one direction each ---------------------------------------------
   *
   * **The intent pool is the one group that cannot be left to the motif tables at all.** Every
   * other group has something of its own in the subject line: an item has a name and a blurb, a
   * spell has a sentence somebody wrote. An intent has a verb and a number, and nineteen of the
   * thirty-six are built on `move` then `strike` -- so the tables said *ground covered; a blow
   * lands* nineteen times, and the pictures came back as near-copies of each other.
   *
   * The constraint block made that worse before it made it better: banning the species banned the
   * anatomy and the scale too, so the shared half of the picture grew and the distinguishing half
   * shrank. One generic actor plus one generic action is one picture.
   *
   * So each card is written by hand, and each is written about **the specific thing the actor is
   * not** -- the ground, the victim, the aftermath, the geometry. Those are drawable in full
   * (`EXTRA` above), they differ wildly from card to card, and none of them says what species is
   * holding the weapon.
   */
  "cards/npc/close-in":
    "the gap itself: a dark mass filling one side of the frame, a braced human boot at the other, "
    + "and between them a narrow strip of trodden ground with the mass's shadow already across "
    + "it. The subject is the strip, and there is less of it than there was",
  "cards/npc/strike-and-step":
    "one frame holding two moments: the dust of a blow still hanging in the air where something "
    + "was, and a dark shape already a clear pace beyond it. Hit, then gone, read left to right",
  "cards/npc/press":
    "the same blow arriving twice -- the first impact closing over the face of a human shield, "
    + "the second coming in behind it lower and plainly less ready. Nothing clever: twice",
  "cards/npc/lash-out":
    "a ring driven outward from one point: dust, a dropped human blade and a torn cloak all moving "
    + "away from the centre at once, nothing in the frame aimed at anything",
  "cards/npc/give-ground":
    "backward footing, drawn as the marks it leaves: two parallel furrows dragged through dirt "
    + "away from the fight, the weight of the frame behind rather than ahead",
  "cards/npc/set-and-wait":
    "absolute stillness held over an empty approach -- a guard up and unmoving, dust settled "
    + "rather than rising, the ground ahead undisturbed. The picture is the waiting, and the blow "
    + "has not come",
  "cards/npc/hold-the-line":
    "cover put somewhere else: a dark edge angled out across the human figure standing alongside "
    + "rather than over whatever is holding it, that figure's own guard lowered and resting",
  "cards/npc/gorge":
    "a feeding posture, low and entirely still, over something already down -- the ground beneath "
    + "it dark and wet, no blow anywhere in the frame. It has stopped fighting in order to do this",
  "cards/npc/thrash":
    "one full circle of motion: a blurred sweep running all the way around a single point, grit "
    + "and dust flung to the frame's edges, and the centre of it already empty",
  "cards/npc/knock-it-down":
    "the instant a human figure's heels leave the ground -- shield still up and useless, body "
    + "going backward and down, the ground rising into the bottom of the frame to meet it",
  "cards/npc/take-stock":
    "a round spent on itself: nothing attacking anywhere in frame, a haze lifting off and away "
    + "from a dark shape standing square, dust falling rather than rising",
  "cards/npc/pick-the-soft-one":
    "a blow arriving past a raised human shield instead of against it -- the guard still whole, "
    + "still high, facing the wrong way, and the strike already behind it and in",
  "cards/npc/spoil-the-ground":
    "one square of ground made wrong and nobody in frame at all: a thin broken crust, darkness "
    + "under the break, and careful marks around its edge where something worked and left",
  "cards/npc/loose":
    "a shot already gone: the launch surviving only as a line of disturbed air leaving the bottom "
    + "corner, and nothing yet arrived at the far end of it",
  "cards/npc/spray":
    "a wide cone thrown forward from the bottom edge of the frame, already wetting and darkening "
    + "the ground along its far rim. Aimed at an area and not at anybody",
  "cards/npc/long-arm":
    "reach without closing: one long dark limb crossing the whole frame from a single edge, the "
    + "body it belongs to out of frame and plainly staying there",
  "cards/npc/charge":
    "a straight line of ruined ground running from the far distance to the bottom edge, dust "
    + "still falling into it. The distance is the damage, so the distance is the subject",
  "cards/npc/bull-through":
    "a human figure shouldered aside mid-stride, off balance and out of the way, while whatever "
    + "did it has not changed direction by a hair",
  "cards/npc/bring-it-down":
    "a door failing at the hinge: split timber, dust blowing out through the gap, the daylight "
    + "wrong behind it. Whatever hit it is present only as the shape of the hole",
  "cards/npc/swarm":
    "too many at once: four or five dark edges converging on one small patch of ground from every "
    + "side of the frame, not one of them whole and not one of them the subject",
  "cards/npc/drag-down":
    "a human arm and shoulder being pulled downward out of frame, fingers still open, the ground "
    + "coming up to meet them. Something has hold and is not letting go",
  /*
   * **Refused by the moderation filter, at the OUTPUT stage, for self-harm and violence.**
   *
   * It read *a shallow mark on a human forearm with the skin going wrong around it* -- and a
   * shallow mark on a forearm is the single most recognisable self-harm image there is, so the
   * picture that came back tripped the filter even though the prompt never asked for anything of
   * the kind. The refusal was about the composition, not the subject: *Feed* asks for a mark at a
   * human throat in the next entry down and draws without complaint.
   *
   * So the wound moves off the forearm and stops being the subject at all. What this card is
   * about is not the cut, which is nothing: it is what travels away from it.
   */
  "cards/npc/envenom":
    "a hand that has stopped obeying: one small puncture at the knuckle, a dark line already "
    + "past the wrist and climbing, the fingers curling on their own. The wound is nothing -- "
    + "what is spreading out of it is the whole picture",
  "cards/npc/feed":
    "something taken out rather than put in: a mark at a human throat and a dry pallor spreading "
    + "from it, whatever is above it reading only as a stillness",
  "cards/npc/go-under":
    "a hole in the ground with the spoil fanned around its mouth and nothing in it. It was here, "
    + "and now it is beneath you",
  "cards/npc/submerge":
    "a closing ring on water: the wake still spreading outward, flat light across the surface, "
    + "and no shape at all beneath it",
  "cards/npc/stoop":
    "the view from underneath: a shadow dropping across lit ground, small at the frame's edges "
    + "and already huge at its centre, and nothing yet in frame to cast it",
  "cards/npc/fade":
    "the place something was standing, drawn as evidence: crushed grass, half a print, the air "
    + "slightly wrong above it. Absence as the subject",
  "cards/npc/lie-still":
    "something indistinguishable from the ground -- a dark mass under dust and leaf litter, its "
    + "outline deliberately broken, nothing in it reading as a face. Perfectly motionless",
  "cards/npc/order":
    "a gesture that moves somebody else: one limb extended and pointing out of frame, and far "
    + "away in the depth of the picture three small dark shapes already going that way",
  "cards/npc/call-more":
    "the edge of the scene filling up: shapes arriving along the far dark border of the frame, "
    + "indistinct, numerous, and nearer than they were",
  "cards/npc/work-the-weave":
    "the air around a raised limb going wrong -- light bending, grit lifting off the ground in a "
    + "slow curve. Nothing is being struck; something is being made",
  "cards/npc/carry":
    "one thing riding another: a smaller dark shape set high on a larger moving one, the two "
    + "reading as a single silhouette with two centres of weight",
  "cards/npc/shelter":
    "a dark bulk stood square to throw a shadow that a human figure is standing inside -- cover "
    + "from above and from far off, not from the thing in front",

  /*
   * The three cards one creature draws. These are the only intents whose art may show a
   * creature, and the exception is generated from `only` rather than written here, so a card that
   * stopped being exclusive could not keep the licence (see the entry loop below).
   */
  "cards/npc/the-hive-obeys":
    "an enormous rooted body that does not fight: seen from below and behind, one vast limb lifted "
    + "in a signal, and the whole floor between it and the far wall already in motion",
  "cards/npc/open-the-hold":
    "a gigantic sagging body splitting along the belly seam, and what was inside it coming out "
    + "onto the ground underneath -- more of it than the shape above could hold",
  "cards/npc/carry-it-off":
    "two small workers leaving with somebody: a human arm trailing between them, heels marking "
    + "the dirt, the pair of them already turned away toward the dark",

  /* -------------------------------------------- */

  /*
   * **The thirty-two the twin audit named, answered one at a time.**
   *
   * The suite measures how much of a prompt is shared with the prompt nearest it inside its own
   * group, where the capsule is byte-identical and the subject is therefore the entire
   * difference. Thirty-two pieces overlapped another by sixty per cent or more, which is the band
   * where nobody would defend the pair, and they fell in seven groups with one shape in common:
   * the subject was a NAME and a RULE, and rules are not pictures.
   *
   * These are not a motif table's fault. A motif table reads verbs and conditions, and
   * `might 2` has neither -- so it fell through to the group fallback, and twenty-five pieces
   * were handed *the quality itself as one human moment* and left to differ by their titles.
   */

  /*
   * **The ten natural weapons, which were the worst in the book at 89%-93%.**
   *
   * Every one of them said *an edge, worn and sharpened back more than once; grown rather than
   * forged*, so Claws, Mandibles, Nip and Sting were one picture of a claw four times over. The
   * content has what the tables could not reach: each is a different number on a different
   * creature -- Nip is a 1 on a scavenger and Tail Club is a 7 that ignores armour on a beetle
   * the size of a cart -- and the body part follows from that.
   */
  /*
   * The six the trolls and the undead brought with them. Without these they fall through to the
   * motif tables and three of them collide, which is the same failure the first ten naturals had.
   */
  "items/natural/troll-fists":
    "two hands the size of millstones hanging open at rest, the knuckles split and healed over "
    + "again into grey callus. Nothing is being held and nothing needs to be",
  "items/natural/thrown-stone":
    "a boulder in flight, turning, the hand that threw it already gone from the frame and the "
    + "shadow of it running ahead across the ground it is about to reach",
  "items/natural/draining-bite":
    "a mouth opened wider than a jaw should allow, two long teeth set well back and wet, and "
    + "nothing else of the face in frame",
  "items/natural/grave-cold-hands":
    "two hands that have been underground: nails grown long and split, the skin drawn tight and "
    + "dark over the bones, closing on nothing with far more grip than they ought to have",
  "items/npc/grave-candle":
    "a stub of candle burning low on a flat stone, the flame standing perfectly upright and "
    + "still in air that is plainly moving everything else",
  "items/npc/tarnkappe":
    "a small grey cap, shapeless and greasy with age, lying where it was dropped -- and the "
    + "patch of ground beneath it not quite as present as the ground around it",
  "items/natural/dragon-jaws":
    "a mouth that could take a horse, open and side-on, the teeth uneven and overlapping and the "
    + "gum line drawn back. Scale rather than chitin, and old -- several teeth broken off short",
  "items/natural/crushing-coils":
    "a thick loop of serpent body closed on something that is no longer the shape it was, the "
    + "head nowhere in the picture. Nothing is being bitten: the body is the weapon",
  "items/npc/elf-bolt":
    "a small knapped flint arrowhead lying in the palm of a human hand, far too old to belong to "
    + "anyone living. Nothing about it is moving, and the hand is holding it very still",
  "items/natural/nip":
    "a small mouth of needle teeth already closed on something and not letting go. The least "
    + "dangerous weapon in the game: too small to kill anybody, close enough that the grip fills "
    + "the frame",
  "items/natural/sting":
    "a segmented tail curled forward over its own back, the barb at the tip beaded and about to "
    + "fall. One point, in focus, and the length behind it falling away into wash",
  "items/natural/mandibles":
    "a pair of toothed jaws opened wide and scissoring sideways rather than biting down, the gap "
    + "between them the darkest thing in the picture",
  "items/natural/claws":
    "four hooked claws splayed at full reach, no two the same length, the tips worn pale where "
    + "they have been dragged across stone",
  "items/natural/grasping-claws":
    "a long jointed arm thrown out to full extension from a body mostly out of frame, the pincer "
    + "at the end of it closing on air at the far limit of its reach",
  "items/natural/heavy-mandibles":
    "jaws as thick as forearms, chipped and blunt rather than sharp, closing slowly on something "
    + "that has already stopped resisting",
  "items/natural/tusks":
    "two curved tusks worn smooth along their undersides by digging, swung upward from below with "
    + "soil still coming off them",
  "items/natural/tail-club":
    "a knot of fused bone at the end of a thick tail, caught at the top of its arc with the whole "
    + "body wound up behind it. Nothing it lands on is going to be helped by armour",
  "items/natural/acid-spray":
    "a soft vent opened in a hide and spitting a thin fan of liquid, and the stone it has already "
    + "crossed pitted and smoking",
  "items/natural/fire-spray":
    "a gout thrown wide from under a body, bright at the near edge and breaking into sparks at "
    + "the far one, covering more ground than anything else in this set",

  /* Both NPC foci read *an object doing something while nobody holds it*, which is the right
   * sentence for a focus and the same sentence for both. What they are is different. */
  "items/npc/dark-lantern":
    "a shuttered lantern with one slit open, throwing a single hard bar of light across a dark "
    + "room and lighting nothing else at all",
  "items/npc/goblin-fetish":
    "a bundle of knotted hair, bone and string hung from a bent stick, turning slowly on its own "
    + "with nobody within reach of it",

  /* The one pair in Items the audit flagged, and the one it was right to be unsure about: they
   * are supposed to be nearly the same object. The difference is what each is *for*. */
  "items/dagger":
    "a short blade coming out of a sleeve, most of it still hidden, only the last inch of edge "
    + "catching any light",
  "items/balanced-dagger":
    "a throwing knife standing upright on its point, balanced and perfectly still, the whole "
    + "weight of it resting on a spot smaller than a fingernail",

  /*
   * Two starter cards that are the same two steps in the other order -- `Strike · / Ready` and
   * `Ready · / Strike` -- so the motif table said the same two things twice and only the sequence
   * differed, which is not visible in a picture.
   */
  "cards/starter/draw-steel":
    "a blade coming free of the scabbard already moving forward: the draw and the cut are one "
    + "motion, and the empty scabbard is still swinging from it",
  "cards/starter/weapon-swap":
    "one weapon let go and falling while the other hand closes on the next. Both are in frame and "
    + "neither is being held",

  /* Two Wild Magic cards whose whole content is a sentence about resolution order. */
  "cards/wild/echo":
    "the same blow arriving twice: one figure, and a second identical shape half a pace behind "
    + "it, out of step by one heartbeat",
  "cards/wild/misfire":
    "a spell going off at the wrong end of the room -- the caster's hand still open and extended, "
    + "and the person standing beside them taking all of it",

  /*
   * **The five features and nine skill cards, which were twenty-five pieces on one sentence.**
   *
   * These have no verb, no condition and no object: a feature is a rule about the character and a
   * skill card is an attribute and a number. *The quality itself as one human moment* is a good
   * instruction and it is the same good instruction twenty-five times, so each one here names the
   * moment instead.
   */
  "features/alert":
    "a head already turned toward a sound nobody else has heard yet, the body still facing the "
    + "way it was going",
  "features/packhorse":
    "a back under a load that would stop anybody else, straps biting in, the stride not broken by "
    + "it",
  "features/quick":
    "two things done in the time for one: a hand finishing one motion while the body has already "
    + "committed to the next",
  "features/steady":
    "a face taking a hard blow without the eyes losing their focus. The head moves; the look does "
    + "not",
  "features/tough":
    "a body that has been opened and closed several times already, old seams showing, entirely "
    + "unbothered by the newest one",
  "cards/skill/heave":
    "a load shifting at last -- shoulder into it, feet skidding, the thing finally moving",
  "cards/skill/set-your-feet":
    "the instant before a pull rather than during it: weight dropped, heels dug, the line gone "
    + "tight and nothing moving yet",
  "cards/skill/quick-hands":
    "fingers working a catch or a knot faster than an eye follows, the other hand already started "
    + "on what comes after",
  "cards/skill/keep-your-footing":
    "a body gone past the angle at which it should fall, and not falling: one foot has found the "
    + "only solid thing left",
  "cards/skill/out-of-the-light":
    "somebody stepping backwards out of a lit place into one that is not, more than half of them "
    + "already gone",
  "cards/skill/sharp-eyes":
    "a look held one second longer than anybody else's, on the single thing in the room that is "
    + "wrong",
  "cards/skill/soldiers-learning":
    "a hand reading something by touch that it has handled a thousand times before. Recognition, "
    + "not study",
  "cards/skill/the-loud-voice":
    "a shout thrown across a space with the whole chest behind it, and every head in frame "
    + "already turning toward it",
  "cards/skill/inspiration":
    "the moment a face changes because the person has just thought of the thing. Nothing in the "
    + "hands; all of it in the eyes"
};

/** The one place a missing motif becomes visible instead of becoming silence. */
const gaps = [];
function motif(table, key, kind) {
  const m = table[key];
  if (m) return m;
  gaps.push(`${kind} \`${key}\``);
  return `[GAP] no motif written for ${kind} \`${key}\``;
}

/**
 * The steps a picture should be drawn from.
 *
 * **A bare `Move` on the secondary half is left out, and anything else on it is kept.**
 *
 * Taking the whole secondary put *ground covered -- weight forward* on roughly seven cards in ten,
 * because that is how many carry `Move 1` down there, and it drowned what each card was about.
 * Taking none of it was the other error: *Strike*, *Draw Steel*, *Off-Hand Blow* and *Shoulder
 * Check* all have a bare `Strike` on top and differ ONLY below it -- draw the weapon, hit twice,
 * knock them off balance -- so dropping the half dropped the whole card.
 */
function stepsOf(entry) {
  const secondary = (entry.secondary ?? []).filter(s => !(s.verb === "move" && !s.condition));
  return [
    ...(entry.primary ?? []), ...secondary, ...(entry.sequence ?? []),
    ...(entry.steps ?? []), ...(entry.effect ? [entry.effect] : []),
    ...(entry.active?.steps ?? [])
  ];
}

/**
 * What a step says about itself beyond its verb.
 *
 * **This is where twenty-eight Strike cards stopped being one picture.** The motif table read
 * `verb` and nothing else, so `{strike}`, `{strike, mod: 2, bothHands}` and
 * `{strike, range: 3, requires: light}` were all *the instant a blow lands* -- when the content
 * had already said, in fields, that one is a two-handed commitment and another is a knife thrown
 * from three squares. The qualifiers were in the data the whole time; nothing was reading them.
 */
function qualify(step) {
  const q = [];
  if (step.mod >= 2) q.push("thrown with the whole body, nothing held back");
  else if (step.mod === 1) q.push("the one that found its moment");
  else if (step.mod < 0) q.push("the weaker follow-up, off the hand that was not busy");

  if (step.requires?.bothHands) q.push("both hands on the haft");
  if (step.requires?.tag === "ranged") q.push("loosed from a bow or a barrel, the target well off");
  if (step.requires?.tag === "light") q.push("a short blade, held close and low");

  if (step.range) q.push(`landing ${step.range} squares from the one who threw it`);
  if (step.areaKind === "blast") q.push("reaching everything around at once");
  if (step.areaKind === "aimed") q.push("one line only, from eye to target");
  if (step.ignores) q.push("going through the armour rather than round it");
  if (step.ignoresArmour) q.push("going through whatever it is wearing as if it were not there");
  if (step.ignoresBlock) q.push("going round the shield rather than through it");
  if (step.when?.ignoresArmour) q.push("finding the gap the Mark opened, through the plate");
  if (step.when?.ignoresBlock) q.push("going round a raised shield, through the opening");

  /*
   * Named before it is pictured. A condition motif is a noun phrase, and *against something
   * already weight in the wrong place* is what you get by splicing one into a sentence -- so the
   * printed condition name carries the grammar and the motif follows it as a gloss.
   */
  if (step.when?.needs) {
    const named = conditionName(step.when.needs);
    const picture = CONDITION_MOTIF[step.when.needs];
    q.push(`against a target already ${named}${picture ? ` -- ${picture}` : ""}`);
  }
  return q;
}

/**
 * The motif clauses for one piece: what it does, said as pictures.
 *
 * Capped at three. A prompt carrying six motifs is a prompt asking for six subjects, and the
 * composition rule above asks for one -- so the cap is not tidiness, it is the rule being kept.
 */
function motifsFor(entry, group) {
  const out = [];
  const steps = stepsOf(entry);

  /* Per STEP rather than per verb, so a card's two Strikes can be two different Strikes. */
  const seen = new Set();
  for (const step of steps) {
    const isVerb = !!CARDRPG.verbs[step.verb];
    const table = isVerb ? VERB_MOTIF : CARDRPG.effects[step.verb] ? EFFECT_MOTIF : null;
    if (!table) continue;
    const kind = isVerb ? "verb" : "effect";
    const qs = qualify(step);
    const stem = (isVerb ? VERB_STEM : EFFECT_STEM)[step.verb];
    /*
     * A card with two Strikes on it said *a blow lands* twice. The second one is not a second
     * picture, it is the same picture qualified -- so once a verb has been drawn, later steps
     * carry only what makes them different.
     */
    if (seen.has(step.verb) && qs.length) out.push(`then ${qs.join(", ")}`);
    else out.push(qs.length && stem ? [stem, ...qs].join(", ") : motif(table, step.verb, kind));
    seen.add(step.verb);
  }
  for (const key of new Set(steps.map(s => s.condition).filter(Boolean))) {
    out.push(motif(CONDITION_MOTIF, key, "condition"));
  }
  /* An item has no steps worth speaking of; what it IS carries the picture. */
  if (!out.length && entry.tags?.length) {
    for (const tag of entry.tags) if (TAG_MOTIF[tag]) out.push(TAG_MOTIF[tag]);
  }
  if (!out.length && entry.group) out.push(motif(GROUP_MOTIF, entry.group, "bonus group"));
  /*
   * The last resort, and it has to know what kind of thing it is looking at. An item with nothing
   * else to say is an object; a feature with nothing else to say is a QUALITY -- *Tough*,
   * *Alert*, *Nothing Gets Through* -- and asking for "the thing itself, lit from one side" got
   * twenty-eight prompts asking for a photograph of a character trait.
   */
  if (!out.length && group.kind !== "token" && !flavourOf(entry)) {
    out.push(group.dir.startsWith("items")
      ? "the thing itself, lit from one side, nothing holding it and nothing behind it"
      : "the quality itself as one human moment -- the person it describes, caught in the second "
        + "that proves it. No object held up, no symbol, no emblem");
  }
  return [...new Set(out)].slice(0, 3);
}

/**
 * The piece's own prose, which `brief()` does not print.
 *
 * Seventy-six spells have an effect made of nothing but a sentence -- *take your whole turn
 * again, now* -- so there is no verb and no condition for a motif table to catch, and they were
 * all getting the same fallback. They were never short of direction: `description` was sitting
 * there carrying *your own blood, thrown; it goes round a shield rather than through it*, which
 * is better art direction than anything a motif table is going to say.
 *
 * `brief()` is left alone deliberately. Teaching it about `description` would rewrite the art
 * list too, and the brief is a catalogue of what exists while this is a book of instructions.
 */
function flavourOf(entry) {
  return String(entry.description ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------------------------------- */
/*  What each group is for, as a picture         */
/* -------------------------------------------- */

const FRAME = {
  "cards/starter": "The first ten cards a table ever sees. Plain, legible, no cleverness.",
  "cards/common": "Every character in the game draws this one, so it belongs to nobody in "
    + "particular: no Way's colour, no named hero, no signature weapon.",
  "cards/npc": "Face-up on the table during a fight, and seen behind a goblin, a troll and a "
    + "dragon alike. Draw the **shape of the move**, never a portrait of who is making it: "
    + "*Close In* is a thing closing in.",
  "cards/shade": "A Way of Shade card: low light, cover, and the moment before being noticed.",
  "cards/strength": "A Way of Strength card: mass, leverage, and weight already moving.",
  "cards/way": "Written for the reach weapons and shared between Ways, so no Way's colour.",
  "cards/skill": "Played out of combat, in a scene rather than a fight. Hands, tools and "
    + "attention -- no weapons drawn.",
  "cards/wild": "Drawn on a Wild, so it is a surprise and should look like one: the composition "
    + "may break the calm the rest of the set keeps.",
  "signatures/shade": "A title's defining card, and what its node wears in the levelling graph. "
    + "Grander than a pool card: this is what a player was aiming at.",
  "signatures/strength": "A title's defining card, and what its node wears in the levelling "
    + "graph. Grander than a pool card: this is what a player was aiming at.",
  "signatures/mind": "A title's defining card, and what its node wears in the levelling graph. "
    + "Grander than a pool card: this is what a player was aiming at.",
  "signatures/faith": "A god's first and defining miracle. Grander than a pool card, and the "
    + "light in it comes from outside the frame.",
  "spells/elemental": "A formula: the oldest magic in the game, and the most physical.",
  "spells/shadow": "A shadow formula, paid for with a permanent Wild card. Something is being "
    + "given up in the picture.",
  "spells/mind": "Blood magic and spiritualism: the working, not the worker.",
  "spells/faith": "A lesser miracle. Quiet, domestic in scale, and the light comes from outside "
    + "the frame.",
  features: "Always on, so this picture sits on a character's sheet for their whole life. A "
    + "quality rather than an action.",
  items: "An object, drawn as a plate from a catalogue of things: one item, one light, no hand.",
  "items/npc": "A monster's kit -- cruder than a player's, made or scavenged rather than bought.",
  "items/natural": "Grown rather than carried: a mandible, a sting, a tail club. It cannot be "
    + "disarmed because it is part of a body, and the picture should make that obvious.",
  tokens: "One picture per creature, used as both the sheet portrait and the map token."
};

/* -------------------------------------------- */
/*  Writing it out                               */
/* -------------------------------------------- */

const lines = [];
const push = (...rows) => lines.push(...rows);

/**
 * Every piece as it was written: the collision audit below reads it, and so does the
 * generator, which sends the same capsule and the same subject the book prints.
 */
export const ledger = [];

/** Kind to creature name, for the three cards that belong to a creature rather than a capability. */
const CREATURE_NAME = new Map(CREATURES.map(c => [c.system?.kind, c.name]));

let total = backs.length;
for (const group of GROUPS) total += group.list.length;

push(
  "# Art prompts",
  "",
  `**${total} prompts**, one per piece in [the art list](art-list.md), in the style the `
  + "six-flavour test picked: **brush and ink wash**. Generated from the game's own content by "
  + "`cardrpg/test/art-prompts.mjs` — regenerate it rather than editing it.",
  "",
  "It walks the same `GROUPS` the art list walks, by importing it rather than copying it, so the "
  + "two files cannot disagree about what exists.",
  "",
  "## How to use this",
  "",
  "1. Open a **new chat**. Paste the group's **style capsule** first, on its own, and let it be "
  + "acknowledged.",
  "2. Then paste subjects from that group, **one message each**.",
  "3. Start a fresh chat every **20 or so**, and re-paste the capsule. Style drifts along a long "
  + "conversation, and a fresh chat is free.",
  "4. Save each result under the **File** given with it. The path is what wires the picture into "
  + "the game.",
  "",
  "**Do not mix groups in one chat.** The capsules differ — a token's capsule asks for "
  + "transparency and a back's asks for no safe area — and a chat that has seen two of them will "
  + "blend them.",
  "",
  "> **Why the subjects are short.** The capsule carries the style, the format, the palette and "
  + "the composition rule, and it is identical for every piece in a group. A subject that "
  + "restated any of that would be a second statement of it, free to drift. The subject says what "
  + "the picture is **of** and nothing else.",
  "",
  "## What the composition rule is, and why it reads like that",
  "",
  "The first six-flavour test said *keep the focal point at about 30% of the height*, and got six "
  + "full standing figures with their heads above the panel line — because a full figure is what "
  + "anyone draws from that sentence. It is written as a **crop** in the capsules below, which is "
  + "an instruction an image model can actually follow.",
  "",
  "The numbers are measured, not guessed, and they are the **worst case across the whole set**: a "
  + "card is drawn as small as 128px, and the wordiest card in the game wraps its primary half to "
  + "four lines, which pulls the clear window down to 13%–43%.",
  "",
  "**And then the crop wording got the crop and lost the height.** The first real batch of "
  + "seventeen faces put dark mass inside the top 13% fifteen times — helmets, in the band where "
  + "the card prints its own name — and sixteen of the seventeen had the centre of their ink "
  + "below 43%, median 57%. The rule asked for 28% and got 57%.",
  "",
  "So the numbers are gone from the capsules and the picture is in their place: **the top quarter "
  + "is empty, the bottom half is scenery.** A percentage is not something a model can act on; an "
  + "empty quarter is. The same sentence also buys back the light — that quarter has to be bare "
  + "paper for the crop to work, and fourteen of the first twenty-two had no bare paper anywhere.",
  ""
);

/* -------------------------------------------- */

/* Counted rather than written: it said "six pictures against 495 faces" long after it was five
 * against five hundred and three, which is the ordinary fate of a number typed into prose. */
push("## Deck backs", "", `**Draw these first.** ${backs.length} pictures against `
  + `${total - backs.length} faces, and they are what a table looks at all evening, since a deck `
  + "is face down from the first second of play.",
  "", "### The capsule — paste this once", "", "```text", BACK_CAPSULE, "```", "");

for (const [key, back] of backs) {
  const subject = [
    `SUBJECT. A deck back for **${back.label}**. ${back.note}`,
    "",
    /* Derived, because "the other five" went on saying five after a back was retired. */
    "A design rather than a scene: one central device, near-symmetrical, legible upside down, and "
      + `unmistakable beside the other ${backs.length - 1} in this set.`
  ].join("\n");
  /* Backs go on the ledger too. They were left off it when it only fed the collision audit --
   * five pictures that share nothing cannot collide -- and the generator needs every piece. */
  ledger.push({ key: `backs/${slug(key.replace(/\./g, "-"))}`, name: back.label,
    group: "Deck backs", direction: "", flavour: false, prose: true, overridden: false,
    token: false, back: true, capsule: BACK_CAPSULE, subject,
    file: `backs/${slug(key.replace(/\./g, "-"))}.${DELIVERY.format}`, size: "1024x1536" });
  push(`#### ${back.label}`, "",
    `File: \`backs/${slug(key.replace(/\./g, "-"))}.${DELIVERY.format}\``, "",
    "```text", subject, "```", "");
}

/* -------------------------------------------- */

for (const group of GROUPS) {
  if (!group.list?.length) continue;
  const describe = group.brief ?? brief;
  const token = group.kind === "token";
  const capsule = token ? TOKEN_CAPSULE : faceCapsule(group.dir);

  push(
    `## ${group.title}`,
    "",
    `**${group.list.length} prompt${group.list.length === 1 ? "" : "s"}.** `
    + `${token ? "**1:1, 1024 × 1024, transparent.** " : "**2:3, 1024 × 1536.** "}`
    + `Files go under \`cardrpg/art/${group.dir}/\`.`,
    "",
    FRAME[group.dir] ?? "",
    "",
    "<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>",
    "",
    "```text", capsule, "```", "", "</details>", ""
  );

  for (const entry of [...group.list].sort((a, b) => a.name.localeCompare(b.name))) {
    const what = describe(entry) || "";
    const flavour = flavourOf(entry);
    const key = `${group.dir}/${slug(entry.name)}`;
    const ms = motifsFor(entry, group);
    /* The piece's own sentence outranks a motif table: it was written about this one thing. */
    const direction = token
      ? "The whole creature, three-quarter from above, filling the square on full transparency."
      : DIRECTION[key] ? `Draw ${DIRECTION[key]}.`
        : ms.length ? `Draw ${ms.join("; ")}.`
          : "Draw that line literally: the one moment it describes, and nothing else in frame.";
    /*
     * Does the SUBJECT carry prose, or only mechanics? `Strike · / Move 1` tells an artist
     * nothing the next card does not; `Consumable · Charcoal, milk thistle and something the
     * brewer will not name` tells them everything. Five lowercase words in a row is a crude test
     * and a reliable one, and it is what sorts a real duplicate from a shared motif that the
     * subject already pulls apart.
     */
    const prose = /[a-z]{3,}(?:[\s,'-]+[a-z]{2,}){4,}/.test(what);
    /*
     * **The licence to draw a creature, derived from the card rather than written on it.**
     *
     * The intent capsule forbids species, anatomy and scale because one picture serves a goblin
     * and a dragon. A card with `only` is drawn by one creature and no other, so none of that
     * applies to it -- and saying so here, off the same field the engine builds the deck from,
     * means a card that stopped being exclusive could not keep the exemption.
     */
    const exclusive = (entry.only ?? []).map(kind => {
      const creature = CREATURE_NAME.get(kind);
      if (!creature) throw new Error(`${key} is only for \`${kind}\`, which is not a creature`);
      return creature;
    });
    /*
     * **The subject is built once and used twice**: printed into the book, and carried on the
     * ledger for the generator to send. Two spellings of this would be two prompts, and the
     * second would drift from the first in exactly the way nobody notices -- the book would
     * describe one picture and the pipeline would buy another.
     */
    const subject = [
      `SUBJECT. "${entry.name}"${what ? ` — ${what}` : ""}`,
      ...(flavour ? ["", flavour] : []),
      ...(exclusive.length
        ? ["", `THIS CARD IS THE EXCEPTION. Only ${exclusive.join(" and ")} ever draws it, so `
          + "draw that creature: the capsule's rules about species, anatomy and scale do not "
          + "apply here, and this picture should be unmistakably of one thing."]
        : []),
      "",
      direction
    ].join("\n");
    ledger.push({ key, name: entry.name, group: group.title, direction, flavour: !!flavour,
      prose, overridden: !!DIRECTION[key], token, capsule, subject,
      file: `${group.dir}/${slug(entry.name)}.${DELIVERY.format}`,
      size: token ? "1024x1024" : "1024x1536" });
    push(
      `### ${entry.name}`,
      "",
      `File: \`${group.dir}/${slug(entry.name)}.${DELIVERY.format}\``,
      "",
      "```text",
      subject,
      "```",
      ""
    );
  }
}

/* -------------------------------------------- */

/*
 * **The collision audit, which is the thing that found this rather than an eye.**
 *
 * *Hold the Line is too similar to Shield Up* is true, and it was spotted by reading the book. It
 * is also one of thirty-odd clusters, so spotting them by reading is a plan that works until the
 * reader gets bored. This is the same sentence as a rule: a prompt reads as a duplicate when its
 * direction is shared AND it has no prose of its own to tell it apart.
 *
 * A shared direction on its own is fine and intended -- forty-three poisons all say *a vessel,
 * and whatever is in it is nearly gone*, and each has its own sentence above it saying what is in
 * the vessel. Tokens are excluded for the same reason from the other end: all forty-seven share
 * one direction on purpose, and the creature's own statblock is what differs.
 */
const thin = ledger.filter(p => !p.flavour && !p.token);
const clusters = [...thin.reduce((m, p) => {
  (m.get(p.direction) ?? m.set(p.direction, []).get(p.direction)).push(p);
  return m;
}, new Map())].filter(([, v]) => v.length > 1);

/*
 * **Ordered by how little is left to tell them apart**, not by size.
 *
 * The widest cluster is forty-three consumables all told to draw a nearly-empty vessel, and that
 * one is fine: every subject above it names its own item and its own blurb, so forty-three
 * different pictures come back. The cluster that bites is the one where the subject is `Strike ·
 * / Move 1` and the direction is shared -- nothing in either half distinguishes the card.
 */
const bare = members => members.filter(p => !p.prose).length;
clusters.sort((a, b) => bare(b[1]) - bare(a[1]) || b[1].length - a[1].length);

const shared = clusters.reduce((n, [, v]) => n + v.length, 0);
const biting = clusters.filter(([, v]) => bare(v) > 1);

push(
  "## Where prompts still repeat",
  "",
  `**${shared} prompts in ${clusters.length} clusters** share a direction with another piece. `
  + "That is a motif table working as designed — it is what makes every Strike card read as a "
  + "Strike — right up until it flattens two cards that mean different things.",
  "",
  `**${biting.length} of those clusters are the ones that bite**, listed first: the ones where `
  + "the subject line carries no prose either, so neither half of the prompt tells the cards "
  + "apart. The rest share a direction over subjects that already differ — forty-three "
  + "consumables drawing a nearly-empty vessel still come back as forty-three different "
  + "pictures, because each subject names its own.",
  "",
  "Answer a cluster by adding its keys to `DIRECTION` in `test/art-prompts.mjs` and "
  + "regenerating. The row shrinks or disappears when it is done.",
  "",
  "| Pieces | Bare | They share | Keys |",
  "|---|---|---|---|"
);
for (const [direction, members] of clusters) {
  const keys = members.map(p => `\`${p.key}\``);
  push(`| **${members.length}** | ${bare(members) || "—"} `
    + `| ${direction.replace(/^Draw /, "").replace(/\.$/, "")} `
    + `| ${keys.slice(0, 5).join(" ")}${keys.length > 5 ? ` …+${keys.length - 5}` : ""} |`);
}
push("");

if (gaps.length) {
  const seen = [...new Set(gaps)].sort();
  push("## Gaps", "",
    `**${seen.length} piece${seen.length === 1 ? "" : "s"} of the game's vocabulary have no `
    + "motif**, so the prompts that use them carry a `[GAP]` marker instead of a picture. Write "
    + "one in `test/art-prompts.mjs` and regenerate.", "",
    ...seen.map(g => `- ${g}`), "");
}

if (process.argv[1] && process.argv[1].endsWith("art-prompts.mjs")) {
  fs.writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${total} prompts`
    + `${gaps.length ? `, ${new Set(gaps).size} vocabulary gaps` : ", no gaps"}`);
  console.log(`  ${ledger.filter(p => p.overridden).length} directions written by hand`);
  console.log(`  ${shared} prompts in ${clusters.length} clusters share a direction,`
    + ` ${biting.length} of them with nothing in the subject to tell them apart either`);
  for (const [direction, members] of biting.slice(0, 4)) {
    console.log(`    ${String(bare(members)).padStart(3)} bare of ${String(members.length).padEnd(3)}`
      + ` ${direction.slice(5, 64)}`);
  }
}
