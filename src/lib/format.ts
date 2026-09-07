/** Prices are stored as integers in whole BDT — see server/models/index.ts. */
export function formatBDT(amount: number) {
  return `৳${amount.toLocaleString("en-US")}`;
}

export function discountPercent(price: number, comparePrice?: number | null) {
  if (!comparePrice || comparePrice <= price) return null;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

/** Fixed to Asia/Dhaka so a customer and the shop always read the same
 *  clock, whatever timezone the server runs in. */
export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(iso));
}

export function formatDeliveryWindow(minDays: number, maxDays: number) {
  return minDays === maxDays
    ? `${minDays} ${minDays === 1 ? "day" : "days"}`
    : `${minDays}–${maxDays} days`;
}

/**
 * Product-card blurb, cut to what the card can actually show.
 *
 * The card clamps this to two lines, but the whole paragraph shipped anyway —
 * once in the HTML and again in the RSC flight payload, which made a listing
 * page of twelve products 323 KB. Cutting at a word boundary a little past two
 * lines' worth is invisible on screen and roughly halves the page.
 */
const BENEFIT_LIMIT = 150;

export function truncateBenefit(value: string | null | undefined) {
  if (!value) return null;

  const text = value.trim();
  if (!text) return null;
  if (text.length <= BENEFIT_LIMIT) return text;

  const cut = text.slice(0, BENEFIT_LIMIT);
  const lastSpace = cut.lastIndexOf(" ");
  const body = lastSpace > 80 ? cut.slice(0, lastSpace) : cut;

  return `${body.replace(/[,;:.\s]+$/, "")}…`;
}
