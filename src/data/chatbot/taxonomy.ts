/**
 * The chatbot's vocabulary.
 *
 * Product has no tags, concerns or skin-type fields (see server/models),
 * so the advisor needs its own controlled vocabulary. Everything here is
 * `as const`, which makes a mistyped concern a compile error rather than a
 * product that silently never matches.
 *
 * Synonyms are how a rule engine covers phrasing without a language model.
 * Add what shoppers actually type — the misses are worth logging.
 */

export const CONCERNS = [
  "dryness",
  "dehydration",
  "acne",
  "post-acne-marks",
  "oiliness",
  "large-pores",
  "dullness",
  "dark-spots",
  "redness",
  "sensitivity",
  "fine-lines",
  "dark-circles",
  "sun-protection",
  "uneven-texture",
] as const;

export type Concern = (typeof CONCERNS)[number];

export const SKIN_TYPES = [
  "dry",
  "oily",
  "combination",
  "normal",
  "sensitive",
] as const;

export type SkinType = (typeof SKIN_TYPES)[number];

export const USE_CASES = [
  "daily-hydration",
  "barrier-repair",
  "deep-repair",
  "gentle-cleansing",
  "makeup-removal",
  "exfoliation",
  "brightening",
  "spot-treatment",
  "oil-control",
  "soothing",
  "anti-ageing",
  "daily-sun-care",
  "makeup",
] as const;

export type UseCase = (typeof USE_CASES)[number];

/**
 * Category slugs as seeded. Kept as a literal union so the knowledge file
 * cannot point a product at a category that does not exist.
 */
export const CATEGORY_SLUGS = [
  "cleansers",
  "makeup-removers",
  "toners-essences",
  "face-ampoules",
  "moisturisers",
  "eye-creams",
  "brightening",
  "sunscreen",
  "masks-patches",
  "cosmetics",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

/** Shopper-facing labels. Used in replies and quick-reply chips. */
export const CONCERN_LABELS: Record<Concern, string> = {
  dryness: "dry skin",
  dehydration: "dehydrated skin",
  acne: "breakouts",
  "post-acne-marks": "post-acne marks",
  oiliness: "oily skin",
  "large-pores": "visible pores",
  dullness: "dullness",
  "dark-spots": "dark spots",
  redness: "redness",
  sensitivity: "sensitive skin",
  "fine-lines": "fine lines",
  "dark-circles": "dark circles",
  "sun-protection": "sun protection",
  "uneven-texture": "uneven texture",
};

export const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  dry: "dry skin",
  oily: "oily skin",
  combination: "combination skin",
  normal: "normal skin",
  sensitive: "sensitive skin",
};

export const USE_CASE_LABELS: Record<UseCase, string> = {
  "daily-hydration": "everyday hydration",
  "barrier-repair": "barrier repair",
  "deep-repair": "intensive repair",
  "gentle-cleansing": "gentle cleansing",
  "makeup-removal": "makeup removal",
  exfoliation: "exfoliation",
  brightening: "brightening",
  "spot-treatment": "spot treatment",
  "oil-control": "oil control",
  soothing: "soothing irritated skin",
  "anti-ageing": "fine lines and firmness",
  "daily-sun-care": "daily sun protection",
  makeup: "makeup",
};

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  cleansers: "cleanser",
  "makeup-removers": "makeup remover",
  "toners-essences": "toner or essence",
  "face-ampoules": "serum or ampoule",
  moisturisers: "moisturiser",
  "eye-creams": "eye cream",
  brightening: "brightening product",
  sunscreen: "sunscreen",
  "masks-patches": "mask or patch",
  cosmetics: "makeup product",
};

/**
 * Phrase tables. Multi-word entries are matched against the whole normalised
 * message; single words against tokens. Longer phrases win, so "very dry"
 * beats a stray "dry" inside "dry down".
 */
export const CONCERN_SYNONYMS: Record<Concern, string[]> = {
  dryness: ["dry", "dryness", "flaky", "flaking", "tight", "rough", "parched"],
  dehydration: ["dehydrated", "dehydration", "thirsty skin", "water loss"],
  acne: [
    "acne",
    "pimple",
    "pimples",
    "breakout",
    "breakouts",
    "zit",
    "zits",
    "spots on face",
    "whitehead",
    "blackhead",
    "blackheads",
    "congested",
  ],
  "post-acne-marks": [
    "acne scar",
    "acne scars",
    "acne mark",
    "acne marks",
    "post acne",
    "dark marks",
    "pih",
    "scarring",
  ],
  oiliness: ["oily", "oiliness", "greasy", "shiny", "shine", "sebum", "grease"],
  "large-pores": ["pore", "pores", "large pores", "open pores", "pore size"],
  dullness: ["dull", "dullness", "tired skin", "lifeless", "no glow", "glow"],
  "dark-spots": [
    "dark spot",
    "dark spots",
    "pigmentation",
    "hyperpigmentation",
    "melasma",
    "uneven tone",
    "blemish",
    "blemishes",
  ],
  redness: ["red", "redness", "flushed", "rosacea", "irritated", "irritation"],
  sensitivity: [
    "sensitive",
    "sensitivity",
    "reactive",
    "stings",
    "stinging",
    "burns",
    "itchy",
  ],
  "fine-lines": [
    "wrinkle",
    "wrinkles",
    "fine line",
    "fine lines",
    "ageing",
    "aging",
    "anti aging",
    "firmness",
    "sagging",
  ],
  "dark-circles": ["dark circle", "dark circles", "under eye", "eye bags", "puffy eyes"],
  "sun-protection": [
    "sun",
    "sunscreen",
    "spf",
    "sunblock",
    "uv",
    "tanning",
    "sunburn",
  ],
  "uneven-texture": [
    "texture",
    "uneven texture",
    "bumpy",
    "bumps",
    "rough texture",
    "closed comedones",
  ],
};

export const SKIN_TYPE_SYNONYMS: Record<SkinType, string[]> = {
  dry: ["dry skin", "my skin is dry", "dry type"],
  oily: ["oily skin", "my skin is oily", "oily type", "very oily"],
  combination: ["combination", "combo skin", "combination skin", "oily t zone", "t zone"],
  normal: ["normal skin", "normal type"],
  sensitive: ["sensitive skin", "reactive skin", "easily irritated"],
};

export const USE_CASE_SYNONYMS: Record<UseCase, string[]> = {
  "daily-hydration": ["hydration", "hydrating", "moisture", "moisturise", "moisturize"],
  "barrier-repair": ["barrier", "damaged barrier", "repair barrier", "moisture barrier"],
  "deep-repair": ["repair", "healing", "recovery", "very damaged"],
  "gentle-cleansing": ["cleanse", "cleanser", "face wash", "washing", "gentle wash"],
  "makeup-removal": ["remove makeup", "makeup remover", "cleansing oil", "double cleanse", "cleansing balm"],
  exfoliation: ["exfoliate", "exfoliation", "peeling", "aha", "bha", "pha", "chemical exfoliant"],
  brightening: ["brighten", "brightening", "whitening", "glow up", "vitamin c"],
  "spot-treatment": ["spot treatment", "patch", "patches", "pimple patch", "overnight spot"],
  "oil-control": ["oil control", "mattify", "matte", "control shine", "less oily"],
  soothing: ["soothe", "soothing", "calm", "calming", "cica", "centella"],
  "anti-ageing": ["anti ageing", "anti aging", "retinol", "collagen", "firming"],
  "daily-sun-care": ["daily spf", "everyday sunscreen", "sun care"],
  makeup: ["lipstick", "lip tint", "tint", "eyeshadow", "palette", "powder", "makeup"],
};

export const CATEGORY_SYNONYMS: Record<CategorySlug, string[]> = {
  cleansers: ["cleanser", "face wash", "facewash", "foam", "gel cleanser"],
  "makeup-removers": ["cleansing oil", "cleansing balm", "makeup remover", "first cleanse"],
  "toners-essences": ["toner", "essence", "toners", "essences", "skin water"],
  "face-ampoules": ["serum", "ampoule", "serums", "ampoules"],
  moisturisers: ["moisturiser", "moisturizer", "cream", "gel cream", "lotion"],
  "eye-creams": ["eye cream", "eye serum", "under eye cream"],
  brightening: ["brightening product", "vitamin c serum", "brightening serum"],
  sunscreen: ["sunscreen", "sunblock", "spf", "sun stick", "sun serum"],
  "masks-patches": ["mask", "sheet mask", "pad", "pads", "patch", "patches", "wrapping mask"],
  cosmetics: ["makeup", "lip tint", "lipstick", "eyeshadow", "palette", "powder", "cosmetics"],
};

/**
 * Typed lookups so callers can validate an untrusted string from a request
 * body without reaching for a cast.
 */
export function isConcern(value: unknown): value is Concern {
  return typeof value === "string" && (CONCERNS as readonly string[]).includes(value);
}

export function isSkinType(value: unknown): value is SkinType {
  return typeof value === "string" && (SKIN_TYPES as readonly string[]).includes(value);
}

export function isUseCase(value: unknown): value is UseCase {
  return typeof value === "string" && (USE_CASES as readonly string[]).includes(value);
}

export function isCategorySlug(value: unknown): value is CategorySlug {
  return (
    typeof value === "string" && (CATEGORY_SLUGS as readonly string[]).includes(value)
  );
}
