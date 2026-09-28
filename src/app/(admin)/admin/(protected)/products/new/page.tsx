import Link from "next/link";

import { PageHeader } from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { getProductFormOptions } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const { brands, categories } = await getProductFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        back={
          <Link
            href="/admin/products"
            className="mb-1 inline-block text-sm text-muted-foreground hover:text-primary"
          >
            ← Products
          </Link>
        }
        title="New product"
      />
      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
