# Starter Cards (Draft 0.3)

Playtest set for a paper test fight. The Warrior deck, the goblins and their gear have been
run through the simulator in [../sim/](../sim/); the skill deck and tools have not, so treat
those values as first guesses.

---

## Action deck – "Warrior" (16 cards)

| # | Card | Primary | Secondary | Reaction | Copies |
|---|---|---|---|---|---|
| 1 | Strike | Strike | Move 1 | Parry | 3 |
| 2 | Heavy Swing | Strike +1 | Move 1 | – | 2 |
| 3 | Lunge | Move 2, then Strike | Move 1 | – | 1 |
| 4 | Shield Up | Defend (Block applies to every attack until your next turn) | Move 1 | Block | 2 |
| 5 | Advance | Move 3 | Move 2 | Sidestep | 2 |
| 6 | Draw Steel | Strike | Ready | – | 2 |
| 7 | Quick Hands | Use | Ready | Use | 1 |
| 8 | Second Wind | Heal yourself 2 — **Spent** | Use | – | 1 |
| 9 | Taunt | Target enemy must attack you next turn | Move 1 | – | 1 |
| 10 | Weapon Swap | Ready | Strike | – | 1 |

That makes **16** cards: 4 have Ready (2× Draw Steel, Quick Hands, Weapon Swap). Weapon Swap shows Ready on its *primary* half, so you can swap and still Strike in the same turn.

**Second Wind** is the deck's one **Spent** card: play its primary and the card goes out for the
rest of the fight, back only on a rest (core-rules §8). A heal worth having once is a decision; the
same heal coming round again every time the discard recycles is just more Health. Its *secondary*
costs nothing, so using it to drink a potion keeps the heal in the deck — which is the decision.

No starter card carries **Strain** yet. It is the cost for cards that lean on a whole hand, and the
Warrior has nothing that expensive; the first ones belong in a caster deck.

### Reactions

| Reaction | Trigger | Effect |
|---|---|---|
| **Parry** | You are hit by a melee Strike | Block = your equipped item's *Defend* value |
| **Block** | You are hit by any attack | Block = your shield's *Defend* value +1 |
| **Sidestep** | An enemy ends movement next to you | Move 1 |
| **Use** | Any time on another's turn | Use a belt item |
| **Brace** (any card) | You take damage | Reduce damage by 1 |

---

## Skill deck – generic starter (15 cards)

A stand-in until the Ways have card lists. Every approach appears twice, so any character can try anything, and the deck lasts about a day of play.

| # | Card | Approach | Value | Edge | Copies |
|---|---|---|---|---|---|
| 1 | Shoulder It | ✊ Might | 2 | – | 1 |
| 2 | Brace and Hold | ✊ Might | 1 | Edge: you don't fall or get pushed this scene. | 1 |
| 3 | Quick Feet | 🌀 Agility | 2 | – | 1 |
| 4 | Soft Landing | 🌀 Agility | 1 | Edge: ignore the first 2 damage from a fall this scene. | 1 |
| 5 | Out of Sight | 🌑 Shadow | 2 | – | 1 |
| 6 | Light Fingers | 🌑 Shadow | 1 | Edge: you know where the valuables are kept. | 1 |
| 7 | Sharp Eyes | 👁 Wits | 2 | Edge: ask the GM one yes/no question about the scene. | 1 |
| 8 | Read the Room | 👁 Wits | 1 | Edge: the GM names who in the scene is lying. | 1 |
| 9 | I've Read of This | 📜 Lore | 2 | – | 1 |
| 10 | Field Dressing | 📜 Lore | 1 | Edge: an ally heals 1 Health. | 1 |
| 11 | Honeyed Words | 👑 Presence | 2 | – | 1 |
| 12 | Hold Their Eye | 👑 Presence | 1 | Edge: one NPC's attention is on you until the end of the scene. | 1 |
| 13 | Inspiration | any | 1 | Edge: draw 1 skill card. | 2 |

That's **14**. Add **one card at value 3** in your Way's main approach to finish the deck:

| Way | Add |
|---|---|
| **Way of Strength** | ✊ Might 3 or 🌀 Agility 3 |
| **Way of Shade** | 🌑 Shadow 3 or 🌀 Agility 3 |
| **Way of Mind** | 📜 Lore 3 or 👑 Presence 3 |

Your **background** then adds its 2 skill cards on top, giving a 17-card deck at first level.

> **Passive senses:** this deck's best Wits card is Sharp Eyes at 2, so a starter character's passive score is **4** — they reliably notice Easy things and miss Normal ones. Taking a Wits 3 card from a Way or background raises it to 5. See *Passive senses* in the skill rules.

---

## Items

| Item | Fits | Tags | kg | Value | Strike | Cast | Defend | Use |
|---|---|---|---|---|---|---|---|---|
| Longsword | 1 hand, Back | Heavy, Melee | 2 | 15 g | 3 dmg | – | 1 | – |
| Dagger | 1 hand, Belt | Light, Melee, Thrown | 0 | 2 g | 2 dmg (range 3 thrown) | – | – | – |
| Shortbow | 2 hands, Back | Ranged | 1 | 25 g | 2 dmg, range 6 | – | – | – |
| Staff of Healing | 2 hands, Back | Arcane, Melee | 2 | – | 1 dmg | ✚ Heal 3, range 2 | 1 | – |
| Fire Wand | 1 hand, Belt | Arcane | 0 | – | – | 2 dmg, ✸ Blast 1, range 4 | – | – |
| Wooden Shield | 1 hand, Back | Shield | 3 | 10 g | 1 dmg | – | 2 | – |
| Leather Armor | Body | Armor | 5 | 20 g | – | – | – | Armor 1 (always on) |
| Healing Potion | Belt, 1 hand | Consumable | 0 | 50 g | – | – | – | Heal 4, then discard item |
| Smoke Bomb | Belt, 1 hand | Consumable | 0 | 40 g | – | – | – | You become Invisible (1) |

**Fits** lists every slot an item will go in; where there is more than one, you choose when you put
it on (core-rules §4). A potion on your **belt** is free to hang and free to swap, so the potion
you brought is the potion you can actually drink; held in a **hand** it is a Use with no Ready at
all, at the price of a hand you are not fighting with. Leather Armor fits one slot and so is never
asked about, which is the rule doing its job.

A blade or a shield slings on your **back** for a Ready, and comes off it for nothing — so what you
sling before the fight is a free swap waiting for you in the middle of one. While it hangs there it
is carried, not held: no Strike, no Defend, no bonus. The back takes one thing.

A full warrior kit — longsword, shield, leather armor, a potion — comes to **10 kg** against a 40 kg
limit. The limit is not a constraint on how you equip a character; it is a constraint on what you
carry *out*. See *Carrying* in the core rules.

### Tools (skill lines)

Tools work like weapons: the card says what you try, the tool says how well. An **untrained** user gets at most **+1** from any of these; training comes from backgrounds and the Way trees.

| Item | Slot | kg | Value | Group | Skill line |
|---|---|---|---|---|---|
| Lockpicks | Belt | 0 | 25 g | Tool | 🌑 Shadow +2 (locks and mechanisms) |
| Climbing Rope | Pack | 3 | 5 g | Tool | ✊ Might / 🌀 Agility +1 (climbing, and nobody falls alone) |
| Holy Symbol | 1 hand | 0 | 10 g | Power | 📜 Lore +1 (religion, undead) |
| Fine Clothes | Body | 2 | 30 g | Station | 👑 Presence +1 (nobles and merchants) |
| Healer's Kit | Pack | 2 | 20 g | Tool | 📜 Lore +2 (treating wounds; removes 1 Wound on a Normal 5) |
| Gaming Set | Pack | 1 | 5 g | Station | 👑 Presence +1 (soldiers, taverns, gamblers) |
| Hunting Traps | Pack | 4 | 15 g | Tool | 👁 Wits +1 (tracking and trapping animals) |
| Lantern | 1 hand | 2 | 5 g | Tool | 👁 Wits +1 (anything you need to see in the dark) |

Every tool here carries a **bonus group** (core-rules §5), so a character can benefit from one Tool
bonus, one Station bonus and one Power bonus on the same check, but never two of the same kind.

Pack items aren't equipped, so pulling one out is free in a quiet scene but may cost time inside a challenge.

---

### NPC gear

Tuned separately from player gear (see *NPC gear and the armor rule* in the core rules).

| Item | Slot | Tags | kg | Strike | Defend |
|---|---|---|---|---|---|
| Goblin Spear | 1 hand, Back | Melee | 2 | 3 dmg | – |
| Goblin Shortbow | 2 hands, Back | Ranged | 1 | 3 dmg, range 6 | – |

---

## Features

Passive features are simply true; an **active** one is Drained when used and comes back on its
recharge (see *Active abilities and recharge* in the core rules).

| Feature | Effect |
|---|---|
| **Strong** | +1 damage on Strike with *Heavy* items. |
| **Good Aim** | +2 range on *Ranged* and *Thrown* items. |
| **Quick** | Hand size +1. |
| **Tough** | +4 max Health. |
| **Arcane Focus** | +1 to all *Cast* values. |
| **Steady** | **Drain:** you don't become Dazed. *Recharge: combat.* |
| **Alert** | You draw with advantage on initiative. |

---

## NPC deck – Goblin (6 cards)

| Card | Effect |
|---|---|
| Stab & Scurry | Strike, then Move 2 |
| Rush | Move 3, then Strike |
| Swarm | Move 2. Strike +1 if another goblin is next to the target |
| Cower | Move 3 away from the nearest enemy |
| Dirty Trick | Strike. Target is Dazed (1) |
| Throw Rock | Strike at range 4 (1 dmg, ignores item) |

**Goblin stats:** Health 5, Armor 0, equipped: Goblin Spear *or* Goblin Shortbow.
**Tactics:** Pack Tactics, Cowardly (spear goblins only — see *Cowardly needs rewriting* in the core rules). **Target priority:** Weakest.

### Goblin encounters (tested against one starter Warrior)

| Encounter | Difficulty | Simulated win rate |
|---|---|---|
| 3 goblins with spears | Easy | 99.4% |
| 4 goblins with spears | Moderate | 93.2% |
| 5 goblins with spears | Hard | 75.9% |
| 4 goblins, 2 spears + 2 bows | **Deadly** | 64.6% |

**A mixed group is a tier harder than a uniform one of the same size.** Four goblins with two bows are twice as dangerous as four with spears: the spears pin the hero in melee while the bows shoot from behind cover, and *Dirty Trick* lands three times as often because the hero spends rounds crossing open ground. Build hard encounters by mixing ranges, not by adding bodies.

> These rates are for a **single** starter Warrior. They are a yardstick for tuning, not a party difficulty table; party play is untested (see [../sim/analysis-2026-10-27.md](../sim/analysis-2026-10-27.md)).

> Note: the Warrior deck above is a combat-test deck. A real warrior will carry more weapons and items, which gives the Ready cards a purpose.
