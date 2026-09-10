/**
 * Review arithmetic and display rules.
 *
 * Pure, and deliberately outside the query layer: the summary block states a
 * number ("4.6 from 23 reviews") and draws five bars from it, and every one of
 * those is a claim about real customers. A rounding slip or an off-by-one in
 * the breakdown is a false claim, not a cosmetic bug, so the maths lives where
 * it can be tested without a database.
 */

export type ReviewSummary = {
  count: number;
  /** Mean rating to one decimal, or null when there is nothing to average. */
  average: number | null;
  /** Reviews per star, 5 down to 1. */
  breakdown: { stars: number; count: number; percent: number }[];
};

export const EMPTY_REVIEW_SUMMARY: ReviewSummary = {
  count: 0,
  average: null,
  breakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percent: 0 })),
};

/**
 * Summarise a set of ratings.
 *
 * Ratings outside 1–5 are dropped rather than clamped. A 0 or a 7 in the data
 * means something upstream is wrong, and folding it into the nearest legal
 * value would hide that while still moving the average.
 */
export function summariseReviews(ratings: number[]): ReviewSummary {
  const valid = ratings.filter(
    (rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5,
  );

  if (valid.length === 0) return EMPTY_REVIEW_SUMMARY;

  const tally = new Map<number, number>();
  for (const rating of valid) {
    tally.set(rating, (tally.get(rating) ?? 0) + 1);
  }

  const total = valid.reduce((sum, rating) => sum + rating, 0);

  return {
    count: valid.length,
    // one decimal, the precision the design shows. Math.round on the scaled
    // value rather than toFixed, which returns a string and rounds half away
    // from zero inconsistently across engines for some values.
    average: Math.round((total / valid.length) * 10) / 10,
    breakdown: [5, 4, 3, 2, 1].map((stars) => {
      const count = tally.get(stars) ?? 0;
      return {
        stars,
        count,
        // Rounded for the bar width and the label. These can sum to 99 or 101
        // and that is correct — the alternative is inventing a percentage for
        // one row so the column adds up.
        percent: Math.round((count / valid.length) * 100),
      };
    }),
  };
}

/**
 * "Tahmina Rahman" → "Tahmina R."
 *
 * A review is published with a real person's order attached to it, so the
 * surname comes off before it goes on a public page. Anything without a
 * second word is returned as given — a single name is not made more private
 * by adding a full stop to it.
 */
export function displayAuthorName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "Customer";
  if (parts.length === 1) return parts[0];

  const surname = parts[parts.length - 1];
  return `${parts.slice(0, -1).join(" ")} ${surname[0].toUpperCase()}.`;
}
