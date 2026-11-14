"use client";

import { useRef } from "react";
import { SCENES } from "@/lib/story";
import { useStoryTimeline } from "@/hooks/useScrollAnimation";

/**
 * Closing transition: an ivory arch — the shape of the logo's frame — rises
 * and opens until the whole screen returns to warm ivory, handing over
 * seamlessly to the final brand section.
 */
export default function StoryExit() {
  const root = useRef<HTMLDivElement>(null);
  useStoryTimeline(root, SCENES.exit, (tl, el) => {
    tl.set(el, { autoAlpha: 1 }, 0.002)
      .fromTo(
        el,
        { clipPath: "inset(100% 38% 0% 38% round 50vw 50vw 0px 0px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0vw 0vw 0px 0px)", duration: 0.9, ease: "power2.inOut" },
        0,
      )
      .set({}, {}, 1);
  });
  return <div ref={root} aria-hidden="true" className="pointer-events-none invisible absolute inset-0 z-50 bg-ivory" />;
}
