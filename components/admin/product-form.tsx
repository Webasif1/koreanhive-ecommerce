"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/input";
import { emptyAdminFormState } from "@/lib/admin-state";
import { saveProductAction } from "@/server/actions/admin/products";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  sku: string | null;
  shortDescription: string | null;
  description: string | null;
  ingredients: string | null;
  howToUse: string | null;
  brandId: string | null;
  categoryId: string | null;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  images: { url: string }[];
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
    </Button>
  );
}

export function ProductForm({
  product,
  brands,
  categories,
}: {
  product?: Product;
  brands: { id: string; name: string }[];
  categories: { id: string; name: string; parent: { name: string } | null }[];
}) {
  const [state, formAction] = useActionState(
    saveProductAction,
    emptyAdminFormState,
  );

  return (
    <form action={formAction} className="space-y-8">
      {product && <input type="hidden" name="id" value={product.id} />}

      {state.message && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <section className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            required
            aria-invalid={Boolean(state.errors.name)}
          />
          <FieldError>{state.errors.name}</FieldError>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="slug">
            Slug <span className="text-muted-foreground">(URL)</span>
          </Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={product?.slug}
            placeholder="leave blank to generate from the name"
            aria-invalid={Boolean(state.errors.slug)}
          />
          <FieldError>{state.errors.slug}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="price">Price (৳)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            defaultValue={product?.price}
            required
            aria-invalid={Boolean(state.errors.price)}
          />
          <FieldError>{state.errors.price}</FieldError>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="comparePrice">
            Compare price{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="comparePrice"
            name="comparePrice"
            type="number"
            min={0}
            defaultValue={product?.comparePrice ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={product?.stock ?? 0}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brandId">Brand</Label>
          <Select
            id="brandId"
            name="brandId"
            defaultValue={product?.brandId ?? ""}
          >
            <option value="">— none —</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <Select
            id="categoryId"
            name="categoryId"
            defaultValue={product?.categoryId ?? ""}
          >
            <option value="">— none —</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parent
                  ? `${category.parent.name} › ${category.name}`
                  : category.name}
              </option>
            ))}
          </Select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={product?.isActive ?? true}
          />
          Active (visible in the shop)
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={product?.isFeatured ?? false}
          />
          Featured on the home page
        </label>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-display font-semibold">Content</h2>

        <div className="space-y-1.5">
          <Label htmlFor="shortDescription">Short description</Label>
          <Textarea
            id="shortDescription"
            name="shortDescription"
            defaultValue={product?.shortDescription ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            className="min-h-32"
            defaultValue={product?.description ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ingredients">Ingredients</Label>
          <Textarea
            id="ingredients"
            name="ingredients"
            defaultValue={product?.ingredients ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="howToUse">How to use</Label>
          <Textarea
            id="howToUse"
            name="howToUse"
            defaultValue={product?.howToUse ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="images">Image URLs — one per line</Label>
          <Textarea
            id="images"
            name="images"
            className="min-h-24 font-mono text-xs"
            defaultValue={product?.images.map((i) => i.url).join("\n") ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            Saving replaces the whole list. Hosts must be allowed in
            next.config.ts, otherwise next/image will refuse to load them.
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <h2 className="font-display font-semibold sm:col-span-2">SEO</h2>

        <div className="space-y-1.5">
          <Label htmlFor="metaTitle">Meta title</Label>
          <Input
            id="metaTitle"
            name="metaTitle"
            defaultValue={product?.metaTitle ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="metaDescription">Meta description</Label>
          <Input
            id="metaDescription"
            name="metaDescription"
            defaultValue={product?.metaDescription ?? ""}
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <SubmitButton isEdit={Boolean(product)} />
        <Button variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
