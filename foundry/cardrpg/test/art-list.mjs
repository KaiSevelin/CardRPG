/**
 * Write the art list. Run with: node test/art-list.mjs
 *
 * The list is **generated**, because a hand-written one goes stale the first time somebody adds a
 * card -- and this project has added a hundred and sixty of them in a fortnight. It reads the same
 * content the game does, so a piece that exists in the game is in the brief and a piece in the
 * brief exists in the game.
 *
 * It also reports what is already drawn, so the file doubles as the commission's progress -- and
 * that half **was wrong for as long as it existed**. It counted `artIn(entry)`, which asks whether
 * a piece has a path wired into the game, and every piece in content has one by construction. So
 * it printed "622 pieces, 622 wired up" while a file was missing from the disk, which is the
 * project's own recurring defect wearing a progress bar: a field that reads as one thing and
 * asserts another.
 *
 * It now asks the **disk**, and reports three states rather than one:
 *
 *   - **drawn**   -- the file is there. The only one that means a picture exists.
 *   - **refused** -- an image model would not draw the brief (`ART_REFUSED` in art.mjs). A state,
 *                    not a gap: without it a blocked piece looks pending for ever.
 *   - **pending** -- nobody has got to it yet.
 */

import fs from "node:fs";
import path from "node:path";
import { CARDRPG } from "../module/config.mjs";
import * as content from "../module/content.mjs";
import { expandRoster } from "../module/monsters.mjs";
import { DELIVERY, slug, SHELVES, ART_REFUSED } from "../module/art.mjs";
import { backOf } from "../module/decks.mjs";

const root = path.join(import.meta.dirname, "..");
const OUT = path.join(root, "..", "art-list.md");

/* -------------------------------------------- */

/**
 * **What the pipeline keeps, stated once because three places need it.**
 *
 * The model is asked for a 1024 x 1536 original and **nothing keeps it**: the file is transcoded
 * to webp at this quality and the original is dropped on the floor. Both tables below print this,
 * and the generator reads it rather than carrying its own number, because a format that is
 * written down in three places is a format that will disagree with itself.
 *
 * Eighty, and measured rather than picked: on the first twenty-two generated pieces it turned
 * 58MB of PNG into 3.9MB of webp -- **93% smaller** -- at a worst-case difference of 1.88% RMSE,
 * which is less than the brush texture varies between two generations of the same prompt. At
 * roughly 180KB a piece the finished set is about **90MB**, and that is the number to weigh
 * against a repository that is 26MB today.
 */
/*
 * Both of these moved to `module/art.mjs` when the game became a reader of them: the runtime
 * derives the same paths this brief prints, and module code cannot import out of `test/`. They
 * are re-exported here because the validator imports them from this file by name, and because a
 * brief that does not spell its own format and its own slug rule is a brief with a second rule
 * hiding in it.
 */
export { DELIVERY, slug };

/** A condition by its printed name, not its key: an artist should not have to read camelCase. */
export function conditionName(key) {
  const label = CARDRPG.conditions[key]?.label;
  return label ? label.split(".").pop().replace(/([a-z])([A-Z])/g, "$1 $2") : key;
}

/**
 * One line of brief per piece, read off the content.
 *
 * This is the part worth generating rather than writing: a card's brief is *what the card does*,
 * and the content already says that in a form nobody has to paraphrase. An artist reading "Poisoned
 * 1 (2), resist Might 5" knows more about the picture than they would from a sentence I invented.
 */
export function brief(entry) {
  const bits = [];
  const step = st => {
    const parts = [];
    if (st.verb) {
      parts.push(CARDRPG.verbs[st.verb]?.label?.split(".").pop()
        ?? CARDRPG.effects[st.verb]?.label?.split(".").pop() ?? st.verb);
    }
    if (st.mod) parts.push(`${st.mod > 0 ? "+" : ""}${st.mod}`);
    if (st.param) parts.push(String(st.param));
    if (st.range) parts.push(`range ${st.range}`);
    /* What the step goes through. Without these the brief printed *Heavy Swing* and *Measure* as
     * the same card, which is exactly what they stopped being. */
    if (st.ignores) parts.push(`ignores ${st.ignores} armor`);
    if (st.ignoresArmour) parts.push("ignores armour");
    if (st.ignoresBlock) parts.push("ignores Block");
    if (st.when?.ignoresArmour) parts.push(`ignores armour vs ${conditionName(st.when.needs)}`);
    if (st.when?.ignoresBlock) parts.push(`ignores Block vs ${conditionName(st.when.needs)}`);
    if (st.area) parts.push(`${st.areaKind || "area"} ${st.area}`);
    if (st.condition) {
      parts.push(`${conditionName(st.condition)}${st.intensity ? ` ${st.intensity}` : ""}`
        + `${st.duration ? ` (${st.duration})` : ""}`);
    }
    if (st.text) parts.push(st.text);
    return parts.join(" ");
  };

  if (entry.primary?.length) bits.push(entry.primary.map(step).filter(Boolean).join(", "));
  if (entry.secondary?.length) bits.push("/ " + entry.secondary.map(step).filter(Boolean).join(", "));
  if (entry.sequence?.length) bits.push(entry.sequence.map(step).filter(Boolean).join(", "));
  if (entry.effect) bits.push(step(entry.effect));
  if (entry.steps?.length) bits.push(entry.steps.map(step).filter(Boolean).join(", "));
  if (entry.text) bits.push(entry.text);
  if (entry.blurb) bits.push(entry.blurb);
  if (entry.active?.text) bits.push(entry.active.text);
  if (entry.approach) {
    bits.unshift(`${entry.wild ? "any approach" : entry.approach} ${entry.value}`);
  }
  if (entry.edge) bits.push(`Edge: ${entry.edge}`);
  if (entry.strength) bits.unshift(`strength ${entry.strength}`);
  if (entry.kind === "Weapon" || entry.slot) bits.unshift(entry.kind ?? entry.slot);

  const line = bits.filter(Boolean).join(" · ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return line.length > 150 ? line.slice(0, 147) + "..." : line;
}

/**
 * A creature's brief: its numbers, what it fights with, and the one line of description the
 * roster already carries.
 *
 * `note` is the part worth having and the part nobody had to write for this -- *the one that does
 * not run: a shield, a shell of discipline, and no Cower* says more about the picture than a
 * statblock does, and it was written when the creature was.
 */
/**
 * A variant's base, for the art only.
 *
 * `applyVariant` builds a creature and keeps nothing that says what it is a variant OF -- which is
 * right for the engine, where a Skaah Bloated is simply a creature, and wrong for a token, where
 * it is *a Skaah, but worse*. Every variant was drawn with no sight of its base and they diverged:
 * a Bloated that was not a Skaah, a Brood that was not a Slitherer, three Sweepers that came back
 * as an eagle, a four-winged thing and a rat.
 *
 * Built here from the same ROSTER and VARIANTS the engine expands, so it cannot disagree about
 * which base a kind belongs to, and nothing is added to the documents the game creates.
 */
const BASE_OF = new Map();
for (const base of content.ROSTER) {
  for (const delta of content.VARIANTS[base.system?.kind] ?? []) BASE_OF.set(delta.kind, base);
}

/**
 * What a creature LOOKS like, which is not what its note says.
 *
 * `note` is a GM's line about what the thing does in a fight -- *sergeants: the first thing in the
 * Horde that gives an order* -- and it was being handed to an artist as the only description of
 * the body. Role words carry their own pictures: *a general* arrived with banners, *sergeants*
 * with human military bearing, and *a goblin with a shell* arrived with a goblin's head on it.
 *
 * So `look` is separate and wins where it exists. A creature without one falls back to its note,
 * which is what every piece outside the Horde still does.
 */
function lookOf(creature) {
  return creature.look || creature.note || "";
}

/**
 * Who the person in the picture is, for the creatures that are people.
 *
 * **A rule in the capsule cannot produce variety, and that is the whole reason this exists.** Each
 * piece is a separate request with no sight of any other, so *vary who you draw* has nothing to
 * vary against: the model answers it the same way every time, and twenty-four human tokens came
 * back as one pale man in twenty-four costumes.
 *
 * So the variation is **assigned** rather than asked for. Each creature gets one sex, one
 * ancestry and one age, and the subject states them as fact alongside the rest of its description
 * -- which is the form the prompt book already trusts, because *drawn sitting, watching* and
 * *no wings at all* are obeyed and *be interesting* is not.
 *
 * **Hashed from the creature's kind and not counted off the roster**, which matters more than it
 * looks: an index into the list would mean that inserting one human silently reassigns every
 * human after it, so a token already drawn and already through the gate would no longer match the
 * prompt that would be sent for it -- and nothing in the gate can measure a face against a
 * sentence. Hashing the kind makes a creature's casting a property of the creature.
 *
 * Lengths are 7, 13 and 4: coprime, so the three axes do not travel together and the same
 * ancestry does not keep arriving at the same age.
 */
const SEX = ["a woman", "a man", "a woman", "a man", "a woman", "a man", "a woman"];
/*
 * **Fifteen, and three of the fifteen are new because the set had too few westerners in it.**
 *
 * The first list ran to thirteen and three of those were European -- Mediterranean, Nordic,
 * Slavic -- which is 23% of the list and came out at 27% of the cast. That reads as a correction
 * overshooting rather than as a port city: pale northern Europeans belong in this set as much as
 * anybody, and a set that has nearly none of them has swapped one default for a different
 * flatness.
 *
 * **The length matters and is not free.** Seven, fifteen and four are pairwise coprime, so the
 * three axes do not travel together -- a creature that gets the fourth ancestry does not always
 * get the fourth age. Fourteen would have shared a factor with the seven sexes and sixteen with
 * the four ages, and either would have locked two axes into step. Fifteen and seventeen were the
 * two lengths available; fifteen is the one that needed two names rather than four.
 */
const ANCESTRY = [
  "West African", "Levantine", "South Asian", "East Asian", "North African", "Mediterranean",
  "Persian", "Nordic", "Horn of Africa", "Slavic", "Southeast Asian", "Caribbean",
  "Central Asian", "Northwest European", "Germanic"
];
const AGE = ["in their twenties", "in their thirties", "in their forties", "past fifty"];

/* How long a creature's subject may run before the base's half of it is cut. Four hundred was the
 * figure when every look was one sentence; the humans arrive with three. */
const CAP = 480;

const HUMAN = new Set(content.HUMAN_KINDS);
const hash = text => [...text].reduce((h, c) => (h * 31 + c.codePointAt(0)) % 1000003, 7);

/**
 * One person, assigned from a seed string: sex, ancestry and age.
 *
 * **Exported because a card needs this as much as a token does, and only the token had it.** A
 * card's capsule listed the ancestries of the city and banned the pale default by name, which is
 * a distribution asked of a single request that cannot see the other five hundred -- the same
 * thing that produced twenty-four pale men before the tokens were assigned, running the other
 * way. Every card steered away from the named default, so the default nearly disappeared.
 *
 * A list in a capsule cannot produce a spread. Only an assignment can, and an assignment has to
 * be made out here where something can count it.
 */
export function castLine(seed) {
  const h = hash(seed);
  return `${SEX[h % 7]} of ${ANCESTRY[(h >> 1) % ANCESTRY.length]} appearance, `
    + `${AGE[(h >> 5) % 4]}`;
}

export function castOf(creature) {
  const kind = creature.system?.kind ?? "";
  const human = HUMAN.has(kind) || HUMAN.has(BASE_OF.get(kind)?.system?.kind);
  if (!human) return "";
  return `Draw this one as ${castLine(kind)} -- that is fixed, not a suggestion.`;
}

export function creatureBrief(creature) {
  const s = creature.system ?? {};
  const bits = [];
  /* Only what the entry actually says. A character has no `speed` and no `armorBase` -- those are
   * a creature's fields, and the starter Warrior is the one piece in this group that is not one --
   * so the line leaves them out instead of printing a question mark somebody has to ask about. */
  const health = s.health?.base ?? s.health?.value;
  if (health !== undefined) bits.push(`Health ${health}`);
  if (s.armorBase) bits.push(`armour ${s.armorBase}`);
  if (s.speed !== undefined) bits.push(`speed ${s.speed}`);
  if (creature.equipped?.length) bits.push(creature.equipped.join(", "));
  /*
   * A variant leads with its base, so the picture is the same animal before it is a different
   * one. The cap is 150 for a card's own line and generous here: a token's subject is the only
   * description the artist gets, and two creatures that look alike is the one failure a token
   * cannot survive.
   */
  const base = BASE_OF.get(s.kind);
  /* A variant describes only what makes it different; the base describes the animal. Where a
   * variant has written its own `look` that wins, and otherwise its note is the difference. */
  const base_look = base ? lookOf(base) : "";
  const own = creature.look || creature.note || "";
  /*
   * **The cap falls on the BASE's description and never on the variant's own.**
   *
   * The Mob is why, and it was a live defect rather than a tidy-up. Its whole point is that it is
   * a crowd -- *drawn as a press of bodies*, *the one creature in the roster that is deliberately
   * more than one body* -- and every word of that sat past the four-hundredth character, so what
   * actually reached the model was a Townsfolk's *one ordinary working person* and an ellipsis. A
   * variant exists for the part that says how it DIFFERS; the base is context, and context is
   * what gives ground when there is not room for both.
   *
   * Where even the naming will not fit, the base's description goes entirely rather than being
   * cut off mid-clause: *a Townsfolk, and this one ...* still says which animal it is.
   */
  const clip = (text, room) => room >= text.length ? text : `${text.slice(0, room - 3)}...`;
  const stats = bits.join(" \u00b7 ");
  const room = CAP - stats.length - 3;
  let look;
  if (!base) look = clip(lookOf(creature), room);
  else {
    const left = room - `A ${base.name}: `.length - " This one ".length - own.length;
    look = left < 60
      ? `A ${base.name}, and this one ${own}`
      : `A ${base.name}: ${clip(base_look, left)} This one ${own}`;
  }
  const line = [stats, look].filter(Boolean).join(" \u2014 ");
  /* The casting is appended AFTER the cap for the same reason. It is the one part of a subject
   * that is useless truncated -- *a woman of Levantine appe...* says nothing -- and being last is
   * what would have put it first against the wall. */
  const cast = castOf(creature);
  return cast ? `${line} ${cast}` : line;
}

/*
 * Every creature in the roster, bases and variants alike, because a token's whole job is telling
 * one from another on the map. The deck-back argument -- *forty-seven kinds would be forty-seven
 * pieces of art* -- points the other way here: a back says which deck, and one picture can serve
 * every creature that has not earned its own; a token says WHICH GOBLIN, and a Shaman that looks
 * like an Archer is a token that has failed at the only thing it does.
 */
export const CREATURES = expandRoster(content.ROSTER, content.VARIANTS);

/* -------------------------------------------- */

/**
 * The groups, in the order they are worth drawing.
 *
 * **Ordered by what unblocks play**, not by size. The starter decks are what a first session
 * touches; the 150 items are the largest group and the least urgent, because an item is named on a
 * sheet far more often than it is looked at.
 */
const sigs = Object.fromEntries(Object.entries(content)
  .filter(([key]) => key.endsWith("_SIGNATURES")));

/*
 * Exported, because the prompt book in `art-prompts.mjs` walks exactly this list.
 *
 * **Two generated files reading one GROUPS cannot disagree**, which is the whole reason the
 * second one imports rather than copies: a brief that lists 501 pieces beside a prompt book that
 * writes 494 prompts is a second printer, and this project has paid for that mistake twice.
 */
/*
 * **What the brief says about each shelf, and nothing about where its content is.**
 *
 * The pairing of a directory with the content that goes in it moved to `module/art.mjs`, because
 * the game derives its own picture paths from it now and three readers of one table cannot
 * disagree. What is left here is the prose -- the title and the reason the group matters -- which
 * is this document talking and has no business in the engine.
 *
 * Keyed by shelf, so the two that share `tokens/` are still two entries: a creature's token and the
 * starter Warrior's are the same kind of picture and want the same words said differently.
 */
const PROSE = {
  "cards/starter": { title: "The starter Warrior's deck",
    why: "What a first session plays with. Draw these first: ten cards is a playable game." },
  /*
   * **[FOUND 2026-11-09] Four shelves had no entry here and printed `## undefined` as their
   * heading**, two of them for months: `cards/ritual` and `cards/harm` were added to `SHELVES`
   * and never given a title, and the brief is the document an artist reads. A shelf without one
   * is now a failure rather than a heading nobody could parse.
   */
  "cards/shade-starter": { title: "The starter Shade's deck",
    why: "The other half of a first session, and the half that was on no shelf at all until a "
      + "reader noticed ten blank rows in the handbook. Same brief as the Warrior's: ten cards, "
      + "and the pair of them is a playable game for two people." },
  "cards/twist": { title: "The twist deck",
    why: "**The GM is somebody at the table**, and this is the deck they draw from more often "
      + "than any player draws from anything. One person seeing all thirty in a session is a "
      + "reason to draw them, not a reason to skip them, which is the argument this list used to "
      + "get backwards. A twist is a complication rather than an attack: show the cost arriving, "
      + "not a weapon." },
  "cards/ritual": { title: "The ritual twist deck",
    why: "Turned face up in front of four people who have been working toward this for a "
      + "session, so it is the one GM card with a real audience. Every one of them is the thing "
      + "the party is trying to undo pushing back: the injury, the curse or the rot answering." },
  "cards/fate": { title: "The fate deck",
    why: "**The deck every outcome in the game goes through**, and the only one drawn from on "
      + "somebody else's turn as well as your own. It was argued off this list once, on the "
      + "grounds that twenty cards which are a number want a design rather than twenty pictures "
      + "\u2014 and it is not twenty. It is **eight faces**, the same ratio the twist deck is drawn "
      + "at.\n\n**The number is the information and the picture must not compete with it.** A fate "
      + "card is read in a row at tiny size and the player has to see `+1` the instant it lands, "
      + "so these are a **ground with weight** rather than eight scenes.\n\n**Draw them in order, "
      + "because the shelf is a gradient.** How much ink a card carries says how much the card "
      + "does: *Zero* is nearly bare paper and is the commonest card in the deck, the ones and "
      + "twos are a stroke and a stroke gone wrong, and **Miss and Critical are the only two that "
      + "are really pictures** \u2014 which they have earned, because they are the two that "
      + "reshuffle the deck and decide the fight. No other shelf here reads in an order." },
  "cards/harm": { title: "Wounds and Taint",
    why: "The only cards in the game a player does not want, which makes them the ones a player "
      + "looks at hardest. They arrive in a deck that was theirs and stay there, so they have to "
      + "read as an intrusion at a glance, from across the table, in somebody else's hand." },
  "cards/common": { title: "The common pool",
    why: "Six cards every Way draws on, so each one is seen by every character in the game." },
  "cards/npc": { title: "NPC intent cards",
    why: "Face-up on the table during a fight, which makes them the art players stare at longest. "
      + "**One pool, and every creature in the world draws the subset it has earned** "
      + "(core-rules 9) \u2014 so a picture here is seen behind a goblin, a troll and a dragon, and "
      + "wants to be the SHAPE of the move rather than a portrait of whoever is making it. "
      + "*Close In* is a thing closing in." },
  "cards/shade": { title: "Way of Shade — pool",
    why: "The minor-node cards of a built Way." },
  "cards/strength": { title: "Way of Strength — pool",
    why: "The minor-node cards of a built Way." },
  "cards/way": { title: "Way cards",
    why: "Written for the reach weapons and shared between Ways." },
  "cards/skill": { title: "Skill cards",
    why: "The scene tray's hand: four of these are face up whenever nobody is fighting." },
  "cards/wild": { title: "Wild Magic",
    why: "Drawn on a Wild, so each one is a surprise and wants to look like one." },

  "signatures/shade": { title: "Signatures — Way of Shade",
    why: "A title's own piece of content, and what its node wears in the levelling graph." },
  "signatures/strength": { title: "Signatures — Way of Strength",
    why: "A title's own piece of content, and what its node wears in the levelling graph." },
  "signatures/mind": { title: "Signatures — Way of Mind",
    why: "Eleven, not twelve: *Step Through* is in the Shadow formulas below." },
  "signatures/faith": { title: "Signatures — Way of Faith",
    why: "A god's first and defining miracle." },

  "spells/elemental": { title: "Formulas — Elemental",
    why: "The combo pair and its two readers: the oldest spells in the game." },
  "spells/shadow": { title: "Formulas — Shadow", why: "Pays in a permanent Wild card." },
  "spells/mind": { title: "Formulas — Way of Mind pool",
    why: "Blood Magic and Spiritualism, handed over by minor nodes." },
  "spells/faith": { title: "Miracles — Way of Faith pool",
    why: "Twelve gods' lesser miracles, handed over by minor nodes." },

  "conditions": { title: "Conditions",
    why: "**A condition looks like a deck to a player and each one looks like a card**, which is "
      + "the whole of the case: the pile sits face down beside the action deck wearing a back of "
      + "its own, and until today every card in it was blank paper with a word on it. They were "
      + "on no shelf, so the brief reported the game fully drawn while twenty-five cards a player "
      + "reads every fight had nothing on them.\n\n**Draw the condition and never the sufferer.** "
      + "One picture serves a goblin, a dragon and the player, so a figure in the frame is the "
      + "wrong figure for three quarters of the table \u2014 the same constraint the intent deck "
      + "works under. Each of these is one object or one gesture, close, with the body kept out "
      + "or cropped to a limb. It is also the only way twenty-five of them do not arrive as "
      + "twenty-five people pulling faces." },
  "features": { title: "Features",
    why: "Always on, so a feature's picture is on the sheet for the character's whole life." },
  "items": { title: "Items",
    why: "The largest group and the least urgent: an item is named on a sheet far more often than "
      + "it is looked at. A generic picture per KIND would serve until there is art per item." },
  "items/npc": { title: "NPC gear",
    why: "Tuned separately from player gear and never offered in a player's picker." },
  "items/natural": { title: "Natural weapons",
    why: "A mandible, a sting, a tail club and a breath are items like any other \u2014 grown "
      + "rather than carried, which is what the `natural` tag means and why none of them can be "
      + "disarmed or looted. They sit on a creature's sheet, so they want the same picture an "
      + "item wants." },

  "tokens": { title: "Creature tokens",
    why: "**The one piece of art per creature**, and the only group here that is not a card. It "
      + "goes in both of Foundry's slots \u2014 the portrait on the sheet and the token on the map "
      + "\u2014 because they are the same creature and two files is one to forget. Health, armour, "
      + "speed and gear are given so the picture can be the right size and carry the right "
      + "weapon; the line after the dash is the creature's own description, written when it was.", brief: creatureBrief },
  "tokens/warrior": { title: "The starter Warrior",
    why: "The pregenerated character a first session plays. One token, same shape as a "
      + "creature's, and the only player-side one in the brief: a real party arrives with its own.", brief: creatureBrief }
};

/**
 * Every group in the brief: the shelf that says where its pictures live, and the prose that says
 * why they are worth drawing.
 *
 * **Exported, because the prompt book walks exactly this list.** Two generated files reading one
 * table cannot disagree, which is the whole reason the second one imports rather than copies: a
 * brief that lists 588 pieces beside a prompt book that writes 584 prompts is a second printer,
 * and this project has paid for that mistake twice.
 */
export const GROUPS = SHELVES.map(shelf => ({ ...shelf, ...PROSE[shelf.key] }));


/* -------------------------------------------- */

const lines = [];
const push = (...rows) => lines.push(...rows);

let total = Object.keys(content.DECK_BACKS).length;
/*
 * **"Wired up" used to mean somebody had typed the path, and nobody ever had.** It now means what
 * a reader of this document actually wants to know: that the game will show the picture. Both
 * halves ask the engine the same question Foundry asks it -- `backOf` -- rather than
 * looking at a field, so a piece counted here is a piece that appears in play.
 */
/**
 * **Is the file actually there?** `artIn` cannot answer this and was never asking: it is the
 * engine's question, *does this card know where its picture lives*, and it is used to decide
 * whether to put one on a card at all. Delivery is a question about a filesystem, so it is asked
 * of the filesystem -- and asked through the same `slug` the game uses, because the one time this
 * check was written with a hand-rolled slug it reported thirty-one missing files that were all
 * present under their real names. Every apostrophe in the book was a false positive.
 */
const ART_DIR = path.join(root, "art");
const onDisk = (group, entry) =>
  fs.existsSync(path.join(ART_DIR, group.dir, `${slug(entry.name)}.${DELIVERY.format}`));

const refusedNames = new Set(Object.keys(ART_REFUSED));
const state = (group, entry) => onDisk(group, entry) ? "drawn"
  : refusedNames.has(entry.name) ? "refused" : "pending";

let drawn = Object.keys(content.DECK_BACKS).filter(k => backOf(k)).length;
let refused = 0, pending = 0;
const refusedRows = [];
for (const group of GROUPS) {
  total += group.list.length;
  for (const entry of group.list) {
    const s = state(group, entry);
    if (s === "drawn") drawn++;
    else if (s === "refused") { refused++; refusedRows.push([group, entry]); }
    else pending++;
  }
}

/*
 * **A refusal nobody declared is a failure, not a state.** If a brief comes back blocked and is
 * not in ART_REFUSED, this file says so by name rather than counting it quietly as pending --
 * otherwise the whole mechanism is optional and the queue silently absorbs it again.
 */
const undeclared = [...refusedNames].filter(n =>
  !GROUPS.some(g => g.list.some(e => e.name === n && state(g, e) === "refused")));

push(
  "# Art list",
  "",
  `**${total} pieces**, of which **${drawn}** are drawn`
  + `${refused ? `, **${refused}** refused` : ""}`
  /*
   * **Always, including zero.** This read `${pending ? ... : ""}` and vanished when the queue
   * emptied -- which is the good state, and the one state the check over it could not read: it
   * looks for `**N** still to shoot`, found nothing, and failed the hour everything was finally
   * drawn. A line that disappears when the answer is good is a line whose absence somebody has
   * to interpret, and the Gaps section in `art-prompts.mjs` had the same bug on the same day.
   */
  + ` and **${pending}** still to shoot. Generated from the game's own content `
  + "by `test/art-list.mjs` — regenerate it rather than editing it, or it will disagree with the "
  + "game the first time somebody adds a card. **Drawn means the file is on the disk**, not that "
  + "the game knows where it would go: every piece in content knows that, so the older count was "
  + "always the total.",
  "",
  "## What to supply",
  "",
  "| | |",
  "|---|---|",
  "| Ratio | **2:3** |",
  "| Size | **640 × 960** (2×, for a 150px card on a retina display) |",
  `| Format | **\`.${DELIVERY.format}\` at quality ${DELIVERY.quality}**, and nothing else: the `
  + "generated original is transcoded and dropped. No transparency needed: the art is a "
  + "full bleed |",
  "| Crop | **Cover, never letterbox.** Art is supplied at the card's own ratio, so a crop is a rounding error |",
  "| Safe area | Keep the subject off the **top 17%** and **bottom 32%**: the name sits on one and the halves on the other |",
  "",
  "**Nothing is cropped.** The card is 2:3 as well, so art supplied at 2:3 fills it exactly. A "
  + "file at some other shape still works &mdash; it is cover-cropped rather than letterboxed "
  + "&mdash; but it will lose whichever dimension is long, so compose at 2:3 and nothing is lost.",
  "",
  "**The art goes behind the face, not instead of it.** A face is rendered from data so that a "
  + "condition can switch an individual icon off at runtime, so every card still draws its own name, "
  + "halves and reaction row over the picture. A wash of the paper colour at 60% sits between "
  + "the two, so **count on four tenths of what you draw reaching the eye** and compose for a "
  + "subject that survives it: a drawing that depends on fine low-contrast detail will not. "
  + "That is also "
  + "why there is no deadline: a card with no art looks exactly as it did before there were "
  + "pictures, and the catalogue improves one file at a time.",
  "",
  "**Where files go.** Anywhere in the world's files; the path is what matters. The suggested paths "
  + "below keep a group together, and `cardrpg/art/` is as good a root as any:",
  "",
  "```",
  "cardrpg/art/cards/starter/strike.webp",
  "cardrpg/art/signatures/shade/the-opening.webp",
  "```",
  "",
  "**How a path reaches the game.** Add `art: \"...\"` to the piece's definition in "
  + "`module/content.mjs`. No schema change is needed, because Foundry already has a slot for "
  + "every one of these and this system used none of them: **a Card face's `img`** for a card, "
  + "**an Item's `img`** for an item, feature, weapon or piece of gear, and **an Actor's `img` "
  + "plus its prototype token's texture** for a creature — one file in those last two, which is "
  + "why a creature is one piece and not two.",
  "",
  "> **This was true of cards and false of everything else until today.** An item's `art` fell "
  + "into the rest of its definition and settled in `system.art`, which nothing reads, so 176 of "
  + "the pieces in this brief had a path in content that no document ever wore. The levelling "
  + "graph reads `art` straight out of content and draws it on a node, which is why a feature's "
  + "picture appeared there and nowhere else, and why nobody noticed.",
  "",
  "Anything under `icons/svg/` is ignored on purpose: that is Foundry's own placeholder set, and a "
  + "generic bag icon stretched across a card is worse than no art at all.",
  "",
  "## What to supply — tokens",
  "",
  "**A token is a different shape from a card**, and the groups below marked *token* follow this "
  + "table instead of the one above. A card is a landscape you look at; a token is a creature seen "
  + "from the table, sitting on a square of map with other tokens beside it.",
  "",
  "| | |",
  "|---|---|",
  "| Ratio | **1:1** |",
  "| Size | **512 × 512** |",
  `| Format | **\`.${DELIVERY.format}\` at quality ${DELIVERY.quality}**, and **transparency is `
  + "required**: a token sits on the map, not in a frame, so a background is a square of the "
  + "wrong colour around the creature |",
  "| Framing | **The creature fills the square**, head to foot or nose to tail. Nothing is printed "
  + "over a token, so there is no safe area — but Foundry draws a health bar under it and a "
  + "nameplate below that, and both sit outside the image |",
  "| Facing | **Top-down or three-quarter, consistently.** Whichever the table picks, every "
  + "creature wants to match: one top-down dragon among forty portraits reads as a mistake |",
  "",
  "**One picture, both slots.** Foundry keeps a portrait on the actor and a token on the map, and a "
  + "creature wants the same file in each — the same argument a deck back makes. A separate "
  + "portrait is a field to add the day somebody wants one, not a field to leave empty until then.",
  "",
  "## What does not need art",
  "",
  /*
   * **Fate left this list on 2026-11-13, and the entry is worth reading before it goes.**
   *
   * It said *twenty cards that are a number and a reshuffle marker; they want a design, not
   * twenty illustrations* -- and the arithmetic was wrong in the one place that mattered. It is
   * **eight faces over twenty cards**, the ratio the twist deck is already drawn at. The true half
   * of it survives as the whole brief for the new shelf: the number is the information, so the
   * pictures are a ground with weight rather than eight scenes.
   */
  "- **Wounds and Taint.** Two faces, fixed, and both are meant to read as damage rather than as "
  + "content. One picture each at most.",
  `- **The critical deck.** ${content.CRIT_EFFECTS.length} faces, `
  + `${content.CRIT_EFFECTS.reduce((n, e) => n + (e.copies ?? 1), 0)} cards, and it needs neither `
  + "faces nor a **back**. A card is drawn face up the instant a Critical lands and read out, so "
  + "it is never face down in front of anybody — which is the same reason hands, discards and "
  + "Spent piles have no back. A back is for a deck somebody looks at while wondering.",
  "- **The levelling graph's nodes.** A node wears the art of what it hands over, so drawing a "
  + "Signature draws its node too. Nothing needs art of its own.",
  `- **The ${content.MONSTER_TAGS.length} tagged creatures.** Elves, trolls, dragons and the rest `
  + "are in the content as a name and a list of capabilities, with no numbers and no actor — so "
  + "there is nothing yet for a picture to be of. They arrive in the brief when they arrive in the "
  + "game.",
  ""
);

/*
 * The backs, first, because a back is on the table from the first second of play and a face only
 * when somebody is holding one. Five pictures against three hundred, and the five are the ones a
 * table looks at all evening.
 */
export const backs = Object.entries(content.DECK_BACKS);
push(
  "## Deck backs — draw these first",
  "",
  "**A back is one picture per deck, not one per card**, and it does one job: it says which deck a "
  + `face-down card came from. ${backs.length} pictures against ${total - backs.length} faces `
  + "— and these are what a table looks at all evening, since a deck is face down from the first "
  + "second of play.",
  "",
  `**${backs.length} pieces**${backs.filter(([k]) => backOf(k)).length
    ? `, ${backs.filter(([k]) => backOf(k)).length} wired up` : ""}. `
  + "Same 2:3 and 640 × 960 as a face, and **no safe area**: nothing is printed over a back, so "
  + "the whole card is yours.",
  "",
  "| | Deck | What it is for | File |",
  "|---|---|---|---|"
);
for (const [key, back] of backs) {
  push(`| ${backOf(key) ? "✓" : " "} | **${back.label}** | ${back.note} `
    + `| \`backs/${slug(key.replace(/\./g, "-"))}.webp\` |`);
}
push(
  "",
  "**Wound and Taint have no back of their own, deliberately.** Both go *into* the action deck, "
  + "and a Wound you could see coming would not be a Wound — they wear the action back like "
  + "everything else in there, which is the whole threat.",
  "",
  "**Hands, discards and Spent piles have no back either.** A hand is face up to its owner and a "
  + "discard is face up to the table, so a back on one would be art nobody ever sees.",
  "",
  `**One intent back serves all ${CREATURES.length} creatures**, and no kind has one of its own. `
  + "The argument for a goblin back — that a goblin's intents should be recognisable across the "
  + "table as a goblin's — is a good one, and it loses to arithmetic. **Every creature in the "
  + "roster is its own kind**, variants included: a Goblin Warrior is not a goblin as far as this "
  + `lookup is concerned. So a back per kind is ${new Set(CREATURES.map(c => c.system.kind)).size}`
  + " pieces of art, bought to tell a player which creature a deck sitting in front of that "
  + "creature belongs to. The builder still asks for a kind's own back before falling back to the "
  + "common one, so a future exception costs one entry and no code.",
  ""
);

for (const group of GROUPS) {
  if (!group.list?.length) continue;
  const have = group.list.filter(e => state(group, e) === "drawn").length;
  const describe = group.brief ?? brief;
  push(
    `## ${group.title}`,
    "",
    `${group.why}`,
    "",
    `**${group.list.length} piece${group.list.length === 1 ? "" : "s"}**`
    + `${have ? `, ${have} wired up` : ""}. `
    /* Which of the two spec tables this group follows, said per group rather than once at the
     * top: a brief that states the shape only in its header is a brief somebody draws a 2:3
     * token from. */
    + `${group.kind === "token" ? "**1:1, 512 × 512, transparent.** " : ""}`
    + `Suggested path: \`cardrpg/art/${group.dir}/\``,
    "",
    "| | Name | What it is | File |",
    "|---|---|---|---|"
  );
  for (const entry of [...group.list].sort((a, b) => a.name.localeCompare(b.name))) {
    const mark = { drawn: "✓", refused: "✗", pending: " " }[state(group, entry)];
    push(`| ${mark} | **${entry.name}** | ${describe(entry) || "—"} `
      + `| \`${group.dir}/${slug(entry.name)}.webp\` |`);
  }
  push("");
  /*
   * **The items that are missing from the table above on purpose**, said under the group they
   * would otherwise be in. Four items out of a hundred and fifty are absent from a list that
   * calls itself the whole of the game's art, and a reader who notices deserves the reason in
   * the same place rather than in a source comment they will never open.
   */
  if (group.dir === "items" && Object.keys(content.COUNTERFEIT).length) {
    push(
      `**${Object.keys(content.COUNTERFEIT).length} more items are on this shelf and are not `
      + "commissions.** Each is a cursed forgery of one honest item, and being impossible to "
      + "tell from it is the whole of what it is: the picture it wears is that item's picture, "
      + "and it is not drawn twice. `COUNTERFEIT` in `module/content.mjs` is where the pairing "
      + "is declared.",
      "",
      "| Counterfeit | Found as | Wears the picture of | File |",
      "|---|---|---|---|"
    );
    for (const [fake, real] of Object.entries(content.COUNTERFEIT)) {
      const it = content.ITEMS.find(i => i.name === fake);
      push(`| **${fake}** | ${it?.unidentifiedName ?? "—"} | ${real} `
        + `| \`${group.dir}/${slug(real)}.webp\` |`);
    }
    push("");
  }
}


/*
 * **The refusals, last, with the reason in the brief itself.**
 *
 * In the brief rather than only in `art.mjs` because the brief is what somebody has open when they
 * are working through the queue, and a piece marked **x** in a table with no explanation anywhere
 * near it is worse than one marked pending.
 */
if (refusedRows.length) {
  push(
    "## Refused",
    "",
    "Briefs an image model would not draw, marked **x** in the tables above. A refusal is a "
    + "**state**, not a gap: without this section a blocked piece is indistinguishable from one "
    + "nobody has reached, so it sits in the queue looking pending, gets re-run, and is refused "
    + "again. Declared in `ART_REFUSED` in `module/art.mjs`.",
    "",
    "Each of these needs its **brief** changed rather than another attempt at the same words. The "
    + "brief is generated from the card's rules text, so that is where the rewrite goes — and if "
    + "the rewrite makes the card read better, which it generally does, the refusal paid for "
    + "itself.",
    "",
    "| Name | File | Why it was refused |",
    "|---|---|---|"
  );
  for (const [group, entry] of refusedRows)
    push(`| **${entry.name}** | \`${group.dir}/${slug(entry.name)}.${DELIVERY.format}\` `
      + `| ${ART_REFUSED[entry.name]} |`);
  push("");
}

/*
 * **A name in ART_REFUSED that is not refused any more.** Either its file arrived, in which case
 * the entry is stale and should go, or it names nothing in content at all. Said out loud rather
 * than ignored, because a refusal list that quietly keeps dead entries is a list nobody trusts.
 */
if (undeclared.length) {
  push(
    "> **Stale refusals.** `ART_REFUSED` names " + undeclared.map(n => `**${n}**`).join(", ")
    + ", which " + (undeclared.length === 1 ? "is" : "are")
    + " no longer refused — the file arrived, or the name matches nothing in content. Remove "
    + (undeclared.length === 1 ? "it" : "them") + " from `module/art.mjs`.",
    ""
  );
}

/*
 * Written when run as a script, not when imported. The validator imports this for `slug`, because
 * the rule "a path is the slug of the name" has to be checked with the generator's own slug: a
 * copy of a rule is a second rule, and two rules drift.
 */
if (process.argv[1] && process.argv[1].endsWith("art-list.mjs")) {
  fs.writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${total} pieces, ${drawn} drawn, `
    + `${refused} refused, ${pending} to shoot`);
  for (const name of undeclared) console.log(`  stale refusal: ${name}`);
}
