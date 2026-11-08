"""What a career is paid outside a fight, priced in the unit the skill rules already use.

`careers_sim.py` measures a career in win rate, which prices a card and a point of Health and is
**blind to eight of the sixteen rewards on leveling.md 4's list**. A know-how, a training, an
expertise, a mastery, a language, a rest token and a kilogram of carry never enter a win rate, so a
career measured only in the arena is measured on part of its pay.

The unit here is **points of success chance on a skill check**, which is the project's own:
skill-rules 2 prices one point of card, tool, push or help at about 15 of them. Nothing is invented
-- the fate deck is the twenty cards combat uses, read double the way a check reads it, and every
price below is computed from it rather than asserted.

Exact arithmetic, no sampling, so there is no seed and no noise floor.

    node ../foundry/cardrpg/test/careers-export.mjs && python careers_offduty.py
"""
import collections
import json
import os

FATE = ['MISS', -2] + [-1] * 4 + [0] * 8 + [1] * 4 + [2, 'CRIT']
HAND, SKILL_DECK = 4, 17          # skill-rules 1: hand 4, and a 16-card deck plus a background card


def rank(c):
    return {'MISS': -99, 'CRIT': 99}.get(c, c)


def dist(mode):
    """The chance of each fate result. mode +1 is advantage: draw two, keep the better."""
    out = collections.Counter()
    if mode == 0:
        out.update(FATE)
    else:
        for i, a in enumerate(FATE):
            for j, b in enumerate(FATE):
                if i != j:
                    out[max(a, b, key=rank) if mode > 0 else min(a, b, key=rank)] += 1
    total = sum(out.values())
    return {k: v / total for k, v in out.items()}


D = {m: dist(m) for m in (-1, 0, 1)}


def succeeds(base, card, dc):
    """A check: the fate card counts DOUBLE (skill-rules 2). A Miss fails, a Critical succeeds."""
    if card == 'MISS':
        return False
    if card == 'CRIT':
        return True
    return base + 2 * card >= dc


def p(base, dc, mode=0):
    return sum(pr for c, pr in D[mode].items() if succeeds(base, c, dc))


def per_point(dc):
    """What one point of modifier buys, over the band where a check is in doubt."""
    return sum(p(t + 1, dc) - p(t, dc) for t in range(dc - 4, dc + 2)) / 6 * 100


def advantage_worth(dc):
    """What a know-how buys, over the same band."""
    return sum(p(t, dc, 1) - p(t, dc) for t in range(dc - 4, dc + 2)) / 6 * 100


POINT = (per_point(5) + per_point(7)) / 2
KNOW_HOW = (advantage_worth(5) + advantage_worth(7)) / 2
# An expertise raises ONE card of an approach by 1, so it pays only on the checks where that card
# is the one in hand: four cards drawn from seventeen.
EXPERTISE = POINT * HAND / SKILL_DECK

# Which trainings unlock anything comes ACROSS in careers.json, not typed out here.
#
# skill-rules 2 caps an untrained user at +1, so a training is worth something exactly when a tool
# printed above +1 names it -- and the first draft of this file held its own list of three, which
# went stale the same afternoon the catalogue raised two more tools to +2. A number that lives in
# two places is a number that disagrees with itself, which is the failure the validator exists to
# catch; so the export computes it off ITEMS[].bonus and this reads the answer.
def live_trainings(data):
    return {t['training'].strip().lower(): t['value'] for t in data.get('liveTrainings', [])}

HERE = os.path.dirname(os.path.abspath(__file__))


def ledger(c, LIVE_TRAININGS):
    """Everything a fight cannot see, priced where it can be and counted where it cannot."""
    live = [t for t in c['trainings'] if t in LIVE_TRAININGS]
    dead = [t for t in c['trainings'] if t not in LIVE_TRAININGS]
    pts = (len(c['knowHow']) * KNOW_HOW
           + sum((LIVE_TRAININGS[t] - 1) * POINT for t in live)
           + len(c['expertise']) * EXPERTISE)
    return dict(pts=pts, kh=len(c['knowHow']), live=len(live), dead=len(dead),
                ex=len(c['expertise']), ma=len(c['masteries']), lg=len(c['languages']),
                rt=c['restTokens'], carry=c['carry'], choices=len(c['choices']))


def main():
    data = json.load(open(os.path.join(HERE, 'careers.json'), encoding='utf-8'))
    LIVE = live_trainings(data)
    careers = [c for c in data['careers'] if c['tier'] > 0]

    print(__doc__.split('\n')[0])
    print(f"\none point of modifier on a check  {POINT:+.1f} points of success chance"
          f"   (skill-rules 2 says about 15)")
    print(f"a know-how (advantage where it fits) {KNOW_HOW:+.1f}"
          f"   -- so a know-how is worth about one point, on one named situation")
    print(f"an expertise (one card in {SKILL_DECK}, hand {HAND})      {EXPERTISE:+.1f}")

    rows = [(c, ledger(c, LIVE)) for c in careers]
    rows.sort(key=lambda r: -r[1]['pts'])
    print("\nWHAT A FIGHT CANNOT SEE")
    print(f"{'career':<16}{'way':<9}{'lv':>3}{'off-duty':>10}"
          f"{'know':>6}{'train':>7}{'dead':>6}{'exp':>5}{'mast':>6}{'lang':>6}{'rest':>6}{'kg':>5}")
    for c, g in rows:
        print(f"{c['title']:<16}{c['way']:<9}{c['level']:>3}{g['pts']:>9.1f}"
              f"{g['kh']:>6}{g['live']:>7}{g['dead']:>6}{g['ex']:>5}{g['ma']:>6}"
              f"{g['lg']:>6}{g['rt']:>6}{g['carry']:>5}")

    for way in ('shade', 'strength'):
        ws = [g['pts'] for c, g in rows if c['way'] == way]
        kg = [g['carry'] for c, g in rows if c['way'] == way]
        print(f"  {way:<9} n={len(ws):<3} off-duty mean {sum(ws)/len(ws):5.1f}"
              f"  range {min(ws):.1f}..{max(ws):.1f}   carry mean {sum(kg)/len(kg):.1f} kg")

    dead = collections.Counter(t for c in careers for t in c['trainings'] if t not in LIVE)
    print(f"\ntrainings that unlock nothing ({sum(dead.values())} grants, "
          f"{len(dead)} distinct): {', '.join(sorted(dead))}")
    # NOT "careers offered a menu", which is what this used to say and measured the wrong thing:
    # a career's grants come off its CHEAPEST route, and no menu node in the game is on one -- all
    # twenty-six are leaves nothing depends on, so a menu is a level you may spend and never one you
    # must. Counted that way it is zero for every Way including the casters. What is worth counting
    # is whether the Way has a menu to spend a level on at all.
    print(f"careers whose cheapest route includes a menu: "
          f"{sum(1 for c in careers if c['choices'])} of {len(careers)}"
          "   -- zero for every Way: a menu is never a prerequisite")
    print(f"careers with a mastery: {sum(1 for c in careers if c['masteries'])} of {len(careers)}"
          "   -- the only reward that moves a passive score")
    print(f"careers with a language: {sum(1 for c in careers if c['languages'])} of {len(careers)}")
    print(f"careers with a rest token: {sum(1 for c in careers if c['restTokens'])} of {len(careers)}")
    approaches = collections.Counter(a for c in careers for a in c['expertise'])
    print(f"expertise by approach: {dict(approaches)}")

    combined(careers, rows)


def combined(careers, rows):
    """The two ledgers side by side, if `careers_sim.py` has left its win rates behind.

    They are NOT added together. A point of win rate over a five-fight ladder and a point of
    success chance on a skill check are different units measuring different halves of a character's
    day, and a single score would be a judgement about how much of play is a fight -- which is the
    table's to make, not this script's. What the ranks CAN say is who is paid in one currency, who
    in both, and who in neither.
    """
    nl = chr(10)
    path = os.path.join(HERE, 'careers-combat.json')
    if not os.path.exists(path):
        print(chr(10) + "(no careers-combat.json: run careers_sim.py for the combat column)")
        return
    combat = json.load(open(path, encoding='utf-8'))
    wins = {t: v['mean_win'] for t, v in combat['careers'].items()}
    have = [(c, g) for c, g in rows if c['title'] in wins]
    byfight = {c['title']: i + 1 for i, (c, _) in
               enumerate(sorted(have, key=lambda r: -wins[r[0]['title']]))}
    byduty = {c['title']: i + 1 for i, (c, _) in
              enumerate(sorted(have, key=lambda r: -r[1]['pts']))}

    print(f"{nl}{nl}BOTH LEDGERS   (win rate: {combat['fights']} fights per cell over "
          f"{len(combat['encounters'])} encounters, seed {combat['seed']})")
    print("the two columns are different units and are NOT added -- the ranks are what compare")
    print(f"{'career':<16}{'way':<9}{'lv':>3}{'win %':>8}{'rank':>6}"
          f"{'off-duty':>10}{'rank':>6}   verdict")
    n = len(have)
    for c, g in sorted(have, key=lambda r: byfight[r[0]['title']] + byduty[r[0]['title']]):
        rf, rd = byfight[c['title']], byduty[c['title']]
        top, bot = n / 3, 2 * n / 3
        if rf <= top and rd <= top:
            v = 'paid twice'
        elif rf > bot and rd > bot:
            v = 'paid in neither'
        elif rf <= top and rd > bot:
            v = 'a fighter'
        elif rd <= top and rf > bot:
            v = 'an operator'
        else:
            v = ''
        print(f"{c['title']:<16}{c['way']:<9}{c['level']:>3}{wins[c['title']]:>8.1f}{rf:>6}"
              f"{g['pts']:>10.1f}{rd:>6}   {v}")

    for way in ('shade', 'strength'):
        ws = [wins[c['title']] for c, _ in have if c['way'] == way]
        ds = [g['pts'] for c, g in have if c['way'] == way]
        print(f"  {way:<9} win {sum(ws)/len(ws):5.1f}   off-duty {sum(ds)/len(ds):5.1f}")
    sw = [wins[c['title']] for c, _ in have if c['way'] == 'shade']
    st = [wins[c['title']] for c, _ in have if c['way'] == 'strength']
    dw = [g['pts'] for c, g in have if c['way'] == 'shade']
    dt = [g['pts'] for c, g in have if c['way'] == 'strength']
    print(f"{nl}  Strength leads the fight by {sum(st)/len(st) - sum(sw)/len(sw):+.1f} points of "
          f"win rate")
    print(f"  Shade leads the rest of the day by {sum(dw)/len(dw) - sum(dt)/len(dt):+.1f} points "
          f"of success chance")


if __name__ == '__main__':
    main()
