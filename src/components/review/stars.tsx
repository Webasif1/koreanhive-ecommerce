import { cn } from "@/lib/utils";

/**
 * Five stars, filled to `value`.
 *
 * Separate from components/product/star-rating.tsx, which hides itself behind
 * siteConfig.showRatings because the numbers on a product came from the import
 * sheet rather than from customers. A review carries its own rating, left by
 * a verified buyer, so there is nothing here to suppress.
 */
export function Stars({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span className={cn("text-[13px] tracking-[0.1em] text-star", className)}>
      <span aria-hidden>
        {"★".repeat(filled)}
        <span className="text-hairline">{"★".repeat(5 - filled)}</span>
      </span>
      <span className="sr-only">{value} out of 5</span>
    </span>
  );
}
