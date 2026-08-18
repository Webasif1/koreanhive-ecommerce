import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { getAdminProduct, getProductFormOptions } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, { brands, categories }] = await Promise.all([
    getAdminProduct(id),
    getProductFormOptions(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {product.name}
        </h1>
        <Link
          href={`/product/${product.slug}`}
          className="text-sm text-primary hover:underline"
        >
          View in shop ↗
        </Link>
      </div>

      <ProductForm
        product={product}
        brands={brands}
        categories={categories}
      />
    </div>
  );
}
