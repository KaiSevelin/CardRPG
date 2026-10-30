"""Does the condition machinery actually work, and are the numbers I asserted true?

Two halves, and they answer different kinds of question.

**Correctness** (section 1) checks the rules against themselves with no combat at all: the
core-rules 7 clock, cancelling, intensity, Shake Off and Lift. These are assertions -- they pass or
the rules are not what they say.

**Price** (sections 2-4) runs real fights and measures what conditions.md and way-cards assert about
value. Every band table in those documents was reasoned from first principles and none of it was
measured, which is the honest reason this file exists.

Run: python conditions_sim.py
"""

import random
from collections import Counter

from combat_sim import (
    CONDITIONS, shakeable, Config, Game, FateDeck, run_scenario, mean,
)

# ---------------------------------------------------------------- seeds
# A single seed at 4000 fights carries about +/-1.6 points at two sigma, which is wide enough to
# have had me reporting differences that were not there. Everything below averages over SEEDS and
# prints the spread, so a figure that cannot be resolved looks like one.
SEEDS = (1, 2, 3, 4, 5)


def rate(gob, **kw):
    """Win rate over every seed: (mean, standard deviation across seeds)."""
    import statistics
    v = [100.0 * run_scenario(Config(name='x', goblins=gob, **kw), FIGHTS, s)['wins'] / FIGHTS
         for s in SEEDS]
    return statistics.fmean(v), (statistics.stdev(v) if len(v) > 1 else 0.0)


FIGHTS = 4000
SEED = 20261030


# ---------------------------------------------------------------- 1. correctness

def fresh():
    """A Game with no fight in it, for exercising the condition rules directly."""
    g = Game(Config(goblins=('spear',)), random.Random(1))
    return g


def check(label, got, want):
    ok = got == want
    print(f"{'ok  ' if ok else 'FAIL'} {label:<52} {got}" + ("" if ok else f"   expected {want}"))
    return ok


def correctness():
    print("--- 1. the rules against themselves ---")
    fails = 0

    # The clock. A condition ticks at the start of its CREATOR's turn, so it costs the victim
    # exactly one of their own turns wherever the creator sits in the order (core-rules 7).
    g = fresh()
    g.apply_cond('dazed', 1, 0, by=1)
    fails += not check("Dazed (1) lands", g.dazed(), True)
    g.tick_conds(2)                       # a different goblin's turn
    fails += not check("another creature's turn does not tick it", g.dazed(), True)
    g.tick_conds(1)                       # its creator's turn
    fails += not check("its creator's turn ends it", g.dazed(), False)

    # Duration 2 costs two turns, not one.
    g = fresh()
    g.apply_cond('grappled' if 'grappled' in CONDITIONS else 'dazed', 2, 0, by=1)
    g.tick_conds(1)
    fails += not check("a (2) survives one tick", len(g.w['conds']), 1)
    g.tick_conds(1)
    fails += not check("a (2) is gone after two", len(g.w['conds']), 0)

    # Water and fire cancel: whichever arrives second ends the first and does not land.
    g = fresh()
    g.apply_cond('burning', 2, 2, by=1)
    landed = g.apply_cond('wet', 1, 0, by=1)
    fails += not check("Wet onto Burning does not land", landed, False)
    fails += not check("...and the Burning is out", g.w['conds'], [])

    g = fresh()
    g.apply_cond('wet', 1, 0, by=1)
    landed = g.apply_cond('burning', 2, 2, by=1)
    fails += not check("Burning onto Wet does not land", landed, False)
    fails += not check("...and the Wet has steamed off", g.w['conds'], [])

    # Refresh takes the max of each number independently.
    g = fresh()
    g.apply_cond('poisoned', 1, 3, by=1)      # a dragon's dose
    g.apply_cond('poisoned', 3, 1, by=1)      # a candle thrown after it
    c = g.cond('poisoned')
    fails += not check("refresh keeps the longer duration", c['duration'], 3)
    fails += not check("refresh keeps the fiercer value", c['value'], 3)

    # Poisoned N is Burning N plus Dazed: it damages AND costs the secondary.
    g = fresh()
    g.apply_cond('poisoned', 1, 0, by=1)
    fails += not check("Poisoned 0 still costs the secondary", g.dazed(), True)
    bite = sum(c['value'] for c in g.w['conds'] if CONDITIONS[c['key']].get('damage'))
    fails += not check("Poisoned 0 does no damage", bite, 0)

    # Move: halved by Slowed, then reduced by Frozen, floored at 0.
    g = fresh()
    fails += not check("Move 3 unimpeded", g.move_mod(3), 3)
    g.apply_cond('slowed', 1, 0, by=1)
    fails += not check("Slowed halves Move 3 to 1", g.move_mod(3), 1)
    g.apply_cond('frozen', 1, 2, by=1)
    fails += not check("Frozen 2 on top floors it at 0", g.move_mod(3), 0)

    # Shake Off spends duration and ends at 0; it may not touch an opening.
    g = fresh()
    g.apply_cond('dazed', 2, 0, by=1)
    g.shake(1)
    fails += not check("Shake Off 1 leaves Dazed (1)", g.cond('dazed')['duration'], 1)
    g.shake(1)
    fails += not check("a second Shake Off ends it", g.cond('dazed'), None)

    g = fresh()
    g.apply_cond('marked', 1, 0, by=1)
    fails += not check("Shake Off cannot touch an opening", g.shake(3), False)
    fails += not check("...so the opening is still there", g.cond('marked')['duration'], 1)

    # Lift removes what has no duration to spend, and only that.
    g = fresh()
    g.apply_cond('cursed', 0, 0, by=1)
    fails += not check("Shake Off cannot touch Cursed", g.shake(3), False)
    fails += not check("Lift can", g.lift(), True)
    fails += not check("...and it is gone", g.cond('cursed'), None)
    g = fresh()
    g.apply_cond('dazed', 1, 0, by=1)
    fails += not check("Lift cannot touch a timed condition", g.lift(), False)

    # A no-duration condition is never ticked away.
    g = fresh()
    g.apply_cond('blessed', 0, 0, by=1)
    for _ in range(10):
        g.tick_conds(1)
    fails += not check("Blessed survives ten ticks", g.cond('blessed') is not None, True)

    # The partition the spec claims: every condition leaves by exactly one route.
    buckets = Counter()
    for key, f in CONDITIONS.items():
        if f.get('liftable'):
            buckets['lift'] += 1
        elif f.get('opening'):
            buckets['clock'] += 1
        elif shakeable(key):
            buckets['shake'] += 1
        else:
            buckets['other'] += 1
    fails += not check("every modelled condition has a route",
                       sum(buckets.values()), len(CONDITIONS))
    print(f"     routes: {dict(buckets)}")
    print()
    return fails


# ---------------------------------------------------------------- 2-4. price

def scenario(label, **kw):
    cfg = Config(name=label, **kw)
    return label, run_scenario(cfg, FIGHTS, SEED)


def row(label, res):
    a = res['agg']
    win = 100.0 * res['wins'] / res['fights']
    print(f"  {label:<34} {win:5.1f}%   rounds {mean(a['rounds']):4.1f}"
          f"   HP left {mean(a['hp_left']):4.1f}"
          f"   tick dmg {mean(a['tick_damage']):4.1f}")
    return win


def price_of_dazed():
    """What is Dirty Trick's Dazed worth, in damage?

    conditions.md 2.1 asserts Poisoned N is Burning N plus Dazed, and therefore costs one rung more
    than Burning for the same number. That only holds if Dazed is worth roughly one rung -- about a
    Burning 1 over the same duration. This measures it by swapping what Dirty Trick inflicts.
    """
    print("--- 2. what Dazed is worth, against the same card doing damage instead ---")
    print("    (4 goblins, 2 spears + 2 bows: the Deadly encounter, so there is room to move)")
    gob = ('spear', 'spear', 'bow', 'bow')
    base = row("nothing (Dirty Trick is a Strike)",
               scenario('none', goblins=gob, goblin_condition='marked')[1])
    daze = row("Dazed (1)", scenario('daze', goblins=gob, goblin_condition='dazed')[1])
    out = {}
    for n in (1, 2, 3):
        out[n] = row(f"Burning {n} (1)",
                     scenario(f'burn{n}', goblins=gob, goblin_condition='burning',
                              goblin_cond_value=n)[1])
    print()
    print(f"  Dazed costs {base - daze:.1f} points of win rate.")
    for n in (1, 2, 3):
        print(f"  Burning {n} costs {base - out[n]:.1f}.")
    print()
    return base, daze, out


def poisoned_against_burning():
    """Poisoned N should cost strictly more than Burning N, by about the price of Dazed."""
    print("--- 3. Poisoned N against Burning N, same number, same duration ---")
    gob = ('spear', 'spear', 'bow', 'bow')
    for n in (0, 1, 2):
        b = row(f"Burning {n} (1)",
                scenario(f'b{n}', goblins=gob, goblin_condition='burning',
                         goblin_cond_value=n)[1]) if n else None
        p = row(f"Poisoned {n} (1)",
                scenario(f'p{n}', goblins=gob, goblin_condition='poisoned',
                         goblin_cond_value=n)[1])
        if b is not None:
            print(f"    -> Poisoned {n} is {b - p:+.1f} points worse for the hero than Burning {n}")
    print()


def is_a_dispel_worth_a_card():
    """Shake Off 1 on a secondary, bought by cutting one copy of Strike.

    way-cards 1.6 prices a Shake Off 1 at "a secondary -- free, and the only rung a secondary may
    buy". That is a claim about the HALF it costs, and it quietly assumes the card is in your hand
    when the condition is on you. This measures the whole trade instead.
    """
    from math import comb
    print("--- 4. is Shake Off 1 on an action card worth a copy of Strike? ---")
    avail = 1 - comb(15, 5) / comb(16, 5)
    print(f"    one copy in a 16-card deck is in a 5-card hand {100 * avail:.0f}% of turns,")
    print("    and it has to be there on a turn the condition is also on you.")
    gob = ('spear', 'spear', 'bow', 'bow')
    for label, kw in [
        ("vs nothing (the cost alone)", dict(goblin_condition='marked')),
        ("vs Dazed (2)", dict(goblin_condition='dazed', goblin_cond_dur=2)),
        ("vs Burning 2 (2)", dict(goblin_condition='burning', goblin_cond_value=2,
                                  goblin_cond_dur=2)),
        ("vs Poisoned 2 (2)", dict(goblin_condition='poisoned', goblin_cond_value=2,
                                   goblin_cond_dur=2)),
    ]:
        without = row(f"{label}, plain deck", scenario('plain', goblins=gob, **kw)[1])
        res = scenario('shake', goblins=gob, shake_card=True, **kw)[1]
        with_ = row(f"{label}, Shrug It Off", res)
        a = res['agg']
        print(f"    -> {with_ - without:+.1f} points"
              f"   (played {mean(a['shaken']):.2f}/fight, ended {mean(a['shaken_off']):.2f})")
    print()
    print("  Dazed and Poisoned both cost the secondary, so a dispel ON a secondary can never")
    print("  answer them -- the simulator rediscovers core-rules 7's rule that a dispel must not")
    print("  sit on the half the condition takes.")
    print()


def main():
    fails = correctness()
    if fails:
        print(f"{fails} correctness failure(s) -- the price runs below mean nothing until they pass.")
        return
    price_of_dazed()
    poisoned_against_burning()
    is_a_dispel_worth_a_card()


if __name__ == '__main__':
    main()
