/**
 * The call for a check: what the GM sets and the player answers.
 *
 * **skill-rules §2 step 1 is "the GM describes the obstacle and sets a difficulty", and the first
 * build had the player set it.** The tray offered every difficulty from Easy 3 to Heroic 9 to
 * whoever clicked their own card, so a Heroic obstacle could be attempted at Easy and nothing in
 * the software disagreed. That is not a tuning problem, it is the step the rules put first being
 * performed by the wrong person.
 *
 * So a check is two halves spoken by two people, and this module is the join:
 *
 *   - the **GM calls** it: an approach (or any), a difficulty, advantage or disadvantage, and a
 *     line of description;
 *   - the **player answers** it with one card, and chooses only what is theirs to choose -- which
 *     tool, whether to push, whether anybody helped.
 *
 * The call lives as a flag on the **active scene** rather than in a chat message, because a call is
 * a state of the table and not an event in its history: it is true until it is answered or
 * withdrawn, every client reads the same one, and `updateScene` already re-renders the tray.
 */

/** Where a call lives. One per scene, because one obstacle is in front of the party at a time. */
const FLAG = "call";

/**
 * The call in front of the party, or null.
 *
 * Read off the ACTIVE scene, which is the one the players are looking at -- `game.scenes.active`
 * rather than `canvas.scene`, so a GM who has wandered off to draw next week's map does not take
 * the call with them.
 */
export function readCall() {
  const scene = game.scenes?.active ?? null;
  const call = scene?.getFlag?.("cardrpg", FLAG) ?? null;
  if (!call || typeof call !== "object") return null;
  return {
    approach: call.approach ?? "any",
    dc: Number(call.dc) || CARDRPG.difficulties.normal,
    mode: Number(call.mode) || 0,
    note: String(call.note ?? ""),
    scene: scene.id
  };
}

/** Set the call. GM only: it is the GM's half of the step. */
export async function setCall({ approach = "any", dc, mode = 0, note = "" } = {}) {
  const scene = game.scenes?.active;
  if (!game.user.isGM || !scene) return null;
  await scene.setFlag("cardrpg", FLAG, {
    approach, dc: Number(dc) || CARDRPG.difficulties.normal, mode: Number(mode) || 0, note
  });
  return readCall();
}

/**
 * Withdraw it.
 *
 * **Answering a check does not clear the call**, and that is deliberate: a challenge is a row of
 * checks against the same obstacle and several characters answer the same call in turn
 * (skill-rules §3, *each round, every character may take one action*). The GM clears it when the
 * obstacle is gone.
 */
export async function clearCall() {
  const scene = game.scenes?.active;
  if (!game.user.isGM || !scene) return;
  await scene.unsetFlag("cardrpg", FLAG);
}

/** How a call reads in one line, for the banner and for a chat record. */
export function describeCall(call) {
  if (!call) return "";
  const name = Object.entries(CARDRPG.difficulties)
    .find(([, dc]) => dc === call.dc)?.[0] ?? "";
  const approach = call.approach === "any"
    ? game.i18n.localize("CARDRPG.Check.AnyApproach")
    : game.i18n.localize(CARDRPG.approaches[call.approach]?.label ?? call.approach);
  const edge = call.mode > 0 ? game.i18n.localize("CARDRPG.Check.Advantage")
    : call.mode < 0 ? game.i18n.localize("CARDRPG.Check.Disadvantage") : "";
  return [`${name ? `${name} ` : ""}${call.dc}`, approach, edge].filter(Boolean).join(" · ");
}

/**
 * Whether this card can answer this call.
 *
 * §2: *the approach must fit the description* -- you can climb a wall with Might or Agility but not
 * with Presence. When the GM has named an approach the engine can hold the line, and a wild serves
 * any, which is the whole reason an Inspiration is worth a slot that could have held a 3.
 */
export function cardAnswers(card, call) {
  if (!card) return false;
  if (!call || call.approach === "any") return (card.system?.value ?? 0) >= 0;
  return !!card.system?.serves?.(call.approach);
}

/**
 * The best equipped tool for this approach, or null.
 *
 * **Chosen rather than asked**, which is the other half of streamlining a check: the engine knows
 * which items are equipped and which approach each serves, so the common case needs no answer. The
 * dialog still shows it and still lets it be cleared, because a tool's bonus is *situational* --
 * `Shadow +2 (locks and mechanisms)` is not a bonus to every Shadow check, and only the table can
 * say whether this is a lock.
 */
export function bestTool(actor, approach) {
  const tools = (actor?.items ?? []).filter(i => i.type === "item" && i.system.equipped
    && i.system.bonus?.approach
    && (i.system.bonus.approach === approach || i.system.bonus.approach === "any"));
  if (!tools.length) return null;
  const trainings = (actor.system.learned?.trainings ?? [])
    .map(t => String(t).trim().toLowerCase());
  /* Rank by what the tool is actually worth TO THIS CHARACTER: an untrained +2 is a +1, so a
   * trained +1 ties it and the cheaper tool is no worse. Training is the tie-break. */
  const worth = item => {
    const b = item.system.bonus;
    const want = (b.training ?? "").trim().toLowerCase();
    const trained = !want || trainings.includes(want);
    return trained ? (b.value ?? 0) : Math.min(1, b.value ?? 0);
  };
  return tools.sort((a, b) => worth(b) - worth(a) || a.name.localeCompare(b.name))[0];
}

/** Everyone who could help: any other character the user owns need not be theirs, so this is a
 * count of what the acting player can legitimately claim -- the helper's own card is their play. */
export function helpOptions(actor) {
  return game.actors.filter(a => a.type === "character" && a.id !== actor?.id
    && a.testUserPermission(game.user, "OWNER")).length;
}
