# Card RPG — Foundry VTT system

Playtest build, **combat only**. Out-of-combat play, character creation and levelling come later.

Target: **Foundry VTT 14**. Design docs are in [../](../) (system specs) and [../../rules/](../../rules/) (the game).

## Install for testing

The system lives in this repo and is linked into Foundry's data directory, so edits are version
controlled. From an **elevated** prompt (a junction needs no admin, a symlink does):

```cmd
mklink /J "C:\Users\kaise\AppData\Local\FoundryVTT\Data\systems\cardrpg" "C:\Users\kaise\source\repos\CardRPG\CardRPG\foundry\cardrpg"
```

Then restart Foundry and create a world with the **Card RPG** system.

## The compendium  **[BUILT 2026-11-02, LOADED 2026-11-03]**

**Everything the system knows ships as compendium packs**, so a GM can browse and drag without
running anything. Seven packs, 394 documents, in a **Card RPG** folder in the compendium sidebar:

| Pack | | |
|---|---|---|
| **Creatures** | 47 | every creature in the roster, bases and variants, with gear embedded |
| **Pregenerated Characters** | 1 | the starter Warrior |
| **Items** | 166 | the catalogue, NPC gear and the natural weapons |
| **Features** | 22 | including the 8 a school teaches: the 7 tattoos and a renunciation |
| **Formulas and Miracles** | 117 | the school spells the setup routine never created |
| **Signatures** | 30 | the 7 features, 1 item and 22 spells a title hands over |
| **Decks** | 11 | the action pools, skills, Wild Magic, fate, twists and the intent pool |

The 21 Signatures that are **cards** are in the *Signature Cards* deck rather than the Signatures
pack: a Card is a different document class, and a pack holds one class.

### A pack is built, not kept

**The content tables are the single source of truth and the packs are generated from them.**

```
npm run packs
```

That writes `packs/_source/<pack>/*.json`, one readable file per document, and compiles each into
the LevelDB under `packs/<pack>/` with Foundry's own packer. Both are committed, because a system
that ships only the sources ships no compendium at all. `npm test` then compares the committed
sources against what the generator would write today, so a table that moves without a rebuild is a
failure rather than a surprise.

> **Editing a pack inside Foundry edits a build artefact.** The next `npm run packs` overwrites it.
> Change `module/content.mjs` and rebuild.

**A document's id is a hash of its name and its pack**, not a random string, because an id is a
promise: a world that imports a creature keeps it, and so does every link. Regenerating with fresh
ids would break all of them silently -- the link resolves to nothing and the sheet goes blank.
Running the build twice produces the same pack twice, which `npm test` also checks.

**The packs are a library; the setup routine is still the starter world.** The routine below builds
from the same tables rather than importing from a pack. That is deliberate for now: it is what a
first session runs, it works, and rewiring it is a behaviour change nothing offline can test.

### Create the playtest content

Run the macro **Card RPG: Create starter content** (the system leaves it in your macro directory on
first load), or from the console:

```js
game.cardrpg.createStarterContent();
```

That builds the starter Warrior, **the goblin line** — the spearman, the Warrior, the Archer, the
Shaman and the Chief — their decks, and every slate. It is safe to run twice: anything it already
made is reused rather than duplicated.

**The other 63 creatures arrive one at a time**, because a starter world with 68 monsters in it is a
world nobody can find anything in:

```js
game.cardrpg.buildMonster("Mole Beast");
```

Each gets the intent deck its capabilities earn. Or drag one out of the **Creatures** compendium,
which holds all 68 ready-made.

**Place creatures as unlinked tokens.** Each *kind* owns its own intent deck and intent pile, and
the goblin line shares one fate deck — so five Flat Bugs on the table draw one intent between them,
which is the rule (core-rules 3). Unlinked tokens keep their own health while sharing those; linked
tokens would share health too, which they must not.

Set the scene's **diagonal rule to Equidistant** — distances are Chebyshev, so a diagonal step
costs the same as a straight one (core-rules §11). The system warns in the console if it isn't.

## Status

| Built | |
|---|---|
| Manifest, declaring Actor, Item and Card subtypes | `system.json` |
| Config: icon keys, conditions, groups, verbs, tactics, defaults | `module/config.mjs` |
| Actor models, with the stored/derived split | `module/data/actors.mjs` |
| Slate models: items and features | `module/data/items.mjs` |
| Card models: action, fate, npc, wound, taint | `module/data/cards.mjs` |
| Settings for every tuning value | `cardrpg.mjs` |
| Styles: tokens, card faces, group borders, tray | `styles/cardrpg.css` |
| Sheets for characters, NPCs, slates and cards | `module/sheets.mjs`, `templates/` |
| Playtest content as data, and the routine that builds it | `module/content.mjs`, `module/setup.mjs` |
| Offline validation | `test/validate.mjs` |

| Deck engine: refill, fate draws, Catch Breath, Overloaded, rests | `module/decks.mjs` |
| Resolution with the bonus-group cap | `module/resolve.mjs` |
| Combat: drawn initiative, intent cards, condition ticking | `module/combat.mjs` |
| The tray | `module/tray.mjs`, `templates/tray.hbs` |

| 62 icons from game-icons.net, with credits | `icons/`, `icons/ATTRIBUTION.md` |

| Not built yet | |
|---|---|
| Reaction prompts | the timer and the two-step redirect/reduce flow |
| Out-of-combat play, character creation, levelling | later slices |

## Icons

`icons/` holds 62 SVGs from [game-icons.net](https://game-icons.net) named by their keys, so the
filename *is* the enum value. They are **CC BY 3.0** and the credit in
[icons/ATTRIBUTION.md](icons/ATTRIBUTION.md) ships with the system because the licence requires it.

Each file is modified: the full-canvas background path is stripped and the white fill dropped.
Upstream they are a black square with a white shape on top, and masking that to `currentColor` would
render a solid block. `npm test` checks no background path has crept back in.

## Validation

```
npm install   # once, for the template check
npm test
```

Checks what can be checked without Foundry: every module parses, the JSON is valid, every file the
manifest promises exists, every static i18n key and `TYPES` label resolves, and the content still
matches the numbers in [../../rules/starter-cards.md](../../rules/starter-cards.md) — deck sizes,
the fate distribution, that every slate an actor references exists, that NPC gear is flagged so it
can't leak into player pickers, and that goblin weapons stay at least 2 above hero armor.

Templates are precompiled with real Handlebars, so a broken one fails the run.

It cannot tell you the system *loads*. Only Foundry can do that -- so ask Foundry:

```bash
node "$FOUNDRY/resources/app/main.mjs" --dataPath=<your data dir> --port=30001 --noupnp --world=<world>
```

The server is the same entry point the desktop app runs, it needs no browser, and it prints what it
thinks of every pack record. **A clean load is `0` warnings and `0` lines saying `Migrated`** --
anything it migrates is something it had to repair to use. The first time it was ever run against
this system it found one fault in 394 documents and rewrote all 48 Actors; both are checks now, and
a run today reads:

```
Launching World | Complete
Server started and listening on port 30001
```

with nothing between. A clean server boot proves the documents are well formed and the packs index. The data models and
the sheets are client-side, so it says nothing about them -- for that, drive a browser.

### Driving a client

`puppeteer-core` plus an installed Chrome or Edge needs no browser download. Boot the server as
above, then log a client in, wait for `game.ready`, and collect `console`, `pageerror` and
`requestfailed`. From there `game.cardrpg` is the whole API and `await import(...)` reaches any
module, so the engine can be exercised directly:

```js
const r = resolve.collectBonuses(actor, "strike", longsword);   //  +3 [Graven +2, Strong +1]
```

**That found five faults in an hour that 1736 offline checks did not.** Three modules used `CARDRPG`
as a free variable, which is invisible to `node --check` and to importing them -- the tray simply
never opened. Eight intent cards named a capability the Card schema refused, and a Card whose
`needs` is refused does not load at all, so every monster in the game was missing every way of
closing distance. And the level-up graph drew nothing, for the reason below.

What a client confirms, once those are fixed: all 394 pack documents build with 0 invalid, every
sheet renders, the tray renders its panels, `buildMonster` deals the right intents, and the law of
§2.4 holds in the game -- a tattoo arrives as a `feature` with no gate, its condition is derived
rather than granted, and its +2 reaches a heavy weapon and not a light one.

## The vendored cytoscape is patched

`lib/cytoscape.esm.min.mjs` carries **one edit** and will not work without it.

Foundry defines `equals` on `Array.prototype` as non-writable *and non-configurable*
(`common/primitives/array.mjs`). Cytoscape derives its collection prototype from `Array.prototype`
and then assigns `elesfn.equal = elesfn.equals = elesfn.same`, which in a module throws
`Cannot assign to read only property 'equals'` -- and the whole library fails to evaluate, so the
level-up dialog opens with no graph in it.

It cannot be fixed from outside: the descriptor is non-configurable, so redefining
`Array.prototype.equals` is refused too. The edit gives the collection prototype its own writable
`equals` at creation, so the assignment has somewhere to land:

```js
Object.create(Array.prototype, { equals: { value: void 0, writable: !0, configurable: !0, enumerable: !1 } })
```

Upstream 3.34.4 has the same line, so there is no release to wait for. **`npm i cytoscape` and a
copy into `lib/` would undo this silently**, so `npm test` checks the patch is present and the
unpatched line is gone.

## Playing a round

1. Open a character and press **Open tray**.
2. **Create a Combat** and roll initiative — it is drawn from each combatant's fate deck, not
   rolled, and ties redraw. Starting the combat refills hands and draws one intent card per NPC
   type, face down.
3. On your turn, click a **primary** and a **secondary** from two different cards. The order you
   click is the order they resolve, which is how the rules' "either order" is expressed.
4. **Target a token** before playing a Strike. Fate is drawn once per action, not per target.
5. **Play**. The chat card shows the whole chain: item base, card modifier, each feature bonus, the
   fate card, then armor and Block — including any bonus that was *not* applied because its group
   was already used.

An NPC's intent card flips automatically when the first NPC of its type acts, since from that
moment it is public knowledge anyway.

## Notes for whoever picks this up

**Icons are data, not images.** A condition can switch off any card half showing a given icon
(core-rules §10), so faces render from icon keys and there is no image field on an action card. The
keys are the kebab-case game-icons filenames, which is why the filename doubles as the enum key.

**Nearly every actor stat is derived.** Carried weight, encumbrance, max health, armor, hand size,
deck size and exhaustion are computed in `prepareDerivedData` from the cards and slates. Store any
of them and they go stale the moment a slate moves.

**Encumbrance is the one field with a transition hook.** Crossing into Overloaded sets aside 2 random
cards as Spent, so it mutates card state rather than just redisplaying. Fire on the transition, not
on every recompute.

**An NPC's decks belong to its type, not the actor.** Five goblins reference one action deck, one
fate deck and one intent card. Unlinked tokens of one prototype get their own health while sharing
those ids, which is exactly what the rules want — linked tokens would share health too, which they
must not.

**Tuning values are settings, not constants.** The out-of-combat half of the game has never been
validated and the combat numbers have moved four times, so anything a playtest might change lives in
`game.settings` or compendium data.
