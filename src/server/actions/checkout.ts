"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { isValidObjectId, Types } from "mongoose";

import {
  isBdDistrict,
  isValidBdPhone,
  normalizeBdPhone,
  zoneSlugForDistrict,
} from "@/lib/bd-districts";
import type { CheckoutState } from "@/lib/checkout-state";
import { calcDiscount, calcShipping, type CouponRule } from "@/lib/pricing";
import {
  grantOrderAccess,
  readCartCookie,
  readCartToken,
  readLastOrder,
  readCouponCookie,
  writeCartCookie,
  writeCouponCookie,
} from "@/server/cart-cookie";
import { connectDb, mongoose } from "@/server/db";
import { Coupon, DeliveryZone, Order, Product } from "@/server/models";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

function orderNumber() {
  const now = new Date();
  const stamp = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  // crypto, not Math.random: order numbers are handed out in public and
  // should not be predictable from one another
  const bytes = randomBytes(5);
  const random = Array.from(
    { length: 5 },
    (_, i) => ALPHABET[bytes[i] % ALPHABET.length],
  ).join("");

  return `KH-${stamp}-${random}`;
}

/**
 * Trimmed and length-capped.
 *
 * Nothing here used to have an upper bound, and no string field in the schema
 * carries `maxlength`, so an unauthenticated caller could push a multi-megabyte
 * note into the one collection that cannot be regenerated. The caps are
 * generous enough that no real address hits them.
 */
const MAX_LENGTHS: Record<string, number> = {
  customerName: 120,
  customerPhone: 20,
  customerEmail: 160,
  addressLine: 300,
  area: 120,
  district: 40,
  postalCode: 10,
  note: 500,
};

function field(formData: FormData, name: string) {
  const raw = String(formData.get(name) ?? "").trim();
  const cap = MAX_LENGTHS[name];
  return cap ? raw.slice(0, cap) : raw;
}

/** Mongo duplicate-key errors carry the offending index in `keyPattern`. */
function duplicateKeyOn(error: unknown, field: string) {
  const candidate = error as { code?: number; keyPattern?: Record<string, unknown> };
  return candidate?.code === 11000 && Boolean(candidate.keyPattern?.[field]);
}

export async function placeOrderAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const customerName = field(formData, "customerName");
  const customerPhone = field(formData, "customerPhone");
  const customerEmail = field(formData, "customerEmail");
  const addressLine = field(formData, "addressLine");
  const area = field(formData, "area");
  const district = field(formData, "district");
  const postalCode = field(formData, "postalCode");
  const note = field(formData, "note");

  const errors: Record<string, string> = {};

  if (customerName.length < 2) {
    errors.customerName = "Please enter your full name.";
  }
  if (!isValidBdPhone(customerPhone)) {
    errors.customerPhone = "Enter a valid Bangladeshi mobile number.";
  }
  if (customerEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail)) {
    errors.customerEmail = "That email address does not look right.";
  }
  if (addressLine.length < 6) {
    errors.addressLine = "Enter your full address, including house and road.";
  }
  if (area.length < 2) {
    errors.area = "Enter your area or thana.";
  }
  // an allow-list, not a presence check: the district decides the delivery
  // charge below, and it is also stored on the order as the courier's
  // destination, so an arbitrary string must never get that far
  if (!isBdDistrict(district)) {
    errors.district = "Select your district.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const cartItems = await readCartCookie();

  if (cartItems.length === 0) {
    /**
     * A second submission that lost the race gets here: the winner already
     * committed and cleared the cart cookie, so this request finds nothing to
     * order. "Your cart is empty" is technically true and completely baffling
     * to someone who just pressed Place Order — show them the order that was
     * actually created instead.
     */
    const lastOrder = await readLastOrder();
    if (lastOrder) redirect(`/order/${lastOrder}`);

    return { ok: false, message: "Your cart is empty.", errors: {} };
  }

  await connectDb();

  // Derived from the district here, never read from the form. The checkout
  // form computes the same thing for display, but a submitted zone would let
  // anyone pick their own delivery charge — Inside Dhaka is half the price of
  // Outside and has a lower free-shipping threshold.
  const zone = await DeliveryZone.findOne({
    slug: zoneSlugForDistrict(district),
    isActive: true,
  }).lean();

  if (!zone) {
    return {
      ok: false,
      message: "We could not work out a delivery zone for that district.",
      errors: { district: "Unsupported delivery area." },
    };
  }

  const couponCode = await readCouponCookie();

  const products = await Product.find({
    _id: {
      $in: cartItems
        .map((i) => i.productId)
        .filter((id) => isValidObjectId(id)),
    },
    isActive: true,
  })
    .select("name slug price stock images variants")
    .lean();

  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lines = cartItems.flatMap((item) => {
    const product = byId.get(item.productId);
    if (!product) return [];

    const variant = item.variantId
      ? (product.variants.find((v) => v._id.toString() === item.variantId) ??
        null)
      : null;
    if (item.variantId && !variant) return [];

    // prices come from the database, never from the client
    const unitPrice = variant?.price ?? product.price;
    const firstImage = [...(product.images ?? [])].sort(
      (a, b) => a.position - b.position,
    )[0];

    return [
      {
        productId: product._id,
        variantId: variant?._id ?? null,
        productName: product.name,
        productSlug: product.slug,
        variantName: variant?.name ?? null,
        imageUrl: firstImage?.url ?? null,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      },
    ];
  });

  if (lines.length === 0) {
    return { ok: false, message: "Your cart is empty.", errors: {} };
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  const couponRow = couponCode ? await Coupon.findOne({ code: couponCode }) : null;

  /**
   * Idempotency.
   *
   * One filled cart mints one token (server/cart-cookie.ts) and every tab in
   * the same browser submits it. Before this existed, two tabs submitting at
   * once both read a full cart, both passed the stock check and both wrote an
   * order — the cart cookie is only cleared *after* the transaction commits,
   * so the window was the whole length of it. On cash on delivery that is two
   * parcels dispatched and two courier fees for one intended purchase.
   *
   * The cheap check first: if this cart already produced an order, show that
   * order rather than making another.
   */
  const cartToken = await readCartToken();

  if (cartToken) {
    const existing = await Order.findOne({ checkoutToken: cartToken })
      .select("orderNumber")
      .lean();

    if (existing) {
      await writeCartCookie([]);
      await writeCouponCookie(null);
      await grantOrderAccess(existing.orderNumber);
      redirect(`/order/${existing.orderNumber}`);
    }
  }

  const session = await mongoose.startSession();
  let createdNumber: string | null = null;
  /** Set when a concurrent request won the race for this cart. */
  let duplicateOf: string | null = null;

  try {
    createdNumber = await session.withTransaction(async () => {
      // Conditional decrements: a document only updates while stock still
      // covers the quantity, so concurrent checkouts cannot oversell. The
      // filter and the update are evaluated atomically per document.
      for (const line of lines) {
        const result = line.variantId
          ? await Product.updateOne(
              {
                _id: line.productId,
                variants: {
                  $elemMatch: {
                    _id: line.variantId,
                    stock: { $gte: line.quantity },
                  },
                },
              },
              { $inc: { "variants.$.stock": -line.quantity } },
              { session },
            )
          : await Product.updateOne(
              { _id: line.productId, stock: { $gte: line.quantity } },
              { $inc: { stock: -line.quantity } },
              { session },
            );

        if (result.modifiedCount !== 1) {
          throw new Error(`OUT_OF_STOCK:${line.productName}`);
        }
      }

      let coupon: CouponRule | null = null;
      let couponId: Types.ObjectId | null = null;

      if (couponRow) {
        const now = new Date();
        const limit = couponRow.usageLimit ?? null;

        const usable =
          couponRow.isActive &&
          (!couponRow.startsAt || couponRow.startsAt <= now) &&
          (!couponRow.endsAt || couponRow.endsAt >= now) &&
          (limit === null || couponRow.usedCount < limit) &&
          (!couponRow.minSubtotal || subtotal >= couponRow.minSubtotal);

        if (usable) {
          // guard the limit again at write time
          const claimed = await Coupon.updateOne(
            {
              _id: couponRow._id,
              ...(limit === null ? {} : { usedCount: { $lt: limit } }),
            },
            { $inc: { usedCount: 1 } },
            { session },
          );

          if (claimed.modifiedCount === 1) {
            coupon = {
              code: couponRow.code,
              type: couponRow.type,
              value: couponRow.value,
              minSubtotal: couponRow.minSubtotal ?? null,
              maxDiscount: couponRow.maxDiscount ?? null,
            };
            couponId = couponRow._id;
          }
        }
      }

      const discount = calcDiscount(subtotal, coupon);
      const shippingCharge = calcShipping(subtotal, {
        charge: zone.charge,
        freeShippingThreshold: zone.freeShippingThreshold ?? null,
      });
      const total = subtotal - discount + shippingCharge;

      const number = orderNumber();

      await Order.create(
        [
          {
            orderNumber: number,
            checkoutToken: cartToken,
            customerName,
            customerPhone: normalizeBdPhone(customerPhone),
            customerEmail: customerEmail || null,
            addressLine,
            area,
            district,
            postalCode: postalCode || null,
            note: note || null,
            deliveryZoneId: zone._id,
            couponId,
            couponCode: coupon?.code ?? null,
            subtotal,
            discount,
            shippingCharge,
            total,
            status: "PENDING",
            paymentMethod: "COD",
            paymentStatus: "UNPAID",
            items: lines,
            statusHistory: [
              {
                status: "PENDING",
                note: "Order placed — cash on delivery.",
                createdBy: "system",
              },
            ],
          },
        ],
        { session },
      );

      return number;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("OUT_OF_STOCK:")) {
      return {
        ok: false,
        message: `${message.split(":")[1]} just went out of stock. Please adjust your cart.`,
        errors: {},
      };
    }

    // The other request for this cart committed first. Its order is the real
    // one; hand this tab the same confirmation instead of a second order.
    if (duplicateKeyOn(error, "checkoutToken") && cartToken) {
      const winner = await Order.findOne({ checkoutToken: cartToken })
        .select("orderNumber")
        .lean();

      if (winner) {
        duplicateOf = winner.orderNumber;
      } else {
        console.error("placeOrderAction: duplicate token with no order", error);
        return {
          ok: false,
          message: "Something went wrong placing your order. Please try again.",
          errors: {},
        };
      }
    } else if (duplicateKeyOn(error, "orderNumber")) {
      // Five random characters over a 32-character alphabet makes this
      // remote, and retrying is now safe: the cart token means a retry can
      // only ever produce the one order.
      console.error("placeOrderAction: order number collision", error);
      return {
        ok: false,
        message: "That did not go through. Please press Place Order once more.",
        errors: {},
      };
    } else {
      console.error("placeOrderAction failed", error);
      return {
        ok: false,
        message: "Something went wrong placing your order. Please try again.",
        errors: {},
      };
    }
  } finally {
    await session.endSession();
  }

  const finalNumber = duplicateOf ?? createdNumber;

  if (!finalNumber) {
    // Unreachable: the transaction either returns a number or throws, and
    // every throw path above returns. Belt and braces so a future edit cannot
    // redirect to /order/null.
    return {
      ok: false,
      message: "Something went wrong placing your order. Please try again.",
      errors: {},
    };
  }

  await writeCartCookie([]);
  await writeCouponCookie(null);
  await grantOrderAccess(finalNumber);

  redirect(`/order/${finalNumber}`);
}
