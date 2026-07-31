"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AdminFormState } from "@/lib/admin-state";
import { requireAdmin } from "@/server/admin-guard";
import { db } from "@/server/db";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function intOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export async function saveProductAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const price = intOrNull(formData.get("price"));
  const stock = intOrNull(formData.get("stock")) ?? 0;

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Name is required.";
  if (!slug) errors.slug = "Slug is required.";
  if (price === null || price < 0) errors.price = "Enter a valid price.";

  // slugs are the product URL, so a collision would silently break a page
  const clash = await db.product.findFirst({
    where: { slug, ...(id ? { id: { not: id } } : {}) },
    select: { id: true },
  });
  if (clash) errors.slug = "Another product already uses that slug.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const imageUrls = String(formData.get("images") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const data = {
    name,
    slug,
    price: price!,
    comparePrice: intOrNull(formData.get("comparePrice")),
    stock,
    sku: String(formData.get("sku") ?? "").trim() || null,
    shortDescription:
      String(formData.get("shortDescription") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    ingredients: String(formData.get("ingredients") ?? "").trim() || null,
    howToUse: String(formData.get("howToUse") ?? "").trim() || null,
    brandId: String(formData.get("brandId") ?? "") || null,
    categoryId: String(formData.get("categoryId") ?? "") || null,
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    metaTitle: String(formData.get("metaTitle") ?? "").trim() || null,
    metaDescription:
      String(formData.get("metaDescription") ?? "").trim() || null,
  };

  const product = id
    ? await db.product.update({ where: { id }, data })
    : await db.product.create({ data });

  // images are replaced wholesale — the textarea is the source of truth
  await db.productImage.deleteMany({ where: { productId: product.id } });
  if (imageUrls.length > 0) {
    await db.productImage.createMany({
      data: imageUrls.map((url, index) => ({
        productId: product.id,
        url,
        alt: name,
        position: index,
      })),
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/product/${slug}`);

  redirect("/admin/products");
}

export async function toggleProductActiveAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const product = await db.product.findUnique({
    where: { id },
    select: { isActive: true, slug: true },
  });
  if (!product) return;

  await db.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/product/${product.slug}`);
}

/** Deactivates rather than deletes: OrderItem keeps a nullable reference to
 *  the product, and wiping the row would strip it from order history. */
export async function archiveProductAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");

  await db.product.update({
    where: { id },
    data: { isActive: false, isFeatured: false },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
}
