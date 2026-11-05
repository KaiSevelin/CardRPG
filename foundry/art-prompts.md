# Art prompts

**509 prompts**, one per piece in [the art list](art-list.md), in the style the six-flavour test picked: **brush and ink wash**. Generated from the game's own content by `cardrpg/test/art-prompts.mjs` — regenerate it rather than editing it.

It walks the same `GROUPS` the art list walks, by importing it rather than copying it, so the two files cannot disagree about what exists.

## How to use this

1. Open a **new chat**. Paste the group's **style capsule** first, on its own, and let it be acknowledged.
2. Then paste subjects from that group, **one message each**.
3. Start a fresh chat every **20 or so**, and re-paste the capsule. Style drifts along a long conversation, and a fresh chat is free.
4. Save each result under the **File** given with it. The path is what wires the picture into the game.

**Do not mix groups in one chat.** The capsules differ — a token's capsule asks for transparency and a back's asks for no safe area — and a chat that has seen two of them will blend them.

> **Why the subjects are short.** The capsule carries the style, the format, the palette and the composition rule, and it is identical for every piece in a group. A subject that restated any of that would be a second statement of it, free to drift. The subject says what the picture is **of** and nothing else.

## What the composition rule is, and why it reads like that

The first six-flavour test said *keep the focal point at about 30% of the height*, and got six full standing figures with their heads above the panel line — because a full figure is what anyone draws from that sentence. It is written as a **crop** in the capsules below, which is an instruction an image model can actually follow.

The numbers are measured, not guessed, and they are the **worst case across the whole set**: a card is drawn as small as 128px, and the wordiest card in the game wraps its primary half to four lines, which pulls the clear window down to 13%–43%.

**And then the crop wording got the crop and lost the height.** The first real batch of seventeen faces put dark mass inside the top 13% fifteen times — helmets, in the band where the card prints its own name — and sixteen of the seventeen had the centre of their ink below 43%, median 57%. The rule asked for 28% and got 57%.

So the numbers are gone from the capsules and the picture is in their place: **the top quarter is empty, the bottom half is scenery.** A percentage is not something a model can act on; an empty quarter is. The same sentence also buys back the light — that quarter has to be bare paper for the crop to work, and fourteen of the first twenty-two had no bare paper anywhere.

## Deck backs

**Draw these first.** 6 pictures against 503 faces, and they are what a table looks at all evening, since a deck is face down from the first second of play.

### The capsule — paste this once

```text
The back of a deck of cards in a tabletop fantasy RPG.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION.
- **No safe area.** Nothing is printed over a back, so the whole card is yours.
- A back does one job: it says which deck a face-down card came from, across a table, at a
  glance, all evening. It is a **design**, not an illustration -- symmetrical or near, centred,
  and legible upside down, because half the table sees it that way.
- It must be unmistakable beside the other backs in this set at **128 pixels**.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red, on the device itself.
- Warm, desaturated, earthy. **No cyan, no teal, no blue, no green, no purple, no magenta, no
  neon.** Every hue in the picture is between red and amber. There are no exceptions to this.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

#### The action deck

File: `backs/action.webp`

```text
SUBJECT. A deck back for **The action deck**. Face down in front of every player, all game. Cards from the common pool and all four Ways mix in one deck, so this is NOT a Way's back -- the deck is yours, not Shade's.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 5 in this set.
```

#### The fate deck

File: `backs/fate.webp`

```text
SUBJECT. A deck back for **The fate deck**. The back players see most: it is shuffled and face down by design, and that is what makes a thin deck a risk rather than a lookup. Twenty cards, drawn from constantly.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 5 in this set.
```

#### The skill deck

File: `backs/skill.webp`

```text
SUBJECT. A deck back for **The skill deck**. What you do when you are NOT fighting: climbing, listening, lifting, picking a lock, talking someone round. **No weapon of any kind on this one** -- no blade, no point, no hilt, no arrowhead. A hand, a key, an eye, a knot, a lens: the tools of a scene. It has to read as clearly NOT the action deck at a glance, since both are face down in front of the same player.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 5 in this set.
```

#### The twist deck

File: `backs/twist.webp`

```text
SUBJECT. A deck back for **The twist deck**. The GM's deck, and the only one on their side of the table. Drawn when something goes partly wrong, so the back is a promise of a complication rather than a threat: **a fork** -- one line arriving and leaving as two, mirrored left to right, with open paper around it. No knot, no spiral, no coil: nothing that fills its own space or turns rather than mirrors. Not a weapon and not a monster -- the price of a Partial is never an attack.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 5 in this set.
```

#### The Wild Magic deck

File: `backs/wild.webp`

```text
SUBJECT. A deck back for **The Wild Magic deck**. Drawn only when a Wild comes out of a fate deck, so its back is a promise that something strange is about to happen.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 5 in this set.
```

#### Intent, any creature

File: `backs/npc.webp`

```text
SUBJECT. A deck back for **Intent, any creature**. The back on every creature's intent deck in the game. A face-down intent says *this thing is about to act*, and which thing it is is already on the table in front of you -- so the back carries the threat rather than the species.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 5 in this set.
```

## The starter deck

**10 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/starter/`.

The first ten cards a table ever sees. Plain, legible, no cleverness.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. The first ten cards a table ever sees. Plain, legible, no cleverness.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Advance

File: `cards/starter/advance.webp`

```text
SUBJECT. "Advance" — Move 3 · / Move 2

Draw ground covered -- weight forward, the last footfall still behind.
```

### Draw Steel

File: `cards/starter/draw-steel.webp`

```text
SUBJECT. "Draw Steel" — Strike · / Ready

Draw a blade coming free of the scabbard already moving forward: the draw and the cut are one motion, and the empty scabbard is still swinging from it.
```

### Heavy Swing

File: `cards/starter/heavy-swing.webp`

```text
SUBJECT. "Heavy Swing" — Strike +1 ignores 2 armor · / Move 1

Draw a swing with everything behind it, caught at the bottom of its arc -- the committed blow of somebody who decided before they moved.
```

### Lunge

File: `cards/starter/lunge.webp`

```text
SUBJECT. "Lunge" — Move 2, Strike · / Move 1

Draw ground covered -- weight forward, the last footfall still behind; the instant a blow lands, the weapon already through -- never wound up, never posing.
```

### Quick Hands

File: `cards/starter/quick-hands.webp`

```text
SUBJECT. "Quick Hands" — Use · / Ready

Draw a hand working an object, the object mid-use rather than held up to be seen; a weapon coming to hand, caught between carried and held.
```

### Second Wind

File: `cards/starter/second-wind.webp`

```text
SUBJECT. "Second Wind" — Heal 2 · / Use

Draw a fighter back on their feet and finding the next breath -- chest working, head coming up, the moment the body agrees to keep going.
```

### Shield Up

File: `cards/starter/shield-up.webp`

```text
SUBJECT. "Shield Up" — Defend Block applies to every attack until your next turn · / Move 1

Draw a shield brought fully up and settled, the body behind it made small. This is cover meant to last a while rather than a parry -- nothing in the frame is moving.
```

### Strike

File: `cards/starter/strike.webp`

```text
SUBJECT. "Strike" — Strike · / Move 1

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.
```

### Taunt

File: `cards/starter/taunt.webp`

```text
SUBJECT. "Taunt" — Compelled (1) · / Move 1

Draw pulled toward something against the will.
```

### Weapon Swap

File: `cards/starter/weapon-swap.webp`

```text
SUBJECT. "Weapon Swap" — Ready · / Strike

Draw one weapon let go and falling while the other hand closes on the next. Both are in frame and neither is being held.
```

## The common pool

**6 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/common/`.

Every character in the game draws this one, so it belongs to nobody in particular: no Way's colour, no named hero, no signature weapon.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. Every character in the game draws this one, so it belongs to nobody in particular: no Way's colour, no named hero, no signature weapon.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Both Hands

File: `cards/common/both-hands.webp`

```text
SUBJECT. "Both Hands" — Ready, Strike · / Ready

Draw a weapon coming to hand, caught between carried and held; the instant a blow lands, the weapon already through -- never wound up, never posing.
```

### Dig In

File: `cards/common/dig-in.webp`

```text
SUBJECT. "Dig In" — Heal 2 · / Move 1

Draw somebody going to ground instead of forward: down on one knee behind whatever cover there is, a hand pressed hard against a wound, breath coming back. The recovery is in refusing to advance, so nothing in the frame is moving.
```

### Hold the Line

File: `cards/common/hold-the-line.webp`

```text
SUBJECT. "Hold the Line" — Defend · / Strike -1

Draw boots planted on ground that is not being given up, guard high and the weapon still working. The subject is the line under the feet, not the shield above them.
```

### Measure

File: `cards/common/measure.webp`

```text
SUBJECT. "Measure" — Strike +1 ignores Block · / Move 1

Draw a blow placed exactly, the point going into a gap the width of a hand. Precision rather than force, and the opposite of a heavy swing.
```

### Off-Hand Blow

File: `cards/common/off-hand-blow.webp`

```text
SUBJECT. "Off-Hand Blow" — Strike · / Strike -1

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; then the weaker follow-up, off the hand that was not busy.
```

### Press

File: `cards/common/press.webp`

```text
SUBJECT. "Press" — Strike, Move 1 · / Move 2

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; ground covered -- weight forward, the last footfall still behind.
```

## NPC intent cards

**36 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/npc/`.

Face-up on the table during a fight, and seen behind a goblin, a troll and a dragon alike. Draw the **shape of the move**, never a portrait of who is making it: *Close In* is a thing closing in.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. Face-up on the table during a fight, and seen behind a goblin, a troll and a dragon alike. Draw the **shape of the move**, never a portrait of who is making it: *Close In* is a thing closing in.

WHO IS DOING IT. **The actor is nobody, and that overrides everything below.**
This one picture is used by every creature that has earned the card, so it must not show what kind
of thing is acting.

- No species markers on the actor: no human face, no human proportions, no armour or clothing
  belonging to a people, no scales, no fur, no feathers, no wings, no recognisable weapon from any
  culture.
- **Nothing in frame may say how big the actor is.** Scale gives it away even when anatomy does
  not, so no doorways, no trees, no furniture and no horizon that implies a standing height.
- If the actor must appear at all it is a dark anonymous mass, cropped hard, reading as motion
  rather than as anatomy. One limb or one edge entering frame beats a whole creature every time.
- Where the subject below names a weapon, read it as *whatever this creature strikes with*: an
  edge, a claw, a mass, a mandible. Never a sword.

WHAT IS STILL DRAWN IN FULL. **Only the actor is anonymous -- nothing else in the frame is.**
The far side of this card is a player character, and players are human.

- The receiving end is a person, drawn as one: a hand, a boot, a shoulder, a raised shield, a
  dropped blade, a guard pointing the wrong way, a figure going down.
- The ground is a person's ground: churned dirt, a splintered door, the broken crust of a trap,
  two furrows where somebody's heels dragged.
- Aftermath is a subject in its own right: dust still falling, a wake closing over, a print half
  filled in, a mark on skin doing more than the blow that made it.
- **This is the whole of what separates these cards.** The actor is a dark mass on every one of
  them; if the action is generic too then the pool is one picture over and over. Draw the subject
  line literally, specifically, and in detail.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- the point of contact, the place the ground is marked, the gap where the distance went -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Bring It Down

File: `cards/npc/bring-it-down.webp`

```text
SUBJECT. "Bring It Down" — Strike ignores armour · Strike a door, a wall or a held position, ignoring its armour entirely.

Draw a door failing at the hinge: split timber, dust blowing out through the gap, the daylight wrong behind it. Whatever hit it is present only as the shape of the hole.
```

### Bull Through

File: `cards/npc/bull-through.webp`

```text
SUBJECT. "Bull Through" — Move, Strike · Move your speed through a figure in the way, pushing it aside, then Strike.

Draw a human figure shouldered aside mid-stride, off balance and out of the way, while whatever did it has not changed direction by a hair.
```

### Call More

File: `cards/npc/call-more.webp`

```text
SUBJECT. "Call More" — Something arrives at the edge of the scene. The GM says what and how much.

Draw the edge of the scene filling up: shapes arriving along the far dark border of the frame, indistinct, numerous, and nearer than they were.
```

### Carry

File: `cards/npc/carry.webp`

```text
SUBJECT. "Carry" — Move · A willing ally rides: it moves with you, and may still act when you stop.

Draw one thing riding another: a smaller dark shape set high on a larger moving one, the two reading as a single silhouette with two centres of weight.
```

### Carry It Off

File: `cards/npc/carry-it-off.webp`

```text
SUBJECT. "Carry It Off" — Move · Move your speed, take hold of a figure already down, and leave with it. The Horde eats what it wins.

THIS CARD IS THE EXCEPTION. Only Processor and Processor Driller ever draws it, so draw that creature: the capsule's rules about species, anatomy and scale do not apply here, and this picture should be unmistakably of one thing.

Draw two small workers leaving with somebody: a human arm trailing between them, heels marking the dirt, the pair of them already turned away toward the dark.
```

### Charge

File: `cards/npc/charge.webp`

```text
SUBJECT. "Charge" — Move, Strike +1 · Move double your speed in a straight line, then Strike. The distance is the damage.

Draw a straight line of ruined ground running from the far distance to the bottom edge, dust still falling into it. The distance is the damage, so the distance is the subject.
```

### Close In

File: `cards/npc/close-in.webp`

```text
SUBJECT. "Close In" — Move, Strike · Move your speed, then Strike.

Draw the gap itself: a dark mass filling one side of the frame, a braced human boot at the other, and between them a narrow strip of trodden ground with the mass's shadow already across it. The subject is the strip, and there is less of it than there was.
```

### Drag Down

File: `cards/npc/drag-down.webp`

```text
SUBJECT. "Drag Down" — Strike Grappled (1) · Strike; on a hit the target is Grappled and goes nowhere.

Draw a human arm and shoulder being pulled downward out of frame, fingers still open, the ground coming up to meet them. Something has hold and is not letting go.
```

### Envenom

File: `cards/npc/envenom.webp`

```text
SUBJECT. "Envenom" — Strike · Strike; on a hit it carries whatever you carry.

Draw a small wound doing far more than it should: a shallow mark on a human forearm with the skin going wrong around it, drawn much larger than the blow that made it.
```

### Fade

File: `cards/npc/fade.webp`

```text
SUBJECT. "Fade" — Move, Strike Invisible (1) · Move your speed and become Hidden. You were never standing there.

Draw the place something was standing, drawn as evidence: crushed grass, half a print, the air slightly wrong above it. Absence as the subject.
```

### Feed

File: `cards/npc/feed.webp`

```text
SUBJECT. "Feed" — Strike, Heal · Strike an adjacent figure and heal what you took out of it.

Draw something taken out rather than put in: a mark at a human throat and a dry pallor spreading from it, whatever is above it reading only as a stillness.
```

### Give Ground

File: `cards/npc/give-ground.webp`

```text
SUBJECT. "Give Ground" — Move · Move your speed away from the nearest enemy. A hurt thing that can leave, does.

Draw backward footing, drawn as the marks it leaves: two parallel furrows dragged through dirt away from the fight, the weight of the frame behind rather than ahead.
```

### Go Under

File: `cards/npc/go-under.webp`

```text
SUBJECT. "Go Under" — Move · Leave the map. Next round you arrive anywhere you could have walked to.

Draw a hole in the ground with the spoil fanned around its mouth and nothing in it. It was here, and now it is beneath you.
```

### Gorge

File: `cards/npc/gorge.webp`

```text
SUBJECT. "Gorge" — Strike, Shake 1 · Strike, and eat what comes away: shake one condition off yourself.

Draw a feeding posture, low and entirely still, over something already down -- the ground beneath it dark and wet, no blow anywhere in the frame. It has stopped fighting in order to do this.
```

### Hold the Line

File: `cards/npc/hold-the-line.webp`

```text
SUBJECT. "Hold the Line" — Defend, Block 1 range 1 · Defend, and an ally adjacent to you gains Block 1.

Draw cover put somewhere else: a dark edge angled out across the human figure standing alongside rather than over whatever is holding it, that figure's own guard lowered and resting.
```

### Knock It Down

File: `cards/npc/knock-it-down.webp`

```text
SUBJECT. "Knock It Down" — Strike Prone (1) · Strike with the whole weight of you; on a hit the target is Prone.

Draw the instant a human figure's heels leave the ground -- shield still up and useless, body going backward and down, the ground rising into the bottom of the frame to meet it.
```

### Lash Out

File: `cards/npc/lash-out.webp`

```text
SUBJECT. "Lash Out" — Strike blast 1 · Strike every figure adjacent to you, friend or not.

Draw a ring driven outward from one point: dust, a dropped human blade and a torn cloak all moving away from the centre at once, nothing in the frame aimed at anything.
```

### Lie Still

File: `cards/npc/lie-still.webp`

```text
SUBJECT. "Lie Still" — Nothing at all, and the next Strike you make cannot be answered by a reaction.

Draw something indistinguishable from the ground -- a dark mass under dust and leaf litter, its outline deliberately broken, nothing in it reading as a face. Perfectly motionless.
```

### Long Arm

File: `cards/npc/long-arm.webp`

```text
SUBJECT. "Long Arm" — Strike · Strike at reach without closing, and stay where you are.

Draw reach without closing: one long dark limb crossing the whole frame from a single edge, the body it belongs to out of frame and plainly staying there.
```

### Loose

File: `cards/npc/loose.webp`

```text
SUBJECT. "Loose" — Strike · Strike at your weapon's range.

Draw a shot already gone: the launch surviving only as a line of disturbed air leaving the bottom corner, and nothing yet arrived at the far end of it.
```

### Open the Hold

File: `cards/npc/open-the-hold.webp`

```text
SUBJECT. "Open the Hold" — The belly splits along the seam: whatever it was carrying is on the ground beside it, and may act this round.

THIS CARD IS THE EXCEPTION. Only Skaah and Skaah Bloated ever draws it, so draw that creature: the capsule's rules about species, anatomy and scale do not apply here, and this picture should be unmistakably of one thing.

Draw a gigantic sagging body splitting along the belly seam, and what was inside it coming out onto the ground underneath -- more of it than the shape above could hold.
```

### Order

File: `cards/npc/order.webp`

```text
SUBJECT. "Order" — An ally within sight acts again, or moves its speed. You do nothing yourself.

Draw a gesture that moves somebody else: one limb extended and pointing out of frame, and far away in the depth of the picture three small dark shapes already going that way.
```

### Pick the Soft One

File: `cards/npc/pick-the-soft-one.webp`

```text
SUBJECT. "Pick the Soft One" — Move, Strike ignores Block · Move your speed and Strike whoever is least ready for it, round the shield rather than through it: Block does not answ...

Draw a blow arriving past a raised human shield instead of against it -- the guard still whole, still high, facing the wrong way, and the strike already behind it and in.
```

### Press

File: `cards/npc/press.webp`

```text
SUBJECT. "Press" — Strike, Strike -1 · Strike, and Strike again at −1. Nothing clever, twice.

Draw the same blow arriving twice -- the first impact closing over the face of a human shield, the second coming in behind it lower and plainly less ready. Nothing clever: twice.
```

### Set and Wait

File: `cards/npc/set-and-wait.webp`

```text
SUBJECT. "Set and Wait" — Defend · Defend, and keep a reaction for whoever comes.

Draw absolute stillness held over an empty approach -- a guard up and unmoving, dust settled rather than rising, the ground ahead undisturbed. The picture is the waiting, and the blow has not come.
```

### Shelter

File: `cards/npc/shelter.webp`

```text
SUBJECT. "Shelter" — Defend · Allies within 1 cannot be targeted at range while you stand.

Draw a dark bulk stood square to throw a shadow that a human figure is standing inside -- cover from above and from far off, not from the thing in front.
```

### Spoil the Ground

File: `cards/npc/spoil-the-ground.webp`

```text
SUBJECT. "Spoil the Ground" — Ready · Nothing at anybody: one square within reach is a trap now, and stays one.

Draw one square of ground made wrong and nobody in frame at all: a thin broken crust, darkness under the break, and careful marks around its edge where something worked and left.
```

### Spray

File: `cards/npc/spray.webp`

```text
SUBJECT. "Spray" — Strike · Strike everything in the area, at range. Whatever you breathe, you breathe it on your own kind too.

Draw a wide cone thrown forward from the bottom edge of the frame, already wetting and darkening the ground along its far rim. Aimed at an area and not at anybody.
```

### Stoop

File: `cards/npc/stoop.webp`

```text
SUBJECT. "Stoop" — Move, Strike · Arrive from above: move twice your speed, then Strike.

Draw the view from underneath: a shadow dropping across lit ground, small at the frame's edges and already huge at its centre, and nothing yet in frame to cast it.
```

### Strike and Step

File: `cards/npc/strike-and-step.webp`

```text
SUBJECT. "Strike and Step" — Strike, Move · Strike, then move your speed away.

Draw one frame holding two moments: the dust of a blow still hanging in the air where something was, and a dark shape already a clear pace beyond it. Hit, then gone, read left to right.
```

### Submerge

File: `cards/npc/submerge.webp`

```text
SUBJECT. "Submerge" — Move · Go under the water. Next round you surface anywhere along it.

Draw a closing ring on water: the wake still spreading outward, flat light across the surface, and no shape at all beneath it.
```

### Swarm

File: `cards/npc/swarm.webp`

```text
SUBJECT. "Swarm" — Move, Strike +1 · Move, then Strike at +1 for each ally already adjacent to your target.

Draw too many at once: four or five dark edges converging on one small patch of ground from every side of the frame, not one of them whole and not one of them the subject.
```

### Take Stock

File: `cards/npc/take-stock.webp`

```text
SUBJECT. "Take Stock" — Shake 1 · Nothing this round, and shake one condition off.

Draw a round spent on itself: nothing attacking anywhere in frame, a haze lifting off and away from a dark shape standing square, dust falling rather than rising.
```

### The Hive Obeys

File: `cards/npc/the-hive-obeys.webp`

```text
SUBJECT. "The Hive Obeys" — Three allies within sight each move their speed, or one of them acts twice. She does nothing herself but decide.

THIS CARD IS THE EXCEPTION. Only The Queen ever draws it, so draw that creature: the capsule's rules about species, anatomy and scale do not apply here, and this picture should be unmistakably of one thing.

Draw an enormous rooted body that does not fight: seen from below and behind, one vast limb lifted in a signal, and the whole floor between it and the far wall already in motion.
```

### Thrash

File: `cards/npc/thrash.webp`

```text
SUBJECT. "Thrash" — Strike blast 1, Move · Strike every figure adjacent to you, then move your speed away from all of them.

Draw one full circle of motion: a blurred sweep running all the way around a single point, grit and dust flung to the frame's edges, and the centre of it already empty.
```

### Work the Weave

File: `cards/npc/work-the-weave.webp`

```text
SUBJECT. "Work the Weave" — Cast · Cast one from your own short list.

Draw the air around a raised limb going wrong -- light bending, grit lifting off the ground in a slow curve. Nothing is being struck; something is being made.
```

## Way of Shade — pool

**12 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/shade/`.

A Way of Shade card: low light, cover, and the moment before being noticed.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A Way of Shade card: low light, cover, and the moment before being noticed.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Shade**, so its one chromatic accent is **#5d7aa3**,
  deepening to **#2f3b4e** in the darkest wash. Use it on the one thing the
  picture is about, and nowhere else. No other hue appears.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Between the Plates

File: `cards/shade/between-the-plates.webp`

```text
SUBJECT. "Between the Plates" — Strike ignores armour vs Marked · / Move 1

Draw the blow landing, finding the gap the Mark opened, through the plate, against a target already Marked -- singled out of a crowd.
```

### Call the Shot

File: `cards/shade/call-the-shot.webp`

```text
SUBJECT. "Call the Shot" — Strike · / Marked (1) · Marked on any enemy you can see, at any range.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; singled out of a crowd.
```

### Cut and Run

File: `cards/shade/cut-and-run.webp`

```text
SUBJECT. "Cut and Run" — Strike, Move 2 · / Move 1

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; ground covered -- weight forward, the last footfall still behind.
```

### Light Feet

File: `cards/shade/light-feet.webp`

```text
SUBJECT. "Light Feet" — Move 3 · / Move 2 · Ignoring difficult ground.

Draw ground covered -- weight forward, the last footfall still behind.
```

### Mock

File: `cards/shade/mock.webp`

```text
SUBJECT. "Mock" — Dazed (1) · / Move 1

Draw sight swimming.
```

### Pin the Shadow

File: `cards/shade/pin-the-shadow.webp`

```text
SUBJECT. "Pin the Shadow" — Strike Slowed (1) · / Move 1

Draw the blow landing, loosed from a bow or a barrel, the target well off, against a target already Marked -- singled out of a crowd; movement dragging, as if through water.
```

### Second Knife

File: `cards/shade/second-knife.webp`

```text
SUBJECT. "Second Knife" — Strike range 3 · / Strike -1

Draw the blow landing, a short blade, held close and low, landing 3 squares from the one who threw it; then the weaker follow-up, off the hand that was not busy, a short blade, held close and low.
```

### Sleight

File: `cards/shade/sleight.webp`

```text
SUBJECT. "Sleight" — Use, Strike · / Ready

Draw a hand working an object, the object mid-use rather than held up to be seen; the instant a blow lands, the weapon already through -- never wound up, never posing; a weapon coming to hand, caught between carried and held.
```

### Slip the Knot

File: `cards/shade/slip-the-knot.webp`

```text
SUBJECT. "Slip the Knot" — Move 2 · / Shake 1

Draw ground covered -- weight forward, the last footfall still behind; footing lost.
```

### Smoke and Go

File: `cards/shade/smoke-and-go.webp`

```text
SUBJECT. "Smoke and Go" — Invisible (1), Move 2 · / Use · On yourself.

Draw ground covered -- weight forward, the last footfall still behind; a hand working an object, the object mid-use rather than held up to be seen; only the shape the air makes.
```

### Take the Shot

File: `cards/shade/take-the-shot.webp`

```text
SUBJECT. "Take the Shot" — Strike +1 · / Move 2

Draw the blow landing, the one that found its moment, loosed from a bow or a barrel, the target well off, against a target already Marked -- singled out of a crowd.
```

### Vanish

File: `cards/shade/vanish.webp`

```text
SUBJECT. "Vanish" — Invisible (1) · / Move 2 · On yourself.

Draw only the shape the air makes.
```

## Way of Strength — pool

**13 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/strength/`.

A Way of Strength card: mass, leverage, and weight already moving.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A Way of Strength card: mass, leverage, and weight already moving.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Strength**, so its one chromatic accent is **#a3655d**,
  deepening to **#4a3330** in the darkest wash. Use it on the one thing the
  picture is about, and nowhere else. No other hue appears.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Armoured Advance

File: `cards/strength/armoured-advance.webp`

```text
SUBJECT. "Armoured Advance" — Move 3 · / Move 1 · Your armor counts +1 until your next turn.

Draw ground covered -- weight forward, the last footfall still behind.
```

### Beat the Blade

File: `cards/strength/beat-the-blade.webp`

```text
SUBJECT. "Beat the Blade" — Strike Disarmed (1) · / Move 1

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; a weapon leaving the hand.
```

### Hammerblow

File: `cards/strength/hammerblow.webp`

```text
SUBJECT. "Hammerblow" — Strike · / Move 1

Draw the blow landing, against a target already Off Balance -- weight in the wrong place.
```

### Heave

File: `cards/strength/heave.webp`

```text
SUBJECT. "Heave" — Move 2 · / Ready · Carrying any weight without being Slowed.

Draw ground covered -- weight forward, the last footfall still behind; a weapon coming to hand, caught between carried and held.
```

### Overbear

File: `cards/strength/overbear.webp`

```text
SUBJECT. "Overbear" — Grappled (2) · / Move 1

Draw held, and not letting go.
```

### Pull Them Down

File: `cards/strength/pull-them-down.webp`

```text
SUBJECT. "Pull Them Down" — Strike · / Strike -1 · The secondary only against a Prone or Grappled target.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; then the weaker follow-up, off the hand that was not busy.
```

### Roar

File: `cards/strength/roar.webp`

```text
SUBJECT. "Roar" — Compelled (1) · / Move 1 · Every adjacent enemy.

Draw pulled toward something against the will.
```

### Shield Bash

File: `cards/strength/shield-bash.webp`

```text
SUBJECT. "Shield Bash" — Strike · / Move 1 · No damage: push 2 and step into the square it left.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.
```

### Shield Wall

File: `cards/strength/shield-wall.webp`

```text
SUBJECT. "Shield Wall" — Defend · / Defend, Block 1 area 1

Draw shields locked edge to edge, more than one pair of hands in frame, the seam between two of them dead centre.
```

### Shoulder Check

File: `cards/strength/shoulder-check.webp`

```text
SUBJECT. "Shoulder Check" — Strike · / Off Balance (1) · Adjacent.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; weight in the wrong place.
```

### Sweep the Leg

File: `cards/strength/sweep-the-leg.webp`

```text
SUBJECT. "Sweep the Leg" — Strike Prone (1) · / Move 1

Draw the blow landing, against a target already Off Balance -- weight in the wrong place; down, and the ground very close.
```

### Two-Hand It

File: `cards/strength/two-hand-it.webp`

```text
SUBJECT. "Two-Hand It" — Strike +2 · / Ready

Draw the blow landing, thrown with the whole body, nothing held back, both hands on the haft; a weapon coming to hand, caught between carried and held.
```

### Walk It Off

File: `cards/strength/walk-it-off.webp`

```text
SUBJECT. "Walk It Off" — Heal 2, Shake 2 · / Move 1 · On yourself.

Draw a wound closing, or breath coming back; footing lost.
```

## Way cards

**2 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/way/`.

Written for the reach weapons and shared between Ways, so no Way's colour.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. Written for the reach weapons and shared between Ways, so no Way's colour.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Roll With It

File: `cards/way/roll-with-it.webp`

```text
SUBJECT. "Roll With It" — Move 3 · / Move 2 · Sidestep 2, and you may end next to a different enemy

Draw ground covered -- weight forward, the last footfall still behind.
```

### Set Spear

File: `cards/way/set-spear.webp`

```text
SUBJECT. "Set Spear" — Defend · / Move 1 · an enemy ending its move adjacent takes your Strike

Draw a spear butt driven into the ground and braced underfoot, the point levelled outward and steady. Nobody is holding it up; the earth is.
```

## Skill cards

**10 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/skill/`.

Played out of combat, in a scene rather than a fight. Hands, tools and attention -- no weapons drawn.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. Played out of combat, in a scene rather than a fight. Hands, tools and attention -- no weapons drawn.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Break It

File: `cards/skill/break-it.webp`

```text
SUBJECT. "Break It" — might 1 · Edge: Something gives whether or not you get through: the GM says what broke.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.
```

### Heave

File: `cards/skill/heave.webp`

```text
SUBJECT. "Heave" — might 2

Draw a load shifting at last -- shoulder into it, feet skidding, the thing finally moving.
```

### Inspiration

File: `cards/skill/inspiration.webp`

```text
SUBJECT. "Inspiration" — Edge: Draw 1 skill card.

Draw the moment a face changes because the person has just thought of the thing. Nothing in the hands; all of it in the eyes.
```

### Keep Your Footing

File: `cards/skill/keep-your-footing.webp`

```text
SUBJECT. "Keep Your Footing" — agility 1 · Edge: You do not fall, whatever else happens.

Draw a body gone past the angle at which it should fall, and not falling: one foot has found the only solid thing left.
```

### Out of the Light

File: `cards/skill/out-of-the-light.webp`

```text
SUBJECT. "Out of the Light" — shadow 1

Draw somebody stepping backwards out of a lit place into one that is not, more than half of them already gone.
```

### Quick Hands

File: `cards/skill/quick-hands.webp`

```text
SUBJECT. "Quick Hands" — agility 2

Draw fingers working a catch or a knot faster than an eye follows, the other hand already started on what comes after.
```

### Set Your Feet

File: `cards/skill/set-your-feet.webp`

```text
SUBJECT. "Set Your Feet" — might 3

Draw the instant before a pull rather than during it: weight dropped, heels dug, the line gone tight and nothing moving yet.
```

### Sharp Eyes

File: `cards/skill/sharp-eyes.webp`

```text
SUBJECT. "Sharp Eyes" — wits 1 · Edge: Ask the GM one yes-or-no question about the scene.

Draw a look held one second longer than anybody else's, on the single thing in the room that is wrong.
```

### Soldier's Learning

File: `cards/skill/soldiers-learning.webp`

```text
SUBJECT. "Soldier's Learning" — lore 1

Draw a hand reading something by touch that it has handled a thousand times before. Recognition, not study.
```

### The Loud Voice

File: `cards/skill/the-loud-voice.webp`

```text
SUBJECT. "The Loud Voice" — presence 1 · Edge: Everyone nearby hears you, and knows it was you.

Draw a shout thrown across a space with the whole chest behind it, and every head in frame already turning toward it.
```

## Wild Magic

**10 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/wild/`.

Drawn on a Wild, so it is a surprise and should look like one: the composition may break the calm the rest of the set keeps.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. Drawn on a Wild, so it is a surprise and should look like one: the composition may break the calm the rest of the set keeps.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Backlash

File: `cards/wild/backlash.webp`

```text
SUBJECT. "Backlash" — Dazed (1)

Draw sight swimming.
```

### Blink

File: `cards/wild/blink.webp`

```text
SUBJECT. "Blink" — Move 3 ignoring figures and difficult ground

Draw ground covered -- weight forward, the last footfall still behind.
```

### Echo

File: `cards/wild/echo.webp`

```text
SUBJECT. "Echo" — The Cast resolves a second time, against the same target.

Draw the same blow arriving twice: one figure, and a second identical shape half a pace behind it, out of step by one heartbeat.
```

### Glare

File: `cards/wild/glare.webp`

```text
SUBJECT. "Glare" — The Cast becomes a Blast 2 around its target, whoever is standing in it.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.
```

### Misfire

File: `cards/wild/misfire.webp`

```text
SUBJECT. "Misfire" — The Cast resolves against the nearest creature instead, ally or not.

Draw a spell going off at the wrong end of the room -- the caster's hand still open and extended, and the person standing beside them taking all of it.
```

### Open Door

File: `cards/wild/open-door.webp`

```text
SUBJECT. "Open Door" — Invisible (1), Marked (2)

Draw only the shape the air makes; singled out of a crowd.
```

### Residue

File: `cards/wild/residue.webp`

```text
SUBJECT. "Residue" — Cursed

Draw a shadow that chose someone.
```

### Second Sight

File: `cards/wild/second-sight.webp`

```text
SUBJECT. "Second Sight" — Blessed

Draw light that chose someone.
```

### The Long Step

File: `cards/wild/the-long-step.webp`

```text
SUBJECT. "The Long Step" — Move 3 ignoring figures and difficult ground, Prone (1)

Draw ground covered -- weight forward, the last footfall still behind; down, and the ground very close.
```

### Veil

File: `cards/wild/veil.webp`

```text
SUBJECT. "Veil" — Invisible (1)

Draw only the shape the air makes.
```

## Signatures — Way of Shade

**12 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/signatures/shade/`.

A title's defining card, and what its node wears in the levelling graph. Grander than a pool card: this is what a player was aiming at.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A title's defining card, and what its node wears in the levelling graph. Grander than a pool card: this is what a player was aiming at.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Shade**, so its one chromatic accent is **#5d7aa3**,
  deepening to **#2f3b4e** in the darkest wash. Use it on the one thing the
  picture is about, and nowhere else. No other hue appears.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Double or Nothing

File: `signatures/shade/double-or-nothing.webp`

```text
SUBJECT. "Double or Nothing" — Strike · / Move 1 · Draw two fate cards -- both apply, added together. Variance, not advantage.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.
```

### Heckle

File: `signatures/shade/heckle.webp`

```text
SUBJECT. "Heckle" — Heckled (1) · / Move 1 · An enemy arriving next to you draws fate with disadvantage until your next turn.

Draw attention pulled the wrong way.
```

### Lift

File: `signatures/shade/lift.webp`

```text
SUBJECT. "Lift" — Strike · / Move 1 · On a hit, take one card from the target's own deck. It is yours now, and it is in your deck for good.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.
```

### Loose and Step

File: `signatures/shade/loose-and-step.webp`

```text
SUBJECT. "Loose and Step" — Strike, Move 1 · / Move 1

Draw the blow landing, loosed from a bow or a barrel, the target well off; ground covered -- weight forward, the last footfall still behind.
```

### Named

File: `signatures/shade/named.webp`

```text
SUBJECT. "Named" — Strike · / Marked (1) · Name one enemy. Against it, your Parry also Strikes for 1.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; singled out of a crowd.
```

### One Opening

File: `signatures/shade/one-opening.webp`

```text
SUBJECT. "One Opening" — Strike · / Move 1 · Against a target that is unaware or carrying an opening, the damage is doubled.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.
```

### One Trick

File: `signatures/shade/one-trick.webp`

```text
SUBJECT. "One Trick" — You may prepare from any one school you have ever seen cast.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.
```

### Over and Past

File: `signatures/shade/over-and-past.webp`

```text
SUBJECT. "Over and Past" — Move 3 · / Move 1 · You may move through enemy squares.

Draw ground covered -- weight forward, the last footfall still behind.
```

### Point Man

File: `signatures/shade/point-man.webp`

```text
SUBJECT. "Point Man" — Foresee · / Move 1 · While you are the furthest forward of your party, Foresee one extra type.

Draw the moment before a thing happens, shown twice.
```

### Set

File: `signatures/shade/set.webp`

```text
SUBJECT. "Set" — Ready Slowed 2 an adjacent square; the first enemy to enter takes your Strike value · / Ready · Place a trap on an adjacent square.

Draw a weapon coming to hand, caught between carried and held; movement dragging, as if through water.
```

### The Kit

File: `signatures/shade/the-kit.webp`

```text
SUBJECT. "The Kit" — item · You may never put it down. Every Hard physical obstacle becomes Normal.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.
```

### The Opening

File: `signatures/shade/the-opening.webp`

```text
SUBJECT. "The Opening" — Advantage against anyone carrying an opening -- whoever set it.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.
```

## Signatures — Way of Strength

**12 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/signatures/strength/`.

A title's defining card, and what its node wears in the levelling graph. Grander than a pool card: this is what a player was aiming at.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A title's defining card, and what its node wears in the levelling graph. Grander than a pool card: this is what a player was aiming at.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Strength**, so its one chromatic accent is **#a3655d**,
  deepening to **#4a3330** in the darkest wash. Use it on the one thing the
  picture is about, and nowhere else. No other hue appears.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Cleave to the Bone

File: `signatures/strength/cleave-to-the-bone.webp`

```text
SUBJECT. "Cleave to the Bone" — For you, the Wound threshold is 4, not 5.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.
```

### Get a Grip

File: `signatures/strength/get-a-grip.webp`

```text
SUBJECT. "Get a Grip" — Grappled (2) · / Move 1 · No save at all if both your hands are empty.

Draw held, and not letting go.
```

### Interpose

File: `signatures/strength/interpose.webp`

```text
SUBJECT. "Interpose" — Defend · / Move 1 · Take a hit meant for an adjacent ally.

Draw the step across -- a body arriving in the path of a blow meant for somebody else, caught between the two of them.
```

### Loaded Before the Bell

File: `signatures/strength/loaded-before-the-bell.webp`

```text
SUBJECT. "Loaded Before the Bell" — You begin every combat already loaded, and the first shot of a fight is +2.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.
```

### Nothing Gets Through

File: `signatures/strength/nothing-gets-through.webp`

```text
SUBJECT. "Nothing Gets Through" — While you are Overloaded, your armor counts double.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.
```

### On My Call

File: `signatures/strength/on-my-call.webp`

```text
SUBJECT. "On My Call" — Ready · / Move 1 · On an ally's turn: they may play a card in their hand halves swapped, its secondary as a primary.

Draw a weapon coming to hand, caught between carried and held.
```

### Play to the Crowd

File: `signatures/strength/play-to-the-crowd.webp`

```text
SUBJECT. "Play to the Crowd" — Compelled (1) · / Move 1 · When you are hit: gain Block 2, and the attacker is Compelled (1) -- no save, because you have already been hit once.

Draw pulled toward something against the will.
```

### Ranging Shot

File: `signatures/strength/ranging-shot.webp`

```text
SUBJECT. "Ranging Shot" — Strike aimed 1 · / Ready · Blast instead of Aimed, if you did not Move this turn.

Draw the blow landing, loosed from a bow or a barrel, the target well off, one line only, from eye to target; a weapon coming to hand, caught between carried and held.
```

### Red Mist

File: `signatures/strength/red-mist.webp`

```text
SUBJECT. "Red Mist" — Strike · / Move 1 · Then draw back up to your hand size at once.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.
```

### Shoulder to Shoulder

File: `signatures/strength/shoulder-to-shoulder.webp`

```text
SUBJECT. "Shoulder to Shoulder" — Strike, Block 1 area 1 · / Move 1

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; a blow stopped flat, its force going sideways.
```

### The Lance

File: `signatures/strength/the-lance.webp`

```text
SUBJECT. "The Lance" — Move 3, Strike · / Move 1 · Advantage if you moved at least 2. Needs the mount.

Draw ground covered -- weight forward, the last footfall still behind; the instant a blow lands, the weapon already through -- never wound up, never posing.
```

### The Wall

File: `signatures/strength/the-wall.webp`

```text
SUBJECT. "The Wall" — Your Blocks stack. You are the one exception to highest-wins.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.
```

## Signatures — Way of Mind

**11 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/signatures/mind/`.

A title's defining card, and what its node wears in the levelling graph. Grander than a pool card: this is what a player was aiming at.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A title's defining card, and what its node wears in the levelling graph. Grander than a pool card: this is what a player was aiming at.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Mind**, so its one chromatic accent is **#5d9a86**,
  deepening to **#2f3f3a** in the darkest wash. Use it on the one thing the
  picture is about, and nowhere else. No other hue appears.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Blood Price

File: `signatures/mind/blood-price.webp`

```text
SUBJECT. "Blood Price" — strength 2 · Cast +4 range 3 ignores armour

Four damage at three squares, and nothing between you and it matters. The two Health are not a drawback; they are the school.

Draw the shape forming between the hands, thrown with the whole body, nothing held back, landing 3 squares from the one who threw it, going through whatever it is wearing as if it were not there.
```

### Call the Unquiet

File: `signatures/mind/call-the-unquiet.webp`

```text
SUBJECT. "Call the Unquiet" — strength 3 · Conjure range 2 a corpse rises and fights for you

It does not know it died. It will stop when the fight does.

Draw the arrival, landing 2 squares from the one who threw it.
```

### Graven Strength

File: `signatures/mind/graven-strength.webp`

```text
SUBJECT. "Graven Strength" — strength 1 · Graven

It is on your arm. It does not need remembering, and it never comes off.

Draw a mark cut into flesh and holding.
```

### Hearth and Home

File: `signatures/mind/hearth-and-home.webp`

```text
SUBJECT. "Hearth and Home" — strength 1 · a camp nobody unfriendly can find, for one night

Out of combat: a camp nobody unfriendly can find, for one night. A ritual, so anyone literate could do it — but somebody has to know the words.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Not Here

File: `signatures/mind/not-here.webp`

```text
SUBJECT. "Not Here" — strength 2 · Invisible (1) until you attack or are attacked

You are standing exactly where you are standing. Nobody can be told so.

Draw only the shape the air makes.
```

### Nothing Left to Take

File: `signatures/mind/nothing-left-to-take.webp`

```text
SUBJECT. "Nothing Left to Take" — strength 1 · you cannot be reduced below 1 Health

There is nothing in your hand and nothing left to lose, and the second follows from the first.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Bargain

File: `signatures/mind/the-bargain.webp`

```text
SUBJECT. "The Bargain" — strength 3 · Conjure it acts once; the GM decides how

A minor god acts, once. The GM decides how , and that is not a hole in the spell — it is the spell.

Draw something arriving that was not there a moment ago.
```

### The Reading

File: `signatures/mind/the-reading.webp`

```text
SUBJECT. "The Reading" — strength 2 · Foresee 3

Three cards down somebody else's luck. Never your own — a diviner who could stack their own deck would be a damage school wearing a robe.

Draw the moment before a thing happens, shown twice.
```

### Unmake

File: `signatures/mind/unmake.webp`

```text
SUBJECT. "Unmake" — strength 2 · a Cast you have survived before does not resolve

You have felt this one before. That is the only reason you can stop it: a warder's book is a record of what the party has survived — which is a condition on LEARNING it, held by the GM, not something the engine tests.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Wall of the Sphere

File: `signatures/mind/wall-of-the-sphere.webp`

```text
SUBJECT. "Wall of the Sphere" — strength 2 · range 3 area 3 of your element

Three squares of whichever sphere is yours. Stand behind it and the ground in front of you is no longer anybody's.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Wither

File: `signatures/mind/wither.webp`

```text
SUBJECT. "Wither" — strength 2 · Cast Poisoned 1 (2)

Dazed while it lasts, and one damage a turn that armour does not stop.

Draw a shape held in the air between the hands, half-finished and still forming; colour draining out.
```

## Signatures — Way of Faith

**16 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/signatures/faith/`.

A god's first and defining miracle. Grander than a pool card, and the light in it comes from outside the frame.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A god's first and defining miracle. Grander than a pool card, and the light in it comes from outside the frame.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Faith**, so its one chromatic accent is **#8a74b8**,
  deepening to **#403458** in the darkest wash. Use it on the one thing the
  picture is about, and nowhere else. No other hue appears.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Breath of the Spirit

File: `signatures/faith/breath-of-the-spirit.webp`

```text
SUBJECT. "Breath of the Spirit" — strength 2 · Heal 3 range 99

Reaction: heal an ally 3, at any range, ignoring cover. The spirit drifts through all the air, so distance is not a question for it.

Draw the wound closing, landing 99 squares from the one who threw it.
```

### Out of Barren Ground

File: `signatures/faith/out-of-barren-ground.webp`

```text
SUBJECT. "Out of Barren Ground" — strength 3 · Heal 4 range 2

Plant it. At the start of your second turn after, every ally within 2 heals 4. Nothing he gives arrives when you ask for it.

Draw the wound closing, landing 2 squares from the one who threw it.
```

### The Borrowed Face

File: `signatures/faith/the-borrowed-face.webp`

```text
SUBJECT. "The Borrowed Face" — strength 3 · range 3 Spent: one enemy spends this round attacking its own ally

Spent: one enemy spends this round attacking its own ally. It works once, which is the god.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Clean Hand

File: `signatures/faith/the-clean-hand.webp`

```text
SUBJECT. "The Clean Hand" — strength 2 · range 3 an ally's next check or attack cannot fail

An ally's next check or attack cannot fail. One cheaper on a brother or sister in faith, which is the third tenet made arithmetic.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Club and the Line

File: `signatures/faith/the-club-and-the-line.webp`

```text
SUBJECT. "The Club and the Line" — strength 2 · Cast blast 1 with the weapon in hand

Strike every adjacent enemy. No free hand needed, because the club is the holy symbol — which is the gift on the node, not on the card.

Draw the shape forming between the hands, reaching everything around at once.
```

### The Drum

File: `signatures/faith/the-drum.webp`

```text
SUBJECT. "The Drum" — strength 1 · your next Strike this turn is +3

It starts somewhere behind you and it is already in your arms.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The First Taste

File: `signatures/faith/the-first-taste.webp`

```text
SUBJECT. "The First Taste" — strength 2 · Tainting 2 range 1

Tainting 2 on one adjacent enemy, and 1 Taint for you. You are the first to taste it, always.

Draw the wrongness spreading, landing 1 squares from the one who threw it.
```

### The Long Night

File: `signatures/faith/the-long-night.webp`

```text
SUBJECT. "The Long Night" — strength 3 · Cast +3 range 1 you gain the Health you take

Drain 3 Health from an adjacent living target and gain it. The only renewable pool in the game, and the node says what it costs to have one.

Draw the shape forming between the hands, thrown with the whole body, nothing held back, landing 1 squares from the one who threw it.
```

### The Long Silence

File: `signatures/faith/the-long-silence.webp`

```text
SUBJECT. "The Long Silence" — Ready 2 · / Shake 1 · Only if you did not move this round. Stillness is the whole of the order's method.

Draw a weapon coming to hand, caught between carried and held; footing lost.
```

### The Order's Shield

File: `signatures/faith/the-orders-shield.webp`

```text
SUBJECT. "The Order's Shield" — Defend, Block 2 range 1 · / Block 1 range 1 · The Block goes to an adjacent ally and never to you. The order does not defend itself.

Draw a guard closing: shield, forearm or shoulder set against something off-frame; the blow stopped flat, landing 1 squares from the one who threw it; then landing 1 squares from the one who threw it.
```

### The Outcast's Due

File: `signatures/faith/the-outcasts-due.webp`

```text
SUBJECT. "The Outcast's Due" — strength 3 · Cast blast 1 Compelled (2)

Every enemy next to you turns on you, because the outcast is who the crowd turns on. That is not a side effect; it is the prayer.

Draw the shape forming between the hands, reaching everything around at once; pulled toward something against the will.
```

### The Rumour

File: `signatures/faith/the-rumour.webp`

```text
SUBJECT. "The Rumour" — strength 2 · one enemy type acts as though a named lie were true

Name a lie before the fight. One enemy type acts as if it were true, for as long as you keep spending a secondary on it.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Scourge

File: `signatures/faith/the-scourge.webp`

```text
SUBJECT. "The Scourge" — Strike +2 · / Move 2 · Strain 1, paid before the blow lands. The drums, the dance and the whip make the same argument: pay first, strike harder.

Draw the blow landing, thrown with the whole body, nothing held back.
```

### The Silent Hour

File: `signatures/faith/the-silent-hour.webp`

```text
SUBJECT. "The Silent Hour" — strength 2 · range 1 Dazed (1)

Reaction, adjacent only: an enemy's action does not happen. Close enough to touch, which is where the knife is.

Draw sight swimming.
```

### The Tide Knows

File: `signatures/faith/the-tide-knows.webp`

```text
SUBJECT. "The Tide Knows" — strength 2 · range 3 an ally draws fate twice on their next action and keeps both

An ally draws fate twice on their next action and keeps both. The sea is not fair.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Writ

File: `signatures/faith/the-writ.webp`

```text
SUBJECT. "The Writ" — range 6 Judged (2) · / Move 1 · No save, at range 6. Being named is not something you resist, and the whole field may act on it.

Draw seen, and found wanting.
```

## Formulas — Elemental

**4 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/spells/elemental/`.

A formula: the oldest magic in the game, and the most physical.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A formula: the oldest magic in the game, and the most physical.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Frost

File: `spells/elemental/frost.webp`

```text
SUBJECT. "Frost" — strength 1 · range 3 Slowed (1)

One target, one round, no damage. Against a Wet target the water is already there to freeze, so the save goes from Normal to Heroic and nothing else changes.

Draw movement dragging, as if through water.
```

### Lightning

File: `spells/elemental/lightning.webp`

```text
SUBJECT. "Lightning" — strength 2 · Cast range 4 Stunned (1)

Reads a Wet target two ways at once: harder to shrug off, and it hurts more. Against a dry one it is still a Cast that tries to stun, which is the point — the opening sharpens the card, it does not switch it on.

Draw the shape forming between the hands, landing 4 squares from the one who threw it, against a target already Wet -- soaked through; a body gone still in the middle of an action.
```

### Rain

File: `spells/elemental/rain.webp`

```text
SUBJECT. "Rain" — strength 2 · range 4 blast 3 Wet (1) no damage

A squall out of nothing, over three squares, and the water does not care who it lands on. It is not an attack and nothing resists it.

Draw soaked through.
```

### Scorch

File: `spells/elemental/scorch.webp`

```text
SUBJECT. "Scorch" — strength 1 · Cast range 4 Burning (1)

Carries no combo clause at all, and is still the proof that an opening is not always worth having: water and fire cancel, so a Wet target takes the Cast and sheds the Burning. The interaction is on Burning, where the rules put it.

Draw the shape forming between the hands, landing 4 squares from the one who threw it; fire taking hold.
```

## Formulas — Shadow

**1 prompt.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/spells/shadow/`.

A shadow formula, paid for with a permanent Wild card. Something is being given up in the picture.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A shadow formula, paid for with a permanent Wild card. Something is being given up in the picture.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Shade**, so its one chromatic accent is **#5d7aa3**,
  deepening to **#2f3b4e** in the darkest wash. Use it on the one thing the
  picture is about, and nowhere else. No other hue appears.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Step Through

File: `spells/shadow/step-through.webp`

```text
SUBJECT. "Step Through" — strength 2 · teleport to any shadowed square you can see

You are in the shadow, and then you are in another one. Every reach into the dark leaves something of the dark in you: a Wild card joins your fate deck, and it does not leave until you have slept.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

## Formulas — Way of Mind pool

**70 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/spells/mind/`.

Blood magic and spiritualism: the working, not the worker.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. Blood magic and spiritualism: the working, not the worker.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Mind**, so its one chromatic accent is **#5d9a86**,
  deepening to **#2f3f3a** in the darkest wash. Use it on the one thing the
  picture is about, and nowhere else. No other hue appears.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### A Clear Head

File: `spells/mind/a-clear-head.webp`

```text
SUBJECT. "A Clear Head" — strength 1 · Shake 1 range 3 Dazed and they may play a secondary this turn even if they already have

You say the thing they needed to hear, and they come back to themselves in time to do something about it.

Draw footing lost, landing 3 squares from the one who threw it; sight swimming.
```

### Ask the Dead

File: `spells/mind/ask-the-dead.webp`

```text
SUBJECT. "Ask the Dead" — strength 1 · a corpse answers three questions, as truthfully as it knew

It answers three questions truthfully, as far as it knew — which is usually less than you hoped and occasionally much more.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Become the Shadow

File: `spells/mind/become-the-shadow.webp`

```text
SUBJECT. "Become the Shadow" — strength 5 · until the fight ends you are in every shadow at once: Strike from any shadowed square, and nothing can target you

Not in a shadow: in every shadow, at once, until the fight ends. Nothing can reach you and you can reach anything standing in the dark.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Boil

File: `spells/mind/boil.webp`

```text
SUBJECT. "Boil" — strength 3 · Cast Burning 3 (2)

Not your blood this time. Theirs, and it does not stop.

Draw a shape held in the air between the hands, half-finished and still forming; fire taking hold.
```

### Cast No Shadow

File: `spells/mind/cast-no-shadow.webp`

```text
SUBJECT. "Cast No Shadow" — strength 2 · until your next turn nothing further than 1 square away can target you

For one round you are only there if they are standing next to you. Archers and casters are simply out of the conversation.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Empty Hand

File: `spells/mind/empty-hand.webp`

```text
SUBJECT. "Empty Hand" — strength 1 · you may Strike with no item, at your own Might

No weapon, and no need of one. It is not a better Strike than a sword; it is a Strike you cannot be parted from.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Flesh of the Earth

File: `spells/mind/flesh-of-the-earth.webp`

```text
SUBJECT. "Flesh of the Earth" — strength 2 · Cast range 3 Burning 1 (2) and Corrode 1: it eats the armour as well as the man

Acid, which is nobody's sphere. It eats the armour as well as the man, and the man notices second.

Draw the shape forming between the hands, landing 3 squares from the one who threw it; fire taking hold.
```

### Grave Chill

File: `spells/mind/grave-chill.webp`

```text
SUBJECT. "Grave Chill" — strength 2 · Cast aimed 2 Dazed (1)

The cold that comes off a body, aimed. Two squares of it, and everything in them is slow to understand what happened.

Draw the shape forming between the hands, one line only, from eye to target; sight swimming.
```

### Graven Armour

File: `spells/mind/graven-armour.webp`

```text
SUBJECT. "Graven Armour" — strength 4 · you count as Burdened always, whatever you carry

Plate, in ink, over everything. It weighs nothing and you are never again anything but weighed down.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Graven Eye

File: `spells/mind/graven-eye.webp`

```text
SUBJECT. "Graven Eye" — strength 1 · you are never surprised

An eye on the back of your neck that is not decorative. You are never surprised again, and you never sleep quite as well.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Graven Heart

File: `spells/mind/graven-heart.webp`

```text
SUBJECT. "Graven Heart" — strength 3

A second heart, drawn over the first. The GM writes down a secret worth six Health, and you will find out which one when it matters.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Graven Road

File: `spells/mind/graven-road.webp`

```text
SUBJECT. "Graven Road" — strength 1 · your Move is never halved

A road down the inside of both legs. Slowed, Burdened and Overloaded all still land on you; none of them slows you down.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Graven Shield

File: `spells/mind/graven-shield.webp`

```text
SUBJECT. "Graven Shield" — strength 2

A shield you cannot put down, drawn across your back by somebody who knew what they were doing.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Hold to the Bargain

File: `spells/mind/hold-to-the-bargain.webp`

```text
SUBJECT. "Hold to the Bargain" — strength 2 · an ally's failed check becomes a Partial

It was going to fail. Something intervened, once, because it owes you.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Ink Spray

File: `spells/mind/ink-spray.webp`

```text
SUBJECT. "Ink Spray" — strength 1 · Blast area 2 end Invisible in the area, and nothing in it may become Invisible until your next turn

Two squares of ink in the air. Nobody in it is invisible, and nobody in it is going to be.

Draw an edge of force travelling outward.
```

### Longer Shadow

File: `spells/mind/longer-shadow.webp`

```text
SUBJECT. "Longer Shadow" — strength 1

The dark you are standing in reaches one square further, all the way round, which is enough to make the next formula work.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Nothing At All

File: `spells/mind/nothing-at-all.webp`

```text
SUBJECT. "Nothing At All" — strength 5 · your action deck becomes 4 cards, you hold all four, and may play any two halves. Costs a hand

Four cards, all of them in your hand, every turn. You have given away a hand and most of a deck, and what is left is a man who always has exactly the right card.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Nothing to Carry

File: `spells/mind/nothing-to-carry.webp`

```text
SUBJECT. "Nothing to Carry" — strength 1 · +2 to all Casts, and you cannot be Disarmed

Nothing in either hand, and nothing anybody can take out of them. The bonus to Casts is incidental; the point is that Disarm stops being a word.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Open the Vein

File: `spells/mind/open-the-vein.webp`

```text
SUBJECT. "Open the Vein" — strength 1 · Cast +3 range 2 ignores Block

Your own blood, thrown. It goes round a shield rather than through it.

Draw the shape forming between the hands, thrown with the whole body, nothing held back, landing 2 squares from the one who threw it, going round the shield rather than through it.
```

### Shake It Off

File: `spells/mind/shake-it-off.webp`

```text
SUBJECT. "Shake It Off" — strength 2 · Shake 3 range 3

Whatever is on them, off, on the turn it happened rather than on yours. Three is enough for anything the game can print.

Draw footing lost, landing 3 squares from the one who threw it.
```

### Slick

File: `spells/mind/slick.webp`

```text
SUBJECT. "Slick" — strength 1 · range 3 Off Balance (1)

Oil of something. No save: a man whose feet have gone is not resisting anything.

Draw weight in the wrong place.
```

### Slippery

File: `spells/mind/slippery.webp`

```text
SUBJECT. "Slippery" — strength 1 · Shake 1 range 2 Grappled until your next turn they cannot be Grappled again

Not enough water to drown in. Exactly enough to be impossible to hold.

Draw footing lost, landing 2 squares from the one who threw it; held, and not letting go.
```

### The Borrowed Body

File: `spells/mind/the-borrowed-body.webp`

```text
SUBJECT. "The Borrowed Body" — strength 3 · Shape

A spirit lends you its shape. Your deck, your Health and whatever is wrong with you come along — a body is what you fight with, not who you are.

Draw matter bending to a hand.
```

### The Borrowed Dark

File: `spells/mind/the-borrowed-dark.webp`

```text
SUBJECT. "The Borrowed Dark" — strength 3

Every square on the map, dark at once — for your allies as much as for you, and for anyone else who knows what to do with it.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Broken Word

File: `spells/mind/the-broken-word.webp`

```text
SUBJECT. "The Broken Word" — strength 5 · Spent: one spell or miracle is unlearned by its caster for the rest of the day

They still have the slot. They no longer have the words, and will not until tomorrow — which to a caster is worse than a wound.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Clean Pot

File: `spells/mind/the-clean-pot.webp`

```text
SUBJECT. "The Clean Pot" — strength 1 · a day's rations for the party, every day

Food never spoils and water is always safe. A day's rations for the party, every day, for ever — which quietly deletes a whole column of the equipment list.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Crowded Room

File: `spells/mind/the-crowded-room.webp`

```text
SUBJECT. "The Crowded Room" — strength 4 · until your next turn every enemy attacks a random figure in reach, chosen by a fate draw

For one round nobody can tell who is who, and the fate deck decides who swings at whom. It is as likely to help them as you.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Door Home

File: `spells/mind/the-door-home.webp`

```text
SUBJECT. "The Door Home" — strength 5 · a door you have opened leads to any other you have opened

A door you have opened before becomes a door to any other door you have opened before. It is the school's thesis: a householder is never far from anywhere they have been.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Empty Deck

File: `spells/mind/the-empty-deck.webp`

```text
SUBJECT. "The Empty Deck" — strength 4 · you cannot be harmed at all

Nothing in your hand, nothing left to draw, and nothing anybody can do to you. It is the shortest window in the game and it is absolute.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Evil Eye

File: `spells/mind/the-evil-eye.webp`

```text
SUBJECT. "The Evil Eye" — strength 2 · range 3 Cursed

A temporary Miss in their fate deck, until it is drawn. The condition shuffles the card in by itself (core-rules 6), which is why the pair of these needed no mechanism of their own.

Draw a shadow that chose someone.
```

### The Face of a Friend

File: `spells/mind/the-face-of-a-friend.webp`

```text
SUBJECT. "The Face of a Friend" — strength 3 · range 3 one enemy treats you as an ally -- it will not attack you and will take a hit for you -- until you attack it

It will not attack you. It will take a hit meant for you. It will do both until the moment you attack it, and then it will remember everything.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Gathered Pact

File: `spells/mind/the-gathered-pact.webp`

```text
SUBJECT. "The Gathered Pact" — strength 4 · every god you are pacted with grants its written favour, this turn

Every pact at once, called in on the same turn. Each god does exactly what it promised and no more, which is why this is worth four slots and not five.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Grave's Bargain

File: `spells/mind/the-graves-bargain.webp`

```text
SUBJECT. "The Grave's Bargain" — strength 5 · Conjure a dead ally, and they stand at 1 Health

They stand up at one Health, and they are themselves, and they know. When the fight ends they are dead again, and you are a little less alive for it.

Draw something arriving that was not there a moment ago.
```

### The Great Bargain

File: `spells/mind/the-great-bargain.webp`

```text
SUBJECT. "The Great Bargain" — strength 5 · Conjure a minor god becomes present and fights as an ally

It is actually here. The GM plays it as an ally for the rest of the fight, and afterwards it takes something the GM chooses — which is the only honest way to price a favour that large.

Draw something arriving that was not there a moment ago.
```

### The Grey Sickness

File: `spells/mind/the-grey-sickness.webp`

```text
SUBJECT. "The Grey Sickness" — strength 2 · Tainting 1 slow: a disease, not a poison

Not a poison. A disease, which is the difference between a bad afternoon and something still with them next week.

Draw something going wrong under the skin.
```

### The Hand Given

File: `spells/mind/the-hand-given.webp`

```text
SUBJECT. "The Hand Given" — strength 3 · and it costs a hand: your bare Strike is a Heavy weapon at Strike 4

It costs a hand. What is left strikes like a Heavy weapon, for ever, and you will never hold a shield again.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The House That Was

File: `spells/mind/the-house-that-was.webp`

```text
SUBJECT. "The House That Was" — strength 4 · overnight a ruin becomes a house, and the party rests as in a town

Overnight a ruin is a house again: warm, defensible, and worth sleeping in. The party rests as though they had reached somewhere.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Kingmaker's Draught

File: `spells/mind/the-kingmakers-draught.webp`

```text
SUBJECT. "The Kingmaker's Draught" — strength 5 · Poisoned 3 (3) no save. If it dies while poisoned, set aside no skill cards for this formula

Three rounds of three, no save, and no cost at all if it finishes him. If it does not, you have paid five cards for an angry survivor who knows your face.

Draw colour draining out.
```

### The Last Card

File: `spells/mind/the-last-card.webp`

```text
SUBJECT. "The Last Card" — strength 2 · you may play that card for both halves

One card left, and it does both jobs. A hand of one is the worst hand in the game and this is the formula that makes it the best.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Last Drop

File: `spells/mind/the-last-drop.webp`

```text
SUBJECT. "The Last Drop" — strength 5 · take your whole turn again, now

You will not be standing afterwards. You will have had two turns.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Long Dose

File: `spells/mind/the-long-dose.webp`

```text
SUBJECT. "The Long Dose" — strength 1 · Cast range 2 Poisoned (3)

No damage at all. Three rounds of a man who cannot use his off hand, which in a fight is worse than three damage and lasts longer.

Draw the shape forming between the hands, landing 2 squares from the one who threw it; colour draining out.
```

### The Long Look

File: `spells/mind/the-long-look.webp`

```text
SUBJECT. "The Long Look" — strength 3 · one true answer about the next scene, and the GM writes a prophecy

One question about the next scene, answered truthfully — and the GM writes a prophecy you do not get to read. The price is the better half of the formula.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Long Masquerade

File: `spells/mind/the-long-masquerade.webp`

```text
SUBJECT. "The Long Masquerade" — strength 5 · you and your whole party appear to be other people for a day

Out of combat: you and your whole party are other people for a day. Only magic sees through it, and most places have none.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Long Preparation

File: `spells/mind/the-long-preparation.webp`

```text
SUBJECT. "The Long Preparation" — strength 1 · name one enemy type: your Casts against it are +2 all fight

You read about them the night before. It is not insight; it is homework, and it only works on the thing you did it for.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Long Step

File: `spells/mind/the-long-step.webp`

```text
SUBJECT. "The Long Step" — strength 1 · Move +4 through anything, if you begin and end in shadow

Four squares, through whatever is in between, so long as both ends are dark. Movement is a sentence the table applies (core-rules 11), so the only thing the engine would have to know is which squares are shadowed.

Draw the ground covered, thrown with the whole body, nothing held back.
```

### The Long Table

File: `spells/mind/the-long-table.webp`

```text
SUBJECT. "The Long Table" — strength 3 · the party sheds every Wound and all rest tokens return

One meal, taken together, and nobody is carrying anything from before it. Once a day, and the elf-kin keep the tally — which is this school's price doing exactly what a price should.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Mark of Things to Come

File: `spells/mind/the-mark-of-things-to-come.webp`

```text
SUBJECT. "The Mark of Things to Come" — strength 2 · range 99 Marked (1) and Read 1

Marked at any range, and you know what its luck is about to do. The condition lands by itself; the reading is the half that does not.

Draw singled out of a crowd.
```

### The Mended Seam

File: `spells/mind/the-mended-seam.webp`

```text
SUBJECT. "The Mended Seam" — strength 1 · repair one item overnight, including corroded armour

One item, overnight, including corroded armour — which until now was the only damage in the game nothing undid.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Mirror

File: `spells/mind/the-mirror.webp`

```text
SUBJECT. "The Mirror" — strength 3 · Spent: a Cast aimed at you resolves against its own caster

Not stopped. Returned, in full, to the man who sent it — which is worse for him than for you and is the whole reason to prepare this instead of Unmake.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Nine Names

File: `spells/mind/the-nine-names.webp`

```text
SUBJECT. "The Nine Names" — strength 1 · a minor god names who here it is angry with

Out of combat. A minor god names who in this place it is angry with, and will not say why.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Open Book

File: `spells/mind/the-open-book.webp`

```text
SUBJECT. "The Open Book" — strength 4 · every ally draws fate with advantage, and Read 2

For one round the whole party is lucky and you can see why. Two cards down each of their decks, and a better draw on top of it.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Quick Dose

File: `spells/mind/the-quick-dose.webp`

```text
SUBJECT. "The Quick Dose" — strength 3 · Cast Poisoned 2 (2)

Adjacent, because it has to go in them. Two rounds, two damage a round, and armour is no part of the conversation.

Draw a shape held in the air between the hands, half-finished and still forming; colour draining out.
```

### The Red Hour

File: `spells/mind/the-red-hour.webp`

```text
SUBJECT. "The Red Hour" — strength 4 · range 2 every ally within 2 may play a second secondary

You open a vein for each of them, and for an hour nobody is tired.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Risen Rank

File: `spells/mind/the-risen-rank.webp`

```text
SUBJECT. "The Risen Rank" — strength 4 · Conjure range 3 corpses rise, and fall again when the round ends

Every body within three squares, up at once, for one round. Then they are bodies again, and the ground is worse than it was.

Draw the arrival, landing 3 squares from the one who threw it.
```

### The Second Heartbeat

File: `spells/mind/the-second-heartbeat.webp`

```text
SUBJECT. "The Second Heartbeat" — strength 3 · Spent: play a second primary this turn

Two hearts for one turn. The second one is paid for.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Shadow Road

File: `spells/mind/the-shadow-road.webp`

```text
SUBJECT. "The Shadow Road" — strength 4 · area 1 you and every ally within 1 teleport to any shadowed square on the map

You take them with you. The whole front rank arrives behind the enemy line at once, which is the only thing in this school that wins a fight outright.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Shared Cup

File: `spells/mind/the-shared-cup.webp`

```text
SUBJECT. "The Shared Cup" — strength 4 · Cast aimed 3 Poisoned 1 (3)

Everyone who drank. Three rounds of it, over three squares, and the save is the only mercy in the formula.

Draw the shape forming between the hands, one line only, from eye to target; colour draining out.
```

### The Shut Mouth

File: `spells/mind/the-shut-mouth.webp`

```text
SUBJECT. "The Shut Mouth" — strength 2 · Cast range 3 Silenced (1)

A caster who cannot speak is a man in a robe. Lore resists it, because the ones who understand the word are the ones who can get out from under it.

Draw the shape forming between the hands, landing 3 squares from the one who threw it; a mouth stopped.
```

### The Small Pact

File: `spells/mind/the-small-pact.webp`

```text
SUBJECT. "The Small Pact" — strength 1 · the god grants the favour written on your pact

Name the god you are pacted with, and it does the thing written on the pact. The same thing, every time — which is what makes this a spell and not a wish.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Sphere Entire

File: `spells/mind/the-sphere-entire.webp`

```text
SUBJECT. "The Sphere Entire" — strength 4 · range 3 area 5 of your element

Five squares of whichever sphere is yours, and standing in it costs you something every turn you stay.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Standing Flood

File: `spells/mind/the-standing-flood.webp`

```text
SUBJECT. "The Standing Flood" — strength 3 · range 3 area 3 Wet 2 deep water: and its Move is halved

Deep water where there was a floor. Everything in it is Wet, which is the opening half this school is built to set up.

Draw soaked through.
```

### The Standing Ward

File: `spells/mind/the-standing-ward.webp`

```text
SUBJECT. "The Standing Ward" — strength 4 · Spent: until your next turn no Cast resolves at all, anywhere -- yours too

Spent: for one round there is no magic on the field. Yours included, which is what makes this a ward and not an attack.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Unbound Tongue

File: `spells/mind/the-unbound-tongue.webp`

```text
SUBJECT. "The Unbound Tongue" — strength 1 · Shake 1 range 3 Silenced

The cheapest formula in the school and the one that beats the school: a warder with this prepared cannot be silenced out of the fight.

Draw footing lost, landing 3 squares from the one who threw it; a mouth stopped.
```

### The Unlatched Door

File: `spells/mind/the-unlatched-door.webp`

```text
SUBJECT. "The Unlatched Door" — strength 2 · a door ever opened by one who lived there opens for you

Any door or lock that was ever opened by somebody who lived there opens for you. Most doors were, which is the joke and also the spell.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Whole Skin

File: `spells/mind/the-whole-skin.webp`

```text
SUBJECT. "The Whole Skin" — strength 5 · Graven Burning never lands. You may never prepare another spell

There is no skin left to write on. It is the last thing you ever learn, and afterwards you are something else wearing a mage's name.

Draw a mark cut into flesh and holding.
```

### The Whole Thread

File: `spells/mind/the-whole-thread.webp`

```text
SUBJECT. "The Whole Thread" — strength 5 · the GM shows the enemy's intent cards for the whole fight, in order

The whole fight, in order, before it starts. The GM writes three prophecies for it, and a diviner who uses this twice in a week is in a story they no longer steer.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Turn Aside

File: `spells/mind/turn-aside.webp`

```text
SUBJECT. "Turn Aside" — strength 2 · range 3 one ally's Block counts double against this attack

You do not stop the blow; you make their shield worth twice what it was for exactly as long as it takes.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Unmake the Ground

File: `spells/mind/unmake-the-ground.webp`

```text
SUBJECT. "Unmake the Ground" — strength 5 · all fight

A line across the battlefield that is no longer there. For the rest of the fight, nobody crosses it — you included, which is the half of this that gets casters killed.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Where It Will Land

File: `spells/mind/where-it-will-land.webp`

```text
SUBJECT. "Where It Will Land" — strength 1 · Foresee 1

Your own deck, one card down. The cheapest certainty in the game.

Draw the moment before a thing happens, shown twice.
```

### Wrong Face

File: `spells/mind/wrong-face.webp`

```text
SUBJECT. "Wrong Face" — strength 2 · Cast Dazed (2)

Your face is briefly somebody they were not expecting. Two rounds of trying to work out what they are looking at.

Draw a shape held in the air between the hands, half-finished and still forming; sight swimming.
```

## Miracles — Way of Faith pool

**50 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/spells/faith/`.

A lesser miracle. Quiet, domestic in scale, and the light comes from outside the frame.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A lesser miracle. Quiet, domestic in scale, and the light comes from outside the frame.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Faith**, so its one chromatic accent is **#8a74b8**,
  deepening to **#403458** in the darkest wash. Use it on the one thing the
  picture is about, and nowhere else. No other hue appears.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### A Word for You

File: `spells/faith/a-word-for-you.webp`

```text
SUBJECT. "A Word for You" — strength 1 · range 3 Blessed

Blessed: a temporary Critical in their fate deck, until it is drawn. The condition shuffles the card in by itself (core-rules 6).

Draw light that chose someone.
```

### A Word Withdrawn

File: `spells/faith/a-word-withdrawn.webp`

```text
SUBJECT. "A Word Withdrawn" — strength 1 · Lift range 3 Blessed or Cursed

The marker and the card both: a blessing withdrawn is a Critical taken back out of the deck, and a curse withdrawn is a Miss. It works on anybody, including the enemy you blessed by mistake.

Draw the weight taken off, landing 3 squares from the one who threw it; light that chose someone.
```

### Alone on the Road

File: `spells/faith/alone-on-the-road.webp`

```text
SUBJECT. "Alone on the Road" — strength 1 · Heal 2 at the start of your turn

While no ally is within 2 squares, heal 2 at the start of your turn. The only healing a priest of hers can ever receive.

Draw a wound closing, or breath coming back.
```

### Bear It for Them

File: `spells/faith/bear-it-for-them.webp`

```text
SUBJECT. "Bear It for Them" — strength 2 · range 3 move one condition off an ally and onto yourself

Whatever is on them is on you instead, at its full duration. The Spirit's priests are the only ones who can do this and the only ones who would.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Breath for the Dying

File: `spells/faith/breath-for-the-dying.webp`

```text
SUBJECT. "Breath for the Dying" — strength 5 · every ally at 0 Health stands at half Health. You may carry nothing for the rest of the day

Everybody who had fallen is standing, at half. You will carry nothing at all until tomorrow, which in a dungeon is a real price and not a flourish.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Everyone Wears His Face

File: `spells/faith/everyone-wears-his-face.webp`

```text
SUBJECT. "Everyone Wears His Face" — strength 5 · until your next turn every enemy attack targets another enemy

For one round no enemy can tell friend from foe, and every attack they make lands on one of their own. It is the same mechanism Glamour's 4 wants, done once and for certain rather than at random.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Full Belly

File: `spells/faith/full-belly.webp`

```text
SUBJECT. "Full Belly" — strength 1 · the party's next rest returns one extra rest token

Out of combat: the party's next rest returns one extra rest token.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Grey Judgement

File: `spells/faith/grey-judgement.webp`

```text
SUBJECT. "Grey Judgement" — strength 2 · range 1 a Judged adjacent enemy acts last this round

A Judged adjacent enemy acts last in the round, whatever its initiative.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Half a Truth

File: `spells/faith/half-a-truth.webp`

```text
SUBJECT. "Half a Truth" — strength 2 · until your next turn enemies act as though one ally you name were not there

Name one of your own. For a round the enemy fights as though they were not on the field at all, which is as good as cover and better than armour.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Lay On

File: `spells/faith/lay-on.webp`

```text
SUBJECT. "Lay On" — strength 1 · Heal 2 range 3

Hands, and three squares of air between you.

Draw the wound closing, landing 3 squares from the one who threw it.
```

### Measure of the Debt

File: `spells/faith/measure-of-the-debt.webp`

```text
SUBJECT. "Measure of the Debt" — strength 2 · a Judged enemy that dies this round: you gain 3 Health

A Judged enemy that dies this round pays you 3 Health. The debt is collected whether or not you were the one who called it in.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Name the Guilty

File: `spells/faith/name-the-guilty.webp`

```text
SUBJECT. "Name the Guilty" — strength 1 · range 6 Judged (1)

No save. Being named is not something you resist.

Draw seen, and found wanting.
```

### No Step Back

File: `spells/faith/no-step-back.webp`

```text
SUBJECT. "No Step Back" — strength 2 · Block 2 area 2

Every ally within 2 gains Block 2 until your next turn. Valtor's answer to being outnumbered is that nobody moves.

Draw a blow stopped flat, its force going sideways.
```

### Nobody's Friend

File: `spells/faith/nobodys-friend.webp`

```text
SUBJECT. "Nobody's Friend" — strength 2 · range 3 until your next turn no ally may Heal, Interpose for, or redirect a hit from one enemy

One of them is alone now: nobody will heal it, step in front of it or take a hit for it. Vulpet's priests understand this condition from the inside.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Stand Where I Stand

File: `spells/faith/stand-where-i-stand.webp`

```text
SUBJECT. "Stand Where I Stand" — strength 1 · range 1 adjacent allies cannot be reduced below 1 Health

Allies adjacent to you cannot be reduced below 1 Health until your next turn. Costs 2 Health, because his miracles are paid in yours.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Steady the Hand

File: `spells/faith/steady-the-hand.webp`

```text
SUBJECT. "Steady the Hand" — strength 1 · Shake 1 range 3 Compelled

Ends Compelled on an ally, and accuses whoever did it. Answer and accuse, which is what a targeted counter has to do to be worth a slot (way-cards 3.6).

Draw footing lost, landing 3 squares from the one who threw it; pulled toward something against the will.
```

### Taste of the Rot

File: `spells/faith/taste-of-the-rot.webp`

```text
SUBJECT. "Taste of the Rot" — strength 1 · Cast +1 range 1 Off Balance (1) the Taint only on a Miss

One adjacent enemy: 1 damage and Off-Balance, no save. A Miss costs you a Taint, which is the god being paid whether or not it worked.

Draw the shape forming between the hands, the one that found its moment, landing 1 squares from the one who threw it; weight in the wrong place.
```

### The Air Between

File: `spells/faith/the-air-between.webp`

```text
SUBJECT. "The Air Between" — strength 4 · until your next turn every ally may take one extra reaction per trigger

For one round everybody answers twice. The reaction policy allows one per trigger and this is the only thing in the game that argues with it.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Body Made Clean

File: `spells/faith/the-body-made-clean.webp`

```text
SUBJECT. "The Body Made Clean" — strength 5 · every ally is healed to full and every condition is Lifted and Shaken off. Your action deck is 6 cards for the rest of the day

Everybody whole, and nothing on anybody. You will play the rest of the day out of six cards, which is the god's point: the body is clean and the hand is empty.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Brewer's Tithe

File: `spells/faith/the-brewers-tithe.webp`

```text
SUBJECT. "The Brewer's Tithe" — strength 2 · Tainting 2 slow: a disease, not a poison

Slow, and still there next week. A disease rather than a poison, which is the distinction the whole cult is built on.

Draw something going wrong under the skin.
```

### The Charge

File: `spells/faith/the-charge.webp`

```text
SUBJECT. "The Charge" — strength 2 · area 2 every ally within 2 may Move their full value, at once, now

Strain 2, and the whole line moves at once. Movement is a sentence the table applies (core-rules 11), so this miracle is finished as written.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Clean Field

File: `spells/faith/the-clean-field.webp`

```text
SUBJECT. "The Clean Field" — strength 4 · until your next turn no enemy may play a secondary

For one round nobody on the other side does anything but their main business. It is the same mechanism as Fagar's small trick, over the whole field.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Close Work

File: `spells/faith/the-close-work.webp`

```text
SUBJECT. "The Close Work" — strength 2 · adjacent: an enemy's Strike hits the nearest other enemy instead

You move his arm. The man behind him takes it, and neither of them understands what happened.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Driven Out

File: `spells/faith/the-driven-out.webp`

```text
SUBJECT. "The Driven Out" — strength 4 · area 3 Compelled (1) and you gain Block 3 for each enemy Compelled

Everything within three squares wants you and nothing else, and you are three Block better off for each one of them. It is a good trade and a terrible position.

Draw pulled toward something against the will.
```

### The Grey Hour

File: `spells/faith/the-grey-hour.webp`

```text
SUBJECT. "The Grey Hour" — strength 4 · range 1 Halted (1)

Its whole turn does not happen. Not interrupted — it simply never took place, and the round moves on without it.

Draw stopped dead at a line.
```

### The Land Beneath

File: `spells/faith/the-land-beneath.webp`

```text
SUBJECT. "The Land Beneath" — strength 5 · area 2 every enemy within 2 is gone until then. You are Prone

The ground opens and takes them. They are back at the start of your third turn, and you are Prone, and alone, and it is entirely your own doing.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Lie That Held

File: `spells/faith/the-lie-that-held.webp`

```text
SUBJECT. "The Lie That Held" — strength 5 · a lie named before the fight is true

Name the lie before the fight. While you spend a secondary each round it is true, and the GM runs the fight as though it always had been.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Line Holds

File: `spells/faith/the-line-holds.webp`

```text
SUBJECT. "The Line Holds" — strength 4 · allies adjacent to you cannot be moved, knocked Prone or Compelled

Nobody beside you is moved, knocked down or turned. It costs two Health a man, and Vax expects you to count them first.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Mask of the Captain

File: `spells/faith/the-mask-of-the-captain.webp`

```text
SUBJECT. "The Mask of the Captain" — strength 4 · one enemy obeys you for a round -- you play its turn

For one round it is yours: you play its turn, with its cards, against its own side. The trick works once and everybody remembers your face afterwards.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Narrow Path

File: `spells/faith/the-narrow-path.webp`

```text
SUBJECT. "The Narrow Path" — strength 1 · your miracles cost 1 slot less (min 1)

Less to carry, less to remember, and the words come easier. A thin deck is the clean body, written as arithmetic.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Orchard

File: `spells/faith/the-orchard.webp`

```text
SUBJECT. "The Orchard" — strength 4 · Heal 4 and sheds one condition

Two turns from now the whole party heals four and sheds something. Planting is the god's only verb.

Draw a wound closing, or breath coming back.
```

### The Planted Word

File: `spells/faith/the-planted-word.webp`

```text
SUBJECT. "The Planted Word" — strength 1 · one enemy type cannot play reactions

Name one enemy type before the fight. While you spend a secondary each round, that type cannot play reactions.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Poisoned Well

File: `spells/faith/the-poisoned-well.webp`

```text
SUBJECT. "The Poisoned Well" — strength 4 · Tainting 1 blast 3 fast

Three squares of it, fast. Everything standing in the water carries it away.

Draw the wrongness spreading, reaching everything around at once.
```

### The Sea Decides

File: `spells/faith/the-sea-decides.webp`

```text
SUBJECT. "The Sea Decides" — strength 5 · shuffle every fate deck on the field into one; everyone draws from it

Every fate deck on the field, shuffled into one. For the rest of the fight nobody has their own luck, which is the fairest thing the sea has ever done.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Second Face

File: `spells/faith/the-second-face.webp`

```text
SUBJECT. "The Second Face" — strength 1 · Spent: read one enemy's intent card for this round before anyone acts

Spent: you know what one of them is going to do before anybody moves. Fagar's whole theology is that this is enough.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Second Thought

File: `spells/faith/the-second-thought.webp`

```text
SUBJECT. "The Second Thought" — strength 1 · range 3 Dazed (1)

One enemy spends its secondary this round doing nothing.

Draw sight swimming.
```

### The Shield Line

File: `spells/faith/the-shield-line.webp`

```text
SUBJECT. "The Shield Line" — strength 2 · range 1 adjacent allies gain your armor as Block

Every ally adjacent to you gains your armor value as Block until your next turn. One Health per ally, so a long line is a dear one.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Silent Knife

File: `spells/faith/the-silent-knife.webp`

```text
SUBJECT. "The Silent Knife" — strength 5 · adjacent: one enemy is dead. No save, no fate draw, no roll of any kind

Adjacent only. One enemy is dead. There is no roll of any kind, which is what a god of the silent approach has instead of a spell.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Sixth District

File: `spells/faith/the-sixth-district.webp`

```text
SUBJECT. "The Sixth District" — strength 5 · until the fight ends every adjacent ally shares your armor and Block, and damage dealt to them is dealt to you instead

Your armour is theirs, your Block is theirs, and everything aimed at them arrives in you. It will cost enough, which is how Vax prices war plainly.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Slow Failure

File: `spells/faith/the-slow-failure.webp`

```text
SUBJECT. "The Slow Failure" — strength 5 · Tainting 3

Tainting 3 on them and two Taint on you — which with the first taste is Afflicted. A priest of The Purple who casts their thesis is ill for good.

Draw something going wrong under the skin.
```

### The Slow Mercy

File: `spells/faith/the-slow-mercy.webp`

```text
SUBJECT. "The Slow Mercy" — strength 2 · range 3 healed to full

Name them now. At the start of your third turn they are whole, which is either too late or exactly right.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Spring Tide

File: `spells/faith/the-spring-tide.webp`

```text
SUBJECT. "The Spring Tide" — strength 4 · until your next turn every ally draws fate twice and keeps both

For one round the whole party has the tide with them: two cards each, and both of them count.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Turning Tide

File: `spells/faith/the-turning-tide.webp`

```text
SUBJECT. "The Turning Tide" — strength 2 · range 3 Cursed an ally redraws a fate card and keeps the second. The Cursed is yours

The sea is not fair. They draw again and must keep the second card, and a Miss joins your own deck for having asked.

Draw a shadow that chose someone.
```

### The War Drum

File: `spells/faith/the-war-drum.webp`

```text
SUBJECT. "The War Drum" — strength 4 · area 2 every ally within 2 takes their whole turn again, now

Strain 3, and everybody near you goes again. The same mechanism Blood Magic's thesis wants, bought with pain instead of blood.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Weight of It

File: `spells/faith/the-weight-of-it.webp`

```text
SUBJECT. "The Weight of It" — strength 2 · range 6 a Judged enemy's armor counts 0 against everyone until your next turn

Named, and then weighed. For one round its armour is worth nothing to anybody on the field, which is a gift to the whole line rather than to you.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Whole Cloth

File: `spells/faith/the-whole-cloth.webp`

```text
SUBJECT. "The Whole Cloth" — strength 4 · one enemy type believes the party are its own

While you keep paying a half every round, one whole kind of enemy believes the party are its own. Stop paying and the room remembers.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### Undertow

File: `spells/faith/undertow.webp`

```text
SUBJECT. "Undertow" — strength 2 · Cast range 3 blast 2 Wet (1) every target is moved 1 square you choose

Wet, and everything in it moved a square you choose. Moving figures is a sentence the table applies (core-rules 11), so this card is complete.

Draw the shape forming between the hands, landing 3 squares from the one who threw it, reaching everything around at once; soaked through.
```

### Valtor's Own

File: `spells/faith/valtors-own.webp`

```text
SUBJECT. "Valtor's Own" — strength 5 · for the rest of the fight you play a primary and two secondaries each turn

Your whole hand, strained, and for the rest of the fight you act like three men. There is nothing left to play it with, which is the god's idea of a bargain.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### What Does Not Die

File: `spells/faith/what-does-not-die.webp`

```text
SUBJECT. "What Does Not Die" — strength 3 · drop to 1 instead of 0, and lose a spell slot for good

When you would drop to 0 Health, drop to 1 instead — and lose a spell slot permanently.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### What Grows Out of Us

File: `spells/faith/what-grows-out-of-us.webp`

```text
SUBJECT. "What Grows Out of Us" — strength 5 · every ally including the dead stands at full Health

Four turns. Then everybody stands up, including the ones who had stopped being people and started being ground.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

## Features

**14 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/features/`.

Always on, so this picture sits on a character's sheet for their whole life. A quality rather than an action.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. Always on, so this picture sits on a character's sheet for their whole life. A quality rather than an action.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Alert

File: `features/alert.webp`

```text
SUBJECT. "Alert" — You draw with advantage on initiative.

Draw a head already turned toward a sound nobody else has heard yet, the body still facing the way it was going.
```

### Arcane Focus

File: `features/arcane-focus.webp`

```text
SUBJECT. "Arcane Focus" — +1 to all Cast values.

Draw an object with more inside it than its size allows.
```

### Good Aim

File: `features/good-aim.webp`

```text
SUBJECT. "Good Aim" — +2 range on Ranged and Thrown items.

Draw an object that means nothing except in trained hands.
```

### Good Name

File: `features/good-name.webp`

```text
SUBJECT. "Good Name" — +1 on Presence checks. People have heard of you, and most of it was good.

Draw an object that means nothing except in trained hands.
```

### Hard Hands

File: `features/hard-hands.webp`

```text
SUBJECT. "Hard Hands" — +1 on Might checks. Lifting, breaking, and not letting go.

Draw an object that means nothing except in trained hands.
```

### Light Step

File: `features/light-step.webp`

```text
SUBJECT. "Light Step" — +1 on Agility checks. Where to put a foot, decided before you need it.

Draw an object that means nothing except in trained hands.
```

### Packhorse

File: `features/packhorse.webp`

```text
SUBJECT. "Packhorse" — +20 kg carry allowance.

Draw a back under a load that would stop anybody else, straps biting in, the stride not broken by it.
```

### Quick

File: `features/quick.webp`

```text
SUBJECT. "Quick" — Hand size +1.

Draw two things done in the time for one: a hand finishing one motion while the body has already committed to the next.
```

### Quick Eye

File: `features/quick-eye.webp`

```text
SUBJECT. "Quick Eye" — +1 on Wits checks. You notice the thing that is about to happen.

Draw an object that means nothing except in trained hands.
```

### Quiet Worker

File: `features/quiet-worker.webp`

```text
SUBJECT. "Quiet Worker" — +1 on Shadow checks. Slowly is quietly, and you have the patience for it.

Draw an object that means nothing except in trained hands.
```

### Steady

File: `features/steady.webp`

```text
SUBJECT. "Steady" — You don't become Dazed. · Drain: you don't become Dazed.

Draw a face taking a hard blow without the eyes losing their focus. The head moves; the look does not.
```

### Strong

File: `features/strong.webp`

```text
SUBJECT. "Strong" — +1 damage on Strike with Heavy items.

Draw something worn against the skin, shaped by the body that wore it.
```

### Tough

File: `features/tough.webp`

```text
SUBJECT. "Tough" — +4 max Health.

Draw a body that has been opened and closed several times already, old seams showing, entirely unbothered by the newest one.
```

### Well Read

File: `features/well-read.webp`

```text
SUBJECT. "Well Read" — +1 on Lore checks. Somebody has written this down, and you have read them.

Draw an object that means nothing except in trained hands.
```

## Items

**150 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/items/`.

An object, drawn as a plate from a catalogue of things: one item, one light, no hand.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. An object, drawn as a plate from a catalogue of things: one item, one light, no hand.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Accuser's Ring

File: `items/accusers-ring.webp`

```text
SUBJECT. "Accuser's Ring" — Wonder · It is cold on the finger that points. · One enemy within 3 is Judged (1).

Draw an object behaving as though it were awake.
```

### Amulet of the Fed Thread

File: `items/amulet-of-the-fed-thread.webp`

```text
SUBJECT. "Amulet of the Fed Thread" — Wonder · The thread is mended. Something had to pay out the length. · When you would drop to 0 Health, drop to 1 instead.

Draw an object behaving as though it were awake.
```

### Amulet of the Mended Thread

File: `items/amulet-of-the-mended-thread.webp`

```text
SUBJECT. "Amulet of the Mended Thread" — Wonder · A knotted thread in amber. The knot is tied, not drawn. · When you would drop to 0 Health, drop to 1 instead.

Draw an object behaving as though it were awake.
```

### Antidote

File: `items/antidote.webp`

```text
SUBJECT. "Antidote" — Consumable · Charcoal, milk thistle and something the brewer will not name.

Draw a vessel, and whatever is in it is nearly gone.
```

### Arming Sword

File: `items/arming-sword.webp`

```text
SUBJECT. "Arming Sword" — Weapon · A plain single-handed blade. Every town has a smith who makes them.

Draw an edge, worn and sharpened back more than once.
```

### Arquebus

File: `items/arquebus.webp`

```text
SUBJECT. "Arquebus" — Weapon · Loud, slow, and it does not care what you are wearing.

Draw weight: the object sits, and the surface under it knows; the weapon drawn and held at tension.
```

### Assassin's Tincture

File: `items/assassins-tincture.webp`

```text
SUBJECT. "Assassin's Tincture" — Poison · Apply with a Ready. Next Strike that hits: Poisoned 1 (2), beginning at the start of their next turn. No save. · They finish the sentence ...

Draw a vessel, and whatever is in it is nearly gone.
```

### Balanced Dagger

File: `items/balanced-dagger.webp`

```text
SUBJECT. "Balanced Dagger" — Make · Weighted at the tang. It goes where you looked.

Draw a throwing knife standing upright on its point, balanced and perfectly still, the whole weight of it resting on a spot smaller than a fingernail.
```

### Beggar's Bowl

File: `items/beggars-bowl.webp`

```text
SUBJECT. "Beggar's Bowl" — Wonder · Whatever is dropped in it stops being anybody's. · Lift Blessed or Cursed from anyone adjacent.

Draw an object behaving as though it were awake.
```

### Black Lotus

File: `items/black-lotus.webp`

```text
SUBJECT. "Black Lotus" — Poison · Apply with a Ready. Next Strike that hits: Poisoned 3 (2), resist Might 9. · Illegal in every district, which is how you know the price is...

Draw a vessel, and whatever is in it is nearly gone.
```

### Blade of the Eager Hand

File: `items/blade-of-the-eager-hand.webp`

```text
SUBJECT. "Blade of the Eager Hand" — Wonder · It wants to be swung and it is not fussy about at what.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Blade Venom

File: `items/blade-venom.webp`

```text
SUBJECT. "Blade Venom" — Poison · Apply with a Ready. Next Strike that hits: Poisoned 1 (2), resist Might 5. · Brewed from something that was already unpleasant.

Draw a vessel, and whatever is in it is nearly gone.
```

### Blunt Head

File: `items/blunt-head.webp`

```text
SUBJECT. "Blunt Head" — Ammunition · Bow or crossbow. The target is Off-Balance (1). No save. · No point at all, which is the point.

Draw a vessel, and whatever is in it is nearly gone.
```

### Bodkin Points

File: `items/bodkin-points.webp`

```text
SUBJECT. "Bodkin Points" — Ammunition · Bow or crossbow. Ignores 2 armor. · A square spike, hardened. It is looking for a gap and will make one.

Draw a vessel, and whatever is in it is nearly gone.
```

### Boots of the Long Step

File: `items/boots-of-the-long-step.webp`

```text
SUBJECT. "Boots of the Long Step" — Wonder · The soles are never quite worn in the same places twice. · Teleport to any square you can see within 6.

Draw an object behaving as though it were awake.
```

### Boots of the Longer Step

File: `items/boots-of-the-longer-step.webp`

```text
SUBJECT. "Boots of the Longer Step" — Wonder · Your Move values are +2. · They were barely worn because their owner could not stop.

Draw an object behaving as though it were awake.
```

### Bottle of Borrowed Pain

File: `items/bottle-of-borrowed-pain.webp`

```text
SUBJECT. "Bottle of Borrowed Pain" — Potion · It does not heal you. It postpones you.

Draw a vessel, and whatever is in it is nearly gone.
```

### Brewer's Reserve

File: `items/brewers-reserve.webp`

```text
SUBJECT. "Brewer's Reserve" — Potion · The brewer keeps a cask of it back and will not say what is in it.

Draw a vessel, and whatever is in it is nearly gone.
```

### Brigandine

File: `items/brigandine.webp`

```text
SUBJECT. "Brigandine" — Armor · Blocks Sidestep reactions. · Plates riveted between canvas. Heavy enough that you stop dodging.

Draw armour as worn metal and strap, not as a costume; weight: the object sits, and the surface under it knows.
```

### Buckler

File: `items/buckler.webp`

```text
SUBJECT. "Buckler" — Shield · A fist-sized iron plate. Better than the hand behind it.

Draw a shield, face on and slightly turned, its edge nicked from use.
```

### Cairn Stone

File: `items/cairn-stone.webp`

```text
SUBJECT. "Cairn Stone" — Wonder · Set it down: its square is high ground for the rest of the fight. · Set it down and the ground agrees to be taller.

Draw an object behaving as though it were awake.
```

### Caltrops

File: `items/caltrops.webp`

```text
SUBJECT. "Caltrops" — Consumable · A handful of iron, however it lands.

Draw a vessel, and whatever is in it is nearly gone.
```

### Chalked Shaft

File: `items/chalked-shaft.webp`

```text
SUBJECT. "Chalked Shaft" — Ammunition · Bow or crossbow. The target is Marked (1). No save. · It leaves a smear that everyone can see and nobody can wipe off.

Draw a vessel, and whatever is in it is nearly gone.
```

### Cleansing Draught

File: `items/cleansing-draught.webp`

```text
SUBJECT. "Cleansing Draught" — Consumable · A temple brews it and does not sell it gladly.

Draw a vessel, and whatever is in it is nearly gone.
```

### Climbing Rope

File: `items/climbing-rope.webp`

```text
SUBJECT. "Climbing Rope" — Tool · Fifty feet of hemp. Nobody falls alone.

Draw a tool worn exactly where a hand goes and nowhere else.
```

### Cloak of the Grey

File: `items/cloak-of-the-grey.webp`

```text
SUBJECT. "Cloak of the Grey" — Wonder · It is the colour of whatever is behind it. · Become Invisible (1).

Draw an object behaving as though it were awake.
```

### Cloak of the Grey Road

File: `items/cloak-of-the-grey-road.webp`

```text
SUBJECT. "Cloak of the Grey Road" — Wonder · The road is grey. So is everything you are now to your friends. · Become Invisible (1).

Draw an object behaving as though it were awake.
```

### Cracked Spyglass

File: `items/cracked-spyglass.webp`

```text
SUBJECT. "Cracked Spyglass" — Wonder · Foresee one extra type at the start of a fight. · The crack does not matter. What you see through it has not happened yet.

Draw an object behaving as though it were awake.
```

### Crossbow

File: `items/crossbow.webp`

```text
SUBJECT. "Crossbow" — Weapon · Anyone can be taught one in a week, which is why lords dislike them.

Draw the weapon drawn and held at tension.
```

### Crown of the Quiet Mind

File: `items/crown-of-the-quiet-mind.webp`

```text
SUBJECT. "Crown of the Quiet Mind" — Wonder · Thin gold. Nothing in your head hurries while it is on.

Draw an object behaving as though it were awake.
```

### Dagger

File: `items/dagger.webp`

```text
SUBJECT. "Dagger" — Weapon · Short, quick, and easy to hide.

Draw a short blade coming out of a sleeve, most of it still hidden, only the last inch of edge catching any light.
```

### Deep Pockets

File: `items/deep-pockets.webp`

```text
SUBJECT. "Deep Pockets" — Wonder · More in them than went in, and never what you wanted.

Draw an object behaving as though it were awake.
```

### Discriminating Wand

File: `items/discriminating-wand.webp`

```text
SUBJECT. "Discriminating Wand" — Wonder · Your Blasts count as Aimed. · It knows whose side everyone is on, which is more than most people do.

Draw an object that is doing something while nobody holds it.
```

### Draught of Lead

File: `items/draught-of-lead.webp`

```text
SUBJECT. "Draught of Lead" — Potion · Heavier than it looks, and so are you now.

Draw a vessel, and whatever is in it is nearly gone.
```

### Draught of Second Breath

File: `items/draught-of-second-breath.webp`

```text
SUBJECT. "Draught of Second Breath" — Potion · One swallow and your lungs believe the fight has just started.

Draw a vessel, and whatever is in it is nearly gone.
```

### Draught of the Hollow

File: `items/draught-of-the-hollow.webp`

```text
SUBJECT. "Draught of the Hollow" — Potion · It empties something you were not keeping track of.

Draw a vessel, and whatever is in it is nearly gone.
```

### Drowned Bell

File: `items/drowned-bell.webp`

```text
SUBJECT. "Drowned Bell" — Wonder · It rings wet. There is no water in it. · Everything within 2 is Wet (1).

Draw an object behaving as though it were awake.
```

### Drowsing Oil

File: `items/drowsing-oil.webp`

```text
SUBJECT. "Drowsing Oil" — Poison · Apply with a Ready. Next Strike that hits: Dazed (2), resist Might 5. · It does not kill. It makes a man slow about objecting.

Draw a vessel, and whatever is in it is nearly gone.
```

### Elixir of the Long Night

File: `items/elixir-of-the-long-night.webp`

```text
SUBJECT. "Elixir of the Long Night" — Potion · It lends. It is very clear about lending.

Draw a vessel, and whatever is in it is nearly gone.
```

### Far-sight Monocle

File: `items/far-sight-monocle.webp`

```text
SUBJECT. "Far-sight Monocle" — Wonder · Your Ranged items' range is doubled. · Ground by somebody who had opinions about distance.

Draw an object behaving as though it were awake.
```

### Fine Clothes

File: `items/fine-clothes.webp`

```text
SUBJECT. "Fine Clothes" — Station · Cut well enough that nobody asks who you are.

Draw a thing that says who somebody is before they speak.
```

### Fine Longsword

File: `items/fine-longsword.webp`

```text
SUBJECT. "Fine Longsword" — Make · A smith's mark near the hilt, and worth asking after.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Fire Wand

File: `items/fire-wand.webp`

```text
SUBJECT. "Fire Wand" — Implement · Blackened at the tip, and warm even unused.

Draw an object that is doing something while nobody holds it.
```

### Firepot

File: `items/firepot.webp`

```text
SUBJECT. "Firepot" — Consumable · Pitch and naphtha in a clay shell. It keeps burning.

Draw a vessel, and whatever is in it is nearly gone; an object mid-flight, the hand that threw it out of frame.
```

### Flask of Ink

File: `items/flask-of-ink.webp`

```text
SUBJECT. "Flask of Ink" — Consumable · Cuttlefish black. It finds what is not there to be seen.

Draw a vessel, and whatever is in it is nearly gone; an object mid-flight, the hand that threw it out of frame.
```

### Flask of Oil

File: `items/flask-of-oil.webp`

```text
SUBJECT. "Flask of Oil" — Consumable · Lamp oil, thrown low.

Draw a vessel, and whatever is in it is nearly gone; an object mid-flight, the hand that threw it out of frame.
```

### Focus Pendant

File: `items/focus-pendant.webp`

```text
SUBJECT. "Focus Pendant" — Power · Jeweller's work. The stone is not the point; the setting is.

Draw an object with more inside it than its size allows.
```

### Frost-dipped Bolt

File: `items/frost-dipped-bolt.webp`

```text
SUBJECT. "Frost-dipped Bolt" — Ammunition · Crossbow. Frozen 1 (1). · Cold enough that the quiver frosts around it.

Draw a vessel, and whatever is in it is nearly gone.
```

### Gag of the Nine

File: `items/gag-of-the-nine.webp`

```text
SUBJECT. "Gag of the Nine" — Wonder · Nine knots in a cord. Somebody counted them out loud, once. · One enemy within 3 is Silenced (1), resist Lore 5.

Draw an object behaving as though it were awake.
```

### Gambler's Coin

File: `items/gamblers-coin.webp`

```text
SUBJECT. "Gambler's Coin" — Wonder · It lands how you need it to, which is not the same as how you want it to. · Read 3 on your own fate deck.

Draw an object behaving as though it were awake.
```

### Gaming Set

File: `items/gaming-set.webp`

```text
SUBJECT. "Gaming Set" — Station · Dice, a board and a cup. Soldiers will tell a stranger anything over it.

Draw a thing that says who somebody is before they speak.
```

### Gauntlet of the Open Palm

File: `items/gauntlet-of-the-open-palm.webp`

```text
SUBJECT. "Gauntlet of the Open Palm" — Wonder · Beautifully made, and it will not close.

Draw armour as worn metal and strap, not as a costume.
```

### Gorget of the Turned Blade

File: `items/gorget-of-the-turned-blade.webp`

```text
SUBJECT. "Gorget of the Turned Blade" — Wonder · Three old cuts in it, none of them deep. · Block 3 as a reaction.

Draw an object behaving as though it were awake.
```

### Grapnel Bolt

File: `items/grapnel-bolt.webp`

```text
SUBJECT. "Grapnel Bolt" — Ammunition · Crossbow. YOU are pulled to a square adjacent to the target. · Barbed, with fifty feet of silk line. A bolt for closing.

Draw a vessel, and whatever is in it is nearly gone.
```

### Grave-cap Extract

File: `items/grave-cap-extract.webp`

```text
SUBJECT. "Grave-cap Extract" — Poison · Apply with a Ready. Next Strike that hits: Poisoned 2 (2), resist Might 7. · The cap grows on what is under the cairn, not on the cairn.

Draw a vessel, and whatever is in it is nearly gone.
```

### Great Axe

File: `items/great-axe.webp`

```text
SUBJECT. "Great Axe" — Weapon · Cheaper than a greatsword and it does not care.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Great Helm

File: `items/great-helm.webp`

```text
SUBJECT. "Great Helm" — Armor · Disadvantage on Wits checks. · Safe, and you cannot hear a thing through it.

Draw armour as worn metal and strap, not as a costume; weight: the object sits, and the surface under it knows.
```

### Greater Healing Potion

File: `items/greater-healing-potion.webp`

```text
SUBJECT. "Greater Healing Potion" — Potion · Twice the price of the ordinary sort and rather more than twice the work.

Draw a vessel, and whatever is in it is nearly gone.
```

### Greatsword

File: `items/greatsword.webp`

```text
SUBJECT. "Greatsword" — Weapon · Four feet of edge. Both hands, and nothing held back.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Grey Water

File: `items/grey-water.webp`

```text
SUBJECT. "Grey Water" — Potion · Somebody corked it carefully, which is the cruellest part.

Draw a vessel, and whatever is in it is nearly gone.
```

### Halberd

File: `items/halberd.webp`

```text
SUBJECT. "Halberd" — Weapon · Axe, spike and hook on a six-foot shaft. Reaches over the man in front of you.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Healer's Kit

File: `items/healers-kit.webp`

```text
SUBJECT. "Healer's Kit" — Tool · Needle, gut, lint and spirit.

Draw a tool worn exactly where a hand goes and nowhere else.
```

### Healing Potion

File: `items/healing-potion.webp`

```text
SUBJECT. "Healing Potion" — Consumable · Thick, red, and tastes of iron.

Draw a vessel, and whatever is in it is nearly gone.
```

### Heavy Crossbow

File: `items/heavy-crossbow.webp`

```text
SUBJECT. "Heavy Crossbow" — Weapon · Cranked with a windlass. It goes through a shield and the arm behind it.

Draw weight: the object sits, and the surface under it knows; the weapon drawn and held at tension.
```

### Helm of the Watchful

File: `items/helm-of-the-watchful.webp`

```text
SUBJECT. "Helm of the Watchful" — Wonder · You are never surprised and cannot be Dazed. · Nothing comes at you from a side you were not already watching.

Draw armour as worn metal and strap, not as a costume.
```

### Hollow Bolt

File: `items/hollow-bolt.webp`

```text
SUBJECT. "Hollow Bolt" — Ammunition · Crossbow. Carries one potion; whatever you hit drinks it. · The shaft unscrews. A fiddly, brilliant, disreputable idea.

Draw a vessel, and whatever is in it is nearly gone.
```

### Hollow Boots

File: `items/hollow-boots.webp`

```text
SUBJECT. "Hollow Boots" — Wonder · They sound like a far larger man coming. · Shove an adjacent enemy 2 squares.

Draw an object behaving as though it were awake.
```

### Holy Symbol

File: `items/holy-symbol.webp`

```text
SUBJECT. "Holy Symbol" — Power · Whose, and how openly, is the only question that matters in Firma.

Draw an object with more inside it than its size allows.
```

### Hooked Gauntlet

File: `items/hooked-gauntlet.webp`

```text
SUBJECT. "Hooked Gauntlet" — Wonder · Three hooks along the knuckle, set the wrong way round. · An adjacent enemy is Disarmed (1), resist Might 5.

Draw an object behaving as though it were awake.
```

### Hourglass Charm

File: `items/hourglass-charm.webp`

```text
SUBJECT. "Hourglass Charm" — Wonder · The sand has not moved since you found it. · Swap your place in the initiative order with a willing ally.

Draw an object behaving as though it were awake.
```

### Hunting Traps

File: `items/hunting-traps.webp`

```text
SUBJECT. "Hunting Traps" — Tool · Jaws and a stake. Patience, mostly.

Draw a tool worn exactly where a hand goes and nowhere else.
```

### Kite Shield

File: `items/kite-shield.webp`

```text
SUBJECT. "Kite Shield" — Shield · Long enough to cover the leg a horseman cannot move.

Draw a shield, face on and slightly turned, its edge nicked from use.
```

### Lance

File: `items/lance.webp`

```text
SUBJECT. "Lance" — Weapon · A couched lance is a horse's weight arriving at one point. Needs the horse.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Lantern

File: `items/lantern.webp`

```text
SUBJECT. "Lantern" — Tool · Horn panes and a tallow dip. The squares it lights are not shadowed.

Draw a tool worn exactly where a hand goes and nowhere else.
```

### Leather Armor

File: `items/leather-armor.webp`

```text
SUBJECT. "Leather Armor" — Armor · Boiled and riveted, and it still smells of the tannery.

Draw armour as worn metal and strap, not as a costume.
```

### Light Helm

File: `items/light-helm.webp`

```text
SUBJECT. "Light Helm" — Armor · An open kettle. You can still hear and still see.

Draw armour as worn metal and strap, not as a costume.
```

### Locked Casket

File: `items/locked-casket.webp`

```text
SUBJECT. "Locked Casket" — Wonder · Holds one secret. Nobody but you may learn it, by any means. · No hinge, no seam, and a keyhole that is not for a key.

Draw an object behaving as though it were awake.
```

### Lockpicks

File: `items/lockpicks.webp`

```text
SUBJECT. "Lockpicks" — Tool · A roll of picks and a torsion wrench, in oiled cloth.

Draw a tool worn exactly where a hand goes and nowhere else.
```

### Longbow

File: `items/longbow.webp`

```text
SUBJECT. "Longbow" — Weapon · A yew stave taller than the archer. No reload -- that is what you are buying.

Draw weight: the object sits, and the surface under it knows; the weapon drawn and held at tension.
```

### Longsword

File: `items/longsword.webp`

```text
SUBJECT. "Longsword" — Weapon · A plain cruciform blade, kept sharp.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Loose Cobble

File: `items/loose-cobble.webp`

```text
SUBJECT. "Loose Cobble" — Wonder · Set it down. The first enemy to enter its square is Off-Balance (1). · It was part of a street once and has not forgiven anyone.

Draw an object behaving as though it were awake.
```

### Mace

File: `items/mace.webp`

```text
SUBJECT. "Mace" — Weapon · Flanged. It does not cut, which is the point against a man in mail.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Mail Shirt

File: `items/mail-shirt.webp`

```text
SUBJECT. "Mail Shirt" — Armor · Riveted rings to the hip. The soldier's compromise for eight hundred years.

Draw armour as worn metal and strap, not as a costume.
```

### Mantle of the Unburdened

File: `items/mantle-of-the-unburdened.webp`

```text
SUBJECT. "Mantle of the Unburdened" — Wonder · You are never Burdened or Overloaded, whatever you carry. · Everything you carry belongs to the cloak while you wear it.

Draw an object behaving as though it were awake.
```

### Marching Boots

File: `items/marching-boots.webp`

```text
SUBJECT. "Marching Boots" — Make · Difficult ground costs you 1 instead of 2. · Nailed soles. Rubble and mud stop being a decision.

Draw made well, by somebody who signed nothing.
```

### Marked Arrowhead

File: `items/marked-arrowhead.webp`

```text
SUBJECT. "Marked Arrowhead" — Wonder · It has not been fired. It does not need to be. · One enemy you can see is Marked (1).

Draw an object behaving as though it were awake.
```

### Masterwork Crossbow

File: `items/masterwork-crossbow.webp`

```text
SUBJECT. "Masterwork Crossbow" — Make · A steel prod and a goat's-foot lever. It reloads in the hand.

Draw the weapon drawn and held at tension.
```

### Matchlock Musket

File: `items/matchlock-musket.webp`

```text
SUBJECT. "Matchlock Musket" — Weapon · A rest to fire it from and a minute to load it. Worth both.

Draw weight: the object sits, and the surface under it knows; the weapon drawn and held at tension.
```

### Matchlock Pistol

File: `items/matchlock-pistol.webp`

```text
SUBJECT. "Matchlock Pistol" — Weapon · One hand, so it goes beside a sword. A brace of them is two shots before a reload.

Draw the weapon drawn and held at tension.
```

### Mnemonic Stone

File: `items/mnemonic-stone.webp`

```text
SUBJECT. "Mnemonic Stone" — Wonder · One extra skill card in your skill deck, of any approach you already have. · Worn smooth by a thumb that was trying to remember something.

Draw an object behaving as though it were awake.
```

### Moth-wing Fletching

File: `items/moth-wing-fletching.webp`

```text
SUBJECT. "Moth-wing Fletching" — Ammunition · Bow. This shot ignores cover entirely. · It does not fly straight. It arrives anyway.

Draw a vessel, and whatever is in it is nearly gone.
```

### Net

File: `items/net.webp`

```text
SUBJECT. "Net" — Weapon · Weighted at the edges. The other half of a trident.

Draw quickness: the object is balanced on almost nothing; an object mid-flight, the hand that threw it out of frame.
```

### Net Bolt

File: `items/net-bolt.webp`

```text
SUBJECT. "Net Bolt" — Ammunition · Crossbow. Grappled (1), resist Might 5. · A folded net on a blunt head. It opens in the air.

Draw a vessel, and whatever is in it is nearly gone.
```

### Oil of Mislaid Courage

File: `items/oil-of-mislaid-courage.webp`

```text
SUBJECT. "Oil of Mislaid Courage" — Potion · Whatever was going to make you flinch has been taken out.

Draw a vessel, and whatever is in it is nearly gone.
```

### Oil-wrapped Shaft

File: `items/oil-wrapped-shaft.webp`

```text
SUBJECT. "Oil-wrapped Shaft" — Ammunition · Bow or crossbow. Burning 1 (2). · Tow and pitch below the head. Lit from the match in your teeth.

Draw a vessel, and whatever is in it is nearly gone.
```

### Pact Iron

File: `items/pact-iron.webp`

```text
SUBJECT. "Pact Iron" — Wonder · Cold iron takes a debt and holds it for a while. · One Taint card is set aside for the rest of the fight.

Draw an object behaving as though it were awake.
```

### Philtre of Borrowed Courage

File: `items/philtre-of-borrowed-courage.webp`

```text
SUBJECT. "Philtre of Borrowed Courage" — Potion · Somebody else's nerve, and they are not getting it back.

Draw a vessel, and whatever is in it is nearly gone.
```

### Philtre of the Loose Tongue

File: `items/philtre-of-the-loose-tongue.webp`

```text
SUBJECT. "Philtre of the Loose Tongue" — Potion · You will mean to stop talking.

Draw a vessel, and whatever is in it is nearly gone.
```

### Pike

File: `items/pike.webp`

```text
SUBJECT. "Pike" — Weapon · Eighteen feet. Magnificent in a line and worthless on your own.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Pilgrim's Shoes

File: `items/pilgrims-shoes.webp`

```text
SUBJECT. "Pilgrim's Shoes" — Wonder · One extra rest token on every long rest. · Worn by somebody who got where they were going.

Draw an object behaving as though it were awake.
```

### Pilgrim's Token

File: `items/pilgrims-token.webp`

```text
SUBJECT. "Pilgrim's Token" — Power · Tin, stamped at a shrine. Worth nothing and proof of everything.

Draw an object with more inside it than its size allows.
```

### Plate

File: `items/plate.webp`

```text
SUBJECT. "Plate" — Armor · Blocks Sidestep reactions. · Half your carry allowance, and nothing short of a ball goes through it.

Draw armour as worn metal and strap, not as a costume; weight: the object sits, and the surface under it knows.
```

### Potion of Iron Skin

File: `items/potion-of-iron-skin.webp`

```text
SUBJECT. "Potion of Iron Skin" — Potion · It goes down like filings and sits there like a breastplate.

Draw a vessel, and whatever is in it is nearly gone.
```

### Potion of Stone

File: `items/potion-of-stone.webp`

```text
SUBJECT. "Potion of Stone" — Potion · Grit in the bottom of the flask, and it settles in you the same way.

Draw a vessel, and whatever is in it is nearly gone.
```

### Potion of the Bear

File: `items/potion-of-the-bear.webp`

```text
SUBJECT. "Potion of the Bear" — Potion · Thick as honey. You will want both hands to lift the bottle.

Draw a vessel, and whatever is in it is nearly gone.
```

### Potion of the Hare

File: `items/potion-of-the-hare.webp`

```text
SUBJECT. "Potion of the Hare" — Potion · It tastes of running, which is not a taste anyone can describe.

Draw a vessel, and whatever is in it is nearly gone.
```

### Potion of the Owl

File: `items/potion-of-the-owl.webp`

```text
SUBJECT. "Potion of the Owl" — Potion · Your eyes do not change. What they are willing to see does.

Draw a vessel, and whatever is in it is nearly gone.
```

### Potion of the Quick Hand

File: `items/potion-of-the-quick-hand.webp`

```text
SUBJECT. "Potion of the Quick Hand" — Potion · You will have put the bottle down before you remember drinking it.

Draw a vessel, and whatever is in it is nearly gone.
```

### Proofed Mail

File: `items/proofed-mail.webp`

```text
SUBJECT. "Proofed Mail" — Make · Tested against a bodkin at ten paces and dented, not pierced.

Draw armour as worn metal and strap, not as a costume.
```

### Quartermaster's Belt

File: `items/quartermasters-belt.webp`

```text
SUBJECT. "Quartermaster's Belt" — Wonder · Everything hangs lighter on it. Nobody knows why and nobody asks twice.

Draw an object behaving as though it were awake.
```

### Reaver's Edge

File: `items/reavers-edge.webp`

```text
SUBJECT. "Reaver's Edge" — Wonder · It eats what it meets, slowly, and starts with the armour.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Reliquary Band

File: `items/reliquary-band.webp`

```text
SUBJECT. "Reliquary Band" — Power · A splinter of someone's finger under glass.

Draw an object with more inside it than its size allows.
```

### Repair Kit

File: `items/repair-kit.webp`

```text
SUBJECT. "Repair Kit" — Tool · Files, rivets, pitch and wire. What acid leaves behind is work, not loss.

Draw a tool worn exactly where a hand goes and nowhere else.
```

### Ring of Open Hands

File: `items/ring-of-open-hands.webp`

```text
SUBJECT. "Ring of Open Hands" — Power · You may Cast without a free hand. · Almost the ring you were hoping for.

Draw an object with more inside it than its size allows.
```

### Ring of the Open Hand

File: `items/ring-of-the-open-hand.webp`

```text
SUBJECT. "Ring of the Open Hand" — Power · You may Cast without a free hand. · Plain silver, worn thin. The gesture is already in it.

Draw an object with more inside it than its size allows.
```

### Screaming Shaft

File: `items/screaming-shaft.webp`

```text
SUBJECT. "Screaming Shaft" — Ammunition · Bow. Dazed (1), resist Presence 5. · Bored through so the air goes through it wrong.

Draw a vessel, and whatever is in it is nearly gone.
```

### Serpent's Milk

File: `items/serpents-milk.webp`

```text
SUBJECT. "Serpent's Milk" — Poison · Apply with a Ready. Next Strike that hits: Poisoned 0 (3) -- no damage, three rounds without a secondary. · Milked, strained and kept cold...

Draw a vessel, and whatever is in it is nearly gone.
```

### Serpent's Tooth Ring

File: `items/serpents-tooth-ring.webp`

```text
SUBJECT. "Serpent's Tooth Ring" — Wonder · A fang set as a stone, still wet at the root. · One adjacent enemy is Poisoned 1 (2).

Draw an object behaving as though it were awake.
```

### Sessyfyn's Tear

File: `items/sessyfyns-tear.webp`

```text
SUBJECT. "Sessyfyn's Tear" — Relic · Obligation: a permanent Miss AND a permanent Critical in your fate deck. · Seawater that has not dried in four hundred years. · Any one fat...

Draw an object behaving as though it were awake.
```

### Shortbow

File: `items/shortbow.webp`

```text
SUBJECT. "Shortbow" — Weapon · Horn and sinew, strung short for close country.

Draw the weapon drawn and held at tension.
```

### Signet Ring

File: `items/signet-ring.webp`

```text
SUBJECT. "Signet Ring" — Station · A house, a seal, and somebody who will answer for you.

Draw a thing that says who somebody is before they speak.
```

### Silvered Head

File: `items/silvered-head.webp`

```text
SUBJECT. "Silvered Head" — Ammunition · Bow or crossbow. You may target an Invisible enemy you have seen this fight. · Silver remembers what it was aimed at.

Draw a vessel, and whatever is in it is nearly gone.
```

### Smith's Hammer

File: `items/smiths-hammer.webp`

```text
SUBJECT. "Smith's Hammer" — Make · A cross-pein and a sense of what metal wants.

Draw made well, by somebody who signed nothing.
```

### Smoke Bomb

File: `items/smoke-bomb.webp`

```text
SUBJECT. "Smoke Bomb" — Consumable · A waxed clay ball, heavier than it looks.

Draw a vessel, and whatever is in it is nearly gone.
```

### Spear

File: `items/spear.webp`

```text
SUBJECT. "Spear" — Weapon · The cheapest thing that keeps a man at arm's length.

Draw an edge, worn and sharpened back more than once; an object mid-flight, the hand that threw it out of frame.
```

### Staff of Healing

File: `items/staff-of-healing.webp`

```text
SUBJECT. "Staff of Healing" — Implement · Pale wood, warm to the touch.

Draw an object that is doing something while nobody holds it; an edge, worn and sharpened back more than once.
```

### Surgeon's Pin

File: `items/surgeons-pin.webp`

```text
SUBJECT. "Surgeon's Pin" — Wonder · Silver, and it has closed worse than this. · Remove one Wound from an ally.

Draw an object behaving as though it were awake.
```

### Surveyor's Chain

File: `items/surveyors-chain.webp`

```text
SUBJECT. "Surveyor's Chain" — Wonder · In a challenge, your first Progress each scene is free. · Sixty-six feet of brass links that measure what matters rather than what is there.

Draw an object behaving as though it were awake.
```

### The Black Lantern

File: `items/the-black-lantern.webp`

```text
SUBJECT. "The Black Lantern" — Relic · Every square within 3 is shadowed, your enemies' included. Obligation: you may never carry any other light. · It is lit. You can tell becau...

Draw an object behaving as though it were awake.
```

### The Hungry Blade

File: `items/the-hungry-blade.webp`

```text
SUBJECT. "The Hungry Blade" — Relic · Obligation: a bound Taint the first round of each fight it does not kill. · It is not sharp. It does not need to be sharp.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### The Kit

File: `items/the-kit.webp`

```text
SUBJECT. "The Kit" — Tool · A burglar's whole trade in a roll of canvas, and they never put it down.

Draw a tool worn exactly where a hand goes and nowhere else.
```

### The Pale Crown

File: `items/the-pale-crown.webp`

```text
SUBJECT. "The Pale Crown" — Relic · Obligation: you may never wear armour, and nobody but you may heal you. · Bone, and lighter than bone should be.

Draw an object behaving as though it were awake.
```

### The Quenched Blade

File: `items/the-quenched-blade.webp`

```text
SUBJECT. "The Quenched Blade" — Wonder · Quenched in something that is still angry about it.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### The Scrivener's Knife

File: `items/the-scriveners-knife.webp`

```text
SUBJECT. "The Scrivener's Knife" — Wonder · For cutting out what should not have been written. · Prune one card from your action deck for the rest of the day.

Draw an object behaving as though it were awake.
```

### The Unquiet Quiver

File: `items/the-unquiet-quiver.webp`

```text
SUBJECT. "The Unquiet Quiver" — Relic · Every piece of magical ammunition you fire returns to it when the fight ends. Obligation: it will not hold ordinary arrows, and you may car...

Draw an object behaving as though it were awake.
```

### Thunder-shot

File: `items/thunder-shot.webp`

```text
SUBJECT. "Thunder-shot" — Ammunition · Firearm only. The shot is Blast 1 on the target's square. · A paper cartridge of scrap. Nothing else gives a non-caster an area.

Draw a vessel, and whatever is in it is nearly gone.
```

### Thunderstone

File: `items/thunderstone.webp`

```text
SUBJECT. "Thunderstone" — Wonder · Throw it down hard. Do not be holding it. · One enemy within 3 is Stunned (1), resist Might 7.

Draw an object behaving as though it were awake.
```

### Tincture of the Clear Eye

File: `items/tincture-of-the-clear-eye.webp`

```text
SUBJECT. "Tincture of the Clear Eye" — Potion · Cloudy, and it stings going down.

Draw a vessel, and whatever is in it is nearly gone.
```

### Tinker's Thimble

File: `items/tinkers-thimble.webp`

```text
SUBJECT. "Tinker's Thimble" — Wonder · Strain costs you one card fewer, to a minimum of 1. · Brass, and far too small for whoever made it.

Draw an object behaving as though it were awake.
```

### Tower Shield

File: `items/tower-shield.webp`

```text
SUBJECT. "Tower Shield" — Shield · A wall for a man who has decided not to go anywhere.

Draw a shield, face on and slightly turned, its edge nicked from use; weight: the object sits, and the surface under it knows.
```

### Travelling Cloak

File: `items/travelling-cloak.webp`

```text
SUBJECT. "Travelling Cloak" — Station · Oiled wool. The difference between a wet night and an unbearable one.

Draw a thing that says who somebody is before they speak.
```

### Trident

File: `items/trident.webp`

```text
SUBJECT. "Trident" — Weapon · Arena work. The crowd likes the shape of it.

Draw an edge, worn and sharpened back more than once.
```

### Vagrant's Charm

File: `items/vagrants-charm.webp`

```text
SUBJECT. "Vagrant's Charm" — Wonder · You are never Exhausted. · A knot of road-dust and hair. Its owner never sat down.

Draw an object behaving as though it were awake.
```

### Warden's Seal

File: `items/wardens-seal.webp`

```text
SUBJECT. "Warden's Seal" — Power · A tower in relief, worn smooth by thumbs that are not yours.

Draw an object with more inside it than its size allows.
```

### Warhammer

File: `items/warhammer.webp`

```text
SUBJECT. "Warhammer" — Weapon · A beak on one side for the plate and a hammer on the other for the man in it.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.
```

### Weeping Resin

File: `items/weeping-resin.webp`

```text
SUBJECT. "Weeping Resin" — Poison · Apply with a Ready. Next Strike that hits: the target cannot be healed for 2 rounds. No save. · The wound will not close while it is in th...

Draw a vessel, and whatever is in it is nearly gone.
```

### Whetstone of the Last Edge

File: `items/whetstone-of-the-last-edge.webp`

```text
SUBJECT. "Whetstone of the Last Edge" — Wonder · It takes something back out of a blade that has given everything. · One Spent card returns to your discard.

Draw an object behaving as though it were awake.
```

### Whistling Shaft

File: `items/whistling-shaft.webp`

```text
SUBJECT. "Whistling Shaft" — Ammunition · Bow. The target is Compelled (1) -- at you. · Whoever it passes becomes very interested in who sent it.

Draw a vessel, and whatever is in it is nearly gone.
```

### Winter Cloak

File: `items/winter-cloak.webp`

```text
SUBJECT. "Winter Cloak" — Wonder · The hem is always a little frozen, in any season. · Everything adjacent to you is Slowed (1).

Draw an object behaving as though it were awake.
```

### Wooden Shield

File: `items/wooden-shield.webp`

```text
SUBJECT. "Wooden Shield" — Shield · Banded oak, scarred across the face.

Draw a shield, face on and slightly turned, its edge nicked from use.
```

## NPC gear

**6 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/items/npc/`.

A monster's kit -- cruder than a player's, made or scavenged rather than bought.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A monster's kit -- cruder than a player's, made or scavenged rather than bought.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Dark Lantern

File: `items/npc/dark-lantern.webp`

```text
SUBJECT. "Dark Lantern" — Focus

Draw a shuttered lantern with one slit open, throwing a single hard bar of light across a dark room and lighting nothing else at all.
```

### Goblin Fetish

File: `items/npc/goblin-fetish.webp`

```text
SUBJECT. "Goblin Fetish" — Focus

Draw a bundle of knotted hair, bone and string hung from a bent stick, turning slowly on its own with nobody within reach of it.
```

### Goblin Shield

File: `items/npc/goblin-shield.webp`

```text
SUBJECT. "Goblin Shield" — Shield

Draw a shield, face on and slightly turned, its edge nicked from use; grown rather than forged -- chitin, horn, tooth or claw, still part of a body.
```

### Goblin Shortbow

File: `items/npc/goblin-shortbow.webp`

```text
SUBJECT. "Goblin Shortbow" — Weapon

Draw the weapon drawn and held at tension.
```

### Goblin Spear

File: `items/npc/goblin-spear.webp`

```text
SUBJECT. "Goblin Spear" — Weapon

Draw an edge, worn and sharpened back more than once.
```

### Mole Pick

File: `items/npc/mole-pick.webp`

```text
SUBJECT. "Mole Pick" — Weapon

Draw an edge, worn and sharpened back more than once; grown rather than forged -- chitin, horn, tooth or claw, still part of a body.
```

## Natural weapons

**10 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/items/natural/`.

Grown rather than carried: a mandible, a sting, a tail club. It cannot be disarmed because it is part of a body, and the picture should make that obvious.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. Grown rather than carried: a mandible, a sting, a tail club. It cannot be disarmed because it is part of a body, and the picture should make that obvious.

FORMAT.
- Portrait, aspect ratio exactly 2:3, 1024 x 1536.
- Full bleed, edge to edge. No border, no frame, no card template, no rounded corners, no drop
  shadow, no mat, no margin.
- ABSOLUTELY NO TEXT of any kind: no letters, numerals, runes, glyphs, signature, watermark, or
  anything that reads as writing. Not on a shield, not on a banner, not in the background.

COMPOSITION. The card prints its own name and rules text over this image in opaque panels, so the
layout is fixed and has been measured:
- Crop in **close**: one subject, filling the frame from side to side.
  Never a whole figure standing in a landscape, never an object laid out on a table.
- **A strip of bare paper across the very top, about a tenth of the height.** No head, no helmet,
  no horns, no weapon, no hand, no banner enters it.
- **All of the dark lives between that strip and the halfway line.** The near-black contour, the
  deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
- Desaturated and earthy. Warm throughout, with no cool hue anywhere. No neon, no teal-and-orange.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.
```

</details>

### Acid Spray

File: `items/natural/acid-spray.webp`

```text
SUBJECT. "Acid Spray" — Natural

Draw a soft vent opened in a hide and spitting a thin fan of liquid, and the stone it has already crossed pitted and smoking.
```

### Claws

File: `items/natural/claws.webp`

```text
SUBJECT. "Claws" — Natural

Draw four hooked claws splayed at full reach, no two the same length, the tips worn pale where they have been dragged across stone.
```

### Fire Spray

File: `items/natural/fire-spray.webp`

```text
SUBJECT. "Fire Spray" — Natural

Draw a gout thrown wide from under a body, bright at the near edge and breaking into sparks at the far one, covering more ground than anything else in this set.
```

### Grasping Claws

File: `items/natural/grasping-claws.webp`

```text
SUBJECT. "Grasping Claws" — Natural

Draw a long jointed arm thrown out to full extension from a body mostly out of frame, the pincer at the end of it closing on air at the far limit of its reach.
```

### Heavy Mandibles

File: `items/natural/heavy-mandibles.webp`

```text
SUBJECT. "Heavy Mandibles" — Natural

Draw jaws as thick as forearms, chipped and blunt rather than sharp, closing slowly on something that has already stopped resisting.
```

### Mandibles

File: `items/natural/mandibles.webp`

```text
SUBJECT. "Mandibles" — Natural

Draw a pair of toothed jaws opened wide and scissoring sideways rather than biting down, the gap between them the darkest thing in the picture.
```

### Nip

File: `items/natural/nip.webp`

```text
SUBJECT. "Nip" — Natural

Draw a small mouth of needle teeth already closed on something and not letting go. The least dangerous weapon in the game: too small to kill anybody, close enough that the grip fills the frame.
```

### Sting

File: `items/natural/sting.webp`

```text
SUBJECT. "Sting" — Natural

Draw a segmented tail curled forward over its own back, the barb at the tip beaded and about to fall. One point, in focus, and the length behind it falling away into wash.
```

### Tail Club

File: `items/natural/tail-club.webp`

```text
SUBJECT. "Tail Club" — Natural

Draw a knot of fused bone at the end of a thick tail, caught at the top of its arc with the whole body wound up behind it. Nothing it lands on is going to be helped by armour.
```

### Tusks

File: `items/natural/tusks.webp`

```text
SUBJECT. "Tusks" — Natural

Draw two curved tusks worn smooth along their undersides by digging, swung upward from below with soil still coming off them.
```

## Creature tokens

**47 prompts.** **1:1, 1024 × 1024, transparent.** Files go under `cardrpg/art/tokens/`.

One picture per creature, used as both the sheet portrait and the map token.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single creature token for a virtual tabletop.

FORMAT.
- Square, aspect ratio exactly 1:1, 1024 x 1024.
- **The background must be fully transparent.** A token sits on a map, not in a frame, so any
  background is a square of the wrong colour around the creature.
- ABSOLUTELY NO TEXT, no base, no plinth, no ground shadow, no circular border or ring.

COMPOSITION.
- **The whole creature**, head to foot or nose to tail, filling the square edge to edge. Nothing
  is printed over a token, so there is no safe area.
- Seen from **above at a three-quarter angle**, consistently, as a figure on a table is seen by
  the people around it. Never a portrait, never a side elevation.
- The silhouette does the work: this will be looked at beside twenty other tokens at 60 pixels,
  and the only question that matters is *which creature is that*.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red, on the one feature that
  tells this creature from its neighbours.
- Warm, desaturated, earthy. No cyan, no magenta, no neon.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.

**And the paper is not there.** This style is wash on paper everywhere else in the set; here the
paper is the map underneath, so the brushwork stays and the ground does not. The creature's outer
edge is a brush edge -- ragged, varied, alive -- against full transparency, never a cut-out line
and never a white halo.
```

</details>

### Armored Slug

File: `tokens/armored-slug.webp`

```text
SUBJECT. "Armored Slug" — Health 16 · armour 4 · speed 1 · Acid Spray — slow, armoured, and it does not need to reach you

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Armored Slug Spitter

File: `tokens/armored-slug-spitter.webp`

```text
SUBJECT. "Armored Slug Spitter" — Health 12 · armour 3 · speed 2 · Acid Spray — thinner shell, longer reach of acid: it is here to ruin somebody's concentration

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Blind Worm

File: `tokens/blind-worm.webp`

```text
SUBJECT. "Blind Worm" — Health 14 · armour 2 · speed 3 · Heavy Mandibles — no sight and a sense for vibration: it finds whoever moved

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Blind Worm Elder

File: `tokens/blind-worm-elder.webp`

```text
SUBJECT. "Blind Worm Elder" — Health 24 · armour 3 · speed 3 · Heavy Mandibles — old enough to have learned that a held thing stops moving and stops being felt

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Burrower

File: `tokens/burrower.webp`

```text
SUBJECT. "Burrower" — Health 18 · armour 2 · speed 5 · Mandibles — worms, and the steeds of the mole men: it is how they arrive under you

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Burrower Brood Mother

File: `tokens/burrower-brood-mother.webp`

```text
SUBJECT. "Burrower Brood Mother" — Health 30 · armour 3 · speed 3 · Mandibles — it stopped being a steed when it started laying

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Doomfly

File: `tokens/doomfly.webp`

```text
SUBJECT. "Doomfly" — Health 12 · armour 1 · speed 7 · Nip — transport: it is how everything else arrived

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Five Legs

File: `tokens/five-legs.webp`

```text
SUBJECT. "Five Legs" — Health 15 · armour 2 · speed 4 · Claws — lieutenants, fairly intelligent: it spends its turn on somebody else's

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Five Legs Adjutant

File: `tokens/five-legs-adjutant.webp`

```text
SUBJECT. "Five Legs Adjutant" — Health 12 · armour 2 · speed 4 · Claws — it does not fight at all: it calls the next wave

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Flat Bug

File: `tokens/flat-bug.webp`

```text
SUBJECT. "Flat Bug" — Health 5 · armour 1 · speed 3 · Mandibles — the Horde's main infantry: a goblin with a shell and no fear

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Flat Bug Runner

File: `tokens/flat-bug-runner.webp`

```text
SUBJECT. "Flat Bug Runner" — Health 4 · speed 5 · Mandibles — sent ahead to find out where you are, and dies finding out

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Flat Bug Shieldline

File: `tokens/flat-bug-shieldline.webp`

```text
SUBJECT. "Flat Bug Shieldline" — Health 7 · armour 2 · speed 2 · Mandibles — the front rank, which is where the Horde's armour actually is

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Goblin

File: `tokens/goblin.webp`

```text
SUBJECT. "Goblin" — Health 5 · speed 3 · Goblin Spear

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Goblin Archer

File: `tokens/goblin-archer.webp`

```text
SUBJECT. "Goblin Archer" — Health 5 · speed 3 · Goblin Shortbow — it earns Loose by being able to shoot, which the spearman cannot

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Goblin Chief

File: `tokens/goblin-chief.webp`

```text
SUBJECT. "Goblin Chief" — Health 11 · armour 1 · speed 3 · Goblin Spear, Goblin Shield — kill it and the Cower comes back to everybody else

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Goblin Shaman

File: `tokens/goblin-shaman.webp`

```text
SUBJECT. "Goblin Shaman" — Health 6 · speed 2 · Goblin Fetish — the elves taught it enough glamour to be dangerous and not enough to be free

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Goblin Warrior

File: `tokens/goblin-warrior.webp`

```text
SUBJECT. "Goblin Warrior" — Health 8 · armour 1 · speed 3 · Goblin Spear, Goblin Shield — the one that does not run: a shield, a shell of discipline, and no Cower

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mantiss

File: `tokens/mantiss.webp`

```text
SUBJECT. "Mantiss" — Health 12 · armour 2 · speed 4 · Grasping Claws — sergeants: the first thing in the Horde that gives an order

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mantiss Veteran

File: `tokens/mantiss-veteran.webp`

```text
SUBJECT. "Mantiss Veteran" — Health 18 · armour 3 · speed 4 · Grasping Claws — it has done this before and takes you out of the fight first

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mega Beetle

File: `tokens/mega-beetle.webp`

```text
SUBJECT. "Mega Beetle" — Health 30 · armour 4 · speed 2 · Heavy Mandibles — a wall that walks: the Scrips under its wings are the point of it

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mole Beast

File: `tokens/mole-beast.webp`

```text
SUBJECT. "Mole Beast" — Health 22 · armour 2 · speed 3 · Tusks — it comes up underneath, which is what Go Under is for

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mole Beast Tusker

File: `tokens/mole-beast-tusker.webp`

```text
SUBJECT. "Mole Beast Tusker" — Health 30 · armour 3 · speed 3 · Tusks — the one the mole men dig behind

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mole Man

File: `tokens/mole-man.webp`

```text
SUBJECT. "Mole Man" — Health 8 · armour 1 · speed 3 · Mole Pick — followers of the Queen of the Dark, and the only burrower that carries a tool

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mole Man Digger

File: `tokens/mole-man-digger.webp`

```text
SUBJECT. "Mole Man Digger" — Health 8 · armour 1 · speed 3 · Mole Pick — it is not fighting you, it is getting through the floor you are standing on

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mole Man Priest

File: `tokens/mole-man-priest.webp`

```text
SUBJECT. "Mole Man Priest" — Health 10 · armour 1 · speed 2 · Dark Lantern — the Queen of the Dark grants to those who go deep enough, and it has

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Pincer

File: `tokens/pincer.webp`

```text
SUBJECT. "Pincer" — Health 25 · armour 3 · speed 4 · Grasping Claws — generals, intelligent, armoured: it takes somebody out of the fight rather than down

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Pincer Marshal

File: `tokens/pincer-marshal.webp`

```text
SUBJECT. "Pincer Marshal" — Health 35 · armour 4 · speed 4 · Grasping Claws — a general who can call for more is the fight not ending

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Processor

File: `tokens/processor.webp`

```text
SUBJECT. "Processor" — Health 4 · armour 1 · speed 3 · Nip — workers: they build, and they are what a scene looks like before the fight

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Processor Driller

File: `tokens/processor-driller.webp`

```text
SUBJECT. "Processor Driller" — Health 6 · armour 1 · speed 3 · Mandibles — what the Horde uses instead of a siege engine, and the reason walls fall from below

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Rush Spider

File: `tokens/rush-spider.webp`

```text
SUBJECT. "Rush Spider" — Health 10 · armour 1 · speed 8 · Mandibles — cavalry: it arrives before you have finished deciding

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Rush Spider Rider

File: `tokens/rush-spider-rider.webp`

```text
SUBJECT. "Rush Spider Rider" — Health 14 · armour 1 · speed 8 · Mandibles — carrying a Mole Man, which is two statblocks arriving as one problem

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Scrip

File: `tokens/scrip.webp`

```text
SUBJECT. "Scrip" — Health 2 · speed 6 · Nip — eyes and ears, and harmless: the question is whether you spend a turn on one

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Scrip Watcher

File: `tokens/scrip-watcher.webp`

```text
SUBJECT. "Scrip Watcher" — Health 2 · speed 7 · Nip — the one that is still watching after you killed the others

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Skaah

File: `tokens/skaah.webp`

```text
SUBJECT. "Skaah" — Health 40 · armour 2 · speed 4 · Nip — a drop ship: balloon-like, gigantic, and full of something worse

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Skaah Bloated

File: `tokens/skaah-bloated.webp`

```text
SUBJECT. "Skaah Bloated" — Health 60 · armour 1 · speed 3 · Acid Spray — full, low and leaking: it is going to come down somewhere

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Slitherer

File: `tokens/slitherer.webp`

```text
SUBJECT. "Slitherer" — Health 7 · armour 1 · speed 4 · Mandibles — silent and venomous: the two words the world gives it, and both are mechanical

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Slitherer Brood

File: `tokens/slitherer-brood.webp`

```text
SUBJECT. "Slitherer Brood" — Health 4 · armour 1 · speed 5 · Mandibles — smaller, and there are always more of them than you counted

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Smash Beetle

File: `tokens/smash-beetle.webp`

```text
SUBJECT. "Smash Beetle" — Health 20 · armour 3 · speed 2 · Tail Club — it is here for the wall, and you are in the way of the wall

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Smash Beetle Breaker

File: `tokens/smash-beetle-breaker.webp`

```text
SUBJECT. "Smash Beetle Breaker" — Health 28 · armour 4 · speed 1 · Tail Club — bred bigger for the gates of the Third Ring, and it does not turn quickly

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Stinger

File: `tokens/stinger.webp`

```text
SUBJECT. "Stinger" — Health 6 · speed 6 · Sting — it goes for whoever is concentrating

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Stinger Drone

File: `tokens/stinger-drone.webp`

```text
SUBJECT. "Stinger Drone" — Health 10 · speed 6 · Acid Spray — the sting became a nozzle somewhere in the hive's history

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Sweeper

File: `tokens/sweeper.webp`

```text
SUBJECT. "Sweeper" — Health 8 · armour 1 · speed 7 · Claws — the air force: four wings and a dive

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Sweeper Carrier

File: `tokens/sweeper-carrier.webp`

```text
SUBJECT. "Sweeper Carrier" — Health 12 · armour 1 · speed 6 · Nip — it is carrying something, and the something is the encounter

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Sweeper Diver

File: `tokens/sweeper-diver.webp`

```text
SUBJECT. "Sweeper Diver" — Health 6 · armour 1 · speed 9 · Claws — it comes down on whoever is concentrating

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Terror Fly

File: `tokens/terror-fly.webp`

```text
SUBJECT. "Terror Fly" — Health 18 · armour 2 · speed 6 · Fire Spray — captains, and the first thing in the roster that burns ground

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Terror Fly Torch

File: `tokens/terror-fly-torch.webp`

```text
SUBJECT. "Terror Fly Torch" — Health 14 · armour 2 · speed 6 · Fire Spray — all the fire and none of the authority

The whole creature, three-quarter from above, filling the square on full transparency.
```

### The Queen

File: `tokens/the-queen.webp`

```text
SUBJECT. "The Queen" — Health 60 · armour 4 · speed 0 · Heavy Mandibles — unique, rooted, and the only thing here that cannot walk: she spends every turn on the army instead

The whole creature, three-quarter from above, filling the square on full transparency.
```

## The starter Warrior

**1 prompt.** **1:1, 1024 × 1024, transparent.** Files go under `cardrpg/art/tokens/`.

One picture per creature, used as both the sheet portrait and the map token.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single creature token for a virtual tabletop.

FORMAT.
- Square, aspect ratio exactly 1:1, 1024 x 1024.
- **The background must be fully transparent.** A token sits on a map, not in a frame, so any
  background is a square of the wrong colour around the creature.
- ABSOLUTELY NO TEXT, no base, no plinth, no ground shadow, no circular border or ring.

COMPOSITION.
- **The whole creature**, head to foot or nose to tail, filling the square edge to edge. Nothing
  is printed over a token, so there is no safe area.
- Seen from **above at a three-quarter angle**, consistently, as a figure on a table is seen by
  the people around it. Never a portrait, never a side elevation.
- The silhouette does the work: this will be looked at beside twenty other tokens at 60 pixels,
  and the only question that matters is *which creature is that*.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red, on the one feature that
  tells this creature from its neighbours.
- Warm, desaturated, earthy. No cyan, no magenta, no neon.

STYLE.
Brush and ink wash on rough rag paper. A confident, almost-black contour laid in
with a loaded brush; then large soft washes for the mass; then generous untouched paper where the
light falls. Loose and economical -- a few strokes doing the work of many. Visible bleed and
granulation where a wash pools, dry-brush where it runs out.

Three things this style does wrong at card size, and must not do here:
- **Never neutral grey.** Every wash is warm: sepia, bistre, burnt earth. If a passage reads as
  grey it is wrong.
- **Never soft all over.** The contour is near-black #1b1714 and holds a hard edge. Only the
  washes are soft. A picture with no true black in it has failed.
- **Never evenly toned.** The darkest mass must sit directly against untouched paper, so the
  subject separates from the ground in one glance at thumbnail size.

Use the full range, both ends of it:
- The lightest passage is **bare #f4efe6 paper, near white**, and there is a lot of it.
- The darkest line is **near-black #1b1714**, and the two touch each other somewhere.
- A picture whose every value sits between those ends is the failure above, however warm and
  however well drawn. Mid tone is the background, not the picture.

**And the paper is not there.** This style is wash on paper everywhere else in the set; here the
paper is the map underneath, so the brushwork stays and the ground does not. The creature's outer
edge is a brush edge -- ragged, varied, alive -- against full transparency, never a cut-out line
and never a white halo.
```

</details>

### Starter Warrior

File: `tokens/starter-warrior.webp`

```text
SUBJECT. "Starter Warrior" — Health 12 · Longsword, Wooden Shield, Leather Armor, Healing Potion

The whole creature, three-quarter from above, filling the square on full transparency.
```

## Where prompts still repeat

**198 prompts in 28 clusters** share a direction with another piece. That is a motif table working as designed — it is what makes every Strike card read as a Strike — right up until it flattens two cards that mean different things.

**13 of those clusters are the ones that bite**, listed first: the ones where the subject line carries no prose either, so neither half of the prompt tells the cards apart. The rest share a direction over subjects that already differ — forty-three consumables drawing a nearly-empty vessel still come back as forty-three different pictures, because each subject names its own.

Answer a cluster by adding its keys to `DIRECTION` in `test/art-prompts.mjs` and regenerating. The row shrinks or disappears when it is done.

| Pieces | Bare | They share | Keys |
|---|---|---|---|
| **43** | 5 | a vessel, and whatever is in it is nearly gone | `items/antidote` `items/assassins-tincture` `items/black-lotus` `items/blade-venom` `items/blunt-head` …+38 |
| **6** | 3 | ground covered -- weight forward, the last footfall still behind | `cards/starter/advance` `cards/shade/light-feet` `cards/strength/armoured-advance` `cards/way/roll-with-it` `cards/wild/blink` …+1 |
| **41** | 2 | an object behaving as though it were awake | `items/accusers-ring` `items/amulet-of-the-fed-thread` `items/amulet-of-the-mended-thread` `items/beggars-bowl` `items/boots-of-the-long-step` …+36 |
| **8** | 2 | an object with more inside it than its size allows | `features/arcane-focus` `items/focus-pendant` `items/holy-symbol` `items/pilgrims-token` `items/reliquary-band` …+3 |
| **7** | 2 | a tool worn exactly where a hand goes and nowhere else | `items/climbing-rope` `items/healers-kit` `items/hunting-traps` `items/lantern` `items/lockpicks` …+2 |
| **5** | 2 | the weapon drawn and held at tension | `items/crossbow` `items/masterwork-crossbow` `items/matchlock-pistol` `items/shortbow` `items/npc/goblin-shortbow` |
| **3** | 2 | pulled toward something against the will | `cards/starter/taunt` `cards/strength/roar` `signatures/strength/play-to-the-crowd` |
| **3** | 2 | an edge, worn and sharpened back more than once | `items/arming-sword` `items/trident` `items/npc/goblin-spear` |
| **3** | 2 | a vessel, and whatever is in it is nearly gone; an object mid-flight, the hand that threw it out of frame | `items/firepot` `items/flask-of-ink` `items/flask-of-oil` |
| **2** | 2 | the instant a blow lands, the weapon already through -- never wound up, never posing; then the weaker follow-up, off the hand that was not busy | `cards/common/off-hand-blow` `cards/strength/pull-them-down` |
| **2** | 2 | the instant a blow lands, the weapon already through -- never wound up, never posing; ground covered -- weight forward, the last footfall still behind | `cards/common/press` `cards/shade/cut-and-run` |
| **2** | 2 | sight swimming | `cards/shade/mock` `cards/wild/backlash` |
| **2** | 2 | only the shape the air makes | `cards/shade/vanish` `cards/wild/veil` |
| **9** | 1 | the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem | `cards/skill/break-it` `cards/wild/glare` `signatures/shade/one-trick` `signatures/shade/the-kit` `signatures/shade/the-opening` …+4 |
| **7** | 1 | an object that means nothing except in trained hands | `features/good-aim` `features/good-name` `features/hard-hands` `features/light-step` `features/quick-eye` …+2 |
| **6** | 1 | the instant a blow lands, the weapon already through -- never wound up, never posing | `cards/starter/strike` `cards/strength/shield-bash` `signatures/shade/double-or-nothing` `signatures/shade/lift` `signatures/shade/one-opening` …+1 |
| **4** | 1 | a thing that says who somebody is before they speak | `items/fine-clothes` `items/gaming-set` `items/signet-ring` `items/travelling-cloak` |
| **2** | 1 | ground covered -- weight forward, the last footfall still behind; the instant a blow lands, the weapon already through -- never wound up, never posing | `cards/starter/lunge` `signatures/strength/the-lance` |
| **2** | 1 | the instant a blow lands, the weapon already through -- never wound up, never posing; singled out of a crowd | `cards/shade/call-the-shot` `signatures/shade/named` |
| **2** | 1 | held, and not letting go | `cards/strength/overbear` `signatures/strength/get-a-grip` |
| **13** | — | weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once | `items/blade-of-the-eager-hand` `items/fine-longsword` `items/great-axe` `items/greatsword` `items/halberd` …+8 |
| **6** | — |  | `backs/action` `backs/fate` `backs/skill` `backs/twist` `backs/wild` …+1 |
| **6** | — | armour as worn metal and strap, not as a costume | `items/gauntlet-of-the-open-palm` `items/helm-of-the-watchful` `items/leather-armor` `items/light-helm` `items/mail-shirt` …+1 |
| **4** | — | weight: the object sits, and the surface under it knows; the weapon drawn and held at tension | `items/arquebus` `items/heavy-crossbow` `items/longbow` `items/matchlock-musket` |
| **3** | — | armour as worn metal and strap, not as a costume; weight: the object sits, and the surface under it knows | `items/brigandine` `items/great-helm` `items/plate` |
| **3** | — | a shield, face on and slightly turned, its edge nicked from use | `items/buckler` `items/kite-shield` `items/wooden-shield` |
| **2** | — | an object that is doing something while nobody holds it | `items/discriminating-wand` `items/fire-wand` |
| **2** | — | made well, by somebody who signed nothing | `items/marching-boots` `items/smiths-hammer` |

