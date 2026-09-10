import { PageHeaderSkeleton, ProductGridSkeleton } from "@/components/ui/skeleton";

/**
 * Brand directory fallback — 71 brands, each with a product count behind it.
 *
 * Same reason as the listing routes: with no fallback, Next leaves the
 * previous page up while this one queries, and a tap that changes nothing on
 * screen reads as a broken link rather than a slow one.
 */
export default function BrandsLoading() {
  return (
    <div className="container-page py-12">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
}
