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
