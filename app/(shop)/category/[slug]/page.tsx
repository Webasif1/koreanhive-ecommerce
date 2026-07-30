import { PageShell } from "@/components/layout/page-shell";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  return (
    <PageShell
      title="Category"
      description={`Products in the "${slug}" category, including its sub-categories.`}
      step="Step 5 (Catalog UI)"
    />
  );
}
