"use server";

import { revalidatePath } from "next/cache";

import type { OrderStatusValue } from "@/lib/order-status";
import { requireAdmin } from "@/server/admin-guard";
import { connectDb, mongoose } from "@/server/db";
import { Order, Product } from "@/server/models";

const RESTOCKING_STATUSES = new Set(["CANCELLED", "RETURNED"]);
const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;

/**
 * Moves an order to a new status and records why. Two side effects are
 * deliberate:
 *  - cancelling or returning puts the stock back, once
 *  - marking a COD order delivered marks it paid, because the courier has
 *    collected the cash by then
 */
export async function updateOrderStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  await connectDb();

  const orderNumber = String(formData.get("orderNumber") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatusValue;
  const note = String(formData.get("note") ?? "").trim();

  const order = await Order.findOne({ orderNumber }).lean();

  if (!order || order.status === status) return;

  const shouldRestock =
    RESTOCKING_STATUSES.has(status) && !RESTOCKING_STATUSES.has(order.status);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (shouldRestock) {
        for (const item of order.items) {
          if (!item.productId) continue;

          if (item.variantId) {
            await Product.updateOne(
              { _id: item.productId, "variants._id": item.variantId },
              { $inc: { "variants.$.stock": item.quantity } },
              { session },
            );
          } else {
            await Product.updateOne(
              { _id: item.productId },
              { $inc: { stock: item.quantity } },
              { session },
            );
          }
        }
      }

      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            status,
            paymentStatus:
              status === "DELIVERED" && order.paymentMethod === "COD"
                ? "PAID"
                : order.paymentStatus,
          },
          $push: {
            statusHistory: {
              status,
              note: note || null,
              createdBy: admin.email ?? "admin",
              createdAt: new Date(),
            },
          },
        },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderNumber}`);
}

export async function updatePaymentStatusAction(formData: FormData) {
  await requireAdmin();
  await connectDb();

  const orderNumber = String(formData.get("orderNumber") ?? "");
  const raw = String(formData.get("paymentStatus") ?? "");

  // reject anything that is not a real status rather than writing junk
  const paymentStatus = PAYMENT_STATUSES.find((status) => status === raw);
  if (!paymentStatus) return;

  await Order.updateOne({ orderNumber }, { $set: { paymentStatus } });

  revalidatePath(`/admin/orders/${orderNumber}`);
}
