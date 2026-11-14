"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SCENES, storyProgress } from "@/lib/story";
import { VIDEOS } from "@/lib/media";
import { useStoryTimeline } from "@/hooks/useScrollAnimation";
import { useIsMobile, useReducedMotion } from "@/hooks/useMediaQuery";
import SceneText, { textInOut } from "./SceneText";
import ScrubVideo from "./ScrubVideo";

const LiquidSyrup = dynamic(() => import("./LiquidSyrup"), { ssr: false });

/**
 * SCENE 04 — The Karupatti story. The dive into the palm crown melts into
 * flowing golden-brown syrup (WebGL liquid mask). A slow golden thread and
 * a single falling drop carry us into the sweets.
 * Optional footage: /videos/karupatti-making.mp4 (enable in media.ts).
 */
export default function KarupattiScene() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  // Create the WebGL context once the visitor approaches; only render frames
  // while the scene window is near.
  useEffect(
    () =>
      storyProgress.subscribe((p) => {
        if (p > 0.2) setMounted(true);
        const on = p > SCENES.karupatti[0] - 0.04 && p < SCENES.karupatti[1] + 0.02;
        setActive((a) => (a === on ? a : on));
      }),
    [],
  );

  useStoryTimeline(root, SCENES.karupatti, (tl, el) => {
    const q = (s: string) => el.querySelector(s)!;
    tl.set(el, { autoAlpha: 1 }, 0.05)
      .fromTo(q("[data-glow]"), { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.3)
      .fromTo(q("[data-video]"), { opacity: 0, clipPath: "inset(100% 0% 0% 0%)" }, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "power2.out" }, 0.38)
      .fromTo(q("[data-thread]"), { scaleY: 0 }, { scaleY: 1, duration: 0.18, ease: "power1.in" }, 0.72)
      .fromTo(q("[data-drop]"), { y: "-10vh", opacity: 0, scale: 0.6 }, { y: "62vh", opacity: 1, scale: 1, duration: 0.18, ease: "power2.in" }, 0.8)
      .to(q("[data-thread]"), { opacity: 0, duration: 0.08 }, 0.92);
    textInOut(tl, q("[data-text]"), 0.44, 0.76, 0.09);
    tl.set(el, { autoAlpha: 0 }, 1);
  });

  return (
    <div ref={root} className="invisible absolute inset-0 z-20 overflow-hidden" aria-hidden={!active}>
      {mounted && <LiquidSyrup active={active} reduced={reduced} lowPower={isMobile} />}
      {VIDEOS.karupattiMaking.enabled && (
        <div data-video className="arch absolute left-1/2 top-[12vh] h-[48vh] w-[min(64vw,420px)] -translate-x-1/2 overflow-hidden opacity-0 shadow-[0_30px_80px_rgba(20,6,2,0.5)] md:left-auto md:right-[9vw] md:top-1/2 md:h-[62vh] md:w-[min(30vw,460px)] md:-translate-y-1/2 md:translate-x-0">
          <ScrubVideo src={VIDEOS.karupattiMaking.src} window={SCENES.karupatti} from={0.35} to={0.95} />
        </div>
      )}
      {!VIDEOS.karupattiMaking.enabled && <div data-video className="hidden" />}
      <div data-glow aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 [background:radial-gradient(60%_50%_at_30%_70%,rgba(20,6,2,0.55),transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[62vh] w-[3px] -translate-x-1/2">
        <div data-thread className="h-full w-full origin-top rounded-full bg-gradient-to-b from-[#f2cf8e] via-[#c88a3e] to-[#8a4517] opacity-90" />
      </div>
      <div data-drop aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-7 w-5 -translate-x-1/2 opacity-0 [border-radius:50%_50%_50%_50%/60%_60%_40%_40%] [background:radial-gradient(circle_at_35%_35%,#ffe6b0,#c88a3e_45%,#6b2e10)] shadow-[0_0_24px_rgba(240,190,110,0.6)]" />
      <div className="copy-safe-b-sm absolute inset-x-0 bottom-[10vh] px-6 md:bottom-auto md:left-[8vw] md:right-auto md:top-1/2 md:-translate-y-1/2 md:px-0">
        <SceneText
          chapter="04 — Karupatti"
          title={"Nature's own\nsweetness."}
          body="From the heart of the Palmyra, a tradition of natural sweetness."
          align="left"
          className="items-center text-center md:items-start md:text-left"
          titleClassName="drop-shadow-[0_4px_30px_rgba(20,6,2,0.45)]"
        />
      </div>
    </div>
  );
}
