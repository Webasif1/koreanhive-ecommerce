import Link from "next/link";

import { ImportForm } from "@/components/admin/import-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Import products" };

const COLUMNS = [
  ["slug", "Identity. Falls back to a slug made from the name."],
  ["name", "Required for a new product."],
  ["price", "Whole taka. Required for a new product."],
  ["comparePrice", "The struck-through price."],
  ["stock", "Whole number."],
  ["sku", ""],
  ["brand", "Brand name or slug. Must already exist."],
  ["category", "Category name or slug. Must already exist."],
  ["shortDescription", "The one-line benefit under the product name."],
  ["description, ingredients, howToUse", ""],
  ["images", "Image URLs separated by | — ImageKit links only."],
  ["isActive, isFeatured", "yes/no, true/false or 1/0."],
];

export default function ImportProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Import products</h1>
        <Link href="/admin/products" className="text-sm font-semibold text-primary">
          Back to products
        </Link>
      </div>

      <ImportForm />

      <details className="rounded-xl border bg-card p-5">
        <summary className="cursor-pointer text-sm font-semibold">
          Which columns can I use?
        </summary>

        <p className="mt-3 text-sm text-muted-foreground">
          Headers are matched loosely — <code>Short Description</code>,{" "}
          <code>short_description</code> and <code>SHORTDESCRIPTION</code> are the same column,
          and anything unrecognised is ignored, so your own working columns can stay in the
          sheet.
        </p>

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,14rem)_1fr]">
          {COLUMNS.map(([column, note]) => (
            <div key={column} className="contents">
              <dt className="font-mono text-xs">{column}</dt>
              <dd className="text-muted-foreground">{note || "—"}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-sm text-muted-foreground">
          Variants cannot be expressed in a flat grid, so they are JSON-only — upload a{" "}
          <code>.json</code> file whose products carry a <code>variants</code> array.
        </p>
      </details>
    </div>
  );
}
