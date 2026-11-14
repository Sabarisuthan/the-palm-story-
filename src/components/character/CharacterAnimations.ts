"use client";

import { gsap } from "@/lib/gsap";
import type { RigHandles, RigName } from "./CharacterRig";

/**
 * KARUPATTI — CENTRAL CHARACTER ANIMATION CONTROLLER
 *
 * The mascot is the original sheet artwork rigged in 2D (scripts/extract-rig.cjs):
 *   front rig — leaf, both arms, both legs, irises, skin-toned eyelids
 *   hero rig  — the large greeting pose: leaf, raised arm, irises, eyelids
 * The sheet's drawn expressions (surprised mouth, laughing closed eyes, thinking
 * hand-on-chin, excited, wink, happy) are face/pose keys, entered through a
 * squash "pop" with a blink so drawings never cut abruptly.
 *
 * One controller owns everything, so two incompatible clips never run at once:
 *   • locomotion (walk → run) is driven by real travel distance, with eased
 *     acceleration, deceleration and a settle when it stops
 *   • one action timeline at a time (wave, jump, dance, think, surprised,
 *     laugh, point, celebrate and the story performances built from them)
 *   • secondary layer always on: varied blinks, saccades, occasional cursor /
 *     navigation glances, leaf sway and breeze
 */

export type KeyPose = "surprised" | "thinking" | "excited" | "laughing" | "happy" | "wink";
export type Visual = RigName | KeyPose;

export const KEY_POSES: Record<KeyPose, { src: string; w: number; h: number; k: number; sink?: number }> = {
  surprised: { src: "/character/surprised.webp", w: 220, h: 223, k: 0.79, sink: 0.12 },
  thinking: { src: "/character/thinking.webp", w: 243, h: 224, k: 0.76 },
  excited: { src: "/character/excited.webp", w: 272, h: 220, k: 0.77 },
  laughing: { src: "/character/laughing.webp", w: 234, h: 223, k: 0.72 },
  happy: { src: "/character/happy.webp", w: 230, h: 218, k: 0.81, sink: 0.12 },
  wink: { src: "/character/wink.webp", w: 230, h: 224, k: 0.78, sink: 0.12 },
};
/** relative display height per rig, so the body block stays one size across drawings */
export const RIG_SCALE: Record<RigName, number> = { front: 1, hero: 0.99 };

/** Core states (as listed in the brief) … */
export type State = "idle" | "walk" | "run" | "jump" | "wave" | "dance" | "think" | "surprised" | "laugh" | "point" | "celebrate";
/** … and the story performances composed from them. */
export type Act =
  | State
  | "hero-greet"
  | "leaves-look"
  | "leaves-point"
  | "seed-discover"
  | "water"
  | "impatient"
  | "grow-celebrate"
  | "tree-wonder"
  | "karupatti-intro"
  | "sweets-dance"
  | "box-point"
  | "box-celebrate"
  | "farewell"
  | "cta-react"
  | "top-wave";

export type Handles = {
  travel: HTMLElement; // bob / jump height / dance steps
  squash: HTMLElement; // squash & stretch (origin: feet)
  lean: HTMLElement; // body rotation (origin: feet)
  shadow: HTMLElement;
  visuals: Record<Visual, HTMLElement>;
  rigs: Partial<Record<RigName, RigHandles>>;
  prop?: HTMLElement | null; // watering can in the left fist
  thought?: (on: boolean) => void; // thought bubble
  sparkle?: () => void; // golden particle burst
  onState?: (s: string) => void; // for debugging / tests
};

const E = {
  soft: "sine.inOut",
  out: "power2.out",
  in: "power2.in",
  snap: "back.out(1.7)",
  settle: "elastic.out(1, 0.45)",
};
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function createAnimator(h: Handles, opts: { reduced: boolean }) {
  const reduced = opts.reduced;
  let visual: Visual = "front";
  let act: Act = "idle";
  let actTl: gsap.core.Timeline | null = null;
  let loops: gsap.core.Animation[] = [];
  let lidRest = 0; // 0 = open, ~0.3 = happy squint
  let eyesLocked = false;
  let locomotion = false;
  let dead = false;
  const timers = new Set<number>();
  const later = (ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      if (!dead) fn();
    }, ms);
    timers.add(id);
  };
  const setState = (s: string) => h.onState?.(s);

  const rig = (n: RigName = visual as RigName) => h.rigs[n];
  const part = (p: string, n?: RigName) => rig(n)?.parts[p];
  const F = (p: string) => part(p, "front");
  const isRig = (v: Visual): v is RigName => v === "front" || v === "hero";
  const all = (...els: (HTMLElement | undefined)[]) => els.filter(Boolean) as HTMLElement[];

  // ── drawing swaps: a quick squash "pop" + blink hides the cut ──────────────
  // `visual` = drawing actually on screen; `plan` = drawing a timeline under
  // construction will end on. Keeping them apart means an action interrupted
  // mid-swap can never leave two drawings visible at once.
  let plan: Visual = visual;

  /** make exactly one drawing visible: whichever is most visible right now */
  function reconcile() {
    const entries = Object.entries(h.visuals) as [Visual, HTMLElement][];
    let best: Visual = visual, bestO = -1;
    entries.forEach(([k, el]) => {
      gsap.killTweensOf(el);
      const o = getComputedStyle(el).visibility === "hidden" ? 0 : Number(gsap.getProperty(el, "opacity"));
      if (o > bestO) { bestO = o; best = k; }
    });
    entries.forEach(([k, el]) => gsap.set(el, { autoAlpha: k === best ? 1 : 0 }));
    visual = best;
    plan = best;
  }

  function show(v: Visual, tl?: gsap.core.Timeline, at: number | string = 0) {
    if (v === plan) return;
    const from = h.visuals[plan], to = h.visuals[v];
    plan = v;
    if (reduced || !tl) {
      gsap.set(from, { autoAlpha: 0 });
      gsap.set(to, { autoAlpha: 1 });
      visual = v;
      return;
    }
    tl.to(h.squash, { scaleY: 0.95, scaleX: 1.04, duration: 0.08, ease: E.in }, at)
      .to(from, { autoAlpha: 0, duration: 0.1, ease: "none" }, ">-0.02")
      .to(to, { autoAlpha: 1, duration: 0.1, ease: "none" }, "<")
      .add(() => {
        visual = v;
        if (isRig(v)) blink();
      }, "<")
      .to(h.squash, { scaleY: 1, scaleX: 1, duration: 0.5, ease: E.settle }, "<0.04");
  }

  // ── eyes ─────────────────────────────────────────────────────────────────
  function lids(n: RigName | undefined, amount: number | number[], dur = 0.12, ease = E.out) {
    const r = n ? h.rigs[n] : isRig(visual) ? rig() : undefined;
    r?.lids.forEach((l, i) => gsap.to(l, { scaleY: Array.isArray(amount) ? amount[i] ?? amount[0] : amount, duration: dur, ease, overwrite: "auto" }));
  }
  function blink(double = false) {
    const r = isRig(visual) ? rig() : undefined;
    if (!r || reduced) return;
    const tl = gsap.timeline();
    tl.to(r.lids, { scaleY: 1, duration: 0.065, ease: E.in }).to(r.lids, { scaleY: lidRest, duration: 0.13, ease: E.out }, "+=0.035");
    if (double) tl.to(r.lids, { scaleY: 1, duration: 0.06, ease: E.in }, "+=0.06").to(r.lids, { scaleY: lidRest, duration: 0.14, ease: E.out }, "+=0.03");
  }
  /** look direction x, y in −1…1 */
  function look(x: number, y: number, dur = 0.16, n?: RigName) {
    const targets = n ? [h.rigs[n]] : (Object.values(h.rigs) as RigHandles[]);
    targets.forEach((r) =>
      r?.irises.forEach((iris, i) => {
        const rg = r.lookRange[i];
        gsap.to(iris, { xPercent: x * rg.x, yPercent: y * rg.y, duration: dur, ease: "power3.out", overwrite: "auto" });
      }),
    );
  }
  function lookAtPoint(px: number, py: number, dur = 0.18) {
    const b = h.travel.getBoundingClientRect();
    const dx = px - (b.left + b.width / 2), dy = py - (b.top + b.height * 0.4);
    const m = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, m / 240);
    look((dx / m) * k, (dy / m) * k, dur);
  }
  function irisScale(s: number, dur = 0.2) {
    (Object.values(h.rigs) as RigHandles[]).forEach((r) => r.irises.forEach((iris) => gsap.to(iris, { scale: s, duration: dur, ease: E.out, overwrite: "auto" })));
  }

  // secondary action: varied blinks, saccades, subtle & occasional cursor / nav glances
  function scheduleBlink() {
    later(rand(1900, 5600), () => {
      if (!eyesLocked) blink(Math.random() < 0.18);
      scheduleBlink();
    });
  }
  let pointer: { x: number; y: number; t: number } | null = null;
  const onPointer = (e: PointerEvent) => (pointer = { x: e.clientX, y: e.clientY, t: performance.now() });
  function scheduleSaccade() {
    later(rand(1400, 3800), () => {
      if (!eyesLocked && isRig(visual) && !locomotionActive()) {
        const recent = pointer && performance.now() - pointer.t < 2500;
        const r = Math.random();
        if (recent && r < 0.45) lookAtPoint(pointer!.x, pointer!.y); // follows the cursor — sometimes, not always
        else if (r < 0.62) look(rand(-0.3, 0.3), -1, 0.22); // glances up toward the navigation
        else if (r < 0.85) look(rand(-0.25, 0.25), rand(-0.15, 0.15)); // at the visitor
        else look(Math.random() < 0.5 ? -0.85 : 0.85, rand(-0.25, 0.1)); // looks around
      }
      scheduleSaccade();
    });
  }

  // ── idle: breathing, weight shift, leaf sway & breeze, hand drift ──────────
  function startIdle() {
    stopLoops();
    if (reduced) return;
    setState(`idle:${visual}`);
    loops.push(
      gsap.to(h.squash, { scaleY: 1.014, scaleX: 0.994, duration: 2.4, ease: E.soft, yoyo: true, repeat: -1 }),
      gsap.to(h.lean, { rotate: 1, x: 1.5, duration: 4.6, ease: E.soft, yoyo: true, repeat: -1 }),
    );
    const leaf = isRig(visual) ? part("leaf") : undefined;
    if (leaf) {
      loops.push(gsap.fromTo(leaf, { rotate: -2.5 }, { rotate: 3.2, duration: 2.9, ease: E.soft, yoyo: true, repeat: -1 }));
    }
    if (visual === "front") {
      loops.push(
        gsap.to(F("armL") ?? [], { rotate: 3, duration: 2.4, ease: E.soft, yoyo: true, repeat: -1, delay: 0.3 }),
        gsap.to(F("armR") ?? [], { rotate: -3, duration: 2.6, ease: E.soft, yoyo: true, repeat: -1, delay: 0.7 }),
      );
    }
    if (visual === "hero") loops.push(gsap.to(part("arm", "hero") ?? [], { rotate: -3, duration: 1.8, ease: E.soft, yoyo: true, repeat: -1 }));
    if (visual === "thinking" || !isRig(visual)) loops.push(gsap.to(h.travel, { y: -2, duration: 1.8, ease: E.soft, yoyo: true, repeat: -1 }));
  }
  function stopLoops() {
    loops.forEach((l) => l.kill());
    loops = [];
  }
  // the occasional breeze on the leaf (wind interaction)
  function scheduleGust() {
    later(rand(6000, 12000), () => {
      const leaf = isRig(visual) ? part("leaf") : undefined;
      if (leaf && !locomotionActive()) {
        gsap.timeline()
          .to(leaf, { rotate: "+=8", duration: 0.35, ease: E.out })
          .to(leaf, { rotate: "-=11", duration: 0.5, ease: E.soft })
          .to(leaf, { rotate: "+=3", duration: 0.6, ease: E.soft });
      }
      scheduleGust();
    });
  }

  /** ease every animated transform back to the neutral rest pose */
  function neutral(tl: gsap.core.Timeline, at = 0, dur = 0.28) {
    const targets: HTMLElement[] = [];
    (Object.values(h.rigs) as RigHandles[]).forEach((r) => Object.values(r.parts).forEach((p) => targets.push(p)));
    tl.to(targets, { rotate: 0, x: 0, y: 0, xPercent: 0, yPercent: 0, scaleY: 1, duration: dur, ease: E.out, overwrite: "auto" }, at)
      .to(h.lean, { rotate: 0, x: 0, y: 0, duration: dur, ease: E.out }, at)
      .to(h.travel, { x: 0, y: 0, duration: dur, ease: E.out }, at)
      .to(h.squash, { scaleX: 1, scaleY: 1, duration: dur, ease: E.out }, at)
      .add(() => irisScale(1), at);
  }

  // ── core clips ───────────────────────────────────────────────────────────
  /** JUMP: knees bend & body compresses → arms up & stretch → apex → soft squash landing → settle */
  function jump(tl: gsap.core.Timeline, at: number | string, height = 40, armsUp = true) {
    const aL = F("armL"), aR = F("armR"), leaf = F("leaf");
    const legs = all(F("legL"), F("legR"));
    tl.addLabel("j", at)
      .to(h.squash, { scaleY: 0.9, scaleX: 1.07, duration: 0.18, ease: E.in }, "j") // anticipation
      .to(legs, { scaleY: 0.86, duration: 0.18, ease: E.in }, "j") // knees bend
      .to(all(aL, aR), { rotate: (i: number) => (i === 0 ? -16 : 16), duration: 0.18, ease: E.in }, "j") // arms swing back
      .to(leaf ?? [], { rotate: 8, duration: 0.18, ease: E.in }, "j")
      .add(() => lids("front", 0.4, 0.1), "j")
      .to(h.squash, { scaleY: 1.08, scaleX: 0.95, duration: 0.16, ease: E.out }, "j+=0.18") // stretch
      .to(legs, { scaleY: 1.05, duration: 0.16, ease: E.out }, "j+=0.18")
      .to(h.travel, { y: -height, duration: 0.3, ease: "power2.out" }, "j+=0.18")
      .to(h.shadow, { scale: 0.6, opacity: 0.45, duration: 0.3, ease: E.out }, "j+=0.18")
      .to(all(aL, aR), { rotate: (i: number) => (armsUp ? (i === 0 ? 150 : -150) : i === 0 ? 40 : -40), duration: 0.24, ease: "back.out(1.4)" }, "j+=0.22") // arms up (overlapping)
      .to(leaf ?? [], { rotate: -10, duration: 0.24, ease: E.out }, "j+=0.24") // leaf drags behind the rise
      .add(() => { lids("front", lidRest, 0.12); irisScale(1.06); }, "j+=0.2")
      .to(h.squash, { scaleY: 1, scaleX: 1, duration: 0.14, ease: E.soft }, "j+=0.36") // apex
      .to(h.travel, { y: 0, duration: 0.24, ease: "power2.in" }, "j+=0.5")
      .to(h.shadow, { scale: 1, opacity: 1, duration: 0.24, ease: E.in }, "j+=0.5")
      .to(leaf ?? [], { rotate: 11, duration: 0.3, ease: E.soft }, "j+=0.46") // leaf lifts as he falls (delayed)
      .to(h.squash, { scaleY: 0.91, scaleX: 1.06, duration: 0.08, ease: E.out }, "j+=0.74") // soft squash landing
      .to(legs, { scaleY: 0.9, duration: 0.08, ease: E.out }, "j+=0.74")
      .to(h.squash, { scaleY: 1, scaleX: 1, duration: 0.55, ease: E.settle }, "j+=0.82") // returns to shape
      .to(legs, { scaleY: 1, duration: 0.4, ease: E.settle }, "j+=0.82")
      .to(leaf ?? [], { rotate: -5, duration: 0.25, ease: E.out }, "j+=0.76") // leaf bounces after landing
      .to(leaf ?? [], { rotate: 0, duration: 0.8, ease: E.settle }, "j+=1.0")
      .add(() => irisScale(1), "j+=0.8");
    if (armsUp) tl.to(all(aL, aR), { rotate: 0, duration: 0.55, ease: "back.out(1.2)" }, "j+=0.9");
    return tl;
  }

  /** WAVE: raises a hand, waves 2–3 times, eyes on the visitor, smiles, returns to idle */
  function wave(tl: gsap.core.Timeline, at: number | string, cycles = 3) {
    const aR = F("armR"), leaf = F("leaf");
    tl.addLabel("w", at)
      .add(() => { eyesLocked = true; look(0, 0, 0.2, "front"); }, "w")
      .to(aR ?? [], { rotate: 12, duration: 0.14, ease: E.in }, "w") // anticipation dip
      .to(aR ?? [], { rotate: -150, duration: 0.38, ease: E.snap }, "w+=0.14") // raise
      .to(h.lean, { rotate: -2, duration: 0.38, ease: E.soft }, "w+=0.14")
      .add(() => { lidRest = 0.3; lids("front", 0.3, 0.25); }, "w+=0.3"); // smile reaches the eyes
    for (let i = 0; i < cycles; i++) {
      tl.to(aR ?? [], { rotate: -168, duration: 0.2, ease: E.soft })
        .to(leaf ?? [], { rotate: -3, duration: 0.24, ease: E.soft }, "<0.05")
        .to(aR ?? [], { rotate: -138, duration: 0.2, ease: E.soft })
        .to(leaf ?? [], { rotate: 3, duration: 0.24, ease: E.soft }, "<0.05");
    }
    tl.to(aR ?? [], { rotate: 0, duration: 0.5, ease: "back.out(1.1)" })
      .to(h.lean, { rotate: 0, duration: 0.5, ease: E.out }, "<")
      .add(() => { eyesLocked = false; });
    return tl;
  }

  /** POINT: raises a hand toward a target; eyes follow the pointing hand. angle 70≈out, 130≈up-and-out */
  function point(tl: gsap.core.Timeline, at: number | string, side: "L" | "R", angle: number, hold = 1.6) {
    const arm = F(side === "L" ? "armL" : "armR"), leaf = F("leaf");
    const s = side === "L" ? 1 : -1;
    tl.addLabel("p", at)
      .to(arm ?? [], { rotate: -s * 12, duration: 0.16, ease: E.in }, "p") // wind-up
      .to(h.lean, { rotate: s * 1.5, duration: 0.16, ease: E.in }, "p")
      .to(arm ?? [], { rotate: s * angle, duration: 0.42, ease: E.snap }, "p+=0.16")
      .to(h.lean, { rotate: -s * 2.5, duration: 0.4, ease: E.out }, "p+=0.18") // leans into it
      .to(leaf ?? [], { rotate: s * 6, duration: 0.3, ease: E.out }, "p+=0.22") // follow-through
      .to(leaf ?? [], { rotate: 0, duration: 0.8, ease: E.settle }, "p+=0.52")
      .add(() => { eyesLocked = true; look(side === "L" ? -0.95 : 0.95, angle > 100 ? -0.8 : angle < 60 ? 0.5 : 0.05, 0.22, "front"); }, "p+=0.14")
      .to(arm ?? [], { rotate: s * (angle - 6), duration: 0.5, ease: E.soft, yoyo: true, repeat: Math.max(1, Math.round(hold / 0.5) - 1) }, "p+=0.6"); // emphasis
    return tl;
  }

  /** DANCE: alternating sway, rhythmic hands, little side steps, happy face, leaf on the beat */
  function dance(tl: gsap.core.Timeline, at: number | string, beats = 8) {
    const aL = F("armL"), aR = F("armR"), lL = F("legL"), lR = F("legR"), leaf = F("leaf");
    const B = 0.38;
    tl.addLabel("d", at).add(() => { lidRest = 0.35; lids("front", 0.35, 0.2); look(0, 0, 0.2, "front"); }, "d");
    for (let i = 0; i < beats; i++) {
      const s = i % 2 === 0 ? 1 : -1;
      const t = `d+=${i * B}`;
      tl.to(h.lean, { rotate: 6 * s, duration: B, ease: E.soft }, t)
        .to(h.travel, { x: 9 * s, duration: B, ease: E.soft }, t) // side step
        .to(h.squash, { scaleY: 0.95, scaleX: 1.03, duration: B * 0.3, ease: E.out }, t) // on the beat
        .to(h.squash, { scaleY: 1.02, scaleX: 0.99, duration: B * 0.7, ease: E.soft }, `${t}+=${B * 0.3}`)
        .to(aL ?? [], { rotate: s > 0 ? 135 : 25, duration: B, ease: E.soft }, t) // hands pump in turn
        .to(aR ?? [], { rotate: s > 0 ? -25 : -135, duration: B, ease: E.soft }, t)
        .to(s > 0 ? lR ?? [] : lL ?? [], { rotate: -10 * s, yPercent: -2, duration: B * 0.5, ease: E.out }, t) // stepping foot lifts
        .to(s > 0 ? lR ?? [] : lL ?? [], { rotate: 0, yPercent: 0, duration: B * 0.5, ease: E.in }, `${t}+=${B * 0.5}`)
        .to(leaf ?? [], { rotate: -7 * s, duration: B, ease: E.soft }, `${t}+=0.06`); // leaf lags the body
    }
    tl.to(all(aL, aR), { rotate: 0, duration: 0.45, ease: "back.out(1.2)" }, `d+=${beats * B}`)
      .to(h.lean, { rotate: 0, duration: 0.45, ease: E.out }, "<")
      .to(h.travel, { x: 0, duration: 0.45, ease: E.out }, "<")
      .to(leaf ?? [], { rotate: 0, duration: 0.8, ease: E.settle }, "<");
    return tl;
  }

  /** THINK: hand to chin (drawn pose), eyes up, head tilt, thought bubble */
  function think(tl: gsap.core.Timeline, at: number | string, hold = 2) {
    tl.addLabel("t", at)
      .add(() => { eyesLocked = true; look(0.3, -0.9, 0.3, "front"); }, "t") // eyes drift up first
      .to(h.lean, { rotate: 3, duration: 0.5, ease: E.soft }, "t");
    show("thinking", tl, "t+=0.35");
    tl.add(() => h.thought?.(true), "t+=0.6")
      .to(h.lean, { rotate: 5, duration: 1.2, ease: E.soft, yoyo: true, repeat: 1 }, "t+=0.6") // head tilts
      .add(() => h.thought?.(false), `t+=${0.6 + hold}`)
      .add(() => { eyesLocked = false; }, `t+=${0.6 + hold}`);
    return tl;
  }

  /** SURPRISED: eyes widen, hands rise, steps back, leaf bounces → surprised mouth */
  function surprised(tl: gsap.core.Timeline, at: number | string, back = 1) {
    const aL = F("armL"), aR = F("armR"), leaf = F("leaf");
    tl.addLabel("s", at)
      .add(() => { eyesLocked = true; lids("front", 0, 0.06); irisScale(1.12, 0.12); }, "s")
      .to(all(aL, aR), { rotate: (i: number) => (i === 0 ? 55 : -55), duration: 0.14, ease: E.out }, "s") // hands rise
      .to(h.travel, { y: -14, x: -12 * back, duration: 0.16, ease: E.out }, "s") // jolts backwards
      .to(h.lean, { rotate: -5 * back, duration: 0.16, ease: E.out }, "s")
      .to(leaf ?? [], { rotate: 14, duration: 0.12, ease: E.out }, "s") // quick leaf bounce
      .to(leaf ?? [], { rotate: -6, duration: 0.2, ease: E.soft }, "s+=0.12")
      .to(leaf ?? [], { rotate: 0, duration: 0.7, ease: E.settle }, "s+=0.32")
      .to(h.travel, { y: 0, duration: 0.22, ease: E.in }, "s+=0.16");
    show("surprised", tl, "s+=0.26"); // mouth: "O"
    tl.set(all(aL, aR), { rotate: 0 }, "s+=0.45") // (rig hidden behind the drawing) hands back down
      .to(h.travel, { x: 0, duration: 0.6, ease: E.soft }, "s+=0.9") // recovers: steps back into place
      .to(h.lean, { rotate: 0, duration: 0.7, ease: E.settle }, "s+=0.9")
      .add(() => { irisScale(1); eyesLocked = false; }, "s+=1.1");
    return tl;
  }

  /** LAUGH: eyes close, mouth opens (drawn), body shakes, hands move */
  function laugh(tl: gsap.core.Timeline, at: number | string, shakes = 10) {
    tl.addLabel("l", at);
    show("laughing", tl, "l");
    tl.to(h.lean, { rotate: 2.6, duration: 0.09, ease: E.soft, yoyo: true, repeat: shakes - 1 }, "l+=0.15")
      .to(h.travel, { y: -5, duration: 0.18, ease: E.soft, yoyo: true, repeat: Math.round(shakes / 2) - 1 }, "l+=0.15")
      .to(h.lean, { rotate: 0, duration: 0.3, ease: E.out });
    return tl;
  }

  /** CELEBRATE: excited bounce → big jump with arms up and golden sparkles */
  function celebrate(tl: gsap.core.Timeline, at: number | string) {
    tl.addLabel("c", at);
    show("excited", tl, "c");
    tl.to(h.travel, { y: -10, duration: 0.18, ease: E.out, yoyo: true, repeat: 1 }, "c+=0.1");
    show("front", tl, "c+=0.6");
    tl.add(() => { lidRest = 0.3; }, "c+=0.6").add(() => h.sparkle?.(), "c+=0.95");
    jump(tl, "c+=0.7", 44);
    return tl;
  }

  // ── controller: one action at a time ─────────────────────────────────────
  function play(next: Act, o: { facing?: "left" | "right"; target?: { x: number; y: number } } = {}) {
    if (dead) return;
    act = next;
    locomotion = false; // an action always takes over from locomotion
    wasMoving = false;
    actTl?.kill();
    reconcile(); // an interrupted swap is resolved to a single visible drawing
    stopLoops();
    eyesLocked = false;
    lidRest = 0;
    h.thought?.(false);
    setState(next);
    const tl = gsap.timeline({ onComplete: () => { if (act === next) startIdle(); } });
    actTl = tl;
    if (h.prop && next !== "water") gsap.to(h.prop, { autoAlpha: 0, duration: 0.15 });
    neutral(tl, 0, 0.25);
    lids(undefined, 0, 0.15);
    const side = o.facing === "right" ? "R" : "L";
    const back = o.facing === "right" ? -1 : 1;

    switch (next) {
      case "idle":
      case "walk":
      case "run":
        show("front", tl);
        break;
      case "jump": show("front", tl); jump(tl, 0.1); break;
      case "wave": show("front", tl); wave(tl, 0.1); break;
      case "dance": show("front", tl); dance(tl, 0.1); break;
      case "think": show("front", tl); think(tl, 0.1); break;
      case "surprised": show("front", tl); surprised(tl, 0.1, back); show("front", tl, ">+0.6"); break;
      case "laugh": laugh(tl, 0.1); break;
      case "point": show("front", tl); point(tl, 0.1, side, 80); break;
      case "celebrate": celebrate(tl, 0.1); break;

      // ── story performances ──
      case "hero-greet": // stops, looks at the visitor, waves, smiles, points to the scroll cue
        show("front", tl);
        tl.add(() => { eyesLocked = true; look(0, 0, 0.2, "front"); }, 0.15)
          .to(h.lean, { rotate: -2, duration: 0.35, ease: E.soft }, 0.2)
          .add(() => blink(), 0.55);
        wave(tl, 0.8, 3);
        point(tl, ">+0.25", side, 64, 2);
        tl.add(() => { eyesLocked = false; }, ">");
        break;

      case "leaves-look": // looks upward at the palm leaves
        show("front", tl);
        tl.add(() => { eyesLocked = true; look(0.2, -1, 0.35, "front"); }, 0.1)
          .to(h.lean, { rotate: 3, duration: 0.7, ease: E.soft }, 0.1)
          .to(F("leaf") ?? [], { rotate: -6, duration: 0.8, ease: E.soft }, 0.2)
          .add(() => blink(), 1.4)
          .add(() => { eyesLocked = false; }, 2.4);
        break;

      case "leaves-point": // points at the leaves, then a surprised reaction
        show("front", tl);
        point(tl, 0.1, "R", 132, 1.4);
        surprised(tl, ">+0.1", 1);
        show("front", tl, ">+0.7");
        break;

      case "seed-discover": // discovers, bends down, examines, looks at the visitor, curious
        show("front", tl);
        surprised(tl, 0.05, -back);
        show("front", tl, 1.2);
        tl.add(() => { eyesLocked = true; look(side === "L" ? -0.7 : 0.7, 0.9, 0.25, "front"); }, 1.3)
          .to(h.squash, { scaleY: 0.92, scaleX: 1.05, duration: 0.45, ease: E.soft }, 1.35) // bends down
          .to(all(F("legL"), F("legR")), { scaleY: 0.88, duration: 0.45, ease: E.soft }, 1.35)
          .to(h.lean, { rotate: side === "L" ? -10 : 10, y: 4, duration: 0.55, ease: E.soft }, 1.35)
          .to(F("leaf") ?? [], { rotate: side === "L" ? -9 : 9, duration: 0.6, ease: E.soft }, 1.42)
          .add(() => look(side === "L" ? -0.35 : 0.35, 1, 0.5, "front"), 2.1) // examines
          .add(() => look(side === "L" ? -0.8 : 0.8, 0.85, 0.5, "front"), 2.7)
          .to(h.squash, { scaleY: 1, scaleX: 1, duration: 0.5, ease: E.out }, 3.3)
          .to(all(F("legL"), F("legR")), { scaleY: 1, duration: 0.5, ease: E.out }, 3.3)
          .to(h.lean, { rotate: 0, y: 0, duration: 0.5, ease: E.out }, 3.3)
          .add(() => look(0, 0, 0.22, "front"), 3.45) // looks at the visitor
          .add(() => blink(), 3.8);
        think(tl, 4.2, 2.2); // curious
        break;

      case "water": { // waters the seed
        show("front", tl);
        const aL = F("armL");
        tl.add(() => { if (h.prop) gsap.to(h.prop, { autoAlpha: 1, duration: 0.2 }); }, 0.1)
          .to(aL ?? [], { rotate: 62, duration: 0.5, ease: E.snap }, 0.1)
          .to(h.lean, { rotate: -4, duration: 0.5, ease: E.soft }, 0.15)
          .add(() => { eyesLocked = true; look(-0.8, 0.8, 0.3, "front"); lidRest = 0.18; lids("front", 0.18); }, 0.2)
          .to(aL ?? [], { rotate: 72, duration: 0.65, ease: E.soft, yoyo: true, repeat: 5 }, 0.6) // pouring rhythm
          .to(F("leaf") ?? [], { rotate: -4, duration: 0.65, ease: E.soft, yoyo: true, repeat: 5 }, 0.7);
        break;
      }

      case "impatient": { // waits impatiently: foot taps, glances at the plant, sighs
        show("front", tl);
        const lR = F("legR");
        tl.add(() => { eyesLocked = true; look(-0.6, 0.7, 0.3, "front"); }, 0.1);
        for (let i = 0; i < 6; i++) {
          tl.to(lR ?? [], { rotate: -9, yPercent: -1.6, duration: 0.13, ease: E.out }, 0.3 + i * 0.32)
            .to(lR ?? [], { rotate: 0, yPercent: 0, duration: 0.11, ease: E.in }, 0.43 + i * 0.32);
        }
        tl.add(() => look(0, 0, 0.2, "front"), 1.2).add(() => blink(), 1.4)
          .add(() => look(-0.6, 0.7, 0.3, "front"), 1.9)
          .to(h.squash, { scaleY: 0.96, scaleX: 1.02, duration: 0.5, ease: E.soft, yoyo: true, repeat: 1 }, 2.3) // sigh
          .add(() => { eyesLocked = false; }, 3.4);
        break;
      }

      case "grow-celebrate": // looks at the growing plant, then an excited jump
        show("front", tl);
        tl.add(() => { eyesLocked = true; look(-0.5, -0.6, 0.3, "front"); irisScale(1.08); }, 0.1)
          .to(h.lean, { rotate: 3, duration: 0.5, ease: E.soft }, 0.1);
        celebrate(tl, 0.8);
        jump(tl, ">+0.05", 30);
        tl.add(() => { eyesLocked = false; }, ">");
        break;

      case "tree-wonder": // looks up, tilts head, surprised, points at the tree
        show("front", tl);
        tl.add(() => { eyesLocked = true; look(side === "L" ? -0.4 : 0.4, -1, 0.35, "front"); }, 0.1)
          .to(h.lean, { rotate: side === "L" ? 4 : -4, duration: 0.7, ease: E.soft }, 0.15)
          .to(F("leaf") ?? [], { rotate: side === "L" ? 7 : -7, duration: 0.8, ease: E.soft }, 0.25);
        surprised(tl, 1.0, -back);
        show("front", tl, 2.0);
        point(tl, 2.15, side, 132, 1.6);
        break;

      case "karupatti-intro": { // introduces the ingredient, points to the syrup, expressive gestures
        show("front", tl);
        const aR = F("armR"), aL = F("armL");
        tl.add(() => { lidRest = 0.22; lids("front", 0.22); look(0, 0, 0.2, "front"); }, 0.1)
          .to(aR ?? [], { rotate: -70, duration: 0.45, ease: E.snap }, 0.2) // presents
          .to(aL ?? [], { rotate: 22, duration: 0.45, ease: E.snap }, 0.28)
          .to(aR ?? [], { rotate: -56, duration: 0.22, ease: E.soft, yoyo: true, repeat: 3 }, 0.75)
          .to(h.travel, { y: -6, duration: 0.22, ease: E.soft, yoyo: true, repeat: 3 }, 0.75)
          .to(all(aR, aL), { rotate: 0, duration: 0.4, ease: E.out }, 1.75);
        point(tl, 2.1, "L", 84, 1.4); // points to the syrup
        tl.to(F("armL") ?? [], { rotate: 0, duration: 0.4, ease: E.out }, ">")
          .to(aR ?? [], { rotate: -110, duration: 0.35, ease: E.snap }, ">") // expressive: both hands open up
          .to(aL ?? [], { rotate: 110, duration: 0.35, ease: E.snap }, "<0.06")
          .to(all(aR, aL), { rotate: (i: number) => (i === 0 ? -95 : 95), duration: 0.25, ease: E.soft, yoyo: true, repeat: 3 }, ">")
          .to(all(aR, aL), { rotate: 0, duration: 0.5, ease: "back.out(1.2)" }, ">");
        show("hero", tl, ">+0.1"); // proud stance
        tl.add(() => { lidRest = 0.25; lids("hero", 0.25, 0.2); look(0, 0, 0.2, "hero"); }, "<");
        break;
      }

      case "sweets-dance": // excited by the sweets → happy dance → laughs
        celebrate(tl, 0.05);
        show("front", tl, ">+0.1");
        dance(tl, ">", 8);
        laugh(tl, ">+0.05", 8);
        break;

      case "box-point": // points at the product, turns to the visitor, points again
        show("front", tl);
        point(tl, 0.15, side, 112, 1.2);
        tl.add(() => look(0, 0, 0.22, "front"), ">+0.1").add(() => blink(), ">+0.25") // turns to the visitor
          .to(h.lean, { rotate: 0, duration: 0.3, ease: E.out }, "<")
          .add(() => look(side === "L" ? -0.9 : 0.9, -0.5, 0.25, "front"), ">+0.7");
        break;

      case "box-celebrate":
        celebrate(tl, 0.05);
        break;

      case "farewell": // waves goodbye, smiles, returns to idle
        show("front", tl);
        wave(tl, 0.15, 3);
        tl.add(() => { lidRest = 0.28; lids("front", 0.28, 0.25); }, ">-0.2");
        break;

      case "cta-react": // the visitor hovers the CTA: a little surprised hop, eyes on the button
        show("front", tl);
        tl.add(() => { if (o.target) lookAtPoint(o.target.x, o.target.y, 0.12); irisScale(1.08, 0.12); eyesLocked = true; }, 0)
          .to(h.squash, { scaleY: 0.94, scaleX: 1.04, duration: 0.1, ease: E.in }, 0.02)
          .to(h.travel, { y: -16, duration: 0.18, ease: E.out }, 0.12)
          .to(h.squash, { scaleY: 1.04, scaleX: 0.97, duration: 0.14, ease: E.out }, 0.12)
          .to(F("leaf") ?? [], { rotate: 10, duration: 0.14, ease: E.out }, 0.14)
          .to(h.travel, { y: 0, duration: 0.18, ease: E.in }, 0.3)
          .to(h.squash, { scaleY: 1, scaleX: 1, duration: 0.45, ease: E.settle }, 0.46)
          .to(F("leaf") ?? [], { rotate: 0, duration: 0.7, ease: E.settle }, 0.4)
          .add(() => { lidRest = 0.25; lids("front", 0.25, 0.2); irisScale(1); }, 0.6)
          .add(() => { eyesLocked = false; }, 1.6);
        break;

      case "top-wave": // the visitor came back to the top
        show("front", tl);
        wave(tl, 0.1, 2);
        break;
    }
    if (reduced) tl.progress(1);
  }

  // ── locomotion: walk → run, driven by real travel; eased start, natural stop ──
  let phase = 0, input = 0, speed = 0, amp = 0, dir = 1, wasMoving = false, stillFor = 0;
  function locomotionActive() {
    return locomotion && amp > 0.05;
  }
  function setLocomotion(on: boolean) {
    if (on === locomotion) return;
    locomotion = on;
    if (on) {
      actTl?.kill();
      reconcile();
      stopLoops();
      act = "walk";
      h.thought?.(false);
      const tl = gsap.timeline();
      neutral(tl, 0, 0.2);
      show("front", tl);
      setState("walk");
    }
  }
  function travel(dx: number) {
    input += dx;
    if (Math.abs(dx) > 0.5) dir = dx > 0 ? 1 : -1;
  }
  const tick = (_t: number, dtMs: number) => {
    const dt = Math.min(0.05, dtMs / 1000);
    const stepPx = (h.travel.getBoundingClientRect().height || 200) * 0.34;
    const moved = Math.abs(input);
    input = 0;
    phase += (moved / stepPx) * Math.PI;
    const target = dt > 0 ? moved / dt : 0;
    speed += (target - speed) * Math.min(1, dt * (target > speed ? 9 : 4)); // ease in / ease out
    if (!locomotion || visual !== "front") return;
    amp += (Math.min(1, speed / 200) - amp) * Math.min(1, dt * 7);
    const run = Math.min(1, Math.max(0, (speed - 650) / 550));
    const moving = amp > 0.08;
    if (moving) {
      if (!wasMoving) { stopLoops(); setState(run > 0.5 ? "run" : "walk"); }
      stillFor = 0;
      const s = Math.sin(phase), c = Math.cos(phase);
      const A = (20 + 14 * run) * amp; // stride
      const B = (13 + 20 * run) * amp; // arm swing — opposite to the legs
      gsap.set(F("legL") ?? [], { rotate: A * s, yPercent: -Math.max(0, c) * (1.6 + run) * amp }); // foot lifts off…
      gsap.set(F("legR") ?? [], { rotate: -A * s, yPercent: -Math.max(0, -c) * (1.6 + run) * amp }); // …and plants
      gsap.set(F("armL") ?? [], { rotate: -B * s });
      gsap.set(F("armR") ?? [], { rotate: -B * s });
      gsap.set(h.travel, { y: -(1 - Math.abs(s)) * (4 + 6 * run) * amp }); // bounce: low on contact, high on passing
      gsap.set(h.lean, { rotate: dir * (3 + 7 * run) * amp + 1.5 * Math.sin(phase * 2) * amp }); // forward lean + rock
      gsap.set(h.squash, { scaleY: 1 - 0.025 * Math.abs(s) * amp, scaleX: 1 + 0.014 * Math.abs(s) * amp });
      gsap.set(F("leaf") ?? [], { rotate: -dir * (3 + 6 * run) * amp + 6 * Math.sin(phase * 2 - 1.1) * amp }); // leaf bounces, lagging
      wasMoving = true;
    } else if (wasMoving) {
      // natural stop: limbs settle back, a small squash as weight lands, leaf overshoots
      wasMoving = false;
      const tl = gsap.timeline();
      tl.to(all(F("legL"), F("legR"), F("armL"), F("armR")), { rotate: 0, yPercent: 0, duration: 0.35, ease: E.out })
        .to(h.lean, { rotate: -dir * 2, duration: 0.18, ease: E.out }, 0)
        .to(h.lean, { rotate: 0, duration: 0.5, ease: E.settle }, 0.18)
        .to(h.travel, { y: 0, duration: 0.2, ease: E.out }, 0)
        .to(h.squash, { scaleY: 0.95, scaleX: 1.03, duration: 0.12, ease: E.out }, 0.05)
        .to(h.squash, { scaleY: 1, scaleX: 1, duration: 0.5, ease: E.settle }, 0.17)
        .to(F("leaf") ?? [], { rotate: dir * 9, duration: 0.2, ease: E.out }, 0.05)
        .to(F("leaf") ?? [], { rotate: 0, duration: 0.9, ease: E.settle }, 0.25);
    } else {
      stillFor += dt;
      if (stillFor > 0.7 && loops.length === 0) startIdle(); // stopped scrolling mid-walk → breathing idle
    }
  };
  if (!reduced) gsap.ticker.add(tick);

  // boot
  Object.entries(h.visuals).forEach(([k, el]) => gsap.set(el, { autoAlpha: k === visual ? 1 : 0 }));
  if (!reduced) {
    scheduleBlink();
    scheduleSaccade();
    scheduleGust();
    window.addEventListener("pointermove", onPointer, { passive: true });
  }
  startIdle();

  return {
    play,
    travel,
    setLocomotion,
    blink,
    look,
    lookAtPoint,
    get act() {
      return act;
    },
    destroy() {
      dead = true;
      actTl?.kill();
      stopLoops();
      timers.forEach((t) => window.clearTimeout(t));
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onPointer);
    },
  };
}

export type Animator = ReturnType<typeof createAnimator>;
