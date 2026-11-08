/**
 * Card RPG for Foundry VTT 14.
 *
 * Playtest build: combat only. Out-of-combat play, character creation and levelling come later.
 * Design docs live beside this folder in foundry/ and rules/.
 */

import { CARDRPG } from "./module/config.mjs";
import { registerSheets } from "./module/sheets.mjs";
import { createStarterContent, ensureSetupMacro, buildMonster } from "./module/setup.mjs";
/* A transformation is ended by somebody, because nothing here owns a timer that survives a
 * reload -- so the duration on the card is what the table reads and this is how it is settled. */
import { endTransformation, payToPrepare } from "./module/resolve.mjs";
import { CardRPGCombat, registerCombatHooks } from "./module/combat.mjs";
import { CardRPGTray, registerTrayHooks } from "./module/tray.mjs";
import { registerCheckHooks } from "./module/checks.mjs";
import { registerEnrichers, registerEnricherClicks } from "./module/enrichers.mjs";
import { LevelUpPane } from "./module/levelup.mjs";
import * as decks from "./module/decks.mjs";
import { answerArrival } from "./module/resolve.mjs";
/* The graph is assembled at runtime from core content plus whatever the world has added. */
import { rebuildGraph } from "./module/graph.mjs";
import { CharacterData, NpcData } from "./module/data/actors.mjs";
import { ItemSlateData, FeatureSlateData, SpellSlateData } from "./module/data/items.mjs";
import {
  ActionCardData, FateCardData, NpcCardData, WoundCardData, TaintCardData, FearCardData,
  DoubtCardData, WildCardData,
  SkillCardData, TwistCardData
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
    wild: WildCardData,
    // The skill side's own card: one approach and a value (skill-rules 1).
    skill: SkillCardData,
    // The GM's deck: what a Partial costs and what a Fail does instead (skill-rules 4).
    twist: TwistCardData
  };

  // --- combat
  // Initiative is individual and drawn once from each combatant's own fate deck, with ties
  // redrawn (core-rules 3). Foundry's formula is unused; CardRPGCombat overrides the roll.
  CONFIG.Combat.documentClass = CardRPGCombat;
  CONFIG.Combat.initiative = { formula: "0", decimals: 0 };
  registerCombatHooks();
  registerTrayHooks();
  /* A check's result moves a challenge track, and only the GM's client may write a scene
   * flag -- so the recording hangs off the message rather than off the roll (checks.mjs). */
  registerCheckHooks();
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
    "systems/cardrpg/templates/parts/steps.hbs"
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

  game.settings.register("cardrpg", "overloadedSpent", {
    name: "CARDRPG.Settings.OverloadedSpent.Name",
    hint: "CARDRPG.Settings.OverloadedSpent.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: d.overloadedSpent
  });
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
     * **Ending a transformation is a thing somebody has to do**, and nothing in this system owns a
     * timer that survives a reload -- so the duration on the card is what the table reads and this
     * is how it is settled. A form that expired silently would be worse than one that waits.
     */
    endTransformation,
    /* So a GM can grant from a macro as well as from the sheet. */
    grantLevel: async (actor, n = 1) => actor.update({
      "system.levels.pending": Math.max(0, (actor.system.levels?.pending ?? 0) + n)
    })
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
  Hooks.on("updateActor", async (actor, change) => {
    if (!game.user.isGM || actor.type !== "character") return;
    const touchesLoad = foundry.utils.hasProperty(change, "system.cash")
      || foundry.utils.hasProperty(change, "system.carry");
    if (!touchesLoad) return;
    const overloaded = ["overloaded", "immobile"].includes(actor.system.encumbrance);
    await decks.setOverloaded(actor, overloaded);
  });
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
  Hooks.on("updateItem", async (item, change) => {
    if (item.type !== "spell" || change?.system?.prepared !== true) return;
    if (!item.parent || !game.user.isGM) return;
    await payToPrepare(item.parent, item);
  });
  Hooks.on("createItem", item => onLoadChanged(item));
  Hooks.on("updateItem", item => onLoadChanged(item));
  Hooks.on("deleteItem", item => onLoadChanged(item));

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
    await onArrival(mover, from);
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
async function onArrival(mover, from) {
  const size = canvas.grid.size;
  const reach = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) / size <= 1;
  const now = mover.getActiveTokens()[0];
  if (!now || (now.x === from.x && now.y === from.y)) return;

  for (const placed of canvas.tokens.placeables) {
    const who = placed.actor;
    if (!who || who.id === mover.id || who.type === mover.type) continue;
    if (!reach(placed, now) || reach(placed, from)) continue;      // not an arrival, for this one
    await answerArrival(who, mover);
  }
}

/**
 * Carried weight changes whenever a slate is added, altered or removed, so the Overloaded
 * transition has to be checked there too -- not just on actor updates.
 */
async function onLoadChanged(item) {
  if (!game.user.isGM) return;
  const actor = item.parent;
  if (!actor || actor.type !== "character") return;
  const overloaded = ["overloaded", "immobile"].includes(actor.system.encumbrance);
  await decks.setOverloaded(actor, overloaded);
}
