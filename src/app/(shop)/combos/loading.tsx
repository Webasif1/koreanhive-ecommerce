import { PageHeaderSkeleton, ProductGridSkeleton } from "@/components/ui/skeleton";

/**
 * Combos fallback.
 *
 * Same reason as the listing routes: with no fallback, Next leaves the
 * previous page up while this one queries, and a tap that changes nothing on
 * screen reads as a broken link rather than a slow one.
 */
export default function CombosLoading() {
  return (
    <div className="container-page py-12">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}
