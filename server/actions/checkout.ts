"use server";

import { redirect } from "next/navigation";

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
import { db } from "@/server/db";

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

  const zone = await db.deliveryZone.findFirst({
    where: { slug: zoneSlug, isActive: true },
  });

  if (!zone) {
    return {
      ok: false,
      message: "We could not work out a delivery zone for that district.",
      errors: { district: "Unsupported delivery area." },
    };
  }

  const couponCode = await readCouponCookie();

  // Read the catalogue *before* opening the transaction. Neon is a remote
  // database, and holding a transaction open across these reads blew the
  // interactive-transaction timeout. Stock is still safe: the decrements
  // below are conditional, so a stale read cannot oversell.
  const products = await db.product.findMany({
    where: {
      id: { in: cartItems.map((i) => i.productId) },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      stock: true,
      images: {
        orderBy: { position: "asc" },
        take: 1,
        select: { url: true },
      },
      variants: {
        select: { id: true, name: true, price: true, stock: true },
      },
    },
  });

  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = cartItems.flatMap((item) => {
    const product = byId.get(item.productId);
    if (!product) return [];

    const variant = item.variantId
      ? (product.variants.find((v) => v.id === item.variantId) ?? null)
      : null;
    if (item.variantId && !variant) return [];

    // prices come from the database, never from the client
    const unitPrice = variant?.price ?? product.price;

    return [
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        productName: product.name,
        productSlug: product.slug,
        variantName: variant?.name ?? null,
        imageUrl: product.images[0]?.url ?? null,
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

  // Validate the coupon outside the transaction too; only the usage claim
  // has to be atomic.
  const couponRow = couponCode
    ? await db.coupon.findUnique({ where: { code: couponCode } })
    : null;

  let createdNumber: string;

  try {
    createdNumber = await db.$transaction(async (tx) => {
      // conditional decrements: a row only updates while stock still covers
      // the quantity, so concurrent checkouts cannot oversell
      for (const line of lines) {
        const result = line.variantId
          ? await tx.productVariant.updateMany({
              where: { id: line.variantId, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            })
          : await tx.product.updateMany({
              where: { id: line.productId, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            });

        if (result.count !== 1) {
          throw new Error(`OUT_OF_STOCK:${line.productName}`);
        }
      }

      let coupon: CouponRule | null = null;
      let couponId: string | null = null;

      {
        const found = couponRow;
        const now = new Date();

        const usable =
          found &&
          found.isActive &&
          (!found.startsAt || found.startsAt <= now) &&
          (!found.endsAt || found.endsAt >= now) &&
          (found.usageLimit === null || found.usedCount < found.usageLimit) &&
          (!found.minSubtotal || subtotal >= found.minSubtotal);

        if (usable && found) {
          // guard the limit again at write time
          const claimed = await tx.coupon.updateMany({
            where: {
              id: found.id,
              OR: [
                { usageLimit: null },
                { usedCount: { lt: found.usageLimit ?? 0 } },
              ],
            },
            data: { usedCount: { increment: 1 } },
          });

          if (claimed.count === 1) {
            coupon = {
              code: found.code,
              type: found.type,
              value: found.value,
              minSubtotal: found.minSubtotal,
              maxDiscount: found.maxDiscount,
            };
            couponId = found.id;
          }
        }
      }

      const discount = calcDiscount(subtotal, coupon);
      const shippingCharge = calcShipping(subtotal, zone);
      const total = subtotal - discount + shippingCharge;

      const number = orderNumber();

      await tx.order.create({
        data: {
          orderNumber: number,
          customerName,
          customerPhone: normalizeBdPhone(customerPhone),
          customerEmail: customerEmail || null,
          addressLine,
          area,
          district,
          postalCode: postalCode || null,
          note: note || null,
          deliveryZoneId: zone.id,
          couponId,
          couponCode: coupon?.code ?? null,
          subtotal,
          discount,
          shippingCharge,
          total,
          status: "PENDING",
          paymentMethod: "COD",
          paymentStatus: "UNPAID",
          items: { createMany: { data: lines } },
          statusHistory: {
            create: {
              status: "PENDING",
              note: "Order placed — cash on delivery.",
              createdBy: "system",
            },
          },
        },
      });

      return number;
    },
    {
      // Neon round-trips are slow from here; the default 5s is not enough
      // for the stock decrements plus the order write.
      maxWait: 10_000,
      timeout: 20_000,
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
    if (message === "EMPTY_CART") {
      return { ok: false, message: "Your cart is empty.", errors: {} };
    }

    console.error("placeOrderAction failed", error);
    return {
      ok: false,
      message: "Something went wrong placing your order. Please try again.",
      errors: {},
    };
  }

  await writeCartCookie([]);
  await writeCouponCookie(null);
  await grantOrderAccess(createdNumber);

  redirect(`/order/${createdNumber}`);
}
