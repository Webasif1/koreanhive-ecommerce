import type { Metadata } from "next";
import Link from "next/link";

import { CartLineRow } from "@/components/cart/cart-line-row";
import { CouponForm } from "@/components/cart/coupon-form";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { getCart } from "@/server/queries/cart";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false },
};

export default async function CartPage() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Your cart is empty
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add a few K-beauty essentials and pay cash when they arrive.
        </p>
        <Button asChild>
          <Link href="/shop">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Your Cart
      </h1>

      {cart.removedCount > 0 && (
        <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
          {cart.removedCount}{" "}
          {cart.removedCount === 1 ? "item is" : "items are"} no longer
          available and {cart.removedCount === 1 ? "was" : "were"} removed.
        </p>
      )}

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y border-y">
          {cart.lines.map((line) => (
            <CartLineRow key={line.key} line={line} />
          ))}
        </ul>

        <aside className="h-fit space-y-4 rounded-xl border bg-card p-5">
          <h2 className="font-display font-semibold">Order Summary</h2>

          <CouponForm
            appliedCode={cart.couponCode}
            error={cart.couponError}
          />

          <dl className="space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatBDT(cart.subtotal)}</dd>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{formatBDT(cart.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="text-muted-foreground">
                Calculated at checkout
              </dd>
            </div>
            <div className="flex justify-between border-t pt-2 font-display text-base font-semibold">
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
            className="block text-center text-sm text-primary hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
