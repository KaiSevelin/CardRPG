/**
 * **What each title's build is FOR**: one sentence of strategy per specialization.
 *
 * Chapter 20 of the handbook named every title's Signature and printed its Tactic, and a reader
 * holding both still had to work out what the pair was supposed to *do*. The Signature was a bare
 * name -- *Shoulder to Shoulder*, *Cleave to the Bone* -- whose effect lived two hundred lines away
 * in chapter 21, 24 or 25 depending on whether it happened to be a card, a feature or a spell. And
 * nothing anywhere said what the build was good at, which is the only question somebody choosing
 * one is asking.
 *
 * So the generator prints two things per title now. **What the Signature does is derived** from the
 * content, exactly as chapters 21 and 25 derive it, so it cannot drift from the card. **What the
 * build is for is written**, and this is where it is written.
 *
 * **Why it is not in `TITLE_BLURBS`.** That list is the one chapter of the book written from inside
 * the world, and it says so: *no rule is stated here and none should be, because a rule stated
 * twice is a rule that can disagree with itself*. These are nothing but rules -- which half does
 * what, which Tactic it combines with, what the `spends` column costs you in play. Two lists, two
 * voices, one per question: `TITLE_BLURBS` answers *who are these people*, this answers *why would
 * I take it*.
 *
 * **The house rule for an entry.** A bolded lead of a few words that names the shape of the build,
 * then the strength, then the weakness -- and the weakness is not editorial, it is the title's own
 * `spends` column, which the chapter already defines as *the resource it pays in, and therefore the
 * thing it is bad at*. An entry that praises a build without naming what it gives up is half an
 * answer, and the validator cannot check prose, so this paragraph is the standard.
 *
 * Keyed one per title and checked in both directions: a title with no note fails, and a note
 * naming no title fails.
 */
export const TITLE_PLAY = [
  /* --- Way of Strength ---------------------------------------------------- */
  { title: "Infantry",
    text: "**A wall with a friend in it.** One half swings and covers every ally at your elbow at "
      + "the same time, and *The Line* means neither of you can be shoved apart -- so the strength "
      + "is a second body that cannot be separated from you. It spends **an ally**, which is the "
      + "whole of its weakness: alone, the Signature is a Strike with a wasted rider." },
  { title: "Executioner",
    text: "**A finisher, and a mover.** Wounds land a point of damage sooner for you than for "
      + "anybody else, and *No Second Thought* turns every kill into a free step toward the next "
      + "body, so a line of hurt enemies collapses in one turn. It spends **halves**, and it does "
      + "nothing at all to a fresh target in armour." },
  { title: "Gladiator",
    text: "**A lightning rod that bites.** The Signature wants you hit: being struck buys you "
      + "Block 2 and Compels the one who struck you with no save, and *The Crowd Wants Blood* lets "
      + "your reactions answer every blow rather than only the dangerous ones. It spends "
      + "**Health**, which is exactly what standing in front of people costs." },
  { title: "Guardian",
    text: "**A door, in one square.** *The Wall* makes you the only character whose Blocks add "
      + "instead of overriding each other, so two defensive halves are worth their sum, and *The "
      + "Door* stops an adjacent enemy sliding past you. It spends **a slot kept free** and prints "
      + "no damage of its own: the title holds a corridor and leaves the killing to the "
      + "deck you brought into it." },
  { title: "Ironclad",
    text: "**The one build that wants to be over the limit.** *Nothing Gets Through* counts your "
      + "armour twice while you are Overloaded and *Immovable* ignores forced movement and "
      + "difficult ground, so the state every other character avoids is your best one. It spends "
      + "**weight**: Overloaded is Burdened, which is Slowed, and it charges you for the "
      + "load every round it is on your back." },
  { title: "Artillerist",
    text: "**A gun emplacement.** Both halves of the build pay you for not moving -- the Signature "
      + "becomes a Blast and *Ranging* ignores cover -- which makes it the only ranged attack in "
      + "the game that reaches a target behind a wall. It spends **ground**: the turn you have to "
      + "reposition, you are a worse archer than an archer." },
  { title: "Tactician",
    text: "**Plays other people's turns.** *On My Call* lets an ally play a card with its halves "
      + "swapped, which turns a secondary into a primary and is the cheapest tempo anybody can "
      + "buy, and *The Call* hands advantage to whoever reaches the square you named. It spends "
      + "**halves**, and every point of it lands on somebody else: solo it is nothing." },
  { title: "Knight",
    text: "**One charge, unanswerable.** Three squares and a Strike on the same half, advantage "
      + "for the run-up, and *The Charge* means no reaction may answer the blow at the end of it. "
      + "It spends **gear you can lose**: the lance and the horse are both items, the Signature "
      + "needs the mount, and a straight line is not always available." },
  { title: "Berserker",
    text: "**A deck that burns itself for cards.** *Red Mist* Spends the card and refills your "
      + "hand to full at once, so you trade deck size for tempo in the middle of a fight, and "
      + "*Forward Only* makes you immune to Dazed and Compelled while two enemies are on you. It "
      + "spends **Spent**, and you may never move away from the nearest enemy." },
  { title: "Musketeer",
    text: "**The first shot of the fight.** You begin loaded and that shot is +2, and *The Firing "
      + "Step* removes the disadvantage every other shooter takes with an enemy in their face. It "
      + "spends **range**, with the harshest clause of the twelve: you may not Strike an adjacent "
      + "enemy **at all**, so anything that closes has to be walked away from." },
  { title: "Street Fighter",
    text: "**Bare hands on purpose.** With both hands empty the Signature Grapples with **no "
      + "save** and *The Alley* forbids the enemy to walk away, which together hold one target "
      + "still for as long as you want it held. It spends **a weapon's value**, and that is "
      + "the whole of it: the engine walks the equipped list, finds nothing and hands over bare "
      + "hands at **Strike 1**, so a Street Fighter playing to their own Tactic punches for one "
      + "where a Longsword would have been three." },
  { title: "Bodyguard",
    text: "**One other person's survival.** *Interpose* takes a hit meant for an adjacent ally and "
      + "*Never Leave Them* moves you with them for free and through figures, so the pair never "
      + "comes apart. It spends **ground**: your position is decided by whoever you are guarding, "
      + "and that is the whole cost of the build." },

  /* --- Way of Shade ------------------------------------------------------- */
  { title: "Thief",
    text: "**Cashes other people's setups.** *The Opening* gives you advantage against anything "
      + "carrying an opening **whoever set it**, which makes every condition your party lands into "
      + "your own bonus, and *Never Where You Looked* stops an enemy that missed you trying again "
      + "that round. It spends **a slot kept free**, and it needs somebody to make the opening." },
  { title: "Scout",
    text: "**Information bought with exposure.** Foresee reads what the enemy intends, one extra "
      + "type while you are furthest forward, and *Furthest Forward* gives you cover from every "
      + "figure on the field while you are the one out in front. It spends **being alone**: the "
      + "moment an ally gets ahead of you, both halves of the build switch off." },
  { title: "Duellist",
    text: "**One enemy at a time, and favoured twice.** *Named* makes your Parry hit back against "
      + "the enemy you named, and *One at a Time* gives you advantage and them disadvantage while "
      + "exactly one of them is adjacent. It spends **halves**, and a second enemy stepping in "
      + "turns the Tactic off: this is a build that loses to numbers rather than to strength." },
  { title: "Assassin",
    text: "**One blow, and then it is gone.** Doubled damage against a target that is unaware or "
      + "carrying an opening is the largest burst in the game, and *From Behind* gives you "
      + "advantage against anything your allies are already holding. It spends **Spent**: the card "
      + "leaves your hand for the rest of the fight, so the whole build is one turn." },
  { title: "Cutpurse",
    text: "**Takes things, and keeps them.** *Lift* moves a card out of the target's deck into "
      + "yours for good, and *Light Fingers* takes an item off an enemy's belt once a fight, so a "
      + "Cutpurse ends a fight richer than they started. It spends **deck size**: a growing deck "
      + "cycles slower, and a slower cycle is fewer good cards per fight." },
  { title: "Burglar",
    text: "**Doors and walls rather than fights.** *The Kit* turns every Hard physical obstacle "
      + "into a Normal one and *Through the Window* takes difficult ground and blocking figures "
      + "out of your way, so no building keeps you out and no terrain slows you. It spends "
      + "**weight** -- the kit may never be put down -- and none of it is damage." },
  { title: "Archer",
    text: "**Shoot, then step.** The Signature fires and moves on the same half, and *Overwatch* "
      + "gives you a free Strike each round against anybody walking into the ground you watch, "
      + "which is the only attack in the game that costs no card. It spends **range**: a bow is "
      + "two hands, and anything adjacent spoils every shot you take." },
  { title: "Trapmaker",
    text: "**Spend the first turn to own the floor.** *Set* puts a trap on an adjacent square that "
      + "Slows for two rounds and deals your Strike value, and *The Ground You Chose* makes every "
      + "square you have stood in difficult for the enemy. It spends **a turn spent early**, which "
      + "is a turn in which you did nothing to anybody." },
  { title: "Acrobat",
    text: "**Never where the blow lands.** *Over and Past* moves three squares and through enemy "
      + "ones, and *Never Cornered* steps you one square as a reaction after an attack is declared "
      + "but before damage, so the hit arrives where you were. It spends **weight**: this is all "
      + "Move, which means no armour worth the name." },
  { title: "Bard",
    text: "**Takes the enemy's luck away.** The Signature makes an arriving enemy draw with "
      + "disadvantage and *The Running Commentary* strips advantage from everything within three "
      + "squares, so nobody near you ever draws well. It spends **someone else's turn**, and the "
      + "build deals no damage at all: it changes what other people's dice do." },
  { title: "Gambler",
    text: "**Variance, chosen deliberately.** *Double or Nothing* draws two fate cards and adds "
      + "**both**, which is a wider spread rather than a better one, and *The Long Odds* gives you "
      + "advantage precisely while two or more enemies are on you. It spends **the fate deck**: "
      + "the card that can double a blow can halve it, and it will." },
  { title: "Half-mage",
    text: "**A sword that casts.** *One Trick* lets you prepare from any one school you have "
      + "watched somebody use, and *One Hand Free* removes the empty-hand requirement, so you keep "
      + "a weapon and a spell list at the same time. It spends **spell slots**, bought out of a "
      + "Shade's budget rather than a Scholar's, so there are very few of them." },

  /* --- Way of Mind -------------------------------------------------------- */
  { title: "Engineer",
    text: "**Keeps the party's gear alive.** *Shim and Wedge* uses one of your own consumables on "
      + "an adjacent ally, and *Nothing Is Scrap* repairs Corrode and Blunt on you and the ally "
      + "beside you after every fight with no check and no kit -- the two things that permanently "
      + "eat equipment. It spends **weight**, and it is the one Mind title with no magic in it." },
  { title: "Blood Magic",
    text: "**Damage that armour does not stop.** *Blood Price* is four points at three squares "
      + "**ignoring armour**, which is the answer to the one problem every other caster has, and "
      + "*Your Own Blood Is Nearest* lets you target yourself at any range without penalty. It "
      + "spends **your own Health**, the only resource in the game you cannot buy more of." },
  { title: "Elemental Magic",
    text: "**Terrain, made on the spot.** *Wall of the Sphere* lays three squares of cover and "
      + "difficult ground where there was none, and *The Sphere Holds* makes you the one caster "
      + "whose own Blast spares them -- which, since 2026-11-27, is a real exemption from a real "
      + "cost. It spends **reagents**, and the wall lasts one round." },
  { title: "Spiritualism",
    text: "**Asks for help with the thing no card covers.** *The Bargain* has a minor god act once "
      + "and the GM decides how, which is the point rather than a hole, and *Something Is Always "
      + "Listening* tells you what every square within six is before anyone steps on it. It spends "
      + "**a pact**, and what arrives is the GM's answer and not your plan." },
  { title: "Necromancy",
    text: "**A second body, out of a dead one.** *Call the Unquiet* raises a corpse that fights "
      + "until the fight ends, and *The Dead Are Furniture* makes every body on the floor cover "
      + "for you and difficult ground for them, so the battlefield improves as it fills. It spends "
      + "**a bound Taint**, and bound means no cure lifts it." },
  { title: "Asceticism",
    text: "**Nothing, held on purpose.** *Nothing Left to Take* means an empty hand cannot be "
      + "reduced below 1 Health, and *The Still Point* makes a turn in which you did not move one "
      + "where you cannot be moved and attacks against you have disadvantage. It spends **an empty "
      + "hand**: no cards is no actions, so the build is strongest when it can do least." },
  { title: "Demonology",
    text: "**Takes an enemy off the board and points it the other way.** *The True Name* Compels "
      + "for three rounds at range four through cover, and *The Terms Are Binding* means the "
      + "creature cannot shake it off by its own action -- the longest and surest control anywhere "
      + "in the game. It spends **a compounding debt**, which doubles every time you use it." },
  { title: "Poison",
    text: "**Slow, and certain.** *Wither* is one damage a turn that armour does not stop plus the "
      + "loss of their secondary, and *The Patient Hand* gives you disadvantage-proofing against "
      + "anything you have already conditioned this fight. It spends **skill cards**, so every "
      + "dose makes the rest of the day's checks harder." },
  { title: "Shadow Magic",
    text: "**Arrives, and cannot be shot.** *Step Through* crosses to any shadowed square you can "
      + "see, and *At Home in the Dark* makes you untargetable from more than two squares while "
      + "you stand in shadow. It spends **a permanent Wild**, which is one per "
      + "formula, and a Wild is not a Miss: the action resolves at its plain value and the "
      + "table draws Wild Magic instead." },
  { title: "Ward Magic",
    text: "**The answer to other casters.** *Unmake* is the only card in the game that stops a "
      + "Cast from resolving, and *The Standing Guard* gives you an extra reaction each round that "
      + "may only answer one -- so you hold two answers where everybody else holds none. It spends "
      + "**Spent**, and against an enemy that does not cast it is worth nothing at all." },
  { title: "Household Magic",
    text: "**The day between the fights.** *Hearth and Home* is a camp nobody unfriendly can find, "
      + "and *The House Helps* means indoors you ignore difficult ground and know where every door "
      + "is before you see it. It spends **a place you know**, and it is the only title in the book "
      + "whose Signature and Tactic are both useless in a fight." },
  { title: "Glamour",
    text: "**Not being there.** *Not Here* is Invisible on demand, and *Never Quite There* gives "
      + "every ranged attack beyond three squares disadvantage against you whether you are hidden "
      + "or not. It spends **an elven debt**, and the Signature ends the instant you attack or are "
      + "attacked: it buys a turn of safety, not a turn of work." },
  { title: "Tattoo Magic",
    text: "**Magic you never prepare.** *Graven Strength* is +2 to Strike with heavy items, "
      + "permanently and without a slot being renewed, and *Nothing to Prepare* lets you Cast with "
      + "both hands full and through Silenced. It spends **a secret**, and the slot is gone for "
      + "good: nothing on your skin can be changed once it is there." },
  { title: "Divination",
    text: "**Knows what is coming.** *The Reading* looks three cards down somebody else's deck and "
      + "*Already Seen* means you are never surprised and may trade places in the initiative order "
      + "with a willing ally. It spends **someone else's turn**, and never your own deck -- a "
      + "diviner who could stack their own luck would be a damage school in a robe." },

  /* --- Way of Faith ------------------------------------------------------- */
  { title: "The Eternal God",
    text: "**Certainty, handed to somebody else.** *The Clean Hand* makes an ally's next check or "
      + "attack unable to fail, and *No Shelter for the Guilty* denies every enemy cover from "
      + "figures against you. It spends **deck size**, and the gift is never yours: this is a "
      + "title that decides which of your party's rolls is the important one." },
  { title: "The Eternal Spirit",
    text: "**Healing with no range on it.** The Mend reaction answers a blow as it lands, and "
      + "*Where the Air Goes* lets you reach any ally you can see through cover and past range for "
      + "anything that heals or helps. It spends **weight** and it spends reactions, so your own "
      + "turn does very little: the build happens on other people's." },
  { title: "Vax",
    text: "**A shield wall that hits.** *The Club and the Line* Blasts every adjacent enemy with "
      + "the weapon already in your hand -- no free hand needed, because the club is the holy "
      + "symbol -- and *The Line of Vax* makes a group of three immovable and immune to cover. It "
      + "spends **Health**, and it wants friends beside it: alone, half the title is off." },
  { title: "The First",
    text: "**Lives off other people.** *The Long Night* drains three Health from an adjacent "
      + "living target and gives it to you, which is the only renewable Health in the game, and "
      + "*What Is Left* lets you keep acting at 0 until the round ends. It spends **spell slots**, "
      + "and it only works with something alive within reach." },
  { title: "Sessyfyn",
    text: "**Other people's luck, and other people's feet.** *The Tide Knows* has an ally draw "
      + "fate twice and keep both, and *The Tide Comes In* moves a willing ally one square at the "
      + "start of every round for free. It spends **the fate deck**: the sea is not fair, and what "
      + "you hand out comes off your own draws." },
  { title: "Valtor",
    text: "**Forward, and nothing else.** *The Drum* is +3 on your next Strike this turn, the "
      + "largest single bonus in the book, and *The Drum Does Not Stop* makes a Strike after a step "
      + "toward the enemy unanswerable by any reaction. It spends **Strain**, and the Tactic "
      + "forbids you to **Defend at all**: there is no version of this build that holds ground." },
  { title: "Fagar",
    text: "**One turn, stolen.** *The Borrowed Face* spends the card to make an enemy use its "
      + "whole round attacking its own ally, and *Nobody Remembers Your Face* gives the first "
      + "enemy to attack you each fight disadvantage. It spends **Spent**: it works once, which is "
      + "the god rather than a limitation of the spell." },
  { title: "Vulpet",
    text: "**The taunt that actually works.** *The Outcast's Due* Compels every adjacent enemy "
      + "onto you for two rounds, and *Alone and Unafraid* makes you un-Compellable and hard to "
      + "hit precisely while no ally is within two squares. It spends **an ally** -- the build is "
      + "strongest with nobody near you, and everything on the field is hitting you." },
  { title: "Brendan",
    text: "**Patience, paid in advance.** *Out of Barren Ground* is planted now and heals every "
      + "ally within two for four at the start of your second turn after, which is the largest "
      + "party heal anywhere, and *Roots* turns a square you have held for a round into high "
      + "ground. It spends **a turn spent early**: nothing he gives arrives when you ask for it." },
  { title: "The Grey",
    text: "**A knife at arm's length.** *The Silent Hour* is a reaction that stops an adjacent "
      + "enemy's action from happening at all, and *Close Enough to Touch* makes stepping next to "
      + "an enemy free, out of difficult ground, and safe from reactions. It spends **range**: "
      + "every part of the title happens at one square, which is where the danger is." },
  { title: "The Purple",
    text: "**Rot, and you taste it first.** *The First Taste* puts Tainting 2 into one adjacent "
      + "enemy's own deck, and *The Cup Passes* means an enemy will not willingly end its movement "
      + "beside you and pays a half if it does. It spends **Taint**: one into you every time, and "
      + "at three you are Afflicted and down three Health." },
  { title: "The Yellow",
    text: "**A lie, maintained.** *The Rumour* names something untrue before the fight and one "
      + "enemy type acts as though it were, and *Nobody Knows Where You Are* has enemies treat you "
      + "as standing where you were at the start of the round. It spends **halves**: the lie lasts "
      + "exactly as long as you keep paying a secondary into it, every round." },
  { title: "Inquisitor",
    text: "**Marks a target for the whole field.** *The Writ* is Judged (2) at range six with "
      + "**no save** -- being named is not something you resist -- and *Nobody Lies Twice* stops "
      + "an enemy carrying an opening you made from reacting to you. It spends **a secret**, and "
      + "Judged does nothing by itself: it is worth what your party does with it." },
  { title: "Shieldsworn",
    text: "**Somebody else's armour.** *The Order's Shield* Defends and hands Block 2 to an "
      + "adjacent ally and **never to you**, and *Nobody Falls Beside You* makes that ally "
      + "immovable and removes cover between the pair. It spends **ground**, and the order does not "
      + "defend itself: every point of this title lands on the person next to you." },
  { title: "Anchorite",
    text: "**Stillness as a resource.** *The Long Silence* gets two items Ready and sheds a "
      + "condition on the same card, but only if you did not move, and *The Empty Cell* makes you "
      + "immune to Burdened, Overloaded and anything that takes a card from your decks. It spends "
      + "**skill cards**, and the Signature is worth nothing on a turn you had to walk." },
  { title: "Flagellant",
    text: "**Pays first, strikes harder.** *The Scourge* costs a card out of your hand before the "
      + "blow lands and gives +2 and a Move 2, and *Past Caring* makes you immune to Compelled and "
      + "Heckled and free to disengage once you are at half Health or less. It spends **a permanent "
      + "Wild**, which is not a Miss: the action it lands on resolves at its plain value, no "
      + "bonus and no penalty, and then the table draws Wild Magic. It is Shadow Magic's price "
      + "paid for the opposite reason -- nothing a Flagellant does to themselves comes back." }
];
