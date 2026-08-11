import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shop by Skin Concern",
  description:
    "Find Korean skincare by what your skin is actually asking for — acne, dark spots, dryness, oiliness, sun protection or sensitivity.",
  alternates: { canonical: "/concerns" },
};

/**
 * Static routing into real categories. There is no Concern model; when one
 * exists these tiles read from it without the layout changing.
 */
const CONCERNS = [
  {
    label: "Acne & breakouts",
    copy: "Calm active spots without stripping the barrier.",
    href: "/category/face-ampoules",
    image: "/categories/cat1.png",
  },
  {
    label: "Dark spots",
    copy: "Fade post-acne marks and uneven tone over 4–6 weeks.",
    href: "/category/brightening",
    image: "/categories/cat2.png",
  },
  {
    label: "Dryness",
    copy: "Layerable hydration that holds through the day.",
    href: "/category/moisturisers",
    image: "/categories/cat3.png",
  },
  {
    label: "Oily skin",
    copy: "Control shine without the tight, squeaky feeling.",
    href: "/category/cleansers",
    image: "/categories/cat4.png",
  },
  {
    label: "Sun protection",
    copy: "Daily SPF that never leaves a white cast.",
    href: "/category/sunscreen",
    image: "/categories/cat5.png",
  },
  {
    label: "Sensitive skin",
    copy: "Short ingredient lists, no fragrance, no sting.",
    href: "/category/toners-essences",
    image: "/categories/cat6.png",
  },
];

export default function ConcernsPage() {
  return (
    <div className="container-page py-12">
      <p className="eyebrow">Shop by skin concern</p>
      <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
        Find what your skin is asking for
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Pick the problem you actually want solved. Each route lands on the
        products we would recommend first.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CONCERNS.map((concern) => (
          <Link
            key={concern.label}
            href={concern.href}
            className="group border border-border bg-card"
          >
            <div className="relative aspect-4/3 overflow-hidden bg-blush">
              <Image
                src={concern.image}
                alt={concern.label}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <h2 className="font-display text-lg group-hover:text-primary">
                {concern.label}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {concern.copy}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
