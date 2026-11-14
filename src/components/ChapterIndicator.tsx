"use client";

import { useEffect, useRef } from "react";
import { CHAPTERS, storyProgress, storyScrollY } from "@/lib/story";
import { useScrollTo } from "@/hooks/useSmoothScroll";

/** Minimal chapter rail (desktop): where you are in the film; click to jump. */
export default function ChapterIndicator() {
  const root = useRef<HTMLDivElement>(null);
  const scrollTo = useScrollTo();

  useEffect(
    () =>
      storyProgress.subscribe((p) => {
        const el = root.current;
        if (!el) return;
        el.style.opacity = p > 0.03 && p < 0.9 ? "1" : "0";
        // dark ink while the ivory sweets spread is on screen
        el.dataset.tone = p > 0.575 && p < 0.675 ? "dark" : "light";
        let idx = 0;
        CHAPTERS.forEach((c, i) => { if (p >= c.at - 0.02) idx = i; });
        el.querySelectorAll<HTMLElement>("[data-ch]").forEach((n, i) => n.setAttribute("data-on", String(i === idx)));
      }),
    [],
  );

  return (
    <nav ref={root} aria-label="Story chapters" className="absolute right-6 top-1/2 z-[55] hidden -translate-y-1/2 opacity-0 transition-opacity duration-700 lg:block">
      <ol className="flex flex-col items-end gap-4">
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <button
              type="button"
              data-ch
              data-on="false"
              onClick={() => scrollTo(storyScrollY(c.at + 0.01), { duration: 2 })}
              className="group flex items-center gap-3 text-ivory/50 transition-colors duration-500 hover:text-ivory data-[on=true]:text-gold-soft"
            >
              <span className="eyebrow translate-x-2 text-[0.58rem] opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 group-data-[on=true]:translate-x-0 group-data-[on=true]:opacity-100">
                {String(i + 1).padStart(2, "0")} {c.label}
              </span>
              <span aria-hidden="true" className="block h-px w-4 bg-current transition-all duration-500 group-data-[on=true]:w-8" />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
