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

#### `text` was carrying the game  **[MEASURED 2026-11-02]**

**Of 361 steps, 127 carried prose** `-` and a step that is only prose used to do *nothing at all*
when played. `case ""` in the tray broke out of a switch that
is the end of the method: no effect, no prompt, not a line in chat. The branch below it already
announced any verb the engine did not recognise, so the arrangement was exactly backwards `-` **a
step with a made-up verb reached the table and a step with a blank one was discarded.** The
schema's `initial: ""` on `verb` is what hid it, because content omits the key and the data model
fills it in.

> **The denominator moved on 2026-11-07 and the numerator did not.** The sweep read 340 steps when
> it was run; writing a second starter deck (`SHADE_DECK`, ten designs) added **21**, and **not one
> of them carries prose** -- it was built from the Warrior deck's own steps, which had already been
> through this. So 127 is still the count of steps that carried prose, measured against a game that
> is 21 steps larger. The check reads the live sweep, which is why this sentence had to be edited
> rather than quietly left behind.

The prose turned out to be mostly not special actions. Grouped, 104 of the 127 fell into families
the designer had already named in the words of the prose itself:

| | steps | what it really was |
|---|---|---|
| `until your next turn` | 19 | `duration`, which existed but only beside a condition |
| `reaction:` | 9 | the `reaction` field, which existed |
| `Spent:` | 6 | `costs.*.spent`, which existed |
| `permanent:` | 9 | not a step at all `-` a passive grant wearing a step's clothes |
| `ritual:` / `out of combat:` | 11 | timing |
| gives an ally an action | 20 | one parameterised effect |
| puts something on the map | 8 | one parameterised effect |
| conjures something | 6 | one effect, two fields and a prompt |

So the structure is **fields, not a free-text special slot**. A free-text special would have made
every card that used it permanently unresolvable, which is the one thing this schema exists to
prevent.

#### The three fields that came out of it

| Field | Notes |
|---|---|
| `timing` | **When** the step may be played: `reaction`, `ritual`, `outOfCombat`, `beforeFight`, `permanent`. 31 steps carried this as a prefix on their prose |
| `delay` | Turns to wait before it happens. `2` is *at the start of your second turn after this*, which three steps said in prose `-` and a delayed effect the engine cannot see is one the table forgets, because the card is in the discard by the time it matters |
| `ground` | **What the step leaves on the map**: a `shape` (line, area, adjacent, whole map, one square), an `effects` list (cover, difficult ground, shadowed, impassable, a trap) and `damage` a turn. The condition a zone applies is the step's own. **Nothing places it** |
| `targets` | **Who the step is for**: `self`, `oneEnemy`, `enemiesInRange`, `oneAlly`, `alliesInRange`, `adjacentAllies`, `everyAlly`, `selfAndAllies`, `everyone`. Blank means one enemy, which is what every card has always meant by saying nothing |
| `oncePer` | How often it may be played: `fight`, `day`, `pactPerFight`. Three steps said it in prose |
| `ignoresArmour` / `ignoresBlock` / `ignoresCover` | All of it, where `ignores` above is a NUMBER of armour points. Block and cover are not armour, and core-rules 5 is explicit that `ignores` comes off armour and never off Block |
| `readDeck` | Whose fate deck a Read looks at: `own`, `other`, `target`, `all`. `foresee` had a number and never a target |
| `whileState` | A state of your own the step waits on: hand empty, both hands empty, exactly one card, hand and deck both empty, a thin deck, no ally near, spending a secondary. **Eleven steps, and whole builds rest on them** |
| `conjure` | `creature`, the roster creature a conjuration fixes (blank = the GM decides), and `upkeep`, what it costs per round it stands |
| `shape` | `transformation`: the transformation by name (content.mjs) |

**Conjuration is deliberately small, and smaller than the first attempt.** Six spells conjure, and
the content had already noticed they were one thing `-` *a god standing on the board and a corpse
standing on the board are one piece of work*, says the comment above The Great Bargain.

A first pass gave it five fields: `from` (corpse / god / creature), `name`, `count`, `side` and
`upkeep`. Three of those were the software holding opinions a table holds better `-` whether a body
is available to rise, how many of them are lying there, and whose side the thing fights on. **A
spell that has already said *a corpse within 2* does not also need the engine's view on whether
there is one.** So:

| | |
|---|---|
| **the source is prose** | *a corpse rises*, *a minor god becomes present*. The engine cannot see the floor; the table can |
| **the number is asked** | one prompt at play, in discussion with the GM, capped at 20 because a prompt is not a promise |
| **control is granted** | the conjurer gets **OWNER** on the actor, which is the only part of *under their control* that is not a sentence: a token the player cannot move is a conjuration the GM plays for them |
| **the creature may be fixed** | `creature` names one in the roster. Every conjuring in the game leaves it blank today, which is correct rather than unfinished |
| **the price is a rule** | `upkeep` is paid *per round it stands*, which The Grave's Bargain already printed: *one bound Taint per round they stood*. Announced rather than charged, because nothing knows yet when the thing falls |

A named creature resolves to its **compendium id**, since the pack ids are a hash of the pack and
the name `-` so the name *is* the id, and nobody writes sixteen characters of hash onto a card.

> **The GM still places them.** Where a conjured thing appears is a judgement about the map that no
> card can make: *within 2* is a region, not a square.

#### A transformation is a set added and a set taken away

A first pass lent you a roster creature's natural weapons and nothing else, which made **a bird that
still had hands**. A form that only adds is a costume. So a transformation is a thing in its own
right (`TRANSFORMATIONS` in content.mjs) with two halves:

| | |
|---|---|
| **`grants`** | items, features and action cards, by name. Every name is checked against the tables, because a form that grants a card nobody wrote is a form that silently gives nothing |
| **`quarantine`** | a **filter** `-` `slots`, `tags`, `kinds` select the player's items; `features` and `cards` name those by hand |

A filter and not a list, for the same reason the intent pool is a filter: a list would have to be
revisited every time somebody writes an item, and **a bird has no hands whatever is in the shop.**
The placeholder Doomfly takes the `hands` slot, which reaches 54 of the 166 items `-` every weapon,
shield and implement in the catalogue `-` and leaves armour and potions alone.

**Quarantine is movement, not a flag.** A `quarantined` boolean would have had to be respected by
every place that reads a slate, and there are more than ten of those across combat, grants,
resolution, the sheets and the tray; one of them would have been missed, which is the defect this
project keeps finding. Taking the slate **off the actor** makes it unusable everywhere at once with
no new reader anywhere, and its data is kept on the actor so that *put back* is literal. Action
cards move to a **quarantine pile**, which is the same idea in the medium cards already use `-` and
each card remembers which stack it came from, because a card taken from a hand belongs in that hand
and putting everything in the deck would shuffle somebody's turn away.

Ending one removes what it added and restores what it took. The two halves are written side by side
on purpose: **a mechanism that adds in one place and removes in another will eventually add more
than it removes**, and what is left behind is a player quietly holding a bird's mouth and their own
sword. It is ended by `game.cardrpg.endTransformation(actor)`, because nothing in this system owns
a timer that survives a reload `-` the card's `duration` is what the table reads.

> **What a transformation does not touch, deliberately.** Your **deck**, because the deck is the
> character in this game `-` a form that replaced it would be a different character wearing your
> name. Your **Health and conditions**, because a bear that has forgotten it was poisoned is a way
> out of a condition that no card should hand over for nothing.

#### Who a step is for

**The oldest assumption in the game, and nothing ever wrote it down.** A step targets an enemy,
because the first step anybody wrote was a Strike `-` and **29 steps affect allies** with no way to
say so. *An ally's next check cannot fail*, *every ally within 2 may play a second secondary*,
*adjacent allies gain your armor as Block*: the engine could not tell a blessing from an attack.

`targets` is on 32 steps now, which is the largest single conversion of these three increments.

**There is deliberately no field for what the ally gets.** Nine steps want one and want eight
different values between them `-` a second secondary, a whole turn again, Move at full value, an
extra reaction per trigger, fate twice, a check that cannot fail, a failure that becomes a Partial.
One value per card is a free-text special wearing an enum's clothes. **The uniform half is who; the
varied half stays prose.**

**114 steps still carry prose, 26 of them prose alone** `-` the same first number as before, which
is not a failure to make progress, and a second number that went **up** by five. That is honest
rather than a regression: `timing: "permanent"` was the only field on five of the Graven steps, and
it was a slot budget wearing a timing's clothes rather than a rule about when anything happens. Nine
teachings that are never prepared are features now, a feature is permanent by having no gate to
pass, and the word was retired `-` which left those five steps carrying what they always really
carried, a sentence. 22 steps lose a prefix to `timing`, and the five conjurings kept a sentence on
purpose. **What moved is the part that was a rule** `-` when a step may be played, what
it costs to keep a thing standing `-` **and what stayed is the part that was a judgement.** The
rest are the real one-offs: *one enemy is dead, no save, no fate draw, no roll of any kind*. They
now reach the table as a chat line instead of silence.

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

#### A spell carries neither

A spell slate has **no `bonus` and no `grants`**, and that is the law in §2.4 rather than an
oddity of this one subtype. A standing `grants` on a spell only ever described a permanent formula
that is never prepared, and by the law that content is not a spell at all.

The reason the bonus moved is that a bonus on the slate was invisible. The Graven line put +2 Strike on a sheet with
nothing on the token to say it was there, no duration, and no way to take it off. As a condition it
shows in the HUD, the condition's own key is the bonus group — so two tattoos on one verb cap
each other — and the removal question has an answer, which for `graven` is *nothing*
([conditions.md](../rules/conditions.md) §9.1).

So `stepField().bonus` is `{ verb, value, requiresTag }`, the same three questions an item's bonus
asks, and `conditionField().bonus` is where they land. The payload is on the **instance**, not on
the condition's config: +2 Strike with a Heavy item and +2 Strike flat are both Graven.

---

## 2.4 The law: three gates

> 1. **A bonus or penalty over a duration is a condition.**
> 2. **A thing that must be equipped or prepared is an item** — `item`, or `spell` for the
>    preparable kind.
> 3. **A thing usable without being equipped or prepared is a feature.**

Read as a definition of the three `Item` subtypes it says something stronger than it looks: **the
only thing that distinguishes them is the gate.** A bonus, a grant, a step, where a thing was taught
and at what rank — none of that is about equipping or preparing, so none of it belongs to one
subtype. The vocabulary is shared and the gate is the difference:

| Subtype | The gate | The field that is the gate |
|---|---|---|
| `item` | equip it | `equipped`, `equippedTo`, `slot` |
| `spell` | prepare it | `prepared` |
| `feature` | none — it is simply true | *(it has neither, and that is the definition)* |

**What the law moved.** Nine teachings were spells and are features: all seven of Tattoo Magic and
the two renunciations Asceticism's ladder ends in. None of them is ever prepared. They had been
spells because a spell was the only slate with a **step**, and a tattoo needs a step — the bonus
it gives rides on the `graven` condition, which is what ink in your skin is. That was the tail
wagging the dog, so a feature has a step now, and `source` and `strength`, because a school teaches
features too.

**What a feature cannot do is apply a timed condition**, and that falls out of the law rather than
being a restriction on top of it: a timed condition needs a moment to be applied at, and a moment is
what a feature does not have. A feature's permanent condition is **derived** in `activeConditions`
— gated on the condition's own `permanent` flag — which is why there is no grant-time hook
and nothing to clean up when the feature is deleted. A tattoo is on you because the tattoo is on you.

**`timing: "permanent"` is gone** with them. It never said when a step happens; it said *this formula
can never be prepared*, which is a slot budget in a timing's field. A feature is permanent by having
no gate to pass.

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
