"use server";

import { revalidatePath } from "next/cache";

import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/order-status";
import { requireAdmin } from "@/server/admin-guard";
import { connectDb, mongoose } from "@/server/db";
import { ORDER_STATUSES, Order, Product } from "@/server/models";

const RESTOCKING_STATUSES = new Set<OrderStatusValue>(["CANCELLED", "RETURNED"]);
const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;

const MAX_NOTE_LENGTH = 500;

/** Only a status the app actually knows about may be written. This used to be
 *  a bare `as OrderStatusValue` cast over form input, and the schema carried no
 *  enum either, so any string at all could land on an order — and an order with
 *  an unrecognised status disappears from the admin filters and from the
 *  revenue aggregate, which excludes only the literal CANCELLED and RETURNED. */
function parseOrderStatus(raw: string): OrderStatusValue | null {
  return (ORDER_STATUSES as readonly string[]).includes(raw)
    ? (raw as OrderStatusValue)
    : null;
}

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

  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const status = parseOrderStatus(String(formData.get("status") ?? ""));
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, MAX_NOTE_LENGTH);

  if (!orderNumber || !status) return;

  const order = await Order.findOne({ orderNumber }).lean();

  if (!order || order.status === status) return;

  /**
   * Stock goes back exactly once per order.
   *
   * The old test was "moving into a restocking status from one that is not",
   * which is true again every time the order re-enters CANCELLED. Since
   * leaving CANCELLED never took the stock back out, a
   * CANCELLED → PENDING → CANCELLED cycle credited the quantity on every
   * lap — letting the shop oversell exactly what the checkout transaction
   * exists to prevent. `restockedAt` records that it has happened.
   */
  const shouldRestock =
    RESTOCKING_STATUSES.has(status) && !order.restockedAt;

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
            ...(shouldRestock ? { restockedAt: new Date() } : {}),
            paymentStatus:
              status === "DELIVERED" && order.paymentMethod === "COD"
                ? "PAID"
                : order.paymentStatus,
          },
          $push: {
            statusHistory: {
              status,
              note:
                note ||
                (shouldRestock
                  ? `${ORDER_STATUS_LABEL[status]} — stock returned to inventory.`
                  : null),
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

  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const raw = String(formData.get("paymentStatus") ?? "");
  if (!orderNumber) return;

  // reject anything that is not a real status rather than writing junk
  const paymentStatus = PAYMENT_STATUSES.find((status) => status === raw);
  if (!paymentStatus) return;

  await Order.updateOne({ orderNumber }, { $set: { paymentStatus } });

  revalidatePath(`/admin/orders/${orderNumber}`);
}
