import { PER_PAGE } from "@/lib/listing-params";
import { cn } from "@/lib/utils";

/** Square, blush-tinted shimmer that matches the design system. */
export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse bg-blush", className)}
      {...props}
    />
  );
}

/** Mirrors ProductCard so the grid does not reflow when data arrives. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col border border-border bg-card">
      <Skeleton className="aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="mt-1 h-3 w-24" />
        <Skeleton className="mt-2 h-6 w-28" />
        <Skeleton className="mt-3 h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * The full listing shape — sidebar, toolbar, one page of cards.
 *
 * The sidebar column matters: the generic fallback draws only a grid, so the
 * real page arriving pushed everything sideways. Matching the grid template
 * from ProductListing means nothing moves when data lands.
 */
export function ListingSkeleton() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
      <div className="hidden space-y-3 lg:block">
        <Skeleton className="h-[420px] w-full" />
        <Skeleton className="h-40 w-full" />
      </div>

      <div className="space-y-6">
        <Skeleton className="h-[58px] w-full" />
        <ProductGridSkeleton count={PER_PAGE} />
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-10" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Page heading block used by most listing routes. */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-2.5 w-28" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}
