# The Palm Story — cinematic landing page

Next.js (App Router) · React · TypeScript · Tailwind v4 · GSAP ScrollTrigger · Lenis · Framer Motion · Three.js

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## How the experience works

| Part | Component | Notes |
|---|---|---|
| Hero | `Hero.tsx` | Original logo reveal, swaying Palmyra fan silhouettes, sunlight, gold dust. Framer Motion entrance; GSAP scroll-out. |
| Story engine | `CinematicStory.tsx`, `lib/story.ts`, `hooks/useScrollAnimation.ts` | One 1500vh section with a sticky stage. A single ScrollTrigger publishes progress 0→1; each scene scrubs its own paused GSAP timeline over its window (`SCENES` in `lib/story.ts`). Scrolling up rewinds everything. |
| 01 Leaves · 02 Seed · 03 Growth | `NatureSequence.tsx` + `PalmLeavesScene` / `SeedScene` / `GrowthScene` | 240-frame image sequence cut from the uploaded Palmyra reference film, drawn to canvas. Also acts as the "camera": arch-window opening, tilt down to soil, seed push-in, dive into the crown. |
| 04 Karupatti | `KarupattiScene.tsx`, `LiquidSyrup.tsx` | WebGL syrup shader (three.js) with a noise-edged liquid mask growing from the palm crown; golden thread + falling drop. |
| 05 Sweets | `SweetsScene.tsx`, `PhotoCrop.tsx` | Editorial still-life of macro crops from the **original** box photograph, floating at different depths. |
| 06 Box reveal | `SweetBoxReveal.tsx`, `GoldDust3D.tsx` | 2.5D: original photo enters from the right in perspective, gold sheen, camera pushes to the lid/logo, pans to the open tin, pulls back. three.js gold-dust vortex. No product sides are invented. |
| 07 Closing | `StoryExit.tsx`, `FinalSection.tsx` | Ivory arch (the logo's frame shape) opens back to ivory; logo, headline, links. |

## ⚠ Before going live — fill these in

The written sections ship with **draft copy and placeholder contact details**. Nothing in them has been verified against the real business.

| File | What to replace |
|---|---|
| `src/lib/site.ts` | email, phone, WhatsApp, location, Instagram handle + link. Rows with an empty value are hidden automatically. |
| `src/lib/content.ts` | all wording for Our Story, Our Sweets and Contact, including the tin's "Contents / Presentation / Occasions". |
| `src/app/layout.tsx` | add `metadataBase` once the domain is known. |

Product wording describes only what is visible in the brand photograph, and no health, nutritional or certification claims are made anywhere. Please keep it that way unless you can substantiate a claim.

## Page structure

| Section | Component | Notes |
|---|---|---|
| Hero + film | `CinematicStory` (`#story`) | the scroll-driven experience, scenes 01–07 |
| Our Story | `sections/StorySection` (`#about`) | heritage copy, palm portrait, three principles |
| Our Sweets | `sections/SweetsSection` (`#sweets`) | the signature tin + three close-ups cut from the same photograph |
| Contact | `sections/ContactSection` (`#contact`) | real mail/WhatsApp/phone/Instagram links, no fake form |
| Closing | `FinalSection` (`#final`) | logo, sign-off, footer links |

Each top-level section declares `data-nav="light" | "dark"`; the fixed bar reads that and flips its own ink and surface so it stays legible over whatever is behind it.

## Typography & layout contracts

Type is one fluid scale defined in `src/app/globals.css` — use the classes rather than ad-hoc sizes:

| Class | Use |
|---|---|
| `.display` | scene headlines (brand serif, uppercase, balanced line lengths) |
| `.display-sm` | brand lines and closing statements |
| `.lead` | italic serif supporting line, capped at a 36-character measure |
| `.eyebrow` | chapter labels and nav links (tabular numerals) |
| `.ink-film` | type set over footage — soft shadow for legibility |

The narrator mascot reserves a band at the foot of the stage. `CharacterGuide` publishes its height as `--lane-b` on the sticky stage, and scene copy keeps clear of it:

- `.copy-safe-b` — always clears the band (centred/bottom copy)
- `.copy-safe-b-sm` — only below `md`, where there is no room beside the character
- `.copy-safe-b-md` — only from `md` up, for vertically centred columns

Any new scene copy that sits low in the frame should carry one of these.

## The Karupatti guide (mascot)

All poses are cut 1:1 from `design/karupatti-character-sheet.webp` into `public/character/` by `node scripts/extract-character.cjs` (background removed only; the hero pose is also split into body + raised arm so it can wave). Re-run the script if the sheet is updated.

| File | Role |
|---|---|
| `character/CharacterAnimations.ts` | pose registry (consistent sizing), action loops: idle, wave, jump, walk, lean, think, water |
| `character/KarupattiCharacter.tsx` | renders a pose (all preloaded), mirroring, actions, watering-can prop, speech bubble |
| `character/CharacterSpeechBubble.tsx` | ivory/gold bubble with typed dialogue |
| `character/CharacterGuide.tsx` | the director: one guide travelling the whole film — hero entrance, scroll-scrubbed travel, walk cycle tied to scroll, beats & dialogue per scene (`STOPS_*`, `BEATS`) |
| `character/FarewellGuide.tsx` | closing section: walks up beside the logo and waves goodbye |

## Replacing / adding footage

All media is listed in `src/lib/media.ts`.

- **Growth film (scenes 01–03):** `npm run frames -- "new-film.mp4"`, then update `SEQUENCE.count` and `SEQUENCE.marks` to the new footage's key frames.
- **Scene videos:** drop `karupatti-making.mp4`, `sweets-macro.mp4` or `sweet-box-reveal.mp4` into `public/videos/` and set `enabled: true` in `VIDEOS`. They are scroll-scrubbed on top of the built-in fallback. Encode with short GOPs for smooth scrubbing:
  `ffmpeg -i in.mp4 -an -c:v libx264 -crf 23 -g 6 -pix_fmt yuv420p -movflags +faststart out.mp4`
- `public/videos/palm-leaves.mp4` and `palmyra-growth.mp4` are already cut from the reference film.

## Before going live

- Set the real contact link and Instagram URL in `src/lib/site.ts` (currently placeholders).
- Add `metadataBase` in `src/app/layout.tsx` once the domain is known.

## Brand assets

`public/assets/logo.png` is the original logo with only its paper background keyed out (no redrawing). `sweet-box.webp` is the original packaging photograph, unaltered.

## Accessibility & performance

- `prefers-reduced-motion`: Lenis off, ambient loops frozen, entrance animations instant; scroll-scrubbed scenes still follow the user's own scrolling.
- Mobile: native touch scrolling, 720px / 12fps frame set (2.5 MB vs 10 MB), lighter particles and shader resolution.
- Frames load coarse-to-fine so scrubbing works before every frame has arrived; WebGL layers only render while their scene is near.
