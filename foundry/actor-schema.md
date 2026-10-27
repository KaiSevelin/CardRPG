# Actor schema

Actor-level state: everything on a character or NPC that **isn't** a card or a slate. Cards and
slates are their own documents — see [card-layout.md](card-layout.md) for their faces and
[../rules/core-rules.md](../rules/core-rules.md) §1 for the distinction. Presentation splits between
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

Capacities are fixed by the rules — Hands 2, Body 1, Belt 2 — plus an unbounded pack now limited by
weight instead. Occupancy is derived from which slates are equipped, never stored.

### Conditions

An array of `{ key, duration, creatorId }`. The creator matters: a condition ticks at the start of
**its creator's** turn, or the victim's if the creator has left combat (core-rules §7). Foundry's
token status overlays can't carry that, so the HUD owns conditions.

**Two conditions are computed, not stored:** `Burdened` and `Overloaded` are present exactly when the
derived encumbrance tier says so. They appear in the conditions list like any other, but nothing
writes them — see §3.

---

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

## 7. Open

- `specialization` and `level` both wait on the world and the levelling rules.
- Whether `rest.max` is stored or derived from level — depends on the levelling rules.
- Whether NPCs ever need `carry` (a pack animal, a creature hauling loot away).
