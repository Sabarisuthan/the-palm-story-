"use client";

import { useRef } from "react";
import { SCENES } from "@/lib/story";
import { useStoryTimeline } from "@/hooks/useScrollAnimation";
import SceneText, { textInOut } from "./SceneText";

/**
 * SCENE 01 — The Palmyra leaves.
 * The hero's leaf silhouettes have just match-cut into these real leaves;
 * the footage carries the camera through them toward the sun, with a warm
 * light leak breathing over the frame.
 */
export default function PalmLeavesScene() {
  const root = useRef<HTMLDivElement>(null);

  useStoryTimeline(root, SCENES.leaves, (tl, el) => {
    const q = (s: string) => el.querySelector(s);
    tl.fromTo(el, { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.01 }, 0)
      // sunlight leak breathes and travels with the camera
      .fromTo(q("[data-sun]"), { opacity: 0, xPercent: 10, scale: 0.8 }, { opacity: 0.9, xPercent: -6, scale: 1.15, duration: 0.6, ease: "sine.inOut" }, 0.04)
      .to(q("[data-sun]"), { opacity: 0, duration: 0.25 }, 0.7)
      .fromTo(q("[data-shade]"), { opacity: 0 }, { opacity: 1, duration: 0.14 }, 0.12);
    textInOut(tl, q("[data-text]")!, 0.26, 0.68, 0.1);
    tl.set(el, { autoAlpha: 0 }, 1);
  });

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 z-10">
      <div data-sun aria-hidden="true" className="absolute -right-[20%] -top-[30%] h-[110vmax] w-[110vmax] rounded-full opacity-0 mix-blend-screen [background:radial-gradient(circle,rgba(255,214,140,0.55)_0%,rgba(255,190,110,0.18)_30%,transparent_62%)]" />
      <div data-shade aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-[rgba(25,12,4,0.74)] via-[rgba(25,12,4,0.34)] to-transparent opacity-0" />
      <div className="copy-safe-b absolute inset-x-0 bottom-[9vh] flex justify-center px-6">
        <SceneText chapter="01 — The Palmyra" title={"Every story\nhas a root."} />
      </div>
    </div>
  );
}
