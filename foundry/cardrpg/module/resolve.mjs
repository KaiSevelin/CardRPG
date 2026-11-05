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
  MINOR_GODS, ROSTER, VARIANTS, NATURAL_WEAPONS, NPC_GEAR, ITEMS, FEATURES, TRANSFORMATIONS
} from "./content.mjs";
import { expandRoster } from "./monsters.mjs";
import { slateData } from "./setup.mjs";
import {
  drawFate, deckOf, uprightCards, discardCards, cardName, addFateCards, moveRandom
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

  /*
   * **A condition can carry a bonus**, and that is where a spell's goes.
   *
   * The Graven line used to be a `bonus` on the spell slate: standing, invisible and unremovable,
   * with nothing on the token to say it was there. Applied as a condition it shows, it has a
   * duration, and it ends however that condition ends.
   *
   * The group is the condition's own key, so two tattoos granting the same verb cap each other the
   * way two rings do -- a bonus group caps bonuses to one action (core-rules 5), and a creature
   * wearing its whole school's ink is exactly the case that needs capping.
   */
  for (const c of actor.system.activeConditions ?? []) {
    const bonus = c.bonus;
    if (!bonus?.value || bonus.verb !== verb) continue;
    /* Through the same predicate a slate's bonus and a card step both use, rather than reading the
     * tags again here: a tag requirement asked two ways is a tag requirement nobody can change. */
    if (bonus.requiresTag && !itemMeets(item, { tag: bonus.requiresTag })) continue;
    candidates.push({
      name: game.i18n.localize(CARDRPG.conditions[c.key]?.label ?? c.key),
      group: c.key,
      value: bonus.value
    });
  }

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

/**
 * Feature bonuses to a skill check: step 3 of skill-rules 2.
 *
 * **The step existed and could never contribute anything.** `resolveCheck` called
 * `collectBonuses(actor, approach, item)`, and that function matches on `bonus.verb` -- whose
 * schema `choices` are the six core verbs. The six verbs and the six approaches are **disjoint
 * vocabularies**, so `bonus.verb === "wits"` is not merely false today, it is unreachable: no
 * document can ever hold it. Step 3 returned 0 for every check ever made, and the chat line that
 * prints `features +N` could never print one.
 *
 * A tool's skill line lives in `bonus.approach` (data/items.mjs), which is the field this reads.
 * **Features only**: the tool the check is using comes in through its own term, where the untrained
 * cap lives, and counting equipped items here would pay a lockpick twice.
 *
 * Bonus groups still cap it, the same way they cap an attack's: one bonus per group, best first.
 */
export function collectSkillBonuses(actor, approach) {
  if (!actor || !approach) return { total: 0, applied: [], blocked: [] };
  const candidates = [];
  for (const slate of actor.items) {
    if (slate.type !== "feature") continue;
    const bonus = slate.system.bonus;
    if (!bonus?.value) continue;
    if (bonus.approach !== approach && bonus.approach !== "any") continue;
    if (slate.system.drained) continue;
    candidates.push({ name: slate.name, value: bonus.value, group: slate.system.group || null });
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
  return { total: applied.reduce((n, b) => n + b.value, 0), applied, blocked };
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
/**
 * **Pay for PREPARING a spell**, which until now was a checkbox with no consequence.
 *
 * `prepared` is set from the item sheet and nothing else: no function, no hook, nothing that
 * happens when a spell goes into your head. The slot budget survived that because it is derived --
 * `slotCost` sums the prepared spells whenever anything asks -- but a cost paid AT preparing has no
 * such luck, which is why the Poison school's price sat in six cards' audit column instead of in
 * the engine.
 *
 * Strain takes from the hand first and the draw pile after. A strength-5 formula wants five cards
 * and the skill hand is four, so taking only from the hand would make the school's own thesis
 * formula unpayable -- and `moveRandom` is what Overloaded already uses to take cards nobody chose.
 *
 * Nothing is refunded on UN-preparing, and that is Strain's rule rather than an omission: what
 * Strain costs you is the time until the cards come back, and they come back on a rest.
 */
export async function payToPrepare(actor, slate) {
  const want = slate?.system?.cost?.skillCards ?? 0;
  if (!want) return true;

  const hand = deckOf(actor, "skillHand");
  const deck = deckOf(actor, "skill");
  const discard = deckOf(actor, "skillDiscard");
  if (!discard) {
    ui.notifications?.warn("No skill discard on this actor; the price goes uncollected.");
    return true;
  }

  let paid = 0;
  for (const from of [hand, deck]) {
    if (paid >= want || !from?.cards?.size) continue;
    const take = Math.min(want - paid, from.cards.size);
    const moved = await moveRandom(from, discard, take);
    paid += moved.length;
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> prepares `
      + `<em>${slate.name}</em> and sets aside ${paid} skill card${paid === 1 ? "" : "s"}`
      + `${paid < want ? ` of ${want} \u2014 there were no more to set aside` : ""}.</p>`
      + "<p>They come back on a rest.</p></div>"
  });
  return true;
}

export async function payToCast(actor, slate) {
  if (!slate?.system?.prepared) {
    ui.notifications.warn(`${slate?.name ?? "That spell"} is in your book, not in your head.`);
    return false;
  }
  const cost = slate.system.cost?.health ?? 0;
  /*
   * **The second price, and the engine collected nothing for it until now.** `wilds` has been a
   * field since *Step Through* needed somewhere to put Shadow Magic's price, seven formulas carry
   * it, the spell sheet edits it -- and no code path read it, so a shadow mage cast for free. It
   * was found by asking which fields of the slate anything reads, which is the same question that
   * found `passiveScore` reading a deck that did not exist.
   *
   * `addFateCards` without `temporary` is the right call -- `temporary` means *removed when drawn*,
   * which is Blessed and Cursed (core-rules 6) and not this. A Wild stays in the deck and fires
   * every time it comes up, which is what makes this a price rather than a cost.
   *
   * **And it stays too long.** specializations.md 2 prices the school at *a Wild card per spell
   * cast, until you sleep*, and nothing in this engine takes a card out of a fate deck at a long
   * rest -- the boundary exists for slates recharging, not for decks. So the charge is correct for
   * *Become the Shadow*, whose five are explicitly **for good**, and heavier than written for the
   * other six. Collecting the price and overstating it is a smaller wrong than collecting nothing,
   * and the gap is on those six formulas by name rather than hidden here.
   */
  const wilds = slate.system.wilds ?? 0;
  if (!cost && !wilds) return true;

  /*
   * You may not kill yourself casting. The floor is 1 rather than 0 because 0 Health is
   * Unconscious (core-rules 8) and a spell that knocks its own caster out before it resolves is a
   * rule nobody wrote -- so the cost is refused, not survived.
   *
   * Checked BEFORE either price is paid, because a refused cast must charge nothing: a caster who
   * cannot afford the Health would otherwise have bought the Wilds and not the spell.
   */
  const health = actor.system.health?.value ?? 0;
  if (cost && health - cost < 1) {
    ui.notifications.warn(
      `${slate.name} costs ${cost} Health and you have ${health}. That is not a price, it is a death.`);
    return false;
  }

  if (cost) await actor.update({ "system.health.value": health - cost });
  /* There is no refusal for a Wild. It cannot kill you; it only makes you less sure of yourself. */
  const added = wilds ? await addFateCards(actor, { special: "wild", count: wilds }) : 0;

  /*
   * One message for both, because two messages would read as two castings. A spell that charges
   * nothing says nothing -- the early return above -- so this only ever prints a real price.
   */
  /* No "for good" in the wording: only one formula's Wilds are, and the message would be making
   * a promise about the other six that the rules do not make. */
  const paid = [
    cost ? `<strong>${cost} Health</strong>` : null,
    added ? `<strong>${added} Wild</strong> ${added === 1 ? "card" : "cards"} into the fate deck`
      : null
  ].filter(Boolean).join(" and ");
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> pays ${paid} `
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
/* -------------------------------------------- */
/*  Conjuration and shape                       */
/* -------------------------------------------- */

/** Every creature the roster can produce, by name: what a conjuration or a form may name. */
export function creaturesByName() {
  return new Map(expandRoster(ROSTER, VARIANTS).map(c => [c.name, c]));
}

/** The minor gods by name, which is the other thing a conjuration may name. */
export function godsByName() {
  return new Map(MINOR_GODS.map(g => [g.name, g]));
}

/**
 * **Conjure: the card names the creature, the table says how many, the player gets control.**
 *
 * What this does is deliberately small. It asks for a number, makes sure the creature exists as an
 * actor, and gives the conjurer **OWNER** on it -- which is what "under their control" means in a
 * form the software can grant. It does not place the tokens, because where a conjured thing appears
 * is a judgement about the map that no card can make: *within 2* is a region, not a square.
 *
 * The number is asked rather than configured. A first pass had `count` on the card, with `0`
 * meaning every eligible body in range, and that was the engine holding an opinion about the state
 * of a battlefield it cannot see. A player who says *three* with the GM nodding has settled it
 * better than a field could.
 *
 * The upkeep is announced, not charged. It is paid per round the thing stands and nothing here
 * knows when it falls, so charging now would be charging for a round that may not happen.
 */
export async function resolveConjure(actor, { step }) {
  const cfg = step.conjure ?? {};
  const creatures = creaturesByName();
  const named = cfg.creature || "";

  if (named && !creatures.has(named) && !godsByName().has(named)) {
    ui.notifications?.warn(`Nothing called ${named} in the roster or among the minor gods.`);
    return false;
  }

  /* The number, asked once. `DialogV2` rather than a field, because this is the one decision the
   * card deliberately leaves to the table. */
  const asked = await foundry.applications.api.DialogV2.prompt({
    window: { title: named ? `Conjure ${named}` : "Conjure" },
    content: `<p>How many${step.range ? `, within ${step.range}` : ""}?</p>`
      + `<input type="number" name="count" value="1" min="1" max="20" autofocus>`,
    ok: { label: "Conjure", callback: (_e, button) => Number(button.form.elements.count.value) }
  }).catch(() => null);
  const count = Number.isFinite(asked) && asked > 0 ? Math.min(asked, 20) : 0;
  if (!count) return false;

  /*
   * The actor, built if the roster can make it. `buildMonster` is the one builder for this -- it
   * earns the creature its intent deck from its capabilities -- so a conjuration does not get a
   * second, thinner way of making a creature exist.
   *
   * And then OWNER for the conjurer, which is the only part of "under their control" that is not a
   * sentence: a token the player cannot move is a conjuration the GM has to play for them.
   */
  /*
   * **A named minor god used to be accepted here and then built by nothing.** The guard above
   * passes a god, and this line only built what `creaturesByName()` knew -- so The Great Bargain
   * could name one and put no actor on the table, which is the same silent-drop the gear lookup
   * had. The eight gods are roster creatures now, so one lookup answers for both and the guard
   * above is belt and braces rather than the only thing holding it.
   */
  let built = named ? game.actors.find(a => a.name === named) : null;
  if (!built && named && creatures.has(named) && game.user.isGM) {
    const { buildMonster } = await import("./setup.mjs");
    built = await buildMonster(named);
  }
  if (built && game.user.isGM) {
    await built.update({ ownership: { ...built.ownership, [game.user.id]: 3 } });
  }

  const upkeep = [];
  if (cfg.upkeep?.taint) upkeep.push(`${cfg.upkeep.taint} Taint`);
  if (cfg.upkeep?.health) upkeep.push(`${cfg.upkeep.health} Health`);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> conjures `
      + `${count} \u00d7 ${named || "whatever the GM decides"}`
      + `${step.range ? `, within ${step.range}` : ""}`
      + `${step.duration ? `, for ${step.duration} round${step.duration === 1 ? "" : "s"}`
        : ""}.</p>`
      + (upkeep.length ? `<p>Upkeep, each round it stands: ${upkeep.join(" and ")}.</p>` : "")
      + (built ? `<p><em>${built.name}</em> is yours to place and to play.</p>`
        : "<p>The GM places them.</p>")
      + "</div>"
  });
  return true;
}

/** The transformations, by name. */
export function transformationsByName() {
  return new Map(TRANSFORMATIONS.map(t => [t.name, t]));
}

/** Every slate the content tables know, by name, with the document type it becomes. */
function slatesByName() {
  const out = new Map();
  for (const [list, type] of [
    [ITEMS, "item"], [NPC_GEAR, "item"], [NATURAL_WEAPONS, "item"], [FEATURES, "feature"]
  ]) {
    for (const entry of list) if (!out.has(entry.name)) out.set(entry.name, { entry, type });
  }
  return out;
}

/**
 * Does one of the player's own slates fall inside a transformation's quarantine?
 *
 * A filter rather than a list, for the same reason the intent pool is a filter: a list would have
 * to be revisited every time somebody writes an item, and **a bird has no hands whatever is in the
 * shop**. `slots`, `tags` and `kinds` select items by what they are; `features` names features,
 * because there are few enough to say.
 */
export function quarantines(filter, slate) {
  const q = filter ?? {};
  if (slate.type === "feature") return (q.features ?? []).includes(slate.name);
  if (slate.type !== "item") return false;
  return (q.slots ?? []).includes(slate.system.slot)
    || (q.tags ?? []).some(t => (slate.system.tags ?? []).includes(t));
}

const FORM_FLAG = "transformation";

/**
 * **Put a transformation on: add its cards, take the player's own away.**
 *
 * The second half is what makes it a transformation rather than a bonus. A form that only adds is
 * a costume -- you become a bird and keep your sword -- so each one names a filter of your own
 * content that goes out of play while you wear it.
 *
 * **Quarantine is movement, not a flag.** A `quarantined` boolean would have to be respected by
 * every place that reads a slate, and there are more than ten of those across combat, grants,
 * resolution, the sheets and the tray; one of them would have been missed, which is the defect
 * this project keeps finding. Taking the slate off the actor makes it unusable everywhere at once
 * with no new reader anywhere, and its data is kept on the actor so that *put back* is literal.
 *
 * What a transformation still does not touch: your **Health** and your **conditions**. A bear that
 * has forgotten it was poisoned is a way out of a condition that no card should hand over free.
 */
export async function resolveShape(actor, { step }) {
  const name = step.shape?.transformation ?? "";
  if (!name) return ui.notifications?.warn("This shape names no transformation.");
  const form = transformationsByName().get(name);
  if (!form) return ui.notifications?.warn(`No transformation called ${name}.`);
  if (actor.getFlag("cardrpg", FORM_FLAG)) {
    return ui.notifications?.warn(`${actor.name} is already transformed. End that one first.`);
  }

  /* --- what it gives. Items and features are slates; cards are dealt below. */
  const known = slatesByName();
  const missing = [...(form.grants?.items ?? []), ...(form.grants?.features ?? [])]
    .filter(n => !known.has(n));
  if (missing.length) {
    return ui.notifications?.error(`${name} grants content that does not exist: ${missing.join(", ")}`);
  }
  const added = [];
  for (const n of [...(form.grants?.items ?? []), ...(form.grants?.features ?? [])]) {
    const src = known.get(n);
    const data = slateData(src.entry, src.type);
    added.push({
      ...data,
      system: { ...data.system, ...(src.type === "item" ? { equipped: true } : {}) },
      flags: { cardrpg: { [FORM_FLAG]: name } }
    });
  }

  /* --- what it takes, which the CARD says rather than the form: the quarantine is a step field so
   *     that it can be ticked in the sheet, and so that a gentler version of the same body can
   *     exist. Kept whole on the actor, because restoring it is the other half. */
  const filter = step.shape?.quarantine ?? {};
  const taken = actor.items.filter(i => quarantines(filter, i));
  const kept = taken.map(i => i.toObject());

  await actor.setFlag("cardrpg", FORM_FLAG, {
    name, until: step.duration ?? null, slates: kept
  });
  if (added.length) await actor.createEmbeddedDocuments("Item", added);
  if (taken.length) {
    await actor.deleteEmbeddedDocuments("Item", taken.map(i => i.id));
  }

  /* --- and the cards, which move rather than being deleted: a card is a document the player owns
   *     and a pile is where this game already puts one it is not using. */
  const moved = await quarantineCards(actor, filter);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> becomes <em>${name}</em>`
      + `${step.duration ? ` for ${step.duration} round${step.duration === 1 ? "" : "s"}` : ""}.`
      + `${form.blurb ? ` ${form.blurb}` : ""}</p>`
      + `<p>Gained: ${added.length ? added.map(a => a.name).join(", ") : "nothing"}. `
      + `Quarantined: ${[...taken.map(i => i.name), ...moved].join(", ") || "nothing"}.</p>`
      + `<p>Your deck, Health and conditions are your own still. `
      + `End it with <code>game.cardrpg.endTransformation(actor)</code>.</p></div>`
  });
  return true;
}

/** The player's own action cards the step names, moved to the quarantine pile. */
async function quarantineCards(actor, filter) {
  const names = filter.cards ?? [];
  if (!names.length) return [];
  const shelf = deckOf(actor, "quarantine");
  if (!shelf) {
    ui.notifications?.warn("No quarantine pile on this actor; its cards stay in play.");
    return [];
  }
  const moved = [];
  for (const which of ["actionHand", "action"]) {
    const stack = deckOf(actor, which);
    const hits = [...(stack?.cards ?? [])].filter(c => names.includes(c.name));
    for (const card of hits) {
      await card.setFlag("cardrpg", FORM_FLAG, which);
      moved.push(card.name);
    }
    if (hits.length) await stack.pass(shelf, hits.map(c => c.id), { chatNotification: false });
  }
  return moved;
}

/**
 * **Take it off: the added cards go, the quarantined ones come back.**
 *
 * The exact reverse, and written beside its other half on purpose. A mechanism that adds in one
 * place and removes in another is one that will eventually add more than it removes, and what is
 * left behind is a player quietly holding a bird's mouth and their own sword.
 *
 * A quarantined card goes back to the stack it came from, which is why the stack's name was
 * written onto the card rather than assumed: a card taken from a hand belongs in that hand, and
 * putting everything back in the deck would shuffle somebody's turn away.
 */
export async function endTransformation(actor) {
  const worn = actor.getFlag("cardrpg", FORM_FLAG);
  if (!worn) return ui.notifications?.info(`${actor.name} is not transformed.`);

  const added = actor.items.filter(i => i.getFlag("cardrpg", FORM_FLAG));
  if (added.length) await actor.deleteEmbeddedDocuments("Item", added.map(i => i.id));
  if (worn.slates?.length) await actor.createEmbeddedDocuments("Item", worn.slates);

  const shelf = deckOf(actor, "quarantine");
  const returned = [];
  for (const card of [...(shelf?.cards ?? [])]) {
    const home = deckOf(actor, card.getFlag("cardrpg", FORM_FLAG) || "action");
    if (!home) continue;
    returned.push(card.name);
    await card.unsetFlag("cardrpg", FORM_FLAG);
    await shelf.pass(home, [card.id], { chatNotification: false });
  }

  await actor.unsetFlag("cardrpg", FORM_FLAG);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> is themselves again`
      + ` (<em>${worn.name}</em> ends).</p>`
      + `<p>Returned: ${[...(worn.slates ?? []).map(s => s.name), ...returned].join(", ")
        || "nothing"}.</p></div>`
  });
  return true;
}

/* -------------------------------------------- */

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

  /*
   * The spell book first, because a reaction spell is not in your hand and cannot be turned
   * sideways: it is prepared or it is not, and a drained one has already answered something this
   * fight. There is no Brace fallback here -- a spell that cannot fire simply does not, where a
   * card that cannot fire is still a card.
   */
  for (const slate of actor.items ?? []) {
    if (slate.type !== "spell" || !slate.system.prepared || slate.system.drained) continue;
    const rule = slate.system.reaction ? CARDRPG.reactions[slate.system.reaction] : null;
    if (!rule?.spell || rule.trigger !== trigger || off.has(slate.system.reaction)) continue;
    options.push({ key: slate.system.reaction, slate, reduce: 0, heal: slate.system.effect?.param ?? 0 });
  }

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
  /*
   * A spell is not discarded -- it was never in your hand. It is drained, which is Ward Magic's
   * *Spent* on a thing that lives in a book: gone for the fight, back on a rest.
   */
  if (choice.slate) {
    await choice.slate.update({ "system.drained": true });
    return choice;
  }
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
  /*
   * A redirect takes the hit; a mend answers it afterwards. Both are the same event, so the
   * ordering is the policy -- and taking the blow outranks healing it, because the ally is about to
   * be dropped and a heal after the drop is a heal on a body.
   */
  const option = options.find(o => CARDRPG.reactions[o.key]?.kind === "redirect") ?? options[0];
  const choice = await spendReaction(who, option);

  if (option.slate) {
    const healed = Math.min(target.system.health.max,
      (target.system.health.value ?? 0) + (option.heal ?? 0));
    await target.update({ "system.health.value": healed });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: who }),
      content: `<div class="cardrpg"><p><strong>${who.name}</strong> mends ${target.name} with `
        + `<em>${option.slate.name}</em>: ${option.heal} Health.</p></div>`
    });
    return { actor: who, for: target, mended: option.heal ?? 0 };
  }
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
 * A Cast is being made. Anyone on the other side who has a ward prepared may stop it.
 *
 * **The event site is the whole of this gap.** `reactionsFor` has taken a trigger since it was
 * written, so `cast` cost one line of config; what did not exist was a moment to raise it from,
 * and that moment only came into being when a spell became castable. Five documents asked for "a
 * trigger" over this project's life and every one of them was asking for a place, not a mechanism.
 *
 * No range test, and that is Ward Magic's coin rather than an oversight: specializations.md prices
 * this school in **Spent**, a card gone for the fight whether or not anything comes. A warder who
 * also had to stand next to the caster would be paying twice.
 *
 * *You may only learn a ward against magic that has already been used on you* is a LEARNING
 * condition, not a runtime one -- the GM fills a warder's book by casting at the party -- so the
 * engine does not test it. It is printed on the card, where the table reads it.
 *
 * @returns {object|null} the ward that fired, so the caller knows the Cast does not resolve
 */
export async function answerCast(caster, spellName) {
  if (!caster || !canvas?.ready) return null;

  for (const placed of canvas.tokens.placeables) {
    const who = placed.actor;
    if (!who || who.id === caster.id || who.type === caster.type) continue;
    const options = reactionsFor(who, "cast");
    if (!options.length) continue;

    const choice = await spendReaction(who, options[0]);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: who }),
      content: `<div class="cardrpg"><p><strong>${who.name}</strong> unmakes `
        + `<em>${spellName}</em> with <em>${choice.slate?.name ?? "a ward"}</em>. `
        + "It does not resolve.</p></div>"
    });
    return { actor: who, ward: choice.slate?.name ?? "a ward" };
  }
  return null;
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
/**
 * What a target's defences come to against one step (core-rules 4, *Going through, and going
 * round*; core-rules 5 step 6).
 *
 * **Pure, exported and taking numbers rather than an Actor**, so the arithmetic can be exercised
 * without a world, a deck, a token or a fate draw. The three ways through a defence are each one
 * line of maths and the lines are easy to get wrong in the same direction -- `ignores` is
 * SUBTRACTED from armour and can be out-armoured, the two booleans count a defence as zero, and
 * neither kind has ever come off the other's defence. Grepping the resolver proves the source
 * says that; only running it proves it is true.
 *
 * @param {object}  o
 * @param {number}  o.armor    what the target is wearing
 * @param {number}  o.block    what the target has raised
 * @param {number}  o.pierce   `ignores N`, summed from the line, the step and the shot
 * @param {object}  o.step     the step being resolved
 * @param {object?} o.when     its combo clause, when it has one
 * @param {boolean} o.opening  whether this target actually carries that opening
 */
export function defencesAgainst({
  armor = 0, block = 0, pierce = 0, step = {}, when = null, opening = false
} = {}) {
  const pierced = !!(step.ignoresArmour || (opening && when?.ignoresArmour));
  const rounded = !!(step.ignoresBlock || (opening && when?.ignoresBlock));
  return {
    // `ignores N` comes off armour and never off Block: a bolt finds a gap in plate, it does not
    // get past a raised shield.
    armor: pierced ? 0 : Math.max(0, armor - pierce),
    block: rounded ? 0 : block,
    pierced, rounded
  };
}

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
    /*
     * **And the two total forms, which say what a number cannot.**
     *
     * `ignoresArmour` is not `ignores: 99` with better manners. A number is SUBTRACTED, so it can
     * be out-armoured and it reads as a quantity somebody chose; this is armour counted as zero
     * whatever the target happens to be wearing, which is what *Bring It Down* means when it says
     * a door's armour does not apply to a thing swung at a door.
     *
     * Both exist on the combo clause as well, because the openings are where they belong:
     * *Between the Plates* goes through plate only against a target it has Marked, and the gap it
     * names is the Mark. A flag that could only be unconditional would have made that card either
     * always-on or still prose.
     */
    const against = who => {
      const opening = !!(when && carries(who, when.needs));
      const hadArmor = who.system.armor ?? 0;
      const hadBlock = who.system.block ?? 0;
      const { armor, block, pierced, rounded } =
        defencesAgainst({ armor: hadArmor, block: hadBlock, pierce, step, when, opening });
      const combo = opening ? (when.mod ?? 0) : 0;
      return { armor, block, combo, pierced, rounded, hadArmor, hadBlock,
        incoming: Math.max(0, fate.result + combo - armor - block) };
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
    const { armor, block, combo, pierced, rounded, hadArmor, hadBlock, incoming } = against(taker);
    /*
     * **A step that goes round Block is not offered a shield to go round.**
     *
     * The option is filtered rather than the reduction zeroed afterwards, and the difference is
     * the defender's hand: `chooseReaction` is what SPENDS the card, so leaving Block in the list
     * would turn it sideways for nothing and the player would never learn why. Parry is left
     * alone on purpose -- this ignores Block, and a Parry is not a Block.
     */
    const answers = reactionsFor(taker, "hit", { melee: !ranged })
      .filter(option => !(rounded && option.key === "block"));
    const reaction = (missed || guard)
      ? null
      : chooseReaction(answers, { incoming, health: taker.system.health.value });
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
      /* What was gone through, and how much of it: a defence that silently did not apply looks
       * exactly like a defence the target never had. */
      pierced: pierced ? hadArmor : 0,
      rounded: rounded ? hadBlock : 0,
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
      /* Said out loud, because 0 armour and armour ignored subtract the same and mean different
       * things -- and the second one is the card doing what it promised. */
      + (row.pierced ? ` (${row.pierced} armor ignored)` : "")
      + (row.block ? ` &minus; ${row.block} Block` : "")
      + (row.rounded ? ` (${row.rounded} Block ignored)` : "")
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

/**
 * Give Block to the people standing with you (core-rules 5).
 *
 * **Highest wins and the longer duration survives**, which is not a new rule: `resolveDefend` has
 * settled Block that way since it was written, and the only honest way to grant Block to somebody
 * else is to settle it the same way. So this is the same four lines, applied to a set of actors
 * rather than to one -- a card that hands an ally Block 1 cannot downgrade the Block 3 they are
 * already holding, and cannot shorten it either.
 *
 * `radius` is in squares, 1 being adjacent, measured the way everything else is: Chebyshev on the
 * placed tokens. An unplaced fight has no geometry, so nothing happens rather than something
 * guessed -- the same choice `neighbours` makes and for the same reason.
 *
 * Allies only, and that needs no field: Block is protection, and there is no card in the game that
 * protects an enemy. `includeSelf` is false by default because every one of these is printed as
 * *every ally* -- the caster is covered by their own Defend, not by their own order.
 *
 * @returns {object[]} who got it and what they ended up holding, for the chat line
 */
export async function grantBlock(actor, { amount = 0, radius = 1, includeSelf = false } = {}) {
  if (!actor || amount <= 0) return [];
  const token = actor.getActiveTokens?.()[0];
  if (!token || !canvas?.ready) return [];

  const size = canvas.grid.size;
  const within = canvas.tokens.placeables.filter(other => {
    if (!other.actor) return false;
    if (other === token) return includeSelf;
    if (other.actor.type !== actor.type) return false;        // allies are your own side
    const dx = Math.abs(other.x - token.x) / size;
    const dy = Math.abs(other.y - token.y) / size;
    return Math.max(dx, dy) <= radius;
  });

  const given = [];
  for (const other of within) {
    const who = other.actor;
    const current = who.system.block ?? 0;
    const held = !!who.system.blockPersists;
    /* Until your next turn, which is what every card printing this says, so it persists. */
    const block = Math.max(current, amount);
    const persists = amount > current ? true : amount < current ? held : true;
    if (block === current && persists === held) continue;     // nothing to say
    await who.update({ "system.block": block, "system.blockPersists": persists });
    given.push({ actor: who, block });
  }
  return given;
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
 * Which of the four results a check produced (skill-rules 2).
 *
 * **A band, not a threshold**, and it is pulled out here because that makes it the one piece of the
 * check that can be asked a question offline: four results, two of them read off the fate card and
 * two off the margin. A Critical comes from the CARD and not from the total -- the document says
 * *Critical drawn* -- so a crit that still falls short is a success with a bonus rather than a near
 * miss, which is the same reading `FateCardData.apply` gives it in combat.
 */
/**
 * **A check reads its fate card twice as loudly as combat does** (skill-rules 2).
 *
 * The fate deck is sharply peaked: eight of its twenty cards are a flat nought, so a draw moved a
 * check's total by 0.89 on average and the numbers on a character decided almost everything. One
 * point of card, tool, push or help was worth 21 points of success chance, and a check two below
 * its difficulty succeeded one time in ten.
 *
 * Doubling the card on a check -- and only on a check -- gets the swing to **1.79** without
 * touching a single card, which matters because **the same twenty cards resolve combat damage**
 * (hud-spec 4.3): reshaping the deck would have widened a Strike's spread by half as much again,
 * against a combat model measured on this one. A multiplier here is a skill-side change that stays
 * on the skill side.
 *
 * Miss and Critical are untouched at 5% each and the mean stays at nought, so the ladder of 3, 5,
 * 7 and 9 still means what it meant.
 */
export const CHECK_SWING = 2;

/**
 * How far below the difficulty a total may be and still be a **Partial** (skill-rules 2).
 *
 * **It widened with the swing, and had to.** A doubled card jumps over a two-point band: at one
 * below the difficulty the old floor turned 60% partials into 40% partials and 30% flat failures,
 * which is a harsher game rather than a swingier one. At four, the bands come out at **70/25/5** on
 * the difficulty and **30/60/10** one below -- exactly what they were before the swing doubled, and
 * exactly what section 2 prints. What changed is the far end: two below the difficulty went from
 * 10/60/30 to **30/60/10**, so a long shot is a real gamble instead of a formality.
 */
export const PARTIAL_FLOOR = -4;

export function checkOutcome(margin, special = "") {
  if (special === "crit") return "critical";
  if (special === "miss") return "fail";
  if (margin >= 0) return "success";
  return margin >= PARTIAL_FLOOR ? "partial" : "fail";
}

/**
 * Resolve a skill check (skill-rules 2), which nothing has ever done.
 *
 * The whole skill side was written out in full and never built: six approaches, four difficulties,
 * four results, tools, training, push and help -- and not one line of code. This is the arithmetic
 * that document specifies, in the order it specifies:
 *
 *   1. the card's value for this approach
 *   2. the tool bonus, capped at 1 for an untrained user (skill-rules 2, Tools)
 *   3. feature bonuses, through the same `collectBonuses` an attack uses
 *   4. push: a second card of the SAME approach adds its value
 *   5. help: +1 from an ally, +2 when their card shares the approach
 *   6. one fate card, with advantage or disadvantage
 *
 * **The four results are a band, not a threshold**, and that is the part worth getting right: a
 * Partial is one or two below, a Fail is three or more below OR a Miss, and a Critical is the fate
 * card rather than the total. The document gives the odds those bands produce; the bands are what
 * the engine owes it.
 *
 * `improvise` is the empty-deck case: value 0 with disadvantage, so a character with nothing left
 * can still act (skill-rules 1, Fatigue).
 *
 * @returns {object} `{ total, dc, result, margin }`
 */
export async function resolveCheck(actor, {
  approach, dc = CARDRPG.difficulties.normal, card = null, push = null, help = 0,
  item = null, mode = 0, improvise = false
} = {}) {
  if (!actor || !approach) return null;

  const base = improvise ? 0 : (card?.system?.worth?.(approach) ?? null);
  if (base === null && !improvise) {
    ui.notifications.warn(
      `${cardName(card) || "That card"} is not a ${game.i18n.localize(CARDRPG.approaches[approach]?.label ?? approach)} card.`);
    return null;
  }

  /*
   * A tool helps with the approach it names, and **an untrained user gets at most +1** however good
   * the tool is -- which is the one place in the game where a training matters arithmetically, and
   * the reason a node granting one is a reward rather than flavour.
   */
  const bonus = item?.system?.bonus ?? null;
  const serves = bonus && (bonus.approach === approach || bonus.approach === "any");
  /*
   * **A tool names its own training** (data/items.mjs), and the comparison is exact.
   *
   * It used to match the tool's LAST WORD against the trainings a character held, which meant
   * "Healer's Kit" went looking for a training with "kit" in it. Eleven of the fourteen tools
   * could never be trained and four could never reach the bonus printed on them. A tool that names
   * no training has nothing to be trained in, so it is not capped: the cap exists because the
   * training does.
   */
  const want = (bonus?.training ?? "").trim().toLowerCase();
  const trained = !want || (actor.system.learned?.trainings ?? [])
    .some(t => String(t).trim().toLowerCase() === want);
  const toolBonus = serves ? (trained ? (bonus.value ?? 0) : Math.min(1, bonus.value ?? 0)) : 0;

  /* Push: a second card of the same approach. A wild serves, which is what a wild is for. */
  const pushed = push?.system?.worth?.(approach) ?? 0;

  /*
   * Step 3, which until now read `bonus.verb` against an approach and so could never answer. See
   * `collectSkillBonuses`: the verb and approach vocabularies do not overlap, and the schema will
   * not let them.
   */
  const features = collectSkillBonuses(actor, approach);
  const before = base + toolBonus + pushed + help + features.total;

  const draw = improvise ? -1 : mode;
  /*
   * **The total is computed here rather than taken from `drawFate`**, for two reasons. The card is
   * read at `CHECK_SWING` on a check, which is the swing; and `applyFate` is combat-shaped -- it
   * clamps a result at nought and doubles the whole total on a Critical, both of which are right
   * for damage and wrong for a margin. A check wants the plain sum, and the Critical is decided by
   * the band rather than by the arithmetic.
   */
  const { used } = await drawFate(actor, before, draw);
  const special = used?.system?.special ?? "";
  const swing = special ? 0 : (used?.system?.value ?? 0) * CHECK_SWING;
  const result = before + swing;
  const margin = result - dc;

  const outcome = checkOutcome(margin, special);

  const label = {
    critical: "Critical", success: "Success", partial: "Partial", fail: "Fail"
  }[outcome];
  const chain = [
    `${game.i18n.localize(CARDRPG.approaches[approach]?.label ?? approach)} ${base}`,
    ...(toolBonus ? [`${item.name} +${toolBonus}${trained ? "" : " (untrained, capped)"}`] : []),
    ...(pushed ? [`push +${pushed}`] : []),
    ...(help ? [`help +${help}`] : []),
    ...(features.total ? [`features +${features.total}`] : []),
    ...(improvise ? ["improvising, with disadvantage"] : [])
  ];

  /*
   * **The outcome is stamped on the message**, which is how a challenge track moves.
   *
   * A scene flag is the GM's to write and a player resolves their own check, so the result cannot
   * record itself where it happens. It travels as a flag on the message instead, and the one client
   * that may write the scene picks it up (checks.mjs `registerCheckHooks`). That also keeps this
   * function ignorant of challenges, which is right: a check is a check whether one is running.
   */
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    flags: { cardrpg: { outcome } },
    content: `<div class="cardrpg"><p>${chain.join(" &middot; ")}</p>`
      + `<p>Fate: <strong>${used ? (special
        || `${used.system.value >= 0 ? "+" : ""}${used.system.value}`
          + `${used.system.value ? ` \u00d7${CHECK_SWING} = ${swing >= 0 ? "+" : ""}${swing}` : ""}`)
        : "\u2014"}</strong>`
      + ` &rarr; ${result} against ${dc}</p>`
      + `<p><strong>${label}</strong>`
      + (outcome === "partial" ? " &mdash; you do it, and it costs something. Draw a twist."
        : "")
      + (outcome === "fail" ? " &mdash; and the situation changes. Draw a twist." : "")
      + `</p></div>`
  });

  /*
   * A failed check is an event, and it is the one Spiritualism's *Hold to the Bargain* has been
   * waiting for: a god intervenes once and a Fail becomes a Partial. The `check` trigger could not
   * exist before this function did -- which is the same lesson the `cast` trigger taught, arriving
   * from the other direction.
   */
  if (outcome === "fail" && !improvise) {
    const held = await answerCheck(actor);
    if (held) return { total: result, dc, result: "partial", margin, held };
  }

  return { total: result, dc, result: outcome, margin };
}

/**
 * A check has failed. Anyone on this actor's side with a pact prepared may hold it to the bargain.
 *
 * Unlike the other three triggers this one answers somebody's **own** failure rather than an
 * attack, so the scan is over allies including the actor: a priest may spend their own pact on
 * their own failed check, which is what *once per pact per fight* is counting.
 */
export async function answerCheck(actor) {
  if (!actor || !canvas?.ready) return null;

  for (const placed of canvas.tokens.placeables) {
    const who = placed.actor;
    if (!who || who.type !== actor.type) continue;
    const options = reactionsFor(who, "check");
    if (!options.length) continue;

    const choice = await spendReaction(who, options[0]);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: who }),
      content: `<div class="cardrpg"><p><strong>${who.name}</strong> holds `
        + `${who.id === actor.id ? "their own" : `${actor.name}'s`} failure to the bargain with `
        + `<em>${choice.slate?.name ?? "a pact"}</em>: it becomes a <strong>Partial</strong>.</p></div>`
    });
    return { actor: who, pact: choice.slate?.name ?? "a pact" };
  }
  return null;
}

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
  /*
   * **It read the draw pile alone, so a passive moved during play.** hud-spec 5 says a passive is
   * static -- *it never changes during play, so it renders as a constant* -- and skill-rules 2
   * calls it the best card of that approach in the WHOLE deck, counting the discard. The lookup
   * was `decks.skill`, which is the pile you have not drawn yet: playing your Wits 3 lowered your
   * passive Wits by one, and drawing it into hand did too. Exactly backwards, and the panel built
   * yesterday is what made it visible.
   *
   * So it reads every stack the character owns and takes the skill cards out of them, which is
   * what "the whole deck" means and is immune to where a card happens to be sitting.
   */
  const stacks = actor?.system?.decks ? Object.values(actor.system.decks) : [];
  const held = stacks.map(id => game.cards.get(id)).filter(Boolean);
  if (held.length) {
    let best = 0;
    for (const stack of held) {
      for (const card of stack.cards) {
        if (card.type !== "skill") continue;
        if (!card.system?.serves?.(approach)) continue;
        best = Math.max(best, card.system.value ?? 0);
      }
    }
    /* And a mastery, which is the one thing that raises a passive without touching a card: the
     * deeper half of skill-rules 8's scaling, and the only part of levelling that moves what a
     * character notices without trying (skill-rules 8's measurement). */
    const mastery = (actor.system.learned?.masteries ?? [])
      .filter(m => m === approach).length;
    return best + 2 + mastery;
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
  /*
   * And the bonus the step grants, carried on the instance rather than read off the config: two
   * tattoos are both Graven and grant different things. `creatorId` is the precedent -- a condition
   * has been able to hold data since Compelled needed to remember who compelled.
   */
  const carried = step.bonus?.value
    ? { bonus: { verb: step.bonus.verb ?? "", value: step.bonus.value,
      requiresTag: step.bonus.requiresTag ?? "" } }
    : {};
  let landed = {
    key, duration: full, ...(intensity === null ? {} : { value: intensity }), ...carried
  };
  let line;

  if (step.resist) {
    const score = passiveScore(target, step.resist);
    // An opening the target already carries makes the save harder; it never decides whether the
    // condition is attempted at all, so the half is playable against anyone (data/cards.mjs).
    const when = step.when?.needs && step.when.dc && carries(target, step.when.needs) ? step.when : null;
    const dc = when ? when.dc : (step.dc ?? CARDRPG.difficulties.normal);
    /*
     * **A saving throw is a check in all but name, so it swings like one.** Same doubled card,
     * same widened band -- written through the same two constants rather than beside them, because
     * this branch is the second copy of the four results and the two copies are exactly what would
     * drift. (That they are two copies at all is older than this change and still true: the band
     * lives here and in `checkOutcome`.)
     */
    const { used } = await drawFate(target, score, 0);
    const miss = used?.system.special === "miss";
    const crit = used?.system.special === "crit";
    const result = score + (miss || crit ? 0 : (used?.system.value ?? 0) * CHECK_SWING);
    const short = dc - result;

    if (crit || (!miss && short <= 0)) landed = null;
    else if (!miss && short <= -PARTIAL_FLOOR) {
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
