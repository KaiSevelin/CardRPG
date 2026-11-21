/**
 * **How far away a thing is, and which squares a figure could stand in.**  [BUILT 2026-11-21]
 *
 * Two answers, and the first one is the surprise: **this game had no distance.** Chebyshev was
 * computed in two places and both were special cases of it -- `neighbours` capped it at 1, and
 * `watches` worked it out inside the overwatch arc -- so nothing could answer *how many squares is
 * that*. The cost shows up everywhere a card says `within 4`: the step prints the 4 and asks a
 * person, which reads like a design decision and is not one. Nobody decided it; it was never
 * written.
 *
 * `squaresBetween` is that primitive. It is six lines, it is now the only Chebyshev in the system,
 * and the two callers that each had their own are refactored onto it -- which is the whole reason
 * to put it here rather than inline it in the thing that wanted it.
 *
 * **And the highlight, which is where the Move ruling landed.** core-rules 12 called unresolved
 * movement the largest remaining engine gap, and the ruling was that movement stays a sentence the
 * table applies **as long as it is clear to the player how far they can move**. That is a display
 * problem, so this draws and enforces nothing:
 *
 * - **It never moves a figure** and never refuses one. A player drags wherever they like, including
 *   somewhere this said they could not reach, and nothing here objects or corrects them.
 * - **It spends nothing.** No Move is deducted, because no Move is held anywhere to deduct.
 * - **It agrees with the numbers already on the screen.** The budget comes from the tray's own
 *   faces, which already print Move as it actually plays (halved by Slowed, reduced by Frozen,
 *   floored at 0), and the per-square cost comes from `crossingCost`, which is the same formula
 *   the region behaviour hands Foundry's ruler. A highlight that disagreed with either would be
 *   worse than none: the player would have two numbers and no way to tell which lied.
 *
 * **What it assumes, and it is one thing.** A square with another figure in it is not a square you
 * can end in, and the walk does not route through one. That is the only rule in here, it is the
 * one every table plays anyway, and the exceptions are real and deliberately not modelled --
 * Bodyguard's *figures never block that move*, Burglar's *no enemy blocks your movement in a square
 * that holds an obstacle*. A player with either of those reads the colours as advice, which is all
 * they ever are. `cardrpgReachable` is the hook for anybody who wants to answer differently, the
 * same arrangement `cardrpgGroundAt` makes for what a square is.
 *
 * **Diagonals are eight, whatever the scene says.** `canvas.grid.getAdjacentOffsets` honours the
 * scene's diagonal rule and this does not use it: the game's rule is Chebyshev, *a diagonal is one
 * square*, and a highlight that followed a scene setting would quietly contradict every range in
 * the book on a map somebody had configured differently.
 */

import { CARDRPG } from "./config.mjs";
import { crossingCost, groundAt } from "./ground.mjs";

/** One layer, named, so clearing ours never touches a template's or the ruler's. */
const LAYER = "cardrpg.reach";

/* -------------------------------------------- */
/*  Distance                                   */
/* -------------------------------------------- */

/**
 * **The square anything is standing in, as grid coordinates.**
 *
 * Takes a Token, a TokenDocument, an Actor or a plain point, because every caller in the system has
 * a different one of those in hand and converting at each call site is four chances to convert it
 * wrongly.
 *
 * **Off the document and not off the placeable**, for the reason `groundFor` gives: a placeable's
 * position is its old square, or 0,0, until the canvas has drawn the move -- and *just arrived* is
 * exactly when something asks where a figure is. An actor with two tokens prefers the controlled
 * one, which is right far more often than "the first one".
 */
function squareOf(what) {
  if (!what) return null;
  const doc = what.document ?? what;
  /*
   * **An Actor: ask it for a token, and ask for DOCUMENTS.**  [FIXED 2026-11-21]
   *
   * `getActiveTokens()` with no arguments returns placeables and returns only the ones that are
   * `rendered` -- so a token created a moment ago answers with an empty array, and this returned
   * null for a figure that was plainly standing on the board. The live probe found it: distance
   * between two token documents was right, and the reach walk out of the same figure was empty.
   *
   * That is the third time this codebase has been bitten by the same thing (`groundFor`,
   * `onArrival`), and the rule it keeps arriving at is the one applied here: **the document always
   * knows where it is, and the placeable only knows once a frame has been drawn.** The placeables
   * are still asked first, because `controlled` is a placeable's word and which token the user has
   * hold of is worth more than "the first one" -- but when none of them is drawn yet the documents
   * answer.
   */
  if (typeof doc.getActiveTokens === "function") {
    const held = doc.getActiveTokens().find(t => t.controlled);
    if (held) return squareOf(held.document ?? held);
    const [first] = doc.getActiveTokens(false, true);
    return first ? squareOf(first) : null;
  }
  if (typeof doc.x !== "number" || typeof doc.y !== "number") return null;
  const size = (doc.parent ?? canvas?.scene)?.grid?.size ?? canvas?.grid?.size ?? 100;
  /*
   * The CENTRE of the figure, which for one larger than a square is the middle of the whole thing.
   * A 2x2 ogre measured from its top-left corner is a square and a half further away than it is.
   */
  const w = doc.width ?? 1;
  const h = doc.height ?? 1;
  const x = doc.x + (size * (typeof w === "number" ? w : 1)) / 2;
  const y = doc.y + (size * (typeof h === "number" ? h : 1)) / 2;
  return { x, y, size };
}

/**
 * **Which grid square that is**, as the integer pair the grid counts in.
 *
 * **Offsets and not pixels, so the answer is always a whole number of squares.** Measuring centre
 * to centre in pixels and dividing is exact for two figures of the same size and half a square out
 * for a 2x2 ogre, which would make a range check fractional -- and *2.5 squares away* is not a
 * sentence this game can say. The square a figure's centre is in is the square it is in.
 *
 * The fallback is for a caller with no canvas: a probe running before `canvasReady`, which is when
 * half of this system's geometry gets asked about. It is the same arithmetic the grid does.
 */
function offsetOf(what) {
  const at = squareOf(what);
  if (!at) return null;
  const grid = canvas?.grid;
  if (grid && !grid.isGridless && typeof grid.getOffset === "function") {
    const { i, j } = grid.getOffset({ x: at.x, y: at.y });
    return { i, j };
  }
  return { i: Math.floor(at.y / at.size), j: Math.floor(at.x / at.size) };
}

/**
 * **How many squares between two things, Chebyshev, so a diagonal is one.**
 *
 * The one measure in this game: core-rules 11, and every `range` on every step in the book. Returns
 * null when either thing is not on the board, which callers must treat as *no answer* rather than
 * as zero -- an unplaced fight has no geometry, and a rule that needs geometry should do nothing
 * rather than guess. That is `neighbours`' own rule, lifted here because it is this function's
 * rule.
 *
 * 0 is the same square, 1 is adjacent.
 */
export function squaresBetween(a, b) {
  const from = offsetOf(a);
  const to = offsetOf(b);
  if (!from || !to) return null;
  return Math.max(Math.abs(to.i - from.i), Math.abs(to.j - from.j));
}

/** Adjacent, by the measure above: the eight squares around you, and nothing else. */
export function isAdjacent(a, b) {
  const away = squaresBetween(a, b);
  return away !== null && away > 0 && away <= 1;
}

/* -------------------------------------------- */
/*  Reach                                      */
/* -------------------------------------------- */

/**
 * **Which squares this figure could end in, and what each one costs to get to.**
 *
 * A plain Dijkstra out from the figure's own square, because the costs are not all 1: a step into
 * difficult ground is `CARDRPG.groundCost.difficult`, and into impassable it is the ceiling
 * Foundry's multiplier field allows. Breadth-first would be wrong the moment a bog is in the way --
 * it would find the bog route to a square before the longer dry one and call it the cheaper.
 *
 * Returns a Map keyed `"i,j"` of `{ i, j, x, y, spent }`, not including the square the figure is
 * already in. `spent` is what the walk cost to arrive, so a caller can shade the dear squares
 * differently from the cheap ones.
 *
 * **The budget is a number of squares and the caller owns it.** Nothing here reads a card or a
 * condition: the tray already knows what the staged halves print after everything that reduces
 * them, and asking twice is how two answers appear.
 */
export function reachFrom(actor, budget, token = null) {
  const out = new Map();
  if (!canvas?.ready || !(budget > 0)) return out;
  const grid = canvas.grid;
  if (!grid || grid.isGridless) return out;

  /* The subject as a DOCUMENT, for the reason `squareOf` gives: a placeable that has not been
   * drawn is not a figure that is not there. */
  const subject = token?.document ?? token
    ?? actor?.getActiveTokens?.().find(t => t.controlled)?.document
    ?? actor?.getActiveTokens?.(false, true)?.[0];
  const start = offsetOf(subject);
  if (!start) return out;

  const scene = subject?.parent ?? canvas.scene;
  /* What this figure alone does not feel, by the same rule `groundFor` applies where they stand. */
  const blind = new Set(actor?.system?.ignoresGround ?? []);

  /*
   * Every other figure's square, which is neither a destination nor a way through. Off the scene's
   * token documents, and off the placeables only when there is no scene to ask -- the same
   * preference, for the same reason: a figure nobody has drawn yet still occupies its square.
   */
  const figures = [...(scene?.tokens ?? [])].length
    ? [...scene.tokens]
    : (canvas.tokens?.placeables ?? []).map(t => t.document ?? t);
  const taken = new Set();
  for (const other of figures) {
    /* By id, because a figure does not stand in its own way. */
    if (!other || other.id === subject?.id || !other.actorId && !other.actor) continue;
    const o = offsetOf(other);
    if (o) taken.add(`${o.i},${o.j}`);
  }

  const key = o => `${o.i},${o.j}`;
  const spent = new Map([[key(start), 0]]);
  /*
   * A plain sorted frontier rather than a heap. The budget is a single-figure number of squares, so
   * the worst case is the disc around it -- a few hundred squares at Move 9 -- and a heap here
   * would be a data structure nobody can read guarding against a cost nobody pays.
   */
  let frontier = [start];
  while (frontier.length) {
    frontier.sort((a, b) => spent.get(key(a)) - spent.get(key(b)));
    const at = frontier.shift();
    const cost = spent.get(key(at));
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        if (!di && !dj) continue;
        const next = { i: at.i + di, j: at.j + dj };
        const id = key(next);
        if (taken.has(id)) continue;
        const centre = grid.getCenterPoint(next);
        const ground = groundAt(scene, centre);
        for (const seen of blind) ground.effects.delete(seen);
        const step = Math.max(1, crossingCost(ground.effects));
        const total = cost + step;
        if (total > budget) continue;
        if (spent.has(id) && spent.get(id) <= total) continue;
        spent.set(id, total);
        const corner = grid.getTopLeftPoint(next);
        out.set(id, { i: next.i, j: next.j, x: corner.x, y: corner.y, spent: total });
        frontier.push(next);
      }
    }
  }
  out.delete(key(start));
  /* Answered before it is returned, so a Bodyguard's module, or a later phase of this one, can
   * add a square or take one away without patching the walk. */
  Hooks.callAll("cardrpgReachable", actor, budget, out);
  return out;
}

/* -------------------------------------------- */
/*  The highlight                              */
/* -------------------------------------------- */

/**
 * **Paint the squares, in two shades.**
 *
 * Cheap squares in one colour and dear ones in another, because *you can get there* and *you can
 * get there and that is the whole card* are different answers and a player deciding which card to
 * play needs the second. A square is dear when arriving there spent more than its Chebyshev
 * distance, which is exactly the squares where ground took something.
 *
 * Idempotent: it clears before it draws, so calling it on every render costs one repaint rather
 * than stacking layers.
 */
export function showReach(actor, budget, token = null) {
  if (!canvas?.ready) return 0;
  const squares = reachFrom(actor, budget, token);
  const grid = canvas.interface?.grid;
  if (!grid?.addHighlightLayer) return squares.size;
  grid.addHighlightLayer(LAYER);
  grid.clearHighlightLayer(LAYER);
  const origin = offsetOf(token?.document ?? token ?? actor);

  for (const square of squares.values()) {
    const away = origin
      ? Math.max(Math.abs(square.i - origin.i), Math.abs(square.j - origin.j))
      : square.spent;
    const dear = square.spent > away;
    grid.highlightPosition(LAYER, {
      x: square.x,
      y: square.y,
      color: dear ? CARDRPG.reachColour.dear : CARDRPG.reachColour.plain,
      border: dear ? CARDRPG.reachColour.dear : CARDRPG.reachColour.plain,
      alpha: dear ? 0.14 : 0.22
    });
  }
  return squares.size;
}

/** Take it off. Safe to call when nothing was ever drawn, which is most of the time. */
export function clearReach() {
  canvas?.interface?.grid?.clearHighlightLayer?.(LAYER);
}

/**
 * **What takes the highlight down, and the list is the point.**
 *
 * The squares are an answer to *where could I go from here*, so every one of these is a change to
 * *here* or to *I*. A highlight left standing after the figure moved is the worst thing this could
 * do: it would be a confident, wrong answer sitting on the board with nothing to say it was stale.
 *
 * It is not re-drawn by any of them. Whoever asked for it asks again, because this module does not
 * know whether a Move is still staged and should not start keeping a copy of something the tray
 * already holds.
 */
export function registerBoardHooks() {
  for (const hook of ["updateToken", "deleteToken", "canvasReady", "combatTurn", "combatRound",
    "deleteCombat"]) {
    Hooks.on(hook, () => clearReach());
  }
}
