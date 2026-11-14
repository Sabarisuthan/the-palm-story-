"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Refined speech bubble for the Karupatti guide: ivory card, hairline gold
 * border, small-caps sans text typed out letter by letter. `side` is the
 * direction the bubble extends from the character's head.
 */
export default function CharacterSpeechBubble({ text, side = "left", reduced = false }: { text: string | null; side?: "left" | "right"; reduced?: boolean }) {
  return (
    <div className={`pointer-events-none absolute bottom-[calc(100%+6px)] z-10 ${side === "left" ? "right-[38%]" : "left-[38%]"}`}>
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: reduced ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-max max-w-[min(46vw,206px)] rounded-[14px] border border-gold/45 bg-ivory px-3.5 py-2.5 shadow-[0_12px_32px_-14px_rgba(75,38,15,0.45)] ${side === "left" ? "origin-bottom-right" : "origin-bottom-left"}`}
            role="note"
          >
            <TypeText text={text} reduced={reduced} />
            {/* tail */}
            <span
              aria-hidden="true"
              className={`absolute -bottom-[7px] h-3.5 w-3.5 rotate-45 border-b border-r border-gold/45 bg-ivory ${side === "left" ? "right-5" : "left-5"}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TypeText({ text, reduced }: { text: string; reduced: boolean }) {
  const [n, setN] = useState(reduced ? text.length : 0);
  useEffect(() => {
    if (reduced) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, 24);
    return () => window.clearInterval(id);
  }, [text, reduced]);
  return (
    <p className="relative text-[0.57rem] font-medium uppercase leading-[1.6] tracking-[0.12em] text-karupatti md:text-[0.61rem]">
      {/* full text reserves the size so the bubble doesn't grow while typing */}
      <span className="invisible">{text}</span>
      <span className="absolute inset-0">{text.slice(0, n)}</span>
    </p>
  );
}
