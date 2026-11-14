"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import KarupattiCharacter, { type CharacterApi } from "./KarupattiCharacter";

/**
 * FINAL SECTION — the guide walks up beside the logo, waves goodbye with a
 * smile, then returns to a gentle idle.
 */
export default function FarewellGuide({ className = "" }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const puppet = useRef<CharacterApi>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = wrap.current!;
    if (reduced) {
      puppet.current?.play("idle");
      return;
    }
    const start = 120;
    const pos = { x: start };
    let last = start;
    gsap.set(el, { x: start, opacity: 0 });
    let tl: gsap.core.Timeline | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || tl) return;
        io.disconnect();
        tl = gsap.timeline();
        tl.call(() => puppet.current?.setLocomotion(true))
          .to(el, { opacity: 1, duration: 0.35 })
          .to(pos, {
            x: 0,
            duration: 1.8,
            ease: "power1.inOut",
            onUpdate: () => {
              gsap.set(el, { x: pos.x });
              puppet.current?.travel(pos.x - last);
              last = pos.x;
            },
          }, 0)
          .call(() => puppet.current?.play("farewell"), undefined, "+=0.3");
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tl?.kill();
    };
  }, [reduced]);

  return (
    <div ref={wrap} className={className}>
      <KarupattiCharacter ref={puppet} reduced={reduced} className="h-full" initialAct="idle" />
    </div>
  );
}
