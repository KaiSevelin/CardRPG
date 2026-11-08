# Ideas (not rules yet)

Ideas we like but haven't decided on. Each could become a rule later.

## Special effects: every effect lives in a deck

| Where | Represents | Used for |
|---|---|---|
| Fate deck | Luck and fate | Wild magic, curses |
| Action / skill deck | Body and mind | Lingering wounds, contamination, fear |
| Battlefield | The environment | Fire, poison clouds, rubble |
| NPC deck | Enemy behaviour | Boss phases and chaos |

### Wild magic and miscasts (fate deck)
**The Wild card itself is now a rule:** core-rules.md, section 6. It is in the fate deck's schema, it
resolves at plain value, it does not reshuffle, and it is permanent. What is still an idea is
everything that *produces* one and the deck it points at.

- **Overcast:** a caster can boost a spell (e.g. +2 value) by shuffling a **Wild** card into their own fate deck.
- Drawing a Wild card: the spell still happens, and you also draw from a **Wild Magic deck**. Cards range from good to dangerous: *Echo* (the spell happens twice), *Blink* (teleport 3), *Backlash* (Dazed), *Misfire* (hits the nearest creature), *Glow* (can't be Invisible this fight).
- Wild cards stay until a long rest, so the more a caster pushes, the less predictable they get.
- **Miscast:** a Miss on a Cast also draws from the Wild Magic deck.

### Lingering damage and contamination (player decks)
**Wounds and Taint are now rules:** core-rules.md, section 8.
Still an idea: **Fear / Madness** cards in the skill deck, from horrors.

### Battlefield effects (terrain tokens)
- *Fire:* spreads 1 square per round and burns anyone in it.
- *Poison cloud:* disadvantage inside.
- *Blood slick:* Agility check, or fall Prone.
- *Rubble:* costs 2 movement per square.
- *Corruption pool:* adds Taint.

### Boss chaos (NPC deck)
- **Phases:** at 2/3 and 1/3 of its Health, the boss shuffles new, nastier cards into its deck, so you can see its tactics change.
- **Lair deck:** draw 1 card at the start of each round, separate from the boss's actions (ceiling collapses, reinforcements, darkness, fire).

**Favourite still parked:** boss phases.

## Permanent injuries  **[BUILT 2026-11-08]**

> **Built as written, and the design held up because of one decision made here.** *An injury is a
> negative feature, a slate and not a card* turned out to need **no new effect machinery at all**:
> every example below is expressible in a field a feature already had, which is why this list could
> be written long before the engine could run any of it. Twelve of the fourteen built injuries
> carry a number the engine reads; the two that do not are the two below marked as such.
>
> The rules are now in [core-rules.md](core-rules.md) §8, with the parts this section left open
> filled in: **five categories** (so a ritual can name one), **one injury per category**, and the
> four rituals as **downtime challenges** rather than spells &mdash; which is what*"more of a quest
> than a service"* below turned into once Ritual Magic's own price was read.

An injury is a **negative feature**: a permanent **slate** on the character sheet, not a card in a deck.

| | Wound | Taint | **Injury** |
|---|---|---|---|
| Where | Action deck | Action or skill deck | Character sheet (feature) |
| Lasts | Until rest or healing | Until cured | Permanent |

### Effects use existing rules

| Injury | Effect | Uses | Built as |
|---|---|---|---|
| Lost eye | Range −2 on ranged attacks. Disadvantage on sight-based Wits checks. | Range, situational disadvantage | `bonus.range: -2` |
| Lost fingers | Fine tools give at most +1 (as if untrained). | Tool training | **prose** — a cap, not a penalty |
| Lost hand | Only 1 hand slot. | Item slots | `takes.handSlots` |
| Bad leg | All Move values −1 (minimum 1). | Card values | `takes.move` |
| Scarred face | Disadvantage on Presence with strangers, advantage on intimidation. | Advantage | **prose** — it cuts both ways |
| Shattered nerves | Blocks ⚡ reactions on your first turn of each combat. | Blocked icons | `blocksReactions`, round 1 |

Injuries can cut both ways (scarred face) and become part of the character. The final list waits for the world.

### Gaining injuries

> Built exactly as below, and it is the **only** gate: nothing else in the game inflicts an injury.
> A card that wants to maim you gives this draw **disadvantage** instead (the `maiming` keyword),
> which is why it needed no vocabulary of its own.

When you fall Unconscious, draw a fate card:
- **Miss:** permanent injury (from an injury deck, or chosen by the GM to fit what hit you).
- **−2 / −1:** lasting injury that heals after some days of rest.
- **Anything else:** only the normal Wound.

### Living with injuries
- **Items:** hook hand (takes the hand slot, has its own Strike line), glass eye, crutch.
- **Adaptation:** a leveling option, *Adapted: ignore one injury's penalty*.
  - **[BUILT 2026-11-08]** As written, and it turned out to be load-bearing rather than a nicety:
    Maimings are **uncapped** (core-rules §8), and a *Bad Leg* alone measures &minus;8.1, so this
    is the brake that had to be fitted before the cap could come off. The injury **stays on the
    sheet** &mdash; it is the only feature in the game that points at another slate.
- **Regeneration magic:** rare and expensive, more of a quest than a service.
  - Built as **Recipe: Regrowth**, a downtime challenge at Progress 6 &mdash; because a challenge
    is what "a quest rather than a service" is in this game's existing vocabulary, and because
    Ritual Magic's price was already *"time, and a recipe that can go wrong"*. It is an **item**,
    at 900 gold: the recipe is the gate, so the gate is a thing you find.

### Optional: escaping death
When your character would die, you may take a **permanent injury instead**. Limited to once per character, or once per level.
