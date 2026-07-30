import { PageShell } from "@/components/layout/page-shell";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return (
    <PageShell
      title="Product"
      description={`Gallery, ingredients, how-to-use and related products for "${slug}".`}
      step="Step 5 (Catalog UI)"
    />
  );
}
