/**
 * The cinematic story is ONE scroll-driven timeline. A single ScrollTrigger
 * publishes progress (0 → 1) here; every scene owns a paused GSAP timeline
 * mapped to its window of that progress. Scrolling up simply rewinds.
 */

export type Window = readonly [start: number, end: number];

/** Scene windows on the master progress. Overlaps = cross-scene transitions. */
export const SCENES = {
  leaves: [0.0, 0.14],
  seed: [0.11, 0.25],
  growth: [0.23, 0.42],
  karupatti: [0.4, 0.6],
  sweets: [0.56, 0.73],
  box: [0.69, 0.94],
  exit: [0.92, 1.0],
} as const satisfies Record<string, Window>;

export const CHAPTERS = [
  { id: "leaves", label: "The Palmyra", at: 0.02 },
  { id: "seed", label: "The Seed", at: 0.15 },
  { id: "growth", label: "The Growth", at: 0.26 },
  { id: "karupatti", label: "Karupatti", at: 0.47 },
  { id: "sweets", label: "The Sweets", at: 0.61 },
  { id: "box", label: "The Box", at: 0.76 },
] as const;

type Listener = (p: number) => void;

function createStore() {
  const listeners = new Set<Listener>();
  let current = 0;
  return {
    get: () => current,
    set(p: number) {
      if (p === current) return;
      current = p;
      listeners.forEach((l) => l(p));
    },
    subscribe(l: Listener) {
      listeners.add(l);
      l(current);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

/**
 * The stage opens with the hero. `introProgress` (0 → 1) drives the
 * cinematic hero → nature transition over the first INTRO_VH of scrolling;
 * `storyProgress` (0 → 1) drives scenes 01–07 over the rest.
 */
export const introProgress = createStore();
export const storyProgress = createStore();

/** Length of the intro transition, in viewport heights of scroll. */
export const INTRO_VH = 1.6;

function stageMetrics() {
  const el = document.getElementById("story");
  if (!el) return null;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const total = el.offsetHeight - window.innerHeight;
  const intro = Math.min(total * 0.5, INTRO_VH * window.innerHeight);
  return { top, total, intro };
}

/** Converts raw stage progress (0 → 1 over the whole section) into intro & story progress. */
export function splitStageProgress(raw: number) {
  const m = stageMetrics();
  if (!m) return { intro: raw, story: 0 };
  const px = raw * m.total;
  return { intro: clamp01(px / m.intro), story: clamp01((px - m.intro) / (m.total - m.intro)) };
}

/** Absolute scroll position at which the story reaches progress `p`. */
export function storyScrollY(p: number) {
  const m = stageMetrics();
  if (!m) return 0;
  return m.top + m.intro + p * (m.total - m.intro);
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Local progress of p inside window [a, b]. */
export const within = (p: number, [a, b]: Window) => clamp01((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
