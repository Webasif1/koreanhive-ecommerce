import type { ProductKnowledge } from "@/lib/chatbot/types";

/**
 * The editorial layer of the advisor.
 *
 * Product stores what is volatile — price, stock, rating, images — and this
 * file stores what is judgement: who a product suits and what it is for.
 * Keyed by `slug`, which is unique in the schema and already the public URL,
 * so a rename in the admin cannot silently orphan an entry the way an _id
 * would.
 *
 * Two rules when editing:
 *
 *   1. Only write what the product's own copy supports. This file feeds
 *      shopper-facing recommendations; a guess here becomes a claim there.
 *   2. `avoidFor` is a hard exclusion, not a hint. A product listed against a
 *      skin type is never shown to that shopper, however well it scores.
 *
 * A product missing from this map is not excluded — it falls back to category
 * and text matching at a lower score. So the advisor works before this file is
 * complete, and sharpens as it fills in.
 */
export const PRODUCT_KNOWLEDGE: Record<string, ProductKnowledge> = {
  // ------------------------------------------------ Beauty of Joseon
  "beauty-of-joseon-relief-sun-rice-probiotics": {
    concerns: ["sun-protection"],
    skinTypes: ["dry", "normal", "combination", "sensitive"],
    useCases: ["daily-sun-care"],
    keyIngredients: ["rice extract", "probiotics", "niacinamide"],
    priority: 9,
  },
  "beauty-of-joseon-glow-serum-propolis-niacinamide": {
    concerns: ["dullness", "post-acne-marks", "dark-spots"],
    skinTypes: ["dry", "normal", "combination", "oily"],
    useCases: ["brightening", "soothing"],
    keyIngredients: ["propolis", "niacinamide"],
    cautions: ["Contains propolis, which is bee-derived."],
    priority: 8,
  },
  "beauty-of-joseon-ginseng-essence-water": {
    concerns: ["dryness", "dullness", "fine-lines"],
    skinTypes: ["dry", "normal", "combination"],
    useCases: ["daily-hydration", "anti-ageing"],
    keyIngredients: ["ginseng"],
  },
  "beauty-of-joseon-revive-eye-serum": {
    concerns: ["dark-circles", "fine-lines"],
    skinTypes: ["dry", "normal", "combination"],
    avoidFor: ["sensitive"],
    useCases: ["anti-ageing"],
    keyIngredients: ["ginseng", "retinal"],
    cautions: ["Contains retinal — start slowly and wear sunscreen daily."],
  },
  "beauty-of-joseon-green-plum-refreshing-cleanser": {
    concerns: ["oiliness", "uneven-texture"],
    skinTypes: ["oily", "combination", "normal"],
    useCases: ["gentle-cleansing"],
  },
  "beauty-of-joseon-glow-deep-serum-rice-arbutin": {
    concerns: ["dullness", "dark-spots", "post-acne-marks"],
    skinTypes: ["dry", "normal", "combination"],
    useCases: ["brightening"],
    keyIngredients: ["rice extract", "alpha arbutin"],
  },

  // ----------------------------------------------------------- COSRX
  "cosrx-advanced-snail-96-mucin-power-essence": {
    concerns: ["dryness", "dehydration", "post-acne-marks", "uneven-texture"],
    skinTypes: ["dry", "normal", "combination", "oily", "sensitive"],
    useCases: ["daily-hydration", "barrier-repair", "deep-repair"],
    keyIngredients: ["snail secretion filtrate"],
    cautions: ["Contains snail mucin."],
    priority: 9,
  },
  "cosrx-advanced-snail-92-all-in-one-cream": {
    concerns: ["dryness", "post-acne-marks"],
    skinTypes: ["dry", "normal", "combination"],
    useCases: ["daily-hydration", "barrier-repair"],
    keyIngredients: ["snail secretion filtrate"],
    cautions: ["Contains snail mucin."],
  },
  "cosrx-low-ph-good-morning-gel-cleanser": {
    concerns: ["acne", "oiliness", "sensitivity"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["gentle-cleansing"],
    priority: 8,
  },
  "cosrx-aha-bha-clarifying-treatment-toner": {
    concerns: ["acne", "uneven-texture", "large-pores"],
    skinTypes: ["oily", "combination", "normal"],
    avoidFor: ["sensitive"],
    useCases: ["exfoliation"],
    keyIngredients: ["AHA", "BHA"],
    cautions: [
      "Contains exfoliating acids — build up to daily use and wear sunscreen.",
    ],
  },
  "cosrx-acne-pimple-master-patch": {
    concerns: ["acne"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["spot-treatment"],
    priority: 9,
  },
  "cosrx-the-vitamin-c-23-serum": {
    concerns: ["dark-spots", "dullness", "post-acne-marks"],
    skinTypes: ["normal", "oily", "combination"],
    avoidFor: ["sensitive"],
    useCases: ["brightening"],
    keyIngredients: ["vitamin C"],
    cautions: ["A high-strength vitamin C — patch test before daily use."],
  },

  // ------------------------------------------------------------ Anua
  "anua-heartleaf-77-soothing-toner": {
    concerns: ["redness", "sensitivity", "acne", "large-pores"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["soothing", "daily-hydration"],
    keyIngredients: ["heartleaf"],
    priority: 9,
  },
  "anua-heartleaf-pore-control-cleansing-oil": {
    concerns: ["large-pores", "acne", "oiliness"],
    skinTypes: ["oily", "combination", "normal"],
    useCases: ["makeup-removal", "gentle-cleansing"],
    keyIngredients: ["heartleaf"],
    priority: 8,
  },
  "anua-peach-77-niacin-conditioning-essence": {
    concerns: ["dullness", "dryness", "dark-spots"],
    skinTypes: ["dry", "normal", "combination"],
    useCases: ["brightening", "daily-hydration"],
    keyIngredients: ["niacinamide", "peach extract"],
  },
  "anua-azelaic-acid-10-redness-soothing-serum": {
    concerns: ["redness", "acne", "post-acne-marks"],
    skinTypes: ["oily", "combination", "normal", "sensitive"],
    useCases: ["soothing", "spot-treatment"],
    keyIngredients: ["azelaic acid"],
    cautions: ["Contains 10% azelaic acid — introduce every other night first."],
  },

  // -------------------------------------------------------- SKIN1004
  "skin1004-madagascar-centella-ampoule": {
    concerns: ["sensitivity", "redness", "acne"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["soothing", "barrier-repair"],
    keyIngredients: ["centella asiatica"],
    priority: 9,
  },
  "skin1004-madagascar-centella-light-cleansing-oil": {
    concerns: ["sensitivity"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["makeup-removal", "gentle-cleansing"],
    keyIngredients: ["centella asiatica"],
  },
  "skin1004-hyalu-cica-water-fit-sun-serum": {
    concerns: ["sun-protection", "sensitivity", "dehydration"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["daily-sun-care", "soothing"],
    keyIngredients: ["centella asiatica", "hyaluronic acid"],
    priority: 8,
  },

  // ------------------------------------------------------ SOME BY MI
  "some-by-mi-aha-bha-pha-30-days-miracle-toner": {
    concerns: ["acne", "uneven-texture", "large-pores"],
    skinTypes: ["oily", "combination"],
    avoidFor: ["sensitive", "dry"],
    useCases: ["exfoliation"],
    keyIngredients: ["AHA", "BHA", "PHA", "tea tree"],
    cautions: [
      "Contains exfoliating acids — start two or three nights a week and wear sunscreen.",
    ],
  },
  "some-by-mi-30-days-miracle-acne-clear-foam": {
    concerns: ["acne", "oiliness"],
    skinTypes: ["oily", "combination"],
    avoidFor: ["dry", "sensitive"],
    useCases: ["gentle-cleansing", "oil-control"],
    keyIngredients: ["tea tree"],
  },
  "some-by-mi-snail-truecica-miracle-repair-serum": {
    concerns: ["post-acne-marks", "uneven-texture", "dryness"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["deep-repair", "barrier-repair"],
    keyIngredients: ["snail mucin", "centella asiatica"],
    cautions: ["Contains snail mucin."],
  },
  "some-by-mi-yuja-niacin-blemish-care-serum": {
    concerns: ["dark-spots", "dullness", "post-acne-marks"],
    skinTypes: ["normal", "oily", "combination"],
    useCases: ["brightening"],
    keyIngredients: ["niacinamide", "yuja"],
  },
  "some-by-mi-retinol-intense-triple-action-eye-cream": {
    concerns: ["fine-lines", "dark-circles"],
    skinTypes: ["dry", "normal", "combination"],
    avoidFor: ["sensitive"],
    useCases: ["anti-ageing"],
    keyIngredients: ["retinol"],
    cautions: ["Contains retinol — night use only, with sunscreen the next day."],
  },

  // -------------------------------------------------------- Torriden
  "torriden-dive-in-low-molecular-hyaluronic-acid-serum": {
    concerns: ["dehydration", "dryness", "sensitivity"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["daily-hydration", "soothing"],
    keyIngredients: ["hyaluronic acid"],
    priority: 9,
  },
  "torriden-dive-in-soothing-cream": {
    concerns: ["dehydration", "sensitivity", "redness"],
    skinTypes: ["oily", "combination", "normal", "sensitive"],
    useCases: ["daily-hydration", "soothing"],
    keyIngredients: ["hyaluronic acid"],
  },
  "torriden-solid-in-ceramide-cream": {
    concerns: ["dryness", "sensitivity"],
    skinTypes: ["dry", "normal", "sensitive"],
    useCases: ["barrier-repair", "daily-hydration"],
    keyIngredients: ["ceramides"],
    priority: 8,
  },

  // ------------------------------------------------------- Round Lab
  "round-lab-1025-dokdo-toner": {
    concerns: ["sensitivity", "dehydration", "uneven-texture"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["daily-hydration", "soothing"],
    priority: 8,
  },
  "round-lab-birch-juice-moisturizing-sunscreen": {
    concerns: ["sun-protection", "dryness"],
    skinTypes: ["dry", "normal", "combination", "sensitive"],
    useCases: ["daily-sun-care"],
    keyIngredients: ["birch sap"],
  },
  "round-lab-1025-dokdo-cleanser": {
    concerns: ["sensitivity"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["gentle-cleansing"],
  },

  // --------------------------------------------------------- Isntree
  "isntree-hyaluronic-acid-water-essence": {
    concerns: ["dehydration", "dryness"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["daily-hydration"],
    keyIngredients: ["hyaluronic acid"],
  },
  "isntree-hyaluronic-acid-airy-sun-stick": {
    concerns: ["sun-protection"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["daily-sun-care"],
    keyIngredients: ["hyaluronic acid"],
  },

  // ---------------------------------------------------- Pyunkang Yul
  "pyunkang-yul-essence-toner": {
    concerns: ["dryness", "sensitivity"],
    skinTypes: ["dry", "normal", "sensitive"],
    useCases: ["daily-hydration", "barrier-repair"],
    priority: 8,
  },
  "pyunkang-yul-moisture-ampoule": {
    concerns: ["dryness", "dehydration"],
    skinTypes: ["dry", "normal", "sensitive"],
    useCases: ["daily-hydration", "barrier-repair"],
  },
  "pyunkang-yul-black-tea-time-reverse-eye-cream": {
    concerns: ["fine-lines", "dark-circles", "dryness"],
    skinTypes: ["dry", "normal", "combination", "sensitive"],
    useCases: ["anti-ageing"],
  },

  // -------------------------------------------------------- Medicube
  "medicube-zero-pore-pad-2": {
    concerns: ["large-pores", "oiliness", "uneven-texture"],
    skinTypes: ["oily", "combination"],
    avoidFor: ["dry", "sensitive"],
    useCases: ["exfoliation", "oil-control"],
    cautions: ["Exfoliating pads — two or three times a week is plenty."],
  },
  "medicube-collagen-night-wrapping-mask": {
    concerns: ["fine-lines", "dryness", "dullness"],
    skinTypes: ["dry", "normal", "combination"],
    useCases: ["anti-ageing", "daily-hydration"],
    keyIngredients: ["collagen"],
  },
  "medicube-deep-vita-c-ampoule": {
    concerns: ["dark-spots", "dullness"],
    skinTypes: ["normal", "oily", "combination"],
    avoidFor: ["sensitive"],
    useCases: ["brightening"],
    keyIngredients: ["vitamin C"],
    cautions: ["A high-strength vitamin C — patch test before daily use."],
  },

  // -------------------------------------------------------- Mediheal
  "mediheal-tea-tree-care-solution-essential-mask": {
    concerns: ["acne", "redness"],
    skinTypes: ["oily", "combination", "normal"],
    useCases: ["soothing", "spot-treatment"],
    keyIngredients: ["tea tree"],
  },
  "mediheal-madecassoside-blemish-pad": {
    concerns: ["redness", "sensitivity", "acne"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["soothing"],
    keyIngredients: ["madecassoside"],
  },

  // ------------------------------------------------------- Innisfree
  "innisfree-green-tea-seed-hyaluronic-serum": {
    concerns: ["dehydration", "dryness"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["daily-hydration"],
    keyIngredients: ["green tea", "hyaluronic acid"],
  },
  "innisfree-volcanic-pore-clay-mask": {
    concerns: ["large-pores", "oiliness"],
    skinTypes: ["oily", "combination"],
    avoidFor: ["dry", "sensitive"],
    useCases: ["oil-control"],
    keyIngredients: ["volcanic clay"],
  },
  "innisfree-no-sebum-mineral-powder": {
    concerns: ["oiliness"],
    skinTypes: ["oily", "combination"],
    useCases: ["oil-control", "makeup"],
  },

  // ------------------------------------------------- makeup (rom&nd, peripera)
  "romand-juicy-lasting-tint": {
    concerns: [],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["makeup"],
    priority: 8,
  },
  "romand-better-than-palette": {
    concerns: [],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["makeup"],
  },
  "peripera-ink-velvet-tint": {
    concerns: [],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["makeup"],
  },
  "peripera-ink-airy-velvet": {
    concerns: [],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["makeup"],
  },

  // ------------------------------------------------------- Banila Co
  "banila-co-clean-it-zero-cleansing-balm": {
    concerns: [],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["makeup-removal", "gentle-cleansing"],
    priority: 9,
  },

  // ----------------------------------------------------------- iUNIK
  "iunik-centella-calming-gel-cream": {
    concerns: ["sensitivity", "redness", "acne"],
    skinTypes: ["oily", "combination", "normal", "sensitive"],
    useCases: ["soothing", "daily-hydration"],
    keyIngredients: ["centella asiatica"],
  },
  "iunik-centella-toner": {
    concerns: ["sensitivity", "redness"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["soothing"],
    keyIngredients: ["centella asiatica"],
  },
  "iunik-centella-bubble-serum": {
    concerns: ["sensitivity", "redness", "acne"],
    skinTypes: ["dry", "oily", "combination", "normal", "sensitive"],
    useCases: ["soothing"],
    keyIngredients: ["centella asiatica"],
  },
};
