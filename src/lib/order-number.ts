import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

/** e.g. KH-260730-8FQ2X — shared by the checkout and admin-created orders. */
export function generateOrderNumber(now = new Date()) {
  const stamp = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  // crypto, not Math.random: order numbers are handed out in public and
  // should not be predictable from one another
  const bytes = randomBytes(5);
  const random = Array.from(
    { length: 5 },
    (_, i) => ALPHABET[bytes[i] % ALPHABET.length],
  ).join("");

  return `KH-${stamp}-${random}`;
}
