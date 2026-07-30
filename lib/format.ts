/** Prices are stored as Int in whole BDT — see prisma/schema.prisma. */
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
