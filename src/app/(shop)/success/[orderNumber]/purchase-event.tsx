"use client";

import { useEffect } from "react";

import { siteConfig } from "@/lib/site";

type PurchaseEventProps = {
  orderNumber: string;
  total: number;
  shipping: number;
  coupon: string | null;
  items: {
    name: string;
    variant: string | null;
    price: number;
    quantity: number;
  }[];
};

/**
 * Pushes a GA4-style `purchase` event to the GTM dataLayer, once per order.
 * A refresh or a back-navigation to this page would otherwise count the same
 * sale again, so the order number is remembered for the browser session.
 */
export function PurchaseEvent({
  orderNumber,
  total,
  shipping,
  coupon,
  items,
}: PurchaseEventProps) {
  useEffect(() => {
    const key = `purchase-tracked:${orderNumber}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked (private mode etc.) — still report the sale
    }

    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    // clear the previous ecommerce object so GTM doesn't merge stale fields
    w.dataLayer.push({ ecommerce: null });
    w.dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: orderNumber,
        value: total,
        currency: siteConfig.currency,
        shipping,
        ...(coupon ? { coupon } : {}),
        items: items.map((item) => ({
          item_name: item.name,
          ...(item.variant ? { item_variant: item.variant } : {}),
          price: item.price,
          quantity: item.quantity,
        })),
      },
    });
  }, [orderNumber, total, shipping, coupon, items]);

  return null;
}
