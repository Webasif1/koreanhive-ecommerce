import { ListingSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

/**
 * Category listing fallback — the slowest route on the site and the one the header menu points at.
 *
 * Without a loading.tsx, Next holds the old page on screen until the server
 * component resolves. On a listing that is a dozen database round trips to
 * Atlas, that is several seconds in which a tap on "Skincare" appears to have
 * done nothing at all — and the shopper taps again, or leaves.
 *
 * The skeleton is not decoration. It is the difference between "slow" and
 * "broken", and those get very different reactions.
 */
export default function CategoryLoading() {
  return (
    <div className="container-page py-12">
      <PageHeaderSkeleton />
      <ListingSkeleton />
    </div>
  );
}
