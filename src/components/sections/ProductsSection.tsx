"use client";

import { motion } from "framer-motion";
import { PRODUCTS, type Product } from "@/lib/content";
import { ASSETS } from "@/lib/media";
import { useScrollTo } from "@/hooks/useSmoothScroll";
import PhotoCrop from "@/components/PhotoCrop";

const silk = [0.22, 1, 0.36, 1] as const;
const view = { once: true, amount: 0.2 } as const;
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: view,
  transition: { duration: 1.1, delay, ease: silk },
});

/**
 * SECTION — the product listing.
 *
 * Minimal and easy to browse: one card per product, photography where it
 * exists and a plain waiting frame where it does not. Prices come from
 * src/lib/content.ts and fall back to "Price on request" — none are invented.
 */
function Frame({ product }: { product: Product }) {
  const common = "relative w-full overflow-hidden rounded-[14px] bg-[#efe6d4]";
  if (!product.photo) {
    // no photograph yet — a composed empty frame reads better than a stand-in
    return (
      <div className={`${common} grid place-items-center border border-dashed border-earth/20`} style={{ aspectRatio: "4 / 5" }}>
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSETS.emblem.src} alt="" className="h-10 w-auto opacity-25" />
          <span className="eyebrow text-earth/35">Photography to come</span>
        </div>
      </div>
    );
  }
  if (product.photo.kind === "crop") {
    return (
      <div className={common} style={{ aspectRatio: "4 / 5" }}>
        <PhotoCrop
          cx={product.photo.cx}
          cy={product.photo.cy}
          size={product.photo.size}
          aspect={0.8}
          className="h-full w-full transition-transform duration-[1.1s] ease-[var(--ease-silk)] group-hover:scale-[1.06]"
          alt={product.name}
        />
      </div>
    );
  }
  return (
    <div className={common} style={{ aspectRatio: "4 / 5" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.sweetBox.src}
        alt={product.name}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-[1.1s] ease-[var(--ease-silk)] group-hover:scale-[1.06]"
      />
    </div>
  );
}

export default function ProductsSection() {
  const scrollTo = useScrollTo();

  return (
    <section id="products" data-nav="light" aria-labelledby="products-title" className="relative isolate overflow-hidden bg-ivory py-[clamp(4.5rem,11vh,8rem)] text-earth">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_55%_at_70%_0%,#fffaf1_0%,#f7f3ea_55%,#ece2cf_100%)]" />

      <header className="mx-auto max-w-[1180px] px-6 md:px-10">
        <motion.p {...rise()} className="eyebrow flex items-center gap-3 text-gold">
          <span aria-hidden="true" className="inline-block h-px w-8 bg-current" />
          {PRODUCTS.eyebrow}
        </motion.p>
        <div className="mt-6 gap-10 md:flex md:items-end md:justify-between">
          <motion.h2 {...rise(0.08)} id="products-title" className="display text-karupatti">
            {PRODUCTS.title.split("\n").map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </motion.h2>
          <motion.p {...rise(0.16)} className="mt-6 max-w-[38ch] text-[clamp(0.95rem,0.9rem+0.2vw,1.06rem)] leading-[1.75] text-earth/80 md:mb-2 md:mt-0">
            {PRODUCTS.intro}
          </motion.p>
        </div>
      </header>

      <ul className="mx-auto mt-[clamp(2.5rem,6vh,4rem)] grid max-w-[1180px] grid-cols-1 gap-x-[clamp(1.25rem,2.5vw,2rem)] gap-y-[clamp(2.5rem,5vh,3.5rem)] px-6 sm:grid-cols-2 lg:grid-cols-4 md:px-10">
        {PRODUCTS.items.map((p, i) => (
          <motion.li key={p.id} {...rise(0.05 * i)} className="group">
            <Frame product={p} />
            <div className="mt-5 flex items-baseline justify-between gap-4 border-b border-earth/12 pb-3">
              <h3 className="font-serif text-[clamp(1.15rem,1.05rem+0.35vw,1.4rem)] leading-tight text-karupatti">{p.name}</h3>
              <span className="eyebrow shrink-0 text-earth/45">{p.price ?? "On request"}</span>
            </div>
            {p.kicker && <p className="eyebrow mt-3 text-gold">{p.kicker}</p>}
            {p.copy && <p className="mt-2 max-w-[30ch] text-[0.93rem] leading-[1.7] text-earth/70">{p.copy}</p>}
            <button
              type="button"
              onClick={() => scrollTo("#contact", { duration: 1.8 })}
              className="eyebrow link-underline mt-5 inline-block pb-1 text-karupatti/80 transition-colors hover:text-karupatti"
            >
              {PRODUCTS.cta} →
            </button>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
