/**
 * Sheets.
 *
 * The sheet is the reference surface: inventory, features, deck building, biography. The things that
 * change moment to moment live on the tray instead (foundry/hud-spec.md). So these are deliberately
 * plain -- readable, editable, not pretty.
 */

import { CARDRPG } from "./config.mjs";
import { LevelUpPane } from "./levelup.mjs";
/* The node index, so the sheet can name what it is taking back rather than printing an id. */
import { GRAPH } from "./graph.mjs";
/* One answer to "is there art on this", shared with the tray rather than spelled twice. */
import { artOf } from "./decks.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2, ItemSheetV2 } = foundry.applications.sheets;
const { DocumentSheetConfig } = foundry.applications.apps;

/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */

/** Condition records decorated with their label, icon and whether they are derived. */
function describeConditions(system) {
  return (system.activeConditions ?? []).map(c => {
    const cfg = CARDRPG.conditions[c.key] ?? {};
    return {
      ...c,
      label: cfg.label ? game.i18n.localize(cfg.label) : c.key,
      icon: cfg.icon,
      derived: !!cfg.derived,
      creator: c.creatorId ? game.actors.get(c.creatorId)?.name ?? null : null
    };
  });
}

/** A slate's recharge, as it reads on the face. */
function describeDrain(slate) {
  if (!slate.system.isActive) return null;
  return {
    label: slate.system.rechargeLabel,
    drained: slate.system.drained,
    remaining: slate.system.drainedFor,
    icon: CARDRPG.effects.charging.icon
  };
}

/* -------------------------------------------- */
/*  Character                                   */
/* -------------------------------------------- */

export class CharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["cardrpg", "sheet", "actor", "character"],
    position: { width: 640, height: 720 },
    form: { submitOnChange: true },
    window: { resizable: true },
    actions: {
      // NOT "tab": ApplicationV2 reserves that action and routes it to its own
      // changeTab(), which demands a tab-group identifier we do not use.
      switchTab: CharacterSheet.#onTab,
      openTray: CharacterSheet.#onOpenTray,
      levelUp: CharacterSheet.#onLevelUp,
      grantLevel: CharacterSheet.#onGrantLevel,
      dropNode: CharacterSheet.#onDropNode,
      toggleEquipped: CharacterSheet.#onToggleEquipped,
      toggleDrained: CharacterSheet.#onToggleDrained,
      addCondition: CharacterSheet.#onAddCondition,
      removeCondition: CharacterSheet.#onRemoveCondition,
      editSlate: CharacterSheet.#onEditSlate,
      deleteSlate: CharacterSheet.#onDeleteSlate,
      shortRest: CharacterSheet.#onShortRest,
      longRest: CharacterSheet.#onLongRest
    }
  };

  static PARTS = {
    main: { template: "systems/cardrpg/templates/actor-character.hbs", scrollable: [".cr-sheet__body"] }
  };

  static TAB_LIST = [
    { id: "vitals", label: "Vitals" },
    { id: "deck", label: "Deck" },
    { id: "gear", label: "Gear" },
    { id: "features", label: "Features" },
    { id: "notes", label: "Notes" }
  ];

  /** Kept on the instance, so switching tabs needs no document write. */
  tab = "vitals";

  /* -------------------------------------------- */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system;

    const slates = actor.items.contents;
    const items = slates.filter(i => i.type === "item");
    const features = slates.filter(i => i.type === "feature");

    // Group equipped gear by slot so the sheet mirrors the slot rules rather than a flat list.
    const equipped = {};
    for (const [key, cfg] of Object.entries(CARDRPG.slots)) {
      if (key === "pack") continue;
      equipped[key] = {
        label: game.i18n.localize(cfg.label),
        capacity: cfg.capacity,
        icon: cfg.icon,
        items: items.filter(i => i.system.equippedSlot === key)
      };
    }

    const deckSize = system.actionDeck.size ?? 0;
    const deckMax = system.actionDeck.max ?? 0;
    const deckMin = system.actionDeck.min ?? 0;

    return Object.assign(context, {
      actor,
      system,
      config: CARDRPG,
      isGM: game.user.isGM,

      pendingLevels: system.levels?.pending ?? 0,
      tab: this.tab,
      tabs: CharacterSheet.TAB_LIST.map(t => ({ ...t, active: t.id === this.tab })),
      onVitals: this.tab === "vitals",
      onDeck: this.tab === "deck",
      onGear: this.tab === "gear",
      onFeatures: this.tab === "features",
      onNotes: this.tab === "notes",

      // Index comes from the stored list, not the displayed one: the displayed list has the two
      // derived conditions appended, and removing by display index would delete the wrong entry.
      conditions: describeConditions(system).map(c => ({
        ...c,
        index: system.conditions.findIndex(stored =>
          stored.key === c.key && stored.creatorId === c.creatorId)
      })),
      conditionChoices: Object.entries(CARDRPG.conditions)
        .filter(([, cfg]) => !cfg.derived)
        .map(([key, cfg]) => ({ key, label: game.i18n.localize(cfg.label) })),
      actorChoices: game.actors
        .filter(a => a.id !== actor.id)
        .map(a => ({ id: a.id, name: a.name })),

      equipped,
      pack: items.filter(i => !i.system.equipped),
      features: features.map(f => ({ doc: f, drain: describeDrain(f) })),

      // Deck validation: 12-20 cards, the maximum raised by features. Wounds and Taint don't count,
      // so a wounded character is never locked out of adding a card.
      deck: {
        size: deckSize,
        min: deckMin,
        max: deckMax,
        underMin: deckSize > 0 && deckSize < deckMin,
        overMax: deckSize > deckMax,
        counts: system.deckCounts ?? {}
      },

      encumbrance: {
        tier: system.encumbrance,
        label: game.i18n.localize(`CARDRPG.Encumbrance.${system.encumbrance?.capitalize() ?? "Unburdened"}`),
        carried: system.carry.value ?? 0,
        max: system.carry.max ?? 0,
        // Precomputed rather than done with template maths, so the template needs no arithmetic
        // helpers and the bar can exceed 100% without breaking.
        pct: Math.min(100, Math.round(100 * (system.carry.value ?? 0) / Math.max(1, system.carry.max ?? 1))),
        isOverloaded: system.encumbrance === "overloaded",
        isImmobile: system.encumbrance === "immobile"
      },

      // ArrayFields don't round-trip through a text input, so they are joined for display and
      // split again in _prepareSubmitData.
      trainingsText: (system.trainings ?? []).join(", "),
      knowHowText: (system.knowHow ?? []).join("; "),
      languagesText: (system.languages ?? []).join(", "),
      /*
       * What the GRAPH added, separated from what was typed in. `system.learned` has been derived
       * since the nodes were wired and nothing ever read it, so every training and piece of
       * know-how a node granted was computed and thrown away -- which is most of what the 29
       * bespoke minor nodes exist to hand over. Shown apart from the editable field, because a
       * derived value you can type over is a value that disagrees with itself.
       */
      /*
       * Three derived values existed and nothing read them, which an audit of the whole model
       * turned up: `waysOwned`, `frontier` and `armorDoubled`. A derived value nobody reads is
       * work the sheet does on every render and throws away, and -- worse -- a claim nothing
       * tests. All three are information a player needs, so they are shown rather than deleted.
       */
      /* In the order they were taken, which is the order the tie-break reads (graph.mjs). */
      ownedNodes: (system.nodes ?? []).map(id => ({
        id,
        name: GRAPH.get(id)?.name ?? id,
        title: GRAPH.get(id)?.title ?? ""
      })),
      waysWalked: (system.waysOwned ?? [])
        .map(id => game.i18n.localize(CARDRPG.ways[id] ?? id)).join(", "),
      frontierCount: (system.frontier ?? []).length,
      fromNodes: {
        trainings: (system.learned?.trainings ?? []).filter(t => !(system.trainings ?? []).includes(t)),
        knowHow: (system.learned?.knowHow ?? []).filter(k => !(system.knowHow ?? []).includes(k))
      },

      // Shown only when the GM asked for it, since it is a per-table taste call.
      fateSwing: game.settings.get("cardrpg", "showFateSwing") && system.fateSwing !== null
        ? Math.round(system.fateSwing * 100)
        : null,

      ways: CARDRPG.ways
    });
  }

  /* -------------------------------------------- */

  /** Turn the two comma/semicolon lists back into arrays. */
  _prepareSubmitData(event, form, formData, updateData) {
    const data = super._prepareSubmitData(event, form, formData, updateData);
    const split = (value, sep) => String(value ?? "")
      .split(sep).map(s => s.trim()).filter(s => s.length);
    if ("trainingsText" in data.system) {
      data.system.trainings = split(data.system.trainingsText, ",");
      delete data.system.trainingsText;
    }
    if ("knowHowText" in data.system) {
      data.system.knowHow = split(data.system.knowHowText, ";");
      delete data.system.knowHowText;
    }
    if ("languagesText" in data.system) {
      data.system.languages = split(data.system.languagesText, ",");
      delete data.system.languagesText;
    }
    return data;
  }

  /* -------------------------------------------- */

  static #onTab(event, target) {
    this.tab = target.dataset.tab;
    this.render();
  }

  static #onOpenTray() {
    game.cardrpg.openTray(this.document);
  }

  /*
   * The graph is readable whether or not there is a level to spend. rules/leveling.md 2 says the GM
   * says when, so a player with no pending level opens a map and a planner rather than a refusal --
   * which is also the only way to see what a branch costs before committing to its first node.
   */
  static #onLevelUp() {
    LevelUpPane.openFor(this.document);
  }

  /*
   * rules/leveling.md 2: *the GM says when*. No experience points and no thresholds, so the only
   * thing that can raise a pending level is a GM deciding one happened -- and until this control
   * existed, the pane's Accept button could never light up for anyone.
   */
  static async #onGrantLevel(event, target) {
    if (!game.user.isGM) return;
    const by = Number(target.dataset.by ?? 1);
    const now = this.document.system.levels?.pending ?? 0;
    await this.document.update({ "system.levels.pending": Math.max(0, now + by) });
  }

  /**
   * Take a node back off a character.
   *
   * The pane only ever adds, so until this existed a mis-clicked node was permanent -- and because
   * everything derives from the node list (leveling 9), a wrong node is a wrong Health, title,
   * Tactic and frontier for ever. The same asymmetry says what this canNOT do: a card or a slate
   * the node handed over is a **document**, created once, so removing the node leaves it behind.
   * That is stated rather than guessed at, and the level comes back so the fix is not a punishment.
   */
  static async #onDropNode(event, target) {
    if (!game.user.isGM) return;
    const id = target.dataset.node;
    const nodes = (this.actor.system.nodes ?? []).filter(n => n !== id);
    if (nodes.length === (this.actor.system.nodes ?? []).length) return;

    const node = GRAPH.get(id);
    const gave = node?.grants ?? {};
    const documents = ["card", "feature", "item", "spell"].filter(k => gave[k]);
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: `Take back ${node?.name ?? id}?` },
      content: `<div class="cardrpg"><p>Everything derived from it goes with it: level, title,
        Tactic, and any numbers it granted.</p>`
        + (documents.length
          ? `<p><strong>${documents.map(k => gave[k]).join(", ")}</strong> stays behind.</p>`
            + `<p class="cr-note">A card or a slate is a document, created once. Delete it by hand
               if it should go.</p>`
          : "")
        + "</div>",
      rejectClose: false
    });
    if (!ok) return;

    await this.actor.update({
      "system.nodes": nodes,
      /* The level comes back, so correcting a mistake is not also a penalty for making it. */
      "system.levels.pending": (this.actor.system.levels?.pending ?? 0) + 1
    });
  }

  static async #onToggleEquipped(event, target) {
    const slate = this.document.items.get(target.dataset.slateId);
    if (!slate) return;
    await slate.update({ "system.equipped": !slate.system.equipped });
  }

  static async #onToggleDrained(event, target) {
    const slate = this.document.items.get(target.dataset.slateId);
    if (!slate) return;
    const drained = !slate.system.drained;
    await slate.update({
      "system.drained": drained,
      // A numeric recharge starts counting the owner's turns from now.
      "system.drainedFor": drained ? (slate.system.active.turns ?? null) : null
    });
  }

  /**
   * Apply a condition. The creator matters: a duration ticks down at the start of the creator's
   * turn, which is what makes a duration-1 condition cost the victim exactly one turn.
   */
  static async #onAddCondition(event, target) {
    const root = target.closest(".cr-add-condition");
    const key = root.querySelector("[data-condition-key]")?.value;
    if (!key) return;

    const raw = root.querySelector("[data-condition-duration]")?.value;
    const cfg = CARDRPG.conditions[key] ?? {};
    const duration = cfg.noDuration || raw === "" ? null : Number(raw);

    const conditions = this.document.system.toObject().conditions ?? [];
    conditions.push({
      key,
      duration,
      creatorId: root.querySelector("[data-condition-creator]")?.value ?? ""
    });
    await this.document.update({ "system.conditions": conditions });
  }

  static async #onRemoveCondition(event, target) {
    const index = Number(target.dataset.index);
    if (index < 0) return;
    const conditions = this.document.system.toObject().conditions.filter((c, i) => i !== index);
    await this.document.update({ "system.conditions": conditions });
  }

  static async #onShortRest() {
    const { rest } = await import("./decks.mjs");
    await rest(this.document, { long: false });
  }

  static async #onLongRest() {
    const { rest } = await import("./decks.mjs");
    await rest(this.document, { long: true });
  }

  static #onEditSlate(event, target) {
    this.document.items.get(target.dataset.slateId)?.sheet.render({ force: true });
  }

  static async #onDeleteSlate(event, target) {
    await this.document.items.get(target.dataset.slateId)?.delete();
  }
}

/* -------------------------------------------- */
/*  NPC                                         */
/* -------------------------------------------- */

export class NpcSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["cardrpg", "sheet", "actor", "npc"],
    position: { width: 560, height: 620 },
    form: { submitOnChange: true },
    window: { resizable: true },
    actions: {
      toggleMotivation: NpcSheet.#onToggleMotivation,
      toggleTactic: NpcSheet.#onToggleTactic,
      editSlate: NpcSheet.#onEditSlate
    }
  };

  static PARTS = {
    main: { template: "systems/cardrpg/templates/actor-npc.hbs", scrollable: [".cr-sheet__body"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system;

    return Object.assign(context, {
      actor,
      system,
      config: CARDRPG,
      isGM: game.user.isGM,
      conditions: describeConditions(system),
      gear: actor.items.filter(i => i.type === "item"),

      // revealed is mechanical: the rules give four ways for players to learn a motivation or see a
      // tactic fire, and a revealed one should then show on the player side as earned leverage.
      tactics: system.tactics.map(key => ({
        key,
        label: game.i18n.localize(CARDRPG.tactics[key] ?? key),
        revealed: system.revealedTactics.includes(key)
      })),
      motivations: system.motivations.map((m, index) => ({ ...m, index })),
      targetPriorities: CARDRPG.targetPriorities,
      allTactics: CARDRPG.tactics
    });
  }

  static async #onToggleMotivation(event, target) {
    const index = Number(target.dataset.index);
    const motivations = this.document.system.toObject().motivations;
    if (!motivations[index]) return;
    motivations[index].revealed = !motivations[index].revealed;
    await this.document.update({ "system.motivations": motivations });
  }

  static async #onToggleTactic(event, target) {
    const key = target.dataset.key;
    const revealed = new Set(this.document.system.revealedTactics);
    revealed.has(key) ? revealed.delete(key) : revealed.add(key);
    await this.document.update({ "system.revealedTactics": [...revealed] });
  }

  static #onEditSlate(event, target) {
    this.document.items.get(target.dataset.slateId)?.sheet.render({ force: true });
  }
}

/* -------------------------------------------- */
/*  Slates                                      */
/* -------------------------------------------- */

export class SlateSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["cardrpg", "sheet", "slate"],
    position: { width: 520, height: 600 },
    form: { submitOnChange: true },
    window: { resizable: true }
  };

  static PARTS = {
    main: { template: "systems/cardrpg/templates/item-slate.hbs", scrollable: [".cr-sheet__body"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const slate = this.document;
    return Object.assign(context, {
      slate,
      system: slate.system,
      config: CARDRPG,
      isItem: slate.type === "item",
      isFeature: slate.type === "feature",
      isSpell: slate.type === "spell",
      approaches: CARDRPG.approaches,
      elements: CARDRPG.elements,
      reactions: CARDRPG.reactions,
      verbs: CARDRPG.verbs,
      conditions: CARDRPG.conditions,
      drain: describeDrain(slate),
      slots: CARDRPG.slots,
      groups: CARDRPG.bonusGroups,
      recharges: CARDRPG.recharges,
      tags: CARDRPG.itemTags
    });
  }
}

/* -------------------------------------------- */
/*  Cards                                       */
/* -------------------------------------------- */

/**
 * One config sheet for every card subtype. Cards are small and mostly authored in compendiums, so a
 * single branching form beats five near-identical sheets.
 */
export class CardConfigSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.CardConfig ?? foundry.applications.api.DocumentSheetV2
) {
  static DEFAULT_OPTIONS = {
    classes: ["cardrpg", "sheet", "card"],
    position: { width: 640, height: 680 },
    form: { submitOnChange: true },
    window: { resizable: true },
    actions: {
      addStep: CardConfigSheet.#onAddStep,
      removeStep: CardConfigSheet.#onRemoveStep
    }
  };

  static PARTS = {
    main: { template: "systems/cardrpg/templates/card-config.hbs", scrollable: [".cr-sheet__body"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const card = this.document;
    const type = card.type;

    return Object.assign(context, {
      card,
      system: card.system,
      config: CARDRPG,
      type,
      isAction: type === "action",
      isFate: type === "fate",
      isNpcCard: type === "npc",
      isWound: type === "wound",
      isTaint: type === "taint",
      isHarm: type === "wound" || type === "taint",
      isWild: type === "wild",
      isSkill: type === "skill",
      /*
       * The steps, as data to edit rather than a face to read. The face above is still rendered,
       * because what a card LOOKS like is the thing being edited and a sheet that only showed
       * fields would make a GM compile the card in their head.
       */
      steps: {
        primary: [...(card.system.primary ?? [])],
        secondary: [...(card.system.secondary ?? [])],
        sequence: [...(card.system.sequence ?? [])],
        steps: [...(card.system.steps ?? [])]
      },
      /* The two halves, so the cost boxes are a loop rather than four hand-written fields. */
      halves: ["primary", "secondary"].map(key => ({
        key,
        label: key === "primary" ? "Primary" : "Secondary",
        spent: !!card.system.costs?.[key]?.spent,
        strain: card.system.costs?.[key]?.strain ?? 0
      })),
      /* What it will look like once there is a picture, which is most of why a GM opens this. */
      art: artOf(card),
      face: CardConfigSheet.#face(card),
      reactions: CARDRPG.reactions,
      approaches: CARDRPG.approaches
    });
  }

  /* -------------------------------------------- */

  /**
   * Add a step to one of a card's lists.
   *
   * An ArrayField is replaced wholesale rather than appended to, which is Foundry's rule for
   * arrays and not a preference: a partial update to an array is ambiguous about what happened to
   * the entries nobody mentioned. So the list is read, extended and written back.
   */
  static async #onAddStep(event, target) {
    const key = target.dataset.list;
    const list = [...(this.document.system[key] ?? [])].map(s => s.toObject?.() ?? s);
    list.push({});
    await this.document.update({ [`system.${key}`]: list });
  }

  /** Take one out, by index. The order IS the content: "Move 3, then Strike" is not the reverse. */
  static async #onRemoveStep(event, target) {
    const key = target.dataset.list;
    const at = Number(target.dataset.index);
    const list = [...(this.document.system[key] ?? [])].map(s => s.toObject?.() ?? s);
    if (at < 0 || at >= list.length) return;
    list.splice(at, 1);
    await this.document.update({ [`system.${key}`]: list });
  }

  /* -------------------------------------------- */

  /**
   * Render a face from its steps. A signed number is a modifier and a bare one a parameter, which
   * is the whole numeric convention -- so it is resolved here rather than guessed at in the markup.
   */
  static #face(card) {
    const step = s => {
      const icon = CARDRPG.verbs[s.verb]?.icon ?? CARDRPG.effects[s.verb]?.icon ?? null;
      let num = "";
      if (s.mod !== null && s.mod !== undefined) num = s.mod >= 0 ? `+${s.mod}` : String(s.mod);
      else if (s.param !== null && s.param !== undefined) num = String(s.param);
      const bits = [];
      if (s.range) bits.push(`range ${s.range}`);
      // Reach is not range (items.mjs): a polearm is long, not ranged, and the face has to say which.
      if (s.reach) bits.push(`reach ${s.reach}${s.reachMin > 1 ? ` from ${s.reachMin}` : ""}`);
      if (s.area) bits.push(`${s.areaKind || "blast"} ${s.area}`);
      if (s.text) bits.push(s.text);
      return { icon, num, text: bits.join(", ") };
    };

    switch (card.type) {
      case "action":
        return {
          primary: (card.system.primary ?? []).map(step),
          secondary: (card.system.secondary ?? []).map(step),
          reaction: card.system.reaction
            ? game.i18n.localize(CARDRPG.reactions[card.system.reaction]?.label ?? card.system.reaction)
            : null
        };
      case "fate":
        return { label: card.system.label };
      case "npc":
        return { sequence: (card.system.sequence ?? []).map(step) };
      default:
        return {};
    }
  }
}

/* -------------------------------------------- */
/*  Registration                                */
/* -------------------------------------------- */

export function registerSheets() {
  DocumentSheetConfig.registerSheet(Actor, "cardrpg", CharacterSheet, {
    types: ["character"], makeDefault: true, label: "CARDRPG.Sheet.Character"
  });
  DocumentSheetConfig.registerSheet(Actor, "cardrpg", NpcSheet, {
    types: ["npc"], makeDefault: true, label: "CARDRPG.Sheet.Npc"
  });
  /*
   * **Every subtype gets a sheet.** `spell` was left out when the slate sheet was written and
   * `wild` and `skill` were left out of the card sheet, which meant 24 formulas and miracles, the
   * twelve Wild Magic cards and every skill card fell back to Foundry's default -- a sheet that
   * knows nothing about a TypeDataModel and shows a GM nothing they can act on. A subtype with no
   * sheet is content nobody can read, let alone correct, so the validator now counts them.
   */
  DocumentSheetConfig.registerSheet(Item, "cardrpg", SlateSheet, {
    types: ["item", "feature", "spell"], makeDefault: true, label: "CARDRPG.Sheet.Slate"
  });
  DocumentSheetConfig.registerSheet(Card, "cardrpg", CardConfigSheet, {
    types: ["action", "fate", "npc", "wound", "taint", "wild", "skill"],
    makeDefault: true, label: "CARDRPG.Sheet.Card"
  });
}
