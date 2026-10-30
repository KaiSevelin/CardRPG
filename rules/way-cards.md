# Way Cards and Spells (Draft 0.2)

What the nodes hand out. [leveling.md](leveling.md) settles what a level-up *is* and
[specializations.md](specializations.md) settles what the 48 major nodes *are*; this settles the
**content** — the cards, the spells and the miracles that make a node something you can play.

Three parts:

1. **The standard** — value bands, cost budgets, the spell format and how a combo is written, so that
   content written months apart stays comparable and can be balanced as a set.
2. **The 48 Signatures** — one card or feature per major node, the thing each node is named for
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

**A dispel is priced in Shake Off, and the band is narrow** (core-rules §7,
[conditions.md](conditions.md) §9.2):

| Shake Off | Costs |
|---|---|
| **1** | a secondary — free, and the only rung a secondary may buy |
| **2** | a primary, and **Spent** |
| **3** | a strength-2 formula, which is where *ends anything* belongs |

Three is the ceiling because nothing in the game prints a duration above 2, so **Shake Off 3 is
already "remove it"** — and it costs a spell slot and a school to say so. That is the whole reason
the keyword counts down instead of deleting: the strong version is reachable, expensive, and owned.

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

### 3.2 Way of Strength — thirteen cards

Weight, armor, Block, adjacency and the Wound threshold are the levers the **major** nodes own
([specializations.md](specializations.md)); these touch them without taking them.

| Card | ▲ Primary | ▼ Secondary | ⚡ Reaction | Cost |
|---|---|---|---|---|
| **Shoulder Check** | ⚔ Strike | **Off-Balance (1)**, adjacent | – | – |
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

### 3.4 Way of Mind — twenty-two formulas (plus the counters in §3.6)

Beyond the twelve Signatures. **Strength is the slot cost** (§1.4), so the bracketed number is what
it takes out of the budget. Each school's full list is still open; these are its second and third
entries, weighted toward the schools the combo work touched.

| School | Formula | Str | Effect |
|---|---|---|---|
| **Elemental** | **Rain** | 2 | ✸ Blast 3, ◎4. Everything in it is **Wet (1)**. No damage, no save. |
| **Elemental** | **Lightning** | 2 | ✦ ◎4 · **Stunned (1)**, resist 📜 7 — **9** and **+2** vs **Wet** |
| **Elemental** | **Frost** | 1 | ◎3 · **Slowed (1)**, resist 🌀 5 — against a **Wet** target, **Frozen 2 (1)** instead, no save: the water is already there to freeze |
| **Elemental** | **Scorch** | 1 | ✦ ◎4 · **Burning 1 (1)**. A **Wet** or **Frozen** target sheds it. |
| **Blood** | **Open the Vein** | 1 | ◎2 · ⚔ 3, ignoring **Block**. Costs **1 Health**. |
| **Blood** | **Boil** | 3 | **Burning 3 (2)**, resist ✊ 7. Costs **2 Health**. |
| **Necromancy** | **Grave Chill** | 2 | ✵ Aimed 2 · **Dazed (1)**, resist ✊ 5. One **bound Taint** card. |
| **Poison** | **Slick** | 1 | ◎3 · **Off-Balance (1)**. No save. |
| **Poison** | **The Quick Dose** | 3 | **Poisoned 2 (2)** on one adjacent target, resist ✊ 7. Two a turn, and no secondary. |
| **Poison** | **The Long Dose** | 1 | **Poisoned 0 (3)** on one target at ◎2, resist ✊ 5. No damage at all — three rounds of a man who cannot use his off hand. |
| **Poison** | **The Grey Sickness** | 2 | ☣ **Tainting 1, slow** on one adjacent target, resist ✊ 7. Not a poison: a **disease**, and it is still there next week. |
| **Elemental** | **Flesh of the Earth** | 2 | ✦ ◎3 · **Burning 1 (2)** and ⚗ **Corrode 1**. Acid: it eats the armour as well as the man. |
| **Glamour** | **Wrong Face** | 2 | **Dazed (2)**, resist 👁 7. The GM writes down a secret. |
| **Glamour** | **The Evil Eye** | 2 | **Cursed** on one target you can see — a temporary Miss in its fate deck, until drawn. The GM writes down a secret. |
| **Shadow** | **Longer Shadow** | 1 | Until your next turn every square adjacent to you is shadowed. A **Wild** card joins your fate deck. |
| **Tattoo** | **Graven Eye** | 1 | Permanent: you are never surprised. The GM writes down a secret. |
| **Ward** | **Turn Aside** | 2 | ⚡ Reaction: one ally's Block counts **double** against this attack. |
| **Ward** | **The Shut Mouth** | 2 | **Silenced (1)** on one enemy at ◎3, resist 📜 7. Ward decides whether magic happens; this is the other direction from *The Unbound Tongue*. |
| **Ward** | **Shake It Off** | 2 | ⚡ Reaction: ⛓ **Shake Off 3** on one ally at ◎3 — which ends anything the game can print. The only dispel that does not care what the condition is. |
| **Divination** | **Where It Will Land** | 1 | **Read 1** on your own fate deck (core-rules §6). |
| **Divination** | **The Mark of Things to Come** | 2 | **Marked (1)** on an enemy at any range, and **Read 1** on its fate deck. |
| **Asceticism** | **Empty Hand** | 1 | While your hand is empty you may ⚔ Strike with no item, at your own ✊ Might. |

**Two of those set an opening Way of Mind barely reads.** *Slick* sets **Off-Balance** for the
fighters and *The Mark of Things to Come* sets **Marked** for the archers. A Poisoner cannot follow
up on a stumble and a Diviner cannot shoot — which is precisely why those two cards get played at a
table and never in a solo playtest.

### 3.5 Way of Faith — fifteen miracles (plus the counter in §3.6)

A second per god, and the Way's own opening seeded. **A god's list is short** (§1.4); these do not
pretend to finish one.

| God | Miracle | Str | Effect |
|---|---|---|---|
| **The Eternal God** | **Name the Guilty** | 1 | **Judged (1)** on one enemy you can see. No save. |
| **The Eternal God** | **The Weight of It** | 2 | A **Judged** enemy's armor counts **0** against everyone until your next turn. |
| **The Eternal Spirit** | **Lay On** | 1 | ✚ Heal an ally 2 at ◎3. |
| **The Eternal Spirit** | **A Word for You** | 1 | **Blessed** on one ally — a temporary Critical in their fate deck, until drawn. |
| **The Eternal Spirit** | **Bear It for Them** | 2 | ⚡ Reaction at ◎3: move one condition off an ally and **onto yourself**, at its full duration. Not a dispel — somebody still has it. |
| **Sessyfyn** | **Undertow** | 2 | ✸ Blast 2, ◎3: **Wet (1)**, and every target is moved 1 square you choose. |
| **Valtor** | **No Step Back** | 2 | Every ally within 2 gains **Block 2** until your next turn. |
| **Fagar** | **The Second Thought** | 1 | One enemy spends its secondary this round doing nothing, resist 👑 7. |
| **Vulpet** | **Nobody's Friend** | 2 | Until your next turn no ally may Heal, Interpose for, or redirect a hit from one enemy. |
| **Brendan** | **Full Belly** | 1 | Out of combat: the party's next rest returns one extra rest token. |
| **The Grey** | **Grey Judgement** | 2 | A **Judged** enemy acts **last** in the round, whatever its initiative. |
| **The Purple** | **Taste of the Rot** | 1 | One adjacent enemy: 1 damage and **Off-Balance (1)**, no save. You gain **1 Taint** on a Miss. |
| **The Yellow** | **Half a Truth** | 2 | Until your next turn, enemies act as though one ally you name were not there. ⤵ **Strain 1**. |
| **Vax** | **Stand Where I Stand** | 1 | Until your next turn, allies adjacent to you cannot be reduced below 1 Health. Costs **2 Health**. |
| **The First** | **Measure of the Debt** | 2 | A **Judged** enemy that dies this round: you gain **3 Health**. |

**Judged is the opening a priest sets for other people**, and all three of its readers above are
party-facing or tempo — stripped armor, a changed turn order, a death that pays. That is an answer at
the card level to the thinnest finding in the whole uniqueness audit: **Support** had one node in the
game ([specializations.md](specializations.md)). Faith's combo is *telling the party who to kill.*

### 3.6 Targeted counters — five spells

A generic dispel is not enough, and the reason is the slot budget. **Ward's *Shake It Off* ends
anything for 2 slots**, so if that were the only answer, every caster would prepare it and the
decision would be gone. A **targeted counter** is the other half of the trade:

> **A targeted counter is strength 1 and ends its one condition outright. The generic dispel is
> strength 2 and ends anything.** You pay a slot for breadth — and *the caster who prepared the wrong
> spells has prepared the wrong spells* is the whole point of a slot budget (§1.4).

Each of these also does something the generic one **cannot**, which is what keeps it from being a
worse *Shake It Off*:

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
- **[OPEN]** Each god's **full miracle list** and each school's **full formula list**. §3.4 and §3.5
  write the second and third entries; nobody has written a fourth.
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
