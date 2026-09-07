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
 * Each tile used to link at a *category* — "Acne & breakouts" went to
 * /category/ampoule, "Sensitive skin" to /category/toner — because there was
 * no way to filter by concern. That answered "what format is this product"
 * when the shopper asked "what will fix my skin", which is the opposite of
 * what the page promises. Every product carries a `concerns[]` array from the
 * sheet and there is an index on it, so the tiles now resolve through
 * /concern/<slug> against that data.
 */

import type { Concern as TaxonomyConcern } from "@/data/chatbot/taxonomy";

export type Concern = {
  /** URL segment: /concern/<slug> */
  slug: string;
  label: string;
  /** Compact line for the home page grid. */
  copy: string;
  /** Fuller line for the dedicated /concerns page. */
  detail: string;
  href: string;
  image: string;
  /** Taxonomy values a product must carry to appear under this tile. */
  taxonomy: TaxonomyConcern[];
  /** Meta description for the concern listing. */
  metaDescription: string;
};

/** Served from ImageKit, like the product shots and the hero. The `&` in the
 *  acne filename is literal on purpose — percent-encoding it 404s. */
const IMAGE_BASE = "https://ik.imagekit.io/koreanhive/Category";

export const CONCERNS: Concern[] = [
  {
    slug: "acne-breakouts",
    label: "Acne & breakouts",
    copy: "Calm active spots without stripping",
    detail: "Calm active spots without stripping the barrier.",
    href: "/concern/acne-breakouts",
    image: `${IMAGE_BASE}/acne&care.webp`,
    taxonomy: ["acne", "large-pores"],
    metaDescription:
      "Korean skincare for acne and breakouts — cleansers, toners, serums and spot treatments that calm active spots without stripping your barrier. Cash on delivery across Bangladesh.",
  },
  {
    slug: "dark-spots",
    label: "Dark spots",
    copy: "Fade post-acne marks and uneven tone",
    detail: "Fade post-acne marks and uneven tone over 4–6 weeks.",
    href: "/concern/dark-spots",
    image: `${IMAGE_BASE}/Darkspot.webp`,
    taxonomy: ["dark-spots", "post-acne-marks", "dullness"],
    metaDescription:
      "Korean skincare for dark spots and post-acne marks — niacinamide, vitamin C and glutathione formulas that even out tone. Cash on delivery across Bangladesh.",
  },
  {
    slug: "dryness",
    label: "Dryness",
    copy: "Layerable hydration that holds all day",
    detail: "Layerable hydration that holds through the day.",
    href: "/concern/dryness",
    image: `${IMAGE_BASE}/Dryness-C.webp`,
    taxonomy: ["dryness", "dehydration"],
    metaDescription:
      "Korean skincare for dry and dehydrated skin — hyaluronic acid, ceramide and panthenol layers that hold hydration all day. Cash on delivery across Bangladesh.",
  },
  {
    slug: "oily-skin",
    label: "Oily skin",
    copy: "Control shine in Dhaka humidity",
    detail: "Control shine without the tight, squeaky feeling.",
    href: "/concern/oily-skin",
    image: `${IMAGE_BASE}/oily-Skin.webp`,
    taxonomy: ["oiliness", "large-pores"],
    metaDescription:
      "Korean skincare for oily skin and large pores — lightweight, non-stripping formulas built for Dhaka humidity. Cash on delivery across Bangladesh.",
  },
  {
    slug: "sun-protection",
    label: "Sun protection",
    copy: "Daily SPF that never leaves a cast",
    detail: "Daily SPF that never leaves a white cast.",
    href: "/concern/sun-protection",
    image: `${IMAGE_BASE}/Sun_Protection.webp`,
    taxonomy: ["sun-protection"],
    metaDescription:
      "Korean sunscreen for daily use — SPF50+ PA++++ formulas with no white cast, suited to Bangladesh sun. Cash on delivery nationwide.",
  },
  {
    slug: "sensitive-skin",
    label: "Sensitive skin",
    copy: "Short ingredient lists, no fragrance",
    detail: "Short ingredient lists, no fragrance, no sting.",
    href: "/concern/sensitive-skin",
    image: `${IMAGE_BASE}/Sensitive-Skin.webp`,
    taxonomy: ["sensitivity", "redness"],
    metaDescription:
      "Korean skincare for sensitive and easily irritated skin — centella, mugwort and fragrance-free barrier care. Cash on delivery across Bangladesh.",
  },
];

/** Lookup for the /concern/[slug] route and the sitemap. */
export function findConcern(slug: string) {
  return CONCERNS.find((concern) => concern.slug === slug) ?? null;
}
