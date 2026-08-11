import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";

export const metadata: Metadata = {
  title: "Combo Offers",
  description:
    "Full Korean skincare routines bundled at one price, with cash on delivery across Bangladesh.",
  alternates: { canonical: "/combos" },
};

/**
 * Static for now. There is no Combo model yet — when bundles become real
 * products these move to the database without the layout changing.
 */
const COMBOS = [
  {
    name: "The Acne Reset",
    concern: "Active breakouts and post-acne marks",
    steps: [
      "Low pH Good Morning Gel Cleanser",
      "AHA/BHA Clarifying Treatment Toner",
      "Azelaic Acid 10 Redness Soothing Serum",
    ],
    price: 3450,
    was: 4090,
  },
  {
    name: "Glass Skin Starter",
    concern: "Dullness and dehydration",
    steps: [
      "Heartleaf Pore Control Cleansing Oil",
      "Advanced Snail 96 Mucin Power Essence",
      "Advanced Snail 92 All In One Cream",
    ],
    price: 4470,
    was: 5250,
  },
  {
    name: "Everyday Sun Kit",
    concern: "Daily protection in Dhaka heat",
    steps: [
      "Relief Sun: Rice + Probiotics SPF50+",
      "Hyaluronic Acid Airy Sun Stick SPF50+",
      "Madecassoside Blemish Pad",
    ],
    price: 4230,
    was: 4750,
  },
];

export default function CombosPage() {
  return (
    <div className="container-page py-12">
      <p className="eyebrow">Combo offers</p>
      <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
        Full routines, one price
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Three steps that work together, priced below buying them separately.
        Cash on delivery, same as everything else.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {COMBOS.map((combo) => (
          <div
            key={combo.name}
            className="flex flex-col border border-border bg-card p-6"
          >
            <Badge variant="saleSoft" className="self-start">
              Save {formatBDT(combo.was - combo.price)}
            </Badge>
            <h2 className="mt-4 font-display text-xl">{combo.name}</h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {combo.concern}
            </p>

            <ul className="mt-5 space-y-2.5">
              {combo.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-[13px]">
                  <span className="font-display text-primary">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-baseline gap-2.5">
              <span className="font-display text-2xl">
                {formatBDT(combo.price)}
              </span>
              <span className="text-[12.5px] text-faint line-through">
                {formatBDT(combo.was)}
              </span>
            </div>

            <div className="flex-1" />
            <Button className="mt-5 w-full" asChild>
              <Link href="/shop">Shop these products</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
