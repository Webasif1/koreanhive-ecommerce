/**
 * The routine bundles shown on /combos.
 *
 * Content comes from the client's "Korean Hive Combo Content" document: ten
 * bundles with their concern, product list, routine order, suitability note
 * and proposed price. Members are referenced by product slug and validated
 * against the live catalogue by `npm run combos:sync`, which refuses to
 * publish a combo whose products are missing, unpublished or priced at null.
 *
 * That refusal is the point, and it implements the document's own checklist:
 * "Confirm that every product and exact size exists" and "Mark out-of-stock
 * products clearly or pause the affected combo." A bundle linking to something
 * a shopper cannot buy is worse than a bundle that is not there yet.
 *
 * `comparePrice` is deliberately absent: the sync computes it from the
 * members' real prices, so the "you save ৳X" figure is arithmetic against the
 * live catalogue rather than a number typed once and left to drift. The
 * document asks for exactly this — "Calculate savings using Korean Hive prices
 * only" — which is why the design's own ৳560–৳1,010 savings are not copied
 * here. They were written against prices this shop does not charge.
 *
 * Slugs marked NOT IN CATALOGUE are the document's intended product, written
 * out so the sync names it in the blocker rather than the combo quietly
 * shipping without that step. Slugs marked DRAFT are in the catalogue but
 * unpublished for want of an image; the combo publishes on the next sync after
 * the photo lands. Every slug here was checked against the catalogue — two
 * combos read as blocked only because their slug was spelled differently from
 * the product's. Substituting a near-match was not an option: a
 * lotion is not a cream and a 15ml is not a 50ml, and both change what lands
 * on a customer's skin and what the bundle should cost.
 */

const IMAGE = "https://ik.imagekit.io/koreanhive/combo";

export type ComboStep = {
  /** Product slug, or the intended one if it is not stocked yet. */
  slug: string;
  /**
   * The product and size exactly as the client's document names it.
   *
   * A live combo lists the catalogue's own name. A combo that is not live yet
   * has nothing to read a name from — four of its products are not in the
   * catalogue at all — so the "Coming soon" card lists this instead.
   */
  name: string;
  /** What this step is doing, in a few words. */
  role: string;
  /**
   * The product in two or three words, for the home page strip.
   *
   * Not the catalogue name — "Cosrx Advanced Snail 92 All In One Cream Tube
   * 50g" four times over is a paragraph, and the home page card needs a line
   * a shopper can read at a glance: "Low-pH cleanser · Snail essence · Barrier
   * cream · Centella SPF50+".
   */
  short: string;
};

export type ComboSeed = {
  name: string;
  slug: string;
  /** What the bundle is for, shown under the name. */
  concern: string;
  /** Filter tab this combo belongs under. */
  tag: string;
  /**
   * The short label over the card image.
   *
   * Descriptive only. The design's "MOST POPULAR" and "HIGH DEMAND" are sales
   * claims nobody here can check, and this shop has no order history to back
   * them with — so these say what the routine is instead of how well it sells.
   */
  badge: string;
  description: string;
  /** Who the document says it suits. */
  bestFor: string;
  /**
   * The document's "Important suitability note", shown on the card.
   *
   * Not optional and not shortened. The checklist requires the retinol
   * pregnancy warning and the daytime-sunscreen instruction to stay visible,
   * and the rest are the same class of claim — the honest limits of what a
   * bundle of four bottles can do.
   */
  note: string;
  /** AM/PM order, from the document. */
  routine: string;
  imageUrl: string;
  imageAlt: string;
  /** Product slugs in routine order, with the role each plays. */
  steps: ComboStep[];
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

/** Product slugs, in the order the routine is used. */
export function comboProductSlugs(combo: ComboSeed) {
  return combo.steps.map((step) => step.slug);
}

export const COMBOS: ComboSeed[] = [
  {
    name: "Glass Skin Starter",
    slug: "glass-skin-starter",
    concern: "Hydration · Glow",
    tag: "Hydration",
    badge: "4-STEP ROUTINE",
    description:
      "Dull, thirsty-feeling skin? Build a simple hydration routine with a cleanser, snail essence, moisturizer and daily sun protection.",
    bestFor: "Normal-to-combination skin seeking a hydrated finish.",
    note: "Includes a 30ml trial essence. A glow-focused routine cannot guarantee poreless skin.",
    routine: "AM: Cleanse → essence → cream → sunscreen. PM: Cleanse → essence → cream.",
    imageUrl: `${IMAGE}/glass%20skin%20combo.webp`,
    imageAlt: "Glass Skin Starter combo — a softer, hydrated-looking finish",
    steps: [
      { slug: "cosrx-low-ph-good-morning-gel-cleanser-150ml", name: "COSRX Low pH Good Morning Gel Cleanser 150ml", role: "Cleanses without stripping", short: "Low-pH cleanser" },
      { slug: "cosrx-advanced-snail-96-mucin-power-essence-mini-30ml", name: "COSRX Advanced Snail 96 Mucin Essence 30ml mini", role: "The hydration workhorse", short: "Snail essence" },
      { slug: "cosrx-advanced-snail-92-all-in-one-cream-tube-50g", name: "COSRX Advanced Snail 92 All In One Cream 50g", role: "Seals everything in", short: "Barrier cream" },
      { slug: "iunik-centella-calming-daily-sunscreen-60ml", name: "iUNIK Centella Calming Daily Sunscreen 60ml", role: "Protects the result daily", short: "Centella SPF50+" },
    ],
    price: 3990,
    position: 0,
  },
  {
    name: "Breakout Basics",
    slug: "breakout-basics",
    concern: "Oiliness · Clogged pores",
    tag: "Acne",
    badge: "BEST FOR OILY SKIN",
    description:
      "When clogged pores and occasional pimples interrupt your routine, keep the essentials simple: cleanse, moisturize and protect.",
    bestFor: "Oily, non-reactive skin with mild breakouts.",
    note: "Introduce the salicylic cleanser gradually. Stop if drying or irritating. Persistent or painful acne needs individual treatment.",
    routine: "AM: Cleanse as tolerated → cream → sunscreen. PM: Cleanse → cream.",
    imageUrl: `${IMAGE}/Breakout%20basic.webp`,
    imageAlt: "Breakout Basics combo — keep your routine manageable",
    steps: [
      { slug: "cosrx-salicylic-acid-daily-gentle-cleanser-150ml", name: "COSRX Salicylic Acid Daily Gentle Cleanser 150ml", role: "Clears oil and sweat", short: "Salicylic cleanser" },
      { slug: "cosrx-advanced-snail-92-all-in-one-cream-tube-50g", name: "COSRX Advanced Snail 92 All In One Cream 50g", role: "Hydration without heaviness", short: "Barrier cream" },
      { slug: "iunik-centella-calming-daily-sunscreen-60ml", name: "iUNIK Centella Calming Daily Sunscreen 60ml", role: "Daily protection", short: "Centella SPF50+" },
    ],
    price: 3290,
    position: 1,
  },
  {
    name: "Campus Essentials",
    slug: "campus-essentials",
    concern: "Student budget · Everyday basics",
    tag: "Beginner",
    badge: "SMALLEST SPEND",
    description:
      "Classes, commutes and a limited budget. Start with cleansing, moisture and daily sunscreen, without paying for extra treatment steps.",
    bestFor: "University students with normal-to-oily, non-reactive skin.",
    note: "50ml mini cleanser; 50g moisturizer and 60ml sunscreen. Student is a budget category, not a skin type.",
    routine: "AM: Cleanse → cream → sunscreen. PM: Cleanse → cream.",
    imageUrl: `${IMAGE}/campus%20essential.webp`,
    imageAlt: "Campus Essentials combo — three essentials, a smaller spend",
    steps: [
      // The 50ml mini of the same cleanser as the other combos. The catalogue
      // slug drops the word "cleanser" ("COSRX Low pH Good Morning Gel 50ml") —
      // COSRX makes no other Good Morning Gel — which is why this combo read as
      // blocked. Its sheet description wrongly calls it a moisturiser; that is
      // a copy error in the sheet, not a different product.
      { slug: "cosrx-low-ph-good-morning-gel-50ml", name: "COSRX Low pH Good Morning Gel Cleanser 50ml mini", role: "Morning and night", short: "Low-pH cleanser mini" },
      { slug: "cosrx-advanced-snail-92-all-in-one-cream-tube-50g", name: "COSRX Advanced Snail 92 All In One Cream 50g", role: "Suits every skin type", short: "Barrier cream" },
      { slug: "iunik-centella-calming-daily-sunscreen-60ml", name: "iUNIK Centella Calming Daily Sunscreen 60ml", role: "The step that matters most", short: "Centella SPF50+" },
    ],
    price: 2890,
    position: 2,
  },
  {
    name: "Post-Acne Marks & Even Tone",
    slug: "post-acne-marks-even-tone",
    concern: "Brown marks · Uneven tone",
    tag: "Brightening",
    badge: "TARGETED AMPOULE",
    description:
      "The breakout has gone, but the mark remains. Pair one targeted ampoule with daily hydration and sun protection.",
    bestFor: "Brown marks after healed acne; uneven-looking tone.",
    note: "Marks fade gradually. This routine does not treat pitted scars or guarantee results for melasma.",
    routine: "AM: Cleanse → ampoule → cream → sunscreen. PM: Cleanse → ampoule → cream.",
    imageUrl: `${IMAGE}/post%20acne.webp`,
    imageAlt: "Post-Acne Marks combo — give uneven tone consistent care",
    steps: [
      { slug: "cosrx-low-ph-good-morning-gel-cleanser-150ml", name: "COSRX Low pH Good Morning Gel Cleanser 150ml", role: "Cleanses without stripping", short: "Low-pH cleanser" },
      { slug: "skin1004-madagascar-centella-tone-brightening-capsule-ampoule-30ml", name: "SKIN1004 Tone Brightening Capsule Ampoule 30ml mini", role: "Fades marks over 4–6 weeks", short: "Brightening ampoule" },
      { slug: "cosrx-advanced-snail-92-all-in-one-cream-tube-50g", name: "COSRX Advanced Snail 92 All In One Cream 50g", role: "Keeps the barrier comfortable", short: "Barrier cream" },
      { slug: "iunik-centella-calming-daily-sunscreen-60ml", name: "iUNIK Centella Calming Daily Sunscreen 60ml", role: "Protects the result daily", short: "Centella SPF50+" },
    ],
    price: 4190,
    position: 3,
  },
  {
    name: "Oily Skin Daily",
    slug: "oily-skin-daily",
    concern: "Light hydration · Daily care",
    tag: "Oily skin",
    badge: "LIGHTWEIGHT TEXTURES",
    description:
      "Skin feels greasy, but heavy creams feel uncomfortable? Keep moisture in the routine with a light gel texture and everyday protection.",
    bestFor: "Oily or combination skin without an active treatment need.",
    note: "A lightweight routine, not a guarantee of an all-day matte finish. The cleanser contains tea tree oil.",
    routine: "AM: Cleanse → gel cream → sunscreen. PM: Cleanse → gel cream.",
    imageUrl: `${IMAGE}/oily%20skin%20daily.webp`,
    imageAlt: "Oily Skin Daily combo — light layers for everyday comfort",
    steps: [
      { slug: "cosrx-low-ph-good-morning-gel-cleanser-150ml", name: "COSRX Low pH Good Morning Gel Cleanser 150ml", role: "Cleanses without stripping", short: "Low-pH cleanser" },
      // NOT IN CATALOGUE — the only Isntree product stocked is the Chestnut
      // AHA Clear Essence, which is an exfoliating essence, not a gel cream.
      { slug: "isntree-hyaluronic-acid-aqua-gel-cream-100ml", name: "Isntree Hyaluronic Acid Aqua Gel Cream 100ml", role: "Light hydration, no weight", short: "Aqua gel cream" },
      { slug: "iunik-centella-calming-daily-sunscreen-60ml", name: "iUNIK Centella Calming Daily Sunscreen 60ml", role: "Daily protection", short: "Centella SPF50+" },
    ],
    price: 3990,
    position: 4,
  },
  {
    name: "Dry Skin Comfort",
    slug: "dry-skin-comfort",
    concern: "Tightness · Dry patches",
    tag: "Dryness",
    badge: "RICHER MOISTURE",
    description:
      "If cleansing leaves your skin tight or makeup catches on dry patches, start with comfortable cleansing and richer moisture.",
    bestFor: "Dry or normal-to-dry skin needing a richer cream.",
    note: "Includes a 30ml trial moisturizer. Adjust cleansing frequency if your skin feels dry.",
    routine: "AM: Cleanse as needed → cream → sunscreen. PM: Cleanse → cream.",
    imageUrl: `${IMAGE}/Dry%20skin%20comfort.webp`,
    imageAlt: "Dry Skin Comfort combo — comfort starts with moisture",
    steps: [
      // DRAFT — NEEDS AN IMAGE. The cleanser is in the catalogue as "Green Plum
      // Refreshing Cleanser 100ml" but unpublished for want of a photo. Five of
      // these ten combos open with it, so its image unblocks the most combos.
      { slug: "beauty-of-joseon-green-plum-refreshing-cleanser-100ml", name: "Beauty of Joseon Green Plum Cleanser 100ml", role: "Non-foaming, no tightness", short: "Green plum cleanser" },
      // NOT IN CATALOGUE as a cream — the shop has AtoBarrier 365 *Lotion*
      // in 30ml and 150ml, which is a lighter texture at a different price.
      { slug: "aestura-atobarrier-365-cream-30ml", name: "Aestura AtoBarrier 365 Cream 30ml mini", role: "Rebuilds the skin barrier", short: "Ceramide cream" },
      // The catalogue slug carries "spf50", which is why this read as missing.
      { slug: "isntree-hyaluronic-acid-watery-sun-gel-spf50-50ml", name: "Isntree Hyaluronic Acid Watery Sun Gel 50ml", role: "Protection that does not dry", short: "Watery sun gel" },
    ],
    price: 3690,
    position: 5,
  },
  {
    name: "Everyday Sun Care",
    slug: "everyday-sun-care",
    concern: "Daytime protection · Simple steps",
    tag: "Sun care",
    badge: "SPF EVERY DAY",
    description:
      "A simple routine for mornings out and evenings at home. Cleanse, moisturize and make sunscreen a daily habit.",
    bestFor: "Normal-to-combination skin prioritizing daily sun care.",
    note: "For sweating or outdoor sport, choose a water-resistant sunscreen. Do not assume this sunscreen is sweat-proof.",
    routine: "AM: Cleanse → cream → sunscreen. PM: Cleanse → cream.",
    imageUrl: `${IMAGE}/Everyday%20sun%20care.webp`,
    imageAlt: "Everyday Sun Care combo — make protection part of your morning",
    steps: [
      // DRAFT — NEEDS AN IMAGE; see Dry Skin Comfort
      { slug: "beauty-of-joseon-green-plum-refreshing-cleanser-100ml", name: "Beauty of Joseon Green Plum Cleanser 100ml", role: "Gentle daily cleanse", short: "Green plum cleanser" },
      { slug: "cosrx-advanced-snail-92-all-in-one-cream-tube-50g", name: "COSRX Advanced Snail 92 All In One Cream 50g", role: "Moisture in one step", short: "Barrier cream" },
      { slug: "beauty-of-joseon-relief-sun-aqua-fresh-rice-plus-b5-spf50-pa-50ml", name: "Beauty of Joseon Relief Sun Aqua-Fresh Rice + B5 50ml", role: "The habit that matters most", short: "Relief Sun SPF50+" },
    ],
    price: 3690,
    position: 6,
  },
  {
    name: "Sensitive Skin Comfort",
    slug: "sensitive-skin-comfort",
    concern: "Gentle care · Barrier support",
    tag: "Sensitive",
    badge: "FRAGRANCE FREE",
    description:
      "When your skin feels easily unsettled, simplify. Focus on daily cleansing, moisturizing and sun protection before adding targeted treatments.",
    bestFor: "Dry-leaning, sensitive-feeling skin; subject to individual tolerance.",
    note: "Patch test each product. Persistent burning, redness or eczema needs assessment; no bundle is suitable for every sensitive skin type.",
    routine: "AM: Cleanse as needed → cream → sunscreen. PM: Cleanse → cream.",
    imageUrl: `${IMAGE}/sensitive%20skin12_54_02%20AM.webp`,
    imageAlt: "Sensitive Skin Comfort combo — a little less, thoughtfully chosen",
    steps: [
      // DRAFT — NEEDS AN IMAGE; see Dry Skin Comfort
      { slug: "beauty-of-joseon-green-plum-refreshing-cleanser-100ml", name: "Beauty of Joseon Green Plum Cleanser 100ml", role: "Non-foaming, no tightness", short: "Green plum cleanser" },
      // NOT IN CATALOGUE as a cream — see Dry Skin Comfort
      { slug: "aestura-atobarrier-365-cream-30ml", name: "Aestura AtoBarrier 365 Cream 30ml mini", role: "Barrier support", short: "Ceramide cream" },
      // DRAFT — NEEDS AN IMAGE. The 50ml is in the catalogue but unpublished
      // for want of a photo; the 15ml is live but is not this product.
      { slug: "skin1004-madagascar-centella-hyalu-cica-water-fit-sun-serum-50ml", name: "SKIN1004 Hyalu-Cica Water-Fit Sun Serum 50ml", role: "Light, fragrance-free SPF", short: "Water-fit sun serum" },
    ],
    price: 3590,
    position: 7,
  },
  {
    name: "Beginner Korean Skincare",
    slug: "beginner-korean-skincare",
    concern: "First routine · Three essentials",
    tag: "Beginner",
    badge: "START HERE",
    description:
      "New to Korean skincare? Start with three useful steps and learn what your skin likes before adding toners, acids or extra serums.",
    bestFor: "Adults building a basic routine for normal-to-combination skin.",
    note: "Introduce one product at a time. Being new to Korean skincare does not mean you need a ten-step routine.",
    routine: "AM: Cleanse → cream → sunscreen. PM: Cleanse → cream.",
    imageUrl: `${IMAGE}/Beginar%20skin%20care.%20Sep%2013,%202026,%2012_57_09%20AM.webp`,
    imageAlt: "Beginner Korean Skincare combo — your first three steps",
    steps: [
      // DRAFT — NEEDS AN IMAGE; see Dry Skin Comfort
      { slug: "beauty-of-joseon-green-plum-refreshing-cleanser-100ml", name: "Beauty of Joseon Green Plum Cleanser 100ml", role: "Morning and night", short: "Green plum cleanser" },
      { slug: "cosrx-advanced-snail-92-all-in-one-cream-tube-50g", name: "COSRX Advanced Snail 92 All In One Cream 50g", role: "Suits every skin type", short: "Barrier cream" },
      // DRAFT — NEEDS AN IMAGE; see Sensitive Skin Comfort
      { slug: "skin1004-madagascar-centella-hyalu-cica-water-fit-sun-serum-50ml", name: "SKIN1004 Hyalu-Cica Water-Fit Sun Serum 50ml", role: "The step that matters most", short: "Water-fit sun serum" },
    ],
    price: 3590,
    position: 8,
  },
  {
    name: "Anti-Ageing Night Routine",
    slug: "anti-ageing-night-routine",
    concern: "Fine lines · Uneven texture",
    tag: "Anti-ageing",
    badge: "NIGHT ONLY",
    description:
      "Ready for a considered next step? Pair a low-strength retinol with cleansing and rich moisture to support smoother-looking skin over time.",
    bestFor: "Adults with early fine lines who already use daytime sunscreen.",
    note: "Daytime sunscreen required; not included. Avoid during pregnancy or when trying to conceive. Ask your clinician when breastfeeding. Follow the product's storage instructions.",
    routine:
      "PM: Cleanse, let skin dry → small amount of retinol as directed → cream. Start two nights a week; increase only as tolerated. On other nights, cleanse and moisturize.",
    imageUrl: `${IMAGE}/anti%20agin%2013,%202026,%2001_01_51%20AM.webp`,
    imageAlt: "Anti-Ageing Night Routine combo — a thoughtful step into retinol",
    steps: [
      // DRAFT — NEEDS AN IMAGE; see Dry Skin Comfort
      { slug: "beauty-of-joseon-green-plum-refreshing-cleanser-100ml", name: "Beauty of Joseon Green Plum Cleanser 100ml", role: "Melts the day off", short: "Green plum cleanser" },
      // NOT IN CATALOGUE
      { slug: "cosrx-the-retinol-0-1-cream-20ml", name: "COSRX The Retinol 0.1 Cream 20ml", role: "Two nights a week to start", short: "Retinol 0.1 cream" },
      // NOT IN CATALOGUE as a cream — see Dry Skin Comfort
      { slug: "aestura-atobarrier-365-cream-30ml", name: "Aestura AtoBarrier 365 Cream 30ml mini", role: "Recovery while you sleep", short: "Ceramide cream" },
    ],
    price: 3990,
    position: 9,
  },
];

/**
 * The editorial seed for a combo, by slug.
 *
 * The database holds what a shopper buys — name, price, members. This holds
 * what the client's content document says about it: step roles, the
 * suitability note, the routine order, the badge and the image. Anything
 * rendering a combo needs both, so the lookup lives beside the data rather
 * than being rebuilt in each page.
 */
export const COMBO_BY_SLUG = new Map(COMBOS.map((combo) => [combo.slug, combo]));
