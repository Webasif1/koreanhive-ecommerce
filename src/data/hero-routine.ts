/**
 * The three products in the hero's "shop the routine in this shot" strip.
 *
 * The slot used to render `popular.slice(0, 3)`. With no real sales history
 * that resolves to the three newest imports, so the strip under a photograph of
 * a routine showed whatever happened to be added to the catalogue last — a body
 * lotion and two minis, on the day this was written.
 *
 * These are a routine instead: hydrate, treat, protect, one flagship each from
 * three different houses, and the same products the journal articles recommend
 * by name. It is an editorial pick and reads as one — "shop the routine",
 * not "best sellers", which is a claim only the order history can make.
 *
 * Slugs are resolved against the catalogue at build. If one is unpublished or
 * renamed the strip falls back rather than rendering a gap, and
 * `npm run catalogue:verify` fails on it, so a broken pick is loud.
 */

export type RoutineStep = {
  /** Where this sits in a routine — rendered under the thumbnail. */
  step: string;
  slug: string;
};

export const HERO_ROUTINE: RoutineStep[] = [
  { step: "Hydrate", slug: "anua-heartleaf-77-percent-soothing-toner-500ml" },
  { step: "Treat", slug: "cosrx-advanced-snail-96-mucin-power-essence-100ml" },
  {
    step: "Protect",
    slug: "beauty-of-joseon-relief-sun-aqua-fresh-rice-plus-b5-spf50-pa-50ml",
  },
];

export const HERO_ROUTINE_SLUGS = HERO_ROUTINE.map((item) => item.slug);

/** The step label for a slug, for the strip's captions. */
export function stepForSlug(slug: string) {
  return HERO_ROUTINE.find((item) => item.slug === slug)?.step ?? null;
}
