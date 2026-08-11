import { cn } from "@/lib/utils";

/**
 * Design system: gold stars, then "4.9 (216)". Reviews are shown as a count,
 * never as a bare number.
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
  const rounded = Math.round(value);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className="text-[11px] tracking-[0.08em] text-star"
        aria-hidden
      >
        {"★".repeat(rounded)}
        <span className="text-hairline">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="sr-only">{value} out of 5</span>
      {showCount && (
        <span className="text-[11.5px] text-muted-foreground">
          {value.toFixed(1)}
          {count !== undefined && ` (${count})`}
        </span>
      )}
    </div>
  );
}
