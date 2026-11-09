/**
 * Way of Mind: its pool, its Signatures and the Tactics its titles carry.
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */

/* -------------------------------------------- */

/**
 * Way of Mind's minor-node formulas (way-cards 3.4).
 *
 * **A minor node grants its TIER-1 school's formula, never the destination's**, and that is the
 * whole of leveling.md 7's note about this Way: *the only cross edges worth wanting in Mind would
 * arrive at a school's deeper nodes -- formulas without the school's cost, the forbidden kind.* A
 * node on the run from Blood Magic to Necromancy is still a Blood node, so it hands out Blood's
 * list. You cannot buy a necromancer's formulas without buying the Taint that pays for them.
 *
 * Elemental Magic needed none of these: **Rain, Lightning, Frost and Scorch already exist**
 * (`FORMULAS`, written to demonstrate the combo mechanic), so its four runs hand those over and the
 * Rain-plus-Lightning pair is reachable by levelling for the first time rather than by fiat.
 *
 * Some of these are dearer than a young caster's whole budget -- *The Red Hour* is 4 against the
 * three slots this branch has granted by then. That is deliberate and it is what a spell book is
 * for: **the book holds what the budget cannot**, and the slots that arrive later are what make it
 * castable. A formula is never wasted, only unprepared.
 */
export const MIND_POOL = [
  {
    name: "Open the Vein", strength: 1, pool: "mind", source: "Blood Magic",
    /*
     * Not the armour gap: `ignores` comes off armour and never off Block, which core-rules 5 is
     * explicit about -- so going round a shield is a second field. It is read now, and the
     * description has stopped being a claim the engine contradicted.
     */
    needs: [],
    cost: { health: 1 },
    description: "<p>Your own blood, thrown. It goes round a shield rather than through it.</p>",
    effect: { verb: "cast", range: 2, mod: 3, ignoresBlock: true }
  },
  {
    /*
     * The one piece of content the Health cost finished outright, and it is worth knowing why:
     * everything else on the list wanted a second thing as well. A condition with a saving throw
     * is the oldest finished part of the engine, so this had only ever been waiting on the price.
     */
    name: "Boil", strength: 3, pool: "mind", source: "Blood Magic",
    needs: [],
    cost: { health: 2 },
    description: "<p>Not your blood this time. Theirs, and it does not stop.</p>",
    effect: {
      verb: "cast", condition: "burning", intensity: 3, duration: 2, resist: "might", dc: 7
    }
  },
  {
    /*
     * The only card or formula in the game that grants a second primary, which is what Blood
     * Magic's axis means: Tempo is bought with blood and nothing else buys it at all.
     */
    name: "The Second Heartbeat", strength: 3, pool: "mind", source: "Blood Magic",
    needs: ["a second primary in one turn"],
    cost: { health: 4 },
    description: "<p>Two hearts for one turn. The second one is paid for.</p>",
    effect: { text: "Spent: play a second primary this turn" }
  },
  {
    name: "The Red Hour", strength: 4, pool: "mind", source: "Blood Magic",
    /* A Health cost per ALLY, so the same variable price The Shield Line pays and the same gap. */
    needs: [],
    description: "<p>You open a vein for each of them, and for an hour nobody is tired.</p>",
    cost: { health: 1, scale: "perAlly" },
    effect: { range: 2, duration: 1, targets: "alliesInRange",
    text: "every ally within 2 may play a second secondary" }
  },

  {
    name: "The Small Pact", strength: 1, pool: "mind", source: "Spiritualism",
    needs: [],
    description: "<p>Name the god you are pacted with, and it does the thing written on the pact. "
      + "The same thing, every time &mdash; which is what makes this a spell and not a wish.</p>",
    effect: { text: "the god grants the favour written on your pact" }
  },
  {
    name: "Hold to the Bargain", strength: 2, pool: "mind", source: "Spiritualism",
    /*
     * The card that proved a merged gap can be three jobs: it wanted a RESOLVER, not a trigger,
     * because nothing in the engine resolved a skill check. Now something does, and the trigger
     * it needed fell out of the resolver the way `cast` fell out of casting.
     */
    needs: [],
    reaction: "bargain",
    description: "<p>It was going to fail. Something intervened, once, because it owes you.</p>",
    effect: {
      timing: "reaction", oncePer: "pactPerFight",
      targets: "oneAlly",
      text: "an ally's failed check becomes a Partial"
    }
  },
  {
    name: "The Nine Names", strength: 1, pool: "mind", source: "Spiritualism",
    needs: [],
    description: "<p>Out of combat. A minor god names who in this place it is angry with, and will "
      + "not say why.</p>",
    effect: { timing: "outOfCombat", text: "a minor god names who here it is angry with" }
  },
  /**
   * **[PLACEHOLDER]** One spell so `shape` is written by content as well as read by the engine --
   * a field nothing writes is the same defect as a field nothing reads.
   *
   * The Doomfly is named because it is in the roster and it flies, which is the clearest thing a
   * borrowed shape can be worth. Spiritualism is the school because the minor gods *are* a hundred
   * or so nature spirits (Firma.md) and this is asking one for the loan of its body. Replace the
   * creature, the strength and the name freely: what the increment settles is the mechanism.
   */
  {
    name: "The Borrowed Body", strength: 3, pool: "mind", source: "Spiritualism",
    needs: [],
    description: "<p>A spirit lends you its shape. Your deck, your Health and whatever is wrong "
      + "with you come along &mdash; a body is what you fight with, not who you are.</p>",
    effect: {
      verb: "shape", duration: 2,
      /* Both hands, which is the whole point of being a fly: every weapon, shield and implement
       * you were carrying is on the floor until you are yourself again. */
      shape: { transformation: "Doomfly", quarantine: { slots: ["hands"] } }
    }
  },
  {
    name: "The Gathered Pact", strength: 4, pool: "mind", source: "Spiritualism",
    needs: [],
    description: "<p>Every pact at once, called in on the same turn. Each god does exactly what it "
      + "promised and no more, which is why this is worth four slots and not five.</p>",
    effect: { text: "every god you are pacted with grants its written favour, this turn" }
  },

  /*
   * Blood Magic's thesis, and the one formula whose PRICE the engine cannot state. Every other
   * Health cost in the game is a number (`cost.health`); this one is half of whatever you have
   * left, so it is cheap when you are winning and nearly suicide when you are not. That is the
   * spell. A fixed number would be a different card.
   */
  {
    name: "The Last Drop", strength: 5, pool: "mind", source: "Blood Magic",
    needs: ["a whole turn taken again, now",
      "a Health cost that is a fraction of what you have left"],
    description: "<p>You will not be standing afterwards. You will have had two turns.</p>",
    cost: { health: 1, scale: "halfCurrent" },
    effect: { text: "take your whole turn again, now" }
  },

  /*
   * --- Necromancy, five formulas, and every one of them taints ---
   *
   * The school prices itself and the arithmetic is the point: a bound Taint per formula, three
   * Taint is Afflicted (core-rules 8), so a necromancer who learns four of these cannot stand up.
   * Nobody balanced that; it falls out of the price. The gap is the same string on all five,
   * because a gap shared by five formulas is one piece of work.
   */
  {
    name: "Grave Chill", strength: 2, pool: "mind", source: "Necromancy",
    needs: ["a spell that taints its caster", "a condition applied to an area"],
    description: "<p>The cold that comes off a body, aimed. Two squares of it, and everything in "
      + "them is slow to understand what happened.</p>",
    effect: {
      verb: "cast", area: 2, areaKind: "aimed",
      condition: "dazed", duration: 1, resist: "might", dc: 5
    }
  },
  {
    name: "The Long Preparation", strength: 1, pool: "mind", source: "Necromancy",
    needs: ["a spell that taints its caster",
      "a bonus against one enemy type, named before the fight"],
    description: "<p>You read about them the night before. It is not insight; it is homework, and "
      + "it only works on the thing you did it for.</p>",
    effect: { timing: "beforeFight", text: "name one enemy type: your Casts against it are +2 all fight" }
  },
  {
    /*
     * Out of combat, three questions, and the engine has nothing to do. A corpse answering is the
     * GM's job in the same way Move is the table's -- so this is a FINISHED formula with one gap,
     * and the gap is the price rather than the spell.
     */
    name: "Ask the Dead", strength: 1, pool: "mind", source: "Necromancy",
    needs: ["a spell that taints its caster"],
    description: "<p>It answers three questions truthfully, as far as it knew &mdash; which is "
      + "usually less than you hoped and occasionally much more.</p>",
    effect: { timing: "outOfCombat", text: "a corpse answers three questions, as truthfully as it knew" }
  },
  {
    name: "The Risen Rank", strength: 4, pool: "mind", source: "Necromancy",
    needs: ["a spell that taints its caster"],
    description: "<p>Every body within three squares, up at once, for one round. Then they are "
      + "bodies again, and the ground is worse than it was.</p>",
    effect: {
      verb: "conjure", range: 3, duration: 1,
      /* The rank is a number the player and the GM settle from what is actually lying there;
       * what this card fixes is the one round, which is what it costs for being a rank. */
      conjure: { creature: "" },
      text: "corpses rise, and fall again when the round ends"
    }
  },
  {
    /*
     * The school's 5, and its price is the only one in the game that grows while the spell is
     * still running: a Taint for every round your friend stayed up. Stopping early is a decision
     * the caster makes against their own deck, which is what makes this Preparation.
     */
    name: "The Grave's Bargain", strength: 5, pool: "mind", source: "Necromancy",
    needs: ["a spell that taints its caster", "a price that grows for every round an effect lasts"],
    description: "<p>They stand up at one Health, and they are themselves, and they know. When "
      + "the fight ends they are dead again, and you are a little less alive for it.</p>",
    effect: {
      verb: "conjure",
      conjure: { creature: "", upkeep: { taint: 1 } },
      /* The one thing no field carries: it is an ALLY's body, and they come back at 1. */
      targets: "oneAlly",
      text: "a dead ally, and they stand at 1 Health"
    }
  },

  /*
   * --- Elemental Magic, five more, and the one that belongs to no sphere ---
   *
   * [FOUND IN CODE] *Flesh of the Earth* is an ACID formula in a school with four spheres --
   * fire, frost, storm, water (config.mjs) -- and acid is none of them. Earth is not an element an
   * elementalist may hold, so this formula cannot read "your element" the way the two Sphere
   * spells do: it is the school's one element-free formula and its `element` is blank on purpose.
   *
   * That is not a defect in the engine. `Corrode` is a built effect and the formula resolves; what
   * it cannot be is EXCLUSIVE, which is the whole point of holding a sphere.
   */
  {
    name: "Flesh of the Earth", strength: 2, pool: "mind", source: "Elemental Magic",
    needs: [],
    description: "<p>Acid, which is nobody's sphere. It eats the armour as well as the man, and "
      + "the man notices second.</p>",
    effect: {
      verb: "cast", range: 3, condition: "burning", intensity: 1, duration: 2,
      text: "and Corrode 1: it eats the armour as well as the man"
    }
  },
  {
    /*
     * Water used sideways, and the shortest proof that this school's axis is Position: it deals
     * nothing, saves nothing, and takes a man out of a grapple he was going to lose.
     */
    name: "Slippery", strength: 1, pool: "mind", source: "Elemental Magic", element: "water",
    needs: [],
    description: "<p>Not enough water to drown in. Exactly enough to be impossible to hold.</p>",
    effect: {
      verb: "shake", param: 1, condition: "grappled", range: 2,
      text: "until your next turn they cannot be Grappled again"
    }
  },
  {
    name: "The Sphere Entire", strength: 4, pool: "mind", source: "Elemental Magic",
    needs: [],
    description: "<p>Five squares of whichever sphere is yours, and standing in it costs you "
      + "something every turn you stay.</p>",
    effect: {
      range: 3, area: 5,
      ground: { shape: "area", effects: ["difficult", "cover"], damage: 2 },
      /* The element stays prose because the caster picks it, and which one it is changes nothing
       * the engine does to the ground. */
      text: "of your element"
    }
  },
  {
    name: "The Standing Flood", strength: 3, pool: "mind", source: "Elemental Magic",
    element: "water",
    needs: [],
    description: "<p>Deep water where there was a floor. Everything in it is Wet, which is the "
      + "opening half this school is built to set up.</p>",
    effect: {
      range: 3, area: 3, condition: "wet", intensity: 2,
      ground: { shape: "area", effects: ["difficult"] },
      text: "deep water: and its Move is halved"
    }
  },
  {
    /*
     * The school's 5, and the only spell in the game that is as often worse for the caster as for
     * the enemy: the line does not care which side asked for it.
     */
    name: "Unmake the Ground", strength: 5, pool: "mind", source: "Elemental Magic",
    needs: [],
    description: "<p>A line across the battlefield that is no longer there. For the rest of the "
      + "fight, nobody crosses it &mdash; you included, which is the half of this that gets "
      + "casters killed.</p>",
    effect: {
      targets: "everyone",
      ground: { shape: "line", effects: ["impassable"] },
      text: "all fight"
    }
  },

  /*
   * --- Poison, six formulas, and a price the engine DOES keep ---
   *
   * Skill cards set aside, equal to the strength (specializations.md 2) -- which is a price on the
   * deck a character makes checks with, and the engine keeps that deck (data/actors.mjs). So it is
   * a gap rather than a sentence, and it is the same gap six times.
   *
   * Everything else in this school is a condition with a saving throw, which is the oldest
   * finished part of the engine. Four of the six need nothing else at all.
   */
  {
    name: "Slick", strength: 1, pool: "mind", source: "Poison",
    cost: { skillCards: 1 },
    needs: ["skill cards set aside to pay for a formula"],
    description: "<p>Oil of something. No save: a man whose feet have gone is not resisting "
      + "anything.</p>",
    effect: { range: 3, condition: "offBalance", duration: 1 }
  },
  {
    name: "The Quick Dose", strength: 3, pool: "mind", source: "Poison",
    cost: { skillCards: 3 },
    needs: ["skill cards set aside to pay for a formula"],
    description: "<p>Adjacent, because it has to go in them. Two rounds, two damage a round, and "
      + "armour is no part of the conversation.</p>",
    effect: {
      verb: "cast", condition: "poisoned", intensity: 2, duration: 2, resist: "might", dc: 7
    }
  },
  {
    /*
     * Poisoned 0 -- all nausea, no damage -- is why `intensity` has a floor of 0 rather than 1
     * (data/cards.mjs). This is the formula that floor was written for, and it was written before
     * this one existed to need it.
     */
    name: "The Long Dose", strength: 1, pool: "mind", source: "Poison",
    cost: { skillCards: 1 },
    needs: ["skill cards set aside to pay for a formula"],
    description: "<p>No damage at all. Three rounds of a man who cannot use his off hand, which "
      + "in a fight is worse than three damage and lasts longer.</p>",
    effect: {
      verb: "cast", range: 2, condition: "poisoned", intensity: 0, duration: 3,
      resist: "might", dc: 5
    }
  },
  {
    name: "The Grey Sickness", strength: 2, pool: "mind", source: "Poison",
    cost: { skillCards: 2 },
    needs: ["skill cards set aside to pay for a formula"],
    description: "<p>Not a poison. A disease, which is the difference between a bad afternoon and "
      + "something still with them next week.</p>",
    effect: {
      verb: "tainting", param: 1, resist: "might", dc: 7, text: "slow: a disease, not a poison"
    }
  },
  {
    name: "The Shared Cup", strength: 4, pool: "mind", source: "Poison",
    cost: { skillCards: 4 },
    needs: ["skill cards set aside to pay for a formula", "a condition applied to an area"],
    description: "<p>Everyone who drank. Three rounds of it, over three squares, and the save is "
      + "the only mercy in the formula.</p>",
    effect: {
      verb: "cast", area: 3, areaKind: "aimed",
      condition: "poisoned", intensity: 1, duration: 3, resist: "might", dc: 7
    }
  },
  {
    /*
     * The school's 5, and the only price in the game that is REFUNDED: kill the man and you set
     * nothing aside. A poisoner who finishes the job pays nothing, and one who does not pays five
     * skill cards -- which is the school's axis, Control, written as a bill.
     */
    name: "The Kingmaker's Draught", strength: 5, pool: "mind", source: "Poison",
    cost: { skillCards: 5 },
    needs: ["skill cards set aside to pay for a formula",
      "a price refunded when the target dies carrying the condition"],
    description: "<p>Three rounds of three, no save, and no cost at all if it finishes him. If it "
      + "does not, you have paid five cards for an angry survivor who knows your face.</p>",
    effect: {
      condition: "poisoned", intensity: 3, duration: 3,
      text: "no save. If it dies while poisoned, set aside no skill cards for this formula"
    }
  },

  /*
   * --- Glamour, seven formulas, and the school the engine was readiest for ---
   *
   * An elven debt is the price, and nobody computes a debt -- the GM holds it, the way a secret and
   * a pact are held -- so it is not in the gap column (way-cards 3.4). What is left is conditions
   * and saving throws, and three of the seven need nothing at all.
   *
   * **Blessed and Cursed exist and nothing cast them** (way-cards 1.7), which was true of Cursed
   * until this list: *A Word for You* blesses and nothing anywhere cursed. *The Evil Eye* is the
   * other half of a pair that has been half-built since conditions.md was written.
   */
  {
    name: "Wrong Face", strength: 2, pool: "mind", source: "Glamour",
    needs: [],
    description: "<p>Your face is briefly somebody they were not expecting. Two rounds of trying "
      + "to work out what they are looking at.</p>",
    effect: { verb: "cast", condition: "dazed", duration: 2, resist: "wits", dc: 7 }
  },
  {
    name: "The Evil Eye", strength: 2, pool: "mind", source: "Glamour",
    needs: [],
    description: "<p>A temporary Miss in their fate deck, until it is drawn. The condition "
      + "shuffles the card in by itself (core-rules 6), which is why the pair of these needed no "
      + "mechanism of their own.</p>",
    effect: { range: 3, condition: "cursed" }
  },
  {
    name: "Ink Spray", strength: 1, pool: "mind", source: "Glamour",
    needs: ["ending a condition over a whole area",
      "a condition nobody may gain for a round"],
    description: "<p>Two squares of ink in the air. Nobody in it is invisible, and nobody in it "
      + "is going to be.</p>",
    effect: {
      verb: "blast", area: 2,
      text: "end Invisible in the area, and nothing in it may become Invisible until your next turn"
    }
  },
  {
    /*
     * The ending is built -- `shake` has ended a named condition since the first potion -- and the
     * second half is not. Granting ONE ally an extra secondary is not the job *The Red Hour* wants
     * (every ally in an area, at a Health cost per head), so it is a second gap rather than the
     * same one worded twice: building this would finish this card and not that one.
     */
    name: "A Clear Head", strength: 1, pool: "mind", source: "Glamour",
    needs: ["an ally granted an extra secondary this turn"],
    description: "<p>You say the thing they needed to hear, and they come back to themselves in "
      + "time to do something about it.</p>",
    effect: {
      verb: "shake", param: 1, condition: "dazed", range: 3,
      text: "and they may play a secondary this turn even if they already have"
    }
  },
  {
    name: "The Crowded Room", strength: 4, pool: "mind", source: "Glamour",
    needs: ["an enemy that attacks its own side"],
    description: "<p>For one round nobody can tell who is who, and the fate deck decides who "
      + "swings at whom. It is as likely to help them as you.</p>",
    effect: {
      text: "until your next turn every enemy attacks a random figure in reach, chosen by a "
        + "fate draw"
    }
  },
  {
    name: "The Face of a Friend", strength: 3, pool: "mind", source: "Glamour",
    needs: ["an enemy that counts you as an ally"],
    description: "<p>It will not attack you. It will take a hit meant for you. It will do both "
      + "until the moment you attack it, and then it will remember everything.</p>",
    effect: {
      range: 3,
      targets: "oneEnemy",
      text: "one enemy treats you as an ally -- it will not attack you and will take a hit for "
        + "you -- until you attack it"
    }
  },
  {
    /*
     * The school's 5 and the only one of the eighty-five that has no combat behaviour at all. That
     * is Glamour's thesis: the fight you do not have is the one a glamourist wins.
     */
    name: "The Long Masquerade", strength: 5, pool: "mind", source: "Glamour",
    needs: [],
    description: "<p>Out of combat: you and your whole party are other people for a day. Only "
      + "magic sees through it, and most places have none.</p>",
    effect: {
      timing: "outOfCombat", text: "you and your whole party appear to be other people for a day"
    }
  },

  /*
   * --- Tattoo Magic, seven teachings, and not one of them is a formula ---
   *
   * **A tattoo is never prepared**, and that one fact decides what these are. *A thing usable
   * without being equipped or prepared is a feature* -- so all seven are features, and the school
   * is the one school in the game that teaches no spells.
   *
   * They kept `kind: "spell"` for a long time because a spell was the only slate with a **step**,
   * and a tattoo needs a step: the bonus it gives rides on the `graven` condition, which is what
   * ink in your skin IS. That was the tail wagging the dog. A feature has a step now, and what a
   * spell has that a feature does not is `prepared` -- nothing these seven will ever use.
   *
   * `strength` stays, as the school's ladder and the GM's price. It is no longer a slot cost,
   * because a feature has no budget to spend; what it costs you is the secret the GM writes down,
   * which is not a cost in the engine's sense at all. It is a hostage.
   */
  {
    name: "Graven Eye", kind: "feature", strength: 1, pool: "mind", source: "Tattoo Magic",
    needs: ["a trait that stops you being surprised",
      "a spell slot spent for good"],
    description: "<p>An eye on the back of your neck that is not decorative. You are never "
      + "surprised again, and you never sleep quite as well.</p>",
    effect: { text: "you are never surprised" }
  },
  {
    /*
     * The seeing half of Sift, and it is a tattoo rather than a card because core-rules 8 gives
     * the plain top-card peek to EVERYBODY -- a carving that granted what everyone already has
     * would be worth nothing. So this one grants more of it, permanently, and still cannot tutor:
     * knowing is not doing, and there is no reorder here to turn it into a choice.
     */
    name: "Graven Sight", kind: "feature", strength: 1, pool: "mind", source: "Tattoo Magic",
    needs: ["seeing further than the top card of your own draw pile",
      "a spell slot spent for good"],
    description: "<p>Two small eyes carved behind the ear, looking the way you came. You always "
      + "know the next two cards you will draw. You may not change their order, and the knowing "
      + "is worth exactly as much as what you do about it.</p>",
    effect: { verb: "sift", param: 2, text: "seeing only -- you may not reorder them" }
  },
  {
    name: "Graven Shield", kind: "feature", strength: 2, pool: "mind", source: "Tattoo Magic",
    needs: ["a spell slot spent for good"],
    description: "<p>A shield you cannot put down, drawn across your back by somebody who knew "
      + "what they were doing.</p>",
    /* No step at all: what it does is a grant, and a feature is permanent without saying so. */
    grants: { armor: 1 }
  },
  {
    name: "Graven Road", kind: "feature", strength: 1, pool: "mind", source: "Tattoo Magic",
    needs: ["a trait that ignores a halved Move",
      "a spell slot spent for good"],
    description: "<p>A road down the inside of both legs. Slowed, Burdened and Overloaded all "
      + "still land on you; none of them slows you down.</p>",
    effect: { text: "your Move is never halved" }
  },
  {
    /*
     * The one tattoo with a drawback rather than a price, and it is a drawback the engine would
     * have to tell a lie to carry: Burdened is DERIVED from what you are carrying (data/actors.mjs),
     * so a Burdened that an empty pack does not lift is a second mechanism wearing its name.
     */
    name: "Graven Armour", kind: "feature", strength: 4, pool: "mind", source: "Tattoo Magic",
    needs: ["Burdened that no amount of dropping weight lifts",
      "an encumbrance tier set by something other than weight",
      "a spell slot spent for good"],
    description: "<p>Plate, in ink, over everything. It weighs nothing and you are never again "
      + "anything but weighed down.</p>",
    grants: { armor: 3 },
    effect: {
      /* The price stays prose: counting as Burdened whatever you carry is the encumbrance tier
       * set by something other than weight, and nothing in the game can say that yet. */
      text: "you count as Burdened always, whatever you carry"
    }
  },
  {
    name: "Graven Heart", kind: "feature", strength: 3, pool: "mind", source: "Tattoo Magic",
    needs: ["a spell slot spent for good"],
    description: "<p>A second heart, drawn over the first. The GM writes down a secret worth six "
      + "Health, and you will find out which one when it matters.</p>",
    grants: { health: 6 }
  },
  {
    /*
     * The school's 5, and the one teaching in the game that takes the school away: a mage covered
     * in the whole skin is a fighter with good armour and no book.
     */
    name: "The Whole Skin", kind: "feature", strength: 5, pool: "mind", source: "Tattoo Magic",
    needs: ["immunity to a named condition, which nothing grants",
      "a ban on preparing any further spell",
      "a condition that can never land on you",
      "a spell slot spent for good"],
    description: "<p>There is no skin left to write on. It is the last thing you ever learn, and "
      + "afterwards you are something else wearing a mage's name.</p>",
    grants: { armor: 2, health: 4 },
    effect: {
      condition: "graven",
      bonus: { verb: "strike", value: 2 },
      /* Two things no field holds: a condition that never lands on you, and a spell budget closed
       * for good. Both are the price of the school's 5 and both are still prose. */
      text: "Burning never lands. You may never prepare another spell"
    }
  },

  /*
   * --- Asceticism, six formulas, and the school that reads your own hand ---
   *
   * Two different emptinesses, and keeping them apart is the whole of this school's wiring:
   *
   * - an empty **card hand**, which *Nothing Left to Take* and *The Empty Deck* read; and
   * - empty **hands**, meaning no item held, which *Empty Hand* and *Nothing to Carry* read.
   *
   * The engine knows about a free hand (`needsFreeHand`, `requires.bothHands`) because casting and
   * two-handed weapons needed it, and it has never been asked whether BOTH hands hold nothing.
   * Those are two gaps with two names on purpose; one word covering both would be the kind of merge
   * that finishes neither card.
   *
   * The price is parts of your body, and unlike a secret or a debt this one the engine does keep:
   * hands are what hold items.
   */
  {
    name: "Empty Hand", strength: 1, pool: "mind", source: "Asceticism",
    needs: ["empty hands as a state the engine can read",
      "a Strike made with no item, at your own Might"],
    description: "<p>No weapon, and no need of one. It is not a better Strike than a sword; it is "
      + "a Strike you cannot be parted from.</p>",
    effect: {
      whileState: "handsEmpty", text: "you may Strike with no item, at your own Might"
    }
  },
  {
    name: "Nothing to Carry", strength: 1, pool: "mind", source: "Asceticism",
    needs: ["empty hands as a state the engine can read"],
    description: "<p>Nothing in either hand, and nothing anybody can take out of them. The bonus "
      + "to Casts is incidental; the point is that Disarm stops being a word.</p>",
    effect: {
      whileState: "handsEmpty",
      text: "+2 to all Casts, and you cannot be Disarmed"
    }
  },
  {
    /*
     * The binning half of Sift, and this school is where it belongs: a card off the top of the
     * draw pile is the draw pile getting shorter, which is the state *The Empty Deck* reads. The
     * once-a-fight limit is core-rules 8's price for choosing rather than counting -- without it,
     * a repeatable Sift is a dig through your own deck and the deck stops having a bottom.
     */
    name: "One Less Thing", strength: 1, pool: "mind", source: "Asceticism",
    needs: ["Sift -- looking at the top of your own draw pile and discarding what you saw",
      "a once-a-fight limit on a prepared spell"],
    description: "<p>You look at what is coming and decide you do not want it. The card is not "
      + "lost -- it is in the discard with everything else, and a breath brings it back -- but the "
      + "draw pile is one shorter, which is the direction this school always walks.</p>",
    effect: { verb: "sift", param: 1, text: "once a fight" }
  },
  {
    name: "The Last Card", strength: 2, pool: "mind", source: "Asceticism",
    needs: ["playing one card for both halves"],
    description: "<p>One card left, and it does both jobs. A hand of one is the worst hand in the "
      + "game and this is the formula that makes it the best.</p>",
    effect: {
      whileState: "oneCard",
      text: "you may play that card for both halves"
    }
  },
  {
    /*
     * The same gap *Nothing Left to Take* named, and deliberately the same STRING: a rule that can
     * read an empty hand finishes both, which is the test for whether two gaps are one.
     */
    name: "The Empty Deck", strength: 4, pool: "mind", source: "Asceticism",
    needs: ["a rule that reads your own hand being empty"],
    description: "<p>Nothing in your hand, nothing left to draw, and nothing anybody can do to "
      + "you. It is the shortest window in the game and it is absolute.</p>",
    effect: {
      whileState: "handAndDeckEmpty",
      text: "you cannot be harmed at all"
    }
  },
  {
    name: "The Hand Given", kind: "feature", strength: 3, pool: "mind", source: "Asceticism",
    needs: ["a hand given up, which the engine counts for holding things",
      "a bare Strike that counts as a weapon"],
    description: "<p>It costs a hand. What is left strikes like a Heavy weapon, for ever, and you "
      + "will never hold a shield again.</p>",
    /* No timing: a feature is permanent by having no gate to pass, and `permanent` is not a
     * timing the step schema offers any more. */
    effect: { text: "and it costs a hand: your bare Strike is a Heavy weapon at Strike 4" }
  },
  {
    /*
     * The school's 5, and the only content in the game that argues with the deck floor: the
     * minimum exists so a character cannot prune themselves into a deck of nothing (core-rules 8),
     * and this spell sets a deck of four on purpose. The floor is a rule and this is an exception
     * to it, which is exactly the kind of thing that must be in the schema rather than in prose.
     */
    name: "Nothing At All", kind: "feature", strength: 5, pool: "mind", source: "Asceticism",
    needs: ["a hand given up, which the engine counts for holding things",
      "a deck size below the floor the rules set"],
    description: "<p>Four cards, all of them in your hand, every turn. You have given away a hand "
      + "and most of a deck, and what is left is a man who always has exactly the right card.</p>",
    effect: {
      text: "your action deck becomes 4 cards, you hold all four, and may play any two "
        + "halves. Costs a hand"
    }
  },

  /*
   * --- Shadow Magic, six more, and a price that is already a field ---
   *
   * `wilds` was built when *Step Through* needed somewhere to put the school's price, and it was
   * built as a NUMBER rather than a flag on purpose: "a strength-3 formula reaching further should
   * cost more of the same thing" (data/items.mjs). *Become the Shadow* is what that was for -- five
   * Wild cards, for good, which is a third of a fate deck a shadow mage can no longer predict.
   *
   * What the school does NOT have is a shadowed square. Every one of these reads one, and the map
   * does not know which squares are dark; that is one gap shared by six formulas.
   *
   * **And *The Long Step* is the rule-3a case in a spell.** It does nothing unless you begin and
   * end in shadow, which looks exactly like the gating an opening is forbidden to do (way-cards
   * 1.6) -- except that where you are standing is yours to arrange and a drawn card is not. A
   * caster who prepared this chose to fight in the dark.
   */
  {
    name: "Longer Shadow", strength: 1, pool: "mind", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep"],
    description: "<p>The dark you are standing in reaches one square further, all the way "
      + "round, which is enough to make the next formula work.</p>",
    effect: { duration: 1, ground: { shape: "adjacent", effects: ["shadowed"] } }
  },
  {
    name: "The Long Step", strength: 1, pool: "mind", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep",
      "shadow as a state a square is in"],
    description: "<p>Four squares, through whatever is in between, so long as both ends are "
      + "dark. Movement is a sentence the table applies (core-rules 11), so the only thing the "
      + "engine would have to know is which squares are shadowed.</p>",
    effect: { verb: "move", mod: 4, text: "through anything, if you begin and end in shadow" }
  },
  {
    name: "Cast No Shadow", strength: 2, pool: "mind", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep",
      "a limit on who may target you at all"],
    description: "<p>For one round you are only there if they are standing next to you. Archers "
      + "and casters are simply out of the conversation.</p>",
    effect: { text: "until your next turn nothing further than 1 square away can target you" }
  },
  {
    name: "The Shadow Road", strength: 4, pool: "mind", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep",
      "shadow as a state a square is in"],
    description: "<p>You take them with you. The whole front rank arrives behind the enemy line "
      + "at once, which is the only thing in this school that wins a fight outright.</p>",
    effect: {
      area: 1,
      targets: "selfAndAllies",
      text: "you and every ally within 1 teleport to any shadowed square on the map"
    }
  },
  {
    name: "The Borrowed Dark", strength: 3, pool: "mind", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep"],
    description: "<p>Every square on the map, dark at once &mdash; for your allies as much as for "
      + "you, and for anyone else who knows what to do with it.</p>",
    effect: { duration: 1, ground: { shape: "wholeMap", effects: ["shadowed"] } }
  },
  {
    /*
     * The school's 5, and the only formula whose price is the reason not to cast it: five Wilds is
     * a third of a fate deck gone unpredictable for ever. A shadow mage who casts this twice is
     * playing a different game afterwards.
     */
    name: "Become the Shadow", strength: 5, pool: "mind", source: "Shadow Magic",
    wilds: 5,
    needs: ["shadow as a state a square is in", "a limit on who may target you at all"],
    description: "<p>Not in a shadow: in every shadow, at once, until the fight ends. Nothing "
      + "can reach you and you can reach anything standing in the dark.</p>",
    effect: {
      text: "until the fight ends you are in every shadow at once: Strike from any shadowed "
        + "square, and nothing can target you"
    }
  },

  /*
   * --- Spiritualism's last rung ---
   *
   * The same gap Call the Unquiet named, and the same string: a god standing on the board and a
   * corpse standing on the board are one piece of work. What is different is who decides what it
   * does, and that is the GM both times.
   */
  {
    name: "The Great Bargain", strength: 5, pool: "mind", source: "Spiritualism",
    needs: [],
    /*
     * **Three rounds, not the fight.** It said *for the rest of the fight* while the gods had no
     * numbers, which made the duration somebody else's problem. They have numbers now and they
     * outclass everything else in the file -- Health 55 to 90 against a Dragon's 50 -- so an
     * open-ended one is not a strength-5 spell, it is the end of the encounter. What a god will
     * actually give is a few rounds, and leaving is part of the bargain.
     */
    description: "<p>It is actually here, for three rounds. The GM plays it as an ally and then "
      + "it goes, and afterwards it takes something the GM chooses &mdash; which is the only "
      + "honest way to price a favour that large.</p>",
    effect: {
      verb: "conjure",
      conjure: { creature: "" },
      duration: 3,
      targets: "self",
      text: "a minor god becomes present and fights as an ally for three rounds"
    }
  },

  /*
   * --- Household Magic, six formulas, and not one of them is cast in a fight ---
   *
   * All six are rituals, so all six carry the gap *Hearth and Home* named: `strength` is required
   * and runs 1 to 5 (data/items.mjs), and a ritual costs no slots at all. Six formulas written as
   * numbers that are standing in for nothing.
   *
   * This is the school a party notices most and the engine notices least, which is the clearest
   * case in the twelve of the difference between a rule and a sentence.
   */
  {
    name: "The Clean Pot", strength: 1, pool: "mind", source: "Household Magic",
    needs: [],
    description: "<p>Food never spoils and water is always safe. A day's rations for the party, "
      + "every day, for ever &mdash; which quietly deletes a whole column of the equipment "
      + "list.</p>",
    effect: { timing: "ritual", text: "a day's rations for the party, every day" }
  },
  {
    /*
     * Corrode eats armour permanently (core-rules 8) and nothing in the game ever put it back.
     * This is the inverse, and it is the one Household formula whose effect the engine would have
     * to compute rather than narrate.
     */
    name: "The Mended Seam", strength: 1, pool: "mind", source: "Household Magic",
    needs: ["repairing an item, which Corrode has no inverse for"],
    description: "<p>One item, overnight, including corroded armour &mdash; which until now was "
      + "the only damage in the game nothing undid.</p>",
    /* **And it plays the verb now rather than describing it.** `effect` is a `stepField`, so the
     * ritual that was written for *repairing an item, which Corrode has no inverse for* can say
     * so in the one vocabulary the engine reads. `param: 1` because the ritual is a promise and
     * not an attempt: a night, an item, a point back, no check. The Lore check is the other route
     * -- for a character with a kit and no spell -- and it is the one that can fail. */
    effect: { timing: "ritual", verb: "repair", param: 1,
      text: "repair one item overnight, including corroded armour" }
  },
  {
    name: "The Unlatched Door", strength: 2, pool: "mind", source: "Household Magic",
    needs: [],
    description: "<p>Any door or lock that was ever opened by somebody who lived there opens for "
      + "you. Most doors were, which is the joke and also the spell.</p>",
    effect: { timing: "ritual", text: "a door ever opened by one who lived there opens for you" }
  },
  {
    name: "The House That Was", strength: 4, pool: "mind", source: "Household Magic",
    needs: ["a rest that counts as a night in a town"],
    description: "<p>Overnight a ruin is a house again: warm, defensible, and worth sleeping in. "
      + "The party rests as though they had reached somewhere.</p>",
    effect: { timing: "ritual", text: "overnight a ruin becomes a house, and the party rests as in a town" }
  },
  {
    name: "The Long Table", strength: 3, pool: "mind", source: "Household Magic",
    needs: ["every Wound shed and every rest token returned"],
    description: "<p>One meal, taken together, and nobody is carrying anything from before it. "
      + "Once a day, and the elf-kin keep the tally &mdash; which is this school's price doing "
      + "exactly what a price should.</p>",
    effect: {
      timing: "ritual", oncePer: "day",
      text: "the party sheds every Wound and all rest tokens return"
    }
  },
  {
    name: "The Door Home", strength: 5, pool: "mind", source: "Household Magic",
    needs: [],
    description: "<p>A door you have opened before becomes a door to any other door you have "
      + "opened before. It is the school's thesis: a householder is never far from anywhere "
      + "they have been.</p>",
    effect: {
      timing: "ritual", oncePer: "day",
      text: "a door you have opened leads to any other you have opened"
    }
  },

  /*
   * --- Ward Magic, seven formulas, and the only school whose axis is reactions ---
   *
   * Two reaction keys live on a spell rather than a card (config.mjs): `unmake`, which answers a
   * **cast**, and `mend`, which answers an **ally being hit**. Both were built for this school and
   * both are event sites rather than effects -- which is why three of these name a `reaction` and
   * then name a gap for what the reaction DOES.
   *
   * Spent is the price, and on a thing that was never in your hand Spent means the slate drains
   * until a rest. That machinery has been here since item abilities.
   */
  {
    name: "Turn Aside", strength: 2, pool: "mind", source: "Ward Magic",
    reaction: "mend",
    needs: ["an ally's Block counted double for one attack"],
    description: "<p>You do not stop the blow; you make their shield worth twice what it was for "
      + "exactly as long as it takes.</p>",
    effect: { range: 3, timing: "reaction", targets: "oneAlly",
    text: "one ally's Block counts double against this attack" }
  },
  {
    name: "The Shut Mouth", strength: 2, pool: "mind", source: "Ward Magic",
    needs: [],
    description: "<p>A caster who cannot speak is a man in a robe. Lore resists it, because the "
      + "ones who understand the word are the ones who can get out from under it.</p>",
    effect: {
      verb: "cast", range: 3, condition: "silenced", duration: 1, resist: "lore", dc: 7
    }
  },
  {
    /*
     * Shake Off 3 ends anything the game can print, and the verb has existed since the first
     * potion. What is new is the TIMING: this is the same mechanism on somebody else's turn, which
     * `mend` is the event site for.
     */
    name: "Shake It Off", strength: 2, pool: "mind", source: "Ward Magic",
    reaction: "mend",
    needs: [],
    description: "<p>Whatever is on them, off, on the turn it happened rather than on yours. "
      + "Three is enough for anything the game can print.</p>",
    effect: { verb: "shake", param: 3, range: 3 }
  },
  {
    name: "The Unbound Tongue", strength: 1, pool: "mind", source: "Ward Magic",
    needs: [],
    description: "<p>The cheapest formula in the school and the one that beats the school: a "
      + "warder with this prepared cannot be silenced out of the fight.</p>",
    effect: { verb: "shake", param: 1, condition: "silenced", range: 3 }
  },
  {
    name: "The Standing Ward", strength: 4, pool: "mind", source: "Ward Magic",
    needs: ["no Cast resolving at all, for a round"],
    description: "<p>Spent: for one round there is no magic on the field. Yours included, which "
      + "is what makes this a ward and not an attack.</p>",
    effect: { text: "Spent: until your next turn no Cast resolves at all, anywhere -- yours too" }
  },
  {
    name: "The Mirror", strength: 3, pool: "mind", source: "Ward Magic",
    reaction: "unmake",
    needs: ["a Cast that resolves against its own caster"],
    description: "<p>Not stopped. Returned, in full, to the man who sent it &mdash; which is "
      + "worse for him than for you and is the whole reason to prepare this instead of Unmake.</p>",
    effect: { timing: "reaction", text: "Spent: a Cast aimed at you resolves against its own caster" }
  },
  {
    /*
     * The school's 5, and the only content in the game that reaches into another character's
     * SHEET: the slot stays and the spell leaves it. That is a day-long edit to somebody else's
     * prepared list, which nothing else in the engine does.
     */
    name: "The Broken Word", strength: 5, pool: "mind", source: "Ward Magic",
    needs: ["a spell unlearned by its caster for a day"],
    description: "<p>They still have the slot. They no longer have the words, and will not until "
      + "tomorrow &mdash; which to a caster is worse than a wound.</p>",
    effect: {
      text: "Spent: one spell or miracle is unlearned by its caster for the rest of the day"
    }
  },

  /*
   * --- Divination, five more, and the school that pays in somebody else's turn ---
   *
   * `foresee` is a declared verb and reading a fate deck is not built (the same gap *The Reading*
   * named), so four of the six carry one string between them. The prophecy half is the GM's and is
   * not a gap: a prophecy the player does not get to read is not something the engine could keep.
   */
  {
    name: "Where It Will Land", strength: 1, pool: "mind", source: "Divination",
    needs: [],
    description: "<p>Somebody else's deck, one card down. The cheapest certainty in the game, and "
      + "never your own: the seer is blind to themselves.</p>",
    effect: { verb: "foresee", param: 1, readDeck: "other" }
  },
  {
    name: "The Mark of Things to Come", strength: 2, pool: "mind", source: "Divination",
    needs: [],
    description: "<p>Marked at any range, and you know what its luck is about to do. The "
      + "condition lands by itself; the reading is the half that does not.</p>",
    effect: {
      range: 99, condition: "marked", duration: 1, readDeck: "target",
      /* The Read rides on the Mark rather than being the action, so the amount stays prose:
       * `foresee` is not this step's verb and giving it one would change what the card does. */
      text: "and Read 1"
    }
  },
  {
    name: "The Long Look", strength: 3, pool: "mind", source: "Divination",
    needs: [],
    description: "<p>One question about the next scene, answered truthfully &mdash; and the GM "
      + "writes a prophecy you do not get to read. The price is the better half of the "
      + "formula.</p>",
    effect: {
      timing: "outOfCombat", text: "one true answer about the next scene, and the GM writes a prophecy"
    }
  },
  {
    name: "The Open Book", strength: 4, pool: "mind", source: "Divination",
    needs: ["advantage granted to every ally for a round"],
    description: "<p>For one round the whole party is lucky and you can see why. Two cards down "
      + "each of their decks, and a better draw on top of it.</p>",
    effect: {
      duration: 1, readDeck: "all",
      targets: "everyAlly",
      text: "every ally draws fate with advantage, and Read 2"
    }
  },
  {
    /*
     * The school's 5, and it is read before the fight starts rather than during it -- which is
     * what Preparation means in a school whose axis is Support. Three prophecies is the largest
     * price in the twelve that the engine does not touch at all.
     */
    name: "The Whole Thread", strength: 5, pool: "mind", source: "Divination",
    needs: ["an enemy's intent cards, shown in order"],
    description: "<p>The whole fight, in order, before it starts. The GM writes three prophecies "
      + "for it, and a diviner who uses this twice in a week is in a story they no longer "
      + "steer.</p>",
    effect: {
      timing: "beforeFight", text: "the GM shows the enemy's intent cards for the whole fight, in order"
    }
  },
];

/* -------------------------------------------- */

/**
 * Way of Mind's twelve Signatures (way-cards 2.3). Every one is a **spell**, which is the first
 * time a node has granted a document of that type -- Shade handed out cards, a feature and an item.
 *
 * **Eleven entries for twelve schools**, because *Step Through* has been content since Shadow
 * Magic's price needed somewhere to live (`SHADOW_FORMULAS`). The Shadow node points at it rather
 * than at a second copy, exactly as Strength's reach cards were not written twice.
 *
 * The audit is thinner here than in the other two Ways and the reason is structural: a school's
 * content is a spell, and **a spell does fewer things the engine already has verbs for**. Where a
 * card modifies a Strike you already resolve, a formula puts a figure on the map, places terrain,
 * reads a deck or spends its slots for good. Those are mechanisms, not modifiers.
 *
 * What is NOT in this column is a school's **price**, unless the engine would have to charge it. A
 * secret the GM writes down, an elven debt, a pact, a finger: nobody computes those, so they are
 * not gaps (the definition is in way-cards 2). Health, a bound Taint, skill cards set aside and a
 * permanent Wild **are** tracked by the engine, so those prices are gaps and are named as such.
 */
export const MIND_SIGNATURES = [
  {
    name: "Blood Price", kind: "spell", node: "mind.blood", strength: 2, source: "Blood Magic",
    /* Both halves are built now: the Health always was, and the armour is `ignoresArmour`. */
    needs: [],
    cost: { health: 2 },
    description: "<p>Four damage at three squares, and nothing between you and it matters. The "
      + "two Health are not a drawback; they are the school.</p>",
    effect: { verb: "cast", range: 3, mod: 4, ignoresArmour: true }
  },
  {
    name: "Call the Unquiet", kind: "spell", node: "mind.necromancy", strength: 3,
    source: "Necromancy",
    needs: [],
    description: "<p>It does not know it died. It will stop when the fight does.</p>",
    effect: {
      verb: "conjure", range: 2,
      /* A body on the field is what it needs, and the table can see whether there is one. */
      conjure: { creature: "" },
      text: "a corpse rises and fights for you"
    }
  },
  {
    /*
     * "A line of **your element**" is the oldest piece of prose in this document that is not a
     * rule, and it is NOT in the gap column -- because the mechanism exists. `CARDRPG.elements`
     * and `exclusive: "element"` were built for exactly this; what is missing is a node that
     * hands one over, which is content and is in the open list rather than here.
     */
    name: "Wall of the Sphere", kind: "spell", node: "mind.elemental", strength: 2,
    source: "Elemental Magic",
    needs: [],
    description: "<p>Three squares of whichever sphere is yours. Stand behind it and the ground in "
      + "front of you is no longer anybody's.</p>",
    effect: {
      range: 3, area: 3, duration: 1,
      ground: { shape: "line", effects: ["cover", "difficult"] },
      text: "of your element"
    }
  },
  {
    /*
     * The one Signature in this Way the engine does everything for, and it is worth noticing why:
     * Poison's whole content is conditions with saving throws, and conditions with saving throws
     * are the part of the engine that has been finished longest.
     */
    name: "Wither", kind: "spell", node: "mind.poison", strength: 2, source: "Poison",
    needs: [],
    /* The school's thesis Signature, and it pays the school's price like the other six -- it never
     * named the gap, which is why the sweep found it only when the check counted the school. */
    cost: { skillCards: 2 },
    description: "<p>Dazed while it lasts, and one damage a turn that armour does not stop.</p>",
    effect: {
      verb: "cast", condition: "poisoned", intensity: 1, duration: 2, resist: "might", dc: 5
    }
  },
  {
    name: "Not Here", kind: "spell", node: "mind.glamour", strength: 2, source: "Glamour",
    needs: ["a condition that ends when you act"],
    description: "<p>You are standing exactly where you are standing. Nobody can be told so.</p>",
    effect: {
      condition: "invisible", duration: 1, text: "until you attack or are attacked"
    }
  },
  {
    /*
     * A tattoo is the one spell that is never prepared: it spends its slots for good and is always
     * on. The slate can hold the slots (`strength`) and the drain machinery, but it has nowhere to
     * put a BONUS -- SpellSlateData has no `bonus` field, because until now a spell only ever did
     * something when cast. That is this school's gap, and it is the whole school's.
     */
    name: "Graven Strength", kind: "feature", node: "mind.tattoo", strength: 1,
    source: "Tattoo Magic",
    needs: ["a spell slot spent for good"],
    description: "<p>It is on your arm. It does not need remembering, and it never comes off.</p>",
    effect: {
      condition: "graven",
      /* The bonus rides on the condition, so the tattoo SHOWS on the token instead of being a
       * standing number nobody can see -- and `activeConditions` derives it from the feature, so
       * nothing has to apply it and nothing can leave it behind. */
      bonus: { verb: "strike", value: 2, requiresTag: "heavy" }
    }
  },
  {
    name: "Nothing Left to Take", kind: "spell", node: "mind.asceticism", strength: 1,
    source: "Asceticism",
    needs: ["a rule that reads your own hand being empty"],
    description: "<p>There is nothing in your hand and nothing left to lose, and the second "
      + "follows from the first.</p>",
    effect: {
      whileState: "handEmpty", text: "you cannot be reduced below 1 Health"
    }
  },
  {
    name: "The Bargain", kind: "spell", node: "mind.spiritualism", strength: 3,
    source: "Spiritualism",
    needs: [],
    description: "<p>A minor god acts, once. <strong>The GM decides how</strong>, and that is not "
      + "a hole in the spell &mdash; it is the spell.</p>",
    effect: {
      verb: "conjure",
      /* No name: a minor god is a person with its own opinions, and a spell that told one whom
       * to fight would have misunderstood the arrangement. */
      conjure: { creature: "" },
      text: "it acts once; the GM decides how"
    }
  },
  {
    /*
     * A ritual has NO slot cost, and `strength` is required and runs 1-5 (data/items.mjs) -- so
     * the one out-of-combat Signature is the one piece of content the slate cannot store honestly.
     * It is written as a 1 and the gap says what the 1 is standing in for.
     */
    name: "Hearth and Home", kind: "spell", node: "mind.household", strength: 1,
    source: "Household Magic",
    needs: [],
    description: "<p>Out of combat: a camp nobody unfriendly can find, for one night. A ritual, so "
      + "anyone literate could do it &mdash; but somebody has to know the words.</p>",
    effect: { timing: "ritual", text: "a camp nobody unfriendly can find, for one night" }
  },
  {
    /*
     * Two triggers exist, `hit` and `arrival` (config.mjs). A ward answers a CAST, which is
     * neither -- and it is the fourth document to ask for a trigger the engine does not have,
     * after Quick Hands, Heckle and On My Call. The difference is that this one is a whole
     * school's axis rather than one card's flavour.
     */
    name: "Unmake", kind: "spell", node: "mind.ward", strength: 2, source: "Ward Magic",
    needs: [],
    /*
     * The first reaction in the game that is not a card in your hand, and way-cards 3.4 argued for
     * exactly that from the simulation: a dispel on a drawn card is in hand 31% of turns and is
     * therefore nearly worthless, while a PREPARED one is there every fight and costs no half.
     * Spent, on a thing that was never in your hand, is the slate draining until a rest.
     */
    reaction: "unmake",
    description: "<p>You have felt this one before. That is the only reason you can stop it: a "
      + "warder's book is a record of what the party has survived &mdash; which is a condition on "
      + "LEARNING it, held by the GM, not something the engine tests.</p>",
    effect: { text: "a Cast you have survived before does not resolve" }
  },
  {
    name: "The Reading", kind: "spell", node: "mind.divination", strength: 2, source: "Divination",
    needs: [],
    description: "<p>Three cards down somebody else's luck. Never your own &mdash; a diviner who "
      + "could stack their own deck would be a damage school wearing a robe.</p>",
    effect: { verb: "foresee", param: 3, readDeck: "other" }
  }
];

/* -------------------------------------------- */

/**
 * Way of Mind's Tactics (way-cards 2.5), derived from the deepest title like the other two Ways.
 *
 * Every one is about **where a caster stands**, which the document states as the Way's thesis: a
 * caster's hard problem is not what to cast but ranged-in-melee, line of sight and their own Blast.
 * None of the twelve adds a number, which is the rule that keeps forty-eight of these from being
 * power creep (way-cards 2.5, rule 2).
 */
export const MIND_TACTICS = {
  "Your Own Blood Is Nearest":
    "You may always Cast on yourself whatever the spell's range, and never take disadvantage "
    + "for it.",
  "The Dead Are Furniture":
    "Corpses are cover for you and difficult ground for your enemies.",
  "The Sphere Holds":
    "Your own Blast spares you alone, whatever the card says.",
  "The Patient Hand":
    "An enemy you have put a condition on this fight has disadvantage against you.",
  "Never Quite There":
    "Ranged attacks against you from more than 3 squares always have disadvantage.",
  "Nothing to Prepare":
    "You may Cast with both hands full, and Silenced does not stop you -- your spells are on your "
    + "skin, not in your mouth.",
  "The Still Point":
    "If you did not Move this turn, you cannot be moved and attacks against you have disadvantage.",
  "At Home in the Dark":
    "While you stand in a shadowed square, enemies more than 2 squares away cannot target you "
    + "at all.",
  "Something Is Always Listening":
    "You know whether any square within 6 is shadowed, high ground or difficult ground before "
    + "anyone steps on it.",
  "The House Helps":
    "Indoors you ignore difficult ground, and you know where every door is before you see it.",
  "The Standing Guard":
    "One extra reaction each round, usable only to answer a Cast.",
  "Already Seen":
    "You are never surprised, and at the start of any round you may swap your place in the "
    + "initiative order with a willing ally's."
};