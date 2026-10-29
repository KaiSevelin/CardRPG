# Design direction

Long-term decisions that aren't detailed rules yet.

## Classes: the Ways

Three classes, called **Ways**. The world document settles this: it has a specialization chapter for each of the three, so the possible fourth Way is dropped.

| Way | Archetype | Specializations in the world doc |
|---|---|---|
| **Way of Strength** | Fighters | 15, named, none written |
| **Way of Shade** | Rogues | 12, named, none written |
| **Way of Mind** | Mages and priests | 13 magic schools, most written |

- Each Way has a **leveling tree**.
- Each Way branches into **specializations**, and these branch into **sub-specializations**.
- The details depend on the fantasy world, which comes first.

## Backgrounds

Settled in [backgrounds.md](backgrounds.md): every background gives the same five parts —
2 skill cards, 1 small feature, 1 tool training, 1 Know-how situation (advantage in a named
situation) and starting gear. What's missing is the list of actual backgrounds, which waits
on the world.

## Ideas parked for later

See [ideas.md](ideas.md): wild magic, lingering wounds and contamination, battlefield effects, boss phases.

## Foundry VTT plan

Target **v14** (stable since April 2026; pin the manifest and expect one compatibility bump).

| Decision | Settled |
|---|---|
| **Cards vs slates** | Anything shuffled or drawn is a **card** → Foundry `Card` documents. Anything laid out face up is a **slate** → Foundry `Item` documents. See *Cards and slates* in [core-rules.md](core-rules.md). |
| **Card subtypes** | `Card` and `Cards` both support document subtypes with a `TypeDataModel` on `system`, so action, fate, skill, twist and NPC cards are native typed Card documents, shipped in compendium packs. |
| **Card faces are rendered, not drawn** | *Blocked icons* lets a condition switch off any half showing a given icon, so icons are typed data the engine tests. Faces are built from card data; they can't be pre-made images. See [icons.md](icons.md). |
| **Intent cards** | The per-round NPC draw is face down by default, which Foundry's Cards API supports natively. *Foresee* flips one. |
| **Tuning values live in data** | HP, hand sizes, item values, deck composition all go in compendiums and system settings, never in code — they're still moving (see [../sim/](../sim/)). |

The system is specified in [../foundry/](../foundry/):

| | |
|---|---|
| [hud-spec.md](../foundry/hud-spec.md) | The always-visible **tray** for play and the **sheet** for reference; face-up fate discard, automatic mode switching, per-player private hands, the reaction timer |
| [card-layout.md](../foundry/card-layout.md) | Every printed face, the four information tiers, which types may have an informative back, the bonus-group border |
| [actor-schema.md](../foundry/actor-schema.md) | Actor state, stored vs derived, the encumbrance transition hook, visibility tiers |
| [card-slate-schema.md](../foundry/card-slate-schema.md) | Card and slate subtypes, the icon enum, deck topology, compendium packs |

Card layout is settled in [../foundry/card-layout.md](../foundry/card-layout.md): the scan column,
the four information tiers, which types may have an informative back, and the bonus-group border.

Nothing in the design now blocks writing the system.

## Order of work

1. Core combat rules ✔ (draft 0.3 — balance-tested, see [../sim/](../sim/))
2. Skill deck and out-of-combat play ✔ (draft 0.2 — procedures complete)
3. **Fantasy world** (in progress — `worldinfo/Firma.md`: history, districts, enclaves and religions written; specializations and most monsters are empty headings)
4. Ways, leveling trees, specializations ← **the current bottleneck**
5. Backgrounds
6. Monsters and NPCs with tactics
7. Foundry VTT 14 system

Steps 4–6 all wait on step 3, and so do the last open items in both rule sets:
leveling (how you gain cards and features), each Way's skill-card list, and the
affliction list per Taint source.

## Decisions taken from simulation

The combat simulator is the tie-breaker for numbers. Decisions it has already settled:

| Decision | Why |
|---|---|
| Weak enemies' Strike is at least 2 above the heroes' armor | Flat armor cancels small hits instead of reducing them. |
| NPC gear is tuned separately from player gear | An NPC's weapon value is the knob that sets its threat; it shouldn't track player weapons. |
| A Defend **primary** blocks every attack until your next turn | A one-shot block lost to the first hit was never worth a primary half. Worth +3.3 points of win rate in the hardest fight. |
| Strike on a card's **secondary** half is a leveling reward, not a starter card | One such card shortens a fight by most of a round. |
| The starter action deck stays at **16 cards** | Not because small decks are weak — a 12-card deck pruned well for the fight matches a full one (63% vs 65%). Because pruning *badly* collapses it (45%), and a new character can't know what they'll face. Deck size is training wheels, not a balance lever. |
| **Catch Breath recovers a flat 2 cards**, at random, and is unavailable below 2 in the discard | Superseded the half-recovery rule on 2026-10-29. Two is the Exhausted threshold, so a breath buys exactly one turn that is not Exhausted — a way to keep playing, never a way to get back on top. **Costs 22 points of win rate in the hardest fight** (64% → 42%), 4 in a moderate one: breaths per fight double while each returns less, so a quarter of the character's turns go on breathing. The biggest single lever found so far, and **the harshness is deliberate** — measured, looked at, and kept. A mixed hard group is meant to be a fight you can lose. |
| **Overloaded costs 2 random cards**, Spent | Measured: 7 points in a hard fight, 2 in a moderate one. One card is invisible, three takes the fight away. |
| Each NPC **type** has its own fate deck | Blessed and Cursed need a scope, and every other NPC trait is already per type. |
| **Slots come in two kinds**: hot (hands, back, belt) and worn (body, cloak, head, neck, fingers, feet) | Hot slots change in a fight and Ready prices the change; worn slots change between fights and Ready has nothing to price. Conflating them meant either friction with no decision in it, or a Ready cost nobody would ever pay. Where a thing sits is the slot; what it does, and whether two stack, is the bonus group — which is why chain mail and a cloak need no special rule. |
| A mixed enemy group is **a tier harder** than a uniform one of the same size | Mixing ranges, not adding bodies, is how you build a hard encounter. |
| **Cowardly only on melee NPC types** | On a ranged enemy it is redundant with kiting and defuses the fight. |
