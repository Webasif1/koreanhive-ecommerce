/**
 * Catalogue seed.
 *
 * DESTRUCTIVE: brands, categories and products are deleted and rebuilt on
 * every run, so edits made in the admin product form are lost. Orders,
 * users, coupons, delivery zones and banners are left alone — order items
 * keep their own name/price snapshot, so removing a product never rewrites
 * what a customer was charged.
 *
 * Product names, brands and prices are real. All copy below is written for
 * this shop.
 */
import "dotenv/config";

import mongoose from "mongoose";

import {
  Brand,
  Category,
  Coupon,
  DeliveryZone,
  Product,
} from "../server/models";

// Local artwork shipped with the design, served from public/. Swap these for
// an ImageKit endpoint when the account is ready — ik.imagekit.io is already
// allowed in next.config.ts.
const PRODUCT_IMAGES = 8;
const CATEGORY_IMAGES = 6;

/** Product shots cycle through the eight supplied renders. */
const productImg = (index: number, offset = 0) =>
  `/products/p${((index + offset) % PRODUCT_IMAGES) + 1}.png`;

const categoryImg = (index: number) =>
  `/categories/cat${(index % CATEGORY_IMAGES) + 1}.png`;

type VariantSeed = {
  name: string;
  price?: number;
  stock: number;
  isDefault?: boolean;
};

type ProductSeed = {
  name: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  comparePrice?: number;
  stock: number;
  isFeatured?: boolean;
  shortDescription: string;
  ingredients: string;
  howToUse: string;
  variants: VariantSeed[];
};

const BRANDS = [
  {
    name: "Beauty of Joseon",
    slug: "beauty-of-joseon",
    description:
      "Hanbang skincare pairing traditional Korean herbal ingredients with light, modern textures.",
  },
  {
    name: "COSRX",
    slug: "cosrx",
    description:
      "Short ingredient lists built around a single hero active per product.",
  },
  {
    name: "Anua",
    slug: "anua",
    description:
      "Barrier-first skincare centred on heartleaf, peach and rice extracts.",
  },
  {
    name: "SKIN1004",
    slug: "skin1004",
    description:
      "Centella asiatica from Madagascar, formulated for sensitive and reactive skin.",
  },
  {
    name: "Some By Mi",
    slug: "some-by-mi",
    description:
      "Acid-led routines aimed at congestion, texture and post-acne marks.",
  },
  {
    name: "Torriden",
    slug: "torriden",
    description:
      "Low-molecular hyaluronic acid and ceramides in fragrance-free formulas.",
  },
  {
    name: "Round Lab",
    slug: "round-lab",
    description:
      "Mineral-rich Korean sourced ingredients in gentle, everyday basics.",
  },
  {
    name: "Isntree",
    slug: "isntree",
    description:
      "Hydration specialists, best known for layered hyaluronic acid and sunscreens.",
  },
  {
    name: "Pyunkang Yul",
    slug: "pyunkang-yul",
    description:
      "Minimal formulas from a Korean herbal medicine clinic — very short ingredient lists.",
  },
  {
    name: "Medicube",
    slug: "medicube",
    description:
      "Clinical-leaning treatments for pores, tone and overnight repair.",
  },
  {
    name: "Mediheal",
    slug: "mediheal",
    description: "Korea's best-known sheet mask and toner pad house.",
  },
  {
    name: "Innisfree",
    slug: "innisfree",
    description:
      "Jeju-sourced botanicals — green tea, volcanic clay and cica.",
  },
  {
    name: "rom&nd",
    slug: "romand",
    description:
      "Colour cosmetics with cult-status tints and everyday-wearable palettes.",
  },
  {
    name: "Peripera",
    slug: "peripera",
    description: "Playful, long-wearing lip tints in a huge shade range.",
  },
  {
    name: "Banila Co",
    slug: "banila-co",
    description:
      "Cleansing balm specialists — the first step of a double cleanse.",
  },
];

const CATEGORIES = [
  { name: "Cleansers", slug: "cleansers" },
  { name: "Makeup Removers", slug: "makeup-removers" },
  { name: "Toners & Essences", slug: "toners-essences" },
  { name: "Face Ampoules & Serums", slug: "face-ampoules" },
  { name: "Moisturisers", slug: "moisturisers" },
  { name: "Eye Creams", slug: "eye-creams" },
  { name: "Brightening", slug: "brightening" },
  { name: "Sunscreen", slug: "sunscreen" },
  { name: "Masks & Patches", slug: "masks-patches" },
  { name: "Cosmetics", slug: "cosmetics" },
];

const PRODUCTS: ProductSeed[] = [
  // ------------------------------------------------ Beauty of Joseon
  {
    name: "Relief Sun: Rice + Probiotics SPF50+ PA++++",
    slug: "beauty-of-joseon-relief-sun-rice-probiotics",
    brand: "beauty-of-joseon",
    category: "sunscreen",
    price: 1450,
    comparePrice: 1700,
    stock: 60,
    isFeatured: true,
    shortDescription:
      "A dewy organic sunscreen that sinks in without a white cast — the one people repurchase.",
    ingredients: "Rice extract, probiotics complex, niacinamide, glycerin.",
    howToUse:
      "Last step of your morning routine. Apply evenly to face and neck, and top up every few hours outdoors.",
    variants: [{ name: "50ml", stock: 60, isDefault: true }],
  },
  {
    name: "Glow Serum: Propolis + Niacinamide",
    slug: "beauty-of-joseon-glow-serum-propolis-niacinamide",
    brand: "beauty-of-joseon",
    category: "face-ampoules",
    price: 1350,
    stock: 40,
    isFeatured: true,
    shortDescription:
      "Propolis and 2% niacinamide for a calmer, glassier finish on dull skin.",
    ingredients: "Propolis extract, niacinamide 2%, panthenol, allantoin.",
    howToUse: "Press 2–3 drops into damp skin after toner, then moisturise.",
    variants: [{ name: "30ml", stock: 40, isDefault: true }],
  },
  {
    name: "Ginseng Essence Water",
    slug: "beauty-of-joseon-ginseng-essence-water",
    brand: "beauty-of-joseon",
    category: "toners-essences",
    price: 1650,
    stock: 35,
    shortDescription:
      "A watery first essence with ginseng root for tired, thirsty skin.",
    ingredients: "Ginseng root water, glycerin, panthenol, sodium hyaluronate.",
    howToUse: "After cleansing, pat over the face until it disappears.",
    variants: [{ name: "150ml", stock: 35, isDefault: true }],
  },
  {
    name: "Revive Eye Serum: Ginseng + Retinal",
    slug: "beauty-of-joseon-revive-eye-serum",
    brand: "beauty-of-joseon",
    category: "eye-creams",
    price: 1550,
    stock: 28,
    shortDescription:
      "A gentle retinal eye serum for fine lines, without the usual sting.",
    ingredients: "Ginseng root extract, retinal, squalane, sodium hyaluronate.",
    howToUse:
      "Pat a rice-grain amount around the eye at night. Start twice weekly and build up.",
    variants: [{ name: "30ml", stock: 28, isDefault: true }],
  },
  {
    name: "Green Plum Refreshing Cleanser",
    slug: "beauty-of-joseon-green-plum-refreshing-cleanser",
    brand: "beauty-of-joseon",
    category: "cleansers",
    price: 1150,
    stock: 32,
    shortDescription:
      "A low-pH gel wash that suits humid Dhaka weather and never feels tight.",
    ingredients: "Green plum water, coco-betaine, glycerin, citric acid.",
    howToUse: "Massage over damp skin morning and night, then rinse well.",
    variants: [{ name: "100ml", stock: 32, isDefault: true }],
  },
  {
    name: "Glow Deep Serum: Rice + Alpha Arbutin",
    slug: "beauty-of-joseon-glow-deep-serum-rice-arbutin",
    brand: "beauty-of-joseon",
    category: "brightening",
    price: 1450,
    stock: 30,
    shortDescription:
      "Rice extract with alpha arbutin for uneven tone and leftover dark spots.",
    ingredients: "Rice extract, alpha arbutin, niacinamide, glycerin.",
    howToUse: "Apply after toner, morning and night. Use sunscreen daily.",
    variants: [{ name: "30ml", stock: 30, isDefault: true }],
  },

  // ------------------------------------------------------------ COSRX
  {
    name: "Advanced Snail 96 Mucin Power Essence",
    slug: "cosrx-advanced-snail-96-mucin-power-essence",
    brand: "cosrx",
    category: "toners-essences",
    price: 1750,
    comparePrice: 2000,
    stock: 55,
    isFeatured: true,
    shortDescription:
      "96% snail secretion filtrate for bounce, repair and long-lasting hydration.",
    ingredients: "Snail secretion filtrate 96%, betaine, sodium hyaluronate.",
    howToUse:
      "Apply to cleansed skin before heavier creams, morning and night.",
    variants: [
      { name: "100ml", stock: 40, isDefault: true },
      { name: "20ml Travel", price: 550, stock: 15 },
    ],
  },
  {
    name: "Advanced Snail 92 All In One Cream",
    slug: "cosrx-advanced-snail-92-all-in-one-cream",
    brand: "cosrx",
    category: "moisturisers",
    price: 1650,
    comparePrice: 1900,
    stock: 34,
    isFeatured: true,
    shortDescription:
      "A bouncy gel-cream that seals in hydration without any greasy film.",
    ingredients:
      "Snail secretion filtrate 92%, betaine, sodium hyaluronate, panthenol.",
    howToUse: "Final step of your routine, morning and night.",
    variants: [{ name: "100ml", stock: 34, isDefault: true }],
  },
  {
    name: "Low pH Good Morning Gel Cleanser",
    slug: "cosrx-low-ph-good-morning-gel-cleanser",
    brand: "cosrx",
    category: "cleansers",
    price: 950,
    stock: 48,
    shortDescription:
      "A mildly acidic morning gel that respects the skin barrier.",
    ingredients: "Tea tree leaf oil, BHA, cocamidopropyl betaine.",
    howToUse: "Lather with water, massage over damp skin, rinse thoroughly.",
    variants: [{ name: "150ml", stock: 48, isDefault: true }],
  },
  {
    name: "AHA/BHA Clarifying Treatment Toner",
    slug: "cosrx-aha-bha-clarifying-treatment-toner",
    brand: "cosrx",
    category: "toners-essences",
    price: 1250,
    stock: 30,
    shortDescription: "A daily exfoliating toner for congested, bumpy skin.",
    ingredients: "Willow bark water, apple water, salicylic acid, glycolic acid.",
    howToUse:
      "Sweep over clean skin with a cotton pad. Wear sunscreen the next morning.",
    variants: [{ name: "150ml", stock: 30, isDefault: true }],
  },
  {
    name: "Acne Pimple Master Patch",
    slug: "cosrx-acne-pimple-master-patch",
    brand: "cosrx",
    category: "masks-patches",
    price: 450,
    stock: 90,
    shortDescription:
      "24 hydrocolloid patches in three sizes that flatten a spot overnight.",
    ingredients: "Hydrocolloid, cellulose gum, styrene isoprene copolymer.",
    howToUse:
      "Press onto a clean, dry spot before bed. Peel off once it turns white.",
    variants: [
      { name: "24 patches", stock: 65, isDefault: true },
      { name: "3-pack (72 patches)", price: 1200, stock: 25 },
    ],
  },
  {
    name: "The Vitamin C 23 Serum",
    slug: "cosrx-the-vitamin-c-23-serum",
    brand: "cosrx",
    category: "brightening",
    price: 1850,
    stock: 26,
    shortDescription:
      "A high-strength 23% vitamin C serum for stubborn marks. Not a beginner step.",
    ingredients: "Ascorbic acid 23%, hyaluronic acid, panthenol.",
    howToUse:
      "Apply at night on dry skin, wait, then moisturise. Patch test first.",
    variants: [{ name: "20ml", stock: 26, isDefault: true }],
  },

  // ------------------------------------------------------------- Anua
  {
    name: "Heartleaf 77% Soothing Toner",
    slug: "anua-heartleaf-77-soothing-toner",
    brand: "anua",
    category: "toners-essences",
    price: 1550,
    stock: 50,
    isFeatured: true,
    shortDescription:
      "77% heartleaf to calm redness and take the heat out of reactive skin.",
    ingredients: "Houttuynia cordata extract 77%, panthenol, allantoin.",
    howToUse:
      "Soak a cotton pad and sweep across the face, or pat in with clean hands.",
    variants: [{ name: "250ml", stock: 50, isDefault: true }],
  },
  {
    name: "Heartleaf Pore Control Cleansing Oil",
    slug: "anua-heartleaf-pore-control-cleansing-oil",
    brand: "anua",
    category: "makeup-removers",
    price: 1850,
    stock: 38,
    isFeatured: true,
    shortDescription:
      "Melts sunscreen and sebum in one pass without stripping the skin.",
    ingredients:
      "Houttuynia cordata extract, polyglyceryl-10 oleate, salicylic acid.",
    howToUse:
      "Massage onto dry skin, emulsify with water, then follow with a water-based cleanser.",
    variants: [{ name: "200ml", stock: 38, isDefault: true }],
  },
  {
    name: "Peach 77 Niacin Conditioning Essence",
    slug: "anua-peach-77-niacin-conditioning-essence",
    brand: "anua",
    category: "toners-essences",
    price: 1750,
    stock: 30,
    shortDescription:
      "Peach extract and niacinamide to even out tone and soften texture.",
    ingredients: "Peach extract 77%, niacinamide, panthenol, allantoin.",
    howToUse: "Apply after toner, before heavier creams.",
    variants: [{ name: "150ml", stock: 30, isDefault: true }],
  },
  {
    name: "Azelaic Acid 10 Redness Soothing Serum",
    slug: "anua-azelaic-acid-10-redness-soothing-serum",
    brand: "anua",
    category: "face-ampoules",
    price: 1950,
    stock: 22,
    shortDescription:
      "10% azelaic acid for persistent redness, bumps and post-acne marks.",
    ingredients: "Azelaic acid 10%, hyaluronic acid, centella asiatica extract.",
    howToUse:
      "Thin layer at night. Introduce slowly if your skin runs reactive.",
    variants: [{ name: "30ml", stock: 22, isDefault: true }],
  },

  // --------------------------------------------------------- SKIN1004
  {
    name: "Madagascar Centella Ampoule",
    slug: "skin1004-madagascar-centella-ampoule",
    brand: "skin1004",
    category: "face-ampoules",
    price: 1450,
    stock: 44,
    isFeatured: true,
    shortDescription:
      "A single-ingredient centella ampoule — about as gentle as an active gets.",
    ingredients: "Centella asiatica extract 100%.",
    howToUse:
      "Apply to damp skin after cleansing. Layer freely when skin is irritated.",
    variants: [
      { name: "55ml", stock: 30, isDefault: true },
      { name: "100ml", price: 2250, stock: 14 },
    ],
  },
  {
    name: "Madagascar Centella Light Cleansing Oil",
    slug: "skin1004-madagascar-centella-light-cleansing-oil",
    brand: "skin1004",
    category: "makeup-removers",
    price: 1650,
    stock: 26,
    shortDescription:
      "A light first cleanse that rinses clean and leaves no slippery residue.",
    ingredients: "Centella asiatica extract, sunflower seed oil, jojoba oil.",
    howToUse: "Massage onto dry skin, emulsify, rinse, then cleanse again.",
    variants: [{ name: "200ml", stock: 26, isDefault: true }],
  },
  {
    name: "Madagascar Centella Hyalu-Cica Water-Fit Sun Serum SPF50+",
    slug: "skin1004-hyalu-cica-water-fit-sun-serum",
    brand: "skin1004",
    category: "sunscreen",
    price: 1550,
    stock: 40,
    shortDescription:
      "A watery sunscreen that behaves like a serum — good under makeup.",
    ingredients: "Centella asiatica extract, hyaluronic acid, UV filters.",
    howToUse: "Apply generously each morning as the final skincare step.",
    variants: [{ name: "50ml", stock: 40, isDefault: true }],
  },

  // -------------------------------------------------------- Some By Mi
  {
    name: "AHA BHA PHA 30 Days Miracle Toner",
    slug: "some-by-mi-aha-bha-pha-30-days-miracle-toner",
    brand: "some-by-mi",
    category: "toners-essences",
    price: 1450,
    stock: 36,
    shortDescription:
      "A three-acid toner for congestion and rough texture, used a few nights a week.",
    ingredients: "Lactic acid, salicylic acid, gluconolactone, tea tree water.",
    howToUse: "Apply with a cotton pad at night. Follow with sunscreen by day.",
    variants: [{ name: "150ml", stock: 36, isDefault: true }],
  },
  {
    name: "AHA BHA PHA 30 Days Miracle Acne Clear Foam",
    slug: "some-by-mi-30-days-miracle-acne-clear-foam",
    brand: "some-by-mi",
    category: "cleansers",
    price: 1050,
    stock: 30,
    shortDescription: "A tea tree foam aimed at breakout-prone, oily skin.",
    ingredients: "Tea tree leaf water, salicylic acid, centella asiatica.",
    howToUse: "Lather and massage for 30 seconds, then rinse.",
    variants: [{ name: "100ml", stock: 30, isDefault: true }],
  },
  {
    name: "Snail Truecica Miracle Repair Serum",
    slug: "some-by-mi-snail-truecica-miracle-repair-serum",
    brand: "some-by-mi",
    category: "face-ampoules",
    price: 1950,
    stock: 24,
    shortDescription:
      "Snail mucin and cica for post-acne marks and a compromised barrier.",
    ingredients: "Snail mucin, truecica, niacinamide, madecassoside.",
    howToUse: "Apply after toner, morning and night.",
    variants: [{ name: "50ml", stock: 24, isDefault: true }],
  },
  {
    name: "Yuja Niacin 30 Days Blemish Care Serum",
    slug: "some-by-mi-yuja-niacin-blemish-care-serum",
    brand: "some-by-mi",
    category: "brightening",
    price: 1750,
    stock: 22,
    shortDescription:
      "Yuja citrus with niacinamide for dullness and uneven patches.",
    ingredients: "Yuja extract, niacinamide 10%, licorice root extract.",
    howToUse: "Apply after toner. Pair with daily sunscreen.",
    variants: [{ name: "50ml", stock: 22, isDefault: true }],
  },
  {
    name: "Retinol Intense Advanced Triple Action Eye Cream",
    slug: "some-by-mi-retinol-intense-triple-action-eye-cream",
    brand: "some-by-mi",
    category: "eye-creams",
    price: 1650,
    stock: 20,
    shortDescription:
      "A retinol eye cream for fine lines, buffered enough for nightly use.",
    ingredients: "Retinol, peptide complex, shea butter, panthenol.",
    howToUse: "Tap around the orbital bone at night.",
    variants: [{ name: "30ml", stock: 20, isDefault: true }],
  },

  // ---------------------------------------------------------- Torriden
  {
    name: "DIVE-IN Low Molecular Hyaluronic Acid Serum",
    slug: "torriden-dive-in-low-molecular-hyaluronic-acid-serum",
    brand: "torriden",
    category: "face-ampoules",
    price: 1350,
    stock: 46,
    isFeatured: true,
    shortDescription:
      "Fragrance-free hyaluronic acid serum that layers under anything.",
    ingredients: "5D hyaluronic acid complex, panthenol, allantoin.",
    howToUse: "Apply to damp skin, then seal with moisturiser.",
    variants: [{ name: "50ml", stock: 46, isDefault: true }],
  },
  {
    name: "DIVE-IN Low Molecular Hyaluronic Acid Soothing Cream",
    slug: "torriden-dive-in-soothing-cream",
    brand: "torriden",
    category: "moisturisers",
    price: 1550,
    stock: 28,
    shortDescription: "A light gel-cream for oily skin that still feels tight.",
    ingredients: "5D hyaluronic acid complex, centella asiatica, ceramide.",
    howToUse: "Apply as the last skincare step, morning and night.",
    variants: [{ name: "100ml", stock: 28, isDefault: true }],
  },
  {
    name: "SOLID-IN Ceramide Cream",
    slug: "torriden-solid-in-ceramide-cream",
    brand: "torriden",
    category: "moisturisers",
    price: 1750,
    stock: 20,
    shortDescription:
      "A richer ceramide cream for dry, flaky or over-exfoliated skin.",
    ingredients: "Ceramide NP, cholesterol, fatty acids, panthenol.",
    howToUse: "Warm between fingers and press over the face at night.",
    variants: [{ name: "70ml", stock: 20, isDefault: true }],
  },

  // -------------------------------------------------------- Round Lab
  {
    name: "1025 Dokdo Toner",
    slug: "round-lab-1025-dokdo-toner",
    brand: "round-lab",
    category: "toners-essences",
    price: 1650,
    stock: 42,
    isFeatured: true,
    shortDescription:
      "A mineral-water toner with mild exfoliation — safe for daily use.",
    ingredients: "Deep sea water, panthenol, betaine, allantoin.",
    howToUse: "Pat in after cleansing, morning and night.",
    variants: [{ name: "200ml", stock: 42, isDefault: true }],
  },
  {
    name: "Birch Juice Moisturizing Sunscreen SPF50+",
    slug: "round-lab-birch-juice-moisturizing-sunscreen",
    brand: "round-lab",
    category: "sunscreen",
    price: 1750,
    stock: 34,
    shortDescription:
      "A hydrating sunscreen for dry skin that never looks chalky.",
    ingredients: "Birch sap, panthenol, hyaluronic acid, UV filters.",
    howToUse: "Apply as the last morning step and reapply through the day.",
    variants: [{ name: "50ml", stock: 34, isDefault: true }],
  },
  {
    name: "1025 Dokdo Cleanser",
    slug: "round-lab-1025-dokdo-cleanser",
    brand: "round-lab",
    category: "cleansers",
    price: 1250,
    stock: 30,
    shortDescription: "A creamy low-pH wash that rinses without any squeak.",
    ingredients: "Deep sea water, glycerin, coco-betaine.",
    howToUse: "Massage over damp skin and rinse.",
    variants: [{ name: "150ml", stock: 30, isDefault: true }],
  },

  // ---------------------------------------------------------- Isntree
  {
    name: "Hyaluronic Acid Water Essence",
    slug: "isntree-hyaluronic-acid-water-essence",
    brand: "isntree",
    category: "toners-essences",
    price: 1750,
    stock: 26,
    shortDescription:
      "Eight molecular weights of hyaluronic acid in a watery essence.",
    ingredients: "Hyaluronic acid complex, beta-glucan, panthenol.",
    howToUse: "Press into damp skin before serum.",
    variants: [{ name: "100ml", stock: 26, isDefault: true }],
  },
  {
    name: "Hyaluronic Acid Airy Sun Stick SPF50+",
    slug: "isntree-hyaluronic-acid-airy-sun-stick",
    brand: "isntree",
    category: "sunscreen",
    price: 1650,
    stock: 32,
    shortDescription:
      "A stick sunscreen for topping up over makeup without a mirror.",
    ingredients: "Hyaluronic acid, shea butter, UV filters.",
    howToUse: "Glide over the face and reapply every few hours outdoors.",
    variants: [{ name: "22g", stock: 32, isDefault: true }],
  },

  // ----------------------------------------------------- Pyunkang Yul
  {
    name: "Essence Toner",
    slug: "pyunkang-yul-essence-toner",
    brand: "pyunkang-yul",
    category: "toners-essences",
    price: 1350,
    stock: 38,
    shortDescription:
      "A thick, near-fragrance-free toner with a very short ingredient list.",
    ingredients: "Coptis japonica root extract, betaine, caprylic triglyceride.",
    howToUse: "Pat a small amount into skin straight after cleansing.",
    variants: [{ name: "200ml", stock: 38, isDefault: true }],
  },
  {
    name: "Moisture Ampoule",
    slug: "pyunkang-yul-moisture-ampoule",
    brand: "pyunkang-yul",
    category: "face-ampoules",
    price: 1550,
    stock: 24,
    shortDescription:
      "A simple hydrating ampoule that plays well with sensitive skin.",
    ingredients: "Coptis japonica root extract, glycerin, panthenol.",
    howToUse: "Apply after toner, before cream.",
    variants: [{ name: "100ml", stock: 24, isDefault: true }],
  },
  {
    name: "Black Tea Time Reverse Eye Cream",
    slug: "pyunkang-yul-black-tea-time-reverse-eye-cream",
    brand: "pyunkang-yul",
    category: "eye-creams",
    price: 1850,
    stock: 18,
    shortDescription:
      "An antioxidant eye cream with black tea for early lines and puffiness.",
    ingredients: "Black tea leaf extract, peptides, shea butter.",
    howToUse: "Tap around the eye morning and night.",
    variants: [{ name: "30ml", stock: 18, isDefault: true }],
  },

  // --------------------------------------------------------- Medicube
  {
    name: "Zero Pore Pad 2.0",
    slug: "medicube-zero-pore-pad-2",
    brand: "medicube",
    category: "masks-patches",
    price: 1950,
    stock: 28,
    isFeatured: true,
    shortDescription:
      "Textured acid pads for blackheads and visible pores around the nose.",
    ingredients: "Salicylic acid, lactic acid, witch hazel, centella.",
    howToUse:
      "Wipe over clean skin two or three nights a week. Avoid the eye area.",
    variants: [{ name: "70 pads", stock: 28, isDefault: true }],
  },
  {
    name: "Collagen Night Wrapping Mask",
    slug: "medicube-collagen-night-wrapping-mask",
    brand: "medicube",
    category: "masks-patches",
    price: 2200,
    stock: 20,
    shortDescription:
      "An overnight jelly mask that sets into a film and leaves skin plump by morning.",
    ingredients: "Collagen, niacinamide, adenosine, panthenol.",
    howToUse: "Apply a thick layer as the last step at night. Rinse on waking.",
    variants: [{ name: "75ml", stock: 20, isDefault: true }],
  },
  {
    name: "Deep Vita C Ampoule",
    slug: "medicube-deep-vita-c-ampoule",
    brand: "medicube",
    category: "brightening",
    price: 2350,
    stock: 16,
    shortDescription:
      "A vitamin C ampoule for dull skin and lingering pigmentation.",
    ingredients: "Ascorbic acid, niacinamide, glutathione, hyaluronic acid.",
    howToUse: "Apply at night after toner, then moisturise.",
    variants: [{ name: "30ml", stock: 16, isDefault: true }],
  },

  // --------------------------------------------------------- Mediheal
  {
    name: "Tea Tree Care Solution Essential Mask",
    slug: "mediheal-tea-tree-care-solution-essential-mask",
    brand: "mediheal",
    category: "masks-patches",
    price: 180,
    stock: 200,
    shortDescription:
      "A single sheet mask for hot, irritated, breakout-prone skin.",
    ingredients: "Tea tree leaf extract, centella asiatica, panthenol.",
    howToUse: "Leave on for 15–20 minutes, then pat in what is left.",
    variants: [
      { name: "1 sheet", stock: 200, isDefault: true },
      { name: "10-pack", price: 1500, stock: 30 },
    ],
  },
  {
    name: "Madecassoside Blemish Pad",
    slug: "mediheal-madecassoside-blemish-pad",
    brand: "mediheal",
    category: "masks-patches",
    price: 1650,
    stock: 26,
    shortDescription:
      "Soothing cica pads for daily use after cleansing — calming, not stripping.",
    ingredients: "Madecassoside, centella asiatica extract, panthenol.",
    howToUse: "Sweep over the face after cleansing, morning or night.",
    variants: [{ name: "100 pads", stock: 26, isDefault: true }],
  },

  // -------------------------------------------------------- Innisfree
  {
    name: "Green Tea Seed Hyaluronic Serum",
    slug: "innisfree-green-tea-seed-hyaluronic-serum",
    brand: "innisfree",
    category: "face-ampoules",
    price: 1950,
    stock: 30,
    shortDescription:
      "Jeju green tea and hyaluronic acid in a light, everyday hydrating serum.",
    ingredients: "Green tea extract, green tea seed oil, hyaluronic acid.",
    howToUse: "Apply after toner, morning and night.",
    variants: [{ name: "80ml", stock: 30, isDefault: true }],
  },
  {
    name: "Volcanic Pore Clay Mask",
    slug: "innisfree-volcanic-pore-clay-mask",
    brand: "innisfree",
    category: "masks-patches",
    price: 1250,
    stock: 34,
    shortDescription:
      "A Jeju volcanic clay wash-off mask for oily, congested T-zones.",
    ingredients: "Jeju volcanic cluster, kaolin, bentonite.",
    howToUse:
      "Apply an even layer, leave 10–15 minutes, then rinse. Once or twice a week.",
    variants: [{ name: "100ml", stock: 34, isDefault: true }],
  },
  {
    name: "No-Sebum Mineral Powder",
    slug: "innisfree-no-sebum-mineral-powder",
    brand: "innisfree",
    category: "cosmetics",
    price: 950,
    stock: 60,
    shortDescription:
      "A loose mineral powder that kills shine — a staple in humid weather.",
    ingredients: "Mineral powder, cornstarch, Jeju mint extract.",
    howToUse: "Dust over makeup or bare skin wherever you get oily.",
    variants: [{ name: "5g", stock: 60, isDefault: true }],
  },

  // ----------------------------------------------------------- rom&nd
  {
    name: "Juicy Lasting Tint",
    slug: "romand-juicy-lasting-tint",
    brand: "romand",
    category: "cosmetics",
    price: 1250,
    stock: 70,
    isFeatured: true,
    shortDescription:
      "The glossy, fruit-stain tint that made the brand — comfortable and long-wearing.",
    ingredients: "Water, dimethicone, pigment blend, jojoba oil.",
    howToUse: "Apply from the centre of the lip outwards.",
    variants: [
      { name: "Fig Fig", stock: 25, isDefault: true },
      { name: "Bare Grape", stock: 25 },
      { name: "Pomelo Skin", stock: 20 },
    ],
  },
  {
    name: "Better Than Palette",
    slug: "romand-better-than-palette",
    brand: "romand",
    category: "cosmetics",
    price: 2450,
    stock: 22,
    shortDescription:
      "A ten-pan eyeshadow palette of wearable everyday neutrals.",
    ingredients: "Talc, mica, pigment blend, dimethicone.",
    howToUse: "Build from the matte base shades, then add shimmer on the lid.",
    variants: [
      { name: "Rose Bud Garden", stock: 12, isDefault: true },
      { name: "Peach Fuzz Garden", stock: 10 },
    ],
  },

  // --------------------------------------------------------- Peripera
  {
    name: "Ink Velvet Tint",
    slug: "peripera-ink-velvet-tint",
    brand: "peripera",
    category: "cosmetics",
    price: 1150,
    stock: 65,
    shortDescription:
      "A matte velvet tint with serious staying power through meals.",
    ingredients: "Water, alcohol, pigment blend, dimethicone.",
    howToUse: "Apply thinly and layer for a fuller finish.",
    variants: [
      { name: "Beauty Peak Rose", stock: 25, isDefault: true },
      { name: "Coral Vibe", stock: 20 },
      { name: "Good Brick", stock: 20 },
    ],
  },
  {
    name: "Ink Airy Velvet",
    slug: "peripera-ink-airy-velvet",
    brand: "peripera",
    category: "cosmetics",
    price: 1150,
    stock: 48,
    shortDescription:
      "A lighter, airier take on the velvet tint for an everyday blurred lip.",
    ingredients: "Water, alcohol, pigment blend, tocopherol.",
    howToUse: "Dab on and blend outwards for a soft edge.",
    variants: [
      { name: "Rosy Nude", stock: 24, isDefault: true },
      { name: "Milky Nude", stock: 24 },
    ],
  },

  // -------------------------------------------------------- Banila Co
  {
    name: "Clean It Zero Cleansing Balm",
    slug: "banila-co-clean-it-zero-cleansing-balm",
    brand: "banila-co",
    category: "makeup-removers",
    price: 1650,
    stock: 40,
    isFeatured: true,
    shortDescription:
      "The sherbet balm that melts a full face of makeup in under a minute.",
    ingredients: "Ethylhexyl palmitate, water, shea butter, papaya extract.",
    howToUse:
      "Massage onto dry skin, add water to emulsify, rinse, then cleanse again.",
    variants: [
      { name: "Original 100ml", stock: 22, isDefault: true },
      { name: "Purity 100ml", stock: 18 },
    ],
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  await mongoose.connect(uri);

  // ---------------------------------------------------------- zones
  // Upserted, not replaced: orders reference these by id.
  const [insideDhaka, outsideDhaka] = await Promise.all([
    DeliveryZone.findOneAndUpdate(
      { slug: "inside-dhaka" },
      {
        $setOnInsert: {
          name: "Inside Dhaka",
          slug: "inside-dhaka",
          charge: 60,
          freeShippingThreshold: 2000,
          minDays: 1,
          maxDays: 2,
          position: 0,
        },
      },
      { upsert: true, returnDocument: "after" },
    ),
    DeliveryZone.findOneAndUpdate(
      { slug: "outside-dhaka" },
      {
        $setOnInsert: {
          name: "Outside Dhaka",
          slug: "outside-dhaka",
          charge: 120,
          freeShippingThreshold: 3000,
          minDays: 2,
          maxDays: 4,
          position: 1,
        },
      },
      { upsert: true, returnDocument: "after" },
    ),
  ]);

  // ------------------------------------------------- wipe catalogue
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
  ]);

  // --------------------------------------------------------- brands
  const brands = await Brand.insertMany(
    BRANDS.map((brand) => ({ ...brand, logoUrl: null })),
  );
  const brandBySlug = new Map(brands.map((b) => [b.slug, b]));

  // ----------------------------------------------------- categories
  const skincare = await Category.create({
    name: "Skincare",
    slug: "skincare",
    description: "Every step of the Korean skincare routine.",
    imageUrl: categoryImg(0),
    position: 0,
  });

  const children = await Category.insertMany(
    CATEGORIES.map((category, index) => ({
      ...category,
      parentId: skincare._id,
      position: index,
      imageUrl: categoryImg(index),
    })),
  );
  const categoryBySlug = new Map(children.map((c) => [c.slug, c]));

  // ------------------------------------------------------- products
  await Product.insertMany(
    PRODUCTS.map((p, index) => {
      const { variants, brand, category, ...rest } = p;

      const brandDoc = brandBySlug.get(brand);
      const categoryDoc = categoryBySlug.get(category);
      if (!brandDoc) throw new Error(`Unknown brand "${brand}" on ${p.slug}`);
      if (!categoryDoc) {
        throw new Error(`Unknown category "${category}" on ${p.slug}`);
      }

      return {
        ...rest,
        brandId: brandDoc._id,
        categoryId: categoryDoc._id,
        metaTitle: `${p.name} | Korean Hive`,
        metaDescription: p.shortDescription,
        images: [0, 1].map((i) => ({
          // two angles per product, offset so the pair differs
          url: productImg(index, i * 3),
          alt: `${p.name} — image ${i + 1}`,
          position: i,
        })),
        variants: variants.map((v, i) => ({
          name: v.name,
          price: v.price ?? null,
          stock: v.stock,
          position: i,
          isDefault: v.isDefault ?? false,
        })),
      };
    }),
  );

  // --------------------------------------------------------- coupon
  await Coupon.findOneAndUpdate(
    { code: "WELCOME10" },
    {
      $setOnInsert: {
        code: "WELCOME10",
        description: "10% off your first order, up to ৳200.",
        type: "PERCENTAGE",
        value: 10,
        minSubtotal: 1000,
        maxDiscount: 200,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  console.log("Catalogue rebuilt:");
  console.log(`  zones      ${insideDhaka.name}, ${outsideDhaka.name}`);
  console.log(`  brands     ${brands.length}`);
  console.log(`  categories ${children.length + 1}`);
  console.log(`  products   ${PRODUCTS.length}`);
  console.log("  coupon     WELCOME10");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
