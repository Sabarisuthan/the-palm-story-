"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useMediaQuery";

type Props = {
  count?: number;
  className?: string;
  /** rgb triplet */
  color?: string;
  maxSize?: number;
  rise?: number;
  /** optional live "wind" (screen-widths per second) — used to sweep dust across during transitions */
  windRef?: React.RefObject<number>;
};

/**
 * Lightweight 2D-canvas dust motes: tiny golden particles drifting upward
 * through light. Pauses offscreen; renders a single still frame for
 * reduced-motion users.
 */
export default function GoldParticles({ count = 60, className = "", color = "200,155,80", maxSize = 2.2, rise = 0.12, windRef }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const n = window.innerWidth < 768 ? Math.round(count * 0.5) : count;

    const parts = Array.from({ length: n }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * maxSize,
      vx: (Math.random() - 0.5) * 0.04,
      vy: -(0.25 + Math.random()) * rise,
      tw: Math.random() * Math.PI * 2,
      ts: 0.4 + Math.random() * 1.2,
    }));

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // one pre-rendered glow sprite, stamped per particle (no per-frame gradient objects)
    const SPR = 64;
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = SPR;
    const sctx = sprite.getContext("2d")!;
    const sg = sctx.createRadialGradient(SPR / 2, SPR / 2, 0, SPR / 2, SPR / 2, SPR / 2);
    sg.addColorStop(0, `rgba(${color},1)`);
    sg.addColorStop(1, `rgba(${color},0)`);
    sctx.fillStyle = sg;
    sctx.fillRect(0, 0, SPR, SPR);

    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (!reduced) {
          const wind = windRef?.current ?? 0;
          p.x += (p.vx + wind * (0.6 + p.r * 0.4)) * dt;
          p.y += (p.vy * dt * 60) / Math.max(h, 1);
          p.tw += p.ts * dt;
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
          if (p.x < -0.02) p.x = 1.02;
          if (p.x > 1.02) p.x = -0.02;
        }
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(p.tw));
        const px = p.x * w, py = p.y * h, R = p.r * 3.2;
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, px - R, py - R, R * 2, R * 2);
      }
      ctx.globalAlpha = 1;
      if (!reduced && visible) raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) { last = performance.now(); raf = requestAnimationFrame(draw); }
    });
    io.observe(canvas);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [count, color, maxSize, rise, reduced, windRef]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
