"use server";

import { revalidatePath } from "next/cache";

import type { OrderStatusValue } from "@/lib/order-status";
import { requireAdmin } from "@/server/admin-guard";
import { db } from "@/server/db";

const RESTOCKING_STATUSES = new Set(["CANCELLED", "RETURNED"]);

/**
 * Moves an order to a new status and records why. Two side effects are
 * deliberate:
 *  - cancelling or returning puts the stock back, once
 *  - marking a COD order delivered marks it paid, because the courier has
 *    collected the cash by then
 */
export async function updateOrderStatusAction(formData: FormData) {
  const admin = await requireAdmin();

  const orderNumber = String(formData.get("orderNumber") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatusValue;
  const note = String(formData.get("note") ?? "").trim();

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order || order.status === status) return;

  const shouldRestock =
    RESTOCKING_STATUSES.has(status) && !RESTOCKING_STATUSES.has(order.status);

  await db.$transaction(
    async (tx) => {
      if (shouldRestock) {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          } else if (item.productId) {
            await tx.product.updateMany({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status,
          paymentStatus:
            status === "DELIVERED" && order.paymentMethod === "COD"
              ? "PAID"
              : order.paymentStatus,
          statusHistory: {
            create: {
              status,
              note: note || null,
              createdBy: admin.email ?? "admin",
            },
          },
        },
      });
    },
    { maxWait: 10_000, timeout: 20_000 },
  );

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderNumber}`);
}

const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;

export async function updatePaymentStatusAction(formData: FormData) {
  await requireAdmin();

  const orderNumber = String(formData.get("orderNumber") ?? "");
  const raw = String(formData.get("paymentStatus") ?? "");

  // reject anything that is not a real enum value rather than letting Prisma
  // throw on a hand-crafted form post
  const paymentStatus = PAYMENT_STATUSES.find((status) => status === raw);
  if (!paymentStatus) return;

  await db.order.update({
    where: { orderNumber },
    data: { paymentStatus },
  });

  revalidatePath(`/admin/orders/${orderNumber}`);
}
