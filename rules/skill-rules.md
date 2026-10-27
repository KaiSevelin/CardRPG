# Card RPG – Skill Rules (Draft 0.2)

> Everything outside combat: sneaking, persuading, climbing, investigating, travelling.
> Status: rules complete. Every procedure needed to play is here. What remains is **content**
> (card lists per Way) and it waits on the world and the Way trees — see section 9.

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
  - Way of Mind: lots of Lore, Presence and Wits
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

### Opposed checks

When someone is actively working against you — a guard watching for you, a merchant haggling back, a thief you're chasing — the opposition isn't a difficulty number, it's a character.

- **The player always plays and draws.** NPCs never draw fate in an opposed check.
- The NPC's **resistance** is a flat number the GM sets, the same scale as difficulties:

| Opposition | Resistance |
|---|---|
| Untrained, distracted, or not expecting trouble | 3 |
| Competent and paying attention | 5 |
| Trained specialist, or alerted and hunting you | 7 |
| The best in the region, forewarned | 9 |

- Compare your total to the resistance and read the result off the normal table (Critical / Success / Partial / Fail).
- **A specialist NPC's tactic or motivation** can give you disadvantage instead of raising the number. Prefer that: it keeps the numbers readable and gives players something to play against.
- **Player against player** (an arm-wrestle, a bluff between characters): both play a card and draw fate; the higher total wins, and the active character wins ties.

This keeps all uncertainty on the players' side of the table, so the GM never rolls against them in secret.

### Group checks

When the whole party has to get past the same obstacle — crossing a chasm, sneaking past one gate, keeping a story straight — don't make everyone check.

- **One character checks** for the group. They choose the approach and describe how they get everyone through.
- **Each other character** may either **help** (normal help rules, but the one-helper limit is lifted: each helper after the first adds **+1**, to a maximum of +3 from help) **or** accept being a **liability**: if they have no card of a fitting approach and don't help, the check takes **−1**.
- **On a Partial or Fail,** the consequence lands on the whole group, not just the one who checked.
- **When the group splits up** on purpose — two people over the wall, two through the cellar — that's two checks, and usually a challenge rather than a single check.

### Passive senses

Some things you notice without trying: an ambush waiting in the trees, a lie in a friendly sentence, a tripwire across a corridor. These never cost a card.

> **Passive score = the highest 👁 Wits value in your skill deck + 2.**

- Count the **whole deck**, not your hand: your draw pile, your discard pile, Spent cards, all of it. The score doesn't change as you play through the day.
- **No card is played and no fate is drawn.** The GM compares the score to the difficulty of noticing and tells you what you see. A score of 5 notices anything Normal or easier, always.
- **Features, Know-how and tools apply** if they fit the situation — a Hunter's *Trail sense*, a lantern in a dark room. Conditions and injuries apply too (a lost eye gives −2 against anything you'd have to see).
- **Advantage and disadvantage don't apply**, since nothing is drawn. A circumstance that would grant advantage instead gives **+1**; disadvantage gives **−1**.
- **The highest Wits card in the party** is the one that matters for the group: the party notices what its most observant member notices.

This makes passive senses a **deck-building** question. A character who carries one strong Wits card is permanently alert even if their hands are full of something else, and nobody has to burn a card to walk down a corridor carefully. If you want to notice something *better* than your passive score, that's a normal check: look, search, and play a card for it.

| Highest Wits in deck | Passive score | Notices reliably |
|---|---|---|
| 1 | 3 | Easy: the obvious trap, the nervous liar |
| 2 | 4 | – |
| 3 | 5 | Normal: a waiting ambush, a concealed door |
| 4 | 6 | – |
| 5 | 7 | Hard: a professional tail, a hidden assassin |

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

A **twist deck** of 30 cards helps the GM improvise costs and complications. On a **Partial**, the twist is the price of success. On a **Fail**, the twist *is* what happens instead.

Each twist is a question, not a script: the card names the kind of trouble, the GM says what it looks like here.

### The eight twists

| Twist | Copies | What it costs | In a sneak scene | In a negotiation |
|---|---|---|---|---|
| **Noise** | 4 | Attention. The opposition now knows something is wrong. | A guard shouts "Who's there?" | Someone overhears. |
| **Time** | 4 | The clock. Pressure +1 on top of the normal cost. | It takes far longer than you had. | They ask for a break to think. |
| **Gear** | 4 | A tool. It breaks or is lost: no tool bonus until repaired or replaced. | A lockpick snaps in the lock. | You had to give something away. |
| **Strain** | 5 | Cards. Discard 1 skill card of the GM's choice from your hand. | The climb takes everything you had. | The argument wears you down. |
| **Hurt** | 3 | Health. Lose 2 Health, or gain a condition that fits. | You fall the last stretch. | Your reputation takes the damage. |
| **Arrival** | 4 | Someone new. A third party walks into the scene. | A patrol turns the corner. | A rival arrives. |
| **Secret** | 2 | Information, in either direction. You learn something unwelcome, or they learn something about you. | The room holds something you weren't meant to find. | They know about your past. |
| **Opening** | 4 | Nothing — this one gives. The complication also creates an opportunity. | The dog bolts, but it opens a door. | An unexpected ally speaks up. |

That's **30** cards. The counts are the deck's tone: *Strain*, *Noise*, *Time*, *Gear*, *Arrival* and *Opening* are common, so most twists push the story sideways rather than hurting anyone. *Hurt* and *Secret* are rare, so they land hard when they come.

### Using the deck

- **Draw one card** and apply it. Shuffle when the deck runs out.
- **Draw two and pick** when the failure was dramatic, or when the first card doesn't fit the scene at all. Never force a twist that makes no sense — put it back and draw again.
- **Opening on a Fail** is the fail-forward valve: you didn't do the thing, but a new road opened. If every twist in a session has been bad news, the GM should reach for this one.
- **The GM can always choose a cost directly** instead of drawing. The deck is there for when inspiration runs out, not to override the GM.
- **Twists stack with the challenge tracks.** A twist on a Fail is *in addition* to Pressure +1, not instead of it. Only *Time* adds a second point of Pressure.

### Twists outside a scene

In **downtime** (section 6), read every twist as a story hook rather than an immediate cost: *Arrival* is a rival who notices your research, *Secret* is a buyer who shows unusual interest, *Gear* is a supplier who fails you. Downtime twists should create the next adventure.

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

A **secret** is something the NPC doesn't want known. Secrets are **slates** the players collect:

```
┌───────────────────────────┐
│ 🗝 SECRET                  │
│ Baron Aldric              │
│ Owes 400 gold to the      │
│ Night Market.             │
└───────────────────────────┘
```

- **Gaining secrets:** through investigation, Wits or Shadow checks, the *Secret* twist (when it goes your way), downtime contacts, or as a reward.
- **Playing a secret:** play it during a check against that NPC to gain **advantage**. Then the secret slate is **spent**. Once revealed, it no longer works as leverage.
- **Stacking:** a secret and a motivation don't stack, since advantage never stacks. A secret can still **cancel** a disadvantage from a social tactic or from acting against a motivation.
- **Consequences:** using a secret makes the NPC remember. They may become an enemy, seek revenge, or start digging up secrets about **you**.

### Secrets against the players

NPCs can hold secrets about the characters too, e.g. from a background, a past failure or a *Secret* twist.

- The GM keeps them as secret slates.
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

## 9. What's left

The procedures are done. These are decided:

| Was open | Decision |
|---|---|
| Passive senses | Highest 👁 Wits value in your deck **+2**, no card and no fate draw (section 2). |
| Opposed checks | Flat resistance number; only the player draws (section 2). |
| Group checks | One checker, helpers stack to +3, consequences hit everyone (section 2). |
| Twist deck size | 30 cards, 8 types with weighted counts (section 4). |

### Blocked on the world

- **Each Way's card list** — which skill cards a Way of Strength, Shade or Mind character can add on level-up. Needs the Way trees, which need the world. The starter skill deck in [starter-cards.md](starter-cards.md) is a generic stand-in until then.
- **Fear and Madness cards** in the skill deck (see [ideas.md](ideas.md)). The mechanism is the same as Taint; what causes it depends on which horrors the world holds.
- **Approach coverage per background** — the four examples in [backgrounds.md](backgrounds.md) are placeholders.
