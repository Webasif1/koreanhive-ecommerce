import { ListingSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="container-page py-12">
      <PageHeaderSkeleton />
      <ListingSkeleton />
    </div>
  );
}
