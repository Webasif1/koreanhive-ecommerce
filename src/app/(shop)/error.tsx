"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Storefront failures show something usable instead of a blank screen. */
export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront route failed", error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="font-display text-[30px] tracking-[-0.01em]">
        We couldn&apos;t load this page
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This is usually temporary. Try again, or head back to the shop — your
        cart is safe either way.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/shop">Back to shop</Link>
        </Button>
      </div>
      {error.digest && (
        <p className="text-[11px] text-faint">Reference: {error.digest}</p>
      )}
    </div>
  );
}
