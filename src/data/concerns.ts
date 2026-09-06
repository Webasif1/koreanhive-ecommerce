/**
 * The six skin concerns, shown on the home page and on /concerns.
 *
 * One list rather than two. It used to be declared separately in both pages,
 * which is why a stale category slug had to be repaired twice — every href
 * here pointed at a demo category that no longer existed, and each page had to
 * be found and fixed on its own.
 *
 * Two lengths of copy because the two surfaces genuinely differ: the home page
 * shows a compact grid where a full sentence wraps badly, while /concerns has
 * room to explain. Keeping both here is what let the lists merge without
 * flattening one page's wording into the other's.
 *
 * `href` must point at a real category slug. The catalogue's slugs come from
 * the sheet's Category column via `npm run catalogue:sync`.
 */

export type Concern = {
  label: string;
  /** Compact line for the home page grid. */
  copy: string;
  /** Fuller line for the dedicated /concerns page. */
  detail: string;
  href: string;
  image: string;
};

/** Served from ImageKit, like the product shots and the hero. The `&` in the
 *  acne filename is literal on purpose — percent-encoding it 404s. */
const IMAGE_BASE = "https://ik.imagekit.io/koreanhive/Category";

export const CONCERNS: Concern[] = [
  {
    label: "Acne & breakouts",
    copy: "Calm active spots without stripping",
    detail: "Calm active spots without stripping the barrier.",
    href: "/category/ampoule",
    image: `${IMAGE_BASE}/acne&care.webp`,
  },
  {
    label: "Dark spots",
    copy: "Fade post-acne marks and uneven tone",
    detail: "Fade post-acne marks and uneven tone over 4–6 weeks.",
    href: "/category/serum",
    image: `${IMAGE_BASE}/Darkspot.webp`,
  },
  {
    label: "Dryness",
    copy: "Layerable hydration that holds all day",
    detail: "Layerable hydration that holds through the day.",
    href: "/category/moisturizer",
    image: `${IMAGE_BASE}/Dryness-C.webp`,
  },
  {
    label: "Oily skin",
    copy: "Control shine in Dhaka humidity",
    detail: "Control shine without the tight, squeaky feeling.",
    href: "/category/cleanser",
    image: `${IMAGE_BASE}/oily-Skin.webp`,
  },
  {
    label: "Sun protection",
    copy: "Daily SPF that never leaves a cast",
    detail: "Daily SPF that never leaves a white cast.",
    href: "/category/sunscreen",
    image: `${IMAGE_BASE}/Sun_Protection.webp`,
  },
  {
    label: "Sensitive skin",
    copy: "Short ingredient lists, no fragrance",
    detail: "Short ingredient lists, no fragrance, no sting.",
    href: "/category/toner",
    image: `${IMAGE_BASE}/Sensitive-Skin.webp`,
  },
];
