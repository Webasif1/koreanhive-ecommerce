import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { formatBDT, formatDateTime, formatDeliveryWindow } from "@/lib/format";
import {
  ORDER_FLOW,
  ORDER_STATUS_LABEL,
  type OrderStatusValue,
} from "@/lib/order-status";
import {
  updateOrderStatusAction,
  updatePaymentStatusAction,
} from "@/server/actions/admin/orders";
import { getAdminOrder } from "@/server/queries/admin";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/orders"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Orders
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {order.orderNumber}
        </h1>
        <Badge variant="muted">{ORDER_STATUS_LABEL[order.status]}</Badge>
        <Badge variant={order.paymentStatus === "PAID" ? "success" : "muted"}>
          {order.paymentStatus}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-display font-semibold">Items</h2>
            <ul className="mt-3 divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3 text-sm">
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

          <section className="rounded-xl border bg-card p-5">
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
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-display font-semibold">Update status</h2>
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

              <Button type="submit" className="w-full">
                Save status
              </Button>
              <p className="text-xs text-muted-foreground">
                Cancelling or returning puts the stock back. Marking a COD
                order delivered also marks it paid.
              </p>
            </form>
          </section>

          <section className="rounded-xl border bg-card p-5">
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

              <Button type="submit" variant="outline" className="w-full">
                Save payment status
              </Button>
              <p className="text-xs text-muted-foreground">
                Use REFUNDED when money already collected goes back to the
                customer, e.g. after a return.
              </p>
            </form>
          </section>

          <section className="space-y-1 rounded-xl border bg-card p-5 text-sm">
            <h2 className="font-display font-semibold">Customer</h2>
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
