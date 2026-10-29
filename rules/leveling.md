# Leveling (Draft 0.2)

How a character grows after creation. This settles the **chassis** — what a level-up is, what it can
give, and how the pieces are stored. The **content** — which specializations a Way offers and what
each node hands out — waits on the world, exactly as before.

Three questions elsewhere were waiting on this one: where Strike-on-secondary cards come from
([core-rules.md](core-rules.md) §3), the action deck's grow and prune rules (§8), and where rest
tokens come from (§8). All three are answered here.

---

## 1. One graph, one root

Every character stands on the same **root node**, and the root points at the three Ways. Levelling up
means **taking a node you can reach.**

```
                                        ┌─ Cutpurse ── …
                        ┌─ THIEF ───────┼─ Burglar ─── …
                        │               └─ ASSASSIN ── …
          ┌─ SHADE ──●──●──●────────────┤
          │          1  2  3            ├─ SCOUT ───── …
  ROOT ───┼─ STRENGTH ── …              └─ DUELLIST ── …
          │
          └─ MIND ───── …
```

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
walked past is still there — the frontier never shrinks, so declining a branch at level 3 only ever
means taking it later than you could have.

## 4. What a node's reward can be

| Reward | What it does | Note |
|---|---|---|
| **Action card** | Add a card to your action deck | The deck is the main currency of progression |
| **Skill card** | Add one, or upgrade one ([skill-rules.md](skill-rules.md) §8) | |
| **Training** | A tool type, at the full bonus instead of +1 | Skill rules §2 already says training comes from the Way trees |
| **Know-how** | A situation you have **advantage** in | A background gives one; a Way gives more |
| **Feature** | A feature slate, passive or active | Bounded by bonus groups (§5) |
| **Item** | A slate you keep | For signature gear a Way grants, not ordinary loot |
| **Prune** | Remove one card from a deck, permanently | The only way to drop a dead card (§8) |
| **Deck cap** | Raise your action deck maximum | A flat trait, so **not** bonus-grouped |
| **Spell slot** | Prepare one more spell before a fight (core-rules §4) | The Way of Mind's version of a deck cap |
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

### The skill side

Three of those rewards are skills, and they are the three things a background already gives
([backgrounds.md](backgrounds.md)): a **skill card**, a **training**, a **know-how**. A background
is who you were before the Way; the graph keeps giving you the same kinds of thing afterwards, which
is why the two halves of a character never need separate machinery.

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

Your frontier never shrinks and the root keeps every Way reachable, so a Thief may take the Duellist
branch at level 8 and Way of Mind at level 12. **In a graph you can eventually walk all of, choosing
a branch costs nothing by itself.** Opportunity cost will not differentiate builds. Three things do,
and all three are rules that already exist:

| Device | How |
|---|---|
| **Depth takes commitment** | A branch's later nodes require **several** of that branch's own nodes, not just one (§10). A dabbler reaches the first node of anything; only an investment reaches Assassin. |
| **The node costs you something** | Expressed in rules that already exist — Taint, Strain, a slot you must keep free, cards that dilute a deck. Never a penalty bolted on. |
| **Slot and resource pressure** | A build that needs a free hand cannot carry a shield (core-rules §4). That exclusion is live, and it is the model for the rest. |

### The six parts

| Part | What it says |
|---|---|
| **Title** | what you are called from here on |
| **Stance** | one sentence: how this build wins |
| **Leans on** | the **one** axis it pushes, from the list below |
| **Pays in** | the resource it spends, and what it is therefore bad at |
| **Signature** | the single card or feature the build is named for |
| **Opens** | which nodes it puts on the frontier |

The **axes** are not new mechanics; they are the levers the engine already has:

| Axis | Lever |
|---|---|
| **Tempo** | Spent, Strain, Ready costs, what a turn sets up |
| **Position** | Move, range, Blast against Aimed, cover |
| **Reactions** | what you do on other people's turns, paid for in cards |
| **Control** | conditions you put on other people |
| **Deck shape** | 12–20, pruning, the deck cap |
| **Preparation** | spell slots — deciding before the fight instead of during it |

> **The writing rule:** two major nodes reachable from the same place must **lean on different axes
> and pay in different resources.** That single constraint is what stops a Way's branches from being
> three names for the same character, and it is checkable by eye.

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
| **Pays in** | **Taint**, into your own skill deck. The power is real and the deck you think with gets worse as you use it — at 3 Taint you are Afflicted and down 3 Health (core-rules §8). |
| **Signature** | A prepared spell that is worth the Taint it costs. |
| **Opens** | *(the school's deeper nodes)* |

Necromancer is the example worth studying, because its cost is **not invented for it**. Taint already
exists, already distinguishes body from mind, already has a face in the icon set and an Afflicted
threshold in the rules. A major node is written well when its price is a rule the game already had and
nobody had spent yet.

## 6. A second Way

The root is a node you own, and **you never stop owning it** — so the three Way nodes stay on your
frontier for the whole of a character's life. A Shade at level 5 may spend that level taking **Way of
Strength** and start down its trunk.

Nothing special makes this work; it falls out of the geometry, and it costs exactly what it should.
A second Way starts at its trunk, so the level buys you an opening that a single-Way character got
free at level 1. You go **wider and one step shallower**, which is the trade worth having and the one
that needs no extra rule to enforce.

> The same geometry says an add-on's fourth Way is reachable by every existing character the moment
> it is installed, because it points at the root like the other three.

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
| `title` | the class title this confers, if it is a specialization node |
| `grants[]` | the reward, fixed |

A character stores only **the list of node ids they own**. Level, title, frontier and every reward
derive from that list, so a corrected node definition fixes every character who took it, and nothing
needs migrating.

## 10. Open

- **[OPEN]** The graphs themselves — every node, reward and specialization for all three Ways.
  Waits on the world, as it always did.
- **Needed:** a node that requires **all** of its prerequisites rather than any one. §5a leans on
  this — it is how depth takes commitment, and without it every title is one node deep and means
  nothing. One flag on the node; build it with the first graph.
- **[OPEN]** Whether **item** rewards overlap awkwardly with loot. A Way granting signature gear is
  good; a Way granting what the party would have found anyway is a dead node.
- **[OPEN]** Whether a second Way should cost anything beyond the level, and whether there is a cap
  on how many Ways one character may walk.
