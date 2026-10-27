/**
 * Card RPG for Foundry VTT 14.
 *
 * Playtest build: combat only. Out-of-combat play, character creation and levelling come later.
 * Design docs live beside this folder in foundry/ and rules/.
 */

import { CARDRPG } from "./module/config.mjs";
import { registerSheets } from "./module/sheets.mjs";
import { CharacterData, NpcData } from "./module/data/actors.mjs";
import { ItemSlateData, FeatureSlateData } from "./module/data/items.mjs";
import {
  ActionCardData, FateCardData, NpcCardData, WoundCardData, TaintCardData
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
    feature: FeatureSlateData
  };

  // Card and Cards support document subtypes with a TypeDataModel on `system`, which is what lets
  // action, fate and NPC cards be native typed documents rather than Items pretending to be cards.
  CONFIG.Card.dataModels = {
    action: ActionCardData,
    fate: FateCardData,
    npc: NpcCardData,
    wound: WoundCardData,
    taint: TaintCardData
  };

  // --- combat
  // Initiative is individual and drawn once from each combatant's own fate deck, with ties
  // redrawn (core-rules 3). Foundry's formula is unused; CardRPGCombat overrides the roll.
  CONFIG.Combat.initiative = { formula: "0", decimals: 2 };

  registerSettings();
  registerHelpers();
  registerSheets();
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
    const url = `systems/cardrpg/icons/${key}.svg`;
    return new Handlebars.SafeString(
      `<span class="cr-icon" style="--icon: url('${url}')" data-icon="${key}" data-tooltip="${key}"></span>`
    );
  });

  Handlebars.registerHelper("crEq", (a, b) => a === b);

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

  game.settings.register("cardrpg", "reactionTimer", {
    name: "CARDRPG.Settings.ReactionTimer.Name",
    hint: "CARDRPG.Settings.ReactionTimer.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: d.reactionTimer
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

Hooks.once("ready", () => {
  // The grid is square and distances are Chebyshev: a diagonal step costs the same as a straight
  // one (core-rules 11). In Foundry that is the "Equidistant" diagonal rule, a scene setting we
  // can't force from here -- so warn rather than silently measure distances wrongly.
  const scene = canvas?.scene;
  if (scene && scene.grid?.diagonals !== CONST.GRID_DIAGONALS.EQUIDISTANT) {
    console.warn("Card RPG | Scene diagonal rule is not Equidistant; Chebyshev distances will be wrong.");
  }
  console.log("Card RPG | Ready");
});
