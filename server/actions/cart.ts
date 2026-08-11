"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

import {
  MAX_QUANTITY_PER_LINE,
  readCartCookie,
  writeCartCookie,
  writeCouponCookie,
  type CartCookieItem,
} from "@/server/cart-cookie";
import { connectDb } from "@/server/db";
import { Coupon, Product } from "@/server/models";

type AddInput = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

function sanitizeQuantity(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, Math.floor(parsed)));
}

/** Confirms the product/variant exists and is sellable before it can enter
 *  the cookie — otherwise a crafted form post could park junk in the cart. */
async function assertSellable({ productId, variantId }: AddInput) {
  // guard first: a malformed id would make Mongoose throw a CastError
  if (!isValidObjectId(productId)) return false;
  if (variantId && !isValidObjectId(variantId)) return false;

  await connectDb();

  const product = await Product.findOne({ _id: productId, isActive: true })
    .select("variants")
    .lean();

  if (!product) return false;
  if (
    variantId &&
    !product.variants.some((v) => v._id.toString() === variantId)
  ) {
    return false;
  }
  return true;
}

async function mergeIntoCart(input: AddInput) {
  const items = await readCartCookie();
  const index = items.findIndex(
    (i) => i.productId === input.productId && i.variantId === input.variantId,
  );

  const next: CartCookieItem[] = [...items];

  if (index >= 0) {
    next[index] = {
      ...next[index],
      quantity: Math.min(
        MAX_QUANTITY_PER_LINE,
        next[index].quantity + input.quantity,
      ),
    };
  } else {
    next.push(input);
  }

  await writeCartCookie(next);
}

export type CartResult = { ok: boolean; message: string };

export async function addToCartAction(
  formData: FormData,
): Promise<CartResult> {
  const input: AddInput = {
    productId: String(formData.get("productId") ?? ""),
    variantId: (formData.get("variantId") as string | null) || null,
    quantity: sanitizeQuantity(formData.get("quantity")),
  };

  if (!(await assertSellable(input))) {
    return { ok: false, message: "That product is no longer available." };
  }

  await mergeIntoCart(input);

  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { ok: true, message: "Added to cart" };
}

/** Buy Now: same merge, then straight to checkout. Existing cart lines are
 *  kept rather than discarded, so nothing is lost by clicking it. */
export async function buyNowAction(formData: FormData) {
  const input: AddInput = {
    productId: String(formData.get("productId") ?? ""),
    variantId: (formData.get("variantId") as string | null) || null,
    quantity: sanitizeQuantity(formData.get("quantity")),
  };

  if (!(await assertSellable(input))) {
    redirect("/cart");
  }

  await mergeIntoCart(input);

  revalidatePath("/cart");
  redirect("/checkout");
}

export async function updateCartQuantityAction(
  formData: FormData,
): Promise<CartResult> {
  const productId = String(formData.get("productId") ?? "");
  const variantId = (formData.get("variantId") as string | null) || null;
  const quantity = sanitizeQuantity(formData.get("quantity"));

  const items = await readCartCookie();
  const next = items.map((item) =>
    item.productId === productId && item.variantId === variantId
      ? { ...item, quantity }
      : item,
  );

  await writeCartCookie(next);
  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { ok: true, message: "Cart updated" };
}

export async function removeCartLineAction(
  formData: FormData,
): Promise<CartResult> {
  const productId = String(formData.get("productId") ?? "");
  const variantId = (formData.get("variantId") as string | null) || null;

  const items = await readCartCookie();
  await writeCartCookie(
    items.filter(
      (item) => !(item.productId === productId && item.variantId === variantId),
    ),
  );

  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { ok: true, message: "Removed from cart" };
}

/** Validates the code here rather than only at render, so the toast can say
 *  what is actually wrong instead of the cart silently ignoring it. */
export async function applyCouponAction(
  formData: FormData,
): Promise<CartResult> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();

  if (!code) {
    await writeCouponCookie(null);
    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { ok: true, message: "Coupon removed" };
  }

  await connectDb();
  const coupon = await Coupon.findOne({ code }).lean();

  if (!coupon || !coupon.isActive) {
    return { ok: false, message: `${code} is not a valid coupon code.` };
  }

  await writeCouponCookie(code);

  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { ok: true, message: `Coupon ${code} applied` };
}

export async function clearCouponAction(): Promise<CartResult> {
  await writeCouponCookie(null);
  revalidatePath("/cart");
  revalidatePath("/checkout");

  return { ok: true, message: "Coupon removed" };
}
