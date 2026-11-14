"use client";

import { motion } from "framer-motion";
import { SWEETS } from "@/lib/content";
import { ASSETS } from "@/lib/media";
import { useScrollTo } from "@/hooks/useSmoothScroll";
import PhotoCrop from "@/components/PhotoCrop";

const silk = [0.22, 1, 0.36, 1] as const;
const view = { once: true, amount: 0.25 } as const;
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: view,
  transition: { duration: 1.2, delay, ease: silk },
});

/**
 * OUR SWEETS — the signature tin shown in the original brand photograph,
 * with three close-ups taken from that same photograph. Every description
 * refers only to what is visible in the picture.
 */
export default function SweetsSection() {
  const scrollTo = useScrollTo();
  const f = SWEETS.feature;

  return (
    <section id="sweets" data-nav="light" aria-labelledby="sweets-title" className="relative isolate overflow-hidden bg-ivory py-[clamp(4.5rem,11vh,8rem)] text-earth">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(75%_55%_at_18%_0%,#fffaf1_0%,#f7f3ea_50%,#ece2cf_100%)]" />

      <header className="mx-auto max-w-[1180px] px-6 md:px-10">
        <motion.p {...rise()} className="eyebrow flex items-center gap-3 text-gold">
          <span aria-hidden="true" className="inline-block h-px w-8 bg-current" />
          {SWEETS.eyebrow}
        </motion.p>
        <div className="mt-6 gap-10 md:flex md:items-end md:justify-between">
          <motion.h2 {...rise(0.08)} id="sweets-title" className="display text-karupatti">
            {SWEETS.title.split("\n").map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </motion.h2>
          <motion.p {...rise(0.16)} className="mt-6 max-w-[40ch] text-[clamp(0.95rem,0.9rem+0.2vw,1.06rem)] leading-[1.75] text-earth/80 md:mb-2 md:mt-0">
            {SWEETS.intro}
          </motion.p>
        </div>
      </header>

      {/* the signature tin */}
      <div className="mx-auto mt-[clamp(2.5rem,6vh,4rem)] grid max-w-[1180px] items-center gap-[clamp(2rem,4.5vw,4rem)] px-6 md:grid-cols-[1.15fr_0.85fr] md:px-10">
        <motion.figure
          initial={{ opacity: 0, y: 34, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={view}
          transition={{ duration: 1.4, ease: silk }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-[18px] shadow-[0_40px_80px_-40px_rgba(75,38,15,0.6)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ASSETS.sweetBox.src}
              width={ASSETS.sweetBox.width}
              height={ASSETS.sweetBox.height}
              alt="The Palm Story box: a cream lid with the brand mark, deep brown tin and antique gold rim, beside an open tin of nut-topped sweets"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-gold/40" />
          </div>
        </motion.figure>

        <div>
          <motion.p {...rise(0.08)} className="eyebrow text-gold">
            {f.kicker}
          </motion.p>
          <motion.h3 {...rise(0.14)} className="mt-4 font-serif text-[clamp(1.7rem,1.3rem+1.3vw,2.6rem)] leading-tight text-karupatti">
            {f.name}
          </motion.h3>
          <motion.p {...rise(0.2)} className="mt-5 max-w-[42ch] text-[clamp(0.95rem,0.9rem+0.2vw,1.06rem)] leading-[1.75] text-earth/80">
            {f.copy}
          </motion.p>

          <motion.dl {...rise(0.26)} className="mt-8 border-t border-earth/12">
            {f.specs.map((s) => (
              <div key={s.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-earth/12 py-3.5">
                <dt className="eyebrow text-earth/50">{s.label}</dt>
                <dd className="font-serif text-[1.02rem] italic text-karupatti">{s.value}</dd>
              </div>
            ))}
          </motion.dl>

          <motion.div {...rise(0.32)} className="mt-9">
            <button type="button" onClick={() => scrollTo("#contact", { duration: 1.8 })} className="btn-gold">
              <span>{f.cta}</span>
              <span aria-hidden="true" className="btn-arrow">
                →
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* close-ups from the same photograph */}
      <ul className="mx-auto mt-[clamp(3rem,7vh,5rem)] grid max-w-[1180px] grid-cols-1 gap-x-[clamp(1.5rem,3vw,2.5rem)] gap-y-10 px-6 sm:grid-cols-3 md:px-10">
        {SWEETS.details.map((d, i) => (
          <motion.li key={d.title} {...rise(0.06 * i)}>
            <PhotoCrop cx={d.cx} cy={d.cy} size={d.size} aspect={0.86} className="arch w-full shadow-[0_26px_54px_-30px_rgba(75,38,15,0.55)]" alt="" />
            <h3 className="mt-6 font-serif text-[clamp(1.2rem,1.05rem+0.4vw,1.45rem)] text-karupatti">{d.title}</h3>
            <p className="mt-2 max-w-[28ch] text-[0.93rem] leading-[1.7] text-earth/70">{d.copy}</p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
