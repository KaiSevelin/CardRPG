# Way Cards and Spells (Draft 0.1)

What the nodes hand out. [leveling.md](leveling.md) settles what a level-up *is* and
[specializations.md](specializations.md) settles what the 48 major nodes *are*; this settles the
**content** — the cards, the spells and the miracles that make a node something you can play.

Two halves:

1. **The standard** — value bands, cost budgets and the spell format, so that content written months
   apart stays comparable and can be balanced as a set.
2. **The 48 Signatures** — one card or feature per major node, the thing each node is named for
   ([leveling.md](leveling.md) §5a). These are **drafts and none of them is simulated.**

---

## 1. The standard

### 1.1 One card, one gift

> **A Way card does exactly one thing a starter card cannot, and pays for it in exactly one way.**

That is the whole budget. It is not a points system, and deliberately not: the thing a Way card is
allowed to be is listed in [leveling.md](leveling.md) §5a.4 as ten **shapes**, and a card that fits
one shape and carries one cost is in band by construction. A card that needs two sentences to explain
what it does is two cards.

The failure this guards against is the **+2 trap**. *Strike +2* is not a gift, it is the same card
everyone already has with a bigger number, and a Way whose twelve nodes all do that has one node.

### 1.2 Value bands

Anchored on [starter-cards.md](starter-cards.md), which is simulated, so these are relative to
something measured rather than invented:

| | Starter deck | A Way reward |
|---|---|---|
| **Strike modifier** | +0, or +1 on a dedicated card | +1 flat, or **+2 conditional** on something you had to arrange |
| **Strike on a secondary** | never | **yes** — the classic reward, worth most of a round over a fight |
| **Two verbs on one half** | *Lunge* (Move 2, then Strike) | the commonest Way shape, and the cheapest to balance |
| **Defend** | *Shield Up* | Defend **and** something else |
| **Heal** | 2, and the card is Spent | 3, Spent, plus Strain 1 |
| **A condition with a saving throw** | never | **yes** — conditions are where the Ways live (core-rules §7) |
| **Move** | 1–3 | 3 with a verb attached |

Two of those lines are quoted from decisions already taken, not proposed here: *Strike on a
secondary half is a levelling reward, not a starter card*, and *a Defend primary blocks every attack
until your next turn* ([design-direction.md](design-direction.md)).

### 1.3 The cost ladder

Four rungs, cheapest first. **Pick one.**

| Cost | Buys | How often |
|---|---|---|
| *nothing* | a re-arrangement of verbs you already have — *Move 2, then Strike* | freely |
| **Strain 1** | an effect worth about one card | a few per deck |
| **Spent** | an effect worth the rest of the fight | **at most 2 in a 16-card deck** |
| **Spent + Strain** | a Signature, and only a Signature | once |

The starter Warrior has exactly **one** Spent card in sixteen and no Strain at all, which is the
floor. Two Spent cards is the ceiling for a deck of that size: Spent cards do not come back on a
Catch Breath, and a deck that burns three of them is a deck that runs out of good cards before the
fight runs out of enemies.

> **Why Strain is the caster's cost and Spent is the fighter's.** Strain asks for cards out of your
> hand *now*, which is a tax on the turn and hurts most when you were holding options. Spent asks for
> the card itself, for good, which is a tax on the fight. A caster plans a fight; a fighter survives
> one. The costs point the same way the Ways do.

### 1.4 Spells: the format

A spell is a **slate**, like a sword or a potion (core-rules §4), and what it occupies is a **spell
slot** rather than a slot on your body.

| Printed | |
|---|---|
| **Strength** | **1–5**, from the world document, and it **is** the slot cost: a strength-3 formula fills three slots |
| **Kind** | **formula** (studied — Way of Mind) or **miracle** (granted — Way of Faith) |
| **Source** | the school or the god, which is who may teach it |
| **Effect** | a verb line, which may carry a condition, its duration and what resists it |
| **Prepared** | in your head, or in the book |

Strength is the one number a spell needs, and it does three jobs: it is the slot cost, it is the
power band, and it is what the world already wrote down for every school. *"Some spells cost more
than one slot"* needed no rule of its own.

| Strength | Slots | What it may do |
|---|---|---|
| **1** | 1 | one target, one small thing: damage about a weapon's Strike, or a 1-round condition |
| **2** | 2 | a condition with a saving throw, a useful area, or a heal worth a card |
| **3** | 3 | a condition that lasts, a heal that saves someone, or an area that decides a corner of the map |
| **4** | 4 | changes the fight for a round |
| **5** | 5 | once in a fight, and the reason the branch exists |

**A first Way of Mind or Way of Faith node grants 2 spell slots.** Two is the smallest number that is
a decision — one strength-2 formula, or two strength-1s — and it makes *"a caster who prepared the
wrong spells has prepared the wrong spells"* bite from the first level.

> **A miracle's list is shorter than a school's**, which the world says outright: priest magic is
> *"a shorter list than a mage's"*. The compensation is that a miracle costs nothing to **learn** — a
> god grants it — where a formula is paid for in Health, Taint, secrets, body parts or coin. Faith
> pays continuously in obedience instead ([specializations.md](specializations.md)).

### 1.5 What belongs on a minor node

A major node gets a Signature. The ordinary nodes between them get the small things, and the list is
already written: a skill card, a training, a know-how, a feature, an action card, a prune, a deck cap,
a spell slot, Health, a rest token ([leveling.md](leveling.md) §4).

**Cards are the backbone and features are the spice**, and that is a ratio, not a slogan: a feature
never dilutes anything, so a feature-heavy branch makes a character monotonically stronger, while a
card costs you something to gain. Aim for roughly **two cards per feature** along a trunk.

---

## 2. The 48 Signatures  **[DRAFT]**

One per major node. Each is written to the node's **cell** and, in Way of Strength, to the **lever**
it owns ([specializations.md](specializations.md)). Nothing here is simulated.

### 2.1 Way of Strength

Each of these is the node's lever made playable, which is the point: a fighter's verbs are everyone's
verbs, so the identity has to be a rule nobody else may touch.

| Node | Signature | What it is |
|---|---|---|
| **Infantry** | **Shoulder to Shoulder** | Primary: Strike. Every **ally adjacent to you** gains Block 1 until your next turn. |
| **Guardian** | **The Wall** | Feature: **your Blocks stack.** You are the one exception to highest-wins (core-rules §4). |
| **Ironclad** | **Nothing Gets Through** | Feature: while you are **Overloaded**, your armor counts **double**. The one build that wants to be over the limit. |
| **Artillerist** | **Ranging Shot** | Primary: a ranged Strike with an **Aimed** area — or **Blast** instead, if you did not Move this turn. |
| **Tactician** | **On My Call** | Reaction, on an ally's turn: they may play the card in their hand **halves swapped** — its secondary as a primary. |
| **Executioner** | **Cleave to the Bone** | Feature: for you, the **Wound threshold is 4**, not 5 (core-rules §8). |
| **Knight** | **The Lance** | Primary: **Move 3, then Strike**, with advantage if you moved at least 2. Needs the mount. |
| **Berserker** | **Red Mist** | Primary: Strike — **Spent**. Then draw back up to your hand size at once. |
| **Musketeer** | **Loaded Before the Bell** | Feature: you begin every combat already loaded, and the first shot of a fight is **+2**. |
| **Gladiator** | **Play to the Crowd** | Reaction, when you are hit: gain Block 2, and the attacker **must** attack you again next turn. |
| **Street Fighter** | **Get a Grip** | Primary: **Grappled (2)**, resist ✊ Might 5 — and **no save at all** if both your hands are empty. |
| **Bodyguard** | **Interpose** | Reaction: take a hit meant for an adjacent ally. Core-rules §3 already names this card in its redirection step. |

Two of these cost the rules nothing at all. **Cleave to the Bone** moves a number that already exists
by one, and because a Wound is a card shuffled into the target's own deck, an Executioner's work
outlasts the fight. **Interpose** was already written into the reaction order before any node claimed
it.

### 2.2 Way of Shade

| Node | Signature | What it is |
|---|---|---|
| **Thief** | **The Opening** | Feature: **advantage against anyone *you* put a condition on** this fight. Worthless to a build that applies none — which is what makes it the Thief's. |
| **Scout** | **Point Man** | Primary: **Foresee**. While you are the furthest forward of your party, Foresee **one extra type**. |
| **Duellist** | **Named** | Secondary: name one enemy. Against it, your **Parry also Strikes for 1**. |
| **Assassin** | **One Opening** | Primary — **Spent**: Strike. Against a target that is unaware, Prone or Slowed, the damage is **doubled**. |
| **Cutpurse** | **Lift** | Primary: Strike. On a hit, take **one card from the target's own deck**. It is yours now, and it is in your deck for good. |
| **Burglar** | **The Kit** | Item slate, weight 3, which you may never put down: every Hard physical obstacle becomes **Normal**. |
| **Archer** | **Loose and Step** | Primary: ranged **Strike, then Move 1**. |
| **Trapmaker** | **Set** | Secondary: place a trap on an adjacent square. The first enemy to enter is **Slowed (2)** and takes your Strike value. |
| **Acrobat** | **Over and Past** | Primary: Move your full value, **through enemy squares**. The one §11 rule worth breaking. |
| **Bard** | **Heckle** | Reaction, when an enemy acts: it draws fate with **disadvantage**. |
| **Gambler** | **Double or Nothing** | Primary: Strike, and draw **two** fate cards — **both apply**, added together. Variance, not advantage. |
| **Half-mage** | **One Trick** | Feature: **2 spell slots**, and you may prepare from any one school you have ever seen cast. |

**Gambler is the one worth arguing about.** Advantage draws two and keeps the better; *Double or
Nothing* draws two and keeps **both**, which widens the tails instead of shifting the mean — a Miss
and a Critical in the same swing. It is the only card in the game that makes the fate deck more
dangerous to its owner, which is exactly what a gambler should be, and it needs simulation more
than anything else in this document.

### 2.3 Way of Mind

Formulas, with their strength in brackets. Strength is the slot cost.

| School | Signature | What it is |
|---|---|---|
| **Blood Magic** | **Blood Price** (2) | Strike 4 at range 3, ignoring armor. Costs **2 of your own Health**. |
| **Necromancy** | **Call the Unquiet** (3) | A corpse within 2 rises and fights for you until the fight ends. |
| **Elemental Magic** | **Wall of the Sphere** (2) | A 3-square line of your element: cover, and difficult ground, until your next turn. |
| **Poison** | **Wither** (2) | **Tainting 1** on one target, resist ✊ Might 5. |
| **Glamour** | **Not Here** (2) | You are **Invisible** until you attack or are attacked. |
| **Tattoo Magic** | **Graven Strength** (1) | A permanent tattoo: **+2 Strike with Heavy items** — and the GM writes down a secret. |
| **Asceticism** | **Nothing Left to Take** (1) | While your **hand is empty**, you cannot be reduced below 1 Health. |
| **Shadow Magic** | **Step Through** (2) | Teleport to any shadowed square you can see. A **Wild** card joins your fate deck, for good. |
| **Spiritualism** | **The Bargain** (3) | A minor god acts once this fight. **The GM decides how**, and that is the point. |
| **Household Magic** | **Hearth and Home** (ritual) | Out of combat: a camp nobody unfriendly can find, for one night. |
| **Ward Magic** | **Unmake** (2) | Reaction — **Spent**: a ✦ Cast **you have survived before** does not resolve. |
| **Divination** | **The Reading** (2) | **Read 3** (core-rules §6) on any one fate deck **except your own**. |

**Unmake carries the school's whole price in its own text.** *A Cast you have survived before* is the
learning condition printed on the card: a warder's book is a record of what the party has lived
through, and the GM fills it by casting at them.

### 2.4 Way of Faith

Miracles. A god's list is short, and these are each god's first and defining one. The four lone gods'
rule-bending gifts are in [specializations.md](specializations.md) and are **not** repeated here —
they belong to the node, not to a miracle.

| God | Signature miracle | What it is |
|---|---|---|
| **The Eternal God** | **The Clean Hand** (2) | An ally's next check or attack **cannot fail**. One cheaper on a brother or sister in faith. |
| **The Eternal Spirit** | **Breath of the Spirit** (2) | Reaction: heal an ally **3**, at any range, ignoring cover. |
| **Sessyfyn** | **The Tide Knows** (2) | An ally draws fate **twice** on their next action and keeps **both**. The sea is not fair. |
| **Valtor** | **The Drum** (1) | **Strain 1**: your next Strike this turn is **+3**. |
| **Fagar** | **The Borrowed Face** (3) | **Spent**: one enemy spends this round attacking **its own ally**. |
| **Vulpet** | **The Outcast's Due** (3) | Every enemy adjacent to you is **Frightened (2)**, resist ✨ Presence 5. |
| **Brendan** | **Out of Barren Ground** (3) | Plant it. At the start of your **second** turn after, every ally within 2 heals **4**. |
| **The Grey** | **The Silent Hour** (2) | Reaction, adjacent only: an enemy's action **does not happen**. |
| **The Purple** | **The First Taste** (2) | **Tainting 2** on one adjacent enemy. You gain **1 Taint** yourself. |
| **The Yellow** | **The Rumour** (2) | Name a lie before the fight. One enemy type acts as if it were true, for as long as you spend a **secondary** each round keeping it up. |
| **Vax** | **The Club and the Line** (2) | Strike **every adjacent enemy** — no free hand needed, because the club is the symbol. Costs **2 Health**. |
| **The First** | **The Long Night** (3) | Drain **3 Health** from an adjacent living target and **gain it**. |

Four of these pay in something other than slots — Valtor in Strain, Fagar in Spent, Vax and The
Purple in their own Health and Taint — which is the Way's design read at the card level: **the gods
differ in what they take.**

---

## 3. Open

- **Nothing here is simulated.** The four that most need it: **Double or Nothing** (two fate cards,
  both applying, is a new distribution and nothing else in the game does it), **Cleave to the Bone**
  (a Wound threshold at 4 changes how often Wounds enter a deck at all), **The Wall** (stacking Blocks
  against the measured value of a Defend primary) and **Nothing Gets Through** (doubled armor against
  the cliff-edge behaviour armor already has).
- **[OPEN]** The ordinary cards on **minor** nodes — far more content than this document, and the
  place where the two-cards-per-feature ratio actually gets tested.
- **[OPEN]** Each god's **full miracle list** and each school's **full formula list**. Only the first
  of each is written above.
- **[OPEN]** A **multi-step spell**. The slate carries one effect; *Move, then Strike* exists on cards
  but has no spell equivalent, and *Wall of the Sphere* is already straining against the single step.
- **[OPEN]** **The Rumour** needs the GM-facing half written: what "acts as if it were true" does to
  an intent card is the interesting part and it is not specified.
- **[OPEN]** Whether **The Clean Hand** is too strong at strength 2. *Cannot fail* removes the fate
  draw entirely, which no other miracle does, and the Eternal God is already the most restrictive
  choice in the game.
