# Card and slate schema

The data model for everything that isn't an actor. Actor state is in
[actor-schema.md](actor-schema.md); faces are in [card-layout.md](card-layout.md); the icon set is
[../rules/icons.md](../rules/icons.md).

---

## 1. Document mapping

The rules split these by behaviour, and that split *is* the document mapping (core-rules §1):

| Rules term | Behaviour | Foundry |
|---|---|---|
| **Card** | Lives in a deck. Shuffled, drawn, played, discarded. | `Card` subtypes |
| **Slate** | Laid out face up. Never shuffled, never drawn. | `Item` subtypes |

Both `Card` and `Cards` support document subtypes with a `TypeDataModel` on `system`, so every card
kind below is a native typed document and ships in compendium packs.

| `Card` subtypes | `Item` subtypes |
|---|---|
| `action`, `fate`, `skill`, `twist`, `npc`, `wound`, `taint` | `item`, `feature`, `injury`, `secret` |

### Deck validation

An action deck holds **12–20** cards, the maximum raised by feature slates (core-rules §8); a skill
deck holds **12 or more**, uncapped (skill-rules §8). **Wounds and Taint don't count** toward either,
so validation counts only the playable subtypes.

### Copies are documents, not a count

A starter deck is **a prebuilt `Cards` document** shipped in a compendium, so "3× Strike" is three
`Card` documents. No `copies` field anywhere — the deck is the recipe.

---

## 2. Shared shapes

### 2.1 A step

Both action-card halves and NPC card sequences are ordered lists of **steps**. One step is one icon
with its number:

| Field | Notes |
|---|---|
| `icon` | An icon key (§5) — `sword-wound`, `run`, `shield-reflect`, … |
| `mod` | A **signed** number: a modifier (`+1`). Mutually exclusive with `param` |
| `param` | A **bare** number: a parameter (Move 3, Range 4, Blast 1) |
| `extra[]` | Further icon+number pairs on the same step: range, area kind |
| `text` | A few words, only for what icons can't express (*Taunt*, *Parry*) |

Sign distinguishing modifier from parameter is a layout rule (card-layout §1.3) and it belongs in the
schema too, so a face can render without a second convention.

### 2.2 An active ability

Carried by `item` and `feature` slates (core-rules §4, *Active abilities and recharge*):

| Field | Notes |
|---|---|
| `active.text` | What it does, one short line |
| `active.recharge` | A **number of turns**, or `combat` / `shortRest` / `longRest` |
| `drained` | Boolean, stored |
| `drainedFor` | Turns remaining, stored, only while a numeric recharge counts down |

**At most one active ability per slate** — a sideways slate must be unambiguous.

### 2.3 A bonus group

Carried only by slates that grant a **numeric bonus** (core-rules §5):

| Field | Notes |
|---|---|
| `group` | `body` / `training` / `tool` / `make` / `power` / `station` / `wonder`, or null |

Null is the common case: a weapon supplying a base value is not a bonus, and neither is a feature
that grants advantage or a flat trait. **One slate, one group** — a border is one colour.

---

## 3. `Card` subtypes

### `action`

| Field | Notes |
|---|---|
| `primary[]`, `secondary[]` | Steps (§2.1). Either may be empty on a Wound-like card |
| `reaction` | A reaction key (`parry`, `block`, `sidestep`, `use`) or null |
| `way`, `tree` | Reserved — which Way's list it belongs to. **[OPEN]**, waits on the Way trees |

Never grouped, never has an informative back, never has a recharge. Prose goes in the document's
description, read on the sheet.

### `fate`

| Field | Notes |
|---|---|
| `value` | −2 … +2, or `miss` / `critical` |
| `temporary` | Boolean. **Load-bearing**: *Blessed* and *Cursed* shuffle in temporary copies that the rules remove when drawn, which is impossible if they look and read identically to the permanent ones |

The deck is a fixed 20: 1 Miss, 1 −2, 4 −1, 8 ±0, 4 +1, 1 +2, 1 Critical.

### `skill`

| Field | Notes |
|---|---|
| `approach` | `might` / `agility` / `shadow` / `wits` / `lore` / `presence` / `any` |
| `value` | 1–3 |
| `edge` | One short sentence, or null |
| `way`, `tree` | Reserved, as `action` |

`any` is the wild approach on Inspiration cards. Never grouped — approach colour is a *header* tint,
never a border (card-layout §4.3).

### `twist`

| Field | Notes |
|---|---|
| `twist` | `noise` / `time` / `gear` / `strain` / `hurt` / `arrival` / `secret` / `opening` |
| `prompt` | A few words — *"Who hears it?"* |

The 30-card deck is weighted (5 Strain, 4 each of Noise/Time/Gear/Arrival/Opening, 3 Hurt, 2 Secret),
and ships as a prebuilt `Cards` document.

### `npc`

| Field | Notes |
|---|---|
| `kind` | The creature type that owns this deck |
| `sequence[]` | Steps (§2.1), **numbered on the face** — order is the entire content |

The **only** card subtype with an informative back: it shows the type name, which is what gives
*Foresee* something to reveal (card-layout §3).

### `wound`

No fields. Fixed text, fixed face, always in the action deck. Takes the standard action-card back —
being indistinguishable in the draw pile is the point.

### `taint`

| Field | Notes |
|---|---|
| `flavour` | `body` (poison, disease → action deck) or `mind` (dark magic, horrors → skill deck) |
| `source` | What inflicted it. Feeds the affliction list — **[OPEN]**, waits on the world |

One subtype with a flavour field, not two subtypes; the flavour picks the face.

---

## 4. `Item` subtypes

### `item`

| Field | Notes |
|---|---|
| `slot` | `hands` / `body` / `belt` / `pack` |
| `hands` | 1 or 2 — a two-handed item fills both hand slots |
| `tags[]` | `heavy`, `light`, `melee`, `ranged`, `thrown`, `arcane`, `shield`, `armor`, `consumable` |
| `weight` | Whole kilograms. 0 for anything under a kilo |
| `value` | Gold |
| `verbs` | `strike` / `cast` / `defend` / `use` → `{ value, range?, area?, areaKind?, text? }` |
| `skill[]` | `{ approaches[], bonus, situation }` — a tool's skill line |
| `armor` | Flat value, always on (Leather Armor: 1) |
| `consumed` | Boolean — gone when used, the far end of the recharge scale |
| `group` | §2.3 — present only if it grants a bonus |
| `active` | §2.2 |
| `npcGear` | Boolean. **NPC gear is tuned separately from player gear** (core-rules §9), so it must not leak into shops or player pickers |
| `kind`, `blurb` | Back-face fields: type word, one-sentence description |

`weight` and the **heavy / light tags are independent**. Weight is what a thing costs to haul; the
tags are how it handles when wielded, and *Strong* reads the tags. Neither derives from the other.

### `feature`

| Field | Notes |
|---|---|
| `text` | One short line |
| `group` | §2.3 — null for anything granting advantage or a flat trait |
| `active` | §2.2 — present makes it an active feature, absent leaves it passive |
| `carry` | Bonus to the carry allowance, if any (core-rules §4) |

Passive or active is the pricing dial: passive effects stay small, anything that would swing a fight
takes a recharge.

### `injury`

| Field | Notes |
|---|---|
| `text` | The penalty |
| `permanent` | Boolean — ideas.md has lasting injuries that heal after days of rest, as well as permanent ones |

**Never grouped.** The group system caps bonuses; an injury is a penalty.

### `secret`

| Field | Notes |
|---|---|
| `subject` | Who it concerns — an actor reference |
| `text` | The secret |
| `about` | `npc` (players hold it as leverage) or `character` (the GM holds it against a player) |
| `spent` | Boolean — playing a secret uses it up |

An `about: character` secret lives on a character but sits in the **GM tier** (actor-schema §7.1):
data on a PC that its own player must not see.

---

## 5. The icon enum

Keys are the **kebab-case game-icons filenames**, so the filename doubles as the enum key and no
mapping table is needed: `sword-wound`, `all-seeing-eye`, `boot-prints`, `charging`.

[../rules/icons.md](../rules/icons.md) is the source of truth for the list — 50 entries in three
tiers. Don't copy them here; the two would drift.

**Icons are data, not decoration.** Conditions and features switch off individual icons at runtime
(core-rules §10), so the engine tests against these keys and faces render from them. That is why
there is no `image` field on an action card.

---

## 6. Deck topology

Foundry's Cards API has three kinds — **deck**, **hand**, **pile** — and gives native shuffle, draw
and pass. Use it as intended rather than modelling piles as fields:

| Owner | Documents |
|---|---|
| **Character** | action deck, action hand, action discard, action Spent · fate deck, fate discard · skill deck, skill hand, skill discard, skill Spent — **10** |
| **NPC type** | action deck, action discard · fate deck, fate discard · intent — **5** |
| **World** | twist deck, twist discard — **2** |

**Discard and Spent must be separate piles.** They behave differently: Catch Breath shuffles the
discard back, and Spent cards survive it until a rest. Flagging cards inside one pile would mean
filtering on every shuffle.

Ten documents per character is a lot — five players is fifty-odd `Cards` documents in a world. That
is the cost of native card movement, and it is worth paying; but know it going in, and if it becomes
a problem the fate pair is the one to collapse first, since fate is drawn and discarded with no hand
and no Spent.

### What belongs to a type, not an actor

Per core-rules §3, §6 and §9, an NPC's **action deck, fate deck and intent card all belong to its
type**. Five goblins reference one of each. Give each type one `Cards` set and have the actors point
at it, or you will draw five intents and the mechanic collapses.

---

## 7. Compendium packs

Card addition through compendiums is a requirement, so the packs are part of the design:

| Pack | Type | Notes |
|---|---|---|
| `action-cards` | Card | Grouped by Way once the trees exist |
| `skill-cards` | Card | Same |
| `fate-deck` | Cards | The fixed 20, as a prebuilt deck |
| `twist-deck` | Cards | The weighted 30 |
| `starter-decks` | Cards | Prebuilt Warrior deck, generic skill deck |
| `npc-decks` | Cards | One deck per creature type |
| `items` | Item | Player gear |
| `npc-gear` | Item | Separately tuned; kept out of player pickers |
| `features` | Item | |
| `injuries` | Item | |
| `backgrounds` | Item or JournalEntry | Five parts each; **[OPEN]** which document type |
| `npcs` | Actor | Statblocks, each pointing at its type's decks |

---

## 8. Open

- **Character creation flow** — deferred until after the first playtest (core-rules §12). Until then
  the sheet needs no creation wizard: ship the starter Warrior as a prebuilt Actor in a compendium
  and let the GM copy it.
- `way` / `tree` on cards, `level` and `specialization` on characters: all wait on the Way trees.
- Whether `backgrounds` are Items or JournalEntries.
