/**
 * The acceptance gate: does a generated picture obey the capsule it was generated from?
 *
 * **This exists because the first batch of twenty-two was judged by eye, and the eye was wrong.**
 * They are good pictures. Fifteen of the seventeen faces put dark mass under the card's own name
 * panel and sixteen put the centre of their ink in the half the rules text covers, and nobody saw
 * it until it was measured. Five hundred and eight pieces cannot be judged by eye at all.
 *
 * Every rule below is one the capsule states in words, turned into a number:
 *
 * | capsule says | measured as |
 * |---|---|
 * | a bare strip at the top, at least a sixth | the first row carrying ink is at or below `quietTop` |
 * | the focal is above the middle | the centroid of the dark mass is above 50% |
 * | a picture with no true black has failed | some pixels under L14 |
 * | a PANEL picture obeys the palette and not the card's layout | `kind: "panel"` -- the level-up
 *   pane prints its heading under the picture, so there is no name panel to leave clear |
 * | generous untouched paper | some pixels over L86 |
 * | warm throughout, no cool hue | almost nothing in the cyan-to-violet hues |
 * | never neutral grey | few desaturated mid tones |
 * | full bleed, no mat or margin | no pale, even ring at the edge |
 *
 * It shells out to ImageMagick, which the suite does not need and this does: `npm test` must run
 * anywhere, and nothing generates art without a toolchain anyway.
 */
import { execFileSync } from "node:child_process";

/** One place, so a threshold argued about is argued about once. */
/*
 * **`minWindow` replaced a centroid, and the replacement is the point of the whole file.**
 *
 * The first gate asked whether the dark mass centred above the halfway line, which is a proxy for
 * "the picture is top-weighted" and punishes a figure that legitimately reaches the bottom edge.
 * The card does not care where the mass centres. It cares what survives the two opaque panels,
 * and the measured clear window is 13%-43% of the height.
 *
 * So: what fraction of the drawing's dark ink falls inside that window. The window is 30% of the
 * height, so **30% is what flat, featureless ink would score** -- which makes it the floor worth
 * holding, since a composition that concentrates nothing there is not composing for this card.
 * It separates cleanly on the pieces to hand: 47% for the best of the first batch, 35% for a
 * middling one, and 4% for a picture that scored better on every other rule in this table.
 */
export const GATE = {
  window: [0.13, 0.43], // the band the name panel and the rules text leave clear
  minWindow: 0.30,      // ...and the share of the dark ink that must land inside it
  /*
   * **Deliberately below what the capsule asks for, and that is the whole relationship.**
   *
   * The capsule asks for at least a sixth; this enforces a tenth. Asking for exactly what you
   * enforce is what made half of 790 attempts fail -- so the ask carries the margin and the gate
   * holds the layout fact, which is that the name panel covers the top tenth. Moving this number
   * moves what the card can print over; moving the capsule's moves the odds of a draw.
   */
  quietTop: 0.10,       // the strip of bare paper at the top, as a fraction of the height
  minBlack: 0.003,      // fraction of pixels under L14
  minPaper: 0.05,       // fraction over L86
  maxCool: 0.01,        // fraction outside the warm band (0-60 deg) at visible saturation
  maxGrey: 0.20,        // fraction of desaturated mid tones
  inkAt: 0.30,          // "carrying ink": darker than this lightness
  inkRow: 0.02,         // ...on at least this fraction of a row
  minEdgeGrain: 2.0,    // variation along the outermost pixels: a mat has none at all
  minSymmetry: 0.80,    // a back against its own mirror image
  maxOpaque: 0.90       // a token with a background is a square of the wrong colour on the map
};

/** Pixels, at a size that is fast and still fine enough to find a brush line. */
const W = 256, H = 384;

export function measure(file, { token = false } = {}) {
  const probe = execFileSync("magick", [file, "-format", /* Delimited, because `%[channels]` is itself two words (`srgba 4.0`) and splitting this on
   * spaces put the alpha property in the wrong field. */
  "%w|%h|%m|%[channels]|%A", "info:"])
    .toString().trim().split("|");
  const [w, h] = [Number(probe[0]), Number(probe[1])];
  const raw = execFileSync("magick", [file, ...(token ? ["-background", "white", "-flatten"] : []),
    "-resize", `${W}x${H}!`, "-depth", "8", "rgb:-"], { maxBuffer: 1 << 28 });

  let black = 0, paper = 0, cool = 0, grey = 0, n = 0;
  let mass = 0, massRow = 0, firstInk = -1, drawn = 0, inWindow = 0;
  let ring = 0, ringN = 0, inner = 0, innerN = 0;
  const ringVals = [];
  for (let y = 0; y < H; y++) {
    let inked = 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3, r = raw[i], g = raw[i + 1], b = raw[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
      const l = (max + min) / 510;
      const s = d === 0 ? 0 : (d / 255) / (1 - Math.abs(2 * l - 1) || 1e-9);
      let hue = 0;
      if (d) {
        hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        hue *= 60; if (hue < 0) hue += 360;
      }
      n++;
      if (l < 0.14) black++;
      if (l > 0.86) paper++;
      /* Not a COOL band but an OFF-PALETTE one. The old test ran 140-290 degrees, cyan to
       * violet, and a green creature at 100 degrees would have walked straight through the one
       * rule meant to keep this set warm. The palette is 9-35 degrees end to end, so anything
       * with real saturation outside 0-60 is not in it. Measured at 0.0-0.4% on every piece
       * drawn so far, which is the margin that makes the test safe to tighten. */
      if (s > 0.15 && hue > 60 && hue < 340) cool++;
      if (l > 0.2 && l < 0.8 && s < 0.06) grey++;
      if (l < GATE.inkAt) {
        inked++;
        /* The drawing, as opposed to the wash: this is what has to survive the panels. */
        drawn++;
        const at = y / H;
        if (at >= GATE.window[0] && at <= GATE.window[1]) inWindow++;
      }
      /* Weighted by darkness, so a wash counts for less than a contour. */
      mass += 1 - l; massRow += (1 - l) * y;
      /*
       * **A mat is a STEP, not a pale edge**, and the first version of this tested the wrong one.
       *
       * It asked whether the outer ring was pale and flat, which condemned two cards out of the
       * first nine shot under the new rule -- and both were full bleed. They were pale at all
       * four edges because the capsule now ASKS for bare paper at the top and a pale lower half,
       * so a quiet border is the style working rather than a border being drawn.
       *
       * What a mat, a frame or a rounded corner actually leaves is a discontinuity: the picture
       * stops, at a constant inset, and something uniform sits outside it. So compare the extreme
       * edge with the band just inside it. On those nine the largest step was 0.015.
       */
      if (x < 3 || x >= W - 3 || y < 3 || y >= H - 3) {
        ring += l; ringN++; ringVals.push(l);
      } else if (x < 10 || x >= W - 10 || y < 10 || y >= H - 10) {
        inner += l; innerN++;
      }
    }
    if (firstInk < 0 && inked / W >= GATE.inkRow) firstInk = y;
  }
  const ringMean = ring / ringN;
  const edgeStep = Math.abs(ringMean - (innerN ? inner / innerN : ringMean));
  const ringSd = Math.sqrt(ringVals.reduce((t, v) => t + (v - ringMean) ** 2, 0) / ringN);
  return {
    file, width: w, height: h, format: probe[2], channels: probe[3], alpha: probe[4],
    quietTop: firstInk < 0 ? 1 : firstInk / H,
    massAt: mass ? massRow / mass / H : 1,
    inWindow: drawn ? inWindow / drawn : 0,
    black: black / n, paper: paper / n, cool: cool / n, grey: grey / n,
    ringMean, ringSd, edgeStep
  };
}

/**
 * The measurement turned into a verdict, and **the three kinds are judged differently on
 * purpose** -- because their capsules differ, and a gate that applied the card's rules to the
 * other two would condemn the five best pictures in the set.
 *
 * - A **card** gets all of it. Something is printed over it, so where the ink sits is the whole
 *   argument.
 * - A **back** has *no safe area* in its own capsule: nothing is ever printed over it, it is a
 *   centred device, and ink in the top quarter is what it is supposed to look like. It is also
 *   allowed its pale even edge, which on a card would be a mat and on a back is the paper the
 *   device sits on. What it is asked instead is whether it is symmetrical, since half the table
 *   reads it upside down.
 * - A **token** has no paper behind it at all and nothing printed over it, so only the palette
 *   rules and the size apply -- and the one thing its capsule asks for that no other piece does,
 *   which is a real alpha channel.
 */
export function score(file, { kind = "card", size = "1024x1536" } = {}) {
  const token = kind === "token";
  const m = measure(file, { token });
  if (token) m.opaque = opaqueShare(file);
  const [wantW, wantH] = size.split("x").map(Number);
  const faults = [];
  const pc = x => `${(x * 100).toFixed(1)}%`;

  if (m.width !== wantW || m.height !== wantH) {
    faults.push(`${m.width}x${m.height}, not ${size}`);
  }
  /*
   * **The palette binds a card and a back, and not a token.**
   *
   * The warm sepia is what makes a hand of cards read as one printed set. A token is a miniature
   * on a map: it is seen beside other miniatures and never beside a card at a size where the
   * difference shows, so a mossy troll is green and a drowned draugr is hel-bla and neither is a
   * fault. Holding them to red-and-amber bought nothing and cost the creature.
   *
   * The near-black contour still binds all three, because that is the hand rather than the hue.
   */
  if (!token) {
    if (m.cool > GATE.maxCool) faults.push(`${pc(m.cool)} of it is outside the warm palette`);
    if (m.grey > GATE.maxGrey) faults.push(`grey mid tones on ${pc(m.grey)}`);
  }
  if (m.black < GATE.minBlack) faults.push(`no true black (${pc(m.black)} under L14)`);

  /*
   * **A panel picture is not a card face, and seven of the first seventy-five failed on a rule
   * about a name panel that is not over them.**  [BUILT 2026-11-13]
   *
   * `quietTop` and `minWindow` are not style: they are the measured geometry of a CARD. The name
   * prints across the top tenth and the rules text across the bottom half, so ink up there is ink
   * behind a panel and a composition that puts nothing in the clear band is a composition nobody
   * will see. Both sentences are false of the level-up pane, where the picture sits ABOVE the
   * heading with nothing printed over it at all.
   *
   * So the three graph shelves are scored as `panel`: the palette, the near-black contour and the
   * bare paper still bind -- those are the house hand, and a portrait that is not in it reads as
   * imported from another game -- and the two layout rules do not apply. `edgeGrain` goes with
   * them, since it is about a card being full-bleed in a hand.
   *
   * Seven pictures, all between 7.8% and 9.9% against a floor of 10%, were being asked to leave
   * room for a panel that does not exist.
   */
  if (kind === "card" || kind === "panel") {
    if (m.paper < GATE.minPaper) faults.push(`no bare paper (${pc(m.paper)} over L86)`);
  }
  if (kind === "card") {
    if (m.quietTop < GATE.quietTop) {
      faults.push(`ink reaches ${pc(m.quietTop)} from the top, inside the name panel`);
    }
    if (m.inWindow < GATE.minWindow) {
      faults.push(`only ${pc(m.inWindow)} of the drawing falls in the band the card leaves `
        + `clear (${pc(GATE.window[0])}-${pc(GATE.window[1])}); the rest is behind a panel`);
    }
    m.edgeGrain = edgeGrain(file);
    if (m.edgeGrain < GATE.minEdgeGrain) {
      faults.push(`the outer edge is a flat colour (grain ${m.edgeGrain.toFixed(1)}): `
        + "a mat, a frame or a rounded corner, not full bleed");
    }
  }
  if (kind === "back") {
    if (m.paper < GATE.minPaper) faults.push(`no bare paper (${pc(m.paper)} over L86)`);
    m.symmetry = symmetry(file);
    if (m.symmetry < GATE.minSymmetry) {
      faults.push(`not symmetrical (${m.symmetry.toFixed(2)}), and half the table reads it `
        + "upside down");
    }
  }
  /*
   * ImageMagick`s own alpha property, not the channel STRING -- `/a/i` against the channels
   * matched the `a` in `gray`, so an opaque greyscale token would have sailed through the one
   * check written specifically to catch an opaque token.
   */
  if (token) {
    if (!/^(True|Blend|Associated)$/i.test(m.alpha ?? "")) {
      faults.push(`no alpha channel (alpha ${m.alpha}): a token sits on a map, not in a square`);
    } else if (m.opaque > GATE.maxOpaque) {
      faults.push(`${pc(m.opaque)} of the square is opaque: the background was not cut out`);
    }
  }
  return { ...m, kind, faults, ok: faults.length === 0 };
}

/**
 * How near a back is to its own mirror image, which is the capsule's *symmetrical or near,
 * centred, and legible upside down* asked as a number. Left against right, because a device that
 * mirrors left to right is the one that survives being turned around on a table.
 */
/**
 * **Whether the outermost pixels are a drawing or a decision**, which is what tells a full bleed
 * from a mat -- and the third test to be written for this, because the first two were wrong.
 *
 * Asking whether the border was pale and flat condemned two full-bleed cards out of nine: the
 * capsule now asks for bare paper at the top and a pale lower half, so quiet edges are the style
 * working. Asking for a STEP between the edge and the band inside it caught a black frame and
 * sailed past a white mat, because a white mat on a pale picture is barely a step at all.
 *
 * What a mat always is, and what paper never is, is **exactly uniform**. Measured on the outer
 * two pixels at full resolution, where the rag grain still exists: a synthetic border of either
 * colour scores 0.00, and the flattest real card in the set scores 8.9. There is no overlap to
 * argue about.
 */
/** How much of a token is NOT transparent -- a cut-out that cut nothing still has an alpha
 * channel, so the channel being present is not the question. */
export function opaqueShare(file) {
  const mean = execFileSync("magick", [file, "-format", "%[fx:mean.a]", "info:"]).toString().trim();
  return Number(mean);
}

export function edgeGrain(file) {
  const [w, h] = execFileSync("magick", [file, "-format", "%w %h", "info:"])
    .toString().trim().split(" ").map(Number);
  const grey = execFileSync("magick", [file, "-colorspace", "gray", "-depth", "8", "gray:-"],
    { maxBuffer: 1 << 28 });
  const edge = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x < 2 || x >= w - 2 || y < 2 || y >= h - 2) edge.push(grey[y * w + x]);
    }
  }
  const mean = edge.reduce((t, v) => t + v, 0) / edge.length;
  return Math.sqrt(edge.reduce((t, v) => t + (v - mean) ** 2, 0) / edge.length);
}

export function symmetry(file) {
  const w = 128, h = 192;
  const raw = execFileSync("magick", [file, "-colorspace", "gray", "-resize", `${w}x${h}!`,
    "-depth", "8", "gray:-"], { maxBuffer: 1 << 26 });
  const a = [], b = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    a.push(raw[y * w + x]); b.push(raw[y * w + (w - 1 - x)]);
  }
  const mean = v => v.reduce((t, x) => t + x, 0) / v.length;
  const ma = mean(a), mb = mean(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2;
  }
  return num / Math.sqrt(da * db || 1);
}

export function report(s) {
  const pc = x => `${(x * 100).toFixed(1)}%`.padStart(6);
  return [
    `  ${s.ok ? "PASS" : "FAIL"}  ${s.file}`,
    `        ${s.width}x${s.height} ${s.format}`,
    /* Only what this kind is actually held to: printing a card rule beside a token, with a
     * `want` next to it that nothing enforces, is a report that lies about its own verdict. */
    ...(s.kind === "card" ? [
      `        empty top ${pc(s.quietTop)} (want ${pc(GATE.quietTop)}+)`,
      `        in window ${pc(s.inWindow)} (want ${pc(GATE.minWindow)}+)`
    ] : []),
    ...(s.kind === "token" ? [`        opaque    ${pc(s.opaque)} (want under ${pc(GATE.maxOpaque)})`] : []),
    s.kind === "token"
      ? `        black     ${pc(s.black)}   (hue is the creature’s own, not the deck’s)`
      : `        black     ${pc(s.black)} | cool ${pc(s.cool)} | grey ${pc(s.grey)}`
        + ` | paper ${pc(s.paper)}`,
    ...(s.symmetry === undefined ? [] : [`        symmetry  ${s.symmetry.toFixed(2)}`]),
    ...s.faults.map(f => `        - ${f}`)
  ].join("\n");
}

/* Run directly on files: node test/art-gate.mjs <file>... */
if (process.argv[1]?.endsWith("art-gate.mjs")) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.log("usage: node test/art-gate.mjs <image>...");
    process.exit(1);
  }
  let bad = 0;
  for (const f of files) {
    /* The kind is read off the path, which is what the art list files it under anyway. */
    const kind = /(^|\/)backs\//.test(f) ? "back"
      : /(^|\/)tokens?\//.test(f) ? "token" : "card";
    const s = score(f, { kind, size: kind === "token" ? "1024x1024" : "1024x1536" });
    if (!s.ok) bad++;
    console.log(report(s));
  }
  console.log(`\n${files.length - bad} of ${files.length} pass the gate`);
  process.exit(bad ? 1 : 0);
}
