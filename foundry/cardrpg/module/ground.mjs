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
      effects: [...(effects ?? [])], damage, condition, intensity, until, by,
      /*
       * **Who made it, which decides what the end of a fight is allowed to delete.**
       *
       * A card's wall is the fight's and goes with it. **A rock a GM drew on the map is the map's
       * and must survive**, and without this the first encounter on a scene would quietly clear
       * the scenery somebody built it out of. That is the kind of loss nobody notices until the
       * second session.
       */
      fromCard: true
    } } }
  }]);
  /* Phase 3: what it costs to cross, if it costs anything. */
  if (region) await syncCrossing(region, region.getFlag("cardrpg", FLAG));
  return region ?? null;
}

/**
 * **The properties a GM has ticked on a region they drew themselves.**
 *
 * Written straight onto the document as the box is ticked rather than on a form submit: the
 * region config is Foundry's own application and this is a guest in it, so the less of its
 * lifecycle this depends on the better.
 */
export async function setGround(region, { effects = [], damage = null } = {}) {
  if (!region) return null;
  const keep = region.getFlag?.("cardrpg", FLAG) ?? {};
  const live = effects.filter(key => key in CARDRPG.groundEffects);
  if (!live.length && !damage) {
    await syncCrossing(region, null);
    return region.unsetFlag("cardrpg", FLAG);
  }
  const written = await region.setFlag("cardrpg", FLAG, {
    ...keep,
    effects: live,
    damage: damage || null,
    /* A GM's ground is the map's, not the fight's. See `layGround`. */
    fromCard: false,
    until: keep.until ?? null
  });
  await syncCrossing(region, region.getFlag("cardrpg", FLAG));
  return written;
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

/**
 * **What crossing the zone costs, handed to Foundry's own measurement.**  [BUILT 2026-11-16]
 * Phase 3.
 *
 * `modifyMovementCost` is a region behaviour the application ships, and its `difficulties` are
 * per-movement-action multipliers. Attaching one makes **the ruler** charge double for difficult
 * ground while somebody drags a token across it.
 *
 * **It enforces nothing and is not meant to.** core-rules 11 is explicit that *movement is a
 * sentence the table applies*, and nothing in this system spends a Move for anybody. What changes
 * is that the number a player needs is on the screen while they are dragging rather than in
 * somebody's head -- which is the same bargain the chips made in phase 1.
 *
 * Synced rather than added, and from both writers, so unticking *difficult* on a region takes the
 * behaviour off again. A behaviour left behind by an untick is a square that costs double for a
 * reason nobody can see, which is worse than one that costs nothing.
 */
async function syncCrossing(region, ground) {
  if (!region) return;
  const walk = Math.max(
    ground?.effects?.includes("impassable") ? CARDRPG.groundCost.impassable : 0,
    ground?.effects?.includes("difficult") ? CARDRPG.groundCost.difficult : 0
  );
  const mine = (region.behaviors ?? []).filter(b => b.getFlag?.("cardrpg", "crossing"));
  if (!walk) {
    const ids = mine.map(b => b.id);
    if (ids.length) await region.deleteEmbeddedDocuments("RegionBehavior", ids);
    return;
  }
  if (mine.length) {
    await mine[0].update({ "system.difficulties.walk": walk });
    return;
  }
  await region.createEmbeddedDocuments("RegionBehavior", [{
    type: "modifyMovementCost",
    name: "Card RPG ground",
    system: { difficulties: { walk } },
    flags: { cardrpg: { crossing: true } }
  }]);
}

/**
 * **A trap springs once and is gone**, which is the whole of what a trap is.
 *
 * *Set* is *an adjacent square; the first enemy to enter takes your Strike value* and *Spoil the
 * Ground* is *one square within reach is a trap now, and stays one*. **The first** is the load
 * bearing word in one and **stays** is in the other, so springing is what removes the zone and a
 * zone that is not sprung is still there next round.
 *
 * What it costs is the zone's `damage` when it carries one, and otherwise the table's -- *your
 * Strike value* depends on what the setter had in hand when they set it, which is a question this
 * does not pretend to answer. What it does instead is say loudly that the trap went off and whose
 * it was, which is the part nobody at the table can reconstruct afterwards.
 */
export async function springTraps(actor, point) {
  const scene = actor?.getActiveTokens?.()[0]?.scene ?? canvas?.scene;
  if (!scene || !actor) return [];
  const here = groundAt(scene, point ?? actor.getActiveTokens?.()[0]?.center);
  const traps = here.zones.filter(({ ground }) => (ground.effects ?? []).includes("trap"));
  if (!traps.length) return [];

  const sprung = [];
  for (const { region, ground } of traps) {
    const hurt = Math.max(0, ground.damage ?? 0);
    if (hurt > 0) {
      const before = actor.system.health?.value ?? 0;
      await actor.update({ "system.health.value": Math.max(0, before - hurt) });
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="cardrpg"><p><strong>${actor.name}</strong> walks into `
        + `${ground.by ? `<strong>${ground.by}</strong>'s trap` : "a trap"}`
        + (hurt > 0 ? `: <strong>${hurt}</strong> damage.` : ", and it springs.")
        + ` The square is clear now.</p></div>`
    });
    if (scene.regions?.has?.(region.id) ?? true) {
      await scene.deleteEmbeddedDocuments("Region", [region.id]);
    }
    sprung.push(region.id);
  }
  return sprung;
}

/**
 * **The condition a zone puts on whoever is standing in it.**  [BUILT 2026-11-16] Phase 2.
 *
 * *The Standing Flood* is deep water and everything in it is **Wet (2)**: the condition is the
 * zone's, not an attack's, so there is nobody to resist and nothing to draw against. You are
 * either in the water or you are not.
 *
 * **It refreshes rather than stacks**, on exactly the terms `resolveCondition` already uses -- the
 * longer duration wins and so does the fiercer value, each taken independently, because that is
 * the only version with no order of arrival in it. A candle after a dragon leaves the dragon's
 * fire.
 *
 * **One round at a time, with no creator.** A blank `creatorId` ticks on the victim's own turn
 * (combat.mjs), which is what a zone wants: stand in the water and it is renewed under you every
 * turn, walk out and it is gone by your next one. A zone that handed out a five-round condition
 * would be a puddle you carry around.
 *
 * Written here rather than through `resolveCondition` because the resolver imports this module,
 * and a cycle to save nine lines is a bad trade. The refresh rule is the one thing that must not
 * drift between the two, so it is named in both.
 */
export async function imposeGround(actor) {
  if (!actor?.update) return [];
  const standing = groundFor(actor).zones
    .map(({ ground }) => ground)
    .filter(ground => ground.condition && ground.condition in CARDRPG.conditions);
  if (!standing.length) return [];

  const conditions = actor.system.toObject?.().conditions
    ?? (actor.system.conditions ?? []).map(c => ({ ...c }));
  const landed = [];
  for (const ground of standing) {
    const key = ground.condition;
    const valued = CARDRPG.conditions[key]?.valued;
    const value = valued ? Math.max(0, ground.intensity ?? 1) : null;
    const already = conditions.find(c => c.key === key);
    if (already) {
      already.duration = Math.max(already.duration ?? 0, 1);
      if (value) already.value = Math.max(already.value ?? 0, value);
      already.creatorId = "";
      already.round = game.combat?.round ?? null;
    } else {
      conditions.push({ key, duration: 1, value, creatorId: "",
        round: game.combat?.round ?? null });
    }
    landed.push(key);
  }
  await actor.update({ "system.conditions": conditions });
  return landed;
}

/**
 * **Ticking ground onto a region a GM drew themselves.**  [BUILT 2026-11-16]
 *
 * Phase 0 and 1 only let a **card** make ground, which answers the wrong half of the question. The
 * first thing anybody wants from this is *that rock gives cover*, and a rock is not a card: it is
 * scenery somebody drew once and the party walks behind it all evening.
 *
 * **Foundry already has the hard part and this does not rebuild it.** The Region tool draws
 * rectangles, ellipses and polygons, snaps to the grid, and persists with the scene. So the whole
 * of this is a fieldset in the region's own configuration, and what a GM does is draw a region the
 * normal way and tick what it is. Nothing here owns a drawing tool, a layer or a click handler on
 * the canvas, and that is deliberate: the one thing worse than no automation is a second,
 * worse copy of a tool the application already ships.
 *
 * Written on change rather than on submit. This is a guest in somebody else's application and the
 * less of its lifecycle it depends on, the longer it survives their next release.
 */
export function registerGroundHooks() {
  Hooks.on("renderRegionConfig", (app, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0] ?? app?.element;
    const region = app?.document;
    if (!root || !region || !game.user?.isGM) return;
    /* ApplicationV2 re-renders parts in place, so a second pass must not add a second copy. */
    if (root.querySelector(".cr-ground")) return;

    const current = region.getFlag?.("cardrpg", FLAG) ?? {};
    const ticked = new Set(current.effects ?? []);
    const box = document.createElement("fieldset");
    box.className = "cr-ground";
    const rows = Object.entries(CARDRPG.groundEffects).map(([key, label]) => {
      const on = ticked.has(key) ? " checked" : "";
      const who = ENFORCED.has(key) ? "the engine applies this" : "the table applies this";
      return `<label class="cr-ground__row" data-tooltip="${who}">`
        + `<input type="checkbox" data-ground="${key}"${on}> `
        + `${game.i18n.localize(label)}</label>`;
    }).join("");
    box.innerHTML = `<legend>${game.i18n.localize("CARDRPG.Ground.Legend")}</legend>`
      + `<div class="cr-ground__rows">${rows}</div>`
      + `<label class="cr-ground__row">`
      + `<input type="number" min="0" step="1" data-ground-damage `
      + `value="${Number(current.damage ?? 0) || 0}"> `
      + `${game.i18n.localize("CARDRPG.Ground.Damage")}</label>`
      + `<p class="notes">${game.i18n.localize("CARDRPG.Ground.Hint")}</p>`;

    const host = root.querySelector('[data-application-part="appearance"]')
      ?? root.querySelector("form") ?? root;
    host.appendChild(box);

    box.addEventListener("change", async () => {
      const effects = [...box.querySelectorAll("input[data-ground]")]
        .filter(input => input.checked).map(input => input.dataset.ground);
      const damage = Number(box.querySelector("input[data-ground-damage]")?.value ?? 0) || 0;
      await setGround(region, { effects, damage });
    });
  });
}

/**
 * **Which properties the engine acts on by itself**, which is a shorter list than the six and will
 * stay shorter for a while.
 *
 * It is here rather than in the HUD because the HUD is not the only thing that will want to say
 * it, and it is a Set rather than a flag on each config entry because `groundEffects` is a map of
 * label keys today and widening it is a phase-1 decision this phase does not need to make.
 *
 * **Saying so is the feature.** Eleven of the twelve entries that read a shadowed square are rules
 * a person applies, and the game is better for that -- *movement is a sentence the table applies*.
 * What a table cannot do is apply a rule about a square nobody can see. A chip that reads
 * *shadowed, the table applies this* is the whole of what those entries were missing.
 */
export const ENFORCED = new Set(["cover", "trap"]);

/**
 * **And the two the engine MEASURES without enforcing.**  [2026-11-16] Phase 3.
 *
 * Foundry's ruler charges double for difficult ground because a behaviour on the region says so,
 * and then nothing spends it: *movement is a sentence the table applies*. Calling that enforced
 * would be a lie on a tooltip, and calling it nothing would hide the one thing that changed. So it
 * is its own answer, and the chip says which.
 */
export const MEASURED = new Set(["difficult", "impassable"]);

/**
 * **What the square under an actor is, ready to show somebody.**
 *
 * One reader, so the HUD, a sheet and anything later all say the same words about the same square
 * and none of them has to know which properties the engine has got round to.
 */
export function groundChips(actor) {
  const here = groundFor(actor);
  const chips = [...here.effects].map(key => {
    const label = game.i18n.localize(CARDRPG.groundEffects[key] ?? key);
    return {
      key,
      label,
      enforced: ENFORCED.has(key),
      tip: ENFORCED.has(key)
        ? `You are standing in ${label}, and the engine applies it.`
        : MEASURED.has(key)
          ? `You are standing in ${label}. The ruler counts it; you spend it.`
          : `You are standing in ${label}. The table applies it.`
    };
  });
  /*
   * **Damage and the zone's condition are chips too, and they are not in `groundEffects`.**
   * [2026-11-16] Phase 2. They are fields beside the property list rather than entries in it --
   * *difficult ground, cover, and 2 damage at the start of your turn* is one zone with two
   * properties and a number -- so they are gathered here rather than looked up, and both are
   * enforced, which is the point of saying them at all.
   */
  if (here.damage > 0) {
    chips.push({
      key: "damage", label: `${here.damage} damage`, enforced: true,
      tip: `Standing here costs ${here.damage} at the start of your turn, before armor and Block.`
    });
  }
  for (const { ground } of here.zones) {
    const key = ground.condition;
    if (!key || !(key in CARDRPG.conditions)) continue;
    const label = game.i18n.localize(CARDRPG.conditions[key]?.label ?? key);
    const value = CARDRPG.conditions[key]?.valued ? ` ${Math.max(0, ground.intensity ?? 1)}` : "";
    if (chips.some(c => c.key === `condition:${key}`)) continue;
    chips.push({
      key: `condition:${key}`, label: `${label}${value}`, enforced: true,
      tip: `The ground keeps you ${label} while you stand in it, and lets go when you leave.`
    });
  }
  return chips;
}

/**
 * **The fight ending takes every zone the FIGHT made**, including the ones that said all fight.
 *
 * And nothing else. A region a GM drew and ticked is scenery: the rock is still a rock when the
 * goblins are dead, and a fight that tidied the map away would be the system deleting somebody's
 * work on its way out of the room.
 */
export async function clearGround(scene) {
  /*
   * **Asked for again at the moment of deleting**, because this is reached from a hook and the
   * same zones can be on their way out already -- a GM deleting the combat while the fight's own
   * `deleteCombat` handler is running is two deletes of one region, and Foundry throws on the
   * second. Reading the ids one line before using them does not make that impossible, but it
   * makes it the narrow race it should be rather than the ordinary case it was.
   */
  const mine = zonesOn(scene)
    .filter(({ ground }) => ground.fromCard)
    .map(({ region }) => region.id)
    .filter(id => scene.regions?.has?.(id) ?? true);
  if (!mine.length) return 0;
  await scene.deleteEmbeddedDocuments("Region", mine);
  return mine.length;
}
