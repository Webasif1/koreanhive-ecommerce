import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductGrid } from "@/components/product/product-grid";
import { isProductSort, SortLinks } from "@/components/product/sort-links";
import { getCategoryWithProducts } from "@/server/queries/catalog";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategoryWithProducts(slug);

  if (!result) return { title: "Category Not Found" };

  return {
    title: result.category.metaTitle ?? result.category.name,
    description:
      result.category.metaDescription ??
      result.category.description ??
      undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ slug }, { sort }] = await Promise.all([params, searchParams]);
  const activeSort = isProductSort(sort) ? sort : "newest";
  const result = await getCategoryWithProducts(slug, activeSort);

  if (!result) notFound();

  const { category, products } = result;

  return (
    <div className="container-page py-10 md:py-14">
      <header className="space-y-2">
        {category.parent && (
          <Link
            href={`/category/${category.parent.slug}`}
            className="text-xs uppercase tracking-wide text-muted-foreground hover:text-primary"
          >
            {category.parent.name}
          </Link>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {category.name}
        </h1>
        {category.description && (
          <p className="max-w-2xl text-muted-foreground">
            {category.description}
          </p>
        )}
      </header>

      {category.children.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/category/${child.slug}`}
              className="rounded-full border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6">
        <SortLinks basePath={`/category/${category.slug}`} active={activeSort} />
      </div>

      <div className="mt-8">
        <ProductGrid
          products={products}
          emptyMessage={`Nothing in ${category.name} yet — check back soon.`}
        />
      </div>
    </div>
  );
}
