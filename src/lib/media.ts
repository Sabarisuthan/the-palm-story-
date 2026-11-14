/**
 * Central media manifest. Replacing footage is a one-file change:
 *
 *  1. Drop a new MP4 into /public/videos (same filename).
 *  2. Flip `enabled: true` for that video below — the scene will scroll-scrub
 *     the video on top of its built-in fallback animation.
 *
 * Scenes 01–03 use a frame-by-frame image sequence extracted from the
 * uploaded Palmyra reference film (most reliable way to scrub smoothly in
 * both directions). Rebuild it with `npm run frames -- "new.mp4"`.
 */

export const ASSETS = {
  logo: { src: "/assets/logo.png", width: 857, height: 900 },
  emblem: { src: "/assets/logo-emblem.png", width: 437, height: 575 },
  sweetBox: { src: "/assets/sweet-box.webp", width: 1536, height: 1024 },
  posterLeaves: "/assets/poster-leaves.jpg",
  posterTree: "/assets/poster-tree.jpg",
} as const;

export const SEQUENCE = {
  desktop: { path: "/sequences/story/desktop/f_", count: 240, step: 1 },
  mobile: { path: "/sequences/story/mobile/f_", count: 120, step: 2 },
  ext: ".webp",
  /** Key frames (in source 24 fps frame numbers) of the reference film. */
  marks: {
    leavesEnd: 48, // fan leaves & sun rays
    seedStart: 60, // dissolve finished — seed on soil
    growthStart: 96, // seed cracks
    growthEnd: 190, // young palm fully unfolded
    treeStart: 204, // mature Palmyra in the field
    last: 239,
  },
} as const;

export const VIDEOS = {
  palmLeaves: { src: "/videos/palm-leaves.mp4", enabled: false },
  palmyraGrowth: { src: "/videos/palmyra-growth.mp4", enabled: false },
  karupattiMaking: { src: "/videos/karupatti-making.mp4", enabled: false },
  sweetsMacro: { src: "/videos/sweets-macro.mp4", enabled: false },
  sweetBoxReveal: { src: "/videos/sweet-box-reveal.mp4", enabled: false },
} as const;

/**
 * Regions of the original sweet-box photograph (fractions of the image),
 * used for "camera" moves without altering or fabricating the product.
 */
export const BOX_REGIONS = {
  closedLid: { x: 0.375, y: 0.45 }, // centre of the closed tin's logo
  openSweets: { x: 0.665, y: 0.26 }, // centre of the open tin with sweets
} as const;

/** Individual sweets inside the open tin: centre (x, y) + diameter (d), fractions of photo width/height. */
export const SWEETS = [
  { x: 0.598, y: 0.215, d: 0.112 },
  { x: 0.686, y: 0.118, d: 0.1 },
  { x: 0.712, y: 0.232, d: 0.104 },
  { x: 0.655, y: 0.318, d: 0.1 },
  { x: 0.754, y: 0.375, d: 0.104 },
] as const;
