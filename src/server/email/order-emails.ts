import "server-only";

import { after } from "next/server";

import {
  customerEmailKindFor,
  customerOrderEmail,
  shopConfirmedEmail,
  shopNewOrderEmail,
  type Email,
  type EmailOrder,
} from "@/lib/email/templates";
import type { OrderStatusValue } from "@/lib/order-status";
import { connectDb } from "@/server/db";
import { sendMail, shopInbox } from "@/server/email/transport";
import { Order } from "@/server/models";

/**
 * The order emails, queued with after().
 *
 * Checkout and the admin status form return first and the mail goes out
 * once the response is sent, so a slow or failing Gmail never holds up a
 * redirect — and a failed email is logged, never turned into a failed order.
 * The order is re-read from the database so the email says exactly what was
 * committed.
 */

async function loadOrder(orderNumber: string): Promise<EmailOrder | null> {
  await connectDb();
  return Order.findOne({ orderNumber }).lean<EmailOrder>();
}

async function deliver(label: string, to: string | null | undefined, email: Email, replyTo?: string | null) {
  if (!to) return;
  try {
    await sendMail({ to, ...email, replyTo });
  } catch (error) {
    console.error(`[email] ${label} failed`, error);
  }
}

/** New order: a heads-up to the shop, a thank-you to the customer. */
export function queueOrderPlacedEmails(orderNumber: string) {
  after(async () => {
    const order = await loadOrder(orderNumber);
    if (!order) return;

    await Promise.all([
      // replying to the shop copy writes straight to the customer
      deliver("shop new order", shopInbox(), shopNewOrderEmail(order), order.customerEmail),
      deliver("customer placed", order.customerEmail, customerOrderEmail(order, "placed")),
    ]);
  });
}

/** A status change from the admin: the customer on the milestones, the shop on confirm. */
export function queueStatusEmails(
  orderNumber: string,
  status: OrderStatusValue,
  changedBy: string,
) {
  const kind = customerEmailKindFor(status);
  // PENDING is the "placed" email, sent by checkout; re-opening an order
  // should not thank the customer a second time
  const customerKind = kind === "placed" ? null : kind;
  const notifyShop = status === "CONFIRMED";

  if (!customerKind && !notifyShop) return;

  after(async () => {
    const order = await loadOrder(orderNumber);
    if (!order) return;

    await Promise.all([
      notifyShop
        ? deliver("shop confirmed", shopInbox(), shopConfirmedEmail(order, changedBy), order.customerEmail)
        : null,
      customerKind
        ? deliver(`customer ${customerKind}`, order.customerEmail, customerOrderEmail(order, customerKind))
        : null,
    ]);
  });
}
