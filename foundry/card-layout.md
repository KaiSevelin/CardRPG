# Card and slate layout

How every printed face is laid out, for both the paper playtest and the rendered Foundry faces.
Rules live in [../rules/](../rules/); the icon set is [../rules/icons.md](../rules/icons.md).

Faces are **rendered from card data**, never stored as finished images, because conditions and
features switch off individual icons at runtime (core-rules §10).

---

## 1. Three principles

### 1.1 One scan column

The question a player asks a hand is not "what does this card do?" but "which card has a Strike
primary?" That is a *search*, and search wants every card's answer in the same place.

Every type puts its scan target in the **top-left, running down the left edge**:

| Type | Scan target |
|---|---|
| Action card | The three half-icons, stacked |
| Skill card | Approach icon + value |
| Fate card | The number |
| NPC card | Creature type |
| Slates | Name, then the verb/bonus lines |

This also survives overlap. Fan five physical cards in one hand, or squeeze the tray below about
1000 px, and what stays visible is a vertical strip of each card's left edge. Put the icons there and
a crowded hand still reads completely.

### 1.2 Structure signals type before any text is legible

You should know what kind of card you are looking at from across the table, at thumbnail size:

| Structure | Type |
|---|---|
| Three horizontal bands | Action card |
| One huge centred glyph | Fate card |
| Icon + number header, text below | Skill card |
| Numbered sequence | NPC card |
| Inverted — dark face, light text | Harmful: Wound, Taint, injury |
| **No bands at all** | Not playable |

That last row does real work: the *absence* of the three-band structure is how a Wound announces it
cannot be played. Nobody should have to read "can't be played" off a card that visibly has no halves.

### 1.3 Sign distinguishes a modifier from a parameter

Numbers sit inline to the right of their icon, on the same baseline — not as corner badges, which
die at 16 px.

> **A signed number is a modifier. A bare number is a parameter.**

`Strike +1` is a bonus. `Move 3`, `Range 4`, `Blast 1` are parameters. One visual language, scales
down cleanly, no second convention to learn.

---

## 2. Information tiers

Long prose never appears on a printed face. Four tiers, and **tier 4 is the only place prose lives**:

| Tier | Where | Holds | Length |
|---|---|---|---|
| **1 Row** | The tray's equipped row | `Longsword  Strike 3  Defend 1` | One line |
| **2 Front** | The face you play from | Slot, tags, verb lines, bonus lines | Icons and numbers |
| **3 Back** | Flip side of a slate | Short description, value, type | One sentence |
| **4 Entry** | The sheet | Full text, lore, edge-case rules | Unlimited |

This is a hard constraint, not a guideline. It erodes one special case at a time otherwise.

---

## 3. Backs

**Only unshuffled things may have an informative back.** Anything drawn face down needs
indistinguishable backs or the pile leaks information.

| Uniform back required | Why |
|---|---|
| Action, fate, skill, twist cards | Drawn blind |
| **Wound and Taint** | Shuffled *into* the action deck, so they must be indistinguishable from real cards — the unpleasant surprise is the point |

| Back is free | Why |
|---|---|
| Item, feature, injury, secret slates | Never drawn from a pile |
| **NPC cards** | The one exception: the back names the *type*, and every card in that type's deck shares it, so players learn "the goblins have an intent" without learning which card |

This is the second mechanical consequence of the card/slate split (core-rules §1), after the Foundry
document mapping.

**Wrinkle:** [../rules/ideas.md](../rules/ideas.md) floats drawing permanent injuries from an
*injury deck*. If that becomes a rule, injury slates are drawn blind at the moment of acquisition
even though they live on a sheet afterwards — so either that deck gets uniform backs, or those draws
stay GM-side.

---

## 4. Bonus groups

Bonuses to one action or check may not stack from the same source-kind. This extends a principle the
rules already apply to advantage — *"two sources of advantage still give one advantage"* — to numeric
modifiers.

> **One action or check may take at most one bonus from each group.**

### 4.1 What carries a group

Only **bonus contributions**. The source of a *base* value is exempt, or a same-group weapon and
feature would stop you acting at all.

| Carries a group | Doesn't |
|---|---|
| A tool's skill bonus (`Lockpicks: Shadow +2`) | A weapon's base value (`Longsword: Strike 3`) |
| A feature with a numeric bonus (*Strong*, *Arcane Focus*) | A feature granting advantage (*Alert*) or a flat trait (*Tough*, *Quick*) |

So a **border is itself a signal**: this slate contributes a capped bonus. An unbordered slate is
unconstrained. Action and skill cards never carry a group.

### 4.2 The groups

Five kinds of help, numbered for colourblind readers:

| # | Group | What it is | Examples |
|---|---|---|---|
| 1 | **Body** | Raw physical capability | *Strong* |
| 2 | **Training** | Learned precision | *Good Aim* |
| 3 | **Tool** | The equipment doing the work | Lockpicks, Healer's Kit, Lantern, Hunting Traps |
| 4 | **Power** | Arcane or divine | *Arcane Focus*, Holy Symbol |
| 5 | **Station** | Who you appear to be | Fine Clothes, Gaming Set, rank insignia |

Five is deliberate: enough that a built character can stack three or four different bonuses and feel
it, few enough that five border colours stay distinguishable. **[OPEN]** Splitting **Power** into
arcane and divine would make six, which suits a world with a sharp church/academy divide — see
[../worldinfo/](../worldinfo/).

### 4.3 How it's drawn

- **Colour is a border** around the whole face. It costs no interior space, and it reads at
  thumbnail size and in a row.
- **The number sits in the bottom-right corner.** Top-left is the scan column, top-right is the slot
  marker, bottom-left carries tags — bottom-right is the free corner on every slate type.
- In the **compact row** rendering, the border becomes a left-edge stripe and the number goes inline
  after the name.

> **Invariant: a border tint always means a bonus group, system-wide.** Nothing else uses one. Skill
> cards colour their *approach*, but on the header and icon — never as a border — so the two systems
> can't be confused.

### 4.4 Where the HUD enforces it

This is a **resolution-time** constraint, not a hand-selection one. When an action resolves, the tray
lists the contributing modifiers and dims any whose group is already taken — the same dimming logic
as illegal card pairs, applied at a different moment.

---

## 5. Card faces

### 5.1 Action card

```
┌────────────────────┐
│ HEAVY SWING        │
├────────────────────┤
│                    │
│  ▲   ⚔ +1          │   primary: tallest band
│                    │
├────────────────────┤
│  ▼   👣 1          │   secondary: shorter
├━━━━━━━━━━━━━━━━━━━━┤   heavier rule: a different mode of play
│  ⚡   Parry         │   reaction
└────────────────────┘
```

- Band order follows the rules (▲ ▼ ⚡). Don't reorder for layout; the written rules are the reference.
- **Unequal band heights carry the hierarchy.** The primary is "the strong half", so it gets the most
  room. No label needed.
- **The reaction band is divided off by a heavier rule**, because it is played on someone else's
  turn. The Electric icon already distinguishes it; the divider reinforces it.
- **Blocked is a layer over a band**, not a different layout: grey the band and strike through its
  contents, leaving it in place so the player learns why. It must composite over any band, so it
  cannot depend on that band's own styling.
- No group border, ever.

### 5.2 Fate card

Drawn constantly and — now the discard is face up — read **in a row at tiny size**. One enormous
centred glyph, nothing else. No name, no border art competing with the number.

```
┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
│     │  │     │  │     │  │  ◜  │
│ +1  │  │  0  │  │ −2  │  │ ⊘   │   Miss: Blindfold
│     │  │     │  │     │  │     │
└─────┘  └─────┘  └─────┘  └─────┘
```

**A temporary Critical or Miss needs a distinguishing mark** — the corner notch above. *Blessed*
shuffles a temporary Critical into the deck and the rules remove it when drawn, which is impossible
if it looks identical to the permanent one. Same for a *Cursed* Miss.

Don't carry meaning in colour alone here; the sign already does the work.

### 5.3 Skill card

```
┌────────────────────┐
│ 👁  2   SHARP EYES │   approach + value, top-left
├────────────────────┤
│ Edge: ask the GM   │
│ one yes/no question│
│ about the scene.   │
└────────────────────┘
```

- Approach and value share the header because **Push** needs a match — you are scanning for "another
  Shadow card".
- **The approach is colour-coded on the header and icon**, not as a border (§4.3 invariant).
- Edge text is one short sentence. Anything longer belongs in tier 4.
- No group border, ever.

### 5.4 NPC card

```
front                  back
┌──────────────────┐   ┌──────────────────┐
│ GOBLIN           │   │     GOBLIN       │
├──────────────────┤   │                  │
│ 1   ⚔            │   │        ?         │
│ 2   👣 2         │   │                  │
└──────────────────┘   └──────────────────┘
```

- **The sequence is numbered**, because order is the entire content: "Move 3, then Strike" plays
  completely differently from "Strike, then Move 2".
- **The back carries the creature type** — the only informative back among the card types, and the
  reason *Foresee* has anything to reveal (§3).

### 5.5 Wound and Taint

Inverted: dark face, light text, **no bands**. Both have fixed text, so there is nothing to lay out —
the whole job is to be obviously wrong in a hand of five. Taint has two faces, Vomiting for the body
and Squid head for the mind, sharing one layout.

Backs are the standard action-card back (§3).

### 5.6 Twist card

Sparse on purpose. The twist name large, one short prompt, nothing else. The rules give sneak and
negotiation examples per twist, but a face cannot carry every context and should not try — this is an
inspiration prompt for the GM, not a rules card.

```
┌──────────────────┐
│                  │
│      NOISE       │
│                  │
│   Who hears it?  │
└──────────────────┘
```

---

## 6. Slate faces

### 6.1 Item slate

Two renderings. Most of the time an item is read as a **row**, not a card.

```
row:    ▌Lockpicks  [3]  Shadow +2 (locks)
        ^group stripe  ^group number

front:  ╔══════════════════════╗     back: ╔══════════════════════╗
        ║ LOCKPICKS      ⌁ 1   ║           ║ Slim picks in an     ║
        ║ Tool                 ║           ║ oilcloth roll.       ║
        ╟──────────────────────╢           ║                      ║
        ║ 🌑  +2  (locks)      ║           ║ Value   25 g         ║
        ║                      ║           ║ Weight  —            ║
        ║                  [3] ║           ║ Type    Tool         ║
        ╚══════════════════════╝           ╚══════════════════════╝
         ^^ border = group colour
```

- **Verb and bonus lines dominate the front.** That is what an action card needs from the item: the
  card says *Strike*, the item says *3*.
- Slot marker top-right, tags under the name, group number bottom-right.
- A weapon that only supplies base values (`Longsword: Strike 3, Defend 1`) carries **no border**.
- The back holds the tier-3 fields: short description, value, type.

**[OPEN] Weight has no rule behind it.** Carrying is governed entirely by slots (2 hands, 1 body,
2 belt) plus an unbounded pack; there is no encumbrance anywhere in the rules. A numeric weight is
either decoration or the seed of an unwritten rule, and it overlaps the existing **Heavy** and
**Light** tags, which *are* mechanical (*Strong* reads Heavy). Either drop it, or write a pack
capacity rule and let weight feed it.

**[OPEN] Value needs a currency unit.** Gold appears in a skill-rules example and in the world
document, but no denomination is defined in the rules. Fix it before printing numbers on fifty items.

### 6.2 Feature slate

Name, one-sentence effect, group border and number **if** the feature grants a numeric bonus.

```
╔══════════════════════╗        ┌──────────────────────┐
║ STRONG               ║        │ ALERT                │
╟──────────────────────╢        ├──────────────────────┤
║ +1 damage on ⚔ with  ║        │ You draw with ⊕ on   │
║ Heavy items.         ║        │ initiative.          │
║                  [1] ║        │                      │
╚══════════════════════╝        └──────────────────────┘
 bordered: Body bonus            unbordered: grants advantage,
                                 so it is unconstrained
```

### 6.3 Injury slate

Feature layout with the inverted harmful treatment. Never bordered — injuries are penalties, and the
group system caps bonuses only.

### 6.4 Secret slate

```
┌──────────────────────┐
│ 🗝  BARON ALDRIC     │
├──────────────────────┤
│ Owes 400 gold to the │
│ Night Market.        │
│              [spend] │
└──────────────────────┘
```

The only slate with a **spend** affordance, since playing a secret discards it.

---

## 7. Physical format

**Standard poker, 63 × 88 mm.** Keeps you compatible with sleeves and print-on-demand for the paper
playtest, and fixes one aspect ratio for every rendered face before any CSS is written.

Slates print **duplex**, so the paper test needs front/back alignment. Note that Foundry's `Card`
documents have a native face/back concept but **`Item` documents do not** — and slates are Items. The
slate back is therefore a UI construct in the sheet with its own flip affordance, not a platform
primitive.

---

## 8. Open

- **Greyscale printing.** If the paper playtest prints in greyscale, approach colour-coding and the
  five group colours both need redundant visual encoding beyond the number. This constrains the
  design now rather than later.
- **Splitting Power into arcane and divine** (§4.2), making six groups.
- **Weight** and **currency unit** on item slates (§6.1).
- Group *names* are provisional; the **count** of five is what the palette depends on.
