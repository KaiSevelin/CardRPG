# Icon set

Every icon the rules need: the placeholder glyph used in the rules text, and the chosen
[game-icons.net](https://game-icons.net) source icon.

**Icons are data, not decoration.** *Blocked icons* (core-rules §10) lets conditions and features
switch off any card half that shows a given icon, so each icon is a value the engine tests against.
Card faces therefore have to be **rendered from card data**, not stored as finished images.

That means what you're sourcing is a **symbol set**, not card art: one flat silhouette per entry,
readable at about 16 px, single-colour so it can be recoloured and greyed out when blocked.

---

## Tier 1 — needed before the first card exists (23)

These appear on card faces. Nothing can be laid out until they're chosen.

### Card anatomy (3)

| Placeholder | Name | Shown on | game-icons.net |
|---|---|---|---|
| ▲ | **Primary** | The strong half of every action card | Rank 3 |
| ▼ | **Secondary** | The weak half | Rank 2 |
| ⚡ | **Reaction** | The reaction line | Electric |

### Verbs (6)

| Placeholder | Name | Needs an item? | game-icons.net |
|---|---|---|---|
| ⚔ | **Strike** | Yes | Sword wound |
| ✦ | **Cast** | Yes | Magic swirl |
| 🛡 | **Defend** | Yes | Shield reflect |
| 🧪 | **Use** | Yes | Potion ball |
| 👣 | **Move** (+ number) | No | Boot prints |
| ⇄ | **Ready** | No | School bag |

### Effects and targeting (6)

| Placeholder | Name | Notes | game-icons.net |
|---|---|---|---|
| ✚ | **Heal** (+ number) | An effect, not a verb — it comes off an item's Cast line or a card | Healing |
| ◎ | **Range** (+ number) | | Bullseye |
| ✸ | **Blast** (+ number) | Area that hits everyone in it, allies included | Mushroom cloud |
| ✵ | **Aimed** (+ number) | Area that hits only your enemies | Laser sparks |
| ⊕ | **Advantage** | For cards and features that grant it | Thumb up |
| ⊖ | **Disadvantage** | | Thumb down |

Modifiers (`+1`, `−1` beside an icon) are typography, not icons.


### Slate markers (1)

| Placeholder | Name | Shown on | game-icons.net |
|---|---|---|---|
| ⟳ | **Charging** | Every slate with an active ability, beside its recharge | Charging |

The icon carries the recharge — a number of turns, or a boundary. A **tooltip** gives the prose:
*"Recharges after 2 of your turns"*, *"Recharges when the combat ends"*. Icon for the face, words on
hover, per the information tiers in [../foundry/card-layout.md](../foundry/card-layout.md).

### Approaches — skill cards (7)

| Placeholder | Name | game-icons.net |
|---|---|---|
| ✊ | **Might** | Mighty force |
| 🌀 | **Agility** | Run |
| 🌑 | **Shadow** | Spy |
| 👁 | **Wits** | All seeing eye |
| 📜 | **Lore** | Book cover |
| 👑 | **Presence** | Embraced energy |
| ✶ | **Any** — the wild approach on Inspiration cards | Misdirection |

---

## Tier 2 — needed for a playable combat (18)

### Conditions (12)

These double as Foundry status effects, so they need to read clearly as small overlays on a token,
with room for a duration number.

| Condition | game-icons.net |
|---|---|
| **Dazed** | Surprised |
| **Slowed** | Tortoise |
| **Stunned** | Brain freeze |
| **Invisible** | Invisible |
| **Burning** | Fire silhouette |
| **Prone** | Falling |
| **Unconscious** | Knockout |
| **Grappled** | Luchador |
| **Silenced** | Silenced |
| **Disarmed** | Drop weapon |
| **Blessed** | Aura |
| **Cursed** | Imprisoned |

Blessed and Cursed are **condition markers only**. The temporary card they shuffle into your fate
deck is an ordinary Critical or Miss and uses those faces, so all four icons are independent.

### Fate deck (2)

| Name | Notes | game-icons.net |
|---|---|---|
| **Miss** | Lowest card | Blindfold |
| **Critical** | Highest card | Punch blast |

The −2 … +2 cards are numerals and need no symbol.

### Lingering damage (4)

| Placeholder | Name | Notes | game-icons.net |
|---|---|---|---|
| ✖ | **Wound** | A card in your action deck that can't be played | Knee bandage |
| ☣ | **Taint (body)** | Poison and disease — goes in the **action** deck | Vomiting |
| ☣ | **Taint (mind)** | Dark magic and horrors — goes in the **skill** deck | Squid head |
| – | **Injury** | Permanent — a *slate* on the sheet, not a card in a deck (see [ideas.md](ideas.md)) | Severed hand |

Taint has two faces because core-rules §8 already splits it by which deck it goes into. For the data
model that's one card type with a `flavour` field (`body` / `mind`) selecting the icon, not two types.

---

## Tier 3 — HUD and sheet chrome (9)

Nothing blocks on these; Font Awesome ships with Foundry and covers most of them.

| Group | Entry | game-icons.net |
|---|---|---|
| **Equipment slots** | Hands | Hand |
| | Body | Person |
| | Belt | Belt |
| **Deck state** | Exhausted | Oppression |
| | Spent | Card discard |
| | Rest token | Night sleep |
| **Challenge tracks** | Progress | Target prize |
| | Pressure | Hourglass |
| **Secrets** | Secret slate | Lock spy |

### Optional — item tags (9)

Text labels are fine on an item's own face; icons only pay off if tags need to be scannable in a
crowded inventory.

| Tag | game-icons.net |
|---|---|
| Heavy | Anvil |
| Light | Feather |
| Melee | Crossed swords |
| Ranged | Bowman |
| Thrown | Thrown spear |
| Arcane | Spell book |
| Shield | Griffin shield |
| Armor | Lamellar |
| Consumable | Bottled bolt |

---

## Status: complete — 50 of 50 chosen

| Tier | Count | Blocks |
|---|---|---|
| 1 | 23 | Card layout and the card schema |
| 2 | 18 | Playable combat |
| 3 | 9 | Polish |
| *optional tags* | *9* | *nothing* |

**59 icons to download** including the optional tags. Nothing in the rules is waiting on an icon
decision any more.

---

## Licensing and sourcing

- **[game-icons.net](https://game-icons.net)** — mostly **CC BY 3.0**, a few CC0, and the licence and
  author are **per icon**. Record the author for each one as you download, in an `ATTRIBUTION.md`
  that ships with the system. Doing it at download time costs minutes; doing it afterwards means
  re-finding 59 pages.
- Download as **SVG** with a single fill colour, so one CSS rule can grey out a blocked icon.
- Filenames on the site are kebab-case (`sword-wound.svg`, `all-seeing-eye.svg`), which is also a
  reasonable key convention for the icon enum in the system data model.
- **Font Awesome** ships with Foundry — use it for any Tier 3 chrome you'd rather not vendor.

## Still open

The **layout** of a card face — where the three halves sit, how a modifier attaches to its icon, how
a blocked icon is shown as blocked. That's a design pass on the rendered template, and it can wait
until the schema exists.
