"use client";

// Browser-side tracking. Each call:
//   1) pushes a GA4-format ecommerce event into window.dataLayer, where GTM
//      fires the GA4 tag and the Meta pixel tag;
//   2) asks the server to send the same event through the Conversions API.
// Both Meta sides share one event_id, so Meta counts the event once.

import { sendMetaEvent } from "@/server/actions/tracking";

import { itemsValue, metaCustomFromItems } from "./shared";
import type { Ga4EcomEvent, MetaClientServerEvent, TrackItem } from "./types";

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

function dataLayer() {
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  return w.dataLayer;
}

export function newEventId(prefix: string) {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `${prefix}.${rnd}`;
}

const TO_META: Partial<Record<Ga4EcomEvent, MetaClientServerEvent>> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  add_shipping_info: "AddPaymentInfo",
};

type Options = {
  value?: number;
  eventId?: string;
  listName?: string;
  transactionId?: string;
  shipping?: number;
  coupon?: string | null;
  sendToServer?: boolean;
};

export function trackEcommerce(
  event: Ga4EcomEvent,
  items: TrackItem[],
  opts: Options = {},
) {
  if (typeof window === "undefined" || items.length === 0) return;

  const value = opts.value ?? itemsValue(items);
  const eventId = opts.eventId ?? newEventId(event);
  const dl = dataLayer();

  dl.push({ ecommerce: null }); // clear the previous ecommerce object
  dl.push({
    event,
    event_id: eventId,
    ...(opts.listName ? { item_list_name: opts.listName } : {}),
    ecommerce: {
      currency: "BDT",
      value,
      items,
      ...(opts.transactionId ? { transaction_id: opts.transactionId } : {}),
      ...(opts.shipping !== undefined ? { shipping: opts.shipping } : {}),
      ...(opts.coupon ? { coupon: opts.coupon } : {}),
      ...(opts.listName ? { item_list_name: opts.listName } : {}),
    },
  });

  const metaName = TO_META[event];
  if (metaName && opts.sendToServer !== false) {
    void sendMetaEvent({
      eventName: metaName,
      eventId,
      url: window.location.href,
      custom: metaCustomFromItems(items, value),
    }).catch(() => {});
  }

  return eventId;
}

export const trackViewItem = (item: TrackItem) =>
  trackEcommerce("view_item", [{ ...item, quantity: item.quantity || 1 }]);

/** Call from both "Add to Cart" and "Buy Now". */
export const trackAddToCart = (item: TrackItem) =>
  trackEcommerce("add_to_cart", [item]);

export const trackViewCart = (items: TrackItem[]) =>
  trackEcommerce("view_cart", items);

export const trackBeginCheckout = (items: TrackItem[]) =>
  trackEcommerce("begin_checkout", items);

/** Once the customer has filled in phone + address + district. */
export const trackAddShippingInfo = (items: TrackItem[]) =>
  trackEcommerce("add_shipping_info", items);

export const trackViewItemList = (listName: string, items: TrackItem[]) =>
  trackEcommerce("view_item_list", items.slice(0, 50), { listName });

/** Browser half of Purchase; the server half is sendPurchaseToMeta(). */
export function trackPurchase(order: {
  id: string;
  items: TrackItem[];
  itemsTotal: number;
  shipping?: number;
  coupon?: string | null;
}) {
  const key = `kh_purchase_tracked_${order.id}`;
  try {
    if (localStorage.getItem(key)) return; // not again on refresh
    localStorage.setItem(key, "1");
  } catch {
    /* storage blocked: still track once for this render */
  }

  return trackEcommerce("purchase", order.items, {
    value: order.itemsTotal,
    eventId: `purchase.${order.id}`, // same id the server used
    transactionId: order.id,
    shipping: order.shipping,
    coupon: order.coupon,
    sendToServer: false, // the checkout action already sent it
  });
}

export function trackSearch(term: string) {
  const q = term.trim();
  if (!q || typeof window === "undefined") return;

  const eventId = newEventId("search");
  dataLayer().push({ event: "search", event_id: eventId, search_term: q });
  void sendMetaEvent({
    eventName: "Search",
    eventId,
    url: window.location.href,
    custom: { search_string: q },
  }).catch(() => {});
}
