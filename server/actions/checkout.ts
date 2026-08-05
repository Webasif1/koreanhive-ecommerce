"use server";

import { redirect } from "next/navigation";
import { isValidObjectId, Types } from "mongoose";

import { isValidBdPhone, normalizeBdPhone } from "@/lib/bd-districts";
import type { CheckoutState } from "@/lib/checkout-state";
import { calcDiscount, calcShipping, type CouponRule } from "@/lib/pricing";
import {
  grantOrderAccess,
  readCartCookie,
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

  const random = Array.from(
    { length: 4 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
  ).join("");

  return `KH-${stamp}-${random}`;
}

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
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
  const zoneSlug = field(formData, "zoneSlug");

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
  if (!district) {
    errors.district = "Select your district.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const cartItems = await readCartCookie();
  if (cartItems.length === 0) {
    return { ok: false, message: "Your cart is empty.", errors: {} };
  }

  await connectDb();

  const zone = await DeliveryZone.findOne({
    slug: zoneSlug,
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

  const session = await mongoose.startSession();
  let createdNumber: string;

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

    console.error("placeOrderAction failed", error);
    return {
      ok: false,
      message: "Something went wrong placing your order. Please try again.",
      errors: {},
    };
  } finally {
    await session.endSession();
  }

  await writeCartCookie([]);
  await writeCouponCookie(null);
  await grantOrderAccess(createdNumber);

  redirect(`/order/${createdNumber}`);
}
