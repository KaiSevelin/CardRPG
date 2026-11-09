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
 * purpose: six verbs, seventeen effects, twenty-four conditions. A vocabulary with no motif prints
 * `[GAP]` into the file rather than falling through silently, because a missing motif is a
 * picture nobody thought about and should look like one.
 */

import fs from "node:fs";
import path from "node:path";
import { CARDRPG } from "../module/config.mjs";
import * as content from "../module/content.mjs";
import {
  CREATURES, DELIVERY, GROUPS, backs, brief, castLine, conditionName, creatureBrief, slug
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

/*
 * **The accent said two things, and the bigger one won.**
 *
 * *Use it on the one thing the picture is about, and nowhere else* is the rule. *Deepening to
 * `fill` in the darkest wash* was written one clause earlier and quietly cancelled it: a wash is
 * a large area by definition, so the accent was licensed across the biggest region in the
 * picture. For the Way of Strength that is invisible, because its accent is a warm brick red at
 * 7 degrees and the gate's palette band runs to 60. For the other three it is fatal -- Shade is
 * blue at 215, Mind green at 160, Faith violet at 259, and `GATE.maxCool` rejects any saturated
 * pixel from 60 to 340 at more than 1% of the frame.
 *
 * Faith is where it showed, because its own blurb adds *the light in it comes from outside the
 * frame*: an accent licensed in the wash, plus a light to put it in, is a violet-lit picture.
 * Measured over the five pieces that would not pass: 2.1% to 5.5% off-palette, spread across
 * 270-340 degrees. Not a tight accent at 259 -- a violet-to-magenta wash.
 *
 * **The gate is not the thing to move here, and that was measured before it was argued.** The
 * band was recomputed at 0-80 and 0-100, and with a thirty-degree exemption around each group's
 * own assigned accent on top: 5 pieces over the ceiling became 5, then 4, then 3. The hue is not
 * sitting where an exemption would catch it. Meanwhile all ninety-nine cards clear the band as it
 * stands, worst case 0.92%.
 *
 * So the accent keeps its one object and loses the wash. The wash and the light are the warm
 * neutral in every group, which is what `WASH` already describes and what the strength and shade
 * pieces were doing all along.
 */
/*
 * **Which groups get a person assigned to them, and why the list is this short.**
 *
 * The token capsule binds a named sex, ancestry and age because something out in `art-list.mjs`
 * assigns one per creature. A card's capsule instead LISTS the ancestries of the city and names
 * the pale default as a failure -- which is a distribution demanded of one request that cannot
 * see the other five hundred. Every card obediently steered away from the default, so westerners
 * nearly left the set: a correction overshooting, and the same flatness wearing a different face.
 *
 * - **cards/npc is excluded, and that is not an oversight.** Its own capsule says the actor is
 *   nobody, because one picture serves a goblin, a troll and a dragon. Casting the actor would
 *   contradict the group's first rule. The far side of those cards is a player character drawn in
 *   full, but which half of the frame a cast line would land on is not something this can know.
 * - **items and spells are excluded** because they are objects and workings: *one item, one
 *   light, no hand*, and *the working, not the worker*.
 * - A card drawn as a single creature's exception is excluded too -- it has a creature, and the
 *   creature already carries its own casting.
 *
 * The line is written conditionally, because plenty of these crops are a pair of feet or a jaw
 * and a cast on a boot is noise. A condition the artist can evaluate costs nothing when it is
 * false, where an unconditional one invites a face into a frame that did not want one.
 */
const CAST_GROUP = /^(?:cards\/(?!npc\b)|signatures\/|features$)/;

function accentFor(dir) {
  const way = WAY_OF_DIR[dir];
  /*
   * **No fraction here, and that is deliberate twice over.**
   *
   * `GATE.maxCool` is one per cent, so an instruction naming a hundredth would aim the model at
   * the ceiling it is measured against -- the identical mistake the top strip made, where asking
   * for the floor exactly meant failing it half the time. And this file's own first lesson is
   * that a percentage is not an instruction at all: *the top quarter is empty* is followable
   * where *28% of the height* is not. So the bound is three objects a reader can picture.
   */
  const bound = "  **The accent is one small object's worth of colour and no more** -- a single\n"
    + "  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never\n"
    + "  the ground, never the sky, never a glow and never a whole figure: those are all the warm\n"
    + "  neutral of the paper and the ink.";
  if (!way) {
    return `- One chromatic accent only: **${WAY.strength.edge}**, a warm brick red. Use it on the\n`
      + "  one thing the picture is about, and nowhere else.\n" + bound;
  }
  const label = `Way of ${way[0].toUpperCase()}${way.slice(1)}`;
  return `- This group is the **${label}**, so its one chromatic accent is **${WAY[way].edge}**.\n`
    + "  Use it on the one thing the picture is about, and nowhere else. No other hue appears.\n"
    + bound;
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
  /*
   * A ritual twist is the only card in the game drawn from the GM's side with an audience, and
   * what it has to show is **the thing being undone pushing back**. Not a monster and not a
   * spell going off: a working that has turned, in a room where people have been at it for days.
   */
  /*
   * An intruder is the only card a player does not want, which makes it the one they look at
   * hardest. What it must NOT be is an attack: nothing here is being done to you in the picture,
   * because by the time the card is in your hand it has already happened and what is left is
   * carrying it.
   */
  "cards/harm": "what is left after the thing happened, carried rather than suffered",
  "cards/ritual": "the moment a long patient job turns on the people doing it, in a room that "
    + "has been lived in for days",
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
/*
 * **The fifth version asked for a sixth instead of a tenth, and it is reverted. Do not retry it.**
 *
 * The reasoning was that the capsule asked for "about a tenth" while `GATE.quietTop` rejects
 * under a tenth, so the instruction aimed the model at the threshold -- and a target sitting on a
 * floor should fail about half the time by arithmetic. The evidence offered was the survivors:
 * first ink at a median of 13.0%, a tenth percentile of 10.7%, a minimum of 8.3%, and thirty-four
 * of ninety-nine within a fifth of the line.
 *
 * **That evidence could not support the claim, because survivors cannot say what killed the
 * dead.** A tight distribution sitting just above a floor is equally the signature of a rule
 * being obeyed precisely, and that is what it was: 97 of those 99 cards passed, and the next
 * group went 26 for 26 under the same wording. The rule was never the one rejecting anything.
 *
 * Asked for a sixth, twenty-five signatures came back and ELEVEN failed. Same group, same gate,
 * split on the commit:
 *
 * | asked for | n | pass | quietTop | over the cool ceiling | inWindow median | under its floor |
 * |---|---|---|---|---|---|---|
 * | a tenth | 26 | 26 | 11.7% | 0 | 67.1% | 0 |
 * | a sixth | 25 | 14 | 23.4% | 10 | 45.7% | 3 |
 *
 * Two things went wrong, and the first caused the second. **The model overshoots this ask by
 * about 1.4x** -- told a tenth it drew 11.7%, told a sixth it drew 23.4% -- so a sixth lands at
 * very nearly a quarter. And the clear window ENDS at 43%, so a strip reaching 23% leaves the
 * drawing 23%-43% to live in instead of 13%-43%: a third of the window gone, `inWindow` down from
 * 67.1% to 45.7%, three pieces through the floor. The palette went with it, ten of twenty-five
 * over a ceiling that had never once been touched in a hundred and twenty-five pieces -- a
 * subject squeezed into a smaller box comes back with more colour in it.
 *
 * The lesson is about the gate's floors, not about this strip: **`quietTop` and `inWindow` are
 * one constraint from opposite ends.** The top strip cannot be widened without taking the room
 * `inWindow` needs, so neither number can be argued about alone.
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
  Every hue in the picture is between red and amber${dir.startsWith("items") ? "" : " -- **and that includes the ground.**"} Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.${
  dir.startsWith("items")
    ? `
- **The one exemption in this palette: the object's own material keeps its true colour.** A gold
  ring is gold-coloured, a silver ring is silver, steel is steel, copper is copper, brass is
  brass and glass is glass. A silver ring rendered in brown ink is a brown ring, and the subject
  of these pictures is the object -- so the metal is the one thing the sepia does not own.
- **It covers the OBJECT and nothing else.** The ground it sits on, the shadow it throws and the
  light falling across it stay the warm wash, exactly as everywhere else in the set. One lit
  object in true material against warm paper, not a coloured picture.
- **Silver, steel and pewter are near-white, not blue and not grey-blue** -- a bright metal is a
  VALUE and a set of reflections rather than a hue, which is how it is drawn here. Gold, brass,
  copper and bronze are already inside the warm range and need no special handling.`
    : ""}

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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
- **One creature, and one only.** Not a pair, not a group, not a smaller one at its feet for
  scale, no mount, no attendant, no victim, no bystander, no second head and no second figure
  anywhere in the square. A token is placed on one square of a map and moved as one thing. The
  single exception is a creature whose own description says in words that it is a crowd.
- **Nothing in the square but the creature and what it is holding.** No cargo, no crates, no
  furniture, no wall, no doorway, no scenery and no ground -- those belong to the map underneath.
- **The anatomy has to close.** Count the limbs against the description and draw exactly that
  many: four legs on a quadruped, two on a biped, one tail and not two. A tail, a wing or a neck
  grows out of the body in one unbroken line and is part of it -- never a separate shape floating
  near the place it should join.
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

PEOPLE.
- **Where the creature is a person, the description says which person**, and it is binding: the
  sex, the ancestry and the age given at the end of the subject are not a suggestion and not a
  default to fall back from. Draw that person.
- Where it does not say, do not reach for the same figure twice. These are the inhabitants of a
  port city on a trade road and they look like it.

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
  forestall: "the plan taken back", sift: "the one looked at and let fall",
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
  forestall: "a motion broken off half-made, and begun again as a different one",
  sift: "a hand turning one thing over and letting it drop",
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
 * **`kind` was on all 150 items and nothing in the art pipeline ever read it.**
 *
 * The motif table reads `tags` first and `group` second. 89 items have tags and 74 have a group;
 * every single one has a `kind`, and it is finer than either. The cost of not reading it was one
 * cluster of forty-three prompts all told to draw *a vessel, and whatever is in it is nearly
 * gone* -- which `kind` splits into Potion 18, Ammunition 13, Consumable 8 and Poison 7, four
 * genuinely different pictures. **And one of the four was simply wrong**: thirteen pieces of
 * ammunition were being told to draw a half-empty bottle, which is how Net Bolt and Thunder Shot
 * came to sit in the potion cluster.
 *
 * `Wonder` is the exception and gets no sentence here, because forty-three of the hundred and
 * fifty are Wonders and one sentence for forty-three pieces is the problem rather than the fix.
 * It is answered by `slot` below.
 */
/*
 * **Ten words each, like every other row in these tables, and the first draft ran to thirty.**
 *
 * A motif is SHARED text, so its length is a cost paid by every piece that shares it. An item's
 * own distinguishing prose is its blurb, and a blurb is eight words -- *charcoal, milk thistle
 * and something the brewer will not name*. Thirty words of shared direction over eight words of
 * unique blurb is 80% overlap by arithmetic, and the twin audit read it exactly that way: the
 * first draft of this table drove 39 items over the line while making them more different.
 *
 * Every row in `TAG_MOTIF` and `GROUP_MOTIF` is eight to twelve words. That was not a style
 * choice, it is the budget.
 */
const KIND_MOTIF = {
  Potion: "a glass vial, stoppered, with less in it than there was",
  Poison: "a small dark bottle, labelled, a residue dried at the lip",
  Consumable: "used up in the open: cloth, wax or powder, half gone",
  Ammunition: "one round out of the bundle, its point drawn sharply",
  /*
   * **Weapon, Armor and Shield are deliberately absent, and the first draft had all three.**
   *
   * Reading `kind` first is right where the kind is finer than the tags. For these three it is
   * coarser: twenty weapons carry `melee`, `ranged`, `heavy`, `light` and `thrown` between them,
   * and a single `Weapon` sentence put all twenty-three under one direction -- a 23-piece cluster
   * where there had been none, the exact fault this table was written to fix. Armor and Shield
   * would only have repeated what `TAG_MOTIF` already says in the same words.
   *
   * So they fall through to the tags, which is the finer table for them. Most specific wins is
   * the rule; which table is most specific depends on the row.
   */
  Tool: "a tool worn exactly where a hand goes and nowhere else",
  Make: "made well, by somebody who signed nothing",
  Power: "an object with more inside it than its size allows",
  Station: "a thing that says who somebody is before they speak",
  Relic: "worn through at the one spot a thumb has found",
  Implement: "scribed and calibrated, unreadable to anybody not taught it"
};

/*
 * **Where on the body it lives, which says more about the picture than what it does.**
 *
 * `slot` is on all 150 items too, and `brief()` drops it: `bits.unshift(entry.kind ?? entry.slot)`
 * prefers the kind, and every item has one, so the slot has never once been printed. Ten values,
 * and they are composition rather than category -- a thing on the fingers is drawn at a different
 * distance from a thing on the back.
 *
 * This is what breaks the forty-three Wonders apart: pack 9, neck 7, hands 6, fingers 6, cloak 5,
 * feet 4, head 3, belt 3. Eight pictures instead of one, off a field already in the data.
 */
const SLOT_MOTIF = {
  fingers: "one hand's worth of object, drawn close and large",
  neck: "hung on a cord and drawn hanging, turned off square",
  head: "shaped to a skull, the hollow drawn most carefully",
  hands: "held, or just set down, the grip polished by gripping",
  body: "the shape a torso left in it, drawn empty",
  cloak: "cloth with weight in it, hung from one point",
  feet: "worn unevenly, and the wear is the subject",
  belt: "hung at the hip, the strap cut off at the frame",
  pack: "set down on nothing, carried a long way among other things",
  back: "big enough to need the back, strapped, seen from behind"
};

/*
 * **What the thing is MADE of, read off its price, because a gold ring is gold-coloured.**
 *
 * The palette rule says every hue is between red and amber and that nothing in the set is grey.
 * Applied to an object that is the whole subject of its picture, that turns a silver ring into a
 * brown ring and plate armour into a leather suggestion of plate. The hue rules exist so a hand
 * of cards reads as one printed set; they were never an argument about what metal looks like.
 *
 * `value` carries the answer and was never read: 0-10gp for 23 items, 11-100 for 70, 101-600 for
 * 35, 601+ for 22. That is a four-step material scale already graded by somebody who knew what
 * these things are worth, and it costs nothing to use. The bands are inclusive at the top so a
 * 100gp item and a 101gp item are not the same tier by rounding.
 *
 * Silver and steel are named as near-neutral rather than as a colour on purpose: `GATE.maxCool`
 * rejects saturated hue outside 0-60 degrees at 1% of the frame, and a steel rendered blue-grey
 * is the one way this exemption could fail the gate. Real silver is a value, not a hue.
 */
/*
 * **Kept to a dozen words, because the first draft was a paragraph and it had consequences.**
 *
 * Each tier was written out as 25-40 words explaining that silver reads as near-white and gold is
 * the one place a real metallic colour is the point. All true, and there are only FOUR tiers for
 * a hundred and fifty items -- so seventy of them shared one paragraph verbatim and the twin
 * audit went from 0 near-twins to 112 in a single regeneration. It was right to.
 *
 * The division it taught: **the rule goes in the capsule, the datum goes in the subject.** How a
 * metal is rendered is the same instruction for every item in the group, so it belongs in the
 * capsule's palette section where it is written once and the audit rightly ignores it. What this
 * particular object is made of is a fact about this object, and a fact is short.
 */
/*
 * **Price alone was wrong twice: a sixty-gold potion is not made of wrought iron.**
 *
 * The first version read `value` and nothing else, so one of four strings went onto all hundred
 * and fifty items. It was inaccurate -- a flask, a bolt, a cloak and a sword at the same price
 * are made of four different things -- and because there were only four strings for a hundred and
 * fifty pieces, seventy items shared one verbatim and the twin audit went from 0 to 112.
 *
 * So material is read off the price AND what the object is: six families by four tiers, twenty-
 * four short strings instead of four long ones. More accurate and more varied by the same change,
 * which is usually the sign that the field was the right one to read.
 */
const MATERIAL = {
  vessel: ["a clay bottle, a rag stopper and pitch", "green glass, cork and sealing wax",
    "clear glass, a turned stopper and a written label",
    "cut crystal, silver wire and a stopper nobody has broken"],
  ammunition: ["a split ash shaft and a plain iron head",
    "true ash, goose fletching and a forged head",
    "straight-grained shaft and a bright steel head",
    "a silvered head, dyed fletching and a gilt nock"],
  edge: ["plain iron, barely better than a tool", "wrought iron and seasoned wood",
    "bright steel and fine leather", "watered steel, gold inlay and a stone in the pommel"],
  plate: ["boiled hide and a few iron scales", "riveted iron and leather strap",
    "polished steel plate and good strap", "blued steel, gilt edging and silk lining"],
  cloth: ["sacking and undyed wool", "good wool and boiled leather",
    "fine wool, linen lining and silver clasps", "velvet, fur and gold thread"],
  worn: ["tin, bone or fired clay", "wrought iron, brass or horn",
    "silver, worked bronze and fine leather", "gold, gilt and gems"]
};
const FAMILY = {
  Potion: "vessel", Poison: "vessel", Consumable: "vessel",
  Ammunition: "ammunition", Weapon: "edge", Armor: "plate", Shield: "plate"
};
function materialOf(entry) {
  const v = entry.value ?? 0;
  const tier = v <= 10 ? 0 : v <= 100 ? 1 : v <= 600 ? 2 : 3;
  const family = FAMILY[entry.kind]
    ?? (entry.slot === "cloak" || entry.slot === "body" ? "cloth" : "worn");
  return `MADE OF. ${v}gp -- ${MATERIAL[family][tier]}.`;
}

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
   * **The two pieces the gate would not pass, and the palette was the symptom.**
   *
   * Fourteen attempts between them, every one rejected on hue, and neither had a picture to
   * draw. *The Rumour* was getting the fallback -- *draw that line literally: the one moment it
   * describes* -- over a subject that reads *one enemy type acts as though a named lie were
   * true*, which is a rule and not a moment. *The First Taste* was getting the motif table's
   * reading of its range: *the wrongness spreading, landing 1 square from the one who threw it*.
   *
   * Handed nothing drawable, the model drew mood, and the mood of this group is the Way of
   * Faith's violet. So the off-palette hue was never a palette problem -- it was the only thing
   * left to fill a frame with. Both directions below name a moment, two bodies at most, and say
   * the dark is INK rather than a colour, because that is the clause the hue was arriving under.
   */
  "signatures/faith/the-rumour":
    "a mouth at an ear and a hand cupped round the words, both heads cropped at the brow so "
    + "neither face is readable. The listener's eye is the one thing drawn in full, and it has "
    + "already believed it",
  "signatures/faith/the-first-taste":
    "a cup taken away from the mouth and held out to somebody else, the taster's own lip already "
    + "stained -- the stain is ink-dark and not coloured. Two hands and the cup between them, and "
    + "nothing else in the frame",

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
  /*
   * **Six intents about a defence, and the capsule's rule holds: the actor is nobody.**
   *
   * No species, no anatomy, no scale -- one picture serves a goblin and a dragon. So each of
   * these is the **defence failing**, not the creature doing it: the harness, the shield, the
   * footing. That is also why they do not repeat *Between the Plates*, which owns the seam with a
   * point already in it on the players' side.
   */
  "cards/npc/find-the-joint":
    "a buckle and its strap, taken hold of from outside the frame -- the plate it closes still "
    + "whole and now beside the point",
  "cards/npc/where-it-is-held":
    "an arm pinned flat and a point resting on it, unhurried, with nowhere for the arm to go",
  "cards/npc/worry-it":
    "a body already down and the ground churned where it is being worked at, the armour "
    + "irrelevant because nothing is being aimed",
  "cards/npc/round-the-guard":
    "a shield still coming across and already too late, the gap between its edge and the body "
    + "closing on nothing",
  "cards/npc/prise-it-open":
    "a breastplate levered away from the body beneath it, the strap gone and the gap held open "
    + "by something that does not belong in it",
  "cards/npc/take-the-legs":
    "a foot taken out from under, the weight already past the point of recovery and the shield "
    + "swinging wide of everything",
  /*
   * **This one asked for a close-up and an establishing shot in the same frame, and took four
   * attempts before anybody read it back.**
   *
   * It said *seen from below and behind* -- two camera positions -- and then *the whole floor
   * between it and the far wall already in motion*, while the exception capsule this card gets is
   * the instruction to **fill the frame and crowd its own edges, close enough that the eye has
   * nowhere else to go**. Those cannot both be drawn. A model handed both oscillates between them,
   * which is what four re-exports of one picture looks like from the outside.
   *
   * Every other direction on this shelf is **one close idea in one frame** -- *a buckle and its
   * strap*, *an arm pinned flat*, *a foot taken out from under*. This was the only one that named
   * two scales, and the fix is the same one *Where It Is Held* needed: rewrite the composition
   * rather than the words, and the card reads better for it (art.mjs, `ART_REFUSED`).
   *
   * What the card means is kept, and it is the whole of what it means: **she does nothing herself
   * but decide.** So the picture is the signal and the obedience, at one scale -- the raised limb
   * close and from below for size, and the obeying implied by the few shapes at the foot of it
   * that have already turned. A floor-wide crowd was never needed to say *the hive obeys*; one
   * creature turning the same way says it, and can be drawn.
   */
  /*
   * **[MEASURED 2026-11-09] And then the gate said why it still would not finish: 17.6% in the
   * window against a floor of 30%, with ink 6% from the top against a clear tenth.**
   *
   * Both ends at once, which names the fault exactly: a **tall vertical subject**. *One vast limb
   * raised... filling the frame from below -- and at the foot of it* asks for a thing that spans
   * the picture, so its top reaches into the name panel and its weight settles under the rules
   * text. The centre of its ink came out at 61.5% of the height where every piece that passes sits
   * between 44.6% and 54.6%.
   *
   * | | quietTop | inWindow | centre of ink |
   * |---|---|---|---|
   * | *Carry It Off* (exception, passes) | 0.104 | **0.503** | 0.463 |
   * | *Open the Hold* (exception, passes) | 0.120 | **0.320** | 0.546 |
   * | *Prise It Open* (ordinary) | 0.109 | **0.471** | 0.461 |
   * | *The Hive Obeys* | **0.060** | **0.176** | **0.615** |
   *
   * The exception capsule is not the problem -- the other two obey it and pass -- but *Open the
   * Hold* scrapes through at 0.320 and it is the other gigantic body on the shelf, so **a huge
   * subject is marginal here by nature** and this one has to be composed rather than described.
   *
   * So the ink goes where the card is clear: **the head and the signal carry the weight, high, and
   * her bulk below is light tone rather than ink.** She is still enormous -- enormous is what the
   * bestiary line says, and it says it in the brief now -- but what is *drawn dark* is the part a
   * player can see once the card is printed. No numbers in the direction, because a percentage is
   * not something a model can act on: bare paper above and light tone below are.
   */
  "cards/npc/the-hive-obeys":
    "a huge plated head and the one lifted limb beside it, both held across the upper middle with "
    + "bare paper above them -- her rooted bulk below carried in light tone rather than ink, and "
    + "small against it, already turned the same way, the first few of the things that obey",
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
  "items/npc/carved-idol":
    "a god-figure the size of a fist, cut from one piece of wood by somebody with more faith than "
    + "skill: the face barely a face, the body a column, worn smooth at the shoulders from being "
    + "held",
  "items/npc/demons-sigil":
    "a mark burned into a flat surface and still smoking faintly at the edges -- not written, "
    + "pressed. Geometric, closed, and the wood or stone around it curled away from the heat",
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
  /*
   * **This was keyed `items/npc/elf-bolt` and the piece is `items/natural/elf-bolt`,** so the
   * direction was written, committed, and never applied to anything. A key that matches no piece
   * fails silently -- the lookup misses, the piece falls through to its group motif, and the only
   * way to notice is to read the picture. There is a check for it at the bottom of this file now.
   *
   * The fall-through was the worst available: the natural-weapon motif says *grown rather than
   * forged -- chitin, horn, tooth or claw, still part of a body*, and an elf-bolt is a knapped
   * flint arrowhead. Of everything in this book it is the single most forged-not-grown object,
   * and the motif asserted the opposite of it in those words.
   */
  "items/natural/elf-bolt":
    "a small knapped flint arrowhead lying in the palm of a human hand, far too old to belong to "
    + "anyone living. Nothing about it is moving, and the hand is holding it very still",
  /*
   * The other two in the group that the chitin-and-tooth motif was simply false for. A frost is
   * not held at tension and a demon's grasp has no edge to sharpen, which is what those two were
   * being told to draw. Both name what is ink and what is paper, because neither subject has an
   * obvious dark in it and that is how `items/npc/dark-lantern` went blue nine times.
   */
  "items/natural/killing-frost":
    "frost taking hold where no frost should be: a hard-edged patch of it spreading across "
    + "standing grass and dark wet earth, the blades inside the edge furred stiff and the ones "
    + "outside it still soft, the line between them sharp enough to trace. The frost is bare "
    + "paper and the earth is ink; nothing holds it and nobody is in the frame",
  "items/natural/burning-grasp":
    "a huge open hand reaching with no weapon in it, the skin split into plates like cooled lava "
    + "and the cracks between them inked near-black, widest across the palm. Drawn from the "
    + "wrist and no further -- no arm, no body -- and the heat in the splits is bare paper "
    + "rather than a colour or a glow",
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
  /*
   * **Nine attempts, and the direction was asking for the two faults it kept getting.**
   *
   * *A dark room, lighting nothing else at all* is a request to fill the frame, so `paper` came
   * back 0.0%-0.3% against a 5% floor on six of nine tries, with `black` 29-47% and `edgeGrain`
   * 69-92 -- the signature of a wash over everything. And a room drawn dark goes BLUE: `cool` ran
   * 1.3%-8.0% where a pass is 0.0%-0.8%, because night is the one thing the model will not render
   * in a warm neutral unless told the dark is ink.
   *
   * The lantern is the subject; the room was never the subject. So the room comes out, the bar of
   * light becomes the one shape made of bare paper, and the dark is named as ink -- the clause
   * that fixed The Rumour and The First Taste, and for the same reason: handed an absence to
   * draw, the model reaches for a colour.
   */
  "items/npc/dark-lantern":
    "a shuttered lantern seen close, its panels shut and one narrow slit open, the bar of light "
    + "out of that slit drawn as a single clean-edged wedge of bare paper with a few hatch "
    + "strokes only where the wedge ends. Its tin body and shutters are the only ink in the "
    + "frame: the room is not drawn at all, there is no wash anywhere, and the dark here is ink "
    + "or it is nothing -- never a colour, never a blue, never a grey",
  "items/npc/goblin-fetish":
    "a bundle of knotted hair, bone and string hung from a bent stick, turning slowly on its own "
    + "with nobody within reach of it",

  /* The one pair in Items the audit flagged, and the one it was right to be unsure about: they
   * are supposed to be nearly the same object. The difference is what each is *for*. */
  /*
   * **The five the twin audit still named once the motifs were cut to size, and it was right.**
   *
   * Three heavy melee two-handers with the same tags, the same price tier and a blurb under ten
   * words apiece; a Consumable whose name is the only thing shaping it; and a potion sitting
   * beside its own Greater version. A motif table cannot separate these -- *heavy* and *melee*
   * is the whole of what the data says, and it says it three times -- so each gets a sentence
   * about the one thing its own blurb already knows.
   */
  /*
   * **Three spells that took fifteen attempts between them, all on the fallback direction.**
   *
   * The log named `quietTop` on every one and the number was never far off -- 9.9% and 9.6%
   * against a floor of 10 -- which reads like a threshold argument until you print the prompts.
   * All three were getting *draw that line literally: the one moment it describes*, over text
   * that is not a moment: *a Judged enemy that dies this round pays you 3 Health* is a rule, and
   * *plate, in ink, over everything* is a tattooed body, which means a figure, which means a
   * head, which goes at the top of the frame. That is the capsule's own v2 failure, written down
   * at the top of this file years of commits ago: *a three-quarter crop of a person has a head,
   * and a head goes at the top, so the head went at the top.*
   *
   * So each of these crops below the head. **It does NOT say where the empty paper is, and the
   * first version of these three did, which was the same mistake again at piece scale.**
   *
   * That version added *the top third of the picture bare paper*, on the reasoning that asking one
   * piece for a generous empty top is safe where asking the whole capsule for one was not. It is
   * not safe, and the number needed to know that was already written down two comments above
   * this one: **the model overshoots this ask by about 1.4x.** A third asked for is very nearly a
   * half delivered, and the clear window ENDS at 43%. All three came back with the top strip
   * fixed and `inWindow` destroyed -- 22.4%, 37.8% and 49.0% of empty top, for 17.2%, 7.9% and
   * 0.0% of ink inside the band, against a floor of 30. The candle was drawn entirely below the
   * window.
   *
   * The capsule already asks for a tenth at the top, says the dark lives between that and the
   * halfway line, and says the bottom half goes pale. That is complete. A piece's own direction
   * should say WHAT to draw and how to crop it; the moment it also starts placing the subject
   * vertically it is arguing with the capsule, and `quietTop` and `inWindow` are one constraint
   * from opposite ends, so winning that argument on one end loses it on the other.
   *
   * The two faith ones also name the dark as INK rather than as a colour, which is the clause
   * that fixed The Rumour and The First Taste: handed nothing drawable, the model reaches for
   * mood, and the mood of a Faith group is its violet accent.
   */
  /*
   * **The one piece in the book that the API refuses to draw, and it was right to.**
   *
   * `safety_violations=[self-harm, violence]` at the OUTPUT stage. The subject reads *you open a
   * vein for each of them, and for an hour nobody is tired*, and the fallback under it said *draw
   * that line literally: the one moment it describes* -- so the prompt was a request for a picture
   * of somebody opening their own veins. That is not a false positive and not a thing to work
   * around; it is the fallback pointing at the wrong half of the card for the fourth time.
   *
   * **Its sibling is the proof.** `spells/mind/open-the-vein` has the more alarming name and drew
   * first time, because its steps gave it a motif -- *the shape forming between the hands, thrown
   * with the whole body* -- which aims at the blood in FLIGHT. The Red Hour's effect is plain
   * text, so it had no steps to read and nothing aimed it anywhere.
   *
   * So this aims at the hour instead of the price, and takes the body out of the frame altogether
   * rather than drawing the aftermath: a bandaged wrist is still a picture about a wound, and the
   * moderator judges the image. A marked candle is an hour, measured, the way an hour was measured
   * -- and it is tallow and flame, which is the one palette this set never has to argue about.
   *
   * It is deliberately not an hourglass: `items/hourglass-charm` is a Wonder on the neck and two
   * sandglasses in one book is the twin audit's business.
   */
  "spells/mind/the-red-hour":
    "the hour that was bought, never the price that bought it -- a thick tallow candle with hour "
    + "lines scored across it, burned down past the first line, the flame low and one heavy fall "
    + "of wax run down the side. No figure, no hand, no wrist, no bandage, no blade, no wound and "
    + "no blood anywhere in the frame",

  "spells/mind/graven-armour":
    "a bare forearm and the back of one hand, plate armour tattooed into the skin in black line "
    + "-- lames, rivets and the cuff of a vambrace inked where a real one would sit, the lines "
    + "following the tendons under the skin. Drawn from the elbow down and no higher, the arm "
    + "entering from the bottom of the frame",
  "spells/faith/measure-of-the-debt":
    "the two halves of a split tally stick held edge to edge so the notches line up, in two "
    + "hands at waist height, cropped at the wrists. The matched notches are the whole subject "
    + "and the dark is ink rather than a colour",
  "spells/faith/the-lie-that-held":
    "a plank laid across a gap with nothing under its far end and nothing holding it up, a "
    + "boot's whole weight in the middle of it and not a trace of bend in the wood. Drawn from "
    + "the knee down, the gap filling the lower half in ink, and the top of the frame empty",

  "items/great-axe":
    "a single-bitted axe head on a long haft, the bit chipped along its leading edge and "
    + "re-ground behind the chips. Cheap work: no fuller, no inlay, a wedge and a nail",
  "items/greatsword":
    "four feet of straight blade filling the frame corner to corner at a slight diagonal, far "
    + "too long for the picture, with a ricasso wrapped in leather halfway up it",
  "items/longsword":
    "a plain cruciform hilt and the first hand's length of blade, the cross bar straight and "
    + "square, nothing on it that was not needed to hold it",
  "items/caltrops":
    "four iron spikes welded so that one always points up, several of them scattered where they "
    + "fell, seen from low down and close so the upward point is at eye level",
  "items/healing-potion":
    "a stubby wide-mouthed bottle of something thick and dark that has settled, the sediment "
    + "visible at the bottom and a fingerprint in the dust on the shoulder of the glass",

  "items/dagger":
    "a short blade coming out of a sleeve, most of it still hidden, only the last inch of edge "
    + "catching any light",
  "items/balanced-dagger":
    "a throwing knife standing upright on its point, balanced and perfectly still, the whole "
    + "weight of it resting on a spot smaller than a fingernail",

  /*
   * **Four items the API refused, all of them on the same two generic motifs.**
   *
   * `healers-kit` and `the-hungry-blade` came back `[violence]`, `lockpicks` and `the-kit` came
   * back `[illicit]`, and every one of those refusals was at the OUTPUT stage: the prompt was
   * sent, an image was made, and the moderator rejected the picture. So this is not wording to
   * soften. **The picture was the problem, and the only way to change a picture is to name a
   * different one.**
   *
   * What the four had in common is what caused it. Their whole direction was *a tool worn exactly
   * where a hand goes* or *worn through at the one spot a thumb has found* -- motifs about WEAR,
   * which say nothing whatever about the object. Handed a crop and no object, the model built the
   * object out of the blurb, and these four blurbs read as a use rather than a thing: *needle,
   * gut, lint and spirit* is a wound being closed, *a roll of picks and a torsion wrench* is a
   * lock being opened, *a burglar's whole trade* is a burglary, and *it is not sharp, it does not
   * need to be sharp* is a blade that feeds. Each drew the sentence's verb, and the verb is the
   * part the moderator judges.
   *
   * So each of these four names the object, lying still and in use by nobody, and then says what
   * is NOT in the frame -- because the subject line is still there underneath and still reads as
   * a use. The pattern is The Red Hour's: aim at the thing, take the act out of the picture.
   *
   * Twelve items sit on those two motifs and only these four refused, so the motifs are not being
   * replaced -- wear is a real and useful instruction on a lantern or a coil of rope. But `0` of
   * `healers-kit`, `lockpicks` and `the-kit` ever reached the gate: their one attempt each was a
   * refusal, so they looked like pieces nobody had shot. `items/hunting-traps` is the one still on
   * a wear motif whose blurb is also an act (*jaws and a stake*); it drew, so it is left alone.
   */
  /*
   * **The other nine-attempt item, and its motif was placing the subject vertically.**
   *
   * *Cloth with weight in it, hung from one point* names a hanging point, and a hanging point is
   * at the top of the frame: `quietTop` came in under the floor on seven of nine tries (2.6%,
   * 6.8%, 7.8% twice, 8.1% twice, 8.6% twice). The two tries that cleared the top instead lost
   * `inWindow` -- 20.2% and 24.2% against a 30% floor -- because obeying the top strip drops the
   * hanging cloth below the band. One continuum, two ends, nine attempts bouncing between them.
   *
   * Nothing else was wrong with it: `black` stayed 4%-16% and `paper` 18%-53%, so the picture was
   * fine and only its shape was not. The fix is to stop asking for a tall subject rather than to
   * say where a tall one should sit -- a coat laid flat is wide, and a wide subject sits in the
   * band without being told to. The crop is named, the placement is not.
   */
  "items/deep-pockets":
    "a coat laid out flat and open with one pocket turned inside out, its linen lining pulled "
    + "into a long sack plainly deeper than the coat it came out of, a small silver clasp still "
    + "on the pocket's edge. Drawn square on and wider than it is tall, the cloth's own folds "
    + "the only dark in it and nothing hanging anywhere",

  "items/the-hungry-blade":
    "a heavy sword lying flat and alone, its edge rounded blunt down the whole length with no "
    + "bevel ground into it anywhere, the steel dark and close-grained like a bar stock that was "
    + "never meant to cut. Nothing on the blade: no mark, no stain, no blood, no wound and no "
    + "person in the frame",
  "items/healers-kit":
    "a strip of cloth unrolled flat with its contents in sewn loops along it -- one curved "
    + "needle, a hank of waxed gut, a folded wad of lint and a small stoppered bottle, laid out "
    + "in that order. The kit is the whole subject: nobody is being treated, and there is no "
    + "body, no wound and no blood in the frame",
  /*
   * **Three refusals, and the second one was on the fix for the first.**
   *
   * `[illicit]` at the OUTPUT stage every time. The first attempt was the bare wear motif. The
   * second named the tools and took away the context -- *no lock, no keyhole, no door and no
   * hand* -- on the theory that the crime in the picture was the lock being opened. It was not.
   * Drawing five picks and a torsion wrench clearly and well IS the thing the moderator will not
   * emit, and stripping the context only made them the sole and unmistakable subject.
   *
   * **`items/the-kit` is the proof, and it is the same category.** It refused once and then drew
   * first time, because its direction never puts a pick in the frame: a canvas roll, tied shut.
   * The rule that works is not *remove the crime*, it is **do not draw the tool**.
   *
   * So this draws the cloth and not what goes in it: an empty roll, the loops holding nothing,
   * and the only trace of the tools is the oil worn into the cloth where each one lies. It is
   * honest to a subject that reads *a roll of picks and a torsion wrench, IN OILED CLOTH*, it is
   * nothing like The Kit's closed roll, and there is no pick in it to reject. A stain is not a
   * tool -- which is the whole bet, and if this one refuses as well the subject is simply one
   * this API will not draw, and the answer is to hand Lockpicks another item's picture.
   */
  "items/lockpicks":
    "a strip of oiled cloth unrolled flat and empty, its sewn loops holding nothing at all, the "
    + "tools long gone out of it. What they are is readable only in the cloth: a row of five "
    + "slim dark stains worn into it where each slender one lay, and one flat wider stain across "
    + "them. The cloth is the whole subject -- no tool of any kind in the frame, no metal, no "
    + "lock, no keyhole, no door and no hand",
  "items/the-kit":
    "a fat canvas roll tied shut with a leather thong, worn pale and shiny at both ends by years "
    + "of being carried and never set down. It stays closed and what is inside it is never "
    + "shown: no tool, no lock, no door and no hand in the frame",

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
  /*
   * **Adapted is the only one of these that is about an injury**, and the brief has to hold the
   * line the rule holds: the injury is NOT gone. A picture of a healed hand would say the
   * opposite of the mechanic, which leaves the slate on the sheet and switches off its
   * arithmetic. So the moment is competence around a loss that is still visible.
   */
  /*
   * **The eight intruder faces.** The brief called these *"two faces, fixed"* and filed them under
   * what does not need art -- written when there were two of them, and the argument did not
   * survive the fifth. They are read more often than most of what was drawn.
   *
   * Each one is the **cost**, not the cause: a Wound is dead weight, a Fear is ground given up, a
   * Compulsion is the rest you are not allowed. None of them is a blow landing, because by the
   * time the card is in a hand the blow is over.
   */
  "cards/harm/wound":
    "an arm bound tight and held close, doing nothing and plainly unable to -- the rest of the "
    + "body still upright and still in the fight",
  "cards/harm/taint-body":
    "a hand's veins gone dark and standing up under the skin, traced further than a hand should "
    + "reach, the fingers still working",
  "cards/harm/taint-mind":
    "a face lit from somewhere that is not in the picture, looking slightly past the viewer at "
    + "something it has been looking at for a while",
  "cards/harm/fear":
    "a single backward step already taken: the front foot lifted and turned, the ground where it "
    + "was standing empty and marked",
  "cards/harm/doubt":
    "a hand stopped halfway to the thing it was reaching for, and the gap between them as the "
    + "subject of the picture",
  "cards/harm/rage":
    "a swing already committed to, seen from behind the shoulder, with nothing in front of it "
    + "worth swinging at",
  "cards/harm/compulsion":
    "somebody who cannot sit down: the chair there, plainly there, and the body going past it "
    + "again",
  "cards/harm/confusion":
    "a group that has lost its one direction -- each of them turned a different way, none of "
    + "them moving",

  /*
   * **The eight ritual twists.** A twist is a NAME and a COST, so there is no action in the text
   * to draw -- the same problem the features had, and the same answer: each one names its own
   * moment instead of being handed a good instruction eight times.
   *
   * All eight are the working turning, and none of them is a monster arriving. The thing pushing
   * back is the injury, the curse or the rot, and those have no body of their own: what is on the
   * card is its effect on the room and on the people in it.
   */
  "cards/ritual/backlash":
    "the working coming back up the arms of the person leading it -- hands still in position, "
    + "the body already folding away from them",
  "cards/ritual/it-answers":
    "every flame in the room leaning the same way at once, toward something outside the frame "
    + "that has just taken an interest",
  "cards/ritual/residue":
    "what is left on the table when the working lifts: a stain spreading out from where the "
    + "subject's hand was, in the grain of the wood",
  "cards/ritual/deeper":
    "the subject's own injury answering for itself -- a body going wrong again in the exact "
    + "place it went wrong the first time, mid-ritual, with the work still laid out around it",
  "cards/ritual/spoiled":
    "a prepared component ruined in the instant of use: the vessel cracked through, its "
    + "contents already across the table and unusable",
  "cards/ritual/not-alone":
    "the person who was only helping, suddenly holding their own arm -- the subject still on "
    + "the table between them, untouched by this",
  "cards/ritual/the-long-way":
    "a page turned back to and read again, the diagram on it plainly not matching what has "
    + "been built on the table in front of it",
  "cards/ritual/it-sets":
    "a thing closing rather than opening: the work gone still and settled, the room's tension "
    + "simply absent, and nothing to show for the days but a subject unchanged",
  "features/adapted":
    "a hand doing something awkward entirely without hesitation -- the missing fingers plainly "
    + "missing, the grip worked out long ago and no longer thought about",
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
    + "hands; all of it in the eyes",

  /* --- the last forty-seven cards, thirty-four of which had nothing of their own --------------
   *
   * **The motif table is a floor and these five groups were standing on it.** Starter, common and
   * the thirty-six intents came out clean because eighty-five of them were written by hand; the
   * Shade deck had twelve cards and not one direction, and four clusters were drawing the same
   * picture across group boundaries:
   *
   * - *Light Feet*, *Armoured Advance*, *Roll With It* and *Blink* all had **ground covered --
   *   weight forward, the last footfall still behind**. Four cards, one image, in four decks.
   * - *Mock* and *Backlash* both had **sight swimming**, because both apply Dazed.
   * - *Vanish* and *Veil* both had **only the shape the air makes**, because both apply Invisible.
   * - *Break It* and *Glare* both had **the quality itself as one human moment**.
   *
   * The motif reads the STEPS, and a step is a mechanic: four cards that move three squares are
   * the same card to it. What separates them is in the names and in the rules line underneath --
   * *ignoring difficult ground*, *your armor counts +1*, *sidestep 2*, *ignoring figures* -- and
   * the first audit of this set established that rules text is not a picture. So each of the four
   * gets a different body part, a different crop and a different verb, and the cluster is gone.
   */

  /* The Shade deck: twelve cards about reach, precision and not being there afterwards. */
  /*
   * **Three cards about defeating a defence, and they must not be three pictures of a knife.**
   *
   * *Between the Plates* below already owns *the seam, with a point in it*, so these take the
   * other two mechanisms on their own terms: one goes through armour whatever it is, one goes
   * through two points of it, and one does not go through anything at all -- it goes round. The
   * defence is the subject of each, and the blade is only what answered it.
   */
  "cards/shade/find-the-seam":
    "a hand laid flat on a breastplate, feeling for something through it, the knife still held "
    + "low and unused -- the search is the subject, not the stab",
  "cards/shade/half-hilt":
    "a knife held reversed and close, the pommel at the heel of the hand, driven short and "
    + "straight where a long swing could not go",
  "cards/shade/round-the-shield":
    "a shield raised square and squarely useless: the knife already past its edge and behind "
    + "it, and the shield still exactly where it was put",
  "cards/shade/between-the-plates":
    "the gap in a harness with a point already in it: a narrow blade entering where two plates "
    + "meet under the arm, the armour unmarked everywhere else in frame. The seam is the subject "
    + "and the blade is only what found it",
  "cards/shade/call-the-shot":
    "one enemy picked out of a field at distance -- a hand up with two fingers laid along the "
    + "line of sight, the eye behind it narrowed, the target far off and small. Nothing has been "
    + "thrown and nothing has been loosed",
  "cards/shade/cut-and-run":
    "the blow and the leaving in one gesture: a blade dragged back across the body while the feet "
    + "have already turned the other way, shoulders ahead of hips. Committed to the exit rather "
    + "than to a second cut",
  "cards/shade/light-feet":
    "two feet on bad ground and no weight resting in it -- a toe on a loose stone, the other foot "
    + "already lifted, rubble and standing water all around. Drawn from the knee down and no "
    + "higher",
  "cards/shade/mock":
    "a face mid-jeer, close and turned a little away, the mouth open on a word that has already "
    + "landed somewhere off-frame. The subject is the insult being enjoyed, not whoever took it",
  "cards/shade/pin-the-shadow":
    "a blade driven through a trailing hem and into the ground under it, the cloth pulled taut "
    + "and the foot above it unable to lift. The point is in the earth and not in anybody",
  "cards/shade/second-knife":
    "a second blade leaving the hand underhand while the first is still gripped in the other "
    + "fist. Two knives, one in the air and one held, and the throw is the cheap short one",
  "cards/shade/sleight":
    "one hand doing the obvious thing and the other doing the real one -- an object held up in "
    + "plain view high in the frame while the second hand, lower and half out of it, has already "
    + "taken something else",
  "cards/shade/slip-the-knot":
    "wrists coming out of a cord that is still tied: one hand already free and flat, the loop "
    + "collapsing off the other. The knot itself is never untied and stays in the picture",
  "cards/shade/smoke-and-go":
    "a low cloud at ankle height with nobody in it, and the far side of it disturbed -- a hem, a "
    + "heel, the edge of a hand leaving the frame. Whoever stood here is already not here",
  "cards/shade/take-the-shot":
    "the release itself: a bowstring gone slack and the drawing hand still open exactly where it "
    + "was, the arrow already out of frame. The hand that let go is the whole subject",
  "cards/shade/vanish":
    "the outline of a person held open in the air by nothing -- dust and lamplight bending around "
    + "a shape that is not there, the floor beneath it unpressed. No body, no cloak, no smoke",

  /* The Strength deck: twelve cards about weight, and no two of them weighing the same thing. */
  "cards/strength/armoured-advance":
    "a plated figure walking into something head-down, pauldrons forward and the helm tipped so "
    + "the brow takes it first. The advance is in the shoulders; the ground is not the subject "
    + "and barely shows",
  "cards/strength/beat-the-blade":
    "a sword leaving a hand that has just been struck across the knuckles -- the grip sprung "
    + "open, the fingers splayed, the hilt tumbling clear. The empty hand is the picture",
  "cards/strength/hammerblow":
    "a two-handed weapon at the very top of its arc, both arms locked out and the whole body "
    + "stacked underneath it, a half-beat before any of it comes down",
  "cards/strength/heave":
    "somebody walking under a load that should not be walkable: a beam or a cask across one "
    + "shoulder, the spine straight beneath it, the pace unbroken. Not the lift -- the carrying",
  "cards/strength/overbear":
    "two bodies gone to the ground as one, the upper one's whole weight on the lower's chest and "
    + "both arms wrapped. Nothing is being struck; something is being kept still",
  "cards/strength/pull-them-down":
    "a fistful of somebody else's collar and harness, hauled downward and sideways, their knees "
    + "already going. The grip is the subject and the face above it is cropped out",
  "cards/strength/roar":
    "the roar at its source and far too close -- a jaw open to its limit and the throat working, "
    + "the frame filled by the one head and nothing else in it. The cause is all there is; the "
    + "effect is off-frame",
  "cards/strength/shield-bash":
    "the flat of a shield driven forward like a door being shut, the boss dead centre and the arm "
    + "straight behind it. Nothing edged anywhere in the frame",
  "cards/strength/shoulder-check":
    "a shoulder arriving in somebody's chest at a run, the two bodies touching along one line and "
    + "the further one's heels leaving the ground",
  "cards/strength/sweep-the-leg":
    "a low horizontal sweep through the back of a knee, drawn from the shins down: the supporting "
    + "leg folding the wrong way while the other foot is still planted",
  "cards/strength/two-hand-it":
    "both hands closing onto one hilt and a shield already dropped, falling out of the bottom of "
    + "the frame. The decision is the picture: everything into the next blow and nothing left to "
    + "guard with",
  "cards/strength/walk-it-off":
    "somebody walking a wound off instead of tending it -- a hand pressed flat to one side, head "
    + "up, the stride deliberately ordinary. The refusal to stop is the subject",

  "cards/way/roll-with-it":
    "the end of a shoulder roll: a body coming up out of the ground onto one knee with the "
    + "momentum still in it, facing a different way than it set off",

  "cards/skill/break-it":
    "the instant something gives -- a board, a hasp, a shutter going at its weakest point with a "
    + "hand still on it. The break is the subject and the person is barely in frame",

  /*
   * The Wild deck, which is the hardest group in the set and the reason it is last.
   *
   * **These are not actions; they are what happens instead of the action.** A Wild is drawn when
   * a spell goes wrong, so there is no body deciding anything -- *Cursed* and *Blessed* are a
   * condition and nothing else, and the motif table could only offer *a shadow that chose
   * someone* and *light that chose someone*, which are the same sentence twice.
   */
  "cards/wild/backlash":
    "a caster taking their own spell in the face: the head snapped back, one hand still raised in "
    + "the shape it was making, the eyes gone unfocused. It went off, and it went off here",
  "cards/wild/blink":
    "one figure half in two places at once -- a left side at one edge of the frame and a right "
    + "side at the other, nothing at all between them and no ground crossed",
  "cards/wild/glare":
    "light going off around a standing figure rather than at it: the figure dark and central, the "
    + "flare thrown outward past it in every direction, the frame's near edges washed pale",
  "cards/wild/open-door":
    "an open door with nobody in the doorway and something on the far side already looking this "
    + "way. The invisibility is the empty frame; the marking is the attention coming back through "
    + "it",
  "cards/wild/residue":
    "a shadow on the ground belonging to nobody standing: the figure above it lit and ordinary, "
    + "the shape beneath it the wrong size and reaching the wrong way",
  "cards/wild/second-sight":
    "light arriving on one person out of a dim room and on nothing else, from no source anywhere "
    + "in the frame -- the face lifted into it, the hands still at whatever they were doing",
  "cards/wild/the-long-step":
    "the arrival and not the crossing: a figure already down on both hands at the far end of the "
    + "move, dust still settling around it, having got there without landing",
  "cards/wild/veil":
    "a sheet of air hanging like hung cloth, the room behind it displaced a finger's width to one "
    + "side where it falls. Something is behind it and the picture does not say what",

  /*
   * **The three palest creatures in the set, which came out with no drawn line at all.**
   *
   * `minBlack` is 0.3% and the other 110 tokens clear it by seventeen times over: the median is
   * 5.3%, the tenth percentile 2.3%, and the lowest passing token in the book is the dragon at
   * 0.52%. These three measured 0.02%, 0.05% and 0.14% -- a clean 3.7x gap below the worst
   * passer, with nothing in between. That is not a floor set too high, which is what it looked
   * like from the three files alone; it is three pictures with no ink in them.
   *
   * Their subjects say why. *Slight, pale... the whole figure glitters... rolled in frost or
   * crushed glass*, *a vast translucent mass*, *the white of old ice with the grey of it
   * underneath* -- each is a creature made of pale, and the model dropped the contour along with
   * the colour. So each of these names where the near-black lives, on a thing that is allowed to
   * be dark on a pale creature: hair, a silhouette seen through the mass, the depth of a crack.
   *
   * **These three are whole sentences, not the noun phrases every other row here is.** A token's
   * framing line is fixed and comes first, and a direction is appended to it rather than used
   * instead of it, so a `tokens/` row has to read as the sentence that follows one.
   */
  "tokens/elf":
    "The unbound hair is the one dark mass in the picture, inked in near-black and not washed, "
    + "and the eyes are dark; the glitter is light left on the paper rather than a colour laid "
    + "on it. The drawn line stays near-black the whole way round however pale the alva inside "
    + "it is.",
  "tokens/the-land-jelly":
    "The near-black is everything suspended inside it: the boat, the worked stone and the bones "
    + "read as dark silhouettes deep in the mass, darkest where the most jelly lies over them. "
    + "The line around the whole thing stays inked however clear the jelly is.",
  "tokens/the-winter-lady":
    "The grey beneath the ice deepens to near-black in the cracks of it and in the hollows of "
    + "the gown, and the eyes are dark. The drawn line stays near-black the whole way round "
    + "however white the ice is."
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

  /* `1 squares` reached four prompts before anybody read one aloud. */
  if (step.range) {
    q.push(`landing ${step.range} square${step.range === 1 ? "" : "s"} from the one who threw it`);
  }
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
  /* Which qualifiers each verb has already contributed, so a repeat says only what is new. */
  const said = new Map();
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
     *
     * **And "different" has to mean it.** The first version pushed the whole qualifier list
     * again behind a `then`, so two steps at the same range produced *landing 1 square from the
     * one who threw it; then landing 1 square from the one who threw it* -- and the `new Set`
     * below could not collapse it, because the `then ` prefix makes the two strings unequal.
     * So the qualifiers already said for this verb are subtracted, and a step that adds nothing
     * new adds no clause at all.
     */
    if (seen.has(step.verb)) {
      const already = said.get(step.verb);
      const fresh = qs.filter(q => !already.has(q));
      if (fresh.length) out.push(`then ${fresh.join(", ")}`);
      for (const q of fresh) already.add(q);
    } else {
      out.push(qs.length && stem ? [stem, ...qs].join(", ") : motif(table, step.verb, kind));
      said.set(step.verb, new Set(qs));
    }
    seen.add(step.verb);
  }
  for (const key of new Set(steps.map(s => s.condition).filter(Boolean))) {
    out.push(motif(CONDITION_MOTIF, key, "condition"));
  }
  /*
   * An item has no steps worth speaking of; what it IS carries the picture.
   *
   * **`kind` first, then `slot`, and only then the tags and the group.** Every item has a kind
   * and a slot; 89 have tags and 74 have a group. Reading the coarse fields first was what put
   * forty-three unlike things under one sentence -- so the order now runs most specific to least,
   * and a Wonder, which has forty-three members and no useful kind motif, is answered by where on
   * the body it lives instead.
   */
  if (!out.length && KIND_MOTIF[entry.kind]) out.push(KIND_MOTIF[entry.kind]);
  if (!out.length && entry.kind === "Wonder" && SLOT_MOTIF[entry.slot]) {
    out.push(SLOT_MOTIF[entry.slot]);
  }
  if (!out.length && entry.tags?.length) {
    for (const tag of entry.tags) if (TAG_MOTIF[tag]) out.push(TAG_MOTIF[tag]);
  }
  if (!out.length && entry.group) out.push(motif(GROUP_MOTIF, entry.group, "bonus group"));
  /*
   * **The slot is NOT added as a second clause where the kind already spoke, and it was.**
   *
   * *Where it is worn* and *what it is* are different facts and a picture wants both, which is
   * the argument that put it here. Measured, it was the wrong trade: a slot is shared by every
   * item in its slot, so all eighteen potions gained the same *hung at the hip from a strap* and
   * the shared half of their prompts grew while the half that tells them apart -- the name and
   * the blurb -- did not. It cost more than twice what the material line cost on the twin audit,
   * for a clause the eighteen have in common anyway.
   *
   * It stays for `Wonder` above, where it is the whole point: forty-three Wonders have no finer
   * kind to split them and the slot is what makes eight pictures out of one.
   */
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
  "cards/harm": "A card nobody chose to put in a deck: it sits in a hand of five being useless, "
    + "or comes up at a moment nobody picked. It must read as WRONG at a glance and at thumbnail "
    + "size, under a dark red wash the interface puts over it — so: strong simple shapes, "
    + "little fine detail, and no weapon, no attacker and no blood. The harm has already "
    + "happened; this is what is left of it.",
  "cards/ritual": "A ritual going wrong. Days of work, out of combat, on one of the party's own "
    + "characters -- so the room is quiet and worked-in, and what has turned is the working "
    + "itself rather than anything arriving. No monster, no blade, no summoning circle.",
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
/* The creature itself, not only its name: an exception card is told to draw one, and until
 * 2026-11-09 nothing in the brief said what it looked like. See `exclusive` below. */
const CREATURE_BY_KIND = new Map(CREATURES.map(c => [c.system?.kind, c]));

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
    /*
     * **A token's framing line is not negotiable, and until now it was also the whole direction.**
     *
     * Three-quarter from above, filling the square, on transparency: that is what makes 113
     * creatures sit on one map at one scale, and no piece gets to argue with it. So the token
     * branch said that sentence and stopped, and `DIRECTION` was unreachable for a token -- which
     * was fine while the only thing a token needed saying was its frame.
     *
     * It stopped being fine on the three palest creatures in the set. The frame says nothing
     * about ink, their own text says *pale*, *translucent* and *the white of old ice*, and the
     * model dropped the drawn line along with the colour: 0.02%, 0.05% and 0.14% true black
     * against a 0.3% floor that the other 110 clear by seventeen times over. The gate's own note
     * on that rule is the answer -- the near-black contour binds a token *because that is the
     * hand rather than the hue* -- but there was nowhere to say it to one piece.
     *
     * So a token keeps its framing sentence and may now carry a second one after it. The frame
     * stays first and stays whole; the direction only ever adds.
     */
    const direction = token
      ? "The whole creature, three-quarter from above, filling the square on full transparency."
        + (DIRECTION[key] ? ` ${DIRECTION[key]}` : "")
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
     * **And what that creature looks like, which the brief forgot to say for as long as these
     * cards have existed.**
     *
     * The paragraph below tells the model *draw that creature* and *this picture should be
     * unmistakably of one thing*, and then never says what the thing is. Three briefs got away
     * with it because their hand-written direction happened to describe a body as well as an
     * action -- *a gigantic sagging body splitting along the belly seam*, *two small workers
     * leaving with somebody*. The Queen's did too, until the two-scale contradiction was taken out
     * of it and the body went with the contradiction: what was left asked for *one vast limb* of
     * nothing in particular, and a model with no creature to draw invents a different one every
     * time. Four exports of one picture, and then a fifth.
     *
     * So the body comes off the **roster**, which is where every other brief in this book gets it
     * -- the token shelf has printed `look` since it existed. One source, no hand-copying, and a
     * creature whose description is rewritten takes its card's brief with it.
     *
     * The division is: the **bestiary owns the body**, the **direction owns the scene**. That is
     * why the line says *from the bestiary* out loud -- the Processor's description opens *a single
     * worker* while its card's direction asks for two of them, and the reader has to know which
     * sentence is telling them what to draw and which is telling them what it is.
     */
    const bodies = (entry.only ?? [])
      .map(kind => CREATURE_BY_KIND.get(kind))
      .map(c => c?.look || c?.note)
      .filter(Boolean);
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
          + "apply here, and this picture should be unmistakably of one thing.",
          ...(bodies.length
            ? [`THE CREATURE, FROM THE BESTIARY: ${bodies.join(" -- and -- ")}. That is what it `
              + "is; the last line is what it is doing."]
            : []),
          /*
           * **And it has to be special at a glance, not only on reading.**
           *
           * The licence above told the model it *may* draw a creature. It did not say the picture
           * should look unlike its thirty-four neighbours, and the neighbours are built on the
           * opposite instruction -- the intent capsule asks for *the point of contact, the place
           * the ground is marked, the gap where the distance is*, which is deliberately a fragment
           * of a scene with air around it, because one picture has to serve a goblin and a dragon.
           *
           * So four cards in five in an NPC deck look alike by design, and the rare card that is
           * one creature's own looked alike too. A composition direction is what separates them,
           * and it is the inverse of the capsule's: **fill the frame.** A card that crowds its own
           * edges reads as different from arm's length, before a word of it is read.
           *
           * The tray marks it as well (`cr-card--sole`, a folded corner), and the two are not
           * redundant: the corner says *this one is special* on a card you are holding, and the
           * composition says it on a card lying on the table.
           */
          `COMPOSE IT AS THE EXCEPTION. The other cards on this shelf are a fragment of a scene `
          + "with open paper around it, because one picture has to serve every creature. This one "
          + "does not: let the subject FILL the frame and crowd its own edges, close enough that "
          + "the eye has nowhere else to go. It should be the card in a hand of eight that does "
          + "not look like the other seven, from arm's length and before it is read.",
          /*
           * **And the clause that was missing, which cost four exports of one picture.**
           *
           * *Fill the frame* is about the frame and says nothing about where the ink goes, so a
           * brief that obeyed it put a tall subject from the top edge to the bottom one -- into
           * the name panel at one end and under the rules text at the other. Measured: 17.6% of
           * the drawing in the clear band against a floor of 30%, on a card whose two neighbours
           * under the same instruction score 0.503 and 0.320. The instruction was not wrong; it
           * was half an instruction.
           */
          "FILLING THE FRAME IS NOT THE SAME AS SPREADING THE INK. Crowd the edges with the "
          + "subject, and still put the WEIGHT of the drawing -- the true blacks, the modelled "
          + "detail, the part that reads from arm's length -- in the upper middle, with bare "
          + "paper above it and the lower half carried in light tone. A subject that runs from "
          + "the top edge to the bottom one fills the frame and fails the card: the top is behind "
          + "the name and the bottom is behind the rules text."]
        : []),
      "",
      direction,
      ...(CAST_GROUP.test(group.dir) && !exclusive.length
        ? ["", `WHO IS IN IT. If a face or any bare skin shows here, that person is `
          + `${castLine(key)} -- fixed, not a suggestion, and not a default to fall back from. `
          + "If this crop shows no person at all, the line does not apply."]
        : []),
      /* Natural weapons are grown, not bought: a mandible has a `value` the way a sword does and
       * it means nothing about what it is made of. Chitin is chitin at any price. */
      ...(group.dir.startsWith("items") && group.dir !== "items/natural"
        && entry.value !== undefined
        ? ["", materialOf(entry)]
        : [])
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

/*
 * **Directions keyed to a path no piece has, which is a bug that cannot be seen.**
 *
 * `items/npc/elf-bolt` was written, committed and never applied: the piece is
 * `items/natural/elf-bolt`, the lookup missed, and the piece quietly fell through to a group
 * motif that happened to describe the opposite of what it is. Nothing failed. The book
 * regenerated, the suite passed, the picture was drawn and paid for, and the only way to find it
 * was for somebody to look at the picture and say it seemed wrong.
 *
 * Every other table here is keyed on something the content supplies -- a verb, a tag, a kind --
 * so a bad key there means a `[GAP]` marker in the prompt. `DIRECTION` is keyed on a path typed
 * by hand, which is the one place in this file where a mistake is silent. So it is listed, and
 * the suite pins the list at none.
 */
const orphans = (() => {
  const keys = new Set(ledger.map(p => p.key));
  return Object.keys(DIRECTION).filter(k => !keys.has(k)).sort();
})();

push("## Directions that match no piece", "",
  orphans.length
    ? `**${orphans.length} row${orphans.length === 1 ? "" : "s"} in \`DIRECTION\` ${
      orphans.length === 1 ? "is" : "are"} keyed to a path no piece has**, so ${
      orphans.length === 1 ? "it was" : "they were"} never used and the piece ${
      orphans.length === 1 ? "it names" : "they name"} fell through to a motif. Fix the key in `
      + "`test/art-prompts.mjs` and regenerate."
    : "**None.** Every row in `DIRECTION` is keyed to a piece that exists. A key typed by hand "
      + "is the one thing in this file that can be wrong without anything failing, so it is "
      + "counted here rather than trusted.",
  "",
  ...orphans.map(k => `- \`${k}\``), orphans.length ? "" : "");

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
  if (orphans.length) {
    console.log(`  ${orphans.length} keyed to a path no piece has, so never used:`);
    for (const k of orphans) console.log(`    ${k}`);
  }
  console.log(`  ${shared} prompts in ${clusters.length} clusters share a direction,`
    + ` ${biting.length} of them with nothing in the subject to tell them apart either`);
  for (const [direction, members] of biting.slice(0, 4)) {
    console.log(`    ${String(bare(members)).padStart(3)} bare of ${String(members.length).padEnd(3)}`
      + ` ${direction.slice(5, 64)}`);
  }
}
