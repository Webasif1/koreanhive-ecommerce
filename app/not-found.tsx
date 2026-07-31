import type { Metadata } from "next";
import Link from "next/link";

import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <StorefrontShell>
      <div className="container-page flex flex-col items-center gap-5 py-24 text-center">
        <p className="font-display text-6xl font-semibold text-primary">404</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          This page slipped out of the routine
        </h1>
        <p className="max-w-md text-muted-foreground">
          The page you are looking for was moved or never existed. Try the
          shop, or track an order you already placed.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/shop">Browse Shop</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/track">Track Order</Link>
          </Button>
        </div>
      </div>
    </StorefrontShell>
  );
}
