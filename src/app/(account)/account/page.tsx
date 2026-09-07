import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

/**
 * Korean Hive is guest-only by design — shoppers never sign in, and the
 * roadmap's phone OTP is not built. The page stays so an old bookmark does
 * not 404, but it is not linked from the header any more: "Track Order" is
 * what someone clicking "Account" on a guest-checkout shop actually wants.
 */
export default function AccountPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          You do not need an account
        </h1>
        <p className="mt-3 text-muted-foreground">
          Korean Hive is guest checkout from end to end. You order with your
          name, phone number and address, pay the courier in cash when the
          parcel arrives, and look the order up afterwards with your order
          number and the same phone number.
        </p>
        <p className="mt-3 text-muted-foreground">
          Nothing to remember, no password to lose.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/track">Track an order</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
