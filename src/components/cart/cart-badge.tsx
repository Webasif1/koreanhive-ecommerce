"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { CART_CHANGED_EVENT } from "@/lib/cart-events";

/** The header sits in the root layout. Reading the cart cookie there would
 *  make every page dynamic and kill ISR, so the count is fetched instead —
 *  on navigation, on a cart change anywhere on the page, and when the tab
 *  regains focus after the cart may have moved in another one. */
export function CartBadge() {
  const [count, setCount] = useState<number | null>(null);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    let cancelled = false;

    fetch("/api/cart/count")
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data: { count?: number }) => {
        if (!cancelled) setCount(data.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => refresh(), [pathname, refresh]);

  useEffect(() => {
    const onChange = () => refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener(CART_CHANGED_EVENT, onChange);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, onChange);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  if (!count) return null;

  return (
    <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
