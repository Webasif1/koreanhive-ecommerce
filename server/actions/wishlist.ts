"use server";

import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";

import { connectDb } from "@/server/db";
import { WishlistItem } from "@/server/models";
import { ensureGuestToken, readGuestToken } from "@/server/wishlist-cookie";

export type WishlistResult = {
  ok: boolean;
  saved: boolean;
  message: string;
};

/** Toggle, so the same heart button both saves and removes. */
export async function toggleWishlistAction(
  formData: FormData,
): Promise<WishlistResult> {
  const productId = String(formData.get("productId") ?? "");
  if (!isValidObjectId(productId)) {
    return { ok: false, saved: false, message: "That product no longer exists." };
  }

  await connectDb();

  const token = await ensureGuestToken();

  const existing = await WishlistItem.findOne({
    guestToken: token,
    productId,
  }).lean();

  if (existing) {
    await WishlistItem.deleteOne({ _id: existing._id });
  } else {
    await WishlistItem.create({ guestToken: token, productId });
  }

  // only the wishlist page renders this data server-side
  revalidatePath("/wishlist");

  return {
    ok: true,
    saved: !existing,
    message: existing ? "Removed from wishlist" : "Saved to wishlist",
  };
}

export async function removeWishlistAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!isValidObjectId(productId)) return;

  const token = await readGuestToken();
  if (!token) return;

  await connectDb();
  await WishlistItem.deleteOne({ guestToken: token, productId });

  revalidatePath("/wishlist");
}
