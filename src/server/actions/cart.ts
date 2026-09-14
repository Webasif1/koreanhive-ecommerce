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
import { Combo, Product } from "@/server/models";
import { getCart, resolveCouponForSubtotal } from "@/server/queries/cart";

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

/** Units actually available for a line, or null when it no longer exists. */
async function availableStock(productId: string, variantId: string | null) {
  if (!isValidObjectId(productId)) return null;
  if (variantId && !isValidObjectId(variantId)) return null;

  await connectDb();

  const product = await Product.findOne({ _id: productId, isActive: true })
    .select("stock variants")
    .lean();

  if (!product) return null;

  if (variantId) {
    const variant = product.variants.find((v) => v._id.toString() === variantId);
    return variant ? variant.stock : null;
  }

  return product.stock;
}

export async function updateCartQuantityAction(
  formData: FormData,
): Promise<CartResult> {
  const productId = String(formData.get("productId") ?? "");
  const variantId = (formData.get("variantId") as string | null) || null;
  const requested = sanitizeQuantity(formData.get("quantity"));

  // Stock was never checked here, only at the moment the order was placed —
  // so a shopper could carry a quantity through the whole address form and
  // only be told "just went out of stock" on the last click. Clamp here, and
  // say what happened rather than silently changing the number.
  const stock = await availableStock(productId, variantId);

  if (stock === null) {
    return { ok: false, message: "That product is no longer available." };
  }

  const quantity = Math.max(1, Math.min(requested, stock));

  const items = await readCartCookie();
  const next = items.map((item) =>
    item.productId === productId && item.variantId === variantId
      ? { ...item, quantity }
      : item,
  );

  await writeCartCookie(next);
  revalidatePath("/cart");
  revalidatePath("/checkout");

  if (quantity < requested) {
    return {
      ok: true,
      message:
        stock < MAX_QUANTITY_PER_LINE
          ? `Only ${stock} left in stock.`
          : `${MAX_QUANTITY_PER_LINE} is the most you can order per item.`,
    };
  }

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

  // The cart re-validates dates, usage limit and minimum subtotal when it
  // renders; this only used to check isActive. An expired code therefore
  // toasted "Coupon applied" and the cart then said "That coupon has expired"
  // — and checkout silently dropped it, so the total moved. One validator,
  // used by both, so the two can no longer disagree.
  const cart = await getCart();
  const { coupon, error } = await resolveCouponForSubtotal(code, cart.subtotal);

  if (!coupon) {
    return {
      ok: false,
      message: error ?? `${code} is not a valid coupon code.`,
    };
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

/**
 * Add every product in a bundle, in one click.
 *
 * The combo slug is the only thing the form sends. Members are looked up
 * server-side rather than posted as a list of ids, because a form that names
 * its own products is a form that can be edited to name cheaper ones — the
 * cart is priced from what is in it, so that would be a discount anyone could
 * mint.
 *
 * A member that has since been unpublished is skipped rather than failing the
 * whole click, and the message says how many went in. The sync should have
 * unpublished the combo too, but a shopper mid-session should not meet a dead
 * button because of a race between the two.
 */
export async function addComboToCartAction(
  formData: FormData,
): Promise<CartResult> {
  const slug = String(formData.get("comboSlug") ?? "").trim();
  if (!slug) return { ok: false, message: "That combo is no longer available." };

  await connectDb();

  const combo = await Combo.findOne({ slug, isActive: true })
    .select("name productSlugs")
    .lean();

  if (!combo) {
    return { ok: false, message: "That combo is no longer available." };
  }

  const products = await Product.find({
    slug: { $in: combo.productSlugs },
    isActive: true,
  })
    .select("_id slug")
    .lean();

  const byslug = new Map(products.map((p) => [p.slug, p._id.toString()]));

  let added = 0;
  // sequential, not Promise.all: each merge reads and rewrites the same cookie,
  // so running them together would have the last write win and drop the rest
  for (const productSlug of combo.productSlugs) {
    const productId = byslug.get(productSlug);
    if (!productId) continue;

    await mergeIntoCart({ productId, variantId: null, quantity: 1 });
    added += 1;
  }

  if (added === 0) {
    return { ok: false, message: "That combo is no longer available." };
  }

  revalidatePath("/cart");
  revalidatePath("/checkout");

  return {
    ok: true,
    message:
      added === combo.productSlugs.length
        ? `${combo.name} added to cart`
        : `${added} of ${combo.productSlugs.length} products added — the rest are out of stock`,
  };
}
