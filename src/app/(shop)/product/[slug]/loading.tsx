import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the product layout: gallery left, buy box right. */
export default function ProductLoading() {
  return (
    <div className="container-page py-8">
      <Skeleton className="h-3 w-64" />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-square w-full" />

        <div className="space-y-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-40" />

          <div className="space-y-4 border border-border bg-white p-6">
            <Skeleton className="h-9 w-40" />
            <div className="flex gap-2.5">
              <Skeleton className="h-14 w-24" />
              <Skeleton className="h-14 w-24" />
            </div>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-13 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
