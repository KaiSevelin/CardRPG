/**
 * Write the handbook's three reference chapters: items, features and spells.
 *
 * Run with: node test/handbook.mjs
 *
 * **Why this is generated and the rest of the handbook is not.** The prose in
 * `rules/players-handbook.md` is written for a reader and changes when the rules change, which is
 * rare and deliberate. These three chapters are three hundred rows of catalogue that change every
 * time somebody prices an item or writes a spell, and a catalogue copied by hand is a catalogue
 * that is wrong by the end of the week. This project has paid for that lesson twice: the art brief
 * and the prompt book both sat stale while every count in the suite agreed, because a count cannot
 * see a sentence.
 *
 * It writes between markers and leaves everything else in the file alone, so the handbook stays one
 * document a player can read front to back rather than three.
 */
import fs from "node:fs";
import path from "node:path";
import * as CONTENT from "../module/content.mjs";
const { ITEMS, FEATURES } = CONTENT;
import { SPELLS, GRAPH } from "../module/graph.mjs";
import { CARDRPG } from "../module/config.mjs";

const OUT = path.join(import.meta.dirname, "..", "..", "..", "rules", "players-handbook.md");

/*
 * **The label tables, read rather than retyped.** Several things an item carries are vocabulary
 * keys rather than prose -- `shotEffect: "ignoresCover"`, `boundary: "combat"` -- and the engine
 * already turns each into a word through `CARDRPG` and the lang file. Resolving them the same way
 * keeps one vocabulary: a shot effect added to config without a string shows up here as the bare
 * key rather than as silence, and the suite pins the grant words so a new grant cannot slip in.
 */
const LANG = JSON.parse(fs.readFileSync(
  path.join(import.meta.dirname, "..", "lang", "en.json"), "utf8"));
/* The lang file is FLAT -- "CARDRPG.Shot.IgnoresCover" is one key, not three levels of object. */
const say = key => (key ? LANG[key] ?? key : "");

/** What a grant is called on the sheet. The keys are `grants.mjs`'s CHARACTER_GRANTS. */
const GRANT_WORDS = {
  health: "CARDRPG.Health", handSize: "CARDRPG.HandSize", carry: "CARDRPG.Carry",
  deckMax: "CARDRPG.DeckMax", spellSlots: "CARDRPG.SpellSlots", armor: "CARDRPG.Armor"
};

/*
 * **The rules documents, named by the directory rather than by a list.**
 *
 * Content cites the design docs in its own prose, because a spell's description is written for
 * whoever maintains the rule: *"The condition shuffles the card in by itself (core-rules 6)"*. The
 * handbook must not print those, and six were reaching players, who have no such file and cannot
 * follow the reference. Derived from the filenames so that a new rules document cannot introduce a
 * leak the way the last one did, and so this list cannot go stale on its own.
 */
const DOCS = fs.readdirSync(path.join(import.meta.dirname, "..", "..", "..", "rules"))
  .filter(f => f.endsWith(".md") && f !== "players-handbook.md")
  .map(f => f.replace(/\.md$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const CITATION = new RegExp(`\\s*\\((?:${DOCS.join("|")})[^)]*\\)`, "g");

/** Content writes descriptions as HTML, and a handbook table wants a sentence. */
const plain = html => String(html ?? "")
  .replace(/<[^>]+>/g, " ")
  .replace(CITATION, "")
  /* An em dash becomes a comma, and takes the space in front of it with it: " &mdash; " left
   * " , " behind in twenty-three rows. The handbook does not print em dashes. */
  .replace(/\s*(?:&mdash;|—)\s*/g, ", ").replace(/&[a-z]+;/g, " ")
  .replace(/\s+/g, " ")
  /* Tags are stripped to a SPACE, so "how</strong>," arrives as "how ,". */
  .replace(/\s+([,.;:!?])/g, "$1").trim();

/** "1 card", "11 cards". Counted things are printed in a dozen places and one of them read "1 cards". */
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** A table cell may not contain the character that ends a table cell. */
const cell = s => plain(s).replace(/\|/g, "/");

/* -------------------------------------------- */
/*  Items                                       */
/* -------------------------------------------- */

/**
 * What an item DOES: every field the entry can carry an effect in.
 *
 * **[FOUND 2026-11-09] It read four fields of the eight, so sixty of a hundred and fifty items
 * printed an empty cell and four printed the word `undefined`.** *Sessyfyn's Tear* is the clearest
 * case: a three-thousand-gold relic whose `active` redraws any fate card on the field and whose
 * `text` is the obligation it costs, and the handbook said it did nothing at all. The reader's
 * conclusion from a blank cell is not *the generator missed a field*, it is *this item is a
 * trinket* -- so an omission here does not read as missing, it reads as an answer, which is the
 * same trap the stale art brief set.
 *
 * The eight places an effect can live, and the four that were read: `verbs` ✓, `armor` ✓,
 * `bonus` ✓, `shot` ✓, and `grants`, `active`, `text`, `curse`, `shotEffect` ✗.
 *
 * **A bonus names EITHER a verb or an approach**, never both: `{ verb: "cast", value: 1 }` on the
 * Focus Pendant and `{ approach: "shadow", value: 2 }` on the Lockpicks. Reading `bonus.approach`
 * unconditionally is what printed `undefined +1` on the Fine Longsword, the Focus Pendant, the
 * Warden's Seal and the Gauntlet of the Open Palm.
 *
 * `consumed` is deliberately NOT printed: the kind heading above the row already says Consumable,
 * Potion, Poison or Ammunition, and forty-six rows saying *one use* under a heading that says so
 * is noise rather than information.
 */
function does(item) {
  const cap = s => `${String(s)[0].toUpperCase()}${String(s).slice(1)}`;
  /* The numbers first, comma-joined, because a player scanning a long table wants those. */
  const stats = [];
  /*
   * A verb line is a number AND a qualification, and only the number was read. Forty-eight lines
   * carry prose that is the whole difference between two rows reading alike: a Mace and a Spear
   * are both *Strike 3*, and one ignores a point of armour while the other throws three squares.
   * A null value with a text is an effect and not an absence -- the Smoke Bomb's entire effect is
   * `use: verb(null, { text: "You become Invisible (1)" })`.
   */
  for (const [verb, line] of Object.entries(item.verbs ?? {})) {
    const number = line?.value !== null && line?.value !== undefined;
    if (!number && !line?.text) continue;
    const head = number ? `${cap(verb)} ${line.value}` : cap(verb);
    stats.push(!line.text ? head
      : number ? `${head} (${plain(line.text)})` : `${head}: ${plain(line.text)}`);
  }
  if (item.armor) stats.push(`Armor ${item.armor}`);
  const b = item.bonus;
  if (b && (b.value || b.range)) {
    const what = b.verb ? cap(b.verb) : (b.approach ?? "");
    const much = b.value ? `+${b.value}` : `+${b.range} range`;
    stats.push(`${`${what} ${much}`.trim()}${b.situation ? ` (${b.situation})` : ""}`);
  }
  /*
   * `shot.condition` is the mechanical key and `text` is the authored sentence, and on all seven
   * pieces that carry both the sentence says it better: `offBalance` against *The target is
   * Off-Balance (1). No save.* So the prose wins where there is prose, and the key is the fallback
   * for a piece written without any -- resolved to its label, because `offBalance` is not a word.
   */
  if (item.shot?.condition && !item.text) {
    stats.push(say(CARDRPG.conditions[item.shot.condition]?.label) || item.shot.condition);
  }
  /* A grant is a number too, and the words come from the lang file the sheet labels itself from. */
  for (const [key, n] of Object.entries(item.grants ?? {})) {
    stats.push(`${say(GRANT_WORDS[key]) ?? cap(key)} +${n}`);
  }

  /* Then the sentences, which are what the empty cells were hiding. */
  const prose = [];
  if (item.shotEffect) prose.push(say(CARDRPG.shotEffects[item.shotEffect]?.label));
  if (item.active?.text) {
    const every = item.active.boundary ? `once per ${say(CARDRPG.recharges[item.active.boundary])}`
      : item.active.recharge ? `every ${item.active.recharge} turns` : "";
    prose.push(plain(item.active.text) + (every ? ` (${every})` : ""));
  }
  if (item.text) prose.push(plain(item.text));
  if (item.curse) prose.push(`Curse: ${plain(item.curse)}`);

  return [stats.join(", "), ...prose].filter(Boolean)
    .map(s => s.replace(/\.$/, "")).join(". ");
}

/**
 * **What a player's handbook does not print, and why each one.**
 *
 * The catalogue a player reads is the kit they can walk into a town and buy. Everything magical is
 * the GM's to hand over, and printing it with a price did two bad things at once: it spoiled the
 * only reward in the game meant to be a surprise, and it invited a player to shop from lists that
 * nobody is selling from.
 *
 * **Kept as a keyed table with a reason apiece**, which is the same shape as the art directions and
 * the card blurbs, and for the same reason: an editorial judgement is not derivable from the data,
 * so writing it down where it can be read and argued with beats a rule that only looks principled.
 * The suite imports both of these rather than copying them, and checks that every name is a real
 * item and every kind a real kind, so a list cannot rot from either end.
 */
export const GM_KINDS = {
  Wonder: "treasure: the GM decides one exists, and nothing in the list is on a shelf anywhere",
  Relic: "treasure, and usually the thing a whole campaign was driving at",
  Implement: "a caster's staff or wand arrives with the node that teaches the casting, not from a shop",
  Potion: "the brewer's magical stock. The plain Healing Potion is a Consumable and stays",
  Ammunition: "the content's own heading for this block is *magical ammunition*",
  Poison: "bought from somebody who does not advertise, and never off a list"
};

/** And the pieces of an otherwise ordinary kind that are magical anyway. */
export const GM_ITEMS = {
  /* Powers are the jeweller's craft, and five of the seven are magical jewellery. The two that
   * stay are a tin pilgrim's token and a holy symbol, which are devotional objects a priest needs
   * on the first day and which cost three and ten gold. */
  "Focus Pendant": "raises every Cast, which nothing else in a shop does",
  "Ring of the Open Hand": "answers a rule rather than a number: casting without a free hand",
  "Reliquary Band": "a spell slot, which is the one thing no amount of money should buy",
  "Warden's Seal": "a standing bonus to Defend, worn on a finger",
  "Ring of Open Hands": "cursed, and the curse is the point of finding it rather than buying it"
};

function itemChapter() {
  const kinds = [...new Set(ITEMS.map(i => i.kind))].filter(k => !(k in GM_KINDS));
  const out = [];
  for (const kind of kinds) {
    const rows = ITEMS.filter(i => i.kind === kind && !(i.name in GM_ITEMS));
    out.push(`### ${kind}${rows.length === 1 ? "" : "s"}`, "");
    out.push("| Item | Slot | Weight | Gold | What it does | What it is |",
      "|---|---|---|---|---|---|");
    for (const i of rows) {
      out.push(`| **${i.name}** | ${i.slot ?? ""}${i.hands ? ` (${i.hands}h)` : ""} `
        + `| ${i.weight ?? 0} | ${i.value ?? 0} | ${cell(does(i))} | ${cell(i.blurb)} |`);
    }
    out.push("");
  }
  return out;
}

/* -------------------------------------------- */
/*  Features and spells                         */
/* -------------------------------------------- */

function featureChapter() {
  const out = ["| Feature | What it does |", "|---|---|"];
  for (const f of FEATURES) out.push(`| **${f.name}** | ${cell(f.text || f.description)} |`);
  out.push("");
  return out;
}

function spellChapter() {
  const bySource = new Map();
  for (const s of SPELLS.values()) {
    if (!bySource.has(s.source)) bySource.set(s.source, []);
    bySource.get(s.source).push(s);
  }
  const out = [];
  for (const [source, spells] of bySource) {
    out.push(`### ${source}`, "");
    out.push("| Spell | Strength | What it does |", "|---|---|---|");
    for (const s of spells.sort((a, b) => (a.strength ?? 0) - (b.strength ?? 0))) {
      const cost = s.cost?.health ? ` Costs ${s.cost.health} Health.` : "";
      out.push(`| **${s.name}** | ${s.strength ?? ""} | ${cell(s.description)}${cost} |`);
    }
    out.push("");
  }
  return out;
}

/* -------------------------------------------- */
/*  Action cards                                */
/* -------------------------------------------- */

/**
 * One half of a card, as a player reads it off the face: the verb, then whatever number or
 * condition the step carries. A half with nothing in it is a half the card does not have.
 */
function half(steps) {
  if (!steps?.length) return "";
  return steps.map(s => {
    const verb = s.verb ? s.verb[0].toUpperCase() + s.verb.slice(1) : "";
    const bits = [verb];
    if (s.mod) bits.push(s.mod > 0 ? `+${s.mod}` : `${s.mod}`);
    if (s.param !== null && s.param !== undefined) bits.push(String(s.param));
    if (s.ignoresArmour) bits.push("(ignores armour)");
    else if (s.ignores) bits.push(`(ignores ${s.ignores} armour)`);
    if (s.ignoresBlock) bits.push("(ignores Block)");
    if (s.area) bits.push(`in an area of ${s.area}`);
    if (s.range) bits.push(`at range ${s.range}`);
    if (s.condition) {
      bits.push(`→ ${s.condition}${s.duration ? ` (${s.duration})` : ""}`);
    }
    if (s.when?.needs) bits.push(`when they are ${s.when.needs}`);
    return bits.filter(Boolean).join(" ");
  }).join(", then ");
}

/**
 * **Cards only.** The Way pools carry spells as well, and those have their own chapter; a Signature
 * may be a standing feature rather than a card, and those are not played from a hand at all. What
 * belongs here is what you can hold.
 */
const isCard = e => !!(e.primary?.length || e.secondary?.length || e.reaction);

function actionChapter() {
  const shelves = [
    ["The starter Warrior's deck", CONTENT.WARRIOR_DECK],
    ["The starter Shade's deck", CONTENT.SHADE_DECK],
    ["The common pool, which any Way may draw from", CONTENT.COMMON_POOL],
    ["Way of Strength", [...CONTENT.STRENGTH_POOL, ...CONTENT.STRENGTH_SIGNATURES]],
    ["Way of Shade", [...CONTENT.SHADE_POOL, ...CONTENT.SHADE_SIGNATURES]],
    ["Way of Mind", [...CONTENT.MIND_POOL, ...CONTENT.MIND_SIGNATURES]],
    ["Way of Faith", [...CONTENT.FAITH_POOL, ...CONTENT.FAITH_SIGNATURES]],
    ["Way cards", CONTENT.WAY_CARDS]
  ];
  const out = [];
  for (const [label, list] of shelves) {
    const cards = (list ?? []).filter(isCard);
    if (!cards.length) continue;
    out.push(`### ${label}`, "");
    out.push("| Card | What it is | Primary | Secondary | Reaction | Copies |",
      "|---|---|---|---|---|---|");
    for (const c of cards) {
      /* The blurb says what it is; a card's own `text` qualifies the rule, and a reader wants
       * both in the one place they are looking. */
      const note = cell(c.text || c.description);
      const what = [CONTENT.CARD_BLURBS[c.name] ?? "", note ? `*${note}*` : ""]
        .filter(Boolean).join(" ");
      out.push(`| **${c.name}** | ${what} | ${cell(half(c.primary)) || "–"} `
        + `| ${cell(half(c.secondary)) || "–"} | ${c.reaction ? say(CARDRPG.reactions[c.reaction]?.label) : "–"} `
        + `| ${c.copies ?? 1} |`);
    }
    out.push("");
  }
  return out;
}

/* -------------------------------------------- */

/* -------------------------------------------- */
/*  Reactions                                   */
/* -------------------------------------------- */

/**
 * **What each reaction actually does, which the handbook named and never explained.**
 *
 * Chapter 4 said *there are two triggers* and listed the reactions by name, so a player holding a
 * card that reads `sidestep` or `heckle` had the word and nothing else. There are **five**
 * triggers, not two: being hit, an enemy arriving, an **ally** being hit, a spell being cast, and
 * a check failing. The last three were missing entirely, and they are the three that belong to the
 * casting Ways, so the omission fell hardest on exactly the players least able to guess.
 *
 * **Everything mechanical is read, not written here.** The trigger, the kind, and what the
 * reaction requires all come from `CARDRPG.reactions`; the labels come from the lang file; the
 * count of cards carrying each one is counted off the content. Only the sentence is authored, and
 * it is checked against the config in both directions, so a reaction added without a line fails
 * and a line naming no reaction fails.
 *
 * **Brace is in the table and not in the config**, which is a real asymmetry rather than an
 * oversight: it is the fallback in `reactionsFor` for a card whose own reaction cannot fire, and
 * its value is `CARDRPG.defaults.brace`. It is also the reaction a player meets most, so leaving
 * it out of a reference because the vocabulary does not list it would be the wrong kind of tidy.
 */
export const REACTION_TEXT = {
  brace: "Reduce the damage, barely. Any card whose own reaction cannot fire is still worth this "
    + "much, which is deliberately too little to be worth spending a good card on.",
  parry: "Turn the blow with what you are already holding. Reduces the damage by your weapon's "
    + "own Defend value, so a sword parries better than a knife.",
  block: "The shield comes up. Reduces the damage by the shield's Defend value and one more for "
    + "being a shield, which is the best answer to a hit in the game.",
  use: "Something off your belt, drunk or broken open as the blow lands. Heals you by the item's "
    + "Use value, and the item is spent doing it.",
  sidestep: "Step out of reach as they arrive, by the number the card prints. The attack that was "
    + "walking toward you never arrives.",
  counter: "They walked onto your point. A free Strike at the enemy that just arrived, for your "
    + "weapon's full value, and it is the only reaction in the game that deals damage.",
  heckle: "A word, at the moment they close. The enemy that just arrived draws fate with "
    + "disadvantage, so the attack it came to make is already spoiled.",
  bodyguard: "The blow meant for your friend arrives at you instead. It is settled before any "
    + "other answer, because stepping in front of somebody has to happen first.",
  unmake: "You have felt this spell before, and that is the only reason you can stop it.",
  mend: "Help reaches an ally on the turn they were hit rather than on yours, which is most of "
    + "what makes it worth a prepared slot.",
  bargain: "A check you had just failed is intervened in, once, by something that owes you.",
  deflect: "You move the attacker's arm, and one of their own takes the blow instead. It has to "
    + "be a serious one, and it has to be somebody standing next to them."
};

/** Every reaction in the order config lists them, with Brace first because it is the common one. */
function reactionRows() {
  const carriers = new Map();
  for (const list of Object.values(CONTENT)) {
    if (!Array.isArray(list)) continue;
    for (const e of list) {
      if (!e?.reaction || !isCard(e)) continue;
      carriers.set(e.reaction, (carriers.get(e.reaction) ?? 0) + (e.copies ?? 1));
    }
  }
  /*
   * Grouped by trigger rather than left in config order, because the first question a player has
   * is *what just happened*, and config lists them by the order they were built.
   */
  const ORDER = ["hit", "arrival", "allyHit", "cast", "check"];
  const rows = [["brace", null]];
  for (const [key, rule] of Object.entries(CARDRPG.reactions)) rows.push([key, rule]);
  rows.sort((a, b) => ORDER.indexOf(a[1]?.trigger ?? "hit") - ORDER.indexOf(b[1]?.trigger ?? "hit"));
  return rows.map(([key, rule]) => ({
    key,
    label: say(rule ? rule.label : "CARDRPG.Reaction.Brace"),
    when: rule ? say(CARDRPG.triggers?.[rule.trigger]?.label
      ?? `CARDRPG.Trigger.${rule.trigger[0].toUpperCase()}${rule.trigger.slice(1)}`)
      : say("CARDRPG.Trigger.Hit"),
    text: REACTION_TEXT[key] ?? "",
    on: rule?.spell ? "a prepared spell"
      : key === "brace" ? "any card that cannot answer otherwise"
        : plural(carriers.get(key) ?? 0, "card")
  }));
}

function reactionChapter() {
  const out = ["| Reaction | Fires when | What it does | Printed on |", "|---|---|---|---|"];
  for (const r of reactionRows()) {
    /* The trigger reads as a clause in the lang file (*you are hit*), so it needs no rewriting. */
    out.push(`| **${r.label}** | ${cell(r.when)} | ${cell(r.text)} | ${r.on} |`);
  }
  out.push("");
  return out;
}

/* -------------------------------------------- */
/*  Obediences and gifts                        */
/* -------------------------------------------- */

/**
 * **What each god asks of a priest, and what the four lone gods give back.**
 *
 * An Obedience is the price of a miracle, and it is the one price in the game that is not paid at a
 * moment: a formula is paid for once when it is learned, and a miracle is paid for by *how you have
 * to live*. That is what makes twelve gods twelve different kinds of caster rather than twelve
 * lists of effects, so it is the single most important thing a player choosing Way of Faith has to
 * read, and the handbook explained the mechanism without ever printing one of them.
 *
 * **Grouped by creed, because the creed is the decision and not the god.** Swearing closes every
 * rival creed and not every rival god: the Five share one, the Grey's three share one, and the four
 * lone gods each stand alone. So a devotee may take all five of the Five and pay five obediences,
 * and the names here are derived from the graph rather than listed, so a god moved between creeds
 * moves in this table too.
 */
const CREED_NAMES = { five: "The Five", grey: "The three of the Grey" };

function swornNodes(family) {
  return [...GRAPH.values()].filter(n => n.obedience && n.exclusive === family);
}

function creedChapter() {
  const gods = swornNodes("faith");
  const byCreed = new Map();
  for (const n of gods) {
    const key = n.creed ?? n.id;
    if (!byCreed.has(key)) byCreed.set(key, []);
    byCreed.get(key).push(n);
  }
  /* Pantheons first, largest first, then the gods who stand alone in one table of their own. */
  const groups = [...byCreed].filter(([, ns]) => ns.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
  const alone = [...byCreed].filter(([, ns]) => ns.length === 1).flatMap(([, ns]) => ns);

  const out = [];
  const table = (rows, gift) => {
    out.push(gift ? "| God | Obedience | What the god gives back |" : "| God | Obedience |",
      gift ? "|---|---|---|" : "|---|---|");
    for (const n of rows) {
      out.push(`| **${n.title ?? n.name}** | ${cell(n.obedience)}`
        + (gift ? ` | ${cell(n.gift)} |` : " |"));
    }
    out.push("");
  };

  for (const [creed, rows] of groups) {
    const name = CREED_NAMES[creed] ?? creed;
    out.push(`#### ${name}`, "",
      `Swear to one of these and the other ${rows.length - 1} stay open to you. Take two and you `
      + "pay two obediences, take all of them and you pay all of them.", "");
    table(rows, false);
  }
  out.push("#### The gods who stand alone", "",
    "One each, and swearing to any of them closes the other eleven gods for good. Each of the four "
    + "gives something back that no other god does, which is the other half of the bargain.", "");
  table(alone, true);

  const orders = swornNodes("order");
  out.push("#### The four orders", "",
    "An order is sworn separately and carries a rule of its own, so a priest in an order pays that "
    + "**and** their god's Obedience. You may belong to one order.", "");
  out.push("| Order | Rule |", "|---|---|");
  for (const n of orders) out.push(`| **${n.title ?? n.name}** | ${cell(n.obedience)} |`);
  out.push("");
  return out;
}

/* -------------------------------------------- */
/*  Twists                                      */
/* -------------------------------------------- */

/**
 * The two twist decks.
 *
 * **A twist was the one thing in the game a player meets and could not read about.** The handbook
 * printed the word nowhere, while the *Surveyor's Chain* in its own items chapter promised that
 * *in a challenge, your first Progress each scene is free* — so the handbook referred to a
 * challenge and to Progress without ever saying what either was.
 *
 * **Copies are printed because the counts are the tone.** *Strain*, *Noise*, *Time*, *Gear*,
 * *Arrival* and *Opening* are common and mostly push the story sideways; *Hurt* and *Secret* are
 * rare and land hard when they come. A player who can see that the deck is mostly complications
 * and rarely damage reads the risk of a Partial correctly, which is the point of showing it.
 *
 * **What is left out is the GM's half**: the two columns of worked examples, when to draw two and
 * pick, and when to put a card back. Those are improvisation aids for whoever runs the scene, and
 * the twist arrives as their decision.
 */
function twistChapter() {
  const out = [];
  for (const [heading, deck, note] of [
    ["The twist deck", CONTENT.TWISTS,
      "Thirty cards, drawn when a check outside a ritual asks for one."],
    ["The ritual twist deck", CONTENT.RITUAL_TWISTS,
      "Twenty-four cards, and a ritual draws from these instead. Every one of them is the thing "
      + "you are trying to lift answering back."]
  ]) {
    const total = deck.reduce((n, t) => n + (t.copies ?? 1), 0);
    out.push(`### ${heading}`, "", note, "",
      "| Twist | Copies | What it costs |", "|---|---|---|");
    for (const t of deck) out.push(`| **${t.name}** | ${t.copies ?? 1} | ${cell(t.cost)} |`);
    out.push("", `That is **${total}** cards.`, "");
  }
  return out;
}

/* -------------------------------------------- */

export const CHAPTERS = {
  actions: actionChapter,
  items: itemChapter,
  features: featureChapter,
  spells: spellChapter,
  reactions: reactionChapter,
  creeds: creedChapter,
  twists: twistChapter
};

/** Replace what lies between a pair of markers, and leave the rest of the file alone. */
export function fill(text) {
  let out = text;
  for (const [name, build] of Object.entries(CHAPTERS)) {
    const open = `<!-- generated: ${name} -->`;
    const close = `<!-- /generated: ${name} -->`;
    const a = out.indexOf(open);
    const b = out.indexOf(close);
    if (a < 0 || b < 0) throw new Error(`no markers for "${name}" in the handbook`);
    out = out.slice(0, a + open.length) + "\n\n" + build().join("\n").trimEnd() + "\n\n"
      + out.slice(b);
  }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("handbook.mjs")) {
  const before = fs.readFileSync(OUT, "utf8");
  const after = fill(before);
  fs.writeFileSync(OUT, after, "utf8");
  /* Counted off what was WRITTEN, not off the content: the item chapter leaves the magical gear
   * out, and a summary reading `ITEMS.length` would have claimed 150 rows while printing 57. */
  const rows = name => CHAPTERS[name]().filter(l => l.startsWith("| **")).length;
  console.log(`wrote the handbook's reference chapters: ${rows("actions")} action cards, `
    + `${rows("items")} of ${ITEMS.length} items (the magical gear is the GM's), `
    + `${rows("features")} features, ${rows("spells")} spells, ${rows("creeds")} creeds `
    + `and orders, ${rows("twists")} twists`);
}
