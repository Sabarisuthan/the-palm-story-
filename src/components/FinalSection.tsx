"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ASSETS } from "@/lib/media";
import { SITE } from "@/lib/site";
import { useNavActions } from "./Navbar";
import GoldParticles from "./GoldParticles";
import FarewellGuide from "./character/FarewellGuide";

const silk = [0.22, 1, 0.36, 1] as const;

/** SCENE 07 — Final brand closing. Warm ivory, the original logo, quiet links. */
export default function FinalSection() {
  const go = useNavActions();
  const view = { once: true, amount: 0.3 } as const;
  const rise = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: view,
    transition: { duration: 1.4, delay, ease: silk },
  });

  const links = [
    { label: "Our Story", onClick: go.story },
    { label: "Our Sweets", onClick: go.sweets },
    { label: "Contact", onClick: go.contact },
    { label: "Instagram", href: SITE.instagramHref, external: true },
  ];

  return (
    <section id="final" data-nav="light" aria-labelledby="final-title" className="relative isolate overflow-hidden bg-ivory text-earth">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(90%_60%_at_50%_0%,#fbf8f1_0%,#f7f3ea_50%,#efe6d4_100%)]" />
      {/* real Palmyra leaf shadows, bookending the hero */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-[18vw] top-[8%] -z-10 aspect-[760/720] w-[62vw] max-w-[900px] origin-[88%_53%] animate-[sway_16s_ease-in-out_infinite] bg-earth opacity-[0.1] blur-[6px] [mask:url(/assets/leaf-right.png)_center/100%_100%_no-repeat]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-[22vw] -bottom-[16%] -z-10 aspect-[780/720] w-[56vw] max-w-[820px] origin-[11%_55%] animate-[sway_19s_ease-in-out_-5s_infinite] bg-palm opacity-[0.1] blur-[3px] [mask:url(/assets/leaf-left.png)_center/100%_100%_no-repeat]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <GoldParticles count={36} color="190,140,66" maxSize={1.6} />
      </div>

      <div className="mx-auto flex min-h-[100svh] max-w-5xl flex-col items-center justify-center px-6 pb-16 pt-28 text-center">
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={view}
            transition={{ duration: 1.8, ease: silk }}
          >
            <Image src={ASSETS.logo.src} unoptimized alt="The Palm Story" width={ASSETS.logo.width} height={ASSETS.logo.height} className="h-[26svh] max-h-[260px] min-h-[150px] w-auto" />
          </motion.div>
          {/* the guide, beside the logo, waving goodbye */}
          <FarewellGuide className="absolute bottom-0 left-[calc(100%+4px)] h-[min(15svh,150px)] md:left-[calc(100%+20px)] md:h-[min(20svh,190px)]" />
        </div>

        <motion.h2 id="final-title" {...rise(0.3)} className="display mt-[5svh] text-karupatti">
          The sweet story continues…
        </motion.h2>
        <motion.p {...rise(0.5)} className="lead mt-4 text-earth/75">
          Discover the beauty of traditional sweetness.
        </motion.p>
        <motion.div {...rise(0.6)} className="mt-[4.5svh]">
          <button type="button" onClick={go.sweets} className="btn-gold">
            <span>Discover the Palm Story</span>
            <span aria-hidden="true" className="btn-arrow">→</span>
          </button>
        </motion.div>

        <motion.nav {...rise(0.7)} aria-label="Footer" className="mt-[6svh] w-full max-w-2xl">
          <div className="mb-8 flex items-center justify-center gap-4 text-gold" aria-hidden="true">
            <span className="h-px w-16 bg-current opacity-60" />
            <span className="h-1.5 w-1.5 rotate-45 bg-current" />
            <span className="h-px w-16 bg-current opacity-60" />
          </div>
          <ul className="grid grid-cols-2 gap-y-5 sm:flex sm:justify-center sm:gap-12">
            {links.map((l) => (
              <li key={l.label}>
                {l.href ? (
                  <a href={l.href} {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})} className="eyebrow link-underline inline-block py-2 text-earth/80 hover:text-karupatti">
                    {l.label}
                  </a>
                ) : (
                  <button type="button" onClick={l.onClick} className="eyebrow link-underline inline-block py-2 text-earth/80 hover:text-karupatti">
                    {l.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </motion.nav>
      </div>

      <footer className="border-t border-earth/10 px-6 py-6">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 text-[0.68rem] tracking-[0.18em] text-earth/55 uppercase sm:flex-row">
          <p>© {new Date().getFullYear()} The Palm Story</p>
          <p>Minimal in design · Rich in story</p>
        </div>
      </footer>
    </section>
  );
}
