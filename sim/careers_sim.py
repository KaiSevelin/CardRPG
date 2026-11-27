#!/usr/bin/env python3
"""Play every career from the Way graph against one encounter ladder.

`combat_sim.py` measures RULES -- one Warrior, one deck, a knob per scenario. This measures
CONTENT: what the levelling graph actually hands a character, played by the same AI against the
same fights, so two careers differ only by what their nodes gave them.

**Table A holds the chassis constant and that is the whole experiment.** Every career plays the
**starter sixteen plus what its own nodes granted**, with its own Health and its own prunes, so a
difference there is the graph's doing and nothing else's.

**[CHANGED 2026-11-27] There are three starter decks now, and two of the four Ways are magical.**
This file used to say *there is no Way starting deck to give a Shade*, and used that to justify
exporting only Shade and Strength. Both halves of that have moved: the Shade deck has existed
since 2026-11-07 and the Caster deck since 2026-11-27, core-rules 4 says a GM hands the matching
one out from level 1, and `combat_sim.py` can cast. So all 58 careers cross, and **table C plays
each on the deck the rules actually hand it** -- which for a caster is nine Cast halves where
table A gives them nine Strike halves they have no weapon for.

    python sim/careers_sim.py                  # the chassis, then the ladder, every career
    python sim/careers_sim.py --probe          # find which encounters discriminate
    python sim/careers_sim.py --chassis        # the three starter decks and nothing else
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
# the board. **`cast` joined them on 2026-11-27**: a Cast half resolves an implement's Cast line
# or a prepared formula, which is the second source core-rules 4 gives it.
#
# Everything else becomes ('inert', verb), which the engine ignores and the AI scores at its 0.2
# floor. Those are counted and reported: a career whose granted cards are half unmodelled has a
# number that means less, and the only honest thing to do with that is print it.
MODELLED = {'strike', 'cast', 'move', 'defend', 'block', 'ready', 'use', 'heal', 'shake'}

# Reactions the engine resolves. `sidestep` denies a hit outright, `block` cuts 3, `parry` cuts 2
# in melee, `use` drinks a potion. Anything else falls through to the universal brace, which every
# card in hand can already do -- so a card carrying one of those is measured with it inert.
MODELLED_REACTIONS = {'block', 'parry', 'sidestep', 'use'}


def step(st):
    verb, mod, param = st.get('verb'), st.get('mod', 0), st.get('param')
    if verb == 'strike':
        return ('strike', mod)
    if verb == 'cast':
        # A printed modifier adds to the formula's own and a printed range is a floor, so both
        # ride the op and the engine settles which of them wins (core-rules 4). The fourth element
        # is a card that cannot be played without something **Arcane** in hand (*The Sharp Word*).
        return ('cast', mod, st.get('range') or 0,
                (st.get('requires') or {}).get('tag') == 'arcane')
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


# --------------------------------------------------------------- formulas
#
# A formula crosses as its `effect` block and is translated here, next to the list of what can be
# resolved -- the same arrangement a card's steps have, and for the same reason.
#
# **What makes a formula castable off a Cast half in a fight** (core-rules 4):
#
#   - **no printed timing.** A reaction fires on a trigger and costs no half, a ritual is the work
#     of a night, and `outOfCombat` and `beforeFight` are not a turn. None of the four is ever on
#     the menu a Cast half offers, so none of them is prepared into a slot here.
#   - **an effect this file can resolve**: damage, a heal, a Shake Off or a Block. A formula whose
#     whole effect is a **condition on an enemy** is real content and is not resolvable here --
#     nothing in `combat_sim.py` reads a condition on a goblin -- so it is counted and reported
#     rather than scored at a floor.
#
# **Of the 36 formulas the graph grants: 3 castable, 9 a condition on an enemy, 5 a timing that is
# never on a Cast menu, and 19 prose a simulator cannot resolve at all.** The three are *Blood
# Price*, *Open the Vein* and *The Long Night*, and all three are damage. That is the honest state
# of the engine and the next thing it asks for, in that order: enemy conditions first, because
# nine formulas and a third of the card content are waiting behind the same one gap.
SPELL_VERBS = ('power', 'heal', 'shake', 'block')


def spell_record(spell):
    """A careers.json formula as a record `combat_sim` can cast, or None if it cannot."""
    e = spell.get('effect') or {}
    if e.get('timing'):
        return None
    rec = dict(name=spell['name'], strength=spell.get('strength') or 0)
    cost = spell.get('cost') or {}
    # `scale: perAlly` is a price per ally and a solo hero has none, so it is 0 here and the
    # formulas that charge it are prose anyway.
    rec['health'] = 0 if cost.get('scale') else (cost.get('health') or 0)
    if e.get('range') is not None:
        rec['rng'] = e['range']
    if e.get('area'):
        rec['area'] = e['area']
        # Blast is the default and the cheap one (core-rules 11); Aimed spares your side. The
        # difference is whether the caster is in their own area, so it is not decoration.
        if e.get('areaKind') == 'aimed':
            rec['aimed'] = True
    if e.get('ignoresArmour'):
        rec['ignores_armour'] = True
    if e.get('ignoresBlock'):
        rec['ignores_block'] = True
    if e.get('condition'):
        rec['condition'] = e['condition']
    verb, param, mod = e.get('verb'), e.get('param'), e.get('mod')
    if verb == 'cast' and mod:
        rec['power'] = mod
    elif verb == 'heal' and param and not e.get('delay'):
        # A delayed heal arrives two rounds later and nothing here queues one, so a formula that
        # prints `delay` is left unplayable rather than paid early.
        rec['heal'] = param
    elif verb == 'shake' and param:
        rec['shake'] = param
    elif verb == 'block' and param:
        rec['block'] = param
    if not any(rec.get(k) for k in SPELL_VERBS):
        return None
    return rec


def spell_coverage(career, defs):
    """What this career KNOWS, in four piles: castable, a timing, a condition, prose."""
    castable, timed, condition, prose = [], [], [], []
    for name in career['spells']:
        spell = defs[name]
        e = spell.get('effect') or {}
        if e.get('timing'):
            timed.append(name)
        elif spell_record(spell):
            castable.append(name)
        elif e.get('condition'):
            condition.append(name)
        else:
            prose.append(name)
    return castable, timed, condition, prose


def prepare(career, defs):
    """Fill the slots with what this career can cast, cheapest first (core-rules 4).

    Preparation happens between fights, so this is a loadout and never a decision in the fight.
    Cheapest first because a slot spent is a slot gone: two strength-1 formulas beat one
    strength-2 whenever both are castable, and nothing in the graph grants enough formulas for
    that to be a hard choice -- 4 known is the most any career reaches against 5 or 6 slots.
    """
    slots = career.get('spellSlots') or 0
    pairs = [(defs[n], spell_record(defs[n])) for n in career['spells']]
    pairs = [(sp, rec) for sp, rec in pairs if rec is not None]
    pairs.sort(key=lambda t: (t[0].get('strength') or 0, t[0]['name']))
    ready, unslotted, used = [], [], 0
    for spell, rec in pairs:
        cost = spell.get('strength') or 0
        if used + cost > slots:
            unslotted.append(spell['name'])
            continue
        used += cost
        ready.append(rec)
    return tuple(ready), unslotted, used, slots


def build(card):
    """A careers.json card as the simulator's (primary, secondary, reaction, copies)."""
    return ([step(s) for s in card['primary']],
            [step(s) for s in card['secondary']],
            card['reaction'], card.get('copies', 1))


def load():
    with open(os.path.join(HERE, 'careers.json'), encoding='utf-8') as fh:
        data = json.load(fh)
    data['cards_by_name'] = {c['name']: c for c in data['cards']}
    data['spells_by_name'] = {s['name']: s for s in data['spells']}
    return data


def strain_of(card):
    """`{half: n}` for the halves this card strains to play (core-rules 8)."""
    out = {}
    for half, key in (('P', 'primary'), ('S', 'secondary')):
        n = ((card.get('costs') or {}).get(key) or {}).get('strain')
        if n:
            out[half] = n
    return out


def deck_for(career, cards, chassis):
    """A starter chassis plus what this career's nodes granted, and which halves are Spent."""
    deck = {c['name']: build(c) for c in chassis}
    spent, strain = {}, {}
    for c in chassis:
        if strain_of(c):
            strain[c['name']] = strain_of(c)
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
        if strain_of(card):
            strain[name] = strain_of(card)
    return deck, spent, strain


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

# **The deck the rules now hand out** (core-rules 4, and the note closed there on 2026-11-27:
# *a GM running a caster from level 1 hands out this deck in place of the Warrior's*). Table C is
# what a career is played with at a table rather than what isolates its graph.
CHASSIS_FOR = {'strength': 'Warrior', 'shade': 'Shade', 'mind': 'Caster', 'faith': 'Caster'}

# The implement in the casting hand. **The Fire Wand for every caster of either Way**, because
# content/gear.mjs holds exactly two Implements a character can start with -- the Wand and the
# Staff of Healing -- and the Staff is two-handed and heals rather than burns. There is no
# god-specific holy symbol at a starting price: Vax's own club is one by a rule on his node and
# nothing else in the catalogue is, which is a gap this measurement found and did not paper over
# with an invented number.
IMPLEMENT_FOR = {'mind': 'fire_wand', 'faith': 'fire_wand'}

# A caster's hands: a wand in one and the other free to gesture. Not a loadout choice -- a Caster
# deck prints **no Strike half at all**, so a sword in that hand would be weight and nothing else,
# and `weapon='none'` is combat_sim's empty hand rather than a weapon that deals 0.
CASTER_HANDS = dict(weapon='none', shield_def=0, shield_kg=0)

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
    # **[CHANGED 2026-11-27]** This said *no spell engine* and there is one. What is unpriced is
    # narrower and more interesting: the Half-mage may prepare from **any** school, and the three
    # formulas this engine can cast are all damage from one school -- so the feature's whole value
    # is a choice among 36 formulas of which 33 are unresolvable here.
    'One Trick': 'prepare from any school; 33 of the 36 formulas are unresolvable here',
}


def mean(xs):
    return statistics.fmean(xs) if xs else float('nan')


def run(career, data, encounter, fights, seed, kit=False, chassis='Warrior', magic=False):
    deck, spent, strain = deck_for(career, data['cards_by_name'], data['chassis'][chassis])
    opts = dict(
        name=career['title'],
        hp=12 + career['health'],
        hand_size=5 + career['handSize'],
        deck=deck,
        spent_cards=spent or None,
        strain_cards=strain,
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
    if magic and career['way'] in IMPLEMENT_FOR:
        # The implement, the free hand, and every formula the engine can play, prepared. All three
        # together, because a Cast half with no implement and no castable formula is a dead half
        # and measuring one is measuring nothing.
        ready, _, _, _ = prepare(career, data['spells_by_name'])
        opts.update(CASTER_HANDS)
        opts.update(implement=IMPLEMENT_FOR[career['way']], spells=ready)
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


# --------------------------------------------------------------- the three chassis
#
# **The measurement the Caster deck was shipped without.** starter-cards.md built it to the
# Warrior's budget field by field and said so, and the note under it recorded that a budget
# equality is a *design* argument and not a number. This is the number.
#
# The caster row changes the **hands** as well as the deck, and it has to: a deck with no Strike
# half cannot be played with a sword, and a wand is what its Cast halves are for. The fourth row
# is the one isolation worth having -- the same deck with a shield back on -- because the Shade
# deck's own -3.4 turned out to be a shield and not a deck.
CHASSIS_ROWS = [
    ('Warrior deck', 'Warrior', dict()),
    ('Shade deck', 'Shade', dict()),
    ('Caster deck, wand, no shield', 'Caster', dict(implement='fire_wand', **CASTER_HANDS)),
    # The one isolation worth having on the deck itself: a shield back on. It comes out **bit for
    # bit identical**, because the Caster deck prints no Defend primary and no Block reaction, so
    # a shield has nothing on it to read. That is a finding and not a measurement.
    ('  the same, with a shield', 'Caster',
     dict(implement='fire_wand', weapon='none', shield_def=2, shield_kg=3)),
]

# **An area attack and a morale rule interact, and the interaction is most of the headline.**
# Cowardly routs a goblin once it is below half its own Health, and a Blast puts **every** goblin
# in the footprint below half in the same instant -- so one cast can break a group of six where
# six Strikes could only ever break one at a time. The table is therefore measured twice, and the
# difference between the blocks is what a wand is borrowing from morale rather than earning.
CHASSIS_BLOCKS = [
    ('the rules as written', dict()),
    ('nobody flees -- cowardly off', dict(cowardly=False)),
]


def chassis_table(data, fights, seed):
    """The three starter decks on one character, which is what a chassis means."""
    print('\n\n0. THE THREE STARTER CHASSIS'
          '\nno career, no spells prepared: the sixteen cards and the hands they need.'
          '\n%d fights per cell, seed %d' % (fights, seed))
    labels = [l for l, _ in LADDER]
    blocks = []
    for title, knob in CHASSIS_BLOCKS:
        print('\n' + title + '\n' + 'chassis'.ljust(30)
              + ''.join(l.rjust(14) for l in labels) + 'MEAN'.rjust(8))
        out = []
        for label, chassis, extra in CHASSIS_ROWS:
            wins = []
            for _, enc in LADDER:
                r = run(STARTER_CHASSIS, data, dict(enc, **extra, **knob), fights, seed,
                        chassis=chassis)
                wins.append(100.0 * r['wins'] / r['fights'])
            out.append((label, mean(wins), wins))
            print(label.ljust(30) + ''.join(('%.1f' % w).rjust(14) for w in wins)
                  + ('%.1f' % mean(wins)).rjust(8))
        base = out[0][1]
        print()
        for label, m, _ in out[1:]:
            print('  %-30s %+.1f against the Warrior deck' % (label.strip(), m - base))
        blocks.append((title, out))
    if len(blocks) == 2:
        (_, a), (_, b) = blocks
        print('\n  what the morale rule is worth to each deck:')
        for (label, ma, _), (_, mb, _) in zip(a, b):
            print('    %-30s %5.1f -> %5.1f  (%+.1f without it)'
                  % (label.strip(), ma, mb, mb - ma))
    return blocks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fights', type=int, default=1500)
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--probe', action='store_true')
    ap.add_argument('--chassis', action='store_true')
    ap.add_argument('--tier', type=int, default=None)
    ap.add_argument('--way', default=None)
    args = ap.parse_args()

    data = load()
    if args.probe:
        probe(data, args.fights, args.seed)
        return
    if args.chassis:
        chassis_table(data, args.fights, args.seed)
        return

    chassis_table(data, args.fights, args.seed)
    careers = [c for c in data['careers']
               if c['tier'] > 0 and (args.tier is None or c['tier'] == args.tier)
               and (args.way is None or c['way'] == args.way)]
    labels = [l for l, _ in LADDER]
    rows = []
    for career in careers:
        own = CHASSIS_FOR[career['way']]
        plain, kitted, owned = [], [], []
        for label, enc in LADDER:
            r = run(career, data, enc, args.fights, args.seed)
            plain.append(100.0 * r['wins'] / r['fights'])
            k = run(career, data, enc, args.fights, args.seed, kit=True)
            kitted.append(100.0 * k['wins'] / k['fights'])
            c = run(career, data, enc, args.fights, args.seed, kit=True,
                    chassis=own, magic=True)
            owned.append(100.0 * c['wins'] / c['fights'])
        steps, unmodelled, inert = coverage(career, data['cards_by_name'])
        castable, timed, condition, prose = spell_coverage(career, data['spells_by_name'])
        ready, unslotted, used, slots = prepare(career, data['spells_by_name'])
        rows.append(dict(career=career, plain=plain, kitted=kitted, owned=owned,
                         mean_win=mean(plain), mean_kit=mean(kitted), mean_own=mean(owned),
                         steps=steps, unmodelled=unmodelled, inert=inert, chassis=own,
                         castable=castable, timed=timed, condition=condition, prose=prose,
                         used=used, slots=slots, unslotted=unslotted))

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
             'can be expressed.'),
            ('owned', 'mean_own', 'C. THE DECK THE RULES HAND IT',
             'B, and the starter deck core-rules 4 gives that Way -- Caster for Mind and '
             'Faith, with a wand\nand its formulas prepared.'
             '\nThe "no career" row below is still the WARRIOR deck, because no career means no '
             'Way;\nsection 0 is what each deck is worth on its own.')):
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

    # ---- and what a caster's own formulas come to, which is the new gap
    magical = [r for r in rows if r['career']['way'] in IMPLEMENT_FOR]
    if magical:
        print('\n\nFORMULAS: what the engine can cast of what the graph grants')
        print('A caster\'s table C is the DECK and the WAND. These are the formulas, and a career'
              '\nwith none castable is one measured without the thing its school is about.\n')
        print('  %-18s %-7s %-30s %s' % ('career', 'slots', 'prepared', 'and what is not'))
        tally = dict(castable=0, condition=0, timed=0, prose=0, known=0)
        for r in sorted(magical, key=lambda r: (-len(r['castable']), r['career']['title'])):
            missed = []
            if r['condition']:
                missed.append('%d condition' % len(r['condition']))
            if r['timed']:
                missed.append('%d timing' % len(r['timed']))
            if r['prose']:
                missed.append('%d prose' % len(r['prose']))
            if r['unslotted']:
                missed.append('%d no slot' % len(r['unslotted']))
            print('  %-18s %d/%-5d %-30s %s'
                  % (r['career']['title'], r['used'], r['slots'],
                     ', '.join(r['castable']) or '--', ', '.join(missed) or '--'))
            for key in ('castable', 'condition', 'timed', 'prose'):
                tally[key] += len(r[key])
            tally['known'] += len(r['career']['spells'])
        print('\n  %d formulas granted across the %d magical careers here: %d castable, '
              '%d a condition on an enemy,\n  %d a timing that is not on a Cast menu, %d prose. '
              'The condition pile is the one worth\n  closing, and it is one job: nothing in '
              'combat_sim.py reads a condition on a goblin.'
              % (tally['known'], len(magical), tally['castable'], tally['condition'],
                 tally['timed'], tally['prose']))

    # The win rates, written out so `careers_offduty.py` can set them beside the ledger a fight
    # cannot see. Two currencies, one file, and no second simulation run to read either of them.
    #
    # **Only on a whole run.** `--way` and `--tier` were added on 2026-11-27 and the first thing
    # one of them did was overwrite this file with sixteen Faith careers and nothing else, which
    # made `careers_offduty.py` divide by zero looking for Shade. A partial answer written over a
    # whole one is worse than no answer: the tool that reads it cannot tell.
    if args.way is not None or args.tier is not None:
        print('\n(filtered run: careers-combat.json left alone)')
        return
    with open(os.path.join(HERE, 'careers-combat.json'), 'w', encoding='utf-8') as fh:
        json.dump({'fights': args.fights, 'seed': args.seed,
                   'encounters': [l for l, _ in LADDER],
                   'baseline': {'plain': base, 'mean': mean(base)},
                   'careers': {r['career']['title']:
                               dict(plain=r['plain'], kitted=r['kitted'], owned=r['owned'],
                                    mean_win=r['mean_win'], mean_kit=r['mean_kit'],
                                    mean_own=r['mean_own'], chassis=r['chassis'])
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
