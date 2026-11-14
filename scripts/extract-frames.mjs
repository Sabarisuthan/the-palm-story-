/**
 * Rebuilds the scroll-scrubbed image sequence used by the cinematic story
 * (scenes 01–03: leaves → seed → growth → mature palm).
 *
 * Usage:
 *   npm run frames -- "path/to/new-growth-video.mp4"
 *
 * Writes:
 *   public/sequences/story/desktop/f_001.webp …  (1280px, every frame)
 *   public/sequences/story/mobile/f_001.webp …   (720px, every 2nd frame)
 *
 * After replacing, update FRAME_COUNT / MOBILE_FRAME_COUNT and the scene
 * frame markers in src/lib/media.ts to match the new footage.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const input = process.argv[2];
if (!input) {
  console.error('Pass the source video: npm run frames -- "video.mp4"');
  process.exit(1);
}

const root = path.resolve("public/sequences/story");
const sets = [
  { dir: "desktop", vf: "scale=1280:-2", q: "72" },
  { dir: "mobile", vf: "select='not(mod(n\\,2))',scale=720:-2", q: "68", extra: ["-fps_mode", "vfr"] },
];

for (const s of sets) {
  const out = path.join(root, s.dir);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  execFileSync(
    ffmpeg,
    ["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-vf", s.vf, ...(s.extra ?? []), "-c:v", "libwebp", "-quality", s.q, path.join(out, "f_%03d.webp")],
    { stdio: "inherit" },
  );
  console.log(`${s.dir}: ${readdirSync(out).length} frames`);
}
