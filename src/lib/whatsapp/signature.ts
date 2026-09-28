import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Meta signs every webhook POST with the app secret: the X-Hub-Signature-256
 * header is "sha256=" plus the HMAC-SHA256 of the raw body. Without this
 * check anyone who found the URL could make the bot message any number.
 *
 * It must run on the raw body, byte for byte — re-serialising parsed JSON
 * changes the bytes and the signature never matches.
 *
 * Fails closed: no secret configured means nothing is accepted.
 */
export function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !header?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const given = Buffer.from(header.slice("sha256=".length), "hex");

  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Constant-time string comparison, for the verify token and cron secret. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
