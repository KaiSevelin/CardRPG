# Card RPG – Core Combat Rules (Draft 0.3)

> Status: third draft. Individual initiative and intent cards (section 3) are new; numbers in
> sections 4, 8 and 9 are balance-tested against the simulator in [../sim/](../sim/).
> Items marked **[OPEN]** still need a decision.
> Out-of-combat play is covered in [skill-rules.md](skill-rules.md).

---

## 1. Components per character

| Component | What it is |
|---|---|
| **Action deck** | 12–20 personal action cards. Defines how the character fights (see section 8). |
| **Fate deck** | 20 modifier cards. Drawn to resolve attacks and heals. |
| **Item slates** | Everything the character owns. Only **equipped** items can be used. |
| **Feature slates** | Permanent traits (Strong, Good Aim, ...). |
| **Condition tokens** | Temporary effects with a duration counter. |
| **Health** | Hit points. At 0 you are down. |

NPCs use simpler decks (see section 9).

### Cards and slates

Everything in this game is printed the same size and looks like a card. Two words keep them apart, because they behave completely differently:

| | What it is | Examples |
|---|---|---|
| **Card** | Lives in a deck. Shuffled, drawn, played, discarded. | Action, fate, skill, twist and NPC cards — and **Wounds** and **Taint**, which really are shuffled into your decks |
| **Slate** | Laid out face up in front of you. Never shuffled, never drawn. | Item slates, feature slates, secret slates, permanent injuries |

A slate can still be **spent** — a secret slate is used up once you play it — but it never goes into a deck.

---

## 2. Anatomy of an action card

```
┌───────────────────────────┐
│ HEAVY SWING               │
│ ▲ Primary:   Strike +1    │
│ ▼ Secondary: Move 1       │
│ ⚡ Reaction:  Parry        │
└───────────────────────────┘
```

- **Primary**: the strong half. Played as your main action.
- **Secondary**: the weak half. Played as your second action.
- **Reaction**: what the card does on someone else's turn, when its trigger happens. It **fires by
  itself** unless you have turned the card sideways (section 3, *Reactions*).

Any card whose printed reaction cannot fire — the wrong trigger, or a drawback took it — is still a
**Brace: reduce incoming damage by 1**.

> **Brace is a floor, not an option.** One point is deliberately too little to be worth a card, so a
> card with any real reaction live will never fall back to it. Its job is that **no card in your hand
> is ever completely dead** — which is also why nothing can block it (section 10). The one time it is
> the right play is the one that matters: the hit that would otherwise kill you, by exactly one.
> Raising it to 2 would put it in competition with Parry and Block and flatten the choice, so it
> stays at 1.

---

## 3. The round

1. **Refill** – every character draws back up to hand size (default **5**).
2. **Intent** – the GM draws one card per NPC **type** and lays it **face down** (see below).
3. **Turns** – everyone takes a turn, one at a time, in initiative order.

### Initiative

Drawn **once** at the start of combat. The order then stays the same for the whole fight.

1. **Everyone draws one fate card** — players from their own fate decks, every NPC from the NPC fate deck. Each goblin draws for itself.
2. **Highest card acts first**, then down the order. Miss is lowest, Critical highest.
3. **Ties are redrawn.** Everyone still tied draws again, and only they draw. Repeat until the order is settled.
4. A character draws with **advantage** if a feature or tactic grants it (*Alert*, *Ambusher*), and with **disadvantage** for the reverse. As usual, the two cancel out.
5. Normal fate rules apply: a Miss or Critical shuffles that fate deck.

### Intent

NPCs decide what they'll do **before** anyone acts, and they decide it by type.

- At the start of each round, after refill, the GM draws **one card per NPC type** — one for all the goblins, one for all the wolves — and lays each **face down**.
- Every NPC of that type will act on that card when its own turn comes up. A dozen goblins all do what the goblin card says, but each at its own place in the order.
- The card is only **drawn** per type. **Initiative is still individual**, so goblins act scattered through the round, some before the party and some after.
- A type that joins mid-combat draws its intent card as it arrives. If every NPC of a type dies before acting, its card is discarded unused.

**Why face down.** The intent cards are information worth fighting for. The moment the first goblin acts, the players learn what every other goblin is about to do — so killing it first keeps them guessing, and letting it act buys them foreknowledge. Abilities that **reveal** an intent card (a divination, a tactician's feature, a scout's trick) are strongest when the enemy acts late in the order, and worth nothing when they act first.

This also means **the same goblin card plays differently depending on initiative**. *Swarm* ("Strike +1 if another goblin is next to the target") hits for less on the first goblin and more on the third, because the earlier ones have already moved into place.

#### Foresee

Anything that lets a player read enemy intent uses one keyword:

> **Foresee** — Look at one NPC type's intent card for this round.

Put it on divination spells, a scout's feature, a tactician's card half, a Wits-based trick, an
omen-reading item. It needs no icon of its own: it's a named effect, like *Taunt* or *Stabilize*.

Foresee is deliberately **worth a different amount every round**, which is what makes it interesting
rather than a flat bonus:

- **Worth a lot** when the enemy acts late in the order and the party can pre-empt what's coming.
- **Worth nothing** when the enemy acts first and reveals the card for free.
- **Worth most** against several types at once, since each type hides its own card — a mixed warband
  of spear goblins, archers and a shaman has three secrets, and Foresee buys you one of them.

A caster who can Foresee every round shouldn't exist. Price it as a once-per-combat feature, a card
half that competes with attacking, or a spell with a cost.

#### Forestall  **[BUILT 2026-11-07]**

Foresee's twin, and the only thing in the game that **touches** an intent card rather than reading
it:

> **Forestall** — Discard one NPC type's intent card for this round. That type draws a new one at
> once, **face down**.

It is a **reroll, not a cancellation**, and that is the whole of its balance. A type that loses its
turn outright is a dozen goblins standing still for a round, which is more than any card should buy.
A type that draws again has lost the plan you spoiled and keeps the turn.

| | |
|---|---|
| **When** | Before the first NPC of that type has acted. Once one of them has acted the card is public and already being carried out, and nothing recalls it. |
| **Once per type per round** | Or it is a rerolling engine: pay a card, see a worse card, pay again. |
| **The new card is face down** | Even to the player who had Foreseen the first one. You spoiled what you knew and you are blind again, which is a cost that needs no number. |
| **Short deck** | The discarded intent goes to that type's discard and the deck reshuffles when it runs out, exactly as section 9 already says. |
| **No icon** | A named effect, like *Foresee*, *Read* and *Taunt*. |

**Foresee and Forestall are two cards in two hands**, which is the shape section 7's openings
already use: one player learns what is coming and another spends a card to undo it. Forestall
without Foresee is a guess — you are discarding a card you never saw, and what replaces it may be
worse.

> **It is the first enemy-facing effect in the game worth *more* against a swarm than against a
> boss**, and that is deliberate. Blessed, Cursed and Read all sharpen as the target grows in
> importance, because precision scales with importance (section 6) — so every one of them rewards
> sniping the elite. An intent card is drawn **per type**, so Forestalling eight goblins spoils
> eight turns and Forestalling a lone ogre spoils one. The party finally has a tool whose best use
> is the mob, which is also the fight they have the fewest answers to.

### Surprise

If one side has clearly caught the other — an ambush, a sprung trap, a charge into an unaware camp — the surprising side takes a full round of turns before the loser of the surprise acts at all. Then the normal order begins. This is the GM's call, and it replaces the initiative draw for round 1.

### Your turn

- Play **one card for its primary** and **a different card for its secondary**.
- You may play them in either order.
- Both cards go to your **discard pile**.
- The rest of your hand stays for reactions.
- **Two attacks in one turn are allowed** if they come from two different cards, e.g. a Strike primary plus a card with Strike on its secondary. You can never use both halves of the same card.

> **Where double attacks come from.** A card with Strike on its *secondary* half is the strongest kind of card in the game: simulation showed one such card shortens fights by a full round. The rule stays open, but these cards are meant to be **earned through leveling**, not handed out in starter decks. Treat Strike-on-secondary as a reward on a Way's tree, the same way a second attack is a milestone in other games. The mechanism is now specified — it is an **action-card benefit on a Way graph node** ([leveling.md](leveling.md) §4) — and the card is written: *Off-Hand Blow*, Strike on the primary and **Strike −1** on the secondary, in the common minor-node pool any Way may draw from ([way-cards.md](way-cards.md) §3.1). The −1 is what keeps it from making a plain Strike obsolete. The starter deck keeps its one double-strike card.

### Reactions

**Reactions resolve by themselves.** You do not get asked. When a trigger happens, the best reaction
your hand can offer fires, the card goes to your **discard**, and play continues.

- The reaction card is **discarded** — never Spent, whatever the card's halves cost. A reaction is
  the cheap way out of an expensive card.
- Reacting is never free: every card you react with is one more card drawn from your deck at refill,
  so it brings exhaustion closer.

**There are two triggers in the game**, which is what makes an automatic reaction possible at all:

| Trigger | What fires on it |
|---|---|
| **you are hit** | Parry, Block, Brace, Use — and *Bodyguard*, which is this trigger seen from one square over |
| **an enemy ends its move next to you** | Sidestep, Counter |

**A third exists, only a prepared spell may use it, and Way of Mind's Ward Magic is already built on
it** — *a ✦ Cast is made against you or within your reach*. Nothing drawn from a deck gets it. What
lets this one fire by itself is that each warding formula prints its own gate, readable **before**
anything is drawn. See *Reaction spells, and the one that counters* in section 4.

**A reaction fires when the hit is serious, and the rules already say twice what that means:** when
it stops a **Wound** (5 or more past armour, section 8) or stops you being **dropped** to 0. Nothing
less is worth a card. A scratch is a scratch, and a hand spent on scratches is a hand you do not have
when the blow lands.

Two things are true of every reaction in the game:

- **A reaction never draws fate.** A Parry is your item's *Defend* value, a Brace is 1, a Counter is
  your item's *Strike* value. Flat, every one of them — which is what lets the rule above be written
  down at all: a threshold has no meaning against a number nobody has drawn yet.
- **A reaction's damage is not itself a trigger.** A Counter hits, and nothing answers it. A reaction
  answering a reaction is where *one per trigger* stops meaning anything, and this is a cleaner floor
  under it than counting how deep the answers go.

#### Turning a card sideways

**A card turned sideways is reserved: it will not react.** That is the whole of the decision a
reaction asks of you, and you take it in advance, at leisure — not in the half-second after a goblin
rolls.

- It still **counts toward your hand size**, and it does nothing to exhaustion. A reserved card is a
  card in hand.
- **Both halves still play.** Sideways is about the ⚡ row and nothing else.
- Turning a card is **free**, and legal at any time, including in the middle of someone else's turn.
- It clears when the card **leaves your hand**. Everything you draw arrives upright.
- You may turn your **whole hand** sideways. That is a character playing for their turns rather than
  their skin, and it is a real strategy.

> **This is where the judgment went.** An automatic reaction has to decide whether you would rather
> have kept the card, and nothing can know that but you — you are the only one who knows you mean to
> Catch Breath next turn, or that the *Shield Up* in your hand is for its primary. So the question is
> asked **before** the trigger instead of after it: what the rule reads off your hand is not a guess
> about your intentions, it is a declaration you already made. It is also why the threshold above can
> be as blunt as it is.

#### Showing a card  **[BUILT 2026-11-07]**

**Showing a card from your hand is free and legal at any time** — the same latitude turning one
sideways has, and for the same reason: it is a declaration rather than an action.

- It costs nothing, plays nothing and reserves nothing. The card stays in your hand, upright, and
  may still be played or react.
- Any number of cards, to anyone, at any time, including in the middle of someone else's turn.
- Hand **contents** stay private otherwise ([../foundry/hud-spec.md](../foundry/hud-spec.md) §7).
  What you show, you chose to show.

> **This exists because the combos need it.** Section 7's openings are the one place two players'
> cards combine, and they are deliberately split across two hands — one player sets Wet,
> Off-Balance, Marked or Judged, and another reads it. That only works if the second player can
> find out the first is holding the setup, and hands are private. Table talk was doing the work and
> the rules neither permitted nor priced it. Now the channel is a rule, it is free, and it runs
> **one way**: you may show what you hold, and nothing in these rules makes anybody show you.
>
> It also puts a reveal in reach as a **cost** with no new machinery. A half may ask you to show a
> card, and what it takes is information — the cheapest thing there is, and a rung below Strain on
> §1.3's ladder in [way-cards.md](way-cards.md).

**Showing is not a declaration of intent.** A card shown is a card you hold, not a card you have
promised to play; the sideways row is where a commitment is made.

> **And there is nobody to bluff, which is worth writing down.** This is players against the GM, and
> an NPC's action is **drawn rather than chosen** — one intent card per type, face down, before
> anybody acts (*Intent*, above). So there is no read to exploit: a goblin does not go for whoever
> looks dangerous, it does what its card says, and showing a card you mean to Strain away deceives
> nothing. **The hidden-information game runs one way on purpose.** The GM hides intent and the
> players spend cards to learn it (*Foresee*) or spoil it (*Forestall*); nothing runs back the other
> way, because there is nothing at the far end making reads.
>
> Which is also why the deception this game *does* have is built the way it is. *The Rumour* (The
> Yellow, [way-cards.md](way-cards.md) §3.5) names a lie before the fight and **one enemy type acts
> as if it were true**, for as long as a secondary keeps it up — a lie with mechanical force,
> binding by rule rather than by anyone being fooled. That is the only shape a bluff can take
> against an opponent who *draws* their intentions: not a read you mislead, but a card that compels.

**One reaction per trigger.** **One** reaction fires against any single trigger. Parry and Brace never
stack on the same hit, and a whole hand is never thrown at one attack.

- There is **no limit per round**. React to every attack in the round if you can afford the cards — your hand size and the exhaustion it buys are the only limit.
- **Several characters may each react to the same trigger.** One hit can be intercepted by a Bodyguard *and* Braced by whoever ends up taking it.

**Order of resolution.** When more than one reaction applies to the same trigger, they resolve in two
steps, because some reactions change *who* is being hit:

1. **Redirection** — reactions that change the target or the path of an action, such as *Bodyguard*
   (take a hit meant for an adjacent ally). These resolve **first**, in initiative order.
2. **Reduction** — reactions that answer how much an action does: Parry, Block and Brace, and
   **Use**, which belongs to this step by trading the reduction away rather than adding to it. These
   resolve **afterwards**, for whoever is the target now.

So an ally throws themselves in front of a blow before anything of yours is spent on it — and if they
do, you have spent nothing.

**Both steps happen after the draw**, because Parry fires on *being hit* and Brace on *taking
damage*. A **Miss costs the defender nothing**: nothing arrived, so nothing answered it. That is the
same shape as a piece of ammunition being gone whether the shot lands or misses — one of them is
spent on the attempt and the other is not, and which is which follows from who the trigger belongs to.

**A Bodyguard steps in when the blow would drop the ally**, which is the same measure of *serious*
the reduction step uses. Among those who could, the first in **initiative order** takes it.

**One reaction still means one.** The limit covers both steps: a Bodyguard who intercepts a hit has
used its reaction for that trigger and can't also Brace against it. **Sidestep** and **Counter** sit
outside this order entirely — they neither redirect nor reduce, they fire on the other trigger, and
there is no damage yet for either to be measured against.

**The arrival trigger has two answers and you still get one**, so it has an order of its own:
**Sidestep, then Heckle, then Counter.** One reaction answers an arrival, so the order is the
policy: **mitigation outranks retaliation**, because the threshold above is *stops a Wound* or
*stops you being dropped* and a counter does neither. Stepping out of reach denies the attack;
spoiling the draw blunts it; hitting back leaves it untouched.

**Sidestep first.** Stepping out of reach *denies* the attack — the Strike that was coming finds
nobody — where a Counter trades damage for damage and you are still standing there. Someone who
would rather set their spear turns the other card sideways; that is the whole of the override.

Why: the card economy is already the cost of reacting, so reactions don't need a second budget to
track. Capping it per trigger is what keeps a big hit frightening — a lethal blow spends **one** of
your defences, not all of them. Which one is settled by the hand you turned sideways, not by a
question asked while everyone waits.

---

## 4. Verbs and items

Action cards say **what** you do (the verb). Equipped items say **how well** (the outcome).

### Core verbs

| Verb | Needs an item? | Notes |
|---|---|---|
| **Strike** | Yes – uses the item's *Strike* line | Melee or ranged depends on the item |
| **Cast** | Yes – uses the item's *Cast* line | Wands, staves, holy symbols |
| **Defend** | Yes – uses the item's *Defend* line | Shields, weapons that parry |
| **Use** | Yes – uses the item's *Use* line | Potions, scrolls, tools |
| **Move X** | No | Move up to X squares |
| **Ready** | – | Equip or swap one item (see below) |

If an equipped item has no line for a verb, you can't use that verb with that item.

### Ammunition

**Ordinary ammunition is not tracked.** A quiver is a weight in your pack (*Carrying*, below) and
that is the whole of it: nobody counts arrows, and a bow with a quiver behind it simply works.

**Magical ammunition is tracked, because there is one of it.** A single arrow, bolt or ball that does
something an ordinary one cannot:

- **Nocking it is free.** It rides the ⚔ Strike and costs no half of its own — the same reason a belt
  is free to reach into (§4, *What fits where*). A magic arrow that cost an action would never be
  worth firing.
- **One piece per Strike**, and it is **gone** whether the shot lands or misses.
- **It must suit the weapon**, and there are **three classes** — **bow**, **crossbow** and
  **firearm**. An arrow is not a ball. Three and no more: this rule is only ever about whether a
  piece fits what is in your hands, so a fourth class would have to be a fourth kind of weapon.
- **It has to be within reach**, which is that same belt rule and not a new one: a shaft on your
  belt rides the Strike, a shaft in your pack is a ⇄ Ready you have not paid.

> **This is how an archer gets what a caster has.** A caster prepares spells and chooses before the
> fight what they can do; an archer carries shafts and chooses the same way. It is the one place in
> the rules where **coin buys a condition** — so each piece is narrow, each is spent, and the list is
> in [equipment.md](equipment.md) §8.3.

### Shove, Trip and Grapple

> **A Shove, a Trip and a Grapple are Strikes that spend their damage.**

Any ⚔ Strike may be played as one of these instead. It hits as normally — draw fate, apply armor,
everything — but **deals no damage at all**, and does this instead:

| Instead of damage | What happens | Needs |
|---|---|---|
| **Shove** | Push the target **1 square** (§11). You may step into the square it left. | — |
| **Trip** | **Off-Balance (1)**, no save (§7). | — |
| **Grapple** | **Grappled (1)**, resist ✊ Might 5. | a free hand |

**They are universal, because a fighter's verbs are everyone's verbs**
([design-direction.md](design-direction.md)). A mage with a staff may shove; nobody needs a node for
it. What a node buys is a **better** version of the same thing — *Shoulder Check* trips off a
**secondary** rather than a primary, *Get a Grip* grapples with **no save**, *Sweep the Leg* trips
straight to **Prone** ([way-cards.md](way-cards.md) §3). The universal versions are the floor, in the
same way Brace is the floor under every reaction.

**Spending the damage is the whole cost**, which is why none of these needs a price from anywhere
else. It is also what makes them a real decision rather than a free rider on a Strike.

#### When it is worth it, measured

What each of these is worth depends entirely on **how much the target's position was worth**
([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §7, §9). Against a damage rung at
**7.4** points of win rate, averaged over five seeds:

| Condition | Costs its victim | |
|---|---|---|
| **Off-Balance (1)** | *unmeasured* | it zeroes Block, and this simulator cannot price Block — see below |
| **Dazed (1)** | 4.0 | half a rung |
| **Prone (1)** | 6.0 | **0.8 of a rung** — so a Trip loses a little against Striking |
| **Grappled (1)** | 9.1 | **1.2 rungs** — a Grapple beats Striking |
| **Grappled (2)** | 18.3 | two and a half rungs |

> **[MEASURED 2026-11-08] Off-Balance's row is a blank, not a zero, and the blank is the finding.**
> It read 0.0 for as long as the condition did nothing but be an opening. Now it takes Block to 0,
> and the figure cannot be re-taken, because **the simulator cannot price Block at all**: sweeping
> the hero's shield from Block 1 to Block 4 moves the win rate by less than the noise at every
> armour rung &mdash; 37.6 / 38.8 / 38.3 at armour 0, and 61.9 / 65.0 / 62.6 at armour 1, which is
> not even monotonic. Its planner rarely spends a turn Defending, so persistent Block is seldom up
> when a hit lands, and the 3.6 points a fight that Block does prevent arrive through the
> *reaction* path instead. A number taken from that sweep would be a number about nothing.
>
> So Off-Balance's Block half is priced by argument rather than by measurement &mdash; and the
> argument says **its appliers are now mispriced**. Exposed has two appliers in the whole game,
> both of them a Critical or a brute's two-round setup, and since 2026-11-08 that is a **pinned
> rule rather than a count that happens to be low**: no player card applies it and the validator
> says so from both ends. Off-Balance has a dozen, several free and
> unsaveable: a **Flask of Oil at 10 g**, a **Blunt Head arrow at 20 g**, a **Loose Cobble** left
> on the floor, *Slick*, *Shoulder Check*, *Taste of the Rot*, and the universal **Trip**. One
> point off Block was a fair trade for a 10 g consumable. *All* of Block is not: that flask now
> switches a Tower Shield off for a turn, with no save.
>
> **[OPEN]** Either those appliers set only the opening and not the Block half, or they want a
> save, or they want repricing. Read this before adding another one.
>
> **Position-denial is worth exactly what the target's position was worth.** Those numbers are from a
> mixed group, where mobility is worth 29.5 points (§11). Against a brute that wanted to stand next
> to you anyway, a Grapple is worth nothing and the Strike would have been better. **Grapple the
> archer; hit the ogre.** That is the decision these three exist to create, and it is why they are
> options on a Strike rather than cards of their own.

### Block

**Defend** gives you **Block X**, where X is the item's *Defend* value. Block is subtracted from incoming damage (step 6 of section 5).

How long it lasts depends on how you played it:

| Played as | Block lasts |
|---|---|
| **Primary** | Against **every** attack until the start of your next turn. |
| **Secondary** | Against the **next** attack only. |
| **Reaction** | Against the attack that triggered it. |

A Defend primary is a real defensive stance: it costs you your strong half, so it has to hold up against a whole enemy turn. A Defend secondary or reaction is a one-off.

Blocks from different sources don't stack. If you have more than one, **use the highest** — and that
source's duration is the one that applies, so a Defend secondary played behind a Defend primary never
shortens the stance you already had.

Two things fall out of the order in section 5 rather than needing their own rule:

- **A Critical is doubled before Block is subtracted**, because fate is step 5 and defences are step
  6. Block is therefore worth proportionally less against a Critical, which is what makes a Critical
  frightening to a defended target.
- **Damage that does not come from an action never meets Block at all** — a Taint card's 1 damage is
  resolved where it is drawn, not through section 5.

#### Going through, and going round

Two different things, and the difference is the whole of why they are named separately.

| | What it beats | Written as |
|---|---|---|
| **ignores N armor** | N points of armour. Never Block. | A number: a bodkin finds a gap in plate |
| **ignores armour** | All of it, whatever is worn | *Bring It Down* against a door |
| **ignores Block** | All Block, and only Block | *Measure*, *Open the Vein* |

**A step that ignores Block ignores all of it and nothing else.** The Block standing on the
defender does not apply, and the Block **reaction** is not offered — a shield raised in answer is
still a shield. **Parry is untouched**, because a Parry is not a Block: it is a blade turned, and
nothing about going round a shield says anything about that.

Either kind may hang off an **opening** instead of the step, which is the more interesting shape:
*Between the Plates* ignores armour **only against a target it has Marked**, because the Mark is
the gap. An unconditional version of that card would be a different and much stronger card.

> **An unconditional total bypass may not reach a creature that runs in packs**, and on the NPC
> side that is a rule rather than a preference. Intent is drawn once per **type** (§3), so every
> creature of that type acts on the card: against a character in Plate, `ignores 2` is 1 damage an
> attacker and `ignores armour` is 3, which is 5 against **15** for five of them &mdash; and 15
> kills a 12-Health hero outright. So a **number** is safe on a broad capability and a **total** is
> only safe where a swarm cannot reach it. That is a fact about the roster, which means it can be
> checked, and since 2026-11-08 it is: the validator lists the gates carrying an unconditional
> bypass and the ones that reach a creature with `pack`.
>
> A bypass that waits on an **opening** is exempt, and that is how a broad gate carries one safely:
> *Worry It* is on `feral`, 10 of whose 44 creatures pack, and it cannot fire until something has
> put the target Off Balance.
>
> **[OPEN] `siege` breaks the rule today.** *Bring It Down* carries an unconditional bypass and the
> **Mole Man Digger** has both `siege` and `pack`. The card names *a door, a wall or a held
> position* and nothing in the engine holds it to that, so a pack of diggers may swing it at a
> person in Plate for full damage each. Three ways out: hold the card to objects, gate it on an
> opening, or take `pack` off the Digger. Recorded rather than hidden, which is why the pin reads
> `siege` instead of `none`.

> The pair to learn the rule from is *Heavy Swing* and *Measure*. Both are `Strike +1`. The first
> ignores 2 armor and the second ignores Block, so the first is the answer to plate and the second
> is the answer to a shield — and which of them is in your hand is a different question against a
> knight than against a shieldwall. They were the same card until these fields existed.

### Equipped items and Ready

Only equipped items can be used. There are two kinds of slot, and they work differently.

**Hot slots** hold what you are using. They change during a fight, and **Ready is what pays for the
change**.

| Slot | Count | To put it there | Example |
|---|---|---|---|
| Hands | 2 | 1 Ready | Sword + shield, or a two-handed staff (takes both) |
| Back | 1 | 1 Ready — **but drawing from it is free** | A slung two-hander, a spare blade |
| Belt | 2 | free | Potions, scrolls |
| Spells | your spell slots | **between fights only** | Prepared spells (see below) |

**Your back is a swap you pay for in advance.** Slinging something over your shoulder costs a Ready
like anything else; taking it back off costs nothing. Sling the bow before the fight and it is in
your hands for free in the middle of one.

What you give up is the use of it while it hangs there: **a slung weapon is carried, not held.** It
strikes with nothing, defends with nothing and grants no bonus until it is in your hand. The back
carries one thing.

**The belt is free.** Hanging something on it, or swapping what is on it, costs no Ready — a belt
sits under the hand that is already holding something, and everything on it is the kind of thing you
grab without thinking. That is what a belt is for. Charging a Ready for it only ever meant the
potion you brought was the potion you never drank.

**Worn slots** hold what you are wearing. They change **between fights and never during one** —
nobody swaps rings while being stabbed — so there is nothing for Ready to price.

| Slot | Count | Example |
|---|---|---|
| Body | 1 | Armor |
| Cloak | 1 | A cloak over the armor |
| Head | 1 | Helm |
| Neck | 1 | Amulet |
| Fingers | 2 | Rings |
| Feet | 1 | Boots |

A slot says **where a thing sits on you**, which is why chain mail and a magical cloak coexist
without a special rule. What it *does*, and whether two of them stack, is the **bonus group**
(section 5) — two rings of different groups both apply, two of the same group do not. The two
questions are independent on purpose.

> Worn slots start **empty**, and the usual way to fill one is loot. That is the job: the hot slots
> are where your turn gets decided, the worn slots are where a campaign accumulates.

### What fits where

An item lists the slots it fits, and that list **is** the rule — there is no second rule by item
type. Most things fit one place. Some fit two, and then **you choose when you put it on**, because
where a thing sits changes what it can do:

| Item | Fits | Why it matters |
|---|---|---|
| Dagger | Hands, **Belt** | On your belt it is out of the way and still a Ready from your hand |
| Healing Potion | Belt, **Hands** | Held ready, it is a Use with no Ready to pay first |
| Longsword, Shield, Bow | Hands, **Back** | Slung, it stays in reach without occupying a hand |
| Plate mail | Body | One slot, so it is never asked about — and never goes in a hand |

A two-hander takes **both hands**, but slung over a back or hung on a belt the same weapon is one
object. Two hands is a fact about using it, not about carrying it.

### What a Ready does

**Everything you are not using is in your pack**, and everything in your pack can be reached. There
is no third place to keep things and nothing is out of bounds — what retrieving costs is a card.

**One Ready does one of two things:**

| | Costs |
|---|---|
| Put an item into an **unused** slot | 1 Ready |
| **Change one** equipped item — swap it for another | 1 Ready |

And nothing else. A Ready that would turn over **two** equipped items is not one Ready: drawing a
two-hander while holding a sword *and* a shield means putting one of them away first, and that is
its own Ready.

Two things cost nothing: **the belt**, either way, and **drawing off your back**, because that Ready
was already paid.

This is why the second weapon you bring matters less than the hand you have free to take it in —
and why what you sling before the fight is a real decision.

### Spells and preparation

A spell is a **slate**, like a sword or a potion, and it has a slot of its own. Carrying a spell is
not the same as being able to cast it: **you prepare spells, and only prepared spells can be cast.**

A spell in your book is not the same as a spell in a wand: see *Two kinds of casting* below.

| | |
|---|---|
| **Spell slots** | How many you may prepare, counted in **formula strength**, not in spells. More come from leveling ([leveling.md](leveling.md) §4); a first Way of Mind or Way of Faith node grants **2**. |
| **Strength** | Every spell has one, **1 to 5**, and it **is** the slot cost — a strength-3 formula fills three slots. It is also the power band ([way-cards.md](way-cards.md) §1.4). |
| **When** | **Between fights.** Preparation is not something you change while being shot at. |
| **Unprepared** | Stays in your **spell book**, which is where spells live when they are not in your head. |

This is the caster's version of the choice a fighter makes about what to sling on their back, and it
is made at the same time — before anything starts. A fighter who brought the wrong weapon can draw
another for a Ready. **A caster who prepared the wrong spells has prepared the wrong spells.** That
is the trade: a caster decides in advance and a fighter decides in the moment.

> **[OPEN]** A later spell or feature that re-prepares one spell mid-fight. It is an obvious thing
> for a Way of Mind branch to grant, and it should stay rare enough that the choice above still
> matters.

#### Two kinds of casting

✦ Cast comes from two different places, and they ask for different things.

| | **The item's Cast line** | **A prepared spell** |
|---|---|---|
| Where the magic is | in the object | in your head |
| Examples | Staff of Healing, Fire Wand, a holy symbol, a scroll | whatever you prepared this morning |
| Needs | the item **in hand** — which is just the slot rule | a **free hand**, and speech |
| Limited by | what you are carrying | your spell slots |

A **free hand** means an **empty** one. You gesture with it, and you cannot gesture holding a sword in
one hand and a shield in the other. An implement does not count — a staff in both hands is casting
*its own* magic, not leaving you a hand for yours.

> | In your hands | Item Cast | Prepared spells |
> |---|---|---|
> | Staff of Healing (2) | yes — Heal 3 | **no** |
> | Fire Wand (1) + free | yes — Blast 1 | yes |
> | Sword + shield | — | **no** |
> | Sword + free hand | — | yes |

So the staff and the wand are not two spellings of the same thing. **The staff is a better item and a
worse hand**: it casts reliably without preparing anything, and it costs you your whole repertoire
while you hold it. The wand leaves a hand open. And a shield costs a caster nothing until they also
want a weapon — that is the decision the rule exists to create.

**Speech** is what **Silenced** already takes away (section 7). It blocks ✦ Cast wherever the magic
came from, because a wand has a command word too; gags, water and held breath hang off the same hook.

#### Reaction spells, and the one that counters  **[BUILT 2026-11-07]**

A prepared spell may be a **reaction**. It costs no half, because it was never in your hand to play
— it is in your head, and it fires on a trigger the way a card's ⚡ row does. A miracle already works
this way, and it is a counter in everything but its name: *The Silent Hour* (The Grey, strength 2),
*"Reaction, adjacent only: an enemy's action does not happen."*

Which answers the question a Way of Mind player will ask first. **Can a spell be countered?** It
already can: **Ward Magic** is a school of eight formulas built on exactly this trigger, four of
them Cast-answering reactions ([way-cards.md](way-cards.md) §3.4). *Unmake* stops a ✦ Cast you have
survived before, *The Mirror* turns one back on its own caster, *The Standing Ward* stops every Cast
on the field including yours, and the title feature *The Standing Guard* grants an extra reaction
each round usable only against a Cast.

- **Never a drawn card.** Simulation settled this for dispels and the reasoning transfers whole: a
  one-of-sixteen card is in hand 31% of turns and must coincide with its trigger, so it is played
  **0.22 times a fight at best** ([../sim/](../sim/)). A counter that is usually not in your hand is
  not a counter — and Ward Magic is the school that finding vindicated.
- **The trigger is the third in the game and the only one it gets.** Section 3 holds to two because
  an automatic reaction has to be decidable without asking you, and this one is: every gate Ward
  Magic prints is knowable **before anything is drawn** — whether you have survived this Cast
  before, whether it is aimed at you, or no gate at all.
- **The gate is per formula, not one global threshold.** Every other reaction resolves *after* the
  fate draw, which is what makes *stops a Wound or stops you being dropped* a number at all. A
  counter must fire **before** the draw or it is not countering, it is reducing — so it cannot use
  that threshold, and Ward Magic's answer is to print a condition on each formula instead. Any new
  Cast-answering spell owes the same: a gate that can be read off the table with nothing drawn.

**And the Cast trigger has no order, which the other two do.** A hit resolves redirection before
reduction, and an arrival resolves Sidestep, then Heckle, then Counter (section 3). One reaction
still answers one Cast — but *several characters may each answer the same trigger*, and two warders
in one party can both reach for it. **Prevention outranks redirection**: a Cast that does not
resolve has nothing left to aim anywhere, so *Unmake* and *The Standing Ward* resolve before *The
Mirror*. If an ally unmakes it, your Mirror is unspent — the same courtesy the redirection step
already pays on a hit.

### Carrying

Slots govern what you can **use**. Weight governs what you can **haul**.

Your **limit** is **40 kg**, counting everything on you: equipped items, belt, pack and loot.
**Features can raise it** — like *Tough* and *Quick* these are flat traits rather than bonuses to an
action, so they are **not** bonus-grouped (section 5).

| Load | | Effect |
|---|---|---|
| Up to your limit | **Unburdened** | — |
| Over it, up to half again (41–60 kg) | **Burdened** | **Slowed**, and disadvantage on 🌀 Agility and 🌑 Shadow checks |
| Over half again, up to double (61–80 kg) | **Overloaded** | Burdened, **and 2 random cards are Spent** |
| Over double (81 kg +) | — | You can't pick it up. Make two trips. |

Neither state has a duration: both last until you drop enough weight. You can shed a load at any
time, including as a free part of your turn — dropping things is never an action.

**Burdened** lands on moving and sneaking, because laden you are slow, noisy and clumsy. Might is
untouched, since a load doesn't make you weak, and Strike is untouched, so a hauling party is never
helpless — just easy to catch.

> **[MEASURED] Burdened is the most expensive state in the game**, by a factor of two over anything
> else measured ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §13). Against a mixed
> group it costs **81.7 points** of win rate in Mail and **68.6** in Plate. The reason is arithmetic
> rather than subtle: Slowed **halves** a printed Move, the starter deck's Moves are 1, 2 and 3, and
> halving turns every **Move 1 into a Move 0** — so a burdened hero cannot close on an archer at
> all. "Just easy to catch" is an understatement; against anything with reach it is fatal.
>
> **And Overloaded charges nothing on top.** Being Burdened costs up to 81.7 points; going on to
> Overloaded costs nothing that can be resolved (31.4% against 34.4%, the spreads nearly touching),
> because two random cards out of sixteen is close to free next to being Slowed. **The whole price of
> being over your limit is the first rung** — which is a problem for the second one, recorded in
> [equipment.md](equipment.md) §12.

**Overloaded** costs you stamina, which in this game means deck. Shuffle your action deck, turn up
**2 cards at random** and set them aside as **Spent**; they return, shuffled back into your draw
pile, when you are no longer Overloaded, or on your next rest.

- **Spent, not discarded.** A discarded card comes straight back on your next Catch Breath. Spent
  cards stay out, so a heavy load genuinely shortens your deck and brings exhaustion forward —
  roughly a round earlier in testing.
- **Random, not chosen.** A pack doesn't care which of your tricks it costs you. Choosing would let
  you shed your dead cards, which is a reward for being overloaded rather than a price — and it
  would turn every pickup into a deck-pruning decision.
- **Where they come from.** Normally you pick up a load between fights, when your deck is whole. If
  you become Overloaded during a fight, take the cards from your **draw pile**; if that is empty,
  from your hand.
- Two is a measured number, not a guess. In simulation two random cards off a 16-card deck cost
  **7.5 points of win rate in a hard fight and 2.5 in a moderate one**; three starts taking the
  fight away. That difficulty-scaling is the point — hauling loot through a quiet dungeon is nearly free,
  hauling it into a real fight is a coin flip. See
  [../sim/analysis-2026-10-27.md](../sim/analysis-2026-10-27.md).

### Weights

- Item slates give a weight in **whole kilograms**. Anything under a kilo counts as **0** on its own —
  bundle them and the bundle gets a weight: a quiver, a roll of picks, a purse.
- **Coins:** 100 gold weighs 1 kg. Pocket money is free; a chest of treasure is a problem.
- **A person** weighs 70–90 kg. Carrying a fallen ally therefore means dropping your own kit first,
  and still leaves you Burdened. That is intended: getting someone out should cost something.

Weight and the **Heavy** / **Light** tags measure different things and shouldn't be confused:

| | What it measures | Read by |
|---|---|---|
| **Weight (kg)** | What the thing costs to haul | The carry limit |
| **Heavy / Light tags** | How the thing handles when wielded | Features like *Strong* |

A Heavy weapon usually weighs more, but the tag is about swinging it, not carrying it.

> A full kit of adventuring gear comes to roughly 10 kg, so 40 kg is not a constraint on how you
> equip a character. It is a constraint on **loot**: what you can carry out of the dungeon, how much
> ore the caravan takes, whether you can drag an unconscious ally. Set the weights of treasure and
> cargo with that in mind — they are what the rule is for.

**Ready** is a special action. You can only Ready by playing a card half that shows the **Ready icon**. The icon can be on either the primary or the secondary half.

Ready lets you:
- equip one item from your pack into an empty slot, **or**
- swap one equipped item with one from your pack.

**Outside combat, equipping is free.** Rearrange your slots as often as you like between fights, and
start a combat with whatever you were carrying. Ready exists because doing it **under pressure** costs
you a card half — not because buckling on a shield is hard.

Inside a **challenge** it is not free: swapping gear takes your action for the round like anything
else, and digging something out of the bottom of your pack may cost more than that
([skill-rules.md](skill-rules.md) §2).
When you build a deck, include enough Ready cards for the character's style. A weapon-swapper needs more of them than a sword-and-board fighter.

---

### Active abilities and recharge

Most of what a slate gives you is **passive**: it is simply true. *Tough* raises your max Health,
*Strong* adds a point of damage with Heavy items, a Longsword strikes for 3. Nothing to track, and
nothing to remember to use.

An **active** ability is one you choose to use, and it doesn't work every time.

> **Drain** — using the ability turns the slate **sideways**. It gives nothing more until its
> **recharge** comes round. Every slate with an active ability prints its recharge, next to the
> ⟳ **Charging** icon.

A recharge is either a **count of turns** or a **boundary**:

| ⟳ | Comes back |
|---|---|
| **1** | At the start of your next turn |
| **2, 3, …** | After that many of your turns |
| **Combat** | When the combat ends |
| **Short rest** | On a short rest — and so costs a rest token |
| **Long rest** | On a long rest |

**Counting turns** works exactly like a condition's duration: the number ticks down by 1 at the start
of each of **your own** turns, and at 0 the slate turns upright again. It runs in combat rounds and in
challenge rounds alike (see [skill-rules.md](skill-rules.md) §3), since both are ordered sequences of
turns.

**Outside a fight or a challenge, a turn-counted ability is simply ready.** Nobody is counting turns
while the party walks down a corridor, and a two-turn cooldown was never meant to budget a day. That
is the division: **turns pace a fight, rests budget a day.** If an ability needs limiting outside
combat, give it a rest recharge instead.

- **Turn the slate sideways; don't flip it.** A slate's back carries its description, so flipping
  already means "let me read this", not "I used it".
- **One active ability per slate**, or a sideways slate is ambiguous. If you want two, that's two
  slates.
- **Consumables don't recharge at all.** A Healing Potion is gone when you drink it — the far end of
  the same scale.

Short counts are for the rhythm of a fight — a weapon trick you can lean on every second or third
turn. The three boundaries are for things that should feel like a decision: once this fight, once
between rests, once a day.

#### Passive or active is the main dial for pricing a slate

| | Passive | Active |
|---|---|---|
| Size of effect | Small | Can be large |
| Tracking | None | A sideways slate |
| Examples | *Tough*, *Quick*, *Strong*, *Good Aim*, *Arcane Focus* | *Steady*, *Drilled*, *Faithful* |

**A big effect must be active.** If a slate would swing a fight on its own, give it a recharge. If
it's worth a point here and there, leave it passive and let the player forget it exists.

#### Recharge and bonus groups are different dials

A slate can carry both, and they limit different things:

| | Limits |
|---|---|
| **Bonus group** (section 5) | How many bonuses **stack** on one action |
| **Recharge** (here) | How **often** an ability works |

---

## 5. Resolving an action

Always in this order:

1. **Base value** – the item's line for the verb (e.g. Longsword Strike: 3 damage).
2. **Card modifier** – any bonus on the action card (e.g. *Strike +1*).
3. **Features** – permanent modifiers (e.g. Strong: +1 on Strike with *Heavy* items).
4. **Conditions** – temporary modifiers on you or the target.
5. **Fate** – draw one card from your fate deck and apply it.
6. **Target's defenses** – subtract armor, then Block (section 4). The result can't go below 0.
   A step may **ignore** either of them; see *Going through, and going round* in section 4.

### Bonus groups

Bonuses don't stack from the same kind of source. Every slate that grants a **numeric bonus** belongs
to exactly one of seven groups, shown as a coloured border with a number (see
[../foundry/card-layout.md](../foundry/card-layout.md)).

> **One action or check may take at most one bonus from each group.**

| # | Group | Where the bonus comes from |
|---|---|---|
| 1 | **Body** | Your flesh |
| 2 | **Training** | Your practice |
| 3 | **Tool** | The implement in your hands, doing its job |
| 4 | **Make** | How well that thing was made or enchanted |
| 5 | **Power** | A force you channel |
| 6 | **Station** | How the world sees you |
| 7 | **Wonder** | Nothing else — it is singular |

- Only **bonus** contributions are grouped. Whatever supplies the **base** value is exempt, so a
  weapon and a feature can never lock each other out of being used.
- Features that grant advantage or a flat trait (*Alert*, *Tough*, *Quick*) aren't grouped at all.
- Action cards and skill cards are never grouped.
- **Tool is what a thing does; Make is how good it is.** A lantern that gives Wits +1 in the dark is
  a Tool. A lantern of everburning silver giving a further +1 is Make.
- **Wonder is for the extraordinary, not the awkward.** No rule guards it, because rarity and the
  group cap already do: only one Wonder bonus applies to any action, however many you own. Classify
  carefully for the player's sake rather than for balance — two Wonder slates are worth less than two
  differently-grouped ones, since only one can ever contribute.

This is the same principle the fate deck already uses for advantage — two sources of advantage still
give one — applied to numbers. Bonuses have to come from **different kinds** of help: muscle and a
tool, not two kinds of muscle.

Fate is drawn for **damage and healing**. Movement, Ready and Defend never draw fate.

**One draw per action, not per target.** An action that hits several creatures — any Area — draws fate **once** and applies the same result to everyone it hits. A Critical doubles the damage to all of them; a Miss means the whole attack does nothing.

---

## 6. Fate deck

Each character has their own 20-card fate deck:

| Card | Count | Effect |
|---|---|---|
| Miss | 1 | Action has no effect. Shuffle the fate deck after the action. |
| −2 | 1 | |
| −1 | 4 | |
| +0 | 8 | |
| +1 | 4 | |
| +2 | 1 | |
| Critical | 1 | **On an attack, draw from the critical deck** (below). On anything else, double the value. Shuffle the fate deck after the action. |

- **Blessed**: shuffle a temporary *Critical* into your fate deck. It is removed when drawn.

#### The critical deck  **[BUILT 2026-11-08]**

**A Critical on an attack draws one card from the critical deck, face up, and reads it out.** Ten
cards, five faces:

| Face | Copies | What it does |
|---|---|---|
| **Through and Through** | 4 | Double the damage, as a Critical always did. |
| **Find the Gap** | 2 | **Exposed** &mdash; their armour counts **0** for a turn. Not doubled. |
| **Off the Feet** | 2 | **Off-Balance** &mdash; their Block counts **0** for a turn, and it is an opening. Not doubled. |
| **Driven Down** | 1 | **Halted** &mdash; their next turn does not happen. Not doubled. |
| **Both** | 1 | Draw two **others** and take both. |

**The draw comes before armour and Block are read**, so the gap a Critical opens is a gap that
same blow goes through: *Find the Gap* takes the armour of the hit that found it to **0**. `resolveAttack`
draws first and snapshots the defences afterwards, and the simulator was corrected to match.

**One draw per action**, like the fate draw it hangs off: an Area attack that crits draws once and
every target gets the same answer. The conditions land on the first target.

**It has no back and never will.** It is turned face up the instant it is drawn and read aloud, so
it is never face down in front of anybody &mdash; the same reason a hand, a discard and a Spent pile
have none. A back for it would be a picture nobody would ever see.

**Attacks only.** A Critical on a check or a heal simply doubles, as before. This deck is about what
a critical *hit* did to a body; a Lore check that drew *Off the Feet* would be a deck reaching
somewhere it has no business.

**Both sides draw from it.** One deck for the table, not two tunings of one rule &mdash; and that is
what the measurement below is about.

> **[MEASURED 2026-11-08] Exposed beats doubling exactly when the armour is larger than the
> printed damage** &mdash; so an either/or deck is still a nerf to whoever hits hard, but it is no
> longer a nerf everywhere.
>
> This is arithmetic before it is a simulation. Doubling adds the printed damage; *Find the Gap*
> adds **the armour**, because it takes it to 0. A goblin spear prints 3, so a condition face is
> worse than doubling at rungs 1 and 3 and **better at rung 4**: against Plate, Through and Through
> gets 6&minus;4 = 2 through where Find the Gap gets the full 3. Rung 4 is the one rung this deck
> improves, and it is the rung the complaint was about.
>
> 2500 fights a cell:
>
> | | 3 spears | 4 spears | 5 spears | 2 spear 2 bow |
> |---|---|---|---|---|
> | **armour 1** | | | | |
> | *before the deck* | 98.6 | 88.4 | 63.4 | 34.8 |
> | **as written (either/or)** | **99.0** | **90.3** | **70.2** | **36.7** |
> | *effect rides along* | 97.9 | 86.9 | 61.1 | 33.4 |
> | **armour 3** | | | | |
> | *before the deck* | 100.0 | 99.6 | 97.8 | 98.5 |
> | **as written** | 100.0 | 99.9 | 98.1 | 99.0 |
> | *rides along* | 99.9 | 98.8 | **94.2** | **94.7** |
> | **armour 4** | | | | |
> | *before the deck* | 100.0 | 100.0 | 99.7 | 100.0 |
> | **as written** | 100.0 | 100.0 | **99.3** | **99.5** |
> | *rides along* | 100.0 | 99.5 | **97.5** | **97.2** |
>
> **Rung 4 moves for the first time**, which no version of this deck managed while Exposed took
> only 2 off. Back then the Critical floor already let a spear through for 1 and *Exposed 2* against
> armour 4 bought exactly that same 1, so the deck was pure redundancy there. **Zeroing is what
> gets past the floor**, and that is the whole value of this change.
>
> **The either/or weighting still makes a character in Leather safer**, by up to 6.8 points against
> five spears. That has not changed and will not, because against a lightly armoured target the
> armour is small and the doubling is not: a critical that trades 3 damage away for 1 point of
> armour is a critical that got weaker. The dial is one word in the content &mdash; whether a face
> applies its effect **as well as** doubling rather than instead of it &mdash; and riding along
> restores the threat at rung 1 and is the only row that bites at rungs 3 and 4 together.
>
> Left as written, because *either/or* is the design as asked for and this is a weighting call, not
> a bug. Recorded here because the number disagrees with it at rung 1 and agrees with it at rung 4.
- **Cursed**: shuffle a temporary *Miss* into your fate deck. It is removed when drawn.
- **Wild**: a **permanent** passenger, and the third special card.

#### Wild

A **Wild** is not a swing. The action **resolves at its plain value** — no bonus, no penalty, and
never a Miss — and then the table draws from the **Wild Magic deck**
([ideas.md](ideas.md), *Wild magic and miscasts*), which is where the interesting part lives.

Three things make it different from the other two specials, and all three matter:

| | Miss / Critical | Wild |
|---|---|---|
| reshuffles the deck | **yes** | **no** |
| stays in the deck | one of each, always | **permanently**, until something removes it |
| what it does to the value | nothing / doubles | **nothing at all** |

**It is a cost you accept, not one inflicted on you.** Wilds arrive because somebody reached for
more power than they had: *Overcast* trades a Wild for a stronger spell, and **every Shadow Magic
spell puts one in your deck** — the one school whose whole cost is written in this card. Not one per
formula learnt but one **per cast**, so a shadow mage's luck gets stranger the more they reach, and
a Wild stays until you have **slept** (a long rest), which is what keeps it from accumulating
forever.

#### The Wild Magic deck

Drawing a Wild sends you to the **Wild Magic deck**: twelve cards, **five good, four bad, three
both**, shared by the whole world rather than owned by a caster. One deck means the table meets the
same twelve possibilities every time, which is what makes them learnable — and it cycles, so a table
that has seen *Misfire* knows it is out of the deck for a while.

> **The slight edge to the good is deliberate, and it is not what makes Shadow Magic cheap.** A Wild
> resolves at plain value, so adding Wilds dilutes the Miss and the Critical **equally** and takes
> variance *out* of your fate deck — which means the school's price was never going to be found in an
> average. Shadow Magic costs you the ability to **predict your own turns**, and that is what
> *Misfire* (the Cast hits the nearest creature, ally or not) and *Backlash* are for: a tail, not a
> penalty. A mage who needs to know what will happen should learn something else.

> **A Wild does not break the `2/k` readout, and this is why.** That number is true because exactly
> one Miss and one Critical sit in the deck between reshuffles; a Wild is **not** a swing and does
> **not** reshuffle, so it joins the `k` and never the `2`. The practical effect is that a deck
> carrying Wilds is **less** swingy per draw and takes longer to come round — which is the shape of
> the bargain: a wild mage's luck is flatter, stranger, and harder to read.
- **The reshuffle on Miss and Critical is load-bearing.** It means the order of a fate deck is never
  reliable for long, which is what keeps anything that *looks at or rearranges* a fate deck — a
  divination, a feature, a blessing — from banking two good draws. You can aim one.
- Later idea: some features or level-ups replace weak fate cards with better ones.

### Advantage and disadvantage

- **Advantage:** draw **2** fate cards and use the **better** one.
- **Disadvantage:** draw **2** fate cards and use the **worse** one.
- Better/worse order: Miss < −2 < −1 < +0 < +1 < +2 < Critical.
- Both cards are discarded. If **either** card was a Miss or Critical, shuffle the fate deck after the action. Bless/Curse cards drawn this way are removed even if not used.
- **No stacking:** two sources of advantage still give one advantage.
- **Cancelling:** if you have both advantage and disadvantage, they cancel. Draw one card as normal.
- Only actions that draw fate (damage and healing) are affected.

Common sources:

| Advantage | Disadvantage |
|---|---|
| Melee Strike against a Prone target | Target has cover (section 11) |
| Attacking while Invisible | Ranged or Area attack while adjacent to an enemy (section 11) |
| Card or feature says so | Card, feature or condition says so |

### NPC fate decks

**Each NPC type has its own fate deck**, the same 20 cards. One for the goblins, one for the wolves,
one for the ogre. Every NPC of that type draws from it.

This matches how everything else about an NPC works — its action deck, its intent card, its tactics
and its gear are all per type — and it is what makes **Blessed** and **Cursed** usable against
enemies. A Cursed goblin shuffles a temporary Miss into the *goblin* deck; it has no effect on the
ogre standing beside it.

**Precision scales with importance**, which is the happy consequence. Curse one goblin in a warband
and the hex spreads to its kin, because they share a deck — a reasonable fiction, and cheap. Curse a
boss and it lands on the boss alone, because an elite is its own type with its own deck. The enemies
worth cursing are the ones where the curse is exact.

A typical fight has two to four types, so the GM handles two to four decks — the same number of piles
as the NPC action decks already in front of them.

### Reading a fate deck

Anything that lets a character look into a fate deck uses one keyword, the way enemy intent uses
*Foresee*:

> **Read N** — Look at the top **N** cards of one fate deck and put them back in **any order**.

| | |
|---|---|
| **Whose deck** | Any one fate deck in the fight — your own, a companion's, or an NPC *type*'s. A card or feature may narrow that, and divination does: a Divinator may **never** read their own ([specializations.md](specializations.md)). |
| **Read 1** | Looking at one card and putting it back is just looking, so the cheap version needs no keyword of its own. |
| **Who knows** | You do. Saying what you saw is a decision at the table, not a rule — but the order they go back in is **yours** either way. |
| **Short deck** | Fewer than N cards left: read what is there. |
| **No icon** | A named effect, like *Foresee*, *Taunt* and *Stabilize*. |

**The reshuffle is the fence.** A Miss or a Critical reshuffles the deck, so an order you arranged
survives only until the first swing card is drawn. You can aim **one** good draw and never bank two,
and no feature needs to say so because §6 already did.

Two consequences worth knowing before putting Read on a card:

- **Advantage draws two and uses the better**, so a Read of 2 or more sets up an advantage draw as
  well as a plain one. Against disadvantage it works in reverse — put the two worst on top of an
  enemy's deck and their advantage is spent on nothing.
- **Precision scales with importance**, the same way it does for Blessed and Cursed. Reading a goblin
  warband's deck aims one draw for whichever goblin swings next; reading a boss's deck aims it at the
  boss. The enemies worth reading are the ones where the reading is exact.

Like Foresee, Read is **worth a different amount every round**: worth most when a hard-hitting enemy
is about to act or an ally is about to spend a Spent card, and worth nothing when nobody with a stake
in it draws before the deck reshuffles.

---

## 7. Conditions

Conditions are tokens with a number (duration). Every condition remembers **who created it**.

**Three of them carry a second number.** **Burning**, **Poisoned** and **Frozen** have an
**intensity** as well as a duration, printed in front of it — *Burning 3 (2)* is three damage a turn
for two turns. **Duration says how long; intensity says how hard.** Nothing else on the list has one,
because nothing else has a reading between a candle and a dragon, and *Dazed 3* would mean nothing
([conditions.md](conditions.md) §2). Two rules cover the second number and there are no others:

- **A Partial shortens a burn; it does not cool one.** Only the duration halves.
- **A second application takes the max of each number** — the longer duration and the fiercer
  intensity, independently. A candle thrown after a dragon leaves the dragon's fire burning.

> **Poisoned is the one whose scale starts at 0.** *Poisoned 0* is Dazed and nothing else — a sickness
> that slows your hands without killing you — and every rung above it adds that many damage a turn on
> top. **Poisoned N is Burning N plus Dazed**, which is why it costs one rung more than Burning does
> for the same number, and why the bottom rung exists at all: Burning has nothing to be at 0.

> **The complete list is [conditions.md](conditions.md)** — all nineteen with their engine keys,
> their flags, what the system actually enforces and what in the content applies each one. This
> section is the **rule**; that document is the **reference**, and the validator keeps it in step with
> the engine. Effects are repeated here because a rule you have to follow a link for is a rule nobody
> reads.

- The duration ticks down by 1 at the **start of the creator's turn**. At 0 the condition is removed.
- So *Dazed (1)* from a goblin lasts until the start of that goblin's next turn. The victim always suffers it for exactly one of their own turns, wherever the creator sits in the initiative order — if the goblin acts before them the condition bites this round, if it acts after them it bites next round, but it always costs exactly one turn.
- Conditions you put on yourself (e.g. Invisible from a Smoke Bomb) tick at the start of your own turn.
- Conditions with no creator (fire, poison gas, a trap) count the affected character as the creator.
- If the creator leaves combat, its conditions tick at the start of the **affected** character's turn instead, so they still last exactly one of the victim's turns.

### Putting a condition on someone

A condition **printed on an action** says three things: which condition, for how long, and what
resists it.

```
✦ Cast · 👥 Grappled (2) · resist ✊ 5
```

- **If the condition rides on an attack that connected, it lands with it.** No separate check: the
  goblin's *Dirty Trick* is a Strike that dazes, the Strike already drew fate, and asking for a second
  draw would slow the turn down to say the same thing twice.
- **If the condition *is* the action, the target makes a saving throw** — their passive score in the
  named approach, plus a fate card, against the printed difficulty
  ([skill-rules.md](skill-rules.md) §2). That is the whole resolution; a spell whose only purpose is
  the condition is exactly the moment a save is for.

| Result | What lands |
|---|---|
| **Success** | nothing |
| **Partial** | **half the duration, rounded down.** At 0 it does not land. |
| **Fail** | the full condition |
| **Critical** / **Miss** | as the results table: a Miss is a fail, a Critical a clean success |

Halving on a Partial means a short condition is shrugged off and a long one still bites, with nothing
extra to print. An action may **name a lesser condition instead** if that reads better — *Grappled (2),
or Slowed (1) on a partial.*

**Which approach resists** is the author's choice and should follow what the thing actually does:

| | Resists |
|---|---|
| ✊ **Might** | being held, moved or worn down — Grappled, Burning |
| 🌀 **Agility** | anything you could get out of the way of — Prone, areas |
| 👁 **Wits** | being fooled or caught out |
| 👑 **Presence** | being cowed or compelled — **Compelled** |
| 📜 **Lore** | magic you understand well enough to shed |
| 🌑 **Shadow** | not being the one it finds |

**Unconscious is never applied this way.** It means 0 Health and nothing else (section 8).

> **There is no "hold person".** Nothing in the list below takes a whole turn away — Dazed costs you a
> secondary, Stunned your reactions, Grappled your feet. All three at once is as held as this game
> gets, and you still have a primary. That is deliberate: a turn where you do nothing is the dullest
> thing a fight can hand you.

> **Frozen at a value above your Move is not an exception to this.** You cannot cross the room, and
> you still draw a hand, play a primary and a secondary and keep every reaction — a *Move 2, then
> Strike* primary still gets the Strike. That is also what separates it from **Grappled**, which
> blocks the Move half outright.

> **Which leaves magic a problem, and the answer is the one rule worth remembering here.** Sleep,
> paralysis, petrifaction and *hold person* are what spells classically do, and all four are turn
> removal, so none of them can exist. **A fighter's conditions take away what you may *do*; a
> caster's take away what you may *choose*.** Dazed subtracts a half and Grappled subtracts your
> feet, but **Compelled** subtracts nothing at all — you draw your cards, play a primary and a
> secondary, keep your reactions, and simply do not pick the target. The turn is full and the
> decision is gone, which is both unmistakably magic and the only shape §7 permits.

| Condition | Effect |
|---|---|
| **Dazed** | You can't play a secondary. |
| **Slowed** | All Move values are halved (round down). With **Frozen** as well: **halve first, then reduce**, floor 0. |
| **Stunned** | You can't play reactions. |
| **Heckled** | You draw fate with **disadvantage**. The only condition that touches the fate deck rather than the body or the board, and nobody but a Bard applies it. |
| **Invisible** | Enemies can't target you. Ends early if you Strike or Cast at an enemy. |
| **Burning** | **Burning N:** take N damage at the start of your turn. It meets neither armor nor Block. **Fire cancels water in either state:** neither Burning nor **Wet**, and neither Burning nor **Frozen**, lands on a target already carrying the other — whichever arrives second ends the first without itself landing. A wet target steams; a frozen one thaws. |
| **Frozen** | **Frozen N:** all Move values are **reduced by N**, to a minimum of 0. You still play both halves and keep your reactions. Cancels with Burning. |
| **Poisoned** | **Poisoned N:** you are **Dazed** — no secondary — **and** take N damage at the start of your turn, past armor and Block. **N may be 0**, which is the sickness with nothing behind it. Water does nothing for it. |
| **Prone** | Melee Strikes against you have advantage. Standing up costs Move 1. |
| **Unconscious** | At 0 Health. No turns, no reactions, Prone. Dying until treated (section 8). |
| **Grappled** | Blocks 👣 Move (see section 10). |
| **Silenced** | Blocks ✦ Cast — you cannot speak, and casting needs speech (section 4). |
| **Disarmed** | Blocks ⇄ Ready, and ⚔ with the disarmed item. You cannot simply draw another: Ready is the verb it takes away. |
| **Compelled** | You must spend your **primary** attacking whoever compelled you. Everything else about your turn is yours. |
| **Burdened** | Over your carry limit: Slowed, and disadvantage on 🌀 Agility and 🌑 Shadow checks. No duration – it lasts until you drop weight (section 4). |
| **Overloaded** | Over half again your limit: Burdened, and 2 random cards are Spent. No duration (section 4). |
| **Blessed / Cursed** | See fate deck (no duration – they last until the card is drawn). |

### Shake Off

A condition's duration can run longer than a turn, and until now nothing in the game could shorten
one. **Shake Off N** takes **N off one condition's duration.** At 0 it ends.

> **A dispel pays in the number the condition already has.** It does not remove conditions, it
> *spends* their duration — so a **(1)** is shrugged away by the cheapest card and a **(3)** takes
> three efforts or one real spell. No card is ever a hard counter to a big condition, which is what
> keeps conditions worth applying at all.

That matters more than it sounds. **Conditions are where the Ways live** — half the content in
[way-cards.md](way-cards.md) applies one — so a cheap *remove any condition* would be an attack on
half the game, and every condition printed after it would have to be priced against the assumption
that somebody holds the answer. Spending duration has no such effect: it is a trade of a half for a
turn, which is roughly even, and it stays even however strong the condition is.

**What may be shaken off, and what may not:**

> **You can shake off what is being *done* to you. You cannot shake off what is simply *true* of
> you.**

| | Shake Off |
|---|---|
| the eleven timed **subtractions** — Dazed, Slowed, Stunned, Prone, Grappled, Silenced, Disarmed, Burning, Frozen, Compelled, Invisible | **yes** |
| the four **openings** — Wet, Off-Balance, Marked, Judged | **no.** Nothing is being done to you; you are simply wet. An opening is outside this machinery the same way it is outside saving throws |
| **Blessed**, **Cursed** | **no.** The card is in a deck, not on you |
| **Burdened**, **Overloaded** | **no.** Drop weight; a spell cannot argue with arithmetic |
| **Unconscious** | **no.** That is Health (§8) |

Those four exclusions are one rule, not four: everything on the *no* side has **no duration to
spend**, which is a flag the condition already carried before this keyword existed.

**Shake Off never resists and never rolls.** The duration simply goes down. A dispel that could fail
is a card you played for nothing, and the game has enough of those.

**Shedding is a decision, so the player chooses which condition** — a character carrying Dazed (1)
and Grappled (2) picks, and picking is the interesting part.

> **A dispel belongs on a reaction, a prepared spell or a feature — not on an ordinary card's
> secondary.** Simulation puts a Shake Off 1 bought with a card slot at **−2.1 points of win rate**,
> played **0.22 times a fight at best**: one copy in sixteen is in your hand 31% of turns, and it has
> to be there on a turn the condition is also on you
> ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md)). The half a Shake Off costs is
> cheap; the **card** is not.

#### Lift

**Shake Off spends a duration. Lift removes what has no duration to spend.**

**Blessed** and **Cursed** have no clock — they last until the card they put in your fate deck is
drawn — so nothing could take them off. **Lift** does: the marker comes off the character *and* the
temporary card comes out of the deck, because removing only the marker would leave a Miss in there
that nothing would ever account for.

> **A curse lasts about a fight, and could easily last three.** The temporary card is one of three
> cards that reshuffle the deck when drawn, so it is the one to come up about a third of the time —
> roughly **sixteen fate draws** on average, with a long tail. Lifting a curse is the oldest job a
> priest has, and until Lift existed the rules had no way to do it.

Lift reaches **only** the two: an opening has nothing being done to you, the encumbrance pair answer
to arithmetic, and Unconscious answers to Health. When **Cleansing** is built, Taint is the third
thing Lift should reach.

#### The five ways out, and there are no others

Every condition in the game leaves by exactly one of these. The list is **exhaustive**, and the
validator checks that it stays so — a condition in no bucket is a condition whose removal nobody
decided:

| How it ends | How many | Which |
|---|---|---|
| **Shake Off** — spend its duration | **12** | the timed subtractions |
| **Lift** — it has no duration to spend | **2** | Blessed, Cursed |
| **Drop weight** — free, any time, never an action (§4) | **2** | Burdened, Overloaded |
| **The clock, by design** | **4** | the four openings |
| **Health above 0** | **1** | Unconscious |

> **So no: not everything can be dispelled, and that is the design rather than a gap.** Fourteen of
> the twenty-one come off to a card. The other seven each answer to something that is not a card, and
> the openings are the only ones where *nothing* will hurry them — deliberately, because an opening
> is cheap to set and worth little on its own, and letting an enemy spend one secondary to undo the
> party's whole combo would make combos unplayable.

**Marked and Judged are the purest case of that**, and the fiction says why: they are **calls**, not
states (§7). You can wash off water and you can regain your footing, but you cannot wash off
somebody's opinion of you — you can only wait for them to stop saying it.

#### A dispel must not sit on the half the condition takes

Four conditions defeat the dispel that would answer them, and not by accident — it falls out of what
each one does:

| Condition | Defeats | Because |
|---|---|---|
| **Invisible** | any dispel that needs a **target** | being untargetable *is* the condition |
| **Silenced** | your own ✦ Cast dispel | casting needs speech |
| **Compelled** | a dispel on your **primary** | your primary is already spoken for |
| **Dazed** | a dispel on your **secondary** | you have no secondary |
| **Disarmed** | **picking your weapon back up** | it blocks ⇄ Ready, which is the verb that would undo it |

So:

> **You cannot reliably dispel yourself.** The reliable answers are other people's cards — and the
> two conditions that beat *every* self-dispel, Invisible and Silenced, can only be answered by
> somebody who is not suffering them.

That is the same shape as openings (§7): the game's answer to conditions is your allies. It also
means **Invisible needs an area**, not a target, because there is no other way to reach it — see
[way-cards.md](way-cards.md) §3.6, where that constraint writes the card.

### Openings

Every condition above takes something away. These four take nothing:

| Opening | Effect |
|---|---|
| **Wet** | Nothing by itself. |
| **Off-Balance** | Nothing by itself. |
| **Marked** | Nothing by itself. |
| **Judged** | Nothing by itself. |

An **opening** is a condition that exists to be **read by another card**. A mage's *Rain* leaves a
goblin Wet; Wet does nothing at all; and then somebody's *Lightning* hits a Wet goblin harder than a
dry one. That is the whole mechanic, and these four rules are what make it work.

**1. An opening carries no rules of its own. Every combo is printed on the card that reads it.**
The table above is the entire text of all four openings. *Lightning* says what *Lightning* does to a
Wet target, and nothing else in the book mentions the pair. So a new card adds **one** combo and
changes nothing else, and a new opening adds none at all. This is the rule that stops the system
growing into an interaction table, which is how combo systems usually die.

**2. An opening is never resisted.**
There is nothing to save against — it does nothing. The saving throw happens on the **payoff**,
where the real effect is. So the setup always works, and the uncertainty sits where uncertainty
belongs. It is also why a setup is allowed to be cheap.

**3. An opening never gates a primary. It only sharpens one.**
No primary half reads *"only against a Wet target."* A payoff does its job against anyone and does it
**better** against an opening — more damage, advantage, or a harder saving throw for a condition it
was already trying for. A primary that does nothing without its partner is a card you hold all fight
waiting for a draw that never comes, and in a game played from a shuffled deck that is the one
mistake a combo must not make.

**A secondary may be situational**, because a card is dead only when *both* halves are. *Strike −1
against a Prone or Grappled target* is a fine secondary behind an ordinary Strike: worth having when
it applies, and costing nothing but the Move 1 it replaced when it does not. That asymmetry is the
same one setters rely on — the secondary is the cheap space on a card, in both directions.

**3b. A reaction answers an event, and there are four.**  **[BUILT 2026-11-01]**
A **hit**, an **arrival**, an **ally about to be dropped**, and a **Cast**. That list is short
because a trigger is not a mechanism — it is a **place in the code that raises it**. Five documents
across this project asked for "a new trigger" and none of them got one, because each was really
asking for an event site: *when an enemy acts* and *any time on another's turn* are not moments, and
the two cards that said so were rewritten rather than the rules. **Cast** is the newest and could not
have come earlier at any price: nothing cast a spell until spells became castable.

A reaction may be printed on a **card in your hand** or on a **prepared spell**. The second is new
and it is where a counterspell belongs: a dispel on a drawn card is in hand about a third of turns
and is therefore nearly worthless, while a prepared one is there every fight and costs no half. A
card reaction is spent by discarding the card; a spell reaction by draining the slate, which is what
*Spent* means on something that was never in your hand.

**3a. One thing may gate a primary: what you are holding.**  **[BUILT 2026-11-01]**
*Take the Shot* requires a **ranged** item, *Second Knife* a **Light** one, *Two-Hand It* **both
hands**. That is the opposite case to rule 3 and worth stating as a pair, because the difference is
not how harsh the gate is — it is **who decides**:

| A primary may be gated on | Because |
|---|---|
| **your own kit** | you chose it at the shop, and a **Ready** changes it mid-fight |
| ~~the target's condition~~ | nobody can arrange a draw, so the card waits all fight |

**Gate on what the player controls, never on what the shuffle controls.** A bow you did not bring is
a mistake you made; a Wet target you never drew is a card that was never yours to play.

A requirement reads the item that would serve the verb, so it also decides **which** item: a Shade
holding a bow and a dagger has a better Strike with the dagger, and *Take the Shot* fires the bow
anyway. **Both hands** means two hands occupied **now** — a slung greatsword is one object on a
back, so *Two-Hand It* is dead with a shield up, which is what its own **Ready** secondary is for.

**4. An opening is not used up. The duration is the window, and the window is the whole round.**
Conditions tick at the start of the **creator's** turn, so an opening you lay down on your turn lasts
through everybody else's and expires when you come round again. **One setup, one round, the whole
party.** The mage's rain is the archer's rain.

> **Openings are the only place in these rules where two players' cards combine.** Fights are
> otherwise played side by side: a Tactician's call, a Bodyguard stepping in, and little else. An
> opening is a thing one character does to make another character's turn better, and it costs the
> first character almost nothing — which is what makes it get done.

**They are a closed list of four, one per Way**, because a player has to be able to hold in their
head which ones their own cards read:

| Opening | The Way that makes it most easily | Read best by |
|---|---|---|
| **Wet** | Mind — Elemental magic | lightning and cold |
| **Off-Balance** | Strength | knockdowns, grapples, follow-up blows |
| **Marked** | Shade | ranged and precise attacks |
| **Judged** | Faith | that god's miracles — and, usually, any ally's attack |

**Any card may read any opening**, whatever its Way. The Ways differ only in which they *make*
easily, and that asymmetry is the point: the combo you want is usually the one somebody else sets up
for you.

**Setters belong on secondary halves.** A turn is a primary and a secondary, and most secondaries are
*Move 1* — the cheapest space on a card. An opening set from there costs you a step you were not
taking. Put it on a primary instead and it competes with a Strike, which means it never gets played.

**An opening is not always good.** Water and fire cancel, so a Wet enemy is a *worse* target for
fire, not a better one — one application of flame goes into steam and the water with it. There is no
autopilot in which laying down an opening is simply correct, and that is deliberate.

> Note where that rule is written: on **Burning**, in the table above, not on Wet. Wet's entry is
> still *nothing by itself*, which is rule 1 holding even at the one place the rules bend — the
> interaction lives on the thing that reads the opening, exactly as it does for a card.

> **Enemies use openings too, by the same rules.** A goblin shaman's rain and a goblin archer's
> shock are the same two cards, and the monster side needs no special case.

---

## 8. Exhaustion, lingering damage and rests

Your action deck is your stamina.

- **Exhausted**: if you can't refill to at least **2 cards** because your draw pile is empty, you are Exhausted. You can only play **one** card per turn (primary *or* secondary), and you can't react.
- **Catch Breath**: you may spend your whole turn (no cards played) to catch your breath:
  1. Shuffle your discard pile.
  2. Move **2 cards, at random**, into your draw pile.
  3. Draw up to hand size as normal next round.

  **You need 2 in the discard, or you can't do it.** The recovery is all or nothing — a one-card
  discard does not buy a whole turn for one card.

  **Two is the Exhausted line.** You are Exhausted when you can't refill to 2, so a breath buys you
  exactly one turn that is not Exhausted, and not one card more. It is a way to keep playing, never
  a way to get back on top: you give up a turn to have a normal one next round.

  **The discard always comes back.** Breathing takes nothing out of your deck permanently; what it
  costs is the turn. Breathe often enough and every discarded card returns, which is what makes the
  discard a cycle rather than a drain.

  **The recovery is random.** Choosing would let you fish your best card back every time you
  stopped for breath, which turns a recovery into a tutor. **Nothing general will ever let you
  search your discard** — it is the kind of rule that quietly rewrites every deck in the game, since
  a deck you can search is a deck with no weak cards in it.

  > **But a named thing may.** This is a rule worth one owner, the way *Over and Past* owns walking
  > through enemies (section 11) and *The Wall* owns stacking Blocks (section 4): a specific spell,
  > a specific node or a specific combo may reach into a discard **by name**, and then it is that
  > character's trick rather than everybody's habit. What such an effect has to pay is set by what
  > breathing costs:
  >
  > - it takes **one** card, not two — a breath's whole yield is two, and choosing is worth more
  >   than counting;
  > - it costs a **card or a slot**, never a free rider on something else;
  > - and it may not be repeatable within a fight, or the deck stops having a bottom.
  >
  > **Seven nodes get it, and none of them the same way.** *Asceticism* and *Divination* in Mind,
  > *Scout* and *Gambler* in Shade, the **local gods** and *Fagar* in Faith, and the *Tactician* in
  > Strength ([specializations.md](specializations.md)). Reaching into a discard is therefore a
  > **shared** capability, which the sibling rule allows — no two of the seven are siblings — and
  > what makes each one its own trick is the **shape** of the reach, not the fact of it.
  >
  > **Two depths, and the lower one is the rule.** A card that reaches *early* in a branch does it
  > **on a combo** — the reach happens because something else already happened, and you do not pick
  > the card. **Direct choice is reserved for the deep cards**, where it reads as the branch's
  > mastery. That is the same ladder [specializations.md](specializations.md) uses for Divination —
  > *read* at the trunk, *order* at the title, *avert* and *hold* beyond it.

#### Sift  **[BUILT 2026-11-07]**

**Read** (section 6) points at a **fate** deck and never at an action deck, and that omission is a
decision now rather than an oversight:

> **A fate deck is drawn one card at a time mid-action; an action deck is drawn as a batch at a
> known moment.** Arranging the top three of a deck you are about to refill three cards from is not
> aiming a draw, it is **choosing your next hand** — a tutor by another route, and the rule above
> has already ruled tutors out. The fence that holds *Read* is missing here too: nothing scrambles
> an action deck on a swing, so an order you set stays set.

So the operation that is safe on your own deck is **see and reject**, never see and arrange:

| | |
|---|---|
| **Look at the top card and change nothing** | free, and needs no keyword — section 6 already says that looking at one card and putting it back is just looking. It makes *Catch Breath* a decision instead of a guess, and tells you whether the reaction in your hand is worth holding. |
| **Sift 1** — look at the top card of your draw pile; you may put it in your **discard** | a **named** owner's trick, on the terms above: one card, paid for with a card or a slot, and never repeatable within a fight |
| **Read N with reorder, on an action deck** | **never.** It is a tutor. |

Sift costs the fight nothing — what it moves goes to the discard, where a breath can return it — so
what it buys is a worse next hand traded for a better one after that. The no-repeat clause is what
stops it being a dig.

**The owner is not open either, and it was settled before this keyword existed.**
[specializations.md](specializations.md) worked through *a diviner peeks, but at what?* and ruled
three targets out — an enemy's intent is **Foresee**, another player's hand is private by design, and
**your own action deck or hand is the Deck shape axis, which Tattoo Magic and Asceticism already
hold**. A Divinator is explicitly *not a deck-shaper*. So a Sift is a **carving or a discipline**,
never a prophecy, and the two schools split it along the line this table already draws:

| | holds | because |
|---|---|---|
| **Tattoo Magic** | the **seeing** — permanently, and more of it | its teachings are always-on carvings, and knowing is not doing, so it needs no limit |
| **Asceticism** | the **binning** — *Sift 1*, once a fight | a card off the top of the draw pile is the draw pile getting emptier, which is the condition that school exists to exploit |

You may Catch Breath at any time on your turn, even before you are Exhausted — but there is rarely a
reason to. Two cards is two cards whenever you take them, and a turn spent breathing while you still
have a hand is a turn the enemy gets for free.

### What a fight actually costs you

The deck is a closed loop. Nothing leaks out of it by itself — **what leaves it, you chose to
spend**:

- **Spent** — a card printed *Spent* goes to your **Spent pile** instead of your discard when you
  play it. It does not come back this fight. These are the once-a-fight cards: the big heal, the
  spell that ends an encounter, the trick that only works because nobody saw it coming. Spending one
  is a decision about the whole fight, not about this turn.
- **Strain N** — printed on a half, and paid as part of playing it: **discard N other cards from
  your hand, your choice**. They go to the discard like anything else, so Catch Breath gets them
  back; what Strain costs you is *this round*, not the fight. If you can't pay it in full, you can't
  play the half. A powerful spell that strains 2 is asking for a third of your hand.
- **Overloaded** — 2 random cards Spent while the load is on your back (section 7). The one leak you
  did not choose, and the reason weight is a real decision.

So a long fight wears you down two ways, and neither is a tax on breathing. You burn your own good
cards to stay ahead, and the **Wounds and Taint** you take shuffle into the same cycle and keep
coming back (see *Lingering damage* below) — the deck does not get smaller, it gets worse.

- **Spent** cards stay out until your next **short or long rest**, even after the combat ends (see
  *Rests* below).

#### Where a played card goes  **[BUILT 2026-11-07]**

A card you play has four destinations and a half may name any of them. Two are in use and two are
open — a dial for whoever writes cards rather than a rule anybody has to hold in their head:

| Destination | | What it costs you |
|---|---|---|
| **Discard** | the default | the round — a breath brings it back |
| **Spent** | in use | the fight |
| **Draw pile, top** | open | **nothing.** You draw it again at your next refill: a reward rung, not a cost |
| **Draw pile, bottom** | open | more than Strain and less than Spent — it returns, but only once you have cycled, which in most fights you do not |
| Your hand | **never** | nothing, which is the problem |

- **The top of the draw pile is the safe recursion.** It hands back a card you already chose to
  play, so it cannot fish for one you did not — which is exactly why reaching into a **discard**
  needs a named owner and this does not. A half that does it wants to be weak, or the card is a
  loop with a Strike in it.
- **The bottom of the draw pile is a cost, and it is the rung the ladder has nothing on**
  ([way-cards.md](way-cards.md) §1.3). Harsher than Strain, because no breath reaches it; softer
  than Spent, because the deck is a cycle and a long fight comes round.
- **A card that returns to your hand is a card played every turn for ever.** Nothing in the game
  does it, and anything that ever does needs a once-per-turn clause — or it is not a card, it is a
  feature with a picture.

### Lingering damage

Some harm stays with you after the fight. It is represented by **intruders** — cards nobody chose,
shuffled into your own decks, where they clog your hand until you get rid of them.

> **[BUILT 2026-11-08] Three kinds, and the four dials that make a kind of it.**
>
> Wounds, Taint and Fear are one mechanism at three settings rather than three rules, which is why
> a fourth kind is a row in a table and not a new section:
>
> | | Deck | When it surfaces | Replacement | Afterwards |
> |---|---|---|---|---|
> | **Wound** | action | nothing — it sits dead in your hand until the end of your turn | yes | back to the discard, until a rest or treatment lifts it |
> | **Taint** | either | 1 damage, past armour | **no** — your hand is a card short | back to the discard, until a cure or Cleansing lifts it |
> | **Fear** | action | one square away from the nearest enemy | yes | **gone** — spent the moment it is drawn |
> | **Doubt** | **skill** | nothing — it sits dead in a hand of four until the scene ends | at the next scene | back to the skill discard, until a long rest lifts it |
> | **Rage** | action | a Strike at the nearest creature, ally or enemy | yes | back to the discard, until a long rest lifts it |
> | **Compulsion** | action | nothing — but you may not Catch Breath while you hold it | yes | back to the discard, until a long rest lifts it |
> | **Confusion** | *an NPC type's* | that type has no plan: each may only Move this round | — | stays in its deck for the rest of the fight |
>
> And a fourth dial that belongs to whatever deals it rather than to the card itself: **which
> pile**. The discard, where it comes round at a moment nobody chose, or straight into the hand,
> where it resolves now. *A shriek is fast and a haunting is slow, and those are the same card in
> a different pile* — the sentence Taint's own fast/slow dial was built around, and every kind of
> intruder gets it for nothing.
>
> **Which deck it lands in sets the clock, and the clock is most of the price.** The action deck
> launders itself every Catch Breath, so an intruder there is paid for within one fight and a card
> that replaces itself costs almost nothing at all — dilution cannot bite until the draw pile
> empties, which is why a Wound measures at −0.7 against the published encounters and actually
> *helps* a hero who is being hit hard enough. The skill discard comes back only on a **rest**
> (skill-rules §1), so one **Doubt** is paid for across a session and costs more than two Fear
> ever will. Measured: one Doubt turns **11.6 points more of every call into an improvise**, where
> two Fear cost 2.5 points of a combat win rate.
>
> After the deck, the replacement. Anything meant to be felt inside one fight has to take the slot
> with it like Taint, or refuse to leave, or cost a Spend to be rid of. And a kind whose price is
> *tempo* rather than cards — Fear — is priced by a different mechanism entirely and may replace
> itself freely, because a square is not a tax on everybody equally and a card is.

#### Wounds

```
┌───────────────────────┐
│ ✖ WOUND               │
│ Can't be played.      │
│ End of your turn:     │
│ discard this card.    │
└───────────────────────┘
```

- **You gain 1 Wound** when:
  - you take **5 or more damage from a single hit** (after armor), or
  - you drop to **0 Health** (you fall Unconscious, see below).
- The Wound goes into your action **discard pile**. It comes back when you Catch Breath or after the combat.
- **When drawn:** it takes up a slot in your hand. It can't be played, not even for Brace. At the end of your turn, discard it.
- **Wounds stay** between fights. Removing one:
  - **long rest:** remove 1 Wound;
  - **treatment:** a Lore check (Normal 5) with a Healer's Kit removes 1 Wound. Once per patient per day;
  - healing magic or items that say so.

> **[FOUND 2026-11-07, BUILT 2026-11-07] Everything about a Wound was built except the thing that
> makes one. It makes them now.**
>
> The card type was finished in seven places and a reader could not tell. The sheet counted wounds,
> the upright filter refused to let one react, the deck limits excluded them, the tray printed the
> card's own sentence, a prune could not take one, the data model had its one field, and the art
> brief deliberately gave them the **action** back — *a Wound you could see coming would not be a
> Wound*. Each of those was a passing check. **No code path made one**, and the threshold above was
> read in exactly two places: the reaction policy, to decide whether a reaction is worth spending,
> and one chat row, to label a hit. The contrast that made it a gap rather than a missing vocabulary
> was **Taint**, which sits in this same section and *was* created, with a flavour and a source.
>
> It surfaced from a long way off — a career balance pass asking why **Executioner** measured as
> paid in neither the combat nor the out-of-fight ledger.
>
> **The two events are wired, at the three places a character can lose Health.** A hit of five or
> more past armour, and dropping to nought: from a blow, from a condition tick (*burning to death is
> still dropping*), and from a fast dose of Taint. A tick cannot fire the first event and should not
> — a tick is not a hit, it meets neither armour nor Block, and its bands are tight because of that.
> And a single blow that both deals five and drops you gives **one** Wound, because the rule above
> says *you gain 1 Wound when* and then lists two triggers.
>
> ### An NPC cannot be wounded, and the reason is in the rules
>
> This was the question that had to be answered before anything could be written, and it is not a
> balance judgement. A Wound is a dead card in **your action discard pile**. Section 3 draws NPC
> intent **one card per type** — *one for all the goblins* — so an NPC's deck belongs to its species
> while a Wound belongs to an individual. Putting one in would make hurting a single goblin degrade
> every goblin on the board, which conflates *what this type does this round* with *how hurt one of
> them is*.
>
> So there is nowhere to put it, and the guard in the engine is that fact rather than a check on
> type: the routine asks for the target's own action discard and stops if there is none. A creature
> without a deck of its own is a creature that cannot hold a dead card.
>
> **[DECIDED] Wounds are a player-side mechanic.** *The Long Table* (every Wound shed and every rest
> token returned) is unaffected and always was — it is about the people at the table.
>
> ### What that costs Executioner, Knight, Musketeer and Berserker
>
> *Cleave to the Bone* reads **for you, the Wound threshold is 4, not 5** and its own `needs` line
> recorded that the threshold is read as the defender's constant rather than the attacker's. That is
> now the smaller half of the problem. The feature is attacker-side, and **every creature in the
> roster is an NPC**, so against the game as written it has no target at all — 75 of 75. Four careers
> grant it, and for **Executioner** it is the whole of the level, which is exactly why that career
> measured as paid in neither ledger.
>
> **[OPEN]** What the feature should be instead. The honest options are a threshold that applies when
> the *player* is the target (a drawback, not a Signature), something that does to a monster what a
> dead card does to a person, or a different Signature altogether. That is a decision about four
> careers' identity and it is not a damage function's to make.

> **[MEASURED 2026-11-07] What issuing Wounds costs, and the one thing about the rule that is
> backwards.**
>
> Every combat figure this project has published was measured in a game where a Wound never arrived,
> so the first question was whether those figures need re-measuring. They do not. Against the
> published encounters, 6000 fights a cell:
>
> | | 3 spears | 4 spears | 5 spears | 2 spear 2 bow | mean |
> |---|---|---|---|---|---|
> | no Wounds | 99.0 | 91.3 | 68.0 | 40.5 | 74.7 |
> | **Wounds** | 99.0 | 90.0 | 66.8 | 40.3 | **74.0** |
> | | −0.0 | −1.3 | −1.2 | −0.2 | **−0.7** |
>
> **The threshold is why it is so small.** A Goblin Spear is 3 against leather, so only a
> **critical** — which doubles — reaches five past armour. **0.2 Wounds a fight.** The rule barely
> fires against the enemy the game is calibrated on, which is the right place for it to be quiet.
>
> **And then it inverts.** Against something that reaches the threshold without a critical, the sign
> flips: at a raw 5 the hero wins **+0.4** more with Wounds on, at 6 **+0.5**, at 8 **+1.2**, taking
> 1.74 Wounds a fight. **The harder you are hit, the more a Wound helps.**
>
> That is not a simulator artefact; it is the rule as written. A Wound takes a hand slot, and *at
> the end of your turn, discard this card* — so the next refill draws a replacement. **A Wound is a
> free extra draw** that costs one turn of having four live cards instead of five. Its only real
> price is diluting the deck, and dilution needs the draw pile to run out before it can bite.
>
> The control says exactly that. Cutting a card **permanently** — dead weight that never cycles —
> costs **−2.2** against four spears and **−0.1** at raw 8. At raw 8 the fight is over in 4.7 rounds
> and the draw pile does not empty until round 5.9, so there is no dilution to pay and the extra
> draw is pure profit.
>
> **[OPEN]** Whether that is acceptable. It is defensible — a wound that makes you burn through your
> stamina faster is a real image, and §8 already says *your action deck is your stamina*. But a hero
> who is being hit for 8 at a time should not be **helped** by it. The dial is the end-of-turn
> discard: a Wound that stayed in hand until a Catch Breath would be pure cost at every damage
> level, and that is a one-word change to this section rather than a new mechanism. It wants a
> decision rather than a patch.

#### Taint

```
┌───────────────────────┐
│ ☣ TAINT               │
│ When drawn: take 1    │
│ damage (ignores       │
│ armor), then discard  │
│ this card. Don't draw │
│ a replacement.        │
└───────────────────────┘
```

- **You gain Taint** from sources with the **Tainting** keyword: corrupted monsters, disease, cursed places, dark magic. The source says how much, and which deck: the **action deck** for the body (disease, rot, bodily corruption) or the **skill deck** for the mind (dark magic, horrors). The two have different card faces (see [icons.md](icons.md)), so you can see at a glance what is wrong with you.
- **Poison is not Taint.** It is the **Poisoned** condition (§7), which runs out when its duration
  does. The line between them is the only one that matters here:

  > **Taint outlives the fight. A condition does not.** A venom is a condition; a plague is Taint.

  So a poison that is still with you next week was never a poison — it is a **disease**, and that is
  what body Taint is for.
- The **fast/slow dial** still belongs to Taint, because corruption has the same two speeds: **slow**
  puts the card in your **discard**, where it comes round at a moment nobody chose, and **fast** puts
  it straight into your **hand**, where it resolves at once for 1 past armor and a hand one card
  short. A curse that strikes you down in the temple and a rot that takes a month are the same card
  in a different pile.
- Taint goes into your discard pile, just like Wounds.
- **When drawn:** resolve it at once: take 1 damage (ignores armor) and discard it. You don't draw a replacement, so your hand is one card short.
- **Taint survives rests.** Only these remove it:
  - a **cure**: priest magic, a rare potion or a special item;
  - **Cleansing**: a downtime challenge (Lore, Progress 4) with a healer or a temple.
- **Bound Taint** is the exception: Taint an **obligation** put in your deck is not a sickness and
  neither a cure nor Cleansing lifts it. The obligation names the one thing that does, and the price
  is whatever the Taint bought — a necromancer's formula is forgotten along with the hole it left
  ([leveling.md](leveling.md) §4). Bound Taint counts toward Afflicted like any other.
- **Afflicted:** while you have **3 or more Taint** in your decks, you are Afflicted. Your max Health is −3, and the source adds its own effect (e.g. a sickness or mutation). It ends when you're below 3 Taint again.

**[OPEN]** A list of afflictions per Taint source. Waits for world creation.

#### Fear  **[BUILT 2026-11-08]**

```
┌───────────────────────┐
│ ✖ FEAR                │
│ Can't be played.      │
│ When drawn: move 1    │
│ square directly away  │
│ from the nearest      │
│ enemy, then discard.  │
└───────────────────────┘
```

- **You gain Fear** from sources with the **`terrify`** keyword: a shriek, a glamour, a thing whose
  shape is wrong. The source says how much, and which pile — the **discard** for a dread that comes
  round later, or straight into the **hand** for a shriek that moves you *now*.
- **Action deck only.** A Fear card moves you, and your skill deck is not drawn in a fight. Mind
  Taint can live in the skill deck because damage does not care where you are standing; this does.
- **When drawn:** move **1 square directly away** from the nearest enemy, then discard it. A
  replacement **is** drawn, so your hand does not come up short. What Fear costs you is the square
  you chose to be standing in, and nothing else.
- **Cornered counts.** If every square further from that enemy is occupied or off the map, you stand
  where you are and the card is still spent. So does having nothing to be afraid of: Fear drawn with
  no enemy on the board does nothing but go. The card's text is what it tells you to do, not what it
  achieves.
- **Fear does not last**, and it is the only intruder with no removal line. It is spent the moment
  it is drawn, and any still sitting in your deck when the fight ends go with it — a fright nobody
  is owed any more. Nothing cures it because nothing has to.

> **Why it is the one intruder that costs no cards.** It is the first kind of harm in the game
> whose price depends on the shape of the fight rather than on its size. Dilution is a tax on
> everybody equally; a square is not, so Fear needed no card cost bolted on top of it.

> **[MEASURED 2026-11-08] What Fear costs, and the one fight where it is brutal.**
>
> Fear cards shuffled into the deck at the start, 6000 fights a cell:
>
> | | 3 spears | 4 spears | 5 spears | 2 spear 2 bow | published mean |
> |---|---|---|---|---|---|
> | no Fear | 98.7 | 90.3 | 66.3 | 39.9 | 73.8 |
> | **Fear 1** | 98.8 | 89.9 | 67.2 | 35.5 | **72.9** |
> | **Fear 2** | 98.5 | 89.6 | 66.2 | 30.9 | **71.3** |
> | **Fear 4** | 98.1 | 88.6 | 65.9 | 23.4 | **69.0** |
> | *control: 1 card cut* | 98.2 | 87.3 | 62.0 | 34.7 | *70.5* |
>
> **Two Fear cost −2.5 on the published mean and −9.0 of it lands in one cell.** Against four
> spears it is −0.7, against five −0.1, and against two spears and two bows **−9.0**. That is not
> noise and it is not about how many enemies there are: it is about whether the hero needs to
> *close*. Pushed a square back from the goblin in front of you, you have given two archers
> another free shot and you have to walk it again. In a scrum of five there is nowhere further to
> go — `step_away` finds no square and the card does nothing — so the same intruder is almost
> free. **0.15 of every two doses are drawn cornered**, and in the scrum nearly all of them are.
>
> **And against something that hits hard it is a favour.** At a raw 6 it costs −0.8; at a raw 8 it
> is **+0.7**, because being dragged out of reach of a thing that deals 8 is what you should have
> done yourself. That is the second time this project has found an intruder helping the hero it
> lands on (see the Wound measurement above), and this time it is not the end-of-turn discard
> doing it — it is that fleeing is sometimes correct. A card that makes you do the right thing by
> force is only a punishment when you were already in the right place.
>
> **The control says the cost is not dilution.** A card permanently cut costs −3.3 on the
> published mean against Fear 2's −2.5, and it costs it *evenly* — −0.5, −3.0, −4.3, −5.2 across
> the four cells, always negative. Fear's spread is −0.2, −0.7, −0.1, −9.0. So two Fear are worth
> about three-quarters of one lost card on average and nothing like it in distribution, which is
> the whole argument for pricing harm by tempo rather than by cards: it is the one dial that can
> be cheap against one encounter and savage against the next.
>
> **[OPEN]** Whether it reads the same from the other side of the hero. The simulator models a
> Warrior, so *Fear routs a front line and leaves the back one where it was* is still an untested
> sentence — it needs a hero who wanted the distance anyway, which is a Shade with a bow and a
> deck nothing deals yet (starter-cards.md).

#### Doubt  **[BUILT 2026-11-08]**

```
┌───────────────────────┐
│ ✖ DOUBT               │
│ Can't be played.      │
│ Discard it when the   │
│ scene ends.           │
└───────────────────────┘
```

- **You gain Doubt** from the same **`terrify`** keyword that deals Fear, and which one you get
  depends on what the source attacks. *A shriek puts Fear in your legs; a thing you cannot unsee
  puts Doubt in your head.* It is the split `tainting` already draws between body and mind, read on
  a different pair of decks — which is why neither needed a keyword of its own.
- **Skill deck**, and that is the whole of what makes it different. It has no effect when drawn, it
  cannot be played, and it takes one of your **four** skill-hand slots until the scene ends. The
  source says how much, and whether it goes into the skill **discard** or straight into the **hand**
  you are holding now — the second costs you *this* scene instead of a later one.
- **Discard it when the scene ends**, and it goes to the skill discard like a played card. The skill
  discard comes back on a **rest** and not on a shuffle (see [skill-rules.md](skill-rules.md) §1),
  so a Doubt costs you one scene now and then waits to cost you another.
- **Removing one:** a **long rest** removes 1 Doubt. Or the fiction that caused it is settled, and
  the GM says so — the thing you could not unsee is explained, the accusation is answered. That is
  Bound Taint's shape rather than a cure's: what lifts it is named by what caused it.

> **[MEASURED 2026-11-08] One Doubt is the most expensive card in this section, and not for the
> reason it looks like.**
>
> A check is one card out of a hand of four (skill-rules §2), so this is arithmetic rather than a
> simulation: every hand the fifteen-card starter deck can produce, enumerated, against each of the
> six approaches. `sim/skill_hand.py`.
>
> | | reach | with 1 Doubt | with 2 | shutout | with 1 | with 2 |
> |---|---|---|---|---|---|---|
> | mean of the six approaches | 0.895 | 0.730 | 0.530 | **33.5%** | **45.1%** | **59.7%** |
>
> **The reach barely moves and it does not matter.** Losing 0.165 of a point of card value is 2.2
> points of success chance in this project's unit, which is less than a tool. The cost is the
> **shutout**: the share of calls where you hold no card of that approach at all and must
> improvise — value 0 *with disadvantage*, which is not a smaller number but a different and much
> worse kind of turn. One Doubt moves that from 33.5% to **45.1%**, and two take it past half.
>
> So the ranking across the whole section is: one Doubt costs more than two Fear (2.5 points of a
> combat win rate) and more than a Wound (−0.7), because the skill discard returns on a rest and
> the action deck returns every Catch Breath. **The deck was the dial all along.**
>
> **And the baseline is a finding of its own.** A Warrior already holds nothing for the called
> approach **33.5%** of the time, and 52.4% of the time when the call is Presence. That is not a
> fault: skill-rules' third design goal says *your hand rarely has the perfect card, so help from
> others matters*, and this is the first number anybody has put on it. A Doubt does not introduce
> that pressure, it leans on a third of the game that was already leaning.

#### Rage  **[BUILT 2026-11-08]**

```
┌───────────────────────┐
│ ✖ RAGE                │
│ Can't be played.      │
│ When drawn: Strike    │
│ the nearest creature, │
│ ally or enemy.        │
│ Then discard.         │
└───────────────────────┘
```

- **You gain Rage** from what the fiction says gives it: a battle-fury, a possession, a drug, a
  god who does not care who you hit. There is no keyword for it, unlike Fear — a thing that
  enrages you does it by what it *is* and not by something it can do, so there is no creature
  capability to gate it on.
- **When drawn:** you Strike the **nearest creature**, and of any equally near, the one with the
  **lowest Health**. It is a real Strike: fate is drawn, armour applies, and the target may react
  to it as to any other hit — an ally *can* Block their friend's swing, which is both correct and
  the reason this is survivable.
- **The target is a rule and never a choice.** Not the holder's, because then it would always
  find an enemy and cost nothing; not the GM's, because then every death it causes is an
  accusation. The tie-break matters more than it looks: ties are common on a square grid, and
  *nearest* alone would have left the choice sitting there unmade.
- A replacement **is** drawn, so your hand does not come up short. What Rage costs is a swing
  aimed at the wrong person.
- **Removing one:** a **long rest** removes 1 Rage, the same as a Wound.

> **[OPEN] It cannot be priced yet, and the reason is the instrument rather than the card.**
> `sim/combat_sim.py` models **one hero**. A card whose entire cost is that it sometimes hits your
> friends has no cost at all in a simulator with no friends in it -- it would resolve as a free
> extra Strike at the nearest goblin and measure as a *benefit*, which is worse than no number:
> it is a confident wrong one. Every other intruder in this section has a figure against the
> published encounters and this one has a blank, deliberately. What would fill it is a party in
> the simulator, which is a bigger job than this card and the first thing in the project to
> actually need one.
>
> **[OPEN]** Nothing in the catalogue deals it yet, and the keyword question stays open until
> something does. If a creature should be able to enrage you, it wants a capability like
> `terrify`; if only fiction and items should, it wants none. That is a world question and the
> world does not exist (section 13).

#### Compulsion  **[BUILT 2026-11-08]**

```
┌───────────────────────┐
│ ✖ COMPULSION          │
│ Can't be played, and  │
│ you may not Catch     │
│ Breath. Discard at    │
│ the end of your turn. │
└───────────────────────┘
```

- **You gain Compulsion** from a geas, an obsession, a vow held too tightly, a thing you cannot
  stop doing. Like Rage it has no keyword yet, for the same reason.
- **While it is in your hand you may not Catch Breath.** That is the whole card. It takes an
  **option** rather than a resource, which makes it the cheapest kind of intruder to write and
  the most unpleasant to hold: your draw pile *is* the loss condition, and Catch Breath is the
  only thing that refills it.
- **Discard it at the end of your turn**, exactly like a Wound — so it costs you the one breath
  you most wanted to take, and not every breath after.
- **Removing one:** a **long rest** removes 1.

> **Why it is also what makes the others cost anything.** Every action-deck intruder is priced by
> dilution, and dilution cannot bite until the draw pile empties — the Wound measurement above is
> the whole argument. A Compulsion is the card that stops you emptying it on your own terms, so a
> hand holding one makes every other intruder in the deck worth more than it was.

> **[MEASURED 2026-11-08]** 4000 fights a cell, against the published encounters.
>
> | | 3 spears | 4 spears | 5 spears | 2 spear 2 bow | mean |
> |---|---|---|---|---|---|
> | **Compulsion 1** | −0.2 | −1.2 | −2.2 | −2.8 | **−1.6** |
> | **Compulsion 2** | −0.4 | −2.8 | −6.6 | −6.4 | **−4.1** |
>
> **One copy costs more than twice a Wound** (−0.7), and it costs it where the fight is hard:
> almost nothing against three spears and −2.8 against archers. That is the right shape for a
> card about not being allowed to stop.
>
> **And it almost never actually stops a breath.** Breaths a fight: 2.13 at base, 2.10 with one
> Compulsion, 2.09 with two. The prohibition fires perhaps three times in a hundred fights — and
> doubles the price of the card anyway, because the breath it forbids is *the one you needed*. A
> hero who cannot breathe this turn breathes next turn instead, and the cost is the turn in
> between, spent on a hand that was already too small. A number that barely moves hiding a cost
> that doubles is worth keeping in mind next time an average looks reassuring.

#### Confusion  **[BUILT 2026-11-08]**

```
┌───────────────────────┐
│ ✖ CONFUSION           │
│ No plan: every        │
│ creature of this type │
│ may only Move this    │
│ round.                │
└───────────────────────┘
```

- **The only intruder that goes into an enemy's deck**, and it answers the question a Wound could
  not. Section 3 draws intent **one card per type** — *one for all the goblins* — so a species
  shares the deck a Wound would have gone in, which is fatal for a wound and exactly right for
  this. What you are corrupting is the type's **plan**, and a plan is a thing a species really
  does share.
- **When it is drawn as that type's intent:** the type has no plan this round. Every creature of
  it may **Move** and nothing else — no Strike, no reaction, no card.
- **It is not a lost turn.** They still move, so a confused enemy repositions rather than standing
  still, and it cannot be used to simply delete a round of a boss's existence.
- **Worth more against a swarm than against an elite**, because intent is per type: five goblins
  lose their plan together and the one ogre loses only its own. That is the same shape as
  Forestall, and it is the only kind of enemy-facing effect in this game that does not reward
  sniping the biggest thing on the board.
- **It stays in that type's deck for the rest of the fight.** NPC decks reshuffle rather than
  running out, so a confused type keeps being confused — which is what the card is for.

> **[MEASURED 2026-11-08] It is far too strong, and the measurement is the reason to say so
> before anything deals it.** 4000 fights a cell, from the hero's side:
>
> | | 3 spears | 4 spears | 5 spears | 2 spear 2 bow | mean |
> |---|---|---|---|---|---|
> | **Confusion 1** | +0.5 | +2.2 | +6.6 | +16.9 | **+6.5** |
> | **Confusion 2** | +0.7 | +4.7 | +12.3 | **+29.7** | **+11.8** |
>
> Two copies take the archer fight from 40.0% to 69.7%. Nothing else in this document moves a
> number that far, and the reason is arithmetic rather than design: **an NPC deck is small**, so
> two cards in it are drawn as the type's intent **5.86 rounds out of 9.7**. A card that costs a
> player one slot of sixteen costs a monster type most of its fight.
>
> It is also worth most exactly where the hero is weakest — +29.7 against archers, +0.7 against
> three spears — which is the mirror of Fear's own measurement (−9.5 in that same cell). Both act
> on tempo, and the archer fight is the one where tempo is everything. A card that fixes your
> worst matchup is not a tax, it is an answer, and answers are priced differently.
>
> **So if anything deals it, it deals exactly one and not for the whole fight.** The dial is
> `after`: a Confusion that left the deck once drawn would cost the type one round rather than
> most of them, and that is the version worth pricing next.

> **[OPEN]** Nothing deals it yet, and this is still the obvious thing for *Cleave to the Bone*
> to become. That feature lowers the Wound threshold for its holder and has no legal target at
> all — 75 of 75 creatures are NPCs — and this is what it was reaching for: the thing that does
> to a monster what a dead card does to a person. It affects four careers, so it is a design call
> and not a patch — and on these numbers it is a call about **one** card that does **not** stay.

> **[RESOLVED 2026-11-08] Two more kinds were drafted and both were already in the game.**
>
> **A Hex** — an intruder in the **fate deck** — is not a new card and working out why is most of
> what it taught. The fate deck has no hand and no slots, so nothing in it can be *dead*: an
> intruder there has to be a fate card with a bad face, and the game has had one since the deck
> was built. A **Miss** makes the action do nothing and then reshuffles, so it stays in. `Hex N`
> is therefore N permanent Miss cards and nothing else, which is a name for the GM to call rather
> than a mechanism to build.
>
> It has also been *priced* the whole time, and bought willingly: Shadow Magic's entire cost is
> **a permanent Wild card per formula** (specializations.md). That is this transaction with the
> consent left in. A Hex is a school's price charged to somebody who did not choose it.
>
> **[MEASURED 2026-11-08] And it is the most expensive single card in this section.** 4000
> fights a cell: **Hex 1 costs −3.5** on the published mean (−1.1, −3.4, −6.3, −3.1) and **Hex 2
> costs −8.2**. One extra Miss in twenty-one cards is about five per cent of every action in the
> fight doing nothing, it is drawn for attacks and checks alike, and it never leaves. Set against
> the rest: a Hex is five Wounds, two Compulsions, or nearly three Fear — per card.
>
> **[OPEN] Which means Shadow Magic now has a number it did not have.** Its price is a permanent
> **Wild**, not a Miss, and a Wild is the gentler card: *the action resolves at its plain value*,
> so it flattens the swing instead of eating the action. So −3.5 is an **upper bound** on what
> each formula of that school costs its caster, and the first hard figure anybody has had for it.
> The school was priced by assertion (specializations.md §4); it can be measured now, and the
> measurement wants doing before the next formula is written.
>
> **A Burden** — a dead card you can only discard by putting something down — is what **weight**
> already does, and it does it from the other direction. Being Overloaded Spends **2 random**
> cards for as long as the load is carried (section 4, *Carrying*), and the engine keeps them out
> of a rest on purpose: *cards set aside by being Overloaded come back when the load is dropped,
> not on a rest*. Removing cards and inserting dead ones are the same tax, and a Burden card would
> have been a fourth name for a rule this document already states twice. It is not built, and that
> is the finding.

#### And the kind that is not a card at all  **[BUILT 2026-11-08]**

Every kind above is a card somebody put in a deck you play from. The sixth kind of lasting harm is
a **slate**: a permanent **injury**, which is a negative feature on your sheet rather than anything
that can be drawn. It arrives at one moment only &mdash; the fate draw when you drop to 0 Health
&mdash; and it leaves only to a ritual. See *Unconscious and death* below.

The two are not rivals, they are the two ends of one line: **a card that keeps coming back is a
slate, and a slate is what a ritual can name.** Five injuries own intruder cards for exactly that
reason, so a permanent condition can be something that *happens* to you and not only a number
subtracted from you.

#### Acid, and the only damage that costs you gear

**Corrode N** takes **N off the target's armor**, and it does not come back on a rest.

Acid needs no condition of its own. What acid does to *you* is already written — **Burning** is the
right mechanic and even the right fiction, because water ends it and washing is how you treat an acid
burn (§7). What acid does that nothing else in the game does is eat your **equipment**:

> **Corrode is the only effect that spends gear.** [leveling.md](leveling.md) §5a.1 lists *"gear you
> can lose — a mount, a cannon, a shield: ordinary without it, and the GM can take it"* as a
> resource a specialization may be priced in. Until now nothing in the rules could actually take any.

- It eats the **armour itself**, not your armor score, so the loss follows the armour when it comes
  off and a borrowed breastplate is only as good as its last fight.
- **Repair** is a downtime matter: a smith and coin, or a Lore check with the right tools. Printed
  armor says what the item *is*; corrosion is tracked against it, so a repair is a reset rather than
  a memory test.
- **Armor behaves like a cliff edge** — a point of it is worth far more against four goblins with
  Strike 3 than against one ogre — so Corrode 1 is already a strong effect and **Corrode 2 belongs to
  a monster.**

> **Why gear and not Health.** Everything else in this section takes something a rest gives back, or
> a card out of a deck. Acid takes a *decision you made before the fight*, which is the one kind of
> loss the rules had no way to inflict — and it is why an acid monster changes how a party packs
> rather than how it fights.

#### Deck size and pruning

> **Your action deck holds 12 to 20 cards.** Feature slates can raise the maximum.

Wound and Taint cards **don't count** toward deck size limits, and you **can't** prune them by leveling or training. They have to be healed or cured. That matters more with a cap: a wounded character is never locked out of adding a card.

A feature that raises the maximum works like one that raises your carry allowance — a flat trait, so
it is **not** bonus-grouped (section 5).

**A bigger deck is not automatically better**, which is what makes such a feature interesting rather
than pure upside. More cards means more stamina before exhaustion, and your best cards come up less
often. The cap is only worth raising once you *have* twenty cards worth playing, so it is naturally a
later pick: at low level the extra slots would be filler, and filler is what dilutes a deck.

Because Catch Breath no longer lets you choose what to set aside, **nothing removes a dead card from
your deck during play**. Deliberate pruning — at level up, or through training in downtime — is the
only way to get rid of one. That makes pruning a real decision rather than a free upgrade, because
what matters is **fit, not size**. Simulation puts a 12-card deck pruned *well for the fight* level
with a full 16-card deck (63% against 65% in a hard fight), and a 12-card deck pruned *badly* at 45%.
A pruned deck draws its best cards more often and runs dry sooner, the same trade the skill deck
already describes ([skill-rules.md](skill-rules.md) §8) — but the risk is cutting the wrong card, not
cutting cards at all.

The starter deck is 16 for that reason: pruning well takes knowing what you will face, which a new
character doesn't.

Growing and pruning are both **benefits on a Way graph node** ([leveling.md](leveling.md) §4): a
card adds one, a prune removes one, a deck-cap benefit raises the ceiling, and a node may bundle a
card *with* a prune so a deck keeps its shape instead of drifting upward every level. What waits on
the Way graphs is which nodes offer what, not the rule.

### Unconscious and death

- Health **never goes below 0**. Damage beyond that is lost.
- At **0 Health** you are **Unconscious**: you fall Prone, take no turns, and can't play reactions. You also gain 1 Wound.
- You are **dying**. You die if either of these happens:
  1. you take **any further damage** while at 0 Health, or
  2. you are **not treated** before the end of your next turn.
- **Treatment** (any one of these):
  - any **healing**: Health goes above 0 and you wake up;
  - **Stabilize**: an adjacent ally plays any card for its **primary** to stabilize you instead of using its effect. You stay at 0 Health and Unconscious, but you're no longer dying. After the combat you wake up with 1 Health;
  - a potion poured into your mouth by an adjacent ally (a **Use** action).
- A stabilized character who takes damage again is dying again.
- **NPCs** die at 0 Health unless the GM decides otherwise (e.g. to take a prisoner).

#### The injury draw  **[BUILT 2026-11-08]**

**When you fall Unconscious, draw a fate card.** This is the only moment in the game that can
change a character permanently.

| The card | What it leaves |
|---|---|
| **Miss** | a **permanent injury** |
| **&minus;2** or **&minus;1** | a **lasting injury**, which heals after 14 days of rest |
| anything else | nothing. The Wound you already gained is all of it |
| a **Wild** | nothing &mdash; see below |

Which injury it is is the GM's, chosen to fit what hit you or drawn from the Injuries compendium.
**How bad** is this draw's; **which** is fiction's.

**A Wild leaves nothing**, and that is the one face worth stating outright. A Wild has no value and
a rank of 0, so it falls through the table above &mdash; which is right, and for the reason a Wild
exists: it is the card whose result is *a question for the table* (section 6), and the single draw
in this game that must not become a question is the one that changes a character for ever.

> **Why this is the only gate, and why nothing else inflicts an injury.**
>
> A card reading *permanently blind the target* would put the most consequential rule in the game
> in as many places as there are cards. This document has paid for that shape twice already: the
> Wound threshold was *a constant read in two places*, and the test for a dead card was written out
> three times before the intruder table closed it (section 8).
>
> So things that want to maim you **bend this draw** instead:
>
> | | What it does to the draw |
> |---|---|
> | **Maiming** (a keyword) | draw two, take the worse |
> | a **Healer's Kit** in reach | draw two, take the better |
> | a **curse** | a Miss here lands as a Curse rather than a Maiming |
>
> The two dials are the same advantage dial the rest of the game uses, so they cancel without a
> rule saying they do.
>
> **Maiming is rare on purpose.** Nothing in a card pool carries it. A named threat does, and a
> trap does, and the price of a thing that forces this draw *without* dropping you to 0 is that it
> belongs to a creature with a name.

#### Permanent injuries  **[BUILT 2026-11-08]**

**An injury is a negative feature: a slate on your sheet, not a card in a deck.** Section 1's slate
table has said so since it was written &mdash; *item slates, feature slates, secret slates,
permanent injuries*.

| | Wound | Taint | **Injury** |
|---|---|---|---|
| Where | action deck | action or skill deck | **the character sheet** |
| Lasts | until a rest or healing | until a cure or a Cleansing | **until a ritual, or never** |

> **It is deliberately not a condition.** A condition carries a duration and can be **Shaken Off**
> (section 7), so a *permanent condition* would be a duration field that lies sitting next to a
> Shake Off that has to be told to refuse. A slate is simply true, and that is already what
> permanent means in this game's vocabulary.

##### The five categories

A category does exactly one job: **it names the ritual that lifts it.**

| Category | What it is | Lifted by | The challenge |
|---|---|---|---|
| **Maiming** | flesh and bone that did not grow back | **Regrowth** | Lore, Progress 6, Pressure 4 |
| **Breaking** | nerve, memory, conviction | **Quieting** | Presence, Progress 6, Pressure 4 |
| **Curse** | somebody did this on purpose | **Unbinding** | Lore, Progress 8, Pressure 3 &mdash; *and you must name who laid it* |
| **Corruption** | Taint gone past where a cure reaches | **Cleansing** | Lore, Progress 4, Pressure 4 |
| **Obligation** | a pact, a debt, a bargain you made | **nothing** | &mdash; |

**You may carry at most one injury of each category &mdash; except Maimings, which are uncapped.**

The cap is what keeps an injury from becoming a death spiral, and it read absurdly in exactly one
place: one Regrowth regrows an eye and a leg alike, so they are one category, and a cap that
followed the ritual was telling a one-eyed character that their legs were safe for ever. A Regrowth
still lifts **one**, so three maimings is three rituals.

> **It is not free, and *Adapted* is what pays for it.** A *Bad Leg* alone measures &minus;8.1 win
> rate against the published encounters and &minus;21.1 against archers, so three stacked maimings
> is a character nobody wants to play. Uncapping without a brake would have been taking one out
> and not fitting the one that was designed for it.

> **Obligation lifts for nobody, and that asymmetry is load-bearing.** **Bound Taint** has had it
> since it was written (section 8): *neither a cure nor Cleansing lifts it. The obligation names the
> one thing that does.* Keeping it is what stops four rituals becoming a laundry service. The four
> that lift are a service; this one is a story, and it is the GM's.

##### A ritual is a challenge, not a cast

Lifting an injury is a **downtime challenge** (skill-rules.md §3, §6) with a Progress track and a
Pressure track. It is not a check, and the world document is what decided that: **Ritual Magic's**
price is *"Time, and a recipe that can go wrong"* (specializations.md), which is those two tracks in
the words it took to say it. Pressure filling is the recipe going wrong.

**The gate is the recipe, not the caster** &mdash; *"anyone literate can do it."* A party cannot be
locked out of mending a character because nobody levelled the right way, and what the GM hands out
instead is the recipe, which is a thing you find.

**So a recipe is an item**, carried in a pack like anything else:

| Recipe | Lifts | The challenge | Gold |
|---|---|---|---|
| **Recipe: Regrowth** | a Maiming | Lore, Progress 6, Pressure 4 | 900 |
| **Recipe: Quieting** | a Breaking | Presence, Progress 6, Pressure 4 | 450 |
| **Recipe: Unbinding** | a Curse | Lore, Progress 8, Pressure 3, *and the curser's name* | 1200 |
| **Recipe: Cleansing** | a Corruption, or Taint | Lore, Progress 4, Pressure 4 | 300 |

**And three lesser recipes, which a levelling branch hands out.**  **[BUILT 2026-11-08]**

| Recipe | Mends | The challenge | Gold |
|---|---|---|---|
| **Recipe: Mending** | **every** Wound in one character's deck | Lore, Progress 2, Pressure 4 | 120 |
| **Recipe: Quiet Night** | a **lasting** injury: its remaining days are spent at once | Presence, Progress 2, Pressure 3 | 200 |
| **Recipe: Unknotting** | one condition with **no duration to spend** | Lore, Progress 3, Pressure 3 | 250 |

> **The four greater rituals are found; these three are learned.** A Regrowth is *more of a quest
> than a service*, so it belongs in the world where a GM can place it. Mending a deck full of
> Wounds is what somebody who studied rituals should simply be able to do &mdash; so they sit on a
> run of three ordinary nodes off **Letters**, the node that grants *reading and writing*, because
> the world document's gate for this whole school is *"anyone literate can do it."* The
> prerequisite was in the levelling graph already and nothing had ever hung off it.
>
> **Each earns itself against something that exists**, which is the test a *Burden* card failed:
> treatment and a long rest each take **one** Wound, and *Mending* takes all of them, which is a
> different thing to want; nothing else in the game shortens a **lasting** injury; and *Shake Off*
> spends a condition's duration, so a condition with none is beyond it. There is deliberately **no**
> Taint recipe &mdash; a Cleansing already removes Taint.

> **[RESOLVED 2026-11-08] These were formulas, and a formula could not say this.** On a spell,
> strength is the **slot cost** &mdash; and a ritual is the only slate in the game that is never
> prepared and never cast, so a slot cost had nothing to mean. Any number above zero quietly closed
> the hardest ritual to a character with no spell slots, which is the exact opposite of *anyone
> literate can do it*. An item has no slot budget, nothing to prepare and nothing to cast, so the
> contradiction is not expressible &mdash; and a recipe can be bought, stolen, copied and lent,
> which puts the scarcity somewhere a party can act on.
>
> The gold is the first number anybody has put on *"more of a quest than a service"*: a Cleansing
> recipe is 300 against the Cleansing Draught's 150, and an Unbinding is 1200. **[OPEN]** Placed
> against the equipment ladder by eye, and not measured against what a party earns.

##### Living with one

- **Items** help with the consequence and not the injury: a hook hand, a glass eye, a crutch.
- **Adapted**  **[BUILT 2026-11-08]** &mdash; a levelling option: *name one injury you carry; its
  penalty no longer applies.* **The injury stays on the sheet.** A Regrowth removes one; this
  leaves it there with its arithmetic switched off, because healing and learning to live with it
  should not be the same mechanic &mdash; and the scar is still something to write into a scene.
  - Take it again for a second injury. That is what makes an uncapped Maiming survivable, and it
    is why it had to exist before the cap came off.
  - It is the only feature in the game that points at **another slate**, which is why it is a
    field rather than a number: no amount of negative grants can express *ignore that other thing*.
  - **[OPEN]** Which node offers it. That waits on the Way graphs, like everything else about what
    a node hands over.
- Five injuries carry **intruder cards** rather than a flat number (section 8) &mdash; *Night Fears*
  puts a Fear in your deck, *The Eager Hand* two Rage. A flat &minus;1 is the same every round and a
  card is not.
- **An injury's cards leave when it does, and only then.** No rest removes them and no cure reaches
  them: they belong to the slate, so a Cleansing that lifts a Corruption takes its Doubt with it
  and a bandage does not. A **lasting** injury takes its cards away when the fourteen days are up,
  for the same reason &mdash; it is the injury leaving, and that is the only thing that moves them.
- And a **lasting obligation** heals like any other lasting injury. It is only a **permanent** one
  that no ritual can touch, because what the asymmetry above is about is permanence rather than the
  word *obligation*.

> **This is also what gives a curse teeth.** equipment.md §11 carries an `[OPEN]`: *nothing in the
> engine enforces a curse.* A curse whose obligation is **a card in your deck** enforces itself,
> because the engine already moves the card. The Blade of the Eager Hand's *"you must Strike the
> nearest living creature every turn, ally or not"* is the Rage card's rule word for word, written
> in prose two months before the card existed.

> **[MEASURED 2026-11-08] What a permanent injury costs.** 4000 fights a cell, against the
> published encounters, from the hero's side.
>
> | | 3 spears | 4 spears | 5 spears | 2 spear 2 bow | mean |
> |---|---|---|---|---|---|
> | **Bad Leg** | &minus;0.5 | &minus;4.8 | &minus;5.9 | &minus;21.1 | **&minus;8.1** |
> | **Rotted** | &minus;0.9 | &minus;5.2 | &minus;6.8 | &minus;8.6 | **&minus;5.4** |
> | **Hexed Blood** | &minus;1.1 | &minus;3.4 | &minus;6.3 | &minus;3.1 | **&minus;3.5** |
> | **Lost Hand** | &minus;0.5 | &minus;2.4 | &minus;3.2 | &minus;0.3 | **&minus;1.6** |
> | **Compelled Step** | &minus;0.3 | &minus;0.3 | &minus;2.0 | &minus;3.1 | **&minus;1.5** |
> | **Shattered Nerves** | &minus;0.5 | &minus;1.2 | &minus;1.0 | &minus;2.2 | **&minus;1.2** |
> | **Night Fears** | +0.2 | &minus;0.1 | +0.9 | &minus;4.8 | **&minus;1.0** |
>
> Set against a **Wound** at &minus;0.7, the whole range is one Wound to eleven. Two of them are
> cross-checks rather than new numbers and both came back to the decimal: *Hexed Blood* is the Hex
> measured on its own (&minus;3.5), and *Compelled Step* is one Compulsion (&minus;1.6). The
> instrument agrees with itself.
>
> **Bad Leg is the most expensive thing measured in this game, and it is the shape that is
> interesting.** Almost free against three spears and &minus;21.1 against archers &mdash; because
> the archer fight is about closing, and a leg is what closes. Nothing else in this document has a
> spread that wide, and it is the mirror of *Confusion*'s +29.7 in the same cell for the same
> reason. **Tempo is worth more than cards, and it is worth most to whoever is behind.**
>
> **[FOUND BY MEASURING] And it caught a dropped clause.** ideas.md writes *all Move values
> &minus;1 (**minimum 1**)*. Built without that parenthesis, folded into the reduction Frozen
> already uses &mdash; which floors at 0, because Frozen must be able to stop you &mdash; a bad leg
> measured **&minus;25.4**, and **&minus;38.5** against archers, taking them from 40.0% to
> **1.5%**. The cause was not that &minus;1 is harsh: the starter deck's commonest printed Move
> **is** 1, so a floor of zero deleted half the hero's movement instead of slowing it. A bad leg
> slows you; a frozen leg stops you, and they are two subtractions with two floors.
>
> **Hollow Eyes has a number from the other instrument.** Two Doubt take the **shutout** rate
> &mdash; the share of an approach's calls with no card that can answer them &mdash; from 33.5% to
> **59.7%** (skill-rules.md §1). A fight simulator cannot see the skill deck at all, which is why
> that instrument exists.
>
> **Four have no number, each for a stated reason.** *The Eager Hand* strikes your allies and the
> simulator models **one hero**, so it would resolve as a free extra Strike and measure as a
> *benefit* &mdash; worse than no number; what would fill it is a party. *Lost Eye* costs range and
> the published hero carries a sword, so there is no range to lose; what would fill it is a ranged
> career. *Shaken Faith* costs a spell slot, which a fight simulator has no model of. And *Lost
> Fingers* and *Scarred Face* are prose, so there is nothing to dial.

> **[ANSWERED 2026-11-08]** Whether one Maiming is too coarse: it was, and the fix was the **cap**
> rather than the category. Splitting Maiming into limb and sense would have bought two rituals and
> a longer table to say one thing, which is that a one-eyed character can still break a leg. One
> ritual regrows both, so one category is right; what was wrong was a cap that followed the ritual.

> **[OPEN]** Taking a **permanent injury instead of death**, once per character or per level. It is
> the one piece of this that changes what a death means, which makes it a table's decision rather
> than a rule's.

### After combat

- Shuffle your hand and action discard pile back into your action deck.
- **Spent** cards stay out. Several fights in a row without rest wear you down.

### Rests

Both rests need a **safe place**. Resting in a dangerous place is up to the GM: it may be interrupted, or simply impossible.

| | Short rest | Long rest |
|---|---|---|
| **Takes** | About an hour | A night's sleep |
| **Limit** | You need a **rest token** | Once per day |
| **Action deck** | Spent cards return | Spent cards return |
| **Skill deck** | Shuffle the skill discard pile and Spent skill cards back into the skill deck | Same |
| **Rest tokens** | – | Regain all |
| **Health** | Heal **1** | Heal **5** |
| **Wounds** | – | Remove **1** |
| **Taint** | – | – (needs a cure) |

- **Rest tokens:** each character has a limited number, starting at **1**. More are gained through **leveling**, as a benefit on a Way graph node ([leveling.md](leveling.md) §4).
- You can't take a short rest in the middle of a combat or a challenge. There you **Catch Breath** instead, and it always costs something:
  - **In combat:** your whole turn, so no damage and no movement (see above).
  - **In a challenge:** the other side gets time (see skill rules).

---

## 9. NPC decks

NPCs don't have hands. Each NPC **type** has a small deck of 5–8 cards, and each card is a full turn:

```
┌──────────────────────────┐
│ GOBLIN – Stab & Scurry   │
│ Strike, then Move 2      │
└──────────────────────────┘
```

- One card is drawn per NPC **type** per round, at the start of the round, face down (*Intent*, section 3). Every NPC of that type acts on it, each on its own initiative.
- Shuffle when the deck runs out. NPCs don't get exhausted.
- **Elite / boss** NPCs may keep 1–2 cards face-up as reactions, shown to the players.
- NPCs still use items for their Strike and Cast values, so the same goblin deck works for a spear goblin and a bow goblin.

### A common intent pool  **[BUILT 2026-11-02]**

> **One pool of shapes, and a creature draws the subset it has earned.** The NPC side was a single
> creature with a cosmetic variant: two statblocks identical but for the weapon, sharing one deck of
> six, so a Goblin Archer threw rocks exactly as often as the spearman did.

**A card says what a creature does; the creature says how far and how hard.** `Close In` is *move
your speed, then Strike* &mdash; three squares for a goblin, eight for a rush spider, off one card,
because `move` with no number means the creature's own `speed` and the Strike comes off whatever it
fights with. That is the split a player's card has always had: *a card half says what you do, the
item says how well*.

**A card earns its place by capability.** Each one lists what a creature must be able to do &mdash;
`flight`, `burrow`, `spray`, `pack`, `commander`, `drain` &mdash; and a deck is the subset those
capabilities allow. So **declaring a monster is declaring what it can do**, and a card added to the
pool joins every creature that already qualifies without anybody revisiting them.

**Two shapes need nothing at all, and three need only that the creature can move** &mdash; five
cards for anything with legs. The decks run from **7 to 12**, which overshoots the *5 to 8* above on
purpose: a deck that repeats inside one fight is a deck the players have read by round three.

That universal floor used to be eight, and eight was too many. Measured across the world's
forty-seven built creatures, those eight cards were between **67% and 100% of every deck in the
game**, median 80%: four cards in five were the same four cards whichever creature you were looking
at, and the Processor's deck was the universal eight and nothing else at all. Special cards sat on
top of that sameness instead of displacing it.

#### Temperament  **[BUILT 2026-11-04]**

**Every creature has exactly one of three temperaments, and some cards are only for one of them.**

| | |
|---|---|
| **Drilled** | It is part of something, and will spend a turn on the thing it is part of. Equivalent to holding a `shieldWall`, `bodyguard` or `commander` tactic &mdash; line infantry, walls that walk, and every officer. |
| **Feral** | No plan beyond the body, and the body is enough. |
| **Wits** | It can see past the thing in front of it. |

Three of the eight universals were never really universal, only universal in the data: *Set and
Wait* holds a reaction back for whoever comes, *Hold the Line* spends the turn putting Block on the
creature beside you, and *Take Stock* does nothing this round in order to shake a condition off.
Those are things a disciplined thing does. A Flat Bug drew all three, and so did a Goblin Chief, and
nothing in either deck could tell you which was which.

So those three are drilled-only and wits-only now, and each temperament carries cards of its own:
the feral side **gorges** on what is already down, **thrashes** everything within reach and goes,
and **knocks you down** &mdash; the only Prone in the pool, which for a roster of charging animals
was a gap rather than a decision. The clever side **picks the soft one** (going round a shield
rather than through it) and **spoils the ground** with a trap.

#### Three cards that belong to a creature

**One exception to earning a card, and it is three cards long.** Each exists because a creature's
whole stated point could not be said in capabilities:

| | |
|---|---|
| *The Hive Obeys* | The Queen *spends every turn on the army instead* &mdash; and drew the smallest deck in the game, the same seven cards as a lieutenant. |
| *Open the Hold* | A Skaah is *full of something worse*, and nothing in the pool let it out. |
| *Carry It Off* | A Processor *is what a scene looks like before the fight*, and had no card of its own at all. |

The budget is closed at three. A fourth would mean the capability that should have carried it is
missing, and the honest fix for a missing capability is a capability.

**`move` is the capability nothing declares.** It is derived from having legs, wings, fins or a
tunnel, and fourteen cards ask for it &mdash; eleven directly, and three through `flight`, `burrow`
or `swim`, which are ways of moving and so grant it. The reason to bother deriving it at all is the
Horde's Queen: she has none of the four, so she is the one creature who cannot draw *Close In*, and
hers is the seven-card deck. A card whose text moves the creature and whose requirements do not say
so is a card she walks somewhere on no legs with.

> **And one card says *moves* and asks for nothing.** *Order* spends the commander's turn moving
> somebody **else**, which is why the requirement is written on what a card does and not on how it
> reads. The Queen draws it.

**One card carries no condition of its own.** *Envenom* is *Strike, and it carries whatever you
carry* &mdash; so a goblin's dirty trick, a slitherer's venom, a Keres' disease and a Strigoi's bite
are the same card and four different creatures.

#### One card reaches into a hand  **[BUILT 2026-11-07]**

Nothing an enemy did ever subtracted from a player's hand. Wounds and Taint **add** to a deck, and
Overloaded Spends two cards but the load is on your own back — so **every card a player lost, they
chose to lose**. That left one strategy with no counter at all: section 3 says you may turn your
whole hand sideways and calls it *"a character playing for their turns rather than their skin"*, and
against an enemy that can only deal damage, holding reactions is free.

| Card | Needs | Does |
|---|---|---|
| *Rattle* | `terrify` | ⚔ Strike. The target **discards 1 card**, their choice. |

- **Discard, never Spent.** Spent, off a card an enemy can draw every other round, takes the fight
  away; what a discard costs is the round, because a breath brings it back. It is the line section 8
  already draws between Strain and Spent, read from the other side of the table.
- **The player chooses which.** It is still a tax — a card out of your hand *now* is the thing
  Strain is priced on — and letting them choose is what keeps it from being a fishing expedition.
  **GM's choice is a different card**, and it belongs to an elite with a face-up reaction rather
  than to the pool.
- **It needs a capability and no temperament.** A shrieking thing and a calculating thing can both
  make you flinch, so `terrify` is what earns the card and nothing else gates it. The same keyword
  is what lets a creature put **Fear** or **Doubt** in your decks (section 8) — one keyword, a
  card and two intruders, the way `tainting` is both a printed effect and the keyword a sickness
  arrives under. Which of the two a source deals is what it attacks: the legs or the head.
- **It aims itself.** A player holding four reserved reactions has four things to lose; a player who
  spent their hand on their own turn has nothing to take and eats a plain Strike. Nothing has to be
  printed to make it the answer to a held hand — it simply is one.

**And nothing mills a draw pile.** The draw pile *is* the loss condition (section 8), so burning it
accelerates a defeat the player cannot interact with. The card that did it would be at once the
scariest and the dullest in the pool; if it ever exists it is a boss's once-a-fight, not a shape
anything earns.

#### Variants are deltas

A monster is a base and a handful of deltas. Numbers are **offsets**, so correcting a base moves
every variant with it; capabilities are `+added` and `-removed`, which is the only form that lets a
variant take something **away** &mdash; a Goblin Warrior is the one that does not run, and `-cowardly`
is how that is said.

And a variant has its own **`kind`**, because `kind` owns the deck and the intent card: the pair in
this world shared one, which is the defect the scheme replaces rather than inherits. The archer earns
*Loose* by being able to shoot, and the spearman cannot draw it.

> **A unique creature has no variants.** The Horde's Queen is *the one who rules it all*, and
> nothing in the code stops somebody giving her three; the validator does.

#### Every number is a ratio to the one that was measured

The goblin is **Health 5, Strike 3, armour 0**, and four of them against a starter Warrior is the
only fight this project has run. Nothing else in the roster has been simulated, so nothing else is
claimed: the table below is **ratios**, and the rule it obeys is the one in the next section.

| | Health | Strike | armour |
|---|---|---|---|
| a goblin, measured | 5 | 3 | 0 |
| Horde infantry | 5 | 3 | 1 |
| a lieutenant | 15 | 5 | 2 |
| a general | 25 | 5 | 3 |
| the Queen | 60 | 4 | 4 |

**What a starter world holds:** the goblin line, five creatures from one base. Forty-seven creatures
in a new world is a world nobody can find anything in, so the rest arrive one at a time through
`game.cardrpg.buildMonster("Mole Beast")`, with the deck its capabilities earn.

**And the twelve demons are absent.** Firma.md gives Watchers, Wanderers, Tempters, Djinn, Gheul,
Naga, Div, Estries, Familiars, Incubi/Succubi, Cambion and Imp as names with no description. Nothing
can be read off a name, so nothing is claimed.

### NPC gear and the armor rule

**A creature with no hands still fights with an item.** A mandible, a sting, a tail club and a
breath are all items with a **`natural`** tag: grown rather than carried, so they cannot be
disarmed, broken or looted. That costs no new mechanism &mdash; the sentence above already says NPCs
take their Strike from an item &mdash; and it keeps one knob setting how dangerous every monster is.
Nothing disarms anybody yet; the tag is on the item from the start so that the day somebody writes
the rule, a dragon does not drop its teeth.

**NPC weapons are their own items, tuned separately from the ones players carry.** A Goblin Spear and a player's spear can both be called a spear and have different Strike values. This is deliberate: an NPC's weapon is the one knob that sets how dangerous it is, and it shouldn't be tied to what a hero of the same level wields.

Tune it with this rule:

> **Keep a weak enemy's Strike value at least 2 above the heroes' armor.**

Armor is subtracted flat from every hit, so against many small attacks it doesn't reduce damage, it *cancels* it. At Strike 2 against armor 1, half of every hit is gone before fate is drawn, and a swarm of enemies is no threat at all. At Strike 3 the same swarm is dangerous. Simulation of the starter Warrior (armor 1) against goblins showed this clearly: at Strike 2 the warrior won every fight losing 2 of 12 Health, and raising goblins to Strike 3 was what made groups of four a real fight.

The rule cuts the other way too: a hero who stacks armor turns whole enemy types off. Give heavy armor a cost (see *Blocked icons*, section 10) and don't let armor climb much past 2 or 3.

### Tactics

Monsters should be dangerous because of **how** they fight, not just their numbers. Every NPC type has:

1. **1–2 tactic keywords**: rules that give the NPC an edge in a specific situation, usually advantage.
2. **A target priority**: who it attacks when it has a choice.
3. **A deck that supports the tactic**: a pack creature has cards that move to surround, a sniper has cards that keep its distance.

A good tactic also gives players something to **play against**. If wolves get advantage when they surround you, standing in a corridor beats them.

Starter list of tactic keywords (to grow over time):

| Keyword | Effect | Counter-play |
|---|---|---|
| **Pack Tactics** | Advantage on Strike if another ally is adjacent to the target. | Fight in corridors, kill the flankers. |
| **Skirmisher** | After it Strikes, it may Move 1. | Ranged attacks, Grappled. |
| **Ambusher** | Advantage against targets that haven't acted yet this combat. It draws with advantage on initiative. | Scouting, acting before it does. |
| **Sniper** | Ignores cover from figures. Moves away when an enemy comes adjacent. | Close the distance, use walls. |
| **Shield Wall** | Adjacent allies count as in cover against ranged attacks. | Area attacks, flank around. |
| **Bodyguard** | Reaction: takes a hit instead of an adjacent ally. | Kill the bodyguard first. |
| **Brute** | Its hits push the target 1 square. | Stand with your back to a wall. |
| **Grappler** | On hit: target is Grappled (1). | Kill it, keep Ready/Move cards. |
| **Commander** | When it acts, one ally may Move 1. Allies lose this while it's down. | Focus it down. |
| **Cowardly** | Flees when below half Health. | Let it run, or chase for the loot. |
| **Tainting X** | On hit: the target gains X Taint — disease or corruption (section 8). | Avoid its hits, carry a cure. |
| **Venomous X** | On hit: **Poisoned X** (section 7) — Dazed, and X a turn past armor. | Kill it first, or carry an antidote. |

Target priorities: **Nearest**, **Weakest** (lowest Health), **Caster** (anyone who Cast last round), **Last attacker**, **Leader** (GM's choice).

**A target priority is a rule, and that is why the GM may not see a hand.** Hand *contents* are
private from the GM as well as from the other players
([../foundry/hud-spec.md](../foundry/hud-spec.md) §7), because every priority above reads something
**public** — distance, Health, who Cast, who struck last. Let the GM see hands and *Weakest* quietly
becomes *whoever has no Parry left*, which is the one read that would make holding a reaction
worthless. The privacy is not there so that players can bluff — there is nobody to bluff (section 3,
*Showing a card*). It is there so that a declared priority stays declared.

### [OPEN] Cowardly needs rewriting

Simulation shows **Cowardly as written hands back more than Pack Tactics takes**. Against one starter
Warrior, four goblins with Pack Tactics win 20.3% of fights; the same four with Pack Tactics **and**
Cowardly win only 7.4% — worse than four goblins with no tactics at all (9.0%). Each goblin runs as
soon as *it* is hurt, so the group is ground down one deserter at a time and never reaches the
dangerous part of the fight.

The proposed replacement, which makes the threat scale with group size instead (four goblins win
11.5%, five goblins 37.3%):

> **Cowardly** — When half or more of its group is down, the survivors break and flee.

The pack holds while it is strong and breaks together, which keeps the early fight dangerous and
turns the rout into a moment the players earn. Either way, **a Cowardly monster is worth less than
its stats suggest** — price it lower, or make the escape cost the players something: the ones that
got away warn the next camp, carry off the loot, or come back with friends.

Simulation also shows **Cowardly should never go on a ranged NPC**: a *Sniper* already retreats when
something closes on it, so a flee tactic on top is redundant, and with group morale it makes the
archers walk away healthy — turning the hardest fight in the test set into one of the easier ones.
Keep Cowardly for melee types.

See [../sim/analysis-2026-10-27.md](../sim/analysis-2026-10-27.md), finding 4.

---

## 10. Icons

Card space is limited, so card halves use **icons** wherever possible. Text is only for effects icons can't express.

The full set, with counts and where to source it, is in [icons.md](icons.md). The glyphs below are placeholders.

| Icon (placeholder) | Meaning |
|---|---|
| ⚔ | Strike |
| ✦ | Cast |
| 🛡 | Defend |
| 🧪 | Use |
| 👣 + number | Move X |
| ⇄ | Ready |
| ⚡ | Reaction |
| +1 / −1 next to an icon | Modifier to that action |
| ◎ + number | Range |
| ✸ + number | **Blast**: area of that size, hits **everyone** in it, allies included |
| ✵ + number | **Aimed**: area of that size, hits **only your enemies** |
| ✚ + number | Heal X |
| ⊕ | Advantage |
| ⊖ | Disadvantage |
| 🔥 | **Spent**: playing this half puts the card out until you rest |
| ⤵ + number | **Strain X**: discard X other cards from your hand to play this half |

Example card written with icons:

```
┌──────────────┐
│ DRAW STEEL   │
│ ▲  ⚔         │
│ ▼  ⇄         │
│ ⚡ –          │
└──────────────┘
```

### [OPEN] Silenced is the one condition that can empty a turn

**Silenced blocks ✦ Cast**, and a caster plays spells off card halves that show it — so a Silenced
caster whose hand is all ✦ has the turn the blockquote above forbids. Nothing does this to a
fighter: Disarmed costs you one item's ⚔ and ⇄ Ready, and you can still pick something else up or
hit them with your hands.

It is not quite nothing, because **Brace is never blocked** and no card is ever completely dead
(below). But one point of damage reduction is not a turn.

The fix is a **content** rule rather than a rules change, and it sets a floor for the caster deck
that does not exist yet. A hand is 5 of 16, so for *k* cards carrying a non-✦ **primary**:

| Non-✦ primaries in 16 | A Silenced turn is playable |
|---|---|
| 4 | 81.9% |
| 6 | 94.2% |
| **8** | **98.7%** |
| 10 | 99.9% |

**Half the deck is the number.** Eight cards with an ordinary primary — a Move, a Ready, a staff's
⚔ — makes a Silenced turn playable 98.7% of the time, which is the same standard every other
condition in the list meets. Below six it is a coin-flip whether magic's hard counter is also a lost
turn, and *that* is the version of Silenced nobody should playtest.

### Blocked icons

Because each card half is built from icons, **features and conditions can block icons**:
- If an icon is blocked, you can't play any card half that shows it.
- The other half of the same card may still be playable.
- Brace (discard any card to reduce damage by 1) is never blocked, so a card is never completely dead.

Examples:

| Source | Blocks |
|---|---|
| **Grappled** (condition) | 👣 Move |
| **Silenced** (condition) | ✦ Cast |
| **Disarmed** (condition) | ⇄ Ready, and ⚔ with the disarmed item |
| **Heavy Armor** (item drawback) | ⚡ Sidestep reactions |
| **Berserker** (feature) | 🛡 Defend, but +1 on all ⚔ |

---

## 11. Grid, ground and movement

> **Leaving is free. Arriving is answered.** There are no opportunity attacks in this game — you may
> walk away from an adjacent enemy for nothing — but an enemy that **arrives next to you** hands you
> a *Sidestep* or a *Set Spear*. **Arriving means it took a step and was not adjacent before**: an
> enemy already in your face that shuffles a square has not arrived and hands you nothing.
>
> That asymmetry is the whole positional grammar, and it is the reverse of most games: it is why a
> bow is dangerous, why closing is the hard part, and why
> **mobility is the most valuable thing in a starter deck** — worth **29 points of win rate** against
> a mixed group and **nothing at all** against pure melee
> ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §6).

**[MEASURED] The *answer* half of that grammar is now measured too, and it is the same card.**
⚡ Sidestep had no implementation at all until 30 October — it was a word printed on *Advance*, so
every figure this project had published was measured with one of the starter deck's four reactions
inert ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §10). Firing it is worth
**+3.6 points** against five spears, **+1.5** against four, and **nothing measurable** against a
mixed group — the exact mirror of its own primary:

> **Advance's two halves are valuable in opposite fights.** Move 3 is worth 29.5 points against
> archers and nothing against spears; the Sidestep is worth 3.6 against spears and nothing against
> archers. One card, never dead, and never good at both ends at once — which is what a positional
> card should look like.

**The sentence above used to say "ends its movement next to you", and that wording was worth a point
or two of win rate on its own.** Read literally it also answers an enemy that was already adjacent
and merely shuffled, which is a free disengage rather than an answer to an approach — 67.5% against
69.5% on five spears, and 0.45 sidesteps a fight against 0.77. **Arrival** is what the heading always
meant, so that is what it now says, and the same clarification governs *Set Spear*.

Combat uses a square grid. All distances use **Chebyshev distance**: distance = the larger of the horizontal and vertical difference, so a diagonal step costs 1, the same as a straight one. (In Foundry: grid diagonal rule "Equidistant".)

- **Movement:** Move X = up to X squares.
- **Adjacent:** the 8 squares around you. Melee Strikes target an adjacent enemy unless the item says otherwise.
- **Range X:** count squares to the target, the same way as movement.
- **Line of sight:** ranged Strikes and Casts need a clear line from the center of your square to the center of the target's. Walls block it.
- **Area X:** hits the target square and all squares within X of it. Fate is drawn once for the whole attack (section 5).

### Blast and Aimed

Whether an area spares your friends is a property of the **item or card**, and it has its own icon:

| Icon | Kind | Hits |
|---|---|---|
| ✸ X | **Blast** | Everyone in the area — enemies, allies and you, if you're in it. |
| ✵ X | **Aimed** | Only your enemies. |

Blast is the default and the cheaper one: a Fire Wand doesn't care who it burns. Aimed belongs on precise or discriminating magic, and should cost more — a higher-tier item, a specialization, or a formula with a price attached.

This is the main reason to care where your party is standing, so don't make Aimed common.
- **Blocking:** you can move through allies but not through enemies.

### Sidestep

**Leaving is free; arriving is answered.** An enemy that **ends its movement** next to you hands you
a ⚡ Sidestep, and *arriving* is the load-bearing word: the square has to be new **and** the enemy has
to have been out of reach before it. A goblin already in your face that shuffles one square has not
arrived, and answering that would cost a card for nothing.

The step is to **any free square out of that enemy's reach**. A Sidestep neither redirects nor
reduces — what it does is break the reach, so the Strike that was coming finds nobody — which is why
a step that leaves you adjacent would spend a card for nothing. Cornered, with no legal square, the
card stays in your hand.

**One square, unless the card prints a number.** *Sidestep 2* is a longer step and nothing else:
still any free square out of that enemy's reach, just further out.

**Or you answer instead of leaving.** ⚡ **Counter** is the other thing an arrival can be met with —
*an enemy ending its move adjacent takes your Strike* — and it is flat, draws no fate, and nothing
answers it (section 3). One reaction per trigger means it is this *or* the step, and the step comes
first.

It asks two things of the weapon, and both ends matter: **reach 2 or more**, because a counter is
what a shaft is for and not what a knife is for — and the ability to hit the square **next to you**,
which is where the enemy has just arrived. So a **Halberd** or a **Trident** counters and a **Pike**
does not: a pike is useless adjacent, which its own entry has said since it was written
([equipment.md](equipment.md) §2).

### Cover

**A figure in cover is behind something, and ranged Strikes and Casts against it have
disadvantage.** The advantage table (§6) has cited this section for cover since the first draft;
this is the rule it was pointing at.

| Cover from | What it is |
|---|---|
| **figures** | anyone standing in the way — an ally as readily as an enemy |
| **obstacles** | a low one: a crate, a table, a cart, a parapet, the lip of a trench |

It is the same disadvantage either way, and the two are distinguished for exactly one reason:
**high ground** takes away cover from figures and leaves cover from obstacles standing (*Ground*,
below). *Moth-wing Fletching* ([equipment.md](equipment.md) §8.3) is the one thing in the game that
ignores both.

Two limits on it:

- **Melee Strikes against an adjacent target ignore cover.** You are both behind the same crate.
- A **full** obstacle — a wall, a pillar — is not cover at all. It blocks the line, and you cannot
  target through it.

> **The GM marks cover; the grid does not compute it.** Tracing the line past every figure on the
> board would put a disadvantage on most shots in a crowded fight — which is a defensible rule, but
> not one that can be switched on quietly: **every win rate this project has published was measured
> without it** ([analysis](../sim/analysis-2026-10-30.md)). So cover is **declared**, the way Prone
> is visible, and a fight where nobody declares it plays exactly as it did before. The list above is
> what the GM is deciding *about*; it is not an instruction to the grid.

### Ground

Three kinds of square, and all three were being used by spells before any of them was defined.

| | What it is | What it does |
|---|---|---|
| **Difficult ground** | rubble, water, thorns, ice — or a spell that says so | each square of it costs **2** of your Move instead of 1 |
| **Shadowed** | any square with no clear line to a light source. Indoors by day or out by night, the GM marks them; at night in the open, **every** square is shadowed | nothing on its own — it is what **Shadow Magic** reads (way-cards §3.4) |
| **High ground** | a square the GM has marked above its neighbours | shooting from it down, **the target gets no cover from figures** — only from obstacles |

**Difficult ground is the only one that costs anything**, and it costs Move rather than forbidding it,
so a Move 3 crosses one square of rubble and stands on the second. Four formulas create it and
*Light Feet* (way-cards §3.3) is the card that ignores it.

**Shadowed carries no rules at all**, which is deliberate and is the same decision as an **opening**
(§7): a whole school reads it, and if the square itself did anything the school would be reading a
bonus instead of a battlefield.

**High ground removes a penalty rather than adding a bonus.** That is on purpose — positioning is
already the strongest axis in the game, so the reward for taking the hill is that figures stop
shielding your target, not a flat plus.

> **There is no universal flanking rule, and there is not going to be one.** Positional rewards in
> this game belong to **specializations**, one each: an Assassin has advantage against an enemy that
> is busy with somebody else, an Archer shoots whatever ends its movement in sight, a Guardian stops
> an enemy sliding past ([way-cards.md](way-cards.md) §2.5). Forty-eight different tactics reward
> forty-eight different positions, which adds decisions; one flanking rule would reward every
> character for the same thing, which only adds power to the axis that already has the most. It is what the **ground** resource a specialization pays in
actually buys ([leveling.md](leveling.md) §5a.1).

### Forced movement

A push, a pull or a throw moves a figure a stated number of squares in a straight line. The **mover**
does not choose the path and the **moved** does not spend Move.

- It **is** movement for everything that cares: it can set off a *Sidestep*, and it ends a turn's
  worth of standing still.
- It **ignores difficult ground** — you are being thrown across the rubble, not walking it.
- It cannot push a figure into a wall or another figure. It stops in the last square it can reach.

*Undertow* (way-cards §3.5) is the first miracle that does this, and it was written before the rule
was.

### Ranged in melee

If you make a **Ranged** Strike or an **Area** Cast while an enemy is **adjacent** to you, you have **disadvantage**.
This is the one generic rule. Items or features can make exceptions (e.g. a feature "Point Blank: ignore the ranged-in-melee rule").

---

## 12. Open questions (next sessions)

- **[OPEN]** **Figure size.** Nothing says whether an ogre or a mounted knight occupies more than one
  square, and it is tangled with mounts ([conditions.md](conditions.md) §4.2) — both wait on the same
  decision.
- **[OPEN]** **Move is not resolved by the engine.** Figures are pushed by hand, and the tray prints
  the played value (halved by Slowed, reduced by Frozen) but nothing else. Given that mobility is the
  most valuable action in the game (§11), this is the largest remaining engine gap: at minimum the
  HUD should show reach to each target, since that is the number every positional decision turns on.

- **The Way graphs.** Every node, benefit and specialization for Strength, Shade and Mind. The
  leveling *mechanism* is settled in [leveling.md](leveling.md) — a milestone step along a directed
  graph, two benefits offered and one taken — and with it the double-attack decision (section 3),
  the action-deck grow/prune rules (section 8) and rest tokens. What is left is content, and it
  waits on the world.
- **Affliction list for Taint sources** (section 8). Waits on world creation.
- **Character creation** — *deliberately deferred until after the first playtest.* The sequence (pick
  a Way, take a background, assemble a starter deck) is easy to write and easy to get wrong before
  anyone has played, so it waits for evidence. Until then, play with the pregenerated starter
  Warrior in [starter-cards.md](starter-cards.md).
- **[OPEN]** **The opening hand.** Round 1 step 1 is the same refill as every other round, so a
  character's first hand is five cards off a shuffled sixteen with no mulligan, no redraw and
  nothing that looks at it. It is the one draw in a fight where nobody holds information and nobody
  has spent anything, and it may matter more here than in most games: taking the hero's one movement
  card away is worth **29.5 points** of win rate against two spears and two bows (section 11), and
  an opening hand with no 👣 Move in it is that position for as long as it takes to cycle. Three
  answers are open — a mulligan, a rule that guarantees the first hand a Move, or *variance in the
  opening hand is the game* — and the third is a real answer. **This waits on the playtest, with
  character creation**, because all three are cheap to write and only evidence tells them apart.
- **[OPEN]** **Drawing on demand.** *Red Mist* is the only thing in the game that draws a card
  outside a refill, and nothing general does it. That is probably right rather than missing —
  refilling to hand size **is** the economy, and a half that draws competes with it directly — but
  it has never been decided, only left unbuilt. Decide it before a Way graph wants it, not after.

Settled since draft 0.1:

| Was open | Decision |
|---|---|
| Skill deck for out-of-combat play | Written: [skill-rules.md](skill-rules.md) draft 0.2. |
| Condition timing | Ticks at the start of the **creator's** turn, so a duration-1 condition always costs the victim exactly one turn (section 7). |
| How Block works and how long it lasts | Section 4, *Block*. |
| Stat checks and saving throws | There are no stats. The six **approaches** are the stat line, and a **passive score** turns a deck into a number when one is needed. See *Saving throws* in [skill-rules.md](skill-rules.md) §2. |
| How to tune NPC damage against armor | Section 9, *NPC gear and the armor rule*. |
| Final icon set and card layout | [icons.md](icons.md) lists all 50 icons with their sources; [../foundry/card-layout.md](../foundry/card-layout.md) specifies every face. |
| Action deck size | 12–20 cards, raised by features (section 8). |
