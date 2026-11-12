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
and Overloaded, the Wound threshold, Blast against Aimed, adjacency. Each role now owns one outright.
**Brace is the exception that proves the rule** — it is universal and never blocked on purpose, so a
node that Braces harder would be a bigger number on something everyone has, and it must not become
anybody's identity. The lists are in [specializations.md](specializations.md).

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
| [hud-spec.md](../foundry/hud-spec.md) | The always-visible **tray** for play and the **sheet** for reference; face-up fate discard, automatic mode switching, per-player private hands, reactions that fire by themselves |
| [card-layout.md](../foundry/card-layout.md) | Every printed face, the four information tiers, which types may have an informative back, the bonus-group border |
| [actor-schema.md](../foundry/actor-schema.md) | Actor state, stored vs derived, the encumbrance transition hook, visibility tiers |
| [card-slate-schema.md](../foundry/card-slate-schema.md) | Card and slate subtypes, the icon enum, deck topology, compendium packs |
| [equipment.md](equipment.md) | The full item catalogue: weapons, armour, firearms, tools, consumables, magic items |
| [conditions.md](conditions.md) | All nineteen conditions: keys, flags, what the engine enforces, what applies each |

A **spell is a slate** with one number that does three jobs: *strength* 1–5 is the slot cost, the
power band, and the figure the world document already states for every school. Spell slots are a
budget on the actor, counted in strength rather than in spells, the way carry weight and deck size
are — not an eleventh entry in the slot list. The format and the content standard are in
[way-cards.md](way-cards.md).

Card layout is settled in [../foundry/card-layout.md](../foundry/card-layout.md): the scan column,
the four information tiers, which types may have an informative back, and the bonus-group border.

**Combos are the one place two players' cards combine.** Four **openings** — Wet, Off-Balance,
Marked, Judged, one per Way — are conditions that do nothing at all by themselves and exist to be
read by other cards (core-rules §7). Three rules do the work: an opening carries no rules of its own
so no interaction table can ever accumulate, it is never resisted so a setup always lands, and it
never **gates** a card but only sharpens one, so no card is ever dead for want of its partner. The
reason it is a party mechanic rather than a solo one is the clock we already had: a condition ticks on
its **creator's** turn, so one opening is one round for everybody at the table. Drawing a pair out of
one sixteen-card deck is a trap; holding one card each in two hands is not.

Nothing in the design now blocks writing the system.

## Order of work

1. Core combat rules ✔ (draft 0.3 — balance-tested, see [../sim/](../sim/))
2. Skill deck and out-of-combat play ✔ (draft 0.2 — procedures complete)
3. **Fantasy world** (in progress — `worldinfo/Firma.md`: history, districts, enclaves and religions written; specializations and most monsters are empty headings)
4. Ways, leveling trees, specializations — chassis and all 48 major nodes done
   ([leveling.md](leveling.md), [specializations.md](specializations.md)); **content in progress**
   ([way-cards.md](way-cards.md): the standard, 48 draft Signatures and the minor-node pools —
   roughly 100 cards, formulas and miracles, none of it simulated)
5. Backgrounds
6. Monsters and NPCs with tactics
7. Foundry VTT 14 system

Steps 4–6 all wait on step 3, and so do the last open items in both rule sets:
leveling (how you gain cards and features), each Way's skill-card list, and the
affliction list per Taint source.

## Decisions taken from simulation

The combat simulator is the tie-breaker for numbers. Decisions it has already settled:

- **A damage rung is 7.4 points of win rate and Dazed is 4.0** — so Dazed is **0.54** of a rung,
  which is what prices *Poisoned N* against *Burning N*: about **half a rung more, flat**
  ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §9). Both earlier answers were
  wrong — a whole rung, then two thirds and shrinking — and the second was a story told about
  single-seed noise. **Every simulated figure is now a five-seed mean.**
- **Position-denial is worth exactly what the target's position was worth.** Grappled costs its
  victim **9.1 points** and Prone **6.0** against a damage rung at **7.4** — so a Grapple beats a
  Strike and a Trip loses a little, against a mixed group. Against a brute that wanted to be adjacent
  anyway, both are worth nothing. **Grapple the archer; hit the ogre.**
  ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §7.)
- **Off-Balance measured at exactly 0.0 for as long as it did nothing, and now it is unmeasurable.**
  It was written as a pure opening and the 0.0 was the design holding. It now takes Block to **0**,
  and that half **cannot be measured in this simulator at all**: the hero's shield size is inert in
  it, Block 1 to Block 4 moving the win rate less than the noise at every armour rung. So its price
  is set by argument, and the argument is that a 10 g Flask of Oil should probably not switch off a
  Tower Shield ([core-rules.md](core-rules.md) §7).
- **Mobility is the most valuable thing in a starter deck, and its worth is set by the enemy's
  reach.** Taking the hero's one movement card away costs **29.5 points** against two spears and two
  bows, **3.5** against five spears and **nothing** against three
  ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §6). So **no flanking bonus**:
  positioning already swings more than three damage rungs where it matters, and the only two
  positional rules in the game are NPC tactics, which after these numbers is the right way round.
  The dial for positioning is **encounter composition**, and terrain is how to add decisions to it
  without adding power.
- **A dispel does not belong on an action card.** A Shake Off 1 on a secondary costs **−2.1 points**
  and is played 0.22 times a fight at best, because a one-of-sixteen card is in hand 31% of turns and
  must coincide with the condition. Dispels belong on reactions, prepared spells and features — the
  surfaces that are there when they are needed.

| Decision | Why |
|---|---|
| Weak enemies' Strike is at least 2 above the heroes' armor | Flat armor cancels small hits instead of reducing them. |
| NPC gear is tuned separately from player gear | An NPC's weapon value is the knob that sets its threat; it shouldn't track player weapons. |
| A Defend **primary** blocks every attack until your next turn | A one-shot block lost to the first hit was never worth a primary half. Worth +3.3 points of win rate in the hardest fight. |
| Strike on a card's **secondary** half is a leveling reward, not a starter card | One such card shortens a fight by most of a round. |
| **Stamina is how many cards you can play, unrelated to deck size** | Ruled 2026-11-12, replacing *your action deck is your stamina*. That sentence made a card's contents and a character's endurance the same number, so pruning was a punishment and every card picked up was endurance nobody designed. **The default is 14**, which reproduces all four published encounters within 3.7 points — not 16, because a hero under the old rule plays about 17 cards in a hard fight once breaths are counted. A point is worth about two points of Health, and it is the only stat measured here that does not flatten as it rises. |
| The starter action deck stays at **16 cards** | The old reason — *pruning badly collapses it (45%)* — died with the rule it rested on. Pruning badly is now **free** (+1.8 on the Deadly encounter), so deck size is no longer a balance lever in either direction: 16 is simply the breadth a character starts with. A bigger deck is **worse** in a fight (−12.4 at twenty cards), because a fixed budget sees a smaller fraction of it. |
| **No deck maximum**, and you never choose which cards come to a fight | Ruled 2026-11-12. With stamina decoupled, a cap would be a cap on a drawback. The deck changes only at level up, by pruning or by adding — and because you prune *before* you know what you will face, the price of a sharp deck is the gamble rather than a number. Measured: a cut made for the fight it then fights is **+20.0**, a cut made blind is **+1.8**, and a real character lands between. |
| **Catch Breath recovers 2 stamina**, up to your maximum, and moves no cards | Ruled 2026-11-12, superseding the flat-2-cards rule of 2026-10-29. The card half became redundant the moment the deck cycled for free: the only time the draw pile is empty is after stamina hit zero, and the cycle refills it anyway. Two stamina is one full turn, so the trade is unchanged — give up this turn for a normal one next round — but **there is no limit on how often**, so running out is an interval rather than an ending. **Measured 2026-11-12: the game now breathes a quarter *less* than it used to** (1.53 against 2.14 breaths a fight on the Deadly encounter) and barely at all above the default, because nobody spends a turn shuffling cards they were going to see anyway. The old rule's 22-point lever is largely defused, which is a consequence of the ruling and not a separate decision. |
| **Overloaded costs 2 stamina** | Ruled 2026-11-12. core-rules 8 always said Overloaded *costs you stamina* and charged it in cards, because the deck was the stamina. Measured under the new rule, two cards set aside were worth **−0.1 / −0.2 / +0.8 / −0.5** — nothing, because a card nobody played costs nothing. Two stamina is **−2.0 / −5.7 / −10.2 / −8.3**, against the old reading's −2.3 / −6.5 / −11.2 / −8.5. The number did not move; the currency did. |
| Each NPC **type** has its own fate deck | Blessed and Cursed need a scope, and every other NPC trait is already per type. |
| **Slots come in two kinds**: hot (hands, back, belt) and worn (body, cloak, head, neck, fingers, feet) | Hot slots change in a fight and Ready prices the change; worn slots change between fights and Ready has nothing to price. Conflating them meant either friction with no decision in it, or a Ready cost nobody would ever pay. Where a thing sits is the slot; what it does, and whether two stack, is the bonus group — which is why chain mail and a cloak need no special rule. |
| **Nothing is stowed away**: unequipped means in the pack, and the pack is always reachable for one Ready | Reach was a second axis on top of slots, and it only ever answered the same question twice. One rule — a card gets you anything — is easier to hold in your head and makes every item in your pack a live option rather than a dead one. |
| **One Ready changes one equipped item**, or fills an empty slot | A Ready that cleared a whole slot was one card doing the work of two: a two-hander drawn against a sword *and* a shield turned over three items at once. Now that needs two Readies, which is what it costs. |

| **The back is a pre-paid swap**: slinging costs a Ready, drawing is free, and a slung weapon is carried rather than held | "Nothing is stowed" made the pack reachable for one Ready, which left the back doing nothing the pack did not — strictly worse than not using it. Moving the cost to the front restores the decision without a second reach axis: you spend a card before the fight to have one in hand during it, and pay for it by carrying a weapon you cannot use. |
| A mixed enemy group is **a tier harder** than a uniform one of the same size | Mixing ranges, not adding bodies, is how you build a hard encounter. |
| **Cowardly only on melee NPC types** | On a ranged enemy it is redundant with kiting and defuses the fight. |
