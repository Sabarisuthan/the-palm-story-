import type { gsap } from "gsap";
import RevealText from "./RevealText";

/** Editorial text block used across the story scenes. */
export default function SceneText({
  chapter,
  title,
  body,
  align = "center",
  tone = "light",
  className = "",
  titleClassName = "",
}: {
  chapter?: string;
  title: string;
  body?: string;
  align?: "left" | "center" | "right";
  tone?: "light" | "dark";
  className?: string;
  titleClassName?: string;
}) {
  const alignCls = align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";
  const onFilm = tone === "light" ? "ink-film" : "";
  const ink = tone === "light" ? "text-ivory" : "text-karupatti";
  return (
    <div data-text className={`flex flex-col ${alignCls} ${className}`}>
      {chapter && (
        <p data-chapter className={`eyebrow mb-5 flex items-center gap-3 ${onFilm} ${tone === "light" ? "text-gold-soft" : "text-gold"}`}>
          <span aria-hidden="true" className="inline-block h-px w-8 bg-current" />
          {chapter}
        </p>
      )}
      <RevealText as="h2" text={title} className={`display ${onFilm} ${ink} ${titleClassName}`} />
      {body && (
        <p data-body className={`lead mt-6 ${onFilm} ${tone === "light" ? "text-ivory/80" : "text-earth/80"}`}>
          {body}
        </p>
      )}
    </div>
  );
}

/** Adds the standard in → hold → out choreography for a SceneText to a timeline. */
export function textInOut(tl: gsap.core.Timeline, root: Element, inAt: number, outAt: number, dur = 0.12) {
  const words = root.querySelectorAll(".reveal-word > span");
  const extras = root.querySelectorAll("[data-chapter], [data-body]");
  tl.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: dur, stagger: dur * 0.12, ease: "power3.out" }, inAt)
    .to(words, { yPercent: -115, duration: dur * 0.8, stagger: dur * 0.06, ease: "power2.in" }, outAt);
  if (extras.length) {
    tl.fromTo(extras, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: dur, ease: "power2.out" }, inAt + dur * 0.4)
      .to(extras, { opacity: 0, y: -14, duration: dur * 0.6, ease: "power2.in" }, outAt);
  }
}
