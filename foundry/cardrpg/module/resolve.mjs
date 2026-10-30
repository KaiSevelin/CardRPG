/**
 * Resolving an action, in the order the rules give (core-rules 5):
 *
 *   1. Base value      -- the item's line for the verb
 *   2. Card modifier   -- any bonus on the card half
 *   3. Features        -- permanent modifiers
 *   4. Conditions      -- temporary modifiers
 *   5. Fate            -- one draw, applied
 *   6. Target defenses -- armor, then Block, never below 0
 *
 * Steps 1-3 are what the tray folds into a card face; 4-6 need a target, so they happen here.
 *
 * This is also where the bonus-group cap is enforced for real: one action may take at most one
 * bonus from each group, so same-group bonuses compete rather than stacking.
 */

import { CARDRPG } from "./config.mjs";
import { drawFate } from "./decks.mjs";

/* -------------------------------------------- */
/*  Bonuses                                     */
/* -------------------------------------------- */

/**
 * Collect the feature and tool bonuses that apply to this action, then keep **one per group**.
 *
 * Ungrouped bonuses all apply: a group caps stacking between bonuses of the same kind, and a slate
 * with no group isn't making a capped contribution in the first place.
 *
 * @returns {{total: number, applied: object[], blocked: object[]}}
 */
export function collectBonuses(actor, verb, item) {
  const candidates = [];

  for (const slate of actor.items) {
    const bonus = slate.system.bonus;
    if (!bonus?.value || bonus.verb !== verb) continue;
    // "Only equipped items can be used" (core-rules 4). Features are never out of play, so the
    // test is for items alone -- without it a ring granted its bonus from the bottom of the pack,
    // which six new worn slots would have made a great deal worse.
    if (slate.type === "item"
      && (!slate.system.equipped || CARDRPG.slots[slate.system.equippedSlot]?.stows)) continue;
    // A Drained slate gives nothing until it recharges.
    if (slate.system.drained) continue;
    // A tag requirement is about the item in hand, not the feature.
    if (bonus.requiresTag && !item?.system.tags?.has?.(bonus.requiresTag)) continue;

    candidates.push({
      name: slate.name,
      value: bonus.value,
      group: slate.system.group || null
    });
  }

  const best = new Map();
  const applied = [];
  const blocked = [];

  for (const candidate of candidates.sort((a, b) => b.value - a.value)) {
    if (!candidate.group) { applied.push(candidate); continue; }
    if (best.has(candidate.group)) { blocked.push(candidate); continue; }
    best.set(candidate.group, candidate);
    applied.push(candidate);
  }

  return {
    total: applied.reduce((n, b) => n + b.value, 0),
    applied,
    blocked
  };
}

/* -------------------------------------------- */
/*  Advantage                                   */
/* -------------------------------------------- */

/**
 * Work out advantage. Two sources of advantage still give one, and advantage and disadvantage
 * cancel -- so this returns a mode, never a stack.
 *
 * @returns {{mode: number, reasons: string[]}}
 */
export function advantageFor(actor, target, { ranged = false, area = false } = {}) {
  const reasons = [];
  let advantage = false;
  let disadvantage = false;

  const conditionsOf = a => (a?.system.activeConditions ?? []).map(c => c.key);
  const targetConditions = conditionsOf(target);

  // Melee Strikes against a Prone target have advantage.
  if (!ranged && targetConditions.includes("prone")) {
    advantage = true;
    reasons.push("target is Prone");
  }
  if (conditionsOf(actor).includes("invisible")) {
    advantage = true;
    reasons.push("attacking while Invisible");
  }

  // Ranged or Area while an enemy is adjacent. Adjacency needs the canvas, so this is the GM's
  // call when tokens aren't placed -- the tray offers a manual override.
  if ((ranged || area) && actorHasAdjacentEnemy(actor)) {
    disadvantage = true;
    reasons.push("ranged or area with an enemy adjacent");
  }

  if (advantage && disadvantage) {
    return { mode: 0, reasons: [...reasons, "advantage and disadvantage cancel"] };
  }
  return { mode: advantage ? 1 : disadvantage ? -1 : 0, reasons };
}

/** Chebyshev adjacency on the placed tokens, if there are any. */
function actorHasAdjacentEnemy(actor) {
  const token = actor.getActiveTokens()[0];
  if (!token || !canvas?.ready) return false;
  const size = canvas.grid.size;
  return canvas.tokens.placeables.some(other => {
    if (other === token || !other.actor) return false;
    if (other.actor.type === actor.type) return false;
    const dx = Math.abs(other.x - token.x) / size;
    const dy = Math.abs(other.y - token.y) / size;
    return Math.max(dx, dy) <= 1;
  });
}

/* -------------------------------------------- */
/*  Strike and Cast                             */
/* -------------------------------------------- */

/**
 * Resolve an attack against one target, and report every step so the arithmetic is auditable.
 *
 * Fate is drawn **once per action, not per target** -- an Area draws once and applies the same
 * result to everyone it hits, so a Critical doubles for all of them and a Miss wastes the lot.
 */
export async function resolveAttack(actor, { verb = "strike", item, mod = 0, targets = [], step = {} }) {
  const line = item?.system.verbs?.[verb];
  if (!line || line.value === null) {
    ui.notifications.warn(`${item?.name ?? "That item"} has no ${verb} line.`);
    return null;
  }

  const base = line.value;
  const bonuses = collectBonuses(actor, verb, item);
  const before = base + mod + bonuses.total;

  const ranged = !!(line.range && line.range > 1) || !!(step.range && step.range > 1);
  const area = !!(line.area || step.area);

  // One draw for the whole action.
  const first = targets[0] ?? null;
  const { mode, reasons } = advantageFor(actor, first, { ranged, area });
  const fate = await drawFate(actor, before, mode);

  const rows = [];
  for (const target of targets) {
    const armor = target.system.armor ?? 0;
    const block = target.system.block ?? 0;
    const dealt = Math.max(0, fate.result - armor - block);

    await target.update({
      "system.health.value": Math.max(0, target.system.health.value - dealt),
      // A Defend secondary or reaction covers one attack, so it is spent whatever it stopped; a
      // primary holds until the start of the defender's next turn and is cleared there instead.
      ...(block && !target.system.blockPersists ? { "system.block": 0 } : {})
    });

    rows.push({ name: target.name, armor, block, dealt, down: target.system.health.value - dealt <= 0 });
  }

  await attackCard(actor, { verb, item, base, mod, bonuses, fate, mode, reasons, rows });
  return { fate, rows, bonuses };
}

/** The chat card. Shows the whole chain, because a hidden calculation is an unauditable one. */
async function attackCard(actor, info) {
  const { verb, item, base, mod, bonuses, fate, mode, reasons, rows } = info;

  const chain = [`${item.name} ${verb} <strong>${base}</strong>`];
  if (mod) chain.push(`card ${mod > 0 ? "+" : ""}${mod}`);
  for (const bonus of bonuses.applied) chain.push(`${bonus.name} +${bonus.value}`);

  const modeLabel = mode > 0 ? " with advantage" : mode < 0 ? " with disadvantage" : "";
  const fateLabel = fate.used
    ? (fate.used.system.special === "miss" ? "Miss"
      : fate.used.system.special === "crit" ? "Critical"
        : (fate.used.system.value > 0 ? `+${fate.used.system.value}` : String(fate.used.system.value)))
    : "—";

  const parts = [
    `<p>${chain.join(" &middot; ")}</p>`,
    `<p>Fate${modeLabel}: <strong>${fateLabel}</strong> &rarr; ${fate.result}</p>`
  ];

  if (reasons.length) parts.push(`<p class="cr-note">${reasons.join("; ")}</p>`);

  // A blocked bonus is worth showing: it teaches the group rule better than any tooltip.
  if (bonuses.blocked.length) {
    parts.push(`<p class="cr-note">Not applied, same group already used: `
      + bonuses.blocked.map(b => `${b.name} (${b.group})`).join(", ") + `</p>`);
  }

  for (const row of rows) {
    parts.push(`<p><strong>${row.name}</strong>: ${fate.result}`
      + (row.armor ? ` &minus; ${row.armor} armor` : "")
      + (row.block ? ` &minus; ${row.block} Block` : "")
      + ` = <strong>${row.dealt}</strong> damage`
      + (row.dealt >= CARDRPG.defaults.woundAt ? ` &mdash; <em>a Wound</em>` : "")
      + (row.down ? ` &mdash; <strong>down</strong>` : "") + `</p>`);
  }

  if (fate.reshuffled) parts.push(`<p class="cr-note">Fate deck reshuffled.</p>`);
  if (fate.temporary) parts.push(`<p class="cr-note">${fate.temporary} temporary fate card removed.</p>`);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><h4>${actor.name} &mdash; ${verb}</h4>${parts.join("")}</div>`
  });
}

/* -------------------------------------------- */
/*  Defend, Heal, Use                           */
/* -------------------------------------------- */

/**
 * Defend gives Block X. Played as a primary it holds against every attack until your next turn;
 * as a secondary or a reaction it covers one attack only.
 */
export async function resolveDefend(actor, { item, half = "primary" }) {
  const value = item?.system.verbs?.defend?.value;
  if (!value) {
    ui.notifications.warn(`${item?.name ?? "That item"} has no defend line.`);
    return null;
  }

  // Blocks from different sources don't stack: use the highest -- and keep the duration of
  // whichever source won, or a Defend secondary played behind a Defend primary would silently
  // downgrade a round-long stance to a one-shot and make the extra card a downgrade.
  const current = actor.system.block ?? 0;
  const held = !!actor.system.blockPersists;
  const incoming = half === "primary";
  const block = Math.max(current, value);
  const persists = value > current ? incoming
    : value < current ? held
    : incoming || held;            // a tie: either source would serve, so take the longer one
  await actor.update({ "system.block": block, "system.blockPersists": persists });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> defends with ${item.name}: `
      + `Block <strong>${block}</strong>`
      + (persists
        ? ` against every attack until the start of their next turn.`
        : ` against the next attack.`)
      + `</p></div>`
  });
  return { block, persists };
}

/** Healing draws fate, same as damage. */
export async function resolveHeal(actor, { amount, target = actor, source = "" }) {
  const fate = await drawFate(actor, amount, 0);
  const healed = Math.min(fate.result, target.system.health.max - target.system.health.value);
  await target.update({ "system.health.value": target.system.health.value + healed });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> heals `
      + `${target === actor ? "themselves" : target.name}${source ? ` with ${source}` : ""}: `
      + `${amount} &rarr; <strong>${healed}</strong></p></div>`
  });
  return { healed, fate };
}

/** Use a belt consumable. Consumed items are deleted when spent. */
export async function resolveUse(actor, { item, target = actor }) {
  const line = item?.system.verbs?.use;
  if (!line) {
    ui.notifications.warn(`${item?.name ?? "That item"} has no use line.`);
    return null;
  }

  let result = null;
  if (line.value) result = await resolveHeal(actor, { amount: line.value, target, source: item.name });
  else {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="cardrpg"><p><strong>${actor.name}</strong> uses ${item.name}`
        + (line.text ? `: ${line.text}` : "") + `</p></div>`
    });
  }

  if (item.system.consumed) await item.delete();
  return result;
}

/* -------------------------------------------- */
/*  Conditions                                  */
/* -------------------------------------------- */

/**
 * A passive score: the highest value of an approach in the WHOLE skill deck, plus 2
 * (skill-rules 2).
 *
 * The whole deck, not the hand -- draw pile, discard and Spent alike -- so the number does not
 * wander as the day is played, and nobody is caught unaware for having drawn badly.
 *
 * Until the skill deck exists there is nothing to count, so this falls back to `system.passive`,
 * which is how an NPC carries a score at all, and then to the floor of 2 that a character with no
 * cards of an approach would have anyway.
 */
export function passiveScore(actor, approach) {
  const skills = actor?.system.decks?.skill ? game.cards.get(actor.system.decks.skill) : null;
  if (skills) {
    const best = skills.cards
      .filter(c => c.system?.approach === approach)
      .reduce((n, c) => Math.max(n, c.system.value ?? 0), 0);
    return best + 2;
  }
  return actor?.system.passive ?? 2;
}

/**
 * Put a condition on a target (core-rules 7).
 *
 * How it lands depends on whether the condition IS the action or rides on one:
 *
 * - With a `resist` approach, the target makes a **saving throw** -- passive score plus a fate
 *   card against the printed difficulty. A Partial halves the duration, or gives the `lesser`
 *   condition if the step names one.
 * - Without one, it simply lands. The attack it rode in on already drew fate, and drawing again to
 *   say the same thing twice is how a turn gets slow.
 *
 * Unconscious is never applied this way: it means 0 Health and nothing else (core-rules 8).
 */
export async function resolveCondition(actor, { step, target }) {
  const key = step.condition;
  if (!key || !target) return null;
  if (key === "unconscious") {
    ui.notifications.warn("Unconscious comes from 0 Health, not from an effect.");
    return null;
  }

  const label = key => game.i18n.localize(CARDRPG.conditions[key]?.label ?? key);
  const full = Math.max(1, step.duration ?? 1);
  let landed = { key, duration: full };
  let line;

  if (step.resist) {
    const score = passiveScore(target, step.resist);
    const dc = step.dc ?? CARDRPG.difficulties.normal;
    const { result, used } = await drawFate(target, score, 0);
    const miss = used?.system.special === "miss";
    const crit = used?.system.special === "crit";
    const short = dc - result;

    if (crit || (!miss && short <= 0)) landed = null;
    else if (!miss && short <= 2) {
      // Partial: half the duration, or the lesser condition if one is printed.
      landed = step.lesser
        ? { key: step.lesser, duration: full }
        : (Math.floor(full / 2) ? { key, duration: Math.floor(full / 2) } : null);
    }

    const approach = game.i18n.localize(CARDRPG.approaches[step.resist]?.label ?? step.resist);
    line = `resists with ${approach} ${score}${used ? ` ${used.system.label ?? ""}` : ""} `
      + `= ${result} against ${dc}: `
      + (landed ? `<strong>${label(landed.key)} (${landed.duration})</strong>` : "<strong>nothing</strong>");
  } else {
    line = `<strong>${label(key)} (${full})</strong>`;
  }

  if (landed) {
    const conditions = [...(target.system.conditions ?? []).map(c => ({ ...c }))];
    const already = conditions.find(c => c.key === landed.key);
    // The longer of the two wins: a second application refreshes rather than stacks.
    if (already) already.duration = Math.max(already.duration ?? 0, landed.duration);
    else conditions.push({ ...landed, creatorId: actor.id });
    await target.update({ "system.conditions": conditions });
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong> ${line}</p></div>`
  });
  return landed;
}
