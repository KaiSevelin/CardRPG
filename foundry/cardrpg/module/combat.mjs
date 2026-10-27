/**
 * Combat: individual initiative, intent cards, and condition ticking.
 *
 * Three rules shape this and none of them are Foundry's defaults:
 *
 *  - Initiative is **drawn, not rolled**, once per fight, from each combatant's own fate deck, and
 *    ties are redrawn until the order settles (core-rules 3).
 *  - One card is drawn per NPC **type** per round, face down, and every NPC of that type acts on it
 *    at its own place in the order. So the draw and the acting are separate steps.
 *  - A condition's duration ticks at the start of its **creator's** turn, not the victim's.
 */

import { CARDRPG } from "./config.mjs";
import { deckOf, moveRandom, move, refill, normalizeDeck } from "./decks.mjs";

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

    await normalizeDeck(deck);
    const advantage = CardRPGCombat.#hasInitiativeAdvantage(actor);
    const need = advantage ? 2 : 1;
    if (deck.cards.size < need) {
      if (discard?.cards.size) await move(discard, deck, discard.cards.map(c => c.id));
      await deck.shuffle({ chatNotification: false });
    }

    const drawn = await moveRandom(deck, discard, need);
    if (!drawn.length) return 0;

    const rank = card => card.system.special ? CARDRPG.fateRank[card.system.special] : card.system.value;
    const value = advantage ? Math.max(...drawn.map(rank)) : rank(drawn[0]);

    // Normal fate rules apply: a Miss or Critical shuffles that deck.
    if (drawn.some(c => c.system.special)) {
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
 * Start of a round: refill every player hand, then draw one intent card per NPC type.
 *
 * The intent card is drawn face down. Once the first NPC of a type acts it is public knowledge
 * anyway, so it flips automatically -- which is exactly what makes Foresee worth something only
 * when the enemy acts late in the order.
 */
export async function onRoundStart(combat) {
  if (!game.user.isGM) return;

  const lines = [];

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || actor.type !== "character") continue;
    const { drawn, taint } = await refill(actor);
    if (drawn || taint) lines.push(`${actor.name} draws ${drawn}${taint ? ` (${taint} Taint)` : ""}`);
  }

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
    if (!deck.cards.size && discard?.cards.size) {
      await move(discard, deck, discard.cards.map(c => c.id));
      await deck.shuffle({ chatNotification: false });
    }

    await normalizeDeck(deck);
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
 *  - Conditions **this combatant created** tick down. That is the unusual part: a condition ticks
 *    on its creator's turn, which is what makes a duration-1 condition cost the victim exactly one
 *    turn wherever the creator sits in the order.
 *  - Numeric recharges count down, using the same tick.
 *  - An NPC reveals its type's intent card, since the moment it acts the card is public anyway.
 */
export async function onTurnStart(combat) {
  if (!game.user.isGM) return;
  const actor = combat.combatant?.actor;
  if (!actor) return;

  await actor.update({ "system.block": 0, "system.blockPersists": false });

  await tickConditionsCreatedBy(combat, actor);
  await tickRecharges(actor);

  if (actor.type === "npc") await revealIntent(actor);

  // Burning: 1 damage at the start of your turn.
  if (actor.system.activeConditions?.some(c => c.key === "burning")) {
    await actor.update({ "system.health.value": Math.max(0, actor.system.health.value - 1) });
  }
}

/** Tick every condition whose creator is this actor, wherever the victim sits in the order. */
async function tickConditionsCreatedBy(combat, creator) {
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
/*  End of combat                               */
/* -------------------------------------------- */

/** Boundary recharges tied to the end of a fight, and the hand and discard going back. */
export async function onCombatEnd(combat) {
  if (!game.user.isGM) return;
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

    if (actor.type === "character") await afterCombat(actor);
  }
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

export function registerCombatHooks() {
  Hooks.on("combatRound", combat => onRoundStart(combat));
  Hooks.on("combatTurn", combat => onTurnStart(combat));
  Hooks.on("combatStart", async combat => {
    await onRoundStart(combat);
    await onTurnStart(combat);
  });
  Hooks.on("deleteCombat", combat => onCombatEnd(combat));
}
