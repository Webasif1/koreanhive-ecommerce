/**
 * The routine bundles shown on /combos.
 *
 * Members are referenced by product slug and validated against the live
 * catalogue by `npm run combos:sync`, which refuses to publish a combo whose
 * products are missing, unpublished, or priced at null. A bundle linking to
 * something a shopper cannot buy is worse than a bundle that is not there yet.
 *
 * `comparePrice` is deliberately absent: the sync computes it from the
 * members' real prices, so the "you save ৳X" figure on the page is arithmetic
 * against the live catalogue rather than a number typed once and left to drift.
 */

export type ComboSeed = {
  name: string;
  slug: string;
  /** What the bundle is for, shown under the name. */
  concern: string;
  description: string;
  /** Product slugs, in the order the routine is used. */
  productSlugs: string[];
  /**
   * What the bundle sells for, in whole taka.
   *
   * null blocks publication. This is a commercial decision, so nothing here
   * derives it from the members — a bundle that quietly invents its own
   * discount is a pricing bug waiting to happen.
   */
  price: number | null;
  position: number;
};

export const COMBOS: ComboSeed[] = [
  {
    name: "Skin Brightening Combo",
    slug: "skin-brightening-combo",
    concern: "Dullness and uneven tone",
    description:
      "A three-step routine for dull, uneven skin: rice water to cleanse, centella to calm and hydrate, and a relief cream to finish.",
    productSlugs: [
      "the-faceshop-face-shop-rice-water-bright-cleanser-150ml",
      "skin1004-madagascar-centella-hyalu-cica-first-ampoule-50ml",
      // not yet in the catalogue — add to the sheet, then re-sync
      "dr-althea-345-relief-cream",
    ],
    price: null,
    position: 0,
  },
  {
    name: "Skin Repairing Combo",
    slug: "skin-repairing-combo",
    concern: "A weakened moisture barrier",
    description:
      "এই কম্বোতে থাকছে হার্টলিফ টোনার, সেন্টেলা অ্যাম্পুল আর রিলিফ ক্রিম — সংবেদনশীল ত্বকের বাধা মেরামতের জন্য।",
    productSlugs: [
      "anua-heartleaf-77-percent-soothing-toner-500ml",
      "skin1004-madagascar-centella-hyalu-cica-first-ampoule-50ml",
      "dr-althea-345-relief-cream",
    ],
    price: null,
    position: 1,
  },
  {
    name: "Acne Prone Skin Combo",
    slug: "acne-prone-skin-combo",
    concern: "Acne-prone and breakout-prone skin",
    description:
      "Cleanse, treat and protect: a heartleaf cleansing foam, a niacinamide serum, and a light sun serum for daily protection.",
    productSlugs: [
      "anua-heartleaf-quercetinol-pore-deep-cleansing-foam-150ml",
      // not yet in the catalogue — add to the sheet, then re-sync
      "anua-niacinamide-10-txa-4-serum",
      "skin1004-madagascar-centella-hyalu-cica-water-fit-sun-serum-15ml",
    ],
    price: null,
    position: 2,
  },
];
