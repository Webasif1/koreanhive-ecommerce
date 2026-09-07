import "server-only";

import { headers } from "next/headers";

import {
  isUnknownCaller,
  resolveClientIp,
  trustedProxyHops,
} from "@/lib/client-ip";

type Bucket = { count: number; resetAt: number };

/**
 * Fixed-window counters held in process memory.
 *
 * Deliberately not Redis. This deploys as a single container, where an
 * in-memory map is exact and costs nothing. The honest limitation: a
 * horizontally scaled fleet gives each instance its own budget, so the effective
 * limit multiplies by the instance count. Move to a shared store at that
 * point — the call sites do not have to change.
 */
const buckets = new Map<string, Bucket>();

/** Stops the map growing without bound on an endpoint with many distinct
 *  keys. Cheap because it only runs when the map is already large. */
function evictExpired(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/** Returns true when the request is allowed. */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  evictExpired(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) return false;

  bucket.count += 1;
  return true;
}

/**
 * Caller IP, resolved through the proxy chain.
 *
 * The logic lives in lib/client-ip.ts so it can be unit tested — see
 * tests/client-ip.test.ts. Configure TRUSTED_PROXY_HOPS to the number of
 * proxies in front of this app (1 by default).
 */
export function clientIpFromHeaders(headerList: Headers) {
  return resolveClientIp(
    headerList.get("x-forwarded-for"),
    headerList.get("x-real-ip"),
    trustedProxyHops(),
  );
}

export async function callerIp() {
  return clientIpFromHeaders(await headers());
}

let warnedAboutProxy = false;

/**
 * Per-caller limit that degrades honestly.
 *
 * When TRUSTED_PROXY_HOPS is unset there is no trustworthy client address, so
 * every caller resolves to the same "unknown" key. Applying a per-caller
 * budget to that shared key would let one abuser lock out everybody — the
 * admin login most damagingly — so an unidentified caller is *not* subject to
 * the per-IP bucket. The identity-keyed limits that do not depend on an
 * address (the login's per-email bucket) still apply, and they are what
 * actually bounds a brute force.
 *
 * The trade is stated plainly rather than hidden: until the hop count is
 * configured, per-IP limiting is off, and the log says so once.
 */
export function rateLimitByCaller(
  prefix: string,
  ip: string,
  max: number,
  windowMs: number,
) {
  if (isUnknownCaller(ip)) {
    if (!warnedAboutProxy) {
      warnedAboutProxy = true;
      console.warn(
        "[rate-limit] No trusted client address. Per-IP limits are disabled. " +
          "Set TRUSTED_PROXY_HOPS to the number of proxies in front of this app.",
      );
    }
    return true;
  }

  return rateLimit(`${prefix}:${ip}`, max, windowMs);
}
