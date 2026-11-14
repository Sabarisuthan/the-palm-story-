"use client";

import { motion } from "framer-motion";
import { TRADITION } from "@/lib/content";
import { ASSETS } from "@/lib/media";

const silk = [0.22, 1, 0.36, 1] as const;
const view = { once: true, amount: 0.2 } as const;
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: view,
  transition: { duration: 1.15, delay, ease: silk },
});

/**
 * SECTION — the goodness of tradition.
 *
 * A deep palm-green panel that breaks the ivory run before the game. It
 * describes the traditional method in general terms; the stat row only
 * appears once figures are added to TRADITION.stats in src/lib/content.ts,
 * so nothing unverified is ever shown.
 */
export default function TraditionSection() {
  return (
    <section
      id="tradition"
      data-nav="dark"
      aria-labelledby="tradition-title"
      className="relative isolate overflow-hidden bg-[#2c3220] py-[clamp(4.5rem,11vh,8rem)] text-ivory"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(85%_70%_at_20%_0%,#44502e_0%,#2c3220_52%,#191d12_100%)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[14vw] top-[6%] -z-10 aspect-[760/720] w-[52vw] max-w-[760px] origin-[88%_53%] animate-[sway_25s_ease-in-out_infinite] bg-[#0f1309] opacity-50 blur-[2px] [mask:url(/assets/leaf-right.png)_center/100%_100%_no-repeat]"
      />

      <div className="mx-auto grid max-w-[1180px] items-center gap-[clamp(2.5rem,5vw,4.5rem)] px-6 md:grid-cols-[1fr_0.8fr] md:px-10">
        <div>
          <motion.p {...rise()} className="eyebrow flex items-center gap-3 text-gold-soft">
            <span aria-hidden="true" className="inline-block h-px w-8 bg-current" />
            {TRADITION.eyebrow}
          </motion.p>
          <motion.h2 {...rise(0.08)} id="tradition-title" className="display mt-6 text-ivory">
            {TRADITION.title.split("\n").map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </motion.h2>
          <motion.div {...rise(0.14)} aria-hidden="true" className="mt-8 h-px w-24 bg-gold" />
          <div className="mt-8 space-y-5">
            {TRADITION.paragraphs.map((p, i) => (
              <motion.p key={i} {...rise(0.2 + i * 0.08)} className="max-w-[46ch] text-[clamp(0.95rem,0.9rem+0.2vw,1.06rem)] leading-[1.75] text-ivory/75">
                {p}
              </motion.p>
            ))}
          </div>
        </div>

        <motion.figure
          initial={{ opacity: 0, y: 34, clipPath: "inset(12% 0% 0% 0% round 999px 999px 14px 14px)" }}
          whileInView={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0% round 999px 999px 14px 14px)" }}
          viewport={view}
          transition={{ duration: 1.5, ease: silk }}
          className="relative mx-auto w-[min(66vw,300px)] md:mx-0 md:w-full"
        >
          <div className="arch relative overflow-hidden bg-black/30 shadow-[0_34px_70px_-34px_rgba(0,0,0,0.7)]" style={{ aspectRatio: "0.74" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSETS.posterLeaves} alt="Sunlight through Palmyra fronds" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            <span aria-hidden="true" className="absolute inset-0 [background:linear-gradient(180deg,transparent_50%,rgba(10,14,6,0.55))]" />
          </div>
          <span aria-hidden="true" className="arch pointer-events-none absolute inset-0 translate-x-3 translate-y-3 border border-gold/50 md:translate-x-4 md:translate-y-4" />
        </motion.figure>
      </div>

      {/* the traditional method, in four moves */}
      <ol className="mx-auto mt-[clamp(3.5rem,8vh,5.5rem)] grid max-w-[1180px] grid-cols-1 gap-y-9 border-t border-ivory/15 px-6 pt-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 md:px-10">
        {TRADITION.steps.map((s, i) => (
          <motion.li key={s.n} {...rise(0.05 * i)} className="lg:border-l lg:border-ivory/15 lg:pl-7 lg:first:border-l-0 lg:first:pl-0">
            <p className="font-serif text-[clamp(2.4rem,2rem+1.4vw,3.4rem)] leading-none text-gold-soft/35">{s.n}</p>
            <h3 className="mt-4 font-serif text-[clamp(1.2rem,1.1rem+0.4vw,1.5rem)] text-ivory">{s.title}</h3>
            <p className="mt-2 max-w-[28ch] text-[0.93rem] leading-[1.7] text-ivory/60">{s.copy}</p>
          </motion.li>
        ))}
      </ol>

      {/* only rendered once figures that can be substantiated are supplied */}
      {TRADITION.stats.length > 0 && (
        <ul className="mx-auto mt-[clamp(2.5rem,6vh,4rem)] grid max-w-[1180px] grid-cols-2 gap-8 border-t border-ivory/15 px-6 pt-10 lg:grid-cols-4 md:px-10">
          {TRADITION.stats.map((s) => (
            <li key={s.label}>
              <p className="font-serif text-[clamp(2.2rem,1.8rem+1.6vw,3.6rem)] leading-none text-ivory">
                {s.value}
                {s.unit && <span className="ml-1 text-[0.4em] align-top text-gold-soft">{s.unit}</span>}
              </p>
              <p className="eyebrow mt-3 text-ivory/50">{s.label}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
