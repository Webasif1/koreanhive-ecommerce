import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Korean Hive",
  description:
    "Korean Hive brings 100% authentic Korean beauty and skincare to Bangladesh — imported sealed, stored properly, delivered cash on delivery nationwide.",
  alternates: { canonical: "/about" },
};

/**
 * Every claim here is one the rest of the site can back: authenticity and
 * storage are the sourcing promise, the two delivery zones and cash on
 * delivery are what checkout actually does, and the routine-first stance is
 * what the concern pages and the shop assistant are built around. Nothing
 * about founders, dates or volumes, because none of that is verifiable here.
 */
export default function AboutPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">About us</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-[38px]">
          Authentic K-beauty, sourced direct from Korea, priced for Bangladesh.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Korean Hive exists because buying Korean skincare in Bangladesh has
          been a gamble for too long — unsealed boxes, grey-market stock,
          products that have sat in a hot warehouse until the actives in them
          stopped working. We built the shop we wanted to buy from.
        </p>

        <h2 className="mt-10 font-display text-lg font-semibold">
          Imported, not repackaged
        </h2>
        <p className="mt-2 text-muted-foreground">
          Every batch arrives sealed from Korea with its original barcode
          intact. We do not decant, rebottle or relabel anything, and we do not
          stock replicas. If you can scan it, you can verify it.
        </p>

        <h2 className="mt-8 font-display text-lg font-semibold">
          Stored the way it should be
        </h2>
        <p className="mt-2 text-muted-foreground">
          Vitamin C, retinol and most acids degrade in heat and light. Ours are
          kept cool and dark from the day they land until the day they are
          packed, so what reaches you still does what the label says.
        </p>

        <h2 className="mt-8 font-display text-lg font-semibold">
          Routines, not shelves of product
        </h2>
        <p className="mt-2 text-muted-foreground">
          We stock fewer items than we could and tell you where each one sits in
          a routine. You can browse by what your skin is actually asking for
          rather than by product format, and the shop assistant will narrow it
          down with you in Bangla or English — without ever claiming a product
          treats a medical condition.
        </p>

        <h2 className="mt-8 font-display text-lg font-semibold">
          Buy the way that suits Bangladesh
        </h2>
        <p className="mt-2 text-muted-foreground">
          No account, no card details, no sign-up wall. You order as a guest,
          pay the courier in cash when the parcel reaches your door, and track
          it afterwards with nothing more than your order number and phone
          number. We deliver to all 64 districts.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/shop">Shop all products</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/concerns">Shop by skin concern</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
