"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { SEQUENCE } from "@/lib/media";
import { storyProgress, within, lerp, SCENES } from "@/lib/story";
import { useIsMobile } from "@/hooks/useMediaQuery";

const M = SEQUENCE.marks;

/**
 * Piecewise map: story progress → source frame of the Palmyra film.
 * Each beat gets its own share of scroll so the seed can "rest" and the
 * growth can breathe, rather than playing the film linearly.
 */
const KEYS: [p: number, frame: number][] = [
  [0.0, 0],
  [0.105, M.leavesEnd],
  [0.15, M.seedStart],
  [0.235, M.growthStart],
  [0.355, M.growthEnd],
  [0.395, M.treeStart],
  [0.43, M.last],
];

function frameAt(p: number) {
  if (p <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 1; i < KEYS.length; i++) {
    const [p1, f1] = KEYS[i];
    const [p0, f0] = KEYS[i - 1];
    if (p <= p1) return lerp(f0, f1, (p - p0) / (p1 - p0));
  }
  return KEYS[KEYS.length - 1][1];
}

/** Coarse-to-fine load order so scrubbing works before every frame arrives. */
function loadOrder(n: number) {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const step of [24, 12, 6, 3, 1]) {
    for (let i = 0; i < n; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
  }
  if (!seen.has(n - 1)) order.push(n - 1);
  return order;
}

/**
 * Canvas that scrubs the image sequence (scenes 01–03), and acts as the
 * "camera": arch-window opening, tilt down to the soil, push-in on the seed,
 * and the final dive into the palm crown that hands over to Karupatti.
 */
export default function NatureSequence() {
  const wrap = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const cvs = canvas.current!;
    // transparent until the first frame lands, so the poster underneath shows
    const ctx = cvs.getContext("2d", { alpha: true })!;
    const set = isMobile ? SEQUENCE.mobile : SEQUENCE.desktop;
    const imgs: (HTMLImageElement | null)[] = new Array(set.count).fill(null);
    let alive = true;
    let drawn = -1; // key of the last composited frame pair
    let want = 0; // fractional frame index — blended between neighbours
    let raf = 0;

    // ---- loading (coarse → fine, limited concurrency)
    const queue = loadOrder(set.count);
    let inflight = 0;
    const pump = () => {
      while (alive && inflight < 6 && queue.length) {
        const i = queue.shift()!;
        const img = new Image();
        img.decoding = "async";
        img.src = `${set.path}${String(i + 1).padStart(3, "0")}${SEQUENCE.ext}`;
        inflight++;
        img.decode()
          .then(() => {
            if (!alive) return;
            imgs[i] = img;
            if (Math.abs(i - want) < 2 || drawn === -1) { drawn = -1; schedule(); }
          })
          .catch(() => {})
          .finally(() => { inflight--; pump(); });
      }
    };
    pump();

    // ---- drawing (object-fit: cover)
    let W = 0, H = 0;
    const resize = () => {
      const r = cvs.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75);
      W = Math.round(r.width * dpr);
      H = Math.round(r.height * dpr);
      cvs.width = W; cvs.height = H;
      // transform-origin for the dive into the palm crown (crown ≈ 28% from top of frame)
      const s = Math.max(r.width / 1280, r.height / 720);
      const oy = (r.height - 720 * s) / 2 + 0.29 * 720 * s;
      camera.current?.style.setProperty("--crown-y", `${(oy / r.height) * 100}%`);
      drawn = -1;
      schedule();
    };
    const nearestLoaded = (i: number) => {
      if (imgs[i]) return i;
      for (let d = 1; d < set.count; d++) {
        if (imgs[i - d]) return i - d;
        if (imgs[i + d]) return i + d;
      }
      return -1;
    };
    const paint = (img: HTMLImageElement, alpha: number) => {
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    };
    /**
     * Sub-frame blending: between two source frames we cross-dissolve, so slow
     * scrolling glides continuously instead of stepping frame by frame.
     */
    const draw = () => {
      raf = 0;
      const a = Math.floor(want), f = want - a;
      const base = nearestLoaded(a);
      if (base < 0) return;
      const next = a + 1 < set.count && imgs[a + 1] && base === a ? a + 1 : -1;
      const mix = next >= 0 ? Math.round(f * 24) / 24 : 0; // 24 blend steps is visually continuous
      const key = base * 100 + mix * 24;
      if (key === drawn) return;
      paint(imgs[base]!, 1);
      if (mix > 0) paint(imgs[next]!, mix);
      ctx.globalAlpha = 1;
      drawn = key;
    };
    function schedule() { if (!raf) raf = requestAnimationFrame(draw); }

    const ro = new ResizeObserver(resize);
    ro.observe(cvs);

    // ---- camera timeline over scenes 01–04 (0 → 0.5 of the story)
    // (the opening — passing through the hero's leaves — is driven by Hero's intro)
    const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
    const span = 0.5; // this timeline covers story progress 0 → 0.5
    const at = (p: number) => p / span;
    // starts at scale 1 so the hero's leaf silhouettes line up with frame 0,
    // then the camera drifts forward through the leaves
    tl.fromTo(camera.current, { scale: 1 }, { scale: 1.06, duration: at(0.09), ease: "sine.in" }, 0)
      // tilt down from the canopy to the soil
      .to(camera.current, { yPercent: -5, duration: at(0.03), ease: "power1.in" }, at(0.1))
      .to(camera.current, { yPercent: 0, duration: at(0.03), ease: "power1.out" }, at(0.13))
      // slow macro push on the seed, then pull back as the palm grows
      .to(camera.current, { scale: 1.09, duration: at(0.085), ease: "sine.inOut" }, at(0.15))
      .to(camera.current, { scale: 1, duration: at(0.07), ease: "sine.inOut" }, at(0.24))
      // dive into the crown → leaves dissolve into syrup
      .to(camera.current, { scale: 3.6, duration: at(0.07), ease: "power2.in" }, at(0.415))
      // (no full-screen CSS blur here — it was the most expensive frame of the film;
      // the syrup reveal on top carries the transition)
      .to(canvas.current, { filter: "brightness(1.08) saturate(1.3)", duration: at(0.035), ease: "power1.in" }, at(0.45))
      .set({}, {}, 1);

    const unsub = storyProgress.subscribe((p) => {
      want = Math.min(set.count - 1, frameAt(p) / set.step);
      schedule();
      tl.progress(Math.min(1, p / span));
      const el = wrap.current;
      if (el) el.style.visibility = p > SCENES.karupatti[0] + 0.12 ? "hidden" : "visible";
    });

    return () => {
      alive = false;
      unsub();
      ro.disconnect();
      cancelAnimationFrame(raf);
      tl.kill();
    };
  }, [isMobile]);

  return (
    <div ref={wrap} className="absolute inset-0 z-0 overflow-hidden bg-earth bg-[url(/assets/poster-leaves.jpg)] bg-cover bg-center">
      <div ref={camera} className="absolute inset-0 origin-[50%_var(--crown-y,40%)] will-change-transform">
        <canvas ref={canvas} className="block h-full w-full" aria-hidden="true" />
      </div>
      {/* cinematic grade: soft vignette */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(30,12,4,0.55)_100%)]" />
    </div>
  );
}
