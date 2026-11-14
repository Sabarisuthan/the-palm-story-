"use client";

import { useRef } from "react";
import { SCENES } from "@/lib/story";
import { useStoryTimeline } from "@/hooks/useScrollAnimation";
import SceneText, { textInOut } from "./SceneText";

/**
 * SCENE 02 — The seed. The camera has travelled down to rich, moist earth;
 * a warm light pool and tightening vignette hold focus on the seed.
 */
export default function SeedScene() {
  const root = useRef<HTMLDivElement>(null);

  useStoryTimeline(root, SCENES.seed, (tl, el) => {
    const q = (s: string) => el.querySelector(s);
    tl.set(el, { autoAlpha: 1 }, 0.002)
      // earth wipe rising from below as the camera tilts down
      .fromTo(q("[data-earth]"), { yPercent: 100 }, { yPercent: -100, duration: 0.32, ease: "power2.inOut" }, 0)
      .fromTo(q("[data-pool]"), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, ease: "sine.out" }, 0.25)
      .fromTo(q("[data-vignette]"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.25)
      .to([q("[data-pool]"), q("[data-vignette]")], { opacity: 0, duration: 0.2 }, 0.82);
    textInOut(tl, q("[data-text]")!, 0.36, 0.8, 0.1);
    tl.set(el, { autoAlpha: 0 }, 1);
  });

  return (
    <div ref={root} className="pointer-events-none invisible absolute inset-0 z-10">
      <div data-earth aria-hidden="true" className="absolute inset-x-0 top-0 h-full bg-gradient-to-t from-transparent via-[rgba(43,20,10,0.75)] to-transparent" />
      <div data-pool aria-hidden="true" className="absolute left-1/2 top-[48%] h-[70vmin] w-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 mix-blend-soft-light [background:radial-gradient(closest-side,rgba(255,200,120,0.7),transparent)]" />
      <div data-vignette aria-hidden="true" className="absolute inset-0 opacity-0 [background:radial-gradient(70%_60%_at_50%_50%,transparent_40%,rgba(20,8,2,0.7)_100%)]" />
      <div className="absolute inset-x-0 top-[16vh] px-6 md:left-[8vw] md:right-auto md:top-auto md:bottom-[16vh] md:px-0">
        <SceneText chapter="02 — The Seed" title={"Ours begins\nwith a seed."} align="left" className="items-center text-center md:items-start md:text-left" />
      </div>
    </div>
  );
}
