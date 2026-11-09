# Player's Handbook

Everything you need to play a character. Nothing here is for the GM, and nothing here explains why
a rule is the way it is — the reasoning lives in [core-rules.md](core-rules.md) and the documents
beside it, and you never need it at the table.

**The short version.** You have a deck of cards that is both your abilities and your stamina. Each
turn you play two of them. When you attack, you draw one card of luck. When you run out of cards,
you are exhausted — not because you were hurt, but because you have been fighting.

---

## 1. What you have

| | What it is |
|---|---|
| **Action deck** | 12–20 cards. What your character can *do* in a fight, and how long they can keep doing it. |
| **Skill deck** | About 15 cards. What your character can *attempt* outside a fight. |
| **Fate deck** | 20 cards. Your luck. Shared by nothing — it is yours. |
| **Item slates** | Everything you own, laid face up. Only **equipped** items can be used. |
| **Feature slates** | Permanent traits: *Strong*, *Tough*, *Good Aim*. |
| **Health** | At 0 you are down. |
| **Conditions** | Temporary effects with a number counting down. |

### Cards and slates are different things

Everything is printed the same size, so two words keep them apart.

- A **card** lives in a deck. It is shuffled, drawn, played and discarded.
- A **slate** lies face up in front of you. It is never shuffled and never drawn.

A slate can still be *spent* — a one-use item is gone after you use it — but it never enters a deck.
The exceptions worth knowing: **Wounds** and **Taint** are cards, and they really are shuffled into
your decks.

---

## 2. Your action cards

```
┌───────────────────────────┐
│ HEAVY SWING               │
│ ▲ Primary:   Strike +1    │
│ ▼ Secondary: Move 1       │
│ ⚡ Reaction:  Parry        │
└───────────────────────────┘
```

- **Primary** — the strong half. Your main action.
- **Secondary** — the weak half. Your second action.
- **Reaction** — what the card does on somebody else's turn.

**You can never use both halves of the same card.** A turn is one card's primary and a *different*
card's secondary.

Any card whose reaction cannot fire is still a **Brace: reduce incoming damage by 1**. That is
deliberately too little to be worth spending a good card on. Its purpose is that no card in your
hand is ever completely dead, and it matters exactly once — the hit that would have killed you, by
one.

### The six verbs

| Verb | What it does |
|---|---|
| **Strike** ⚔ | Attack with an equipped weapon. |
| **Cast** ✦ | Cast a prepared spell. |
| **Defend** 🛡 | Gain Block. |
| **Use** | Use an equipped item. |
| **Move** 👣 | Move that many squares. |
| **Ready** ⇄ | Equip or swap one item. |

---

## 3. A round

1. Everyone draws one fate card for initiative, once per fight. **Highest acts first** — Miss is
   lowest, Critical highest — and ties are redrawn until the order settles. The order then holds for
   the whole fight.
2. The GM draws one intent card per kind of enemy, face down.
3. Each character takes a turn in order.

### Your turn

- Refill your hand to **5 cards**.
- Play **one card for its primary** and **a different card for its secondary**, in either order.
- Both go to your discard pile.
- The rest of your hand stays in front of you, ready to react.

Two attacks in one turn are legal if they come from two different cards — a Strike primary plus a
card that has Strike on its secondary. Those cards are rare, and they are earned by levelling.

---

## 4. Reactions

**Reactions resolve by themselves. You are not asked.** When a trigger happens, the best reaction
your hand can offer fires, that card goes to your discard, and play continues.

There are two triggers:

| Trigger | What fires on it |
|---|---|
| **You are hit** | Parry, Block, Brace, Use |
| **An enemy ends its move next to you** | Sidestep, Counter |

A reaction fires when the hit is **serious** — when it would deal a Wound (5 or more past armour) or
drop you to 0. A scratch is a scratch, and a hand spent on scratches is a hand you do not have when
the real blow lands.

Three things are always true:

- **A reaction never draws fate.** A Parry is your weapon's Defend value, a Brace is 1, a Counter is
  your weapon's Strike value. Flat, every time.
- **A reaction's damage is not itself a trigger.** A Counter hits, and nothing answers it.
- **Reacting is never free.** Every card you react with is one more card off your deck at the next
  refill, and that brings exhaustion closer.

### Turning a card sideways

**A card turned sideways will not react.** That is the whole of the decision, and you take it in
advance, at leisure — not in the half-second after the dice would have landed in another game.

---

## 5. Resolving an action

Always in this order:

1. **Base value** — the item's line for the verb. A Longsword's Strike is 3.
2. **Card modifier** — the bonus printed on the action card. *Strike +1.*
3. **Features** — permanent modifiers. *Strong: +1 on Strike with Heavy items.*
4. **Conditions** — temporary modifiers, on you or on the target.
5. **Fate** — draw one card from your fate deck and apply it.
6. **Their defences** — subtract **armour**, then **Block**. Never below 0.

**Fate is drawn for damage and healing only.** Move, Ready and Defend never draw fate.

**One draw per action, not per target.** An attack that hits several creatures draws once and
applies the same answer to all of them.

### Bonuses do not stack from the same kind of source

Every slate that grants a numeric bonus belongs to one of seven groups: **Body, Training, Tool,
Make, Power, Station, Wonder.** One action takes **at most one bonus from each group**. Muscle and a
tool stack; two kinds of muscle do not.

Whatever supplies the *base* value is exempt, so a weapon and a feature can never lock each other
out.

---

## 6. The fate deck

Twenty cards, yours alone.

| Card | Count | Effect |
|---|---|---|
| **Miss** | 1 | The action does nothing. Shuffle the deck afterwards. |
| −2 | 1 | |
| −1 | 4 | |
| +0 | 8 | |
| +1 | 4 | |
| +2 | 1 | |
| **Critical** | 1 | On an attack, draw from the critical deck. On anything else, double the value. Shuffle afterwards. |

**Advantage** means draw two and take the better; **disadvantage**, draw two and take the worse. Two
sources of advantage still give one.

**Your deck thins as you use it.** A fate deck that has already spent its good cards is a different
deck from a fresh one, and you can see that coming. It reshuffles on a Miss or a Critical.

### The critical deck

A Critical on an attack draws one card from the critical deck — twelve cards, shared by the whole
table, read out face up.

| Face | Copies | What it does |
|---|---|---|
| **Through and Through** | 4 | Double the damage. |
| **Find the Gap** | 2 | **Exposed** — their armour counts 0 until the end of your next turn. Not this hit, and not doubled. |
| **Off the Feet** | 2 | **Off-Balance** — their Block counts 0 until the end of your next turn, and it is an opening. Not this hit, and not doubled. |
| **Driven Down** | 1 | **Halted** — their next turn does not happen. Not doubled. |
| **Stove In** | 1 | Their armour is one point worse until it is repaired. Permanent. Not doubled. |
| **Turn the Edge** | 1 | Their weapon strikes for one less until it is repaired. Permanent. Not doubled. |
| **Both** | 1 | Draw two others and take both. |

A Critical always gets **at least one point** through, however well armoured the target is.

---

## 7. Armour, Block and getting past them

- **Armour** is worn. It subtracts from every hit.
- **Block** is earned by a Defend, and subtracts after armour. How long it lasts depends on how you
  played it:

| Played as | Block lasts |
|---|---|
| **Primary** | Against **every** attack until the start of your next turn |
| **Secondary** | Against the **next** attack only |
| **Reaction** | Against the attack that triggered it |

Blocks from different sources do not stack — **use the highest**, and that source's duration is the
one that applies, so a Defend secondary played behind a Defend primary never shortens the stance you
already had.

Some attacks go **through** armour (*ignores N armour*, or all of it) and some go **round** Block.
They are different things and a card says which: a bodkin finds a gap in plate, and a shield raised
in answer does not care.

**Damaged gear.** Corrode takes points off armour; Blunt takes points off what a weapon strikes for.
Both are permanent until repaired, both stop at 0, and **neither destroys anything** — armour at 0
is still armour and still repairable. Repair is an action: a **Lore check** with the right tools. A
Critical puts back 2, a Success 1, a Partial nothing and the time is gone.

---

## 8. Conditions

A condition is a token with a number — its duration. It remembers who created it, and it runs out at
the **end of that creature's next turn**. So a condition you inflict lasts through your own next
turn, and you can use it.

| Condition | Effect |
|---|---|
| **Dazed** | You can't play a secondary. |
| **Slowed** | All Move values halved, rounding down. |
| **Stunned** | You can't play reactions. |
| **Halted** | Your turn does not happen. |
| **Prone** | Melee Strikes against you have advantage. Standing up costs Move 1. |
| **Grappled** | You can't Move. |
| **Silenced** | You can't Cast. |
| **Disarmed** | You can't Ready, or Strike with the disarmed item. |
| **Heckled** | You draw fate with disadvantage. |
| **Exposed** | Your armour counts 0. Block is untouched. |
| **Off-Balance** | Your Block counts 0, and it is an opening. |
| **Burning N** | N damage at the start of your turn, past armour and Block. Cancels with Wet and Frozen. |
| **Frozen N** | Your Move values are reduced by N. Cancels with Burning. |
| **Poisoned N** | You are Dazed, and take N damage at the start of your turn. N may be 0. |
| **Invisible** | Enemies can't target you. Ends if you Strike or Cast at one. |
| **Compelled** | You must spend your primary attacking whoever compelled you. |
| **Burdened / Overloaded** | See *Carrying*. |
| **Unconscious** | At 0 Health. No turns, no reactions, Prone. |

**Shake Off** spends a condition's duration rather than waiting for it. **Openings** — Wet,
Off-Balance, Marked, Judged — do nothing by themselves; they exist for other cards to key off, and
they cannot be shaken off.

---

## 9. Checks, outside a fight

Draw a hand of **4** skill cards. Each shows one **approach** and a value of 1–3.

| Approach | Covers |
|---|---|
| **Might** ✊ | Climbing, breaking, lifting, intimidating, enduring |
| **Agility** 🌀 | Balance, acrobatics, quick hands, riding, dodging traps |
| **Shadow** 🌑 | Stealth, deception, disguise, pickpocketing, lockpicking |
| **Wits** 👁 | Noticing, searching, reading people, tracking, survival |
| **Lore** 📜 | Knowledge, arcana, religion, history, healing |
| **Presence** 👑 | Persuading, leading, performing, bargaining, calming |

Every deck contains all six, so anyone can try anything. Your Way and background decide which ones
you hold more of, and better.

**To make a check:** the GM sets a difficulty. You play a card of the approach you are using, add
your bonuses, and draw fate.

| Difficulty | Number |
|---|---|
| Easy | 3 |
| Normal | 5 |
| Hard | 7 |
| Heroic | 9 |

| Result | When | Effect |
|---|---|---|
| **Critical** | Critical drawn | You do it, and something extra goes your way. |
| **Success** | Total ≥ difficulty | You do it. |
| **Partial** | 1–4 below | You do it, **but** it costs something. |
| **Fail** | 5 or more below, or a Miss | You don't, **and** the situation changes. |

A Critical comes off the card, so a Critical that still falls short is a success with a bonus — not a
near miss. A Miss is a Fail however high the total was.

**Tools** help the approach they name. An **untrained** user gets at most +1 from a tool however good
it is; training is what unlocks the rest, and training comes from levelling.

---

## 10. Running out

Your action deck is your stamina. You do not run out of spells — you run out of deck.

- **Exhausted**: if you cannot refill to at least **2 cards** because your draw pile is empty, you
  are Exhausted. You may play only **one** card a turn, and you cannot react.
- **Catch Breath**: spend your whole turn — no cards played — to shuffle your discard and move **2
  cards at random** back into your draw pile. You need 2 in the discard or you cannot do it, and you
  do not choose which.

A breath buys you exactly one turn that is not Exhausted. It is a way to keep playing, never a way
to get back on top. The discard always comes back, so what a breath costs is the turn.

### Wounds

**You gain 1 Wound when** you take **5 or more damage from a single hit** (after armour), or when you
drop to **0 Health**.

A Wound is a card. It goes into your action discard and comes back around like any other. When you
draw one it takes a slot in your hand, cannot be played — not even for Brace — and is discarded at
the end of your turn. Wounds stay between fights.

Removing one: a long rest takes off 1; a **Lore check (Normal 5)** with a Healer's Kit takes off 1,
once per patient per day; some magic says so.

### 0 Health

At 0 you are **Unconscious**: you fall Prone, take no turns, cannot react, and gain a Wound. You are
dying until somebody treats you.

---

## 11. Rests

Both need a safe place.

| | Short rest | Long rest |
|---|---|---|
| **Takes** | About an hour | A night |
| **Limit** | Costs a rest token | Once a day |
| **Action deck** | Spent cards return | Spent cards return |
| **Skill deck** | Discard and Spent shuffle back in | Same |
| **Rest tokens** | — | Regain all |
| **Health** | Heal 1 | Heal 5 |
| **Wounds** | — | Remove 1 |

You start with **one rest token**. More come from levelling.

**After a fight**, shuffle your hand and discard back into your action deck. **Spent cards stay
out** — several fights without rest wear you down.

---

## 12. Carrying and equipping

**Only equipped items can be used.** A **Ready** buys one equip or one swap; because an item only
comes off by being replaced, those are the same transaction.

Your carrying limit is **40 kg**, counting everything.

| Load | | Effect |
|---|---|---|
| Up to the limit | **Unburdened** | — |
| 41–60 kg | **Burdened** | Slowed, and disadvantage on Agility and Shadow checks |
| 61–80 kg | **Overloaded** | Burdened, **and 2 random cards are Spent** |
| 81 kg + | — | You cannot pick it up. Make two trips. |

Neither state has a duration — they last until you drop the weight, and dropping things is never an
action.

---

## 13. Levelling up

**The GM says when.** There is no experience to count.

A level-up is a step on one shared graph. Your **frontier** is every node that a node you already
own points at, and you take one of them. Taking it spends the level and puts that node's own
successors on your frontier.

**The node is the reward.** Nothing is offered and nothing is passed over — taking the node *is*
taking the reward. What a node gives is one of:

| Reward | What it does |
|---|---|
| **Action card** | A card added to your deck — the main currency of growing |
| **Training** | A tool type at its full bonus instead of +1, and the tool is issued with it |
| **Item** | A slate, handed over |

A **specialization node** gives you a **title** as well as its reward — what people call you, and
the Tactic that comes with it. You only ever have your deepest title's Tactic.

The decision is **a direction, not a menu**. What you give up is the other directions you could have
gone this level — and a branch you walk past is usually still there next time.

**Except when it is not.** Some nodes belong to an exclusive group: taking one **permanently**
disables every other node in that group, and everything reachable only through them. Swearing to a
god is the clearest case. You will be told before it happens.

---

## Quick reference

| | |
|---|---|
| Hand size | **5** action cards, **4** skill cards |
| Action deck | 12–20 cards |
| Exhausted | Cannot refill to 2 |
| Catch Breath | Whole turn, 2 random cards back, needs 2 in the discard |
| Brace | Reduce damage by 1 — any card, always available |
| Wound | 5+ damage from one hit, after armour; or dropping to 0 |
| Difficulties | Easy 3 · Normal 5 · Hard 7 · Heroic 9 |
| Partial | 1–4 below the difficulty |
| Carry limit | 40 kg |
| Rest tokens | Start with 1 |
| A condition ends | At the end of its creator's next turn |
