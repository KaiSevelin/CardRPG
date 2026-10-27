# Card RPG – Core Combat Rules (Draft 0.3)

> Status: third draft. Individual initiative and intent cards (section 3) are new; numbers in
> sections 4, 8 and 9 are balance-tested against the simulator in [../sim/](../sim/).
> Items marked **[OPEN]** still need a decision.
> Out-of-combat play is covered in [skill-rules.md](skill-rules.md).

---

## 1. Components per character

| Component | What it is |
|---|---|
| **Action deck** | ~15 personal action cards. Defines how the character fights. |
| **Fate deck** | 20 modifier cards. Drawn to resolve attacks and heals. |
| **Item slates** | Everything the character owns. Only **equipped** items can be used. |
| **Feature slates** | Permanent traits (Strong, Good Aim, ...). |
| **Condition tokens** | Temporary effects with a duration counter. |
| **Health** | Hit points. At 0 you are down. |

NPCs use simpler decks (see section 9).

### Cards and slates

Everything in this game is printed the same size and looks like a card. Two words keep them apart, because they behave completely differently:

| | What it is | Examples |
|---|---|---|
| **Card** | Lives in a deck. Shuffled, drawn, played, discarded. | Action, fate, skill, twist and NPC cards — and **Wounds** and **Taint**, which really are shuffled into your decks |
| **Slate** | Laid out face up in front of you. Never shuffled, never drawn. | Item slates, feature slates, secret slates, permanent injuries |

A slate can still be **spent** — a secret slate is used up once you play it — but it never goes into a deck.

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
2. **Intent** – the GM draws one card per NPC **type** and lays it **face down** (see below).
3. **Turns** – everyone takes a turn, one at a time, in initiative order.

### Initiative

Drawn **once** at the start of combat. The order then stays the same for the whole fight.

1. **Everyone draws one fate card** — players from their own fate decks, every NPC from the NPC fate deck. Each goblin draws for itself.
2. **Highest card acts first**, then down the order. Miss is lowest, Critical highest.
3. **Ties are redrawn.** Everyone still tied draws again, and only they draw. Repeat until the order is settled.
4. A character draws with **advantage** if a feature or tactic grants it (*Alert*, *Ambusher*), and with **disadvantage** for the reverse. As usual, the two cancel out.
5. Normal fate rules apply: a Miss or Critical shuffles that fate deck.

### Intent

NPCs decide what they'll do **before** anyone acts, and they decide it by type.

- At the start of each round, after refill, the GM draws **one card per NPC type** — one for all the goblins, one for all the wolves — and lays each **face down**.
- Every NPC of that type will act on that card when its own turn comes up. A dozen goblins all do what the goblin card says, but each at its own place in the order.
- The card is only **drawn** per type. **Initiative is still individual**, so goblins act scattered through the round, some before the party and some after.
- A type that joins mid-combat draws its intent card as it arrives. If every NPC of a type dies before acting, its card is discarded unused.

**Why face down.** The intent cards are information worth fighting for. The moment the first goblin acts, the players learn what every other goblin is about to do — so killing it first keeps them guessing, and letting it act buys them foreknowledge. Abilities that **reveal** an intent card (a divination, a tactician's feature, a scout's trick) are strongest when the enemy acts late in the order, and worth nothing when they act first.

This also means **the same goblin card plays differently depending on initiative**. *Swarm* ("Strike +1 if another goblin is next to the target") hits for less on the first goblin and more on the third, because the earlier ones have already moved into place.

#### Foresee

Anything that lets a player read enemy intent uses one keyword:

> **Foresee** — Look at one NPC type's intent card for this round.

Put it on divination spells, a scout's feature, a tactician's card half, a Wits-based trick, an
omen-reading item. It needs no icon of its own: it's a named effect, like *Taunt* or *Stabilize*.

Foresee is deliberately **worth a different amount every round**, which is what makes it interesting
rather than a flat bonus:

- **Worth a lot** when the enemy acts late in the order and the party can pre-empt what's coming.
- **Worth nothing** when the enemy acts first and reveals the card for free.
- **Worth most** against several types at once, since each type hides its own card — a mixed warband
  of spear goblins, archers and a shaman has three secrets, and Foresee buys you one of them.

A caster who can Foresee every round shouldn't exist. Price it as a once-per-combat feature, a card
half that competes with attacking, or a spell with a cost.

### Surprise

If one side has clearly caught the other — an ambush, a sprung trap, a charge into an unaware camp — the surprising side takes a full round of turns before the loser of the surprise acts at all. Then the normal order begins. This is the GM's call, and it replaces the initiative draw for round 1.

### Your turn

- Play **one card for its primary** and **a different card for its secondary**.
- You may play them in either order.
- Both cards go to your **discard pile**.
- The rest of your hand stays for reactions.
- **Two attacks in one turn are allowed** if they come from two different cards, e.g. a Strike primary plus a card with Strike on its secondary. You can never use both halves of the same card.

> **Where double attacks come from.** A card with Strike on its *secondary* half is the strongest kind of card in the game: simulation showed one such card shortens fights by a full round. The rule stays open, but these cards are meant to be **earned through leveling**, not handed out in starter decks. Treat Strike-on-secondary as a reward on a Way's tree, the same way a second attack is a milestone in other games. **[OPEN]** The leveling mechanism itself is still unspecified, so the starter deck keeps its one double-strike card for now.

### Reactions

- When a trigger happens (you are attacked, an enemy moves next to you, ...), you may play a card from your hand for its reaction.
- The reaction card is **discarded**.
- Reacting is never free: every card you react with is one more card drawn from your deck at refill, so it brings exhaustion closer.

**One reaction per trigger.** You may play **one** reaction against any single trigger. You can't stack Parry and Brace on the same hit, and you can't throw your whole hand at one attack.

- There is **no limit per round**. React to every attack in the round if you can afford the cards — your hand size and the exhaustion it buys are the only limit.
- **Several characters may each react to the same trigger.** One hit can be intercepted by a Bodyguard *and* Braced by whoever ends up taking it.

**Order of resolution.** When more than one reaction applies to the same trigger, they resolve in two
steps, because some reactions change *who* is being hit:

1. **Redirection** — reactions that change the target or the path of an action, such as *Bodyguard*
   (take a hit meant for an adjacent ally). These resolve **first**, in initiative order.
2. **Reduction** — reactions that change how much an action does, such as Parry, Block and Brace.
   These are offered **afterwards**, to whoever is now the target.

So an ally can throw themselves in front of a blow before you decide whether to brace against it, and
if they do, you have spent nothing.

**One reaction still means one.** The limit covers both steps: a Bodyguard who intercepts a hit has
used its reaction for that trigger and can't also Brace against it. Reactions that neither redirect
nor reduce — *Sidestep* fires on an enemy's movement, *Use* on nothing in particular — resolve at
their own trigger and sit outside this order.

Why: the card economy is already the cost of reacting, so reactions don't need a second budget to track. Capping it per trigger is what keeps a big hit frightening — a lethal blow leaves you choosing *which* defence to spend, not stacking all of them.

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

### Block

**Defend** gives you **Block X**, where X is the item's *Defend* value. Block is subtracted from incoming damage (step 6 of section 5).

How long it lasts depends on how you played it:

| Played as | Block lasts |
|---|---|
| **Primary** | Against **every** attack until the start of your next turn. |
| **Secondary** | Against the **next** attack only. |
| **Reaction** | Against the attack that triggered it. |

A Defend primary is a real defensive stance: it costs you your strong half, so it has to hold up against a whole enemy turn. A Defend secondary or reaction is a one-off.

Blocks from different sources don't stack. If you have more than one, use the highest.

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
6. **Target's defenses** – subtract armor, then Block (section 4). The result can't go below 0.

Fate is drawn for **damage and healing**. Movement, Ready and Defend never draw fate.

**One draw per action, not per target.** An action that hits several creatures — any Area — draws fate **once** and applies the same result to everyone it hits. A Critical doubles the damage to all of them; a Miss means the whole attack does nothing.

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
- So *Dazed (1)* from a goblin lasts until the start of that goblin's next turn. The victim always suffers it for exactly one of their own turns, wherever the creator sits in the initiative order — if the goblin acts before them the condition bites this round, if it acts after them it bites next round, but it always costs exactly one turn.
- Conditions you put on yourself (e.g. Invisible from a Smoke Bomb) tick at the start of your own turn.
- Conditions with no creator (fire, poison gas, a trap) count the affected character as the creator.
- If the creator leaves combat, its conditions tick at the start of the **affected** character's turn instead, so they still last exactly one of the victim's turns.

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

- **You gain Taint** from sources with the **Tainting** keyword: corrupted monsters, poison, disease, cursed places. The source says how much, and which deck: the **action deck** for the body (poison, disease) or the **skill deck** for the mind (dark magic, horrors). The two have different card faces (see [icons.md](icons.md)), so you can see at a glance what is wrong with you.
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

- One card is drawn per NPC **type** per round, at the start of the round, face down (*Intent*, section 3). Every NPC of that type acts on it, each on its own initiative.
- Shuffle when the deck runs out. NPCs don't get exhausted.
- **Elite / boss** NPCs may keep 1–2 cards face-up as reactions, shown to the players.
- NPCs still use items for their Strike and Cast values, so the same goblin deck works for a spear goblin and a bow goblin.

### NPC gear and the armor rule

**NPC weapons are their own items, tuned separately from the ones players carry.** A Goblin Spear and a player's spear can both be called a spear and have different Strike values. This is deliberate: an NPC's weapon is the one knob that sets how dangerous it is, and it shouldn't be tied to what a hero of the same level wields.

Tune it with this rule:

> **Keep a weak enemy's Strike value at least 2 above the heroes' armor.**

Armor is subtracted flat from every hit, so against many small attacks it doesn't reduce damage, it *cancels* it. At Strike 2 against armor 1, half of every hit is gone before fate is drawn, and a swarm of enemies is no threat at all. At Strike 3 the same swarm is dangerous. Simulation of the starter Warrior (armor 1) against goblins showed this clearly: at Strike 2 the warrior won every fight losing 2 of 12 Health, and raising goblins to Strike 3 was what made groups of four a real fight.

The rule cuts the other way too: a hero who stacks armor turns whole enemy types off. Give heavy armor a cost (see *Blocked icons*, section 10) and don't let armor climb much past 2 or 3.

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
| **Ambusher** | Advantage against targets that haven't acted yet this combat. It draws with advantage on initiative. | Scouting, acting before it does. |
| **Sniper** | Ignores cover from figures. Moves away when an enemy comes adjacent. | Close the distance, use walls. |
| **Shield Wall** | Adjacent allies count as in cover against ranged attacks. | Area attacks, flank around. |
| **Bodyguard** | Reaction: takes a hit instead of an adjacent ally. | Kill the bodyguard first. |
| **Brute** | Its hits push the target 1 square. | Stand with your back to a wall. |
| **Grappler** | On hit: target is Grappled (1). | Kill it, keep Ready/Move cards. |
| **Commander** | When it acts, one ally may Move 1. Allies lose this while it's down. | Focus it down. |
| **Cowardly** | Flees when below half Health. | Let it run, or chase for the loot. |
| **Tainting X** | On hit: the target gains X Taint (section 8). | Avoid its hits, carry a cure. |

Target priorities: **Nearest**, **Weakest** (lowest Health), **Caster** (anyone who Cast last round), **Last attacker**, **Leader** (GM's choice).

### [OPEN] Cowardly needs rewriting

Simulation shows **Cowardly as written hands back more than Pack Tactics takes**. Against one starter
Warrior, four goblins with Pack Tactics win 20.3% of fights; the same four with Pack Tactics **and**
Cowardly win only 7.4% — worse than four goblins with no tactics at all (9.0%). Each goblin runs as
soon as *it* is hurt, so the group is ground down one deserter at a time and never reaches the
dangerous part of the fight.

The proposed replacement, which makes the threat scale with group size instead (four goblins win
11.5%, five goblins 37.3%):

> **Cowardly** — When half or more of its group is down, the survivors break and flee.

The pack holds while it is strong and breaks together, which keeps the early fight dangerous and
turns the rout into a moment the players earn. Either way, **a Cowardly monster is worth less than
its stats suggest** — price it lower, or make the escape cost the players something: the ones that
got away warn the next camp, carry off the loot, or come back with friends.

Simulation also shows **Cowardly should never go on a ranged NPC**: a *Sniper* already retreats when
something closes on it, so a flee tactic on top is redundant, and with group morale it makes the
archers walk away healthy — turning the hardest fight in the test set into one of the easier ones.
Keep Cowardly for melee types.

See [../sim/analysis-2026-10-27.md](../sim/analysis-2026-10-27.md), finding 4.

---

## 10. Icons

Card space is limited, so card halves use **icons** wherever possible. Text is only for effects icons can't express.

The full set, with counts and where to source it, is in [icons.md](icons.md). The glyphs below are placeholders.

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
| ✸ + number | **Blast**: area of that size, hits **everyone** in it, allies included |
| ✵ + number | **Aimed**: area of that size, hits **only your enemies** |
| ✚ + number | Heal X |
| ⊕ | Advantage |
| ⊖ | Disadvantage |

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
- **Area X:** hits the target square and all squares within X of it. Fate is drawn once for the whole attack (section 5).

### Blast and Aimed

Whether an area spares your friends is a property of the **item or card**, and it has its own icon:

| Icon | Kind | Hits |
|---|---|---|
| ✸ X | **Blast** | Everyone in the area — enemies, allies and you, if you're in it. |
| ✵ X | **Aimed** | Only your enemies. |

Blast is the default and the cheaper one: a Fire Wand doesn't care who it burns. Aimed belongs on precise or discriminating magic, and should cost more — a higher-tier item, a specialization, or a formula with a price attached.

This is the main reason to care where your party is standing, so don't make Aimed common.
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

- **Leveling.** How characters gain new action cards and features, and which Way tree gives
  what. This is the biggest one: the double-attack decision (section 3) and the action-deck
  grow/prune rules both hang off it. Waits on the Ways, which wait on the world.
- **Affliction list for Taint sources** (section 8). Waits on world creation.
- **Card layout** for the Foundry card sheets: where the three halves sit, how a modifier attaches to its icon, how a blocked icon reads as blocked. The icon *set* is listed in [icons.md](icons.md); the art isn't chosen yet.

Settled since draft 0.1:

| Was open | Decision |
|---|---|
| Skill deck for out-of-combat play | Written: [skill-rules.md](skill-rules.md) draft 0.2. |
| Condition timing | Ticks at the start of the **creator's** turn, so a duration-1 condition always costs the victim exactly one turn (section 7). |
| How Block works and how long it lasts | Section 4, *Block*. |
| How to tune NPC damage against armor | Section 9, *NPC gear and the armor rule*. |
