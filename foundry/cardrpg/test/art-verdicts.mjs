/**
 * What the gate has actually said, over every attempt it ever scored.
 *
 *   node test/art-verdicts.mjs              # the whole log
 *   node test/art-verdicts.mjs signatures   # only keys under a prefix
 *
 * **This is the other half of `art-verdicts.log`, and without it the log is a pile of JSON.**
 * The question it answers is the one that was asked and answered wrongly from the files on disk:
 * *which rule is actually rejecting pieces?* Asked of the survivors, the answer was `quietTop`,
 * and it cost twenty-five pieces to find out that `quietTop` had never rejected anything --
 * ninety-seven of ninety-nine passed it, and the band looked tight because the rule was being
 * obeyed. A rejected piece is overwritten by the next `--failed` run, so the disk keeps only the
 * winners and the winners cannot say what killed the dead.
 *
 * So every number here is counted over attempts, pass and fail alike, and the one table that
 * matters is the last one: **the same capsule, split by wording.** A capsule edit changes every
 * fingerprint under it, so the before and the after separate themselves and sit next to each
 * other -- which is all that was needed to see that 26 for 26 had become 14 for 25.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const LOG = path.join(root, "art-verdicts.log");

if (!fs.existsSync(LOG)) {
  console.log("no art-verdicts.log yet: nothing has been shot since the log was added.");
  process.exit(0);
}

const prefix = process.argv[2] ?? "";
/*
 * A half-written final line is possible -- the process can be killed mid-append -- and one bad
 * line is not a reason to refuse the other four hundred.
 */
const rows = [];
let skipped = 0;
for (const line of fs.readFileSync(LOG, "utf8").split("\n")) {
  if (!line.trim()) continue;
  try { rows.push(JSON.parse(line)); } catch { skipped++; }
}
const all = prefix ? rows.filter(r => r.key?.startsWith(prefix)) : rows;

if (!all.length) {
  console.log(`no attempts logged${prefix ? ` under "${prefix}"` : ""}.`);
  process.exit(0);
}

const pc = (a, b) => b ? `${((a / b) * 100).toFixed(0)}%` : "--";
const pass = all.filter(r => r.ok).length;
console.log(`${all.length} attempts${prefix ? ` under "${prefix}"` : ""}, `
  + `${pass} through the gate (${pc(pass, all.length)})`
  + `${skipped ? `, ${skipped} unreadable line${skipped === 1 ? "" : "s"}` : ""}`);

/*
 * **Which rule bit, counted over attempts rather than over files.**
 *
 * The fault strings carry their own measurements, so they are grouped by the rule they came from
 * rather than compared as text -- otherwise "ink reaches 8.3%" and "ink reaches 9.6%" are two
 * different faults and every row in the table has a count of one.
 */
const RULES = [
  [/not 1024x/, "wrong size"],
  [/outside the warm palette/, "cool: off-palette hue"],
  [/grey mid tones/, "grey: desaturated mid tones"],
  [/no true black/, "black: no true black"],
  [/no bare paper/, "paper: no bare paper"],
  [/inside the name panel/, "quietTop: ink under the name panel"],
  [/falls in the band the card leaves clear/, "inWindow: ink behind a panel"],
  [/outer edge is a flat colour/, "edgeGrain: a mat, not full bleed"],
  [/not symmetrical/, "symmetry: a back against its mirror"],
  [/no alpha channel/, "alpha: no transparency"],
  [/of the square is opaque/, "opaque: background not cut out"]
];
const fired = new Map();
for (const r of all) {
  for (const f of r.faults ?? []) {
    const rule = RULES.find(([re]) => re.test(f))?.[1] ?? `unmatched: ${f.slice(0, 40)}`;
    fired.set(rule, (fired.get(rule) ?? 0) + 1);
  }
}
if (fired.size) {
  console.log("\nWhich rule rejected a piece, over every attempt:\n");
  console.log("  fired  of attempts  rule");
  for (const [rule, n] of [...fired].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${pc(n, all.length).padStart(11)}  ${rule}`);
  }
} else {
  console.log("\nNo rule has rejected anything in this log.");
}

/*
 * **The before-and-after, which is the whole reason the log exists.**
 *
 * One row per capsule wording per group. A capsule edit gives every piece drawn after it a new
 * fingerprint, so a rewrite that made things worse shows up as two rows whose pass rates differ
 * -- and it shows up for the price of a `node` run rather than the price of a batch.
 */
const group = key => key.split("/").slice(0, -1).join("/");
const buckets = new Map();
for (const r of all) {
  const id = `${group(r.key ?? "")}\u0000${r.capsule ?? "?"}`;
  (buckets.get(id) ?? buckets.set(id, []).get(id)).push(r);
}
const med = (list, get) => {
  const v = list.map(get).filter(x => typeof x === "number").sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};
const show = x => x === null ? "   --" : `${(x * 100).toFixed(1)}%`.padStart(5);
console.log("\nEvery capsule wording, oldest first — a rewrite that cost you shows up here:\n");
console.log("  group                      capsule       n  pass   top  window   cool  first seen");
for (const [id, list] of [...buckets].sort((a, b) => a[1][0].at.localeCompare(b[1][0].at))) {
  const [dir, cap] = id.split("\u0000");
  const ok = list.filter(r => r.ok).length;
  console.log(`  ${dir.padEnd(24)}  ${cap.slice(0, 8)}  ${String(list.length).padStart(4)}  `
    + `${pc(ok, list.length).padStart(4)}  ${show(med(list, r => r.m?.quietTop))} `
    + `${show(med(list, r => r.m?.inWindow))}  ${show(med(list, r => r.m?.cool))}  `
    + `${list[0].at.slice(0, 16).replace("T", " ")}`);
}

/*
 * **Pieces that needed more than one attempt**, which is the cost of a bad capsule in money
 * rather than in percentages, and the list to re-read when a group feels unusually expensive.
 */
const tries = new Map();
for (const r of all) tries.set(r.key, (tries.get(r.key) ?? 0) + 1);
const repeat = [...tries].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
if (repeat.length) {
  const wasted = repeat.reduce((n, [, t]) => n + t - 1, 0);
  console.log(`\n${repeat.length} pieces took more than one attempt, `
    + `${wasted} redraw${wasted === 1 ? "" : "s"} in all:`);
  for (const [key, n] of repeat.slice(0, 15)) console.log(`  ${String(n).padStart(2)}x  ${key}`);
  if (repeat.length > 15) console.log(`  ...and ${repeat.length - 15} more`);
}
