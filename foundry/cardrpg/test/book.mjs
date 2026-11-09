/**
 * Render the player's handbook as a page to read on a screen.
 *
 * Run with: node test/book.mjs
 *
 * **Why a renderer of our own rather than a markdown library.** The handbook uses a closed set of
 * constructs, counted rather than guessed: headings h1 to h4, pipe tables, bullet and numbered
 * lists, horizontal rules, bold, italic, and paragraphs soft-wrapped at a hundred columns. No
 * links, no code spans, no entities, no raw HTML but the generated-chapter markers. Sixty lines
 * cover all of it exactly, which is cheaper than a dependency and means the page can do the two
 * things a general renderer could not do at all:
 *
 *   - **put the art on the rows**, because `art.mjs` already names every file after the content it
 *     belongs to, so a row that says *Arming Sword* can be given `items/arming-sword.webp` without
 *     anybody writing a caption anywhere;
 *   - **use the game's own icons**, because the six verbs and six approaches carry icon names in
 *     config and those are the filenames in `icons/`, so the page can show the real artwork where
 *     the markdown shows an emoji stand-in.
 *
 * **The markdown stays the only source.** This reads it and writes beside it; it never edits it.
 * The generated chapters are found by the markers that are already in the file, so the page gets a
 * hook on each one (`div.reference`) without the markdown growing a single tag of its own.
 *
 * **The art is referenced where it lives** rather than copied. It is 154MB across 622 files, which
 * is right for reading the page out of the repository and wrong for sending to somebody. A bundle
 * for sharing wants downscaled copies, and that is a separate job from this one.
 */
import fs from "node:fs";
import path from "node:path";
import { CARDRPG } from "../module/config.mjs";
import { SHELVES, slug, DELIVERY } from "../module/art.mjs";

const HERE = import.meta.dirname;
const REPO = path.join(HERE, "..", "..", "..");
const MD = path.join(REPO, "rules", "players-handbook.md");
const OUT = path.join(REPO, "rules", "players-handbook.html");
const ART_DIR = path.join(HERE, "..", "art");
const ICON_DIR = path.join(HERE, "..", "icons");
/* How the page reaches the art from where it is written. */
const ART_HREF = "../foundry/cardrpg/art";

/* -------------------------------------------- */
/*  The game's own icons                        */
/* -------------------------------------------- */

/**
 * One icon, inlined.
 *
 * Inlined rather than linked so the glyph takes its colour from the text around it, which is what
 * makes it work in both the light and the dark theme without a second copy of the file. The
 * sources are game-icons.net SVGs with a viewBox and no fill, so one `fill` on the root is enough
 * for every path inside to follow.
 */
function icon(name) {
  const file = path.join(ICON_DIR, `${name}.svg`);
  if (!fs.existsSync(file)) return "";
  return fs.readFileSync(file, "utf8").trim()
    .replace(/<\?xml[\s\S]*?\?>/g, "")
    .replace("<svg ", '<svg class="glyph" fill="currentColor" aria-hidden="true" focusable="false" ');
}

/**
 * **The emoji in the two vocabulary tables, swapped for the artwork they stand in for.**
 *
 * Keyed off config rather than off the glyphs: `CARDRPG.verbs.use.icon` is `potion-ball` and
 * `icons/potion-ball.svg` is the file, so a verb renamed or re-iconed in config moves here with
 * no second list to update. The markdown keeps its emoji, which is right for reading it as text.
 */
const GLYPHS = new Map();
for (const [, table] of [["verbs", CARDRPG.verbs], ["approaches", CARDRPG.approaches]]) {
  for (const [key, cfg] of Object.entries(table)) {
    if (!cfg.icon) continue;
    /* The label in the handbook is the capitalised key: Strike, Might, Presence. */
    GLYPHS.set(`${key[0].toUpperCase()}${key.slice(1)}`, cfg.icon);
  }
}

/* -------------------------------------------- */
/*  The art, by the name on the row             */
/* -------------------------------------------- */

/**
 * Which shelves a chapter may take art from.
 *
 * Names are not unique across the whole game: *Hold the Line* is a card and an intent, and
 * *Turn Aside* is a card and a formula. Scoping the lookup to the shelves a chapter is actually
 * about is what keeps the action table from showing a monster's picture.
 */
const SHELVES_FOR = {
  /* A reaction spell appears in the action chapter and is filed with the spells, because the
   * Mind and Faith pools ARE the spell shelves: Turn Aside, The Mirror, Bear It for Them. */
  actions: ["cards/", "signatures/", "spells/mind", "spells/faith"],
  items: ["items"],
  features: ["features"],
  /* A Signature spell is filed with the signatures, not with the spells: one per school and
   * one per god, twenty of the hundred and forty, and they were the twenty with no picture. */
  spells: ["spells/", "signatures/mind", "signatures/faith"],
  twists: ["cards/ritual"],
  creeds: []
};

function artIndex(prefixes) {
  const index = new Map();
  for (const shelf of SHELVES) {
    if (!prefixes.some(p => shelf.key.startsWith(p))) continue;
    for (const entry of shelf.list ?? []) {
      if (index.has(entry.name)) continue;
      const rel = `${shelf.dir}/${slug(entry.name)}.${DELIVERY.format}`;
      if (fs.existsSync(path.join(ART_DIR, rel))) index.set(entry.name, rel);
    }
  }
  return index;
}

const ART = Object.fromEntries(
  Object.entries(SHELVES_FOR).map(([chapter, prefixes]) => [chapter, artIndex(prefixes)]));

/* -------------------------------------------- */
/*  Markdown, the subset this document uses     */
/* -------------------------------------------- */

const escape = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Bold and italic, in that order so `**x**` is not read as two italics. */
const inline = s => escape(s)
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");

const anchor = s => slug(s.replace(/\*\*/g, ""));

/**
 * A table.
 *
 * Several of the handbook's tables have a deliberately empty header row, because the first column
 * is the label and a heading over it would say nothing: the Sides, the languages, the quick
 * reference. Those get no `thead` at all rather than an empty one, so no reader and no screen
 * reader is told there is a header there.
 */
/**
 * **Rows that went out without their picture**, collected as the page is built.
 *
 * [FOUND 2026-11-09] Twenty spells rendered blank, one per school and one per god, because a
 * Signature spell is filed on the signatures shelf rather than the spells shelf and the lookup
 * only looked at `spells/`. Every file was on disk and the art brief read 622 of 622 drawn, so
 * nothing upstream was wrong and nothing upstream could have noticed: the loss was entirely in
 * the asking. A reader found it, which is the expensive way.
 *
 * So the builder now says what it could not place, and the suite reads it. A chapter with an art
 * index is a chapter where a blank row is a bug rather than a gap.
 */
const MISSED = [];

function table(rows, chapter) {
  const cells = row => row.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  const out = ['<div class="scroller"><table>'];
  if (head.some(Boolean)) {
    out.push("<thead><tr>" + head.map(c => `<th>${inline(c)}</th>`).join("") + "</tr></thead>");
  }
  out.push("<tbody>");
  for (const row of body) {
    const name = row[0]?.replace(/\*\*/g, "");
    const art = chapter && ART[chapter]?.get(name);
    if (chapter && !art && ART[chapter]?.size) MISSED.push(`${chapter}/${name}`);
    const first = art
      ? `<th scope="row" class="named"><img src="${ART_HREF}/${art}" alt="" loading="lazy"`
        + ` decoding="async"><span>${inline(row[0])}</span></th>`
      : `<th scope="row">${inline(row[0])}</th>`;
    out.push("<tr>" + first
      + row.slice(1).map(c => `<td>${inline(c)}</td>`).join("") + "</tr>");
  }
  out.push("</tbody></table></div>");
  return out.join("\n");
}

function render(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  const toc = [];
  let para = [];
  let chapter = null;

  const flush = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    /* The markers that are already in the markdown become the hook the stylesheet needs. */
    const open = /^<!-- generated: (\w+) -->$/.exec(line.trim());
    const close = /^<!-- \/generated: (\w+) -->$/.exec(line.trim());
    if (open) {
      flush();
      chapter = open[1];
      out.push(`<div class="reference" data-chapter="${chapter}">`);
      continue;
    }
    if (close) { flush(); chapter = null; out.push("</div>"); continue; }
    if (line.trim().startsWith("<!--")) continue;

    const heading = /^(#{1,4}) (.+)$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1].length;
      const id = anchor(heading[2]);
      if (level === 2) toc.push({ id, text: heading[2] });
      out.push(`<h${level} id="${id}">${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith("|")) {
      flush();
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) rows.push(lines[i++]);
      i--;
      out.push(table(rows, chapter));
      continue;
    }

    const bullet = /^\s*- (.*)$/.exec(line);
    if (bullet) {
      flush();
      const items = [];
      while (i < lines.length) {
        const m = /^\s*- (.*)$/.exec(lines[i]);
        if (m) { items.push(m[1]); i++; continue; }
        /* A wrapped continuation line is indented and belongs to the item above it. */
        if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += ` ${lines[i].trim()}`; i++; continue; }
        break;
      }
      i--;
      out.push("<ul>" + items.map(t => `<li>${inline(t)}</li>`).join("") + "</ul>");
      continue;
    }

    const ordered = /^\s*\d+\. (.*)$/.exec(line);
    if (ordered) {
      flush();
      const items = [];
      while (i < lines.length) {
        const m = /^\s*\d+\. (.*)$/.exec(lines[i]);
        if (m) { items.push(m[1]); i++; continue; }
        if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += ` ${lines[i].trim()}`; i++; continue; }
        break;
      }
      i--;
      out.push("<ol>" + items.map(t => `<li>${inline(t)}</li>`).join("") + "</ol>");
      continue;
    }

    if (line.trim() === "---") { flush(); out.push("<hr>"); continue; }
    if (line.trim() === "") { flush(); continue; }
    para.push(line.trim());
  }
  flush();
  return { body: out.join("\n"), toc };
}

/* -------------------------------------------- */
/*  The page                                    */
/* -------------------------------------------- */

/** The emoji stand-ins, replaced by the artwork, once the body is otherwise finished. */
function useRealIcons(html) {
  let out = html;
  let swapped = 0;
  for (const [label, name] of GLYPHS) {
    const svg = icon(name);
    if (!svg) continue;
    /* Only in a table's row label, which is where the two vocabulary tables put them, and only
     * where an emoji actually follows the name: `<th scope="row"><strong>Strike</strong> ⚔</th>`. */
    const re = new RegExp(`(<th scope="row"><strong>${label}</strong>)\\s*[^<\\s][^<]*?(</th>)`, "g");
    out = out.replace(re, (m, a, b) => { swapped++; return `${a}${svg}${b}`; });
  }
  return { html: out, swapped };
}

function page({ body, toc }) {
  const nav = toc.map(t => `<li><a href="#${t.id}">${escape(t.text)}</a></li>`).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CardRPG Player's Handbook</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,600;1,400&family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="book.css">
</head>
<body>
<a class="skip" href="#main">Skip to the handbook</a>
<nav id="toc" aria-label="Contents">
<h2 class="toc__title">Contents</h2>
<ol>
${nav}
</ol>
</nav>
<main id="main">
${body}
</main>
<script>
/* Marks the section being read, so the contents list says where you are. Progressive: with no
   script the page is the whole document and every link still works. */
const marks = [...document.querySelectorAll("main h2[id]")];
const links = new Map([...document.querySelectorAll("#toc a")].map(a => [a.hash.slice(1), a]));
const spy = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    for (const a of links.values()) a.removeAttribute("aria-current");
    links.get(e.target.id)?.setAttribute("aria-current", "true");
  }
}, { rootMargin: "-10% 0px -85% 0px" });
for (const m of marks) spy.observe(m);
</script>
</body>
</html>
`;
}

/* -------------------------------------------- */

/**
 * The whole page from the markdown, as a string.
 *
 * Exported and pure for the same reason `fill` is: the suite can then ask whether the committed
 * page still matches the committed markdown, which is the only way a generated file beside its
 * source does not quietly rot. Nothing here writes.
 */
export function buildPage(md) {
  MISSED.length = 0;
  const rendered = render(md);
  const { html: body, swapped } = useRealIcons(rendered.body);
  return {
    html: page({ body, toc: rendered.toc }),
    chapters: rendered.toc.length,
    tables: (body.match(/<table>/g) ?? []).length,
    art: (body.match(/<img src="/g) ?? []).length,
    icons: swapped,
    missed: [...MISSED]
  };
}

if (process.argv[1] && process.argv[1].endsWith("book.mjs")) {
  const built = buildPage(fs.readFileSync(MD, "utf8"));
  fs.writeFileSync(OUT, built.html, "utf8");
  console.log(`wrote rules/players-handbook.html: ${built.chapters} chapters, `
    + `${built.tables} tables, ${built.art} pieces of art placed, `
    + `${built.icons} emoji replaced by the game's own icons`);
  if (built.missed.length) {
    console.log(`  ${built.missed.length} rows went without a picture:`);
    for (const m of built.missed) console.log(`    ${m}`);
  }
}
