"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { ProductSort } from "@/server/queries/catalog";

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "popular", label: "Best Selling" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "discount", label: "Biggest Discount" },
];

export function isProductSort(value: string | undefined): value is ProductSort {
  return (
    value === "newest" ||
    value === "popular" ||
    value === "price-asc" ||
    value === "price-desc" ||
    value === "discount"
  );
}

/**
 * Result count plus sort. Sorting stays plain links so it costs no client
 * JavaScript and every combination is a shareable URL.
 */
export function ListingToolbar({
  shown,
  total,
  active,
}: {
  shown: number;
  total: number;
  active: ProductSort;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (sort: ProductSort) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "newest") params.delete("sort");
    else params.set("sort", sort);
    return `${pathname}${params.size ? `?${params}` : ""}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border border-border bg-white px-5 py-4">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-bold text-foreground">{shown}</span> of{" "}
        <span className="font-bold text-foreground">{total}</span>{" "}
        {total === 1 ? "product" : "products"}
      </p>

      <div className="flex flex-wrap gap-2">
        {SORTS.map((option) => (
          <Link
            key={option.value}
            href={hrefFor(option.value)}
            scroll={false}
            className={cn(
              "border px-4 py-2 text-xs font-semibold transition-colors",
              option.value === active
                ? "border-ink bg-ink text-white"
                : "border-border bg-white text-foreground hover:border-primary",
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
