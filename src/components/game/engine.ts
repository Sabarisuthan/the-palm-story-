"use client";

import { buildSprites, splitSprite, type Kind, type SpriteSet } from "./sprites";

/**
 * THE KARUPATTI SWEET SLICE CHALLENGE — canvas engine.
 *
 * Sweets are launched from below the frame and arc across it; the visitor cuts
 * them with the pointer or a finger. Sliced objects split along the blade line
 * and fall apart. Dried chillies must be left alone.
 *
 * The engine owns no DOM beyond its canvas and reports everything of interest
 * through `events`, so the React layer stays declarative.
 */

const SWEET_KINDS: Kind[] = ["laddu", "laddu", "karupatti", "cashew", "palmfruit"];
const COMBO_WINDOW = 450; // ms — slices this close together chain into a combo
const START_LIVES = 3;

type Obj = {
  kind: Kind;
  sprite: HTMLCanvasElement;
  x: number; y: number; vx: number; vy: number;
  rot: number; vrot: number;
  r: number;
  sliced: boolean;
  entered: boolean;
};

type Half = {
  sprite: HTMLCanvasElement;
  x: number; y: number; vx: number; vy: number;
  rot: number; vrot: number; r: number;
};

type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; color: string };
type Popup = { x: number; y: number; text: string; life: number; big: boolean };

export type EngineEvents = {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onSlice: (combo: number) => void;
  onCombo: (combo: number) => void;
  onPenalty: () => void;
  onOver: (score: number) => void;
};

export class SliceEngine {
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteSet | null = null;
  private objs: Obj[] = [];
  private halves: Half[] = [];
  private parts: Particle[] = [];
  private pops: Popup[] = [];
  private trail: { x: number; y: number; t: number }[] = [];
  private raf = 0;
  private last = 0;
  private spawnIn = 0;
  private elapsed = 0;
  private comboCount = 0;
  private comboAt = 0;
  private flash = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private prev: { x: number; y: number } | null = null;

  running = false;
  paused = false;
  score = 0;
  lives = START_LIVES;

  constructor(
    private canvas: HTMLCanvasElement,
    private events: EngineEvents,
    private reduced = false,
  ) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  async load() {
    this.sprites = await buildSprites(128);
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.max(1, Math.round(this.w * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.h * this.dpr));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // ── input ────────────────────────────────────────────────────────────────
  /** Feed a pointer sample. `down` means the blade is live (dragging/touching). */
  pointer(x: number, y: number, down: boolean) {
    if (down && this.prev) this.cut(this.prev.x, this.prev.y, x, y);
    if (down) this.trail.push({ x, y, t: performance.now() });
    this.prev = down ? { x, y } : null;
  }

  endPointer() {
    this.prev = null;
  }

  /** Test one blade segment against every live object. */
  private cut(x0: number, y0: number, x1: number, y1: number) {
    if (!this.running || this.paused) return;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy;
    if (len2 < 9) return; // ignore jitter — a slice needs a real swipe
    const angle = Math.atan2(dy, dx);
    for (const o of this.objs) {
      if (o.sliced) continue;
      let t = ((o.x - x0) * dx + (o.y - y0) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = x0 + dx * t - o.x;
      const py = y0 + dy * t - o.y;
      if (px * px + py * py > o.r * o.r) continue;
      this.sliceObject(o, angle);
    }
  }

  private sliceObject(o: Obj, angle: number) {
    o.sliced = true;
    const now = performance.now();

    if (o.kind === "chilli") {
      this.burst(o.x, o.y, this.reduced ? 6 : 16, ["#b4231d", "#e0503f", "#7a1a14"]);
      this.flash = 1;
      this.pops.push({ x: o.x, y: o.y, text: "Too spicy!", life: 1, big: false });
      this.events.onPenalty();
      this.loseLife();
      return;
    }

    this.comboCount = now - this.comboAt < COMBO_WINDOW ? this.comboCount + 1 : 1;
    this.comboAt = now;

    const base = 10;
    const bonus = this.comboCount > 1 ? (this.comboCount - 1) * 5 : 0;
    this.score += base + bonus;
    this.events.onScore(this.score);
    this.events.onSlice(this.comboCount);
    if (this.comboCount > 1) this.events.onCombo(this.comboCount);

    this.pops.push({
      x: o.x,
      y: o.y,
      text: this.comboCount > 1 ? this.comboCount + "x  +" + (base + bonus) : "+" + base,
      life: 1,
      big: this.comboCount > 1,
    });

    // two halves, thrown apart along the blade's normal
    const [a, b] = splitSprite(o.sprite, angle - o.rot);
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    const kick = 120 + Math.random() * 60;
    const mk = (sprite: HTMLCanvasElement, s: number): Half => ({
      sprite,
      x: o.x,
      y: o.y,
      vx: o.vx + nx * kick * s,
      vy: o.vy + ny * kick * s - 40,
      rot: o.rot,
      vrot: o.vrot + s * 2.4,
      r: o.r,
    });
    this.halves.push(mk(a, 1), mk(b, -1));
    this.burst(o.x, o.y, this.reduced ? 6 : 18, ["#e8c27a", "#b88942", "#7a3b12", "#fff0d0"]);
  }

  private burst(x: number, y: number, n: number, colors: string[]) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 260;
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        r: 1.5 + Math.random() * 3.5,
        life: 1,
        max: 0.5 + Math.random() * 0.6,
        color: colors[(Math.random() * colors.length) | 0],
      });
    }
  }

  private loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    this.events.onLives(this.lives);
    if (this.lives === 0) this.end();
  }

  // ── lifecycle ────────────────────────────────────────────────────────────
  start() {
    this.objs = [];
    this.halves = [];
    this.parts = [];
    this.pops = [];
    this.trail = [];
    this.score = 0;
    this.lives = START_LIVES;
    this.elapsed = 0;
    this.spawnIn = 0.4;
    this.comboCount = 0;
    this.flash = 0;
    this.running = true;
    this.paused = false;
    this.events.onScore(0);
    this.events.onLives(START_LIVES);
    this.last = performance.now();
    this.ensureLoop();
  }

  end() {
    if (!this.running) return;
    this.running = false;
    this.events.onOver(this.score);
  }

  setPaused(p: boolean) {
    this.paused = p;
    this.last = performance.now();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.running = false;
  }

  ensureLoop() {
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  // ── simulation ───────────────────────────────────────────────────────────
  private gravity() {
    return this.h * 1.45;
  }

  private spawn() {
    if (!this.sprites) return;
    const difficulty = Math.min(1, this.elapsed / 55);
    const count =
      1 + (Math.random() < 0.25 + difficulty * 0.4 ? 1 : 0) + (Math.random() < difficulty * 0.3 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const isChilli = Math.random() < 0.08 + difficulty * 0.14;
      const kind: Kind = isChilli ? "chilli" : SWEET_KINDS[(Math.random() * SWEET_KINDS.length) | 0];
      const bank = this.sprites[kind];
      if (!bank.length) continue;
      const sprite = bank[(Math.random() * bank.length) | 0];
      const size = this.h * (kind === "cashew" ? 0.1 : 0.125);
      const x = this.w * (0.12 + Math.random() * 0.76);
      const apex = this.h * (0.55 + Math.random() * 0.3);
      this.objs.push({
        kind,
        sprite,
        x,
        y: this.h + size,
        vx: (this.w / 2 - x) * (0.18 + Math.random() * 0.22),
        vy: -Math.sqrt(2 * this.gravity() * apex),
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 3,
        r: size * 0.46,
        sliced: false,
        entered: false,
      });
    }
    this.spawnIn = Math.max(0.42, 1.35 - difficulty * 0.75) * (0.8 + Math.random() * 0.4);
  }

  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused) this.step(dt);
    this.draw();
  };

  private step(dt: number) {
    const g = this.gravity();

    if (this.running) {
      this.elapsed += dt;
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) this.spawn();
      if (performance.now() - this.comboAt > COMBO_WINDOW) this.comboCount = 0;
    }

    for (let i = this.objs.length - 1; i >= 0; i--) {
      const o = this.objs[i];
      o.vy += g * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.rot += o.vrot * dt;
      if (o.y < this.h - o.r) o.entered = true;
      if (o.y - o.r > this.h + 40) {
        // a sweet allowed to fall costs a life; a chilli is meant to fall
        if (this.running && !o.sliced && o.entered && o.kind !== "chilli") {
          this.pops.push({ x: o.x, y: this.h - 30, text: "Missed", life: 1, big: false });
          this.loseLife();
        }
        this.objs.splice(i, 1);
      }
    }

    for (let i = this.halves.length - 1; i >= 0; i--) {
      const hf = this.halves[i];
      hf.vy += g * dt;
      hf.x += hf.vx * dt;
      hf.y += hf.vy * dt;
      hf.rot += hf.vrot * dt;
      if (hf.y - hf.r > this.h + 60) this.halves.splice(i, 1);
    }

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.vy += g * 0.55 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt / p.max;
      if (p.life <= 0) this.parts.splice(i, 1);
    }

    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i];
      p.y -= 38 * dt;
      p.life -= dt / 0.9;
      if (p.life <= 0) this.pops.splice(i, 1);
    }

    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.2);

    const cutoff = performance.now() - 180;
    while (this.trail.length && this.trail[0].t < cutoff) this.trail.shift();
  }

  // ── rendering ────────────────────────────────────────────────────────────
  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    for (const hf of this.halves) {
      ctx.save();
      ctx.translate(hf.x, hf.y);
      ctx.rotate(hf.rot);
      const s = hf.r * 2.17;
      ctx.drawImage(hf.sprite, -s / 2, -s / 2, s, s);
      ctx.restore();
    }

    for (const o of this.objs) {
      if (o.sliced) continue;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rot);
      if (o.kind === "chilli") {
        ctx.shadowColor = "rgba(190,40,30,0.55)";
        ctx.shadowBlur = 18;
      }
      const s = o.r * 2.17;
      ctx.drawImage(o.sprite, -s / 2, -s / 2, s, s);
      ctx.restore();
    }

    for (const p of this.parts) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.trail.length > 1) {
      ctx.lineCap = "round";
      for (let i = 1; i < this.trail.length; i++) {
        const a = this.trail[i - 1];
        const b = this.trail[i];
        const k = i / this.trail.length;
        ctx.strokeStyle = "rgba(255,232,180," + (0.1 + k * 0.75).toFixed(3) + ")";
        ctx.lineWidth = 1 + k * 7;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    ctx.textAlign = "center";
    for (const p of this.pops) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
      ctx.fillStyle = p.big ? "#e8c27a" : "rgba(247,243,234,0.95)";
      ctx.font = (p.big ? "600 26px " : "500 18px ") + "system-ui, sans-serif";
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;

    if (this.flash > 0) {
      ctx.fillStyle = "rgba(180,35,29," + (this.flash * 0.3).toFixed(3) + ")";
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }
}
