#!/usr/bin/env python3
"""Monte Carlo combat simulator for Card RPG draft 0.2.

Plays the starter Warrior against goblins on a grid using the rules in
rules/core-rules.md and rules/starter-cards.md. Both sides are driven by
simple AIs: the warrior picks the best-scoring card pair each turn, and the
goblins follow their NPC deck.

Each Config in SCENARIOS is one rules variant; the defaults are the rules as written,
so changing a default means the rules changed too. Scenarios named "draft 0.1 ..." keep
an old rule alive so the cost of a change stays measurable.

Usage:
    python sim/combat_sim.py                 # run all scenarios
    python sim/combat_sim.py --only ACD      # selected scenarios, by leading letter
    python sim/combat_sim.py --log 1         # print one narrated fight
    python sim/combat_sim.py --fights 5000   # more fights per scenario
"""
import argparse
import collections
import math
import random
import statistics
from dataclasses import dataclass, field, replace

GRID_W, GRID_H = 10, 8
ESCAPE_DIST = 5      # a fleeing NPC leaves the fight at the map edge, once this far from the hero

# ---------------------------------------------------------------- fate deck
FATE = ['MISS', -2] + [-1] * 4 + [0] * 8 + [1] * 4 + [2, 'CRIT']


def rank(c):
    return {'MISS': -99, 'CRIT': 99}.get(c, c)


def fate_apply(value, card):
    if card == 'MISS':
        return 0
    if card == 'CRIT':
        return value * 2
    return max(0, value + card)


def _fate_dist(mode):
    """Chance of each fate result, for a fresh deck (used by the AI to estimate)."""
    n = len(FATE)
    out = collections.Counter()
    if mode == 0:
        out.update(FATE)
    else:
        for i in range(n):
            for j in range(n):
                if i != j:
                    a, b = FATE[i], FATE[j]
                    out[max(a, b, key=rank) if mode > 0 else min(a, b, key=rank)] += 1
    total = sum(out.values())
    return {k: v / total for k, v in out.items()}


FATE_DIST = {m: _fate_dist(m) for m in (-1, 0, 1)}


class FateDeck:
    def __init__(self, rng):
        self.rng = rng
        self.reshuffle()

    def reshuffle(self):
        self.cards = FATE[:]
        self.rng.shuffle(self.cards)

    def _one(self):
        if not self.cards:
            self.reshuffle()
        return self.cards.pop()

    def draw(self, mode=0):
        """mode: +1 advantage, -1 disadvantage, 0 normal."""
        picks = [self._one()] if mode == 0 else [self._one(), self._one()]
        card = picks[0] if mode == 0 else (max(picks, key=rank) if mode > 0 else min(picks, key=rank))
        if any(p in ('MISS', 'CRIT') for p in picks):
            self.reshuffle()
        return card


# ---------------------------------------------------------------- cards
# name: (primary ops, secondary ops, reaction, copies)
# A card's worth to the AI is NOT stored here -- it is computed from its ops against the
# current board (see Game.card_value). A static table cannot express that Advance is junk
# against three adjacent spears and essential against two kiting archers.
WARRIOR_CARDS = {
    'Strike':      ([('strike', 0)], [('move', 1)], 'parry', 3),
    'Heavy Swing': ([('strike', 1)], [('move', 1)], None, 2),
    'Lunge':       ([('move', 2), ('strike', 0)], [('move', 1)], None, 1),
    'Shield Up':   ([('defend',)], [('move', 1)], 'block', 2),
    'Advance':     ([('move', 3)], [('move', 2)], 'sidestep', 2),
    'Draw Steel':  ([('strike', 0)], [('ready',)], None, 2),
    'Quick Hands': ([('use',)], [('ready',)], 'use', 1),
    'Second Wind': ([('heal', 2)], [('use',)], None, 1),
    'Taunt':       ([('taunt',)], [('move', 1)], None, 1),
    'Weapon Swap': ([('ready',)], [('strike', 0)], None, 1),
}

GOBLIN_CARDS = {
    'Stab & Scurry': [('strike', 0, None), ('move', 2)],
    'Rush':          [('move', 3), ('strike', 0, None)],
    'Swarm':         [('move', 2), ('strike', 'swarm', None)],
    'Cower':         [('away', 3)],
    'Dirty Trick':   [('strike', 0, 'daze')],
    'Throw Rock':    [('rock',)],
}


# ---------------------------------------------------------------- weapons
# Two profiles off rules/starter-cards.md. `heavy` is what the Strong feature keys on.
#
# This exists because Ready was inert in every run before it: four of the sixteen cards carry the
# verb and there was only ever one weapon to hold, so a quarter of the deck did nothing and the
# whole item economy -- slots, the back, swapping mid-fight -- had never been measured at all.
WEAPONS = {
    'sword': dict(strike=3, rng=1, heavy=True),    # Longsword
    'bow':   dict(strike=2, rng=6, heavy=False),   # Shortbow
}


# ---------------------------------------------------------------- conditions
# A mirror of CARDRPG.conditions in the system (module/config.mjs), carrying only the flags the
# simulator can act on. Keeping it a table rather than a pile of ifs is the same decision the
# engine made, and for the same reason: a new condition is a row, not a code path.
#
# shakeable = not an opening and has a duration to spend (core-rules 7).
CONDITIONS = {
    'dazed':    dict(blocks_secondary=True),
    'slowed':   dict(halves_move=True),
    'burning':  dict(valued=True, damage=True, cancels=('wet', 'frozen')),
    'poisoned': dict(valued=True, damage=True, blocks_secondary=True),
    'frozen':   dict(valued=True, reduces_move=True, cancels=('burning',)),
    'prone':    dict(enemy_melee_advantage=True, reduces_move=True),
    'grappled': dict(blocks_move=True),
    'offBalance': dict(opening=True),
    'wet':      dict(opening=True, cancels=('burning',)),
    'marked':   dict(opening=True),
    'blessed':  dict(no_duration=True, liftable=True, fate='CRIT'),
    'cursed':   dict(no_duration=True, liftable=True, fate='MISS'),
}

def shakeable(key):
    c = CONDITIONS[key]
    return not c.get('opening') and not c.get('no_duration')


# Catch Breath recovers exactly this many, all or nothing: the Exhausted threshold, so a
# breath buys one turn that is not Exhausted and no more (core-rules 8).
BREATH_RECOVERY = 2


@dataclass
class Config:
    name: str = 'baseline'
    hp: int = 12
    armor: int = 1
    strike_base: int = 3          # Longsword
    strong: bool = True           # Strong feature: +1 Strike with Heavy items
    shield_def: int = 2           # Wooden Shield
    potions: int = 1
    hand_size: int = 5
    goblins: tuple = ('spear', 'spear', 'spear')
    goblin_hp: int = 5
    goblin_dmg: int = 3           # Goblin Spear / Goblin Shortbow Strike value (draft 0.2)
    pack_tactics: bool = True     # advantage on melee Strike if another goblin is adjacent to target
    cowardly: bool = True         # flee, escape at map edge
    cowardly_mode: str = 'self'   # 'self': flees below half its own Health
                                  # 'group': the survivors break once half the group is down
    first: str = 'initiative'     # initiative | players | goblins
    # 'initiative' draws the real thing (core-rules 3): every goblin gets its own slot, so
    # they act scattered around the hero's turn. 'players'/'goblins' force one side to act
    # first as a block, which is what draft 0.1's group turns did -- kept for comparison.
    heavy_hits: bool = False
    cb_threshold: int = 3         # catch breath when draw pile empty and hand <= this
    double_strike: bool = True    # Weapon Swap secondary is Strike (False: Move 1)
    persistent_block: bool = True  # Defend primary blocks every attack until your next turn
    deck_cut: int = 0             # remove N cards from the action deck
    deck_cut_random: bool = False  # False: the weakest N (a deck-building choice)
                                   # True: N at random (Overloaded, core-rules 4)
    max_rounds: int = 40
    # What Dirty Trick inflicts. 'dazed' is the printed card; the others are here to price the
    # ladder against it (conditions.md 2.1), since "Poisoned N is Burning N plus Dazed" was an
    # assertion until it could be measured.
    # A second weapon slung on the back (core-rules 4): drawing from it is free, slinging costs a
    # Ready. '' is the old behaviour -- one weapon, and Ready does nothing.
    sling: str = ''
    goblin_condition: str = 'dazed'
    goblin_cond_value: int = 0     # intensity, for a `valued` condition
    goblin_cond_dur: int = 1
    # Swap one copy of Strike for a card whose secondary is Shake Off 1, to price a dispel.
    shake_card: bool = False
    card_overrides: dict = field(default_factory=dict)


def cheb(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]))


def neighbours(p):
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if dx or dy:
                q = (p[0] + dx, p[1] + dy)
                if 0 <= q[0] < GRID_W and 0 <= q[1] < GRID_H:
                    yield q


def step_toward(pos, target, blocked):
    """Best free neighbour that gets strictly closer (Chebyshev), or None."""
    now = cheb(pos, target)
    cands = [q for q in neighbours(pos) if q not in blocked and cheb(q, target) < now]
    return min(cands, key=lambda q: (cheb(q, target), math.dist(q, target)), default=None)


def step_away(pos, threat, blocked):
    best, best_d = None, cheb(pos, threat)
    for q in neighbours(pos):
        if q not in blocked and cheb(q, threat) > best_d:
            best, best_d = q, cheb(q, threat)
    return best


def has_cover(a, b, figures):
    ax, ay, bx, by = a[0] + .5, a[1] + .5, b[0] + .5, b[1] + .5
    for i in range(1, 60):
        t = i / 60
        c = (math.floor(ax + (bx - ax) * t), math.floor(ay + (by - ay) * t))
        if c != a and c != b and c in figures:
            return True
    return False


# ---------------------------------------------------------------- game
class Sim:
    """Snapshot of the board the warrior AI can play forward (real or expected)."""

    def __init__(self, game):
        w = game.w
        self.game = game
        self.wpos, self.whp, self.block, self.potions = w['pos'], w['hp'], w['block'], w['potions']
        self.gobs = [[g['pos'], g['hp'], g] for g in game.gobs if g['hp'] > 0]
        self.dmg = self.killp = self.healed = 0.0

    def alive(self):
        return [g for g in self.gobs if g[1] > 0]

    def run(self, ops, real):
        cfg = self.game.cfg
        # The weapon is Sim-local so the lookahead sees the swap: a Ready in the same turn makes the
        # Strike after it better, which is the only way the AI can ever value one.
        if not hasattr(self, 'weapon'):
            self.weapon = self.game.w['weapon']
        for op in ops:
            kind = op[0]
            if kind == 'move':
                alive = self.alive()
                if not alive or any(cheb(self.wpos, g[0]) == 1 for g in alive):
                    continue
                target = min(alive, key=lambda g: (cheb(self.wpos, g[0]), g[1]))
                blocked = {g[0] for g in alive}
                for _ in range(self.game.move_mod(op[1])):
                    if cheb(self.wpos, target[0]) <= 1:
                        break
                    nxt = step_toward(self.wpos, target[0], blocked)
                    if nxt is None:
                        break
                    self.wpos = nxt
            elif kind == 'strike':
                prof = WEAPONS[self.weapon]
                reach = [g for g in self.alive() if cheb(self.wpos, g[0]) <= prof['rng']]
                if not reach:
                    continue
                adj = reach
                # Strong is +1 with Heavy items only (starter-cards.md Features).
                value = prof['strike'] + op[1] + (1 if cfg.strong and prof['heavy'] else 0)
                # Ranged in melee: disadvantage while an enemy is adjacent (core-rules 11).
                ranged_pen = prof['rng'] > 1 and any(
                    cheb(self.wpos, g[0]) == 1 for g in self.alive())

                def est(g):
                    e = pk = 0.0
                    for c, p in FATE_DIST[0].items():
                        d = fate_apply(value, c)
                        e += p * min(d, g[1])
                        pk += p * (d >= g[1])
                    return e, pk
                target = max(adj, key=lambda g: (est(g)[1], -g[1]))
                if real:
                    card = self.game.fate_w.draw(-1 if ranged_pen else 0)
                    d = fate_apply(value, card)
                    self.game.stat_fate(card)
                    self.game.log(f"  Warrior strikes goblin {target[2]['id']} (base {value}, fate {card}) -> {d} dmg")
                    target[1] -= d
                    self.dmg += min(d, max(0, target[1] + d))
                else:
                    e, pk = est(target)
                    self.dmg += e
                    self.killp += pk
                    target[1] = 0 if pk >= .5 else target[1] - e
            elif kind == 'defend':
                self.block = cfg.shield_def
            elif kind in ('heal', 'use'):
                if kind == 'use':
                    if self.potions <= 0:
                        continue
                    self.potions -= 1
                    amount = 4
                else:
                    amount = op[1]
                if real:
                    card = self.game.fate_w.draw(0)
                    amount = fate_apply(amount, card)
                    self.game.stat_fate(card)
                gain = min(amount, cfg.hp - self.whp)
                self.whp += gain
                self.healed += gain
                if real:
                    self.game.log(f"  Warrior {'drinks potion' if kind == 'use' else 'heals'} +{gain} HP -> {self.whp}")
            elif kind in ('shake', 'lift'):
                # The lookahead has to SEE the saving or the AI will never spend a half on it.
                # Prevented harm is scored like healing, which is what it is: HP that stays on.
                saved = self.game.cond_relief(op[1] if kind == 'shake' else 99, lift=(kind == 'lift'))
                if real:
                    (self.game.lift() if kind == 'lift' else self.game.shake(op[1]))
                else:
                    self.healed += saved
            elif kind == 'ready':
                # One Ready swaps the held weapon for the slung one (core-rules 4). With nothing
                # slung it is the old no-op.
                if cfg.sling:
                    self.weapon = cfg.sling if self.weapon != cfg.sling else 'sword'
            # taunt: no effect in this test (solo hero)

    def commit(self):
        w = self.game.w
        w['pos'], w['hp'], w['block'], w['potions'] = self.wpos, self.whp, self.block, self.potions
        w['weapon'] = self.weapon
        for pos, hp, g in self.gobs:
            g['pos'] = pos
            if hp <= 0 < g['hp']:
                self.game.log(f"  Goblin {g['id']} is killed")
            g['hp'] = max(0, hp)


class Game:
    def __init__(self, cfg, rng, verbose=False):
        self.cfg, self.rng, self.verbose = cfg, rng, verbose
        self.cards = dict(WARRIOR_CARDS)
        if not cfg.double_strike:
            p, s, r, n = self.cards['Weapon Swap']
            self.cards['Weapon Swap'] = (p, [('move', 1)], r, n)
        if cfg.shake_card:
            # One copy of Strike becomes a card whose secondary sheds a condition. Costing a
            # secondary is the rung core-rules 7 says a Shake Off 1 belongs on, and taking it out
            # of Strike rather than adding a card keeps the deck at sixteen.
            p, sec, r, n = self.cards['Strike']
            self.cards['Strike'] = (p, sec, r, n - 1)
            self.cards['Shrug It Off'] = ([('strike', 0)], [('shake', 1)], 'parry', 1)
        self.cards.update(cfg.card_overrides)
        deck = [name for name, c in self.cards.items() for _ in range(c[3])]
        self.w = dict(pos=(1, 4), hp=cfg.hp, block=0, potions=cfg.potions, hand=[], draw=deck,
                      discard=[], spent=[], conds=[], exhausted=False, acted=False,
                      weapon='sword')
        n = len(cfg.goblins)
        ys = [round(1 + i * (GRID_H - 3) / max(1, n - 1)) for i in range(n)] if n > 1 else [4]
        self.gobs = [dict(id=i + 1, pos=(8, ys[i]), hp=cfg.goblin_hp, weapon=wpn) for i, wpn in enumerate(cfg.goblins)]
        # Deck cut comes after the board exists, because what is worth pruning depends on
        # the fight you expect (see prune_value).
        self._board = self.board()
        for _ in range(cfg.deck_cut):
            if cfg.deck_cut_random:
                deck.pop(rng.randrange(len(deck)))
            else:
                # prune_value rates cards independently, so left alone it will happily strip
                # the last card that can drink a potion and leave the potion dead weight
                pool = deck
                if cfg.potions and sum(1 for n in deck if self.gives_use(n)) <= 1:
                    pool = [n for n in deck if not self.gives_use(n)] or deck
                deck.remove(min(pool, key=self.prune_value))
        rng.shuffle(deck)
        self.fate_w, self.fate_g = FateDeck(rng), FateDeck(rng)
        self.gdeck = []
        self.s = collections.Counter()
        self.plays = collections.Counter()
        self.gplays = collections.Counter()
        self.round = 0

    # --- helpers
    # ------------------------------------------------------------ conditions
    def cond(self, key):
        """The warrior's record for a condition, or None."""
        return next((c for c in self.w['conds'] if c['key'] == key), None)

    def dazed(self):
        """Any condition that costs the secondary (core-rules 7). Dazed and Poisoned both do."""
        return any(CONDITIONS[c['key']].get('blocks_secondary') for c in self.w['conds'])

    def move_mod(self, n):
        """A printed Move as it plays: halved, then reduced, floored at 0 (core-rules 7)."""
        # Grappled blocks the Move icon entirely -- the half cannot be played at all (core-rules 10).
        if any(CONDITIONS[c['key']].get('blocks_move') for c in self.w['conds']):
            return 0
        if any(CONDITIONS[c['key']].get('halves_move') for c in self.w['conds']):
            n //= 2
        worst = max([c['value'] for c in self.w['conds']
                     if CONDITIONS[c['key']].get('reduces_move')] or [0])
        return max(0, n - worst)

    def apply_cond(self, key, duration=1, value=0, by=None):
        """Apply a condition, honouring cancels and the refresh rule (core-rules 7)."""
        cancels = CONDITIONS[key].get('cancels', ())
        hit = [c for c in self.w['conds'] if c['key'] in cancels]
        if hit:
            # Water and fire annihilate: the newer ends the older and does not itself land.
            for c in hit:
                self.w['conds'].remove(c)
            self.s['cancelled'] += 1
            self.log(f"  {key} and {hit[0]['key']} cancel -- neither lands")
            return False
        have = self.cond(key)
        if have:
            have['duration'] = max(have['duration'], duration)
            have['value'] = max(have['value'], value)
        else:
            self.w['conds'].append(dict(key=key, duration=duration, value=value, by=by))
        self.s[f'applied_{key}'] += 1
        return True

    def tick_conds(self, creator_id):
        """Tick everything this creator made. The whole of the core-rules 7 clock."""
        for c in list(self.w['conds']):
            if CONDITIONS[c['key']].get('no_duration') or c['by'] != creator_id:
                continue
            c['duration'] -= 1
            if c['duration'] <= 0:
                self.w['conds'].remove(c)

    def cond_relief(self, n, lift=False):
        """What taking n off the worst condition is worth, in HP.

        Damage prevented is the condition's value times the turns it would still have bitten for;
        a condition that costs the secondary is worth about a Move 1 plus the half itself. Zero when
        nothing is on us, which is what makes a dispel a real decision rather than a free card.
        """
        pool = [c for c in self.w['conds']
                if (CONDITIONS[c['key']].get('liftable') if lift else shakeable(c['key']))]
        if not pool:
            return 0.0
        def relief(c):
            f = CONDITIONS[c['key']]
            turns = 99 if f.get('no_duration') else min(c['duration'], n)
            return c['value'] * turns + (1.5 * turns if f.get('blocks_secondary') else 0)
        return max(relief(c) for c in pool)

    def shake(self, n):
        """Shake Off N: spend duration on the worst thing we can (core-rules 7)."""
        options = [c for c in self.w['conds'] if shakeable(c['key'])]
        if not options:
            return False
        # Worst first: a damaging condition by its value, then anything that costs a half.
        def harm(c):
            f = CONDITIONS[c['key']]
            return (c['value'] if f.get('damage') else 0) + (1 if f.get('blocks_secondary') else 0)
        c = max(options, key=harm)
        c['duration'] -= n
        self.s['shaken'] += 1
        if c['duration'] <= 0:
            self.w['conds'].remove(c)
            self.s['shaken_off'] += 1
        return True

    def lift(self):
        """Lift: remove what has no duration to spend (core-rules 7)."""
        c = next((c for c in self.w['conds'] if CONDITIONS[c['key']].get('liftable')), None)
        if not c:
            return False
        self.w['conds'].remove(c)
        self.s['lifted'] += 1
        return True

    def log(self, msg):
        if self.verbose:
            print(msg)

    def stat_fate(self, card):
        if card in ('MISS', 'CRIT'):
            self.s['fate_' + card.lower()] += 1

    # --- card valuation
    def board(self):
        """The board facts a card's worth depends on. Cached per turn by callers."""
        w, alive = self.w, self.alive()
        if not alive:
            return dict(adj=0, gap=0, ranged=0, hurt=False, n=0)
        return dict(
            adj=sum(1 for g in alive if cheb(w['pos'], g['pos']) == 1),
            gap=min(cheb(w['pos'], g['pos']) for g in alive),
            ranged=sum(1 for g in alive if g['weapon'] == 'bow'),
            hurt=w['hp'] <= self.cfg.hp / 2,
            n=len(alive),
        )

    def gives_use(self, name):
        """Can this card drink a potion, on any half or as a reaction?"""
        primary, secondary, reaction, _ = self.cards[name]
        return reaction == 'use' or any(o[0] == 'use' for o in primary + secondary)

    def prune_value(self, name):
        """What a card is worth across a whole fight, for deck-building decisions.

        One snapshot undervalues situational cards -- a heal looks worthless while you are
        healthy -- so average over three moments: closing, engaged, and pressed.
        """
        ranged = sum(1 for wpn in self.cfg.goblins if wpn == 'bow')
        n = len(self.cfg.goblins)
        boards = (dict(adj=0, gap=5, ranged=ranged, hurt=False, n=n),   # closing
                  dict(adj=1, gap=3, ranged=ranged, hurt=False, n=n),   # engaged
                  dict(adj=2, gap=1, ranged=ranged, hurt=True, n=n))    # pressed
        return sum(self.card_value(name, b) for b in boards) / len(boards)

    def op_value(self, op, b):
        cfg, kind = self.cfg, op[0]
        if kind == 'strike':
            dmg = cfg.strike_base + op[1] + (1 if cfg.strong else 0)
            return dmg if b['adj'] else dmg * 0.25      # can't swing at nothing
        if kind == 'move':
            closes = min(op[1], max(0, b['gap'] - 1))   # squares that actually close the gap
            kiting = 0.8 * op[1] if b['ranged'] else 0  # archers run; you need the legs
            return 1.2 * closes + kiting
        if kind == 'defend':
            return 0.8 * cfg.shield_def * max(1, min(b['adj'] + b['ranged'], 3))
        if kind == 'heal':
            return (2.0 if b['hurt'] else 0.3) * op[1]
        if kind == 'use':
            return 3.0 if (b['hurt'] and self.w['potions']) else 0.4
        if op[0] == 'ready':
            # Worth the swap only when the weapon in hand cannot reach and the other one could.
            if not self.cfg.sling:
                return 0.2
            held, other = WEAPONS[self.w['weapon']], WEAPONS[self.cfg.sling]
            if self.w['weapon'] == self.cfg.sling:
                other = WEAPONS['sword']
            alive = [g for g in self.gobs if g['hp'] > 0]
            if not alive:
                return 0.2
            near = min(cheb(self.w['pos'], g['pos']) for g in alive)
            reach_now = near <= held['rng']
            reach_then = near <= other['rng']
            if reach_then and not reach_now:
                return 3.0            # you cannot hit at all, and with the other weapon you can
            if reach_now and not reach_then:
                return -2.0           # do not put the useful one away
            return 0.2
        if op[0] == 'shake':
            # Worth whatever it takes off: the damage a tick would have done, plus the half a
            # Dazed costs. Zero when nothing is on us, which is what makes it a real decision.
            bite = sum(c['value'] for c in self.w['conds'] if CONDITIONS[c['key']].get('damage'))
            half = 1.5 if self.dazed() else 0
            return min(op[1], 1) * (bite + half) * 1.0
        return 0.2                                       # ready, taunt: inert in a solo test

    REACTION_WORTH = {'block': 1.2, 'parry': 0.9, 'use': 0.5}

    def card_value(self, name, b):
        """How much we want this card in hand, on this board."""
        primary, secondary, reaction, _ = self.cards[name]
        v = max(sum(self.op_value(o, b) for o in primary) if primary else 0,
                sum(self.op_value(o, b) for o in secondary) if secondary else 0)
        if reaction == 'parry':
            v += 0.9 if b['adj'] else 0.2
        elif reaction == 'use':
            v += 0.5 if self.w['potions'] else 0.1
        else:
            v += self.REACTION_WORTH.get(reaction, 0.15)
        return v

    def keep(self, name):
        """Card value against the cached board; refreshed each turn and on each hit."""
        return self.card_value(name, self._board)

    def alive(self):
        return [g for g in self.gobs if g['hp'] > 0]

    # --- round structure
    def refill(self):
        w = self.w
        while len(w['hand']) < self.cfg.hand_size and w['draw']:
            w['hand'].append(w['draw'].pop())
        if not w['draw'] and 'deck_empty_round' not in self.s:
            self.s['deck_empty_round'] = self.round
        w['exhausted'] = len(w['hand']) < 2 and not w['draw']

    def gob(self, gid):
        for g in self.gobs:
            if g['id'] == gid:
                return g
        return None

    def setup_initiative(self):
        """Individual initiative, drawn once at the start of combat (core-rules 3).

        Every combatant draws one fate card, highest first; everyone still tied draws
        again, and only they draw. Nested draws become a sort key, so a redraw orders
        the tied pair without moving them past anyone else.
        """
        everyone = ['w'] + [g['id'] for g in self.gobs]
        if self.cfg.first == 'players':
            self.order = everyone[:]
            return
        if self.cfg.first == 'goblins':
            self.order = everyone[1:] + ['w']
            return
        keys = {c: [] for c in everyone}
        tied = [everyone[:]]
        while tied:
            nxt = []
            for group in tied:
                for c in group:
                    deck = self.fate_w if c == 'w' else self.fate_g
                    keys[c].append(rank(deck.draw(0)))
                buckets = collections.defaultdict(list)
                for c in group:
                    buckets[keys[c][-1]].append(c)
                nxt += [cs for cs in buckets.values() if len(cs) > 1]
            tied = nxt
        self.order = sorted(everyone, key=lambda c: keys[c], reverse=True)

    def draw_intent(self):
        """One card per NPC type per round, face down (core-rules 3, Intent)."""
        if not self.gdeck:
            self.gdeck = list(GOBLIN_CARDS)
            self.rng.shuffle(self.gdeck)
        card = self.gdeck.pop()
        self.gplays[card] += 1
        return card

    def run(self):
        cfg = self.cfg
        self.setup_initiative()
        self.log(f"Initiative: {self.order}")
        for rnd in range(1, cfg.max_rounds + 1):
            self.round = rnd
            self.refill()
            self.w['acted'] = False
            intent = self.draw_intent()
            self.log(f"--- Round {rnd}: HP {self.w['hp']}, hand {self.w['hand']}, draw {len(self.w['draw'])}, "
                     f"goblins {[(g['id'], g['hp']) for g in self.alive()]}")
            self.log(f"  Goblin intent: {intent}")
            for c in self.order:
                if c == 'w':
                    self.warrior_turn()
                else:
                    g = self.gob(c)
                    if g['hp'] > 0:
                        self.goblin_act(g, intent)
                if self.w['hp'] <= 0:
                    return self.result(False)
                if not self.alive():
                    return self.result(True)
        return self.result(None)

    def result(self, win):
        self.s['rounds'] = self.round
        self.s['hp_left'] = max(0, self.w['hp'])
        self.s['goblins_left'] = len(self.alive())
        return win

    # --- warrior
    def options(self):
        w, hand = self.w, self.w['hand']
        single = self.dazed() or len(hand) < 2
        opts = []
        if single:
            for i, c in enumerate(hand):
                opts.append(([(i, 'P')], self.cards[c][0]))
        else:
            for i, a in enumerate(hand):
                for j, b in enumerate(hand):
                    if i == j:
                        continue
                    pa, sb = self.cards[a][0], self.cards[b][1]
                    opts.append(([(i, 'P'), (j, 'S')], pa + sb))
                    opts.append(([(i, 'P'), (j, 'S')], sb + pa))
        return opts

    def score(self, sim, played_idx):
        cfg, w = self.cfg, self.w
        val = sim.dmg + 4 * sim.killp
        val += sim.healed * (1.2 if w['hp'] <= cfg.hp / 2 else 0.3)
        val -= 2.5 * (w['potions'] - sim.potions)   # a potion is worth keeping
        alive = sim.alive()
        if alive:
            near = min(cheb(sim.wpos, g[0]) for g in alive)
            val -= 0.7 * near
            if near <= 4:
                reach = sum(1 for g in alive if cheb(sim.wpos, g[0]) <= 3 or g[2]['weapon'] == 'bow')
                hits = max(1, min(reach, 3)) if cfg.persistent_block else 1
                val += 0.5 * sim.block * hits
        melee_foes = any(g['weapon'] == 'spear' for g in self.alive())
        for i, c in enumerate(w['hand']):
            if i in played_idx:
                continue
            r = self.cards[c][2]
            val += {'block': 1.0, 'parry': 0.8 if melee_foes else 0.2,
                    'use': 0.4 if w['potions'] else 0.2}.get(r, 0.2)
            val += 0.15 * self.keep(c)
        return val

    def catch_breath(self):
        """Recover BREATH_RECOVERY cards at random, all or nothing (core-rules 8).

        Two is the Exhausted threshold, so a breath buys exactly one turn that is not Exhausted.
        Nothing is Spent by breathing: the discard is a cycle, and what leaves the deck is what the
        player chose to spend. `spent` still fills from Overloaded, and will fill from cards printed
        Spent once the sim plays any.
        """
        w = self.w
        take = BREATH_RECOVERY
        if len(w['discard']) < take:
            return False
        self.rng.shuffle(w['discard'])
        for _ in range(take):
            w['draw'].append(w['discard'].pop())
        self.rng.shuffle(w['draw'])
        self.s['catch_breath'] += 1
        self.log(f"  Warrior catches breath (recovers {take}, "
                 f"{len(w['discard'])} still in discard), draw pile now {len(w['draw'])}")
        return True

    def warrior_turn(self):
        w, cfg = self.w, self.cfg
        self._board = self.board()
        w['block'] = 0
        w['acted'] = True
        # A condition whose creator has left combat ticks on the victim's turn instead, so it
        # still costs exactly one of their turns (core-rules 7).
        for c in list(w['conds']):
            if CONDITIONS[c['key']].get('no_duration'):
                continue
            creator = self.gob(c['by'])
            if creator is None or creator['hp'] <= 0:
                c['duration'] -= 1
                if c['duration'] <= 0:
                    w['conds'].remove(c)
        if self.dazed():
            self.s['dazed_turns'] += 1
        # Burning and Poisoned bite at the start of your turn, past armor and Block, and they add.
        bite = sum(c['value'] for c in w['conds'] if CONDITIONS[c['key']].get('damage'))
        if bite:
            w['hp'] = max(0, w['hp'] - bite)
            self.s['tick_damage'] += bite
            self.log(f"  conditions bite for {bite} -> {w['hp']} HP")
            if w['hp'] <= 0:
                return
        if w['exhausted']:
            self.s['exhausted_turns'] += 1
        if (len(w['discard']) >= BREATH_RECOVERY and not w['draw']
                and (w['exhausted'] or len(w['hand']) <= cfg.cb_threshold)):
            if self.catch_breath():
                return
        if not w['hand']:
            return
        best, best_val = None, -1e9
        for played, ops in self.options():
            sim = Sim(self)
            sim.run(ops, real=False)
            v = self.score(sim, {i for i, _ in played})
            if v > best_val:
                best, best_val = (played, ops), v
        played, ops = best
        names = [(w['hand'][i], h) for i, h in played]
        self.log(f"  Warrior plays " + ', '.join(f"{n} ({'primary' if h == 'P' else 'secondary'})" for n, h in names))
        for n, h in names:
            self.plays[f'{n}|{h}'] += 1
        sim = Sim(self)
        sim.run(ops, real=True)
        sim.commit()
        for i in sorted((i for i, _ in played), reverse=True):
            w['discard'].append(w['hand'].pop(i))

    def take_hit(self, raw, melee, src):
        w, cfg = self.w, self.cfg
        self._board = self.board()
        d = max(0, raw - cfg.armor)
        absorbed = min(w['block'], d)
        if not cfg.persistent_block:
            w['block'] -= absorbed          # old rule: one hit used the whole block up
        d -= absorbed
        self.s['prevented_armor'] += min(raw, cfg.armor)
        self.s['prevented_shieldup'] += absorbed
        can_react = not w['exhausted'] and w['hand']
        reserve = 0 if w['acted'] else 2
        # emergency potion via a Use reaction
        if can_react and w['hp'] - d <= 2 and w['potions'] and 'Quick Hands' in w['hand']:
            w['hand'].remove('Quick Hands')
            w['discard'].append('Quick Hands')
            w['potions'] -= 1
            card = self.fate_w.draw(0)
            gain = min(fate_apply(4, card), cfg.hp - w['hp'])
            w['hp'] += gain
            self.s['react_use'] += 1
            self.log(f"  Warrior reacts: drinks potion +{gain}")
        if d > 0 and w['hand'] and not w['exhausted']:
            lethal = w['hp'] - d <= 0
            spare = len(w['hand']) - (0 if lethal else reserve)
            if spare > 0:
                def red(c):
                    r = self.cards[c][2]
                    return 3 if r == 'block' else 2 if (r == 'parry' and melee) else 1
                card = max(w['hand'], key=lambda c: (min(red(c), d), -self.keep(c)))
                cut = min(red(card), d)
                if cut >= 2 or lethal or (w['hp'] - d <= 3):
                    kind = {3: 'block', 2: 'parry', 1: 'brace'}[red(card)]
                    w['hand'].remove(card)
                    w['discard'].append(card)
                    d -= cut
                    self.s['react_' + kind] += 1
                    self.s['prevented_react'] += cut
                    self.log(f"  Warrior reacts with {card} ({kind}) -> prevents {cut}")
        w['hp'] -= d
        self.s['dmg_taken'] += d
        self.log(f"  Goblin {src} hits for {raw} -> warrior takes {d}, HP {w['hp']}")
        if cfg.heavy_hits and d >= 5 and w['hand']:
            lost = min(w['hand'], key=self.keep)
            w['hand'].remove(lost)
            w['discard'].append(lost)
            self.s['heavy_hit_discards'] += 1

    # --- goblins
    def routs(self, g):
        """Has this goblin's nerve broken?"""
        if self.cfg.cowardly_mode == 'group':
            return 2 * len(self.alive()) <= len(self.gobs)
        return g['hp'] < self.cfg.goblin_hp / 2

    def goblin_act(self, g, card):
        """One goblin takes its turn, on its type's intent card for this round."""
        # a condition ticks at the start of its creator's turn
        self.tick_conds(g['id'])
        wp = lambda: self.w['pos']
        # routing is not the same as playing Cower: a Cower goblin retreats and comes back,
        # a routed one leaves the fight for good
        routing = self.cfg.cowardly and self.routs(g)
        ops = [('away', 3)] if routing else GOBLIN_CARDS[card]
        for op in ops:
            if self.w['hp'] <= 0:
                return
            blocked = {o['pos'] for o in self.alive() if o is not g} | {wp()}
            kind = op[0]
            if kind in ('move', 'away'):
                dist = cheb(g['pos'], wp())
                flee = kind == 'away' or (g['weapon'] == 'bow' and dist == 1)
                if g['weapon'] == 'bow' and not flee and dist <= 6:
                    continue
                for _ in range(op[1]):
                    if not flee and cheb(g['pos'], wp()) <= 1:
                        break
                    nxt = step_away(g['pos'], wp(), blocked) if flee else step_toward(g['pos'], wp(), blocked)
                    if nxt is None:
                        break
                    g['pos'] = nxt
                if routing:
                    x, y = g['pos']
                    at_edge = x in (0, GRID_W - 1) or y in (0, GRID_H - 1)
                    # it has to actually outrun the hero, not just stand on a map edge
                    if at_edge and cheb(g['pos'], wp()) >= ESCAPE_DIST:
                        g['hp'] = 0
                        self.s['goblins_fled'] += 1
                        self.log(f"  Goblin {g['id']} flees the battle")
            elif kind in ('strike', 'rock'):
                dist = cheb(g['pos'], wp())
                others = {o['pos'] for o in self.alive() if o is not g}
                if kind == 'rock':
                    rng_, value, ranged = 4, 1, True
                elif g['weapon'] == 'bow':
                    rng_, value, ranged = 6, self.cfg.goblin_dmg, True
                else:
                    rng_, value, ranged = 1, self.cfg.goblin_dmg, False
                if dist > rng_:
                    continue
                if kind == 'strike' and op[1] == 'swarm' and any(cheb(o, wp()) == 1 for o in others):
                    value += 1
                dis = ranged and (dist == 1 or has_cover(g['pos'], wp(), others))
                adv = self.cfg.pack_tactics and not ranged and any(cheb(o, wp()) == 1 for o in others)
                # Prone: melee Strikes against you have advantage (core-rules 7). Two sources of
                # advantage still give one, which the draw mode already handles.
                if not ranged and any(CONDITIONS[c['key']].get('enemy_melee_advantage')
                                      for c in self.w['conds']):
                    adv = True
                if dis:
                    self.s['goblin_disadv'] += 1
                if adv:
                    self.s['goblin_adv'] += 1
                fc = self.fate_g.draw(int(adv) - int(dis))
                raw = fate_apply(value, fc)
                self.take_hit(raw, not ranged, g['id'])
                if kind == 'strike' and op[2] == 'daze' and fc != 'MISS':
                    self.apply_cond(self.cfg.goblin_condition,
                                    self.cfg.goblin_cond_dur,
                                    self.cfg.goblin_cond_value, g['id'])
                    self.s['daze_applied'] += 1


# ---------------------------------------------------------------- runner
def run_scenario(cfg, fights, seed):
    rng = random.Random(seed)
    wins, losses, timeouts = 0, 0, 0
    agg = collections.defaultdict(list)
    plays, gplays = collections.Counter(), collections.Counter()
    for _ in range(fights):
        g = Game(cfg, rng)
        r = g.run()
        wins += r is True
        losses += r is False
        timeouts += r is None
        for k in ('rounds', 'hp_left', 'catch_breath', 'exhausted_turns', 'dazed_turns', 'daze_applied',
              'tick_damage', 'shaken', 'shaken_off', 'lifted', 'cancelled',
                  'react_block', 'react_parry', 'react_brace', 'react_use', 'prevented_react',
                  'prevented_armor', 'prevented_shieldup', 'dmg_taken', 'heavy_hit_discards',
                  'goblin_disadv', 'goblin_adv', 'goblins_fled', 'fate_miss', 'fate_crit'):
            agg[k].append(g.s[k])
        if 'deck_empty_round' in g.s:
            agg['deck_empty_round'].append(g.s['deck_empty_round'])
        if r:
            agg['hp_left_win'].append(g.s['hp_left'])
        plays.update(g.plays)
        gplays.update(g.gplays)
    return dict(cfg=cfg, wins=wins, losses=losses, timeouts=timeouts, fights=fights,
                agg=agg, plays=plays, gplays=gplays)


def mean(xs):
    return statistics.fmean(xs) if xs else float('nan')


SCENARIOS = [
    # the rules as written in draft 0.2: Goblin Spear 3, Pack Tactics + Cowardly
    Config(name='A  baseline: 3 goblin spears'),
    Config(name='B  3 spears, goblins go first', first='goblins'),
    Config(name='B2 3 spears, initiative drawn each fight', first='random'),
    Config(name='C  4 spears (moderate)', goblins=('spear',) * 4),
    Config(name='D  4 goblins, 2 spear + 2 bow (hard)', goblins=('spear', 'spear', 'bow', 'bow')),
    Config(name='E  5 spears', goblins=('spear',) * 5),
    # what each piece of the change is worth
    Config(name='F  draft 0.1 damage: spear 2', goblin_dmg=2),
    Config(name='G  draft 0.1 damage, 4 goblins', goblin_dmg=2, goblins=('spear',) * 4),
    Config(name='H  draft 0.1 block: one-shot Shield Up', persistent_block=False),
    Config(name='I  draft 0.1 block, 4 goblins', persistent_block=False, goblins=('spear',) * 4),
    Config(name='J  draft 0.1 block, 2 spear + 2 bow', persistent_block=False,
           goblins=('spear', 'spear', 'bow', 'bow')),
    # tactics isolated
    Config(name='K  no tactics, 4 goblins', pack_tactics=False, cowardly=False, goblins=('spear',) * 4),
    Config(name='L  pack only, 4 goblins', cowardly=False, goblins=('spear',) * 4),
    # hero-side knobs
    Config(name='M  no Strong feature', strong=False),
    Config(name='N  no double strike (Weapon Swap sec = Move 1)', double_strike=False),
    Config(name='O  warrior armor 0', armor=0),
    Config(name='P  warrior armor 2', armor=2),
    Config(name='Q  heavy-hits rule on, 4 goblins', heavy_hits=True, goblins=('spear',) * 4),
    # exhaustion
    Config(name='R  12-card deck, 4 goblins', deck_cut=4, goblins=('spear',) * 4),
    Config(name='S  12-card deck, 2 spear + 2 bow', deck_cut=4,
           goblins=('spear', 'spear', 'bow', 'bow')),
    Config(name='T  catch breath only when exhausted', cb_threshold=1, goblins=('spear',) * 4),
    Config(name='U  catch breath early (hand <= 4)', cb_threshold=4, goblins=('spear',) * 4),
    # alternative Cowardly: the group breaks instead of each goblin running when hurt
    Config(name='V  group morale, 4 spears', cowardly_mode='group', goblins=('spear',) * 4),
    Config(name='W  group morale, 2 spear + 2 bow', cowardly_mode='group',
           goblins=('spear', 'spear', 'bow', 'bow')),
    Config(name='X  group morale, 5 spears', cowardly_mode='group', goblins=('spear',) * 5),
    # cost of Overloaded: 2 random cards Spent for the whole fight (core-rules 4, Carrying)
    Config(name='Y  overloaded, 4 spears', deck_cut=2, deck_cut_random=True,
           goblins=('spear',) * 4),
    Config(name='Z  overloaded, 2 spear + 2 bow', deck_cut=2, deck_cut_random=True,
           goblins=('spear', 'spear', 'bow', 'bow')),
]



def report(res):
    a, f = res['agg'], res['fights']
    print(f"\n## {res['cfg'].name}")
    print(f"win {100 * res['wins'] / f:5.1f}%  loss {100 * res['losses'] / f:5.1f}%  timeout {100 * res['timeouts'] / f:4.1f}%"
          f"   rounds {mean(a['rounds']):.1f}   HP left on win {mean(a['hp_left_win']):.1f}")
    print(f"deck runs dry in round {mean(a['deck_empty_round']):.1f} (in {100 * len(a['deck_empty_round']) / f:.0f}% of fights)"
          f"   catch breath/fight {mean(a['catch_breath']):.2f}   exhausted turns {mean(a['exhausted_turns']):.2f}")
    print(f"damage taken {mean(a['dmg_taken']):.1f}   prevented: armor {mean(a['prevented_armor']):.1f},"
          f" shield-up {mean(a['prevented_shieldup']):.1f}, reactions {mean(a['prevented_react']):.1f}")
    print(f"reactions/fight: block {mean(a['react_block']):.2f} parry {mean(a['react_parry']):.2f}"
          f" brace {mean(a['react_brace']):.2f} potion {mean(a['react_use']):.2f}")
    print(f"daze applied {mean(a['daze_applied']):.2f}, dazed turns {mean(a['dazed_turns']):.2f}"
          f"   goblin attacks at adv/disadv {mean(a['goblin_adv']):.2f}/{mean(a['goblin_disadv']):.2f}"
          + (f"   goblins fled {mean(a['goblins_fled']):.2f}" if res['cfg'].cowardly else '')
          + (f"   heavy-hit discards {mean(a['heavy_hit_discards']):.2f}" if res['cfg'].heavy_hits else ''))


def card_report(res):
    plays, f = res['plays'], res['fights']
    print(f"\n### Card use per fight ({res['cfg'].name})")
    print(f"{'card':<13}{'as primary':>12}{'as secondary':>14}")
    for name in WARRIOR_CARDS:
        print(f"{name:<13}{plays[name + '|P'] / f:>12.2f}{plays[name + '|S'] / f:>14.2f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fights', type=int, default=3000)
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--log', type=int, default=0, help='print N narrated fights and exit')
    ap.add_argument('--only', default='', help='scenario letters to run, e.g. MNO')
    args = ap.parse_args()
    if args.log:
        rng = random.Random(args.seed)
        for i in range(args.log):
            print(f"\n================ Fight {i + 1} ================")
            r = Game(SCENARIOS[0], rng, verbose=True).run()
            print('RESULT:', {True: 'warrior wins', False: 'warrior down', None: 'timeout'}[r])
        return
    chosen = [c for c in SCENARIOS if not args.only or c.name[0] in args.only]
    results = [run_scenario(cfg, args.fights, args.seed) for cfg in chosen]
    for r in results:
        report(r)
    card_report(results[0])


if __name__ == '__main__':
    main()
