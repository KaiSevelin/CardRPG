# Card RPG – Core Combat Rules (Draft 0.1)

> Status: first draft. Items marked **[OPEN]** still need a decision.
> Skill deck (out-of-combat) is planned but not covered yet.

---

## 1. Components per character

| Component | What it is |
|---|---|
| **Action deck** | ~15 personal action cards. Defines how the character fights. |
| **Fate deck** | 20 modifier cards. Drawn to resolve attacks and heals. |
| **Item cards** | Everything the character owns. Only **equipped** items can be used. |
| **Feature cards** | Permanent traits (Strong, Good Aim, ...). |
| **Condition tokens** | Temporary effects with a duration counter. |
| **Health** | Hit points. At 0 you are down. |

NPCs use simpler decks (see section 9).

---

## 2. Anatomy of an action card

```
┌───────────────────────────┐
│ HEAVY SWING               │
│ ▲ Primary:   Strike +1    │
│ ▼ Secondary: Move 1       │
│ ⚡ Reaction:  Parry        │
└───────────────────────────┘
```

- **Primary**: the strong half. Played as your main action.
- **Secondary**: the weak half. Played as your second action.
- **Reaction**: optional. Played on someone else's turn when triggered.

Any card without a printed reaction can still be discarded as a reaction for **Brace: reduce incoming damage by 1**.

---

## 3. The round

1. **Refill** – every character draws back up to hand size (default **5**).
2. **Group turns** – one side takes its group turn, then the other.
   - On the players' group turn, they act one at a time in any order they agree on.
   - NPCs act one at a time in the order the GM chooses.

### Who starts

- If the situation decides it (ambush, surprise, one side charging the other), **that side starts**. This is the GM's call.
- Otherwise, use a **fate draw-off**, once at the start of combat:
  1. The players pick one character to draw from their own fate deck. The GM draws from the NPC fate deck.
  2. The higher card's side starts (Miss is lowest, Critical highest). **Ties go to the players.**
  3. A side draws with **advantage** if any of its characters has a feature or tactic that grants initiative advantage (e.g. *Alert*, *Ambusher*). Disadvantage works the same way. As usual, both cancel out.
  4. Normal fate rules apply: a Miss or Critical shuffles that fate deck.
- The order then stays the same for the whole combat.

### Your turn

- Play **one card for its primary** and **a different card for its secondary**.
- You may play them in either order.
- Both cards go to your **discard pile**.
- The rest of your hand stays for reactions.
- **Two attacks in one turn are allowed** if they come from two different cards, e.g. a Strike primary plus a card with Strike on its secondary. You can never use both halves of the same card.

### Reactions

- When a trigger happens (you are attacked, an enemy moves next to you, ...), you may play a card from your hand for its reaction.
- The reaction card is **discarded**.
- Reacting is never free: every card you react with is one more card drawn from your deck at refill, so it brings exhaustion closer.

---

## 4. Verbs and items

Action cards say **what** you do (the verb). Equipped items say **how well** (the outcome).

### Core verbs

| Verb | Needs an item? | Notes |
|---|---|---|
| **Strike** | Yes – uses the item's *Strike* line | Melee or ranged depends on the item |
| **Cast** | Yes – uses the item's *Cast* line | Wands, staves, holy symbols |
| **Defend** | Yes – uses the item's *Defend* line | Shields, weapons that parry |
| **Use** | Yes – uses the item's *Use* line | Potions, scrolls, tools |
| **Move X** | No | Move up to X squares |
| **Ready** | – | Equip or swap one item (see below) |

If an equipped item has no line for a verb, you can't use that verb with that item.

### Equipped items and Ready

Only equipped items can be used. Slots:

| Slot | Count | Example |
|---|---|---|
| Hands | 2 | Sword + shield, or a two-handed staff (takes both) |
| Body | 1 | Armor |
| Belt | 2 | Potions, scrolls |

**Ready** is a special action. You can only Ready by playing a card half that shows the **Ready icon**. The icon can be on either the primary or the secondary half.

Ready lets you:
- equip one item from your pack into an empty slot, **or**
- swap one equipped item with one from your pack.

Characters start combat with whatever they had equipped beforehand.
When you build a deck, include enough Ready cards for the character's style. A weapon-swapper needs more of them than a sword-and-board fighter.

---

## 5. Resolving an action

Always in this order:

1. **Base value** – the item's line for the verb (e.g. Longsword Strike: 3 damage).
2. **Card modifier** – any bonus on the action card (e.g. *Strike +1*).
3. **Features** – permanent modifiers (e.g. Strong: +1 on Strike with *Heavy* items).
4. **Conditions** – temporary modifiers on you or the target.
5. **Fate** – draw one card from your fate deck and apply it.
6. **Target's defenses** – subtract armor and blocks. The result can't go below 0.

Fate is drawn for **damage and healing**. Movement, Ready and Defend never draw fate.

---

## 6. Fate deck

Each character has their own 20-card fate deck:

| Card | Count | Effect |
|---|---|---|
| Miss | 1 | Action has no effect. Shuffle the fate deck after the action. |
| −2 | 1 | |
| −1 | 4 | |
| +0 | 8 | |
| +1 | 4 | |
| +2 | 1 | |
| Critical | 1 | Double the value. Shuffle the fate deck after the action. |

- **Blessed**: shuffle a temporary *Critical* into your fate deck. It is removed when drawn.
- **Cursed**: shuffle a temporary *Miss* into your fate deck. It is removed when drawn.
- Later idea: some features or level-ups replace weak fate cards with better ones.

### Advantage and disadvantage

- **Advantage:** draw **2** fate cards and use the **better** one.
- **Disadvantage:** draw **2** fate cards and use the **worse** one.
- Better/worse order: Miss < −2 < −1 < +0 < +1 < +2 < Critical.
- Both cards are discarded. If **either** card was a Miss or Critical, shuffle the fate deck after the action. Bless/Curse cards drawn this way are removed even if not used.
- **No stacking:** two sources of advantage still give one advantage.
- **Cancelling:** if you have both advantage and disadvantage, they cancel. Draw one card as normal.
- Only actions that draw fate (damage and healing) are affected.

Common sources:

| Advantage | Disadvantage |
|---|---|
| Melee Strike against a Prone target | Target has cover (section 11) |
| Attacking while Invisible | Ranged or Area attack while adjacent to an enemy (section 11) |
| Card or feature says so | Card, feature or condition says so |

The GM uses one shared fate deck for all NPCs.

---

## 7. Conditions

Conditions are tokens with a number (duration). Every condition remembers **who created it**.

- The duration ticks down by 1 at the **start of the creator's turn**. At 0 the condition is removed.
- So *Dazed (1)* from a goblin lasts until the start of that goblin's next turn. The victim always suffers it for exactly one of their own turns, no matter which side acts first.
- Conditions you put on yourself (e.g. Invisible from a Smoke Bomb) tick at the start of your own turn.
- Conditions with no creator (fire, poison gas, a trap) count the affected character as the creator.
- If the creator is removed from combat, its conditions tick at the start of its side's group turn instead.

| Condition | Effect |
|---|---|
| **Dazed** | You can't play a secondary. |
| **Slowed** | All Move values are halved (round down). |
| **Stunned** | You can't play reactions. |
| **Invisible** | Enemies can't target you. Ends early if you Strike or Cast at an enemy. |
| **Burning** | Take 1 damage at the start of your turn. |
| **Prone** | Melee Strikes against you have advantage. Standing up costs Move 1. |
| **Unconscious** | At 0 Health. No turns, no reactions, Prone. Dying until treated (section 8). |
| **Grappled** | Blocks 👣 Move (see section 10). |
| **Silenced** | Blocks ✦ Cast. |
| **Disarmed** | Blocks ⇄ Ready, and ⚔ with the disarmed item. |
| **Blessed / Cursed** | See fate deck (no duration – they last until the card is drawn). |

---

## 8. Exhaustion, lingering damage and rests

Your action deck is your stamina.

- **Exhausted**: if you can't refill to at least **2 cards** because your draw pile is empty, you are Exhausted. You can only play **one** card per turn (primary *or* secondary), and you can't react.
- **Catch Breath**: you may spend your whole turn (no cards played) to catch your breath:
  1. Shuffle your discard pile into your draw pile.
  2. Choose **1** card from the shuffled pile and set it aside as **Spent**.
  3. Draw up to hand size as normal next round.
- **Spent** cards stay out until your next **short or long rest**, even after the combat ends (see *Rests* below).

This makes long fights wear characters down: each Catch Breath shrinks the deck, and burning cards on reactions gets you there faster.

You may Catch Breath at any time on your turn, even before you are Exhausted. Doing it early costs a turn but keeps your hand full later.

### Lingering damage

Some harm stays with you after the fight. It's represented by **negative cards** shuffled into your own decks. They clog your hand until you get rid of them.

#### Wounds

```
┌───────────────────────┐
│ ✖ WOUND               │
│ Can't be played.      │
│ End of your turn:     │
│ discard this card.    │
└───────────────────────┘
```

- **You gain 1 Wound** when:
  - you take **5 or more damage from a single hit** (after armor), or
  - you drop to **0 Health** (you fall Unconscious, see below).
- The Wound goes into your action **discard pile**. It comes back when you Catch Breath or after the combat.
- **When drawn:** it takes up a slot in your hand. It can't be played, not even for Brace. At the end of your turn, discard it.
- **Wounds stay** between fights. Removing one:
  - **long rest:** remove 1 Wound;
  - **treatment:** a Lore check (Normal 5) with a Healer's Kit removes 1 Wound. Once per patient per day;
  - healing magic or items that say so.

#### Taint

```
┌───────────────────────┐
│ ☣ TAINT               │
│ When drawn: take 1    │
│ damage (ignores       │
│ armor), then discard  │
│ this card. Don't draw │
│ a replacement.        │
└───────────────────────┘
```

- **You gain Taint** from sources with the **Tainting** keyword: corrupted monsters, poison, disease, cursed places. The source says how much, and which deck: the **action deck** for the body (poison, disease) or the **skill deck** for the mind (dark magic, horrors).
- Taint goes into your discard pile, just like Wounds.
- **When drawn:** resolve it at once: take 1 damage (ignores armor) and discard it. You don't draw a replacement, so your hand is one card short.
- **Taint survives rests.** Only these remove it:
  - a **cure**: priest magic, a rare potion or a special item;
  - **Cleansing**: a downtime challenge (Lore, Progress 4) with a healer or a temple.
- **Afflicted:** while you have **3 or more Taint** in your decks, you are Afflicted. Your max Health is −3, and the source adds its own effect (e.g. a sickness or mutation). It ends when you're below 3 Taint again.

**[OPEN]** A list of afflictions per Taint source. Waits for world creation.

#### Deck size and pruning

Wound and Taint cards **don't count** toward deck size limits, and you **can't** prune them by leveling or training. They have to be healed or cured.

### Unconscious and death

- Health **never goes below 0**. Damage beyond that is lost.
- At **0 Health** you are **Unconscious**: you fall Prone, take no turns, and can't play reactions. You also gain 1 Wound.
- You are **dying**. You die if either of these happens:
  1. you take **any further damage** while at 0 Health, or
  2. you are **not treated** before the end of your next turn.
- **Treatment** (any one of these):
  - any **healing**: Health goes above 0 and you wake up;
  - **Stabilize**: an adjacent ally plays any card for its **primary** to stabilize you instead of using its effect. You stay at 0 Health and Unconscious, but you're no longer dying. After the combat you wake up with 1 Health;
  - a potion poured into your mouth by an adjacent ally (a **Use** action).
- A stabilized character who takes damage again is dying again.
- **NPCs** die at 0 Health unless the GM decides otherwise (e.g. to take a prisoner).

### After combat

- Shuffle your hand and action discard pile back into your action deck.
- **Spent** cards stay out. Several fights in a row without rest wear you down.

### Rests

Both rests need a **safe place**. Resting in a dangerous place is up to the GM: it may be interrupted, or simply impossible.

| | Short rest | Long rest |
|---|---|---|
| **Takes** | About an hour | A night's sleep |
| **Limit** | You need a **rest token** | Once per day |
| **Action deck** | Spent cards return | Spent cards return |
| **Skill deck** | Shuffle the skill discard pile and Spent skill cards back into the skill deck | Same |
| **Rest tokens** | – | Regain all |
| **Health** | Heal **1** | Heal **5** |
| **Wounds** | – | Remove **1** |
| **Taint** | – | – (needs a cure) |

- **Rest tokens:** each character has a limited number, starting at **1**. More are gained through **leveling**.
- You can't take a short rest in the middle of a combat or a challenge. There you **Catch Breath** instead, and it always costs something:
  - **In combat:** your whole turn, so no damage and no movement (see above).
  - **In a challenge:** the other side gets time (see skill rules).

---

## 9. NPC decks

NPCs don't have hands. Each NPC **type** has a small deck of 5–8 cards, and each card is a full turn:

```
┌──────────────────────────┐
│ GOBLIN – Stab & Scurry   │
│ Strike, then Move 2      │
└──────────────────────────┘
```

- At the start of the NPC phase, the GM draws one card per NPC type. All NPCs of that type do what it says.
- Shuffle when the deck runs out. NPCs don't get exhausted.
- **Elite / boss** NPCs may keep 1–2 cards face-up as reactions, shown to the players.
- NPCs still use items for their Strike and Cast values, so the same goblin deck works for a spear goblin and a bow goblin.

### Tactics

Monsters should be dangerous because of **how** they fight, not just their numbers. Every NPC type has:

1. **1–2 tactic keywords**: rules that give the NPC an edge in a specific situation, usually advantage.
2. **A target priority**: who it attacks when it has a choice.
3. **A deck that supports the tactic**: a pack creature has cards that move to surround, a sniper has cards that keep its distance.

A good tactic also gives players something to **play against**. If wolves get advantage when they surround you, standing in a corridor beats them.

Starter list of tactic keywords (to grow over time):

| Keyword | Effect | Counter-play |
|---|---|---|
| **Pack Tactics** | Advantage on Strike if another ally is adjacent to the target. | Fight in corridors, kill the flankers. |
| **Skirmisher** | After it Strikes, it may Move 1. | Ranged attacks, Grappled. |
| **Ambusher** | Advantage against targets that haven't acted yet this combat. Its side has advantage on the initiative draw. | Scouting, winning who starts. |
| **Sniper** | Ignores cover from figures. Moves away when an enemy comes adjacent. | Close the distance, use walls. |
| **Shield Wall** | Adjacent allies count as in cover against ranged attacks. | Area attacks, flank around. |
| **Bodyguard** | Reaction: takes a hit instead of an adjacent ally. | Kill the bodyguard first. |
| **Brute** | Its hits push the target 1 square. | Stand with your back to a wall. |
| **Grappler** | On hit: target is Grappled (1). | Kill it, keep Ready/Move cards. |
| **Commander** | When it acts, one ally may Move 1. Allies lose this while it's down. | Focus it down. |
| **Cowardly** | Flees when below half Health. | Let it run, or chase for the loot. |
| **Tainting X** | On hit: the target gains X Taint (section 8). | Avoid its hits, carry a cure. |

Target priorities: **Nearest**, **Weakest** (lowest Health), **Caster** (anyone who Cast last round), **Last attacker**, **Leader** (GM's choice).

---

## 10. Icons

Card space is limited, so card halves use **icons** wherever possible. Text is only for effects icons can't express.

| Icon (placeholder) | Meaning |
|---|---|
| ⚔ | Strike |
| ✦ | Cast |
| 🛡 | Defend |
| 🧪 | Use |
| 👣 + number | Move X |
| ⇄ | Ready |
| ⚡ | Reaction |
| +1 / −1 next to an icon | Modifier to that action |
| ◎ + number | Range |
| ✸ + number | Area (burst size) |

Example card written with icons:

```
┌──────────────┐
│ DRAW STEEL   │
│ ▲  ⚔         │
│ ▼  ⇄         │
│ ⚡ –          │
└──────────────┘
```

### Blocked icons

Because each card half is built from icons, **features and conditions can block icons**:
- If an icon is blocked, you can't play any card half that shows it.
- The other half of the same card may still be playable.
- Brace (discard any card to reduce damage by 1) is never blocked, so a card is never completely dead.

Examples:

| Source | Blocks |
|---|---|
| **Grappled** (condition) | 👣 Move |
| **Silenced** (condition) | ✦ Cast |
| **Disarmed** (condition) | ⇄ Ready, and ⚔ with the disarmed item |
| **Heavy Armor** (item drawback) | ⚡ Sidestep reactions |
| **Berserker** (feature) | 🛡 Defend, but +1 on all ⚔ |

---

## 11. Grid

Combat uses a square grid. All distances use **Chebyshev distance**: distance = the larger of the horizontal and vertical difference, so a diagonal step costs 1, the same as a straight one. (In Foundry: grid diagonal rule "Equidistant".)

- **Movement:** Move X = up to X squares.
- **Adjacent:** the 8 squares around you. Melee Strikes target an adjacent enemy unless the item says otherwise.
- **Range X:** count squares to the target, the same way as movement.
- **Line of sight:** ranged Strikes and Casts need a clear line from the center of your square to the center of the target's. Walls block it.
- **Area ✸ X:** hits the target square and all squares within X of it.
- **Blocking:** you can move through allies but not through enemies.

### Cover

The target has **cover** if the line from your square to its square passes through:
- a square with a low obstacle (crate, table, low wall), **or**
- a square with another figure (ally or enemy).

Attacks against a target in cover have **disadvantage**. Melee Strikes against an adjacent target ignore cover.

Full obstacles (walls, pillars) block line of sight completely: you can't target through them at all.

### Ranged in melee

If you make a **Ranged** Strike or an **Area** Cast while an enemy is **adjacent** to you, you have **disadvantage**.
This is the one generic rule. Items or features can make exceptions (e.g. a feature "Point Blank: ignore the ranged-in-melee rule").

---

## 12. Open questions (next sessions)

- Final icon set and card layout for the Foundry card sheets.
- Affliction list for Taint sources (after world creation).
- How characters gain new action cards and features (leveling).
- Skill deck for out-of-combat play.
