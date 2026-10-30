# Card RPG – Core Combat Rules (Draft 0.3)

> Status: third draft. Individual initiative and intent cards (section 3) are new; numbers in
> sections 4, 8 and 9 are balance-tested against the simulator in [../sim/](../sim/).
> Items marked **[OPEN]** still need a decision.
> Out-of-combat play is covered in [skill-rules.md](skill-rules.md).

---

## 1. Components per character

| Component | What it is |
|---|---|
| **Action deck** | 12–20 personal action cards. Defines how the character fights (see section 8). |
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

> **Brace is a floor, not an option.** One point is deliberately too little to be worth a card, so a
> player holding any real reaction will never choose it. Its job is that **no card in your hand is
> ever completely dead** — which is also why nothing can block it (section 10). The one time it is
> the right play is the one that matters: the hit that would otherwise kill you, by exactly one.
> Raising it to 2 would put it in competition with Parry and Block and flatten the choice, so it
> stays at 1.

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

> **Where double attacks come from.** A card with Strike on its *secondary* half is the strongest kind of card in the game: simulation showed one such card shortens fights by a full round. The rule stays open, but these cards are meant to be **earned through leveling**, not handed out in starter decks. Treat Strike-on-secondary as a reward on a Way's tree, the same way a second attack is a milestone in other games. The mechanism is now specified — it is an **action-card benefit on a Way graph node** ([leveling.md](leveling.md) §4) — and the card is written: *Off-Hand Blow*, Strike on the primary and **Strike −1** on the secondary, in the common minor-node pool any Way may draw from ([way-cards.md](way-cards.md) §3.1). The −1 is what keeps it from making a plain Strike obsolete. The starter deck keeps its one double-strike card.

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

Blocks from different sources don't stack. If you have more than one, **use the highest** — and that
source's duration is the one that applies, so a Defend secondary played behind a Defend primary never
shortens the stance you already had.

Two things fall out of the order in section 5 rather than needing their own rule:

- **A Critical is doubled before Block is subtracted**, because fate is step 5 and defences are step
  6. Block is therefore worth proportionally less against a Critical, which is what makes a Critical
  frightening to a defended target.
- **Damage that does not come from an action never meets Block at all** — a Taint card's 1 damage is
  resolved where it is drawn, not through section 5.

### Equipped items and Ready

Only equipped items can be used. There are two kinds of slot, and they work differently.

**Hot slots** hold what you are using. They change during a fight, and **Ready is what pays for the
change**.

| Slot | Count | To put it there | Example |
|---|---|---|---|
| Hands | 2 | 1 Ready | Sword + shield, or a two-handed staff (takes both) |
| Back | 1 | 1 Ready — **but drawing from it is free** | A slung two-hander, a spare blade |
| Belt | 2 | free | Potions, scrolls |
| Spells | your spell slots | **between fights only** | Prepared spells (see below) |

**Your back is a swap you pay for in advance.** Slinging something over your shoulder costs a Ready
like anything else; taking it back off costs nothing. Sling the bow before the fight and it is in
your hands for free in the middle of one.

What you give up is the use of it while it hangs there: **a slung weapon is carried, not held.** It
strikes with nothing, defends with nothing and grants no bonus until it is in your hand. The back
carries one thing.

**The belt is free.** Hanging something on it, or swapping what is on it, costs no Ready — a belt
sits under the hand that is already holding something, and everything on it is the kind of thing you
grab without thinking. That is what a belt is for. Charging a Ready for it only ever meant the
potion you brought was the potion you never drank.

**Worn slots** hold what you are wearing. They change **between fights and never during one** —
nobody swaps rings while being stabbed — so there is nothing for Ready to price.

| Slot | Count | Example |
|---|---|---|
| Body | 1 | Armor |
| Cloak | 1 | A cloak over the armor |
| Head | 1 | Helm |
| Neck | 1 | Amulet |
| Fingers | 2 | Rings |
| Feet | 1 | Boots |

A slot says **where a thing sits on you**, which is why chain mail and a magical cloak coexist
without a special rule. What it *does*, and whether two of them stack, is the **bonus group**
(section 5) — two rings of different groups both apply, two of the same group do not. The two
questions are independent on purpose.

> Worn slots start **empty**, and the usual way to fill one is loot. That is the job: the hot slots
> are where your turn gets decided, the worn slots are where a campaign accumulates.

### What fits where

An item lists the slots it fits, and that list **is** the rule — there is no second rule by item
type. Most things fit one place. Some fit two, and then **you choose when you put it on**, because
where a thing sits changes what it can do:

| Item | Fits | Why it matters |
|---|---|---|
| Dagger | Hands, **Belt** | On your belt it is out of the way and still a Ready from your hand |
| Healing Potion | Belt, **Hands** | Held ready, it is a Use with no Ready to pay first |
| Longsword, Shield, Bow | Hands, **Back** | Slung, it stays in reach without occupying a hand |
| Plate mail | Body | One slot, so it is never asked about — and never goes in a hand |

A two-hander takes **both hands**, but slung over a back or hung on a belt the same weapon is one
object. Two hands is a fact about using it, not about carrying it.

### What a Ready does

**Everything you are not using is in your pack**, and everything in your pack can be reached. There
is no third place to keep things and nothing is out of bounds — what retrieving costs is a card.

**One Ready does one of two things:**

| | Costs |
|---|---|
| Put an item into an **unused** slot | 1 Ready |
| **Change one** equipped item — swap it for another | 1 Ready |

And nothing else. A Ready that would turn over **two** equipped items is not one Ready: drawing a
two-hander while holding a sword *and* a shield means putting one of them away first, and that is
its own Ready.

Two things cost nothing: **the belt**, either way, and **drawing off your back**, because that Ready
was already paid.

This is why the second weapon you bring matters less than the hand you have free to take it in —
and why what you sling before the fight is a real decision.

### Spells and preparation

A spell is a **slate**, like a sword or a potion, and it has a slot of its own. Carrying a spell is
not the same as being able to cast it: **you prepare spells, and only prepared spells can be cast.**

A spell in your book is not the same as a spell in a wand: see *Two kinds of casting* below.

| | |
|---|---|
| **Spell slots** | How many you may prepare, counted in **formula strength**, not in spells. More come from leveling ([leveling.md](leveling.md) §4); a first Way of Mind or Way of Faith node grants **2**. |
| **Strength** | Every spell has one, **1 to 5**, and it **is** the slot cost — a strength-3 formula fills three slots. It is also the power band ([way-cards.md](way-cards.md) §1.4). |
| **When** | **Between fights.** Preparation is not something you change while being shot at. |
| **Unprepared** | Stays in your **spell book**, which is where spells live when they are not in your head. |

This is the caster's version of the choice a fighter makes about what to sling on their back, and it
is made at the same time — before anything starts. A fighter who brought the wrong weapon can draw
another for a Ready. **A caster who prepared the wrong spells has prepared the wrong spells.** That
is the trade: a caster decides in advance and a fighter decides in the moment.

> **[OPEN]** A later spell or feature that re-prepares one spell mid-fight. It is an obvious thing
> for a Way of Mind branch to grant, and it should stay rare enough that the choice above still
> matters.

#### Two kinds of casting

✦ Cast comes from two different places, and they ask for different things.

| | **The item's Cast line** | **A prepared spell** |
|---|---|---|
| Where the magic is | in the object | in your head |
| Examples | Staff of Healing, Fire Wand, a holy symbol, a scroll | whatever you prepared this morning |
| Needs | the item **in hand** — which is just the slot rule | a **free hand**, and speech |
| Limited by | what you are carrying | your spell slots |

A **free hand** means an **empty** one. You gesture with it, and you cannot gesture holding a sword in
one hand and a shield in the other. An implement does not count — a staff in both hands is casting
*its own* magic, not leaving you a hand for yours.

> | In your hands | Item Cast | Prepared spells |
> |---|---|---|
> | Staff of Healing (2) | yes — Heal 3 | **no** |
> | Fire Wand (1) + free | yes — Blast 1 | yes |
> | Sword + shield | — | **no** |
> | Sword + free hand | — | yes |

So the staff and the wand are not two spellings of the same thing. **The staff is a better item and a
worse hand**: it casts reliably without preparing anything, and it costs you your whole repertoire
while you hold it. The wand leaves a hand open. And a shield costs a caster nothing until they also
want a weapon — that is the decision the rule exists to create.

**Speech** is what **Silenced** already takes away (section 7). It blocks ✦ Cast wherever the magic
came from, because a wand has a command word too; gags, water and held breath hang off the same hook.

### Carrying

Slots govern what you can **use**. Weight governs what you can **haul**.

Your **limit** is **40 kg**, counting everything on you: equipped items, belt, pack and loot.
**Features can raise it** — like *Tough* and *Quick* these are flat traits rather than bonuses to an
action, so they are **not** bonus-grouped (section 5).

| Load | | Effect |
|---|---|---|
| Up to your limit | **Unburdened** | — |
| Over it, up to half again (41–60 kg) | **Burdened** | **Slowed**, and disadvantage on 🌀 Agility and 🌑 Shadow checks |
| Over half again, up to double (61–80 kg) | **Overloaded** | Burdened, **and 2 random cards are Spent** |
| Over double (81 kg +) | — | You can't pick it up. Make two trips. |

Neither state has a duration: both last until you drop enough weight. You can shed a load at any
time, including as a free part of your turn — dropping things is never an action.

**Burdened** lands on moving and sneaking, because laden you are slow, noisy and clumsy. Might is
untouched, since a load doesn't make you weak, and Strike is untouched, so a hauling party is never
helpless — just easy to catch.

**Overloaded** costs you stamina, which in this game means deck. Shuffle your action deck, turn up
**2 cards at random** and set them aside as **Spent**; they return, shuffled back into your draw
pile, when you are no longer Overloaded, or on your next rest.

- **Spent, not discarded.** A discarded card comes straight back on your next Catch Breath. Spent
  cards stay out, so a heavy load genuinely shortens your deck and brings exhaustion forward —
  roughly a round earlier in testing.
- **Random, not chosen.** A pack doesn't care which of your tricks it costs you. Choosing would let
  you shed your dead cards, which is a reward for being overloaded rather than a price — and it
  would turn every pickup into a deck-pruning decision.
- **Where they come from.** Normally you pick up a load between fights, when your deck is whole. If
  you become Overloaded during a fight, take the cards from your **draw pile**; if that is empty,
  from your hand.
- Two is a measured number, not a guess. In simulation two random cards off a 16-card deck cost
  **7.5 points of win rate in a hard fight and 2.5 in a moderate one**; three starts taking the
  fight away. That difficulty-scaling is the point — hauling loot through a quiet dungeon is nearly free,
  hauling it into a real fight is a coin flip. See
  [../sim/analysis-2026-10-27.md](../sim/analysis-2026-10-27.md).

### Weights

- Item slates give a weight in **whole kilograms**. Anything under a kilo counts as **0** on its own —
  bundle them and the bundle gets a weight: a quiver, a roll of picks, a purse.
- **Coins:** 100 gold weighs 1 kg. Pocket money is free; a chest of treasure is a problem.
- **A person** weighs 70–90 kg. Carrying a fallen ally therefore means dropping your own kit first,
  and still leaves you Burdened. That is intended: getting someone out should cost something.

Weight and the **Heavy** / **Light** tags measure different things and shouldn't be confused:

| | What it measures | Read by |
|---|---|---|
| **Weight (kg)** | What the thing costs to haul | The carry limit |
| **Heavy / Light tags** | How the thing handles when wielded | Features like *Strong* |

A Heavy weapon usually weighs more, but the tag is about swinging it, not carrying it.

> A full kit of adventuring gear comes to roughly 10 kg, so 40 kg is not a constraint on how you
> equip a character. It is a constraint on **loot**: what you can carry out of the dungeon, how much
> ore the caravan takes, whether you can drag an unconscious ally. Set the weights of treasure and
> cargo with that in mind — they are what the rule is for.

**Ready** is a special action. You can only Ready by playing a card half that shows the **Ready icon**. The icon can be on either the primary or the secondary half.

Ready lets you:
- equip one item from your pack into an empty slot, **or**
- swap one equipped item with one from your pack.

**Outside combat, equipping is free.** Rearrange your slots as often as you like between fights, and
start a combat with whatever you were carrying. Ready exists because doing it **under pressure** costs
you a card half — not because buckling on a shield is hard.

Inside a **challenge** it is not free: swapping gear takes your action for the round like anything
else, and digging something out of the bottom of your pack may cost more than that
([skill-rules.md](skill-rules.md) §2).
When you build a deck, include enough Ready cards for the character's style. A weapon-swapper needs more of them than a sword-and-board fighter.

---

### Active abilities and recharge

Most of what a slate gives you is **passive**: it is simply true. *Tough* raises your max Health,
*Strong* adds a point of damage with Heavy items, a Longsword strikes for 3. Nothing to track, and
nothing to remember to use.

An **active** ability is one you choose to use, and it doesn't work every time.

> **Drain** — using the ability turns the slate **sideways**. It gives nothing more until its
> **recharge** comes round. Every slate with an active ability prints its recharge, next to the
> ⟳ **Charging** icon.

A recharge is either a **count of turns** or a **boundary**:

| ⟳ | Comes back |
|---|---|
| **1** | At the start of your next turn |
| **2, 3, …** | After that many of your turns |
| **Combat** | When the combat ends |
| **Short rest** | On a short rest — and so costs a rest token |
| **Long rest** | On a long rest |

**Counting turns** works exactly like a condition's duration: the number ticks down by 1 at the start
of each of **your own** turns, and at 0 the slate turns upright again. It runs in combat rounds and in
challenge rounds alike (see [skill-rules.md](skill-rules.md) §3), since both are ordered sequences of
turns.

**Outside a fight or a challenge, a turn-counted ability is simply ready.** Nobody is counting turns
while the party walks down a corridor, and a two-turn cooldown was never meant to budget a day. That
is the division: **turns pace a fight, rests budget a day.** If an ability needs limiting outside
combat, give it a rest recharge instead.

- **Turn the slate sideways; don't flip it.** A slate's back carries its description, so flipping
  already means "let me read this", not "I used it".
- **One active ability per slate**, or a sideways slate is ambiguous. If you want two, that's two
  slates.
- **Consumables don't recharge at all.** A Healing Potion is gone when you drink it — the far end of
  the same scale.

Short counts are for the rhythm of a fight — a weapon trick you can lean on every second or third
turn. The three boundaries are for things that should feel like a decision: once this fight, once
between rests, once a day.

#### Passive or active is the main dial for pricing a slate

| | Passive | Active |
|---|---|---|
| Size of effect | Small | Can be large |
| Tracking | None | A sideways slate |
| Examples | *Tough*, *Quick*, *Strong*, *Good Aim*, *Arcane Focus* | *Steady*, *Drilled*, *Faithful* |

**A big effect must be active.** If a slate would swing a fight on its own, give it a recharge. If
it's worth a point here and there, leave it passive and let the player forget it exists.

#### Recharge and bonus groups are different dials

A slate can carry both, and they limit different things:

| | Limits |
|---|---|
| **Bonus group** (section 5) | How many bonuses **stack** on one action |
| **Recharge** (here) | How **often** an ability works |

---

## 5. Resolving an action

Always in this order:

1. **Base value** – the item's line for the verb (e.g. Longsword Strike: 3 damage).
2. **Card modifier** – any bonus on the action card (e.g. *Strike +1*).
3. **Features** – permanent modifiers (e.g. Strong: +1 on Strike with *Heavy* items).
4. **Conditions** – temporary modifiers on you or the target.
5. **Fate** – draw one card from your fate deck and apply it.
6. **Target's defenses** – subtract armor, then Block (section 4). The result can't go below 0.

### Bonus groups

Bonuses don't stack from the same kind of source. Every slate that grants a **numeric bonus** belongs
to exactly one of seven groups, shown as a coloured border with a number (see
[../foundry/card-layout.md](../foundry/card-layout.md)).

> **One action or check may take at most one bonus from each group.**

| # | Group | Where the bonus comes from |
|---|---|---|
| 1 | **Body** | Your flesh |
| 2 | **Training** | Your practice |
| 3 | **Tool** | The implement in your hands, doing its job |
| 4 | **Make** | How well that thing was made or enchanted |
| 5 | **Power** | A force you channel |
| 6 | **Station** | How the world sees you |
| 7 | **Wonder** | Nothing else — it is singular |

- Only **bonus** contributions are grouped. Whatever supplies the **base** value is exempt, so a
  weapon and a feature can never lock each other out of being used.
- Features that grant advantage or a flat trait (*Alert*, *Tough*, *Quick*) aren't grouped at all.
- Action cards and skill cards are never grouped.
- **Tool is what a thing does; Make is how good it is.** A lantern that gives Wits +1 in the dark is
  a Tool. A lantern of everburning silver giving a further +1 is Make.
- **Wonder is for the extraordinary, not the awkward.** No rule guards it, because rarity and the
  group cap already do: only one Wonder bonus applies to any action, however many you own. Classify
  carefully for the player's sake rather than for balance — two Wonder slates are worth less than two
  differently-grouped ones, since only one can ever contribute.

This is the same principle the fate deck already uses for advantage — two sources of advantage still
give one — applied to numbers. Bonuses have to come from **different kinds** of help: muscle and a
tool, not two kinds of muscle.

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
- **The reshuffle on Miss and Critical is load-bearing.** It means the order of a fate deck is never
  reliable for long, which is what keeps anything that *looks at or rearranges* a fate deck — a
  divination, a feature, a blessing — from banking two good draws. You can aim one.
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

### NPC fate decks

**Each NPC type has its own fate deck**, the same 20 cards. One for the goblins, one for the wolves,
one for the ogre. Every NPC of that type draws from it.

This matches how everything else about an NPC works — its action deck, its intent card, its tactics
and its gear are all per type — and it is what makes **Blessed** and **Cursed** usable against
enemies. A Cursed goblin shuffles a temporary Miss into the *goblin* deck; it has no effect on the
ogre standing beside it.

**Precision scales with importance**, which is the happy consequence. Curse one goblin in a warband
and the hex spreads to its kin, because they share a deck — a reasonable fiction, and cheap. Curse a
boss and it lands on the boss alone, because an elite is its own type with its own deck. The enemies
worth cursing are the ones where the curse is exact.

A typical fight has two to four types, so the GM handles two to four decks — the same number of piles
as the NPC action decks already in front of them.

### Reading a fate deck

Anything that lets a character look into a fate deck uses one keyword, the way enemy intent uses
*Foresee*:

> **Read N** — Look at the top **N** cards of one fate deck and put them back in **any order**.

| | |
|---|---|
| **Whose deck** | Any one fate deck in the fight — your own, a companion's, or an NPC *type*'s. A card or feature may narrow that, and divination does: a Divinator may **never** read their own ([specializations.md](specializations.md)). |
| **Read 1** | Looking at one card and putting it back is just looking, so the cheap version needs no keyword of its own. |
| **Who knows** | You do. Saying what you saw is a decision at the table, not a rule — but the order they go back in is **yours** either way. |
| **Short deck** | Fewer than N cards left: read what is there. |
| **No icon** | A named effect, like *Foresee*, *Taunt* and *Stabilize*. |

**The reshuffle is the fence.** A Miss or a Critical reshuffles the deck, so an order you arranged
survives only until the first swing card is drawn. You can aim **one** good draw and never bank two,
and no feature needs to say so because §6 already did.

Two consequences worth knowing before putting Read on a card:

- **Advantage draws two and uses the better**, so a Read of 2 or more sets up an advantage draw as
  well as a plain one. Against disadvantage it works in reverse — put the two worst on top of an
  enemy's deck and their advantage is spent on nothing.
- **Precision scales with importance**, the same way it does for Blessed and Cursed. Reading a goblin
  warband's deck aims one draw for whichever goblin swings next; reading a boss's deck aims it at the
  boss. The enemies worth reading are the ones where the reading is exact.

Like Foresee, Read is **worth a different amount every round**: worth most when a hard-hitting enemy
is about to act or an ally is about to spend a Spent card, and worth nothing when nobody with a stake
in it draws before the deck reshuffles.

---

## 7. Conditions

Conditions are tokens with a number (duration). Every condition remembers **who created it**.

**Three of them carry a second number.** **Burning**, **Poisoned** and **Frozen** have an
**intensity** as well as a duration, printed in front of it — *Burning 3 (2)* is three damage a turn
for two turns. **Duration says how long; intensity says how hard.** Nothing else on the list has one,
because nothing else has a reading between a candle and a dragon, and *Dazed 3* would mean nothing
([conditions.md](conditions.md) §2). Two rules cover the second number and there are no others:

- **A Partial shortens a burn; it does not cool one.** Only the duration halves.
- **A second application takes the max of each number** — the longer duration and the fiercer
  intensity, independently. A candle thrown after a dragon leaves the dragon's fire burning.

> **Poisoned is the one whose scale starts at 0.** *Poisoned 0* is Dazed and nothing else — a sickness
> that slows your hands without killing you — and every rung above it adds that many damage a turn on
> top. **Poisoned N is Burning N plus Dazed**, which is why it costs one rung more than Burning does
> for the same number, and why the bottom rung exists at all: Burning has nothing to be at 0.

> **The complete list is [conditions.md](conditions.md)** — all nineteen with their engine keys,
> their flags, what the system actually enforces and what in the content applies each one. This
> section is the **rule**; that document is the **reference**, and the validator keeps it in step with
> the engine. Effects are repeated here because a rule you have to follow a link for is a rule nobody
> reads.

- The duration ticks down by 1 at the **start of the creator's turn**. At 0 the condition is removed.
- So *Dazed (1)* from a goblin lasts until the start of that goblin's next turn. The victim always suffers it for exactly one of their own turns, wherever the creator sits in the initiative order — if the goblin acts before them the condition bites this round, if it acts after them it bites next round, but it always costs exactly one turn.
- Conditions you put on yourself (e.g. Invisible from a Smoke Bomb) tick at the start of your own turn.
- Conditions with no creator (fire, poison gas, a trap) count the affected character as the creator.
- If the creator leaves combat, its conditions tick at the start of the **affected** character's turn instead, so they still last exactly one of the victim's turns.

### Putting a condition on someone

A condition **printed on an action** says three things: which condition, for how long, and what
resists it.

```
✦ Cast · 👥 Grappled (2) · resist ✊ 5
```

- **If the condition rides on an attack that connected, it lands with it.** No separate check: the
  goblin's *Dirty Trick* is a Strike that dazes, the Strike already drew fate, and asking for a second
  draw would slow the turn down to say the same thing twice.
- **If the condition *is* the action, the target makes a saving throw** — their passive score in the
  named approach, plus a fate card, against the printed difficulty
  ([skill-rules.md](skill-rules.md) §2). That is the whole resolution; a spell whose only purpose is
  the condition is exactly the moment a save is for.

| Result | What lands |
|---|---|
| **Success** | nothing |
| **Partial** | **half the duration, rounded down.** At 0 it does not land. |
| **Fail** | the full condition |
| **Critical** / **Miss** | as the results table: a Miss is a fail, a Critical a clean success |

Halving on a Partial means a short condition is shrugged off and a long one still bites, with nothing
extra to print. An action may **name a lesser condition instead** if that reads better — *Grappled (2),
or Slowed (1) on a partial.*

**Which approach resists** is the author's choice and should follow what the thing actually does:

| | Resists |
|---|---|
| ✊ **Might** | being held, moved or worn down — Grappled, Burning |
| 🌀 **Agility** | anything you could get out of the way of — Prone, areas |
| 👁 **Wits** | being fooled or caught out |
| 👑 **Presence** | being cowed or compelled — **Compelled** |
| 📜 **Lore** | magic you understand well enough to shed |
| 🌑 **Shadow** | not being the one it finds |

**Unconscious is never applied this way.** It means 0 Health and nothing else (section 8).

> **There is no "hold person".** Nothing in the list below takes a whole turn away — Dazed costs you a
> secondary, Stunned your reactions, Grappled your feet. All three at once is as held as this game
> gets, and you still have a primary. That is deliberate: a turn where you do nothing is the dullest
> thing a fight can hand you.

> **Frozen at a value above your Move is not an exception to this.** You cannot cross the room, and
> you still draw a hand, play a primary and a secondary and keep every reaction — a *Move 2, then
> Strike* primary still gets the Strike. That is also what separates it from **Grappled**, which
> blocks the Move half outright.

> **Which leaves magic a problem, and the answer is the one rule worth remembering here.** Sleep,
> paralysis, petrifaction and *hold person* are what spells classically do, and all four are turn
> removal, so none of them can exist. **A fighter's conditions take away what you may *do*; a
> caster's take away what you may *choose*.** Dazed subtracts a half and Grappled subtracts your
> feet, but **Compelled** subtracts nothing at all — you draw your cards, play a primary and a
> secondary, keep your reactions, and simply do not pick the target. The turn is full and the
> decision is gone, which is both unmistakably magic and the only shape §7 permits.

| Condition | Effect |
|---|---|
| **Dazed** | You can't play a secondary. |
| **Slowed** | All Move values are halved (round down). With **Frozen** as well: **halve first, then reduce**, floor 0. |
| **Stunned** | You can't play reactions. |
| **Invisible** | Enemies can't target you. Ends early if you Strike or Cast at an enemy. |
| **Burning** | **Burning N:** take N damage at the start of your turn. It meets neither armor nor Block. **Fire cancels water in either state:** neither Burning nor **Wet**, and neither Burning nor **Frozen**, lands on a target already carrying the other — whichever arrives second ends the first without itself landing. A wet target steams; a frozen one thaws. |
| **Frozen** | **Frozen N:** all Move values are **reduced by N**, to a minimum of 0. You still play both halves and keep your reactions. Cancels with Burning. |
| **Poisoned** | **Poisoned N:** you are **Dazed** — no secondary — **and** take N damage at the start of your turn, past armor and Block. **N may be 0**, which is the sickness with nothing behind it. Water does nothing for it. |
| **Prone** | Melee Strikes against you have advantage. Standing up costs Move 1. |
| **Unconscious** | At 0 Health. No turns, no reactions, Prone. Dying until treated (section 8). |
| **Grappled** | Blocks 👣 Move (see section 10). |
| **Silenced** | Blocks ✦ Cast — you cannot speak, and casting needs speech (section 4). |
| **Disarmed** | Blocks ⇄ Ready, and ⚔ with the disarmed item. You cannot simply draw another: Ready is the verb it takes away. |
| **Compelled** | You must spend your **primary** attacking whoever compelled you. Everything else about your turn is yours. |
| **Burdened** | Over your carry limit: Slowed, and disadvantage on 🌀 Agility and 🌑 Shadow checks. No duration – it lasts until you drop weight (section 4). |
| **Overloaded** | Over half again your limit: Burdened, and 2 random cards are Spent. No duration (section 4). |
| **Blessed / Cursed** | See fate deck (no duration – they last until the card is drawn). |

### Shake Off

A condition's duration can run longer than a turn, and until now nothing in the game could shorten
one. **Shake Off N** takes **N off one condition's duration.** At 0 it ends.

> **A dispel pays in the number the condition already has.** It does not remove conditions, it
> *spends* their duration — so a **(1)** is shrugged away by the cheapest card and a **(3)** takes
> three efforts or one real spell. No card is ever a hard counter to a big condition, which is what
> keeps conditions worth applying at all.

That matters more than it sounds. **Conditions are where the Ways live** — half the content in
[way-cards.md](way-cards.md) applies one — so a cheap *remove any condition* would be an attack on
half the game, and every condition printed after it would have to be priced against the assumption
that somebody holds the answer. Spending duration has no such effect: it is a trade of a half for a
turn, which is roughly even, and it stays even however strong the condition is.

**What may be shaken off, and what may not:**

> **You can shake off what is being *done* to you. You cannot shake off what is simply *true* of
> you.**

| | Shake Off |
|---|---|
| the eleven timed **subtractions** — Dazed, Slowed, Stunned, Prone, Grappled, Silenced, Disarmed, Burning, Frozen, Compelled, Invisible | **yes** |
| the four **openings** — Wet, Off-Balance, Marked, Judged | **no.** Nothing is being done to you; you are simply wet. An opening is outside this machinery the same way it is outside saving throws |
| **Blessed**, **Cursed** | **no.** The card is in a deck, not on you |
| **Burdened**, **Overloaded** | **no.** Drop weight; a spell cannot argue with arithmetic |
| **Unconscious** | **no.** That is Health (§8) |

Those four exclusions are one rule, not four: everything on the *no* side has **no duration to
spend**, which is a flag the condition already carried before this keyword existed.

**Shake Off never resists and never rolls.** The duration simply goes down. A dispel that could fail
is a card you played for nothing, and the game has enough of those.

**Shedding is a decision, so the player chooses which condition** — a character carrying Dazed (1)
and Grappled (2) picks, and picking is the interesting part.

> **A dispel belongs on a reaction, a prepared spell or a feature — not on an ordinary card's
> secondary.** Simulation puts a Shake Off 1 bought with a card slot at **−2.1 points of win rate**,
> played **0.22 times a fight at best**: one copy in sixteen is in your hand 31% of turns, and it has
> to be there on a turn the condition is also on you
> ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md)). The half a Shake Off costs is
> cheap; the **card** is not.

#### Lift

**Shake Off spends a duration. Lift removes what has no duration to spend.**

**Blessed** and **Cursed** have no clock — they last until the card they put in your fate deck is
drawn — so nothing could take them off. **Lift** does: the marker comes off the character *and* the
temporary card comes out of the deck, because removing only the marker would leave a Miss in there
that nothing would ever account for.

> **A curse lasts about a fight, and could easily last three.** The temporary card is one of three
> cards that reshuffle the deck when drawn, so it is the one to come up about a third of the time —
> roughly **sixteen fate draws** on average, with a long tail. Lifting a curse is the oldest job a
> priest has, and until Lift existed the rules had no way to do it.

Lift reaches **only** the two: an opening has nothing being done to you, the encumbrance pair answer
to arithmetic, and Unconscious answers to Health. When **Cleansing** is built, Taint is the third
thing Lift should reach.

#### The five ways out, and there are no others

Every condition in the game leaves by exactly one of these. The list is **exhaustive**, and the
validator checks that it stays so — a condition in no bucket is a condition whose removal nobody
decided:

| How it ends | How many | Which |
|---|---|---|
| **Shake Off** — spend its duration | **12** | the timed subtractions |
| **Lift** — it has no duration to spend | **2** | Blessed, Cursed |
| **Drop weight** — free, any time, never an action (§4) | **2** | Burdened, Overloaded |
| **The clock, by design** | **4** | the four openings |
| **Health above 0** | **1** | Unconscious |

> **So no: not everything can be dispelled, and that is the design rather than a gap.** Fourteen of
> the twenty-one come off to a card. The other seven each answer to something that is not a card, and
> the openings are the only ones where *nothing* will hurry them — deliberately, because an opening
> is cheap to set and worth little on its own, and letting an enemy spend one secondary to undo the
> party's whole combo would make combos unplayable.

**Marked and Judged are the purest case of that**, and the fiction says why: they are **calls**, not
states (§7). You can wash off water and you can regain your footing, but you cannot wash off
somebody's opinion of you — you can only wait for them to stop saying it.

#### A dispel must not sit on the half the condition takes

Four conditions defeat the dispel that would answer them, and not by accident — it falls out of what
each one does:

| Condition | Defeats | Because |
|---|---|---|
| **Invisible** | any dispel that needs a **target** | being untargetable *is* the condition |
| **Silenced** | your own ✦ Cast dispel | casting needs speech |
| **Compelled** | a dispel on your **primary** | your primary is already spoken for |
| **Dazed** | a dispel on your **secondary** | you have no secondary |
| **Disarmed** | **picking your weapon back up** | it blocks ⇄ Ready, which is the verb that would undo it |

So:

> **You cannot reliably dispel yourself.** The reliable answers are other people's cards — and the
> two conditions that beat *every* self-dispel, Invisible and Silenced, can only be answered by
> somebody who is not suffering them.

That is the same shape as openings (§7): the game's answer to conditions is your allies. It also
means **Invisible needs an area**, not a target, because there is no other way to reach it — see
[way-cards.md](way-cards.md) §3.6, where that constraint writes the card.

### Openings

Every condition above takes something away. These four take nothing:

| Opening | Effect |
|---|---|
| **Wet** | Nothing by itself. |
| **Off-Balance** | Nothing by itself. |
| **Marked** | Nothing by itself. |
| **Judged** | Nothing by itself. |

An **opening** is a condition that exists to be **read by another card**. A mage's *Rain* leaves a
goblin Wet; Wet does nothing at all; and then somebody's *Lightning* hits a Wet goblin harder than a
dry one. That is the whole mechanic, and these four rules are what make it work.

**1. An opening carries no rules of its own. Every combo is printed on the card that reads it.**
The table above is the entire text of all four openings. *Lightning* says what *Lightning* does to a
Wet target, and nothing else in the book mentions the pair. So a new card adds **one** combo and
changes nothing else, and a new opening adds none at all. This is the rule that stops the system
growing into an interaction table, which is how combo systems usually die.

**2. An opening is never resisted.**
There is nothing to save against — it does nothing. The saving throw happens on the **payoff**,
where the real effect is. So the setup always works, and the uncertainty sits where uncertainty
belongs. It is also why a setup is allowed to be cheap.

**3. An opening never gates a primary. It only sharpens one.**
No primary half reads *"only against a Wet target."* A payoff does its job against anyone and does it
**better** against an opening — more damage, advantage, or a harder saving throw for a condition it
was already trying for. A primary that does nothing without its partner is a card you hold all fight
waiting for a draw that never comes, and in a game played from a shuffled deck that is the one
mistake a combo must not make.

**A secondary may be situational**, because a card is dead only when *both* halves are. *Strike −1
against a Prone or Grappled target* is a fine secondary behind an ordinary Strike: worth having when
it applies, and costing nothing but the Move 1 it replaced when it does not. That asymmetry is the
same one setters rely on — the secondary is the cheap space on a card, in both directions.

**4. An opening is not used up. The duration is the window, and the window is the whole round.**
Conditions tick at the start of the **creator's** turn, so an opening you lay down on your turn lasts
through everybody else's and expires when you come round again. **One setup, one round, the whole
party.** The mage's rain is the archer's rain.

> **Openings are the only place in these rules where two players' cards combine.** Fights are
> otherwise played side by side: a Tactician's call, a Bodyguard stepping in, and little else. An
> opening is a thing one character does to make another character's turn better, and it costs the
> first character almost nothing — which is what makes it get done.

**They are a closed list of four, one per Way**, because a player has to be able to hold in their
head which ones their own cards read:

| Opening | The Way that makes it most easily | Read best by |
|---|---|---|
| **Wet** | Mind — Elemental magic | lightning and cold |
| **Off-Balance** | Strength | knockdowns, grapples, follow-up blows |
| **Marked** | Shade | ranged and precise attacks |
| **Judged** | Faith | that god's miracles — and, usually, any ally's attack |

**Any card may read any opening**, whatever its Way. The Ways differ only in which they *make*
easily, and that asymmetry is the point: the combo you want is usually the one somebody else sets up
for you.

**Setters belong on secondary halves.** A turn is a primary and a secondary, and most secondaries are
*Move 1* — the cheapest space on a card. An opening set from there costs you a step you were not
taking. Put it on a primary instead and it competes with a Strike, which means it never gets played.

**An opening is not always good.** Water and fire cancel, so a Wet enemy is a *worse* target for
fire, not a better one — one application of flame goes into steam and the water with it. There is no
autopilot in which laying down an opening is simply correct, and that is deliberate.

> Note where that rule is written: on **Burning**, in the table above, not on Wet. Wet's entry is
> still *nothing by itself*, which is rule 1 holding even at the one place the rules bend — the
> interaction lives on the thing that reads the opening, exactly as it does for a card.

> **Enemies use openings too, by the same rules.** A goblin shaman's rain and a goblin archer's
> shock are the same two cards, and the monster side needs no special case.

---

## 8. Exhaustion, lingering damage and rests

Your action deck is your stamina.

- **Exhausted**: if you can't refill to at least **2 cards** because your draw pile is empty, you are Exhausted. You can only play **one** card per turn (primary *or* secondary), and you can't react.
- **Catch Breath**: you may spend your whole turn (no cards played) to catch your breath:
  1. Shuffle your discard pile.
  2. Move **2 cards, at random**, into your draw pile.
  3. Draw up to hand size as normal next round.

  **You need 2 in the discard, or you can't do it.** The recovery is all or nothing — a one-card
  discard does not buy a whole turn for one card.

  **Two is the Exhausted line.** You are Exhausted when you can't refill to 2, so a breath buys you
  exactly one turn that is not Exhausted, and not one card more. It is a way to keep playing, never
  a way to get back on top: you give up a turn to have a normal one next round.

  **The discard always comes back.** Breathing takes nothing out of your deck permanently; what it
  costs is the turn. Breathe often enough and every discarded card returns, which is what makes the
  discard a cycle rather than a drain.

  **The recovery is random.** Choosing would let you fish your best card back every time you stopped
  for breath, which turns a recovery into a tutor.

You may Catch Breath at any time on your turn, even before you are Exhausted — but there is rarely a
reason to. Two cards is two cards whenever you take them, and a turn spent breathing while you still
have a hand is a turn the enemy gets for free.

### What a fight actually costs you

The deck is a closed loop. Nothing leaks out of it by itself — **what leaves it, you chose to
spend**:

- **Spent** — a card printed *Spent* goes to your **Spent pile** instead of your discard when you
  play it. It does not come back this fight. These are the once-a-fight cards: the big heal, the
  spell that ends an encounter, the trick that only works because nobody saw it coming. Spending one
  is a decision about the whole fight, not about this turn.
- **Strain N** — printed on a half, and paid as part of playing it: **discard N other cards from
  your hand, your choice**. They go to the discard like anything else, so Catch Breath gets them
  back; what Strain costs you is *this round*, not the fight. If you can't pay it in full, you can't
  play the half. A powerful spell that strains 2 is asking for a third of your hand.
- **Overloaded** — 2 random cards Spent while the load is on your back (section 7). The one leak you
  did not choose, and the reason weight is a real decision.

So a long fight wears you down two ways, and neither is a tax on breathing. You burn your own good
cards to stay ahead, and the **Wounds and Taint** you take shuffle into the same cycle and keep
coming back (see *Lingering damage* below) — the deck does not get smaller, it gets worse.

- **Spent** cards stay out until your next **short or long rest**, even after the combat ends (see
  *Rests* below).

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

- **You gain Taint** from sources with the **Tainting** keyword: corrupted monsters, disease, cursed places, dark magic. The source says how much, and which deck: the **action deck** for the body (disease, rot, bodily corruption) or the **skill deck** for the mind (dark magic, horrors). The two have different card faces (see [icons.md](icons.md)), so you can see at a glance what is wrong with you.
- **Poison is not Taint.** It is the **Poisoned** condition (§7), which runs out when its duration
  does. The line between them is the only one that matters here:

  > **Taint outlives the fight. A condition does not.** A venom is a condition; a plague is Taint.

  So a poison that is still with you next week was never a poison — it is a **disease**, and that is
  what body Taint is for.
- The **fast/slow dial** still belongs to Taint, because corruption has the same two speeds: **slow**
  puts the card in your **discard**, where it comes round at a moment nobody chose, and **fast** puts
  it straight into your **hand**, where it resolves at once for 1 past armor and a hand one card
  short. A curse that strikes you down in the temple and a rot that takes a month are the same card
  in a different pile.
- Taint goes into your discard pile, just like Wounds.
- **When drawn:** resolve it at once: take 1 damage (ignores armor) and discard it. You don't draw a replacement, so your hand is one card short.
- **Taint survives rests.** Only these remove it:
  - a **cure**: priest magic, a rare potion or a special item;
  - **Cleansing**: a downtime challenge (Lore, Progress 4) with a healer or a temple.
- **Bound Taint** is the exception: Taint an **obligation** put in your deck is not a sickness and
  neither a cure nor Cleansing lifts it. The obligation names the one thing that does, and the price
  is whatever the Taint bought — a necromancer's formula is forgotten along with the hole it left
  ([leveling.md](leveling.md) §4). Bound Taint counts toward Afflicted like any other.
- **Afflicted:** while you have **3 or more Taint** in your decks, you are Afflicted. Your max Health is −3, and the source adds its own effect (e.g. a sickness or mutation). It ends when you're below 3 Taint again.

**[OPEN]** A list of afflictions per Taint source. Waits for world creation.

#### Acid, and the only damage that costs you gear

**Corrode N** takes **N off the target's armor**, and it does not come back on a rest.

Acid needs no condition of its own. What acid does to *you* is already written — **Burning** is the
right mechanic and even the right fiction, because water ends it and washing is how you treat an acid
burn (§7). What acid does that nothing else in the game does is eat your **equipment**:

> **Corrode is the only effect that spends gear.** [leveling.md](leveling.md) §5a.1 lists *"gear you
> can lose — a mount, a cannon, a shield: ordinary without it, and the GM can take it"* as a
> resource a specialization may be priced in. Until now nothing in the rules could actually take any.

- It eats the **armour itself**, not your armor score, so the loss follows the armour when it comes
  off and a borrowed breastplate is only as good as its last fight.
- **Repair** is a downtime matter: a smith and coin, or a Lore check with the right tools. Printed
  armor says what the item *is*; corrosion is tracked against it, so a repair is a reset rather than
  a memory test.
- **Armor behaves like a cliff edge** — a point of it is worth far more against four goblins with
  Strike 3 than against one ogre — so Corrode 1 is already a strong effect and **Corrode 2 belongs to
  a monster.**

> **Why gear and not Health.** Everything else in this section takes something a rest gives back, or
> a card out of a deck. Acid takes a *decision you made before the fight*, which is the one kind of
> loss the rules had no way to inflict — and it is why an acid monster changes how a party packs
> rather than how it fights.

#### Deck size and pruning

> **Your action deck holds 12 to 20 cards.** Feature slates can raise the maximum.

Wound and Taint cards **don't count** toward deck size limits, and you **can't** prune them by leveling or training. They have to be healed or cured. That matters more with a cap: a wounded character is never locked out of adding a card.

A feature that raises the maximum works like one that raises your carry allowance — a flat trait, so
it is **not** bonus-grouped (section 5).

**A bigger deck is not automatically better**, which is what makes such a feature interesting rather
than pure upside. More cards means more stamina before exhaustion, and your best cards come up less
often. The cap is only worth raising once you *have* twenty cards worth playing, so it is naturally a
later pick: at low level the extra slots would be filler, and filler is what dilutes a deck.

Because Catch Breath no longer lets you choose what to set aside, **nothing removes a dead card from
your deck during play**. Deliberate pruning — at level up, or through training in downtime — is the
only way to get rid of one. That makes pruning a real decision rather than a free upgrade, because
what matters is **fit, not size**. Simulation puts a 12-card deck pruned *well for the fight* level
with a full 16-card deck (63% against 65% in a hard fight), and a 12-card deck pruned *badly* at 45%.
A pruned deck draws its best cards more often and runs dry sooner, the same trade the skill deck
already describes ([skill-rules.md](skill-rules.md) §8) — but the risk is cutting the wrong card, not
cutting cards at all.

The starter deck is 16 for that reason: pruning well takes knowing what you will face, which a new
character doesn't.

Growing and pruning are both **benefits on a Way graph node** ([leveling.md](leveling.md) §4): a
card adds one, a prune removes one, a deck-cap benefit raises the ceiling, and a node may bundle a
card *with* a prune so a deck keeps its shape instead of drifting upward every level. What waits on
the Way graphs is which nodes offer what, not the rule.

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

- **Rest tokens:** each character has a limited number, starting at **1**. More are gained through **leveling**, as a benefit on a Way graph node ([leveling.md](leveling.md) §4).
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
| **Tainting X** | On hit: the target gains X Taint — disease or corruption (section 8). | Avoid its hits, carry a cure. |
| **Venomous X** | On hit: **Poisoned X** (section 7) — Dazed, and X a turn past armor. | Kill it first, or carry an antidote. |

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
| 🔥 | **Spent**: playing this half puts the card out until you rest |
| ⤵ + number | **Strain X**: discard X other cards from your hand to play this half |

Example card written with icons:

```
┌──────────────┐
│ DRAW STEEL   │
│ ▲  ⚔         │
│ ▼  ⇄         │
│ ⚡ –          │
└──────────────┘
```

### [OPEN] Silenced is the one condition that can empty a turn

**Silenced blocks ✦ Cast**, and a caster plays spells off card halves that show it — so a Silenced
caster whose hand is all ✦ has the turn the blockquote above forbids. Nothing does this to a
fighter: Disarmed costs you one item's ⚔ and ⇄ Ready, and you can still pick something else up or
hit them with your hands.

It is not quite nothing, because **Brace is never blocked** and no card is ever completely dead
(below). But one point of damage reduction is not a turn.

The fix is a **content** rule rather than a rules change, and it sets a floor for the caster deck
that does not exist yet. A hand is 5 of 16, so for *k* cards carrying a non-✦ **primary**:

| Non-✦ primaries in 16 | A Silenced turn is playable |
|---|---|
| 4 | 81.9% |
| 6 | 94.2% |
| **8** | **98.7%** |
| 10 | 99.9% |

**Half the deck is the number.** Eight cards with an ordinary primary — a Move, a Ready, a staff's
⚔ — makes a Silenced turn playable 98.7% of the time, which is the same standard every other
condition in the list meets. Below six it is a coin-flip whether magic's hard counter is also a lost
turn, and *that* is the version of Silenced nobody should playtest.

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

## 11. Grid, ground and movement

> **Leaving is free. Arriving is answered.** There are no opportunity attacks in this game — you may
> walk away from an adjacent enemy for nothing — but an enemy that **ends its movement next to you**
> hands you a *Sidestep* or a *Set Spear*. That asymmetry is the whole positional grammar, and it is
> the reverse of most games: it is why a bow is dangerous, why closing is the hard part, and why
> **mobility is the most valuable thing in a starter deck** — worth **29 points of win rate** against
> a mixed group and **nothing at all** against pure melee
> ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §6).

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

### Ground

Three kinds of square, and all three were being used by spells before any of them was defined.

| | What it is | What it does |
|---|---|---|
| **Difficult ground** | rubble, water, thorns, ice — or a spell that says so | each square of it costs **2** of your Move instead of 1 |
| **Shadowed** | any square with no clear line to a light source. Indoors by day or out by night, the GM marks them; at night in the open, **every** square is shadowed | nothing on its own — it is what **Shadow Magic** reads (way-cards §3.4) |
| **High ground** | a square the GM has marked above its neighbours | shooting from it down, **the target gets no cover from figures** — only from obstacles |

**Difficult ground is the only one that costs anything**, and it costs Move rather than forbidding it,
so a Move 3 crosses one square of rubble and stands on the second. Four formulas create it and
*Light Feet* (way-cards §3.3) is the card that ignores it.

**Shadowed carries no rules at all**, which is deliberate and is the same decision as an **opening**
(§7): a whole school reads it, and if the square itself did anything the school would be reading a
bonus instead of a battlefield.

**High ground removes a penalty rather than adding a bonus.** That is on purpose — positioning is
already the strongest axis in the game, so the reward for taking the hill is that figures stop
shielding your target, not a flat plus. It is what the **ground** resource a specialization pays in
actually buys ([leveling.md](leveling.md) §5a.1).

### Forced movement

A push, a pull or a throw moves a figure a stated number of squares in a straight line. The **mover**
does not choose the path and the **moved** does not spend Move.

- It **is** movement for everything that cares: it can set off a *Sidestep*, and it ends a turn's
  worth of standing still.
- It **ignores difficult ground** — you are being thrown across the rubble, not walking it.
- It cannot push a figure into a wall or another figure. It stops in the last square it can reach.

*Undertow* (way-cards §3.5) is the first miracle that does this, and it was written before the rule
was.

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

- **[OPEN]** **Figure size.** Nothing says whether an ogre or a mounted knight occupies more than one
  square, and it is tangled with mounts ([conditions.md](conditions.md) §4.2) — both wait on the same
  decision.
- **[OPEN]** **Move is not resolved by the engine.** Figures are pushed by hand, and the tray prints
  the played value (halved by Slowed, reduced by Frozen) but nothing else. Given that mobility is the
  most valuable action in the game (§11), this is the largest remaining engine gap: at minimum the
  HUD should show reach to each target, since that is the number every positional decision turns on.

- **The Way graphs.** Every node, benefit and specialization for Strength, Shade and Mind. The
  leveling *mechanism* is settled in [leveling.md](leveling.md) — a milestone step along a directed
  graph, two benefits offered and one taken — and with it the double-attack decision (section 3),
  the action-deck grow/prune rules (section 8) and rest tokens. What is left is content, and it
  waits on the world.
- **Affliction list for Taint sources** (section 8). Waits on world creation.
- **Character creation** — *deliberately deferred until after the first playtest.* The sequence (pick
  a Way, take a background, assemble a starter deck) is easy to write and easy to get wrong before
  anyone has played, so it waits for evidence. Until then, play with the pregenerated starter
  Warrior in [starter-cards.md](starter-cards.md).

Settled since draft 0.1:

| Was open | Decision |
|---|---|
| Skill deck for out-of-combat play | Written: [skill-rules.md](skill-rules.md) draft 0.2. |
| Condition timing | Ticks at the start of the **creator's** turn, so a duration-1 condition always costs the victim exactly one turn (section 7). |
| How Block works and how long it lasts | Section 4, *Block*. |
| Stat checks and saving throws | There are no stats. The six **approaches** are the stat line, and a **passive score** turns a deck into a number when one is needed. See *Saving throws* in [skill-rules.md](skill-rules.md) §2. |
| How to tune NPC damage against armor | Section 9, *NPC gear and the armor rule*. |
| Final icon set and card layout | [icons.md](icons.md) lists all 50 icons with their sources; [../foundry/card-layout.md](../foundry/card-layout.md) specifies every face. |
| Action deck size | 12–20 cards, raised by features (section 8). |
