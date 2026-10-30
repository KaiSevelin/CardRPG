# Specializations (Draft 0.1)

Every major node in the graph, taken from the world document
([../worldinfo/Firma.md](../worldinfo/Firma.md)). The names are the world's; the **axis** and **cost**
columns are the [leveling.md](leveling.md) §5a template applied to them.

Two columns carry different weight:

- **Pays in** for a **Way of Mind** school is *written in the world already*. Those are not proposals.
- **Leans on** is mostly a proposal, and the places where it is forced are marked.

---

## The find: the world already priced magic

Every magic school in Firma states what learning a formula costs, and nearly every one of those costs
is a rule this game already has or has already parked:

| School | The world's price | The rule it already is |
|---|---|---|
| **Necromancy** | each formula learned means **forgetting something else** | **Taint** of the mind, bound (core-rules §8) |
| **Poison** | preparing costs **skill cards set aside equal to the formula's strength** | **Strain**, on the skill deck (core-rules §8) |
| **Shadow** | a permanent **Wild card** in your deck per formula | **Overcast / wild magic** ([ideas.md](ideas.md)) |
| **Blood** | learning costs **damage equal to the strength**; 4–5 is permanent | Health, and **permanent injuries** ([ideas.md](ideas.md)) |
| **Tattoo (Styrka)** | each formula gives the GM a **secret** against you | **Secrets** (skill-rules §5) |
| **Asceticism** | you give up **body parts** | **permanent injuries** ([ideas.md](ideas.md)) |
| **Elemental** | money and materials | downtime (skill-rules §6) |
| **Glamour** | the elves do not teach for free | an **obligation** ([leveling.md](leveling.md) §4) |
| **Spiritualism** | a **pact with a minor god** per formula | an **obligation** |
| **Household** | negotiating with elf-kin | an **obligation** |
| **Priest** | **vows or a pilgrimage**, whatever the school | an **obligation** |
| **Divination** *(new)* | a **prophecy** the GM holds, one per formula | a **text obligation** ([leveling.md](leveling.md) §4) |

> **Formula strength is 1–5**, and that is the spell-slot cost. A strength-3 formula takes three of
> your slots. "Some spells cost more than one slot" was already written in the world; it just was not
> written in the rules.

Four of those costs are the same shape — something owed to whoever taught you — and they are now one
mechanic: an **obligation** is a feature the character **cannot remove**. The GM writes it and the GM
holds it, and no prune, rest or level takes it off the sheet. One answer serving four nodes.

### Forgetting is a Taint card, not a prune

The world's price for a necromantic formula is *forgetting something else*. Read literally that is a
**prune** — delete a card — and reading it literally was a mistake, for four reasons:

1. **A prune is a reward everywhere else** ([leveling.md](leveling.md) §4): it is the only way to
   drop a dead card. A cost that uses the same verb as a benefit asks the player to be hurt by the
   thing they have been taught to want. If the player chooses the card, they bin their worst one and
   the price is nearly nothing; if the GM chooses, it can delete the card the character is built on.
   There is no setting in between.
2. **Deletion is invisible.** A card that is gone is never drawn, never seen, never felt. The table
   notices a necromancer's price exactly once — on the level-up — and then forgets it, which is a
   strange fate for a mechanic about forgetting.
3. **It pushes the wrong axis.** The Necromancer leans on **Preparation**. A forced prune is a
   **Deck shape** effect, so the cost pulls against the identity instead of expressing it.
4. **It only goes one way.** Nothing in the rules returns a pruned card, so the price compounds with
   no ceiling and no exit.

**Taint of the mind does all of it better, and it is already written.** Dark magic is the named
source for skill-deck Taint (core-rules §8), it has a face in the icon set, and it has a threshold
with teeth at 3. It is **dilution instead of deletion**: nothing is lost, the deck you think with
simply fills up with holes, and you meet one every few draws for the rest of the character's life.
That is what forgetting feels like from the inside, and it is felt at the table rather than recorded
on a sheet.

> **A formula puts one bound Taint (mind) card in your skill deck.** Bound means a cure and
> Cleansing will not lift it — *except* by taking the formula with it. Surrender what you learned and
> the hole it left closes.

The exception is the whole design. The price is reversible at exactly the right cost, so a
necromancer is never trapped by an early choice, and the trade is stated in one sentence: **you may
have the knowledge or the clear head, not both.**

Two consequences worth seeing before this is built:

- **At the third formula a necromancer is Afflicted** — max Health −3, plus whatever the affliction
  for this source turns out to be (core-rules §8 holds that list open). That is a real mark and it
  arrives on schedule, which is what the node wants. It is also a quarter of a 12-Health character,
  so the affliction's own effect should be flavour and standing, **not** another number: the −3 is
  already the number.
- **The price is per formula *learned*, not per slot prepared.** So a necromancer's library stays
  short while other schools hoard a book and choose on the morning. Breadth is the thing this school
  cannot have, which is a sharper constraint than any penalty — and it is the Preparation axis read
  from the opposite end.

---

## Way of Mind — 12 schools, 4 crafts, 1 ritual

Direct magic is cast in combat. Ritual magic is not, and anyone literate can do it.

| Node | Swedish | Leans on | Pays in |
|---|---|---|---|
| **Blood Magic** | Blodsmagik | Tempo | Health to learn, and blood to cast — often your own |
| **Necromancy** | Nekromanti | Preparation | A bound **Taint (mind)** card per formula learned |
| **Elemental Magic** | Elementarmagi | Position | Money and materials (Air, Water, Earth, Fire, Ether) |
| **Poison** | Gift | Control | Skill cards set aside equal to the formula's strength |
| **Glamour** | Glamour | Control | An elven debt, as an obligation |
| **Tattoo Magic** | Styrka | Deck shape | A secret the GM holds against you, per formula |
| **Asceticism** | Asketism | Deck shape | Parts of your body |
| **Shadow Magic** | Skugga | Position | A permanent Wild card per formula |
| **Spiritualism** | Spiritualism | Preparation | A pact with a minor god, per formula, as an obligation |
| **Household Magic** | Hushållsmagi | *(out of combat)* | Negotiation with elf-kin, as an obligation |
| **Priest Magic** | Prästmagik | Preparation | Vows or a pilgrimage; a shorter list than a mage's |
| **Divination** ✱ | Spådom | **Support** | Someone else's turn — and a prophecy the GM holds over you |
| **Ritual Magic** | Rituell magik | *(out of combat)* | Time, and a recipe that can go wrong |
| **Brewer** | Bryggare | *(craft)* | — |
| **Smith** | Smeder | *(craft)* | — |
| **Jeweller** | Juvelerare | *(craft)* | — |
| **Orator** | Oratorer | *(social)* | — |

✱ **Divination is not in the world document.** It is added to bring Mind to twelve schools, matching
Shade's twelve and Strength's twelve, and it is specified below.

**[OPEN]** The crafts and the two out-of-combat schools do not fit the six-axis template, because the
axes are all about a fight. They need either a second template or a different kind of node.

### Divination: the one deck nobody may touch  **[PROPOSED]**

A diviner peeks — but at *what*? Three of the four obvious answers are already spoken for:

| Peek at | Why not |
|---|---|
| **An enemy's intent card** | That is **Foresee**, and core-rules §3 is explicit: *a caster who can Foresee every round shouldn't exist.* Divination is already listed there as one of the things that may reveal an intent, so a whole school cannot be built on it. |
| **Your own action deck or hand** | That is **Deck shape**, and Tattoo Magic and Asceticism already hold it. |
| **Another player's hand** | Hands are private by design ([../foundry/hud-spec.md](../foundry/hud-spec.md)), and this is a table problem, not a mechanic. |
| **A fate deck** | ← unclaimed, and it is the only hidden randomiser in the game |

**The fate deck is the right target, and the rules have already built the fence around it.** The
mechanism is now a keyword in core-rules §6 — **Read N**, *look at the top N cards of one fate deck
and put them back in any order* — so cards and features reference it the way they reference *Foresee*,
and *Read 1* covers plain looking without a second keyword. Three things written for other reasons
make it work:

1. **Every character has their own 20-card fate deck**, and so does every NPC *type* (core-rules §6).
   So a fate deck is a thing that belongs to somebody, and reading somebody else's is a service.
2. **A Miss or a Critical reshuffles the deck.** This is the whole balance of the mechanic, for free:
   you can aim **one** good draw and never bank two, because the moment the good one is used the
   order you arranged is gone.
3. **The composition is known** — 1 Miss, 1 −2, 4 −1, 8 ±0, 4 +1, 1 +2, 1 Critical — so looking at
   three cards finds one of the three swing cards **about 40% of the time**. The other 60% is worth
   roughly +1 to somebody. Real, but not a guarantee.

#### The node

| Part | |
|---|---|
| **Title** | **Divinator** |
| **Stance** | You do not win the fight. You decide who does, and when. |
| **Leans on** | **Support** — the only axis Way of Mind had no node on, and the honest one: foresight nobody acts on is a feeling, not an effect. |
| **Pays in** | **Someone else's turn.** Everything you set up is cashed by another character, and only if they act before the deck reshuffles. |
| **Signature** | **The Reading** — ✦ Cast, a primary half: **Read 3** (core-rules §6) on any one fate deck — a companion's, or an enemy type's. |
| **Gives up** | **Your own fate.** No divination of yours may look at or reorder **your own** fate deck, ever. The seer is blind to themselves. |
| **Not** | not an intent-reader (that is Foresee), not a deck-shaper, not a damage school |
| **Pays to learn** | **A prophecy**, one per formula: the GM writes down one true thing about your future and keeps it. You may not act to prevent it. |

#### Why it holds up

**It passes the swap test** ([leveling.md](leveling.md) §5a.2) harder than anything else on the list.
Offer *The Reading* to a Blood mage, an Elementalist, a Shadow mage or a Necromancer and every one of
them turns it down, because the one deck it may never touch is their own. A card that cannot help the
caster is useless to eleven of the twelve schools and definitive for the twelfth.

**The subtraction is the identity**, which is what §5a.3 asks for. *Blind to themselves* is one clause,
needs no bookkeeping, is enforceable by eye, and is the oldest thing in the mythology of seers. It
also does the balancing: a diviner who could stack their own deck would be a damage school with a
tell, and the ban is what forces the node onto Support instead.

**The price is the mirror of Tattoo Magic.** Styrka gives the GM a **secret about your past**
(skill-rules §5); Spådom gives them a **prophecy about your future** and forbids you to dodge it. Same
shape, opposite direction, and it stays on §4's loosest rung — a sentence the table enforces, with
nothing to run.

**Its best turn is the enemy's deck.** Fate decks are per NPC *type*, so putting the Miss on top of
the goblin deck fails the next goblin to swing, whichever goblin that is. Core-rules §6 already notes
that precision scales with importance for Blessed and Cursed; divination reads the same scale from
the other end — worth most against a warband, exact against a boss.

#### Three mechanisms considered and not taken

| | Why not the Signature |
|---|---|
| **Read the top card** (look, don't touch) | Information with no commitment is advice. It also slows the table to a crawl, because everyone asks the diviner before acting. Fine as a cheap secondary half; too thin to name a school after. |
| **Avert** (top card of a fate deck to the bottom) | Strong and clean, but it is one denial with no texture, and it is nearly Cursed in reverse. **Better as a deeper node** in the branch. |
| **Hold a draw** (draw a fate card now, face down; the next character to draw fate uses yours) | Genuinely good, and very divination — you took a piece of fate out and spent it later. But it is a token on the table and a rules edge around who-draws-when. **Better as a deeper node**, where it reads as the school's mastery. |

All three are fate-deck shapes, so the branch has somewhere to go: *read* at the trunk, *order* at the
title, *avert* and *hold* beyond it.

> **[OPEN]** The Reading has not been simulated. It is a primary half whose value swings between
> nothing and one guaranteed enemy Miss, which is roughly a Defend — in range on paper, and exactly
> the kind of claim [../sim/](../sim/) exists to check.

## Way of Shade — restructured  **[PROPOSED]**

Firma's Shade chapter is twelve headings with nothing under them, so this is the cheapest of the
three Ways to change — and it needed it most. Three problems, in order of size:

**Three of the twelve do not fight.** Spy, Fence and Politician do nothing in a combat, and a major
node is a fighting identity. Shade therefore had **nine** fighting nodes against Strength's twelve
and Mind's twelve: the symmetry was on paper only. All three come back below as minor-node clusters,
which is what [leveling.md](leveling.md) §4 wants the nodes between titles to be.

**Two of the twelve are weapons.** Archer is a bow and Pistolier is a gun — the same error the
Strength list made eight times. One *ranged* node per Way is a playstyle; two is a weapon list. And
Pistolier's price, everything staked on one shot, **is Assassin's price**, which is why Pistolier kept
colliding with its neighbours in both Ways. It is absorbed.

**Bard had no price at all.** The Pays in column was blank — the tell for a node nobody has decided
anything about yet.

| Node | Swedish | Leans on | Pays in | Follows |
|---|---|---|---|---|
| **Thief** | Tjuvar | Control | A free hand and a light weapon | Shade |
| **Scout** ✱ | Spanare | **Support** | **Being alone** — ahead of the party, where nobody can reach you | Shade |
| **Duellist** | Duellister | Reactions | **Halves** — a secondary every round to keep your opponent named | Shade |
| **Assassin** | Lönnmördare | Tempo | **Spent** — the opening is a card gone for the whole fight | Thief |
| **Cutpurse** ✱ | Ficktjuv | Deck shape | **Deck size** — what you lift goes into your deck, and you did not choose it | Thief |
| **Burglar** ✱ | Inbrottstjuv | Preparation | **Weight** — the kit, the rope, the bar, the lantern | Thief |
| **Archer** | Bågskyttar | Position | **Range** — hands full, and ruined by anything adjacent | Scout |
| **Trapmaker** | Fällmakare | Preparation | **A turn spent early**, on a guess about where the fight happens | Scout |
| **Acrobat** | Akrobater | Position | **Weight** — carries nothing heavy | Duellist |
| **Bard** | Barder | Reactions | **Someone else's turn** — your cards fire on theirs, never on yours | Duellist |
| **Gambler** ✱ | Dobblare | Deck shape | **The fate deck** — a Miss *and* a Critical of your own, permanently | Duellist |
| **Half-mage** | Halvmagiker | Preparation | **Spell slots** — few, and neither one thing nor the other | Duellist |

✱ **Scout, Cutpurse, Burglar and Gambler are not in the world document.** The first three are in
[leveling.md](leveling.md) §1's sketch of this very Way, which turned out to be right before the list
was; Gambler is new, and the Dream Guild is where it comes from.

### The shape

Twelve nodes is also the first **tree** written for any Way, because the audit's main lesson was that
uniqueness is a sibling property and a flat list cannot be checked at all:

```
  SHADE            (Position    / halves)
  ├─ THIEF         (Control     / a slot kept free)
  │  ├─ ASSASSIN   (Tempo       / Spent)
  │  ├─ CUTPURSE   (Deck shape  / deck size)
  │  └─ BURGLAR    (Preparation / weight)
  ├─ SCOUT         (Support     / being alone)
  │  ├─ ARCHER     (Position    / range)
  │  └─ TRAPMAKER  (Preparation / a turn spent early)
  └─ DUELLIST      (Reactions   / halves)
     ├─ ACROBAT    (Position    / weight)
     ├─ BARD       (Reactions   / someone else's turn)
     ├─ GAMBLER    (Deck shape  / the fate deck)
     └─ HALF-MAGE  (Preparation / spell slots)
```

**Every sibling set differs on both coordinates**, not merely on the cell, so this Way satisfies the
original strict form of the writing rule and not only the relaxed one:

| Siblings | Axes | Resources |
|---|---|---|
| Thief, Scout, Duellist | Control, Support, Reactions | a slot, being alone, halves |
| Assassin, Cutpurse, Burglar | Tempo, Deck shape, Preparation | Spent, deck size, weight |
| Archer, Trapmaker | Position, Preparation | range, a turn spent early |
| Acrobat, Bard, Gambler, Half-mage | Position, Reactions, Deck shape, Preparation | weight, someone else's turn, the fate deck, spell slots |

Two repeats are left in, deliberately, and both are instructive:

- **Duellist follows Shade on the same resource**, halves, and **Bard follows Duellist on the same
  axis**, Reactions. Neither is a fault: the cell rule governs *siblings*, and a child free to
  deepen its parent is what a branch is **for**. Bard is the Duellist's reactions pointed at somebody
  else.
- **Acrobat and Burglar both pay in weight**, in opposite directions — one carries nothing, one
  carries a kit. They sit in different branches and read as a contrast rather than a collision.

### The find: Way of Shade owes nobody

Every single Way of Mind school states a price to a *person* — an elven debt, a pact with a minor
god, vows, a secret the GM keeps. **Not one Shade node owes anything to anyone.** Their prices are
all mechanical, which makes the whole Way feel self-taught, and it leaves the obligation machinery
([leveling.md](leveling.md) §4) serving five Mind nodes and nothing else.

The world already has the creditor. The **Dream Guild** is *a criminal organisation with branches in
every district* ([../worldinfo/Firma.md](../worldinfo/Firma.md)), it moves dreamwort out of Bogtown,
it is said to hold a treaty with the Horde, and Highfall pays it in troops and slaves. Nobody learns
to pick a lock in that city without somebody knowing.

> **Proposed:** the Thief trunk carries a **Dream Guild obligation**, and it binds in text — §4's
> loosest rung. *They get a cut. They will ask for a favour, and the favour will be inconvenient.*

That one obligation gives the GM a standing hook into any Shade character, gives Fence and Cutpurse
something to be about, and costs the rules nothing to run.

### Spy, Fence and Politician

Demoted, not deleted — as clusters of **minor** nodes along the branches they belong to, carrying
skill cards, training and know-how:

| | Sits on the way to | Gives |
|---|---|---|
| **Spy** | Scout | know-how in courts and crowded cities; training in disguise; the Wits cards a watcher needs |
| **Fence** | Cutpurse | know-how in valuing and moving stolen goods; the contact who buys |
| **Politician** | Bard | know-how in a council chamber; the Presence cards for a room that has already decided |

This is the answer finding 5 wanted and it solves the other half of the problem: a trunk that was
three levels of filler waiting for a title now has three recognisable professions sitting on it.

### What changed

| | |
|---|---|
| **Added** | Scout (Support — Shade had none), Cutpurse, Burglar, Gambler |
| **Absorbed** | Pistolier → Assassin |
| **Demoted** | Spy, Fence, Politician → minor-node clusters |
| **Priced** | Bard, which had no Pays in; Duellist's *one enemy at a time* made concrete as a secondary spent naming them |
| **Unchanged** | Thief, Assassin, Trapmaker, Archer, Acrobat, Half-mage |

> **[OPEN]** The world document's Shade chapter still lists the old twelve, and its Strength chapter
> still lists fifteen weapon types. Both need a pass once these restructures are accepted.

## Way of Strength — restructured  **[PROPOSED]**

The world document lists fifteen, and eight of them are *a weapon type*. **A weapon type is not a
playstyle** — the engine already handles "I use a sword" through the item's Strike line, so Sword,
Two-handed, Polearm, Dagger, Blunt, Crossbow, Musket and Unarmed would be one branch written eight
times.

**Roles work where weapons do not.** A Knight and an Infantryman fight differently whatever they are
holding, and each can carry a different axis. The list below is a proposal; the world document still
has the weapon list, and should be updated once this is agreed.

| Node | Leans on | Pays in | Absorbs |
|---|---|---|---|
| **Knight** | Position | A mount, and the room to use it | Cavalry, Sword |
| **Infantry** | Position | Needs an ally beside you; alone it is ordinary | Formation, Polearm |
| **Guardian** | Reactions | A hand that will never cast | Protection, Shield |
| **Berserker** | Deck shape | Cannot defend; the deck burns down fast | Berserkers |
| **Street Fighter** | Reactions | No weapon value at all — **both hands always free** | Unarmed |
| **Executioner** | Tempo | Both hands, and nothing held back | Two-handed, Blunt |
| **Musketeer** | Preparation | A turn spent loading, and nothing at all up close | Musketeers, Crossbow |
| **Artillerist** | Position | Immobile while it fires | Artillerists, Sappers |
| **Gladiator** | Reactions | Reacts only to attacks on **you** — it pays to be the target | Gladiators |
| **Tactician** | **Support** | Spends turns on other people's turns, not on damage | *(new)* |
| **Vanguard** | Tempo | First in, and takes what that costs | *(new)* |
| **Bodyguard** | Reactions | Reacts only to attacks on your **ward** — never on yourself | *(new)* |

**Dagger specialists** are not here: a knife fighter is Way of Shade, and the Thief and Assassin nodes
already carry it.

**Skirmisher is gone.** It was *Position / carries nothing heavy*, which is the Acrobat's cell
exactly — a light harasser in armour is not a different build, it is the same build in a different
chapter. See the review below.

**Gladiator and Bodyguard are mirrors.** Both react; the difference is *whose* being hit triggers
them. A Gladiator is paid to be the target and a Bodyguard is paid never to be, so the two cannot
share a card between them. Before, both read "tied to a position" and were the same node twice.

**Tactician brings a seventh axis.** Helping an ally is not any of the six — it is not your tempo,
your position or your reactions, it is theirs. **Support** is what you spend your turn on when the
payoff lands on somebody else's. Infantry is next to it but not it: Infantry wants an ally beside it,
Tactician makes the ally better.

Twelve nodes: four on Reactions, three on Position, two on Tempo, one each on Preparation, Deck
shape and Support. The Reactions four are where the cell rule below has to do real work — and it
can, because *whose turn* and *whose being hit* are four different answers.

---

## What this list turns up

1. **Three Mind schools and Priest magic all price themselves in an obligation** — a debt to the
   elves, a pact with a god, vows. That was the one genuinely missing mechanic; it is now written
   ([leveling.md](leveling.md) §4) and it serves those four nodes plus Necromancy's bound Taint.
2. **Spell-slot cost is already written**: formula strength 1–5.
3. **`Armborstspecialister` appeared twice** in the world document. Counted once.
4. **The counts now line up at twelve.** [design-direction.md](design-direction.md) says 15 / 12 / 13,
   which was the world document's own tally: 15 Strength *weapon types*, 12 Shade, and 13 for Mind
   only if you count ritual magic. Restructuring Strength into **12 roles** and adding **Divination**
   as Mind's twelfth school makes all three Ways twelve nodes wide, with ritual magic and the four
   crafts sitting outside the count because they are not fighting identities (finding 5).
5. **The crafts are probably not major nodes at all.** Brewer, Smith, Jeweller, Orator, Spy, Fence
   and Politician are about what you do *between* fights, and a major node is a fighting identity.
   Since **skills live on minor nodes** ([leveling.md](leveling.md) §4), these are most likely
   clusters of ordinary nodes along a branch rather than titles of their own — which also gives the
   nodes between the titles something to be.

---

# Review: the axis is the aisle, not the item

Three devices are meant to keep these nodes apart: the **axis**, the **resource**, and the writing
rule in [leveling.md](leveling.md) §5a — *siblings lean on different axes and pay in different
resources*. Auditing the list above against that rule is the first time it has been tested, and it
found both a weakness in the device and two outright breaches.

## 1. The axis cannot carry it alone

Thirty-five of these nodes fight. Seven axes, thirty-five nodes:

| Axis | At the audit | Now |
|---|---|---|
| **Position** | 9 | 7 |
| **Preparation** | 4 | 7 |
| **Reactions** | 6 | 6 |
| **Deck shape** | 3 | 5 |
| **Tempo** | 6 | 4 |
| **Control** | 3 | 3 |
| **Support** | 1 | 3 |
| | **32** | **35** |

Nine nodes "leaned on Position". Tell a player that and they have learned nearly nothing: it is the
aisle, not the item. **With 35 nodes and 7 axes the pigeonhole principle alone guarantees
collisions**, so no amount of care in writing the axis column will separate these builds. The axis
says which lever a build pulls; it was never going to say what the build *is*.

What the histogram was good for was finding **missing** nodes, which is not what it was built to do.
**Support had exactly one node** — the Tactician, in the Way where helping an ally is incidental — and
none in Way of Mind, where half the fiction is knowing what others do not, nor in Way of Shade, where
going ahead and coming back to tell is the oldest job there is. Those two gaps are the **Divinator**
and the **Scout**, and Support now has exactly one node per Way. **Preparation** rose from 4 to 7 the
same way: it had been defined as "spell slots" and so could only exist in one Way.

A thin axis is a question, then: either it is thin because it is narrow, or because nobody has
looked. Control is still at 3 and may be the next of these.

Two of the re-homings above came straight out of the count. **Preparation was defined as "spell
slots"**, which confined it to Way of Mind and left Position carrying every build that was really
about deciding early: a Trapmaker's whole identity is turns spent before anyone arrives, and a loaded
gun is a turn you already spent. Widening Preparation to *anything decided before it matters*
([leveling.md](leveling.md) §5a) moved two nodes off the overloaded axis and gave two Ways access to
one they could not previously reach.

## 2. The writing rule was already broken, twice

Normalising the **Pays in** column into a closed set of resources turns up two pairs that are the
same node written twice:

| | Axis | Pays in | |
|---|---|---|---|
| **Pistolier** (Shade) | Tempo | Reloading | ← identical |
| **Musketeer** (Strength) | Tempo | Reloading | ← identical |
| **Acrobat** (Shade) | Position | Carries nothing heavy | ← identical |
| **Skirmisher** (Strength) | Position | Carries nothing heavy | ← identical |

Both pairs were legal under the writing rule as written, because the rule only compares **siblings**
and these sit in different Ways. Both are nonetheless indefensible: a player choosing between Ways
reads the whole list, and finding the same build in two chapters tells them the Ways are decoration.
Skirmisher is deleted, Musketeer re-homed, and Pistolier — which caused both halves of the first
pair — absorbed into Assassin when Way of Shade was restructured.

The useful part is *how* they were found. They were not spotted by reading; they were spotted by
writing the two columns as a pair and sorting. **That is a check a machine can run**, and it is the
first device below.

## 3. Uniqueness is local, except when it is not

A node deep in a branch inherits everything above it. Assassin does not need to be distinguishable
from Artillerist — nobody will ever compare them, because reaching one means not having walked to the
other. It needs to be distinguishable from **Burglar and Cutpurse**, the nodes it is actually weighed
against on the level-up where it appears.

So uniqueness is a **sibling** property, and the demand it places on content is far smaller than
thirty-one-way distinctness. Two sets with teeth:

- **Hard rule — siblings.** Nodes sharing a predecessor must occupy different cells. Violation is a
  content bug and the graph validator should refuse it ([leveling.md](leveling.md) §8).
- **Warning — a whole Way.** A repeated cell inside one Way is allowed but suspicious; across Ways it
  is what the two pairs above were. Worth a warning, not a refusal.

## 4. Where the identity actually lives

If the axis is the aisle, the **Signature** is the item — and it is the one part of the six that has
not been written for a single node yet ([leveling.md](leveling.md) §5a). That is the real finding of
this review: **the uniqueness problem and the Signature gap are the same problem.** Everything else
on a major node is a label.

Four devices are now in §5a to make Signatures hard to confuse, in the order they cost to apply:

| Device | What it is |
|---|---|
| **The cell** | (axis, resource) as a pair, from closed lists. Mechanical, sortable, and it caught both breaches above. |
| **The swap test** | Offer the Signature to a sibling. If it would work there, it is not a signature. |
| **One thing you give up** | Every major node subtracts something in rules. Additions stack and blur; subtractions do not. |
| **Signature shapes** | Ten kinds of thing a Signature can be, two per Way. Stops a Way from being ten cards that all add +2. |

The third is the one with the most leverage and the least writing. The two most vivid nodes on this
whole list are **Berserker** (cannot defend) and **Street Fighter** (no weapon value at all), and
both are vivid for the same reason: you can describe them by what they have given up. Nobody confuses
a build that cannot do something.

## Open

- **[OPEN]** The **deity** exclusive group ([leveling.md](leveling.md) §3). Priest magic is "a school
  according to their religion", so the deity node both gates the priest's formula list and closes
  every other god. Firma has five bodies of worship to draw it from — the Eternal God, the Eternal
  Spirit, The Five, The Grey, and the local and minor gods.
- **[OPEN]** Whether Spy, Fence, Politician and Bard stay as Shade **titles** or become clusters of
  minor nodes, the way the crafts probably should (finding 5). Spy and Politician in particular do
  nothing in a fight, and a major node is a fighting identity.
- **[OPEN]** Each node's **Signature** — the one card or feature it is named for. That is where the
  axis gets earned, and it is the next thing to write.
- **[OPEN]** Which specializations hang off which trunk node, and how deep each branch runs.
