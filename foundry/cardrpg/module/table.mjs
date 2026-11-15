/**
 * The table board: one button on a token, one dialog for everything the GM sets.
 *
 * **Why this exists at all.** The GM's half of a check (skill-rules 2, step 1) and the start of a
 * challenge (skill-rules 3) were two buttons inside the scene panel of the player HUD. That put
 * the GM's controls inside a window belonging to whichever character is selected, in a panel that
 * only renders out of combat, at the far side of the screen from the token being talked about.
 * The gesture a GM actually makes is *point at the people this is happening to*, and the thing
 * under the pointer is a token.
 *
 * So the entry point is a control on the token HUD, and what it opens is one dialog rather than
 * two: **a check and a challenge are the same statement at two lengths.** Both name an obstacle,
 * both name a cast, and the only difference is whether one card settles it or a track does.
 * Asking "check or challenge?" inside one dialog is a question the GM can change their mind
 * about; two separate buttons is a decision taken before the dialog opens.
 *
 * **The cast is the part that is new.** A call used to be addressed to the room. Naming the
 * characters involved is what group and opposed checks will both need, and it is worth recording
 * before either exists: the banner can say who is answering, and nothing has to be invented later
 * to find out who was in the scene.
 */

import { CARDRPG } from "./config.mjs";
import {
  readCall, setCall, readChallenge, startChallenge, describeCall, describeCast
} from "./checks.mjs";
import { passiveScore } from "./resolve.mjs";

/**
 * Who the board can name.
 *
 * Tokens on the canvas rather than every actor in the world: a check happens to the people in the
 * room, and a directory of forty characters is a worse list than the six who are standing there.
 * Deduplicated by actor, because two tokens of one character are one person answering.
 */
export function castCandidates() {
  const seen = new Map();
  for (const token of canvas?.tokens?.placeables ?? []) {
    const actor = token.actor;
    if (!actor || actor.type !== "character") continue;
    if (!seen.has(actor.id)) seen.set(actor.id, { actor, controlled: !!token.controlled });
    else if (token.controlled) seen.get(actor.id).controlled = true;
  }
  return [...seen.values()].sort((a, b) => a.actor.name.localeCompare(b.actor.name));
}

/**
 * Who is resisting, as actors.
 *
 * **Targets first.** A GM naming an opposed check points at the thing being opposed, and Foundry
 * already has a word for that gesture: the target ring. Falling back to a selected monster covers
 * the GM who selected rather than targeted, and the cast is excluded either way so a character in
 * the check cannot also be the wall.
 */
export function opposition({ exclude = [] } = {}) {
  const seen = new Map();
  const add = actor => {
    if (!actor || exclude.includes(actor.id) || seen.has(actor.id)) return;
    seen.set(actor.id, actor);
  };
  for (const token of game.user?.targets ?? []) add(token.actor);
  if (!seen.size) {
    for (const token of canvas?.tokens?.placeables ?? []) {
      if (token.controlled && token.actor?.type === "npc") add(token.actor);
    }
  }
  return [...seen.values()];
}

/**
 * What they resist with, per approach, and the number to put in the field.
 *
 * **The highest of them, not the sum.** Two guards are harder than one, but not twice as hard,
 * and a crowd is priced by the GM raising the number or handing out disadvantage (skill-rules 2).
 * What the engine can say without guessing is *the best of the people in your way*, which is
 * exactly what a passive is for: the score somebody brings to a thing they are not actively
 * trying at. Everything above that is a judgement, and the field is editable because it is one.
 *
 * `any` is their best across all six, for a call that has not named an approach yet.
 */
export function oppositionScores(actors) {
  if (!actors.length) return null;
  const out = { any: 0 };
  for (const key of Object.keys(CARDRPG.approaches)) {
    if (key === "any") continue;
    const best = Math.max(...actors.map(a => passiveScore(a, key)));
    out[key] = best;
    out.any = Math.max(out.any, best);
  }
  return out;
}

/**
 * Open the board.
 *
 * `preselect` is the actor the GM pointed at, which is ticked on top of whatever is controlled:
 * clicking the button on a token is itself a statement about who this is for.
 */
export async function openTableBoard({ preselect = null } = {}) {
  if (!game.user.isGM) return ui.notifications.info(game.i18n.localize("CARDRPG.Check.GMCalls"));
  if (!game.scenes?.active) {
    return ui.notifications.warn(game.i18n.localize("CARDRPG.Check.NoScene"));
  }

  const call = readCall();
  const live = readChallenge();
  const candidates = castCandidates();
  const esc = foundry.utils.escapeHTML;

  /* Who is in the way, and what they bring to it. */
  const against = opposition({ exclude: candidates.map(c => c.actor.id) });
  const scores = oppositionScores(against);
  const suggested = scores ? (scores[call?.approach ?? "any"] ?? scores.any) : null;

  /* Ticked already: whoever a live call or challenge named, else the selection, else the token. */
  const named = new Set([...(live?.who ?? []), ...(call?.who ?? [])]);
  const ticked = id => named.size
    ? named.has(id)
    : (preselect === id || !!candidates.find(c => c.actor.id === id)?.controlled);

  const people = candidates.length
    ? candidates.map(({ actor }) => `<label class="cr-board__person">`
      + `<input type="checkbox" name="who" value="${actor.id}"`
      + `${ticked(actor.id) ? " checked" : ""}>`
      + `<span>${esc(actor.name)}</span></label>`).join("")
    : `<p class="cr-note">${game.i18n.localize("CARDRPG.Board.NoCast")}</p>`;

  /*
   * **Any number, not just the four rungs.**  [2026-11-15]
   *
   * The ladder is Easy 3, Normal 5, Hard 7, Heroic 9, and a drop-down of those four is the whole
   * of what a GM could set. That is enough for an obstacle and not enough for a person: an
   * opposed check is pitched against somebody, and somebody is a 6 or an 8 as easily as a 7.
   * Rather than teach the engine how a crowd of guards adds up, the number is simply the GM's to
   * type -- the rungs stay as the suggestions on it, since they are what most calls are.
   */
  const rungs = Object.entries(CARDRPG.difficulties)
    .map(([name, dc]) => `<option value="${dc}">${name}</option>`).join("");
  const rungNote = Object.entries(CARDRPG.difficulties)
    .map(([name, dc]) => `${name} ${dc}`).join(" · ");
  const approaches = [`<option value="any">`
    + `${game.i18n.localize("CARDRPG.Check.AnyApproach")}</option>`,
  ...Object.entries(CARDRPG.approaches).filter(([key]) => key !== "any")
    .map(([key, cfg]) => `<option value="${key}"${call?.approach === key ? " selected" : ""}>`
      + `${game.i18n.localize(cfg.label ?? key)}</option>`)].join("");

  /*
   * **The number starts where the opposition is, and stays the GM's.**  [2026-11-15]
   *
   * An opposed check is pitched against somebody, so the field opens on that somebody's passive
   * rather than on a generic Normal 5: it is the one number the engine can state without
   * guessing. Everything that makes it harder -- a second guard, an alert watch, high ground --
   * is a judgement, so the field is a field and the suggestion follows the approach only until
   * the GM types over it.
   */
  const againstNote = against.length
    ? `<p class="cr-note">${game.i18n.format("CARDRPG.Board.Against",
      { who: esc(against.map(a => a.name).join(", ")), n: suggested })}</p>`
    : "";

  const answer = await foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.localize("CARDRPG.Board.Title") },
    classes: ["cardrpg"],
    content: `<div class="cardrpg cr-check cr-board">
      <p class="cr-note">${game.i18n.localize("CARDRPG.Board.Body")}</p>

      <fieldset class="cr-board__cast">
        <legend>${game.i18n.localize("CARDRPG.Board.Cast")}</legend>
        <div class="cr-board__people">${people}</div>
      </fieldset>

      <fieldset class="cr-board__shape">
        <legend>${game.i18n.localize("CARDRPG.Board.Shape")}</legend>
        <label><input type="radio" name="shape" value="check" checked>
          ${game.i18n.localize("CARDRPG.Board.AsCheck")}</label>
        <label><input type="radio" name="shape" value="challenge"${live ? " disabled" : ""}>
          ${game.i18n.localize("CARDRPG.Board.AsChallenge")}</label>
        ${live ? `<p class="cr-note">${game.i18n.localize("CARDRPG.Board.AlreadyRunning")}</p>` : ""}
      </fieldset>

      <div data-shape="check">
        <label>${game.i18n.localize("CARDRPG.Check.Difficulty")}
          <input type="number" name="dc" min="1" max="30" list="cr-board-rungs"
                 value="${call?.dc ?? suggested ?? CARDRPG.difficulties.normal}"></label>
        <datalist id="cr-board-rungs">${rungs}</datalist>
        ${againstNote}
        <p class="cr-note">${rungNote}. ${game.i18n.localize("CARDRPG.Board.AnyNumber")}</p>
        <label>${game.i18n.localize("CARDRPG.Check.Approach")}
          <select name="approach">${approaches}</select></label>
        <label>${game.i18n.localize("CARDRPG.Check.Edge")} <select name="mode">
          <option value="0">${game.i18n.localize("CARDRPG.Check.Even")}</option>
          <option value="1">${game.i18n.localize("CARDRPG.Check.Advantage")}</option>
          <option value="-1">${game.i18n.localize("CARDRPG.Check.Disadvantage")}</option>
        </select></label>
      </div>

      <div data-shape="challenge" hidden>
        <label>${game.i18n.localize("CARDRPG.Challenge.Progress")}
          <input type="number" name="progressMax" value="5" min="1" max="20"></label>
        <label>${game.i18n.localize("CARDRPG.Challenge.Pressure")}
          <input type="number" name="pressureMax" value="3" min="1" max="20"></label>
        <label class="cr-board__flag"><input type="checkbox" name="ritual">
          ${game.i18n.localize("CARDRPG.Board.Ritual")}</label>
      </div>

      <label>${game.i18n.localize("CARDRPG.Check.Note")}
        <input type="text" name="note" value="${esc(call?.note ?? "")}"></label>
    </div>`,
    /*
     * The two halves swap rather than both being shown. A dialog that asks for a difficulty AND a
     * pair of track lengths is asking a question it has already been told the answer to.
     */
    render: (event, dialog) => {
      const form = dialog.element.querySelector("form") ?? dialog.element;
      const show = () => {
        const shape = form.querySelector("input[name=shape]:checked")?.value ?? "check";
        for (const block of form.querySelectorAll("[data-shape]")) {
          block.hidden = block.dataset.shape !== shape;
        }
      };
      for (const radio of form.querySelectorAll("input[name=shape]")) {
        radio.addEventListener("change", show);
      }
      show();

      /*
       * The suggestion follows the approach, and stops the moment the GM disagrees with it. A
       * field that keeps overwriting what you typed is worse than one that never helped.
       */
      const dc = form.elements.dc;
      const approach = form.elements.approach;
      if (dc && approach && scores) {
        dc.addEventListener("input", () => { dc.dataset.touched = "yes"; });
        approach.addEventListener("change", () => {
          if (dc.dataset.touched === "yes") return;
          dc.value = scores[approach.value] ?? scores.any;
        });
      }
    },
    ok: {
      label: game.i18n.localize("CARDRPG.Board.Confirm"),
      callback: (ev, button) => {
        const form = button.form;
        return {
          shape: form.elements.shape.value,
          who: [...form.querySelectorAll("input[name=who]:checked")].map(i => i.value),
          dc: Number(form.elements.dc.value),
          approach: form.elements.approach.value,
          mode: Number(form.elements.mode.value),
          progressMax: Number(form.elements.progressMax.value),
          pressureMax: Number(form.elements.pressureMax.value),
          ritual: form.elements.ritual.checked,
          note: form.elements.note.value
        };
      }
    },
    rejectClose: false
  });
  if (!answer) return;

  const cast = describeCast(answer.who);
  const whoLine = cast ? `<br><span class="cr-note">${esc(cast)}</span>` : "";

  if (answer.shape === "challenge") {
    await startChallenge(answer);
    await ChatMessage.create({
      content: `<div class="cardrpg"><p><strong>`
        + `${game.i18n.localize("CARDRPG.Challenge.Title")}</strong> `
        + `${answer.progressMax}/${answer.pressureMax}`
        + `${answer.note ? ` · ${esc(answer.note)}` : ""}${whoLine}</p></div>`
    });
  } else {
    const set = await setCall(answer);
    await ChatMessage.create({
      content: `<div class="cardrpg"><p><strong>${describeCall(set)}</strong>`
        + `${answer.note ? ` — ${esc(answer.note)}` : ""}${whoLine}</p></div>`
    });
  }

  const { CardRPGTray } = await import("./tray.mjs");
  for (const tray of CardRPGTray.openTrays) tray.render();
}

/**
 * Put the button on the token HUD, bottom of the left column.
 *
 * **Left column and last**, because the right column is Foundry's own row of token states and the
 * left is where a system's own controls belong; last, because the board is a thing a GM reaches
 * for deliberately rather than one they hit by accident while dragging.
 *
 * The HUD has been both an Application and an ApplicationV2 across the versions this system runs
 * on, so the hook takes an element or a jQuery wrapper and is written to accept either rather
 * than to assume this week's one.
 */
export function registerTableBoard() {
  Hooks.on("renderTokenHUD", (hud, html) => {
    if (!game.user.isGM) return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    const column = root?.querySelector?.(".col.left") ?? root?.querySelector?.(".left");
    if (!column || column.querySelector(".cr-hud-board")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "control-icon cr-hud-board";
    button.dataset.tooltip = game.i18n.localize("CARDRPG.Board.Tooltip");
    button.setAttribute("aria-label", game.i18n.localize("CARDRPG.Board.Title"));
    button.innerHTML = `<i class="fa-solid fa-question"></i>`;
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await openTableBoard({ preselect: hud?.object?.actor?.id ?? null });
    });
    column.append(button);
  });
}
