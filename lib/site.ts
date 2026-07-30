export const siteConfig = {
  name: "Korean Hive",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Shop 100% authentic Korean beauty and skincare in Bangladesh. Guest checkout, cash on delivery, fast nationwide shipping.",
  locale: "en_BD",
  currency: "BDT",
  country: "BD",
  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
  },
} as const;

/** Routes that must never be indexed: personal, transactional or noisy. */
export const NO_INDEX_PATHS = [
  "/cart",
  "/checkout",
  "/account",
  "/order/",
  "/wishlist",
  "/search",
  "/api/",
] as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
