/**
 * One sentence per action card: what it **is**, as opposed to what it does.
 *
 * **A card already says what it does**, in its halves, and several carry a `text` besides that
 * qualifies the rule: *Adjacent.*, *On yourself.*, *The secondary names one NPC type.* Those are
 * rules, written for somebody resolving a turn, and they are useless to somebody deciding whether
 * they want the card. A player picking a reward off a level-up graph, or reading a list of ninety
 * in the handbook, is asking a different question.
 *
 * **Keyed by name rather than written on the card**, for the same reason the art directions are: a
 * table of prose edited as prose reads better and diffs better than ninety sentences scattered
 * through five content files, and one list can be checked in both directions. The validator does
 * exactly that, so a card without a line fails and a line naming no card fails.
 *
 * The house style, such as it is: present tense, one sentence, something physical. Not a
 * restatement of the numbers, which are printed two lines above it wherever this is shown.
 */
export const CARD_BLURBS = {
  /* --- the starter Warrior ------------------------------------------------ */
  "Strike": "The plain swing every fighter has, and the card you will play more than any other.",
  "Heavy Swing": "Weight behind it, aimed where the plates meet rather than where they are thickest.",
  "Lunge": "Close the distance and put the point in before they have finished turning.",
  "Shield Up": "Get it across and keep it there, for everything that comes this round.",
  "Advance": "Ground taken quickly, while somebody else is still deciding.",
  "Draw Steel": "Hit with what is already in your hand, then get the right thing into it.",
  "Quick Hands": "Use what you are carrying faster than anyone expects, and have the next thing ready.",
  "Second Wind": "You are not finished. You had simply stopped breathing properly.",
  "Taunt": "Make yourself the only thing in the room worth hitting.",
  "Weapon Swap": "The wrong tool goes away, the right one arrives, and the swing follows it.",

  /* --- the starter Shade --------------------------------------------------- */
  "Knife Work": "Close, quick and unremarkable, which is the whole idea.",
  "Open Vein": "Not a killing blow. A bleeding one, which does its work later.",
  "Slip In": "Cross the gap along the wall and arrive beside them.",
  "Shed the Blow": "Turn with it rather than against it, and be elsewhere afterwards.",
  "Quick Step": "Three squares before anybody has decided you were worth watching.",
  "Draw the Knife": "Something sharp is out before the other hand has found the next one.",
  "Light Fingers": "Use it without being seen to use it.",
  "Bind the Wound": "Press the cloth hard and keep moving.",
  "Jeer": "A word in the right place, and they lose the thread of what they were doing.",
  "Off Hand": "The second blade comes out and goes to work.",

  /* --- the common pool ----------------------------------------------------- */
  "Off-Hand Blow": "Two hands, two strikes, and the second is the weaker for it.",
  "Measure": "Watch where the shield is going and put the point where it is not.",
  "Hold the Line": "Hold the ground, and make them pay for every step onto it.",
  "Press": "Hit them, and follow as they give way.",
  "Both Hands": "Change what you are holding and swing with it in the same motion.",
  "Dig In": "Stop, breathe, and patch whatever is bleeding.",

  /* --- Way of Strength ----------------------------------------------------- */
  "Shoulder Check": "Your whole weight into theirs, at the range where weight wins.",
  "Shield Bash": "The shield is not only for stopping things.",
  "Hammerblow": "A blow that needs them off balance, and settles it once they are.",
  "Sweep the Leg": "Take the feet from under somebody who has already lost their footing.",
  "Overbear": "Get hold of them while they are going down, and do not let go.",
  "Shield Wall": "Your shield covers the person beside you as well as yourself.",
  "Two-Hand It": "Both hands on the haft, and nothing kept back for defence.",
  "Heave": "Lift what should not be liftable, and walk with it.",
  "Armoured Advance": "Come on through it. The plate is doing its job.",
  "Pull Them Down": "Somebody already down or held is somebody you can finish.",
  "Beat the Blade": "Knock the weapon aside hard enough that they lose it.",
  "Roar": "Everything near you hears it, and the fight goes out of them.",
  "Walk It Off": "Whatever is on you comes off, because you have decided it will.",
  "Nothing Held Back": "Commit the whole hand to one blow and have nothing left afterwards.",
  "On the Rest": "The barrel laid on its rest and levelled down one line, and you simply wait.",
  "Call It": "Name what you are facing, and your people know what to do about it.",

  /* --- Way of Shade -------------------------------------------------------- */
  "Call the Shot": "Pick your man out of the crowd, and keep him picked.",
  "Find the Seam": "Not through the armour. Between it.",
  "Half-Hilt": "Hand on the blade, point driven into the gap by main force.",
  "Round the Shield": "A knife thrown at the one angle a shield was never going to cover.",
  "Between the Plates": "A gap you marked earlier, and a point that fits it.",
  "Take the Shot": "You have been waiting for this, and the waiting is what makes it land.",
  "Pin the Shadow": "Put something through cloth and leg together.",
  "Cut and Run": "Open them up and be gone before they decide what to do about it.",
  "Light Feet": "Rubble, mud and bodies are all the same floor to you.",
  "Slip the Knot": "Whatever had hold of you does not, any more.",
  "Second Knife": "There was always a second knife.",
  "Mock": "Say the one thing that makes them stop thinking.",
  "Sleight": "Your hands do two things and they only see one.",
  "Vanish": "Be somewhere the eye slides off.",
  "The Held Knife": "A blade balanced and not yet thrown, waiting for somebody to cross in front of you.",
  "At Full Draw": "Held at full draw, watching one approach and nothing else.",
  "Count the Odds": "Look at what is coming before you commit to anything.",
  "Scout Ahead": "Go first, look further, and come back knowing.",
  "Smoke and Go": "Something hits the ground, and you are not where you were.",

  /* --- Way of Mind --------------------------------------------------------- */
  "Hold to the Bargain": "Something that owes you intervenes, once.",
  "Turn Aside": "Their shield is suddenly worth twice what it was.",
  "Shake It Off": "Whatever is on them comes off now, not on their turn.",
  "The Mirror": "The blow goes back the way it came, in full.",
  "Unmake": "You have read this spell before, and that is the only reason it stops.",

  /* --- Way of Faith -------------------------------------------------------- */
  "Bear It for Them": "You take what is on them onto yourself, entire.",
  "The Turning Tide": "The sea is not fair, and today it is not fair to them.",
  "The Close Work": "You move his arm, and the man behind him takes it.",
  "Breath of the Spirit": "Help arrives through the air, from anywhere you can be heard.",
  "The Writ": "Named at range, with no appeal, and the whole field may act on it.",
  "The Order's Shield": "The guard goes to somebody else, and never to you.",
  "The Long Silence": "Stand entirely still, because the stillness is the method.",
  "The Scourge": "Pay in your own skin first, and the blow lands harder for it.",

  /* --- Signatures of Strength ---------------------------------------------- */
  "Shoulder to Shoulder": "You swing, and every ally at your elbow is covered by it.",
  "Ranging Shot": "Stand still, and the shot spreads where it is wanted.",
  "On My Call": "An ally plays their card the wrong way round because you told them to.",
  "The Lance": "Weight, speed and a long point, which is the whole argument of cavalry.",
  "Red Mist": "Spend everything and draw straight back up, because stopping is not in it.",
  "Play to the Crowd": "Take the hit where they can see it, and make the man who gave it the villain.",
  "Get a Grip": "Empty hands are no disadvantage once they are on somebody.",
  "Interpose": "The blow meant for your friend arrives at you instead.",

  /* --- Signatures of Shade -------------------------------------------------- */
  "Point Man": "Walking in front has its uses, and this is the one.",
  "Named": "One enemy, named aloud, and from then on your parry cuts.",
  "One Opening": "Somebody who does not know you are there needs only the one.",
  "Lift": "Take a card out of their deck, and keep it.",
  "Loose and Step": "Shoot, and be a square away by the time they look.",
  "Set": "Leave something on the ground for whoever comes next.",
  "Over and Past": "Their line is not a wall if you simply go through it.",
  "Heckle": "Anybody who closes on you is rattled before they arrive.",
  "Double or Nothing": "Two fate cards, both of them counting, which is weather and not advantage.",

  /* --- the Way cards --------------------------------------------------------- */
  "Set Spear": "Brace the butt in the dirt and let them run onto it.",
  "Roll With It": "Go with the blow, and come up somewhere more useful."
};
