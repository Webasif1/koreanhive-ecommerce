/**
 * Resolving the caller's address through a proxy chain.
 *
 * Pure and dependency-free so it can be unit tested — the rate limiters that
 * depend on it (admin login, order tracking, chat, wishlist) are the app's
 * abuse defences, and they were all defeated at once by the previous
 * implementation reading the *leftmost* X-Forwarded-For entry.
 *
 * X-Forwarded-For grows left to right: each proxy appends the address it saw.
 * A client can therefore write anything it likes into the left of the header,
 * and rotating that value used to mint a fresh rate-limit budget per request.
 * Counting from the right instead lands on the address our own proxy observed.
 */

export const UNKNOWN_CALLER = "unknown";

export function resolveClientIp(
  forwardedFor: string | null,
  realIp: string | null,
  trustedProxyHops: number,
) {
  // told explicitly that nothing in front of us can be trusted
  if (trustedProxyHops <= 0) return UNKNOWN_CALLER;

  if (forwardedFor) {
    const hops = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const index = hops.length - trustedProxyHops;
    if (index >= 0 && hops[index]) return hops[index];

    // a chain shorter than configured is not the chain we expect, so it tells
    // us nothing — throttle as a group rather than trusting the client
    return UNKNOWN_CALLER;
  }

  // set by the proxy rather than forwarded through it, so a client cannot
  // extend it the way it can extend XFF
  return realIp?.trim() || UNKNOWN_CALLER;
}

/**
 * How many proxies are in front of this app, from the environment.
 *
 * Defaults to **0 — trust nothing**. This used to default to 1, which was a
 * mistake: with no proxy actually in front, the "last hop" of a one-entry
 * X-Forwarded-For is the value the *client* wrote, so an unconfigured
 * deployment kept the exact bypass this whole change exists to close. Verified
 * live — a spoofed header still minted fresh rate-limit budgets.
 *
 * Trusting a header only because it is present is the original bug in a new
 * shape. So: an operator who puts a reverse proxy in front says so explicitly,
 * and until they do, no client-supplied address is believed.
 */
export function trustedProxyHops(raw = process.env.TRUSTED_PROXY_HOPS) {
  const parsed = Number(raw ?? "0");
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

/** True when the caller could not be identified and IP-keyed limits are
 *  therefore meaningless — see rateLimitByCaller in server/rate-limit.ts. */
export function isUnknownCaller(ip: string) {
  return ip === UNKNOWN_CALLER;
}
