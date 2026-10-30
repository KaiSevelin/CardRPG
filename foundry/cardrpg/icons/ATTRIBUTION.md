# Icon attribution

The 79 icons in `icons/` come from [game-icons.net](https://game-icons.net) and are used under the
**Creative Commons Attribution 3.0** licence (CC BY 3.0). The licence requires a credit, which is
what this file is — it ships with the system.

> Icons made by [DarkZaitzev](https://darkzaitzev.deviantart.com), [Delapouite](https://delapouite.com), [Faithtoken](https://fungustoken.deviantart.com), [Lorc](https://lorcblog.blogspot.com), Lucas, [Lucasms](https://opengameart.org/users/lucasms), [Sbed](https://opengameart.org/content/95-game-icons), Skoll, from [game-icons.net](https://game-icons.net),
> licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

## Modifications

Every file differs from its upstream original in two ways:

- the full-canvas background `<path>` is removed, and
- the `fill="#fff"` on the shape is dropped.

Upstream these are a black square with a white shape on top. Masking that whole file to
`currentColor` would give a solid block, so the background has to go and the shape has to inherit
its colour — which is what lets one CSS rule grey out a blocked icon. CC BY 3.0 permits
modification; this records what was changed.

## Which icon came from whom

### Card anatomy

| Key | Author |
|---|---|
| `rank-3` | Skoll |
| `rank-2` | Skoll |
| `electric` | Sbed |

### Verbs

| Key | Author |
|---|---|
| `sword-wound` | Lorc |
| `magic-swirl` | Lorc |
| `shield-reflect` | Lorc |
| `potion-ball` | Lorc |
| `boot-prints` | Lorc |
| `school-bag` | Delapouite |

### Costs

| Key | Author |
|---|---|
| `card-burn` | Delapouite |
| `card-discard` | Faithtoken |

### Slate markers

| Key | Author |
|---|---|
| `charging` | Delapouite |

### Effects and targeting

| Key | Author |
|---|---|
| `healing` | Delapouite |
| `breaking-chain` | Skoll |
| `melting-metal` | Delapouite |
| `bullseye` | Skoll |
| `mushroom-cloud` | Lorc |
| `laser-sparks` | Lorc |
| `thumb-up` | Delapouite |
| `thumb-down` | Delapouite |

### Approaches

| Key | Author |
|---|---|
| `mighty-force` | Delapouite |
| `run` | Lorc |
| `spy` | Delapouite |
| `all-seeing-eye` | Delapouite |
| `book-cover` | Delapouite |
| `embrassed-energy` | Lorc |
| `misdirection` | Delapouite |

### Conditions

| Key | Author |
|---|---|
| `surprised` | Lorc |
| `tortoise` | Delapouite |
| `brain-freeze` | Lorc |
| `invisible` | Delapouite |
| `fire-silhouette` | Lorc |
| `frozen-body` | Delapouite |
| `falling` | Sbed |
| `knockout` | Skoll |
| `luchador` | Delapouite |
| `silenced` | Delapouite |
| `drop-weapon` | Skoll |
| `puppet` | Lorc |
| `aura` | Lorc |
| `imprisoned` | Lorc |
| `weight-crush` | Sbed |
| `weight` | Delapouite |
| `droplets` | Lorc |
| `foot-trip` | Lorc |
| `crosshair` | Delapouite |
| `scales` | Lorc |

### Fate deck

| Key | Author |
|---|---|
| `blindfold` | Delapouite |
| `punch-blast` | Lorc |

### Lingering damage

| Key | Author |
|---|---|
| `knee-bandage` | Delapouite |
| `vomiting` | Lorc |
| `virus` | Lorc |
| `squid-head` | Lorc |
| `severed-hand` | DarkZaitzev |

### Pile links

| Key | Author |
|---|---|
| `card-random` | Faithtoken |

`card-burn` and `card-discard` are listed under Costs; the panel links reuse them, because the
Discard link and a Strain cost mean the same pile.

### HUD and sheet chrome

| Key | Author |
|---|---|
| `hand` | Lorc |
| `scabbard` | Delapouite |
| `belt` | Lucas |
| `person` | Delapouite |
| `cloak` | Lucasms |
| `light-helm` | Delapouite |
| `gem-pendant` | Lorc |
| `diamond-ring` | Delapouite |
| `fur-boot` | Delapouite |
| `knapsack` | Lorc |
| `oppression` | Lorc |
| `night-sleep` | Delapouite |
| `target-prize` | Delapouite |
| `hourglass` | Lorc |
| `lock-spy` | Delapouite |

### Item tags (optional)

| Key | Author |
|---|---|
| `anvil` | Lorc |
| `feather` | Lorc |
| `crossed-swords` | Lorc |
| `bowman` | Lorc |
| `thrown-spear` | Lorc |
| `spell-book` | Delapouite |
| `griffin-shield` | Delapouite |
| `lamellar` | Lorc |
| `bottled-bolt` | Lorc |

## Count per author

| Author | Icons |
|---|---|
| DarkZaitzev | 1 |
| Delapouite | 23 |
| Faithtoken | 1 |
| Lorc | 28 |
| Lucas | 1 |
| Sbed | 3 |
| Skoll | 5 |

Two upstream contributors release under CC0 rather than CC BY; neither appears in this set,
so every icon here needs the attribution above.
