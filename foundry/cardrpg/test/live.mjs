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
    /*
     * **And the window on the action side.**  [2026-11-14] The mode picks the side now -- a fight
     * is the action deck, a scene is the skill deck -- and these probes run out of combat, so
     * without this the hand they are all about is not on the screen. Pinned here rather than
     * started per probe because it is part of *a known state*, which is what this function is.
     */
    const { CardRPGTray } = await import("/systems/cardrpg/module/tray.mjs");
    for (const tray of CardRPGTray.openTrays) {
      if (tray.actor?.type !== "npc") tray.side = "action";
    }
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
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
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
    await page.evaluate(async () => {
      const tray = game.cardrpg.openTray(LIVE.hero);
      tray.side = "action";
      await tray.render();
    });
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
      const chain = () => {
        const html = game.messages.contents.at(-1)?.content ?? "";
        return (html.match(/<p>(.*?)<\/p>/)?.[1] ?? "").replace(/&middot;/g, "\u00b7")
          .replace(/&mdash;/g, "\u2014");
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
      const claimedEdge = game.messages.contents.at(-1)?.content ?? "";

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
      tray.openPile = "conditions";
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
