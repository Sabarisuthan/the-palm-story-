"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "@/lib/gsap";
import { storyProgress, within, type Window } from "@/lib/story";

/**
 * Binds a paused GSAP timeline to a window of the master story progress.
 * The timeline is scrubbed (never auto-played), so scrolling up reverses it.
 *
 * `build` receives a fresh timeline whose total length is normalised to 1,
 * so positions like `0.25` mean "a quarter of the way through this scene".
 */
export function useStoryTimeline(
  scope: RefObject<HTMLElement | null>,
  window: Window,
  build: (tl: gsap.core.Timeline, root: HTMLElement) => void,
  deps: unknown[] = [],
) {
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    let unsub = () => {};
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      buildRef.current(tl, root);
      // pad to exactly 1 so local positions are fractions of the scene
      if (tl.duration() < 1) tl.set({}, {}, 1);
      unsub = storyProgress.subscribe((p) => {
        tl.progress(within(p, window));
      });
    }, root);
    return () => {
      unsub();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, window[0], window[1], ...deps]);
}

/** Subscribe to master progress with a callback (no re-renders). */
export function useStoryProgress(cb: (p: number) => void, deps: unknown[] = []) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => storyProgress.subscribe((p) => cbRef.current(p)), deps); // eslint-disable-line react-hooks/exhaustive-deps
}
