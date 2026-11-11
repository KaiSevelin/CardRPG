# Art prompts

**643 prompts**, one per piece in [the art list](art-list.md), in the style the six-flavour test picked: **brush and ink wash**. Generated from the game's own content by `cardrpg/test/art-prompts.mjs` — regenerate it rather than editing it.

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

**Draw these first.** 11 pictures against 632 faces, and they are what a table looks at all evening, since a deck is face down from the first second of play.

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

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

#### The fate deck

File: `backs/fate.webp`

```text
SUBJECT. A deck back for **The fate deck**. The back players see most: it is shuffled and face down by design, and that is what makes a thin deck a risk rather than a lookup. Twenty cards, drawn from constantly.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

#### The ritual twist deck

File: `backs/ritual.webp`

```text
SUBJECT. A deck back for **The ritual twist deck**. Drawn when a ritual goes wrong, and a ritual is days of work on something that does not want to be undone. Where the twist back is a fork branching outward, this is a line that has been drawn back on itself: a single stroke that leaves the bottom edge, rises, and returns to the same edge a little to one side -- a loop that does not close, with open paper inside it and around it. The subject is that it comes BACK. No knot, no spiral, no star, no candle, no circle of runes and nothing that could be read as a summoning diagram; the price of a ritual is never a monster arriving. One stroke, and the gap where it fails to close is the whole of it.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

#### The skill deck

File: `backs/skill.webp`

```text
SUBJECT. A deck back for **The skill deck**. What you do when you are NOT fighting: climbing, listening, lifting, picking a lock, talking someone round. **No weapon of any kind on this one** -- no blade, no point, no hilt, no arrowhead. A hand, a key, an eye, a knot, a lens: the tools of a scene. It has to read as clearly NOT the action deck at a glance, since both are face down in front of the same player.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

#### The item deck

File: `backs/item.webp`

```text
SUBJECT. A deck back for **The item deck**. Your gear, face down. **A strap through a plain square buckle, seen flat and from the front**, the tongue centred and the strap running off both top and bottom edges. A buckle is the one thing every carried object in this game has in common and it is bilaterally symmetrical by construction. **No weapon, no blade, no pack, no pile of loot** -- one fastening, drawn large, with bare paper either side of it.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

#### The feature deck

File: `backs/feature.webp`

```text
SUBJECT. A deck back for **The feature deck**. What is permanently true about you. **A keystone at the top of a shallow arch**: the wedge-shaped stone dead centre, two or three voussoirs falling away to left and right, and nothing above it. A feature is always on and load-bearing, and a keystone is the stone that holds the rest up while doing nothing at all. **Not a laurel, not a crest, not a shield shape** -- masonry, with the joints drawn.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

#### The condition deck

File: `backs/condition.webp`

```text
SUBJECT. A deck back for **The condition deck**. What has been put on you, and what will wear off. **A plain open iron band -- a collar or a manacle -- hinged at the bottom centre and standing open**, the two halves rising symmetrically and not quite meeting at the top. Open, because a condition ends. **No chain, no lock, no key, no wrist and no neck in it** -- the band alone, and the gap at the top is the subject.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

#### The spell deck

File: `backs/spell.webp`

```text
SUBJECT. A deck back for **The spell deck**. A caster's book, and the few pages of it ready today. **A closed book seen square from the fore-edge, spine away, so the picture is the page block itself** -- the stacked edges of the leaves drawn as fine horizontal lines, with three ribbon markers hanging from the middle of the block, the centre one longest. Symmetrical about the middle ribbon. **No cover decoration, no clasp, no strap, no buckle** (that is the item deck's device), and **no star, no pentagram, no rune, no candle and no hand** -- paper, thread and nothing else, with bare paper either side of the block.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

#### The twist deck

File: `backs/twist.webp`

```text
SUBJECT. A deck back for **The twist deck**. The GM's deck, and the only one on their side of the table. Drawn when something goes partly wrong, so the back is a promise of a complication rather than a threat: **a fork** -- one line arriving and leaving as two, mirrored left to right, with open paper around it. No knot, no spiral, no coil: nothing that fills its own space or turns rather than mirrors. Not a weapon and not a monster -- the price of a Partial is never an attack.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

#### The Wild Magic deck

File: `backs/wild.webp`

```text
SUBJECT. A deck back for **The Wild Magic deck**. Drawn only when a Wild comes out of a fate deck, so its back is a promise that something strange is about to happen.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

#### Intent, any creature

File: `backs/npc.webp`

```text
SUBJECT. A deck back for **Intent, any creature**. The back on every creature's intent deck in the game. A face-down intent says *this thing is about to act*, and which thing it is is already on the table in front of you -- so the back carries the threat rather than the species.

A design rather than a scene: one central device, near-symmetrical, legible upside down, and unmistakable beside the other 10 in this set.
```

## The starter Warrior's deck

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of East Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Draw Steel

File: `cards/starter/draw-steel.webp`

```text
SUBJECT. "Draw Steel" — Strike · / Ready

Draw a blade coming free of the scabbard already moving forward: the draw and the cut are one motion, and the empty scabbard is still swinging from it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Northwest European appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Heavy Swing

File: `cards/starter/heavy-swing.webp`

```text
SUBJECT. "Heavy Swing" — Strike +1 ignores 2 armor · / Move 1

Draw a swing with everything behind it, caught at the bottom of its arc -- the committed blow of somebody who decided before they moved.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of East Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Lunge

File: `cards/starter/lunge.webp`

```text
SUBJECT. "Lunge" — Move 2, Strike · / Move 1

Draw ground covered -- weight forward, the last footfall still behind; the instant a blow lands, the weapon already through -- never wound up, never posing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of North African appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Quick Hands

File: `cards/starter/quick-hands.webp`

```text
SUBJECT. "Quick Hands" — Use · / Ready

Draw a hand working an object, the object mid-use rather than held up to be seen; a weapon coming to hand, caught between carried and held.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Central Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Second Wind

File: `cards/starter/second-wind.webp`

```text
SUBJECT. "Second Wind" — Heal 2 · / Use

Draw a fighter back on their feet and finding the next breath -- chest working, head coming up, the moment the body agrees to keep going.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of South Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Shield Up

File: `cards/starter/shield-up.webp`

```text
SUBJECT. "Shield Up" — Defend Block applies to every attack until your next turn · / Move 1

Draw a shield brought fully up and settled, the body behind it made small. This is cover meant to last a while rather than a parry -- nothing in the frame is moving.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Slavic appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Strike

File: `cards/starter/strike.webp`

```text
SUBJECT. "Strike" — Strike · / Move 1

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Slavic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Taunt

File: `cards/starter/taunt.webp`

```text
SUBJECT. "Taunt" — Compelled (1) · / Move 1

Draw pulled toward something against the will.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Central Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Weapon Swap

File: `cards/starter/weapon-swap.webp`

```text
SUBJECT. "Weapon Swap" — Ready · / Strike

Draw one weapon let go and falling while the other hand closes on the next. Both are in frame and neither is being held.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Central Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

## The starter Shade's deck

**10 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/shade-starter/`.



<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. 

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

### Bind the Wound

File: `cards/shade-starter/bind-the-wound.webp`

```text
SUBJECT. "Bind the Wound" — Heal 2 · / Use

Draw a strip of torn linen trailing from a closed fist, knotted once and pulled tight, the far end running out of frame. The cloth and the knot are the whole subject: no body, no limb, no wound and no blood anywhere in the picture.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Levantine appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Draw the Knife

File: `cards/shade-starter/draw-the-knife.webp`

```text
SUBJECT. "Draw the Knife" — Strike · / Ready

Draw a knife coming clear of a sleeve, the cuff still falling back from the wrist. One hand, one blade, and the motion is the draw.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Persian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Jeer

File: `cards/shade-starter/jeer.webp`

```text
SUBJECT. "Jeer" — Dazed (1) · / Move 1

Draw sight swimming.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Mediterranean appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Knife Work

File: `cards/shade-starter/knife-work.webp`

```text
SUBJECT. "Knife Work" — Strike · / Move 1

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Caribbean appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Light Fingers

File: `cards/shade-starter/light-fingers.webp`

```text
SUBJECT. "Light Fingers" — Use · / Ready

Draw a hand working an object, the object mid-use rather than held up to be seen; a weapon coming to hand, caught between carried and held.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of West African appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Off Hand

File: `cards/shade-starter/off-hand.webp`

```text
SUBJECT. "Off Hand" — Ready · / Strike

Draw the second blade already working, held low and reversed in the weaker hand, the blade and the knuckles filling the middle of the frame and the wrist leaving at the bottom edge. Nothing above the hand: no head, no shoulder and no second arm in the picture.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Southeast Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Open Vein

File: `cards/shade-starter/open-vein.webp`

```text
SUBJECT. "Open Vein" — Strike +1 · / Move 1

Draw the blow landing, the one that found its moment, a short blade, held close and low.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of East Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Quick Step

File: `cards/shade-starter/quick-step.webp`

```text
SUBJECT. "Quick Step" — Move 3 · / Move 2

Draw ground covered -- weight forward, the last footfall still behind.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of East Asian appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Shed the Blow

File: `cards/shade-starter/shed-the-blow.webp`

```text
SUBJECT. "Shed the Blow" — Block 2 · / Move 2

Draw a blow stopped flat, its force going sideways.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Nordic appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Slip In

File: `cards/shade-starter/slip-in.webp`

```text
SUBJECT. "Slip In" — Move 2, Strike · / Move 1

Draw ground covered -- weight forward, the last footfall still behind; the instant a blow lands, the weapon already through -- never wound up, never posing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Levantine appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Southeast Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Dig In

File: `cards/common/dig-in.webp`

```text
SUBJECT. "Dig In" — Heal 2 · / Move 1

Draw somebody going to ground instead of forward: down on one knee behind whatever cover there is, a hand pressed hard against a wound, breath coming back. The recovery is in refusing to advance, so nothing in the frame is moving.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of South Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Hold the Line

File: `cards/common/hold-the-line.webp`

```text
SUBJECT. "Hold the Line" — Defend · / Strike -1

Draw boots planted on ground that is not being given up, guard high and the weapon still working. The subject is the line under the feet, not the shield above them.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Persian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Measure

File: `cards/common/measure.webp`

```text
SUBJECT. "Measure" — Strike +1 ignores Block · / Move 1

Draw a blow placed exactly, the point going into a gap the width of a hand. Precision rather than force, and the opposite of a heavy swing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of South Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Off-Hand Blow

File: `cards/common/off-hand-blow.webp`

```text
SUBJECT. "Off-Hand Blow" — Strike · / Strike -1

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; then the weaker follow-up, off the hand that was not busy.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Central Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Press

File: `cards/common/press.webp`

```text
SUBJECT. "Press" — Strike, Move 1 · / Move 2

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; ground covered -- weight forward, the last footfall still behind.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Levantine appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

## NPC intent cards

**43 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/npc/`.

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
  rather than as anatomy. One limb or one edge entering frame beats a whole creature every time --
  **entering from a side or from below, never from the top.** The strip of bare paper across the
  top of the picture is the one edge nothing crosses, the actor included.
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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- the point of contact, the place the ground is marked, the gap where the distance went -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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
THE CREATURE, FROM THE BESTIARY: a single worker, unarmoured and unarmed, built for carrying rather than fighting: a low six-legged body with the front pair held up and loaded, mouthparts busy. Caught mid-task and not looking up -- and -- what the Horde uses instead of a siege engine, and the reason walls fall from below. That is what it is; the last line is what it is doing.
COMPOSE IT AS THE EXCEPTION. The other cards on this shelf are a fragment of a scene with open paper around it, because one picture has to serve every creature. This one does not: let the subject FILL the frame, close enough that the eye has nowhere else to go. It should be the card in a hand of eight that does not look like the other seven, from arm's length and before it is read.
FILLING THE FRAME IS NOT THE SAME AS SPREADING THE INK. Crowd the LEFT AND RIGHT edges with the subject -- never the top. Put the WEIGHT of the drawing -- the true blacks, the modelled detail, the part that reads from arm's length -- in the upper middle, and carry the lower half in light tone. A subject that runs from the top edge to the bottom one fills the frame and fails the card: the top is behind the name and the bottom is behind the rules text.
THE TOP QUARTER OF THE PICTURE IS EMPTY PAPER. Not a thin margin -- a quarter. Nothing crosses into it: no horn, no raised limb, no wing tip, no spray. Whatever is tallest in the subject BEGINS below that quarter, because the card prints its own name across the top and anything up there is printed over.

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

Draw a hand that has stopped obeying: one small puncture at the knuckle, a dark line already past the wrist and climbing, the fingers curling on their own. The wound is nothing -- what is spreading out of it is the whole picture.
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

### Find the Joint

File: `cards/npc/find-the-joint.webp`

```text
SUBJECT. "Find the Joint" — Strike ignores 2 armor · Strike where the harness is buckled rather than where it is thickest: ignores 2 armour.

Draw a buckle and its strap, taken hold of from outside the frame -- the plate it closes still whole and now beside the point.
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
THE CREATURE, FROM THE BESTIARY: a drop ship: balloon-like, gigantic, and full of something worse -- and -- full, low and leaking: it is going to come down somewhere. That is what it is; the last line is what it is doing.
COMPOSE IT AS THE EXCEPTION. The other cards on this shelf are a fragment of a scene with open paper around it, because one picture has to serve every creature. This one does not: let the subject FILL the frame, close enough that the eye has nowhere else to go. It should be the card in a hand of eight that does not look like the other seven, from arm's length and before it is read.
FILLING THE FRAME IS NOT THE SAME AS SPREADING THE INK. Crowd the LEFT AND RIGHT edges with the subject -- never the top. Put the WEIGHT of the drawing -- the true blacks, the modelled detail, the part that reads from arm's length -- in the upper middle, and carry the lower half in light tone. A subject that runs from the top edge to the bottom one fills the frame and fails the card: the top is behind the name and the bottom is behind the rules text.
THE TOP QUARTER OF THE PICTURE IS EMPTY PAPER. Not a thin margin -- a quarter. Nothing crosses into it: no horn, no raised limb, no wing tip, no spray. Whatever is tallest in the subject BEGINS below that quarter, because the card prints its own name across the top and anything up there is printed over.

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

### Prise It Open

File: `cards/npc/prise-it-open.webp`

```text
SUBJECT. "Prise It Open" — Strike Exposed (1) · Get into the harness and lever. Exposed: their armour counts 0 for a turn.

Draw a breastplate levered away from the body beneath it, the strap gone and the gap held open by something that does not belong in it.
```

### Rattle

File: `cards/npc/rattle.webp`

```text
SUBJECT. "Rattle" — Strike · Strike, and the target discards one card out of their hand — their choice.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.
```

### Round the Guard

File: `cards/npc/round-the-guard.webp`

```text
SUBJECT. "Round the Guard" — Strike ignores Block · Strike before the shield comes across. Block does not answer this.

Draw a shield still coming across and already too late, the gap between its edge and the body closing on nothing.
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

### Take the Legs

File: `cards/npc/take-the-legs.webp`

```text
SUBJECT. "Take the Legs" — Move, Strike Off Balance (1) · Move and Strike low; on a hit the target is Off Balance.

Draw a foot taken out from under, the weight already past the point of recovery and the shield swinging wide of everything.
```

### The Hive Obeys

File: `cards/npc/the-hive-obeys.webp`

```text
SUBJECT. "The Hive Obeys" — Three allies within sight each move their speed, or one of them acts twice. She does nothing herself but decide.

THIS CARD IS THE EXCEPTION. Only The Queen ever draws it, so draw that creature: the capsule's rules about species, anatomy and scale do not apply here, and this picture should be unmistakably of one thing.
THE CREATURE, FROM THE BESTIARY: enormous and rooted to the floor, armoured in overlapping plate like a siege engine, heavy jaws and a crown of horn. The most frightening thing in the set: more armour than the Marshal and more mass than anything that walks. That is what it is; the last line is what it is doing.
COMPOSE IT AS THE EXCEPTION. The other cards on this shelf are a fragment of a scene with open paper around it, because one picture has to serve every creature. This one does not: let the subject FILL the frame, close enough that the eye has nowhere else to go. It should be the card in a hand of eight that does not look like the other seven, from arm's length and before it is read.
FILLING THE FRAME IS NOT THE SAME AS SPREADING THE INK. Crowd the LEFT AND RIGHT edges with the subject -- never the top. Put the WEIGHT of the drawing -- the true blacks, the modelled detail, the part that reads from arm's length -- in the upper middle, and carry the lower half in light tone. A subject that runs from the top edge to the bottom one fills the frame and fails the card: the top is behind the name and the bottom is behind the rules text.
THE TOP QUARTER OF THE PICTURE IS EMPTY PAPER. Not a thin margin -- a quarter. Nothing crosses into it: no horn, no raised limb, no wing tip, no spray. Whatever is tallest in the subject BEGINS below that quarter, because the card prints its own name across the top and anything up there is printed over.

Draw a huge plated head and the one lifted limb beside it, both held across the upper middle, with the whole top quarter of the picture left as empty paper -- her crown of horn begins below that quarter and never enters it. Her rooted bulk below is light tone rather than ink, and small against it, already turned the same way, the first few of the things that obey.
```

### Thrash

File: `cards/npc/thrash.webp`

```text
SUBJECT. "Thrash" — Strike blast 1, Move · Strike every figure adjacent to you, then move your speed away from all of them.

Draw one full circle of motion: a blurred sweep running all the way around a single point, grit and dust flung to the frame's edges, and the centre of it already empty.
```

### Where It Is Held

File: `cards/npc/where-it-is-held.webp`

```text
SUBJECT. "Where It Is Held" — Strike ignores armour · A hand already on the strap. Armour does not apply: it is not holding anything on.

Draw an arm pinned flat and a point resting on it, unhurried, with nowhere for the arm to go.
```

### Work the Weave

File: `cards/npc/work-the-weave.webp`

```text
SUBJECT. "Work the Weave" — Cast · Cast one from your own short list.

Draw the air around a raised limb going wrong -- light bending, grit lifting off the ground in a slow curve. Nothing is being struck; something is being made.
```

### Worry It

File: `cards/npc/worry-it.webp`

```text
SUBJECT. "Worry It" — Strike ignores armour vs Off Balance · Tear at a target already off balance, and armour does not come into it.

Draw a body already down and the ground churned where it is being worked at, the armour irrelevant because nothing is being aimed.
```

## Way of Shade — pool

**19 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/shade/`.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Shade**, so its one chromatic accent is **#5d7aa3**.
  Use it on the one thing the picture is about, and nowhere else. No other hue appears.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

### At Full Draw

File: `cards/shade/at-full-draw.webp`

```text
SUBJECT. "At Full Draw" — Ready · / Move 1 · A bow or a crossbow. The first enemy to walk into the ground you are watching takes the shot, at the bow's own value, out to its...

Draw the drawing hand at full draw, three fingers hooked hard on the string with the arrow's nock between them and the string bent sharp either side. The bow's limbs are cut off by the frame and the arrow runs out of it level. No head, no face and no shoulder: the hand and the string are the whole subject. The arrowhead and every metal edge are warm grey, never blue.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Horn of Africa appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Between the Plates

File: `cards/shade/between-the-plates.webp`

```text
SUBJECT. "Between the Plates" — Strike ignores armour vs Marked · / Move 1

Draw the gap in a harness with a point already in it: a narrow blade entering where two plates meet under the arm, the armour unmarked everywhere else in frame. The seam is the subject and the blade is only what found it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of South Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Call the Shot

File: `cards/shade/call-the-shot.webp`

```text
SUBJECT. "Call the Shot" — Strike · / Marked (1) · Marked on any enemy you can see, at any range.

Draw one enemy picked out of a field at distance -- a hand up with two fingers laid along the line of sight, the eye behind it narrowed, the target far off and small. Nothing has been thrown and nothing has been loosed.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Germanic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Count the Odds

File: `cards/shade/count-the-odds.webp`

```text
SUBJECT. "Count the Odds" — Strike · / Sift 2 · The secondary is seeing only, so you may not reorder them, and you discard nothing.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; a hand turning one thing over and letting it drop.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Nordic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Cut and Run

File: `cards/shade/cut-and-run.webp`

```text
SUBJECT. "Cut and Run" — Strike, Move 2 · / Move 1

Draw the blow and the leaving in one gesture: a blade dragged back across the body while the feet have already turned the other way, shoulders ahead of hips. Committed to the exit rather than to a second cut.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Horn of Africa appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Find the Seam

File: `cards/shade/find-the-seam.webp`

```text
SUBJECT. "Find the Seam" — Strike -1 ignores armour · / Move 1 · Armour does not apply. A point weaker than a plain Strike.

Draw a hand laid flat on a breastplate, feeling for something through it, the knife still held low and unused -- the search is the subject, not the stab.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of South Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Half-Hilt

File: `cards/shade/half-hilt.webp`

```text
SUBJECT. "Half-Hilt" — Strike ignores 2 armor · / Move 1 · Ignores 2 armour. Reversed grip, straight into the gap.

Draw a knife held reversed and close, the pommel at the heel of the hand, driven short and straight where a long swing could not go.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Central Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Light Feet

File: `cards/shade/light-feet.webp`

```text
SUBJECT. "Light Feet" — Move 3 · / Move 2 · Ignoring difficult ground.

Draw two feet on bad ground and no weight resting in it -- a toe on a loose stone, the other foot already lifted, rubble and standing water all around. Drawn from the knee down and no higher.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Caribbean appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Mock

File: `cards/shade/mock.webp`

```text
SUBJECT. "Mock" — Dazed (1) · / Move 1

Draw a face mid-jeer, close and turned a little away, the mouth open on a word that has already landed somewhere off-frame. The subject is the insult being enjoyed, not whoever took it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Germanic appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Pin the Shadow

File: `cards/shade/pin-the-shadow.webp`

```text
SUBJECT. "Pin the Shadow" — Strike Slowed (1) · / Move 1

Draw a blade driven through a trailing hem and into the ground under it, the cloth pulled taut and the foot above it unable to lift. The point is in the earth and not in anybody.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Persian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Round the Shield

File: `cards/shade/round-the-shield.webp`

```text
SUBJECT. "Round the Shield" — Strike -1 range 3 ignores Block · / Move 1 · A thrown knife that answers neither a raised shield nor cover. Range 3.

Draw a shield raised square and squarely useless: the knife already past its edge and behind it, and the shield still exactly where it was put.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Levantine appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Scout Ahead

File: `cards/shade/scout-ahead.webp`

```text
SUBJECT. "Scout Ahead" — Move 3 · / Sift 3 · Seeing only, and one card deeper than most: you looked where you were going.

Draw ground covered -- weight forward, the last footfall still behind; a hand turning one thing over and letting it drop.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Southeast Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Second Knife

File: `cards/shade/second-knife.webp`

```text
SUBJECT. "Second Knife" — Strike range 3 · / Strike -1

Draw a second blade leaving the hand underhand while the first is still gripped in the other fist. Two knives, one in the air and one held, and the throw is the cheap short one.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Horn of Africa appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Sleight

File: `cards/shade/sleight.webp`

```text
SUBJECT. "Sleight" — Use, Strike · / Ready

Draw one hand doing the obvious thing and the other doing the real one -- an object held up in plain view high in the frame while the second hand, lower and half out of it, has already taken something else.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of North African appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Slip the Knot

File: `cards/shade/slip-the-knot.webp`

```text
SUBJECT. "Slip the Knot" — Move 2 · / Shake 1

Draw wrists coming out of a cord that is still tied: one hand already free and flat, the loop collapsing off the other. The knot itself is never untied and stays in the picture.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Levantine appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Smoke and Go

File: `cards/shade/smoke-and-go.webp`

```text
SUBJECT. "Smoke and Go" — Invisible (1), Move 2 · / Use · On yourself.

Draw a low cloud at ankle height with nobody in it, and the far side of it disturbed -- a hem, a heel, the edge of a hand leaving the frame. Whoever stood here is already not here.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Mediterranean appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Take the Shot

File: `cards/shade/take-the-shot.webp`

```text
SUBJECT. "Take the Shot" — Strike +1 · / Move 2

Draw the release itself: a bowstring gone slack and the drawing hand still open exactly where it was, the arrow already out of frame. The hand that let go is the whole subject.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of North African appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Held Knife

File: `cards/shade/the-held-knife.webp`

```text
SUBJECT. "The Held Knife" — Ready · / Move 1 · A weapon you can throw. The first enemy to walk into the ground you are watching takes it, at the blade's own value and no furth...

Draw a knife held by the blade between finger and thumb, the hand filling the upper middle of the frame and the forearm running out of the bottom corner. The point is steady and aimed out of frame to one side. Nothing above the hand: no head and no shoulder in the picture. The steel is warm grey, never blue.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of North African appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Vanish

File: `cards/shade/vanish.webp`

```text
SUBJECT. "Vanish" — Invisible (1) · / Move 2 · On yourself.

Draw the outline of a person held open in the air by nothing -- dust and lamplight bending around a shape that is not there, the floor beneath it unpressed. No body, no cloak, no smoke.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Persian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

## Way of Strength — pool

**16 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/strength/`.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Strength**, so its one chromatic accent is **#a3655d**.
  Use it on the one thing the picture is about, and nowhere else. No other hue appears.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

Draw a plated figure walking into something head-down, pauldrons forward and the helm tipped so the brow takes it first. The advance is in the shoulders; the ground is not the subject and barely shows.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Persian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Beat the Blade

File: `cards/strength/beat-the-blade.webp`

```text
SUBJECT. "Beat the Blade" — Strike Disarmed (1) · / Move 1

Draw a sword leaving a hand that has just been struck across the knuckles -- the grip sprung open, the fingers splayed, the hilt tumbling clear. The empty hand is the picture.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Persian appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Call It

File: `cards/strength/call-it.webp`

```text
SUBJECT. "Call It" — Strike · / Forestall 1 · The secondary names one NPC type.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; a motion broken off half-made, and begun again as a different one.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Central Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Hammerblow

File: `cards/strength/hammerblow.webp`

```text
SUBJECT. "Hammerblow" — Strike · / Move 1

Draw a two-handed weapon at the very top of its arc, both arms locked out and the whole body stacked underneath it, a half-beat before any of it comes down.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of West African appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Heave

File: `cards/strength/heave.webp`

```text
SUBJECT. "Heave" — Move 2 · / Ready · Carrying any weight without being Slowed.

Draw somebody walking under a load that should not be walkable: a beam or a cask across one shoulder, the spine straight beneath it, the pace unbroken. Not the lift -- the carrying.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Southeast Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Nothing Held Back

File: `cards/strength/nothing-held-back.webp`

```text
SUBJECT. "Nothing Held Back" — Strike · Strain your hand but one, and that card must be played this turn. Strike +1 per card strained.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Nordic appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### On the Rest

File: `cards/strength/on-the-rest.webp`

```text
SUBJECT. "On the Rest" — Ready · / Move 1 · A firearm, levelled on its rest. The first enemy to walk into the ground you are watching takes it, armour and all, out to the b...

Draw a musket barrel laid across a forked rest driven into the ground, levelled flat down one line and sighted along, the match smouldering. Not fired: waiting.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Horn of Africa appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Overbear

File: `cards/strength/overbear.webp`

```text
SUBJECT. "Overbear" — Grappled (2) · / Move 1

Draw two bodies gone to the ground as one, the upper one's whole weight on the lower's chest and both arms wrapped. Nothing is being struck; something is being kept still.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of East Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Pull Them Down

File: `cards/strength/pull-them-down.webp`

```text
SUBJECT. "Pull Them Down" — Strike · / Strike -1 · The secondary only against a Prone or Grappled target.

Draw a fistful of somebody else's collar and harness, hauled downward and sideways, their knees already going. The grip is the subject and the face above it is cropped out.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Northwest European appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Roar

File: `cards/strength/roar.webp`

```text
SUBJECT. "Roar" — Compelled (1) · / Move 1 · Every adjacent enemy.

Draw the roar at its source and far too close -- a jaw open to its limit and the throat working, the frame filled by the one head and nothing else in it. The cause is all there is; the effect is off-frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of South Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Shield Bash

File: `cards/strength/shield-bash.webp`

```text
SUBJECT. "Shield Bash" — Strike · / Move 1 · No damage: push 2 and step into the square it left.

Draw the flat of a shield driven forward like a door being shut, the boss dead centre and the arm straight behind it. Nothing edged anywhere in the frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Germanic appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Shield Wall

File: `cards/strength/shield-wall.webp`

```text
SUBJECT. "Shield Wall" — Defend · / Defend, Block 1 area 1

Draw shields locked edge to edge, more than one pair of hands in frame, the seam between two of them dead centre.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of South Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Shoulder Check

File: `cards/strength/shoulder-check.webp`

```text
SUBJECT. "Shoulder Check" — Strike · / Off Balance (1) · Adjacent.

Draw a shoulder arriving in somebody's chest at a run, the two bodies touching along one line and the further one's heels leaving the ground.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of South Asian appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Sweep the Leg

File: `cards/strength/sweep-the-leg.webp`

```text
SUBJECT. "Sweep the Leg" — Strike Prone (1) · / Move 1

Draw a low horizontal sweep through the back of a knee, drawn from the shins down: the supporting leg folding the wrong way while the other foot is still planted.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Southeast Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Two-Hand It

File: `cards/strength/two-hand-it.webp`

```text
SUBJECT. "Two-Hand It" — Strike +2 · / Ready

Draw both hands closing onto one hilt and a shield already dropped, falling out of the bottom of the frame. The decision is the picture: everything into the next blow and nothing left to guard with.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Persian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Walk It Off

File: `cards/strength/walk-it-off.webp`

```text
SUBJECT. "Walk It Off" — Heal 2, Shake 2 · / Move 1 · On yourself.

Draw somebody walking a wound off instead of tending it -- a hand pressed flat to one side, head up, the stride deliberately ordinary. The refusal to stop is the subject.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of West African appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

Draw the end of a shoulder roll: a body coming up out of the ground onto one knee with the momentum still in it, facing a different way than it set off.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of South Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Set Spear

File: `cards/way/set-spear.webp`

```text
SUBJECT. "Set Spear" — Defend · / Move 1 · an enemy ending its move adjacent takes your Strike

Draw a spear butt driven into the ground and braced underfoot, the point levelled outward and steady. Nobody is holding it up; the earth is.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Caribbean appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

Draw the instant something gives -- a board, a hasp, a shutter going at its weakest point with a hand still on it. The break is the subject and the person is barely in frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Slavic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Heave

File: `cards/skill/heave.webp`

```text
SUBJECT. "Heave" — might 2

Draw a load shifting at last -- shoulder into it, feet skidding, the thing finally moving.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of North African appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Inspiration

File: `cards/skill/inspiration.webp`

```text
SUBJECT. "Inspiration" — Edge: Draw 1 skill card.

Draw the moment a face changes because the person has just thought of the thing. Nothing in the hands; all of it in the eyes.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Germanic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Keep Your Footing

File: `cards/skill/keep-your-footing.webp`

```text
SUBJECT. "Keep Your Footing" — agility 1 · Edge: You do not fall, whatever else happens.

Draw a body gone past the angle at which it should fall, and not falling: one foot has found the only solid thing left.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Persian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Out of the Light

File: `cards/skill/out-of-the-light.webp`

```text
SUBJECT. "Out of the Light" — shadow 1

Draw somebody stepping backwards out of a lit place into one that is not, more than half of them already gone.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of East Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Quick Hands

File: `cards/skill/quick-hands.webp`

```text
SUBJECT. "Quick Hands" — agility 2

Draw fingers working a catch or a knot faster than an eye follows, the other hand already started on what comes after.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Mediterranean appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Set Your Feet

File: `cards/skill/set-your-feet.webp`

```text
SUBJECT. "Set Your Feet" — might 3

Draw the instant before a pull rather than during it: weight dropped, heels dug, the line gone tight and nothing moving yet.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of East Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Sharp Eyes

File: `cards/skill/sharp-eyes.webp`

```text
SUBJECT. "Sharp Eyes" — wits 1 · Edge: Ask the GM one yes-or-no question about the scene.

Draw a look held one second longer than anybody else's, on the single thing in the room that is wrong.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Levantine appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Soldier's Learning

File: `cards/skill/soldiers-learning.webp`

```text
SUBJECT. "Soldier's Learning" — lore 1

Draw a hand reading something by touch that it has handled a thousand times before. Recognition, not study.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Nordic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Loud Voice

File: `cards/skill/the-loud-voice.webp`

```text
SUBJECT. "The Loud Voice" — presence 1 · Edge: Everyone nearby hears you, and knows it was you.

Draw a shout thrown across a space with the whole chest behind it, and every head in frame already turning toward it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of South Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

Draw a caster taking their own spell in the face: the head snapped back, one hand still raised in the shape it was making, the eyes gone unfocused. It went off, and it went off here.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Central Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Blink

File: `cards/wild/blink.webp`

```text
SUBJECT. "Blink" — Move 3 ignoring figures and difficult ground

Draw one figure half in two places at once -- a left side at one edge of the frame and a right side at the other, nothing at all between them and no ground crossed.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Germanic appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Echo

File: `cards/wild/echo.webp`

```text
SUBJECT. "Echo" — The Cast resolves a second time, against the same target.

Draw the same blow arriving twice: one figure, and a second identical shape half a pace behind it, out of step by one heartbeat.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of South Asian appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Glare

File: `cards/wild/glare.webp`

```text
SUBJECT. "Glare" — The Cast becomes a Blast 2 around its target, whoever is standing in it.

Draw light going off around a standing figure rather than at it: the figure dark and central, the flare thrown outward past it in every direction, the frame's near edges washed pale.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Slavic appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Misfire

File: `cards/wild/misfire.webp`

```text
SUBJECT. "Misfire" — The Cast resolves against the nearest creature instead, ally or not.

Draw a spell going off at the wrong end of the room -- the caster's hand still open and extended, and the person standing beside them taking all of it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of North African appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Open Door

File: `cards/wild/open-door.webp`

```text
SUBJECT. "Open Door" — Invisible (1), Marked (2)

Draw an open door with nobody in the doorway and something on the far side already looking this way. The invisibility is the empty frame; the marking is the attention coming back through it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of North African appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Residue

File: `cards/wild/residue.webp`

```text
SUBJECT. "Residue" — Cursed

Draw a shadow on the ground belonging to nobody standing: the figure above it lit and ordinary, the shape beneath it the wrong size and reaching the wrong way.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Levantine appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Second Sight

File: `cards/wild/second-sight.webp`

```text
SUBJECT. "Second Sight" — Blessed

Draw light arriving on one person out of a dim room and on nothing else, from no source anywhere in the frame -- the face lifted into it, the hands still at whatever they were doing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Nordic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Long Step

File: `cards/wild/the-long-step.webp`

```text
SUBJECT. "The Long Step" — Move 3 ignoring figures and difficult ground, Prone (1)

Draw the arrival and not the crossing: a figure already down on both hands at the far end of the move, dust still settling around it, having got there without landing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Northwest European appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Veil

File: `cards/wild/veil.webp`

```text
SUBJECT. "Veil" — Invisible (1)

Draw a sheet of air hanging like hung cloth, the room behind it displaced a finger's width to one side where it falls. Something is behind it and the picture does not say what.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of North African appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

## The twist deck

**8 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/twist/`.



<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. 

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

### Arrival

File: `cards/twist/arrival.webp`

```text
SUBJECT. "Arrival"

Draw a second shadow entering the frame along the floor, cast by somebody still out of shot. The subject is the shadow and the empty doorway it comes from.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Northwest European appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Gear

File: `cards/twist/gear.webp`

```text
SUBJECT. "Gear"

Draw a steel file snapped clean in two, both halves lying where they fell on a workbench, the bright break at each end still unworn. No lock, no keyhole and no hand in the frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Nordic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Hurt

File: `cards/twist/hurt.webp`

```text
SUBJECT. "Hurt"

Draw an open-faced helmet lying on its side on bare ground, one fresh bright dent crushed into the brow of it and the lining torn loose inside. Nobody is in the frame: no head, no hand, no limb, no skin, no blood, no bandage and no weapon.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Southeast Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Noise

File: `cards/twist/noise.webp`

```text
SUBJECT. "Noise"

Draw a lantern turned toward the viewer from a dark doorway, the shutter half open, somebody behind it who has stopped to listen. The subject is the light and the pause, not the person.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of West African appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Opening

File: `cards/twist/opening.webp`

```text
SUBJECT. "Opening"

Draw a door swung wide on an empty room beyond, the bolt hanging loose and nobody there. The one card in this deck that gives: the frame is open and lit where the others are closed.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Slavic appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Secret

File: `cards/twist/secret.webp`

```text
SUBJECT. "Secret"

Draw a letter unfolded by somebody whose hands are not steady, the writing turned away from the viewer. What it says is withheld; the subject is the unfolding.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Mediterranean appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Strain

File: `cards/twist/strain.webp`

```text
SUBJECT. "Strain"

Draw a hand that has let go: one card falling away face down, the others still fanned and held. The subject is the gap it left rather than the card.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Slavic appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Time

File: `cards/twist/time.webp`

```text
SUBJECT. "Time"

Draw a candle burnt past where it was meant to be, the pool of wax spreading off the holder and over the table. Nothing is on fire; the subject is how much is gone.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Slavic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

## The ritual twist deck

**8 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/ritual/`.

A ritual going wrong. Days of work, out of combat, on one of the party's own characters -- so the room is quiet and worked-in, and what has turned is the working itself rather than anything arriving. No monster, no blade, no summoning circle.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A ritual going wrong. Days of work, out of combat, on one of the party's own characters -- so the room is quiet and worked-in, and what has turned is the working itself rather than anything arriving. No monster, no blade, no summoning circle.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- the moment a long patient job turns on the people doing it, in a room that has been lived in for days -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

File: `cards/ritual/backlash.webp`

```text
SUBJECT. "Backlash"

Draw the working coming back up the arms of the person leading it -- hands still in position, the body already folding away from them.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Germanic appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Deeper

File: `cards/ritual/deeper.webp`

```text
SUBJECT. "Deeper"

Draw the subject's own injury answering for itself -- a body going wrong again in the exact place it went wrong the first time, mid-ritual, with the work still laid out around it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Levantine appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### It Answers

File: `cards/ritual/it-answers.webp`

```text
SUBJECT. "It Answers"

Draw every flame in the room leaning the same way at once, toward something outside the frame that has just taken an interest.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Mediterranean appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### It Sets

File: `cards/ritual/it-sets.webp`

```text
SUBJECT. "It Sets"

Draw a thing closing rather than opening: the work gone still and settled, the room's tension simply absent, and nothing to show for the days but a subject unchanged.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Caribbean appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Not Alone

File: `cards/ritual/not-alone.webp`

```text
SUBJECT. "Not Alone"

Draw the person who was only helping, suddenly holding their own arm -- the subject still on the table between them, untouched by this.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Levantine appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Residue

File: `cards/ritual/residue.webp`

```text
SUBJECT. "Residue"

Draw what is left on the table when the working lifts: a stain spreading out from where the subject's hand was, in the grain of the wood.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of East Asian appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Spoiled

File: `cards/ritual/spoiled.webp`

```text
SUBJECT. "Spoiled"

Draw a prepared component ruined in the instant of use: the vessel cracked through, its contents already across the table and unusable.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Slavic appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Long Way

File: `cards/ritual/the-long-way.webp`

```text
SUBJECT. "The Long Way"

Draw a page turned back to and read again, the diagram on it plainly not matching what has been built on the table in front of it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Caribbean appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

## Wounds and Taint

**8 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/cards/harm/`.

A card nobody chose to put in a deck: it sits in a hand of five being useless, or comes up at a moment nobody picked. It must read as WRONG at a glance and at thumbnail size, under a dark red wash the interface puts over it — so: strong simple shapes, little fine detail, and no weapon, no attacker and no blood. The harm has already happened; this is what is left of it.

<details><summary><b>The capsule — paste this once, at the top of a fresh chat</b></summary>

```text
A single illustration for a playing card in a tabletop fantasy RPG.

THIS GROUP. A card nobody chose to put in a deck: it sits in a hand of five being useless, or comes up at a moment nobody picked. It must read as WRONG at a glance and at thumbnail size, under a dark red wash the interface puts over it — so: strong simple shapes, little fine detail, and no weapon, no attacker and no blood. The harm has already happened; this is what is left of it.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- what is left after the thing happened, carried rather than suffered -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

### Compulsion

File: `cards/harm/compulsion.webp`

```text
SUBJECT. "Compulsion"

Draw somebody who cannot sit down: the chair there, plainly there, and the body going past it again.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Slavic appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Confusion

File: `cards/harm/confusion.webp`

```text
SUBJECT. "Confusion"

Draw a group that has lost its one direction -- each of them turned a different way, none of them moving.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of West African appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Doubt

File: `cards/harm/doubt.webp`

```text
SUBJECT. "Doubt"

Draw a hand stopped halfway to the thing it was reaching for, and the gap between them as the subject of the picture.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Levantine appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Fear

File: `cards/harm/fear.webp`

```text
SUBJECT. "Fear"

Draw a single backward step already taken: the front foot lifted and turned, the ground where it was standing empty and marked.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of East Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Rage

File: `cards/harm/rage.webp`

```text
SUBJECT. "Rage"

Draw a swing already committed to, seen from behind the shoulder, with nothing in front of it worth swinging at.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of North African appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Taint (body)

File: `cards/harm/taint-body.webp`

```text
SUBJECT. "Taint (body)"

Draw a hand's veins gone dark and standing up under the skin, traced further than a hand should reach, the fingers still working.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Southeast Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Taint (mind)

File: `cards/harm/taint-mind.webp`

```text
SUBJECT. "Taint (mind)"

Draw a face lit from somewhere that is not in the picture, looking slightly past the viewer at something it has been looking at for a while.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Nordic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Wound

File: `cards/harm/wound.webp`

```text
SUBJECT. "Wound"

Draw an arm bound tight and held close, doing nothing and plainly unable to -- the rest of the body still upright and still in the fight.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Caribbean appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Shade**, so its one chromatic accent is **#5d7aa3**.
  Use it on the one thing the picture is about, and nowhere else. No other hue appears.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Southeast Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Heckle

File: `signatures/shade/heckle.webp`

```text
SUBJECT. "Heckle" — Heckled (1) · / Move 1 · An enemy arriving next to you draws fate with disadvantage until your next turn.

Draw attention pulled the wrong way.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Germanic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Lift

File: `signatures/shade/lift.webp`

```text
SUBJECT. "Lift" — Strike · / Move 1 · On a hit, take one card from the target's own deck. It is yours now, and it is in your deck for good.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Southeast Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Loose and Step

File: `signatures/shade/loose-and-step.webp`

```text
SUBJECT. "Loose and Step" — Strike, Move 1 · / Move 1

Draw the blow landing, loosed from a bow or a barrel, the target well off; ground covered -- weight forward, the last footfall still behind.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Mediterranean appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Named

File: `signatures/shade/named.webp`

```text
SUBJECT. "Named" — Strike · / Marked (1) · Name one enemy. Against it, your Parry also Strikes for 1.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; singled out of a crowd.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Germanic appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### One Opening

File: `signatures/shade/one-opening.webp`

```text
SUBJECT. "One Opening" — Strike · / Move 1 · Against a target that is unaware or carrying an opening, the damage is doubled.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Central Asian appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### One Trick

File: `signatures/shade/one-trick.webp`

```text
SUBJECT. "One Trick" — You may prepare from any one school you have ever seen cast.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Central Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Over and Past

File: `signatures/shade/over-and-past.webp`

```text
SUBJECT. "Over and Past" — Move 3 · / Move 1 · You may move through enemy squares.

Draw ground covered -- weight forward, the last footfall still behind.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Nordic appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Point Man

File: `signatures/shade/point-man.webp`

```text
SUBJECT. "Point Man" — Foresee · / Move 1 · While you are the furthest forward of your party, Foresee one extra type.

Draw the moment before a thing happens, shown twice.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of West African appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Set

File: `signatures/shade/set.webp`

```text
SUBJECT. "Set" — Ready Slowed 2 an adjacent square; the first enemy to enter takes your Strike value · / Ready · Place a trap on an adjacent square.

Draw a weapon coming to hand, caught between carried and held; movement dragging, as if through water.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Nordic appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Kit

File: `signatures/shade/the-kit.webp`

```text
SUBJECT. "The Kit" — item · You may never put it down. Every Hard physical obstacle becomes Normal.

Draw a worn canvas roll laid open on a workbench, its loops and pockets each shaped to something that is not in them, the canvas gone dark along every fold from years of being rolled and unrolled. The subject is how used it is. No tool, no metal, no lock, no keyhole, no door and no person anywhere in the frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of East Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Opening

File: `signatures/shade/the-opening.webp`

```text
SUBJECT. "The Opening" — Advantage against anyone carrying an opening -- whoever set it.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Levantine appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Strength**, so its one chromatic accent is **#a3655d**.
  Use it on the one thing the picture is about, and nowhere else. No other hue appears.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Caribbean appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Get a Grip

File: `signatures/strength/get-a-grip.webp`

```text
SUBJECT. "Get a Grip" — Grappled (2) · / Move 1 · No save at all if both your hands are empty.

Draw held, and not letting go.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of North African appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Interpose

File: `signatures/strength/interpose.webp`

```text
SUBJECT. "Interpose" — Defend · / Move 1 · Take a hit meant for an adjacent ally.

Draw the step across -- a body arriving in the path of a blow meant for somebody else, caught between the two of them.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Slavic appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Loaded Before the Bell

File: `signatures/strength/loaded-before-the-bell.webp`

```text
SUBJECT. "Loaded Before the Bell" — You begin every combat already loaded, and the first shot of a fight is +2.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Caribbean appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Nothing Gets Through

File: `signatures/strength/nothing-gets-through.webp`

```text
SUBJECT. "Nothing Gets Through" — While you are Overloaded, your armor counts double.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Nordic appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### On My Call

File: `signatures/strength/on-my-call.webp`

```text
SUBJECT. "On My Call" — Ready · / Move 1 · On an ally's turn: they may play a card in their hand halves swapped, its secondary as a primary.

Draw a weapon coming to hand, caught between carried and held.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Caribbean appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Play to the Crowd

File: `signatures/strength/play-to-the-crowd.webp`

```text
SUBJECT. "Play to the Crowd" — Compelled (1) · / Move 1 · When you are hit: gain Block 2, and the attacker is Compelled (1) -- no save, because you have already been hit once.

Draw pulled toward something against the will.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of South Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Ranging Shot

File: `signatures/strength/ranging-shot.webp`

```text
SUBJECT. "Ranging Shot" — Strike aimed 1 · / Ready · Blast instead of Aimed, if you did not Move this turn.

Draw the blow landing, loosed from a bow or a barrel, the target well off, one line only, from eye to target; a weapon coming to hand, caught between carried and held.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Horn of Africa appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Red Mist

File: `signatures/strength/red-mist.webp`

```text
SUBJECT. "Red Mist" — Strike · / Move 1 · Then draw back up to your hand size at once.

Draw the instant a blow lands, the weapon already through -- never wound up, never posing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of North African appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Shoulder to Shoulder

File: `signatures/strength/shoulder-to-shoulder.webp`

```text
SUBJECT. "Shoulder to Shoulder" — Strike, Block 1 area 1 · / Move 1

Draw the instant a blow lands, the weapon already through -- never wound up, never posing; a blow stopped flat, its force going sideways.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of South Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Lance

File: `signatures/strength/the-lance.webp`

```text
SUBJECT. "The Lance" — Move 3, Strike · / Move 1 · Advantage if you moved at least 2. Needs the mount.

Draw ground covered -- weight forward, the last footfall still behind; the instant a blow lands, the weapon already through -- never wound up, never posing.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Nordic appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Wall

File: `signatures/strength/the-wall.webp`

```text
SUBJECT. "The Wall" — Your Blocks stack. You are the one exception to highest-wins.

Draw the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Mediterranean appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Mind**, so its one chromatic accent is **#5d9a86**.
  Use it on the one thing the picture is about, and nowhere else. No other hue appears.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of North African appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Call the Unquiet

File: `signatures/mind/call-the-unquiet.webp`

```text
SUBJECT. "Call the Unquiet" — strength 3 · Conjure range 2 a corpse rises and fights for you

It does not know it died. It will stop when the fight does.

Draw the arrival, landing 2 squares from the one who threw it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of South Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Graven Strength

File: `signatures/mind/graven-strength.webp`

```text
SUBJECT. "Graven Strength" — strength 1 · Graven

It is on your arm. It does not need remembering, and it never comes off.

Draw a mark cut into flesh and holding.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Levantine appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Hearth and Home

File: `signatures/mind/hearth-and-home.webp`

```text
SUBJECT. "Hearth and Home" — strength 1 · a camp nobody unfriendly can find, for one night

Out of combat: a camp nobody unfriendly can find, for one night. A ritual, so anyone literate could do it — but somebody has to know the words.

Draw that line literally: the one moment it describes, and nothing else in frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Nordic appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Not Here

File: `signatures/mind/not-here.webp`

```text
SUBJECT. "Not Here" — strength 2 · Invisible (1) until you attack or are attacked

You are standing exactly where you are standing. Nobody can be told so.

Draw only the shape the air makes.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Slavic appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Nothing Left to Take

File: `signatures/mind/nothing-left-to-take.webp`

```text
SUBJECT. "Nothing Left to Take" — strength 1 · you cannot be reduced below 1 Health

There is nothing in your hand and nothing left to lose, and the second follows from the first.

Draw that line literally: the one moment it describes, and nothing else in frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Persian appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Bargain

File: `signatures/mind/the-bargain.webp`

```text
SUBJECT. "The Bargain" — strength 3 · Conjure it acts once; the GM decides how

A minor god acts, once. The GM decides how , and that is not a hole in the spell — it is the spell.

Draw something arriving that was not there a moment ago.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Mediterranean appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Reading

File: `signatures/mind/the-reading.webp`

```text
SUBJECT. "The Reading" — strength 2 · Foresee 3

Three cards down somebody else's luck. Never your own — a diviner who could stack their own deck would be a damage school wearing a robe.

Draw the moment before a thing happens, shown twice.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Mediterranean appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Unmake

File: `signatures/mind/unmake.webp`

```text
SUBJECT. "Unmake" — strength 2 · a Cast you have survived before does not resolve

You have felt this one before. That is the only reason you can stop it: a warder's book is a record of what the party has survived — which is a condition on LEARNING it, held by the GM, not something the engine tests.

Draw that line literally: the one moment it describes, and nothing else in frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Slavic appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Wall of the Sphere

File: `signatures/mind/wall-of-the-sphere.webp`

```text
SUBJECT. "Wall of the Sphere" — strength 2 · range 3 area 3 of your element

Three squares of whichever sphere is yours. Stand behind it and the ground in front of you is no longer anybody's.

Draw that line literally: the one moment it describes, and nothing else in frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Horn of Africa appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Wither

File: `signatures/mind/wither.webp`

```text
SUBJECT. "Wither" — strength 2 · Cast Poisoned 1 (2)

Dazed while it lasts, and one damage a turn that armour does not stop.

Draw a shape held in the air between the hands, half-finished and still forming; colour draining out.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of East Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Faith**, so its one chromatic accent is **#8a74b8**.
  Use it on the one thing the picture is about, and nowhere else. No other hue appears.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

Draw breath coming back, landing 99 squares from the one who threw it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Germanic appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Out of Barren Ground

File: `signatures/faith/out-of-barren-ground.webp`

```text
SUBJECT. "Out of Barren Ground" — strength 3 · Heal 4 range 2

Plant it. At the start of your second turn after, every ally within 2 heals 4. Nothing he gives arrives when you ask for it.

Draw breath coming back, landing 2 squares from the one who threw it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Levantine appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Borrowed Face

File: `signatures/faith/the-borrowed-face.webp`

```text
SUBJECT. "The Borrowed Face" — strength 3 · range 3 Spent: one enemy spends this round attacking its own ally

Spent: one enemy spends this round attacking its own ally. It works once, which is the god.

Draw that line literally: the one moment it describes, and nothing else in frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Mediterranean appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Clean Hand

File: `signatures/faith/the-clean-hand.webp`

```text
SUBJECT. "The Clean Hand" — strength 2 · range 3 an ally's next check or attack cannot fail

An ally's next check or attack cannot fail. One cheaper on a brother or sister in faith, which is the third tenet made arithmetic.

Draw that line literally: the one moment it describes, and nothing else in frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of West African appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Club and the Line

File: `signatures/faith/the-club-and-the-line.webp`

```text
SUBJECT. "The Club and the Line" — strength 2 · Cast blast 1 with the weapon in hand

Strike every adjacent enemy. No free hand needed, because the club is the holy symbol — which is the gift on the node, not on the card.

Draw the shape forming between the hands, reaching everything around at once.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Mediterranean appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Drum

File: `signatures/faith/the-drum.webp`

```text
SUBJECT. "The Drum" — strength 1 · your next Strike this turn is +3

It starts somewhere behind you and it is already in your arms.

Draw that line literally: the one moment it describes, and nothing else in frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Mediterranean appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The First Taste

File: `signatures/faith/the-first-taste.webp`

```text
SUBJECT. "The First Taste" — strength 2 · Tainting 2 range 1

Draw a cup taken away from the mouth and held out to somebody else, the taster's own lip already stained -- the stain is ink-dark and not coloured. Two hands and the cup between them, and nothing else in the frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Persian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Long Night

File: `signatures/faith/the-long-night.webp`

```text
SUBJECT. "The Long Night" — strength 3 · Cast +3 range 1 you gain the Health you take

Drain 3 Health from an adjacent living target and gain it. The only renewable pool in the game, and the node says what it costs to have one.

Draw the shape forming between the hands, thrown with the whole body, nothing held back, landing 1 square from the one who threw it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Mediterranean appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Long Silence

File: `signatures/faith/the-long-silence.webp`

```text
SUBJECT. "The Long Silence" — Ready 2 · / Shake 1 · Only if you did not move this round. Stillness is the whole of the order's method.

Draw a weapon coming to hand, caught between carried and held; footing lost.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Central Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Order's Shield

File: `signatures/faith/the-orders-shield.webp`

```text
SUBJECT. "The Order's Shield" — Defend, Block 2 range 1 · / Block 1 range 1 · The Block goes to an adjacent ally and never to you. The order does not defend itself.

Draw a guard closing: shield, forearm or shoulder set against something off-frame; the blow stopped flat, landing 1 square from the one who threw it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Mediterranean appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Outcast's Due

File: `signatures/faith/the-outcasts-due.webp`

```text
SUBJECT. "The Outcast's Due" — strength 3 · Cast blast 1 Compelled (2)

Every enemy next to you turns on you, because the outcast is who the crowd turns on. That is not a side effect; it is the prayer.

Draw the shape forming between the hands, reaching everything around at once; pulled toward something against the will.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of East Asian appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Rumour

File: `signatures/faith/the-rumour.webp`

```text
SUBJECT. "The Rumour" — strength 2 · one enemy type acts as though a named lie were true

Draw a mouth at an ear and a hand cupped round the words, both heads cropped at the brow so neither face is readable. The listener's eye is the one thing drawn in full, and it has already believed it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Central Asian appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Scourge

File: `signatures/faith/the-scourge.webp`

```text
SUBJECT. "The Scourge" — Strike +2 · / Move 2 · Strain 1, paid before the blow lands. The drums, the dance and the whip make the same argument: pay first, strike harder.

Draw the blow landing, thrown with the whole body, nothing held back.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of West African appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Silent Hour

File: `signatures/faith/the-silent-hour.webp`

```text
SUBJECT. "The Silent Hour" — strength 2 · range 1 Dazed (1)

Reaction, adjacent only: an enemy's action does not happen. Close enough to touch, which is where the knife is.

Draw sight swimming.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Mediterranean appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Tide Knows

File: `signatures/faith/the-tide-knows.webp`

```text
SUBJECT. "The Tide Knows" — strength 2 · range 3 an ally draws fate twice on their next action and keeps both

An ally draws fate twice on their next action and keeps both. The sea is not fair.

Draw that line literally: the one moment it describes, and nothing else in frame.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of East Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### The Writ

File: `signatures/faith/the-writ.webp`

```text
SUBJECT. "The Writ" — range 6 Judged (2) · / Move 1 · No save, at range 6. Being named is not something you resist, and the whole field may act on it.

Draw seen, and found wanting.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Mediterranean appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Shade**, so its one chromatic accent is **#5d7aa3**.
  Use it on the one thing the picture is about, and nowhere else. No other hue appears.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

**72 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/spells/mind/`.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Mind**, so its one chromatic accent is **#5d9a86**.
  Use it on the one thing the picture is about, and nowhere else. No other hue appears.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

Draw a bare forearm and the back of one hand, plate armour tattooed into the skin in black line -- lames, rivets and the cuff of a vambrace inked where a real one would sit, the lines following the tendons under the skin. Drawn from the elbow down and no higher, the arm entering from the bottom of the frame.
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

### Graven Sight

File: `spells/mind/graven-sight.webp`

```text
SUBJECT. "Graven Sight" — strength 1 · Sift 2 seeing only -- you may not reorder them

Two small eyes carved behind the ear, looking the way you came. You always know the next two cards you will draw. You may not change their order, and the knowing is worth exactly as much as what you do about it.

Draw a hand turning one thing over and letting it drop.
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

### One Less Thing

File: `spells/mind/one-less-thing.webp`

```text
SUBJECT. "One Less Thing" — strength 1 · Sift 1 once a fight

You look at what is coming and decide you do not want it. The card is not lost -- it is in the discard with everything else, and a breath brings it back -- but the draw pile is one shorter, which is the direction this school always walks.

Draw a hand turning one thing over and letting it drop.
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
SUBJECT. "The Great Bargain" — strength 5 · Conjure a minor god becomes present and fights as an ally for three rounds

It is actually here, for three rounds. The GM plays it as an ally and then it goes, and afterwards it takes something the GM chooses — which is the only honest way to price a favour that large.

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
SUBJECT. "The Mended Seam" — strength 1 · Repair 1 repair one item overnight, including corroded armour

One item, overnight, including corroded armour — which until now was the only damage in the game nothing undid.

Draw metal continuous again across a place that had given way, and the mend still visible.
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

Draw the hour that was bought, never the price that bought it -- a thick tallow candle with hour lines scored across it, burned down past the first line, the flame low and one heavy fall of wax run down the side. No figure, no hand, no wrist, no bandage, no blade, no wound and no blood anywhere in the frame.
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

Somebody else's deck, one card down. The cheapest certainty in the game, and never your own: the seer is blind to themselves.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- This group is the **Way of Faith**, so its one chromatic accent is **#8a74b8**.
  Use it on the one thing the picture is about, and nowhere else. No other hue appears.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Apart from the accent named above, no hue at all: the rest of the picture is ink, paper and
  the warm greys between them. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

Draw breath coming back -- a chest filling again, a hand steady that was not steady. No wound, no blood and no bandage in the frame.
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

Draw breath coming back, landing 3 squares from the one who threw it.
```

### Measure of the Debt

File: `spells/faith/measure-of-the-debt.webp`

```text
SUBJECT. "Measure of the Debt" — strength 2 · a Judged enemy that dies this round: you gain 3 Health

Draw the two halves of a split tally stick held edge to edge so the notches line up, in two hands at waist height, cropped at the wrists. The matched notches are the whole subject and the dark is ink rather than a colour.
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

Allies adjacent to you cannot be reduced below 1 Health until your next turn. His miracles are paid in yours.

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

Draw the shape forming between the hands, the one that found its moment, landing 1 square from the one who threw it; weight in the wrong place.
```

### The Air Between

File: `spells/faith/the-air-between.webp`

```text
SUBJECT. "The Air Between" — strength 4 · until your next turn every ally may take one extra reaction per trigger

For one round everybody answers twice. The reaction policy allows one per trigger and this is the only thing in the game that argues with it.

Draw that line literally: the one moment it describes, and nothing else in frame.
```

### The Amber District

File: `spells/faith/the-amber-district.webp`

```text
SUBJECT. "The Amber District" — strength 5 · until the fight ends every adjacent ally shares your armor and Block, and damage dealt to them is dealt to you instead

Your armour is theirs, your Block is theirs, and everything aimed at them arrives in you. It will cost enough, which is how Vax prices war plainly.

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

Draw a plank laid across a gap with nothing under its far end and nothing holding it up, a boot's whole weight in the middle of it and not a trace of bend in the wood. Drawn from the knee down, the gap filling the lower half in ink, and the top of the frame empty.
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

Draw breath coming back -- a chest filling again, a hand steady that was not steady. No wound, no blood and no bandage in the frame.
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

**15 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/features/`.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber -- **and that includes the ground.** Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

### Adapted

File: `features/adapted.webp`

```text
SUBJECT. "Adapted" — Name one injury you carry. Its penalty no longer applies. The injury remains.

Draw a hand doing something awkward entirely without hesitation -- the missing fingers plainly missing, the grip worked out long ago and no longer thought about.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Central Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Alert

File: `features/alert.webp`

```text
SUBJECT. "Alert" — You draw with advantage on initiative.

Draw a head already turned toward a sound nobody else has heard yet, the body still facing the way it was going.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of South Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Arcane Focus

File: `features/arcane-focus.webp`

```text
SUBJECT. "Arcane Focus" — +1 to all Cast values.

Draw an object with more inside it than its size allows.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Germanic appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Good Aim

File: `features/good-aim.webp`

```text
SUBJECT. "Good Aim" — +2 range on Ranged and Thrown items.

Draw an object that means nothing except in trained hands.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of West African appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Good Name

File: `features/good-name.webp`

```text
SUBJECT. "Good Name" — +1 on Presence checks. People have heard of you, and most of it was good.

Draw an object that means nothing except in trained hands.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of South Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Hard Hands

File: `features/hard-hands.webp`

```text
SUBJECT. "Hard Hands" — +1 on Might checks. Lifting, breaking, and not letting go.

Draw an object that means nothing except in trained hands.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Germanic appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Light Step

File: `features/light-step.webp`

```text
SUBJECT. "Light Step" — +1 on Agility checks. Where to put a foot, decided before you need it.

Draw an object that means nothing except in trained hands.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Horn of Africa appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Packhorse

File: `features/packhorse.webp`

```text
SUBJECT. "Packhorse" — +20 kg carry allowance.

Draw a back under a load that would stop anybody else, straps biting in, the stride not broken by it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of North African appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Quick

File: `features/quick.webp`

```text
SUBJECT. "Quick" — Hand size +1.

Draw two things done in the time for one: a hand finishing one motion while the body has already committed to the next.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Central Asian appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Quick Eye

File: `features/quick-eye.webp`

```text
SUBJECT. "Quick Eye" — +1 on Wits checks. You notice the thing that is about to happen.

Draw an object that means nothing except in trained hands.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of West African appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Quiet Worker

File: `features/quiet-worker.webp`

```text
SUBJECT. "Quiet Worker" — +1 on Shadow checks. Slowly is quietly, and you have the patience for it.

Draw an object that means nothing except in trained hands.

WHO IS IN IT. If a face or any bare skin shows here, that person is a man of Central Asian appearance, in their thirties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Steady

File: `features/steady.webp`

```text
SUBJECT. "Steady" — You don't become Dazed. · Drain: you don't become Dazed.

Draw a face taking a hard blow without the eyes losing their focus. The head moves; the look does not.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Northwest European appearance, in their forties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Strong

File: `features/strong.webp`

```text
SUBJECT. "Strong" — +1 damage on Strike with Heavy items.

Draw something worn against the skin, shaped by the body that wore it.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Nordic appearance, past fifty -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Tough

File: `features/tough.webp`

```text
SUBJECT. "Tough" — +4 max Health.

Draw a body that has been opened and closed several times already, old seams showing, entirely unbothered by the newest one.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of North African appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

### Well Read

File: `features/well-read.webp`

```text
SUBJECT. "Well Read" — +1 on Lore checks. Somebody has written this down, and you have read them.

Draw an object that means nothing except in trained hands.

WHO IS IN IT. If a face or any bare skin shows here, that person is a woman of Slavic appearance, in their twenties -- fixed, not a suggestion, and not a default to fall back from. If this crop shows no person at all, the line does not apply.
```

## Items

**146 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/items/`.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.
- **The one exemption in this palette: the object's own material keeps its true colour.** A gold
  ring is gold-coloured, a silver ring is silver, steel is steel, copper is copper, brass is
  brass and glass is glass. A silver ring rendered in brown ink is a brown ring, and the subject
  of these pictures is the object -- so the metal is the one thing the sepia does not own.
- **It covers the OBJECT and nothing else.** The ground it sits on, the shadow it throws and the
  light falling across it stay the warm wash, exactly as everywhere else in the set. One lit
  object in true material against warm paper, not a coloured picture.
- **Silver, steel and pewter are near-white, not blue and not grey-blue** -- a bright metal is a
  VALUE and a set of reflections rather than a hue, which is how it is drawn here. Gold, brass,
  copper and bronze are already inside the warm range and need no special handling.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

Draw one hand's worth of object, drawn close and large.

MADE OF. 500gp -- silver, worked bronze and fine leather.
```

### Amulet of the Mended Thread

File: `items/amulet-of-the-mended-thread.webp`

```text
SUBJECT. "Amulet of the Mended Thread" — Wonder · A knotted thread in amber. The knot is tied, not drawn. · When you would drop to 0 Health, drop to 1 instead.

Draw hung on a cord and drawn hanging, turned off square.

MADE OF. 800gp -- gold, gilt and gems.
```

### Antidote

File: `items/antidote.webp`

```text
SUBJECT. "Antidote" — Consumable · Charcoal, milk thistle and something the brewer will not name.

Draw used up in the open: cloth, wax or powder, half gone.

MADE OF. 35gp -- green glass, cork and sealing wax.
```

### Arming Sword

File: `items/arming-sword.webp`

```text
SUBJECT. "Arming Sword" — Weapon · A plain single-handed blade. Every town has a smith who makes them.

Draw an edge, worn and sharpened back more than once.

MADE OF. 12gp -- wrought iron and seasoned wood.
```

### Arquebus

File: `items/arquebus.webp`

```text
SUBJECT. "Arquebus" — Weapon · Loud, slow, and it does not care what you are wearing.

Draw weight: the object sits, and the surface under it knows; the weapon drawn and held at tension.

MADE OF. 90gp -- wrought iron and seasoned wood.
```

### Assassin's Tincture

File: `items/assassins-tincture.webp`

```text
SUBJECT. "Assassin's Tincture" — Poison · Apply with a Ready. Next Strike that hits: Poisoned 1 (2), beginning at the start of their next turn. No save. · They finish the sentence ...

Draw a small dark bottle, labelled, a residue dried at the lip.

MADE OF. 120gp -- clear glass, a turned stopper and a written label.
```

### Balanced Dagger

File: `items/balanced-dagger.webp`

```text
SUBJECT. "Balanced Dagger" — Make

Draw a throwing knife standing upright on its point, balanced and perfectly still, the whole weight of it resting on a spot smaller than a fingernail.

MADE OF. 70gp -- wrought iron, brass or horn.
```

### Beggar's Bowl

File: `items/beggars-bowl.webp`

```text
SUBJECT. "Beggar's Bowl" — Wonder · Whatever is dropped in it stops being anybody's. · Lift Blessed or Cursed from anyone adjacent.

Draw set down on nothing, carried a long way among other things.

MADE OF. 500gp -- silver, worked bronze and fine leather.
```

### Black Lotus

File: `items/black-lotus.webp`

```text
SUBJECT. "Black Lotus" — Poison · Apply with a Ready. Next Strike that hits: Poisoned 3 (2), resist Might 9. · Illegal in every district, which is how you know the price is...

Draw a small dark bottle, labelled, a residue dried at the lip.

MADE OF. 250gp -- clear glass, a turned stopper and a written label.
```

### Blade of the Eager Hand

File: `items/blade-of-the-eager-hand.webp`

```text
SUBJECT. "Blade of the Eager Hand" — Wonder · It wants to be swung and it is not fussy about at what.

Draw held, or just set down, the grip polished by gripping.

MADE OF. 0gp -- tin, bone or fired clay.
```

### Blade Venom

File: `items/blade-venom.webp`

```text
SUBJECT. "Blade Venom" — Poison · Apply with a Ready. Next Strike that hits: Poisoned 1 (2), resist Might 5. · Brewed from something that was already unpleasant.

Draw a small dark bottle, labelled, a residue dried at the lip.

MADE OF. 40gp -- green glass, cork and sealing wax.
```

### Blunt Head

File: `items/blunt-head.webp`

```text
SUBJECT. "Blunt Head" — Ammunition · Bow or crossbow. The target is Off-Balance (1). No save. · No point at all, which is the point.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 20gp -- true ash, goose fletching and a forged head.
```

### Bodkin Points

File: `items/bodkin-points.webp`

```text
SUBJECT. "Bodkin Points" — Ammunition · Bow or crossbow. Ignores 2 armor. · A square spike, hardened. It is looking for a gap and will make one.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 25gp -- true ash, goose fletching and a forged head.
```

### Boots of the Long Step

File: `items/boots-of-the-long-step.webp`

```text
SUBJECT. "Boots of the Long Step" — Wonder · The soles are never quite worn in the same places twice. · Teleport to any square you can see within 6.

Draw worn unevenly, and the wear is the subject.

MADE OF. 450gp -- silver, worked bronze and fine leather.
```

### Bottle of Borrowed Pain

File: `items/bottle-of-borrowed-pain.webp`

```text
SUBJECT. "Bottle of Borrowed Pain" — Potion · It does not heal you. It postpones you.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 30gp -- green glass, cork and sealing wax.
```

### Brewer's Reserve

File: `items/brewers-reserve.webp`

```text
SUBJECT. "Brewer's Reserve" — Potion · The brewer keeps a cask of it back and will not say what is in it.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 45gp -- green glass, cork and sealing wax.
```

### Brigandine

File: `items/brigandine.webp`

```text
SUBJECT. "Brigandine" — Armor · Blocks Sidestep reactions. · Plates riveted between canvas. Heavy enough that you stop dodging.

Draw armour as worn metal and strap, not as a costume; weight: the object sits, and the surface under it knows.

MADE OF. 140gp -- polished steel plate and good strap.
```

### Buckler

File: `items/buckler.webp`

```text
SUBJECT. "Buckler" — Shield · A fist-sized iron plate. Better than the hand behind it.

Draw a shield, face on and slightly turned, its edge nicked from use.

MADE OF. 6gp -- boiled hide and a few iron scales.
```

### Cairn Stone

File: `items/cairn-stone.webp`

```text
SUBJECT. "Cairn Stone" — Wonder · Set it down: its square is high ground for the rest of the fight. · Set it down and the ground agrees to be taller.

Draw set down on nothing, carried a long way among other things.

MADE OF. 450gp -- silver, worked bronze and fine leather.
```

### Caltrops

File: `items/caltrops.webp`

```text
SUBJECT. "Caltrops" — Consumable

Draw four iron spikes welded so that one always points up, several of them scattered where they fell, seen from low down and close so the upward point is at eye level.

MADE OF. 12gp -- green glass, cork and sealing wax.
```

### Chalked Shaft

File: `items/chalked-shaft.webp`

```text
SUBJECT. "Chalked Shaft" — Ammunition · Bow or crossbow. The target is Marked (1). No save. · It leaves a smear that everyone can see and nobody can wipe off.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 40gp -- true ash, goose fletching and a forged head.
```

### Cleansing Draught

File: `items/cleansing-draught.webp`

```text
SUBJECT. "Cleansing Draught" — Consumable · A temple brews it and does not sell it gladly.

Draw used up in the open: cloth, wax or powder, half gone.

MADE OF. 150gp -- clear glass, a turned stopper and a written label.
```

### Climbing Rope

File: `items/climbing-rope.webp`

```text
SUBJECT. "Climbing Rope" — Tool · Fifty feet of hemp. Nobody falls alone.

Draw a tool worn exactly where a hand goes and nowhere else.

MADE OF. 5gp -- tin, bone or fired clay.
```

### Cloak of the Grey

File: `items/cloak-of-the-grey.webp`

```text
SUBJECT. "Cloak of the Grey" — Wonder · It is the colour of whatever is behind it. · Become Invisible (1).

Draw cloth with weight in it, hung from one point.

MADE OF. 500gp -- fine wool, linen lining and silver clasps.
```

### Cracked Spyglass

File: `items/cracked-spyglass.webp`

```text
SUBJECT. "Cracked Spyglass" — Wonder · Foresee one extra type at the start of a fight. · The crack does not matter. What you see through it has not happened yet.

Draw set down on nothing, carried a long way among other things.

MADE OF. 150gp -- silver, worked bronze and fine leather.
```

### Crossbow

File: `items/crossbow.webp`

```text
SUBJECT. "Crossbow" — Weapon · Anyone can be taught one in a week, which is why lords dislike them.

Draw the weapon drawn and held at tension.

MADE OF. 60gp -- wrought iron and seasoned wood.
```

### Crown of the Quiet Mind

File: `items/crown-of-the-quiet-mind.webp`

```text
SUBJECT. "Crown of the Quiet Mind" — Wonder · Thin gold. Nothing in your head hurries while it is on.

Draw shaped to a skull, the hollow drawn most carefully.

MADE OF. 1400gp -- gold, gilt and gems.
```

### Dagger

File: `items/dagger.webp`

```text
SUBJECT. "Dagger" — Weapon

Draw a short blade coming out of a sleeve, most of it still hidden, only the last inch of edge catching any light.

MADE OF. 2gp -- plain iron, barely better than a tool.
```

### Deep Pockets

File: `items/deep-pockets.webp`

```text
SUBJECT. "Deep Pockets" — Wonder

Draw a coat laid out flat and open with one pocket turned inside out, its linen lining pulled into a long sack plainly deeper than the coat it came out of, a small silver clasp still on the pocket's edge. Drawn square on and wider than it is tall, the cloth's own folds the only dark in it and nothing hanging anywhere.

MADE OF. 400gp -- fine wool, linen lining and silver clasps.
```

### Discriminating Wand

File: `items/discriminating-wand.webp`

```text
SUBJECT. "Discriminating Wand" — Wonder · Your Blasts count as Aimed. · It knows whose side everyone is on, which is more than most people do.

Draw held, or just set down, the grip polished by gripping.

MADE OF. 1100gp -- gold, gilt and gems.
```

### Draught of Lead

File: `items/draught-of-lead.webp`

```text
SUBJECT. "Draught of Lead" — Potion · Heavier than it looks, and so are you now.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 20gp -- green glass, cork and sealing wax.
```

### Draught of Second Breath

File: `items/draught-of-second-breath.webp`

```text
SUBJECT. "Draught of Second Breath" — Potion · One swallow and your lungs believe the fight has just started.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 90gp -- green glass, cork and sealing wax.
```

### Draught of the Hollow

File: `items/draught-of-the-hollow.webp`

```text
SUBJECT. "Draught of the Hollow" — Potion · It empties something you were not keeping track of.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 25gp -- green glass, cork and sealing wax.
```

### Drowned Bell

File: `items/drowned-bell.webp`

```text
SUBJECT. "Drowned Bell" — Wonder · It rings wet. There is no water in it. · Everything within 2 is Wet (1).

Draw hung at the hip, the strap cut off at the frame.

MADE OF. 400gp -- silver, worked bronze and fine leather.
```

### Drowsing Oil

File: `items/drowsing-oil.webp`

```text
SUBJECT. "Drowsing Oil" — Poison · Apply with a Ready. Next Strike that hits: Dazed (2), resist Might 5. · It does not kill. It makes a man slow about objecting.

Draw a small dark bottle, labelled, a residue dried at the lip.

MADE OF. 50gp -- green glass, cork and sealing wax.
```

### Elixir of the Long Night

File: `items/elixir-of-the-long-night.webp`

```text
SUBJECT. "Elixir of the Long Night" — Potion · It lends. It is very clear about lending.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 200gp -- clear glass, a turned stopper and a written label.
```

### Far-sight Monocle

File: `items/far-sight-monocle.webp`

```text
SUBJECT. "Far-sight Monocle" — Wonder · Your Ranged items' range is doubled. · Ground by somebody who had opinions about distance.

Draw shaped to a skull, the hollow drawn most carefully.

MADE OF. 700gp -- gold, gilt and gems.
```

### Fine Clothes

File: `items/fine-clothes.webp`

```text
SUBJECT. "Fine Clothes" — Station · Cut well enough that nobody asks who you are.

Draw a thing that says who somebody is before they speak.

MADE OF. 30gp -- good wool and boiled leather.
```

### Fine Longsword

File: `items/fine-longsword.webp`

```text
SUBJECT. "Fine Longsword" — Make · A smith's mark near the hilt, and worth asking after.

Draw made well, by somebody who signed nothing.

MADE OF. 90gp -- wrought iron, brass or horn.
```

### Fire Wand

File: `items/fire-wand.webp`

```text
SUBJECT. "Fire Wand" — Implement · Blackened at the tip, and warm even unused.

Draw scribed and calibrated, unreadable to anybody not taught it.

MADE OF. 0gp -- tin, bone or fired clay.
```

### Firepot

File: `items/firepot.webp`

```text
SUBJECT. "Firepot" — Consumable · Pitch and naphtha in a clay shell. It keeps burning.

Draw used up in the open: cloth, wax or powder, half gone.

MADE OF. 45gp -- green glass, cork and sealing wax.
```

### Flask of Ink

File: `items/flask-of-ink.webp`

```text
SUBJECT. "Flask of Ink" — Consumable · Cuttlefish black. It finds what is not there to be seen.

Draw used up in the open: cloth, wax or powder, half gone.

MADE OF. 20gp -- green glass, cork and sealing wax.
```

### Flask of Oil

File: `items/flask-of-oil.webp`

```text
SUBJECT. "Flask of Oil" — Consumable · Lamp oil, thrown low.

Draw used up in the open: cloth, wax or powder, half gone.

MADE OF. 10gp -- a clay bottle, a rag stopper and pitch.
```

### Focus Pendant

File: `items/focus-pendant.webp`

```text
SUBJECT. "Focus Pendant" — Power · Jeweller's work. The stone is not the point; the setting is.

Draw an object with more inside it than its size allows.

MADE OF. 400gp -- silver, worked bronze and fine leather.
```

### Frost-dipped Bolt

File: `items/frost-dipped-bolt.webp`

```text
SUBJECT. "Frost-dipped Bolt" — Ammunition · Crossbow. Frozen 1 (1). · Cold enough that the quiver frosts around it.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 60gp -- true ash, goose fletching and a forged head.
```

### Gag of the Nine

File: `items/gag-of-the-nine.webp`

```text
SUBJECT. "Gag of the Nine" — Wonder · Nine knots in a cord. Somebody counted them out loud, once. · One enemy within 3 is Silenced (1), resist Lore 5.

Draw hung on a cord and drawn hanging, turned off square.

MADE OF. 700gp -- gold, gilt and gems.
```

### Gambler's Coin

File: `items/gamblers-coin.webp`

```text
SUBJECT. "Gambler's Coin" — Wonder · It lands how you need it to, which is not the same as how you want it to. · Read 3 on your own fate deck.

Draw one hand's worth of object, drawn close and large.

MADE OF. 600gp -- silver, worked bronze and fine leather.
```

### Gaming Set

File: `items/gaming-set.webp`

```text
SUBJECT. "Gaming Set" — Station · Dice, a board and a cup. Soldiers will tell a stranger anything over it.

Draw a thing that says who somebody is before they speak.

MADE OF. 5gp -- tin, bone or fired clay.
```

### Gauntlet of the Open Palm

File: `items/gauntlet-of-the-open-palm.webp`

```text
SUBJECT. "Gauntlet of the Open Palm" — Wonder · Beautifully made, and it will not close.

Draw held, or just set down, the grip polished by gripping.

MADE OF. 0gp -- tin, bone or fired clay.
```

### Gorget of the Turned Blade

File: `items/gorget-of-the-turned-blade.webp`

```text
SUBJECT. "Gorget of the Turned Blade" — Wonder · Three old cuts in it, none of them deep. · Block 3 as a reaction.

Draw hung on a cord and drawn hanging, turned off square.

MADE OF. 450gp -- silver, worked bronze and fine leather.
```

### Grapnel Bolt

File: `items/grapnel-bolt.webp`

```text
SUBJECT. "Grapnel Bolt" — Ammunition · Crossbow. YOU are pulled to a square adjacent to the target. · Barbed, with fifty feet of silk line. A bolt for closing.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 70gp -- true ash, goose fletching and a forged head.
```

### Grave-cap Extract

File: `items/grave-cap-extract.webp`

```text
SUBJECT. "Grave-cap Extract" — Poison · Apply with a Ready. Next Strike that hits: Poisoned 2 (2), resist Might 7. · The cap grows on what is under the cairn, not on the cairn.

Draw a small dark bottle, labelled, a residue dried at the lip.

MADE OF. 90gp -- green glass, cork and sealing wax.
```

### Great Axe

File: `items/great-axe.webp`

```text
SUBJECT. "Great Axe" — Weapon

Draw a single-bitted axe head on a long haft, the bit chipped along its leading edge and re-ground behind the chips. Cheap work: no fuller, no inlay, a wedge and a nail.

MADE OF. 30gp -- wrought iron and seasoned wood.
```

### Great Helm

File: `items/great-helm.webp`

```text
SUBJECT. "Great Helm" — Armor · Disadvantage on Wits checks. · Safe, and you cannot hear a thing through it.

Draw armour as worn metal and strap, not as a costume; weight: the object sits, and the surface under it knows.

MADE OF. 40gp -- riveted iron and leather strap.
```

### Greater Healing Potion

File: `items/greater-healing-potion.webp`

```text
SUBJECT. "Greater Healing Potion" — Potion · Twice the price of the ordinary sort and rather more than twice the work.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 150gp -- clear glass, a turned stopper and a written label.
```

### Greatsword

File: `items/greatsword.webp`

```text
SUBJECT. "Greatsword" — Weapon

Draw four feet of straight blade filling the frame corner to corner at a slight diagonal, far too long for the picture, with a ricasso wrapped in leather halfway up it.

MADE OF. 40gp -- wrought iron and seasoned wood.
```

### Grey Water

File: `items/grey-water.webp`

```text
SUBJECT. "Grey Water" — Potion · Somebody corked it carefully, which is the cruellest part.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 5gp -- a clay bottle, a rag stopper and pitch.
```

### Halberd

File: `items/halberd.webp`

```text
SUBJECT. "Halberd" — Weapon · Axe, spike and hook on a six-foot shaft. Reaches over the man in front of you.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.

MADE OF. 35gp -- wrought iron and seasoned wood.
```

### Healer's Kit

File: `items/healers-kit.webp`

```text
SUBJECT. "Healer's Kit" — Tool

Draw a strip of cloth unrolled flat with its contents in sewn loops along it -- one curved needle, a hank of waxed gut, a folded wad of lint and a small stoppered bottle, laid out in that order. The kit is the whole subject: nobody is being treated, and there is no body, no wound and no blood in the frame.

MADE OF. 20gp -- wrought iron, brass or horn.
```

### Healing Potion

File: `items/healing-potion.webp`

```text
SUBJECT. "Healing Potion" — Consumable

Draw a stubby wide-mouthed bottle of something thick and dark that has settled, the sediment visible at the bottom and a fingerprint in the dust on the shoulder of the glass.

MADE OF. 50gp -- green glass, cork and sealing wax.
```

### Heavy Crossbow

File: `items/heavy-crossbow.webp`

```text
SUBJECT. "Heavy Crossbow" — Weapon · Cranked with a windlass. It goes through a shield and the arm behind it.

Draw weight: the object sits, and the surface under it knows; the weapon drawn and held at tension.

MADE OF. 120gp -- bright steel and fine leather.
```

### Helm of the Watchful

File: `items/helm-of-the-watchful.webp`

```text
SUBJECT. "Helm of the Watchful" — Wonder · You are never surprised and cannot be Dazed. · Nothing comes at you from a side you were not already watching.

Draw shaped to a skull, the hollow drawn most carefully.

MADE OF. 1500gp -- gold, gilt and gems.
```

### Hollow Bolt

File: `items/hollow-bolt.webp`

```text
SUBJECT. "Hollow Bolt" — Ammunition · Crossbow. Carries one potion; whatever you hit drinks it. · The shaft unscrews. A fiddly, brilliant, disreputable idea.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 30gp -- true ash, goose fletching and a forged head.
```

### Hollow Boots

File: `items/hollow-boots.webp`

```text
SUBJECT. "Hollow Boots" — Wonder · They sound like a far larger man coming. · Shove an adjacent enemy 2 squares.

Draw worn unevenly, and the wear is the subject.

MADE OF. 350gp -- silver, worked bronze and fine leather.
```

### Holy Symbol

File: `items/holy-symbol.webp`

```text
SUBJECT. "Holy Symbol" — Power · Whose, and how openly, is the only question that matters in Firma.

Draw an object with more inside it than its size allows.

MADE OF. 10gp -- tin, bone or fired clay.
```

### Hooked Gauntlet

File: `items/hooked-gauntlet.webp`

```text
SUBJECT. "Hooked Gauntlet" — Wonder · Three hooks along the knuckle, set the wrong way round. · An adjacent enemy is Disarmed (1), resist Might 5.

Draw held, or just set down, the grip polished by gripping.

MADE OF. 600gp -- silver, worked bronze and fine leather.
```

### Hourglass Charm

File: `items/hourglass-charm.webp`

```text
SUBJECT. "Hourglass Charm" — Wonder · The sand has not moved since you found it. · Swap your place in the initiative order with a willing ally.

Draw hung on a cord and drawn hanging, turned off square.

MADE OF. 550gp -- silver, worked bronze and fine leather.
```

### Hunting Traps

File: `items/hunting-traps.webp`

```text
SUBJECT. "Hunting Traps" — Tool · Jaws and a stake. Patience, mostly.

Draw a tool worn exactly where a hand goes and nowhere else.

MADE OF. 15gp -- wrought iron, brass or horn.
```

### Kite Shield

File: `items/kite-shield.webp`

```text
SUBJECT. "Kite Shield" — Shield · Long enough to cover the leg a horseman cannot move.

Draw a shield, face on and slightly turned, its edge nicked from use.

MADE OF. 24gp -- riveted iron and leather strap.
```

### Lance

File: `items/lance.webp`

```text
SUBJECT. "Lance" — Weapon · A couched lance is a horse's weight arriving at one point. Needs the horse.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.

MADE OF. 30gp -- wrought iron and seasoned wood.
```

### Lantern

File: `items/lantern.webp`

```text
SUBJECT. "Lantern" — Tool · Horn panes and a tallow dip. The squares it lights are not shadowed.

Draw a tool worn exactly where a hand goes and nowhere else.

MADE OF. 5gp -- tin, bone or fired clay.
```

### Leather Armor

File: `items/leather-armor.webp`

```text
SUBJECT. "Leather Armor" — Armor · Boiled and riveted, and it still smells of the tannery.

Draw armour as worn metal and strap, not as a costume.

MADE OF. 20gp -- riveted iron and leather strap.
```

### Light Helm

File: `items/light-helm.webp`

```text
SUBJECT. "Light Helm" — Armor · An open kettle. You can still hear and still see.

Draw armour as worn metal and strap, not as a costume.

MADE OF. 15gp -- riveted iron and leather strap.
```

### Locked Casket

File: `items/locked-casket.webp`

```text
SUBJECT. "Locked Casket" — Wonder · Holds one secret. Nobody but you may learn it, by any means. · No hinge, no seam, and a keyhole that is not for a key.

Draw set down on nothing, carried a long way among other things.

MADE OF. 500gp -- silver, worked bronze and fine leather.
```

### Lockpicks

File: `items/lockpicks.webp`

```text
SUBJECT. "Lockpicks" — Tool

Draw a strip of oiled cloth unrolled flat and empty, its sewn loops holding nothing at all, the tools long gone out of it. What they are is readable only in the cloth: a row of five slim dark stains worn into it where each slender one lay, and one flat wider stain across them. The cloth is the whole subject -- no tool of any kind in the frame, no metal, no lock, no keyhole, no door and no hand.

MADE OF. 25gp -- wrought iron, brass or horn.
```

### Longbow

File: `items/longbow.webp`

```text
SUBJECT. "Longbow" — Weapon · A yew stave taller than the archer. No reload -- that is what you are buying.

Draw weight: the object sits, and the surface under it knows; the weapon drawn and held at tension.

MADE OF. 50gp -- wrought iron and seasoned wood.
```

### Longsword

File: `items/longsword.webp`

```text
SUBJECT. "Longsword" — Weapon

Draw a plain cruciform hilt and the first hand's length of blade, the cross bar straight and square, nothing on it that was not needed to hold it.

MADE OF. 15gp -- wrought iron and seasoned wood.
```

### Loose Cobble

File: `items/loose-cobble.webp`

```text
SUBJECT. "Loose Cobble" — Wonder · Set it down. The first enemy to enter its square is Off-Balance (1). · It was part of a street once and has not forgiven anyone.

Draw set down on nothing, carried a long way among other things.

MADE OF. 300gp -- silver, worked bronze and fine leather.
```

### Mace

File: `items/mace.webp`

```text
SUBJECT. "Mace" — Weapon · Flanged. It does not cut, which is the point against a man in mail.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.

MADE OF. 10gp -- plain iron, barely better than a tool.
```

### Mail Shirt

File: `items/mail-shirt.webp`

```text
SUBJECT. "Mail Shirt" — Armor · Riveted rings to the hip. The soldier's compromise for eight hundred years.

Draw armour as worn metal and strap, not as a costume.

MADE OF. 70gp -- riveted iron and leather strap.
```

### Mantle of the Unburdened

File: `items/mantle-of-the-unburdened.webp`

```text
SUBJECT. "Mantle of the Unburdened" — Wonder · You are never Burdened or Overloaded, whatever you carry. · Everything you carry belongs to the cloak while you wear it.

Draw cloth with weight in it, hung from one point.

MADE OF. 900gp -- velvet, fur and gold thread.
```

### Marching Boots

File: `items/marching-boots.webp`

```text
SUBJECT. "Marching Boots" — Make · Difficult ground costs you 1 instead of 2. · Nailed soles. Rubble and mud stop being a decision.

Draw made well, by somebody who signed nothing.

MADE OF. 12gp -- wrought iron, brass or horn.
```

### Marked Arrowhead

File: `items/marked-arrowhead.webp`

```text
SUBJECT. "Marked Arrowhead" — Wonder · It has not been fired. It does not need to be. · One enemy you can see is Marked (1).

Draw hung at the hip, the strap cut off at the frame.

MADE OF. 350gp -- silver, worked bronze and fine leather.
```

### Masterwork Crossbow

File: `items/masterwork-crossbow.webp`

```text
SUBJECT. "Masterwork Crossbow" — Make · A steel prod and a goat's-foot lever. It reloads in the hand.

Draw made well, by somebody who signed nothing.

MADE OF. 300gp -- silver, worked bronze and fine leather.
```

### Matchlock Musket

File: `items/matchlock-musket.webp`

```text
SUBJECT. "Matchlock Musket" — Weapon · A rest to fire it from and a minute to load it. Worth both.

Draw weight: the object sits, and the surface under it knows; the weapon drawn and held at tension.

MADE OF. 150gp -- bright steel and fine leather.
```

### Matchlock Pistol

File: `items/matchlock-pistol.webp`

```text
SUBJECT. "Matchlock Pistol" — Weapon · One hand, so it goes beside a sword. A brace of them is two shots before a reload.

Draw the weapon drawn and held at tension.

MADE OF. 70gp -- wrought iron and seasoned wood.
```

### Mnemonic Stone

File: `items/mnemonic-stone.webp`

```text
SUBJECT. "Mnemonic Stone" — Wonder · One extra skill card in your skill deck, of any approach you already have. · Worn smooth by a thumb that was trying to remember something.

Draw one hand's worth of object, drawn close and large.

MADE OF. 800gp -- gold, gilt and gems.
```

### Moth-wing Fletching

File: `items/moth-wing-fletching.webp`

```text
SUBJECT. "Moth-wing Fletching" — Ammunition · Bow. This shot ignores cover entirely. · It does not fly straight. It arrives anyway.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 40gp -- true ash, goose fletching and a forged head.
```

### Net

File: `items/net.webp`

```text
SUBJECT. "Net" — Weapon · Weighted at the edges. The other half of a trident.

Draw quickness: the object is balanced on almost nothing; an object mid-flight, the hand that threw it out of frame.

MADE OF. 5gp -- plain iron, barely better than a tool.
```

### Net Bolt

File: `items/net-bolt.webp`

```text
SUBJECT. "Net Bolt" — Ammunition · Crossbow. Grappled (1), resist Might 5. · A folded net on a blunt head. It opens in the air.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 50gp -- true ash, goose fletching and a forged head.
```

### Oil of Mislaid Courage

File: `items/oil-of-mislaid-courage.webp`

```text
SUBJECT. "Oil of Mislaid Courage" — Potion · Whatever was going to make you flinch has been taken out.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 20gp -- green glass, cork and sealing wax.
```

### Oil-wrapped Shaft

File: `items/oil-wrapped-shaft.webp`

```text
SUBJECT. "Oil-wrapped Shaft" — Ammunition · Bow or crossbow. Burning 1 (2). · Tow and pitch below the head. Lit from the match in your teeth.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 45gp -- true ash, goose fletching and a forged head.
```

### Pact Iron

File: `items/pact-iron.webp`

```text
SUBJECT. "Pact Iron" — Wonder · Cold iron takes a debt and holds it for a while. · One Taint card is set aside for the rest of the fight.

Draw one hand's worth of object, drawn close and large.

MADE OF. 1600gp -- gold, gilt and gems.
```

### Philtre of Borrowed Courage

File: `items/philtre-of-borrowed-courage.webp`

```text
SUBJECT. "Philtre of Borrowed Courage" — Potion · Somebody else's nerve, and they are not getting it back.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 65gp -- green glass, cork and sealing wax.
```

### Philtre of the Loose Tongue

File: `items/philtre-of-the-loose-tongue.webp`

```text
SUBJECT. "Philtre of the Loose Tongue" — Potion · You will mean to stop talking.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 15gp -- green glass, cork and sealing wax.
```

### Pike

File: `items/pike.webp`

```text
SUBJECT. "Pike" — Weapon · Eighteen feet. Magnificent in a line and worthless on your own.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.

MADE OF. 20gp -- wrought iron and seasoned wood.
```

### Pilgrim's Shoes

File: `items/pilgrims-shoes.webp`

```text
SUBJECT. "Pilgrim's Shoes" — Wonder · One extra rest token on every long rest. · Worn by somebody who got where they were going.

Draw worn unevenly, and the wear is the subject.

MADE OF. 90gp -- wrought iron, brass or horn.
```

### Pilgrim's Token

File: `items/pilgrims-token.webp`

```text
SUBJECT. "Pilgrim's Token" — Power · Tin, stamped at a shrine. Worth nothing and proof of everything.

Draw an object with more inside it than its size allows.

MADE OF. 3gp -- tin, bone or fired clay.
```

### Plate

File: `items/plate.webp`

```text
SUBJECT. "Plate" — Armor · Blocks Sidestep reactions. · Half your carry allowance, and nothing short of a ball goes through it.

Draw armour as worn metal and strap, not as a costume; weight: the object sits, and the surface under it knows.

MADE OF. 400gp -- polished steel plate and good strap.
```

### Potion of Iron Skin

File: `items/potion-of-iron-skin.webp`

```text
SUBJECT. "Potion of Iron Skin" — Potion · It goes down like filings and sits there like a breastplate.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 120gp -- clear glass, a turned stopper and a written label.
```

### Potion of Stone

File: `items/potion-of-stone.webp`

```text
SUBJECT. "Potion of Stone" — Potion · Grit in the bottom of the flask, and it settles in you the same way.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 40gp -- green glass, cork and sealing wax.
```

### Potion of the Bear

File: `items/potion-of-the-bear.webp`

```text
SUBJECT. "Potion of the Bear" — Potion · Thick as honey. You will want both hands to lift the bottle.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 60gp -- green glass, cork and sealing wax.
```

### Potion of the Hare

File: `items/potion-of-the-hare.webp`

```text
SUBJECT. "Potion of the Hare" — Potion · It tastes of running, which is not a taste anyone can describe.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 55gp -- green glass, cork and sealing wax.
```

### Potion of the Owl

File: `items/potion-of-the-owl.webp`

```text
SUBJECT. "Potion of the Owl" — Potion · Your eyes do not change. What they are willing to see does.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 70gp -- green glass, cork and sealing wax.
```

### Potion of the Quick Hand

File: `items/potion-of-the-quick-hand.webp`

```text
SUBJECT. "Potion of the Quick Hand" — Potion · You will have put the bottle down before you remember drinking it.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 110gp -- clear glass, a turned stopper and a written label.
```

### Proofed Mail

File: `items/proofed-mail.webp`

```text
SUBJECT. "Proofed Mail" — Make · Tested against a bodkin at ten paces and dented, not pierced.

Draw made well, by somebody who signed nothing.

MADE OF. 320gp -- fine wool, linen lining and silver clasps.
```

### Quartermaster's Belt

File: `items/quartermasters-belt.webp`

```text
SUBJECT. "Quartermaster's Belt" — Wonder · Everything hangs lighter on it. Nobody knows why and nobody asks twice.

Draw hung at the hip, the strap cut off at the frame.

MADE OF. 300gp -- silver, worked bronze and fine leather.
```

### Reaver's Edge

File: `items/reavers-edge.webp`

```text
SUBJECT. "Reaver's Edge" — Wonder · It eats what it meets, slowly, and starts with the armour.

Draw held, or just set down, the grip polished by gripping.

MADE OF. 1300gp -- gold, gilt and gems.
```

### Reliquary Band

File: `items/reliquary-band.webp`

```text
SUBJECT. "Reliquary Band" — Power · A splinter of someone's finger under glass.

Draw an object with more inside it than its size allows.

MADE OF. 350gp -- silver, worked bronze and fine leather.
```

### Repair Kit

File: `items/repair-kit.webp`

```text
SUBJECT. "Repair Kit" — Tool · Files, rivets, pitch and wire. What acid leaves behind is work, not loss.

Draw a tool worn exactly where a hand goes and nowhere else.

MADE OF. 30gp -- wrought iron, brass or horn.
```

### Ring of the Open Hand

File: `items/ring-of-the-open-hand.webp`

```text
SUBJECT. "Ring of the Open Hand" — Power · You may Cast without a free hand. · Plain silver, worn thin. The gesture is already in it.

Draw an object with more inside it than its size allows.

MADE OF. 600gp -- silver, worked bronze and fine leather.
```

### Screaming Shaft

File: `items/screaming-shaft.webp`

```text
SUBJECT. "Screaming Shaft" — Ammunition · Bow. Dazed (1), resist Presence 5. · Bored through so the air goes through it wrong.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 35gp -- true ash, goose fletching and a forged head.
```

### Serpent's Milk

File: `items/serpents-milk.webp`

```text
SUBJECT. "Serpent's Milk" — Poison · Apply with a Ready. Next Strike that hits: Poisoned 0 (3) -- no damage, three rounds without a secondary. · Milked, strained and kept cold...

Draw a small dark bottle, labelled, a residue dried at the lip.

MADE OF. 70gp -- green glass, cork and sealing wax.
```

### Serpent's Tooth Ring

File: `items/serpents-tooth-ring.webp`

```text
SUBJECT. "Serpent's Tooth Ring" — Wonder · A fang set as a stone, still wet at the root. · One adjacent enemy is Poisoned 1 (2).

Draw one hand's worth of object, drawn close and large.

MADE OF. 850gp -- gold, gilt and gems.
```

### Sessyfyn's Tear

File: `items/sessyfyns-tear.webp`

```text
SUBJECT. "Sessyfyn's Tear" — Relic · Obligation: a permanent Miss AND a permanent Critical in your fate deck. · Seawater that has not dried in four hundred years. · Any one fat...

Draw worn through at the one spot a thumb has found.

MADE OF. 3000gp -- gold, gilt and gems.
```

### Shortbow

File: `items/shortbow.webp`

```text
SUBJECT. "Shortbow" — Weapon · Horn and sinew, strung short for close country.

Draw the weapon drawn and held at tension.

MADE OF. 25gp -- wrought iron and seasoned wood.
```

### Signet Ring

File: `items/signet-ring.webp`

```text
SUBJECT. "Signet Ring" — Station · A house, a seal, and somebody who will answer for you.

Draw a thing that says who somebody is before they speak.

MADE OF. 60gp -- wrought iron, brass or horn.
```

### Silvered Head

File: `items/silvered-head.webp`

```text
SUBJECT. "Silvered Head" — Ammunition · Bow or crossbow. You may target an Invisible enemy you have seen this fight. · Silver remembers what it was aimed at.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 90gp -- true ash, goose fletching and a forged head.
```

### Smith's Hammer

File: `items/smiths-hammer.webp`

```text
SUBJECT. "Smith's Hammer" — Make · A cross-pein and a sense of what metal wants.

Draw made well, by somebody who signed nothing.

MADE OF. 18gp -- wrought iron, brass or horn.
```

### Smoke Bomb

File: `items/smoke-bomb.webp`

```text
SUBJECT. "Smoke Bomb" — Consumable · A waxed clay ball, heavier than it looks.

Draw used up in the open: cloth, wax or powder, half gone.

MADE OF. 40gp -- green glass, cork and sealing wax.
```

### Spear

File: `items/spear.webp`

```text
SUBJECT. "Spear" — Weapon · The cheapest thing that keeps a man at arm's length.

Draw an edge, worn and sharpened back more than once; an object mid-flight, the hand that threw it out of frame.

MADE OF. 8gp -- plain iron, barely better than a tool.
```

### Staff of Healing

File: `items/staff-of-healing.webp`

```text
SUBJECT. "Staff of Healing" — Implement · Pale wood, warm to the touch.

Draw scribed and calibrated, unreadable to anybody not taught it.

MADE OF. 0gp -- tin, bone or fired clay.
```

### Surgeon's Pin

File: `items/surgeons-pin.webp`

```text
SUBJECT. "Surgeon's Pin" — Wonder · Silver, and it has closed worse than this. · Remove one Wound from an ally.

Draw hung on a cord and drawn hanging, turned off square.

MADE OF. 900gp -- gold, gilt and gems.
```

### Surveyor's Chain

File: `items/surveyors-chain.webp`

```text
SUBJECT. "Surveyor's Chain" — Wonder · In a challenge, your first Progress each scene is free. · Sixty-six feet of brass links that measure what matters rather than what is there.

Draw set down on nothing, carried a long way among other things.

MADE OF. 600gp -- silver, worked bronze and fine leather.
```

### The Black Lantern

File: `items/the-black-lantern.webp`

```text
SUBJECT. "The Black Lantern" — Relic · Every square within 3 is shadowed, your enemies' included. Obligation: you may never carry any other light. · It is lit. You can tell becau...

Draw worn through at the one spot a thumb has found.

MADE OF. 3500gp -- gold, gilt and gems.
```

### The Hungry Blade

File: `items/the-hungry-blade.webp`

```text
SUBJECT. "The Hungry Blade" — Relic · Obligation: a bound Taint the first round of each fight it does not kill.

Draw a heavy sword lying flat and alone, its edge rounded blunt down the whole length with no bevel ground into it anywhere, the steel dark and close-grained like a bar stock that was never meant to cut. Nothing on the blade: no mark, no stain, no blood, no wound and no person in the frame.

MADE OF. 4000gp -- gold, gilt and gems.
```

### The Kit

File: `items/the-kit.webp`

```text
SUBJECT. "The Kit" — Tool

Draw a fat canvas roll tied shut with a leather thong, worn pale and shiny at both ends by years of being carried and never set down. It stays closed and what is inside it is never shown: no tool, no lock, no door and no hand in the frame.

MADE OF. 0gp -- tin, bone or fired clay.
```

### The Pale Crown

File: `items/the-pale-crown.webp`

```text
SUBJECT. "The Pale Crown" — Relic · Obligation: you may never wear armour, and nobody but you may heal you. · Bone, and lighter than bone should be.

Draw worn through at the one spot a thumb has found.

MADE OF. 5000gp -- gold, gilt and gems.
```

### The Quenched Blade

File: `items/the-quenched-blade.webp`

```text
SUBJECT. "The Quenched Blade" — Wonder · Quenched in something that is still angry about it.

Draw held, or just set down, the grip polished by gripping.

MADE OF. 2000gp -- gold, gilt and gems.
```

### The Scrivener's Knife

File: `items/the-scriveners-knife.webp`

```text
SUBJECT. "The Scrivener's Knife" — Wonder · For cutting out what should not have been written. · Prune one card from your action deck for the rest of the day.

Draw set down on nothing, carried a long way among other things.

MADE OF. 1200gp -- gold, gilt and gems.
```

### The Unquiet Quiver

File: `items/the-unquiet-quiver.webp`

```text
SUBJECT. "The Unquiet Quiver" — Relic · Every piece of magical ammunition you fire returns to it when the fight ends. Obligation: it will not hold ordinary arrows, and you may car...

Draw worn through at the one spot a thumb has found.

MADE OF. 4500gp -- gold, gilt and gems.
```

### Thunder-shot

File: `items/thunder-shot.webp`

```text
SUBJECT. "Thunder-shot" — Ammunition · Firearm only. The shot is Blast 1 on the target's square. · A paper cartridge of scrap. Nothing else gives a non-caster an area.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 80gp -- true ash, goose fletching and a forged head.
```

### Thunderstone

File: `items/thunderstone.webp`

```text
SUBJECT. "Thunderstone" — Wonder · Throw it down hard. Do not be holding it. · One enemy within 3 is Stunned (1), resist Might 7.

Draw set down on nothing, carried a long way among other things.

MADE OF. 650gp -- gold, gilt and gems.
```

### Tincture of the Clear Eye

File: `items/tincture-of-the-clear-eye.webp`

```text
SUBJECT. "Tincture of the Clear Eye" — Potion · Cloudy, and it stings going down.

Draw a glass vial, stoppered, with less in it than there was.

MADE OF. 30gp -- green glass, cork and sealing wax.
```

### Tinker's Thimble

File: `items/tinkers-thimble.webp`

```text
SUBJECT. "Tinker's Thimble" — Wonder · Strain costs you one card fewer, to a minimum of 1. · Brass, and far too small for whoever made it.

Draw one hand's worth of object, drawn close and large.

MADE OF. 80gp -- wrought iron, brass or horn.
```

### Tower Shield

File: `items/tower-shield.webp`

```text
SUBJECT. "Tower Shield" — Shield · A wall for a man who has decided not to go anywhere.

Draw a shield, face on and slightly turned, its edge nicked from use; weight: the object sits, and the surface under it knows.

MADE OF. 45gp -- riveted iron and leather strap.
```

### Travelling Cloak

File: `items/travelling-cloak.webp`

```text
SUBJECT. "Travelling Cloak" — Station · Oiled wool. The difference between a wet night and an unbearable one.

Draw a thing that says who somebody is before they speak.

MADE OF. 8gp -- sacking and undyed wool.
```

### Trident

File: `items/trident.webp`

```text
SUBJECT. "Trident" — Weapon · Arena work. The crowd likes the shape of it.

Draw an edge, worn and sharpened back more than once.

MADE OF. 18gp -- wrought iron and seasoned wood.
```

### Vagrant's Charm

File: `items/vagrants-charm.webp`

```text
SUBJECT. "Vagrant's Charm" — Wonder · You are never Exhausted. · A knot of road-dust and hair. Its owner never sat down.

Draw hung on a cord and drawn hanging, turned off square.

MADE OF. 950gp -- gold, gilt and gems.
```

### Warden's Seal

File: `items/wardens-seal.webp`

```text
SUBJECT. "Warden's Seal" — Power · A tower in relief, worn smooth by thumbs that are not yours.

Draw an object with more inside it than its size allows.

MADE OF. 500gp -- silver, worked bronze and fine leather.
```

### Warhammer

File: `items/warhammer.webp`

```text
SUBJECT. "Warhammer" — Weapon · A beak on one side for the plate and a hammer on the other for the man in it.

Draw weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once.

MADE OF. 25gp -- wrought iron and seasoned wood.
```

### Weeping Resin

File: `items/weeping-resin.webp`

```text
SUBJECT. "Weeping Resin" — Poison · Apply with a Ready. Next Strike that hits: the target cannot be healed for 2 rounds. No save. · The wound will not close while it is in th...

Draw a small dark bottle, labelled, a residue dried at the lip.

MADE OF. 60gp -- green glass, cork and sealing wax.
```

### Whetstone of the Last Edge

File: `items/whetstone-of-the-last-edge.webp`

```text
SUBJECT. "Whetstone of the Last Edge" — Wonder · It takes something back out of a blade that has given everything. · One Spent card returns to your discard.

Draw set down on nothing, carried a long way among other things.

MADE OF. 60gp -- wrought iron, brass or horn.
```

### Whistling Shaft

File: `items/whistling-shaft.webp`

```text
SUBJECT. "Whistling Shaft" — Ammunition · Bow. The target is Compelled (1) -- at you. · Whoever it passes becomes very interested in who sent it.

Draw one round out of the bundle, its point drawn sharply.

MADE OF. 55gp -- true ash, goose fletching and a forged head.
```

### Winter Cloak

File: `items/winter-cloak.webp`

```text
SUBJECT. "Winter Cloak" — Wonder · The hem is always a little frozen, in any season. · Everything adjacent to you is Slowed (1).

Draw cloth with weight in it, hung from one point.

MADE OF. 750gp -- velvet, fur and gold thread.
```

### Wooden Shield

File: `items/wooden-shield.webp`

```text
SUBJECT. "Wooden Shield" — Shield · Banded oak, scarred across the face.

Draw a shield, face on and slightly turned, its edge nicked from use.

MADE OF. 10gp -- boiled hide and a few iron scales.
```

## NPC gear

**11 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/items/npc/`.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.
- **The one exemption in this palette: the object's own material keeps its true colour.** A gold
  ring is gold-coloured, a silver ring is silver, steel is steel, copper is copper, brass is
  brass and glass is glass. A silver ring rendered in brown ink is a brown ring, and the subject
  of these pictures is the object -- so the metal is the one thing the sepia does not own.
- **It covers the OBJECT and nothing else.** The ground it sits on, the shadow it throws and the
  light falling across it stay the warm wash, exactly as everywhere else in the set. One lit
  object in true material against warm paper, not a coloured picture.
- **Silver, steel and pewter are near-white, not blue and not grey-blue** -- a bright metal is a
  VALUE and a set of reflections rather than a hue, which is how it is drawn here. Gold, brass,
  copper and bronze are already inside the warm range and need no special handling.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

### Carved Idol

File: `items/npc/carved-idol.webp`

```text
SUBJECT. "Carved Idol" — Focus

Draw a god-figure the size of a fist, cut from one piece of wood by somebody with more faith than skill: the face barely a face, the body a column, worn smooth at the shoulders from being held.

MADE OF. 0gp -- tin, bone or fired clay.
```

### Dark Lantern

File: `items/npc/dark-lantern.webp`

```text
SUBJECT. "Dark Lantern" — Focus

Draw a shuttered lantern seen close, its panels shut and one narrow slit open, the bar of light out of that slit drawn as a single clean-edged wedge of bare paper with a few hatch strokes only where the wedge ends. Its tin body and shutters are the only ink in the frame: the room is not drawn at all, there is no wash anywhere, and the dark here is ink or it is nothing -- never a colour, never a blue, never a grey.

MADE OF. 0gp -- tin, bone or fired clay.
```

### Demon's Sigil

File: `items/npc/demons-sigil.webp`

```text
SUBJECT. "Demon's Sigil" — Focus

Draw a mark burned into a flat surface and still smoking faintly at the edges -- not written, pressed. Geometric, closed, and the wood or stone around it curled away from the heat.

MADE OF. 0gp -- tin, bone or fired clay.
```

### Goblin Fetish

File: `items/npc/goblin-fetish.webp`

```text
SUBJECT. "Goblin Fetish" — Focus

Draw a bundle of knotted hair, bone and string hung from a bent stick, turning slowly on its own with nobody within reach of it.

MADE OF. 0gp -- tin, bone or fired clay.
```

### Goblin Shield

File: `items/npc/goblin-shield.webp`

```text
SUBJECT. "Goblin Shield" — Shield

Draw a shield, face on and slightly turned, its edge nicked from use; grown rather than forged -- chitin, horn, tooth or claw, still part of a body.

MADE OF. 0gp -- boiled hide and a few iron scales.
```

### Goblin Shortbow

File: `items/npc/goblin-shortbow.webp`

```text
SUBJECT. "Goblin Shortbow" — Weapon

Draw the weapon drawn and held at tension.

MADE OF. 0gp -- plain iron, barely better than a tool.
```

### Goblin Spear

File: `items/npc/goblin-spear.webp`

```text
SUBJECT. "Goblin Spear" — Weapon

Draw an edge, worn and sharpened back more than once.

MADE OF. 0gp -- plain iron, barely better than a tool.
```

### Grave Candle

File: `items/npc/grave-candle.webp`

```text
SUBJECT. "Grave Candle" — Focus

Draw a stub of candle burning low on a flat stone, the flame standing perfectly upright and still in air that is plainly moving everything else.

MADE OF. 0gp -- tin, bone or fired clay.
```

### Mole Pick

File: `items/npc/mole-pick.webp`

```text
SUBJECT. "Mole Pick" — Weapon

Draw an edge, worn and sharpened back more than once; grown rather than forged -- chitin, horn, tooth or claw, still part of a body.

MADE OF. 0gp -- plain iron, barely better than a tool.
```

### Tarnkappe

File: `items/npc/tarnkappe.webp`

```text
SUBJECT. "Tarnkappe" — Wonder ·  · Become Invisible (1).

Draw a small grey cap, shapeless and greasy with age, lying where it was dropped -- and the patch of ground beneath it not quite as present as the ground around it.

MADE OF. 0gp -- tin, bone or fired clay.
```

### Troll Club

File: `items/npc/troll-club.webp`

```text
SUBJECT. "Troll Club" — Weapon

Draw an edge, worn and sharpened back more than once; weight: the object sits, and the surface under it knows.

MADE OF. 0gp -- plain iron, barely better than a tool.
```

## Natural weapons

**19 prompts.** **2:3, 1024 × 1536.** Files go under `cardrpg/art/items/natural/`.

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
- **A strip of bare paper across the very top, between an eighth and a sixth of the height, and
  no more than that.** No head, no helmet, no horns, no weapon, no hand, no banner enters it, and
  it is a narrow strip rather than an empty upper third.
- **All of the dark lives in the band from an eighth of the height down to just under halfway**,
  and it begins immediately under the bare strip with nothing empty between the two. The
  near-black contour, the deepest wash and the point of the action -- a face, a blade's edge, the point of the gesture -- are all in that band, which is where
  the picture actually happens.
- **Below the halfway line the picture goes pale** and stays pale: the wash thins out, the ground
  falls away to bare paper, and there is no dark mass down there at all. The card prints its rules
  across that half, so that half has to be the quiet one.
- Together those two make the test: **the picture must still read with its bottom half covered.**
  Cover it in your head and check before you call it done.
- **If the subject is taller than that band, CROP it rather than shrink it.** A bow, a raised
  arm, a spear, a standing figure: the frame cuts through it and the part that matters stays in
  the band. Never fit a tall thing in by making it small, and never let its top reach into the
  bare strip to get all of it in.
- ONE subject. A silhouette that still reads at **128 pixels wide**, which is the smallest size a
  card is drawn at in this game.

PALETTE.
- Line and darks: **#1b1714**
- Paper and lights: **#f4efe6**
- Mid tone: **#c9bda8**
- One chromatic accent only: **#a3655d**, a warm brick red. Use it on the
  one thing the picture is about, and nowhere else.
  **The accent is one small object's worth of colour and no more** -- a single
  ribbon, a single flame, one stone set in a ring. Never the light, never the wash, never
  the ground, never the sky, never a glow and never a whole figure: those are all the warm
  neutral of the paper and the ink.
- Desaturated and earthy. Warm throughout. **No cyan, no teal, no blue, no green, no purple, no magenta, no neon.**
  Every hue in the picture is between red and amber Earth
  here is bare and brown; there is no grass, no moss and no foliage anywhere in this set.
- **The one exemption in this palette: the object's own material keeps its true colour.** A gold
  ring is gold-coloured, a silver ring is silver, steel is steel, copper is copper, brass is
  brass and glass is glass. A silver ring rendered in brown ink is a brown ring, and the subject
  of these pictures is the object -- so the metal is the one thing the sepia does not own.
- **It covers the OBJECT and nothing else.** The ground it sits on, the shadow it throws and the
  light falling across it stay the warm wash, exactly as everywhere else in the set. One lit
  object in true material against warm paper, not a coloured picture.
- **Silver, steel and pewter are near-white, not blue and not grey-blue** -- a bright metal is a
  VALUE and a set of reflections rather than a hue, which is how it is drawn here. Gold, brass,
  copper and bronze are already inside the warm range and need no special handling.

PEOPLE.
- **Where a person is drawn, decide who they are rather than defaulting.** This is a port city on
  a trade road: the people in the set are Black, brown, Levantine, Persian, South and East Asian,
  Mediterranean and northern-pale in roughly the proportions a crowd there would be, and women
  are as common in it as men. A sepia palette is not a statement about skin -- warm ink renders
  every complexion, and a deck in which every figure is the same pale man is a failure of the
  drawing and not of the paper.
- Nothing here asks for a particular face unless the subject says so in words, and where it does
  say so -- a named sex, an ancestry, an age -- that is binding.

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

### Burning Grasp

File: `items/natural/burning-grasp.webp`

```text
SUBJECT. "Burning Grasp" — Natural

Draw a huge open hand reaching with no weapon in it, the skin split into plates like cooled lava and the cracks between them inked near-black, widest across the palm. Drawn from the wrist and no further -- no arm, no body -- and the heat in the splits is bare paper rather than a colour or a glow.
```

### Claws

File: `items/natural/claws.webp`

```text
SUBJECT. "Claws" — Natural

Draw four hooked claws splayed at full reach, no two the same length, the tips worn pale where they have been dragged across stone.
```

### Crushing Coils

File: `items/natural/crushing-coils.webp`

```text
SUBJECT. "Crushing Coils" — Natural

Draw a thick loop of serpent body closed on something that is no longer the shape it was, the head nowhere in the picture. Nothing is being bitten: the body is the weapon.
```

### Dragon Jaws

File: `items/natural/dragon-jaws.webp`

```text
SUBJECT. "Dragon Jaws" — Natural

Draw a mouth that could take a horse, open and side-on, the teeth uneven and overlapping and the gum line drawn back. Scale rather than chitin, and old -- several teeth broken off short.
```

### Draining Bite

File: `items/natural/draining-bite.webp`

```text
SUBJECT. "Draining Bite" — Natural

Draw a mouth opened wider than a jaw should allow, two long teeth set well back and wet, and nothing else of the face in frame.
```

### Elf-Bolt

File: `items/natural/elf-bolt.webp`

```text
SUBJECT. "Elf-Bolt" — Focus

Draw a small knapped flint arrowhead lying in the palm of a human hand, far too old to belong to anyone living. Nothing about it is moving, and the hand is holding it very still.
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

### Grave-Cold Hands

File: `items/natural/grave-cold-hands.webp`

```text
SUBJECT. "Grave-Cold Hands" — Natural

Draw two hands that have been underground: nails grown long and split, the skin drawn tight and dark over the bones, closing on nothing with far more grip than they ought to have.
```

### Heavy Mandibles

File: `items/natural/heavy-mandibles.webp`

```text
SUBJECT. "Heavy Mandibles" — Natural

Draw jaws as thick as forearms, chipped and blunt rather than sharp, closing slowly on something that has already stopped resisting.
```

### Killing Frost

File: `items/natural/killing-frost.webp`

```text
SUBJECT. "Killing Frost" — Natural

Draw frost taking hold where no frost should be: a hard-edged patch of it spreading across standing grass and dark wet earth, the blades inside the edge furred stiff and the ones outside it still soft, the line between them sharp enough to trace. The frost is bare paper and the earth is ink; nothing holds it and nobody is in the frame.
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

### Thrown Stone

File: `items/natural/thrown-stone.webp`

```text
SUBJECT. "Thrown Stone" — Natural

Draw a boulder in flight, turning, the hand that threw it already gone from the frame and the shadow of it running ahead across the ground it is about to reach.
```

### Troll Fists

File: `items/natural/troll-fists.webp`

```text
SUBJECT. "Troll Fists" — Natural

Draw two hands the size of millstones hanging open at rest, the knuckles split and healed over again into grey callus. Nothing is being held and nothing needs to be.
```

### Tusks

File: `items/natural/tusks.webp`

```text
SUBJECT. "Tusks" — Natural

Draw two curved tusks worn smooth along their undersides by digging, swung upward from below with soil still coming off them.
```

## Creature tokens

**112 prompts.** **1:1, 1024 × 1024, transparent.** Files go under `cardrpg/art/tokens/`.

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
- **One creature, and one only.** Not a pair, not a group, not a smaller one at its feet for
  scale, no mount, no attendant, no victim, no bystander, no second head and no second figure
  anywhere in the square. A token is placed on one square of a map and moved as one thing. The
  single exception is a creature whose own description says in words that it is a crowd.
- **Nothing in the square but the creature and what it is holding.** No cargo, no crates, no
  furniture, no wall, no doorway, no scenery and no ground -- those belong to the map underneath.
- **The anatomy has to close.** Count the limbs against the description and draw exactly that
  many: four legs on a quadruped, two on a biped, one tail and not two. A tail, a wing or a neck
  grows out of the body in one unbroken line and is part of it -- never a separate shape floating
  near the place it should join.
- Seen from **above at a three-quarter angle**, consistently, as a figure on a table is seen by
  the people around it. Never a portrait, never a side elevation.
- The silhouette does the work: this will be looked at beside twenty other tokens at 60 pixels,
  and the only question that matters is *which creature is that*.

PALETTE.
- **The creature is its own colour.** Draw it as the thing actually is: a mossy troll is green, a
  drowned corpse is hel-bla, a hairless hide is grey. Nothing here is held to the warm palette the
  cards use.
- Desaturated and natural rather than bright -- this is still ink and wash, not poster paint -- but
  the hue belongs to the animal and not to the deck.
- Line and darks stay **#1b1714**, so a token reads as drawn by the same hand.

PEOPLE.
- **Where the creature is a person, the description says which person**, and it is binding: the
  sex, the ancestry and the age given at the end of the subject are not a suggestion and not a
  default to fall back from. Draw that person.
- Where it does not say, do not reach for the same figure twice. These are the inhabitants of a
  port city on a trade road and they look like it.

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

### Alp

File: `tokens/alp.webp`

```text
SUBJECT. "Alp" — Health 12 · speed 4 · Draining Bite, Tarnkappe — a small hunched night-thing wearing a shabby grey cap pulled low -- the Tarnkappe, and it is the only thing on it that reads as clothing. Thin, long-fingered, far too light for its size, drawn crouching as though on someone's ribs

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Armored Slug

File: `tokens/armored-slug.webp`

```text
SUBJECT. "Armored Slug" — Health 16 · armour 4 · speed 1 · Acid Spray — slow, armoured, and it does not need to reach you

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Armored Slug Spitter

File: `tokens/armored-slug-spitter.webp`

```text
SUBJECT. "Armored Slug Spitter" — Health 12 · armour 3 · speed 2 · Acid Spray — A Armored Slug: slow, armoured, and it does not need to reach you This one thinner shell, longer reach of acid: it is here to ruin somebody's concentration

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Artillerist

File: `tokens/artillerist.webp`

```text
SUBJECT. "Artillerist" — Health 14 · armour 3 · speed 2 · Matchlock Musket, Brigandine — A Guild Engineer: an engineer caught at the work rather than at the gun: sleeves rolled over a leather apron, a cloth cap, both hands on a tool -- a c... This one the same engineer, but down behind a long musket on a forked rest and sighting along it: shoulders low, cheek to the stock, goggles down over the eyes, a second charge between the teeth. The gun is the whole silhouette where the Engineer's was the tools Draw this one as a man of North African appearance, past fifty -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Baal Fagor

File: `tokens/baal-fagor.webp`

```text
SUBJECT. "Baal Fagor" — Health 68 · armour 5 · speed 5 · Burning Grasp, Fire Spray, Demon's Sigil — a demon that became a god: enormous, horned, cracked black hide with fire in every split, wings of smoke rather than membrane. Everything within reach of it is already burning. Grander and more deliberate than the Div, which is merely large

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Bandit

File: `tokens/bandit.webp`

```text
SUBJECT. "Bandit" — Health 8 · armour 1 · speed 4 · Arming Sword, Leather Armor — one roadside robber in mismatched gear: a good sword, a bad coat, a hood or a scarf across the face. Everything worn looks taken off somebody else, because it was Draw this one as a woman of West African appearance, past fifty -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Berserker

File: `tokens/berserker.webp`

```text
SUBJECT. "Berserker" — Health 14 · speed 5 · Great Axe — bare-armed and unarmoured, a great axe in both hands, hair matted and the pupils wrong. Pelts at the shoulder rather than armour. Caught mid-stride with no guard up at all, because guarding is not part of it Draw this one as a man of Persian appearance, in their forties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Black Circle

File: `tokens/black-circle.webp`

```text
SUBJECT. "Black Circle" — Health 14 · armour 2 · speed 3 · Arming Sword, Mail Shirt — a plain dark coat over mail, gloves, a flat wide hat, a sheaf of papers in one hand. Reads as an official rather than a soldier. The only frightening thing about the figure is how unhurried it is Draw this one as a woman of Southeast Asian appearance, past fifty -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Blind Worm

File: `tokens/blind-worm.webp`

```text
SUBJECT. "Blind Worm" — Health 14 · armour 2 · speed 3 · Heavy Mandibles — a thick blind tube of segmented muscle, heavy mandibles at the head end and no eyes anywhere on it. **Purplish red** -- the raw dark red-violet of muscle or of an earthworm's flush, wet-looking, deeper in the creases between the segments. Drawn coming up out of broken ground

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Blind Worm Elder

File: `tokens/blind-worm-elder.webp`

```text
SUBJECT. "Blind Worm Elder" — Health 24 · armour 3 · speed 3 · Heavy Mandibles — A Blind Worm: a thick blind tube of segmented muscle, heavy mandibles at the head end and no eyes anywhere on it. **Purplish red** -- the raw dark red-violet of muscle or of an earthworm's flush, wet-looking, deeper in the creases betw... This one is longer and thicker and the same purplish red, jaws at one end and the body simply ending at the other. ONE BODY AND NO TAIL: no second tapering limb, no stinger, nothing trailing

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Burrower

File: `tokens/burrower.webp`

```text
SUBJECT. "Burrower" — Health 18 · armour 2 · speed 5 · Mandibles — one great pale ringed worm, as thick as a barrel, blind, with a ring of rasping plates where a face would be. Drawn head-first out of broken ground with the body trailing back into it. No rider in the picture

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Burrower Brood Mother

File: `tokens/burrower-brood-mother.webp`

```text
SUBJECT. "Burrower Brood Mother" — Health 30 · armour 3 · speed 3 · Mandibles — A Burrower: one great pale ringed worm, as thick as a barrel, blind, with a ring of rasping plates where a face would be. Drawn head-first out of broken ground with the body trailing back into it. No rider in the picture This one it stopped being a steed when it started laying

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Changeling

File: `tokens/changeling.webp`

```text
SUBJECT. "Changeling" — Health 8 · speed 4 · Nip — a byting: child-sized and child-shaped and not a child -- the proportions a little off, the head a little large, the hands too long, old in the eyes. Dressed in human clothes that fit badly. Nothing monstrous on it at a glance, which is the whole horror

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Chupacabra

File: `tokens/chupacabra.webp`

```text
SUBJECT. "Chupacabra" — Health 10 · armour 1 · speed 7 · Draining Bite — a lean hairless quadruped, grey and leathery, with a ridge of stiff spines down the back, a long muzzle and oversized hind legs built for springing. An animal, not a person: the only one of these nine that goes on four legs

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Cult Priest

File: `tokens/cult-priest.webp`

```text
SUBJECT. "Cult Priest" — Health 14 · armour 1 · speed 4 · Carved Idol, Mace — A Cultist: one worshipper of something local and unofficial: plain robes over ordinary clothes, a crude carved figure held in both hand... This one the same plain robes with one piece of real finery on top -- a heavy pectoral, a painted stole, a crown of something -- and the carved idol held overhead rather than cradled. Eyes closed, mouth open mid-word. Alone in the frame -- the crowd it is talking to is not in the picture Draw this one as a man of Mediterranean appearance, in their thirties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Cultist

File: `tokens/cultist.webp`

```text
SUBJECT. "Cultist" — Health 8 · speed 4 · Carved Idol, Dagger — one worshipper of something local and unofficial: plain robes over ordinary clothes, a crude carved figure held in both hands, the face lit from below. Not a hooded skeleton -- this is somebody from the next village and you would know them in daylight Draw this one as a man of Nordic appearance, in their thirties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Dhampir

File: `tokens/dhampir.webp`

```text
SUBJECT. "Dhampir" — Health 14 · armour 1 · speed 5 · Draining Bite — a living person, which is the point: a lean traveller in worn coat and boots, nothing undead about the body at all. Only the eyes are wrong, and they know it. The only thing in this group that casts a shadow Draw this one as a woman of Nordic appearance, in their twenties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Div

File: `tokens/div.webp`

```text
SUBJECT. "Div" — Health 38 · armour 3 · speed 3 · Burning Grasp — a giant of the Persian stories: horned, tusked, skin like cracked basalt with heat in the splits, far taller than a person and roughly built. Carrying something architectural it has just pulled out of the ground

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Djinn

File: `tokens/djinn.webp`

```text
SUBJECT. "Djinn" — Health 24 · armour 1 · speed 6 · Demon's Sigil, Fire Spray — a person, and a whole one: two legs, two feet, two hands, a face that holds still. Fine robes actually worn as cloth, gold at the wrists, dark unblinking eyes. **No wind, no smoke, no dust, no vapour, nothing trailing off and nothing transparent** -- the only thing not human about it is that the heels are a hand's breadth clear of the ground and nothing is holding them up

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Doomfly

File: `tokens/doomfly.webp`

```text
SUBJECT. "Doomfly" — Health 12 · armour 1 · speed 7 · Nip — transport: it is how everything else arrived

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Dragon

File: `tokens/dragon.webp`

```text
SUBJECT. "Dragon" — Health 50 · armour 5 · speed 6 · Dragon Jaws, Fire Spray — the biggest thing in the bestiary: a long-bodied winged worm, more serpent than lizard, with a narrow head and an old intelligence in it. **Scaled in bright silver** -- the scales metallic and polished like plate armour, hard white highlights running along every edge and the light sliding off it as off steel. Wings like a bat's and far too large. It should dwarf everything drawn beside it

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Draugr

File: `tokens/draugr.webp`

```text
SUBJECT. "Draugr" — Health 30 · armour 3 · speed 3 · Grave-Cold Hands — a barrow-dweller: a corpse swollen far past the size it was alive, hel-bla -- the blue-black of a drowned man -- in the rotted remains of good clothes, with grave-goods still on it. Heavy, slow, and far too strong. Not a skeleton: there is too much of it left

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Ecstatic

File: `tokens/ecstatic.webp`

```text
SUBJECT. "Ecstatic" — Health 14 · speed 5 · Warhammer — A Flagellant: stripped to the shoulders under a rough habit, back and shoulders a mess of old and new scourging, a knotted cord at the belt and a mace in the hand. Ecstatic rather than angry, which is worse This one further gone than the rest: the habit discarded entirely, the body a map of old scarring, a warhammer in both hands and the head thrown back. Running, not marching Draw this one as a woman of Nordic appearance, past fifty -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Elf

File: `tokens/elf.webp`

```text
SUBJECT. "Elf" — Health 16 · armour 1 · speed 5 · Elf-Bolt — an alva of the Nordic kind, not a tall archer: slight, pale and barefoot in a thin shift, hair unbound, drawn mid-step as if still dancing and only half attending to you. **The whole figure glitters** -- a fine dust of light caught on the skin, the hair and the shift, as though it had been rolled in frost or crushed glass, and the air immediately around it sparkles too. Beautiful and slightly wrong in the proportions. No armour, ...

The whole creature, three-quarter from above, filling the square on full transparency. The unbound hair is the one dark mass in the picture, inked in near-black and not washed, and the eyes are dark; the glitter is light left on the paper rather than a colour laid on it. The drawn line stays near-black the whole way round however pale the alva inside it is.
```

### Estrie

File: `tokens/estrie.webp`

```text
SUBJECT. "Estrie" — Health 16 · armour 1 · speed 6 · Draining Bite — a woman at a glance and not on a second look: hair unbound and far too long, moving as though in water, feet not quite meeting the ground, mouth dark. The hair is the picture -- that is where its strength is kept

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Fahlas

File: `tokens/fahlas.webp`

```text
SUBJECT. "Fahlas" — Health 60 · armour 4 · speed 4 · Grave Candle, Arming Sword — a human king who did not stop: court dress four centuries out of fashion and perfectly kept, a thin dry face that is still a face, a circlet. **One figure and nothing else** -- no court, no attendants, no standing dead anywhere in the frame, and he is alone in it. The only minor god you could mistake for a living man

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Familiar

File: `tokens/familiar.webp`

```text
SUBJECT. "Familiar" — Health 6 · speed 5 · Nip — a hare, and anatomically exactly a hare: **four legs, no more and no fewer**, every limb and joint where a hare's belongs. What is wrong is not the body -- it is the attention. Pupils that do not match, a person's patience behind them, and it has been looking at you for some time. Ordinary at a distance and unbearable close up. Drawn sitting upright, watching, not attacking

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Five Legs

File: `tokens/five-legs.webp`

```text
SUBJECT. "Five Legs" — Health 15 · armour 2 · speed 4 · Claws — FIVE-FOLD RADIAL: five identical limbs spaced evenly around a domed carapace, no head and no front or back, like a starfish built as a predator. Nothing else here is radial

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Five Legs Adjutant

File: `tokens/five-legs-adjutant.webp`

```text
SUBJECT. "Five Legs Adjutant" — Health 12 · armour 2 · speed 4 · Claws — A Five Legs: FIVE-FOLD RADIAL: five identical limbs spaced evenly around a domed carapace, no head and no front or back, like a starfish built as a predator. Nothing else here is radial This one it does not fight at all: it calls the next wave

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Flagellant

File: `tokens/flagellant.webp`

```text
SUBJECT. "Flagellant" — Health 10 · speed 4 · Mace — stripped to the shoulders under a rough habit, back and shoulders a mess of old and new scourging, a knotted cord at the belt and a mace in the hand. Ecstatic rather than angry, which is worse Draw this one as a woman of Persian appearance, past fifty -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Flat Bug

File: `tokens/flat-bug.webp`

```text
SUBJECT. "Flat Bug" — Health 5 · armour 1 · speed 3 · Mandibles — a low broad arachnid plated front to back, EIGHT legs splayed under a flat shell. No goblin and no humanoid head of any kind: the head is a wedge of jaw set into the shell

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Flat Bug Runner

File: `tokens/flat-bug-runner.webp`

```text
SUBJECT. "Flat Bug Runner" — Health 4 · speed 5 · Mandibles — A Flat Bug: a low broad arachnid plated front to back, EIGHT legs splayed under a flat shell. No goblin and no humanoid head of any kind: the head is a wedge of jaw set into the shell This one sent ahead to find out where you are, and dies finding out

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Flat Bug Shieldline

File: `tokens/flat-bug-shieldline.webp`

```text
SUBJECT. "Flat Bug Shieldline" — Health 7 · armour 2 · speed 2 · Mandibles — A Flat Bug: a low broad arachnid plated front to back, EIGHT legs splayed under a flat shell. No goblin and no humanoid head of any kind: the head is a wedge of jaw set into the shell This one the front rank, which is where the Horde's armour actually is

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Forest Troll

File: `tokens/forest-troll.webp`

```text
SUBJECT. "Forest Troll" — Health 20 · armour 2 · speed 4 · Troll Fists — a skogstroll: long-limbed and hunched, hide like wet bark with lichen in the seams, a cow's tail it keeps tucked, and a face that is nearly a person's and wrong about it

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Gheul

File: `tokens/gheul.webp`

```text
SUBJECT. "Gheul" — Health 14 · armour 1 · speed 5 · Draining Bite — a graveyard demon: man-high and man-shaped and wrong in every joint, grey skin drawn tight over the skull, a mouth far too wide for the jaw, no nose to speak of, fingers long enough to dig with and used for it. Crouched over turned earth, grave-dirt to the elbow. **No animal head at all** -- nothing of the hyena, the dog or the jackal in it

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Gnome

File: `tokens/gnome.webp`

```text
SUBJECT. "Gnome" — Health 14 · armour 1 · speed 3 · Elf-Bolt — a tomte: knee-high, old-man-faced, grey homespun and a red knitted cap, with a beard far too long for the body under it. Carries itself like the owner of the place. Enormously strong for its size, which should show in the hands and the stance

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
SUBJECT. "Goblin Archer" — Health 5 · speed 3 · Goblin Shortbow — A Goblin:  This one it earns Loose by being able to shoot, which the spearman cannot

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Goblin Chief

File: `tokens/goblin-chief.webp`

```text
SUBJECT. "Goblin Chief" — Health 11 · armour 1 · speed 3 · Goblin Spear, Goblin Shield — A Goblin:  This one kill it and the Cower comes back to everybody else

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Goblin Shaman

File: `tokens/goblin-shaman.webp`

```text
SUBJECT. "Goblin Shaman" — Health 6 · speed 2 · Goblin Fetish — A Goblin:  This one the elves taught it enough glamour to be dangerous and not enough to be free

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Goblin Warrior

File: `tokens/goblin-warrior.webp`

```text
SUBJECT. "Goblin Warrior" — Health 8 · armour 1 · speed 3 · Goblin Spear, Goblin Shield — A Goblin:  This one the one that does not run: a shield, a shell of discipline, and no Cower

The whole creature, three-quarter from above, filling the square on full transparency.
```

### God's Spirit

File: `tokens/gods-spirit.webp`

```text
SUBJECT. "God's Spirit" — Health 14 · armour 2 · speed 4 · Balanced Dagger, Leather Armor — A Black Circle: a plain dark coat over mail, gloves, a flat wide hat, a sheaf of papers in one hand. Reads as an official rather than a soldier. The only frightening thing about the figure is how... This one where the Black Circle looks like an official, this looks like nobody: ordinary travelling clothes, no insignia, no hat, hands empty until they are not. The one in the room you would not describe afterwards Draw this one as a man of Horn of Africa appearance, in their thirties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Grey Assassin

File: `tokens/grey-assassin.webp`

```text
SUBJECT. "Grey Assassin" — Health 10 · armour 1 · speed 6 · Balanced Dagger, Blade Venom — a city killer in plain western dress: dark wool coat to the knee, close hood, gloves, a thin blade held reversed along the forearm. **Nothing wrapped, no veil, nothing eastern about it** -- this is somebody who can stand in a doorway on the Iron District's own streets and be taken for a clerk. Nothing worn on it rattles Draw this one as a man of Caribbean appearance, past fifty -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Guild Engineer

File: `tokens/guild-engineer.webp`

```text
SUBJECT. "Guild Engineer" — Health 12 · armour 2 · speed 3 · Arquebus, Brigandine — an engineer caught at the work rather than at the gun: sleeves rolled over a leather apron, a cloth cap, both hands on a tool -- a crank, a measuring rod, a length of chain -- and the arquebus slung across the back where it is out of the way. Standing upright and busy. **No goggles, nothing aimed, nothing braced** Draw this one as a man of Southeast Asian appearance, in their thirties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Highwayman

File: `tokens/highwayman.webp`

```text
SUBJECT. "Highwayman" — Health 10 · armour 2 · speed 6 · Matchlock Pistol, Arming Sword, Brigandine — A Bandit: one roadside robber in mismatched gear: a good sword, a bad coat, a hood or a scarf across the face. Everything worn looks taken off somebody else, because it was This one mounted-class robbery: a long riding coat, boots to the knee, a scarf to the eyes and a matchlock pistol levelled. Better dressed than the band it came from, which is the whole of its character Draw this one as a woman of Horn of Africa appearance, past fifty -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Holy Shield

File: `tokens/holy-shield.webp`

```text
SUBJECT. "Holy Shield" — Health 18 · armour 4 · speed 3 · Longsword, Kite Shield, Plate, Great Helm — a knight of the order in full plate and a great helm, kite shield up, the faith's mark on the surcoat. Heavy, closed, and faceless -- the helm has no opening worth drawing a face in Draw this one as a man of Slavic appearance, in their twenties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Holy Sword

File: `tokens/holy-sword.webp`

```text
SUBJECT. "Holy Sword" — Health 18 · armour 4 · speed 4 · Longsword, Mail Shirt, Great Helm — A Holy Shield: a knight of the order in full plate and a great helm, kite shield up, the faith's mark on the surcoat. Heavy, closed, and faceless -- th... This one the other church's knight: mail rather than plate, **a longsword held in both hands** and no shield at all, a surcoat with a different mark on it. Lighter, faster and visibly poorer -- the two orders are not equally funded and both of them know it Draw this one as a man of North African appearance, in their forties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Imp

File: `tokens/imp.webp`

```text
SUBJECT. "Imp" — Health 6 · speed 7 · Nip — cat-sized, leathery, bat-winged, all elbows and grin, perched on something it has no business perching on. Drawn small in the frame on purpose -- scale is the joke, and it is the only thing here that looks like it is enjoying itself

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Incubus

File: `tokens/incubus.webp`

```text
SUBJECT. "Incubus" — Health 18 · armour 1 · speed 5 · Demon's Sigil, Draining Bite — beautiful and subtly over-designed -- the proportions a shade too even, the hair too deliberate -- bare-shouldered, drawn leaning in from the edge of the frame as though over a bed. Small dark horns half-hidden. Nothing exposed that a card could not print

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Keres

File: `tokens/keres.webp`

```text
SUBJECT. "Keres" — Health 8 · speed 6 · Claws — one Greek death-spirit: a dark ragged woman, gaunt, bloodied to the elbow, teeth bared, stooping low over the ground towards something already down. **A single figure** -- there are others working the same field and not one of them is in this picture

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Lindworm

File: `tokens/lindworm.webp`

```text
SUBJECT. "Lindworm" — Health 34 · armour 3 · speed 4 · Dragon Jaws, Acid Spray — a wingless serpent-dragon of the Nordic kind: a long heavy body with ONE pair of forelegs at the front and nothing behind, dragging the rest. **Ferocious, not sluggish** -- the head low and driving forward, jaws wide open on a mouthful of back-curved teeth, gums drawn back, the small eyes fixed on what is in front of it. Scarred, filthy scale. No wings at all -- that is what makes it a lindworm and not a dragon

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Little Folk

File: `tokens/little-folk.webp`

```text
SUBJECT. "Little Folk" — Health 10 · armour 1 · speed 4 · Elf-Bolt — one of the vattar, the underground people: small, grey and earthen, dressed like a poor farmer of no particular century, with a flat look and no expression to read. Drawn half out of the ground: never fully in the open, and never in company -- one figure and no second one anywhere

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Lugat

File: `tokens/lugat.webp`

```text
SUBJECT. "Lugat" — Health 22 · armour 2 · speed 3 · Draining Bite — the Albanian kind: bloated and tight-skinned, still wound in its shroud with the wrapping split, moving with a full belly's slowness. Fat rather than gaunt, which is what separates it from every other corpse here

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mantiss

File: `tokens/mantiss.webp`

```text
SUBJECT. "Mantiss" — Health 12 · armour 2 · speed 4 · Grasping Claws — EIGHT legs, the front pair long and folded like a mantis's and the other six walking. Upright over them, taller than the infantry, with a narrow swivelling head

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mantiss Veteran

File: `tokens/mantiss-veteran.webp`

```text
SUBJECT. "Mantiss Veteran" — Health 18 · armour 3 · speed 4 · Grasping Claws — A Mantiss: EIGHT legs, the front pair long and folded like a mantis's and the other six walking. Upright over them, taller than the infantry, with a narrow swivelling head This one it has done this before and takes you out of the fight first

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mega Beetle

File: `tokens/mega-beetle.webp`

```text
SUBJECT. "Mega Beetle" — Health 30 · armour 4 · speed 2 · Heavy Mandibles — a wall that walks: the Scrips under its wings are the point of it

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mercenary

File: `tokens/mercenary.webp`

```text
SUBJECT. "Mercenary" — Health 12 · armour 3 · speed 4 · Halberd, Brigandine — a hardened soldier out of the eastern forests: brigandine over travelling clothes, a halberd, an old scar and a bedroll. Professional, unbothered, and nobody's idea of a hero Draw this one as a woman of Germanic appearance, past fifty -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mercenary Captain

File: `tokens/mercenary-captain.webp`

```text
SUBJECT. "Mercenary Captain" — Health 18 · armour 4 · speed 4 · Greatsword, Brigandine, Great Helm — A Mercenary: a hardened soldier out of the eastern forests: brigandine over travelling clothes, a halberd, an old scar and a bedroll. Professional, unbothered, and nobody's idea of a hero This one the same hard soldier with a greatsword and a closed helm under one arm, a captain's sash and a whistle. Older, scarred across the hands, and watching the field rather than the man in front of it Draw this one as a woman of South Asian appearance, in their forties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mob

File: `tokens/mob.webp`

```text
SUBJECT. "Mob" — Health 8 · speed 4 · Dagger — A Townsfolk, and this one the same working people, no longer leaving: faces front, hands full of whatever was to hand -- a hayfork, a cobble, a bottle. Drawn as a press of bodies with no space between them, and they are not all the same person: different ages, different colours, men and women together. Frightened and coming anyway. **This is the one creature in the roster that is deliberately more than one body** Draw this one as a man of Central Asian appearance, in their twenties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mole Beast

File: `tokens/mole-beast.webp`

```text
SUBJECT. "Mole Beast" — Health 22 · armour 2 · speed 3 · Tusks — a true mole, enlarged: a barrel of muscle with a pink snout, tiny buried eyes and huge outward-turned digging forelimbs. Fur, not chitin -- it is not one of the Horde

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mole Beast Tusker

File: `tokens/mole-beast-tusker.webp`

```text
SUBJECT. "Mole Beast Tusker" — Health 30 · armour 3 · speed 3 · Tusks — A Mole Beast: a true mole, enlarged: a barrel of muscle with a pink snout, tiny buried eyes and huge outward-turned digging forelimbs. Fur, not chitin -- it is not one of the Horde This one the one the mole men dig behind

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
SUBJECT. "Mole Man Digger" — Health 8 · armour 1 · speed 3 · Mole Pick — A Mole Man: followers of the Queen of the Dark, and the only burrower that carries a tool This one carries a MOLE PICK: a short-hafted single-bladed digging pick, the haft cut short for swinging in a tunnel. Not a spear, not a polearm, not a lamp

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mole Man Priest

File: `tokens/mole-man-priest.webp`

```text
SUBJECT. "Mole Man Priest" — Health 10 · armour 1 · speed 2 · Dark Lantern — A Mole Man: followers of the Queen of the Dark, and the only burrower that carries a tool This one carries a DARK LANTERN and nothing else: a shuttered lantern in one hand, one slit open. No staff, no rod, no crook -- both arms and both hands whole and unpierced

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mother Longhand

File: `tokens/mother-longhand.webp`

```text
SUBJECT. "Mother Longhand" — Health 72 · armour 4 · speed 5 · Grasping Claws, Elf-Bolt — a ra grown enormous and wrong: the bark-and-moss body of a skogsra on a frame three times too tall, with arms that reach most of the way across the picture and hands at the end of them bigger than a person. The hollow back is still there

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mountain Troll

File: `tokens/mountain-troll.webp`

```text
SUBJECT. "Mountain Troll" — Health 34 · armour 4 · speed 2 · Troll Fists, Thrown Stone — a bergtroll: a hunched mass of grey stone-hide with lichen and moss growing on its back and shoulders, a great hooked nose, small deep-set eyes and a mouth too wide. Vast, slow and mineral -- more cliff than animal, and no green skin anywhere

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Mummer

File: `tokens/mummer.webp`

```text
SUBJECT. "Mummer" — Health 8 · speed 5 · Dagger — one reveller in a carved animal mask -- a goat, horns and all -- over ordinary festival clothes, with ribbons at the sleeves and a drinking horn in hand. Mid-step and mid-song, alone in the frame. The mask is the picture, and it is not a human face Draw this one as a woman of Central Asian appearance, in their twenties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Naga

File: `tokens/naga.webp`

```text
SUBJECT. "Naga" — Health 30 · armour 3 · speed 4 · Crushing Coils, Demon's Sigil — serpent from the waist down and something close to human above, with a hood of scaled skin flared behind the head and heavy jewellery it was not given. Half-submerged, coiled rather than swimming

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Nature Spirit

File: `tokens/nature-spirit.webp`

```text
SUBJECT. "Nature Spirit" — Health 20 · armour 1 · speed 5 · Elf-Bolt — a skogsra: from the front a tall woman made of the wood -- bark-grained skin, moss in the hair, eyes like a deer's -- and from any other angle hollow, the back open like a rotted trunk. Draw her turning, so both are true at once. That hollow is the whole point

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
SUBJECT. "Pincer Marshal" — Health 35 · armour 4 · speed 4 · Grasping Claws — A Pincer: generals, intelligent, armoured: it takes somebody out of the fight rather than down This one the largest armoured form in the Horde, heavy pincers held high and a thick plated hood over the front. NO FLAGS, no banners, no standards, no insignia, no cloth of any kind

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Processor

File: `tokens/processor.webp`

```text
SUBJECT. "Processor" — Health 4 · armour 1 · speed 3 · Nip — a single worker, unarmoured and unarmed, built for carrying rather than fighting: a low six-legged body with the front pair held up and loaded, mouthparts busy. Caught mid-task and not looking up

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Processor Driller

File: `tokens/processor-driller.webp`

```text
SUBJECT. "Processor Driller" — Health 6 · armour 1 · speed 3 · Mandibles — A Processor: a single worker, unarmoured and unarmed, built for carrying rather than fighting: a low six-legged body with the front pair held up and loaded, mouthparts busy. Caught mid-task and not looking up This one what the Horde uses instead of a siege engine, and the reason walls fall from below

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Queen of the Dark

File: `tokens/queen-of-the-dark.webp`

```text
SUBJECT. "Queen of the Dark" — Health 70 · armour 5 · speed 3 · Dark Lantern, Grave-Cold Hands — an immense seated figure in the dark, more cave formation than body, with a crown of rock and a face only suggested. **Alone** -- no mole men, no attendants, no court, nothing else alive in the frame; the scale comes from how completely she fills it. The one light in the picture is the shuttered lantern in her hand

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Revenant

File: `tokens/revenant.webp`

```text
SUBJECT. "Revenant" — Health 24 · armour 2 · speed 4 · Grave-Cold Hands — a body walking with a purpose and nothing else: dried rather than rotted, the clothes it was buried in, the wound that killed it still open and not bleeding. The face is intact and recognisable, which is the worst thing about it

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
SUBJECT. "Rush Spider Rider" — Health 14 · armour 1 · speed 8 · Mandibles — A Rush Spider: cavalry: it arrives before you have finished deciding This one carrying a Mole Man, which is two statblocks arriving as one problem

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Salt Baron

File: `tokens/salt-baron.webp`

```text
SUBJECT. "Salt Baron" — Health 16 · armour 2 · speed 4 · Matchlock Pistol, Arming Sword, Fine Clothes — A Smuggler: a north-coast sailor turned quiet trader: oilskin, a knitted cap, salt-stained boots, a crossbow held low and ready. **The figure and the crossbow and nothing else** -- no crates, no... This one a north-coast magnate gone slightly to seed: a good coat over sea-weathered skin, rings, a pistol worn openly on the hip. Standing on a quay as though it were owned, because at one point it was Draw this one as a man of Nordic appearance, in their thirties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Scrip

File: `tokens/scrip.webp`

```text
SUBJECT. "Scrip" — Health 2 · speed 6 · Nip — small and quick on EIGHT thin legs, more eye than body -- a cluster of eyes over a trunk barely bigger than a fist. One of them and not a swarm

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Scrip Watcher

File: `tokens/scrip-watcher.webp`

```text
SUBJECT. "Scrip Watcher" — Health 2 · speed 7 · Nip — A Scrip: small and quick on EIGHT thin legs, more eye than body -- a cluster of eyes over a trunk barely bigger than a fist. One of them and not a swarm This one the one that is still watching after you killed the others

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Sea Serpent

File: `tokens/sea-serpent.webp`

```text
SUBJECT. "Sea Serpent" — Health 40 · armour 3 · speed 6 · Crushing Coils, Dragon Jaws — a vast limbless water-worm, drawn as a series of humps breaking a flat surface with the head low and forward at one end -- the shape of every lake-monster sighting ever reported. Most of it is under the water and should stay there

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Shade

File: `tokens/shade.webp`

```text
SUBJECT. "Shade" — Health 10 · speed 5 · Grave Candle — barely there: the shape of a person in thin grey wash, the edges losing themselves into the paper, carrying a single guttering candle that is the most solid thing in the picture. No chains, no skull, no sheet -- just somebody almost rubbed out

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
SUBJECT. "Skaah Bloated" — Health 60 · armour 1 · speed 3 · Acid Spray — A Skaah: a drop ship: balloon-like, gigantic, and full of something worse This one full, low and leaking: it is going to come down somewhere

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Slitherer

File: `tokens/slitherer.webp`

```text
SUBJECT. "Slitherer" — Health 7 · armour 1 · speed 4 · Mandibles — a long low body dragging between EIGHT short legs set wide along its sides -- it slithers because the body is on the ground, not because it has no legs

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Slitherer Brood

File: `tokens/slitherer-brood.webp`

```text
SUBJECT. "Slitherer Brood" — Health 4 · armour 1 · speed 5 · Mandibles — A Slitherer: a long low body dragging between EIGHT short legs set wide along its sides -- it slithers because the body is on the ground, not because it has no legs This one is smaller and leaner, the same animal at two-thirds the size, and it is drawn alone -- the others it travels with are not in the picture

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
SUBJECT. "Smash Beetle Breaker" — Health 28 · armour 4 · speed 1 · Tail Club — A Smash Beetle: it is here for the wall, and you are in the way of the wall This one bred bigger for the gates of the Third Ring, and it does not turn quickly

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Smuggler

File: `tokens/smuggler.webp`

```text
SUBJECT. "Smuggler" — Health 10 · armour 1 · speed 4 · Crossbow, Leather Armor — a north-coast sailor turned quiet trader: oilskin, a knitted cap, salt-stained boots, a crossbow held low and ready. **The figure and the crossbow and nothing else** -- no crates, no barrels, no bundles, no cargo, no quay. The goods are elsewhere, which is the point of the trade Draw this one as a man of Caribbean appearance, in their twenties -- that is fixed, not a suggestion.

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
SUBJECT. "Stinger Drone" — Health 10 · speed 6 · Acid Spray — A Stinger: it goes for whoever is concentrating This one the sting became a nozzle somewhere in the hive's history

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Strigoi

File: `tokens/strigoi.webp`

```text
SUBJECT. "Strigoi" — Health 28 · armour 2 · speed 4 · Draining Bite — the troubled dead of the Romanian stories: gaunt and upright and almost presentable, dressed as a living person of standing, with too-long nails and a mouth that does not close properly. It does not shamble. It arrives

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Sweeper

File: `tokens/sweeper.webp`

```text
SUBJECT. "Sweeper" — Health 8 · armour 1 · speed 7 · Claws — EIGHT legs folded tight under four wings. Not a bird and not a bat: the wings are thin and veined off a segmented body, and there are no feathers anywhere on it

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Sweeper Carrier

File: `tokens/sweeper-carrier.webp`

```text
SUBJECT. "Sweeper Carrier" — Health 12 · armour 1 · speed 6 · Nip — A Sweeper: EIGHT legs folded tight under four wings. Not a bird and not a bat: the wings are thin and veined off a segmented body, and there are no feathers anywhere on it This one it is carrying something, and the something is the encounter

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Sweeper Diver

File: `tokens/sweeper-diver.webp`

```text
SUBJECT. "Sweeper Diver" — Health 6 · armour 1 · speed 9 · Claws — A Sweeper: EIGHT legs folded tight under four wings. Not a bird and not a bat: the wings are thin and veined off a segmented body, and there are no feathers anywhere on it This one it comes down on whoever is concentrating

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Tempter

File: `tokens/tempter.webp`

```text
SUBJECT. "Tempter" — Health 20 · armour 1 · speed 4 · Demon's Sigil — immaculate and entirely at ease: good clothes a century out of date, hands open and empty, a slight pleasant expression. Nothing visibly wrong until you look for a shadow and find it pointing the wrong way

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
SUBJECT. "Terror Fly Torch" — Health 14 · armour 2 · speed 6 · Fire Spray — A Terror Fly: captains, and the first thing in the roster that burns ground This one all the fire and none of the authority

The whole creature, three-quarter from above, filling the square on full transparency.
```

### The Cat God

File: `tokens/the-cat-god.webp`

```text
SUBJECT. "The Cat God" — Health 55 · armour 4 · speed 9 · Grasping Claws — a cat the size of a cart horse and in no way a lion: the exact proportions and indifference of a domestic cat, scaled up, sitting. Too many shadows behind it for the light in the frame. Nothing about the pose suggests it has agreed to be here

The whole creature, three-quarter from above, filling the square on full transparency.
```

### The Land Jelly

File: `tokens/the-land-jelly.webp`

```text
SUBJECT. "The Land Jelly" — Health 90 · armour 3 · speed 1 · Crushing Coils — a vast translucent mass filling the whole frame, with things suspended inside it that are clearly older than the picture -- bones, worked stone, a boat. No face, no front, no limbs. The biggest and least animal thing in the set

The whole creature, three-quarter from above, filling the square on full transparency. The near-black is everything suspended inside it: the boat, the worked stone and the bones read as dark silhouettes deep in the mass, darkest where the most jelly lies over them. The line around the whole thing stays inked however clear the jelly is.
```

### The Purple

File: `tokens/the-purple.webp`

```text
SUBJECT. "The Purple" — Health 12 · armour 1 · speed 5 · Crossbow, Blade Venom, Serpent's Milk — A Grey Assassin: a city killer in plain western dress: dark wool coat to the knee, close hood, gloves, a thin blade held re... This one the same plain western coat, in deep purple-dyed wool and better cut, hood back, kneeling over a flat case of stoppered vials open across one knee. **No crossbow anywhere in the picture, and no blade either** -- the vials are the whole of it. Working rather than stalking Draw this one as a woman of Southeast Asian appearance, in their forties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### The Queen

File: `tokens/the-queen.webp`

```text
SUBJECT. "The Queen" — Health 60 · armour 4 · speed 0 · Heavy Mandibles — enormous and rooted to the floor, armoured in overlapping plate like a siege engine, heavy jaws and a crown of horn. The most frightening thing in the set: more armour than the Marshal and more mass than anything that walks

The whole creature, three-quarter from above, filling the square on full transparency.
```

### The Troll King

File: `tokens/the-troll-king.webp`

```text
SUBJECT. "The Troll King" — Health 85 · armour 6 · speed 4 · Troll Fists, Thrown Stone — a bergtroll grown past any scale a troll should reach -- a moving ridge of stone-hide with full-sized pines rooted along its back and shoulders, a crude iron crown half swallowed by the hide it was put on. The trolls around its feet are knee-high

The whole creature, three-quarter from above, filling the square on full transparency.
```

### The Unseen

File: `tokens/the-unseen.webp`

```text
SUBJECT. "The Unseen" — Health 12 · armour 2 · speed 6 · Dagger, Leather Armor — A Grey Assassin: a city killer in plain western dress: dark wool coat to the knee, close hood, gloves, a thin blade held reversed along the forearm. **Nothing wrapped, no veil, nothing eastern about it** -- this is some... This one a western monastic at a glance -- plain habit, cord belt, hood up, hands inside the sleeves -- and nothing about the stance belongs to a monk. The dagger is not visible and is obviously there Draw this one as a woman of West African appearance, in their forties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### The Winter Lady

File: `tokens/the-winter-lady.webp`

```text
SUBJECT. "The Winter Lady" — Health 65 · armour 4 · speed 5 · Killing Frost, Elf-Bolt — a tall elven woman made of winter: skin the white of old ice with the grey of it underneath, hair and gown drifting upward rather than down, bare feet not melting what she stands on. Beautiful, composed, and the air around her visibly colder

The whole creature, three-quarter from above, filling the square on full transparency. The grey beneath the ice deepens to near-black in the cracks of it and in the hollows of the gown, and the eyes are dark. The drawn line stays near-black the whole way round however white the ice is.
```

### Town Guard

File: `tokens/town-guard.webp`

```text
SUBJECT. "Town Guard" — Health 10 · armour 2 · speed 3 · Spear, Wooden Shield, Leather Armor, Light Helm — a watchman in a padded coat and an open kettle helm with a spear and a round shield, a town's badge on the shield and nothing else to mark them. Tired rather than fierce Draw this one as a man of North African appearance, past fifty -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Townsfolk

File: `tokens/townsfolk.webp`

```text
SUBJECT. "Townsfolk" — Health 4 · speed 3 · Dagger — one ordinary working person of no particular century: apron, patched wool, boots worn down on one side, a basket or a bundle still in the hands. Already turning away from whatever is happening. The dagger at the belt has only ever cut bread Draw this one as a woman of West African appearance, in their twenties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Trollkin

File: `tokens/trollkin.webp`

```text
SUBJECT. "Trollkin" — Health 10 · armour 1 · speed 4 · Troll Club — knee-high to a person and broad, grey-brown and leathery, with a troll's nose and a troll's ears on a body built low to the ground. Rough homespun and a stick. One of many, drawn alone: a single figure in the frame, and what is unsettling about it is how plainly it is not the only one

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Wanderer

File: `tokens/wanderer.webp`

```text
SUBJECT. "Wanderer" — Health 18 · armour 1 · speed 7 · Dagger — a traveller that does not resolve: layered road clothes, a staff, a pack -- and the parts of it furthest from the centre are smeared into motion, as though half of it has already left. Never drawn standing still

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Watch Sergeant

File: `tokens/watch-sergeant.webp`

```text
SUBJECT. "Watch Sergeant" — Health 14 · armour 3 · speed 3 · Halberd, Mail Shirt, Light Helm — A Town Guard: a watchman in a padded coat and an open kettle helm with a spear and a round shield, a town's badge on the shield and nothing else to mark them. Tired rather than fierce This one an older watchman with a halberd and a mail shirt instead of a spear and a coat, a sergeant's sash and a horn at the belt. Shouting rather than fighting Draw this one as a man of Mediterranean appearance, in their twenties -- that is fixed, not a suggestion.

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Watcher

File: `tokens/watcher.webp`

```text
SUBJECT. "Watcher" — Health 26 · armour 2 · speed 5 · Demon's Sigil — tall, still and frontal, with far too many eyes -- down the arms, across the chest, open in the wings. Not bestial and not beautiful: a watching thing in the shape of a person, drawn facing the viewer dead-on, which nothing else in the set does

The whole creature, three-quarter from above, filling the square on full transparency.
```

### Wyvern

File: `tokens/wyvern.webp`

```text
SUBJECT. "Wyvern" — Health 22 · armour 2 · speed 8 · Claws — a two-legged winged worm, hawk-sized rather than dragon-sized: wings and hind legs and nothing else, built entirely for the stoop. **The tail grows out of the base of the spine in one unbroken line** and tapers from there to a barbed point -- it is part of the body and continuous with it, never a separate whip-shape floating near the hips. Lean and quick where the dragon is heavy

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
- **One creature, and one only.** Not a pair, not a group, not a smaller one at its feet for
  scale, no mount, no attendant, no victim, no bystander, no second head and no second figure
  anywhere in the square. A token is placed on one square of a map and moved as one thing. The
  single exception is a creature whose own description says in words that it is a crowd.
- **Nothing in the square but the creature and what it is holding.** No cargo, no crates, no
  furniture, no wall, no doorway, no scenery and no ground -- those belong to the map underneath.
- **The anatomy has to close.** Count the limbs against the description and draw exactly that
  many: four legs on a quadruped, two on a biped, one tail and not two. A tail, a wing or a neck
  grows out of the body in one unbroken line and is part of it -- never a separate shape floating
  near the place it should join.
- Seen from **above at a three-quarter angle**, consistently, as a figure on a table is seen by
  the people around it. Never a portrait, never a side elevation.
- The silhouette does the work: this will be looked at beside twenty other tokens at 60 pixels,
  and the only question that matters is *which creature is that*.

PALETTE.
- **The creature is its own colour.** Draw it as the thing actually is: a mossy troll is green, a
  drowned corpse is hel-bla, a hairless hide is grey. Nothing here is held to the warm palette the
  cards use.
- Desaturated and natural rather than bright -- this is still ink and wash, not poster paint -- but
  the hue belongs to the animal and not to the deck.
- Line and darks stay **#1b1714**, so a token reads as drawn by the same hand.

PEOPLE.
- **Where the creature is a person, the description says which person**, and it is binding: the
  sex, the ancestry and the age given at the end of the subject are not a suggestion and not a
  default to fall back from. Draw that person.
- Where it does not say, do not reach for the same figure twice. These are the inhabitants of a
  port city on a trade road and they look like it.

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

**176 prompts in 33 clusters** share a direction with another piece. That is a motif table working as designed — it is what makes every Strike card read as a Strike — right up until it flattens two cards that mean different things.

**10 of those clusters are the ones that bite**, listed first: the ones where the subject line carries no prose either, so neither half of the prompt tells the cards apart. The rest share a direction over subjects that already differ — forty-three consumables drawing a nearly-empty vessel still come back as forty-three different pictures, because each subject names its own.

Answer a cluster by adding its keys to `DIRECTION` in `test/art-prompts.mjs` and regenerating. The row shrinks or disappears when it is done.

| Pieces | Bare | They share | Keys |
|---|---|---|---|
| **18** | 2 | a glass vial, stoppered, with less in it than there was | `items/bottle-of-borrowed-pain` `items/brewers-reserve` `items/draught-of-lead` `items/draught-of-second-breath` `items/draught-of-the-hollow` …+13 |
| **13** | 2 | one round out of the bundle, its point drawn sharply | `items/blunt-head` `items/bodkin-points` `items/chalked-shaft` `items/frost-dipped-bolt` `items/grapnel-bolt` …+8 |
| **8** | 2 | the instant a blow lands, the weapon already through -- never wound up, never posing | `cards/starter/strike` `cards/shade-starter/knife-work` `cards/npc/rattle` `cards/strength/nothing-held-back` `signatures/shade/double-or-nothing` …+3 |
| **7** | 2 | an object with more inside it than its size allows | `features/arcane-focus` `items/focus-pendant` `items/holy-symbol` `items/pilgrims-token` `items/reliquary-band` …+2 |
| **6** | 2 | used up in the open: cloth, wax or powder, half gone | `items/antidote` `items/cleansing-draught` `items/firepot` `items/flask-of-ink` `items/flask-of-oil` …+1 |
| **4** | 2 | a tool worn exactly where a hand goes and nowhere else | `items/climbing-rope` `items/hunting-traps` `items/lantern` `items/repair-kit` |
| **3** | 2 | ground covered -- weight forward, the last footfall still behind | `cards/starter/advance` `cards/shade-starter/quick-step` `signatures/shade/over-and-past` |
| **3** | 2 | ground covered -- weight forward, the last footfall still behind; the instant a blow lands, the weapon already through -- never wound up, never posing | `cards/starter/lunge` `cards/shade-starter/slip-in` `signatures/strength/the-lance` |
| **3** | 2 | an edge, worn and sharpened back more than once | `items/arming-sword` `items/trident` `items/npc/goblin-spear` |
| **2** | 2 | a hand working an object, the object mid-use rather than held up to be seen; a weapon coming to hand, caught between carried and held | `cards/starter/quick-hands` `cards/shade-starter/light-fingers` |
| **9** | 1 | set down on nothing, carried a long way among other things | `items/beggars-bowl` `items/cairn-stone` `items/cracked-spyglass` `items/locked-casket` `items/loose-cobble` …+4 |
| **7** | 1 | an object that means nothing except in trained hands | `features/good-aim` `features/good-name` `features/hard-hands` `features/light-step` `features/quick-eye` …+2 |
| **7** | 1 | a small dark bottle, labelled, a residue dried at the lip | `items/assassins-tincture` `items/black-lotus` `items/blade-venom` `items/drowsing-oil` `items/grave-cap-extract` …+2 |
| **6** | 1 | the quality itself as one human moment -- the person it describes, caught in the second that proves it. No object held up, no symbol, no emblem | `signatures/shade/one-trick` `signatures/shade/the-opening` `signatures/strength/cleave-to-the-bone` `signatures/strength/loaded-before-the-bell` `signatures/strength/nothing-gets-through` …+1 |
| **5** | 1 | made well, by somebody who signed nothing | `items/fine-longsword` `items/marching-boots` `items/masterwork-crossbow` `items/proofed-mail` `items/smiths-hammer` |
| **4** | 1 | the weapon drawn and held at tension | `items/crossbow` `items/matchlock-pistol` `items/shortbow` `items/npc/goblin-shortbow` |
| **4** | 1 | a thing that says who somebody is before they speak | `items/fine-clothes` `items/gaming-set` `items/signet-ring` `items/travelling-cloak` |
| **3** | 1 | worn unevenly, and the wear is the subject | `items/boots-of-the-long-step` `items/hollow-boots` `items/pilgrims-shoes` |
| **2** | 1 | pulled toward something against the will | `cards/starter/taunt` `signatures/strength/play-to-the-crowd` |
| **11** | — |  | `backs/action` `backs/fate` `backs/ritual` `backs/skill` `backs/item` …+6 |
| **6** | — | one hand's worth of object, drawn close and large | `items/accusers-ring` `items/gamblers-coin` `items/mnemonic-stone` `items/pact-iron` `items/serpents-tooth-ring` …+1 |
| **6** | — | hung on a cord and drawn hanging, turned off square | `items/amulet-of-the-mended-thread` `items/gag-of-the-nine` `items/gorget-of-the-turned-blade` `items/hourglass-charm` `items/surgeons-pin` …+1 |
| **6** | — | held, or just set down, the grip polished by gripping | `items/blade-of-the-eager-hand` `items/discriminating-wand` `items/gauntlet-of-the-open-palm` `items/hooked-gauntlet` `items/reavers-edge` …+1 |
| **5** | — | weight: the object sits, and the surface under it knows; an edge, worn and sharpened back more than once | `items/halberd` `items/lance` `items/mace` `items/pike` `items/warhammer` |
| **4** | — | weight: the object sits, and the surface under it knows; the weapon drawn and held at tension | `items/arquebus` `items/heavy-crossbow` `items/longbow` `items/matchlock-musket` |
| **4** | — | worn through at the one spot a thumb has found | `items/sessyfyns-tear` `items/the-black-lantern` `items/the-pale-crown` `items/the-unquiet-quiver` |
| **3** | — | armour as worn metal and strap, not as a costume; weight: the object sits, and the surface under it knows | `items/brigandine` `items/great-helm` `items/plate` |
| **3** | — | a shield, face on and slightly turned, its edge nicked from use | `items/buckler` `items/kite-shield` `items/wooden-shield` |
| **3** | — | cloth with weight in it, hung from one point | `items/cloak-of-the-grey` `items/mantle-of-the-unburdened` `items/winter-cloak` |
| **3** | — | shaped to a skull, the hollow drawn most carefully | `items/crown-of-the-quiet-mind` `items/far-sight-monocle` `items/helm-of-the-watchful` |
| **3** | — | hung at the hip, the strap cut off at the frame | `items/drowned-bell` `items/marked-arrowhead` `items/quartermasters-belt` |
| **3** | — | armour as worn metal and strap, not as a costume | `items/leather-armor` `items/light-helm` `items/mail-shirt` |
| **2** | — | scribed and calibrated, unreadable to anybody not taught it | `items/fire-wand` `items/staff-of-healing` |

## Directions that match no piece

**None.** Every row in `DIRECTION` is keyed to a piece that exists. A key typed by hand is the one thing in this file that can be wrong without anything failing, so it is counted here rather than trusted.


## Gaps

**None.** Every verb, effect, condition and bonus group a prompt reaches for has a motif written, so no prompt goes out with a hole in it. A `[GAP]` is loud by design and was still shot once, so it is counted here rather than trusted.


