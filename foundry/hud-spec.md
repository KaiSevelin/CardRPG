# HUD specification

What the player-facing tray shows, and how it behaves. Covers the Foundry VTT system only; the game
rules live in [../rules/](../rules/).

---

## 1. Tray, not sheet

Foundry's default paradigm is a character sheet you open, consult and close. That is wrong for this
game's core loop. Every turn a player picks **two halves from five cards**, and the legality of each
half depends on their conditions, their equipped items and which card they already used.

So the system has two player-facing artifacts:

| | What it is | When it's on screen |
|---|---|---|
| **Tray** | What you play from: hand, resolved values, live state | Always |
| **Sheet** | What you consult: inventory, features, deck building, rests | On demand |

This spec is about the tray.

## 2. Decisions taken

| Decision | Choice |
|---|---|
| Fate deck discard | **Face up** (provisional). Deck composition is printed in the rules, so hiding the discard adds memory burden, not tension. Revisit if table play shows it slowing turns or flattening the tension of a draw — see §4.2. |
| Mode switching | **Automatic.** Combat tray while a Foundry Combat is active, scene tray otherwise. |
| Visibility | **Each player sees their own hand.** Hand *contents* are private; hand size and deck state are public (see §7). |

---

## 3. Combat tray

```
┌─ CONDITIONS ──────────────────────────────┐ ┌─ YOU ──────────────┐
│ Dazed 1  <- goblin 3  (ticks on its turn) │ │ HP 8/12   Block 2  │
│ Burning 2 <- self                         │ │ Wound 1  Taint 0   │
│ BLOCKED: secondary halves                 │ │ Rest 1             │
└───────────────────────────────────────────┘ └────────────────────┘
┌─ PLAY AREA (§3.5) ────────────────────────────────────────────────┐
│ PRIMARY: Strike <- Longsword                                     │
│ SECONDARY: Shield <- Wooden Shield                               │
└───────────────────────────────────────────────────────────────────┘
┌─ HAND ────────────────────────────────────────────────────────────┐
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│  │ STRIKE  │ │ HEAVY   │ │ SHIELD  │ │ ADVANCE │ │ WOUND   │     │
│  │ P Str 4 │ │ P Str 5 │ │ P Def 2 │ │ P Mov 3 │ │         │     │
│  │ S [Mov1]│ │ S [Mov1]│ │ S [Mov1]│ │ S [Mov2]│ │  dead   │     │
│  │ R Parry │ │ R --    │ │ R Block │ │ R Side  │ │  card   │     │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │
└───────────────────────────────────────────────────────────────────┘
  DRAW [#######.....] 7    DISCARD 3    SPENT 1       FATE 14/20
```

`P` / `S` / `R` are the primary, secondary and reaction halves. `[brackets]` mark a blocked half —
here Dazed is blocking every secondary.

### 3.1 Card halves show resolved values

A half renders `Strike 4`, not `Strike`. The rules make the card say the verb and the item say the
value, which is elegant on cardboard and miserable on screen — nobody should compute Longsword 3 +
Strong 1 sixty times a session.

The tray folds in **steps 1-3** of the resolution (item base, card modifier, features) and leaves
**steps 4-6** live (conditions, fate, the target's defenses), because those depend on the target.

Hovering a half shows the breakdown, so the arithmetic stays auditable.

### 3.2 Blocked halves are greyed in place, never hidden

Conditions, features and item drawbacks block icons (core-rules §10). The tray computes the blocked
set and marks each affected half, leaving it visible so the player learns why.

**Brace is never blocked**, so every card keeps at least one use. A card must never render as fully
dead except a Wound.

### 3.3 Wounds and Taint in hand

| Card | Behaviour in the tray |
|---|---|
| **Wound** | Occupies a hand slot, renders as unplayable, auto-discards at end of turn. |
| **Taint** | Has no decision attached: resolve on draw (1 damage, ignores armor), discard, draw no replacement. Show a notification, don't prompt. |

### 3.4 Playing a turn

One primary and one secondary, from **two different cards**, in **either order**.

1. Player picks a half. The tray then dims halves that are now illegal — the other half of the same
   card, and the same slot type.
2. Player picks the second half.
3. Player **sequences them**. This matters: an *Advance* primary followed by a Strike secondary is a
   different turn from the reverse.
4. Each card goes where the half it was played for sends it: the **discard** normally, the **Spent
   pile** if that half is printed *Spent*.

Dazed removes step 2 entirely — primary only. Exhausted likewise, and also disables reactions.
`R` is a button, not a readout: clicking it turns the card sideways so it will not react (§6.1).

### 3.5 The play area: two stacks, over the Fate deck

A card says the verb and the item says the value, so a longsword that both strikes and defends is
ambiguous the moment both halves are staged. Rather than stamp the answer on the slate, the HUD puts
it in the layout: **where a card sits is what it is doing.**

```
     ┌─────────────────────────────┐
     │ Starter Warrior              │
     │ ♥ 12/12 ⧈ 0 ▤ 1 │ 18 ◦ 3 ◦ 1 │  <- vitals, then the piles as links
     │ [Clear] [Breath] [End turn]  │
     └─────────────────────────────┘
     PRIMARY  ‹ ›             SECONDARY
     ┌──────────────┐        ┌──────────────┐
     │ Longsword → ↺│        │ Wooden Sh. ←↺│  <- the cards behind: name only
     ├──────────────┤        ├──────────────┤
     │ STRIKE       │        │ SHIELD       │
     │ strike 4     │        │ defend 2     │  <- the front card, in full
     │ primary      │        │ secondary    │
     └──────────────┘        └──────────────┘
     ┌─────────────────────────────┐
     │             PLAY             │
     └─────────────────────────────┘
```

The column runs down the right, clear of the sidebar so that chat, the combat tracker and the rest
of its buttons stay reachable beside it. Its width is measured against the real sidebar on every
render rather than assumed, because the sidebar collapses to a rail of buttons and expands again,
and a fixed offset would cover those buttons half the time. It is anchored at the top, because the
stacks grow downwards as cards go into them and the part you click should not move when they do.

It is three rows: who is playing and the piles they draw on, then the two stacks, then the button
that resolves them.

**Fate, Discard and Spent are links in the panel, not deck backs on the table.** A deck back is a
big object that says *draw me*, and none of these is drawn from by hand — Fate is drawn by the rules
when an action resolves, and the two discards are records. As card-sized backs they also made the
column tall enough to sit under Foundry's own notifications, which have to land somewhere.

It reads top to bottom: who you are and what you have to spend, what you are about to do, then the
button that does it. Nothing about a turn is anywhere else. The far left keeps what it had --
Items, Features and Conditions stacked from the top, the Action deck in the bottom corner -- so the
two sides split cleanly: **what you own** on the left, **what you are doing with it** on the right.

A **stack** is one action and everything modifying it: the card half you staged at its base, then
the slates assigned to that half. **Worn slates never enter a stack** -- armor, a cloak, a ring are
simply on, like a passive feature, and putting them in a stack implied a choice that was never
there (core-rules §4). Primary on the left, secondary on the right. A stack stands
without an action card too, because gear is equipped long before a hand is dealt.

The cards overlap, so only the front one reads in full and the rest show their names. The `‹ ›`
**carousel** turns the stack to bring any card to the front; it changes nothing but what you can
read, and only appears once there is more than one card.

Under the two stacks sits **Play**, the one button that resolves them. It stays disabled until the
turn is complete — a primary *and* a secondary, from two different cards — or, when Dazed or
Exhausted has cut you to one half, until that half is staged. Half a turn is not a turn, so the
button does not offer to play one.

**The card is the control, and the name is a second one.** Clicking a card's body takes it out of
the stack; clicking its *name* turns the stack to it instead, so a card behind can be read without
being disturbed. That split is what lets a stack be both a list and a thing you take apart.

| You click | What happens |
|---|---|
| A card in a deck | It goes into play, into the primary stack. |
| A card's **name** in a stack | The stack turns to it, bringing it to the front. Nothing moves. |
| `→` / `←` on a modifier | It moves to the other stack. Free and reversible. |
| A **modifier's body** in a stack | It goes back to its deck. |
| The **action card** at the base | It goes back to your hand, **and the whole stack goes with it** — every item and feature in it returns to its deck. |
| **Clear** | The same for both halves at once: the play area is emptied. |

Taking the action card down takes its modifiers with it because they were assigned to *that* action;
without it they have nothing to modify.

Only a slate that could modify more than one action can be moved with `→` / `←`. One with a single
verb has nothing to choose, and a used feature has no half at all; both ride with the primary. When
resolving, the item assigned to that half wins; then a single-verb item; then anything else in play,
highest value first.

A passive feature is in no stack and cannot be clicked: it is simply true.

### 3.5.0 The assist: the stack knows what the action is  **[BUILT 2026-11-08]**

A stack already filled itself in part: gear is in it because it is in your hand, and a feature
because it has been spent. Neither of those knows what you are about to do. **Once a half is
staged, the stack does** — and three things follow, which are the three a player would otherwise
click every turn with the same answer.

| What arrives | Why | Can it be taken out? |
|---|---|---|
| the **default formula**, on a Cast | a prepared spell is in a spell slot, which is not a stack, so a Cast had nothing in front of it | **yes**, the cross beside its name |
| **ready features** that could serve this half | a feature you could use and did not is the commonest thing to forget | **yes** |
| **conditions that bear on this half** | the one about to stop the action is the thing you most need to see before clicking | **no** |

**Nothing arrives until a half is staged.** A stack standing with no action above it is a state
the play area supports on purpose, because gear is equipped long before a hand is dealt, and
guessing then would fill both stacks before the turn begins.

**The default weapon is not in that table, and that is not an inconsistency.** An equipped weapon
is already in the stack, because it is in your hand. What a default weapon does instead is settle
**which of two** — and only as a tie-break, after the half you placed a slate on. A player holding
two swords has the same ambiguity every turn and the default is their standing answer to it; a
default that outranked a click would be a settings panel overruling a decision just made, so a
default sword never takes a Strike away from the axe you deliberately put in the primary.

Set either with the **star** on a slate in the panel. It is a toggle, because the second useful
gesture after *this one from now on* is *actually, ask me* — and a character with two swords and no
preference should be asked, because for them it is a decision rather than a formality.

#### Why a condition has no cross

This is the only interesting line in the feature, and it is worth stating as a rule rather than as
a layout choice.

> **A feature is yours; a condition is something done to you.**

So a feature is **offered** and can be waved away — an assist you cannot refuse is a helper that
plays the turn for you. A condition carries a duration and ends when the duration does
(core-rules §7), so it is **shown**: no cross, no arrow, and the stack does not make it clickable
at all. The one thing this panel must never offer is declining the Dazed you are carrying, and a
tooltip saying *this cannot be removed* beside a button that removes it would be the tray arguing
with itself.

A condition sits last in the stack, inset and without a rim, so it reads as the **circumstances**
of the action rather than part of it. An offer is dashed, because dashed is this interface's word
for provisional.

**Relevance is read off the condition's own config flags**, never from a list of names — the same
arrangement the tray already uses for Dazed, Stunned and Halted, and for the same reason: a flag
nothing reads is a flag that is not true. A condition bears on a half when it blocks one of the
half's icons (Grappled on a Move, Silenced on a Cast), carries a bonus for one of its verbs,
changes a Move the half makes, takes the turn or the secondary, or changes the fate draw at all —
which is how Blessed and Cursed turn up, being the easiest things on a sheet to forget.

**[OPEN]** Whether the offers should be ranked rather than listed. Four ready features on one
Strike is four cards in a stack, and at some point a list stops being an assist. Waiting for a
character with four.

### 3.5.1 Disabled for a while

Both items and features can be **disabled for a number of turns** — `drained`, with `drainedFor`
counting down. A disabled item is still equipped and still sits in its stack, drawn faded with its
lines struck through, because what you need to know is that it is there but not working.

### 3.5.2 Ready is settled on Play, with everything else

Inside a combat, putting a slate into play costs a **Ready** — doing it under pressure is the whole
reason the verb exists (core-rules §4). But Ready was the one verb whose effect had to land *before*
the thing it paid for, which made arranging a stack run backwards from every other decision in the
turn: play the half, then pick the item.

So the arranging is free and **the turn pays for it**. Each item equipped under pressure owes one
Ready; on **Play**, the staged halves have to cover the debt before any step resolves:

- enough Ready icons staged → one chat line names what was readied, and the debt clears;
- not enough → nothing resolves, and the warning names both ways out: stage a half showing Ready, or
  swap the item back out for the one it replaced.

A slate taken back out **cancels what it owed** — it is not in play any more, so it was never
readied. Outside a combat equipping is free, so a debt carried out of a fight lapses.

One Ready buys one equip *or* one swap, exactly as the rules have it. Because an item comes off only
by being replaced, those are the same transaction: what is counted is what **arrived**, not what was
displaced. A two-hander taking both hands displaces two items and still costs the one Ready.

### 3.5.3 When the HUD opens

On `combatStart`, and again on every `combatTurn` and `combatRound`. All three are **transitions**,
which is why a Foundry reload mid-combat used to leave the HUD shut until the fight was ended and
restarted -- none of them fires for a fight that was already running.

It therefore also opens on `ready` and on `canvasReady` when `game.combats.active` is already
started. Both, not one: on `ready` the canvas may not be up, and picking who is playing looks at the
controlled token. Opening twice is a no-op.

### 3.6 Catch Breath

**No modal.** Catch Breath takes 2 cards from the discard at random and asks nothing, so the button
does it and reports in chat. The modal here used to exist for the Spent pick, which no longer
happens: the discard is a cycle, and what leaves the deck is what the player chose to spend
(core-rules §8).

**The button is disabled below 2 cards in the discard**, with a tooltip saying so. The recovery is
all or nothing, so a thin discard buys nothing — and a button that takes your whole turn and hands
back one card is a trap, not a choice. Dead and explained beats live and worthless.

### 3.7 What a half costs

Two costs can be printed on a half, and both show on the face wherever that half is shown -- in the
hand, and at the base of a stack:

| Printed | Paid | Icon |
|---|---|---|
| **Spent** | On resolution: the card goes to the Spent pile instead of the discard | Card burn |
| **Strain N** | Before resolution: discard N other cards from hand, player's choice | Card discard + a bare number |

Both render as icons in a boxed pill at the **far end of the half**, after the verbs -- the verbs are
what the half does, the pill is what it takes (card-layout §1.4). Strain's number is bare, so it
reads as a parameter like *Move 3*. The two icons are both card-shaped and the flame is what tells
them apart, which is the rule itself: a Strained card comes back on a Catch Breath, a Spent one does
not come back until a rest.

They sit in `CARDRPG.costIcons`, deliberately outside `verbs` and `effects` where the Blocked-icons
test looks, so nothing switches off an expensive half by accident.

**Strain prompts once per card, not once per bill.** Asking for two cards as a form means policing
a count -- too many ticked, too few, none at all. Asking for them one at a time cannot be answered
wrongly, and backing out of any prompt cancels the turn, because a half-paid cost is not a cost.

The cards being played are never payable: a half cannot pay for itself. If the rest of the hand is
too thin to cover the bill, the turn is refused with a notification rather than part-paid -- the
same shape as an unpaid Ready (§3.5.2).

### 3.8 Piles are links, not decks

Fate, Discard and Spent sit as **icon counters on the same row as Health, Block and Armor**, divided
off at the end of it, each opening into the same spread the left-hand decks use. They share that row
because they are the same kind of thing -- a number you read, not a thing you click to play -- and
because the column has no height to spare.

A deck back on the table promises a pile you can draw on. None of these is drawn from by hand: Fate
is drawn by the rules when an action resolves, and the two discards are **records of what the fight
has cost you so far** — the same kind of thing as Health, Block and conditions, and belonging where
they are. They also cost the column two card-heights it could not spare: at full height it sat under
Foundry's own notifications, which have to land somewhere.

| Link | Icon | Opens |
|---|---|---|
| Fate | Card random | the fate **discard**, face up; the deck itself stays face down |
| Discard | Card discard | your action discard |
| Spent | Card burn | the Spent pile |
| **Spells** | Spell book | your **spell book** — everything not prepared |

The spell link reads **prepared / slots** rather than a single count (`2/3`), because what a caster
needs at a glance is not how many spells they own but how many they can still bring. It is absent
for a character with no spell slots, the way Spent is absent until something is Spent.

Discard and Spent reuse the two cost icons on purpose: a Strain cost and the Discard link mean the
same pile, and a Spent cost and the Spent link mean the same pile.

**Spent is absent entirely when nothing is Spent**, so it appears exactly when it starts to mean
something. Fate and Discard are always there, because a count of zero is itself worth reading.

---

## 4. The two numbers that carry the tension

### 4.1 Draw pile - a bar, not a number

Simulation says the deck runs dry in 89% of four-goblin fights and the hero stops to Catch Breath in
most of them ([../sim/analysis-2026-10-27.md](../sim/analysis-2026-10-27.md), finding 2). That
countdown *is* the drama: reactions cost cards — by themselves, and whether you were watching
(§6.1) — and a turn spent breathing is a turn not spent fighting. It gets a depleting bar with the
count beside it.

(Deck-dry barely moved when Catch Breath became a flat 2 — the deck runs out on the first pass
through it either way — but what happens afterwards did. Breaths per fight doubled, from 1.3 to 2.7
in the hard fight, so over a quarter of the character's turns now go on breathing rather than
fighting. The bar is counting down to a much steeper slope than it used to.)

### 4.2 Fate deck - a live risk readout

Miss and Critical **both** trigger a reshuffle, so between reshuffles the deck always still holds
exactly one of each. With `k` cards left, the chance the next draw is a swing is `2/k`:

| Fate cards left | Chance of Miss or Critical |
|---|---|
| 20 | 10% |
| 10 | 20% |
| 4 | **50%** |

A thin fate deck means wild outcomes, and that is knowable information. The panel shows the count,
the face-up discard, and **optionally** the computed swing percentage as a per-table toggle — some
groups want the arithmetic surfaced, others find it clinical.

Advantage and disadvantage draw two cards, so they deplete the deck twice as fast. Worth showing in
the panel when such a draw is pending.

The face-up discard is **provisional**. It makes the `2/k` readout above available to anyone who
looks, which is a real tactical layer — and if it turns out to slow turns down or to drain the
suspense from a draw, hiding it again is a one-line change. Worth watching for in the first playtest.

### 4.3 The fate deck spans both modes

The same 20-card deck resolves combat damage *and* skill checks (skill-rules §2). The fate panel
therefore persists across mode switches and does not reset when combat ends.

---

## 4a. Art on a card  **[BUILT 2026-11-01]**

Every card and slate takes a picture, and the layout had to be decided before any art exists,
because the face **cannot be a picture**: core-rules §10 renders a face from data so that a
condition can switch an individual icon off at runtime. Art therefore sits under a face that still
draws itself.

> **Full-bleed behind a scrim**, not a window at the top. At 150px a card has room for a name, two
> halves and a reaction row and nothing else; a window would cost about 40% of the height. The art
> fills the printed area and the text sits on a ground of the paper colour at 86% — so a card with
> **no** art shows a scrim the same colour as what is behind it, and looks exactly as it did before
> there were pictures. That degradation is the reason to prefer it: the whole catalogue works now
> and improves one file at a time.

**And the card is a rim around a printed face**, the way a playing card is: the colour runs all the
way round and the printing stops short of the edge. The rim is the element's **border**, which is
what lets the art live inside it with no extra markup — `background-clip: padding-box` stops the
art at the inner edge and the padding box rounds its own corners.

> **The ratio is one number, and it moved once.** The card was 5:7 — the standard playing-card
> proportion — and is **2:3**, which is a taller card: 192px against 179 at the tray's width, and
> that 13px is the whole cost of the change. It was two numbers before, `0.716` in the card's own
> `aspect-ratio` and `128/179` in the tray's layout block, already disagreeing in the third
> decimal; the tray's height is derived from the ratio now, so there is one statement of it. It
> also governs the **sideways card**, which is scaled by the ratio so a rotated card still fits
> its slot — a change to the shape of a card moves that with it and automatically.

> **The rim is always there, and ivory when it means nothing.** A tint on it means a **bonus group**
> and nothing else, system-wide; an action card has no group, so it wears the paper colour — which
> is the white outer strip the rim was modelled on. The border **style** still varies with the
> group, because seven is past where hue alone reads, and a 5px `double` band reads as two
> concentric lines where a 1px one barely read at all.

**What to supply.** The card is **2:3**, so art at 2:3 fills it exactly and nothing is cropped. A
file at any other shape still works — it is cover-cropped rather than letterboxed — but it loses
whichever dimension is long, so composing at 2:3 is the difference between drawing the card and
drawing most of it:

| | |
|---|---|
| Ratio | **2:3** |
| Size | **640 × 960** (2×, for a 150px card on a retina display) |
| Where | anywhere in the world's files; the path goes in content |
| Field | **none was needed** — Foundry already gives every Item an `img`, every Card face an `img`, and every Actor an `img` and a prototype token, and nothing in this system used any of them |

A content definition carries `art: "..."` and **one reader puts it where it goes**: `artIn` beside
`artOf`, the writing side of the same question. A card's goes on the face, an item's on the Item, a
creature's on the Actor **and** on its token — the same file in both, because the thing on the map
and the thing on the sheet are the same creature and two files is one to forget.

> **A token is not a card.** 1:1 at 512 × 512 with transparency required, against a card's 2:3
> full bleed. A token sits on the map rather than in a frame, so a background is a square of the
> wrong colour around the creature.

Foundry fills those slots with its own placeholder when a document is created, so the test is not
*is there a path* but *is it ours*: anything under `icons/svg/` is core's set, and a generic bag
icon stretched across a card would be worse than no art at all.

> **For a long time only the card slot was written.** An item's `art` fell into `slateData`'s
> `...rest` and landed in `system.art`, where nothing reads it — every item, feature and piece of
> gear in the catalogue, a hundred and seventy-six pieces. The levelling graph reads the path
> straight from content and draws it on a node, so a feature's picture turned up there and on
> nothing else, which is exactly the shape of a defect nobody finds by reading.

---

## 5. Scene tray  **[BUILT 2026-11-01]**

> **The same window in a different mode, not a second application** — because §4.3 says the fate
> deck spans both modes, and a second window would have to draw it twice. The tray renders the scene
> side whenever no Combat is active.
>
> Three of this section's four differences from the combat tray are built as written. **Values are
> not pre-resolved**: a tool bonus is situational, so the card shows its base and the check asks
> which tool — combat answers the same question by where the slate sits, and there is nowhere
> equivalent to put a lockpick. **Push offers same-approach cards only**, which is the rule rather
> than a convenience, and a wild serves any, which is the whole reason an Inspiration is worth a
> slot that could have held a 3. **A passive score is static** and renders as a constant.
>
> **A scene is not an event the engine has.** skill-rules §1 says *the GM says when a new scene
> starts*, so dealing the skill hand is a GM action and not a hook — the same shape as granting a
> level, and for the same reason: nothing in the software could raise it.
>
> **[OPEN]** Challenge tracks and secret slates, which are the remaining two rows of the sketch
> above. Both need content that does not exist yet (§3 challenges, §5.3 secrets).


Shown whenever no Combat is active.

```
┌─ PASSIVE ─────────┐ ┌─ CHALLENGE ──────────────────────────────┐
│ Wits 2 -> 4       │ │ Progress [###..] 3/5   Pressure [##.] 2/3│
└───────────────────┘ └──────────────────────────────────────────┘
┌─ SKILL HAND ──────────────────────────────────────────────────────┐
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ WITS 2   │ │ MIGHT 2  │ │ SHADOW 1 │ │ ANY 1    │             │
│  │Sharp Eyes│ │Shoulder  │ │Light     │ │Inspiration│            │
│  │Edge: ask │ │It        │ │Fingers   │ │Edge: draw│             │
│  │a yes/no  │ │          │ │Edge: ... │ │1 card    │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
└───────────────────────────────────────────────────────────────────┘
  SKILL DECK [####....] 6   DISCARD 4   SPENT 1   Secrets 2   FATE 14/20
```

Differences from the combat tray:

- **Values are not pre-resolved.** Tool bonuses are situational (`Shadow +2 (locks)`), so the tray
  shows the card's base value and offers a tool picker when a check is made. Combat answers the same
  question by where the slate sits instead, in the primary or secondary stack (§3.5); whether that
  reads well enough for tools too is open.
- **Push highlights same-approach cards.** Selecting a card dims every card of a different approach,
  since Push requires a match.
- **Passive score is static** — the highest Wits value in the whole deck, +2, counting the discard and
  Spent cards. It never changes during play, so it renders as a constant, not a live stat.
- **Challenge tracks appear only inside a challenge**, toggled by the GM.
- **Secret slates** show as a count with a click-through.

---

#### 5.1 The call for a check  **[BUILT 2026-11-02]**

> **The GM's half of a check is a banner, not a field.** skill-rules section 2 step 1 gives the
> difficulty to the GM, and the first build put a difficulty select in the player's dialog. A call
> is set once, shown to everybody, and answered with one card.

```
┌─ CALL ────────────────────────────────────────────────┐
│ Hard 7 · Shadow · advantage   the shutter is unlatched│
└───────────────────────────────────────────────────────┘
```

- It lives as a flag on the **active scene**, because a call is a state of the table rather than an
  event in its history: true until withdrawn, identical on every client, and `updateScene` already
  redraws the tray. Not the *viewed* scene &mdash; a GM drawing next week's map must not take the
  call with them.
- **The GM sees a button when there is no call** and a *Re-call* beside the scene counts when there
  is, because a difficulty set wrongly should be corrected rather than argued about.
- **Answering does not withdraw it.** Several characters answer the same gate in a challenge.
- Cards that cannot answer are **dimmed in place**, by the rule of §3.2: never hidden, because
  hiding them hides the reason.
- A player with no call in front of them is told to say what they are doing. The engine will not
  invent a difficulty.

#### 5.2 Challenge tracks, and checks written into the prep  **[BUILT 2026-11-02]**

> **The remaining two rows of §5's sketch.** Challenge tracks appear only while a challenge is
> running, as the sketch says, and they are bars: the question is how much room is left.

```
┌─ Into the baron's manor ─────────────────────────────────────────┐
│ Progress 3/5 [#####....]  Pressure 2/3 [######.]  Catch Breath × │
└──────────────────────────────────────────────────────────────────┘
```

- **Catch Breath appears on the track, not on the deck**, because in a challenge it is a Pressure
  cost rather than a turn: Pressure +1, your discard comes back, one card of your choice is set
  aside as Spent, and you draw up to hand size. The choice is the player's, the way a prune is.
- **The GM's row gains two decks**: *Challenge* starts one, *Twist* and *Twist ×2* draw from the
  thirty. Both appear only for the GM, and the twist buttons only when the world has the deck.
- **A filled track is coloured, not enforced.** The GM says what the ending means.

And the prep carries the call:

```
    @Check[wits|hard]{Spot the tripwire}
    @Check[shadow|7|advantage]{The shutter is unlatched}
    @Challenge[5|3]{Into the baron's manor}
```

Written in a journal page, an item description or a chat message, each becomes a button. The GM
clicks it and the call is set for the party exactly as if they had filled in the dialog &mdash; which
is where most of a session's checks come from, since most of them were prepared before it started.
**A player clicking one gets a reminder instead**, because step 1 is still the GM's: an enricher is a
shortcut for the person who was always allowed to take it, not a way round the rule.

The parts are order-free and all optional &mdash; an approach, a difficulty as a word or a number,
*advantage* or *disadvantage* &mdash; because a GM writing prep should not have to remember a
grammar, and an unrecognised part is ignored rather than refused: a page full of red errors is worse
than a page with one odd button.

#### 5.3 What the party notices  **[BUILT 2026-11-02]**

> **The GM's panel, and it is collapsible because most of the time one line is the whole answer.**

```
┌ + Passives ──────────────────────────────────────────────┐
│ ✊4  🌀5  🌑6  👁6  📜4  👑3                              │
└──────────────────────────────────────────────────────────┘

  folded open:
┌ − Passives ──────────────────────────────────────────────┐
│ ✊ Might    Brom 4    Kira 3    Aldren 2                  │
│ 🌑 Shadow   Kira 6    Brom 2    Aldren 2                  │
│ ...                                                       │
│ Tokens on this scene: Brom, Kira, Aldren                  │
└──────────────────────────────────────────────────────────┘
```

- **Folded by default**, and the fold is a **client setting**: a GM who puts it away once should
  find it away next session, where a field on the application would last only as long as the window.
- **Who counts is whoever has a token on the active scene.** A scene with no tokens falls back to
  every character, since a GM reading this before the session starts is a real case and an empty
  panel is worse than a long one.
- **While a call is live each approach is marked** &mdash; the passive meets it, a card could carry
  it, or it is out of reach even with their best card in hand &mdash; but only for the approach the
  call names, because a Wits call says nothing about the Might obstacle.
- **It is the GM's, and not because it is secret.** A passive is static (§5), which is what makes it
  safe in the open; it is the GM's because it is the GM's decision it serves.

---

## 6. Interjecting

Both modes let other characters act while someone else is acting, and they do it in **two different
ways** — which is a change: this section used to describe one prompt built for both.

| Mode | Mechanic | How it reaches the player |
|---|---|---|
| Combat | **Reaction** | **Automatic.** Nobody is asked. One per trigger; redirection resolves before reduction (core-rules §3) |
| Scene | **Help** | **A prompt.** One helper per check (+1, or +2 on a matching approach); the helper shares the consequences on a failure |

### 6.1 Reactions are not a prompt

A reaction fires by itself, the card goes to the discard, and the chat card says what answered. There
is no dialog, no countdown and no Pass button, and `reactionTimer` is gone with them.

What a prompt would have cost is the reason: **20 seconds × party size, per attack**, with a shared
timer, two steps, concurrent declarations, and a rule for a player who has disconnected. All of that
was specification for asking a question whose answer is usually obvious and always small.

**The decision moved to a card turned sideways** (core-rules §3). A reserved card will not react; it
still counts toward your hand and both halves still play. In the tray that is the **⚡ row itself** —
the row that says what the card would do is the button that stops it doing it:

```
┌─────────┐ ┌─────────┐ ┌─────────┐    ┌─────────┐
│ STRIKE  │ │ SHIELD  │ │ ADVANCE │    │ ADVANCE │  <- turned sideways,
│ P Str 4 │ │ P Def 2 │ │ P Mov 3 │    │ R Side  │     rotated in its own slot
│ S [Mov1]│ │ S [Mov1]│ │ S [Mov2]│    │  held   │
│ R Parry │ │ R Block │ │ R Side  │    └─────────┘
└─────────┘ └─────────┘ └─────────┘
```

- A card with no printed reaction reads **Brace**, because that is what it is.
- A reaction a **drawback** has taken away is greyed in place, never hidden — Plate takes the
  Sidestep, and a player who cannot see what it took will believe it took nothing.
- Hovering the row says what fires it and what it costs.

**The count is public.** How many upright cards a character holds goes beside Stunned and Dazed as a
flag, for the same reason hand size is public (§7): with reactions automatic it is the most
informative number on the board — it says precisely how much defence that character has left, which
is what a Bodyguard, a *Help* and a focus-fire decision all turn on.

### 6.2 Help still asks

*Help* keeps the prompt: it is a genuine choice with no automatic answer, the helper takes on real
consequences, and it happens while the GM is narrating and nothing is pending. The same component,
without the timer — scene mode never had one by default.

---

## 7. Visibility

Each player's tray renders their own owned character. What others see:

| Private | Public |
|---|---|
| Hand contents | Hand **size** |
| Skill hand contents | Skill hand size |
| Secret slate contents | Number of secret slates held |
| Fate deck order | Fate count and face-up discard |
| | Health, Block, conditions (with creator), draw/discard/Spent counts, Wound and Taint counts, rest tokens |

Hand size and deck state must be public: *Bodyguard*, *Help* and *Stabilize* all require knowing
whether an ally can still act.

### GM tray

The GM sees a different thing entirely:

- **Intent cards**, face up — one per NPC type, this round.
- **One fate deck per NPC type**, each with its own count and face-up discard. Players therefore get
  a per-type risk readout — *the archers' deck is down to four, they are due a swing* — which is more
  tactical information, not less.
- The **twist deck**, for partials and failures.
- NPC health and conditions.
- **Challenge track controls**.

#### Intent cards auto-flip

Players see one face-down card per enemy type. The moment the first NPC of a type acts, that card is
public knowledge anyway — so the system flips it automatically rather than relying on the GM.

This is what makes **Foresee** cleanly valuable only when the enemy acts late in the order, which is
the intended design (core-rules §3).

---

## 8. What stays on the sheet

Deck building, full inventory and slot management, features, injuries, rests and Spent-card recovery,
Wound and Taint detail, levelling. None of it changes moment to moment.

---

## 8a. The level-up pane  **[BUILT 2026-11-01]**

A level-up is **navigational rather than a menu** ([../rules/leveling.md](../rules/leveling.md) §3)
— you are not picking a prize, you are picking a direction — so the interface is the map. A button
on the character sheet opens it; the graph fills the pane, scrollable and zoomable, and a side panel
reads out whatever is marked.

**It opens whether or not there is a level to spend.** §2 of the levelling rules says *the GM says
when*, so the button cannot be a thing a player presses to grow. The GM grants a level
(`system.levels.pending`) and only then does Accept light up; before that the pane is a **map and a
planner**, which is the only way to see what a branch costs before committing to its first node.

### 8a.0 Who says when

The GM, and now something can say it. A **+ / − pair beside the level readout on the character
sheet**, GM-only, raises and lowers `system.levels.pending`; `game.cardrpg.grantLevel(actor, n)`
does the same from a macro. Until this existed the pane's Accept button could never light up for
anybody, which made the whole feature a very pretty read-only map.

**Level and title are a readout on that sheet, never a field.** Both derive from the owned node
list, so there is nothing to type and nothing to keep in step.

> **[OPEN] The Way dropdown is the one seam left.** `system.way` is still stored and is still how a
> playtest character is set up, while the Ways a character has actually walked are derived from the
> nodes they own. It closes when character creation grants a Way node instead of setting a string.

### 8a.1 Four states, not two

| State | Paint | What it means |
|---|---|---|
| **Taken** | filled green | owned, and never un-owned |
| **Available now** | bright blue outline | on your frontier this level |
| **Possible later** | dim | not yet reachable, but nothing has closed it |
| **Closed for good** | greyed, red edge | an exclusive choice took it, or everything leading to it |

> **The last two look alike on a sheet and are nothing alike in play.** *Later* is a plan; *closed*
> is a door that shut behind you (§3, exclusive groups). A player who cannot see which is which
> cannot plan at all, which is why these differ in colour rather than in brightness.

A **crossing** is drawn dashed. A cross edge means something precise in the rules, and a reader
needs to see that a route is a crossing rather than the branch's own run.

### 8a.2 Marking, and changing your mind

Clicking an available node **marks** it. Marking another unmarks the first — one node, or none — and
the side panel shows what that node gives: its title and cell if it is a major one, its Signature and
Tactic, every grant as a line, what it opens, and what it closes. Clicking empty space clears the
mark. **Nothing is written until Accept**, so Cancel has nothing to undo.

Clicking a node that is *not* available says why rather than doing nothing: already yours, not on
your frontier yet, closed for good. A click that silently fails reads as a broken window.

> **The detail panel is written in place rather than re-rendered.** A re-render rebuilds the canvas
> and throws away the player's pan and zoom — at exactly the moment they were comparing two nodes.

### 8a.1a What the pane looks like  **[BUILT 2026-11-01]**

169 nodes in one colour is one grey mass, and the fix is not prettiness — it is that **colour meant
state and nothing meant Way**. A player could see which nodes they could take and not where in the
game they were, and those are different questions. They now use different channels:

| Channel | Says |
|---|---|
| the **fill** | which Way you are looking at |
| the **border** | what you can do about it |

That is the same split the cards use, where the rim says what a thing belongs to and the face says
what it does.

> **Four territories.** A compound parent per Way, labelled, sizing itself around its children — so
> nothing is laid out twice and the Way's name sits where the player is already looking rather than
> in a legend they have to find. A territory is scenery: tapping one picks nothing.

**A closed node is drained of its colour rather than painted a different one**, because a closed
Shade node should still look like a Shade node you cannot have. Owned is lit from inside, available
wears a bright ring, later is dimmed, and the tentative gold ring is unchanged.

**An edge takes its colour from where it arrives**, so a branch reads as one colour rather than a
gradient — and an edge with both ends owned is brighter, because that one is your history.

**A node wears the art of what it hands over**, not art of its own: what a node GIVES is the thing
worth looking at, so a title shows its Signature's picture. Nothing to show stays blank.

### 8a.2a Prune: the reward that asks back

Most rewards are taken in silence, because most of them are numbers. A **prune** is not: §4 of the
levelling rules calls it *remove one card from a deck, permanently*, and only the player knows which
card has gone dead. So Accept on a node granting one opens a second, smaller question — the deck's
cards by name, with duplicates counted, because *which* of your three Strikes is not a question.

Two rules sit on it. It can only ever remove an **action** card, so a Wound or a Taint is never on
the list — those are not yours to drop (§4, bound Taint). And the **deck minimum is checked before
the question is asked** rather than after it is answered: a prune is the only reward in the game
that can make a character illegal.

> **[OPEN] It deletes a Card document, which a player may not be allowed to do.** The same solo-GM
> assumption the tray carries. GM-side resolution is the standing prerequisite for both.

### 8a.3 The one click that asks twice

Accept takes the node. For an **exclusive** node it first names what that shuts, by name, including
everything reachable only through it. That is the one irreversible level-up in the game (§3 — the
only thing that makes a frontier shrink), and accept-or-cancel is not a strong enough question for
it. Everything else can be had later, and is therefore just Accept.

### 8a.4 Layouts

Five, from a picker: **Tiers** (the default), Breadth-first, Concentric, Force, Grid.

Tiers is ours and is the only one that knows what this graph is. Depth is already computed from the
edges, so the layering is free and every edge points the same way — which a force layout will not
promise, and a graph that puts a title above its own trunk is unreadable. Within a layer, nodes are
ordered by the mean position of their predecessors, twice over: the cheap half of crossing reduction,
and enough for a graph this size.

> **Cytoscape is vendored (364 KB) and the dagre extension is not.** Dagre would do slightly better
> at crossing reduction for another 280 KB — at the one job the data already told us how to do,
> since `DEPTH` is computed from the edges either way. The library is also loaded on **first open**
> rather than at world boot, so a client that never opens the pane never pays for it.

### 8a.5 What it refuses to get wrong

**Adjacency is not eligibility.** A node touching one you own may still be unavailable:
`after[]` is any-one-of, `all` makes it every-one-of, and an exclusive family closes its rivals.
One function decides (`canTake`), and the paint and the Accept path both call it — so a node the
pane offers is a node the engine accepts. Painting the frontier from adjacency would have offered
level-ups the rules refuse, which is the same mistake as every other *prose is not a rule* case in
this project, in pixels.

## 9. Open

- **Swing-percentage toggle** (§4.2): default on or off.
- **[DONE 2026-11-01]** Feature and item grants create slates, and all twelve of Way of Shade's
  Signatures exist as content for a node to point at. The pane prints the Signature and the
  Tactic with its text, and a Signature the engine cannot work out says so
  ([../rules/way-cards.md](../rules/way-cards.md) §2.2).
- **[OPEN]** **Spell** grants still create nothing: a formula is a slate like the others, but no
  node in the built graph grants one and Way of Mind's schools are not authored. Way of Shade's
  *Half-mage* grants slots rather than formulas, which is the node working as written.
- **[OPEN]** Nothing has run the pane in Foundry. Two failure modes were fixed by reading rather
  than by playing — a window id shared between two actors, and a Cytoscape container with no height
  — and that is not the same as having seen it work.
- **Touch and small screens.** Five cards plus two panels is tight below about 1000 px.

Card layout is settled in [card-layout.md](card-layout.md), including the bonus-group border that
the tray has to enforce at resolution time (§4.4 there).
