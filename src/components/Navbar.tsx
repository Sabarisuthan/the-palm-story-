"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ASSETS } from "@/lib/media";
import { SITE } from "@/lib/site";
import { introProgress, storyProgress, storyScrollY } from "@/lib/story";
import { useScrollTo } from "@/hooks/useSmoothScroll";

export function useNavActions() {
  const scrollTo = useScrollTo();
  return {
    story: () => scrollTo("#about", { duration: 2 }),
    sweets: () => scrollTo("#sweets", { duration: 2 }),
    contact: () => scrollTo("#contact", { duration: 2 }),
    /** the cinematic film itself, rather than the written story */
    film: () => scrollTo(storyScrollY(0.012), { duration: 3.2 }),
    top: () => scrollTo(0),
  };
}

export default function Navbar() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const go = useNavActions();

  // Step aside once the intro transition starts; return for the closing section.
  useEffect(() => {
    const update = () => {
      const hidden = introProgress.get() > 0.04 && storyProgress.get() < 0.985;
      ref.current?.setAttribute("data-hidden", String(hidden));
    };
    const a = introProgress.subscribe(update);
    const b = storyProgress.subscribe(update);
    return () => {
      a();
      b();
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  /**
   * Over the written sections the bar needs a surface of its own, and it has to
   * read against whatever sits behind it. Each section declares `data-nav`
   * ("light" | "dark"); the bar takes the theme of the section under it.
   */
  useEffect(() => {
    const apply = () => {
      const el = ref.current;
      if (!el) return;
      const y = el.offsetHeight * 0.6;
      let theme = "light";
      for (const s of document.querySelectorAll<HTMLElement>("main > section[data-nav]")) {
        const r = s.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) {
          theme = s.dataset.nav ?? "light";
          break;
        }
      }
      el.dataset.theme = theme;
      el.dataset.solid = String(window.scrollY > el.offsetHeight * 0.75);
    };
    // Measuring five rects is cheap, and scroll events already arrive at most
    // once a frame — no extra throttling, so this stays correct even when
    // animation frames are paused (background tab).
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  const links = [
    { label: "Our Story", onClick: go.story },
    { label: "Our Sweets", onClick: go.sweets },
    { label: "Contact", onClick: go.contact },
    { label: "Instagram", href: SITE.instagramHref, external: true },
  ];

  return (
    <>
      <motion.header
        ref={ref}
        data-hidden="false"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 3.1, ease: [0.22, 1, 0.36, 1] }}
        data-theme="light"
        data-solid="false"
        className="group fixed inset-x-0 top-0 z-50 text-[color:var(--nav-ink,var(--color-earth))] transition-[transform,opacity] duration-700 ease-[var(--ease-silk)] data-[hidden=true]:pointer-events-none data-[hidden=true]:!-translate-y-full data-[hidden=true]:!opacity-0"
      >
        <span aria-hidden="true" className="nav-veil" />
        <nav aria-label="Primary" className="relative mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 md:h-24 md:px-10">
          <button
            type="button"
            onClick={go.top}
            aria-label="The Palm Story — back to top"
            className="emblem-shine transition-transform duration-700 ease-[var(--ease-silk)] hover:-translate-y-0.5"
            style={{ ["--emblem" as string]: `url(${ASSETS.emblem.src})` }}
          >
            <Image src={ASSETS.emblem.src} unoptimized alt="" width={ASSETS.emblem.width} height={ASSETS.emblem.height} className="h-10 w-auto md:h-11" priority />
          </button>
          <ul className="hidden items-center gap-7 md:flex">
            {links.map((l, i) => (
              <li key={l.label} className="flex items-center gap-7">
                {i > 0 && <span aria-hidden="true" className="h-3 w-px bg-gold/50" />}
                {l.href ? (
                  <a href={l.href} {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})} className="eyebrow link-underline pb-1 opacity-80 transition-opacity hover:opacity-100">
                    {l.label}
                  </a>
                ) : (
                  <button type="button" onClick={l.onClick} className="eyebrow link-underline pb-1 opacity-80 transition-opacity hover:opacity-100">
                    {l.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 flex-col items-end justify-center gap-[7px] md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
          >
            <span className="block h-px w-7 bg-current" />
            <span className="block h-px w-5 bg-current" />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[70] flex flex-col bg-ivory px-6 pb-10 pt-6 text-earth"
          >
            <div className="flex items-center justify-between">
              <Image src={ASSETS.emblem.src} unoptimized alt="" width={ASSETS.emblem.width} height={ASSETS.emblem.height} className="h-10 w-auto" />
              <button type="button" onClick={() => setOpen(false)} className="eyebrow h-11 px-2" aria-label="Close menu">
                Close
              </button>
            </div>
            <ul className="mt-auto space-y-2">
              {links.map((l, i) => (
                <motion.li key={l.label} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.07, duration: 0.7 }}>
                  {l.href ? (
                    <a href={l.href} onClick={() => setOpen(false)} className="display block py-2 text-5xl">
                      {l.label}
                    </a>
                  ) : (
                    <button type="button" onClick={() => { setOpen(false); setTimeout(l.onClick!, 350); }} className="display block py-2 text-left text-5xl">
                      {l.label}
                    </button>
                  )}
                </motion.li>
              ))}
            </ul>
            <p className="eyebrow mt-12 text-gold">A sweetness rooted in nature</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
