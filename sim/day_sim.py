"""**A day, rather than a fight.**  [BUILT 2026-11-12]

Every run in this directory has been a single fight from a standing start, and two of the
project's open questions cannot be asked that way at all.

**Versatility.** core-rules 8 sets a deck's size against its focus, and the player's own words for
it were *a pruned deck is more effective, but less versatile*. A single-fight run cannot price that,
because `deck_cut` prunes against the board it is about to meet: the deck is always built for the
exact fight it fights, so pruning measured +20.0 on the Deadly encounter
([analysis-2026-11-12.md](analysis-2026-11-12.md) 4) and the drawback never appeared. **Pruning is
permanent and the fights are not.** A deck pruned for the first fight of the day still has to answer
the third.

**The intruder brake.** A Wound card survives the fight that caused it, so a deck accumulates dead
cards across a day. A Wound is 8% of a twelve-card deck and 17% of a six-card one, which should make
a small deck's dilution worse the longer the day runs. Nothing has measured it, because a single
fight starts clean.

**What carries, and it is taken from the engine rather than invented here**
(`module/decks/play.mjs`, `afterCombat` and `rest`):

  Health          carries. A fight does not heal you; a rest does.
  Spent cards     carry. They are out until a rest, so the deck thins as the day goes on.
  Wounds, Taint   carry. `afterCombat` sweeps hand and discard back into the deck on purpose,
                  because "they are supposed to still be there next time".
  Potions         carry. A drunk potion is drunk.
  Stamina         does NOT carry. It comes back in full, because it measures one fight.
  Block, Fear     do NOT carry. Fear is deleted outright: "a fright nobody is owed any more".

**So this is not a stamina test.** Stamina resets at every fight boundary, which is the engine's own
rule and the reason a day is a different question: what a day costs you is Health, Spent cards and
the dead cards piling up in your deck.

**It touches `combat_sim` not at all.** Everything needed is reachable from outside `Game`: build
one, overwrite the piles it starts with, run it. That matters because seven analyses in this
directory are reproducible against that file, and a day runner is not worth putting any of them at
risk.
"""
import collections
import random
import statistics
import sys
from dataclasses import replace

sys.path.insert(0, __file__.rsplit("day_sim.py", 1)[0] or ".")
import combat_sim as cs


def collection_for(cfg, encounters, rng, prune_expect=None):
    """**The deck the hero takes into the whole day, pruned once.**

    `deck_cut` is applied against a board, because what is worth dropping depends on the fight you
    expect (`prune_value`). In a day that choice is made **once** and then lived with, which is the
    whole of the versatility question: pruning is a level-up and the fights are not.

    `prune_expect` is what the player prepared for. Left alone it is the day's first encounter,
    which is the kindest reading -- you prune for the fight in front of you.
    """
    expect = prune_expect if prune_expect is not None else encounters[0]
    scout = cs.Game(replace(cfg, goblins=expect), rng)
    return sorted(scout.w["draw"])


def run_day(cfg, encounters, rng, prune_expect=None):
    """One day: several fights, one deck, no rest.

    Returns what the day cost, rather than whether one fight was won: a hero who clears two fights
    and dies in the third is the case a single-fight run reports as two wins and a loss, and a day
    reports as a hero who did not come home.
    """
    collection = collection_for(cfg, encounters, rng, prune_expect)
    hp = cfg.hp
    potions = cfg.potions
    spent = []
    wounds = 0
    won = 0
    died_on = None
    rounds = 0

    for i, gobs in enumerate(encounters, 1):
        # `deck_cut=0`: the pruning already happened, once, for the day.
        g = cs.Game(replace(cfg, goblins=gobs, deck_cut=0), rng)

        # The deck this fight starts with: the day's collection, less what is Spent, plus the dead
        # cards the day has dealt. `afterCombat` shuffles, so this does too.
        deck = list(collection)
        for name in spent:
            if name in deck:
                deck.remove(name)
        deck += ["Wound"] * wounds
        rng.shuffle(deck)

        g.w["draw"] = deck
        g.w["hand"] = []
        g.w["discard"] = []
        g.w["spent"] = list(spent)
        g.w["hp"] = hp
        g.w["potions"] = potions

        result = g.run()
        rounds += g.s["rounds"]

        hp = g.w["hp"]
        potions = g.w["potions"]
        spent = list(g.w["spent"])
        # Every pile, because a Wound is dealt into the discard and may be anywhere by the end.
        wounds = sum(1 for pile in ("draw", "hand", "discard")
                     for name in g.w[pile] if name == "Wound")

        if result is True:
            won += 1
        else:
            # A loss or a timeout ends the day: there is no next fight for a hero on the floor.
            died_on = i
            break

    return dict(cleared=died_on is None, won=won, died_on=died_on, hp=max(0, hp),
                wounds=wounds, spent=len(spent), rounds=rounds, fights=len(encounters))


def run_days(cfg, encounters, days, seed, prune_expect=None):
    """`days` of the same shape, aggregated. The shape of `run_scenario`, one level up."""
    rng = random.Random(seed)
    agg = collections.defaultdict(list)
    cleared = 0
    for _ in range(days):
        d = run_day(cfg, encounters, rng, prune_expect)
        cleared += d["cleared"]
        for k in ("won", "hp", "wounds", "spent", "rounds"):
            agg[k].append(d[k])
        agg["died_on"].append(d["died_on"] or 0)
    return dict(cfg=cfg, days=days, cleared=cleared, agg=agg)


# -------------------------------------------------------------------------- the arms

"""
**Two days of comparable weight and different kind**, so what is being measured is the *shape* of
a fight rather than its difficulty. Single-fight rates at stamina 14, 600 fights, seed 1:

  3 spears 98.7% | 4 spears 86.8% | 2 bows 89.7% | 2 spears + 1 bow 77.7% | 1 spear + 1 bow 93.7%

An earlier draft put the Deadly encounter (2 spears + 2 bows, 27.8%) in the day, and every arm
cleared about 10% of the time: a day containing one fight nobody wins measures that fight and
nothing else. These two are winnable, so the arms have somewhere to move.
"""
MELEE_DAY = (("spear",) * 3, ("spear",) * 4, ("spear",) * 3)
MIXED_DAY = (("bow", "bow"), ("spear", "spear", "bow"), ("spear", "bow"))

# What a deck was pruned FOR, which is the whole experiment: the day is held fixed and only the
# expectation moves, so the day's own difficulty cancels out of the comparison.
EXPECT_MELEE = ("spear",) * 4
EXPECT_MIXED = ("spear", "spear", "bow")


def deck_of(extra):
    """The warrior deck with `extra` more copies of its commonest card, for the wide arm."""
    d = dict(cs.WARRIOR_CARDS)
    p, s, r, n = d["Strike"]
    d["Strike"] = (p, s, r, n + extra)
    return d


def cell(cfg_kw, day, expect, days, seeds):
    """One arm on one day, over the seeds. Returns cleared%, its spread, and the four means."""
    cleared, won, hp, wounds, spent = [], [], [], [], []
    for seed in seeds:
        r = run_days(cs.Config(name="day", stamina=14, **cfg_kw), day, days, seed,
                     prune_expect=expect)
        cleared.append(100 * r["cleared"] / r["days"])
        won.append(cs.mean(r["agg"]["won"]))
        hp.append(cs.mean(r["agg"]["hp"]))
        wounds.append(cs.mean(r["agg"]["wounds"]))
        spent.append(cs.mean(r["agg"]["spent"]))
    return (statistics.fmean(cleared), statistics.pstdev(cleared),
            *[statistics.fmean(x) for x in (won, hp, wounds, spent)])


def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 800
    seeds = [1, 2, 3]

    # --- part one: what a prune costs when the day is not the day you pruned for -------------
    arms = [
        ("16, pristine", dict(), None),
        ("20, wide", dict(deck=deck_of(4)), None),
        ("12, pruned for MELEE", dict(deck_cut=4), EXPECT_MELEE),
        ("12, pruned for MIXED", dict(deck_cut=4), EXPECT_MIXED),
        ("12, pruned blind", dict(deck_cut=4, deck_cut_random=True), EXPECT_MELEE),
        ("6, to the bone, for MELEE", dict(deck_cut=10), EXPECT_MELEE),
    ]

    print(f"a day of three fights, no rest. {len(seeds)} seeds x {days} days, stamina 14\n")
    print("| arm | day | cleared all 3 | fights won | HP left | Wounds | Spent |")
    print("|" + "---|" * 7)
    out = {}
    for label, kw, expect in arms:
        for day_name, day in (("melee", MELEE_DAY), ("mixed", MIXED_DAY)):
            c, sd, won, hp, wounds, spent = cell(kw, day, expect, days, seeds)
            out[(label, day_name)] = c
            print(f"| {label} | {day_name} | {c:.1f}% ({sd:.1f}) | {won:.2f} / 3 | {hp:.1f} "
                  f"| {wounds:.2f} | {spent:.1f} |")

    print("\n**the price of pruning for the wrong day.** The day is fixed; only what the deck was "
          "pruned FOR changes, so the day's own difficulty is out of it.\n")
    print("| day | pruned right | pruned wrong | the price of being wrong |")
    print("|" + "---|" * 4)
    for day_name, right, wrong in (("melee", "12, pruned for MELEE", "12, pruned for MIXED"),
                                   ("mixed", "12, pruned for MIXED", "12, pruned for MELEE")):
        r, w = out[(right, day_name)], out[(wrong, day_name)]
        print(f"| {day_name} | {r:.1f}% | {w:.1f}% | {w - r:+.1f} |")

    print("\n**and whether pruning is worth it over a day at all**, against the pristine sixteen\n")
    print("| arm | melee day | mixed day |")
    print("|" + "---|" * 3)
    for label, _, _ in arms[1:]:
        print(f"| {label} | {out[(label, 'melee')] - out[('16, pristine', 'melee')]:+.1f} "
              f"| {out[(label, 'mixed')] - out[('16, pristine', 'mixed')]:+.1f} |")

    # --- part two: the intruder brake, which needs a day long enough to accumulate ------------
    """
    **A Wound is 8% of a twelve-card deck and 17% of a six-card one**, and it survives the fight
    that dealt it. Three fights deal about a quarter of a Wound, so the brake cannot show up in
    part one at all: this runs the easy encounter until the hero falls, which is the only way the
    dead cards get a chance to pile up.
    """
    print(f"\n**how long a day can be**, 3 spears over and over until the hero falls. "
          f"{len(seeds)} seeds x {days} days\n")
    long_day = (("spear",) * 3,) * 10
    print("| deck | fights cleared of 10 | cleared all 10 | HP left | Wounds held at the end |")
    print("|" + "---|" * 5)
    for label, kw in (("16, pristine", dict()), ("12, pruned", dict(deck_cut=4)),
                      ("6, to the bone", dict(deck_cut=10)),
                      # 'P' and 'S', uppercase: `options` labels the halves that way and a
                      # lowercase key matched nothing, so the arm read identical to the one above
                      # it in all four columns. Identical numbers are the tell.
                      ("12, pruned, Shield Up printed Spent",
                       dict(deck_cut=4, spent_cards={"Shield Up": "PS"}))):
        c, sd, won, hp, wounds, spent = cell(kw, long_day, EXPECT_MELEE, days, seeds)
        print(f"| {label} | {won:.2f} | {c:.1f}% ({sd:.1f}) | {hp:.1f} | {wounds:.2f} |")
    print("\nThe Spent arm is the third carried resource, and it is inert in every other row: the "
          "starter deck prints no card Spent, so `cfg.spent_cards` has to say which one does.")


if __name__ == "__main__":
    main()
