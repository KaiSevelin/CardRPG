/**
 * The levelling graph, as data. Every node, what it costs, what it needs and what it
 * hands over -- `graph.mjs` is what reads it.
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */

/* -------------------------------------------- */
/*  The levelling graph                         */
/* -------------------------------------------- */

/**
 * Nodes (rules/leveling.md 9). Content, not code: the engine in graph.mjs reads this, and nothing
 * here knows how eligibility works.
 *
 *   id         stable and namespaced; an add-on depends on it, so it is renamed about as freely
 *              as a database column (leveling 8)
 *   after[]    the nodes this may follow. ANY ONE of them being owned is enough, unless `all`
 *   all        true when every prerequisite is required -- how depth takes commitment, and what
 *              keeps a cross edge from laundering an exclusive choice (leveling 1)
 *   title      the title this confers, if it is a major node
 *   exclusive  the exclusion family, and `creed` the religion within it (leveling 3)
 *   grants     the reward, fixed. Numbers flow into prepareDerivedData beside the ones features
 *              and worn items grant; nothing is copied onto the sheet, so a corrected node fixes
 *              every character who took it (leveling 9)
 *   bespoke    content written for this node and nowhere else. Two minor nodes in three are NOT
 *              bespoke: they draw on a pool, which is the content budget leveling 1 sets
 *
 * All four Ways are built. `exclusive` and `creed` were written for Way of Faith and sat unused
 * until it existed; the twelve gods are their first content, and the religion is the group.
 *
 * The cross edges are the part worth reading twice. A cross edge is an edge like any other, so it
 * carries its own minor nodes. Attach one straight to the far title and a Cutpurse reaches Gambler
 * two levels sooner than a Duellist does, which is the shortcut leveling 1 forbids; attach it to
 * the far title's own lead-in minors and you have handed out Gambler's run without Gambler. So each
 * crossing is a short chain of its own: the Dream Guild teaches you, and being taught takes levels.
 */
export const NODES = [
  { id: "root", name: "Root", after: [] },

  /* --- the four Ways, all of them on your frontier for life (leveling 6) --- */
  {
    id: "shade", name: "Way of Shade", after: ["root"], title: "Shade",
    axis: "Position", resource: "halves"
  },
  {
    id: "strength", name: "Way of Strength", after: ["root"], title: "Warrior",
    axis: "Position", resource: "weight"
  },
  /*
   * **Both of these grant two slots, and neither did.** way-cards 1.4 says it in one line -- *a
   * first Way of Mind or Way of Faith node grants 2 spell slots* -- and `spellSlots.base` starts
   * at 0 for everyone, so a character who had walked into Way of Mind could prepare nothing at
   * all. Two is the smallest number that is a decision: one strength-2 formula, or two 1s.
   */
  {
    id: "mind", name: "Way of Mind", after: ["root"], title: "Scholar",
    axis: "Preparation", resource: "spell slots",
    grants: { spellSlots: 2 }
  },
  {
    id: "faith", name: "Way of Faith", after: ["root"], title: "Sworn",
    axis: "Support", resource: "an obligation",
    grants: { spellSlots: 2 }
  },

  /* --- the Shade trunk: three ordinary nodes before the first title --- */
  /*
   * A card AND a prune, which section 4 says is how a branch keeps a deck from drifting upward
   * every level without spending a whole level on pruning. It sits on the trunk rather than on the
   * Cutpurse run on purpose: Cutpurse PAYS in deck size, and handing its own branch a prune would
   * refund the price.
   */
  {
    id: "shade.footwork", name: "Footwork", after: ["shade"],
    grants: { card: "Measure", prune: 1 }
  },
  /*
   * **A node that teaches a tool training issues the tool.**  **[BUILT 2026-11-08]**
   *
   * leveling.md 4 describes a training as *a tool type, at the full bonus* -- and an uncapped
   * bonus on a tool nobody owns is a reward worth nothing until somebody goes shopping. The suite
   * already counts the trainings that **change no number anywhere**; for the six that do reach a
   * tool, the number only existed if the character happened to have bought it.
   *
   * So: one sentence applied seven times rather than seven gifts. **Trained and issued.** Every
   * one is a tool between 5 and 30 gold -- the cheap end of the catalogue -- because what is being
   * fixed is a reward that read as empty, not a reward that was too small.
   *
   * **It stops at tools, deliberately.** A service weapon or a suit of armour is the obvious next
   * thought, and the answer is no: a weapon and armour are **measured** numbers -- Plate wins
   * 100.0% of the published fights -- so issuing one moves the fight this whole game is balanced
   * against, and would want measuring before it wanted writing. A tool changes a check nobody has
   * simulated and caps at +2. The line is between a number this project has pinned and one it has
   * not, which is the only line worth drawing here.
   *
   * **And not on a crossing**, which is where this first went wrong. leveling.md 1 prices a crossing
   * in *access, not in grants* -- the cards are behind the title it opens -- and two of the seven
   * nodes that teach a tool training are crossings. Issuing there put the reward curve flat between
   * levels 9 and 10, which is how the rule got found: the suite asserts the back half does not
   * taper, and an item is worth as much as a card.
   */
  { id: "shade.quiet", name: "Quiet Hands", after: ["shade.footwork"],
    grants: { item: "Lockpicks", training: "lockpicks", expertise: "shadow" } },
  { id: "shade.patience", name: "Patience", after: ["shade.quiet"], grants: { health: 1 } },

  /* --- the three titles off the trunk --- */
  {
    id: "shade.thief", name: "Thief", after: ["shade.patience"], title: "Thief",
    axis: "Control", resource: "a slot kept free",
    signature: "The Opening", tactic: "Never Where You Looked",
    grants: { feature: "The Opening" }
  },
  {
    id: "shade.scout", name: "Scout", after: ["shade.patience"], title: "Scout",
    axis: "Support", resource: "being alone",
    signature: "Point Man", tactic: "Furthest Forward",
    grants: { card: "Point Man" }
  },
  {
    id: "shade.duellist", name: "Duellist", after: ["shade.patience"], title: "Duellist",
    axis: "Reactions", resource: "halves",
    signature: "Named", tactic: "One at a Time",
    grants: { card: "Named" }
  },

  /* --- Thief's three --- */
  { id: "shade.thief.wait", name: "The Wait", after: ["shade.thief"], grants: { card: "Cut and Run" } },
  {
    id: "shade.thief.shadowing", name: "Shadowing", after: ["shade.thief.wait"], bespoke: true,
    grants: { knowHow: "following someone through a city without being seen",
      feature: "Quiet Worker" }
  },
  {
    /*
     * The one node in the graph that requires ALL of its prerequisites, which is leveling 5a's
     * "depth takes commitment" made real: specializations.md says a dabbler reaches the first node
     * of anything and only an investment reaches Assassin, so Assassin wants two of Thief's three
     * runs walked rather than one. It is also the only content that exercises the `all` flag, and
     * an untested flag is a flag that does not work.
     */
    id: "shade.assassin.held", name: "The Held Knife", after: ["shade.assassin"],
    grants: { card: "The Held Knife" }
  },
  {
    id: "shade.assassin", name: "Assassin", all: true,
    after: ["shade.thief.shadowing", "shade.thief.crowds"], title: "Assassin",
    axis: "Tempo", resource: "Spent",
    signature: "One Opening", tactic: "From Behind",
    grants: { card: "One Opening" }
  },

  { id: "shade.thief.crowds", name: "Crowds", after: ["shade.thief"], grants: { card: "Second Knife" } },
  {
    /* specializations.md demotes Fence to a cluster of minor nodes on the way to Cutpurse. */
    id: "shade.thief.fence", name: "Fence", after: ["shade.thief.crowds"], bespoke: true,
    grants: { knowHow: "valuing stolen goods, and the contact who buys them", training: "appraisal" }
  },
  {
    id: "shade.cutpurse", name: "Cutpurse", after: ["shade.thief.fence"], title: "Cutpurse",
    axis: "Deck shape", resource: "deck size",
    signature: "Lift", tactic: "Light Fingers",
    grants: { card: "Lift" }
  },

  { id: "shade.thief.ropework", name: "Ropework", after: ["shade.thief"], grants: { item: "Climbing Rope", training: "rope and climbing" } },
  { id: "shade.thief.night", name: "Night Work", after: ["shade.thief.ropework"],
    grants: { carry: 1, mastery: "shadow" } },
  {
    id: "shade.burglar", name: "Burglar", after: ["shade.thief.night"], title: "Burglar",
    axis: "Preparation", resource: "weight",
    signature: "The Kit", tactic: "Through the Window",
    grants: { item: "The Kit" }
  },

  /* --- Scout's two --- */
  { id: "shade.scout.ranges", name: "Ranges", after: ["shade.scout"], grants: { card: "Call the Shot" } },
  { id: "shade.scout.breathing", name: "Breathing", after: ["shade.scout.ranges"], grants: { health: 1 } },
  {
    id: "shade.archer", name: "Archer", after: ["shade.scout.breathing"], title: "Archer",
    axis: "Position", resource: "range",
    signature: "Loose and Step", tactic: "Overwatch",
    grants: { card: "Loose and Step" }
  },
  /*
   * **[BUILT 2026-11-09] The held shot, one node past each of the three ranged titles.**
   *
   * All three of Archer, Musketeer and Artillerist were graph LEAVES, which is the honest place
   * for this: a card whose whole value is a reaction nobody else in the game can make should be
   * the last thing a specialist reaches, not something a generalist picks up on the way past.
   *
   * The Archer's own Tactic has been called **Overwatch** since the title was written, and said
   * *once a round, when an enemy ends its movement in your line of sight and within range, Strike
   * it as a reaction* -- with no trigger in the engine that could ever raise it. The mechanism
   * exists now, and these are the cards that hold it.
   */
  { id: "shade.archer.held", name: "At Full Draw", after: ["shade.archer"],
    grants: { card: "At Full Draw" } },

  { id: "shade.scout.groundwork", name: "Groundwork", after: ["shade.scout"],
    grants: { restTokens: 1, expertise: "wits" } },
  {
    /* And Spy, the second of the three demoted professions. */
    id: "shade.scout.spy", name: "Spy", after: ["shade.scout.groundwork"], bespoke: true,
    /* The same tongue from the other side: a scholar reads Imperial and a spy speaks it. Two
     * nodes may teach one language, and `learned` dedupes them (data/actors.mjs). */
    grants: { knowHow: "courts and crowded cities", training: "disguise", language: "Imperial" }
  },
  {
    id: "shade.trapmaker", name: "Trapmaker", after: ["shade.scout.spy", "shade.cross.wire"],
    title: "Trapmaker",
    axis: "Preparation", resource: "a turn spent early",
    signature: "Set", tactic: "The Ground You Chose",
    grants: { card: "Set" }
  },

  /* --- Duellist's four --- */
  { id: "shade.duellist.balance", name: "Balance", after: ["shade.duellist"], grants: { card: "Light Feet" } },
  { id: "shade.duellist.tumbling", name: "Tumbling", after: ["shade.duellist.balance"],
    grants: { knowHow: "falling", feature: "Light Step" } },
  {
    id: "shade.acrobat", name: "Acrobat", after: ["shade.duellist.tumbling", "shade.cross.ledges"],
    title: "Acrobat", axis: "Position", resource: "weight",
    signature: "Over and Past", tactic: "Never Cornered",
    grants: { card: "Over and Past" }
  },

  { id: "shade.duellist.timing", name: "Timing", after: ["shade.duellist"], grants: { card: "Mock" } },
  {
    /* Politician, the third. It sits on the way to Bard, which is where the room already was. */
    id: "shade.duellist.politician", name: "Politician", after: ["shade.duellist.timing"], bespoke: true,
    /*
     * **This node paid twice for one idea and one of the payments was nought.** It granted a
     * know-how about a room that has made up its mind AND a training in `oratory`, and no tool in
     * the catalogue names oratory -- so skill-rules 2's cap could never bite and the training
     * changed no number. Dropping it would have left the node paying once; what replaced it is the
     * reward the situation was already asking for.
     *
     * **A mastery was the obvious replacement and a declared rule says no.** A politician's edge is
     * that they read a room without being asked, which is a mastery exactly -- but masteries are
     * **one per Way** and expertises **two per Way**, on purpose: *every Way scales its own
     * approaches, and nobody scales all six.* Shade has both of each already, so the fitting reward
     * was the unavailable one, and an invariant that only holds until it is inconvenient is not an
     * invariant.
     *
     * **A language is the rung-1 reward the node can have, and it is the right one anyway.**
     * leveling 4 places a language *where its speakers are studied* and calls Imperial *the
     * diplomatic lingua franca*; a politician speaking it needs no further argument. Two nodes
     * already teach it -- a scholar's *Letters* and a spy's *Spy* -- and a language granted twice is
     * one language, because `learned` dedupes, so a third teacher costs nothing. The Duellist run
     * is the only route to this node and it passes neither of the other two.
     */
    grants: { knowHow: "a council chamber that has already decided", language: "Imperial" }
  },
  {
    id: "shade.bard", name: "Bard", after: ["shade.duellist.politician"], title: "Bard",
    axis: "Reactions", resource: "someone else's turn",
    signature: "Heckle", tactic: "The Running Commentary",
    grants: { card: "Heckle" }
  },

  { id: "shade.duellist.nerve", name: "Nerve", after: ["shade.duellist"], grants: { health: 1 } },
  {
    id: "shade.duellist.cards", name: "Card Sense", after: ["shade.duellist.nerve"], bespoke: true,
    grants: { knowHow: "games of chance, and who is cheating at them" }
  },
  {
    id: "shade.gambler", name: "Gambler", after: ["shade.duellist.cards", "shade.cross.odds"],
    title: "Gambler", axis: "Deck shape", resource: "the fate deck",
    signature: "Double or Nothing", tactic: "The Long Odds",
    grants: { card: "Double or Nothing" }
  },

  { id: "shade.duellist.letters", name: "Letters", after: ["shade.duellist"], grants: { training: "reading" } },
  {
    id: "shade.duellist.formula", name: "The First Formula", after: ["shade.duellist.letters"],
    bespoke: true, grants: { spellSlots: 1 }
  },
  {
    id: "shade.half-mage", name: "Half-mage", after: ["shade.duellist.formula"], title: "Half-mage",
    axis: "Preparation", resource: "spell slots",
    signature: "One Trick", tactic: "One Hand Free",
    grants: { spellSlots: 2, feature: "One Trick" }
  },

  /*
   * --- the three cross edges, each a short chain of its own
   *
   * None of them grants a card. A crossing teaches you about the other trade; the cards are behind
   * the title, which is the whole of leveling 1's "a cross edge to a title is cheap, past one is
   * the leak".
   */
  { id: "shade.cross.odds1", name: "The Tables", after: ["shade.cutpurse"], grants: { training: "games of chance" } },
  {
    id: "shade.cross.odds", name: "Long Odds", after: ["shade.cross.odds1"], bespoke: true,
    grants: { knowHow: "which of the Guild's tables are honest" }
  },

  { id: "shade.cross.wire1", name: "Tripwire", after: ["shade.burglar"], grants: { training: "traps" } },
  {
    id: "shade.cross.wire", name: "The Second Door", after: ["shade.cross.wire1"], bespoke: true,
    grants: { knowHow: "where a house is weakest from the inside" }
  },

  { id: "shade.cross.ledges1", name: "Ledges", after: ["shade.burglar"], grants: { carry: 1 } },
  {
    id: "shade.cross.ledges", name: "Rooftops", after: ["shade.cross.ledges1"], bespoke: true,
    grants: { knowHow: "rooftops, and what carries weight up there" }
  }
,
/* --- the Strength trunk: three ordinary nodes before the first title --- */
  /* Expertise sits where a Way already teaches that kind of work, two per Way, in the
   * approaches skill-rules 1 says the Way is thick in. */
  /*
   * **A menu on the martial side, for the reason 4a built one on the caster side.**
   * **[BUILT 2026-11-07]**
   *
   * leveling 4a opens on *a pool larger than the nodes that draw on it is a menu nobody can order
   * from*, and it measured that against the spell lists: 147 formulas, three nodes a branch, 95 of
   * them on no node at all. The same section then calls a named grant *the right shape for a card
   * pool, where a Way's thirteen cards meet about twenty pool nodes* -- and **that sentence has
   * expired.** The martial pools hold **35** cards and **21 are on no node at all**: four of the
   * six common, nine of the fourteen Shade, eight of the fifteen Strength. Six in ten.
   *
   * So the condition is the one 4a was written for, and the answer it gives is a menu rather than
   * a card-placement pass -- its own words: *a menu node is one more node on each branch, not a
   * rewrite of the ones there.* Twenty-one named grants would have been that rewrite, and 5b's
   * curve would have had to be re-tilted around them.
   *
   * **Directly behind the Way's own title, because that is the checked rule and the first draft
   * broke it twice.** These were written hanging off all three tier-1 titles of each Way, to land
   * at level 6 in the middle band rather than on the trunk 5b records as the richest. Two rules
   * said no: a menu *sits directly behind the title whose list it offers* -- 4a's reasoning from a
   * caster's **first day** with a school -- and an edge arriving at a **minor** node from three
   * branches is a crossing arriving past a title, which 1 refuses. `faith.ordination` gets away
   * with twelve predecessors because it is a door into one room that every god opens; a menu is not
   * that shape.
   *
   * So level **2**, which is a fighter's first day with their Way, and one predecessor each.
   *
   * **The common pool keeps named grants only**: a menu sits behind the title whose list it offers
   * and the common pool is nobody's title. Its four unplaced cards stay a smaller, separate gap.
   */
  { id: "shade.repertoire", name: "What You Favour", after: ["shade"],
    grants: { choose: { from: "Shade" } } },
  /* The Strength half of the pair above: same shape, same level, its own list. */
  { id: "strength.repertoire", name: "What You Lean On", after: ["strength"],
    grants: { choose: { from: "Warrior" } } },

  { id: "strength.drill", name: "Drill", after: ["strength"],
    grants: { card: "Hold the Line", expertise: "might" } },
  /*
   * **The deck cap had never been granted by anything, and this is the Way it belongs to.**
   *
   * `deckMax` is on leveling.md 4's reward list, it is named in 1 among the generic pool, the
   * accumulator has carried it since the data model was written, and **no node in the graph used
   * it** -- one wonder did (*Deep Pockets*) and that was all. Way of Shade's `footwork` puts a
   * prune on its trunk so every Shade gets one chance to drop a dead card; Strength had the mirror
   * of that reward available and empty. Shade refines its deck, Strength adds to it.
   *
   * **It goes on the March because a soldier who has marched can keep going longer**, so this node
   * grants the two things a march gives you: weight and stamina.
   *
   * > **[2026-11-12]** This paragraph used to reach that conclusion through *your action deck is
   * > your stamina*, quoting the sentence core-rules 8 no longer contains. The grant was corrected
   * > the day the rule changed and the reasoning above it was not, which is the drift this project
   * > keeps finding: a fact written in two places is a second fact. The measurement below prices a
   * > **deck cap**, which this node has not granted since that day -- it is kept as the record of
   * > why the grant moved, and reads as history rather than as a price.
   *
   * > **[MEASURED 2026-11-07] A deck cap is worth +1.5 to +4.3 in a brawl, nothing if you fill it
   * > badly, and it is NEGATIVE in a chase.** Against the published encounters (3000 fights, seed
   * > 1), filling the extra slots with the deck's best card: **+1.5** at 18 cards, **+3.3** at 20,
   * > **+4.3** at 22. Filling them with a card that does nothing in that fight: **+0.6**, **+0.1**,
   * > **-1.8** -- so the cap is permission rather than power, which is exactly what 8's grow/prune
   * > tension says it should be.
   * >
   * > **And against two spears and two bows it loses money even filled well**: 40.5 at sixteen
   * > cards, 37.6 at eighteen, 36.5 at twenty-two. The reason is the published one -- *mobility is
   * > the most valuable thing in a starter deck* -- and a bigger deck draws your one Move card less
   * > often. A cap is therefore worth most to the Way that stands and fights and worth less than
   * > nothing to the Way that has to close a gap, which is the strongest argument available for
   * > putting it here and not on the Shade trunk.
   * >
   * > **2 rather than 1** because one card measures at about +0.75, which is thin for a rung-2
   * > reward; two lands it level with the prune it mirrors.
   */
  { id: "strength.march", name: "The March", after: ["strength.drill"],
    grants: { carry: 5, stamina: 1 } },
  { id: "strength.scars", name: "Old Scars", after: ["strength.march"], grants: { health: 1 } },

  /* --- the three titles off the trunk: how you stand, how you strike, who you stand in front of --- */
  {
    id: "strength.infantry", name: "Infantry", after: ["strength.scars"], title: "Infantry",
    axis: "Position", resource: "an ally",
    signature: "Shoulder to Shoulder", tactic: "The Line",
    grants: { card: "Shoulder to Shoulder" }
  },
  {
    id: "strength.executioner", name: "Executioner", after: ["strength.scars"],
    title: "Executioner", axis: "Tempo", resource: "halves",
    signature: "Cleave to the Bone", tactic: "No Second Thought",
    grants: { feature: "Cleave to the Bone" }
  },
  {
    id: "strength.gladiator", name: "Gladiator", after: ["strength.scars"], title: "Gladiator",
    axis: "Reactions", resource: "Health",
    signature: "Play to the Crowd", tactic: "The Crowd Wants Blood",
    grants: { card: "Play to the Crowd" }
  },

  /* --- Infantry's four --- */
  { id: "strength.infantry.shields", name: "Shieldwork", after: ["strength.infantry"], grants: { card: "Shoulder Check" } },
  {
    id: "strength.infantry.watch", name: "The Watch", after: ["strength.infantry.shields"],
    bespoke: true, grants: { knowHow: "standing a watch, and what the night sounds like" }
  },
  {
    id: "strength.guardian", name: "Guardian", after: ["strength.infantry.watch"],
    title: "Guardian", axis: "Reactions", resource: "a slot kept free",
    signature: "The Wall", tactic: "The Door",
    grants: { feature: "The Wall" }
  },

  /* Mastery is the deeper step and raises what you notice rather than what you can push, so
   * one per Way, behind a title rather than on a trunk. */
  { id: "strength.infantry.load", name: "Load-Bearing", after: ["strength.infantry"],
    grants: { carry: 10, mastery: "might" } },
  {
    id: "strength.infantry.armoury", name: "Armoury", after: ["strength.infantry.load"],
    bespoke: true, grants: { item: "Repair Kit", training: "armour and its repair", knowHow: "what a dent means" }
  },
  {
    id: "strength.ironclad", name: "Ironclad", after: ["strength.infantry.armoury"],
    title: "Ironclad", axis: "Deck shape", resource: "weight",
    signature: "Nothing Gets Through", tactic: "Immovable",
    grants: { feature: "Nothing Gets Through" }
  },

  { id: "strength.infantry.crews", name: "Crews", after: ["strength.infantry"], grants: { card: "Heave" } },
  {
    id: "strength.infantry.siege", name: "Siegework", after: ["strength.infantry.crews"],
    bespoke: true, grants: { training: "siege engines" }
  },
  {
    id: "strength.artillerist", name: "Artillerist", after: ["strength.infantry.siege"],
    title: "Artillerist", axis: "Position", resource: "ground",
    signature: "Ranging Shot", tactic: "Ranging",
    grants: { card: "Ranging Shot" }
  },

  { id: "strength.infantry.orders", name: "Orders", after: ["strength.infantry"], grants: { card: "Shield Wall" } },
  {
    id: "strength.infantry.maps", name: "Maps", after: ["strength.infantry.orders"],
    bespoke: true, grants: { knowHow: "ground you have not walked, from a map of it" }
  },
  {
    id: "strength.tactician", name: "Tactician", after: ["strength.infantry.maps"],
    title: "Tactician", axis: "Support", resource: "halves",
    signature: "On My Call", tactic: "The Call",
    grants: { card: "On My Call" }
  },

  /* --- Executioner's three --- */
  /*
   * **The one dead training kept on purpose.** `riding` is the only one of the seventeen that is
   * not waiting on a tool or on a reward kind: it waits on **mounts**, which core-rules 12 leaves
   * open and tangles with figure size (conditions.md 4.2). Converting it would spend the decision
   * before it is made, so the training stays and the node stops paying nothing: the know-how is
   * what a rider knows that no saddle gives them.
   */
  { id: "strength.exec.seat", name: "The Seat", after: ["strength.executioner"],
    grants: { training: "riding", knowHow: "a long ride, and what it costs the animal" } },
  {
    id: "strength.exec.stable", name: "Stablework", after: ["strength.exec.seat"],
    /* Reading an animal that has decided something is Wits, and this node already says so. */
    bespoke: true, grants: { knowHow: "a horse that is about to refuse", feature: "Quick Eye" }
  },
  {
    id: "strength.knight", name: "Knight", after: ["strength.exec.stable"], title: "Knight",
    axis: "Position", resource: "gear you can lose",
    signature: "The Lance", tactic: "The Charge",
    grants: { card: "The Lance" }
  },

  { id: "strength.exec.temper", name: "Temper", after: ["strength.executioner"], grants: { card: "Hammerblow" } },
  /*
   * **The first reward in the graph that takes something away, and the name said it first.**
   * **[BUILT 2026-11-12]**
   *
   * leveling 4 had no row for hand size at all, and the validator pinned the absence shut as a
   * decision rather than an oversight: *a key with no reward row is the correct state for a reward
   * too expensive to print.* It was too expensive because it is the dearest stat measured anywhere
   * here -- a card of it is **+0.8 / +4.0 / +7.4 / +9.6** across the four published encounters,
   * which is above every member of rung 2 and most of rung 3.
   *
   * **Priced, it fits a node.** At **-1 stamina** -- a card more in your hand, a card fewer you
   * may play -- it measures **+0.3 / +2.1 / +2.6 / +4.5**, which is about one point of Health:
   * below both of its rung-2 neighbours on three encounters and level with them on the fourth. The
   * two halves simply add (predicted +0.1/+1.7/+2.5/+4.9), so the price does what it says and
   * nothing else. At **-2** it goes negative or flat on all four and becomes a trap row, which is
   * the measurement that matters most here: the intuitive price was the wrong one.
   *
   * **And the price is paid in tempo, not in defence.** Reactions do not move (4.60 -> 4.62);
   * breaths do (1.53 -> 1.81 on the Deadly encounter). So the node reads as *a better hand, bought
   * with a third of a turn spent standing still* -- which is why it sits on the **Executioner**
   * run, whose axis is Tempo and whose resource is halves. The axis is stated in the grants.
   *
   * **Fury, which used to grant a point of Health.** The name was doing nothing mechanical and now
   * carries the whole trade: you hold more and you last less. It keeps its place on the curve and
   * loses half a rung, which the scorer reads honestly and the measurement says is about right.
   */
  { id: "strength.exec.fury", name: "Fury", after: ["strength.exec.temper"],
    grants: { handSize: 1, stamina: -1 } },
  {
    id: "strength.berserker", name: "Berserker",
    after: ["strength.exec.fury", "strength.cross.rage"], title: "Berserker",
    axis: "Deck shape", resource: "Spent",
    signature: "Red Mist", tactic: "Forward Only",
    grants: { card: "Red Mist" }
  },

  { id: "strength.exec.powder", name: "Powder", after: ["strength.executioner"], grants: { card: "Two-Hand It" } },
  {
    id: "strength.exec.drillshot", name: "The Volley", after: ["strength.exec.powder"],
    bespoke: true, grants: { training: "firearms and their cleaning" }
  },
  {
    id: "strength.musketeer.held", name: "On the Rest", after: ["strength.musketeer"],
    grants: { card: "On the Rest" }
  },
  {
    id: "strength.musketeer", name: "Musketeer", after: ["strength.exec.drillshot"],
    title: "Musketeer", axis: "Preparation", resource: "range",
    signature: "Loaded Before the Bell", tactic: "The Firing Step",
    grants: { feature: "Loaded Before the Bell" }
  },

  /* --- Gladiator's two --- */
  { id: "strength.glad.hands", name: "Bare Hands", after: ["strength.gladiator"],
    grants: { card: "Pull Them Down", expertise: "agility" } },
  {
    id: "strength.glad.alley", name: "Alley Work", after: ["strength.glad.hands"],
    bespoke: true, grants: { knowHow: "a crowd that is about to turn", feature: "Good Name" }
  },
  {
    id: "strength.street-fighter", name: "Street Fighter", after: ["strength.glad.alley"],
    title: "Street Fighter", axis: "Control", resource: "a weapon's value",
    signature: "Get a Grip", tactic: "The Alley",
    grants: { card: "Get a Grip" }
  },

  { id: "strength.glad.ward", name: "Warding", after: ["strength.gladiator"], grants: { card: "Beat the Blade" } },
  { id: "strength.glad.shadow", name: "The Shadow", after: ["strength.glad.ward"], grants: { health: 1 } },
  {
    id: "strength.bodyguard", name: "Bodyguard",
    after: ["strength.glad.shadow", "strength.cross.door"], title: "Bodyguard",
    axis: "Reactions", resource: "ground",
    signature: "Interpose", tactic: "Never Leave Them",
    grants: { card: "Interpose" }
  },

  /*
   * --- the two crossings, each its own short chain
   *
   * Guardian to Bodyguard on the axis, Ironclad to Berserker on the axis
   * (specializations.md, Way of Strength). Neither grants a card: a crossing teaches you about the
   * other trade and the cards stay behind the title.
   */
  /* `close protection` was a practice, not a tool type, so it uncapped nothing. What a bodyguard
   * actually has is a situation, and the node after this one already reads a room -- this one reads
   * the people outside it. */
  { id: "strength.cross.door1", name: "One Charge", after: ["strength.guardian"],
    grants: { knowHow: "a crowd at a gate, and who in it is waiting" } },
  {
    id: "strength.cross.door", name: "The One You Keep", after: ["strength.cross.door1"],
    bespoke: true, grants: { knowHow: "a room, and which door in it matters" }
  },

  { id: "strength.cross.rage1", name: "Weight of It", after: ["strength.ironclad"], grants: { carry: 5 } },
  {
    id: "strength.cross.rage", name: "Let It Out", after: ["strength.cross.rage1"],
    bespoke: true, grants: { knowHow: "when armour stops being protection" }
  },

  /*
   * --- Way of Mind: the twelve schools
   *
   * Grouped by **what the price takes**, which is way-cards 3.4's own principle -- *what makes a
   * formula belong to its school is not what it does, it is what it costs* -- read one level up. The
   * three trunk schools are the three kinds of creditor:
   *
   *   BLOOD MAGIC   your own substance pays: Health, a bound Taint, an empty hand, your competence
   *   ELEMENTAL     the table pays: coin, a card gone for the fight, a Wild in your luck, a place
   *   SPIRITUALISM  a person pays, and remembers: a debt, a secret, a pact, a prophecy
   *
   * **This Way has no cross edges, and that is a decision rather than an omission**
   * (leveling.md 1): the only ones worth wanting would arrive at a school's deeper nodes, which is
   * formulas without the school's cost -- the forbidden kind. Shade and Strength cross because
   * their content is cards and a card is a card; Mind's content IS its price.
   */

  /* --- the Mind trunk: three ordinary nodes before the first school ---
   *
   * **The trunk carries the slot ladder, and the two casting Ways carry the same one.** Strength
   * is the slot cost (way-cards 1.4), so the trunk is the only place a slot can be granted and be
   * certain to arrive: on a school node it reaches one school, on a god's branch one god. Two at
   * the root and one on each of the three trunk nodes is five by the time a caster holds a list
   * written to five -- which is 3.4's thesis formula prepared alone and nothing beside it, exactly
   * the way 1.4 says a 5 should read.
   */
  {
    id: "mind.letters", name: "Letters", after: ["mind"],
    /* **Imperial** is *the old language and the diplomatic lingua franca* (worldinfo/Firma.md), so
     * it belongs where reading does: the first node of the scholar's trunk teaches the alphabet
     * that everything else in this Way is written in. */
    grants: { training: "reading and writing", spellSlots: 1, language: "Imperial",
      expertise: "lore" }
  },
  /*
   * --- ritual magic: three ordinary nodes off Letters ---
   *
   * **Off `mind.letters` and nowhere else, because that node grants *reading and writing*** and
   * the world document's gate for this entire school is *"anyone literate can do it"*
   * (specializations.md). The prerequisite was already in the graph; nothing had hung off it.
   *
   * **Ordinary nodes and not a title**, which is the same finding specializations.md records for
   * the crafts: a major node is a fighting identity, and ritual magic is explicitly not one -- it
   * sits outside the Way's count of twelve for that reason. What it is instead is a thing to be
   * between fights, and skill-rules puts those on minor nodes.
   *
   * Each grants a **recipe**, which is an item. That is the whole mechanism: the gate on a ritual
   * is the recipe rather than the caster, so handing one over is how a graph rewards this at all.
   * A spell slot would have been the wrong currency -- a ritual is never prepared and never cast.
   */
  {
    id: "mind.ritual", name: "The Recipe Book", after: ["mind.letters"],
    grants: { item: "Recipe: Mending", training: "ritual magic" }
  },
  {
    id: "mind.ritual.nights", name: "Quiet Nights", after: ["mind.ritual"],
    grants: { item: "Recipe: Quiet Night" }
  },
  {
    id: "mind.ritual.knots", name: "Knots and Bindings", after: ["mind.ritual.nights"],
    grants: { item: "Recipe: Unknotting", expertise: "lore" }
  },

  {
    /* The common card a caster gets is the one about spacing, because where to stand is the hard
     * problem this whole Way's Tactics are written about (way-cards 2.5). */
    id: "mind.candle", name: "The Candle", after: ["mind.letters"],
    grants: { card: "Measure", spellSlots: 1 }
  },
  {
    /*
     * A prune, and the reasoning is the exact mirror of Shade's. Cutpurse pays in deck size, so a
     * prune on its branch would refund the price; a caster's power is not in their action deck at
     * all, so thinning it costs this Way nothing and is pure gain. The same reward reads as a
     * refund in one Way and as a gift in another, which is what it means for a price to be real.
     */
    id: "mind.vigil", name: "The Long Vigil", after: ["mind.candle"],
    grants: { spellSlots: 1, prune: 1 }
  },

  /* --- the three schools off the trunk --- */
  {
    id: "mind.blood", name: "Blood Magic", after: ["mind.vigil"], title: "Blood Magic",
    axis: "Tempo", resource: "your own Health",
    signature: "Blood Price", tactic: "Your Own Blood Is Nearest",
    /* **Demonic**, because blood is the currency it is spoken in: the demons hold the Third Side
     * and let the necromancers use it *in exchange for human sacrifices* (Firma.md). The school
     * whose price is its own Health is the school that can afford the conversation. */
    grants: { spell: "Blood Price", language: "Demonic" }
  },
  {
    id: "mind.elemental", name: "Elemental Magic", after: ["mind.vigil"], title: "Elemental Magic",
    axis: "Position", resource: "reagents",
    signature: "Wall of the Sphere", tactic: "The Sphere Holds",
    grants: { spell: "Wall of the Sphere" }
  },
  {
    id: "mind.spiritualism", name: "Spiritualism", after: ["mind.vigil"], title: "Spiritualism",
    axis: "Preparation", resource: "a pact",
    signature: "The Bargain", tactic: "Something Is Always Listening",
    grants: { spell: "The Bargain" }
  },

  /* --- Blood's three --- */
  {
    id: "mind.blood.vein", name: "The Vein", after: ["mind.blood"],
    grants: { spell: "Open the Vein" }
  },
  {
    id: "mind.blood.anatomy", name: "Anatomy", after: ["mind.blood.vein"], bespoke: true,
    /* The other half of "treating wounds": a mage who knows what a body is made of can use a
     * Healer's Kit to its printed value, and a training granted twice is one training (actors.mjs
     * dedupes `learned`). */
    grants: { item: "Healer's Kit", knowHow: "what a body is made of, living or dead", training: "treating wounds",
      feature: "Well Read" }
  },
  {
    id: "mind.necromancy", name: "Necromancy", after: ["mind.blood.anatomy"], title: "Necromancy",
    axis: "Preparation", resource: "a bound Taint",
    signature: "Call the Unquiet", tactic: "The Dead Are Furniture",
    /* **Reversed** is *reversed elvish used by undead* (Firma.md), so it is the one language in
     * the world that is a derivation rather than a tongue -- and the school that calls the unquiet
     * is the only one with anybody to practise it on. */
    grants: { spell: "Call the Unquiet", language: "Reversed" }
  },

  {
    id: "mind.blood.fasting", name: "Fasting", after: ["mind.blood"],
    grants: { spell: "Boil" }
  },
  { id: "mind.blood.silence", name: "Silence", after: ["mind.blood.fasting"],
    grants: { health: 1, mastery: "lore" } },
  {
    id: "mind.asceticism", name: "Asceticism", after: ["mind.blood.silence"], title: "Asceticism",
    axis: "Deck shape", resource: "an empty hand",
    signature: "Nothing Left to Take", tactic: "The Still Point",
    grants: { spell: "Nothing Left to Take" }
  },

  {
    id: "mind.blood.doses", name: "Doses", after: ["mind.blood"],
    grants: { spell: "The Second Heartbeat" }
  },
  {
    id: "mind.blood.measures", name: "Measures", after: ["mind.blood.doses"],
    grants: { spell: "The Red Hour" }
  },
  {
    id: "mind.poison", name: "Poison", after: ["mind.blood.measures"], title: "Poison",
    axis: "Control", resource: "skill cards",
    signature: "Wither", tactic: "The Patient Hand",
    grants: { spell: "Wither" }
  },

  /* --- Elemental's three ---
   *
   * These four nodes are why the combo pair is finally reachable. Rain and Lightning have been
   * content since the `when` clause was written, and nothing in the game handed either of them
   * over: they were on the actor because the setup routine put them there. Now they are two nodes
   * on one branch, six slots between them, which is the price way-cards 1.4 says a combo costs.
   */
  { id: "mind.elem.rain", name: "The Rain Sign", after: ["mind.elemental"], grants: { spell: "Rain" } },
  {
    id: "mind.elem.dark", name: "The Dark Sphere", after: ["mind.elem.rain"], bespoke: true,
    grants: { knowHow: "which places hold shadow, and at what hour" }
  },
  {
    id: "mind.shadow", name: "Shadow Magic", after: ["mind.elem.dark"], title: "Shadow Magic",
    axis: "Position", resource: "a permanent Wild",
    signature: "Step Through", tactic: "At Home in the Dark",
    grants: { spell: "Step Through" }
  },

  {
    id: "mind.elem.storm", name: "The Storm Sign", after: ["mind.elemental"],
    grants: { spell: "Lightning" }
  },
  { id: "mind.elem.circles", name: "Circles", after: ["mind.elem.storm"], grants: { spellSlots: 1 } },
  {
    id: "mind.ward", name: "Ward Magic", after: ["mind.elem.circles"], title: "Ward Magic",
    axis: "Reactions", resource: "Spent",
    signature: "Unmake", tactic: "The Standing Guard",
    grants: { spell: "Unmake" }
  },

  {
    id: "mind.elem.frost", name: "The Frost Sign", after: ["mind.elemental"],
    grants: { spell: "Frost" }
  },
  {
    id: "mind.elem.hearth", name: "The Hearth", after: ["mind.elem.frost"],
    grants: { spell: "Scorch" }
  },
  {
    id: "mind.household", name: "Household Magic", after: ["mind.elem.hearth"],
    title: "Household Magic",
    /*
     * specializations.md leaves this one [OPEN]: the out-of-combat schools do not fit a six-axis
     * template built for a fight. It is given **Support / a place you know** rather than left
     * cell-less, because a node with no cell cannot be checked against its siblings at all -- and
     * the honest reading is that a household mage supports a party between fights, which is the
     * same axis the Tactician and the Divinator sit on for different reasons.
     */
    axis: "Support", resource: "a place you know",
    signature: "Hearth and Home", tactic: "The House Helps",
    grants: { spell: "Hearth and Home" }
  },

  /* --- Spiritualism's three --- */
  {
    /* The node is not called "The Small Pact": the spell is, and two pieces of content may not
     * share a name (the check that found Infantry's Signature wearing its Tactic's). */
    id: "mind.spirit.pact", name: "The First Pact", after: ["mind.spiritualism"],
    /* A pact is a negotiation before it is a formula, which is why Presence is what it teaches. */
    grants: { spell: "The Small Pact", expertise: "presence" }
  },
  {
    id: "mind.spirit.debts", name: "Debts", after: ["mind.spirit.pact"], bespoke: true,
    /* **Elvish** is the elves' lingua franca *and most of the lesser gods'* (Firma.md), which is
     * this school's whole subject -- and this node already knows who owes whom among them. */
    grants: { knowHow: "who owes whom among the elf-kin", language: "Elvish" }
  },
  {
    id: "mind.glamour", name: "Glamour", after: ["mind.spirit.debts"], title: "Glamour",
    axis: "Control", resource: "an elven debt",
    signature: "Not Here", tactic: "Never Quite There",
    grants: { spell: "Not Here" }
  },

  {
    id: "mind.spirit.names", name: "Nine Names", after: ["mind.spiritualism"],
    /* **Troll**, because the Troll King is a minor god and *essentially all trolls follow* him
     * (Firma.md): the node that learns the names of spirits learns the tongue of the largest
     * following any of them has. */
    grants: { spell: "The Nine Names", language: "Troll" }
  },
  {
    id: "mind.spirit.skin", name: "Skin and Ink", after: ["mind.spirit.names"],
    grants: { training: "tattooing" }
  },
  {
    id: "mind.tattoo", name: "Tattoo Magic", after: ["mind.spirit.skin"], title: "Tattoo Magic",
    axis: "Deck shape", resource: "a secret",
    signature: "Graven Strength", tactic: "Nothing to Prepare",
    /*
     * A feature, not a spell: a tattoo is never prepared. `grantSlate` has created features since
     * Signatures were written and `SLATES` has always held this one, so the key is the only change.
     *
     * What it SPENDS is not here, and that is a gap rather than an omission. way-cards 3.4 prices
     * this school in capacity -- *a tattoo spends its slots permanently* -- and the obvious shape
     * for it, a negative `spellSlots` on this node, drops Way of Mind's ceiling from six slots to
     * five and leaves one school's list unaffordable to the caster it was written for. That is the
     * Way ladder's arithmetic, not this school's, so all seven cards name the gap and wait.
     */
    grants: { feature: "Graven Strength" }
  },

  {
    id: "mind.spirit.omens", name: "Omens", after: ["mind.spiritualism"],
    grants: { spell: "Hold to the Bargain" }
  },
  {
    id: "mind.spirit.gathered", name: "The Gathered", after: ["mind.spirit.omens"],
    grants: { spell: "The Gathered Pact" }
  },
  {
    id: "mind.divination", name: "Divination", after: ["mind.spirit.gathered"], title: "Divination",
    axis: "Support", resource: "someone else's turn",
    signature: "The Reading", tactic: "Already Seen",
    /* **Valgar** is a *lost* language from the Furnace District (Firma.md), and a lost language is
     * not learned from a speaker. It is read, which is what this school is for. */
    grants: { spell: "The Reading", language: "Valgar" }
  },

  /*
   * --- Way of Faith: twelve gods, and the only Way whose first step closes the others
   *
   * The inverse of every other Way. Shade, Strength and Mind are narrow and deep -- three titles
   * off a trunk and nine behind them. Faith is **wide and shallow**: twelve doors at the top,
   * because here *the choice is the content* (specializations.md).
   *
   * **The religion is the exclusive group**, nested inside the `faith` family: taking a god closes
   * every god of every other religion for good, and leaves your own religion's open. Nothing new
   * was needed for that -- `exclusive` with a `creed` was written for exactly this and has been
   * built and unused since the day it was written. This is its first content.
   *
   * **A religion's size is its price.** Serve a pantheon and you may add its other gods later, a
   * level each, going wider; serve a lone god and you never will -- so a lone god's branch runs
   * **four nodes deeper**, which is how many spare doors The Five has. That is leveling.md 7's
   * depth consistency applied to a Way that spends its depth sideways.
   *
   * Twelve siblings cannot lean on seven axes without repeating, and the pigeonhole principle says
   * so before anyone writes a word. So this Way is distinguished by what it TAKES: twelve
   * different resources, so all twelve cells are distinct on the resource alone.
   */

  /* --- the Faith trunk: three ordinary nodes before the first vow ---
   *
   * The same slot ladder as the Mind trunk above, for the same reason: twelve gods are siblings,
   * so a slot on any one branch is a slot eleven priests never see. The First is untouched by it --
   * its Obedience caps slots at 3 and its list stops at 3, which is the one place in the content
   * where a list and a ceiling were written to each other on purpose.
   *
   * No prune here, and the reason is a god. The Eternal God's Obedience is *your action deck may
   * hold no more than 12 cards*; a prune on the shared trunk would pre-pay that price for a
   * character who has not sworn to him yet, and hand every other priest a reward he has to earn.
   */
  /* `liturgy` is the rite itself, which no tool holds. What vows actually teach is when a rite has
   * gone wrong -- and, the harder half, whether that mattered. */
  { id: "faith.vows", name: "Vows", after: ["faith"],
    grants: { knowHow: "a rite done wrong, and whether it mattered", spellSlots: 1 } },
  {
    id: "faith.pilgrimage", name: "Pilgrimage", after: ["faith.vows"],
    grants: { card: "Hold the Line", spellSlots: 1, expertise: "presence" }
  },
  { id: "faith.calling", name: "The Calling", after: ["faith.pilgrimage"],
    grants: { restTokens: 1, spellSlots: 1 } },

  /* --- the four lone gods: one door, no second god ever, and a branch four nodes deeper --- */
  {
    id: "faith.eternalgod", name: "The Eternal God", after: ["faith.calling"],
    title: "The Eternal God", exclusive: "faith", creed: "eternal-god",
    axis: "Control", resource: "deck size",
    signature: "The Clean Hand", tactic: "No Shelter for the Guilty",
    obedience: "Your action deck may hold no more than 12 cards, and the faith names what may "
      + "not be in it.",
    gift: "Solidarity: his miracles cast on a brother or sister in faith cost one less -- no "
      + "Strain, no Spent.",
    grants: { spell: "The Clean Hand" }
  },
  { id: "faith.eg.rule", name: "The Rule", after: ["faith.eternalgod"], grants: { spell: "Name the Guilty" } },
  { id: "faith.eg.fast", name: "The Fast", after: ["faith.eg.rule"], grants: { health: 1 } },
  {
    id: "faith.eg.office", name: "The Night Office", after: ["faith.eg.fast"],
    grants: { spell: "Steady the Hand" }
  },
  { id: "faith.eg.scripture", name: "Scripture", after: ["faith.eg.office"],
    grants: { training: "the holy books", expertise: "lore" } },
  /*
   * --- the top of a god's ladder sits at the bottom of its branch  [BUILT 2026-11-07]
   *
   * **Strength is the slot cost** (way-cards 1.4), so a god's 4 and its 5 are the two miracles only
   * a caster deep enough to hold five slots can cast at all. They were written and placed on no
   * node, which made the end of every creed branch the weakest part of it: slots, Health, and a
   * know-how. Putting the **4 on the second-deepest node and the 5 on the capstone** fixes both
   * halves at once -- it is the only depth where the slots exist, and it is what leveling 5b means
   * by *the reward climbs with the branch*.
   *
   * Two miracles per god stay unplaced on purpose: the god's menu node (4a) sits at depth 6 and has
   * to have something left to offer.
   */
  { id: "faith.eg.clean", name: "The Clean Body", after: ["faith.eg.scripture"],
    grants: { spellSlots: 1, spell: "The Clean Field" } },
  {
    id: "faith.eg.alms", name: "Alms", after: ["faith.eg.clean"], bespoke: true,
    grants: { knowHow: "which houses of the faith will take you in", spell: "The Body Made Clean" }
  },

  {
    id: "faith.eternalspirit", name: "The Eternal Spirit", after: ["faith.calling"],
    title: "The Eternal Spirit", exclusive: "faith", creed: "eternal-spirit",
    axis: "Reactions", resource: "weight",
    signature: "Breath of the Spirit", tactic: "Where the Air Goes",
    obedience: "You must stay Unburdened, and wear no armour heavier than Leather.",
    gift: "The spirit drifts through all the air: his miracles ignore range and cover.",
    grants: { spell: "Breath of the Spirit" }
  },
  { id: "faith.es.breath", name: "Breath", after: ["faith.eternalspirit"], grants: { spell: "Lay On" } },
  { id: "faith.es.word", name: "The Given Word", after: ["faith.es.breath"], grants: { spell: "A Word for You" } },
  { id: "faith.es.air", name: "The Open Air", after: ["faith.es.word"], grants: { carry: 1 } },
  { id: "faith.es.unseen", name: "The Unseen", after: ["faith.es.air"], grants: { restTokens: 1 } },
  { id: "faith.es.hand", name: "The Open Hand", after: ["faith.es.unseen"],
    grants: { spellSlots: 1, spell: "The Air Between" } },
  {
    id: "faith.es.distance", name: "Distance", after: ["faith.es.hand"], bespoke: true,
    grants: {
      knowHow: "how far a voice carries, and where it will not", mastery: "presence",
      spell: "Breath for the Dying"
    }
  },

  {
    id: "faith.vax", name: "Vax", after: ["faith.calling"], title: "Vax",
    exclusive: "faith", creed: "vax",
    axis: "Position", resource: "Health",
    signature: "The Club and the Line", tactic: "The Line of Vax",
    obedience: "Every miracle costs at least 1 Health, and the card may ask more.",
    /* The second sentence used to carry the design argument for this gift, which the sheet and
     * the handbook both print to a player: nothing else in the game sets aside the free-hand
     * rule, and that is what makes a cleric-fighter possible. True, and not a player's business. */
    gift: "His miracles need no free hand: the spiked club is the holy symbol.",
    grants: { spell: "The Club and the Line", freehandCast: true }
  },
  { id: "faith.vax.club", name: "The Club", after: ["faith.vax"], grants: { spell: "Stand Where I Stand" } },
  { id: "faith.vax.shield", name: "The Shield", after: ["faith.vax.club"], grants: { spell: "The Shield Line" } },
  { id: "faith.vax.ranks", name: "The Ranks", after: ["faith.vax.shield"], grants: { health: 1 } },
  /* Vax is war plainly, and `shield and club` named two weapons rather than a tool type. A soldier
   * of Vax knows the fight nobody chose: close, crowded, and no room to swing. */
  { id: "faith.vax.drill", name: "Drill", after: ["faith.vax.ranks"],
    grants: { knowHow: "a brawl in a confined space", feature: "Hard Hands" } },
  { id: "faith.vax.blood", name: "Blood Paid", after: ["faith.vax.drill"], grants: { health: 1 } },
  {
    /*
     * Vax takes its **5 only**, and the 4 stays off the graph. Vax has the shortest full litany of
     * the eleven uncapped gods, so granting both would make it the second source a character can be
     * handed entire -- and *The First is the one* is an invariant with a reason (its ladder stops
     * at 3), not a number with room in it. The miracle and the node were already named the same
     * thing, which is how the gap was found.
     */
    id: "faith.vax.sixth", name: "The Sixth", after: ["faith.vax.blood"], bespoke: true,
    grants: { knowHow: "the Amber District, and who owes the temple", spell: "The Amber District" }
  },

  {
    /*
     * The one node in the game that CAPS a derived maximum rather than raising it. Every other
     * grant adds; this says *your spell slots are capped at 3, for ever*, which is why The First
     * has no strength-4 and no strength-5 miracle -- the obedience bites at the top of the ladder
     * as well as the bottom (way-cards 3.5).
     */
    id: "faith.first", name: "The First", after: ["faith.calling"], title: "The First",
    exclusive: "faith", creed: "first",
    axis: "Deck shape", resource: "spell slots",
    signature: "The Long Night", tactic: "What Is Left",
    obedience: "Your spell slots are capped at 3, for ever.",
    gift: "His miracles return what they take: Health drained from a living target comes back "
      + "to you, which is the only renewable pool in the game.",
    grants: { spell: "The Long Night", caps: { spellSlots: 3 } }
  },
  { id: "faith.first.debt", name: "The Debt", after: ["faith.first"], grants: { spell: "Measure of the Debt" } },
  {
    id: "faith.first.watch", name: "The Long Watch", after: ["faith.first.debt"],
    grants: { spell: "What Does Not Die" }
  },
  {
    /*
     * Way of Faith's only prune, and it is on the god who wants a narrow deck anyway -- *few
     * slots, and a deck narrow enough to hold them* (way-cards 3.5), which is one node.
     */
    id: "faith.first.narrow", name: "The Narrow Deck", after: ["faith.first.watch"],
    grants: { spellSlots: 1, prune: 1 }
  },
  { id: "faith.first.blood", name: "The Blood", after: ["faith.first.narrow"], grants: { health: 1 } },
  {
    /*
     * The fourth slot, which the cap eats. That is deliberate and it is the only way an obedience
     * can be a price rather than a decoration: the god offers more than you may hold, and what
     * stops you is the vow. A priest of The First who walks the whole branch is granted four slots
     * and keeps three, for ever.
     */
    id: "faith.first.rest", name: "The Long Sleep", after: ["faith.first.blood"],
    grants: { spellSlots: 1 }
  },
  {
    /*
     * The one capstone with no miracle to hand over: The First's Obedience caps its slots at 3 and
     * therefore caps its ladder there (way-cards 3.5), so there is no 4 and no 5 to place. It pays
     * in a **prune** instead, which is not a consolation -- The First's axis IS deck shape, and a
     * second prune is the deepest version of the thing the whole branch is about. It is also the
     * reward leveling 4 calls *the one that asks the player a question*.
     */
    id: "faith.first.echterhof", name: "Echterhof", after: ["faith.first.rest"], bespoke: true,
    grants: { knowHow: "Echterhof, and what is buried under it", prune: 1 }
  },

  /* --- The Five: five doors, four of them re-openable, so each branch runs two nodes --- */
  {
    id: "faith.sessyfyn", name: "Sessyfyn", after: ["faith.calling"], title: "Sessyfyn",
    exclusive: "faith", creed: "five",
    axis: "Support", resource: "the fate deck",
    signature: "The Tide Knows", tactic: "The Tide Comes In",
    obedience: "A permanent Miss AND a permanent Critical in your fate deck. Not one or the other.",
    grants: { spell: "The Tide Knows" }
  },
  { id: "faith.sess.tides", name: "The Tides", after: ["faith.sessyfyn"], grants: { spell: "Undertow" } },
  /*
   * --- a minor god's branch ends on its 5  [BUILT 2026-11-07]
   *
   * The eight minor gods' branches all ended on a know-how, a training or a rest token -- the
   * smallest rewards on leveling 4's list -- while each god's **5 sat on no node at all**. The
   * reason to put it here is the one already written down for the schools: *the 5 is what makes the
   * branch worth walking to the end*. A minor god's branch is three nodes, so the 5 goes on the
   * third and the **4 stays off the graph** for the god's menu node (4a) to offer.
   *
   * Nothing already on these nodes moved. The 5 is added beside it, which is why Driven Out still
   * teaches Burrowing and Fury still grants its Health.
   */
  {
    id: "faith.sess.salt", name: "Salt Wisdom", after: ["faith.sess.tides"], bespoke: true,
    grants: { knowHow: "the sea, and what it does not forgive", spell: "The Sea Decides" }
  },

  {
    id: "faith.valtor", name: "Valtor", after: ["faith.calling"], title: "Valtor",
    exclusive: "faith", creed: "five",
    axis: "Tempo", resource: "Strain",
    signature: "The Drum", tactic: "The Drum Does Not Stop",
    obedience: "Every miracle costs Strain 1 on top of its slots.",
    grants: { spell: "The Drum" }
  },
  { id: "faith.valtor.drums", name: "The Drums", after: ["faith.valtor"], grants: { spell: "No Step Back" } },
  { id: "faith.valtor.fury", name: "Fury", after: ["faith.valtor.drums"],
    grants: { health: 1, spell: "Valtor's Own" } },

  {
    id: "faith.fagar", name: "Fagar", after: ["faith.calling"], title: "Fagar",
    exclusive: "faith", creed: "five",
    axis: "Control", resource: "Spent",
    signature: "The Borrowed Face", tactic: "Nobody Remembers Your Face",
    obedience: "Each miracle may be cast once per fight. A trick works once.",
    grants: { spell: "The Borrowed Face" }
  },
  { id: "faith.fagar.masks", name: "Masks", after: ["faith.fagar"], grants: { spell: "The Second Thought" } },
  /* Fagar's thesis is *the trick that works once*, so the know-how is the other side of it: the
   * trick you have already been shown, which is the one that will not work on you. */
  { id: "faith.fagar.trick", name: "The Trick", after: ["faith.fagar.masks"],
    grants: { knowHow: "a trick you have already seen done", spell: "Everyone Wears His Face" } },

  {
    id: "faith.vulpet", name: "Vulpet", after: ["faith.calling"], title: "Vulpet",
    exclusive: "faith", creed: "five",
    axis: "Preparation", resource: "an ally",
    signature: "The Outcast's Due", tactic: "Alone and Unafraid",
    obedience: "You may not accept help: no ally may Heal you, Interpose for you, or Shake a "
      + "condition off you.",
    grants: { spell: "The Outcast's Due" }
  },
  { id: "faith.vulpet.road", name: "The Road", after: ["faith.vulpet"], grants: { spell: "Alone on the Road" } },
  {
    id: "faith.vulpet.driven", name: "Driven Out", after: ["faith.vulpet.road"], bespoke: true,
    /* **Burrowing**, the lingua franca of the burrower group (Firma.md). Vulpet was driven out by
     * everyone and became ruler of the land beneath, and the mole men down there follow the Queen
     * of the Dark: this node already knows where the unwanted go, and this is what they speak. */
    grants: {
      knowHow: "where the unwanted go, and who feeds them", language: "Burrowing",
      spell: "The Land Beneath"
    }
  },

  {
    id: "faith.brendan", name: "Brendan", after: ["faith.calling"], title: "Brendan",
    exclusive: "faith", creed: "five",
    axis: "Support", resource: "a turn spent early",
    signature: "Out of Barren Ground", tactic: "Roots",
    obedience: "Nothing he gives arrives on the turn you ask for it: every miracle resolves at "
      + "the start of your next turn at the earliest.",
    grants: { spell: "Out of Barren Ground" }
  },
  { id: "faith.brendan.seed", name: "The Seed", after: ["faith.brendan"], grants: { spell: "Full Belly" } },
  { id: "faith.brendan.ground", name: "Slow Ground", after: ["faith.brendan.seed"],
    grants: { restTokens: 1, spell: "What Grows Out of Us" } },

  /* --- The Grey: three doors, matching its three holy books and three sects --- */
  {
    id: "faith.grey", name: "The Grey", after: ["faith.calling"], title: "The Grey",
    exclusive: "faith", creed: "grey",
    axis: "Reactions", resource: "range",
    signature: "The Silent Hour", tactic: "Close Enough to Touch",
    obedience: "Adjacent only. Every miracle of The Grey reaches one square and no further.",
    grants: { spell: "The Silent Hour" }
  },
  { id: "faith.grey.quiet", name: "The Quiet Step", after: ["faith.grey"], grants: { spell: "Grey Judgement" } },
  /* The Grey is the silent approach, and `the knife` was a weapon wearing a training's clothes.
   * The knowledge is the approach rather than the blade: distance, and how much noise it costs. */
  { id: "faith.grey.arm", name: "Arm's Length", after: ["faith.grey.quiet"],
    grants: { knowHow: "how close you have to be, and how quiet", spell: "The Silent Knife" } },

  {
    id: "faith.purple", name: "The Purple", after: ["faith.calling"], title: "The Purple",
    exclusive: "faith", creed: "grey",
    axis: "Control", resource: "Taint",
    signature: "The First Taste", tactic: "The Cup Passes",
    obedience: "The first miracle you cast each fight gives you 1 Taint. You are the first to "
      + "taste it, always.",
    grants: { spell: "The First Taste" }
  },
  { id: "faith.purple.dose", name: "The Dose", after: ["faith.purple"], grants: { spell: "Taste of the Rot" } },
  {
    id: "faith.purple.cup", name: "The Cup", after: ["faith.purple.dose"], bespoke: true,
    grants: { knowHow: "what is in the water, and who put it there", spell: "The Slow Failure" }
  },

  {
    id: "faith.yellow", name: "The Yellow", after: ["faith.calling"], title: "The Yellow",
    exclusive: "faith", creed: "grey",
    axis: "Preparation", resource: "halves",
    signature: "The Rumour", tactic: "Nobody Knows Where You Are",
    obedience: "A lie must be kept up: every miracle ends the moment you fail to spend a "
      + "secondary on it.",
    grants: { spell: "The Rumour" }
  },
  { id: "faith.yellow.whispers", name: "Whispers", after: ["faith.yellow"], grants: { spell: "The Planted Word" } },
  {
    id: "faith.yellow.network", name: "The Network", after: ["faith.yellow.whispers"], bespoke: true,
    grants: { knowHow: "who carries a rumour, and how fast", spell: "The Lie That Held" }
  },

  /* --- the twenty-four menu nodes ---
   *
   * One behind every school and every god: **one formula or miracle of your choice from that
   * source's list**.
   *
   * Ninety-five of the hundred and forty-seven spells were on no node at all, and these are what
   * reach them. Nothing above changed to make room: every named grant on every branch is still
   * exactly the formula the branch was written around -- Rain and Lightning are still two nodes six
   * slots apart, which is the price way-cards 1.4 says a combo costs -- and this is one more node
   * on each branch rather than a rewrite of the ones there.
   *
   * They sit immediately behind the title, which is the earliest the choice can honestly be
   * offered: way-cards 3.4 argues the bottom of the ladder from a caster's FIRST day with the
   * school, and a node three steps further in would be arguing about their fourth.
   *
   * **Nine of these are the first thing behind their title.** The deep schools -- Necromancy,
   * Poison, Glamour, Tattoo, Asceticism, Shadow, Household, Ward, Divination -- are the level-8
   * ones a character crosses two branches to reach, and until now they were leaves: you arrived,
   * took the Signature, and the school had nothing else in it. A branch has to be worth walking to
   * the end (way-cards 3.4), and six formulas you could not be taught is not an end.
   */
  { id: "mind.blood.book", name: "The Opened Book", after: ["mind.blood"],
    grants: { choose: { from: "Blood Magic" } } },
  { id: "mind.elem.pages", name: "The Sphere's Pages", after: ["mind.elemental"],
    grants: { choose: { from: "Elemental Magic" } } },
  { id: "mind.spirit.written", name: "Another Pact Written", after: ["mind.spiritualism"],
    grants: { choose: { from: "Spiritualism" } } },
  { id: "mind.necro.ledger", name: "The Grave Ledger", after: ["mind.necromancy"],
    grants: { choose: { from: "Necromancy" } } },
  { id: "mind.poison.shelf", name: "The Apothecary's Shelf", after: ["mind.poison"],
    grants: { choose: { from: "Poison" } } },
  { id: "mind.glamour.face", name: "A Borrowed Face", after: ["mind.glamour"],
    grants: { choose: { from: "Glamour" } } },
  { id: "mind.tattoo.clean", name: "Skin Still Clean", after: ["mind.tattoo"],
    grants: { choose: { from: "Tattoo Magic" } } },
  { id: "mind.ascetic.given", name: "One More Thing Given", after: ["mind.asceticism"],
    grants: { choose: { from: "Asceticism" } } },
  { id: "mind.shadow.deeper", name: "A Deeper Dark", after: ["mind.shadow"],
    grants: { choose: { from: "Shadow Magic" } } },
  { id: "mind.house.book", name: "The Household Book", after: ["mind.household"],
    grants: { choose: { from: "Household Magic" } } },
  { id: "mind.ward.record", name: "The Warder's Record", after: ["mind.ward"],
    grants: { choose: { from: "Ward Magic" } } },
  { id: "mind.div.thread", name: "Another Thread", after: ["mind.divination"],
    grants: { choose: { from: "Divination" } } },

  /* And the twelve gods. A miracle costs nothing to learn -- a god grants it (way-cards 1.4) -- so
   * what a priest is choosing here is which part of the litany they know, not what it cost them. */
  { id: "faith.eg.recited", name: "The Rule Recited", after: ["faith.eternalgod"],
    grants: { choose: { from: "The Eternal God" } } },
  { id: "faith.es.another", name: "Another Word", after: ["faith.eternalspirit"],
    grants: { choose: { from: "The Eternal Spirit" } } },
  { id: "faith.vax.order", name: "The Next Order", after: ["faith.vax"],
    grants: { choose: { from: "Vax" } } },
  { id: "faith.first.else", name: "What Else Does Not Die", after: ["faith.first"],
    grants: { choose: { from: "The First" } } },
  { id: "faith.sess.next", name: "The Next Tide", after: ["faith.sessyfyn"],
    grants: { choose: { from: "Sessyfyn" } } },
  { id: "faith.valtor.again", name: "The Drum Again", after: ["faith.valtor"],
    grants: { choose: { from: "Valtor" } } },
  { id: "faith.fagar.another", name: "Another Mask", after: ["faith.fagar"],
    grants: { choose: { from: "Fagar" } } },
  { id: "faith.vulpet.further", name: "Further Out", after: ["faith.vulpet"],
    grants: { choose: { from: "Vulpet" } } },
  { id: "faith.brendan.season", name: "Another Season", after: ["faith.brendan"],
    grants: { choose: { from: "Brendan" } } },
  { id: "faith.grey.quieter", name: "Quieter Still", after: ["faith.grey"],
    grants: { choose: { from: "The Grey" } } },
  { id: "faith.purple.stronger", name: "A Stronger Dose", after: ["faith.purple"],
    grants: { choose: { from: "The Purple" } } },
  { id: "faith.yellow.longer", name: "A Longer Lie", after: ["faith.yellow"],
    grants: { choose: { from: "The Yellow" } } },

  /* --- the four holy orders: Way of Faith's second tier ---
   *
   * **A god is a choice between twelve. An order is what you do about it**, and until now this Way
   * had the first and not the second: twelve doors at the top and nothing behind any of them, where
   * the other three Ways put three titles at tier 1 and nine or ten behind them. A priest reached
   * level 5 and had nothing left in their own Way to walk toward.
   *
   * **The world wrote these before the rules did.** Every religion's *Groupings* section in
   * Firma.md lists the same kinds of institution under different names -- a religious secret police
   * (the Black Circle, God's Spirit), an order of knights (the Holy Shield, the Holy Sword), a
   * monastic order (the White Brothers, the Black Sisters, the Devoted) and the extreme (the
   * Flagellants, the Berserkers, the Mummers) -- and specializations.md listed all of it as content
   * that was reaching the rules through nothing at all.
   *
   * **So the order is the tier and the religion only names it**, which is what keeps this from
   * being twelve times four: an order is open to a priest of any god, so four titles serve twelve
   * where forty-eight would be needed to give each god its own. `faith.ordination` is `after` all
   * twelve, and `after` is OR (graph.mjs `satisfied`), so one god is enough and no god is special.
   *
   * **`exclusive: "order"` is the second family the group rule has ever had**, and it is the proof
   * that the rule was written general rather than for the gods: one order, for good, the same way
   * one religion is for good. A priest pays BOTH vows, because `termsOf` accumulates every
   * obedience owned and only the Tactic is singular -- so the deepest title's Tactic is now the
   * order's and the god's Obedience still stands.
   */
  { id: "faith.ordination", name: "Ordination",
    after: ["faith.eternalgod", "faith.eternalspirit", "faith.vax", "faith.first",
      "faith.sessyfyn", "faith.valtor", "faith.fagar", "faith.vulpet", "faith.brendan",
      "faith.grey", "faith.purple", "faith.yellow"],
    /* The hub of the four orders, and `the rule of an order` is a text, not a tool. What an
     * ordinand learns is the rule AND who is quietly outside it, which is the same shape as the
     * Black Circle's know-how one node along. */
    grants: { knowHow: "an order's rule, and the brother breaking it" } },

  /* One path node each, so the order arrives at level 8 like every other tier-2 title, and so the
   * level spent getting there is a level spent on the order rather than on the god. */
  { id: "faith.order.circle", name: "The Black Circle", after: ["faith.ordination"],
    grants: { knowHow: "who in a congregation is lying, and to whom" } },
  /* `shield and formation` was drill, and drill is not a tool either. The Holy Shield's knowledge
   * is the formation's failure point, which is what standing in one all day teaches. */
  { id: "faith.order.shield", name: "The Holy Shield", after: ["faith.ordination"],
    grants: { knowHow: "a shield wall, and where it is about to give" } },
  { id: "faith.order.cloister", name: "The Cloister", after: ["faith.ordination"],
    /* The infirmary is monastic in this world as in ours, and the training was the one a tool
     * named and no node taught: a Healer's Kit is Lore +2 and was capped at +1 for ever. */
    grants: { item: "Healer's Kit", restTokens: 1, training: "treating wounds" } },
  { id: "faith.order.drums", name: "The Drums", after: ["faith.ordination"],
    grants: { knowHow: "working a crowd into a state" } },

  {
    id: "faith.inquisitor", name: "Inquisitor", after: ["faith.order.circle"],
    title: "Inquisitor", exclusive: "order", creed: "circle",
    axis: "Control", resource: "a secret",
    signature: "The Writ", tactic: "Nobody Lies Twice",
    obedience: "You hold one thing about every ally that the others do not know, and the order "
      + "may ask you for it.",
    grants: { card: "The Writ" }
  },
  {
    id: "faith.shieldsworn", name: "Shieldsworn", after: ["faith.order.shield"],
    title: "Shieldsworn", exclusive: "order", creed: "shield",
    /*
     * **This order wrote itself as taking a kept-free spell slot first, and that is the one thing
     * it must not take.** way-cards 1.4's invariant is that no list runs past the caster it is
     * handed to, and the whole trunk ladder exists to make a priest's five arrive with their god's
     * list -- a vow that empties one slot puts every god's strength-5 back out of reach, for a
     * quarter of the tier, in prose that no code path reads. It takes ground instead, which is
     * what a shield wall actually costs.
     */
    /*
     * **Support, not Position, and the cell test is what asked the question.** Position/ground is
     * the Artillerist's cell (way-cards 2.1) and two titles in one cell are the same
     * specialization written twice. Support is also the truer half: this order's Signature gives
     * its Block away and its Tactic guards the figure beside it, neither of which is about where
     * the holder stands.
     */
    axis: "Support", resource: "ground",
    signature: "The Order's Shield", tactic: "Nobody Falls Beside You",
    obedience: "You may not give ground: while an ally stands further forward than you, you may "
      + "not move away from the enemy.",
    grants: { card: "The Order's Shield" }
  },
  {
    id: "faith.anchorite", name: "Anchorite", after: ["faith.order.cloister"],
    title: "Anchorite", exclusive: "order", creed: "cloister",
    axis: "Deck shape", resource: "skill cards",
    signature: "The Long Silence", tactic: "The Empty Cell",
    obedience: "Three skill cards are set aside each morning and are not yours until the next. "
      + "The cloister keeps them.",
    grants: { card: "The Long Silence" }
  },
  {
    id: "faith.flagellant", name: "Flagellant", after: ["faith.order.drums"],
    title: "Flagellant", exclusive: "order", creed: "drums",
    axis: "Tempo", resource: "a permanent Wild",
    signature: "The Scourge", tactic: "Past Caring",
    obedience: "One Wild stays in your fate deck for good. An ecstasy is not a thing you put "
      + "down.",
    grants: { card: "The Scourge" }
  },
];
