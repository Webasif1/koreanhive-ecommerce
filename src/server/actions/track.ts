"use server";

import { isValidBdPhone } from "@/lib/bd-districts";
import type { TrackState } from "@/lib/track-state";
import { findOrderForTracking } from "@/server/queries/order";
import { callerIp, rateLimitByCaller } from "@/server/rate-limit";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

/** Per-instance throttle, now sharing server/rate-limit.ts rather than
 *  keeping a private copy — this endpoint is the one that makes walking order
 *  numbers expensive, so its IP resolution must be the hardened one. */

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

  const ip = await callerIp();

  if (!rateLimitByCaller("track", ip, MAX_ATTEMPTS, WINDOW_MS)) {
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
