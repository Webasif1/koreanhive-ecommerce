import "server-only";

import { createHash, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { after } from "next/server";

import { isUnknownCaller } from "@/lib/client-ip";
import {
  META_GRAPH_API_VERSION,
  META_PIXEL_ID,
  SITE_URL,
  VISITOR_COOKIE,
} from "@/lib/tracking/config";
import { metaCustomFromItems, metaPhone } from "@/lib/tracking/shared";
import type {
  MetaCustomData,
  MetaEventName,
  MetaUserInput,
  TrackItem,
} from "@/lib/tracking/types";
import { clientIpFromHeaders } from "@/server/rate-limit";

const sha256 = (v: string) => createHash("sha256").update(v, "utf8").digest("hex");

function clean(v?: string | null) {
  return (v ?? "").trim().toLowerCase();
}

function hashIf(v: string) {
  return v ? [sha256(v)] : undefined;
}

function fbcFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const fbclid = new URL(url).searchParams.get("fbclid");
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
  } catch {
    return undefined;
  }
}

/**
 * IP, user agent, _fbp/_fbc and the visitor id for the current request.
 * Creates the kh_eid cookie when missing; that only succeeds inside Server
 * Actions and Route Handlers, and is skipped silently elsewhere.
 */
async function requestContext() {
  const h = await headers();
  const c = await cookies();

  // Resolved through TRUSTED_PROXY_HOPS rather than trusting the first
  // X-Forwarded-For entry, which the client controls.
  const ip = clientIpFromHeaders(h);

  let visitorId = c.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = randomUUID();
    try {
      c.set(VISITOR_COOKIE, visitorId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: false, // GTM reads it for the browser pixel's external_id
      });
    } catch {
      /* read-only outside Server Actions / Route Handlers */
    }
  }

  return {
    ip: isUnknownCaller(ip) ? undefined : ip,
    userAgent: h.get("user-agent") ?? undefined,
    referer: h.get("referer") ?? undefined,
    fbp: c.get("_fbp")?.value,
    fbc: c.get("_fbc")?.value,
    visitorId,
  };
}

function stripEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) =>
        v !== undefined &&
        v !== null &&
        v !== "" &&
        !(Array.isArray(v) && v.length === 0),
    ),
  ) as Partial<T>;
}

export type SendToMetaInput = {
  eventName: MetaEventName;
  eventId: string; // must equal the browser pixel eventID for deduplication
  eventSourceUrl?: string;
  customData?: MetaCustomData;
  user?: MetaUserInput;
};

/**
 * Queues one event for the Conversions API.
 *
 * The request context is read now, while the request is live, but the Graph
 * API call runs in after(): Server Actions run one at a time per client, so a
 * synchronous call here would hold Buy Now's and Place Order's redirects
 * behind Meta's response time.
 */
export async function sendToMeta(
  input: SendToMetaInput,
): Promise<{ queued: boolean }> {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[meta-capi] META_CAPI_ACCESS_TOKEN missing, skipped", input.eventName);
    }
    return { queued: false };
  }

  const ctx = await requestContext();
  const u = input.user ?? {};
  const eventSourceUrl = input.eventSourceUrl || ctx.referer || SITE_URL;

  const nameParts = clean(u.fullName)
    .replace(/[.,'"]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const fn = nameParts[0] ?? "";
  const ln = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  const user_data = stripEmpty({
    client_ip_address: ctx.ip,
    client_user_agent: ctx.userAgent,
    fbp: ctx.fbp,
    fbc: ctx.fbc ?? fbcFromUrl(eventSourceUrl),
    external_id: ctx.visitorId ? [sha256(ctx.visitorId)] : undefined,
    em: hashIf(clean(u.email)),
    ph: hashIf(metaPhone(u.phone)),
    fn: hashIf(fn),
    ln: hashIf(ln),
    ct: hashIf(clean(u.city).replace(/[^a-zঀ-৿]/g, "")),
    zp: hashIf(clean(u.zip).replace(/\s/g, "")),
    country: hashIf(clean(u.country ?? "bd")),
  });

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data,
        custom_data: stripEmpty((input.customData ?? {}) as Record<string, unknown>),
      },
    ],
  };

  if (process.env.META_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  after(async () => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
          signal: AbortSignal.timeout(4000),
        },
      );
      if (!res.ok) {
        console.error(
          "[meta-capi]",
          input.eventName,
          res.status,
          await res.text().catch(() => ""),
        );
      }
    } catch (err) {
      console.error("[meta-capi]", input.eventName, err);
    }
  });

  return { queued: true };
}

/**
 * Server half of Purchase, called from the checkout action once the order is
 * saved. The event id "purchase.<orderNumber>" is the one <TrackPurchase> uses
 * on the success page, so Meta deduplicates browser + server.
 */
export async function sendPurchaseToMeta(order: {
  id: string;
  items: TrackItem[];
  itemsTotal: number; // items after discount, without delivery
  customer: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    district?: string | null;
    postalCode?: string | null;
  };
}) {
  return sendToMeta({
    eventName: "Purchase",
    eventId: `purchase.${order.id}`,
    eventSourceUrl: `${SITE_URL}/checkout`,
    user: {
      fullName: order.customer.name,
      phone: order.customer.phone,
      email: order.customer.email,
      city: order.customer.district,
      zip: order.customer.postalCode,
      country: "bd",
    },
    customData: {
      ...metaCustomFromItems(order.items, order.itemsTotal),
      order_id: order.id,
    },
  });
}
