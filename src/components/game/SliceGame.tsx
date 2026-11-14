"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SliceEngine } from "./engine";
import { SoundKit } from "./sound";
import KarupattiCharacter, { type CharacterApi } from "@/components/character/KarupattiCharacter";
import { useReducedMotion } from "@/hooks/useMediaQuery";

const silk = [0.22, 1, 0.36, 1] as const;
const BEST_KEY = "palmstory.slice.best";

type Phase = "idle" | "playing" | "paused" | "over";

/**
 * SECTION — The Karupatti Sweet Slice Challenge.
 *
 * A canvas mini-game in the brand's own world: real laddus cut from the brand
 * photograph, palm jaggery, cashews and palm fruit to slice, dried chillies to
 * avoid. The mascot hosts it from the side and reacts to how you are doing.
 */
export default function SliceGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SliceEngine | null>(null);
  const soundRef = useRef<SoundKit | null>(null);
  const mascot = useRef<CharacterApi>(null);
  const lastReact = useRef(0);
  const startGameRef = useRef<(() => void) | null>(null);
  const reduced = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(3);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  /** Keep mascot reactions from stacking up during fast play. */
  const react = useCallback((act: Parameters<CharacterApi["play"]>[0], minGap = 900) => {
    const now = performance.now();
    if (now - lastReact.current < minGap) return;
    lastReact.current = now;
    mascot.current?.play(act);
  }, []);

  // ── engine setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sound = new SoundKit();
    soundRef.current = sound;

    const engine = new SliceEngine(
      canvas,
      {
        onScore: setScore,
        onLives: setLives,
        onSlice: (combo) => sound.play("slice", combo),
        onCombo: (combo) => {
          sound.play("combo");
          react(combo >= 3 ? "celebrate" : "jump", 700);
        },
        onPenalty: () => {
          sound.play("penalty");
          react("surprised", 400);
        },
        onOver: (final) => {
          sound.play("over");
          setPhase("over");
          setBest((b) => {
            const next = Math.max(b, final);
            try {
              localStorage.setItem(BEST_KEY, String(next));
            } catch {
              /* private browsing — the best score simply will not persist */
            }
            return next;
          });
          react(final >= 120 ? "dance" : "think", 0);
        },
      },
      reduced,
    );
    engineRef.current = engine;
    void engine.load().then(() => setReady(true));
    engine.ensureLoop();

    try {
      const saved = Number(localStorage.getItem(BEST_KEY));
      if (Number.isFinite(saved) && saved > 0) setBest(saved);
    } catch {
      /* ignore */
    }

    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(canvas);

    // stop the clock when the game is off screen or the tab is hidden
    const io = new IntersectionObserver(([e]) => engine.setPaused(!e.isIntersecting), { threshold: 0.15 });
    io.observe(canvas);
    const onVis = () => engine.setPaused(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      engine.destroy();
      engineRef.current = null;
    };
  }, [reduced, react]);

  // Dev-only handle, so the engine can be driven and asserted without a visible
  // frame loop: window.__slice.start() / .step(dt, n) / .slice(x0,y0,x1,y1)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __slice?: unknown }).__slice = {
      engine: () => engineRef.current,
      start: () => startGameRef.current?.(),
      step: (dt = 1 / 60, n = 1) => {
        const e = engineRef.current as unknown as { step: (d: number) => void } | null;
        for (let i = 0; i < n; i++) e?.step(dt);
      },
      objects: () =>
        (
          (engineRef.current as unknown as { objs: { kind: string; x: number; y: number; sliced: boolean }[] } | null)?.objs ?? []
        ).map((o) => ({ kind: o.kind, x: Math.round(o.x), y: Math.round(o.y), sliced: o.sliced })),
      slice: (x0: number, y0: number, x1: number, y1: number) => {
        const e = engineRef.current;
        e?.endPointer();
        e?.pointer(x0, y0, true);
        e?.pointer(x1, y1, true);
      },
    };
  }, []);

  // ── input ────────────────────────────────────────────────────────────────
  const toLocal = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const engine = engineRef.current;
    if (!engine || phase !== "playing") return;
    // a mouse slices on movement alone; touch and pen need contact
    const live = e.pointerType === "mouse" ? true : e.buttons > 0;
    const p = toLocal(e);
    engine.pointer(p.x, p.y, live);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const engine = engineRef.current;
    if (!engine || phase !== "playing") return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = toLocal(e);
    engine.pointer(p.x, p.y, true);
  };

  const onPointerUp = () => engineRef.current?.endPointer();

  // ── controls ─────────────────────────────────────────────────────────────
  const startGame = () => {
    const engine = engineRef.current;
    if (!engine) return;
    soundRef.current?.resume();
    soundRef.current?.play("start");
    engine.start();
    setPhase("playing");
    react("wave", 0);
  };

  const togglePause = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (phase === "playing") {
      engine.setPaused(true);
      setPhase("paused");
    } else if (phase === "paused") {
      engine.setPaused(false);
      setPhase("playing");
    }
  };

  const toggleMute = () => {
    setMuted((m) => {
      soundRef.current?.setMuted(!m);
      return !m;
    });
  };

  startGameRef.current = startGame;

  const overlay = phase === "idle" || phase === "over" || phase === "paused";

  return (
    <section
      id="game"
      data-nav="dark"
      aria-labelledby="game-title"
      className="relative isolate overflow-hidden bg-karupatti py-[clamp(4.5rem,11vh,8rem)] text-ivory"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(85%_70%_at_50%_0%,#6e1e17_0%,#5d1713_45%,#360c09_100%)]" />

      <header className="mx-auto max-w-[1180px] px-6 text-center md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease: silk }}
          className="eyebrow flex items-center justify-center gap-3 text-gold-soft"
        >
          <span aria-hidden="true" className="inline-block h-px w-8 bg-current" />
          Interlude
        </motion.p>
        <motion.h2
          id="game-title"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.1, delay: 0.08, ease: silk }}
          className="display mt-6 text-ivory"
        >
          Ready for a sweet challenge?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.1, delay: 0.16, ease: silk }}
          className="lead mx-auto mt-5 text-ivory/70"
        >
          Swipe to slice the sweetness — and let the chillies fall.
        </motion.p>
      </header>

      <div className="mx-auto mt-[clamp(2rem,5vh,3.5rem)] flex max-w-[1180px] flex-col items-stretch gap-6 px-6 md:flex-row md:items-end md:px-10">
        {/* the board */}
        <div className="relative flex-1">
          {/* HUD */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-5">
              <p className="eyebrow text-gold-soft/70">
                Score <span className="ml-2 font-serif text-[1.5rem] not-italic tracking-normal text-ivory">{score}</span>
              </p>
              <p className="eyebrow text-gold-soft/50">
                Best <span className="ml-2 font-serif text-[1.1rem] tracking-normal text-ivory/80">{best}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="flex items-center gap-1.5" aria-label={lives + " lives left"}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className={`block h-2.5 w-2.5 rotate-45 transition-colors duration-300 ${i < lives ? "bg-gold-soft" : "bg-ivory/20"}`}
                  />
                ))}
              </p>
              <button
                type="button"
                onClick={togglePause}
                disabled={phase === "idle" || phase === "over"}
                className="eyebrow rounded-full border border-ivory/25 px-3 py-1.5 text-[0.56rem] text-ivory/80 transition-colors hover:border-gold/60 hover:text-gold-soft disabled:opacity-35"
              >
                {phase === "paused" ? "Resume" : "Freeze"}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-pressed={muted}
                className="eyebrow rounded-full border border-ivory/25 px-3 py-1.5 text-[0.56rem] text-ivory/80 transition-colors hover:border-gold/60 hover:text-gold-soft"
              >
                {muted ? "Sound off" : "Sound on"}
              </button>
            </div>
          </div>

          <div
            ref={boardRef}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-[18px] border border-gold/25 bg-[radial-gradient(70%_60%_at_50%_30%,#51150f_0%,#3a0e0a_60%,#280907_100%)] shadow-[0_40px_90px_-45px_rgba(0,0,0,0.9)] sm:aspect-[16/10]"
          >
            <canvas
              ref={canvasRef}
              onPointerMove={onPointerMove}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="absolute inset-0 h-full w-full"
              style={{ touchAction: phase === "playing" ? "none" : "auto", cursor: phase === "playing" ? "crosshair" : "default" }}
              aria-label="Slice the sweets"
              role="img"
            />

            <AnimatePresence>
              {overlay && (
                <motion.div
                  key={phase}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 grid place-items-center bg-[rgba(32,8,6,0.72)] px-6 text-center backdrop-blur-[2px]"
                >
                  <div>
                    {phase === "over" ? (
                      <>
                        <p className="eyebrow text-gold-soft">Final score</p>
                        <p className="display mt-3 text-[clamp(2.6rem,6vw,4.4rem)] text-ivory">{score}</p>
                        <p className="lead mx-auto mt-3 text-ivory/70">
                          {score >= best && score > 0 ? "A new best. Beautifully done." : "Best so far: " + best}
                        </p>
                      </>
                    ) : phase === "paused" ? (
                      <>
                        <p className="eyebrow text-gold-soft">Frozen</p>
                        <p className="display mt-3 text-[clamp(1.8rem,4vw,2.8rem)] text-ivory">Take your time.</p>
                      </>
                    ) : (
                      <>
                        <p className="eyebrow text-gold-soft">The Karupatti Sweet Slice Challenge</p>
                        <p className="display mt-3 text-[clamp(1.8rem,4vw,2.8rem)] text-ivory">Swipe to slice.</p>
                        <p className="lead mx-auto mt-3 text-ivory/70">
                          Catch the sweets before they fall. Leave the dried chillies alone.
                        </p>
                      </>
                    )}
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={phase === "paused" ? togglePause : startGame}
                        disabled={!ready}
                        className="btn-gold text-gold-soft [--btn-ink:var(--color-karupatti)] disabled:opacity-50"
                      >
                        <span>{phase === "over" ? "Play again" : phase === "paused" ? "Resume" : ready ? "Start" : "Loading…"}</span>
                        <span aria-hidden="true" className="btn-arrow">
                          →
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="eyebrow mt-4 text-center text-ivory/35">
            Slice the laddus, jaggery, cashews and palm fruit · dried chillies cost a life
          </p>
        </div>

        {/* the host */}
        <div className="pointer-events-none mx-auto w-[min(42vw,150px)] shrink-0 md:mx-0 md:w-[min(16vw,190px)]">
          <KarupattiCharacter ref={mascot} reduced={reduced} className="h-full w-full" initialAct="idle" />
        </div>
      </div>
    </section>
  );
}
