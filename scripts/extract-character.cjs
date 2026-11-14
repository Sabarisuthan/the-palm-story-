/**
 * Cuts the official Karupatti mascot poses out of the character sheet
 * (design/karupatti-character-sheet.webp) into transparent WebP assets in
 * public/character/. The artwork itself is never redrawn: only the paper
 * background (plus speed-lines, "?" marks and soft ground shadows) is removed.
 *
 *   node scripts/extract-character.cjs
 */
const path = require("path");
const sharp = require("sharp");

const SHEET = path.resolve(__dirname, "../design/karupatti-character-sheet.webp");
const OUT = path.resolve(__dirname, "../public/character");

// [name, left, top, right, bottom] in sheet pixels (label banners excluded)
const POSES = [
  ["hero", 30, 20, 700, 752],
  ["happy", 725, 68, 966, 292],
  ["surprised", 990, 68, 1236, 292],
  ["wink", 1250, 68, 1496, 292],
  ["thinking", 700, 338, 962, 566],
  ["excited", 955, 342, 1242, 566],
  ["laughing", 1255, 338, 1506, 566],
  ["front", 620, 684, 836, 916],
  ["threequarter", 838, 684, 1006, 916],
  ["side", 1006, 684, 1140, 916],
  ["back", 1140, 684, 1338, 916],
  ["threequarter-back", 1338, 684, 1516, 916],
];

const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const satOf = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
};

async function cut(name, l, t, r, b) {
  const W = r - l, H = b - t;
  const { data } = await sharp(SHEET).extract({ left: l, top: t, width: W, height: H }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];

  // paper colour = median of the crop border
  const border = [];
  for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
  const ch = [[], [], []];
  border.forEach((i) => px(i).forEach((v, c) => ch[c].push(v)));
  const bg = ch.map((a) => a.sort((p, q) => p - q)[a.length >> 1]);

  // background-like: close to paper, OR light & unsaturated (ground shadow, paper gradient)
  const isBg = (i) => {
    const [R, G, B] = px(i);
    const d = Math.hypot(R - bg[0], G - bg[1], B - bg[2]);
    return d < 42 || (lumOf(R, G, B) > 168 && satOf(R, G, B) < 0.3);
  };

  // flood fill from the border — enclosed whites (eyes, teeth, shine) are never reached
  const bgMask = new Uint8Array(W * H);
  const stack = [];
  border.forEach((i) => { if (isBg(i) && !bgMask[i]) { bgMask[i] = 1; stack.push(i); } });
  while (stack.length) {
    const i = stack.pop();
    const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (!bgMask[n] && isBg(n)) { bgMask[n] = 1; stack.push(n); }
    }
  }

  // paper trapped between the legs (enclosed by legs + ground shadow): clear enclosed
  // paper-like pockets whose centre sits in the lower body. Eyes/teeth sit higher up.
  {
    const seen = new Uint8Array(W * H);
    for (let s = 0; s < W * H; s++) {
      if (bgMask[s] || seen[s] || !isBg(s)) continue;
      const region = [];
      const q = [s];
      seen[s] = 1;
      while (q.length) {
        const i = q.pop();
        region.push(i);
        const x = i % W, y = (i / W) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const n = ny * W + nx;
          if (!bgMask[n] && !seen[n] && isBg(n)) { seen[n] = 1; q.push(n); }
        }
      }
      const cy = region.reduce((acc, i) => acc + ((i / W) | 0), 0) / region.length;
      if (cy > H * 0.7 && region.length > 12) region.forEach((i) => (bgMask[i] = 1));
    }
  }

  // keep only the largest foreground island (drops speed-lines, "?", stray text)
  const comp = new Int32Array(W * H).fill(-1);
  let best = -1, bestSize = 0, id = 0;
  for (let s = 0; s < W * H; s++) {
    if (bgMask[s] || comp[s] !== -1) continue;
    let size = 0;
    const q = [s];
    comp[s] = id;
    while (q.length) {
      const i = q.pop();
      size++;
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (!bgMask[n] && comp[n] === -1) { comp[n] = id; q.push(n); }
      }
    }
    if (size > bestSize) { bestSize = size; best = id; }
    id++;
  }

  // alpha + soft 1px edge, with paper colour un-blended from edge pixels
  const out = Buffer.alloc(W * H * 4);
  const fg = (x, y) => x >= 0 && y >= 0 && x < W && y < H && comp[y * W + x] === best;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, o = i * 4;
      if (!fg(x, y)) continue;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += fg(x + dx, y + dy) ? 1 : 0;
      const a = n === 9 ? 1 : 0.35 + (n / 9) * 0.6;
      const [R, G, B] = px(i);
      const un = (v, k) => Math.max(0, Math.min(255, Math.round((v - bg[k] * (1 - a)) / a)));
      out[o] = un(R, 0); out[o + 1] = un(G, 1); out[o + 2] = un(B, 2); out[o + 3] = Math.round(a * 255);
    }
  }

  const trimmed = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 0 }).png().toBuffer({ resolveWithObject: true });
  await sharp(trimmed.data).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(path.join(OUT, `${name}.webp`));
  console.log(`${name.padEnd(18)} ${trimmed.info.width}x${trimmed.info.height}  bg=${bg}`);
  return { name, w: trimmed.info.width, h: trimmed.info.height };
}

/**
 * Splits the hero pose into body + raised arm on identical canvases, so the arm
 * can wave from the shoulder. The arm is everything right of the body's edge
 * between the fist and the shoulder; it overlaps the body by a few px at the
 * joint so no seam opens while it rotates.
 */
async function splitHeroArm() {
  const f = path.join(OUT, "hero.webp");
  const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const edge = (y) => {
    const pts = [[240, 474], [300, 484], [350, 492], [400, 502], [450, 512], [470, 516]];
    if (y <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (y <= pts[i][0]) {
      const [y0, x0] = pts[i - 1], [y1, x1] = pts[i];
      return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
    }
    return pts[pts.length - 1][1];
  };
  const body = Buffer.from(data);
  const arm = Buffer.alloc(data.length);
  const alphaAt = (x, y) => data[(y * W + x) * 4 + 3];
  for (let y = 230; y <= 472; y++) {
    // true body edge for this row: the first transparent gap right of the body
    let e = edge(y);
    for (let x = 455; x < Math.min(W - 1, edge(y) + 10); x++) {
      if (alphaAt(x, y) === 0) { e = x - 3; break; }
    }
    if (y > 425) e = Math.min(e, edge(y)); // joint rows: arm and body touch, use the estimate
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      if (x > (y > 425 ? e - 6 : e + 2)) data.copy(arm, o, o, o + 4); // arm (overlap only at the shoulder joint)
      if (x > e + 2) body[o + 3] = 0; // body without the arm
    }
  }
  await sharp(body, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(OUT, "hero-body.webp"));
  await sharp(arm, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(OUT, "hero-arm.webp"));
  console.log("hero split into body + arm (pivot ≈ 520,455)");
}

(async () => {
  const res = [];
  for (const p of POSES) res.push(await cut(...p));
  await splitHeroArm();
  console.log(JSON.stringify(Object.fromEntries(res.map((r) => [r.name, [r.w, r.h]]))));
})();
