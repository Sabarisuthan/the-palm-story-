"use client";

import { useRef } from "react";
import { SCENES } from "@/lib/story";
import { ASSETS, SWEETS, VIDEOS } from "@/lib/media";
import { useStoryTimeline } from "@/hooks/useScrollAnimation";
import { cropStyle } from "./PhotoCrop";
import GoldParticles from "./GoldParticles";
import ScrubVideo from "./ScrubVideo";

const ARCH_ASPECT = 0.68;
/** Camera stops inside the ORIGINAL photograph: one sweet in macro → the open tin. */
const MACRO = cropStyle(SWEETS[4].x, SWEETS[4].y, 0.11, ARCH_ASPECT);
const TIN = cropStyle(0.68, 0.255, 0.2, ARCH_ASPECT);

const BADGE_TEXT = "THE PALM STORY · THE ART OF SWEETNESS · ";

/**
 * SCENE 05 — The art of sweetness.
 * An ivory editorial spread between the dark syrup and the brown box reveal:
 * the falling drop blooms into ivory; a tall arch window (the logo's frame)
 * holds a single sweet in macro, and the camera slowly pulls back through the
 * real photograph to the open tin. Gold double-frame, a rotating seal, an
 * outlined chapter numeral. The arch finally floods Karupatti brown and opens
 * into the box reveal.
 * Optional footage: /videos/sweets-macro.mp4 (enable in media.ts).
 */
export default function SweetsScene() {
  const root = useRef<HTMLDivElement>(null);

  useStoryTimeline(root, SCENES.sweets, (tl, el) => {
    const q = (s: string) => el.querySelector(s)!;
    const words = el.querySelectorAll("[data-h] .reveal-word > span");
    const photo = el.querySelector("[data-photo]");
    tl.set(el, { autoAlpha: 1 }, 0.002)
      // the drop lands → ivory blooms open
      .fromTo(el, { clipPath: "circle(0% at 50% 62%)" }, { clipPath: "circle(150% at 50% 62%)", duration: 0.2, ease: "power2.in" }, 0)
      .fromTo(q("[data-numeral]"), { opacity: 0, yPercent: 12 }, { opacity: 1, yPercent: -6, duration: 0.6 }, 0.1)
      // arch window rises open; gold frame draws in behind it
      .fromTo(q("[data-window]"), { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0px 0px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 0px 0px)", duration: 0.16, ease: "power3.out" }, 0.12)
      .fromTo(q("[data-frame]"), { opacity: 0, x: -18, y: -18 }, { opacity: 1, x: 0, y: 0, duration: 0.16, ease: "power2.out" }, 0.18)
      .fromTo(q("[data-seal]"), { opacity: 0, scale: 0.7, rotate: -40 }, { opacity: 1, scale: 1, rotate: 40, duration: 0.5, ease: "none" }, 0.18)
      .fromTo(q("[data-beam]"), { xPercent: -60, opacity: 0 }, { xPercent: 40, opacity: 1, duration: 0.45, ease: "none" }, 0.15)
      // editorial copy
      .fromTo(q("[data-eyebrow]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.08 }, 0.2)
      .fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 0.1, stagger: 0.012, ease: "power3.out" }, 0.22)
      .fromTo(q("[data-rule]"), { scaleX: 0 }, { scaleX: 1, duration: 0.1, ease: "power2.out" }, 0.3)
      .fromTo([q("[data-body]"), q("[data-fig]")], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.08, stagger: 0.03 }, 0.33)
      // exit: copy leaves, the arch floods brown and swallows the screen
      .to([q("[data-copy]"), q("[data-numeral]"), q("[data-seal]"), q("[data-frame]")], { opacity: 0, y: -20, duration: 0.08, ease: "power2.in" }, 0.6)
      .to(q("[data-flood]"), { opacity: 1, duration: 0.08 }, 0.64)
      .to(q("[data-window-wrap]"), { scale: 9, duration: 0.14, ease: "power3.in" }, 0.66)
      .set(el, { autoAlpha: 0 }, 1);
    // camera: macro on one sweet → slowly pull back to the open tin
    if (photo) tl.fromTo(photo, { ...MACRO }, { ...TIN, duration: 0.42, ease: "sine.inOut" }, 0.14);
  });

  return (
    <div ref={root} className="invisible absolute inset-0 z-30 overflow-hidden bg-ivory text-karupatti">
      {/* paper, warm light, slow gold beam */}
      <div aria-hidden="true" className="absolute inset-0 [background:radial-gradient(70%_80%_at_72%_45%,#fffaf0_0%,#f7f3ea_45%,#ece1cb_100%)]" />
      <div data-beam aria-hidden="true" className="absolute -inset-y-1/4 left-0 w-[70vw] -skew-x-[18deg] opacity-0 [background:linear-gradient(90deg,transparent,rgba(214,170,96,0.16),transparent)]" />
      <GoldParticles count={28} color="184,137,66" maxSize={1.4} rise={0.06} />

      {/* outlined chapter numeral */}
      <div
        data-numeral
        aria-hidden="true"
        className="pointer-events-none absolute -left-[2vw] top-[4vh] select-none font-serif text-[46vh] font-light leading-none text-transparent opacity-0 [-webkit-text-stroke:1px_rgba(184,137,66,0.45)] md:text-[64vh]"
      >
        05
      </div>

      <div className="relative mx-auto grid h-full max-w-[1440px] grid-rows-[auto_1fr] items-center gap-6 px-6 pb-[6vh] pt-[11vh] md:grid-cols-[1.05fr_0.95fr] md:grid-rows-1 md:gap-[5vw] md:px-[7vw] md:py-0">
        {/* arch window */}
        <div className="relative z-20 order-1 mx-auto w-[min(52vw,33svh)] md:order-2 md:w-[min(30vw,calc(76svh*0.68))]">
          <div data-frame aria-hidden="true" className="arch absolute inset-0 translate-x-3 translate-y-3 border border-gold/70 md:translate-x-5 md:translate-y-5" />
          <div data-window-wrap className="relative will-change-transform">
            <div data-window className="arch relative overflow-hidden bg-earth shadow-[0_40px_90px_-30px_rgba(75,38,15,0.55)]" style={{ aspectRatio: String(ARCH_ASPECT) }}>
              {VIDEOS.sweetsMacro.enabled ? (
                <ScrubVideo src={VIDEOS.sweetsMacro.src} window={SCENES.sweets} from={0.14} to={0.6} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  data-photo
                  src={ASSETS.sweetBox.src}
                  alt="A Karupatti sweet crowned with nuts, then the open tin of sweets, from The Palm Story box"
                  draggable={false}
                  decoding="async"
                  className="absolute max-w-none select-none"
                  style={MACRO}
                />
              )}
              <div aria-hidden="true" className="absolute inset-0 [background:linear-gradient(180deg,rgba(255,230,180,0.12),transparent_40%,rgba(40,15,5,0.25))]" />
              <div data-flood aria-hidden="true" className="absolute inset-0 bg-karupatti opacity-0" />
            </div>
          </div>

          {/* rotating seal with the original emblem */}
          <div data-seal aria-hidden="true" className="absolute -left-[13%] top-[6%] w-[34%] min-w-[92px] opacity-0 md:-left-[22%] md:top-[10%] md:w-[38%]">
            <div className="relative aspect-square rounded-full bg-ivory/95 shadow-[0_10px_30px_-10px_rgba(75,38,15,0.35)]">
              <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
                <defs>
                  <path id="seal-path" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
                </defs>
                <circle cx="100" cy="100" r="96" fill="none" stroke="#B88942" strokeWidth="0.8" />
                <circle cx="100" cy="100" r="54" fill="none" stroke="#B88942" strokeWidth="0.6" opacity="0.6" />
                <text fill="#5D1713" fontSize="12.6" letterSpacing="3.4" fontFamily="var(--font-sans)">
                  <textPath href="#seal-path">{BADGE_TEXT}</textPath>
                </text>
              </svg>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSETS.emblem.src} alt="" className="absolute left-1/2 top-1/2 h-[38%] w-auto -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* editorial copy */}
        <div data-copy className="copy-safe-b-md relative z-10 order-2 self-start text-center md:order-1 md:self-center md:text-left">
          <p data-eyebrow className="eyebrow mb-5 flex items-center justify-center gap-3 text-gold md:mb-7 md:justify-start">
            <span aria-hidden="true" className="inline-block h-px w-8 bg-current" />
            05 — The Art of Sweetness
          </p>
          <h2 data-h aria-label="Tradition, crafted into every bite." className="display">
            <span className="reveal-line" aria-hidden="true">
              <span className="reveal-word"><span>Tradition,</span></span>
            </span>
            <span className="reveal-line" aria-hidden="true">
              <span className="reveal-word"><span className="pr-[0.08em] font-light normal-case italic tracking-normal text-gold">crafted</span></span>{" "}
              <span className="reveal-word"><span>into</span></span>
            </span>
            <span className="reveal-line" aria-hidden="true">
              <span className="reveal-word"><span>every</span></span>{" "}
              <span className="reveal-word"><span>bite.</span></span>
            </span>
          </h2>
          <div data-rule aria-hidden="true" className="mx-auto mt-6 h-px w-24 origin-left bg-gold md:mx-0 md:mt-9" />
          <p data-body className="lead mx-auto mt-5 text-earth/80 md:mx-0 md:mt-7">
            Every sweet carries the beauty of tradition and the warmth of sharing.
          </p>
          <p data-fig className="eyebrow mt-8 hidden text-[0.6rem] text-earth/50 md:block">Fig. 05 — From The Palm Story tin</p>
        </div>
      </div>
    </div>
  );
}
