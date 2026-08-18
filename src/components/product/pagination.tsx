"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useListingPending } from "@/components/product/listing-pending";
import { cn } from "@/lib/utils";

/**
 * Numbered pages, windowed so the row stays on one line on a phone:
 *
 *   ‹  1 … 4 [5] 6 … 12  ›
 *
 * Always shows the first and last page, the current page and its immediate
 * neighbours, with a gap marker standing in for the rest.
 */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const shown = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  return shown.flatMap((page, i) =>
    i > 0 && page - shown[i - 1] > 1 ? ["gap" as const, page] : [page],
  );
}

export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { navigate } = useListingPending();

  if (totalPages <= 1) return null;

  // same shape as ListingToolbar's hrefFor, so filters and sort survive paging
  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target === 1) params.delete("page");
    else params.set("page", String(target));
    return `${pathname}${params.size ? `?${params}` : ""}`;
  };

  const go = (href: string) => (event: React.MouseEvent) => {
    // let the browser handle new-tab / new-window clicks itself
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    navigate(() => router.push(href, { scroll: true }));
  };

  const arrow = "border px-3 py-2 text-xs font-semibold transition-colors";
  const enabled = "border-border bg-white text-foreground hover:border-primary";
  const disabled = "border-hairline bg-white text-faint";

  /* A dead end renders as a <span>, not a styled-dead <Link>. Keeping the
     anchor would put ?page=0 and ?page=6 in the HTML for a crawler to follow,
     and pointer-events-none only stops a mouse. Written as a plain function
     rather than a component so it is not redefined as a new type each render. */
  const arrowLink = (to: number, label: string) =>
    to < 1 || to > totalPages ? (
      <span aria-hidden className={cn(arrow, disabled)}>
        {label}
      </span>
    ) : (
      <Link
        href={hrefFor(to)}
        onClick={go(hrefFor(to))}
        className={cn(arrow, enabled)}
      >
        {label}
      </Link>
    );

  return (
    <nav
      aria-label="Product pages"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {arrowLink(page - 1, "‹ Prev")}

      {pageWindow(page, totalPages).map((entry, i) =>
        entry === "gap" ? (
          <span
            key={`gap-${i}`}
            aria-hidden
            className="px-1 text-xs text-faint"
          >
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={hrefFor(entry)}
            onClick={go(hrefFor(entry))}
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              "border px-3.5 py-2 text-xs font-semibold tabular-nums transition-colors",
              entry === page
                ? "border-ink bg-ink text-white"
                : "border-border bg-white text-foreground hover:border-primary",
            )}
          >
            {entry}
          </Link>
        ),
      )}

      {arrowLink(page + 1, "Next ›")}
    </nav>
  );
}
