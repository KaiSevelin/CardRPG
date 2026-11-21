/**
 * One paragraph per title: who these people **are**, as opposed to what their build does.
 *
 * **A title already says what it does**, in its axis, its resource, its Signature and its Tactic,
 * and the node's `lore` says it again at greater length for somebody standing in front of the
 * level-up graph with the points already spent. None of that answers the question a reader of the
 * titles chapter is actually asking, which is *who are these people in the world* -- what an
 * Ironclad is for, why a Knight can afford to be one, what a Flagellant thinks is happening. These
 * paragraphs are the answer, and they are the only place in the book where it is given.
 *
 * **Keyed by title and not written on the node**, for the reason `CARD_BLURBS` is: prose edited as
 * prose reads and diffs better than fifty sentences scattered through four content files, and one
 * list can be checked in both directions. The validator does exactly that, so a title with no
 * paragraph fails and a paragraph naming no title fails.
 *
 * **Why `titles` is a list and not a key.** Six of the Way of Faith titles are gods, not
 * professions, and the ones who share a priesthood share a paragraph: the **Five** are introduced
 * together because the whole point of them is that their servants work together, and the Grey, the
 * Purple and the Yellow are introduced together because the whole point of *them* is that they do
 * so with less trust. Splitting either into one paragraph per god would have meant writing five
 * sentences that each said "and the other four accept him", which is not five facts. So an entry
 * names every title it covers, the generator prints it once at the first of them, and the suite
 * holds the invariant that matters: **every title is covered exactly once.**
 *
 * The house style is the author's own voice and deliberately not the rest of the book's: this is
 * the one chapter written from inside the world rather than from above it. Present tense, a
 * sentence or three, nothing mechanical. No rule is stated here and none should be, because a rule
 * stated twice is a rule that can disagree with itself.
 */
export const TITLE_BLURBS = [
  /* --- Way of Strength ---------------------------------------------------- */
  { titles: ["Infantry"],
    text: "**Infantry** make up the bulk of armies and have different roles, from pike men to "
      + "sword men." },
  { titles: ["Executioner"],
    text: "**Executioners** are shock troops in the army, or chosen for elite squads." },
  { titles: ["Gladiator"],
    text: "**Gladiators** have training in arena fights, fights that in some places are to the "
      + "death, but mostly are nonlethal." },
  { titles: ["Guardian"],
    text: "**Guardians** are specialized in defending castles, manors and similar high-value "
      + "targets." },
  { titles: ["Ironclad"],
    text: "**Ironclad** are specialized troops trained to withstand charges." },
  { titles: ["Artillerist"],
    text: "**Artillerists** typically work with siege machines and cannons." },
  { titles: ["Tactician"],
    text: "**Tacticians** are leaders in battle with responsibility for parts of an army." },
  { titles: ["Knight"],
    text: "**Knights** are mostly from wealthy or noble surroundings, considering the cost of "
      + "armour and a war horse." },
  { titles: ["Berserker"],
    text: "**Berserkers** can usually be found in troops that are not organized, where fury and "
      + "attack mean more than tactics." },
  { titles: ["Musketeer"],
    text: "**Musketeers** are specialized in firearms and in how to use discipline and pack "
      + "tactics to increase their effect." },
  { titles: ["Street Fighter"],
    text: "**Street Fighters** usually have no or little connection to armies. They often learned "
      + "their art of fighting in order to survive a tough childhood." },
  { titles: ["Bodyguard"],
    text: "**Bodyguards** specialize in protecting their employer, often in the service of nobles "
      + "and rich merchants." },

  /* --- Way of Shade ------------------------------------------------------- */
  { titles: ["Thief"],
    text: "**Thieves** specialize in thefts, stealth and speed." },
  { titles: ["Scout"],
    text: "**Scouts** are observers and reconnaissance, sometimes making up separate units in an "
      + "army." },
  { titles: ["Duellist"],
    text: "**Duellists** are fighters who specialize in man-to-man fights." },
  { titles: ["Assassin"],
    text: "**Assassins** often work as contract killers, or as covert troops in an army." },
  { titles: ["Cutpurse"],
    text: "**Cutpurses** usually earn their living by pickpocketing or grab-and-run steals." },
  { titles: ["Burglar"],
    text: "**Burglars** specialize in breaking into houses to steal valuables." },
  { titles: ["Archer"],
    text: "**Archers** are the main missile troops in an army. The heavy training with longbows "
      + "makes a mark on their bodies." },
  { titles: ["Trapmaker"],
    text: "**Trapmakers** specialize in making traps and impeding movement in battles." },
  { titles: ["Acrobat"],
    text: "**Acrobats** are trained in movement in tough terrain and in how to get out of tough "
      + "spots." },
  { titles: ["Bard"],
    text: "**Bards** work as jesters, comedians or troubadours, and are masters of influencing "
      + "crowds and persons." },
  { titles: ["Gambler"],
    text: "**Gamblers** have an agreement with lady luck and can feel the tides and ebbs of luck "
      + "in their bones." },
  { titles: ["Half-mage"],
    text: "**Half-mages** use magic combined with stealth and speed." },

  /* --- Way of Mind -------------------------------------------------------- */
  { titles: ["Engineer"],
    text: "**Engineers** come out of the Furnace guilds and are not magicians at all, whatever "
      + "the odd mage working beside them suggests. They keep the trains, the cable cars and the "
      + "sea defences standing, and in the field they keep the party's gear standing." },
  { titles: ["Blood Magic"],
    text: "**Blood Magicians** all have ancestry traceable to Hyrock. The art of turning your own "
      + "or another's blood to power was invented there." },
  { titles: ["Elemental Magic"],
    text: "**Elemental magicians** focus on the five elements: Air, Fire, Earth, Water and "
      + "Ether." },
  { titles: ["Spiritualism"],
    text: "**Spiritualists** use spirits from the Fourth Side to give them power." },
  { titles: ["Necromancy"],
    text: "**Necromancers** have their connection to dead people who have not travelled to the "
      + "Fourth Side yet." },
  { titles: ["Asceticism"],
    text: "**Ascetics** focus on withstanding elements and force." },
  { titles: ["Demonology"],
    text: "**Demonologists** deal with the Third Side. The summoning itself is ritual work and "
      + "takes days, so what a demonologist carries into a fight is not a demon but the debt owed "
      + "for one, and the names it gave up along the way." },
  { titles: ["Poison"],
    text: "**Poisoners** use draughts and poison spells to overcome opponents." },
  { titles: ["Shadow Magic"],
    text: "**Shadow mages** find their power in dark places." },
  { titles: ["Ward Magic"],
    text: "**Warders** are specialists in removing magic and in protecting areas." },
  { titles: ["Household Magic"],
    text: "**Household magicians** mostly focus on mundane magic, such as getting a good harvest "
      + "or spoiling the neighbours' milk." },
  { titles: ["Glamour"],
    text: "**Glamour mages** made a deal with the elves to be able to use a part of the elven "
      + "magic." },
  { titles: ["Tattoo Magic"],
    text: "**Tattoo magicians** brand themselves with prepared spells in the form of tattoos." },
  { titles: ["Divination"],
    text: "**Diviners** focus on predicting the future, or on finding answers about now by "
      + "magic." },

  /* --- Way of Faith ------------------------------------------------------- */
  { titles: ["The Eternal God"],
    text: "**The Eternal God's** servants see themselves as the true religion, and enforce that "
      + "more than other religions do." },
  { titles: ["The Eternal Spirit"],
    text: "**The Eternal Spirit** shares the attitude of the Eternal God, being an offshoot, but "
      + "has fewer members and less power. Sometimes the Eternal God and the Eternal Spirit work "
      + "together, sometimes they kill each other." },
  { titles: ["Vax"],
    text: "**Vax** is a local god in Parfebe, and most followers have a connection to the city, "
      + "even though cults pop up now and then in other places. Vax is a very macho religion." },
  { titles: ["The First"],
    text: "**The First** worship the creator of all Strigloi. He is said to still be around, and "
      + "is either described as senile or as terrifying." },
  /* The Five, in one paragraph, because the paragraph's subject is the arrangement between them. */
  { titles: ["Sessyfyn", "Valtor", "Fagar", "Vulpet", "Brendan"],
    text: "**Sessyfyn**, **Valtor**, **Fagar**, **Vulpet** and **Brendan** are the **Five**, a "
      + "small pantheon of gods whose servants work together and accept each other. It is mainly "
      + "a coastal religion, and predates the Eternal God." },
  { titles: ["The Grey", "The Purple", "The Yellow"],
    text: "**The servants of the Grey, the Purple and the Yellow** also work together, but with "
      + "less trust. It is a newer religion with origins among assassins and thieves." },
  { titles: ["Inquisitor"],
    text: "**Inquisitors** are a religious role, church members working to remove sin as the "
      + "church defines it." },
  { titles: ["Shieldsworn"],
    text: "**Shieldsworn** form the devout part of a church's army." },
  { titles: ["Anchorite"],
    text: "**Anchorites** ignore banal things in life in order to be fully one with their god. "
      + "Some of them stay their whole life on a pillar, others just try to ignore people." },
  { titles: ["Flagellant"],
    text: "**Flagellants** drive themselves into ecstasy from the love of their religion. Some "
      + "walk in processions whipping their bare backs, others dance for hours in groups." }
];
