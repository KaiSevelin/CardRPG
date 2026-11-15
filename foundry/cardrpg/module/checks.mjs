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

import { CARDRPG } from "./config.mjs";
import { deckOf, move, dealSkillHand } from "./decks.mjs";

/** Where a call lives. One per scene, because one obstacle is in front of the party at a time. */
const FLAG = "call";

/**
 * Where the twist debts live.
 *
 * **One boolean could not hold a group check.**  [BUILT 2026-11-15] A twist used to be owed by
 * the challenge -- `owed: true` -- which can record that *somebody* owes one and not who, and
 * only inside a challenge. The moment several characters answer one call that is wrong twice
 * over: three of five may fail, each failure is a different person's problem, and none of it
 * happens inside a challenge unless the GM started one.
 *
 * So the debt is a list on the scene, each entry naming the character who incurred it. The twist
 * that pays it says whose it was, which is the whole point: a card drawn into the middle of a
 * group check with no name on it is a cost nobody can place.
 */
const DEBTS = "twistDebts";

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
    /*
     * **A call may name several approaches.**  [2026-11-15] One obstacle often has more than one
     * honest answer: a stuck door yields to Might or to Agility, and a single-approach call made
     * the GM pick which of the two the fiction allowed before anybody had said how they were
     * doing it. An empty list is the old "any".
     */
    approaches: approachList(call.approaches ?? call.approach),
    dc: Number(call.dc) || CARDRPG.difficulties.normal,
    mode: Number(call.mode) || 0,
    note: String(call.note ?? ""),
    /*
     * **Who the call is addressed to**, as actor ids, empty for "whoever is holding a card".
     *
     * A call used to be addressed to the room, which is right for one obstacle in front of one
     * party and wrong for every shape of check that names people: a group check is a call made of
     * several characters, and an opposed one has a second side. Recording the cast on the call is
     * what lets the banner say who is answering and the panel count how many still owe a card.
     */
    who: Array.isArray(call.who) ? call.who.filter(id => typeof id === "string") : [],
    scene: scene.id
  };
}

/** The named cast of a call or a challenge, as actors, skipping any that have been deleted. */
export function castOf(ids) {
  return (ids ?? []).map(id => game.actors?.get(id)).filter(Boolean);
}

/** ...and as one line of names, for a banner or a chat record. */
export function describeCast(ids) {
  const names = castOf(ids).map(a => a.name);
  return names.length ? names.join(", ") : "";
}

/**
 * The approaches a call will accept, cleaned.
 *
 * One reader for a value that arrives from three places: a stored flag written by an older
 * build, the board's checkboxes, and the `@Check` enricher's word list. Empty means any.
 */
export function approachList(value) {
  const list = (Array.isArray(value) ? value : [value])
    .filter(a => typeof a === "string" && a && a !== "any" && a in CARDRPG.approaches);
  return [...new Set(list)];
}

/** Set the call. GM only: it is the GM's half of the step. */
export async function setCall({ approaches = [], dc, mode = 0, note = "", who = [] } = {}) {
  const scene = game.scenes?.active;
  if (!game.user.isGM || !scene) return null;
  await scene.setFlag("cardrpg", FLAG, {
    approaches: approachList(approaches),
    dc: Number(dc) || CARDRPG.difficulties.normal, mode: Number(mode) || 0, note,
    who: (who ?? []).filter(id => typeof id === "string")
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
  /* The obstacle is gone, so what it cost is gone with it: a twist owed for a wall the party
   * walked away from is a button left lit over a scene that has moved on. */
  await forgiveDebts();
}

/* -------------------------------------------- */
/*  Who owes a twist                            */
/* -------------------------------------------- */

/** Every debt standing on this scene, oldest first. */
export function readDebts() {
  const scene = game.scenes?.active ?? null;
  const list = scene?.getFlag?.("cardrpg", DEBTS);
  if (!Array.isArray(list)) return [];
  return list
    .filter(d => d && typeof d.actor === "string")
    .map(d => ({
      actor: d.actor,
      name: String(d.name ?? ""),
      kind: d.kind === "fail" ? "fail" : "partial"
    }));
}

/**
 * Record one, deduplicated by character.
 *
 * **One debt per person per call**, and a Fail outranks a Partial. A character who answers the
 * same obstacle twice and comes up short twice has not earned two twists: skill-rules 4 is about
 * a cost that fits the fiction, and the same person paying twice for one obstacle is a tax rather
 * than a consequence. The worse of the two results is the one that stands.
 */
export async function oweTwist({ actor, name, kind }) {
  const scene = game.scenes?.active;
  if (!game.user.isGM || !scene || !actor) return null;
  const debts = readDebts();
  const already = debts.find(d => d.actor === actor);
  if (already) {
    if (already.kind === "fail" || kind !== "fail") return debts;
    already.kind = "fail";
  } else {
    debts.push({ actor, name: String(name ?? ""), kind: kind === "fail" ? "fail" : "partial" });
  }
  await scene.setFlag("cardrpg", DEBTS, debts);
  return debts;
}

/** Strike some debts off, or all of them when given nothing. */
export async function forgiveDebts(actorIds = null) {
  const scene = game.scenes?.active;
  if (!game.user.isGM || !scene) return;
  if (!actorIds) return void await scene.unsetFlag("cardrpg", DEBTS);
  const keep = readDebts().filter(d => !actorIds.includes(d.actor));
  if (keep.length) await scene.setFlag("cardrpg", DEBTS, keep);
  else await scene.unsetFlag("cardrpg", DEBTS);
}

/**
 * The debts as **at most two** things to draw for.
 *
 * Five characters answering one call can fail five times, and five twists is five consequences
 * narrated back to back over one wall: the deck would be doing the GM's job badly and at length.
 * So a group check pays twice at most -- **the worst single result draws its own, and everybody
 * else collapses into one shared cost** -- and the cap lives here rather than in the GM's
 * self-restraint, because the panel can only offer what this returns.
 *
 * A Fail outranks a Partial for which one is "the worst", since that is the ordering the result
 * table already uses.
 */
export function twistQueue() {
  const debts = readDebts();
  if (!debts.length) return [];
  const rank = d => (d.kind === "fail" ? 0 : 1);
  const sorted = [...debts].sort((a, b) => rank(a) - rank(b));
  const [worst, ...rest] = sorted;

  const entry = (list, label) => ({
    ids: list.map(d => d.actor),
    label,
    kind: list.some(d => d.kind === "fail") ? "fail" : "partial",
    shared: list.length > 1
  });

  const out = [entry([worst], worst.name || game.i18n.localize("CARDRPG.Twist.Someone"))];
  if (rest.length) {
    const names = rest.map(d => d.name).filter(Boolean);
    const label = names.length > 2
      ? `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`
      : names.join(" and ");
    out.push(entry(rest, label || game.i18n.localize("CARDRPG.Twist.TheRest")));
  }
  return out;
}

/** How a call reads in one line, for the banner and for a chat record. */
export function describeCall(call) {
  if (!call) return "";
  const name = Object.entries(CARDRPG.difficulties)
    .find(([, dc]) => dc === call.dc)?.[0] ?? "";
  /* "Might or Agility", because that is what the GM said and what the player has to choose
   * between. The separator is a word rather than a comma: a list reads as a requirement. */
  const approach = call.approaches.length
    ? call.approaches
      .map(a => game.i18n.localize(CARDRPG.approaches[a]?.label ?? a))
      .join(` ${game.i18n.localize("CARDRPG.Check.Or")} `)
    : game.i18n.localize("CARDRPG.Check.AnyApproach");
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
  if (!call || !call.approaches.length) return (card.system?.value ?? 0) >= 0;
  /* Any ONE of them is enough: the call is a list of ways in, not a list of requirements. */
  return call.approaches.some(a => !!card.system?.serves?.(a));
}

/**
 * The best equipped tool for this approach, or null.
 *
 * **Offered first rather than chosen**, which is a correction.  [2026-11-15]
 *
 * This used to pre-select it, and the comment that justified it conceded the whole case against
 * it in its own last sentence: *a tool's bonus is situational -- `Shadow +2 (locks and
 * mechanisms)` is not a bonus to every Shadow check, and only the table can say whether this is
 * a lock.* A modifier that defaults to ON is a modifier that gets applied, because clearing it
 * requires noticing it, and the player holding the tool is the last person who will.
 *
 * It read worst on the plainest case: a **Climbing Rope** is `Might +2 (climbing)`, and
 * every Might check in the game -- shoving a stuck door, holding a portcullis, breaking a
 * cart axle -- came pre-loaded with two points of rope.
 *
 * So this now decides what to offer FIRST, and the dialog defaults to no tool. It is the same
 * arrangement the training claim is under, for the same reason: the engine knows what you are
 * carrying and only the table knows whether it helps here.
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

/* -------------------------------------------- */
/*  What the party notices                      */
/* -------------------------------------------- */

/**
 * The passive scores of everybody at the table, for the GM.
 *
 * **The point of this is to delete checks, not to speed them up.** skill-rules 2 says *only make a
 * check when failure would be interesting*, and a passive score settles a great many obstacles
 * before anybody reaches for a card: a party whose best Wits is 6 simply notices a Normal 5. The
 * function `passiveScore` has existed since the skill side was built and **nothing has ever shown
 * it to the person who needs it**, which is the same shape of omission as a reward nobody could
 * see -- the arithmetic was there and the answer was not.
 *
 * **One row per approach rather than a grid.** Six numbers times four characters is twenty-four
 * numbers to scan mid-sentence, and the question is always *does anyone notice* -- so the party's
 * best and who holds it is the answer, and the grid is behind a fold for when it matters who else
 * could try.
 *
 * **Who counts: whoever has a token on the active scene**, because that is the party in front of
 * the GM. A scene with no tokens falls back to every character in the world, since an empty panel
 * is less useful than a long one and a GM reading this before the session starts is a real case.
 */
export function partyPassives(scoreOf) {
  const scene = game.scenes?.active ?? null;
  const onScene = (scene?.tokens?.contents ?? [])
    .map(t => t.actor).filter(a => a?.type === "character");
  const seen = new Map();
  for (const actor of onScene) seen.set(actor.id, actor);
  const party = seen.size ? [...seen.values()]
    : (game.actors?.filter(a => a.type === "character") ?? []);

  const rows = Object.entries(CARDRPG.approaches)
    .filter(([key]) => key !== "any")
    .map(([key, cfg]) => {
      const scores = party.map(actor => ({ actor, score: scoreOf(actor, key) }))
        .sort((a, b) => b.score - a.score || a.actor.name.localeCompare(b.actor.name));
      const best = scores[0] ?? null;
      return {
        key,
        label: game.i18n.localize(cfg.label ?? key),
        icon: cfg.icon,
        best: best?.score ?? 0,
        who: best?.actor?.name ?? "",
        /* Everyone, so the fold can say who else could be asked. */
        all: scores.map(s => ({ name: s.actor.name, score: s.score }))
      };
    });
  return { party: party.map(a => a.name), fromScene: !!seen.size, rows };
}

/**
 * How a passive reads against the call in front of the party.
 *
 * Three states, and the middle one is the only one that needs a check at all:
 *
 *   - **over** -- the passive already meets the difficulty, so it happens. No card, no fate.
 *   - **close** -- a card could carry it, so this is a check worth making.
 *   - **under** -- their best card in hand plus the passive still falls short, and asking is cruel.
 *
 * This is the same comparison `resolveCheck` makes, which is why it is worth printing beside the
 * call rather than left to the GM's arithmetic.
 */
export function readAgainst(passive, dc, bestInHand = 0) {
  if (passive >= dc) return "over";
  return passive + bestInHand >= dc ? "close" : "under";
}

/* -------------------------------------------- */
/*  Challenges (skill-rules 3)                  */
/* -------------------------------------------- */

/**
 * A challenge: two tracks, and the only part of section 3 that is arithmetic.
 *
 * **Progress** is how much you need to achieve and **Pressure** is how much can go wrong first, and
 * the table that moves them is exact: Critical +2 progress, Success +1, Partial +1 and +1, Fail +1
 * pressure and a twist. Because `checkOutcome` already decides which of the four a check produced
 * (resolve.mjs), the whole of this is a lookup -- which is why it is worth building at all, and why
 * it could not have been built before a check resolved.
 *
 * It lives beside the call, on the active scene, for the same reason: a challenge is a state of the
 * table, several people act into it, and nobody's sheet owns it.
 */
const CHALLENGE = "challenge";

/** The table of section 3, as data: what each result does to the two tracks. */
export const TRACK_MOVES = {
  critical: { progress: 2, pressure: 0, twist: false },
  success: { progress: 1, pressure: 0, twist: false },
  partial: { progress: 1, pressure: 1, twist: true },
  fail: { progress: 0, pressure: 1, twist: true }
};

/**
 * **One writer for the challenge flag, because there were three and each rebuilt it by hand.**
 *
 * `startChallenge`, `advanceChallenge` and the Catch Breath branch each wrote the whole object
 * out field by field -- five named keys, three times -- so a sixth field would have survived in
 * whichever of them was edited and been dropped by the other two. That is not a hypothetical: the
 * two fields added below would have vanished on the first check of any challenge.
 *
 * A merge over what is live, so a caller names only what it changes.
 */
async function writeChallenge(patch) {
  const scene = game.scenes?.active;
  const live = scene?.getFlag?.("cardrpg", CHALLENGE);
  if (!game.user.isGM || !scene || !live) return null;
  await scene.setFlag("cardrpg", CHALLENGE, { ...live, ...patch });
  return readChallenge();
}

/** The challenge in play, or null. */
export function readChallenge() {
  const scene = game.scenes?.active ?? null;
  const live = scene?.getFlag?.("cardrpg", CHALLENGE) ?? null;
  if (!live || typeof live !== "object") return null;
  const progress = Math.max(0, Number(live.progress) || 0);
  const pressure = Math.max(0, Number(live.pressure) || 0);
  const progressMax = Math.max(1, Number(live.progressMax) || 5);
  const pressureMax = Math.max(1, Number(live.pressureMax) || 3);
  return {
    progress, pressure, progressMax, pressureMax,
    note: String(live.note ?? ""),
    /* Either track filling ENDS it, and the rules say what each ending means: progress full is a
     * success whose cleanliness is the pressure left over, pressure full is a failure that should
     * lead to a new situation rather than a dead end. */
    won: progress >= progressMax,
    lost: pressure >= pressureMax,
    /**
     * **Whether this challenge is a ritual, which is the deck a twist comes from.**
     *
     * A ritual's failures are about the thing being lifted rather than about the scene
     * (skill-rules 6), so it draws from its own deck -- and *which deck* is the whole difference
     * between the two, exactly as it was for the intruders. Carrying it on the challenge rather
     * than offering a second pair of buttons is what keeps the scene area from doubling.
     */
    ritual: !!live.ritual,
    /* The same cast as a call carries, for the same reason: a challenge is a row of checks and
     * the question between them is whose turn it is to spend a card. */
    who: Array.isArray(live.who) ? live.who.filter(id => typeof id === "string") : [],
  };
}

/** Start one. GM only, like everything about a scene. */
export async function startChallenge({
  progressMax = 5, pressureMax = 3, note = "", ritual = false, who = []
} = {}) {
  const scene = game.scenes?.active;
  if (!game.user.isGM || !scene) return null;
  await scene.setFlag("cardrpg", CHALLENGE, {
    progress: 0, pressure: 0,
    progressMax: Math.max(1, Number(progressMax) || 5),
    pressureMax: Math.max(1, Number(pressureMax) || 3),
    note,
    who: (who ?? []).filter(id => typeof id === "string"),
    /* A ritual draws its twists from its own deck, and nothing else about it differs. */
    ritual: !!ritual
  });
  return readChallenge();
}

/** End it, whichever way it went. */
export async function endChallenge() {
  const scene = game.scenes?.active;
  if (!game.user.isGM || !scene) return;
  await scene.unsetFlag("cardrpg", CHALLENGE);
  await forgiveDebts();
}

/**
 * Move the tracks by one result.
 *
 * **Only the GM's client writes**, which is not a policy but a fact about Foundry: a scene flag is
 * the GM's to set. So this is called from a `createChatMessage` hook guarded by `isGM` rather than
 * from the check itself -- the player resolves their own check, the message carries the outcome,
 * and the one client that can record it does.
 *
 * Nothing is clamped away: a track that fills stays filled and `readChallenge` reports it, because
 * the end of a challenge is the GM's call about fiction and not an automatic state change.
 */
export async function advanceChallenge(outcome) {
  const scene = game.scenes?.active;
  const live = readChallenge();
  if (!game.user.isGM || !scene || !live) return null;
  const move = TRACK_MOVES[outcome];
  if (!move) return null;
  await writeChallenge({
    progress: live.progress + move.progress,
    pressure: live.pressure + move.pressure
  });
  const now = readChallenge();
  const line = `Progress ${now.progress}/${now.progressMax}`
    + ` · Pressure ${now.pressure}/${now.pressureMax}`;
  const ending = now.won ? game.i18n.localize("CARDRPG.Challenge.Won")
    : now.lost ? game.i18n.localize("CARDRPG.Challenge.Lost") : "";
  await ChatMessage.create({
    content: `<div class="cardrpg"><p>${line}${ending ? ` &mdash; <strong>${ending}</strong>` : ""}`
      + "</p></div>"
  });
  return now;
}

/**
 * Catch Breath in a challenge (skill-rules 3): the skill side's version, and it is not the combat
 * one.
 *
 * Four steps in the order the rules give them, and the first is the price: **Pressure +1**, because
 * the other side gets the time you took. Then the discard comes back, one card of your choice is
 * set aside as Spent until your next rest, and you draw up to hand size.
 *
 * The Spent card is the player's choice and the engine does not make it: it is the same shape as a
 * prune (leveling 4), where only the player knows which card they can do without today.
 */
export async function catchBreathInChallenge(actor, spentCardId = null) {
  const live = readChallenge();
  if (!live) {
    ui.notifications.info(game.i18n.localize("CARDRPG.Challenge.NotInOne"));
    return null;
  }
  const deck = deckOf(actor, "skill");
  const discard = deckOf(actor, "skillDiscard");
  const spent = deckOf(actor, "actionSpent");
  if (!deck || !discard) return null;

  /* The discard comes back here and nowhere else on the skill side: a rest is the only other way
   * (skill-rules 1), which is why dealing a hand must never touch it. */
  const ids = [...discard.cards.contents].map(c => c.id);
  if (ids.length) await move(discard, deck, ids);
  if (spentCardId && spent) {
    const card = deck.cards.get(spentCardId);
    if (card) await move(deck, spent, [spentCardId]);
  }
  await deck.shuffle({ chatNotification: false });
  const { drawn } = await dealSkillHand(actor);

  /* Pressure is the cost and it is paid even when nothing came back, because what you bought was
   * the time, not the cards. The GM's client records it, as with every other track move. */
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div class="cardrpg"><p><strong>Catch Breath</strong> &mdash; `
      + `${ids.length} back into the skill deck, ${drawn} drawn, and the other side got the time.`
      + "</p></div>",
    flags: { cardrpg: { pressure: 1 } }
  });
  return { returned: ids.length, drawn };
}

/* -------------------------------------------- */
/*  Twists (skill-rules 4)                      */
/* -------------------------------------------- */

/** The GM's deck and its discard, by the tag setup stamped on them. */
/**
 * The two stacks of a twist deck, by which deck it is.
 *
 * `"scene"` is the GM's general deck and `"ritual"` the one whose failures are about the thing
 * being lifted (skill-rules 6). A **tag prefix** rather than two functions, because the only
 * difference between them is which pile is read -- and a second copy of this would be a second
 * place to remember when a third deck arrives.
 */
function twistStacks(which = "scene") {
  const prefix = which === "ritual" ? "ritual-twist" : "twist";
  const find = tag => game.cards?.find(d => d.getFlag("cardrpg", "cardrpgContent") === tag) ?? null;
  return { deck: find(`${prefix}-deck`), discard: find(`${prefix}-discard`) };
}

/**
 * Draw a twist, or two to pick from.
 *
 * **A button and never a consequence.** skill-rules 4 is explicit: *the GM can always choose a cost
 * directly... the deck is there for when inspiration runs out, not to override the GM*, and *never
 * force a twist that makes no sense -- put it back and draw again*. So nothing in the engine draws
 * one on a Fail; the message says one is owed and the GM decides whether the deck is what they
 * want. Two-and-pick is the same button with a flag, for a dramatic failure or a card that does not
 * fit the scene.
 *
 * Reshuffled when it runs out, which is the only shuffle rule the deck has.
 */
export async function drawTwist({ two = false, pay = null, label = "" } = {}) {
  if (!game.user.isGM) return null;
  /*
   * **Which deck is read off the challenge, not chosen at the button.**
   *
   * A ritual draws from the ritual twist deck and everything else from the twist deck, and that
   * is the entire difference between them -- the same shape the intruder table settled on, where
   * the deck a card lands in was the dial all along. Deciding it here rather than in the panel is
   * what keeps the scene area to one Twist button instead of two pairs, and it means a GM running
   * a ritual cannot reach the wrong deck by clicking the wrong thing.
   */
  const live = readChallenge();
  const { deck, discard } = twistStacks(live?.ritual ? "ritual" : "scene");
  if (!deck || !discard) {
    ui.notifications.warn(game.i18n.localize("CARDRPG.Twist.NoDeck"));
    return null;
  }
  const want = two ? 2 : 1;
  if (deck.cards.size < want) {
    const back = [...discard.cards.contents].map(c => c.id);
    if (back.length) await move(discard, deck, back);
    await deck.shuffle({ chatNotification: false });
  }
  if (!deck.cards.size) return null;

  const drawn = [];
  for (let i = 0; i < want && deck.cards.size; i++) {
    const [card] = [...deck.cards.contents];
    if (!card) break;
    drawn.push({ name: card.name, cost: card.system?.cost ?? "",
      pressure: card.system?.pressure ?? 0, gives: !!card.system?.gives });
    await move(deck, discard, [card.id]);
  }

  /*
   * **The debt is paid, and only the one that was pointed at.** `pay` is the list of characters
   * this draw settles, so one failure in a group of five clears that one name and leaves the
   * others standing in the queue. Nothing means a draw the GM made without a debt behind it,
   * which skill-rules 4 allows: *the deck is there for when inspiration runs out*.
   */
  if (pay?.length) await forgiveDebts(pay);

  /*
   * **Whose cost this is, printed on the card.** A twist drawn into the middle of a group check
   * with no name on it is a cost nobody can place, and the pairing cannot be reconstructed
   * afterwards: the GM would be matching cards to people from memory. So the name travels with
   * the draw rather than being attached to it later.
   */
  const whose = label
    ? `<p class="cr-note">${foundry.utils.escapeHTML(label)}</p>`
    : "";
  const body = drawn.map(t => `<p><strong>${t.name}</strong>`
    + `${t.pressure ? " (Pressure +1 as well)" : ""}`
    + `${t.gives ? " &mdash; this one gives" : ""}<br>${t.cost}</p>`).join("");
  await ChatMessage.create({
    whisper: ChatMessage.getWhisperRecipients("GM"),
    content: `<div class="cardrpg">${whose}${two
      ? "<p><em>Two, and the GM picks one.</em></p>" : ""}${body}</div>`
  });
  return drawn;
}

/** How much of the deck is left, for the GM's own readout. */
/**
 * What the scene area needs to know about twists, which is less than it was showing.
 *
 * **`needed` is the whole point.** The buttons used to appear whenever a deck existed, which is
 * always, so two controls sat in the scene area through every scene that never drew one. A twist
 * is owed on a Partial or a Fail and on nothing else (`TRACK_MOVES`), so the panel shows a
 * button exactly when the rules say a cost is due.
 *
 * **It reads the ledger and not the challenge**, which is what lets a group check work at all:
 * the debt belongs to the character who incurred it, several can stand at once, and a call
 * answered by five people outside any challenge still owes what it owes.
 *
 * `kind` is which deck the next draw will come from, so the button can say so rather than leave
 * a GM in a ritual wondering which pile they are about to disturb.
 */
export function twistCounts() {
  const live = readChallenge();
  const ritual = !!live?.ritual;
  const { deck, discard } = twistStacks(ritual ? "ritual" : "scene");
  return {
    deck: deck?.cards?.size ?? 0,
    discard: discard?.cards?.size ?? 0,
    exists: !!deck,
    kind: ritual ? "ritual" : "scene",
    label: ritual ? "Ritual twist" : "Twist",
    /* At most two, and each one named: see `twistQueue`. */
    queue: twistQueue(),
    needed: readDebts().length > 0
  };
}

/* -------------------------------------------- */
/*  The one hook that records a result          */
/* -------------------------------------------- */

/**
 * A check's result moves a challenge, and the GM's client is the only one that may write it.
 *
 * `resolveCheck` stamps the outcome into its own chat message; this listens for that message and
 * advances the tracks. One hook, guarded twice -- once on being the GM and once on a challenge
 * being live -- so a check made outside a challenge costs nothing and changes nothing.
 */
export function registerCheckHooks() {
  Hooks.on("createChatMessage", async message => {
    if (!game.user.isGM) return;
    const outcome = message.getFlag?.("cardrpg", "outcome");
    if (outcome) {
      await advanceChallenge(outcome);
      /*
       * **Recording a debt is not drawing a twist.** skill-rules 4 is explicit that the GM
       * chooses the cost and the deck is only there for when inspiration runs out, so nothing
       * here touches the deck: it writes down who came up short, and the GM decides whether a
       * card is the answer. The result message is the only place that knows both the outcome and
       * the character, which is why the hook does it rather than the panel.
       */
      if (TRACK_MOVES[outcome]?.twist) {
        const actor = message.getFlag?.("cardrpg", "who");
        if (actor) {
          await oweTwist({
            actor,
            name: message.getFlag?.("cardrpg", "whoName") ?? "",
            kind: outcome
          });
        }
      }
    }
    /* Catch Breath pays in Pressure rather than in a result, and says so the same way. */
    const pressure = message.getFlag?.("cardrpg", "pressure");
    if (pressure) {
      const live = readChallenge();
      if (live) await writeChallenge({ pressure: live.pressure + Number(pressure) });
    }
  });
}
