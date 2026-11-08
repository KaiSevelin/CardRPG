"""What a dead card costs in a skill hand -- exactly, by enumeration rather than by sampling.

The action deck has a simulator because a fight is a sequence of decisions. A check is not: it is
one card out of a hand of four against a difficulty (skill-rules 2), so the honest instrument is
arithmetic over every hand that hand could be. This enumerates them.

  total = card value + tool + feature, then + 2x the fate card  (skill-rules 2, step 3-4)

Two things it answers, and they are different questions:

  * **the reach** -- the expected value of the best card you hold for the approach that was called,
    which is what a point of difficulty is measured against;
  * **the shutout** -- how often you hold no card of that approach at all and have to improvise,
    which skill-rules 1 prices at value 0 *with disadvantage*. A shutout is not a smaller number,
    it is a different kind of turn, so it is counted rather than averaged in.

The deck crosses from `test/careers-export.mjs` so this cannot go stale when the fifteen cards
change. Run it from anywhere:

  python sim/skill_hand.py
"""
import itertools
import json
import os
import sys
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
HAND = 4
APPROACHES = ("might", "agility", "shadow", "wits", "lore", "presence")

# skill-rules 2: a fate card is added at DOUBLE its value, and the project's own unit for a point
# of modifier is +13.3 points of success chance (skill-rules 2, the measured figure). One point of
# card value is one point of total, so a lost point of reach converts straight through.
POINT = 13.3


def load_deck():
    path = os.path.join(HERE, "careers.json")
    if not os.path.exists(path):
        sys.exit("sim/careers.json is missing -- run: node test/careers-export.mjs")
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    skills = data.get("skills")
    if not skills:
        sys.exit("careers.json carries no skill deck -- re-run test/careers-export.mjs")
    return skills


def best_for(hand, approach):
    """The value of the best card in this hand for that approach, or None if there is none.

    Inspiration is `any` and worth 1 (skill-rules 1), so it answers every call and is usually the
    floor rather than the ceiling.
    """
    vals = [c["value"] for c in hand if c["approach"] in (approach, "any")]
    return max(vals) if vals else None


def measure(deck, dead):
    """Enumerate every hand of HAND cards drawn from `deck` plus `dead` dead ones.

    A dead card occupies a slot and can never be played, so a hand with one of them is a hand of
    HAND - dead live cards. The dead card is not drawn from the deck -- it is *in* the deck, so the
    live cards come from the same fifteen either way. Enumerating the live subset and weighting it
    by how often a dead card comes with it is the same arithmetic as drawing the hand, and it keeps
    the comparison to "the same deck, one slot gone".
    """
    live = HAND - dead
    hands = list(itertools.combinations(range(len(deck)), live))
    total = len(hands)
    out = {}
    for approach in APPROACHES:
        reach = Fraction(0)
        shutouts = 0
        for idx in hands:
            hand = [deck[i] for i in idx]
            b = best_for(hand, approach)
            if b is None:
                shutouts += 1
            else:
                reach += Fraction(b)
        out[approach] = (reach / total, Fraction(shutouts, total))
    return out


def main():
    deck = load_deck()
    print(f"skill deck: {len(deck)} cards, hand {HAND}\n")

    full = measure(deck, 0)
    one = measure(deck, 1)
    two = measure(deck, 2)

    print("| approach | reach | with 1 Doubt | with 2 | shutout | with 1 Doubt | with 2 |")
    print("|---|---|---|---|---|---|---|")
    for a in APPROACHES:
        r0, s0 = full[a]
        r1, s1 = one[a]
        r2, s2 = two[a]
        print(f"| {a} | {float(r0):.2f} | {float(r1):.2f} | {float(r2):.2f} "
              f"| {float(s0) * 100:.1f}% | {float(s1) * 100:.1f}% | {float(s2) * 100:.1f}% |")

    def mean(m, i):
        return sum(float(m[a][i]) for a in APPROACHES) / len(APPROACHES)

    r0, r1, r2 = mean(full, 0), mean(one, 0), mean(two, 0)
    s0, s1, s2 = mean(full, 1), mean(one, 1), mean(two, 1)
    print(f"\nmean reach    {r0:.3f} -> {r1:.3f} -> {r2:.3f}"
          f"   ({r1 - r0:+.3f}, {r2 - r0:+.3f} points of total)")
    print(f"mean shutout  {s0 * 100:.1f}% -> {s1 * 100:.1f}% -> {s2 * 100:.1f}%"
          f"   ({(s1 - s0) * 100:+.1f}, {(s2 - s0) * 100:+.1f} points)")
    print(f"\nin the project's unit, one point of modifier being {POINT} points of success chance:")
    print(f"  1 Doubt costs {abs(r1 - r0) * POINT:.1f} points of success chance on reach alone,")
    print(f"  and turns {(s1 - s0) * 100:.1f} points more of every approach's calls into an")
    print(f"  improvise -- value 0 with disadvantage, which is a worse turn than a low card.")


if __name__ == "__main__":
    main()
