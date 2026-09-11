import { cn } from "@/lib/utils";

/**
 * Design system: gold stars, then "4.9 (216)". Reviews are shown as a count,
 * never as a bare number.
 *
 * The figures are a product's approved customer ratings, written only by
 * recomputeProductRating in src/server/ratings.ts. They used to be the
 * catalogue sheet's placeholder — identical on every product — and this
 * component sat behind a feature flag because of it. The flag went when the
 * data became real; `catalogue:verify` now fails if a product's rating is not
 * backed by its reviews.
 *
 * Renders nothing without a count, so an unrated product shows no stars
 * rather than five empty ones, which would read as a bad score.
 */
export function StarRating({
  value,
  count,
  className,
  showCount = true,
}: {
  value: number;
  count?: number;
  className?: string;
  showCount?: boolean;
}) {
  if (count !== undefined && count <= 0) return null;

  const rounded = Math.round(value);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className="text-[12px] tracking-[0.08em] text-star"
        aria-hidden
      >
        {"★".repeat(rounded)}
        <span className="text-hairline">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="sr-only">
        {value} out of 5
        {count !== undefined &&
          `, from ${count} ${count === 1 ? "rating" : "ratings"}`}
      </span>
      {showCount && (
        <span className="text-[11.5px] text-muted-foreground" aria-hidden>
          {value.toFixed(1)}
          {count !== undefined && ` (${count})`}
        </span>
      )}
    </div>
  );
}
