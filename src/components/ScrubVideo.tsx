"use client";

import { useEffect, useRef } from "react";
import { storyProgress, within, type Window } from "@/lib/story";

/**
 * Scroll-scrubbed video slot. Only rendered when the matching entry in
 * `VIDEOS` (src/lib/media.ts) is enabled — otherwise the scene's built-in
 * fallback animation plays alone. For smooth scrubbing, encode with short
 * GOPs, e.g.  ffmpeg -i in.mp4 -an -c:v libx264 -crf 23 -g 6 -movflags +faststart out.mp4
 */
export default function ScrubVideo({
  src,
  window,
  from = 0,
  to = 1,
  className = "",
  poster,
}: {
  src: string;
  window: Window;
  /** portion of the scene window over which the video plays */
  from?: number;
  to?: number;
  className?: string;
  poster?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let target = 0;
    let busy = false;
    const seek = () => {
      if (!v.duration || busy) return;
      const time = target * (v.duration - 0.05);
      if (Math.abs(v.currentTime - time) < 1 / 30) return;
      busy = true;
      v.currentTime = time;
    };
    const onSeeked = () => { busy = false; seek(); };
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("loadedmetadata", seek);
    const unsub = storyProgress.subscribe((p) => {
      const k = within(p, window);
      target = Math.min(1, Math.max(0, (k - from) / (to - from)));
      seek();
    });
    return () => {
      unsub();
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("loadedmetadata", seek);
    };
  }, [window, from, to]);

  return <video ref={ref} src={src} poster={poster} muted playsInline preload="auto" aria-hidden="true" className={`h-full w-full object-cover ${className}`} />;
}
