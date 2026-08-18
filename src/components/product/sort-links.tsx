import Link from "next/link";

import { cn } from "@/lib/utils";
import type { ProductSort } from "@/server/queries/catalog";

const options: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export function isProductSort(value: string | undefined): value is ProductSort {
  return options.some((option) => option.value === value);
}

/** Plain links, so sorting costs no client JavaScript. */
export function SortLinks({
  basePath,
  active,
}: {
  basePath: string;
  active: ProductSort;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Link
          key={option.value}
          href={
            option.value === "newest"
              ? basePath
              : `${basePath}?sort=${option.value}`
          }
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            option.value === active
              ? "border-primary bg-primary/5 text-primary"
              : "border-input text-muted-foreground hover:border-primary/50",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
