# Leveling (Draft 0.2)

How a character grows after creation. This settles the **chassis** — what a level-up is, what it can
give, and how the pieces are stored. The **content** — which specializations a Way offers and what
each node hands out — waits on the world, exactly as before.

Three questions elsewhere were waiting on this one: where Strike-on-secondary cards come from
([core-rules.md](core-rules.md) §3), the action deck's grow and prune rules (§8), and where rest
tokens come from (§8). All three are answered here.

**The content a node hands out** — the cards, the spells and the miracles themselves — is in
[way-cards.md](way-cards.md), which holds the value bands, the cost ladder, the spell format and a
draft Signature for each of the 48 major nodes.

---

## 1. One graph, one root

Every character stands on the same **root node**, and the root points at the four Ways. Levelling up
means **taking a node you can reach.**

```
                                        ┌─ Cutpurse ── …
                        ┌─ THIEF ───────┼─ Burglar ─── …
                        │               └─ ASSASSIN ── …
          ┌─ SHADE ──●──●──●────────────┤
          │          1  2  3            ├─ SCOUT ───── …
          ├─ STRENGTH ── …              └─ DUELLIST ── …
  ROOT ───┼
          ├─ MIND ───── …
          │                             ┌─ VALTOR ──── …
          └─ FAITH ─────────────────────┼─ THE PURPLE …
                                        └─ … twelve gods
```

**Way of Faith is shaped differently on purpose.** Shade is narrow and deep — three titles off the
trunk, nine behind them. Faith fans out to twelve gods at once, because in that Way the first choice
*is* the content, and it is the only Way whose first step shuts doors permanently
([specializations.md](specializations.md)).

- A **node** is one level-up. Taking it is the level.
- An **edge** says which nodes a node opens up.
- A **specialization node** gives you a title as well as its reward.

The graph is not a ladder with a fixed top. **Its shape dictates how many levels there are**, so
adding depth is a content question, not a rules change.

## 2. Milestone

**The GM says when.** No experience points, no thresholds, no tracking. Nothing in the rules counts
XP today and nothing here starts.

## 3. The node is the reward; the choice is which node

A node carries a **fixed** reward. Nothing is offered and nothing is passed over — taking the node
*is* taking the reward.

> **Your choices at a level-up are every node that a node you already own points at.**

That set is your **frontier**, and it grows as you go. Taking a node spends your level and adds that
node's own successors to what you can reach next.

The decision is therefore **navigational, not a menu**: you are not picking a prize, you are picking
a direction, and what you give up is the other directions you could have gone this level. A node you
walked past is usually still there, so declining a branch at level 3 often means taking it later
rather than losing it — **unless it was closed behind you.**

### Some choices close doors

A node may belong to an **exclusive group**. Taking any node in the group **disables every other node
in it, permanently.** Those nodes leave your frontier and never come back, and so does everything
reachable only through them.

The clearest case is a **god**, and Way of Faith is built out of twelve of them. Swearing to one is
not a step you take beside swearing to another; it is the end of that question.

#### Nested groups: the family and the creed

Way of Faith needs one thing a flat group cannot say. The exclusive unit is the **religion**, not the
god, so a devotee of The Five may come back for another of The Five — but never for a god outside it.
Two fields say that:

| Field | Holds |
|---|---|
| `exclusive` | the **family**: `"faith"` for every god |
| `creed` | the **religion** within it: `"the-five"`, `"the-grey"`, `"eternal-god"`, `"vax"` … |

> **Taking a node closes every node of the same family with a *different* creed.**

So Valtor closes The Purple, the Eternal God and all the rest, and leaves Sessyfyn, Fagar, Vulpet and
Brendan open. Nothing else changes, and **a flat group is the special case** where every node's creed
is its own — so the rule above describes both and nothing that exists needs rewriting.

The interesting consequence is that **a god's restrictiveness is content, not a rule.** A religion
with five gods is generous and a religion with one is absolute, and neither needed a flag: Firma's
local gods are *"a myriad of small religions"*, each with a single god, so swearing to Vax ends the
question as finally as swearing to the emperor's god does. Way of Faith prices that back the other way
— a lone god's branch runs deeper and its gift bends a rule no pantheon god may bend
([specializations.md](specializations.md)).

An add-on's new pantheon declares `exclusive: "faith"` and its own `creed`, and is at once correctly
exclusive with every religion that exists and every one that ever will, in both directions, without
core being touched.

This is the one thing that makes the frontier **shrink**, and the graph needs it. Everything else in
this document can be had eventually (§6); an exclusive group is where a character genuinely becomes
one thing instead of another.

> **Why a group, not a list of rivals.** A node that named every node it was incompatible with could
> not be extended: an add-on's new god would have to be written into every existing god's list,
> which means editing core content. A **named group** is mutual by construction — the add-on declares
> `exclusive: "faith"` and a creed of its own, and is at once exclusive with every religion that
> exists and every one that ever will.
>
> It is also a pattern the game already uses. Bonus groups are *same group, highest wins*; this is
> *same group, first taken wins, for good.*

## 4. What a node's reward can be

| Reward | What it does | Note |
|---|---|---|
| **Action card** | Add a card to your action deck | The deck is the main currency of progression |
| **Skill card** | Add one, or upgrade one ([skill-rules.md](skill-rules.md) §8) | |
| **Training** | A tool type, at the full bonus instead of +1 | Skill rules §2 already says training comes from the Way trees |
| **Know-how** | A situation you have **advantage** in | A background gives one; a Way gives more |
| **Feature** | A feature slate, passive or active | Bounded by bonus groups (§5) |
| **Obligation** | A feature you **cannot remove**, binding in text, in the action deck or in the fate deck | What you owe for what you were taught — see below |
| **Item** | A slate you keep | For signature gear a Way grants, not ordinary loot |
| **Prune** | Remove one card from a deck, permanently | The only way to drop a dead card (§8) |
| **Deck cap** | Raise your action deck maximum | A flat trait, so **not** bonus-grouped |
| **Spell slot** | One more point of **formula strength** you may prepare (core-rules §4) | Way of Mind's and Way of Faith's version of a deck cap |
| **Health** | Raise max Health | |
| **Rest token** | One more (§8 promises these come from leveling) | |

A node may grant **several of these at once** — "a card *and* a prune" is one node's reward. That is
how a branch keeps a deck from drifting upward every level without spending a whole level on pruning.

**Gold is not a reward.** A level is a permanent change to who you are; coin is something you find
and then spend, so a level spent on it is a level you can lose. Money comes from play — loot, work,
downtime (skill rules §6) — and a node that handed it out would be giving the one reward the
character could wake up without.

**Cards are the backbone, features are the spice.** A feature never dilutes anything, so a
feature-heavy branch makes characters monotonically stronger. A card costs you something to gain,
since more cards means your best ones come up less often — which is the tension §8 already rests on,
and it only exists if cards are what you mostly gain. Simulation is blunt about it: a 12-card deck
pruned *well* matches a full 16, and pruned *badly* collapses to 45%.

### Obligations

Some things are not taught for free. The elves want something back, a minor god wants a pact kept, a
priest owes vows and a pilgrimage. **An obligation is a feature the character cannot remove** — the
GM writes it, the GM holds it, and no prune, rest or level takes it off the sheet.

A feature slate is already permanent and already sits in front of the player where they cannot forget
it. What is new is only that this one is **not theirs to drop**, and that its text is a debt rather
than a benefit.

An obligation can bind in three ways, and a single one may use more than one:

| | How it binds | Examples |
|---|---|---|
| **In text** | The table enforces it. No mechanism, just a sentence everyone can read. | *You may not wear armour. You may not own gold. You must attack anyone who taunts you.* |
| **In a deck you play from** | Cards you did not choose, in the **action** deck or the **skill** deck. A compulsion must be played when it comes up; a bound **Taint** card simply is the hole it left. | a compulsion that fires whether or not this was the turn for it; the necromancer's forgetting |
| **In the fate deck** | Cards you did not choose, permanently in the deck you draw luck from. | the Shadow mage's **Wild** card, one per formula |

The three are a ladder from trust to enforcement, and **the right rung is the loosest one that
holds**. A sentence costs nothing to write and nothing to run, and most obligations should stay
there; put it in a deck when the table keeps forgetting, or when the point is that the character
*cannot* remember.

**Deck obligations need not be bad.** A card that must be played can be a strong card — it is still
an obligation, because it takes the choice of *when* away from you. A god who makes you brave is
every bit as binding as one who makes you poor.

Both deck forms have precedent. Wounds and Taint are already cards you did not choose sitting in a
deck you did (core-rules §8), and Blessed and Cursed already shuffle cards into the fate deck
(§6) — the difference is only that an obligation's are **permanent**.

**Bound Taint.** A Taint card an obligation put there is *bound*: a cure and Cleansing do not lift
it. An obligation may name the one thing that does, and the price should be the thing that was bought
with it — the necromancer gives the formula back and the hole closes
([specializations.md](specializations.md)). Bound Taint still counts toward **Afflicted** at 3, which
is what keeps a school paying this way from being cheap: the third purchase is where it shows on the
body.

> **[OPEN]** How a prohibition is actually blocked — "you may not wear armour" needs the HUD or the
> rules to stop it, or it is a text obligation after all. Deferred until these are specified further.

> This is the price four of the Way of Mind schools already charge in the world document — Glamour,
> Spiritualism, Household magic and all of Priest magic
> ([specializations.md](specializations.md)). It is one answer serving four nodes.

### The skill side

Three of those rewards are skills, and they are the three things a background already gives
([backgrounds.md](backgrounds.md)): a **skill card**, a **training**, a **know-how**. A background
is who you were before the Way; the graph keeps giving you the same kinds of thing afterwards, which
is why the two halves of a character never need separate machinery.

> **Skills belong on minor nodes.** A major node is a title and a fighting identity; a skill is a
> thing you picked up along the way to one. Putting skills on the ordinary nodes between the titles
> is what gives those nodes something to be — otherwise a trunk is three levels of filler waiting for
> a specialization, which is the failure mode §5a warns about from the other direction.

[skill-rules.md](skill-rules.md) §8's *Add or Upgrade, and prune 1* therefore describes **what a
skill-card reward looks like** rather than a separate per-level entitlement. Training in downtime is
unchanged and still the way to redirect between levels.

## 5. Specializations

Some nodes confer a **title**. A Way of Shade character who takes the Thief node is a *Thief* — the
sheet, the token and the character's own idea of themselves say Thief, not Shade.

Specializations chain, because they are just nodes further along:

```
Way of Shade → Thief → Assassin → …
```

Each is reached by walking the nodes between, so a title is **earned through the levels that lead to
it**, not picked off a list at creation. Your current title is the **deepest** specialization node
you own.

## 5a. Writing a major node

A **major node** is a Way root or a specialization — a node that gives you a title. Ordinary nodes
are small and may be anything; major nodes are what a character *is*, so they are written to a fixed
shape, the way [backgrounds.md](backgrounds.md) writes backgrounds to five parts. Same reason: they
become simple to write and easy to compare.

### The stringency problem

The root keeps every Way reachable and most branches wait for you indefinitely, so a Thief may take
the Duellist branch at level 8 and Way of Mind at level 12. **In a graph you can eventually walk all
of, choosing a branch costs nothing by itself.** Opportunity cost alone will not differentiate
builds. Four things do:

| Device | How |
|---|---|
| **The choice is exclusive** | The node's group closes every rival node for good (§3). The strongest device, and the only one that makes the frontier shrink — spend it on the handful of choices that should define a character, not on every branch. |
| **Depth takes commitment** | A branch's later nodes require **several** of that branch's own nodes, not just one (§10). A dabbler reaches the first node of anything; only an investment reaches Assassin. |
| **The node costs you something** | Expressed in rules that already exist — a prune, Strain, an **obligation** (§4), a slot you must keep free, cards that dilute a deck. Never a penalty bolted on. |
| **Slot and resource pressure** | A build that needs a free hand cannot carry a shield (core-rules §4). That exclusion is live, and it is the model for the rest. |

### The six parts

| Part | What it says |
|---|---|
| **Title** | what you are called from here on |
| **Stance** | one sentence: how this build wins |
| **Leans on** | the **one** axis it pushes, from the list below |
| **Pays in** | the resource it spends, and what it is therefore bad at |
| **Signature** | the single card or feature the build is named for |
| **Not** | what it is *not* about — a major node is a fighting identity, so skills belong on the minor nodes around it, never here |
| **Opens** | which nodes it puts on the frontier |

The **axes** are not new mechanics; they are the levers the engine already has:

| Axis | Lever |
|---|---|
| **Tempo** | Spent, Strain, Ready costs, what a turn sets up |
| **Position** | Move, range, Blast against Aimed, cover |
| **Reactions** | what you do on other people's turns, paid for in cards |
| **Control** | conditions you put on other people |
| **Deck shape** | 12–20, pruning, the deck cap |
| **Preparation** | anything decided before it matters — spell slots, a set trap, a loaded gun, a weapon slung on the back |
| **Support** | what you spend your turn on when the payoff lands on somebody else's |

### 5a.1 The cell: axis and resource as a pair

> **The writing rule:** two major nodes reachable from the same place must **lean on different axes
> and pay in different resources.**

An axis on its own will not do it. There are seven axes and — on the current list — thirty-five
fighting nodes, so collisions are guaranteed by arithmetic before anyone writes a word; the axis
column tells a player which lever a build pulls, never what the build is. See the audit in
[specializations.md](specializations.md), which found **two pairs of nodes that were the same build
written twice**, and both times the axes matched.

So the rule compares a **pair**, and the second half comes from a closed list too:

| Resource | What paying it looks like |
|---|---|
| **Spent** | cards burned for the rest of the fight |
| **Strain** | cards out of your hand this round |
| **Halves** | secondaries that go on Move or Ready instead of on damage |
| **A slot kept free** | a hand you may not fill, or a worn slot you must leave empty |
| **Weight** | carry allowance, and Overloaded |
| **Health** | paid to learn, or paid to cast |
| **Taint** | cards in a deck that cannot be pruned (section 4) |
| **Deck size** | cards that dilute, or a deck you must keep small |
| **The fate deck** | cards you did not choose in the deck you draw luck from |
| **Spell slots** | a short list, or one formula that eats the list |
| **A turn spent early** | setup that pays off later, or not at all |
| **Someone else's turn** | you act when they act, and only then |
| **Range** | you work in one band and are poor in the others |
| **An ally** | the build is ordinary without one beside you |
| **Ground** | open space, a line, high ground — or standing still to get it |
| **A weapon's value** | the Strike number on the item, given up altogether |
| **Gear you can lose** | a mount, a cannon, a shield: ordinary without it, and the GM can take it |
| **An obligation** | a feature you cannot remove (section 4) |

A node's **cell** is the pair. Eighteen resources across seven axes is 126 cells, which is room enough
that distinctness is a writing habit rather than a puzzle.

> **The last three were added late, and that is a lesson.** This list was written out of Way of Mind
> and Way of Shade, whose costs are all abstract — slots, cards, luck, knowledge. It had no entry for
> a mount, for open ground, or for giving up your weapon, so **Way of Strength's prices had to be
> written as prose**, and prose cannot be sorted or checked. The Way read flat partly because our
> vocabulary for it was thinner than the Way is. If a Way's costs keep coming out as sentences, the
> list is short, not the Way.

- **Hard rule:** no two nodes sharing a predecessor may occupy the same cell. The graph validator
  refuses it (section 8), alongside the acyclicity and prerequisite checks.
- **Warning:** a repeated cell anywhere in one Way, or the same cell in two different Ways. Legal,
  and usually wrong.
- **A child may deepen its parent.** The rule governs siblings only, so a node that follows its
  parent on the same axis, or pays in the same resource, is doing what a branch is **for**. Way of
  Shade's Bard follows the Duellist on Reactions and is the Duellist's reactions pointed at somebody
  else ([specializations.md](specializations.md)); if that were forbidden, every branch would have to
  change the subject at every step.

### 5a.2 The swap test

The cell separates builds on paper. The **Signature** is what separates them at the table, and it has
one test:

> **Offer the Signature to a sibling node. If it would work there, and that sibling would want it, it
> is not a signature — it is a reward that happens to be sitting on this node.**

A Thief would happily take *advantage against anyone Slowed, Prone or unaware*, and so would an
Assassin, a Duellist and a Burglar. That card fails the test. *Advantage against anyone **you** put a
condition on this fight* does not — it is worthless to a build that applies no conditions, which is
exactly what makes it the Thief's.

The test is strict on purpose: it is passed only by a Signature that is **bad on the other nodes**,
and a build is memorable in the degree that its best card is useless to its neighbours.

### 5a.3 One thing you give up, in rules

> **Every major node subtracts something.** Not flavour — a clause the engine enforces.

Additions stack and blur: three nodes that each add damage are one node with three names, and a
character who takes all three is simply stronger. Subtractions do not stack, cannot be accumulated,
and are impossible to confuse with one another.

This is the cheapest device to write and the one with the most effect, and the evidence is already on
the list. The two most vivid nodes anyone has drafted are **Berserker** (*cannot defend*) and
**Street Fighter** (*no weapon value at all, both hands always free*). Neither has a Signature
written yet, and both are already unmistakable.

The subtraction and the **Pays in** resource are usually one sentence seen from two sides. Where they
are not, the node is probably paying in something it does not care about.

### 5a.4 Signature shapes

A Way whose ten nodes all grant *+2 to something* has ten nodes and one idea. These are the kinds of
thing the engine can actually be bent into, and **a Way may use each shape at most twice**:

| | Shape |
|---|---|
| 1 | **An odd pair of verbs on one card** — *Move, then Strike*; *Defend, then Ready* |
| 2 | **A card playable on someone else's turn** |
| 3 | **A cost conversion** — pay Strain where everyone pays Spent, or Health where others pay cards |
| 4 | **A cost waiver** — one thing stops costing you a Ready, a hand, a slot |
| 5 | **A condition in your hands only** — one nobody else applies, or one that does more when you apply it |
| 6 | **A change to a fate deck** — yours, or the enemy's |
| 7 | **A slot rule** — a third hot slot; a worn slot that behaves like a hot one |
| 8 | **A deck or hand rule** — draw one more, see the top card, Catch Breath differently |
| 9 | **A bonus group only you may stack in** — the one exception to *highest wins* |
| 10 | **A turn-structure change** — act out of order, two secondaries, a half you take back |

The budget is the point. Shapes 2 and 10 are the strongest and the most expensive to balance; shapes
1 and 4 are nearly free and carry a surprising amount of identity. Nothing here is a new mechanic -
each shape is a lever the rules already pull somewhere, which is the same standard the cost row above
holds a node's price to.

### Examples (placeholders until the world is ready)

#### Way of Shade

| | |
|---|---|
| **Stance** | You win by not being where the blow lands, and by hitting what cannot hit back. |
| **Leans on** | Position |
| **Pays in** | **Halves.** Your cards spend their secondary on Move far more often than Strength's do, so you deal less per turn and choose where every turn ends. |
| **Signature** | A card whose primary is *Move, then Strike* — reach is the attack. |
| **Opens** | Thief, Scout, Duellist |

#### Thief

| | |
|---|---|
| **Stance** | You take the opening, and then you take everything else. |
| **Leans on** | Control |
| **Pays in** | **A free hand and a light weapon.** No shield, no two-hander: both of your hands are working. |
| **Signature** | A feature that turns a condition you applied into an opening — advantage against anyone Slowed, Prone or unaware. |
| **Opens** | Assassin, Burglar, Cutpurse |

#### Necromancer

| | |
|---|---|
| **Stance** | You spend your own substance, and what you spend it on does not tire. |
| **Leans on** | Preparation |
| **Pays in** | **Taint**, into your own skill deck — one bound card per formula *learned*, not per slot prepared. The deck you think with fills up with holes, and at 3 you are Afflicted and down 3 Health (core-rules §8). Bound means no cure lifts it; surrendering the formula does. |
| **Signature** | A prepared spell that is worth the Taint it costs. |
| **Gives up** | **Breadth.** Every other school hoards a book and chooses on the morning; a necromancer's library stays as short as their Health allows. |
| **Opens** | *(the school's deeper nodes)* |

#### Divinator

| | |
|---|---|
| **Stance** | You do not win the fight. You decide who does, and when. |
| **Leans on** | Support |
| **Pays in** | **Someone else's turn.** What you arrange is cashed by another character, and only if they act before a Miss or a Critical reshuffles the deck. |
| **Signature** | *The Reading* — **Read 3** (core-rules §6) on any **one** fate deck: a companion's, or an enemy type's. |
| **Gives up** | **Your own fate.** No divination of yours may look at or reorder your own fate deck. The seer is blind to themselves. |
| **Opens** | *(the school's deeper nodes: avert, and hold a draw)* |

Divinator is the example of **5a.3**, because the one clause it gives up is doing four jobs at once.
It is the whole flavour; it forces the node onto Support, since a power that cannot help you is only
worth anything aimed at someone else; it is the balance, because a diviner stacking their own deck
would be a damage school with a tell; and it is what makes the Signature **fail the swap test for
every sibling** — offer *The Reading* to a Blood mage or a Necromancer and they decline, because the
only deck it may never touch is theirs.

Note also what the Signature costs the rules: **one keyword**. Fate decks, the per-type enemy decks
and the reshuffle-on-Miss-or-Critical are all core-rules §6, written for other reasons, and the
reshuffle is what stops a diviner banking two good draws. *Read N* is named there now, beside
*Foresee*, so any card or feature can use it. [specializations.md](specializations.md) works it
through.

Necromancer is the example worth studying, because its cost is **not invented for it**. Taint already
exists, already distinguishes body from mind, already has a face in the icon set and an Afflicted
threshold in the rules. A major node is written well when its price is a rule the game already had and
nobody had spent yet.

It is also where 5a.3 earns itself. The world document prices necromancy in *forgetting*, and the
first reading of that was a forced **prune** — a deletion, which is invisible at the table, pushes
Deck shape instead of Preparation, and spends the same verb as one of section 4's rewards. A bound
Taint card is the same fiction read as **dilution**, and it is felt every few draws for the rest of
the character's life. [specializations.md](specializations.md) argues it out in full.

## 6. A second Way

The root is a node you own, and **you never stop owning it** — so all four Way nodes stay on your
frontier for the whole of a character's life. A Shade at level 5 may spend that level taking **Way of
Strength** and start down its trunk.

Nothing special makes this work; it falls out of the geometry, and it costs exactly what it should.
A second Way starts at its trunk, so the level buys you an opening that a single-Way character got
free at level 1. You go **wider and one step shallower**, which is the trade worth having and the one
that needs no extra rule to enforce.

> The same geometry says an add-on's **fifth** Way is reachable by every existing character the moment
> it is installed, because it points at the root like the other four. Way of Faith was added to core
> this way and needed no change to §6 to do it.

## 7. How many levels

However deep the graph runs. There is no level cap in the rules; there is a longest path through the
graph, and that is the cap.

**Level is the number of nodes you own**, not counting the root. Two level-6 characters have each
taken six nodes whatever route they walked, so "level 6" stays comparable and encounters can still be
pitched at a number.

> **This needs the graph to be depth-consistent.** If Thief's branch runs four nodes to its next
> specialization and Scout's runs six, two level-6 characters sit at different distances from their
> next title. Keeping branches level is a content constraint, and the validator should check it once
> there is a graph to check.

## 8. Add-on compendiums

**A branch may be added from outside.** An add-on can hang new specializations off any existing node,
so *Way of Shade → Thief → …* can gain an *Infiltrator* branch that core never knew about, and a new
Way can hang off the root.

The thing that makes this work is a split between how the graph **reads** and how it is **stored**:

> It reads forwards — a node opens up its successors.
> It is stored backwards — **a node names the nodes it follows, and nothing names its successors.**

An add-on therefore ships nodes that say *"I come after `shade.thief`"*, and core content is never
edited, never re-released, and never has to know the add-on exists. The graph is **assembled at
runtime** from every installed pack rather than authored as one tree, and a character's frontier is
every node whose prerequisite list contains a node they own.

Two consequences:

- **Node ids are a public interface.** `shade.thief` is a name an add-on depends on, so it is renamed
  about as freely as a database column.
- **The graph needs validating, not just loading.** Every prerequisite must resolve and the whole
  thing must stay acyclic. Both are cheap offline checks and belong in `test/validate.mjs` beside the
  ones already there.

## 9. How it is stored

Nodes are **content, not code** — the same rule the rest of the tuning follows
([design-direction.md](design-direction.md)).

| Field | Holds |
|---|---|
| `id` | stable, namespaced: `shade.thief.assassin` |
| `after[]` | the node ids this may follow; **any one** of them being owned is enough |
| `exclusive` | the exclusion **family**, if this choice closes its rivals — `"faith"` |
| `creed` | the sub-group within that family; nodes of the same family but a different creed close (§3) |
| `title` | the class title this confers, if it is a specialization node |
| `grants[]` | the reward, fixed |

A character's **closed** set derives from the owned list and nothing else: for each `exclusive` family
the character owns a node in, every node of that family whose `creed` differs from theirs is closed.
Nothing extra is stored, and a family whose nodes all carry distinct creeds collapses to the plain
one-and-only-one group.

A character stores only **the list of node ids they own**. Level, title, frontier and every reward
derive from that list, so a corrected node definition fixes every character who took it, and nothing
needs migrating.

## 10. Open

- **[OPEN]** The graphs themselves — every node, reward and specialization for all four Ways. The
  major nodes are named and celled ([specializations.md](specializations.md)) and both the Signatures
  and the minor-node **pools** are drafted ([way-cards.md](way-cards.md)), so what is missing is the
  wiring: which node grants which entry, and the depth-consistency §7 asks for.
- **Needed:** a node that requires **all** of its prerequisites rather than any one. §5a leans on
  this — it is how depth takes commitment, and without it every title is one node deep and means
  nothing. One flag on the node; build it with the first graph.
- **[OPEN]** Whether **item** rewards overlap awkwardly with loot. A Way granting signature gear is
  good; a Way granting what the party would have found anyway is a dead node.
- **[OPEN]** Whether a second Way should cost anything beyond the level, and whether there is a cap
  on how many Ways one character may walk.
- **[OPEN]** Which groups beyond **faith** should be exclusive. It is a sharp tool: every group spent
  is a door a character can never open, so the list should stay short enough to name in a sentence.
  Faith is the only one so far, and it uses both creeds.
- **[OPEN]** Whether a one-off exclusion — *this* node closes *that* one, with no group — is ever
  needed. The group covers the known cases and extends cleanly; a one-off does not.
