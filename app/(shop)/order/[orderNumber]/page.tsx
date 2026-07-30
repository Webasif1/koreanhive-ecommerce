import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, CheckCircle2, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBDT, formatDeliveryWindow } from "@/lib/format";
import { hasOrderAccess } from "@/server/cart-cookie";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

type OrderPageProps = {
  params: Promise<{ orderNumber: string }>;
};

export default async function OrderSuccessPage({ params }: OrderPageProps) {
  const { orderNumber } = await params;

  // only the browser that just placed this order may read it here; anyone
  // else has to go through /track with the order number *and* the phone
  if (!(await hasOrderAccess(orderNumber))) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Order details are private
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          For your security we only show a confirmation right after checkout.
          You can still look this order up with your order number and phone
          number.
        </p>
        <Button asChild>
          <Link href="/track">Track Your Order</Link>
        </Button>
      </div>
    );
  }

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true, deliveryZone: true },
  });

  if (!order) notFound();

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="size-12 text-success" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Thank you, {order.customerName.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Your order is confirmed. We will call {order.customerPhone} to
            verify before dispatch.
          </p>
          <p className="rounded-lg bg-secondary px-4 py-2 font-display text-lg font-semibold">
            {order.orderNumber}
          </p>
          <p className="text-xs text-muted-foreground">
            Save this number — you need it plus your phone number to track.
          </p>
        </div>

        <ul className="mt-8 divide-y rounded-xl border bg-card px-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
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

        <dl className="mt-4 space-y-2 rounded-xl border bg-card p-4 text-sm">
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
            <dt>Total due on delivery</dt>
            <dd className="tabular-nums">{formatBDT(order.total)}</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-2 rounded-xl border bg-card p-4 text-sm">
          <p className="flex items-center gap-2">
            <Truck className="size-4 text-gold" />
            Arriving in{" "}
            {formatDeliveryWindow(
              order.deliveryZone.minDays,
              order.deliveryZone.maxDays,
            )}{" "}
            to {order.area}, {order.district}
          </p>
          <p className="flex items-center gap-2">
            <Banknote className="size-4 text-success" />
            Pay {formatBDT(order.total)} in cash when it arrives
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href={`/track?order=${order.orderNumber}`}>Track Order</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
