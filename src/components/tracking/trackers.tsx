"use client";

// "Fire once on page view" components. Each renders nothing, and re-fires
// only when its key changes (e.g. navigating product to product).

import { useEffect, useRef } from "react";

import {
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  trackViewCart,
  trackViewItem,
  trackViewItemList,
} from "@/lib/tracking/client";
import type { TrackItem } from "@/lib/tracking/types";

function useTrackOnce(key: string, fire: () => void) {
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!key || last.current === key) return;
    last.current = key;
    fire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

const keyOf = (items: TrackItem[]) =>
  items.map((i) => `${i.item_id}x${i.quantity}`).join(",");

export function TrackViewItem({ item }: { item: TrackItem }) {
  useTrackOnce(`vi:${item.item_id}`, () => trackViewItem(item));
  return null;
}

export function TrackViewItemList({
  listName,
  items,
}: {
  listName: string;
  items: TrackItem[];
}) {
  useTrackOnce(`vil:${listName}:${keyOf(items)}`, () =>
    trackViewItemList(listName, items),
  );
  return null;
}

export function TrackViewCart({ items }: { items: TrackItem[] }) {
  useTrackOnce(items.length ? `vc:${keyOf(items)}` : "", () =>
    trackViewCart(items),
  );
  return null;
}

export function TrackBeginCheckout({ items }: { items: TrackItem[] }) {
  useTrackOnce(items.length ? `bc:${keyOf(items)}` : "", () =>
    trackBeginCheckout(items),
  );
  return null;
}

export function TrackPurchase(props: {
  orderId: string;
  items: TrackItem[];
  itemsTotal: number;
  shipping?: number;
  coupon?: string | null;
}) {
  useTrackOnce(`p:${props.orderId}`, () =>
    trackPurchase({
      id: props.orderId,
      items: props.items,
      itemsTotal: props.itemsTotal,
      shipping: props.shipping,
      coupon: props.coupon,
    }),
  );
  return null;
}

export function TrackSearch({ term }: { term: string }) {
  useTrackOnce(term ? `s:${term}` : "", () => trackSearch(term));
  return null;
}
