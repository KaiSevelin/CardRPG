/**
 * The combat HUD.
 *
 * A sheet is something you open, consult and close. That is wrong for this game's core loop, where
 * every turn means picking two halves from five cards whose legality depends on your conditions,
 * your equipped items and which card you already used. So this is a wide panel along the bottom:
 *
 *   left   -- Items, Features, Conditions
 *   centre -- Actions in combat; Skills out of it (that deck is a later slice)
 *   right  -- the play area, then Fate and Discard
 *
 * The play area holds two stacks of overlapping cards, primary then secondary: the action card at
 * the base and everything modifying it laid on top. A card in play is in a stack and nowhere else.
 *
 * Staging order is play order: halves resolve in the order you clicked them, which is how the
 * rules' "either order" is expressed without a separate sequencing step.
 */

import { CARDRPG } from "./config.mjs";
import { CARD_BLURBS } from "./content.mjs";
import {
  deckOf, discardCards, retireCards, catchBreath, canCatchBreath, refill, handShort,
  cardName, artOf,
  conditionArt, portraitOf,
  dealSkillHand, discardSkillCards, pileBack, backOf,
  isReserved, reserveCard, reserveHand, uprightCards, isIntruder, intruderLine,
  /* One printed line per card, shared with the sheet's deck list: the discard viewer here and
   * the deck list there are the same register of the same question. */
  cardLine,
  /* Sift's two halves, which live in the deck layer so they can be driven without a dialog. */
  cardsToSift, binSifted
} from "./decks.mjs";
import {
  resolveAttack, resolveDefend, resolveHeal, resolveUse, resolveCondition, resolveShake,
  applyRage,
  reachableAmmo, isUsable,
  resolveTaint, resolveGearEffect, resolveRepair, resolveRepairCheck,
  liftCondition, resolveForesee, collectBonuses,
  resolveConjure, resolveShape,
  BARE_HANDS,
  itemMeets, requireText, payToCast, answerCast, grantBlock, resolveCheck, passiveScore,
  refusesAction, refusesTiming, refusesState, stateHolds, stateWords, resolveRead,
  bookDelayed, healTargets, SKILL_FLOOR,
  /* One strain dialog, one price. A spell pays the same cards a card half does. */
  askStrain, spellPrice, priceWords,
  readEdge, setEdge, edgeLine,
  /* core-rules 11's push, pull and throw, which nothing could express until today. */
  forceMove
} from "./resolve.mjs";
/* The GM plays a monster from this window now, and the moment one acts its type's intent card is
 * public knowledge anyway -- so the HUD flips it through the same function the turn hook does. */
import { revealIntent, turnOf, turnKey } from "./combat.mjs";
import { layGround, groundChips } from "./ground.mjs";
import { showReach, clearReach, squaresBetween } from "./board.mjs";
import {
  readCall, setCall, clearCall, describeCall, cardAnswers, bestTool, helpOptions,
  readChallenge, startChallenge, endChallenge, catchBreathInChallenge, drawTwist, twistCounts,
  twistQueue, forgiveDebts,
  partyPassives, readAgainst
} from "./checks.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/* -------------------------------------------- */

/**
 * **The three verbs that reach somebody else.** `defend`, `move` and `ready` are things you do to
 * yourself, so a distance to a target means nothing for them. Read as a set rather than from
 * `CARDRPG.verbs` because this is not a property of a verb the rest of the game asks about: it is
 * the one question the range display has, and a flag on all six that only this reads would be a
 * flag nobody could see the point of.
 */
const REACHES = new Set(["strike", "cast", "use"]);

/** A range of 99 in the catalogue means *any distance*, and two steps use it. */
const UNLIMITED = 99;

/**
 * **Every deck the left column can hold, which is what a card's size is computed for.**
 * **[RULED 2026-11-23]**
 *
 * The size was the window height divided by the rows **this actor draws**, and that is the wrong
 * divisor: it makes the cards a fact about who is selected. A caster hero has four decks and a
 * goblin has three, so clicking from one to the other changed the size of the whole left edge --
 * which is the fault reported twice, once as *a monster's decks are bigger* and then again after
 * the monster was fixed and the CASTER was the one out of step.
 *
 * So the divisor is the **tallest column the HUD can draw**: these four and the deck corner under
 * them. Every actor's cards are that size, nobody's column ever has to resize, and a deck arriving
 * or leaving moves nothing. It costs the three-deck case a little height, which is the price of
 * the size meaning the same thing on every actor in the fight.
 *
 * Read off this list rather than off the screen, because what is on the screen is the actor-shaped
 * answer this rule exists to stop using. The suite pins the list against the decks `#leftDecks`
 * actually builds, so a fifth kind cannot be added without the size following it.
 */
export const LEFT_DECK_KINDS = ["items", "features", "spells", "conditions"];

export class CardRPGTray extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    /** Staged halves, in click order. @type {{cardId: string, half: string}[]} */
    this.staged = [];
    /**
     * **What the player has waved out of the assist.**
     *
     * The assist puts things in a stack so nobody has to click what they would always click, and
     * a helper you cannot refuse is worse than no helper -- so anything it *offers* can be taken
     * back out, and this remembers which. Ids rather than a count, because which one was refused
     * is the whole of the information.
     *
     * **Conditions are never in it, and cannot be.** A condition is not a choice: it is something
     * done to you, with a duration, that ends when the duration does (core-rules 7). Letting one
     * be waved out of a stack would be letting a player decline the Dazed they are carrying --
     * not a UI preference but a rule quietly unmade in the one place a player looks.
     *
     * It clears when the play area does, because it is about one staged action and not about the
     * character.
     * @type {Set<string>}
     */
    this.waved = new Set();
    /**
     * Which half each played item is serving: "primary" or "secondary".
     *
     * A card says the verb and the item says the value, so a longsword that both strikes and
     * defends is ambiguous once both halves are staged. The answer is read off the play area: the
     * stack a slate sits in *is* the half it serves. An item with one verb has nothing to choose
     * and never appears here.
     *
     * @type {Map<string, string>}
     */
    this.roles = new Map();
    /**
     * Which card each stack is turned to, as an offset rather than an index, so the carousel can
     * keep counting past either end of a stack whose length changes under it.
     *
     * @type {{primary: number, secondary: number}}
     */
    this.tops = { primary: 0, secondary: 0 };

    /**
     * Slates put into play under pressure and not yet paid for, by id.
     *
     * Outside combat equipping is free. Inside one it costs a Ready, which is the whole reason the
     * verb exists (core-rules 4) -- but the cost is settled when the turn is played, along with
     * every other verb, rather than gating the click that arranges the stack. So this is a debt:
     * it is cleared by a Play that carries enough Ready halves, or by putting the slate back.
     *
     * @type {Set<string>}
     */
    this.pendingEquips = new Set();
    /**
     * **Which decks are open.**  **[CHANGED 2026-11-23]**
     *
     * It was one id, which makes the column a set of radio buttons nobody asked for: opening
     * Features shut Items, so a player weighing a feature against the gear it modifies could
     * never see both at once. Nothing about a spread wanted the others gone -- that was a
     * consequence of there being one place to put a spread, and now each one sits beside the
     * deck it came from (`#fitSpreads`), two open decks are two rows rather than two things
     * fighting over one.
     *
     * @type {Set<string>}
     */
    this.openPiles = new Set();
    /** Slates currently turned over, showing value, weight and type. @type {Set<string>} */
    this.flipped = new Set();
    /*
     * **No `dealtAt` here.**  [MOVED 2026-11-22]
     *
     * It was the round:turn a hand was last dealt, held on the tray so the deck corner could go
     * inert until the next turn -- fine while the only thing that dealt was a click in this
     * window. The turn deals the hand now (`dealTurnHand`), on the GM's machine, for somebody
     * else's character: a marker in one client's memory cannot be read by the client that needs
     * it, so the corner would have invited a second deal that drew nothing.
     *
     * It is a flag on the actor instead, which every client reads and which survives this window
     * being closed and opened. `playedAt` below is still a field, and deliberately so: a staged
     * turn is this window's own business and nobody else renders it.
     */
    /*
     * **What this turn has already played.**  **[BUILT 2026-11-22]**
     *
     * A turn is one primary and one secondary (core-rules 3), and the only thing enforcing it was
     * `staged` holding at most one of each -- which `#onPlay` then emptied. So the turn's budget
     * lasted exactly as long as the staging did: play two cards, and the tray offered the rest of
     * the hand as though nothing had happened. A five-card hand was five actions.
     *
     * Keyed by turn and compared rather than cleared, exactly as `dealtAt` is: there is no hook to
     * forget, and a turn that never comes round again simply never matches.
     */
    this.playedAt = null;
    this.spentHalves = { primary: false, secondary: false };
    /**
     * **Which deck this window is playing from**, or null to follow the mode.  [BUILT 2026-11-14]
     *
     * A character has two decks and the window used to show both at once out of combat: the
     * action hand laid across the scene, the skill hand under it, and a deck in the corner that
     * was always the action one. Two hands on the screen is two hands to read, and only one of
     * them could be played.
     *
     * So the mode picks a side -- a fight is the action deck, a scene is the skill deck -- and
     * this overrules it when somebody says otherwise. **Null is not "action"**: it means *follow
     * the mode*, so a tray left alone switches with the fight starting and ending, which is what
     * hud-spec 2 decided about mode switching in the first place. Pinning it is a deliberate act
     * and it stays pinned until it is unpinned.
     *
     * Why pin at all: skill checks happen in combat -- a lock picked while the fight is on, a
     * shove resisted -- and the action deck is worth reading out of one, when the question is
     * what you will have in hand when it starts.
     * @type {"action"|"skill"|null}
     */
    this.side = null;
  }

  static DEFAULT_OPTIONS = {
    classes: ["cardrpg", "cr-hud-app"],
    // A HUD, not a window: no frame, no title bar, and positioned by CSS against the screen edges
    // rather than by drag coordinates. The panels sit over the canvas like Foundry's own controls.
    window: { frame: false, positioned: false },
    actions: {
      stage: CardRPGTray.#onStage,
      wave: CardRPGTray.#onWave,
      setDefault: CardRPGTray.#onSetDefault,
      clear: CardRPGTray.#onClear,
      play: CardRPGTray.#onPlay,
      breathe: CardRPGTray.#onBreathe,
      endTurn: CardRPGTray.#onEndTurn,
      playSlate: CardRPGTray.#onPlaySlate,
      shiftStack: CardRPGTray.#onShiftStack,
      unstack: CardRPGTray.#onUnstack,
      frontCard: CardRPGTray.#onFrontCard,
      moveHalf: CardRPGTray.#onMoveHalf,
      dealHand: CardRPGTray.#onDealHand,
      // A face-down pile is not openable; the click is absorbed rather than erroring.
      openPile: CardRPGTray.#onOpenPile,
      flipCard: CardRPGTray.#onFlipCard,
      // The reaction row is the only thing on a card in hand you can click that does not play it.
      reserve: CardRPGTray.#onReserve,
      reserveAll: CardRPGTray.#onReserveAll,
      // The scene side: the GM says when a scene starts, and a card is played AT a difficulty.
      dealSkills: CardRPGTray.#onDealSkills,
      check: CardRPGTray.#onCheck,
      // The GM's half of a check, and withdrawing it again (skill-rules 2, step 1).
      clearCall: CardRPGTray.#onClearCall,
      // A challenge is two tracks and a GM who starts and ends it (skill-rules 3).
      endChallenge: CardRPGTray.#onEndChallenge,
      // Catch Breath on the skill side, which costs Pressure rather than a turn.
      breatheScene: CardRPGTray.#onBreatheScene,
      // The GM's own deck, drawn by hand because the rules say it is never forced.
      twist: CardRPGTray.#onTwist,
      forgiveTwist: CardRPGTray.#onForgiveTwist,
      // The GM's passive panel, folded open or shut and remembered per client.
      togglePassives: CardRPGTray.#onTogglePassives,
      // The claim: what somebody says should make this draw easier or harder, and why.
      setEdge: CardRPGTray.#onSetEdge,
      sayWhy: CardRPGTray.#onSayWhy,
      // Which of the character's two decks this window is playing from.
      flipSide: CardRPGTray.#onFlipSide,
      // The monster side: a sequence resolves in order and a weapon resolves on its own.
      playStep: CardRPGTray.#onPlayStep,
      playIntent: CardRPGTray.#onPlayIntent,
      npcStrike: CardRPGTray.#onNpcStrike,
    }
  };

  static PARTS = {
    main: { template: "systems/cardrpg/templates/tray.hbs" }
  };

  static #open = new Map();

  /**
   * **Who this window will open on, and for whom.**  [2026-11-14]
   *
   * It used to refuse an NPC flatly -- *the HUD is for characters; NPCs are run from their sheet*
   * -- and the sheet it sent you to has no way to attack with anything. So the one actor in a
   * fight that could not be played from the HUD was every actor the GM was playing.
   *
   * Two rules, and they are the visibility rules of hud-spec 7 rather than new ones:
   *
   * - **A player sees their own character and nothing else.** Not a monster, not another
   *   player's hero. The HUD shows a hand, and hand contents are private.
   * - **A GM sees whoever they have selected**, hero or monster. They own every actor in the
   *   world, so "pick the one you own" was never the test -- selection is.
   */
  static openFor(actor, { auto = false } = {}) {
    if (!actor) return null;
    if (actor.type !== "character" && actor.type !== "npc") return null;
    if (actor.type === "npc" && !game.user.isGM) return null;
    if (!actor.isOwner) return null;
    /*
     * **One HUD at a time, and the old one leaves the screen at once.**  **[FIXED 2026-11-23]**
     *
     * The rule was right and the implementation was a race. `close` is asynchronous -- a fade and
     * a teardown -- and the new window was rendered in the same tick, so for the length of the
     * animation both layers were up, each `position: fixed; inset: 0`, one over the other. What a
     * GM saw when they selected a goblin was the goblin's decks with **somebody else's decks
     * showing through the gaps between them**: a skill deck and a flip button in a corner that a
     * monster's HUD does not have and cannot have.
     *
     * Worse than cosmetic, because several hooks re-render every open tray, and one of those
     * catching the closing window mid-fade would have brought it back for good.
     *
     * **The outgoing layer is hidden now and torn down on its own time**, which is the fix with
     * nothing attached to it. The first version waited for the close and rendered afterwards,
     * and that put a paint at a moment no caller chose: forty callers hold this window by hand
     * and several of them render it themselves on the next line, so a second render arriving a
     * microtask later races every one of them. Nothing here is asynchronous any more -- the swap
     * is a style on the way out and a render on the way in, both in the tick that asked for
     * them, and no caller's timing changes at all.
     *
     * The fade was always a nicety. A second HUD over the first is not.
     */
    for (const other of CardRPGTray.openTrays) {
      if (other.actor?.id === actor.id) continue;
      if (other.element) other.element.style.display = "none";
      other.close();
    }
    let tray = CardRPGTray.#open.get(actor.id);
    if (!tray) {
      tray = new CardRPGTray(actor);
      /*
       * **Whose idea this HUD was**, which is the only thing that decides whether it should go
       * when the fight does. Set at creation and never after: a HUD somebody opened by hand stays
       * theirs even if a fight starts around it, and closing it on them would be the application
       * overruling a click.
       */
      tray.openedByFight = auto;
      CardRPGTray.#open.set(actor.id, tray);
    }
    tray.render({ force: true });
    return tray;
  }

  /** Every open HUD, from the ApplicationV2 registry (ui.windows holds only V1 windows). */
  static get openTrays() {
    const instances = foundry.applications?.instances;
    return instances ? [...instances.values()].filter(a => a instanceof CardRPGTray) : [];
  }

  /**
   * Open the HUD for whoever this user is playing.
   *
   * A GM running a solo playtest owns every actor, so "pick the one you own" is no help. Prefer the
   * assigned character, then a selected token, then — for a GM — the only player character in the
   * fight, which is the usual playtest shape.
   */
  static autoOpen(combat, updateData = null) {
    if (!combat) return;
    const inCombat = id => combat.combatants.some(c => c.actor?.id === id);

    /*
     * **A GM follows the turn order, because the turn order is what they are running.**
     * [BUILT 2026-11-14]
     *
     * The three rules below are about finding the one character a client is playing, and for a GM
     * that question has no answer -- they are playing all of them, in a defined order, one at a
     * time. So on a GM's client the acting combatant IS the answer, and the HUD moves with the
     * turn marker. That is also the whole of what *there is no way to attack as a goblin* meant:
     * the goblin's turn came round and nothing on the screen changed.
     *
     * A player is never moved this way. Their HUD is their own character's and does not go
     * wandering off to whoever happens to be acting.
     *
     * **[FIXED 2026-11-16] And it has to be asked of `updateData`, not of the combat.**
     *
     * Inside a `combatTurn` hook, `combat.combatant` is still the combatant whose turn just
     * **ended** -- Foundry calls the hook from `_onUpdate` and hands the new turn over in
     * `updateData`, which nothing here was reading. So this did move the GM's HUD, and moved it
     * one turn late every single time: the goblin's turn came round and the screen showed the
     * hero, which is *there is no way to attack as a goblin* for the second time, with the rule
     * built and a stale read in front of it.
     *
     * Driven rather than argued: a live probe reads `combat.combatant` inside the hook and gets
     * the previous actor, and reads `combat.turns[updateData.turn]` and gets the right one.
     * `combatStart` and `combatRound` carry the same field, and the two callers that have no
     * update to offer -- `ready` and `canvasReady`, where nothing just changed -- fall through
     * to the combatant, which is correct precisely because no turn is mid-change.
     */
    const acting = turnOf(combat, updateData).actor;
    if (game.user.isGM && acting?.isOwner) {
      return CardRPGTray.openFor(acting, { auto: true });
    }

    const assigned = game.user.character;
    if (assigned?.type === "character" && inCombat(assigned.id)) {
      return CardRPGTray.openFor(assigned, { auto: true });
    }

    const selected = canvas?.tokens?.controlled?.[0]?.actor;
    if (selected?.type === "character" && inCombat(selected.id)) {
      return CardRPGTray.openFor(selected, { auto: true });
    }

    const characters = combat.combatants
      .map(c => c.actor)
      .filter(a => a?.type === "character" && (game.user.isGM || a.isOwner));
    const unique = [...new Map(characters.map(a => [a.id, a])).values()];
    if (unique.length === 1) CardRPGTray.openFor(unique[0], { auto: true });
  }

  /**
   * **Close the HUDs the fight opened, because the fight is over.**  **[FIXED 2026-11-13]**
   *
   * Three hooks opened one and nothing ever shut it: `deleteCombat` was wired to *refresh* every
   * tray, which redrew the decks of a fight that no longer existed. So a scene kept a hand, four
   * deck backs and a Play button laid over it after the encounter ended, for a character nobody
   * had selected -- the playtest build's furniture with nothing left to furnish.
   *
   * Only the ones the fight opened. A HUD somebody opened by hand is theirs to close.
   */
  static async closeAfterFight() {
    /*
     * `animate: false`, and not for speed. ApplicationV2 runs a closing transition of up to a
     * second and only drops the instance from the registry afterwards, so an animated close leaves
     * the HUD both on the screen and in `openTrays` for that second -- long enough for the refresh
     * that follows to find it and render it straight back. A HUD going away with the fight it
     * belonged to has nothing to animate anyway.
     */
    for (const tray of CardRPGTray.openTrays) {
      if (tray.openedByFight) await tray.close({ animate: false });
    }
  }

  get title() {
    return `${this.actor.name} — HUD`;
  }

  async close(options) {
    CardRPGTray.#open.delete(this.actor.id);
    /* The paint belongs to this window's staging, so it goes when the window does. Left behind it
     * would be an answer with nothing on the screen saying whose question it was. */
    clearReach();
    return super.close(options);
  }

  /**
   * **The HUD's own root, which is sometimes the application element and sometimes inside it.**
   *
   * Three methods measure something against the screen and write the answer onto this element as
   * a custom property. All three opened with the same five lines, and the third copy is what says
   * to stop: a lookup written out per caller is a lookup that gets fixed in two places out of
   * three the next time Foundry moves a frame around.
   */
  #layer() {
    return (this.element?.classList?.contains("cr-hud-layer")
      ? this.element
      : this.element?.querySelector(".cr-hud-layer")) ?? null;
  }

  /**
   * Sit the right column clear of Foundry's own sidebar, whatever width it is right now.
   *
   * The sidebar collapses to a rail of buttons and expands again, so a fixed width in the
   * stylesheet is wrong half the time: too small and the column covers the chat and combat
   * buttons, too large and it floats a card's width away from them. Measure the real element.
   */
  #fitSidebar() {
    const layer = this.#layer();
    if (!layer) return;

    // Ask Foundry for its own sidebar before guessing at element ids, which have moved between
    // versions. `ui.sidebar.element` is a bare node in v13+ and a jQuery wrapper before that.
    const own = ui.sidebar?.element;
    const candidates = [
      own instanceof HTMLElement ? own : (own?.[0] ?? null),
      document.getElementById("sidebar"),
      document.getElementById("ui-right")
    ];

    // The FIRST plausible answer wins, narrowest first -- not the leftmost edge of any of them.
    // #ui-right can be a container far wider than the bar inside it, and taking its edge parked
    // the whole column in the middle of the canvas.
    for (const node of candidates) {
      const rect = node?.getBoundingClientRect?.();
      if (!rect || rect.width <= 0) continue;
      const width = window.innerWidth - rect.left;
      // A sidebar narrower than a button or wider than a third of the screen is a measurement of
      // something else; leave the stylesheet's fallback alone rather than trust it.
      if (width < 24 || width > Math.min(420, window.innerWidth / 3)) continue;
      layer.style.setProperty("--cr-sidebar", `${Math.round(width) + 12}px`);
      return;
    }
  }

  /**
   * And the same for the controls down the left, which were a number typed into the stylesheet.
   *
   * **`--cr-controls: 82px` was a guess, and it was wrong.**  [FIXED 2026-11-15] The right
   * sidebar has been measured since the HUD was built, for the reason written above it: a fixed
   * width is wrong half the time. The left column was never given the same treatment, so on any
   * build whose controls are wider than 82px every panel anchored to that edge was drawn on top
   * of Foundry's own tools. Same bug, same fix, other side of the screen.
   */
  #fitControls() {
    const layer = this.#layer();
    if (!layer) return;

    const own = ui.controls?.element;
    const candidates = [
      own instanceof HTMLElement ? own : (own?.[0] ?? null),
      document.getElementById("controls"),
      document.getElementById("scene-controls"),
      document.getElementById("ui-left")
    ];
    for (const node of candidates) {
      const rect = node?.getBoundingClientRect?.();
      if (!rect || rect.width <= 0) continue;
      // Measured from the screen edge, because the column is not always flush against it.
      const width = rect.right;
      // Narrower than a button or wider than a third of the screen is a measurement of something
      // else; leave the stylesheet's fallback alone rather than trust it.
      if (width < 24 || width > Math.min(420, window.innerWidth / 3)) continue;
      layer.style.setProperty("--cr-controls", `${Math.round(width)}px`);
      return;
    }
  }

  /**
   * **And how many cards tall the left column is, which is no more a constant than its edge is.**
   * **[BUILT 2026-11-22]**
   *
   * The stylesheet divides the window height by the number of cards stacked down the left edge to
   * decide how big a card is, and that number was typed in as `4` -- Items, Features, Conditions,
   * and the deck corner under them. **A caster has a fourth pile**, because the spell book is a
   * deck and not a rail (hud-spec 3.8). Five cards in a space measured for four pushed the bottom
   * one off the screen, so a character who learned a spell lost the **Conditions** deck: read at
   * the table as the spell deck replacing it, which is exactly what it looks like.
   *
   * **Counted off the DOM rather than from the context**, for one reason: the context knows about
   * the piles it builds, and what broke here was a column growing a row the arithmetic had never
   * been told about. A count of the elements actually drawn cannot go stale that way, so anything
   * added to either column from now on pays for itself.
   *
   * `.cr-hud__decks` is both of those columns and nothing else. The piles under the play area are
   * deliberately not in it: they are on the other side of the screen and take none of this height.
   *
   * It leaves the variable alone when it counts nothing -- an unrendered HUD has no piles at all,
   * and writing a 0 there would divide the window by zero.
   */
  #fitRows() {
    const layer = this.#layer();
    if (!layer) return;
    /*
     * **Counted off what the column CAN hold, not off what this actor drew.**
     * **[RULED 2026-11-23]**
     *
     * Two versions of this were wrong in the same way and the second looked like a fix. Counting
     * the piles drawn made a monster's cards half again as large, because a monster presses no
     * deck corner (core-rules 3 deals its intent for it) and so drew one row fewer. Adding the
     * corner settled that and left the other half standing: **a caster draws a fourth deck**, so
     * a hero with a spell and a goblin without one were still two sizes, and clicking between
     * them still resized the whole left edge.
     *
     * The divisor is `LEFT_DECK_KINDS` plus the corner -- the tallest column the HUD can draw --
     * for the reasons written over that list. It is deliberately not a measurement: measuring the
     * screen gives the actor-shaped answer this rule exists to stop using.
     */
    layer.style.setProperty("--cr-rows", String(LEFT_DECK_KINDS.length + 1));
  }

  /**
   * **And a spread sits beside the deck it came out of.**  **[BUILT 2026-11-23]**
   *
   * Every opened deck used to spread into one band pinned to the top of the screen, which is
   * right for the first deck in the column and wrong for all the others: a feature turned over
   * from the third row appeared level with the first, so the card you had just asked for arrived
   * two rows above the thing you asked. At the table that reads as the wrong deck having opened.
   *
   * **Measured rather than calculated.** The left column's rows could be worked out -- a start
   * offset, a card height, a gap -- but the piles under the Play button could not: that column is
   * top-anchored and as tall as whatever is in it, so where its discard sits is a fact about a
   * turn in progress. One mechanism that asks the back where it is answers for both, and cannot
   * drift from the stylesheet the way a second copy of the arithmetic would.
   *
   * A pile has `transition: none` for the reason written over that rule, so what this measures is
   * where the back IS and not where it is on its way to.
   *
   * It clamps at the hand, because a spread drawn over the cards you are playing is worse than
   * one drawn a little above its deck.
   */
  #fitSpreads() {
    const layer = this.#layer();
    if (!layer) return;
    const frame = layer.getBoundingClientRect();
    const hand = layer.querySelector(".cr-hud__hand");
    const floor = hand
      ? hand.getBoundingClientRect().top - frame.top - 8
      : frame.height;

    for (const spread of layer.querySelectorAll(".cr-hud__spread")) {
      const id = spread.dataset.pile;
      const back = id ? layer.querySelector(`.cr-pile[data-pile="${id}"]`) : null;
      /* No back on the screen is no answer, and the stylesheet's top is a better guess than a
       * number computed from a rectangle that is not there. */
      if (!back) continue;
      const want = back.getBoundingClientRect().top - frame.top;
      const limit = Math.max(0, floor - spread.offsetHeight);
      spread.style.top = `${Math.round(Math.min(Math.max(0, want), limit))}px`;
    }
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    this.#fitSidebar();
    this.#fitControls();
    this.#fitRows();
    /* After `#fitRows`, which changes how tall a card is and therefore where every back sits. */
    this.#fitSpreads();
    this.#paintReach();
  }

  /**
   * **The squares a staged Move would reach, painted on the board.**  [BUILT 2026-11-21]
   *
   * core-rules 12's ruling: movement stays a sentence the table applies, **as long as it is clear
   * to the player how far they can move**. The faces have printed the number since phase 1; what
   * they could not do is say which squares it is, which is the question actually being asked when
   * somebody is choosing between Advance and a Strike.
   *
   * **Done here and not in the stage handler**, although staging is what changes it. Every route
   * into the play area ends in a render -- staging, unstaging, Clear, Play, shifting a stack,
   * putting a slate back, a condition arriving from somebody else's turn -- and hanging this off
   * each of them would be eight copies of one line, with the ninth route added later and missed.
   * One render, one answer, and the answer always matches the faces it was read off.
   *
   * It spends nothing and moves nobody. See board.mjs.
   */
  #paintReach() {
    if (this.actor?.type === "npc") return clearReach();
    const budget = this.#moveStaged();
    if (!budget) return clearReach();
    showReach(this.actor, budget);
  }

  /**
   * **Every target, how far off it is, and whether what is staged reaches it.**  [BUILT 2026-11-21]
   *
   * This line used to be the targets' names and nothing else, which is the shape of the gap: a
   * card that reads *within 4* printed the 4, the engine never measured anything, and so the one
   * question an attack turns on was asked of a person squinting at a map. Nobody decided that
   * either -- `squaresBetween` did not exist, so it could not be answered.
   *
   * **It measures and says so; it does not refuse.** Same ruling as Move (core-rules 12): the
   * number has to be in front of the player, and what they do with it is the table's. Play is not
   * gated, nothing is greyed, and an out-of-reach target is marked rather than blocked -- because
   * the engine does not know about the ledge, the dangling rope or the GM who has just said yes.
   *
   * Distance is printed even with nothing staged, because *how far away is that* is worth knowing
   * while you are still choosing the card.
   */
  #targetRows() {
    const reaches = this.#reachStaged();
    /* The furthest, because that is the question: can this action touch that figure at all. The
     * tooltip carries every verb's own reach, so a card that strikes at 1 and casts at 3 is not
     * reduced to one number without saying so. */
    const furthest = reaches.length ? Math.max(...reaches.map(r => r.reach)) : null;
    const spell = reaches.map(r => `${r.verb} ${r.reach >= UNLIMITED ? "any distance" : r.reach}`)
      .join(", ");
    return [...(game.user.targets ?? [])].map(token => {
      const away = squaresBetween(this.actor, token.document ?? token);
      const out = away !== null && furthest !== null && furthest < UNLIMITED && away > furthest;
      return {
        name: token.name,
        away,
        reach: furthest,
        out,
        /* "3" with nothing staged, "3/4" once something with a reach is. */
        range: away === null ? "" : (furthest === null ? `${away}` : `${away}/${furthest}`),
        tip: away === null
          ? `${token.name} is not on the board, so there is no distance to measure.`
          : `${token.name} is ${away} ${away === 1 ? "square" : "squares"} away`
            + (spell ? `, and what you have staged reaches ${spell}.` : ".")
            + (out ? " Nothing stops you playing it; the engine does not know about the rope." : "")
      };
    });
  }

  /**
   * **What each staged step can reach, by verb.**
   *
   * A step's own `range` wins over the item's, and that order is the rule rather than a
   * convenience: *Taste of the Rot* is a Cast at range 1 and means adjacent, so a wand with a
   * three-square cast line must not quietly extend it. With no range on the step the weapon's
   * line decides, through `rangeOnLine`, which is the same number the gear panel prints and
   * already counts the bonuses a slate grants. With neither, 1: adjacent is what saying nothing
   * has always meant in this game.
   *
   * A step counts when it carries a range OR its verb reaches somebody. Both tests are needed:
   * eleven steps in the catalogue carry a range with no verb at all -- a condition laid on
   * somebody at a distance -- and a Strike carries its reach on the weapon rather than on itself.
   */
  #reachStaged() {
    const hand = deckOf(this.actor, "actionHand");
    const out = [];
    for (const { cardId, half } of this.staged) {
      const card = hand?.cards?.get(cardId);
      for (const step of card?.system?.[half] ?? []) {
        const reaching = REACHES.has(step.verb);
        if (!reaching && (step.range === null || step.range === undefined)) continue;
        let reach = step.range ?? null;
        if (reach === null && reaching) {
          const item = this.#itemFor(step.verb, half, step.requires);
          const line = item?.system?.verbs?.[step.verb];
          reach = line ? this.actor.system.rangeOnLine(line, item) : null;
        }
        out.push({ verb: step.verb ?? "it", reach: reach ?? 1 });
      }
    }
    return out;
  }

  /**
   * **What the staged halves add up to as a Move, after everything that reduces it.**
   *
   * Summed over the staged halves rather than computed from the cards, and through `moveAsPlayed`
   * per step, because **that is what the faces print**: a Slowed Advance reads Move 1 on the card
   * in front of the player, and the highlight has to be the same number or one of the two is
   * lying. Halving each step rather than the sum is the same reason -- core-rules 7 halves *your
   * Move*, the face applies it per card, and this agrees with the face.
   *
   * Zero when nothing staged moves, which is the ordinary case and means *take the paint off*.
   */
  #moveStaged() {
    const hand = deckOf(this.actor, "actionHand");
    let squares = 0;
    for (const { cardId, half } of this.staged) {
      const card = hand?.cards?.get(cardId);
      for (const step of card?.system?.[half] ?? []) {
        if (step.verb !== "move" || step.param === null || step.param === undefined) continue;
        squares += this.actor.system.moveAsPlayed?.(step.param)?.played ?? step.param;
      }
    }
    return squares;
  }

  /**
   * Re-measure when the sidebar opens or shuts, without re-rendering the whole HUD.
   *
   * `#fitRows` is deliberately not here: it counts piles, and a pile arrives or leaves only on a
   * render, which does the counting itself. The height the count is divided into is the
   * stylesheet's `100vh`, which the browser redoes on a resize without being asked.
   */
  static refitAll() {
    for (const tray of CardRPGTray.openTrays) {
      tray.#fitSidebar();
      tray.#fitControls();
      /* The column's cards are sized off the window height, so every back has just moved. */
      tray.#fitSpreads();
    }
  }

  /* -------------------------------------------- */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const system = actor.system;
    /*
     * **Which kind of actor this window is drawing**, asked once and answered everywhere below.
     * core-rules 9 is the whole of the difference: a monster holds no hand, has no stamina, pays
     * no Ready and no Strain, and takes its turn off one intent card instead of two halves of
     * two. Everything it DOES have -- health, block, armour, conditions, gear, a fate deck -- is
     * the same four panels reading the same fields.
     */
    const npc = actor.type === "npc";
    /* Which of the two decks this window is turned to; the mode picks unless somebody pinned. */
    const side = this.#sideNow();
    const blocked = system.blockedIcons ?? new Set();
    const hand = npc ? null : deckOf(actor, "actionHand");

    const active = (system.activeConditions ?? []);
    const dazed = system.noSecondary;
    const encumbered = active.find(c => c.key === "burdened" || c.key === "overloaded");

    const combat = game.combat;
    const myCombatant = combat?.combatants.find(c => c.actor?.id === actor.id);
    const counts = system.deckCounts ?? {};

    /*
     * Both deck lists, built once, because the open spreads are derived from them: the rows come
     * out in the order the backs are drawn in, and a second call could not promise that.
     */
    const leftDecks = this.#leftDecks();
    const pileLinks = this.#pileLinks();
    const deckTotal = Math.max(1, (counts.draw ?? 0) + (counts.discard ?? 0) + (counts.hand ?? 0));
    const fateTotal = (counts.fate ?? 0) + (counts.fateDiscard ?? 0);

    const slates = actor.items.filter(i => i.type === "item");
    const describeItem = i => ({
      id: i.id,
      name: i.name,
      group: i.system.group || "",
      weight: i.system.weight,
      lines: Object.entries(i.system.verbs ?? {})
        .filter(([, l]) => l.value !== null)
        // Range is asked of the actor, not read off the item: Good Aim lengthens it and a lost
        // eye shortens it, and neither had a reader until the injuries were built.
        .map(([v, l]) => `${v} ${l.value}`
          + ((r => r ? `/r${r}` : "")(actor.system.rangeOnLine(l, i)))
          + (l.reach ? `/reach ${l.reach}` : ""))
        .join(" · ") || (i.system.armor ? `armor ${i.system.armor}` : "")
    });

    return Object.assign(context, {
      actor,
      system,
      config: CARDRPG,
      isGM: game.user.isGM,
      isNpc: npc,
      npcKind: npc ? (system.kind || "") : "",
      /* The face, beside the name. `portraitOf` knows core's placeholders from ours, so an
       * actor nobody has given a portrait shows the name alone rather than a grey silhouette. */
      portrait: portraitOf(actor),
      /* A claim is state on the actor, so it reads the same on every client that can see them. */
      edge: this.#edge(),
      /*
       * **What the square under them is.**  [BUILT 2026-11-16]
       *
       * Ground phase 1. Eleven of the twelve entries that read a shadowed square are rules a
       * person applies, and that is right -- what a table cannot do is apply a rule about a
       * square nobody can see. Each chip says whether the engine acts on it or they do.
       */
      ground: groundChips(this.actor),
      npc: npc ? this.#npcTray() : null,

      /* One hand on the screen at a time: the side decides which (hud-spec 5a). */
      cards: (npc || side === "skill") ? [] : (hand?.cards.contents ?? [])
        .map(card => this.#renderCard(card, blocked, dazed)),
      staged: this.staged.map((s, i) => ({
        ...s, order: i + 1, name: cardName(hand?.cards.get(s.cardId))
      })),
      // A turn is one primary and one secondary. Dazed or Exhausted cuts you to the primary alone,
      // and then one half is the whole turn -- so the button waits for what you are allowed to play.
      canPlay: (dazed || system.exhausted)
        ? this.staged.some(s => s.half === "primary")
        : ["primary", "secondary"].every(h => this.staged.some(s => s.half === h)),
      // Clear empties the play area, so it is live whenever there is anything in it to empty.
      canClear: this.staged.length > 0
        || ["primary", "secondary"].some(h => this.#assigned(h).length > 0),
      // A breath recovers a fixed 2, so a discard that cannot cover it buys nothing: the button
      // says so by being dead, rather than by taking the turn and handing back one card.
      /* A monster has no stamina and no hand to look in, so the question is not asked of one:
       * `canCatchBreath` would go looking for a deck it has not got and warn about the absence. */
      canBreathe: !npc && canCatchBreath(this.actor),
      breathRecovery: CARDRPG.defaults.breathRecovery,
      playHint: (dazed || system.exhausted)
        ? "Primary only this turn."
        : "Needs a primary and a secondary, from two different cards.",

      dazed,
      stunned: system.noReactions,
      /*
       * How many cards are available to react with. Public, the way hand SIZE is public and hand
       * contents are not (hud-spec 7) -- and with reactions automatic it is the most informative
       * number on the board: it says exactly how much defence this character has left.
       */
      upright: uprightCards(actor).length,
      reserved: (hand?.cards.contents ?? []).filter(c => isReserved(c)).length,
      exhausted: system.exhausted,
      /*
       * **Stamina: the cards you have left to play** (core-rules 8), which is the clock now that
       * the draw pile is not one. It belongs beside `upright` for the same reason that number is
       * public: with reactions automatic, how much a character can still do is the most
       * informative thing on the board, and it is a count rather than a hand's contents.
       */
      stamina: system.stamina,
      outOfStamina: system.outOfStamina,
      /*
       * Whether the whole hand is already held back, so one button can say both things. A hand
       * with nothing in it is not "all held" -- it is empty, and the button is hidden.
       */
      allReserved: (hand?.cards.size ?? 0) > 0
        && uprightCards(actor).length === 0,
      encumbered: encumbered
        ? game.i18n.localize(CARDRPG.conditions[encumbered.key].label)
        : null,

      conditions: active.map(c => ({
        ...c,
        label: game.i18n.localize(CARDRPG.conditions[c.key]?.label ?? c.key),
        icon: CARDRPG.conditions[c.key]?.icon,
        creator: c.creatorId ? game.actors.get(c.creatorId)?.name ?? null : null
      })),

      equipped: slates.filter(i => i.system.equipped).map(describeItem),
      pack: slates.filter(i => !i.system.equipped).map(describeItem),

      features: actor.items.filter(i => i.type === "feature").map(f => ({
        id: f.id,
        name: f.name,
        text: f.system.text,
        group: f.system.group || "",
        drained: f.system.drained,
        recharge: f.system.rechargeLabel,
        rechargeIcon: CARDRPG.effects.charging.icon
      })),

      counts,
      /*
       * Against the deck's REAL size, not a hardcoded 20. A Wild is a permanent passenger
       * (ideas.md), so a fate deck can be larger than the printed twenty -- and this bar read over
       * 100% the moment one went in.
       */
      fatePct: Math.round(100 * (counts.fate ?? 0) / Math.max(1, fateTotal)),
      // Exactly one Miss and one Critical between reshuffles, which is what makes 2/k true. Wilds
      // do not reshuffle and are not swings, so they are in `k` and not in the 2.
      fateSwing: counts.fate ? Math.min(100, Math.round(200 / counts.fate)) : null,
      playArea: this.#playArea(),
      leftDecks,
      /* The corner means the same thing on both sides: the deck you are playing from. */
      actionDeck: side === "skill" ? this.#skillDeck() : this.#actionDeck(combat),
      pileLinks,
      viewers: this.#viewers([...leftDecks, ...pileLinks]),

      /*
       * The scene tray (hud-spec 5), shown whenever no Combat is active. It is the same window in
       * a different mode rather than a second application, because the fate deck spans both and a
       * second window would have to show it twice.
       */
      /*
       * **The skill side, shown whenever the window is turned to it** -- which out of combat is
       * by default and in combat is by asking. It used to be *whenever no Combat is active*, so a
       * check called mid-fight had nowhere to be answered from.
       *
       * A monster has no skill deck and makes no checks of its own (core-rules 9), so it is never
       * drawn for one: it would be four empty panels and a New scene button.
       */
      scene: (npc || side !== "skill") ? null : this.#sceneTray(),
      /* Above the character panel, in both modes: a passive does not move during play. */
      passives: npc ? null : this.#passivePanel(),
      side,
      onSkill: side === "skill",
      /* The toggle itself. Not offered to a monster, which has one deck and nothing to turn to. */
      flip: npc ? null : {
        label: side === "skill" ? "Action deck" : "Skill deck",
        tip: side === "skill"
          ? "Turn the window to your action deck: the hand you fight from. Anything staged is "
            + "put back first."
          : "Turn the window to your skill deck: the hand you answer a check from. Anything "
            + "staged is put back first.",
        pinned: this.side !== null
      },
      inCombat: !!myCombatant,
      myTurn: combat?.combatant?.actor?.id === actor.id,
      turnOwner: combat?.combatant?.name ?? "",
      targets: this.#targetRows(),
      drawPct: Math.round(100 * (counts.draw ?? 0) / deckTotal)
    });
  }

  /* -------------------------------------------- */

  /**
   * **The monster's half of the HUD.**  [BUILT 2026-11-14]
   *
   * Until today `openFor` refused an NPC outright -- *the HUD is for characters; NPCs are run from
   * their sheet* -- and the sheet has no way to attack with anything. So a GM could draw a goblin
   * an intent card, read it, and then have nowhere to play it: the whole monster side of a fight
   * happened by hand, in chat, with the numbers typed in.
   *
   * It is the same window, for the same reason the scene tray is (hud-spec 5): the fate deck, the
   * conditions, the gear and the vitals are the same four panels drawn from different fields, and
   * a second application would draw all four twice.
   *
   * **A monster's turn is not a hand of halves.** core-rules 9: it holds no hand, it has no
   * stamina, it pays no Ready and no Strain. What it has is **one intent card per type per round**
   * (core-rules 3) carrying an ordered sequence, so there is nothing to stage and nothing to pick
   * between -- which is why the rows here resolve on the click rather than going into a stack.
   *
   * **And its weapons are rows too**, under the intent. Not every monster turn is the card: an
   * intent that does not fit the moment is a thing the GM overrules, the deck can be empty out of
   * combat, and *a specialist's tactic* is supposed to be played rather than rolled for. One click
   * per weapon is the floor this was missing.
   */
  #npcTray() {
    const intent = deckOf(this.actor, "intent");
    const card = intent?.cards.contents[0] ?? null;
    const blocked = this.actor.system.blockedIcons ?? new Set();

    const row = (step, index) => {
      const face = this.#stepFace(step);
      return {
        index,
        text: face.text,
        cut: face.cut,
        icon: face.icons[0] ?? null,
        blocked: face.icons.some(i => blocked.has(i)) || !!face.unmet,
        tip: face.unmet
          ? `Needs ${face.unmet}, and nothing it is holding is.`
          : face.notes.join(" ")
      };
    };

    /*
     * Every equipped weapon, as a one-step Strike. Built from the item rather than from a card,
     * because core-rules 9 is explicit that an NPC's Strike comes off its item -- the one knob
     * that sets how dangerous it is -- so this is that sentence with a button on it.
     */
    const strikes = this.#itemsFor("strike").map(item => {
      const line = item.system.verbs?.strike ?? {};
      const reach = this.actor.system.rangeOnLine(line, item);
      return {
        id: item.id,
        name: item.name,
        art: artOf(item),
        value: item.system.valueFor?.("strike") ?? line.value,
        range: reach && reach > 1 ? reach : null,
        tip: `Strike with ${item.name}. Target a token first; the fate draw and the damage go to `
          + "chat like any other attack."
      };
    });

    return {
      /* The card itself, face up for the GM whatever the players can see. §7 of the HUD spec: the
       * GM tray shows intent cards face up, one per type, this round. */
      card: card ? {
        id: card.id,
        name: cardName(card),
        art: artOf(card),
        text: card.system.text ?? "",
        revealed: !!intent?.getFlag("cardrpg", "revealed"),
        steps: (card.system.sequence ?? []).map(row)
      } : null,
      strikes,
      /* A monster whose whole turn is gone says so, rather than offering rows that refuse. */
      halted: !!this.actor.system.noTurn,
      empty: !card && !strikes.length
    };
  }

  /**
   * Resolve one step of a monster's turn, on the click.
   *
   * Nothing is staged, because there is nothing to choose between: a sequence is ordered and a
   * monster has no second half to weigh it against. The one thing the GM does choose is the
   * target, and that is Foundry's own targeting, exactly as it is for a character.
   */
  static async #onPlayStep(event, target) {
    const step = this.#npcStep(Number(target.dataset.index));
    if (!step) return;
    await revealIntent(this.actor);
    await this.#resolveStep(step, "primary", CardRPGTray.#targets());
    this.render();
  }

  /** The whole sequence, in its printed order -- which is the order the face numbers it in. */
  static async #onPlayIntent() {
    const card = deckOf(this.actor, "intent")?.cards.contents[0];
    if (!card) return;
    await revealIntent(this.actor);
    const targets = CardRPGTray.#targets();
    for (const step of card.system.sequence ?? []) {
      await this.#resolveStep(step, "primary", targets);
    }
    this.render();
  }

  /** One weapon, straight out of the gear, for a turn the card does not describe. */
  static async #onNpcStrike(event, target) {
    const item = this.actor.items.get(target.dataset.slateId);
    if (!item) return;
    await this.#resolveStep({ verb: "strike" }, "primary", CardRPGTray.#targets(), item);
    this.render();
  }

  #npcStep(index) {
    const card = deckOf(this.actor, "intent")?.cards.contents[0];
    return Number.isInteger(index) ? (card?.system.sequence ?? [])[index] ?? null : null;
  }

  /** Whoever the acting user has targeted. The same question a character's Play asks. */
  static #targets() {
    return [...(game.user.targets ?? [])].map(t => t.actor).filter(a => a);
  }

  /**
   * The play area: two stacks of overlapping cards above the Fate deck.
   *
   * A stack is one action and everything modifying it -- the card half staged at its base, then the
   * slates assigned to that half. Primary on the left, secondary on the right, so where a card sits
   * *is* what it is doing; there is no stamp to read and no order to remember. A stack stands
   * without an action card too, because gear is equipped long before a hand is dealt.
   *
   * Only the front card reads in full; the rest show their names above it. The carousel turns the
   * stack over rather than taking it apart.
   */
  #playArea() {
    const system = this.actor.system;
    const blocked = system.blockedIcons ?? new Set();
    const dazed = (system.activeConditions ?? []).some(c => c.key === "dazed");

    return ["primary", "secondary"].map(half => {
      const cards = [];

      const entry = this.staged.find(s => s.half === half);
      const base = entry ? this.#actionCard(entry, half, blocked, dazed) : null;
      if (base) cards.push(base);

      const verbs = this.#verbsOf(half);

      for (const slate of this.#assigned(half)) {
        const item = slate.type === "item";
        const spell = slate.type === "spell";
        /*
         * Movable when there is a choice to make: a slate with two verbs has to be told which
         * half it serves, and a slate competing with another for the same verb has to be told
         * whether it is the one. Everything else serves whatever needs it.
         */
        const movable = item
          && (slate.system.availableVerbs.length > 1 || this.#competes(slate));
        /*
         * **An offered feature can be waved away and a spent one cannot**, because a spent one is
         * a record rather than a suggestion: it is in the stack to say the ability was used, and a
         * remove button on that would offer to un-spend it.
         */
        const offered = (slate.type === "feature" && !slate.system.drained) || spell;
        /*
         * **A card with a cross on it does not say "always on".**  [2026-11-22]
         *
         * `#featureCard` writes *Passive -- always on* for a feature that costs nothing, which was
         * true while a passive feature could never be in a stack. It is in one now, and it can be
         * taken out of one, so the note has to say what it is doing here and what it is worth --
         * the number being the whole reason it was brought in rather than left to apply in silence.
         */
        const boost = slate.type === "feature" && !slate.system.isActive
          ? slate.system.bonus?.value ?? 0 : 0;
        cards.push(Object.assign(
          item ? this.#itemCard(slate, true)
            : spell ? this.#spellCard(slate) : this.#featureCard(slate),
          {
            slate: true,
            // A feature is in a stack only because it has been used, so fading it says nothing.
            disabled: item && slate.system.drained,
            // An arrow that points, not one that swaps: the rules already spend ⇄ on Ready.
            moveTo: movable ? (half === "primary" ? "secondary" : "primary") : null,
            moveArrow: half === "primary" ? "→" : "←",
            ...(offered ? { waveId: slate.id, assisted: true } : {}),
            ...(boost ? { note: `${boost > 0 ? "+" : ""}${boost} in this action` } : {}),
            tip: slate.system.drained && item
              ? `Disabled until it recharges: ${slate.system.rechargeLabel ?? "—"}. `
                + "Click to put it back in the Items deck."
              : offered
                ? "Put here for this action because it can serve it. Click the cross to leave "
                  + "it out."
                : `In the ${half} stack. Click to put it back in its deck.`
          }));
      }

      /*
       * **And the conditions that bear on this half, which have no cross.**
       *
       * Last in the stack, so they read as the circumstances of the action rather than part of it,
       * and `fixed` so the template gives them no control at all. A condition is not a choice --
       * it has a duration and ends when the duration does (core-rules 7) -- and the one thing this
       * panel must not offer is declining the Dazed you are carrying.
       */
      for (const c of this.#conditionsFor(half, verbs)) {
        const rule = CARDRPG.conditions[c.key] ?? {};
        const blocked = (rule.blocks ?? []).some(icon =>
          verbs.some(v => CARDRPG.verbs[v]?.icon === icon));
        cards.push({
          id: `condition.${c.key}`,
          name: game.i18n.localize(rule.label ?? c.key),
          icon: rule.icon,
          /* Keyed, because a condition has no document to carry an `img`. */
          art: conditionArt(c.key),
          slate: true,
          fixed: true,
          condition: true,
          // The one that stops the action reads as stopped, which is what a player needs first.
          disabled: blocked,
          lines: [blocked ? "This action cannot be played while it lasts." : ""].filter(Boolean),
          note: c.duration === null || c.duration === undefined
            ? "No duration"
            : `${c.duration} round(s)${c.value ? ` · ${c.value}` : ""}`,
          tip: "A condition, not a choice: it is here because it changes this action, and it "
            + "cannot be taken out."
        });
      }

      // Where each card sits before the carousel turns anything, so clicking a name can turn to it.
      cards.forEach((card, slot) => { card.slot = slot; });

      // Rotate so the card the carousel landed on is drawn last, which puts it in front.
      const n = cards.length;
      const top = n ? ((this.tops[half] % n) + n) % n : 0;
      return {
        half,
        label: half === "primary" ? "Primary" : "Secondary",
        count: n,
        // How far the stack reaches, in cards, so the CSS can give it a height.
        span: Math.max(1, n),
        cards: cards.map((_, k) => cards[(top + 1 + k) % n]),
        carousel: n > 1
      };
    });
  }

  /**
   * **What the half staged here is actually trying to do.**
   *
   * A half is a list of steps and each step names a verb, so one half can want two things --
   * *Lunge* is a Move and then a Strike. All of them come back, because the assist has to answer
   * for every one: a card that moves and strikes still wants the weapon.
   *
   * Empty when nothing is staged, which is the common case before a hand is dealt, and the reason
   * the assist adds nothing then. Gear sitting in a stack with no action above it is a state the
   * play area already supported on purpose -- *a stack stands without an action card too, because
   * gear is equipped long before a hand is dealt* -- and guessing at it would fill both stacks
   * before the turn began.
   */
  #verbsOf(half) {
    const entry = this.staged.find(s => s.half === half);
    if (!entry) return [];
    const card = deckOf(this.actor, "actionHand")?.cards.get(entry.cardId);
    const steps = card?.system?.[half] ?? [];
    return [...new Set(steps.map(s => s.verb).filter(Boolean))];
  }

  /**
   * **The conditions that bear on this half, and no others.**
   *
   * *Relevant* has to mean something narrow, or the stack fills with every condition a character
   * is carrying -- and a stack that shows everything shows nothing. Every test below is read off
   * a **config flag** rather than a list of keys, which is the arrangement the tray already uses
   * for Dazed, Stunned and Halted; the note on those says why, and it is this project's commonest
   * finding: a flag nothing reads is a flag that is not true.
   *
   * - `blocks` names **icons**, and a verb carries its icon, so this is the exact test for *the
   *   thing you are about to click cannot happen*. Grappled blocks `boot-prints`, Silenced blocks
   *   `magic-swirl`, Disarmed blocks `school-bag`. It is the most worth showing of the seven.
   * - a **carried bonus** for one of the half's verbs -- a tattoo's `graven`, which is where a
   *   spell's bonus goes now.
   * - `halvesMove` or `reducesMove`, when the half moves.
   * - `blocksTurn`, which takes everything.
   * - `blocksSecondary`, when this is the secondary.
   * - `drawsWithDisadvantage`, `grantsAdvantage` and `temporaryFate`, which change the draw on
   *   any action rather than on a named one. Blessed and Cursed are in the game precisely to be
   *   remembered at this moment and are the easiest thing on a sheet to forget.
   */
  #conditionsFor(half, verbs) {
    const icons = new Set(verbs.map(v => CARDRPG.verbs[v]?.icon).filter(Boolean));
    const moves = verbs.includes("move");
    return (this.actor.system.activeConditions ?? []).filter(c => {
      const rule = CARDRPG.conditions[c.key];
      if (!rule) return false;
      if ((rule.blocks ?? []).some(icon => icons.has(icon))) return true;
      if (c.bonus?.value && verbs.includes(c.bonus.verb)) return true;
      if (moves && (rule.halvesMove || rule.reducesMove)) return true;
      if (rule.blocksTurn) return true;
      if (rule.blocksSecondary && half === "secondary") return true;
      return !!(rule.drawsWithDisadvantage || rule.grantsAdvantage || rule.temporaryFate);
    });
  }

  /**
   * **The features that could be used on this half right now.**
   *
   * Ready rather than drained, and either unfussy about the verb or asking for one this half has.
   * A feature already used is in the stack for a different reason -- it shows what was spent --
   * and `#assigned` keeps that case.
   *
   * **Offered, not imposed**, and that is the one line between these and the conditions above: a
   * feature is something you choose to use, so an assist that used it for you would be playing the
   * turn. The line is between *yours* and *done to you*, and it is worth being able to say in one
   * sentence, because it is the only thing deciding which of these has a remove button.
   */
  #featuresFor(verbs) {
    return this.actor.items.filter(f => {
      if (f.type !== "feature" || !f.system.ready) return false;
      if (this.waved.has(f.id)) return false;
      const verb = f.system.bonus?.verb;
      return !verb || verbs.includes(verb);
    });
  }

  /**
   * **The half the player clicked first.**  [BUILT 2026-11-22]
   *
   * A bonus that applies once has to apply to something, and *the primary* was the wrong answer:
   * the order you click is the order the halves resolve, so a player who stages a secondary Strike
   * and then a primary one was told the feature rode with the half that goes second. The first card
   * selected is the one carrying the swing, and it is the one a player would say it rides with.
   */
  #leadHalf() {
    return this.staged[0]?.half ?? "primary";
  }

  /**
   * **The free features that will boost this verb**, with the item that has to satisfy them.
   *
   * *Free* is the whole filter: a passive feature costs nothing to use, so bringing it in is not a
   * decision anybody would make differently, and leaving it out of the stack meant the one number
   * the player cares about -- what this Strike actually does -- was assembled out of sight. Strong
   * is +1 damage on a heavy Strike and had never once appeared in the play area.
   *
   * An **active** feature is a different thing and stays where it was: it Drains when used, so it
   * is offered rather than assumed, and `#featuresFor` is still what offers it.
   *
   * **The tag is tested against the item that will serve**, not against the character. Strong wants
   * a heavy weapon, so a hero holding a dagger must not be shown a +1 they will not get -- and
   * since this is the same predicate the resolver uses, the stack and the chat card cannot
   * disagree about it.
   */
  #freeBoostsFor(verb, item) {
    return this.actor.items.filter(f => {
      if (f.type !== "feature" || f.system.isActive) return false;
      if (this.waved.has(f.id)) return false;
      const bonus = f.system.bonus;
      if (!bonus?.value || bonus.verb !== verb) return false;
      return !bonus.requiresTag || itemMeets(item, { tag: bonus.requiresTag });
    });
  }

  /** Those features across every verb this half is trying to do, each listed once. */
  #boosts(half, verbs) {
    const out = [];
    for (const verb of verbs) {
      for (const f of this.#freeBoostsFor(verb, this.#itemFor(verb, half))) {
        if (!out.includes(f)) out.push(f);
      }
    }
    return out;
  }

  /**
   * **What the resolver is allowed to count, as the stack shows it.**  [BUILT 2026-11-22]
   *
   * One rule asked in one place, because three callers need the same answer and they must not drift:
   * this builds the stack in `#assigned`, prints the number on the card face in `#stepFace`, and is
   * handed to `resolveAttack` when the half is played. A face that promises 4 and a chat card that
   * delivers 3 is the defect that made all of this worth doing.
   *
   * **An empty Set, not null, off the lead half.** `collectBonuses` reads null as *no opinion, count
   * everything* -- which is what a creature wants -- so the second Strike of a turn has to say
   * *these, and there are none* rather than say nothing at all.
   */
  #usingFor(half, verb, item) {
    if (this.#leadHalf() !== half) return new Set();
    return new Set([
      ...this.#freeBoostsFor(verb, item).map(f => f.id),
      ...this.#featuresFor([verb]).map(f => f.id)
    ]);
  }

  /**
   * The slates assigned to a half.
   *
   * An item that could modify more than one action sits in the stack it was put in; one with a
   * single verb had nothing to choose, and a used feature has no half at all, so both ride with
   * the primary.
   */
  #assigned(half) {
    /*
     * The spent ones, which are a record rather than a suggestion: a Drained active feature is in
     * the stack to say the ability was used. That is true whether or not a card is staged above it,
     * so it is the one thing here that does not wait for one.
     */
    const spent = half === "primary"
      ? this.actor.items.filter(f => f.type === "feature" && f.system.isActive && f.system.drained)
      : [];

    /*
     * **A stack is an action, so nothing joins one until a half is staged.**  [MOVED 2026-11-22]
     *
     * This used to put every equipped item in a stack the moment it was equipped, on the argument
     * that gear is in your hand long before a hand is dealt and the stack should say so. What that
     * produced for the starter Warrior was **a Longsword, a Wooden Shield and a Healing Potion
     * standing in the primary before the fight began** -- three cards that are not an action, in
     * the panel whose whole job is to show the action. The potion is the one that gives it away:
     * nothing about a Strike wants it, and it sat there every turn regardless.
     *
     * The gear is already listed in the **Items** deck on the left, equipped or not, and equipping
     * is the character sheet's job. So the stack is now assembled from the staged half downwards:
     * the action, then what serves it.
     */
    const verbs = this.#verbsOf(half);
    if (!verbs.length) return spent;

    /*
     * **Only the gear that can do what this half is doing.** A shield defends and a potion is
     * drunk; neither has anything to say about a Strike. Read off the item's own verbs rather than
     * a list here, so an item that gains a line gains a stack to appear in.
     */
    /*
     * And not the ones an earlier half already spent: a sword swung on the first Strike is not
     * available to the second, so leaving it drawn in both stacks would have the panel promising
     * a weapon the resolver will not hand over.
     */
    const claimed = new Set(verbs.flatMap(v => [...this.#claimed(half, v)]));
    const items = this.actor.items.filter(i =>
      i.type === "item" && i.system.equipped
      && !CARDRPG.slots[i.system.equippedSlot]?.worn
      && !CARDRPG.slots[i.system.equippedSlot]?.stows
      && this.#stackOf(i) === half
      && !claimed.has(i.id)
      && (i.system.availableVerbs ?? []).some(v => verbs.includes(v)));

    /*
     * **The default formula**, which a Cast has nothing else in front of it: a prepared spell sits
     * in a spell slot, and a slot is not a stack. What the default WEAPON does instead is settle
     * which of two, over in `#itemFor`.
     */
    const spell = verbs.includes("cast") ? this.actor.system.defaultFor("cast") : null;

    /*
     * **And the features, on the first half the player clicked.** Both kinds ride with the lead
     * half rather than with the primary, and only one of them: a bonus that applies once would
     * otherwise be drawn twice in a two-half turn and counted twice in `collectBonuses`.
     */
    const lead = this.#leadHalf() === half;
    const boosts = lead ? this.#boosts(half, verbs) : [];
    const offered = lead
      ? this.#featuresFor(verbs).filter(f => !spent.includes(f) && !boosts.includes(f))
      : [];

    return [
      ...items,
      ...(spell && !this.waved.has(spell.id) ? [spell] : []),
      ...spent,
      ...boosts,
      ...offered
    ];
  }

  /**
   * **Does another equipped slate do the same job as this one?**
   *
   * Two different questions were being answered by one test. *Choosy* -- more than one verb of
   * its own -- is about whether a slate has to be told which half to serve: a longsword strikes
   * and defends, so it must be placed. **Competing** is about whether the player has a choice to
   * make at all, and a dagger with one verb can still be the wrong dagger.
   *
   * The gap that found this: two **strike-only** weapons were both unchoosy, so neither got an
   * arrow, both sat in the primary, and the engine simply took the better-valued one. The only
   * way to pick the other was the default star -- a standing choice, which is the wrong shape for
   * *this turn I want the axe*. A hand axe and a dagger are a real decision and the tray gave no
   * way to make it.
   */
  #competes(item) {
    const mine = new Set(item.system.availableVerbs ?? []);
    if (!mine.size) return false;
    return this.actor.items.some(other => other.id !== item.id
      && other.type === "item" && other.system.equipped
      && !CARDRPG.slots[other.system.equippedSlot]?.stows
      && (other.system.availableVerbs ?? []).some(v => mine.has(v)));
  }

  /**
   * Which stack a played item is shown in. Resolution uses #itemFor, which is subtler than this.
   *
   * The role if it has one, and the primary otherwise -- which is what the old special case for
   * single-verb items already did, since an item nobody has moved has no role. Dropping the case
   * is what lets a competing one-verb weapon stay where it is put.
   */
  #stackOf(item) {
    return this.roles.get(item.id) ?? "primary";
  }

  /** The staged half, as the card at the base of its stack. */
  #actionCard(entry, half, blocked, dazed) {
    const card = deckOf(this.actor, "actionHand")?.cards.get(entry.cardId);
    if (!card) return null;
    const face = this.#renderCard(card, blocked, dazed).halves.find(h => h.name === half);
    return {
      id: card.id,
      name: cardName(card),
      /*
       * **The picture, which this one card has never worn.**  [FIXED 2026-11-22]
       *
       * Every other card in the stack sets it -- an item, a spell, a feature, even a condition --
       * and the card the stack is BUILT ON did not, so the play panel drew a bare slab under a
       * column of pictures. It went unseen because no test had ever staged a half while looking at
       * the panel: the probe opened the tray, found the gear that used to stand there unasked, and
       * every card it could see wore its art. Staging one was what asked the question.
       */
      art: artOf(card),
      action: true,
      icon: face?.icon,
      lines: [face?.text ?? "—"],
      costs: face?.costs ?? [],
      // Play order is still click order, so the base card says where it falls in the turn.
      note: `${half} half · step ${this.staged.findIndex(s => s.half === half) + 1}`,
      tip: "The action this stack builds. Click to take it back — the stack goes with it."
    };
  }

  /**
   * One spell, as a card. Only a prepared one is clickable; the rest are the book.
   *
   * The lines read the step rather than prose, so a formula whose numbers are edited in content
   * says the new numbers here without anything being rewritten -- the same reason a card face is
   * rendered from data and never from a stored image (data/cards.mjs).
   */
  #spellCard(slate) {
    const e = slate.system.effect ?? {};
    const lines = [];
    const verb = e.verb
      ? game.i18n.localize(CARDRPG.verbs[e.verb]?.label ?? CARDRPG.effects[e.verb]?.label ?? e.verb)
      : "";
    const value = e.mod ?? null;
    if (verb || value !== null) lines.push(`${verb}${value ? ` ${value}` : ""}`.trim());
    if (e.condition) {
      const cfg = CARDRPG.conditions[e.condition] ?? {};
      const fierce = cfg.valued ? ` ${Math.max(1, e.intensity ?? 1)}` : "";
      lines.push(`${game.i18n.localize(cfg.label ?? e.condition)}${fierce}`
        + ` (${Math.max(1, e.duration ?? 1)})`
        + (e.resist
          ? ` \u00b7 resist ${game.i18n.localize(CARDRPG.approaches[e.resist]?.label ?? e.resist)}`
            + ` ${e.dc ?? CARDRPG.difficulties.normal}`
          : ""));
    }
    if (e.range) lines.push(`Range ${e.range}`);
    if (e.text) lines.push(e.text);

    /*
     * **The whole price, through the one call that charges it.**  [FIXED 2026-11-21]
     *
     * This read `cost.health` and nothing else, which was accurate while Health was the only price
     * collected and became a lie the moment three more were: a card that says *1 slot* for *The
     * Charge* is a card that does not mention the two cards it is about to take out of your hand.
     * The Wild was invisible here too, and had been since Shadow Magic's price was built.
     *
     * `spellPrice` is what `payToCast` charges, so the card cannot promise a different bill from
     * the one the click presents -- including a scaled price, which moves as the line forms.
     */
    const price = spellPrice(this.actor, slate);
    const words = priceWords(price);
    const costs = words.length ? words.join(", ") : "";
    const prepared = slate.system.prepared;
    /*
     * **And whether it has already been cast.**  **[BUILT 2026-11-24]** A cast consumes the
     * preparation (`payToCast`), so a prepared spell has two states now and the card has to say
     * which: in your head, or in your head and used up. `drained` is the field, because that is
     * what *Spent* means on a thing that was never in your hand -- the same one Ward Magic's
     * counterspell has always written.
     */
    const spent = !!slate.system.drained;
    /*
     * **The timing, printed and enforced in the same breath.**  [BUILT 2026-11-21]
     *
     * The label existed in the lang file and nothing had ever shown it, which is half of why the
     * field could stay inert for so long: a player could not see that *The Long Masquerade* was an
     * out-of-combat spell, so nobody noticed it could be cast in a fight.
     *
     * A spell the moment refuses is `passive` -- the one state this card already has for *not
     * clickable, and the tip says why* -- rather than a second greyed state meaning something
     * subtly different. What changes is the reason, and the reason is the whole of the information.
     */
    const timing = slate.system.effect?.timing ?? "";
    const rule = timing ? CARDRPG.timings[timing] : null;
    const when = rule ? game.i18n.localize(rule.label) : "";
    const fight = game.combat?.started ? game.combat : null;
    const notNow = !rule ? ""
      : rule.notInFight && fight ? `${when}: not while the fight is on.`
        : rule.notOnYourTurn && fight && fight.combatant?.actor?.id === this.actor.id
          ? `${when}: it answers somebody else's turn, and this one is yours.`
          : "";
    /*
     * **The state the step waits on, printed and gated the same way.**  [BUILT 2026-11-22]
     *
     * This is the `timing` shape one field along, and for the same reason: *The Empty Deck* reads
     * *you cannot be harmed at all* and is worth a slot for about one turn in a fight, and a
     * player could not see from the card whether this was that turn. Nine values sat in a dropdown
     * and on eleven cards with nothing reading one.
     *
     * `stateHolds` answers `true`, `false` or **`null` for cannot say** -- a creature has no hand
     * -- and only `false` greys the card. A gate that fires on *I do not know* would hide a spell
     * for a reason the player cannot act on, which is worse than printing the rule and trusting
     * them to read it.
     */
    const state = slate.system.effect?.whileState ?? "";
    const whileWords = state ? stateWords(state) : "";
    const held = state ? stateHolds(this.actor, state) : null;
    const notYet = held === false ? `${whileWords}, and you are not.` : "";
    return {
      id: slate.id,
      name: slate.name,
      art: artOf(slate),
      isDefault: this.#isDefault(slate),
      defaultKind: "spell",
      icon: CARDRPG.verbs.cast?.icon ?? null,
      lines: lines.length ? lines : ["\u2014"],
      /* The book is not clickable: you change what is prepared between fights, never during one.
       * Nor is a spell whose moment this is not, nor one whose state you are not in -- nor one
       * already cast, which is the new one. */
      passive: !prepared || spent || !!notNow || !!notYet,
      note: `${slate.system.source || "—"} \u00b7 ${slate.system.strength} slot`
        + `${slate.system.strength === 1 ? "" : "s"}`
        + (costs ? ` \u00b7 costs ${costs}` : "")
        + (spent ? " \u00b7 cast \u2014 back on a long rest" : "")
        + (when ? ` \u00b7 ${when}` : "")
        /* The gate is printed whether or not it holds, and marked when it does: a card that says
         * nothing while the state is true is a card the player has to remember the rule for. */
        + (whileWords ? ` \u00b7 ${whileWords}${held === true ? " \u2014 now" : ""}` : ""),
      tip: !prepared
        ? "In your book. What is prepared changes between fights, not during one."
        : spent
          ? "Cast. The preparation is spent; a long rest puts it back in your head."
          : notNow || notYet
            || `Cast it.${costs ? ` It costs ${costs}.` : ""} The preparation is spent either way.`
    };
  }

  /** One item, as a card. `played` means equipped. */
  /** Is this slate the one the assist reaches for? Read by both panels and both stacks. */
  #isDefault(slate) {
    const defaults = this.actor.system.defaults ?? {};
    return !!slate?.id && (slate.id === defaults.weapon || slate.id === defaults.spell);
  }

  #itemCard(i, played) {
    const verbs = Object.entries(i.system.verbs ?? {}).filter(([, l]) => l.value !== null || l.text);
    // Only a slate that could modify more than one action has a half to choose.
    const choosy = i.system.availableVerbs.length > 1;
    // Where it IS if it is on; where it COULD go if it is not.
    const label = key => game.i18n.localize(CARDRPG.slots[key]?.label ?? key);
    const allowed = i.system.allowedSlots ?? [i.system.slot];
    const slotKey = i.system.equippedSlot ?? allowed[0];
    const slot = CARDRPG.slots[slotKey] ?? {};
    const fighting = !!game.combat?.started;
    const serving = played
      ? verbs.filter(([v]) => ["primary", "secondary"].some(h => this.#itemFor(v, h)?.id === i.id))
        .map(([v]) => v)
      : [];
    return {
      id: i.id,
      name: i.name,
      /* The one the assist reaches for, so the panel says which without being asked. */
      isDefault: this.#isDefault(i),
      defaultKind: "weapon",
      art: artOf(i),
      group: i.system.group || "",
      flippable: true,
      flipped: this.flipped.has(i.id),
      played,
      disabled: i.system.drained,
      // A worn slate is simply on, like a passive feature: it never enters a stack, and in a fight
      // it cannot come off either.
      passive: slot.worn && i.system.equipped,
      tip: slot.worn && allowed.length < 2
        ? (i.system.equipped
          ? `Worn on your ${label(slotKey).toLowerCase()}. Its bonus is simply on.`
          : fighting
            ? `Worn, not wielded: your ${label(slotKey).toLowerCase()} changes between fights, `
              + "not during one."
            : `Click to put it on your ${label(slotKey).toLowerCase()}.`)
        : allowed.length > 1 && !i.system.equipped
          ? `Fits your ${allowed.map(k => label(k).toLowerCase()).join(" or ")}. Click and choose.`
          : CARDRPG.slots[i.system.equippedSlot]?.stows
            ? `Slung on your ${label(i.system.equippedSlot).toLowerCase()}, so it strikes with `
              + "nothing from there. Click to draw it — free, you paid the Ready to sling it."
            : !i.system.equipped && CARDRPG.slots[slotKey]?.freeEquip
              ? `Click to hang it on your ${label(slotKey).toLowerCase()}. No Ready to pay.`
              : played
                ? "In play. Click it to put it back in the Items deck."
                : choosy
                  ? "Click to equip it on the primary stack. You can move it to the secondary from there."
                  : fighting
                    ? "Click to take it out of your pack. That is a Ready."
                    : "Click to equip it.",
      blurb: i.system.blurb,
      /*
       * **[FIXED 2026-11-13] A bare `actor` here, and the whole HUD threw.**
       *
       * `#itemCard` is a method and has no `actor` of its own -- the one at the top of
       * `_prepareContext` is a local in a different function. So every render of the tray
       * died with `ReferenceError: actor is not defined` the moment a character held a single
       * item, which is every character. Nothing in the suite could see it: the name is spelled
       * correctly, it is in scope four hundred lines above, and no check has ever rendered an
       * application. The live harness found it on its first run, trying to click a button it
       * could not find.
       */
      lines: verbs
        // Same question, same asker: the printed range is a derived number now.
        .map(([v, l]) => `${v} ${l.value ?? ""}`
          + ((r => r ? ` \u00b7 range ${r}` : "")(this.actor.system.rangeOnLine(l, i)))
          + `${l.reach ? ` \u00b7 reach ${l.reach}${l.reachMin > 1 ? ` from ${l.reachMin}` : ""}` : ""}`
          + `${l.area ? ` \u00b7 ${l.areaKind || "blast"} ${l.area}` : ""}`)
        .concat(i.system.armor ? [`armor ${i.system.armor}`] : []),
      // Which verbs this item is actually serving, so two weapons are never ambiguous. A verb is
      // the whole phrase -- "serving use" reads badly, "the Use half" reads as the thing it is.
      note: serving.length
        ? `serves the ${serving.join(" and ")} half${serving.length > 1 ? "s" : ""}`
        : [...(i.system.tags ?? [])].join(", "),
      facts: [
        { label: "Value", value: `${i.system.value} g` },
        { label: "Weight", value: `${i.system.weight} kg` },
        { label: "Type", value: i.system.kind || "\u2014" },
        {
          label: i.system.equipped ? "In" : "Fits",
          value: i.system.equipped ? label(slotKey) : allowed.map(label).join(" / ")
        }
      ]
    };
  }

  /**
   * One feature, as a card.
   *
   * A feature is never in or out of play -- it is part of you. A passive one is simply true; an
   * active one can be used, which disables it for a while. So the only state it has is available
   * or disabled, and neither is something you can undo by hand.
   */
  #featureCard(f) {
    const passive = !f.system.isActive;
    const disabled = f.system.drained;
    const recharge = f.system.rechargeLabel ?? "\u2014";
    return {
      id: f.id,
      name: f.name,
      art: artOf(f),
      group: f.system.group || "",
      disabled,
      // Nothing to click on either: a passive feature has no use, a disabled one is spent.
      passive: passive || disabled,
      tip: passive ? "Passive: always on, nothing to use."
        : disabled ? `Used. Disabled until it recharges: ${recharge}.`
          : "Click to use it. That disables it until it recharges.",
      lines: [f.system.text].filter(Boolean),
      note: passive ? "Passive \u2014 always on"
        : disabled ? `Disabled \u00b7 recharges ${recharge}`
          : `Recharges: ${recharge}`
    };
  }

  /**
   * The three decks stacked down the left: Items, Features, Conditions.
   *
   * Items and features are slates, not cards -- they are never shuffled or drawn. They are shown
   * as decks because they are the same printed size and a stack is how you hold them at a table.
   */
  #leftDecks() {
    /*
     * **The Items deck is what you have equipped.**  **[RULED 2026-11-23]**
     *
     * The count was everything owned and the spread was everything NOT in play, which is two
     * different decks sharing one label and one back. A goblin carrying a single equipped knife
     * read **1 Items** and opened on nothing at all; a character read their whole inventory and
     * opened on the part of it they had put away.
     *
     * The HUD is the surface you play from and the sheet is where you own things, so the deck is
     * the gear that is in your hands, on your back and on your belt -- and the count and the
     * spread are now the same question asked twice. Equipping stays the character sheet's job:
     * this shows the answer and does not offer to change it.
     */
    const items = this.actor.items.filter(i => i.type === "item" && i.system.equipped);
    const features = this.actor.items.filter(i => i.type === "feature");
    const spells = this.actor.items.filter(i => i.type === "spell");
    const conditions = this.actor.system.activeConditions ?? [];

    return [
      {
        id: "items", label: "Items", count: items.length,
        tip: "Your gear. Turn a card over for its value, weight and type."
      },
      {
        id: "features", label: "Features", count: features.length,
        tip: "Passive ones are simply true; an active one Drains when used."
      },
      /*
       * A fourth deck, and it is a deck rather than a rail for a reason: unprepared spells are the
       * book, and the book is most of what a caster owns. The count is what you can CAST, because
       * a number that included the book would tell a player the opposite of what they need.
       */
      ...(spells.length ? [{
        id: "spells",
        label: "Spells",
        count: spells.filter(s => s.system.prepared).length,
        tip: `${spells.filter(s => s.system.prepared).length} prepared, `
          + `${spells.filter(s => !s.system.prepared).length} in the book. `
          + `${this.actor.system.spellSlots?.free ?? 0} of `
          + `${this.actor.system.spellSlots?.max ?? 0} slots free.`
      }] : []),
      {
        id: "conditions", label: "Conditions", count: conditions.length,
        tip: "What is on you. A duration runs out at the end of its creator's next turn."
      }
    ].map(d => ({
      ...d,
      open: this.openPiles.has(d.id),
      /*
       * **A shut pile is a face-down deck, so it wears that deck's back.** Read for the shut state
       * only: an open pile is showing its cards, and a back behind them is a picture nobody can
       * see paid for in a texture load. `pileBack` owns the pile-id-to-deck-key mapping.
       */
      art: this.openPiles.has(d.id) ? "" : pileBack(d.id)
    }));
  }

  /**
   * **Which side is showing**: what was pinned, or what the mode implies.
   *
   * A monster has no skill deck and makes no checks of its own (core-rules 9), so it is always on
   * the action side whatever anybody pinned -- which also keeps the toggle off its HUD, because a
   * control with one state is a label.
   */
  #sideNow() {
    if (this.actor.type === "npc") return "action";
    return this.side ?? (game.combat?.combatants.some(c => c.actor?.id === this.actor.id)
      ? "action" : "skill");
  }

  /**
   * The skill deck in the bottom-left corner, where the action deck sits on the other side.
   *
   * **It deals, which it used to refuse to do.**  **[CHANGED 2026-11-23]**
   *
   * It was deliberately inert: skill-rules 1 says the GM says when a new scene starts, so dealing
   * lived on the scene panel's *New scene* button and the corner was a count and a back. The
   * argument confused **who decides** with **where you press**. The action deck in the same
   * corner on the other side of the window deals when you click it, and a player who had learned
   * that reached for the skill deck and got nothing -- in a corner whose entire job is to be the
   * deck you are playing from.
   *
   * Who decides has not moved: `#onDealSkills` still turns a player away, and still says why.
   * The GM now has two places to press rather than one, which is what a deck back should mean.
   */
  #skillDeck() {
    const deck = deckOf(this.actor, "skill");
    const discard = deckOf(this.actor, "skillDiscard");
    const hand = deckOf(this.actor, "skillHand");
    const full = (hand?.cards.size ?? 0) >= CARDRPG.defaults.skillHandSize;
    return {
      label: "Skill deck",
      count: deck?.cards.size ?? 0,
      /* Dimmed on a full hand for the same reason the action deck dims on a dealt one: there is
       * nothing more to come out of it, and a lit deck that draws nothing is a broken promise. */
      spent: full,
      art: backOf("skill"),
      state: full ? "hand full" : `${discard?.cards.size ?? 0} discarded`,
      tip: full
        ? "Your skill hand is already full. The discard comes back on a rest."
        : "Your skill deck. Click to deal a new scene's hand \u2014 the GM's call \u2014 and the "
          + "discard comes back on a rest rather than on a shuffle."
    };
  }

  /**
   * The action deck, in the bottom-left corner. Clicking it deals a hand; it then goes inert until
   * the next turn, because the hand refills once a round and dealing repeatedly would just be
   * drawing your deck away.
   */
  #actionDeck(combat) {
    const dealt = CardRPGTray.#dealtThisTurn(this.actor, combat);
    return {
      label: "Action deck",
      count: this.actor.system.deckCounts?.draw ?? 0,
      spent: dealt,
      /*
       * **The back, which this deck never had.** The three piles beside it have worn theirs since
       * `pileBack` was written; this one was built from a different object in a different method
       * and the field was simply never added, so the one deck a player looks at every turn was the
       * one showing the bare hatch. `backs/action.webp` has existed the whole time.
       */
      art: backOf("action"),
      // The deck says what it will do next, under its name.
      state: dealt ? "cards dealt" : "draw",
      tip: dealt
        ? "Already dealt this turn. You draw again next turn."
        : "Deal a hand, up to your hand size."
    };
  }

  /**
   * **The three piles the turn draws on and fills, under the button that resolves it.**
   * **[MOVED 2026-11-22]**
   *
   * They were icon counters at the end of the vitals row, and 3.8 argued for that: a deck back
   * promises a pile you can draw on, none of these is drawn from by hand, and the column had no
   * height to spare. The argument was sound and the result was that **nobody could find their
   * discard.** A number beside a heart and a shield reads as a statistic; what a player is
   * actually asking is *where did that card go*, which is a question about a place, and the
   * answer has to be a place.
   *
   * So they are backs again, in a row of three under the Play button -- a third of the column's
   * width each, which is the one thing 3.8 was right about: at full card size this cost two
   * card-heights the column could not spare and sat under Foundry's own toasts.
   *
   * The fate deck itself still cannot be opened: it is shuffled and face down, and that is the
   * whole reason a thin deck is a risk rather than a lookup. Its discard is face up, which is
   * what makes counting possible.
   */
  #pileLinks() {
    const counts = this.actor.system.deckCounts ?? {};
    const swing = counts.fate ? Math.min(100, Math.round(200 / counts.fate)) : null;
    const breath = CARDRPG.defaults.breathRecovery;

    const links = [
      {
        id: "fateDiscard", label: "Fate", count: counts.fate ?? 0,
        tip: `Fate deck: ${counts.fate ?? 0} face down, ${counts.fateDiscard ?? 0} drawn`
          + (swing ? `, ${swing}% chance the next is a swing` : "")
          + ". Click to look through the discard."
      },
      {
        id: "actionDiscard", label: "Discard", count: counts.discard ?? 0,
        tip: "Your discard pile. It cycles back into your deck for free while you have stamina "
          + `left, and Catch Breath buys ${breath} stamina rather than taking anything from here. `
          + "Nothing in it is lost. Click to look through it."
      }
    ];

    // Spent appears only once it has something in it, so it means something when it is there.
    if (counts.spent) {
      links.push({
        id: "actionSpent", label: "Spent", count: counts.spent,
        tip: "Out of the fight. Spent cards come back on a short or long rest. Click to look "
          + "through them."
      });
    }

    /* A shut pile wears its deck's back and an open one is showing its cards, exactly as the
     * left-hand column does; `pileBack` owns the mapping for both. */
    return links.map(l => ({
      ...l, icon: CARDRPG.pileIcons[l.id], open: this.openPiles.has(l.id),
      art: this.openPiles.has(l.id) ? "" : pileBack(l.id)
    }));
  }

  /**
   * **Every open deck, each spread beside the deck it came from.**  **[CHANGED 2026-11-23]**
   *
   * Two things were wrong and both of them were this method returning one object. A spread was
   * drawn in a single band at the top of the screen, so a card turned over from the **Conditions**
   * deck appeared three rows above it, level with **Items** -- an answer with no question beside
   * it, which at the table reads as the wrong deck having opened. And opening a second deck shut
   * the first, because one object is one place.
   *
   * So: a list, in the order the decks are drawn in -- the left column top to bottom, then the
   * piles under the Play button -- and `#fitSpreads` puts each row against its own back. The
   * order matters more than it looks: the rows tile down the screen in the same sequence as the
   * column, so nothing crosses over anything else on its way to where it belongs.
   *
   * @param {object[]} decks  The deck objects already built for the template, in drawing order.
   */
  #viewers(decks) {
    if (!this.openPiles.size) return [];
    return decks.filter(d => this.openPiles.has(d.id)).map(d => this.#viewerFor(d.id));
  }

  /**
   * One open deck's contents. The label is the whole heading, because what a spread is holding
   * differs per deck and a suffix fixed in the template could only ever be right about one.
   */
  #viewerFor(id) {
    if (id === "items") {
      /*
       * **What is equipped**, which is what the back now counts. It used to be the opposite --
       * everything out of play, on the argument that what is in play is already on the scene --
       * and the argument was about the two stacks, which hold the gear serving the action you
       * have staged. Gear you are carrying but not swinging this instant is in neither, so the
       * one deck labelled Items showed you the things you had put away.
       */
      const cards = this.actor.items
        .filter(i => i.type === "item" && i.system.equipped)
        /*
         * **A reference, not a control.** Equipping is the character sheet's job, so there is
         * nothing here to click a card into -- and a card that looks takeable and takes nothing
         * is worse than one that does not. The star and the flip still work: choosing which
         * sword the assist reaches for, and turning a card over for value and weight, are both
         * reading rather than equipping.
         */
        .map(i => ({
          ...this.#itemCard(i, true),
          passive: true,
          tip: "Equipped. What you carry is set on the character sheet."
        }));
      return { id, label: "Items \u2014 equipped", count: `${cards.length}`, cards };
    }

    if (id === "features") {
      // Every feature, always: none of them is ever out of play, so none of them is ever missing.
      const cards = this.actor.items
        .filter(i => i.type === "feature")
        .map(f => this.#featureCard(f));
      return { id, label: "Features", count: `${cards.length}`, cards };
    }

    if (id === "spells") {
      /*
       * Prepared first, because those are the ones you can do something with, and the book after
       * -- greyed, because *the caster who prepared the wrong spells has prepared the wrong
       * spells* is the whole point of a slot budget and the sheet should not soften it.
       */
      const order = (a, b) => (b.system.prepared ? 1 : 0) - (a.system.prepared ? 1 : 0)
        || a.name.localeCompare(b.name);
      const cards = this.actor.items.filter(i => i.type === "spell").sort(order)
        .map(s => this.#spellCard(s));
      return { id, label: "Spells \u2014 prepared first", count: `${cards.length}`, cards };
    }

    if (id === "conditions") {
      const cards = (this.actor.system.activeConditions ?? []).map((c, index) => {
        const cfg = CARDRPG.conditions[c.key] ?? {};
        const creator = c.creatorId ? game.actors.get(c.creatorId)?.name : null;
        return {
          id: `condition-${index}`,
          name: game.i18n.localize(cfg.label ?? c.key),
          icon: cfg.icon,
          art: conditionArt(c.key),
          harm: true,
          passive: true,
          lines: [
            ...(c.value ? [`Intensity ${c.value}`] : []),
            c.duration ? `Duration ${c.duration}` : "No duration"
          ],
          note: creator
            ? `Ticks down on ${creator}'s turn`
            : (cfg.derived ? "From carried weight" : "Ticks on your own turn")
        };
      });
      return { id, label: "Conditions", count: `${cards.length}`, cards };
    }

    const stack = deckOf(this.actor, id);
    const labels = { actionDiscard: "Discard", fateDiscard: "Fate discard", actionSpent: "Spent" };
    const cards = (stack?.cards.contents ?? []).map(c => ({
      id: c.id,
      name: cardName(c),
      harm: isIntruder(c),
      /* One creature's own card, which is the one worth spotting in a hand. */
      sole: isSole(c.system),
      flipped: false,
      // A discard is a record, not a slate: there is nothing to put into play.
      passive: true,
      lines: [cardLine(c)]
    }));
    return { id, label: labels[id] ?? id, count: `${cards.length}`, cards };
  }

  /**
   * The scene side: the skill hand, the six passive scores, and the counts.
   *
   * **Values are not pre-resolved here**, and that is the one real difference from the combat tray
   * (hud-spec 5): a tool bonus is situational -- *Shadow +2 (locks)* -- so the card shows its base
   * and the check asks which tool. Combat answers the same question by where the slate sits, and
   * there is no equivalent place to put a lockpick.
   *
   * **A passive score is static.** It is the best card of an approach in the WHOLE deck plus 2,
   * counting the discard, so it does not move during play and renders as a constant rather than a
   * live stat (skill-rules 2).
   */
  #sceneTray() {
    const actor = this.actor;
    const hand = deckOf(actor, "skillHand");
    const deck = deckOf(actor, "skill");
    const discard = deckOf(actor, "skillDiscard");

    const cards = [...(hand?.cards?.contents ?? [])].map(card => ({
      id: card.id,
      name: card.name,
      art: artOf(card),
      wild: !!card.system.wild,
      approach: card.system.wild
        ? game.i18n.localize("CARDRPG.Approach.Any")
        : game.i18n.localize(CARDRPG.approaches[card.system.approach]?.label ?? card.system.approach),
      icon: card.system.wild
        ? CARDRPG.approaches.any?.icon
        : CARDRPG.approaches[card.system.approach]?.icon,
      value: card.system.value,
      edge: card.system.edge ?? "",
      /* Whether this card may answer the call at all: the approach must fit the description, and a
       * wild fits any. Cards that cannot are dimmed rather than hidden, the same way a blocked
       * card half is (hud-spec 3.2) -- hiding them would hide the reason. */
      canAnswer: cardAnswers(card, readCall())
    })).sort((a, b) => b.value - a.value || a.approach.localeCompare(b.approach));

    const call = readCall();
    /*
     * **A dimmed card says why it is dimmed.**  [BUILT 2026-11-15]
     *
     * Dimming in place rather than hiding is the right rule -- hud-spec 3.2, and *hiding it would
     * hide why it cannot be played* is written beside it in the template. But the card then wore
     * the same tooltip as every other one: *Play it: the check asks how hard, which tool, and
     * whether anybody helped.* So the display kept the card in sight in order to explain itself
     * and then explained nothing, and the only way to find out was to click it and read a toast.
     *
     * The same string the click uses, formatted here instead -- a second sentence saying the same
     * thing in slightly different words is how the two come to disagree.
     */
    for (const card of cards) {
      card.answers = !call || card.canAnswer;
      card.why = card.answers
        ? game.i18n.localize("CARDRPG.Check.Playable")
        : game.i18n.format("CARDRPG.Check.WrongApproach",
          { card: card.name, approach: describeCall(call) });
    }

    return {
      cards,
      /*
       * The obstacle in front of the party, which is the GM's half of a check and the half the
       * first build left to the player (skill-rules 2, step 1). A banner rather than a dialog
       * field: it is true until the GM withdraws it, and several characters answer the same one in
       * turn inside a challenge.
       */
      call: call ? { ...call, label: describeCall(call) } : null,
      isGM: game.user.isGM,
      /*
       * The two tracks, as fractions and as widths. A challenge shows only while one is running
       * (hud-spec 5), and both tracks are printed even when one has not moved: *how much can go
       * wrong before this turns ugly* is the number a player is deciding against.
       */
      challenge: (() => {
        const live = readChallenge();
        if (!live) return null;
        const pct = (n, max) => `${Math.min(100, Math.round(100 * n / max))}%`;
        return {
          ...live,
          progressPct: pct(live.progress, live.progressMax),
          pressurePct: pct(live.pressure, live.pressureMax)
        };
      })(),
      twists: game.user.isGM ? twistCounts() : null,
      deck: deck?.cards?.size ?? 0,
      discard: discard?.cards?.size ?? 0,
      full: cards.length >= CARDRPG.defaults.skillHandSize,
      /* Deck and hand both empty is the improvising case, and it is worth saying out loud. */
      improvising: !cards.length && !(deck?.cards?.size ?? 0)
    };
  }

  /**
   * **What the party notices, which is now its own panel.**  [MOVED 2026-11-15]
   *
   * These six numbers used to live at the bottom of the scene section, which meant they were
   * drawn beside the skill hand in the far corner from the character they describe, and vanished
   * the moment a fight started. A passive is read while deciding whether to call for anything at
   * all, so it belongs beside the character panel and not beside the cards.
   *
   * Lifted out of `#sceneTray` to a context key of its own so it does not depend on the scene
   * side being the one on show: the numbers are static (hud-spec 5) and true in both modes.
   */
  #passivePanel() {
    const actor = this.actor;
    const call = readCall();
    return {
    /*
     * **What the party notices, for the GM only.** Not a secret-roll panel: a passive score is
     * static by design (hud-spec 5), which is exactly what makes it safe to read in the open.
     * When a call is live each row is marked against it, because the only rows that need a check
     * are the ones a card could still carry.
     */
    gm: (() => {
      if (!game.user.isGM) return null;
      const open = game.settings.get("cardrpg", "passivesOpen");
      const reading = partyPassives(passiveScore);
      const best = actorName => {
        const actor = game.actors.getName(actorName);
        const hand = actor ? deckOf(actor, "skillHand") : null;
        const cards = [...(hand?.cards?.contents ?? [])];
        if (!cards.length) return 0;
        /* A call may name several approaches, so the best card for it is the best across the
         * ones it accepts: a *Might or Agility* door is answered by whichever of the two this
         * character is better at. */
        const keys = call?.approaches ?? [];
        return Math.max(...cards.map(c => (keys.length
          ? Math.max(...keys.map(k => c.system.worth?.(k) ?? 0))
          : c.system.value) ?? 0));
      };
      return {
        open,
        fromScene: reading.fromScene,
        party: reading.party.join(", "),
        rows: reading.rows.map(row => {
          /* Marked only against a call that names this approach, or an open one: a Wits call
           * says nothing about whether anybody could manage the Might obstacle. */
          const mark = call && (!call.approaches.length || call.approaches.includes(row.key))
            ? readAgainst(row.best, call.dc, best(row.who))
            : "";
          /* The tooltip is built here rather than in the template: three branches of prose in a
           * `data-tooltip` attribute is markup doing arithmetic's job, and the template has one
           * comparison helper where this needs three. */
          const said = {
            over: game.i18n.localize("CARDRPG.Check.PassiveOver"),
            close: game.i18n.localize("CARDRPG.Check.PassiveClose"),
            under: game.i18n.localize("CARDRPG.Check.PassiveUnder")
          }[mark] ?? "";
          return {
            ...row,
            mark,
            tip: `${row.label} ${row.best} — ${row.who}`
              + (said ? ` · ${said}` : "")
          };
        })
      };
    })(),
    /* The six, always all six: a deck that covers every approach is the composition rule. */
    mine: Object.entries(CARDRPG.approaches)
      .filter(([key]) => key !== "any")
      .map(([key, cfg]) => ({
        key,
        label: game.i18n.localize(cfg.label ?? key),
        icon: cfg.icon,
        score: passiveScore(actor, key)
      }))
    };
  }

  /**
   * **Has this figure already been dealt to, for the turn that is running?**
   *
   * **Out of combat the answer is always no**, and that is the whole of this method. The marker
   * is a round:turn key, and out of a fight every turn is `no-combat` -- so a flag written once
   * would have made the deck corner dead for ever, where the tray field it replaced forgot
   * itself whenever the window was closed. A persistent marker needs a clock behind it, and out
   * of combat there is not one.
   *
   * Nothing is lost by letting it be pressed: a refill tops a hand up to size, so pressing it
   * twice draws nothing the second time and says nothing, now that *short* is asked of the hand.
   */
  static #dealtThisTurn(actor, combat) {
    if (!combat) return false;
    return actor.getFlag("cardrpg", "dealtAt") === CardRPGTray.#turnKey(combat);
  }

  /**
   * Round and turn, so the action deck can go inert until the next turn.
   *
   * The format is `turnKey`'s and not this file's: the deal that writes the marker happens in
   * combat.mjs now, and two files spelling one key by coincidence is a key that will be changed
   * in one of them.
   */
  static #turnKey(combat) {
    return turnKey(combat?.round, combat?.turn);
  }

  /**
   * **Has this turn already played that half?**
   *
   * Asked by the chooser and by the renderer, so a half that cannot be staged is a half that does
   * not look playable. Two readers, one predicate: a face that offers what the handler will refuse
   * is the same defect as a face promising a number the resolver will not deliver.
   *
   * **Out of combat nothing is spent at all.**  **[RULED 2026-11-23]**
   *
   * It used to answer out of combat the way it answers in one, on the argument that out of combat
   * every turn is the same turn -- which is true and is the reason this was wrong. *The same turn*
   * never ends, so the first card played outside a fight spent its half **for good**: a hand of
   * five became a hand of three greyed cards and two live reaction rows, and nothing would clear
   * it until a fight started and ended.
   *
   * The budget is a turn's (core-rules 3): one primary and one secondary, because a turn comes
   * round again. Outside a fight there is no turn to spend and nothing to wait for, so there is
   * no budget to enforce -- opening a door and then opening another is two actions in a game that
   * is not counting. `dealtAt` keeps the opposite rule for the opposite reason: a hand dealt once
   * stays dealt because there is no second turn to deal into, which is a fact about drawing and
   * not about spending.
   */
  #halfSpent(name) {
    if (!game.combat?.started) return false;
    if (this.playedAt !== CardRPGTray.#turnKey(game.combat)) return false;
    /* Exhausted is one CARD per turn, not one of each half, so the first played takes both. */
    if (this.actor.system.exhausted) {
      return this.spentHalves.primary || this.spentHalves.secondary;
    }
    return !!this.spentHalves[name];
  }

  /**
   * Fold resolution steps 1-3 into the face: item base, card modifier, features. Steps 4-6 need a
   * target, so they wait until the half is played.
   */
  /**
   * **One step, in both registers.**  [2026-11-14]
   *
   * Pulled out of `#renderCard` because a monster's intent card is a **sequence of steps** and a
   * player's card half is a **list of steps**, and they were about to be two renderers for one
   * vocabulary. The HUD now draws both, so the moment there were two copies a goblin's *Close In*
   * would have printed its Move differently from an *Advance* in a hand -- the same number, cut by
   * the same condition, saying so in one place and not the other.
   *
   * @returns {{text: string, notes: string[], icons: string[], unmet: string, cut: boolean}}
   */
  #stepFace(step, half = "primary") {
    const icons = [];
    /* What this step has to say that the face has no room for. */
    const notes = [];
    let unmet = "";
    let cut = false;

    const icon = CARDRPG.verbs[step.verb]?.icon ?? CARDRPG.effects[step.verb]?.icon ?? null;
    if (icon) icons.push(icon);

    let text = step.verb
      ? game.i18n.localize(CARDRPG.verbs[step.verb]?.label ?? CARDRPG.effects[step.verb]?.label ?? step.verb)
      : "";

    if (step.verb === "strike" || step.verb === "cast") {
      // The face shows the item the player chose, so "Strike 4" is never a guess.
      const item = this.#itemFor(step.verb, half, step.requires);
      /*
       * A kit requirement is printed from the field, never from the card's prose, and the same
       * call that printed the number decided whether anything meets it -- so the face and the
       * click cannot disagree about whether this half is playable.
       */
      const need = requireText(step.requires);
      if (need && !item) unmet = need;
      const base = item?.system.verbs?.[step.verb]?.value;
      if (base !== null && base !== undefined) {
        /* Through the stack, so the face promises exactly what the play will deliver: a waved
         * feature is gone from the number, and the second Strike of a turn is not boosted twice. */
        const using = this.#usingFor(half, step.verb, item);
        text += ` ${base + (step.mod ?? 0)
          + collectBonuses(this.actor, step.verb, item, { using }).total}`;
      } else if (step.mod) text += ` ${step.mod > 0 ? "+" : ""}${step.mod}`;
      /*
       * **The requirement stays on the face, because it decides legality.** *needs a shield* is
       * what you compare cards on; *and nothing you are holding is one* is what the tooltip says
       * once you have noticed.
       */
      if (need) text += ` \u00b7 ${need}`;
      if (item) notes.push(`${item.name} supplies the value.`);
    } else if (step.param !== null && step.param !== undefined) {
      /*
       * Move as it actually plays: halved by Slowed, Burdened or Overloaded, then reduced by
       * Frozen, floored at 0 (core-rules 7). The face has to show the real number -- a Slowed
       * Advance that still reads "Move 3" is a lie the player acts on -- and it has to be able to
       * say what took the squares, which `(was 1)` never could.
       */
      const moved = step.verb === "move"
        ? (this.actor.system.moveAsPlayed?.(step.param) ?? { played: step.param, why: [] })
        : { played: step.param, why: [] };
      text += ` ${moved.played}`;
      if (moved.played !== step.param) {
        cut = true;
        notes.push(`The card prints Move ${step.param}. `
          + `${moved.why.join("; ") || "Something is reducing it"}.`);
      }
    }
    else if (step.mod !== null && step.mod !== undefined) {
      text += ` ${step.mod > 0 ? "+" : ""}${step.mod}`;
    }

    if (step.condition) {
      const label = game.i18n.localize(CARDRPG.conditions[step.condition]?.label ?? step.condition);
      // A valued condition prints its intensity before its duration: Burning 3 (2).
      const fierce = CARDRPG.conditions[step.condition]?.valued
        ? ` ${Math.max(1, step.intensity ?? 1)}` : "";
      text += `${text ? " " : ""}${label}${fierce} (${Math.max(1, step.duration ?? 1)})`;
      /*
       * **The resist clause is a sentence, so it is a tooltip.** It is the longest thing a
       * condition step can carry and it changes nothing about which card you would rather play:
       * every condition in the game is resisted the same way, and only the number moves.
       */
      if (step.resist) {
        const approach = CARDRPG.approaches[step.resist];
        notes.push(`${label} is resisted with a `
          + `${game.i18n.localize(approach?.label ?? step.resist)} check against `
          + `${step.dc ?? CARDRPG.difficulties.normal}.`);
      }
      const mark = CARDRPG.conditions[step.condition]?.icon;
      if (mark) icons.push(mark);
    }

    /*
     * The combo clause. Printed after the verb and the condition, because that is the order it is
     * read in: what the step does, then what it does extra against an opening. The numbers and the
     * keyword stay on the face; the author's wording goes behind it.
     */
    if (step.when?.needs) {
      const w = step.when;
      const opening = game.i18n.localize(CARDRPG.conditions[w.needs]?.label ?? w.needs);
      const printed = [];
      if (w.mod) printed.push(`${w.mod > 0 ? "+" : ""}${w.mod}`);
      if (w.advantage) printed.push(game.i18n.localize(CARDRPG.effects.advantage?.label ?? "advantage"));
      const behind = [...printed];
      if (w.dc) behind.push(`resist ${w.dc}`);
      if (w.text) behind.push(w.text);
      if (printed.length) text += `${text ? " " : ""}vs ${opening}: ${printed.join(", ")}`;
      else if (behind.length) text += `${text ? " " : ""}vs ${opening}`;
      if (behind.length) notes.push(`Against a ${opening} target: ${behind.join(", ")}.`);
    }

    /*
     * **And the author's own sentence, which never belonged on the face.** It was printed inline
     * in brackets, so *Shield Up* read "Defend (Block applies to every attack until your next
     * turn)" -- thirteen words on a card with room for three.
     */
    if (step.text) notes.push(step.text);

    return { text: text.trim(), notes, icons, unmet, cut };
  }

  /**
   * **A half reads in two registers, and only the short one is printed.**  [2026-11-14]
   *
   * A card is 150px wide and the face used to take every clause a step could carry: the verb, the
   * number, the condition, the combo clause, the resist, the kit requirement and whatever prose
   * the content author wrote in `text`. *Shield Up* came out as "Defend (Block applies to every
   * attack until your next turn)" wrapped over five lines across its own picture, and *Strike*
   * printed "Move 0 (was 1)" -- a number with its cause cut off.
   *
   * So each step produces two strings. The face says the verb, the number, the condition and its
   * duration -- the things you choose between at a glance. The tooltip says the rest: the prose,
   * the resist, the combo clause's wording, and *why* a number on the face is not the number
   * printed on the card.
   *
   * **Prose moves, mechanics stay.** The dividing line is not length: it is whether the clause is
   * a quantity you compare cards on. A `+2` stays on the face at two characters; a sentence
   * explaining what the +2 means does not, however short it happens to be.
   */
  #renderCard(card, blockedIcons, dazed) {
    const half = (name, steps) => {
      const icons = [];
      const bits = [];
      /* The long register: one sentence per step that has anything more to say. */
      const detail = [];
      /* Why this half cannot be played, when it cannot: a kit requirement nothing in hand meets. */
      let unmet = "";
      /* Whether any number on this face differs from the number printed on the card. */
      let cut = false;

      for (const step of steps ?? []) {
        const face = this.#stepFace(step, name);
        icons.push(...face.icons);
        if (face.unmet) unmet = face.unmet;
        if (face.cut) cut = true;
        bits.push(face.text);
        if (face.notes.length) detail.push(`${face.text} \u2014 ${face.notes.join(" ")}`);
      }

      // What the half costs is part of the half, printed with it wherever the half is shown.
      // Icons, like everything else on a face: card space is limited (core-rules 10). Strain takes
      // a bare number, so it reads as a parameter the way Move 3 does; Spent takes none.
      const { spent, strain } = card.system.costFor?.(name) ?? {};
      const costs = [];
      if (spent) {
        costs.push({
          icon: CARDRPG.costIcons.spent.icon,
          value: null,
          tip: "Spent: this card goes out for the rest of the fight when you play this half. "
            + "It comes back on a short or long rest."
        });
      }
      if (strain) {
        costs.push({
          icon: CARDRPG.costIcons.strain.icon,
          value: strain,
          tip: `Strain ${strain}: discard ${strain} other card${strain === 1 ? "" : "s"} from your `
            + "hand to play this half. They go to the discard, so a Catch Breath brings them back."
        });
      }

      const explains = detail.join(" ");
      /* NOT `spent`: that is this half's Spent cost, bound from `costFor` above. One block, one
       * meaning per name -- the collision is a SyntaxError here and would have been a wrong
       * answer anywhere the two scopes did not overlap. */
      const usedUp = this.#halfSpent(name);
      const blocked = icons.some(i => blockedIcons.has(i))
        || (name === "secondary" && dazed) || !!unmet || usedUp;

      return {
        name,
        text: bits.join(", ") || "\u2014",
        /*
         * **A marker, so a tooltip nobody hovers is not the only sign.** A number cut by a
         * condition has to be noticeable without being explained in place: the glyph says
         * *something took this*, and the tooltip says what.
         */
        cut,
        costs,
        icon: CARDRPG.halfIcons[name],
        blocked,
        /*
         * Why, in words. The sentence used to be fixed in the template, which was fine while a
         * half could only ever be switched off by a Blocked icon; a kit requirement is a second
         * reason, and a player who cannot tell them apart will go looking for the condition.
         *
         * A playable half gets its detail here instead, which is the whole of the long register:
         * the face says what it does, and the tooltip says what that means.
         */
        tip: usedUp
          ? (this.actor.system.exhausted
              ? "Exhausted: one card a turn, and you have played it."
              : `Your ${name} is spent this turn. The card stays in your hand, and its reaction `
                + "is still yours to arm or hold.")
          : unmet
            ? `Needs ${unmet} in hand. Ready something that is, or play the other half.`
              + (explains ? ` ${explains}` : "")
            : blocked
              ? "Blocked right now. The other half may still be playable, and Brace never is."
                + (explains ? ` ${explains}` : "")
              : explains,
        staged: this.staged.some(s => s.cardId === card.id && s.half === name)
      };
    };

    /*
     * **`reserved` sits on the card and not on its reaction row.**  **[FIXED 2026-11-22]**
     *
     * The template turned a card sideways off `card.reaction.reserved`, and an intruder has no
     * reaction row -- so a Wound was the one card in the hand that `reserveHand` turned and the
     * renderer drew upright. That is precisely the lie the stacks note argues against: *Hold all*
     * reported a hand that was not all held. Being turned is a fact about the piece of card, so
     * both shapes of card carry it.
     */
    if (isIntruder(card)) {
      const down = isReserved(card);
      return {
        id: card.id, name: cardName(card), harm: true, art: artOf(card),
        reserved: down, toggles: down, halves: [],
        toggleTip: "Turned sideways. Click anywhere on it to stand it back up."
      };
    }
    const reserved = isReserved(card);
    const halves = [half("primary", card.system.primary),
      half("secondary", card.system.secondary)];
    const reaction = this.#reactionRow(card);
    /*
     * **When there is nothing left to play, the only decision is the reaction** -- so the whole
     * card becomes that switch.  **[BUILT 2026-11-22]**
     *
     * Once the turn's two halves are spent the rest of the hand can do exactly one thing, and
     * asking a player to find a strip of text at the bottom of a card to do it is asking them to
     * aim at the smallest target on the card for the only move it has left. A card already turned
     * counts too, for the older reason: rotated, that strip is a sliver of vertical text, and on
     * an intruder or a blocked reaction it is not a button at all.
     *
     * Not when a half is still playable: an upright, playable card is one you are reading and
     * clicking to play, and making all of it a switch would arm and disarm it by accident. And
     * not when the reaction is blocked and the card is upright -- there is no decision there to
     * offer, only a card that can do nothing at all.
     */
    const toggles = reserved || (!reaction.blocked && halves.every(h => h.blocked));
    return {
      id: card.id,
      name: cardName(card),
      harm: false,
      art: artOf(card),
      reserved,
      toggles,
      toggleTip: reserved
        ? "Turned sideways: it will not react. Click anywhere on it to stand it back up."
        : "Nothing left to play on this card. Click anywhere on it to hold its reaction back.",
      /*
       * **What the card IS**, for the tooltip on its name. The halves below say what it does and
       * the icons say it again in pictures; neither answers the question a player asks when they
       * do not recognise a card, which is what it is for. Keyed by name in content/card-blurbs,
       * so a card the table has never seen still has a sentence.
       */
      blurb: CARD_BLURBS[cardName(card)] ?? "",
      halves,
      reaction
    };
  }

  /**
   * The third row: what this card would do on someone else's turn, and the switch that stops it.
   *
   * Reactions resolve automatically (core-rules 3), so there is nothing to click at the moment a
   * hit lands -- which leaves exactly one decision, taken in advance and at leisure: whether this
   * card is available to spend at all. Turning it sideways is that decision, and the row that says
   * what the card would do is the switch that stops it doing it.
   *
   * A card with no printed reaction reads "Brace", because that is what it is.
   */
  #reactionRow(card) {
    const key = card.system.reaction || "";
    const rule = key ? CARDRPG.reactions[key] : null;
    const off = this.actor.system.blockedReactions ?? new Set();
    const label = key
      ? game.i18n.localize(rule?.label ?? key)
      : game.i18n.localize("CARDRPG.Reaction.Brace");
    const reserved = isReserved(card);

    // A reaction a drawback has taken away is greyed in place like a blocked half, never hidden:
    // Plate takes the Sidestep, and a player who cannot see what it took will think it took nothing.
    const gone = !!key && off.has(key);
    const trigger = game.i18n.localize(
      CARDRPG.reactionTriggers[rule?.trigger ?? "hit"] ?? CARDRPG.reactionTriggers.hit);

    return {
      label,
      reserved,
      blocked: gone,
      /*
       * **Armed is not simply "not reserved".** A reaction a drawback has switched off will not
       * fire either, and a row marked armed beside a Plate harness that took the Sidestep would
       * be the card promising something the armour has already refused. Three states, and the
       * two that do nothing must not both read as the one that does.
       */
      armed: !gone && !reserved,
      tip: gone
        ? `${label} is switched off by what you are wearing. The card is still yours to play.`
        : reserved
          ? `Turned sideways: ${label} will NOT fire. It still counts toward your hand and both `
            + `halves still play. Click to turn it back upright.`
          : `Armed: ${label} fires by itself when ${trigger}, if the hit would Wound you or drop `
            + `you. The card goes to your discard and costs 1 stamina. Click to turn it sideways `
            + `and keep it.`
    };
  }

  /**
   * Turn a card sideways, or back upright. Free, and legal at any time -- including in the middle
   * of somebody else's turn, which is the whole point of a standing decision.
   *
   * **While a card is down, the whole card is the way back up.**  **[BUILT 2026-11-22]**
   *
   * Turning one back took hitting the reaction row, which on a rotated card is a strip of
   * vertical text about a tenth of what is on the table -- and on two kinds of card it did not
   * exist at all. A Wound has no reaction row, and a reaction a drawback has switched off is
   * printed as dead text rather than a button, so both could be turned sideways by *Hold all* and
   * neither could be turned back. The card itself carries the action while it is down, so the
   * gesture that is hardest to undo gets the biggest target.
   *
   * **Only while it is down**, and the halves keep their own. An upright card is one you are
   * reading and clicking to play, and making all of it a switch would arm and disarm it by
   * accident; a sideways card still plays both halves (core-rules 3), so those stay buttons and
   * win the click by being nearer the pointer than the card is.
   *
   * So this is reached from two elements and must not assume the richer one: an intruder has no
   * reaction row, and `reserveCard` asks the card nothing but its flag.
   */
  static async #onReserve(event, target) {
    const hand = deckOf(this.actor, "actionHand");
    const card = hand?.cards.get(target.dataset.cardId);
    if (!card) return;
    await reserveCard(card);
    this.render();
  }


  /**
   * **Turn the whole hand sideways, or bring it all back upright.**
   *
   * core-rules 3 has always allowed this -- *you may turn your whole hand sideways; that is a
   * character playing for their turns rather than their skin, and it is a real strategy* -- and
   * saying it took one click per card, which is how a real strategy reads as a chore.
   *
   * It is a toggle rather than two buttons: if anything in the hand can still react, the hand goes
   * down; if nothing can, it all comes up. One button, and its label says which way it will go.
   *
   * **[FIXED 2026-11-12] It did the opposite of what it said.** The loop read
   * `if (isReserved(card) !== down) continue`, which skips the cards that need changing and
   * changes the ones that do not -- so *Hold all* turned the held cards upright and left the
   * upright ones alone. `reserveHand` takes the state to end in, and a target state cannot be
   * inverted by a comparison written backwards.
   */
  static async #onReserveAll(event, target) {
    const hand = deckOf(this.actor, "actionHand");
    if (!(hand?.cards.size ?? 0)) return;
    await reserveHand(this.actor, uprightCards(this.actor).length > 0);
    this.render();
  }

  /**
   * **A turn that is over leaves a hand that will not react.**  **[RULED 2026-11-12]**
   *
   * A reaction is a card played, so it costs a point of stamina (core-rules 8), and the engine
   * reacts on the player's behalf off whatever is upright. Those two together made an armed hand
   * into a standing order to spend: a hero finished their turn with four cards and the next four
   * hits took four points off the only number that decides how long the fight lasts for them,
   * without anyone being asked.
   *
   * So the default inverts. The turn's actions are done, the leftovers go sideways, and arming one
   * is a thing the player does deliberately before ending the turn. core-rules 3 already made this
   * the player's call and nobody else's -- *you take it in advance, at leisure* -- and this is that
   * sentence with the burden the right way round: you say what you will spend, rather than
   * discovering what was spent.
   *
   * **Not on a draw.** core-rules 3 also says *everything you draw arrives upright*, and that
   * stands: a refill is a fresh hand and a fresh question. What this disarms is the set you
   * already chose not to play.
   */
  async #disarmHand() {
    const held = await reserveHand(this.actor, true);
    if (held) {
      ui.notifications?.info(`${held} card(s) turned sideways: a reaction costs 1 stamina, so turn `
        + "back upright whatever you mean to spend.");
    }
  }

  /**
   * The item a verb will actually use on a given half.
   *
   * An item stamped for this half wins. Then one at "any" -- a slate with a single verb, which had
   * nothing to choose. Anything else in play is a last resort. So a longsword on the primary and a
   * shield on the secondary strike and defend respectively, with nothing to set beyond the clicks
   * that put them there.
   *
   * **And the default breaks the tie, which is the only place it is allowed to.** A player holding
   * two swords has the same ambiguity every turn, and the preference is their standing answer to
   * it -- so it is a **tie-break and not a preference order**: it sorts within equal rank, after
   * the half a slate was placed on and after the value `#itemsFor` already ordered by.
   *
   * The distinction matters. Moving a weapon into a stack is a decision a player just made, and a
   * default that outranked it would be a settings panel overruling a click -- so a default sword
   * never takes a Strike away from the axe you deliberately put in the primary. It only answers
   * the question nobody asked.
   */
  /** The step a staged half runs for a verb, so its own kit requirement can be read off it. */
  #stepFor(half, verb) {
    const entry = this.staged.find(s => s.half === half);
    const card = entry ? deckOf(this.actor, "actionHand")?.cards.get(entry.cardId) : null;
    return (card?.system[half] ?? []).find(st => st.verb === verb) ?? null;
  }

  /**
   * **A weapon serves one Strike a turn.**  [BUILT 2026-11-22]
   *
   * Two Strikes in a turn is a real hand -- stage a Strike's primary and a *Weapon Swap*'s
   * secondary -- and the engine handed the same Longsword to both of them, so a sword swung twice
   * was simply twice the sword. *Off-Hand Blow* is written **Strike / Strike -1**, "two hands, two
   * strikes, and the second is the weaker for it" (way-cards 3.1), and two hands means two things
   * in them.
   *
   * So what an earlier staged half took is spent. **Earlier by click order**, which is the order
   * the halves resolve, not by primary-before-secondary -- the same rule the lead half uses, and
   * for the same reason.
   *
   * The recursion stops because it only looks at halves BEFORE this one and a turn stages two.
   */
  #claimed(half, verb) {
    const mine = this.staged.findIndex(s => s.half === half);
    if (mine <= 0) return new Set();
    const taken = new Set();
    for (const earlier of this.staged.slice(0, mine)) {
      if (!this.#verbsOf(earlier.half).includes(verb)) continue;
      /* The earlier half's OWN requirement: a Take the Shot that asked for a bow was answered by
       * the bow, and claiming whatever the best unrestricted weapon is would spend the wrong one. */
      const used = this.#itemFor(verb, earlier.half,
        this.#stepFor(earlier.half, verb)?.requires ?? null);
      if (used) taken.add(used.id);
    }
    return taken;
  }

  #itemFor(verb, half = "primary", requires = null) {
    const taken = this.#claimed(half, verb);
    const candidates = this.#itemsFor(verb, requires).filter(i => !taken.has(i.id));
    /*
     * **And the fist, when there is nothing left.** Unconditional for a Strike that asks for no
     * particular kit, because bare hands are the one weapon that cannot be taken away -- and it is
     * also the answer for a character holding nothing at all, which used to be refused outright.
     * A requirement bare hands do not meet still refuses, and says which requirement.
     */
    if (!candidates.length) {
      return verb === "strike" && itemMeets(BARE_HANDS, requires) ? BARE_HANDS : null;
    }
    if (candidates.length < 2) return candidates[0] ?? null;
    const choosy = i => i.system.availableVerbs.length > 1;
    const preferred = this.actor.system.defaultFor?.(verb) ?? null;
    /*
     * An unplaced slate is still "any" -- it can serve either half, and that is the right default
     * for a weapon nobody has thought about. What changed is that a competing one-verb slate can
     * now BE placed, so `roles` answers for it and the arrow means something.
     */
    const rank = i => {
      const role = this.roles.get(i.id) ?? (choosy(i) ? "primary" : "any");
      return role === half ? 0 : role === "any" ? 1 : 2;
    };
    // #itemsFor already orders by value, and sort is stable, so equal ranks keep the better item.
    return [...candidates]
      .sort((a, b) => rank(a) - rank(b)
        || (b.id === preferred?.id) - (a.id === preferred?.id))[0];
  }

  /**
   * Every equipped item that can serve a verb, best first.
   *
   * `requires` is the step's kit requirement (data/cards.mjs), and it narrows the list BEFORE the
   * sort rather than after the pick -- which is the whole of the fix. A Shade holding a bow and a
   * dagger has a better Strike with the dagger, so a Take the Shot that asked for the best item
   * and then checked it would refuse to fire a bow the character is holding.
   */
  #itemsFor(verb, requires = null) {
    /* By what they do NOW, not what is printed on them: a sort on the printed number offers a
     * hero the sword that has been battered to 0 over the axe behind it. */
    const worth = i => i.system.valueFor?.(verb) ?? i.system.verbs?.[verb]?.value ?? 0;
    return this.actor.items
      .filter(i => i.type === "item" && i.system.equipped
        && !CARDRPG.slots[i.system.equippedSlot]?.stows
        && (i.system.verbs?.[verb]?.value !== null || i.system.verbs?.[verb]?.text))
      .filter(i => itemMeets(i, requires))
      .sort((a, b) => (worth(b) - worth(a)));
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /**
   * Take one of the assist's offers back out of this staged action.
   *
   * A toggle rather than a one-way door, so a mis-click costs a click -- and it is the whole of
   * what makes the assist acceptable. A helper that put things in a stack and would not take them
   * out again is a helper that plays the turn for you.
   */
  static async #onWave(event, target) {
    const { waveId } = target.dataset;
    if (!waveId) return;
    if (this.waved.has(waveId)) this.waved.delete(waveId);
    else this.waved.add(waveId);
    this.render();
  }

  /**
   * **Set, or unset, the weapon or formula this character reaches for.**
   *
   * A toggle, because the useful gesture is *this one from now on* and the second useful gesture
   * is *actually, ask me*. Clicking the same slate twice is the second one, and a character with
   * two swords and no preference should be asked rather than quietly handed the first.
   *
   * The key comes from the slate's own kind rather than from the markup, so a formula can never
   * land in the weapon field: that would be a stored id `defaultFor` has to refuse later, which
   * is the shape of every stale-reference bug.
   */
  static async #onSetDefault(event, target) {
    const slate = this.actor.items.get(target.dataset.slateId);
    if (!slate) return;
    const key = slate.type === "spell" ? "spell" : "weapon";
    const now = this.actor.system.defaults?.[key] ?? "";
    await this.actor.update({ [`system.defaults.${key}`]: now === slate.id ? "" : slate.id });
    this.render();
  }

  static async #onStage(event, target) {
    const { cardId, half } = target.dataset;
    const already = this.staged.findIndex(s => s.cardId === cardId && s.half === half);
    if (already >= 0) {
      this.staged.splice(already, 1);
      /* Unstaging the last half ends the action, and the refusals were about that action. */
      if (!this.staged.length) this.waved.clear();
      return this.render();
    }
    if (this.staged.some(s => s.half === half)) {
      return ui.notifications.warn(`You already have a ${half} staged.`);
    }
    if (this.staged.some(s => s.cardId === cardId)) {
      return ui.notifications.warn("Both halves must come from different cards.");
    }
    /* The face is already greyed, so this is the second route in -- a stale window, a macro, a
     * click that landed as the render swapped. Refused with the reason rather than ignored. */
    if (this.#halfSpent(half)) {
      return ui.notifications.warn(this.actor.system.exhausted
        ? "Exhausted: one card a turn, and you have played it."
        : `Your ${half} is spent this turn.`);
    }
    if (this.staged.length && this.actor.system.exhausted) {
      return ui.notifications.warn("Exhausted: one card per turn.");
    }
    this.staged.push({ cardId, half });
    this.render();
  }

  /**
   * Clicking the action deck deals a hand, then the deck goes inert until the next turn -- the
   * hand refills once a round, so dealing repeatedly would just be drawing your deck away.
   */
  static async #onDealHand() {
    const key = CardRPGTray.#turnKey(game.combat);
    if (CardRPGTray.#dealtThisTurn(this.actor, game.combat)) {
      return ui.notifications.info("Already dealt this turn. You draw again next turn.");
    }
    /*
     * Every kind that resolved on the way in counts as something having happened: a refill that
     * dealt nothing but a Fear is not an empty draw pile, and warning about one would send the
     * player looking for a problem they do not have.
     */
    /* `applyRage` comes from the resolver: a Rage card is a Strike, and decks.mjs does not resolve
     * Strikes. See `FROM_CALLER` there. */
    const { short } = await refill(this.actor, { handlers: { rage: applyRage } });
    await this.actor.setFlag("cardrpg", "dealtAt", key);
    /*
     * **Asked of the hand, not of what was drawn.**  [FIXED 2026-11-22] `drawn` is 0 for a player
     * whose hand was already full, and that player was told their draw pile was empty -- a
     * warning about a problem they do not have, sending them to Catch Breath for stamina they
     * need not spend. `handShort` is the question, and the turn-start deal asks the same one.
     */
    if (handShort(this.actor, short)) {
      ui.notifications.warn("Draw pile is empty. Catch Breath to recover some.");
    }
    this.render();
  }

  /*
   * **No `#onCallCheck` and no `#onStartChallenge`.**  [RETIRED 2026-11-15]
   *
   * Both built a dialog of their own and both lost their button when the board took the gesture
   * onto the token. A private method with no caller is a second implementation waiting to drift
   * from the first, which is exactly what the call dialog had already started doing.
   */

  /**
   * Draw up to the skill hand size. The GM says when, because a scene is not an event the engine
   * has -- the same reason granting a level is a GM action and not a hook.
   */
  static async #onDealSkills() {
    if (!game.user.isGM) {
      return ui.notifications.info("The GM says when a new scene starts.");
    }
    const { drawn } = await dealSkillHand(this.actor);
    if (!drawn) ui.notifications.info("Nothing to draw: the skill deck is empty until a rest.");
    this.render();
  }

  /** End it. Either track filling is a reason, and so is the GM deciding it is over. */
  static async #onEndChallenge() {
    if (!game.user.isGM) return;
    await endChallenge();
    for (const tray of CardRPGTray.openTrays) tray.render();
  }

  /**
   * Catch Breath inside a challenge (skill-rules 3), which is not the combat one.
   *
   * Pressure +1, the discard comes back, **one card of your choice** is set aside as Spent, and you
   * draw up to hand size. The choice is the player's and the dialog asks for it, the same way a
   * prune does: only they know which card they can do without today.
   */
  static async #onBreatheScene() {
    const live = readChallenge();
    if (!live) return ui.notifications.info(game.i18n.localize("CARDRPG.Challenge.NotInOne"));
    const deck = deckOf(this.actor, "skill");
    const discard = deckOf(this.actor, "skillDiscard");
    const pool = [...(discard?.cards?.contents ?? []), ...(deck?.cards?.contents ?? [])];
    const answer = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize("CARDRPG.Challenge.Breathe") },
      content: `<div class="cardrpg cr-check">
        <p class="cr-note">${game.i18n.localize("CARDRPG.Challenge.BreatheBody")}</p>
        <label>${game.i18n.localize("CARDRPG.Challenge.SetAside")} <select name="spent">
          <option value="">${game.i18n.localize("CARDRPG.Challenge.NoneAside")}</option>
          ${pool.map(c => `<option value="${c.id}">${foundry.utils.escapeHTML(c.name)}`
            + ` (${c.system.value})</option>`).join("")}
        </select></label>
      </div>`,
      ok: {
        label: game.i18n.localize("CARDRPG.Challenge.Breathe"),
        callback: (ev, button) => ({ spent: button.form.elements.spent.value })
      },
      rejectClose: false
    });
    if (!answer) return;
    await catchBreathInChallenge(this.actor, answer.spent || null);
    this.render();
  }

  /**
   * Draw a twist, or two to pick from (skill-rules 4).
   *
   * **A button and never a consequence**, which is the rule rather than a UI choice: *the GM can
   * always choose a cost directly... the deck is there for when inspiration runs out, not to
   * override the GM*. A Partial's chat line says a twist is owed; whether the deck answers is the
   * GM's decision, and so is putting one back that makes no sense here.
   */
  static async #onTwist(event, target) {
    if (!game.user.isGM) return;
    /*
     * **Which debt this pays.** The row is identified by its place in the queue rather than by a
     * list of actor ids in the markup: the queue is rebuilt on every render from the ledger, so a
     * row that was drawn for between the click and the handler is simply not there any more, and
     * an index that no longer exists pays nothing instead of paying the wrong person.
     */
    const row = twistQueue()[Number(target.dataset.pay)] ?? null;
    await drawTwist({
      two: target.dataset.two === "yes",
      pay: row?.ids ?? null,
      label: row ? `${row.label}${row.shared ? " (shared)" : ""}` : ""
    });
    for (const tray of CardRPGTray.openTrays) tray.render();
  }

  /**
   * No card for this one.
   *
   * skill-rules 4 says the GM can always choose a cost directly and that a twist which makes no
   * sense goes back, so the queue needs a way to say *I have handled this* that is not a draw.
   * Without it a debt the GM narrated their own way would sit in the panel until the call was
   * withdrawn, and a list of reminders that cannot be ticked off stops being read.
   */
  static async #onForgiveTwist(event, target) {
    if (!game.user.isGM) return;
    const row = twistQueue()[Number(target.dataset.pay)] ?? null;
    if (row?.ids?.length) await forgiveDebts(row.ids);
    for (const tray of CardRPGTray.openTrays) tray.render();
  }

  /**
   * Fold the passive panel open or shut.
   *
   * A client setting rather than state on the tray, so a GM who folds it away once finds it away
   * after a reload -- which is what makes it collapsible rather than merely foldable.
   */
  static async #onTogglePassives() {
    if (!game.user.isGM) return;
    await game.settings.set("cardrpg", "passivesOpen",
      !game.settings.get("cardrpg", "passivesOpen"));
    this.render();
  }

  /** Withdraw it. The obstacle is gone, or it was the wrong call. */
  static async #onClearCall() {
    if (!game.user.isGM) return;
    await clearCall();
    for (const tray of CardRPGTray.openTrays) tray.render();
  }

  /**
   * **The claim, as a control: three states and a reason.**  [BUILT 2026-11-14]
   *
   * The rules have always said a good plan or a fitting background grants advantage (skill-rules
   * 2), and the know-how system is deliberately a loose bag of tags you argue from rather than a
   * list you look up (skill-rules 7). Neither had anywhere to happen: `advantageFor` proved six
   * things from the canvas and the conditions, and there was no third way in.
   *
   * Three buttons rather than a checkbox, because **disadvantage is as claimable as advantage**
   * and a tick box can only say one of them. Normal is the middle state and clears the claim --
   * see `setEdge`: *normal* is the absence of a claim, not a third kind of one.
   *
   * The reason is **offered, never required**. A player who has already said it out loud should
   * not have to type it, and the tags below are a prompt rather than a validation: nothing checks
   * that the chosen tag has anything to do with the action, because nothing could. The table does
   * that, which is why the claim and its reason are printed with the result.
   */
  #edge() {
    const claim = readEdge(this.actor);
    const mode = claim?.mode ?? 0;
    /* Only somebody who could act for this character may speak for them. A player sees their own
     * HUD and a GM sees whoever is selected, so this is the one test both cases need. */
    const mine = this.actor.isOwner;
    return {
      mode,
      mine,
      reason: claim?.reason ?? "",
      by: claim?.by ?? "",
      line: edgeLine(claim),
      /*
       * **Named, not drawn.**  [2026-11-14] The three states were a minus, a dot and a plus,
       * which is compact and says nothing: a glyph has to be learned before it can be read, and
       * the one thing this control must not need is a player who already knows what it does.
       *
       * The word IS the label and the tooltip carries everything else, so the panel never
       * explains itself in place -- which is also why the "normal draw" caption beside it is
       * gone. It was a description of the state the buttons were already showing.
       */
      states: [
        {
          mode: -1, label: game.i18n.localize("CARDRPG.Edge.Disadvantage"), on: mode < 0,
          tip: "Draw two fate cards and take the worse. The GM hands this out, and a player can "
            + "take it on themselves for a reckless plan."
        },
        {
          mode: 0, label: game.i18n.localize("CARDRPG.Edge.Normal"), on: mode === 0,
          tip: "One fate card. Clears whatever was claimed."
        },
        {
          mode: 1, label: game.i18n.localize("CARDRPG.Edge.Advantage"), on: mode > 0,
          tip: "Draw two fate cards and take the better. Claim it for a good plan, the ground "
            + "you are on, or a training that fits — then say which."
        }
      ],
      /*
       * The bag itself is NOT handed to the template. [2026-11-16] It was, and nothing rendered
       * it: the place a player picks a tag is the "say why" dialog, where the list is a prompt
       * beside a free field, and a panel that also listed them would be repeating the dialog in a
       * corner it has no room for. `#edgeTags` has one caller and this was not it.
       */
    };
  }

  /**
   * **The bag you argue from**, gathered from wherever the character keeps it.
   *
   * Everything here is a **tag**: a short phrase the character demonstrably has, with no rule
   * attached and no number behind it. That is the whole design of know-how in this game, and it is
   * why this list is assembled rather than configured -- a background, a node's training, a thing
   * you are carrying and a feature you own are four different fields and one kind of argument.
   *
   * A monster's half of the same list is its tactics and its type, which is what a GM would cite
   * for the same reason: *it fights in packs*, *it is a goblin and this is its tunnel*.
   */
  #edgeTags() {
    const system = this.actor.system;
    const out = [];
    const add = (group, text) => {
      const label = String(text ?? "").trim();
      if (label) out.push({ group, label });
    };

    if (system.background) add("Background", system.background);
    for (const t of system.learned?.trainings ?? []) add("Trained", t);
    for (const k of system.learned?.knowHow ?? []) add("Know-how", k);
    for (const l of system.learned?.languages ?? []) add("Speaks", l);

    for (const slate of this.actor.items) {
      if (slate.type === "feature" && !slate.system.drained) add("Feature", slate.name);
      if (slate.type !== "item" || !slate.system.equipped) continue;
      for (const tag of slate.system.tags ?? []) add(slate.name, tag);
    }

    /* The monster's side: what it is, and how it is known to fight. */
    if (system.kind) add("Type", system.kind);
    /* `CARDRPG.tactics` maps a key straight to a label key, not to a config object -- the same
     * shape the NPC sheet reads it in. Asking it for a `.label` would have quietly printed the
     * raw key for every tactic in the game. */
    for (const key of system.tactics ?? []) {
      add("Tactic", game.i18n.localize(CARDRPG.tactics[key] ?? key));
    }

    /* De-duplicated on the whole phrase, because a training and a know-how can be the same words
     * arriving from two directions and a list that offers both says nothing twice. */
    const seen = new Set();
    return out.filter(tag => {
      const key = `${tag.group}:${tag.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Set the claim, keeping whatever reason was already given.
   *
   * Clicking a state is the fast gesture and must not open anything: a player who has already said
   * why out loud should be one click from the draw they argued for.
   */
  static async #onSetEdge(event, target) {
    if (!this.actor.isOwner) return;
    const want = Number(target.dataset.mode) || 0;
    const claim = readEdge(this.actor);
    await setEdge(this.actor, want, want && claim?.mode === want ? claim.reason : (claim?.reason ?? ""));
    this.render();
  }

  /**
   * **And the reason, asked separately.**
   *
   * A select of the character's own tags and a free field beside it, because the bag is a prompt
   * and not a closed list: the most common good reason at a table is the shape of the room, which
   * is on nobody's sheet.
   */
  static async #onSayWhy() {
    if (!this.actor.isOwner) return;
    const claim = readEdge(this.actor);
    if (!claim) {
      return ui.notifications.info("Claim advantage or disadvantage first, then say why.");
    }
    const tags = this.#edgeTags();
    const esc = foundry.utils.escapeHTML;
    const what = claim.mode > 0 ? "advantage" : "disadvantage";

    const got = await foundry.applications.api.DialogV2.prompt({
      window: { title: `Why ${what}?` },
      content: `<div class="cardrpg cr-check">`
        + `<p class="cr-note">Nothing checks this. It is printed with the result so the table `
        + `can argue with it.</p>`
        + (tags.length
          ? `<label>Something you have <select name="tag">`
            + `<option value="">\u2014</option>`
            + tags.map(t => `<option value="${esc(`${t.group}: ${t.label}`)}">`
              + `${esc(t.group)}: ${esc(t.label)}</option>`).join("")
            + `</select></label>`
          : "")
        + `<label>Or say it <input type="text" name="said" value="${esc(claim.reason)}" `
        + `placeholder="high ground, and they have not seen me"></label></div>`,
      ok: {
        label: "Claim it",
        callback: (ev, button) => {
          const f = button.form.elements;
          return (f.said?.value || "").trim() || (f.tag?.value || "");
        }
      },
      rejectClose: false
    });
    if (got === null || got === undefined) return;
    await setEdge(this.actor, claim.mode, got);
    this.render();
  }

  /**
   * Answer the call with one card (skill-rules 2).
   *
   * **One dialog, and only for the parts that are still a decision.** The difficulty is the GM's
   * and comes from the call; the approach is the call's when it named one; the tool is chosen for
   * the character because the engine knows what is equipped and what it serves. What is left is
   * what the rules leave to the player: whether to spend a second card pushing, whether anybody
   * helped, and -- for a wild -- which approach they are claiming.
   *
   * When none of those is available the check resolves on the click, with no dialog at all. That is
   * the common case at a table: a called obstacle, a card that fits, no tool, no push, no helper.
   */
  static async #onCheck(event, target) {
    const hand = deckOf(this.actor, "skillHand");
    const card = hand?.cards.get(target.dataset.cardId);
    if (!card) return;

    const call = readCall();
    /*
     * **A player cannot set their own difficulty**, which is step 1 of the rules belonging to the
     * GM. Without a call there is nothing to answer, and the GM is one button away -- so this
     * refuses rather than guessing a Normal 5, which would be the same defect wearing a default.
     */
    if (!call && !game.user.isGM) {
      return ui.notifications.info(game.i18n.localize("CARDRPG.Check.WaitForCall"));
    }
    if (call && !cardAnswers(card, call)) {
      return ui.notifications.warn(game.i18n.format("CARDRPG.Check.WrongApproach",
        { card: card.name, approach: describeCall(call) }));
    }

    /*
     * **The card settles it; the call only narrows what may be played.**  [2026-11-15]
     *
     * This read `called ?? own`, which was right while a call named at most one approach: the
     * call WAS the approach. Now that it may name several, the card is the thing that says which
     * of them is happening -- a Might 2 answering a *Might or Agility* door is a Might check --
     * and `cardAnswers` has already refused any card that serves none of them.
     *
     * A wild serves all six and so settles nothing: it takes the call's approach when there is
     * exactly one, and otherwise the player is asked, which is what a wild is for.
     */
    const allowed = call?.approaches ?? [];
    const own = card.system.wild ? null : card.system.approach;
    const approach = own ?? (allowed.length === 1 ? allowed[0] : null);

    const pushable = [...hand.cards.contents]
      .filter(c => c.id !== card.id
        && (approach ? c.system.serves(approach) : c.system.value > 0));
    /*
     * **Ordered by what is likeliest, selected by nobody.**  [2026-11-15] The best tool for the
     * approach leads the list so the common case is one click away, and the list opens on *no
     * tool* -- see `bestTool`. A rope that is `Might +2 (climbing)` must not arrive already
     * added to the check for shoving a stuck door.
     */
    const tool = approach ? bestTool(this.actor, approach) : null;
    const tools = this.actor.items.filter(i => i.type === "item" && i.system.equipped
      && i.system.bonus?.approach)
      .sort((a, b) => (b.id === tool?.id) - (a.id === tool?.id)
        || (b.system.bonus.approach === approach) - (a.system.bonus.approach === approach)
        || a.name.localeCompare(b.name));
    const helpers = helpOptions(this.actor);

    /*
     * **What the character has been taught, and what this card says it can do.**
     * [BUILT 2026-11-15]
     *
     * Both are claims the GM rules on out loud, so both are offered and neither is checked
     * against the obstacle: the engine knows a character holds *lockpicks* and cannot know
     * whether the thing in front of them is a lock. Only trainings they actually hold are listed,
     * which is the half that IS the engine's to know.
     */
    const trainings = this.actor.system.learned?.trainings ?? [];
    const edge = card.system.edge ?? "";

    /* What is still a decision. An empty list means the click was the whole check. */
    const asks = [
      !approach ? "approach" : null,
      tools.length ? "tool" : null,
      pushable.length ? "push" : null,
      helpers ? "help" : null,
      /* A floor can only lift a 1, so a 2 or a 3 is not asked a question with one answer. */
      trainings.length && card.system.value < SKILL_FLOOR ? "training" : null,
      !call ? "dc" : null
    ].filter(Boolean);
    /*
     * **The edge is NOT on that list, and it was for an hour.**  [FIXED 2026-11-15]
     *
     * Every skill card carries an edge now, so an `edge ? "edge" : null` entry meant the list
     * was never empty and **the dialog opened on every check in the game** -- which is the one
     * thing the paragraph above this method promises it will not do: *when none of those applies
     * the check resolves on the click, which is the common case at a table.* A feature that costs
     * every other check a modal is not worth having.
     *
     * So the box rides along when the dialog is open for a real decision, and never summons one.
     * The clause reaches the GM either way, because the note under the result prints it whether
     * or not the box was ticked -- which is the honest arrangement for a rider: *The Loud Voice*
     * says everyone knows it was you, and that is a price rather than an option, so the sentence
     * has to be in front of the table even on a check nobody paused over.
     */

    let answer = {
      approach, dc: call?.dc ?? CARDRPG.difficulties.normal, mode: call?.mode ?? 0,
      tool: "", push: "", help: 0, training: "", useEdge: false
    };

    if (asks.length && edge) asks.push("edge");

    if (asks.length) {
      const row = (label, body) => `<label>${label} ${body}</label>`;
      const fields = [
        asks.includes("dc") ? row(game.i18n.localize("CARDRPG.Check.Difficulty"),
          `<select name="dc">${Object.entries(CARDRPG.difficulties)
            .map(([name, dc]) => `<option value="${dc}">${name} (${dc})</option>`).join("")}`
          + "</select>") : "",
        asks.includes("approach") ? row(game.i18n.localize("CARDRPG.Check.Approach"),
          `<select name="approach">${Object.entries(CARDRPG.approaches)
            .filter(([key]) => !allowed.length || allowed.includes(key))
            .filter(([key]) => key !== "any")
            .map(([key, cfg]) => `<option value="${key}">`
              + `${game.i18n.localize(cfg.label ?? key)}</option>`).join("")}</select>`) : "",
        asks.includes("tool") ? row(game.i18n.localize("CARDRPG.Check.Tool"),
          `<select name="tool"><option value="">`
          + `${game.i18n.localize("CARDRPG.Check.NoTool")}</option>`
          + tools.map(i => `<option value="${i.id}">`
            + `${foundry.utils.escapeHTML(i.name)} (${i.system.bonus.approach} `
            + `+${i.system.bonus.value ?? 0}${i.system.bonus.situation
              ? `, ${foundry.utils.escapeHTML(i.system.bonus.situation)}` : ""})</option>`).join("")
          + "</select>") : "",
        asks.includes("push") ? row(game.i18n.localize("CARDRPG.Check.Push"),
          `<select name="push"><option value="">`
          + `${game.i18n.localize("CARDRPG.Check.NoPush")}</option>`
          + pushable.map(c => `<option value="${c.id}">${foundry.utils.escapeHTML(c.name)}`
            + ` (${c.system.value})</option>`).join("") + "</select>") : "",
        asks.includes("help") ? row(game.i18n.localize("CARDRPG.Check.Help"),
          `<select name="help"><option value="0">`
          + `${game.i18n.localize("CARDRPG.Check.NoHelp")}</option>`
          + `<option value="1">+1</option>`
          + `<option value="2">+2 (${game.i18n.localize("CARDRPG.Check.SameApproach")})</option>`
          + "</select>") : "",
        asks.includes("training") ? row(game.i18n.localize("CARDRPG.Check.Training"),
          `<select name="training"><option value="">`
          + `${game.i18n.localize("CARDRPG.Check.NoTraining")}</option>`
          + trainings.map(t => `<option value="${foundry.utils.escapeHTML(t)}">`
            + `${foundry.utils.escapeHTML(t)}</option>`).join("")
          + `</select> <span class="cr-note">${game.i18n.format("CARDRPG.Check.FloorHint",
            { floor: SKILL_FLOOR })}</span>`) : "",
        /* The card's own clause, shown in full: it is the thing being claimed, so hiding it
         * behind a label would be asking the player to remember what they are asking for. */
        asks.includes("edge") ? row(game.i18n.localize("CARDRPG.Check.CardEdge"),
          `<input type="checkbox" name="useEdge"> `
          + `<span class="cr-note">${foundry.utils.escapeHTML(edge)}</span>`) : ""
      ].filter(Boolean).join("");

      const got = await foundry.applications.api.DialogV2.prompt({
        window: { title: `${card.name}` },
        content: `<div class="cardrpg cr-check">`
          + (call ? `<p class="cr-note"><strong>${describeCall(call)}</strong>`
            + `${call.note ? ` &mdash; ${foundry.utils.escapeHTML(call.note)}` : ""}</p>` : "")
          + fields + "</div>",
        ok: {
          label: game.i18n.localize("CARDRPG.Check.Make"),
          callback: (ev, button) => {
            const f = button.form.elements;
            return {
              dc: f.dc ? Number(f.dc.value) : (call?.dc ?? CARDRPG.difficulties.normal),
              approach: f.approach ? f.approach.value : approach,
              tool: f.tool ? f.tool.value : "",
              push: f.push ? f.push.value : "",
              help: f.help ? Number(f.help.value) : 0,
              training: f.training ? f.training.value : "",
              useEdge: f.useEdge ? f.useEdge.checked : false
            };
          }
        },
        rejectClose: false
      });
      if (!got) return;
      answer = { ...answer, ...got };
    }

    const pushed = answer.push ? hand.cards.get(answer.push) : null;
    await resolveCheck(this.actor, {
      approach: answer.approach,
      dc: answer.dc,
      mode: answer.mode,
      card,
      push: pushed,
      help: answer.help,
      item: answer.tool ? this.actor.items.get(answer.tool) : null,
      training: answer.training,
      useEdge: answer.useEdge
    });

    /* Played cards go to the skill discard, and the push went with them. */
    await discardSkillCards(this.actor, [card.id, ...(pushed ? [pushed.id] : [])]);
    this.render();
  }

  /**
   * **Turn the window over to the other deck.**  [BUILT 2026-11-14]
   *
   * It pins rather than nudges: once somebody has said *I want the skill side* the window stays
   * there until they say otherwise, including across a fight starting. A toggle that un-pinned
   * itself on the next mode change would lose the click at the exact moment it mattered -- a
   * check called in the middle of a fight is the whole reason this exists.
   *
   * The play area is emptied on the way, because what is staged belongs to the side it was staged
   * on: an action half sitting in a stack while the window shows a skill hand is a turn nobody
   * can see they are holding.
   */
  static async #onFlipSide() {
    this.side = this.#sideNow() === "action" ? "skill" : "action";
    if (this.staged.length) await CardRPGTray.#onClear.call(this);
    this.render();
  }

  /** Clicking an open pile shuts it again, and leaves whatever else is open alone. */
  static #onOpenPile(event, target) {
    const id = target.dataset.pile;
    this.openPiles.has(id) ? this.openPiles.delete(id) : this.openPiles.add(id);
    this.render();
  }

  /** Turn a slate over. The back is where value, weight and type live, never the front. */
  static #onFlipCard(event, target) {
    const id = target.dataset.cardId;
    this.flipped.has(id) ? this.flipped.delete(id) : this.flipped.add(id);
    this.render();
  }

  /** Empty the play area: both action cards back to hand, every slate back to its deck. */
  static async #onClear() {
    for (const half of ["primary", "secondary"]) {
      /*
       * **Only what the player actually put there.**
       *
       * `#assigned` now also returns what the assist offered -- a prepared formula and the ready
       * features that could serve this half -- and those were never *placed*, so there is nothing
       * to put back. `#takeOut` would have unequipped them: it writes `equipped: false` on
       * anything that is not a feature, so Clear would have quietly unprepared the formula the
       * assist had merely shown you.
       *
       * The two that stay are the two that are a player's doing: an item is in the stack because
       * they equipped it, and a **drained** feature because they used it, which is the undo this
       * was written for.
       */
      const placed = this.#assigned(half).filter(s =>
        s.type === "item" || (s.type === "feature" && s.system.drained));
      for (const slate of placed) await this.#takeOut(slate);
    }
    this.#resetPlay();
    this.render();
  }

  static async #onPlay() {
    if (!this.staged.length) return;
    const hand = deckOf(this.actor, "actionHand");
    const targets = [...(game.user.targets ?? [])].map(t => t.actor).filter(a => a);

    if (!await this.#settleReady(hand)) return;
    if (!await this.#settleStrain(hand)) return;
    /*
     * **Before the first step, and before anything is spent.** The halves are already greyed out,
     * so reaching here means a second route in -- but a guard that only fires once the cards are
     * resolving is a guard that charges for the turn it refuses.
     */
    if (this.staged.some(({ half }) => refusesAction(this.actor, { half, what: "this card" })))
      return;

    for (const { cardId, half } of this.staged) {
      const card = hand?.cards.get(cardId);
      if (!card) continue;
      for (const step of card.system[half] ?? []) await this.#resolveStep(step, half, targets);
    }

    // Each card goes where the half it was played for sends it: the discard, or out for the fight.
    const burned = await retireCards(this.actor, this.staged);
    if (burned.length) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> spends `
          + `<em>${burned.map(c => cardName(c)).join(", ")}</em> — out until a rest.</p></div>`
      });
    }
    /*
     * **Book the halves before clearing them.**  **[BUILT 2026-11-22]**
     *
     * `#resetPlay` empties `staged`, which was the only thing holding the turn to one primary and
     * one secondary -- so the budget survived exactly as long as the staging did, and a hand of
     * five was five actions. Recorded per half rather than as one *played* flag, because a turn
     * that spent only its primary still has its secondary to spend.
     */
    /* And not outside a fight, where there is no turn to spend: see `#halfSpent`. Booking it
     * anyway left a marker that only a fight could clear. */
    if (game.combat?.started) {
      const turn = CardRPGTray.#turnKey(game.combat);
      if (this.playedAt !== turn) this.spentHalves = { primary: false, secondary: false };
      for (const { half } of this.staged) this.spentHalves[half] = true;
      this.playedAt = turn;
    }
    /*
     * The turn's actions are done, so the hand stops being an automatic bill against stamina --
     * **and only inside a fight.**  **[FIXED 2026-11-23]**
     *
     * What the sideways hand warns about is a reaction's 1 stamina, and outside a fight nothing
     * spends stamina at all (decks/play.mjs). So out there it is a warning about a cost that
     * cannot be charged, and it left a player who had just opened a door looking at five cards on
     * their side with nothing to do about it.
     *
     * Here rather than in `#disarmHand`, because a **breath** is the routine's other caller and a
     * breath is a declared turn whoever is fighting: *spend your whole turn, playing nothing*. A
     * player who breathes has said their turn is over and the hand should say so. Playing a card
     * in a corridor is not a turn at all, which is the whole of core-rules 3's ruling.
     */
    if (game.combat?.started) await this.#disarmHand();
    this.#resetPlay();
    this.render();
  }

  /**
   * Resolve Ready, for the whole turn at once, before any other step runs.
   *
   * Every other verb resolves when you play it. Ready used to be the exception: it had to be played
   * *before* the slate it pays for, so arranging the stacks ran backwards from everything else. Now
   * the arranging is free and the turn you play has to cover it -- one Ready per slate that went
   * into play under pressure.
   *
   * @returns {Promise<boolean>} false if the turn cannot pay, in which case nothing is resolved.
   */
  async #settleReady(hand) {
    // Out of combat equipping is free, so a debt carried out of a fight simply lapses.
    if (!game.combat?.started) {
      this.pendingEquips.clear();
      return true;
    }
    const owed = [...this.pendingEquips].map(id => this.actor.items.get(id)).filter(i => i);
    if (!owed.length) return true;

    const readies = this.staged.reduce((n, { cardId, half }) => n
      + (hand?.cards.get(cardId)?.system[half] ?? []).filter(s => s.verb === "ready").length, 0);
    const names = owed.map(i => i.name).join(", ");

    if (readies < owed.length) {
      ui.notifications.warn(
        `${names} went into play under pressure: that costs ${owed.length} Ready, and this turn `
        + `plays ${readies}. Stage a half showing Ready, or take it back out of play.`);
      return false;
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> readies `
        + `<em>${names}</em>.</p></div>`
    });
    this.pendingEquips.clear();
    return true;
  }

  /**
   * Pay the Strain the staged halves print, before any of them resolves.
   *
   * Strain is a cost in cards: discard that many OTHER cards from your hand. The cards you are
   * playing are not other cards, so a half can never pay for itself, and a hand too thin to cover
   * the bill refuses the turn rather than part-paying it -- the same shape as an unpaid Ready.
   *
   * **The asking moved to `askStrain` and a spell asks it too.**  [2026-11-21] `cost.strain` on a
   * spell slate was read by nothing, so Valtor's three miracles cost a priest no cards at all.
   * Fixing that with a second dialog would have been a second set of rules about what may be spent
   * -- the player picks here and at random in Catch Breath, and which of those applies is exactly
   * the kind of thing two copies come to disagree about. So this keeps what belongs to a turn (what
   * is owed, what is being played, what the refusal advises) and the cards are asked for once.
   *
   * The player picks which cards go. Catch Breath recovers at random because choosing there would
   * be a free upgrade; here the choosing IS the cost, and taking it away would leave a flat tax
   * with no decision in it.
   *
   * @returns {Promise<boolean>} false if the turn cannot pay, in which case nothing is resolved.
   */
  async #settleStrain(hand) {
    const owed = this.staged.reduce((n, { cardId, half }) =>
      n + (hand?.cards.get(cardId)?.system.costFor?.(half)?.strain ?? 0), 0);
    if (!owed) return true;

    const picked = await askStrain(this.actor, owed, {
      exclude: this.staged.map(s => s.cardId),
      what: "this turn",
      advice: "Stage something cheaper, or draw first."
    });
    if (!picked) return false;

    const names = picked.map(id => cardName(hand.cards.get(id))).join(", ");
    await discardCards(this.actor, picked);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> strains ${owed}, `
        + `discarding <em>${names}</em>.</p></div>`
    });
    return true;
  }

  /**
   * Nock one piece of magical ammunition, if any is within reach (core-rules 4).
   *
   * Nocking costs no half of its own, so this is a question and not an action: the plain shot is
   * the default button, because a player who has to decline their own quiver on every Strike will
   * stop carrying one. Nothing is asked at all unless the weapon takes ammunition and a suitable
   * piece is on the belt.
   */
  async #nock(weapon) {
    const pieces = reachableAmmo(this.actor, weapon);
    if (!pieces.length) return { ammo: null, payload: null };

    const chosen = await foundry.applications.api.DialogV2.wait({
      window: { title: `${weapon.name}: nock a shaft` },
      content: `<div class="cardrpg"><p>One piece per Strike, and it is gone whether the shot `
        + `lands or misses.</p></div>`,
      buttons: [
        ...pieces.map(piece => ({
          action: piece.id,
          label: piece.system.shotLine ? `${piece.name} — ${piece.system.shotLine}` : piece.name
        })),
        { action: "plain", label: "Plain shot", default: true }
      ],
      rejectClose: false
    });
    const ammo = pieces.find(piece => piece.id === chosen) ?? null;
    if (!ammo) return { ammo: null, payload: null };

    /*
     * A Hollow Bolt is the one piece that needs a second question, because what it does is deliver
     * something else: the potion is the effect and the bolt is only the range.
     */
    if (ammo.system.shotEffect !== "carriesPotion") return { ammo, payload: null };

    const potions = this.actor.items.filter(i =>
      i.type === "item" && i.id !== ammo.id && isUsable(i)
      && i.system.equipped && CARDRPG.slots[i.system.equippedSlot]?.freeEquip
    );
    if (!potions.length) {
      ui.notifications.warn(`${ammo.name} has nothing to carry — put a potion on your belt.`);
      return { ammo: null, payload: null };
    }

    const which = await foundry.applications.api.DialogV2.wait({
      window: { title: `${ammo.name}: what does it carry?` },
      content: `<div class="cardrpg"><p>Whatever you hit drinks it.</p></div>`,
      buttons: [
        ...potions.map(potion => ({ action: potion.id, label: potion.name })),
        { action: "none", label: "Nothing — fire it empty" }
      ],
      rejectClose: false
    });
    return { ammo, payload: potions.find(potion => potion.id === which) ?? null };
  }

  /**
   * Resolve one step.
   *
   * `source` is the slate the step came from, when it came from one. A card half has no source and
   * finds an item for its verb; a spell IS the source and answers `verbs.cast` itself, which is
   * what lets one function resolve both without a branch per verb.
   */
  async #resolveStep(step, half, targets, source = null) {
    const actor = this.actor;
    /* The backstop. Every verb funnels through here, so a step reached by any route this class
     * grows later is covered without the new route having to remember. */
    if (refusesAction(actor, { half, what: `a ${step.verb}` })) return;

    /*
     * **A step that happens later is booked and not resolved, and that is the whole step.**
     * [FIXED 2026-11-21]
     *
     * `delay` was read by nothing. Two of the five steps that carry one have a verb the engine
     * performs, so they resolved immediately -- a strength-5 Signature that heals two turns later
     * healed now -- and the other three announced themselves two, three and four turns early. It
     * was not an unbuilt field, it was a dropped one, and the card looked like it had worked.
     *
     * Before the ground clause, because the ground a delayed step leaves is delayed with it: a
     * grove that grows in two turns does not put difficult ground down today.
     */
    if (step.delay) {
      await bookDelayed(actor, { step, targets, source });
      return;
    }

    /*
     * **Ground first, and beside the verb rather than instead of it.** A step may do both: *Set*
     * is a Ready that leaves a trap, and the Sphere's wall is a Cast that leaves a wall. Putting
     * this inside the switch would have meant a case for every verb that can also leave ground,
     * which is every verb.
     */
    if (step.ground?.shape) await this.#layGround(step);

    /*
     * **A Read sits beside the verb, like the ground does.**  [BUILT 2026-11-22]
     *
     * Core-rules 6 makes Read a named effect rather than an icon, and two of the four steps that
     * carry one have a verb of their own: *The Mark of Things to Come* is a Mark that also reads,
     * *The Open Book* grants advantage and also reads. A case in the switch would have needed one
     * per verb that can also read, which is the argument the ground clause already makes.
     *
     * Before the switch rather than after, because every case returns -- and the order does not
     * matter to any of the four: a Read looks at a deck, and nothing the same step does changes
     * which cards are on top of it.
     */
    if (step.read) await resolveRead(actor, { step, targets });

    switch (step.verb) {
      case "strike":
      case "cast": {
        if (!targets.length) return ui.notifications.warn("Target a token first.");
        const item = source ?? this.#itemFor(step.verb, half, step.requires);
        if (!item) {
          const need = requireText(step.requires);
          return ui.notifications.warn(need
            ? `This ${step.verb} needs ${need} in hand.`
            : `Nothing equipped can ${step.verb}.`);
        }
        const { ammo, payload } = step.verb === "strike"
          ? await this.#nock(item)
          : { ammo: null, payload: null };
        await resolveAttack(actor, {
          verb: step.verb, item, mod: step.mod ?? 0, targets, step, ammo, payload,
          using: this.#usingFor(half, step.verb, item)
        });
        // A condition printed on the same step rides in with the attack.
        if (step.condition) {
          for (const target of targets) await resolveCondition(actor, { step, target });
        }
        /*
         * **And a shove rides in after it.**  [2026-11-16] *Shield Bash* is a Strike that deals no
         * damage and **pushes 2**, so the push belongs to the attack rather than to a step of its
         * own. After the condition, because a figure shoved out of reach should still have been
         * given whatever the hit was carrying.
         */
        if (step.shove) await this.#shove(step, targets);
        return;
      }

      case "defend": {
        const item = this.#itemFor("defend", half);
        if (!item) return ui.notifications.warn("Nothing equipped can defend.");
        await resolveDefend(actor, { item, half });
        return;
      }

      /*
       * Block, given away. `param` is how much and `area` is how far, 1 being adjacent -- which is
       * the same pair of fields a Blast uses, because *every ally within 2* is the same shape of
       * statement as *everything within 2* and should not need a second vocabulary.
       */
      case "block": {
        const given = await grantBlock(actor, {
          amount: step.param ?? 0,
          radius: step.area ?? 1
        });
        if (!given.length) {
          return ui.notifications.info("Nobody is standing close enough to cover.");
        }
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div class="cardrpg"><p><strong>${actor.name}</strong> covers `
            + given.map(g => `${g.actor.name} (Block ${g.block})`).join(", ")
            + " until the start of their next turn.</p></div>"
        });
        return;
      }

      case "shake": {
        /*
         * Shedding a condition is a decision, so the player picks which one; the engine only ever
         * narrows the list to what core-rules 7 allows to be shaken at all.
         *
         * `step.condition` on a shake half means "this one only" rather than "apply this" -- that is
         * how a targeted counter is written (way-cards 3.6). It needs no field of its own, and it
         * means a narrow spell cannot be played as a wide one by mistake.
         */
        const who = targets[0] ?? actor;
        const options = (who.system.activeConditions ?? [])
          .filter(c => CARDRPG.shakeable(c.key))
          .filter(c => !step.condition || c.key === step.condition);
        if (!options.length) {
          ui.notifications.info(`${who.name} has nothing to shake off.`);
          break;
        }
        const key = options.length === 1 ? options[0].key : await foundry.applications.api.DialogV2.wait({
          window: { title: `Shake Off ${step.param ?? 1}` },
          content: `<div class="cardrpg"><p>Which condition does `
            + `${who.name} shake off?</p></div>`,
          buttons: [
            ...options.map(c => ({
              action: c.key,
              label: `${game.i18n.localize(CARDRPG.conditions[c.key]?.label ?? c.key)} (${c.duration})`
            })),
            { action: "cancel", label: "None", callback: () => null }
          ],
          modal: true,
          rejectClose: false
        });
        if (key) await resolveShake(actor, { amount: step.param ?? 1, target: who, key });
        break;
      }

      /*
       * Poison and acid. Both take a target, and neither is a condition: Tainting deals cards into
       * a deck and Corrode eats the armour itself (core-rules 8).
       */
      case "tainting":
        for (const t of targets.length ? targets : [actor]) {
          await resolveTaint(actor, {
            amount: step.param ?? 1,
            target: t,
            // `text` carries "fast" for a dose that drops you now rather than later.
            fast: /fast/i.test(step.text ?? "")
          });
        }
        break;

      /* Both gear effects through the one mapping in resolve.mjs, which the critical deck's
       * riders go through as well -- so a third of them is added in one place. */
      case "corrode":
      case "blunt":
        for (const t of targets) await resolveGearEffect(actor, { step, target: t });
        break;

      /*
       * **Repair, where `param` is what says whether a skill is involved.**
       *
       *  - **With a number** it is a promise being kept -- *repair one item overnight*, which is
       *    The Mended Seam and its ritual timing -- and that many points come off flat.
       *  - **Without one** it is somebody trying, so it is a check: `lore`, which is where both
       *    backgrounds that grant *armour and its repair* already put their bonus, so the training
       *    a character bought is the training that pays.
       *
       * One verb for both, because they are one action with and without a guarantee. A second verb
       * would be a second place to remember that repairing exists at all -- and this mechanism
       * spent a long time existing only in the prose of three pieces of content.
       */
      case "repair": {
        const hurt = actor.items.filter(i => i.type === "item" && i.system.needsRepair);
        if (!hurt.length) {
          ui.notifications.info("Nothing of yours needs mending.");
          break;
        }
        const id = hurt.length === 1 ? hurt[0].id : await foundry.applications.api.DialogV2.wait({
          window: { title: "Repair" },
          content: `<div class="cardrpg"><p>Which do you mend?</p></div>`,
          buttons: [
            ...hurt.map(i => ({
              action: i.id,
              label: `${i.name} (${i.system.corroded ? `armor -${i.system.corroded}` : ""}`
                + `${i.system.corroded && i.system.blunted ? ", " : ""}`
                + `${i.system.blunted ? `strike -${i.system.blunted}` : ""})`
            })),
            { action: "cancel", label: "None", callback: () => null }
          ],
          modal: true,
          rejectClose: false
        });
        const pick = hurt.find(i => i.id === id);
        if (!pick) break;
        if (step.param !== null && step.param !== undefined) {
          await resolveRepair(actor, { item: pick, amount: step.param });
          break;
        }
        /*
         * A check, so the kit matters. Same eligibility rule as the skill pane -- an equipped item
         * with a bonus on this approach -- and the same reason the player chooses rather than the
         * engine: `situation` is a sentence for a person to read, and picking for them would mean
         * matching it by hand.
         */
        const kit = actor.items.filter(i => i.type === "item" && i.system.equipped
          && ["lore", "any"].includes(i.system.bonus?.approach));
        const toolId = !kit.length ? "" : await foundry.applications.api.DialogV2.wait({
          window: { title: "Repair" },
          content: `<div class="cardrpg"><p>What are you working with?</p></div>`,
          buttons: [
            ...kit.map(i => ({
              action: i.id,
              label: `${i.name} (+${i.system.bonus.value ?? 0}`
                + `${i.system.bonus.situation ? `, ${i.system.bonus.situation}` : ""})`
            })),
            { action: "", label: "Bare hands" }
          ],
          modal: true,
          rejectClose: false
        });
        await resolveRepairCheck(actor,
          { item: pick, tool: kit.find(i => i.id === toolId) ?? null });
        break;
      }

      case "lift": {
        // The complement of shake: what has no duration to spend. Same pick-one shape.
        const who = targets[0] ?? actor;
        const options = (who.system.activeConditions ?? [])
          .filter(c => CARDRPG.liftable(c.key))
          .filter(c => !step.condition || c.key === step.condition);
        if (!options.length) {
          ui.notifications.info(`${who.name} has nothing to lift.`);
          break;
        }
        const key = options.length === 1 ? options[0].key : await foundry.applications.api.DialogV2.wait({
          window: { title: "Lift" },
          content: `<div class="cardrpg"><p>Which does ${who.name} have lifted?</p></div>`,
          buttons: [
            ...options.map(c => ({
              action: c.key,
              label: game.i18n.localize(CARDRPG.conditions[c.key]?.label ?? c.key)
            })),
            { action: "cancel", label: "None", callback: () => null }
          ],
          modal: true,
          rejectClose: false
        });
        if (key) await liftCondition(actor, { target: who, key });
        break;
      }

      /*
       * Foresee names one NPC TYPE, not a token: every goblin shares one intent card (core-rules
       * 6, 9). With one type in the fight there is nothing to ask.
       */
      /*
       * **Sift: see and reject, never see and arrange.**  [BUILT 2026-11-16]
       *
       * core-rules 8 built this keyword on 2026-11-07, gave it an icon, wrote it into the rules
       * and put it on four cards -- and nothing ever dispatched it, so playing *Scout Ahead*
       * printed `sift 3` in chat and did nothing. It is the oldest built-and-unwired effect in
       * the game.
       *
       * **There is no top of the draw pile, and that is the one thing worth knowing here.**
       * decks.mjs draws by picking random ids: *drawing n random cards without replacement is
       * distributionally identical to drawing from a shuffled deck, and it keeps the randomness
       * somewhere we control.* So *the top card of your draw pile* is a fiction in this engine --
       * what Sift can honestly be is **n cards out of the pile, seen, and binned if you like**.
       * What the rule buys is identical either way: you see cards, you judge them, and the bad
       * ones go to the discard the next cycle brings back. What it cannot be is foreknowledge of
       * the very next draw, because nothing in this deck model knows which that is. **[OPEN]** in
       * core-rules 8, which still describes a top.
       *
       * **No reordering is offered, which is how the rule is enforced rather than trusted.** The
       * dialog has tick boxes and nothing else: arranging the top of a deck you are about to
       * refill from is a tutor, and 8 rules tutors out.
       *
       * Two cards want less than the full operation and say so in their own text. *Graven Sight*
       * is **seeing only** -- Tattoo Magic holds the seeing, not the binning -- so it gets a
       * dialog with no boxes at all.
       */
      case "sift": {
        const n = Math.max(1, step.param ?? 1);
        const seen = cardsToSift(actor, n);
        if (!seen.length) {
          return ui.notifications.info("Nothing left in the draw pile to sift.");
        }
        const lookOnly = /seeing only/i.test(step.text ?? "");
        const esc = foundry.utils.escapeHTML;

        /*
         * **It shows the cards.**  **[FIXED 2026-11-22]**
         *
         * The dialog was a bulleted list of NAMES with a checkbox beside each, and a player met
         * it as *a tick box labelled Taunt* -- which is not enough to judge a card by, and
         * judging cards is the entire effect. Sift's bargain is *you see them and may reject
         * them*; a list of names delivers the rejecting and not the seeing, so what the rule
         * bought was nothing.
         *
         * Drawn through `#renderCard`, which is what the hand is drawn through. Not a second
         * renderer: a Sift that printed a card differently from the hand would be showing you
         * something other than the card you are about to be dealt, and the draw pile can hold
         * intruders -- a Fear in there is a card you would very much like to bin, and
         * `#renderCard` is the one place that knows a harm card has no halves.
         *
         * `Handlebars.helpers` rather than rebuilt markup, for the icons and the art: `crArt`
         * exists because eight sites wrote the `url()` by hand and every one of them 404'd, and
         * a ninth written here would be the same bug in a dialog.
         *
         * **The whole card is the tick**, which is the same gesture the hand uses for turning a
         * card sideways: the checkbox is still there, still named `bin`, and still what the
         * button reads -- it is just no longer the only thing you can hit.
         */
        const glyph = key => Handlebars.helpers.crIcon(key).toString();
        const cardHtml = card => {
          const face = this.#renderCard(card, new Set(), false);
          const body = face.harm
            ? `<div class="cr-half"><span class="cr-note">Can\u2019t be played, not even for `
              + `Brace.</span></div>`
            : (face.halves ?? []).map(h => `<div class="cr-half cr-half--${h.name}">`
              + `<span class="cr-half__marker">${glyph(h.icon)}</span>`
              + `<span>${esc(h.text)}</span></div>`).join("");
          return `<div class="cr-card${face.harm ? " cr-card--harm" : ""}"`
            + (face.art ? ` style="--cr-art: ${Handlebars.helpers.crArt(face.art)}"` : "")
            + `><div class="cr-card__name">${esc(face.name)}</div>${body}</div>`;
        };

        const rows = seen.map(card => lookOnly
          ? `<li class="cr-sift__seen">${cardHtml(card)}</li>`
          : `<li><label class="cr-sift__pick">`
            + `<input type="checkbox" name="bin" value="${card.id}">`
            + `<span class="cr-sift__tick" aria-hidden="true">&#10005;</span>`
            + cardHtml(card) + `</label></li>`).join("");

        const chosen = await foundry.applications.api.DialogV2.wait({
          window: { title: `${game.i18n.localize("CARDRPG.Effect.Sift")} ${n}` },
          content: `<div class="cardrpg cr-sift"><p class="cr-note">`
            + (lookOnly
              ? "You see them and that is all. Nothing moves."
              : "Click a card to bin it. What you bin goes to your discard, which the next "
                + "cycle brings back \u2014 nothing here is lost, and you cannot reorder them.")
            + `</p><ul class="cr-sift__cards">${rows}</ul></div>`,
          buttons: lookOnly
            ? [{ action: "seen", label: "Seen" }]
            : [
              { action: "bin",
                label: "Bin the ticked",
                /*
                 * `querySelectorAll` and not `form.elements.bin`: a form with ONE input of that
                 * name hands back the input itself rather than a list, and spreading an element
                 * throws. One checkbox is *One Less Thing*, a Sift 1 -- so the only card that
                 * takes the narrowest version of this effect is the one that would have broken.
                 */
                callback: (ev, button) => [...button.form.querySelectorAll('input[name="bin"]')]
                  .filter(input => input.checked).map(input => input.value) },
              { action: "none", label: "Keep them all", callback: () => [] }
            ],
          modal: true,
          rejectClose: false
        });

        const ids = Array.isArray(chosen) ? chosen : [];
        const binned = await binSifted(actor, ids);
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div class="cardrpg"><p><strong>${actor.name}</strong> sifts `
            + `<strong>${seen.length}</strong>`
            + (lookOnly
              ? ", and only looks."
              : binned.length
                ? `, and bins <strong>${binned.length}</strong>.`
                : ", and keeps them all.")
            + `</p></div>`
        });
        return;
      }

      case "foresee": {
        const kinds = new Map();
        for (const combatant of game.combat?.combatants ?? []) {
          const npc = combatant.actor;
          if (npc?.type !== "npc") continue;
          kinds.set(npc.system.kind || npc.name, npc);
        }
        if (!kinds.size) return ui.notifications.info("No enemy types in this fight to read.");
        const names = [...kinds.keys()];
        const pick = names.length === 1 ? names[0]
          : await foundry.applications.api.DialogV2.wait({
            window: { title: game.i18n.localize("CARDRPG.Effect.Foresee") },
            content: `<div class="cardrpg"><p>Whose intent do you read?</p></div>`,
            buttons: [
              ...names.map(n => ({ action: n, label: n })),
              { action: "cancel", label: "None", callback: () => null }
            ],
            modal: true,
            rejectClose: false
          });
        if (pick && kinds.has(pick)) await resolveForesee(actor, kinds.get(pick));
        return;
      }

      case "heal": {
        /* **Whoever the step names.**  [FIXED 2026-11-21] This healed the caster and ignored
         * `targets`, which is right for eight of the ten heals in the game and wrong for the two
         * that name somebody else. Read through the same helper the delayed clock uses, so the
         * two routes cannot answer differently. */
        for (const target of healTargets(actor, step)) {
          await resolveHeal(actor, { amount: step.param ?? 0, target });
        }
        return;
      }

      /*
       * Conjuring and shaping both read their own sub-schema rather than the step's bare numbers,
       * because what separates the lesser necromancy from the greater is entirely how many, how
       * long and at what price -- and that was six cards' worth of prose before it was a field.
       */
      case "conjure":
        await resolveConjure(actor, { step });
        return;

      case "shape":
        await resolveShape(actor, { step });
        return;

      case "use": {
        const item = this.#itemFor("use", half);
        if (!item) return ui.notifications.warn("No usable item equipped. Equip a potion first.");
        await resolveUse(actor, { item, target: targets[0] ?? actor });
        return;
      }

      /*
       * Ready grants an equip or a swap, and it is settled in #settleReady before any step runs --
       * by then the slate it pays for is already in play. Nothing is left to do per step.
       */
      case "ready":
        return;

      /*
       * A condition with no verb of its own: the effect IS the action, so it saves. One that rides
       * on a Strike or Cast is handled below, after that verb has resolved.
       */
      case "":
        if (step.condition) {
          if (!targets.length) return ui.notifications.warn("Target a token first.");
          for (const target of targets) await resolveCondition(actor, { step, target });
          return;
        }
        /*
         * **And a step that is only prose FALLS THROUGH to the announcement**, rather than
         * breaking out of a switch that is the end of this method.
         *
         * It used to break, which meant seventy-five steps did nothing when played -- no effect,
         * no prompt, not even a line in chat. The branch below announces any verb the engine does
         * not recognise, so the position was exactly backwards: a step with a made-up verb reached
         * the table and a step with a blank one was discarded. `initial: ""` on the schema is what
         * hid it, because content omits the key and the data model fills it in.
         *
         * The table resolves these, and that is fine -- a hundred and twenty-seven of them say
         * things no engine should try to adjudicate. What is not fine is the table never hearing
         * about it.
         */
        /* falls through */

      default:
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<div class="cardrpg"><p><strong>${actor.name}</strong>: `
            + `${step.verb ?? ""}${step.param ? ` ${step.param}` : ""}`
            + `${step.text ? ` — ${step.text}` : ""}</p></div>`
        });
    }
  }

  /**
   * **A push, a pull or a throw.**  [BUILT 2026-11-16] core-rules 11.
   *
   * One line per target, because *it stops in the last square it can reach* is a result and not a
   * refusal: a push into a crowd moves what it can, and the table needs to know it was two squares
   * and not three, and what stopped it. A figure that cannot be moved at all says so by name --
   * the Ironclad is **immovable** and somebody who shoved them should hear why nothing happened.
   */
  async #shove(step, targets) {
    const squares = Math.trunc(step.shove ?? 0);
    if (!squares || !targets.length) return;
    const word = squares > 0 ? "pushes" : "pulls";
    const lines = [];
    /*
     * **The targeted TOKENS, not their actors.** `#targets` maps targets to actors because almost
     * everything in this game lands on an actor -- but a push is about where a figure is standing,
     * and an actor with two figures on the board cannot say which. So the tokens are read back
     * here, by actor, and handed over.
     */
    const marked = new Map();
    for (const t of game.user.targets ?? []) if (t.actor) marked.set(t.actor.id, t.document);
    for (const target of targets) {
      const { moved, why } = await forceMove(this.actor, target, squares,
        { token: marked.get(target.id) ?? null });
      lines.push(moved
        ? `${word} <strong>${target.name}</strong> ${moved}`
          + (moved < Math.abs(squares) ? `, stopped by ${why}` : "")
        : `cannot move <strong>${target.name}</strong>: ${why}`);
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> `
        + `${lines.join("; ")}.</p></div>`
    });
  }

  /**
   * **Ground this step leaves behind.**  [BUILT 2026-11-16]
   *
   * Two shapes place themselves because they have exactly one honest reading -- the block around
   * you, and the whole map -- and those two are precisely the ones that needed it: *Longer Shadow*
   * and *The Borrowed Dark* were the only steps in the game that announced nothing at all when
   * played, because a `ground` block was their entire content.
   *
   * **The other three announce and wait for a person**, which is the schema's ruling rather than
   * a shortcut: *where a three-square line goes is a judgement about the map, and the one thing
   * worse than no automation is automation that puts a wall through the party.* The chat line says
   * what to draw and what it does, which is strictly more than the table had before.
   *
   * A duration is turned into the round it lasts THROUGH, not a counter: `expireGround` compares
   * rather than counts, so nothing has to tick it and nothing can forget to.
   */
  async #layGround(step) {
    const token = this.actor.getActiveTokens?.()[0] ?? null;
    const scene = token?.scene ?? canvas?.scene ?? null;
    const g = step.ground ?? {};
    const round = game.combat?.round ?? null;
    const until = Number.isInteger(step.duration) && Number.isInteger(round)
      ? round + step.duration - 1
      : null;
    const named = (g.effects ?? [])
      .map(key => game.i18n.localize(CARDRPG.groundEffects[key] ?? key)).join(", ");

    const region = await layGround(scene, {
      shape: g.shape,
      effects: g.effects,
      damage: g.damage ?? null,
      condition: step.condition ?? "",
      intensity: step.intensity ?? null,
      origin: token?.center ?? null,
      radius: Math.max(1, step.area ?? 1),
      until,
      by: this.actor.name,
      name: `${named || g.shape} (${this.actor.name})`
    });

    const lasts = until === null ? "until the fight ends" : `through round ${until}`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> `
        + (region
          ? `makes ground: <strong>${named}</strong>, ${lasts}.`
          : `makes ground: <strong>${named}</strong> `
            + `(${game.i18n.localize(CARDRPG.groundShapes[g.shape] ?? g.shape)}), ${lasts} `
            + `&mdash; <em>place it on the map</em>.`)
        + `${step.text ? ` ${step.text}` : ""}</p></div>`
    });
  }

  /* -------------------------------------------- */

  /**
   * Use a feature, or equip an item.
   *
   * Neither ever goes *out* of play. A feature is part of you: using an active one disables it
   * until it recharges, and that is the only state it has. An item comes off only when a Ready
   * swaps something else in, so a full slot asks what this item replaces instead of refusing.
   *
   * Arranging is free. Inside a combat it still has to be paid for with a **Ready**, but that is
   * settled when the turn is played (#settleReady), so the click that arranges a stack never has
   * to come second to the card half that pays for it.
   */
  static async #onPlaySlate(event, target) {
    const slate = this.actor.items.get(target.dataset.slateId);
    if (!slate) return;

    /*
     * A spell is the third kind of slate and the first that RESOLVES when clicked. An item is
     * arranged and a feature is used; a spell is cast, which means paying for it and then running
     * its effect through the very code that runs a card half -- `#resolveStep` -- because a
     * spell's effect and a card's step are one shape (data/cards.mjs).
     */
    if (slate.type === "spell") {
      const targets = [...(game.user.targets ?? [])].map(t => t.actor).filter(a => a);
      /*
       * **Before `payToCast`, which is the whole reason this guard is not left to `#resolveStep`.**
       * The spell's price is paid here and the effect resolves two lines later; a refusal inside the
       * resolver would take the Health and the slot and then decline to cast. The file already says
       * a refused cast must charge nothing -- it says it about affording the Health -- and a turn
       * that does not happen is the same kind of refusal.
       */
      /*
       * **A spell already cast is refused in words.**  **[BUILT 2026-11-24]** The card is greyed,
       * so reaching here means a second road in -- and a guard that fires only after the card is
       * clickable is a guard that charges for the cast it refuses. Before every price, like the
       * three below it.
       */
      if (slate.system.drained) {
        return ui.notifications.info(`${slate.name} has been cast. The preparation is spent; a `
          + "long rest puts it back in your head.");
      }
      if (refusesAction(this.actor, { what: `casting ${slate.name}` })) return;
      /* And the moment, which the card states and nothing used to read. Here for the same reason
       * and in the same breath: a timing refused after `payToCast` would take the Health and the
       * slot for a cast that never happened. */
      if (refusesTiming(this.actor, slate, { what: `casting ${slate.name}` })) return;
      /* And the state, which is the third question of the same kind and in the same place. These
       * steps do NOTHING outside their state -- the whole effect is behind the gate -- so a cast
       * made outside it is a slot and a price spent on nothing at all. */
      if (refusesState(this.actor, slate, { what: `casting ${slate.name}` })) return;
      if (!await payToCast(this.actor, slate)) return;
      /*
       * The price is paid before the ward fires, and that is deliberate: *Unmake* stops the spell
       * from RESOLVING, not from being attempted, so the Health and the slot are gone either way.
       * A counterspell that also refunded the cast would be strictly better than not being cast at.
       */
      const warded = await answerCast(this.actor, slate.name);
      if (warded) return this.render();
      await this.#resolveStep(slate.system.effect, "primary", targets, slate);
      return this.render();
    }

    if (slate.type === "feature") {
      if (!slate.system.isActive) {
        return ui.notifications.info("A passive feature is always on; there is nothing to use.");
      }
      if (slate.system.drained) {
        return ui.notifications.info(
          `${slate.name} is used up. It recharges on its own: ${slate.system.rechargeLabel ?? "—"}.`);
      }
      await slate.update({
        "system.drained": true,
        "system.drainedFor": slate.system.active.turns ?? null
      });
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div class="cardrpg"><p><strong>${this.actor.name}</strong> uses `
          + `<em>${slate.name}</em>: ${slate.system.active.text}</p></div>`
      });
      return this.render();
    }

    // Slung on your back: not in use, so clicking it DRAWS it -- and the draw is free, because
    // the Ready was paid when it went over your shoulder.
    const slung = !!CARDRPG.slots[slate.system.equippedSlot]?.stows;
    if (slate.system.equipped && !slung) return ui.notifications.info("Already equipped.");

    const into = slung
      ? slate.system.allowedSlots.filter(k => !CARDRPG.slots[k]?.stows)
      : slate.system.allowedSlots;
    if (!into.length) return ui.notifications.warn(`${slate.name} has nowhere to go but your back.`);

    const slot = await CardRPGTray.#chooseSlot(slate, into);
    if (!slot) return;
    if (!CardRPGTray.#canEquipNow(slate, slot)) return;

    const displaced = await CardRPGTray.#makeRoom(this.actor, slate, slot);
    if (displaced === null) return;
    for (const other of displaced) {
      await other.update({ "system.equipped": false, "system.equippedTo": "" });
      this.roles.delete(other.id);
      this.pendingEquips.delete(other.id);
    }

    await slate.update({ "system.equipped": true, "system.equippedTo": slot });
    // Three things cost nothing: being out of combat, the belt, and drawing what you already slung.
    const free = slung || CARDRPG.slots[slot]?.freeEquip;
    if (game.combat?.started && !free) this.pendingEquips.add(slate.id);
    if (slate.system.availableVerbs.length > 1) this.roles.set(slate.id, "primary");
    this.render();
  }

  /* -------------------------------------------- */

  /** Turn a stack over. Only the front card reads in full, so this is how you see the rest. */
  static #onShiftStack(event, target) {
    const { half, dir } = target.dataset;
    this.tops[half] = (this.tops[half] ?? 0) + Number(dir);
    this.render();
  }

  /**
   * Take a card out of a stack.
   *
   * A slate goes back to the deck it came from. The action card at the base takes the whole stack
   * with it: its modifiers were assigned to that action, so without it they have nothing to modify.
   */
  static async #onUnstack(event, target) {
    const { half, slateId } = target.dataset;

    if (slateId) {
      const slate = this.actor.items.get(slateId);
      if (slate) await this.#takeOut(slate);
      return this.render();
    }

    for (const slate of this.#assigned(half)) await this.#takeOut(slate);
    this.staged = this.staged.filter(s => s.half !== half);
    this.tops[half] = 0;
    this.render();
  }

  /**
   * Back to its deck: an item is unequipped, a used feature stops being used up.
   *
   * It also cancels the Ready the slate owed -- a slate that is not in play was never readied.
   */
  /**
   * **Empty the play area's own state.**
   *
   * Three copies of two lines, in Clear, in Play and in Catch Breath -- and the assist added a
   * third thing to forget, which is exactly when a copied pair becomes a method. A refusal that
   * outlived the action it was about would quietly leave a feature out of the next turn.
   */
  #resetPlay() {
    this.staged = [];
    this.tops = { primary: 0, secondary: 0 };
    this.waved.clear();
  }

  async #takeOut(slate) {
    await slate.update(slate.type === "feature"
      ? { "system.drained": false, "system.drainedFor": null }
      : { "system.equipped": false, "system.equippedTo": "" });
    this.roles.delete(slate.id);
    this.pendingEquips.delete(slate.id);
  }

  /** Clicking a card's name turns the stack to it, rather than taking it out. */
  static #onFrontCard(event, target) {
    const { half, slot } = target.dataset;
    this.tops[half] = Number(slot);
    this.render();
  }

  /** Move a modifier to the other stack. Free and reversible, so it asks nothing. */
  static #onMoveHalf(event, target) {
    const slate = this.actor.items.get(target.dataset.slateId);
    if (!slate) return;
    this.roles.set(slate.id, this.#stackOf(slate) === "primary" ? "secondary" : "primary");
    this.render();
  }

  static #confirm(title, content) {
    return foundry.applications.api.DialogV2.confirm({
      window: { title },
      content: `<div class="cardrpg">${content}</div>`,
      modal: true,
      // Closing the dialog is a "no", not an error to catch at every call site.
      rejectClose: false
    });
  }

  /**
   * Make room in a slot, which is the only way an equipped item ever comes off.
   *
   * An item never simply leaves play. It is displaced, by another item, in a Ready -- so a full
   * slot does not refuse the equip, it asks what this item replaces. A two-hander going into two
   * occupied hands replaces both, and still costs the one Ready, because one item came in.
   *
   * @returns {Promise<Item[]|null>} what to unequip (possibly none), or null if the player backed out.
   */
  /**
   * Which slot is this going in?
   *
   * Most things go one place and are never asked about. A dagger fits a hand or a belt and a potion
   * fits a belt or a hand, so those ask -- and the asking is the point: where a thing sits decides
   * what a Ready can reach and whether it is in the way. Plate mail lists one slot and so never
   * asks, which is the whole rule about what fits where; there is no second rule by item type.
   *
   * @returns {Promise<string|null>} the chosen slot, or null if the player backed out.
   */
  static async #chooseSlot(slate, allowed = slate.system.allowedSlots ?? [slate.system.slot]) {
    if (allowed.length < 2) return allowed[0] ?? null;

    const label = key => game.i18n.localize(CARDRPG.slots[key]?.label ?? key);
    return await foundry.applications.api.DialogV2.wait({
      window: { title: `Where does ${slate.name} go?` },
      content: `<div class="cardrpg"><p><strong>${slate.name}</strong> fits more than one place, `
        + "and where it sits decides what it can do and what a Ready can reach.</p></div>",
      buttons: [
        ...allowed.map(key => ({ action: key, label: label(key) })),
        { action: "cancel", label: "Cancel", callback: () => null }
      ],
      modal: true,
      rejectClose: false
    }) ?? null;
  }

  /**
   * May this slate go on right now?
   *
   * Everything you are not using is in the pack, and everything in the pack can be reached -- for
   * a Ready (core-rules 4). So there is nothing here about reach, and only one rule bites:
   *
   * A **worn** slot does not change mid-fight at all. Nobody swaps rings while being stabbed, and
   * pricing it in Ready would be friction with no decision in it.
   */
  static #canEquipNow(slate, into) {
    if (!game.combat?.started) return true;

    const slot = CARDRPG.slots[into] ?? {};
    if (slot.worn) {
      ui.notifications.warn(
        `${slate.name} is worn, not wielded: ${game.i18n.localize(slot.label)} changes between `
        + "fights, not during one.");
      return false;
    }
    return true;
  }

  static async #makeRoom(actor, item, slot = item.system.slot) {
    // Asked of the actor, not of config: a hand this character no longer has is not a hand.
    const capacity = actor.system.slotCapacity(slot);
    if (capacity === null || capacity === undefined) return [];

    const size = i => (i.system.isTwoHanded ? 2 : 1);
    const here = actor.items.filter(i => i.type === "item" && i.system.equippedSlot === slot);
    const used = here.reduce((n, i) => n + size(i), 0);
    // Two hands are two hands. Slung over a back or hung on a belt, the same weapon is one object.
    const needs = item.system.hands === 2 && slot === "hands" ? 2 : 1;

    const free = used + needs - capacity;
    if (free <= 0) return [];

    /*
     * One Ready changes ONE equipped item, so the only legal swap is a single item for a single
     * item. A two-hander going into a hand holding a sword and a shield would turn over two, and
     * that is two Readies -- take one off first and the swap becomes legal.
     *
     * This used to offer clearing the whole slot at once, which was one Ready doing the work of
     * two.
     */
    const options = here.filter(i => size(i) >= free).map(i => [i]);
    if (!options.length) {
      const slotName = game.i18n.localize(CARDRPG.slots[slot]?.label ?? slot).toLowerCase();
      ui.notifications.warn(here.length
        ? `One Ready changes one item, and ${item.name} would turn over your whole ${slotName} `
          + `(${here.map(i => i.name).join(", ")}). Take one off first.`
        : `Your ${slotName} cannot take ${item.name}.`);
      return null;
    }

    const buttons = options.map((set, index) => ({
      action: String(index),
      label: set.map(i => i.name).join(" + "),
      callback: () => set
    }));
    const noReady = !!CARDRPG.slots[slot]?.freeEquip;
    const chosen = await foundry.applications.api.DialogV2.wait({
      window: { title: `${noReady ? "Swap" : "Ready"}: what does ${item.name} replace?` },
      content: `<div class="cardrpg"><p>Your `
        + `${game.i18n.localize(CARDRPG.slots[slot]?.label ?? slot).toLowerCase()} is full. `
        + `Equipping <strong>${item.name}</strong> means swapping something out`
        + (noReady ? ", which costs nothing." : ", and the swap is the Ready.")
        + "</p></div>",
      buttons: [...buttons, { action: "cancel", label: "Cancel", callback: () => null }],
      modal: true,
      rejectClose: false
    });
    return chosen ?? null;
  }

  static async #onEndTurn() {
    if (!game.combat) return ui.notifications.warn("No combat running.");
    await game.combat.nextTurn();
  }

  static async #onBreathe() {
    const result = await catchBreath(this.actor);
    /*
     * **[FIXED 2026-11-12] The refusal described the retired rule.** It told the player the pile
     * they draw from was too thin to breathe, which was true while a breath moved cards and has
     * not been true since the ruling. A breath buys stamina and moves nothing, so there are two
     * ways it can be refused and neither is about that pile: you are already at your maximum, or a
     * Compulsion has taken the option (`canCatchBreath`).
     *
     * The sentence above deliberately **paraphrases** the retired string rather than quoting it.
     * A check asserts no breath string still promises cards back, and quoting the old one here
     * answered that check with prose -- the same defect, found twice in one day, once in a pin
     * about a retired predicate and once here.
     */
    if (!result) {
      const stamina = this.actor.system?.stamina;
      return ui.notifications.warn(stamina && stamina.value >= stamina.max
        ? `Nothing to buy back: ${this.actor.name} is at full stamina `
          + `(${stamina.value}/${stamina.max}).`
        : "A Compulsion in your hand takes the option: you cannot catch your breath.");
    }
    /* A breath is a whole turn, so it ends the same way a played turn does. */
    await this.#disarmHand();
    this.#resetPlay();
    this.render();
  }

}

/* -------------------------------------------- */

/**
 * Keep every open HUD in step with the documents behind it.
 *
 * Open ApplicationV2 windows live in `foundry.applications.instances`; `ui.windows` holds only
 * ApplicationV1 windows, so looking there finds nothing.
 */
export function registerTrayHooks() {
  const refreshFor = doc => {
    const actor = doc instanceof Actor ? doc : doc.parent;
    if (!actor) return;
    for (const tray of CardRPGTray.openTrays) if (tray.actor?.id === actor.id) tray.render();
  };
  const refreshAll = () => {
    for (const tray of CardRPGTray.openTrays) tray.render();
  };

  // Collapsing the sidebar moves the edge the right column is measured against.
  Hooks.on("collapseSidebar", () => CardRPGTray.refitAll());
  window.addEventListener("resize", () => CardRPGTray.refitAll());

  /*
   * **And watch the sidebar itself, because the two lines above are not enough and look like they
   * are.**
   *
   * `collapseSidebar` fires when the collapse BEGINS, and Foundry animates the bar -- so the rect
   * `#fitSidebar` measures at that instant is the width it is leaving, and the HUD settles against
   * an edge that is no longer there. A hook that fires at the right moment for a state change is
   * the wrong moment for a measurement.
   *
   * And it was only ever one of three ways the edge moves. A sidebar dragged to a new width does
   * not fire it; a chat popped out or docked back does not fire it. The observer catches the
   * settled size and catches all three, which is the same lesson the level-up canvas taught: a box
   * whose size matters is watched, not measured once.
   */
  let sidebarWatch = null;
  const watchSidebar = () => {
    if (typeof ResizeObserver === "undefined") return;
    const own = ui.sidebar?.element;
    const node = own instanceof HTMLElement ? own : (own?.[0] ?? document.getElementById("sidebar"));
    if (!node) return;
    sidebarWatch?.disconnect();
    sidebarWatch = new ResizeObserver(() => CardRPGTray.refitAll());
    sidebarWatch.observe(node);
  };
  Hooks.once("ready", watchSidebar);
  /* Again on a scene change: Foundry rebuilds parts of the interface, and an observer holding a
   * node that has been replaced is watching something nobody can see. */
  Hooks.on("canvasReady", watchSidebar);

  Hooks.on("updateActor", refreshFor);
  Hooks.on("createItem", refreshFor);
  Hooks.on("updateItem", refreshFor);
  Hooks.on("deleteItem", refreshFor);

  // A card doesn't say whose it is, and neither does a combat change, so refresh everything.
  /* `updateScene` is the call for a check: it lives as a scene flag, so every tray reads the one
   * the GM set and redraws when it changes (checks.mjs). */
  for (const hook of ["createCard", "updateCard", "deleteCard", "createCards", "updateCards",
    "deleteCards", "updateCombat", "updateScene"]) {
    Hooks.on(hook, refreshAll);
  }
  /*
   * **`deleteCombat` closes before it refreshes, and the order is the whole of it.**
   *
   * It used to sit in the list above, so ending a fight *redrew* a HUD belonging to a fight that
   * no longer existed. Closing it as well was not enough either: `render()` is asynchronous, and a
   * render already in flight re-attaches an application that has since closed -- the first version
   * of this closed the tray and the pending refresh put it straight back, which measured as a
   * close that did nothing.
   *
   * So the closes are awaited first, and only what is left over is refreshed: a HUD somebody
   * opened by hand is still theirs and still needs redrawing.
   */
  Hooks.on("deleteCombat", async () => {
    await CardRPGTray.closeAfterFight();
    refreshAll();
  });

  /**
   * **The HUD follows the selection.**  [BUILT 2026-11-14]
   *
   * Two things were wrong and they were the same thing. A GM selecting a goblin got nothing --
   * the window refused NPCs outright -- so there was no way to take a monster's turn anywhere in
   * the interface. And selecting a *second* character did not switch the HUD either: it kept
   * drawing whoever it had opened on, which for a GM running four heroes meant three of them were
   * unreachable. Out of combat it never opened at all, so the skill hand, the passives and the
   * call banner were only ever visible if a fight happened to be running.
   *
   * `openFor` holds both visibility rules (hud-spec 7) and is the only thing that decides: a
   * player sees their own character, a GM sees whoever they have selected. So this hook asks and
   * does not second-guess the answer -- a refusal is silent, because selecting a token you cannot
   * play is an ordinary thing to do and not an error.
   *
   * **It opens and never closes.** Deselecting is not a request to put the window away: the tray
   * is the surface you play from, and one that vanished every time a click landed on empty canvas
   * would be unusable. What closes it is the fight ending, which `closeAfterFight` already does
   * for whatever the fight opened -- and a HUD that came up during a fight counts as that, which
   * is the one thing the flag below decides.
   */
  Hooks.on("controlToken", (token, controlled) => {
    if (!controlled || !token?.actor) return;
    CardRPGTray.openFor(token.actor, { auto: !!game.combat?.started });
  });

  // Every one of these is a TRANSITION. Reloading Foundry mid-combat fires none of them, so the
  // HUD stayed shut until the fight was ended and restarted; catch the fight already in progress.
  /*
   * All three hand the new round and turn over in `updateData`, and all three have to pass it on:
   * inside the hook the combat itself still reads as the turn that just ended. See `autoOpen`.
   */
  Hooks.on("combatStart", (combat, updateData) => CardRPGTray.autoOpen(combat, updateData));
  Hooks.on("combatTurn", (combat, updateData) => CardRPGTray.autoOpen(combat, updateData));
  Hooks.on("combatRound", (combat, updateData) => CardRPGTray.autoOpen(combat, updateData));


  // On "ready" the canvas may not be up, and autoOpen looks at the controlled token to decide who
  // is playing; "canvasReady" runs again once it is, and opening twice is a no-op.
  const resume = () => {
    const combat = game.combats?.active ?? game.combat;
    if (combat?.started) CardRPGTray.autoOpen(combat);
  };
  Hooks.once("ready", resume);
  Hooks.on("canvasReady", resume);
}
