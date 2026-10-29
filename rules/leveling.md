# Leveling (Draft 0.1)

How a character grows after creation. This settles the **chassis** — what a level-up is, what it can
give, and how the pieces are stored. The **content** — which specializations a Way offers and what
each node hands out — waits on the world, exactly as before.

Three questions elsewhere were waiting on this one: where Strike-on-secondary cards come from
([core-rules.md](core-rules.md) §3), the action deck's grow and prune rules (§8), and where rest
tokens come from (§8). All three are answered here.

---

## 1. The shape: a Way, then a graph

A character picks a **Way** at creation — Strength, Shade or Mind — and that is the root of a
**directed graph**. Every later level-up moves one step along it.

```
                                    ┌─ Cutpurse ─ …
                    ┌─ THIEF ───────┼─ Burglar ── …
                    │               └─ ASSASSIN ─ …
  WAY OF SHADE ──●──●──●────────────┤
   (root)        1  2  3            ├─ SCOUT ──── …
                                    └─ DUELLIST ─ …
                 └ trunk ┘          └ specializations ┘
```

- A **node** is one level-up.
- An **edge** says which node may follow which.
- A **specialization node** is one where the graph branches, and taking it changes what you are
  called.

The graph is not a ladder with a fixed top. **Its shape dictates how many levels there are**, so
adding depth is a content question, not a rules change.

## 2. Milestone

**The GM says when.** No experience points, no thresholds, no tracking. Nothing in the rules counts
XP today and nothing here starts.

## 3. An ordinary node: two offers, take one

Every node carries a package written for that Way at that depth. It offers **two minor benefits, and
you take one.**

> You never take both. The one you leave behind is the cost of the one you take, and it is the only
> cost a level-up has.

Two is deliberate. One offer is not a choice; four is a menu to study rather than a decision to make.
Two is a fork you can hold in your head, and it means the character you end up with is visibly not
the one you could have had.

## 4. What a benefit can be

| Benefit | What it does | Note |
|---|---|---|
| **Action card** | Add a card to your action deck | The deck is the main currency of progression |
| **Feature** | A feature slate, passive or active | Bounded by bonus groups (§5) |
| **Item** | A slate you keep | For signature gear a Way grants, not ordinary loot |
| **Prune** | Remove one card from a deck, permanently | The only way to drop a dead card (§8) |
| **Deck cap** | Raise your action deck maximum | A flat trait, so **not** bonus-grouped |
| **Health** | Raise max Health | |
| **Rest token** | One more (§8 promises these come from leveling) | |
| **Gold** | Coin | |

A benefit may be a **bundle** — "a card *and* a prune" is one benefit, not two. That is how a node
keeps a deck from drifting upward every level without making pruning its own boring pick.

**Cards are the backbone, features are the spice.** A feature never dilutes anything, so a
feature-heavy tree makes characters monotonically stronger. A card costs you something to gain, since
more cards means your best ones come up less often — which is the tension §8 already rests on, and it
only exists if cards are what you mostly gain. Simulation is blunt about it: a 12-card deck pruned
*well* matches a full 16, and pruned *badly* collapses to 45%.

### The skill deck

Skill cards are benefits like any other, so [skill-rules.md](skill-rules.md) §8's *Add or Upgrade,
and prune 1* becomes **what a skill-card benefit looks like** rather than a separate per-level
entitlement. Training in downtime is unchanged and still the way to redirect between levels.

## 5. Specialization nodes

At a specialization node you do two things:

1. **Choose a branch** from the specializations offered there.
2. **Take its package**, which is richer than an ordinary node — more benefits offered, and **more
   than one taken**.

Specializing **changes your title**. A Way of Shade character becomes a *Thief*; the sheet, the token
and the character's own idea of themselves say Thief, not Shade.

## 6. Specializations chain

A specialization is not a terminus. Further along the branch sit further specialization nodes, and
taking one changes the title again:

```
Way of Shade → Thief → Assassin → …
```

Each is reached by walking the nodes between them, so a title is **earned through the levels that
lead to it**, not picked off a list at character creation.

## 7. How many levels

However deep the graph runs. There is no level cap in the rules; there is a longest path through the
graph, and that is the cap.

**Level is the number of nodes you have taken**, counted from the root. Two characters at level 6 have
each taken six nodes whatever branches they walked, so "level 6" stays comparable across Ways and
encounters can still be pitched at a number.

> **This needs the graph to be depth-consistent.** If Thief's branch runs four nodes to its next
> specialization and Scout's runs six, two level-6 characters sit at different distances from their
> next title. Keeping branches level is a content constraint, and the validator should check it once
> there is a graph to check.

## 8. Add-on compendiums

**A branch may be added from outside.** An add-on compendium can hang new specializations off any
existing specialization node, so *Way of Shade → Thief → …* can gain an *Infiltrator* branch that
core never knew about.

The thing that makes this work:

> **Edges point backwards.** A node names the node it follows. Nothing names its successors.

So an add-on ships nodes that say *"I come after `shade.thief`"*, and the core content is never
edited, never re-released, and never has to know the add-on exists. The graph is **assembled at
runtime** from every installed pack rather than authored as one tree.

Two consequences:

- **Node ids are a public interface.** `shade.thief` is a name an add-on depends on, so it is
  renamed about as freely as a database column.
- **The graph needs validating, not just loading.** Every prerequisite must resolve, and the whole
  thing must stay acyclic. Both are cheap offline checks and belong in `test/validate.mjs` beside the
  ones already there.

## 9. How it is stored

Nodes are **content, not code** — the same rule the rest of the tuning follows
([design-direction.md](design-direction.md)).

| Field | Holds |
|---|---|
| `id` | stable, namespaced: `shade.thief.assassin` |
| `way` | which Way's graph this belongs to |
| `after[]` | the node ids this may follow; empty means a Way root |
| `title` | the class title this confers, if it is a specialization node |
| `offers[]` | the benefits on offer |
| `take` | how many of them you take — 1 for an ordinary node, more for a specialization |

A character stores only **the list of node ids they have taken**. Level, title and every benefit
derive from that list, so a corrected node definition fixes every character who took it, and nothing
needs migrating.

## 10. Open

- **[OPEN]** The graphs themselves — every node, benefit and specialization for all three Ways.
  Waits on the world, as it always did.
- **[OPEN]** Whether **gold** earns its place as a benefit. Against a card or a feature it looks
  weak, and it is only a real choice if the economy is tight enough that coin buys something a level
  cannot. Worth deciding once there are prices.
- **[OPEN]** Whether **item** benefits overlap awkwardly with loot. A Way granting signature gear is
  good; a Way granting what the party would have found anyway is a dead pick.
- **[OPEN]** Whether a node may offer the *same* benefit twice at different depths, e.g. Health at
  2 and again at 5. Cheap to allow, and it gives a tree somewhere to put filler — which may be an
  argument against it.
