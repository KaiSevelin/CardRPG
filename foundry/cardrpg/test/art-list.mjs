/**
 * Write the art list. Run with: node test/art-list.mjs
 *
 * The list is **generated**, because a hand-written one goes stale the first time somebody adds a
 * card -- and this project has added a hundred and sixty of them in a fortnight. It reads the same
 * content the game does, so a piece that exists in the game is in the brief and a piece in the
 * brief exists in the game.
 *
 * It also reports what is already drawn, so the file doubles as the commission's progress.
 */

import fs from "node:fs";
import path from "node:path";
import { CARDRPG } from "../module/config.mjs";
import * as content from "../module/content.mjs";

const root = path.join(import.meta.dirname, "..");
const OUT = path.join(root, "..", "art-list.md");

/* -------------------------------------------- */

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

/** A condition by its printed name, not its key: an artist should not have to read camelCase. */
function conditionName(key) {
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
function brief(entry) {
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

const GROUPS = [
  { dir: "cards/starter", title: "The starter deck",
    why: "What a first session plays with. Draw these first: ten cards is a playable game.",
    list: content.WARRIOR_DECK },
  { dir: "cards/common", title: "The common pool",
    why: "Six cards every Way draws on, so each one is seen by every character in the game.",
    list: content.COMMON_POOL },
  { dir: "cards/npc", title: "NPC intent cards",
    why: "Face-up on the table during a fight, which makes them the art players stare at longest.",
    list: content.GOBLIN_DECK },
  { dir: "cards/shade", title: "Way of Shade — pool",
    why: "The minor-node cards of a built Way.", list: content.SHADE_POOL },
  { dir: "cards/strength", title: "Way of Strength — pool",
    why: "The minor-node cards of a built Way.", list: content.STRENGTH_POOL },
  { dir: "cards/way", title: "Way cards",
    why: "Written for the reach weapons and shared between Ways.", list: content.WAY_CARDS },
  { dir: "cards/skill", title: "Skill cards",
    why: "The scene tray's hand: four of these are face up whenever nobody is fighting.",
    list: content.WARRIOR_SKILLS },
  { dir: "cards/wild", title: "Wild Magic",
    why: "Drawn on a Wild, so each one is a surprise and wants to look like one.",
    list: content.WILD_MAGIC },

  { dir: "signatures/shade", title: "Signatures — Way of Shade",
    why: "A title's own piece of content, and what its node wears in the levelling graph.",
    list: sigs.SHADE_SIGNATURES },
  { dir: "signatures/strength", title: "Signatures — Way of Strength",
    why: "A title's own piece of content, and what its node wears in the levelling graph.",
    list: sigs.STRENGTH_SIGNATURES },
  { dir: "signatures/mind", title: "Signatures — Way of Mind",
    why: "Eleven, not twelve: *Step Through* is in the Shadow formulas below.",
    list: sigs.MIND_SIGNATURES },
  { dir: "signatures/faith", title: "Signatures — Way of Faith",
    why: "A god's first and defining miracle.", list: sigs.FAITH_SIGNATURES },

  { dir: "spells/elemental", title: "Formulas — Elemental",
    why: "The combo pair and its two readers: the oldest spells in the game.",
    list: content.FORMULAS },
  { dir: "spells/shadow", title: "Formulas — Shadow", why: "Pays in a permanent Wild card.",
    list: content.SHADOW_FORMULAS },
  { dir: "spells/mind", title: "Formulas — Way of Mind pool",
    why: "Blood Magic and Spiritualism, handed over by minor nodes.", list: content.MIND_POOL },
  { dir: "spells/faith", title: "Miracles — Way of Faith pool",
    why: "Twelve gods' lesser miracles, handed over by minor nodes.", list: content.FAITH_POOL },

  { dir: "features", title: "Features",
    why: "Always on, so a feature's picture is on the sheet for the character's whole life.",
    list: content.FEATURES },
  { dir: "items", title: "Items",
    why: "The largest group and the least urgent: an item is named on a sheet far more often than "
      + "it is looked at. A generic picture per KIND would serve until there is art per item.",
    list: content.ITEMS.filter(i => !i.npc) },
  { dir: "items/npc", title: "NPC gear",
    why: "Tuned separately from player gear and never offered in a player's picker.",
    list: content.NPC_GEAR ?? [] }
];

/* -------------------------------------------- */

const lines = [];
const push = (...rows) => lines.push(...rows);

let total = 0;
let drawn = 0;
for (const group of GROUPS) {
  total += group.list.length;
  drawn += group.list.filter(e => e.art).length;
}

push(
  "# Art list",
  "",
  `**${total} pieces**, of which **${drawn}** are wired up. Generated from the game's own content `
  + "by `test/art-list.mjs` — regenerate it rather than editing it, or it will disagree with the "
  + "game the first time somebody adds a card.",
  "",
  "## What to supply",
  "",
  "| | |",
  "|---|---|",
  "| Ratio | **5:7** — the standard playing-card proportion, which the card has been since the CSS was written |",
  "| Size | **640 × 896** (2×, for a 150px card on a retina display) |",
  "| Format | `.webp` preferred, `.png` fine. No transparency needed: the art is a full bleed |",
  "| Crop | **Cover, never letterbox.** Art is supplied at the card's own ratio, so a crop is a rounding error |",
  "| Safe area | Keep the subject off the **top 18%** and **bottom 34%**: the name sits on one and the halves on the other |",
  "",
  "**The art goes behind the face, not instead of it.** A face is rendered from data so that a "
  + "condition can switch an individual icon off at runtime, so every card still draws its own name, "
  + "halves and reaction row over the picture, on a scrim of the paper colour at 86%. That is also "
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
  + "`module/content.mjs`. No schema change is needed — Foundry already gives every Item an `img` "
  + "and every Card face an `img`, and this system uses those two slots. Anything under "
  + "`icons/svg/` is ignored on purpose: that is Foundry's own placeholder set, and a generic bag "
  + "icon stretched across a card is worse than no art at all.",
  "",
  "## What does not need art",
  "",
  "- **Fate cards.** Twenty cards that are a number and a reshuffle marker. They want a *design* — "
  + "a back, a Miss, a Critical — not twenty illustrations.",
  "- **Wounds and Taint.** Two faces, fixed, and both are meant to read as damage rather than as "
  + "content. One picture each at most.",
  "- **The levelling graph's nodes.** A node wears the art of what it hands over, so drawing a "
  + "Signature draws its node too. Nothing needs art of its own.",
  ""
);

for (const group of GROUPS) {
  if (!group.list?.length) continue;
  const have = group.list.filter(e => e.art).length;
  push(
    `## ${group.title}`,
    "",
    `${group.why}`,
    "",
    `**${group.list.length} pieces**${have ? `, ${have} wired up` : ""}. `
    + `Suggested path: \`cardrpg/art/${group.dir}/\``,
    "",
    "| | Name | What it is | File |",
    "|---|---|---|---|"
  );
  for (const entry of [...group.list].sort((a, b) => a.name.localeCompare(b.name))) {
    push(`| ${entry.art ? "✓" : " "} | **${entry.name}** | ${brief(entry) || "—"} `
      + `| \`${group.dir}/${slug(entry.name)}.webp\` |`);
  }
  push("");
}

/*
 * Written when run as a script, not when imported. The validator imports this for `slug`, because
 * the rule "a path is the slug of the name" has to be checked with the generator's own slug: a
 * copy of a rule is a second rule, and two rules drift.
 */
if (process.argv[1] && process.argv[1].endsWith("art-list.mjs")) {
  fs.writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${total} pieces, ${drawn} wired up`);
}
