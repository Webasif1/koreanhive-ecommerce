/**
 * Shapes shared by the review form and the query behind it.
 *
 * ReviewableItem is declared here rather than in server/queries/reviews.ts,
 * which opens with `import "server-only"`. A type-only import from there is
 * erased and would work today, but it puts a server-only module in a client
 * component's import list, one refactor away from becoming a value import and
 * a build error. Declaring it on the client-safe side removes the hazard
 * instead of relying on nobody tripping over it.
 */
export type ReviewableItem = {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  /** Already reviewed on this order — the form shows it as done. */
  reviewed: boolean;
};

export type ReviewFormState = {
  ok: boolean;
  message: string | null;
  errors: Record<string, string>;
};

export const emptyReviewFormState: ReviewFormState = {
  ok: false,
  message: null,
  errors: {},
};

export type ReviewableState = {
  error: string | null;
  order: {
    orderId: string;
    customerName: string;
    city: string;
    items: ReviewableItem[];
  } | null;
};

export const emptyReviewableState: ReviewableState = {
  error: null,
  order: null,
};

/** Shortest review worth publishing. Below this it is a rating, not a review. */
export const MIN_REVIEW_BODY = 15;
export const MAX_REVIEW_BODY = 1000;
