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

/**
 * PRODUCT LISTING.
 *
 * ⚠ Only the gift tin has a photograph; the laddu is a close-up of that same
 * photograph. The other entries are the product types named in the brand
 * brief and are waiting on photography, descriptions and prices.
 *
 * `price: null` renders "Price on request" — set a string like "₹450" once
 * prices are confirmed. `photo: null` renders a plain "photography to come"
 * frame rather than a stand-in image.
 */
export type Product = {
  id: string;
  name: string;
  kicker?: string;
  copy?: string;
  /** TODO: real price, e.g. "₹450". null → "Price on request". */
  price: string | null;
  /** full = the whole brand photograph; crop = a region of it; null = awaiting photography */
  photo: { kind: "full" } | { kind: "crop"; cx: number; cy: number; size: number } | null;
};

export const PRODUCTS = {
  eyebrow: "The Collection",
  title: "Find your\nfavourite sweet.",
  intro: "Each one is made around karupatti. Tell us what you are looking for and we will put a box together.",
  cta: "Enquire",
  items: [
    {
      id: "box",
      name: "The Palm Story Box",
      kicker: "Signature gift tin",
      copy: "The cream-and-gold tin, filled with nut-topped karupatti sweets and made to be given.",
      price: null,
      photo: { kind: "full" },
    },
    {
      id: "laddu",
      name: "Karupatti Laddu",
      kicker: "From the tin",
      copy: "Rolled by hand and crowned with nuts.",
      price: null,
      photo: { kind: "crop", cx: 0.754, cy: 0.375, size: 0.13 },
    },
    { id: "halwa", name: "Karupatti Halwa", kicker: "Photography to come", price: null, photo: null },
    { id: "fruit", name: "Palm Fruit Sweet", kicker: "Photography to come", price: null, photo: null },
  ] satisfies Product[],
} as const;

/**
 * THE GOODNESS OF TRADITION.
 *
 * Describes the traditional method in general terms. It makes no health,
 * nutritional or certification claim, and says nothing specific about this
 * brand's own process — rewrite it in the first person once you can stand
 * behind the detail.
 *
 * `stats` is empty on purpose: the section hides that row until you add
 * figures you can substantiate. Nothing here should be a nutrition claim.
 */
export const TRADITION = {
  eyebrow: "The Goodness of Tradition",
  title: "Rooted in nature.\nMade with care.",
  paragraphs: [
    "Karupatti is one of the oldest sweeteners of the Tamil country. The sap of the Palmyra is gathered, reduced over a slow fire until it darkens, and left to set — no machinery, no hurry.",
    "That single ingredient sets the character of everything made with it: deeper than cane sugar, a little smoky, and unmistakably of the palm.",
  ],
  steps: [
    { n: "01", title: "Gathered", copy: "Sap is drawn from the Palmyra, at first light." },
    { n: "02", title: "Reduced", copy: "Hours over a slow fire, until it turns dark and fragrant." },
    { n: "03", title: "Set", copy: "Poured out and left to firm into karupatti." },
    { n: "04", title: "Made", copy: "Shaped into sweets, then packed into the tin." },
  ],
  /** TODO: add only figures you can substantiate, e.g. { value: "4", unit: "", label: "ingredients" } */
  stats: [] as { value: string; unit?: string; label: string }[],
} as const;

export const CONTACT = {
  eyebrow: "Contact",
  title: "Bring The Palm Story\nto your table.",
  copy: "For orders, gifting and enquiries, write to us — we read every message and reply ourselves.",
  /** shown under the links; TODO: replace with your real promise or delete */
  note: "We usually reply within two working days.",
} as const;
