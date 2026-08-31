import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { HeroBanners } from "@/components/layout/hero-banners";
import { ProductGrid } from "@/components/product/product-grid";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { faqJsonLd, type FaqEntry } from "@/lib/json-ld";
import {
  getActiveBanners,
  getBestSellers,
  getBrands,
  getProducts,
} from "@/server/queries/catalog";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

const CONCERNS = [
  {
    label: "Acne & breakouts",
    copy: "Calm active spots without stripping",
    href: "/category/face-ampoules",
    image: "/categories/cat1.webp",
  },
  {
    label: "Dark spots",
    copy: "Fade post-acne marks and uneven tone",
    href: "/category/brightening",
    image: "/categories/cat2.webp",
  },
  {
    label: "Dryness",
    copy: "Layerable hydration that holds all day",
    href: "/category/moisturisers",
    image: "/categories/cat3.webp",
  },
  {
    label: "Oily skin",
    copy: "Control shine in Dhaka humidity",
    href: "/category/cleansers",
    image: "/categories/cat4.webp",
  },
  {
    label: "Sun protection",
    copy: "Daily SPF that never leaves a cast",
    href: "/category/sunscreen",
    image: "/categories/cat5.webp",
  },
  {
    label: "Sensitive skin",
    copy: "Short ingredient lists, no fragrance",
    href: "/category/toners-essences",
    image: "/categories/cat6.webp",
  },
];

const APPROACH = [
  {
    title: "Imported, not repackaged",
    copy: "Every batch arrives sealed from Korea with its original barcode intact.",
  },
  {
    title: "Stored the way it should be",
    copy: "Actives are kept cool and out of light, so what you get still works.",
  },
  {
    title: "Routines, not shelves of product",
    copy: "We stock fewer items and tell you where each one sits in a routine.",
  },
];

const WHY = [
  { stat: "4.9★", label: "average rating across 3,400+ reviews" },
  { stat: "64", label: "districts we deliver to" },
  { stat: "1–2 days", label: "delivery inside Dhaka" },
  { stat: "0৳", label: "paid upfront — cash on delivery" },
];

const FAQS: FaqEntry[] = [
  {
    question: "Are your products authentic?",
    answer:
      "Yes. Everything is imported from Korea and arrives sealed with its original batch code. We do not sell replicas or grey-market stock.",
  },
  {
    question: "Do I need an account to order?",
    answer:
      "No. Korean Hive is guest checkout by default — your name, phone number and address are enough.",
  },
  {
    question: "How do I pay?",
    answer:
      "Cash on delivery. You pay the courier when the parcel reaches you, so nothing leaves your pocket before the products arrive.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Inside Dhaka is 1–2 working days. Outside Dhaka is 2–4 working days, to all 64 districts.",
  },
  {
    question: "Can I track my order without logging in?",
    answer:
      "Yes. Use your order number and the phone number you gave at checkout on the Track Order page.",
  },
];

const JOURNAL = [
  {
    title: "A Korean routine that survives Bangladesh humidity",
    tag: "ROUTINE",
    image: "/editorial/lifestyle.webp",
  },
  {
    title: "Niacinamide, explained without the jargon",
    tag: "INGREDIENTS",
    image: "/editorial/unboxing.webp",
  },
  {
    title: "Double cleansing: what it is and who needs it",
    tag: "BASICS",
    image: "/editorial/reel1.webp",
  },
];

/** Below this, the order history is too thin for "best seller" to mean
 *  anything, so the section says what it is actually showing instead. */
const MIN_REAL_SALES = 4;

export default async function Home() {
  const [brands, banners, sold] = await Promise.all([
    getBrands(),
    getActiveBanners(),
    getBestSellers(8),
  ]);

  // Ranked by units actually sold once there is enough trade to rank. Until
  // then the same slot shows new arrivals under a heading that says so —
  // an empty grid was what it did before, and a fabricated ranking would be
  // worse than either.
  const hasRealSales = sold.length >= MIN_REAL_SALES;
  const popular = hasRealSales ? sold : await getProducts({ take: 8 });

  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />

      <HeroBanners banners={banners} />

      {/* ---------------------------------------------------------- hero */}
      <section className="border-b border-border bg-white">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div className="py-14 lg:py-[72px]">
            <span className="eyebrow inline-flex bg-blush px-3 py-1.5">
              Seoul sourced · delivered nationwide
            </span>
            <h1 className="mt-6 font-display text-[40px] leading-[1.06] tracking-[-0.02em] md:text-[56px] lg:text-[64px]">
              Authentic Korean beauty, for skin that looks like yours.
            </h1>
            <p className="mt-5 max-w-[460px] text-base leading-relaxed text-muted-foreground">
              Better skin, better routine, better confidence. Every product is
              imported, batch-checked and stored properly — so what reaches your
              door is the real thing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/shop">Shop Korean Skincare</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#bestsellers">Explore Best Sellers</Link>
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              {[
                { value: "4.9★", label: "3,400+ reviews" },
                { value: String(brands.length), label: "Korean brands stocked" },
                { value: "64", label: "districts delivered" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-[22px]">{stat.value}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] self-stretch bg-blush lg:min-h-[600px]">
            <Image
              src="/editorial/hero-model.webp"
              alt="Korean skincare routine"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute bottom-5 left-4 max-w-[270px] border border-border bg-white p-4 shadow-[0_18px_40px_rgba(36,26,36,.08)] lg:-left-14">
              <div className="text-xs tracking-[0.1em] text-star">★★★★★</div>
              <p className="mt-2 text-[13.5px] leading-snug">
                Three weeks in and my acne marks are visibly lighter. Delivery
                was next-day in Dhaka.
              </p>
              <div className="mt-2 text-[11px] text-muted-foreground">
                Nusrat J. — Verified purchase
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- concerns */}
      <section className="container-page py-14">
        <p className="eyebrow">Shop by skin concern</p>
        <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
          Find what your skin is asking for
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {CONCERNS.map((concern) => (
            <Link
              key={concern.label}
              href={concern.href}
              className="group border border-border bg-card"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-blush">
                <Image
                  src={concern.image}
                  alt={concern.label}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold group-hover:text-primary">
                  {concern.label}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {concern.copy}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- approach */}
      <section className="border-y border-border bg-white">
        <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow">The Korean Hive approach</p>
            <h2 className="mt-3 font-display text-[30px] leading-[1.18] tracking-[-0.01em] md:text-[40px]">
              Healthy-looking skin isn&apos;t about using more products.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {APPROACH.map((item) => (
              <div key={item.title} className="border-t border-hairline pt-4">
                <h3 className="text-sm font-bold">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- bestsellers */}
      <section id="bestsellers" className="container-page py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              {hasRealSales ? "Best sellers this month" : "New this month"}
            </p>
            <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
              {hasRealSales
                ? "What Bangladeshi women keep reordering"
                : "Just landed from Seoul"}
            </h2>
          </div>
          <Link
            href="/shop"
            className="border-b border-chip-border pb-1 text-sm font-semibold"
          >
            View all products
          </Link>
        </div>
        <div className="mt-8">
          {/* the badge is a sales claim, so it only appears when sales back it */}
          <ProductGrid
            products={popular}
            badge={hasRealSales ? "BEST SELLER" : undefined}
          />
        </div>
      </section>

      {/* --------------------------------------------------------- brands */}
      <section className="border-y border-border bg-white">
        <div className="container-page py-14">
          <p className="eyebrow">Shop by Korean brand</p>
          <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
            {brands.length} Korean brands, all authorised
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brand/${brand.slug}`}
                className="group border border-border bg-card p-5 text-center"
              >
                <div className="font-display text-lg group-hover:text-primary">
                  {brand.name}
                </div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">
                  {brand._count.products}{" "}
                  {brand._count.products === 1 ? "product" : "products"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- combos */}
      <section className="container-page py-14">
        <p className="eyebrow">Combo offers</p>
        <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
          Full routines, one price
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            {
              name: "The Acne Reset",
              steps: "Cleanser · Toner · Ampoule",
              save: 640,
            },
            {
              name: "Glass Skin Starter",
              steps: "Cleansing oil · Essence · Cream",
              save: 780,
            },
            {
              name: "Everyday Sun Kit",
              steps: "Sunscreen · Sun stick · Mask",
              save: 520,
            },
          ].map((combo) => (
            <Link
              key={combo.name}
              href="/combos"
              className="group flex flex-col border border-border bg-card p-6"
            >
              <Badge variant="saleSoft" className="self-start">
                Save ৳{combo.save}
              </Badge>
              <h3 className="mt-4 font-display text-xl group-hover:text-primary">
                {combo.name}
              </h3>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {combo.steps}
              </p>
              <span className="mt-5 border-b border-chip-border pb-1 text-sm font-semibold text-primary">
                See the combo
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- reels */}
      <section className="border-y border-border bg-white">
        <div className="container-page py-14">
          <p className="eyebrow">Watch · discover · shop</p>
          <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
            See it used before you buy it
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Link
                key={n}
                href="/shop"
                className="relative aspect-[9/16] overflow-hidden border border-border bg-blush"
              >
                <Image
                  src={`/editorial/reel${n}.webp`}
                  alt={`Korean Hive routine reel ${n}`}
                  fill
                  sizes="(min-width: 1024px) 20vw, 50vw"
                  className="object-cover"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ guarantee */}
      <section className="bg-ink text-blush">
        <div className="container-page grid gap-10 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mulberry-hover">
              Why women love Korean Hive
            </p>
            <h2 className="mt-4 font-display text-[30px] leading-[1.16] text-white md:text-[40px]">
              If it isn&apos;t right for your skin, send it back.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-light">
              Unopened products can be returned within 7 days. Damaged or wrong
              items are replaced at our cost, anywhere in Bangladesh.
            </p>
            <Button variant="outline" className="mt-7 bg-white" asChild>
              <Link href="/returns">Read the returns policy</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {WHY.map((item) => (
              <div key={item.label} className="border-t border-white/15 pt-4">
                <div className="font-display text-2xl text-white">
                  {item.stat}
                </div>
                <div className="mt-1 text-[12.5px] text-light">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ faq */}
      <section className="container-page py-14">
        <p className="eyebrow">Common questions</p>
        <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
          Korean skincare, explained simply
        </h2>
        <dl className="mt-6 grid gap-6 md:grid-cols-2">
          {FAQS.map((faq) => (
            <div key={faq.question} className="border-t border-hairline pt-4">
              <dt className="text-sm font-bold">{faq.question}</dt>
              <dd className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* -------------------------------------------------------- journal */}
      <section className="border-t border-border bg-white">
        <div className="container-page py-14">
          <p className="eyebrow">The Hive Journal</p>
          <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
            Routines that survive Bangladesh weather
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {JOURNAL.map((post) => (
              <Link
                key={post.title}
                href="/blog"
                className="group border border-border bg-card"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-blush">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="eyebrow">{post.tag}</p>
                  <h3 className="mt-2 font-display text-lg leading-snug group-hover:text-primary">
                    {post.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- newsletter */}
      <section className="container-page py-14">
        <div className="flex flex-col items-center gap-4 border border-border bg-blush p-10 text-center">
          <h2 className="font-display text-[26px] md:text-[30px]">
            Get ৳150 off your first order
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Use code <span className="font-bold text-primary">WELCOME10</span> at
            checkout on orders over ৳1,000.
          </p>
          <Button size="lg" asChild>
            <Link href="/shop">Start shopping</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
