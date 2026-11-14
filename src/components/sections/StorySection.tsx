"use client";

import { motion } from "framer-motion";
import { ABOUT } from "@/lib/content";
import { ASSETS } from "@/lib/media";

const silk = [0.22, 1, 0.36, 1] as const;
const view = { once: true, amount: 0.25 } as const;
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: view,
  transition: { duration: 1.2, delay, ease: silk },
});

/**
 * OUR STORY — the heritage section that follows the film: a portrait of the
 * palm in the logo's arch, the brand's own words beside it, and three
 * principles set on a hairline rule beneath.
 */
export default function StorySection() {
  return (
    <section id="about" data-nav="light" aria-labelledby="about-title" className="relative isolate overflow-hidden bg-ivory py-[clamp(4.5rem,11vh,8rem)] text-earth">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_80%_0%,#fdfaf3_0%,#f7f3ea_55%,#efe7d7_100%)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[18vw] top-[12%] -z-10 aspect-[780/720] w-[46vw] max-w-[660px] origin-[11%_55%] animate-[sway_21s_ease-in-out_infinite] bg-palm opacity-[0.07] blur-[2px] [mask:url(/assets/leaf-left.png)_center/100%_100%_no-repeat]"
      />

      <div className="mx-auto grid max-w-[1180px] items-center gap-[clamp(2.5rem,5vw,4.5rem)] px-6 md:grid-cols-[0.82fr_1fr] md:px-10">
        {/* portrait, framed in the logo's arch */}
        <motion.figure
          initial={{ opacity: 0, y: 36, clipPath: "inset(14% 0% 0% 0% round 999px 999px 14px 14px)" }}
          whileInView={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0% round 999px 999px 14px 14px)" }}
          viewport={view}
          transition={{ duration: 1.5, ease: silk }}
          className="relative mx-auto w-[min(74vw,330px)] md:mx-0 md:w-full"
        >
          <div className="arch relative overflow-hidden bg-earth shadow-[0_34px_70px_-34px_rgba(75,38,15,0.55)]" style={{ aspectRatio: "0.74" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSETS.posterTree} alt="A mature Palmyra palm standing over open fields at sunrise" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            <span aria-hidden="true" className="absolute inset-0 [background:linear-gradient(180deg,transparent_55%,rgba(40,18,6,0.35))]" />
          </div>
          <span aria-hidden="true" className="arch pointer-events-none absolute inset-0 translate-x-3 translate-y-3 border border-gold/60 md:translate-x-4 md:translate-y-4" />
          <figcaption className="eyebrow mt-7 text-earth/55 md:mt-8">{ABOUT.caption}</figcaption>
        </motion.figure>

        <div>
          <motion.p {...rise()} className="eyebrow flex items-center gap-3 text-gold">
            <span aria-hidden="true" className="inline-block h-px w-8 bg-current" />
            {ABOUT.eyebrow}
          </motion.p>
          <motion.h2 {...rise(0.08)} id="about-title" className="display mt-6 text-karupatti">
            {ABOUT.title.split("\n").map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </motion.h2>
          <motion.div {...rise(0.16)} aria-hidden="true" className="mt-8 h-px w-24 bg-gold" />
          <div className="mt-8 space-y-5">
            {ABOUT.paragraphs.map((p, i) => (
              <motion.p key={i} {...rise(0.22 + i * 0.08)} className="max-w-[46ch] text-[clamp(0.95rem,0.9rem+0.2vw,1.06rem)] leading-[1.75] text-earth/80">
                {p}
              </motion.p>
            ))}
          </div>
        </div>
      </div>

      {/* principles */}
      <motion.ul {...rise(0.1)} className="mx-auto mt-[clamp(3.5rem,8vh,6rem)] grid max-w-[1180px] grid-cols-1 gap-y-10 border-t border-earth/12 px-6 pt-10 sm:grid-cols-3 sm:gap-x-10 md:px-10">
        {ABOUT.pillars.map((p) => (
          <li key={p.n} className="sm:border-l sm:border-earth/12 sm:pl-7 sm:first:border-l-0 sm:first:pl-0">
            <p className="eyebrow text-gold">{p.n}</p>
            <h3 className="mt-3 font-serif text-[clamp(1.3rem,1.1rem+0.6vw,1.7rem)] text-karupatti">{p.title}</h3>
            <p className="mt-3 max-w-[32ch] text-[0.95rem] leading-[1.7] text-earth/70">{p.copy}</p>
          </li>
        ))}
      </motion.ul>
    </section>
  );
}
