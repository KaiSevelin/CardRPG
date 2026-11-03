/**
 * Clickable checks in prepared text.
 *
 * **This is where the table's time actually goes.** A call for a check (checks.mjs) fixed who sets
 * the difficulty; it did not change the fact that the GM has to set it again every time, while
 * reading from a page that already says what it should be. Most out-of-combat checks come from
 * prepared material -- a journal page of a manor, a handout, an item's description -- so the
 * cheapest streamlining available is to let the preparation carry the call.
 *
 *     @Check[wits|hard]{Spot the tripwire}
 *     @Check[shadow|7|advantage]{The shutter is unlatched}
 *     @Challenge[5|3]{Into the baron's manor}
 *
 * Writing one in a journal gives a button. The GM clicks it and the call (or the challenge) is set
 * for the whole party, exactly as if they had filled in the dialog.
 *
 * **A player clicking one gets nothing but a reminder**, because step 1 is still the GM's: an
 * enricher is a shortcut for the person who was always allowed to do it, not a way round the rule.
 * And nothing here resolves anything -- the player still plays a card.
 */

import { CARDRPG } from "./config.mjs";
import { setCall, describeCall, startChallenge } from "./checks.mjs";

/** The class every button of ours carries, so one delegated listener serves all of them. */
const CLICK = "cr-enriched";

/**
 * `@Check[approach|difficulty|edge]{label}`.
 *
 * The parts are order-free and all optional, because a GM writing prep should not have to remember
 * a grammar: a word that names an approach is the approach, a word or number that names a
 * difficulty is the difficulty, *advantage* or *disadvantage* is the edge. Anything else is
 * ignored rather than refused, since a page full of red errors is worse than a page with one odd
 * button.
 */
function parseCheck(args) {
  const out = { approach: "any", dc: CARDRPG.difficulties.normal, mode: 0 };
  for (const raw of args) {
    const part = raw.trim().toLowerCase();
    if (!part) continue;
    if (part in CARDRPG.approaches && part !== "any") { out.approach = part; continue; }
    if (part in CARDRPG.difficulties) { out.dc = CARDRPG.difficulties[part]; continue; }
    if (/^\d+$/.test(part)) { out.dc = Number(part); continue; }
    if (part === "advantage" || part === "adv") { out.mode = 1; continue; }
    if (part === "disadvantage" || part === "dis") { out.mode = -1; continue; }
  }
  return out;
}

/** `@Challenge[progress|pressure]{label}`: the two numbers, progress first. */
function parseChallenge(args) {
  const nums = args.map(a => Number(String(a).trim())).filter(n => Number.isFinite(n) && n > 0);
  return { progressMax: nums[0] ?? 5, pressureMax: nums[1] ?? 3 };
}

/** One button, in Foundry's own content-link shape so it inherits the styling of a document link. */
function button({ kind, label, tip, data }) {
  const a = document.createElement("a");
  a.className = `content-link ${CLICK}`;
  a.dataset.crKind = kind;
  for (const [key, value] of Object.entries(data)) a.dataset[key] = String(value);
  a.dataset.tooltip = tip;
  const icon = document.createElement("i");
  icon.className = kind === "challenge" ? "fa-solid fa-tower-observation" : "fa-solid fa-dice-d20";
  a.append(icon, document.createTextNode(` ${label}`));
  return a;
}

/**
 * Register both patterns.
 *
 * `enricher` returns an element or null; returning null leaves the text alone, which is what a
 * malformed tag should do. Called at `init`, because enrichment happens the first time anything
 * renders a journal page.
 */
export function registerEnrichers() {
  const enrichers = CONFIG.TextEditor?.enrichers;
  if (!enrichers) return;

  enrichers.push({
    pattern: /@Check\[([^\]]+)\](?:\{([^}]+)\})?/g,
    enricher: (match) => {
      const parsed = parseCheck((match[1] ?? "").split("|"));
      const label = (match[2] ?? "").trim() || describeCall({ ...parsed, note: "" });
      return button({
        kind: "check", label,
        tip: `${describeCall({ ...parsed, note: "" })} — click to call it for the party.`,
        data: { crApproach: parsed.approach, crDc: parsed.dc, crMode: parsed.mode, crNote: label }
      });
    }
  });

  enrichers.push({
    pattern: /@Challenge\[([^\]]+)\](?:\{([^}]+)\})?/g,
    enricher: (match) => {
      const { progressMax, pressureMax } = parseChallenge((match[1] ?? "").split("|"));
      const label = (match[2] ?? "").trim() || `Challenge ${progressMax}/${pressureMax}`;
      return button({
        kind: "challenge", label,
        tip: `Progress ${progressMax}, Pressure ${pressureMax} — click to begin it.`,
        data: { crProgress: progressMax, crPressure: pressureMax, crNote: label }
      });
    }
  });
}

/**
 * One delegated listener for every button we ever render.
 *
 * Delegated rather than bound per render, because enriched text appears in journals, chat, item
 * descriptions and tooltips, and binding in each place would mean knowing every place.
 */
export function registerEnricherClicks() {
  document.addEventListener("click", async event => {
    const link = event.target?.closest?.(`a.${CLICK}`);
    if (!link) return;
    event.preventDefault();
    if (!game.user.isGM) {
      return ui.notifications.info(game.i18n.localize("CARDRPG.Check.GMCalls"));
    }
    const d = link.dataset;
    if (d.crKind === "challenge") {
      await startChallenge({
        progressMax: Number(d.crProgress), pressureMax: Number(d.crPressure), note: d.crNote ?? ""
      });
      return ui.notifications.info(game.i18n.localize("CARDRPG.Challenge.Started"));
    }
    const call = await setCall({
      approach: d.crApproach ?? "any", dc: Number(d.crDc), mode: Number(d.crMode ?? 0),
      note: d.crNote ?? ""
    });
    if (call) {
      await ChatMessage.create({
        content: `<div class="cardrpg"><p><strong>${describeCall(call)}</strong>`
          + `${call.note ? ` &mdash; ${foundry.utils.escapeHTML(call.note)}` : ""}</p></div>`
      });
    }
  });
}
