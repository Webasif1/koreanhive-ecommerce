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
  from,
  to,
  total,
  active,
}: {
  /** 1-based index of the first card on this page; 0 when there are none */
  from: number;
  to: number;
  total: number;
  active: ProductSort;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (sort: ProductSort) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "newest") params.delete("sort");
    else params.set("sort", sort);
    // re-sorting reshuffles everything, so page 5 of the old order is meaningless
    params.delete("page");
    return `${pathname}${params.size ? `?${params}` : ""}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-white px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? (
          "No products"
        ) : (
          <>
            Showing{" "}
            <span className="font-bold text-foreground tabular-nums">
              {from}–{to}
            </span>{" "}
            of <span className="font-bold text-foreground">{total}</span>{" "}
            {total === 1 ? "product" : "products"}
          </>
        )}
      </p>

      {/* one swipeable row on a phone rather than three wrapped lines */}
      <div className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0">
        {SORTS.map((option) => (
          <Link
            key={option.value}
            href={hrefFor(option.value)}
            scroll={false}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center whitespace-nowrap border px-4 py-2 text-xs font-semibold transition-colors sm:min-h-0",
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
