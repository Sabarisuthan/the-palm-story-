/**
 * ALL EDITABLE COPY FOR THE PAGE SECTIONS.
 *
 * ⚠ This is DRAFT copy, written from the brand brief (Palmyra palm, karupatti
 * palm jaggery, traditional South Indian sweets). It has not been checked
 * against the real business — read every line and rewrite it in your own words
 * before going live.
 *
 * Nothing here claims a health, nutritional or certification benefit, and the
 * product wording describes only what is visible in the brand photograph.
 * Please keep it that way unless you can substantiate a claim.
 */

export const ABOUT = {
  eyebrow: "Our Story",
  title: "From the Palmyra,\na tradition kept.",
  paragraphs: [
    "The Palmyra palm has stood over South Indian fields for longer than anyone can remember. From its sap comes karupatti — palm jaggery, drawn and set the way it has always been.",
    "The Palm Story is built around that one ingredient. Traditional sweets, made the slow way, so each one carries the character of the palm it came from.",
  ],
  /** the short line set beside the portrait */
  caption: "The Palmyra — where every Palm Story begins.",
  pillars: [
    { n: "01", title: "The Palmyra", copy: "Every sweet begins with the palm, not with a recipe." },
    { n: "02", title: "Karupatti", copy: "Palm jaggery, prepared the way it has always been prepared." },
    { n: "03", title: "Tradition", copy: "Recipes kept as they were handed down, and made the slow way." },
  ],
} as const;

export const SWEETS = {
  eyebrow: "Our Sweets",
  title: "Made around\none ingredient.",
  intro:
    "Our sweets are made with karupatti and finished with nuts, then packed into the Palm Story tin to be shared.",
  /** The one product with real photography. Add more once you have photographs. */
  feature: {
    name: "The Palm Story Box",
    kicker: "Signature gift tin",
    copy: "A cream lid with the Palm Story mark, a deep brown tin and an antique gold rim — made to be given, and to be kept afterwards.",
    /** TODO: confirm what the tin holds, or delete these lines */
    specs: [
      { label: "Contents", value: "Karupatti sweets, nut-topped" },
      { label: "Presentation", value: "Cream and gold gift tin" },
      { label: "Occasions", value: "Festivals, gifting, celebrations" },
    ],
    cta: "Enquire about the box",
  },
  /**
   * Close-ups taken from the brand photograph (crop centre + width, as
   * fractions of the image). Captions describe only what is in the picture.
   */
  details: [
    { cx: 0.754, cy: 0.375, size: 0.12, title: "The sweet", copy: "Rolled by hand and crowned with nuts." },
    { cx: 0.665, cy: 0.24, size: 0.26, title: "The tin", copy: "Lined in gold, filled to the rim." },
    { cx: 0.375, cy: 0.45, size: 0.3, title: "The mark", copy: "The Palm Story, pressed into the lid." },
  ],
} as const;

export const CONTACT = {
  eyebrow: "Contact",
  title: "Bring The Palm Story\nto your table.",
  copy: "For orders, gifting and enquiries, write to us — we read every message and reply ourselves.",
  /** shown under the links; TODO: replace with your real promise or delete */
  note: "We usually reply within two working days.",
} as const;
