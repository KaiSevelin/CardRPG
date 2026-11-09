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
    def __init__(self, rng, hexes=0):
        self.rng = rng
        # A Hex is a permanent MISS shuffled in, and permanent means it survives the reshuffle --
        # a Miss reshuffles the deck when it is drawn (core-rules 6), so it comes straight back.
        self.hexes = hexes
        self.reshuffle()

    def reshuffle(self):
        self.cards = FATE[:] + ['MISS'] * self.hexes
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
#
# A strike op is ('strike', mod) or ('strike', mod, ignores) -- the third element is armour the
# STEP goes through, which is a different thing from armour the weapon goes through.
#
# **[FOUND IN CODE 2026-11-08] Heavy Swing has printed `ignores: 2` since the starter deck was
# written, the engine reads it off the step, and this file only ever read `ignores` off the WEAPON
# profile.** So the Warrior's one answer to an armoured enemy was switched off in every
# measurement this project has made -- including the ones against the `guard` and `plated` foes,
# which exist for no other purpose than to be armoured. The same shape as the DEAD set and as
# `bonus.approach`: a field the engine reads and the simulator does not, so the numbers are of a
# slightly different game.
# A card's worth to the AI is NOT stored here -- it is computed from its ops against the
# current board (see Game.card_value). A static table cannot express that Advance is junk
# against three adjacent spears and essential against two kiting archers.
WARRIOR_CARDS = {
    'Strike':      ([('strike', 0)], [('move', 1)], 'parry', 3),
    'Heavy Swing': ([('strike', 1, 2)], [('move', 1)], None, 2),
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
    # One round where the type goes for the buckles rather than the breastplate. The third element
    # of a strike op is armour the STEP ignores, the same as on the hero's side.
    'Find the Joint': [('strike', 0, None)],
    # Strike, and the target is Exposed 2 for a turn: the setup half of the two-round play.
    'Prise It Open': [('strike', 0, 'expose')],
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
    #                strike  range  heavy   kg  reload  ignores N armor
    'sword':    dict(strike=3, rng=1,  heavy=True,  kg=2),
    'bow':      dict(strike=2, rng=6,  heavy=False, kg=1),   # Shortbow
    # The rest of rules/equipment.md 3 and 4. `reload` is the claim worth measuring: a crossbow
    # cannot fire again until a Ready has gone into it, so it spends half of every other turn
    # loading, and `ignores` is what it buys with that half.
    'longbow':  dict(strike=3, rng=10, heavy=True,  kg=2),
    'crossbow': dict(strike=4, rng=8,  heavy=False, kg=3, reload=True, ignores=1),
    'heavy_crossbow': dict(strike=5, rng=10, heavy=True, kg=5, reload=True, ignores=1),
    'arquebus': dict(strike=5, rng=8,  heavy=True,  kg=4, reload=True, ignores=2),
    'musket':   dict(strike=6, rng=12, heavy=True,  kg=5, reload=True, ignores=2),
    'pistol':   dict(strike=3, rng=4,  heavy=False, kg=1, reload=True, ignores=2),
}


# ---------------------------------------------------------------- armour
# rules/equipment.md 1.2: the ladder runs 1 to 4 and buys the difference with KILOGRAMS rather
# than coin, and the top two rungs are Heavy Armor, which blocks the Sidestep reaction
# (core-rules 10). Both halves of that price have to be in the same measurement or the ladder
# reads as four rungs of free upgrade.
ARMOUR = {
    0: dict(kg=0,  heavy=False),                    # nothing
    1: dict(kg=5,  heavy=False),                    # Leather
    2: dict(kg=9,  heavy=False),                    # Mail Shirt
    3: dict(kg=12, heavy=True),                     # Brigandine
    4: dict(kg=20, heavy=True),                     # Plate
}

# core-rules 4: the limit is 40 kg, over it you are Burdened (Slowed), over half again
# Overloaded (Burdened, and 2 random cards are Spent).
CARRY_LIMIT = 40
# The cards in your hand that cannot be played at all (core-rules 8). 'Wound' was compared by
# name in six places in this file, which is the same defect the engine had on the JavaScript side
# and was fixed there on 2026-11-08: a second dead card added to one of the six and not the others
# would have been playable in a simulator and not in the game, and the numbers would still have
# looked fine. A set, so a third one is a word here.
DEAD = {'Wound', 'Compulsion'}

# core-rules 8: a single hit of this much past armor leaves a Wound.
WOUND_AT = 5


# ---------------------------------------------------------------- foes
# Enemy profiles. `spear` and `bow` are the goblins every published number was measured against;
# the rest exist for one question equipment.md 1.2 asks and nothing had ever answered -- armour is
# subtracted from EVERY hit, so is a point of it worth the same against four enemies striking for
# 3 as against one striking for 12? These hold the group's damage per round at 12 and vary only
# how it is divided, which is the cliff-edge claim itself rather than a monster I invented.
FOES = {
    'spear':  dict(rng=1, ranged=False),
    'bow':    dict(rng=6, ranged=True),
    'brute':  dict(rng=1, ranged=False, dmg=6,  hp=10),   # two of these: 12 a round, 20 HP
    'ogre':   dict(rng=1, ranged=False, dmg=12, hp=20),   # one of these: 12 a round, 20 HP
    # Armoured infantry, for the other claim worth testing (equipment.md 3): "against five goblins
    # the bow wins; against one armoured knight the crossbow does." These are a goblin spear and
    # nothing else -- same damage, same Health, same tactics -- with Brigandine or Plate on, so a
    # weapon comparison across them changes one number and not the encounter.
    'guard':  dict(rng=1, ranged=False, armor=3),
    'plated': dict(rng=1, ranged=False, armor=4),
}

def foe(name):
    return FOES[name]


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
    # Exposed: armour counts **0** while it lasts (core-rules 7). The condition route to defeating
    # armour, against the flag route -- visible, shakeable, and paid for over two turns, where a
    # flag on a step is none of those.
    #
    # Zeroing is what makes it proportional: worth 4 against Plate and 1 against Leather, where a
    # flat -2 was worth most to whoever had least to lose. It is also the only shape under which
    # Exposed beats doubling a Critical, since doubling adds the printed damage and Exposed adds
    # the armour -- so Exposed wins exactly when armour > printed damage.
    'exposed':  dict(zeroes_armour=True),
    'prone':    dict(enemy_melee_advantage=True, reduces_move=True),
    'grappled': dict(blocks_move=True),
    # Off Balance: an opening, AND **Block counts 0**. One entry, because this dict had two
    # 'offBalance' keys for a while and Python keeps the last -- so the Block half was silently
    # dropped and every figure measured with it understated the critical deck by two cards in ten.
    'offBalance': dict(opening=True, zeroes_block=True),
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
    # Fear cards shuffled into the deck at the start, which is how a fight against something
    # with `terrify` begins (core-rules 8). Each one, when drawn, moves the hero one square
    # directly away from the nearest goblin and then LEAVES the game -- a replacement is drawn, so
    # the hand never comes up short. What it costs is the square, which is the only intruder priced
    # that way and the reason it needs its own model rather than a deck_cut.
    fear: int = 0
    # Compulsion: dead cards that ALSO forbid Catch Breath while one is in hand (core-rules 8).
    # The interesting one, because it is the card that makes every other action-deck intruder cost
    # what it is supposed to: dilution cannot bite until the draw pile empties, and this is what
    # stops the hero emptying it on their own terms.
    compulsion: int = 0
    # Confusion in the GOBLINS' deck: drawn as that type's intent, it means the type has no plan
    # and each may only Move this round (core-rules 3 draws intent one card per type).
    confusion: int = 0
    # Hex: extra permanent MISS cards in the hero's fate deck. Not a new card -- a Miss already is
    # one, and Shadow Magic buys the same mechanism willingly, one permanent Wild per formula.
    hex: int = 0
    # --- permanent injuries (core-rules 8). Four of the fourteen are measurable here. ---
    # Bad Leg: every Move value you play is -1. A slate, not a card, so it never dilutes anything
    # -- which makes it the clean test of what tempo alone is worth.
    bad_leg: int = 0
    # --- the proposed Critical, for testing "nothing reaches you at armour 4" ---
    # A Critical that finds the gap: it still doubles, and the doubled figure ignores armour.
    # Doubling alone already scales badly against a high rung -- at armour 4 a strike-3 crit does
    # 6-4=2 -- so the question is whether ignoring armour puts the threat back without making a
    # crit against an unarmoured hero worse than it is now (5 today, 6 under this).
    crit_pierces: bool = False
    # And whether Block answers it. A crit nobody can Block makes the 5% card un-answerable, which
    # is a bigger change than the armour half: Block is the player's own reaction, not a coat.
    crit_unblockable: bool = False
    # Keeping the Critical as the damage-doubler and giving the armour-ignoring job to the ONE +2
    # instead. Same frequency -- one card in twenty -- and it needs no new card, which matters
    # because the fate deck is a universal resolver: it is drawn for checks, saving throws, heals,
    # initiative and the injury draw, and every face it has means something on every one of those.
    # "Ignores armour" does not, so a face that said only that would be a blank on most draws.
    plus2_pierces: bool = False
    # **A Critical always gets at least one point through** (core-rules 5). On by default, because
    # it is the rule now rather than a proposal: 15 of the roster's 112 creatures could not hurt a
    # character in Plate at all without it. False re-runs the old arithmetic.
    crit_floor: bool = True
    # **An intent card in the goblins' deck that ignores N armour** (core-rules 3, 5).
    #
    # The point of the dial is the deck, not the card: an intent deck is 7 to 14 cards and intent
    # is drawn once per TYPE, so when a piercing card comes up EVERY goblin acts on it. One card
    # in nine fires about once a fight, and five spears all going through two points of armour in
    # the same round is a different number from one of them doing it.
    pierce_intent: int = 0
    # The condition route: an intent that Exposes rather than piercing. A boolean now that Exposed
    # zeroes armour -- there is no depth left to sweep, only whether the card is in the deck.
    expose_intent: bool = False
    # **The critical deck**: a Critical draws what it did instead of simply doubling (core-rules 5).
    #
    # Ten cards -- 4 double, 2 Exposed, 2 Off Balance, 1 Halted, 1 draw-two-others -- so doubling
    # falls from certain to 40% and the other six buy something a doubled number could not. Both
    # sides draw from it, so this dial moves the goblins as well as the hero.
    crit_deck: bool = False
    # Whether a condition face doubles the damage **as well as** applying its effect, rather than
    # instead of it. The deck as written is either/or; this is the one dial on it.
    crit_deck_rides: bool = False
    # Shattered Nerves: no reactions in round 1. The engine knows rounds rather than
    # per-character firsts, and so does this.
    shattered_nerves: bool = False
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
    # What the warrior starts with in hand. 'sword' is every published number.
    weapon: str = 'sword'
    # Everything carried that is not armour, weapons or the shield: pack, rope, loot. The kit a
    # starter Warrior carries is already in the armour and weapon kilograms, so 0 is the baseline
    # and this is the dial that makes Plate's weight bite (core-rules 4).
    extra_kg: int = 0
    shield_kg: int = 3            # Wooden Shield
    # Sidestep had a name on Advance and no behaviour anywhere, so every number published before
    # 2026-10-30 was measured with one of the starter deck's reactions inert. False restores that,
    # which is how the old figures are reproduced and how the reaction is priced.
    # core-rules 8's two Wound events. Nothing in the engine issued a Wound until 2026-11-07, so
    # every figure this file published before then was measured in a game where one never arrived --
    # the same shape as `sidestep`, and False reproduces those numbers the same way.
    #
    # It is the rule, so it is the default. What it costs, measured over 6000 fights a cell against
    # the published encounters: -0.0 against three spears, -1.3 against four, -1.2 against five,
    # -0.2 against two spears and two bows. A mean of -0.7, which is inside the noise on a single
    # encounter and not worth re-measuring the published figures over.
    #
    # The reason it is that small is the threshold: a Goblin Spear is 3 against armour 1, so only a
    # CRITICAL -- which doubles -- reaches five past armour. 0.2 Wounds a fight.
    wounds: bool = True
    sidestep: bool = True
    # Which reading of core-rules 11 to play. The sentence is "an enemy that ENDS ITS MOVEMENT next
    # to you hands you a Sidestep", introduced by "leaving is free, arriving is answered" -- and the
    # letter and the intent are not the same rule:
    #
    #   'arrival': it must have taken a step AND have been non-adjacent before it. What "arriving"
    #              plainly means, and the stricter reading.
    #   'any':     it ended a move adjacent, even if it was adjacent already and only shuffled.
    #              What the sentence literally says -- and it hands the defender a free reposition
    #              almost every turn, because a goblin in your face "ends its movement" there.
    #
    # The two are worth measuring against each other, because a rule whose wording is load-bearing
    # should know what the wording is worth.
    sidestep_mode: str = 'arrival'
    # None derives Heavy Armor from the rung, which is the rule. Setting it False keeps armor 4 and
    # hands the reaction back, which is the only way to charge Plate's two prices separately.
    heavy_armor: object = None
    goblin_condition: str = 'dazed'
    goblin_cond_value: int = 0     # intensity, for a `valued` condition
    goblin_cond_dur: int = 1
    # Swap one copy of Strike for a card whose secondary is Shake Off 1, to price a dispel.
    shake_card: bool = False
    card_overrides: dict = field(default_factory=dict)
    # Stamina: how many cards you may DRAW in a fight, as a stat rather than as your deck size.
    #
    # Today the deck IS the stamina, which has a defect: acquiring any card makes you last longer
    # and pruning a bad one makes you last less, so a card's contents and a character's endurance
    # are the same number. Stamina separates them -- the collection decides what you can do, the
    # stat decides how long you can keep doing it.
    #
    # 0 keeps the old rule, which is how every figure published before this is reproduced.
    # With it on: a fight starts with min(stamina, collection) random cards in the deck, the discard
    # tops the deck back up while the budget lasts, and you are Exhausted when the budget is gone.
    stamina: int = 0
    # The whole action deck, as {name: (primary, secondary, reaction, copies)}. None is the starter
    # Warrior's sixteen, which is every published figure. careers_sim.py sets it to what a Way
    # graph career actually holds, so the deck under test is content rather than a scenario knob.
    deck: object = None
    # Cards printed **Spent** (way-cards 1.3), as {name: halves} where halves is 'P', 'S' or 'PS'.
    # Playing that half puts the card out of the fight instead of into the discard, so a breath
    # never brings it back. Two Signatures are printed this way -- Assassin's *One Opening* and
    # Berserker's *Red Mist* -- and without this they were the only cards in the game whose price
    # was free. The AI still plays them as soon as they are worth a half, which if anything spends
    # them sooner than a player would.
    spent_cards: object = None
    # ---- Signatures that are FEATURES rather than cards, for careers_sim.py.
    #
    # Three of the six are expressible here; the other three are not, and saying which is which is
    # the point of listing them:
    #   *The Wall*            (Guardian)  -> wall
    #   *Nothing Gets Through* (Ironclad)  -> armor_doubles_overloaded
    #   *Loaded Before the Bell* (Musketeer) -> first_shot_bonus
    #   *The Opening*         -- advantage against anyone carrying an opening. Nothing sets an
    #                            opening in a SOLO fight, so its true value here is zero and
    #                            modelling it would be inventing an ally.
    #   *Cleave to the Bone*  -- moves the Wound threshold, and Wounds are not in this simulator.
    #   *One Trick*           -- prepare from any school; there is no spell engine.
    wall: bool = False                      # your Blocks stack: the exception to highest-wins
    armor_doubles_overloaded: bool = False  # armour counts double while Overloaded
    first_shot_bonus: int = 0               # the first shot of a fight is +N
    carry_limit: int = CARRY_LIMIT          # raised by a career's carry grants


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
            self.loaded = self.game.w['loaded']
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
                # An unloaded crossbow is a stick: the Strike is spent and nothing happens.
                if prof.get('reload') and not self.loaded:
                    continue
                reach = [g for g in self.alive() if cheb(self.wpos, g[0]) <= prof['rng']]
                if not reach:
                    continue
                adj = reach
                # Strong is +1 with Heavy items only (starter-cards.md Features).
                value = prof['strike'] + op[1] + (1 if cfg.strong and prof['heavy'] else 0)
                # *Loaded Before the Bell*: you begin loaded and the fight's first shot is +2.
                if cfg.first_shot_bonus and self.game.s['shots_fired'] == 0 and prof.get('reload'):
                    value += cfg.first_shot_bonus
                # Ranged in melee: disadvantage while an enemy is adjacent (core-rules 11).
                ranged_pen = prof['rng'] > 1 and any(
                    cheb(self.wpos, g[0]) == 1 for g in self.alive())

                # Armour comes off every hit, and `ignores N` is what a crossbow or a firearm
                # buys with its reload (equipment.md 1.3) -- and what a card can buy on its own,
                # which is the half this file was missing. The two add: a Heavy Swing with a Mace
                # goes through three points, and core-rules 5 says armour only.
                step_ignores = op[2] if len(op) > 2 else 0
                def soak(g):
                    return max(0, foe(g[2]['weapon']).get('armor', 0)
                               - prof.get('ignores', 0) - step_ignores)

                def est(g):
                    e = pk = 0.0
                    for c, p in FATE_DIST[0].items():
                        d = max(0, fate_apply(value, c) - soak(g))
                        e += p * min(d, g[1])
                        pk += p * (d >= g[1])
                    return e, pk
                target = max(adj, key=lambda g: (est(g)[1], -g[1]))
                if real:
                    card = self.game.fate_w.draw(-1 if ranged_pen else 0)
                    d = max(0, fate_apply(value, card) - soak(target))
                    self.game.stat_fate(card)
                    if prof.get('reload'):
                        self.loaded = False
                        self.game.s['shots_fired'] += 1
                    self.game.log(f"  Warrior strikes goblin {target[2]['id']} (base {value}, fate {card}) -> {d} dmg")
                    target[1] -= d
                    self.dmg += min(d, max(0, target[1] + d))
                else:
                    e, pk = est(target)
                    self.dmg += e
                    self.killp += pk
                    target[1] = 0 if pk >= .5 else target[1] - e
                    if prof.get('reload'):
                        self.loaded = False
            elif kind == 'defend':
                # *The Wall* is the one exception to highest-wins (core-rules 5): Blocks stack.
                self.block = (self.block + cfg.shield_def) if cfg.wall else cfg.shield_def
            elif kind == 'blockn':
                # A printed Block N, which is not a shield: it ADDS to whatever is already up.
                # Way of Strength spends a half on it (Shoulder to Shoulder, Shield Wall), so it
                # has to be worth something on a turn that is also striking.
                self.block += op[1]
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
                # One Ready either reloads what is in your hands or swaps it for what is on your
                # back (core-rules 4). With nothing slung and nothing to load it is the old no-op.
                if WEAPONS[self.weapon].get('reload') and not self.loaded:
                    self.loaded = True
                    if real:
                        self.game.s['reloads'] += 1
                elif cfg.sling:
                    self.weapon = cfg.sling if self.weapon != cfg.sling else cfg.weapon
                    self.loaded = not WEAPONS[self.weapon].get('reload') or self.loaded
            # taunt: no effect in this test (solo hero)

    def commit(self):
        w = self.game.w
        w['pos'], w['hp'], w['block'], w['potions'] = self.wpos, self.whp, self.block, self.potions
        w['weapon'], w['loaded'] = self.weapon, self.loaded
        for pos, hp, g in self.gobs:
            g['pos'] = pos
            if hp <= 0 < g['hp']:
                self.game.log(f"  Goblin {g['id']} is killed")
            g['hp'] = max(0, hp)


class Game:
    def __init__(self, cfg, rng, verbose=False):
        self.cfg, self.rng, self.verbose = cfg, rng, verbose
        self.cards = dict(cfg.deck) if cfg.deck else dict(WARRIOR_CARDS)
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
        # A Wound is a card in the deck with no halves and no reaction: it cannot be played, "not
        # even for Brace" (core-rules 8). Zero copies, so none is dealt at the start -- they arrive
        # only from a hit. It lives in the table so every lookup keyed on a hand card still works.
        self.cards['Wound'] = ([], [], None, 0)
        # Fear, same shape and for the same reason: it is never played, only drawn. Its copies are
        # a config dial rather than a count here, because they arrive from an enemy and not from
        # the collection -- a deck with a Fear card in it is a deck somebody frightened.
        self.cards['Fear'] = ([], [], None, 0)
        self.cards['Compulsion'] = ([], [], None, 0)
        self.cards.update(cfg.card_overrides)
        deck = [name for name, c in self.cards.items() for _ in range(c[3])]
        self.w = dict(pos=(1, 4), hp=cfg.hp, block=0, potions=cfg.potions, hand=[], draw=deck,
                      discard=[], spent=[], conds=[], exhausted=False, acted=False,
                      weapon=cfg.weapon, loaded=True)
        n = len(cfg.goblins)
        ys = [round(1 + i * (GRID_H - 3) / max(1, n - 1)) for i in range(n)] if n > 1 else [4]
        self.gobs = [dict(id=i + 1, pos=(8, ys[i]), hp=foe(wpn).get('hp') or cfg.goblin_hp,
                          weapon=wpn) for i, wpn in enumerate(cfg.goblins)]
        # What is on the hero's back, in kilograms, and what that costs (core-rules 4). Armour is
        # the only rung on the ladder that is paid for in weight, so this is where its price lands.
        self.load = (ARMOUR[cfg.armor]['kg'] + WEAPONS[cfg.weapon]['kg'] + cfg.shield_kg
                     + (WEAPONS[cfg.sling]['kg'] if cfg.sling else 0) + cfg.extra_kg)
        self.burdened = self.load > cfg.carry_limit
        self.overloaded = self.load > cfg.carry_limit * 1.5
        # Heavy Armor blocks the Sidestep reaction (core-rules 10), which is the top two rungs'
        # real price and the half of it that has nothing to do with weight.
        self.heavy_armor = (ARMOUR[cfg.armor]['heavy'] if cfg.heavy_armor is None
                            else cfg.heavy_armor)
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
        deck += ['Fear'] * cfg.fear
        deck += ['Compulsion'] * cfg.compulsion
        rng.shuffle(deck)
        # Stamina caps what comes to the fight: own twenty, bring ten, and which ten is the
        # question. The rest is `reserve` -- not spent, just not here.
        self.w['budget'] = cfg.stamina if cfg.stamina else None
        self.w['reserve'] = []
        if cfg.stamina and len(deck) > cfg.stamina:
            self.w['reserve'] = deck[cfg.stamina:]
            del deck[cfg.stamina:]
        if self.overloaded:
            for _ in range(min(2, len(deck))):
                self.w['spent'].append(deck.pop(rng.randrange(len(deck))))
        self.fate_w, self.fate_g = FateDeck(rng, cfg.hex), FateDeck(rng)
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
        """A printed Move as it plays: injury, then halved, then reduced (core-rules 7, 8)."""
        # Grappled blocks the Move icon entirely -- the half cannot be played at all (core-rules 10).
        if any(CONDITIONS[c['key']].get('blocks_move') for c in self.w['conds']):
            return 0
        # The injury first, and it can never take you below one square.
        if n > 0 and self.cfg.bad_leg:
            n = max(1, n - self.cfg.bad_leg)
        if self.burdened or any(CONDITIONS[c['key']].get('halves_move') for c in self.w['conds']):
            n //= 2
        # An injury and a condition are different subtractions with different floors, and folding
        # them together was a real bug: ideas.md writes *Bad leg: all Move values -1 (MINIMUM 1)*,
        # and without that floor a bad leg measured -25.4 win rate and -38.5 against archers
        # (2026-11-08), because the starter deck's commonest Move value IS 1. A bad leg slows you;
        # a frozen leg stops you. The engine does this in movePlayed.
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
            # A refresh restarts the clock as well as the count (resolve.mjs says the same).
            have['by'], have['round'] = by, self.round
        else:
            self.w['conds'].append(
                dict(key=key, duration=duration, value=value, by=by, round=self.round))
        self.s[f'applied_{key}'] += 1
        return True

    def tick_conds(self, creator_id):
        """Tick everything this creator made, at the END of their turn (core-rules 7).

        Never on the round it was applied, which is the whole of why the record carries one: the
        turn a condition lands on is a turn that ends, so without the guard a duration-1 condition
        would tick the instant it landed and nobody -- creator or ally -- would see it in play.
        """
        for c in list(self.w['conds']):
            if CONDITIONS[c['key']].get('no_duration') or c['by'] != creator_id:
                continue
            if c.get('round') == self.round:
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

    def can_react(self):
        """Whether reactions are available at all this round (core-rules 3, 8).

        One gate for both paths, because there are two: the sidestep on arrival and the
        damage-reduction brace. Shattered Nerves blocking one and not the other would be the same
        defect as a dead card that is dead in five places out of six.
        """
        return not (self.cfg.shattered_nerves and self.round <= 1)

    def sidestep(self, g):
        """An enemy that ENDS its movement next to you hands you a Sidestep (core-rules 11).

        It neither redirects nor reduces (core-rules 3): you step out of reach and the Strike that
        was coming finds nobody, so it denies the hit outright rather than shaving it. That is what
        makes it worth a card, and what makes losing it to Heavy Armor a real price.
        """
        w = self.w
        if not self.cfg.sidestep or self.heavy_armor or w['exhausted'] or not w['hand']:
            return False
        if not self.can_react():
            return False
        if foe(g['weapon'])['ranged']:
            return False        # stepping one square does not get you out of a bow's range
        cards = [c for c in w['hand']
                 if c not in DEAD and self.cards[c][2] == 'sidestep']
        if not cards:
            return False
        blocked = {o['pos'] for o in self.alive()}
        best = None
        for p in neighbours(w['pos']):
            if p in blocked or cheb(p, g['pos']) <= 1:
                continue
            # out of this one's reach, and out of as many others' as the step allows
            adj = sum(1 for o in self.alive() if cheb(p, o['pos']) <= 1)
            if best is None or adj < best[0]:
                best = (adj, p)
        if best is None:
            return False        # nowhere to go: cornered, and the card stays in hand
        card = min(cards, key=self.keep)
        w['hand'].remove(card)
        w['discard'].append(card)
        w['pos'] = best[1]
        self.s['react_sidestep'] += 1
        self.log(f"  Warrior sidesteps goblin {g['id']} with {card} -> {w['pos']}")
        return True

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
            ranged=sum(1 for g in alive if foe(g['weapon'])['ranged']),
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
            # Taken off here as well as where the step happens, or the hero would keep choosing
            # cards for squares it cannot walk -- with the same floor of 1, or the two disagree.
            squares = max(1, op[1] - cfg.bad_leg) if op[1] > 0 else 0
            closes = min(squares, max(0, b['gap'] - 1))   # squares that actually close the gap
            kiting = 0.8 * squares if b['ranged'] else 0  # archers run; you need the legs
            return 1.2 * closes + kiting
        if kind == 'defend':
            return 0.8 * cfg.shield_def * max(1, min(b['adj'] + b['ranged'], 3))
        if kind == 'blockn':
            # Priced like Defend per point, so a Block 1 beside a Strike is not free and not
            # overvalued either -- it is the same soak the shield gives, one point of it.
            return 0.8 * op[1] * max(1, min(b['adj'] + b['ranged'], 3))
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
        while len(w['hand']) < self.cfg.hand_size:
            if w['budget'] is not None:
                if w['budget'] <= 0:
                    break
                # The deck tops itself back up from the discard while the budget lasts: a thin
                # collection means the same cards come round again, which is the price of a thin
                # collection rather than a shorter fight.
                if not w['draw'] and w['discard']:
                    self.rng.shuffle(w['discard'])
                    for _ in range(min(w['budget'], len(w['discard']))):
                        w['draw'].append(w['discard'].pop())
                if not w['draw']:
                    break
                w['budget'] -= 1
            elif not w['draw']:
                break
            card = w['draw'].pop()
            if card == 'Fear':
                # Resolves as it is dealt and is then out of the game: no discard, so it never
                # comes round again, and the loop carries on filling the hand.
                self.take_fear()
                continue
            w['hand'].append(card)
        if not w['draw'] and 'deck_empty_round' not in self.s:
            self.s['deck_empty_round'] = self.round
        out = (w['budget'] is not None and w['budget'] <= 0) or not w['draw']
        # Exhaustion is about cards you can PLAY. A Wound takes up a slot and cannot be played,
        # "not even for Brace" (core-rules 8), so counting it here would let a hand of dead cards
        # read as a hand -- and the first run with Wounds on reported the hero winning MORE in hard
        # fights because of exactly that: dead cards padding the hand and the post-Catch-Breath
        # deck, delaying an exhaustion that should have arrived sooner.
        w['exhausted'] = len([c for c in w['hand'] if c not in DEAD]) < 2 and out

    def take_fear(self):
        """One square directly away from the nearest goblin, and the card is spent.

        Cornered counts: with every further square blocked or off the grid, `step_away` returns
        None and the hero stands there, which is the rule and not a shortcut. Nothing to flee from
        counts too -- a Fear drawn after the last goblin dropped does nothing at all.
        """
        self.s['fears_taken'] += 1
        alive = self.alive()
        if not alive:
            return
        w = self.w
        threat = min(alive, key=lambda g: cheb(w['pos'], g['pos']))['pos']
        blocked = {g['pos'] for g in alive}
        nxt = step_away(w['pos'], threat, blocked)
        if nxt is None:
            self.s['fears_cornered'] += 1
            return
        w['pos'] = nxt
        self.s['fear_squares'] += 1

    def goblin_move_only(self, g):
        """A confused type repositions and does nothing else.

        It still closes, because Confusion is not a lost turn -- so against a swarm already in
        contact it costs almost nothing, and against archers it costs them the shot. The same
        asymmetry Fear has from the other side of the board.
        """
        alive_pos = {o['pos'] for o in self.alive() if o is not g}
        blocked = alive_pos | {self.w['pos']}
        prof = foe(g['weapon'])
        if cheb(g['pos'], self.w['pos']) <= prof['rng']:
            return                      # already where it wants to be: it shuffles and waits
        nxt = step_toward(g['pos'], self.w['pos'], blocked)
        if nxt:
            g['pos'] = nxt

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
            self.gdeck = list(GOBLIN_CARDS) + ['Confusion'] * self.cfg.confusion
            if self.cfg.pierce_intent:
                self.gdeck.append('Find the Joint')
            if self.cfg.expose_intent:
                self.gdeck.append('Prise It Open')
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
                        # No plan: every creature of the type may only Move this round, which is
                        # a reposition and not a lost turn (core-rules 8).
                        if intent == 'Confusion':
                            self.s['confused_rounds'] += 1
                            self.goblin_move_only(g)
                        else:
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
        w = self.w
        # A Wound takes up a slot and is not an option (core-rules 8).
        hand = self.w['hand']
        live = [i for i, c in enumerate(hand) if c not in DEAD]
        single = self.dazed() or len(live) < 2
        opts = []
        if single:
            for i in live:
                opts.append(([(i, 'P')], self.cards[hand[i]][0]))
        else:
            for i in live:
                for j in live:
                    if i == j:
                        continue
                    a, b = hand[i], hand[j]
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
                reach = sum(1 for g in alive
                            if cheb(sim.wpos, g[0]) <= 3 or foe(g[2]['weapon'])['ranged'])
                hits = max(1, min(reach, 3)) if cfg.persistent_block else 1
                val += 0.5 * sim.block * hits
        melee_foes = any(not foe(g['weapon'])['ranged'] for g in self.alive())
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
        # Under stamina a breath has to buy BUDGET as well as cards, or it buys nothing at all:
        # the deck already feeds itself from the discard, so moving cards would change which card
        # comes next and not how many more there are.
        if w['budget'] is not None:
            w['budget'] += BREATH_RECOVERY
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
        # A Compulsion in hand forbids the breath outright (core-rules 8). It is the only intruder
        # that takes an OPTION rather than a resource, and this is the line that is the whole card.
        if (len(w['discard']) >= BREATH_RECOVERY and not w['draw']
                and 'Compulsion' not in w['hand']
                and (w['exhausted'] or len(w['hand']) <= cfg.cb_threshold)):
            if self.catch_breath():
                return
        if not any(c not in DEAD for c in w['hand']):
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
        spent_halves = cfg.spent_cards or {}
        for i, h in sorted(played, key=lambda t: -t[0]):
            name = w['hand'].pop(i)
            if h in spent_halves.get(name, ''):
                w['spent'].append(name)
                self.s['cards_spent'] += 1
                self.log(f"  {name} is Spent")
            else:
                w['discard'].append(name)
        # "At the end of your turn, discard this card" -- so a Wound costs a hand slot for exactly
        # one turn and then goes back round, which is what makes it a tax on the deck's cycle
        # rather than a permanent cut.
        for name in list(DEAD):
            for _ in range(w['hand'].count(name)):
                w['hand'].remove(name)
                w['discard'].append(name)

    def take_hit(self, raw, melee, src, crit=False, plus2=False, pierce=0):
        w, cfg = self.w, self.cfg
        self._board = self.board()
        # *Nothing Gets Through*: while Overloaded, armour counts double. Overloaded is not free --
        # the hero is Slowed and two cards are Spent for the fight -- so this reads both prices.
        armor = cfg.armor * 2 if (cfg.armor_doubles_overloaded and self.overloaded) else cfg.armor
        # **The critical deck decides what the Critical did** (core-rules 5), so the doubling is no
        # longer certain. Modelled as its distribution: ten cards reshuffled on empty is close
        # enough to independent draws at one crit in twenty attacks.
        #
        # **The DOUBLING is settled here and the RIDER is applied at the bottom**, which is where
        # the engine puts each of them: `drawCritEffect` returns its riders and `resolveAttack`
        # applies them after the damage, beside the ammunition's condition (resolve.mjs). So the
        # hit that found the gap meets the armour the target is actually wearing, and the gap is
        # what the NEXT attack walks through.
        #
        # [CHANGED 2026-11-09] It used to apply before the armour read, and that is the ordering
        # the published table in core-rules 5 was measured under: the condition face both gave up
        # its doubling and collected the whole benefit immediately, on the same blow. The deck is a
        # trade now rather than a discount, and it is only worth drawing because `duration: 1`
        # reaches the attacker's own next turn.
        #
        # *Driven Down* -- Halted, the next turn does not happen -- is drawn and its damage half
        # resolved, but the lost turn is NOT modelled: nothing in this file skips a turn from a
        # condition. So these figures still understate the deck by one card in ten, and
        # understating is the right direction for a number used to decide whether to ship it.
        riders = []
        if crit and cfg.crit_deck:
            face = self.rng.random()
            if face >= 0.4:
                if not cfg.crit_deck_rides:
                    raw = raw // 2                      # not doubled: the plain figure
                if face < 0.6:
                    riders = ['exposed']                # Find the Gap
                elif face < 0.8:
                    riders = ['offBalance']             # Off the Feet
                elif face < 0.9:
                    riders = []                         # Driven Down: the turn is not modelled
                else:
                    riders = ['exposed', 'offBalance']  # Both, as the two this file can see
        # `ignores N` comes off armour and never off Block (core-rules 5).
        # **Exposed zeroes armour**, read off the derived number exactly as the engine reads it.
        if any(CONDITIONS[c['key']].get('zeroes_armour') for c in w['conds']):
            armor = 0
        else:
            armor = max(0, armor - pierce)
        # A face that finds the gap in the plate takes no armour off at all.
        if (crit and cfg.crit_pierces) or (plus2 and cfg.plus2_pierces):
            armor = 0
        d = max(0, raw - armor)
        # **Off Balance zeroes Block.** Block stays a stored, spent field, so this is a view of it
        # and not a write -- the same split the engine makes between `block` and `blockNow`.
        off_balance = any(CONDITIONS[c['key']].get('zeroes_block') for c in w['conds'])
        block_now = 0 if off_balance else max(0, w['block'])
        absorbed = 0 if (crit and cfg.crit_unblockable) else min(block_now, d)
        if not cfg.persistent_block:
            w['block'] -= absorbed          # old rule: one hit used the whole block up
        d -= absorbed
        # A Critical always gets at least one point through, after armour and Block alike.
        if crit and cfg.crit_floor:
            d = max(1, d)
        self.s['prevented_armor'] += min(raw, cfg.armor)
        self.s['prevented_shieldup'] += absorbed
        can_react = not w['exhausted'] and any(c != 'Wound' for c in w['hand'])
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
        if d > 0 and w['hand'] and not w['exhausted'] and self.can_react():
            lethal = w['hp'] - d <= 0
            spare = len(w['hand']) - (0 if lethal else reserve)
            if spare > 0:
                def red(c):
                    r = self.cards[c][2]
                    return 3 if r == 'block' else 2 if (r == 'parry' and melee) else 1
                # A seventh site that compared 'Wound' by name. DEAD was introduced for the other
                # six on 2026-11-08 and this one was missed, so a Compulsion could be spent as a
                # brace -- a card that cannot be played, played.
                bracers = [c for c in w['hand'] if c not in DEAD]
                if not bracers:
                    bracers = None
                card = max(bracers, key=lambda c: (min(red(c), d), -self.keep(c))) if bracers \
                    else None
                cut = min(red(card), d) if card else 0
                if card and (cut >= 2 or lethal or (w['hp'] - d <= 3)):
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
        # core-rules 8: five or more from a single hit, after armor. Dropping to 0 is the other
        # event and needs no code here -- the fight is over and the deck is reshuffled anyway.
        if cfg.wounds and d >= WOUND_AT:
            w['discard'].append('Wound')
            self.s['wounds_taken'] += 1
        if cfg.heavy_hits and d >= 5 and w['hand']:
            lost = min(w['hand'], key=self.keep)
            w['hand'].remove(lost)
            w['discard'].append(lost)
            self.s['heavy_hit_discards'] += 1
        # The critical deck's rider, after the blow it arrived with. `by=src` so it ticks on the
        # clock of the creature that drew the card, which is what lets that creature use it.
        for key in riders:
            self.apply_cond(key, 1, by=src)

    # --- goblins
    def routs(self, g):
        """Has this goblin's nerve broken?"""
        if self.cfg.cowardly_mode == 'group':
            return 2 * len(self.alive()) <= len(self.gobs)
        return g['hp'] < self.cfg.goblin_hp / 2

    def goblin_act(self, g, card):
        """One goblin takes its turn, on its type's intent card for this round."""
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
                dist_from = g['pos']
                prof = foe(g['weapon'])
                flee = kind == 'away' or (prof['ranged'] and dist == 1)
                if prof['ranged'] and not flee and dist <= prof['rng']:
                    continue
                for _ in range(op[1]):
                    if not flee and cheb(g['pos'], wp()) <= 1:
                        break
                    nxt = step_away(g['pos'], wp(), blocked) if flee else step_toward(g['pos'], wp(), blocked)
                    if nxt is None:
                        break
                    g['pos'] = nxt
                # "An enemy that ENDS ITS MOVEMENT next to you" (core-rules 11), which is a rule
                # about ARRIVING. A goblin already in your face that plays Stab & Scurry breaks out
                # of the loop above without taking a step, and answering that costs a card for
                # nothing -- so the trigger needs the step to have happened and the square to be new.
                if not routing and cheb(g['pos'], wp()) <= 1 and (
                        self.cfg.sidestep_mode == 'any'
                        or (g['pos'] != dist_from and dist > 1)):
                    self.sidestep(g)
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
                else:
                    prof = foe(g['weapon'])
                    rng_ = prof['rng']
                    value = prof.get('dmg') or self.cfg.goblin_dmg
                    ranged = prof['ranged']
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
                # The intent's own piercing, which is a property of the round rather than of the
                # creature: armour is reduced for every goblin acting on this card.
                pierce = self.cfg.pierce_intent if card == 'Find the Joint' else 0
                self.take_hit(raw, not ranged, g['id'], crit=(fc == 'CRIT'), plus2=(fc == 2),
                              pierce=pierce)
                if kind == 'strike' and op[2] == 'expose' and fc != 'MISS':
                    # `by=g['id']`, which it was missing: an Exposed with no creator fell through
                    # to the victim's clock instead of the goblin's, so every expose_intent figure
                    # before 2026-11-09 was measured on the wrong turn.
                    self.apply_cond('exposed', 1, by=g['id'])
                if kind == 'strike' and op[2] == 'daze' and fc != 'MISS':
                    self.apply_cond(self.cfg.goblin_condition,
                                    self.cfg.goblin_cond_dur,
                                    self.cfg.goblin_cond_value, g['id'])
                    self.s['daze_applied'] += 1
        # **The clock runs out at the END of this creature's turn** (core-rules 7), and never on
        # the turn a condition landed -- `tick_conds` carries that guard. An early return above
        # means the warrior is down and the fight is over, so there is nothing to tick.
        self.tick_conds(g['id'])


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
                  'react_block', 'react_parry', 'react_brace', 'react_use', 'react_sidestep',
                  'prevented_react', 'reloads', 'shots_fired', 'cards_spent',
                  'prevented_armor', 'prevented_shieldup', 'dmg_taken', 'heavy_hit_discards', 'wounds_taken',
                  'fears_taken', 'fears_cornered', 'fear_squares', 'confused_rounds',
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
    # What a fright costs, and the cell it all lands in: Fear is nearly free in a scrum and
    # savage when the hero has to CLOSE, because every square back is another free shot
    # (core-rules 8).
    Config(name='AA Fear 2, 3 spears', fear=2),
    Config(name='AB Fear 2, 5 spears', fear=2, goblins=('spear',) * 5),
    Config(name='AC Fear 2, 2 spear + 2 bow', fear=2,
           goblins=('spear', 'spear', 'bow', 'bow')),
    Config(name='AD Fear 2 against a raw 8', fear=2, goblin_dmg=8),
    # The other three intruders that reach the action deck or the fate deck. Rage is absent on
    # purpose: it costs you a swing aimed at an ally, and there are no allies in here.
    Config(name='AE Compulsion 1, 4 spears', compulsion=1, goblins=('spear',) * 4),
    Config(name='AF Hex 1, 4 spears', hex=1, goblins=('spear',) * 4),
    Config(name='AG Confusion 2, 4 spears', confusion=2, goblins=('spear',) * 4),
    Config(name='AH Confusion 2, 2 spear + 2 bow', confusion=2,
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
