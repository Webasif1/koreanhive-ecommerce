import { normalizeBdPhone } from "@/lib/bd-districts";

/**
 * Asking a customer to rate what they bought, after it reaches them.
 *
 * Ratings can only come from a delivered order, so the moment of delivery is
 * the moment to ask. Two ways in: a link on /track for a delivered order, and
 * a WhatsApp message staff can send from the admin order page.
 *
 * **The phone number never goes into the link.** The order number prefills
 * the form and the customer types their phone, exactly like /track. A link
 * forwarded to a family group, pasted into a chat or left in a browser history
 * then exposes nothing: it opens a form that still asks for the one detail
 * only the buyer has.
 */

/** Path to the rating form with the order number filled in. */
export function ratingRequestPath(orderNumber: string) {
  return `/reviews?${new URLSearchParams({ order: orderNumber })}#rate`;
}

/**
 * A wa.me link that opens WhatsApp on the customer's number with the message
 * already written. Staff press send — nothing goes out on its own.
 *
 * wa.me wants the number in international form with no plus or spaces:
 * 01712345678 becomes 8801712345678. Returns null for a number that is not a
 * Bangladeshi mobile, rather than a link that opens a chat with nobody.
 */
export function whatsappRatingLink({
  phone,
  customerName,
  url,
}: {
  phone: string;
  customerName: string;
  /** Absolute URL of the rating form, from ratingRequestPath. */
  url: string;
}) {
  const local = normalizeBdPhone(phone);
  if (!/^01[3-9]\d{8}$/.test(local)) return null;

  const firstName = customerName.trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `আসসালামু আলাইকুম ${firstName},` : "আসসালামু আলাইকুম,";

  const text = [
    greeting,
    "Korean Hive থেকে আপনার অর্ডার পৌঁছে গেছে। প্রোডাক্টগুলো কেমন লাগলো? শুধু star দিয়েও রেটিং দিতে পারেন — এক মিনিটও লাগবে না।",
    "",
    "Your Korean Hive order has been delivered. How did you find it? A star rating is enough:",
    url,
    "",
    "ফোন নম্বরটা দিলেই হবে — যেটা দিয়ে অর্ডার করেছিলেন।",
  ].join("\n");

  return `https://wa.me/88${local}?${new URLSearchParams({ text })}`;
}
