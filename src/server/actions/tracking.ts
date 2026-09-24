"use server";

// The browser calls this so each funnel event also reaches Meta through the
// Conversions API, with the pixel's event_id so Meta counts it once.
// Purchase is not accepted: only the checkout action can send it.

import { SITE_HOST, SITE_URL } from "@/lib/tracking/config";
import type { MetaClientServerEvent, MetaCustomData } from "@/lib/tracking/types";
import { callerIp, rateLimitByCaller } from "@/server/rate-limit";
import { sendToMeta } from "@/server/tracking/meta-capi";

const ALLOWED = new Set<MetaClientServerEvent>([
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Search",
]);

function num(v: unknown, max = 10_000_000) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : undefined;
}

function str(v: unknown, max = 200) {
  return typeof v === "string" ? v.slice(0, max) : undefined;
}

function sanitize(c: MetaCustomData | undefined): MetaCustomData {
  if (!c) return {};

  const contents = Array.isArray(c.contents)
    ? c.contents.slice(0, 50).map((x) => ({
        id: String(x.id).slice(0, 64),
        quantity: num(x.quantity, 999) ?? 1,
        item_price: num(x.item_price),
      }))
    : undefined;

  return {
    currency: "BDT",
    value: num(c.value),
    content_type: "product",
    content_ids: Array.isArray(c.content_ids)
      ? c.content_ids.slice(0, 50).map((x) => String(x).slice(0, 64))
      : undefined,
    contents,
    content_name: str(c.content_name),
    content_category: str(c.content_category),
    num_items: num(c.num_items, 9999),
    search_string: str(c.search_string, 100),
  };
}

export async function sendMetaEvent(input: {
  eventName: MetaClientServerEvent;
  eventId: string;
  url: string;
  custom?: MetaCustomData;
}): Promise<{ ok: boolean }> {
  if (!ALLOWED.has(input.eventName)) return { ok: false };
  if (typeof input.eventId !== "string" || input.eventId.length > 120) {
    return { ok: false };
  }

  // A public endpoint: without a cap, anyone could flood the pixel's data.
  if (!rateLimitByCaller("meta-event", await callerIp(), 120, 60_000)) {
    return { ok: false };
  }

  let url = SITE_URL;
  try {
    const u = new URL(input.url);
    if (u.hostname === SITE_HOST || u.hostname.endsWith(`.${SITE_HOST}`)) {
      url = u.toString();
    }
  } catch {
    /* keep SITE_URL */
  }

  const res = await sendToMeta({
    eventName: input.eventName,
    eventId: input.eventId,
    eventSourceUrl: url,
    customData: sanitize(input.custom),
  });

  return { ok: res.queued };
}
