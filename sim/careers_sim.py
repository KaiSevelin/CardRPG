#!/usr/bin/env python3
"""Play every martial career from the Way graph against one encounter ladder.

`combat_sim.py` measures RULES -- one Warrior, one deck, a knob per scenario. This measures
CONTENT: what the levelling graph actually hands a character, played by the same AI against the
same fights, so two careers differ only by what their nodes gave them.

The chassis is held constant and that is the whole experiment. Character creation does not exist
yet (core-rules 12 lists "assemble a starter deck" as unbuilt), so there is no Way starting deck to
give a Shade. Every career therefore plays the **starter sixteen plus what its own nodes granted**,
with its own Health and its own prunes. Differences in the table are the graph's doing and nothing
else's.

    python sim/careers_sim.py                  # the ladder, every career
    python sim/careers_sim.py --probe          # find which encounters discriminate
    python sim/careers_sim.py --fights 4000
"""
import argparse
import json
import os
import statistics

import combat_sim as cs

HERE = os.path.dirname(os.path.abspath(__file__))

# --------------------------------------------------------------- translation
#
# A card step is `{verb, mod, param}`; these are the verbs that turn into something happening on
# the board. Everything else becomes ('inert', verb), which the engine ignores and the AI scores at
# its 0.2 floor. Those are counted and reported: a career whose granted cards are half unmodelled
# has a number that means less, and the only honest thing to do with that is print it.
MODELLED = {'strike', 'move', 'defend', 'block', 'ready', 'use', 'heal', 'shake'}

# Reactions the engine resolves. `sidestep` denies a hit outright, `block` cuts 3, `parry` cuts 2
# in melee, `use` drinks a potion. Anything else falls through to the universal brace, which every
# card in hand can already do -- so a card carrying one of those is measured with it inert.
MODELLED_REACTIONS = {'block', 'parry', 'sidestep', 'use'}


def step(st):
    verb, mod, param = st.get('verb'), st.get('mod', 0), st.get('param')
    if verb == 'strike':
        return ('strike', mod)
    if verb == 'move':
        return ('move', param if param is not None else 1)
    if verb == 'defend':
        return ('defend',)
    if verb == 'block':
        return ('blockn', param if param is not None else 1)
    if verb == 'ready':
        return ('ready',)
    if verb == 'use':
        return ('use',)
    if verb == 'heal':
        return ('heal', param if param is not None else 1)
    if verb == 'shake':
        return ('shake', param if param is not None else 1)
    return ('inert', verb)


def build(card):
    """A careers.json card as the simulator's (primary, secondary, reaction, copies)."""
    return ([step(s) for s in card['primary']],
            [step(s) for s in card['secondary']],
            card['reaction'], card.get('copies', 1))


def load():
    with open(os.path.join(HERE, 'careers.json'), encoding='utf-8') as fh:
        data = json.load(fh)
    data['cards_by_name'] = {c['name']: c for c in data['cards']}
    return data


def deck_for(career, cards, starter):
    """The starter sixteen plus what this career's nodes granted, and which halves are Spent."""
    deck = {c['name']: build(c) for c in starter}
    spent = {}
    for name in career['cards']:
        card = cards[name]
        primary, secondary, reaction, copies = build(card)
        if name in deck:                       # a second copy of something already carried
            deck[name] = (primary, secondary, reaction, deck[name][3] + copies)
        else:
            deck[name] = (primary, secondary, reaction, copies)
        halves = ''
        for half, key in (('P', 'primary'), ('S', 'secondary')):
            if ((card.get('costs') or {}).get(key) or {}).get('spent'):
                halves += half
        if halves:
            spent[name] = halves
    return deck, spent


def coverage(career, cards):
    """How much of what this career was GRANTED the simulator can actually play."""
    steps = unmodelled = 0
    inert_cards = []
    for name in career['cards']:
        card = cards[name]
        playable = False
        for half in ('primary', 'secondary'):
            for st in card[half]:
                steps += 1
                if st.get('verb') in MODELLED:
                    playable = True
                else:
                    unmodelled += 1
        if not playable and card['reaction'] not in MODELLED_REACTIONS:
            inert_cards.append(name)
    return steps, unmodelled, inert_cards


# --------------------------------------------------------------- the fights
#
# The baseline three spears is not on the ladder: the starter Warrior already wins 99.5% of those,
# and a ceiling cannot tell two careers apart. --probe is how these four were chosen.
LADDER = [
    # Five fights, each applying a different pressure, and the starter chassis sits between 38%
    # and 67% on all of them -- enough room above to reward a career and enough below to punish
    # one. Fights where the chassis wins 95%+ or loses 85%+ cannot tell two careers apart.
    ('5 spears', dict(goblins=('spear',) * 5)),                                  # numbers
    ('6 spears', dict(goblins=('spear',) * 6)),                                  # numbers, hard
    ('2 spear 2 bow', dict(goblins=('spear', 'spear', 'bow', 'bow'))),           # range: legs
    ('2 brutes', dict(goblins=('brute', 'brute'))),                              # burst: soak
    ('2 guard 2 spear', dict(goblins=('guard', 'guard', 'spear', 'spear'))),     # armour: damage
]

PROBE = [
    ('3 spears (baseline)', dict()),
    ('4 spears', dict(goblins=('spear',) * 4)),
    ('5 spears', dict(goblins=('spear',) * 5)),
    ('6 spears', dict(goblins=('spear',) * 6)),
    ('7 spears', dict(goblins=('spear',) * 7)),
    ('2 spear 2 bow', dict(goblins=('spear', 'spear', 'bow', 'bow'))),
    ('4 spear 2 bow', dict(goblins=('spear', 'spear', 'spear', 'spear', 'bow', 'bow'))),
    ('2 brutes', dict(goblins=('brute', 'brute'))),
    ('1 ogre', dict(goblins=('ogre',))),
    ('2 guards', dict(goblins=('guard', 'guard'))),
    ('2 guard 2 spear', dict(goblins=('guard', 'guard', 'spear', 'spear'))),
    ('2 plated', dict(goblins=('plated', 'plated'))),
]

STARTER_CHASSIS = dict(id='-', title='starter Warrior', way='-', tier=0, level=1,
                       cards=[], health=0, handSize=0, prunes=0, carry=0, features=[])

# --------------------------------------------------------------- the kit
#
# Half a dozen careers ARE a piece of equipment, and measuring them with a sword and a shield is
# measuring something else. Every line here is a quotation from specializations.md 5, not a guess:
#
#   Archer       "Archer is a bow" / Range -- "hands full, and ruined by anything adjacent"
#   Musketeer    "Musketeers, Crossbow" / the loaded state / "nothing at all up close"
#   Artillerist  Ground -- "immobile while it fires"
#   Ironclad     "Armor and Overloaded -- carrying past the limit on purpose"
#   Knight       "Cavalry, Sword" / "gear you can lose"
#
# `shield_def=0, shield_kg=0` is what "hands full" means: a bow and a shield is not a loadout.
# Ironclad's `extra_kg` is the only invented number, and it is the smallest load that reaches
# Overloaded, which is the state its own Signature is written for.
KIT = {
    'Archer':      dict(weapon='bow', shield_def=0, shield_kg=0),
    'Musketeer':   dict(weapon='arquebus', shield_def=0, shield_kg=0, first_shot_bonus=2),
    'Artillerist': dict(weapon='heavy_crossbow', shield_def=0, shield_kg=0),
    'Ironclad':    dict(armor=4, extra_kg=36, armor_doubles_overloaded=True),
    'Knight':      dict(armor=3),
    'Guardian':    dict(wall=True),
}

# Features the simulator can express. The rest are listed in Config and in the report.
FEATURE_FLAGS = {
    'The Wall': dict(wall=True),
    'Nothing Gets Through': dict(armor_doubles_overloaded=True),
    'Loaded Before the Bell': dict(first_shot_bonus=2),
}

# Features that are real content the simulator cannot price, so a career holding one is understated
# by however much it is worth. Named so the report can say whose number is soft and why.
UNPRICED_FEATURES = {
    'The Opening': 'advantage vs an opening -- nothing sets one in a solo fight',
    'Cleave to the Bone': 'moves the Wound threshold; Wounds are not simulated',
    'One Trick': 'prepare from any school; no spell engine',
}


def mean(xs):
    return statistics.fmean(xs) if xs else float('nan')


def run(career, data, encounter, fights, seed, kit=False):
    deck, spent = deck_for(career, data['cards_by_name'], data['starter'])
    opts = dict(
        name=career['title'],
        hp=12 + career['health'],
        hand_size=5 + career['handSize'],
        deck=deck,
        spent_cards=spent or None,
        # A prune is the player spending a reward on their worst card, which is what deck_cut
        # does with deck_cut_random off.
        deck_cut=career['prunes'],
        carry_limit=cs.CARRY_LIMIT + career.get('carry', 0))
    if kit:
        # The career's own Signature feature, then the kit its content names. The kit wins where
        # they overlap, because a kit line sets the weapon the feature is about.
        for feature in career.get('features', []):
            opts.update(FEATURE_FLAGS.get(feature, {}))
        opts.update(KIT.get(career['title'], {}))
    opts.update(encounter)
    return cs.run_scenario(cs.Config(**opts), fights, seed)


def probe(data, fights, seed):
    print('starter chassis, %d fights each\n' % fights)
    head = ('encounter'.ljust(22) + 'win%'.rjust(7) + 'rounds'.rjust(8)
            + 'HP left'.rjust(9) + 'dmg taken'.rjust(11))
    print(head)
    for label, enc in PROBE:
        r = run(STARTER_CHASSIS, data, enc, fights, seed)
        a = r['agg']
        print(label.ljust(22)
              + ('%.1f' % (100.0 * r['wins'] / r['fights'])).rjust(7)
              + ('%.1f' % mean(a['rounds'])).rjust(8)
              + ('%.1f' % mean(a['hp_left_win'])).rjust(9)
              + ('%.1f' % mean(a['dmg_taken'])).rjust(11))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fights', type=int, default=1500)
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--probe', action='store_true')
    ap.add_argument('--tier', type=int, default=None)
    args = ap.parse_args()

    data = load()
    if args.probe:
        probe(data, args.fights, args.seed)
        return

    careers = [c for c in data['careers']
               if c['tier'] > 0 and (args.tier is None or c['tier'] == args.tier)]
    labels = [l for l, _ in LADDER]
    rows = []
    for career in careers:
        plain, kitted = [], []
        for label, enc in LADDER:
            r = run(career, data, enc, args.fights, args.seed)
            plain.append(100.0 * r['wins'] / r['fights'])
            k = run(career, data, enc, args.fights, args.seed, kit=True)
            kitted.append(100.0 * k['wins'] / k['fights'])
        steps, unmodelled, inert = coverage(career, data['cards_by_name'])
        rows.append(dict(career=career, plain=plain, kitted=kitted,
                         mean_win=mean(plain), mean_kit=mean(kitted),
                         steps=steps, unmodelled=unmodelled, inert=inert))

    base = []
    for label, enc in LADDER:
        r = run(STARTER_CHASSIS, data, enc, args.fights, args.seed)
        base.append(100.0 * r['wins'] / r['fights'])

    width = 16 + 9 + 5 + 4 + 6 + 4 + 14 * len(labels) + 8
    for key, mkey, title, note in (
            ('plain', 'mean_win', 'A. SAME CHASSIS FOR EVERYONE',
             'starter sixteen + the career\'s own cards, Health and prunes. Isolates the graph.'),
            ('kitted', 'mean_kit', 'B. CAREER-APPROPRIATE KIT',
             'plus the weapon/armour its content names and the Signature features that '
             'can be expressed.')):
        rows.sort(key=lambda r: -r[mkey])
        print('\n\n%s\n%s\n%d fights per cell, seed %d' % (title, note, args.fights, args.seed))
        print('\n' + 'career'.ljust(16) + 'way'.ljust(9) + 'tier'.rjust(5) + 'lv'.rjust(4)
              + 'cards'.rjust(6) + 'hp'.rjust(4)
              + ''.join(l.rjust(14) for l in labels) + 'MEAN'.rjust(8))
        for r in rows:
            c = r['career']
            print(c['title'].ljust(16) + c['way'].ljust(9)
                  + str(c['tier']).rjust(5) + str(c['level']).rjust(4)
                  + str(len(c['cards'])).rjust(6) + str(12 + c['health']).rjust(4)
                  + ''.join(('%.1f' % w).rjust(14) for w in r[key])
                  + ('%.1f' % r[mkey]).rjust(8))
        print('-' * width)
        print('no career'.ljust(16) + '-'.ljust(9) + '-'.rjust(5) + '1'.rjust(4)
              + '0'.rjust(6) + '12'.rjust(4)
              + ''.join(('%.1f' % w).rjust(14) for w in base)
              + ('%.1f' % mean(base)).rjust(8))
        means = [r[mkey] for r in rows]
        print('\nspread %.1f points: %s %.1f .. %s %.1f'
              % (means[0] - means[-1], rows[0]['career']['title'], means[0],
                 rows[-1]['career']['title'], means[-1]))
        print('median %.1f   stdev %.1f   a career is worth %.1f over no career at all'
              % (statistics.median(means), statistics.stdev(means), mean(means) - mean(base)))
        for tier in sorted({r['career']['tier'] for r in rows}):
            band = [r for r in rows if r['career']['tier'] == tier]
            for way in sorted({r['career']['way'] for r in band}):
                ws = [r[mkey] for r in band if r['career']['way'] == way]
                print('  tier %d %-9s n=%-3d mean %.1f  range %.1f..%.1f'
                      % (tier, way, len(ws), mean(ws), min(ws), max(ws)))

    # ---- what the numbers do not contain
    rows.sort(key=lambda r: -r['mean_kit'])
    moved = [r for r in rows if abs(r['mean_kit'] - r['mean_win']) >= 2.0]
    if moved:
        print('\n\nCareers the kit moved by 2 points or more:')
        for r in sorted(moved, key=lambda r: r['mean_win'] - r['mean_kit']):
            print('  %-16s %5.1f -> %5.1f  (%+.1f)'
                  % (r['career']['title'], r['mean_win'], r['mean_kit'],
                     r['mean_kit'] - r['mean_win']))

    inert_rows = [r for r in rows if r['inert']]
    if inert_rows:
        print('\nGranted cards the simulator cannot play, so these numbers are FLOORS:')
        for r in sorted(inert_rows, key=lambda r: -len(r['inert'])):
            print('  %-16s %d/%d inert: %s'
                  % (r['career']['title'], len(r['inert']), len(r['career']['cards']),
                     ', '.join(r['inert'])))

    # The win rates, written out so `careers_offduty.py` can set them beside the ledger a fight
    # cannot see. Two currencies, one file, and no second simulation run to read either of them.
    with open(os.path.join(HERE, 'careers-combat.json'), 'w', encoding='utf-8') as fh:
        json.dump({'fights': args.fights, 'seed': args.seed,
                   'encounters': [l for l, _ in LADDER],
                   'baseline': {'plain': base, 'mean': mean(base)},
                   'careers': {r['career']['title']:
                               dict(plain=r['plain'], kitted=r['kitted'],
                                    mean_win=r['mean_win'], mean_kit=r['mean_kit'])
                               for r in rows}}, fh, indent=1)
        fh.write(chr(10))

    print('\nFeatures that are real content and are not priced in either table:')
    for r in rows:
        unpriced = [f for f in r['career'].get('features', []) if f in UNPRICED_FEATURES]
        if unpriced:
            print('  %-16s %s' % (r['career']['title'],
                                  '; '.join('%s (%s)' % (f, UNPRICED_FEATURES[f])
                                            for f in unpriced)))


if __name__ == '__main__':
    main()
