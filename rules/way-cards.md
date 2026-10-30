# Way Cards and Spells (Draft 0.2)

What the nodes hand out. [leveling.md](leveling.md) settles what a level-up *is* and
[specializations.md](specializations.md) settles what the 48 major nodes *are*; this settles the
**content** — the cards, the spells and the miracles that make a node something you can play.

Three parts:

1. **The standard** — value bands, cost budgets, the spell format and how a combo is written, so that
   content written months apart stays comparable and can be balanced as a set.
2. **The 48 Signatures**, and the **48 tactics** — one card and one standing feature per major node.
   The Signature is what the node lets you *do*; the tactic is how it makes you *stand*
   ([leveling.md](leveling.md) §5a).
3. **The minor-node pools** — the ordinary cards, formulas and miracles the nodes *between* the
   titles hand out, which is most of a character.

**None of it is simulated.** §4 says which parts most need to be.

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
| **A combo** | never | **yes** — a half that sets an **opening**, or reads one (§1.6) |
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
| **1** | 1 | one target, one small thing: damage about a weapon's Strike, or a 1-round condition — **Burning** or **Frozen** at intensity 1 |
| **2** | 2 | a condition with a saving throw, a useful area, or a heal worth a card |
| **3** | 3 | a condition that lasts, a heal that saves someone, or an area that decides a corner of the map — **Burning 3** is the ceiling outside a monster ([conditions.md](conditions.md) §2.1) |
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

The pools themselves are in §3.

### 1.6 Combos, and the four openings

Four conditions do **nothing at all** by themselves and exist to be read by other cards
(core-rules §7): **Wet**, **Off-Balance**, **Marked**, **Judged**. One per Way. A mage's *Rain*
leaves a goblin Wet; Wet does nothing; and then somebody's *Lightning* hits a Wet goblin harder than
a dry one.

The rules for them are in core-rules §7 and they are short. What belongs here is the **content**
side: who writes a setter, who writes a reader, and what each is worth.

**A setter goes on a secondary half.** Nothing else. A turn is a primary and a secondary, and most
secondaries are *Move 1* — the cheapest space in the game. An opening set from there costs a step
you were not taking, which is the only price a setup can afford. Put it on a primary and it competes
with a Strike, which means it never gets played.

**A setter needs no rung on the cost ladder** (§1.3), and it is the one exception in this document.
It does nothing on its own, so the secondary it occupies *is* the cost.

**A reader is worth about a card.** Where what it adds is a number there are exactly three bands,
and a clause that fits one of them is in band without further argument:

| A reader may give | Band | Note |
|---|---|---|
| **+2 damage** | the standard | the same +2 §1.2 allows for *"something you had to arrange"* |
| **advantage** | the standard | but it does **not** stack with Prone or Invisible, so it is wasted on a build that already arranges those |
| **a harder saving throw** | Normal → Hard, or Hard → Heroic | on a condition the half was attempting anyway |

Those three are what the schema carries, and the validator checks that a combo clause is one of
them (`when.mod`, `when.advantage`, `when.dc` — [../foundry/cardrpg/module/data/cards.mjs](../foundry/cardrpg/module/data/cards.mjs)).

**A fourth kind exists and is not banded: a reader whose payoff is not a number at all.** *Between
the Plates* ignores armor, *The Weight of It* sets a target's armor to 0 for everybody,
*Grey Judgement* moves an enemy to the end of the round, *Measure of the Debt* pays you Health for
a kill. These are worth whatever the fight makes them worth — nothing against a goblin, a great deal
against a knight — so a band cannot price them and only the simulator can. **Write them as prose and
send them to §4**, which is where all four of them are. They are also the ones to be stingy with: three or four in the whole game, not one per
node.

**Poison is priced in Poisoned N, and the scale starts at 0** (core-rules §7). *Poisoned 0* is Dazed
and nothing else; each rung above adds that much damage a turn on top. **Poisoned N is Burning N plus
Dazed**, so it costs one rung more than Burning for the same number:

| Poisoned | Costs | Is about |
|---|---|---|
| **0** | a card, or strength 1 | a Burning 1 — and the rung Burning does not have |
| **1** | strength 2 | a Burning 2 |
| **2** | strength 3 | a Burning 3 |
| **3+** | **monsters only** | |

**Disease is priced in Tainting, and it is a different thing from poison** — the line is whether it
outlives the fight (core-rules §8). Taint is the only thing a card can do that does, which is what
keeps the numbers tiny: **Tainting 1 is a real effect** and **Tainting 2 is a big spell.** Three Taint
makes a character **Afflicted** — max Health −3 until they are below three again — so a caster who
deals four has taken something off the sheet rather than out of a Health pool. The **fast/slow** dial
decides which pile the card lands in: the hand, resolving at once, or the discard, waiting.

**Acid is priced in Corrode, and it is the only effect that spends gear** (core-rules §8). It needs
no condition of its own: what acid does to a person is **Burning**, which even gets the water rule
right, and what makes acid *acid* is that it eats the armour. **Corrode 1 on a formula, Corrode 2 on
a monster** — armor behaves like a cliff edge, so one point is already a great deal.

**A dispel is priced in Shake Off, and the half is the cheap part** (core-rules §7,
[conditions.md](conditions.md) §9.2):

| Shake Off | Costs |
|---|---|
| **1** | a secondary — but see below: the half is cheap and the **card** is not |
| **2** | a primary, and **Spent** |
| **3** | a strength-2 formula, which is where *ends anything* belongs |

Three is the ceiling because nothing in the game prints a duration above 2, so **Shake Off 3 is
already "remove it"** — and it costs a spell slot and a school to say so. That is the whole reason
the keyword counts down instead of deleting: the strong version is reachable, expensive, and owned.

> **Measured, and it changes where a dispel belongs.** A Shake Off 1 on an action card's secondary,
> bought by cutting a copy of *Strike*, is worth **−2.1 points of win rate** and is played **0.00 to
> 0.22 times a fight** ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md)). One copy in
> sixteen reaches your hand 31% of turns, and it has to be there on a turn the condition is *also* on
> you. Against Dazed and Poisoned it cannot fire at all — both take the secondary it sits on.
>
> **So a dispel wants a surface that is there when the condition is:**
>
> | Surface | Available | Costs |
> |---|---|---|
> | an action card's secondary | 31% of turns | a card **and** a half — not worth it |
> | a **reaction** line | 31% of turns | the card only, no half |
> | a **prepared spell** | **always** | a slot, not a draw |
> | a **feature** | **always** | a node |
>
> Ward's *Shake It Off* is a **reaction spell** and is therefore right by both measures. *Slip the
> Knot* (§3.3) is the shape the simulator argues against, and it stays in the pool as the cheap
> option a Shade may take rather than as the answer anyone should rely on.

**No reader gates a primary, whatever kind it is.** No primary reads *"only against a Wet target"* —
an opening sharpens, it never switches a card on (core-rules §7, rule 3). A primary that does nothing
without its partner is a card held all fight waiting for a draw that never comes, and the validator
refuses that clause outright rather than trusting anyone to remember. **A secondary may be
situational**, since a card is dead only when both halves are: *Pull Them Down* (§3.2) is a plain
Strike with a conditional second half, which is the shape to use when a payoff really does want a
prerequisite.

**And a combo clause reads an **opening**, never an ordinary condition.** A half that is better
against a Prone or an Overloaded target is welcome — but those conditions already do plenty by
themselves, so such a half is ordinary card text, not a combo. The keyword exists for the one case
that needs it: a setup worth nothing alone, where the sharpening *is* the payment. Both the schema
and the validator now say so.

**Every Way sets its own opening and reads its own best — but may set another Way's.** That is where
party play comes from, and it is written into the content on purpose: the Poison school sets
**Off-Balance**, which is Strength's; Divination sets **Marked**, which is Shade's; Sessyfyn's
*Undertow* sets **Wet**, which is Mind's. A caster who cannot use an opening can still hand it to
the fighter who can.

> **The arithmetic that makes this worth doing at all.** Drawing two particular cards in one turn out
> of a sixteen-card deck is rare, so a combo in one player's hands is a trap. But an opening's
> duration ticks on its **creator's** turn, so one laid down on your turn survives every other
> player's and expires when you come round again — **one setup, one round, the whole party.** Split
> across two players, two cards are two hands, which is a different and far better probability.

#### Why these four, and why there is no fifth

**A condition needs to be an opening only where the setup would otherwise be worth nothing.**
That is the whole test. Prone, Grappled, Dazed and Burning are already worth playing for, so a card
that happens to be better against one of them is ordinary card text — it needs no keyword, because
nobody had to be talked into setting it up. The four exist for the opposite case: *Rain* and
*Shoulder Check* and *Call the Shot* and *Name the Guilty* buy you **nothing at all** on their own,
and would never be played without a keyword promising they are worth something to somebody.

Which gives three tiers of thing a card can read, and only the first needs inventing:

| Tier | What a card reads | Needs a keyword? |
|---|---|---|
| **Openings** | Wet, Off-Balance, Marked, Judged | **yes** — worth nothing alone, so the sharpening is the payment |
| **Real conditions** | Prone, Grappled, Dazed, Burning, Invisible… | no — already worth having; write it as card text on a **secondary** |
| **Derived states** | Overloaded, Burdened, cover, adjacency, an empty hand | no — and nobody sets them at all, so a card reading one is **counter-build** material rather than a combo |

That third tier is free content worth remembering: a Shade card that is vicious against an
**Overloaded** target needs no setter, because the target's own kit put it there and it cannot be
taken off mid-fight.

**And the four are a 2×2, not a 4×1.** One per Way was how they were chosen; it is not why they are
right. The real axis is *who creates it*:

| | Mind / Strength — **a state** | Shade / Faith — **a call** |
|---|---|---|
| | the world can hand it to you free | one character asserts it to their allies |
| | **Wet**, **Off-Balance** | **Marked**, **Judged** |
| Also set by | rain, a river, a burst barrel; loose ground, a failed jump | nothing but a character — which is the point |
| Reads as | *anyone can see it* | *he's the one* |

A **state** is physical and the GM can give it away for nothing, which is why terrain and weather
matter. A **call** has no source but a player, and is addressed to the rest of the table — which is
why the two calls belong to the two Ways built on information and authority, and why they are the
better half of the party mechanic.

The grid is full, every Way has one, and no axis of the uniqueness audit is left starved: between
them the readers written so far touch damage, saving throws, armor, initiative and Health. **So there
is no fifth.** A candidate would have to fill a hole in that grid rather than merely sound good, and
an *armour pried open* opening — the obvious suggestion — is already what *Between the Plates* and
*The Weight of It* do by reading Marked and Judged.

> **Off-Balance is the one to argue about.** Its case is not fictional but financial: **Prone** would
> be a better opening in every way except that it is far too strong to set for free, so Off-Balance
> exists to be the cheap thing a secondary may hand out and *Sweep the Leg* exists to convert it. That
> is a pricing job dressed as a condition, and if one of the four is ever cut it is this one.

> **The one real candidate for a fifth is an opening set on an **ally** —** a prepared or anointed
> friend whose next card reads it. It is the purest party mechanic imaginable and it is **rejected on
> rule 3**: a half that reads a buff you cannot give yourself is gated by another route, since no
> amount of good play puts it in reach. Ally-facing value stays where it already is — Block, Heal and
> advantage — which are simpler and do not pretend to be combos.

#### The worked example, and what it costs

| | Strength | Printed |
|---|---|---|
| **Rain** | 2 | ✸ Blast 3 at ◎4. Everything in it is **Wet (1)**. No damage, no save. |
| **Lightning** | 2 | ✦ Cast at ◎4. **Stunned (1)**, resist 📜 Lore 7 — against a **Wet** target, Heroic **9** and **+2** damage. |
| **Frost** | 1 | ◎3. **Slowed (1)**, resist 🌀 Agility 5 — against a **Wet** target, Heroic **9**. |
| **Scorch** | 1 | ✦ Cast at ◎4. **Burning (1)** — and a **Wet** target sheds it, because water and fire cancel. |

All four are in [../foundry/cardrpg/module/content.mjs](../foundry/cardrpg/module/content.mjs) and
resolve in the system today, which is why they are the worked example rather than an illustration.

**Rain plus Lightning is four of a caster's spell slots.** A first Way of Mind node grants **2**
(§1.4), so a starting caster **cannot run a combo at all** — and that is the answer to what the
later slots are for. Slot progression stops being *more spells* and becomes *you can now afford a
plan.*

**Scorch is the control, and it carries no combo clause whatsoever.** Water and fire cancel, so a Wet
target is a *worse* mark for fire rather than a better one. The interaction is printed on **Burning**
in the condition table, where core-rules §7 puts it — which means laying an opening down is never
simply correct, and there is no autopilot.

### 1.7 Conditions from spells

Half this game's major nodes are casters — twelve schools and twelve gods out of forty-eight — and
the condition list was written for fighters. Of the nineteen, magic **casts** six: Invisible, Burning,
Dazed, Slowed, Stunned and Wet ([conditions.md](conditions.md) §9). Everything else on the list is a
thing you do with your hands — except **Silenced**, which is the one aimed *at* casters and which
nothing in the game can currently inflict.

That is not a shortage of conditions. It is one missing *shape*, one condition nobody casts, and one
procedural rule already in force that is worth saying out loud.

#### The shape: a caster takes away what you may choose

Core-rules §7 forbids taking a turn away — *"a turn where you do nothing is the dullest thing a
fight can hand you"* — which rules out sleep, paralysis, petrifaction and *hold person* in one
stroke. All four are what spells classically do, so magic needs a different move:

> **A fighter's conditions take away what you may *do*. A caster's take away what you may *choose*.**

Dazed subtracts a half, Grappled subtracts your feet. **Compelled** subtracts nothing: you draw, you
play a primary and a secondary, you keep your reactions, and you simply do not pick the target. The
turn is full and the decision is gone.

**Compelled is not new content.** It is a name for a shape four cards already used in prose:

| Already written | Was |
|---|---|
| *Taunt* (starter deck) | *"Target enemy must attack you next turn"* — no save at all |
| *Roar* (§3.2) | every adjacent enemy must attack you next turn |
| *Play to the Crowd* (§2.1) | the attacker must attack you again |
| *The Outcast's Due* (§2.4) | cited **Frightened**, a condition that does not exist |

And core-rules §7's resist table has said *"👑 Presence — being cowed or compelled"* since it was
written, naming a condition nothing implemented. This is the same hole Block was in before it got a
subsection: the rules promised it, four cards used it, and it had no entry.

It needs **no target field** — the one you must attack is the creator, which the condition record
already stores. Fagar's miracle, which points an enemy at its own ally instead, stays prose for
exactly that reason, and that is the right division: the keyword covers the common case and prose
covers the clever one.

#### Why a spell's conditions may be stronger than a fighter's

Already in the rules, and it is the balancing mechanism:

> **If the condition rides on an attack that connected, it lands with it. If the condition *is* the
> action, the target makes a saving throw.** (core-rules §7)

A fighter's condition usually rides a Strike — the goblin's *Dirty Trick* dazes, and the Strike
already drew fate. A spell's condition usually **is** the spell, so it is saved against. **Casters
pay for their conditions in a save that fighters do not make**, which is why a strength-2 formula may
reach for Stunned while no card does. Nothing new is needed here; it just explains the bands in §1.4.

#### Blessed and Cursed exist, and nothing casts them

Both are fully specified (core-rules §6 and §7), both have icons, both work in the system — and
across all 48 Signatures and 28 pool spells **not one casts either.** They are the two most magical
conditions in the game and they were sitting unused.

| Condition | Does |
|---|---|
| **Blessed** | shuffles a temporary **Critical** into a fate deck, removed when drawn |
| **Cursed** | shuffles a temporary **Miss** into a fate deck, removed when drawn |

Fixed below — *The Evil Eye* (§3.4) and *A Word for You* (§3.5) — and the interesting part is a
consequence of a rule written for a different reason. **NPC fate decks are per *type*, not per
creature** (core-rules §6), so:

> **Cursed is worth inversely what there are of the thing.** One of five goblins shares a deck with
> four friends, so the Miss is four-fifths wasted. A lone ogre draws from its own twenty, and the Miss
> is coming for *it*.

That makes Cursed the game's only **anti-boss** spell, and it got there without anyone designing one.
It also means Cursed is close to dead against a swarm, which is the honest cost and a good reason for
a caster to carry something else as well.

#### What is not needed

| Candidate | Why not |
|---|---|
| **Blinded** | *Invisible* is already *"enemies can't target you"*; everyone being invisible **to you** is the same rule read from the other end, and a feature can say so with no new condition |
| **Frightened** | the mirror of Compelled, and §7's *"cowed"* half anticipates it — but exactly **one** card wanted it, against Compelled's four. Recorded, not written |
| **Held, Slept, Petrified, Banished** | all turn removal, all forbidden by §7, and the shape rule above is what replaces them |
| **Polymorph, Enlarge** | not conditions. They change the sheet, which is a GM-facing change and belongs in prose on the spell |

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
| **Gladiator** | **Play to the Crowd** | Reaction, when you are hit: gain Block 2, and the attacker is **Compelled (1)** — no save, because you have already been hit once. |
| **Street Fighter** | **Get a Grip** | Primary: **Grappled (2)**, resist ✊ Might 5 — and **no save at all** if both your hands are empty. |
| **Bodyguard** | **Interpose** | Reaction: take a hit meant for an adjacent ally. Core-rules §3 already names this card in its redirection step. |

Two of these cost the rules nothing at all. **Cleave to the Bone** moves a number that already exists
by one, and because a Wound is a card shuffled into the target's own deck, an Executioner's work
outlasts the fight. **Interpose** was already written into the reaction order before any node claimed
it.

### 2.2 Way of Shade

| Node | Signature | What it is |
|---|---|---|
| **Thief** | **The Opening** | Feature: **advantage against anyone carrying an opening** (§1.6) — whoever set it. |
| **Scout** | **Point Man** | Primary: **Foresee**. While you are the furthest forward of your party, Foresee **one extra type**. |
| **Duellist** | **Named** | Secondary: name one enemy. Against it, your **Parry also Strikes for 1**. |
| **Assassin** | **One Opening** | Primary — **Spent**: Strike. Against a target that is unaware or carrying an **opening**, the damage is **doubled**. |
| **Cutpurse** | **Lift** | Primary: Strike. On a hit, take **one card from the target's own deck**. It is yours now, and it is in your deck for good. |
| **Burglar** | **The Kit** | Item slate, weight 3, which you may never put down: every Hard physical obstacle becomes **Normal**. |
| **Archer** | **Loose and Step** | Primary: ranged **Strike, then Move 1**. |
| **Trapmaker** | **Set** | Secondary: place a trap on an adjacent square. The first enemy to enter is **Slowed (2)** and takes your Strike value. |
| **Acrobat** | **Over and Past** | Primary: Move your full value, **through enemy squares**. The one §11 rule worth breaking. |
| **Bard** | **Heckle** | Reaction, when an enemy acts: it draws fate with **disadvantage**. |
| **Gambler** | **Double or Nothing** | Primary: Strike, and draw **two** fate cards — **both apply**, added together. Variance, not advantage. |
| **Half-mage** | **One Trick** | Feature: **2 spell slots**, and you may prepare from any one school you have ever seen cast. |

**The Thief's and the Assassin's were rewritten when §1.6 was written, because §1.6 broke them.**
*The Opening* used to read *advantage against anyone you put a condition on, this fight*. Add *Call
the Shot* — a free secondary that Marks anything in sight (§3.3) — and a Thief spends round one
marking the room and has advantage against everything for the rest of the fight. The fix is the
better card anyway: an opening lasts a round, so the advantage lasts a round, and **whoever set it**
counts. The Thief stops being a character who sets up for themselves and becomes the one the party
sets up *for* — the reason somebody else's rain was worth casting. The Assassin then deepens their
parent's reading rather than carrying an unrelated list, which is what §5a of
[leveling.md](leveling.md) says a child node is allowed to do.

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
| **Poison** | **Wither** (2) | **Poisoned 1 (2)** on one target, resist ✊ Might 5 — Dazed, and 1 a turn past armor. |
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
| **Vulpet** | **The Outcast's Due** (3) | Every enemy adjacent to you is **Compelled (2)**, resist 👑 Presence 5. The outcast is who the crowd turns on. |
| **Brendan** | **Out of Barren Ground** (3) | Plant it. At the start of your **second** turn after, every ally within 2 heals **4**. |
| **The Grey** | **The Silent Hour** (2) | Reaction, adjacent only: an enemy's action **does not happen**. |
| **The Purple** | **The First Taste** (2) | **Tainting 2** on one adjacent enemy. You gain **1 Taint** yourself. |
| **The Yellow** | **The Rumour** (2) | Name a lie before the fight. One enemy type acts as if it were true, for as long as you spend a **secondary** each round keeping it up. |
| **Vax** | **The Club and the Line** (2) | Strike **every adjacent enemy** — no free hand needed, because the club is the symbol. Costs **2 Health**. |
| **The First** | **The Long Night** (3) | Drain **3 Health** from an adjacent living target and **gain it**. |

Four of these pay in something other than slots — Valtor in Strain, Fagar in Spent, Vax and The
Purple in their own Health and Taint — which is the Way's design read at the card level: **the gods
differ in what they take.**

§3.5 makes that general: each god now states an **Obedience** that applies to everything it grants,
because a miracle is free to learn and paid for every time you ask. These twelve are repeated there
under their gods.

### 2.5 Tactics — how each specialization fights  **[DRAFT]**

A Signature says what a node lets you *do*. A **tactic** says how it makes you *stand*.

> **A tactic is a feature, always on, that makes a different position correct.**

#### Why a feature and not a card

Measured, not assumed: **a one-of-sixteen card is in your hand 31% of turns**
([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §4). A thing that is true a third of
the time cannot shape how you play — it can only be a trick you sometimes have. A tactic has to be
true on the turn you are deciding where to stand, which means it has to be true every turn.

#### Why players should have them at all

**Monsters already do.** Pack Tactics and Shield Wall have been in core-rules §9 since the rules were
written, and they are the only two positional rules in the game — so the monster side has had a
positional grammar and the player side has had cards. **A tactic is that machinery pointed the other
way.**

And positioning is where it matters most: mobility is worth **29.5 points of win rate** in the fights
where it counts (§11), which makes *where you stand* the strongest decision a player makes and the one
with almost nothing written about it.

#### The three rules that stop 48 of these being power creep

**1. One tactic per character — the deepest title you own.** An Assassin does not also fight like a
Thief; the tactic is **replaced**, not accumulated ([leveling.md](leveling.md) §5). So however deep
the graph runs, a character has exactly one, and each can therefore be strong.

**2. A tactic names a position or a behaviour, never a number.** It may grant **advantage**, **remove
a penalty**, **add a reaction**, or **restrict movement** — it may never add +N to anything. Advantage
does not stack, which caps it for free; a flat bonus would not be capped at all.

**3. A tactic must fail the swap test.** Offer it to a sibling node: if it would work there, it is not
a tactic, it is a house rule with a name on it ([leveling.md](leveling.md) §5a.2).

> **This is also the answer to a question §11 raises.** That section recommends **no flanking bonus**,
> because positioning already swings more than three damage rungs. A tactic looks like the opposite —
> the Assassin's is flanking in all but name. The difference is that it belongs to **one node**:
> positional rewards exist in this game, but each is somebody's, so **nobody has them all**. A
> universal flanking rule would reward every character for the same thing; forty-eight different
> tactics reward forty-eight different things, which adds decisions rather than power.

#### Way of Strength

| Node | Tactic | |
|---|---|---|
| **Infantry** | **Shoulder to Shoulder** | While an ally is adjacent to you, neither of you can be moved against your will. |
| **Guardian** | **The Door** | An enemy adjacent to you that would move to another square adjacent to you must **stop** instead. You do not pin them; you stop them getting past. |
| **Ironclad** | **Immovable** | Forced movement never moves you, and difficult ground costs you nothing. |
| **Artillerist** | **Ranging** | If you did not Move this turn, your ranged attacks **ignore cover**. |
| **Tactician** | **The Call** | At the start of a round, name a square. The first ally to end movement there draws fate with **advantage** on their next action. |
| **Executioner** | **No Second Thought** | When an enemy drops to 0 Health from your Strike, **Move 1** at once. |
| **Knight** | **The Charge** | If you moved 3 or more squares in a straight line this turn, your Strike **cannot be answered by a reaction**. |
| **Berserker** | **Forward Only** | You may never move away from the nearest enemy — and while two or more enemies are adjacent to you, you cannot be **Dazed** or **Compelled**. |
| **Musketeer** | **The Firing Step** | You may not Strike an adjacent enemy at all — and your ranged attacks **never** take the ranged-in-melee penalty. |
| **Gladiator** | **The Crowd Wants Blood** | While you are the nearest target to the enemy, you draw fate with **advantage** on reactions. |
| **Street Fighter** | **The Alley** | While both your hands are empty, an enemy adjacent to you may not Move away except by forced movement. |
| **Bodyguard** | **Never Leave Them** | When an ally moves, you may **Move 1** as a reaction to follow — and figures never block that move. |

#### Way of Shade

| Node | Tactic | |
|---|---|---|
| **Thief** | **Never Where You Looked** | An enemy that attacks you and misses may not attack you again this round. |
| **Scout** | **Furthest Forward** | While no ally is nearer the enemy than you, you have **cover from every figure** on the field, not only those in the line. |
| **Duellist** | **One at a Time** | While exactly one enemy is adjacent to you, it has **disadvantage** against you and you have **advantage** against it. |
| **Assassin** | **From Behind** | You have **advantage** against any enemy that is adjacent to one of your allies. |
| **Cutpurse** | **Light Fingers** | The first time each fight you end your turn adjacent to an enemy that has not attacked you, take one item from its belt. |
| **Burglar** | **Through the Window** | You ignore difficult ground, and no enemy blocks your movement in a square that holds an obstacle. |
| **Archer** | **Overwatch** | Once a round, when an enemy **ends its movement** in your line of sight and within range, Strike it as a reaction. |
| **Trapmaker** | **The Ground You Chose** | Every square you have occupied this fight is **difficult ground** for your enemies. |
| **Acrobat** | **Never Cornered** | When you are attacked, you may **Move 1** as a reaction before damage is worked out. |
| **Bard** | **The Running Commentary** | An enemy within 3 of you that would draw fate with **advantage** draws normally instead. |
| **Gambler** | **The Long Odds** | While two or more enemies are adjacent to you, you draw fate with **advantage**. |
| **Half-mage** | **One Hand Free** | You may ✦ Cast with a weapon in your other hand. Casting never needs a hand free. |

**The Assassin and the Archer are the two this section was asked for**, and they are worth comparing
because they answer the same question from opposite ends. *From Behind* rewards standing where the
enemy is **already busy**; *Overwatch* punishes the enemy for **arriving** anywhere you can see. One
is about your position, the other about theirs — and *Overwatch* is the only tactic in the game that
extends core-rules §11's *arriving is answered* past the square you are standing in.

#### Way of Mind

A caster's hard problem is not what to cast, it is **where to stand** — ranged-in-melee, line of
sight, and their own Blast. Every tactic here is about that.

| Node | Tactic | |
|---|---|---|
| **Blood Magic** | **Your Own Blood Is Nearest** | You may always Cast on yourself whatever the spell's range, and never take disadvantage for it. |
| **Necromancy** | **The Dead Are Furniture** | Corpses are **cover** for you and **difficult ground** for your enemies. |
| **Elemental Magic** | **The Sphere Holds** | Your own ✸ Blast spares **you** alone, whatever the card says. |
| **Poison** | **The Patient Hand** | An enemy you have put a condition on this fight has **disadvantage** against you. |
| **Glamour** | **Never Quite There** | Ranged attacks against you from more than 3 squares always have **disadvantage**. |
| **Tattoo Magic** | **Nothing to Prepare** | You may ✦ Cast with both hands full, and **Silenced does not stop you** — your spells are on your skin, not in your mouth. |
| **Asceticism** | **The Still Point** | If you did not Move this turn, you cannot be moved and attacks against you have **disadvantage**. |
| **Shadow Magic** | **At Home in the Dark** | While you stand in a **shadowed** square, enemies more than 2 squares away cannot target you at all. |
| **Spiritualism** | **Something Is Always Listening** | You know whether any square within 6 is shadowed, high ground or difficult ground before anyone steps on it. |
| **Household Magic** | **The House Helps** | Indoors you ignore difficult ground, and you know where every door is before you see it. |
| **Ward Magic** | **The Standing Guard** | One extra reaction each round, usable **only** to answer a ✦ Cast. |
| **Divination** | **Already Seen** | You are never surprised, and at the start of any round you may **swap your place in the initiative order** with a willing ally's. |

**Tattoo Magic's is the only player answer to Silenced in the game.** [conditions.md](conditions.md)
§8 records that Silenced is the one condition that can empty a turn and that it does so only to
casters; the tattoo mage is the caster it cannot touch, which is what paying for your magic in skin
rather than words should buy.

#### Way of Faith

Each is shaped by the god's **Obedience** (§3.5), because a priest's tactics are not theirs.

| Node | Tactic | |
|---|---|---|
| **The Eternal God** | **No Shelter for the Guilty** | Enemies get no **cover from figures** against you. |
| **The Eternal Spirit** | **Where the Air Goes** | You may reach any ally you can see, ignoring cover and range, for anything that heals or helps. |
| **Sessyfyn** | **The Tide Comes In** | At the start of each round, move any one willing ally **1 square**. |
| **Valtor** | **The Drum Does Not Stop** | You may never 🛡 Defend — and if you moved toward an enemy this turn, your Strike **cannot be answered by a reaction**. |
| **Fagar** | **Nobody Remembers Your Face** | The first enemy to attack you each fight draws fate with **disadvantage**. |
| **Vulpet** | **Alone and Unafraid** | While no ally is within 2, you cannot be **Compelled** and enemies have **disadvantage** against you. |
| **Brendan** | **Roots** | A square you have stood in for a whole round is **high ground** for you and **difficult ground** for your enemies. |
| **The Grey** | **Close Enough to Touch** | Moving into a square adjacent to an enemy costs you nothing, even out of difficult ground, and never sets off a reaction. |
| **The Purple** | **The Cup Passes** | An enemy will not willingly **end its movement** adjacent to you; doing so costs it a half. |
| **The Yellow** | **Nobody Knows Where You Are** | Enemies treat you as standing where you were at the **start of the round**. |
| **Vax** | **The Line** | While two or more allies are adjacent to you, none of you can be moved and none of you is blocked by cover. |
| **The First** | **What Does Not Die** | At 0 Health you keep acting as though at 1 until the end of the round in which you fell. |

**The Yellow's is the strangest and the most Yellow.** *Nobody Knows Where You Are* means the enemy
aims at a lie: you moved, and they did not notice. It costs nothing and changes every enemy's targeting
decision, which is the god of the rumour doing on the battlefield exactly what she does in a city.

#### Open

- **None of the 48 is simulated.** The simulator has one hero, so the four that most obviously need a
  party — *Shoulder to Shoulder*, *From Behind*, *The Line*, *Never Leave Them* — cannot be measured at
  all yet.
- **Three lean on terrain the simulator does not model**: *The Ground You Chose*, *At Home in the Dark*
  and *Roots*. The rules for difficult ground, shadow and high ground are new (§11) and the map in
  [../sim/](../sim/) is still open ground.
- **[OPEN]** Whether a character may **keep** an earlier tactic by spending a node on it. The rule
  above replaces; a minor node that preserves the old one is the obvious variant and it is not written.

---

## 3. Minor-node content  **[DRAFT]**

The 48 above are the titles. **Most of a character is the nodes in between**, and §1.5 says what
those hand out: a card, a skill card, a training, a know-how, a feature, a prune, a deck cap, a
spell slot, Health, a rest token.

**This is written as pools, not as assignments**, because the graph does not exist yet
([leveling.md](leveling.md) §10). A pool is a set of cards the minor nodes along a branch draw
from; when the graph is authored, a node's `grants[]` names one. That is also the only form that
survives [leveling.md](leveling.md) §8 — an add-on hangs new nodes off an existing one and must be
able to grant content without core re-releasing anything.

Everything here obeys §1.1 (one card, one gift) and §1.3 (one rung of the cost ladder). A blank cost
column means the card is a re-arrangement of verbs you already have, which is free.

### 3.1 The common pool — six cards

Any Way's minor nodes may grant these. **They are deliberately dull**, and that is their job: they
are the backbone §1.5 asks for, and a Signature only feels like a Signature against a background of
ordinary improvement.

| Card | ▲ Primary | ▼ Secondary | ⚡ Reaction | Cost |
|---|---|---|---|---|
| **Off-Hand Blow** | ⚔ Strike | ⚔ Strike −1 | – | – |
| **Measure** | ⚔ Strike +1 | 👣 Move 1 | Parry | – |
| **Hold the Line** | 🛡 Defend | ⚔ Strike −1 | Parry | – |
| **Press** | ⚔ Strike, then 👣 Move 1 | 👣 Move 2 | Sidestep | – |
| **Both Hands** | ⇄ Ready, then ⚔ Strike | ⇄ Ready | Use | – |
| **Dig In** | ✚ Heal 2 | 👣 Move 1 | Brace | 🔥 **Spent** |

**Off-Hand Blow is the one that answers an open question.** Core-rules §3 asks where
Strike-on-a-secondary cards come from and [leveling.md](leveling.md) §4 promises the answer is here:
they come from the common pool, at **−1**, as the first ordinary card a fighter of any Way is
handed. The −1 is what keeps it from making plain *Strike* obsolete.

**Dig In is the deck's second and last Spent card.** §1.3 caps a 16-card deck at two and the Warrior
already carries *Second Wind*, so taking this one spends the ceiling. That is the decision, and no
branch should offer a third.

### 3.2 Way of Strength — fourteen cards

Weight, armor, Block, adjacency and the Wound threshold are the levers the **major** nodes own
([specializations.md](specializations.md)); these touch them without taking them.

| Card | ▲ Primary | ▼ Secondary | ⚡ Reaction | Cost |
|---|---|---|---|---|
| **Shoulder Check** | ⚔ Strike | **Off-Balance (1)**, adjacent | – | – |
| **Shield Bash** | ⚔ Strike, no damage: **push 2** and step into the square it left | 👣 Move 1 | Block | – |
| **Hammerblow** | ⚔ Strike — **+2** vs **Off-Balance** | 👣 Move 1 | – | – |
| **Sweep the Leg** | ⚔ Strike · **Prone (1)**, resist 🌀 5 — **9** vs **Off-Balance** | 👣 Move 1 | – | – |
| **Overbear** | **Grappled (2)**, resist ✊ 5 — **7** vs **Off-Balance** | 👣 Move 1 | – | – |
| **Shield Wall** | 🛡 Defend | 🛡 Defend, and one adjacent ally gains Block 1 | Block | – |
| **Set Spear** | 🛡 Defend | 👣 Move 1 | an enemy ending its move adjacent takes your Strike | – |
| **Two-Hand It** | ⚔ Strike +2 — both hands | ⇄ Ready | – | – |
| **Heave** | 👣 Move 2, carrying any weight without being Slowed | ⇄ Ready | – | – |
| **Armoured Advance** | 👣 Move 3; your armor counts **+1** until your next turn | 👣 Move 1 | Brace | – |
| **Pull Them Down** | ⚔ Strike | ⚔ Strike −1 vs a **Prone** or **Grappled** target | – | – |
| **Beat the Blade** | ⚔ Strike · on a hit, **Disarmed (1)**, resist ✊ 5 | 👣 Move 1 | – | – |
| **Roar** | every adjacent enemy is **Compelled (1)**, resist 👑 5 | 👣 Move 1 | – | ⤵ **Strain 1** |
| **Walk It Off** | ✚ Heal 2 · ⛓ **Shake Off 2** on yourself | 👣 Move 1 | Brace | 🔥 **Spent** |

> **Overbear may be the strongest card in this document, and the saving throw is what carries it.**
> Grappled (2) costs its victim **18.3 points of win rate** against a mixed group — two damage rungs
> ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §7) — because blocking 👣 Move is
> blocking the most valuable thing a figure does. At a Normal 5 it lands often enough to be worth a
> card and not often enough to be the only card, which is the band a save is for. Against
> **Off-Balance** it goes to Hard 7 and that is a two-card play earning a two-rung effect.

Three of those read **Off-Balance** and each reads it a different way — more damage, a harder save on
a condition the card was already attempting, and the same again on a longer condition. That is the
whole of §1.6's reader table, deliberately, so the band has three worked instances rather than an
assertion.

### 3.3 Way of Shade — thirteen cards

| Card | ▲ Primary | ▼ Secondary | ⚡ Reaction | Cost |
|---|---|---|---|---|
| **Call the Shot** | ⚔ Strike | **Marked (1)** on any enemy you can see | – | – |
| **Between the Plates** | ⚔ Strike — vs **Marked**, ignores armor | 👣 Move 1 | – | – |
| **Take the Shot** | ◎ ⚔ Strike +1 — ⊕ vs **Marked** | 👣 Move 2 | – | – |
| **Pin the Shadow** | ◎ ⚔ Strike · **Slowed (1)**, resist 🌀 5 — **7** vs **Marked** | 👣 Move 1 | – | – |
| **Cut and Run** | ⚔ Strike, then 👣 Move 2 | 👣 Move 1 | – | – |
| **Light Feet** | 👣 Move 3, ignoring difficult ground | 👣 Move 2 | Sidestep | – |
| **Slip the Knot** | 👣 Move 2 | ⛓ **Shake Off 1** on yourself | Sidestep | – |
| **Roll With It** | 👣 Move 3 | 👣 Move 2 | Sidestep 2, and you may end next to a different enemy | – |
| **Second Knife** | ◎3 ⚔ Strike with a *Light* item | ⚔ Strike −1 | – | – |
| **Mock** | **Dazed (1)**, resist 👑 5 | 👣 Move 1 | – | – |
| **Sleight** | 🧪 Use a belt item, then ⚔ Strike | ⇄ Ready | Use | – |
| **Vanish** | **Invisible (1)** on yourself | 👣 Move 2 | – | ⤵ **Strain 1** |
| **Smoke and Go** | **Invisible (1)**, then 👣 Move 2 | 🧪 Use | – | 🔥 **Spent** |

**Call the Shot is the best setter in the game, and it should be**, because it is the only one that
works **at any range**. Strength shoves what it can reach and Faith names what it can see, but a
Shade marks across the battlefield — the Way's whole claim on Position, made into one secondary
half.

**Between the Plates is one of the four unbanded readers** (§1.6). *Ignores armor* is worth a great
deal against an ironclad and nothing at all against a goblin, so its value is set by the **target**
rather than by the card, and no band can price it. It is the one card in this section most worth
simulating.

### 3.4 Way of Mind — the twelve schools

**Strength is the slot cost** (§1.4), so the bracketed number is what a formula takes out of the
budget. The Signature from §2.3 is listed first in each school and marked ✦.

#### The principle: a school is its price

> **What makes a formula belong to its school is not what it does. It is what it costs.**

A Blood spell and an Elemental spell can deal the same damage at the same range; what makes one
unmistakably Blood is that it was paid for in **Health**. Every school in the world document states a
price ([specializations.md](specializations.md) §2), and the price is the most distinguishing thing
each one has — far more than its element, which is why two schools can both throw fire.

**Half the prices had never been charged.** Writing these lists began with that audit:

| Price | Charged in a written formula? |
|---|---|
| **Health** — Blood | ✔ *Blood Price*, *Boil*, and now *The Second Heartbeat* |
| **A bound Taint (mind)** per formula — Necromancy | ✔ *Grave Chill* |
| **A permanent Wild card** per formula — Shadow | ✔ *Step Through*, *Longer Shadow* |
| **A secret the GM holds** per formula — Tattoo | ✔ *Graven Strength*, *Graven Eye* |
| **Spent** — Ward | ✔ *Unmake* |
| **Money and materials** — Elemental | ✗ → now *The Reagent Cost* rule below |
| **Skill cards set aside, equal to the strength** — Poison | ✗ → now charged on every Poison formula |
| **An elven debt** — Glamour | ✗ → now charged, and two spells were charging **Tattoo's** price by mistake |
| **Parts of your body** — Asceticism | ✗ → now *The Price Paid* |
| **A pact with a minor god** per formula — Spiritualism | ✗ → now the pact *is* the spell |
| **Negotiation with elf-kin** — Household | ✗ → an obligation per formula |
| **Someone else's turn, and a prophecy** — Divination | ✗ → now *The Long Look* |

**Six formulas a school at least, with every strength from 1 to 5 present in each** — eighty-five
in all. Two tests, and all twelve schools pass both:

- **A first Way of Mind node grants 2 slots** (§1.4), so a two-slot caster must be able to prepare
  something from *this* school on their first day. That is what the **1** and the **2** are for.
- **A branch has to be worth walking to the end**, which is what the **5** is for: the school's
  thesis, and the argument for choosing it at all.

Elemental, Poison, Glamour and Ward run longer because earlier passes needed them; the thin ones were
filled rather than making the fat ones fatter.

> **The 3s were the last rung written, and only because a check asked for them.** Seven schools had a
> 1, a 2, a 4 and a 5 and no **3** at all — the band §1.4 describes as *a condition that lasts, a heal
> that saves someone, or an area that decides a corner of the map*. Nobody would have noticed by
> reading: a gap in the middle of a ladder is invisible in a way a gap at the end is not.

#### What a 4 and a 5 are

Every school now has both, and they are not simply bigger. The distinction falls out of the **slot
budget** rather than being invented:

> **A strength-4 is the biggest thing you can cast and still have a second spell. A strength-5 is the
> spell you brought instead of a kit.**

A mature caster with six slots prepares a 4 and a 2, or a 5 and nothing worth the name. So:

| | §1.4 says | And therefore |
|---|---|---|
| **4** | *changes the fight for a round* | one round, one big effect, and you still have an answer to something else |
| **5** | *once in a fight, and the reason the branch exists* | **the school's thesis** — the argument for walking this branch at all |

**"Once in a fight" needed no new rule.** A spell is a slate, and slates already carry the
drain-and-recharge machinery (core-rules §4): a strength-4 or -5 formula is **active**, is Drained
when cast, and recharges on `combat`. That was built for item abilities and fits this exactly — the
system has had the mechanism since before there were spells to put it on.

**And the slot cost is the real limiter**, not the recharge. A 5 fills a whole budget, so a caster
who prepares one has prepared one thing. That is the point of a thesis.

---

#### Blood Magic — Tempo, paid in Health

| Formula | Str | Effect |
|---|---|---|
| ✦ **Blood Price** | 2 | ⚔ 4 at ◎3, ignoring armor. Costs **2 of your own Health**. |
| **Open the Vein** | 1 | ◎2 · ⚔ 3, ignoring **Block**. Costs **1 Health**. |
| **Boil** | 3 | **Burning 3 (2)**, resist ✊ 7. Costs **2 Health**. |
| **The Second Heartbeat** | 3 | 🔥 **Spent**: play a **second primary** this turn. Costs **4 Health**. |
| **The Red Hour** | 4 | Until your next turn, every ally within 2 may play a **second secondary** each turn. Costs **1 Health per ally**. |
| **The Last Drop** | 5 | Take your **whole turn again**, now — a fresh primary and secondary. Costs **half your current Health, rounded up**. |

**The Second Heartbeat is what Tempo means**, and it is the only card in the game that grants an extra
primary. It is priced like it: three slots, Spent, and a third of a starting character's Health. Blood
Magic buys time with blood, and nothing else can buy time at all.

#### Necromancy — Preparation, paid in a bound Taint per formula

| Formula | Str | Effect |
|---|---|---|
| ✦ **Call the Unquiet** | 3 | A corpse within 2 rises and fights for you until the fight ends. |
| **Grave Chill** | 2 | ✵ Aimed 2 · **Dazed (1)**, resist ✊ 5. |
| **The Long Preparation** | 1 | Before a fight, name one enemy type. Your ✦ Casts against it are **+2** for the whole fight. |
| **Ask the Dead** | 1 | Out of combat: a corpse answers **three questions** truthfully, as far as it knew. |
| **The Risen Rank** | 4 | **Every** corpse within 3 rises and fights for you for one round, then falls. |
| **The Grave's Bargain** | 5 | A **dead ally** stands up at 1 Health until the fight ends, then is dead again. You gain **one bound Taint for every round they stood**. |

**Every formula here costs a bound Taint (mind) card, permanently** — a hole in the deck you play from
that no cure lifts (core-rules §8). So a necromancer's list is short because they *cannot afford* a
long one: four formulas is four Taint, and **three is Afflicted**. The school prices itself.

#### Elemental Magic — Position, paid in money and materials

| Formula | Str | Effect |
|---|---|---|
| ✦ **Wall of the Sphere** | 2 | A 3-square line of your element: cover, and difficult ground, until your next turn. |
| **Rain** | 2 | ✸ Blast 3, ◎4. Everything in it is **Wet (1)**. No damage, no save. |
| **Lightning** | 2 | ✦ ◎4 · **Stunned (1)**, resist 📜 7 — **9** and **+2** vs **Wet** |
| **Frost** | 1 | ◎3 · **Slowed (1)**, resist 🌀 5 — against a **Wet** target, **Frozen 2 (1)** instead, no save |
| **Scorch** | 1 | ✦ ◎4 · **Burning 1 (1)**. A **Wet** or **Frozen** target sheds it. |
| **Flesh of the Earth** | 2 | ✦ ◎3 · **Burning 1 (2)** and ⚗ **Corrode 1**. Acid: it eats the armour as well as the man. |
| **Slippery** | 1 | ⛓ End **Grappled** on an ally at ◎2. Until your next turn they cannot be Grappled again. |
| **The Sphere Entire** | 4 | A 5-square area of your element: difficult ground, cover, and **2 damage** to anything in it at the start of your turn. |
| **The Standing Flood** | 3 | A 3-square area becomes deep water: everything in it is **Wet (2)**, and its Move is halved while it stays. |
| **Unmake the Ground** | 5 | Name a line across the battlefield. It is **impassable** for the rest of the fight — to everyone, you included. |

> **The reagent cost.** Elemental Magic is the one school that pays in **coin**, which no other
> mechanic in the game touches — and [leveling.md](leveling.md) §4 is explicit that *gold is not a
> reward*, so it cannot be a levelling price either. It is a **per-preparation** cost instead: an
> elementalist spends materials when they prepare, which is a downtime expense the GM prices, and a
> broke elementalist prepares nothing. That is the one price in the twelve that bites between fights
> rather than during them, and it is why this school is the one a rich patron is worth having.

#### Poison — Control, paid in skill cards set aside

| Formula | Str | Effect |
|---|---|---|
| ✦ **Wither** | 2 | **Poisoned 1 (2)** on one target, resist ✊ Might 5 — Dazed, and 1 a turn past armor. |
| **Slick** | 1 | ◎3 · **Off-Balance (1)**. No save. |
| **The Quick Dose** | 3 | **Poisoned 2 (2)** on one adjacent target, resist ✊ 7. |
| **The Long Dose** | 1 | **Poisoned 0 (3)** on one target at ◎2, resist ✊ 5. No damage — three rounds of a man who cannot use his off hand. |
| **The Grey Sickness** | 2 | ☣ **Tainting 1, slow** on one adjacent target, resist ✊ 7. Not a poison: a **disease**, still there next week. |
| **The Shared Cup** | 4 | ✵ Aimed 3 · **Poisoned 1 (3)** on everything in it, resist ✊ 7. |
| **The Kingmaker's Draught** | 5 | One target is **Poisoned 3 (3)**, no save. **If it dies while poisoned you set aside no skill cards at all** for this formula. |

> **Every one of these costs skill cards set aside equal to its strength, until the next rest.** That
> is the school's price and it is the sharpest in the twelve: a poisoner buys control of a fight by
> giving up competence *outside* it. Prepare *The Quick Dose* and three skill cards are gone — the
> lockpicking, the lying, the reading of a room. **Poison is the school that makes you worse at
> everything else**, which is exactly right for it and costs the rules nothing to say, because the
> skill deck is already a deck that can be short ([skill-rules.md](skill-rules.md)).

#### Glamour — Control, paid in an elven debt

| Formula | Str | Effect |
|---|---|---|
| ✦ **Not Here** | 2 | You are **Invisible** until you attack or are attacked. |
| **Wrong Face** | 2 | **Dazed (2)**, resist 👁 7. |
| **The Evil Eye** | 2 | **Cursed** on one target you can see — a temporary Miss in its fate deck, until drawn. |
| **Ink Spray** | 1 | ✸ Blast 2: end **Invisible** on everything in the area, and nothing in it may become Invisible until your next turn. |
| **A Clear Head** | 1 | ⛓ End **Dazed** on an ally at ◎3, and they may play a secondary this turn even if they already have. |
| **The Crowded Room** | 4 | Until your next turn, every enemy attacks a **random** figure within its reach — friend or foe, chosen by a fate draw. |
| **The Face of a Friend** | 3 | One enemy treats you as an ally — it will not attack you, and will take a hit for you — until you attack it. |
| **The Long Masquerade** | 5 | Out of combat: you and your whole party appear to be **other people** for a day. Only magic sees through it. |

> **[FIXED] Two of these were charging the wrong school's price.** *Wrong Face* and *The Evil Eye*
> both read *"the GM writes down a secret"*, which is **Tattoo Magic's** price. Glamour pays an
> **elven debt, as an obligation** — one debt per formula learned, written by the GM and not
> removable (leveling.md §4). The elves do not want secrets; they want to be owed.

#### Tattoo Magic — Deck shape, paid in a secret per formula

| Formula | Str | Effect |
|---|---|---|
| ✦ **Graven Strength** | 1 | Permanent: **+2 Strike with Heavy items**. |
| **Graven Eye** | 1 | Permanent: you are never surprised. |
| **Graven Shield** | 2 | Permanent: **+1 armor**. |
| **Graven Road** | 1 | Permanent: your Move is **never halved** — Slowed, Burdened and Overloaded do not slow you. |
| **Graven Armour** | 4 | Permanent: **+3 armor** — and you count as **Burdened** always, whatever you carry. |
| **Graven Heart** | 3 | Permanent: **+6 max Health**. The GM writes down a secret worth that much. |
| **The Whole Skin** | 5 | Permanent, and it is the last thing you ever learn: **+2 Strike, +2 armor, +4 Health**, and Burning never lands on you. You may never prepare another spell. |

> **A tattoo spends its slots permanently, and is never prepared.** This is the school's whole shape
> and it is what its axis means: **Deck shape** is capacity, and a tattoo takes capacity away for
> good. Carve *Graven Shield* and two slots are gone from your budget forever — but it is always on,
> every fight, with no preparation and no casting. The others are spells you *choose* each morning;
> a tattoo is a spell you *became*.
>
> **And it is the right home for an always-on counter.** Simulation found that a dispel on a drawn
> card is nearly worthless because it is in hand 31% of turns
> ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md)) — so *Graven Road*, which answers
> Slowed by simply never being slowed, is worth more than any card that sheds it.

#### Asceticism — Deck shape, paid in parts of your body

| Formula | Str | Effect |
|---|---|---|
| ✦ **Nothing Left to Take** | 1 | While your **hand is empty**, you cannot be reduced below 1 Health. |
| **Empty Hand** | 1 | While your hand is empty you may ⚔ Strike with no item, at your own ✊ Might. |
| **Nothing to Carry** | 1 | While both your hands are empty: **+2** to all ✦ Casts, and you cannot be **Disarmed**. |
| **The Last Card** | 2 | While your hand is exactly **one** card, you may play that card for **both halves**. |
| **The Empty Deck** | 4 | While your hand **and** your draw pile are both empty, you cannot be harmed at all. |
| **The Hand Given** | 3 | Permanent, and it costs **a hand**: your bare Strike counts as a **Heavy** weapon at **Strike 4**, for ever. |
| **Nothing At All** | 5 | Permanent. Your action deck becomes **4 cards**: you hold all four every turn and may play any two halves from them. Costs **a hand**. |

> **The Price Paid.** Asceticism costs *parts of your body*, which the world document means
> literally — and it is the only price that is **not renewable**. One formula is a finger, and the GM
> writes which; a hand has five. The mechanical bite is the same one everything else in this school
> turns on: fewer hands is fewer items, which is fewer cards worth playing, which is the empty hand
> these formulas reward. **The school is paid for in the condition it exploits**, and nothing else in
> the twelve closes that loop.

#### Shadow Magic — Position, paid in a permanent Wild card per formula

| Formula | Str | Effect |
|---|---|---|
| ✦ **Step Through** | 2 | Teleport to any shadowed square you can see. |
| **Longer Shadow** | 1 | Until your next turn every square adjacent to you is shadowed. |
| **The Long Step** | 1 | 👣 Move 4, through anything, if you begin and end in shadow. |
| **Cast No Shadow** | 2 | Until your next turn, nothing further than **1 square** away can target you at all. |
| **The Shadow Road** | 4 | You and every ally within 1 teleport to any shadowed square on the map. |
| **The Borrowed Dark** | 3 | Until your next turn, **every square on the map is shadowed** — for your allies as much as for you. |
| **Become the Shadow** | 5 | Until the fight ends you are in every shadow at once: Strike from any shadowed square, and nothing can target you. **Five** Wild cards join your fate deck, for good. |

> **Each formula puts a permanent Wild card in your fate deck** — one you did not choose, in the deck
> you draw luck from, for good (core-rules §6). Four formulas is four Wild cards in twenty-four, so a
> shadow mage's luck gets stranger the more they know. *Cast No Shadow* is the Position answer rather
> than another Invisible: it does not hide you, it puts the world out of reach.

#### Spiritualism — Preparation, paid in a pact per formula

| Formula | Str | Effect |
|---|---|---|
| ✦ **The Bargain** | 3 | A minor god acts once this fight. **The GM decides how**, and that is the point. |
| **The Small Pact** | 1 | Name one god you are pacted with. It grants **the favour written on the pact** — the same favour every time. |
| **Hold to the Bargain** | 2 | ⚡ Reaction: an ally's failed check becomes a **Partial**. Once per pact per fight. |
| **The Nine Names** | 1 | Out of combat: a minor god names **who in this place it is angry with**, and will not say why. |
| **The Gathered Pact** | 4 | **Every** god you are pacted with grants its written favour, this turn. |
| **The Great Bargain** | 5 | A minor god becomes **present**. The GM plays it as an ally for the rest of the fight, and afterwards it takes something the GM chooses. |

> **The pact *is* the spell, and that is how this school avoids being one card twelve times.** *The
> Bargain* leaves everything to the GM, which is wonderful once and arbitrary twice — so every other
> formula here leans on a **pact written down once**: the god, the favour, and what it wants back. The
> favour is fixed from then on, so *The Small Pact* is a different spell for every character who takes
> it and the same spell every time *they* cast it.
>
> **[OPEN]** The minor gods themselves. The world document says they *"grant no miracles, but they are
> the basis of the Spiritualism school"* and does not name them. Until it does, a pact is the GM's to
> write, which is workable and is not the same as finished.

#### Household Magic — out of combat, paid in negotiation with elf-kin

| Formula | Str | Effect |
|---|---|---|
| ✦ **Hearth and Home** | ritual | A camp nobody unfriendly can find, for one night. |
| **The Clean Pot** | 1 | Food never spoils and water is always safe. A day's rations for the party, every day. |
| **The Mended Seam** | 1 | Repair one item overnight — including **corroded armour** (core-rules §8). |
| **The Unlatched Door** | 2 | Any door or lock that was ever opened by someone who lived there opens for you. |
| **The House That Was** | 4 | Overnight, a ruin becomes a house: warm, defensible, and the party rests as though in a town. |
| **The Long Table** | 3 | One meal, taken together: the party sheds **every Wound** and all rest tokens return. Once a day, and the elf-kin keep the tally. |
| **The Door Home** | 5 | A door you have opened before becomes a door to **any other** door you have opened before. Once a day, and the elves count it. |

> **The one school with no combat value at all**, and it is worth having anyway: it answers starvation,
> pursuit, and the one kind of damage nothing else repairs. **The Mended Seam is the repair side of
> acid** — core-rules §8 says corrosion needs *"a smith and coin, or a Lore check with the right
> tools"*, and this is the third way. A party that travels with a household mage is a party that does
> not lose its armour to the first acid monster.

#### Ward Magic — Reactions, paid in Spent

| Formula | Str | Effect |
|---|---|---|
| ✦ **Unmake** | 2 | ⚡ Reaction — 🔥 **Spent**: a ✦ Cast **you have survived before** does not resolve. |
| **Turn Aside** | 2 | ⚡ Reaction: one ally's Block counts **double** against this attack. |
| **The Shut Mouth** | 2 | **Silenced (1)** on one enemy at ◎3, resist 📜 7. |
| **Shake It Off** | 2 | ⚡ Reaction: ⛓ **Shake Off 3** on one ally at ◎3 — which ends anything the game can print. |
| **The Unbound Tongue** | 1 | ⛓ End **Silenced** on an ally at ◎3. |
| **The Standing Ward** | 4 | 🔥 **Spent**: until your next turn **no ✦ Cast resolves at all**, anywhere on the field — including yours. |
| **The Mirror** | 3 | ⚡ Reaction — 🔥 **Spent**: a ✦ Cast aimed at you resolves against **its own caster** instead. |
| **The Broken Word** | 5 | 🔥 **Spent**: one spell or miracle is **unlearned by its caster** for the rest of the day. They still have the slot; they no longer have the words. |

> **Ward decides whether magic happens**, in both directions: it silences and it unsilences, it
> prevents a Cast and it removes what landed. And it is the school simulation vindicated — a dispel on
> a **reaction spell** is prepared rather than drawn and costs no half, which is the only surface a
> dispel is worth putting on ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md)).

#### Divination — Support, paid in someone else's turn and a prophecy

| Formula | Str | Effect |
|---|---|---|
| ✦ **The Reading** | 2 | **Read 3** (core-rules §6) on any one fate deck **except your own**. |
| **Where It Will Land** | 1 | **Read 1** on your own fate deck. |
| **The Mark of Things to Come** | 2 | **Marked (1)** on an enemy at any range, and **Read 1** on its fate deck. |
| **The Long Look** | 3 | Out of combat: ask the GM **one question** about the next scene. The answer is true — **and the GM writes a prophecy** you do not get to read. |
| **The Open Book** | 4 | Until your next turn every ally draws fate with **advantage**, and you may **Read 2** on each of their decks. |
| **The Whole Thread** | 5 | Before the fight, the GM shows you the enemy's **intent cards for the whole fight, in order**. The GM writes **three** prophecies. |

> **The prophecy is the price, and it is the only one that is paid later.** *The Long Look* buys a
> true answer now and hands the GM something to spend on you whenever they like. Every other school's
> price is a thing you give up at the moment of learning or casting; a diviner's is a thing that
> happens to them.

### 3.5 Way of Faith — the twelve gods

Clerics cast too, and a god's list is built on a different principle from a school's:

> **A school is what it cost you to *learn*. A god is what it costs you to *ask*.**

A formula is paid for once, when you learn it, in Health or Taint or a secret (§3.4). A miracle costs
**nothing** to learn — a god grants it — and is paid for **every time**, in that god's own coin. That
is §1.4's *"Faith pays continuously in obedience"* made into a mechanic, and
[specializations.md](specializations.md) already wrote each god's coin: deck size, weight, the fate
deck, Strain, Spent, an ally, a turn spent early, range, Taint, halves, Health, spell slots.

**So each god below opens with its Obedience, which applies to every miracle it grants.** That is
better than printing a cost on each card, because obedience is not a price you pay at a moment — it is
a way you have to live. It is also what makes twelve gods twelve *different kinds of caster* rather
than twelve lists of effects: a priest of Vax bleeds to cast, a priest of Brendan is always a turn
behind, and a priest of The Yellow is holding something up with every secondary they have.

**A god's list is shorter than a school's on purpose** (§1.4), and every god has its **4** and its
**5** — except **The First**, whose Obedience caps its slots at 3 and therefore caps its ladder;
see below, because that is the point of it rather than a gap.

The two bands mean the same here as in §3.4 — a 4 changes the fight for a round, a 5 is the god's
thesis — but a god's 5 reads differently, because the obedience is paid *again* for it. A priest of
Vax does not spend slots on *The Sixth District* so much as agree to take the whole party's wounds.

---

#### The Eternal God — Control, and the clean body

> **Obedience: your action deck may hold no more than 12 cards**, and the faith names what may not be
> in it. The one god whose coin is **deck size**, which simulation says is survivable precisely
> because a 12-card deck pruned *well* matches a full 16 ([leveling.md](leveling.md) §4) — so this
> obedience is a demand to prune well, and punishes a priest who cannot.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **The Clean Hand** | 2 | An ally's next check or attack **cannot fail**. One cheaper on a brother or sister in faith. |
| **Name the Guilty** | 1 | **Judged (1)** on one enemy you can see. No save. |
| **The Weight of It** | 2 | A **Judged** enemy's armor counts **0** against everyone until your next turn. |
| **The Narrow Path** | 1 | While your action deck is **10 cards or fewer**, your miracles cost **1 slot less** (minimum 1). |
| **The Clean Field** | 4 | Until your next turn, **no enemy may play a secondary**. |
| **The Body Made Clean** | 5 | Every ally is healed to full and every condition on them is **Lifted and Shaken off entirely**. Your action deck is **6 cards** for the rest of the day. |

**The Narrow Path is the obedience turned into a reward**, which is the shape an ascetic faith should
have: go further than you were told and the god pays you back.

#### The Eternal Spirit — Reactions, and the unseen

> **Obedience: you must stay Unburdened** — never over your carry limit — and you may wear no armour
> heavier than Leather. The spirit drifts through all the air and carries nothing that anchors it.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **Breath of the Spirit** | 2 | ⚡ Reaction: heal an ally **3**, at any range, ignoring cover. |
| **Lay On** | 1 | ✚ Heal an ally 2 at ◎3. |
| **A Word for You** | 1 | **Blessed** on one ally — a temporary Critical in their fate deck, until drawn. |
| **Bear It for Them** | 2 | ⚡ Reaction at ◎3: move one condition off an ally and **onto yourself**, at its full duration. |
| **A Word Withdrawn** | 1 | ✋ **Lift** **Blessed** or **Cursed** from anyone at ◎3 — the marker and the card both. |
| **The Air Between** | 4 | Until your next turn, every ally may take **one extra reaction** per trigger. |
| **Breath for the Dying** | 5 | Every ally at 0 Health stands at **half** Health. You may carry **nothing at all** for the rest of the day. |

**The longest list of the twelve, and it should be**: this is the god of the two tolerant churches and
the only one whose whole register is helping other people. Its obedience is the lightest to describe
and the heaviest to keep, because a healer who may not wear armour stands where the healing is needed.

#### Sessyfyn — Support, and the sea is not fair

> **Obedience: a permanent Miss *and* a permanent Critical in your fate deck.** Not one or the other.
> Your luck is wider than anyone's in both directions, for as long as you serve her.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **The Tide Knows** | 2 | An ally draws fate **twice** on their next action and keeps **both**. The sea is not fair. |
| **Undertow** | 2 | ✸ Blast 2, ◎3: **Wet (1)**, and every target is moved 1 square you choose. |
| **The Turning Tide** | 2 | ⚡ Reaction: an ally redraws a fate card and must keep the second. **A temporary Miss joins your own fate deck.** |
| **The Spring Tide** | 4 | Until your next turn, **every ally** draws fate twice and keeps both. |
| **The Sea Decides** | 5 | Shuffle every fate deck on the field into **one**. For the rest of the fight, everyone draws from it. |

**Sessyfyn is the only god who pays in luck**, and *The Turning Tide* charges it where it is felt: you
fix somebody else's draw by spoiling your own. Note that her obedience makes her priest the one
character in the game for whom **a reshuffle is likelier than anyone else's** — two of the three
reshuffle cards are hers by standing order.

#### Valtor — Tempo, and the body made a weapon

> **Obedience: every miracle costs Strain 1** on top of its slots. His strength comes out of your
> hand, every time you ask.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **The Drum** | 1 | Your next Strike this turn is **+3**. |
| **No Step Back** | 2 | Every ally within 2 gains **Block 2** until your next turn. |
| **The Charge** | 2 | ⤵ **Strain 2**: every ally within 2 may **Move their full value**, at once, now. |
| **The War Drum** | 4 | ⤵ **Strain 3**: every ally within 2 takes their **whole turn again**, now. |
| **Valtor's Own** | 5 | ⤵ **Strain your entire hand**: for the rest of the fight you play a primary **and two secondaries** each turn. |

**Valtor is the Tempo god and Strain is the Tempo coin** — it takes cards out of your hand *now*,
which is a tax on the turn rather than the fight (§1.3). *The Charge* pays double because moving the
whole party out of turn is the largest tempo swing in the Way.

#### Fagar — Control, and the trick that works once

> **Obedience: each miracle may be cast once per fight.** A trick works once. There is no second
> borrowed face.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **The Borrowed Face** | 3 | 🔥 **Spent**: one enemy spends this round attacking **its own ally**. |
| **The Second Thought** | 1 | One enemy spends its secondary this round doing nothing, resist 👑 7. |
| **The Second Face** | 1 | 🔥 **Spent**: read one enemy's **intent card** for this round before anyone acts. |
| **The Mask of the Captain** | 4 | One enemy obeys you for a round — **you play its turn**. |
| **Everyone Wears His Face** | 5 | Until your next turn no enemy can tell friend from foe: **every enemy attack targets another enemy**. |

**Fagar's obedience is the only one that is also a flavour of its own effects** — the god of the trick
that works once grants miracles that work once, so the price and the fiction are the same sentence.

#### Vulpet — Preparation, and the outcast

> **Obedience: you may not accept help.** No ally may Heal you, Interpose for you, or Shake a
> condition off you. She was driven out by everyone; nobody will stand beside you either.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **The Outcast's Due** | 3 | Every enemy adjacent to you is **Compelled (2)**, resist 👑 Presence 5. The outcast is who the crowd turns on. |
| **Nobody's Friend** | 2 | Until your next turn no ally may Heal, Interpose for, or redirect a hit from one enemy. |
| **Alone on the Road** | 1 | While **no ally is within 2 squares**, heal **2** at the start of your turn. |
| **The Driven Out** | 4 | Every enemy within 3 is **Compelled (1)** to attack you — and you gain **Block 3** for each one that is. |
| **The Land Beneath** | 5 | The ground opens. Every enemy within 2 is **gone from the fight** until the start of your third turn. You are **Prone**, and alone, when they come back. |

**Vulpet's obedience is the harshest in the Way and her miracles are built to repay it**: *Nobody's
Friend* does to an enemy exactly what the god does to you, and *Alone on the Road* is the only healing
a priest of hers can ever receive — her own, and only when standing apart.

#### Brendan — Support, and growth out of barren ground

> **Obedience: nothing he gives arrives on the turn you ask for it.** Every miracle resolves at the
> **start of your next turn** at the earliest, and the card says if it is later still.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **Out of Barren Ground** | 3 | Plant it. At the start of your **second** turn after, every ally within 2 heals **4**. |
| **Full Belly** | 1 | Out of combat: the party's next rest returns one extra rest token. |
| **The Slow Mercy** | 2 | Name an ally. At the start of your **third** turn after this, they are healed to full. |
| **The Orchard** | 4 | At the start of your **second** turn after, every ally heals **4** and sheds one condition. |
| **What Grows Out of Us** | 5 | At the start of your **fourth** turn after, every ally — **including the dead** — stands at full Health. |

**The Slow Mercy is the largest heal in the game and it is three turns away**, which is the whole of
Brendan: nothing he gives is fast, and what he gives is worth waiting for. A fight that ends in two
rounds wastes it entirely, and that is the risk the priest takes when they cast it.

#### The Grey — Reactions, and the silent approach

> **Obedience: adjacent only.** Every miracle of The Grey reaches one square and no further. Close
> enough to touch, which is where the knife is.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **The Silent Hour** | 2 | ⚡ Reaction, adjacent: an enemy's action **does not happen**. |
| **Grey Judgement** | 2 | A **Judged** adjacent enemy acts **last** in the round, whatever its initiative. |
| **The Close Work** | 2 | ⚡ Reaction, adjacent: an adjacent enemy's Strike hits **the nearest other enemy** instead. |
| **The Grey Hour** | 4 | ⚡ Reaction, adjacent: an adjacent enemy's **whole turn** does not happen. |
| **The Silent Knife** | 5 | Adjacent only. One enemy is **dead**. No save, no fate draw, no roll of any kind. |

**Range is the coin and it is paid in risk, not resources** — a priest of The Grey has to be standing
next to the thing they are stopping. It is the one obedience that costs nothing on the sheet and
everything on the board.

#### The Purple — Control, and the dose

> **Obedience: the first miracle you cast each fight gives you 1 Taint.** You are the first to taste
> it, always. Three Taint is **Afflicted** (core-rules §8), so a long day of casting shows on the
> body.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **The First Taste** | 2 | **Tainting 2** on one adjacent enemy. You gain **1 Taint** yourself. |
| **Taste of the Rot** | 1 | One adjacent enemy: 1 damage and **Off-Balance (1)**, no save. You gain **1 Taint** on a Miss. |
| **The Brewer's Tithe** | 2 | ☣ **Tainting 2, slow** on one adjacent enemy — a disease, not a poison, and it is still there next week. |
| **The Poisoned Well** | 4 | ✸ Blast 3 · ☣ **Tainting 1, fast** on everything in it. |
| **The Slow Failure** | 5 | One target gains ☣ **Tainting 3**. You gain **2 Taint** — which with the first taste is **Afflicted**. |

**The Purple is the god of disease rather than poison**, which the condition split makes meaningful:
poison runs out, Taint does not (core-rules §8). Her priests do not win fights, they decide who is ill
next month.

#### The Yellow — Preparation, and the lie

> **Obedience: a lie must be kept up.** Every miracle of The Yellow ends the moment you fail to spend
> a **secondary** on it, and a priest holding two lies has no secondaries left for anything else.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **The Rumour** | 2 | Name a lie before the fight. One enemy type acts as if it were true, for as long as you spend a **secondary** each round keeping it up. |
| **Half a Truth** | 2 | Until your next turn, enemies act as though one ally you name were not there. |
| **The Planted Word** | 1 | Name one enemy type before the fight. While you spend a **secondary** each round, that type cannot play **reactions**. |
| **The Whole Cloth** | 4 | While you spend a **secondary** each round, one **enemy type** believes the party are its own. |
| **The Lie That Held** | 5 | Name a lie before the fight. While you spend a **secondary** each round, it is **true**, and the GM runs the fight as though it always had been. |

> **[FIXED] *Half a Truth* was charging Valtor's coin.** It read *"⤵ Strain 1"*, which is Valtor's
> obedience, not The Yellow's. The Yellow is paid in **halves** — the secondary spent keeping the lie
> alive — and the standing obedience above now charges it, so the card needed no cost of its own. The
> same mistake as Glamour charging Tattoo's secret (§3.4), and found the same way.

#### Vax — Position, and war plainly

> **Obedience: every miracle costs at least 1 Health**, and the card may ask more. War is paid in
> blood and he counts yours first.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **The Club and the Line** | 2 | Strike **every adjacent enemy** — no free hand needed, because the club is the symbol. Costs **2 Health**. |
| **Stand Where I Stand** | 1 | Until your next turn, allies adjacent to you cannot be reduced below 1 Health. Costs **2 Health**. |
| **The Shield Line** | 2 | Every ally **adjacent to you** gains your armor value as **Block** until your next turn. Costs **1 Health per ally**. |
| **The Line Holds** | 4 | Allies adjacent to you cannot be moved, knocked **Prone** or **Compelled** until your next turn. Costs **2 Health per ally**. |
| **The Sixth District** | 5 | Until the fight ends, every ally adjacent to you shares your armor and your Block — and **damage dealt to them is dealt to you instead**. It will cost enough. |

**Every Vax miracle is about a line of men standing next to each other**, which is what his Position
axis means, and every one of them is paid for out of the priest's own body. He is the cleric-fighter
the Way was reshaped to allow, and the one god whose miracles all reward *not moving*.

#### The First — Deck shape, and what does not die

> **Obedience: your spell slots are capped at 3, for ever.** The thinnest miracle list and the
> dearest — few slots, and a deck narrow enough to hold them.

| Miracle | Str | Effect |
|---|---|---|
| ✦ **The Long Night** | 3 | Drain **3 Health** from an adjacent living target and **gain it**. |
| **Measure of the Debt** | 2 | A **Judged** enemy that dies this round: you gain **3 Health**. |
| **What Does Not Die** | 3 | When you would drop to 0 Health, drop to **1** instead — and **lose a spell slot permanently**. |

**A cap of 3 slots means The Long Night and What Does Not Die cannot both be prepared**, and that is
the entire character of this god: you get one great thing at a time. *What Does Not Die* then pays in
the only coin The First accepts, and pays it for good — each time it saves you, there is less of you
left to save with. A priest of The First who has survived four times cannot cast at all.

> **The First is the one god with no strength-4 and no strength-5, and its own Obedience is why.**
> Three slots is the cap, so a 4 would be uncastable and a 5 doubly so — the god that does not die
> cannot be asked for anything great. That is not a hole in the list; it is the obedience biting at
> the top of the ladder as well as the bottom, and it is the sharpest statement of the trade in the
> whole Way: **everything, for ever, and never anything grand.**

### 3.6 Targeted counters — five spells

A generic dispel is not enough, and the reason is the slot budget. **Ward's *Shake It Off* ends
anything for 2 slots**, so if that were the only answer, every caster would prepare it and the
decision would be gone. A **targeted counter** is the other half of the trade:

> **A targeted counter is strength 1 and ends its one condition outright. The generic dispel is
> strength 2 and ends anything.** You pay a slot for breadth — and *the caster who prepared the wrong
> spells has prepared the wrong spells* is the whole point of a slot budget (§1.4).

Each of these also does something the generic one **cannot**, which is what keeps it from being a
worse *Shake It Off*. They are repeated in their schools' lists in §3.4, where their prices are:

| School | Formula | Str | Effect | What the generic cannot do |
|---|---|---|---|---|
| **Elemental** | **Slippery** | 1 | ⛓ End **Grappled** on an ally at ◎2. Until your next turn they cannot be Grappled again. | **prevent** it coming back |
| **Glamour** | **Ink Spray** | 1 | ✸ Blast 2: end **Invisible** on everything in the area, and nothing in it may become Invisible until your next turn. | reach a thing it **cannot target** |
| **Ward** | **The Unbound Tongue** | 1 | ⛓ End **Silenced** on an ally at ◎3. | be cast **by the victim** — see below |
| **Glamour** | **A Clear Head** | 1 | ⛓ End **Dazed** on an ally at ◎3, and they may play a secondary this turn even if they already have. | give the turn **back** |
| **The Eternal God** | **Steady the Hand** | 1 | ⛓ End **Compelled** on an ally at ◎3, and whoever compelled them is **Judged (1)**. | answer **and** accuse |

**Ink Spray is the one the rules wrote rather than me.** Invisible says *enemies can't target you*, so
a dispel that needs a target cannot reach it — the condition forbids the only way in. An **area** is
the sole shape that works, which is why this is a Blast with no target line and why it is worth a
slot despite answering one condition. Core-rules §7 sets out the other three the same way.

**The Unbound Tongue must come from somebody else**, because Silenced blocks ✦ Cast and a silenced
caster cannot cast their own cure. That is not a flaw in the spell; it is the rule that *you cannot
reliably dispel yourself*, printed on a card.

**Every one of these pays its school's price as well**, which §3.4 lists — a Glamour counter costs an
elven debt and a Ward counter is Spent or a slot, and that is as true of a counter as of an attack.

**No spell answers Burning or Frozen**, and none should: water and fire already cancel
([conditions.md](conditions.md) §6), so *Rain* on a burning ally is the counter and it is a spell
somebody already prepared for another reason. A targeted counter for a condition that already has one
is a wasted slot.

> **The item version is cheaper and should exist.** A thrown flask of ink does *Ink Spray*'s job
> without a slot, and oil does *Slippery*'s. Items are not written yet — but the division is the one
> the game already draws: a slate is a thing you carry and can run out of, a formula is a thing you
> know. **[OPEN]**

### 3.7 Can every Way reach a combo? — the audit

An opening nobody can set is a dead keyword, and a Way that can only set and never read has been
handed homework. One row per Way:

| Way | Sets | Reads | Verdict |
|---|---|---|---|
| **Strength** | Off-Balance — *Shoulder Check* | 3, one per band | balanced |
| **Shade** | Marked — *Call the Shot*, at any range | 3 | balanced |
| **Mind** | Wet — *Rain*; plus Off-Balance and Marked for others | 3 of Wet | balanced, and the only Way that sets for every other |
| **Faith** | Judged — *Name the Guilty*; plus Wet — *Undertow* | 3, all party-facing | balanced |

Every Way can set and read its own opening with **two ordinary minor nodes**, so a combo is reachable
long before a title is. That was the thing worth checking: if openings only arrived with a Signature,
nobody would ever see one at a table.

**Nothing in §3 is simulated either.** The four worth it first, each for a different reason:

| Card | Why |
|---|---|
| **Between the Plates** | a reader whose value the target sets rather than the card — the only one of its shape |
| **Sweep the Leg** | two cards for **Prone**, the strongest condition that is not Unconscious |
| **The Weight of It** | armor at 0 for the whole party is the biggest swing any strength-2 spell makes, and armor already behaves like a cliff edge |
| **Off-Hand Blow** | the commonest card this game will ever print, so a −1 that is wrong is wrong everywhere |

---

## 4. Open

- **Nothing here is simulated.** The four Signatures that most need it: **Double or Nothing** (two
  fate cards, both applying, is a new distribution and nothing else in the game does it),
  **Cleave to the Bone** (a Wound threshold at 4 changes how often Wounds enter a deck at all),
  **The Wall** (stacking Blocks against the measured value of a Defend primary) and
  **Nothing Gets Through** (doubled armor against the cliff-edge behaviour armor already has). §3.7
  names the four minor-node cards with the same claim on a simulator.
- **[OPEN]** **How a combo actually performs.** Every number in §1.6's reader table is reasoned from
  the value bands and none of it is measured. The specific question is whether a +2 that costs a
  secondary *and* a draw of the right pair beats simply playing two Strikes — and the answer may well
  be no for one character and yes for a party, which is the whole design but is still a claim.
- **Settled: strength 4 and 5 exist everywhere.** Every school has one of each (§3.4) and every god
  but **The First**, whose Obedience caps its slots at 3 and so caps its ladder (§3.5). *"Once in a
  fight"* needed no new rule either — a spell is a slate and slates already Drain and recharge on
  `combat` (core-rules §4).
- **[OPEN]** **None of the 4s or 5s is simulated, and they are the bands where that matters most.**
  §1.4 calls a 4 *changes the fight for a round* and a 5 *the reason the branch exists*, so these are
  precisely the spells whose being wrong is most expensive. Four to measure first: *The Last Drop* (a
  whole extra turn for half your Health), *The Silent Knife* (one enemy dead, no roll — the only
  effect in the game with no fate draw at all), *The Sixth District* (one character taking the whole
  party's damage) and *Nothing At All* (a four-card action deck, which the deck-size simulation says
  is the most dangerous number to get wrong).
- **Settled: every god has three miracles and a stated Obedience** (§3.5). A god's list stays shorter
  than a school's four, which §1.4 asks for, and the Obedience is what carries the difference: a
  school is what it cost you to learn, a god is what it costs you to ask.
- **[OPEN]** **Frightened**, the mirror of Compelled — *you may not attack the one who frightened
  you*. §1.7 declines it on a count of one interested card against Compelled's four, and core-rules
  §7's resist table anticipates it (*"cowed or compelled"*). If a second card ever wants it, it is
  cheap: one entry, one icon, no new fields.
- **[OPEN]** **How much of a caster's action deck may show ✦ Cast.** Silenced is the only condition
  in the game that can empty a turn, and core-rules §7 now computes the floor: eight of sixteen cards
  need an ordinary primary to make a Silenced turn playable 98.7% of the time. That is a constraint on
  a deck nobody has written yet, and it should be met when it is written rather than discovered after.
- **[OPEN]** The **four unbanded readers** — *Between the Plates*, *The Weight of It*,
  *Grey Judgement*, *Measure of the Debt*. Each pays off in something a band cannot price, which is
  what makes them interesting and what makes them unpriced. Either the simulator settles them or the
  count should come down.
- **Settled: there is no fifth opening.** The argument is in §1.6 — the four are a 2×2 of *state*
  against *call*, the grid is full, and *armour pried open* is already what two existing readers do.
  What stays open is the opposite question: whether **Off-Balance** earns its slot, since its case is
  a pricing one rather than a fictional one.
- **[OPEN]** A **multi-step spell**. The slate carries one effect; *Move, then Strike* exists on cards
  but has no spell equivalent, and *Wall of the Sphere* is already straining against the single step.
- **[OPEN]** **The Rumour** needs the GM-facing half written: what "acts as if it were true" does to
  an intent card is the interesting part and it is not specified.
- **[OPEN]** Whether **The Clean Hand** is too strong at strength 2. *Cannot fail* removes the fate
  draw entirely, which no other miracle does, and the Eternal God is already the most restrictive
  choice in the game.
