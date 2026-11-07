# Art list

**588 pieces**, of which **588** are wired up. Generated from the game's own content by `test/art-list.mjs` — regenerate it rather than editing it, or it will disagree with the game the first time somebody adds a card.

## What to supply

| | |
|---|---|
| Ratio | **2:3** |
| Size | **640 × 960** (2×, for a 150px card on a retina display) |
| Format | **`.webp` at quality 80**, and nothing else: the generated original is transcoded and dropped. No transparency needed: the art is a full bleed |
| Crop | **Cover, never letterbox.** Art is supplied at the card's own ratio, so a crop is a rounding error |
| Safe area | Keep the subject off the **top 17%** and **bottom 32%**: the name sits on one and the halves on the other |

**Nothing is cropped.** The card is 2:3 as well, so art supplied at 2:3 fills it exactly. A file at some other shape still works &mdash; it is cover-cropped rather than letterboxed &mdash; but it will lose whichever dimension is long, so compose at 2:3 and nothing is lost.

**The art goes behind the face, not instead of it.** A face is rendered from data so that a condition can switch an individual icon off at runtime, so every card still draws its own name, halves and reaction row over the picture, on a scrim of the paper colour at 86%. That is also why there is no deadline: a card with no art looks exactly as it did before there were pictures, and the catalogue improves one file at a time.

**Where files go.** Anywhere in the world's files; the path is what matters. The suggested paths below keep a group together, and `cardrpg/art/` is as good a root as any:

```
cardrpg/art/cards/starter/strike.webp
cardrpg/art/signatures/shade/the-opening.webp
```

**How a path reaches the game.** Add `art: "..."` to the piece's definition in `module/content.mjs`. No schema change is needed, because Foundry already has a slot for every one of these and this system used none of them: **a Card face's `img`** for a card, **an Item's `img`** for an item, feature, weapon or piece of gear, and **an Actor's `img` plus its prototype token's texture** for a creature — one file in those last two, which is why a creature is one piece and not two.

> **This was true of cards and false of everything else until today.** An item's `art` fell into the rest of its definition and settled in `system.art`, which nothing reads, so 176 of the pieces in this brief had a path in content that no document ever wore. The levelling graph reads `art` straight out of content and draws it on a node, which is why a feature's picture appeared there and nowhere else, and why nobody noticed.

Anything under `icons/svg/` is ignored on purpose: that is Foundry's own placeholder set, and a generic bag icon stretched across a card is worse than no art at all.

## What to supply — tokens

**A token is a different shape from a card**, and the groups below marked *token* follow this table instead of the one above. A card is a landscape you look at; a token is a creature seen from the table, sitting on a square of map with other tokens beside it.

| | |
|---|---|
| Ratio | **1:1** |
| Size | **512 × 512** |
| Format | **`.webp` at quality 80**, and **transparency is required**: a token sits on the map, not in a frame, so a background is a square of the wrong colour around the creature |
| Framing | **The creature fills the square**, head to foot or nose to tail. Nothing is printed over a token, so there is no safe area — but Foundry draws a health bar under it and a nameplate below that, and both sit outside the image |
| Facing | **Top-down or three-quarter, consistently.** Whichever the table picks, every creature wants to match: one top-down dragon among forty portraits reads as a mistake |

**One picture, both slots.** Foundry keeps a portrait on the actor and a token on the map, and a creature wants the same file in each — the same argument a deck back makes. A separate portrait is a field to add the day somebody wants one, not a field to leave empty until then.

## What does not need art

- **Fate cards.** Twenty cards that are a number and a reshuffle marker. They want a *design* — a back, a Miss, a Critical — not twenty illustrations.
- **Wounds and Taint.** Two faces, fixed, and both are meant to read as damage rather than as content. One picture each at most.
- **The levelling graph's nodes.** A node wears the art of what it hands over, so drawing a Signature draws its node too. Nothing needs art of its own.
- **The twist deck.** 8 kinds, 30 cards, and a twist is a NAME and a COST rather than a picture. It is the GM's own deck and wears the skill back, because art for a deck one person ever sees is art nobody at the table looks at.
- **The 0 tagged creatures.** Elves, trolls, dragons and the rest are in the content as a name and a list of capabilities, with no numbers and no actor — so there is nothing yet for a picture to be of. They arrive in the brief when they arrive in the game.

## Deck backs — draw these first

**A back is one picture per deck, not one per card**, and it does one job: it says which deck a face-down card came from. 10 pictures against 578 faces — and these are what a table looks at all evening, since a deck is face down from the first second of play.

**10 pieces**, 10 wired up. Same 2:3 and 640 × 960 as a face, and **no safe area**: nothing is printed over a back, so the whole card is yours.

| | Deck | What it is for | File |
|---|---|---|---|
| ✓ | **The action deck** | Face down in front of every player, all game. Cards from the common pool and all four Ways mix in one deck, so this is NOT a Way's back -- the deck is yours, not Shade's. | `backs/action.webp` |
| ✓ | **The fate deck** | The back players see most: it is shuffled and face down by design, and that is what makes a thin deck a risk rather than a lookup. Twenty cards, drawn from constantly. | `backs/fate.webp` |
| ✓ | **The skill deck** | What you do when you are NOT fighting: climbing, listening, lifting, picking a lock, talking someone round. **No weapon of any kind on this one** -- no blade, no point, no hilt, no arrowhead. A hand, a key, an eye, a knot, a lens: the tools of a scene. It has to read as clearly NOT the action deck at a glance, since both are face down in front of the same player. | `backs/skill.webp` |
| ✓ | **The item deck** | Your gear, face down. **A strap through a plain square buckle, seen flat and from the front**, the tongue centred and the strap running off both top and bottom edges. A buckle is the one thing every carried object in this game has in common and it is bilaterally symmetrical by construction. **No weapon, no blade, no pack, no pile of loot** -- one fastening, drawn large, with bare paper either side of it. | `backs/item.webp` |
| ✓ | **The feature deck** | What is permanently true about you. **A keystone at the top of a shallow arch**: the wedge-shaped stone dead centre, two or three voussoirs falling away to left and right, and nothing above it. A feature is always on and load-bearing, and a keystone is the stone that holds the rest up while doing nothing at all. **Not a laurel, not a crest, not a shield shape** -- masonry, with the joints drawn. | `backs/feature.webp` |
| ✓ | **The condition deck** | What has been put on you, and what will wear off. **A plain open iron band -- a collar or a manacle -- hinged at the bottom centre and standing open**, the two halves rising symmetrically and not quite meeting at the top. Open, because a condition ends. **No chain, no lock, no key, no wrist and no neck in it** -- the band alone, and the gap at the top is the subject. | `backs/condition.webp` |
| ✓ | **The spell deck** | A caster's book, and the few pages of it ready today. **A closed book seen square from the fore-edge, spine away, so the picture is the page block itself** -- the stacked edges of the leaves drawn as fine horizontal lines, with three ribbon markers hanging from the middle of the block, the centre one longest. Symmetrical about the middle ribbon. **No cover decoration, no clasp, no strap, no buckle** (that is the item deck's device), and **no star, no pentagram, no rune, no candle and no hand** -- paper, thread and nothing else, with bare paper either side of the block. | `backs/spell.webp` |
| ✓ | **The twist deck** | The GM's deck, and the only one on their side of the table. Drawn when something goes partly wrong, so the back is a promise of a complication rather than a threat: **a fork** -- one line arriving and leaving as two, mirrored left to right, with open paper around it. No knot, no spiral, no coil: nothing that fills its own space or turns rather than mirrors. Not a weapon and not a monster -- the price of a Partial is never an attack. | `backs/twist.webp` |
| ✓ | **The Wild Magic deck** | Drawn only when a Wild comes out of a fate deck, so its back is a promise that something strange is about to happen. | `backs/wild.webp` |
| ✓ | **Intent, any creature** | The back on every creature's intent deck in the game. A face-down intent says *this thing is about to act*, and which thing it is is already on the table in front of you -- so the back carries the threat rather than the species. | `backs/npc.webp` |

**Wound and Taint have no back of their own, deliberately.** Both go *into* the action deck, and a Wound you could see coming would not be a Wound — they wear the action back like everything else in there, which is the whole threat.

**Hands, discards and Spent piles have no back either.** A hand is face up to its owner and a discard is face up to the table, so a back on one would be art nobody ever sees.

**One intent back serves all 112 creatures**, and no kind has one of its own. The argument for a goblin back — that a goblin's intents should be recognisable across the table as a goblin's — is a good one, and it loses to arithmetic. **Every creature in the roster is its own kind**, variants included: a Goblin Warrior is not a goblin as far as this lookup is concerned. So a back per kind is 112 pieces of art, bought to tell a player which creature a deck sitting in front of that creature belongs to. The builder still asks for a kind's own back before falling back to the common one, so a future exception costs one entry and no code.

## The starter deck

What a first session plays with. Draw these first: ten cards is a playable game.

**10 pieces**, 10 wired up. Suggested path: `cardrpg/art/cards/starter/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Advance** | Move 3 · / Move 2 | `cards/starter/advance.webp` |
| ✓ | **Draw Steel** | Strike · / Ready | `cards/starter/draw-steel.webp` |
| ✓ | **Heavy Swing** | Strike +1 ignores 2 armor · / Move 1 | `cards/starter/heavy-swing.webp` |
| ✓ | **Lunge** | Move 2, Strike · / Move 1 | `cards/starter/lunge.webp` |
| ✓ | **Quick Hands** | Use · / Ready | `cards/starter/quick-hands.webp` |
| ✓ | **Second Wind** | Heal 2 · / Use | `cards/starter/second-wind.webp` |
| ✓ | **Shield Up** | Defend Block applies to every attack until your next turn · / Move 1 | `cards/starter/shield-up.webp` |
| ✓ | **Strike** | Strike · / Move 1 | `cards/starter/strike.webp` |
| ✓ | **Taunt** | Compelled (1) · / Move 1 | `cards/starter/taunt.webp` |
| ✓ | **Weapon Swap** | Ready · / Strike | `cards/starter/weapon-swap.webp` |

## The common pool

Six cards every Way draws on, so each one is seen by every character in the game.

**6 pieces**, 6 wired up. Suggested path: `cardrpg/art/cards/common/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Both Hands** | Ready, Strike · / Ready | `cards/common/both-hands.webp` |
| ✓ | **Dig In** | Heal 2 · / Move 1 | `cards/common/dig-in.webp` |
| ✓ | **Hold the Line** | Defend · / Strike -1 | `cards/common/hold-the-line.webp` |
| ✓ | **Measure** | Strike +1 ignores Block · / Move 1 | `cards/common/measure.webp` |
| ✓ | **Off-Hand Blow** | Strike · / Strike -1 | `cards/common/off-hand-blow.webp` |
| ✓ | **Press** | Strike, Move 1 · / Move 2 | `cards/common/press.webp` |

## NPC intent cards

Face-up on the table during a fight, which makes them the art players stare at longest. **One pool, and every creature in the world draws the subset it has earned** (core-rules 9) — so a picture here is seen behind a goblin, a troll and a dragon, and wants to be the SHAPE of the move rather than a portrait of whoever is making it. *Close In* is a thing closing in.

**36 pieces**, 36 wired up. Suggested path: `cardrpg/art/cards/npc/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Bring It Down** | Strike ignores armour · Strike a door, a wall or a held position, ignoring its armour entirely. | `cards/npc/bring-it-down.webp` |
| ✓ | **Bull Through** | Move, Strike · Move your speed through a figure in the way, pushing it aside, then Strike. | `cards/npc/bull-through.webp` |
| ✓ | **Call More** | Something arrives at the edge of the scene. The GM says what and how much. | `cards/npc/call-more.webp` |
| ✓ | **Carry** | Move · A willing ally rides: it moves with you, and may still act when you stop. | `cards/npc/carry.webp` |
| ✓ | **Carry It Off** | Move · Move your speed, take hold of a figure already down, and leave with it. The Horde eats what it wins. | `cards/npc/carry-it-off.webp` |
| ✓ | **Charge** | Move, Strike +1 · Move double your speed in a straight line, then Strike. The distance is the damage. | `cards/npc/charge.webp` |
| ✓ | **Close In** | Move, Strike · Move your speed, then Strike. | `cards/npc/close-in.webp` |
| ✓ | **Drag Down** | Strike Grappled (1) · Strike; on a hit the target is Grappled and goes nowhere. | `cards/npc/drag-down.webp` |
| ✓ | **Envenom** | Strike · Strike; on a hit it carries whatever you carry. | `cards/npc/envenom.webp` |
| ✓ | **Fade** | Move, Strike Invisible (1) · Move your speed and become Hidden. You were never standing there. | `cards/npc/fade.webp` |
| ✓ | **Feed** | Strike, Heal · Strike an adjacent figure and heal what you took out of it. | `cards/npc/feed.webp` |
| ✓ | **Give Ground** | Move · Move your speed away from the nearest enemy. A hurt thing that can leave, does. | `cards/npc/give-ground.webp` |
| ✓ | **Go Under** | Move · Leave the map. Next round you arrive anywhere you could have walked to. | `cards/npc/go-under.webp` |
| ✓ | **Gorge** | Strike, Shake 1 · Strike, and eat what comes away: shake one condition off yourself. | `cards/npc/gorge.webp` |
| ✓ | **Hold the Line** | Defend, Block 1 range 1 · Defend, and an ally adjacent to you gains Block 1. | `cards/npc/hold-the-line.webp` |
| ✓ | **Knock It Down** | Strike Prone (1) · Strike with the whole weight of you; on a hit the target is Prone. | `cards/npc/knock-it-down.webp` |
| ✓ | **Lash Out** | Strike blast 1 · Strike every figure adjacent to you, friend or not. | `cards/npc/lash-out.webp` |
| ✓ | **Lie Still** | Nothing at all, and the next Strike you make cannot be answered by a reaction. | `cards/npc/lie-still.webp` |
| ✓ | **Long Arm** | Strike · Strike at reach without closing, and stay where you are. | `cards/npc/long-arm.webp` |
| ✓ | **Loose** | Strike · Strike at your weapon's range. | `cards/npc/loose.webp` |
| ✓ | **Open the Hold** | The belly splits along the seam: whatever it was carrying is on the ground beside it, and may act this round. | `cards/npc/open-the-hold.webp` |
| ✓ | **Order** | An ally within sight acts again, or moves its speed. You do nothing yourself. | `cards/npc/order.webp` |
| ✓ | **Pick the Soft One** | Move, Strike ignores Block · Move your speed and Strike whoever is least ready for it, round the shield rather than through it: Block does not answ... | `cards/npc/pick-the-soft-one.webp` |
| ✓ | **Press** | Strike, Strike -1 · Strike, and Strike again at −1. Nothing clever, twice. | `cards/npc/press.webp` |
| ✓ | **Set and Wait** | Defend · Defend, and keep a reaction for whoever comes. | `cards/npc/set-and-wait.webp` |
| ✓ | **Shelter** | Defend · Allies within 1 cannot be targeted at range while you stand. | `cards/npc/shelter.webp` |
| ✓ | **Spoil the Ground** | Ready · Nothing at anybody: one square within reach is a trap now, and stays one. | `cards/npc/spoil-the-ground.webp` |
| ✓ | **Spray** | Strike · Strike everything in the area, at range. Whatever you breathe, you breathe it on your own kind too. | `cards/npc/spray.webp` |
| ✓ | **Stoop** | Move, Strike · Arrive from above: move twice your speed, then Strike. | `cards/npc/stoop.webp` |
| ✓ | **Strike and Step** | Strike, Move · Strike, then move your speed away. | `cards/npc/strike-and-step.webp` |
| ✓ | **Submerge** | Move · Go under the water. Next round you surface anywhere along it. | `cards/npc/submerge.webp` |
| ✓ | **Swarm** | Move, Strike +1 · Move, then Strike at +1 for each ally already adjacent to your target. | `cards/npc/swarm.webp` |
| ✓ | **Take Stock** | Shake 1 · Nothing this round, and shake one condition off. | `cards/npc/take-stock.webp` |
| ✓ | **The Hive Obeys** | Three allies within sight each move their speed, or one of them acts twice. She does nothing herself but decide. | `cards/npc/the-hive-obeys.webp` |
| ✓ | **Thrash** | Strike blast 1, Move · Strike every figure adjacent to you, then move your speed away from all of them. | `cards/npc/thrash.webp` |
| ✓ | **Work the Weave** | Cast · Cast one from your own short list. | `cards/npc/work-the-weave.webp` |

## Way of Shade — pool

The minor-node cards of a built Way.

**12 pieces**, 12 wired up. Suggested path: `cardrpg/art/cards/shade/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Between the Plates** | Strike ignores armour vs Marked · / Move 1 | `cards/shade/between-the-plates.webp` |
| ✓ | **Call the Shot** | Strike · / Marked (1) · Marked on any enemy you can see, at any range. | `cards/shade/call-the-shot.webp` |
| ✓ | **Cut and Run** | Strike, Move 2 · / Move 1 | `cards/shade/cut-and-run.webp` |
| ✓ | **Light Feet** | Move 3 · / Move 2 · Ignoring difficult ground. | `cards/shade/light-feet.webp` |
| ✓ | **Mock** | Dazed (1) · / Move 1 | `cards/shade/mock.webp` |
| ✓ | **Pin the Shadow** | Strike Slowed (1) · / Move 1 | `cards/shade/pin-the-shadow.webp` |
| ✓ | **Second Knife** | Strike range 3 · / Strike -1 | `cards/shade/second-knife.webp` |
| ✓ | **Sleight** | Use, Strike · / Ready | `cards/shade/sleight.webp` |
| ✓ | **Slip the Knot** | Move 2 · / Shake 1 | `cards/shade/slip-the-knot.webp` |
| ✓ | **Smoke and Go** | Invisible (1), Move 2 · / Use · On yourself. | `cards/shade/smoke-and-go.webp` |
| ✓ | **Take the Shot** | Strike +1 · / Move 2 | `cards/shade/take-the-shot.webp` |
| ✓ | **Vanish** | Invisible (1) · / Move 2 · On yourself. | `cards/shade/vanish.webp` |

## Way of Strength — pool

The minor-node cards of a built Way.

**13 pieces**, 13 wired up. Suggested path: `cardrpg/art/cards/strength/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Armoured Advance** | Move 3 · / Move 1 · Your armor counts +1 until your next turn. | `cards/strength/armoured-advance.webp` |
| ✓ | **Beat the Blade** | Strike Disarmed (1) · / Move 1 | `cards/strength/beat-the-blade.webp` |
| ✓ | **Hammerblow** | Strike · / Move 1 | `cards/strength/hammerblow.webp` |
| ✓ | **Heave** | Move 2 · / Ready · Carrying any weight without being Slowed. | `cards/strength/heave.webp` |
| ✓ | **Overbear** | Grappled (2) · / Move 1 | `cards/strength/overbear.webp` |
| ✓ | **Pull Them Down** | Strike · / Strike -1 · The secondary only against a Prone or Grappled target. | `cards/strength/pull-them-down.webp` |
| ✓ | **Roar** | Compelled (1) · / Move 1 · Every adjacent enemy. | `cards/strength/roar.webp` |
| ✓ | **Shield Bash** | Strike · / Move 1 · No damage: push 2 and step into the square it left. | `cards/strength/shield-bash.webp` |
| ✓ | **Shield Wall** | Defend · / Defend, Block 1 area 1 | `cards/strength/shield-wall.webp` |
| ✓ | **Shoulder Check** | Strike · / Off Balance (1) · Adjacent. | `cards/strength/shoulder-check.webp` |
| ✓ | **Sweep the Leg** | Strike Prone (1) · / Move 1 | `cards/strength/sweep-the-leg.webp` |
| ✓ | **Two-Hand It** | Strike +2 · / Ready | `cards/strength/two-hand-it.webp` |
| ✓ | **Walk It Off** | Heal 2, Shake 2 · / Move 1 · On yourself. | `cards/strength/walk-it-off.webp` |

## Way cards

Written for the reach weapons and shared between Ways.

**2 pieces**, 2 wired up. Suggested path: `cardrpg/art/cards/way/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Roll With It** | Move 3 · / Move 2 · Sidestep 2, and you may end next to a different enemy | `cards/way/roll-with-it.webp` |
| ✓ | **Set Spear** | Defend · / Move 1 · an enemy ending its move adjacent takes your Strike | `cards/way/set-spear.webp` |

## Skill cards

The scene tray's hand: four of these are face up whenever nobody is fighting.

**10 pieces**, 10 wired up. Suggested path: `cardrpg/art/cards/skill/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Break It** | might 1 · Edge: Something gives whether or not you get through: the GM says what broke. | `cards/skill/break-it.webp` |
| ✓ | **Heave** | might 2 | `cards/skill/heave.webp` |
| ✓ | **Inspiration** | Edge: Draw 1 skill card. | `cards/skill/inspiration.webp` |
| ✓ | **Keep Your Footing** | agility 1 · Edge: You do not fall, whatever else happens. | `cards/skill/keep-your-footing.webp` |
| ✓ | **Out of the Light** | shadow 1 | `cards/skill/out-of-the-light.webp` |
| ✓ | **Quick Hands** | agility 2 | `cards/skill/quick-hands.webp` |
| ✓ | **Set Your Feet** | might 3 | `cards/skill/set-your-feet.webp` |
| ✓ | **Sharp Eyes** | wits 1 · Edge: Ask the GM one yes-or-no question about the scene. | `cards/skill/sharp-eyes.webp` |
| ✓ | **Soldier's Learning** | lore 1 | `cards/skill/soldiers-learning.webp` |
| ✓ | **The Loud Voice** | presence 1 · Edge: Everyone nearby hears you, and knows it was you. | `cards/skill/the-loud-voice.webp` |

## Wild Magic

Drawn on a Wild, so each one is a surprise and wants to look like one.

**10 pieces**, 10 wired up. Suggested path: `cardrpg/art/cards/wild/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Backlash** | Dazed (1) | `cards/wild/backlash.webp` |
| ✓ | **Blink** | Move 3 ignoring figures and difficult ground | `cards/wild/blink.webp` |
| ✓ | **Echo** | The Cast resolves a second time, against the same target. | `cards/wild/echo.webp` |
| ✓ | **Glare** | The Cast becomes a Blast 2 around its target, whoever is standing in it. | `cards/wild/glare.webp` |
| ✓ | **Misfire** | The Cast resolves against the nearest creature instead, ally or not. | `cards/wild/misfire.webp` |
| ✓ | **Open Door** | Invisible (1), Marked (2) | `cards/wild/open-door.webp` |
| ✓ | **Residue** | Cursed | `cards/wild/residue.webp` |
| ✓ | **Second Sight** | Blessed | `cards/wild/second-sight.webp` |
| ✓ | **The Long Step** | Move 3 ignoring figures and difficult ground, Prone (1) | `cards/wild/the-long-step.webp` |
| ✓ | **Veil** | Invisible (1) | `cards/wild/veil.webp` |

## Signatures — Way of Shade

A title's own piece of content, and what its node wears in the levelling graph.

**12 pieces**, 12 wired up. Suggested path: `cardrpg/art/signatures/shade/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Double or Nothing** | Strike · / Move 1 · Draw two fate cards -- both apply, added together. Variance, not advantage. | `signatures/shade/double-or-nothing.webp` |
| ✓ | **Heckle** | Heckled (1) · / Move 1 · An enemy arriving next to you draws fate with disadvantage until your next turn. | `signatures/shade/heckle.webp` |
| ✓ | **Lift** | Strike · / Move 1 · On a hit, take one card from the target's own deck. It is yours now, and it is in your deck for good. | `signatures/shade/lift.webp` |
| ✓ | **Loose and Step** | Strike, Move 1 · / Move 1 | `signatures/shade/loose-and-step.webp` |
| ✓ | **Named** | Strike · / Marked (1) · Name one enemy. Against it, your Parry also Strikes for 1. | `signatures/shade/named.webp` |
| ✓ | **One Opening** | Strike · / Move 1 · Against a target that is unaware or carrying an opening, the damage is doubled. | `signatures/shade/one-opening.webp` |
| ✓ | **One Trick** | You may prepare from any one school you have ever seen cast. | `signatures/shade/one-trick.webp` |
| ✓ | **Over and Past** | Move 3 · / Move 1 · You may move through enemy squares. | `signatures/shade/over-and-past.webp` |
| ✓ | **Point Man** | Foresee · / Move 1 · While you are the furthest forward of your party, Foresee one extra type. | `signatures/shade/point-man.webp` |
| ✓ | **Set** | Ready Slowed 2 an adjacent square; the first enemy to enter takes your Strike value · / Ready · Place a trap on an adjacent square. | `signatures/shade/set.webp` |
| ✓ | **The Kit** | item · You may never put it down. Every Hard physical obstacle becomes Normal. | `signatures/shade/the-kit.webp` |
| ✓ | **The Opening** | Advantage against anyone carrying an opening -- whoever set it. | `signatures/shade/the-opening.webp` |

## Signatures — Way of Strength

A title's own piece of content, and what its node wears in the levelling graph.

**12 pieces**, 12 wired up. Suggested path: `cardrpg/art/signatures/strength/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Cleave to the Bone** | For you, the Wound threshold is 4, not 5. | `signatures/strength/cleave-to-the-bone.webp` |
| ✓ | **Get a Grip** | Grappled (2) · / Move 1 · No save at all if both your hands are empty. | `signatures/strength/get-a-grip.webp` |
| ✓ | **Interpose** | Defend · / Move 1 · Take a hit meant for an adjacent ally. | `signatures/strength/interpose.webp` |
| ✓ | **Loaded Before the Bell** | You begin every combat already loaded, and the first shot of a fight is +2. | `signatures/strength/loaded-before-the-bell.webp` |
| ✓ | **Nothing Gets Through** | While you are Overloaded, your armor counts double. | `signatures/strength/nothing-gets-through.webp` |
| ✓ | **On My Call** | Ready · / Move 1 · On an ally's turn: they may play a card in their hand halves swapped, its secondary as a primary. | `signatures/strength/on-my-call.webp` |
| ✓ | **Play to the Crowd** | Compelled (1) · / Move 1 · When you are hit: gain Block 2, and the attacker is Compelled (1) -- no save, because you have already been hit once. | `signatures/strength/play-to-the-crowd.webp` |
| ✓ | **Ranging Shot** | Strike aimed 1 · / Ready · Blast instead of Aimed, if you did not Move this turn. | `signatures/strength/ranging-shot.webp` |
| ✓ | **Red Mist** | Strike · / Move 1 · Then draw back up to your hand size at once. | `signatures/strength/red-mist.webp` |
| ✓ | **Shoulder to Shoulder** | Strike, Block 1 area 1 · / Move 1 | `signatures/strength/shoulder-to-shoulder.webp` |
| ✓ | **The Lance** | Move 3, Strike · / Move 1 · Advantage if you moved at least 2. Needs the mount. | `signatures/strength/the-lance.webp` |
| ✓ | **The Wall** | Your Blocks stack. You are the one exception to highest-wins. | `signatures/strength/the-wall.webp` |

## Signatures — Way of Mind

Eleven, not twelve: *Step Through* is in the Shadow formulas below.

**11 pieces**, 11 wired up. Suggested path: `cardrpg/art/signatures/mind/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Blood Price** | strength 2 · Cast +4 range 3 ignores armour | `signatures/mind/blood-price.webp` |
| ✓ | **Call the Unquiet** | strength 3 · Conjure range 2 a corpse rises and fights for you | `signatures/mind/call-the-unquiet.webp` |
| ✓ | **Graven Strength** | strength 1 · Graven | `signatures/mind/graven-strength.webp` |
| ✓ | **Hearth and Home** | strength 1 · a camp nobody unfriendly can find, for one night | `signatures/mind/hearth-and-home.webp` |
| ✓ | **Not Here** | strength 2 · Invisible (1) until you attack or are attacked | `signatures/mind/not-here.webp` |
| ✓ | **Nothing Left to Take** | strength 1 · you cannot be reduced below 1 Health | `signatures/mind/nothing-left-to-take.webp` |
| ✓ | **The Bargain** | strength 3 · Conjure it acts once; the GM decides how | `signatures/mind/the-bargain.webp` |
| ✓ | **The Reading** | strength 2 · Foresee 3 | `signatures/mind/the-reading.webp` |
| ✓ | **Unmake** | strength 2 · a Cast you have survived before does not resolve | `signatures/mind/unmake.webp` |
| ✓ | **Wall of the Sphere** | strength 2 · range 3 area 3 of your element | `signatures/mind/wall-of-the-sphere.webp` |
| ✓ | **Wither** | strength 2 · Cast Poisoned 1 (2) | `signatures/mind/wither.webp` |

## Signatures — Way of Faith

A god's first and defining miracle.

**16 pieces**, 16 wired up. Suggested path: `cardrpg/art/signatures/faith/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Breath of the Spirit** | strength 2 · Heal 3 range 99 | `signatures/faith/breath-of-the-spirit.webp` |
| ✓ | **Out of Barren Ground** | strength 3 · Heal 4 range 2 | `signatures/faith/out-of-barren-ground.webp` |
| ✓ | **The Borrowed Face** | strength 3 · range 3 Spent: one enemy spends this round attacking its own ally | `signatures/faith/the-borrowed-face.webp` |
| ✓ | **The Clean Hand** | strength 2 · range 3 an ally's next check or attack cannot fail | `signatures/faith/the-clean-hand.webp` |
| ✓ | **The Club and the Line** | strength 2 · Cast blast 1 with the weapon in hand | `signatures/faith/the-club-and-the-line.webp` |
| ✓ | **The Drum** | strength 1 · your next Strike this turn is +3 | `signatures/faith/the-drum.webp` |
| ✓ | **The First Taste** | strength 2 · Tainting 2 range 1 | `signatures/faith/the-first-taste.webp` |
| ✓ | **The Long Night** | strength 3 · Cast +3 range 1 you gain the Health you take | `signatures/faith/the-long-night.webp` |
| ✓ | **The Long Silence** | Ready 2 · / Shake 1 · Only if you did not move this round. Stillness is the whole of the order's method. | `signatures/faith/the-long-silence.webp` |
| ✓ | **The Order's Shield** | Defend, Block 2 range 1 · / Block 1 range 1 · The Block goes to an adjacent ally and never to you. The order does not defend itself. | `signatures/faith/the-orders-shield.webp` |
| ✓ | **The Outcast's Due** | strength 3 · Cast blast 1 Compelled (2) | `signatures/faith/the-outcasts-due.webp` |
| ✓ | **The Rumour** | strength 2 · one enemy type acts as though a named lie were true | `signatures/faith/the-rumour.webp` |
| ✓ | **The Scourge** | Strike +2 · / Move 2 · Strain 1, paid before the blow lands. The drums, the dance and the whip make the same argument: pay first, strike harder. | `signatures/faith/the-scourge.webp` |
| ✓ | **The Silent Hour** | strength 2 · range 1 Dazed (1) | `signatures/faith/the-silent-hour.webp` |
| ✓ | **The Tide Knows** | strength 2 · range 3 an ally draws fate twice on their next action and keeps both | `signatures/faith/the-tide-knows.webp` |
| ✓ | **The Writ** | range 6 Judged (2) · / Move 1 · No save, at range 6. Being named is not something you resist, and the whole field may act on it. | `signatures/faith/the-writ.webp` |

## Formulas — Elemental

The combo pair and its two readers: the oldest spells in the game.

**4 pieces**, 4 wired up. Suggested path: `cardrpg/art/spells/elemental/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Frost** | strength 1 · range 3 Slowed (1) | `spells/elemental/frost.webp` |
| ✓ | **Lightning** | strength 2 · Cast range 4 Stunned (1) | `spells/elemental/lightning.webp` |
| ✓ | **Rain** | strength 2 · range 4 blast 3 Wet (1) no damage | `spells/elemental/rain.webp` |
| ✓ | **Scorch** | strength 1 · Cast range 4 Burning (1) | `spells/elemental/scorch.webp` |

## Formulas — Shadow

Pays in a permanent Wild card.

**1 piece**, 1 wired up. Suggested path: `cardrpg/art/spells/shadow/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Step Through** | strength 2 · teleport to any shadowed square you can see | `spells/shadow/step-through.webp` |

## Formulas — Way of Mind pool

Blood Magic and Spiritualism, handed over by minor nodes.

**70 pieces**, 70 wired up. Suggested path: `cardrpg/art/spells/mind/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **A Clear Head** | strength 1 · Shake 1 range 3 Dazed and they may play a secondary this turn even if they already have | `spells/mind/a-clear-head.webp` |
| ✓ | **Ask the Dead** | strength 1 · a corpse answers three questions, as truthfully as it knew | `spells/mind/ask-the-dead.webp` |
| ✓ | **Become the Shadow** | strength 5 · until the fight ends you are in every shadow at once: Strike from any shadowed square, and nothing can target you | `spells/mind/become-the-shadow.webp` |
| ✓ | **Boil** | strength 3 · Cast Burning 3 (2) | `spells/mind/boil.webp` |
| ✓ | **Cast No Shadow** | strength 2 · until your next turn nothing further than 1 square away can target you | `spells/mind/cast-no-shadow.webp` |
| ✓ | **Empty Hand** | strength 1 · you may Strike with no item, at your own Might | `spells/mind/empty-hand.webp` |
| ✓ | **Flesh of the Earth** | strength 2 · Cast range 3 Burning 1 (2) and Corrode 1: it eats the armour as well as the man | `spells/mind/flesh-of-the-earth.webp` |
| ✓ | **Grave Chill** | strength 2 · Cast aimed 2 Dazed (1) | `spells/mind/grave-chill.webp` |
| ✓ | **Graven Armour** | strength 4 · you count as Burdened always, whatever you carry | `spells/mind/graven-armour.webp` |
| ✓ | **Graven Eye** | strength 1 · you are never surprised | `spells/mind/graven-eye.webp` |
| ✓ | **Graven Heart** | strength 3 | `spells/mind/graven-heart.webp` |
| ✓ | **Graven Road** | strength 1 · your Move is never halved | `spells/mind/graven-road.webp` |
| ✓ | **Graven Shield** | strength 2 | `spells/mind/graven-shield.webp` |
| ✓ | **Hold to the Bargain** | strength 2 · an ally's failed check becomes a Partial | `spells/mind/hold-to-the-bargain.webp` |
| ✓ | **Ink Spray** | strength 1 · Blast area 2 end Invisible in the area, and nothing in it may become Invisible until your next turn | `spells/mind/ink-spray.webp` |
| ✓ | **Longer Shadow** | strength 1 | `spells/mind/longer-shadow.webp` |
| ✓ | **Nothing At All** | strength 5 · your action deck becomes 4 cards, you hold all four, and may play any two halves. Costs a hand | `spells/mind/nothing-at-all.webp` |
| ✓ | **Nothing to Carry** | strength 1 · +2 to all Casts, and you cannot be Disarmed | `spells/mind/nothing-to-carry.webp` |
| ✓ | **Open the Vein** | strength 1 · Cast +3 range 2 ignores Block | `spells/mind/open-the-vein.webp` |
| ✓ | **Shake It Off** | strength 2 · Shake 3 range 3 | `spells/mind/shake-it-off.webp` |
| ✓ | **Slick** | strength 1 · range 3 Off Balance (1) | `spells/mind/slick.webp` |
| ✓ | **Slippery** | strength 1 · Shake 1 range 2 Grappled until your next turn they cannot be Grappled again | `spells/mind/slippery.webp` |
| ✓ | **The Borrowed Body** | strength 3 · Shape | `spells/mind/the-borrowed-body.webp` |
| ✓ | **The Borrowed Dark** | strength 3 | `spells/mind/the-borrowed-dark.webp` |
| ✓ | **The Broken Word** | strength 5 · Spent: one spell or miracle is unlearned by its caster for the rest of the day | `spells/mind/the-broken-word.webp` |
| ✓ | **The Clean Pot** | strength 1 · a day's rations for the party, every day | `spells/mind/the-clean-pot.webp` |
| ✓ | **The Crowded Room** | strength 4 · until your next turn every enemy attacks a random figure in reach, chosen by a fate draw | `spells/mind/the-crowded-room.webp` |
| ✓ | **The Door Home** | strength 5 · a door you have opened leads to any other you have opened | `spells/mind/the-door-home.webp` |
| ✓ | **The Empty Deck** | strength 4 · you cannot be harmed at all | `spells/mind/the-empty-deck.webp` |
| ✓ | **The Evil Eye** | strength 2 · range 3 Cursed | `spells/mind/the-evil-eye.webp` |
| ✓ | **The Face of a Friend** | strength 3 · range 3 one enemy treats you as an ally -- it will not attack you and will take a hit for you -- until you attack it | `spells/mind/the-face-of-a-friend.webp` |
| ✓ | **The Gathered Pact** | strength 4 · every god you are pacted with grants its written favour, this turn | `spells/mind/the-gathered-pact.webp` |
| ✓ | **The Grave's Bargain** | strength 5 · Conjure a dead ally, and they stand at 1 Health | `spells/mind/the-graves-bargain.webp` |
| ✓ | **The Great Bargain** | strength 5 · Conjure a minor god becomes present and fights as an ally for three rounds | `spells/mind/the-great-bargain.webp` |
| ✓ | **The Grey Sickness** | strength 2 · Tainting 1 slow: a disease, not a poison | `spells/mind/the-grey-sickness.webp` |
| ✓ | **The Hand Given** | strength 3 · and it costs a hand: your bare Strike is a Heavy weapon at Strike 4 | `spells/mind/the-hand-given.webp` |
| ✓ | **The House That Was** | strength 4 · overnight a ruin becomes a house, and the party rests as in a town | `spells/mind/the-house-that-was.webp` |
| ✓ | **The Kingmaker's Draught** | strength 5 · Poisoned 3 (3) no save. If it dies while poisoned, set aside no skill cards for this formula | `spells/mind/the-kingmakers-draught.webp` |
| ✓ | **The Last Card** | strength 2 · you may play that card for both halves | `spells/mind/the-last-card.webp` |
| ✓ | **The Last Drop** | strength 5 · take your whole turn again, now | `spells/mind/the-last-drop.webp` |
| ✓ | **The Long Dose** | strength 1 · Cast range 2 Poisoned (3) | `spells/mind/the-long-dose.webp` |
| ✓ | **The Long Look** | strength 3 · one true answer about the next scene, and the GM writes a prophecy | `spells/mind/the-long-look.webp` |
| ✓ | **The Long Masquerade** | strength 5 · you and your whole party appear to be other people for a day | `spells/mind/the-long-masquerade.webp` |
| ✓ | **The Long Preparation** | strength 1 · name one enemy type: your Casts against it are +2 all fight | `spells/mind/the-long-preparation.webp` |
| ✓ | **The Long Step** | strength 1 · Move +4 through anything, if you begin and end in shadow | `spells/mind/the-long-step.webp` |
| ✓ | **The Long Table** | strength 3 · the party sheds every Wound and all rest tokens return | `spells/mind/the-long-table.webp` |
| ✓ | **The Mark of Things to Come** | strength 2 · range 99 Marked (1) and Read 1 | `spells/mind/the-mark-of-things-to-come.webp` |
| ✓ | **The Mended Seam** | strength 1 · repair one item overnight, including corroded armour | `spells/mind/the-mended-seam.webp` |
| ✓ | **The Mirror** | strength 3 · Spent: a Cast aimed at you resolves against its own caster | `spells/mind/the-mirror.webp` |
| ✓ | **The Nine Names** | strength 1 · a minor god names who here it is angry with | `spells/mind/the-nine-names.webp` |
| ✓ | **The Open Book** | strength 4 · every ally draws fate with advantage, and Read 2 | `spells/mind/the-open-book.webp` |
| ✓ | **The Quick Dose** | strength 3 · Cast Poisoned 2 (2) | `spells/mind/the-quick-dose.webp` |
| ✓ | **The Red Hour** | strength 4 · range 2 every ally within 2 may play a second secondary | `spells/mind/the-red-hour.webp` |
| ✓ | **The Risen Rank** | strength 4 · Conjure range 3 corpses rise, and fall again when the round ends | `spells/mind/the-risen-rank.webp` |
| ✓ | **The Second Heartbeat** | strength 3 · Spent: play a second primary this turn | `spells/mind/the-second-heartbeat.webp` |
| ✓ | **The Shadow Road** | strength 4 · area 1 you and every ally within 1 teleport to any shadowed square on the map | `spells/mind/the-shadow-road.webp` |
| ✓ | **The Shared Cup** | strength 4 · Cast aimed 3 Poisoned 1 (3) | `spells/mind/the-shared-cup.webp` |
| ✓ | **The Shut Mouth** | strength 2 · Cast range 3 Silenced (1) | `spells/mind/the-shut-mouth.webp` |
| ✓ | **The Small Pact** | strength 1 · the god grants the favour written on your pact | `spells/mind/the-small-pact.webp` |
| ✓ | **The Sphere Entire** | strength 4 · range 3 area 5 of your element | `spells/mind/the-sphere-entire.webp` |
| ✓ | **The Standing Flood** | strength 3 · range 3 area 3 Wet 2 deep water: and its Move is halved | `spells/mind/the-standing-flood.webp` |
| ✓ | **The Standing Ward** | strength 4 · Spent: until your next turn no Cast resolves at all, anywhere -- yours too | `spells/mind/the-standing-ward.webp` |
| ✓ | **The Unbound Tongue** | strength 1 · Shake 1 range 3 Silenced | `spells/mind/the-unbound-tongue.webp` |
| ✓ | **The Unlatched Door** | strength 2 · a door ever opened by one who lived there opens for you | `spells/mind/the-unlatched-door.webp` |
| ✓ | **The Whole Skin** | strength 5 · Graven Burning never lands. You may never prepare another spell | `spells/mind/the-whole-skin.webp` |
| ✓ | **The Whole Thread** | strength 5 · the GM shows the enemy's intent cards for the whole fight, in order | `spells/mind/the-whole-thread.webp` |
| ✓ | **Turn Aside** | strength 2 · range 3 one ally's Block counts double against this attack | `spells/mind/turn-aside.webp` |
| ✓ | **Unmake the Ground** | strength 5 · all fight | `spells/mind/unmake-the-ground.webp` |
| ✓ | **Where It Will Land** | strength 1 · Foresee 1 | `spells/mind/where-it-will-land.webp` |
| ✓ | **Wrong Face** | strength 2 · Cast Dazed (2) | `spells/mind/wrong-face.webp` |

## Miracles — Way of Faith pool

Twelve gods' lesser miracles, handed over by minor nodes.

**50 pieces**, 50 wired up. Suggested path: `cardrpg/art/spells/faith/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **A Word for You** | strength 1 · range 3 Blessed | `spells/faith/a-word-for-you.webp` |
| ✓ | **A Word Withdrawn** | strength 1 · Lift range 3 Blessed or Cursed | `spells/faith/a-word-withdrawn.webp` |
| ✓ | **Alone on the Road** | strength 1 · Heal 2 at the start of your turn | `spells/faith/alone-on-the-road.webp` |
| ✓ | **Bear It for Them** | strength 2 · range 3 move one condition off an ally and onto yourself | `spells/faith/bear-it-for-them.webp` |
| ✓ | **Breath for the Dying** | strength 5 · every ally at 0 Health stands at half Health. You may carry nothing for the rest of the day | `spells/faith/breath-for-the-dying.webp` |
| ✓ | **Everyone Wears His Face** | strength 5 · until your next turn every enemy attack targets another enemy | `spells/faith/everyone-wears-his-face.webp` |
| ✓ | **Full Belly** | strength 1 · the party's next rest returns one extra rest token | `spells/faith/full-belly.webp` |
| ✓ | **Grey Judgement** | strength 2 · range 1 a Judged adjacent enemy acts last this round | `spells/faith/grey-judgement.webp` |
| ✓ | **Half a Truth** | strength 2 · until your next turn enemies act as though one ally you name were not there | `spells/faith/half-a-truth.webp` |
| ✓ | **Lay On** | strength 1 · Heal 2 range 3 | `spells/faith/lay-on.webp` |
| ✓ | **Measure of the Debt** | strength 2 · a Judged enemy that dies this round: you gain 3 Health | `spells/faith/measure-of-the-debt.webp` |
| ✓ | **Name the Guilty** | strength 1 · range 6 Judged (1) | `spells/faith/name-the-guilty.webp` |
| ✓ | **No Step Back** | strength 2 · Block 2 area 2 | `spells/faith/no-step-back.webp` |
| ✓ | **Nobody's Friend** | strength 2 · range 3 until your next turn no ally may Heal, Interpose for, or redirect a hit from one enemy | `spells/faith/nobodys-friend.webp` |
| ✓ | **Stand Where I Stand** | strength 1 · range 1 adjacent allies cannot be reduced below 1 Health | `spells/faith/stand-where-i-stand.webp` |
| ✓ | **Steady the Hand** | strength 1 · Shake 1 range 3 Compelled | `spells/faith/steady-the-hand.webp` |
| ✓ | **Taste of the Rot** | strength 1 · Cast +1 range 1 Off Balance (1) the Taint only on a Miss | `spells/faith/taste-of-the-rot.webp` |
| ✓ | **The Air Between** | strength 4 · until your next turn every ally may take one extra reaction per trigger | `spells/faith/the-air-between.webp` |
| ✓ | **The Body Made Clean** | strength 5 · every ally is healed to full and every condition is Lifted and Shaken off. Your action deck is 6 cards for the rest of the day | `spells/faith/the-body-made-clean.webp` |
| ✓ | **The Brewer's Tithe** | strength 2 · Tainting 2 slow: a disease, not a poison | `spells/faith/the-brewers-tithe.webp` |
| ✓ | **The Charge** | strength 2 · area 2 every ally within 2 may Move their full value, at once, now | `spells/faith/the-charge.webp` |
| ✓ | **The Clean Field** | strength 4 · until your next turn no enemy may play a secondary | `spells/faith/the-clean-field.webp` |
| ✓ | **The Close Work** | strength 2 · adjacent: an enemy's Strike hits the nearest other enemy instead | `spells/faith/the-close-work.webp` |
| ✓ | **The Driven Out** | strength 4 · area 3 Compelled (1) and you gain Block 3 for each enemy Compelled | `spells/faith/the-driven-out.webp` |
| ✓ | **The Grey Hour** | strength 4 · range 1 Halted (1) | `spells/faith/the-grey-hour.webp` |
| ✓ | **The Land Beneath** | strength 5 · area 2 every enemy within 2 is gone until then. You are Prone | `spells/faith/the-land-beneath.webp` |
| ✓ | **The Lie That Held** | strength 5 · a lie named before the fight is true | `spells/faith/the-lie-that-held.webp` |
| ✓ | **The Line Holds** | strength 4 · allies adjacent to you cannot be moved, knocked Prone or Compelled | `spells/faith/the-line-holds.webp` |
| ✓ | **The Mask of the Captain** | strength 4 · one enemy obeys you for a round -- you play its turn | `spells/faith/the-mask-of-the-captain.webp` |
| ✓ | **The Narrow Path** | strength 1 · your miracles cost 1 slot less (min 1) | `spells/faith/the-narrow-path.webp` |
| ✓ | **The Orchard** | strength 4 · Heal 4 and sheds one condition | `spells/faith/the-orchard.webp` |
| ✓ | **The Planted Word** | strength 1 · one enemy type cannot play reactions | `spells/faith/the-planted-word.webp` |
| ✓ | **The Poisoned Well** | strength 4 · Tainting 1 blast 3 fast | `spells/faith/the-poisoned-well.webp` |
| ✓ | **The Sea Decides** | strength 5 · shuffle every fate deck on the field into one; everyone draws from it | `spells/faith/the-sea-decides.webp` |
| ✓ | **The Second Face** | strength 1 · Spent: read one enemy's intent card for this round before anyone acts | `spells/faith/the-second-face.webp` |
| ✓ | **The Second Thought** | strength 1 · range 3 Dazed (1) | `spells/faith/the-second-thought.webp` |
| ✓ | **The Shield Line** | strength 2 · range 1 adjacent allies gain your armor as Block | `spells/faith/the-shield-line.webp` |
| ✓ | **The Silent Knife** | strength 5 · adjacent: one enemy is dead. No save, no fate draw, no roll of any kind | `spells/faith/the-silent-knife.webp` |
| ✓ | **The Sixth District** | strength 5 · until the fight ends every adjacent ally shares your armor and Block, and damage dealt to them is dealt to you instead | `spells/faith/the-sixth-district.webp` |
| ✓ | **The Slow Failure** | strength 5 · Tainting 3 | `spells/faith/the-slow-failure.webp` |
| ✓ | **The Slow Mercy** | strength 2 · range 3 healed to full | `spells/faith/the-slow-mercy.webp` |
| ✓ | **The Spring Tide** | strength 4 · until your next turn every ally draws fate twice and keeps both | `spells/faith/the-spring-tide.webp` |
| ✓ | **The Turning Tide** | strength 2 · range 3 Cursed an ally redraws a fate card and keeps the second. The Cursed is yours | `spells/faith/the-turning-tide.webp` |
| ✓ | **The War Drum** | strength 4 · area 2 every ally within 2 takes their whole turn again, now | `spells/faith/the-war-drum.webp` |
| ✓ | **The Weight of It** | strength 2 · range 6 a Judged enemy's armor counts 0 against everyone until your next turn | `spells/faith/the-weight-of-it.webp` |
| ✓ | **The Whole Cloth** | strength 4 · one enemy type believes the party are its own | `spells/faith/the-whole-cloth.webp` |
| ✓ | **Undertow** | strength 2 · Cast range 3 blast 2 Wet (1) every target is moved 1 square you choose | `spells/faith/undertow.webp` |
| ✓ | **Valtor's Own** | strength 5 · for the rest of the fight you play a primary and two secondaries each turn | `spells/faith/valtors-own.webp` |
| ✓ | **What Does Not Die** | strength 3 · drop to 1 instead of 0, and lose a spell slot for good | `spells/faith/what-does-not-die.webp` |
| ✓ | **What Grows Out of Us** | strength 5 · every ally including the dead stands at full Health | `spells/faith/what-grows-out-of-us.webp` |

## Features

Always on, so a feature's picture is on the sheet for the character's whole life.

**14 pieces**, 14 wired up. Suggested path: `cardrpg/art/features/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Alert** | You draw with advantage on initiative. | `features/alert.webp` |
| ✓ | **Arcane Focus** | +1 to all Cast values. | `features/arcane-focus.webp` |
| ✓ | **Good Aim** | +2 range on Ranged and Thrown items. | `features/good-aim.webp` |
| ✓ | **Good Name** | +1 on Presence checks. People have heard of you, and most of it was good. | `features/good-name.webp` |
| ✓ | **Hard Hands** | +1 on Might checks. Lifting, breaking, and not letting go. | `features/hard-hands.webp` |
| ✓ | **Light Step** | +1 on Agility checks. Where to put a foot, decided before you need it. | `features/light-step.webp` |
| ✓ | **Packhorse** | +20 kg carry allowance. | `features/packhorse.webp` |
| ✓ | **Quick** | Hand size +1. | `features/quick.webp` |
| ✓ | **Quick Eye** | +1 on Wits checks. You notice the thing that is about to happen. | `features/quick-eye.webp` |
| ✓ | **Quiet Worker** | +1 on Shadow checks. Slowly is quietly, and you have the patience for it. | `features/quiet-worker.webp` |
| ✓ | **Steady** | You don't become Dazed. · Drain: you don't become Dazed. | `features/steady.webp` |
| ✓ | **Strong** | +1 damage on Strike with Heavy items. | `features/strong.webp` |
| ✓ | **Tough** | +4 max Health. | `features/tough.webp` |
| ✓ | **Well Read** | +1 on Lore checks. Somebody has written this down, and you have read them. | `features/well-read.webp` |

## Items

The largest group and the least urgent: an item is named on a sheet far more often than it is looked at. A generic picture per KIND would serve until there is art per item.

**146 pieces**, 146 wired up. Suggested path: `cardrpg/art/items/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Accuser's Ring** | Wonder · It is cold on the finger that points. · One enemy within 3 is Judged (1). | `items/accusers-ring.webp` |
| ✓ | **Amulet of the Mended Thread** | Wonder · A knotted thread in amber. The knot is tied, not drawn. · When you would drop to 0 Health, drop to 1 instead. | `items/amulet-of-the-mended-thread.webp` |
| ✓ | **Antidote** | Consumable · Charcoal, milk thistle and something the brewer will not name. | `items/antidote.webp` |
| ✓ | **Arming Sword** | Weapon · A plain single-handed blade. Every town has a smith who makes them. | `items/arming-sword.webp` |
| ✓ | **Arquebus** | Weapon · Loud, slow, and it does not care what you are wearing. | `items/arquebus.webp` |
| ✓ | **Assassin's Tincture** | Poison · Apply with a Ready. Next Strike that hits: Poisoned 1 (2), beginning at the start of their next turn. No save. · They finish the sentence ... | `items/assassins-tincture.webp` |
| ✓ | **Balanced Dagger** | Make · Weighted at the tang. It goes where you looked. | `items/balanced-dagger.webp` |
| ✓ | **Beggar's Bowl** | Wonder · Whatever is dropped in it stops being anybody's. · Lift Blessed or Cursed from anyone adjacent. | `items/beggars-bowl.webp` |
| ✓ | **Black Lotus** | Poison · Apply with a Ready. Next Strike that hits: Poisoned 3 (2), resist Might 9. · Illegal in every district, which is how you know the price is... | `items/black-lotus.webp` |
| ✓ | **Blade of the Eager Hand** | Wonder · It wants to be swung and it is not fussy about at what. | `items/blade-of-the-eager-hand.webp` |
| ✓ | **Blade Venom** | Poison · Apply with a Ready. Next Strike that hits: Poisoned 1 (2), resist Might 5. · Brewed from something that was already unpleasant. | `items/blade-venom.webp` |
| ✓ | **Blunt Head** | Ammunition · Bow or crossbow. The target is Off-Balance (1). No save. · No point at all, which is the point. | `items/blunt-head.webp` |
| ✓ | **Bodkin Points** | Ammunition · Bow or crossbow. Ignores 2 armor. · A square spike, hardened. It is looking for a gap and will make one. | `items/bodkin-points.webp` |
| ✓ | **Boots of the Long Step** | Wonder · The soles are never quite worn in the same places twice. · Teleport to any square you can see within 6. | `items/boots-of-the-long-step.webp` |
| ✓ | **Bottle of Borrowed Pain** | Potion · It does not heal you. It postpones you. | `items/bottle-of-borrowed-pain.webp` |
| ✓ | **Brewer's Reserve** | Potion · The brewer keeps a cask of it back and will not say what is in it. | `items/brewers-reserve.webp` |
| ✓ | **Brigandine** | Armor · Blocks Sidestep reactions. · Plates riveted between canvas. Heavy enough that you stop dodging. | `items/brigandine.webp` |
| ✓ | **Buckler** | Shield · A fist-sized iron plate. Better than the hand behind it. | `items/buckler.webp` |
| ✓ | **Cairn Stone** | Wonder · Set it down: its square is high ground for the rest of the fight. · Set it down and the ground agrees to be taller. | `items/cairn-stone.webp` |
| ✓ | **Caltrops** | Consumable · A handful of iron, however it lands. | `items/caltrops.webp` |
| ✓ | **Chalked Shaft** | Ammunition · Bow or crossbow. The target is Marked (1). No save. · It leaves a smear that everyone can see and nobody can wipe off. | `items/chalked-shaft.webp` |
| ✓ | **Cleansing Draught** | Consumable · A temple brews it and does not sell it gladly. | `items/cleansing-draught.webp` |
| ✓ | **Climbing Rope** | Tool · Fifty feet of hemp. Nobody falls alone. | `items/climbing-rope.webp` |
| ✓ | **Cloak of the Grey** | Wonder · It is the colour of whatever is behind it. · Become Invisible (1). | `items/cloak-of-the-grey.webp` |
| ✓ | **Cracked Spyglass** | Wonder · Foresee one extra type at the start of a fight. · The crack does not matter. What you see through it has not happened yet. | `items/cracked-spyglass.webp` |
| ✓ | **Crossbow** | Weapon · Anyone can be taught one in a week, which is why lords dislike them. | `items/crossbow.webp` |
| ✓ | **Crown of the Quiet Mind** | Wonder · Thin gold. Nothing in your head hurries while it is on. | `items/crown-of-the-quiet-mind.webp` |
| ✓ | **Dagger** | Weapon · Short, quick, and easy to hide. | `items/dagger.webp` |
| ✓ | **Deep Pockets** | Wonder · More in them than went in, and never what you wanted. | `items/deep-pockets.webp` |
| ✓ | **Discriminating Wand** | Wonder · Your Blasts count as Aimed. · It knows whose side everyone is on, which is more than most people do. | `items/discriminating-wand.webp` |
| ✓ | **Draught of Lead** | Potion · Heavier than it looks, and so are you now. | `items/draught-of-lead.webp` |
| ✓ | **Draught of Second Breath** | Potion · One swallow and your lungs believe the fight has just started. | `items/draught-of-second-breath.webp` |
| ✓ | **Draught of the Hollow** | Potion · It empties something you were not keeping track of. | `items/draught-of-the-hollow.webp` |
| ✓ | **Drowned Bell** | Wonder · It rings wet. There is no water in it. · Everything within 2 is Wet (1). | `items/drowned-bell.webp` |
| ✓ | **Drowsing Oil** | Poison · Apply with a Ready. Next Strike that hits: Dazed (2), resist Might 5. · It does not kill. It makes a man slow about objecting. | `items/drowsing-oil.webp` |
| ✓ | **Elixir of the Long Night** | Potion · It lends. It is very clear about lending. | `items/elixir-of-the-long-night.webp` |
| ✓ | **Far-sight Monocle** | Wonder · Your Ranged items' range is doubled. · Ground by somebody who had opinions about distance. | `items/far-sight-monocle.webp` |
| ✓ | **Fine Clothes** | Station · Cut well enough that nobody asks who you are. | `items/fine-clothes.webp` |
| ✓ | **Fine Longsword** | Make · A smith's mark near the hilt, and worth asking after. | `items/fine-longsword.webp` |
| ✓ | **Fire Wand** | Implement · Blackened at the tip, and warm even unused. | `items/fire-wand.webp` |
| ✓ | **Firepot** | Consumable · Pitch and naphtha in a clay shell. It keeps burning. | `items/firepot.webp` |
| ✓ | **Flask of Ink** | Consumable · Cuttlefish black. It finds what is not there to be seen. | `items/flask-of-ink.webp` |
| ✓ | **Flask of Oil** | Consumable · Lamp oil, thrown low. | `items/flask-of-oil.webp` |
| ✓ | **Focus Pendant** | Power · Jeweller's work. The stone is not the point; the setting is. | `items/focus-pendant.webp` |
| ✓ | **Frost-dipped Bolt** | Ammunition · Crossbow. Frozen 1 (1). · Cold enough that the quiver frosts around it. | `items/frost-dipped-bolt.webp` |
| ✓ | **Gag of the Nine** | Wonder · Nine knots in a cord. Somebody counted them out loud, once. · One enemy within 3 is Silenced (1), resist Lore 5. | `items/gag-of-the-nine.webp` |
| ✓ | **Gambler's Coin** | Wonder · It lands how you need it to, which is not the same as how you want it to. · Read 3 on your own fate deck. | `items/gamblers-coin.webp` |
| ✓ | **Gaming Set** | Station · Dice, a board and a cup. Soldiers will tell a stranger anything over it. | `items/gaming-set.webp` |
| ✓ | **Gauntlet of the Open Palm** | Wonder · Beautifully made, and it will not close. | `items/gauntlet-of-the-open-palm.webp` |
| ✓ | **Gorget of the Turned Blade** | Wonder · Three old cuts in it, none of them deep. · Block 3 as a reaction. | `items/gorget-of-the-turned-blade.webp` |
| ✓ | **Grapnel Bolt** | Ammunition · Crossbow. YOU are pulled to a square adjacent to the target. · Barbed, with fifty feet of silk line. A bolt for closing. | `items/grapnel-bolt.webp` |
| ✓ | **Grave-cap Extract** | Poison · Apply with a Ready. Next Strike that hits: Poisoned 2 (2), resist Might 7. · The cap grows on what is under the cairn, not on the cairn. | `items/grave-cap-extract.webp` |
| ✓ | **Great Axe** | Weapon · Cheaper than a greatsword and it does not care. | `items/great-axe.webp` |
| ✓ | **Great Helm** | Armor · Disadvantage on Wits checks. · Safe, and you cannot hear a thing through it. | `items/great-helm.webp` |
| ✓ | **Greater Healing Potion** | Potion · Twice the price of the ordinary sort and rather more than twice the work. | `items/greater-healing-potion.webp` |
| ✓ | **Greatsword** | Weapon · Four feet of edge. Both hands, and nothing held back. | `items/greatsword.webp` |
| ✓ | **Grey Water** | Potion · Somebody corked it carefully, which is the cruellest part. | `items/grey-water.webp` |
| ✓ | **Halberd** | Weapon · Axe, spike and hook on a six-foot shaft. Reaches over the man in front of you. | `items/halberd.webp` |
| ✓ | **Healer's Kit** | Tool · Needle, gut, lint and spirit. | `items/healers-kit.webp` |
| ✓ | **Healing Potion** | Consumable · Thick, red, and tastes of iron. | `items/healing-potion.webp` |
| ✓ | **Heavy Crossbow** | Weapon · Cranked with a windlass. It goes through a shield and the arm behind it. | `items/heavy-crossbow.webp` |
| ✓ | **Helm of the Watchful** | Wonder · You are never surprised and cannot be Dazed. · Nothing comes at you from a side you were not already watching. | `items/helm-of-the-watchful.webp` |
| ✓ | **Hollow Bolt** | Ammunition · Crossbow. Carries one potion; whatever you hit drinks it. · The shaft unscrews. A fiddly, brilliant, disreputable idea. | `items/hollow-bolt.webp` |
| ✓ | **Hollow Boots** | Wonder · They sound like a far larger man coming. · Shove an adjacent enemy 2 squares. | `items/hollow-boots.webp` |
| ✓ | **Holy Symbol** | Power · Whose, and how openly, is the only question that matters in Firma. | `items/holy-symbol.webp` |
| ✓ | **Hooked Gauntlet** | Wonder · Three hooks along the knuckle, set the wrong way round. · An adjacent enemy is Disarmed (1), resist Might 5. | `items/hooked-gauntlet.webp` |
| ✓ | **Hourglass Charm** | Wonder · The sand has not moved since you found it. · Swap your place in the initiative order with a willing ally. | `items/hourglass-charm.webp` |
| ✓ | **Hunting Traps** | Tool · Jaws and a stake. Patience, mostly. | `items/hunting-traps.webp` |
| ✓ | **Kite Shield** | Shield · Long enough to cover the leg a horseman cannot move. | `items/kite-shield.webp` |
| ✓ | **Lance** | Weapon · A couched lance is a horse's weight arriving at one point. Needs the horse. | `items/lance.webp` |
| ✓ | **Lantern** | Tool · Horn panes and a tallow dip. The squares it lights are not shadowed. | `items/lantern.webp` |
| ✓ | **Leather Armor** | Armor · Boiled and riveted, and it still smells of the tannery. | `items/leather-armor.webp` |
| ✓ | **Light Helm** | Armor · An open kettle. You can still hear and still see. | `items/light-helm.webp` |
| ✓ | **Locked Casket** | Wonder · Holds one secret. Nobody but you may learn it, by any means. · No hinge, no seam, and a keyhole that is not for a key. | `items/locked-casket.webp` |
| ✓ | **Lockpicks** | Tool · A roll of picks and a torsion wrench, in oiled cloth. | `items/lockpicks.webp` |
| ✓ | **Longbow** | Weapon · A yew stave taller than the archer. No reload -- that is what you are buying. | `items/longbow.webp` |
| ✓ | **Longsword** | Weapon · A plain cruciform blade, kept sharp. | `items/longsword.webp` |
| ✓ | **Loose Cobble** | Wonder · Set it down. The first enemy to enter its square is Off-Balance (1). · It was part of a street once and has not forgiven anyone. | `items/loose-cobble.webp` |
| ✓ | **Mace** | Weapon · Flanged. It does not cut, which is the point against a man in mail. | `items/mace.webp` |
| ✓ | **Mail Shirt** | Armor · Riveted rings to the hip. The soldier's compromise for eight hundred years. | `items/mail-shirt.webp` |
| ✓ | **Mantle of the Unburdened** | Wonder · You are never Burdened or Overloaded, whatever you carry. · Everything you carry belongs to the cloak while you wear it. | `items/mantle-of-the-unburdened.webp` |
| ✓ | **Marching Boots** | Make · Difficult ground costs you 1 instead of 2. · Nailed soles. Rubble and mud stop being a decision. | `items/marching-boots.webp` |
| ✓ | **Marked Arrowhead** | Wonder · It has not been fired. It does not need to be. · One enemy you can see is Marked (1). | `items/marked-arrowhead.webp` |
| ✓ | **Masterwork Crossbow** | Make · A steel prod and a goat's-foot lever. It reloads in the hand. | `items/masterwork-crossbow.webp` |
| ✓ | **Matchlock Musket** | Weapon · A rest to fire it from and a minute to load it. Worth both. | `items/matchlock-musket.webp` |
| ✓ | **Matchlock Pistol** | Weapon · One hand, so it goes beside a sword. A brace of them is two shots before a reload. | `items/matchlock-pistol.webp` |
| ✓ | **Mnemonic Stone** | Wonder · One extra skill card in your skill deck, of any approach you already have. · Worn smooth by a thumb that was trying to remember something. | `items/mnemonic-stone.webp` |
| ✓ | **Moth-wing Fletching** | Ammunition · Bow. This shot ignores cover entirely. · It does not fly straight. It arrives anyway. | `items/moth-wing-fletching.webp` |
| ✓ | **Net** | Weapon · Weighted at the edges. The other half of a trident. | `items/net.webp` |
| ✓ | **Net Bolt** | Ammunition · Crossbow. Grappled (1), resist Might 5. · A folded net on a blunt head. It opens in the air. | `items/net-bolt.webp` |
| ✓ | **Oil of Mislaid Courage** | Potion · Whatever was going to make you flinch has been taken out. | `items/oil-of-mislaid-courage.webp` |
| ✓ | **Oil-wrapped Shaft** | Ammunition · Bow or crossbow. Burning 1 (2). · Tow and pitch below the head. Lit from the match in your teeth. | `items/oil-wrapped-shaft.webp` |
| ✓ | **Pact Iron** | Wonder · Cold iron takes a debt and holds it for a while. · One Taint card is set aside for the rest of the fight. | `items/pact-iron.webp` |
| ✓ | **Philtre of Borrowed Courage** | Potion · Somebody else's nerve, and they are not getting it back. | `items/philtre-of-borrowed-courage.webp` |
| ✓ | **Philtre of the Loose Tongue** | Potion · You will mean to stop talking. | `items/philtre-of-the-loose-tongue.webp` |
| ✓ | **Pike** | Weapon · Eighteen feet. Magnificent in a line and worthless on your own. | `items/pike.webp` |
| ✓ | **Pilgrim's Shoes** | Wonder · One extra rest token on every long rest. · Worn by somebody who got where they were going. | `items/pilgrims-shoes.webp` |
| ✓ | **Pilgrim's Token** | Power · Tin, stamped at a shrine. Worth nothing and proof of everything. | `items/pilgrims-token.webp` |
| ✓ | **Plate** | Armor · Blocks Sidestep reactions. · Half your carry allowance, and nothing short of a ball goes through it. | `items/plate.webp` |
| ✓ | **Potion of Iron Skin** | Potion · It goes down like filings and sits there like a breastplate. | `items/potion-of-iron-skin.webp` |
| ✓ | **Potion of Stone** | Potion · Grit in the bottom of the flask, and it settles in you the same way. | `items/potion-of-stone.webp` |
| ✓ | **Potion of the Bear** | Potion · Thick as honey. You will want both hands to lift the bottle. | `items/potion-of-the-bear.webp` |
| ✓ | **Potion of the Hare** | Potion · It tastes of running, which is not a taste anyone can describe. | `items/potion-of-the-hare.webp` |
| ✓ | **Potion of the Owl** | Potion · Your eyes do not change. What they are willing to see does. | `items/potion-of-the-owl.webp` |
| ✓ | **Potion of the Quick Hand** | Potion · You will have put the bottle down before you remember drinking it. | `items/potion-of-the-quick-hand.webp` |
| ✓ | **Proofed Mail** | Make · Tested against a bodkin at ten paces and dented, not pierced. | `items/proofed-mail.webp` |
| ✓ | **Quartermaster's Belt** | Wonder · Everything hangs lighter on it. Nobody knows why and nobody asks twice. | `items/quartermasters-belt.webp` |
| ✓ | **Reaver's Edge** | Wonder · It eats what it meets, slowly, and starts with the armour. | `items/reavers-edge.webp` |
| ✓ | **Reliquary Band** | Power · A splinter of someone's finger under glass. | `items/reliquary-band.webp` |
| ✓ | **Repair Kit** | Tool · Files, rivets, pitch and wire. What acid leaves behind is work, not loss. | `items/repair-kit.webp` |
| ✓ | **Ring of the Open Hand** | Power · You may Cast without a free hand. · Plain silver, worn thin. The gesture is already in it. | `items/ring-of-the-open-hand.webp` |
| ✓ | **Screaming Shaft** | Ammunition · Bow. Dazed (1), resist Presence 5. · Bored through so the air goes through it wrong. | `items/screaming-shaft.webp` |
| ✓ | **Serpent's Milk** | Poison · Apply with a Ready. Next Strike that hits: Poisoned 0 (3) -- no damage, three rounds without a secondary. · Milked, strained and kept cold... | `items/serpents-milk.webp` |
| ✓ | **Serpent's Tooth Ring** | Wonder · A fang set as a stone, still wet at the root. · One adjacent enemy is Poisoned 1 (2). | `items/serpents-tooth-ring.webp` |
| ✓ | **Sessyfyn's Tear** | Relic · Obligation: a permanent Miss AND a permanent Critical in your fate deck. · Seawater that has not dried in four hundred years. · Any one fat... | `items/sessyfyns-tear.webp` |
| ✓ | **Shortbow** | Weapon · Horn and sinew, strung short for close country. | `items/shortbow.webp` |
| ✓ | **Signet Ring** | Station · A house, a seal, and somebody who will answer for you. | `items/signet-ring.webp` |
| ✓ | **Silvered Head** | Ammunition · Bow or crossbow. You may target an Invisible enemy you have seen this fight. · Silver remembers what it was aimed at. | `items/silvered-head.webp` |
| ✓ | **Smith's Hammer** | Make · A cross-pein and a sense of what metal wants. | `items/smiths-hammer.webp` |
| ✓ | **Smoke Bomb** | Consumable · A waxed clay ball, heavier than it looks. | `items/smoke-bomb.webp` |
| ✓ | **Spear** | Weapon · The cheapest thing that keeps a man at arm's length. | `items/spear.webp` |
| ✓ | **Staff of Healing** | Implement · Pale wood, warm to the touch. | `items/staff-of-healing.webp` |
| ✓ | **Surgeon's Pin** | Wonder · Silver, and it has closed worse than this. · Remove one Wound from an ally. | `items/surgeons-pin.webp` |
| ✓ | **Surveyor's Chain** | Wonder · In a challenge, your first Progress each scene is free. · Sixty-six feet of brass links that measure what matters rather than what is there. | `items/surveyors-chain.webp` |
| ✓ | **The Black Lantern** | Relic · Every square within 3 is shadowed, your enemies' included. Obligation: you may never carry any other light. · It is lit. You can tell becau... | `items/the-black-lantern.webp` |
| ✓ | **The Hungry Blade** | Relic · Obligation: a bound Taint the first round of each fight it does not kill. · It is not sharp. It does not need to be sharp. | `items/the-hungry-blade.webp` |
| ✓ | **The Kit** | Tool · A burglar's whole trade in a roll of canvas, and they never put it down. | `items/the-kit.webp` |
| ✓ | **The Pale Crown** | Relic · Obligation: you may never wear armour, and nobody but you may heal you. · Bone, and lighter than bone should be. | `items/the-pale-crown.webp` |
| ✓ | **The Quenched Blade** | Wonder · Quenched in something that is still angry about it. | `items/the-quenched-blade.webp` |
| ✓ | **The Scrivener's Knife** | Wonder · For cutting out what should not have been written. · Prune one card from your action deck for the rest of the day. | `items/the-scriveners-knife.webp` |
| ✓ | **The Unquiet Quiver** | Relic · Every piece of magical ammunition you fire returns to it when the fight ends. Obligation: it will not hold ordinary arrows, and you may car... | `items/the-unquiet-quiver.webp` |
| ✓ | **Thunder-shot** | Ammunition · Firearm only. The shot is Blast 1 on the target's square. · A paper cartridge of scrap. Nothing else gives a non-caster an area. | `items/thunder-shot.webp` |
| ✓ | **Thunderstone** | Wonder · Throw it down hard. Do not be holding it. · One enemy within 3 is Stunned (1), resist Might 7. | `items/thunderstone.webp` |
| ✓ | **Tincture of the Clear Eye** | Potion · Cloudy, and it stings going down. | `items/tincture-of-the-clear-eye.webp` |
| ✓ | **Tinker's Thimble** | Wonder · Strain costs you one card fewer, to a minimum of 1. · Brass, and far too small for whoever made it. | `items/tinkers-thimble.webp` |
| ✓ | **Tower Shield** | Shield · A wall for a man who has decided not to go anywhere. | `items/tower-shield.webp` |
| ✓ | **Travelling Cloak** | Station · Oiled wool. The difference between a wet night and an unbearable one. | `items/travelling-cloak.webp` |
| ✓ | **Trident** | Weapon · Arena work. The crowd likes the shape of it. | `items/trident.webp` |
| ✓ | **Vagrant's Charm** | Wonder · You are never Exhausted. · A knot of road-dust and hair. Its owner never sat down. | `items/vagrants-charm.webp` |
| ✓ | **Warden's Seal** | Power · A tower in relief, worn smooth by thumbs that are not yours. | `items/wardens-seal.webp` |
| ✓ | **Warhammer** | Weapon · A beak on one side for the plate and a hammer on the other for the man in it. | `items/warhammer.webp` |
| ✓ | **Weeping Resin** | Poison · Apply with a Ready. Next Strike that hits: the target cannot be healed for 2 rounds. No save. · The wound will not close while it is in th... | `items/weeping-resin.webp` |
| ✓ | **Whetstone of the Last Edge** | Wonder · It takes something back out of a blade that has given everything. · One Spent card returns to your discard. | `items/whetstone-of-the-last-edge.webp` |
| ✓ | **Whistling Shaft** | Ammunition · Bow. The target is Compelled (1) -- at you. · Whoever it passes becomes very interested in who sent it. | `items/whistling-shaft.webp` |
| ✓ | **Winter Cloak** | Wonder · The hem is always a little frozen, in any season. · Everything adjacent to you is Slowed (1). | `items/winter-cloak.webp` |
| ✓ | **Wooden Shield** | Shield · Banded oak, scarred across the face. | `items/wooden-shield.webp` |

**4 more items are on this shelf and are not commissions.** Each is a cursed forgery of one honest item, and being impossible to tell from it is the whole of what it is: the picture it wears is that item's picture, and it is not drawn twice. `COUNTERFEIT` in `module/content.mjs` is where the pairing is declared.

| Counterfeit | Found as | Wears the picture of | File |
|---|---|---|---|
| **Ring of Open Hands** | a plain silver ring | Ring of the Open Hand | `items/ring-of-the-open-hand.webp` |
| **Cloak of the Grey Road** | a grey travelling cloak | Cloak of the Grey | `items/cloak-of-the-grey.webp` |
| **Boots of the Longer Step** | good boots, barely worn | Boots of the Long Step | `items/boots-of-the-long-step.webp` |
| **Amulet of the Fed Thread** | a knotted thread in amber | Amulet of the Mended Thread | `items/amulet-of-the-mended-thread.webp` |

## NPC gear

Tuned separately from player gear and never offered in a player's picker.

**11 pieces**, 11 wired up. Suggested path: `cardrpg/art/items/npc/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Carved Idol** | Focus | `items/npc/carved-idol.webp` |
| ✓ | **Dark Lantern** | Focus | `items/npc/dark-lantern.webp` |
| ✓ | **Demon's Sigil** | Focus | `items/npc/demons-sigil.webp` |
| ✓ | **Goblin Fetish** | Focus | `items/npc/goblin-fetish.webp` |
| ✓ | **Goblin Shield** | Shield | `items/npc/goblin-shield.webp` |
| ✓ | **Goblin Shortbow** | Weapon | `items/npc/goblin-shortbow.webp` |
| ✓ | **Goblin Spear** | Weapon | `items/npc/goblin-spear.webp` |
| ✓ | **Grave Candle** | Focus | `items/npc/grave-candle.webp` |
| ✓ | **Mole Pick** | Weapon | `items/npc/mole-pick.webp` |
| ✓ | **Tarnkappe** | Wonder · A small grey cap, greasy with age. The Alp will want it back. · Become Invisible (1). | `items/npc/tarnkappe.webp` |
| ✓ | **Troll Club** | Weapon | `items/npc/troll-club.webp` |

## Natural weapons

A mandible, a sting, a tail club and a breath are items like any other — grown rather than carried, which is what the `natural` tag means and why none of them can be disarmed or looted. They sit on a creature's sheet, so they want the same picture an item wants.

**19 pieces**, 19 wired up. Suggested path: `cardrpg/art/items/natural/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Acid Spray** | Natural | `items/natural/acid-spray.webp` |
| ✓ | **Burning Grasp** | Natural | `items/natural/burning-grasp.webp` |
| ✓ | **Claws** | Natural | `items/natural/claws.webp` |
| ✓ | **Crushing Coils** | Natural | `items/natural/crushing-coils.webp` |
| ✓ | **Dragon Jaws** | Natural | `items/natural/dragon-jaws.webp` |
| ✓ | **Draining Bite** | Natural | `items/natural/draining-bite.webp` |
| ✓ | **Elf-Bolt** | Focus | `items/natural/elf-bolt.webp` |
| ✓ | **Fire Spray** | Natural | `items/natural/fire-spray.webp` |
| ✓ | **Grasping Claws** | Natural | `items/natural/grasping-claws.webp` |
| ✓ | **Grave-Cold Hands** | Natural | `items/natural/grave-cold-hands.webp` |
| ✓ | **Heavy Mandibles** | Natural | `items/natural/heavy-mandibles.webp` |
| ✓ | **Killing Frost** | Natural | `items/natural/killing-frost.webp` |
| ✓ | **Mandibles** | Natural | `items/natural/mandibles.webp` |
| ✓ | **Nip** | Natural | `items/natural/nip.webp` |
| ✓ | **Sting** | Natural | `items/natural/sting.webp` |
| ✓ | **Tail Club** | Natural | `items/natural/tail-club.webp` |
| ✓ | **Thrown Stone** | Natural | `items/natural/thrown-stone.webp` |
| ✓ | **Troll Fists** | Natural | `items/natural/troll-fists.webp` |
| ✓ | **Tusks** | Natural | `items/natural/tusks.webp` |

## Creature tokens

**The one piece of art per creature**, and the only group here that is not a card. It goes in both of Foundry's slots — the portrait on the sheet and the token on the map — because they are the same creature and two files is one to forget. Health, armour, speed and gear are given so the picture can be the right size and carry the right weapon; the line after the dash is the creature's own description, written when it was.

**112 pieces**, 112 wired up. **1:1, 512 × 512, transparent.** Suggested path: `cardrpg/art/tokens/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Alp** | Health 12 · speed 4 · Draining Bite, Tarnkappe — a small hunched night-thing wearing a shabby grey cap pulled low -- the Tarnkappe, and it is the only thing on it that reads as clothing. Thin, long-fingered, far too light for its size, drawn crouching as though on someone's ribs | `tokens/alp.webp` |
| ✓ | **Armored Slug** | Health 16 · armour 4 · speed 1 · Acid Spray — slow, armoured, and it does not need to reach you | `tokens/armored-slug.webp` |
| ✓ | **Armored Slug Spitter** | Health 12 · armour 3 · speed 2 · Acid Spray — A Armored Slug: slow, armoured, and it does not need to reach you This one thinner shell, longer reach of acid: it is here to ruin somebody's concentration | `tokens/armored-slug-spitter.webp` |
| ✓ | **Artillerist** | Health 14 · armour 3 · speed 2 · Matchlock Musket, Brigandine — A Guild Engineer: an engineer caught at the work rather than at the gun: sleeves rolled over a leather apron, a cloth cap, both hands on a tool -- a c... This one the same engineer, but down behind a long musket on a forked rest and sighting along it: shoulders low, cheek to the stock, goggles down over the eyes, a second charge between the teeth. The gun is the whole silhouette where the Engineer's was the tools Draw this one as a man of North African appearance, past fifty -- that is fixed, not a suggestion. | `tokens/artillerist.webp` |
| ✓ | **Baal Fagor** | Health 68 · armour 5 · speed 5 · Burning Grasp, Fire Spray, Demon's Sigil — a demon that became a god: enormous, horned, cracked black hide with fire in every split, wings of smoke rather than membrane. Everything within reach of it is already burning. Grander and more deliberate than the Div, which is merely large | `tokens/baal-fagor.webp` |
| ✓ | **Bandit** | Health 8 · armour 1 · speed 4 · Arming Sword, Leather Armor — one roadside robber in mismatched gear: a good sword, a bad coat, a hood or a scarf across the face. Everything worn looks taken off somebody else, because it was Draw this one as a woman of West African appearance, past fifty -- that is fixed, not a suggestion. | `tokens/bandit.webp` |
| ✓ | **Berserker** | Health 14 · speed 5 · Great Axe — bare-armed and unarmoured, a great axe in both hands, hair matted and the pupils wrong. Pelts at the shoulder rather than armour. Caught mid-stride with no guard up at all, because guarding is not part of it Draw this one as a man of Persian appearance, in their forties -- that is fixed, not a suggestion. | `tokens/berserker.webp` |
| ✓ | **Black Circle** | Health 14 · armour 2 · speed 3 · Arming Sword, Mail Shirt — a plain dark coat over mail, gloves, a flat wide hat, a sheaf of papers in one hand. Reads as an official rather than a soldier. The only frightening thing about the figure is how unhurried it is Draw this one as a woman of Southeast Asian appearance, past fifty -- that is fixed, not a suggestion. | `tokens/black-circle.webp` |
| ✓ | **Blind Worm** | Health 14 · armour 2 · speed 3 · Heavy Mandibles — a thick blind tube of segmented muscle, heavy mandibles at the head end and no eyes anywhere on it. **Purplish red** -- the raw dark red-violet of muscle or of an earthworm's flush, wet-looking, deeper in the creases between the segments. Drawn coming up out of broken ground | `tokens/blind-worm.webp` |
| ✓ | **Blind Worm Elder** | Health 24 · armour 3 · speed 3 · Heavy Mandibles — A Blind Worm: a thick blind tube of segmented muscle, heavy mandibles at the head end and no eyes anywhere on it. **Purplish red** -- the raw dark red-violet of muscle or of an earthworm's flush, wet-looking, deeper in the creases betw... This one is longer and thicker and the same purplish red, jaws at one end and the body simply ending at the other. ONE BODY AND NO TAIL: no second tapering limb, no stinger, nothing trailing | `tokens/blind-worm-elder.webp` |
| ✓ | **Burrower** | Health 18 · armour 2 · speed 5 · Mandibles — one great pale ringed worm, as thick as a barrel, blind, with a ring of rasping plates where a face would be. Drawn head-first out of broken ground with the body trailing back into it. No rider in the picture | `tokens/burrower.webp` |
| ✓ | **Burrower Brood Mother** | Health 30 · armour 3 · speed 3 · Mandibles — A Burrower: one great pale ringed worm, as thick as a barrel, blind, with a ring of rasping plates where a face would be. Drawn head-first out of broken ground with the body trailing back into it. No rider in the picture This one it stopped being a steed when it started laying | `tokens/burrower-brood-mother.webp` |
| ✓ | **Changeling** | Health 8 · speed 4 · Nip — a byting: child-sized and child-shaped and not a child -- the proportions a little off, the head a little large, the hands too long, old in the eyes. Dressed in human clothes that fit badly. Nothing monstrous on it at a glance, which is the whole horror | `tokens/changeling.webp` |
| ✓ | **Chupacabra** | Health 10 · armour 1 · speed 7 · Draining Bite — a lean hairless quadruped, grey and leathery, with a ridge of stiff spines down the back, a long muzzle and oversized hind legs built for springing. An animal, not a person: the only one of these nine that goes on four legs | `tokens/chupacabra.webp` |
| ✓ | **Cult Priest** | Health 14 · armour 1 · speed 4 · Carved Idol, Mace — A Cultist: one worshipper of something local and unofficial: plain robes over ordinary clothes, a crude carved figure held in both hand... This one the same plain robes with one piece of real finery on top -- a heavy pectoral, a painted stole, a crown of something -- and the carved idol held overhead rather than cradled. Eyes closed, mouth open mid-word. Alone in the frame -- the crowd it is talking to is not in the picture Draw this one as a man of Mediterranean appearance, in their thirties -- that is fixed, not a suggestion. | `tokens/cult-priest.webp` |
| ✓ | **Cultist** | Health 8 · speed 4 · Carved Idol, Dagger — one worshipper of something local and unofficial: plain robes over ordinary clothes, a crude carved figure held in both hands, the face lit from below. Not a hooded skeleton -- this is somebody from the next village and you would know them in daylight Draw this one as a man of Nordic appearance, in their thirties -- that is fixed, not a suggestion. | `tokens/cultist.webp` |
| ✓ | **Dhampir** | Health 14 · armour 1 · speed 5 · Draining Bite — a living person, which is the point: a lean traveller in worn coat and boots, nothing undead about the body at all. Only the eyes are wrong, and they know it. The only thing in this group that casts a shadow Draw this one as a woman of Nordic appearance, in their twenties -- that is fixed, not a suggestion. | `tokens/dhampir.webp` |
| ✓ | **Div** | Health 38 · armour 3 · speed 3 · Burning Grasp — a giant of the Persian stories: horned, tusked, skin like cracked basalt with heat in the splits, far taller than a person and roughly built. Carrying something architectural it has just pulled out of the ground | `tokens/div.webp` |
| ✓ | **Djinn** | Health 24 · armour 1 · speed 6 · Demon's Sigil, Fire Spray — a person, and a whole one: two legs, two feet, two hands, a face that holds still. Fine robes actually worn as cloth, gold at the wrists, dark unblinking eyes. **No wind, no smoke, no dust, no vapour, nothing trailing off and nothing transparent** -- the only thing not human about it is that the heels are a hand's breadth clear of the ground and nothing is holding them up | `tokens/djinn.webp` |
| ✓ | **Doomfly** | Health 12 · armour 1 · speed 7 · Nip — transport: it is how everything else arrived | `tokens/doomfly.webp` |
| ✓ | **Dragon** | Health 50 · armour 5 · speed 6 · Dragon Jaws, Fire Spray — the biggest thing in the bestiary: a long-bodied winged worm, more serpent than lizard, with a narrow head and an old intelligence in it. **Scaled in bright silver** -- the scales metallic and polished like plate armour, hard white highlights running along every edge and the light sliding off it as off steel. Wings like a bat's and far too large. It should dwarf everything drawn beside it | `tokens/dragon.webp` |
| ✓ | **Draugr** | Health 30 · armour 3 · speed 3 · Grave-Cold Hands — a barrow-dweller: a corpse swollen far past the size it was alive, hel-bla -- the blue-black of a drowned man -- in the rotted remains of good clothes, with grave-goods still on it. Heavy, slow, and far too strong. Not a skeleton: there is too much of it left | `tokens/draugr.webp` |
| ✓ | **Ecstatic** | Health 14 · speed 5 · Warhammer — A Flagellant: stripped to the shoulders under a rough habit, back and shoulders a mess of old and new scourging, a knotted cord at the belt and a mace in the hand. Ecstatic rather than angry, which is worse This one further gone than the rest: the habit discarded entirely, the body a map of old scarring, a warhammer in both hands and the head thrown back. Running, not marching Draw this one as a woman of Nordic appearance, past fifty -- that is fixed, not a suggestion. | `tokens/ecstatic.webp` |
| ✓ | **Elf** | Health 16 · armour 1 · speed 5 · Elf-Bolt — an alva of the Nordic kind, not a tall archer: slight, pale and barefoot in a thin shift, hair unbound, drawn mid-step as if still dancing and only half attending to you. **The whole figure glitters** -- a fine dust of light caught on the skin, the hair and the shift, as though it had been rolled in frost or crushed glass, and the air immediately around it sparkles too. Beautiful and slightly wrong in the proportions. No armour, ... | `tokens/elf.webp` |
| ✓ | **Estrie** | Health 16 · armour 1 · speed 6 · Draining Bite — a woman at a glance and not on a second look: hair unbound and far too long, moving as though in water, feet not quite meeting the ground, mouth dark. The hair is the picture -- that is where its strength is kept | `tokens/estrie.webp` |
| ✓ | **Fahlas** | Health 60 · armour 4 · speed 4 · Grave Candle, Arming Sword — a human king who did not stop: court dress four centuries out of fashion and perfectly kept, a thin dry face that is still a face, a circlet. **One figure and nothing else** -- no court, no attendants, no standing dead anywhere in the frame, and he is alone in it. The only minor god you could mistake for a living man | `tokens/fahlas.webp` |
| ✓ | **Familiar** | Health 6 · speed 5 · Nip — a hare, and anatomically exactly a hare: **four legs, no more and no fewer**, every limb and joint where a hare's belongs. What is wrong is not the body -- it is the attention. Pupils that do not match, a person's patience behind them, and it has been looking at you for some time. Ordinary at a distance and unbearable close up. Drawn sitting upright, watching, not attacking | `tokens/familiar.webp` |
| ✓ | **Five Legs** | Health 15 · armour 2 · speed 4 · Claws — FIVE-FOLD RADIAL: five identical limbs spaced evenly around a domed carapace, no head and no front or back, like a starfish built as a predator. Nothing else here is radial | `tokens/five-legs.webp` |
| ✓ | **Five Legs Adjutant** | Health 12 · armour 2 · speed 4 · Claws — A Five Legs: FIVE-FOLD RADIAL: five identical limbs spaced evenly around a domed carapace, no head and no front or back, like a starfish built as a predator. Nothing else here is radial This one it does not fight at all: it calls the next wave | `tokens/five-legs-adjutant.webp` |
| ✓ | **Flagellant** | Health 10 · speed 4 · Mace — stripped to the shoulders under a rough habit, back and shoulders a mess of old and new scourging, a knotted cord at the belt and a mace in the hand. Ecstatic rather than angry, which is worse Draw this one as a woman of Persian appearance, past fifty -- that is fixed, not a suggestion. | `tokens/flagellant.webp` |
| ✓ | **Flat Bug** | Health 5 · armour 1 · speed 3 · Mandibles — a low broad arachnid plated front to back, EIGHT legs splayed under a flat shell. No goblin and no humanoid head of any kind: the head is a wedge of jaw set into the shell | `tokens/flat-bug.webp` |
| ✓ | **Flat Bug Runner** | Health 4 · speed 5 · Mandibles — A Flat Bug: a low broad arachnid plated front to back, EIGHT legs splayed under a flat shell. No goblin and no humanoid head of any kind: the head is a wedge of jaw set into the shell This one sent ahead to find out where you are, and dies finding out | `tokens/flat-bug-runner.webp` |
| ✓ | **Flat Bug Shieldline** | Health 7 · armour 2 · speed 2 · Mandibles — A Flat Bug: a low broad arachnid plated front to back, EIGHT legs splayed under a flat shell. No goblin and no humanoid head of any kind: the head is a wedge of jaw set into the shell This one the front rank, which is where the Horde's armour actually is | `tokens/flat-bug-shieldline.webp` |
| ✓ | **Forest Troll** | Health 20 · armour 2 · speed 4 · Troll Fists — a skogstroll: long-limbed and hunched, hide like wet bark with lichen in the seams, a cow's tail it keeps tucked, and a face that is nearly a person's and wrong about it | `tokens/forest-troll.webp` |
| ✓ | **Gheul** | Health 14 · armour 1 · speed 5 · Draining Bite — a graveyard demon: man-high and man-shaped and wrong in every joint, grey skin drawn tight over the skull, a mouth far too wide for the jaw, no nose to speak of, fingers long enough to dig with and used for it. Crouched over turned earth, grave-dirt to the elbow. **No animal head at all** -- nothing of the hyena, the dog or the jackal in it | `tokens/gheul.webp` |
| ✓ | **Gnome** | Health 14 · armour 1 · speed 3 · Elf-Bolt — a tomte: knee-high, old-man-faced, grey homespun and a red knitted cap, with a beard far too long for the body under it. Carries itself like the owner of the place. Enormously strong for its size, which should show in the hands and the stance | `tokens/gnome.webp` |
| ✓ | **Goblin** | Health 5 · speed 3 · Goblin Spear | `tokens/goblin.webp` |
| ✓ | **Goblin Archer** | Health 5 · speed 3 · Goblin Shortbow — A Goblin:  This one it earns Loose by being able to shoot, which the spearman cannot | `tokens/goblin-archer.webp` |
| ✓ | **Goblin Chief** | Health 11 · armour 1 · speed 3 · Goblin Spear, Goblin Shield — A Goblin:  This one kill it and the Cower comes back to everybody else | `tokens/goblin-chief.webp` |
| ✓ | **Goblin Shaman** | Health 6 · speed 2 · Goblin Fetish — A Goblin:  This one the elves taught it enough glamour to be dangerous and not enough to be free | `tokens/goblin-shaman.webp` |
| ✓ | **Goblin Warrior** | Health 8 · armour 1 · speed 3 · Goblin Spear, Goblin Shield — A Goblin:  This one the one that does not run: a shield, a shell of discipline, and no Cower | `tokens/goblin-warrior.webp` |
| ✓ | **God's Spirit** | Health 14 · armour 2 · speed 4 · Balanced Dagger, Leather Armor — A Black Circle: a plain dark coat over mail, gloves, a flat wide hat, a sheaf of papers in one hand. Reads as an official rather than a soldier. The only frightening thing about the figure is how... This one where the Black Circle looks like an official, this looks like nobody: ordinary travelling clothes, no insignia, no hat, hands empty until they are not. The one in the room you would not describe afterwards Draw this one as a man of Horn of Africa appearance, in their thirties -- that is fixed, not a suggestion. | `tokens/gods-spirit.webp` |
| ✓ | **Grey Assassin** | Health 10 · armour 1 · speed 6 · Balanced Dagger, Blade Venom — a city killer in plain western dress: dark wool coat to the knee, close hood, gloves, a thin blade held reversed along the forearm. **Nothing wrapped, no veil, nothing eastern about it** -- this is somebody who can stand in a doorway on the Fourth District's own streets and be taken for a clerk. Nothing worn on it rattles Draw this one as a man of Caribbean appearance, past fifty -- that is fixed, not a suggestion. | `tokens/grey-assassin.webp` |
| ✓ | **Guild Engineer** | Health 12 · armour 2 · speed 3 · Arquebus, Brigandine — an engineer caught at the work rather than at the gun: sleeves rolled over a leather apron, a cloth cap, both hands on a tool -- a crank, a measuring rod, a length of chain -- and the arquebus slung across the back where it is out of the way. Standing upright and busy. **No goggles, nothing aimed, nothing braced** Draw this one as a man of Southeast Asian appearance, in their thirties -- that is fixed, not a suggestion. | `tokens/guild-engineer.webp` |
| ✓ | **Highwayman** | Health 10 · armour 2 · speed 6 · Matchlock Pistol, Arming Sword, Brigandine — A Bandit: one roadside robber in mismatched gear: a good sword, a bad coat, a hood or a scarf across the face. Everything worn looks taken off somebody else, because it was This one mounted-class robbery: a long riding coat, boots to the knee, a scarf to the eyes and a matchlock pistol levelled. Better dressed than the band it came from, which is the whole of its character Draw this one as a woman of Horn of Africa appearance, past fifty -- that is fixed, not a suggestion. | `tokens/highwayman.webp` |
| ✓ | **Holy Shield** | Health 18 · armour 4 · speed 3 · Longsword, Kite Shield, Plate, Great Helm — a knight of the order in full plate and a great helm, kite shield up, the faith's mark on the surcoat. Heavy, closed, and faceless -- the helm has no opening worth drawing a face in Draw this one as a man of Slavic appearance, in their twenties -- that is fixed, not a suggestion. | `tokens/holy-shield.webp` |
| ✓ | **Holy Sword** | Health 18 · armour 4 · speed 4 · Longsword, Mail Shirt, Great Helm — A Holy Shield: a knight of the order in full plate and a great helm, kite shield up, the faith's mark on the surcoat. Heavy, closed, and faceless -- th... This one the other church's knight: mail rather than plate, **a longsword held in both hands** and no shield at all, a surcoat with a different mark on it. Lighter, faster and visibly poorer -- the two orders are not equally funded and both of them know it Draw this one as a man of North African appearance, in their forties -- that is fixed, not a suggestion. | `tokens/holy-sword.webp` |
| ✓ | **Imp** | Health 6 · speed 7 · Nip — cat-sized, leathery, bat-winged, all elbows and grin, perched on something it has no business perching on. Drawn small in the frame on purpose -- scale is the joke, and it is the only thing here that looks like it is enjoying itself | `tokens/imp.webp` |
| ✓ | **Incubus** | Health 18 · armour 1 · speed 5 · Demon's Sigil, Draining Bite — beautiful and subtly over-designed -- the proportions a shade too even, the hair too deliberate -- bare-shouldered, drawn leaning in from the edge of the frame as though over a bed. Small dark horns half-hidden. Nothing exposed that a card could not print | `tokens/incubus.webp` |
| ✓ | **Keres** | Health 8 · speed 6 · Claws — one Greek death-spirit: a dark ragged woman, gaunt, bloodied to the elbow, teeth bared, stooping low over the ground towards something already down. **A single figure** -- there are others working the same field and not one of them is in this picture | `tokens/keres.webp` |
| ✓ | **Lindworm** | Health 34 · armour 3 · speed 4 · Dragon Jaws, Acid Spray — a wingless serpent-dragon of the Nordic kind: a long heavy body with ONE pair of forelegs at the front and nothing behind, dragging the rest. **Ferocious, not sluggish** -- the head low and driving forward, jaws wide open on a mouthful of back-curved teeth, gums drawn back, the small eyes fixed on what is in front of it. Scarred, filthy scale. No wings at all -- that is what makes it a lindworm and not a dragon | `tokens/lindworm.webp` |
| ✓ | **Little Folk** | Health 10 · armour 1 · speed 4 · Elf-Bolt — one of the vattar, the underground people: small, grey and earthen, dressed like a poor farmer of no particular century, with a flat look and no expression to read. Drawn half out of the ground: never fully in the open, and never in company -- one figure and no second one anywhere | `tokens/little-folk.webp` |
| ✓ | **Lugat** | Health 22 · armour 2 · speed 3 · Draining Bite — the Albanian kind: bloated and tight-skinned, still wound in its shroud with the wrapping split, moving with a full belly's slowness. Fat rather than gaunt, which is what separates it from every other corpse here | `tokens/lugat.webp` |
| ✓ | **Mantiss** | Health 12 · armour 2 · speed 4 · Grasping Claws — EIGHT legs, the front pair long and folded like a mantis's and the other six walking. Upright over them, taller than the infantry, with a narrow swivelling head | `tokens/mantiss.webp` |
| ✓ | **Mantiss Veteran** | Health 18 · armour 3 · speed 4 · Grasping Claws — A Mantiss: EIGHT legs, the front pair long and folded like a mantis's and the other six walking. Upright over them, taller than the infantry, with a narrow swivelling head This one it has done this before and takes you out of the fight first | `tokens/mantiss-veteran.webp` |
| ✓ | **Mega Beetle** | Health 30 · armour 4 · speed 2 · Heavy Mandibles — a wall that walks: the Scrips under its wings are the point of it | `tokens/mega-beetle.webp` |
| ✓ | **Mercenary** | Health 12 · armour 3 · speed 4 · Halberd, Brigandine — a hardened soldier out of the eastern forests: brigandine over travelling clothes, a halberd, an old scar and a bedroll. Professional, unbothered, and nobody's idea of a hero Draw this one as a woman of Germanic appearance, past fifty -- that is fixed, not a suggestion. | `tokens/mercenary.webp` |
| ✓ | **Mercenary Captain** | Health 18 · armour 4 · speed 4 · Greatsword, Brigandine, Great Helm — A Mercenary: a hardened soldier out of the eastern forests: brigandine over travelling clothes, a halberd, an old scar and a bedroll. Professional, unbothered, and nobody's idea of a hero This one the same hard soldier with a greatsword and a closed helm under one arm, a captain's sash and a whistle. Older, scarred across the hands, and watching the field rather than the man in front of it Draw this one as a woman of South Asian appearance, in their forties -- that is fixed, not a suggestion. | `tokens/mercenary-captain.webp` |
| ✓ | **Mob** | Health 8 · speed 4 · Dagger — A Townsfolk, and this one the same working people, no longer leaving: faces front, hands full of whatever was to hand -- a hayfork, a cobble, a bottle. Drawn as a press of bodies with no space between them, and they are not all the same person: different ages, different colours, men and women together. Frightened and coming anyway. **This is the one creature in the roster that is deliberately more than one body** Draw this one as a man of Central Asian appearance, in their twenties -- that is fixed, not a suggestion. | `tokens/mob.webp` |
| ✓ | **Mole Beast** | Health 22 · armour 2 · speed 3 · Tusks — a true mole, enlarged: a barrel of muscle with a pink snout, tiny buried eyes and huge outward-turned digging forelimbs. Fur, not chitin -- it is not one of the Horde | `tokens/mole-beast.webp` |
| ✓ | **Mole Beast Tusker** | Health 30 · armour 3 · speed 3 · Tusks — A Mole Beast: a true mole, enlarged: a barrel of muscle with a pink snout, tiny buried eyes and huge outward-turned digging forelimbs. Fur, not chitin -- it is not one of the Horde This one the one the mole men dig behind | `tokens/mole-beast-tusker.webp` |
| ✓ | **Mole Man** | Health 8 · armour 1 · speed 3 · Mole Pick — followers of the Queen of the Dark, and the only burrower that carries a tool | `tokens/mole-man.webp` |
| ✓ | **Mole Man Digger** | Health 8 · armour 1 · speed 3 · Mole Pick — A Mole Man: followers of the Queen of the Dark, and the only burrower that carries a tool This one carries a MOLE PICK: a short-hafted single-bladed digging pick, the haft cut short for swinging in a tunnel. Not a spear, not a polearm, not a lamp | `tokens/mole-man-digger.webp` |
| ✓ | **Mole Man Priest** | Health 10 · armour 1 · speed 2 · Dark Lantern — A Mole Man: followers of the Queen of the Dark, and the only burrower that carries a tool This one carries a DARK LANTERN and nothing else: a shuttered lantern in one hand, one slit open. No staff, no rod, no crook -- both arms and both hands whole and unpierced | `tokens/mole-man-priest.webp` |
| ✓ | **Mother Longhand** | Health 72 · armour 4 · speed 5 · Grasping Claws, Elf-Bolt — a ra grown enormous and wrong: the bark-and-moss body of a skogsra on a frame three times too tall, with arms that reach most of the way across the picture and hands at the end of them bigger than a person. The hollow back is still there | `tokens/mother-longhand.webp` |
| ✓ | **Mountain Troll** | Health 34 · armour 4 · speed 2 · Troll Fists, Thrown Stone — a bergtroll: a hunched mass of grey stone-hide with lichen and moss growing on its back and shoulders, a great hooked nose, small deep-set eyes and a mouth too wide. Vast, slow and mineral -- more cliff than animal, and no green skin anywhere | `tokens/mountain-troll.webp` |
| ✓ | **Mummer** | Health 8 · speed 5 · Dagger — one reveller in a carved animal mask -- a goat, horns and all -- over ordinary festival clothes, with ribbons at the sleeves and a drinking horn in hand. Mid-step and mid-song, alone in the frame. The mask is the picture, and it is not a human face Draw this one as a woman of Central Asian appearance, in their twenties -- that is fixed, not a suggestion. | `tokens/mummer.webp` |
| ✓ | **Naga** | Health 30 · armour 3 · speed 4 · Crushing Coils, Demon's Sigil — serpent from the waist down and something close to human above, with a hood of scaled skin flared behind the head and heavy jewellery it was not given. Half-submerged, coiled rather than swimming | `tokens/naga.webp` |
| ✓ | **Nature Spirit** | Health 20 · armour 1 · speed 5 · Elf-Bolt — a skogsra: from the front a tall woman made of the wood -- bark-grained skin, moss in the hair, eyes like a deer's -- and from any other angle hollow, the back open like a rotted trunk. Draw her turning, so both are true at once. That hollow is the whole point | `tokens/nature-spirit.webp` |
| ✓ | **Pincer** | Health 25 · armour 3 · speed 4 · Grasping Claws — generals, intelligent, armoured: it takes somebody out of the fight rather than down | `tokens/pincer.webp` |
| ✓ | **Pincer Marshal** | Health 35 · armour 4 · speed 4 · Grasping Claws — A Pincer: generals, intelligent, armoured: it takes somebody out of the fight rather than down This one the largest armoured form in the Horde, heavy pincers held high and a thick plated hood over the front. NO FLAGS, no banners, no standards, no insignia, no cloth of any kind | `tokens/pincer-marshal.webp` |
| ✓ | **Processor** | Health 4 · armour 1 · speed 3 · Nip — a single worker, unarmoured and unarmed, built for carrying rather than fighting: a low six-legged body with the front pair held up and loaded, mouthparts busy. Caught mid-task and not looking up | `tokens/processor.webp` |
| ✓ | **Processor Driller** | Health 6 · armour 1 · speed 3 · Mandibles — A Processor: a single worker, unarmoured and unarmed, built for carrying rather than fighting: a low six-legged body with the front pair held up and loaded, mouthparts busy. Caught mid-task and not looking up This one what the Horde uses instead of a siege engine, and the reason walls fall from below | `tokens/processor-driller.webp` |
| ✓ | **Queen of the Dark** | Health 70 · armour 5 · speed 3 · Dark Lantern, Grave-Cold Hands — an immense seated figure in the dark, more cave formation than body, with a crown of rock and a face only suggested. **Alone** -- no mole men, no attendants, no court, nothing else alive in the frame; the scale comes from how completely she fills it. The one light in the picture is the shuttered lantern in her hand | `tokens/queen-of-the-dark.webp` |
| ✓ | **Revenant** | Health 24 · armour 2 · speed 4 · Grave-Cold Hands — a body walking with a purpose and nothing else: dried rather than rotted, the clothes it was buried in, the wound that killed it still open and not bleeding. The face is intact and recognisable, which is the worst thing about it | `tokens/revenant.webp` |
| ✓ | **Rush Spider** | Health 10 · armour 1 · speed 8 · Mandibles — cavalry: it arrives before you have finished deciding | `tokens/rush-spider.webp` |
| ✓ | **Rush Spider Rider** | Health 14 · armour 1 · speed 8 · Mandibles — A Rush Spider: cavalry: it arrives before you have finished deciding This one carrying a Mole Man, which is two statblocks arriving as one problem | `tokens/rush-spider-rider.webp` |
| ✓ | **Salt Baron** | Health 16 · armour 2 · speed 4 · Matchlock Pistol, Arming Sword, Fine Clothes — A Smuggler: a west-coast sailor turned quiet trader: oilskin, a knitted cap, salt-stained boots, a crossbow held low and ready. **The figure and the crossbow and nothing else** -- no crates, no b... This one a west-coast magnate gone slightly to seed: a good coat over sea-weathered skin, rings, a pistol worn openly on the hip. Standing on a quay as though it were owned, because at one point it was Draw this one as a man of Nordic appearance, in their thirties -- that is fixed, not a suggestion. | `tokens/salt-baron.webp` |
| ✓ | **Scrip** | Health 2 · speed 6 · Nip — small and quick on EIGHT thin legs, more eye than body -- a cluster of eyes over a trunk barely bigger than a fist. One of them and not a swarm | `tokens/scrip.webp` |
| ✓ | **Scrip Watcher** | Health 2 · speed 7 · Nip — A Scrip: small and quick on EIGHT thin legs, more eye than body -- a cluster of eyes over a trunk barely bigger than a fist. One of them and not a swarm This one the one that is still watching after you killed the others | `tokens/scrip-watcher.webp` |
| ✓ | **Sea Serpent** | Health 40 · armour 3 · speed 6 · Crushing Coils, Dragon Jaws — a vast limbless water-worm, drawn as a series of humps breaking a flat surface with the head low and forward at one end -- the shape of every lake-monster sighting ever reported. Most of it is under the water and should stay there | `tokens/sea-serpent.webp` |
| ✓ | **Shade** | Health 10 · speed 5 · Grave Candle — barely there: the shape of a person in thin grey wash, the edges losing themselves into the paper, carrying a single guttering candle that is the most solid thing in the picture. No chains, no skull, no sheet -- just somebody almost rubbed out | `tokens/shade.webp` |
| ✓ | **Skaah** | Health 40 · armour 2 · speed 4 · Nip — a drop ship: balloon-like, gigantic, and full of something worse | `tokens/skaah.webp` |
| ✓ | **Skaah Bloated** | Health 60 · armour 1 · speed 3 · Acid Spray — A Skaah: a drop ship: balloon-like, gigantic, and full of something worse This one full, low and leaking: it is going to come down somewhere | `tokens/skaah-bloated.webp` |
| ✓ | **Slitherer** | Health 7 · armour 1 · speed 4 · Mandibles — a long low body dragging between EIGHT short legs set wide along its sides -- it slithers because the body is on the ground, not because it has no legs | `tokens/slitherer.webp` |
| ✓ | **Slitherer Brood** | Health 4 · armour 1 · speed 5 · Mandibles — A Slitherer: a long low body dragging between EIGHT short legs set wide along its sides -- it slithers because the body is on the ground, not because it has no legs This one is smaller and leaner, the same animal at two-thirds the size, and it is drawn alone -- the others it travels with are not in the picture | `tokens/slitherer-brood.webp` |
| ✓ | **Smash Beetle** | Health 20 · armour 3 · speed 2 · Tail Club — it is here for the wall, and you are in the way of the wall | `tokens/smash-beetle.webp` |
| ✓ | **Smash Beetle Breaker** | Health 28 · armour 4 · speed 1 · Tail Club — A Smash Beetle: it is here for the wall, and you are in the way of the wall This one bred bigger for the gates of the Third Ring, and it does not turn quickly | `tokens/smash-beetle-breaker.webp` |
| ✓ | **Smuggler** | Health 10 · armour 1 · speed 4 · Crossbow, Leather Armor — a west-coast sailor turned quiet trader: oilskin, a knitted cap, salt-stained boots, a crossbow held low and ready. **The figure and the crossbow and nothing else** -- no crates, no barrels, no bundles, no cargo, no quay. The goods are elsewhere, which is the point of the trade Draw this one as a man of Caribbean appearance, in their twenties -- that is fixed, not a suggestion. | `tokens/smuggler.webp` |
| ✓ | **Stinger** | Health 6 · speed 6 · Sting — it goes for whoever is concentrating | `tokens/stinger.webp` |
| ✓ | **Stinger Drone** | Health 10 · speed 6 · Acid Spray — A Stinger: it goes for whoever is concentrating This one the sting became a nozzle somewhere in the hive's history | `tokens/stinger-drone.webp` |
| ✓ | **Strigoi** | Health 28 · armour 2 · speed 4 · Draining Bite — the troubled dead of the Romanian stories: gaunt and upright and almost presentable, dressed as a living person of standing, with too-long nails and a mouth that does not close properly. It does not shamble. It arrives | `tokens/strigoi.webp` |
| ✓ | **Sweeper** | Health 8 · armour 1 · speed 7 · Claws — EIGHT legs folded tight under four wings. Not a bird and not a bat: the wings are thin and veined off a segmented body, and there are no feathers anywhere on it | `tokens/sweeper.webp` |
| ✓ | **Sweeper Carrier** | Health 12 · armour 1 · speed 6 · Nip — A Sweeper: EIGHT legs folded tight under four wings. Not a bird and not a bat: the wings are thin and veined off a segmented body, and there are no feathers anywhere on it This one it is carrying something, and the something is the encounter | `tokens/sweeper-carrier.webp` |
| ✓ | **Sweeper Diver** | Health 6 · armour 1 · speed 9 · Claws — A Sweeper: EIGHT legs folded tight under four wings. Not a bird and not a bat: the wings are thin and veined off a segmented body, and there are no feathers anywhere on it This one it comes down on whoever is concentrating | `tokens/sweeper-diver.webp` |
| ✓ | **Tempter** | Health 20 · armour 1 · speed 4 · Demon's Sigil — immaculate and entirely at ease: good clothes a century out of date, hands open and empty, a slight pleasant expression. Nothing visibly wrong until you look for a shadow and find it pointing the wrong way | `tokens/tempter.webp` |
| ✓ | **Terror Fly** | Health 18 · armour 2 · speed 6 · Fire Spray — captains, and the first thing in the roster that burns ground | `tokens/terror-fly.webp` |
| ✓ | **Terror Fly Torch** | Health 14 · armour 2 · speed 6 · Fire Spray — A Terror Fly: captains, and the first thing in the roster that burns ground This one all the fire and none of the authority | `tokens/terror-fly-torch.webp` |
| ✓ | **The Cat God** | Health 55 · armour 4 · speed 9 · Grasping Claws — a cat the size of a cart horse and in no way a lion: the exact proportions and indifference of a domestic cat, scaled up, sitting. Too many shadows behind it for the light in the frame. Nothing about the pose suggests it has agreed to be here | `tokens/the-cat-god.webp` |
| ✓ | **The Land Jelly** | Health 90 · armour 3 · speed 1 · Crushing Coils — a vast translucent mass filling the whole frame, with things suspended inside it that are clearly older than the picture -- bones, worked stone, a boat. No face, no front, no limbs. The biggest and least animal thing in the set | `tokens/the-land-jelly.webp` |
| ✓ | **The Purple** | Health 12 · armour 1 · speed 5 · Crossbow, Blade Venom, Serpent's Milk — A Grey Assassin: a city killer in plain western dress: dark wool coat to the knee, close hood, gloves, a thin blade held re... This one the same plain western coat, in deep purple-dyed wool and better cut, hood back, kneeling over a flat case of stoppered vials open across one knee. **No crossbow anywhere in the picture, and no blade either** -- the vials are the whole of it. Working rather than stalking Draw this one as a woman of Southeast Asian appearance, in their forties -- that is fixed, not a suggestion. | `tokens/the-purple.webp` |
| ✓ | **The Queen** | Health 60 · armour 4 · speed 0 · Heavy Mandibles — enormous and rooted to the floor, armoured in overlapping plate like a siege engine, heavy jaws and a crown of horn. The most frightening thing in the set: more armour than the Marshal and more mass than anything that walks | `tokens/the-queen.webp` |
| ✓ | **The Troll King** | Health 85 · armour 6 · speed 4 · Troll Fists, Thrown Stone — a bergtroll grown past any scale a troll should reach -- a moving ridge of stone-hide with full-sized pines rooted along its back and shoulders, a crude iron crown half swallowed by the hide it was put on. The trolls around its feet are knee-high | `tokens/the-troll-king.webp` |
| ✓ | **The Unseen** | Health 12 · armour 2 · speed 6 · Dagger, Leather Armor — A Grey Assassin: a city killer in plain western dress: dark wool coat to the knee, close hood, gloves, a thin blade held reversed along the forearm. **Nothing wrapped, no veil, nothing eastern about it** -- this is some... This one a western monastic at a glance -- plain habit, cord belt, hood up, hands inside the sleeves -- and nothing about the stance belongs to a monk. The dagger is not visible and is obviously there Draw this one as a woman of West African appearance, in their forties -- that is fixed, not a suggestion. | `tokens/the-unseen.webp` |
| ✓ | **The Winter Lady** | Health 65 · armour 4 · speed 5 · Killing Frost, Elf-Bolt — a tall elven woman made of winter: skin the white of old ice with the grey of it underneath, hair and gown drifting upward rather than down, bare feet not melting what she stands on. Beautiful, composed, and the air around her visibly colder | `tokens/the-winter-lady.webp` |
| ✓ | **Town Guard** | Health 10 · armour 2 · speed 3 · Spear, Wooden Shield, Leather Armor, Light Helm — a watchman in a padded coat and an open kettle helm with a spear and a round shield, a town's badge on the shield and nothing else to mark them. Tired rather than fierce Draw this one as a man of North African appearance, past fifty -- that is fixed, not a suggestion. | `tokens/town-guard.webp` |
| ✓ | **Townsfolk** | Health 4 · speed 3 · Dagger — one ordinary working person of no particular century: apron, patched wool, boots worn down on one side, a basket or a bundle still in the hands. Already turning away from whatever is happening. The dagger at the belt has only ever cut bread Draw this one as a woman of West African appearance, in their twenties -- that is fixed, not a suggestion. | `tokens/townsfolk.webp` |
| ✓ | **Trollkin** | Health 10 · armour 1 · speed 4 · Troll Club — knee-high to a person and broad, grey-brown and leathery, with a troll's nose and a troll's ears on a body built low to the ground. Rough homespun and a stick. One of many, drawn alone: a single figure in the frame, and what is unsettling about it is how plainly it is not the only one | `tokens/trollkin.webp` |
| ✓ | **Wanderer** | Health 18 · armour 1 · speed 7 · Dagger — a traveller that does not resolve: layered road clothes, a staff, a pack -- and the parts of it furthest from the centre are smeared into motion, as though half of it has already left. Never drawn standing still | `tokens/wanderer.webp` |
| ✓ | **Watch Sergeant** | Health 14 · armour 3 · speed 3 · Halberd, Mail Shirt, Light Helm — A Town Guard: a watchman in a padded coat and an open kettle helm with a spear and a round shield, a town's badge on the shield and nothing else to mark them. Tired rather than fierce This one an older watchman with a halberd and a mail shirt instead of a spear and a coat, a sergeant's sash and a horn at the belt. Shouting rather than fighting Draw this one as a man of Mediterranean appearance, in their twenties -- that is fixed, not a suggestion. | `tokens/watch-sergeant.webp` |
| ✓ | **Watcher** | Health 26 · armour 2 · speed 5 · Demon's Sigil — tall, still and frontal, with far too many eyes -- down the arms, across the chest, open in the wings. Not bestial and not beautiful: a watching thing in the shape of a person, drawn facing the viewer dead-on, which nothing else in the set does | `tokens/watcher.webp` |
| ✓ | **Wyvern** | Health 22 · armour 2 · speed 8 · Claws — a two-legged winged worm, hawk-sized rather than dragon-sized: wings and hind legs and nothing else, built entirely for the stoop. **The tail grows out of the base of the spine in one unbroken line** and tapers from there to a barbed point -- it is part of the body and continuous with it, never a separate whip-shape floating near the hips. Lean and quick where the dragon is heavy | `tokens/wyvern.webp` |

## The starter Warrior

The pregenerated character a first session plays. One token, same shape as a creature's, and the only player-side one in the brief: a real party arrives with its own.

**1 piece**, 1 wired up. **1:1, 512 × 512, transparent.** Suggested path: `cardrpg/art/tokens/`

| | Name | What it is | File |
|---|---|---|---|
| ✓ | **Starter Warrior** | Health 12 · Longsword, Wooden Shield, Leather Armor, Healing Potion | `tokens/starter-warrior.webp` |

