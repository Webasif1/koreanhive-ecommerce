import "server-only";

import { headers } from "next/headers";

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

/** Caller IP, as seen through whatever proxy is in front of the app. Falls
 *  back to a constant so a request with no forwarding header is throttled as
 *  a group rather than escaping the limit entirely. */
export async function callerIp() {
  const headerList = await headers();

  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown"
  );
}
