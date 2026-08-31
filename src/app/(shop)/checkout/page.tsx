import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { formatBDT } from "@/lib/format";
import { getDeliveryZones } from "@/server/queries/catalog";
import { getCart } from "@/server/queries/cart";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [cart, zones] = await Promise.all([getCart(), getDeliveryZones()]);

  if (cart.lines.length === 0) {
    redirect("/cart");
  }

  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Guest checkout — no account needed. Pay cash on delivery.
      </p>

      <ul className="mt-6 divide-y rounded-xl border bg-card px-4">
        {cart.lines.map((line) => (
          <li key={line.key} className="flex items-center gap-3 py-3">
            <Link
              href={`/product/${line.slug}`}
              className="relative size-12 shrink-0 overflow-hidden rounded-lg border bg-white"
            >
              {line.imageUrl && (
                <Image
                  src={line.imageUrl}
                  alt={line.name}
                  fill
                  sizes="48px"
                  className="object-contain p-1"
                />
              )}
            </Link>
            <div className="flex-1 text-sm">
              <p className="line-clamp-1 font-medium">{line.name}</p>
              <p className="text-xs text-muted-foreground">
                {line.variantName ? `${line.variantName} · ` : ""}
                {line.quantity} × {formatBDT(line.unitPrice)}
              </p>
            </div>
            <p className="text-sm tabular-nums">{formatBDT(line.lineTotal)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-3 text-right">
        <Link href="/cart" className="text-sm text-primary hover:underline">
          Edit cart
        </Link>
      </div>

      <div className="mt-8">
        <CheckoutForm
          zones={zones.map((z) => ({
            id: z.id,
            name: z.name,
            slug: z.slug,
            charge: z.charge,
            freeShippingThreshold: z.freeShippingThreshold,
            minDays: z.minDays,
            maxDays: z.maxDays,
          }))}
          subtotal={cart.subtotal}
          discount={cart.discount}
        />
      </div>
    </div>
  );
}
