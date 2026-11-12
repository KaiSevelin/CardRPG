/**
 * The pregenerated Warrior, the features a character can hold, and the languages.
 *
 * Part of the content set: see content.mjs, which is the one door onto all of it.
 */

/**
 * Features. A passive feature is simply true and stays small; anything that would swing a fight
 * needs a recharge. `grants` holds the flat traits the derived stats read -- those are NOT
 * bonus-grouped, because a group caps bonuses to one action while these change a standing number.
 */
export const FEATURES = [
  /**
   * **Adapted, the only feature in the game that points at another slate.**
   *
   * ideas.md asked for it as *"a levelling option, Adapted: ignore one injury's penalty"*, and it
   * is the counterweight that had to exist before Maimings could be uncapped: a *Bad Leg* alone
   * measures -8.1 win rate against the published encounters and -21.1 against archers, so three
   * of them stacked is a character nobody wants to play.
   *
   * > **[RETIRED 2026-11-12] *Adapted* is gone, and a prune replaced it.**
   * >
   * > It read *name one injury you carry; its penalty no longer applies*, and it was the only
   * > levelling option in the game that pointed at **another slate** -- which cost it a field on
   * > the feature schema, a predicate in `grants.mjs` and a question in all five readers of an
   * > injury's numbers. An option that reached four of the five would have worked on a sheet and
   * > not in a fight, and that was a standing risk for one reward.
   * >
   * > **A prune does the same job and removes the injury rather than muting it.** leveling 4's
   * > prune now takes an injury as well as a card, through `liftInjury`, which already takes the
   * > intruder cards an injury dealt out with it. So the brake on an uncapped Maiming is still
   * > fitted, it is a reward this game already had, and *healing* and *learning to live with it*
   * > stopped being two mechanics that needed telling apart.
   * >
   * > What it costs: the scar no longer survives its own repair. Under *Adapted* the slate stayed
   * > on the sheet with its arithmetic off, which was a thing a GM could write into a scene. A
   * > pruned injury is gone. **[OPEN]** Whether a *scar* with no numbers is worth a slate kind.
   */
  /*
   * --- six features that help a skill check, one per approach ---
   *
   * **The schema has held `bonus.approach` since tools were built and no feature ever used it**,
   * so step 3 of a check (skill-rules 2) had nothing to add even after the engine was repaired to
   * look in the right field. These are what it reads.
   *
   * All six are **+1 and grouped**, which is what keeps them from being the thing that breaks the
   * ladder: a group caps one bonus per action (core-rules 5), so two features of one approach do
   * not stack, and a trained tool still adds beside them because a tool is a different half of the
   * sum. One point is also exactly what the audit found levelling was worth to a check -- these
   * double that, rather than replacing the arithmetic with a bigger number.
   */
  {
    name: "Hard Hands", group: "training",
    text: "+1 on Might checks. Lifting, breaking, and not letting go.",
    bonus: { approach: "might", value: 1 }
  },
  {
    name: "Light Step", group: "training",
    text: "+1 on Agility checks. Where to put a foot, decided before you need it.",
    bonus: { approach: "agility", value: 1 }
  },
  {
    name: "Quiet Worker", group: "training",
    text: "+1 on Shadow checks. Slowly is quietly, and you have the patience for it.",
    bonus: { approach: "shadow", value: 1 }
  },
  {
    name: "Quick Eye", group: "training",
    text: "+1 on Wits checks. You notice the thing that is about to happen.",
    bonus: { approach: "wits", value: 1 }
  },
  {
    name: "Well Read", group: "training",
    text: "+1 on Lore checks. Somebody has written this down, and you have read them.",
    bonus: { approach: "lore", value: 1 }
  },
  {
    name: "Good Name", group: "training",
    text: "+1 on Presence checks. People have heard of you, and most of it was good.",
    bonus: { approach: "presence", value: 1 }
  },
  {
    name: "Strong", group: "body",
    text: "+1 damage on Strike with Heavy items.",
    bonus: { verb: "strike", value: 1, requiresTag: "heavy" }
  },
  {
    name: "Good Aim", group: "training",
    text: "+2 range on Ranged and Thrown items.",
    bonus: { verb: "strike", range: 2, requiresTag: "ranged" }
  },
  {
    name: "Quick",
    text: "Hand size +1.",
    grants: { handSize: 1 }
  },
  {
    name: "Tough",
    text: "+4 max Health.",
    grants: { health: 4 }
  },
  {
    name: "Arcane Focus", group: "power",
    text: "+1 to all Cast values.",
    bonus: { verb: "cast", value: 1 }
  },
  {
    name: "Steady",
    text: "You don't become Dazed.",
    active: { text: "Drain: you don't become Dazed.", boundary: "combat" }
  },
  {
    name: "Alert",
    text: "You draw with advantage on initiative."
  },
  {
    name: "Packhorse",
    text: "+20 kg carry allowance.",
    grants: { carry: 20 }
  }
];

/* -------------------------------------------- */
/*  Actors                                      */
/* -------------------------------------------- */

/**
 * The pregenerated starter Warrior. Character creation is deferred until after the first playtest,
 * so this is what you play: copy it rather than building one.
 *
 * 12 Health, Leather Armor (armor 1), Longsword, Wooden Shield, a Healing Potion and Strong -- the
 * same loadout every simulation run used, so the measured win rates apply to it directly.
 */
export const WARRIOR = {
  name: "Starter Warrior",
  type: "character",
  system: {
    health: { value: 12, base: 12 },
    way: "strength",
    rest: { tokens: 1, max: 1 },
    cash: { gold: 20 }
  },
  equipped: ["Longsword", "Wooden Shield", "Leather Armor", "Healing Potion"],
  pack: ["Dagger"],
  features: ["Strong"]
};

export const LANGUAGES = [
  { name: "Imperial", of: "the old language and the diplomatic lingua franca" },
  { name: "Valgar", of: "lost language from the Furnace District" },
  { name: "Perga", of: "the language at wolf's peak" },
  { name: "Veche", of: "the local tongue in Saag et Haar" },
  { name: "Elvish", of: "lingua franca within the elf group and most of lesser gods" },
  { name: "Demonic", of: "lingua franca in the demon group" },
  { name: "Troll", of: "lingua franca in the troll group" },
  { name: "Reversed", of: "reversed elvish used by undead" },
  { name: "Burrowing", of: "lingua franca of the burrower group" }
];