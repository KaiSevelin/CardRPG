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
import {
  drawFate, deckOf, uprightCards, discardCards, cardName, addFateCards
} from "./decks.mjs";

/* -------------------------------------------- */
/*  What the kit has to be                      */
/* -------------------------------------------- */

/**
 * Does the item in hand satisfy a requirement? One test, asked by two callers.
 *
 * A slate's bonus asks it -- Strong wants a Heavy weapon -- and now a card step asks it too: Take
 * the Shot wants a ranged one. That is the same question about the same item, and it was written
 * twice the moment the card side existed, so it is written once here instead.
 *
 * `bothHands` is `isTwoHanded`, which is "held in two hands right now" rather than `hands === 2`:
 * a slung two-hander is one object on a back (data/items.mjs), and a card that wants both hands
 * wants them occupied, not merely spoken for.
 *
 * No requirement at all passes, which is nearly every step in the game.
 */
export function itemMeets(item, requires) {
  const tag = requires?.tag ?? "";
  const bothHands = !!requires?.bothHands;
  if (!tag && !bothHands) return true;
  if (!item) return false;
  if (tag && !item.system?.tags?.has?.(tag)) return false;
  if (bothHands && !item.system?.isTwoHanded) return false;
  return true;
}

/**
 * What a requirement reads as, on a face and in the warning when nothing qualifies.
 *
 * The field is the printed text now, so this is the only place the words live -- which is the point
 * of moving "Ranged." off the card: one sentence, generated from the thing the engine checks.
 */
export function requireText(requires) {
  const bits = [];
  if (requires?.tag) bits.push(requires.tag);
  if (requires?.bothHands) bits.push("both hands");
  return bits.join(", ");
}

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
    // A tag requirement is about the item in hand, not the feature -- the same question a card
    // step asks, so it goes through the same predicate rather than testing the tags again here.
    if (bonus.requiresTag && !itemMeets(item, { tag: bonus.requiresTag })) continue;

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

/** Does this actor carry that condition right now? The one test every combo clause runs. */
export function carries(actor, key) {
  if (!key || !actor) return false;
  return (actor.system.activeConditions ?? []).some(c => c.key === key);
}

/**
 * Cast a prepared spell.
 *
 * Nothing cast a spell before this. `prepared`, `slotCost` and `effect` have all existed since the
 * data model was written, and the only thing that ever read `effect` was the validator -- so the
 * audit's largest gap, *a spell that costs Health to cast*, was a price on an action that did not
 * happen. The price is the smaller half of this.
 *
 * The effect goes through `resolveAttack` when it has a value to deal, because the slate answers
 * `verbs.cast` like an item would (data/items.mjs). Everything else -- a condition, a heal, a
 * shake -- is the same step shape a card half uses, so the caller resolves it with the same code
 * that resolves a card. One step vocabulary, two kinds of document.
 *
 * @returns {boolean} whether it was cast, so the caller knows not to resolve the effect
 */
export async function payToCast(actor, slate) {
  if (!slate?.system?.prepared) {
    ui.notifications.warn(`${slate?.name ?? "That spell"} is in your book, not in your head.`);
    return false;
  }
  const cost = slate.system.cost?.health ?? 0;
  if (!cost) return true;

  /*
   * You may not kill yourself casting. The floor is 1 rather than 0 because 0 Health is
   * Unconscious (core-rules 8) and a spell that knocks its own caster out before it resolves is a
   * rule nobody wrote -- so the cost is refused, not survived.
   */
  const health = actor.system.health?.value ?? 0;
  if (health - cost < 1) {
    ui.notifications.warn(
      `${slate.name} costs ${cost} Health and you have ${health}. That is not a price, it is a death.`);
    return false;
  }
  await actor.update({ "system.health.value": health - cost });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> pays <strong>${cost} Health</strong> `
      + `for <em>${slate.name}</em>.</p></div>`
  });
  return true;
}

/**
 * Work out advantage. Two sources of advantage still give one, and advantage and disadvantage
 * cancel -- so this returns a mode, never a stack.
 *
 * `when` is a half's combo clause (data/cards.mjs): if its opening is on the target and it promises
 * advantage, that is one more source of the same single advantage, not a second one.
 *
 * @returns {{mode: number, reasons: string[]}}
 */
export function advantageFor(actor, target, {
  ranged = false, area = false, when = null, ignoresCover = false
} = {}) {
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
  /*
   * What the attacker's own conditions do to their draw, from the config flags rather than by key.
   * Invisible granted advantage through a hardcoded `includes("invisible")` until Heckled needed
   * the other half of the same idea and found nowhere to declare it.
   */
  for (const key of conditionsOf(actor)) {
    const cfg = CARDRPG.conditions[key];
    if (!cfg?.grantsAdvantage && !cfg?.drawsWithDisadvantage) continue;
    const label = game.i18n.localize(cfg.label ?? key);
    if (cfg.grantsAdvantage) { advantage = true; reasons.push(`attacking while ${label}`); }
    if (cfg.drawsWithDisadvantage) { disadvantage = true; reasons.push(`attacking while ${label}`); }
  }
  /*
   * A feature granting advantage against anyone carrying an opening. Unlike the `when` clause
   * below, this reads ANY opening -- it is the Thief's whole claim, and the reason the Thief is the
   * node a party sets up *for* rather than one that sets up for itself.
   */
  if (!advantage && targetConditions.some(key => CARDRPG.openings.includes(key))) {
    const slate = (actor?.items ?? []).find(i =>
      i.type === "feature" && i.system.advantage?.vsOpening);
    if (slate) {
      advantage = true;
      reasons.push(`${slate.name}: the target carries an opening`);
    }
  }
  if (when?.advantage && when.needs && carries(target, when.needs)) {
    advantage = true;
    const label = game.i18n.localize(CARDRPG.conditions[when.needs]?.label ?? when.needs);
    reasons.push(`target is ${label}`);
  }

  // Ranged or Area while an enemy is adjacent. Adjacency needs the canvas, so this is the GM's
  // call when tokens aren't placed -- the tray offers a manual override.
  if ((ranged || area) && actorHasAdjacentEnemy(actor)) {
    disadvantage = true;
    reasons.push("ranged or area with an enemy adjacent");
  }

  /*
   * Cover (core-rules 11). The advantage table has cited it since the first draft and nothing read
   * it, which is why Moth-wing Fletching could promise to ignore something that did not exist.
   *
   * It is a DECLARED state, not a line traced across the canvas: cover from figures would change
   * the disadvantage on every ranged attack in the game, and every win rate this project has
   * published was measured without it (../../sim/analysis-2026-10-30.md). So the GM marks it, the
   * way they mark Prone, and `false` by default moves no measured number.
   */
  if ((ranged || area) && target?.system?.cover && !ignoresCover) {
    disadvantage = true;
    reasons.push("target is in cover");
  }
  if (target?.system?.cover && ignoresCover) reasons.push("cover ignored");

  if (advantage && disadvantage) {
    return { mode: 0, reasons: [...reasons, "advantage and disadvantage cancel"] };
  }
  return { mode: advantage ? 1 : disadvantage ? -1 : 0, reasons };
}

/**
 * Everyone standing next to this actor, by Chebyshev distance on the placed tokens.
 *
 * Empty when nothing is placed, which is deliberate: an unplaced fight has no geometry, and a rule
 * that needs geometry should do nothing rather than guess.
 */
export function neighbours(actor) {
  const token = actor?.getActiveTokens?.()[0];
  if (!token || !canvas?.ready) return [];
  const size = canvas.grid.size;
  return canvas.tokens.placeables
    .filter(other => {
      if (other === token || !other.actor) return false;
      const dx = Math.abs(other.x - token.x) / size;
      const dy = Math.abs(other.y - token.y) / size;
      return Math.max(dx, dy) <= 1;
    })
    .map(t => t.actor);
}

/** Chebyshev adjacency on the placed tokens, if there are any. */
function actorHasAdjacentEnemy(actor) {
  return neighbours(actor).some(other => other.type !== actor.type);
}

/* -------------------------------------------- */
/*  Strike and Cast                             */
/* -------------------------------------------- */

/**
 * Lift: remove a condition that has no duration to spend (core-rules 7).
 *
 * Shake Off spends duration and these have none, so they needed the other keyword. For a fate
 * condition that means two things at once -- the marker comes off the character AND the temporary
 * card comes out of the fate deck -- and doing only the first would leave a Miss in the deck that
 * nothing would ever account for.
 */
/*
 * Renamed from `resolveLift`, which collided with the Cutpurse's Signature. This removes a
 * CONDITION; that card steals a CARD. The published card keeps the name it is printed with and the
 * function takes the one that says what it does -- the same cure `range`/`reach` needed.
 */
export async function liftCondition(actor, { target, key }) {
  if (!target || !CARDRPG.liftable(key)) {
    ui.notifications.warn(`${target?.name ?? "That target"} has nothing of that kind to lift.`);
    return null;
  }
  const conditions = (target.system.toObject().conditions ?? []).map(c => ({ ...c }));
  if (!conditions.some(c => c.key === key)) return null;

  const label = game.i18n.localize(CARDRPG.conditions[key]?.label ?? key);
  await target.update({ "system.conditions": conditions.filter(c => c.key !== key) });

  // The card it put in the fate deck goes with it.
  let pulled = 0;
  const which = CARDRPG.conditions[key]?.temporaryFate;
  if (which) {
    for (const stack of ["fate", "fateDiscard"]) {
      const deck = deckOf(target, stack);
      const spoiled = (deck?.cards ?? []).filter(c =>
        c.type === "fate" && c.system.temporary && c.system.special === which
      );
      for (const card of spoiled) {
        await card.delete();
        pulled++;
      }
    }
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong>: ${label} <strong>lifted</strong>`
      + (pulled ? `, and ${pulled} temporary card out of the fate deck` : "") + `.</p></div>`
  });
  return { key, pulled };
}

/**
 * Tainting N: N Taint cards into a deck the target plays from (core-rules 8). This is how **poison**
 * works, and how disease and corruption do -- the rules have said so since they were written and
 * nothing applied it.
 *
 * `fast` is the whole dial, and it is one word rather than a second mechanic:
 *
 * - **slow** (the default) puts the card in the **discard**, so it comes round at a moment nobody
 *   chose. That is a venom working while you fight.
 * - **fast** puts it in the **hand**, where it resolves at once: 1 damage past armor, and a hand one
 *   card short. That is a dose that drops you now.
 *
 * `flavour` decides which deck, and the rules already set the split: **body** taint (poison,
 * disease) goes in the action deck, **mind** taint (dark magic, horrors) in the skill deck.
 */
export async function resolveTaint(actor, { amount = 1, target, flavour = "body", fast = false, source = "" }) {
  if (!target) return null;
  const which = flavour === "mind"
    ? (fast ? "skillHand" : "skillDiscard")
    : (fast ? "actionHand" : "actionDiscard");
  const stack = deckOf(target, which);
  if (!stack) {
    ui.notifications.warn(`${target.name} has no ${which} to be tainted in.`);
    return null;
  }

  const n = Math.max(1, amount);
  await stack.createEmbeddedDocuments("Card", Array.from({ length: n }, () => ({
    name: flavour === "mind" ? "Taint (mind)" : "Taint (body)",
    type: "taint",
    system: { flavour, source }
  })));

  /*
   * Fast taint resolves on arrival, because the card's own text fires "when drawn" and a card put
   * into a hand was never drawn. Doing it here keeps that text true rather than adding a case to it.
   */
  let dealt = 0;
  if (fast) {
    dealt = n;
    await target.update({
      "system.health.value": Math.max(0, target.system.health.value - n)
    });
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong>: Tainting <strong>${n}</strong> `
      + `&mdash; ${n} ${flavour} Taint into the ${fast ? "hand" : "discard"}`
      + (dealt ? `, resolving at once for <strong>${dealt}</strong> past armor` : "")
      + `.</p></div>`
  });
  return { amount: n, flavour, fast, dealt };
}

/**
 * Corrode N: take N off the target's armor until it is repaired (core-rules 8).
 *
 * The only effect in the game that spends **gear**, which is a resource leveling 5a.1 names and
 * nothing implemented. It eats the equipped body slate rather than the actor's armor number, so the
 * loss follows the armour when it is taken off, and a repair is a reset rather than a guess.
 */
export async function resolveCorrode(actor, { amount = 1, target }) {
  if (!target) return null;
  const armour = target.items?.find(i =>
    i.type === "item" && i.system.equipped && i.system.equippedSlot === "body" && i.system.armor > 0
  );
  if (!armour) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="cardrpg"><p><strong>${target.name}</strong> has no armour to eat.</p></div>`
    });
    return null;
  }

  const before = armour.system.armorNow;
  const eaten = Math.min(before, Math.max(1, amount));
  await armour.update({ "system.corroded": (armour.system.corroded ?? 0) + eaten });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong>: ${armour.name} armor `
      + `${before} &rarr; <strong>${before - eaten}</strong>, until it is repaired.</p></div>`
  });
  return { item: armour.name, before, now: before - eaten };
}

/**
 * Shake Off N: take N off one condition's duration, and remove it at 0 (core-rules 7).
 *
 * The condition is chosen by the caller, because which one to shed is the whole decision -- a turn
 * where the engine picks for you is a turn you did not play. Everything else here is arithmetic.
 *
 * A targeted counter -- a spell that answers one named condition and nothing else -- is this with
 * the caller's list already narrowed to one key, so there is no second mechanism for it.
 *
 * @returns {Promise<{key: string, was: number, now: number, gone: boolean}|null>}
 */
export async function resolveShake(actor, { amount = 1, target = actor, key }) {
  const conditions = (target.system.toObject().conditions ?? []).map(c => ({ ...c }));
  const found = conditions.find(c => c.key === key);
  if (!found || !CARDRPG.shakeable(key)) {
    ui.notifications.warn(`${target.name} has nothing of that kind to shake off.`);
    return null;
  }

  const label = game.i18n.localize(CARDRPG.conditions[key]?.label ?? key);
  const was = found.duration ?? 1;
  const now = Math.max(0, was - Math.max(1, amount));
  const gone = now === 0;

  await target.update({
    "system.conditions": gone ? conditions.filter(c => c !== found)
      : conditions.map(c => (c === found ? { ...c, duration: now } : c))
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong>: ${label} `
      + (gone ? "<strong>ends</strong>" : `${was} &rarr; <strong>${now}</strong>`) + `</p></div>`
  });
  return { key, was, now, gone };
}

/**
 * Everything within reach: equipped in a slot that is free to grab from (core-rules 4).
 *
 * Reach is the belt rule and the rules lean on it twice -- a shaft on your belt rides the Strike,
 * and a stopper on your belt answers a hit -- so it is one function rather than the same filter
 * written out wherever something needs grabbing.
 */
export function withinReach(actor) {
  return (actor?.items ?? []).filter(i =>
    i.type === "item"
    && i.system.equipped
    && CARDRPG.slots[i.system.equippedSlot]?.freeEquip
  );
}

/** Can this slate be used at all? A value to it, or words saying what using it does. */
export function isUsable(item) {
  const line = item?.system?.verbs?.use;
  return (line?.value ?? null) !== null || !!line?.text;
}

/**
 * Magical ammunition within reach, for a weapon that takes any (core-rules 4).
 *
 * Ordinary ammunition is not here because it is not tracked at all -- a quiver is kilograms and a
 * bow simply works.
 */
export function reachableAmmo(actor, weapon) {
  if (!weapon?.system?.ammo) return [];
  return withinReach(actor).filter(i => i.system.isAmmunition && i.system.suits(weapon));
}

/**
 * Pull the shooter to the target (the Grapnel Bolt). The only thing in the catalogue that moves
 * the person firing, which is why it gets a hook rather than a step: every step targets the target.
 */
async function pullShooterTo(actor, target) {
  const token = actor?.getActiveTokens?.()[0];
  const to = target?.getActiveTokens?.()[0];
  if (!token || !to) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="cardrpg"><p><strong>${actor.name}</strong> is pulled to a square `
        + `adjacent to the target. <em>No tokens placed -- the GM moves it.</em></p></div>`
    });
    return;
  }

  const size = canvas.grid.size;
  const squares = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      squares.push({ x: to.x + dx * size, y: to.y + dy * size });
    }
  }
  // You cannot land on anybody: enemies block, and an ally's square is not a square you share.
  const taken = new Set(canvas.tokens.placeables
    .filter(t => t.id !== token.id)
    .map(t => `${t.x},${t.y}`));
  const free = squares.filter(sq => !taken.has(`${sq.x},${sq.y}`));
  if (!free.length) {
    ui.notifications.info("Nowhere adjacent to land -- the line is wasted.");
    return;
  }

  // The nearest free one, so the pull is the shortest trip that gets you there.
  const away = sq => Math.max(Math.abs(sq.x - token.x), Math.abs(sq.y - token.y));
  const best = free.reduce((a, b) => (away(b) < away(a) ? b : a));
  await token.document.update({ x: best.x, y: best.y });
}

/* -------------------------------------------- */
/*  Reactions                                   */
/* -------------------------------------------- */

/**
 * What this actor may react with against one trigger (core-rules 3).
 *
 * Every option is a card and a number: the card that will be spent, and what it is worth against
 * this hit. Legality is read rather than assumed -- Stunned takes every reaction, Plate takes the
 * Sidestep, a Parry answers melee only, a Block wants a shield -- so none of it is a case here.
 *
 * **Brace is the floor under every upright card** whose printed reaction cannot fire. That is the
 * rule's own stated purpose ("no card in your hand is dead"), and it is why a hand of three Strikes
 * can still answer an arrow: core-rules 3 says Brace belongs to a card *without* a printed reaction, which
 * was written to stop a Parry choosing the worse of its two options -- something the policy below
 * does by taking the best number anyway.
 *
 * @returns {object[]} `{key, card, item?, reduce, heal?}`
 */
export function reactionsFor(actor, trigger, { melee = false } = {}) {
  // Stunned and Unconscious take Brace too: "you can't play reactions" has no exception, which is
  // why this is tested here and not through `blockedReactions`, which names what gear takes.
  if (!actor || actor.system.noReactions || actor.system.exhausted) return [];

  const off = actor.system.blockedReactions ?? new Set();
  const equipped = (actor.items ?? []).filter(i =>
    i.type === "item" && i.system.equipped && !CARDRPG.slots[i.system.equippedSlot]?.stows);

  const options = [];
  for (const card of uprightCards(actor)) {
    const key = card.system?.reaction || "";
    const rule = key ? CARDRPG.reactions[key] : null;
    const live = !!rule && rule.trigger === trigger && !off.has(key) && !(rule.melee && !melee);
    let printed = null;

    if (live && (key === "parry" || key === "block")) {
      // The item is the value: a Parry is worth your sword's Defend line, a Block your shield's
      // and one more for being a shield (starter-cards: Reactions).
      const item = equipped.find(i => (i.system.verbs?.defend?.value ?? 0) > 0
        && (!rule.needsTag || i.system.tags?.has?.(rule.needsTag)));
      if (item) printed = { key, card, item, reduce: item.system.verbs.defend.value + (rule.bonus ?? 0) };
    } else if (live && key === "use") {
      const belt = withinReach(actor).find(i => isUsable(i));
      if (belt) printed = { key, card, item: belt, reduce: 0, heal: belt.system.verbs.use.value ?? 0 };
    } else if (live && key === "counter") {
      /*
       * A reach weapon, answering with its own Strike line -- the only reaction that deals damage.
       * Both ends of the band matter: long enough to be a reach weapon at all, and still able to
       * hit the square next to you, which is where the enemy has just arrived. A Pike is reach 3
       * from 2, so it cannot; its own card has said "useless adjacent" all along.
       */
      const item = equipped.find(i => {
        const strike = i.system.verbs?.strike;
        if ((strike?.value ?? null) === null) return false;
        return (strike.reach ?? 1) >= (rule.needsReach ?? 1) && (strike.reachMin ?? 1) <= 1;
      });
      if (item) printed = { key, card, item, reduce: 0, hits: item.system.verbs.strike.value };
    } else if (live) {
      // `valued` reactions carry a number the card printed; the rest are worth one of themselves.
      printed = { key, card, reduce: 0, param: rule.valued ? (card.system.reactionParam ?? 1) : 1 };
    }

    if (printed) options.push(printed);
    // Nothing printed fired -- wrong trigger, no shield, a drawback took it -- so the card is a
    // Brace, and a hit is the only thing a Brace answers.
    else if (trigger === "hit") options.push({ key: "brace", card, reduce: CARDRPG.defaults.brace });
  }
  return options;
}

/**
 * Which reaction fires, now that nobody is asked (core-rules 3).
 *
 * Reactions resolve automatically, so this is the policy -- and the threshold is **two events the
 * rules already name** rather than a tuned number: a reaction fires when it stops a **Wound**
 * (core-rules 8) or stops you being **dropped**. Nothing else is worth a card.
 *
 * That gate is the whole difference between automation and a hand emptied by round two. Spending a
 * card to shave one point off a scratch is legal, and five enemies landing five scratches would
 * legally cost a whole hand; it also makes a reaction the least interesting thing in the game. The
 * rule is "react when the hit is serious", and the rules already define serious twice.
 *
 * A player who disagrees has the only control that matters and it is not a setting: **turn the card
 * sideways** and it is never offered. That is what lets this function stay greedy rather than
 * clever -- it never has to guess whether you would rather have kept a card.
 */
export function chooseReaction(options, { incoming, health }) {
  if (!options?.length || incoming <= 0) return null;
  const wound = CARDRPG.defaults.woundAt;
  const lethal = incoming >= health;

  const scored = [];
  for (const option of options) {
    if (option.key === "use") {
      /*
       * A stopper answers the hit AFTER this one, never this one: it is drunk once the blow has
       * landed, and a blow that drops you leaves you Unconscious and Wounded before the cork is
       * out (core-rules 8). So the trigger is "you could not take another like that" -- which
       * needs no threshold of its own, because the hit you just took is the measure.
       */
      const heal = option.heal ?? 0;
      if (!lethal && heal > 0 && health - incoming < incoming) {
        scored.push({ ...option, worth: heal, because: "could not take another" });
      }
      continue;
    }
    const reduce = option.reduce ?? 0;
    const after = Math.max(0, incoming - reduce);
    if (lethal && after < health) scored.push({ ...option, worth: reduce, because: "stops the drop" });
    else if (incoming >= wound && after < wound) {
      scored.push({ ...option, worth: reduce, because: "stops a Wound" });
    }
  }
  if (!scored.length) return null;
  return scored.reduce((a, b) => (b.worth > a.worth ? b : a));
}

/**
 * Spend the card. A reaction always goes to the **discard**, never to the Spent pile: `costs` holds
 * `primary` and `secondary` only, so a card printed Spent on a half is still only discarded when it
 * answers a hit -- which means a reaction is the cheap way out of an expensive card, and core-rules 3 says so.
 */
async function spendReaction(actor, choice) {
  await discardCards(actor, [choice.card.id]);
  return choice;
}

/**
 * Redirection, step one of two (core-rules 3): a Bodyguard takes a hit meant for an adjacent ally.
 *
 * It fires when the hit **would drop** the ally, which is the same named event the reduction policy
 * uses and the only defensible automatic reading -- an engine that threw itself in front of every
 * scratch would kill the bodyguard for nothing by round two. Among those who could, the first in
 * **initiative order** takes it, which is the order core-rules 3 already gives this step.
 */
export async function redirectHit(attacker, target, incoming) {
  if (incoming < (target?.system?.health?.value ?? 0)) return null;

  const order = game.combat?.turns ?? [];
  const place = who => {
    const at = order.findIndex(t => t.actor?.id === who.id);
    return at < 0 ? Number.MAX_SAFE_INTEGER : at;
  };

  const guards = neighbours(target)
    .filter(who => who.id !== target.id && who.id !== attacker?.id && who.type === target.type)
    .map(who => ({ who, options: reactionsFor(who, "allyHit") }))
    .filter(entry => entry.options.length)
    .sort((a, b) => place(a.who) - place(b.who));
  if (!guards.length) return null;

  const { who, options } = guards[0];
  const choice = await spendReaction(who, options[0]);
  return { actor: who, for: target, card: cardName(choice.card) };
}

/**
 * Sidestep: an enemy that **ends its move** next to you hands you one (core-rules 11).
 *
 * It neither redirects nor reduces -- you step out of reach and the Strike that was coming finds
 * nobody -- so it resolves at its own trigger, outside the two-step order, and it has no damage to
 * measure itself against. The square is **random among the legal ones**: free, and out of the reach
 * of the enemy that arrived, because a step that leaves you adjacent spends a card for nothing.
 */
export async function sidestep(actor, enemy, option) {
  if (!option) return null;

  const token = actor.getActiveTokens()[0];
  const from = enemy?.getActiveTokens?.()[0];
  if (!token || !from || !canvas?.ready) return null;

  const size = canvas.grid.size;
  const taken = new Set(canvas.tokens.placeables
    .filter(t => t.id !== token.id)
    .map(t => `${t.x},${t.y}`));

  // How far, which is one square unless the card printed a number (`Roll With It`: Sidestep 2).
  const span = Math.max(1, option.param ?? 1);
  const legal = [];
  for (let dx = -span; dx <= span; dx++) {
    for (let dy = -span; dy <= span; dy++) {
      if (!dx && !dy) continue;
      const sq = { x: token.x + dx * size, y: token.y + dy * size };
      if (taken.has(`${sq.x},${sq.y}`)) continue;
      const away = Math.max(Math.abs(sq.x - from.x), Math.abs(sq.y - from.y)) / size;
      if (away <= 1) continue;              // still in its reach: the card would buy nothing
      legal.push(sq);
    }
  }
  if (!legal.length) return null;           // cornered, and the card stays in hand

  const to = legal[Math.floor(Math.random() * legal.length)];
  const choice = await spendReaction(actor, option);
  await token.document.update({ x: to.x, y: to.y });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> sidesteps `
      + `${enemy.name}${span > 1 ? ` ${span} squares` : ""}, spending `
      + `<em>${cardName(choice.card)}</em>. The reach is broken.</p></div>`
  });
  return { card: cardName(choice.card), to };
}

/**
 * Counter: an enemy that ends its move next to you takes your Strike (*Set Spear*, way-cards 3.2).
 *
 * The only reaction that answers by dealing damage, and it is **flat** -- the item's Strike line,
 * armour and Block off it, and no fate draw, because **no reaction draws fate** (core-rules 3). The
 * documents already speak this way where they are specific: a Trapmaker's trap deals "your Strike
 * value" and a Duellist's Parry "also Strikes for 1".
 *
 * **A reaction's damage is not itself a trigger.** Nothing is offered against this hit -- the
 * arriving enemy does not Brace -- because a reaction answering a reaction is where one-per-trigger
 * stops meaning anything, and a rule is a better floor than a recursion counter.
 */
export async function counter(actor, enemy, option) {
  if (!option || !enemy) return null;

  const armor = enemy.system.armor ?? 0;
  const block = enemy.system.block ?? 0;
  const dealt = Math.max(0, (option.hits ?? 0) - armor - block);
  const choice = await spendReaction(actor, option);

  await enemy.update({
    "system.health.value": Math.max(0, enemy.system.health.value - dealt),
    ...(block && !enemy.system.blockPersists ? { "system.block": 0 } : {})
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> sets against `
      + `${enemy.name} with ${option.item.name}, spending <em>${cardName(choice.card)}</em>: `
      + `${option.hits}`
      + (armor ? ` &minus; ${armor} armor` : "")
      + (block ? ` &minus; ${block} Block` : "")
      + ` = <strong>${dealt}</strong> damage`
      + (enemy.system.health.value - dealt <= 0 ? ` &mdash; <strong>down</strong>` : "")
      + `.</p></div>`
  });
  return { card: cardName(choice.card), dealt };
}

/**
 * The arrival trigger has two possible answers and you get **one** reaction, so it needs an order.
 *
 * **A Sidestep goes first, because stepping out of reach denies the attack and countering does
 * not** -- the Strike that was coming finds nobody, where a counter trades damage for damage. A
 * player who would rather set their spear turns the Advance sideways, which is the whole of how
 * this is overridden; there is no setting for it.
 */
export async function answerArrival(actor, enemy) {
  const options = reactionsFor(actor, "arrival");
  if (!options.length) return null;

  const step = options.find(o => o.key === "sidestep");
  const stepped = step ? await sidestep(actor, enemy, step) : null;
  if (stepped) return stepped;

  /*
   * Then the heckle, and then the counter. One reaction answers an arrival, so the order IS the
   * policy -- and the policy core-rules 3 states is about not being Wounded and not being dropped,
   * which makes mitigation outrank retaliation. Stepping out of reach denies the attack; spoiling
   * the draw blunts it; the counter does neither and hits back instead.
   */
  const heckling = options.find(o => o.key === "heckle");
  if (heckling) return heckle(actor, enemy, heckling);

  const set = options.find(o => o.key === "counter");
  return set ? await counter(actor, enemy, set) : null;
}

/**
 * Heckle: the arriving enemy draws fate with disadvantage until your next turn.
 *
 * Like the counter, it draws no fate of its own and nothing answers it (core-rules 3). Unlike the
 * counter it deals no damage, which is why it sits ahead of one in the order: a spoiled draw is
 * worth more to a figure trying not to be Wounded than a Strike is.
 */
export async function heckle(actor, enemy, option) {
  const existing = (enemy.system.toObject().conditions ?? []).map(c => ({ ...c }));
  if (existing.some(c => c.key === "heckled")) return null;
  await enemy.update({
    "system.conditions": [...existing, { key: "heckled", duration: 1, creatorId: actor.id }]
  });
  await spendReaction(actor, option);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> heckles `
      + `<strong>${enemy.name}</strong>: it draws fate with disadvantage.</p></div>`
  });
  return { key: "heckle", card: option.card };
}

/**
 * Foresee: look at one NPC type's intent card for this round (core-rules 6).
 *
 * The card stays face down. It is whispered, because the rules are explicit that *who knows* is a
 * decision at the table and not a rule -- the player learns it and says what they like.
 */
export async function resolveForesee(actor, kind) {
  const intent = kind ? deckOf(kind, "intent") : null;
  const card = intent?.cards.contents[0];
  if (!card) {
    ui.notifications.info(game.i18n.localize("CARDRPG.Foresee.Nothing"));
    return null;
  }
  const name = card.faces?.[0]?.name ?? card.name;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    whisper: ChatMessage.getWhisperRecipients("GM").concat(game.user.id),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> foresees `
      + `<strong>${kind.system.kind || kind.name}</strong>: ${name}</p></div>`
  });
  return name;
}

/**
 * Resolve an attack against one target, and report every step so the arithmetic is auditable.
 *
 * Fate is drawn **once per action, not per target** -- an Area draws once and applies the same
 * result to everyone it hits, so a Critical doubles for all of them and a Miss wastes the lot.
 *
 * `ammo` is one piece of magical ammunition nocked onto this Strike (core-rules 4). It costs no
 * half of its own, it must suit the weapon, its `shot` step folds into this one, and it is **gone
 * whether the shot lands or misses**. `payload` is the potion a Hollow Bolt carries.
 */
export async function resolveAttack(actor, {
  verb = "strike", item, mod = 0, targets = [], step = {}, ammo = null, payload = null
}) {
  const line = item?.system.verbs?.[verb];
  if (!line || line.value === null) {
    ui.notifications.warn(`${item?.name ?? "That item"} has no ${verb} line.`);
    return null;
  }

  /*
   * Suitability is the one rule ammunition has that is not about effect, and it is checked here
   * rather than in the picker: a nock that reaches the resolver from a macro or a replayed flag
   * has to meet the same rule as a nock that came from a click.
   */
  if (ammo && !ammo.system.suits(item)) {
    ui.notifications.warn(`${ammo.name} does not suit ${item.name}.`);
    return null;
  }
  const shot = ammo ? ammo.system.shot : null;
  const effect = ammo?.system.shotEffect ?? "";

  const base = line.value;
  const bonuses = collectBonuses(actor, verb, item);
  const before = base + mod + (shot?.mod ?? 0) + bonuses.total;

  const ranged = !!(line.range && line.range > 1) || !!(step.range && step.range > 1);
  const area = !!(line.area || step.area || shot?.area);

  /*
   * The combo clause. `advantage` has to be settled before the draw and there is only one draw, so
   * like the ranged-in-melee rule it is decided from the first target -- the existing compromise,
   * not a new one. `mod` is settled per target AFTER the draw, because an Area may catch one Wet
   * goblin and one dry one and they must not take the same damage.
   */
  const when = step.when?.needs ? step.when : null;

  // One draw for the whole action.
  const first = targets[0] ?? null;
  const { mode, reasons } = advantageFor(actor, first, {
    ranged, area, when, ignoresCover: effect === "ignoresCover"
  });
  const fate = await drawFate(actor, before, mode);
  // A Miss is a shot that went wide: nothing arrives, so nothing the piece promised arrives either.
  const missed = fate.used?.system.special === "miss";

  const rows = [];
  for (const target of targets) {
    // `ignores N armor` comes off the armour, never off Block: a crossbow bolt finds a gap in
    // plate, it does not get past a raised shield (core-rules 5 keeps the two separate).
    const pierce = (line.ignores ?? 0) + (step.ignores ?? 0) + (shot?.ignores ?? 0);
    const against = who => {
      const armor = Math.max(0, (who.system.armor ?? 0) - pierce);
      const block = who.system.block ?? 0;
      const combo = when && carries(who, when.needs) ? (when.mod ?? 0) : 0;
      return { armor, block, combo, incoming: Math.max(0, fate.result + combo - armor - block) };
    };

    /*
     * Reactions, in the two steps core-rules 3 gives, and both AFTER the draw: Parry fires on "you
     * are hit" and Brace on "you take damage", so a Miss costs the defender nothing -- `incoming`
     * is 0 on a Miss, which is the whole of that rule.
     *
     * 1. REDIRECTION changes who is being hit, so it goes first; the original target is never
     *    asked to spend a card against a blow an ally has already taken for them.
     */
    const guard = missed ? null : await redirectHit(actor, target, against(target).incoming);
    const taker = guard?.actor ?? target;

    // 2. REDUCTION, to whoever is the target now. One reaction per trigger covers both steps, so a
    //    Bodyguard that just intercepted cannot also Brace -- it has spent its card.
    const { armor, block, combo, incoming } = against(taker);
    const reaction = (missed || guard)
      ? null
      : chooseReaction(reactionsFor(taker, "hit", { melee: !ranged }), {
        incoming, health: taker.system.health.value
      });
    if (reaction) await spendReaction(taker, reaction);

    const dealt = Math.max(0, incoming - (reaction?.reduce ?? 0));

    await taker.update({
      "system.health.value": Math.max(0, taker.system.health.value - dealt),
      // A Defend secondary or reaction covers one attack, so it is spent whatever it stopped; a
      // primary holds until the start of the defender's next turn and is cleared there instead.
      ...(block && !taker.system.blockPersists ? { "system.block": 0 } : {})
    });

    rows.push({
      name: taker.name, armor, block, combo, dealt,
      opening: combo ? game.i18n.localize(CARDRPG.conditions[when.needs]?.label ?? when.needs) : null,
      down: taker.system.health.value - dealt <= 0,
      guard: guard ? { name: guard.actor.name, forName: target.name, card: guard.card } : null,
      reaction: reaction
        ? { key: reaction.key, card: cardName(reaction.card), reduce: reaction.reduce ?? 0,
          item: reaction.item?.name ?? null, because: reaction.because }
        : null
    });

    /*
     * A stopper is drunk once the blow has landed, which is what makes Use a real alternative to
     * reducing rather than a second reduction: you take the hit in full and answer the next one.
     */
    if (reaction?.key === "use" && reaction.item) {
      await resolveUse(taker, { item: reaction.item, target: taker });
    }
  }

  /*
   * Spend the piece. It goes before anything it does, and unconditionally: core-rules 4 says gone
   * whether the shot lands or misses, and spending it first means a hook that throws cannot hand
   * a magic arrow back. Everything the card and the hooks still need is copied off it here.
   */
  const nocked = ammo
    ? { name: ammo.name, line: ammo.system.shotLine, effect, missed, mod: shot?.mod ?? 0 }
    : null;
  if (ammo) await ammo.delete();

  await attackCard(actor, { verb, item, base, mod, bonuses, fate, mode, reasons, rows, nocked });

  if (shot?.condition && !missed) {
    for (const target of targets) await resolveCondition(actor, { step: shot, target });
  }

  if (!missed) {
    switch (effect) {
      // Whatever you hit drinks it: one potion, delivered at range, and spent in the delivering.
      case "carriesPotion":
        if (payload) await resolveUse(actor, { item: payload, target: first });
        break;
      case "pullsShooter":
        await pullShooterTo(actor, first);
        break;
      /*
       * `ignoresCover` was settled before the draw, in advantageFor.
       *
       * `seesInvisible` does nothing here on purpose. Invisible currently hands the attacker
       * advantage rather than stopping a target (conditions.md 10 holds that open question), so
       * there is nothing yet for a permission to permit. The field exists so the promise is data
       * rather than prose the day that question is answered, and the validator holds it to being
       * the ONLY inert piece.
       */
      default:
        break;
    }
  }

  return { fate, rows, bonuses, missed, nocked };
}

/** A reaction's name, including the one that is never printed on a card. */
function reactionName(key) {
  if (key === "brace") return game.i18n.localize("CARDRPG.Reaction.Brace");
  return game.i18n.localize(CARDRPG.reactions[key]?.label ?? key);
}

/** The chat card. Shows the whole chain, because a hidden calculation is an unauditable one. */
async function attackCard(actor, info) {
  const { verb, item, base, mod, bonuses, fate, mode, reasons, rows, nocked } = info;

  const chain = [`${item.name} ${verb} <strong>${base}</strong>`];
  if (mod) chain.push(`card ${mod > 0 ? "+" : ""}${mod}`);
  // A shot that adds a number has to say so in the chain, like everything else that does.
  if (nocked?.mod) chain.push(`${nocked.name} ${nocked.mod > 0 ? "+" : ""}${nocked.mod}`);
  for (const bonus of bonuses.applied) chain.push(`${bonus.name} +${bonus.value}`);

  const modeLabel = mode > 0 ? " with advantage" : mode < 0 ? " with disadvantage" : "";
  // The special's own name, from config, so a fourth one needs no case here -- Wild needed none.
  const special = fate.used?.system.special;
  const fateLabel = fate.used
    ? (special
      ? game.i18n.localize(CARDRPG.fateSpecials[special]?.label ?? special)
      : (fate.used.system.value > 0 ? `+${fate.used.system.value}` : String(fate.used.system.value)))
    : "—";

  const parts = [
    `<p>${chain.join(" &middot; ")}</p>`,
    `<p>Fate${modeLabel}: <strong>${fateLabel}</strong> &rarr; ${fate.result}</p>`
  ];

  if (reasons.length) parts.push(`<p class="cr-note">${reasons.join("; ")}</p>`);

  /*
   * The piece, said out loud. It is gone by the time this posts, so the card is the only record
   * that it was ever nocked -- and a spent magic arrow the table never saw spent is the surest way
   * to an argument about whether it had been.
   */
  if (nocked) {
    parts.push(`<p>Nocked: <strong>${nocked.name}</strong>`
      + (nocked.line ? ` &mdash; ${nocked.line}` : "")
      + `</p>`);
    parts.push(`<p class="cr-note">`
      + (nocked.missed ? "The shot went wide; the piece is spent anyway." : "The piece is spent.")
      + `</p>`);
  }

  // A blocked bonus is worth showing: it teaches the group rule better than any tooltip.
  if (bonuses.blocked.length) {
    parts.push(`<p class="cr-note">Not applied, same group already used: `
      + bonuses.blocked.map(b => `${b.name} (${b.group})`).join(", ") + `</p>`);
  }

  for (const row of rows) {
    /*
     * Redirection first, because it changed who the rest of the line is about. A reaction nobody
     * was asked about still has to be read: automatic is not the same as hidden, and a card spent
     * out of a player's hand without a line in the log is a card they will swear they still had.
     */
    if (row.guard) {
      parts.push(`<p><strong>${row.guard.name}</strong> steps in front of `
        + `${row.guard.forName}, spending <em>${row.guard.card}</em>.</p>`);
    }

    parts.push(`<p><strong>${row.name}</strong>: ${fate.result}`
      + (row.combo ? ` ${row.combo > 0 ? "+" : "&minus;"} ${Math.abs(row.combo)} (${row.opening})` : "")
      + (row.armor ? ` &minus; ${row.armor} armor` : "")
      + (row.block ? ` &minus; ${row.block} Block` : "")
      + (row.reaction?.reduce ? ` &minus; ${row.reaction.reduce} ${reactionName(row.reaction.key)}` : "")
      + ` = <strong>${row.dealt}</strong> damage`
      + (row.dealt >= CARDRPG.defaults.woundAt ? ` &mdash; <em>a Wound</em>` : "")
      + (row.down ? ` &mdash; <strong>down</strong>` : "") + `</p>`);

    if (row.reaction) {
      parts.push(`<p class="cr-note">${reactionName(row.reaction.key)} `
        + `&mdash; <em>${row.reaction.card}</em> spent`
        + (row.reaction.item ? ` with ${row.reaction.item}` : "")
        + `; ${row.reaction.because}.</p>`);
    }
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
  // "Burning 3 (2)" for a valued condition, "Dazed (1)" for the rest.
  const named = c =>
    `${label(c.key)}${c.value === undefined || c.value === null ? "" : ` ${c.value}`} (${c.duration})`;
  const full = Math.max(1, step.duration ?? 1);
  // Intensity rides along untouched by a Partial: a partial burn is a SHORTER burn, not a cooler
  // one, which keeps the one saving-throw rule covering both numbers.
  const valued = CARDRPG.conditions[key]?.valued;
  // `?? 1` keeps every existing card at 1, and Math.max(0, ...) lets a card print 0 on purpose.
  const intensity = valued ? Math.max(0, step.intensity ?? 1) : null;
  // Tested against null, not for truthiness: Poisoned 0 is a value, and 0 is falsy.
  let landed = { key, duration: full, ...(intensity === null ? {} : { value: intensity }) };
  let line;

  if (step.resist) {
    const score = passiveScore(target, step.resist);
    // An opening the target already carries makes the save harder; it never decides whether the
    // condition is attempted at all, so the half is playable against anyone (data/cards.mjs).
    const when = step.when?.needs && step.when.dc && carries(target, step.when.needs) ? step.when : null;
    const dc = when ? when.dc : (step.dc ?? CARDRPG.difficulties.normal);
    const { result, used } = await drawFate(target, score, 0);
    const miss = used?.system.special === "miss";
    const crit = used?.system.special === "crit";
    const short = dc - result;

    if (crit || (!miss && short <= 0)) landed = null;
    else if (!miss && short <= 2) {
      // Partial: half the duration, or the lesser condition if one is printed.
      landed = step.lesser
        ? { key: step.lesser, duration: full }
        : (Math.floor(full / 2)
          ? {
            key, duration: Math.floor(full / 2),
            ...(intensity === null ? {} : { value: intensity })
          }
          : null);
    }

    const approach = game.i18n.localize(CARDRPG.approaches[step.resist]?.label ?? step.resist);
    const why = when
      ? ` (${game.i18n.localize(CARDRPG.conditions[when.needs]?.label ?? when.needs)})`
      : "";
    line = `resists with ${approach} ${score}${used ? ` ${used.system.label ?? ""}` : ""} `
      + `= ${result} against ${dc}${why}: `
      + (landed ? `<strong>${named(landed)}</strong>` : "<strong>nothing</strong>");
  } else {
    line = `<strong>${named(landed)}</strong>`;
  }

  if (landed) {
    let conditions = [...(target.system.conditions ?? []).map(c => ({ ...c }))];

    /*
     * Water and fire cancel. Whichever arrives second ends the first and does not itself land, so
     * this is checked BEFORE the refresh below -- one application of fire is absorbed by the water
     * and vice versa, which is why a Wet enemy is a worse target for Scorch, not a better one.
     *
     * It reports through `line` rather than its own message: one resolution, one chat card, even
     * when a saving throw was made and then came to nothing.
     */
    const cancels = CARDRPG.conditions[landed.key]?.cancels ?? [];
    const hit = conditions.filter(c => cancels.includes(c.key)).map(c => label(c.key));
    if (hit.length) {
      conditions = conditions.filter(c => !cancels.includes(c.key));
      line += ` &mdash; and ${hit.join(" and ")} cancel it. Neither lands.`;
      landed = null;
    } else {
      /*
     * A fate condition is a marker for a card in the fate deck, so applying it shuffles that card
     * in (core-rules 6). For an NPC the deck belongs to the TYPE, which is what makes Cursed worth
     * inversely what there are of the thing -- a Miss shared by five goblins is four fifths wasted.
     */
    const fateCard = CARDRPG.conditions[landed.key]?.temporaryFate;
    if (fateCard) {
      const went = await addFateCards(target, { special: fateCard, temporary: true });
      const label = game.i18n.localize(CARDRPG.fateSpecials[fateCard].label);
      line += went
        ? ` &mdash; a temporary ${label} joins the fate deck`
        : " &mdash; but there is no fate deck to shuffle it into";
    }

    const already = conditions.find(c => c.key === landed.key);
      /*
       * A second application refreshes rather than stacks -- the longer duration wins, and for a
       * valued condition so does the fiercer value. Taking the max of each independently is the only
       * version with no order of arrival in it: a candle after a dragon leaves the dragon's fire.
       */
      if (already) {
        already.duration = Math.max(already.duration ?? 0, landed.duration);
        if (landed.value) already.value = Math.max(already.value ?? 0, landed.value);
      } else conditions.push({ ...landed, creatorId: actor.id });
    }
    await target.update({ "system.conditions": conditions });
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong> ${line}</p></div>`
  });
  return landed;
}
