import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";

import { PageHeader, adminButton } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ProductForm } from "@/components/admin/product-form";
import { deleteProductAction } from "@/server/actions/admin/products";
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
      <PageHeader
        back={
          <Link
            href="/admin/products"
            className="mb-1 inline-block text-sm text-muted-foreground hover:text-primary"
          >
            ← Products
          </Link>
        }
        title={product.name}
        actions={
          <>
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              className={adminButton("outline")}
            >
              <ExternalLink />
              View in shop
            </Link>
            <ConfirmAction
              action={deleteProductAction}
              fields={{ id: product.id, redirect: "list" }}
              trigger={
                <>
                  <Trash2 />
                  Delete
                </>
              }
              triggerClassName={adminButton("dangerSoft")}
              title={`Delete ${product.name}?`}
              description="This permanently removes the product and its reviews. Past orders keep their own copy of the name and price. To take it off the shop for now, untick Active instead."
              confirmLabel="Delete product"
            />
          </>
        }
      />

      <ProductForm
        product={product}
        brands={brands}
        categories={categories}
      />
    </div>
  );
}
