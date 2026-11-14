"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { introProgress, splitStageProgress, storyProgress } from "@/lib/story";
import Hero from "./Hero";
import CharacterGuide from "./character/CharacterGuide";
import NatureSequence from "./NatureSequence";
import PalmLeavesScene from "./PalmLeavesScene";
import SeedScene from "./SeedScene";
import GrowthScene from "./GrowthScene";
import KarupattiScene from "./KarupattiScene";
import SweetsScene from "./SweetsScene";
import SweetBoxReveal from "./SweetBoxReveal";
import StoryExit from "./StoryExit";
import ChapterIndicator from "./ChapterIndicator";

/**
 * PART B — "From a single seed to a timeless sweet story."
 * One tall section with a sticky full-screen stage. A single ScrollTrigger
 * converts scroll position into story progress; every scene is a layer on
 * the stage scrubbing its own timeline from that one value — one continuous
 * film that reverses naturally when scrolling up.
 */
export default function CinematicStory() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const publish = (raw: number) => {
      const { intro, story } = splitStageProgress(raw);
      introProgress.set(intro);
      storyProgress.set(story);
    };
    // The film follows the scroll through a critically-damped smoother, so every
    // scene glides to rest — even with native touch scrolling or a jerky wheel —
    // instead of snapping frame-to-frame with raw scroll input.
    let target = 0;
    let current = 0;
    let first = true;
    const tick = (_t: number, dtMs: number) => {
      const diff = target - current;
      if (Math.abs(diff) < 0.00002) {
        if (current !== target) { current = target; publish(current); }
        return;
      }
      const k = 1 - Math.pow(1 - 0.12, Math.min(dtMs, 64) / 16.67); // frame-rate independent
      current += diff * k;
      publish(current);
    };
    gsap.ticker.add(tick);
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => {
        target = s.progress;
        if (reduced || first) { first = false; current = target; publish(current); }
      },
      onRefresh: (s) => {
        // after a layout change, jump straight to the true position
        target = current = s.progress;
        publish(current);
      },
    });
    // late-loading fonts/images can shift layout — re-measure once settled
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 600);
    return () => {
      window.clearTimeout(t);
      gsap.ticker.remove(tick);
      st.kill();
    };
  }, []);

  return (
    <section
      ref={section}
      id="story"
      data-nav="light"
      aria-label="From a single seed to a timeless sweet story"
      className="relative h-[1260vh] bg-ivory md:h-[1660vh]"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <Hero />
        <CharacterGuide />
        <NatureSequence />
        <PalmLeavesScene />
        <SeedScene />
        <GrowthScene />
        <KarupattiScene />
        <SweetsScene />
        <SweetBoxReveal />
        <StoryExit />
        <ChapterIndicator />
      </div>
    </section>
  );
}
