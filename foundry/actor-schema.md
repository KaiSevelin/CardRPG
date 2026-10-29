# Actor schema

Actor-level state: everything on a character or NPC that **isn't** a card or a slate. Cards and
slates have their own schema in [card-slate-schema.md](card-slate-schema.md) and their faces in
[card-layout.md](card-layout.md); [../rules/core-rules.md](../rules/core-rules.md) §1 has the
distinction. Presentation splits between
the tray and the sheet per [hud-spec.md](hud-spec.md).

---

## 1. Two principles

### 1.1 Store the minimum, derive the rest

Most actor "stats" in this game are computed from cards and slates, not kept as numbers. Storing them
means they go stale the moment a slate moves.

| Derived | From |
|---|---|
| **Carried weight** | Σ item slate weights + cash ÷ 100 |
| **Weight allowance** | carry base + feature bonuses |
| **Encumbrance tier** | carried vs allowance |
| **Max health** | health base + *Tough* − 3 when Afflicted |
| **Armor** | the equipped body slate |
| **Hand size** | base 5 + *Quick* |
| **Action deck maximum** | base 20 + feature bonuses |
| **Action deck size** | counted from the deck, ignoring Wounds and Taint |
| **Exhausted** | can't refill to 2 cards from the draw pile |
| **Wounds, Taint (body/mind), Spent** | counted in the deck documents |
| **Afflicted** | total Taint ≥ 3, across both decks |
| **Passive score** | highest 👁 Wits value in the skill deck + 2 |
| **Slot occupancy** | which slates are equipped |

| Stored | Note |
|---|---|
| Current health | |
| Block | Transient; cleared at the start of your turn |
| Cash in gold | |
| Rest tokens remaining | |
| Carry base | Default 40 kg, so a monster can differ |
| Health base | |
| Conditions | Each with duration **and** creator |
| Way, background, name, biography, trainings, know-how | |

All derived fields belong in the DataModel's derived-data pass, so they recompute whenever a slate or
card moves.

### 1.2 Structure what the engine reads; prose what only humans read

One case is easy to get wrong:

| Field | Form | Why |
|---|---|---|
| **Trainings** | **Structured** — a list of tool-type keys | It changes a number: an untrained user caps a tool bonus at +1, so the tool picker must read it |
| **Know-how** | **Prose** | It names a *situation* ("among soldiers and in military matters"), which no engine can evaluate. A prompt for the GM |
| **Biography, appearance** | **Prose** | Tier 4 of the information model; unlimited, sheet only |
| **Tactic keywords** | **Structured** | The NPC AI and the advantage rules read them |
| **Motivations** | **Prose + a flag** | The text is for the GM; `revealed` is mechanical (§4) |

---

## 2. `character`

### Vitals and resources

| Field | Stored / derived |
|---|---|
| `health.value`, `health.base` | stored |
| `health.max` | derived — base + *Tough*, −3 while Afflicted |
| `block` | stored, transient |
| `armor` | derived from the body slate |
| `cash.gold` | stored |
| `rest.tokens`, `rest.max` | stored (`max` starts at 1, rises with levelling) |
| `carry.base` | stored, default **40** |
| `carry.bonus`, `carry.max`, `carry.value` | derived |
| `actionDeck.base` | stored, default **20** (the maximum) |
| `actionDeck.bonus`, `actionDeck.max` | derived from features |
| `actionDeck.size` | derived — counted from the deck documents, **excluding Wounds and Taint** |
| `encumbrance` | derived enum: `unburdened` / `burdened` / `overloaded` / `immobile` |
| `handSize.base`, `handSize.max` | stored base 5, derived max |
| `exhausted`, `passive`, `afflicted` | derived |
| `wounds`, `taint.body`, `taint.mind`, `spentCount` | derived from the deck documents |

### Identity

| Field | Form |
|---|---|
| `way` | enum: `strength` / `shade` / `mind` |
| `specialization` | **[OPEN]** waits on the world and the Way trees |
| `background` | reference |
| `level` | **[OPEN]** waits on the levelling rules |
| `trainings[]` | structured tool-type keys |
| `knowHow[]` | prose situations |
| `biography`, `appearance` | prose |

### Slots

Capacities are fixed by the rules (core-rules §4) and split into two kinds:

| Kind | Slots | Changes |
|---|---|---|
| **Hot** | Hands 2, Back 1, Belt 2 | during a fight, paid for with Ready |
| **Worn** | Body 1, Cloak 1, Head 1, Neck 1, Fingers 2, Feet 1 | between fights only |

Plus an unbounded pack, limited by weight instead. `CARDRPG.slots` carries the `worn` flag and the belt's `freeEquip`. Occupancy is derived from which
slates are equipped, never stored.

An item carries **two** slot fields, and the split is content against state:

| Field | Means |
|---|---|
| `slot` | the default slot, and the only one for anything inflexible |
| `fits[]` | the other slots it will go in — content, the whole "what fits where" rule |
| `equippedTo` | which slot it is in **right now**; blank means `slot` |

`allowedSlots` derives `[slot, ...fits]`, and `equippedSlot` derives where it actually is — null
when it is not equipped. Anything asking "is this on my body" asks `equippedSlot`, never `slot`,
because a dagger's `slot` says `hands` while it hangs on a belt.

**There is no stowed state.** Unequipped means in the pack, the pack is always reachable, and
reaching into it costs a Ready. Everything an actor owns therefore counts toward carried weight —
there is nowhere to put a thing that is not on you.

### Conditions

An array of `{ key, duration, creatorId }`. The creator matters: a condition ticks at the start of
**its creator's** turn, or the victim's if the creator has left combat (core-rules §7). Foundry's
token status overlays can't carry that, so the HUD owns conditions.

**Two conditions are computed, not stored:** `Burdened` and `Overloaded` are present exactly when the
derived encumbrance tier says so. They appear in the conditions list like any other, but nothing
writes them — see §3.

---

## 2b. Drained slates

An active ability leaves its slate **Drained** until its recharge (core-rules §4). On a slate this is
two fields:

| Field | Form |
|---|---|
| `recharge` | a **number of turns**, or the boundary `combat` / `shortRest` / `longRest`. Absent on a passive line |
| `drained` | boolean, stored |
| `drainedFor` | turns remaining, stored, only while a numeric recharge is counting down |

**No new boundaries are needed.** Each of the three is one the system already handles: end of combat
(hand and discard return to the deck) and the two rests (Spent cards return). Hook the refresh onto
those.

A **numeric** recharge counts down at the start of the owner's turn — the same tick conditions already
use, so it costs no new machinery. It runs in combat rounds and challenge rounds; outside both it is
simply ready, so there is nothing to track while the party is walking around.

Only `drained` is stored; the rest is the slate's own definition. **Consumables have no recharge** —
they are deleted or decremented instead, which is the far end of the same scale.

## 3. Encumbrance is the one field with a transition hook

Every other derived field is passive: recompute and redisplay. Encumbrance **mutates card state**.

> Becoming **Overloaded** sets aside 2 random cards as **Spent**. Dropping below it returns them.

So the derived tier has to be *watched*, and crossing a threshold in either direction fires an
effect:

| Transition | Effect |
|---|---|
| → `overloaded` | Take 2 cards at random from the **draw pile** (from the hand if it's empty) and move them to Spent |
| `overloaded` → below | Shuffle those cards back into the draw pile |
| → `immobile` | Refuse the pickup; the load can't be taken at all |

Notes for whoever implements it:

- **Fire on transition, not on recompute.** The tier is derived and will be recalculated constantly;
  the card movement must happen once per crossing.
- **Dropping a load is free and never an action** (core-rules §4), so this can fire at any moment,
  including in the middle of someone else's turn.
- A player could cross the threshold back and forth to reshuffle their draw pile. It costs them being
  Overloaded each time, so it isn't worth guarding against — but don't be surprised by it.

---

## 4. `npc`

NPCs never exhaust, hold no hand, and need no rest tokens.

| Field | Form |
|---|---|
| `kind` | The creature type — this is what owns the deck (§5) |
| `health.value`, `health.base` | stored |
| `armor` | derived from gear, or stored flat for a creature with none |
| `gear` | equipped item slates, **tuned separately from player gear** (core-rules §9) |
| `tactics[]` | structured keyword keys: Pack Tactics, Skirmisher, Sniper, … |
| `targetPriority` | enum: `nearest` / `weakest` / `caster` / `lastAttacker` / `leader` |
| `socialTactics[]` | structured keys; some take a parameter (*Loyal to X*) |
| `motivations[]` | `{ text, revealed }`, 1–2 per important NPC |
| `faceUpReactions` | elite and boss NPCs keep 1–2 cards visible as reactions |
| `conditions[]` | as `character` |
| `carry` | optional; most NPCs don't need it |
| `phases` | **[IDEA]** boss phases, see [../rules/ideas.md](../rules/ideas.md) |

### `revealed` is mechanical

Motivations are normally hidden, and the rules give several ways to find them: a Wits check to read
the person, a card edge like *Sharp Eyes*, asking around beforehand, or a player simply guessing right
(skill-rules §5). So the GM needs to flip one to visible when the players earn it, and a revealed
motivation should then show on the player side as leverage they have established.

Secrets work the same way, in both directions: secrets the players hold about an NPC, and secrets the
GM holds about the players.

---

## 5. Two asymmetries worth knowing before you model it

**The fate deck isn't symmetric.** A player character owns their own 20-card fate deck, so it's a
per-actor document. An NPC's fate deck belongs to its **type**, not to the actor (core-rules §6) —
which is what makes Cursed and Blessed work on enemies, since a hex on the goblins must not touch the
ogre. So five goblins reference one fate deck, exactly as they reference one action deck.

**NPC decks and intent cards belong to the *type*, not the actor.** One card is drawn per NPC *type*
per round and every NPC of that type acts on it (core-rules §3, *Intent*). So five goblins
**reference** one goblin deck and one intent card — they must not each own a copy, or you'd draw five
intents and the whole mechanic collapses.

---

## 6. Presentation

| Tray — always visible | Sheet — on demand |
|---|---|
| Health, Block, conditions (including Burdened and Overloaded), Wound and Taint counts, rest tokens | Cash, carried weight against allowance, biography, appearance, trainings, know-how, full inventory, deck building |

Encumbrance costs **no new tray space**, because Burdened and Overloaded are conditions and the
conditions panel already renders them. The weight arithmetic belongs on the sheet, which is where you
look when deciding what to leave behind.

**Cash is the odd one out:** it's a stat *and* cargo, since 100 gold weighs 1 kg. Show the gold with
its weight contribution beside it, or players will wonder why their allowance moved.

---

## 7. Visibility

Foundry's permissions are **per document**: a user owns an actor or they don't. This game needs
**per field** — your hand is private while your hand *size* must be public. So visibility is the
system's job, not the platform's, and every field needs a tier.

### 7.1 A character has three tiers, not two

| Tier | Who | Fields |
|---|---|---|
| **Table** | Everyone at the table | Name, Way, background. Health and max health, Block, armor. Conditions **with their creator**. Hand **size**, draw / discard / Spent counts. Wound and Taint counts. Rest tokens. Encumbrance state. |
| **Owner** | The player, and the GM | Hand contents, skill hand contents, secret slate contents, fate deck order, cash, carried weight detail, biography |
| **GM** | The GM, **hidden from the owning player** | What NPCs know about this character, hidden Taint sources, anything planted on them |

That third tier is the unusual one. A player character carries data its own player must not see: the
rules have the GM holding secret slates *about* the players, to be played against them in social
challenges (skill-rules §5). So a `character` needs a GM-only area, not just a public/private split.

**Table tier is the default, deliberately.** Hand size, deck counts and conditions have to be public
or the party can't cooperate. **Cash is Owner** by default — whether the party sees each other's
purse is a table-culture question, so make it a setting rather than a decision.

### 7.2 An NPC has two tiers

| Tier | Fields |
|---|---|
| **GM** | Everything by default: health values, gear, deck, tactic keywords, target priority, unrevealed motivations, secrets, unflipped intent cards |
| **Revealed** | Whatever the players have earned or observed |

### 7.3 One reveal flag, four uses

The same `revealed` mechanism covers everything players can learn about an enemy:

| What | Revealed when |
|---|---|
| **Intent card** | The first NPC of that type acts — automatic (core-rules §3) |
| **Motivation** | A Wits check, a card edge, asking around, or a player guessing right (skill-rules §5) |
| **Tactic keyword** | It fires. A tactic is meant to give players something to play against, which requires knowing it |
| **Secret** | Investigation, a Wits or Shadow check, downtime contacts, the *Secret* twist |

Build it once. Revealing a tactic the moment it fires is the same operation as flipping an intent
card, and it turns "wolves get advantage when they surround you" from GM bookkeeping into the
counter-play the rules intend.

### 7.4 NPC health should be visible

**Recommended: show it, with a GM setting to hide it.**

The rules lean on players reading enemy health. *Cowardly* triggers below half, and it is listed with
the counter-play "let it run, or chase for the loot" — which a player cannot judge blind. *Weakest*
target priority means the GM is reading health anyway. And the system is already built on open
information: the fate discard is face up, intent cards auto-flip. Hidden hit points would be the one
place the game turns opaque, for no mechanical gain.

### 7.5 Why this is easier here than in most systems

Two existing rules do most of the work:

- **NPCs never draw fate in an opposed check** (skill-rules §2) — the player always draws. So the GM
  almost never rolls hidden, and there is little secret randomness to present.
- **Each NPC type has its own fate deck** with a face-up discard, so enemy luck is as public as the
  party's.

What remains hidden is **intent and knowledge** — what the enemy is about to do, what it wants, what
it knows about you — which is exactly what the game wants hidden, since Foresee, Wits checks and
secrets are all built to buy it back.

### 7.6 How it renders

One sheet per subtype, with fields rendered conditionally on the viewer's role — not a second sheet
per tier, which would drift. Three checks: is this the GM, is this an owner, is this anyone else. The
tray is already per-user (hud-spec §7); the GM's tray is the GM panel.

Foundry's **Limited** ownership level is useful for an NPC the players have studied: it shows a
cut-down sheet carrying only the revealed fields.

## 8. Open

- `specialization` and `level` both wait on the world and the levelling rules.
- Whether `rest.max` is stored or derived from level — depends on the levelling rules.
- Whether NPCs ever need `carry` (a pack animal, a creature hauling loot away).
