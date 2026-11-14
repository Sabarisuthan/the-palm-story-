"use client";

import { useRef } from "react";
import { SCENES } from "@/lib/story";
import { useStoryTimeline } from "@/hooks/useScrollAnimation";
import SceneText, { textInOut } from "./SceneText";

const STAGES = ["Seed", "Root", "Shoot", "Leaf", "Palm"];

/**
 * SCENE 03 — The growth. The seed-to-palm time-lapse is scrubbed by
 * NatureSequence; this layer adds the progressive text and a hairline
 * growth gauge that fills with the plant.
 */
export default function GrowthScene() {
  const root = useRef<HTMLDivElement>(null);

  useStoryTimeline(root, SCENES.growth, (tl, el) => {
    const q = (s: string) => el.querySelector(s)!;
    const texts = el.querySelectorAll("[data-text]");
    const stages = el.querySelectorAll("[data-stage]");
    tl.set(el, { autoAlpha: 1 }, 0.002)
      .fromTo(q("[data-gauge]"), { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.02)
      .fromTo(q("[data-fill]"), { scaleY: 0 }, { scaleY: 1, duration: 0.68, ease: "none" }, 0.04);
    stages.forEach((s, i) => {
      tl.fromTo(s, { opacity: 0.25, x: 0 }, { opacity: 1, x: 6, duration: 0.04 }, 0.04 + i * 0.16);
    });
    tl.to(q("[data-gauge]"), { opacity: 0, duration: 0.06 }, 0.86);
    textInOut(tl, texts[0], 0.07, 0.42, 0.08);
    textInOut(tl, texts[1], 0.66, 0.93, 0.07);
    tl.set(el, { autoAlpha: 0 }, 1);
  });

  return (
    <div ref={root} className="pointer-events-none invisible absolute inset-0 z-10">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-[rgba(25,12,4,0.45)] to-transparent" />
      <div className="absolute inset-x-0 top-[13vh] px-6 md:left-auto md:right-[8vw] md:px-0">
        <SceneText chapter="03 — The Growth" title={"Rooted\nin nature."} align="right" className="items-center text-center md:items-end md:text-right" />
      </div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[rgba(25,12,4,0.5)] to-transparent" />
      <div className="copy-safe-b absolute inset-x-0 bottom-[7vh] px-6">
        <SceneText title={"Grown through\ngenerations."} titleClassName="drop-shadow-[0_2px_24px_rgba(40,20,5,0.45)]" />
      </div>

      {/* growth gauge */}
      <div data-gauge aria-hidden="true" className="absolute bottom-[12vh] left-6 top-[34vh] hidden w-24 opacity-0 md:left-[8vw] md:block">
        <div className="absolute bottom-0 left-0 top-0 w-px bg-ivory/25">
          <div data-fill className="absolute inset-0 origin-bottom bg-gold-soft" />
        </div>
        <ul className="absolute inset-0 flex flex-col-reverse justify-between pl-4">
          {STAGES.map((s) => (
            <li key={s} data-stage className="eyebrow text-[0.6rem] text-ivory">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
