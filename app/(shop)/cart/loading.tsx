import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <div className="container-page py-12">
      <PageHeaderSkeleton />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-border border-y border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex gap-4 py-4">
              <Skeleton className="size-20 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-40" />
              </div>
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        </ul>

        <div className="h-fit space-y-4 border border-border bg-white p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
