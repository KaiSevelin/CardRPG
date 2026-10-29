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
│ PRIMARY: Strike <- Longsword, Leather Armor                      │
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
the slates assigned to that half. Primary on the left, secondary on the right. A stack stands
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

Discard and Spent reuse the two cost icons on purpose: a Strain cost and the Discard link mean the
same pile, and a Spent cost and the Spent link mean the same pile.

**Spent is absent entirely when nothing is Spent**, so it appears exactly when it starts to mean
something. Fate and Discard are always there, because a count of zero is itself worth reading.

---

## 4. The two numbers that carry the tension

### 4.1 Draw pile - a bar, not a number

Simulation says the deck runs dry in 89% of four-goblin fights and the hero stops to Catch Breath in
most of them ([../sim/analysis-2026-10-27.md](../sim/analysis-2026-10-27.md), finding 2). That
countdown *is* the drama: reactions cost cards, and a turn spent breathing is a turn not spent
fighting. It gets a depleting bar with the count beside it.

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

## 5. Scene tray

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

## 6. One interject system, used twice

Both modes let other characters interrupt the acting character:

| Mode | Mechanic | Rules |
|---|---|---|
| Combat | **Reaction** | One per trigger; several characters may each react; **redirection** resolves before **reduction** (core-rules §3) |
| Scene | **Help** | One helper per check (+1, or +2 on a matching approach); the helper shares the consequences on a failure |

Build one prompt and use it for both. The prompt:

- goes to the **owner** of each eligible character, not to everyone;
- lists only **legal** options — Stunned blocks all reactions, Heavy Armor blocks Sidestep, Brace is
  always available;
- has an explicit **Pass** button;
- never appears at all when nobody is eligible, so an exhausted or empty-handed party costs no time.

### 6.1 The reaction timer

A reaction prompt runs on a **countdown with a progress bar**. When it expires, the character
**passes**.

```
┌─ REACTION ─ goblin 3 strikes you for 3 ──────────────────┐
│  [############........]  7s                              │
│                                                           │
│  Parry   (Strike card)      reduce by 2                  │
│  Block   (Shield Up)        reduce by 3                  │
│  Brace   (any card)         reduce by 1                  │
│                                              [ Pass ]     │
└───────────────────────────────────────────────────────────┘
```

**Setting: `reactionTimer`**, in seconds. Default **20** — long enough to read five cards, short
enough to keep a round moving. **0 means no timer**: the prompt blocks until everyone answers, which
is correct by the rules and suits a table that is all present and talking.

Behaviour:

| Case | Rule |
|---|---|
| **Several eligible characters** | **One shared timer per step.** Everyone eligible in that step declares concurrently. Serial per-character timers would cost 20s × party size per attack. |
| **A redirection is available** | Two steps, so up to two timers (see §6.2). |
| Player answers early | Their prompt closes at once; the timer keeps running for the others. |
| Everyone answers early | Timer ends immediately and resolution proceeds. |
| Foundry is paused | Timer pauses with it. |
| GM override | The GM can resolve or extend the prompt at any time. |
| Nobody eligible | No prompt, no delay. |

The bar is the point: a bare number invites haggling, a draining bar communicates that the round is
moving. Players who want to deliberate should raise the setting rather than stall the prompt.

**Scene mode has no timer by default.** *Help* happens while the GM is narrating and nothing is
pending, so a countdown there only adds stress. The same prompt component is used, with the timer
disabled.

### 6.2 Two-step prompts

Reactions resolve in two steps because redirection changes who is being hit (core-rules §3). The
prompt follows suit:

1. **Redirection step** — offered only to characters that *have* a redirecting reaction available,
   such as a *Bodyguard* adjacent to the target. Skipped entirely when nobody qualifies, which is the
   common case.
2. **Reduction step** — offered to whoever is the target *after* step 1 resolved. If a Bodyguard
   intercepted, the prompt goes to the Bodyguard, not the original target.

Each step gets its own timer. A character that spent its reaction redirecting is not offered the
reduction step, since one reaction per trigger covers both steps.

The practical effect: the original target is never asked to spend a card against a hit an ally is
about to take for them.

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

## 9. Open

- **Swing-percentage toggle** (§4.2): default on or off.
- **Touch and small screens.** Five cards plus two panels is tight below about 1000 px.

Card layout is settled in [card-layout.md](card-layout.md), including the bonus-group border that
the tray has to enforce at resolution time (§4.4 there).
