# Design direction

Long-term decisions that aren't detailed rules yet.

## Classes: the Ways

**Four** classes, called **Ways**. The world document has a specialization chapter for three of them — and a **Religion** chapter, longer than any of those, which was reaching the rules through a single Way of Mind node called *Priest Magic*. Five bodies of worship, sixteen named gods, tenets, saints, holy books, orders of knights and an assassin sect do not fit in one node, so **Way of Faith** is the fourth. The earlier decision to drop a fourth Way was taken when the only candidate was an invented one; this one was already written.

| Way | Archetype | In the world doc | Major nodes now |
|---|---|---|---|
| **Way of Strength** | Fighters | 15 weapon types, none written | **12 roles** — a weapon type is not a playstyle |
| **Way of Shade** | Rogues | 12, named, none written | **12 restructured** — three professions demoted, one weapon absorbed, four added |
| **Way of Mind** | Mages | 11 schools, ritual magic, most priced | **12** — Divination and Ward Magic added, Priest Magic removed |
| **Way of Faith** | Priests | a Religion chapter: 16 gods in 6 religions, each with a named miracle | **12 gods** in 6 religions, each granting its own short miracle list |

**All four Ways are twelve nodes wide**, which is a target rather than a coincidence: it keeps them
comparable in depth (§7 of [leveling.md](leveling.md) needs branches level), and holding to it is what
kept turning up **missing** nodes rather than spare ones. Ritual magic, household magic and the four
crafts sit outside the count because a major node is a fighting identity.

The three Ways written out so far are shaped differently, deliberately:

| | **Way of Shade** | **Way of Strength** | **Way of Faith** |
|---|---|---|---|
| Shape | **a tree** — 3 titles off the trunk, 9 behind | **a tree** — 3 titles, 9 behind, unevenly | **a fan** — 12 doors at once |
| Told apart by | its **axes** | the **rule each role owns** | its **prices** |
| Why | a rogue's identity is how they fight | a fighter's verbs are everyone's verbs, so identity has to come from a rule nobody else may touch | a priest's identity is who they answer to, and the first choice is permanent |

Twelve siblings cannot lean on seven axes without repeating, so Faith had to be told apart some other
way — and what a god takes from you turned out to be the better coordinate anyway.

Strength needed a third answer again. Mind, Shade and Faith each own nouns the engine treats
specially — spell slots, conditions, gods — while Strength's nouns are **Strike, Defend and Move**,
which every character has, so its natural reward is more of what everyone already does. The fix was
to find that Strength is actually the Way with the **most unclaimed mechanics**: armor, Block, weight
and Overloaded, the Wound threshold, Blast against Aimed, Brace, adjacency. Each role now owns one
outright. The lists are in [specializations.md](specializations.md).

- There is **one graph with one root**, and the root points at all four Ways. A level-up takes a
  node your owned nodes point at. The mechanism is specified in [leveling.md](leveling.md); the
  graphs themselves are not.
- Because the root is never un-owned, **a character may take a second Way later** — at the cost of
  starting its trunk from the bottom. Nothing enforces this; it falls out of the geometry.
- Each Way branches into **specializations**, and these branch again — *Shade → Thief → Assassin*.
  Taking one changes the character's title.
- **Add-on compendiums hang new branches off existing specialization nodes.** A node names what it
  follows, never what follows it, so core content is never edited to make room for an add-on.
- **Some choices close doors.** Exclusive groups **nest**: a node names a *family* and a *creed*, and
  taking it closes every node of that family with a different creed. Way of Faith uses it — the
  family is `faith` and the creed is the religion — so a devotee of The Five may come back for another
  of The Five and never for a god outside it. How restrictive a god is therefore falls out of **how
  many gods its religion has**, with no flag: a pantheon is generous, and Firma's lone local gods are
  absolute. The names are declared rather than listed, so an add-on's pantheon is correctly exclusive
  in both directions without core being edited.
- **A major node is kept distinct by four devices**, not by its name: its **cell** (the axis it leans
  on paired with the resource it pays in, both from closed lists), the **swap test** on its Signature,
  **one thing it gives up in rules**, and a budget of **Signature shapes** per Way.
  [leveling.md](leveling.md) §5a has them; the audit that found them necessary — including two nodes
  that were the same build written twice — is in [specializations.md](specializations.md).
- The specializations are listed in [specializations.md](specializations.md), from the world document.

## Obligations

Settled in [leveling.md](leveling.md) §4: a feature the character **cannot remove**, which the GM
writes and the GM holds, binding **in text**, **in a deck you play from** or **in the fate deck** —
loosest rung that holds. It began as the one answer to four Way of Mind schools whose world-stated
price was a debt to whoever taught them. It now also carries:

- **Way of Faith entire.** Every god grants its miracle on vows, so an obligation is that Way's
  entrance fee rather than any one god's price.
- **Necromancy's bound Taint**, which no cure lifts except by surrendering the formula.
- **The Dream Guild**, proposed on Way of Shade's Thief trunk, because the audit found that no Shade
  node owed anything to anyone.

Which is the test a mechanic should pass before it goes in: it was written once, for one problem, and
is now doing four unrelated jobs.

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
| **The Way graphs are data too** | A leveling node is a document with a stable id and a list of the nodes it follows, so the graph is assembled at runtime from every installed pack. That is what lets an add-on hang a branch off a core specialization without the core being edited. See [leveling.md](leveling.md) §8. |

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
| **Nothing is stowed away**: unequipped means in the pack, and the pack is always reachable for one Ready | Reach was a second axis on top of slots, and it only ever answered the same question twice. One rule — a card gets you anything — is easier to hold in your head and makes every item in your pack a live option rather than a dead one. |
| **One Ready changes one equipped item**, or fills an empty slot | A Ready that cleared a whole slot was one card doing the work of two: a two-hander drawn against a sword *and* a shield turned over three items at once. Now that needs two Readies, which is what it costs. |

| **The back is a pre-paid swap**: slinging costs a Ready, drawing is free, and a slung weapon is carried rather than held | "Nothing is stowed" made the pack reachable for one Ready, which left the back doing nothing the pack did not — strictly worse than not using it. Moving the cost to the front restores the decision without a second reach axis: you spend a card before the fight to have one in hand during it, and pay for it by carrying a weapon you cannot use. |
| A mixed enemy group is **a tier harder** than a uniform one of the same size | Mixing ranges, not adding bodies, is how you build a hard encounter. |
| **Cowardly only on melee NPC types** | On a ranged enemy it is redundant with kiting and defuses the fight. |
