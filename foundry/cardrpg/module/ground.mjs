/**
 * **Ground: what a square is, as opposed to who is standing on it.**  [BUILT 2026-11-16]
 *
 * core-rules 11 is named *Grid, ground and movement* and the ground half of it reached the table
 * only by being read aloud. `CARDRPG.groundShapes` named five shapes, `CARDRPG.groundEffects` six
 * properties, the card schema validated both, eight steps in the content made ground and twelve
 * entries read a shadowed square -- and nothing in the engine had ever asked a square what it was.
 * Two spells, *Longer Shadow* and *The Borrowed Dark*, were the only steps in the game whose whole
 * content was a `ground` block, which made them the only two that announced literally nothing.
 *
 * **A zone is a Foundry Region carrying our flag**, and that is measured rather than assumed: on
 * 14.369 `scene.regions` exists, a grid-aligned region can be made and deleted, `testPoint` says
 * whether a square is inside one, and the shipped behaviours include `modifyMovementCost` --
 * which is *difficult ground*, built in, and the opposite of what this project assumed when it
 * wrote eight Tactics around terrain it thought it would have to invent.
 *
 * Choosing a document over a flag on the scene is not neutral. A region draws itself, survives a
 * reload, and a GM can move or delete one by hand without the system's help -- which is the same
 * reason cover is a checkbox rather than a calculation (resolve.mjs).
 *
 * **Two seams, because this project has twice written one answer in two places and been wrong in
 * both.** `cardrpgGroundSquares` decides which squares a shape covers, and `cardrpgGroundAt`
 * decides what is true of a square. Either can be answered by somebody else.
 */

import { CARDRPG } from "./config.mjs";

/** Where our half of a Region lives. Everything else about it is Foundry's. */
export const FLAG = "ground";

/**
 * **The zones on a scene, as `{ region, ground }`.**
 *
 * A region without our flag is somebody else's -- a GM's lighting cue, another module's trigger --
 * and is left strictly alone. That is the price of using a shared document type and it is worth
 * paying: the alternative is a parallel store nothing else in Foundry can see.
 */
export function zonesOn(scene) {
  const out = [];
  for (const region of scene?.regions ?? []) {
    const ground = region.getFlag?.("cardrpg", FLAG);
    if (ground && typeof ground === "object") out.push({ region, ground });
  }
  return out;
}

/**
 * **Is this point inside that region?**
 *
 * `testPoint` is the canvas object's and the canvas is not always up -- a GM editing a scene they
 * are not looking at, a probe running before `canvasReady`. The fallback is the document's own
 * rectangle shapes, which is all this module ever creates, so it is exact for our zones and
 * honest about the rest: a shape we did not make and cannot measure is reported as not containing
 * anything rather than as containing everything.
 */
function inside(region, point) {
  const live = region.object;
  if (live && typeof live.testPoint === "function") return live.testPoint(point);
  return (region.shapes ?? []).some(s => s.type === "rectangle"
    && point.x >= s.x && point.x < s.x + s.width
    && point.y >= s.y && point.y < s.y + s.height);
}

/**
 * **What is true of this square.** The one question, and the one place it is answered.
 *
 * Returns the union of every zone covering the point: `effects` as a Set of property keys,
 * `damage` as the largest any one zone deals, and `zones` so a caller that needs to say *which*
 * can. Properties are unioned and damage is not summed -- standing where two fires overlap is
 * standing in a fire, and a rule that added them would make two cards worth more than the sum of
 * what either says.
 */
export function groundAt(scene, point) {
  const answer = { effects: new Set(), damage: 0, zones: [] };
  if (!scene || !point) return answer;
  for (const { region, ground } of zonesOn(scene)) {
    if (!inside(region, point)) continue;
    answer.zones.push({ region, ground });
    for (const key of ground.effects ?? []) {
      if (key in CARDRPG.groundEffects) answer.effects.add(key);
    }
    answer.damage = Math.max(answer.damage, ground.damage ?? 0);
  }
  /* Answered before it is returned, so a module can add a property, take one away, or declare a
   * square it owns without patching every reader. */
  Hooks.callAll("cardrpgGroundAt", scene, point, answer);
  return answer;
}

/** The same, for wherever an actor is standing. Nothing to stand on is nothing true. */
export function groundFor(actor) {
  const token = actor?.getActiveTokens?.()[0];
  if (!token) return { effects: new Set(), damage: 0, zones: [] };
  return groundAt(token.scene ?? canvas?.scene, token.center ?? { x: token.x, y: token.y });
}

/**
 * **Which squares a shape covers, as rectangles.**
 *
 * Only the two shapes that need no judgement are answered here, and that is the whole of the
 * schema's ruling: *where a three-square line goes is a judgement about the map, and the one thing
 * worse than no automation is automation that puts a wall through the party.*
 *
 * - **adjacent** is the block around the caster, which has exactly one honest reading.
 * - **wholeMap** is the scene, which has exactly one.
 *
 * A line, an area or a single chosen square is somebody's decision about the map and this returns
 * nothing for them, so the step announces itself and a person places it. The hook is how a module
 * -- or a later phase of this one -- answers for those three without changing a caller.
 */
export function squaresFor(scene, { shape, origin, radius = 1 }) {
  const grid = scene?.grid?.size ?? canvas?.grid?.size ?? 100;
  const answer = { rects: [], placed: false };
  if (shape === "wholeMap") {
    /*
     * The whole canvas, padding and all, rather than the scene rectangle inside it. A figure
     * standing in the padding is still on the map as far as every other rule in this game is
     * concerned, and *The Borrowed Dark* says **the whole map**. `rect` is the padded bounds when
     * Foundry offers it; the pieces are the fallback, in the order that degrades most gently.
     */
    const d = scene?.dimensions ?? canvas?.dimensions;
    const rect = d?.rect ?? (d && {
      x: 0, y: 0,
      width: d.width ?? d.sceneWidth ?? 0,
      height: d.height ?? d.sceneHeight ?? 0
    });
    if (rect?.width > 0 && rect?.height > 0) {
      answer.rects.push({ type: "rectangle",
        x: rect.x ?? 0, y: rect.y ?? 0, width: rect.width, height: rect.height });
      answer.placed = true;
    }
  } else if (shape === "adjacent" && origin) {
    const r = Math.max(1, radius);
    const left = Math.floor(origin.x / grid) * grid - r * grid;
    const top = Math.floor(origin.y / grid) * grid - r * grid;
    const side = (2 * r + 1) * grid;
    answer.rects.push({ type: "rectangle", x: left, y: top, width: side, height: side });
    answer.placed = true;
  }
  Hooks.callAll("cardrpgGroundSquares", scene, { shape, origin, radius }, answer);
  return answer;
}

/**
 * **Lay a zone down**, or report that it needs a person.
 *
 * `until` is a round number rather than a count, because a duration counted down needs somebody to
 * count it every turn and a round to expire at needs only to be compared. `null` is *all fight*,
 * which two of the eight ask for, and the fight ending takes those.
 */
export async function layGround(scene, { shape, effects, damage = null, condition = "",
  intensity = null, origin = null, radius = 1, until = null, by = "", name = "" } = {}) {
  if (!scene || !shape) return null;
  const { rects, placed } = squaresFor(scene, { shape, origin, radius });
  if (!placed || !rects.length) return null;
  const [region] = await scene.createEmbeddedDocuments("Region", [{
    name: name || `Ground: ${effects?.join(", ") || shape}`,
    shapes: rects,
    color: CARDRPG.groundColor ?? "#5a7d9a",
    flags: { cardrpg: { [FLAG]: {
      effects: [...(effects ?? [])], damage, condition, intensity, until, by
    } } }
  }]);
  return region ?? null;
}

/**
 * **Take away what has run out**, at the top of a round.
 *
 * Compared rather than counted, so a zone laid on round 2 for one round is gone when round 3
 * begins whoever was looking. `until: null` is all fight and survives every round; what takes
 * those is the fight ending.
 */
export async function expireGround(scene, round) {
  if (!scene || !Number.isInteger(round)) return 0;
  const done = zonesOn(scene)
    .filter(({ ground }) => Number.isInteger(ground.until) && round > ground.until)
    .map(({ region }) => region.id);
  if (done.length) await scene.deleteEmbeddedDocuments("Region", done);
  return done.length;
}

/** And the fight ending takes every zone a fight made, including the ones that said all fight. */
export async function clearGround(scene) {
  const all = zonesOn(scene).map(({ region }) => region.id);
  if (all.length) await scene.deleteEmbeddedDocuments("Region", all);
  return all.length;
}
