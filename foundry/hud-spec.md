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
┌─ EQUIPPED ────────────────────────────────────────────────────────┐
│ Hand  Longsword     Strike 3  Defend 1                           │
│ Hand  Wooden Shield Defend 2                                     │
│ Body  Leather Armor armor 1                                      │
│ Belt  Healing Potion Heal 4      Belt  --                        │
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
4. Both cards go to discard.

Dazed removes step 2 entirely — primary only. Exhausted likewise, and also disables reactions.

### 3.5 A slate is played, or it is not

Slates have no buttons. Items and active features sit in two groups — **not in play**, which shows
when you open the deck, and **in play**, which stays on the scene — and clicking the card moves it
between them. An item in play is equipped; a feature in play is Drained. A passive feature belongs to
neither group and cannot be clicked: it is simply true.

A card says the verb and the item says the value, so a longsword that both strikes and defends is
ambiguous the moment both halves are staged. That is the one case the two states cannot express, so a
slate that could modify **more than one action** has a third:

| Click | State | Means |
|---|---|---|
| 1 | **primary**, stamped across the face | It serves the primary half |
| 2 | **secondary** | It serves the secondary half |
| 3 | out of play | — |

A slate with a single verb has nothing to choose and keeps two states. When resolving a half, the
item stamped for that half wins; then a single-verb item; then anything else in play, highest value
first. So a longsword on the primary and a shield on the secondary strike and defend respectively,
with nothing to configure beyond the clicks that put them there.

Entering or leaving play is the equip, and inside a combat it costs a **Ready** — doing it under
pressure is the whole reason the verb exists. Moving between halves is not an equip and is free.

### 3.6 Catch Breath

A distinct modal, because the rules require a choice over a pile the player cannot otherwise see:
shuffle discard into draw, **then pick 1 card from the shuffled pile** to set aside as Spent, which
stays out until a rest. The modal shows the full new draw pile to choose from.

---

## 4. The two numbers that carry the tension

### 4.1 Draw pile - a bar, not a number

Simulation says the deck runs dry in 89% of four-goblin fights and the hero stops to Catch Breath in
most of them ([../sim/analysis-2026-10-27.md](../sim/analysis-2026-10-27.md), finding 2). That
countdown *is* the drama: reactions cost cards and Catch Breath shrinks the deck permanently. It gets
a depleting bar with the count beside it.

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
  question on the slate itself instead, by stamping it primary or secondary (§3.5); whether that
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
