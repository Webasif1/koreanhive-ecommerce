"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** The header sits in the root layout. Reading the cart cookie there would
 *  make every page dynamic and kill ISR, so the count is fetched instead. */
export function CartBadge() {
  const [count, setCount] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
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
  }, [pathname]);

  if (!count) return null;

  return (
    <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
