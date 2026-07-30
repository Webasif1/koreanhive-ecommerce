import { PageShell } from "@/components/layout/page-shell";

type BrandPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;

  return (
    <PageShell
      title="Brand"
      description={`Everything Korean Hive stocks from "${slug}".`}
      step="Step 5 (Catalog UI)"
    />
  );
}
