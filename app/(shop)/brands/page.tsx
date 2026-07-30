import type { Metadata } from "next";
import Link from "next/link";

import { getBrands } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "Authentic Korean beauty brands stocked by Korean Hive, delivered across Bangladesh.",
};

export const revalidate = 3600;

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="container-page py-10 md:py-14">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Brands
        </h1>
        <p className="text-muted-foreground">
          Every K-beauty house we stock, sourced direct from Korea.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/brand/${brand.slug}`}
            className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <h2 className="font-display font-semibold group-hover:text-primary">
              {brand.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {brand._count.products}{" "}
              {brand._count.products === 1 ? "product" : "products"}
            </p>
            {brand.description && (
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {brand.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
