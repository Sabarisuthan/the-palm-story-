"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SCENES, storyProgress } from "@/lib/story";
import { ASSETS, BOX_REGIONS, VIDEOS } from "@/lib/media";
import { useStoryTimeline } from "@/hooks/useScrollAnimation";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";
import { useScrollTo } from "@/hooks/useSmoothScroll";
import RevealText from "./RevealText";
import ScrubVideo from "./ScrubVideo";

const GoldDust3D = dynamic(() => import("./GoldDust3D"), { ssr: false });

/** translate (as % of the frame) that centres photo point (cx, cy) at scale S */
const focus = (cx: number, cy: number, S: number) => ({ xPercent: -(cx - 0.5) * S * 100, yPercent: -(cy - 0.5) * S * 100, scale: S });

/**
 * SCENE 06 — The grand Palm Story box reveal.
 * 2.5D product film built from the ORIGINAL photograph only: the framed
 * photograph enters from the right in perspective, settles, catches a gold
 * sheen, then the "camera" pushes in to the lid & logo and pans across to
 * the open tin of sweets. No hidden sides are invented.
 * Optional footage: /videos/sweet-box-reveal.mp4 (enable in media.ts).
 */
export default function SweetBoxReveal() {
  const root = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const scrollTo = useScrollTo();

  useEffect(
    () =>
      storyProgress.subscribe((p) => {
        if (p > SCENES.box[0] - 0.12) setMounted(true);
        const on = p > SCENES.box[0] - 0.02 && p < SCENES.box[1] + 0.02;
        setActive((a) => (a === on ? a : on));
      }),
    [],
  );

  useStoryTimeline(
    root,
    SCENES.box,
    (tl, el) => {
      const q = (s: string) => el.querySelector(s)!;
      const S = isMobile ? 2.1 : 2.5;
      const lid = focus(BOX_REGIONS.closedLid.x, BOX_REGIONS.closedLid.y, S);
      const open = focus(BOX_REGIONS.openSweets.x, BOX_REGIONS.openSweets.y, S);
      const titleWords = q("[data-title]").querySelectorAll(".reveal-word > span");

      tl.set(el, { autoAlpha: 1 }, 0.002)
        .fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0)
        // 1 · golden light blooms at the centre
        .fromTo(q("[data-light]"), { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }, 0.03)
        // 3–5 · the box enters from the right, travels to centre, gently rotates
        .fromTo(
          q("[data-card]"),
          { xPercent: 115, rotateY: -42, rotateZ: 5, scale: 0.78, opacity: 0 },
          { xPercent: 0, rotateY: 0, rotateZ: 0, scale: 1, opacity: 1, duration: 0.26, ease: "power2.out" },
          0.08,
        )
        .fromTo(q("[data-card-shadow]"), { opacity: 0, scaleX: 0.6 }, { opacity: 1, scaleX: 1, duration: 0.24 }, 0.1)
        .fromTo(q("[data-sheen]"), { xPercent: -160 }, { xPercent: 160, duration: 0.12, ease: "power1.inOut" }, 0.3)
        // 6–7 · camera moves closer: cream lid, logo, golden borders
        .to(q("[data-cam]"), { ...lid, duration: 0.12, ease: "power2.inOut" }, 0.4)
        .fromTo(q("[data-cap='lid']"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.05 }, 0.48)
        .to(q("[data-cap='lid']"), { opacity: 0, y: -12, duration: 0.04 }, 0.56)
        // 8 · across to the open tin and its sweets
        .to(q("[data-cam]"), { ...open, duration: 0.1, ease: "power2.inOut" }, 0.57)
        .fromTo(q("[data-cap='open']"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.05 }, 0.64)
        .to(q("[data-cap='open']"), { opacity: 0, y: -12, duration: 0.04 }, 0.71)
        // 9 · pull back; the full composition and the brand line
        .to(q("[data-cam]"), { xPercent: 0, yPercent: 0, scale: 1, duration: 0.1, ease: "power2.inOut" }, 0.71)
        .to(q("[data-card-wrap]"), { y: isMobile ? "-12vh" : "-11vh", scale: isMobile ? 0.94 : 0.74, duration: 0.1, ease: "power2.inOut" }, 0.73)
        .fromTo(titleWords, { yPercent: 115 }, { yPercent: 0, duration: 0.08, stagger: 0.008, ease: "power3.out" }, 0.78)
        .fromTo(q("[data-sub]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.06 }, 0.83)
        .fromTo(q("[data-cta]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.06 }, 0.86)
        .set({}, {}, 1);
    },
    [isMobile],
  );

  return (
    <div ref={root} className="invisible absolute inset-0 z-40 overflow-hidden bg-karupatti">
      <div aria-hidden="true" className="absolute inset-0 [background:radial-gradient(80%_70%_at_50%_45%,#6e1e17_0%,#5d1713_45%,#3a0d0a_100%)]" />
      <div data-light aria-hidden="true" className="absolute left-1/2 top-[44%] h-[130vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 [background:radial-gradient(closest-side,rgba(232,186,110,0.42),rgba(184,137,66,0.12)_45%,transparent)]" />
      {mounted && <GoldDust3D active={active} reduced={reduced} lowPower={isMobile} />}

      {/* the box */}
      <div className="absolute inset-0 flex items-center justify-center px-5 [perspective:1600px]">
        <div data-card-wrap className="relative w-[min(92vw,calc((100svh_-_160px)*1.5))] md:w-[min(74vw,1040px,calc((100svh_-_170px)*1.5))]">
          <div data-card-shadow aria-hidden="true" className="absolute -bottom-[7%] left-[8%] right-[8%] h-[16%] rounded-[50%] bg-black/45 blur-2xl" />
          <div data-card className="relative aspect-[3/2] overflow-hidden rounded-[22px] shadow-[0_50px_120px_rgba(20,4,2,0.6)] [transform-style:preserve-3d]">
            <div data-cam className="absolute inset-0 will-change-transform">
              {VIDEOS.sweetBoxReveal.enabled ? (
                <ScrubVideo src={VIDEOS.sweetBoxReveal.src} window={SCENES.box} from={0.08} to={0.75} poster={ASSETS.sweetBox.src} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ASSETS.sweetBox.src}
                  width={ASSETS.sweetBox.width}
                  height={ASSETS.sweetBox.height}
                  alt="The Palm Story sweet box: a cream lid with the brand logo, deep brown body and antique gold rim, beside an open tin of sweets"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
            <div data-sheen aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/4 w-1/2 -skew-x-12 mix-blend-soft-light [background:linear-gradient(90deg,transparent,rgba(255,230,180,0.85),transparent)]" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-gold/50" />
            <p data-cap="lid" className="eyebrow absolute bottom-5 left-5 flex items-center gap-3 text-ivory opacity-0 [text-shadow:0_1px_12px_rgba(0,0,0,0.5)] md:bottom-8 md:left-8">
              <span aria-hidden="true" className="h-px w-8 bg-gold-soft" /> Cream lid · antique gold rim
            </p>
            <p data-cap="open" className="eyebrow absolute bottom-5 left-5 flex items-center gap-3 text-ivory opacity-0 [text-shadow:0_1px_12px_rgba(0,0,0,0.5)] md:bottom-8 md:left-8">
              <span aria-hidden="true" className="h-px w-8 bg-gold-soft" /> Inside — the sweets
            </p>
          </div>
        </div>
      </div>

      {/* brand line */}
      <div className="copy-safe-b-sm absolute inset-x-0 bottom-[6vh] flex flex-col items-center px-6 text-center md:bottom-[7vh]">
        <div data-title>
          <RevealText as="h2" text={"A little box. A timeless story."} className="display display-sm text-ivory" />
        </div>
        <p data-sub className="lead mt-3 text-ivory/75 opacity-0">
          Tradition, beautifully presented.
        </p>
        <div data-cta className="mt-6 opacity-0">
          <button
            type="button"
            onClick={() => scrollTo("#about", { duration: 2.2 })}
            className="btn-line text-gold-soft [--btn-fill:var(--color-gold)] [--btn-ink:var(--color-karupatti)]"
          >
            Discover the Palm Story
            <span aria-hidden="true" className="inline-block h-px w-6 bg-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
