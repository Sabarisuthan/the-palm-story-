"use client";

/**
 * Tiny synthesised sound kit for the slice game.
 *
 * Everything is generated with the Web Audio API — no audio files to ship, and
 * nothing plays until the visitor starts the game (browsers require a gesture).
 */
export type Sfx = "slice" | "combo" | "penalty" | "miss" | "start" | "over";

export class SoundKit {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  /** Must be called from a user gesture (the Start button). */
  resume() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.3;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.3;
  }

  private tone(freq: number, dur: number, type: OscillatorType, at = 0, gain = 1, bend?: number) {
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (bend !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(40, bend), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Filtered noise burst — the blade passing through. */
  private swish(dur = 0.16, from = 2600, to = 500, gain = 0.5) {
    const ctx = this.ctx, master = this.master;
    if (!ctx || !master) return;
    const t0 = ctx.currentTime;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(master);
    src.start(t0);
  }

  play(s: Sfx, combo = 0) {
    if (this.muted || !this.ctx) return;
    switch (s) {
      case "slice":
        this.swish(0.14, 2800, 600, 0.45);
        this.tone(320 + Math.min(combo, 6) * 55, 0.1, "triangle", 0.01, 0.22);
        break;
      case "combo":
        [0, 1, 2].forEach((i) => this.tone(520 * Math.pow(1.26, i), 0.16, "triangle", i * 0.07, 0.3));
        break;
      case "penalty":
        this.tone(180, 0.32, "sawtooth", 0, 0.3, 60);
        this.swish(0.3, 700, 120, 0.3);
        break;
      case "miss":
        this.tone(220, 0.16, "sine", 0, 0.16, 150);
        break;
      case "start":
        [0, 1, 2, 3].forEach((i) => this.tone(392 * Math.pow(1.19, i), 0.17, "triangle", i * 0.075, 0.26));
        break;
      case "over":
        [0, 1, 2].forEach((i) => this.tone(440 / Math.pow(1.22, i), 0.3, "triangle", i * 0.13, 0.26));
        break;
    }
  }
}
