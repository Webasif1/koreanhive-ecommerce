"use server";

import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";

import { connectDb } from "@/server/db";
import { Product, WishlistItem } from "@/server/models";
import { callerIp, rateLimitByCaller } from "@/server/rate-limit";
import { ensureGuestToken, readGuestToken } from "@/server/wishlist-cookie";

/**
 * This is a public, unauthenticated database write. It used to have no rate
 * limit, no check that the product existed, and no cap per guest, so a script
 * could grow the collection without bound — the cheapest way to run up an
 * Atlas bill on this app.
 */
const WINDOW_MS = 60_000;
const MAX_WRITES = 30;
const MAX_ITEMS_PER_GUEST = 100;

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

  const ip = await callerIp();
  if (!rateLimitByCaller("wishlist", ip, MAX_WRITES, WINDOW_MS)) {
    return {
      ok: false,
      saved: false,
      message: "Too many changes. Please wait a moment.",
    };
  }

  await connectDb();

  // a well-formed ObjectId is not the same as a product
  const product = await Product.exists({ _id: productId, isActive: true });
  if (!product) {
    return { ok: false, saved: false, message: "That product no longer exists." };
  }

  const token = await ensureGuestToken();

  const existing = await WishlistItem.findOne({
    guestToken: token,
    productId,
  }).lean();

  if (existing) {
    await WishlistItem.deleteOne({ _id: existing._id });
  } else {
    const saved = await WishlistItem.countDocuments({ guestToken: token });
    if (saved >= MAX_ITEMS_PER_GUEST) {
      return {
        ok: false,
        saved: false,
        message: `Your wishlist is full (${MAX_ITEMS_PER_GUEST} items). Remove something first.`,
      };
    }

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
