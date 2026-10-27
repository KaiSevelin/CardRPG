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

| Not built yet | |
|---|---|
| Sheets | character, npc, slate, card |
| The tray | hand, resolution flow, reaction prompts |
| Combat | individual initiative, intent cards, condition ticking |
| Compendium packs | starter Warrior deck, goblin deck, items, features |
| Icon assets | 61 SVGs from game-icons.net, two still unchosen |

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
