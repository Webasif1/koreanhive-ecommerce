import Image from "next/image";
import Link from "next/link";
import { Banknote, MapPin, Truck } from "lucide-react";

import { OrderTimeline } from "@/components/track/order-timeline";
import { Badge } from "@/components/ui/badge";
import { formatBDT, formatDateTime, formatDeliveryWindow } from "@/lib/format";
import { isTerminalDetour, ORDER_STATUS_LABEL } from "@/lib/order-status";
import type { TrackedOrder as TrackedOrderData } from "@/server/queries/order";

export function TrackedOrder({ order }: { order: TrackedOrderData }) {
  return (
    <section className="mt-10 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-5">
        <div>
          <p className="font-display text-lg font-semibold">
            {order.orderNumber}
          </p>
          <p className="text-sm text-muted-foreground">
            Placed {formatDateTime(order.placedAt)}
          </p>
        </div>
        <Badge variant={isTerminalDetour(order.status) ? "muted" : "success"}>
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-5 font-display font-semibold">Progress</h2>
          <OrderTimeline status={order.status} history={order.history} />
        </div>

        <aside className="space-y-4">
          <div className="space-y-2 rounded-xl border bg-card p-5 text-sm">
            <h2 className="font-display font-semibold">Delivery</h2>
            <p className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              {order.area}, {order.district}
            </p>
            <p className="flex items-start gap-2 text-muted-foreground">
              <Truck className="mt-0.5 size-4 shrink-0 text-gold" />
              {order.zoneName} · {formatDeliveryWindow(
                order.minDays,
                order.maxDays,
              )}
            </p>
            <p className="flex items-start gap-2 text-muted-foreground">
              <Banknote className="mt-0.5 size-4 shrink-0 text-success" />
              {order.paymentMethod === "COD"
                ? order.paymentStatus === "PAID"
                  ? "Cash on delivery · paid"
                  : `Cash on delivery · ${formatBDT(order.total)} due`
                : order.paymentMethod}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-display font-semibold">Items</h2>
            <ul className="mt-3 divide-y">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <Link
                    href={`/product/${item.productSlug}`}
                    className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-white"
                  >
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    )}
                  </Link>
                  <div className="flex-1 text-sm">
                    <Link
                      href={`/product/${item.productSlug}`}
                      className="line-clamp-1 font-medium hover:text-primary"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.variantName ? `${item.variantName} · ` : ""}
                      {item.quantity} × {formatBDT(item.unitPrice)}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">
                    {formatBDT(item.lineTotal)}
                  </p>
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
                  <dt>
                    Discount {order.couponCode && `(${order.couponCode})`}
                  </dt>
                  <dd className="tabular-nums">
                    −{formatBDT(order.discount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
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
          </div>
        </aside>
      </div>
    </section>
  );
}
