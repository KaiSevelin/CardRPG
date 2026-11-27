# Manual test plan

For whoever is sitting in front of Foundry. You do not need to read any code to run this.

## Why this document exists

`npm test` runs about three thousand checks and `npm run live` drives a real browser against a
real world. Between them they cover most of the system, so **this plan deliberately does not
re-test what they already cover.** Every scenario here is something the automated suites cannot
reach, and each one says which kind of gap it is filling:

| Kind               | Why automation cannot do it                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| **A modal dialog** | The probes call the routine and skip the dialog. Four dialogs in the system have never been opened by a test |
| **A click**        | A synthetic click on a card in the spells pile does not reach the handler. Every *cast by clicking* path is unverified |
| **Two people**     | Whispers, GM-only buttons and *who sees what* need two browsers                                      |
| **A new world**    | The suite copies an existing world, so world creation itself is untested                             |
| **A judgement**    | *Is this legible?* is not a check. Some of this plan is you reading a card and deciding              |

If something here fails, that is a real bug: none of it is covered elsewhere.

## Setting up

**A new world builds nothing by itself.** Creating it gives you an empty world and one macro. The
content is a button you press, and the scene is one you draw.

1. Make a world using the Card RPG system and open it. **It will be empty.** No actors, no cards,
   no scene — a new world is not a starter world, and nothing in it happens on load.
2. **Build the content.** Either of:

   - **Game Settings → Configure Settings → Card RPG → World content → Rebuild world content**
   - the macro **Card RPG: Create starter content**, left in your macro directory on first load

   It ends in a dialog counting what it made, and **that dialog is your first check**: on a new
   world it should say **Actors created: 6** — the Warrior and the five goblins — alongside a
   three-figure count of items, features and spells. *Nothing to do* means the content was already
   there. Anything else, stop here and read the console (F12): everything downstream assumes this
   step worked.

   > **Do not import the Warrior from the Pregenerated Characters compendium instead, and delete it
   > if you already have.** Two separate problems, and the first is silent:
   >
   > - **The packed copy has no decks.** Decks are world documents and a pack holds one class, so
   >   `system.decks` in the pack is empty. The imported Warrior has its gear, looks right on the
   >   Gear tab, and has an **empty Deck tab** — it cannot play, and the only thing that says so is
   >   a console warning.
   > - **Rebuild will not recognise it.** The routine finds what it built before by a flag it
   >   stamps, and packed documents carry no flag, so pressing the button next to an imported
   >   Warrior gives you a *second* Starter Warrior — the working one — and five more goblins.
   >
   > Delete the imported actors first, then press the button.
3. **Draw a scene.** Nothing builds one. Scene configuration, grid type *Square*, size 100,
   diagonals *Equidistant* — several rules measure distance and cannot on a gridless scene, and
   distances are Chebyshev, so a diagonal step costs the same as a straight one.
4. Open the tray with a macro (script type):

```js
game.cardrpg.openTray(game.actors.getName("Starter Warrior"));
```

Many scenarios need a particular spell in the hero's book. This macro puts one there, prepared:

```js
const NAME = "The Reading";                  // change this line
const hero = game.actors.getName("Starter Warrior");
const { SPELLS, slateFieldsOf, spellKindOf } = await import("/systems/cardrpg/module/graph.mjs");
const { slateData } = await import("/systems/cardrpg/module/setup.mjs");
const def = SPELLS.get(NAME);
if (!def) return ui.notifications.error(`No spell called ${NAME}`);
await hero.createEmbeddedDocuments("Item", [slateData({
  ...slateFieldsOf(def), kind: spellKindOf(def.pool ?? def.node), prepared: true
}, "spell")]);
ui.notifications.info(`${NAME} is prepared.`);
```

Spells appear in the tray's **spells** pile on the action side. Delete them from the hero's items
when you are done so later scenarios start clean.

### Where things live

Three things in this plan are easy to go hunting for in the wrong place.

- **A spell is not an action card.** Action cards are the sixteen in the Warrior's action deck, and
  no spell is ever among them. A spell is an Item of type *spell* and shows in the tray's **spells**
  pile. **The starter Warrior knows no spells at all** — every scenario that names one starts with
  the prepare macro above.
- **The Gear tab splits equipped from pack.** The Warrior's Longsword, Wooden Shield, Leather Armor
  and Healing Potion sit in the slot panels at the top, each in its own slot. The **Pack** list
  underneath holds what is not equipped, which is the Dagger and nothing else. *A pack list with one
  item in it is correct.*
- **The Deck tab lists cards by name across every pile at once**, with a *where* column — Deck,
  Hand, Discard, Spent, Away — because a count cannot tell you whether a card is drawable. If that
  list is **empty**, the Warrior has no deck wired: go back to step 2.

### If something looks wrong before you start

This macro prints the hero's real state. Run it before reporting anything in section 1 or 2, and
paste its output into the report — it distinguishes *the content was never built* from *the content
was built and is wrong*, which are different bugs.

```js
const hero = game.actors.getName("Starter Warrior");
if (!hero) return ui.notifications.error("No actor called Starter Warrior. Content was not built.");
const decks = Object.entries(hero.system.decks ?? {}).map(([which, id]) => {
  if (!id) return `${which}: NO ID`;
  const stack = game.cards.get(id);
  return stack ? `${which}: "${stack.name}" ${stack.cards.size} cards`
    : `${which}: id ${id} -> NO SUCH STACK`;
});
const items = hero.items.map(i =>
  `${i.type}${i.system?.kind ? `/${i.system.kind}` : ""}: ${i.name}`
  + (i.system?.equipped ? ` [equipped: ${i.system.equippedSlot}]` : "")
  + (i.system?.prepared ? " [prepared]" : ""));
console.log(`CARD RPG STATE\n\nDECKS\n${decks.join("\n")}\n\nITEMS (${items.length})\n${items.join("\n")}`);
ui.notifications.info("Written to the console. Press F12 to read it.");
```

A healthy new world prints ten decks — the action four, quarantine, the two fate piles and the three
skill piles — with **16 cards** in the action deck, and six items: four equipped, the Dagger, and
the feature *Strong*.

---

# 1. The four dialogs nothing has ever opened

These are the biggest hole in the automated coverage. Each one is a modal the probes step around.

## 1.1 Sift: look at your own draw pile and bin what you saw

**Why manual:** the probe drives the two halves either side of the dialog, never the dialog.

**Setup.** *One Less Thing* is a **spell** — an Asceticism formula from the Way of Mind — and the
starter Warrior knows no spells, so it is in neither the action deck nor the Gear tab until you put
it there. Run the prepare macro from [Setting up](#setting-up) with the first line changed to:

```js
const NAME = "One Less Thing";
```

It then appears in the tray's **spells** pile. It is a Sift 1. **Note how many cards are in your
draw pile** before you cast — the Deck tab's *where* column counts them, or the tray shows the
pile.

**Do.** Cast it. Tick the card. Confirm.

**Expect.**

- The dialog shows exactly **one card** — a card, with its picture, its name and both its halves,
  the same way it would look in your hand. **[CHANGED 2026-11-22]** It used to be a bulleted list
  of names with a tick box beside each, which is not enough to judge a card by, and judging cards
  is the whole of this effect.
- **Clicking anywhere on the card marks it**: a cross in the corner, the card dimmed and ringed.
  Clicking again takes the mark off.
- Binning it moves it to the **discard**, not out of the game. Draw pile one shorter.
- The chat line says the Warrior sifts 1 and bins 1.

**Then do it again and press "Keep them all".** Nothing moves, and the chat line says so.

> **A Sift that turns up an intruder is the case worth catching.** If a Fear or a Taint card is in
> the draw pile when you sift, it should be drawn as a **harm card** — dark, with *Can't be
> played* across it — and not as a blank. The draw pile holds them, and a player who can see one
> coming is exactly who should be allowed to bin it.

**And the look-only version.** *Graven Sight* is a **feature**, not a spell — Tattoo Magic ink, so
it is not prepared and not cast. Give the hero the feature and use it from the features pile. It is
a Sift **2**, and its dialog has **no checkboxes at all** and one button, *Seen*: this school holds
the seeing and not the binning, and the card says you may not reorder them either. Nothing moves.

> One checkbox is the case worth pressing on: a form with a single input of a name behaves
> differently from one with several, and *One Less Thing* is the only Sift 1 in the game.

## 1.2 Read: look at the top of a fate deck and put the cards back in an order

**Why manual:** this dialog is the newest thing in the system and no test opens it. The ordering it
decides is the entire mechanic.

**Setup.** Prepare *The Reading* (Read 3). Put the hero and one goblin in a fight — tokens on the
scene, roll initiative, begin combat.

**Do.** Cast *The Reading*.

**Expect, in order.**

1. **No dialog asking whose deck**, because one enemy type means one deck other than your own.
   (With two different enemy types in the fight you get a button per type — test that too.)
1. A dialog headed **Read 3**, listing three cards, each with a number box 1–3, and a note saying
   *1 is the next card drawn*.
1. Leave them as they are, press **Put them back**. Then check what you saw against what happens
   next: have that goblin make an attack. **The first card you saw should be the one that decides
   it.** Watch the chat for the fate card named in the roll.
1. Cast it again, and this time **reverse the order**. Draw again. The card you moved to 1 is the
   one that comes off.

**This is the single most important scenario in this document.** It is the only way to confirm that
arranging a deck does anything, and it crosses three routines at once.

**Also check:**

- **Two cards given the same number** must not error. You get a legal order, not a failure.
- **"Leave them"** puts nothing back in a new order and still tells you what you saw.
- *Where It Will Land* is a **Read 1** and must open **no dialog at all** — looking at one card and
  putting it back is just looking. You should get the whisper and nothing to click.
- Read a deck with **fewer than N cards left in it** (draw a goblin's deck down first). It reads
  what is there, and does not refuse.

**And the second draw, which is the one most likely to have been missed.** Initiative is a fate
draw too, and it is drawn by different code from every other draw. Read the goblin's deck, put a
known card on top, then **re-roll that goblin's initiative** from the combat tracker. The card you
put on top should be the one that decides it. If attacks respect an arranged order and initiative
does not, that is exactly the bug this split was expected to produce.

## 1.3 Strain: which cards you give up

**Why manual:** the probe only drives the two cases with nothing to choose.

**Setup.** Prepare *The Charge* (Strain 2). Have **four or more** cards in hand.

**Do.** Cast it.

**Expect.**

- Two dialogs in a row, headed **Strain 2**, the first saying *(1 of 2)* and the second *(2 of 2)*.
- A button per card in your hand, plus **Don't play**.
- The card you pick in the first dialog is **not offered again** in the second.
- Both cards end in your discard.

**Then test backing out.** Cast it again and press **Don't play** on the second dialog. **Nothing
may be spent** — no cards gone, no Health gone, the spell not cast. This is the case worth the most
attention: a half-paid price is the worst possible outcome and the order the engine pays in exists
to prevent it.

**And the no-choice case.** Cast *Valtor's Own* (Strain, your whole hand) with cards in hand. The
bill is everything that could pay it, so **no dialog opens** — a prompt with one button is not a
question — and the whole hand goes to the discard.

**And the unaffordable case.** Cast *The War Drum* (Strain 3) with two cards in hand. It is refused
with a warning naming what your hand holds, and **takes nothing**.

## 1.4 Foresee: whose intent you look at

**Why manual:** the type-pick dialog is undriven.

**Setup.** *Point Man* is an **action card**, not a spell — it comes off the action deck and is
played from a stack, so the macro above will not help. Add it to the hero's action deck, draw it,
and play its primary half, in a fight with **two different enemy types** (use
`game.cardrpg.buildMonster` to add a second kind).

**Expect.** A dialog *Whose intent do you read?* with a button per type and **None**. Picking one
whispers that type's intent card to you and the GM. Picking None does nothing.

**Worth knowing while you are here:** Foresee and Read are different things. Foresee looks at an
enemy's **intent card**; Read looks at the top of a **fate deck**. If a card seems to do the other
one's job, that is a bug of the kind that was fixed on 2026-11-22.

---

# 2. Casting by clicking

The automated probes call the engine directly, because a synthetic click on a card in the spells
pile never reached the handler. **Everything in this section is therefore unverified by
automation**, including some things that look very well covered.

## 2.1 A price you can see before you pay it

**Setup.** Prepare *The Shield Line*, *The Charge* and *The First Taste*. Open the tray, action
side, spells pile.

**Expect on the card face, before clicking anything:**

| Card              | Should read something like                           |
| ----------------- | ---------------------------------------------------- |
| *The Shield Line* | `Vax · 2 slots · costs 1 Health (per ally affected)` |
| *The Charge*      | `Valtor · 2 slots · costs Strain 2`                  |
| *The First Taste* | `The Purple · 2 slots · costs 1 body Taint`          |

**The judgement part:** read those three and decide whether you could tell, from the card alone,
what casting it will take from you. The card used to print only Health while taking three other
things.

**Then click each one** and check the chat line names the same price the card named. The card and
the click must not be able to disagree.

## 2.2 A scaled price that moves as the line forms

**Setup.** *The Shield Line* prepared. Hero alone on the board.

**Do.** Read the card, then put two allies next to the hero (any two character tokens adjacent),
re-open the tray, and read it again.

**Expect.** Alone it bills **nothing** — nobody covered is nothing to pay. With two beside you it
bills **2 Health**, and the chat line shows the working. The number on the card changes as the
board changes, without you clicking anything.

Same test with *The Last Drop* (half your current Health, rounded up) at full Health and at 3
Health: the number should be half of what you have *now*, not a fixed amount.

## 2.3 A moment that refuses

**Setup.** Prepare *The Long Masquerade* (out of combat).

**Expect.** Outside a fight it is clickable. **Inside a fight** the card is greyed, and the tip says
*not while the fight is on*. Clicking it refuses and takes nothing — no slot, no Health.

## 2.4 A state that refuses

**Setup.** Prepare *Nothing to Carry* (while both hands are empty).

**Expect with sword and shield in hand:** the card is greyed, its face says *While both hands are
empty*, and the tip says you are not. Clicking warns that casting it *would cost you the slot and
do nothing*.

**Then unequip both hands** from the character sheet and look again: the same card now reads
**`While both hands are empty — now`** and is clickable.

**Try all six states if you have the patience** — each one should show on the card and switch as you
change it:

| Card                   | State                        | How to get into it                           |
| ---------------------- | ---------------------------- | -------------------------------------------- |
| *Nothing to Carry*     | both hands empty             | unequip sword and shield                     |
| *Nothing Left to Take* | hand empty                   | play or discard your whole hand              |
| *The Last Card*        | hand exactly one card        | discard down to one                          |
| *The Empty Deck*       | hand **and** draw pile empty | play through the deck without a Catch Breath |
| *The Narrow Path*      | deck at its minimum          | prune the action deck to 12 cards            |
| *Alone on the Road*    | no ally within 2             | move every other figure away                 |

*The Empty Deck* is the hardest to reach and the most worth reaching: its window is the shortest in
the game and its effect is absolute.

## 2.5 A price refused takes nothing at all

**Setup.** *The Shield Line* (1 Health per ally), hero at **1 Health**, with two allies beside it.

**Expect.** Refused — a price may not take you below 1 Health — and **nothing is spent**: Health
unchanged, slot unchanged, no cards gone.

**Then the Wild.** *Longer Shadow* costs a Wild card into your fate deck and nothing else. Cast it
and check a Wild really arrives there, and that it is **not** marked temporary: a Wild is permanent,
which is the whole of what it is for. It should not be removed when drawn.

> **Worth knowing before you hunt for one:** no card in the game currently charges *two* money
> purses at once. The engine handles it and the suite exercises it with a made-up spell, so if you
> ever write a card costing Health and Taint together, this is the scenario to come back to — the
> order the engine pays in exists so that a cast you cannot finish paying for takes nothing.

## 2.6 A state nobody can answer must not refuse

**Why manual:** this needs a creature holding a spell written for a character, which nothing in the
world does by default.

**Setup.** Give a **goblin** a prepared *Nothing to Carry* (the macro above, with the goblin in
place of the hero).

**Expect.** Casting it is **not refused**. A creature owns a deck and a discard and **no hand at
all**, so *is your hand empty* has no answer for one — and a guard that fires on *I do not know*
would make every gated spell unusable in an NPC's hands, while one that assumed yes would leave them
all permanently on. The right behaviour is to let it through and leave the ruling to the table.

Check the same with *Nothing Left to Take* (hand empty) on a goblin. No warning, no greying.

---

# 2a. The play stacks  **[new 2026-11-22]**

**Why manual:** this is all click behaviour, and it changed today. The suites check the rules; what
they cannot check is whether the panel reads as an action when you look at it.

The rules, so you know what you are checking:

1. A stack is **empty** until you stage a half.
2. Staging a half brings in the gear that can do what the half does, the free features that boost
   it, and any condition bearing on it.
3. **A weapon serves one Strike a turn.** The second Strike uses something else, or bare hands.
4. A bonus that applies once rides with **the first half you clicked**, not the primary.
5. Anything with a cross can be taken out, and taking it out **changes the number**.

## 2a.1 An empty panel, then an action

**Do.** Open the tray on the Warrior, out of combat, with nothing staged.

**Expect.** Both stacks **empty**. Before today the primary held a Longsword, a Wooden Shield and a
Healing Potion before a hand was dealt — if you see gear standing in a stack with no card above it,
the change did not take.

**Then deal a hand and click a Strike.** The stack fills: the card you clicked at the base wearing
its picture, the **Longsword**, the **Wooden Shield** (it bashes for 1, so it belongs to a Strike),
and **Strong**, which prints *+1 in this action*. **No Healing Potion** — a potion has nothing to do
with a Strike, and that is the whole example.

**Click a Defend instead.** Now the shield and the sword are there and Strong is not: Strong is
`+1 on Strike`, and a stack that showed it on a Defend would be promising a number that will not
arrive.

## 2a.2 The cross has to change the number

**This is the one to run first.** It was a control that did nothing for as long as it existed.

**Do.** Stage a Strike. Read the number on the staged card — *Strike 4* with a fresh Warrior
(Longsword 3, Strong +1). Click the **cross** on Strong.

**Expect.**

- The Strong card leaves the stack.
- **The number drops by exactly 1.**
- Play it, and the chat card's chain does **not** list Strong.

**Then put it back** (the cross is a toggle) and the number returns. If the number never moves,
stop and report it: the staged stack is not reaching the resolver.

> Your number may not be 4. A hero carrying a tattoo or a blessing has more in the chain. **The
> claim is the difference the cross makes**, which is Strong's own +1, not the total.

## 2a.3 Two Strikes, one sword

Needs a card with Strike on its **secondary** half. The starter deck has one: *Weapon Swap*
(Ready / Strike). Pair it with any primary Strike.

**Do.** Stage the primary Strike, then *Weapon Swap*'s secondary.

**Expect.**

- The **primary** holds the Longsword. The **secondary does not** — the sword is spent.
- With a Wooden Shield equipped, the second Strike has the shield to use.
- **Put the shield away and try again.** Now the second Strike has nothing, and its face reads
  **Strike 1**: bare hands. Strong does not apply to it, because bare hands are Light.
- Play both and read the chat. The first chain names the Longsword; the second names **Bare hands**.

**And the order matters.** Clear the stacks and stage them the other way round — *Weapon Swap*'s
secondary **first**, then the primary Strike. Now **Strong is in the secondary stack**, because the
first card you clicked is the one carrying the swing, and the sword goes to the secondary too.

## 2a.4 Empty hands still strike

**Do.** Unequip every weapon on the character sheet. Stage a Strike.

**Expect.** It is playable and reads **Strike 1**. Before today this was refused outright with
*Nothing equipped can strike*, while the equipment rules had printed bare hands at 1 all along.

**Then try a Strike that needs particular kit** — a card whose face says *ranged*, for instance.
That one must still refuse, and must say which requirement it is refusing on. Bare hands are a
fallback, not a wildcard.

---

# 2b. Held and armed  **[new 2026-11-22]**

**Why manual:** found by playing, not by a check. Three of five cards were lying on their side a
round after anyone touched them, and every automated check about the sideways flag had asked about
a card that MOVED.

The rules:

1. A card turned sideways is **held**: it will not react. Both halves still play.
2. When your turn's actions are done, what is left turns sideways **by itself**.
3. **Your whole hand stands back up when your round begins.** A declaration is for the round you
   made it in.
4. While a card is down, **clicking anywhere on it** stands it up.
5. The reaction row says **armed** or **held** in words, not only by which way the card lies.

## 2b.1 A round stands the hand back up

**This is the one to run first.** It is the bug.

**Do.** Press **Hold all** so the whole hand lies sideways. Now end your turn and start the next
one, or just press the refill.

**Expect.** **Every card upright**, the ones you kept as much as the ones you drew.

**The failure to watch for is partial**, which is what made it hard to see: new cards arrive
upright whatever happens, so a hand of five with three leftovers reads as *mostly fine* with three
cards on their side. Count them. If any card that was in your hand before the draw is still
sideways after it, that is the bug not fixed.

> It compounds, which is why it matters. Your turn ends and the hand goes down; next round only the
> new cards come up; the round after that, fewer still. A player who never pressed anything would
> find their defence quietly gone.

## 2b.2 The whole card is the switch, when the reaction is all that is left

**Do.** Press **Hold all**. Click a sideways card **on its picture or its name** — not on the
reaction strip at the edge.

**Expect.** That card stands up. Only that one.

**Then click one of its halves while it is down.** That still **stages the half**, because a held
card still plays: sideways is about the ⚡ row and nothing else.

**And the two cards that had no way back.** A **Wound** in hand has no reaction row at all, and a
reaction your armour switched off is printed as dead grey text rather than a button — so *Hold all*
could turn either one down and nothing could turn it back. Get a Wound into your hand, press
**Hold all**, and check you can stand it up again by clicking it.

## 2b.2a A spent turn, and the rest of the hand

**Do.** Play a primary and a secondary — a normal turn. Now look at the three cards still in hand.

**Expect.**

- **Both halves on every one of them are greyed out**, and hovering says *your primary is spent
  this turn*. Before today they were still clickable, and you could play them: a five-card hand
  was five actions, which is not the game.
- **The reaction row is still live**, because the one decision you have left on those cards is
  whether they fire.
- **Clicking anywhere on such a card toggles armed/held.** Picture, name, a greyed half — all of
  it, because the card has exactly one move left and that is it.

**Then end the turn and start the next one.** The halves come back, and the hand stands upright
(2b.1). Out of combat there is no next turn, so the halves stay spent until a fight starts or you
reopen the tray — the same way the deck only deals once out of combat.

**If you are Exhausted**, it is **one card** a turn, not one of each half: play either half and
both are gone.

## 2b.3 The row says which it is

**Do.** Look at the ⚡ row on an upright card, then on a held one.

**Expect.** **Brace — armed** upright, **Brace — held** when down, and the marker at the left of
an armed row is darker than a held one.

**Put on Plate**, which takes the Sidestep away. That row reads **Sidestep** struck through and
grey, with **neither word**: it is not armed, because it will not fire, and it is not held, because
nobody held it. Three states, three looks. A blocked row reading *armed* would be the card
promising something the armour already refused.

---

# 2c. The turn, the window and the body  **[new 2026-11-22]**

**Why manual:** four changes asked for after a second test round, three of which are about what is
on the screen and one of which happens on somebody else's machine.

## 2c.1 Nobody presses anything to get a hand

**Do.** Put the Warrior and a goblin in a fight and press **Begin combat**. Do not touch the deck
corner.

**Expect.**

- The Warrior's hand is **dealt**, up to hand size, as the fight begins.
- The **action deck corner** reads *cards dealt* and is dimmed: it has already dealt for this turn.
- **End the turn and come round again.** The hand is topped back up to size at the start of your
  turn, without a click.

**Then play a reaction before your own turn** — easiest with two characters, or by holding a card
and letting the goblin hit you. At the start of your own turn the hand comes back **up to size**,
including the card you reacted with. That is the ruling: reacting early and reacting late now cost
the same (core-rules §3).

**And out of combat.** The corner is **never** dimmed out of a fight, because out of a fight there
is no turn for it to be spent on. Pressing it with a full hand should say **nothing at all** — it
used to warn *Draw pile is empty*, which was a statement about the draw and not about your hand.

## 2c.2 A body on the floor looks like one

**Do.** Take the goblin to **0 Health** — hit it, or type 0 into its sheet, which is the case most
worth pressing because it does not go through a blow at all.

**Expect.**

- A **skull** is drawn over the whole token, not a small badge in the corner.
- The goblin **leaves the combat tracker**.
- Its tray shows **Unconscious** in the conditions pile, and its reactions are off.
- Chat says it is down and out of the fight.

**Then heal it above 0.** The skull comes off, the Unconscious goes with it, and **the figure is
back in the combat tracker at the place it drew** — the same initiative it had before it went
down, because the order is drawn once and holds for the whole fight (core-rules §3). Chat says so.
Check the tracker rather than the token: the number beside its name should be the one it had.

Do the same to the **Warrior**: a character is not a special case. **And end the fight while
somebody is down**, then heal them: there is no fight to go back into, and nothing should be
re-created or complained about.

## 2c.3 A caster can still see their conditions

**This is the one to run with a spell on the hero.** It is the fault that was reported.

**Do.** Open the tray on a character with **no** spells and count the piles down the left: Items,
Features, Conditions, and the action deck in the corner. Now give that character a spell — the
prepare macro from [Setting up](#setting-up) will do it — and look again.

**Expect.** **Five things down the left edge**, all of them on the screen: Items, Features,
**Spells**, **Conditions**, and the deck corner. The cards are each a little smaller than they
were, which is how the fifth one fits.

**Before today the Conditions pile went off the bottom**, which reads as the spell deck having
replaced it. Worth checking at a small window — **1366×768** is where it is worst.

## 2c.4 Where the discard is

**Do.** Look at the bottom of the right-hand column, under the **Play** button.

**Expect.** **Three deck backs in a row** — Fate, Discard, and Spent once anything is Spent — each
about a third of the column wide, each with its icon, its count and its name. Clicking one spreads
it beside the column, the same as the decks down the left.

They were a row of small icon counters on the same line as Health and Block, which is where *the
discard pile is not visible* came from. **Play a card and watch the Discard count go up**, which
is the thing that was impossible to see.

## 2d.1 A goblin's decks are a hero's decks

**Do.** Open the tray on the **Starter Warrior** and look at the left column. Then click a
**Goblin** token on the canvas and look again, without closing anything.

**Expect.** The decks are **the same size and in the same place** on both. Three backs down the
left — Items, Features, Conditions — and on the goblin **no deck corner at the bottom left**,
because the round deals a monster's intent for it and there is nothing there to press.

**Two things used to be wrong here at once.** The goblin's cards came out half again as large,
because the column was measured by counting the piles drawn and the goblin has one fewer. And the
Warrior's HUD was still on the screen underneath — look for a **second set of smaller card edges
showing through the gaps**, or a *Skill deck* and an *Action deck* button in a corner the goblin
does not have. Select back and forth a few times: there should never be more than one HUD.

## 2d.2 Two decks open at once, each beside its own deck

**Do.** Click **Items**. Then, without shutting it, click **Conditions**.

**Expect.** **Two rows of cards**, each starting level with the back it came out of — the Items
row beside Items, the Conditions row further down beside Conditions. Clicking **Items** again
shuts **only** that row.

Open the **Discard** under the Play button too, and its row should appear down beside *it*, not up
at the top of the screen. Before today every row appeared at the top of the column whichever deck
you clicked, and opening a second deck shut the first.

## 2d.3 Items means what you are carrying

**Do.** Look at the number on the **Items** back, then click it.

**Expect.** The number and the number of cards that spread are **the same**, and both are the
count of what is **equipped** — what is in your hands, on your back and on your belt. The heading
reads *Items — equipped*.

**Now unequip something on the character sheet** and look again: both numbers drop by one. The
card is in the pack now, which is the sheet's business. **Clicking a card in this spread does
nothing**, on purpose: it is a reference, not a control. Turning one over for value and weight
still works, and so does the star that picks your default weapon.

**On the goblin this used to read 1 and open on nothing**, which is the clearest version of the
fault: the back counted everything owned, the spread showed everything *not* in play, and an
equipped knife is in neither list.

## 2d.4 The skill deck deals

**Do.** With no fight running, turn the window to the **skill** side if it is not there already,
and click the **Skill deck** in the bottom-left corner.

**Expect.** A **skill hand is dealt**, up to your skill hand size, exactly as *New scene* on the
scene panel does — it is the same deal in a second place. The corner then **dims** and says the
hand is full, the way the action deck dims on a turn it has already dealt.

**As a player rather than the GM**, clicking it should say *The GM says when a new scene starts*
and deal nothing. That rule has not changed; only where the GM presses has.

## 2e.1 A deck is the same size whoever you click

**Do.** Give the Warrior a spell (the prepare macro in [Setting up](#setting-up)), so its left
column holds four decks. Open its tray, then click a **Goblin**, which holds three.

**Expect.** **The decks are the same size on both**, and in the same place. The goblin has no deck
corner at the bottom left — the round deals a monster's intent for it — but the three backs it
does have are the size the Warrior's four are.

**And the hand does not change size either.** This was reported twice: the first time the monster's
cards were bigger, the second time the caster's were smaller. Check at **1366×768**, where every
card is at its smallest, that the names on the cards in the play stacks still fit — *Wooden
Shield* is the one that goes first.

## 2e.2 Outside a fight, nothing is spent

**Do.** With **no combat running**, play a card's primary, then look at the rest of your hand.
Play another. And another.

**Expect.** **Nothing greys out.** There is no turn outside a fight, so there is no budget to
spend: every half in the hand stays playable for as long as the scene lasts.

**Before today the first card killed the hand.** Out of combat every turn is the same turn, and
the same turn never ends — so one card left you with greyed halves and nothing but reaction rows
until a fight started and ended. Now start a fight and check the opposite: inside one, a played
primary and secondary **do** grey the rest until your next turn.

**And watch the draw pile, the stamina and the discard while you do it.**  **[2026-11-23]** Play
five or six cards out of combat.

**Expect.** The **draw pile bar does not move**, the **stamina does not move**, the **discard stays
empty**, and the cards you played are **still in your hand** — the same card can open the next
door. Nothing reaches the Spent pile either, even from a half printed *Spent*. And your hand is not
turned sideways afterwards.

**Before today it drained for good.** Each card went to the discard, the hand drew a replacement off
the draw pile, and only the end of a fight sweeps those back — so a scene of searching ran the
deck down permanently, and spent stamina never came back either. At zero stamina the remaining draw
pile is dumped into the discard, which is how a character ended an evening with no deck at all.
Reported as *the action deck gets empty even outside a fight*. Inside a fight, check the opposite: a
played card **does** leave the hand and **does** cost 1 stamina.

## 2e.3 The fate card, dealt and parked

**Do.** Make any check, or play a Strike. Watch the middle of the screen.

**Expect.** A **fate card appears in the middle of the scene**, big enough to read, with its value
on it — `+1`, `±0`, `Critical`. It then **shrinks and flies to just under the Fate and Discard
piles**, at those piles' width, and sits there for about five seconds before going.

**A turn that draws twice** — a primary and a secondary that both resolve — parks the first card
and then the second **to its right**, in that order.

**With advantage or disadvantage**, **two** cards are dealt side by side. The one the rule does not
take **fades out where it is**; the one it takes flies to the pile as above. That is the only place
in the game you can see the card you did not get, so it is worth watching twice.

**An action that draws twice shows two, then one.** Drop a goblin to 0 with an attack made with
advantage, or force a saving throw with one: the attack draws a pair and the injury or the save
draws again. **There should never be three cards in the middle at once** — the pair, then the
single after it has landed. Three together was the fault reported on 2026-11-23, and the third card
belonged to a different draw with nothing saying so.

**Each card says who drew it and what for.**  **[2026-11-23]** Under the value, in small type:
*Thora — strike with Goblin Spear*, *Goblin — saving throw: Dazed*, *Goblin — injury draw*.
Check a goblin's draw especially: before today a card drawn for a creature looked exactly like one
drawn for you.

**A card with no picture is fine** — the text is the card. What should never happen is a blank
card with *no text*, or a card that stays on the screen.

## 2e.4 A goblin off the shelf is a goblin  **[2026-11-23]**

**Do.** Open the **Creatures** compendium and drag any creature onto the scene — not one already
in the sidebar, one straight off the shelf. Then fight it: hit it with something that forces a
saving throw, and drop it to 0.

**Expect.** A notification as it lands, saying its card stacks were wired up. Then, in the fight:
the saving throw **draws a fate card** — you see the reveal in the middle of the screen with
*saving throw* on it — and dropping it to 0 **draws again for its injury**. A chat line for each.

**Before today none of that happened, and nothing said so.** A creature in a compendium carries no
decks — those slots hold ids of documents in a world, and a compendium has no world to point at
— and only two routines ever filled them in: the one that builds the starter goblins and the one
a GM calls by name. So a dragged-in creature had no fate deck, which means its saving throws were
decided by its passive score alone with **no card drawn and nothing in chat**, and dropping it to 0
drew no injury. Reported as *post saves from npc to the chat*.

**And if you find one that was already in the world before today**, drop it to 0 and read the
chat: it should now say in words that there is no fate deck to draw an injury from, instead of
saying nothing at all. Re-saving the creature, or rebuilding world content from the system
settings, gives it one.

> **[CHANGED 2026-11-26]** This step used to expect a second line, about there being no pile to
> put a **Wound** in. There is no such line for a creature any more, and there should never have
> been: a creature is not wounded at all (2g.6 below). Asking a GM to go and give a goblin a pile
> for a Wound was the engine instructing them to cause the defect 2g.6 is about. A **character**
> with no discard pile still gets that line, which is the figure it was always for.

## 2f.1 A caster can find their spells  **[2026-11-24]**

**Do.** Open a caster's sheet and go to the **Spells & features** tab. (If nobody in the party
casts, give a character a spell from the **Formulas and Miracles** compendium first, and a spell
slot or two on the Vitals tab.)

**Expect.** A **Spells** block above Features, with the slot budget in the heading — *2 of 3
slots*. Prepared spells first, the book after them and dimmed. Each row says the school, what it
costs to **keep** in your head, and on its own line **what each cast takes**: *Each cast: 2 Health*,
or *Each cast: nothing*, which is the common answer and has to be said rather than left blank.

**Then prepare one.** Click **Prepare** on a spell in the book: it moves up into the prepared group
and the heading's count goes up. Click **Put back in the book** and it goes the other way. Try one
whose strength is more than the free slots and it should be **refused in words**, not allowed.

**Then open one.** The dots at the end of a row, then **Edit**. The slate sheet opens on the spell:
strength, school, the four prices, prepared, and the whole effect.

**Then cast it twice.**  **[2026-11-24]** Target something, click the prepared spell on the tray's
spell deck, and then click it again.

**Expect.** The first click casts. The second does nothing but say so: *the preparation is spent; a
long rest puts it back in your head*. On the tray the card is **greyed** with *cast — back on a
long rest* in its note; on the sheet the row is **struck through** and says the same. The slot is
still counted — the heading does not go back up — and **Put back in the book is refused**,
because the slot is what the rest is about.

**Then take a long rest** from the Vitals tab. A chat line names what came back, the row is live
again, and it casts again. A **short** rest should NOT bring a spell back.

**Also worth one check:** a feature printed *recharges: a long rest* should now come back from one
too. Nothing had ever honoured either rest boundary — only the end of a fight — so a feature
or a warded counterspell spent in the first fight of a campaign stayed spent for the whole of it.

**Before today a cast cost nothing and could be repeated for ever.** Strength is a slot cost, so
slots bounded how many spells you held and no rule bounded the casting, and 117 of the 147 spells
print no price at all. Casting now spends the preparation, which makes your slots what you can cast
between sleeps.

**Before today none of this existed and the sheet threw.** Two faults, reported together as *spells
are not visible on player sheet, spells cannot be viewed or edited*:

- the sheet listed items, features and injuries and **never spells**, so the only road to one was
  the Items sidebar, which holds the world's spells rather than a character's — and preparing is
  done by writing that field, so the one decision a caster makes between fights had no surface at
  all;
- and the slate sheet **failed to render for a spell**. One option in the step editor printed a
  timing as an object instead of its label; the error killed the part, the part killed the sheet,
  and a spell was the only slate kind that reaches that editor. A **card's own config sheet** went
  with it, so check one of those opens too: right-click a card in a deck in the sidebar.

## 2g.1 A rest does everything a rest does  **[2026-11-24]**

**Do.** Play two skill cards so the skill discard is not empty. Take a Wound (any hit of 5, or drop
to 0). Then **short rest** from the Vitals tab, and read the chat.

**Expect.** A line saying what the rest did: the skill cards shuffled **back into the skill deck**,
the health healed, the Spent cards taken back, and how many rest tokens are left. The skill discard
is **empty**. The Wound is **still there** — a short rest does not shed one.

**Then press Short rest again.** The button should be **greyed**, because you have no token left.
(If you reach the routine another way — a macro — it refuses in words.)

**Then long rest.** The Wound goes, health heals 5, every rest token comes back, and the chat line
says so.

**Before today a rest did three things and claimed four.** The skill discard never came back on any
rest, though skill-rules says it does and the deal routine's own comment relies on it — so a skill
deck drained across a session permanently, exactly like the action deck did out of combat. A long
rest removed no Wound, though the Rests table and the function's own comment both said it did, and
**nothing anywhere removed a Wound at all**. And a rest on a healthy character with nothing Spent
posted no line, so the button could not be told from a broken one.

## 2g.2 Elite or boss  **[2026-11-24]**

**Do.** Open a goblin's sheet, note its Health, Total armor and the six passives. Tick **Elite or
boss**. Untick it.

**Expect.** Ticked: Health **×1.5 rounded up**, armour **+1**, and every passive **+1**. A note
beside the box says exactly that. Unticked: all three back where they were. What the creature
**deals** does not change, by decision — an elite that hits harder is a different card.

Then fight one and check the passives bite: an opposed check or a saving throw against an elite
should be one harder than against its ordinary twin.

**Before today the tick did nothing whatsoever.** It was a boolean on every creature's sheet that
no rule read.

## 2g.3 A Cleansing  **[2026-11-24]**

**Do.** Give a character three Taint (or play until they have it) and check they are **Afflicted**
— max Health —3. Then, as GM, run the Cleansing challenge at the table (Lore, Progress 4,
Pressure 4) and when it is won call `game.cardrpg.cleanse(actor)` from a macro or the console.

**Expect.** A chat line naming how many Taint left the decks, and the Taint is gone from every pile
— the deck, the discard and the hand. Afflicted lifts once the character's sheet next updates.

**And the exception.** If any of that Taint was **bound** — put there by an obligation — it
**stays**, and the line says so: *only what the obligation names takes it back*. That sentence has
been on the data since Taint was built and nothing read it, because the thing it was an exception
to did not exist until today.

**Before today nothing in the game removed Taint.** It survives rests by rule, and the two ways out
the rules give — a cure and a Cleansing — had no engine path at all, so a character three
Taint deep was Afflicted for the rest of the campaign.

## 2g.4 One Taint is one Taint  **[2026-11-24]**

**Do.** Open the character sheet beside the HUD. Take Taint one at a time (a tainting card, a
miracle's price, or the GM adding one) and watch the sheet as each arrives. Then draw one out of the
deck and look again.

**Expect.** The Taint count goes up **as each one arrives**, with nothing else touching the sheet.
At **three** the character is **Afflicted** and max Health drops by 3 on the spot. A Taint that has
been **drawn** out of the deck still counts as **one**. Remove them and Afflicted lifts.

**Also check the Deck tab while a hand is out.** The card count should be the size of your deck,
not your deck plus your hand.

**Before today both halves were wrong.** A dealt card is a copy — the home card stays in the deck
marked drawn and a second document goes where it went — and this was the one counter in the system
that asked for *every* card document rather than the real ones. So one Taint read as two from the
moment it was drawn, and **Afflicted could bite at two instead of three**: 3 Health off somebody who
had not earned it. A legal 16-card deck reported 21 against a limit of 20. And nothing recomputed
any of it when a card moved, because a card is not part of the actor — so the numbers were right
whenever something else happened to touch the sheet, and stale until then.

## 2g.5 Out of reach, and nobody stopping you  **[2026-11-24]**

**Do.** Stand three squares from a goblin with a sword in hand, target it, and Strike.

**Expect.** Before you click: the range chip reads **3/1** and is marked out of reach, with a tip
saying nothing stops you playing it. After you click: the attack **resolves**, and the chat card
carries a note — *out of reach: Goblin is 3 squares away and this strike reaches 1. It resolved
anyway.* Then stand next to it and Strike again: **no note**, because there is nothing to say.

**Range stays unenforced on purpose** — the engine does not know about the rope, the ledge or
whatever the table has agreed. What changed is that the **GM** is now told, in the log, after the
fact. Before today only the player clicking was warned, and the person who has to adjudicate it saw
a clean kill.

## 2g.6 One goblin dies and the others are fine  **[2026-11-26]**

**Do.** Put **two goblins of the same kind** on the scene and start a fight. Drop one of them to 0.
Then let the round turn over and look at what the goblins intend to do next.

**Expect.** The dropped goblin **falls and draws for its injury** — a fate reveal and a chat line,
exactly as before. What must **not** happen is a **Wound** card appearing anywhere: not in the
goblins' discard, not in their intent deck, and not as a chat line asking for one. Open the
goblins' **Discard** from the tray and count: no Wound in it. Keep playing for a few rounds and the
intent that comes up is always a plan — never a dead card.

**Then do the same to a character.** Drop a hero to 0: they take a **Wound** into their action
discard, the way they always have, and it comes back into their hand on a Catch Breath. Same call
in the engine, different answer, and the difference is that a hero has a **hand**.

**Why.** Reported as *Wound cards should only be added to individual decks, all goblins should not
be wounded when one dies* — and the rule being asked for is one core-rules decided on 2026-11-07:
an NPC cannot be wounded. Intent is drawn **one card per type**, *one for all the goblins*, so a
creature's deck belongs to its species while a Wound belongs to an individual. A Wound in that pile
is reshuffled into the deck every goblin of that kind draws its plan from, so hurting one goblin
would have cost the whole kind a round, over and over, for the rest of the fight.

**It broke by being fixed somewhere else.** The old guard was that a creature had no discard pile
to put a Wound in — and it had none because nothing had ever built one, not because anything
checked. 2e.4 above is the day that was fixed on purpose, so that a creature off the compendium
shelf could take a saving throw and an injury draw at all. From that day every creature had a pile,
and the Wound went into it. The guard now asks whether the figure has a **hand**, which is the
actual reason and cannot quietly stop being true.

**A boss is refused too**, even one with stacks nobody else shares. A dead card in a five-card hand
costs you a breath; a dead card in an intent deck costs a figure that draws one card a round for
its whole kind an entire round. **Confusion** is the card for that, and it is deliberately not a
Wound: what it corrupts is the type's *plan*, which is a thing a species really does share.

## 2g.7 A Followup swings the same weapon  **[2026-11-26]**

**Do.** Give the Warrior **Follow Through** (it is a Strength pool card, so a GM can drag it into
the action deck). Start a fight with one weapon in hand — the Longsword and nothing else. Deal a
hand, stage an ordinary **Strike** as your primary, then stage Follow Through's **secondary**.

**Expect.** The secondary reads the Longsword's number minus one, and its tooltip says
**Longsword supplies the value**. Now compare: stage *Off-Hand Blow*'s secondary in the same
position instead, and it reads **0** — bare hands at 1, less the card's own &minus;1 — because the
Longsword was spent on the first Strike.

**Then try to play it wrong, twice.** Stage Follow Through's secondary with **nothing** as your
primary: the half is greyed and the tooltip says *Stage the Strike first: a Followup swings that
weapon again.* And a Followup printed on a **primary** half is greyed with *A Followup is a
secondary only.*

**Why.** *A weapon serves one Strike a turn*, which is the right rule — but nothing said what the
second Strike reaches for when there is no second weapon, and the answer was your fists. So
*Off-Hand Blow*, the card core-rules §3 names as the game's answer to double attacks and hands to
every fighter, resolved to a punch for anyone holding a greatsword, halberd or musket. Follow
Through is that character's card and the one named exception to the rule.

**The order is not politeness.** A weapon is spent in the order you click, so the weapon a Followup
reuses exists to be found only once the Strike is staged. That is why the refusal names the order
rather than greying the half without a word.

**And try it with the wrong blade.** Give the Warrior **Inside the Guard** (Shade pool), keep the
Longsword in hand, stage a Strike and then its secondary. It is greyed and says **needs light in
hand** — because the card is about the knife, and the Longsword is heavy. It must *not* quietly
strike for 0: bare hands are light, so the obvious implementation answers a greatsword opening with
a fist and calls it a follow-up.

**The other two, for the shape of the family.** **The Whole Arc** is the same weapon at **full
value** and asks you to Strain 1 — you pick a card out of your hand to throw away, and the dialog
should appear as you play the half. **Off Their Feet** is &minus;2 and leaves the target
**Off-Balance** for a round; check the condition actually lands on the target's sheet, and that it
lands on a hit rather than asking for a save.

## 2g.8 A spell is cast off a ✦ Cast half  **[2026-11-26]**

**Set up.** Any character with a prepared spell. Give them **Say the Words** (common pool: ✦
Cast on the primary, Move 1 on the secondary) and put it in the action deck.

**Out of a fight, first.** With no combat running, click the spell in the book. It casts, exactly as
it always has, and the preparation is spent. **There is no turn out there to spend**, which is the
same ruling the half budget already makes: playing a card in a corridor is not a turn.

**Now start a fight and click the spell in the book again.** It refuses, in words that say where to
go instead: *In a fight, &lt;spell&gt; is cast off a ✦ Cast half: stage one from your hand. The
book is the road out of a fight, and for reactions.* Nothing is spent — check the spell is still
castable and your Health has not moved.

**Then do it properly.** Target a token, deal a hand, stage **Say the Words**' primary, and play the
turn. The spell resolves as it does from the book: same chat line, same price, same preparation
spent. The difference is that the card is in your discard and your primary half is gone.

**Expect, specifically:**

- the card is **retired** and the primary is spent, like any other card half;
- the spell is **drained** — one cast, back on a long rest, unchanged by this;
- **Dazed takes it.** Put Dazed on the caster and try to cast off a **secondary** Cast half: it
  refuses with *loses the secondary half*. Before this, Dazed took a fighter's secondary and took
  nothing whatever from a caster, because a cast had no half to lose.

**With a wand as well as a book.** Equip a Fire Wand and play the half: a dialog, **Cast what?**,
listing each prepared spell with its strength and its price and, as the default button, *Fire Wand
— its own magic*. Pick the wand and it behaves exactly as a Cast half did before any of this.

**And the modifier rides on the spell.** Play **The Prepared Word** (✦ Cast +1, Way of Mind) and
put a damaging formula through it: one more point than the formula prints. Put a **condition**
formula through it instead and the +1 does nothing at all — which is the rule and not a bug. A
✦ Cast half can make a spell better, never different.

**Where it should refuse before you ever play it.** Unprepare everything, hold nothing that casts,
and try to stage a ✦ Cast half. It is greyed and says *Nothing prepared, and nothing in hand
that casts.* It must refuse at the **staging click** rather than when the turn is played: a card is
retired whether its steps resolved or warned, so a refusal any later costs you the card.

**Why.** A cast cost nothing at all: no card, no half, no stamina. A caster took two card halves and
a spell where everyone else took two halves, four slots could all go in round one, and nothing that
costs a half — Dazed above all — reached a caster. And the reason it had been nobody's decision:
**no card in the game printed a ✦ Cast**, so there was no half to spend. 25 cast steps in the
content and not one of them on any of 234 cards.

## 2g.9 A caster has cards of their own  **[2026-11-26]**

**Do.** Walk a character into **Way of Mind** on the level-up pane. The Way grants the Scholar
title; the node behind it, **What You Prepared For**, offers a menu of six cards. Take one. Then
walk the trunk to **The Candle** and check what it hands over.

**Expect.** The menu lists *Across the Room*, *Past the Shield*, *Step and Speak*, *The Last Word*,
*The Long Formula* and *The Prepared Word*. The Candle grants **Say the Words** — not *Measure*,
which is what it granted until today. Do the same on **Way of Faith**: **What You Were Taught**
offers the Sworn's six, and **Pilgrimage** grants Say the Words.

**Why.** Mind and Faith delivered the thirteen schools and the twelve gods as *spells* and had no
cards at all, so a magician's deck was the starter Warrior's sixteen plus the common pool's six —
every one of them a fighter's card, and the one card a scholar was guaranteed was a Strike +1. The
martial Ways have had a *What You Favour* menu since 2026-11-07; the magical ones could not have
one, because there was no list to put behind it.

**One thing to notice while playing it, which is the open question.** A fighter has a Strike in hand
almost always: 9 of 16 cards print one. A caster starts with **one** Cast card and buys the rest a
node at a time, so hands with nothing castable in them will happen. That is the gap a **starter
caster deck** would close, and there is no such deck yet — the game has one starter deck and it is
the Warrior's. Note how often it bit.

## 2g.10 A ritual is the work of a night  **[2026-11-27]**

**Do.** Give a Way of Mind character **The Clean Pot** (one night) and **The Door Home** (three
nights) — both Household Magic, both rituals. Out of a fight, open the tray's **spells** pile.
Then, in order:

1. Click **The Clean Pot** without preparing anything.
2. Open the character sheet and press **Prepare** on *The Door Home*.
3. Start a fight, take your turn, and click **The Door Home** in the pile.
4. Stage a ✦ Cast half — *The Prepared Word* or *Say the Words* — and look at the menu.
5. End the fight. Cast **The Door Home** out of combat, then take a **long rest**, and another,
   and another.

**Expect, in the same order.**

1. **It casts**, with nothing prepared, and posts two lines: *a ritual: 1 night of work*, then the
   rations. The face reads `Household Magic · 1 night of work` where a spell reads its slots.
2. **Prepare is refused**: *The Door Home is a ritual: the work of 3 nights, read out of the book.
   It is never prepared and never costs a slot — cast it from the tray, out of a fight.*
3. **Refused by the timing**: *Ritual: not while the fight is on.* Not the book's usual in-fight
   sentence — that one tells you to stage a ✦ Cast half, and no card in the game carries a
   ritual.
4. **Neither ritual is on the menu.** Only prepared, castable spells are, plus the implement in
   hand. This holds out of a fight too: try the same half in a corridor.
5. The cast says **3 nights of work**. The first long rest says *works a night on The Door Home (2
   nights to go)*, the second *(1 night to go)*, and the third says *has The Door Home ready
   again*. A **short rest** in between says nothing about it: an hour is not a night.

**Why.** A ritual had no road at all. `!prepared` greyed every one of them in the tray, so the
seven in the game were decoration on a pile; `payToCast` refused an unprepared spell, so even a
reachable one would have been turned away; and Prepare quietly said yes, because a ritual's slot
cost is zero — which left a *prepared ritual*, a state the rest of the engine then had to be
wrong about twice in the player's favour. The `strength` on each of them was a number the content
itself called *standing in for nothing*, and the nights it stands for now are the one price in the
game paid in time.

**One thing to notice.** Step 4 is the part that is a rule rather than a side effect. A card half
is a **turn**, and a night does not fit in one whether or not a fight is running — so the menu
leaves a ritual out in both states, and not because the clock happened to catch it.

## 2g.11 A recipe starts its own ritual  **[2026-11-27]**

**Do.** As GM, put **Recipe: Regrowth** in a character's pack and open the recipe's own sheet.
Then press **Begin the ritual** and look at the board and the chat. Have the character answer the
call once and **fail** it.

**Expect.** The sheet names what the recipe runs before you press anything: *Regrowth — lifts
maiming. A downtime challenge: Progress 6 against Pressure 4, answered with Lore.* Pressing the
button puts the tracks on the board at **Progress 6 against Pressure 4**, both empty, sets the
call to **Lore**, and posts the same sentence with *A twist comes off the ritual deck. The DC is
the GM's.* The failure draws from the **ritual twist** deck — whose cards are about the injury
being lifted — and not from the scene deck.

Open the sheet as a **player** who owns the recipe: the description is there and the button is
not, replaced by *The GM puts a challenge on the board.*

**Why.** `ritualChallenge` could answer all of this from the day the four rituals became items
(2026-11-08) and **nothing had ever called it**: the only mention of it anywhere outside its own
body was a check that it existed. A GM read Progress 6 and Pressure 4 off the recipe's text and
typed them into the board by hand, which is exactly the shape of defect this project keeps finding
— a field with a reader nothing reaches.

**What to watch for.** The DC. The recipe sets the **approach** and nothing else, because no ritual
in the content states a difficulty; the call takes the engine's default and you are meant to move
it. If a number ever appears there that the recipe seems to have chosen, that is a bug.

---

# 3. What the other person sees

Open a second browser as a player who owns the Starter Warrior, with the first as GM.

## 3.1 A Read is private, and the fact of it is not

**Do.** As the player, cast *Where It Will Land* in a fight.

**Expect.** Two messages.

- The player and the GM see **which cards** were on top.
- Everyone sees that a Read happened, **without** the cards being named.

Check the second message in a third client, or as another player. Saying what you saw is meant to be
your decision at the table; a secret nobody knows you took is one the table cannot play against.

## 3.2 A Foresee is private the same way

The intent card is whispered to the player and the GM, and the card stays face down.

## 3.3 GM-only buttons

As a player, try: dealing skills for a new scene, drawing a twist, starting a challenge, granting a
level. Each should refuse with a message saying it is the GM's to do — not fail silently, and not
work.

---

# 4. A brand new world

**Why manual:** the automated suite copies an existing world, so the moment a world is created is
never exercised.

**Do.** Make a *second* world with the system and press **Rebuild world content** in it.

**Expect.**

1. No errors in the console during setup, and the report dialog counting **6 actors**.
2. The Warrior has ten stacks — an action deck, a hand, two discards, a spent pile, quarantine, two
   fate piles and the skill side's three — and **16 cards in the action deck**. The diagnostic macro
   in [Setting up](#if-something-looks-wrong-before-you-start) prints all of it.
3. **The fate deck is shuffled.** This one matters: draws come off the top now, so an unshuffled
   deck would deal its twenty faces in a fixed order. Draw fate a few times in a fresh world and
   then in another fresh world — the sequences should differ.
4. The goblins share one fate deck between them, and each type has its own.

---

# 5. The sheets

**Why manual:** the suite checks the templates exist and reference real fields; it does not type
into them.

## 5.1 The step sheet

Open any spell or action card in the items directory and look at a step.

**Expect to be able to set, and have it stick after a reload:**

- **Reads** — a number box *and* a deck choice beside it. Both or neither: a Read with no deck named
  is a card written wrong.
- **Only while** — a dropdown with **six** states. If you see *while you spend a secondary* or
  *while you keep it up*, something has gone backwards: those were removed because they name a
  price nobody collects, not a state.
- **Cost** — Health, Taint, Strain, skill cards, and a scale.
- **Delay** — a number of your own turns.

## 5.2 The character sheet

Equip and unequip across all ten slots. Check that armour from a helmet, cloak, neck, fingers and
feet all count, and that a weapon slung on your back grants nothing while it is there.

---

# 6. Reporting what you find

For anything that fails, note: **what you did, what you expected, what happened**, and whether a
reload changes it. If it is a dialog, say which button you pressed. A screenshot of the card face is
worth more than a description of it, because half of these scenarios are about what the card says.

Two questions worth answering even when nothing fails:

- **Could you tell what a spell would cost you before you cast it?**
- **When something refused, did it say why in words you could act on?**

Both of those are what the last three increments were about, and neither is something a test can
decide.