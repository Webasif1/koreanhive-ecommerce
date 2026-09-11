"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { isValidObjectId } from "mongoose";

import { requireAdmin } from "@/server/admin-guard";
import { connectDb } from "@/server/db";
import { Review } from "@/server/models";
import { recomputeProductRating } from "@/server/ratings";

/**
 * Moderation.
 *
 * Approval is the only thing that makes a written review public — nothing else
 * in the codebase sets isApproved on one — so these actions are the entire
 * publishing decision for customer words on the storefront. (A rating with no
 * words is approved at submission; see submitReviewAction.)
 *
 * Every change here also moves a product's stars, so each one recomputes that
 * product's rating and invalidates the product caches alongside the review
 * caches.
 */
async function afterChange(productId: string) {
  await recomputeProductRating(productId);

  revalidateTag("reviews", "max");
  revalidateTag("products", "max");
  revalidatePath("/admin/reviews");
}

async function setApproval(id: string, isApproved: boolean) {
  await requireAdmin();
  if (!isValidObjectId(id)) return;
  await connectDb();

  const review = await Review.findOneAndUpdate(
    { _id: id },
    { $set: { isApproved } },
  )
    .select("productId")
    .lean();

  if (review) await afterChange(review.productId.toString());
}

export async function approveReviewAction(formData: FormData) {
  await setApproval(String(formData.get("id") ?? ""), true);
}

/** Unpublish, keeping the row. */
export async function rejectReviewAction(formData: FormData) {
  await setApproval(String(formData.get("id") ?? ""), false);
}

/**
 * Delete outright — for spam and abuse, where leaving the row unapproved is
 * just keeping someone's abuse in the database.
 *
 * findOneAndDelete rather than deleteOne: the product id has to survive the
 * delete, or the product would keep stars from a review that no longer exists.
 */
export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isValidObjectId(id)) return;
  await connectDb();

  const review = await Review.findOneAndDelete({ _id: id })
    .select("productId")
    .lean();

  if (review) await afterChange(review.productId.toString());
}
