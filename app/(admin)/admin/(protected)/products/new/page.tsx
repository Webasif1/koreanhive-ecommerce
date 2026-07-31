import { ProductForm } from "@/components/admin/product-form";
import { getProductFormOptions } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const { brands, categories } = await getProductFormOptions();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        New product
      </h1>
      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
