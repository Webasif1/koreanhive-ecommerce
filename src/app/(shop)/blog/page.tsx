import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Beauty Journal",
  description:
    "Korean skincare routines, ingredient guides and product reviews from Korean Hive.",
  alternates: { canonical: "/blog" },
  // Nothing is published yet. An empty section that a crawler can reach is a
  // thin page; keep it out of the index until it has articles, and out of the
  // navigation and sitemap too (see lib/navigation.ts and app/sitemap.ts).
  robots: { index: false, follow: true },
};

export default function BlogPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">The Hive Journal</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Routines, ingredients and honest reviews
        </h1>
        <p className="mt-3 text-muted-foreground">
          We are writing the first pieces now — how to layer a Korean routine
          in Dhaka humidity, what niacinamide and centella actually do, and
          which sunscreens leave no cast on brown skin.
        </p>
        <p className="mt-3 text-muted-foreground">
          Until they land, the shop assistant will answer the same questions,
          and the concern pages are the fastest way to find what suits your
          skin.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/concerns">Shop by skin concern</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Browse all products</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
