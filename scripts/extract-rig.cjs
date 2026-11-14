/**
 * Builds 2D animation rigs from the original Karupatti drawings
 * (public/character/*.webp, themselves cut 1:1 from the character sheet).
 *
 * Each rig pose is split into layers on identical canvases, so stacking them
 * reproduces the original drawing pixel-for-pixel. The layers are then
 * animated independently: leaf, arms, legs, irises (eyes look around) and
 * skin-toned eyelids (blinks, squints, winks). Nothing is redrawn.
 *
 *   node scripts/extract-rig.cjs     →  public/character/rig/<rig>/<part>.webp
 *                                        src/components/character/rig.json
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const CHAR = path.resolve(__dirname, "../public/character");
const OUT = path.join(CHAR, "rig");

const green = (r, g, b) => g > r - 6 && g > b + 18; // leaf greens; the body is orange
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
// the sheet's painted ground shadow (pale tan) — dropped; the rig draws its own contact shadow
const tan = (r, g, b) => lum(r, g, b) > 138 && (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, 1) < 0.58;

/**
 * take(x,y,r,g,b): pixel belongs to this part's layer
 * cut(x,y,r,g,b):  pixel is removed from the body layer (default = take)
 */
const RIGS = {
  front: {
    src: "front.webp",
    parts: {
      leaf: { take: (x, y, r, g, b) => y < 66 && green(r, g, b), pivot: [111, 60] },
      // limbs sit behind the body, so they need no joint overlap
      armL: { take: (x, y) => x < 33 && y > 110, pivot: [34, 128] },
      armR: { take: (x, y) => x > 167 && y > 110, pivot: [166, 128] },
      legL: { take: (x, y, r, g, b) => y >= 183 && x < 100 && x > 30 && !tan(r, g, b), cut: (x, y) => y >= 183 && x < 100 && x > 30, pivot: [66, 181] },
      legR: { take: (x, y, r, g, b) => y >= 183 && x >= 100 && x < 170 && !tan(r, g, b), cut: (x, y) => y >= 183 && x >= 100 && x < 170, pivot: [136, 181] },
    },
    eyes: [
      { cx: 76.5, cy: 100, rx: 19, ry: 17.5, inset: 2.2 },
      { cx: 134, cy: 100, rx: 18, ry: 17, inset: 2.2 },
    ],
  },
  hero: {
    src: "hero-body.webp", // the big greeting pose; its raised arm is already separate (hero-arm.webp)
    parts: {
      leaf: { take: (x, y, r, g, b) => y < 226 && green(r, g, b), pivot: [300, 212] },
    },
    eyes: [
      { cx: 232, cy: 357, rx: 62, ry: 52, inset: 7 },
      { cx: 409, cy: 335, rx: 51, ry: 50, inset: 7 },
    ],
    extra: { arm: { file: "hero-arm.webp", pivot: [520, 455] } },
  },
};

async function buildRig(name, spec) {
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir, { recursive: true });
  const { data, info } = await sharp(path.join(CHAR, spec.src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const body = Buffer.from(data);
  const layers = {};
  for (const [p, def] of Object.entries(spec.parts)) {
    const buf = Buffer.alloc(data.length);
    const cut = def.cut || def.take;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      if (data[o + 3] === 0) continue;
      const [r, g, b] = [data[o], data[o + 1], data[o + 2]];
      if (def.take(x, y, r, g, b)) data.copy(buf, o, o, o + 4);
      if (cut(x, y, r, g, b)) body[o + 3] = 0;
    }
    layers[p] = buf;
  }

  // eyes: lift the iris into its own layer and refill the eye white beneath
  const eyes = [];
  const inEll = (x, y, e, inset) => ((x - e.cx) / (e.rx - inset)) ** 2 + ((y - e.cy) / (e.ry - inset)) ** 2 <= 1;
  for (let i = 0; i < spec.eyes.length; i++) {
    const e = spec.eyes[i];
    const whites = [];
    for (let y = Math.floor(e.cy - e.ry); y <= e.cy + e.ry; y++) for (let x = Math.floor(e.cx - e.rx); x <= e.cx + e.rx; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H || !inEll(x, y, e, e.inset)) continue;
      const o = (y * W + x) * 4;
      if (lum(data[o], data[o + 1], data[o + 2]) > 205) whites.push([data[o], data[o + 1], data[o + 2]]);
    }
    const med = [0, 1, 2].map((c) => whites.map((w) => w[c]).sort((a, b) => a - b)[whites.length >> 1] || 245);
    const iris = Buffer.alloc(data.length);
    for (let y = Math.floor(e.cy - e.ry); y <= e.cy + e.ry; y++) for (let x = Math.floor(e.cx - e.rx); x <= e.cx + e.rx; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H || !inEll(x, y, e, e.inset)) continue;
      const o = (y * W + x) * 4;
      const L = lum(body[o], body[o + 1], body[o + 2]);
      const a = Math.min(1, Math.max(0, (225 - L) / 70)); // soft iris matte
      if (a <= 0) continue;
      iris[o] = body[o]; iris[o + 1] = body[o + 1]; iris[o + 2] = body[o + 2]; iris[o + 3] = Math.round(a * 255);
      const shade = 1 - 0.1 * Math.max(0, 1 - (y - (e.cy - e.ry)) / (e.ry * 1.2));
      for (let c = 0; c < 3; c++) body[o + c] = Math.round(body[o + c] * (1 - a) + med[c] * shade * a);
    }
    // eyelid tone = mean skin colour just above the eye (brows skipped)
    const skin = [0, 0, 0]; let n = 0;
    for (let y = Math.floor(e.cy - e.ry * 1.9); y < e.cy - e.ry * 1.25; y++) for (let x = Math.floor(e.cx - e.rx * 0.7); x < e.cx + e.rx * 0.7; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const o = (y * W + x) * 4;
      if (data[o + 3] < 255 || lum(data[o], data[o + 1], data[o + 2]) < 70) continue;
      skin[0] += data[o]; skin[1] += data[o + 1]; skin[2] += data[o + 2]; n++;
    }
    const lid = skin.map((v) => Math.round(v / Math.max(1, n)));
    await sharp(iris, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 94, alphaQuality: 100 }).toFile(path.join(dir, `iris${i}.webp`));
    eyes.push({ cx: e.cx, cy: e.cy, rx: e.rx, ry: e.ry, inset: e.inset, lid: `rgb(${lid.join(",")})` });
  }

  await sharp(body, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 94, alphaQuality: 100 }).toFile(path.join(dir, "body.webp"));
  const parts = {};
  for (const [p, buf] of Object.entries(layers)) {
    await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 94, alphaQuality: 100 }).toFile(path.join(dir, `${p}.webp`));
    parts[p] = { pivot: spec.parts[p].pivot };
  }
  if (spec.extra?.arm) {
    fs.copyFileSync(path.join(CHAR, spec.extra.arm.file), path.join(dir, "arm.webp"));
    parts.arm = { pivot: spec.extra.arm.pivot };
  }
  console.log(`${name}: ${W}x${H}  parts=${Object.keys(parts).join(",")}  eyes=${eyes.length}`);
  return { w: W, h: H, parts, eyes };
}

(async () => {
  const meta = {};
  for (const [n, s] of Object.entries(RIGS)) meta[n] = await buildRig(n, s);
  fs.writeFileSync(path.resolve(__dirname, "../src/components/character/rig.json"), JSON.stringify(meta, null, 2));
})();
