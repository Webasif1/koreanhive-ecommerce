"use server";

import { headers } from "next/headers";

import { isValidBdPhone } from "@/lib/bd-districts";
import type { TrackState } from "@/lib/track-state";
import { findOrderForTracking } from "@/server/queries/order";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

/** Per-instance throttle. It raises the cost of walking order numbers, but
 *  it is memory-local: a serverless fleet gives each instance its own
 *  budget. Move to a shared store when this matters. */
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) return false;

  entry.count += 1;
  return true;
}

export async function trackOrderAction(
  _prev: TrackState,
  formData: FormData,
): Promise<TrackState> {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!orderNumber || !phone) {
    return {
      error: "Enter both your order number and phone number.",
      order: null,
    };
  }

  if (!isValidBdPhone(phone)) {
    return { error: "Enter a valid Bangladeshi mobile number.", order: null };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(ip)) {
    return {
      error: "Too many attempts. Please wait a minute and try again.",
      order: null,
    };
  }

  const order = await findOrderForTracking(orderNumber, phone);

  if (!order) {
    // deliberately vague: never reveal which of the two was wrong
    return {
      error:
        "No order matches that order number and phone number. Check both and try again.",
      order: null,
    };
  }

  return { error: null, order };
}
