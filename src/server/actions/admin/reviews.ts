"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdmin } from "@/server/admin-guard";
import { connectDb } from "@/server/db";
import { Review } from "@/server/models";

/**
 * Moderation.
 *
 * Approval is the only thing that makes a review public — nothing else in the
 * codebase sets isApproved — so these two actions are the entire publishing
 * decision for customer words on the storefront.
 */
async function setApproval(id: string, isApproved: boolean) {
  await requireAdmin();
  await connectDb();

  await Review.updateOne({ _id: id }, { $set: { isApproved } });

  revalidateTag("reviews", "max");
  revalidatePath("/admin/reviews");
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
 */
export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  await connectDb();

  await Review.deleteOne({ _id: String(formData.get("id") ?? "") });

  revalidateTag("reviews", "max");
  revalidatePath("/admin/reviews");
}
