import Link from "next/link";

import { Stars } from "@/components/review/stars";
import type { ReviewSummary } from "@/lib/reviews";

/**
 * The score panel: average, stars, count, and a bar per star rating.
 *
 * Renders nothing at zero rather than showing "0.0" over five empty bars.
 * A shop with no reviews yet and a shop rated zero out of five look almost
 * identical in this layout, and only one of them is true.
 */
export function ReviewSummaryPanel({
  summary,
  productCount,
  heading,
  className,
}: {
  summary: ReviewSummary;
  /** How many products the reviews span — omitted when it is one product. */
  productCount?: number;
  heading: string;
  className?: string;
}) {
  if (summary.count === 0 || summary.average === null) return null;

  return (
    <div className={className}>
      <p className="eyebrow">{heading}</p>

      <p className="mt-4 font-display text-[56px] leading-none tracking-[-0.02em]">
        {summary.average.toFixed(1)}
      </p>

      <Stars value={summary.average} className="mt-3 block text-[15px]" />

      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        {/* "ratings", not "reviews": the count includes buyers who left stars
            without writing anything, so "23 reviews" above a list of eight
            written ones would overstate what is there to read */}
        Based on {summary.count}{" "}
        {summary.count === 1 ? "verified rating" : "verified ratings"}
        {productCount ? ` across ${productCount} products` : ""}
      </p>

      <ul className="mt-5 space-y-2">
        {summary.breakdown.map((row) => (
          <li key={row.stars} className="flex items-center gap-3">
            <span className="w-7 shrink-0 text-[12px] text-muted-foreground">
              {row.stars}★
            </span>
            {/* aria-hidden on the bar: the row already reads as "5 stars,
                3 ratings, 60%" from the text either side of it, and a
                progressbar role here would announce it a second time. */}
            <span
              aria-hidden
              className="h-1.5 flex-1 overflow-hidden bg-blush"
            >
              <span
                className="block h-full bg-primary"
                style={{ width: `${row.percent}%` }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-[12px] text-muted-foreground">
              {row.percent}%
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/reviews"
        className="mt-6 inline-block border-b border-chip-border pb-1 text-[13.5px] font-semibold text-primary"
      >
        Read all reviews
      </Link>
    </div>
  );
}
