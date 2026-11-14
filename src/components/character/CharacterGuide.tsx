"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { introProgress, storyProgress } from "@/lib/story";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";
import KarupattiCharacter, { type CharacterApi } from "./KarupattiCharacter";
import type { Act } from "./CharacterAnimations";

/**
 * THE GUIDE — one Karupatti puppet that walks through the whole film.
 *
 * Journey coordinate G: 0 → 1 = hero intro (introProgress), 1 → 2 = story.
 * Travel between scenes is scrubbed by GSAP ScrollTrigger progress and reverses
 * with it; the walk/run cycle is fed the real distance covered. Arriving at a
 * beat hands control to the central animation controller for a complete,
 * eased performance that ends in idle when the visitor stops scrolling.
 */

// [G, centre x (vw), bottom offset (svh), height (svh)]
type Stop = [number, number, number, number];
const STOPS_DESKTOP: Stop[] = [
  [0, 72, 3, 24], [0.12, 72, 3, 24], [0.8, 15, 3, 24], // hero → walks across as the leaves close in
  [1.0, 15, 3, 24], [1.05, 28, 3, 24], // 01 walks toward the palm leaves
  [1.1, 28, 3, 24], [1.145, 72, 2, 22], // → over to the seed
  [1.355, 70, 2, 22], [1.38, 84, 2, 22], // → beside the tree
  [1.45, 84, 2, 21], [1.565, 84, 2, 21], // karupatti
  [1.595, 12, 2, 20], [1.665, 12, 2, 20], // sweets
  [1.69, -12, 2, 20], [1.7, -12, 2, 22], [1.74, 9, 2, 22], // exits, re-enters toward the box
  [2, 9, 2, 22],
];
const STOPS_MOBILE: Stop[] = [
  [0, 78, 2, 15], [0.12, 78, 2, 15], [0.8, 20, 2, 15],
  [1.0, 20, 2, 15], [1.05, 30, 2, 15],
  [1.1, 30, 2, 15], [1.145, 76, 1, 14],
  [1.355, 74, 1, 14], [1.38, 82, 1, 14],
  [1.45, 80, 1, 14], [1.565, 80, 1, 14],
  [1.595, 80, 1, 13], [1.665, 80, 1, 13],
  [1.69, 120, 1, 13], [1.7, -20, 1, 14], [1.74, 16, 1, 14],
  [2, 16, 1, 14],
];

type Beat = { from: number; act: Act | "locomote"; facing?: "left" | "right"; say?: string; sayFrom?: number; sayTo?: number };
const BEATS: Beat[] = [
  { from: 0, act: "idle", say: "Hey there! Ready for a sweet little story?", sayTo: 0.1 },
  { from: 0.12, act: "locomote" },
  { from: 0.8, act: "leaves-look" }, // looks up as the leaves part
  { from: 1.0, act: "locomote" }, // walks toward the palm
  { from: 1.05, act: "leaves-point", say: "Ever wondered where our story begins?", sayFrom: 1.052, sayTo: 1.098 },
  { from: 1.1, act: "locomote" },
  { from: 1.145, act: "seed-discover", facing: "left", say: "Everything beautiful begins with something small.", sayFrom: 1.19, sayTo: 1.233 },
  { from: 1.235, act: "water", facing: "left" },
  { from: 1.262, act: "impatient" },
  { from: 1.29, act: "grow-celebrate", say: "Look! Something beautiful is growing.", sayFrom: 1.295, sayTo: 1.352 },
  { from: 1.355, act: "locomote" },
  { from: 1.38, act: "tree-wonder", facing: "left", say: "This is where our natural story takes root.", sayFrom: 1.39, sayTo: 1.43 },
  { from: 1.43, act: "idle" },
  { from: 1.45, act: "karupatti-intro", say: "This is the magic of Karupatti!", sayFrom: 1.462, sayTo: 1.556 },
  { from: 1.565, act: "locomote" },
  { from: 1.595, act: "sweets-dance", say: "Tradition makes everything sweeter!", sayFrom: 1.6, sayTo: 1.66 },
  { from: 1.665, act: "locomote" },
  { from: 1.74, act: "box-point", facing: "right", say: "And here's our little box of happiness!", sayFrom: 1.745, sayTo: 1.82 },
  { from: 1.85, act: "box-celebrate" }, // completes the story → celebration jump with sparkles
];
const HIDE_AFTER = 1.935;
const beatIndex = (G: number) => {
  let i = 0;
  BEATS.forEach((b, k) => { if (G >= b.from) i = k; });
  return i;
};

export default function CharacterGuide() {
  const root = useRef<HTMLDivElement>(null);
  const enter = useRef<HTMLDivElement>(null);
  const puppet = useRef<CharacterApi>(null);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const [say, setSay] = useState<string | null>(null);
  const [side, setSide] = useState<"left" | "right">("left");
  const entering = useRef(!reduced);
  const entranceTl = useRef<gsap.core.Timeline | null>(null);
  const currentBeat = useRef(-1);
  const maxG = useRef(0);
  const G = useRef(0);

  const finishEntrance = () => {
    if (!entering.current) return;
    entranceTl.current?.kill();
    entranceTl.current = null;
    if (enter.current) gsap.set(enter.current, { x: 0 });
    entering.current = false;
  };

  // ── scroll-synchronised travel + performances
  useEffect(() => {
    const el = root.current!;
    const stops = isMobile ? STOPS_MOBILE : STOPS_DESKTOP;
    gsap.set(el, { "--cx": stops[0][1], "--cy": stops[0][2], "--ch": stops[0][3] });
    const tl = gsap.timeline({ paused: true, defaults: { ease: "sine.inOut" } }); // eased: accelerate, decelerate
    for (let i = 1; i < stops.length; i++) {
      const [g, x, y, h] = stops[i];
      const prev = stops[i - 1][0];
      tl.to(el, { "--cx": x, "--cy": y, "--ch": h, duration: Math.max(0.0001, g - prev) }, prev);
    }
    tl.set({}, {}, 2);

    let lastCx = stops[0][1];
    let lastSide: "left" | "right" = "left";
    let lastLane = -1;
    /**
     * Publish the band the narrator occupies at the foot of the stage, so
     * scene copy (.copy-safe-b) can keep clear of the character and its
     * speech bubble instead of being overlapped by them.
     */
    const publishLane = (g: number) => {
      const stage = el.parentElement;
      if (!stage) return;
      const onStage = g > 0.74 && g <= HIDE_AFTER;
      const ch = Number(gsap.getProperty(el, "--ch")) || 0;
      const bubble = isMobile ? 76 : 92; // speech bubble + breathing room
      const lane = onStage ? Math.min(window.innerHeight * 0.44, (ch / 100) * window.innerHeight + bubble) : 0;
      if (Math.abs(lane - lastLane) < 2) return;
      lastLane = lane;
      stage.style.setProperty("--lane-b", `${Math.round(lane)}px`);
    };
    const update = () => {
      const s = storyProgress.get();
      const g = s > 0 ? 1 + s : introProgress.get();
      G.current = g;
      tl.progress(g / 2);
      if (entering.current && g > 0.015) finishEntrance();

      const cx = Number(gsap.getProperty(el, "--cx"));
      puppet.current?.travel(((cx - lastCx) * window.innerWidth) / 100);
      lastCx = cx;

      if (!entering.current) {
        const i = beatIndex(g);
        const b = BEATS[i];
        if (i !== currentBeat.current) {
          const cameBackToTop = i === 0 && maxG.current > 0.15;
          currentBeat.current = i;
          if (b.act === "locomote") puppet.current?.setLocomotion(true);
          else puppet.current?.play(cameBackToTop ? "top-wave" : b.act, { facing: b.facing });
        }
        const on = b.say && g >= (b.sayFrom ?? b.from) && g <= (b.sayTo ?? Infinity);
        setSay(on ? b.say! : null);
      }
      publishLane(g);
      maxG.current = g < 0.02 ? 0 : Math.max(maxG.current, g);
      const sd = cx > 50 ? "left" : "right";
      if (sd !== lastSide) { lastSide = sd; setSide(sd); }
      el.style.opacity = g > HIDE_AFTER ? "0" : "1";
    };
    const a = introProgress.subscribe(update);
    const b = storyProgress.subscribe(update);
    return () => { a(); b(); tl.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, reduced]);

  // ── hero: walks in from the left, stops near the logo, looks at the visitor,
  //    waves, smiles, points to the scroll indicator
  useEffect(() => {
    if (reduced) {
      entering.current = false;
      return;
    }
    const e = enter.current!;
    const startX = -window.innerWidth * (isMobile ? 0.95 : 0.85);
    const pos = { x: startX };
    let last = startX;
    gsap.set(e, { x: startX });
    const tl = gsap.timeline({ delay: 3.3 });
    entranceTl.current = tl;
    tl.call(() => puppet.current?.setLocomotion(true))
      .to(pos, {
        x: 0,
        duration: isMobile ? 3.2 : 3.6,
        ease: "power1.inOut", // accelerates, then slows to a stop
        onUpdate: () => {
          gsap.set(e, { x: pos.x });
          puppet.current?.travel(pos.x - last);
          last = pos.x;
        },
      })
      .call(() => puppet.current?.play("hero-greet", { facing: "left" }), undefined, "+=0.35")
      .call(() => setSay("Hey there! Ready for a sweet little story?"), undefined, "+=1.0")
      .call(() => { currentBeat.current = 0; entering.current = false; }, undefined, "+=0.1");
    return () => { tl.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // ── visitor hovers the hero CTA → he notices and hops
  useEffect(() => {
    const onCta = (ev: Event) => {
      const d = (ev as CustomEvent<{ x: number; y: number }>).detail;
      if (entering.current || G.current > 0.04) return;
      puppet.current?.play("cta-react", { target: d });
    };
    window.addEventListener("karupatti:cta", onCta);
    return () => window.removeEventListener("karupatti:cta", onCta);
  }, []);

  // dev-only handle for testing performances: window.__guide.play("dance")
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __guide?: unknown }).__guide = {
      play: (a: Act, o?: { facing?: "left" | "right" }) => puppet.current?.play(a, o),
      travel: (dx: number) => puppet.current?.travel(dx),
      walk: (on: boolean) => puppet.current?.setLocomotion(on),
      gsap, // lets tests drive the clock manually (gsap.ticker.tick())
    };
  }, []);

  return (
    <div
      ref={root}
      className="pointer-events-none absolute bottom-0 left-0 z-[59] transition-opacity duration-500"
      style={{
        height: "calc(var(--ch, 24) * 1svh)",
        transform: "translate(calc(var(--cx, 72) * 1vw - 50%), calc(var(--cy, 3) * -1svh))",
      }}
    >
      <div ref={enter} className="h-full">
        <KarupattiCharacter ref={puppet} bubble={say} bubbleSide={side} reduced={reduced} className="h-full" initialAct="idle" />
      </div>
    </div>
  );
}
