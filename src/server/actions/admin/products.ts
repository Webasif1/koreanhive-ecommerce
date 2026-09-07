"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

import type { AdminFormState } from "@/lib/admin-state";
import { slugify } from "@/lib/slugify";
import { requireAdmin } from "@/server/admin-guard";
import { connectDb } from "@/server/db";
import { Product } from "@/server/models";

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

  const comparePrice = intOrNull(formData.get("comparePrice"));

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Name is required.";
  if (name.length > 200) errors.name = "Keep the name under 200 characters.";
  if (!slug) errors.slug = "Slug is required.";
  if (price === null || price < 0) errors.price = "Enter a valid price.";

  /**
   * Mongoose does not run schema validators on updateOne unless it is told
   * to, so `min: 0` on stock and comparePrice never fired on an edit — a
   * negative value went straight into the database. These checks are the real
   * gate; `runValidators` below is the backstop.
   *
   * comparePrice must also sit *above* price, or the storefront renders a
   * "saving" that is zero or negative and /deals lists a product that is not
   * discounted.
   */
  if (stock < 0) errors.stock = "Stock cannot be negative.";
  if (comparePrice !== null && comparePrice < 0) {
    errors.comparePrice = "Compare price cannot be negative.";
  }
  if (
    comparePrice !== null &&
    comparePrice > 0 &&
    price !== null &&
    comparePrice <= price
  ) {
    errors.comparePrice =
      "Compare price must be higher than the price, or left empty.";
  }

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
    comparePrice,
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
    if (!isValidObjectId(id)) {
      return {
        ok: false,
        message: "That product could not be found.",
        errors: {},
      };
    }
    await Product.updateOne({ _id: id }, { $set: data }, { runValidators: true });
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
