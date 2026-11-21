/**
 * Write `rules/players-handbook-no-html.md`: the handbook with the HTML taken out.
 *
 * Run with: node test/plain.mjs
 *
 * **Why this file exists at all.** The handbook carries a few lines of HTML the markdown cannot
 * express -- the map marker, and the comment markers `handbook.mjs` writes its reference chapters
 * between. Some readers and some editors show those lines as content, so there is a second copy of
 * the document without them. It is a rendering of the handbook in exactly the way the HTML page is.
 *
 * **Why it is a command of its own and not part of `npm run build`.**
 *
 * **[BUILT 2026-11-21]** It was neither generated nor checked, which made it the one document in
 * the repository where prose could be written and then quietly lost. Fifty paragraphs were: the
 * only description in the whole book of who an Ironclad or a Flagellant is had been typed into this
 * copy, *inside the region the handbook generator overwrites*, and the only reason they survived
 * was that nobody had run the generator against this file. They are content now (`TITLE_BLURBS`).
 *
 * The obvious fix -- have `npm run build` write this file too -- rebuilds exactly that trap: a
 * paragraph typed in here would then be destroyed by the next build rather than by the next
 * handbook run. So the build does not touch it, this command does, and **this command refuses to
 * run while the copy holds prose the handbook has not got**. The suite makes the same two checks,
 * so a line written here is reported rather than overwritten, and the reporting says where to put
 * it instead.
 */
import fs from "node:fs";
import path from "node:path";

const RULES = path.join(import.meta.dirname, "..", "..", "..", "rules");
const MD = path.join(RULES, "players-handbook.md");
const OUT = path.join(RULES, "players-handbook-no-html.md");

/** The handbook without the lines that are HTML rather than prose. */
export const plainHandbook = md =>
  md.split("\n").filter(l => !l.startsWith("<!--")).join("\n");

/**
 * Prose lines the copy has and the handbook has not, which is the only loss worth guarding: a
 * paragraph somebody wrote into the copy. Compared line by line and stripped, because the two
 * documents are the same document and a line that moved is not a line that was written.
 */
export function orphaned(copy, md) {
  const prose = text => new Set(text.split("\n")
    .map(l => l.trim()).filter(l => l && !l.startsWith("|")));
  const have = prose(plainHandbook(md));
  return [...prose(copy)].filter(l => !have.has(l)).sort();
}

if (process.argv[1] && process.argv[1].endsWith("plain.mjs")) {
  const md = fs.readFileSync(MD, "utf8");
  const lost = fs.existsSync(OUT) ? orphaned(fs.readFileSync(OUT, "utf8"), md) : [];
  if (lost.length) {
    console.error(`refusing to write: the copy holds ${lost.length} line(s) of prose the handbook `
      + "has not got. Put them in rules/players-handbook.md, or in the content they belong to, and "
      + "run this again:");
    for (const l of lost.slice(0, 20)) console.error(`  ${l.slice(0, 140)}`);
    if (lost.length > 20) console.error(`  ... and ${lost.length - 20} more`);
    process.exit(1);
  }
  const out = plainHandbook(md);
  fs.writeFileSync(OUT, out, "utf8");
  console.log(`wrote rules/players-handbook-no-html.md: ${out.split("\n").length} lines`);
}
