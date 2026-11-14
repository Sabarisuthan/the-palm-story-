"use client";

import { motion } from "framer-motion";
import { CONTACT } from "@/lib/content";
import { CONTACT_HREF, SITE } from "@/lib/site";

const silk = [0.22, 1, 0.36, 1] as const;
const view = { once: true, amount: 0.3 } as const;
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: view,
  transition: { duration: 1.2, delay, ease: silk },
});

/**
 * CONTACT — a deep Karupatti panel closing the content sections. Every route
 * is a real link (mail, phone, WhatsApp, Instagram); rows whose details are
 * not set in src/lib/site.ts are simply left out.
 */
export default function ContactSection() {
  const rows = [
    { label: "Email", value: SITE.email, href: CONTACT_HREF.email },
    { label: "WhatsApp", value: SITE.whatsapp ? `+${SITE.whatsapp}` : "", href: CONTACT_HREF.whatsapp },
    { label: "Telephone", value: SITE.phone, href: CONTACT_HREF.phone },
    { label: "Instagram", value: SITE.instagramHandle, href: SITE.instagramHref, external: true },
  ].filter((r) => r.value && r.href);

  return (
    <section id="contact" data-nav="dark" aria-labelledby="contact-title" className="relative isolate overflow-hidden bg-karupatti py-[clamp(4.5rem,11vh,8rem)] text-ivory">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(80%_70%_at_25%_10%,#6e1e17_0%,#5d1713_48%,#3b0d0a_100%)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[16vw] -top-[10%] -z-10 aspect-[760/720] w-[52vw] max-w-[780px] origin-[88%_53%] animate-[sway_23s_ease-in-out_infinite] bg-[#2a0a07] opacity-40 blur-[3px] [mask:url(/assets/leaf-right.png)_center/100%_100%_no-repeat]"
      />

      <div className="mx-auto grid max-w-[1180px] gap-[clamp(2.5rem,5vw,4.5rem)] px-6 md:grid-cols-[1fr_0.95fr] md:items-start md:px-10">
        <div>
          <motion.p {...rise()} className="eyebrow flex items-center gap-3 text-gold-soft">
            <span aria-hidden="true" className="inline-block h-px w-8 bg-current" />
            {CONTACT.eyebrow}
          </motion.p>
          <motion.h2 {...rise(0.08)} id="contact-title" className="display mt-6 text-ivory">
            {CONTACT.title.split("\n").map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </motion.h2>
          <motion.p {...rise(0.16)} className="lead mt-7 text-ivory/75">
            {CONTACT.copy}
          </motion.p>
        </div>

        <motion.div {...rise(0.14)} className="md:pt-2">
          <ul className="border-t border-ivory/15">
            {rows.map((r) => (
              <li key={r.label}>
                <a
                  href={r.href}
                  {...(r.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ivory/15 py-5 transition-colors duration-500 hover:border-gold/60"
                >
                  <span className="eyebrow text-gold-soft/80">{r.label}</span>
                  <span className="font-serif text-[clamp(1.05rem,0.95rem+0.4vw,1.4rem)] text-ivory transition-colors duration-500 group-hover:text-gold-soft">
                    {r.value}
                    <span aria-hidden="true" className="ml-3 inline-block translate-x-0 text-gold-soft transition-transform duration-500 group-hover:translate-x-1.5">
                      →
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {(SITE.location || CONTACT.note) && (
            <div className="mt-7 space-y-2">
              {SITE.location && <p className="eyebrow text-ivory/45">{SITE.location}</p>}
              {CONTACT.note && <p className="text-[0.93rem] leading-[1.7] text-ivory/55">{CONTACT.note}</p>}
            </div>
          )}

          <div className="mt-9">
            <a href={CONTACT_HREF.email} className="btn-gold inline-flex text-gold-soft [--btn-ink:var(--color-karupatti)]">
              <span>Write to us</span>
              <span aria-hidden="true" className="btn-arrow">
                →
              </span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
