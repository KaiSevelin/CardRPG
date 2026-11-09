/**
 * The level-up pane: the levelling graph, drawn.
 *
 * A level-up is navigational rather than a menu (rules/leveling.md 3) -- you are not picking a
 * prize, you are picking a direction -- so the interface has to be the map. What the player does
 * here is mark one node, read what it gives, change their mind as often as they like, and then
 * accept or cancel. Nothing is written until Accept.
 *
 * Three things this pane refuses to get wrong, each of them a rule rather than a nicety:
 *
 *   - **Adjacency is not eligibility.** A node next to one you own may still be unavailable:
 *     `after[]` is any-one-of, `all` makes it every-one-of, and an exclusive family closes its
 *     rivals for good. `canTake` in graph.mjs is the single decision, and both the paint and the
 *     Accept path call it. A node this pane offers is a node the engine accepts.
 *
 *   - **Four states, not two.** Owned, available now, possible later, closed for good. *Later* and
 *     *closed* look alike on a sheet and are nothing alike in play, and a player who cannot see
 *     which is which cannot plan at all.
 *
 *   - **The one irreversible click gets a second question.** An exclusive node shuts other nodes
 *     permanently (leveling 3), so Accept on one names what it shuts, by name, before it happens.
 *     Everything else in this pane can be had later, and is therefore just Accept.
 *
 * Cytoscape is loaded on first open rather than at world boot: 364 KB is not worth paying for on
 * every client every session for a window most of them will not open today.
 */

import {
  ALL_TACTICS,
  rebuildGraph, GRAPH, SUCCESSORS, DEPTH, ROOT, POOL, SPELLS, SPELLS_BY_SOURCE, SLATES, LANGUAGES,
  ownedIds, closedIds, reachable, canTake, stateOf,
  levelOf, titleOf, describeGrants, wouldClose, takeNode
} from "./graph.mjs";
import { artIn } from "./decks.mjs";
import { CARDRPG } from "./config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { DialogV2 } = foundry.applications.api;

/** Cached across panes: one parse of the library per client, not one per open. */
let cytoscapePromise = null;
function loadCytoscape() {
  cytoscapePromise ??= import("../lib/cytoscape.esm.min.mjs").then(m => m.default ?? m);
  return cytoscapePromise;
}

/* -------------------------------------------- */
/*  Layouts                                     */
/* -------------------------------------------- */

/**
 * The default layout, and the only one that knows what this graph *is*.
 *
 * Depth is already computed from the edges (graph.mjs `DEPTH`), so the layering is free and every
 * edge points the same way -- which is the whole reason to prefer a hierarchy here over a force
 * layout that would put a title above its own trunk. Within a layer, nodes are ordered by the mean
 * position of their predecessors, two passes of it, which is the cheap half of crossing reduction
 * and enough for a graph this size. It is also why the dagre extension is not vendored: 280 KB to
 * do slightly better at the one thing the data already told us.
 */
function tierLayout(ids) {
  const layers = new Map();
  for (const id of ids) {
    const d = DEPTH.get(id) ?? 0;
    if (!layers.has(d)) layers.set(d, []);
    layers.get(d).push(id);
  }
  const order = new Map();
  const depths = [...layers.keys()].sort((a, b) => a - b);
  for (const d of depths) layers.get(d).forEach((id, i) => order.set(id, i));

  for (let pass = 0; pass < 2; pass++) {
    for (const d of depths) {
      const layer = layers.get(d);
      const bary = id => {
        const up = (GRAPH.get(id)?.after ?? []).filter(p => order.has(p));
        if (!up.length) return order.get(id) ?? 0;
        return up.reduce((n, p) => n + order.get(p), 0) / up.length;
      };
      layer.sort((a, b) => bary(a) - bary(b) || a.localeCompare(b));
      layer.forEach((id, i) => order.set(id, i));
    }
  }

  const positions = {};
  const widest = Math.max(...depths.map(d => layers.get(d).length));
  for (const d of depths) {
    const layer = layers.get(d);
    /* Centre each layer against the widest one, so a trunk runs down the middle of its own fan. */
    const offset = (widest - layer.length) / 2;
    layer.forEach((id, i) => {
      positions[id] = { x: d * 210, y: (offset + i) * 92 };
    });
  }
  return positions;
}

/** What the layout picker offers. The first is ours; the rest are Cytoscape's own. */
const LAYOUTS = {
  tiers: { label: "CARDRPG.Level.Layout.Tiers" },
  breadthfirst: { label: "CARDRPG.Level.Layout.Breadthfirst", cy: { name: "breadthfirst", directed: true, spacingFactor: 1.1, roots: [`#${cssId(ROOT)}`] } },
  concentric: { label: "CARDRPG.Level.Layout.Concentric", cy: { name: "concentric", minNodeSpacing: 40, concentric: n => -(DEPTH.get(n.id()) ?? 0), levelWidth: () => 1 } },
  cose: { label: "CARDRPG.Level.Layout.Force", cy: { name: "cose", animate: false, nodeRepulsion: 9000, idealEdgeLength: 90 } },
  grid: { label: "CARDRPG.Level.Layout.Grid", cy: { name: "grid", condense: false, sort: (a, b) => (DEPTH.get(a.id()) ?? 0) - (DEPTH.get(b.id()) ?? 0) } }
};

/** Node ids carry dots, which a Cytoscape selector reads as a class. */
function cssId(id) {
  return id.replace(/[.]/g, "\\.");
}

/* -------------------------------------------- */

export class LevelUpPane extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    /** The node marked but not yet taken. Exactly one, or none. */
    this.tentative = null;
    this.layout = "tiers";
    this.cy = null;
  }

  /**
   * One pane per actor, keyed by actor id. Without this two characters' panes share the window id
   * ApplicationV2 derives from the class, and opening the second one re-renders the first against
   * the wrong character -- which looks like the graph forgetting what it had marked.
   */
  static #open = new Map();

  static openFor(actor) {
    if (!actor || actor.type !== "character") {
      if (actor) ui.notifications.warn(game.i18n.localize("CARDRPG.Level.CharactersOnly"));
      return null;
    }
    let pane = LevelUpPane.#open.get(actor.id);
    if (!pane || pane.rendered === undefined) {
      pane = new LevelUpPane(actor, { uniqueId: actor.id });
      LevelUpPane.#open.set(actor.id, pane);
    }
    pane.render({ force: true });
    return pane;
  }

  static DEFAULT_OPTIONS = {
    id: "cardrpg-levelup-{id}",
    classes: ["cardrpg", "cr-levelup"],
    position: { width: 1040, height: 700 },
    window: { title: "CARDRPG.Level.Pane", resizable: true, icon: "fa-solid fa-diagram-project" },
    actions: {
      accept: LevelUpPane.#onAccept,
      cancelPick: LevelUpPane.#onCancelPick,
      refit: LevelUpPane.#onRefit,
      /* Authoring, not playing: these only appear with the world setting on. */
      editNode: LevelUpPane.#onEditNode,
      addNode: LevelUpPane.#onAddNode,
      dropGraphNode: LevelUpPane.#onDropGraphNode
    }
  };

  static PARTS = {
    main: { template: "systems/cardrpg/templates/levelup.hbs" }
  };

  get title() {
    return `${game.i18n.localize("CARDRPG.Level.Pane")} — ${this.actor.name}`;
  }

  /* -------------------------------------------- */

  async _prepareContext(options) {
    const owned = ownedIds(this.actor);
    const closed = closedIds(owned);
    return {
      ...(await super._prepareContext(options)),
      actor: this.actor,
      level: levelOf(owned),
      title: titleOf(owned) ?? game.i18n.localize("CARDRPG.Level.NoTitle"),
      pending: this.actor.system.levels?.pending ?? 0,
      counts: {
        owned: owned.size - 1,
        available: GRAPH.size && [...GRAPH.keys()].filter(id => canTake(id, owned, closed)).length,
        closed: closed.size
      },
      layouts: Object.entries(LAYOUTS).map(([key, l]) => ({
        key, label: game.i18n.localize(l.label), selected: key === this.layout
      })),
      /*
       * The authoring lock. A graph edited under a running campaign changes characters who are not
       * in the room, because everything about them derives from the nodes they own -- so this is a
       * world setting a GM turns on deliberately, and the editor does not exist without it.
       */
      editing: game.user.isGM && game.settings.get("cardrpg", "graphEditing")
    };
  }

  /* -------------------------------------------- */

  async _onRender(context, options) {
    await super._onRender(context, options);

    const host = this.element.querySelector(".cr-graph");
    if (!host) return;

    const cytoscape = await loadCytoscape();
    this.cy?.destroy();
    /* A fresh canvas has not been fitted yet, whatever the last one did. */
    this.fitted = false;
    this.cy = cytoscape({
      container: host,
      elements: this.#elements(),
      style: STYLE,
      /* Pan and zoom are the pane's whole navigation; the bounds keep a stray wheel from losing
       * the graph entirely, which is easy to do and annoying to undo. */
      minZoom: 0.25,
      maxZoom: 2.5,
      wheelSensitivity: 0.25,
      layout: { name: "preset", positions: tierLayout([...GRAPH.keys()]), fit: true, padding: 40 }
    });

    /* A territory is scenery, not a node: tapping one picks nothing and says nothing. */
    this.cy.on("tap", "node", ev => {
      if (ev.target.isParent()) return;
      this.#onPick(ev.target.id());
    });
    this.cy.on("tap", ev => { if (ev.target === this.cy) this.#pick(null); });

    this.element.querySelector("[name=layout]")?.addEventListener("change", ev => {
      this.layout = ev.target.value;
      this.#runLayout();
    });

    this.#watchSize(host);
    this.#renderDetail();
  }

  /**
   * **Cytoscape measures its container once, when it is constructed, and this pane hands it a box
   * that has no size yet.**
   *
   * `.cr-graph` takes its height entirely from flex: `flex: 1 1 auto` inside a body that is
   * `flex: 1 1 auto` inside a frame that is `height: 100%`. Every one of those resolves against the
   * window, and an ApplicationV2 window is **injected before it is sized** -- so at `_onRender` the
   * box is 0 tall, the canvas is built 0x0, and nothing is ever drawn on it again. The border is
   * CSS on the div and shows up regardless, which is why the result reads as *the graph is empty*
   * rather than *the graph is broken*: the frame is there, the counts beside it are right, and the
   * 207 nodes are all present in a canvas with no pixels.
   *
   * **Refit did not help either**, and that is the tell. `layout({ fit: true })` fits the graph to
   * the viewport Cytoscape believes it has, and it believed it had none.
   *
   * So the box is watched rather than measured once. It also answers the other half: this window
   * has a resize handle, and a graph that ignored the drag would be the same bug on a slower clock.
   *
   * **`resize` always, `fit` only the first time.** The canvas has to track the box or it is wrong
   * again; the view must not, because this pane's whole premise is that a player comparing two
   * nodes keeps their pan and zoom (see the template). Fitting on every resize would snatch the
   * view back each time the window moved.
   */
  #watchSize(host) {
    this.sizer?.disconnect();
    if (typeof ResizeObserver === "undefined") return;
    this.sizer = new ResizeObserver(() => {
      if (!this.cy || this.cy.destroyed?.()) return;
      /* A box with no size is the state we are waiting out, not one to resize into. */
      if (!host.clientWidth || !host.clientHeight) return;
      this.cy.resize();
      if (!this.fitted) {
        this.cy.fit(undefined, 40);
        this.fitted = true;
      }
    });
    this.sizer.observe(host);
  }

  /** Cytoscape holds the canvas; closing the window has to take it down with it. */
  async _preClose(options) {
    /* The observer holds the host element and the instance; dropping the canvas without it would
     * leave a callback firing into a destroyed graph every time the window moved. */
    this.sizer?.disconnect();
    this.sizer = null;
    this.cy?.destroy();
    this.cy = null;
    LevelUpPane.#open.delete(this.actor?.id);
    return super._preClose(options);
  }

  /* -------------------------------------------- */
  /*  Building the graph                          */
  /* -------------------------------------------- */

  #elements() {
    const owned = ownedIds(this.actor);
    const closed = closedIds(owned);
    const live = reachable(owned, closed);
    const nodes = [];
    const edges = [];

    /*
     * One parent per Way, which is what turns 169 boxes into four places. A compound parent sizes
     * itself around its children, so nothing is laid out twice -- and it carries the Way's name
     * where the player is already looking rather than in a legend they have to find.
     *
     * Only Ways that have a branch get one: an empty territory would be a label round nothing.
     */
    const ways = new Set([...GRAPH.keys()].map(wayOf).filter(w => w !== "root"));
    for (const way of ways) {
      const paint = WAY_COLOUR[way] ?? WAY_COLOUR.root;
      /* `art` explicitly, because a territory grants nothing and so has no picture -- and a node
       * datum with no `art` at all is the same unreadable value as an empty one. The `:parent`
       * rule below sets `background-image: none` too, but the `node` rule is applied first and is
       * where the parse happens. */
      nodes.push({ data: { id: `territory-${way}`, label: paint.label, ...paint, art: "none" } });
    }

    for (const [id, node] of GRAPH) {
      const way = wayOf(id);
      const paint = WAY_COLOUR[way] ?? WAY_COLOUR.root;
      nodes.push({
        data: {
          id,
          label: node.name ?? id,
          kind: node.title ? "major" : "minor",
          state: stateOf(id, owned, closed, live),
          way,
          fill: paint.fill,
          edge: paint.edge,
          /* The Signature's art when the node has one, so a title wears the card it hands over. */
          art: artFor(node),
          ...(ways.has(way) ? { parent: `territory-${way}` } : {})
        }
      });
      /*
       * Which incoming edge is the main route and which is a crossing: the shallowest predecessor
       * is the way this node was meant to be reached, and anything deeper arrived from elsewhere.
       * Computed rather than flagged, so content cannot say one thing and the graph another.
       */
      const after = node.after ?? [];
      const shallowest = after.length
        ? after.reduce((a, b) => ((DEPTH.get(a) ?? 0) <= (DEPTH.get(b) ?? 0) ? a : b))
        : null;
      for (const prereq of after) {
        edges.push({
          data: {
            id: `${prereq}->${id}`, source: prereq, target: id,
            /* An edge takes its colour from where it ARRIVES, so a branch reads as one colour. */
            edge: (WAY_COLOUR[wayOf(id)] ?? WAY_COLOUR.root).edge,
            /* A road already walked: both ends owned. Brighter, because it is your history. */
            walked: owned.has(prereq) && owned.has(id) ? "yes" : "no",
            cross: after.length > 1 && prereq !== shallowest ? "yes" : "no"
          }
        });
      }
    }
    return { nodes, edges };
  }

  #runLayout() {
    if (!this.cy) return;
    const chosen = LAYOUTS[this.layout];
    if (!chosen?.cy) {
      /* The parents are not laid out: a compound node takes its place from its children. */
      this.cy.layout({
        name: "preset", positions: tierLayout([...GRAPH.keys()]), fit: true, padding: 40
      }).run();
      return;
    }
    this.cy.layout({ ...chosen.cy, fit: true, padding: 40 }).run();
  }

  /* -------------------------------------------- */
  /*  Marking one node                            */
  /* -------------------------------------------- */

  /**
   * A tap on a node. Only an *available* node can be marked, and the pane says why when one cannot
   * be -- a click that silently does nothing reads as a broken window rather than a closed door.
   */
  #onPick(id) {
    const owned = ownedIds(this.actor);
    const closed = closedIds(owned);
    const state = stateOf(id, owned, closed);
    /*
     * Whatever was tapped last, available or not. Spending a level needs a node you may take;
     * AUTHORING needs any node at all -- a GM edits the ones a character can never reach as often
     * as the ones they can -- so the two are tracked apart rather than one being widened.
     */
    this.inspecting = id;
    if (state === "available") return this.#pick(id);

    const why = {
      owned: "CARDRPG.Level.AlreadyOwned",
      later: "CARDRPG.Level.NotYet",
      closed: "CARDRPG.Level.Closed"
    }[state];
    ui.notifications?.info(game.i18n.format(why, { name: GRAPH.get(id)?.name ?? id }));
  }

  /* -------------------------------------------- */
  /*  Authoring                                   */
  /* -------------------------------------------- */

  /**
   * Edit a node, or add one.
   *
   * The whole node is a form, because a node IS its fields -- there is no partial edit that makes
   * sense when `after` decides where it sits and `grants` decides what it is for. `after` is a
   * multi-select over every other node rather than a drawn edge: the graph is stored backwards
   * (leveling 8), a node names what it follows, and a list of ids is that stored form exactly.
   *
   * @param {string|null} id the node to edit, or null to add one
   */
  async #editNode(id) {
    const node = id ? GRAPH.get(id) : null;
    const others = [...GRAPH.values()].filter(n => n.id !== id)
      .sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));

    const after = new Set(node?.after ?? []);
    const options = others.map(n =>
      `<option value="${n.id}"${after.has(n.id) ? " selected" : ""}>`
      + `${foundry.utils.escapeHTML(n.name ?? n.id)} &mdash; ${n.id}</option>`).join("");
    const grants = node?.grants ?? {};
    const numberRow = (key, label) =>
      `<label>${label} <input type="number" name="${key}" value="${grants[key] ?? ""}"></label>`;

    const answer = await foundry.applications.api.DialogV2.prompt({
      window: { title: node ? `Edit ${node.name ?? id}` : "A new node" },
      position: { width: 560 },
      content: `<div class="cardrpg cr-nodeedit">
        <label>Id <input type="text" name="id" value="${id ?? ""}"
          ${id ? "readonly" : ""} placeholder="shade.thief.lockpicks"
          data-tooltip="A public interface: an add-on depends on it, so it is renamed about as freely as a database column."></label>
        <label>Name <input type="text" name="name" value="${foundry.utils.escapeHTML(node?.name ?? "")}"></label>
        <label>Follows <select name="after" multiple size="8">${options}</select></label>
        <label><input type="checkbox" name="all" ${node?.all ? "checked" : ""}>
          Needs every one of them &mdash; how depth takes commitment</label>
        <fieldset><legend>If it is a major node</legend>
          <label>Title <input type="text" name="title" value="${foundry.utils.escapeHTML(node?.title ?? "")}"></label>
          <label>Axis <input type="text" name="axis" value="${foundry.utils.escapeHTML(node?.axis ?? "")}"></label>
          <label>Resource <input type="text" name="resource" value="${foundry.utils.escapeHTML(node?.resource ?? "")}"></label>
          <label>Signature <input type="text" name="signature" value="${foundry.utils.escapeHTML(node?.signature ?? "")}"></label>
          <label>Tactic <input type="text" name="tactic" value="${foundry.utils.escapeHTML(node?.tactic ?? "")}"></label>
        </fieldset>
        <fieldset><legend>What it hands over</legend>
          <label>Card <input type="text" name="card" value="${foundry.utils.escapeHTML(grants.card ?? "")}"></label>
          <label>Feature <input type="text" name="feature" value="${foundry.utils.escapeHTML(grants.feature ?? "")}"></label>
          <label>Item <input type="text" name="item" value="${foundry.utils.escapeHTML(grants.item ?? "")}"></label>
          <label>Formula <input type="text" name="spell" value="${foundry.utils.escapeHTML(grants.spell ?? "")}"></label>
          <label>Choice from <select name="choose">
            <option value=""></option>
            ${[...SPELLS_BY_SOURCE.entries()].map(([src, list]) =>
              `<option value="${foundry.utils.escapeHTML(src)}"${
                grants.choose?.from === src ? " selected" : ""}>${
                foundry.utils.escapeHTML(src)} (${list.length})</option>`).join("")}
          </select></label>
          <label>Training <input type="text" name="training" value="${foundry.utils.escapeHTML(grants.training ?? "")}"></label>
          <label>Know-how <input type="text" name="knowHow" value="${foundry.utils.escapeHTML(grants.knowHow ?? "")}"></label>
          <!-- A dropdown and not a text box: the nine are the world's, and a tenth is a fault the
               graph check would refuse anyway -- but it should be refused before the typing. -->
          <label>Language <select name="language">
            <option value="">no language</option>
            ${LANGUAGES.map(l => `<option value="${foundry.utils.escapeHTML(l.name)}"${
              grants.language === l.name ? " selected" : ""}>${
              foundry.utils.escapeHTML(l.name)} \u2014 ${
              foundry.utils.escapeHTML(l.of)}</option>`).join("")}
          </select></label>
          <!-- The two steps a skill card can climb (skill-rules 8). Dropdowns, because an
               approach that is not one of the six is a reward that can never apply. -->
          ${["expertise", "mastery"].map(key => `<label>${
            key === "expertise" ? "Expertise" : "Mastery"} <select name="${key}">
            <option value="">none</option>
            ${Object.entries(CARDRPG.approaches).filter(([k]) => k !== "any")
              .map(([k, cfg]) => `<option value="${k}"${grants[key] === k ? " selected" : ""}>${
                game.i18n.localize(cfg.label ?? k)}</option>`).join("")}
          </select></label>`).join("")}
          ${["health", "handSize", "carry", "deckMax", "spellSlots", "restTokens", "prune"]
            .map(k => numberRow(k, k)).join("")}
        </fieldset>
      </div>`,
      ok: {
        label: node ? "Save it" : "Add it",
        callback: (event, button) => {
          const f = button.form.elements;
          const text = key => (f[key]?.value ?? "").trim();
          const num = key => (f[key]?.value === "" ? undefined : Number(f[key].value));
          const grant = {};
          for (const key of ["card", "feature", "item", "spell", "training", "knowHow",
            "language", "expertise", "mastery"]) {
            if (text(key)) grant[key] = text(key);
          }
          /* A dropdown rather than a text box, so an authored menu node cannot name a school
           * nobody wrote -- which `graphFaults` would refuse anyway, but after the typing. */
          if (text("choose")) grant.choose = { from: text("choose") };
          for (const key of ["health", "handSize", "carry", "deckMax", "spellSlots", "restTokens",
            "prune"]) {
            if (num(key) !== undefined) grant[key] = num(key);
          }
          return {
            id: text("id"),
            name: text("name"),
            after: [...f.after.selectedOptions].map(o => o.value),
            ...(f.all.checked ? { all: true } : {}),
            ...(text("title") ? { title: text("title") } : {}),
            ...(text("axis") ? { axis: text("axis") } : {}),
            ...(text("resource") ? { resource: text("resource") } : {}),
            ...(text("signature") ? { signature: text("signature") } : {}),
            ...(text("tactic") ? { tactic: text("tactic") } : {}),
            ...(Object.keys(grant).length ? { grants: grant } : {})
          };
        }
      },
      rejectClose: false
    });
    if (!answer?.id) return;
    await this.#commit({ replace: answer });
  }

  /**
   * Write an edit set to the world, but only if the result is still a graph.
   *
   * `rebuildGraph` refuses the whole set rather than applying what it can, so this saves the
   * setting **after** the rebuild succeeds -- a stored edit nobody can load would make the world
   * unopenable on the next reload, which is the one failure mode worth engineering against.
   */
  async #commit({ replace = null, remove = null } = {}) {
    const edits = foundry.utils.deepClone(game.settings.get("cardrpg", "graphEdits") ?? {});
    edits.added ??= [];
    edits.removed ??= [];

    if (replace) {
      edits.added = edits.added.filter(n => n.id !== replace.id).concat([replace]);
      edits.removed = edits.removed.filter(id => id !== replace.id);
    }
    if (remove) {
      edits.added = edits.added.filter(n => n.id !== remove);
      if (!edits.removed.includes(remove)) edits.removed.push(remove);
    }

    const faults = rebuildGraph(edits);
    if (faults.length) {
      return ui.notifications.error(faults.join("; "));
    }
    await game.settings.set("cardrpg", "graphEdits", edits);
    this.render();
  }

  static async #onEditNode() {
    if (!this.#canAuthor()) return;
    await this.#editNode(this.tentative ?? this.inspecting ?? null);
  }

  static async #onAddNode() {
    if (!this.#canAuthor()) return;
    await this.#editNode(null);
  }

  /**
   * Take a node out of the graph.
   *
   * **Refused while anybody owns it.** A character stores node ids and derives everything from
   * them, so removing an owned node does not un-grant anything -- it makes the id point at nothing,
   * and the character silently loses whatever it gave with no record that it ever did. Correcting
   * the character is a different job and the sheet already does it.
   */
  static async #onDropGraphNode() {
    if (!this.#canAuthor()) return;
    const id = this.tentative ?? this.inspecting ?? null;
    if (!id) return ui.notifications.info("Pick a node first.");

    const holders = game.actors.filter(a => (a.system?.nodes ?? []).includes(id));
    if (holders.length) {
      return ui.notifications.warn(
        `${GRAPH.get(id)?.name ?? id} is owned by ${holders.map(a => a.name).join(", ")}. `
        + "Take it off them first: removing it here would leave their id pointing at nothing.");
    }
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: `Remove ${GRAPH.get(id)?.name ?? id}?` },
      content: `<div class="cardrpg"><p>Anything that follows it must follow something else, or the
        rebuild is refused and nothing changes.</p></div>`,
      rejectClose: false
    });
    if (ok) await this.#commit({ remove: id });
  }

  /** Authoring is a world setting, and the pane says so rather than hiding the reason. */
  #canAuthor() {
    if (game.user.isGM && game.settings.get("cardrpg", "graphEditing")) return true;
    ui.notifications.info(
      "Editing the graph is off. It changes every character who owns the node, so it is a world "
      + "setting a GM turns on while authoring rather than during a campaign.");
    return false;
  }

  /** Marking a second node unmarks the first: one node, or none. */
  #pick(id) {
    this.tentative = id;
    this.cy?.nodes().removeClass("tentative");
    if (id) this.cy?.getElementById(id).addClass("tentative");
    this.#renderDetail();
  }

  /**
   * The benefit panel, written straight into the DOM rather than by re-rendering. A re-render
   * would rebuild the canvas and throw away the player's pan and zoom on every click, which is
   * exactly the moment they were comparing two nodes.
   */
  #renderDetail() {
    const box = this.element?.querySelector(".cr-levelup__detail");
    if (!box) return;

    if (!this.tentative) {
      box.innerHTML = `<p class="cr-levelup__hint">${game.i18n.localize("CARDRPG.Level.Hint")}</p>`;
      this.#setButtons(false);
      return;
    }

    const node = GRAPH.get(this.tentative);
    const grants = describeGrants(node);
    const owned = ownedIds(this.actor);
    const opens = (SUCCESSORS.get(this.tentative) ?? [])
      .map(id => GRAPH.get(id)?.name ?? id);
    const closes = wouldClose(this.tentative, owned);
    const esc = foundry.utils.escapeHTML;

    const rows = [];
    if (node.title) {
      rows.push(`<p class="cr-levelup__title-row">${game.i18n.localize("CARDRPG.Level.Title")}:
        <strong>${esc(node.title)}</strong></p>`);
      if (node.axis) {
        rows.push(`<p class="cr-levelup__cell">${esc(node.axis)} / ${esc(node.resource ?? "")}</p>`);
      }
      if (node.signature) {
        rows.push(`<p><em>${game.i18n.localize("CARDRPG.Level.Signature")}:</em>
          ${esc(node.signature)}</p>`);
      }
      if (node.tactic) {
        /* The text as well as the name, because a Tactic is the half of a major node that changes
         * where you stand -- and you only keep the deepest one, so a player comparing two titles
         * is comparing the tactics as much as the Signatures. */
        const text = ALL_TACTICS[node.tactic] ?? "";
        rows.push(`<p><em>${game.i18n.localize("CARDRPG.Level.Tactic")}:</em>
          ${esc(node.tactic)}${text ? ` — ${esc(text)}` : ""}</p>`);
      }
    }
    rows.push(grants.length
      ? `<ul class="cr-levelup__grants">${grants.map(g => `<li>${esc(g)}</li>`).join("")}</ul>`
      : `<p class="cr-levelup__hint">${game.i18n.localize("CARDRPG.Level.NothingNumeric")}</p>`);
    if (opens.length) {
      rows.push(`<p class="cr-levelup__opens">${game.i18n.localize("CARDRPG.Level.Opens")}:
        ${opens.map(esc).join(", ")}</p>`);
    }
    if (closes.length) {
      rows.push(`<p class="cr-levelup__closes"><strong>
        ${game.i18n.localize("CARDRPG.Level.Closes")}:</strong> ${closes.map(esc).join(", ")}</p>`);
    }

    box.innerHTML = `<h3>${esc(node.name ?? this.tentative)}</h3>${rows.join("")}`;
    this.#setButtons((this.actor.system.levels?.pending ?? 0) > 0);
  }

  #setButtons(canAccept) {
    const accept = this.element?.querySelector("[data-action=accept]");
    if (accept) accept.disabled = !canAccept;
  }

  /* -------------------------------------------- */
  /*  Accept and cancel                           */
  /* -------------------------------------------- */

  static async #onAccept() {
    if (!this.tentative) return;
    const node = GRAPH.get(this.tentative);
    const closes = wouldClose(this.tentative, ownedIds(this.actor));

    /* The one place this pane asks twice. An exclusive node is the only level-up that cannot be
     * walked back, so the player reads the list of what it shuts before it shuts. */
    if (closes.length) {
      const ok = await DialogV2.confirm({
        window: { title: game.i18n.localize("CARDRPG.Level.ConfirmTitle") },
        content: `<p>${game.i18n.format("CARDRPG.Level.ConfirmBody",
          { name: foundry.utils.escapeHTML(node.name ?? this.tentative) })}</p>
          <p><strong>${closes.map(c => foundry.utils.escapeHTML(c)).join(", ")}</strong></p>`,
        rejectClose: false,
        modal: true
      });
      if (!ok) return;
    }

    if (await takeNode(this.actor, this.tentative)) {
      this.tentative = null;
      await this.render();
    }
  }

  /** Cancel drops the mark. Nothing was written, so there is nothing to undo. */
  static #onCancelPick() {
    if (this.tentative) return this.#pick(null);
    return this.close();
  }

  static #onRefit() {
    this.cy?.fit(undefined, 40);
  }
}

/* -------------------------------------------- */

/**
 * Four states and two kinds of node, which is the whole of the paint. Owned is filled, available is
 * outlined and bright, *later* is dim but legible, and closed is greyed -- the difference between
 * the last two is the one a player most needs to see, so they differ in colour rather than in size.
 *
 * A crossing is dashed. leveling.md calls it a cross edge and means something precise by it, and a
 * dashed line is how a reader sees that this route is a crossing rather than the branch's own run.
 */
/**
 * A colour per Way, which is the change that makes a graph of 169 nodes legible.
 *
 * **Colour used to mean state and nothing meant Way**, so the pane was one grey mass with a few
 * coloured rings in it: a player could see which nodes they could take and not where in the game
 * they were. Those are different questions and they now use different channels --
 *
 *   the FILL says which Way you are looking at
 *   the BORDER says what you can do about it
 *
 * -- which is the same split the cards use, where the rim says what a thing belongs to and the
 * face says what it does.
 */
const WAY_COLOUR = {
  shade: { fill: "#2f3b4e", edge: "#5d7aa3", label: "Way of Shade" },
  strength: { fill: "#4a3330", edge: "#a3655d", label: "Way of Strength" },
  mind: { fill: "#2f3f3a", edge: "#5d9a86", label: "Way of Mind" },
  faith: { fill: "#403458", edge: "#8a74b8", label: "Way of Faith" },
  root: { fill: "#2a2d33", edge: "#5a606a", label: "Where everyone starts" }
};

/** Which Way a node belongs to, from its id: the namespace IS the Way (leveling 8). */
function wayOf(id) {
  return id.split(".")[0];
}

/**
 * The art a node shows: its Signature's, when it hands one over.
 *
 * A node has no picture of its own and should not: what it GIVES is the thing worth looking at, so
 * a title wears the card or slate it hands over and a minor node wears whatever it grants. Nothing
 * to show is the common case today and stays blank rather than falling back to a placeholder.
 */
/**
 * The picture a node wears: the art of the thing it hands over, or **"none"**.
 *
 * **Two bugs lived in six lines here, and they were the same bug.**
 *
 * It read `def.art` directly, and nothing in the content carries an `art` field -- the path is
 * **derived** from the entry, which is what `artIn` is for and what every other reader of art in
 * this system uses. So this was a second, shorter copy of a rule, and the short copy returned
 * nothing: **0 of 207 nodes resolved a picture**, and the feature the stylesheet describes --
 * *the Signature's art when the node has one, so a title wears the card it hands over* -- had
 * never once fired. Through `artIn` it resolves for 109 of the 122 nodes that grant something.
 *
 * And the empty string it returned is what **crashed the pane**. `background-image: data(art)`
 * with an empty value is not "no image", it is a value Cytoscape's style parser cannot read, and
 * it threw out of `recalculateRenderedStyle` -- so the graph rendered nothing at all. The comment
 * above that style rule has said `none` since it was written; the code said `""`. `none` is the
 * word that means no image, and it is the word this returns now.
 *
 * It never reproduced headlessly, which is worth writing down: the throw is on the **render** path,
 * so a Node test of the same elements and the same stylesheet passes every property on every one.
 */
function artFor(node) {
  const name = node?.grants?.card ?? node?.grants?.spell ?? node?.grants?.feature
    ?? node?.grants?.item ?? null;
  const def = name ? (POOL.get(name) ?? SPELLS.get(name) ?? SLATES.get(name) ?? null) : null;
  return (def && artIn(def)) || "none";
}

const STYLE = [
  {
    selector: "node",
    style: {
      "label": "data(label)", "font-size": 11, "color": "#e8e4da",
      "text-valign": "center", "text-halign": "center", "text-wrap": "wrap",
      "text-max-width": 120, "width": 132, "height": 46, "shape": "round-rectangle",
      "background-color": "#22262c", "border-width": 2, "border-color": "#4a505a",
      /* Art when a node has it, and nothing when it does not: `background-image` of `none` leaves
       * the fill showing, so a graph with no art at all looks exactly as it did. */
      "background-image": "data(art)", "background-fit": "cover", "background-opacity": 1,
      "background-image-opacity": 0.55
    }
  },

  /*
   * The four territories. A compound parent is the cheapest honest way to say *you are here*: it
   * sizes itself around its children, so nothing has to be laid out twice, and it carries the Way's
   * name as a label where the player is already looking.
   */
  {
    selector: ":parent",
    style: {
      "label": "data(label)", "font-size": 15, "font-weight": "bold",
      "text-valign": "top", "text-halign": "center", "text-margin-y": -6,
      "color": "data(edge)", "background-color": "data(fill)", "background-opacity": 0.35,
      "border-width": 1, "border-color": "data(edge)", "border-opacity": 0.5,
      "padding": 22, "shape": "round-rectangle", "background-image": "none"
    }
  },

  /* The Way, in the fill. */
  { selector: "node[way]", style: { "background-color": "data(fill)", "border-color": "data(edge)" } },

  /*
   * And the state, in the border and the brightness -- never in the fill, which is the Way's now.
   * Owned is lit from inside, available wears a bright ring, later is dimmed and closed is drained
   * of its colour rather than painted a different one: a closed Shade node should still look like
   * a Shade node you cannot have.
   */
  {
    selector: "node[state = 'owned']",
    style: { "border-width": 3, "border-color": "#9fd99a", "color": "#f4f8f2",
      "background-blacken": -0.15 }
  },
  {
    selector: "node[state = 'available']",
    style: { "border-width": 4, "border-color": "#9ccbff", "color": "#f2f7ff" }
  },
  {
    selector: "node[state = 'later']",
    style: { "border-width": 2, "color": "#9aa0aa", "opacity": 0.75,
      "background-blacken": 0.35, "background-image-opacity": 0.25 }
  },
  {
    selector: "node[state = 'closed']",
    style: { "border-width": 2, "border-style": "dotted", "color": "#7d7076",
      "opacity": 0.5, "background-blacken": 0.55, "background-image-opacity": 0.12 }
  },

  /* A title is a bigger, stronger shape: the thing a player is aiming at should look like one. */
  {
    selector: "node[kind = 'major']",
    style: {
      "width": 154, "height": 60, "font-size": 12, "font-weight": "bold",
      "shape": "round-hexagon", "border-width": 3, "background-image-opacity": 0.7
    }
  },

  { selector: "node.tentative", style: { "border-color": "#f0c060", "border-width": 6, "color": "#fff6e0", "background-blacken": -0.2 } },

  {
    selector: "edge",
    style: {
      "width": 2, "line-color": "data(edge)", "line-opacity": 0.55,
      "curve-style": "bezier", "target-arrow-shape": "triangle",
      "target-arrow-color": "data(edge)", "arrow-scale": 0.7
    }
  },
  /* An edge into something you own is a road you walked: brighter than one you have not. */
  { selector: "edge[walked = 'yes']", style: { "line-opacity": 0.9, "width": 3 } },
  { selector: "edge[cross = 'yes']", style: { "line-style": "dashed", "line-color": "#b89cd0", "target-arrow-color": "#b89cd0", "line-opacity": 0.8 } }
];
