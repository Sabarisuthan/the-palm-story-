"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import CharacterRig, { type RigHandles, type RigName } from "./CharacterRig";
import CharacterSpeechBubble from "./CharacterSpeechBubble";
import { createAnimator, KEY_POSES, RIG_SCALE, type Act, type Animator, type KeyPose, type Visual } from "./CharacterAnimations";

export type CharacterApi = {
  play: (act: Act, o?: { facing?: "left" | "right"; target?: { x: number; y: number } }) => void;
  /** feed horizontal travel (px) to drive walk / run */
  travel: (dx: number) => void;
  setLocomotion: (on: boolean) => void;
  readonly state: string;
};

type Props = {
  bubble?: string | null;
  bubbleSide?: "left" | "right";
  reduced?: boolean;
  className?: string;
  style?: React.CSSProperties;
  initialAct?: Act;
};

const RIGS: RigName[] = ["front", "hero"];

/** Brass watering can, held in the front rig's left fist; droplets fall from the rose. */
function WateringCan() {
  return (
    <div className="pointer-events-none absolute w-[3.2em] -translate-x-[80%] -translate-y-[50%]">
      <svg viewBox="0 0 120 80" className="w-full drop-shadow-[0_4px_8px_rgba(40,15,5,0.35)]" aria-hidden="true">
        <defs>
          <linearGradient id="brass" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#e8c27a" />
            <stop offset="0.5" stopColor="#b88942" />
            <stop offset="1" stopColor="#7a5424" />
          </linearGradient>
        </defs>
        <path d="M70 18c10-12 30-12 38 2" fill="none" stroke="#9a6d32" strokeWidth="5" strokeLinecap="round" />
        <path d="M54 28h52l-5 42H59z" fill="url(#brass)" stroke="#7a5424" strokeWidth="1.2" />
        <ellipse cx="80" cy="28" rx="26" ry="5" fill="#d9b06a" stroke="#7a5424" strokeWidth="1.2" />
        <path d="M58 52 14 24l-3 5 44 30z" fill="url(#brass)" stroke="#7a5424" strokeWidth="1.2" />
        <rect x="4" y="19" width="12" height="11" rx="3" transform="rotate(-34 10 24)" fill="#c99a52" stroke="#7a5424" strokeWidth="1.2" />
      </svg>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="absolute left-[4%] top-[34%] h-[0.32em] w-[0.2em] rounded-full bg-[#cfe3ec] opacity-0 animate-[droplet_0.9s_ease-in_infinite]"
          style={{ animationDelay: `${i * 0.22}s`, marginLeft: `${(i % 2) * 0.3 - 0.15}em` }}
        />
      ))}
    </div>
  );
}

/** Small thought bubble that floats up beside the head while thinking. */
function ThoughtBubble({ on }: { on: boolean }) {
  return (
    <AnimatePresence>
      {on && (
        <motion.div
          className="pointer-events-none absolute -top-[6%] right-[-8%] flex items-end gap-[0.12em] text-[0.55em]"
          initial={{ opacity: 0, y: 8, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <span className="h-[0.35em] w-[0.35em] rounded-full border border-gold/50 bg-ivory/95" />
          <span className="mb-[0.3em] h-[0.55em] w-[0.55em] rounded-full border border-gold/50 bg-ivory/95" />
          <span className="mb-[0.7em] flex h-[1.5em] items-center gap-[0.18em] rounded-full border border-gold/50 bg-ivory/95 px-[0.5em] shadow-[0_6px_16px_-8px_rgba(75,38,15,0.5)]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-[0.26em] w-[0.26em] rounded-full bg-karupatti/70 animate-[thinkdot_1.2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.18}s` }} />
            ))}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The Karupatti mascot as a living 2D puppet.
 * Layers (outer → inner): travel (bob / jump / dance steps) → squash (S&S,
 * feet origin) → lean (rotation, feet origin) → visuals (2 rigs + drawn keys).
 */
const KarupattiCharacter = forwardRef<CharacterApi, Props>(function KarupattiCharacter(
  { bubble = null, bubbleSide = "left", reduced = false, className = "", style, initialAct = "idle" },
  ref,
) {
  const travelEl = useRef<HTMLDivElement>(null);
  const squash = useRef<HTMLDivElement>(null);
  const lean = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLSpanElement>(null);
  const prop = useRef<HTMLDivElement>(null);
  const sparkLayer = useRef<HTMLDivElement>(null);
  const visuals = useRef<Partial<Record<Visual, HTMLElement>>>({});
  const rigs = useRef<Partial<Record<RigName, RigHandles>>>({});
  const anim = useRef<Animator | null>(null);
  const pending = useRef<{ act: Act; o?: Parameters<CharacterApi["play"]>[1] } | null>({ act: initialAct });
  const [thinking, setThinking] = useState(false);
  const [state, setStateLabel] = useState("idle");

  /** golden particle burst around the character for special reactions */
  const sparkle = () => {
    const layer = sparkLayer.current;
    if (!layer || reduced) return;
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("span");
      s.className = "absolute left-1/2 top-[40%] block rounded-full";
      const size = 3 + Math.random() * 4;
      Object.assign(s.style, { width: `${size}px`, height: `${size}px`, background: "radial-gradient(circle,#fff3cf,#d9b06a 60%,rgba(184,137,66,0))", boxShadow: "0 0 8px rgba(232,190,110,0.8)" });
      layer.appendChild(s);
      const a = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
      const r = 50 + Math.random() * 60;
      gsap.fromTo(
        s,
        { x: 0, y: 0, scale: 0.4, opacity: 1 },
        { x: Math.cos(a) * r, y: Math.sin(a) * r - 30, scale: 1, opacity: 0, duration: 0.9 + Math.random() * 0.5, ease: "power2.out", onComplete: () => s.remove() },
      );
    }
  };

  const tryInit = () => {
    if (anim.current || RIGS.some((r) => !rigs.current[r])) return;
    anim.current = createAnimator(
      {
        travel: travelEl.current!,
        squash: squash.current!,
        lean: lean.current!,
        shadow: shadow.current!,
        visuals: visuals.current as Record<Visual, HTMLElement>,
        rigs: rigs.current,
        prop: prop.current,
        thought: setThinking,
        sparkle,
        onState: setStateLabel,
      },
      { reduced },
    );
    if (pending.current) anim.current.play(pending.current.act, pending.current.o);
    pending.current = null;
  };

  // (re)build the controller on every mount and destroy it on unmount, so strict-mode
  // remounts and hot reloads always end up with exactly one live controller
  useEffect(() => {
    tryInit();
    return () => {
      anim.current?.destroy();
      anim.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      play: (act, o) => {
        if (anim.current) anim.current.play(act, o);
        else pending.current = { act, o };
      },
      travel: (dx) => anim.current?.travel(dx),
      setLocomotion: (on) => anim.current?.setLocomotion(on),
      get state() {
        return state;
      },
    }),
    [state],
  );

  return (
    <div className={`relative aspect-[0.92] ${className}`} style={style} data-char-state={state}>
      <span ref={shadow} aria-hidden="true" className="absolute bottom-[-1.5%] left-1/2 h-[6%] w-[58%] -translate-x-1/2 rounded-[50%] bg-[rgba(40,18,6,0.3)] blur-[5px]" />
      <div ref={travelEl} className="absolute inset-0 will-change-transform">
        <div ref={squash} className="absolute inset-0 origin-bottom will-change-transform">
          <div ref={lean} className="absolute inset-0 origin-bottom will-change-transform">
            {/* size container: props scale with the character via cqh */}
            <div className="absolute inset-0" style={{ containerType: "size", fontSize: "9cqh" }}>
              {RIGS.map((r) => (
                <div
                  key={r}
                  data-visual={r}
                  ref={(el) => {
                    if (el) visuals.current[r] = el;
                  }}
                  className="absolute inset-x-0 bottom-0"
                  style={{ height: `${RIG_SCALE[r] * 100}%`, opacity: r === "front" ? 1 : 0 }}
                >
                  <CharacterRig
                    name={r}
                    onReady={(hd) => {
                      rigs.current[r] = hd;
                      tryInit();
                    }}
                    handProp={
                      r === "front" ? (
                        <div ref={prop} className="opacity-0">
                          <WateringCan />
                        </div>
                      ) : undefined
                    }
                  />
                </div>
              ))}
              {(Object.keys(KEY_POSES) as KeyPose[]).map((k) => {
                const m = KEY_POSES[k];
                return (
                  <div
                    key={k}
                    data-visual={k}
                    ref={(el) => {
                      if (el) visuals.current[k] = el;
                    }}
                    className="absolute bottom-0 left-1/2 opacity-0"
                    style={{ height: `${m.k * 100}%`, aspectRatio: `${m.w} / ${m.h}`, transform: `translate(-50%, ${(m.sink ?? 0) * 100}%)` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.src} alt="" width={m.w} height={m.h} draggable={false} className="absolute inset-0 h-full w-full select-none" />
                  </div>
                );
              })}
              <ThoughtBubble on={thinking} />
            </div>
          </div>
        </div>
      </div>
      <div ref={sparkLayer} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible" />
      <CharacterSpeechBubble text={bubble} side={bubbleSide} reduced={reduced} />
    </div>
  );
});

export default KarupattiCharacter;
