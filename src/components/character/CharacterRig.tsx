"use client";

import { useEffect, useRef } from "react";
import RIG from "./rig.json";

export type RigName = keyof typeof RIG;

/** DOM handles of one rig, used by the animation controller. */
export type RigHandles = {
  name: RigName;
  root: HTMLDivElement;
  parts: Record<string, HTMLElement>;
  irises: HTMLElement[];
  lids: HTMLElement[];
  /** max iris travel per eye, as % of the iris layer (x, y) */
  lookRange: { x: number; y: number }[];
};

type RigMeta = {
  w: number;
  h: number;
  parts: Record<string, { pivot: number[] }>;
  eyes: { cx: number; cy: number; rx: number; ry: number; inset: number; lid: string }[];
};

/** Back-to-front draw order: limbs and the leaf stem tuck behind the body. */
const ORDER: Record<RigName, { behind: string[]; front: string[] }> = {
  front: { behind: ["legL", "legR", "armL", "armR", "leaf"], front: [] },
  hero: { behind: ["leaf"], front: ["arm"] },
};

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * A 2D rig built from the original drawing. Every layer shares one canvas, so
 * at rest the stack is identical to the source artwork.
 */
export default function CharacterRig({
  name,
  onReady,
  handProp,
}: {
  name: RigName;
  onReady: (h: RigHandles) => void;
  /** element held in the left fist of the front rig (the watering can) */
  handProp?: React.ReactNode;
}) {
  const meta = RIG[name] as RigMeta;
  const root = useRef<HTMLDivElement>(null);
  const parts = useRef<Record<string, HTMLElement>>({});
  const irises = useRef<HTMLElement[]>([]);
  const lids = useRef<HTMLElement[]>([]);
  const dir = `/character/rig/${name}/`;

  useEffect(() => {
    if (!root.current) return;
    onReady({
      name,
      root: root.current,
      parts: parts.current,
      irises: irises.current.filter(Boolean),
      lids: lids.current.filter(Boolean),
      lookRange: meta.eyes.map((e) => ({
        x: (((e.rx - e.inset) * 0.42) / meta.w) * 100,
        y: (((e.ry - e.inset) * 0.36) / meta.h) * 100,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const layer = (p: string) => {
    const pv = meta.parts[p]?.pivot ?? [meta.w / 2, meta.h / 2];
    return (
      <div
        key={p}
        data-part={p}
        ref={(el) => {
          if (el) parts.current[p] = el;
        }}
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: `${pct(pv[0], meta.w)} ${pct(pv[1], meta.h)}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dir}${p}.webp`} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
        {name === "front" && p === "armL" && handProp && (
          <div className="absolute" style={{ left: pct(16, meta.w), top: pct(176, meta.h), width: 0, height: 0 }}>
            {handProp}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={root} className="absolute bottom-0 left-1/2 h-full -translate-x-1/2" style={{ aspectRatio: `${meta.w} / ${meta.h}` }}>
      {ORDER[name].behind.map(layer)}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${dir}body.webp`} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
      {meta.eyes.map((e, i) => (
        <div key={i}>
          <div className="absolute inset-0" style={{ clipPath: `ellipse(${pct(e.rx - e.inset, meta.w)} ${pct(e.ry - e.inset, meta.h)} at ${pct(e.cx, meta.w)} ${pct(e.cy, meta.h)})` }}>
            <div
              data-iris
              ref={(el) => {
                if (el) irises.current[i] = el;
              }}
              className="absolute inset-0 will-change-transform"
              style={{ transformOrigin: `${pct(e.cx, meta.w)} ${pct(e.cy, meta.h)}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${dir}iris${i}.webp`} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
            </div>
          </div>
          {/* eyelid: matches the surrounding skin, closes from the brow down */}
          <div
            className="absolute overflow-hidden rounded-[50%]"
            style={{ left: pct(e.cx - e.rx * 1.06, meta.w), top: pct(e.cy - e.ry * 1.08, meta.h), width: pct(e.rx * 2.12, meta.w), height: pct(e.ry * 2.14, meta.h) }}
          >
            <div
              data-lid
              ref={(el) => {
                if (el) lids.current[i] = el;
              }}
              className="absolute inset-0 origin-top"
              style={{
                transform: "scaleY(0)",
                background: `radial-gradient(120% 90% at 50% 10%, color-mix(in srgb, ${e.lid} 82%, white), ${e.lid} 55%, color-mix(in srgb, ${e.lid} 78%, black))`,
              }}
            >
              <span className="absolute inset-x-[8%] bottom-0 h-[13%] rounded-[50%] bg-[rgba(58,24,8,0.85)]" />
            </div>
          </div>
        </div>
      ))}
      {ORDER[name].front.map(layer)}
    </div>
  );
}
