"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

import type { AdminFormState } from "@/lib/admin-state";
import { requireAdmin } from "@/server/admin-guard";
import { connectDb } from "@/server/db";
import { Product } from "@/server/models";

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

function objectIdOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw && isValidObjectId(raw) ? raw : null;
}

export async function saveProductAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  await connectDb();

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
  const clash = await Product.findOne({
    slug,
    ...(id ? { _id: { $ne: id } } : {}),
  })
    .select("_id")
    .lean();
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
    brandId: objectIdOrNull(formData.get("brandId")),
    categoryId: objectIdOrNull(formData.get("categoryId")),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    metaTitle: String(formData.get("metaTitle") ?? "").trim() || null,
    metaDescription:
      String(formData.get("metaDescription") ?? "").trim() || null,
    // images are replaced wholesale — the textarea is the source of truth
    images: imageUrls.map((url, index) => ({
      url,
      alt: name,
      position: index,
    })),
  };

  if (id) {
    await Product.updateOne({ _id: id }, { $set: data });
  } else {
    await Product.create(data);
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/product/${slug}`);
  // search suggestions, cart recommendations and the chat catalogue are
  // unstable_cache entries tagged "products" — revalidatePath does not clear
  // those, so without this an edited price stays stale for up to an hour
  revalidateTag("products", "max");

  redirect("/admin/products");
}

export async function toggleProductActiveAction(formData: FormData) {
  await requireAdmin();
  await connectDb();

  const id = String(formData.get("id") ?? "");
  if (!isValidObjectId(id)) return;

  const product = await Product.findById(id).select("isActive slug").lean();
  if (!product) return;

  await Product.updateOne({ _id: id }, { $set: { isActive: !product.isActive } });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/product/${product.slug}`);
  revalidateTag("products", "max");
}

/** Deactivates rather than deletes: order items keep a reference to the
 *  product, and removing the document would strip it from order history. */
export async function archiveProductAction(formData: FormData) {
  await requireAdmin();
  await connectDb();

  const id = String(formData.get("id") ?? "");
  if (!isValidObjectId(id)) return;

  await Product.updateOne(
    { _id: id },
    { $set: { isActive: false, isFeatured: false } },
  );

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidateTag("products", "max");
}
