# Card RPG – Skill Rules (Draft 0.2)

> Everything outside combat: sneaking, persuading, climbing, investigating, travelling.
> Status: rules complete. Every procedure needed to play is here. What remains is **content**
> (card lists per Way) and it waits on the world and the Way trees — see section 9.

## Design goals

Out-of-combat play should be fun, not just "draw to pass". The rules aim for:

1. **Choices, not rolls.** You choose *which* card to play and *how* you approach the problem.
2. **Fail forward.** Failure changes the story instead of stopping it. Partial successes come with a cost.
3. **Teamwork.** Your hand rarely has the perfect card, so help from others matters.
4. **Effort is a resource.** Skill cards run out over an adventuring day, so you pick where to push hard.
5. **Same engine as combat.** Cards + items + features + fate + advantage. Nothing new to learn.

---

## 1. Skill deck

Each character has their own **skill deck** of about 15 cards, separate from the action deck.

### Approaches

Every skill card shows one **approach** and a **value** (1–3):

| Approach | Icon (placeholder) | Covers |
|---|---|---|
| **Might** | ✊ | Climbing, breaking, lifting, intimidating, enduring |
| **Agility** | 🌀 | Balance, acrobatics, quick hands, riding, dodging traps |
| **Shadow** | 🌑 | Stealth, deception, disguise, pickpocketing, lockpicking |
| **Wits** | 👁 | Noticing, searching, reading people, tracking, survival |
| **Lore** | 📜 | Knowledge, arcana, religion, history, healing |
| **Presence** | 👑 | Persuading, leading, performing, bargaining, calming |

Some cards also have a small **edge**: a bonus effect that triggers when the card is played, even if the check fails.

```
┌───────────────────────┐
│ 👁 WITS            2  │
│ Sharp Eyes            │
│ Edge: ask the GM one  │
│ yes/no question about │
│ the scene.            │
└───────────────────────┘
```

### Deck composition

- Every deck contains **all six approaches**, so anyone can try anything.
- The **Way** (class) and **background** decide which approaches have more cards and higher values. Rough idea:
  - Way of Strength: lots of Might and Agility
  - Way of Shade: lots of Shadow, Agility and Wits
  - Way of Mind: lots of Lore, Presence and Wits
- Specialists play their best approach more often and with higher values. They still sometimes draw a hand without it, which is where teamwork comes in.
- Each deck has 1–2 **Inspiration** cards: wild, any approach, value 1. *Edge: draw 1 skill card.*

### Hand and refresh

- **Hand size: 4.**
- At the start of each **scene**, draw up to hand size. The GM says when a new scene starts, e.g. a new location, a new conversation, or time passing.
- Played cards go to the skill discard pile.
- The skill discard pile is **not** reshuffled automatically. It comes back on a **short rest** (needs a rest token) or a **long rest**. See *Rests* in the core rules.
- **Fatigue:** if your skill deck and hand are both empty, you can still **improvise**: value 0, with disadvantage.
- Inside a challenge you can't rest, but you can **Catch Breath** (section 3).

---

## 2. Making a check  **[BUILT 2026-11-01]**

> **The skill side was documented in full and entirely unbuilt**, and one piece of the omission was
> load-bearing. `passiveScore` has read `system.decks.skill` since it was written and **that field
> was never declared** — so for every player character it was `undefined`, and the function fell
> through to `system.passive`, which only the NPC model carries. **Every saving throw a character
> ever made used a flat 2**, for every approach, however good their deck was supposed to be. The
> comment above it said *a character derives this from their skill deck*, and a character could not,
> because there was no skill deck.
>
> What exists now: the **skill** card subtype (one approach, a value of 1–3, a `wild` flag for
> Inspiration and an `edge` the table resolves), the three stacks on the character, a fifteen-card
> starter deck, and `resolveCheck` doing the six steps below in that order.
>
> **The four results are a band, not a threshold**, which is the part worth getting right — and
> because they are a pure function of the margin and the fate card, they are pulled out where the
> validator can ask them rather than read them. A **Critical comes off the card**, so a crit that
> still falls short is a success with a bonus rather than a near miss; a **Miss is a Fail** however
> high the total was.
>
> And the trigger came free. A failed check is an event, which is what Spiritualism's *Hold to the
> Bargain* had been waiting for — it named *a reaction trigger* for one commit, and what it actually
> wanted was a resolver. That is the second time a trigger has fallen out of building the thing it
> fires on, after `cast` fell out of casting.


> **[BUILT 2026-11-02]** The GM's half of a check had nowhere to be said, and two rules went
> missing in the gap.
>
> **Step 1 above is the GM's, and the first build gave it to the player.** The tray offered every
> difficulty from Easy 3 to Heroic 9 to whoever clicked their own card, so a player set the
> difficulty of their own obstacle. Nothing in the software disagreed, because nothing in the
> software had ever been told whose step it was.
>
> **And advantage was unreachable.** `resolveCheck` has taken a mode since it was written; the
> dialog never set one. *A good plan, a clever use of the environment, or a fitting background
> grants advantage* is the GM's main lever and the thing section 3's own worked example turns twice,
> and there was no way to pull it. The same omission, seen twice.
>
> **A call** is that half, and it is one thing rather than a field on everybody's dialog: an
> approach (or any), a difficulty, advantage or disadvantage, and a line saying what the obstacle
> is. It stands in front of the whole party until the GM withdraws it, which is what makes a
> challenge work &mdash; section 3 has several characters answering the same gate in turn, and a
> call that cleared itself would have the GM restate it for each of them.
>
> **A player with no call cannot start a check**, and that is a refusal rather than a default: a
> Normal 5 for an uncalled check would be the same defect wearing a sensible-looking number. Saying
> what you are doing out loud is the step that was always there, and the GM answers it in two
> clicks.
>
> **The player is asked only what is still theirs to decide.** The tool is chosen for them, because
> the engine knows what is equipped and which approach it serves &mdash; it is still shown with its
> situation and still clearable, since *Shadow +2 (locks and mechanisms)* is not a bonus to every
> Shadow check. Push appears only when a same-approach card is in hand, help only when somebody
> could give it, and the approach only when the card is a wild and the call named none. **When none
> of those applies the check resolves on the click**, which is the common case at a table: a called
> obstacle, a card that fits, no tool, no push, nobody helping.
>
> And step 2's approach rule is the engine's to hold now. A card that cannot answer the call is
> **dimmed in place and refused** &mdash; dimmed rather than hidden, because hiding it would hide
> why it cannot be played &mdash; and a wild answers any call, which is the whole reason an
> Inspiration is worth a slot that could have held a 3.

Only make a check when **failure would be interesting** and the outcome is uncertain. Trivial tasks just succeed. Impossible tasks just fail, or need a different plan.

1. The GM describes the obstacle and sets a **difficulty**.
2. You play **one skill card** and **say how** you approach it. The approach must fit the description: you can climb a wall with Might or Agility, but not with Presence.
3. **Total** = card value + **tool** bonus + **feature** bonus.
4. Draw a **fate** card and add it (advantage/disadvantage as usual).
5. Compare to the difficulty.

### Difficulty

| Difficulty | Number | Who succeeds reliably |
|---|---|---|
| Easy | 3 | Anyone with a decent card |
| Normal | 5 | Trained, or anyone with a good tool or help |
| Hard | 7 | Specialists with a tool or help |
| Heroic | 9 | Specialists pushing hard with help |

### Results

| Result | When | Effect |
|---|---|---|
| **Critical** | Critical drawn | Success, plus a bonus (extra progress, a useful discovery, ...). |
| **Success** | Total ≥ difficulty | You do it. |
| **Partial** | Total is 1–2 below | You do it, **but** there's a cost: draw a twist card (section 4) or the GM picks a cost. |
| **Fail** | 3+ below, or Miss | You don't do it, **and** the situation changes: draw a twist card. |

How the odds work with the fate deck: if your total equals the difficulty, you succeed 70% of the time. One below gives 30% success and 60% partial. Two below gives 10% success and 60% partial.

### Tools

Items have **skill lines**, just as they have combat lines:

| Item | Skill line |
|---|---|
| Lockpicks | Shadow +2 (locks) |
| Climbing Rope | Might/Agility +1 (climbing) |
| Holy Symbol | Lore +1 (religion, undead) |
| Fine Clothes | Presence +1 (nobles) |
| Healer's Kit | Lore +2 (treating wounds) |

Only equipped or easily reached items count. Pulling something from deep in your pack may take time, which can matter in a challenge.

> **[BUILT 2026-11-02] Eleven of the fourteen tools could never be trained, so a tool names the
> training that unlocks it.**
>
> The cap above is the one place in the game where a training changes a number, and the first
> implementation decided *trained* by matching the tool's **last word** against the trainings the
> character held. So a Healer's Kit went looking for a training with *kit* in it. Lockpicks,
> Climbing Rope and Hunting Traps happened to work; the other eleven could not, and four of them
> could never reach the bonus printed on them at all: **Healer's Kit, Repair Kit, Smith's Hammer and
> *The Kit***, which is the Burglar's Signature, halved for ever by a string match.
>
> A tool now names its training and the comparison is exact. **A tool that names none is not
> capped**, which is the honest reading for a +1: the cap exists because the training does. And the
> invariant that replaces the guess is the one worth having &mdash; *a bonus printed on a tool must
> be reachable* &mdash; so every tool over +1 names a training and every training it names is taught
> by a node. One of them was taught by nothing: **treating wounds**, now on the cloister's infirmary
> and on the school that already names what a body is made of.

**Training:** anyone can use a tool, but an untrained user gets at most **+1** from it. Trained users get the full bonus. Training comes from backgrounds and from the Way graphs, where it is one of the benefits a node can offer ([leveling.md](leveling.md) §4).

### Push and help

- **Push:** play a second card of the **same approach** from your hand to add its value. This costs you more cards and lets a specialist reach Hard and Heroic checks.
- **Help:** another character plays **any** card and describes how they help. Add **+1**, or **+2** if their card has the same approach. Only one helper per check. If the check fails, the helper shares the consequences.
- **Advantage:** a good plan, a clever use of the environment, or a fitting background grants advantage. Disadvantage works the same way for bad conditions.

### Opposed checks

When someone is actively working against you — a guard watching for you, a merchant haggling back, a thief you're chasing — the opposition isn't a difficulty number, it's a character.

- **The player always plays and draws.** NPCs never draw fate in an opposed check.
- The NPC's **resistance** is a flat number the GM sets, the same scale as difficulties:

| Opposition | Resistance |
|---|---|
| Untrained, distracted, or not expecting trouble | 3 |
| Competent and paying attention | 5 |
| Trained specialist, or alerted and hunting you | 7 |
| The best in the region, forewarned | 9 |

- Compare your total to the resistance and read the result off the normal table (Critical / Success / Partial / Fail).
- **A specialist NPC's tactic or motivation** can give you disadvantage instead of raising the number. Prefer that: it keeps the numbers readable and gives players something to play against.
- **Player against player** (an arm-wrestle, a bluff between characters): both play a card and draw fate; the higher total wins, and the active character wins ties.

This keeps all uncertainty on the players' side of the table, so the GM never rolls against them in secret.

### Group checks

When the whole party has to get past the same obstacle — crossing a chasm, sneaking past one gate, keeping a story straight — don't make everyone check.

- **One character checks** for the group. They choose the approach and describe how they get everyone through.
- **Each other character** may either **help** (normal help rules, but the one-helper limit is lifted: each helper after the first adds **+1**, to a maximum of +3 from help) **or** accept being a **liability**: if they have no card of a fitting approach and don't help, the check takes **−1**.
- **On a Partial or Fail,** the consequence lands on the whole group, not just the one who checked.
- **When the group splits up** on purpose — two people over the wall, two through the cellar — that's two checks, and usually a challenge rather than a single check.

### Passive senses

Some things you notice without trying: an ambush waiting in the trees, a lie in a friendly sentence, a tripwire across a corridor. These never cost a card.

> **Passive score = the highest 👁 Wits value in your skill deck + 2.**

- Count the **whole deck**, not your hand: your draw pile, your discard pile, Spent cards, all of it. The score doesn't change as you play through the day.
- **No card is played and no fate is drawn.** The GM compares the score to the difficulty of noticing and tells you what you see. A score of 5 notices anything Normal or easier, always.
- **Features, Know-how and tools apply** if they fit the situation — a Hunter's *Trail sense*, a lantern in a dark room. Conditions and injuries apply too (a lost eye gives −2 against anything you'd have to see).
- **Advantage and disadvantage don't apply**, since nothing is drawn. A circumstance that would grant advantage instead gives **+1**; disadvantage gives **−1**.
- **The highest Wits card in the party** is the one that matters for the group: the party notices what its most observant member notices.

This makes passive senses a **deck-building** question. A character who carries one strong Wits card is permanently alert even if their hands are full of something else, and nobody has to burn a card to walk down a corridor carefully. If you want to notice something *better* than your passive score, that's a normal check: look, search, and play a card for it.

| Highest Wits in deck | Passive score | Notices reliably |
|---|---|---|
| 1 | 3 | Easy: the obvious trap, the nervous liar |
| 2 | 4 | – |
| 3 | 5 | Normal: a waiting ambush, a concealed door |
| 4 | 6 | – |
| 5 | 7 | Hard: a professional tail, a hidden assassin |

### Passive scores, for every approach

> **[BUILT 2026-11-02] The passive scores were right and nobody could see them.** `passiveScore`
> has computed all six correctly since the skill side was built, and no interface anywhere showed
> one to the person whose decision it serves. That is the same shape as a reward nobody can read:
> the arithmetic was there and the answer never reached anybody.
>
> **The panel's job is subtraction.** This section's own rule is *only make a check when failure
> would be interesting*, and a party whose best Wits is 6 simply notices a Normal 5 &mdash; no call, no
> card, no fate draw. **The fastest check is the one nobody makes**, and that is the only reason
> this is worth building before the things it competes with.
>
> It reads as **one row per approach, the party's best and who holds it**, because six numbers times
> four characters is twenty-four numbers to scan mid-sentence and the question is almost always
> *does anyone notice*. Folded open it gives the grid, so the GM can see who else could be asked.
>
> **Three states against a live call**, and the middle one is the only one that needs a check at
> all: the passive already meets the difficulty, or a card could carry it, or their best card in
> hand still falls short and asking is cruel. It is the comparison the check itself makes, printed
> where the decision is taken.
>
> **It is not a secret-roll panel, and will not become one.** A passive score is *static* by design
> &mdash; it counts the best card of that approach in the whole deck, discard included, and never moves
> during play &mdash; which is exactly what makes it safe to read in the open. A GM who wants
> uncertainty calls for a check.

The passive-sense rule is not really about Wits. It is the game's way of turning **a deck into a
number**, and it works for any approach:

> **Passive score = the highest value of that approach in your whole deck + 2.**

| | |
|---|---|
| **Might** | shoving a door that is already giving way, holding a rope, not being moved |
| **Agility** | keeping your feet, flinching out of the way |
| **Shadow** | not being the one they look at |
| **Wits** | noticing — the case written above |
| **Lore** | knowing a thing without having to think about it |
| **Presence** | not being cowed |

**This is your stat line, and it is a consequence of your deck rather than a thing you buy.** A
character with one Might 3 is strong whenever strength is not the point; a character with four Might 1s
is reliably strong *when they try* and unremarkable the rest of the time. Two characters with the same
passive score can be very different in a challenge, which a stat line cannot express.

A character with no cards of an approach has a passive score of **2** in it. Low, but never nothing.

Note what this makes **pruning**: cutting your only Might 3 lowers your passive Might for good. A prune
is already a real decision (§8); this gives it a second edge.

### Saving throws

A check is something you **chose** to attempt. A saving throw is something that **happened to you** —
the trap fires, the spell lands, the floor gives way — and the difference is the whole of the rule:

> **A saving throw is your passive score plus a fate card, against the difficulty.**
> It costs no skill card, because you did not choose to make it.

That is deliberate. Charging a card for something imposed on you is what makes saving throws feel
punitive in other games, and here it would be worse than punitive: it would mean **bad luck shortens
your day**, since the skill deck only refreshes on a rest.

Fate *is* drawn, which is what separates a save from a passive sense. Noticing is a floor and should be
dependable; surviving a trap is a moment and should not be.

Everything else is the machinery already in this section:

| | Passive sense | **Saving throw** | Skill check |
|---|---|---|---|
| Who starts it | nobody | the world | you |
| Number from | passive score | **passive score** | the card you play |
| Fate drawn | no | **yes** | yes |
| Costs a card | no | **no** | yes |
| Difficulty | the difficulty table | the difficulty table | the difficulty table |
| Results | pass / fail | **the results table** | the results table |

And the results table gives saving throws something trad rules have to bolt on: **Partial** — one or two
below — already means *you do it, but it costs*. "Save for half" is native here, and it arrived without
anyone designing it.

### What this game does instead of a saving throw

Not everything that would be a save elsewhere should be one here. Where another game rolls to **avoid a
lasting effect**, this one often hands you the lasting effect and makes it a card:

| Trad save | Here |
|---|---|
| Poison | the **Poisoned** condition (core-rules §7) — Dazed and N damage a turn, running out when its duration does |
| Disease, corruption | **Taint** goes into a deck (core-rules §8). No roll. It is in you now, and it is still there next week. |
| Massive damage, death | **Wounds** and the Unconscious rules (core-rules §8) |
| Fear, horror | **[OPEN]** — Fear or Madness cards in the skill deck ([ideas.md](ideas.md)) |

This is the better trade in a deck game, and it is worth reaching for first. A save is a moment that
passes; a card is a thing you keep drawing, and it tells the story of what happened to you every time
it comes up.

---

## 3. Challenges  **[BUILT 2026-11-02]**

> **The tracks are the only part of this section that is arithmetic, and they were the cheapest
> thing in the game to build** &mdash; because `checkOutcome` already decides which of the four results a
> check produced, and the table below is the only other thing that reads it. Critical +2, Success
> +1, Partial +1 and +1, Fail +1 and a twist: a lookup, not four branches.
>
> **A challenge lives on the active scene beside the call**, because it is a state of the table that
> several people act into and nobody's sheet owns. The two tracks render as bars rather than
> fractions: the question a player asks is *how much room is left*, and a length answers that faster
> than a pair of numbers.
>
> **Only the GM's client records a result**, which is a fact about Foundry rather than a policy: a
> scene flag is the GM's to write and a player resolves their own check. So the result travels as a
> flag on the chat message and one hook moves the tracks. That also keeps the check itself ignorant
> of challenges, which is right &mdash; a check is a check whether or not one is running.
>
> **Neither track is clamped.** A full track is reported and the GM decides what it means, because
> both endings this section describes are about fiction: *progress full* is a success whose
> cleanliness is the pressure left over, and *pressure full* should open a new situation rather than
> close the road.

Bigger situations (infiltrating a manor, chasing a thief, negotiating a treaty, crossing a mountain) are played as **challenges** with two tracks:

- **Progress** (e.g. 6): how much you need to achieve.
- **Pressure** (e.g. 4): how much can go wrong before the challenge fails or turns ugly.

Each round, every character may take **one** action: a check, a help, or something else that fits.

| Result | Progress | Pressure |
|---|---|---|
| Critical | +2 | – |
| Success | +1 | – |
| Partial | +1 | +1 |
| Fail | – | +1 (and a twist) |

- **Progress full:** you succeed. The better the remaining pressure, the cleaner the success.
- **Pressure full:** the challenge fails or changes. The alarm sounds, the thief escapes, the duke walks out. This should lead to a new situation (often combat), not a dead end.

The GM can make some steps **require** a specific approach ("the gate guard needs Presence or Shadow"). Then the right card in the right hand matters, and players have to plan as a group.

### Catch Breath in a challenge

Instead of a check, a character may **Catch Breath**:
1. **Pressure +1.** The other side gets time: the guards change shifts, the duke grows impatient.
2. Shuffle your skill discard pile into your skill deck.
3. Set aside **1** card of your choice from it as **Spent** until your next rest.
4. Draw up to hand size.

### Example: sneaking into the baron's manor

Progress 5, Pressure 3.

1. **Kira** (Shade): 🌑 Shadow 3 + lockpicks +2 = 5 vs Hard 7. She draws +1 for a total of 6, which is a **partial**. The lock opens, but a twist card reveals that a guard dog has noticed something. Progress 1, Pressure 1.
2. **Brom** (Strength): only has ✊ Might in hand. He describes **helping** Aldren by lifting him up to a balcony.
3. **Aldren** (Mystery): 🌀 Agility 1 + Brom's help +1 = 2 vs Normal 5, with advantage for the good plan. Two fate cards: +2 and −1. He uses +2 for a total of 4, which is a **partial**. He's on the balcony but snagged his cloak, which is left hanging. Progress 2, Pressure 2.
4. ...

---

## 4. Twist deck (GM tool)  **[BUILT 2026-11-02]**

> **Thirty cards of eight kinds, and the counts are checked against the table below** &mdash; because
> the counts are the tone, not arithmetic. Changing one changes what the game feels like, so the
> numbers live in one place and the validator reads them from this document.
>
> **It is never forced by a result.** Nothing in the engine draws a twist: a Partial's and a Fail's
> chat line say one is owed, and the deck is a button on the GM's tray. This section is explicit
> about why &mdash; *the GM can always choose a cost directly... the deck is there for when inspiration
> runs out, not to override the GM* &mdash; and about putting back a card that makes no sense here, which
> is a thing only a person can judge. *Twist ×2* is the same button for a dramatic failure.
>
> **Two of the eight are not only prose**, and both are named here as exceptions: **Time** carries
> the extra point of Pressure, and **Opening** is flagged as the one that gives. Everything else is
> a question for the GM to answer, which is why a twist has a cost in words and no effect field.
>
> Drawn to a discard and reshuffled when the deck runs out, which is the only shuffle rule it has.
> Whispered to the GM, because a twist arrives as a decision rather than an announcement.

A **twist deck** of 30 cards helps the GM improvise costs and complications. On a **Partial**, the twist is the price of success. On a **Fail**, the twist *is* what happens instead.

Each twist is a question, not a script: the card names the kind of trouble, the GM says what it looks like here.

### The eight twists

| Twist | Copies | What it costs | In a sneak scene | In a negotiation |
|---|---|---|---|---|
| **Noise** | 4 | Attention. The opposition now knows something is wrong. | A guard shouts "Who's there?" | Someone overhears. |
| **Time** | 4 | The clock. Pressure +1 on top of the normal cost. | It takes far longer than you had. | They ask for a break to think. |
| **Gear** | 4 | A tool. It breaks or is lost: no tool bonus until repaired or replaced. | A lockpick snaps in the lock. | You had to give something away. |
| **Strain** | 5 | Cards. Discard 1 skill card of the GM's choice from your hand. | The climb takes everything you had. | The argument wears you down. |
| **Hurt** | 3 | Health. Lose 2 Health, or gain a condition that fits. | You fall the last stretch. | Your reputation takes the damage. |
| **Arrival** | 4 | Someone new. A third party walks into the scene. | A patrol turns the corner. | A rival arrives. |
| **Secret** | 2 | Information, in either direction. You learn something unwelcome, or they learn something about you. | The room holds something you weren't meant to find. | They know about your past. |
| **Opening** | 4 | Nothing — this one gives. The complication also creates an opportunity. | The dog bolts, but it opens a door. | An unexpected ally speaks up. |

That's **30** cards. The counts are the deck's tone: *Strain*, *Noise*, *Time*, *Gear*, *Arrival* and *Opening* are common, so most twists push the story sideways rather than hurting anyone. *Hurt* and *Secret* are rare, so they land hard when they come.

### Using the deck

- **Draw one card** and apply it. Shuffle when the deck runs out.
- **Draw two and pick** when the failure was dramatic, or when the first card doesn't fit the scene at all. Never force a twist that makes no sense — put it back and draw again.
- **Opening on a Fail** is the fail-forward valve: you didn't do the thing, but a new road opened. If every twist in a session has been bad news, the GM should reach for this one.
- **The GM can always choose a cost directly** instead of drawing. The deck is there for when inspiration runs out, not to override the GM.
- **Twists stack with the challenge tracks.** A twist on a Fail is *in addition* to Pressure +1, not instead of it. Only *Time* adds a second point of Pressure.

### Twists outside a scene

In **downtime** (section 6), read every twist as a story hook rather than an immediate cost: *Arrival* is a rival who notices your research, *Secret* is a buyer who shows unusual interest, *Gear* is a supplier who fails you. Downtime twists should create the next adventure.

---

## 5. Social tactics

NPCs in social scenes work like monsters in combat: they have **social tactics** that create challenges and counter-play.

| Social tactic | Effect | Counter-play |
|---|---|---|
| **Proud** | Disadvantage on Presence checks unless you first flatter or show respect. | Flattery, gifts, titles. |
| **Suspicious** | Partial results always add +1 Pressure. | Proof, references, a good disguise. |
| **Greedy** | Advantage on checks that offer money or goods. | Bribes, but they'll want more next time. |
| **Fearful** | Might (intimidation) has advantage, but Pressure fills twice as fast. | Reassure them first. |
| **Loyal to X** | Can't be convinced against X, only around them. | Find what X wants. |
| **Talkative** | Wits checks to learn something have advantage. | Just listen. |

### Motivations

Every important NPC has **1–2 motivations**: what they want or fear (*wealth, revenge on the guild, protecting their daughter, fear of the church*).

- If you **appeal to a motivation** in a way that fits, you have **advantage** on that check.
- This can be used again and again, as long as the argument still makes sense.
- **Acting against** a motivation gives disadvantage.
- Motivations are usually hidden. You find them by:
  - a Wits check to read the person (often a step in the challenge itself);
  - card edges like *Sharp Eyes*;
  - asking around beforehand (Presence, Shadow), or downtime research;
  - guessing right during play: the GM may reveal a motivation when a player's argument hits it.

### Secrets

A **secret** is something the NPC doesn't want known. Secrets are **slates** the players collect:

```
┌───────────────────────────┐
│ 🗝 SECRET                  │
│ Baron Aldric              │
│ Owes 400 gold to the      │
│ Night Market.             │
└───────────────────────────┘
```

- **Gaining secrets:** through investigation, Wits or Shadow checks, the *Secret* twist (when it goes your way), downtime contacts, or as a reward.
- **Playing a secret:** play it during a check against that NPC to gain **advantage**. Then the secret slate is **spent**. Once revealed, it no longer works as leverage.
- **Stacking:** a secret and a motivation don't stack, since advantage never stacks. A secret can still **cancel** a disadvantage from a social tactic or from acting against a motivation.
- **Consequences:** using a secret makes the NPC remember. They may become an enemy, seek revenge, or start digging up secrets about **you**.

### Secrets against the players

NPCs can hold secrets about the characters too, e.g. from a background, a past failure or a *Secret* twist.

- The GM keeps them as secret slates.
- Played in a social challenge: the player has **disadvantage** on that check, **or** Pressure +1 (GM's choice).
- Then it's discarded, just like for players.
- Players can find out that an NPC knows something and act first: buy it back, steal it, or discredit the source.

---

## 6. Downtime

Activities between adventures (crafting, research, training, earning money, building contacts) are run as **challenges** where time and money are the pressure:

- **Progress:** what you want to achieve, e.g. *craft a fine sword: 6*.
- **Each check = one unit of time** (a day or a week, set by the GM).
- **Pressure:** cost, rising danger, or a deadline, e.g. *4: the materials run out, or the festival starts*.
- Twists in downtime are story hooks: a rival notices your research, a buyer shows unusual interest, ...

| Activity | Typical approaches | Tools |
|---|---|---|
| Crafting | Might, Agility, Lore | Smith's tools, alchemy kit |
| Research | Lore, Wits | Library access |
| Earning money | Any that fits the job | Job-specific |
| Building contacts | Presence, Shadow | Fine clothes, coin |
| Training | The approach being trained | A teacher |

---

## 7. Travel

Travel isn't a skill system of its own. It's a frame for **encounters**:

- The GM builds an **encounter deck for each region**. It mixes combat encounters, challenges, discoveries, social meetings and quiet days.
- Draw one card per travel leg (a day, or a stretch of road). The GM can always replace a draw with a planned encounter.
- Getting lost, weather and supplies are normal checks or short challenges when they come up.
- Resting during travel follows the normal rest rules. A camp in the wild may not be a safe place.

---

## 8. Growing and pruning the skill deck

Skill decks change over a character's life: they **grow** and they can be **pruned** (cards removed or replaced).

### When you level up

Choose **one**:
- **Add** a skill card from your Way's card list.
- **Upgrade** a card: replace it with a card of the same approach and value +1, or with one that has an edge.

You may also **prune** **1** card as part of leveling.

### Training (downtime)

**Training** is a downtime challenge (section 6) that lets you **prune** or **swap** a card between levels, e.g. *Progress 4, one check per week, needs a teacher*. This lets a character change direction without waiting for a level.

### Deck size

- **Minimum 12** skill cards, **no maximum** — unlike the action deck, which is capped at 20
  (core-rules §8). The difference is deliberate: an action deck's size drives the exhaustion clock
  inside a single fight, so it needs a ceiling, while a skill deck refreshes only on rests and
  balances itself across a day.
- Size balances itself:
  - **A small deck** draws your best cards more often, but runs out sooner. The skill deck only refreshes on rests, so you get fewer checks per day.
  - **A big deck** lasts longer through the day, but your hands are less focused.
- Pruning weak cards is therefore a choice between being reliable and lasting long, not a free upgrade.

The same grow/prune principle now applies to the **action deck** too: both decks grow and prune
through benefits on a Way graph node ([leveling.md](leveling.md) §4), so *Add or Upgrade, and prune
1* above describes what a **skill-card benefit** looks like rather than a separate per-level
entitlement.

---

## 9. What's left

The procedures are done. These are decided:

| Was open | Decision |
|---|---|
| Passive senses | Highest 👁 Wits value in your deck **+2**, no card and no fate draw (section 2). |
| Opposed checks | Flat resistance number; only the player draws (section 2). |
| Group checks | One checker, helpers stack to +3, consequences hit everyone (section 2). |
| Twist deck size | 30 cards, 8 types with weighted counts (section 4). |

### Blocked on the world

- **Each Way's card list** — which skill cards a Way of Strength, Shade or Mind character can add on level-up. Needs the Way trees, which need the world. The starter skill deck in [starter-cards.md](starter-cards.md) is a generic stand-in until then.
- **Fear and Madness cards** in the skill deck (see [ideas.md](ideas.md)). The mechanism is the same as Taint; what causes it depends on which horrors the world holds.
- **Approach coverage per background** — the four examples in [backgrounds.md](backgrounds.md) are placeholders.
