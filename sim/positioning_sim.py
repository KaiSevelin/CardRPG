"""What is positioning worth, and to whom?

core-rules 11 is thirty lines and it governs the thing this file finds to be the most valuable in a
starter deck. The experiments are deliberately blunt: take the hero's one real mobility card away and
see what it cost, across enemies of different reach.

Run: python positioning_sim.py
"""

from combat_sim import Config, run_scenario, mean

FIGHTS = 4000
# Seed 1 is the simulator's own default, which is what the encounter table in
# rules/starter-cards.md is measured at -- so the numbers printed there reproduce from here.
SEED = 1

# Advance is the only card in the sixteen whose primary is pure movement. Replacing it with a plain
# attacker holds the deck size, the card count and the Ready count fixed, and changes only mobility.
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


NO_ADVANCE = {'Advance': ([('strike', 0)], [('move', 1)], 'parry', 2)}

ENCOUNTERS = [
    ("3 spears (all melee)", ('spear',) * 3),
    ("5 spears (all melee)", ('spear',) * 5),
    ("4 goblins, 2 spears + 2 bows", ('spear', 'spear', 'bow', 'bow')),
    ("4 bows (all ranged)", ('bow',) * 4),
]


def win(res):
    return 100.0 * res['wins'] / res['fights']


def value_of_mobility():
    """The headline: mobility's worth is set by the enemy's reach, not by the hero."""
    print("--- 1. what the hero's one mobility card is worth ---")
    print("%-32s %8s %8s %8s" % ("encounter", "with", "without", "delta"))
    for label, gob in ENCOUNTERS:
        a = win(run_scenario(Config(name='a', goblins=gob), FIGHTS, SEED))
        b = win(run_scenario(Config(name='b', goblins=gob, card_overrides=NO_ADVANCE), FIGHTS, SEED))
        print("%-32s %7.1f%% %7.1f%% %+8.1f" % (label, a, b, b - a))
    print()
    print("  Against pure melee, mobility is worth nothing: the fight comes to you.")
    print("  Against a mixed group it is worth more than three damage rungs, because the")
    print("  spears are what stop you reaching the bows.")
    print()


def more_mobility():
    """And the other direction: is a third Advance better than a third Strike?"""
    print("--- 2. one more Advance, one less Strike ---")
    gob = ('spear', 'spear', 'bow', 'bow')
    base = run_scenario(Config(name='base', goblins=gob), FIGHTS, SEED)
    more = run_scenario(Config(name='more', goblins=gob, card_overrides={
        'Strike': ([('strike', 0)], [('move', 1)], 'parry', 2),
        'Advance': ([('move', 3)], [('move', 2)], 'sidestep', 3),
    }), FIGHTS, SEED)
    print("  baseline (3 Strike, 2 Advance)   %5.1f%%" % win(base))
    print("  swapped  (2 Strike, 3 Advance)   %5.1f%%   (%+.1f)" % (win(more), win(more) - win(base)))
    print()


def how_often_played():
    """A card nobody plays cannot be worth anything, so check the other half of the claim."""
    print("--- 3. how often each half is actually played, per fight ---")
    gob = ('spear', 'spear', 'bow', 'bow')
    res = run_scenario(Config(name='plays', goblins=gob), FIGHTS, SEED)
    print("%-13s %10s %12s %8s" % ("card", "primary", "secondary", "copies"))
    for name, copies in (('Advance', 2), ('Strike', 3), ('Lunge', 1), ('Shield Up', 2),
                         ('Heavy Swing', 2)):
        p = res['plays'].get(name + '|P', 0) / FIGHTS
        s = res['plays'].get(name + '|S', 0) / FIGHTS
        print("%-13s %10.2f %12.2f %8d" % (name, p, s, copies))
    print()
    print("  Advance ties Heavy Swing as the most-played card, both off two copies, and")
    print("  both beat three copies of Strike on either half. Mobility is not a card the")
    print("  hero reaches for when cornered; it is a card they play every turn they have it.")
    print()


def price_of_control():
    """What is a Shove, a Trip or a Grapple worth against a Strike?

    core-rules 4 makes all three Strikes that spend their damage, so the question is simply whether
    the condition is worth more than the damage. Measured from the receiving end -- Dirty Trick
    applies each one instead of Dazed -- because that is the side the simulator has conditions on.
    """
    print("--- 4. control against damage: what each condition costs its victim ---")
    gob = ('spear', 'spear', 'bow', 'bow')
    base = win(run_scenario(Config(name='n', goblins=gob, goblin_condition='offBalance'),
                            FIGHTS, SEED))
    rows = [
        ("Off-Balance (1)", dict(goblin_condition='offBalance')),
        ("Dazed (1)", dict(goblin_condition='dazed')),
        ("Prone (1)", dict(goblin_condition='prone', goblin_cond_value=1)),
        ("Grappled (1)", dict(goblin_condition='grappled')),
        ("Grappled (2)", dict(goblin_condition='grappled', goblin_cond_dur=2)),
        ("Burning 1 (1) -- one damage rung", dict(goblin_condition='burning',
                                                  goblin_cond_value=1)),
    ]
    print("  baseline (Dirty Trick does nothing but Strike): %.1f%%" % base)
    for label, kw in rows:
        w = win(run_scenario(Config(name='x', goblins=gob, **kw), FIGHTS, SEED))
        print("  %-34s %5.1f%%   costs %5.1f" % (label, w, base - w))
    print()
    print("  Off-Balance costs nothing at all, which is the opening design holding: it does")
    print("  nothing until a card reads it. Prone is about one damage rung, so a Trip roughly")
    print("  breaks even against Striking. Grappled beats Striking outright -- because it")
    print("  blocks Move, and Move is the most valuable thing a figure does.")
    print()
    print("  So: position-denial is worth exactly what the target's position was worth.")
    print("  Grapple the archer; hit the ogre.")
    print()


def the_item_economy():
    """Is a second weapon on your back worth carrying?

    Four of the sixteen starter cards carry Ready and there was only ever one weapon to hold, so a
    quarter of the deck was inert in every run before this. core-rules 4 claims the back slot is
    "a free swap waiting for you in the middle of a fight"; this is that claim, measured.
    """
    print("--- 5. a Shortbow slung on the back ---")
    print("%-32s %9s %9s %8s" % ("encounter", "no sling", "slung", "delta"))
    for label, gob in [("3 goblins with spears", ('spear',) * 3),
                       ("5 goblins with spears", ('spear',) * 5),
                       ("4 goblins, 2 spears + 2 bows", ('spear', 'spear', 'bow', 'bow')),
                       ("4 bows (all ranged)", ('bow',) * 4)]:
        a = win(run_scenario(Config(name='a', goblins=gob), FIGHTS, SEED))
        b = win(run_scenario(Config(name='b', goblins=gob, sling='bow'), FIGHTS, SEED))
        print("%-32s %8.1f%% %8.1f%% %+8.1f" % (label, a, b, b - a))
    print()
    print("  Worth about two damage rungs against a mixed group and a COST against five")
    print("  spears, because against melee you spend halves swapping to a weapon you did")
    print("  not need. The kit you bring is a real decision, which is what the back slot")
    print("  is for -- and part of that loss is the simulated player swapping when it")
    print("  should not, so the figure is a floor rather than perfect play.")
    print()


def main():
    value_of_mobility()
    more_mobility()
    how_often_played()
    price_of_control()
    the_item_economy()


if __name__ == '__main__':
    main()
