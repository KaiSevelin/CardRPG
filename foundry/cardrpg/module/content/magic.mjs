/**
 * Formulas, the shadow price, rituals, transformations and the small gods.
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */

/* -------------------------------------------- */
/*  Transformations                             */
/* -------------------------------------------- */

/**
 * **A transformation is a set of cards added and a set of your own taken away.**
 *
 * Two halves, and the second is the one that makes it a transformation rather than a bonus. A form
 * that only ADDS is a costume: you become a bird and keep your sword. So each one names what it
 * gives and what it takes, and a `shape` step names the transformation.
 *
 * **`grants`** is content by name -- items and features become slates on the actor, cards are dealt
 * into the action deck -- and every name is checked against the tables, because a form that grants
 * a card nobody wrote is a form that silently gives nothing.
 *
 * **What it COSTS is on the card**, in the `shape` step's own `quarantine` -- a filter of the
 * player's items, features and cards that go out of play while the form is worn. It lives there
 * rather than here because that is where it can be edited: `content.mjs` is a source file and
 * nothing in Foundry writes to it.
 *
 * What is quarantined is **taken off the actor and kept**, not flagged. More than ten places read a
 * slate, and a flag would have to be respected by all of them.
 */
export const TRANSFORMATIONS = [
  {
    /**
     * **[PLACEHOLDER]** One transformation, so the mechanism is exercised by content as well as
     * declared. The Doomfly is in the roster and it flies, which is the clearest thing a borrowed
     * body can be worth; replace it freely.
     *
     * `Nip` is what you have instead of hands. **What it costs is on the card**, not here: the
     * quarantine is a field on the `shape` step so that a GM can tick it, and so that a greater
     * version of the same borrowed body can be gentler about what you drop.
     */
    name: "Doomfly",
    blurb: "Four wings and a mouth.",
    grants: { items: ["Nip"], features: [], cards: [] }
  }
];

/* -------------------------------------------- */
/*  Minor gods                                  */
/* -------------------------------------------- */

/**
 * **The eight minor gods the world names**, which is what a conjuration may call by name.
 *
 * Firma.md is unusually specific about these and the specificity is the point: *unlike the other
 * gods, the minor gods demonstrably exist* -- a hundred or so nature spirits and beings forced into
 * isolated places and underground by Athor's conquest. They *grant no miracles, but they are the
 * basis of the Spiritualism school*, so a spell that calls one is not a prayer. It is a
 * negotiation with somebody who is actually there.
 *
 * Eight of a hundred or so, which is what the document gives. The rest are absent because the
 * document does not name them, and `name: ""` on a conjuration already means *the GM decides*.
 *
 * Fahlas appears twice in the world and deliberately so: he is the necromancer king of Saag et
 * Haar who *has lived 400 years and become a minor god*, which makes him the one entry here that
 * a party might also meet as a ruler.
 */
export const MINOR_GODS = [
  { name: "The Winter Lady", note: "the Silent are her cult" },
  { name: "Queen of the Dark", note: "" },
  { name: "The Troll King", note: "essentially all trolls follow him" },
  { name: "Baal Fagor", note: "the Soot Club try to summon him" },
  { name: "The Land Jelly", note: "the Dancers use drugs to speak with it" },
  { name: "The Cat God", note: "" },
  { name: "Fahlas", note: "the necromancer king of Saag et Haar, 400 years old" },
  { name: "Mother Longhand", note: "" }
];

/* -------------------------------------------- */
/*  Slates                                      */
/* -------------------------------------------- */



/**
 * **The four rituals, and Ritual Magic's first content of any kind.**
 *
 * These are not new spells in a school. specializations.md has listed **Ritual Magic** as a node of
 * Way of Mind since the Way was written, with a price already stated -- *"Time, and a recipe that
 * can go wrong"* -- and a gate already stated: *"Direct magic is cast in combat. Ritual magic is
 * not, and anyone literate can do it."* Nothing had ever been written for it. The count even says
 * so out loud: *"13 for Mind only if ritual magic counts."*
 *
 * Both halves of that price are a **challenge** (skill-rules 3 and 6), in the two words it took to
 * say it: *time* is the Progress track, one check per unit of time, and *a recipe that can go
 * wrong* is the Pressure track. So a ritual is not a check and not a cast. It is the thing the
 * downtime system was already for, which is why **Cleansing** could be published as a challenge in
 * core-rules 8 long before anything could run one.
 *
 * **And the gate is the recipe, not the caster.** That is the world document's line, not a choice
 * made here, and it is the better design: a party cannot be locked out of mending a character
 * because nobody levelled the right way, and the GM keeps a real scarcity to hand out. A recipe is
 * a thing you find.
 *
 * **[RESOLVED 2026-11-08] They are recipes, which is what *the gate is the recipe* always meant.**
 *
 * They were spells, carried at `strength: 1` with an `[OPEN]` against them, because on a spell
 * `strength` is the **slot cost** and a ritual is the first slate in the game that is never
 * prepared and never cast. Any number above zero quietly closed the hardest ritual to a non-mage
 * with no slots, which is the opposite of *"anyone literate can do it"* -- and a 1 was a floor
 * rather than a judgement, which is a value nobody chose.
 *
 * An **item** has no slot budget, no preparation and nothing to cast, so the contradiction simply
 * is not expressible: a recipe is bought, stolen, copied and lent, and a GM hands one out the way
 * they hand out a key. It also puts the scarcity somewhere a party can act on. Difficulty is
 * still said where it was always said -- Progress against Pressure, in `injuryCategories`.
 *
 * The prices are the first thing in the game to put a number on *"more of a quest than a
 * service"*: a Cleansing recipe is 300 gold against the Cleansing Draught's 150, and an Unbinding
 * is 1200. **[OPEN]** Those are placed against the equipment ladder by eye and have not been
 * measured against what a party actually earns.
 * `timing: "ritual"` is likewise not new. It has been a timing with a reader (`isRitual`) and five
 * users in this file since Household Magic was built, documented as *overnight work and not a thing
 * you hold ready*. A `permanent` timing was removed from config.mjs earlier as "a slot budget
 * wearing a timing's clothes"; this is what the word was actually for.
 */
export const RITUALS = [
  {
    name: "Recipe: Regrowth", ritual: "maiming", slot: "pack", weight: 1, value: 900, kind: "Recipe",
    text: "Lore, Progress 6, Pressure 4. Regrows what was lost. Needs the part, or a likeness of it.",
    description: "<p>ideas.md calls regeneration magic <em>\"rare and expensive, more of a quest "
      + "than a service\"</em>. Progress 6 is the quest, and the likeness is what the party has to "
      + "go and get.</p>"
  },
  {
    name: "Recipe: Quieting", ritual: "breaking", slot: "pack", weight: 1, value: 450, kind: "Recipe",
    text: "Presence, Progress 6, Pressure 4. Settles what was broken. Needs somebody who knew you before.",
    description: "<p>The one ritual that is not Lore, and the only approach that could have been: "
      + "what mends a nerve is a person, and Presence is the approach for a person. It is also the "
      + "cheapest of the four to attempt and the easiest to attempt badly.</p>"
  },
  {
    name: "Recipe: Unbinding", ritual: "curse", slot: "pack", weight: 1, value: 1200, kind: "Recipe",
    text: "Lore, Progress 8, Pressure 3. Lifts a curse &mdash; and you must name who laid it.",
    description: "<p>The hardest and the shortest-fused: Progress 8 against Pressure 3, so there "
      + "is very little room to go wrong. The name is the real gate &mdash; it is the one thing in "
      + "the four that no amount of coin buys, because somebody has to find out who did this.</p>"
  },
  /*
   * --- and the three lesser recipes, which the levelling graph hands out ---
   *
   * **The four above are found and these three are learned**, which is the split worth stating.
   * A Regrowth is *more of a quest than a service* (ideas.md) and belongs in the world where a GM
   * can place it; mending a deck full of Wounds is what a person who studied rituals should simply
   * be able to do. So these sit on nodes off **Letters** -- the node that grants *reading and
   * writing*, which is the world document's own gate for the whole school: *anyone literate can
   * do it*.
   *
   * Cheap in Progress on purpose. A ritual specialist should be the person who tidies up after a
   * fight, and that is worth being without being worth eight checks.
   */
  {
    name: "Recipe: Mending", ritual: "wounds", slot: "pack", weight: 1, value: 120, kind: "Recipe",
    text: "Lore, Progress 2, Pressure 4. Removes every Wound from one character's deck.",
    description: "<p>A long rest takes one Wound and a treatment takes one. This takes all of "
      + "them, which is a different thing to want: a party out of its third fight has a deck "
      + "nobody can play, and one a night is not an answer to that.</p>"
  },
  {
    name: "Recipe: Quiet Night", ritual: "lasting", slot: "pack", weight: 1, value: 200,
    kind: "Recipe",
    text: "Presence, Progress 2, Pressure 3. A lasting injury's remaining days are spent at once.",
    description: "<p>The only thing in the game that shortens a lasting injury. The four greater "
      + "rituals lift the <em>permanent</em> kind and have nothing to say about the other, so "
      + "a &minus;1 on the injury draw used to mean two weeks and no recourse.</p>"
  },
  {
    name: "Recipe: Unknotting", ritual: "held", slot: "pack", weight: 1, value: 250,
    kind: "Recipe",
    text: "Lore, Progress 3, Pressure 3. Lifts one condition that has no duration to spend.",
    description: "<p>Shake Off pays in the number a condition already has, so a condition with no "
      + "number is beyond it &mdash; Blessed, Cursed, and the rest that simply sit there. That is "
      + "the other half of core-rules &sect;7, and what the Lift effect was written for.</p>"
  },
  {
    name: "Recipe: Cleansing", ritual: "corruption", slot: "pack", weight: 1, value: 300, kind: "Recipe",
    text: "Lore, Progress 4, Pressure 4. Removes Taint, or one Corruption. Needs a healer or a temple.",
    description: "<p>Published in core-rules 8 as <em>a downtime challenge (Lore, Progress 4)</em> "
      + "before any of this existed, and the numbers here are those numbers. The easiest of the "
      + "four, and the one a town can actually provide.</p>"
  }
];

/* -------------------------------------------- */
/*  Formulas                                    */
/* -------------------------------------------- */

/**
 * Four Elemental formulas, and they are here for one reason: they are the combo mechanic running.
 * Rain sets the opening, and the other three read it in the three different ways a `when` clause is
 * allowed to (data/cards.mjs) -- more damage, a harder save, and nothing at all.
 *
 * Together they cost 6 spell slots, which is three times what a first Way of Mind node grants
 * (core-rules 4). That is the honest price of a combo and the reason slot progression is a reward
 * worth having: the pair is what the extra slots are FOR.
 */
export const FORMULAS = [
  {
    name: "Rain", strength: 2, kind: "formula", source: "Elemental Magic", element: "water",
    description: "<p>A squall out of nothing, over three squares, and the water does not care who "
      + "it lands on. It is not an attack and nothing resists it.</p>",
    // No verb: a step with a condition and no verb IS the condition, and an opening never saves.
    effect: {
      range: 4, area: 3, areaKind: "blast",
      condition: "wet", duration: 1,
      text: "no damage"
    }
  },
  {
    name: "Lightning", strength: 2, kind: "formula", source: "Elemental Magic", element: "storm",
    description: "<p>Reads a Wet target two ways at once: harder to shrug off, and it hurts more. "
      + "Against a dry one it is still a Cast that tries to stun, which is the point &mdash; the "
      + "opening sharpens the card, it does not switch it on.</p>",
    effect: {
      verb: "cast", range: 4,
      condition: "stunned", duration: 1, resist: "lore", dc: 7,
      when: { needs: "wet", mod: 2, dc: 9 }
    }
  },
  {
    name: "Frost", strength: 1, kind: "formula", source: "Elemental Magic", element: "frost",
    description: "<p>One target, one round, no damage. Against a Wet target the water is already "
      + "there to freeze, so the save goes from Normal to Heroic and nothing else changes.</p>",
    effect: {
      range: 3,
      condition: "slowed", duration: 1, resist: "agility", dc: 5,
      when: { needs: "wet", dc: 9 }
    }
  },
  {
    name: "Scorch", strength: 1, kind: "formula", source: "Elemental Magic", element: "fire",
    description: "<p>Carries no combo clause at all, and is still the proof that an opening is not "
      + "always worth having: water and fire cancel, so a Wet target takes the Cast and sheds the "
      + "Burning. The interaction is on Burning, where the rules put it.</p>",
    effect: { verb: "cast", range: 4, condition: "burning", duration: 1 }
  }
];

/* -------------------------------------------- */
/*  Encounters                                  */
/* -------------------------------------------- */

/**
 * Measured against one starter Warrior, so these are a tuning yardstick rather than a party
 * difficulty table. A mixed group is a tier harder than a uniform one of the same size.
 */
/**
 * The one Shadow Magic formula the documents specify, here because `wilds` would otherwise be a
 * field with nothing in it. Its teleport is a sentence: **movement is manual everywhere in this
 * engine** (core-rules 12), so a step across the room is adjudicated exactly as a Move 3 is.
 *
 * What is NOT a sentence is the price, and that is the point of carrying it.
 */
export const SHADOW_FORMULAS = [
  {
    name: "Step Through", strength: 2, kind: "formula", source: "Shadow Magic",
    wilds: 1,
    needs: ["a Wild that leaves the fate deck when you sleep"],
    description: "<p>You are in the shadow, and then you are in another one. Every reach into the "
      + "dark leaves something of the dark in you: a <strong>Wild</strong> card joins your fate "
      + "deck, and it does not leave until you have slept.</p>",
    effect: { text: "teleport to any shadowed square you can see" }
  }
];