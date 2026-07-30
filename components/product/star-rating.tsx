import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  count?: number;
  className?: string;
};

export function StarRating({ value, count, className }: StarRatingProps) {
  const rounded = Math.round(value);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5",
              i <= rounded
                ? "fill-gold text-gold"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        ))}
      </span>
      <span className="sr-only">{value.toFixed(1)} out of 5</span>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
