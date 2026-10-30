# Equipment (Draft 0.1)

The full catalogue. [starter-cards.md](starter-cards.md) holds the **playtest set** — the nine items a
paper test fight needs — and this holds everything else, the way
[conditions.md](conditions.md) holds the conditions core-rules §7 only summarises.

The rules for slots, weight, Ready and bonus groups are core-rules §4 and §5. This document is the
content written against them.

---

## 1. The standard

### 1.1 What an item is priced in

| | Paid in |
|---|---|
| **A weapon** | hands, weight, and the Ready it may cost to bring to bear |
| **Armour** | **weight**, and nothing else — which is why the ladder is short |
| **A worn item** | the slot, and there is exactly one of most slots |
| **A consumable** | coin, and the fact that it is gone |
| **A magic item** | a **bonus group** (§5), so two of a kind never stack |

### 1.2 Armour is a cliff edge, so the ladder is four rungs and no more

Simulation measured armour as behaving like a cliff edge: a point of it is worth far more against
four goblins striking for 3 than against one ogre striking for 8, because it is subtracted from
*every* hit ([../sim/](../sim/)). That is why this list runs **1 to 4** and buys the difference with
**kilograms** rather than coin:

| | Armor | kg | A 40 kg limit means |
|---|---|---|---|
| **Leather** | 1 | 5 | nothing; wear it and forget it |
| **Mail Shirt** | 2 | 9 | a shield and a pack and you are thinking about it |
| **Brigandine** | 3 | 12 | **Heavy Armor** for core-rules §10 — blocks ⚡ Sidestep |
| **Plate** | 4 | 20 | half your allowance. Blocks ⚡ Sidestep, and **Burdened** is one bad decision away |

> **Armour's real cost is Burdened, not coin.** Over the limit you are Slowed, and mobility is the
> most valuable thing in the game — worth 29.5 points of win rate against a mixed group
> ([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §6). So **Plate is a bet that
> nothing will out-range you**, and it is the Ironclad's bet in particular, whose Signature *wants*
> to be Overloaded.

### 1.3 Firearms exist to answer armour

The one historical fact worth a rule: a crossbow bolt and a lead ball do not care about plate the way
a sword does.

| | Ignores |
|---|---|
| **Crossbows** | 1 armor |
| **Firearms** | **2 armor** |

Which prices the whole firearm line: they hit hardest, they ignore most, and **every shot costs a
⇄ Ready to reload.** That is not a new verb — it is the one four of the sixteen starter cards already
carry, and a simulated slung weapon showed what the Ready economy is worth
([analysis §8](../sim/analysis-2026-10-30.md)).

---

## 2. Melee weapons

One line per speciality the world document names — *sword, two-handed, polearm, dagger, unarmed,
formation, blunt, gladiator, berserker, cavalry* (`worldinfo/Firma.md`, *Specialization — Way of
Strength*). The list is **derived from that chapter rather than invented**, which is the same
discipline the magic schools' prices got.

| Weapon | Fits | Tags | Hands | kg | Value | Strike | For |
|---|---|---|---|---|---|---|---|
| **Dagger** | 1 hand, Belt | Light, Melee, Thrown | 1 | 0 | 2 g | 2 (range 3 thrown) | dagger specialists |
| **Arming Sword** | 1 hand, Back | Melee | 1 | 1 | 12 g | 3 | sword specialists |
| **Longsword** | 1 hand, Back | Heavy, Melee | 1 | 2 | 15 g | 3 | sword specialists |
| **Greatsword** | 2 hands, Back | Heavy, Melee | 2 | 3 | 40 g | **5** | two-handed specialists |
| **Great Axe** | 2 hands, Back | Heavy, Melee | 2 | 4 | 30 g | **5** | berserkers |
| **Mace** | 1 hand, Belt | Heavy, Melee | 1 | 2 | 10 g | 3, **ignores 1 armor** | blunt-weapon specialists |
| **Warhammer** | 1 hand, Back | Heavy, Melee | 1 | 3 | 25 g | 4, **ignores 1 armor** | blunt-weapon specialists |
| **Spear** | 1 hand, Back | Melee, Thrown | 1 | 2 | 8 g | 3 (range 3 thrown) | formation |
| **Halberd** | 2 hands, Back | Heavy, Melee | 2 | 3 | 35 g | 4, **range 2** | polearm specialists |
| **Pike** | 2 hands | Heavy, Melee | 2 | 4 | 20 g | 3, **range 3** — useless adjacent | formation specialists |
| **Lance** | 1 hand | Heavy, Melee | 1 | 3 | 30 g | **5** — **needs a mount** | cavalry |
| **Trident** | 1 hand, Back | Melee | 1 | 2 | 18 g | 3, **range 2** | gladiators |
| **Net** | Belt, 1 hand | Light, Thrown | 1 | 1 | 5 g | — · range 3: **Grappled (1)**, resist ✊ 5 | gladiators |
| **Bare hands** | — | Light, Melee | 0 | 0 | — | 1 | unarmed specialists |

**Reach is what a polearm sells, and the rules already had the field for it.** A melee weapon with
**range 2 or 3** strikes from behind the front rank, which is what *formation* means and what the
Infantry and Vax tactics are built around (way-cards §2.5). **The Pike pays for it honestly** — it is
*useless* against an adjacent enemy, so a pikeman wants somebody in front of them, which is the whole
of a formation.

**Bare hands are on the list because three things already read them**: Asceticism's *Empty Hand* and
*Nothing to Carry*, and the Street Fighter's *The Alley*, which all reward holding nothing. Strike 1
is the floor they are measured against.

---

## 3. Bows and crossbows

| Weapon | Fits | Tags | Hands | kg | Value | Strike |
|---|---|---|---|---|---|---|
| **Shortbow** | 2 hands, Back | Ranged | 2 | 1 | 25 g | 2, range 6 |
| **Longbow** | 2 hands, Back | Heavy, Ranged | 2 | 2 | 50 g | 3, range 10 |
| **Crossbow** | 2 hands, Back | Ranged | 2 | 3 | 60 g | 4, range 8, **ignores 1 armor** — ⇄ Ready to reload |
| **Heavy Crossbow** | 2 hands | Heavy, Ranged | 2 | 5 | 120 g | **5**, range 10, **ignores 1 armor** — ⇄ Ready to reload |

**The longbow is the one that does not reload**, and that is its whole argument against a crossbow
that hits harder: a bow fires every turn, a crossbow fires every other turn. Against five goblins the
bow wins; against one armoured knight the crossbow does.

---

## 4. Firearms

Matchlocks. Loud, slow, and the reason plate stopped being worth its weight.

| Weapon | Fits | Tags | Hands | kg | Value | Strike |
|---|---|---|---|---|---|---|
| **Matchlock Pistol** | 1 hand, Belt | Ranged | 1 | 1 | 70 g | 3, range 4, **ignores 2 armor** — ⇄ Ready to reload |
| **Arquebus** | 2 hands, Back | Heavy, Ranged | 2 | 4 | 90 g | **5**, range 8, **ignores 2 armor** — ⇄ Ready to reload |
| **Matchlock Musket** | 2 hands | Heavy, Ranged | 2 | 5 | 150 g | **6**, range 12, **ignores 2 armor** — ⇄ Ready to reload |
| **Culverin** | *not carried* | Heavy, Ranged | 2 | 180 | 900 g | **6**, ✸ Blast 2, range 16, **ignores 2 armor** — two ⇄ Readies to reload |

**The pistol is the one that changes a turn rather than a fight.** One hand, so it goes beside a
sword — and a Musketeer who fires their arquebus, draws the pistol and fires that is two shots before
a single reload, which is what a brace of pistols was actually for.

**The Culverin is not an item you carry, it is a position you take.** 180 kg: it is emplaced before
the fight and the GM can take it from you, which is exactly the **gear you can lose** resource the
Artillerist pays in ([leveling.md](leveling.md) §5a.1). Its Blast does not care whose side you are
on.

---

## 5. Armour, shields and helms

| Item | Slot | Tags | kg | Value | Line |
|---|---|---|---|---|---|
| **Leather Armor** | Body | Armor | 5 | 20 g | Armor 1 |
| **Mail Shirt** | Body | Armor | 9 | 70 g | Armor 2 |
| **Brigandine** | Body | Armor, Heavy | 12 | 140 g | Armor 3 · blocks ⚡ Sidestep |
| **Plate** | Body | Armor, Heavy | 20 | 400 g | Armor 4 · blocks ⚡ Sidestep |
| **Buckler** | 1 hand, Belt | Shield | 1 | 6 g | Defend 1 |
| **Wooden Shield** | 1 hand, Back | Shield | 3 | 10 g | Strike 1 · Defend 2 |
| **Kite Shield** | 1 hand, Back | Shield | 4 | 24 g | Defend 2 · **Defend 3 against Ranged** |
| **Tower Shield** | 1 hand | Shield, Heavy | 8 | 45 g | Defend 3 · your Move is **halved** while it is in hand |
| **Light Helm** | Head | Armor | 1 | 15 g | Armor 1 |
| **Great Helm** | Head | Armor, Heavy | 3 | 40 g | Armor 1 · **disadvantage** on 👁 Wits checks |

> **[ENGINE] Armour now sums from every worn slot, not just the body.** Until this document the
> actor summed `equippedSlot === "body"` only, so a helmet contributed nothing whatever it said. The
> filter is `worn` now, which is a property the slot list already carried — so **head, cloak, neck,
> fingers and feet can all carry armour**, and five slots that had no item at all have a reason to
> exist.

**The Tower Shield is the honest one.** Defend 3 is the best in the game and it halves your Move,
which costs 29.5 points of win rate's worth of mobility in the fight where mobility matters
([analysis §6](../sim/analysis-2026-10-30.md)). It is a wall for a man who has decided not to go
anywhere — the Guardian's shield, and nobody else's.

---

## 6. Worn items — the five empty slots

**Five worn slots existed with nothing to put in them**: cloak, head, neck, fingers, feet. All five
have had icons since the icon set was chosen. These are the mundane entries; §9 has the enchanted
ones.

| Item | Slot | kg | Value | Line | Group |
|---|---|---|---|---|---|
| **Travelling Cloak** | Cloak | 2 | 8 g | 🌑 Shadow +1 outdoors, and you are dry | Station |
| **Fine Clothes** | Body | 2 | 30 g | 👑 Presence +1 with nobles and merchants | Station |
| **Signet Ring** | Fingers | 0 | 60 g | 👑 Presence +1 where your house is known | Station |
| **Pilgrim's Token** | Neck | 0 | 3 g | 📜 Lore +1 on matters of one named faith | Power |
| **Marching Boots** | Feet | 1 | 12 g | Difficult ground costs you 1 instead of 2 | Make |

**Three of the five are Station**, which is the bonus group nothing had used before: a cloak, good
clothes and a ring do not make you better at fighting, they make you somebody. That is what the
group is for and it is why they do not compete with a Tool.

---

## 7. Tools and kit

Tools work like weapons: the card says what you try, the tool says how well. **Untrained gets at most
+1 from any of these**; training comes from backgrounds and the Way trees.

| Item | Slot | kg | Value | Group | Skill line |
|---|---|---|---|---|---|
| **Lockpicks** | Belt | 0 | 25 g | Tool | 🌑 Shadow +2 (locks and mechanisms) |
| **Climbing Rope** | Pack | 3 | 5 g | Tool | ✊ Might / 🌀 Agility +1 (climbing, and nobody falls alone) |
| **Healer's Kit** | Pack | 2 | 20 g | Tool | 📜 Lore +2 (treating wounds; removes 1 Wound on a Normal 5) |
| **Repair Kit** | Pack | 3 | 30 g | Tool | 📜 Lore +2, and overnight it clears **1 Corrode** from one item |
| **Hunting Traps** | Pack | 4 | 15 g | Tool | 👁 Wits +1 (tracking and trapping animals) |
| **Lantern** | 1 hand | 2 | 5 g | Tool | 👁 Wits +1 in the dark — and the squares it lights are **not shadowed** |
| **The Kit** | Pack | 3 | — | Tool | 🌑 Shadow +2, and every **Hard** physical obstacle counts as Normal |
| **Holy Symbol** | 1 hand | 0 | 10 g | Power | 📜 Lore +1 (religion, undead) |
| **Gaming Set** | Pack | 1 | 5 g | Station | 👑 Presence +1 (soldiers, taverns, gamblers) |
| **Smith's Hammer** | Pack | 2 | 18 g | Make | 📜 Lore +2 (metalwork); repairs **1 Corrode** overnight |

**The Lantern is now a positional item**, because core-rules §11 defines **shadowed** squares and an
entire magic school reads them. A lantern is therefore an answer to a Shadow mage, which is a thing a
5-gold item should not be able to do by accident — so it lights the squares around it and nothing
further, and *The Borrowed Dark* overrides it.

**The Kit is the Burglar's Signature**, printed in way-cards §2.2 as an item and absent from every
item list until now.

---

## 8. Consumables

### 8.1 Thrown and field

| Item | Slot | kg | Value | Use |
|---|---|---|---|---|
| **Healing Potion** | Belt, 1 hand | 0 | 50 g | Heal 4, then discard |
| **Smoke Bomb** | Belt, 1 hand | 0 | 40 g | You become **Invisible (1)** |
| **Antidote** | Belt, 1 hand | 0 | 35 g | ⛓ **Shake Off 2**, Poisoned only |
| **Flask of Ink** | Belt, 1 hand | 0 | 20 g | ✸ Blast 1 at range 3: ends **Invisible** in it |
| **Flask of Oil** | Belt, 1 hand | 0 | 10 g | One target at range 3 is **Off-Balance (1)**, no save |
| **Cleansing Draught** | Belt, 1 hand | 0 | 150 g | Remove **1 Taint** that is not bound |
| **Firepot** | Belt, 1 hand | 1 | 45 g | ✸ Blast 1 at range 3: **Burning 1 (2)** |
| **Caltrops** | Pack | 2 | 12 g | A 2-square area becomes **difficult ground** for the fight |

**Brewers make potions** (`worldinfo/Firma.md`), which is why this list is the Brewer craft's output
and why a potion is the one magic-adjacent thing a party can simply buy.

**A consumable is the cheap answer to a condition, and that is deliberate** — but it is *coin*, so it
cannot be the only answer. [conditions.md](conditions.md) §10 records the open question: a potion that
removes any condition would make gold the counter to half the game's content, which is why the
Antidote is narrow and the Cleansing Draught costs 150 gold.

### 8.2 Potions — the Brewer's craft

*"Brewers make potions"* is one line of the world document and it is a whole craft. A potion is
**drunk**, which makes it the only magic in the game that works on somebody who has no idea how it
works — you can pour one into an unconscious friend.

| Potion | Value | Use |
|---|---|---|
| **Tincture of the Clear Eye** | 30 g | ⛓ **Shake Off 1** on anything |
| **Potion of Stone** | 40 g | For the fight you cannot be **moved** — and your Move is **0** |
| **Brewer's Reserve** | 45 g | Your next ✦ Cast is **+2** |
| **Healing Potion** | 50 g | **Heal 4** |
| **Potion of the Hare** | 55 g | For the fight your Move values are **+2** |
| **Potion of the Bear** | 60 g | For the scene, **carry +20 kg** and ✊ Might **+2** |
| **Philtre of Borrowed Courage** | 65 g | For the fight you cannot be **Compelled** |
| **Potion of the Owl** | 70 g | For the fight **no square is shadowed** for you |
| **Draught of Second Breath** | 90 g | **Catch Breath** without spending your turn |
| **Potion of the Quick Hand** | 110 g | **One extra reaction** this round |
| **Potion of Iron Skin** | 120 g | For the fight, **armor +2** |
| **Greater Healing Potion** | 150 g | **Heal 8** |
| **Elixir of the Long Night** | 200 g | **+6 temporary Health.** It fades at your next rest |

**Potion of Stone is the cheap one that is also a decision**, and it is here to prove a potion need
not be a strict gain: immovable and immobile at once, which is magnificent on a bridge and suicidal
against archers — mobility being worth 29.5 points in exactly those fights
([../sim/analysis-2026-10-30.md](../sim/analysis-2026-10-30.md) §6).

**Tincture of the Clear Eye costs 30 gold and that is deliberate.**
[conditions.md](conditions.md) §10 records the worry: *a potion that removes any condition would make
gold the counter to half the game's content*. **Shake Off 1** is the weakest rung there is, and
simulation put a dispel on an action card at **−2.1 points of win rate** (analysis §4) — so the cheap
generic answer is cheap precisely because it is nearly worthless, and the narrow ones (Antidote,
Cleansing Draught) cost more for doing more.

### 8.3 Magical ammunition

The rule is core-rules §4: **ordinary ammunition is not tracked, magical ammunition is, nocking it is
free, and it is gone whether the shot lands or misses.**

> **This is how an archer gets what a caster has.** A caster prepares spells and decides before the
> fight what they can do. An archer carries shafts and decides the same way — so this list is
> deliberately built out of **conditions**, which is the one place in the rules where coin buys one.

| Ammunition | Value | For | Does |
|---|---|---|---|
| **Blunt Head** | 20 g | bow, crossbow | The target is **Off-Balance (1)**. No save |
| **Bodkin Points** | 25 g | bow, crossbow | **Ignores 2 armor** |
| **Hollow Bolt** | 30 g | crossbow | Carries one **potion**. Whatever you hit drinks it |
| **Screaming Shaft** | 35 g | bow | **Dazed (1)**, resist 👑 Presence 5 |
| **Chalked Shaft** | 40 g | bow, crossbow | The target is **Marked (1)**. No save |
| **Moth-wing Fletching** | 40 g | bow | This shot **ignores cover** entirely |
| **Oil-wrapped Shaft** | 45 g | bow, crossbow | **Burning 1 (2)** |
| **Net Bolt** | 50 g | crossbow | **Grappled (1)**, resist ✊ Might 5 |
| **Whistling Shaft** | 55 g | bow | The target is **Compelled (1)** — at you |
| **Frost-dipped Bolt** | 60 g | crossbow | **Frozen 1 (1)** |
| **Grapnel Bolt** | 70 g | crossbow | **You** are pulled to a square adjacent to the target |
| **Thunder-shot** | 80 g | **firearm only** | The shot is ✸ **Blast 1** on the target's square |
| **Silvered Head** | 90 g | bow, crossbow | You may target an **Invisible** enemy you have seen this fight |

**The Hollow Bolt is the best thing on this page** and it costs 30 gold: it turns every potion in §8.2
into a ranged attack, which means a party with an archer can deliver a Tincture of the Clear Eye to
an ally across the battlefield — or an Elixir of the Long Night, or a Potion of Stone to somebody who
did not ask for one. One item multiplied by thirteen.

**The Grapnel Bolt moves the shooter, not the target**, which is the only thing on the list that does.
An archer who wants to be somewhere is usually an archer who wants to be somewhere *else*, so this is
the odd one: a bolt for closing, and the Acrobat and the Scout are the two who would want it.

**Thunder-shot is firearm-only and that is the point.** Nothing else in the catalogue gives a
non-caster an **area**, and §11 is explicit that Blast is the cheap kind — so an arquebus with a
thunder-shot is the one way a Musketeer answers a crowd.

---

## 9. Magic items — three crafts, three groups

The world document names three makers and they divide cleanly, onto three **bonus groups** (§5) of
which two had nothing in them at all:

| Craft | Group | What it does |
|---|---|---|
| **Smiths** — *"exceptional weapons and armour"* | **Make** | a better number on a mundane thing. Not magic: excellence |
| **Jewellers** — *"magical jewellery"* | **Power** | helps you channel — casting, faith, focus |
| *true enchantment* | **Wonder** | something no mundane item can do at all |

**One bonus per group per check** (§5), so a smith's sword and a smith's armour do not stack with each
other on the same roll, and a Wonder never competes with a Tool.

### 9.1 Smith-work — Make

| Item | Slot | kg | Value | Line |
|---|---|---|---|---|
| **Fine Longsword** | 1 hand, Back | 2 | 90 g | Strike 3 · **+1 Strike** (Make) |
| **Smith-forged Plate** | Body | 18 | 1200 g | Armor 4 — and **2 kg lighter** than plate, which is the whole craft |
| **Masterwork Crossbow** | 2 hands, Back | 3 | 300 g | Strike 4, range 8, ignores 1 armor · **reloads on a free hand**, not a Ready |
| **Balanced Dagger** | 1 hand, Belt | 0 | 70 g | Strike 3, **range 5 thrown** — a smith's dagger throws further than anyone's arm |
| **Proofed Mail** | Body | 9 | 320 g | **Armor 3 at 9 kg** — brigandine's protection at mail's weight, and no Sidestep penalty |

**The masterwork crossbow is the best thing on this page and it is not magic**, which is the point of
the Make group: it buys back the **Ready**, and a crossbow that fires every turn is a different weapon
from one that fires every other turn (§3).

### 9.2 Jewellery — Power

| Item | Slot | kg | Value | Line |
|---|---|---|---|---|
| **Focus Pendant** | Neck | 0 | 400 g | **+1 to all ✦ Cast** values (Power) |
| **Ring of the Open Hand** | Fingers | 0 | 600 g | You may ✦ Cast without a free hand |
| **Reliquary Band** | Fingers | 0 | 350 g | **+1 slot** of formula strength you may prepare |

**The Ring of the Open Hand answers a rule rather than a number**, which is the better kind of magic
item: core-rules §4 says a prepared spell needs a free hand, and this is the one thing in the game
that says otherwise — the Half-mage's tactic bought with coin instead of a node.

### 9.3 Wonders

The group that had nothing in it. **An active wonder is Drained when used and comes back on its
recharge** (§4), and core-rules §4 is explicit that **passive is dearer than active** — so the two
passive entries here cost three times what the active ones do.

| Item | Slot | kg | Value | Line | |
|---|---|---|---|---|---|
| **Cloak of the Grey** | Cloak | 1 | 500 g | **Drain:** become **Invisible (1)**. *Recharge: combat.* | active |
| **Amulet of the Mended Thread** | Neck | 0 | 800 g | **Drain:** when you would drop to 0 Health, drop to **1**. *Recharge: long rest.* | active |
| **Boots of the Long Step** | Feet | 1 | 450 g | **Drain:** teleport to any square you can see within 6. *Recharge: combat.* | active |
| **Helm of the Watchful** | Head | 2 | 1500 g | Armor 1, you are **never surprised**, and you cannot be **Dazed**. | **passive** |
| **The Quenched Blade** | 1 hand, Back | 2 | 2000 g | Strike 3 · on a hit, **Burning 1 (1)**. | **passive** |

**The Amulet is The First's miracle for sale**, and it should cost what it costs: *What Does Not Die*
(way-cards §3.5) asks a priest for a spell slot **for ever** every time it saves them, and the amulet
asks for a long rest. 800 gold is the difference between a god's price and a jeweller's.

**The Helm of the Watchful is the most expensive thing here because it is passive**, and that is the
§4 rule doing its job: never surprised and never Dazed, every fight, with nothing to spend and nothing
to remember. Dazed costs its victim 4.0 points of win rate
([analysis §9](../sim/analysis-2026-10-30.md)), so an item that simply deletes it is worth more than
any Drain.

### 9.4 What makes loot various: one item per mechanic

A longer list of **+1 swords** is not variation. The generative question is *what in the game does
this item let you touch*, and the answer makes loot interesting for the same reason the magic schools
are interesting — it is about **access**, not numbers.

> **A magic item is the one thing in the game that can hand a non-specialist somebody else's
> mechanic.** A tactic belongs to a node and cannot be found; an item can be. That is what makes a
> find worth being excited about.

**Two rules, and the first is the one that protects the Ways.**

**1. Loot may hand you somebody else's *mechanic*, never somebody's *Signature*.** *Marked* is a
mechanic, so an arrowhead that sets it is fine — the Shade's advantage over the finder is that they do
it every turn for free, where the arrowhead does it once a fight. But *"for you the Wound threshold is
4"* **is** the Executioner's Signature, so no item may say it. An item that prints a Signature retires
a node.

**2. The greater it is, the more it takes.** Minor and lesser items are free; a **relic** carries an
**obligation**, which is the same price every magic school pays and uses the machinery
[leveling.md](leveling.md) §4 already built. Relics take the loosest rung — *in text* — because a
sentence everybody at the table can read is enough when the item is the reason they can read it.

#### The coverage audit

Of the mechanics the rules contain, **fourteen had no item touching them at all** before this pass.
One each, so the next question is always *what is still uncovered*:

| Mechanic | Item | Tier |
|---|---|---|
| **Strain** | Tinker's Thimble | minor |
| **Spent** | Whetstone of the Last Edge | minor |
| **Rest tokens** | Pilgrim's Shoes | minor |
| **Foresee** | Cracked Spyglass | minor |
| **Carry** | Quartermaster's Belt | lesser |
| **Deck size** | Deep Pockets | lesser |
| **Block** | Gorget of the Turned Blade | lesser |
| **Initiative** | Hourglass Charm | lesser |
| **Openings — Marked** | Marked Arrowhead | lesser |
| **Openings — Judged** | Accuser's Ring | lesser |
| **Lift** | Beggar's Bowl | lesser |
| **High ground** | Cairn Stone | lesser |
| **Forced movement** | Hollow Boots | lesser |
| **Read N / the fate deck** | Gambler's Coin | lesser |
| **Wounds** | Surgeon's Pin | greater |
| **Taint** | Pact Iron | greater |
| **Corrode** | Reaver's Edge | greater |
| **Encumbrance** | Mantle of the Unburdened | greater |
| **Hand size** | Crown of the Quiet Mind | greater |

> **Brace is deliberately absent and always will be.** It is universal and never blocked on purpose,
> so [specializations.md](specializations.md) withdrew it as a candidate lever for a *node* — and an
> item that Braces harder is the same mistake with a price tag. **Brace is the one mechanic in the
> game that must not become anybody's identity**, bought or earned.

#### 9.5 Minor wonders — 50 to 150 gold

Small, situational, and the kind of thing a party actually finds. None of them changes a fight; each
changes one turn in it.

| Item | Slot | kg | Value | Line |
|---|---|---|---|---|
| **Whetstone of the Last Edge** | Pack | 1 | 60 g | **Drain:** one **Spent** card returns to your discard. *Recharge: long rest.* |
| **Tinker's Thimble** | Fingers | 0 | 80 g | ⤵ **Strain** costs you one card fewer, to a minimum of 1. |
| **Pilgrim's Shoes** | Feet | 1 | 90 g | One extra **rest token** on every long rest. |
| **Cracked Spyglass** | Pack | 1 | 150 g | **Foresee** one extra type at the start of a fight. |

#### 9.6 Lesser wonders — 300 to 700 gold

One real effect each, and most of them **Drain** with a recharge, because core-rules §4 prices active
below passive.

| Item | Slot | kg | Value | Line |
|---|---|---|---|---|
| **Quartermaster's Belt** | Belt | 1 | 300 g | **Carry +15 kg.** |
| **Hollow Boots** | Feet | 1 | 350 g | **Drain:** **shove** an adjacent enemy 2 squares. *Recharge: combat.* |
| **Marked Arrowhead** | Belt | 0 | 350 g | **Drain:** one enemy you can see is **Marked (1)**. *Recharge: combat.* |
| **Deep Pockets** | Cloak | 1 | 400 g | Your action deck maximum is **+2**. |
| **Cairn Stone** | Pack | 4 | 450 g | Set it down. Its square is **high ground** for the rest of the fight. |
| **Gorget of the Turned Blade** | Neck | 1 | 450 g | **Drain:** ⚡ **Block 3** as a reaction. *Recharge: combat.* |
| **Accuser's Ring** | Fingers | 0 | 500 g | **Drain:** one enemy within 3 is **Judged (1)**. *Recharge: combat.* |
| **Beggar's Bowl** | Pack | 1 | 500 g | **Drain:** ✋ **Lift** Blessed or Cursed from anyone adjacent. *Recharge: long rest.* |
| **Warden's Seal** | Fingers | 0 | 500 g | **+1 to all 🛡 Defend values** (Power). |
| **Hourglass Charm** | Neck | 0 | 550 g | **Drain:** swap your place in the initiative order with a willing ally. *Recharge: combat.* |
| **Gambler's Coin** | Fingers | 0 | 600 g | **Drain:** **Read 3** on your own fate deck. *Recharge: combat.* |

**The Marked Arrowhead and the Accuser's Ring are the two that matter most for a party**, because an
**opening** is read by *everybody's* cards (core-rules §7). A party with no Shade and no priest could
not set one at all; now they can find one, once a fight, which is exactly the access a magic item
should sell.

#### 9.7 Greater wonders — 800 to 2000 gold

| Item | Slot | kg | Value | Line |
|---|---|---|---|---|
| **Surgeon's Pin** | Neck | 0 | 900 g | **Drain:** remove one **Wound** from an ally. *Recharge: long rest.* |
| **Mantle of the Unburdened** | Cloak | 1 | 900 g | You are never **Burdened** or **Overloaded**, whatever you carry. |
| **Reaver's Edge** | 1 hand, Back | 2 | 1300 g | Strike 4 · on a **Critical**, ⚗ **Corrode 1**. |
| **Crown of the Quiet Mind** | Head | 1 | 1400 g | **Hand size +1.** |
| **Pact Iron** | Fingers | 0 | 1600 g | **Drain:** one **Taint** card is set aside for the rest of the fight. *Recharge: long rest.* |

**The Mantle is the counterpart to Plate**, and the pair is the best decision in the catalogue: Plate
buys 4 armor at 20 kg and makes **Burdened** one bad decision away (§1.2), and the Mantle removes the
risk for 900 gold. Together they are the Ironclad's build, bought rather than earned — except that the
Ironclad's Signature *wants* to be Overloaded, so the Mantle is the one item that would **ruin** them.
Loot that is wrong for a build is as good a find as loot that is right.

#### 9.8 Relics — and what they take

Four, and each carries an **obligation** the GM writes down and holds
([leveling.md](leveling.md) §4). They are not better than the greater wonders by much; they are
*different*, because they have a price, and that is what makes them worth naming.

| Relic | Slot | Value | Line | **Obligation** |
|---|---|---|---|---|
| **Sessyfyn's Tear** | Neck | 3000 g | **Drain:** any one fate draw on the field is drawn again. *Recharge: combat.* | A permanent **Miss** *and* a permanent **Critical** in your fate deck — the goddess's own price |
| **The Black Lantern** | 1 hand | 3500 g | Every square within 3 is **shadowed**, your enemies' squares included. | You may never carry any other light, ever |
| **The Hungry Blade** | 1 hand, Back | 4000 g | Strike **5** · when it kills, heal **2**. | A **bound Taint** the first round each fight it does not kill |
| **The Pale Crown** | Head | 5000 g | **+2 spell slots.** | You may never wear armour, and **nobody but you** may heal you |

**Sessyfyn's Tear charges the god's own obedience**, which is the right way to price a relic of hers:
way-cards §3.5 asks a priest of Sessyfyn for exactly that Miss and Critical, and the Tear asks it of
anybody. **The Black Lantern is the only item in the game that makes the battlefield worse for
everyone**, which is what a Shadow mage wants and nobody else does. And **The Hungry Blade punishes
you for carrying it badly** rather than for carrying it, which is the most interesting shape an
obligation can have: it is free in the fights it is built for.

#### 9.9 The conditions no item could inflict

The last coverage pass (§9.4) filled the **systems** — Strain, Spent, initiative, Lift. It left the
**conditions**: nine of them could be suffered and no item could cause one. These are the nine, and
every one is a **Drain** with a recharge, because an item that applies a condition every turn is a
specialization and not a thing you buy.

| Item | Slot | Value | Line |
|---|---|---|---|
| **Loose Cobble** | Pack | 300 g | Set it down. The first enemy to enter its square is **Off-Balance (1)** |
| **Drowned Bell** | Belt | 400 g | **Drain:** everything within 2 is **Wet (1)**. *Recharge: combat.* |
| **Hooked Gauntlet** | 1 hand | 600 g | **Drain:** an adjacent enemy is **Disarmed (1)**, resist ✊ 5. *Recharge: combat.* |
| **Thunderstone** | Pack | 650 g | **Drain:** one enemy within 3 is **Stunned (1)**, resist ✊ 7. *Recharge: combat.* |
| **Gag of the Nine** | Neck | 700 g | **Drain:** one enemy within 3 is **Silenced (1)**, resist 📜 5. *Recharge: combat.* |
| **Winter Cloak** | Cloak | 750 g | **Drain:** everything adjacent to you is **Slowed (1)**. *Recharge: combat.* |
| **Serpent's Tooth Ring** | Fingers | 850 g | **Drain:** one adjacent enemy is **Poisoned 1 (2)**. *Recharge: combat.* |

**Gag of the Nine is the one to be careful with.** Silenced is the only condition that can empty a
turn and it does so only to casters (core-rules §7), so an item that hands it out for 700 gold is a
*specific* answer to enemy magic — which is good, and is why it is a Drain at range 3 rather than
something you do every round. A party that keeps meeting mages should be able to buy a gag; a party
that buys two should not get to silence everybody.

**Loose Cobble is not a Drain and is the cheapest thing here**, because it is a trap: you set it
down, somebody walks into it, and that is the whole item. It is the Trapmaker's *Set* without the
Trapmaker, which is the access rule (§9.4) working exactly as written — a mechanic, not a Signature.

#### 9.10 The systems still untouched

| Item | Slot | Value | Line |
|---|---|---|---|
| **Locked Casket** | Pack | 500 g | Holds one **secret**. Nobody but you may learn it, by any means |
| **Surveyor's Chain** | Pack | 600 g | In a challenge, your first **Progress** each scene is free |
| **Far-sight Monocle** | Head | 700 g | Your **Ranged** items' range is **doubled** |
| **Mnemonic Stone** | Fingers | 800 g | One extra **skill card** in your skill deck, of any approach you already have |
| **Vagrant's Charm** | Neck | 950 g | You are never **Exhausted** |
| **Discriminating Wand** | 1 hand | 1100 g | Your ✸ **Blasts** count as ✵ **Aimed** |
| **The Scrivener's Knife** | Pack | 1200 g | **Drain:** **prune** one card from your action deck for the rest of the day. *Recharge: long rest.* |

**The Discriminating Wand is the most expensive thing that does no damage**, and §11 says why: *"Aimed
belongs on precise or discriminating magic, and should cost more — a higher-tier item, a
specialization, or a formula with a price attached."* This is that item, and it is 1100 gold because
the alternative is standing somewhere else.

**Vagrant's Charm reaches the one state that is nobody's fault.** Exhausted comes from an empty draw
pile (core-rules §8) — it is not inflicted and it cannot be resisted, and until now nothing in the
game answered it but a Catch Breath. 950 gold for never being caught with an empty deck is the kind
of thing a veteran should be able to buy.

**The Scrivener's Knife is the only item that touches deck-building mid-campaign.** Simulation is
blunt about pruning: a 12-card deck pruned *well* matches a full 16 and pruned *badly* collapses to
45% ([leveling.md](leveling.md) §4). So an item that prunes on demand is worth 1200 gold and is also
a rope to hang yourself with.

#### 9.11 One more relic

| Relic | Slot | Value | Line | **Obligation** |
|---|---|---|---|---|
| **The Unquiet Quiver** | Back | 4500 g | Every piece of **magical ammunition** you fire returns to it when the fight ends. | It will not hold ordinary arrows, and you may carry **no other quiver** |

**It is the most expensive relic and it does nothing at all on its own**, which is what makes it
interesting: it is worth exactly as much as the ammunition you own (§8.3). A bare quiver is 4500 gold
of nothing; a quiver and a dozen silvered heads is an archer who never runs out of the right answer.
And the obligation is the sharpest in the catalogue — **no ordinary arrows** means that when the
magic runs out you are holding a stick.

## 11. Identified, unidentified, and cursed

### 11.1 An unidentified item may be used

> **You can swing an unmarked blade. You simply do not know what you are swinging.**

That is the whole rule, and it is what makes everything in this section work. An unidentified item
equips, holds, fires and drinks exactly as it would if you knew what it was; what you lack is the
**text**, and the sheet shows you what it *looks* like instead — *a plain ring*, *a dark bottle*, *an
unmarked sword*.

- **Mundane items are identified by default.** A sword needs no examining. Only something with a
  **bonus group** — Make, Power, Wonder — is ever worth the trouble.
- **The GM reads the real fields off the same slate.** There is one item, not two, and the player's
  side is hidden rather than absent.
- **Using it reveals what it does, not what it costs.** You find out a ring makes you faster the
  first time you move. You find out it will not come off when you try to take it off.

### 11.2 Identifying: the craft that made it is the craft that knows it

The world document names three makers, and they are the three answers
(`worldinfo/Firma.md`, *Non-magical specialities*):

| Who | Identifies |
|---|---|
| A **smith** | weapons, armour, anything of the **Make** group |
| A **brewer** | potions, poisons, anything drunk or applied |
| A **jeweller** | rings, amulets, anything of the **Power** group |
| **Nobody reliably** | a **Wonder**, and a **relic** never |

Failing that, or for a Wonder: a **📜 Lore check in downtime**, Normal **5** for a Make or Power
item and **Hard 7** for a Wonder ([skill-rules.md](skill-rules.md) §2). A **relic** is not identified
by a check at all — somebody has to know its story, which is a scene rather than a roll.

**Divination identifies by asking.** *The Long Look* (way-cards §3.4) buys one true answer about the
next scene, and *"what is this?"* is a question. It costs three slots and a prophecy, which is the
right price for skipping the queue at the jeweller's.

### 11.3 A cursed item is an obligation you picked up

> **The curse is not a surprise mechanic. It is [leveling.md](leveling.md) §4's obligation, found
> rather than owed.**

Which means the rules for it already exist and need no additions:

- **It cannot be removed.** Not by taking it off, not by a rest, not by a level.
- **The text names the one thing that lifts it** — and the price should be what the curse bought,
  the same rule a necromancer's bound Taint follows.
- **It binds in text**, the loosest rung, because an item everyone at the table can read the curse
  off *is* the enforcement.

**The best disguise for a cursed item is a real one**, and three of the six below are built that way:
the *Ring of Open Hands* beside the genuine *Ring of the Open Hand*, the *Cloak of the Grey Road*
beside the *Cloak of the Grey*, the *Amulet of the Fed Thread* beside the *Amulet of the Mended
Thread*. A party that has heard of the good one is exactly the party that will put the bad one on.

### 11.4 The cursed items

| Item | Slot | Looks like | Does | **Curse** |
|---|---|---|---|---|
| **Blade of the Eager Hand** | 1 hand | an old sword, very sharp | **Strike 5** | You must ⚔ Strike the **nearest** living creature every turn, ally or not. *Lifted by:* a Cleansing |
| **Ring of Open Hands** | Fingers | a plain silver ring | You may ✦ Cast without a free hand | You may **never hold anything** in your other hand again. *Lifted by:* the jeweller who made it, who is dead |
| **Cloak of the Grey Road** | Cloak | a grey travelling cloak | **Drain:** **Invisible (1)**. *Recharge: combat* | Allies may not target you with **anything beneficial** either. *Lifted by:* a cure |
| **Boots of the Longer Step** | Feet | good boots, barely worn | Your Move values are **+2** | You may **never end your turn** in the square you began it in. *Lifted by:* walking a pilgrimage barefoot |
| **Amulet of the Fed Thread** | Neck | a knotted thread in amber | **Drain:** drop to **1** instead of 0. *Recharge: long rest* | Each time it saves you, **one ally takes 3 damage**. *Lifted by:* dying anyway |
| **Gauntlet of the Open Palm** | 1 hand | a fine plated gauntlet | **+1** to all 🛡 Defend | You may **not hold a weapon** in that hand. *Lifted by:* a Cleansing |

**Four of the six are strictly good until they are not**, which is the only honest way to write a
curse: *Boots of the Longer Step* really do give +2 Move, and a Trapmaker or an Artillerist — whose
whole tactic is standing still (way-cards §2.5) — has just bought a disaster. **A curse should punish
a build, not a player.**

**The Blade of the Eager Hand is the exception and it is the loud one.** Strike 5 is a greatsword in
one hand, and the price is that you cannot choose your target — which in a party is a betrayal
waiting for a bad initiative order, and alone is nearly free. **It is a wonderful weapon for somebody
fighting on their own**, which is the most interesting thing a curse can be.

### 11.5 Bad potions

An unidentified bottle is the oldest gamble there is. These are what it might be.

| Potion | Value | Looks like | Does |
|---|---|---|---|
| **Grey Water** | 5 g | any potion at all | **Nothing.** It is water |
| **Draught of Lead** | 20 g | Potion of Iron Skin | For the fight, your **Move is 0** |
| **Oil of Mislaid Courage** | 20 g | Philtre of Borrowed Courage | For the fight you may **play no reactions** |
| **Draught of the Hollow** | 25 g | Draught of Second Breath | For the fight your **hand size is 1 lower** |
| **Bottle of Borrowed Pain** | 30 g | Healing Potion | **Heal 4** — and take **4** when the fight ends |
| **Philtre of the Loose Tongue** | 15 g | Brewer's Reserve | You must **say what you intend** before each of your turns |

**Grey Water is the most important entry on this page.** It costs 5 gold, it does nothing, and it is
what makes every other unidentified bottle frightening — because the party cannot tell by looking,
and the cheapest possibility is also the most likely. **A gamble with no blank outcome is not a
gamble.**

**Bottle of Borrowed Pain is the one that is sometimes correct.** Heal 4 now and 4 at the end is a
loan, and a loan is a good deal in the fight you were about to lose.

### 11.6 Poisons

**Applying a poison is a ⇄ Ready** — the same verb a crossbow reloads with — and the next ⚔ Strike
that connects delivers it. One application, whether it lands or not.

> **Ammunition is how an archer buys a condition. Poison is how everybody else does** (§8.3). The
> two lists rhyme on purpose, and both cost coin rather than a node, which is the point: *a mechanic
> can be bought, a Signature cannot* (§9.4).

| Poison | Value | Delivers |
|---|---|---|
| **Blade Venom** | 40 g | **Poisoned 1 (2)**, resist ✊ Might 5 |
| **Drowsing Oil** | 50 g | **Dazed (2)**, resist ✊ Might 5 |
| **Weeping Resin** | 60 g | The target **cannot be healed** for 2 rounds. No save |
| **Serpent's Milk** | 70 g | **Poisoned 0 (3)** — no damage, three rounds without a secondary |
| **Grave-cap Extract** | 90 g | **Poisoned 2 (2)**, resist ✊ Might 7 |
| **Assassin's Tincture** | 120 g | **Poisoned 1 (2)**, and it does not bite until the **start of their next turn**. No save |
| **Black Lotus** | 250 g | **Poisoned 3 (2)**, resist ✊ Might 9. Illegal in every district of Firma |

**Why a 40-gold flask is not better than the Poison school.** *Wither* is a strength-2 formula that
does what Blade Venom does — but the formula is **repeatable** and the flask is **one Strike**, and
the flask costs a Ready that the caster does not pay. That is the same relationship a Healing Potion
has to a healing spell, and it is why coin never retires a caster.

**Weeping Resin is the one with no equal anywhere.** Nothing else in the game stops healing, and
against a party with a priest that is worth more than damage — which makes it the poison an enemy
assassin should be carrying, rather than one the players will often want.

**Assassin's Tincture pays for its lack of a save with a delay**, and the delay is the interesting
part: the target gets one clean turn, so a poisoner who uses it is betting on the fight lasting.

---

## 12. Open

- **Settled: all of it is in the system** — **150 items** in `content.mjs`, up from nine. **Forty
  three wonders**, 5 relics, 6 smith-works, 7 jeweller's pieces, **18 potions** (6 of them bad), **13
  pieces of magical ammunition**, **7 poisons** and **6 cursed items**. The validator checks the count, that every key exists on the schema, that no bonus group
  is left unused but `body` and `training` (which belong to features), that the magic items still
  reach **every** mechanic §9.4 lists, that **nothing touches Brace**, that **no relic is free of
  its obligation**, that **a potion is simply drunk** rather than thrown, and that **every piece of
  ammunition is spent** and carries no verb line of its own. And on the cursed side: every curse must
  **arrive unidentified**, must **name the one thing that lifts it**, and every unidentified item must
  say **what it looks like** — because a gap where the disguise should be gives the secret away as
  surely as the text would.

  **The schema did need two changes, and the second explains an old absence.** An item's `bonus` was
  **combat-verb shaped only**, so *"🌑 Shadow +2 on locks and mechanisms"* could not be written
  down — which is why the eight tools documented since the first draft had never been entered.
  Neglect was not the reason; the field was. And items had no `grants`, so a ring meant to give a
  spell slot gave nothing at all, silently, which is the failure mode a data model has: it **drops**
  a key it does not know rather than refusing it.
- **[OPEN]** **A mount.** The Lance needs one, the Culverin implies draught animals, and
  [conditions.md](conditions.md) §4.2 settled only that a mount is *not* a condition. Its Move,
  Health, turn and the rules for being unhorsed are all unwritten.
- **[OPEN]** **Nothing on this page is simulated.** The two numbers most worth measuring are the
  **armour ladder** — armour is a cliff edge and Plate at 4 against Leather at 1 has never been run —
  and **reload**, since every firearm and crossbow turns on a ⇄ Ready whose value was only measured
  once, for a slung bow.
- **[OPEN]** **Nothing in the engine enforces a curse.** `curse` is a string and `identified` a
  boolean, and both are honest records the GM reads — but nothing stops a player unequipping a cursed
  item, and the sheet does not yet use `shownName` to hide an unidentified one. That is the same
  `[OPEN]` [leveling.md](leveling.md) §4 already carries for prohibitions in general: *"you may not
  wear armour" needs the HUD or the rules to stop it, or it is a text obligation after all.* A cursed
  item is the first case where that gap is visible at the table.
- **[OPEN]** Whether **ignores N armor** should be a tag rather than text on the verb line. Three
  weapon families use it now; a fourth would make it a tag.
- **[OPEN]** **Who sells what.** A hundred and thirty-one items and no rule for where any of them
  is bought. The world document names the crafts — smiths, brewers, jewellers — and
  [skill-rules.md](skill-rules.md) §6 has downtime; what is missing is the sentence that says a town
  has a brewer, a city has a jeweller, and a relic is never for sale.
- **[OPEN]** **Loot tables.** Ninety-one items and no rule for what a party finds, where, or how
  often. The tiers in §9.5–9.8 are priced for it — minor, lesser, greater, relic — and the thing
  still missing is the table that says a kobold warren yields minor and a dragon yields a relic.
  [leveling.md](leveling.md) §4 is firm that **gold is not a levelling reward**, so loot is the
  GM's lever and it has no guidance at all.
