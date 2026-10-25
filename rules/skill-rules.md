# Card RPG – Skill Rules (Draft 0.1)

> Everything outside combat: sneaking, persuading, climbing, investigating, travelling.
> Status: first draft. Items marked **[OPEN]** still need a decision.

## Design goals

Out-of-combat play should be fun, not just "draw to pass". The rules aim for:

1. **Choices, not rolls.** You choose *which* card to play and *how* you approach the problem.
2. **Fail forward.** Failure changes the story instead of stopping it. Partial successes come with a cost.
3. **Teamwork.** Your hand rarely has the perfect card, so help from others matters.
4. **Effort is a resource.** Skill cards run out over an adventuring day, so you pick where to push hard.
5. **Same engine as combat.** Cards + items + features + fate + advantage. Nothing new to learn.

---

## 1. Skill deck

Each character has their own **skill deck** of about 15 cards, separate from the action deck.

### Approaches

Every skill card shows one **approach** and a **value** (1–3):

| Approach | Icon (placeholder) | Covers |
|---|---|---|
| **Might** | ✊ | Climbing, breaking, lifting, intimidating, enduring |
| **Agility** | 🌀 | Balance, acrobatics, quick hands, riding, dodging traps |
| **Shadow** | 🌑 | Stealth, deception, disguise, pickpocketing, lockpicking |
| **Wits** | 👁 | Noticing, searching, reading people, tracking, survival |
| **Lore** | 📜 | Knowledge, arcana, religion, history, healing |
| **Presence** | 👑 | Persuading, leading, performing, bargaining, calming |

Some cards also have a small **edge**: a bonus effect that triggers when the card is played, even if the check fails.

```
┌───────────────────────┐
│ 👁 WITS            2  │
│ Sharp Eyes            │
│ Edge: ask the GM one  │
│ yes/no question about │
│ the scene.            │
└───────────────────────┘
```

### Deck composition

- Every deck contains **all six approaches**, so anyone can try anything.
- The **Way** (class) and **background** decide which approaches have more cards and higher values. Rough idea:
  - Way of Strength: lots of Might and Agility
  - Way of Shade: lots of Shadow, Agility and Wits
  - Way of Mystery: lots of Lore, Presence and Wits
- Specialists play their best approach more often and with higher values. They still sometimes draw a hand without it, which is where teamwork comes in.
- Each deck has 1–2 **Inspiration** cards: wild, any approach, value 1. *Edge: draw 1 skill card.*

### Hand and refresh

- **Hand size: 4.**
- At the start of each **scene**, draw up to hand size. The GM says when a new scene starts, e.g. a new location, a new conversation, or time passing.
- Played cards go to the skill discard pile.
- The skill discard pile is **not** reshuffled automatically. It comes back on a **short rest** (needs a rest token) or a **long rest**. See *Rests* in the core rules.
- **Fatigue:** if your skill deck and hand are both empty, you can still **improvise**: value 0, with disadvantage.
- Inside a challenge you can't rest, but you can **Catch Breath** (section 3).

---

## 2. Making a check

Only make a check when **failure would be interesting** and the outcome is uncertain. Trivial tasks just succeed. Impossible tasks just fail, or need a different plan.

1. The GM describes the obstacle and sets a **difficulty**.
2. You play **one skill card** and **say how** you approach it. The approach must fit the description: you can climb a wall with Might or Agility, but not with Presence.
3. **Total** = card value + **tool** bonus + **feature** bonus.
4. Draw a **fate** card and add it (advantage/disadvantage as usual).
5. Compare to the difficulty.

### Difficulty

| Difficulty | Number | Who succeeds reliably |
|---|---|---|
| Easy | 3 | Anyone with a decent card |
| Normal | 5 | Trained, or anyone with a good tool or help |
| Hard | 7 | Specialists with a tool or help |
| Heroic | 9 | Specialists pushing hard with help |

### Results

| Result | When | Effect |
|---|---|---|
| **Critical** | Critical drawn | Success, plus a bonus (extra progress, a useful discovery, ...). |
| **Success** | Total ≥ difficulty | You do it. |
| **Partial** | Total is 1–2 below | You do it, **but** there's a cost: draw a twist card (section 4) or the GM picks a cost. |
| **Fail** | 3+ below, or Miss | You don't do it, **and** the situation changes: draw a twist card. |

How the odds work with the fate deck: if your total equals the difficulty, you succeed 70% of the time. One below gives 30% success and 60% partial. Two below gives 10% success and 60% partial.

### Tools

Items have **skill lines**, just as they have combat lines:

| Item | Skill line |
|---|---|
| Lockpicks | Shadow +2 (locks) |
| Climbing Rope | Might/Agility +1 (climbing) |
| Holy Symbol | Lore +1 (religion, undead) |
| Fine Clothes | Presence +1 (nobles) |
| Healer's Kit | Lore +2 (treating wounds) |

Only equipped or easily reached items count. Pulling something from deep in your pack may take time, which can matter in a challenge.

**Training:** anyone can use a tool, but an untrained user gets at most **+1** from it. Trained users get the full bonus. Training comes from backgrounds and the Way trees.

### Push and help

- **Push:** play a second card of the **same approach** from your hand to add its value. This costs you more cards and lets a specialist reach Hard and Heroic checks.
- **Help:** another character plays **any** card and describes how they help. Add **+1**, or **+2** if their card has the same approach. Only one helper per check. If the check fails, the helper shares the consequences.
- **Advantage:** a good plan, a clever use of the environment, or a fitting background grants advantage. Disadvantage works the same way for bad conditions.

---

## 3. Challenges

Bigger situations (infiltrating a manor, chasing a thief, negotiating a treaty, crossing a mountain) are played as **challenges** with two tracks:

- **Progress** (e.g. 6): how much you need to achieve.
- **Pressure** (e.g. 4): how much can go wrong before the challenge fails or turns ugly.

Each round, every character may take **one** action: a check, a help, or something else that fits.

| Result | Progress | Pressure |
|---|---|---|
| Critical | +2 | – |
| Success | +1 | – |
| Partial | +1 | +1 |
| Fail | – | +1 (and a twist) |

- **Progress full:** you succeed. The better the remaining pressure, the cleaner the success.
- **Pressure full:** the challenge fails or changes. The alarm sounds, the thief escapes, the duke walks out. This should lead to a new situation (often combat), not a dead end.

The GM can make some steps **require** a specific approach ("the gate guard needs Presence or Shadow"). Then the right card in the right hand matters, and players have to plan as a group.

### Catch Breath in a challenge

Instead of a check, a character may **Catch Breath**:
1. **Pressure +1.** The other side gets time: the guards change shifts, the duke grows impatient.
2. Shuffle your skill discard pile into your skill deck.
3. Set aside **1** card of your choice from it as **Spent** until your next rest.
4. Draw up to hand size.

### Example: sneaking into the baron's manor

Progress 5, Pressure 3.

1. **Kira** (Shade): 🌑 Shadow 3 + lockpicks +2 = 5 vs Hard 7. She draws +1 for a total of 6, which is a **partial**. The lock opens, but a twist card reveals that a guard dog has noticed something. Progress 1, Pressure 1.
2. **Brom** (Strength): only has ✊ Might in hand. He describes **helping** Aldren by lifting him up to a balcony.
3. **Aldren** (Mystery): 🌀 Agility 1 + Brom's help +1 = 2 vs Normal 5, with advantage for the good plan. Two fate cards: +2 and −1. He uses +2 for a total of 4, which is a **partial**. He's on the balcony but snagged his cloak, which is left hanging. Progress 2, Pressure 2.
4. ...

---

## 4. Twist deck (GM tool)

A **twist deck** of about 30 cards helps the GM improvise costs and complications. On a partial or fail, draw one and apply it in whatever way fits the scene:

| Twist | Example in a sneak scene | Example in a negotiation |
|---|---|---|
| **Noise** | A guard shouts "Who's there?" | Someone overhears. |
| **Time** | It takes longer than expected. | The other side asks for a break to think. |
| **Gear** | Lockpick breaks (lose the tool bonus this scene). | You had to give something away. |
| **Strain** | Discard 1 skill card. | Discard 1 skill card. |
| **Hurt** | Lose 2 Health. | Your reputation takes a hit. |
| **Arrival** | A patrol or a servant appears. | A rival arrives. |
| **Secret** | You learn something unwelcome. | They know something about you. |
| **Opening** | A complication that also creates a new opportunity. | An unexpected ally speaks up. |

The GM can always choose a fitting cost directly instead of drawing.

---

## 5. Social tactics

NPCs in social scenes work like monsters in combat: they have **social tactics** that create challenges and counter-play.

| Social tactic | Effect | Counter-play |
|---|---|---|
| **Proud** | Disadvantage on Presence checks unless you first flatter or show respect. | Flattery, gifts, titles. |
| **Suspicious** | Partial results always add +1 Pressure. | Proof, references, a good disguise. |
| **Greedy** | Advantage on checks that offer money or goods. | Bribes, but they'll want more next time. |
| **Fearful** | Might (intimidation) has advantage, but Pressure fills twice as fast. | Reassure them first. |
| **Loyal to X** | Can't be convinced against X, only around them. | Find what X wants. |
| **Talkative** | Wits checks to learn something have advantage. | Just listen. |

### Motivations

Every important NPC has **1–2 motivations**: what they want or fear (*wealth, revenge on the guild, protecting their daughter, fear of the church*).

- If you **appeal to a motivation** in a way that fits, you have **advantage** on that check.
- This can be used again and again, as long as the argument still makes sense.
- **Acting against** a motivation gives disadvantage.
- Motivations are usually hidden. You find them by:
  - a Wits check to read the person (often a step in the challenge itself);
  - card edges like *Sharp Eyes*;
  - asking around beforehand (Presence, Shadow), or downtime research;
  - guessing right during play: the GM may reveal a motivation when a player's argument hits it.

### Secrets

A **secret** is something the NPC doesn't want known. Secrets are **cards** the players collect:

```
┌───────────────────────────┐
│ 🗝 SECRET                  │
│ Baron Aldric              │
│ Owes 400 gold to the      │
│ Night Market.             │
└───────────────────────────┘
```

- **Gaining secrets:** through investigation, Wits or Shadow checks, the *Secret* twist (when it goes your way), downtime contacts, or as a reward.
- **Playing a secret:** play it during a check against that NPC to gain **advantage**. Then the secret card is **discarded**. Once revealed, it no longer works as leverage.
- **Stacking:** a secret and a motivation don't stack, since advantage never stacks. A secret can still **cancel** a disadvantage from a social tactic or from acting against a motivation.
- **Consequences:** using a secret makes the NPC remember. They may become an enemy, seek revenge, or start digging up secrets about **you**.

### Secrets against the players

NPCs can hold secrets about the characters too, e.g. from a background, a past failure or a *Secret* twist.

- The GM keeps them as secret cards.
- Played in a social challenge: the player has **disadvantage** on that check, **or** Pressure +1 (GM's choice).
- Then it's discarded, just like for players.
- Players can find out that an NPC knows something and act first: buy it back, steal it, or discredit the source.

---

## 6. Downtime

Activities between adventures (crafting, research, training, earning money, building contacts) are run as **challenges** where time and money are the pressure:

- **Progress:** what you want to achieve, e.g. *craft a fine sword: 6*.
- **Each check = one unit of time** (a day or a week, set by the GM).
- **Pressure:** cost, rising danger, or a deadline, e.g. *4: the materials run out, or the festival starts*.
- Twists in downtime are story hooks: a rival notices your research, a buyer shows unusual interest, ...

| Activity | Typical approaches | Tools |
|---|---|---|
| Crafting | Might, Agility, Lore | Smith's tools, alchemy kit |
| Research | Lore, Wits | Library access |
| Earning money | Any that fits the job | Job-specific |
| Building contacts | Presence, Shadow | Fine clothes, coin |
| Training | The approach being trained | A teacher |

---

## 7. Travel

Travel isn't a skill system of its own. It's a frame for **encounters**:

- The GM builds an **encounter deck for each region**. It mixes combat encounters, challenges, discoveries, social meetings and quiet days.
- Draw one card per travel leg (a day, or a stretch of road). The GM can always replace a draw with a planned encounter.
- Getting lost, weather and supplies are normal checks or short challenges when they come up.
- Resting during travel follows the normal rest rules. A camp in the wild may not be a safe place.

---

## 8. Growing and pruning the skill deck

Skill decks change over a character's life: they **grow** and they can be **pruned** (cards removed or replaced).

### When you level up

Choose **one**:
- **Add** a skill card from your Way's card list.
- **Upgrade** a card: replace it with a card of the same approach and value +1, or with one that has an edge.

You may also **prune** **1** card as part of leveling.

### Training (downtime)

**Training** is a downtime challenge (section 6) that lets you **prune** or **swap** a card between levels, e.g. *Progress 4, one check per week, needs a teacher*. This lets a character change direction without waiting for a level.

### Deck size

- **Minimum 12** skill cards, **no maximum**.
- Size balances itself:
  - **A small deck** draws your best cards more often, but runs out sooner. The skill deck only refreshes on rests, so you get fewer checks per day.
  - **A big deck** lasts longer through the day, but your hands are less focused.
- Pruning weak cards is therefore a choice between being reliable and lasting long, not a free upgrade.

The same grow/prune principle will apply to the **action deck** once the Way trees are written.

---

## 9. Open questions

- Should passive senses (noticing an ambush without trying) use the highest Wits card in your deck, or something else?
- Which cards each Way's card list contains (after the world and the Way trees).
