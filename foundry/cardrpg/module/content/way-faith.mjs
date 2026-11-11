/**
 * Way of Faith: its pool, its Signatures and the Tactics its titles carry.
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */

/* -------------------------------------------- */

/**
 * Way of Faith's twelve Signature miracles (way-cards 2.4).
 *
 * A miracle is the same slate as a formula and is paid for at the opposite end: *a school is what it
 * cost you to LEARN, a god is what it costs you to ASK* (way-cards 3.5). So nothing here carries a
 * learning price, and every god carries an **Obedience** instead -- which is on the node, not here,
 * because it applies to everything the god ever grants.
 *
 * **The largest gap in the game is now a spell that costs Health to cast**, at six pieces of
 * content: three of Blood Magic's and three of Vax's. Two Ways arrived at the same mechanism from
 * opposite directions -- a mage spending their own substance to buy power, and a war god counting
 * his priest's blood first -- and neither can be built without it.
 */
export const FAITH_SIGNATURES = [
  {
    name: "The Clean Hand", kind: "spell", node: "faith.eternalgod", strength: 2,
    source: "The Eternal God",
    needs: ["a promise that the next draw cannot fail"],
    description: "<p>An ally's next check or attack cannot fail. One cheaper on a brother or "
      + "sister in faith, which is the third tenet made arithmetic.</p>",
    effect: { range: 3, targets: "oneAlly",
    text: "an ally's next check or attack cannot fail" }
  },
  {
    name: "Breath of the Spirit", kind: "spell", node: "faith.eternalspirit", strength: 2,
    source: "The Eternal Spirit",
    /*
     * This one wanted no new trigger at all: `allyHit` has existed since the Bodyguard redirect,
     * and an ally about to be dropped is the same event whether you take the blow or mend it. It
     * was in the queue under *a reaction trigger beyond hit and arrival* because the gap had been
     * merged with Unmake's -- and that merge was wrong, which is this increment's lesson.
     */
    needs: [],
    reaction: "mend",
    description: "<p>Reaction: heal an ally 3, at any range, ignoring cover. The spirit drifts "
      + "through all the air, so distance is not a question for it.</p>",
    effect: {
      verb: "heal", param: 3, timing: "reaction", range: 99, ignoresCover: true
    }
  },
  {
    name: "The Tide Knows", kind: "spell", node: "faith.sessyfyn", strength: 2, source: "Sessyfyn",
    needs: ["two fate draws that both apply"],
    description: "<p>An ally draws fate twice on their next action and keeps both. The sea is not "
      + "fair.</p>",
    effect: { range: 3, targets: "oneAlly",
    text: "an ally draws fate twice on their next action and keeps both" }
  },
  {
    name: "The Drum", kind: "spell", node: "faith.valtor", strength: 1, source: "Valtor",
    needs: ["a bonus that waits for your next Strike"],
    description: "<p>It starts somewhere behind you and it is already in your arms.</p>",
    effect: { text: "your next Strike this turn is +3" }
  },
  {
    name: "The Borrowed Face", kind: "spell", node: "faith.fagar", strength: 3, source: "Fagar",
    needs: ["an enemy that attacks its own side"],
    description: "<p>Spent: one enemy spends this round attacking its own ally. It works once, "
      + "which is the god.</p>",
    effect: { range: 3, targets: "oneEnemy",
    text: "Spent: one enemy spends this round attacking its own ally" }
  },
  {
    /*
     * The one Faith Signature the engine does everything for, and the same shape as Mind's single
     * one: a condition in an area with a saving throw. That part of the engine has been finished
     * longest, so it is where content lands intact.
     */
    name: "The Outcast's Due", kind: "spell", node: "faith.vulpet", strength: 3, source: "Vulpet",
    needs: [],
    description: "<p>Every enemy next to you turns on you, because the outcast is who the crowd "
      + "turns on. That is not a side effect; it is the prayer.</p>",
    effect: {
      verb: "cast", area: 1, areaKind: "blast",
      condition: "compelled", duration: 2, resist: "presence", dc: 5
    }
  },
  {
    name: "Out of Barren Ground", kind: "spell", node: "faith.brendan", strength: 3,
    source: "Brendan",
    needs: [],
    description: "<p>Plant it. At the start of your second turn after, every ally within 2 heals "
      + "4. Nothing he gives arrives when you ask for it.</p>",
    effect: {
      verb: "heal", param: 4, range: 2, targets: "alliesInRange", delay: 2
    }
  },
  {
    name: "The Silent Hour", kind: "spell", node: "faith.grey", strength: 2, source: "The Grey",
    needs: [],
    description: "<p>Reaction, adjacent only: an enemy's action does not happen. Close enough to "
      + "touch, which is where the knife is.</p>",
    /*
     * **Dazed, not Halted**, and the difference is the ladder The Grey is built on: this is an
     * ACTION denied at strength 2 and The Grey Hour is the WHOLE TURN at strength 4. Both were
     * given Halted when the condition was built, which flattened a deliberate pair into two
     * identical cards -- and the break test found it by matching one anchor twice.
     */
    effect: { range: 1, timing: "reaction", condition: "dazed", duration: 1 }
  },
  {
    name: "The First Taste", kind: "spell", node: "faith.purple", strength: 2,
    source: "The Purple",
    needs: [],
    description: "<p>Tainting 2 on one adjacent enemy, and 1 Taint for you. You are the first to "
      + "taste it, always.</p>",
    cost: { taint: 1 },
    effect: { verb: "tainting", param: 2, range: 1 }
  },
  {
    name: "The Rumour", kind: "spell", node: "faith.yellow", strength: 2, source: "The Yellow",
    needs: [],
    description: "<p>Name a lie before the fight. One enemy type acts as if it were true, for as "
      + "long as you keep spending a secondary on it.</p>",
    effect: {
      whileState: "upkeep", text: "one enemy type acts as though a named lie were true"
    }
  },
  {
    name: "The Club and the Line", kind: "spell", node: "faith.vax", strength: 2, source: "Vax",
    /*
     * The Health is built. What is not is the value: *Strike* every adjacent enemy means the club's
     * own number, and a spell is its own weapon (data/items.mjs) -- so a miracle that borrows the
     * weapon in hand is the one shape the new verb line cannot answer.
     */
    needs: ["a spell that strikes with the weapon in hand"],
    cost: { health: 2 },
    description: "<p>Strike every adjacent enemy. No free hand needed, because the club is the "
      + "holy symbol &mdash; which is the gift on the node, not on the card.</p>",
    effect: { verb: "cast", area: 1, areaKind: "blast", text: "with the weapon in hand" }
  },
  {
    name: "The Long Night", kind: "spell", node: "faith.first", strength: 3, source: "The First",
    needs: ["damage that heals the caster"],
    description: "<p>Drain 3 Health from an adjacent living target and gain it. The only renewable "
      + "pool in the game, and the node says what it costs to have one.</p>",
    effect: { verb: "cast", range: 1, mod: 3, text: "you gain the Health you take" }
  },

  /* --- the four orders' Signatures, and none of them is a miracle ---
   *
   * **A miracle belongs to a god and an order does not.** An order is open to a priest of any of
   * the twelve, so a Signature miracle would have to belong to twelve lists at once or to none;
   * these are cards, which belong to the holder. That is not a compromise -- way-cards 2 gives a
   * Signature as a card in nineteen other places, and *what you do in the god's service* is an
   * action rather than a prayer.
   *
   * Three of the four need nothing the engine does not already do, which is a change from the way
   * this Way's content has gone until now: Judged is an opening and openings are published rather
   * than resisted, `block` is already Block given to somebody else, and Strain is a cost a card
   * half has always been able to pay.
   */
  {
    /*
     * The Inquisitor publishes an opening and nothing else, which is the whole design. Judged
     * does *nothing by itself* (conditions.md 1.2) and is never resisted, so this card's worth is
     * entirely in what the rest of the party is already written to do with an opening -- and it
     * makes Way of Faith the Way that hands openings out, where Shade takes them.
     */
    name: "The Writ", kind: "card", node: "faith.inquisitor", needs: [],
    primary: [{ condition: "judged", range: 6, duration: 2 }],
    secondary: [{ verb: "move", param: 1 }],
    text: "No save, at range 6. Being named is not something you resist, and the whole field may "
      + "act on it."
  },
  {
    /* Block given away rather than kept: the effect `block` already is, pointed at the ally and
     * never at the holder, which is the order's rule written as a card. */
    name: "The Order's Shield", kind: "card", node: "faith.shieldsworn", needs: [],
    primary: [{ verb: "defend" }, { verb: "block", param: 2, range: 1 }],
    secondary: [{ verb: "block", param: 1, range: 1 }],
    reaction: "block",
    text: "The Block goes to an adjacent ally and never to you. The order does not defend itself."
  },
  {
    /*
     * The one gap of the four, and it is the order's whole method: a step that pays off a turn in
     * which you did NOT move. `charging` reads the opposite -- a turn in which you did -- so the
     * engine has half of this already and the half it has is the wrong half.
     */
    name: "The Long Silence", kind: "card", node: "faith.anchorite",
    needs: ["a step that reads a turn in which you did not move"],
    primary: [{ verb: "ready", param: 2 }],
    secondary: [{ verb: "shake", param: 1 }],
    text: "Only if you did not move this round. Stillness is the whole of the order's method."
  },
  {
    /* Strain before the blow, which is Valtor's bargain bought with a card instead of a god. */
    name: "The Scourge", kind: "card", node: "faith.flagellant", needs: [],
    primary: [{ verb: "strike", mod: 2 }],
    secondary: [{ verb: "move", param: 2 }],
    costs: { primary: { strain: 1 } },
    text: "Strain 1, paid before the blow lands. The drums, the dance and the whip make the same "
      + "argument: pay first, strike harder."
  }
];

/* -------------------------------------------- */

/**
 * The miracles a Faith minor node hands over (way-cards 3.5).
 *
 * The same rule Mind's pool follows, and easier here: a god's branch leads nowhere but deeper into
 * that god, so a minor node's miracle is always its own god's. Nothing on a Valtor run could hand
 * out a miracle of The Grey without an edge between religions, and there are none -- the religions
 * are the exclusive groups.
 */
export const FAITH_POOL = [
  {
    name: "Name the Guilty", strength: 1, pool: "faith", source: "The Eternal God", needs: [],
    description: "<p>No save. Being named is not something you resist.</p>",
    /* No verb: a step with a condition and no verb IS the condition, and an opening never saves. */
    effect: { range: 6, condition: "judged", duration: 1 }
  },
  {
    name: "Steady the Hand", strength: 1, pool: "faith", source: "The Eternal God",
    needs: ["judging whoever applied a condition"],
    description: "<p>Ends Compelled on an ally, and accuses whoever did it. Answer and accuse, "
      + "which is what a targeted counter has to do to be worth a slot (way-cards 3.6).</p>",
    effect: { verb: "shake", param: 1, condition: "compelled", range: 3 }
  },
  {
    name: "Lay On", strength: 1, pool: "faith", source: "The Eternal Spirit", needs: [],
    description: "<p>Hands, and three squares of air between you.</p>",
    effect: { verb: "heal", param: 2, range: 3 }
  },
  {
    name: "A Word for You", strength: 1, pool: "faith", source: "The Eternal Spirit", needs: [],
    description: "<p>Blessed: a temporary Critical in their fate deck, until it is drawn. The "
      + "condition shuffles the card in by itself (core-rules 6).</p>",
    effect: { range: 3, condition: "blessed" }
  },
  {
    name: "Undertow", strength: 2, pool: "faith", source: "Sessyfyn", needs: [],
    description: "<p>Wet, and everything in it moved a square you choose. Moving figures is a "
      + "sentence the table applies (core-rules 11), so this card is complete.</p>",
    effect: {
      verb: "cast", range: 3, area: 2, areaKind: "blast", condition: "wet", duration: 1,
      text: "every target is moved 1 square you choose"
    }
  },
  {
    name: "No Step Back", strength: 2, pool: "faith", source: "Valtor",
    needs: [],
    description: "<p>Every ally within 2 gains Block 2 until your next turn. Valtor's answer to "
      + "being outnumbered is that nobody moves.</p>",
    effect: { verb: "block", param: 2, area: 2 }
  },
  {
    name: "The Second Thought", strength: 1, pool: "faith", source: "Fagar",
    /* The gap said "an enemy that loses a half", and Dazed IS that: `blocksSecondary` has
     * been on it since there were conditions, `noSecondary` reads it on the actor, and the tray
     * greys the half out. The card described a built mechanic in prose for as long as it existed. */
    needs: [],
    description: "<p>One enemy spends its secondary this round doing nothing.</p>",
    effect: { range: 3, condition: "dazed", duration: 1, resist: "presence", dc: 7 }
  },
  {
    name: "Alone on the Road", strength: 1, pool: "faith", source: "Vulpet",
    needs: ["an effect that reads how far away your allies are"],
    description: "<p>While no ally is within 2 squares, heal 2 at the start of your turn. The only "
      + "healing a priest of hers can ever receive.</p>",
    effect: {
      verb: "heal", param: 2, whileState: "noAllyNear", text: "at the start of your turn"
    }
  },
  {
    name: "Full Belly", strength: 1, pool: "faith", source: "Brendan",
    needs: ["a one-off bonus to the next rest"],
    description: "<p>Out of combat: the party's next rest returns one extra rest token.</p>",
    effect: { text: "the party's next rest returns one extra rest token" }
  },
  {
    name: "Grey Judgement", strength: 2, pool: "faith", source: "The Grey",
    needs: ["moving a figure's place in the round"],
    description: "<p>A Judged adjacent enemy acts last in the round, whatever its initiative.</p>",
    effect: { range: 1, text: "a Judged adjacent enemy acts last this round" }
  },
  {
    name: "Taste of the Rot", strength: 1, pool: "faith", source: "The Purple",
    needs: [],
    description: "<p>One adjacent enemy: 1 damage and Off-Balance, no save. A Miss costs you a "
      + "Taint, which is the god being paid whether or not it worked.</p>",
    cost: { taint: 1 },
    effect: {
      verb: "cast", range: 1, mod: 1, condition: "offBalance", duration: 1,
      /* The trigger stays prose: the price is only paid on a Miss, and when a cost is conditional
       * it is the condition the engine cannot read rather than the number. */
      text: "the Taint only on a Miss"
    }
  },
  {
    name: "The Planted Word", strength: 1, pool: "faith", source: "The Yellow",
    needs: [],
    description: "<p>Name one enemy type before the fight. While you spend a secondary each round, "
      + "that type cannot play reactions.</p>",
    effect: {
      whileState: "spendSecondary", text: "one enemy type cannot play reactions"
    }
  },
  {
    name: "Stand Where I Stand", strength: 1, pool: "faith", source: "Vax",
    needs: ["a floor under an ally's Health"],
    cost: { health: 2 },
    description: "<p>Allies adjacent to you cannot be reduced below 1 Health until your next "
      + "turn. His miracles are paid in yours.</p>",
    effect: { range: 1, targets: "adjacentAllies",
    text: "adjacent allies cannot be reduced below 1 Health" }
  },
  {
    /*
     * The one Health price the field cannot hold: *1 Health per ally* is a cost that depends on
     * where everyone is standing, and `cost.health` is a number. A variable price is a second
     * mechanism, not a bigger number, so it stays in the queue and says so.
     */
    /*
     * Still blocked, and on two different things now that the Block grant exists: the price scales
     * with the line and the AMOUNT is the caster's own armour rather than a number on the card.
     * Both are reasons a fixed `param` cannot hold it, and naming them apart is what the list is
     * for -- the old single string hid that this card needed two unrelated mechanisms.
     */
    name: "The Shield Line", strength: 2, pool: "faith", source: "Vax",
    needs: ["Block equal to the caster's own armour"],
    description: "<p>Every ally adjacent to you gains your armor value as Block until your next "
      + "turn. One Health per ally, so a long line is a dear one.</p>",
    cost: { health: 1, scale: "perAlly" },
    effect: { range: 1, targets: "adjacentAllies",
    text: "adjacent allies gain your armor as Block" }
  },
  {
    name: "Measure of the Debt", strength: 2, pool: "faith", source: "The First",
    needs: ["an event when a figure's Health reaches zero"],
    description: "<p>A Judged enemy that dies this round pays you 3 Health. The debt is collected "
      + "whether or not you were the one who called it in.</p>",
    effect: { text: "a Judged enemy that dies this round: you gain 3 Health" }
  },
  {
    /*
     * The one miracle that charges a god's own coin on the card as well as in the obedience, and it
     * charges it FOR GOOD: each time it saves you there is less of you left to save with. A priest
     * of The First who has survived four times cannot cast at all.
     */
    name: "What Does Not Die", strength: 3, pool: "faith", source: "The First",
    needs: ["an event when a figure's Health reaches zero"],
    description: "<p>When you would drop to 0 Health, drop to 1 instead &mdash; and lose a spell "
      + "slot permanently.</p>",
    effect: { text: "drop to 1 instead of 0, and lose a spell slot for good" }
  },

  /*
   * --- The Eternal God, four miracles, and the one that reads its own opening ---
   *
   * *The Weight of It* only works on a **Judged** enemy, which looks like the gating an opening is
   * forbidden to do (way-cards 1.6) -- and is not, for the reason rule 3a gives: Judged is applied
   * by *Name the Guilty*, which is a miracle of the same god and in the same book. A priest who
   * prepared both arranged this; nobody is waiting on a draw.
   */
  {
    name: "The Weight of It", strength: 2, pool: "faith", source: "The Eternal God",
    needs: ["armour counted as zero against everyone"],
    description: "<p>Named, and then weighed. For one round its armour is worth nothing to "
      + "anybody on the field, which is a gift to the whole line rather than to you.</p>",
    effect: {
      range: 6,
      text: "a Judged enemy's armor counts 0 against everyone until your next turn"
    }
  },
  {
    /*
     * The only content in the game that makes a spell CHEAPER, and it is priced in the one
     * resource a priest of the clean body is supposed to spend: cards. A ten-card deck is four
     * below a Warrior's and the reason to accept that is here.
     */
    name: "The Narrow Path", strength: 1, pool: "faith", source: "The Eternal God",
    needs: ["a slot cost that a deck size changes"],
    description: "<p>Less to carry, less to remember, and the words come easier. A thin deck is "
      + "the clean body, written as arithmetic.</p>",
    effect: {
      whileState: "thinDeck",
      /* Not a price this step pays but a discount on every other: `cost` is what a step charges,
       * and a spell that makes OTHER spells cheaper has nowhere to put that yet. */
      text: "your miracles cost 1 slot less (min 1)"
    }
  },
  {
    name: "The Clean Field", strength: 4, pool: "faith", source: "The Eternal God",
    needs: ["an enemy that loses a half"],
    description: "<p>For one round nobody on the other side does anything but their main business. "
      + "It is the same mechanism as Fagar's small trick, over the whole field.</p>",
    effect: { text: "until your next turn no enemy may play a secondary" }
  },
  {
    name: "The Body Made Clean", strength: 5, pool: "faith", source: "The Eternal God",
    needs: ["healing and lifting over every ally at once",
      "a deck size an effect sets until the day ends"],
    description: "<p>Everybody whole, and nothing on anybody. You will play the rest of the day "
      + "out of six cards, which is the god's point: the body is clean and the hand is "
      + "empty.</p>",
    effect: {
      targets: "everyAlly",
      text: "every ally is healed to full and every condition is Lifted and Shaken off. Your "
        + "action deck is 6 cards for the rest of the day"
    }
  },

  /*
   * --- The Eternal Spirit, four miracles, and the only one that takes a condition onto itself ---
   */
  {
    name: "Bear It for Them", strength: 2, pool: "faith", source: "The Eternal Spirit",
    reaction: "mend",
    needs: ["a condition moved from one figure to another"],
    description: "<p>Whatever is on them is on you instead, at its full duration. The Spirit's "
      + "priests are the only ones who can do this and the only ones who would.</p>",
    effect: { range: 3, timing: "reaction", targets: "oneAlly",
    text: "move one condition off an ally and onto yourself" }
  },
  {
    /*
     * Blessed and Cursed each shuffle a card into a fate deck by themselves (core-rules 6), so
     * lifting the condition takes its card with it -- the condition OWNS the card. That is why
     * this miracle, which reads as though it needed a second mechanism, needs none.
     */
    name: "A Word Withdrawn", strength: 1, pool: "faith", source: "The Eternal Spirit",
    needs: [],
    description: "<p>The marker and the card both: a blessing withdrawn is a Critical taken back "
      + "out of the deck, and a curse withdrawn is a Miss. It works on anybody, including the "
      + "enemy you blessed by mistake.</p>",
    effect: { verb: "lift", range: 3, condition: "blessed", text: "or Cursed" }
  },
  {
    name: "The Air Between", strength: 4, pool: "faith", source: "The Eternal Spirit",
    needs: ["an extra reaction on one trigger"],
    description: "<p>For one round everybody answers twice. The reaction policy allows one per "
      + "trigger and this is the only thing in the game that argues with it.</p>",
    effect: { targets: "everyAlly",
    text: "until your next turn every ally may take one extra reaction per trigger" }
  },
  {
    name: "Breath for the Dying", strength: 5, pool: "faith", source: "The Eternal Spirit",
    needs: ["an event when a figure's Health reaches zero",
      "a ban on carrying anything for the rest of the day"],
    description: "<p>Everybody who had fallen is standing, at half. You will carry nothing at all "
      + "until tomorrow, which in a dungeon is a real price and not a flourish.</p>",
    effect: {
      targets: "everyAlly",
      text: "every ally at 0 Health stands at half Health. You may carry nothing for the rest "
        + "of the day"
    }
  },

  /*
   * --- Sessyfyn, three miracles, and a price that was already a condition ---
   *
   * *The Turning Tide* pays with "a temporary Miss in your own fate deck", which is **Cursed**
   * exactly as conditions.md defines it -- so the god's price needed no mechanism at all. It is the
   * clearest case in the twenty-four of a price that was already in the engine under another name.
   */
  {
    name: "The Turning Tide", strength: 2, pool: "faith", source: "Sessyfyn",
    reaction: "mend",
    needs: ["a reaction trigger on an ally's turn"],
    description: "<p>The sea is not fair. They draw again and must keep the second card, and a "
      + "Miss joins your own deck for having asked.</p>",
    effect: {
      range: 3, condition: "cursed",
      timing: "reaction", targets: "oneAlly",
      text: "an ally redraws a fate card and keeps the second. The Cursed is yours"
    }
  },
  {
    name: "The Spring Tide", strength: 4, pool: "faith", source: "Sessyfyn",
    needs: ["two fate draws that both apply"],
    description: "<p>For one round the whole party has the tide with them: two cards each, and "
      + "both of them count.</p>",
    effect: { targets: "everyAlly",
    text: "until your next turn every ally draws fate twice and keeps both" }
  },
  {
    /*
     * The god's 5, and the only miracle that changes the game rather than the fight: one deck for
     * everybody means your luck and theirs are the same luck. A priest of the sea thinks that is
     * obviously correct.
     */
    name: "The Sea Decides", strength: 5, pool: "faith", source: "Sessyfyn",
    needs: ["one fate deck shared by the whole field"],
    description: "<p>Every fate deck on the field, shuffled into one. For the rest of the fight "
      + "nobody has their own luck, which is the fairest thing the sea has ever done.</p>",
    effect: { text: "shuffle every fate deck on the field into one; everyone draws from it" }
  },

  /*
   * --- Valtor, three miracles, and a price that is NOT a gap ---
   *
   * Every miracle of Valtor's costs Strain, and Strain is a cost a card half pays
   * (data/items.mjs). On a miracle it is an **obedience** -- the GM's, like a vow -- which is why
   * none of these carries a gap for it. The war god counts his priest's blood first and the engine
   * is not asked to do the counting.
   */
  {
    name: "The Charge", strength: 2, pool: "faith", source: "Valtor",
    needs: [],
    description: "<p>Strain 2, and the whole line moves at once. Movement is a sentence the table "
      + "applies (core-rules 11), so this miracle is finished as written.</p>",
    cost: { strain: 2 },
    effect: { area: 2, targets: "alliesInRange",
    text: "every ally within 2 may Move their full value, at once, now" }
  },
  {
    name: "The War Drum", strength: 4, pool: "faith", source: "Valtor",
    needs: ["a whole turn taken again, now"],
    description: "<p>Strain 3, and everybody near you goes again. The same mechanism Blood "
      + "Magic's thesis wants, bought with pain instead of blood.</p>",
    cost: { strain: 3 },
    effect: { area: 2, targets: "alliesInRange",
    text: "every ally within 2 takes their whole turn again, now" }
  },
  {
    name: "Valtor's Own", strength: 5, pool: "faith", source: "Valtor",
    needs: ["two secondaries every turn until the fight ends"],
    description: "<p>Your whole hand, strained, and for the rest of the fight you act like three "
      + "men. There is nothing left to play it with, which is the god's idea of a bargain.</p>",
    cost: { strain: 1, scale: "wholeHand" },
    effect: {
      text: "for the rest of the fight you play a primary and two secondaries each turn"
    }
  },

  /*
   * --- Fagar, three miracles, and the intent cards ---
   *
   * Two miracles of two different gods want to look at the enemy's **intent card** -- Fagar's
   * small one and Divination's thesis -- and they carry one string between them, because showing a
   * player an intent card is one piece of work whichever god asked.
   */
  {
    name: "The Second Face", strength: 1, pool: "faith", source: "Fagar",
    needs: ["an enemy's intent cards, shown in order"],
    description: "<p>Spent: you know what one of them is going to do before anybody moves. "
      + "Fagar's whole theology is that this is enough.</p>",
    effect: { text: "Spent: read one enemy's intent card for this round before anyone acts" }
  },
  {
    name: "The Mask of the Captain", strength: 4, pool: "faith", source: "Fagar",
    needs: ["playing an enemy's turn for them"],
    description: "<p>For one round it is yours: you play its turn, with its cards, against its "
      + "own side. The trick works once and everybody remembers your face afterwards.</p>",
    effect: { text: "one enemy obeys you for a round -- you play its turn" }
  },
  {
    name: "Everyone Wears His Face", strength: 5, pool: "faith", source: "Fagar",
    needs: ["an enemy that attacks its own side"],
    description: "<p>For one round no enemy can tell friend from foe, and every attack they make "
      + "lands on one of their own. It is the same mechanism Glamour's 4 wants, done once and "
      + "for certain rather than at random.</p>",
    effect: { targets: "enemiesInRange",
    text: "until your next turn every enemy attack targets another enemy" }
  },

  /*
   * --- Vulpet, three miracles, and the god who makes you worth helping least ---
   */
  {
    name: "Nobody's Friend", strength: 2, pool: "faith", source: "Vulpet",
    needs: ["an ally forbidden to heal or shield one figure"],
    description: "<p>One of them is alone now: nobody will heal it, step in front of it or take a "
      + "hit for it. Vulpet's priests understand this condition from the inside.</p>",
    effect: {
      range: 3,
      targets: "oneEnemy",
      text: "until your next turn no ally may Heal, Interpose for, or redirect a hit from one enemy"
    }
  },
  {
    name: "The Driven Out", strength: 4, pool: "faith", source: "Vulpet",
    needs: ["a condition applied to an area", "Block that counts how many it caught"],
    description: "<p>Everything within three squares wants you and nothing else, and you are "
      + "three Block better off for each one of them. It is a good trade and a terrible "
      + "position.</p>",
    effect: {
      area: 3, condition: "compelled", duration: 1, resist: "presence", dc: 7,
      text: "and you gain Block 3 for each enemy Compelled"
    }
  },
  {
    /*
     * The god's 5, and the only miracle whose drawback is the whole point: you have removed the
     * fight and you are lying on the floor by yourself when it comes back. Vulpet is the god of
     * the outcast and this is what she offers.
     */
    name: "The Land Beneath", strength: 5, pool: "faith", source: "Vulpet",
    needs: ["a figure taken off the board and put back later"],
    description: "<p>The ground opens and takes them. They are back at the start of your third "
      + "turn, and you are Prone, and alone, and it is entirely your own doing.</p>",
    effect: {
      area: 2,
      targets: "enemiesInRange",
      delay: 3,
      /* The delay is when they COME BACK, which is the one thing this card needed a field for.
       * The rest -- gone in the meantime, and you Prone for doing it -- is still prose. */
      text: "every enemy within 2 is gone until then. You are Prone"
    }
  },

  /*
   * --- Brendan, three miracles, and all three resolve on a turn that has not happened ---
   *
   * One string between them, and it is the string *On the Third Day* named: growth out of barren
   * ground is a god whose miracles are all delayed, and a delayed effect is one mechanism however
   * many turns it waits.
   */
  {
    name: "The Slow Mercy", strength: 2, pool: "faith", source: "Brendan",
    needs: [],
    description: "<p>Name them now. At the start of your third turn they are whole, which is "
      + "either too late or exactly right.</p>",
    effect: {
      range: 3, targets: "oneAlly",
      delay: 3,
      text: "healed to full"
    }
  },
  {
    name: "The Orchard", strength: 4, pool: "faith", source: "Brendan",
    needs: [],
    description: "<p>Two turns from now the whole party heals four and sheds something. Planting "
      + "is the god's only verb.</p>",
    effect: {
      verb: "heal", param: 4, targets: "everyAlly", delay: 2,
      text: "and sheds one condition"
    }
  },
  {
    /*
     * The god's 5, and it raises the dead on a four-turn delay -- which means casting it is a bet
     * that the fight lasts. Brendan does not do anything quickly and will not start now.
     */
    name: "What Grows Out of Us", strength: 5, pool: "faith", source: "Brendan",
    needs: ["a figure a spell puts on the map"],
    description: "<p>Four turns. Then everybody stands up, including the ones who had stopped "
      + "being people and started being ground.</p>",
    effect: {
      targets: "everyAlly", delay: 4,
      text: "every ally including the dead stands at full Health"
    }
  },

  /*
   * --- The Grey, three miracles, all adjacent, and the shortest card in the game ---
   */
  {
    name: "The Close Work", strength: 2, pool: "faith", source: "The Grey",
    reaction: "deflect",
    needs: ["an enemy that attacks its own side"],
    description: "<p>You move his arm. The man behind him takes it, and neither of them "
      + "understands what happened.</p>",
    effect: { timing: "reaction", text: "adjacent: an enemy's Strike hits the nearest other enemy instead" }
  },
  {
    name: "The Grey Hour", strength: 4, pool: "faith", source: "The Grey",
    /* One gap closed and one left: Halted is the condition that denies a turn, but a trigger
     * AT THE START of an enemy's turn is still something nothing in the engine offers. */
    needs: ["a trigger at the start of an enemy's turn"],
    description: "<p>Its whole turn does not happen. Not interrupted &mdash; it simply never "
      + "took place, and the round moves on without it.</p>",
    effect: { range: 1, timing: "reaction", condition: "halted", duration: 1 }
  },
  {
    /*
     * The god's 5, and the only content in the game that kills without a draw. It is a sentence
     * long because there is nothing to resolve: no save, no fate card, no armour, no Block. The
     * price is the god's own, paid continuously, and the knife is the whole theology.
     */
    name: "The Silent Knife", strength: 5, pool: "faith", source: "The Grey",
    needs: ["a kill with no draw and no save of any kind"],
    description: "<p>Adjacent only. One enemy is dead. There is no roll of any kind, which is "
      + "what a god of the silent approach has instead of a spell.</p>",
    effect: { text: "adjacent: one enemy is dead. No save, no fate draw, no roll of any kind" }
  },

  /*
   * --- The Purple, three miracles, and a disease is not a poison ---
   *
   * `tainting` is a built verb with a slow and a fast form (config.mjs), which is why this god's
   * small miracles need nothing: the mechanism arrived with Taint itself.
   */
  {
    name: "The Brewer's Tithe", strength: 2, pool: "faith", source: "The Purple",
    needs: [],
    description: "<p>Slow, and still there next week. A disease rather than a poison, which is "
      + "the distinction the whole cult is built on.</p>",
    effect: { verb: "tainting", param: 2, text: "slow: a disease, not a poison" }
  },
  {
    name: "The Poisoned Well", strength: 4, pool: "faith", source: "The Purple",
    needs: ["a condition applied to an area"],
    description: "<p>Three squares of it, fast. Everything standing in the water carries it "
      + "away.</p>",
    effect: { verb: "tainting", param: 1, area: 3, areaKind: "blast", text: "fast" }
  },
  {
    name: "The Slow Failure", strength: 5, pool: "faith", source: "The Purple",
    needs: [],
    description: "<p>Tainting 3 on them and two Taint on you &mdash; which with the first taste "
      + "is Afflicted. A priest of The Purple who casts their thesis is ill for good.</p>",
    cost: { taint: 2 },
    effect: { verb: "tainting", param: 3 }
  },

  /*
   * --- The Yellow, three miracles, and two of them are held up by a secondary ---
   *
   * The same mechanism *The Long Con* wants, and the same string: an effect that lasts only while
   * you keep paying a half every round is one piece of work, and this god has three users of it.
   */
  {
    name: "Half a Truth", strength: 2, pool: "faith", source: "The Yellow",
    needs: ["an ally the enemy acts as though absent"],
    description: "<p>Name one of your own. For a round the enemy fights as though they were not "
      + "on the field at all, which is as good as cover and better than armour.</p>",
    effect: {
      targets: "enemiesInRange",
      text: "until your next turn enemies act as though one ally you name were not there"
    }
  },
  {
    name: "The Whole Cloth", strength: 4, pool: "faith", source: "The Yellow",
    needs: ["an enemy that counts you as an ally"],
    description: "<p>While you keep paying a half every round, one whole kind of enemy believes "
      + "the party are its own. Stop paying and the room remembers.</p>",
    effect: {
      whileState: "spendSecondaryEachRound",
      text: "one enemy type believes the party are its own"
    }
  },
  {
    /*
     * The god's 5, and the only miracle that edits the fiction rather than the fight: the GM runs
     * the fight as though the lie had always been true. There is nothing for the engine to do and
     * that is not a gap -- it is the largest thing in the twelve gods and it is all table.
     */
    name: "The Lie That Held", strength: 5, pool: "faith", source: "The Yellow",
    needs: [],
    description: "<p>Name the lie before the fight. While you spend a secondary each round it is "
      + "true, and the GM runs the fight as though it always had been.</p>",
    effect: {
      whileState: "spendSecondaryEachRound",
      text: "a lie named before the fight is true"
    }
  },

  /*
   * --- Vax, two miracles, and the god who bills you per man ---
   *
   * *The Line Holds* pays 2 Health per ally, which is the same variable price *The Red Hour* and
   * *The Shield Line* pay and the same string. Three pieces of content from two Ways want one
   * mechanism, which is the clearest sign it belongs in the schema.
   */
  {
    name: "The Line Holds", strength: 4, pool: "faith", source: "Vax",
    needs: ["immunity to a named condition, which nothing grants"],
    description: "<p>Nobody beside you is moved, knocked down or turned. It costs two Health a "
      + "man, and Vax expects you to count them first.</p>",
    cost: { health: 2, scale: "perAlly" },
    effect: {
      duration: 1,
      targets: "adjacentAllies",
      text: "allies adjacent to you cannot be moved, knocked Prone or Compelled"
    }
  },
  {
    /*
     * The god's 5, and the only miracle in the game that moves damage ONTO the caster as a
     * standing rule rather than once. "It will cost enough" is the document's own pricing and it
     * is right: a priest of Vax holding a line of four is taking four men's hits.
     */
    name: "The East District", strength: 5, pool: "faith", source: "Vax",
    needs: ["damage dealt to an ally dealt to you instead",
      "allies that share the caster's armor"],
    description: "<p>Your armour is theirs, your Block is theirs, and everything aimed at them "
      + "arrives in you. It will cost enough, which is how Vax prices war plainly.</p>",
    effect: {
      targets: "adjacentAllies",
      text: "until the fight ends every adjacent ally shares your armor and Block, and damage "
        + "dealt to them is dealt to you instead"
    }
  },
];

/* -------------------------------------------- */

/**
 * Way of Faith's Tactics (way-cards 2.5). Each is shaped by its god's Obedience, because a priest's
 * tactics are not theirs.
 */
/*
 * **Two were renamed, and both for the reason that renamed Infantry's.** The document gives Vax
 * *The Line*, which Way of Strength's Infantry already carries, and gives The First *What Does Not
 * Die*, which is the name of one of The First's own miracles. A player holding a card and carrying
 * a standing feature with one name doing two different things is the defect the collision check
 * exists to refuse, so way-cards 2.5 now prints the names below.
 */
export const FAITH_TACTICS = {
  "No Shelter for the Guilty":
    "Enemies get no cover from figures against you.",
  "Where the Air Goes":
    "You may reach any ally you can see, ignoring cover and range, for anything that heals or "
    + "helps.",
  "The Tide Comes In":
    "At the start of each round, move any one willing ally 1 square.",
  "The Drum Does Not Stop":
    "You may never Defend -- and if you moved toward an enemy this turn, your Strike cannot be "
    + "answered by a reaction.",
  "Nobody Remembers Your Face":
    "The first enemy to attack you each fight draws fate with disadvantage.",
  "Alone and Unafraid":
    "While no ally is within 2, you cannot be Compelled and enemies have disadvantage against you.",
  "Roots":
    "A square you have stood in for a whole round is high ground for you and difficult ground for "
    + "your enemies.",
  "Close Enough to Touch":
    "Moving into a square adjacent to an enemy costs you nothing, even out of difficult ground, "
    + "and never sets off a reaction.",
  "The Cup Passes":
    "An enemy will not willingly end its movement adjacent to you; doing so costs it a half.",
  "Nobody Knows Where You Are":
    "Enemies treat you as standing where you were at the start of the round.",
  "The Line of Vax":
    "While two or more allies are adjacent to you, none of you can be moved and none of you is "
    + "blocked by cover.",
  "What Is Left":
    "At 0 Health you keep acting as though at 1 until the end of the round in which you fell.",

  /* --- the four orders ---
   *
   * A god's Tactic is shaped by its Obedience; an order's is shaped by its rule, which is the same
   * bargain one layer down. None of the four names a number, because that is the standing rule for
   * a thing that is always on (way-cards 2.5).
   */
  "Nobody Lies Twice":
    "An enemy carrying an opening you put there may not take a reaction against you.",
  "Nobody Falls Beside You":
    "An ally adjacent to you may not be moved against their will, and cover between the two of "
    + "you does not exist.",
  "The Empty Cell":
    "You cannot be Burdened or Overloaded, and no card may be taken or lifted from any deck of "
    + "yours.",
  "Past Caring":
    "While your Health is half or less you cannot be Compelled or Heckled, and leaving a square "
    + "adjacent to an enemy never sets off a reaction."
};