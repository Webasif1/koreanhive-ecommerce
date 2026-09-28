import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, FileUp, Pencil, Plus, Search, Trash2 } from "lucide-react";

import {
  PageHeader,
  Panel,
  adminButton,
  chipClass,
} from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { SubmitButton } from "@/components/admin/submit-button";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  deleteProductAction,
  toggleProductActiveAction,
} from "@/server/actions/admin/products";
import {
  PRODUCT_FILTERS,
  type ProductFilter,
  getAdminProducts,
} from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Products" };

const FILTER_LABEL: Record<ProductFilter, string> = {
  ALL: "All",
  ACTIVE: "Active",
  HIDDEN: "Hidden",
  LOW: "Low stock",
};

function productsHref(filter: ProductFilter, q: string) {
  const search = new URLSearchParams();
  if (filter !== "ALL") search.set("filter", filter);
  if (q) search.set("q", q);
  const query = search.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const filter = (PRODUCT_FILTERS as readonly string[]).includes(params.filter ?? "")
    ? (params.filter as ProductFilter)
    : "ALL";
  const products = await getAdminProducts({ q: query, filter });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description={`${products.length.toLocaleString("en-US")} ${
          products.length === 1 ? "product" : "products"
        }${filter !== "ALL" || query ? " match" : " in the catalogue"}`}
        actions={
          <>
            <Link href="/admin/products/import" className={adminButton("outline")}>
              <FileUp />
              Import
            </Link>
            <Link href="/admin/products/new" className={adminButton("primary")}>
              <Plus />
              New product
            </Link>
          </>
        }
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {PRODUCT_FILTERS.map((value) => (
              <Link
                key={value}
                href={productsHref(value, query)}
                className={chipClass(filter === value)}
              >
                {FILTER_LABEL[value]}
              </Link>
            ))}
          </div>

          <form action="/admin/products" className="relative">
            {filter !== "ALL" && <input type="hidden" name="filter" value={filter} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Name, SKU or slug"
              className="h-9 w-full rounded-[10px] border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary md:w-64"
            />
          </form>
        </div>

        {products.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted-foreground">
            {query ? `No products match “${query}”.` : "No products here."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Stock</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-blush/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border bg-muted">
                          {product.images[0] && (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              fill
                              sizes="44px"
                              className="object-contain p-1"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="line-clamp-1 font-medium hover:text-primary"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {product.brand?.name ?? "No brand"}
                            {product.sku ? ` · ${product.sku}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <span className="font-medium">{formatBDT(product.price)}</span>
                      {product.comparePrice && product.comparePrice > product.price ? (
                        <span className="ml-1.5 text-xs text-faint line-through">
                          {formatBDT(product.comparePrice)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex min-w-9 justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                          product.stock === 0
                            ? "bg-sale-bg text-sale"
                            : product.stock <= 5
                              ? "bg-admin-warn-bg text-admin-warn"
                              : "bg-hairline text-foreground",
                        )}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            product.isActive
                              ? "bg-success-bg text-success"
                              : "bg-hairline text-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              product.isActive ? "bg-success" : "bg-light",
                            )}
                          />
                          {product.isActive ? "Active" : "Hidden"}
                        </span>
                        {product.isFeatured && (
                          <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-semibold text-primary">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className={adminButton("outline", "sm")}
                        >
                          <Pencil />
                          Edit
                        </Link>
                        <form action={toggleProductActiveAction}>
                          <input type="hidden" name="id" value={product.id} />
                          <SubmitButton
                            className={adminButton(product.isActive ? "ghost" : "success", "sm")}
                            title={product.isActive ? "Hide from the shop" : "Show in the shop"}
                          >
                            {product.isActive ? <EyeOff /> : <Eye />}
                            {product.isActive ? "Hide" : "Show"}
                          </SubmitButton>
                        </form>
                        <ConfirmAction
                          action={deleteProductAction}
                          fields={{ id: product.id }}
                          trigger={
                            <>
                              <Trash2 />
                              <span className="sr-only">Delete</span>
                            </>
                          }
                          triggerClassName={adminButton("dangerSoft", "sm")}
                          title={`Delete ${product.name}?`}
                          description="This permanently removes the product and its reviews. Past orders keep their own copy of the name and price. To take it off the shop for now, use Hide instead."
                          confirmLabel="Delete product"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
