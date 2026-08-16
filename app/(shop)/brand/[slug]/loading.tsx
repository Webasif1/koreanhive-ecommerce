import { ListingSkeleton, PageHeaderSkeleton } from "@/components/ui/skeleton";

export default function BrandLoading() {
  return (
    <div className="container-page py-12">
      <PageHeaderSkeleton />
      <ListingSkeleton />
    </div>
  );
}
