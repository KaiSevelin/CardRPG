/**
 * **The engine, executed.**  [BUILT 2026-11-13]
 *
 * `validate.mjs` reads the source. It is fifteen thousand lines of the most useful checking this
 * project has, and it has never once **run** a line of the engine: every check it makes is a
 * statement about text. That is why three of this week's defects were invisible to it and all
 * three were found by eye --
 *
 *   - *Hold all* toggled on `isReserved(card) !== down`, which skips exactly the cards that need
 *     changing. The button did the opposite of its label from the day it shipped.
 *   - `prune` compared an escaped option value against a raw name, so the one action card in
 *     ninety-three with an apostrophe silently pruned nothing, after the level was spent.
 *   - `roomForInjury` read `cap ?? 1`, and `null ?? 1` is `1`, so the one category declared
 *     uncapped was capped at one and the next line could never fire.
 *
 * A source reader cannot catch any of those, because the source says the right thing in all three
 * cases. Only running them does, which is what this is: a real Foundry server, a real browser, the
 * real system, and questions asked of the objects themselves.
 *
 * **It runs on a copy of the world and deletes it afterwards.** The probes are destructive on
 * purpose -- one of them prunes a card out of a deck for ever -- so every run starts from the same
 * state and the world you actually play in is never opened. That is also what makes the run
 * repeatable, which a harness that mutated a live world would not be.
 *
 * **It downloads nothing.** `playwright-core` drives the Edge that is already on the machine, so
 * the harness costs a dev dependency of a few megabytes rather than a browser of a hundred and
 * fifty.
 *
 *   npm run live                 the default world, the default browser
 *   npm run live -- --keep       leave the scratch world behind to look at
 *   npm run live -- --show       a visible browser, for watching it go wrong
 *   npm run live -- --app=<dir>  where Foundry is, if it is somewhere unusual
 *   npm run live -- --only=a,b    only the probes whose names contain a or b
 *
 * `--only` is for writing a probe, not for trusting one: a run that skips nine tenths of the suite
 * says nothing about the nine tenths. It exists because the server takes half a minute to come up
 * and a new probe is wrong four times before it is right, and the whole suite between each of
 * those is the difference between checking a thing and guessing at it. Every claim in a commit
 * message comes from a run with no `--only` at all.
 *
 * **What it is not.** It is not a replacement for `npm test` and never will be: it asks about a
 * dozen things and the validator asks about a thousand. It is the other half -- the half that can
 * only be answered by doing it.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

/** The system folder this file lives in, which is what gets linked into the scratch data dir. */
const SYSTEM_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* -------------------------------------------- */
/*  Where everything is                         */
/* -------------------------------------------- */

const arg = (name, fallback = null) => {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const flag = name => process.argv.includes(`--${name}`);

/*
 * **Found rather than configured**, because the one thing a harness must not do is need a setup
 * step of its own. The Windows installer's folder is named for the generation it first installed
 * and never renamed, so a machine running 14 can have it under `FVTT12` -- which is exactly the
 * kind of thing that is worth probing for rather than asserting.
 */
const APP_CANDIDATES = [
  process.env.FOUNDRY_APP,
  arg("app"),
  "C:/Program Files/FVTT12/Foundry Virtual Tabletop/resources/app",
  "C:/Program Files/Foundry Virtual Tabletop/resources/app",
  "/Applications/FoundryVTT.app/Contents/Resources/app",
  `${os.homedir()}/foundryvtt/resources/app`,
  `${os.homedir()}/foundryvtt`
].filter(Boolean);

const DATA_CANDIDATES = [
  process.env.FOUNDRY_DATA,
  arg("data"),
  `${process.env.LOCALAPPDATA ?? ""}/FoundryVTT`,
  `${os.homedir()}/Library/Application Support/FoundryVTT`,
  `${os.homedir()}/.local/share/FoundryVTT`
].filter(Boolean);

function findApp() {
  for (const dir of APP_CANDIDATES) {
    const main = path.join(dir, "main.mjs");
    if (fs.existsSync(main)) return { dir, main };
  }
  throw new Error("Could not find Foundry's resources/app. Pass --app=<dir> or set FOUNDRY_APP.\n"
    + `Looked in:\n  ${APP_CANDIDATES.join("\n  ")}`);
}

function findData() {
  for (const dir of DATA_CANDIDATES) {
    if (fs.existsSync(path.join(dir, "Data", "worlds"))) return dir;
  }
  throw new Error("Could not find a Foundry user data directory. Pass --data=<dir> or set "
    + `FOUNDRY_DATA.\nLooked in:\n  ${DATA_CANDIDATES.join("\n  ")}`);
}

const PORT = Number(arg("port", "30009"));
const SOURCE_WORLD = arg("world", "cardrpg-smoke");
const SCRATCH_WORLD = "cardrpg-live";

/* -------------------------------------------- */
/*  The scratch world                           */
/* -------------------------------------------- */

/**
 * **A data directory of its own**, built fresh and thrown away.  **[BUILT 2026-11-13]**
 *
 * The first version ran against the real one, which works right up until somebody has Foundry
 * open -- the desktop app takes a lock on the whole user data directory, and the harness died with
 * *this directory is already locked by another process* and a stack trace. A test you cannot run
 * while you are looking at the thing it tests is a test you will not run.
 *
 * So the server is given its own directory holding exactly three things:
 *
 *   Config/license.json              copied, the one file a server will not start without
 *   Data/systems/cardrpg             a junction to this repo, because 644 pieces of art are not
 *                                    worth duplicating per run -- and a link means the harness
 *                                    always tests the working tree rather than a stale copy
 *   Data/worlds/cardrpg-live         the copied world
 *
 * Nothing else: no modules, no other systems, no settings. That is a second property worth having
 * for free -- whatever the harness finds is the system's, not a module's.
 */
function makeScratchData(realData) {
  const root = path.join(os.tmpdir(), "cardrpg-live-data");
  removeScratchData(root);
  for (const dir of [["Config"], ["Data", "systems"], ["Data", "worlds"], ["Data", "modules"]]) {
    fs.mkdirSync(path.join(root, ...dir), { recursive: true });
  }

  const licence = path.join(realData, "Config", "license.json");
  if (!fs.existsSync(licence)) {
    throw new Error(`No licence at ${licence}. Run Foundry once, or pass --data=<dir>.`);
  }
  fs.copyFileSync(licence, path.join(root, "Config", "license.json"));
  /* A junction rather than a copy. Windows allows one without elevation; a symlink does not. */
  fs.symlinkSync(SYSTEM_DIR, path.join(root, "Data", "systems", "cardrpg"), "junction");
  return root;
}

/**
 * Delete the scratch directory, **unlinking the junction first and checking that it is one**.
 *
 * `fs.rmSync` does not follow links, so recursing into the repo should be impossible -- and
 * "should be impossible" is not the standard for a recursive delete pointed at a directory that
 * contains a link to the source tree. The link is removed by hand, and only after `lstat` agrees
 * it is a link.
 */
function removeScratchData(root) {
  const link = path.join(root, "Data", "systems", "cardrpg");
  if (fs.existsSync(path.dirname(link))) {
    let stat = null;
    try { stat = fs.lstatSync(link); } catch { stat = null; }
    if (stat?.isSymbolicLink()) fs.unlinkSync(link);
    else if (stat) throw new Error(`${link} is not a link; refusing to delete it.`);
  }
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
}

/**
 * Copy the world into the scratch directory.
 *
 * A world is a few hundred kilobytes of LevelDB, so this costs nothing and buys the only property
 * that matters: the probes may break whatever they like. `LOCK` is a running server's file and is
 * left behind; copying one into a fresh world is how you get a world that will not open.
 */
function makeScratchWorld(data, into) {
  const from = path.join(data, "Data", "worlds", SOURCE_WORLD);
  const worlds = path.join(into, "Data", "worlds");
  const to = path.join(worlds, SCRATCH_WORLD);
  if (!fs.existsSync(from)) {
    throw new Error(`No world "${SOURCE_WORLD}" in ${path.dirname(from)}. Pass --world=<id>.`);
  }
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true, filter: src => path.basename(src) !== "LOCK" });

  const manifest = path.join(to, "world.json");
  const world = JSON.parse(fs.readFileSync(manifest, "utf8"));
  world.id = SCRATCH_WORLD;
  world.title = "Card RPG live harness";
  world.description = "Built and deleted by test/live.mjs on every run. Nothing here is kept.";
  delete world.lastPlayed;
  fs.writeFileSync(manifest, JSON.stringify(world, null, 2), "utf8");
  return to;
}

/* -------------------------------------------- */
/*  Boot                                        */
/* -------------------------------------------- */

function startServer(main, data) {
  const server = spawn(process.execPath, [
    main, `--dataPath=${data}`, `--port=${PORT}`, "--noupnp", "--headless",
    `--world=${SCRATCH_WORLD}`
  ], { stdio: ["ignore", "pipe", "pipe"] });

  const log = [];
  server.stdout.on("data", d => log.push(String(d)));
  server.stderr.on("data", d => log.push(String(d)));

  return { server, log, ready: new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Foundry did not start in 90s:\n${log.join("")}`)),
      90000);
    server.stdout.on("data", d => {
      if (String(d).includes("listening")) { clearTimeout(timer); resolve(); }
    });
    server.on("exit", code => {
      clearTimeout(timer);
      const text = log.join("");
      /* It should not happen now the harness has a directory of its own, but this message
       * arrived once buried in a stack trace and cost a run to read. */
      if (/already locked by another process/.test(text)) {
        reject(new Error("Foundry has that data directory locked. The harness uses a scratch "
          + "directory of its own, so this means --data= was pointed at a live one."));
        return;
      }
      reject(new Error(`Foundry exited with ${code} before listening:\n${log.join("")}`));
    });
  }) };
}

/**
 * Join as the first user there is, and **reload once if the world does not come up**.
 *
 * The reload is not superstition. The first socket a freshly redirected client opens can beat the
 * server's association of that session with a user, and `Game.getData` answers the race with an
 * empty payload -- which fails validation on `release` and leaves `game.ready` false for ever. A
 * second load has a session the server already knows about. One retry is enough; three is cheap.
 */
async function join(page) {
  await page.goto(`http://localhost:${PORT}/join`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("select[name=userId]", { timeout: 60000 });
  const user = await page.evaluate(() =>
    [...document.querySelectorAll("select[name=userId] option")].find(o => o.value)?.value);
  if (!user) throw new Error("The world has no users to join as.");
  await page.selectOption("select[name=userId]", user);
  await page.click("button[name=join]");

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.waitForFunction(() => globalThis.game?.ready === true, null, { timeout: 40000 });
      return attempt;
    } catch {
      if (attempt === 3) throw new Error("The world never reached game.ready.");
      await page.goto(`http://localhost:${PORT}/game`, { waitUntil: "domcontentloaded" });
    }
  }
}

/**
 * Put the engine's own modules on the page under one name, so a probe reads like the code does.
 *
 * Imported over HTTP from the running server rather than from disk: that is the **shipped** module
 * graph, the one the browser actually parses, so a probe cannot accidentally test a file the game
 * does not load.
 */
async function arm(page) {
  await page.evaluate(async () => {
    const [decks, resolve, graph, content, config] = await Promise.all([
      import("/systems/cardrpg/module/decks.mjs"),
      import("/systems/cardrpg/module/resolve.mjs"),
      import("/systems/cardrpg/module/graph.mjs"),
      import("/systems/cardrpg/module/content.mjs"),
      import("/systems/cardrpg/module/config.mjs")
    ]);
    const hero = game.actors.find(a => a.type === "character");
    if (!hero) throw new Error("The world holds no character to probe.");
    globalThis.LIVE = { ...decks, ...resolve, graph, content, CARDRPG: config.CARDRPG, hero };

    /*
     * **Stage a half, because a stack is an action now.**  [2026-11-22]
     *
     * The play panel used to hold every equipped item the moment it was equipped, so a probe
     * about the panel could open the tray and look. It does not any more: gear joins a stack
     * when a card above it says what the gear is for. Three probes were reading an empty panel
     * and two of them said so.
     *
     * It returns what it staged, so a probe that finds nothing can say *no Strike in hand*
     * rather than fail on a selector twenty seconds later.
     */
    /*
     * **Clean up after a fight rather than leaving it to `settle`.**  **[BUILT 2026-11-24]**
     *
     * `deleteCombat` runs `afterCombat` and does not await it, so a probe that ends a fight and
     * returns hands the NEXT probe a deck that is still being swept. `settle` has guarded against
     * that since it was written and the guard is a guess: it waits for the hand to stop changing
     * for a hundred and fifty milliseconds, which is long enough almost always.
     *
     * Almost always is the problem. One full run in three ended with a thirteen-check cascade
     * three hundred lines downstream -- a HUD with nothing in its hand, reported as *a Strike is
     * staged: false* -- and the probe that caused it had already returned. So a probe that starts
     * a fight finishes it: wait for the combat to be gone, wait for the card movement to stop,
     * then CHECK the hand is at size rather than assume the refill held.
     *
     * The same three steps `settle` does, in the one place that knows a fight just ended.
     */
    globalThis.LIVE.afterFight = async () => {
      const hero = globalThis.LIVE.hero;
      for (let i = 0; i < 40 && (game.combats?.size ?? 0); i++) {
        await new Promise(r => setTimeout(r, 50));
      }
      const hand = globalThis.LIVE.deckOf(hero, "actionHand");
      let last = -1;
      let same = 0;
      for (let i = 0; i < 60 && same < 4; i++) {
        await new Promise(r => setTimeout(r, 50));
        const n = hand?.cards.size ?? 0;
        same = n === last ? same + 1 : 0;
        last = n;
      }
      const want = hero.system.handSize?.max ?? 5;
      for (let i = 0; i < 20 && (hand?.cards.size ?? 0) < want; i++) {
        await globalThis.LIVE.refill(hero);
        await new Promise(r => setTimeout(r, 100));
      }
      return hand?.cards.size ?? 0;
    };

    globalThis.LIVE.stageStrike = async (half = "primary") => {
      const hand = globalThis.LIVE.deckOf(globalThis.LIVE.hero, "actionHand");
      const card = hand?.cards?.contents
        ?.find(c => (c.system[half] ?? []).some(st => st.verb === "strike"));
      const tray = game.cardrpg.openTray(globalThis.LIVE.hero);
      tray.side = "action";
      tray.staged = card ? [{ cardId: card.id, half }] : [];
      await tray.render();
      return card?.name ?? null;
    };

    /*
     * **And the companion, because staging leaks.**  [2026-11-22]
     *
     * A staged half changes what the tray shows beyond its own stack: `#conditionsFor` filters the
     * conditions to the ones bearing on the staged verbs, so a Strike left staged by one probe put
     * Graven at the front of the condition cards and the probe three further down -- which asserts
     * the FIRST condition card is the Dazed it just applied -- failed on a picture it was right
     * about. A probe that leaves a stack standing is a probe that edits its neighbours.
     */
    /*
     * **Wait until something is on the screen.**  [BUILT 2026-11-23]
     *
     * The companion to `await tray.render()`, which resolves when the application has handed its
     * element over rather than when the browser has drawn it. Probes that render and then read
     * the DOM in the same breath are asking a question of a screen that may not exist yet, and
     * two of them had been failing on alternate runs for a week because of it.
     *
     * It polls a condition rather than counting frames, because a count is only ever right until
     * the machine is busier: two frames was enough until it was not. Returns whether it ever came
     * true, so a caller can tell *not drawn* from *drawn and wrong* -- and the condition must be
     * about the panel EXISTING, never about the answer being the expected one, or the probe waits
     * for the result it wants.
     */
    globalThis.LIVE.drawn = async (ready, tries = 60) => {
      for (let i = 0; i < tries; i++) {
        if (ready()) return true;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      return false;
    };

    globalThis.LIVE.unstage = async () => {
      const tray = game.cardrpg.openTray(globalThis.LIVE.hero);
      tray.staged = [];
      tray.waved.clear();
      await tray.render();
    };
  });
}

/* -------------------------------------------- */
/*  The probes                                  */
/* -------------------------------------------- */

const results = [];
const check = (name, got, want) => results.push({ name, got, want });

/*
 * **Everything the page asked the server for and did not get.**
 *
 * A 404 is the one kind of fault a browser reports and then carries on from, which makes it the
 * exact shape of defect a human misses: the deck backs 404'd on every render for months and the
 * piles simply fell back to their hatch, so the game looked drawn rather than broken.
 */
const missing = new Set();

/** Run one probe in its own try, so a broken probe is one failed row and not a dead run. */
/* See the usage note at the top: this is for writing a probe, never for trusting a run. */
const ONLY = (arg("only", null) ?? "").split(",").filter(Boolean);
async function probe(name, fn) {
  if (ONLY.length && !ONLY.some(part => name.includes(part))) return;
  try {
    const rows = await fn();
    for (const [label, got, want] of rows) check(label, got, want);
  } catch (err) {
    check(name, `threw: ${String(err.message ?? err).split("\n")[0]}`, "no throw");
  }
}

/** Everything back to a known state, so probes do not inherit each other's leavings. */
async function settle(page) {
  await page.evaluate(async () => {
    const { hero } = LIVE;
    /*
     * **Wait for whatever is still moving cards to stop.**  [2026-11-22]
     *
     * `deleteCombat` runs `afterCombat`, which walks every pile putting the hand back, and
     * nothing awaits it -- so a probe that ends a fight hands the next one a deck that is still
     * being shuffled. Settling on top of that emptied the hand, and a probe three further down
     * reported *no Strike in hand*: a true statement about a hand that was mid-move.
     *
     * It has always been possible and it started happening when a fight began dealing a hand,
     * which is twice the card movement in the same unawaited window. A known state has to begin
     * by waiting for the last one to finish.
     */
    const waiting = LIVE.deckOf(hero, "actionHand");
    let last = -1;
    let same = 0;
    for (let i = 0; i < 40 && same < 3; i++) {
      await new Promise(r => setTimeout(r, 50));
      const n = waiting?.cards.size ?? 0;
      same = n === last ? same + 1 : 0;
      last = n;
    }
    await LIVE.afterCombat(hero);
    await LIVE.refill(hero);
    await LIVE.reserveHand(hero, false);
    /*
     * **And then check the hand really is at size.**  [BUILT 2026-11-23]
     *
     * The refill above is awaited, so after it the hand IS full -- unless something still in
     * flight lands afterwards and empties it again, which is exactly what `afterCombat` does when
     * a fight has just ended: `deleteCombat` calls it without awaiting, and the quiet-wait at the
     * head of this function is a guess at how long that takes rather than a fact about it.
     *
     * The symptom is always the same and never says what it is: a probe three hundred lines later
     * reports *nothing in hand*, or times out waiting for a stack panel that has nothing to draw,
     * and takes six checks down with it. A known state has to be checked rather than arranged, so
     * this refills again if the hand has gone and gives up quietly rather than hanging.
     */
    const want = hero.system.handSize?.max ?? 5;
    for (let i = 0; i < 20 && (LIVE.deckOf(hero, "actionHand")?.cards.size ?? 0) < want; i++) {
      await new Promise(r => setTimeout(r, 100));
      await LIVE.refill(hero);
    }
    /*
     * **And the window on the action side.**  [2026-11-14] The mode picks the side now -- a fight
     * is the action deck, a scene is the skill deck -- and these probes run out of combat, so
     * without this the hand they are all about is not on the screen. Pinned here rather than
     * started per probe because it is part of *a known state*, which is what this function is.
     */
    const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
    for (const tray of CardRPGTray.openTrays) {
      if (tray.actor?.type === "npc") continue;
      tray.side = "action";
      /*
       * **And the turn's budget.**  [2026-11-22] A spent turn greys out every half in the hand,
       * so a probe that plays one and walks away hands the next probe a hand it cannot stage
       * from -- which reads exactly like the renderer being broken. Out of combat every turn is
       * the same turn, so nothing else would ever clear it.
       */
      tray.playedAt = null;
      tray.spentHalves = { primary: false, secondary: false };
      /*
       * **And every deck shut.**  [2026-11-23] More than one can be open now, and an open deck
       * puts a row of cards across the middle of the screen -- over whatever the next probe is
       * about to click on. One at a time used to make this self-limiting; a set does not.
       */
      tray.openPiles.clear();
    }
    /*
     * **And the deal marker, which is on the ACTOR now.**  [2026-11-22] It was a field on the
     * tray and went with the two above; it is a flag, so it survives the window being closed and
     * a probe that starts a fight leaves it behind for every probe after. A known state is a
     * state with no memory of a turn in it.
     */
    await hero.unsetFlag("cardrpg", "dealtAt");
  });
}

async function probes(page) {
  /*
   * **The whole hand turns through one gate, and it sets rather than toggles.**
   *
   * This is the shape the shipped bug could not have survived: ask for `true` twice and the second
   * call must move nothing. A toggle answers `n` both times.
   */
  await probe("the hand gate", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const hand = LIVE.deckOf(hero, "actionHand");
      const size = hand.cards.size;
      const first = await LIVE.reserveHand(hero, true);
      const allHeld = hand.cards.contents.every(c => LIVE.isReserved(c));
      const again = await LIVE.reserveHand(hero, true);
      const back = await LIVE.reserveHand(hero, false);
      const allUp = hand.cards.contents.every(c => !LIVE.isReserved(c));
      return [
        ["a dealt hand has cards in it", size > 0, true],
        ["holding a hand turns every card", first === size && allHeld, true],
        ["and asking twice moves nothing the second time", again, 0],
        ["bringing it back upright turns them all back", back === size && allUp, true]
      ];
    });
  });

  /*
   * **And the button the player actually presses.**
   *
   * The gate above is new code and was correct the day it was written. What shipped broken was the
   * handler, and nothing short of clicking it can tell the two apart -- so this clicks it.
   */
  await probe("the Hold all button", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
    await page.waitForSelector("[data-action=reserveAll]", { timeout: 20000 });

    const upright = () => page.evaluate(() => LIVE.uprightCards(LIVE.hero).length);
    const before = await upright();
    await page.click("[data-action=reserveAll]");
    await page.waitForFunction(() => LIVE.uprightCards(LIVE.hero).length === 0, null,
      { timeout: 10000 }).catch(() => {});
    const held = await upright();
    await page.click("[data-action=reserveAll]");
    await page.waitForFunction(n => LIVE.uprightCards(LIVE.hero).length === n, before,
      { timeout: 10000 }).catch(() => {});
    const again = await upright();
    return [
      ["pressing Hold all holds the whole hand", held, 0],
      ["and pressing it again brings the whole hand back", again, before]
    ];
  });

  /*
   * **A turn that is over leaves a hand that will not react.**
   *
   * A breath is a turn, and it is the one that is easy to forget: a hero who breathes has just
   * bought stamina back and would otherwise hand it straight to the next four hits.
   */
  await probe("a breath disarms the hand", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const { hero } = LIVE;
      await hero.update({ "system.stamina.value": Math.max(1, hero.system.stamina.max - 4) });
    });
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
    await page.waitForSelector("[data-action=breathe]", { timeout: 20000 });
    const before = await page.evaluate(() => LIVE.hero.system.stamina.value);
    await page.click("[data-action=breathe]");
    /*
     * Wait on the **last** thing the handler does, not the first. `catchBreath` writes the stamina
     * and `#disarmHand` then turns the hand card by card, so a wait on the number came back with
     * three of five still upright -- a race in the probe that reads exactly like a broken rule.
     */
    await page.waitForFunction(() => LIVE.uprightCards(LIVE.hero).length === 0, null,
      { timeout: 15000 }).catch(() => {});
    return page.evaluate(got => {
      const { hero } = LIVE;
      return [
        ["a breath buys two stamina back", hero.system.stamina.value - got, 2],
        ["and what is left in hand goes sideways", LIVE.uprightCards(hero).length, 0]
      ];
    }, before);
  });

  /*
   * **And the next round stands it back up.**
   *
   * The bug this probe exists for was found by a person looking at their hand, which is the part
   * worth recording. `move` clears the flag on every card it moves and a check pinned that, so
   * *everything you draw arrives upright* was true of the arrivals and false of the survivors: a
   * turn ends by turning the whole hand sideways, and the leftovers came back down a round later
   * under a row of upright new ones. Every check about the flag had asked about a card that moved.
   *
   * So this holds a hand the player cannot have refilled past -- a FULL one, where the refill
   * deals nothing at all -- because a probe that drew five new cards would pass on the arrivals
   * and never ask about the three that stayed.
   */
  await probe("a round stands the hand back up", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const hand = LIVE.deckOf(hero, "actionHand");
      const size = hand.cards.size;
      const held = await LIVE.reserveHand(hero, true);
      const downBefore = hand.cards.contents.filter(c => LIVE.isReserved(c)).length;
      const { drawn, roused } = await LIVE.refill(hero);
      const downAfter = hand.cards.contents.filter(c => LIVE.isReserved(c)).length;
      return [
        ["a full hand was turned down", held === size && downBefore === size, true],
        ["the refill deals nothing into a full hand", drawn, 0],
        ["and it stands every one of them up anyway", downAfter, 0],
        ["counting what it stood up", roused, size],
        ["so the whole hand can react again", LIVE.uprightCards(hero).length, size]
      ];
    });
  });

  /*
   * **A card already down is a click target all over, and the row says which way it is.**
   *
   * Turning one back took hitting the reaction row, which on a rotated card is a sliver of
   * vertical text -- and on an intruder, which has no row, there was nothing to hit at all. The
   * card body is clicked here rather than the button, because the button was never the problem.
   */
  await probe("a turned card is its own switch", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
    await page.waitForSelector(".cr-card .cr-half--reaction", { timeout: 20000 });

    const reserveTargets = () => page.locator("[data-action=reserve]").count();
    const upWhenUp = await reserveTargets();
    const armed = await page.locator(".cr-card .cr-half--reaction").first().innerText();

    await page.click("[data-action=reserveAll]");
    await page.waitForSelector(".cr-card--reserved", { timeout: 10000 });
    const downTargets = await reserveTargets();
    const heldText = await page.locator(".cr-card--reserved .cr-half--reaction").first().innerText();

    /*
     * **Wait for the whole hand to be down, not for the first card that is.**  [2026-11-23]
     *
     * `reserveAll` turns every card in the hand, and every card it writes can bring a render of
     * its own, so the selector above is satisfied by a hand that is **still being turned** -- and
     * the click below then lands in the middle of the next render, on a card the renderer is
     * about to replace. It stood up and was drawn again down, and the probe read 0.
     *
     * This was a rare flake for a week and became a reliable one the day `_onRender` grew a
     * fourth measurement, which is the honest version of what happened: the race was always here
     * and the window it needed got wider. The claim being tested is about a hand that is down, so
     * waiting for one is not a workaround -- it is the precondition, written down.
     */
    await page.waitForFunction(() => {
      const held = LIVE.deckOf(LIVE.hero, "actionHand").cards.contents
        .filter(c => LIVE.isReserved(c)).length;
      return held > 0 && document.querySelectorAll(".cr-card--reserved").length === held;
    }, null, { timeout: 10000 }).catch(() => {});

    /* The NAME, not the reaction button: the whole card is the claim being tested. */
    const before = await page.evaluate(() => LIVE.uprightCards(LIVE.hero).length);
    await page.locator(".cr-card--reserved .cr-card__name").first().click();
    await page.waitForFunction(n => LIVE.uprightCards(LIVE.hero).length === n + 1, before,
      { timeout: 10000 }).catch(() => {});
    const after = await page.evaluate(() => LIVE.uprightCards(LIVE.hero).length);

    await settle(page);
    return [
      ["an upright row says it is armed", /armed/i.test(armed), true],
      ["and a turned one says it is held", /held/i.test(heldText), true],
      ["a turned hand offers more to click than an upright one", downTargets > upWhenUp, true],
      ["and clicking the card body alone stands it up", after - before, 1]
    ];
  });

  /*
   * **A turn is a primary and a secondary, and the tray has to count.**
   *
   * core-rules has said it since the rules were written, and the only thing enforcing it was the
   * staging list holding at most one of each -- which playing then emptied. A five-card hand was
   * five actions. Two halves of this: that playing books what it played, and that a booked half
   * is dead on the face as well as in the handler.
   */
  await probe("a spent turn leaves only the reaction", async () => {
    await settle(page);
    /*
     * **In a fight, because outside one there is no turn to spend.**  [FIXED 2026-11-23]
     *
     * This probe used to book a spent turn out of combat and assert the hand went dead, and the
     * convenience was written down as one: *these probes run out of combat, where the turn key is
     * the constant the tray compares against*. That constant is exactly what made a card played
     * outside a fight spend its half for ever, which is now ruled against -- so the shortcut was
     * testing the fault rather than the rule.
     *
     * The budget is a turn's and a turn is a thing a fight has, so the fight is set up here and
     * taken down at the end.
     */
    await page.evaluate(async () => {
      const { hero } = LIVE;
      const token = (await hero.getTokenDocument({ x: 1500, y: 1500, actorLink: true }))
        .toObject();
      const [placed] = await canvas.scene.createEmbeddedDocuments("Token", [token]);
      globalThis.LIVE.spentToken = placed.id;
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant",
        [{ tokenId: placed.id, sceneId: canvas.scene.id, actorId: hero.id }]);
      await combat.startCombat();
      await new Promise(r => setTimeout(r, 1200));
    });
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      tray.playedAt = null;
      tray.spentHalves = { primary: false, secondary: false };
      await tray.render();
    });
    await page.waitForSelector(".cr-card .cr-half--reaction", { timeout: 20000 });

    const playable = () => page.locator(".cr-hud__hand [data-action=stage]").count();
    const switches = () => page.locator(".cr-hud__hand .cr-card--toggles").count();
    const openHalves = await playable();
    const openSwitches = await switches();

    /* Booked directly rather than by playing a turn: what is under test here is what a booked
     * turn DOES, and the booking itself is pinned on the order of two lines offline. The key comes
     * from `turnKey` rather than being spelled here, which is the whole reason that function was
     * exported -- two files cannot disagree about what a turn is called. */
    await page.evaluate(async () => {
      const { turnKey } = await import("/systems/cardrpg/module/combat.mjs");
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.playedAt = turnKey(game.combat.round, game.combat.turn);
      tray.spentHalves = { primary: true, secondary: true };
      await tray.render();
    });
    await page.waitForFunction(
      () => document.querySelectorAll(".cr-hud__hand [data-action=stage]").length === 0,
      null, { timeout: 10000 }).catch(() => {});
    const spentHalves = await playable();
    const spentSwitches = await switches();
    const tips = await page.evaluate(() =>
      [...document.querySelectorAll(".cr-hud__hand .cr-half--blocked [data-tooltip]")]
        .map(el => el.getAttribute("data-tooltip") ?? ""));

    /* Clicking the body of one still toggles it, which is the only move it has left. */
    const upBefore = await page.evaluate(() => LIVE.uprightCards(LIVE.hero).length);
    await page.locator(".cr-hud__hand .cr-card--toggles .cr-card__name").first().click();
    await page.waitForFunction(n => LIVE.uprightCards(LIVE.hero).length === n - 1, upBefore,
      { timeout: 10000 }).catch(() => {});
    const upAfter = await page.evaluate(() => LIVE.uprightCards(LIVE.hero).length);

    /*
     * **And the fight comes down, with the hand put back by hand.**  [2026-11-23]
     *
     * `deleteCombat` runs `afterCombat`, which walks every pile putting the hand away, and nothing
     * awaits it -- so the probe after this one was handed a hand that was still being emptied and
     * reported *nothing in hand*, which is a true statement about a hand mid-move. `settle` has a
     * quiet-wait at its head for exactly this and it is not enough on its own here, because the
     * delete and the wait are in two different evaluates.
     *
     * Both halves awaited in the same breath as the delete, so there is nothing left in flight to
     * land afterwards: this is the same pair `settle` runs, run where the fight ends.
     */
    await page.evaluate(async () => {
      for (const c of [...(game.combats ?? [])]) await c.delete();
      await new Promise(r => setTimeout(r, 1200));
      await LIVE.afterCombat(LIVE.hero);
      await LIVE.refill(LIVE.hero);
      const token = canvas.scene.tokens.get(globalThis.LIVE.spentToken);
      if (token) await token.delete();
    });
    await settle(page);
    await page.evaluate(async () => {
      /* settle restores state; the screen still shows what the spent turn drew. */
      await game.cardrpg.openTray(LIVE.hero).render();
    });
    await page.waitForFunction(
      () => document.querySelectorAll(".cr-hud__hand [data-action=stage]").length > 0,
      null, { timeout: 10000 }).catch(() => {});
    const backAgain = await playable();
    return [
      ["a fresh turn has halves to play", openHalves > 0, true],
      ["and no card is a switch while they can be played", openSwitches, 0],
      ["a spent turn leaves not one half clickable", spentHalves, 0],
      ["and every one of those cards becomes a switch", spentSwitches > 0, true],
      ["the face says why it is dead",
        tips.some(t => /spent this turn|Exhausted/.test(t)) || tips.slice(0, 2).join(" ~ "), true],
      ["clicking one holds its reaction", upBefore - upAfter, 1],
      ["and the next turn gives the halves back", backAgain, openHalves]
    ];
  });

  /*
   * **Stamina is how many cards you may play, and running out is a wall made of the draw pile.**
   */
  await probe("stamina", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      /*
       * **Inside a fight, because stamina is a fight's measure.**  [2026-11-23]
       *
       * It used to be asked of a quiet world, which worked for as long as the stat could be spent
       * anywhere. It cannot: nothing charges stamina outside a fight now, because `afterCombat` is
       * the one routine that gives it back and a fight that never started never ends -- so every
       * point spent in a corridor was gone for the evening, and at zero the draw pile went with
       * it. That ruling made this probe a question about a state the rules forbid, and it threw on
       * the `null` the gate returns, which is the right way for it to have noticed.
       */
      for (const c of [...(game.combats ?? [])]) await c.delete();
      const token = (await hero.getTokenDocument({ x: 1400, y: 1400, actorLink: true }))
        .toObject();
      const [placed] = await canvas.scene.createEmbeddedDocuments("Token", [token]);
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant",
        [{ tokenId: placed.id, sceneId: canvas.scene.id, actorId: hero.id }]);
      await combat.startCombat();
      /* The round deals every character their hand, and nothing awaits it: a deck read while that
       * is still moving cards is a deck mid-move. */
      const hand = LIVE.deckOf(hero, "actionHand");
      const want = hero.system.handSize?.max ?? 5;
      for (let i = 0; i < 30 && hand.cards.size < want; i++) {
        await new Promise(r => setTimeout(r, 100));
      }
      await new Promise(r => setTimeout(r, 400));
      const fighting = !!game.combat?.started;

      const max = hero.system.stamina.max;
      await hero.update({ "system.stamina.value": max });
      await LIVE.spendStamina(hero, 1);
      const afterOne = hero.system.stamina.value;

      await hero.update({ "system.stamina.value": 1 });
      const deck = LIVE.deckOf(hero, "action");
      /*
       * `available` and not `cards.size`: a deck keeps the cards that have been dealt out of it,
       * marked drawn, so the pile you can actually draw from is the smaller number. The first run
       * of this probe asked for 16 and got 11, which is five cards sitting in a hand.
       */
      const held = LIVE.available(deck).length;
      const out = await LIVE.spendStamina(hero, 1);
      const answer = [
        ["a fight is running, which is the only place stamina is spent", fighting, true],
        ["playing a card costs a point of stamina", max - afterOne, 1],
        ["the draw pile is full before the last point goes", held > 0, true],
        ["at zero the draw pile is discarded", LIVE.available(deck).length, 0],
        ["and it says how many cards that was", out.dumped, held],
        ["stamina never goes below zero", hero.system.stamina.value, 0]
      ];
      /*
       * **Stamina back before anything else**, because this probe deliberately took it to nought
       * and nought is the one state from which the hand cannot be refilled: the wall it measures
       * dumps the draw pile, and a refill with no stamina to spend draws nothing. `afterFight`
       * below then spun twenty times and gave up, and a probe four hundred lines later reported
       * **nothing in hand** -- a true statement about a hand nobody could fill.
       *
       * `afterCombat` would do it too, and is what `settle` leans on; a probe that breaks
       * something on purpose puts it back itself rather than leaving the next one to cope.
       */
      await hero.update({ "system.stamina.value": max });
      /*
       * Ended, and then WAITED FOR. `deleteCombat` sweeps the piles itself and does not await it,
       * so a second sweep from here throws over a card the first has already moved -- and simply
       * returning hands the next probe a deck mid-move. `afterFight` does neither: it waits, then
       * checks the hand is at size.
       */
      await combat.delete();
      await placed.delete();
      await LIVE.afterFight();
      return answer;
    });
  });

  /*
   * **A breath buys the stat and moves no cards**, which is the ruling of 2026-11-12 read back out
   * of the engine rather than out of the comment above it.
   */
  await probe("catch breath", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const max = hero.system.stamina.max;
      await hero.update({ "system.stamina.value": max - 1 });
      const discard = LIVE.deckOf(hero, "actionDiscard");
      const before = { discard: discard.cards.size, hand: LIVE.deckOf(hero, "actionHand").cards.size };
      const got = await LIVE.catchBreath(hero);
      const after = { discard: discard.cards.size, hand: LIVE.deckOf(hero, "actionHand").cards.size };

      await hero.update({ "system.stamina.value": max });
      const atFull = LIVE.canCatchBreath(hero);
      const refused = await LIVE.catchBreath(hero);
      return [
        ["a breath never takes you over your maximum", hero.system.stamina.value, max],
        ["so one short of full buys exactly one", got.recovered, 1],
        ["and it moves no cards at all",
          after.discard === before.discard && after.hand === before.hand, true],
        ["breathing at full stamina is refused", atFull, false],
        ["and refused rather than wasted", refused, null]
      ];
    });
  });

  /*
   * **What a fight costs you past its own end**: Spent cards, Wounds and Taint. Not stamina, not
   * Block, and never a Fear.
   */
  await probe("after the fight", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const hand = LIVE.deckOf(hero, "actionHand");
      const spentPile = LIVE.deckOf(hero, "actionSpent");
      const deck = LIVE.deckOf(hero, "action");

      /* One card set aside as Spent, which must still be set aside afterwards. */
      const victim = hand.cards.contents[0];
      await LIVE.move(hand, spentPile, [victim.id]);
      await LIVE.resolveFear(hero, { amount: 1, target: hero });
      await hero.update({ "system.stamina.value": 1, "system.block": 5 });

      const fearBefore = LIVE.allStacks(hero)
        .flatMap(s => s.cards.contents).filter(c => c.type === "fear").length;
      await LIVE.afterCombat(hero);
      const fearAfter = LIVE.allStacks(hero)
        .flatMap(s => s.cards.contents).filter(c => c.type === "fear").length;

      return [
        ["a fight deals a Fear into the deck", fearBefore > 0, true],
        ["stamina comes back in full, because it measures one fight",
          hero.system.stamina.value, hero.system.stamina.max],
        ["Block does not outlive the fight", hero.system.block, 0],
        ["nor does a Fear", fearAfter, 0],
        ["the hand is swept back in", hand.cards.size, 0],
        ["and a Spent card is still Spent", spentPile.cards.size, 1],
        ["so it is not back in the draw pile either",
          LIVE.available(deck).some(c => c.id === victim.id), false]
      ];
    });
  });

  /** **A rest returns Spent cards**, and a long one heals five rather than one. */
  await probe("a rest", async () => {
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const spentPile = LIVE.deckOf(hero, "actionSpent");
      const held = spentPile.cards.size;
      await hero.update({ "system.health.value": Math.max(1, hero.system.health.max - 6) });
      const hurt = hero.system.health.value;

      await LIVE.rest(hero);
      const shortHeal = hero.system.health.value - hurt;
      const returned = spentPile.cards.size;

      await hero.update({ "system.health.value": hurt });
      await LIVE.rest(hero, { long: true });
      return [
        ["there was a Spent card to come back", held > 0, true],
        ["a rest brings every Spent card back", returned, 0],
        ["a short rest heals one", shortHeal, 1],
        ["a long rest heals five", hero.system.health.value - hurt, 5]
      ];
    });
  });

  /** **Hand size is capped at seven**, and the sheet is told what the cap ate. */
  await probe("the hand size cap", async () => {
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const base = hero.system.handSize.base;
      await hero.update({ "system.handSize.base": 9 });
      const over = { ...hero.system.handSize };
      await hero.update({ "system.handSize.base": base });
      const normal = { ...hero.system.handSize };
      return [
        ["nine wanted comes back as seven", over.max, 7],
        ["the cap is reported, not inferred", over.cap, LIVE.CARDRPG.defaults.handSizeMax],
        ["and the two the cap ate are counted", over.wasted, 2],
        ["under the cap nothing is wasted", normal.wasted, 0],
        ["and the base is what it was", normal.max, base]
      ];
    });
  });

  /*
   * **The caps, asked of the function that enforces them rather than of the table.**
   *
   * `null` is the table's word for *uncapped*, and it had to survive a read that said `?? 1` --
   * which it did not. The readout in `validate.mjs` reads `config.mjs`, where the `null` is still
   * sitting correctly, so the suite was green while the rule was dead.
   */
  await probe("the injury caps", async () => {
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const made = [];
      const give = async name => {
        const before = hero.items.size;
        await LIVE.applyInjury(hero, name, { cause: "the harness" });
        if (hero.items.size > before) made.push(hero.items.contents.at(-1));
        return hero.items.size > before;
      };
      const room = c => LIVE.roomForInjury(hero, c);

      const rows = [];
      rows.push(["an unhurt hero has room for a maiming", room("maiming"), true]);
      await give("Lost Eye");
      rows.push(["and for a second one, because maimings are uncapped", room("maiming"), true]);
      await give("Bad Leg");
      rows.push(["and a third, which is what uncapped means", room("maiming"), true]);

      rows.push(["breaking has room at none", room("breaking"), true]);
      await give("Shattered Nerves");
      rows.push(["and at one, because the cap is two", room("breaking"), true]);
      await give("Night Fears");
      rows.push(["and none at two", room("breaking"), false]);

      rows.push(["an obligation has room at none", room("obligation"), true]);
      await give("The Debt");
      rows.push(["and none at one", room("obligation"), false]);
      /* Curse and corruption were never touched, so they stay open; maiming is open because it
       * is uncapped, which is the row this whole probe exists for. */
      rows.push(["so the open list is what is left",
        LIVE.openInjuryCategories(hero).sort().join(","), "corruption,curse,maiming"]);

      for (const slate of made) await slate.delete();
      return rows;
    });
  });

  /*
   * **One exit for an injury**, which pulls back the cards it dealt rather than leaving them in
   * the deck with nothing to explain them.
   */
  await probe("lifting an injury", async () => {
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const intruders = () => LIVE.allStacks(hero).flatMap(s => s.cards.contents)
        .filter(c => LIVE.isIntruder(c)).length;
      /* Five of the fourteen carry intruder cards and *Rotted* is not one of them -- the first
       * run of this probe lifted an injury that had dealt nothing and proved nothing by it. */
      const before = intruders();
      await LIVE.applyInjury(hero, "Compelled Step", { cause: "the harness" });
      const slate = hero.items.contents.find(i => i.name === "Compelled Step");
      const dealt = intruders();
      const lifted = await LIVE.liftInjury(hero, slate);
      return [
        ["an injury that deals cards deals them", dealt > before, true],
        ["lifting it is allowed", !!lifted, true],
        ["the slate is gone", !hero.items.contents.some(i => i.name === "Compelled Step"), true],
        ["and so are the cards it dealt", intruders(), before]
      ];
    });
  });

  /*
   * **A prune, driven through its own dialog, on the name that broke it.**
   *
   * The option value is an index now, and the only way to know that is to pick an option whose
   * label cannot survive a round trip through HTML escaping and see whether the card actually
   * goes. One action card in ninety-three carries an apostrophe, so the harness plants one.
   */
  await probe("pruning the card with an apostrophe", async () => {
    const planted = await page.evaluate(async () => {
      const { hero } = LIVE;
      const deck = LIVE.deckOf(hero, "action");
      const model = deck.cards.contents.find(c => c.type === "action");
      const data = model.toObject();
      delete data._id;
      data.name = "The Order's Shield";
      for (const face of data.faces ?? []) face.name = "The Order's Shield";
      await Card.create(data, { parent: deck });
      return deck.cards.contents.filter(c => c.name === "The Order's Shield").length;
    });

    await page.evaluate(() => {
      globalThis.LIVE.pruning = globalThis.LIVE.graph.prune(globalThis.LIVE.hero);
    });
    await page.waitForSelector("select[name=card]", { timeout: 20000 });
    const offered = await page.evaluate(() =>
      [...document.querySelectorAll("select[name=card] option")].map(o => o.textContent.trim()));
    await page.selectOption("select[name=card]", { label: "The Order's Shield" });
    await page.click("dialog button[data-action=ok], dialog button[type=submit]");
    const returned = await page.evaluate(() => globalThis.LIVE.pruning);

    const left = await page.evaluate(() => LIVE.deckOf(LIVE.hero, "action")
      .cards.contents.filter(c => c.name === "The Order's Shield").length);
    return [
      ["the deck holds the planted card", planted, 1],
      ["and the dialog offers it by name", offered.includes("The Order's Shield"), true],
      ["the prune reports that it pruned", returned, true],
      ["and the card is actually gone", left, 0]
    ];
  });

  /*
   * **The pictures are where the page looks for them.**  **[FIXED 2026-11-13]**
   *
   * A relative `url()` inside a **custom property** resolves against the stylesheet that consumes
   * the `var()`, not against the document -- so `systems/cardrpg/art/backs/action.webp` was asked
   * for as `systems/cardrpg/styles/systems/cardrpg/art/backs/action.webp` and every deck back in
   * the game 404'd. The path in the content was right, the file was there, the helper returned it
   * correctly, and nothing was wrong anywhere a reader of source would look.
   *
   * So this asks the browser what it computed, and then asks the server for it.
   */
  await probe("the art is where the page asks for it", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
    await page.waitForSelector(".cr-pile--faced", { timeout: 20000 });
    return page.evaluate(async () => {
      const faced = [...document.querySelectorAll(".cr-pile--faced")];
      const urls = faced.map(e => getComputedStyle(e).getPropertyValue("--cr-art").trim()
        .replace(/^url\(['"]?/, "").replace(/['"]?\)$/, ""));
      const codes = await Promise.all(urls.map(u =>
        fetch(u, { method: "HEAD" }).then(r => r.status).catch(() => 0)));
      return [
        ["the piles wear a back at all", faced.length > 0, true],
        ["every back is absolute from the server root",
          urls.filter(u => !u.startsWith("/")).join(" | ") || "all of them", "all of them"],
        ["every back names a real file", urls.every(u => /\.(webp|png|jpg|svg)$/.test(u)), true],
        ["and every one of them is served", [...new Set(codes)].join(","), "200"]
      ];
    });
  });

  /*
   * **And the cards wear theirs.**  **[FIXED 2026-11-13]**
   *
   * The starter deck was the one deck in `setup.mjs` that wrote its own card literal instead of
   * calling `actionCardData`, and that literal never carried the face's `img`. So the ten cards a
   * first session actually touches were the ten with no picture, in every world ever built, while
   * the files sat in `art/cards/starter/`. Both halves read correctly on their own: the builder
   * sets the art, the content names it, the files exist, and the deck that skipped the builder was
   * not visibly skipping anything.
   *
   * Setup is re-run here rather than trusted, because that is also the repair an existing world
   * needs: the signature moves with the fix, so a stack that is not mid-fight rebuilds itself.
   */
  await probe("the starter deck wears its pictures", async () => {
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const setup = await import("/systems/cardrpg/module/setup.mjs");
      const content = await import("/systems/cardrpg/module/content.mjs");
      /* Everything back in the deck: `resyncPlan` holds a stack with a game in progress, which is
       * the right refusal and would make this probe measure nothing. */
      await LIVE.afterCombat(hero);
      const before = LIVE.deckOf(hero, "action");
      /*
       * **The plan is checked rather than inferred from the result.** A probe that only looked at
       * the cards afterwards reported `0 of 16` and said nothing about why -- and the reason was
       * that an earlier probe had left the stack a card short of the number it was built with, so
       * `resyncPlan` quite correctly refused to touch a game in progress. A repair that cannot run
       * is a different fault from a repair that runs and fails, and the harness has to tell them
       * apart or it sends you hunting the wrong one.
       */
      const want = JSON.stringify(content.WARRIOR_DECK.flatMap(d =>
        Array.from({ length: d.copies ?? 1 }, () => LIVE.actionCardData(d))));
      const plan = setup.resyncPlan({
        built: before.getFlag("cardrpg", "cardrpgBuilt"), want, held: before.cards.size
      });

      await game.cardrpg.createStarterContent();
      const deck = LIVE.deckOf(hero, "action");
      const cards = deck.cards.contents.filter(c => c.type === "action");
      const drawn = cards.filter(c => LIVE.artOf(c));
      return [
        ["the deck is in a state setup may repair",
          plan === "held" ? `held: ${before.cards.size} cards against a build of `
            + `${JSON.parse(before.getFlag("cardrpg", "cardrpgBuilt") ?? "[]").length}` : plan,
          plan === "unchanged" ? "unchanged" : "rebuild"],
        ["the deck holds its cards", cards.length > 0, true],
        ["every one of them has a picture", drawn.length, cards.length],
        ["and it is the one drawn for that card",
          cards.every(c => LIVE.artOf(c).includes("art/cards/starter/")), true]
      ];
    });
  });

  /*
   * **What a picture actually looks like once the page has drawn it.**  **[FIXED 2026-11-13]**
   *
   * Two complaints, and the source read correctly for both, which is the whole reason this probe
   * exists.
   *
   * **The art was at 14%.** Four separate rules painted an 86% scrim on the name row, both halves,
   * the front and the back -- five boxes that tile a card -- so what each rule called *a ground
   * under text* multiplied into a lid. No single declaration was wrong and the product of them
   * was: strong ink-on-cream drawings read as a faint stain. A composite of alphas is not a thing
   * anybody checks by reading CSS, so it is measured here.
   *
   * **And the gear had no pictures at all: `0 of 5`.** Not a styling fault -- the documents were
   * empty. Setup finds a slate by its tag and reuses it verbatim, so every Item made before art
   * was wired up kept the blank `img` it was born with, along with every copy embedded on an
   * actor. The decks had learned to come back in line; the slates had not.
   */
  await probe("the pictures reach the eye", async () => {
    await settle(page);
    const staged = await page.evaluate(() => LIVE.stageStrike());
    await page.waitForSelector(".cr-hud__play", { timeout: 20000 });
    const rows = await page.evaluate(async () => {
      const alphaOf = el => {
        const m = getComputedStyle(el).backgroundColor
          .match(/rgba?\(([^)]+)\)/);
        if (!m) return 0;
        const parts = m[1].split(",").map(Number);
        return parts.length > 3 ? parts[3] : 1;
      };
      const artOn = el => getComputedStyle(el).getPropertyValue("--cr-art").trim();
      const out = [];

      // What is left of a picture after everything the card lays over it.
      const faced = [...document.querySelectorAll(".cr-card")].filter(artOn);
      /* A staged half is deliberately solid -- it inverts to say *this one is in the stack* -- so
       * it is not a scrim and counting it would read as the fault this probe is about. */
      const covered = faced.flatMap(card =>
        [...card.querySelectorAll(".cr-card__name, .cr-half:not(.cr-half--staged),"
          + " .cr-card__front, .cr-card__back")].map(alphaOf));
      const worst = covered.length ? Math.max(...covered) : 0;
      out.push(["a card on the scene carries a picture", faced.length > 0, true]);
      /* A third is the floor, not the target: the wash is 0.6, which leaves 40%. The gap is
       * there so a rule laid over a card in future has to be deliberate about it. */
      out.push(["and at least a third of it is still visible",
        (1 - worst) >= 0.33 ? "at least 33%" : `${Math.round((1 - worst) * 100)}%`,
        "at least 33%"]);

      // The gear. `img` is the field, `--cr-art` is what the page did with it.
      const gear = LIVE.hero.items.filter(i => i.type === "item");
      const withImg = gear.filter(i => LIVE.artOf(i));
      out.push(["the hero carries gear at all", gear.length > 0, true]);
      out.push(["and every piece of it names a picture", withImg.length, gear.length]);

      const stacked = [...document.querySelectorAll(".cr-hud__play .cr-card--stacked")];
      const named = stacked.filter(artOn);
      out.push(["a card is staged in the play panel", stacked.length > 0, true]);
      /* By NAME, not by count. `4 of 5` sends you looking through five cards; the name of the one
       * that is bare is the whole answer. [2026-11-22] */
      const bare = stacked.filter(e => !artOn(e))
        .map(e => e.querySelector(".cr-card__title")?.textContent.trim() || "unnamed");
      out.push(["and every one of them wears its picture", bare.join(", ") || "all of them",
        "all of them"]);

      const urls = named.map(e => artOn(e).replace(/^url\(['"]?/, "").replace(/['"]?\)$/, ""));
      const codes = await Promise.all(urls.map(u =>
        fetch(u, { method: "HEAD" }).then(r => r.status).catch(() => 0)));
      out.push(["and the server serves it", [...new Set(codes)].join(",") || "none", "200"]);
      return out;
    });
    /* Said rather than assumed: every row below the stack depends on one being there, so a hand
     * with no Strike in it should report that and not three picture faults. */
    await page.evaluate(() => LIVE.unstage());
    return [["a Strike was staged to look at", staged ?? "nothing in hand", staged ?? "a card"],
      ...rows];
  });

  /*
   * **A condition is a card, and it had nothing on it.**  **[BUILT 2026-11-13]**
   *
   * Twenty-five of them, face up on the table all fight under a duration counting down, and they
   * were on no art shelf at all -- so the brief reported every piece in the game drawn while the
   * cards a player reads most often were blank paper with a word on them.
   *
   * A condition is the one card with no document behind it: it is a record on the actor read
   * against `CARDRPG.conditions`, so there is no `img` for `artOf` to find and nothing for
   * `artIn` to be handed. The path is resolved from the key instead, and this is the probe that
   * says the resolution survives the trip through the template -- which is exactly the half that
   * source-reading cannot answer.
   *
   * **Drawn as of 2026-11-13**, so it asks the server for the files like every other shelf. The
   * two allowances this probe shipped with -- no fetch here, and `art/conditions/` dropped from
   * the missing set -- are gone with the commission that justified them.
   */
  await probe("a condition wears a picture", async () => {
    await settle(page);
    const rows = await page.evaluate(async () => {
      const { hero } = LIVE;
      await LIVE.resolveCondition(hero, {
        step: { condition: "dazed", duration: 3 }, target: hero
      });
      await game.cardrpg.openTray(hero);
      /* The tray re-renders off the update; give the application its frame. */
      await new Promise(r => setTimeout(r, 400));
      const card = [...document.querySelectorAll(".cr-card--condition")][0];
      const art = card ? getComputedStyle(card).getPropertyValue("--cr-art").trim() : "";
      const url = art.replace(/^url\(['"]?/, "").replace(/['"]?\)$/, "");
      const every = Object.keys(LIVE.CARDRPG.conditions).map(k => LIVE.conditionArt(k));
      /* Every one of them, not only the one on screen: a condition nobody happens to be carrying
       * during this run is still a card somebody will draw tonight. */
      const codes = await Promise.all(every.map(p => fetch(foundry.utils.getRoute(p),
        { method: "HEAD" }).then(r => r.status).catch(() => 0)));
      return [
        ["the condition landed and is on a card", !!card, true],
        ["the card names a picture", url.includes("art/conditions/") ? "yes" : url || "nothing",
          "yes"],
        ["absolute from the server root, not from the stylesheet",
          url.startsWith("/") ? "yes" : "no", "yes"],
        ["and it is this condition's own", url.endsWith("/dazed.webp") ? "yes" : url, "yes"],
        ["every condition in the game has one", every.filter(Boolean).length,
          Object.keys(LIVE.CARDRPG.conditions).length],
        ["and no two of them share a file", new Set(every).size, every.length],
        ["and the server serves every one", [...new Set(codes)].join(","), "200"]
      ];
    });
    /* Put the hero back as it was found, or every probe after this one is reading a Dazed hero. */
    await page.evaluate(() => LIVE.hero.update({ "system.conditions": [] }));
    return rows;
  });

  /*
   * **The fate deck's eight faces, and the three cards that wore nothing at all.**
   * **[BUILT 2026-11-13]**
   *
   * Two separate things, in the one deck that is always face down.
   *
   * The faces are new: the shelf was argued out of the brief on the grounds that twenty cards
   * which are a number want a design rather than twenty pictures, and it is **eight** faces over
   * twenty cards -- the ratio the twist deck is already drawn at. The glyph stays the subject, so
   * what this asks is only that every rung resolves to its own file.
   *
   * The second is a defect of the kind this project keeps finding. **`addFateCards` built a card
   * with no `faces` and no `back`** -- so a Blessed's temporary Critical, a Cursed's temporary
   * Miss and Shadow Magic's permanent Wild were the three cards in a fate deck wearing Foundry's
   * placeholder, face down, in front of everybody. `fateCards` has carried the back since the
   * backs were drawn; a second builder of the same document is a second place to forget a field.
   *
   * **Drawn as of 2026-11-13**, so the files are fetched like every other shelf's; the allowance
   * this probe shipped with lasted about an hour.
   */
  /*
   * **The critical deck, whose exemption argued only half of itself.**  **[BUILT 2026-11-13]**
   *
   * The brief said it *needs neither faces nor a back* and then gave one reason: a card is turned
   * face up the instant a Critical lands and read out, so it is never face down in front of
   * anybody. That is an argument about the **back** -- which still stands, and is checked here,
   * because a back on this deck would be a picture nobody ever sees. Applied to the **face** the
   * same sentence runs the other way: this is the one card in the game that is only ever seen
   * face up, read out to the table, at the loudest moment a fight has.
   *
   * Asked of the built documents rather than of `critCardData`, because the two halves of the
   * claim live in one object literal and a probe that reads the source would pass on a deck that
   * was never created.
   *
   * **Drawn as of 2026-11-13**, so the faces are fetched like every other shelf's. Every shelf
   * in the game is now held to a 200, and the harness carries no art allowance at all.
   */
  await probe("the critical deck is faced and backless", async () => {
    return page.evaluate(async () => {
      const deck = game.cards.find(c => c.getFlag("cardrpg", "cardrpgContent") === "crit-deck")
        ?? game.cards.find(c => c.name === "Critical Deck");
      const cards = deck?.cards.contents ?? [];
      const faces = cards.map(c => c.faces?.[0]?.img ?? "");
      return [
        ["the world has a critical deck", cards.length > 0, true],
        ["every card wears a face",
          faces.filter(f => f.includes("art/cards/crit/")).length, cards.length],
        ["seven faces over twelve cards", new Set(faces).size, 7],
        /*
         * **Read off `_source`, not off the document.** `card.back.img` came back set on all
         * twelve: Foundry derives a back for every Card whether one was written or not, so the
         * live field cannot tell "this system prints none" from "core filled it in". The claim
         * being checked is the first of those, and `_source` is the only place it is visible.
         * It does not matter to a player either way -- this deck is never face down -- which is
         * the whole reason it has no back to print.
         */
        ["and this system prints no back on any of them",
          cards.filter(c => c._source.back?.img).length, 0],
        ["and the server serves every face", [...new Set(await Promise.all(
          [...new Set(faces)].map(p => fetch(foundry.utils.getRoute(p), { method: "HEAD" })
            .then(r => r.status).catch(() => 0))))].join(","), "200"]
      ];
    });
  });

  await probe("the fate deck wears its faces", async () => {
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const deck = LIVE.deckOf(hero, "fate");
      const faces = deck.cards.contents.map(c => c.faces?.[0]?.img ?? "");
      const backs = deck.cards.contents.map(c => c.back?.img ?? "");
      const rungs = ["miss", "minusTwo", "minusOne", "zero", "plusOne", "plusTwo", "critical",
        "wild"];
      const every = rungs.map(k => LIVE.fateArt(k));

      /* The Wild is the one `addFateCards` builds, and the one that used to come out bare. */
      const before = deck.cards.size;
      await LIVE.addFateCards(hero, { special: "wild", count: 1, source: "the harness" });
      const wild = LIVE.deckOf(hero, "fate").cards.contents
        .find(c => c.system.special === "wild");
      const wildFace = wild?.faces?.[0]?.img ?? "";
      const wildBack = wild?.back?.img ?? "";
      if (wild) await wild.delete();

      return [
        ["the deck holds the fixed twenty", before, 20],
        ["every rung has a picture of its own", new Set(every).size, rungs.length],
        ["and none of them is empty", every.filter(Boolean).length, rungs.length],
        ["a card dealt by setup wears a face",
          faces.filter(f => f.includes("art/cards/fate/")).length, before],
        ["and the fate back", backs.filter(b => b.includes("backs/fate")).length, before],
        ["a card shuffled in later wears one too",
          wildFace.endsWith("/wild.webp") ? "yes" : wildFace || "nothing", "yes"],
        ["and is not the one card in the deck with no back",
          wildBack.includes("backs/fate") ? "yes" : wildBack || "nothing", "yes"],
        ["and the server serves every rung", [...new Set(await Promise.all(
          every.map(p => fetch(foundry.utils.getRoute(p), { method: "HEAD" })
            .then(r => r.status).catch(() => 0))))].join(","), "200"]
      ];
    });
  });

  /*
   * **And the decks fit on the scene.**  **[FIXED 2026-11-13]**
   *
   * The two columns are anchored from opposite ends -- the piles from the top, the action deck
   * from the hand's baseline -- and nothing related them, so below a window 924px tall the action
   * deck sat on top of Conditions. Measured at **1366x768**, which is the smallest window Foundry
   * will run in at all, so what is pinned is the worst case rather than this machine's.
   */
  await probe("the decks fit the window", async () => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
    await page.waitForSelector(".cr-hud__decks--action", { timeout: 20000 });
    const rows = await page.evaluate(() => {
      const box = sel => document.querySelector(sel)?.getBoundingClientRect();
      const left = box(".cr-hud__decks--left");
      const action = box(".cr-hud__decks--action");
      return [
        ["the pile column stops before the action deck starts",
          Math.round(Math.max(0, left.bottom - action.top)), 0],
        ["the action deck is on the screen", action.bottom <= window.innerHeight, true],
        ["the column starts on the screen", left.top >= 0, true],
        ["and a pile is still big enough to read a number on", Math.round(action.height) >= 110,
          true]
      ];
    });
    await page.setViewportSize({ width: 1600, height: 900 });
    return rows;
  });

  /*
   * **The HUD belongs to the fight that opened it.**  **[FIXED 2026-11-13]**
   *
   * Three hooks opened one and none closed it: `deleteCombat` was wired to *refresh* every tray,
   * so an ended encounter left a hand, four deck backs and a Play button lying on the scene for a
   * character nobody had selected.
   *
   * A real encounter is started and ended here rather than calling the closer directly, because
   * what was missing was never the closing -- it was the wiring, and a probe that calls the
   * function proves the half that was already fine.
   */
  await probe("the HUD belongs to the fight", async () => {
    return page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const { hero } = LIVE;
      /*
       * **Polled, not slept at.** A fixed wait of 600ms reported a close that had not finished:
       * `deleteCombat` handlers are not awaited by the caller, so the clock starts before the
       * closing does. This waits for the count to hold still instead of betting on a number.
       */
      const settled = async () => {
        let last = -1;
        let same = 0;
        for (let i = 0; i < 40 && same < 3; i++) {
          await new Promise(r => setTimeout(r, 100));
          const n = CardRPGTray.openTrays.length;
          same = n === last ? same + 1 : 0;
          last = n;
        }
        return last;
      };
      for (const t of CardRPGTray.openTrays) await t.close();

      /* A HUD opened by hand is the user's and survives the fight ending. */
      game.cardrpg.openTray(hero);
      const byHand = await settled();
      CardRPGTray.closeAfterFight();
      const kept = await settled();
      for (const t of CardRPGTray.openTrays) await t.close();

      /* And a real encounter, so the hooks are what is tested. */
      const token = (await hero.getTokenDocument({ x: 1000, y: 1000 })).toObject();
      const [placed] = await canvas.scene.createEmbeddedDocuments("Token", [token]);
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant",
        [{ tokenId: placed.id, sceneId: canvas.scene.id, actorId: hero.id }]);
      await combat.startCombat();
      const duringFight = await settled();
      const owned = CardRPGTray.openTrays.map(t => String(t.openedByFight)).join(",");
      let fired = "no";
      Hooks.once("deleteCombat", () => { fired = "yes"; });
      await combat.delete();
      const afterFight = await settled();
      const stillThere = CardRPGTray.openTrays.map(t => String(t.openedByFight)).join(",");
      await placed.delete();

      return [
        ["a HUD opened by hand is open", byHand, 1],
        ["and the end of a fight is not its business", kept, 1],
        ["starting a fight opens one", duringFight, 1],
        ["the fight owns the HUD it opened", owned, "true"],
        ["the delete hook fires", fired, "yes"],
        ["what is left afterwards", stillThere || "nothing", "nothing"],
        ["and ending the fight takes it off the scene", afterFight, 0]
      ];
    });
  });

  /*
   * **And the names in the play panel are readable.**  **[FIXED 2026-11-13]**
   *
   * Two buttons in a 90px row left 30px for a name needing 54, so the panel read *den Sl* and
   * *ngswc*. Measured at 1366x768, where a card is at its smallest and the fault is at its worst.
   */
  await probe("the played items name themselves", async () => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await settle(page);
    await page.evaluate(() => LIVE.stageStrike());
    await page.waitForSelector(".cr-hud__play .cr-card__title", { timeout: 20000 });
    const rows = await page.evaluate(() => {
      const titles = [...document.querySelectorAll(".cr-hud__play .cr-card__title")];
      /*
       * **Both directions.** Width alone passed a name that had been allowed to wrap inside a
       * 30px column and was then clipped from below -- `ong` over `swor`, which measures as
       * fitting horizontally and is not readable by anybody.
       */
      const cut = titles.filter(t => t.scrollWidth > t.clientWidth + 1)
        .map(t => t.textContent.trim());
      const squashed = titles.filter(t => t.scrollHeight > t.clientHeight + 1)
        .map(t => t.textContent.trim());
      return [
        ["the panel names what is played", titles.length > 0, true],
        ["and no name is cut off at the side", cut.join(", ") || "none", "none"],
        ["nor clipped from below", squashed.join(", ") || "none", "none"]
      ];
    });
    await page.evaluate(() => LIVE.unstage());
    await page.setViewportSize({ width: 1600, height: 900 });
    return rows;
  });

  /*
   * **A stack is an action, and the stack is what counts.**  **[BUILT 2026-11-22]**
   *
   * Two rules met here and neither could be tested offline.
   *
   * The first is what a stack holds: gear used to join one the moment it was equipped, so the
   * starter Warrior's primary stood with a Longsword, a Wooden Shield and **a Healing Potion** in
   * it before a hand was dealt. The potion is the row worth having -- nothing about a Strike wants
   * it, and an engine that put it there was not answering a question anybody asked.
   *
   * The second is what a stack MEANS. The tray drew Strong into it with a cross on it, the cross
   * wrote to a Set, and the Set never left the tray -- so the +1 landed whatever the player
   * clicked. **The number on the card face is the assertion**, because it is what a player reads
   * before committing and it is rendered from the same set the resolver is handed. If the face
   * moves when the cross is clicked, the wiring is real.
   */
  await probe("a stack is an action, and the stack is what counts", async () => {
    const rows = [];

    /* Its own preconditions: later probes unequip weapons, and this one is about what is in hand. */
    const ready = await page.evaluate(async () => {
      const { hero } = LIVE;
      for (const name of ["Longsword", "Wooden Shield", "Healing Potion"]) {
        const it = hero.items.find(i => i.name === name && i.type === "item");
        if (it && !it.system.equipped) await it.update({ "system.equipped": true });
      }
      const strong = hero.items.find(i => i.name === "Strong" && i.type === "feature");
      const sword = hero.items.find(i => i.name === "Longsword");
      return {
        strongId: strong?.id ?? null,
        heavy: !!sword?.system.tags?.has?.("heavy"),
        sword: sword?.system.verbs?.strike?.value ?? null
      };
    });
    rows.push(["the hero holds a heavy sword that strikes",
      `${ready.sword}, heavy ${ready.heavy}`, "3, heavy true"]);
    rows.push(["and owns the feature that boosts it", !!ready.strongId, true]);

    /** The names in a play stack, which is most of what this probe reads. */
    const stackNames = () => page.evaluate(() =>
      [...document.querySelectorAll(".cr-hud__play .cr-card--stacked")]
        .map(e => e.querySelector(".cr-card__title")?.textContent.trim())
        .filter(Boolean).sort().join(", "));

    /* 1. Nothing staged. */
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      tray.staged = [];
      tray.waved.clear();
      await tray.render();
    });
    await page.waitForSelector(".cr-hud__play", { timeout: 20000 });
    rows.push(["nothing stands in a stack before a half is staged", await stackNames(), ""]);

    /* 2. A Strike staged: what serves it, and nothing else. */
    const staged = await page.evaluate(() => LIVE.stageStrike());
    rows.push(["a Strike is staged", !!staged, true]);
    const armed = await stackNames();
    rows.push(["the sword joins it", armed.includes("Longsword"), true]);
    /* The shield strikes for 1 -- a bash -- so it belongs in a Strike stack and gets an arrow. */
    rows.push(["and so does the shield, which can bash", armed.includes("Wooden Shield"), true]);
    rows.push(["and the free feature is in it at last", armed.includes("Strong"), true]);
    /* **The row this probe exists for.** */
    rows.push(["and the potion, which strikes nothing, is not",
      armed.includes("Healing Potion") ? "in the stack" : "out", "out"]);

    /* And the card says what it is worth, rather than *always on* beside a cross that removes it. */
    const boostNote = await page.evaluate(() => {
      const card = [...document.querySelectorAll(".cr-hud__play .cr-card--stacked")]
        .find(e => e.querySelector(".cr-card__title")?.textContent.trim() === "Strong");
      return card?.querySelector(".cr-note")?.textContent.replace(/\s+/g, " ").trim()
        ?? "no note";
    });
    rows.push(["and the boost card prints its value", boostNote, "+1 in this action"]);

    /** What the staged card promises, as the player reads it. */
    const faceSays = () => page.evaluate(() => [
      ...document.querySelectorAll(".cr-hud__play .cr-card--stacked .cr-card__line")
    ].map(e => e.textContent.replace(/\s+/g, " ").trim()).join(" | ") || "no line");

    /*
     * 3. **The number, with the feature in the stack and then waved out of it.**
     *
     * Read as a DIFFERENCE and not as a figure. The first version of this wanted *Strike 4* --
     * sword 3 plus Strong 1 -- and got *Strike 6*, because the live hero is carrying a Graven
     * tattoo worth +2 that an earlier probe put on. The absolute number is a fact about whatever
     * state the run has reached by here; Strong's own +1 is the claim, and it is the difference
     * the cross makes.
     */
    const strikeOn = text => Number(text.match(/Strike (\d+)/)?.[1] ?? NaN);
    const withStrong = strikeOn(await faceSays());
    await page.evaluate(id => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.waved.add(id);
      return tray.render();
    }, ready.strongId);
    const waved = strikeOn(await faceSays());
    rows.push(["the face prints a number at all", Number.isFinite(withStrong), true]);
    rows.push(["and waving the feature out moves it by exactly its value",
      withStrong - waved, 1]);
    rows.push(["and the card goes with it",
      (await stackNames()).includes("Strong") ? "still there" : "gone", "gone"]);

    /*
     * 4. **And the resolver agrees**, which is the half a grep cannot reach: the set the cross
     * writes to has to arrive at `collectBonuses` through two more hands. Asked of the resolver
     * directly with the three sets the tray can hand it, so the comparison is about `using` alone
     * and not about targeting, fate or armor.
     */
    const counted = await page.evaluate(() => {
      const { hero } = LIVE;
      const sword = hero.items.find(i => i.name === "Longsword");
      const strong = hero.items.find(i => i.name === "Strong");
      return {
        open: LIVE.collectBonuses(hero, "strike", sword, { using: null }).total,
        held: LIVE.collectBonuses(hero, "strike", sword, { using: new Set([strong.id]) }).total,
        none: LIVE.collectBonuses(hero, "strike", sword, { using: new Set() }).total
      };
    });
    /* Differences again, and the three of them pin the whole rule: a stack holding the feature
     * agrees with no stack at all, and one that does not is exactly its value lower. */
    rows.push(["the stack that holds it agrees with no stack at all",
      counted.held, counted.open]);
    rows.push(["and the stack without it is lower by the feature's value",
      counted.open - counted.none, 1]);
    /* The condition rides through either way, which is the exemption said out loud: a Graven
     * tattoo is done to you and has a duration, so declining it is not a move. */
    rows.push(["and whatever else is on the hero rides through regardless",
      counted.none >= 0 && counted.none === counted.open - 1, true]);

    /*
     * **A hand with two Strikes in it, made rather than hoped for.**
     *
     * The first version of the two rows below looked for a card with a Strike on its SECONDARY
     * half, and the starter deck holds exactly one -- *Weapon Swap*, one copy in sixteen -- so a
     * five-card hand had it about a third of the time. The rows passed on the run they were written
     * on and reported *no two Strikes in hand* on the next. **A test whose subject depends on the
     * deal is a test that reports the deal**, so the hand is given the case and handed back after.
     */
    const twoStrikes = await page.evaluate(async () => {
      const cards = LIVE.deckOf(LIVE.hero, "actionHand")?.cards?.contents ?? [];
      if (cards.length < 2) return { fail: `only ${cards.length} cards in hand` };
      const [a, b] = cards;
      const was = [a, b].map(c => ({
        id: c.id, primary: c.system.primary ?? [], secondary: c.system.secondary ?? []
      }));
      await a.update({ "system.primary": [{ verb: "strike" }] });
      await b.update({ "system.secondary": [{ verb: "strike" }] });
      return { firstId: a.id, secondId: b.id, was };
    });
    if (twoStrikes.fail) {
      rows.push(["a hand to stage two Strikes from", twoStrikes.fail, "two cards"]);
      await page.evaluate(() => LIVE.unstage());
      return rows;
    }
    rows.push(["a hand holding a Strike on each side", !!twoStrikes.secondId, true]);

    /*
     * 5. **Two Strikes, and the feature rides the one clicked first.** The order you click is the
     * order the halves resolve, so staging the secondary first has to move the feature to it --
     * the case *the primary* got wrong, and one no offline check could see.
     */
    const lead = await page.evaluate(async ({ firstId, secondId }) => {
      const { hero } = LIVE;
      const hand = LIVE.deckOf(hero, "actionHand");
      const first = hand?.cards?.get(firstId);
      const second = hand?.cards?.get(secondId);
      if (!first || !second) return { skipped: "the staged cards went missing" };
      const tray = game.cardrpg.openTray(hero);
      tray.waved.clear();
      const whereStrong = async order => {
        /*
         * **Mark what is on the screen before asking for a new screen.**  [FIXED 2026-11-23]
         *
         * The wait below is *two stack panels with titles in them*, and after the first call of
         * this closure that is already true -- so the second call polled a condition the OLD
         * render had satisfied, read the stale panels, and reported `nowhere` for a feature that
         * was about to arrive in the right half. It failed exactly once in a full run and passed
         * on its own every time, which is the signature of a wait that cannot tell the two
         * renders apart.
         *
         * The previous fix replaced a fixed pair of frames with this condition and was a real
         * improvement; it was still a condition about the panel existing rather than about THIS
         * render having happened. Stamping the outgoing nodes is what makes the difference
         * observable: a panel carrying the stamp is one the browser has not replaced yet.
         */
        for (const panel of document.querySelectorAll(".cr-stack[data-half]")) {
          panel.dataset.probeStale = "yes";
        }
        tray.staged = order;
        await tray.render();
        /*
         * **And then wait until the panel has actually been drawn.**  [FIXED 2026-11-23]
         *
         * `await tray.render()` resolves when the application has handed its element over, which
         * is not the instant the browser has laid it out -- and the read on the next line asks a
         * question of a screen that may not exist yet. It fails the way a race fails: rarely, on
         * alternate runs, and reading as though the feature were broken. This read reported
         * `nowhere` for a stack it had just staged, and the one further down `NaN` for a number
         * the card prints.
         *
         * Confirmed against the shipped build before any of this session's work was in the tree:
         * the same two checks, on the same alternate runs. It is the probe that is wrong.
         *
         * **A fixed number of frames is the wrong wait** -- it was two, and two was enough until
         * it was not. What this needs is the condition itself: a stack panel with cards in it. The
         * poll is for cards being there at all, NOT for Strong being in the half the check wants,
         * so a feature in the wrong half still reports the wrong half rather than waiting for the
         * right one.
         */
        await LIVE.drawn(() => {
          const panels = [...document.querySelectorAll(".cr-stack[data-half]")];
          return panels.length >= 2
            && panels.every(h => h.querySelector(".cr-card__title") && !h.dataset.probeStale);
        });
        /* `data-half` rather than a class: the template writes the half as an attribute, and
         * sniffing it out of `className` found "secondary" nowhere and reported "primary" for
         * both. */
        const read = () => [...document.querySelectorAll(".cr-stack[data-half]")]
          .filter(h => [...h.querySelectorAll(".cr-card__title")]
            .some(t => t.textContent.trim() === "Strong"))
          .map(h => h.dataset.half)
          .join(",") || "nowhere";
        /*
         * **Read until it stops changing, not once.**  **[FIXED 2026-11-24]**
         *
         * Every wait this probe has had has been a statement about the panel EXISTING, and a
         * render that lands late replaces a panel that already existed and already had titles --
         * so each version was satisfiable by the previous staging's DOM. It failed about one run
         * in three, always on the second staging, always reporting `nowhere` for a feature that
         * arrived a moment later; the two fixes before this one (a pair of frames, then a poll
         * for titles, then stamping the outgoing nodes) each narrowed the window without closing
         * it.
         *
         * Two equal samples a frame-and-a-half apart is a statement about the screen having
         * SETTLED, which is the thing actually being waited for. It is deliberately not
         * outcome-aware: it agrees on `nowhere` as readily as on `secondary`, so a feature in the
         * wrong half is still reported as the wrong half rather than waited for until it moves.
         */
        let last = read();
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 150));
          const again = read();
          if (again === last) return again;
          last = again;
        }
        return last;
      };
      const primaryFirst = await whereStrong([
        { cardId: first.id, half: "primary" },
        { cardId: second.id, half: "secondary" }
      ]);
      const secondaryFirst = await whereStrong([
        { cardId: second.id, half: "secondary" },
        { cardId: first.id, half: "primary" }
      ]);
      tray.staged = [];
      await tray.render();
      return { primaryFirst, secondaryFirst };
    }, twoStrikes);
    if (lead.skipped) {
      rows.push(["two Strikes in one hand to order", lead.skipped, "two of them"]);
    } else {
      rows.push(["clicking the primary first puts the feature there",
        lead.primaryFirst, "primary"]);
      rows.push(["and clicking the secondary first moves it", lead.secondaryFirst, "secondary"]);
    }

    /*
     * 6. **A weapon serves one Strike a turn.**
     *
     * The sword went to both Strikes before today, so a sword swung twice was twice the sword.
     * With the shield put away there is nothing left for the second one but the fist, and the fist
     * is Light -- so it collects no Strong, which is the balance of the whole rule: the first
     * Strike is the sword and its feature, the second is a flat 1 and whatever is true of the
     * character regardless.
     */
    const twice = await page.evaluate(async ({ firstId, secondId }) => {
      const { hero } = LIVE;
      const shield = hero.items.find(i => i.name === "Wooden Shield");
      if (shield) await shield.update({ "system.equipped": false });
      const hand = LIVE.deckOf(hero, "actionHand");
      const first = hand?.cards?.get(firstId);
      const second = hand?.cards?.get(secondId);
      if (!first || !second) return { skipped: "the staged cards went missing" };
      const tray = game.cardrpg.openTray(hero);
      tray.waved.clear();
      /* Stamped before the render, for the reason written over the same wait in the probe above:
       * panels left on the screen by the probe before this one satisfy the condition without this
       * render having happened at all, and the read then reports a number off the wrong staging --
       * `NaN`, as it happens, because the panel it read holds no Strike line. */
      for (const panel of document.querySelectorAll(".cr-stack[data-half]")) {
        panel.dataset.probeStale = "yes";
      }
      tray.staged = [
        { cardId: first.id, half: "primary" },
        { cardId: second.id, half: "secondary" }
      ];
      await tray.render();
      await LIVE.drawn(() => {
        const panels = [...document.querySelectorAll(".cr-stack[data-half]")];
        return panels.length >= 2
          && panels.every(h => h.querySelector(".cr-card__title") && !h.dataset.probeStale);
      });
      /*
       * **And settled here too**, for the reason written over the same read in the probe above: a
       * render that lands late replaces panels that already satisfied every wait, and this read
       * took a Strike number off the staging before it -- `NaN`, because the panel it read had no
       * Strike line at all.
       */
      const sample = () => [...document.querySelectorAll(".cr-stack[data-half]")]
        .map(h => `${h.dataset.half}:${[...h.querySelectorAll(".cr-card__title")]
          .map(t => t.textContent.trim()).join("/")}`)
        .join("|");
      let seen = sample();
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 150));
        const again = sample();
        if (again === seen) break;
        seen = again;
      }
      /* Per half: the weapons drawn into it, and the Strike number its card prints. */
      const read = which => {
        const box = document.querySelector(`.cr-stack[data-half="${which}"]`);
        const names = [...(box?.querySelectorAll(".cr-card__title") ?? [])]
          .map(t => t.textContent.trim());
        const line = [...(box?.querySelectorAll(".cr-card__line") ?? [])]
          .map(e => e.textContent).join(" ");
        return { names, strike: Number(line.match(/Strike (\d+)/)?.[1] ?? NaN) };
      };
      /* The names of what the hero is actually holding, so the rows below can ask *is a weapon
       * drawn into this stack* instead of counting cards -- the stack also holds the action card
       * and any condition bearing on the half, and counting those reported two where the rule
       * cares about none. */
      const held = hero.items.filter(i => i.type === "item" && i.system.equipped).map(i => i.name);
      return { primary: read("primary"), secondary: read("secondary"), held };
    }, twoStrikes);
    if (twice.skipped) {
      rows.push(["two Strikes to spend a weapon across", twice.skipped, "two of them"]);
    } else {
      rows.push(["the first Strike takes the sword",
        twice.primary.names.includes("Longsword"), true]);
      /* **The row the rule is for.** */
      rows.push(["and the second cannot have it again",
        twice.secondary.names.includes("Longsword") ? "it did" : "spent", "spent"]);
      rows.push(["and no gear at all is drawn into the second",
        twice.secondary.names.filter(n => twice.held.includes(n)).join(", ") || "none", "none"]);
      /* The fist is 1 and the sword is 3, so whatever else is true of this hero the first Strike
       * is strictly the better one -- read as an inequality because the hero's conditions move
       * both numbers together. */
      rows.push(["and the fist is the weaker Strike of the two",
        twice.primary.strike > twice.secondary.strike
          ? "weaker" : `${twice.primary.strike} against ${twice.secondary.strike}`, "weaker"]);
    }

    /* The two halves put back as they were dealt, so nothing downstream inherits a Strike this
     * probe wrote onto somebody else's card. */
    await page.evaluate(async ({ was }) => {
      const hand = LIVE.deckOf(LIVE.hero, "actionHand");
      for (const old of was ?? []) {
        await hand?.cards?.get(old.id)?.update({
          "system.primary": old.primary, "system.secondary": old.secondary
        });
      }
      const shield = LIVE.hero.items.find(i => i.name === "Wooden Shield");
      if (shield) await shield.update({ "system.equipped": true });
    }, twoStrikes);

    /*
     * 7. **And a character holding nothing can still Strike**, which was refused outright: the
     * resolver warned *nothing equipped can strike* while equipment.md had printed the fist's
     * value since the catalogue was written.
     */
    const empty = await page.evaluate(async () => {
      const { hero } = LIVE;
      const held = hero.items.filter(i => i.type === "item" && i.system.equipped
        && (i.system.verbs?.strike?.value ?? null) !== null);
      for (const i of held) await i.update({ "system.equipped": false });
      const cards = LIVE.deckOf(hero, "actionHand")?.cards?.contents ?? [];
      const one = cards.find(c => (c.system.primary ?? []).some(st => st.verb === "strike"));
      const tray = game.cardrpg.openTray(hero);
      tray.staged = one ? [{ cardId: one.id, half: "primary" }] : [];
      await tray.render();
      const box = document.querySelector(`.cr-stack[data-half="primary"]`);
      const line = [...(box?.querySelectorAll(".cr-card__line") ?? [])]
        .map(e => e.textContent).join(" ");
      const out = {
        staged: !!one,
        strike: Number(line.match(/Strike (\d+)/)?.[1] ?? NaN),
        /* And the fist is what the resolver would be handed, asked of the resolver itself. */
        fistStrong: LIVE.collectBonuses(hero, "strike", LIVE.BARE_HANDS, { using: null }).total
      };
      for (const i of held) await i.update({ "system.equipped": true });
      return out;
    });
    rows.push(["a Strike with empty hands is staged at all", empty.staged, true]);
    rows.push(["and it prints a number rather than refusing",
      Number.isFinite(empty.strike), true]);
    /* Light, so Strong is not in it -- the one number that keeps *Off-Hand Blow* worth printing. */
    rows.push(["and the fist collects no heavy feature", empty.fistStrong, 0]);

    await page.evaluate(() => LIVE.unstage());
    return rows;
  });

  /*
   * **The character sheet, which had three faults nobody could see from the source.**
   * **[FIXED 2026-11-13]**
   *
   * Stamina was on no sheet at all -- the stat that decides how many cards you may play existed
   * only in the combat HUD, with *Deck floor* sitting where a reader looked for it. The three
   * short lists were edited as one comma-separated string each. And the gear slot headings fell
   * through every rule this system writes onto the core sheet's pale display face, which is a
   * thing you can only find by looking at it, so the contrast is measured here rather than
   * admired.
   */
  await probe("the character sheet", async () => {
    await page.evaluate(() => LIVE.hero.sheet.render(true));
    await page.waitForSelector('input[name="system.stamina.value"]', { timeout: 20000 });
    const rows = [];

    rows.push(...await page.evaluate(() => {
      const { hero } = LIVE;
      const root = hero.sheet.element;
      const val = root.querySelector('input[name="system.stamina.value"]');
      const base = root.querySelector('input[name="system.stamina.base"]');
      const floor = root.querySelector('input[name="system.actionDeck.min"]');
      return [
        ["the sheet shows stamina at all", Number(val?.value), hero.system.stamina.value],
        ["and what it can go back up to", Number(base?.value), hero.system.stamina.base],
        ["the deck floor is a different number", Number(floor?.value) === hero.system.stamina.max
          ? "the same as stamina" : "its own", "its own"],
        ["and says so when you ask it",
          /not your stamina/.test(floor?.dataset.tooltip ?? "") ? "yes" : "no", "yes"]
      ];
    }));

    /* A list, added to and taken from, through the buttons a player uses. */
    const trainings = () => page.evaluate(() => [...(LIVE.hero.system.trainings ?? [])]);
    const before = await trainings();
    await page.fill('.cr-entries__add input[data-field="trainings"]', "lockpicks");
    await page.click('[data-action="addEntry"][data-field="trainings"]');
    await page.waitForFunction(n => (LIVE.hero.system.trainings ?? []).length > n, before.length,
      { timeout: 10000 }).catch(() => {});
    const added = await trainings();

    /* The same word again, in a different case: one training, not two. */
    await page.fill('.cr-entries__add input[data-field="trainings"]', "LOCKPICKS");
    await page.click('[data-action="addEntry"][data-field="trainings"]');
    await new Promise(r => setTimeout(r, 600));
    const twice = await trainings();

    await page.click('.cr-entry__x[data-field="trainings"][data-index="'
      + (added.length - 1) + '"]');
    await page.waitForFunction(n => (LIVE.hero.system.trainings ?? []).length < n, twice.length,
      { timeout: 10000 }).catch(() => {});
    const removed = await trainings();

    rows.push(
      ["a training is added as an entry", added.includes("lockpicks"), true],
      ["the same one twice is still one", twice.length, added.length],
      ["and removing it by index removes that one", removed.includes("lockpicks"), false],
      ["leaving what was there alone", removed.length, before.length]
    );

    /* The gear headings, measured against the paper they sit on. */
    await page.click('[data-action="switchTab"][data-tab="gear"]');
    await page.waitForSelector(".cr-slot > h4", { timeout: 10000 });
    rows.push(...await page.evaluate(() => {
      const lum = c => {
        const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {
          const x = v / 255;
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const head = document.querySelector(".cr-slot > h4");
      let behind = head.parentElement;
      let bg = getComputedStyle(behind).backgroundColor;
      while (behind && /rgba\(0, 0, 0, 0\)|transparent/.test(bg)) {
        behind = behind.parentElement;
        bg = behind ? getComputedStyle(behind).backgroundColor : "rgb(255,255,255)";
      }
      const a = lum(getComputedStyle(head).color);
      const b = lum(bg);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      return [
        ["a gear slot names itself", head.textContent.trim().length > 0, true],
        ["and does it legibly", ratio >= 4.5 ? "yes" : `only ${ratio.toFixed(1)}:1`, "yes"]
      ];
    }));

    /* And Edit is behind the dots rather than shouting on every row. */
    await page.waitForSelector(".cr-menu__dots", { timeout: 10000 });
    const shown = () => page.evaluate(() =>
      [...document.querySelectorAll(".cr-menu__items")]
        .filter(m => getComputedStyle(m).display !== "none").length);
    const hidden = await shown();
    await page.click(".cr-menu__dots");
    await new Promise(r => setTimeout(r, 300));
    const opened = await shown();
    rows.push(
      ["Edit is out of the way until it is asked for", hidden, 0],
      ["and the dots are what asks", opened, 1]
    );
    await page.evaluate(() => LIVE.hero.sheet.close());
    return rows;
  });

  await probe("the level-up pane", async () => {
    const rows = await page.evaluate(async () => {
      const graph = await import("/systems/cardrpg/module/graph.mjs");
      const { hero } = LIVE;
      const out = [];
      const wait = ms => new Promise(r => setTimeout(r, ms));

      /* A clean slate, so the frontier is the four Ways and the arithmetic below is readable. */
      await hero.update({ "system.nodes": ["root"] });
      game.cardrpg.levelUp(hero);
      await wait(900);
      const pane = [...foundry.applications.instances.values()]
        .find(a => a.constructor.name === "LevelUpPane");
      const root = pane?.element;
      out.push(["the pane opens", !!root, true]);
      if (!root) return out;


      /*
       * **Nothing is grabbable**, asked of cytoscape rather than of the source. The option is one
       * word and the consequence was a quarter of the graph coming away in somebody's hand: the
       * four Ways are compound parents, so dragging one drags its whole subtree, which is what
       * *panning only pans a subgraph* was.
       */
      out.push(["no node can be dragged out of place",
        pane.cy.nodes().filter(n => n.grabbable()).length, 0]);
      out.push(["and the territories are among the ones that cannot",
        pane.cy.nodes(":parent").length > 0, true]);

      const detail = () => root.querySelector(".cr-levelup__detail");
      const accept = () => root.querySelector("[data-action=accept]");
      /* Through cytoscape's own event, so the pane's real handler runs. */
      const tap = id => pane.cy.getElementById(id).emit("tap");
      /*
       * **And it opens on something.**  [BUILT 2026-11-14] It used to open on an empty panel
       * reading *tap a node*, with 237 boxes behind it; the arrows always knew where the takeable
       * ones were and nothing pressed one. Asked of the pane's own state rather than the DOM,
       * because what must be true is that a node is MARKED -- the panel following is the part
       * that already worked.
       */
      const opensOn = graph.frontier(graph.ownedIds(hero))
        .sort((a, b) => (graph.DEPTH.get(a) ?? 0) - (graph.DEPTH.get(b) ?? 0)
          || (graph.GRAPH.get(a)?.name ?? a).localeCompare(graph.GRAPH.get(b)?.name ?? b))[0];
      out.push(["and on a node you can actually take", pane.tentative, opensOn]);
      out.push(["with the panel showing it",
        detail().querySelector("h3")?.textContent, graph.GRAPH.get(opensOn)?.name]);
      out.push(["and Accept already live", accept().disabled, false]);

      /*
       * **What a node would open, lit on the map.** The panel has printed *Opens: …* as a list of
       * names since it was written, and on a graph of 237 the player then had to find each name
       * by eye. Asked of cytoscape rather than of the panel: the classes are the answer, and the
       * set of lit nodes has to be exactly the successors the engine knows about.
       */
      const lit = () => pane.cy.nodes(".opens").map(n => n.id()).sort();
      tap("origin.core");
      await wait(80);
      const leadsTo = [...(graph.SUCCESSORS.get("origin.core") ?? [])].sort();
      out.push(["reading a node lights what it opens", lit().join(", "), leadsTo.join(", ")]);
      out.push(["and the roads to them",
        pane.cy.edges(".opens-edge").length, leadsTo.length]);
      /* Moving on clears it, or yesterday's halo stays on the map behind today's. */
      tap("origin.fiord");
      await wait(80);
      out.push(["moving on clears the last one",
        lit().some(id => !(graph.SUCCESSORS.get("origin.fiord") ?? []).includes(id)), false]);
      /* An unavailable node answers the same question, which is most of what reading ahead is. */
      tap("shade.thief");
      await wait(80);
      out.push(["and an unavailable node answers it too", lit().length > 0, true]);

      /*
       * **And the half a player cannot undo.** An exclusive node shuts every branch its siblings
       * led to -- taking an origin closes the other fourteen and everything behind them -- and
       * that was a list of names beside a map that knew where all of them were.
       */
      const barred = () => pane.cy.nodes(".bars").map(n => n.id()).sort();
      tap("origin.core");
      await wait(80);
      const shuts = graph.wouldCloseIds("origin.core", graph.ownedIds(hero)).sort();
      out.push(["and what it would bar is lit too", barred().join() === shuts.join(), true]);
      out.push(["which for a place is the other fourteen and their trades",
        shuts.length > 14, true]);
      out.push(["and the two halos never name the same node",
        barred().some(id => lit().includes(id)), false]);
      /* A node that shuts nothing lights nothing: the halo is a warning, not decoration. */
      tap("shade.thief");
      await wait(80);
      out.push(["a node that bars nothing lights nothing", barred().length, 0]);

      /* Two creation bands, and they used to be called the same thing. */
      const bands = pane.cy.nodes(":parent").map(n => n.data("label"));
      out.push(["every band is named once",
        bands.length === new Set(bands).size ? "yes" : bands.sort().join(", "), "yes"]);
      out.push(["and creation is two of them",
        bands.filter(l => /Where you are from|What you did before/.test(l)).length, 2]);

      /* Nothing is grabbable, and everything is draggable-to-pan. */
      out.push(["and every element pans rather than moves",
        pane.cy.nodes().filter(n => !n.pannable()).length, 0]);


      /*
       * **Reading an unavailable node writes the panel.** `root` is owned, which makes it the
       * nearest node that is not available; it used to answer with a toast and leave the panel on
       * whatever was there before.
       */
      tap("root");
      await wait(80);
      out.push(["an owned node still says what it is",
        /Root|Birth/.test(detail().textContent) ? "yes"
          : detail().textContent.trim().slice(0, 40) || "nothing", "yes"]);
      out.push(["and which state it is in", !!detail().querySelector(".cr-levelup__state"), true]);
      out.push(["and reading it does not arm Accept", accept().disabled, true]);

      /* **The arrows step the engine's own frontier**, so they cannot offer what Accept refuses. */
      const want = graph.frontier(graph.ownedIds(hero)).length;
      const seen = new Set();
      for (let i = 0; i < want; i++) {
        root.querySelector('[data-action=stepChoice][data-dir="1"]').click();
        await wait(60);
        seen.add(pane.tentative);
      }
      out.push(["the arrows reach every choice there is", seen.size, want]);
      out.push(["and each one is a node the engine would accept",
        [...seen].every(id => graph.canTake(id, graph.ownedIds(hero))), true]);
      out.push(["the panel says where you are in the list",
        /\d+ \/ \d+/.test(root.querySelector(".cr-levelup__choice-at")?.textContent ?? ""), true]);

      /*
       * **And Accept is live.** It required an award counter that a GM raised from the sheet, so
       * to anybody who had not found that button it read as broken -- which is how it was
       * reported. The counter is retired; the only condition is a marked node.
       */
      out.push(["a marked node arms the button", accept().disabled, false]);

      /* The authored prose, which is what a Way node had none of, and where the Way leads. */
      tap("strength");
      await wait(80);
      out.push(["a Way says what it means", !!detail().querySelector(".cr-levelup__lore"), true]);
      /*
       * **And shows a picture of it.** The panel was prose and a list of grants, in a window whose
       * argument is that a level-up is a direction rather than a menu -- and a direction with no
       * picture is a menu with longer entries. Three shelves were commissioned for it: an origin is
       * a place, a background is a trade, a title is a person.
       *
       * This row reads the URL; the 200 is asked for by the response sweep above, which no longer
       * excuses `art/nodes/`. The two together are the whole promise: the pane names a file, and
       * the file is there.
       */
      const shownArt = () => {
        const el = detail().querySelector(".cr-levelup__art");
        const bg = el ? getComputedStyle(el).backgroundImage : "";
        return bg.includes("/art/nodes/title/") ? "yes" : bg.slice(0, 60) || "nothing";
      };
      /*
       * **The picture is one press away now.**  [2026-11-15] Picture and prose stacked came to
       * more than the panel on every node worth a picture, so the grants -- the half being read
       * to decide -- sat below the fold and the area scrolled. The panel shows one face at a
       * time and the whole area is the switch, with what the node DOES leading, because the pane
       * is open because somebody is deciding.
       *
       * So the probe presses it. The promise is unchanged: the pane names a file and the file is
       * there.
       */
      out.push(["what it means comes first", !!detail().querySelector(".cr-levelup__lore"), true]);
      out.push(["and no picture until it is asked for", !detail().querySelector(".cr-levelup__art"),
        true]);
      out.push(["and where it leads",
        /Knight|Berserker|Infantry/
          .test(detail().querySelector(".cr-levelup__leads")?.textContent ?? ""), true]);
      detail().click();
      await wait(60);
      out.push(["and a picture of its own", shownArt(), "yes"]);

      /*
       * **The name is read before the picture, not after it.**  [2026-11-14] A panel that opened
       * on an unfamiliar node showed an unlabelled illustration and the player had to look past
       * it to find out what they were looking at. Asked of the DOM order rather than the source,
       * because what matters is which one the eye reaches first.
       */
      const first = detail().firstElementChild;
      out.push(["the panel names the node before it shows one",
        first?.tagName?.toLowerCase() ?? "nothing", "h3"]);
      out.push(["and the picture is under the name",
        detail().querySelector("h3")?.nextElementSibling?.classList
          ?.contains("cr-levelup__art") ?? false, true]);
      /* Back to what it does, so the rows after this read the panel they expect. */
      detail().click();
      await wait(60);
      out.push(["and pressing it again gives the words back",
        !!detail().querySelector(".cr-levelup__lore"), true]);

      /*
       * **The legend is two columns and names the two shapes.** The map has drawn a title as a
       * hexagon since it was built and never said so, which left the one structural distinction
       * on it for the player to infer from 169 boxes.
       */
      const legend = root.querySelector(".cr-levelup__legend");
      out.push(["the legend is in two columns",
        getComputedStyle(legend).gridTemplateColumns.split(" ").length, 2]);
      out.push(["and names both kinds of node",
        !!legend.querySelector(".cr-swatch--major") && !!legend.querySelector(".cr-swatch--minor"),
        true]);
      /* And the map really does draw them differently, which is what the legend is promising. */
      const shapeOf = kind => pane.cy.nodes(`[kind = '${kind}']`)[0]?.style("shape");
      out.push(["a title is a different shape from a step toward one",
        shapeOf("major") !== shapeOf("minor")
          ? `${shapeOf("major")} vs ${shapeOf("minor")}` : "the same",
        "round-hexagon vs round-rectangle"]);

      /* Breadth-first was the nearest thing to `tiers` and the worse version of it. */
      const options = [...root.querySelectorAll("[name=layout] option")].map(o => o.value);
      out.push(["the layout picker offers", options.join(", "), "tiers, concentric, cose, grid"]);

      /*
       * **Where first, then what.** An occupation follows the origins it could have come out of,
       * so a blank sheet offers the places and the Ways and no trades at all -- and taking a
       * place opens some of the trades but not all twelve. Asked of the pane's own graph, because
       * what a player meets is the frontier and not the content list.
       */
      const blank = graph.ownedIds(hero);
      const atBirth = graph.frontier(blank);
      const isTrade = id => graph.GRAPH.get(id)?.exclusive === "background";
      out.push(["a blank sheet offers no occupation", atBirth.filter(isTrade).length, 0]);
      out.push(["but every place there is", atBirth.filter(
        id => graph.GRAPH.get(id)?.exclusive === "origin").length, 15]);
      const withPlace = new Set([...blank, "origin.wolfpeak"]);
      const opened = graph.frontier(withPlace).filter(isTrade);
      out.push(["a place opens some trades", opened.length > 0, true]);
      out.push(["and not all of them", opened.length < 12, true]);
      out.push(["the ones the place could have made",
        opened.map(id => graph.GRAPH.get(id).name).sort().join(", "),
        "Acolyte, Forester, Miner, Soldier"]);

      await pane.close({ animate: false });
      return out;
    });
    await page.evaluate(() => LIVE.hero.update({ "system.nodes": ["root"] }));
    return rows;
  });

  /*
   * **The release button, pressed.**  [BUILT 2026-11-13]
   *
   * `createStarterContent` is what a world runs to pick up a content change, and it now has a
   * button in the settings panel because once per release is the wrong cadence for a console call.
   * Everything about that button is a claim about somebody else's campaign, so it is run here
   * rather than read.
   *
   * The claim worth proving is **idempotence**, and the only honest way to prove it is to run the
   * thing twice: the second run must create nothing, repair nothing and rebuild nothing. That is
   * the same shape as the hand gate at the top of this file -- *ask twice, and the second answer
   * must be zero* -- and it is the shape a bug in this routine would break first, because every
   * mistake here looks like a duplicate rather than an error.
   *
   * The world this runs against is a copy, so a wrong answer costs a scratch directory.
   */
  await probe("the content rebuild", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const menu = game.settings.menus.get("cardrpg.rebuildContent");
      const out = [
        ["the rebuild has a button in settings", !!menu, true],
        ["and no player is shown it", menu?.restricted, true],
        /* `registerMenu` only checks the class; the panel is what calls `new type()`, so this is
         * the one place the constructor is actually exercised. */
        ["and the panel can build its window", (() => {
          try { return !!new menu.type(); } catch (e) { return String(e.message).slice(0, 60); }
        })(), true]
      ];

      /*
       * **Twice, and the second one is the test.** This is where the content builders were found
       * to be editing the content: five NPC decks were rebuilt on every run and could never
       * settle, because Foundry fills a schema's defaults in on the object it is given and the
       * builders were handing it `INTENTS`' own arrays. See `own` in decks/carddata.mjs.
       */
      await game.cardrpg.createStarterContent();
      const again = await game.cardrpg.createStarterContent();
      out.push(["running it hands back a tally", typeof again?.actors, "number"]);
      out.push(["and a second run creates nothing",
        `${again.actors} actors, ${again.slates} slates`, "0 actors, 0 slates"]);
      out.push(["and repairs no pictures, because none are missing", again.pictures, 0]);
      out.push(["and rebuilds no deck, because none disagree",
        again.rebuilt.join(", ") || "none", "none"]);
      out.push(["and holds none back, because nothing is in play",
        again.held.join(", ") || "none", "none"]);
      return out;
    });
  });

  /*
   * **And the world opens at all.** Nine days of engine changes went in without one of them being
   * loaded, so the cheapest question worth asking is whether the system still boots -- which every
   * probe above depends on and none of them states.
   */
  /*
   * **Every slate wears its picture, whoever made the document.**  [BUILT 2026-11-14]
   *
   * `slateData` stamps a path on when a slate is created and `resyncArt` repairs one made before
   * its art was drawn -- and both are writes, so both only ever reach the documents in front of
   * them. A world last rebuilt before the items were drawn showed a Dagger with a picture beside
   * a Leather Armor without one, and nothing in the source said so: the rule was right, the files
   * were there, the stamping had simply not happened to that document.
   *
   * `artOf` derives it now, so the question this asks is the honest one: not *was it stamped*,
   * but **does every slate on this character report a picture**. Blanked first, deliberately --
   * a probe that only passes on freshly stamped documents is the probe that missed this.
   */
  await probe("a slate with no stamp still finds its picture", async () => {
    return page.evaluate(async () => {
      const { hero, artOf } = LIVE;
      const slates = hero.items.filter(i => ["item", "feature", "spell"].includes(i.type));
      /* Named rather than counted: "6 of 7" sends you looking, and a name is the answer. */
      const blank = slates.filter(i => !artOf(i)).map(i => `${i.type}:${i.name}`);

      /* Take the stamp off one and ask again. */
      const victim = slates.find(i => i.type === "item" && artOf(i));
      const kept = victim.img;
      const want = artOf(victim);
      await victim.update({ img: "icons/svg/item-bag.svg" });
      const derived = artOf(victim);
      await victim.update({ img: kept });

      return [
        ["every slate the hero holds names a picture", blank.join(", ") || "none", "none"],
        ["and one wearing core's placeholder still does", derived || "nothing", want],
        ["which is the file the rule names", derived.startsWith("systems/cardrpg/art/"), true]
      ];
    });
  });

  /*
   * **The claim, which is the only source of advantage the engine cannot prove.**
   *
   * Three things have to hold and only the first is obvious: it reaches `advantageFor`; it does
   * not STACK, so a claim on top of a rule that already gives advantage is still one advantage;
   * and it CANCELS against disadvantage like every other source. The second and third are why it
   * is folded in through the same two booleans rather than added to the mode.
   */
  await probe("the claim", async () => {
    return page.evaluate(async () => {
      const { hero, advantageFor, setEdge, clearEdge, readEdge } = LIVE;
      await clearEdge(hero);
      const plain = advantageFor(hero, null, {}).mode;

      await setEdge(hero, 1, "high ground");
      const claimed = advantageFor(hero, null, {});
      const stored = readEdge(hero);

      await setEdge(hero, -1, "in the dark");
      const against = advantageFor(hero, null, {}).mode;

      /* Normal is the absence of a claim, not a third kind of one. */
      await setEdge(hero, 0);
      const cleared = readEdge(hero);

      return [
        ["with nothing claimed the draw is plain", plain, 0],
        ["a claim reaches the draw", claimed.mode, 1],
        ["and says who said it and why", stored.reason, "high ground"],
        ["and the reason is printed with the result",
          claimed.reasons.some(r => r.includes("high ground")), true],
        ["disadvantage can be claimed too", against, -1],
        ["and the middle state stores nothing", cleared, null]
      ];
    });
  });

  /*
   * **And it is spent by the action it was claimed for**, like a target or a staged half. A claim
   * that survived its own turn would be a permanent buff written in a UI control.
   */
  await probe("a claim is spent", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero, setEdge, readEdge, resolveAttack } = LIVE;
      const weapon = hero.items.find(i => i.type === "item" && i.system.equipped
        && i.system.verbs?.strike?.value !== null);
      await setEdge(hero, 1, "they have not seen me");
      const held = !!readEdge(hero);
      await resolveAttack(hero, { verb: "strike", item: weapon, targets: [hero] });
      return [
        ["it is there before the attack", held, true],
        ["and gone after it", readEdge(hero), null]
      ];
    });
  });

  /*
   * **A monster is played from the HUD.**  [BUILT 2026-11-14]
   *
   * The window refused NPCs outright until today and sent the GM to a sheet that cannot attack
   * with anything, so the one actor in a fight nobody could play was every actor the GM was
   * playing. What this asks is what a GM asks: can I open it, and is there a button on a weapon.
   */
  await probe("the monster HUD", async () => {
    const opened = await page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      const beast = game.actors.find(a => a.type === "npc");
      globalThis.LIVE.beast = beast;
      return !!game.cardrpg.openTray(beast);
    });
    await page.waitForSelector(".cr-npc", { timeout: 20000 });
    const rows = await page.evaluate(() => {
      const { beast } = LIVE;
      const strikes = [...document.querySelectorAll(".cr-npc__strike")];
      const stacks = document.querySelector(".cr-play__stacks");
      const name = document.querySelector(".cr-options__name")?.textContent ?? "";
      return [
        ["the HUD opens on a monster", true, true],
        ["and names it", name.includes(beast.name), true],
        ["it offers a button per weapon", strikes.length > 0, true],
        ["each one reading a value off the gear",
          strikes.every(b => /\d/.test(b.textContent)), true],
        ["and no play stacks, because a monster stages nothing", stacks, null]
      ];
    });
    rows.unshift(["the window agrees to open", opened, true]);
    await page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      game.cardrpg.openTray(LIVE.hero);
    });
    return rows;
  });

  /*
   * **Selecting a token moves the window.**  [BUILT 2026-11-14]
   *
   * The second half of *there is no way to attack as a goblin*, and the half that is not about
   * monsters at all: the HUD kept drawing whoever it had opened on, so a GM running four heroes
   * could reach exactly one of them. Controlling a token is the gesture; what it has to produce
   * is a window showing that actor and no second window beside it.
   */
  await probe("the HUD follows the selection", async () => {
    return page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      const beast = game.actors.find(a => a.type === "npc");

      const place = async actor => {
        const doc = (await actor.getTokenDocument({ x: 1400, y: 1400 })).toObject();
        const [made] = await canvas.scene.createEmbeddedDocuments("Token", [doc]);
        return made;
      };
      const hero = await place(LIVE.hero);
      const other = await place(beast);

      /*
       * **Polled, because `render` is asynchronous.** The hook calls `openFor` synchronously and
       * the application only joins Foundry's registry once it has drawn, so reading the registry
       * on the next line reports the window that has not finished opening as no window at all.
       * The same lesson the fight-close probe above records, from the other direction.
       */
      const showing = async want => {
        for (let i = 0; i < 50; i++) {
          const ids = CardRPGTray.openTrays.map(t => t.actor.id);
          if (ids.length === 1 && ids[0] === want) return ids;
          await new Promise(r => setTimeout(r, 100));
        }
        return CardRPGTray.openTrays.map(t => t.actor.id);
      };

      hero.object.control({ releaseOthers: true });
      const first = await showing(LIVE.hero.id);
      other.object.control({ releaseOthers: true });
      const second = await showing(beast.id);

      /* Letting go of a token is not a request to put the window away. */
      other.object.release();
      await new Promise(r => setTimeout(r, 300));
      const afterRelease = CardRPGTray.openTrays.length;

      for (const t of CardRPGTray.openTrays) await t.close();
      await hero.delete();
      await other.delete();
      game.cardrpg.openTray(LIVE.hero);

      return [
        ["selecting a hero opens their HUD", first.join(","), LIVE.hero.id],
        ["selecting a monster moves it there", second.join(","), beast.id],
        ["and never leaves two of them up", second.length, 1],
        ["letting go closes nothing", afterRelease, 1]
      ];
    });
  });

  /*
   * **And the button on it resolves an attack.**  [BUILT 2026-11-14]
   *
   * The probe above proves the window draws. This one presses the thing a GM presses: target a
   * hero, click the monster's weapon, and ask whether the hero lost health. That is the sentence
   * *there is no way to attack as a goblin* turned into a measurement, and nothing short of
   * clicking it answers it -- the row renders fine whether or not the handler is wired.
   */
  /*
   * **A skill check, resolved end to end, which nothing here had ever done.**  [BUILT 2026-11-15]
   *
   * Every probe in this file was about combat or about the window, and `resolveCheck` is the
   * other half of the game. That is not a gap worth noting in passing: the one defect this
   * harness has ever caught that no source check could have is `attackCard` reading two free
   * names, and it was caught because something *ran* it. The check path had the same exposure and
   * nothing pointed at it.
   *
   * The floor is what makes it worth writing now. It renamed the variable the whole chain is
   * built from -- `base` became `printed`, and `base` came back meaning something slightly
   * different -- which is exactly the edit that reads correctly and resolves wrongly.
   *
   * **It reads the chain rather than the total**, because the total has a fate card in it. The
   * chain is everything before the draw, so it is the same string twice for the same inputs, and
   * it is the string that would be wrong if the floor were applied in the wrong place.
   */
  await probe("a trained hand does not fumble", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero, resolveCheck, SKILL_FLOOR, CARDRPG } = LIVE;
      const stacks = Object.values(hero.system.decks ?? {})
        .map(id => game.cards.get(id)).filter(Boolean);
      const all = stacks.flatMap(stack => stack.cards.contents).filter(c => c.type === "skill");
      const low = all.find(c => !c.system.wild && c.system.value === 1);
      const high = all.find(c => !c.system.wild && c.system.value === 3);
      /* The first line of the last message, which is the chain: everything before the fate card. */
      /*
       * **The check's own line, not whichever line happens to be newest.**  [2026-11-16]
       *
       * The arrival machinery runs from a hook that does not await it, so a Sidestep or a piece of
       * ground answering a token moved in an EARLIER probe can land its message in the middle of
       * this one. That was impossible while the hook silently did nothing; the moment it started
       * working, this probe read *Halted (1)* where it wanted *Might 1* -- once, and not again,
       * which is the worst kind of failure to leave lying about.
       *
       * A check prints its approach first, so the newest message beginning with one is the answer
       * however much has arrived since.
       */
      const approachLabels = Object.values(CARDRPG.approaches)
        .map(a => game.i18n.localize(a.label ?? "")).filter(Boolean);
      const firstLine = m => (m?.content?.match(/<p>(.*?)<\/p>/)?.[1] ?? "");
      const chain = () => {
        const mine = [...game.messages.contents].reverse()
          .find(m => approachLabels.some(l => firstLine(m).startsWith(l)));
        return firstLine(mine ?? game.messages.contents.at(-1))
          .replace(/&middot;/g, "\u00b7").replace(/&mdash;/g, "\u2014");
      };
      const label = a => game.i18n.localize(CARDRPG.approaches[a]?.label ?? a);

      await resolveCheck(hero, { approach: low.system.approach, dc: 5, card: low });
      const plain = chain();
      await resolveCheck(hero, {
        approach: low.system.approach, dc: 5, card: low, training: "lockpicks"
      });
      const lifted = chain();
      const liftedSaid = game.messages.contents.at(-1)?.content ?? "";
      /* The same claim on a card the floor cannot help, which is the half a floor gets wrong by
       * becoming a bonus. */
      await resolveCheck(hero, {
        approach: high.system.approach, dc: 5, card: high, training: "lockpicks"
      });
      const ceiling = chain();

      /* And the card's own clause: said out loud, and changing nothing. */
      const edged = all.find(c => c.system.edge && !c.system.wild);
      await resolveCheck(hero, {
        approach: edged.system.approach, dc: 5, card: edged
      });
      const quiet = chain();
      await resolveCheck(hero, {
        approach: edged.system.approach, dc: 5, card: edged, useEdge: true
      });
      const claimedEdge = ([...game.messages.contents].reverse()
        .find(m => /claimed/.test(m.content ?? "")) ?? game.messages.contents.at(-1))
        ?.content ?? "";

      return [
        ["an unclaimed 1 is worth 1", plain, `${label(low.system.approach)} 1`],
        ["a claimed training lifts it to the floor", lifted,
          `${label(low.system.approach)} ${SKILL_FLOOR} (printed 1, trained)`],
        ["and the claim is printed where the GM can see it",
          liftedSaid.includes("trained in lockpicks"), true],
        ["a 3 is not raised by it", ceiling, `${label(high.system.approach)} 3`],
        ["an edge changes no number", chain(), quiet],
        ["and is said out loud when it is claimed",
          claimedEdge.includes("edge claimed"), true],
        ["in the card's own words",
          claimedEdge.includes(edged.system.edge.slice(0, 24)), true]
      ];
    });
  });

  /*
   * **A dimmed card says why it is dimmed.**  [BUILT 2026-11-15]
   *
   * The rule is to dim rather than hide, *because hiding it would hide why it cannot be played* --
   * and the card then wore the same tooltip as every playable one, so the display kept it in
   * sight in order to explain itself and explained nothing.
   *
   * Driven because the claim is about what a player READS while hovering. The template could take
   * the right field and the field could be built from the wrong call, and only rendering a real
   * hand against a real call shows which. It also has to be true of BOTH kinds of card at once:
   * the playable one must still say how to play it.
   */
  await probe("a card that cannot go says so on hover", async () => {
    await settle(page);
    const rows = await page.evaluate(async () => {
      const checks = await import("/systems/cardrpg/module/checks.mjs");
      const decks = await import("/systems/cardrpg/module/decks.mjs");
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const { hero } = LIVE;
      const wait = ms => new Promise(r => setTimeout(r, ms));

      /*
       * **A hand with cards in it**, through the deck layer's own lookup rather than by matching a
       * stack's NAME: the hand is \`system.decks.skillHand\`, and the first version of this probe
       * looked for a stack called "Skill Hand", found nothing, and passed four assertions over an
       * empty list. An \`.every()\` on nothing is true.
       */
      const hand = decks.deckOf(hero, "skillHand");
      const deck = decks.deckOf(hero, "skill");
      if (hand.cards.size < 3) await decks.moveRandom(deck, hand, 3 - hand.cards.size);
      await wait(200);
      const held = [...hand.cards.contents].filter(c => !c.system.wild);
      /* An approach NOTHING in hand serves, so every plain card in it is dimmed at once. */
      const serves = new Set(held.map(c => c.system.approach));
      const other = ["might", "agility", "shadow", "wits", "lore", "presence"]
        .find(a => !serves.has(a));

      /* Called for the approach nothing in hand serves, so every plain card is dimmed. */
      await checks.setCall({ dc: 5, approaches: [other], mode: 0 });
      for (const t of CardRPGTray.openTrays) await t.close();
      await CardRPGTray.openFor(hero);
      await wait(700);
      const root = [...CardRPGTray.openTrays][0]?.element;
      /*
       * **The wild is read separately**, because it is the one card that answers every call: the
       * first version of this probe asserted that every card in hand went dim and failed 2 of 3
       * whenever a wild had been dealt. That is the rule working, so it is asserted rather than
       * worked around.
       */
      const tips = () => [...root.querySelectorAll(".cr-card--skill")]
        .map(el => ({
          mute: el.classList.contains("cr-card--mute"),
          wild: el.classList.contains("cr-card--wild"),
          tip: el.dataset.tooltip ?? ""
        }));
      const called = tips();

      await checks.clearCall();
      await wait(600);
      const open = tips();

      const plain = called.filter(c => !c.wild);
      const out = [
        /* Said out loud, because every row below it is vacuously true of an empty hand. */
        ["there is a hand to read", called.length >= 3, true],
        ["and plain cards in it", plain.length > 0, true],
        ["every card that cannot answer is dimmed",
          plain.filter(c => c.mute).length, plain.length],
        /* And the one card that is never the wrong card is not among them. */
        ["while the wild answers the call whatever it was",
          called.filter(c => c.wild).some(c => c.mute), false],
        ["and the dimmed tooltips name the card and the call",
          plain.filter(c => c.mute).every(c => c.tip.includes("cannot answer")), true],
        ["and say the card stays in your hand",
          plain.filter(c => c.mute).every(c => c.tip.includes("stays in your hand")), true],
        ["and do not tell you to play it",
          plain.filter(c => c.mute).every(c => !c.tip.startsWith("Play it")), true],
        ["with no call, every card says how to play it",
          open.every(c => c.tip.startsWith("Play it")), true],
        ["and none of them is dimmed", open.some(c => c.mute), false]
      ];
      for (const t of CardRPGTray.openTrays) await t.close();
      return out;
    });
    return rows;
  });

  /*
   * **Invisible helps you sneak, and nothing else.**  [BUILT 2026-11-15]
   *
   * `conditionSway` was split out so that Heckled -- *you draw fate with disadvantage* -- would
   * reach a check as well as an attack, and reading the flags rather than the keys took Invisible
   * along with it: being unseen became an advantage on all six approaches, which is the strongest
   * condition in the game arriving by accident.
   *
   * Driven rather than grepped because the question is about the ARITHMETIC. The narrowing could
   * be written correctly and still read the wrong approach, and both halves have to be true at
   * once: present on Shadow, absent on Might. A source check can see the filter; only running it
   * can see which side of the filter a check lands on.
   */
  await probe("Invisible helps you sneak and nothing else", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero, resolveCheck } = LIVE;
      const stacks = Object.values(hero.system.decks ?? {})
        .map(id => game.cards.get(id)).filter(Boolean);
      const all = stacks.flatMap(stack => stack.cards.contents).filter(c => c.type === "skill");
      const said = () => game.messages.contents.at(-1)?.content ?? "";
      const run = async approach => {
        const card = all.find(c => !c.system.wild && c.system.approach === approach);
        if (!card) return "no card";
        await resolveCheck(hero, { approach, dc: 5, card });
        return said().includes("checking while") ? "named" : "silent";
      };

      await hero.update({
        "system.conditions": [{ key: "invisible", duration: 2, creatorId: hero.id }]
      });
      const onShadow = await run("shadow");
      const onMight = await run("might");

      /* Heckled is the other half of the same reader, and it names no place it does not reach. */
      await hero.update({
        "system.conditions": [{ key: "heckled", duration: 2, creatorId: hero.id }]
      });
      const heckledMight = await run("might");
      await hero.update({ "system.conditions": [] });

      return [
        ["Invisible is read on a Shadow check", onShadow, "named"],
        ["and says nothing about a Might check", onMight, "silent"],
        ["while Heckled spoils whatever you were drawing for", heckledMight, "named"]
      ];
    });
  });

  /*
   * **A creature is hard to beat at some things and not at others.**  [BUILT 2026-11-15]
   *
   * Every creature in the roster carried the schema's initial `passive: 4`, and `passiveScore`
   * returned it for all six approaches -- so the opposed difficulty the GM's board offers was 4
   * for every creature in the game.
   *
   * Asked of `passiveScore` on documents that went through the pack round trip, which is the half a
   * source check cannot reach: the numbers are derived in Node and have to survive being written
   * to a pack, validated by the data model and read back off an Actor. A `SchemaField` the model
   * silently dropped would pass every check in the static suite.
   */
  await probe("a creature's six passive scores", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { passiveScore } = await import("/systems/cardrpg/module/resolve.mjs");
      const made = [];
      for (const name of ["Grey Assassin", "Smash Beetle"]) {
        made.push(game.actors.getName(name) ?? await game.cardrpg.buildMonster(name));
      }
      const [assassin, beetle] = made;
      const six = ["might", "agility", "shadow", "wits", "lore", "presence"];
      const read = a => six.map(k => passiveScore(a, k));

      return [
        ["a creature arrives with six scores and not one",
          new Set(read(assassin)).size > 1, true],
        ["sneaking past the assassin is the number the roster authored",
          passiveScore(assassin, "shadow"), 7],
        ["and past the beetle is not the same number",
          passiveScore(beetle, "shadow") < passiveScore(assassin, "shadow"), true],
        ["while overpowering the beetle is the harder of the two",
          passiveScore(beetle, "might") > passiveScore(assassin, "might"), true],
        ["and the weight class is what an unsaid approach falls back to",
          passiveScore({ system: { passive: 5, passives: {} } }, "lore"), 5]
      ];
    });
  });

  /*
   * **The GM can see and change them**, which this sheet could not do for the flat number either:
   * there was no passive field on it at all, so the knob that says how hard a creature is to hold,
   * trick or outrun was reachable only from the console.
   */
  await probe("and the NPC sheet offers them", async () => {
    await settle(page);
    const rows = await page.evaluate(async () => {
      const beast = game.actors.getName("Grey Assassin");
      await beast.sheet.render({ force: true });
      await new Promise(r => setTimeout(r, 500));
      const root = beast.sheet.element;
      const boxes = [...root.querySelectorAll("[name^='system.passives.']")];
      const shadow = boxes.find(b => b.name === "system.passives.shadow");
      const out = [
        ["one box per approach", boxes.length, 6],
        ["the authored Shadow is the one shown", shadow?.value, "7"],
        ["and the weight class has a box of its own",
          !!root.querySelector("[name='system.passive']"), true],
        /* An empty box is not a missing number: it is the baseline, said where it is read. */
        ["and every box says what it would fall back to",
          boxes.every(b => b.placeholder === String(beast.system.passive)), true]
      ];
      await beast.sheet.close();
      return out;
    });
    return rows;
  });

  /*
   * **A character gets what their nodes said they would.**  [BUILT 2026-11-15]
   *
   * Two engine faults handed over nothing and said nothing: a character with no card stacks, and
   * a feature lookup that could not see `FEATURES`. Fixing them fixes the next character, so the
   * repair walks what somebody already owns.
   *
   * Driven because the claim is about DOCUMENTS appearing on a sheet and not appearing twice, and
   * idempotence is the half no grep can see: the second run has to find what the first one made.
   * The nodes are chosen here rather than taken from the hero, so that nothing in the set opens a
   * dialog -- a menu node would stop the probe dead waiting for somebody to pick.
   */
  /*
   * **[BUILT 2026-11-16] The two Tactics that are engine rules rather than prose.**
   *
   * For fifty of the fifty-two a Tactic is derived text: `tacticOf` reads the deepest title and the
   * sheet prints it. Two of them do not describe a position, they **set a casting rule aside** --
   * *Nothing to Prepare* and *One Hand Free* -- and that is a claim about a grant accumulator, a
   * data model and a getter all agreeing, which is the exact shape a grep passes and a game fails.
   *
   * So it is driven. Give the hero the school, read the flags off the document the browser built,
   * put Silenced on them and ask the **tray's own** blocked-icon set whether it stopped them. The
   * icon comes from config rather than being typed here, because the thing under test is whether
   * the exemption lifts whatever Silenced blocks, not whether somebody spelled the icon right.
   *
   * The baseline is the exemption rather than the free hand on purpose: an equipped ring can excuse
   * a free hand, so a world whose hero wears one would make that comparison meaningless. Nothing
   * but a node can grant the Silenced exemption, so nothing but a node can contaminate it.
   */
  /*
   * **[FOUND 2026-11-16] The GM's HUD was one turn behind, every turn.**
   *
   * Reported from a table as *there is no way to attack as a goblin* -- for the second time. The
   * rule that answers it was built on 2026-11-14 and reads correctly: a GM follows the turn
   * marker, so the acting combatant's HUD is the one on the screen. What it read was
   * \`combat.combatant\`, and **inside a \`combatTurn\` hook that is still the combatant whose turn
   * just ended** -- Foundry calls the hook from \`_onUpdate\` and hands the new turn over in
   * \`updateData\`. So the HUD did move, one turn late, for ever: the goblin's turn came round and
   * the hero's cards were on the screen.
   *
   * Nothing could have caught that by reading. The diagnostic that found it asked the browser for
   * \`combat.combatant\` inside the hook (the hero) and for \`combat.turns[updateData.turn]\` (the
   * goblin) in the same breath, which is the whole bug in two values.
   *
   * **A second's grace before counting the trays**, because closing one is an ApplicationV2
   * transition of up to a second and the instance stays in the registry until it finishes -- read
   * sooner and two HUDs look open when one is on its way out. That cost a false reading on the
   * way to this and is worth the comment.
   */
  /*
   * **[2026-11-16] Is the claim control on the screen, and does clicking it do anything?**
   *
   * Reported from a table as *there is no easy way to change fate card draw between disadvantage,
   * normal and advantage*, and as *we need a loose way of adding advantage the player can argue
   * for*. Both of those are built -- three named buttons on the character panel, a reason, the
   * know-how and training tags listed beside them to argue from -- which is exactly the state the
   * HUD-follows-the-turn rule was in an hour ago: correct in the source and not happening.
   *
   * So the question is asked of pixels. Not *is there a control* but **is it a box with a size,
   * inside the window, and does pressing it change what the resolver would draw.**
   */
  /*
   * **[FOUND 2026-11-16] The start-of-turn routine never ran for anybody but the first combatant
   * of each round.**
   *
   * `onTurnStart` guards itself with a once-per-turn marker, `round:turn`, read off the combat --
   * and inside a `combatTurn` hook `combat.turn` is still the turn that **ended**. So on the second
   * combatant's turn it computed the marker it had already written for the first, matched it, and
   * returned having done nothing at all. Measured before the fix:
   *
   *     turnDone markers: 1:0 then 2:0        (the goblin's turn wrote none)
   *     after:            1:1 then 2:0
   *
   * Everything in that routine was skipped for them: Block never cleared, recharges never ticked,
   * an NPC never revealed its intent, conditions created by them never ticked -- so a condition
   * could outlive its duration -- and Burning and Poisoned never took their Health.
   *
   * **The condition goes on the combatant's own actor, which is the lesson this probe cost.** A
   * token that is not linked carries a copy, and a first draft of this test applied Burning to the
   * base actor, read 0 damage and accused the engine of something it does not do. `turnOf` hands
   * back the actor the combat is actually about, and that is the one a condition has to go on.
   */
  await probe("the start-of-turn tick, for somebody who is not first in the order", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const combatMod = await import("/systems/cardrpg/module/combat.mjs");
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const { hero } = LIVE;
      const npc = game.actors.find(a => a.type === "npc");
      for (const t of CardRPGTray.openTrays) await t.close();
      for (const c of [...game.combats]) await c.delete();

      const place = async (actor, x) =>
        (await canvas.scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y: 1600 })).toObject()]))[0];
      const ph = await place(hero, 1000);
      const pn = await place(npc, 1200);
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant", [
        { tokenId: ph.id, sceneId: canvas.scene.id, actorId: hero.id, initiative: 20 },
        { tokenId: pn.id, sceneId: canvas.scene.id, actorId: npc.id, initiative: 10 }
      ]);
      await combat.startCombat();
      const pause = () => new Promise(r => setTimeout(r, 700));
      await pause();

      /* Second in the order: the one the marker used to swallow. Its OWN actor, token or not. */
      const second = combat.turns[1].actor;
      const wasHealth = second.system.health.value;
      await second.update({ "system.conditions":
        [{ key: "burning", duration: 5, value: 2, creatorId: second.id, round: combat.round }] });
      const before = second.system.health.value;

      const marks = [];
      const dbg = Hooks.on("combatTurn", () => {});
      await combat.nextTurn();
      await pause();
      marks.push(combat.getFlag("cardrpg", "turnDone"));
      const acting = combat.combatant?.actor?.name ?? "nobody";
      const after = combat.turns[1].actor.system.health.value;
      Hooks.off("combatTurn", dbg);

      await combat.delete();
      await ph.delete();
      await pn.delete();
      await second.update({ "system.conditions": [], "system.health.value": wasHealth })
        .catch(() => {});
      for (const t of CardRPGTray.openTrays) await t.close();

      return [
        ["the second combatant is the one acting", acting, combat.turns?.[1]?.actor?.name ?? npc.name],
        ["and the turn marker is written for their turn, not the first one's",
          marks[0], "1:1"],
        ["and Burning on them costs them the value on it", before - after, 2]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-16] Ground, phase 0: a square can be something.**
   *
   * core-rules 11 is named *Grid, ground and movement* and the ground half reached the table only
   * by being read aloud -- five shapes, six properties, a validated schema field, eight steps in
   * the content using it, twelve entries reading a shadowed square, and not one reader in the
   * engine. *Longer Shadow* and *The Borrowed Dark* were the only steps in the game whose whole
   * content was a `ground` block, which made them the only two that announced nothing at all.
   *
   * Driven, because every part of this is a claim about a live document: that a Region can be made
   * and flagged, that a point inside it answers, that the round rolls it up, and that the fight
   * ending takes even the ones that said *all fight*.
   */
  await probe("ground, which a square could not have been until today", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const g = await import("/systems/cardrpg/module/ground.mjs");
      const { hero } = LIVE;
      const scene = canvas.scene;
      await g.clearGround(scene);

      const [placed] = await canvas.scene.createEmbeddedDocuments("Token",
        [(await hero.getTokenDocument({ x: 600, y: 600 })).toObject()]);
      /* Inside the scene rectangle on purpose: the map is 3840x1920 and a token parked
       * outside it is outside *wholeMap* too, which cost this probe a run. */
      const here = placed.object?.center ?? { x: placed.x, y: placed.y };
      const far = { x: here.x + canvas.grid.size * 8, y: here.y };

      const before = g.groundAt(scene, here).effects.size;
      /* The block around the caster: *Longer Shadow*, which needs nobody to place it. */
      const made = await g.layGround(scene, {
        shape: "adjacent", effects: ["shadowed"], origin: here, radius: 1, until: 2
      });
      const onIt = [...g.groundAt(scene, here).effects].join(",");
      const offIt = [...g.groundAt(scene, far).effects].join(",");
      const forActor = [...g.groundFor(hero).effects].join(",");

      /* A shape that is somebody's judgement about the map is not placed for them. */
      const line = await g.layGround(scene, {
        shape: "line", effects: ["impassable"], origin: here, until: null
      });

      /* The round rolls it up by comparison, not by counting. */
      const beforeExpiry = g.zonesOn(scene).length;
      await g.expireGround(scene, 2);
      const atItsLastRound = g.zonesOn(scene).length;
      await g.expireGround(scene, 3);
      const afterItsLastRound = g.zonesOn(scene).length;

      /* And somebody else can answer the question. */
      const hook = Hooks.on("cardrpgGroundAt", (sc, point, answer) => answer.effects.add("cover"));
      const overridden = g.groundAt(scene, far).effects.has("cover");
      Hooks.off("cardrpgGroundAt", hook);

      await g.layGround(scene, {
        shape: "wholeMap", effects: ["shadowed"], until: null
      });
      const everywhere = [...g.groundAt(scene, far).effects].join(",");
      const left = await g.clearGround(scene);
      const after = g.zonesOn(scene).length;
      await placed.delete();

      return [
        ["a square is nothing before anybody makes it something", before, 0],
        ["the block around the caster places itself", made ? "made" : "not made", "made"],
        ["and the square they are on is shadowed", onIt, "shadowed"],
        ["and one eight squares away is not", offIt, ""],
        ["and the actor is asked the same way", forActor, "shadowed"],
        ["a line is nobody's to place but a person's", line, null],
        ["the zone survives the round it lasts through", atItsLastRound, beforeExpiry],
        ["and is gone the round after", afterItsLastRound, 0],
        ["a module may answer for a square itself", overridden, true],
        ["the whole map is a shape too", everywhere, "shadowed"],
        ["and the fight ending takes what it made", left > 0 && after === 0, true]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-16] Ground phase 1: a square can give cover, and you can see what you are
   * standing in.**
   *
   * Cover has been *a declared state, not a line traced across the canvas* since it was written,
   * and a zone is the same kind of statement -- somebody put the wall there and somebody walked
   * behind it. *Wall of the Sphere* has asked for exactly this since it was written and had
   * nothing to ask.
   *
   * The second half is the one that matters more and automates less: eleven of the twelve entries
   * that read a shadowed square are rules a person applies, which is right. What a table cannot do
   * is apply a rule about a square nobody can see.
   */
  await probe("a square that gives cover, and a square you can read", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const g = await import("/systems/cardrpg/module/ground.mjs");
      const resolve = await import("/systems/cardrpg/module/resolve.mjs");
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const { hero } = LIVE;
      const npc = game.actors.find(a => a.type === "npc");
      const scene = canvas.scene;
      await g.clearGround(scene);
      for (const t of CardRPGTray.openTrays) await t.close();

      const [tok] = await scene.createEmbeddedDocuments("Token",
        [(await npc.getTokenDocument({ x: 700, y: 700 })).toObject()]);
      const target = tok.actor;
      const here = tok.object?.center ?? { x: tok.x, y: tok.y };

      const bare = resolve.advantageFor(hero, target, { ranged: true });
      await g.layGround(scene, {
        shape: "adjacent", effects: ["cover"], origin: here, radius: 0, until: null
      });
      const behind = resolve.advantageFor(hero, target, { ranged: true });
      const ignoring = resolve.advantageFor(hero, target, { ranged: true, ignoresCover: true });
      /* Melee is untouched: cover has never been a melee rule. */
      const melee = resolve.advantageFor(hero, target, {});

      /* And the chips, for whoever is standing in it. */
      const [heroTok] = await scene.createEmbeddedDocuments("Token",
        [(await hero.getTokenDocument({ x: 700, y: 700 })).toObject()]);
      const chips = g.groundChips(hero);
      await g.layGround(scene, {
        shape: "wholeMap", effects: ["shadowed"], until: null
      });
      const both = g.groundChips(hero).map(c => `${c.label}${c.enforced ? "*" : ""}`).sort().join(", ");

      await g.clearGround(scene);
      await tok.delete();
      await heroTok.delete();
      return [
        ["an open square is no cover", bare.mode, 0],
        ["a square that gives cover costs the shooter", behind.mode, -1],
        ["and the reason says it was the square",
          behind.reasons.join("; ").includes("standing in cover"), true],
        ["a shot that ignores cover is not costed", ignoring.mode, 0],
        ["and cover was never a melee rule", melee.mode, 0],
        ["standing in it reads as one chip", chips.map(c => c.label).join(","), "cover"],
        ["and the engine says which of them it applies itself", both, "cover*, shadowed"]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-16] A GM draws a rock and ticks it.**
   *
   * Phases 0 and 1 only let a CARD make ground, which answers the wrong half of the question. The
   * first thing anybody wants is *that rock gives cover*, and a rock is not a card: it is scenery
   * drawn once that the party walks behind all evening.
   *
   * Foundry's Region tool already draws, snaps and persists, so this adds a fieldset to the
   * region's own configuration and nothing else -- no layer, no drawing tool, no click handler.
   * What is driven here is that the fieldset arrives, that ticking it writes the document, that
   * the resolver then reads it, and above all **that the end of a fight does not delete it**.
   */
  await probe("ground a GM ticks onto a region they drew", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const g = await import("/systems/cardrpg/module/ground.mjs");
      const resolve = await import("/systems/cardrpg/module/resolve.mjs");
      const { hero } = LIVE;
      const npc = game.actors.find(a => a.type === "npc");
      const scene = canvas.scene;
      await g.clearGround(scene);

      /* A region drawn the ordinary way: no system involvement at all. */
      const [region] = await scene.createEmbeddedDocuments("Region", [{
        name: "A rock",
        shapes: [{ type: "rectangle", x: 700, y: 700, width: 300, height: 300 }]
      }]);
      const beforeTick = g.zonesOn(scene).length;

      await region.sheet.render(true);
      await new Promise(r => setTimeout(r, 900));
      const root = region.sheet.element;
      const boxes = root ? root.querySelectorAll(".cr-ground input[data-ground]").length : 0;
      const cover = root?.querySelector('.cr-ground input[data-ground="cover"]');
      if (cover) {
        cover.checked = true;
        cover.dispatchEvent(new Event("change", { bubbles: true }));
      }
      await new Promise(r => setTimeout(r, 700));
      await region.sheet.close();

      const flagged = g.zonesOn(scene).length;
      const props = [...(region.getFlag("cardrpg", "ground")?.effects ?? [])].join(",");

      /* And the resolver reads it, for a target standing on the rock. */
      const [tok] = await scene.createEmbeddedDocuments("Token",
        [(await npc.getTokenDocument({ x: 800, y: 800 })).toObject()]);
      const shot = resolve.advantageFor(hero, tok.actor, { ranged: true });

      /* The fight ending must take a card's wall and leave the GM's rock. */
      await g.layGround(scene, {
        shape: "adjacent", effects: ["shadowed"],
        origin: { x: 1500, y: 800 }, radius: 1, until: null
      });
      const withBoth = g.zonesOn(scene).length;
      const swept = await g.clearGround(scene);
      const left = g.zonesOn(scene).map(z => z.region.name).join(",");

      await tok.delete();
      await region.delete();
      return [
        ["an untouched region is not ground", beforeTick, 0],
        ["the fieldset offers every property", boxes, Object.keys(LIVE.CARDRPG.groundEffects).length],
        ["ticking one makes the region ground", flagged, 1],
        ["and it is the one that was ticked", props, "cover"],
        ["a shot at somebody on it is costed", shot.mode, -1],
        ["a card's wall stands beside it", withBoth, 2],
        ["the fight takes its own", swept, 1],
        ["and leaves what the GM drew", left, "A rock"]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-16] Ground phase 2: the ground bites, and the water keeps you wet.**
   *
   * *The Sphere Entire* is *difficult ground, cover, and 2 damage at the start of your turn*, and
   * *The Standing Flood* is deep water that leaves everything in it Wet (2). Both were prose with
   * a validated field behind them and nothing reading either.
   *
   * The condition is renewed by standing there and starts the moment you walk in, which is two
   * call sites of one function: the turn tick, and the arrival hook. Leaving is what ends it --
   * a zone hands out one round at a time, because a zone that handed out five would be a puddle
   * you carry around.
   *
   * The actor is taken off the combat, not out of `game.actors`: an unlinked token carries a copy,
   * and a condition written to the wrong document is a test that accuses the engine of nothing.
   */
  await probe("ground that bites, and ground that soaks", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const g = await import("/systems/cardrpg/module/ground.mjs");
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const { hero } = LIVE;
      const npc = game.actors.find(a => a.type === "npc");
      for (const t of CardRPGTray.openTrays) await t.close();
      for (const c of [...game.combats]) await c.delete();
      await g.clearGround(canvas.scene);

      const place = async (actor, x, y) =>
        (await canvas.scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y })).toObject()]))[0];
      const ph = await place(hero, 500, 500);
      const pn = await place(npc, 900, 500);
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant", [
        { tokenId: ph.id, sceneId: canvas.scene.id, actorId: hero.id, initiative: 20 },
        { tokenId: pn.id, sceneId: canvas.scene.id, actorId: npc.id, initiative: 10 }
      ]);
      await combat.startCombat();
      const pause = () => new Promise(r => setTimeout(r, 900));
      await pause();

      /* Second in the order, standing in a burning flood: 2 damage and Wet 2. */
      const second = combat.turns[1].actor;
      const where = pn.object?.center ?? { x: pn.x, y: pn.y };
      await g.layGround(canvas.scene, {
        shape: "adjacent", effects: ["difficult"], damage: 2,
        condition: "wet", intensity: 2, origin: where, radius: 0, until: null
      });
      /* And a second, overlapping, dealing less: the larger wins rather than the sum. */
      await g.layGround(canvas.scene, {
        shape: "adjacent", effects: ["difficult"], damage: 1,
        origin: where, radius: 0, until: null
      });
      const reads = g.groundFor(second).damage;

      const before = second.system.health.value;
      const wetBefore = (second.system.conditions ?? []).some(c => c.key === "wet");
      await combat.nextTurn();
      await pause();
      const acting = combat.combatant?.actor?.name ?? "nobody";
      const after = combat.turns[1].actor.system.health.value;
      const wet = (combat.turns[1].actor.system.conditions ?? []).find(c => c.key === "wet");

      /*
       * And the other half of intensity: it means something only where the condition has a value.
       * Burning does, so a zone that burns carries how fiercely. Imposed by hand rather than by
       * advancing the turn, because advancing it would also deal the burn and move the number this
       * probe is holding still.
       */
      const first = combat.turns[0].actor;
      await g.layGround(canvas.scene, {
        shape: "adjacent", effects: ["difficult"], condition: "burning", intensity: 3,
        origin: ph.object?.center ?? { x: ph.x, y: ph.y }, radius: 0, until: null
      });
      await g.imposeGround(first);
      const burned = (combat.turns[0].actor.system.conditions ?? []).find(x => x.key === "burning");

      /* The chips say both, and say the engine owns them. */
      const chips = g.groundChips(combat.turns[1].actor)
        .map(c => `${c.label}${c.enforced ? "*" : ""}`).sort().join(", ");

      /* The fight's own end takes the zones it made, so this must not ask for them twice:
       * two deletes of one region is a throw, and the first draft of this probe was the
       * second delete. */
      await combat.delete();
      await pause();
      await ph.delete();
      await pn.delete();
      const swept = g.zonesOn(canvas.scene).length;
      return [
        ["two zones on one square give the larger, not the sum", reads, 2],
        ["and the fight's end took them both without being asked twice", swept, 0],
        ["it is their turn", acting, combat.turns?.[1]?.actor?.name ?? npc.name],
        ["standing in it costs them its damage", before - after, 2],
        ["and the water leaves them Wet", wet ? "wet" : "dry", "wet"],
        ["and carries no intensity, because Wet has no value to carry",
          wet?.value ?? null, null],
        ["while a zone whose condition IS valued carries one", burned?.value ?? 0, 3],
        ["which they did not have before they stood there", wetBefore, false],
        ["and it lasts one round at a time", wet?.duration ?? 0, 1],
        ["and the chips name both, as the engine's",
          chips, "2 damage*, Wet*, difficult ground"]
      ];
    });
  });

  await probe("the claim control, measured rather than read", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const resolve = await import("/systems/cardrpg/module/resolve.mjs");
      const { hero } = LIVE;
      await resolve.clearEdge(hero);
      for (const t of CardRPGTray.openTrays) await t.close();
      const tray = game.cardrpg.openTray(hero);
      await tray.render({ force: true });
      await new Promise(r => setTimeout(r, 700));

      const states = [...document.querySelectorAll(".cr-edge__state")];
      const labels = states.map(b => b.textContent.trim()).join(", ");
      /* On the screen means: a box with area, and inside the window. A control the layout has
       * pushed off the edge is a control nobody has. */
      const shown = states.filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0
          && r.bottom > 0 && r.right > 0
          && r.top < window.innerHeight && r.left < window.innerWidth;
      }).length;

      /* And the portrait, which is the other thing reported missing from this same panel. */
      const face = document.querySelector(".cr-options__face");
      const faceBox = face?.getBoundingClientRect();
      const faceShown = !!faceBox && faceBox.width > 0 && faceBox.height > 0;
      const faceLoaded = !!face && face.complete && face.naturalWidth > 0;

      /* Press the one that claims advantage, as a player would. */
      const plus = states.find(b => b.dataset.mode === "1");
      plus?.click();
      await new Promise(r => setTimeout(r, 700));
      const claimed = resolve.readEdge(hero)?.mode ?? 0;

      /* And does the resolver draw differently for it. */
      const npc = game.actors.find(a => a.type === "npc");
      const withClaim = resolve.advantageFor(hero, npc, {});
      await resolve.clearEdge(hero);
      const without = resolve.advantageFor(hero, npc, {});
      for (const t of CardRPGTray.openTrays) await t.close();

      return [
        ["the three states the panel offers", labels, "Disadvantage, Normal, Advantage"],
        ["and how many are a box inside the window", shown, 3],
        ["the actor's face is on the same panel", faceShown, true],
        ["and the picture actually loaded", faceLoaded, true],
        ["pressing advantage claims it", claimed, 1],
        ["and the resolver draws with it", withClaim.mode, 1],
        ["and says why, in the words the table will read",
          withClaim.reasons.some(r => /claimed/.test(r)), true],
        ["and without it once it is spent", without.mode, 0]
      ];
    });
  });

  await probe("the HUD a GM gets when the goblin's turn comes", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const { hero } = LIVE;
      const npc = game.actors.find(a => a.type === "npc");
      if (!npc) return [["a monster to take a turn", "none in the world", "one"]];
      for (const t of CardRPGTray.openTrays) await t.close();
      for (const c of [...game.combats]) await c.delete();

      const place = async (actor, x) =>
        (await canvas.scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y: 1000 })).toObject()]))[0];
      const ph = await place(hero, 1000);
      const pn = await place(npc, 1200);
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant", [
        { tokenId: ph.id, sceneId: canvas.scene.id, actorId: hero.id, initiative: 20 },
        { tokenId: pn.id, sceneId: canvas.scene.id, actorId: npc.id, initiative: 10 }
      ]);
      /* Long enough for a close transition to finish, so a HUD on its way out is not counted. */
      const settled = () => new Promise(r => setTimeout(r, 1400));
      const whose = () => CardRPGTray.openTrays.map(t => t.actor?.name).sort().join(", ");

      await combat.startCombat();
      await settled();
      const onFirstTurn = whose();

      /* What the hook could see, which is the fault itself rather than its symptom. */
      let stale = "none";
      let fresh = "none";
      const id = Hooks.on("combatTurn", (c, upd) => {
        stale = c.combatant?.actor?.name ?? "nobody";
        fresh = c.turns?.[upd?.turn]?.actor?.name ?? "nothing in updateData";
      });
      await combat.nextTurn();
      await settled();
      Hooks.off("combatTurn", id);
      const acting = combat.combatant?.actor?.name ?? "nobody";
      const onGoblinTurn = whose();

      /* And the other half of the report: picking the token up by hand. */
      pn.object?.control({ releaseOthers: true });
      await settled();
      const bySelection = whose();

      await combat.delete();
      await ph.delete();
      await pn.delete();
      for (const t of CardRPGTray.openTrays) await t.close();
      return [
        ["the client running this is a GM", game.user.isGM, true],
        ["the fight opens on the hero", onFirstTurn, hero.name],
        ["and the goblin's turn comes round", acting, npc.name],
        ["what the combat says inside the hook is the turn that ended", stale, hero.name],
        ["and what updateData says is the turn that started", fresh, npc.name],
        ["so the HUD on the screen is the goblin's", onGoblinTurn, npc.name],
        ["and one HUD is open, not two", bySelection, npc.name]
      ];
    });
  });

  /*
   * **And the three it was reported beside**, each of which turned out to be built. They stay
   * because a rule somebody reported broken is worth a check whatever the answer was: *selecting a
   * token out of a fight gives you a HUD*, *it offers the skill side out of combat*, and *the
   * sheet lists the cards you have rather than counting them*.
   */
  await probe("a HUD out of a fight, and which deck it offers", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const { hero } = LIVE;
      for (const c of [...game.combats]) await c.delete();
      for (const t of CardRPGTray.openTrays) await t.close();
      const [placed] = await canvas.scene.createEmbeddedDocuments("Token",
        [(await hero.getTokenDocument({ x: 900, y: 900 })).toObject()]);
      placed.object?.control({ releaseOthers: true });
      await new Promise(r => setTimeout(r, 1400));
      const open = CardRPGTray.openTrays.map(t => t.actor?.name).join(", ");
      const corner = document.querySelector(".cr-pile--action .cr-pile__label")
        ?.textContent?.trim() ?? "nothing";
      await placed.delete();
      return [
        ["selecting a token out of a fight opens a HUD", open, hero.name],
        ["and the corner it offers is the skill deck", corner, "Skill deck"]
      ];
    });
  });

  /*
   * **The spells, on the sheet at last.**  **[BUILT 2026-11-24]**
   *
   * Reported from a table as *spells are not visible on player sheet, spells cannot be viewed or
   * edited*, and the two halves were one omission: a spell is an embedded slate like a feature,
   * the slate sheet has been able to edit one since it was written, and this sheet listed items,
   * features and injuries and never spells. Every field was editable and nothing linked to it.
   *
   * Asked of a browser rather than of the source, because what was wrong was not a missing
   * function: every piece existed and no screen showed any of it. So the questions are a reader's
   * -- is the row there, does it say what the cast costs, does the button change what is in the
   * caster's head -- and the last one is the point. `prepared` is a boolean the data model has
   * carried since it was written and nothing in the game ever set it.
   */
  /*
   * **Casting spends the preparation.**  **[RULED 2026-11-24]**
   *
   * Nothing limited how often a prepared spell could be cast: `strength` is a slot cost, so slots
   * bounded how many spells a caster HELD and no rule bounded the casting -- and 117 of the 147
   * spells in the content print no price at all, so for most of the list a cast was free,
   * repeatable and unlimited, inside a two-halves budget everybody else obeys.
   *
   * Asked of `payToCast` rather than of a click, because that is the door every cast comes
   * through and the rule has to hold for a macro as well as for the window. The rest is asked of
   * `rest`, for the same reason.
   */
  await probe("casting a prepared spell spends it", async () => {
    await settle(page);
    const out = await page.evaluate(async () => {
      const { hero } = LIVE;
      const wasBase = hero.system.spellSlots?.base ?? 0;
      await hero.update({ "system.spellSlots.base": 3 });
      /*
       * **A hand free, because a prepared spell is gestured** (core-rules 4), and this world's
       * hero holds a sword and a shield. The first run of this probe reported the very first cast
       * as refused, which was `payToCast` being right: both hands were full.
       */
      const held = hero.items.filter(i => i.type === "item" && i.system.equipped
        && i.system.equippedSlot === "hands").map(i => i.id);
      for (const id of held) await hero.items.get(id)?.update({ "system.equipped": false });
      /* Free to cast on purpose: the common case in the content, and the one where the
       * preparation IS the whole price. */
      const [spell] = await hero.createEmbeddedDocuments("Item", [{
        name: "Probe Cantrip Spent", type: "spell",
        system: { prepared: true, strength: 1, source: "Probe Magic" }
      }]);

      const slotsHeld = hero.system.spellSlots?.used ?? 0;
      const first = await LIVE.payToCast(hero, spell);
      const drained = !!spell.system.drained;
      const stillPrepared = !!spell.system.prepared;
      const slotsAfter = hero.system.spellSlots?.used ?? 0;
      /* The second cast, which is the whole ruling. */
      const second = await LIVE.payToCast(hero, spell);

      /* A SHORT rest is not enough. */
      await LIVE.rest(hero, { long: false });
      const afterShort = !!spell.system.drained;
      /* A long one is. */
      const rested = await LIVE.rest(hero, { long: true });
      const afterLong = !!spell.system.drained;
      const third = await LIVE.payToCast(hero, spell);

      /* And a feature that prints a rest boundary, which nothing had ever honoured. */
      const [feature] = await hero.createEmbeddedDocuments("Item", [{
        name: "Probe Boundary Feature", type: "feature",
        system: { drained: true, active: { text: "a probe", boundary: "longRest" } }
      }]);
      await LIVE.rest(hero, { long: false });
      const featureAfterShort = !!feature.system.drained;
      await LIVE.rest(hero, { long: true });
      const featureAfterLong = !!feature.system.drained;

      await spell.delete();
      await feature.delete();
      await hero.update({ "system.spellSlots.base": wasBase });
      /* And the hands back as they were found, which the probes further down read. */
      for (const id of held) {
        await hero.items.get(id)
          ?.update({ "system.equipped": true, "system.equippedSlot": "hands" });
      }
      return {
        first, drained, stillPrepared, second, third,
        slotsHeld, slotsAfter,
        afterShort, afterLong,
        woken: (rested?.woken ?? []).join(","),
        featureAfterShort, featureAfterLong
      };
    });
    return [
      ["a prepared spell casts", out.first, true],
      /* The preparation is the cost, in the engine's own vocabulary for a thing that was never in
       * your hand. */
      ["and the cast spends it", out.drained, true],
      /* In your head and used up, not back in the book: the slot is what the rest is about. */
      ["and it stays in your head", out.stillPrepared, true],
      ["and still costs its slot", `${out.slotsHeld} then ${out.slotsAfter}`, "1 then 1"],
      /* **The row this probe exists for.** */
      ["a second cast is refused", out.second, false],
      ["and a short rest does not bring it back", out.afterShort, true],
      ["a long rest does", out.afterLong, false],
      ["and says what came back", out.woken, "Probe Cantrip Spent"],
      ["and then it casts again", out.third, true],
      /* And the two rest boundaries nothing had ever read: only the end of a fight was honoured,
       * so a feature printed *recharges: a long rest* was drained for the rest of the campaign. */
      ["a feature that recharges on a long rest survives a short one", out.featureAfterShort, true],
      ["and comes back from a long one", out.featureAfterLong, false]
    ];
  });

  await probe("a caster can see and prepare their spells", async () => {
    await settle(page);
    const out = await page.evaluate(async () => {
      const { hero } = LIVE;
      /*
       * **And slots to put them in**, because the hero of this world is a warrior with none.
       * Without this every Prepare is refused for the right reason and the probe reports the
       * button as broken -- which is what the first run did, and the row about the refusal passed
       * at the same time by accident: everything was being refused.
       */
      const wasBase = hero.system.spellSlots?.base ?? 0;
      await hero.update({ "system.spellSlots.base": 3 });
      /* Two spells, because the interesting states are a pair: one in the head and one in the
       * book, which is also what the list's order is about. */
      const made = await hero.createEmbeddedDocuments("Item", [
        {
          name: "Probe Spell Prepared", type: "spell",
          system: { prepared: true, strength: 1, source: "Probe Magic", cost: { health: 2 } }
        },
        {
          name: "Probe Spell Booked", type: "spell",
          system: { prepared: false, strength: 1, source: "Probe Magic" }
        }
      ]);
      await hero.sheet.render(true);
      await new Promise(r => setTimeout(r, 600));
      const tab = hero.sheet.element
        ?.querySelector('[data-action="switchTab"][data-tab="features"]');
      tab?.click();
      await new Promise(r => setTimeout(r, 600));

      const root = hero.sheet.element;
      const heads = [...(root?.querySelectorAll("h3") ?? [])]
        .map(h => h.textContent.replace(/\s+/g, " ").trim());
      const rowOf = name => [...(root?.querySelectorAll(".cr-slate-row") ?? [])]
        .find(li => li.querySelector(".cr-slate-row__name")?.textContent.trim() === name);
      const prepared = rowOf("Probe Spell Prepared");
      const booked = rowOf("Probe Spell Booked");
      /* The row the sheet shows first is the prepared one, which is the tray's order. */
      const order = [...(root?.querySelectorAll(".cr-slate-row__name") ?? [])]
        .map(n => n.textContent.trim())
        .filter(n => n.startsWith("Probe Spell"))
        .join(",");
      const lineOf = row => [...(row?.querySelectorAll(".cr-note") ?? [])]
        .map(n => n.textContent.replace(/\s+/g, " ").trim()).join(" | ");
      const priceLine = lineOf(prepared);
      const bookedLine = lineOf(booked);
      const bookDimmed = !!booked?.classList.contains("cr-slate-row--book");

      /* And the button, which is the whole report: clicking it changes what is in the head. */
      const button = booked?.querySelector('[data-action="togglePrepared"]');
      const freeBefore = hero.system.spellSlots?.free ?? 0;
      const label = button?.textContent.trim() ?? "nothing";
      button?.click();
      for (let i = 0; i < 30 && !made[1].system.prepared; i++) {
        await new Promise(r => setTimeout(r, 100));
      }
      const nowPrepared = !!made[1].system.prepared;

      /* Over budget is refused rather than written: the free slots are derived from what is
       * prepared, so a list over budget is a state the rules do not have. */
      const [third] = await hero.createEmbeddedDocuments("Item", [{
        name: "Probe Spell Huge", type: "spell",
        system: { prepared: false, strength: 99, source: "Probe Magic" }
      }]);
      await hero.sheet.render(true);
      await new Promise(r => setTimeout(r, 600));
      const hugeRow = [...(hero.sheet.element?.querySelectorAll(".cr-slate-row") ?? [])]
        .find(li => li.querySelector(".cr-slate-row__name")?.textContent.trim()
          === "Probe Spell Huge");
      hugeRow?.querySelector('[data-action="togglePrepared"]')?.click();
      await new Promise(r => setTimeout(r, 500));
      const huge = !!third.system.prepared;

      /*
       * **And a row opens the document that can edit it**, which is what *cannot be viewed* meant.
       *
       * Re-found rather than reused: the render above replaced the list, so the node captured
       * before it is detached from the document and a click on it bubbles to nothing. The first
       * run of this probe clicked the old node and reported the sheet as never opening.
       */
      const row = [...(hero.sheet.element?.querySelectorAll(".cr-slate-row") ?? [])]
        .find(li => li.querySelector(".cr-slate-row__name")?.textContent.trim()
          === "Probe Spell Prepared");
      /*
       * **The dots first, because that is where Edit lives.** *Edit* opens a document a player
       * touches once a session and it sits behind the row menu rather than shouting beside the
       * name (sheets.mjs). Clicking the hidden button straight was this probe's own first attempt
       * and nothing happened -- which is correct: a menu that has not been opened has not been
       * clicked.
       */
      row?.querySelector('[data-action="rowMenu"]')?.click();
      await new Promise(r => setTimeout(r, 200));
      const opener = row?.querySelector('[data-action="editSlate"]');
      opener?.click();
      await new Promise(r => setTimeout(r, 600));
      const slateSheet = made[0].sheet?.rendered ?? false;
      const fields = made[0].sheet?.element
        ? [...made[0].sheet.element.querySelectorAll("[name]")].map(i => i.name)
        : [];
      /*
       * **And a card's own config sheet, which was broken by the same line.** The step editor is
       * one partial shared by a card half, a spell's effect, an NPC's sequence and a piece of
       * ammunition -- that is why it is a partial -- so the timing that could not render took
       * every one of its callers down with it. A spell was the one the table noticed because a
       * spell has nowhere else to be read.
       */
      const anyCard = LIVE.deckOf(hero, "action")?.cards?.contents?.[0];
      let cardSheet = "no card in the deck";
      if (anyCard) {
        try {
          await anyCard.sheet.render({ force: true });
          await new Promise(r => setTimeout(r, 500));
          cardSheet = anyCard.sheet.rendered ? "opens" : "did not open";
        } catch (err) { cardSheet = String(err?.message ?? err).slice(0, 60); }
        anyCard.sheet?.close();
      }

      made[0].sheet?.close();
      await hero.sheet.close();
      for (const doc of [...made, third]) await doc.delete();
      await hero.update({ "system.spellSlots.base": wasBase });
      return {
        freeBefore, bookedLine, cardSheet,
        heads: heads.filter(h => h.startsWith("Spells")).join(" | ") || "nothing",
        listed: !!prepared && !!booked,
        order,
        priceLine,
        bookDimmed,
        label,
        nowPrepared,
        huge,
        slateSheet,
        canEditPrepared: fields.includes("system.prepared"),
        canEditStrength: fields.includes("system.strength")
      };
    });
    return [
      /* The section is on the tab, and its heading carries the budget rather than making a caster
       * add the column up. */
      ["the sheet has a Spells block", /^Spells/.test(out.heads), true],
      ["and the heading says the slot budget", /of \d+ slots/.test(out.heads), true],
      ["both a prepared spell and a booked one are listed", out.listed, true],
      ["and the prepared one comes first", out.order,
        "Probe Spell Prepared,Probe Spell Booked"],
      /* What the cast costs, which is the half a player cannot get from the name. */
      /*
       * Two costs, printed as two: slots are paid once to keep it in your head, and the cast price
       * every time it is cast. **The preparation is part of that second one** since the ruling of
       * 2026-11-24, which is why no row says *nothing* any more -- a spell that prints no price
       * still costs the spell, and that was the whole point of the ruling.
       */
      ["and the row says what each cast takes", /Each cast: 2 Health/.test(out.priceLine), true],
      ["and what it costs to keep in your head", /1 slot while prepared/.test(out.priceLine), true],
      ["and that a cast spends the preparation",
        /the preparation . back on a long rest/.test(out.priceLine), true],
      ["and a spell with no price still costs the spell",
        /Each cast: the preparation/.test(out.bookedLine), true],
      ["and the book is dimmed rather than hidden", out.bookDimmed, true],
      /* The button that did not exist: `prepared` had no surface anywhere in the game. */
      /* And there really was room for it, so the refusal below is the budget talking and not
       * every Prepare failing. */
      ["and there is a slot free for it", out.freeBefore > 0, true],
      ["the booked spell offers Prepare", out.label, "Prepare"],
      ["and clicking it puts the spell in the caster's head", out.nowPrepared, true],
      ["but a spell past the budget is refused", out.huge, false],
      /* And *cannot be viewed or edited*, answered by opening the thing that edits it. */
      ["a row's menu opens the slate sheet", out.slateSheet, true],
      ["and that sheet can edit what is prepared", out.canEditPrepared, true],
      ["and the spell's strength", out.canEditStrength, true],
      /* The same partial, the same line, every other caller of it. */
      ["and a card's own config sheet opens too", out.cardSheet, "opens"]
    ];
  });

  await probe("the cards an actor has, read off the sheet", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      await hero.sheet.render(true);
      await new Promise(r => setTimeout(r, 600));
      const tab = hero.sheet.element?.querySelector('[data-action="switchTab"][data-tab="deck"]');
      const offered = tab ? "yes" : "no";
      tab?.click();
      await new Promise(r => setTimeout(r, 600));
      const root = hero.sheet.element;
      const rows = root?.querySelectorAll(".cr-cardlist__row").length ?? 0;
      const heads = [...(root?.querySelectorAll("h3") ?? [])].map(h => h.textContent.trim());
      await hero.sheet.close();
      return [
        ["the sheet offers a deck tab", offered, "yes"],
        ["and it lists the cards rather than counting them", rows > 0, true],
        ["and both decks are on it",
          ["Action deck", "Skill deck"].filter(h => heads.includes(h)).join(", "),
          "Action deck, Skill deck"]
      ];
    });
  });

  /*
   * **And the parenthesis that said nothing, asked of a browser rather than of the source.**
   * The suite already checks it is gone from the source; this asks whether a Move whose number
   * was cut still explains itself on the card, which is what replaced it.
   */
  await probe("what a Move prints when something is taking squares off it", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const { hero } = LIVE;
      const was = (hero.system.conditions ?? []).map(c => ({ ...c }));
      await hero.update({ "system.conditions": [{ key: "slowed", duration: 2, creatorId: "" }] });
      const asPlayed = hero.system.moveAsPlayed(3);
      const tray = game.cardrpg.openTray(hero);
      await tray.render({ force: true });
      await new Promise(r => setTimeout(r, 600));
      const onScreen = document.querySelector(".cardrpg.cr-hud")?.textContent ?? "";
      await hero.update({ "system.conditions": was });
      for (const t of CardRPGTray.openTrays) await t.close();
      return [
        ["Slowed takes a Move 3 down to", asPlayed.played, 1],
        ["and says what took the squares", asPlayed.why.length > 0, true],
        ["and nothing on the screen prints the parenthesis that said nothing",
          onScreen.includes("(was"), false]
      ];
    });
  });

  await probe("a tattoo mage casts with both hands full and through Silenced", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const before = [...(hero.system.nodes ?? [])];
      const wasConditions = (hero.system.conditions ?? []).map(c => ({ ...c }));
      const silence = [{ key: "silenced", duration: 2, creatorId: "" }];
      const [icon] = LIVE.CARDRPG.conditions.silenced.blocks;

      await hero.update({ "system.nodes": ["root"], "system.conditions": silence });
      const plainExempt = hero.system.exemptFrom.has("silenced");
      const plainBlocked = hero.system.blockedIcons.has(icon);

      /* The school. `mind.tattoo` grants a feature and the two flags, and asks no question. */
      await hero.update({ "system.nodes": ["root", "mind.tattoo"] });
      const mageFree = hero.system.castsFreehanded;
      const mageExempt = hero.system.exemptFrom.has("silenced");
      const mageBlocked = hero.system.blockedIcons.has(icon);
      /* Exempt is not dispelled: it is still on them, and still ticking. */
      const stillOn = hero.system.activeConditions.some(c => c.key === "silenced");

      /* And the Half-mage, whose Tactic promises the hand and claims nothing about speech. */
      await hero.update({ "system.nodes": ["root", "shade.half-mage"] });
      const halfFree = hero.system.castsFreehanded;
      const halfBlocked = hero.system.blockedIcons.has(icon);

      await hero.update({ "system.nodes": before, "system.conditions": wasConditions });

      return [
        ["a character with neither node is not exempt from Silenced", plainExempt, false],
        ["and Silenced blocks their magic", plainBlocked, true],
        ["Tattoo Magic casts with both hands full", mageFree, true],
        ["and is exempt from Silenced", mageExempt, true],
        ["so Silenced blocks nothing of theirs", mageBlocked, false],
        ["while still being on them, because exempt is not dispelled", stillOn, true],
        ["the Half-mage casts with both hands full too", halfFree, true],
        ["and Silenced still stops them, which is the half their Tactic never claimed",
          halfBlocked, true]
      ];
    });
  });

  await probe("a character is given what their nodes promised", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const graph = await import("/systems/cardrpg/module/graph.mjs");
      const { hero } = LIVE;
      const before = [...(hero.system.nodes ?? [])];

      /* A node that grants a feature and one that grants gear, and neither asks a question. */
      const quiet = id => {
        const g = graph.GRAPH.get(id)?.grants ?? {};
        return !g.choose && !g.expertise && !g.prune;
      };
      const giving = [...graph.GRAPH.keys()].filter(id => {
        const g = graph.GRAPH.get(id)?.grants ?? {};
        return quiet(id) && (g.feature || (g.item ?? []).length);
      }).slice(0, 3);

      await hero.update({ "system.nodes": ["root", ...giving] });
      /* Nothing arrived, which is the state every character made before today is in. */
      const owed = new Set(giving.flatMap(id => {
        const g = graph.GRAPH.get(id).grants;
        return [g.feature, ...[g.item ?? []].flat()].filter(Boolean);
      }));
      for (const item of hero.items.filter(i => owed.has(i.name))) await item.delete();
      const started = hero.items.filter(i => owed.has(i.name)).length;

      const first = await graph.repairCharacter(hero);
      const after = hero.items.filter(i => owed.has(i.name)).length;
      /* And again, which is what makes it safe on a button rather than in a release note. */
      const second = await graph.repairCharacter(hero);
      const stillAfter = hero.items.filter(i => owed.has(i.name)).length;

      await hero.update({ "system.nodes": before });

      return [
        ["the nodes were owned and had handed over nothing", started, 0],
        ["the repair hands over every one of them", after, owed.size],
        ["and names them", first.items.length, owed.size],
        ["a second run finds them rather than making a second set", stillAfter, owed.size],
        ["and reports nothing to do", second.changed, 0],
        ["an NPC is refused rather than half-repaired",
          await graph.repairCharacter(game.actors.find(a => a.type === "npc")), null]
      ];
    });
  });

  await probe("a monster attacks from its HUD", async () => {
    await settle(page);
    const opened = await page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      /*
       * **Named, not "whichever NPC is first".**  [FIXED 2026-11-15]
       *
       * It was `find(a => a.type === "npc")`, which was unambiguous while the starter world held
       * the goblin line and nothing else. The creature-passives probe above now builds a Grey
       * Assassin and a Smash Beetle into the world, so *the first NPC* became whatever the
       * collection happened to hand back -- and a Smash Beetle swings a Tail Club, which the
       * weapon assertion below did not recognise. One row in three failed, intermittently, in a
       * probe about something else entirely.
       *
       * A probe that needs a particular creature should say which. The fallback is the old
       * behaviour, for a world that somehow has no goblin in it.
       */
      const beast = game.actors.getName("Goblin") ?? game.actors.find(a => a.type === "npc");
      globalThis.LIVE.beast = beast;
      /* A target, which is the one thing the click does not supply. The hero is standing in for
       * whoever the goblin would be swinging at. */
      const doc = (await LIVE.hero.getTokenDocument({ x: 1200, y: 1200 })).toObject();
      const [placed] = await canvas.scene.createEmbeddedDocuments("Token", [doc]);
      globalThis.LIVE.mark = placed;
      /*
       * **Wait for the token to exist on the canvas, not just in the database.** A placeable is
       * drawn a tick after its document is created, and a probe that ran straight after another
       * one that deleted tokens found `placed.object` undefined -- so the target was never set
       * and the attack correctly refused for want of one. The failure looked like a broken
       * button and was a race in the probe.
       */
      for (let i = 0; i < 50 && !placed.object; i++) {
        await new Promise(r => setTimeout(r, 100));
      }
      placed.object?.setTarget(true, { releaseOthers: true });
      await LIVE.hero.update({ "system.health.value": LIVE.hero.system.health.max });
      game.cardrpg.openTray(beast);
      return { health: LIVE.hero.system.health.value, targets: game.user.targets.size };
    });
    await page.waitForSelector(".cr-npc__strike", { timeout: 20000 });
    /*
     * **Pressed until it answers, because the HUD redraws under the cursor.**
     *
     * The tray re-renders on \`updateActor\`, \`updateCard\` and half a dozen other hooks, and this
     * probe sets the hero's health two lines above -- so the button can be detached between the
     * wait and the click, and a click into a node that is no longer in the document is a click
     * that resolves and does nothing. The first version of this failed about one run in four,
     * which is worse than failing every time: it reads as a flaky feature rather than a flaky
     * probe.
     *
     * So the click is the thing retried and the monster SPEAKING is the signal. A Miss is a real
     * outcome -- no damage, but a chat card all the same -- so health is the wrong thing to wait
     * on and the message is the right one.
     */
    const spoke = () => page.evaluate(() =>
      [...game.messages].some(m => m.speaker?.actor === LIVE.beast.id));
    for (let i = 0; i < 4 && !(await spoke()); i++) {
      await page.click(".cr-npc__strike", { force: true }).catch(() => {});
      await page.waitForFunction(() =>
        [...game.messages].some(m => m.speaker?.actor === LIVE.beast.id),
      null, { timeout: 5000 }).catch(() => {});
    }
    const rows = await page.evaluate(async () => {
      const { hero } = LIVE;
      const said = [...game.messages].reverse()
        .find(m => m.speaker?.actor === LIVE.beast.id)?.content ?? "";
      LIVE.mark.object?.setTarget(false);
      await LIVE.mark.delete();
      await hero.update({ "system.health.value": hero.system.health.max });
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      game.cardrpg.openTray(hero);
      return [
        /* A Miss is a real outcome, so what is asserted is that the attack RESOLVED: a fate card
         * was drawn against a target, and the card says which weapon swung. */
        ["the monster's attack resolves", /Fate/.test(said), true],
        /*
         * **Asked of the creature's own gear** rather than a hand-written list of weapon names.
         * The list was the half that went stale: it had seven names in it, and the roster is
         * seventy-five creatures carrying rather more than seven weapons between them.
         */
        ["naming the weapon it swung",
          LIVE.beast.items.filter(i => i.type === "item" && i.system.equipped)
            .some(i => said.includes(i.name)), true],
        /*
         * **And it is resolved against the figure that was marked**, which the card names in a
         * row of its own. Not *the hero lost health*: the starter Warrior wears Leather Armor,
         * a goblin spear is 3, and a fate card of -2 leaves nothing to get through. Zero damage
         * is the armour doing its job, and an assertion that reads it as a failure is an
         * assertion about the dice.
         */
        ["and it resolves against the figure that was marked",
          said.includes(hero.name), true]
      ];
    });
    rows.unshift(["the hero started at full health", opened.health, 12],
      ["and was the one targeted", opened.targets, 1]);
    return rows;
  });

  /*
   * **One hand at a time, and a button to say which.**  [BUILT 2026-11-14]
   *
   * Out of combat the window drew both: the action hand laid across the scene, the skill hand
   * under it, and a deck in the corner that was always the action one. Two hands on the screen is
   * two hands to read and only one of them could be played.
   *
   * The mode picks the side and the toggle overrules it, so the probe presses it: out of a fight
   * it must open on the skill deck, the button must turn it to the action deck, and the pin must
   * hold -- a check called in the middle of a fight is the whole reason the override exists.
   */
  await probe("the two decks", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      /* No combat running and nothing pinned, so the mode picks the skill side by itself. */
      for (const c of [...game.combats]) await c.delete();
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = null;
      await tray.render();
    });
    await page.waitForSelector(".cr-hud__decks--action", { timeout: 20000 });
    const read = () => page.evaluate(() => {
      const corner = document.querySelector(".cr-pile--action .cr-pile__label")?.textContent ?? "";
      return {
        corner: corner.trim(),
        hands: document.querySelectorAll(".cr-hud__hand").length,
        scenes: document.querySelectorAll(".cr-scene").length,
        flip: document.querySelector(".cr-pile__flip")?.textContent?.trim() ?? ""
      };
    });
    const scene = await read();
    await page.click(".cr-pile__flip");
    await page.waitForFunction(() =>
      document.querySelector(".cr-pile--action .cr-pile__label")?.textContent?.includes("Action"),
    null, { timeout: 20000 }).catch(() => {});
    const combatSide = await read();
    await page.click(".cr-pile__flip").catch(() => {});
    return [
      ["out of a fight the corner is the skill deck", scene.corner, "Skill deck"],
      ["and the skill hand is the one on the screen", `${scene.scenes}/${scene.hands}`, "1/0"],
      ["the button offers the other deck", scene.flip, "Action deck"],
      ["pressing it turns the window over", combatSide.corner, "Action deck"],
      ["and only one hand is ever drawn",
        combatSide.scenes + combatSide.hands <= 1, true],
      ["the button now offers the way back", combatSide.flip, "Skill deck"]
    ];
  });

  /*
   * **A condition card is a card, not a window.**  [FIXED 2026-11-14]
   *
   * \`.cr-card--passive\` set \`opacity: 0.7\` on the card, which takes the card's own BACKGROUND
   * with it -- so an open Conditions pile laid a 70% card over the tray and three sentences
   * showed through each other, none of them readable. The rule was saying *you cannot pick this
   * up*; what it did was make the card transparent.
   *
   * Measured where it was wrong: the card's computed opacity, and the ground actually painted
   * behind its text. A card you can see the tray through has neither.
   */
  await probe("a passive card is opaque", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
    /* Burdened arrives from carried weight, so the pile has something in it to look at. */
    await page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const tray = CardRPGTray.openTrays[0];
      tray.openPiles = new Set(["conditions"]);
      await tray.render();
    });
    await page.waitForSelector(".cr-hud__spread .cr-card", { timeout: 20000 });
    return page.evaluate(() => {
      const card = document.querySelector(".cr-hud__spread .cr-card");
      const css = getComputedStyle(card);
      const name = card.querySelector(".cr-card__name");
      /*
       * **And the dark cards, measured rather than looked at.** A Compulsion's whole face is one
       * note and \`.cr-note\` is painted in \`--cardrpg-dim\`, a dark warm grey that is right on
       * paper and invisible on oxblood. The contrast of the text against the ground it is
       * actually laid on is the only honest test of that.
       */
      const luminance = rgb => {
        const [r, g, b] = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a, b) => {
        const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
      };
      const harm = [...document.querySelectorAll(".cr-card--harm")];
      const worst = Math.min(99, ...harm.flatMap(card => {
        const ground = getComputedStyle(card).backgroundColor;
        return [...card.querySelectorAll(".cr-note, .cr-card__name")]
          .map(el => ratio(getComputedStyle(el).color, ground));
      }));

      return [
        ["the card itself is fully opaque", Number(css.opacity), 1],
        ["and every word on a dark card clears 4.5:1",
          harm.length ? Math.round(worst * 10) / 10 >= 4.5 : "no dark card on screen", true],
        ["its ground is painted rather than let through",
          css.backgroundColor !== "rgba(0, 0, 0, 0)", true],
        ["and its text carries a halo against the picture",
          /\d/.test(getComputedStyle(name).textShadow ?? ""), true]
      ];
    });
  });

  /*
   * **The face carries the short register and the tooltip carries the long one.**
   *
   * *Shield Up* printed "Defend (Block applies to every attack until your next turn)" across its
   * own picture, and *Strike* printed "Move 0 (was 1)" -- a number with its cause cut off. Both
   * are measurements rather than opinions: nothing on a face is a sentence, and the sentence is
   * reachable from the thing it explains.
   */
  await probe("a card face stays short", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
    await page.waitForSelector(".cr-hud__hand .cr-half", { timeout: 20000 });
    return page.evaluate(() => {
      const halves = [...document.querySelectorAll(".cr-hud__hand .cr-half")];
      const faces = halves.map(h => h.querySelector(".cr-half__play, span:not(.cr-half__marker)"))
        .filter(Boolean);
      const longest = Math.max(0, ...faces.map(f => (f.textContent ?? "").trim().length));
      const parenthesised = faces.filter(f => /\(was \d/.test(f.textContent ?? "")).length;
      /*
       * **Counted in LINES, not in pixels.** The first version of this measured the half's own
       * box, which is laid out by `flex: 2 1 0` and is the same height whatever is written in it
       * -- so it reported five wrapped halves on a hand where nothing wrapped at all. What the
       * complaint was about is text running to a paragraph, and that is the text's own height
       * over its line height.
       */
      const lines = f => {
        const css = getComputedStyle(f);
        const lh = parseFloat(css.lineHeight) || parseFloat(css.fontSize) * 1.2;
        return Math.round(f.getBoundingClientRect().height / lh);
      };
      const tallest = Math.max(0, ...faces.map(lines));
      return [
        ["no half prints the parenthesis that said nothing", parenthesised, 0],
        ["and none of them runs on", longest <= 48, true],
        ["so none wraps past two lines", tallest <= 2, true]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-16] Ground phase 3: what it costs to cross, and what is waiting in it.**
   *
   * Difficult ground is handed to Foundry's own `modifyMovementCost`, whose `difficulties` are
   * per-action multipliers -- so the RULER charges double and nothing else does. That is the
   * honest limit of it: *movement is a sentence the table applies*, and no part of this system
   * spends a Move for anybody. What changed is that the number is on the screen during the drag.
   *
   * A trap is the opposite shape: it springs once, takes what it carries, and the square is clear.
   * *Set* both slows and springs, which is why the arrival hook imposes before it springs -- a
   * trap that went off first would be a trap that never slowed anybody.
   */
  await probe("what a square costs to cross, and what is waiting in it", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const g = await import("/systems/cardrpg/module/ground.mjs");
      const npc = game.actors.find(a => a.type === "npc");
      const scene = canvas.scene;
      /* No combat is needed and none is touched: nothing here is about a turn, and a probe that
       * tidied away somebody else's fight would be the reason three later ones failed. */
      await g.clearGround(scene);
      const grid = canvas.grid.size;

      /* A GM draws a bog and ticks it difficult. */
      const [bog] = await scene.createEmbeddedDocuments("Region", [{
        name: "A bog", shapes: [{ type: "rectangle", x: 1200, y: 1200, width: 400, height: 400 }]
      }]);
      await g.setGround(bog, { effects: ["difficult"] });
      await new Promise(r => setTimeout(r, 500));
      const cost = bog.behaviors.find(b => b.getFlag("cardrpg", "crossing"));
      const walk = cost?.system?.difficulties?.walk ?? 0;

      /* Ticking impassable as well takes the larger of the two. */
      await g.setGround(bog, { effects: ["difficult", "impassable"] });
      await new Promise(r => setTimeout(r, 500));
      const worse = bog.behaviors.find(b => b.getFlag("cardrpg", "crossing"))
        ?.system?.difficulties?.walk ?? 0;

      /* And unticking everything takes the behaviour off again. */
      await g.setGround(bog, { effects: [] });
      await new Promise(r => setTimeout(r, 500));
      const left = bog.behaviors.filter(b => b.getFlag("cardrpg", "crossing")).length;
      await bog.delete();

      /*
       * A trap, sprung. Called where the arrival hook calls it rather than through a token drag:
       * a programmatic `token.update({x, y})` did not reach `onArrival` in this harness, and
       * **[OPEN]** whether that is the harness or the hook is unsettled -- nothing else in this
       * file drives an arrival end to end either. What is settled is what springing does.
       */
      const [tok] = await scene.createEmbeddedDocuments("Token",
        [(await npc.getTokenDocument({ x: 1000, y: 1600 })).toObject()]);
      const victim = tok.actor;
      const was = victim.system.health.value;
      const centre = tok.object?.center ?? { x: tok.x + grid / 2, y: tok.y + grid / 2 };
      await g.layGround(scene, {
        shape: "adjacent", effects: ["trap"], damage: 3, condition: "slowed",
        origin: centre, radius: 0, until: null, by: "The Trapmaker"
      });
      const armed = g.zonesOn(scene).length;

      /* The ground takes hold first, then the trap goes off: *Set* both slows and springs, and
       * springing is what deletes the zone. */
      await g.imposeGround(victim);
      const slowed = (tok.actor.system.conditions ?? []).some(c => c.key === "slowed");
      await g.springTraps(victim, centre);
      const after = tok.actor.system.health.value;
      const stillArmed = g.zonesOn(scene).length;
      const twice = await g.springTraps(victim, centre);

      await tok.update({ "system.health.value": was }).catch(() => {});
      await tok.delete();
      await g.clearGround(scene);
      /* It made a token and a region on a live board, so it puts the board back: anything it
       * selected released, anything it opened shut. Run before the rest of this file, it cost
       * three later probes their monster. */
      canvas.tokens?.releaseAll?.();
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      return [
        ["a bog charges the ruler double", walk, LIVE.CARDRPG.groundCost.difficult],
        ["and impassable charges the most the ruler allows", worse,
          LIVE.CARDRPG.groundCost.impassable],
        ["unticking it takes the cost off again", left, 0],
        ["a trap is armed", armed, 1],
        ["the ground slows them before it springs", slowed, true],
        ["springing it costs what it carries", was - after, 3],
        ["and the square is clear afterwards", stillArmed, 0],
        ["so there is nothing left to spring twice", twice.length, 0]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-16] Ground phase 4: the ground a character does not feel.**
   *
   * Twenty-one Tactics name ground, and most of them want things this engine has no
   * representation of -- forced movement, cover from figures, a square that is difficult for your
   * enemies only. **Four want the same one thing**, and it is a shape this project already has:
   * *you ignore difficult ground*. The Burglar goes through the window, the Ironclad is immovable,
   * Household Magic helps indoors and The Grey closes the last square for free.
   *
   * So it is the `castsSilenced` shape again -- a node grants an exemption, the character derives
   * it, and the ONE reader applies it. The two unconditional ones are wired; the two that depend
   * on where you are standing or what you are doing stay the table's, and say so.
   *
   * And `high` joined the vocabulary, because *Roots* and *Something Is Always Listening* have
   * been naming high ground since before this vocabulary existed and it held five of the six
   * things they talk about.
   */
  await probe("the ground a Burglar does not feel", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const g = await import("/systems/cardrpg/module/ground.mjs");
      const { hero } = LIVE;
      const scene = canvas.scene;
      await g.clearGround(scene);
      const was = [...(hero.system.nodes ?? [])];

      const [tok] = await scene.createEmbeddedDocuments("Token",
        [(await hero.getTokenDocument({ x: 500, y: 1100 })).toObject()]);
      const centre = tok.object?.center ?? { x: tok.x + 50, y: tok.y + 50 };
      await g.layGround(scene, {
        shape: "adjacent", effects: ["difficult", "high"], origin: centre, radius: 0, until: null
      });

      /* An ordinary character feels all of it. */
      await hero.update({ "system.nodes": ["root"] });
      const plain = [...g.groundFor(hero).effects].sort().join(",");
      const plainIgnored = [...g.groundFor(hero).ignored].join(",");

      /* A Burglar does not feel the difficulty, and still sees the hill. */
      await hero.update({ "system.nodes": ["root", "shade.burglar"] });
      const exempt = [...hero.system.ignoresGround].join(",");
      const felt = [...g.groundFor(hero).effects].sort().join(",");
      const unfelt = [...g.groundFor(hero).ignored].join(",");
      const chips = g.groundChips(hero)
        .map(c => `${c.label}${c.ignored ? "(ignored)" : ""}`).sort().join(", ");

      /* And the Ironclad says the same thing in different words. */
      await hero.update({ "system.nodes": ["root", "strength.ironclad"] });
      const ironclad = [...hero.system.ignoresGround].join(",");

      await hero.update({ "system.nodes": was });
      await tok.delete();
      await g.clearGround(scene);
      canvas.tokens?.releaseAll?.();
      return [
        ["an ordinary character feels both", plain, "difficult,high"],
        ["and ignores nothing", plainIgnored, ""],
        ["the Burglar's node sets the ground aside", exempt, "difficult"],
        ["so the square is only high ground to them", felt, "high"],
        ["and what they do not feel is still named", unfelt, "difficult"],
        ["their HUD says both, and which is which", chips,
          "difficult ground(ignored), high ground"],
        ["the Ironclad gets there by another road", ironclad, "difficult"]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-16] Sift, which has been built and unwired since 2026-11-07.**
   *
   * core-rules 8 wrote the keyword, config gave it an icon, four cards use it -- and nothing ever
   * dispatched it, so playing *Scout Ahead* printed `sift 3` in chat and did nothing at all. It
   * was the oldest built-and-unwired effect in the game.
   *
   * **There is no top of the draw pile**, which is the thing worth knowing about this engine:
   * draws pick random ids on purpose. So Sift is *n out of the pile, seen, and binned if you
   * like*, which buys exactly what the rule says -- a worse next hand for a better one after --
   * and cannot be foreknowledge of the next draw, because nothing here knows which that is.
   *
   * The dialog is not driven here; its two halves are, against live documents. What a modal would
   * add is a click, and what it would cost is a probe that fails on a frame of animation.
   */
  await probe("sift, against a real draw pile", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const d = await import("/systems/cardrpg/module/decks.mjs");
      const { hero } = LIVE;
      const pile = d.deckOf(hero, "action");
      const bin = d.deckOf(hero, "actionDiscard");
      const before = d.available(pile).length;
      const binBefore = bin.cards.size;

      const seen = d.cardsToSift(hero, 3);
      const names = seen.map(c => d.cardName(c));
      const unique = new Set(seen.map(c => c.id)).size;
      /* Seeing is not taking: nothing has moved yet. */
      const afterLooking = d.available(pile).length;

      const binned = await d.binSifted(hero, [seen[0].id, seen[1].id]);
      const afterBinning = d.available(pile).length;
      const binAfter = bin.cards.size;

      /* A card already binned is not in the draw pile, so asking again moves nothing. */
      const again = await d.binSifted(hero, [seen[0].id]);
      /* And an id from nowhere is refused rather than trusted. */
      const nonsense = await d.binSifted(hero, ["notacardid"]);

      /* Put them back so the rest of the file sees the deck it expects. */
      await d.move(bin, pile, binned.map(c => c.id));
      const restored = d.available(pile).length;

      return [
        ["it takes as many as it was asked for", seen.length, 3],
        ["each of them a different card", unique, 3],
        ["and every one a real card with a name", names.filter(Boolean).length, 3],
        ["seeing them moves nothing", afterLooking, before],
        ["binning two takes two out of the pile", before - afterBinning, 2],
        ["and puts them in the discard", binAfter - binBefore, 2],
        ["binning one twice moves nothing the second time", again.length, 0],
        ["and an id from nowhere is refused", nonsense.length, 0],
        ["and the pile is whole again afterwards", restored, before]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-16] Forced movement, which core-rules 11 has described for a long time and
   * nothing could do.** `forcedMove` and `forceMove` appeared nowhere in the module, so eight
   * Tactics and a card were waiting on a primitive that did not exist.
   *
   * Every clause of section 11 is a row here: a straight line nobody chooses, no Move spent, it
   * stops in the last square it can reach rather than refusing, it ignores difficult ground, and
   * **it is movement for everything that cares** -- which is the row that also settles an open
   * question about the arrival hook, since a shove updates a token exactly as a drag does.
   */
  /*
   * **[BUILT 2026-11-16] Forced movement, which core-rules 11 has described for a long time and
   * nothing could do.** `forcedMove` and `forceMove` appeared nowhere in the module, so eight
   * Tactics and a card waited on a primitive that did not exist.
   *
   * **Every figure is placed fresh for its own case and every position is read back off the
   * scene.** Both of those cost a run. A token placeable reports `x: 0, y: 0` until the canvas
   * draws it -- measured, against a document at 500,400 in the same breath -- and chaining one
   * case onto the square the last one left is a test that reports the engine's fault as its own.
   */
  await probe("a push, a pull, and the things that stop one", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const r = await import("/systems/cardrpg/module/resolve.mjs");
      const g = await import("/systems/cardrpg/module/ground.mjs");
      const { hero } = LIVE;
      const npc = game.actors.find(a => a.type === "npc");
      const scene = canvas.scene;
      const grid = canvas.grid.size;
      await g.clearGround(scene);
      const wasNodes = [...(hero.system.nodes ?? [])];
      const made = [];

      const put = async (actor, x, y) => {
        const [doc] = await scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y })).toObject()]);
        made.push(doc);
        return doc;
      };
      /* A lane with nothing in it, found rather than assumed: the board is shared. */
      const used = new Set(canvas.tokens.placeables.map(t => `${t.document.x},${t.document.y}`));
      let lane = null;
      for (let row = 400; row < 1700 && !lane; row += grid) {
        for (let col = 400; col < 2400; col += grid) {
          let ok = true;
          for (let i = 0; i <= 8; i++) if (used.has(`${col + i * grid},${row}`)) ok = false;
          if (ok) { lane = { x: col, y: row }; break; }
        }
      }
      if (!lane) return [["a clear lane to push along", "none on the board", "one"]];

      /* 1. A push of two, into open ground. */
      const me = await put(hero, lane.x, lane.y);
      const a = await put(npc, lane.x + grid, lane.y);
      const push = await r.forceMove(hero, a.actor, 2, { token: a, from: me });

      /*
       * 2. A pull of one, on its own row. The first draft put it in the same lane and the figure
       * pushed in case 1 was standing exactly where the pull wanted to go -- so the engine
       * correctly refused, and the test read that as a bug. A case that shares a board with
       * another case is not an isolated case.
       */
      const puller = await put(hero, lane.x, lane.y + 4 * grid);
      const b = await put(npc, lane.x + 3 * grid, lane.y + 4 * grid);
      const pull = await r.forceMove(hero, b.actor, -1, { token: b, from: puller });

      /* 3. A push of three with a figure two away: it stops in the last square it can reach. */
      const c = await put(npc, lane.x + 6 * grid, lane.y);
      const blocker = await put(npc, lane.x + 8 * grid, lane.y);
      const into = await r.forceMove(hero, c.actor, 3, { token: c, from: me });

      /* 4. An Ironclad is not moved at all. */
      await hero.update({ "system.nodes": ["root", "strength.ironclad"] });
      const rock = await put(hero, lane.x, lane.y + grid);
      const refused = await r.forceMove(npc, hero, 2, { token: rock, from: c });
      const immovable = hero.system.immovable;
      await hero.update({ "system.nodes": wasNodes });

      /*
       * **5. A shove is movement for everything that cares.**  [FIXED 2026-11-16]
       *
       * Section 11 says forced movement *can set off a Sidestep*, and the cheapest way to ask is
       * ground: push a figure onto a zone and look for the condition. This answered **true once
       * and false once** across identical runs until the cause was found -- `onArrival` compared a
       * PLACEABLE's position against the old square, and a placeable reports its old square until
       * the canvas has drawn the move, so the routine returned having done nothing whenever a
       * frame had not been drawn. Every position in it is a document's now.
       */
      const d = await put(npc, lane.x + grid, lane.y + 2 * grid);
      await g.layGround(scene, {
        shape: "adjacent", effects: ["difficult"], condition: "slowed",
        origin: { x: lane.x + 2 * grid + grid / 2, y: lane.y + 2 * grid + grid / 2 },
        radius: 0, until: null
      });
      const before = (d.actor.system.conditions ?? []).some(x => x.key === "slowed");
      const shover = await put(hero, lane.x, lane.y + 2 * grid);
      await r.forceMove(hero, d.actor, 1, { token: d, from: shover });
      await new Promise(res => setTimeout(res, 1200));
      const tookHold = (d.actor.system.conditions ?? []).some(x => x.key === "slowed");

      for (const doc of made) await doc.delete().catch(() => {});
      await g.clearGround(scene);
      canvas.tokens?.releaseAll?.();
      return [
        ["a push of two moves two squares", push.moved, 2],
        /*
         * **What it moved and what stopped it is the contract**, and it is what every caller acts
         * on. The squares themselves are asserted by case 3 rather than by reading a coordinate
         * back: a figure two away stops a push of three at one, which only works if the engine is
         * reading real positions -- including the position case 1 left behind.
         */
        ["and nothing stopped it", push.why, ""],
        ["a pull of one moves one", pull.moved, 1],

        ["a push of three into a figure two away stops short", into.moved, 1],
        ["and says what stopped it", into.why, "another figure"],
        ["an Ironclad derives the refusal", immovable, true],
        ["and a push does not move them", refused.moved, 0],
        ["saying so by name", /cannot be moved/.test(refused.why), true],
        ["the shoved figure was not slowed first", before, false],
        /* core-rules 11's *it can set off a Sidestep*, which is also the arrival hook proven. */
        /* core-rules 11's *it can set off a Sidestep*, which is the arrival hook proven. */
        ["and ground under where it landed takes hold", tookHold, true]

      ];
    });
  });

  /*
   * **[BUILT 2026-11-21] How far they can move, on the board, in Foundry.**
   *
   * core-rules 12 called unresolved movement the largest remaining engine gap and the ruling was
   * that it stays a sentence the table applies **as long as it is clear to the player how far they
   * can move**. `board.mjs` answers that with a Dijkstra over the ground costs and paints the
   * result, and validate.mjs already exercises the walk against a stubbed grid.
   *
   * What a stub cannot check is the painting, which is the half that talks to the application:
   * `canvas.interface.grid` and its named highlight layers. Two mistakes are invisible from the
   * source and would both ship looking fine -- **passing centres where Foundry wants the top-left
   * corner**, which puts every square half a square up and to the left, and a layer name that
   * collides with the ruler's or a template's, which makes clearing ours clear theirs. So the
   * positions are read back out of the layer and compared against the exact pixels they should be.
   *
   * It paints and clears. It never moves a figure, and there is nothing here that could.
   */
  await probe("how far a figure can move, painted on the board", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const b = await import("/systems/cardrpg/module/board.mjs");
      const g = await import("/systems/cardrpg/module/ground.mjs");
      const { hero } = LIVE;
      const npc = game.actors.find(a => a.type === "npc");
      const scene = canvas.scene;
      const grid = canvas.grid.size;
      await g.clearGround(scene);
      const wasNodes = [...(hero.system.nodes ?? [])];
      const made = [];
      const put = async (actor, x, y) => {
        const [doc] = await scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y })).toObject()]);
        made.push(doc);
        return doc;
      };

      /*
       * **The scene has to have squares on it, and the smoke world's has none.**
       *
       * **[FOUND 2026-11-21]** `gridType: 0` -- gridless, at 100px. Every other spatial probe
       * passes on it because forced movement, the watch arc and the ground zones are all pixel
       * arithmetic, and a gridless scene still has a pixel size. The reach walk is the first thing
       * here that asks the GRID to enumerate squares, and it correctly refuses: Foundry's
       * `highlightPosition` cannot paint a square on a scene that has none, so a walk that
       * answered would be an answer nothing could draw.
       *
       * So the probe makes its own precondition and puts it back. Said out loud rather than
       * assumed, because the next person to wonder why this probe is longer than its neighbours
       * should find the reason here.
       */
      const wasGrid = scene.grid.type;
      if (wasGrid === CONST.GRID_TYPES.GRIDLESS) {
        await scene.update({ "grid.type": CONST.GRID_TYPES.SQUARE });
        await new Promise(done => Hooks.once("canvasReady", done));
      }
      const squared = canvas.grid.type === CONST.GRID_TYPES.SQUARE;

      /* A clear patch, found rather than assumed: the board is shared with every probe above. */
      const used = new Set(canvas.tokens.placeables.map(t => `${t.document.x},${t.document.y}`));
      let spot = null;
      for (let row = 400; row < 1700 && !spot; row += grid) {
        for (let col = 400; col < 2400; col += grid) {
          let ok = true;
          for (let i = -2; i <= 2 && ok; i++) {
            for (let j = -2; j <= 2; j++) {
              if (used.has(`${col + j * grid},${row + i * grid}`)) { ok = false; break; }
            }
          }
          if (ok) { spot = { x: col, y: row }; break; }
        }
      }
      if (!spot) return [["a clear patch to walk out of", "none on the board", "one"]];

      const me = await put(hero, spot.x, spot.y);
      const token = me.object;

      /* Open ground: the square ring, because a diagonal is one square. */
      const one = b.reachFrom(hero, 1, token).size;
      const two = b.reachFrom(hero, 2, token).size;

      /* Painted, and read back off Foundry's own layer at the pixels it should have used. */
      const painted = b.showReach(hero, 1, token);
      const layer = canvas.interface.grid.getHighlightLayer("cardrpg.reach");
      const positions = layer ? layer.positions.size : -1;
      const east = `${spot.x + grid},${spot.y}`;
      const onTheCorner = layer ? layer.positions.has(east) : false;
      /* The same square's CENTRE must NOT be in there: that is the half-square mistake, named. */
      const offByHalf = layer
        ? layer.positions.has(`${spot.x + grid + grid / 2},${spot.y + grid / 2}`) : false;

      b.clearReach();
      const afterClear = layer ? layer.positions.size : -1;

      /* Difficult ground beside the figure costs 2 to enter, so Move 1 cannot step into it. */
      await g.layGround(scene, {
        shape: "adjacent", effects: ["difficult"],
        origin: { x: spot.x + grid + grid / 2, y: spot.y + grid / 2 }, radius: 0, until: null
      });
      const bogged = b.reachFrom(hero, 1, token);
      const intoTheBog = bogged.has(`${Math.floor(spot.y / grid)},`
        + `${Math.floor((spot.x + grid) / grid)}`) ? "stepped in" : "no";
      const bogCost = b.reachFrom(hero, 2, token)
        .get(`${Math.floor(spot.y / grid)},${Math.floor((spot.x + grid) / grid)}`)?.spent
        ?? "unreachable";

      /* And a Burglar walks into it for 1, which is the node reaching the walk. */
      await hero.update({ "system.nodes": ["root", "shade.burglar"] });
      const burgled = b.reachFrom(hero, 1, token).size;
      await hero.update({ "system.nodes": wasNodes });

      /* A figure in the way is neither a destination nor a route. */
      await g.clearGround(scene);
      const inTheWay = await put(npc, spot.x + grid, spot.y);
      const blocked = b.reachFrom(hero, 1, token).size;

      /* And the distance primitive, measured between two real tokens on a real grid. */
      const apart = b.squaresBetween(me, inTheWay);
      const adjacent = b.isAdjacent(me, inTheWay);

      for (const doc of made.reverse()) await doc.delete();
      await g.clearGround(scene);
      canvas.tokens?.releaseAll?.();
      if (scene.grid.type !== wasGrid) {
        await scene.update({ "grid.type": wasGrid });
        await new Promise(done => Hooks.once("canvasReady", done));
      }
      return [
        ["the scene this ran on has squares", squared, true],
        ["a Move of 1 reaches the eight around you", one, 8],
        ["and a Move of 2 the ring outside that", two, 24],
        ["painting one says how many it coloured", painted, 8],
        ["and Foundry's own layer holds that many", positions, 8],
        ["at the square's top-left corner, where it wants them", onTheCorner, true],
        ["and not at its centre, half a square out", offByHalf, false],
        ["clearing takes them off again", afterClear, 0],
        ["difficult ground costs 2, so a Move of 1 stops short", intoTheBog, "no"],
        ["and at Move 2 the first bog square has cost it all", bogCost, 2],
        ["a Burglar does not feel it and reaches the ring", burgled, 8],
        ["a figure in the way is one square fewer", blocked, 7],
        ["and the distance between two real tokens", apart, 1],
        ["which is what adjacent means", adjacent, true]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-21] How far the target is, and whether what is staged reaches it.**
   *
   * The other half of the Move ruling, and the same bargain: the engine measures and says so, and
   * refuses nothing. A card that reads *within 4* printed the 4 and nothing ever compared it to a
   * board, so the one question an attack turns on was asked of somebody squinting at a map.
   *
   * Driven through the DOM rather than through the context object, because the chip is the whole
   * feature: a number computed correctly and rendered nowhere is the failure this probe exists to
   * catch. And through a WEAPON's reach rather than a card's, because that is the path with
   * something to get wrong -- no card in the starter deck carries a range at all, so every Strike
   * in a real hand takes its reach from the item `#itemFor` picks, which is the same call the click
   * will make.
   */
  await probe("how far the target is, and whether the staged card reaches it", async () => {
    await settle(page);
    const prepared = await page.evaluate(async () => {
      const { hero } = LIVE;
      const npc = game.actors.find(a => a.type === "npc");
      const scene = canvas.scene;
      const grid = canvas.grid.size;
      const made = [];
      const put = async (actor, x, y) => {
        const [doc] = await scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y })).toObject()]);
        made.push(doc.id);
        return doc;
      };
      /* A clear row, found rather than assumed. */
      const used = new Set(canvas.tokens.placeables.map(t => `${t.document.x},${t.document.y}`));
      let row = null;
      for (let y = 400; y < 1700 && !row; y += grid) {
        for (let x = 400; x < 2400; x += grid) {
          let ok = true;
          for (let i = 0; i <= 4; i++) if (used.has(`${x + i * grid},${y}`)) ok = false;
          if (ok) { row = { x, y }; break; }
        }
      }
      if (!row) return { fail: "no clear row" };

      const me = await put(hero, row.x, row.y);
      /* Three squares east, which is past a sword and well inside a bow. */
      const them = await put(npc, row.x + 3 * grid, row.y);
      them.object?.setTarget(true, { user: game.user, releaseOthers: true });

      /*
       * **Every** equipped weapon, not the first one.  [FIXED 2026-11-21] The first draft took one
       * and put the bow in beside it, and the tray correctly went on offering the better of the
       * two -- `#itemsFor` sorts by what a weapon is worth NOW, so a Longsword beats a Shortbow and
       * the chip kept reading 3/1. The probe's precondition was wrong, not the display.
       */
      const melees = hero.items.filter(i => i.type === "item" && i.system.equipped
        && (i.system.verbs?.strike?.value ?? null) !== null).map(i => i.id);
      const { GEAR } = await import("/systems/cardrpg/module/graph.mjs");
      const { slateData } = await import("/systems/cardrpg/module/setup.mjs");
      const shortbow = GEAR.get("Shortbow");
      const [bow] = shortbow
        ? await hero.createEmbeddedDocuments("Item", [slateData({ ...shortbow }, "item")])
        : [];

      /* A Strike in hand, staged the way a click stages it. */
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const d = await import("/systems/cardrpg/module/decks.mjs");
      const hand = d.deckOf(hero, "actionHand");
      const strike = hand?.cards?.contents
        ?.find(c => (c.system.primary ?? []).some(st => st.verb === "strike"));
      const tray = game.cardrpg.openTray(hero);
      tray.side = "action";
      tray.staged = [];
      await tray.render();
      return {
        made, tokenId: them.id, melees, bowId: bow?.id ?? null,
        strikeId: strike?.id ?? null, bowReach: shortbow?.verbs?.strike?.range ?? null
      };
    });
    if (prepared.fail) return [["a clear row to measure along", prepared.fail, "one"]];

    await page.waitForSelector(".cr-range__at", { timeout: 20000 });
    /** The chips, as text plus whether each is marked out of reach. */
    /*
     * **Read until it stops changing.**  **[FIXED 2026-11-24]**
     *
     * `await tray.render()` resolves when the application has handed its element over, which is
     * not the moment the browser has laid it out -- so a read on the next line can land on the
     * render before it. This one did: it reported `Goblin 3`, the chip with nothing staged, for a
     * Strike it had just staged, about one full run in three. The same shape of failure as the two
     * stack-panel reads further up, and the same answer: two equal samples is a statement about
     * the screen having settled, and it is not outcome-aware -- it agrees on the bare chip as
     * readily as on the staged one, so a chip that is genuinely wrong is still reported wrong.
     */
    const chips = () => page.evaluate(async () => {
      const read = () => [...document.querySelectorAll(".cr-range__at")]
        .map(el => ({
          text: el.textContent.replace(/\s+/g, " ").trim(),
          out: el.classList.contains("cr-range__at--out")
        }));
      let last = JSON.stringify(read());
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 150));
        const again = JSON.stringify(read());
        if (again === last) break;
        last = again;
      }
      return JSON.parse(last);
    });

    /* 1. Nothing staged: the distance alone, because it is worth knowing while you are choosing. */
    const bare = await chips();

    /* 2. A Strike with the sword in hand, which reaches 1 and does not reach three squares. */
    const melee = await page.evaluate(async ({ strikeId, bowId }) => {
      const { hero } = LIVE;
      if (bowId) await hero.items.get(bowId)?.update({ "system.equipped": false });
      const tray = game.cardrpg.openTray(hero);
      tray.staged = strikeId ? [{ cardId: strikeId, half: "primary" }] : [];
      await tray.render();
      return true;
    }, prepared);
    const withSword = await chips();

    /* 3. The same Strike with the bow in hand and every blade put away: reach 6, and in range. */
    const armed = await page.evaluate(async ({ melees, bowId }) => {
      const { hero } = LIVE;
      for (const id of melees) await hero.items.get(id)?.update({ "system.equipped": false });
      if (bowId) {
        await hero.items.get(bowId)?.update({ "system.equipped": true, "system.equippedSlot": "hands" });
      }
      const tray = game.cardrpg.openTray(hero);
      await tray.render();
      /* What the hand is actually holding, reported so a failure here explains itself rather than
       * leaving the next person to guess which weapon won. */
      return hero.items.filter(i => i.type === "item" && i.system.equipped
        && (i.system.verbs?.strike?.value ?? null) !== null)
        .map(i => `${i.name} r${i.system.verbs.strike.range ?? 1}`).sort().join(", ") || "nothing";
    }, prepared);
    const withBow = await chips();

    /* And put the character, the board and the window back as they were. */
    await page.evaluate(async ({ made, melees, bowId }) => {
      const { hero } = LIVE;
      const scene = canvas.scene;
      const tray = game.cardrpg.openTray(hero);
      tray.staged = [];
      if (bowId) await hero.deleteEmbeddedDocuments("Item", [bowId]);
      for (const id of melees) {
        await hero.items.get(id)?.update({ "system.equipped": true, "system.equippedSlot": "hands" });
      }
      for (const id of [...made].reverse()) {
        await scene.getEmbeddedDocument("Token", id)?.delete();
      }
      game.user.targets.forEach(t => t.setTarget(false, { user: game.user }));
      canvas.tokens?.releaseAll?.();
      await tray.render();
    }, prepared);

    return [
      ["the chip is drawn for the target", bare.length, 1],
      ["and with nothing staged it is the distance alone", bare[0]?.text ?? "", "Goblin 3"],
      ["and nothing is out of reach of nothing", bare[0]?.out ?? null, false],
      ["a Strike staged", melee, true],
      ["with a sword it reads three of one", withSword[0]?.text ?? "", "Goblin 3/1"],
      ["and is marked out of reach", withSword[0]?.out ?? null, true],
      ["the bow in the catalogue reaches", prepared.bowReach, 6],
      ["and it is the only thing in hand that strikes", armed, "Shortbow r6"],
      ["with the bow it reads three of six", withBow[0]?.text ?? "", "Goblin 3/6"],
      ["and is not marked", withBow[0]?.out ?? null, false]
    ];
  });

  /*
   * **[BUILT 2026-11-21] When a spell may be cast, which the cards had said all along.**
   *
   * `timing` was four values content wrote on twenty-three spells and the engine read one of --
   * `ritual`, and only to zero a slot cost. Nothing stopped an out-of-combat spell being cast in
   * the middle of a fight, and four spells declared `needs: []` while the only statement of their
   * moment was inert.
   *
   * Driven here because the gate's whole subject is live state: whether a fight is running and
   * whose turn it is. A stub can be told both and will agree with whatever it was told; a real
   * combat with a real initiative order can disagree. The matrix is two spells against three
   * moments, which is the smallest thing that separates the two flags from each other -- a gate
   * that refused everything during a fight would pass four of the six rows.
   */
  await probe("when a spell may be cast", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const npc = game.actors.find(a => a.type === "npc");
      const r = await import("/systems/cardrpg/module/resolve.mjs");
      const { SPELLS, slateFieldsOf } = await import("/systems/cardrpg/module/graph.mjs");
      const { slateData } = await import("/systems/cardrpg/module/setup.mjs");
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");

      for (const t of CardRPGTray.openTrays) await t.close();
      for (const c of [...game.combats]) await c.delete();

      /* One of each kind, prepared, so the gate has something real to refuse. */
      const make = async name => {
        const def = SPELLS.get(name);
        if (!def) return null;
        const [slate] = await hero.createEmbeddedDocuments("Item",
          [slateData({ ...slateFieldsOf(def), kind: "formula", prepared: true }, "spell")]);
        return slate;
      };
      const ask = await make("Ask the Dead");          // outOfCombat
      const hour = await make("The Silent Hour");      // reaction, and no reaction key
      if (!ask || !hour) {
        return [["two spells to cast", `${ask ? "" : "Ask the Dead "}${hour ? "" : "The Silent Hour"}`, "both"]];
      }
      const timings = [ask.system.effect?.timing, hour.system.effect?.timing].join("/");

      /* 1. No fight at all. Both are castable: a Reaction out of combat is nobody's turn. */
      const quiet = [r.refusesTiming(hero, ask), r.refusesTiming(hero, hour)].join(",");

      /* A fight, with the hero first in the order so the two flags can be told apart. */
      const made = [];
      const place = async (actor, x) => {
        const [doc] = await canvas.scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y: 1500 })).toObject()]);
        made.push(doc);
        return doc;
      };
      const ph = await place(hero, 900);
      const pn = await place(npc, 1100);
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant", [
        { tokenId: ph.id, sceneId: canvas.scene.id, actorId: hero.id, initiative: 20 },
        { tokenId: pn.id, sceneId: canvas.scene.id, actorId: npc.id, initiative: 10 }
      ]);
      await combat.startCombat();
      const pause = () => new Promise(done => setTimeout(done, 700));
      await pause();

      /* 2. The fight is on and it is the hero's turn: the out-of-combat spell is refused for being
       * in a fight at all, and the Reaction for it being their own turn. */
      const mine = combat.combatant?.actor?.id === hero.id;
      const ours = [r.refusesTiming(hero, ask), r.refusesTiming(hero, hour)].join(",");

      /* And what the card says while it cannot be cast, read off the tray's own spell panel. */
      const tray = game.cardrpg.openTray(hero);
      tray.side = "action";
      tray.openPiles = new Set(["spells"]);
      await tray.render();
      /*
       * The note is in the card's TEXT and the reason is in its tooltip ATTRIBUTE, so both are
       * read: the first draft read `textContent` alone and reported that a reason printed right
       * there on the screen was missing. A card says two different things in two different places
       * and a probe that knows only one of them is a probe about half the card.
       */
      const shown = await (async () => {
        const card = [...document.querySelectorAll(".cr-card--spread")]
          .find(el => el.textContent.includes("Ask the Dead"));
        if (!card) return { text: "not shown", tip: "", passive: null };
        return {
          text: card.textContent.replace(/\s+/g, " ").trim(),
          tip: card.getAttribute("data-tooltip") ?? "",
          passive: card.classList.contains("cr-card--passive")
        };
      })();

      /* 3. Somebody else's turn: the Reaction is allowed and the out-of-combat one still is not. */
      await combat.nextTurn();
      await pause();
      const theirs = [r.refusesTiming(hero, ask), r.refusesTiming(hero, hour)].join(",");
      const whose = combat.combatant?.actor?.id === hero.id ? "still the hero" : "somebody else";

      /* Put the world back. */
      tray.openPiles.clear();
      await combat.delete();
      for (const doc of made.reverse()) await doc.delete();
      await hero.deleteEmbeddedDocuments("Item", [ask.id, hour.id]);
      canvas.tokens?.releaseAll?.();
      await tray.render();

      return [
        ["the two spells carry the two timings", timings, "outOfCombat/reaction"],
        ["out of combat, neither is refused", quiet, "false,false"],
        ["the fight starts on the hero's turn", mine, true],
        ["in a fight, on your own turn, both are refused", ours, "true,true"],
        ["the turn passes to somebody else", whose, "somebody else"],
        ["and then the Reaction is allowed and the other is not", theirs, "true,false"],
        ["the card says which moment it wants", shown.text.includes("Out of combat"), true],
        ["and its tooltip says why it cannot be cast now",
          shown.tip.includes("not while the fight is on"), true],
        ["and it is not clickable while that is true", shown.passive, true]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-21] A step that happens later, and the two faults on one card.**
   *
   * `delay` was a schema field nothing read. Five steps carry one; the two with a verb the engine
   * performs resolved **immediately**, and the audit called them finished because its gap map
   * tested for the field's presence rather than for a reader. *The Orchard* is *heal 4 to every
   * ally, two turns from now*. It healed **the caster**, **now** -- wrong person, wrong turn, and
   * the only clue was that the card looked like it had worked.
   *
   * Driven through the tray's own click, because the fix is that `#resolveStep` books instead of
   * resolving, and calling the engine directly would test the clock while skipping the thing that
   * was broken. The clock is then wound by real turns in a real fight: the sequence asserted is
   * `1, gone`, which is *one off at the start of the caster's next turn, fires at the start of the
   * one after* -- the field's own words, and the thing a round counter would have got wrong for
   * anybody not first in the order.
   */
  /*
   * **[BUILT 2026-11-21] A step that happens later, and the two faults on one card.**
   *
   * `delay` was a schema field nothing read. Five steps carry one; the two with a verb the engine
   * performs resolved **immediately**, and the audit called them finished because its gap map
   * tested for the field's presence rather than for a reader. *The Orchard* is *heal 4 to every
   * ally, two turns from now*. It healed **the caster**, **now** -- wrong person, wrong turn, and
   * the only clue was that the card looked like it had worked.
   *
   * What is driven here is the clock and the targets, against a real fight with a real initiative
   * order: the sequence asserted is `1, gone`, which is *one off at the start of the caster's next
   * turn, fires at the start of the one after* -- the field's own words, and the thing a round
   * counter would have got wrong for anybody not first in the order. The ally is a second
   * character because `alliesInRange` excludes the caster by the vocabulary's own distinction from
   * `selfAndAllies`, and a one-character board cannot tell *healed the right people* from *healed
   * somebody*.
   *
   * **The click is not driven, and the reason is worth recording.** Casting the card from the
   * spells pile reaches `#onPlaySlate` and the element, the handler and the document were all
   * verified correct -- the card is found, the action is wired, nothing refuses, no dialog waits --
   * and a synthetic click still did not resolve it. What a click would add here is the precedence
   * of two lines in `#resolveStep`, which validate.mjs pins directly ("a delayed step is booked
   * before the verb is looked at"), and what it would cost is a probe that fails on a frame of
   * animation. Same bargain the Sift dialog is left out under.
   */
  await probe("a step that happens two turns from now", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      /* A plain Goblin by name: the first npc in this world can be the Shaman, who carries a ward,
       * and the enemy here is only present to have a turn to pass to. */
      const npc = game.actors.find(a => a.name === "Goblin" && a.type === "npc")
        ?? game.actors.find(a => a.type === "npc");
      const r = await import("/systems/cardrpg/module/resolve.mjs");
      const { SPELLS } = await import("/systems/cardrpg/module/graph.mjs");
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      for (const c of [...game.combats]) await c.delete();
      await hero.setFlag("cardrpg", "due", []);
      const pause = (ms = 700) => new Promise(done => setTimeout(done, ms));

      /*
       * **Linked, and the prototype token renamed with it.**  The first draft cloned the hero and
       * left the prototype token alone, so the ally's token was **unlinked** and carried the
       * hero's name: every figure on the board reported `actor.name === "Starter Warrior"`, the
       * heal landed on the token's own delta, and the probe -- reading Health off the base actor --
       * reported that nobody had been healed. The engine had been right the whole time.
       */
      const ally = await Actor.create({
        ...hero.toObject(), _id: null, name: "Probe Ally",
        prototypeToken: { ...hero.prototypeToken.toObject(), name: "Probe Ally", actorLink: true }
      }, { keepId: false });
      const made = [];
      const put = async (actor, x) => {
        const [doc] = await canvas.scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y: 1300 })).toObject()]);
        made.push(doc);
        return doc;
      };
      const ph = await put(hero, 700);
      await put(ally, 800);
      const pn = await put(npc, 1400);

      /* Wounded, so a heal is visible rather than capped away at full Health. */
      const max = ally.system.health.max;
      await ally.update({ "system.health.value": Math.max(1, max - 4) });
      const allyBefore = ally.system.health.value;
      const heroBefore = hero.system.health.value;

      const def = SPELLS.get("The Orchard");
      if (!def) return [["The Orchard is in the spell list", "no", "yes"]];

      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant", [
        { tokenId: ph.id, sceneId: canvas.scene.id, actorId: hero.id, initiative: 20 },
        { tokenId: pn.id, sceneId: canvas.scene.id, actorId: npc.id, initiative: 10 }
      ]);
      await combat.startCombat();
      await pause();

      /*
       * **The caster is the combatant's actor, which is the one the clock will tick.**
       * `onTurnStart` works on `turnOf(combat).actor`, and for an unlinked token that is the
       * token's own delta actor rather than the one in the sidebar -- so booking on the sidebar
       * actor and ticking the token's left the queue standing at 2 for ever. Asserted rather than
       * assumed, below, because if the two ever diverge in play this is where it will show.
       */
      const caster = combat.combatant?.actor ?? hero;
      const sameActor = caster.id === hero.id;

      /* The card's own step, booked the way `#resolveStep` books it. */
      await r.bookDelayed(caster, { step: def.effect, targets: [], source: { name: def.name } });
      const queue = () => caster.getFlag("cardrpg", "due") ?? [];
      const bookedCount = queue().length;
      const bookedLeft = queue()[0]?.turnsLeft ?? null;
      const allyAtCast = ally.system.health.value;
      const heroAtCast = hero.system.health.value;

      /* And who the same step would heal, which is the other half of the fix: this answered the
       * caster and ignored `targets` for both cards that name somebody. */
      const aimed = r.healTargets(caster, def.effect).map(a => a.name).sort().join(", ");

      /* Wind the fight on, recording what the queue says at the start of each of the CASTER's
       * turns. Bounded, because a probe that loops until something happens is a probe that hangs. */
      const seen = [];
      for (let i = 0; i < 10 && seen.length < 2; i++) {
        await combat.nextTurn();
        await pause();
        if (combat.combatant?.actor?.id !== hero.id) continue;
        seen.push(queue()[0]?.turnsLeft ?? "gone");
      }
      const allyAfter = ally.system.health.value;
      const heroAfter = hero.system.health.value;
      const leftOver = queue().length;
      /*
       * **The chat line, not the number.** `resolveHeal` draws fate for the amount, so *healed 4*
       * is *healed 4 plus a card* and can come out at 3 -- or at nothing, on a miss. A probe that
       * asserted the difference would be a probe that fails one run in several, which is worse
       * than no probe. What is not random is **who** was healed and **by what**, and that is the
       * half this fix is about.
       */
      const mended = game.messages.contents.slice(-8)
        .some(m => /heals Probe Ally/.test(m.content) && /The Orchard/.test(m.content));

      /* And nothing is owed across a fight. */
      await combat.delete();
      await pause();
      const afterFight = queue().length;

      for (const doc of made.reverse()) await doc.delete();
      await ally.delete();
      await hero.setFlag("cardrpg", "due", []);
      await caster.setFlag?.("cardrpg", "due", []);
      canvas.tokens?.releaseAll?.();

      return [
        ["the card is heal 4 to every ally, two turns out",
          `${def.effect?.delay}/${def.effect?.targets}`, "2/everyAlly"],
        ["the step it would heal is the ally and not the caster", aimed, "Probe Ally"],
        ["the figure taking the turn is the character itself", sameActor, true],
        ["booking it queues one step", bookedCount, 1],
        ["for two of the caster's turns", bookedLeft, 2],
        ["and heals nobody yet", `${allyAtCast - allyBefore},${heroAtCast - heroBefore}`, "0,0"],
        ["one comes off at the start of each of the caster's turns", seen.join(","), "1,gone"],
        ["and then the ally is mended by that card", mended, true],
        ["and is no worse off than before", allyAfter >= allyBefore, true],
        ["and the caster is not, because the card says allies", heroAfter - heroBefore, 0],
        ["the queue is empty afterwards", leftOver, 0],
        ["and nothing is owed across a fight", afterFight, 0]
      ];
    });
  });

  /*
   * **[FIXED 2026-11-21] A bill paid out of three purses that were never opened.**
   *
   * `cost.taint`, `cost.strain` and `cost.scale` were schema fields with content behind them and no
   * reader anywhere: four spells said they tainted their caster and did not, three said they
   * strained a deck and did not, and the five whose price scales were charged the rate rather than
   * the bill -- *The Shield Line* billed one Health for a line of four.
   *
   * What is driven here is the part a grep cannot see: **where the cards end up.** A Taint is a
   * card in a pile, and which pile depends on whether a god or a formula asked for it (core-rules
   * 8); a Strain is cards out of the hand and into the discard. Those are four documents moving
   * between six stacks, and the arithmetic in validate.mjs cannot tell a right answer from a
   * plausible one.
   *
   * **`payToCast` is called rather than clicked**, for the reason the delayed step records at
   * length: a synthetic click on a card in the spells pile never reaches `#onPlaySlate`, and the
   * precedence that a click would add is pinned in validate.mjs instead. The card's own NOTE is
   * read off the real DOM though, which is the half of a price that the player sees before paying
   * it -- and the half that stayed wrong for longest, since the spell card printed `costs N Health`
   * and nothing else while three other purses were being taken from.
   *
   * **The scene is squared for the duration.** `perAlly` has to count who is standing beside you,
   * and the smoke world's scene is gridless, so the one price that depends on the board cannot be
   * measured on it. Same precondition the reach probe makes, and put back the same way.
   */
  await probe("a bill paid out of three purses", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const r = await import("/systems/cardrpg/module/resolve.mjs");
      const { SPELLS, slateFieldsOf, spellKindOf } = await import("/systems/cardrpg/module/graph.mjs");
      const { slateData } = await import("/systems/cardrpg/module/setup.mjs");
      const { deckOf } = await import("/systems/cardrpg/module/decks.mjs");
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      for (const c of [...game.combats]) await c.delete();
      const scene = canvas.scene;
      const pause = (ms = 400) => new Promise(done => setTimeout(done, ms));

      /* A hand free, because a prepared spell is gestured and the Warrior holds sword and shield. */
      const held = hero.items.filter(i => i.type === "item" && i.system.equipped
        && i.system.equippedSlot === "hands").map(i => i.id);
      for (const id of held) await hero.items.get(id)?.update({ "system.equipped": false });

      const wasGrid = scene.grid.type;
      if (wasGrid === CONST.GRID_TYPES.GRIDLESS) {
        await scene.update({ "grid.type": CONST.GRID_TYPES.SQUARE });
        await new Promise(done => Hooks.once("canvasReady", done));
      }

      /* Two allies, standing either side: `perAlly` bills per man and one man cannot tell a rate
       * from a total. A linked clone, because an unlinked one inherits the prototype's name and
       * every figure on the board then reads as the hero. */
      const ally = name => Actor.create({
        ...hero.toObject(), _id: null, name,
        prototypeToken: { ...hero.prototypeToken.toObject(), name, actorLink: true }
      }, { keepId: false });
      const mates = [await ally("Probe Left"), await ally("Probe Right")];
      const made = [];
      const put = async (actor, x, y) => {
        const [doc] = await scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y })).toObject()]);
        made.push(doc);
        return doc;
      };
      const row = 1300;
      await put(hero, 700, row);
      await put(mates[0], 600, row);
      await put(mates[1], 800, row);
      await pause();

      const give = async name => {
        const def = SPELLS.get(name);
        if (!def) return null;
        const [slate] = await hero.createEmbeddedDocuments("Item", [slateData({
          ...slateFieldsOf(def), kind: spellKindOf(def.pool ?? def.node), prepared: true
        }, "spell")]);
        return slate;
      };
      const slates = [];
      for (const name of ["The Shield Line", "The First Taste", "The Borrowed Hand",
        "Valtor's Own", "The War Drum"]) {
        const slate = await give(name);
        if (!slate) return [[`${name} is in the spell list`, "no", "yes"]];
        slates.push(slate);
      }
      const [line, firstTaste, borrowed, valtor, drum] = slates;

      const taintIn = which =>
        (deckOf(hero, which)?.cards?.contents ?? []).filter(c => c.type === "taint");
      const sizeOf = which => deckOf(hero, which)?.cards?.size ?? 0;
      const said = () => game.messages.contents.at(-1)?.content ?? "";
      const full = hero.system.health.max;

      /* ---- the scale: a Health a man, for two men ---- */
      await hero.update({ "system.health.value": full });
      const paidLine = await r.payToCast(hero, line);
      await pause();
      const afterLine = hero.system.health.value;
      const lineSaid = /2 Health \(per ally affected\)/.test(said());

      /*
       * And the same spell with the line gone: nobody covered is nothing to pay.
       *
       * **Prepared again first.**  [2026-11-24] A cast spends the preparation now, so casting the
       * same spell twice in one scene is exactly what the ruling forbids and `payToCast` refused
       * the second one -- correctly, and in all three runs. This probe is about what a **scaled
       * price** charges rather than about how often a spell may be cast, so the sleep is granted
       * rather than the rule bent: putting `drained` back is what a long rest does, and the probe
       * for the ruling itself asks `rest` to do it properly.
       */
      for (const doc of made.slice(1)) await doc.delete();
      made.length = 1;
      await pause();
      await line.update({ "system.drained": false });
      await hero.update({ "system.health.value": full });
      const paidAlone = await r.payToCast(hero, line);
      const afterAlone = hero.system.health.value;

      /* ---- the Taint, and which pile it lands in ---- */
      const bodyBefore = taintIn("actionDiscard").length;
      const mindBefore = taintIn("skillDiscard").length;
      await r.payToCast(hero, firstTaste);
      await pause();
      const bodyAfter = taintIn("actionDiscard").length;
      const tasteSaid = /1 body Taint/.test(said());
      await r.payToCast(hero, borrowed);
      await pause();
      const mindAfter = taintIn("skillDiscard").length;
      const handSaid = /1 mind Taint/.test(said());
      /* The card's own source, so a Taint in a pile can be traced to the spell that put it there. */
      const sourced = taintIn("actionDiscard").some(c => c.system.source === "The First Taste");

      /* ---- the Strain: cards out of the hand ---- */
      const hand = deckOf(hero, "actionHand");
      const handBefore = sizeOf("actionHand");
      const discardBefore = sizeOf("actionDiscard");
      /* `wholeHand` is the one bill with no choosing in it, so no dialog opens and the probe can
       * drive it. A flat Strain against a fuller hand asks which cards, and that dialog is left
       * undriven for the same reason the Sift one is. */
      const paidValtor = await r.payToCast(hero, valtor);
      await pause();
      const handAfter = sizeOf("actionHand");
      const discardAfter = sizeOf("actionDiscard");
      const valtorSaid = /Strain \d+ \(your whole hand\)/.test(said());

      /* ---- and a price that cannot be paid is refused, having taken nothing ---- */
      await hero.update({ "system.health.value": full });
      const healthBefore = hero.system.health.value;
      const refused = await r.payToCast(hero, drum);
      const healthKept = hero.system.health.value === healthBefore;
      const handKept = sizeOf("actionHand") === handAfter;

      /* ---- and the price is on the card before it is clicked ---- */
      await put(mates[0], 600, row);
      await pause();
      const tray = game.cardrpg.openTray(hero);
      tray.side = "action";
      tray.openPiles = new Set(["spells"]);
      await tray.render();
      await pause(300);
      /* The note is in the card's TEXT, which is the lesson the timing probe paid for: a card says
       * things in two places and the note is the one that is not an attribute. */
      const card = [...document.querySelectorAll(".cr-card--spread")]
        .find(el => el.textContent.includes("The Shield Line"));
      const note = card ? card.textContent.replace(/\s+/g, " ").trim() : "not shown";

      /* ---- and put the world back ---- */
      tray.openPiles.clear();
      await tray.render();
      await tray.close();
      for (const slate of slates) await hero.deleteEmbeddedDocuments("Item", [slate.id]);
      for (const doc of made.reverse()) await doc.delete();
      for (const mate of mates) await mate.delete();
      for (const id of held) {
        await hero.items.get(id)?.update({ "system.equipped": true, "system.equippedSlot": "hands" });
      }
      const taints = [...taintIn("actionDiscard"), ...taintIn("skillDiscard")].map(c => c.id);
      if (taints.length) {
        for (const which of ["actionDiscard", "skillDiscard"]) {
          const stack = deckOf(hero, which);
          const mine = (stack?.cards?.contents ?? []).filter(c => c.type === "taint").map(c => c.id);
          if (mine.length) await stack.deleteEmbeddedDocuments("Card", mine);
        }
      }
      await hero.update({ "system.health.value": full });
      if (scene.grid.type !== wasGrid) {
        await scene.update({ "grid.type": wasGrid });
        await new Promise(done => Hooks.once("canvasReady", done));
      }

      return [
        ["a Health a man, for a line of two", paidLine && full - afterLine, 2],
        ["and the chat line shows the working", lineSaid, true],
        ["the same spell with nobody beside you", paidAlone && full - afterAlone, 0],
        ["a god's Taint goes into the action discard", bodyAfter - bodyBefore, 1],
        ["and says which deck it is", tasteSaid, true],
        ["a formula's goes into the skill discard", mindAfter - mindBefore, 1],
        ["and says so too", handSaid, true],
        ["and the card knows what put it there", sourced, true],
        ["the whole hand, strained", paidValtor && handBefore > 0 && handAfter, 0],
        ["and every card of it in the discard", discardAfter - discardBefore, handBefore],
        ["and the chat line names the scale", valtorSaid, true],
        ["a Strain the hand cannot cover is refused", refused, false],
        ["and the refusal costs no Health", healthKept, true],
        ["and takes no cards", handKept, true],
        ["the card in the pile prints the whole price",
          /costs 1 Health \(per ally affected\)/.test(note), true]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-22] A state of your own, read off the real piles.**
   *
   * `whileState` was nine values on eleven steps with no reader anywhere, so *The Empty Deck*
   * promised *you cannot be harmed at all* and nothing knew when that was true. Six of the values
   * are read by `stateHolds` now and gated by `refusesState`.
   *
   * **Nothing here touches the draw pile, and two failed runs are why.** A card dealt out of a
   * deck stays in the deck flagged `drawn`, and the copy in the hand shares its id -- so a deck
   * refuses to pass one (*you may not pass a Card which has already been drawn*), and clearing the
   * flag to force it through puts a second document with that id in the discard, which is the
   * second error. The deck model is not the thing under test and the game never empties a draw
   * pile anyway: it deals from one. So this moves the hand and the discard, which is what playing
   * a turn does.
   *
   * **That restraint is what found the real bug.** Reading `cards.size` on a draw pile counts the
   * loaned-out placeholders, so *hand and draw pile both empty* could never have held in a real
   * game -- on the one card in the game built on it. `available` is the helper that knows this and
   * has since the first deal; the engine reads it now. The unit stub had handed the rule a number
   * and been believed, which is the whole argument for driving a thing in the world it runs in.
   *
   * `handAndDeckEmpty` is checked here in the half that discriminates -- an empty hand with a pile
   * behind it is NOT the state -- and the both-empty half is in validate.mjs, where a draw pile can
   * be empty without asking Foundry to do something it never does.
   */
  await probe("a state of your own, read off the real piles", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const r = await import("/systems/cardrpg/module/resolve.mjs");
      const d = await import("/systems/cardrpg/module/decks.mjs");
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const { SPELLS, slateFieldsOf, spellKindOf } =
        await import("/systems/cardrpg/module/graph.mjs");
      const { slateData } = await import("/systems/cardrpg/module/setup.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      for (const c of [...game.combats]) await c.delete();
      const pause = (ms = 300) => new Promise(done => setTimeout(done, ms));
      const scene = canvas.scene;

      const myHand = d.deckOf(hero, "actionHand");
      const myPile = d.deckOf(hero, "action");
      const myBin = d.deckOf(hero, "actionDiscard");
      const held = stack => stack?.cards?.size ?? 0;
      /* The hand as found, so it can be put back card for card. */
      const dealt = (myHand?.cards?.contents ?? []).map(c => c.id);
      const began = dealt.length;
      if (began < 2) return [[`the hero was dealt a hand to empty (${began})`, "no", "yes"]];

      /* ---- the hand, from three sizes of it ---- */
      await d.move(myHand, myBin, dealt);
      await pause();
      const pairFalse = r.stateHolds(hero, "handAndDeckEmpty");
      const emptied = [r.stateHolds(hero, "handEmpty"), r.stateHolds(hero, "oneCard")].join(",");

      await d.move(myBin, myHand, dealt.slice(0, 1));
      await pause();
      const exactlyOne = [r.stateHolds(hero, "oneCard"), r.stateHolds(hero, "handEmpty")].join(",");

      await d.move(myBin, myHand, dealt.slice(1, 2));
      await pause();
      const nowTwo = [held(myHand), r.stateHolds(hero, "oneCard")].join(",");

      /* And the two numbers a draw pile has, which is the bug in one row: the printed contents,
       * and what is really left to draw. No hard count -- the hand size is the world's business. */
      const pileReads = d.available(myPile).length < held(myPile)
        ? "fewer than the deck prints" : `${d.available(myPile).length} of ${held(myPile)}`;

      /* ---- the hands that hold things ---- */
      const inHand = hero.items.filter(i => i.type === "item" && i.system.equipped
        && i.system.equippedSlot === "hands").map(i => i.id);
      const armed = r.stateHolds(hero, "handsEmpty");
      for (const id of inHand) await hero.items.get(id)?.update({ "system.equipped": false });
      await pause();
      const bare = [r.stateHolds(hero, "handsEmpty"), hero.system.handsUsed].join(",");

      /* ---- the deck's own floor, which is the number the sheet shows ---- */
      const deck = hero.system.actionDeck;
      const thinNow = r.stateHolds(hero, "thinDeck");
      const floorReads = `${deck.min}`;

      /* ---- and the board, which is the one state that asks the canvas ---- */
      const wasGrid = scene.grid.type;
      if (wasGrid === CONST.GRID_TYPES.GRIDLESS) {
        await scene.update({ "grid.type": CONST.GRID_TYPES.SQUARE });
        await new Promise(done => Hooks.once("canvasReady", done));
      }
      const made = [];
      const put = async (actor, x, y) => {
        const [doc] = await scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y })).toObject()]);
        made.push(doc);
        return doc;
      };
      /* Linked, because an unlinked clone inherits the prototype's name and every figure on the
       * board then reads as the hero -- the same trap the price probe records. */
      const mate = await Actor.create({
        ...hero.toObject(), _id: null, name: "Probe Beside",
        prototypeToken: { ...hero.prototypeToken.toObject(), name: "Probe Beside", actorLink: true }
      }, { keepId: false });
      await put(hero, 700, 1300);
      await pause();
      const alone = r.stateHolds(hero, "noAllyNear");
      await put(mate, 800, 1300);
      await pause();
      const beside = r.stateHolds(hero, "noAllyNear");
      /* Four squares off is outside the 2 the card names, so the state comes back. */
      await made[1].update({ x: 1100, y: 1300 });
      await pause();
      const farOff = r.stateHolds(hero, "noAllyNear");

      /* ---- the gate, on a real prepared spell ---- */
      const def = SPELLS.get("Nothing to Carry");
      if (!def) return [["Nothing to Carry is in the spell list", "no", "yes"]];
      const [carry] = await hero.createEmbeddedDocuments("Item", [slateData({
        ...slateFieldsOf(def), kind: spellKindOf(def.pool ?? def.node), prepared: true
      }, "spell")]);
      /* Hands are empty at this point, so the state holds and the cast is not refused. */
      const letThrough = r.refusesState(hero, carry, { what: "casting it" });

      /* ---- and the card says so before it is clicked ---- */
      const tray = game.cardrpg.openTray(hero);
      tray.side = "action";
      tray.openPiles = new Set(["spells"]);
      await tray.render();
      await pause(400);
      const faceOf = () => [...(tray.element?.querySelectorAll(".cr-card") ?? [])]
        .find(el => el.textContent.includes("Nothing to Carry"));
      const live = faceOf();
      const printed = /While both hands are empty/.test(live?.textContent ?? "");
      const litNow = /While both hands are empty \u2014 now/.test(live?.textContent ?? "");
      const clickableNow = !(live?.classList.contains("cr-card--passive") ?? true);

      /* And a sword back in hand, which must turn the same card off. */
      for (const id of inHand) {
        await hero.items.get(id)?.update({ "system.equipped": true, "system.equippedSlot": "hands" });
      }
      await tray.render();
      await pause(400);
      const refusedArmed = r.refusesState(hero, carry, { what: "casting it" });
      const greyed = faceOf()?.classList.contains("cr-card--passive") ?? false;
      const stillPrinted = /While both hands are empty/.test(faceOf()?.textContent ?? "");

      /* ---- and put the world back ---- */
      tray.openPiles.clear();
      await tray.render();
      await tray.close();
      await hero.deleteEmbeddedDocuments("Item", [carry.id]);
      for (const doc of made.reverse()) await doc.delete();
      await mate.delete();
      if (scene.grid.type !== wasGrid) {
        await scene.update({ "grid.type": wasGrid });
        await new Promise(done => Hooks.once("canvasReady", done));
      }
      await d.move(myBin, myHand, dealt.filter(id => myBin.cards?.get(id)));
      await pause();
      const restored = held(myHand);

      return [
        ["an emptied hand is empty, and is not one card", emptied, "true,false"],
        ["and an empty hand with a pile behind it is not the pair", pairFalse, false],
        ["one card in hand is exactly one", exactlyOne, "true,false"],
        ["and two cards are not", nowTwo, "2,false"],
        ["the pile is counted without the cards on loan", pileReads, "fewer than the deck prints"],
        ["a sword and a shield are not empty hands", armed, false],
        ["and nothing held is, by the number the sheet derives", bare, "true,0"],
        ["a starter deck is not pruned to its floor", thinNow, false],
        ["and the floor it would have to reach", floorReads, "12"],
        ["nobody beside you is nobody near", alone, true],
        ["an ally one square off is near", beside, false],
        ["and four squares off is not", farOff, true],
        ["the cast is allowed while the state holds", letThrough, false],
        ["and refused once your hands are full", refusedArmed, true],
        ["the card prints the state it waits on", printed, true],
        ["and marks it while you are in it", litNow, true],
        ["and is clickable while you are", clickableNow, true],
        ["and greys once you are not", greyed, true],
        ["and still says which state, so the rule is readable either way", stillPrinted, true],
        ["and the hand went back as it was", restored, began]
      ];
    });
  });

  /*
   * **[BUILT 2026-11-22] A Read that aims a draw.**
   *
   * `readDeck` named whose fate deck a Read looks at and nothing read it, while the two formulas
   * whose Read is the whole action wrote `verb: "foresee"` beside it -- a **different keyword**,
   * which reveals an NPC type's intent card. And the field could not have been wired first, because
   * a fate deck had no order: every draw went through `moveRandom`.
   *
   * **The row this probe exists for is the fifth one.** Arranging the top of a deck and then
   * drawing from it is the only thing that proves a Read does anything at all, and it crosses three
   * routines that each have a plausible wrong version: `reorderTop` could move the block up the
   * deck, `topOf` could read the wrong end, and `moveTop` could hand its cards back in the order
   * `Cards#pass` felt like. A grep sees none of that and the unit stub sees it in a stack it made
   * up; this draws a real card off a real Cards document and checks it is the one that was put on
   * top.
   *
   * **The reorder dialog is not driven**, the same bargain the Sift dialog and the delayed step are
   * left under: it is modal, and what it decides is an order this probe arranges directly instead.
   * `resolveRead` IS driven, through the Read of 1 that core-rules 6 says opens no dialog at all --
   * so the whole path runs, deck choice included.
   */
  await probe("a Read, and the draw it aims", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const r = await import("/systems/cardrpg/module/resolve.mjs");
      const d = await import("/systems/cardrpg/module/decks.mjs");
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      const npc = game.actors.find(a => a.type === "npc");
      for (const t of CardRPGTray.openTrays) await t.close();
      for (const c of [...game.combats]) await c.delete();
      const pause = (ms = 400) => new Promise(done => setTimeout(done, ms));

      const fate = d.deckOf(hero, "fate");
      const theirs = d.deckOf(npc, "fate");
      if (!fate || !theirs) return [["both sides have a fate deck", "no", "yes"]];

      /* ---- the top of a deck is the front of its order ---- */
      const top3 = d.topOf(fate, 3).map(c => d.cardName(c));
      const sorted = d.topOf(fate, 3).map(c => c.sort);
      const inOrder = sorted.every((n, k) => k === 0 || n >= sorted[k - 1]);
      const readsThree = d.topOf(fate, 3).length;

      /* ---- an order put back is an order kept ---- */
      const was = d.topOf(fate, 3).map(c => c.id);
      await d.reorderTop(fate, [was[2], was[0], was[1]]);
      await pause();
      const nowTop = d.topOf(fate, 3).map(c => c.id);
      const arranged = nowTop.join(",") === [was[2], was[0], was[1]].join(",");
      /* And the card BELOW what was read has not moved, because a Read arranges what it looked at
       * and may not bring a card up the deck. */
      const fourth = d.topOf(fate, 4)[3];
      const stillFourth = !!fourth && !was.includes(fourth.id);

      /* ---- and the draw takes the card that was put on top ---- */
      const wanted = d.cardName(fate.cards.get(nowTop[0]));
      const drew = await d.drawFate(hero, 0);
      await pause();
      const drewWanted = d.cardName(drew.drawn[0]) === wanted;
      /* Which is the whole mechanic in one line: the order a Read arranges is the order the cards
       * come off in. Under `moveRandom` this row would pass one time in twenty. */

      /* ---- a Read, through the routine, on somebody else's deck ---- */
      const place = async (actor, x) =>
        (await canvas.scene.createEmbeddedDocuments("Token",
          [(await actor.getTokenDocument({ x, y: 1600 })).toObject()]))[0];
      const ph = await place(hero, 1000);
      const pn = await place(npc, 1200);
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant", [
        { tokenId: ph.id, sceneId: canvas.scene.id, actorId: hero.id, initiative: 20 },
        { tokenId: pn.id, sceneId: canvas.scene.id, actorId: npc.id, initiative: 10 }
      ]);
      await combat.startCombat();
      await pause(700);

      /* `other` is every fate deck in the fight but your own, which is where *a Divinator may never
       * read their own* lives. One NPC type in this fight, so one deck and no dialog. */
      const theirTopWas = d.topOf(theirs, 1).map(c => d.cardName(c)).join("");
      const myTopWas = d.topOf(fate, 1).map(c => c.id).join("");
      const before = game.messages.size;
      const done = await r.resolveRead(hero, { step: { read: 1, readDeck: "other" }, targets: [] });
      await pause();
      const whose = done.map(x => x.whose).join(", ");
      const sawTheirs = done.some(x => x.names.join("") === theirTopWas);
      const myTopKept = d.topOf(fate, 1).map(c => c.id).join("") === myTopWas;
      /* Two messages: the cards to the player and the GM, and a line the table can see saying a
       * Read happened without saying what it found. */
      const said = game.messages.contents.slice(-2);
      const whispered = (said[0]?.whisper ?? []).length > 0;
      const open = (said[1]?.whisper ?? []).length === 0;
      const openIsQuiet = !new RegExp(theirTopWas.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .test(said[1]?.content ?? "");
      const spoke = game.messages.size - before;

      /* And a Read with nobody else in the fight finds no deck rather than reading your own. */
      for (const c of [...game.combats]) await c.delete();
      await pause();
      const alone = await r.resolveRead(hero, { step: { read: 1, readDeck: "other" }, targets: [] });

      /* ---- and put the world back ---- */
      for (const doc of [pn, ph]) await doc.delete();
      /* The drawn card back into the deck, and both decks shuffled: a probe that leaves a fate
       * deck one card short leaves the next probe's odds different from the one before it. */
      await d.reshuffleFate(hero);
      await d.reshuffleFate(npc);
      await pause();

      return [
        ["the top of a fate deck reads three", readsThree, 3],
        ["and they come back in the deck's own order", inOrder, true],
        ["and they are real cards", top3.every(n => n && n !== "?"), true],
        ["an order put back is the order kept", arranged, true],
        ["and the card below them did not move", stillFourth, true],
        ["and the draw takes the card put on top", drewWanted, true],
        ["a Read reaches somebody else's deck", whose, npc.system.kind || npc.name],
        ["and sees what is really on it", sawTheirs, true],
        ["and never touches your own", myTopKept, true],
        ["the cards are whispered", whispered, true],
        ["and the table is told a Read happened", open, true],
        ["without being told what it found", openIsQuiet, true],
        ["and that is two messages, not three", spoke, 2],
        ["and with nobody else in the fight, no deck is read", alone.length, 0]
      ];
    });
  });

  /*
   * **The round deals the hand, and the turn tops it up.**  **[BUILT 2026-11-22]**
   *
   * core-rules 3 step 1 is *refill*, and the engine did not do it: drawing was a button in the
   * HUD corner, so a fight began with five empty hands and a rule nobody could find. Both fills
   * are driven here through a REAL encounter rather than by calling `dealTurnHand`, because what
   * was missing was never the function -- it was the wiring, and a probe that calls the function
   * proves the half that was already fine. That is the same lesson *the HUD belongs to the fight*
   * is written under, in this file, forty probes up.
   */
  await probe("the round deals, and nobody presses anything", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const hand = LIVE.deckOf(hero, "actionHand");
      const size = hero.system.handSize?.max ?? 5;

      /* An empty hand, so a deal is the only thing that can fill it. */
      const discard = LIVE.deckOf(hero, "actionDiscard");
      if (hand.cards.size) await LIVE.move(hand, discard, hand.cards.map(c => c.id));
      const before = hand.cards.size;

      /*
       * **Linked, and the probe is wrong without it.** An unlinked token's actor is a synthetic
       * copy carrying its own uuid, so the figure in the fight is not the document this probe
       * reads afterwards: the hand filled (the decks are shared by id) and the turn's marker
       * went onto the copy. A player character's token is linked, which is the case being tested.
       */
      const token = (await hero.getTokenDocument({ x: 1400, y: 1400, actorLink: true }))
        .toObject();
      const [placed] = await canvas.scene.createEmbeddedDocuments("Token", [token]);
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant",
        [{ tokenId: placed.id, sceneId: canvas.scene.id, actorId: hero.id }]);
      await combat.startCombat();

      /* The deal is a chain of awaits hanging off a hook nobody awaits, so this waits for the
       * hand to stop changing rather than betting on a number of milliseconds. */
      const held = async () => {
        let last = -1;
        let same = 0;
        for (let i = 0; i < 40 && same < 3; i++) {
          await new Promise(r => setTimeout(r, 100));
          const n = hand.cards.size;
          same = n === last ? same + 1 : 0;
          last = n;
        }
        return last;
      };
      const dealt = await held();

      /* And the corner says so, on the screen, which is the half a flag check cannot see. */
      const tray = game.cardrpg.openTray(hero);
      tray.side = "action";
      await tray.render();
      await new Promise(r => setTimeout(r, 300));
      const corner = document.querySelector(".cr-hud__decks--action .cr-pile");
      const spent = corner?.classList.contains("cr-pile--spent") ? "dimmed" : "live";
      const says = corner?.querySelector(".cr-pile__state")?.textContent.trim();
      /*
       * **Read after the render, not after the cards.** The deal is a chain of awaits hanging off
       * a hook nobody holds, and the flag is written at the end of it -- so a hand that has
       * stopped growing is not yet a turn that has been marked. First time round this read a
       * `null` and reported a marker that was written 200ms later.
       */
      const marked = hero.getFlag("cardrpg", "dealtAt");

      /* The top-up: spend a card the way a reaction does, and start the turn again. */
      const [one] = hand.cards.contents;
      if (one) await LIVE.move(hand, discard, [one.id]);
      const thinned = hand.cards.size;
      await combat.nextRound();
      const refilled = await held();

      await combat.delete();
      await placed.delete();
      await hero.unsetFlag("cardrpg", "dealtAt");
      /*
       * **And wait for the fight to finish ending.** `deleteCombat` runs `afterCombat`, which
       * moves every card back, and nothing awaits it -- so the next probe's `settle` refilled a
       * hand that was being emptied underneath it, and the deck layer threw *Card does not
       * exist* in a probe about something else entirely.
       */
      await new Promise(r => setTimeout(r, 1500));

      return [
        ["the hand starts empty", before, 0],
        ["beginning a fight fills it", dealt, size],
        ["and the turn is marked on the actor, where every client can read it",
          typeof marked === "string" && marked.length > 0, true],
        ["the deck corner is dimmed", spent, "dimmed"],
        ["and says what it did", says ?? "nothing", "cards dealt"],
        ["a card spent between turns leaves the hand short", thinned, size - 1],
        ["and the next turn brings it back to size", refilled, size]
      ];
    });
  });

  /*
   * **A figure at 0 Health wears a skull and leaves the order.**  **[BUILT 2026-11-22]**
   *
   * Three things happened at 0 Health -- a Wound card, an injury draw, and a health value of zero
   * -- and not one of them was on the map. Driven through a plain `update` on the actor and not
   * through a blow, because **the number is the gate**: the GM typing a 0 into a sheet has to
   * work exactly as a hit does, and that is the path no damage-shaped test would cover.
   */
  await probe("a figure that is down", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
      const full = hero.system.health.max;

      /* Linked, so the figure in the fight is the hero and not a copy of them: see above. */
      const token = (await hero.getTokenDocument({ x: 1500, y: 1500, actorLink: true }))
        .toObject();
      const [placed] = await canvas.scene.createEmbeddedDocuments("Token", [token]);
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant",
        [{ tokenId: placed.id, sceneId: canvas.scene.id, actorId: hero.id }]);
      await combat.startCombat();
      const inAtFirst = combat.combatants.filter(c => c.actor?.uuid === hero.uuid).length;

      /* The hook is not awaited by the caller, so settle on the answer rather than time it. */
      const rest = async () => {
        for (let i = 0; i < 40; i++) await new Promise(r => setTimeout(r, 50));
      };

      /* The place they are about to lose, so the one they come back to can be compared with it. */
      const drew = combat.combatants.find(c => c.actor?.uuid === hero.uuid)?.initiative ?? null;

      await hero.update({ "system.health.value": 0 });
      await rest();
      const skull = hero.statuses?.has("dead") ? "yes" : "no";
      const left = combat.combatants.filter(c => c.actor?.uuid === hero.uuid).length;
      const said = (hero.system.activeConditions ?? []).map(c => c.key);
      const reacts = hero.system.noReactions ? "no" : "yes";
      const kept = hero.getFlag("cardrpg", "downedFrom")?.length ?? 0;

      await hero.update({ "system.health.value": full });
      await rest();
      const stillSkull = hero.statuses?.has("dead") ? "yes" : "no";
      const upAgain = (hero.system.activeConditions ?? []).some(c => c.key === "unconscious");
      const backIn = combat.combatants.filter(c => c.actor?.uuid === hero.uuid);
      const place = backIn[0]?.initiative ?? null;
      const forgotten = hero.getFlag("cardrpg", "downedFrom") ?? "gone";

      await combat.delete();
      await placed.delete();
      await new Promise(r => setTimeout(r, 1500));

      return [
        ["the figure was in the fight", inAtFirst, 1],
        ["0 Health draws a skull over the token", skull, "yes"],
        ["and takes the figure out of the order", left, 0],
        ["Unconscious is on the sheet", said.includes("unconscious"), true],
        ["and it is the first thing said about them", said[0] ?? "nothing", "unconscious"],
        ["and the reactions are off", reacts, "no"],
        ["and the place it drew is remembered", kept, 1],
        ["healing takes the skull off", stillSkull, "no"],
        ["and the Unconscious with it", upAgain, false],
        ["and the health really came back", hero.system.health.value, full],
        /*
         * **Back in, once, at the initiative it drew.** The order is drawn once and holds for
         * the whole fight, so coming back is a restoration: a second draw would be a second
         * order, and two combatants would be a second figure.
         */
        ["and the figure is back in the fight", backIn.length, 1],
        ["at the place it drew", place, drew],
        ["and the memory of the place is dropped", forgotten, "gone"]
      ];
    });
  });

  /*
   * **A caster's column still fits.**  **[FIXED 2026-11-22]**
   *
   * The probe above this file's deck-fitting one measures three piles and a deck corner, which is
   * what a Warrior has. **A caster has four piles**, because the spell book is a deck -- and the
   * card size was divided by a literal 4, so the fifth card went off the bottom of the screen and
   * the Conditions pile with it. Measured at 1366x768, the smallest window Foundry will run in.
   *
   * The spell is made and deleted here rather than left on the hero: every probe after this one
   * would otherwise be looking at a different column from the one it was written against.
   */
  await probe("the decks fit a caster's window", async () => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.evaluate(async () => {
      await LIVE.hero.createEmbeddedDocuments("Item",
        [{ name: "Probe Formula", type: "spell", system: { prepared: true } }]);
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
    await page.waitForSelector(".cr-hud__decks--action", { timeout: 20000 });
    const rows = await page.evaluate(async () => {
      /*
       * **Wait until the column has stopped moving.**  [2026-11-22]
       *
       * The host styles every `button` with `transition: 0.5s` -- all properties -- and a deck
       * pile is a button, so a render that changes a card's size slid it to the new one over half
       * a second. This probe measured inside that window and reported a pile a few percent out of
       * true, by a different few percent on each of three runs, while the arithmetic it was
       * testing was right the whole time. **A measurement of something in motion is a measurement
       * of nothing.** The system turns that transition off for a pile now; this waits as well,
       * because the next thing to animate will not be a pile.
       */
      const box = sel => document.querySelector(sel)?.getBoundingClientRect();
      let was = -1;
      let still = 0;
      for (let i = 0; i < 40 && still < 3; i++) {
        await new Promise(r => requestAnimationFrame(r));
        const now = Math.round(box(".cr-hud__decks--left")?.bottom ?? 0);
        still = now === was ? still + 1 : 0;
        was = now;
      }

      const left = box(".cr-hud__decks--left");
      const action = box(".cr-hud__decks--action");
      const piles = [...document.querySelectorAll(".cr-hud__decks--left .cr-pile")]
        .map(p => p.querySelector(".cr-pile__label")?.textContent.trim());
      /*
       * Off the layer the column is actually in, not the first one in the document: two trays can
       * be open, and a monster's has a left column and no deck corner.
       */
      const layer = document.querySelector(".cr-hud__decks--left").closest(".cr-hud-layer");
      const rows = getComputedStyle(layer).getPropertyValue("--cr-rows").trim();
      const overlap = Math.round(Math.max(0, left.bottom - action.top));
      /* On failure it prints what it measured: the arithmetic has four inputs, and a bare number
       * of pixels says which of them is wrong only by luck. */
      const one = document.querySelector(".cr-hud__decks--left .cr-pile");
      const seen = getComputedStyle(one);
      const detail = `${overlap}px: left ${Math.round(left.top)}-${Math.round(left.bottom)}, `
        + `deck ${Math.round(action.top)}-${Math.round(action.bottom)}, `
        + `pile ${seen.width}x${seen.height}, rows ${rows}, piles ${piles.length}, `
        + `vh ${window.innerHeight}`;
      return [
        ["a caster has four piles down the left", piles.join(", "),
          "Items, Features, Spells, Conditions"],
        ["and the budget counts all five cards", rows, "5"],
        ["the pile column stops before the action deck starts", overlap ? detail : 0, 0],
        ["the bottom pile is on the screen", left.bottom <= window.innerHeight, true],
        ["the action deck is too", action.bottom <= window.innerHeight, true],
        ["and a pile is still big enough to read a number on", Math.round(action.height) >= 90,
          true]
      ];
    });
    await page.evaluate(async () => {
      const spell = LIVE.hero.items.find(i => i.name === "Probe Formula");
      if (spell) await spell.delete();
      await game.cardrpg.openTray(LIVE.hero).render();
    });
    await page.setViewportSize({ width: 1600, height: 900 });
    return rows;
  });

  /*
   * **The piles are decks again, under the Play button.**  **[MOVED 2026-11-22]**
   *
   * They were icon counters at the end of the vitals row and the table reported *the discard pile
   * is not visible* -- which it was, as six characters of text beside a heart and a shield. What
   * is measured here is the thing a counter could not be: a place, the size of a card, that opens.
   */
  await probe("where the discard is", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      tray.openPiles.clear();
      await tray.render();
    });
    await page.waitForSelector(".cr-hud__piles", { timeout: 20000 });
    const rows = await page.evaluate(() => {
      const piles = [...document.querySelectorAll(".cr-hud__piles .cr-pile")];
      const play = document.querySelector(".cr-hud__play").getBoundingClientRect();
      const first = piles[0]?.getBoundingClientRect();
      const button = document.querySelector(".cr-hud__play .cr-play")?.getBoundingClientRect();
      const named = piles.map(p => p.querySelector(".cr-pile__label")?.textContent.trim());
      /* Card-shaped and a third of the column: tiles rather than piles would be the failure. */
      const shaped = piles.every(p => {
        const r = p.getBoundingClientRect();
        return r.height > r.width && r.width > 24;
      });
      const faced = piles.filter(p => p.classList.contains("cr-pile--faced")).length;
      const glyphs = piles.filter(p => p.querySelector(".cr-pile__count .cr-icon")).length;
      return [
        ["the piles are a row under the play column", named.join(", "), "Fate, Discard"],
        ["and they are below the button that resolves the turn",
          button && first ? first.top >= button.bottom - 1 : false, true],
        ["and inside the column", first ? first.right <= play.right + 1 : false, true],
        ["each is a card back", faced, named.length],
        ["each keeps a card's shape", shaped, true],
        ["and each carries the glyph that says which pile it is", glyphs, named.length],
        ["three of them across one column", piles.length <= 3, true]
      ];
    });
    /* And it opens, which is the whole point of making it a place. */
    await page.click('.cr-hud__piles .cr-pile[data-pile="actionDiscard"]');
    await page.waitForTimeout(400);
    const opened = await page.evaluate(() => {
      const spread = document.querySelector(".cr-hud__spread");
      return [
        ["clicking the discard spreads it", spread ? "open" : "shut", "open"],
        ["and it is the discard that opened",
          spread?.getAttribute("data-group-label") ?? "nothing", "Discard"],
        /* And it says which back it belongs to, which is what places it. */
        ["and it says which back it came off",
          spread?.getAttribute("data-pile") ?? "nothing", "actionDiscard"]
      ];
    });
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.openPiles.clear();
      await tray.render();
    });
    return [...rows, ...opened];
  });

  /*
   * **A monster's column is a character's column.**  **[FIXED 2026-11-23]**
   *
   * `#fitRows` counted the piles actually drawn, and a monster draws no deck corner -- the round
   * deals its intent for it (core-rules 3). So a goblin's column came out three rows where a
   * hero's is four, which at 2:3 is cards half again as large: the GM clicked a goblin and the
   * whole left edge of the screen changed size.
   *
   * Measured rather than reasoned about, and measured on both actors in one probe, because the
   * claim is a comparison and a number on its own could not make it.
   */
  await probe("a monster's decks are a character's size", async () => {
    await settle(page);
    /*
     * **With a spell on the hero**, which is the case that was reported second.  [2026-11-23]
     *
     * The first version of this probe compared a three-deck hero with a three-deck goblin and
     * passed, while the fault it was meant to cover was still on the screen: a CASTER draws a
     * fourth deck, so the hero in the screenshot had four and the goblin three, and the sizes
     * went on disagreeing. A parity check between two columns of the same height is not one.
     */
    await page.evaluate(async () => {
      const { hero } = LIVE;
      if (!hero.items.some(i => i.type === "spell")) {
        await hero.createEmbeddedDocuments("Item", [{
          name: "Probe Cantrip", type: "spell", system: { prepared: true, strength: 1 }
        }]);
      }
      await game.cardrpg.openTray(hero).render();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    const hero = await page.evaluate(() => {
      const piles = [...document.querySelectorAll(".cr-hud__decks--left .cr-pile")];
      const layer = document.querySelector(".cr-hud-layer");
      return {
        width: Math.round(piles[0]?.getBoundingClientRect().width ?? 0),
        rows: piles.length,
        var: getComputedStyle(layer).getPropertyValue("--cr-rows").trim()
      };
    });
    await page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      const beast = game.actors.getName("Goblin") ?? game.actors.find(a => a.type === "npc");
      globalThis.LIVE.beast = beast;
      game.cardrpg.openTray(beast);
    });
    await page.waitForSelector(".cr-npc", { timeout: 20000 });
    await page.waitForTimeout(600);
    const beast = await page.evaluate(() => {
      const piles = [...document.querySelectorAll(".cr-hud__decks--left .cr-pile")];
      const layer = document.querySelector(".cr-hud-layer");
      return {
        width: Math.round(piles[0]?.getBoundingClientRect().width ?? 0),
        rows: piles.length,
        var: getComputedStyle(layer).getPropertyValue("--cr-rows").trim(),
        /* One layer, or the window behind this one is still on the screen. */
        layers: document.querySelectorAll(".cr-hud-layer").length,
        corner: document.querySelectorAll(".cr-hud__decks--action").length
      };
    });
    await page.evaluate(async () => {
      const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
      for (const t of CardRPGTray.openTrays) await t.close();
      game.cardrpg.openTray(LIVE.hero);
    });
    await page.waitForTimeout(400);
    await page.evaluate(async () => {
      const spell = LIVE.hero.items.find(i => i.name === "Probe Cantrip");
      if (spell) await spell.delete();
      await game.cardrpg.openTray(LIVE.hero).render();
    });
    return [
      ["a character's decks have a width", hero.width > 0, true],
      ["and the monster's are the same width", beast.width, hero.width],
      ["both columns are counted the same way", beast.var, hero.var],
      /*
       * **And the columns really were different heights**, or the two rows above are a parity
       * check between two identical things. The caster draws four decks and the goblin three:
       * that is the case the table reported, and the size has to survive it.
       */
      ["the caster's column is the taller of the two", hero.rows > beast.rows, true],
      /* The divisor is the tallest column the HUD can draw -- four kinds and the corner -- so it
       * is the same number on both, and on an actor with any number of decks. */
      ["and the size is still computed for five rows", hero.var, "5"],
      /* The thing the GM actually saw: two HUDs on the screen at once. */
      ["and only one HUD is on the screen", beast.layers, 1],
      ["and a monster still has no deck corner to press", beast.corner, 0]
    ];
  });

  /*
   * **Outside a fight there is no turn to spend.**  **[RULED 2026-11-23]**
   *
   * The two-halves budget was enforced out of combat too, where *every turn is the same turn* --
   * and the same turn never ends, so the first card played outside a fight greyed its half for
   * good. A hand of five became three dead cards and two live reaction rows, with nothing short
   * of a fight starting and ending to clear it.
   *
   * Played rather than asserted: the fault was in what the hand looked like AFTERWARDS, so the
   * probe has to play something and then look at the hand.
   */
  await probe("a card played outside a fight spends no turn", async () => {
    await settle(page);
    await page.evaluate(async () => {
      /* No combat at all, which is the state this is about -- and the hand put back in the same
       * breath, for the reason written where the spent-turn probe ends its fight. */
      for (const c of [...(game.combats ?? [])]) await c.delete();
      await new Promise(r => setTimeout(r, 1200));
      await LIVE.afterCombat(LIVE.hero);
      await LIVE.refill(LIVE.hero);
    });
    const before = await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      tray.playedAt = null;
      tray.spentHalves = { primary: false, secondary: false };
      await tray.render();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return {
        fighting: !!game.combat?.started,
        offered: document.querySelectorAll(".cr-hud__hand [data-action=stage]").length,
        struck: document.querySelectorAll(".cr-hud__hand .cr-half--blocked").length
      };
    });
    /* Book both halves the way a Play does, and then ask the hand what it thinks. */
    const after = await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.playedAt = "no-combat";
      tray.spentHalves = { primary: true, secondary: true };
      await tray.render();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return {
        offered: document.querySelectorAll(".cr-hud__hand [data-action=stage]").length,
        struck: document.querySelectorAll(".cr-hud__hand .cr-half--blocked").length
      };
    });
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.playedAt = null;
      tray.spentHalves = { primary: false, secondary: false };
      await tray.render();
    });
    return [
      ["there is no fight running", before.fighting, false],
      ["the hand offers halves to stage", before.offered > 0, true],
      /* The claim: a spent marker outside a fight changes nothing, because there is no turn for
       * it to be about. */
      ["and a spent turn outside one takes none of them away", after.offered, before.offered],
      /* Measured against the hand as it was, not against nought: a condition can grey a half
       * for reasons that have nothing to do with a turn, and this probe is not about those. */
      ["and greys nothing it was not already greying", after.struck, before.struck]
    ];
  });

  /*
   * **And it costs nothing either.**  **[BUILT 2026-11-23]**
   *
   * The probe above is about the BUDGET and passed all along while the deck drained anyway, which
   * is the half the table found: *the action deck gets empty even outside a fight*. Every card
   * played in a corridor went to the discard, the hand drew a replacement off the draw pile, and
   * only the end of a fight sweeps those back -- so a fight that never started never ended and the
   * deck ran down for good. Stamina went the same way, and at zero the rest of the draw pile is
   * emptied by rule.
   *
   * Asked of the two routines that charge rather than through a click, because what is being
   * checked is the gate: `retireCards` is the one place a played card is put away and
   * `spendStamina` the one place the stat is charged. The same two are then asked again with a
   * fight running, which is the half that must NOT have changed -- a gate that always says no is
   * not a rule, it is a removal.
   */
  await probe("and costs neither a card nor a point of stamina", async () => {
    await settle(page);
    const out = await page.evaluate(async () => {
      const { hero } = LIVE;
      for (const c of [...(game.combats ?? [])]) await c.delete();
      await new Promise(r => setTimeout(r, 1200));
      await LIVE.afterCombat(hero);
      await LIVE.refill(hero);

      const hand = LIVE.deckOf(hero, "actionHand");
      const card = hand.cards.contents[0];
      const was = {
        hand: hand.cards.size,
        deck: LIVE.deckOf(hero, "action").cards.size,
        discard: LIVE.deckOf(hero, "actionDiscard").cards.size,
        spent: LIVE.deckOf(hero, "actionSpent").cards.size,
        stamina: hero.system.stamina.value
      };
      const burned = await LIVE.retireCards(hero, [{ cardId: card.id, half: "primary" }]);
      return {
        fighting: !!game.combat?.started,
        burned: burned.length,
        held: hand.cards.contents.some(c => c.id === card.id),
        moved: [
          hand.cards.size - was.hand,
          LIVE.deckOf(hero, "action").cards.size - was.deck,
          LIVE.deckOf(hero, "actionDiscard").cards.size - was.discard,
          LIVE.deckOf(hero, "actionSpent").cards.size - was.spent
        ].join(","),
        spentStamina: was.stamina - hero.system.stamina.value
      };
    });
    /* And the same two routines inside a fight, which is where both costs are real. */
    const inFight = await page.evaluate(async () => {
      const { hero } = LIVE;
      /*
       * A real encounter, built the way the spent-turn probe builds one: a placed token and a
       * combatant that names the scene. A `Combat` without those is not `game.combat`, and the
       * first version of this probe read the gate as closed and reported the fix as a removal --
       * which is the one thing a gate's probe must not get wrong.
       */
      for (const c of [...(game.combats ?? [])]) await c.delete();
      const token = (await hero.getTokenDocument({ x: 1500, y: 1500, actorLink: true }))
        .toObject();
      const [placed] = await canvas.scene.createEmbeddedDocuments("Token", [token]);
      const combat = await Combat.create({ scene: canvas.scene.id });
      await combat.createEmbeddedDocuments("Combatant",
        [{ tokenId: placed.id, sceneId: canvas.scene.id, actorId: hero.id }]);
      await combat.startCombat();

      /*
       * **Wait for the round's own deal to finish before touching the hand.**
       *
       * Starting a fight deals every character their turn hand, and nothing here awaits that: the
       * first version read a card id out of the hand a second later and `retireCards` threw *Card
       * ... does not exist* -- the refill was still moving the card it had been handed. A known
       * state is checked rather than slept for, which is the lesson `settle` carries.
       */
      const hand = LIVE.deckOf(hero, "actionHand");
      const want = hero.system.handSize?.max ?? 5;
      for (let i = 0; i < 30 && hand.cards.size < want; i++) {
        await new Promise(r => setTimeout(r, 100));
      }
      await new Promise(r => setTimeout(r, 400));

      /* Read here rather than straight after `startCombat`, which resolves before the combat is
       * the active one: the first version asked a beat too early and reported no fight running in
       * the breath before the gate it is about opened. */
      const fighting = !!game.combat?.started;
      const card = hand.cards.contents[0];
      const was = {
        hand: hand.cards.size,
        discard: LIVE.deckOf(hero, "actionDiscard").cards.size,
        spent: LIVE.deckOf(hero, "actionSpent").cards.size,
        stamina: hero.system.stamina.value
      };
      await LIVE.retireCards(hero, [{ cardId: card.id, half: "primary" }]);
      const answer = {
        left: was.hand - hand.cards.size,
        /* The discard OR the Spent pile: which of the two a half sends its card to is the half's
         * own business (core-rules 8), and this probe is about whether it leaves at all. */
        binned: LIVE.deckOf(hero, "actionDiscard").cards.size - was.discard
          + LIVE.deckOf(hero, "actionSpent").cards.size - was.spent,
        spentStamina: was.stamina - hero.system.stamina.value
      };
      /*
       * **The fight is ended and then waited for.**
       *
       * `deleteCombat` runs `afterCombat` itself, unawaited, and it walks every pile putting the
       * hand back. Calling the same routine here as well -- which the first version did, copying
       * a line from the spent-turn probe -- means two sweeps moving the same cards, and the second
       * one throws *Card ... does not exist* over a card the first has already moved. `afterFight`
       * waits for the sweep instead of racing it, and then checks the hand rather than hoping.
       */
      await combat.delete();
      await placed.delete();
      await LIVE.afterFight();
      return { ...answer, fighting };
    });
    return [
      ["there is no fight running", out.fighting, false],
      ["a played card stays in the hand", out.held, true],
      ["and no stack moves at all", out.moved, "0,0,0,0"],
      ["and nothing reaches the Spent pile", out.burned, 0],
      ["and no stamina is charged", out.spentStamina, 0],
      /* The other side of the gate, which is what says it is a rule and not a removal. */
      ["and a fight really was running", inFight.fighting, true],
      ["but inside a fight the card leaves the hand", inFight.left, 1],
      ["and lands in the discard or the Spent pile", inFight.binned, 1],
      ["and costs its point", inFight.spentStamina, 1]
    ];
  });

  /*
   * **The fate card is shown.**  **[BUILT 2026-11-23]**
   *
   * Every action is a number and a card, and only the number used to reach the player: the draw
   * happened, a chat line said *fate +1*, and the card itself was never on the screen.
   *
   * Three things are checked and the middle one is the point. That a card appears is easy. That it
   * **lands under the pile it went into, at that pile's width** is the reason the flight exists
   * rather than the card simply vanishing -- hud-spec 3.8 made the piles a place so the answer to
   * *where did that card go* could be a place, and this is the card going there.
   */
  await probe("the fate card, dealt and parked", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      tray.openPiles.clear();
      await tray.render();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      /* Not awaited: the reveal is what this probe watches, and awaiting the draw would let the
       * whole of it happen before the first look. */
      LIVE.drawFate(LIVE.hero, 3, 0);
    });
    await page.waitForSelector("#cr-fateshow .cr-fate", { timeout: 10000 });
    const dealt = await page.evaluate(() => {
      const card = document.querySelector("#cr-fateshow .cr-fate");
      const r = card.getBoundingClientRect();
      return {
        cards: document.querySelectorAll("#cr-fateshow .cr-fate").length,
        /* In the middle of the window, within a card's width of centre on both axes. */
        centred: Math.abs((r.left + r.right) / 2 - window.innerWidth / 2) < r.width
          && Math.abs((r.top + r.bottom) / 2 - window.innerHeight / 2) < r.height,
        /* Big enough to read, which is the whole reason it is dealt in the middle first. */
        tall: Math.round(r.height) > Math.round(window.innerHeight * 0.25),
        named: (card.querySelector(".cr-fate__name")?.textContent ?? "").trim().length > 0,
        clickable: getComputedStyle(document.getElementById("cr-fateshow")).pointerEvents
      };
    });
    /* Long enough for the hold and the flight, and well short of the five seconds parked. */
    await page.waitForTimeout(2200);
    const landed = await page.evaluate(() => {
      const card = document.querySelector("#cr-fateshow .cr-fate");
      const pile = document.querySelector(".cr-hud__piles .cr-pile");
      const piles = document.querySelector(".cr-hud__piles");
      if (!card || !pile || !piles) return { gone: !card };
      const r = card.getBoundingClientRect();
      const p = pile.getBoundingClientRect();
      const row = piles.getBoundingClientRect();
      return {
        gone: false,
        /* The pile's own width, which is what "the same size as the fate deck" means. */
        width: Math.abs(r.width - p.width) <= 2,
        under: r.top >= row.bottom - 1,
        aligned: Math.abs(r.left - row.left) <= 2
      };
    });
    /* And then it goes: five seconds parked, counted from the landing. */
    await page.waitForTimeout(5200);
    const after = await page.evaluate(
      () => document.querySelectorAll("#cr-fateshow .cr-fate").length);
    return [
      ["a draw deals one card", dealt.cards, 1],
      ["in the middle of the scene", dealt.centred, true],
      ["big enough to read", dealt.tall, true],
      ["with its name on it", dealt.named, true],
      /* A picture of a card that has already been drawn: nothing about it is a control. */
      ["and nothing about it is clickable", dealt.clickable, "none"],
      ["it is still on the screen after the flight", landed.gone, false],
      ["at the width of the pile it went under", landed.width, true],
      ["below the pile row", landed.under, true],
      ["and lined up with it", landed.aligned, true],
      ["and five seconds later it is gone", after, 0]
    ];
  });

  /*
   * **Advantage deals two and shows two**, which is the only form in which a player can check what
   * advantage bought: *you can see the card you did not get*. The one the rule passes over fades
   * where it lies rather than flying -- it is not going into the record, and those two things must
   * not look the same.
   */
  await probe("two fate cards, and the one that was not taken", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      LIVE.drawFate(LIVE.hero, 3, 1);
    });
    await page.waitForSelector("#cr-fateshow .cr-fate", { timeout: 10000 });
    await page.waitForTimeout(300);
    const both = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("#cr-fateshow .cr-fate")];
      const rects = cards.map(c => c.getBoundingClientRect());
      return {
        count: cards.length,
        /* Side by side, not stacked: two cards at one place is one card as far as a player is
         * concerned. */
        apart: rects.length === 2 && Math.abs(rects[0].top - rects[1].top) < 2
          && rects[0].right <= rects[1].left + 1,
        named: cards.every(c => (c.querySelector(".cr-fate__name")?.textContent ?? "").trim())
      };
    });
    /* Past the pair's longer hold, and into the fade. */
    await page.waitForTimeout(1900);
    const chosen = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("#cr-fateshow .cr-fate")];
      return {
        left: cards.length,
        spurned: cards.filter(c => c.classList.contains("cr-fate--spurned")).length,
        flying: cards.filter(c => c.classList.contains("cr-fate--flying")).length
      };
    });
    await page.waitForTimeout(6000);
    const after = await page.evaluate(
      () => document.querySelectorAll("#cr-fateshow .cr-fate").length);
    return [
      ["advantage deals two cards", both.count, 2],
      ["side by side", both.apart, true],
      ["both of them readable", both.named, true],
      /* One flies into the record and one fades out of it. Exactly one of each: two flying would
       * be two cards parked for a draw that kept one. */
      ["one of them flies to the pile", chosen.flying, 1],
      ["and the other is passed over where it lies", chosen.spurned >= 1 || chosen.left === 1,
        true],
      ["and in the end neither is left on the screen", after, 0]
    ];
  });

  /*
   * **Two decks open, each beside its own back.**  **[BUILT 2026-11-23]**
   *
   * Opening one deck shut the other, and whichever opened spread into a band pinned to the top of
   * the screen -- so a card from the third row of the column arrived level with the first. Both
   * halves are one fact: there was exactly one place to put a spread.
   *
   * The top of each row is compared against the top of the back it came off, which is the whole
   * claim. A row that merely EXISTS proves nothing: the old one existed too, in the wrong place.
   */
  await probe("two decks open, each beside its own deck", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      tray.openPiles = new Set(["items", "conditions"]);
      await tray.render();
    });
    await page.waitForSelector(".cr-hud__spread", { timeout: 20000 });
    await page.waitForTimeout(400);
    const rows = await page.evaluate(() => {
      const spreads = [...document.querySelectorAll(".cr-hud__spread")];
      const beside = spreads.map(sp => {
        const back = document.querySelector(`.cr-pile[data-pile="${sp.dataset.pile}"]`);
        if (!back) return null;
        return Math.abs(sp.getBoundingClientRect().top - back.getBoundingClientRect().top);
      });
      const named = spreads.map(sp => sp.dataset.pile).sort().join(", ");
      /* Two rows at two different heights: one height would be the old bug wearing two labels. */
      const tops = new Set(spreads.map(sp => Math.round(sp.getBoundingClientRect().top)));
      return [
        ["two decks are open at once", spreads.length, 2],
        ["and they are the two that were opened", named, "conditions, items"],
        ["each row is level with its own back", beside.every(d => d !== null && d <= 2), true],
        ["and the two rows are not at the same height", tops.size, 2],
        /* The Conditions deck is below Items in the column, so its row must be below too. */
        ["and the lower deck's row is the lower one",
          (() => {
            const of = id => document.querySelector(`.cr-hud__spread[data-pile="${id}"]`)
              ?.getBoundingClientRect().top ?? 0;
            return of("conditions") > of("items");
          })(), true]
      ];
    });
    /* And clicking one shuts only itself, which is the half a set buys. */
    await page.click('.cr-hud__decks--left .cr-pile[data-pile="items"]');
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => {
      const spreads = [...document.querySelectorAll(".cr-hud__spread")];
      return [
        ["shutting one leaves the other open", spreads.length, 1],
        ["and it is the one that was not clicked",
          spreads[0]?.dataset.pile ?? "nothing", "conditions"]
      ];
    });
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.openPiles.clear();
      await tray.render();
    });
    return [...rows, ...after];
  });

  /*
   * **The Items deck is what you have equipped.**  **[RULED 2026-11-23]**
   *
   * The count was everything owned and the spread was everything NOT in play: two decks sharing
   * one label. A goblin with a single equipped knife read **1 Items** and opened on nothing.
   *
   * What is checked is the agreement, not either number on its own -- *the back says what the
   * spread holds* is the rule, and a probe that only counted cards would pass on a back that
   * still lied.
   */
  await probe("the Items deck says what it holds", async () => {
    await settle(page);
    const rows = await page.evaluate(async () => {
      const { hero } = LIVE;
      const gear = hero.items.filter(i => i.type === "item");
      const worn = gear.filter(i => i.system.equipped);
      /* A character with nothing equipped could not tell the two rules apart. */
      if (!worn.length && gear.length) await gear[0].update({ "system.equipped": true });

      const tray = game.cardrpg.openTray(hero);
      tray.side = "action";
      tray.openPiles = new Set(["items"]);
      await tray.render();
      await new Promise(r => setTimeout(r, 400));

      const equipped = hero.items.filter(i => i.type === "item" && i.system.equipped).length;
      const back = document.querySelector('.cr-pile[data-pile="items"] .cr-pile__count');
      const spread = document.querySelector('.cr-hud__spread[data-pile="items"]');
      const cards = spread ? [...spread.querySelectorAll(".cr-card--spread")] : [];
      return [
        ["the back counts what is equipped", back?.textContent.trim() ?? "?", String(equipped)],
        ["and the spread holds the same number", cards.length, equipped],
        ["and the heading says so", spread?.dataset.groupLabel ?? "nothing",
          "Items \u2014 equipped"],
        /* A reference, not a control: equipping is the character sheet's job now. */
        ["and no card in it offers to be played",
          cards.some(c => c.dataset.action === "playSlate"), false]
      ];
    });
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.openPiles.clear();
      await tray.render();
    });
    return rows;
  });

  /*
   * **The skill deck deals when you click it.**  **[CHANGED 2026-11-23]**
   *
   * It was deliberately inert, on the argument that skill-rules 1 gives the GM the say. That
   * confused who decides with where you press: the action deck in the same corner on the other
   * side of the window deals when clicked, so the skill deck looked like a button and was not.
   */
  await probe("the skill deck deals a hand", async () => {
    await settle(page);
    const before = await page.evaluate(async () => {
      const { hero } = LIVE;
      const hand = LIVE.deckOf(hero, "skillHand");
      const discard = LIVE.deckOf(hero, "skillDiscard");
      /* An empty hand, or the corner is right to refuse and the probe proves nothing. */
      if (hand.cards.size) {
        await LIVE.move(hand, discard, hand.cards.contents.map(c => c.id));
      }
      const tray = game.cardrpg.openTray(hero);
      tray.side = "skill";
      tray.openPiles.clear();
      await tray.render();
      await new Promise(r => setTimeout(r, 400));
      const corner = document.querySelector(".cr-hud__decks--action .cr-pile");
      return {
        held: hand.cards.size,
        deck: LIVE.deckOf(hero, "skill").cards.size,
        action: corner?.dataset.action ?? "none",
        label: corner?.querySelector(".cr-pile__label")?.textContent.trim() ?? ""
      };
    });
    await page.click(".cr-hud__decks--action .cr-pile");
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => {
      const hand = LIVE.deckOf(LIVE.hero, "skillHand");
      const corner = document.querySelector(".cr-hud__decks--action .cr-pile");
      return {
        held: hand.cards.size,
        spent: corner?.classList.contains("cr-pile--spent") ?? false
      };
    });
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
    return [
      ["the corner is the skill deck", before.label, "Skill deck"],
      ["and it is wired to deal", before.action, "dealSkills"],
      ["the hand starts empty", before.held, 0],
      ["and there was something to draw", before.deck > 0, true],
      ["clicking it deals a hand", after.held > 0, true],
      /* And then says there is nothing more to come, the way the action deck does. */
      ["and the corner then says the hand is full", after.spent, true]
    ];
  });

  /*
   * **Two draws in one action show two cards, then one.**  **[FIXED 2026-11-23]**
   *
   * Each reveal computed its own centre and dealt there at once, and **an action can draw more
   * than once**: an attack draws for itself, and then again for a saving throw it forced or for
   * the injury of a target it dropped. So an attack with advantage put **three cards** in the
   * middle of the screen together -- the pair, plus a single belonging to a different draw, with
   * nothing saying which was which. Reported from the table as exactly that: *three fate cards*.
   *
   * What is measured is the thing that was wrong. Not *do the cards appear* -- they did -- but
   * **how many are in the middle at once**, sampled across the whole sequence, because the fault
   * lasted about a second and a half and a single look would have missed it.
   */
  await probe("two draws at once still show one at a time", async () => {
    await settle(page);
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      tray.openPiles.clear();
      await tray.render();
      await LIVE.drawn(() => document.querySelector(".cr-hud__piles .cr-pile"));
      /*
       * **Back to back, and the first one awaited.** This is how the engine draws: an attack
       * draws for itself, and only once that has resolved does it draw again for the saving
       * throw it forced or the injury of a target it dropped. The DRAWS are sequential; it is the
       * REVEALS that used to overlap, because the first is still in the middle of the screen a
       * second later.
       *
       * Firing both unawaited instead was this probe's own first bug: two concurrent `moveTop`
       * calls on one deck, which is a race the game never runs and which drew one card where it
       * should have drawn two.
       */
      await LIVE.drawFate(LIVE.hero, 3, 1);
      LIVE.drawFate(LIVE.hero, 3, 0);
    });
    /*
     * Sampled rather than looked at once: a card in the middle is one with neither the flying nor
     * the spurned class on it, and the question is the WORST moment across the sequence.
     */
    const watch = await page.evaluate(async () => {
      let mostCentred = 0;
      let everParked = 0;
      /*
       * **Counted over time, not at a moment.** Three cards is what the table saw and three cards
       * is still what is dealt -- a pair and then a single -- so the total cannot be read off any
       * one sample once the reveals take turns, which is the entire fix. Each element is stamped
       * the first time it is seen and the stamps are tallied.
       */
      let stamp = 0;
      const seen = new Set();
      for (let i = 0; i < 60; i++) {
        const all = [...document.querySelectorAll("#cr-fateshow .cr-fate")];
        for (const c of all) {
          if (!c.dataset.probeSeen) c.dataset.probeSeen = String(++stamp);
          seen.add(c.dataset.probeSeen);
        }
        const centred = all.filter(c => !c.classList.contains("cr-fate--flying")
          && !c.classList.contains("cr-fate--spurned")).length;
        const flying = all.filter(c => c.classList.contains("cr-fate--flying")).length;
        mostCentred = Math.max(mostCentred, centred);
        everParked = Math.max(everParked, flying);
        await new Promise(r => setTimeout(r, 100));
      }
      return { mostCentred, everParked, everSeen: seen.size };
    });
    /* And then the screen empties, however many draws went through it. */
    await page.waitForFunction(
      () => document.querySelectorAll("#cr-fateshow .cr-fate").length === 0,
      null, { timeout: 15000 }).catch(() => {});
    const after = await page.evaluate(
      () => document.querySelectorAll("#cr-fateshow .cr-fate").length);
    return [
      /* **The row this probe exists for.** Two is the advantage pair; three was the bug. */
      ["never more than two cards in the middle at once", watch.mostCentred <= 2, true],
      ["and the pair really was dealt", watch.mostCentred, 2],
      /* The second draw is queued, not dropped: both cards reach the pile row, which is also what
       * says the primary's card is still there when the secondary's lands. */
      ["both draws reach the pile row", watch.everParked, 2],
      /* Three cards is still what a pair and a single add up to -- the fix is that they are not
       * all in the middle together, not that one of them went missing. */
      ["and three cards were dealt in all", watch.everSeen, 3],
      ["and in the end the screen is clear", after, 0]
    ];
  });

  /*
   * **And each card says who drew it and what for.**  **[BUILT 2026-11-23]**
   *
   * The other half of the same complaint the queue above answered. Three cards in the middle of
   * the screen was the symptom; the disease is that a fate card carried no statement of what it
   * was answering, so a `-2` could be your Strike, the saving throw your spell forced, or the
   * injury of the goblin you dropped, and the only way to tell was to count and guess.
   *
   * Drawn through `resolveCondition` and not through `drawFate` directly, because the reason is
   * the CALLER's to supply: five of them draw through that one door and each one is a different
   * sentence, so a probe that passed its own `why` would be checking the layer that cannot get it
   * wrong. The goblin is the case that matters -- a creature's draw looked exactly like a hero's.
   */
  await probe("a revealed card says whose draw it is", async () => {
    await settle(page);
    const seen = await page.evaluate(async () => {
      const beast = game.actors.find(a => a.type === "npc");
      await game.cardrpg.openTray(LIVE.hero);
      await new Promise(r => setTimeout(r, 300));
      LIVE.resolveCondition(LIVE.hero, {
        step: { condition: "dazed", duration: 2, resist: "might", dc: 9 }, target: beast
      });
      /* Sampled rather than read once: the card is in the middle for under a second before it
       * flies, and the caption goes with it. */
      let caption = "";
      let name = "";
      for (let i = 0; i < 40 && !caption; i++) {
        const node = document.querySelector("#cr-fateshow .cr-fate");
        caption = node?.querySelector(".cr-fate__why")?.textContent ?? "";
        name = node?.querySelector(".cr-fate__name")?.textContent ?? "";
        if (!caption) await new Promise(r => setTimeout(r, 100));
      }
      await beast.update({ "system.conditions": [] }).catch(() => null);
      return { caption, name, beast: beast.name };
    });
    await page.waitForFunction(
      () => document.querySelectorAll("#cr-fateshow .cr-fate").length === 0,
      null, { timeout: 15000 }).catch(() => {});
    return [
      ["the card still names its face", seen.name.length > 0, true],
      /* The drawer first, because that is the half nobody can infer: a goblin's draw and a hero's
       * are the same picture. */
      ["and it says who drew it", seen.caption.startsWith(seen.beast), true],
      ["and what the draw was for", /saving throw: /.test(seen.caption), true],
      ["and the condition it was against", /Dazed/.test(seen.caption), true]
    ];
  });

  /*
   * **A creature off the compendium shelf is a creature.**  **[FIXED 2026-11-23]**
   *
   * Reported from the table as *post saves from npc to the chat*, and the reason nothing was in
   * the chat is that nothing was drawn. A pack actor carries no `system.decks` -- those slots hold
   * ids of documents in a world and a compendium has no world to point at -- and until today the
   * only routines that filled them were the starter build and `buildMonster`. Drag the same goblin
   * off the shelf instead and it arrived with none, which means **three rules silently stopped
   * applying**: its saving throws drew no card, dropping it to 0 drew no injury, and neither said
   * anything at all.
   *
   * Built here the way a drag builds one: `Actor.create` with no decks in the data, which is what
   * a compendium import is once the document is on its way into the world. The `createActor` hook
   * is what has to notice.
   */
  await probe("a creature made with no decks is given them", async () => {
    await settle(page);
    const out = await page.evaluate(async () => {
      const beast = game.actors.find(a => a.type === "npc");
      /* A copy of a real creature minus the one field a pack strips, which is the whole case. */
      const data = beast.toObject();
      delete data._id;
      delete data.system.decks;
      data.name = "Probe Shelf Goblin";
      const made = await Actor.create(data);
      /* The hook is async and fires on creation, so the wiring lands a beat later. */
      for (let i = 0; i < 40 && !made.system.decks?.fate; i++) {
        await new Promise(r => setTimeout(r, 100));
      }
      const wired = ["action", "actionDiscard", "intent", "fate", "fateDiscard"]
        .filter(slot => game.cards.get(made.system.decks?.[slot]));
      /* And the fate deck is the KIND's, shared with the creature it was copied from, rather than
       * a twenty-first deck of its own: a hex on the goblins touches the goblins. */
      const shared = made.system.decks?.fate === beast.system.decks?.fate;

      const before = game.messages.size;
      await made.update({ "system.health.value": 0 });
      await LIVE.resolveWound(made, { reason: LIVE.DROPPED });
      const said = game.messages.contents.slice(before)
        .map(m => String(m.content).replace(/<[^>]*>/g, " ")).join(" ");
      await made.delete();
      return { wired: wired.join(","), shared, said };
    });
    return [
      ["all five stacks are wired up", out.wired,
        "action,actionDiscard,intent,fate,fateDiscard"],
      ["and the fate deck is its kind's own, not a new one", out.shared, true],
      /* The three rules that silently did not apply, asked of the one that leaves a record. */
      ["and dropping it to 0 draws for an injury", /Injury draw/.test(out.said), true],
      ["and says so in chat", /fell/.test(out.said), true]
    ];
  });

  /*
   * **And one that cannot be wired says what did not happen.**  **[FIXED 2026-11-23]**
   *
   * The repair above fixes creatures made from today on; a world already holding one is not
   * reached by it. Both guards returned in silence -- no Wound, no injury draw, no line -- which
   * is the worst answer this moment has, because the blow landed and the Health went down. A
   * creature whose stacks are missing now says so and names the cure.
   */
  await probe("and a creature with no stacks at all says what it could not do", async () => {
    await settle(page);
    const said = await page.evaluate(async () => {
      const beast = game.actors.find(a => a.type === "npc");
      const data = beast.toObject();
      delete data._id;
      delete data.system.decks;
      data.name = "Probe Deckless Goblin";
      const made = await Actor.create(data);
      await new Promise(r => setTimeout(r, 1500));
      /* Emptied AFTER the hook has had its turn, which is the state a world built before today
       * holds: an actor nothing will ever wire up on its own. */
      await made.update({
        "system.decks.actionDiscard": null, "system.decks.fate": null
      });
      const before = game.messages.size;
      await made.update({ "system.health.value": 0 });
      await LIVE.resolveWound(made, { reason: LIVE.DROPPED });
      const lines = game.messages.contents.slice(before)
        .map(m => String(m.content).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
      await made.delete();
      return lines.join(" || ");
    });
    return [
      ["it says there is nowhere to put a Wound", /no discard pile to put one in/.test(said), true],
      ["and names the cure rather than the symptom", /never wired up/.test(said), true],
      /* And not nothing, which is what it said before. */
      ["and it is not silent", said.length > 0, true]
    ];
  });

  await probe("the system itself", async () => {
    const rows = await page.evaluate(() => {
      const errors = (globalThis.LIVE_ERRORS ?? []).filter(e => !/favicon|DevTools/.test(e));
      return [
        ["the system is the one in the repo", game.system.id, "cardrpg"],
        ["the world is ready", game.ready, true],
        ["the tray class is registered", typeof game.cardrpg.openTray, "function"],
        ["and nothing threw on the way up", errors.join(" | ") || "none", "none"]
      ];
    });
    rows.push(["and nothing it asked the server for was missing",
      [...missing].join(" | ") || "none", "none"]);
    return rows;
  });
}

/**
 * **A picture of what was just measured**, written when `--shot=<dir>` is given.
 *
 * Four of the faults this harness has caught were visual -- a 404'd back, two columns on top of
 * each other, a name clipped to four characters, a picture at 14% -- and in every case the number
 * that proved it was convincing only once a human had seen the thing. A probe says *a third of it
 * is visible*; whether a third is enough is a question for an eye, so the harness can hand one
 * over instead of describing it.
 */
async function shots(page, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const save = async (name, sel) => {
    const el = await page.$(sel);
    if (!el) return;
    await el.screenshot({ path: path.join(dir, `${name}.png`) });
    console.log(`shot    : ${path.join(dir, `${name}.png`)}`);
  };
  await page.evaluate(() => game.cardrpg.openTray(LIVE.hero));
  await page.waitForSelector(".cr-hud__hand", { timeout: 20000 });
  await save("hand", ".cr-hud__hand");
  await save("play", ".cr-hud__play");
  await save("decks", ".cr-hud__decks--left");
  /* The other side of the same window: the skill hand, the passives and the scene counts. */
  await page.evaluate(async () => {
    const tray = game.cardrpg.openTray(LIVE.hero);
    tray.side = "skill";
    await tray.render();
  });
  await page.waitForSelector(".cr-scene", { timeout: 20000 });
  await save("skillside", ".cr-scene");
  await save("skilldeck", ".cr-hud__decks--action");

  await page.evaluate(() => LIVE.hero.sheet.render(true));
  await page.waitForSelector(".cardrpg.sheet", { timeout: 20000 });
  await save("sheet", ".cardrpg.sheet");

  /* The Deck tab, which is where the deck list landed. It is not the default tab, so it has to be
   * asked for -- and a shot of a tab nobody opened is a shot of the wrong thing. */
  await page.evaluate(() => {
    document.querySelector('.cardrpg.sheet [data-action="switchTab"][data-tab="deck"]')?.click();
  });
  await page.waitForSelector(".cardrpg.sheet .cr-cardlist", { timeout: 20000 });
  await save("decklist", ".cardrpg.sheet");

  /* The level-up pane, opened on a node with a picture so the panel has something to show. */
  await page.evaluate(async () => {
    game.cardrpg.levelUp(LIVE.hero);
    await new Promise(r => setTimeout(r, 900));
    const pane = [...foundry.applications.instances.values()]
      .find(a => a.constructor.name === "LevelUpPane");
    /* No tap: the pane opens on its first choice by itself now, and that is the thing to show. */
    await new Promise(r => setTimeout(r, 200));
  });
  await page.waitForSelector(".cr-levelup__side", { timeout: 20000 });
  await save("levelup", ".cr-levelup__side");
  /* The map with both halos up: what the marked place opens, and what it bars. */
  await page.evaluate(async () => {
    const pane = [...foundry.applications.instances.values()]
      .find(a => a.constructor.name === "LevelUpPane");
    pane?.cy?.getElementById("origin.core").emit("tap");
    await new Promise(r => setTimeout(r, 200));
    const creation = pane?.cy?.nodes().filter(n => /^(origin|background)\./.test(n.id())
      || n.id() === "root");
    if (creation?.length) pane.cy.fit(creation, 40);
    await new Promise(r => setTimeout(r, 250));
  });
  await save("halos", ".cr-graph");

  /* And the map, framed on the creation layers: the places, and the trades behind them. */
  await page.evaluate(async () => {
    const pane = [...foundry.applications.instances.values()]
      .find(a => a.constructor.name === "LevelUpPane");
    const creation = pane?.cy?.nodes().filter(n => /^(root|origin|background)\./.test(n.id())
      || n.id() === "root");
    if (creation?.length) pane.cy.fit(creation, 40);
    await new Promise(r => setTimeout(r, 300));
  });
  await save("graph", ".cr-graph");

  /* And the monster's side of the same window, which has no counterpart on the hero's. */
  await page.evaluate(async () => {
    const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
    for (const t of CardRPGTray.openTrays) await t.close();
    game.cardrpg.openTray(game.actors.getName("Goblin")
      ?? game.actors.find(a => a.type === "npc"));
  });
  await page.waitForSelector(".cr-npc", { timeout: 20000 });
  await save("monster", ".cr-hud__play");
}

/* -------------------------------------------- */
/*  Run                                         */
/* -------------------------------------------- */

const app = findApp();
const data = findData();
const scratch = makeScratchData(data);
makeScratchWorld(data, scratch);
console.log(`Foundry : ${app.dir}`);
console.log(`Data    : ${scratch}`);
console.log(`World   : ${SCRATCH_WORLD} (copied from ${SOURCE_WORLD} in ${data})`);

const { server, log, ready } = startServer(app.main, scratch);
let browser = null;
let failed = 0;

try {
  await ready;
  browser = await chromium.launch({
    channel: arg("channel", "msedge"),
    headless: !flag("show")
  });
  /* Foundry refuses to render below 1366x768 and says so rather than guessing. */
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  /*
   * **A piece the brief says is still to be drawn is not a wrong path.**  [2026-11-14]
   *
   * The allowance that used to sit here was a blanket one for `art/nodes/`, and it went when the
   * shelf was finished. This is the narrow version and it is read from the ledger rather than
   * typed: `art-list.md` records every piece and whether it has a file, so a 404 for one it
   * already reports as **to shoot** is the state the brief is describing, and a 404 for anything
   * else is a wrong path like every other one.
   *
   * That keeps the check honest in both directions. A piece that quietly stopped being drawn
   * fails here the moment the brief says it is drawn, and a piece nobody has got to yet does not
   * fail twice for the same reason.
   *
   * **It is empty right now, which is the resting state and the reason it is safe to leave in.**
   * The blanket allowance it replaced had to be deleted by hand once the shelf was finished, and
   * the thing about an allowance you delete by hand is that somebody has to remember. This one
   * tightens by itself: the set is whatever the ledger says is outstanding, so a finished shelf
   * tolerates nothing at all.
   */
  const brief = fs.readFileSync(path.join(SYSTEM_DIR, "../art-list.md"), "utf8");
  /* One row per piece: a tick in the first cell when the file is on the disk, blank when it is
   * not, and the path in the last cell. The blank ones are the ones still to shoot. */
  const notYet = new Set(brief.split("\n")
    .map(line => /^\|\s*(\S*)\s*\|.*`([\w/-]+\.webp)`\s*\|\s*$/.exec(line))
    .filter(row => row && row[1] === "")
    .map(row => row[2]));
  page.on("response", r => {
    if (r.status() < 400) return;
    const url = r.url().split(`:${PORT}`).pop();
    const file = url.split("/art/")[1]?.split("?")[0] ?? "";
    if (r.status() === 404 && notYet.has(file)) return;
    missing.add(`${r.status()} ${url}`);
  });
  await page.addInitScript(() => {
    globalThis.LIVE_ERRORS = [];
    globalThis.addEventListener("error", e => globalThis.LIVE_ERRORS.push(String(e.message)));
  });

  const attempt = await join(page);
  await arm(page);
  console.log(`Joined  : game.ready on attempt ${attempt}\n`);

  await probes(page);
  if (arg("shot")) await shots(page, arg("shot"));

  const width = Math.max(...results.map(r => r.name.length));
  for (const { name, got, want } of results) {
    const ok = String(got) === String(want);
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"}  ${name.padEnd(width)}  ${got}${ok ? "" : `  (want ${want})`}`);
  }
  console.log(`\n${results.length - failed} of ${results.length} live checks pass.`);
} catch (err) {
  failed = 1;
  console.error(`\nThe harness could not run: ${err.message}`);
  if (log.length) console.error(log.join("").split("\n").slice(-12).join("\n"));
} finally {
  await browser?.close().catch(() => {});
  /*
   * **Wait for the server to actually be gone before deleting the world.** `kill` is a signal and
   * LevelDB holds its `LOCK` files until the process has run its handlers, so a delete sent in the
   * same tick fails with EPERM and leaves a scratch world behind for the next run to trip over.
   */
  server.kill();
  await new Promise(resolve => {
    const timer = setTimeout(resolve, 10000);
    server.on("exit", () => { clearTimeout(timer); setTimeout(resolve, 250); });
  });
  if (!flag("keep")) removeScratchData(scratch);
  else console.log(`\nLeft behind: ${scratch}`);
}

process.exit(failed ? 1 : 0);
