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
/* One answer to "is there art on this", shared with the tray rather than spelled twice -- and
 * one answer to "what does this card say", for the deck list the Deck tab grew. */
import { artOf, isIntruder, intruderLine, deckOf, cardName, cardLine } from "./decks.mjs";
import { isSole } from "./monsters.mjs";
/* What a spell costs, asked of the one routine that charges it: the sheet and the card in the tray
 * must not be able to quote different bills for the same cast. See `spellPrice`. */
import { spellPrice, priceWords } from "./resolve.mjs";

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

/**
 * **Every card this character owns, and where each one is standing.**  [BUILT 2026-11-14]
 *
 * The Deck tab counted them -- *14 cards (limit 12-20), draw 5, hand 5, discard 4* -- and showed
 * none of them. So the one surface in the whole system that is supposed to answer *what is in my
 * deck* could answer only *how many*, and the only way to read your own deck was to play until
 * each card came round.
 *
 * It is a **list and not a hand**: one line per card, printed values, no pictures resolved against
 * what you are holding (`cardLine`). The tray paints cards because you are choosing between five
 * of them; a deck is twenty and is read down a column.
 *
 * **Where** is the other half of it, and it is the half a count cannot give you at all. A card in
 * the Spent pile is out of this fight; one in the discard comes back on the next cycle; one in
 * quarantine is somewhere a transformation put it. Those are three different answers to *can I
 * draw this* and the deck size is the same number for all three.
 *
 * Sorted by name across the piles rather than grouped by pile, because the question is about the
 * deck and not about the piles -- and a card you are looking for should be findable without
 * knowing where it currently is.
 */
function describeDeck(actor, piles) {
  const rows = [];
  for (const [which, where] of piles) {
    const stack = actor.system.decks?.[which] ? deckOf(actor, which) : null;
    for (const card of stack?.cards ?? []) {
      rows.push({
        id: card.id,
        name: cardName(card),
        art: artOf(card),
        line: cardLine(card),
        where,
        /* A Wound, a Taint or a Fear is in the deck and was never chosen (core-rules 8). It is
         * marked, because a deck list that shows it as an ordinary card is answering *what do I
         * own* with *what is clogging it*. */
        intruder: isIntruder(card),
        reaction: card.system?.reaction
          ? game.i18n.localize(CARDRPG.reactions[card.system.reaction]?.label ?? card.system.reaction)
          : ""
      });
    }
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
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
      dropNode: CharacterSheet.#onDropNode,
      toggleEquipped: CharacterSheet.#onToggleEquipped,
      toggleDrained: CharacterSheet.#onToggleDrained,
      togglePrepared: CharacterSheet.#onTogglePrepared,
      addCondition: CharacterSheet.#onAddCondition,
      removeCondition: CharacterSheet.#onRemoveCondition,
      editSlate: CharacterSheet.#onEditSlate,
      deleteSlate: CharacterSheet.#onDeleteSlate,
      addEntry: CharacterSheet.#onAddEntry,
      removeEntry: CharacterSheet.#onRemoveEntry,
      rowMenu: CharacterSheet.#onRowMenu,
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
    /* The label names spells first because that is what somebody opening this tab is looking
     * for: a feature is read once and a prepared list is changed between every fight. */
    { id: "features", label: "Spells & features" },
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
    /*
     * **A slate nobody can see is a slate nobody has.** An injury is a feature you did not choose
     * (core-rules 8), and it sits beside them on this tab rather than in a panel of its own --
     * which is the honest layout, because what the character can do and what was done to them are
     * read together or not at all.
     */
    const injuries = slates.filter(i => i.type === "injury");
    /*
     * **The spells, which this sheet had never shown.**  **[FIXED 2026-11-24]**
     *
     * Reported from a table as *spells are not visible on player sheet, spells cannot be viewed or
     * edited*, and both halves were one omission: a spell is an embedded Item like a feature or an
     * injury and there was no list of them anywhere on this surface. `SlateSheet` has handled the
     * type since it was written -- strength, source, the four prices, `prepared`, the effect steps
     * -- so a spell was fully editable and completely unreachable. The only way in was the Items
     * sidebar, which holds the world's spells and not a character's.
     *
     * What that cost is more than browsing. **Preparing is done by writing `prepared`** and
     * nothing else does it (`payToPrepare`), so a caster could not choose what was in their head:
     * the tray's spell deck greys the book and says *what is prepared changes between fights*, and
     * there was no surface anywhere on which to change it.
     *
     * **Prepared first, then the book**, which is the tray's order and the tray's argument: those
     * are the ones you can do something with.
     */
    const spells = slates.filter(i => i.type === "spell")
      .sort((a, b) => (b.system.prepared ? 1 : 0) - (a.system.prepared ? 1 : 0)
        || a.name.localeCompare(b.name));

    // Group equipped gear by slot so the sheet mirrors the slot rules rather than a flat list.
    const equipped = {};
    for (const [key, cfg] of Object.entries(CARDRPG.slots)) {
      if (key === "pack") continue;
      equipped[key] = {
        label: game.i18n.localize(cfg.label),
        capacity: system.slotCapacity(key),
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
      /*
       * The price in words rather than a number per purse, because that is what the card in the
       * tray prints and the two are the same call. A **scaled** price moves as the line forms, so
       * it is worked out now rather than read off the slate.
       */
      spells: spells.map(slate => {
        const timing = slate.system.effect?.timing ?? "";
        const rule = timing ? CARDRPG.timings[timing] : null;
        /* What it costs to have in your head, which is what a reader wants to know -- and NOT
         * `slotCost`, which is what it is costing right now and so reads 0 for every spell in the
         * book. The same distinction the Prepare button is refused on. */
        const slots = slate.system.outsideBudget ? 0 : (slate.system.strength ?? 0);
        const price = priceWords(spellPrice(actor, slate)).join(", ");
        /*
         * **Two lines, and they are two different costs.**  **[BUILT 2026-11-24]**
         *
         * What a spell costs to **keep** is slots, paid once when it goes into your head and held
         * for as long as it is there. What it costs to **cast** is Health, Taint, Strain or skill
         * cards, paid every single time. Printing them as one list reads as a single bill and the
         * difference is the whole of how a caster plans a day, so they are two sentences.
         *
         * **And a cast that costs nothing says so**, which is the row that matters most: 117 of
         * the 147 spells in the content print no price at all, so *nothing* is the common answer
         * and a blank where the price goes cannot be told from a price nobody filled in.
         *
         * Assembled here rather than in the template: optional pieces joined by separators that
         * belong to none of them is a paragraph of `{{#if}}` for a sentence, and the sentence is
         * the thing being got right.
         */
        const keep = [
          slate.system.source,
          slate.system.outsideBudget
            ? "no slot \u2014 never prepared"
            : `${slots} slot${slots === 1 ? "" : "s"} while prepared`,
          rule ? game.i18n.localize(rule.label) : ""
        ].filter(Boolean).join(" \u00b7 ");
        return {
          doc: slate,
          prepared: !!slate.system.prepared,
          /* Cast, and so used up until a long rest (`payToCast`). A prepared spell has two states
           * now and the row has to say which. */
          spent: !!slate.system.drained,
          slots,
          price,
          keep,
          /*
           * **What a cast takes, and the preparation is part of it.**  **[RULED 2026-11-24]**
           *
           * The words come from `priceWords`, which is what the tray's card prints and what
           * `payToCast` charges -- and the preparation is charged there too now, so it is named
           * here. A spell that prints no price is not a free spell: it costs the spell.
           */
          cast: [price, "the preparation \u2014 back on a long rest"]
            .filter(Boolean).join(", "),
          when: rule ? game.i18n.localize(rule.label) : "",
          /* What the effect says, for a reader rather than a caster: the tray's card is the thing
           * you click, this is the thing you look up. */
          text: slate.system.effect?.text ?? ""
        };
      }),
      /* Used and free, so a caster can see the budget without adding the column up. `free` is
       * derived on the actor, which is also what the Prepare button is refused against. */
      slotBudget: {
        used: system.spellSlots?.used ?? 0,
        free: system.spellSlots?.free ?? 0,
        max: system.spellSlots?.max ?? 0
      },
      features: features.map(f => ({ doc: f, drain: describeDrain(f) })),
      injuries: injuries.map(i => {
        const cat = CARDRPG.injuryCategories[i.system.category] ?? {};
        return {
          doc: i,
          category: game.i18n.localize(cat.label ?? i.system.category),
          icon: cat.icon ?? "",
          // The ritual, or the sentence that says there is not one. Never a blank.
          lift: i.system.liftedBy
            ? `Lifted by a ${i.system.liftedBy}`
            : "No ritual lifts it",
          lasts: i.system.permanent
            ? "Permanent"
            : `Heals after ${i.system.healsIn} days of rest`
        };
      }),
      /* What is still open, so the GM can see the cap without counting. */
      injuryRoom: Object.entries(CARDRPG.injuryCategories)
        .filter(([key]) => !injuries.some(i => i.system.category === key))
        .map(([, cat]) => game.i18n.localize(cat.label)).join(", "),

      // Deck validation: 12-20 cards, the maximum raised by features. Wounds and Taint don't count,
      // so a wounded character is never locked out of adding a card.
      deck: {
        size: deckSize,
        min: deckMin,
        max: deckMax,
        underMin: deckSize > 0 && deckSize < deckMin,
        overMax: deckSize > deckMax,
        counts: system.deckCounts ?? {},
        /*
         * The cards themselves, which this tab has never shown. Both decks, because a character
         * owns two and *what can I do out of combat* is as much a deck question as the other one
         * -- and the skill deck is the one nothing in the interface has ever listed at all.
         */
        cards: describeDeck(actor, [
          ["action", "Deck"],
          ["actionHand", "Hand"],
          ["actionDiscard", "Discard"],
          ["actionSpent", "Spent"],
          ["quarantine", "Away"]
        ]),
        skills: describeDeck(actor, [
          ["skill", "Deck"],
          ["skillHand", "Hand"],
          ["skillDiscard", "Discard"]
        ])
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

      /*
       * **[2026-11-13] The three joined strings are gone.** They were here because an `ArrayField`
       * does not round-trip through a text input -- and the answer to that is not to make the
       * separator part of the data, it is to edit the list as a list. The entries partial reads
       * `system.trainings` and the two beside it directly, and `addEntry`/`removeEntry` write
       * them, so nothing is joined, split, or re-parsed anywhere.
       */
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
      /*
       * **Where you are from and what you did, as words.**  [BUILT 2026-11-15]
       *
       * Both are creation nodes and both were visible only as a row in the GM's node list, which
       * is a debugging view: the two facts a player states first about their character were the
       * two the sheet never said. Derived rather than stored, like level and title, because the
       * node list is the record and a second copy is a second thing to be wrong.
       *
       * A character may hold only one of each -- they are `exclusive` groups -- so the first is
       * the answer rather than a list.
       */
      origin: (system.nodes ?? []).filter(id => id.startsWith("origin."))
        .map(id => GRAPH.get(id)?.name).filter(Boolean)[0] ?? "",
      occupation: (system.nodes ?? []).filter(id => id.startsWith("background."))
        .map(id => GRAPH.get(id)?.name).filter(Boolean)[0] ?? "",
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

  /*
   * **[RETIRED 2026-11-13] The three lists no longer travel as text.** This split a comma-joined
   * training list and a semicolon-joined know-how list back into arrays, which meant the
   * separator was part of the data and a piece of know-how could not contain one. They are edited
   * as entries now and written straight to the array, so there is nothing to parse back.
   */

  /* -------------------------------------------- */

  /**
   * Two things a `data-action` cannot express: a key, and a click somewhere else.
   *
   * **Enter adds the entry**, because typing a word and reaching for a button is not how anybody
   * fills in a list of three things.
   *
   * **And a click outside shuts the open menu.** A menu that only closes by pressing its own dots
   * again is a menu that stays open, and the sheet then has two of them disagreeing about which
   * row a click belongs to.
   */
  _onRender(context, options) {
    super._onRender?.(context, options);
    for (const input of this.element.querySelectorAll(".cr-entry__new")) {
      input.addEventListener("keydown", event => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        input.parentElement?.querySelector('[data-action="addEntry"]')?.click();
      });
    }
    this.element.addEventListener("click", event => {
      if (event.target.closest(".cr-menu")) return;
      for (const open of this.element.querySelectorAll(".cr-menu--open")) {
        open.classList.remove("cr-menu--open");
      }
    });
  }

  /* -------------------------------------------- */

  /**
   * **Add one entry to one of the short lists under `system`.**
   *
   * Case-insensitively unique, because "Imperial" and "imperial" are one language and a list that
   * holds both is a list nobody can count. The field is named by the button rather than looked up
   * from the markup around it, so the partial works wherever it is dropped.
   */
  static async #onAddEntry(event, target) {
    const field = target.dataset.field;
    const input = target.closest(".cr-entries__add")?.querySelector(".cr-entry__new");
    const value = (input?.value ?? "").trim();
    if (!field || !value) return;
    const list = [...(this.actor.system[field] ?? [])];
    if (!list.some(entry => entry.toLowerCase() === value.toLowerCase())) list.push(value);
    if (input) input.value = "";
    await this.actor.update({ [`system.${field}`]: list });
  }

  /**
   * **Remove one, by index.**
   *
   * By index and never by text: `prune` matched an escaped name against a raw one and removed
   * nothing at all, after the level had been spent. An index cannot be mangled on its way through
   * HTML, and it is the only identifier a list of plain strings has.
   */
  static async #onRemoveEntry(event, target) {
    const field = target.dataset.field;
    const index = Number(target.dataset.index);
    const list = [...(this.actor.system[field] ?? [])];
    if (!field || !Number.isInteger(index) || index < 0 || index >= list.length) return;
    list.splice(index, 1);
    await this.actor.update({ [`system.${field}`]: list });
  }

  /**
   * **The row's own menu.**
   *
   * *Edit* opens a document the player will touch once a session, and it sat on every row of
   * every list shouting as loudly as the name beside it. It lives behind the dots now, and only
   * one menu is open at a time: two would be a guess about which one a click belongs to.
   */
  static #onRowMenu(event, target) {
    const menu = target.closest(".cr-menu");
    const open = menu?.classList.contains("cr-menu--open");
    for (const other of this.element.querySelectorAll(".cr-menu--open")) {
      other.classList.remove("cr-menu--open");
    }
    if (!open) menu?.classList.add("cr-menu--open");
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
   * **Nothing here grants a level any more.**  [RETIRED 2026-11-13] A + and a - sat on every
   * character sheet raising the award counter, which the level-up pane then spent. Counter and
   * controls are both gone: leveling 2 says *the GM says when* and then *no experience points, no
   * thresholds, **no tracking***, so a number on the milestone was the one piece of bookkeeping
   * the rules had refused. It is a sentence at the table, and the pane accepts a marked node
   * whenever one is marked. `takeNode` in graph.mjs carries the argument.
   *
   * The action name and the field are deliberately NOT written out above: a check greps this file
   * for both, and a comment quoting what it forbids answers the grep with prose about itself.
   * That has happened four times in this project and it is easier to walk into than it looks.
   */

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

    /*
     * **Nothing is refunded, because there is nothing to refund.**  [2026-11-13] This used to hand
     * the award back as well, so that correcting a mistake was not also a penalty for making it.
     * That argument was about a counter, and the counter is retired; with the milestone back to
     * being a sentence at the table, taking the node off IS the correction and the player picks
     * again. (The field is not named here, for the reason given on the retired grant above.)
     */
    await this.actor.update({ "system.nodes": nodes });
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
   * Apply a condition. The creator matters: a duration ticks down at the **end** of the creator's
   * turn, which is what makes a duration-1 condition last through the creator's next one.
   *
   * **The round has to be stamped here too**, which is the cost of this being the second place in
   * the codebase that builds a condition record -- `resolveCondition` is the other. Without it the
   * round reads null, the tick has nothing to compare against, and a condition a GM drops on a
   * token during that creature's own turn is gone at the end of it.
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
      creatorId: root.querySelector("[data-condition-creator]")?.value ?? "",
      round: game.combat?.round ?? null
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

  /**
   * **Put a spell in your head, or take it out.**  **[BUILT 2026-11-24]**
   *
   * `prepared` is a boolean the data model has carried since it was written and **nothing in the
   * game ever set it** except the item sheet's own checkbox, which no surface linked to. So the
   * one decision a caster makes between fights -- which spells are in your head -- could not be
   * made at all.
   *
   * **Refused over budget, rather than allowed and reported.** `spellSlots.free` is derived from
   * the prepared spells and capped by any vow, so preparing past it writes a state the rules do
   * not have, and nothing anywhere would have objected. Un-preparing is never refused: putting a
   * spell back in the book cannot break a budget.
   *
   * **The price is not charged here**, and that is deliberate. `payToPrepare` hangs off the
   * `updateItem` hook, which is what makes the item sheet's checkbox cost the same as this button
   * -- one charger for two doors. A charge here as well would bill a caster twice for one spell.
   */
  static async #onTogglePrepared(event, target) {
    const slate = this.document.items.get(target.dataset.slateId);
    if (!slate || slate.type !== "spell") return;
    const want = !slate.system.prepared;
    /*
     * **A spell already cast cannot be put back in the book.**  **[RULED 2026-11-24]**
     *
     * Without this the ruling leaks in one click. Casting consumes the preparation and a long rest
     * restores it -- but if a spent spell could be un-prepared, its slot would come free, another
     * spell could go into it on the spot, and a caster with three slots and twenty spells would
     * have twenty casts a day. The slot is what the long rest is really about: it holds a used-up
     * spell until you sleep, which makes `spellSlots` the per-day budget it reads as.
     *
     * Putting an UNSPENT spell back is still free, because *what is prepared changes between
     * fights* and that was never the thing being limited.
     */
    if (!want && slate.system.drained) {
      return ui.notifications.warn(`${slate.name} has been cast. A used-up spell stays in its `
        + "slot until a long rest, so it cannot go back in the book yet.");
    }
    /*
     * **`strength`, not `slotCost`.**  [FIXED 2026-11-24]
     *
     * `slotCost` is what the spell is costing *right now* and returns **0 while it is still in
     * the book** -- which is exactly the state this button is asked about, so reading it made
     * every Prepare free and the refusal below unreachable. A live probe prepared a strength-99
     * spell into a three-slot budget and said so.
     *
     * `outsideBudget` is still honoured, because a ritual never costs a slot whatever its
     * strength (data/items.mjs), and that getter is the one place that says which spells those
     * are.
     */
    const cost = slate.system.outsideBudget ? 0 : (slate.system.strength ?? 0);
    const free = this.document.system.spellSlots?.free ?? 0;
    if (want && cost > free) {
      return ui.notifications.warn(`${slate.name} takes ${cost} slot`
        + `${cost === 1 ? "" : "s"} and ${this.document.name} has ${free} free. `
        + "Put something back in the book first.");
    }
    await slate.update({ "system.prepared": want });
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
      editSlate: NpcSheet.#onEditSlate,
      /* The HUD runs a monster now, and this sheet used to be where the HUD sent you instead. */
      openTray: NpcSheet.#onOpenTray
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
      allTactics: CARDRPG.tactics,

      /*
       * **The six passive scores, and what each one falls back to.**  [BUILT 2026-11-15]
       *
       * This sheet had no passive field at all -- not the six, not the baseline -- so the one
       * number that says how hard a creature is to hold, trick, outrun or shout down was
       * editable only through the console. The roster derives all six, so what a GM is doing here
       * is almost always overruling one of them for one creature, which is why the row shows the
       * number it would otherwise fall back to rather than only an empty box.
       */
      passives: Object.keys(CARDRPG.approaches).filter(key => key !== "any").map(key => ({
        key,
        label: game.i18n.localize(CARDRPG.approaches[key]?.label ?? key),
        icon: CARDRPG.approaches[key]?.icon ?? "",
        value: system.passives?.[key] ?? null,
        /* Not `passiveScore(actor, key)`: that would print the value back into the box's hint and
         * so read "falls back to 6" beside a 6 somebody typed. The fallback is the baseline. */
        fallback: system.passive
      }))
    });
  }

  /**
   * **This sheet is no longer the answer to *where do I play it from*.**  [2026-11-14]
   *
   * It used to be, by elimination: the HUD refused NPCs outright and told you to run them from
   * here, and nothing here can attack with anything. Selecting the token is the usual way in --
   * the HUD follows the selection now -- and this is the way in when the token is not placed.
   */
  static #onOpenTray() {
    game.cardrpg.openTray(this.document);
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
      /*
       * **An injury is a feature, for everything the editor shows.** It extends the feature slate,
       * so `isFeature` is true for one as well -- which is the point of that inheritance: a
       * negative grant is edited in the same box as a positive one, and nothing had to be built
       * twice. `isInjury` adds the three fields a feature has no use for.
       */
      isFeature: slate.type === "feature" || slate.type === "injury",
      isInjury: slate.type === "injury",
      isSpell: slate.type === "spell",
      injuryCategories: CARDRPG.injuryCategories,
      approaches: CARDRPG.approaches,
      elements: CARDRPG.elements,
      reactions: CARDRPG.reactions,
      /* The three prices that started doing something on 2026-11-21 and had nowhere to be edited:
       * a field the engine charges and the sheet cannot set is the same half-built shape from the
       * other side. */
      costScales: CARDRPG.costScales,
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
      /*
       * **A card only one creature can draw, flagged so a GM can see it in a hand.**
       *
       * Four cards in five in an NPC deck are the same four whichever creature you are looking at,
       * which is why the common pool exists. So the rare card that is this creature's alone is the
       * one worth picking out without reading, and a deck where everything looks equally generic
       * hides its own best card.
       */
      isSole: type === "npc" && isSole(card.system),
      isWound: type === "wound",
      isTaint: type === "taint",
      isFear: type === "fear",
      isDoubt: type === "doubt",
      /*
       * One predicate and one line, both from the table in decks.mjs. This used to be a second
       * disjunction naming the two intruders that existed, and the template behind it was worse:
       * it printed the Wound text or ELSE the Taint text, so a third kind of intruder would have
       * rendered with somebody else's rules on its face and nothing would have complained.
       */
      isHarm: isIntruder(card),
      harmLine: intruderLine(card),
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
    types: ["item", "feature", "injury", "spell"], makeDefault: true, label: "CARDRPG.Sheet.Slate"
  });
  DocumentSheetConfig.registerSheet(Card, "cardrpg", CardConfigSheet, {
    types: ["action", "fate", "npc", "crit", "wound", "taint", "fear", "doubt", "rage", "compulsion",
      "confusion", "wild", "skill", "twist"],
    makeDefault: true, label: "CARDRPG.Sheet.Card"
  });
}
