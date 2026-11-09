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
  MINOR_GODS, ROSTER, VARIANTS, NATURAL_WEAPONS, NPC_GEAR, ITEMS, FEATURES, TRANSFORMATIONS,
  INJURIES
} from "./content.mjs";
import { expandRoster } from "./monsters.mjs";
import { slateData } from "./setup.mjs";
import {
  drawFate, deckOf, uprightCards, discardCards, cardName, addFateCards, moveRandom, move,
  available,
  applyFear, removeCard, intruderStack, allStacks, harmCardData, critStacks,
  addFateCards as addFate
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
  /*
   * **A free hand, which is the other half of what a prepared spell costs (core-rules 4).**
   *
   * `needsFreeHand` is true of every spell slate by construction -- that is what makes it a spell
   * rather than a wand -- and it is asked rather than assumed so a slate that one day says
   * otherwise is obeyed. The exemptions are derived on the actor: the two rings, and a god whose
   * gift is that the weapon in your hand is the holy symbol.
   *
   * Refused here rather than warned about, because this is the gate a prepared spell is paid at
   * and an unpayable cost is not a cast. A player holding a sword and a shield who wants to cast
   * has a Ready to spend, which is the decision the rule exists to create.
   */
  if (slate.system.needsFreeHand && !actor?.system?.castsFreehanded
    && (actor?.system?.handsFree ?? 0) < 1) {
    ui.notifications.warn(`${actor?.name ?? "You"} has no hand free to cast `
      + `${slate.name} with. A prepared spell is gestured, and both hands are full.`);
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
/**
 * **Which way a figure is pointing, as one of the eight.**
 *
 * The token's rotation rounded to the nearest eighth of a turn. Rotation is a free angle and a
 * facing is one of eight, so the rounding is the whole of the conversion -- and it is done here
 * rather than stored, because a stored facing is a second copy of the thing the player just
 * turned, and the two would disagree the first time somebody dragged a token.
 */
export function facingOf(actor) {
  const token = actor?.getActiveTokens?.()[0];
  if (!token) return null;
  const eighth = Math.round(((token.document?.rotation ?? token.rotation ?? 0) % 360) / 45) % 8;
  return Object.keys(CARDRPG.facings)[(eighth + 8) % 8] ?? "n";
}

/**
 * **Is the line to that square stopped by something solid?**
 *
 * **[BUILT 2026-11-09]** The one place in this game where the grid is asked about a wall, and the
 * reason it is asked here and nowhere else is worth writing down.
 *
 * Cover is **declared**, deliberately: `advantageOn` says why -- tracing a line past every figure
 * would move the disadvantage on every ranged attack in the game, and every win rate this project
 * has published was measured without it. None of that applies to a wall. A full obstacle is not
 * cover at all and carries no disadvantage: *it blocks the line, and you cannot target through it*
 * (core-rules 11), which is a gate rather than a modifier, so it moves no measured number -- a
 * shot that cannot happen was never in the simulation.
 *
 * And that rule has been in the book since cover was written, enforced by nothing, because until
 * now **every** ranged attack in this game was aimed by a player who could see the wall. A held
 * shot is the first and only thing that picks its own target, so it is the first place the engine
 * has ever needed to know.
 *
 * `sight` is the right restriction and not an approximation of one: a window blocks movement and
 * not sight, and you can shoot through a window; a curtain blocks sight and not movement, and you
 * cannot shoot through a curtain. Walls carry no `shot` channel because sight already is one.
 *
 * **No backend, no wall knowledge, and the shot is allowed.** A scene with no walls drawn and a
 * headless run look identical from here, and refusing on both would make the card do nothing in
 * the common case rather than the rare one.
 */
function lineBlocked(from, to) {
  const backend = CONFIG?.Canvas?.polygonBackends?.sight;
  if (!backend?.testCollision || !from || !to) return false;
  try {
    return !!backend.testCollision(from, to, { type: "sight", mode: "any" });
  } catch (err) {
    console.warn("CardRPG | no wall test available for a held shot", err);
    return false;
  }
}

/**
 * **Is that square inside the ground this actor is watching?**
 *
 * Four questions, and all four have to be yes: the weapon reaches that far, the square is in
 * front rather than beside or behind, there is nothing solid in between, and there is a weapon
 * that can be loosed at all.
 *
 * The arc test is on the ANGLE and not on a shape of squares, because a shape has to be written
 * out once per facing and the diagonals would be written differently from the orthogonals -- which
 * is four chances to get it wrong and no way to notice. One angle comparison is the same rule in
 * all eight directions, and `CARDRPG.watchArc` is the only number in it.
 *
 * Distance is Chebyshev, the same measure `neighbours` uses, so a range of 3 means the same thing
 * here as it does everywhere else in this game.
 */
export function watches(actor, point, item) {
  const token = actor?.getActiveTokens?.()[0];
  if (!token || !canvas?.ready || !point) return false;
  const reach = item?.system?.verbs?.strike?.range ?? 0;
  if (reach < (CARDRPG.reactions.overwatch.needsRange ?? 2)) return false;

  const size = canvas.grid.size;
  const dx = (point.x - token.x) / size;
  const dy = (point.y - token.y) / size;
  const away = Math.max(Math.abs(dx), Math.abs(dy));
  if (away < 1 || away > reach) return false;

  const facing = CARDRPG.facings[facingOf(actor)];
  if (!facing) return false;
  /* Screen angles: y grows downward, so north is -y and the angle runs clockwise from it. */
  const bearing = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  const off = Math.abs(((bearing - facing.angle + 540) % 360) - 180);
  if (off > CARDRPG.watchArc / 2) return false;

  /*
   * Last, because it is the only test here that asks the canvas to trace anything, and the three
   * cheap ones have already thrown out all but a handful of squares.
   *
   * Centre to centre, and for a figure larger than a square that is the centre of the square it
   * entered rather than of the whole creature -- which is inside the creature either way.
   */
  return !lineBlocked(token.center, { x: point.x + size / 2, y: point.y + size / 2 });
}

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
/**
 * **A Wound, which is the one card the rules named and nothing ever made.**  **[BUILT 2026-11-07]**
 *
 * Everything else about a Wound has existed for a long time: the card type and its one-field data
 * model, the sheet count, the upright filter that refuses to let one react, the deck limits that
 * exclude it, the tray's own sentence for it, the prune that cannot take it, and a back in the art
 * brief. Two rules in core-rules 8 say when one arrives -- **5 or more damage from a single hit,
 * after armor**, and **dropping to 0 Health** -- and no code path made one, so a mechanic that was
 * finished in seven places did nothing at all.
 *
 * **An NPC cannot be wounded, and the guard for that is the data rather than a type check.**
 * A Wound is a dead card in *your action discard pile*, and core-rules 3 draws NPC intent **one
 * card per type** -- *one for all the goblins*. So an NPC's deck belongs to its species while a
 * Wound belongs to an individual, and putting one in would make hurting a single goblin degrade
 * every goblin on the board. There is nowhere to put it, which is why asking `deckOf` is the whole
 * of the check: a creature with no action discard of its own is a creature that cannot hold one.
 *
 * That also settles what *Cleave to the Bone* is worth. Its text moves the threshold **for you**,
 * as the attacker, and every creature in the roster is an NPC -- so against the game as written it
 * has no target. Four careers grant it, and the finding belongs to them rather than to this
 * function; it is recorded in core-rules 8.
 */
/**
 * **What a critical hit did, drawn rather than assumed.**
 *
 * A Critical doubled and that was the whole of it. Doubling is the right common answer and a poor
 * only answer, because it scales backwards against the defence a critical ought to beat: against
 * four points of armour a doubled Strike of 3 gets **2** through, so the card whose entire purpose
 * is *this one gets through* was flattest exactly where it should have been sharpest.
 *
 * Four of the ten faces still double. The rest apply Exposed, Off Balance or Halted, or draw two
 * others -- all mechanisms the game already had, which is the test a new deck has to pass.
 *
 * **Attacks only.** A Critical on a check or a heal still simply doubles: `FateCardData#apply` is
 * untouched and this is a layer over the attack path. A Lore check that drew *Off the Feet* would
 * be a deck reaching somewhere it has no business.
 *
 * **No deck is no error.** A world built before this deck existed, or a GM who would rather not
 * use it, gets the old behaviour: `doubles` is what the absence of a card means, so the rule
 * degrades to the rule it replaced rather than to nothing.
 *
 * Returns `{ doubles, faces, lines, riders }` -- what the caller needs to total the damage, what
 * to print, and the condition steps to apply **once the damage is done**.
 *
 * **The riders are returned rather than applied, which is the one ordering rule here.** They used
 * to land inside this function, before `resolveAttack` read the target's armour, so *Find the Gap*
 * stripped the armour off the very hit that found the gap: the card both gave up its doubling and
 * collected the whole benefit immediately, on one target, once. That made the crit deck the only
 * thing in the game that applied a condition before its own damage -- the tray applies a step's
 * `condition` after `resolveAttack` returns, and ammunition's `shot.condition` lands at the bottom
 * of it -- so this was an exception nobody had argued for.
 *
 * Landing it afterwards makes the condition faces a **trade** instead of a discount: give up the
 * double now, and the next attack on that target meets no armour. That only became worth drawing
 * when `duration: 1` started meaning *through my next turn* (combat.mjs, `turnJustEnded`); under
 * the old clock the condition expired before the attacker could use it, and the face would have
 * been a gift to whoever moved next.
 */
export async function drawCritEffect(actor) {
  const { deck, discard } = critStacks();
  if (!deck || !discard) return { doubles: true, faces: [], lines: [], riders: [] };

  const faces = [];
  const take = async () => {
    if (!available(deck).length) {
      const back = [...discard.cards.contents].map(c => c.id);
      if (back.length) await move(discard, deck, back);
      await deck.shuffle({ chatNotification: false });
    }
    const [card] = await moveRandom(deck, discard, 1);
    return card ?? null;
  };

  const first = await take();
  if (!first) return { doubles: true, faces: [], lines: [], riders: [] };
  /*
   * **Two others, so it cannot find itself.** One loop rather than a recursion rule, and the same
   * decision the fate deck makes about a Wild: the strange face does not compound.
   */
  if (first.system.draws > 0) {
    for (let i = 0; i < first.system.draws; i++) {
      const next = await take();
      if (!next) break;
      if (next.system.draws > 0) { i--; continue; }
      faces.push(next);
    }
  } else {
    faces.push(first);
  }

  const lines = [];
  const riders = [];
  let doubles = false;
  for (const face of faces) {
    if (face.system.doubles) doubles = true;
    lines.push(`<strong>${face.name}</strong> &mdash; ${face.system.text}`);
    const step = face.system.effect;
    /* A rider is anything the face does that is not arithmetic on this blow: a condition, or one
     * of the gear effects. `effect` is a full step, which the schema chose precisely so a face
     * wanting a different KIND of effect would not need it widened -- and two faces now want one. */
    if (step?.condition || step?.verb) riders.push(step);
  }
  return { doubles, faces, lines, riders };
}

/**
 * **The reason string that is also a rule**, and therefore a constant.
 *
 * Three call sites pass it -- combat.mjs's damage application and two in this file -- and it is
 * no longer only a line of prose on a card face: it is the test that decides whether an injury
 * is drawn for. A magic string read in four places is the next version of the defect this file
 * is full of notes about, so it gets a name before it can become one.
 */
export const DROPPED = "dropped to 0";

export async function resolveWound(target, { reason = "", injuryMode = 0 } = {}) {
  if (!target) return false;
  const stack = deckOf(target, "actionDiscard");
  if (!stack) return false;
  await stack.createEmbeddedDocuments("Card", [harmCardData("wound", { source: reason })]);
  /*
   * **And this is the one moment a character can be changed forever.**
   *
   * core-rules 8 gives two reasons for a Wound -- five past armour, and dropping to 0 -- and only
   * the second one is also the moment an injury is drawn for. Hanging the draw here rather than
   * at the three call sites that pass `DROPPED` is the whole of the design: permanence passes
   * through one gate, and a card that wants to make it worse modifies the gate instead of
   * inflicting an injury of its own.
   *
   * That is not a style preference. A card reading *permanently blind the target* would put the
   * most consequential rule in the game in as many places as there are cards, and this project
   * has paid for that shape twice already: the Wound threshold was a constant read in two places,
   * and `wound || taint` was written out three times before the intruder table closed it. The
   * `maiming` keyword is the modifier, and it is disadvantage on this draw and nothing else.
   */
  if (reason === DROPPED) await resolveInjury(target, { mode: injuryMode, cause: reason });
  return true;
}
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
  await stack.createEmbeddedDocuments("Card",
    Array.from({ length: n }, () => harmCardData("taint", { source, flavour })));

  /*
   * Fast taint resolves on arrival, because the card's own text fires "when drawn" and a card put
   * into a hand was never drawn. Doing it here keeps that text true rather than adding a case to it.
   */
  let dealt = 0;
  if (fast) {
    dealt = n;
    const before = target.system.health.value;
    await target.update({
      "system.health.value": Math.max(0, before - n)
    });
    /* A dose that drops you is still a drop (core-rules 8), even though no taint reaches five. */
    if (before - n <= 0) await resolveWound(target, { reason: DROPPED });
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
 * Fear N: N Fear cards into the target's action deck (core-rules 8).  **[BUILT 2026-11-08]**
 *
 * **The same two dials as Tainting, because it is the same mechanism:** how many, and which pile.
 * Slow puts them in the discard, where they come round at a moment nobody chose; fast puts them
 * straight into the hand, where they resolve at once and move you now. A shriek is fast and a
 * haunting is slow, and those are the same card in a different pile.
 *
 * **Dealt by a keyword and not by a card**, which is also Tainting's model: core-rules 8 says you
 * gain Fear from sources with `terrify`, the source says how much, and this is the GM's tool for
 * saying it. That is why nothing new went into the card pools to carry it -- `terrify` already
 * exists as a capability, the Goblin Shaman already has it, and a second vocabulary entry for the
 * same idea would be the dropdown-only value this project keeps digging out of its own history.
 *
 * **Action deck only.** A Fear card moves you, and the skill deck is not drawn in a fight. Mind
 * Taint can live in the skill deck because damage does not care where you are standing; this does.
 */
export async function resolveFear(actor, { amount = 1, target, fast = false, source = "" }) {
  if (!target) return null;
  const which = intruderStack("fear", fast);
  const stack = deckOf(target, which);
  if (!stack) {
    ui.notifications.warn(`${target.name} has no ${which} to be frightened into.`);
    return null;
  }

  const n = Math.max(1, amount);
  const made = await stack.createEmbeddedDocuments("Card",
    Array.from({ length: n }, () => harmCardData("fear", { source })));

  /*
   * Fast fear resolves on arrival, for the reason fast Taint does: the card's own text fires "when
   * drawn", and a card put into a hand was never drawn. Resolving it here keeps that text true
   * instead of adding a case to it. Each one moves you a square and then goes to the discard, so
   * two doses are two squares -- and the second is measured from where the first one left you.
   */
  let moved = 0;
  if (fast) {
    for (const card of made) {
      await applyFear(target, card);
      /* Spent the moment it resolves, and out of the game rather than into the discard: core-rules
       * 8 gives Fear no removal line because it needs none. */
      await removeCard(target, card);
      moved++;
    }
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong>: Fear <strong>${n}</strong> `
      + `&mdash; ${n} into the ${fast ? "hand" : "discard"}`
      + (moved ? `, resolving at once` : "")
      + `.</p></div>`
  });
  return { amount: n, fast, moved };
}

/**
 * Doubt N: N Doubt cards into the target's skill deck (core-rules 8).  **[BUILT 2026-11-08]**
 *
 * **Fear's other half, under the same keyword.** `terrify` deals both, and which one depends on
 * what the source attacks: a shriek puts Fear in your legs, a thing you cannot unsee puts Doubt in
 * your head. That is the split `tainting` already draws between body and mind, read on a different
 * pair of decks -- and it is the reason neither needed a keyword of its own.
 *
 * **It has no effect, and that is deliberate.** A Doubt does nothing when drawn: it is dead, it
 * takes one of four slots, and it goes when the scene does. What makes it expensive is the deck it
 * is in. The action deck launders itself every Catch Breath; the skill discard comes back only on a
 * rest (skill-rules 1), so a dose bought here is paid for across a session rather than a fight.
 */
export async function resolveDoubt(actor, { amount = 1, target, fast = false, source = "" }) {
  if (!target) return null;
  const which = intruderStack("doubt", fast);
  const stack = deckOf(target, which);
  if (!stack) {
    ui.notifications.warn(`${target.name} has no ${which} to be shaken in.`);
    return null;
  }

  const n = Math.max(1, amount);
  await stack.createEmbeddedDocuments("Card",
    Array.from({ length: n }, () => harmCardData("doubt", { source })));

  /*
   * Nothing resolves on arrival, fast or slow, because a Doubt has nothing to resolve. `fast` still
   * means something: it puts the card in the hand the player is holding NOW, which costs them this
   * scene instead of a later one.
   */
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong>: Doubt <strong>${n}</strong> `
      + `&mdash; ${n} into the skill ${fast ? "hand" : "discard"}.</p></div>`
  });
  return { amount: n, fast };
}

/**
 * One routine for every intruder that has nothing to resolve on arrival.  **[BUILT 2026-11-08]**
 *
 * Rage, Compulsion and Confusion differ in what they do when they are DRAWN, which is the table's
 * business in decks.mjs, and not at all in how they are dealt: N cards of one kind into the stack
 * the table names, slow into the discard or fast into the hand. So they share this, and each gets a
 * named wrapper below for the GM to call -- the wrappers are one line each because the difference
 * between them is genuinely one word.
 *
 * Fear and Taint keep their own routines because they resolve on arrival when dealt fast, and that
 * is a real difference rather than a parameter.
 */
async function dealIntruder(actor, kind, { amount = 1, target, fast = false, source = "" }) {
  if (!target) return null;
  const which = intruderStack(kind, fast);
  const stack = deckOf(target, which);
  if (!stack) {
    ui.notifications.warn(`${target.name} has no ${which} for a ${kind}.`);
    return null;
  }

  const n = Math.max(1, amount);
  /* Named by the builder, so the capitalisation rule is in one place rather than two. */
  const made = Array.from({ length: n }, () => harmCardData(kind, { source }));
  const name = made[0].name;
  await stack.createEmbeddedDocuments("Card", made);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong>: ${name} `
      + `<strong>${n}</strong> &mdash; ${n} into the ${fast ? "hand" : "discard"}.</p></div>`
  });
  return { amount: n, fast, kind };
}

/** Rage N: strikes the nearest creature when drawn, ally or enemy (core-rules 8). */
export async function resolveRage(actor, options) {
  return dealIntruder(actor, "rage", options);
}

/** Compulsion N: dead cards that also forbid Catch Breath while held (core-rules 8). */
export async function resolveCompulsion(actor, options) {
  return dealIntruder(actor, "compulsion", options);
}

/**
 * Confusion N: into an NPC **type's** deck, where it will be drawn as that type's intent.
 *
 * The target is the type rather than the individual, and that is the point: core-rules 3 draws
 * intent one card per type, so this is the one thing you can put in a monster's deck that the
 * sharing does not ruin. A Wound could not go there because a wound belongs to a body; a plan
 * belongs to a species.
 */
export async function resolveConfusion(actor, options) {
  return dealIntruder(actor, "confusion", options);
}

/**
 * Hex N: N permanent **Miss** cards into the target's fate deck (core-rules 6).
 *
 * **It is not a new kind of card, and finding that out is most of what this is.** The fate deck has
 * no hand and no slots, so nothing in it can be *dead* -- an intruder there has to be a fate card
 * with a bad face, and the game already has one: a Miss, which makes the action do nothing and then
 * reshuffles, so it stays. `addFateCards` has dealt them since the fate deck was built.
 *
 * The fate deck has also had a priced intruder in it the whole time. Shadow Magic's entire cost is
 * *a permanent Wild card per formula* (specializations.md), which is this mechanism bought
 * willingly. A Hex is that transaction with the consent removed, and it needed no new vocabulary,
 * no new subtype and no new resolution path -- only a name for the GM to call it by.
 */
export async function resolveHex(actor, { amount = 1, target, source = "a hex" } = {}) {
  if (!target) return null;
  const n = Math.max(1, amount);
  // The source is what makes it liftable: a dealt Miss has one and the deck's own Miss does not.
  const made = await addFate(target, { special: "miss", count: n, temporary: false, source });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong>: Hex <strong>${n}</strong> `
      + `&mdash; ${made} permanent Miss ${made === 1 ? "card" : "cards"} shuffled into the fate `
      + `deck. Only a cure or an Unbinding takes one out.</p></div>`
  });
  return { amount: made };
}

/* -------------------------------------------- */
/*  Permanent injuries                         */
/* -------------------------------------------- */

/** Which injury categories this character already carries. The cap counts these. */
export function injuryCategoriesTaken(actor) {
  const taken = new Map();
  for (const slate of actor?.items ?? []) {
    if (slate.type !== "injury") continue;
    const key = slate.system.category;
    taken.set(key, (taken.get(key) ?? 0) + 1);
  }
  return taken;
}

/**
 * Is there room for another injury of this category?
 *
 * **The cap is a dial per category and only Maiming is uncapped**, because the cap read absurdly
 * there and nowhere else: one Regrowth regrows an eye and a leg alike, so they are one category,
 * and a cap that follows the ritual was telling a one-eyed character their legs were safe for
 * ever. A Regrowth still lifts **one**, so three maimings is three rituals, which is content
 * rather than a loophole.
 *
 * What keeps that from being a death spiral is *Adapted*, not this.
 */
export function roomForInjury(actor, category) {
  const cap = CARDRPG.injuryCategories[category]?.cap ?? 1;
  if (cap === null) return true;
  return (injuryCategoriesTaken(actor).get(category) ?? 0) < cap;
}

/**
 * The categories still open to this character.
 *
 * **One injury per category, which is a cap on four rather than on nothing.** ideas.md's worry
 * about this list was that injuries stack into a death spiral, and a cap of one per category
 * answers it with the categories that already had to exist: four liftable kinds plus an
 * obligation is five slates at the very worst, and realistically four, because nobody takes on
 * an obligation by falling over.
 *
 * It also gives a category a second job. Naming a ritual was the first, and a value that does
 * only one thing is the kind this project keeps finding in dropdowns.
 */
export function openInjuryCategories(actor) {
  return Object.keys(CARDRPG.injuryCategories).filter(k => roomForInjury(actor, k));
}

/**
 * **The injury draw: the one place a character becomes permanently different.**
 *
 * ideas.md wrote this rule before anything could run it: *when you fall Unconscious, draw a fate
 * card -- a Miss is a permanent injury, a -2 or -1 is a lasting one that heals after days of
 * rest, anything else is only the normal Wound.* Every piece of it already existed. The draw is
 * `drawFate`, the three outcomes are a fate card's own faces, and *how long* is one number on
 * the slate rather than a second kind of thing.
 *
 * **`mode` is where every modifier lands**, and it is the existing advantage dial rather than a
 * new one: `maiming` draws two and keeps the worse, a Healer's Kit in reach draws two and keeps
 * the better, and the two cancel without a rule saying they do. A keyword that wanted to inflict
 * an injury directly would have needed a vocabulary of its own; a keyword that bends this draw
 * needs a number between -1 and 1.
 *
 * **It reports rather than decides which injury.** Which one you take is *"chosen by the GM to
 * fit what hit you"*, and that is fiction -- an axe takes a hand and a horror takes your nerve.
 * So this draws, says how bad it is, lists the categories still open, and stops. `applyInjury`
 * is the other half, and it is a separate call because a human makes the choice in between.
 */
export async function resolveInjury(target, { mode = 0, cause = "" } = {}) {
  if (!target) return null;
  // No fate deck, no draw. The same shape as a Wound's guard: ask the data, not the type.
  if (!deckOf(target, "fate")) return null;

  const fate = await drawFate(target, 0, mode);
  const card = fate.used;
  if (!card) return null;

  const permanent = card.system.special === "miss";
  /*
   * -2 and -1 are the lasting band, tested on the **value** rather than the rank.
   *
   * That is what settles the Wild, which is the one face this rule had no answer for: a Wild has
   * no value and a rank of 0, so it falls through to **no injury at all**. Right, and for the
   * reason a Wild exists -- it is the card whose result is a question for the table (`drawFate`
   * announces it wherever it is drawn), and the one draw in the game that must not become a
   * question is the one that changes a character for ever.
   */
  const lasting = !permanent && (card.system.value ?? 0) <= -1;
  const open = openInjuryCategories(target);
  const healsIn = permanent
    ? CARDRPG.injuryHealsIn.permanent
    : CARDRPG.injuryHealsIn.lasting;

  const face = cardName(card);
  let line;
  if (permanent) {
    line = `<strong>${face}</strong> &mdash; a <strong>permanent injury</strong>.`;
  } else if (lasting) {
    line = `<strong>${face}</strong> &mdash; a <strong>lasting injury</strong>, healed by `;
    line += `${CARDRPG.injuryHealsIn.lasting} days of rest.`;
  } else {
    line = `<strong>${face}</strong> &mdash; no injury. The Wound is all of it.`;
  }
  const names = open.map(k => game.i18n.localize(CARDRPG.injuryCategories[k].label));
  const left = names.length ? names.join(", ") : "<em>nothing &mdash; every category is taken</em>";
  const room = permanent || lasting ? `<p>Still open: ${left}.</p>` : "";
  const how = mode === 0 ? "" : mode > 0 ? " (advantage)" : " (maiming: two, worse)";

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: target }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong> fell. `
      + `Injury draw${how}: ${line}</p>${room}</div>`
  });

  return { permanent, lasting, healsIn: permanent || lasting ? healsIn : null, open, cause, face };
}

/**
 * Put a named injury on a character, with its cap and its teeth.
 *
 * **The teeth are the interesting part.** Five of the fourteen injuries own **intruder cards**
 * and one owns a **permanent Miss**, and dealing those is what makes a permanent condition
 * something that happens to you rather than a number you subtract. It is also how a curse comes
 * to be enforced at all: equipment.md 11 has an `[OPEN]` saying nothing in the engine can make
 * you keep a curse's bargain, and a bargain written as a card in your deck keeps itself.
 *
 * Everything dealt here carries the injury's name as its `source`, which is the only reason
 * `liftInjury` can take back exactly what was dealt and nothing else.
 */
export async function applyInjury(actor, which, { cause = "", healsIn = 0, target = actor } = {}) {
  const def = typeof which === "string" ? INJURIES.find(i => i.name === which) : which;
  if (!def || !target) {
    ui.notifications.warn(`No injury named "${which}".`);
    return null;
  }
  if (!roomForInjury(target, def.category)) {
    const cat = CARDRPG.injuryCategories[def.category];
    const label = game.i18n.localize(cat.label);
    ui.notifications.warn(`${target.name} already carries ${cat.cap} ${label}. That is the cap.`);
    return null;
  }

  const doc = slateData(def, "injury");
  const [slate] = await target.createEmbeddedDocuments("Item", [{
    ...doc,
    system: { ...doc.system, category: def.category, healsIn, cause }
  }]);

  if (def.takes?.fateMiss) {
    await resolveHex(actor, { amount: def.takes.fateMiss, target, source: def.name });
  }
  if (def.intruder?.kind) {
    await dealIntruder(actor, def.intruder.kind, {
      amount: def.intruder.amount ?? 1, target, source: def.name
    });
  }

  const ritual = slate.system.liftedBy;
  const lasts = healsIn ? `Heals after ${healsIn} days of rest.` : "<strong>Permanent.</strong>";
  const lift = ritual ? `Lifted by a ${ritual}.` : "No ritual lifts it.";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: target }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong>: `
      + `<strong>${def.name}</strong> &mdash; ${slate.system.text}</p>`
      + `<p>${lasts} ${lift}</p></div>`
  });
  return slate;
}

/**
 * Lift an injury, which is what a completed ritual does.
 *
 * **The challenge is played at the table and this is what happens when it is won.** A ritual is a
 * challenge and not a check (skill-rules 3, 6) because Ritual Magic's price is *"Time, and a
 * recipe that can go wrong"*; challenges are not in the engine, so the GM runs the tracks and
 * calls this. What the engine owes that arrangement is the part a human would get wrong: taking
 * back **exactly** the cards the injury dealt and leaving the deck's own alone.
 *
 * **A permanent obligation refuses, and that refusal is the point.** Bound Taint has had this asymmetry
 * since it was written -- *neither a cure nor Cleansing lifts it; the obligation names the one
 * thing that does* -- and it is what keeps four rituals from turning into a laundry service. A
 * `ritual` of `null` in config is how a category says so, and this is the line that reads it.
 */
export async function liftInjury(actor, injury) {
  if (!actor || injury?.type !== "injury") return false;
  const ritual = injury.system.liftedBy;
  /*
   * **A lasting injury heals on its own, and the category has nothing to say about it.**
   *
   * Only a **permanent** injury needs a ritual, and this guard used to ask the category alone --
   * which meant a *lasting* obligation could never be removed by anything at all. It would have
   * sat on the sheet past its fourteen days of rest, refusing, because the one path that takes
   * cards back out was gated on a question about permanence it never asked.
   *
   * This is also the only removal path there is, deliberately: whatever the reason an injury
   * leaves, the cards it dealt have to leave with it, and one exit is how that stays true.
   */
  if (injury.system.permanent && !ritual) {
    ui.notifications.warn(`${injury.name} is a permanent obligation: no ritual lifts it. `
      + "The one who is owed says what does.");
    return false;
  }
  const how = ritual && injury.system.permanent
    ? ritual
    : `${injury.system.healsIn} days of rest`;

  // The intruder cards it owns, wherever they ended up: hand, discard or deck.
  let pulled = 0;
  const kind = injury.system.intruder?.kind;
  if (kind) {
    for (const stack of allStacks(actor)) {
      for (const card of [...(stack?.cards ?? [])]) {
        if (card.type !== kind || card.system.source !== injury.name) continue;
        await removeCard(actor, card);
        pulled++;
      }
    }
  }

  // And the permanent Misses, which is why a fate card carries a source at all.
  let unhexed = 0;
  if (injury.system.takes?.fateMiss) {
    for (const stack of [deckOf(actor, "fate"), deckOf(actor, "fateDiscard")]) {
      for (const card of [...(stack?.cards ?? [])]) {
        if (card.system.source !== injury.name) continue;
        await card.delete();
        unhexed++;
      }
    }
  }

  const name = injury.name;
  await injury.delete();
  const cards = pulled ? ` ${pulled} ${kind} card${pulled === 1 ? "" : "s"} gone.` : "";
  const misses = unhexed ? ` ${unhexed} Miss gone from the fate deck.` : "";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong>: `
      + `<strong>${how}</strong> lifts <strong>${name}</strong>.${cards}${misses}</p></div>`
  });
  return true;
}

/**
 * Corrode N: take N off the target's armor until it is repaired (core-rules 8).
 *
 * It eats the equipped body slate rather than the actor's armor number, so the loss follows the
 * armour when it is taken off, and a repair is a reset rather than a guess.
 *
 * **Permanent and cumulative, floored at 0, and it never destroys anything.** What it takes is
 * capped at what is left, so `corroded` cannot pass the printed `armor` and `armorNow` cannot go
 * negative. A breastplate at armour 0 is still a breastplate: it fills its slot, it weighs what it
 * weighed, and `resolveRepair` brings it back. Gear here is **spent, not deleted** -- an item that
 * vanished at 0 would make a 10 g flask of acid the cheapest way to delete 300 g of plate, and
 * would leave the repair skill nothing to repair.
 *
 * `resolveBlunt` is the same routine one printed number over. The two are kept apart because an
 * item can carry an `armor` and a `strike` at once.
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
 * **Which weapon takes it, when more than one is in hand: the best one, and a tie goes to the
 * first.**
 *
 * Armour needed no such rule -- one body slot, one answer -- but hands are not like that: a hero
 * may be holding a sword and an axe, or a sword and a shield that strikes. So this is a rule and
 * not an accident, and it is **automatic**: no prompt, no dialog, nothing to answer mid-attack.
 *
 *  - **The best weapon**, because *weakest* or *random* would let anybody opt out of the effect by
 *    carrying a knife, and an effect you can dodge by owning junk is not an effect. Best means the
 *    highest value it strikes for **now**, so a sword already battered below the axe behind it
 *    stops being the one that takes the next hit.
 *  - **A tie goes to the first**, in the order the actor's own items come in, which is stable
 *    across a session and across clients. `reduce` with a strict `>` is what keeps it there: the
 *    first weapon to hold the highest value is never displaced by a later equal one.
 *
 * It considers what is EQUIPPED and strikes for something: a weapon in a pack is not in the blow's
 * way, and one already battered to 0 has nothing left to take.
 *
 * **It was a prompt for about an hour.** The attacker choosing had an argument -- this is damage
 * being done, and the client resolving the attack is the attacker's -- but a dialog in the middle
 * of resolving a hit is a dialog on every critical, and the answer it was asking for is one a rule
 * can give. A deterministic rule is also a testable one, which a prompt is not.
 */
export function bestWeapon(weapons) {
  return weapons.reduce(
    (best, w) => ((w.system.valueFor("strike") ?? 0) > (best.system.valueFor("strike") ?? 0)
      ? w : best),
    weapons[0] ?? null);
}

/**
 * Blunt N: take N off what the target's weapon strikes for, until it is repaired (core-rules 8).
 *
 * `resolveCorrode` for the other printed number, and everything true of that is true here: the
 * loss lives on the **item**, so it follows the weapon when it changes hands; it is permanent and
 * cumulative; what it takes is capped at what is left, so nothing goes negative; and a weapon at
 * strike 0 is still a weapon. It is a club with no weight behind it until somebody mends it.
 */
export async function resolveBlunt(actor, { amount = 1, target, item = null }) {
  if (!target) return null;
  const weapons = (target.items ?? []).filter(i =>
    i.type === "item" && i.system.equipped && (i.system.valueFor?.("strike") ?? 0) > 0);
  const weapon = item ?? bestWeapon(weapons);
  if (!weapon) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="cardrpg"><p><strong>${target.name}</strong> has nothing in hand `
        + `left to blunt.</p></div>`
    });
    return null;
  }

  const before = weapon.system.valueFor("strike");
  const taken = Math.min(before, Math.max(1, amount));
  await weapon.update({ "system.blunted": (weapon.system.blunted ?? 0) + taken });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong>: ${weapon.name} strikes for `
      + `${before} &rarr; <strong>${before - taken}</strong>, until it is repaired.</p></div>`
  });
  return { item: weapon.name, before, now: before - taken };
}

/**
 * **The gear effects behind one name**, because two different callers apply them: a card half
 * played from the tray, and a critical's rider applied inside `resolveAttack`.
 *
 * One mapping rather than two switches. The alternative was a `case` list in the tray and an `if`
 * chain in the resolver -- the same decision written twice, drifting the moment a third effect
 * arrives, which is this project's commonest defect in its original form.
 */
export async function resolveGearEffect(actor, { step, target }) {
  const amount = step.param ?? 1;
  if (step.verb === "corrode") return resolveCorrode(actor, { amount, target });
  if (step.verb === "blunt") return resolveBlunt(actor, { amount, target });
  return null;
}

/**
 * Repair N: put N back on one item, which is what Corrode and Blunt had no inverse for.
 *
 * **It was promised in prose for a long time before anything could do it.** A Repair Kit and a
 * Smith's Hammer both grant *armour and its repair*; The Mended Seam is a ritual to *repair one
 * item overnight, including corroded armour*; and that ritual's own `needs` line read *repairing an
 * item, which Corrode has no inverse for*. Three pieces of content describing a mechanism, and the
 * mechanism was the missing half.
 *
 * **[2026-11-09] And a repair is an ACTION rather than downtime** (core-rules 8), so this is
 * reached in play. The two tools stopped promising a flat point overnight when that changed: what
 * they are for is the check, which is what their `bonus` was always describing.
 *
 * Armour first, then the strike, because a character who has had both eaten wants the defence
 * back before the damage -- and because one call per point keeps *clears 1* meaning one thing.
 * Returns what moved, or null when there was nothing to mend.
 */
export async function resolveRepair(actor, { item, amount = 1, which = "" } = {}) {
  if (!item) return null;
  const take = (field, printed, now) => {
    const spent = item.system[field] ?? 0;
    if (!spent) return null;
    const back = Math.min(spent, Math.max(1, amount));
    return { field, back, from: now, to: now + back, printed };
  };
  const armour = which === "blunted" ? null
    : take("corroded", item.system.armor ?? 0, item.system.armorNow ?? 0);
  const edge = which === "corroded" || armour ? null
    : take("blunted", item.system.verbs?.strike?.value ?? 0, item.system.valueFor?.("strike") ?? 0);
  const fix = armour ?? edge;
  if (!fix) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="cardrpg"><p><strong>${item.name}</strong> has nothing wrong with `
        + `it.</p></div>`
    });
    return null;
  }

  await item.update({ [`system.${fix.field}`]: (item.system[fix.field] ?? 0) - fix.back });
  const what = fix.field === "corroded" ? "armor" : "strike";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> mends <strong>${item.name}`
      + `</strong>: ${what} ${fix.from} &rarr; <strong>${fix.to}</strong>`
      + `${fix.to >= fix.printed ? ", as it was printed" : ""}.</p></div>`
  });
  return { item: item.name, ...fix };
}

/**
 * **A repair is a skill**, which is the half the user asked for and the content already assumed.
 *
 * The approach is `lore` because that is what the two backgrounds that grant *armour and its
 * repair* put their bonus on, so the training a character bought is the training that pays here --
 * no new field, no second vocabulary, and a character without it may still try.
 *
 * The four results are the four results (skill-rules 2), read through `checkOutcome` like every
 * other check rather than scored again here:
 *
 *  - **Critical**: 2 points back. It went better than the work deserved.
 *  - **Success**: 1.
 *  - **Partial**: nothing back, and the action is spent. That is the honest reading of *partly
 *    repaired* for a thing that either holds or does not -- and it is what gives the action its
 *    price, now that it is taken in play rather than between sessions.
 *  - **Fail**: nothing. Nothing worse, either -- a failed repair does not eat the item, for the
 *    same reason Corrode does not: gear here is spent, not deleted.
 */
export async function resolveRepairCheck(actor,
  { item, tool = null, dc = CARDRPG.difficulties.normal } = {}) {
  if (!actor || !item) return null;
  if (!item.system?.needsRepair) {
    ui.notifications?.info(`${item.name} has nothing wrong with it.`);
    return null;
  }
  /*
   * **`improvise`, and no `item`, and both of those were wrong when this shipped.**
   *
   * `resolveCheck` reads its base off a CARD -- that is what a check is in this game -- and
   * refuses with *"That card is not a Lore card"* when there is none. **No card from the skill
   * deck is spent on a repair**, which is exactly what `improvise` means: the base is 0 and the
   * tools are the whole of the difference. Without it this routine could not succeed once -- it
   * would warn about a card nobody had played and return null, which is the shape of defect this
   * file is full of notes about: a path that looks wired and silently does nothing.
   *
   * And `item` on `resolveCheck` means **the tool**, not the thing being worked on. Passing the
   * broken armour there read its `bonus` as a tool bonus -- a breastplate helping you mend a
   * breastplate. The thing being repaired goes to `resolveRepair` below and nowhere else.
   *
   * **`tool` is separate, and it is the whole reason the Repair Kit has a `bonus`.** *Lore +2,
   * training "armour and its repair", situation "repairs"* is the tool mechanism spelled out, and
   * a first version of this threw it away by passing nothing: a character with the right kit got
   * no more out of a repair than one with bare hands. `resolveCheck` caps an untrained user at +1
   * however good the tool is, which is the rule that makes the training worth buying.
   *
   * Which tool is the player's to choose, as it is in the skill pane: `situation` exists to be
   * read by a person -- *repairs*, *metalwork* -- and the pane prints it beside each tool for
   * exactly that reason. Picking for them would mean matching that sentence by hand, which this
   * file already warns about: the tool bonus once matched a tool's LAST WORD against the
   * trainings a character held, and eleven of fourteen tools could never be trained.
   */
  const check = await resolveCheck(actor, { approach: "lore", dc, improvise: true, item: tool });
  if (!check) return null;
  const back = check.result === "critical" ? 2 : check.result === "success" ? 1 : 0;
  if (!back) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="cardrpg"><p><strong>${actor.name}</strong> works on `
        + `<strong>${item.name}</strong> and it is no better than it was.</p></div>`
    });
    return { result: check.result, back: 0 };
  }
  const done = await resolveRepair(actor, { item, amount: back });
  return { result: check.result, back, ...done };
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
    } else if (live && key === "overwatch") {
      /*
       * A weapon that can be loosed, answering with its own Strike line -- the same shape as
       * `counter`, and for the same reason: a held shot is the weapon's shot, not the card's. The
       * card chose the moment and the weapon decides what arrives.
       */
      const item = equipped.find(i => (i.system.verbs?.strike?.range ?? 0)
        >= (rule.needsRange ?? 2) && (i.system.verbs?.strike?.value ?? null) !== null);
      if (item) printed = { key, card, item, reduce: 0, hits: item.system.verbs.strike.value };
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
/**
 * **The blow moved onto one of the attacker's own**, which is The Grey's whole register.
 *
 * The same slot `redirectHit` uses, and deliberately so: substituting the taker is already how
 * this engine expresses *somebody else takes this*, and everything downstream recomputes against
 * whoever that turns out to be -- armour, Block, the Wound threshold and the reaction the new
 * taker gets to make for themselves. A redirect that patched the damage afterwards would have had
 * to repeat all four.
 *
 * **Gated on the blow being serious**, the same way a bodyguard is. A reaction resolves by itself
 * (core-rules 3), and a prepared spell spent on a scratch is a slot spent on nothing -- so this
 * fires when the hit would Wound or drop, which is what the handbook already promises of every
 * reaction.
 *
 * **The victim has to be the attacker's neighbour, not the target's.** You are moving the
 * attacker's arm, so the blow goes where that arm can reach, and what it finds there is one of
 * their own side.
 */
async function deflectHit(attacker, target, incoming) {
  if (incoming <= 0) return null;
  const serious = incoming >= CARDRPG.defaults.woundAt
    || incoming >= (target?.system?.health?.value ?? 0);
  if (!serious) return null;

  const options = reactionsFor(target, "hit")
    .filter(o => CARDRPG.reactions[o.key]?.kind === "redirect");
  if (!options.length) return null;

  const victim = neighbours(attacker)
    .find(who => who.id !== target.id && who.id !== attacker?.id && who.type === attacker?.type);
  if (!victim) return null;

  const option = options[0];
  await spendReaction(target, option);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: target }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong> moves `
      + `${attacker?.name ?? "the attacker"}'s arm with `
      + `<em>${option.slate?.name ?? "a word"}</em>: <strong>${victim.name}</strong> takes it `
      + "instead, and neither of them understands what happened.</p></div>"
  });
  return { actor: victim, from: target };
}

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
  const block = enemy.system.blockNow ?? enemy.system.block ?? 0;
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
 * **A held shot, loosed at whoever walked into the ground being watched.**
 *
 * The same resolution as a counter and deliberately not shared with it: a counter answers a figure
 * now adjacent and this answers one that may be eight squares off, so the two have nothing in
 * common but the arithmetic, and the arithmetic is three lines. What they do share is that neither
 * draws fate -- core-rules 3, every reaction is flat -- which is what keeps a held shot from being
 * a better attack than an attack.
 */
export async function overwatchShot(actor, enemy, option) {
  const armor = enemy.system.armor ?? 0;
  const block = enemy.system.blockNow ?? enemy.system.block ?? 0;
  const dealt = Math.max(0, (option.hits ?? 0) - armor - block);
  const health = Math.max(0, (enemy.system.health.value ?? 0) - dealt);
  const choice = await spendReaction(actor, option);
  await enemy.update({
    "system.health.value": health,
    ...(block && !enemy.system.blockPersists ? { "system.block": 0 } : {})
  });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> was watching that ground: `
      + `${enemy.name} walks into it and takes ${option.item.name}, spending `
      + `<em>${cardName(choice.card)}</em>: ${option.hits}`
      + (armor ? ` &minus; ${armor} armor` : "")
      + (block ? ` &minus; ${block} Block` : "")
      + ` = <strong>${dealt}</strong> damage`
      + (health <= 0 ? ", <strong>down</strong>" : "")
      + ".</p></div>"
  });
  return { card: cardName(choice.card), dealt };
}

/**
 * Everyone watching the ground an enemy just walked into, and the one shot that answers.
 *
 * **One shooter, not every shooter.** The first enemy into the lane takes one shot, because a
 * reaction is one card and a rule that let four archers all answer the same step would end a fight
 * before anybody had a turn. Initiative order decides, the same way it decides which bodyguard
 * steps in front.
 */
export async function answerWatch(mover, point, from = null) {
  if (!mover || !canvas?.ready) return null;
  const order = game.combat?.turns ?? [];
  const place = who => {
    const at = order.findIndex(t => t.actor?.id === who.id);
    return at < 0 ? Number.MAX_SAFE_INTEGER : at;
  };
  const watchers = canvas.tokens.placeables
    .map(placed => placed.actor)
    .filter(who => who && who.id !== mover.id && who.type !== mover.type)
    .map(who => ({ who, options: reactionsFor(who, "watch") }))
    /*
     * Entering the lane, not standing in it. A watcher who covered the square the mover came from
     * has already had their moment: one shot answers one approach, and a figure crossing a long
     * lane would otherwise be shot at every step of it.
     */
    .filter(entry => entry.options.length
      && watches(entry.who, point, entry.options[0].item)
      && !(from && watches(entry.who, from, entry.options[0].item)))
    .sort((a, b) => place(a.who) - place(b.who));
  if (!watchers.length) return null;
  const { who, options } = watchers[0];
  return overwatchShot(who, mover, options[0]);
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

/**
 * **A turn that does not happen refuses the actions in it** (core-rules 7, Halted).
 *
 * `noTurn` and `noSecondary` have existed on both actor models since conditions did, and **nothing
 * read either of them**. The tray greyed the halves out by testing `blocksTurn` on the config entry
 * directly, which is the UI being helpful rather than the rule being true: a macro, a chat command
 * or any second caller resolved a Halted actor's whole turn without a word. That is this project's
 * commonest finding wearing a new hat -- a getter nothing asks -- and the fix is a reader, here.
 *
 * **The warning names the condition that did it** rather than saying "you cannot do that". A player
 * whose turn silently refuses assumes a bug; one told *Halted: the whole turn does not happen* knows
 * the rule and can argue with it.
 *
 * Returns **true when the action is refused**, so a call site reads as a guard clause:
 *
 *     if (refusesAction(actor, { what: "a strike" })) return null;
 *
 * `half` is optional because most callers neither know it nor need it: the turn-wide ban needs no
 * half. Pass it where it is known and the **secondary** ban arrives with it -- Dazed, and Halted
 * again, which carries `blocksSecondary` precisely so a reader that only knew `blocksTurn` would
 * not grey out the wrong thing. That is the one rule here that depends on which half is in play,
 * and `noSecondary` had no reader either.
 */
export function refusesAction(actor, { half = null, what = "that" } = {}) {
  const system = actor?.system;
  if (!system) return false;
  const named = key => CARDRPG.conditions[key]
    ? (game.i18n?.localize(CARDRPG.conditions[key].label) ?? key) : key;
  /* Which condition to blame, read off the flag rather than a name: Unconscious stops a turn too,
   * and a message hard-coded to Halted would lie about it. */
  const blame = flag => (system.activeConditions ?? [])
    .map(c => c.key).find(key => CARDRPG.conditions[key]?.[flag]);

  if (system.noTurn) {
    ui.notifications?.warn(`${actor.name} is ${named(blame("blocksTurn"))}: the whole turn does `
      + `not happen, so ${what} cannot be played.`);
    return true;
  }
  if (half === "secondary" && system.noSecondary) {
    ui.notifications?.warn(`${actor.name} is ${named(blame("blocksSecondary"))} and loses the `
      + `secondary half, so ${what} cannot be played there.`);
    return true;
  }
  return false;
}

export async function resolveAttack(actor, {
  verb = "strike", item, mod = 0, targets = [], step = {}, ammo = null, payload = null
}) {
  if (refusesAction(actor, { what: `a ${verb}` })) return null;
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

  /* The battered value, not the printed one: `valueFor` is `armorNow` for a weapon and returns
   * the same `null` the raw read does for a line the item has not got. */
  const base = item?.system?.valueFor?.(verb) ?? line.value;
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
  /*
   * **A Critical always gets at least one point through.**
   *
   * The rule exists because of a count: **15 of the roster's 112 creatures could not hurt a
   * character in Plate at all** -- not on a Critical, not ever. A Scrip's Nip is 1, doubled to 2,
   * against four points of armour; a Townsfolk's Dagger is 2, doubled to 4, against four. An
   * encounter built from any of them was unlosable, which is not a difficulty setting, it is the
   * absence of a fight.
   *
   * It is a **floor on the Critical and nothing else**, which is what makes it cheap: a goblin's
   * spear is 3, doubled to 6, and already gets 2 through four points of armour -- so the floor
   * never fires in any published encounter and changes none of their numbers. It fires exactly
   * where the attack was too small to matter, which is exactly where the problem was.
   *
   * It also keeps armour doing its job. Nineteen of twenty faces are still stopped dead; what
   * changes is that the one card whose whole purpose is *this one gets through* now does.
   */
  const critical = fate.used?.system.special === "crit";
  /*
   * **One draw per action, like the fate draw it hangs off** (core-rules 6). An Area attack that
   * crits draws one critical card and every target gets the same answer, which is the rule fate
   * already follows and the only one that keeps a Blast legible.
   *
   * The conditions it carries land on the **first** target, because a card that stripped the armour
   * off *everyone it hit* would be a different and much larger card -- more so now that Exposed
   * takes armour to 0 rather than down by 2. The faces are printed either way.
   */
  const crit = critical
    ? await drawCritEffect(actor)
    : { doubles: true, faces: [], lines: [], riders: [] };
  /*
   * **And the undoubled figure, which the deck may send us back to.**
   *
   * `fate.result` has the doubling baked in by `FateCardData#apply`, and that is right for a check
   * and a heal -- only an attack asks the deck what the critical did. So a face that is not
   * *Through and Through* resolves at the value the attack would have had, and the card's own
   * effect is what it bought instead.
   */
  const landed = critical && !crit.doubles ? before : fate.result;

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
      const hadBlock = who.system.blockNow ?? who.system.block ?? 0;
      const { armor, block, pierced, rounded } =
        defencesAgainst({ armor: hadArmor, block: hadBlock, pierce, step, when, opening });
      const combo = opening ? (when.mod ?? 0) : 0;
      const got = Math.max(0, landed + combo - armor - block);
      return { armor, block, combo, pierced, rounded, hadArmor, hadBlock,
        /* The floor is on the total, after armour and Block, so a Critical is never shrugged off
         * entirely however the target is defended. */
        incoming: critical ? Math.max(1, got) : got };
    };

    /*
     * Reactions, in the two steps core-rules 3 gives, and both AFTER the draw: Parry fires on "you
     * are hit" and Brace on "you take damage", so a Miss costs the defender nothing -- `incoming`
     * is 0 on a Miss, which is the whole of that rule.
     *
     * 1. REDIRECTION changes who is being hit, so it goes first; the original target is never
     *    asked to spend a card against a blow an ally has already taken for them.
     */
    /*
     * **A deflect comes before a bodyguard**, because they answer the same blow from opposite
     * sides: a bodyguard steps in front of it and a deflect sends it somewhere else entirely.
     * Nobody has to step in front of a blow that is no longer arriving.
     */
    const sent = missed ? null : await deflectHit(actor, target, against(target).incoming);
    const guard = (missed || sent) ? null
      : await redirectHit(actor, target, against(target).incoming);
    const taker = sent?.actor ?? guard?.actor ?? target;

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
    /*
     * **Health before the blow, because two things below need it and one of them was wrong.**
     *
     * `down` used to read `taker.system.health.value - dealt <= 0` AFTER the update had landed, so
     * it subtracted the damage twice: a hero on 4 Health taking 3 was reported **down** at 1. The
     * document reflects the new value the moment the update resolves, which is exactly the kind of
     * read that looks right on the page. One local fixes it and gives the Wound rules the number
     * they are written about.
     */
    const before = taker.system.health.value;

    await taker.update({
      "system.health.value": Math.max(0, before - dealt),
      // A Defend secondary or reaction covers one attack, so it is spent whatever it stopped; a
      // primary holds until the start of the defender's next turn and is cleared there instead.
      ...(block && !taker.system.blockPersists ? { "system.block": 0 } : {})
    });

    /*
     * The two events of core-rules 8, and **one Wound per blow**: the rules say *you gain 1 Wound
     * when* and then list two triggers, so a single hit that both deals five and drops you is one
     * Wound rather than two. Dropping is named first because it is the worse of the two and the
     * reason the card says what it says.
     */
    const dropped = before - dealt <= 0 && dealt > 0;
    if (dropped || dealt >= CARDRPG.defaults.woundAt) {
      await resolveWound(taker, { reason: dropped ? DROPPED : "a heavy blow" });
    }

    rows.push({
      name: taker.name, armor, block, combo, dealt,
      /* What was gone through, and how much of it: a defence that silently did not apply looks
       * exactly like a defence the target never had. */
      pierced: pierced ? hadArmor : 0,
      rounded: rounded ? hadBlock : 0,
      opening: combo ? game.i18n.localize(CARDRPG.conditions[when.needs]?.label ?? when.needs) : null,
      down: dropped,
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

  /*
   * **The critical deck's rider, here with every other condition an attack carries.**
   *
   * On the FIRST target, which is the rule the deck was written with: a face that stripped the
   * armour off everything it hit would be a different and much larger card. And after the damage,
   * which is the whole of the change -- the hit that found the gap is resolved against the armour
   * the target was actually wearing, and the gap is what the NEXT attack walks through.
   */
  for (const step of crit.riders ?? []) {
    if (!first) break;
    if (step.condition) await resolveCondition(actor, { step, target: first });
    else await resolveGearEffect(actor, { step, target: first });
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

  /*
   * **What the critical deck said, printed whether it doubled or not.**
   *
   * A face that is not *Through and Through* changes the number the attack resolves at, so the
   * line has to say both: what was drawn, and that the hit was not doubled. A total that silently
   * stopped being double would be the one thing a player reads and cannot account for.
   */
  if (crit.lines.length) {
    parts.push(`<p>Critical: ${crit.lines.join("<br>")}</p>`);
    if (!crit.doubles) parts.push(`<p class="cr-note">Not doubled: ${landed}.</p>`);
  }

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
  if (refusesAction(actor, { half, what: "a Defend" })) return null;
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
  if (refusesAction(actor, { what: "a heal" })) return null;
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
  if (refusesAction(actor, { what: `using ${item?.name ?? "that"}` })) return null;
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
  /* A check is an action of the turn like any other. An ANSWER to somebody else's check is not,
   * and `answerCheck` does not come through here. */
  if (refusesAction(actor, { what: "a check" })) return null;

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
        /* A refresh restarts the clock as well as the count: the new application is the one whose
         * turn the duration now hangs off, or a condition re-applied on the creator's own turn
         * would tick at the end of it. */
        already.creatorId = actor.id;
        already.round = game.combat?.round ?? null;
      } else conditions.push({ ...landed, creatorId: actor.id, round: game.combat?.round ?? null });
    }
    await target.update({ "system.conditions": conditions });
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${target.name}</strong> ${line}</p></div>`
  });
  return landed;
}

/* -------------------------------------------- */
/*  Cards that resolve as they are dealt        */
/* -------------------------------------------- */

/**
 * Rage: Strike the nearest creature, whatever it is.
 *
 * **The target is a rule, not a choice.** Nearest by Chebyshev, and the lowest Health of any tied --
 * so a player cannot aim their own affliction at the enemy and a GM cannot aim it at the cleric.
 * That is the whole of what makes this a card rather than a table argument, and the tie-break
 * matters more than it looks: ties are common on a square grid, and "nearest" alone would have left
 * the choice sitting there unmade.
 *
 * It goes through `resolveAttack`, so it is a real Strike: fate is drawn, armour applies, and the
 * target may react to it exactly as to any other hit. An ally can Block their friend's swing, which
 * is both correct and the reason this is survivable.
 *
 * **It lives here rather than in decks.mjs, which is what broke the import cycle.** It used to sit
 * beside `applyTaint` and `applyFear` and reach back for `resolveAttack` through a deferred
 * `import()` -- deliberate, documented, and still a cycle: decks could not be read without reading
 * the resolver. The other two belong where they were, because what they do is damage and a square;
 * this one draws fate, meets armour and offers the target a reaction, which is resolution. It was
 * the only reason the two modules pointed at each other.
 *
 * `refill` takes it as a handler from its one caller, so the deck module still decides WHEN a
 * drawn card resolves and no longer needs to know what this one does.
 */
export async function applyRage(actor, card) {
  const say = text => ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>${actor.name}</strong> draws <em>${card.name}</em>: `
      + `${text}</p></div>`
  });

  const token = actor?.getActiveTokens?.()[0];
  const cell = canvas?.grid?.size;
  if (!token || !canvas?.ready || !cell) {
    await say("Strike the nearest creature, ally or enemy. <em>No token placed &mdash; the GM "
      + "resolves it.</em>");
    return;
  }

  const others = canvas.tokens.placeables.filter(t => t.id !== token.id && t.actor);
  if (!others.length) {
    await say("nothing within reach of it. The card is spent and the swing goes nowhere.");
    return;
  }

  const cheb = t => Math.max(Math.abs(t.x - token.x), Math.abs(t.y - token.y)) / cell;
  const health = t => t.actor?.system?.health?.value ?? Infinity;
  const victim = others.reduce((a, b) => {
    const d = cheb(b) - cheb(a);
    if (d < 0) return b;
    if (d > 0) return a;
    return health(b) < health(a) ? b : a;     // the rule's tie-break, not a preference
  });

  const weapon = actor.items?.find(i => (i.system?.verbs?.strike?.value ?? null) !== null);
  if (!weapon) {
    await say(`nothing equipped to swing at <strong>${victim.document.name}</strong>. The card is `
      + `spent.`);
    return;
  }

  await say(`a Strike at <strong>${victim.document.name}</strong> &mdash; the nearest creature, `
    + `ally or enemy.`);
  await resolveAttack(actor, { verb: "strike", item: weapon, targets: [victim.actor] });
}
