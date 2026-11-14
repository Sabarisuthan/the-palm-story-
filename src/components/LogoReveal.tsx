"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { ASSETS } from "@/lib/media";

/**
 * Palm-leaf region of the original logo (fractions of logo.png), as a polygon.
 * The logo is drawn twice from the same file, perfectly overlaid:
 *   A — everything except this region (fades in from blur)
 *   B — only this region, revealed by a fan-shaped sweep from the leaf's stem
 * When both are complete the composite is pixel-identical to the original.
 */
const LEAF_POLY = "0.27,0.38 0.27,0.22 0.31,0.15 0.40,0.10 0.48,0.095 0.545,0.125 0.585,0.185 0.592,0.25 0.57,0.31 0.52,0.375 0.47,0.395 0.38,0.37 0.31,0.40";
const polySvg = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' preserveAspectRatio='none'><polygon fill='black' points='${LEAF_POLY}'/></svg>`,
)}")`;

const maskA: React.CSSProperties = {
  WebkitMaskImage: `linear-gradient(#000,#000), ${polySvg}`,
  maskImage: `linear-gradient(#000,#000), ${polySvg}`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
};

const sweep = "conic-gradient(from -18deg at 29.5% 37%, #000 var(--sweep, -14deg), transparent calc(var(--sweep, -14deg) + 14deg))";
const maskB: React.CSSProperties = {
  WebkitMaskImage: `${polySvg}, ${sweep}`,
  maskImage: `${polySvg}, ${sweep}`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};

type P = { sx: number; sy: number; tx: number; ty: number; d: number; dur: number; r: number; c: number };

export default function LogoReveal({ reduced, className = "" }: { reduced: boolean; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const a = useRef<HTMLImageElement>(null);
  const b = useRef<HTMLImageElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = root.current!;
    if (reduced) {
      gsap.set([a.current, b.current], { opacity: 1, filter: "none" });
      gsap.set(b.current, { "--sweep": "200deg" });
      return;
    }

    // ---- logo: blur → focus, settle into place; leaf: fan sweep from the stem
    const tl = gsap.timeline({ delay: 0.2 });
    tl.fromTo(a.current, { opacity: 0, filter: "blur(16px)", scale: 1.05, y: 10 }, { opacity: 1, filter: "blur(0px)", scale: 1, y: 0, duration: 1.9, ease: "power3.out" }, 1.25)
      .fromTo(b.current, { opacity: 1, "--sweep": "-14deg" }, { "--sweep": "200deg", duration: 1.7, ease: "power2.inOut" }, 1.75)
      .fromTo(b.current, { scale: 1.05, y: 10 }, { scale: 1, y: 0, duration: 1.9, ease: "power3.out" }, 1.25);

    // ---- golden particles gather into the logo's own shape
    const cvs = canvas.current!;
    const ctx = cvs.getContext("2d")!;
    let raf = 0;
    let alive = true;
    const img = new Image();
    img.src = ASSETS.logo.src;
    img.decode().then(() => {
      if (!alive) return;
      const cr = cvs.getBoundingClientRect();
      const lr = a.current!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = cr.width * dpr;
      cvs.height = cr.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // sample the logo's opaque pixels at display size
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.round(lr.width));
      off.height = Math.max(1, Math.round(lr.height));
      const octx = off.getContext("2d")!;
      octx.drawImage(img, 0, 0, off.width, off.height);
      const data = octx.getImageData(0, 0, off.width, off.height).data;
      const pts: [number, number][] = [];
      for (let y = 0; y < off.height; y += 3) for (let x = 0; x < off.width; x += 3) if (data[(y * off.width + x) * 4 + 3] > 150) pts.push([x, y]);
      const N = Math.min(pts.length, window.innerWidth < 768 ? 260 : 560);
      const ox = lr.left - cr.left, oy = lr.top - cr.top;
      const cx = cr.width / 2, cy = cr.height / 2;
      const parts: P[] = Array.from({ length: N }, () => {
        const [px, py] = pts[(Math.random() * pts.length) | 0];
        const ang = Math.random() * Math.PI * 2;
        const rad = (0.45 + Math.random() * 0.55) * Math.hypot(cx, cy);
        return { sx: cx + Math.cos(ang) * rad, sy: cy + Math.sin(ang) * rad, tx: ox + px, ty: oy + py, d: Math.random() * 0.7, dur: 1.2 + Math.random() * 0.7, r: 0.5 + Math.random() * 1.1, c: (Math.random() - 0.5) * 0.6 };
      });
      const t0 = performance.now() + 250;
      const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const draw = (now: number) => {
        const t = (now - t0) / 1000;
        ctx.clearRect(0, 0, cr.width, cr.height);
        const fade = 1 - Math.min(1, Math.max(0, (t - 2.0) / 1.1)); // dissolve as the logo resolves
        for (const p of parts) {
          const k = Math.min(1, Math.max(0, (t - p.d) / p.dur));
          if (k <= 0) continue;
          const e = ease(k);
          const bend = Math.sin(e * Math.PI) * p.c;
          const x = p.sx + (p.tx - p.sx) * e - (p.ty - p.sy) * bend;
          const y = p.sy + (p.ty - p.sy) * e + (p.tx - p.sx) * bend;
          const alpha = Math.min(1, k * 3) * fade * (0.55 + 0.45 * Math.sin(now / 180 + p.c * 40));
          ctx.fillStyle = `rgba(196,150,78,${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, p.r * (1.4 - 0.5 * e), 0, Math.PI * 2);
          ctx.fill();
        }
        if (t < 3.4 && alive) raf = requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, cr.width, cr.height);
      };
      raf = requestAnimationFrame(draw);
    }).catch(() => {});

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      tl.kill();
    };
  }, [reduced]);

  return (
    <div ref={root} className={`relative ${className}`} style={{ aspectRatio: `${ASSETS.logo.width} / ${ASSETS.logo.height}` }}>
      <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute -inset-[45%] h-[190%] w-[190%]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={a} src={ASSETS.logo.src} alt="The Palm Story" width={ASSETS.logo.width} height={ASSETS.logo.height} className="absolute inset-0 h-full w-full opacity-0" style={maskA} decoding="sync" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={b} src={ASSETS.logo.src} alt="" aria-hidden="true" width={ASSETS.logo.width} height={ASSETS.logo.height} className="absolute inset-0 h-full w-full" style={maskB} decoding="sync" />
    </div>
  );
}
