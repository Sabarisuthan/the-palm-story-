"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export type ScrollTo = (target: string | number | HTMLElement, opts?: { offset?: number; duration?: number }) => void;

export const ScrollContext = createContext<ScrollTo>((target) => {
  if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else if (typeof target === "string") document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  else target.scrollIntoView({ behavior: "smooth" });
});

export const useScrollTo = () => useContext(ScrollContext);

/**
 * Lenis smooth scrolling driven by GSAP's ticker so ScrollTrigger and Lenis
 * share one clock. Touch devices keep native scrolling (Lenis default), and
 * users who prefer reduced motion get plain native scroll.
 */
export function useSmoothScroll(enabled: boolean) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;
    // softer glide: lower lerp = longer, silkier ease-out on each wheel tick
    const lenis = new Lenis({ lerp: 0.07, wheelMultiplier: 0.85, touchMultiplier: 1, smoothWheel: true, autoRaf: false });
    lenisRef.current = lenis;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  const scrollTo: ScrollTo = (target, opts = {}) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset: opts.offset ?? 0, duration: opts.duration ?? 2.4 });
      return;
    }
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    const top = typeof el === "number" ? el : (el?.getBoundingClientRect().top ?? 0) + window.scrollY + (opts.offset ?? 0);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return scrollTo;
}
