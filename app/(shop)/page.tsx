import Link from "next/link";
import { Banknote, ShieldCheck, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: ShieldCheck,
    title: "100% Authentic",
    body: "Sourced directly from Korea. No fakes, ever.",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery",
    body: "Pay when the parcel reaches your door.",
  },
  {
    icon: Truck,
    title: "Nationwide Delivery",
    body: "Inside Dhaka in 1–2 days, outside in 2–4.",
  },
];

export default function Home() {
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
            Authentic Korean beauty & skincare, curated for Bangladeshi skin.
            No account needed — order as a guest and pay cash on delivery.
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
        {highlights.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border bg-card p-5">
            <Icon className="size-6 text-primary" />
            <h2 className="mt-3 font-display font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
