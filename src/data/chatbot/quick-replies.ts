/**
 * Suggested phrasings.
 *
 * These are not decoration — they are how a rule engine covers the language
 * gap. Every chip is worded the way the matcher expects, so a shopper who taps
 * rather than types always lands on a understood intent. Most conversations
 * never leave these rails.
 */

export const OPENING_QUICK_REPLIES = [
  "Help me find a product",
  "How long does delivery take?",
  "How much is delivery?",
  "How do I pay?",
];

export const FALLBACK_QUICK_REPLIES = [
  "Help me find a product",
  "How much is delivery?",
  "Are your products authentic?",
  "Track my order",
];

/** Offered after an answer, to move a shopper towards a recommendation. */
export const CONCERN_QUICK_REPLIES = [
  "Something for dry skin",
  "Something for breakouts",
  "Something for oily skin",
  "A sunscreen",
];

export const SKIN_TYPE_QUICK_REPLIES = [
  "Dry skin",
  "Oily skin",
  "Combination skin",
  "Sensitive skin",
];

/** Offered once a concern is known, to pin down what the product is *for*. */
export const USE_CASE_QUICK_REPLIES = [
  "Everyday hydration",
  "Barrier repair",
  "Brightening",
  "Soothing",
];

export const BUDGET_QUICK_REPLIES = [
  "Under 1000 taka",
  "Under 1500 taka",
  "Under 2000 taka",
  "No budget limit",
];
