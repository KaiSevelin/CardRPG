# Specializations (Draft 0.1)

Every major node in the graph, taken from the world document
([../worldinfo/Firma.md](../worldinfo/Firma.md)). The names are the world's; the **axis** and **cost**
columns are the [leveling.md](leveling.md) §5a template applied to them.

Two columns carry different weight:

- **Pays in** for a **Way of Mind** school is *written in the world already*. Those are not proposals.
- **Leans on** is mostly a proposal, and the places where it is forced are marked.

---

## The find: the world already priced magic

Every magic school in Firma states what learning a formula costs, and nearly every one of those costs
is a rule this game already has or has already parked:

| School | The world's price | The rule it already is |
|---|---|---|
| **Necromancy** | each formula learned means **forgetting something else** | a forced **prune** ([leveling.md](leveling.md) §4) |
| **Poison** | preparing costs **skill cards set aside equal to the formula's strength** | **Strain**, on the skill deck (core-rules §8) |
| **Shadow** | a permanent **Wild card** in your deck per formula | **Overcast / wild magic** ([ideas.md](ideas.md)) |
| **Blood** | learning costs **damage equal to the strength**; 4–5 is permanent | Health, and **permanent injuries** ([ideas.md](ideas.md)) |
| **Tattoo (Styrka)** | each formula gives the GM a **secret** against you | **Secrets** (skill-rules §5) |
| **Asceticism** | you give up **body parts** | **permanent injuries** ([ideas.md](ideas.md)) |
| **Elemental** | money and materials | downtime (skill-rules §6) |
| **Glamour** | the elves do not teach for free | an obligation — **[OPEN]** |
| **Spiritualism** | a **pact with a minor god** per formula | an obligation — **[OPEN]** |
| **Household** | negotiating with elf-kin | an obligation — **[OPEN]** |
| **Priest** | **vows or a pilgrimage**, whatever the school | an obligation — **[OPEN]** |

> **Formula strength is 1–5**, and that is the spell-slot cost. A strength-3 formula takes three of
> your slots. "Some spells cost more than one slot" was already written in the world; it just was not
> written in the rules.

Three of those costs are the same shape — an obligation owed to someone who taught you — and the game
has no mechanic for it. That is the one real gap this list turns up.

**My earlier Necromancer placeholder was wrong.** I priced it in Taint; the world prices it in
*forgetting*, which is a prune, and that is better — it makes a necromancer's mind visibly narrower
the deeper they go, using a rule that already exists.

---

## Way of Mind — 11 schools, 4 crafts, 1 ritual

Direct magic is cast in combat. Ritual magic is not, and anyone literate can do it.

| Node | Swedish | Leans on | Pays in |
|---|---|---|---|
| **Blood Magic** | Blodsmagik | Tempo | Health to learn, and blood to cast — often your own |
| **Necromancy** | Nekromanti | Preparation | Forgetting: every formula prunes something else |
| **Elemental Magic** | Elementarmagi | Position | Money and materials (Air, Water, Earth, Fire, Ether) |
| **Poison** | Gift | Control | Skill cards set aside equal to the formula's strength |
| **Glamour** | Glamour | Control | An elven debt — **[OPEN]** |
| **Tattoo Magic** | Styrka | Deck shape | A secret the GM holds against you, per formula |
| **Asceticism** | Asketism | Deck shape | Parts of your body |
| **Shadow Magic** | Skugga | Position | A permanent Wild card per formula |
| **Spiritualism** | Spiritualism | Preparation | A pact with a minor god, per formula — **[OPEN]** |
| **Household Magic** | Hushållsmagi | *(out of combat)* | Negotiation with elf-kin — **[OPEN]** |
| **Priest Magic** | Prästmagik | Preparation | Vows or a pilgrimage; a shorter list than a mage's |
| **Ritual Magic** | Rituell magik | *(out of combat)* | Time, and a recipe that can go wrong |
| **Brewer** | Bryggare | *(craft)* | — |
| **Smith** | Smeder | *(craft)* | — |
| **Jeweller** | Juvelerare | *(craft)* | — |
| **Orator** | Oratorer | *(social)* | — |

**[OPEN]** The crafts and the two out-of-combat schools do not fit the six-axis template, because the
axes are all about a fight. They need either a second template or a different kind of node.

## Way of Shade — 12

| Node | Swedish | Leans on | Pays in |
|---|---|---|---|
| **Thief** | Tjuvar | Control | A free hand and a light weapon |
| **Assassin** | Lönnmördare | Tempo | Everything on one opening; little to do once seen |
| **Spy** | Spioner | *(social)* | — |
| **Trapmaker** | Fällmakare | Position | Setup turns before anything pays off |
| **Fence** | Hälare | *(social)* | — |
| **Bard** | Barder | Reactions | — |
| **Politician** | Politiker | *(social)* | — |
| **Archer** | Bågskyttar | Position | Hands full, and ruined by anything adjacent |
| **Pistolier** | Pistoljärer | Tempo | Reloading |
| **Duellist** | Duellister | Reactions | One enemy at a time |
| **Acrobat** | Akrobater | Position | Carries nothing heavy |
| **Half-mage** | Halvmagiker | Preparation | Few slots; neither one thing nor the other |

## Way of Strength — 15

| Node | Swedish | Leans on | Pays in |
|---|---|---|---|
| **Sword** | Svärdsspecialister | Reactions | — |
| **Two-handed** | Tvåhandade specialister | Tempo | Both hands: no shield, no prepared spells |
| **Polearm** | Polearm-specialister | Position | Both hands; poor up close |
| **Dagger** | Dolkspecialister | Tempo | Reach |
| **Unarmed** | Obeväpnade specialister | Reactions | No weapon value at all — **both hands always free** |
| **Formation** | Formationsspecialister | Position | Needs an ally beside you |
| **Crossbow** | Armborstspecialister | Tempo | Reloading |
| **Artillerist** | Artillerister | Position | Immobile while it fires |
| **Musketeer** | Musketerare | Tempo | Reloading, and worse |
| **Shield** | Skyddsspecialister | Reactions | A hand that will never cast |
| **Blunt** | Trubbiga specialister | Control | — |
| **Gladiator** | Gladiatorer | *(social)* | — |
| **Berserker** | Bärsärkar | Deck shape | Cannot defend; the deck burns down fast |
| **Cavalry** | Kavalleri | Position | A mount, and room to use it |
| **Sapper** | Sappers | Position | Setup turns |

> **Way of Strength is the one at risk.** Eight of the fifteen are *a weapon type*, and a weapon type
> is not a playstyle — the engine already handles "I use a sword" through the item's Strike line. If
> Sword, Two-handed, Polearm, Dagger, Blunt, Crossbow, Musket and Unarmed all lean on *damage with
> this weapon*, they are one branch written eight times.
>
> The axis column above is an attempt to pull them apart: Sword and Unarmed into reactions, Polearm
> into reach, Dagger and the gunpowder ones into tempo, Blunt into conditions. **Each has to earn its
> axis in its Signature, not in its weapon.**

**Unarmed** is worth singling out. Both hands are always free, which is exactly what a prepared caster
needs (core-rules §4) — so it is the Way of Strength node that most wants a second Way, and the
geometry already allows it.

---

## What this list turns up

1. **Three Mind schools and Priest magic all price themselves in an obligation** — a debt to the
   elves, a pact with a god, vows. The game has no mechanic for an obligation. It is the one genuinely
   missing piece, and it would serve four nodes at once.
2. **Spell-slot cost is already written**: formula strength 1–5.
3. **`Armborstspecialister` appears twice** in the world document (lines 366 and 370). Listed once
   here, as fifteen.
4. **The counts do not match [design-direction.md](design-direction.md)**, which says 15 / 12 / 13.
   Strength is 15 and Shade is 12, but Mind has 11 direct schools plus ritual, four crafts and an
   orator. The 13 needs reconciling with whoever wrote it.
5. **The crafts do not fit the template.** Brewer, Smith, Jeweller, Orator, Spy, Fence, Politician and
   Gladiator are all about what you do *between* fights. Either the six axes get an out-of-combat
   sibling, or these are a different kind of node entirely.

## Open

- **[OPEN]** An **obligation** mechanic, for the four schools that need one.
- **[OPEN]** The **deity** exclusive group ([leveling.md](leveling.md) §3). Priest magic is "a school
  according to their religion", so the deity node both gates the priest's formula list and closes
  every other god. Firma has five bodies of worship to draw it from — the Eternal God, the Eternal
  Spirit, The Five, The Grey, and the local and minor gods.
- **[OPEN]** A second template for out-of-combat specializations (crafts, social).
- **[OPEN]** Each node's **Signature** — the one card or feature it is named for. That is where the
  axis gets earned, and it is the next thing to write.
- **[OPEN]** Which specializations hang off which trunk node, and how deep each branch runs.
