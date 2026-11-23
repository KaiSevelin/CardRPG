/**
 * Combat: individual initiative, intent cards, and condition ticking.
 *
 * Three rules shape this and none of them are Foundry's defaults:
 *
 *  - Initiative is **drawn, not rolled**, once per fight, from each combatant's own fate deck, and
 *    ties are redrawn until the order settles (core-rules 3).
 *  - One card is drawn per NPC **type** per round, face down, and every NPC of that type acts on it
 *    at its own place in the order. So the draw and the acting are separate steps.
 *  - A condition's duration ticks at the **end** of its **creator's** turn, not the victim's, so
 *    `duration: 1` lasts through the creator's next turn and the creature that spent a turn
 *    setting something up is the one who gets to use it.
 */

import { CARDRPG } from "./config.mjs";
import {
  deckOf, moveRandom, moveTop, move, normalizeDeck, allStacks, available, refill, handShort
} from "./decks.mjs";
/* `applyRage` because a Rage card is a Strike and the deck layer does not resolve Strikes: the
 * turn-start deal needs the same handler the deck button has always passed. */
import { resolveWound, DROPPED, resolveDue, clearDue, applyRage } from "./resolve.mjs";
import { expireGround, clearGround, groundFor, imposeGround } from "./ground.mjs";

/* -------------------------------------------- */
/*  Initiative                                  */
/* -------------------------------------------- */

export class CardRPGCombat extends Combat {

  /**
   * Draw initiative instead of rolling it.
   *
   * Everyone draws one fate card; highest acts first. Everyone still tied draws again, and only
   * they draw, so a redraw orders the tied pair without moving them past anyone else. The nested
   * draws become a sort key, which is what makes that work.
   */
  async rollInitiative(ids, options = {}) {
    ids = typeof ids === "string" ? [ids] : ids;
    const combatants = ids.map(id => this.combatants.get(id)).filter(c => c?.actor);
    if (!combatants.length) return this;

    const keys = new Map(combatants.map(c => [c.id, []]));
    let tied = [combatants];
    let depth = 0;

    while (tied.length && depth < 10) {
      const next = [];
      for (const group of tied) {
        for (const combatant of group) {
          keys.get(combatant.id).push(await this.#drawInitiative(combatant));
        }
        // Re-group whoever still matches on the latest draw.
        const buckets = new Map();
        for (const combatant of group) {
          const value = keys.get(combatant.id).at(-1);
          if (!buckets.has(value)) buckets.set(value, []);
          buckets.get(value).push(combatant);
        }
        for (const bucket of buckets.values()) if (bucket.length > 1) next.push(bucket);
      }
      tied = next;
      depth++;
    }

    // Lexicographic on the nested draws, mapped into a single descending number for Foundry.
    const sorted = [...combatants].sort((a, b) => {
      const ka = keys.get(a.id), kb = keys.get(b.id);
      for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
        const diff = (kb[i] ?? -999) - (ka[i] ?? -999);
        if (diff) return diff;
      }
      return 0;
    });

    const updates = sorted.map((combatant, index) => ({
      _id: combatant.id,
      initiative: sorted.length - index
    }));
    await this.updateEmbeddedDocuments("Combatant", updates);

    const order = sorted.map((c, i) => `${i + 1}. ${c.name} (${keys.get(c.id).join("/")})`);
    await ChatMessage.create({
      content: `<p><strong>Initiative</strong>, drawn from fate:</p><p>${order.join("<br>")}</p>`
        + `<p class="cr-note">Order holds for the whole fight.</p>`
    });

    return this;
  }

  /** One fate draw, as a rank. Alert and Ambusher draw with advantage. */
  async #drawInitiative(combatant) {
    const actor = combatant.actor;
    const deck = deckOf(actor, "fate");
    const discard = deckOf(actor, "fateDiscard");
    if (!deck) return 0;

    await normalizeDeck(deck, allStacks(actor));
    const advantage = CardRPGCombat.#hasInitiativeAdvantage(actor);
    const need = advantage ? 2 : 1;
    if (available(deck).length < need) {
      if (discard?.cards.size) await move(discard, deck, discard.cards.map(c => c.id));
      await deck.shuffle({ chatNotification: false });
    }

    /* Off the top, like every other fate draw [2026-11-22]. **Initiative is a fate draw**, so a
     * Read before the fight aims it -- and a draw that still picked at random here would have been
     * the one place an arranged order was quietly ignored. */
    const drawn = await moveTop(deck, discard, need);
    if (!drawn.length) return 0;

    const rank = CARDRPG.fateValueOf;
    const value = advantage ? Math.max(...drawn.map(rank)) : rank(drawn[0]);

    // Normal fate rules apply: a Miss or Critical shuffles that deck. A Wild does not.
    if (drawn.some(c => CARDRPG.fateSpecials[c.system.special]?.reshuffles)) {
      if (discard?.cards.size) await move(discard, deck, discard.cards.map(c => c.id));
      await deck.shuffle({ chatNotification: false });
    }
    return value;
  }

  static #hasInitiativeAdvantage(actor) {
    if (actor.items.some(i => i.type === "feature" && /initiative/i.test(i.system.text ?? ""))) return true;
    return actor.system.tactics?.includes("ambusher") ?? false;
  }
}

/* -------------------------------------------- */
/*  Rounds                                      */
/* -------------------------------------------- */

/**
 * Start of a round: refill every character's hand, then draw one intent card per NPC type.
 *
 * **The refill is core-rules 3 step 1, and it was never built.**  **[FIXED 2026-11-22]** The
 * round is written as *refill, intent, turns*, and this function did the second and third of
 * those. Drawing was left to a button in the HUD corner, under an argument that said *drawing is
 * the player's own act, because playing a card is what spends the clock and watching your own
 * stamina fall is the point.* That argument is about **playing** cards and was applied to
 * **drawing** them. The deck cycles for free (core-rules 8), so a refill costs nothing, decides
 * nothing, and the click bought the player no choice -- only a fight that began with five empty
 * hands and a rule nobody could find.
 *
 * It matters most in round 1, and that is the case a turn-start refill alone does not cover:
 * **you can react before your first turn**, so a character fourth in the order with no cards is a
 * character who cannot defend themselves for three turns of somebody else's.
 *
 * The acting character is topped up again at the start of their own turn, by `dealTurnHand`; see
 * the note there for what that second fill is for.
 *
 * **[2026-11-12] The draw pile is no longer the clock**, and this comment used to say it was. The
 * deck cycles for free while stamina lasts, so an empty draw pile means only that the discard is
 * about to become one. `system.stamina` is the clock, which is why the HUD shows it.
 *
 * The intent card is drawn face down. Once the first NPC of a type acts it is public knowledge
 * anyway, so it flips automatically -- which is exactly what makes Foresee worth something only
 * when the enemy acts late in the order.
 */
export async function onRoundStart(combat, updateData = null) {
  if (!game.user.isGM) return;

  /*
   * **Ground that has run out goes before anything else happens in the round.**
   *
   * Compared rather than counted: a zone stores the round it lasts THROUGH, so nothing has to tick
   * it and nothing can forget to -- which is the failure the turn marker above was. A zone with no
   * round at all is *all fight*, and what takes those is the fight ending.
   */
  await expireGround(combat.scene ?? canvas?.scene, combat.round ?? 0);

  /* Step 1, for everyone, before the monsters decide anything. The key is the turn that is
   * STARTING, which is also the key the acting figure's own refill will compare against, so the
   * first combatant is not dealt to twice. */
  const starting = turnOf(combat, updateData);
  const at = turnKey(starting.round, starting.index);
  for (const combatant of combat.combatants) {
    if (combatant.actor?.type === "character") await dealTurnHand(combatant.actor, at);
  }

  const lines = [];
  const intents = await drawIntents(combat);
  for (const [kind] of intents) lines.push(`${kind} intent drawn, face down`);

  if (lines.length) {
    await ChatMessage.create({
      content: `<p><strong>Round ${combat.round}</strong></p><p>${lines.join("<br>")}</p>`,
      whisper: ChatMessage.getWhisperRecipients("GM")
    });
  }
}

/**
 * One card per NPC type, not per NPC. Five goblins share one draw, which is why the deck and the
 * intent pile belong to the type and the actors only reference them.
 */
export async function drawIntents(combat) {
  const byKind = new Map();
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || actor.type !== "npc") continue;
    const kind = actor.system.kind || actor.name;
    if (!byKind.has(kind)) byKind.set(kind, actor);
  }

  const drawn = [];
  for (const [kind, actor] of byKind) {
    const deck = deckOf(actor, "action");
    const intent = deckOf(actor, "intent");
    const discard = deckOf(actor, "actionDiscard");
    if (!deck || !intent) continue;

    // Last round's intent is spent before this round's is drawn.
    if (intent.cards.size && discard) {
      await move(intent, discard, intent.cards.map(c => c.id));
    }
    // NPC decks reshuffle when they run out; NPCs don't get exhausted.
    if (!available(deck).length && discard?.cards.size) {
      await move(discard, deck, discard.cards.map(c => c.id));
      await deck.shuffle({ chatNotification: false });
    }

    await normalizeDeck(deck, allStacks(actor));
    const [card] = await moveRandom(deck, intent, 1);
    if (card) {
      await card.update({ face: null });   // face down until the first of its type acts
      await intent.setFlag("cardrpg", "revealed", false);
      drawn.push([kind, card]);
    }
  }
  return drawn;
}

/** Flip a type's intent card. Called automatically when the first NPC of that type acts. */
export async function revealIntent(actor) {
  const intent = deckOf(actor, "intent");
  if (!intent || intent.getFlag("cardrpg", "revealed")) return null;

  const card = intent.cards.contents[0];
  if (!card) return null;

  await card.update({ face: 0 });
  await intent.setFlag("cardrpg", "revealed", true);
  await ChatMessage.create({
    content: `<p><strong>${actor.system.kind || actor.name}</strong> intent revealed: `
      + `<em>${card.name}</em></p>`
  });
  return card;
}

/* -------------------------------------------- */
/*  Turns                                       */
/* -------------------------------------------- */

/**
 * Start of a turn, for the combatant whose turn it is:
 *
 *  - Block clears, because a Defend primary holds only until the start of your next turn.
 *  - Conditions created by the combatant whose turn just **ended** tick down. That is the unusual
 *    part, and it is unusual twice over: a condition ticks on its CREATOR's clock rather than its
 *    victim's, and it ticks at the END of that turn rather than the start.
 *  - Numeric recharges count down, on the acting combatant's own turn.
 *  - An NPC reveals its type's intent card, since the moment it acts the card is public anyway.
 *
 * **Why the end and not the start.** `duration: 1` used to mean *through the turn after this one*,
 * which expired before the creator could act on it: a brute set a target Exposed and the Exposed
 * was gone by the time the brute swung again, so the setup could only ever be collected by
 * somebody else. Of the 24 creatures with `brute`, two run in packs -- the card's working audience
 * was two creatures, and the comment on it claimed the opposite. `duration: 1` now means *through
 * my next turn*: it starts when the creator's turn ends and stops when their next one does, and
 * the creature that spent a turn setting something up is the one who gets to use it.
 */
/**
 * **Whose turn a combat hook is announcing.** One answer, in one place.
 *
 * **[FOUND 2026-11-16] Foundry's turn hooks lie about the turn.** Inside `combatTurn`,
 * `combat.turn` and `combat.combatant` are still the turn that just **ended** -- the hook runs
 * from `_onUpdate` and the turn that is starting arrives in `updateData`. Measured in a browser
 * rather than argued:
 *
 *     combat.turn=0   updateData.turn=1   combatant=Starter Warrior   turnDoneBefore=1:0
 *
 * This project got that wrong twice, independently, which is why the answer is a function and not
 * a line of code in each caller:
 *
 * - `CardRPGTray.autoOpen` moved a GM's HUD to the acting combatant and moved it one turn late,
 *   for ever. A table reported it as *there is no way to attack as a goblin*.
 * - `onTurnStart` built its once-per-turn marker as `round:turn` from the stale turn, got a marker
 *   it had already written, and **returned without doing anything at all**. So on most turns Block
 *   was never cleared, recharges never ticked, an NPC never revealed its intent, conditions never
 *   expired, and **Burning and Poisoned never took a point of Health from anybody.**
 *
 * The second of those is the whole of core-rules 7's timed damage, silently absent, with every
 * one of its own unit checks passing -- because every one of them asked the function, and the
 * function was never reached.
 *
 * **It can be overridden.** `cardrpgTurnOf` is called with the answer before it is returned, so a
 * module that reorders initiative, runs two creatures on one turn, or hands a turn to something
 * that is not a combatant can write its own answer in rather than monkey-patching the callers.
 * The seam is here and not in each caller for the same reason the answer is.
 *
 * @param {Combat} combat
 * @param {object|null} updateData the hook's second argument, when there is one
 * @returns {{index: number|null, round: number|null, combatant: object|null, actor: object|null}}
 */
export function turnOf(combat, updateData = null) {
  const empty = { index: null, round: null, combatant: null, actor: null };
  if (!combat) return empty;
  /*
   * The update wins where it has an answer, and only where it has one: `ready` and `canvasReady`
   * have no update to offer and nothing is mid-change when they run, so the combat is right for
   * them -- which is exactly the case a fix written as *always use updateData* would break.
   */
  const index = Number.isInteger(updateData?.turn) ? updateData.turn : combat.turn;
  const round = Number.isInteger(updateData?.round) ? updateData.round : combat.round;
  const combatant = (Number.isInteger(index) ? combat.turns?.[index] : null)
    ?? combat.combatant ?? null;
  const answer = {
    index: Number.isInteger(index) ? index : null,
    round: Number.isInteger(round) ? round : null,
    combatant,
    actor: combatant?.actor ?? null
  };
  Hooks.callAll("cardrpgTurnOf", combat, updateData, answer);
  return answer;
}

/**
 * **The key a once-per-turn marker is written under.**  **[BUILT 2026-11-22]**
 *
 * `onTurnStart` has written `round:turn` into a combat flag since the day it learned to run once
 * per turn, and the tray has spelled the same string for the action deck's *already dealt this
 * turn*. While nothing compared the two, two spellings cost nothing. **They are compared now**:
 * the turn deals the hand, and the deck corner greys itself out by reading the marker the deal
 * wrote. Two files agreeing on a format by coincidence is the defect this project has a dozen
 * notes about, so the format is a function.
 *
 * It takes the round and the index rather than the combat, because the one caller that matters
 * most cannot use the combat: inside a turn hook, `combat.turn` is still the turn that ENDED
 * (see `turnOf`), and a key built from it would mark the wrong turn for ever.
 */
export function turnKey(round, index) {
  return round === null || round === undefined ? "no-combat" : `${round}:${index}`;
}

export async function onTurnStart(combat, updateData = null) {
  if (!game.user.isGM) return;
  const { actor, index, round } = turnOf(combat, updateData);
  if (!actor) return;

  /*
   * **Once per turn, whichever hook announced it.**
   *
   * Foundry fires `combatRound` for a round advance and `combatTurn` for a step inside one, and
   * for a long time only the second of those did this work -- so the **first combatant of every
   * round after the first** never had their Block cleared, never ticked a recharge, and never had
   * their conditions ticked. A condition created by whoever leads the order could not expire. Both
   * hooks call this now, and this marker is what makes that safe: if a build ever fires both for
   * one transition, the second call does nothing rather than ticking everything twice.
   */
  const at = turnKey(round, index);
  if (combat.getFlag("cardrpg", "turnDone") === at) return;
  await combat.setFlag("cardrpg", "turnDone", at);

  await actor.update({ "system.block": 0, "system.blockPersists": false });

  /* The turn that just finished is the clock that just ran, so the tick belongs to that actor and
   * not to the one about to play. On the first turn of a fight there is nothing behind us. */
  const ended = turnJustEnded(combat, index, round);
  if (ended?.actor) await tickConditionsCreatedBy(combat, ended.actor, ended.round);
  await tickRecharges(actor);
  /* And anything this figure booked for a later turn, on the same beat as everything else that
   * waits: one of their turns has started, so one comes off the count. See `bookDelayed`. */
  await resolveDue(actor);

  if (actor.type === "npc") await revealIntent(actor);
  /* And a character's hand comes up to size, because every turn starts that way. */
  else await dealTurnHand(actor, at);

  /*
   * **The ground renews what it imposes, before anything reads the conditions.**  [2026-11-16]
   * Phase 2. Stand in the Standing Flood and you are Wet again this turn; walk out and it is gone
   * by your next one, because a zone's condition lasts a round and is refreshed by standing there.
   * It goes above the bite so a zone that both soaks and burns is read once, in the right order.
   */
  await imposeGround(actor);

  /*
   * Conditions that bite at the start of your turn -- Burning and Poisoned -- each for their own
   * value, defaulting to 1 when nothing printed one (core-rules 7). They meet neither armor nor
   * Block, which is why their bands are tight, and they add: a man on fire and poisoned takes both.
   *
   * Driven off the `damagePerTurn` flag rather than by key, so a third one needs no code here.
   *
   * **And the ground underfoot, which bites at the same moment and for the same reasons.**
   * [2026-11-16] *The Sphere Entire* is *difficult ground, cover, and 2 damage at the start of
   * your turn*, and that last clause is this. It ADDS to a condition rather than replacing it --
   * a man on fire standing in fire takes both -- but two overlapping zones give the larger and not
   * the sum, which `groundAt` decides: standing where two fires meet is standing in a fire.
   */
  const bites = (actor.system.activeConditions ?? [])
    .filter(c => CARDRPG.conditions[c.key]?.damagePerTurn);
  const underfoot = groundFor(actor).damage ?? 0;
  const damage = bites.reduce((n, c) => n + (c.value ?? 1), 0) + underfoot;
  if (damage > 0) {
    const before = actor.system.health.value;
    await actor.update({ "system.health.value": Math.max(0, before - damage) });
    /*
     * **Burning to death is dropping to 0**, which is the second of core-rules 8's two Wound
     * events. The first one -- five or more from a single hit -- cannot fire here and should not:
     * a tick is not a hit, it meets neither armor nor Block, and its bands are tight because of
     * that. So a tick wounds only by finishing you.
     */
    if (before - damage <= 0) await resolveWound(actor, { reason: DROPPED });
  }
}

/**
 * **And the acting figure is topped up at the start of their own turn.**  **[BUILT 2026-11-22]**
 *
 * The round already refilled everybody (above). This is the **second** fill, and what it covers
 * is the cards spent since: reactions, mostly, which is the one way a hand empties on somebody
 * else's turn.
 *
 * **It is a change to the written rule, and worth stating as one.**  **[RULED 2026-11-22]**
 * core-rules 3 refills once, at the top of the round, so a player who reacted three times before
 * their turn acted with two cards -- and a player who reacted three times *after* their turn
 * acted with five. The same spending, a different price, decided by where initiative put them.
 * A fill at the top of each figure's own turn puts the refill at the same point in everybody's
 * personal cycle, which is what the round-start version was reaching for.
 *
 * **What it costs is a real cost**: reactions before your turn no longer thin the hand you act
 * with, so a reaction is paid for in stamina and in the card itself rather than in what you can
 * do next. That is the trade, written down so it can be reversed by deleting one line if the
 * table finds reactions too cheap.
 *
 * **The button stays, and it is not redundant.** Out of combat there is no turn to start, so a
 * scene still deals from the corner; a hand thinned mid-turn by Strain can still be topped up.
 * What it is no longer is the only way to get cards.
 *
 * **Idempotent on the key**, which is what lets the round and the turn both call it: the first
 * figure in the order is refilled by the round under the same key its own turn would use, so the
 * second call does nothing rather than re-reading every pile to draw zero cards.
 *
 * **The marker moved onto the actor.** `dealtAt` was a field on the tray -- one client's memory
 * of what that client had clicked -- and the deal happens on the GM's machine now, for somebody
 * else's character. A flag on the actor is the one answer every client reads, so the corner greys
 * out on the player's screen for the turn their hand arrived on instead of inviting a second deal
 * that would draw nothing.
 *
 * @param {Actor} actor the character whose turn is starting
 * @param {string} at the turn's key, from `turnKey` -- the SAME string the tray compares against
 */
export async function dealTurnHand(actor, at) {
  if (!actor || actor.type !== "character") return null;
  if (actor.getFlag("cardrpg", "dealtAt") === at) return null;

  const result = await refill(actor, { handlers: { rage: applyRage } });
  await actor.setFlag("cardrpg", "dealtAt", at);

  /*
   * Said only when the deck could not fill the hand, and asked of the HAND rather than of what
   * was drawn -- `handShort` is the predicate, shared with the deck button so the two cannot
   * disagree about what being short means.
   */
  const missing = handShort(actor, result.short);
  if (missing) {
    await ChatMessage.create({
      content: `<div class="cardrpg"><p><strong>${actor.name}</strong> draws, and the deck runs `
        + `out: <strong>${missing}</strong> short of a full hand. Catch Breath buys the stamina `
        + `that lets the discard cycle back.</p></div>`,
      whisper: ChatMessage.getWhisperRecipients("GM")
    });
  }
  return result;
}

/**
 * **Whose turn just ended, and which round it ended in.**
 *
 * Derived from the order rather than read off `combat.previous`: the combatant one step back from
 * the current index IS the one who just finished, and at a round boundary the modular step takes
 * the last combatant of the previous round, which is the right answer and the case a hand-rolled
 * `turn - 1` gets wrong.
 *
 * The round matters as much as the actor. A creator who acts last in the order sees `combat.round`
 * increment before this runs, so a tick that compared against the CURRENT round would tick a
 * condition on the very turn it was applied -- for exactly the creatures at the bottom of the
 * order and no others, which is the kind of bug that reads as bad luck for a month.
 */
function turnJustEnded(combat, index = null, round = null) {
  const turns = combat.turns ?? [];
  /* The index the hook announced, not the one the combat still reports: see `turnOf`. */
  const at = Number.isInteger(index) ? index : combat.turn;
  if (!turns.length || at === null || at === undefined) return null;
  const wrapped = at === 0;
  // Nothing has ended yet on the first turn of the first round.
  const now = Number.isInteger(round) ? round : (combat.round ?? 0);
  if (wrapped && now <= 1) return null;
  const combatant = turns[(at - 1 + turns.length) % turns.length];
  return { actor: combatant?.actor ?? null, round: now - (wrapped ? 1 : 0) };
}

/** Tick every condition whose creator is this actor, wherever the victim sits in the order. */
async function tickConditionsCreatedBy(combat, creator, endedRound) {
  for (const combatant of combat.combatants) {
    const victim = combatant.actor;
    if (!victim) continue;

    const stored = victim.system.toObject().conditions ?? [];
    if (!stored.length) continue;

    const kept = [];
    let changed = false;
    for (const condition of stored) {
      const cfg = CARDRPG.conditions[condition.key] ?? {};
      if (cfg.noDuration || condition.duration === null) { kept.push(condition); continue; }

      // Its own creator's turn, or the victim's own turn if the creator has left the fight.
      const creatorGone = condition.creatorId
        && !combat.combatants.some(c => c.actor?.id === condition.creatorId);
      const mine = condition.creatorId === creator.id
        || (!condition.creatorId && victim.id === creator.id)
        || (creatorGone && victim.id === creator.id);

      if (!mine) { kept.push(condition); continue; }
      /*
       * **Not on the turn it was applied.** The duration starts when the creator's turn ends, and
       * the turn it was applied on is a turn that ends -- so without this a `duration: 1` would
       * tick the instant it landed and nobody, creator or ally, would ever see it in play.
       */
      if (condition.round !== null && condition.round !== undefined
        && condition.round === endedRound) { kept.push(condition); continue; }

      const duration = condition.duration - 1;
      changed = true;
      if (duration > 0) kept.push({ ...condition, duration });
    }

    if (changed) await victim.update({ "system.conditions": kept });
  }
}

/** A numeric recharge counts the owner's own turns. */
async function tickRecharges(actor) {
  for (const slate of actor.items) {
    if (!slate.system.drained || slate.system.drainedFor === null) continue;
    const left = slate.system.drainedFor - 1;
    await slate.update(left > 0
      ? { "system.drainedFor": left }
      : { "system.drained": false, "system.drainedFor": null });
  }
}

/* -------------------------------------------- */
/*  Going down                                  */
/* -------------------------------------------- */

/**
 * **Foundry's own skull**, by its status id, rather than a picture of one.  [2026-11-22]
 *
 * `dead` is in `CONFIG.statusEffects` in every Foundry install, it draws `icons/svg/skull.svg`,
 * and as an **overlay** it is drawn across the whole token instead of as one of the little
 * corner badges. Using it means the mark survives a token being dragged, copied or re-linked, it
 * can be taken off by hand from the token HUD, and a module that restyles conditions restyles
 * this one too -- none of which is true of a sprite this system would have to draw itself.
 */
const DOWNED_STATUS = "dead";

/**
 * **Dropping to 0 takes you off the board and out of the order.**  **[BUILT 2026-11-22]**
 *
 * Three things used to happen when a character hit 0 Health -- a Wound card, an injury draw, and
 * a health value of zero -- and **not one of them was visible on the map.** The figure stood
 * there in the order, with a turn coming round, looking exactly like a figure that could act. A
 * GM running five goblins had nothing to read but the numbers in a tracker.
 *
 * So: the skull goes over the token, and the combatant leaves the fight.
 *
 * **Leaving the fight is the part worth arguing about**, because it is not reversible by itself.
 * A healed character does not walk back into the initiative order -- somebody has to put them
 * there, and `rollInitiative` draws them a new place when they do. That is the honest model: a
 * character who was out and is now up has not been waiting their turn, and core-rules 3 draws the
 * order once per fight precisely so that the order is a fact about the fight rather than a queue
 * that is edited. The alternative -- marking them defeated and leaving them in the list -- keeps
 * a figure in the order whose every turn is skipped, which is the thing the GM was already having
 * to remember.
 *
 * Matched by **uuid and not by id**: an unlinked token's actor is a synthetic document carrying
 * the base actor's id, so five unlinked goblins all answer to one id and one of them dropping
 * would have deleted the lot. A uuid names the token.
 */
export async function markDown(actor) {
  if (!actor) return false;

  let marked = false;
  if (!actor.statuses?.has(DOWNED_STATUS)) {
    if (CONFIG.statusEffects?.some(e => e.id === DOWNED_STATUS)) {
      await actor.toggleStatusEffect(DOWNED_STATUS, { active: true, overlay: true });
      marked = true;
    } else {
      console.warn(`Card RPG | no "${DOWNED_STATUS}" status effect to mark ${actor.name} with`);
    }
  }

  /*
   * **The place is kept, because they are coming back to it.**  **[RULED 2026-11-22]**
   *
   * The first version of this said a healed character does not walk back into the order, and
   * argued it: the order is drawn once and holds for the whole fight (core-rules 3), so a figure
   * who was out has not been waiting their turn. **That was the wrong end of the same rule.** An
   * order that holds for the whole fight is exactly what says their place is still theirs --
   * they did not leave the fight, they stopped being able to act in it -- and the alternative
   * put the GM in the middle of every revival, re-adding a token and settling where it goes,
   * which is bookkeeping the engine already has the answer to.
   *
   * So what is remembered is the **whole place**: the combat, the token, and the initiative they
   * drew. Not a new draw on the way back in -- a second draw would be a second order, and the
   * one thing core-rules 3 insists on is that there is one.
   */
  const left = [];
  for (const combat of game.combats ?? []) {
    const mine = combat.combatants.filter(c => c.actor?.uuid === actor.uuid);
    if (!mine.length) continue;
    for (const c of mine) {
      left.push({
        combatId: combat.id, tokenId: c.tokenId, sceneId: c.sceneId, actorId: c.actorId,
        initiative: c.initiative, hidden: c.hidden
      });
    }
    await combat.deleteEmbeddedDocuments("Combatant", mine.map(c => c.id));
  }
  /* Only when there is something to remember: called twice on a figure already down, the second
   * call must not overwrite the place with an empty list. */
  if (left.length) await actor.setFlag("cardrpg", "downedFrom", left);

  if (marked || left.length) {
    await ChatMessage.create({
      content: `<div class="cardrpg"><p><strong>${actor.name}</strong> is down`
        + (left.length ? ", and out of the fight" : "")
        + `. Unconscious until treated; healing above 0 stands them up and puts them back `
        + `where they were in the order.</p></div>`
    });
  }
  return marked || left.length > 0;
}

/**
 * **Back above 0: the skull comes off and the figure goes back where it was.**
 * **[CHANGED 2026-11-22]**
 *
 * At the place it drew, with the initiative it drew, and with no second draw: core-rules 3 draws
 * the order once for the whole fight, so coming back into it is a restoration rather than an
 * entrance. A fight that has since ended leaves nothing to go back to, and the memory of the
 * place is dropped rather than kept against a fight that will never run again.
 *
 * Cheap when there is nothing to do, which it has to be: this runs on **every** write that
 * leaves an actor above 0 Health, which is most writes in the game.
 */
export async function standUp(actor) {
  if (!actor) return false;

  let stood = false;
  if (actor.statuses?.has(DOWNED_STATUS)) {
    await actor.toggleStatusEffect(DOWNED_STATUS, { active: false, overlay: true });
    stood = true;
  }

  const places = actor.getFlag("cardrpg", "downedFrom") ?? [];
  if (!places.length) return stood;

  const back = [];
  for (const place of places) {
    const combat = game.combats?.get(place.combatId);
    if (!combat) continue;
    /* Already there is already right: a GM who put them back by hand has settled it. */
    if (combat.combatants.some(c => c.actor?.uuid === actor.uuid)) continue;
    await combat.createEmbeddedDocuments("Combatant", [{
      tokenId: place.tokenId, sceneId: place.sceneId, actorId: place.actorId,
      initiative: place.initiative, hidden: place.hidden
    }]);
    back.push(combat);
  }
  await actor.unsetFlag("cardrpg", "downedFrom");

  if (back.length) {
    await ChatMessage.create({
      content: `<div class="cardrpg"><p><strong>${actor.name}</strong> is back on their feet, `
        + `and back in the order at the place they drew.</p></div>`
    });
  }
  return stood || back.length > 0;
}

/**
 * **One gate, read off the number rather than off the blow.**
 *
 * Health is written in eleven places -- a hit, a burn, a tick of ground, a fast Taint, the price
 * of a spell, a heal, a rest, and a GM typing into the sheet. Hanging the skull off `resolveWound`
 * would catch the ones that go through the Wound gate and miss the sheet entirely, and hanging it
 * off each writer is eleven copies with a twelfth added later and missed. **The number is the
 * fact**, so the number is what is watched.
 *
 * It is idempotent in both directions, which is what lets it be driven by *any* write: marking a
 * token that already wears the skull does nothing, and deleting combatants that are already gone
 * is an empty list.
 */
export async function onHealthChanged(actor, changed = {}) {
  if (!game.user.isGM) return;
  if (!foundry.utils.hasProperty(changed, "system.health.value")) return;
  if ((actor.system.health?.value ?? 1) <= 0) await markDown(actor);
  else await standUp(actor);
}

/* -------------------------------------------- */
/*  End of combat                               */
/* -------------------------------------------- */

/** Boundary recharges tied to the end of a fight, and the hand and discard going back. */
export async function onCombatEnd(combat) {
  if (!game.user.isGM) return;
  /* Including the ones that said *all fight*, which is this and not a round comparison. */
  await clearGround(combat.scene ?? canvas?.scene);
  const { afterCombat } = await import("./decks.mjs");

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor) continue;

    for (const slate of actor.items) {
      if (slate.system.drained && slate.system.active?.boundary === "combat") {
        await slate.update({ "system.drained": false, "system.drainedFor": null });
      }
    }

    // Conditions with a duration don't survive the fight.
    const lasting = (actor.system.toObject().conditions ?? [])
      .filter(c => CARDRPG.conditions[c.key]?.noDuration);
    await actor.update({ "system.conditions": lasting });

    /* Nor does anything booked for a turn that is never coming. A grove due in two turns when the
     * last enemy fell is not a grove the next fight owes anybody. */
    await clearDue(actor);

    if (actor.type === "character") await afterCombat(actor);
  }
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

export function registerCombatHooks() {
  /* A round advance is a turn start as well, and only one of these two hooks fires for it: the
   * first combatant of round 3 is as much a turn start as the second combatant of round 2. Intents
   * are drawn first, because the turn start is what reveals the acting NPC's. */
  /* Every one of these hands the turn that is STARTING over in `updateData`, and the combat
   * itself still reports the one that ended. All three pass it on; `turnOf` is the one reader. */
  Hooks.on("combatRound", async (combat, updateData) => {
    await onRoundStart(combat, updateData);
    await onTurnStart(combat, updateData);
  });
  Hooks.on("combatTurn", (combat, updateData) => onTurnStart(combat, updateData));
  Hooks.on("combatStart", async (combat, updateData) => {
    await onRoundStart(combat, updateData);
    await onTurnStart(combat, updateData);
  });
  Hooks.on("deleteCombat", combat => onCombatEnd(combat));
  /* Dropping to 0 is a fact about a number, so it is watched where the number is written. */
  Hooks.on("updateActor", (actor, changed) => onHealthChanged(actor, changed));
}
