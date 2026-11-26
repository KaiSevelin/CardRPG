/**
 * Card RPG for Foundry VTT 14.
 *
 * Playtest build: combat only. Out-of-combat play, character creation and levelling come later.
 * Design docs live beside this folder in foundry/ and rules/.
 */

import { CARDRPG } from "./module/config.mjs";
import { registerSheets } from "./module/sheets.mjs";
import {
  createStarterContent, ensureSetupMacro, buildMonster, rebuildWorldContent,
  buildCharacterDecks, buildCreatureDecks,
  rebuildContentMenu
} from "./module/setup.mjs";
/* A transformation is ended by somebody, because nothing here owns a timer that survives a
 * reload -- so the duration on the card is what the table reads and this is how it is settled. */
import { endTransformation, payToPrepare, resolveCleansing } from "./module/resolve.mjs";
import { CardRPGCombat, registerCombatHooks } from "./module/combat.mjs";
import { CardRPGTray, registerTrayHooks } from "./module/tray.mjs";
import { registerGroundHooks, imposeGround, springTraps } from "./module/ground.mjs";
/* The reachable squares come off the board when the board changes under them; see board.mjs. */
import { registerBoardHooks } from "./module/board.mjs";
import { registerFateShow } from "./module/fateshow.mjs";
import { registerCheckHooks } from "./module/checks.mjs";
import { registerTableBoard } from "./module/table.mjs";
import { registerEnrichers, registerEnricherClicks } from "./module/enrichers.mjs";
import { LevelUpPane } from "./module/levelup.mjs";
import * as decks from "./module/decks.mjs";
import { answerArrival, answerWatch, watches } from "./module/resolve.mjs";
/* The graph is assembled at runtime from core content plus whatever the world has added. */
import {
  rebuildGraph, repairCharacters, repairCharactersMenu
} from "./module/graph.mjs";
import { CharacterData, NpcData } from "./module/data/actors.mjs";
import { ItemSlateData, FeatureSlateData, SpellSlateData, InjurySlateData } from "./module/data/items.mjs";
import {
  ActionCardData, FateCardData, NpcCardData, WoundCardData, TaintCardData, FearCardData,
  DoubtCardData, RageCardData, CompulsionCardData, ConfusionCardData, WildCardData,
  SkillCardData, TwistCardData, CritCardData
} from "./module/data/cards.mjs";

/* -------------------------------------------- */
/*  Init                                        */
/* -------------------------------------------- */

Hooks.once("init", () => {
  console.log("Card RPG | Initialising");

  CONFIG.CARDRPG = CARDRPG;

  // --- data models
  CONFIG.Actor.dataModels = {
    character: CharacterData,
    npc: NpcData
  };

  CONFIG.Item.dataModels = {
    item: ItemSlateData,
    feature: FeatureSlateData,
    // The fourth slate kind core-rules 1 has always listed: a feature you did not choose, which a
    // ritual lifts rather than a level-up prunes.
    injury: InjurySlateData,
    // A spell is a slate too, but what it occupies is a spell slot rather than a slot on your body.
    spell: SpellSlateData
  };

  // Card and Cards support document subtypes with a TypeDataModel on `system`, which is what lets
  // action, fate and NPC cards be native typed documents rather than Items pretending to be cards.
  CONFIG.Card.dataModels = {
    action: ActionCardData,
    fate: FateCardData,
    npc: NpcCardData,
    wound: WoundCardData,
    taint: TaintCardData,
    fear: FearCardData,
    doubt: DoubtCardData,
    rage: RageCardData,
    compulsion: CompulsionCardData,
    confusion: ConfusionCardData,
    wild: WildCardData,
    // The skill side's own card: one approach and a value (skill-rules 1).
    skill: SkillCardData,
    // The GM's deck: what a Partial costs and what a Fail does instead (skill-rules 4).
    twist: TwistCardData,
    /* What a critical hit did, drawn face up the moment one lands. */
    crit: CritCardData
  };

  // --- combat
  // Initiative is individual and drawn once from each combatant's own fate deck, with ties
  // redrawn (core-rules 3). Foundry's formula is unused; CardRPGCombat overrides the roll.
  CONFIG.Combat.documentClass = CardRPGCombat;
  CONFIG.Combat.initiative = { formula: "0", decimals: 0 };
  registerCombatHooks();
  registerTrayHooks();
  /* A GM ticks what a region they drew is; see module/ground.mjs. */
  registerGroundHooks();
  /* And the reachable-square highlight, which clears itself whenever "from here" stops being
   * true: the figure moved, the turn changed, the scene changed. */
  registerBoardHooks();
  /* The fate card, dealt where the table is looking and parked under the pile it went into. */
  registerFateShow();
  /* A check's result moves a challenge track, and only the GM's client may write a scene
   * flag -- so the recording hangs off the message rather than off the roll (checks.mjs). */
  registerCheckHooks();
  /* The GM's own controls, on the token rather than inside a player's window. */
  registerTableBoard();
  /* Enrichment happens the first time anything renders a journal page, so the patterns must be
   * registered at init; the delegated click listener can wait for a document to exist. */
  registerEnrichers();

  registerSettings();
  registerHelpers();
  registerSheets();
  /*
   * One partial, for the one shape this game has: a step. A card half, a spell's effect and an NPC
   * sequence are all ordered lists of them, so an editor for a step belongs in one file rather
   * than in three -- three copies is three places for the vocabulary to drift.
   */
  foundry.applications.handlebars.loadTemplates([
    "systems/cardrpg/templates/parts/step.hbs",
    "systems/cardrpg/templates/parts/steps.hbs",
    /* And the other shape that was written out more than once: a short list of strings. */
    "systems/cardrpg/templates/parts/entries.hbs"
  ]);
});

/* -------------------------------------------- */
/*  Handlebars helpers                          */
/* -------------------------------------------- */

/** Our own, rather than relying on which helpers core happens to register. */
function registerHelpers() {
  /**
   * An icon, masked to currentColor so one CSS rule can grey a blocked one. The key is the
   * kebab-case game-icons filename (rules/icons.md), which is also the enum value.
   *
   * Until the SVGs are downloaded into icons/, this renders a labelled placeholder rather than an
   * empty box -- so a missing asset is visible and tells you which one is missing.
   */
  Handlebars.registerHelper("crIcon", key => {
    if (!key) return new Handlebars.SafeString("");
    // A url() inside a custom property resolves against the STYLESHEET that uses it, not the
    // document -- so a relative path here became systems/cardrpg/styles/systems/cardrpg/icons/...
    // getRoute gives an absolute path and copes with a server route prefix.
    const url = foundry.utils.getRoute(`systems/cardrpg/icons/${key}.svg`);
    return new Handlebars.SafeString(
      `<span class="cr-icon" style="--icon: url('${url}')" data-icon="${key}" data-tooltip="${key}"></span>`
    );
  });

  /**
   * **A CSS `url()` for a piece of art, absolute from the server root.**  **[FIXED 2026-11-13]**
   *
   * The same defect as `crIcon` above, in the other half of the pictures, and the comment up there
   * had described it for months: a relative `url()` inside a **custom property** resolves against
   * the stylesheet that consumes the `var()`, not against the document. Every deck back asked the
   * server for `systems/cardrpg/styles/systems/cardrpg/art/backs/action.webp` and got a 404, so
   * the piles fell back to the hatch and the game looked like it had no art at all.
   *
   * Eight sites across two templates wrote the `url()` by hand. They go through here now, so the
   * next one cannot be written the broken way -- which is the actual lesson, because the knowledge
   * existed and simply did not travel the twenty lines from `crIcon` to the art.
   *
   * `getRoute` rather than a bare slash, so a server behind a route prefix still finds its own
   * pictures.
   */
  Handlebars.registerHelper("crArt", path => {
    if (!path) return new Handlebars.SafeString("");
    /*
     * **Single quotes, because every caller is inside a double-quoted attribute.** The first
     * version returned `url("...")` and the `"` closed `style="` on the spot, so the browser kept
     * `--cr-art: url(` and threw the path away -- the backs went missing a second time, by a
     * different route, and the computed value said `url(` with nothing in it.
     */
    const url = foundry.utils.getRoute(String(path)).replaceAll("'", "%27");
    return new Handlebars.SafeString(`url('${url}')`);
  });

  Handlebars.registerHelper("crEq", (a, b) => a === b);
  /*
   * **Two helpers for editing a list of enum values as checkboxes.**
   *
   * `crHas` answers whether a value is already ticked, and `crList` shows an array as the comma
   * separated text a hand-named list is typed into. A slot is an enum, and a GM should not have to
   * remember how to spell "fingers" -- which is the whole argument for ticking rather than typing.
   */
  Handlebars.registerHelper("crHas", (list, value) => Array.isArray(list) && list.includes(value));
  Handlebars.registerHelper("crList", list => (Array.isArray(list) ? list.join(", ") : ""));

  Handlebars.registerHelper("concat", (...args) => args.slice(0, -1).join(""));
}

/* -------------------------------------------- */
/*  Settings                                    */
/* -------------------------------------------- */

/**
 * Tuning values live here rather than in code, because playtesting will move them and a world
 * should be able to change its mind without a system release.
 */
function registerSettings() {
  const d = CARDRPG.defaults;

  /*
   * **The one setting that is a button**, and the only way a world gets a content change without
   * somebody typing an API name into the console.  [BUILT 2026-11-13]
   *
   * It is first in the panel because it is the thing a GM opens settings for after a system
   * update, and `restricted` because it writes to the world. What it does, what it refuses to do,
   * and why are all in `rebuildWorldContent`; the dialog it opens says the same in a GM's words.
   */
  game.settings.registerMenu("cardrpg", "rebuildContent", {
    name: "CARDRPG.Settings.RebuildContent.Name",
    label: "CARDRPG.Settings.RebuildContent.Label",
    hint: "CARDRPG.Settings.RebuildContent.Hint",
    icon: "fa-solid fa-arrows-rotate",
    type: rebuildContentMenu(),
    restricted: true
  });

  /*
   * **And the other half of that question.**  [BUILT 2026-11-15]
   *
   * The button above brings the WORLD's content in line with the system. This one brings the
   * CHARACTERS in line with what their own nodes say they were given -- which is a separate
   * button because it is a separate fault: two engine bugs handed over nothing and said nothing,
   * and fixing the code only fixes the next character. `repairCharacters` has the full account,
   * and its dialog says the same in a GM's words.
   *
   * Second in the panel rather than first, because a world whose content is missing should be
   * rebuilt before anybody asks what a character is owed out of it.
   */
  game.settings.registerMenu("cardrpg", "repairCharacters", {
    name: "CARDRPG.Settings.RepairCharacters.Name",
    label: "CARDRPG.Settings.RepairCharacters.Label",
    hint: "CARDRPG.Settings.RepairCharacters.Hint",
    icon: "fa-solid fa-user-doctor",
    type: repairCharactersMenu(),
    restricted: true
  });

  game.settings.register("cardrpg", "showFateSwing", {
    name: "CARDRPG.Settings.ShowFateSwing.Name",
    hint: "CARDRPG.Settings.ShowFateSwing.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register("cardrpg", "showNpcHealth", {
    name: "CARDRPG.Settings.ShowNpcHealth.Name",
    hint: "CARDRPG.Settings.ShowNpcHealth.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  /*
   * **The authoring lock.** A world may edit the levelling graph, and a graph edited under a
   * running campaign is the one thing in this system that can quietly change a character who is
   * not in the room: everything about them derives from the nodes they own (leveling 9), so a
   * changed node changes their Health, title, Tactic and frontier with no event and no log line.
   *
   * So editing is off by default and the GM turns it on deliberately. It is not a safety railing
   * against a mistake; it is a statement that this world is being AUTHORED rather than played.
   */
  game.settings.register("cardrpg", "graphEditing", {
    name: "CARDRPG.Settings.GraphEditing.Name",
    hint: "CARDRPG.Settings.GraphEditing.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  /*
   * What this world has changed about the graph: nodes it replaced or added, and core nodes it
   * dropped. leveling.md 8 describes the graph as assembled at runtime from every installed
   * source; this is the world's own source, and `NODES` is never touched.
   */
  game.settings.register("cardrpg", "graphEdits", {
    scope: "world",
    config: false,
    type: Object,
    default: { added: [], removed: [] }
  });

  /*
   * Whether the GM's passive panel is folded open. **Client-scoped**, because it is a preference
   * about one person's screen and not a rule of the world -- and stored rather than held on the
   * tray so that it survives a reload, which is what "collapsible" has to mean for a panel a GM
   * folds away once and wants to stay folded.
   */
  game.settings.register("cardrpg", "passivesOpen", {
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register("cardrpg", "setupMacroMade", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register("cardrpg", "handSize", {
    name: "CARDRPG.Settings.HandSize.Name",
    hint: "CARDRPG.Settings.HandSize.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: d.handSize
  });

  game.settings.register("cardrpg", "carryLimit", {
    name: "CARDRPG.Settings.CarryLimit.Name",
    hint: "CARDRPG.Settings.CarryLimit.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: d.carryLimit
  });

  /*
   * **[2026-11-12] `overloadedSpent` is gone.** It set how many cards Overloaded put in the Spent
   * pile, and Overloaded costs stamina now -- a derived clause on `stamina.max`, not a number of
   * cards anybody moves. `CARDRPG.defaults.overloadedStamina` is the number, and it is not a world
   * setting because nothing asked for one.
   */
}

/* -------------------------------------------- */
/*  Ready                                       */
/* -------------------------------------------- */

Hooks.once("ready", async () => {
  /* One listener for every enriched button we will ever render, in journals, chat or a tooltip. */
  registerEnricherClicks();

  // Exposed so the setup routine can be run from a macro or the console.
  game.cardrpg = {
    createStarterContent,
    /* The settings button's routine, exposed too, so the thing in the menu and the thing in a
     * macro are the same function and not two spellings of it. */
    rebuildWorldContent,
    /* The character-side repair, exposed for the same reason: the menu and a macro should run one
     * function rather than two spellings of it. Takes no argument and does every character; the
     * per-actor `repairCharacter` is the graph's export for one. */
    repairCharacters,
    config: CARDRPG,
    decks,
    openTray: actor => CardRPGTray.openFor(actor),
    levelUp: actor => LevelUpPane.openFor(actor),
    /*
     * **Any creature in the roster, on demand.** The starter world builds the goblin line and
     * nothing else -- forty-seven monsters in a new world is a world nobody can find anything in --
     * so the rest arrive when a GM asks for one by name, with the deck its capabilities earn.
     */
    buildMonster,
    /*
     * **A Cleansing, and the cure that is the other road.**  **[BUILT 2026-11-24]**
     *
     * A downtime challenge is run at the table -- the GM keeps the Progress and Pressure tracks --
     * so the engine owes it only the payout, the same arrangement `liftInjury` has. Here rather
     * than on a sheet button for the same reason: a button would imply the software decided the
     * challenge was won.
     */
    cleanse: resolveCleansing,
    /*
     * **Ending a transformation is a thing somebody has to do**, and nothing in this system owns a
     * timer that survives a reload -- so the duration on the card is what the table reads and this
     * is how it is settled. A form that expired silently would be worse than one that waits.
     */
    endTransformation,
    /*
     * **Nothing here grants a level.**  [RETIRED 2026-11-13] It raised `system.levels.pending` from a
     * A member of this object raised the award counter from a macro, as the + on the character
     * sheet did from the sheet. The counter is retired and all three of its keys went with it: leveling 2 says *the GM says when* and then *no experience
     * points, no thresholds, **no tracking***, so a number on the milestone was the one piece of
     * bookkeeping the rules had refused. It is a sentence at the table now, and the level-up pane
     * accepts a marked node whenever one is marked.
     */
  };

  /*
   * Assemble the graph before anything reads it. The engine starts on core content, because
   * graph.mjs is imported long before a setting can be read -- so this is the moment the world's
   * own nodes join it, and the only moment they can.
   *
   * A bad edit set is refused whole and announced: a half-applied graph is worse than a rejected
   * one, since a character derives everything from it.
   */
  const edits = game.settings.get("cardrpg", "graphEdits") ?? {};
  const faults = rebuildGraph(edits);
  if (faults.length) {
    console.error("Card RPG | graph edits refused:", faults);
    if (game.user.isGM) {
      ui.notifications.error(game.i18n.format("CARDRPG.Level.GraphRefused",
        { faults: faults.join("; ") }), { permanent: true });
    }
  }

  // Overloaded mutates card state, so it fires on the transition rather than on every recompute.
  /*
   * **[2026-11-12] The load hook is gone with `setOverloaded`.** It existed to notice the moment a
   * character crossed the Overloaded line and move cards in response. The price is derived now, so
   * crossing the line changes `stamina.max` on the next recompute and there is nothing to fire.
   */
  /*
   * **A spell going into somebody's head, which nothing used to notice.**
   *
   * `prepared` is a checkbox on the item sheet and there has never been anything listening -- the
   * slot budget got away with that because it is derived, but the Poison school's price is paid AT
   * preparing and so needs a moment. This is the moment.
   *
   * The change object is what makes it one: `prepared` has to have been turned ON by this update
   * rather than merely be true, or every unrelated edit to a prepared spell would charge for it
   * again. `updateItem` is given that object for exactly this, and the load watcher below is the
   * precedent for reading it.
   */
  /*
   * **A new character gets the ten stacks it plays out of.**  [BUILT 2026-11-14]
   *
   * The schema has had the slots since it was written and nothing but `createStarterContent`
   * ever filled them, and that fills them for one named actor. So every character made the
   * ordinary way -- the sidebar's Create Actor -- arrived with no skill deck, no fate deck and
   * nowhere for a granted card to go. See `buildCharacterDecks` for what each of those costs at
   * the table; the short version is that a menu node spent a level and handed over nothing.
   *
   * On `createActor` rather than on a button, because the question *does this character have a
   * skill deck* has exactly one right answer and nobody should have to ask it.
   *
   * **`activeGM` and not `isGM`**, which is the difference between one set of stacks and one
   * per connected GM: the builder is idempotent per SLOT, so two GMs racing would both find the
   * slots empty and both fill them. Foundry elects a single GM client for exactly this, and it
   * also covers the case this hook most needs to cover -- a PLAYER making their own character,
   * where no GM created anything and so no GM-side `userId` check would fire.
   */
  /*
   * **And a creature gets the five it draws out of.**  **[FIXED 2026-11-23]**
   *
   * The same hook and the same argument, one road later: a creature dragged out of the bestiary
   * compendium arrived with no decks either, and a creature with no FATE deck is one that silently
   * stops obeying three rules -- its saving throws draw no card, dropping it to 0 draws no injury,
   * and neither says anything in chat. See `buildCreatureDecks`, which has the measurement.
   *
   * Both in one handler because they are one question asked of two types, and the builders are
   * each a no-op on the other's: ordering them is not a decision anybody should have to make
   * twice.
   */
  Hooks.on("createActor", async actor => {
    if (!(game.users.activeGM?.isSelf ?? game.user.isGM)) return;
    const made = await buildCharacterDecks(actor);
    if (made) {
      ui.notifications?.info(`Card RPG: built ${made} card stacks for ${actor.name}, `
        + "including their skill deck.");
    }
    const beastly = await buildCreatureDecks(actor);
    if (beastly) {
      ui.notifications?.info(`Card RPG: wired ${beastly} card stacks for ${actor.name}, `
        + "including the fate deck its kind draws from.");
    }
  });

  /*
   * **One charger for two doors.**  **[FIXED 2026-11-24]**
   *
   * Preparing is written in two places now -- the slate sheet's checkbox and the character sheet's
   * Prepare button, which is new -- and the price is collected here for both, which is why neither
   * of them charges anything itself. A cost paid at the call site would be paid twice the day a
   * third door opens.
   *
   * **`activeGM` and not `isGM`**, for the reason the actor hook gives: `isGM` is every connected
   * GM, so two of them at one table billed a caster twice for one spell; and it is also what
   * covers the case this most needs to cover, a PLAYER preparing their own spell, where no
   * GM-side `userId` check would fire at all. Foundry elects a single GM client for exactly this.
   */
  /*
   * **Derived data that is counted from the decks has to be recomputed when a deck changes.**
   * **[FIXED 2026-11-24]**
   *
   * `taint`, `afflicted`, `wounds` and the Health penalty that follows from Afflicted are all
   * counted out of the Cards documents an actor points at -- and a card is not embedded in the
   * actor, so **creating one does not re-prepare the actor at all.** Foundry re-prepares a document
   * when the document or something embedded in it changes; a Card lives in a Cards document, which
   * is neither.
   *
   * So the numbers were right whenever anything else happened to touch the actor and stale until
   * then: three Taint in the decks and `afflicted` reading false, which is a true statement about
   * the prepared data and a false one about the game. Found by a live probe asserting the
   * threshold still bites, which it did not until something re-prepared the hero.
   *
   * **Filtered on the type, because the alternative is re-preparing every actor on every draw.**
   * Only these two kinds are counted into derived data; an action card moving between a deck and a
   * hand changes `actionDeck.size`, which is counted the same way -- so it is in the set too, and
   * the set is the list of what `#countCards` is asked for rather than a guess.
   *
   * **Every client, because derived data is per-client.** The hook fires wherever the change
   * arrives, and each client re-prepares its own copy -- which is the same reason the tray's own
   * refresh listens to the same three hooks.
   */
  const COUNTED_INTO_DERIVED = new Set(["taint", "wound", "action"]);
  const recount = card => {
    if (!COUNTED_INTO_DERIVED.has(card?.type)) return;
    const stack = card.parent?.id;
    if (!stack) return;
    for (const actor of game.actors ?? []) {
      if (!Object.values(actor.system?.decks ?? {}).includes(stack)) continue;
      /*
       * **`reset` and not `prepareData`, and the difference is a one-way ratchet.**
       * **[FIXED 2026-11-24]**
       *
       * `prepareData` re-runs the derivation **over the already-derived data**; `reset` throws the
       * derived data away and re-initializes from the source first. That matters here because this
       * model clamps a stored value in place -- `health.value = min(health.value, health.max)` --
       * so running the derivation twice applies the clamp to its own output.
       *
       * Measured: three Taint take the maximum from 12 to 9 and the clamp writes the value down to
       * 9; take the Taint away and `prepareData` computes `min(9, 12)`, which is **9 for ever**.
       * The source still said 12, the sheet said 9, and no later update could put it right because
       * every one of them re-derived from the ratcheted value. The hero walked out of one probe
       * three Health down and the probe after it reported *the hero started at full health: 9*.
       *
       * A derivation that is not idempotent must not be invited to run twice. `reset` is the call
       * written for exactly that, and `_initialize` is all it does.
       */
      actor.reset();
      /* The tray redraws off the same hooks already; a sheet standing open does not. */
      if (actor.sheet?.rendered) actor.sheet.render(false);
    }
  };
  for (const hook of ["createCard", "updateCard", "deleteCard"]) Hooks.on(hook, recount);

  Hooks.on("updateItem", async (item, change) => {
    if (item.type !== "spell" || change?.system?.prepared !== true) return;
    if (!item.parent) return;
    if (!(game.users.activeGM?.isSelf ?? game.user.isGM)) return;
    await payToPrepare(item.parent, item);
  });
  /*
   * **[2026-11-12] Three item hooks went with `onLoadChanged`.** They fired on every item create,
   * update and delete to notice a character crossing the Overloaded line and move cards for it.
   * The price is a derived clause on `stamina.max` now, so weight changing recomputes a number and
   * there is nothing left to listen for.
   */

  /*
   * The Sidestep trigger (core-rules 11). A hit is an event the resolver owns; an ARRIVAL is not --
   * nothing resolves a move, because moving is dragging a token -- so it needs a hook of its own,
   * and without one the reaction stays the word on a card it was until 30 October.
   *
   * `preUpdateToken` is where the old square still exists, so it is stashed for the pair below.
   * GM-only, so one client fires it rather than one per connected player.
   */
  Hooks.on("preUpdateToken", (token, change, options) => {
    if (change.x === undefined && change.y === undefined) return;
    options.cardrpgFrom = { x: token.x, y: token.y };
  });
  Hooks.on("updateToken", async (token, change, options) => {
    if (!game.user.isGM) return;
    if (change.x === undefined && change.y === undefined) return;
    const mover = token.actor;
    const from = options.cardrpgFrom;
    if (!mover || !from || !canvas?.ready) return;
    /*
     * **The square it is going to, out of the update itself.** Not the document and not the
     * placeable: see `onArrival`.
     */
    await onArrival(mover, from, token,
      { x: change.x ?? token.x, y: change.y ?? token.y });
  });

  await ensureSetupMacro();

  // The grid is square and distances are Chebyshev: a diagonal step costs the same as a straight
  // one (core-rules 11). In Foundry that is the "Equidistant" diagonal rule, a scene setting we
  // can't force from here -- so warn rather than silently measure distances wrongly.
  const scene = canvas?.scene;
  if (scene && scene.grid?.diagonals !== CONST.GRID_DIAGONALS.EQUIDISTANT) {
    console.warn("Card RPG | Scene diagonal rule is not Equidistant; Chebyshev distances will be wrong.");
  }
  console.log("Card RPG | Ready");
});

/**
 * An enemy ended its move. Everyone it has just come to stand next to may answer it.
 *
 * "ENDS its movement next to you", and arriving is the load-bearing word: the square has to be new
 * AND the mover has to have been out of reach before it. A goblin already in your face that shuffles
 * one square has not arrived, and answering that would cost a card for nothing -- the simulator
 * measures both readings and this is the one it measures by default (`sidestep_mode`).
 */
async function onArrival(mover, from, moved = null, to = null) {
  const size = canvas.grid.size;
  const reach = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) / size <= 1;
  /*
   * **Where it is GOING, taken out of the update.**  [FIXED 2026-11-16]
   *
   * This asked the actor for `getActiveTokens()[0]` and compared that position against the square
   * the figure came from, and it was wrong twice over.
   *
   * A **placeable** reports its old square, or 0,0, until the canvas has drawn the move -- measured
   * the same day: a document at 500,400 beside its own placeable at 0,0, in the same breath. So
   * reading the placeable made this depend on whether a frame had been drawn, which is exactly the
   * shape of a probe that answered *true once and false once* on identical runs.
   *
   * **And the document is no better during a move.** Foundry moves a token through a movement
   * pipeline: `updateToken` fires as the movement BEGINS -- `options._movement` is right there in
   * the options -- and the document's own x and y lag behind it. Traced, after the placeable was
   * ruled out: `entered > same square`, with `from` at 500,600 and the destination 600,600.
   *
   * So the routine returned having done nothing, every time, for everything hung on it: **no
   * Sidestep when a figure arrived next to somebody, no held shot when one crossed a watched lane,
   * no ground under where it landed, no trap sprung.** Four rules, all silent.
   *
   * The update knows. `change.x` is the square it is going to, and the hook has had it all along.
   */
  const now = to && Number.isFinite(to.x)
    ? { x: to.x, y: to.y, width: moved?.width ?? 1, height: moved?.height ?? 1 }
    : moved ?? mover.getActiveTokens?.()[0]?.document ?? null;
  if (!now || (now.x === from.x && now.y === from.y)) return;
  const middle = d =>
    ({ x: d.x + (size * (d.width ?? 1)) / 2, y: d.y + (size * (d.height ?? 1)) / 2 });

  for (const placed of canvas.tokens.placeables) {
    const doc = placed.document;
    const who = placed.actor;
    if (!doc || !who || who.id === mover.id || who.type === mover.type) continue;
    if (!reach(doc, now) || reach(doc, from)) continue;      // not an arrival, for this one
    await answerArrival(who, mover);
  }

  /*
   * **And then the held shots, which are a different question.**
   *
   * The loop above asks every neighbour *did it stop next to me*. That question has no ranged
   * answer, which is why an archer holding a drawn bow had no rule to hold it with: the arrival
   * trigger is adjacency and always was.
   *
   * `watch` asks *did it walk into the ground I am covering*, and the ground is the weapon's range
   * through an arc on the facing. Entering is what matters, the same way arriving is: a figure
   * already in the lane that shuffles one square inside it has not walked into anything, so a
   * watcher who covered the old square too is not asked.
   */
  /*
   * **What the ground they just walked onto puts on them.**  [2026-11-16] Ground phase 2.
   *
   * The other half of a zone's condition, and the half a turn tick cannot cover: you are wet when
   * you step into the water, not at the start of your next turn. The tick renews it while you
   * stand there; this is what starts it.
   */
  await imposeGround(mover, now);

  /*
   * **And anything laid for them, which springs after the ground has taken hold.**  [2026-11-16]
   * Ground phase 3. The order matters for exactly one card: *Set* both slows and springs, and
   * springing is what deletes the zone -- so a trap that went off first would be a trap that never
   * slowed anybody.
   */
  await springTraps(mover, middle(now));

  /*
   * **The held shots last**, because answering an arrival is somebody else's decision and the
   * ground is not. [2026-11-16] These two sat behind `answerWatch` for an afternoon and a trap
   * never went off once: whatever that resolver decides, a trap under the square was already
   * under it before anybody chose to shoot.
   */
  await answerWatch(mover, middle(now), from);
}

/**
 * Carried weight changes whenever a slate is added, altered or removed, so the Overloaded
 * transition has to be checked there too -- not just on actor updates.
 */
/*
 * **[2026-11-12] `onLoadChanged` is gone**, for the same reason as the hook above: picking a load
 * up or putting it down now changes a derived number and moves no cards.
 */
