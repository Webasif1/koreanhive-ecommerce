import type { Metadata } from "next";
import Link from "next/link";

import { CartLineRow } from "@/components/cart/cart-line-row";
import { CouponForm } from "@/components/cart/coupon-form";
import { FreeDeliveryBar } from "@/components/cart/free-delivery-bar";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { getCart } from "@/server/queries/cart";
import { getDeliveryZones } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false },
};

export default async function CartPage() {
  const [cart, zones] = await Promise.all([getCart(), getDeliveryZones()]);
  const insideDhaka = zones.find((z) => z.slug === "inside-dhaka") ?? zones[0];

  if (cart.lines.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="font-display text-[30px] tracking-[-0.01em]">
          Your cart is empty
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add a few K-beauty essentials and pay cash when they arrive.
        </p>
        <Button size="lg" asChild>
          <Link href="/shop">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Your bag</p>
      <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
        Cart
      </h1>

      {cart.removedCount > 0 && (
        <p className="mt-5 border border-sale-border bg-sale-bg px-4 py-3 text-sm text-sale">
          {cart.removedCount}{" "}
          {cart.removedCount === 1 ? "item is" : "items are"} no longer
          available and {cart.removedCount === 1 ? "was" : "were"} removed.
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-border border-y border-border">
          {cart.lines.map((line) => (
            <CartLineRow key={line.key} line={line} />
          ))}
        </ul>

        <aside className="h-fit space-y-4 border border-border bg-white p-6">
          <h2 className="font-display text-xl">Order summary</h2>

          <FreeDeliveryBar
            subtotal={cart.subtotal}
            threshold={insideDhaka?.freeShippingThreshold ?? null}
          />

          <CouponForm appliedCode={cart.couponCode} error={cart.couponError} />

          <dl className="space-y-2.5 border-t border-hairline pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatBDT(cart.subtotal)}</dd>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-sale">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{formatBDT(cart.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="text-muted-foreground">Calculated at checkout</dd>
            </div>
            <div className="flex justify-between border-t border-hairline pt-3 font-display text-lg">
              <dt>Total so far</dt>
              <dd className="tabular-nums">
                {formatBDT(cart.subtotal - cart.discount)}
              </dd>
            </div>
          </dl>

          <Button size="lg" className="w-full" asChild>
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Cash on delivery · No account needed
          </p>
          <Link
            href="/shop"
            className="block text-center text-sm font-semibold text-primary hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
