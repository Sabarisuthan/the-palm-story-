"use client";

import { ASSETS, SWEETS } from "@/lib/media";

/**
 * Sprite sheet for the slice game.
 *
 * The laddus are real: they are circular crops of the brand photograph
 * (public/assets/sweet-box.webp), taken at the coordinates already recorded in
 * src/lib/media.ts. Everything else is drawn here in the brand palette — they
 * are illustrations, not photographs of products we do not have.
 */

export type Kind = "laddu" | "karupatti" | "cashew" | "palmfruit" | "chilli";

export type SpriteSet = Record<Kind, HTMLCanvasElement[]>;

const PAL = {
  karupattiDark: "#3a1708",
  karupattiMid: "#7a3b12",
  karupattiWarm: "#b4692a",
  gold: "#b88942",
  goldLight: "#e8c27a",
  cashew: "#f0e0c2",
  cashewShade: "#cdb087",
  fruitDark: "#2b1b2e",
  fruitMid: "#5a3550",
  chilli: "#b4231d",
  chilliLight: "#e0503f",
  stem: "#5c6b34",
};

function blank(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return c;
}

/** Soft radial shading applied to a round object, for volume. */
function shade(ctx: CanvasRenderingContext2D, size: number) {
  const g = ctx.createRadialGradient(size * 0.36, size * 0.32, size * 0.04, size * 0.5, size * 0.5, size * 0.56);
  g.addColorStop(0, "rgba(255,240,210,0.34)");
  g.addColorStop(0.45, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(40,16,4,0.45)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

/** Real laddus, cut from the brand photograph. */
function laddusFrom(img: HTMLImageElement, size: number): HTMLCanvasElement[] {
  return SWEETS.map((s) => {
    const c = blank(size);
    const ctx = c.getContext("2d")!;
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.clip();
    const src = s.d * img.naturalWidth; // crop is square, in source pixels
    ctx.drawImage(img, s.x * img.naturalWidth - src / 2, s.y * img.naturalHeight - src / 2, src, src, 0, 0, size, size);
    // deepen the rim so it reads as a sphere against any background
    const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(45,18,5,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
    return c;
  });
}

/** A block of palm jaggery: rounded, dark, crystalline. */
function karupatti(size: number): HTMLCanvasElement {
  const c = blank(size);
  const ctx = c.getContext("2d")!;
  const m = size * 0.1, s = size - m * 2, r = size * 0.16;
  const g = ctx.createLinearGradient(m, m, m + s, m + s);
  g.addColorStop(0, PAL.karupattiWarm);
  g.addColorStop(0.5, PAL.karupattiMid);
  g.addColorStop(1, PAL.karupattiDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(m, m, s, s, r);
  ctx.fill();
  // sugar crystals
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, d = Math.random() * s * 0.42;
    ctx.fillStyle = `rgba(255,228,180,${0.12 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(size / 2 + Math.cos(a) * d, size / 2 + Math.sin(a) * d, size * (0.012 + Math.random() * 0.022), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,235,200,0.22)";
  ctx.beginPath();
  ctx.ellipse(size * 0.37, size * 0.32, s * 0.2, s * 0.11, -0.5, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function cashew(size: number): HTMLCanvasElement {
  const c = blank(size);
  const ctx = c.getContext("2d")!;
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-0.4);
  const r = size * 0.33;
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI * 0.15, Math.PI * 1.05);
  ctx.arc(r * 0.12, r * 0.1, r * 0.72, Math.PI * 1.05, Math.PI * 0.15, true);
  ctx.closePath();
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, "#fff6e6");
  g.addColorStop(0.5, PAL.cashew);
  g.addColorStop(1, PAL.cashewShade);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(120,90,50,0.3)";
  ctx.lineWidth = size * 0.01;
  ctx.stroke();
  return c;
}

/** Palmyra fruit (nungu) — dark skin, pale crown. */
function palmfruit(size: number): HTMLCanvasElement {
  const c = blank(size);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size * 0.38, size * 0.34, size * 0.05, size * 0.5, size * 0.5, size * 0.5);
  g.addColorStop(0, PAL.fruitMid);
  g.addColorStop(1, PAL.fruitDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(size / 2, size * 0.54, size * 0.42, size * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  // fibrous crown
  ctx.strokeStyle = PAL.stem;
  ctx.lineWidth = size * 0.035;
  ctx.lineCap = "round";
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(size / 2, size * 0.2);
    ctx.lineTo(size / 2 + i * size * 0.09, size * 0.06);
    ctx.stroke();
  }
  shade(ctx, size);
  return c;
}

/** The obstacle: a dried chilli. Unmistakably not a sweet. */
function chilli(size: number): HTMLCanvasElement {
  const c = blank(size);
  const ctx = c.getContext("2d")!;
  ctx.translate(size / 2, size / 2);
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.moveTo(-size * 0.06, -size * 0.3);
  ctx.quadraticCurveTo(size * 0.3, -size * 0.08, size * 0.1, size * 0.36);
  ctx.quadraticCurveTo(-size * 0.02, size * 0.2, -size * 0.2, size * 0.02);
  ctx.quadraticCurveTo(-size * 0.24, -size * 0.18, -size * 0.06, -size * 0.3);
  ctx.closePath();
  const g = ctx.createLinearGradient(-size * 0.2, -size * 0.3, size * 0.2, size * 0.3);
  g.addColorStop(0, PAL.chilliLight);
  g.addColorStop(1, PAL.chilli);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = "rgba(255,200,180,0.35)";
  ctx.beginPath();
  ctx.ellipse(-size * 0.02, -size * 0.1, size * 0.04, size * 0.16, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // stem
  ctx.strokeStyle = PAL.stem;
  ctx.lineWidth = size * 0.055;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-size * 0.06, -size * 0.3);
  ctx.quadraticCurveTo(-size * 0.16, -size * 0.4, -size * 0.26, -size * 0.36);
  ctx.stroke();
  return c;
}

export async function buildSprites(size = 128): Promise<SpriteSet> {
  const set: SpriteSet = {
    laddu: [],
    karupatti: [karupatti(size)],
    cashew: [cashew(size)],
    palmfruit: [palmfruit(size)],
    chilli: [chilli(size)],
  };
  try {
    const img = new Image();
    img.src = ASSETS.sweetBox.src;
    await img.decode();
    set.laddu = laddusFrom(img, size);
  } catch {
    set.laddu = [karupatti(size)]; // photograph unavailable — fall back to the drawn block
  }
  return set;
}

/**
 * Cuts a sprite in two along a line through its centre at `angle`.
 * Both halves keep the original canvas size, so they can be drawn with the
 * same transform as the whole object.
 */
export function splitSprite(sprite: HTMLCanvasElement, angle: number): [HTMLCanvasElement, HTMLCanvasElement] {
  const s = sprite.width;
  const half = (side: 1 | -1) => {
    const c = blank(s);
    const ctx = c.getContext("2d")!;
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.rect(-s, side > 0 ? 0 : -s, s * 2, s);
    ctx.clip();
    ctx.rotate(-angle);
    ctx.translate(-s / 2, -s / 2);
    ctx.drawImage(sprite, 0, 0);
    // bright cut face along the blade line
    ctx.translate(s / 2, s / 2);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(255,226,170,0.5)";
    ctx.fillRect(-s / 2, side > 0 ? 0 : -s * 0.035, s, s * 0.035);
    ctx.restore();
    return c;
  };
  return [half(1), half(-1)];
}
