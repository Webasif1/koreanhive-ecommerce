import { cn } from "@/lib/utils";

/**
 * Five stars, filled to `value`, with no count beside them.
 *
 * For a single review's rating and the summary panel. Product cards and pages
 * use components/product/star-rating.tsx, which adds the "4.6 (23)" count.
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
