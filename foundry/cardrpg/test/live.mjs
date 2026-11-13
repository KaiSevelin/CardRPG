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
async function probe(name, fn) {
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
    await LIVE.afterCombat(hero);
    await LIVE.refill(hero);
    await LIVE.reserveHand(hero, false);
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
    await page.evaluate(() => game.cardrpg.openTray(LIVE.hero));
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
    await page.evaluate(() => game.cardrpg.openTray(LIVE.hero));
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
   * **Stamina is how many cards you may play, and running out is a wall made of the draw pile.**
   */
  await probe("stamina", async () => {
    await settle(page);
    return page.evaluate(async () => {
      const { hero } = LIVE;
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
      return [
        ["playing a card costs a point of stamina", max - afterOne, 1],
        ["the draw pile is full before the last point goes", held > 0, true],
        ["at zero the draw pile is discarded", LIVE.available(deck).length, 0],
        ["and it says how many cards that was", out.dumped, held],
        ["stamina never goes below zero", hero.system.stamina.value, 0]
      ];
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
    await page.evaluate(() => game.cardrpg.openTray(LIVE.hero));
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
    await page.evaluate(() => game.cardrpg.openTray(LIVE.hero));
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
      out.push(["and every one of them wears its picture", named.length, stacked.length]);

      const urls = named.map(e => artOn(e).replace(/^url\(['"]?/, "").replace(/['"]?\)$/, ""));
      const codes = await Promise.all(urls.map(u =>
        fetch(u, { method: "HEAD" }).then(r => r.status).catch(() => 0)));
      out.push(["and the server serves it", [...new Set(codes)].join(",") || "none", "200"]);
      return out;
    });
    return rows;
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
   * **And the decks fit on the scene.**  **[FIXED 2026-11-13]**
   *
   * The two columns are anchored from opposite ends -- the piles from the top, the action deck
   * from the hand's baseline -- and nothing related them, so below a window 924px tall the action
   * deck sat on top of Conditions. Measured at **1366x768**, which is the smallest window Foundry
   * will run in at all, so what is pinned is the worst case rather than this machine's.
   */
  await probe("the decks fit the window", async () => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.evaluate(() => game.cardrpg.openTray(LIVE.hero));
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
    await page.evaluate(() => game.cardrpg.openTray(LIVE.hero));
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
    await page.setViewportSize({ width: 1600, height: 900 });
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

  /*
   * **And the world opens at all.** Nine days of engine changes went in without one of them being
   * loaded, so the cheapest question worth asking is whether the system still boots -- which every
   * probe above depends on and none of them states.
   */
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
  await page.evaluate(() => LIVE.hero.sheet.render(true));
  await page.waitForSelector(".cardrpg.sheet", { timeout: 20000 });
  await save("sheet", ".cardrpg.sheet");
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
  page.on("response", r => {
    if (r.status() >= 400) missing.add(`${r.status()} ${r.url().split(`:${PORT}`).pop()}`);
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
