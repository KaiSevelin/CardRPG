# Conditions — the complete list (Draft 0.1)

Every condition in the game, in one place: what it does, what the engine actually enforces, and what
in the content applies it.

**This is a reference, not the rule.** [core-rules.md](core-rules.md) §7 is the rule — how a
condition is applied, how a saving throw resolves, how the duration clock works. This document is
what you look at while writing a card or a sheet, and it is **checked against the engine**:
`test/validate.mjs` fails if a condition exists in
[../foundry/cardrpg/module/config.mjs](../foundry/cardrpg/module/config.mjs) and not here, or the
other way round.

A condition is a **token with a number** (its duration) that remembers **who created it**. The
duration ticks at the start of the **creator's** turn, so a condition always costs its victim
exactly one of their own turns wherever the creator sits in the initiative order
([core-rules.md](core-rules.md) §7).

**Two of the twenty carry a second number.** A `valued` condition has an **intensity** as well as a
duration, printed before it: **Burning 3 (2)** is three damage a turn for two turns. Only fire and
ice have it, and that is the whole policy — §2.1 says why.

---

## 1. The twenty

Four kinds, and the kind is what tells you how to write for it.

### 1.1 Subtractions — twelve

These take something away. They are the fighter's vocabulary.

| Condition | Key | Icon | Effect |
|---|---|---|---|
| **Dazed** | `dazed` | surprised | You can't play a secondary. |
| **Slowed** | `slowed` | tortoise | All Move values are halved, rounding down. |
| **Stunned** | `stunned` | brain-freeze | You can't play reactions. |
| **Prone** | `prone` | falling | Melee Strikes against you have advantage. Standing up costs Move 1. |
| **Grappled** | `grappled` | luchador | Blocks 👣 Move. |
| **Silenced** | `silenced` | silenced | Blocks ✦ Cast — casting needs speech. |
| **Disarmed** | `disarmed` | drop-weapon | Blocks ⇄ Ready, and ⚔ with the disarmed item. |
| **Burning** | `burning` | fire-silhouette | **Burning N**: N damage at the start of your turn. Meets neither armor nor Block. **Cancels with Wet and Frozen** (§5). |
| **Frozen** | `frozen` | frozen-body | **Frozen N**: your Move values are **reduced by N**, floor 0. You still play both halves and keep your reactions. **Cancels with Burning** (§5). |
| **Invisible** | `invisible` | invisible | Enemies can't target you. Ends early if you Strike or Cast at an enemy. |
| **Compelled** | `compelled` | puppet | You must spend your **primary** attacking whoever compelled you. |
| **Unconscious** | `unconscious` | knockout | At 0 Health. No turns, no reactions, Prone. Dying until treated (§8). |

**Invisible is the odd one** — it subtracts from everybody *else*, which is why it is the only
condition on this list anyone wants.

**Burning and Frozen are the mirror pair**, and they mirror in shape as well as fiction: **Burning
spends its value on Health, Frozen spends its value on Move.** Frozen *reduces* where Slowed
*halves*, which is what earns it a place beside Slowed — and at a value at or above your Move you are
not going anywhere, while still playing both halves and keeping your reactions. That is also what
separates it from **Grappled**, which blocks the Move half outright: a Frozen character may still play
*Move 2, then Strike* and get the Strike.

**Compelled is the caster's shape**, and the distinction is the one worth holding onto: a fighter's
condition takes away what you may **do**, a caster's takes away what you may **choose**
([way-cards.md](way-cards.md) §1.7). It subtracts nothing — a full turn, both halves, all reactions,
and no choice of target. That is the only compulsion §7's ban on turn removal permits.

**Unconscious is never applied by an effect.** It means 0 Health and nothing else, and the engine
refuses to set it any other way.

### 1.2 Openings — four

These take **nothing**. They exist to be read by other cards, and all the rules for a combo live on
the card that reads it, never here ([core-rules.md](core-rules.md) §7,
[way-cards.md](way-cards.md) §1.6).

| Condition | Key | Icon | Effect | Set most easily by |
|---|---|---|---|---|
| **Wet** | `wet` | droplets | Nothing by itself. | Mind — Elemental |
| **Off-Balance** | `offBalance` | foot-trip | Nothing by itself. | Strength |
| **Marked** | `marked` | crosshair | Nothing by itself. | Shade |
| **Judged** | `judged` | scales | Nothing by itself. | Faith |

**An opening is never resisted** and **never gates a primary** — both are §7 rules, and the second is
machine-checked. Wet and Off-Balance are *states* the world can hand out free; Marked and Judged are
*calls* with no source but a character. Why there are four and no fifth is argued in
[way-cards.md](way-cards.md) §1.6.

### 1.3 Fate conditions — two

No duration: they last until the card they put in the deck is drawn
([core-rules.md](core-rules.md) §6).

| Condition | Key | Icon | Effect |
|---|---|---|---|
| **Blessed** | `blessed` | aura | Shuffles a temporary **Critical** into the fate deck. Removed when drawn. |
| **Cursed** | `cursed` | imprisoned | Shuffles a temporary **Miss** into the fate deck. Removed when drawn. |

**NPC fate decks are per *type***, so these are worth inversely what there are of the thing: a Miss
in a deck five goblins share is four-fifths wasted, and a Miss in a lone ogre's twenty is coming for
*it*. That makes Cursed the game's only anti-boss effect, and nothing was designed to make it one.

### 1.4 Derived — two

Nobody applies these. They are computed from carried weight and last until you drop some
([core-rules.md](core-rules.md) §4). No duration, and they cannot be removed by a cure.

| Condition | Key | Icon | Effect |
|---|---|---|---|
| **Burdened** | `burdened` | weight-crush | Over your carry limit: Slowed, and disadvantage on 🌀 Agility and 🌑 Shadow checks. |
| **Overloaded** | `overloaded` | weight | Over half again your limit: Burdened, and 2 random cards are Spent. |

**These are the openings nobody has to set.** They are permanent properties of a build rather than
something arranged in a fight, so a card that is brutal against an **Overloaded** target needs no
setter at all and cannot be played around mid-combat. That makes them **counter-build** material
rather than combo material ([way-cards.md](way-cards.md) §1.6).

---

## 2. Intensity, and why only two have it

> **A condition carries an intensity only when the fiction has a reading between "a candle" and
> "a dragon". Two do. Everything else is binary.**

**Dazed 3 means nothing.** Nor does Prone 2, Grappled 4 or Marked 2 — you are either holding a
secondary or you are not, either on the floor or not, either the one they are aiming at or not. And a
second number is a cost **every** condition pays: two figures to read on a token the size of a
thumbnail and a player asking which is which. Paying that for eighteen entries that cannot use it is
the whole of the argument against a general scale.

Fire and ice have the thing the other eighteen do not: a continuum nobody can round off. A candle, a
torch, a burning building and dragonfire are not *longer* fires, they are **fiercer** ones — and the
duration-only version could not tell them apart, because it priced fire entirely by how long it
lasted:

| Before | Meant |
|---|---|
| Burning (1) | 1 damage |
| Burning (5) | 5 damage, one a turn, for five turns |

**That second row is not only a fiction problem.** Duration past the length of the fight is worth
nothing, so a Burning (5) on a 5-Health goblin kills it on a round that never arrives. Fire's whole
dial ran out at about four and dragonfire had nowhere left to go. Intensity is the dial that was
missing, and with it the two numbers divide cleanly:

> **Duration says how long. Intensity says how hard. Burning spends its value on Health and Frozen
> spends its value on Move.**

### 2.1 Bands

Burning meets **neither armor nor Block** — it is non-action damage
([core-rules.md](core-rules.md) §5), so nothing in the game reduces it. That keeps the band tight:

| Burning | Belongs to |
|---|---|
| **1** | a card, or a torch |
| **2** | a strength-1 or -2 formula |
| **3** | a strength-3 formula — a starter Strike every turn, and unblockable |
| **4–5** | **monsters only**, and dragonfire is the 5 |

Frozen is easier to price, because it spends nothing anyone needs to survive:

| Frozen | Means |
|---|---|
| **1–2** | the ordinary card and formula range |
| **3+** | nobody is going anywhere — which is fine, they still get a whole turn |

### 2.2 Two rules the second number needs, and no more

**A Partial shortens a burn; it does not cool one.** Intensity rides through the saving throw
untouched and only the duration halves. One save still covers both numbers.

**A second application takes the max of each number independently** — the longer duration *and* the
fiercer intensity. That is the only version with no order of arrival in it: a candle thrown after a
dragon leaves the dragon's fire burning.

---

## 3. What is deliberately *not* here

Three things that a scale invites and that this list refuses:

| | Why not |
|---|---|
| **A ladder of named steps** — Warm, Burning, Immolated | three icons, three entries and three sets of rules for one continuous thing. The number is strictly better |
| **Intensity on everything** | eighteen of twenty cannot use it, and they would all pay the reading cost |
| **Stacking** — two Burnings making a bigger one | an effect whose value grows by being applied again has no ceiling. Max-of-each has one, and it is the printed number |

---

## 4. Flags — the machine-readable shape

What `CARDRPG.conditions` carries. Anything not listed is absent on that entry.

| Key | `blocks` | other flags |
|---|---|---|
| `dazed` | | `blocksSecondary` |
| `slowed` | | `halvesMove` |
| `stunned` | | `blocksReactions` |
| `invisible` | | |
| `burning` | | `valued`, `cancels` → `wet`, `frozen` |
| `frozen` | | `valued`, `reducesMove`, `cancels` → `burning` |
| `prone` | | |
| `unconscious` | | `blocksReactions` |
| `grappled` | `boot-prints` | |
| `silenced` | `magic-swirl` | |
| `disarmed` | `school-bag` | |
| `compelled` | | |
| `blessed` | | `noDuration` |
| `cursed` | | `noDuration` |
| `burdened` | | `noDuration`, `derived`, `halvesMove` |
| `overloaded` | | `noDuration`, `derived`, `halvesMove` |
| `wet` | | `opening`, `cancels` → `burning` |
| `offBalance` | | `opening` |
| `marked` | | `opening` |
| `judged` | | `opening` |

**`blocks` names icon keys, not verbs**, because that is how *Blocked icons* works
([core-rules.md](core-rules.md) §10): a condition switches off any card half showing the icon, and the
other half of the same card stays playable. **Brace is never blocked**, so no card is ever completely
dead.

---

## 5. Conditions that interact

One relation, and **fire is on both ends of it** — which is why there is no table.

> **Fire cancels water in either of its states.** Neither **Burning** nor **Wet**, and neither
> **Burning** nor **Frozen**, lands on a target already carrying the other: whichever arrives second
> ends the first **without itself landing**. A wet target steams, a frozen one thaws.

`cancels` is symmetric data — both entries carry it — so nothing has to search backwards. The rules
sentence lives on **Burning** rather than on Wet, which keeps the promise that an opening carries no
rules of its own.

Everything else **stacks by not stacking**: a second application takes the **longer** duration and,
for a valued condition, the **fiercer** intensity, each maxed independently.

### 5.1 Why there is no counter table

Four relations between conditions can be imagined. **Only the first is data**, and the reason matters
more than the list:

| Relation | Example | Where it lives |
|---|---|---|
| **cancels** | fire against water | **data** — symmetric, and one relation covers both pairs |
| **replaces** | Off-Balance → Prone; Slowed → Frozen | **the card** — *Sweep the Leg*, *Frost* |
| **removes** | shedding Slowed or Prone | **the card** — *Walk It Off*, a cure, standing up |
| **suppresses** | A on you means B cannot land | **nowhere**; nothing has ever wanted it |

The test is the one the openings already pass, and it is the only thing standing between this list and
the interaction matrix that kills systems built this way:

> **Put the relation on the card. Move it onto the condition only when every table would rule it the
> same way whatever card was played.**

Exactly one relation clears that bar. Everyone already knows what happens when water meets fire, and
they know it before reading the card — so `cancels` is data, and it is the only entry. Nobody has a
prior opinion about whether being Dazed ought to protect you from being Compelled, so a card that
wants that says so itself, and the next card is free to disagree. **A relation in data is a rule in
every future card whether its author wanted it or not**, which is the cost a matrix hides.

What the idea *does* earn is a **reference column** rather than a mechanic — §8.1: for each condition,
what in the content takes it off. Pure lookup, nothing behind it, and writing it out is what turned up
the finding worth having.

---

## 6. How each one lands

From [core-rules.md](core-rules.md) §7, and it is a two-way split with one exception:

| How | When | Resolution |
|---|---|---|
| **Rides an attack** | the condition is printed beside a Strike or Cast that connected | no separate check — the attack already drew fate |
| **Is the action** | the condition is the whole of the half | the target makes a **saving throw**: passive score + a fate card against the printed difficulty |
| **Derived** | Burdened, Overloaded | computed from weight; no check exists |

A **Partial** gives **half the duration, rounded down** — so a short condition is shrugged off and a
long one still bites — or the `lesser` condition if the half prints one. A **Miss** is a fail and a
**Critical** a clean success.

**This is why a spell's conditions may be stronger than a card's.** A fighter's condition usually
rides a Strike and is never saved against; a spell's condition usually *is* the spell, so it is. The
save is what casters pay ([way-cards.md](way-cards.md) §1.7).

### Which approach resists

The author's choice, and it should follow what the thing actually does:

| | Resists |
|---|---|
| ✊ **Might** | being held, moved or worn down — Grappled, Burning |
| 🌀 **Agility** | anything you could get out of the way of — Prone, areas |
| 👁 **Wits** | being fooled or caught out |
| 👑 **Presence** | being cowed or compelled — **Compelled** |
| 📜 **Lore** | magic you understand well enough to shed |
| 🌑 **Shadow** | not being the one it finds |

---

## 7. What the engine enforces

The engine's posture everywhere is **advise, don't enforce** — it shows you what is legal and lets
the table play. This column says which half of that each condition gets.

| Condition | Enforced | How |
|---|---|---|
| **Dazed** | **yes** | the tray allows a primary only, and says so |
| **Stunned** | advisory | a "No reactions" badge; reactions have no legality gate |
| **Slowed** | **yes, on the face** | the printed Move is halved — Move itself is never resolved, figures are moved by hand |
| **Grappled** / **Silenced** / **Disarmed** | **yes** | via `blocks` → blocked icons; Disarmed's *"⚔ with the disarmed item"* half is not modelled |
| **Burning** | **yes** | 1 damage at the start of the victim's turn |
| **Prone** | **yes** | melee advantage; *"standing up costs Move 1"* is not modelled, because Move is not |
| **Invisible** | partial | gives the **attacker** advantage while invisible; nothing prevents being targeted |
| **Compelled** | **no, by design** | targets are chosen by whoever plays the figure, so it is a reminder — as *Taunt* always was |
| **Blessed** / **Cursed** | **no** | see §7: the temporary-card plumbing exists and nothing calls it |
| **Burdened** / **Overloaded** | **yes** | derived from weight every time the sheet recomputes |
| the four **openings** | **yes** | a combo clause reads them in the damage line, the fate draw and the saving throw |

> Three config flags — `blocksSecondary`, `blocksReactions` and `halvesMove` — were declared and read
> **nowhere** until this document was written. Dazed and Stunned worked anyway because the tray
> hardcoded their keys; **Slowed did nothing at all**, and neither did the Move-halving half of
> Burdened and Overloaded. The flags are now the source of truth, so a new condition that costs a
> secondary needs a config entry and no code.

---

## 8. What applies each one

Every source in the content as it stands ([way-cards.md](way-cards.md),
[starter-cards.md](starter-cards.md)).

| Condition | Applied by |
|---|---|
| **Dazed** | *Dirty Trick* (goblin) · *Mock* (Shade) · *Wrong Face* (Glamour) · *Grave Chill* (Necromancy) |
| **Slowed** | *Set* (Trapmaker) · *Pin the Shadow* (Shade) · *Frost* (Elemental) |
| **Stunned** | *Lightning* (Elemental) |
| **Invisible** | Smoke Bomb · *Not Here* (Glamour) · *Vanish*, *Smoke and Go* (Shade) |
| **Burning** | *Scorch* (Elemental, **1**) · *Boil* (Blood, **3**) |
| **Frozen** | *Frost* (Elemental) — **only against a Wet target**; a dry one is merely Slowed |
| **Prone** | *Sweep the Leg* (Strength) |
| **Grappled** | *Get a Grip* (Street Fighter) · *Overbear* (Strength) |
| **Compelled** | *Taunt* (starter) · *Roar* (Strength) · *Play to the Crowd* (Gladiator) · *The Outcast's Due* (Vulpet) |
| **Blessed** | *A Word for You* (The Eternal Spirit) |
| **Cursed** | *The Evil Eye* (Glamour) |
| **Wet** | *Rain* (Elemental) · *Undertow* (Sessyfyn) |
| **Off-Balance** | *Shoulder Check* (Strength) · *Slick* (Poison) · *Taste of the Rot* (The Purple) |
| **Marked** | *Call the Shot* (Shade) · *The Mark of Things to Come* (Divination) |
| **Judged** | *Name the Guilty* (The Eternal God) |
| **Unconscious** | 0 Health, and nothing else |
| **Burdened** / **Overloaded** | carried weight |
| **Silenced** | **nothing** |
| **Disarmed** | **nothing** |

**Silenced and Disarmed have no source at all.** Both are fully specified, both have icons, both are
wired into blocked icons — and nothing in the starter decks, the 48 Signatures, the spell pools or any
item causes either. They are the two conditions the game can suffer and cannot inflict, and the
natural home for both is **monsters**, which are not written yet.

### 8.1 What takes each one off

§5.1's answer to *which conditions counter which*: a reference column rather than a mechanic. Every
removal in the content, and the gaps are the point.

| Condition | Taken off by |
|---|---|
| **Burning** | **Wet or Frozen** (they cancel) · the duration |
| **Frozen** | **Burning** (it thaws) · the duration |
| **Wet** | **Burning** (it steams) · the duration |
| **Off-Balance**, **Slowed**, **Prone** | *Walk It Off* (Strength) · the duration |
| **Prone** | also standing up, for Move 1 |
| **Burdened**, **Overloaded** | dropping weight, and nothing else — no cure touches them |
| **Invisible** | attacking, which ends it early · the duration |
| **Blessed**, **Cursed** | drawing the card they put in the deck |
| **Unconscious** | Health above 0 |
| **Dazed**, **Stunned**, **Grappled**, **Silenced**, **Disarmed**, **Compelled**, **Marked**, **Judged** | **nothing but the duration** |

> **There is no dispel in this game, and eight conditions have no answer at all** beyond waiting a
> turn. That is defensible — durations are short, §7 keeps every condition survivable, and a game
> where the counter is always available is a game where the condition was never a threat. But it is a
> **decision**, and it was made by nobody: it is simply what the content happens to contain.

**The school that should own the gap is Ward Magic**, and it does not yet. Its Signature *Unmake*
**prevents** a Cast from resolving; nothing in the game **removes** a condition that has already
landed. One formula closes it, and it belongs to the warder rather than to a potion:

| School | Formula | Str | Effect |
|---|---|---|---|
| **Ward** | **Shake It Off** | 2 | Reaction: remove one condition from an ally. Not **Blessed**, **Cursed** or a **derived** one — those are not on them, they are in a deck or on their back. |

That exclusion list is the whole of its text, and each entry is for a different reason: the fate
conditions live in a deck rather than on a character, and the derived pair are arithmetic about
carried weight that a spell cannot argue with.

---

## 9. Open

- **[OPEN]** **Blessed and Cursed do not work.** The plumbing is there and unconnected: `decks.mjs`
  already removes a fate card marked `temporary` when it is drawn, and nothing creates one. Applying
  the condition should shuffle a temporary Critical or Miss into the right deck — the victim's own, or
  the **type's** deck for an NPC. Two spells now ask for it (§6).
- **[OPEN]** **Silenced and Disarmed need a source**, and it should be monsters rather than player
  cards. A spellcaster that silences and a brute that disarms are the obvious two, and both wait on
  the monster list.
- **[OPEN]** **Silenced can empty a turn**, which §7 forbids for everything else. The floor is
  computed in [core-rules.md](core-rules.md) §7: of sixteen cards, eight need an ordinary primary to
  make a Silenced turn playable 98.7% of the time. Nothing enforces it, and the caster deck that must
  meet it is unwritten.
- **[OPEN]** **Frightened**, the mirror of Compelled. §7's resist table anticipates it (*"cowed or
  compelled"*) and exactly one card ever wanted it. One entry, one icon, no new fields, if a second
  ever does.
- **[OPEN]** Whether **Invisible** should stop targeting rather than hand out advantage. It is the one
  condition whose written effect and implemented effect are different things.
