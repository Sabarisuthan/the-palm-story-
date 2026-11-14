/**
 * Brand details shown on the site.
 *
 * ⚠ EVERY VALUE MARKED "TODO" IS A PLACEHOLDER. Replace them with the real
 * details before going live — nothing here has been verified.
 */
type Site = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string;
  instagramHandle: string;
  instagramHref: string;
};

export const SITE: Site = {
  name: "The Palm Story",

  /** TODO: the address enquiries should reach */
  email: "hello@thepalmstory.example",
  /** TODO: full international format, e.g. "+91 98765 43210"; set to "" to hide */
  phone: "",
  /** TODO: digits only, international format, e.g. "919876543210"; set to "" to hide */
  whatsapp: "",
  /** TODO: where you make and ship from, e.g. "Tamil Nadu, India"; set to "" to hide */
  location: "",

  /** TODO: the real handle and profile link */
  instagramHandle: "@thepalmstory",
  instagramHref: "https://www.instagram.com/",
};

export const CONTACT_HREF = {
  email: `mailto:${SITE.email}`,
  phone: SITE.phone ? `tel:${SITE.phone.replace(/[^+\d]/g, "")}` : "",
  whatsapp: SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}` : "",
} as const;
