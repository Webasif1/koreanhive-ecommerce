import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductListing } from "@/components/product/product-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import {
  parseListingParams,
  type ListingSearchParams,
} from "@/lib/listing-params";
import { getCatalogListing, getCategoryScope } from "@/server/queries/catalog";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ListingSearchParams>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const scope = await getCategoryScope(slug);

  if (!scope) return { title: "Category Not Found" };

  return {
    title: scope.category.metaTitle ?? scope.category.name,
    description:
      scope.category.metaDescription ?? scope.category.description ?? undefined,
    // filter and sort combinations are the same listing
    alternates: { canonical: `/category/${scope.category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ slug }, rawParams] = await Promise.all([params, searchParams]);
  const { sort, filters } = parseListingParams(rawParams);

  const scope = await getCategoryScope(slug);
  if (!scope) notFound();

  const { category, categoryIds } = scope;

  const listing = await getCatalogListing({
    scope: { categoryId: { $in: categoryIds } },
    filters,
    sort,
  });

  return (
    <div className="container-page py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          ...(category.parent
            ? [
                {
                  name: category.parent.name,
                  path: `/category/${category.parent.slug}`,
                },
              ]
            : []),
          { name: category.name, path: `/category/${category.slug}` },
        ])}
      />

      <header className="space-y-2">
        {category.parent && (
          <Link
            href={`/category/${category.parent.slug}`}
            className="eyebrow hover:text-mulberry-hover"
          >
            {category.parent.name}
          </Link>
        )}
        <h1 className="font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
          {category.name}
        </h1>
        {category.description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
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
              className="border border-chip-border bg-blush px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <ProductListing
        listing={listing}
        sort={sort}
        emptyMessage={`Nothing in ${category.name} matches those filters.`}
      />
    </div>
  );
}
