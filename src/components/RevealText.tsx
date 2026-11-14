import { Fragment, type ElementType } from "react";

/**
 * Splits text into masked words. Animate `.reveal-word > span` (yPercent 110 → 0)
 * with GSAP or let the CSS/Framer parent drive it. Lines are split on "\n".
 */
export default function RevealText({
  text,
  as: Tag = "span",
  className = "",
  wordClassName = "",
}: {
  text: string;
  as?: ElementType;
  className?: string;
  wordClassName?: string;
}) {
  const lines = text.split("\n");
  return (
    <Tag className={className} aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, li) => (
        <span key={li} className="reveal-line" aria-hidden="true">
          {line.split(" ").map((w, wi, arr) => (
            <Fragment key={wi}>
              <span className="reveal-word">
                <span className={wordClassName}>{w}</span>
              </span>
              {wi < arr.length - 1 ? " " : null}
            </Fragment>
          ))}
        </span>
      ))}
    </Tag>
  );
}
