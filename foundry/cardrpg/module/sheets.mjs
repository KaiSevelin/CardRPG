/**
 * Sheets.
 *
 * The sheet is the reference surface: inventory, features, deck building, biography. The things that
 * change moment to moment live on the tray instead (foundry/hud-spec.md). So these are deliberately
 * plain -- readable, editable, not pretty.
 */

import { CARDRPG } from "./config.mjs";

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
    position: { width: 480, height: 560 },
    form: { submitOnChange: true },
    window: { resizable: true }
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
      face: CardConfigSheet.#face(card),
      reactions: CARDRPG.reactions
    });
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
  DocumentSheetConfig.registerSheet(Item, "cardrpg", SlateSheet, {
    types: ["item", "feature"], makeDefault: true, label: "CARDRPG.Sheet.Slate"
  });
  DocumentSheetConfig.registerSheet(Card, "cardrpg", CardConfigSheet, {
    types: ["action", "fate", "npc", "wound", "taint"],
    makeDefault: true, label: "CARDRPG.Sheet.Card"
  });
}
