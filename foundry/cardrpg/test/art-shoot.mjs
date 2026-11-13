/**
 * The art pipeline. Run with: node test/art-shoot.mjs <key>... [options]
 *
 *   node test/art-shoot.mjs cards/starter/strike
 *   node test/art-shoot.mjs --group cards/starter --quality medium
 *   node test/art-shoot.mjs --all --dry-run
 *   node test/art-shoot.mjs cards/npc --failed     # only the ones the gate rejects
 *
 * It sends **the book's own prompt** -- the capsule and the subject, imported from
 * `art-prompts.mjs` rather than copied out of the generated markdown -- so the picture bought is
 * the picture the book describes. A second spelling of a prompt is a second prompt, and it drifts
 * from the first in exactly the way nobody notices.
 *
 * **Every result goes through the gate** (`art-gate.mjs`) before it is called done. The first
 * batch of twenty-two was judged by eye and fifteen of the seventeen faces had dark mass under
 * the card's own name panel; five hundred and eight cannot be judged by eye at all.
 *
 * What it does NOT do, deliberately:
 * - It never overwrites. A file that exists is skipped unless `--force` says otherwise, so the
 *   command is safe to re-run over a part-finished set and re-running costs nothing.
 * - It keeps no original. The API is asked for webp at the one quality the brief states, so there
 *   is no transcode step and no 2.7MB png to forget to delete.
 *
 * The key is read from `OPENAI_API_KEY` in the environment and is never written anywhere.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { ledger } from "./art-prompts.mjs";
import { DELIVERY } from "./art-list.mjs";
import { score, report } from "./art-gate.mjs";

const root = path.join(import.meta.dirname, "..");

/*
 * **Current as of 2026-11-05, and worth re-checking before a big run.** `gpt-image-1` was retired
 * on 2026-10-23, which is the kind of thing that happens between one batch and the next. Pricing
 * is per token now rather than per image: image output at $30/1M, text input at $5/1M, and the
 * Batch endpoint is half of both.
 */
/*
 * **Two models, because only one of them can cut a token out.**
 *
 * `gpt-image-2` draws the cards. Asked for `background: "transparent"` it answers 400 with
 * `param: background, code: invalid_value` -- in webp and in png alike, so the output format was
 * never the objection and the retry that tested it has been removed. `gpt-image-2.5-sunburst`
 * does it, cleanly, with a real alpha channel and no halo.
 *
 * This is read off the piece rather than passed on the command line, because a token shot with
 * the card model fails and a card shot with the token model is a silent style change, and
 * neither should depend on remembering a flag. `--model` still overrides for testing.
 *
 * **The two models do not draw alike, and that was accepted rather than missed.** Beside a card,
 * the first token read as a rendered illustration -- clean outline, smooth modelled shading --
 * where the cards are loose wash on visible paper. The palette matches; the handling does not.
 * It stands because a token is a different object: it sits on a map at sixty pixels and never in
 * a hand beside a card, so the two are never seen together at a size where the difference shows.
 *
 * What that means for anyone reading this later: **do not add a style check to the gate that
 * holds tokens to the cards' handling.** It would fail forty-seven pieces over a decision that
 * was already made. The palette rules apply to both and are enough.
 */
const MODEL = { card: "gpt-image-2", token: "gpt-image-2.5-sunburst" };
const RATE = { imageOut: 30 / 1e6, textIn: 5 / 1e6 };
const ENDPOINT = "https://api.openai.com/v1/images/generations";

const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
/* Flags that take no value, so the word after them is a piece and not an argument. */
const BOOLEAN = new Set(["dry-run", "force", "all", "failed"]);
const keys = argv.filter((arg, i) => {
  if (arg.startsWith("--")) return false;
  const before = argv[i - 1];
  return !(before?.startsWith("--") && !BOOLEAN.has(before.slice(2)));
});

const quality = opt("quality", "medium");
const modelFor = piece => opt("model", piece.token ? MODEL.token : MODEL.card);
const outDir = path.join(root, opt("out", "art"));
const dryRun = flag("dry-run");

/* The piece's kind decides which rules the gate holds it to, and it is already in the ledger. */
/* A graph node's picture is scored as a `panel`: same palette and same hand, but the level-up
 * pane prints its heading under the picture rather than over it, so the card's two layout
 * rules are measuring a name panel that is not there. See `score` in art-gate.mjs. */
const kindOf = piece => piece.back ? "back" : piece.token ? "token"
  : piece.key.startsWith("nodes/") ? "panel" : "card";

/*
 * **`--failed` narrows a selection to the pieces the gate rejects, and implies `--force`.**
 *
 * The alternative was a command line naming twenty files, which is how a piece gets left out of
 * a redraw and nobody notices for a week. It reads the verdict off the files on disk rather than
 * off a list written down after the last run, so it cannot go stale: fix the prompt, re-run the
 * same command, and exactly what is still wrong is what gets drawn.
 *
 * A piece with no file yet is included too -- never drawn is not drawn right.
 */
function stillWrong(pieces) {
  return pieces.filter(piece => {
    const target = path.join(outDir, piece.file);
    if (!fs.existsSync(target)) return true;
    try {
      return !score(target, { kind: kindOf(piece), size: piece.size }).ok;
    } catch (err) {
      console.error(`  cannot read ${piece.key}: ${err.message}`);
      return true;
    }
  });
}

function chosen() {
  const narrow = list => (flag("failed") ? stillWrong(list) : list);
  if (flag("all")) return narrow(ledger);
  const group = opt("group", "");
  if (group) return narrow(ledger.filter(p => p.key.startsWith(`${group}/`)));
  /*
   * **A bare word that names a group is taken as the group.**
   *
   * `backs` is not a piece, and the first thing anyone types is `backs` -- there are twenty-two
   * groups still to draw and `--group` is a flag you have to remember every time. The two can
   * never collide: a key always has a directory in it, so a bare word with no slash cannot be a
   * piece, and `--group` still works for anyone who prefers it.
   */
  const want = new Set();
  const missing = [];
  for (const key of keys) {
    if (ledger.some(p => p.key === key)) { want.add(key); continue; }
    const asGroup = ledger.filter(p => p.key.startsWith(`${key}/`));
    if (asGroup.length) { for (const p of asGroup) want.add(p.key); continue; }
    missing.push(key);
  }
  if (missing.length) {
    console.error(`no such piece or group: ${missing.join(", ")}`);
    console.error("a piece is cards/starter/strike or backs/action; a group is backs, tokens,");
    console.error(`cards/starter, items. Groups: ${
      [...new Set(ledger.map(p => p.key.split("/").slice(0, -1).join("/")))].join(", ")}`);
    process.exit(1);
  }
  return narrow(ledger.filter(p => want.has(p.key)));
}

const money = n => `$${n.toFixed(4)}`;

/* Once, not per piece: fifty pieces is fifty `git rev-parse` calls for one unchanging answer. */
const HEAD = (() => {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString().trim();
  } catch { return null; }
})();
const fingerprint = text => crypto.createHash("sha1").update(text).digest("hex").slice(0, 12);

/*
 * **Failures go to a file, because a terminal is not always something you can copy out of.**
 *
 * It is also the right shape for a long run: five hundred pieces will produce refusals,
 * moderation blocks and rate limits at two in the morning, and scrollback is not a record. Each
 * entry is the piece, the status and the whole response body -- never the prompt and never the
 * key, so the file is safe to paste anywhere.
 */
const LOG_NAME = "art-failures.log";
const LOG = path.join(root, LOG_NAME);
/*
 * **It carries the prompt's fingerprint, and it did not, and that cost twelve paid attempts.**
 *
 * **[BUILT 2026-11-09]** `items/lockpicks` was refused twelve times and `cards/ritual/deeper`
 * seven, and this file could not say whether anybody changed a word between any two of them. The
 * verdict log has carried a fingerprint since it was written and its own comment says why: *two
 * attempts at a piece that nobody re-worded share a value, which is how a re-roll is told from a
 * rewrite*. That is the comparison you need most when the thing being repeated is the request
 * you are being billed for -- and the log that records refusals was the one without it.
 *
 * A fingerprint is not the prompt, so the promise above still holds: this file is safe to paste
 * anywhere, and a hash of a capsule is not a capsule.
 */
function logFailure(piece, status, body, form = {}, prompt = null) {
  /* The form AS SENT, not as defaulted: the retry asks for png, and a log that said webp for
   * both attempts made two different requests look like one repeated request. */
  const sent = Object.entries({ output_format: DELIVERY.format, ...form })
    .map(([k, v]) => `${k} ${v}`).join(", ");
  const entry = [
    `--- ${new Date().toISOString()}  ${piece.key}`,
    `model ${modelFor(piece)}, ${piece.size}, ${quality}, ${sent}`
      + `${piece.token ? ", background transparent" : ""}`,
    `prompt ${prompt ? fingerprint(prompt) : "unrecorded"}${HEAD ? `, head ${HEAD}` : ""}`,
    `HTTP ${status}`,
    body.trim(),
    ""
  ].join("\n");
  fs.appendFileSync(LOG, `${entry}\n`, "utf8");
}

/*
 * **What this piece has already been refused for, read back out of the log.**
 *
 * **[BUILT 2026-11-09]** The log was written for a person to read in the morning and nothing has
 * ever read it, which is why `items/lockpicks` was sent twelve times, `cards/ritual/deeper`
 * seven, `cards/npc/where-it-is-held` six and `spells/mind/the-red-hour` five. Every one of
 * those was a paid request for a composition the API had already declined, and the record of the
 * decline was sitting in a file in this directory.
 *
 * **A moderation block is not a rate limit and must not be retried like one.** The two arrive
 * through the same HTTP 400 and that is the whole of the confusion: a 429 clears by waiting, and
 * a `moderation_blocked` at the OUTPUT stage -- which is all forty-nine of ours -- means the
 * model drew the thing and the classifier would not hand it over. Waiting changes nothing.
 * Re-rolling changes nothing reliably. The only thing that changes it is different words.
 *
 * So the fingerprint decides, and `--force` is the override for somebody who means it. A piece
 * whose history is from before the fingerprint existed cannot be judged this way, so it warns
 * with the count and lets the request through: a guess is not grounds to refuse to spend money
 * the operator has asked to spend.
 */
const priorBlocks = (() => {
  let text = "";
  try { text = fs.readFileSync(LOG, "utf8"); } catch { return () => []; }
  const seen = [];
  for (const entry of text.split(/\n(?=--- )/)) {
    if (!entry.includes("moderation_blocked")) continue;
    const head = /^--- (\S+)\s+(\S+)/.exec(entry);
    if (!head) continue;
    seen.push({
      at: head[1],
      key: head[2],
      /* `unrecorded` for the entries written before the log carried one. */
      prompt: /^prompt ([0-9a-f]{12})/m.exec(entry)?.[1] ?? null,
      why: (/safety_violations=\[([^\]]*)\]/.exec(entry)?.[1] ?? "unstated")
        .split(/,\s*/).filter(Boolean)
    });
  }
  return key => seen.filter(b => b.key === key);
})();

/*
 * **Every verdict, not just the ones that survive -- because the survivors lie.**
 *
 * This file exists because of a wrong fix. `quietTop` was measured across the ninety-nine cards
 * on disk, found to sit in a tight band just above its floor, and declared the rule that was
 * doing the rejecting. It was not: ninety-seven of those ninety-nine PASSED, and the band was
 * tight because the rule was being obeyed precisely. The capsule was rewritten on that reading
 * and the next twenty-five pieces went 14 for 25.
 *
 * The mistake was unavoidable with the data to hand. A rejected piece is overwritten by the next
 * `--failed` run, so the only sample anyone can ever measure is the one that passed -- and a
 * sample of survivors cannot say what killed the dead. Scrollback is not a record either: the
 * verdict was printed every time and gone by morning.
 *
 * So: one JSON object per attempt, appended, and nothing ever removed. It is deliberately NOT
 * the prompt -- the same rule the failure log keeps, so this file is safe to paste anywhere --
 * but it carries a `prompt` fingerprint and the commit, which is what makes the comparison that
 * was missing possible: group by fingerprint and the capsule's two versions separate themselves.
 */
const VERDICT_NAME = "art-verdicts.log";
const VERDICTS = path.join(root, VERDICT_NAME);
function logVerdict(piece, verdict, prompt) {
  const round = n => typeof n === "number" ? Number(n.toFixed(4)) : n;
  const entry = {
    at: new Date().toISOString(),
    key: piece.key,
    kind: verdict.kind,
    ok: verdict.ok,
    faults: verdict.faults,
    /* The eight rules the gate can fail a piece on, so a run can be grouped by which one bit. */
    m: {
      quietTop: round(verdict.quietTop), inWindow: round(verdict.inWindow),
      black: round(verdict.black), paper: round(verdict.paper),
      cool: round(verdict.cool), grey: round(verdict.grey),
      edgeGrain: round(verdict.edgeGrain), opaque: round(verdict.opaque),
      symmetry: round(verdict.symmetry)
    },
    model: modelFor(piece), quality,
    /*
     * **Two fingerprints, never the text, and the second one is the one that matters.**
     *
     * `prompt` covers capsule and subject together, so it identifies one exact request: two
     * attempts at a piece that nobody re-worded share a value, which is how a re-roll is told
     * from a rewrite. But it is unique per piece, so it cannot group a batch.
     *
     * `capsule` covers only the shared half -- the same string for every piece in a group -- so
     * every attempt made under one wording shares it and a capsule edit splits the log in two by
     * itself. That is the comparison that was missing when `quietTop` was misread: twenty-six
     * pieces at one value went 26 for 26, twenty-five at the next went 14 for 25, and the two
     * numbers were never beside each other until they had been paid for.
     */
    prompt: fingerprint(prompt),
    capsule: fingerprint(piece.capsule),
    head: HEAD
  };
  fs.appendFileSync(VERDICTS, `${JSON.stringify(entry)}\n`, "utf8");
}

/*
 * **The key, from the environment or from a file whose path is given.**
 *
 * The environment is the right default and it is also the thing that goes wrong: on Windows
 * `setx` saves a variable for terminals opened afterwards and leaves the current one untouched,
 * so a key that was set correctly reads as absent, twice in a row, with a success message in
 * between. `--key-file` ends that argument -- the path is an argument, the key never is.
 *
 * The file is read here and nowhere else: it is not echoed, not logged, and not written into the
 * repository. Keep it OUTSIDE the working tree, so no `git add .` can ever reach it.
 */
function apiKey() {
  const file = opt("key-file", "");
  if (file) {
    if (!fs.existsSync(file)) {
      console.error(`--key-file ${file} does not exist.`);
      process.exit(2);
    }
    const key = fs.readFileSync(file, "utf8").trim();
    if (!key) {
      console.error(`--key-file ${file} is empty.`);
      process.exit(2);
    }
    if (path.resolve(file).startsWith(path.resolve(root))) {
      console.error(`refusing to read a key from inside the repository: ${file}`);
      console.error("put it somewhere a commit cannot reach, such as your home directory.");
      process.exit(2);
    }
    return key;
  }
  const fromEnv = process.env.OPENAI_API_KEY;
  if (fromEnv) return fromEnv;
  console.error("No API key. Two ways to give one:");
  console.error("  1. $env:OPENAI_API_KEY = \"sk-...\"  in the same window, then run again.");
  console.error("     (`setx` saves it for the NEXT window and not for the current one, which is");
  console.error("      the usual reason this message appears after setting it successfully.)");
  console.error("  2. --key-file C:\\Users\\you\\.openai-key  -- one line, outside the repo.");
  console.error("The key is never printed and never written into the repository.");
  process.exit(2);
}

async function shoot(piece) {
  const target = path.join(outDir, piece.file);
  /* `--failed` already means replace: it only ever selects pieces that are wrong on disk. */
  if (fs.existsSync(target) && !flag("force") && !flag("failed")) {
    console.log(`  skip   ${piece.key} -- already drawn (--force to replace)`);
    return null;
  }
  const prompt = `${piece.capsule}\n\n${piece.subject}`;

  /*
   * Before the key, before the money: has this exact request already been declined?
   */
  const before = priorBlocks(piece.key);
  if (before.length) {
    const why = [...new Set(before.flatMap(b => b.why))].join(", ");
    const same = before.filter(b => b.prompt === fingerprint(prompt));
    if (same.length && !flag("force")) {
      console.error(`  held   ${piece.key} -- blocked ${before.length}x `
        + `(${why}), and this wording is one that was blocked`);
      console.error("    rewrite the direction in test/art-prompts.mjs, "
        + "or --force to pay for the same request again");
      return { held: true };
    }
    const how = same.length ? "forced" : before.some(b => b.prompt)
      ? "reworded since" : "no wording recorded for those, so sending";
    console.log(`  note   ${piece.key} -- blocked ${before.length}x before (${why}), ${how}`);
  }

  if (dryRun) {
    console.log(`  would shoot ${piece.key} -> ${path.relative(root, target)}`);
    console.log(`    ${piece.size}, ${quality}, ${DELIVERY.format} q${DELIVERY.quality}, `
      + `${prompt.length} characters of prompt`);
    return { dry: true };
  }

  const key = apiKey();

  const started = Date.now();
  const ask = async form => fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: modelFor(piece), prompt, n: 1, size: piece.size, quality,
      /* A token sits on a map rather than in a frame; everything else is a full bleed. */
      ...(piece.token ? { background: "transparent" } : {}),
      ...form
    })
  });

  const webpDirect = { output_format: DELIVERY.format, output_compression: DELIVERY.quality };
  const res = await ask(webpDirect);

  if (!res.ok) {
    const body = await res.text();
    console.error(`  FAILED ${piece.key}: HTTP ${res.status} -- written to ${LOG_NAME}`);
    console.error(`    ${body.slice(0, 300)}`);
    logFailure(piece, res.status, body, webpDirect, prompt);
    return { error: res.status };
  }
  const body = await res.json();
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`  FAILED ${piece.key}: no image in the response`);
    console.error(`    ${JSON.stringify(body).slice(0, 400)}`);
    return { error: "empty" };
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, Buffer.from(b64, "base64"));

  const used = body.usage ?? {};
  const cost = (used.output_tokens ?? 0) * RATE.imageOut + (used.input_tokens ?? 0) * RATE.textIn;
  const secs = ((Date.now() - started) / 1000).toFixed(0);
  console.log(`  drew   ${piece.key} -> ${path.relative(root, target)} `
    + `(${(fs.statSync(target).size / 1024).toFixed(0)}KB, ${secs}s, ${money(cost)})`);

  /* And the gate, immediately, because a picture nobody measured is a picture nobody checked. */
  const verdict = score(target, { kind: kindOf(piece), size: piece.size });
  console.log(report(verdict));
  /* Written whether it passed or failed: a log of successes is the sample that misled us once. */
  logVerdict(piece, verdict, prompt);
  return { cost, ok: verdict.ok };
}

const pieces = chosen();
if (!pieces.length) {
  /* With `--failed` an empty selection is the good answer, not a mistake in the command. */
  if (flag("failed")) {
    console.log("nothing to redraw: every piece selected is already through the gate.");
    process.exit(0);
  }
  console.log("nothing selected. Give a key, or --group <dir>, or --all.");
  process.exit(1);
}
const models = [...new Set(pieces.map(modelFor))].join(" + ");
console.log(`${pieces.length} piece${pieces.length === 1 ? "" : "s"}, ${models}, ${quality} quality`
  + `${dryRun ? ", DRY RUN" : ""}`);

let spent = 0, passed = 0, drawn = 0, held = 0;
for (const piece of pieces) {
  const result = await shoot(piece);
  if (result?.held) held++;
  if (!result || result.dry || result.error || result.held) continue;
  drawn++; spent += result.cost;
  if (result.ok) passed++;
}
if (drawn) {
  console.log(`\n${drawn} drawn, ${passed} through the gate, ${money(spent)} spent`
    + `${drawn > 1 ? ` (${money(spent / drawn)} each)` : ""}`);
}
/* Loudly, and last: a held piece needs a person to write something, not another run. */
if (held) {
  console.log(`\n${held} piece${held === 1 ? "" : "s"} held: the API has already declined that `
    + "wording. Rewrite the direction rather than paying again.");
}
