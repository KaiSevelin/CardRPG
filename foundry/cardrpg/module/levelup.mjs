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
  GRAPH, SUCCESSORS, DEPTH, ROOT,
  ownedIds, closedIds, reachable, canTake, stateOf,
  levelOf, titleOf, describeGrants, wouldClose, takeNode
} from "./graph.mjs";

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
      refit: LevelUpPane.#onRefit
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
      }))
    };
  }

  /* -------------------------------------------- */

  async _onRender(context, options) {
    await super._onRender(context, options);

    const host = this.element.querySelector(".cr-graph");
    if (!host) return;

    const cytoscape = await loadCytoscape();
    this.cy?.destroy();
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

    this.cy.on("tap", "node", ev => this.#onPick(ev.target.id()));
    this.cy.on("tap", ev => { if (ev.target === this.cy) this.#pick(null); });

    this.element.querySelector("[name=layout]")?.addEventListener("change", ev => {
      this.layout = ev.target.value;
      this.#runLayout();
    });

    this.#renderDetail();
  }

  /** Cytoscape holds the canvas; closing the window has to take it down with it. */
  async _preClose(options) {
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

    for (const [id, node] of GRAPH) {
      nodes.push({
        data: {
          id,
          label: node.name ?? id,
          kind: node.title ? "major" : "minor",
          state: stateOf(id, owned, closed, live)
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
      this.cy.layout({ name: "preset", positions: tierLayout([...GRAPH.keys()]), fit: true, padding: 40 }).run();
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
    if (state === "available") return this.#pick(id);

    const why = {
      owned: "CARDRPG.Level.AlreadyOwned",
      later: "CARDRPG.Level.NotYet",
      closed: "CARDRPG.Level.Closed"
    }[state];
    ui.notifications?.info(game.i18n.format(why, { name: GRAPH.get(id)?.name ?? id }));
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
        rows.push(`<p><em>${game.i18n.localize("CARDRPG.Level.Tactic")}:</em>
          ${esc(node.tactic)}</p>`);
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
const STYLE = [
  {
    selector: "node",
    style: {
      "label": "data(label)", "font-size": 11, "color": "#e8e4da",
      "text-valign": "center", "text-halign": "center", "text-wrap": "wrap",
      "text-max-width": 120, "width": 132, "height": 46, "shape": "round-rectangle",
      "background-color": "#22262c", "border-width": 2, "border-color": "#4a505a"
    }
  },
  { selector: "node[kind = 'major']", style: { "width": 150, "height": 56, "font-weight": "bold", "shape": "round-hexagon" } },
  { selector: "node[state = 'owned']", style: { "background-color": "#3c5a3a", "border-color": "#7ab874", "color": "#f2f6f0" } },
  { selector: "node[state = 'available']", style: { "background-color": "#2a3a52", "border-color": "#7fb2ef", "border-width": 3 } },
  { selector: "node[state = 'later']", style: { "background-color": "#1c1f24", "border-color": "#3a4049", "color": "#8d9099" } },
  { selector: "node[state = 'closed']", style: { "background-color": "#1a1a1a", "border-color": "#58333a", "color": "#6b5055" } },
  { selector: "node.tentative", style: { "border-color": "#f0c060", "border-width": 5, "color": "#fff6e0" } },
  {
    selector: "edge",
    style: {
      "width": 2, "line-color": "#4a505a", "curve-style": "bezier",
      "target-arrow-shape": "triangle", "target-arrow-color": "#4a505a", "arrow-scale": 0.8
    }
  },
  { selector: "edge[cross = 'yes']", style: { "line-style": "dashed", "line-color": "#8a6f9c", "target-arrow-color": "#8a6f9c" } }
];
