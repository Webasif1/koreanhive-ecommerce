"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { CatalogListing } from "@/server/queries/catalog";
import { cn } from "@/lib/utils";

type Facets = CatalogListing["facets"];

/** Multi-value facets live in the URL as `brand=cosrx,anua`. */
function toggleInList(current: string | null, value: string) {
  const items = current ? current.split(",").filter(Boolean) : [];
  const next = items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
  return next.length ? next.join(",") : null;
}

function FacetRow({
  label,
  count,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 py-1.5 text-sm",
        disabled && "cursor-wait opacity-60",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="size-4 accent-mulberry"
      />
      <span className="flex-1">{label}</span>
      <span className="text-xs text-faint tabular-nums">{count}</span>
    </label>
  );
}

export function FilterSidebar({
  facets,
  /** facets already fixed by the route, e.g. brand on a brand page */
  hide = [],
}: {
  facets: Facets;
  hide?: ("brand" | "category")[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedBrands = (searchParams.get("brand") ?? "").split(",").filter(Boolean);
  const selectedCategories = (searchParams.get("category") ?? "")
    .split(",")
    .filter(Boolean);
  const onSale = searchParams.get("sale") === "1";
  const inStock = searchParams.get("stock") === "1";

  const hasFilters =
    selectedBrands.length > 0 ||
    selectedCategories.length > 0 ||
    onSale ||
    inStock;

  const apply = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    // a filter change always returns to the first page of results
    params.delete("page");

    startTransition(() => {
      router.replace(`${pathname}${params.size ? `?${params}` : ""}`, {
        scroll: false,
      });
    });
  };

  const setList = (key: string, value: string) =>
    apply((params) => {
      const next = toggleInList(params.get(key), value);
      if (next) params.set(key, next);
      else params.delete(key);
    });

  const setFlag = (key: string, value: boolean) =>
    apply((params) => {
      if (value) params.set(key, "1");
      else params.delete(key);
    });

  return (
    <div className="border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.1em]">
          Filters
        </h2>
        {hasFilters && (
          <Link
            href={pathname}
            scroll={false}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear all
          </Link>
        )}
      </div>

      {/* one option is not a choice — on a leaf category page the scope
          already fixes it, so the section is just noise */}
      {!hide.includes("category") && facets.categories.length > 1 && (
        <section className="border-b border-border px-5 py-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Category
          </h3>
          <div className="mt-2">
            {facets.categories.map((option) => (
              <FacetRow
                key={option.slug}
                label={option.name}
                count={option.count}
                checked={selectedCategories.includes(option.slug)}
                onToggle={() => setList("category", option.slug)}
                disabled={isPending}
              />
            ))}
          </div>
        </section>
      )}

      {!hide.includes("brand") && facets.brands.length > 1 && (
        <section className="border-b border-border px-5 py-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Brand
          </h3>
          <div className="mt-2 max-h-72 overflow-y-auto">
            {facets.brands.map((option) => (
              <FacetRow
                key={option.slug}
                label={option.name}
                count={option.count}
                checked={selectedBrands.includes(option.slug)}
                onToggle={() => setList("brand", option.slug)}
                disabled={isPending}
              />
            ))}
          </div>
        </section>
      )}

      <section className="px-5 py-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Availability
        </h3>
        <div className="mt-2">
          <FacetRow
            label="On sale"
            count={facets.onSale}
            checked={onSale}
            onToggle={() => setFlag("sale", !onSale)}
            disabled={isPending}
          />
          <FacetRow
            label="In stock"
            count={facets.inStock}
            checked={inStock}
            onToggle={() => setFlag("stock", !inStock)}
            disabled={isPending}
          />
        </div>
      </section>
    </div>
  );
}
