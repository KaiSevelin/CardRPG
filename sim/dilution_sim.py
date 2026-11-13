"""**What a bad card costs each size of deck.**  [BUILT 2026-11-13]

[day_sim.py](day_sim.py) asked whether a small deck or a large one clears more fights over a day,
and answered it: the six-card deck cleared 8.41 of ten against the sixteen's 7.41, holding the same
wounds at the end. From that I wrote that **the intruder brake is not real**, and that was the
wrong sentence for the measurement I had.

**Those are two questions and section 10 only asked one.** "Which deck wins" is not "what does a
Wound cost this deck", and a deck can be more fragile per bad card and still win, if it starts far
enough ahead and the bad cards are rare enough. Both of those were true, which is how the slope
hid inside the total.

So this asks the other one, in the only way that separates it from deck quality: **force k dead
cards into the starting deck and read the slope.** The day's own wound rate is out of it, every arm
meets the same board, and what is left is the thing the arithmetic predicts --

    a Wound is 1/16 of a pristine deck, 1/12 of a pruned one, and 1/6 of one cut to the bone

-- so a small deck should draw it more often per fight and suffer more for holding it. The question
is whether the engine agrees, and by how much.

**It touches `combat_sim` not at all**, and borrows `day_sim`'s one useful primitive: `collection_for`
builds the deck a player would take, pruned once, against the board they expected.
"""
import random
import statistics
import sys
from dataclasses import replace

sys.path.insert(0, __file__.rsplit("dilution_sim.py", 1)[0] or ".")
import combat_sim as cs
import day_sim as ds


def run_fight(cfg, gobs, collection, wounds, rng):
    """One fight from a standing start, with `wounds` dead cards already in the deck.

    The deck is overwritten rather than the config changed, because `deck_cut` prunes against the
    board and would re-prune per arm -- and what is being varied here is the dilution and nothing
    else.
    """
    g = cs.Game(replace(cfg, goblins=gobs, deck_cut=0), rng)
    deck = list(collection) + ["Wound"] * wounds
    rng.shuffle(deck)
    g.w["draw"] = deck
    g.w["hand"] = []
    g.w["discard"] = []
    return g.run() is True


def cell(cfg_kw, gobs, expect, wounds, fights, seeds):
    rates = []
    for seed in seeds:
        rng = random.Random(seed)
        cfg = cs.Config(name="dilute", stamina=14, **cfg_kw)
        collection = ds.collection_for(cfg, (gobs,), rng, expect)
        won = sum(run_fight(cfg, gobs, collection, wounds, rng) for _ in range(fights))
        rates.append(100 * won / fights)
    return statistics.fmean(rates), statistics.pstdev(rates)


def main():
    fights = int(sys.argv[1]) if len(sys.argv) > 1 else 1500
    seeds = [1, 2, 3]
    arms = [("16, pristine", dict()), ("12, pruned", dict(deck_cut=4)),
            ("6, to the bone", dict(deck_cut=10))]
    # Three boards of rising weight, because a penalty that cannot change the outcome of a fight
    # nobody loses reads as free: the easy board is the control and the mixed one is the test.
    boards = [("3 spears", ("spear",) * 3), ("4 spears", ("spear",) * 4),
              ("2 spears + 1 bow", ("spear", "spear", "bow"))]
    ks = [0, 1, 2, 3]

    for bname, gobs in boards:
        print(f"\n**{bname}**, {len(seeds)} seeds x {fights} fights, stamina 14\n")
        print("| deck | " + " | ".join(f"{k} Wounds" for k in ks)
              + " | per Wound | per equal share |")
        print("|" + "---|" * (len(ks) + 3))
        for label, kw in arms:
            size = 16 - kw.get("deck_cut", 0)
            cells = [cell(kw, gobs, ds.EXPECT_MELEE, k, fights, seeds) for k in ks]
            xs, ys = ks, [c[0] for c in cells]
            mx, my = statistics.fmean(xs), statistics.fmean(ys)
            slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
            row = " | ".join(f"{c:.1f}% ({sd:.1f})" for c, sd in cells)
            # `per equal share`: what one Wound would cost if it diluted the same FRACTION of the
            # deck it dilutes in a sixteen. Equal down the column means the damage is the fraction
            # and nothing else; steeper in a small deck means something beyond dilution.
            print(f"| {label} | {row} | {slope:+.1f} | {slope * size / 16:+.1f} |")


if __name__ == "__main__":
    main()
