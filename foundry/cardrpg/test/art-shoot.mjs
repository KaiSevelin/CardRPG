/**
 * The art pipeline. Run with: node test/art-shoot.mjs <key>... [options]
 *
 *   node test/art-shoot.mjs cards/starter/strike
 *   node test/art-shoot.mjs --group cards/starter --quality medium
 *   node test/art-shoot.mjs --all --dry-run
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
const BOOLEAN = new Set(["dry-run", "force", "all"]);
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
const kindOf = piece => piece.back ? "back" : piece.token ? "token" : "card";

function chosen() {
  if (flag("all")) return ledger;
  const group = opt("group", "");
  if (group) return ledger.filter(p => p.key.startsWith(`${group}/`));
  const want = new Set(keys);
  const picked = ledger.filter(p => want.has(p.key));
  const missing = [...want].filter(k => !ledger.some(p => p.key === k));
  if (missing.length) {
    console.error(`no such piece: ${missing.join(", ")}`);
    console.error("keys look like cards/starter/strike, backs/action, tokens/goblin");
    process.exit(1);
  }
  return picked;
}

const money = n => `$${n.toFixed(4)}`;

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
function logFailure(piece, status, body, form = {}) {
  /* The form AS SENT, not as defaulted: the retry asks for png, and a log that said webp for
   * both attempts made two different requests look like one repeated request. */
  const sent = Object.entries({ output_format: DELIVERY.format, ...form })
    .map(([k, v]) => `${k} ${v}`).join(", ");
  const entry = [
    `--- ${new Date().toISOString()}  ${piece.key}`,
    `model ${modelFor(piece)}, ${piece.size}, ${quality}, ${sent}`
      + `${piece.token ? ", background transparent" : ""}`,
    `HTTP ${status}`,
    body.trim(),
    ""
  ].join("\n");
  fs.appendFileSync(LOG, `${entry}\n`, "utf8");
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
  if (fs.existsSync(target) && !flag("force")) {
    console.log(`  skip   ${piece.key} -- already drawn (--force to replace)`);
    return null;
  }
  const prompt = `${piece.capsule}\n\n${piece.subject}`;

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
    logFailure(piece, res.status, body, webpDirect);
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
  return { cost, ok: verdict.ok };
}

const pieces = chosen();
if (!pieces.length) {
  console.log("nothing selected. Give a key, or --group <dir>, or --all.");
  process.exit(1);
}
const models = [...new Set(pieces.map(modelFor))].join(" + ");
console.log(`${pieces.length} piece${pieces.length === 1 ? "" : "s"}, ${models}, ${quality} quality`
  + `${dryRun ? ", DRY RUN" : ""}`);

let spent = 0, passed = 0, drawn = 0;
for (const piece of pieces) {
  const result = await shoot(piece);
  if (!result || result.dry || result.error) continue;
  drawn++; spent += result.cost;
  if (result.ok) passed++;
}
if (drawn) {
  console.log(`\n${drawn} drawn, ${passed} through the gate, ${money(spent)} spent`
    + `${drawn > 1 ? ` (${money(spent / drawn)} each)` : ""}`);
}
