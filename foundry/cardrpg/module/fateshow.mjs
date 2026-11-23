/**
 * **The fate card, shown.**  **[BUILT 2026-11-23]**
 *
 * Every action in this game is a number and a card, and until today only the number reached the
 * player: the draw happened, the chat line said *Strike 5 · fate +1*, and the card itself -- the
 * object the whole deck economy is about -- was never on the screen. A table watching somebody
 * swing a sword saw a sentence arrive in the log.
 *
 * So a draw is **dealt where the table is looking** -- the middle of the scene, big enough to read
 * -- and then goes where the record of it lives: small, under the Fate and Discard piles, beside
 * whatever the same turn has already drawn. Five seconds and it is gone, because this is a reveal
 * and not a panel. The piles underneath it are the permanent record, and they were made into a
 * place rather than a statistic for exactly this reason (hud-spec 3.8).
 *
 * **Advantage and disadvantage deal two and show two.** Both are dealt face up, the one the rule
 * does not take fades where it lies, and the one it takes flies to the pile. That is the whole of
 * what advantage costs and buys, in the only form a player can check: *you can see the card you
 * did not get*.
 *
 * ## Why this is not in the tray
 *
 * The HUD is one actor's window and a draw is not. A goblin's Strike draws fate on the GM's
 * screen whoever is selected, and an injury draws on the TARGET's deck -- so hanging the reveal
 * off a window that may be showing somebody else, or nobody, would show the card for some draws
 * and not others, with no rule a player could learn. This listens for the draw itself.
 *
 * ## Why it is a hook rather than a call
 *
 * `drawFate` is the one door onto the deck (decks/fate.mjs) and it is in the deck layer, which
 * moves cards and does not know what a screen is. Five callers draw through it -- a strike, a
 * check, a saving throw, a heal and an injury -- and every one of them is an action somebody
 * performed, which is why the reveal can be unconditional. Initiative does NOT draw fate, so
 * there is no case where a round start deals eight of these at once.
 */

/** The id of the layer every reveal is drawn into, made on first use and never removed. */
const LAYER_ID = "cr-fateshow";

/**
 * How long each stage lasts, in ms.
 *
 * `hold` is how long the card sits in the middle before it flies. The advantage case gets its own
 * and longer one, because two cards is a comparison and a comparison takes longer to read than a
 * number -- it is the one moment in this game where a player is shown the card they did not get,
 * and half a second is not enough to find it.
 */
const TIMING = { hold: 900, holdPair: 1600, fly: 650, fade: 450, parked: 5000 };

/** A card's height as a share of the window, so the reveal is readable on any screen. */
const REVEAL_HEIGHT = 0.34;

/** The gap between two cards in the middle, and between parked cards, in px. */
const GAP = 12;
const PARK_GAP = 6;

/**
 * **Which parked slots are taken.**
 *
 * An index per card rather than a row that reflows: the primary's card parks at 0 and the
 * secondary's at 1, which is the order the rules resolve them in and therefore the order they are
 * drawn in -- nothing has to be told which half it came from. A slot is freed when its card goes,
 * so a third draw lands in the gap rather than walking off the edge of the screen.
 *
 * @type {Map<number, HTMLElement>}
 */
const parked = new Map();

/** The lowest slot nobody is using. */
function freeSlot() {
  let i = 0;
  while (parked.has(i)) i++;
  return i;
}

/**
 * The layer, made on demand. Above the HUD, and deaf to the mouse: this is a picture.
 *
 * It carries `cardrpg` as well as its own class so the cards inherit the system's type and
 * colours, and so the card **ratio** can be read off it -- `--cardrpg-card-ratio` is declared on
 * `.cardrpg` and is the only statement of 2:3 anywhere, which is exactly why this asks for it
 * rather than writing the number a second time.
 */
function layer() {
  let node = document.getElementById(LAYER_ID);
  if (!node) {
    node = document.createElement("div");
    node.id = LAYER_ID;
    node.className = "cardrpg cr-fateshow";
    document.body.appendChild(node);
  }
  return node;
}

/** 2:3, from the one place that says so. */
function cardRatio(host) {
  const read = Number.parseFloat(
    getComputedStyle(host).getPropertyValue("--cardrpg-card-ratio"));
  return Number.isFinite(read) && read > 0 ? read : 0.6667;
}

/**
 * Where a parked card sits, measured off the pile row it parks under.
 *
 * Measured rather than computed for the reason `#fitSpreads` is (tray.mjs): the right column is
 * top-anchored and as tall as whatever is in it, so where the piles are is a fact about a turn in
 * progress and no stylesheet can know it.
 *
 * `null` when there is no pile row on the screen -- no HUD open, or one still rendering -- and
 * the caller then leaves the card where it is and lets it fade. A card flying to a guessed corner
 * is worse than one that simply goes.
 */
function parkPlace(slot) {
  const piles = document.querySelector(".cr-hud__piles");
  const one = piles?.querySelector(".cr-pile");
  if (!piles || !one) return null;
  const pile = one.getBoundingClientRect();
  const row = piles.getBoundingClientRect();
  if (!pile.width || !row.width) return null;
  return {
    left: row.left + slot * (pile.width + PARK_GAP),
    top: row.bottom + PARK_GAP,
    width: pile.width
  };
}

/**
 * One fate card as a face.
 *
 * The picture is whatever the card itself wears, and **a card with no picture is still a card**:
 * the name is the value on every plain fate card -- `+1`, `±0`, `−2` -- so the text alone says
 * everything a player needs, and a missing face costs the reveal nothing. That is why this does
 * not wait for art or refuse without it.
 */
function faceOf(card) {
  const name = card.faces?.[0]?.name ?? card.name ?? "";
  const art = card.faces?.[0]?.img ?? "";
  const node = document.createElement("div");
  node.className = "cr-fate"
    + (card.system?.special ? ` cr-fate--${card.system.special}` : "");
  /*
   * **Through `getRoute`, and that is not a nicety.**  [FIXED 2026-11-23]
   *
   * A relative `url()` inside a custom property is resolved against the stylesheet the `var()` is
   * written in, not against the document -- and that `var()` is in cardrpg.css. So a bare
   * `art/cards/fate/zero.webp` was fetched as `styles/art/cards/fate/zero.webp`, and every fate
   * card in the reveal came back 404 with a blank face. `crArt` carries the same call for exactly
   * this reason and says so on the line; the knowledge had simply not travelled to the one module
   * that builds its own nodes instead of going through a template.
   *
   * Quoted and escaped as well, because a path with a quote in it would close the `url()` early.
   */
  if (art) {
    const url = foundry.utils.getRoute(String(art)).replaceAll("'", "%27");
    node.style.setProperty("--cr-fate-art", `url('${url}')`);
  }
  /*
   * **The name is the whole face, and on eighteen of the twenty-one cards the name is the
   * number**: `+1`, `±0`, `−2`. The other three say `Miss`, `Critical` and `Wild`, which need no
   * gloss either. A second line repeating the name is what a note would be here, so there is not
   * one -- and `textContent` rather than markup, because a card name is data.
   */
  const label = document.createElement("span");
  label.className = "cr-fate__name";
  label.textContent = name;
  node.appendChild(label);
  return node;
}

/** Put `node` at a fixed place and size, with no transform on it. */
function place(node, { left, top, width, height }) {
  node.style.left = `${Math.round(left)}px`;
  node.style.top = `${Math.round(top)}px`;
  node.style.width = `${Math.round(width)}px`;
  node.style.height = `${Math.round(height)}px`;
}

/** Take a card off the screen, and give its slot back. */
function clear(node, slot) {
  if (slot !== null && parked.get(slot) === node) parked.delete(slot);
  node.remove();
}

/**
 * **Deal the draw.**
 *
 * One card or two, in the middle, then the kept one to the pile row and the other away.
 *
 * Everything is a `transform` on a card that never moves in layout: each is placed at an explicit
 * `left`/`top` and flown with `translate`/`scale` from `transform-origin: top left`, so no card's
 * flight can be disturbed by another arriving. A flex row would have been shorter and the second
 * draw of a turn would have shoved the first out of its parked place while it sat there.
 */
function reveal({ drawn, used }) {
  const host = layer();
  const height = Math.round(window.innerHeight * REVEAL_HEIGHT);
  const width = Math.round(height * cardRatio(host));
  const pair = drawn.length > 1;
  const span = pair ? 2 * width + GAP : width;
  const left0 = Math.round((window.innerWidth - span) / 2);
  const top = Math.round((window.innerHeight - height) / 2);

  const kept = used ?? drawn[0];
  const nodes = drawn.map((card, i) => {
    const node = faceOf(card);
    place(node, { left: left0 + i * (width + GAP), top, width, height });
    node.classList.add("cr-fate--dealt");
    host.appendChild(node);
    return { node, card, keep: card.id === kept?.id };
  });

  /* One card is a reveal; two is a comparison, and the loser has to be readable for long enough
   * to be compared with. See `TIMING`. */
  const hold = pair ? TIMING.holdPair : TIMING.hold;

  for (const { node, keep } of nodes) {
    if (keep) continue;
    /* The card the rule did not take fades where it lies, which is what says it was drawn and
     * passed over rather than never drawn at all. */
    window.setTimeout(() => {
      node.classList.add("cr-fate--spurned");
      window.setTimeout(() => clear(node, null), TIMING.fade + 50);
    }, hold);
  }

  const winner = nodes.find(n => n.keep) ?? nodes[0];
  window.setTimeout(() => {
    /* Re-measured now rather than when the card was dealt: the HUD may have rendered, the sidebar
     * may have opened, and a flight to where the piles USED to be is a flight to nowhere. */
    const slot = freeSlot();
    const to = parkPlace(slot);
    if (!to) {
      /* Nowhere to park: no HUD, or none with a pile row. The card goes rather than flying to a
       * guessed corner, and nothing is left on the screen for the player to wonder about. */
      winner.node.classList.add("cr-fate--spurned");
      window.setTimeout(() => clear(winner.node, null), TIMING.fade + 50);
      return;
    }

    parked.set(slot, winner.node);
    const scale = to.width / width;
    const here = winner.node.getBoundingClientRect();
    winner.node.classList.add("cr-fate--flying");
    winner.node.style.transform =
      `translate(${Math.round(to.left - here.left)}px, ${Math.round(to.top - here.top)}px)`
      + ` scale(${scale.toFixed(4)})`;

    /* Five seconds PARKED, not five from the deal: the point of the pause is that the card can be
     * found under the pile it went into, and a timer started at the deal would spend most of it
     * on the flight. */
    window.setTimeout(() => clear(winner.node, slot), TIMING.fly + TIMING.parked);
  }, hold);

  /*
   * **The centre is free once the kept card has landed**, which is what the next draw waits for --
   * not the five seconds it then spends parked. A turn that draws twice should park its second
   * card beside the first while the first is still there, which is the whole point of the row.
   */
  return new Promise(resolve => window.setTimeout(resolve, hold + TIMING.fly));
}

/**
 * **One reveal at a time.**  **[FIXED 2026-11-23]**
 *
 * Each reveal computed its own centre and dealt there immediately, and an action can draw more
 * than once: an attack draws for itself, and then again for a saving throw it forced or for the
 * injury of a target it dropped (resolve.mjs). So **an attack with advantage showed three cards**
 * -- the pair, plus a single from the second draw, all stacked in the middle of the screen at the
 * same time. The player asked what the third card was, which is the right question and had no
 * answer: it belonged to a different draw and nothing said so.
 *
 * Queued, so the middle of the screen means one draw. The second reveal starts when the first has
 * landed, which is also exactly the sequence the table asked for: the primary's card parks, then
 * the secondary's is shown and parks beside it.
 *
 * **Bounded**, because a queue is a promise about the future and this one is about the present. A
 * card dealt thirty seconds after the action it came from is a lie about which action drew it, so
 * past a short backlog the reveal is dropped -- the piles underneath have recorded the draw either
 * way, which is what they are for.
 */
let waiting = Promise.resolve();
let pending = 0;
const QUEUE_MAX = 3;

export function showFate({ drawn = [], used = null } = {}) {
  if (!drawn.length) return;
  if (pending >= QUEUE_MAX) return;
  pending++;
  /*
   * `mode` is in the hook's payload and deliberately not read: **how many cards were drawn already
   * says whether this was an advantage draw**, and `used` already says which one the rule took. A
   * reveal that read the mode as well would be a second opinion about a question the cards have
   * already answered -- and the one that disagreed would be this one, which can only ever be
   * wrong about it.
   */
  waiting = waiting
    .then(() => reveal({ drawn, used }))
    /* A reveal that throws must never take the action down with it: the draw has already happened
     * and the number is already real. It also must not break the chain, or every later draw in the
     * session goes unshown -- which is why this sits inside the link rather than around it. */
    .catch(err => console.error("cardrpg | the fate reveal failed", err))
    .finally(() => { pending--; });
}

/**
 * Listen for draws.
 *
 * **Every draw, on every client.** A fate card is public -- hud-spec 7 keeps a HAND private and
 * says counts and draws are not -- so a player watching the GM's goblin swing sees the card that
 * settled it, which is the whole reason the deck is face up once drawn.
 */
export function registerFateShow() {
  /* The failure path is inside the queue, where the work is: see `showFate`. */
  Hooks.on("cardrpgFateDrawn", data => showFate(data ?? {}));
}
