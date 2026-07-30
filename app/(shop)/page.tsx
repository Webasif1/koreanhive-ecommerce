import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, ShieldCheck, Truck } from "lucide-react";

import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { formatBDT, formatDeliveryWindow } from "@/lib/format";
import { getDeliveryZones, getFeaturedProducts } from "@/server/queries/catalog";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

export default async function Home() {
  const [featured, zones] = await Promise.all([
    getFeaturedProducts(4),
    getDeliveryZones(),
  ]);

  return (
    <>
      <section className="bg-secondary/50">
        <div className="container-page flex flex-col items-start gap-6 py-16 md:py-24">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            New in Bangladesh
          </span>
          <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Glass skin, delivered to your door.
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Authentic Korean beauty &amp; skincare, curated for Bangladeshi
            skin. No account needed — order as a guest and pay cash on delivery.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/shop">Shop Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/track">Track My Order</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-6 py-12 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <ShieldCheck className="size-6 text-primary" />
          <h2 className="mt-3 font-display font-semibold">100% Authentic</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sourced directly from Korea. No fakes, ever.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <Banknote className="size-6 text-success" />
          <h2 className="mt-3 font-display font-semibold">Cash on Delivery</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pay when the parcel reaches your door.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <Truck className="size-6 text-gold" />
          <h2 className="mt-3 font-display font-semibold">
            Nationwide Delivery
          </h2>
          <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {zones.map((zone) => (
              <li key={zone.id}>
                {zone.name}: {formatBDT(zone.charge)} ·{" "}
                {formatDeliveryWindow(zone.minDays, zone.maxDays)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-page pb-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Featured
            </h2>
            <Link
              href="/shop"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid products={featured} />
          </div>
        </section>
      )}
    </>
  );
}
