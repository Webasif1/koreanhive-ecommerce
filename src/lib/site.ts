export const siteConfig = {
  name: "Korean Hive",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Shop 100% authentic Korean beauty and skincare in Bangladesh. Guest checkout, cash on delivery, fast nationwide shipping.",
  locale: "en_BD",
  currency: "BDT",
  country: "BD",
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://facebook.com",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com",
  },
  /**
   * Support channels, read from the environment so nothing is published that
   * does not actually reach anyone. The contact page renders only the channels
   * that are configured — an unset value shows nothing rather than a dead
   * address a customer would write to and never hear back from.
   */
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null,
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? null,
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null,
    hours: process.env.NEXT_PUBLIC_SUPPORT_HOURS ?? "Saturday–Thursday, 10am–8pm",
  },
} as const;

/** Routes that must never be indexed: personal, transactional or noisy. */
export const NO_INDEX_PATHS = [
  "/cart",
  "/checkout",
  "/account",
  "/success",
  "/wishlist",
  "/search",
  "/api/",
  // staff area — nothing behind it is public, and its login page has no
  // business appearing in a search result for the brand
  "/admin",
] as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

/**
 * Removes a trailing "| Korean Hive" or "| Korean Hive BD".
 *
 * The catalogue sheet writes its own meta titles, usually ending in one of
 * those, and the root layout's title template appends " | Korean Hive" again.
 * Use this on any title that goes through the template.
 */
export function stripSiteSuffix(title: string) {
  return title
    .trim()
    .replace(new RegExp(`\\s*\\|\\s*${siteConfig.name}(\\s+BD)?\\s*$`, "i"), "");
}

/** The site name appended once, and only once, for an absolute title. */
export function withSiteSuffix(title: string) {
  return `${stripSiteSuffix(title)} | ${siteConfig.name}`;
}
