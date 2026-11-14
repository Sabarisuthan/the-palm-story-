"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import { introProgress, storyScrollY } from "@/lib/story";
import { useScrollTo } from "@/hooks/useSmoothScroll";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";
import GoldParticles from "./GoldParticles";
import LogoReveal from "./LogoReveal";

const silk = [0.22, 1, 0.36, 1] as const;

/**
 * Leaf masks are cut from frame 0 of the Palmyra film, so their "home"
 * position is exactly where those leaves sit in the footage (cover-fit).
 * At rest they hang oversized at the edges as botanical shadows; during the
 * intro they glide home, darken, and match-cut into the real leaves.
 */
const FRAME = { w: 1280, h: 720 };
const LEAVES = {
  left: { src: "/assets/leaf-left.png", fx: 0, fw: 780, origin: "11.5% 55.5%" },
  right: { src: "/assets/leaf-right.png", fx: 520, fw: 760, origin: "88% 53%" },
} as const;

function Leaf({ side }: { side: keyof typeof LEAVES }) {
  const l = LEAVES[side];
  const mask: React.CSSProperties = {
    WebkitMaskImage: `url(${l.src})`,
    maskImage: `url(${l.src})`,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
  };
  return (
    <div data-leaf={side} className="absolute will-change-transform" style={{ transformOrigin: l.origin }}>
      <div data-par className="absolute inset-0">
        <div className={`absolute inset-0 ${side === "left" ? "animate-[leafsway_14s_ease-in-out_infinite]" : "animate-[leafsway_17s_ease-in-out_-6s_infinite]"}`} style={{ transformOrigin: l.origin }}>
          {/* cast shadow on the paper */}
          <div data-shadow className="absolute inset-0 translate-x-[3%] translate-y-[4%] bg-earth opacity-[0.075] blur-[12px]" style={mask} />
          {/* the leaf itself: muted palm green with natural light falloff */}
          <div data-solid className="absolute inset-0 opacity-[0.13] [background:radial-gradient(120%_90%_at_var(--lx)_55%,#8c9764_0%,#68734b_45%,#3f4a2a_100%)]" style={{ ...mask, ["--lx" as string]: side === "left" ? "10%" : "90%" }} />
          {/* darkens into a true silhouette for the match cut */}
          <div data-dark className="absolute inset-0 bg-[#1d2614] opacity-0" style={mask} />
        </div>
      </div>
    </div>
  );
}

/** Tiny line-drawn seed with a sprout — the story's first beat, as a glyph. */
function SeedGlyph() {
  return (
    <svg viewBox="0 0 24 32" className="h-7 w-auto" fill="none" stroke="currentColor" strokeWidth="0.9" aria-hidden="true">
      <path d="M12 30c-4.2 0-6.5-2.6-6.5-5.4 0-3.2 2.8-5.6 6.5-5.6s6.5 2.4 6.5 5.6c0 2.8-2.3 5.4-6.5 5.4Z" />
      <g className="origin-[12px_19px] animate-[sprout_4.5s_ease-in-out_infinite]">
        <path d="M12 19.2c0-4.6.4-8.4 3.2-12" />
        <path d="M15.2 7.2c2.2-.6 4-2.2 4.6-4.6-2.4.2-4.2 1.8-4.6 4.6Z" />
        <path d="M13.4 11.6c-1.9-.9-3.6-.6-5 .6 1.7 1 3.4 1 5-.6Z" />
      </g>
    </svg>
  );
}

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const wind = useRef(0);
  const scrollTo = useScrollTo();
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const k = reduced ? 0 : 1;

  // ---- place leaves at their exact footage position (cover-fit of frame 0)
  useEffect(() => {
    const el = root.current!;
    const place = () => {
      const W = el.clientWidth, H = el.clientHeight;
      const s = Math.max(W / FRAME.w, H / FRAME.h);
      const ox = (W - FRAME.w * s) / 2, oy = (H - FRAME.h * s) / 2;
      (Object.keys(LEAVES) as (keyof typeof LEAVES)[]).forEach((side) => {
        const n = el.querySelector<HTMLElement>(`[data-leaf='${side}']`);
        if (!n) return;
        n.style.left = `${ox + LEAVES[side].fx * s}px`;
        n.style.top = `${oy}px`;
        n.style.width = `${LEAVES[side].fw * s}px`;
        n.style.height = `${FRAME.h * s}px`;
      });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- intro: hero → nature, scrubbed by scroll (reverses naturally)
  useEffect(() => {
    const el = root.current!;
    const q = (s: string) => el.querySelectorAll(s);
    const out = isMobile ? 36 : 40;
    let unsub = () => {};
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      tl.fromTo("[data-leaf='left']", { xPercent: -out, yPercent: 6, scale: 1.32, rotate: -10 }, { xPercent: 0, yPercent: 0, scale: 1, rotate: 0, duration: 0.66, ease: "power2.inOut" }, 0.04)
        .fromTo("[data-leaf='right']", { xPercent: out, yPercent: -4, scale: 1.36, rotate: 9 }, { xPercent: 0, yPercent: 0, scale: 1, rotate: 0, duration: 0.66, ease: "power2.inOut" }, 0.04)
        .fromTo(el, { "--sway": 1 }, { "--sway": 0, duration: 0.4 }, 0)
        // the page content lifts away first
        .to("[data-content]", { yPercent: -10, opacity: 0, filter: "blur(6px)", duration: 0.22, ease: "power2.in" }, 0)
        .to("[data-deco]", { opacity: 0, duration: 0.14 }, 0)
        // shadows become leaves; leaves become silhouettes
        .to(q("[data-shadow]"), { opacity: 0, duration: 0.3 }, 0.12)
        .to(q("[data-solid]"), { opacity: 1, duration: 0.36 }, 0.14)
        .to(q("[data-dark]"), { opacity: 0.92, duration: 0.34 }, 0.3)
        // light breaks through the gap between the leaves; ivory dissolves into the film
        .fromTo("[data-flare]", { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.5, duration: 0.25, ease: "power2.out" }, 0.36)
        .to("[data-flare]", { opacity: 0, scale: 2.2, duration: 0.25, ease: "power1.in" }, 0.62)
        .to("[data-paper]", { opacity: 0, duration: 0.32, ease: "power1.inOut" }, 0.48)
        // the silhouettes hand over to the real, sunlit leaves of the footage
        .to(q("[data-solid], [data-dark]"), { opacity: 0, duration: 0.2 }, 0.78)
        .set(el, { autoAlpha: 0 }, 0.999)
        .set({}, {}, 1);

      unsub = introProgress.subscribe((i) => {
        tl.progress(i);
        const w = Math.min(1, Math.max(0, (i - 0.2) / 0.7));
        wind.current = Math.sin(w * Math.PI) * 0.9;
      });
    }, el);
    return () => {
      unsub();
      ctx.revert();
    };
  }, [isMobile]);

  // ---- mouse parallax (fine pointers only), fading out as the intro begins
  useEffect(() => {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;
    const el = root.current!;
    const layers = [
      { n: el.querySelector("[data-leaf='left'] [data-par]"), d: 26 },
      { n: el.querySelector("[data-leaf='right'] [data-par]"), d: 34 },
      { n: el.querySelector("[data-sunpar]"), d: -40 },
      { n: el.querySelector("[data-content-par]"), d: -7 },
    ].filter((l) => l.n);
    const movers = layers.map((l) => ({
      d: l.d,
      x: gsap.quickTo(l.n, "x", { duration: 1.6, ease: "power3.out" }),
      y: gsap.quickTo(l.n, "y", { duration: 1.6, ease: "power3.out" }),
    }));
    const onMove = (e: PointerEvent) => {
      const damp = 1 - introProgress.get();
      const mx = (e.clientX / window.innerWidth - 0.5) * 2 * damp;
      const my = (e.clientY / window.innerHeight - 0.5) * 2 * damp;
      movers.forEach((m) => {
        m.x(mx * m.d);
        m.y(my * m.d * 0.6);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  const line = (i: number) => ({
    initial: { y: "105%", opacity: 0, letterSpacing: "0.16em" },
    animate: { y: "0%", opacity: 1, letterSpacing: "0.045em" },
    transition: { duration: 1.7 * k + 0.01, delay: (2.5 + i * 0.28) * k, ease: silk },
  });
  const fade = (delay: number, y = 12) => ({
    initial: { opacity: 0, y: y * k },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.4 * k + 0.01, delay: delay * k, ease: silk },
  });

  return (
    <div ref={root} role="region" aria-label="Introduction" className="absolute inset-0 z-[58] overflow-hidden" style={{ ["--sway" as string]: 1 }}>
      {/* ── paper, sunlight, atmosphere (dissolves into the film) ── */}
      <div data-paper aria-hidden="true" className="absolute inset-0 bg-ivory">
        <div className="absolute inset-0 [background:radial-gradient(120%_85%_at_50%_0%,#fdf9f1_0%,#f7f3ea_42%,#ece2cd_100%)]" />
        <div data-sunpar className="absolute inset-0">
          <motion.div
            className="absolute left-[38%] top-[-34%] h-[95vmax] w-[95vmax] animate-[sundrift_28s_ease-in-out_infinite_alternate] rounded-full [background:radial-gradient(circle,rgba(240,200,130,0.5)_0%,rgba(236,190,120,0.16)_34%,transparent_64%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3 * k, delay: 0.1 * k }}
          />
          {/* soft light shafts falling through the canopy */}
          <div className="absolute -top-[20%] left-[30%] h-[150%] w-[46vw] origin-top animate-[shafts_19s_ease-in-out_infinite_alternate] opacity-70 [background:linear-gradient(90deg,transparent_0%,rgba(255,232,190,0.28)_18%,transparent_30%,transparent_48%,rgba(255,232,190,0.2)_60%,transparent_72%,rgba(255,232,190,0.14)_86%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        </div>
        {/* atmospheric depth */}
        <div className="absolute inset-x-0 bottom-0 h-[45%] [background:linear-gradient(to_top,rgba(214,190,150,0.35),transparent)]" />
        <div className="absolute inset-0 [background:radial-gradient(110%_100%_at_50%_45%,transparent_55%,rgba(120,80,40,0.12)_100%)]" />
      </div>

      {/* ── Palmyra leaves (real silhouettes from the film) ── */}
      <motion.div aria-hidden="true" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 3.2 * k, delay: 0.5 * k }}>
        <Leaf side="left" />
        <Leaf side="right" />
      </motion.div>

      {/* light breaking through the gap during the transition */}
      <div data-flare aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[33%] h-[90vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 [background:radial-gradient(closest-side,rgba(255,244,214,0.95),rgba(255,214,140,0.45)_40%,transparent)]" />

      {/* golden dust — swept across the frame by the transition's "wind" */}
      <motion.div aria-hidden="true" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.5 * k, delay: 0.3 * k }}>
        <GoldParticles count={80} color="186,138,64" maxSize={1.6} rise={0.1} windRef={wind} />
      </motion.div>

      {/* ── fine gold details ── */}
      <motion.div data-deco aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block" {...fade(3.7, 0)}>
        {["left-3.5 bottom-3.5 border-l border-b", "right-3.5 bottom-3.5 border-r border-b"].map((c) => (
          <span key={c} className={`absolute h-5 w-5 border-gold/55 ${c}`} />
        ))}
        <p className="eyebrow absolute bottom-[18%] left-10 flex origin-bottom-left -rotate-90 items-center gap-4 whitespace-nowrap text-[0.58rem] text-earth/50">
          <span className="h-px w-10 bg-gold/60" /> Palmyra · Karupatti · Tradition
        </p>
        <p className="eyebrow absolute bottom-[18%] right-10 flex origin-bottom-right rotate-90 items-center gap-4 whitespace-nowrap text-[0.58rem] text-earth/50">
          From seed to sweetness <span className="h-px w-10 bg-gold/60" />
        </p>
      </motion.div>

      {/* ── content ── */}
      <div data-content className="relative flex h-full flex-col items-center px-5 pt-[clamp(76px,11svh,112px)]">
        <div data-content-par className="flex w-full max-w-6xl flex-1 flex-col items-center justify-center text-center">
          <LogoReveal reduced={reduced} className="h-[clamp(132px,20svh,224px)]" />

          <h1 className="display mt-[3.6svh] text-[clamp(1.55rem,0.9rem+4.1vw,5.6rem)] text-karupatti" aria-label="A sweetness rooted in nature.">
            <span className="block overflow-hidden pb-[0.06em]" aria-hidden="true">
              <motion.span className="block" {...line(0)}>
                A Sweetness
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]" aria-hidden="true">
              <motion.span className="block" {...line(1)}>
                Rooted in Nature.
              </motion.span>
            </span>
          </h1>

          <motion.p {...fade(3.25)} className="lead mt-[2.4svh] flex max-w-none items-center gap-4 text-earth/75">
            <span aria-hidden="true" className="hidden h-px w-10 bg-gradient-to-r from-transparent to-gold sm:block" />
            An ancient tradition. A naturally beautiful story.
            <span aria-hidden="true" className="hidden h-px w-10 bg-gradient-to-l from-transparent to-gold sm:block" />
          </motion.p>

          <motion.div {...fade(3.55)} className="mt-[4svh]">
            <button
              type="button"
              onClick={() => scrollTo(storyScrollY(0.012), { duration: 3.6 })}
              onMouseEnter={(e) => {
                // the mascot notices the visitor reaching for the CTA
                const r = e.currentTarget.getBoundingClientRect();
                window.dispatchEvent(new CustomEvent("karupatti:cta", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
              }}
              className="btn-gold group"
            >
              <span>Let&apos;s explore</span>
              <span aria-hidden="true" className="btn-arrow">→</span>
            </button>
          </motion.div>
        </div>

        {/* scroll indicator — in normal flow, always below the CTA */}
        <motion.div {...fade(4, 0)} aria-hidden="true" className="flex flex-col items-center gap-2.5 pb-[clamp(20px,4.5svh,44px)] pt-4 text-gold">
          <SeedGlyph />
          <span className="eyebrow text-[0.56rem] text-earth/55">Scroll to discover</span>
          <span className="relative block h-9 w-px overflow-hidden bg-earth/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.4s_cubic-bezier(.65,0,.35,1)_infinite] bg-gold" />
          </span>
        </motion.div>
      </div>
    </div>
  );
}
