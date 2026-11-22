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

- The dialog lists exactly **one** card, with a checkbox, and says the ticked card goes to your
  discard and that a Catch Breath brings it back.
- Ticking it and binning moves it to the **discard**, not out of the game. Draw pile one shorter.
- The chat line says the Warrior sifts 1 and bins 1.

**Then do it again and press "Keep them all".** Nothing moves, and the chat line says so.

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