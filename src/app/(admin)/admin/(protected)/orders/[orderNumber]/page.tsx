import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PaymentBadge, StatusBadge, adminButton } from "@/components/admin/admin-ui";
import { OrderActions } from "@/components/admin/order-actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { formatBDT, formatDateTime, formatDeliveryWindow } from "@/lib/format";
import {
  ORDER_FLOW,
  ORDER_STATUS_LABEL,
  type OrderStatusValue,
} from "@/lib/order-status";
import { ratingRequestPath, whatsappRatingLink } from "@/lib/rating-request";
import { absoluteUrl } from "@/lib/site";
import {
  updateOrderStatusAction,
  updatePaymentStatusAction,
} from "@/server/actions/admin/orders";
import { getAdminOrder, getCustomerIdByPhone } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

const ALL_STATUSES: OrderStatusValue[] = [
  ...ORDER_FLOW,
  "CANCELLED",
  "RETURNED",
];

const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getAdminOrder(orderNumber);

  if (!order) notFound();

  const customerId = await getCustomerIdByPhone(order.customerPhone);

  const ratingUrl = absoluteUrl(ratingRequestPath(order.orderNumber));
  const ratingWhatsapp = whatsappRatingLink({
    phone: order.customerPhone,
    customerName: order.customerName,
    url: ratingUrl,
  });

  const deleted = Boolean(order.deletedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="mb-1 inline-block text-sm text-muted-foreground hover:text-primary"
          >
            ← Orders
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {order.orderNumber}
            </h1>
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
            {order.source === "ADMIN" && (
              <span className="rounded-full bg-hairline px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                Entered by staff
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDateTime(order.placedAt.toISOString())} ·{" "}
            {order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod}
          </p>
        </div>

        <OrderActions
          orderNumber={order.orderNumber}
          status={order.status}
          deleted={deleted}
          size="md"
          trashRedirect
        />
      </div>

      {deleted && (
        <p className="rounded-2xl border border-sale-border bg-sale-bg px-5 py-3 text-sm text-sale">
          This order is in the trash
          {order.deletedAt ? ` since ${formatDateTime(order.deletedAt.toISOString())}` : ""}.
          It is hidden from reports and customer tracking. Restore it to make
          changes.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display font-semibold">Items</h2>
            <ul className="mt-3 divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border bg-muted">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variantName ? `${item.variantName} · ` : ""}
                      {item.quantity} × {formatBDT(item.unitPrice)}
                    </p>
                  </div>
                  <p className="tabular-nums">{formatBDT(item.lineTotal)}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-3 space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatBDT(order.subtotal)}</dd>
              </div>
              {order.comboDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Combo saving ({order.comboNames.join(", ")})</dt>
                  <dd className="tabular-nums">−{formatBDT(order.comboDiscount)}</dd>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd className="tabular-nums">−{formatBDT(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Delivery · {order.deliveryZone.name}
                </dt>
                <dd className="tabular-nums">
                  {order.shippingCharge === 0
                    ? "Free"
                    : formatBDT(order.shippingCharge)}
                </dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-display text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatBDT(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display font-semibold">History</h2>
            <ul className="mt-3 space-y-3">
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <p className="font-medium">
                    {ORDER_STATUS_LABEL[entry.status]}
                  </p>
                  {entry.note && (
                    <p className="text-muted-foreground">{entry.note}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt.toISOString())}
                    {entry.createdBy ? ` · ${entry.createdBy}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* What happened to each email, so "the customer never got it" has
              an answer on this page rather than in a server log. */}
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display font-semibold">Emails</h2>
            {order.emailLog.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No email has been attempted for this order.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {order.emailLog.map((entry) => (
                  <li key={`${entry.kind}-${entry.at.toISOString()}`} className="text-sm">
                    <p className="font-medium">
                      <span className={entry.ok ? "text-success" : "text-destructive"}>
                        {entry.ok ? "Sent" : "Failed"}
                      </span>{" "}
                      · {entry.kind} → {entry.to}
                    </p>
                    {entry.error && (
                      <p className="break-words text-xs text-destructive">{entry.error}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.at.toISOString())}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {/* Ratings can only come from a delivered order, and the best time
              to ask is right after delivery. Staff send this themselves —
              nothing goes out automatically — and the link carries the order
              number but never the phone. */}
          {order.status === "DELIVERED" && (
            <section className="rounded-2xl border border-primary/30 bg-blush p-5">
              <h2 className="font-display font-semibold">Ask for a rating</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Delivered — a good moment to ask. The customer opens the link,
                types the phone number they ordered with, and taps stars.
              </p>

              {ratingWhatsapp ? (
                <Button asChild className="mt-3 w-full">
                  <a href={ratingWhatsapp} target="_blank" rel="noopener noreferrer">
                    Send on WhatsApp
                  </a>
                </Button>
              ) : (
                <p className="mt-3 text-xs text-sale">
                  The phone on this order is not a valid Bangladeshi mobile, so
                  WhatsApp cannot open. Use the link below.
                </p>
              )}

              <p className="mt-3 text-xs font-semibold">Link, for SMS</p>
              <p className="mt-1 select-all break-all rounded border bg-white px-2 py-1.5 font-mono text-[11px]">
                {ratingUrl}
              </p>
            </section>
          )}

          {!deleted && (
          <>
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display font-semibold">Update status</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              For anything the buttons above do not cover, or to add a note.
            </p>
            <form action={updateOrderStatusAction} className="mt-3 space-y-3">
              <input
                type="hidden"
                name="orderNumber"
                value={order.orderNumber}
              />

              <div className="space-y-1.5">
                <Label htmlFor="status">New status</Label>
                <Select id="status" name="status" defaultValue={order.status}>
                  {ALL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABEL[status]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">Note (shown to the customer)</Label>
                <Textarea
                  id="note"
                  name="note"
                  placeholder="Confirmed by phone…"
                />
              </div>

              <SubmitButton className={adminButton("primary", "md", "w-full")} pendingLabel="Saving…">
                Save status
              </SubmitButton>
              <p className="text-xs text-muted-foreground">
                Cancelling or returning puts the stock back. Marking a COD
                order delivered also marks it paid.
              </p>
              <p className="text-xs text-muted-foreground">
                {order.customerEmail
                  ? `Confirmed, On the way and Delivered email ${order.customerEmail}.`
                  : "No customer email on file — status changes send no email."}{" "}
                Confirming also emails the shop inbox.
              </p>
            </form>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display font-semibold">Payment</h2>
            <form action={updatePaymentStatusAction} className="mt-3 space-y-3">
              <input
                type="hidden"
                name="orderNumber"
                value={order.orderNumber}
              />

              <div className="space-y-1.5">
                <Label htmlFor="paymentStatus">Payment status</Label>
                <Select
                  id="paymentStatus"
                  name="paymentStatus"
                  defaultValue={order.paymentStatus}
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
              </div>

              <SubmitButton className={adminButton("outline", "md", "w-full")} pendingLabel="Saving…">
                Save payment status
              </SubmitButton>
              <p className="text-xs text-muted-foreground">
                Use REFUNDED when money already collected goes back to the
                customer, e.g. after a return.
              </p>
            </form>
          </section>
          </>
          )}

          <section className="space-y-1 rounded-2xl border bg-card p-5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display font-semibold">Customer</h2>
              {customerId && (
                <Link
                  href={`/admin/customers/${customerId}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View profile →
                </Link>
              )}
            </div>
            <p>{order.customerName}</p>
            <p className="text-muted-foreground">{order.customerPhone}</p>
            {order.customerEmail && (
              <p className="text-muted-foreground">{order.customerEmail}</p>
            )}
            <p className="pt-2 text-muted-foreground">
              {order.addressLine}
              <br />
              {order.area}, {order.district}
              {order.postalCode ? ` — ${order.postalCode}` : ""}
            </p>
            <p className="pt-2 text-xs text-muted-foreground">
              {order.deliveryZone.name} ·{" "}
              {formatDeliveryWindow(
                order.deliveryZone.minDays,
                order.deliveryZone.maxDays,
              )}
            </p>
            {order.note && (
              <p className="mt-2 rounded-lg bg-muted p-2 text-xs">
                Note: {order.note}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
