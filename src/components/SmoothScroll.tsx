"use client";

import { ScrollContext, useSmoothScroll } from "@/hooks/useSmoothScroll";
import { useReducedMotion } from "@/hooks/useMediaQuery";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const scrollTo = useSmoothScroll(!reduced);
  return <ScrollContext.Provider value={scrollTo}>{children}</ScrollContext.Provider>;
}
