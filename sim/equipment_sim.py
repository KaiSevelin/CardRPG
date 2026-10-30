"""What the equipment page costs and buys.

rules/equipment.md carried an [OPEN] saying nothing on it was simulated, and named the two numbers
most worth having: the **armour ladder**, because armour is claimed to be a cliff edge and Plate at 4
against Leather at 1 had never been run, and **reload**, because every firearm and crossbow turns on
a Ready whose value had been measured once, for a slung bow.

Finding the ladder's price meant implementing a rule first. Heavy Armor's drawback is the loss of
Sidestep reactions (core-rules 10), and Sidestep was a word printed on the Advance card with no
behaviour anywhere in the simulator -- so the top two rungs could not be charged for, and every
number published before today was measured with one of the starter deck's four reactions inert.

Run: python equipment_sim.py
"""

import statistics

from combat_sim import (ARMOUR, CARRY_LIMIT, FATE_DIST, FOES, WEAPONS, Config, fate_apply, mean,
                        run_scenario)

# A single seed at 4000 fights carries about +/-1.6 points at two sigma, which is wide enough to
# have had this project reporting differences that were not there -- and once explaining one. Every
# figure below is a five-seed mean and prints its spread, so a difference that cannot be resolved
# looks like one.
SEEDS = (1, 2, 3, 4, 5)

# 4000 is what rules/starter-cards.md publishes, so the table it prints is corrected at 4000 x 5
# seeds = 20,000 fights a row. The exploratory grids are 1200 x 5 = 6000 a cell, which still beats
# every single-seed figure this project ever published and keeps the five-seed spread honest; a
# difference that needs more than that to see is a difference the spread will refuse to resolve.
FIGHTS = 1200
TABLE_FIGHTS = 4000

ENCOUNTERS = {
    '3 spears':   ('spear',) * 3,
    '4 spears':   ('spear',) * 4,
    '5 spears':   ('spear',) * 5,
    '2 sp + 2 bw': ('spear', 'spear', 'bow', 'bow'),
}


def rate(goblins, fights=None, **kw):
    """Win rate over every seed: (mean, standard deviation across seeds)."""
    n = fights or FIGHTS
    v = [100.0 * run_scenario(Config(name='x', goblins=goblins, **kw), n, s)['wins'] / n
         for s in SEEDS]
    return statistics.fmean(v), (statistics.stdev(v) if len(v) > 1 else 0.0)


def stat(key, goblins, **kw):
    """A per-fight statistic, averaged over every seed."""
    return statistics.fmean(
        mean(run_scenario(Config(name='x', goblins=goblins, **kw), FIGHTS, s)['agg'][key])
        for s in SEEDS)


def show(label, pair, width=13):
    m, sd = pair
    print(f"  {label:{width}} {m:5.1f}%  +/-{sd:4.1f}")


# --------------------------------------------------------------------------- 1
def sidestep_was_inert():
    """Two of the sixteen starter cards carry a reaction that did nothing until today.

    core-rules 11: "Leaving is free. Arriving is answered" -- an enemy that ENDS its movement next
    to you hands you a Sidestep. It neither redirects nor reduces (core-rules 3): you leave the
    square the Strike was aimed at, so it denies the hit outright instead of shaving it.
    """
    print("\n1. SIDESTEP: what the starter deck had never played")
    print("   published = sidestep inert, which is how rules/starter-cards.md was measured")
    print("   and the sentence has two readings worth 7 points of win rate between them:")
    print("     arrival = it took a step and was not adjacent before (what 'arriving' means)")
    print("     any     = it ended a move adjacent, shuffling included (what the sentence says)")
    print(f"   {'encounter':13} {'inert':>14} {'arrival':>14} {'any':>14}   arrival delta")
    for label, gob in ENCOUNTERS.items():
        off = rate(gob, fights=TABLE_FIGHTS, sidestep=False)
        on = rate(gob, fights=TABLE_FIGHTS)
        loose = rate(gob, fights=TABLE_FIGHTS, sidestep_mode='any')
        d = on[0] - off[0]
        # Two seeds' spreads, added in quadrature: the bar a difference has to clear.
        bar = 2 * (off[1] ** 2 + on[1] ** 2) ** .5
        verdict = f"{d:+5.1f}" + ("" if abs(d) > bar else "  (within noise)")
        print(f"   {label:13} {off[0]:6.1f}% +/-{off[1]:4.1f} {on[0]:6.1f}% +/-{on[1]:4.1f}"
              f" {loose[0]:6.1f}% +/-{loose[1]:4.1f}  {verdict}")
    for mode in ('arrival', 'any'):
        print(f"   sidesteps per fight, 5 spears, {mode}: "
              f"{stat('react_sidestep', ENCOUNTERS['5 spears'], sidestep_mode=mode):.2f}")


# --------------------------------------------------------------------------- 2
def the_armour_ladder():
    """Armor 0 to 4, which is the whole of equipment.md 1.2, against the published encounters.

    The ladder is priced in kilograms, and at rungs 3 and 4 in the Sidestep reaction as well, so
    this is the benefit with both prices already deducted.
    """
    print("\n2. THE ARMOUR LADDER, 1 TO 4")
    print(f"   {'':13}" + ''.join(f"{'armor ' + str(a):>12}" for a in range(5)))
    for label, gob in ENCOUNTERS.items():
        row = [rate(gob, armor=a) for a in range(5)]
        print(f"   {label:13}" + ''.join(f"{m:8.1f}+/-{sd:3.1f}" for m, sd in row))
    print("   heavy armour (3, 4) blocks Sidestep; kilograms are charged in 4 below")


# --------------------------------------------------------------------------- 3
def the_cliff_edge():
    """Is a point of armour worth the same against four small hits as against one big one?

    equipment.md 1.2 says no, and says it is why the ladder stops at four: "a point of it is worth
    far more against four goblins striking for 3 than against one ogre striking for 8". Nothing had
    ever run the ogre. These three groups hold the damage at 12 a round and the Health at 20, and
    vary only how many bodies it arrives in.
    """
    print("\n3. THE CLIFF EDGE: the same 12 damage a round, divided three ways")
    groups = {
        '4 x 3 dmg': ('spear',) * 4,
        '2 x 6 dmg': ('brute',) * 2,
        '1 x 12 dmg': ('ogre',),
    }
    print(f"   {'':12}" + ''.join(f"{'armor ' + str(a):>12}" for a in range(5)) + "   0->4")
    for label, gob in groups.items():
        row = [rate(gob, armor=a) for a in range(5)]
        print(f"   {label:12}" + ''.join(f"{m:8.1f}+/-{sd:3.1f}" for m, sd in row)
              + f"  {row[4][0] - row[0][0]:+6.1f}")
    print("   prevented by armour per fight, 4 x 3 vs 1 x 12, at armor 4: "
          f"{stat('prevented_armor', groups['4 x 3 dmg'], armor=4):.1f} vs "
          f"{stat('prevented_armor', groups['1 x 12 dmg'], armor=4):.1f}")


# --------------------------------------------------------------------------- 4
def what_plate_costs():
    """Plate is 20 kg of a 40 kg allowance and it blocks Sidestep. Both are charged here.

    The weight only bites when something else is on your back, which is exactly what "Burdened is
    one bad decision away" means -- so the dial is the loot, not the armour.
    """
    print("\n4. WHAT PLATE COSTS")
    gob = ENCOUNTERS['2 sp + 2 bw']
    print("   against 2 spears + 2 bows, the fight where mobility is worth most")
    for a in (2, 4):
        kg = ARMOUR[a]['kg'] + WEAPONS['sword']['kg'] + 3
        tag = 'Mail' if a == 2 else 'Plate'
        show(f"{tag} ({kg} kg)", rate(gob, armor=a))
    print("   Plate's Sidestep block, isolated: armor 4 with the reaction allowed anyway")
    show("Plate, no block", rate(gob, armor=4, heavy_armor=False), 15)
    print("   and the kilograms, by what else is carried:")
    for extra in (0, 18, 38):
        load = ARMOUR[4]['kg'] + WEAPONS['sword']['kg'] + 3 + extra
        state = 'Overloaded' if load > CARRY_LIMIT * 1.5 else 'Burdened' if load > CARRY_LIMIT else 'free'
        show(f"+{extra} kg = {load} ({state})", rate(gob, armor=4, extra_kg=extra), 24)
    # The control. Nothing about Burdened comes from the armour, so burdening a LIGHTER rung to the
    # same total has to show the same collapse -- otherwise the figure above is about Plate rather
    # than about weight, and the conclusion drawn from it is the wrong one.
    print("   control: the same 43 kg reached from Mail instead, to show it is the weight")
    show("Mail, 43 kg", rate(gob, armor=2, extra_kg=29), 24)


# --------------------------------------------------------------------------- 5
def reload_arithmetic(strong=True):
    """Damage a turn by weapon and target armour, which is what reload actually trades.

    equipment.md 3: "a bow fires every turn, a crossbow fires every other turn." So a reload weapon
    divides its damage by two, and buys `ignores N armor` with the half. This is the fate deck's own
    distribution rather than a simulation, so it is exact, and it says where the trade turns over.

    It runs twice because the answer turns on one feature. Strong is +1 with HEAVY items, and
    `Heavy` also marks the weight class that blocks Sidestep -- so a longbow collects a melee
    feature's bonus for its draw weight and a crossbow, the weapon a weak person can actually use,
    collects nothing. The document that asks this question never mentions the feature.
    """
    print(f"\n5. RELOAD: expected damage a turn, by target armour (Strong={strong})")
    print(f"   {'weapon':16}{'rng':>4}" + ''.join(f"{'ar ' + str(a):>7}" for a in range(5)))
    for name in ('bow', 'longbow', 'crossbow', 'heavy_crossbow', 'arquebus', 'musket', 'sword'):
        prof = WEAPONS[name]
        value = prof['strike'] + (1 if strong and prof['heavy'] else 0)
        per_turn = 0.5 if prof.get('reload') else 1.0
        row = []
        for a in range(5):
            soak = max(0, a - prof.get('ignores', 0))
            e = sum(p * max(0, fate_apply(value, c) - soak) for c, p in FATE_DIST[0].items())
            row.append(e * per_turn)
        print(f"   {name:16}{prof['rng']:>4}" + ''.join(f"{v:7.2f}" for v in row))


# --------------------------------------------------------------------------- 6
def bow_against_crossbow(strong=True):
    """The claim: "against five goblins the bow wins; against one armoured knight the crossbow does."

    The armoured enemy is a goblin spear with Brigandine or Plate on and nothing else changed, so
    this compares weapons rather than encounters. A two-handed weapon gives up the shield, which is
    the confound that would otherwise flatter every bow on the list.

    Run without Strong as well, because an arithmetic crossover is not a playable difference: the
    one in 5 arrives while both weapons are still losing the fight.
    """
    print(f"\n6. THE BOW AND THE CROSSBOW (Strong={strong})")
    cases = {
        '5 spears':   ('spear',) * 5,
        '5 guards (armor 3)': ('guard',) * 5,
        '5 plated (armor 4)': ('plated',) * 5,
    }
    print(f"   {'weapon':16}" + ''.join(f"{k:>22}" for k in cases))
    for name in ('sword', 'bow', 'longbow', 'crossbow', 'heavy_crossbow', 'arquebus'):
        # Two hands means no shield: the rules do not let you hold a longbow and a Wooden Shield.
        two_handed = name not in ('sword', 'pistol')
        kw = dict(weapon=name, strong=strong)
        if two_handed:
            kw.update(shield_def=0, shield_kg=0)
        out = []
        for gob in cases.values():
            m, sd = rate(gob, **kw)
            out.append(f"{m:14.1f}+/-{sd:4.1f}")
        print(f"   {name:16}" + ''.join(out))
    print("   sword keeps its Wooden Shield (Defend 2); every bow and gun gives it up")


def main():
    print(f"CardRPG equipment -- {FIGHTS} fights x {len(SEEDS)} seeds a figure"
          f"  ({TABLE_FIGHTS} for the published table)")
    sidestep_was_inert()
    the_armour_ladder()
    the_cliff_edge()
    what_plate_costs()
    # Both run twice: the whole bow-against-crossbow question turns on the Strong feature, and the
    # document that asks it never mentions one.
    for strong in (True, False):
        reload_arithmetic(strong)
    for strong in (True, False):
        bow_against_crossbow(strong)


if __name__ == '__main__':
    main()
