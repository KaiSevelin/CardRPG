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
import { chromium } from "playwright-core";

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
 * Copy the world and rename it in place.
 *
 * A world is a few hundred kilobytes of LevelDB, so this costs nothing and buys the only property
 * that matters: the probes may break whatever they like. `LOCK` is a running server's file and is
 * left behind; copying one into a fresh world is how you get a world that will not open.
 */
function makeScratchWorld(data) {
  const worlds = path.join(data, "Data", "worlds");
  const from = path.join(worlds, SOURCE_WORLD);
  const to = path.join(worlds, SCRATCH_WORLD);
  if (!fs.existsSync(from)) {
    throw new Error(`No world "${SOURCE_WORLD}" in ${worlds}. Pass --world=<id>.`);
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
   * **And the world opens at all.** Nine days of engine changes went in without one of them being
   * loaded, so the cheapest question worth asking is whether the system still boots -- which every
   * probe above depends on and none of them states.
   */
  await probe("the system itself", async () => {
    return page.evaluate(() => {
      const errors = (globalThis.LIVE_ERRORS ?? []).filter(e => !/favicon|DevTools/.test(e));
      return [
        ["the system is the one in the repo", game.system.id, "cardrpg"],
        ["the world is ready", game.ready, true],
        ["the tray class is registered", typeof game.cardrpg.openTray, "function"],
        ["and nothing threw on the way up", errors.join(" | ") || "none", "none"]
      ];
    });
  });
}

/* -------------------------------------------- */
/*  Run                                         */
/* -------------------------------------------- */

const app = findApp();
const data = findData();
const scratch = makeScratchWorld(data);
console.log(`Foundry : ${app.dir}`);
console.log(`Data    : ${data}`);
console.log(`World   : ${SCRATCH_WORLD} (copied from ${SOURCE_WORLD})`);

const { server, log, ready } = startServer(app.main, data);
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
  await page.addInitScript(() => {
    globalThis.LIVE_ERRORS = [];
    globalThis.addEventListener("error", e => globalThis.LIVE_ERRORS.push(String(e.message)));
  });

  const attempt = await join(page);
  await arm(page);
  console.log(`Joined  : game.ready on attempt ${attempt}\n`);

  await probes(page);

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
  if (!flag("keep")) {
    fs.rmSync(scratch, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
  }
  else console.log(`\nLeft behind: ${scratch}`);
}

process.exit(failed ? 1 : 0);
