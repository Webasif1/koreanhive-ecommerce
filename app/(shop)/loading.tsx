import {
  PageHeaderSkeleton,
  ProductGridSkeleton,
} from "@/components/ui/skeleton";

/** Default storefront fallback — the chrome paints immediately and this
 *  stands in until the route's own data resolves. */
export default function ShopGroupLoading() {
  return (
    <div className="container-page py-12">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
