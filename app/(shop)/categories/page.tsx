import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getCategoryTree } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Cleansers, toners, essences, serums, sunscreen and more — shop Korean beauty by routine step.",
};

export const revalidate = 3600;

export default async function CategoriesPage() {
  const tree = await getCategoryTree();

  return (
    <div className="container-page py-10 md:py-14">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Categories
        </h1>
        <p className="text-muted-foreground">
          Browse by routine step and skin concern.
        </p>
      </header>

      <div className="mt-8 space-y-10">
        {tree.map((parent) => (
          <section key={parent.id}>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              <Link
                href={`/category/${parent.slug}`}
                className="hover:text-primary"
              >
                {parent.name}
              </Link>
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {parent.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-4/3 bg-muted">
                    {child.imageUrl && (
                      <Image
                        src={child.imageUrl}
                        alt={child.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium group-hover:text-primary">
                      {child.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {child._count.products}{" "}
                      {child._count.products === 1 ? "product" : "products"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
