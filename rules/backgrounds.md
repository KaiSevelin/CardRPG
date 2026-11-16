# Backgrounds (Draft 0.1)

A background is who you were **before** you walked one of the Ways. Every background gives the same five parts, so they are simple to write and easy to compare.

## Where, what, then how  **[RULED 2026-11-14]**

Character creation is a **sequence**, not a wall of doors:

1. **Origin** — the place you are from. One of **fifteen**, taken once, and it shuts the other
   fourteen.
2. **Occupation** — the trade you were in. One of twelve, and **not all twelve are open to you**:
   an occupation follows the origins it could plausibly have come out of.
3. **Way** — how you fight, which is the first thing that costs a level. All four follow any
   occupation.

> **Why an order rather than free choices.** The first two are true of you before the first level
> is spent, so neither costs one — but they are not simultaneous. You were somewhere before you
> were something, and you were something before you learned to fight. A trade that could follow
> from anywhere is a trade the place did not shape; a Way chosen before either is a character
> sheet filled in backwards.
>
> A Miner comes from the Iron's camps, the Furnace's workings, Saag et Haar's gem mines or Wolf
> Peak's sulphur; a Vintner from the Ruby, where wine is the export, or from the two districts
> that trade it. Picking the place is what makes the second list worth reading.

Every origin keeps **at least four** occupations open, so no place decides your character for you,
and none keeps all twelve, so the narrowing is real. **Which occupations follow which origin is
the level-up pane's to show** — it is derived from the graph, and a second copy of it here is a
second thing that can be wrong. Every pairing is argued from [the world file](../worldinfo/Firma.md)
and nothing was invented to make one work.

### The fifteen places

The six districts, and nine enclaves and other holdings that a person can be *from*:

| | |
|---|---|
| **Districts** | The Core, The Fiord, The Ruby, The Iron, The Amber, Furnace Stock |
| **Enclaves** | Wolf Peak, Saag et Haar, Echterhof-born, The Triple Enclave, Regensburg, Solemn, Kelp Bay, Hyrlock |
| **The Horde** | Xtchaargh — the Summer Village, the one hive that takes human envoys |

> **Velderon is not on it.** The elves' embassy is a closed ruin you do not enter without an
> invitation, which makes it somewhere a character can **go** and not somewhere a character is
> **from**. That is the test for this list.
>
> **Xtchaargh is**, for the opposite reason: it is the one hive with a human quarter, and the
> people in it are raised there. Its know-how is the Horde itself — its hives, its castes and what
> it will bargain for — which is the one subject on which nobody else at the table has an opinion
> worth having.

Three of the fifteen teach a **language**, and they are exactly the three from somewhere with a
tongue of its own: Furnace Stock (Valgar), Wolf Peak (Perga) and Saag et Haar (Veche). A language
nobody lacks is not a gift, which is why the rest teach none — and none of the six new places has
one in the world file, so none of them was given one to even the list up.

## Template

| Part | What you get | Rule |
|---|---|---|
| **Skill cards** | 2 skill cards | Added to your skill deck. |
| **Feature** | 1 small feature | Like combat features, but usually about skills or the world. |
| **Training** | 1 tool type | Full tool bonus with that tool type (untrained users get max +1). |
| **Know-how** | 1 situation | **Advantage** on skill checks in that situation. |
| **Gear** | Starting items | Always includes the trained tool. |

Rules for writing **know-how**:
- It should come up now and then, but not in every scene.
- It names a **situation**, not an approach. "Among soldiers and in military matters", not "Might checks".

## Examples  **[2026-11-16]**

**The twelve are built, so this section stopped inventing any.** It carried four, written before
the occupations existed and never looked at again: *Soldier*, *Street Urchin*, *Acolyte* and
*Hunter*. Three of those are real occupations now and the drafts disagreed with the shipped node in
nearly every part — the Acolyte here trained on a **holy symbol** and carried a prayer book, where
`background.acolyte` trains **treating wounds** and issues a Healer's Kit and a Mace, and its
feature is *Well Read* rather than a *Faithful* that no feature list has ever held. Their skill
cards were written as an approach and a number, which is not how a skill card has worked since they
were named. And the fourth, **Hunter**, is not an occupation and never has been; the game's woodsman
is the **Forester**.

That is the same failure the player's handbook had in two chapters: a draft the data moved past, in
a document nothing was reading against the graph. The catalogue is therefore not kept here, for the
reason this file already gives about the origin-to-occupation pairing — *a second copy of it here is
a second thing that can be wrong*. All twelve, with all five of their parts, are printed in the
handbook's *Where you are from, and what you did before*, generated from the graph and checked
against it.

What belongs here is the **template above** and the rules for writing know-how, which is what
somebody writing a thirteenth actually needs. This file is read by the suite now, and a check fails
if it ever describes an occupation by hand again.

## Background secret (note)

> Placeholder table until the world is ready. Later, each background may get its own table.

At character creation, roll **d12** (or pick, with the GM's approval) for a secret from your past. The GM writes it on a **secret slate**. Someone in the world may know it, and the GM can use it against you (see *Secrets against the players* in the skill rules).

| d12 | Secret |
|---|---|
| 1 | You owe a large debt to dangerous people. |
| 2 | You deserted from an army, an order or a guild. |
| 3 | You stole something valuable, and the owner is still looking for it. |
| 4 | You are living under a false name. |
| 5 | You saw a crime committed by someone powerful, and said nothing. |
| 6 | You once belonged to a forbidden cult or society. |
| 7 | You caused someone's death, and they had family. |
| 8 | You are wanted for a crime in another region (guilty or not, your choice). |
| 9 | You have a hidden child, sibling or lover somewhere. |
| 10 | You betrayed a friend to save yourself. |
| 11 | You carry an item that isn't what you claim it is. |
| 12 | You have noble or royal blood that someone would rather see gone. |

## Notes

- A background shouldn't overshadow the Way. Its skill cards are low (1–2), and its feature is small.
- Combining a background with any Way should be allowed: a Street Urchin in the Way of Mind is interesting.
