import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { HeroBanners } from "@/components/layout/hero-banners";
import { ProductGrid } from "@/components/product/product-grid";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReelTile } from "@/components/home/reel-tile";
import { PostCard } from "@/components/blog/post-card";
import { POSTS } from "@/data/blog";
import { CONCERNS } from "@/data/concerns";
import { HERO_ROUTINE_SLUGS, stepForSlug } from "@/data/hero-routine";
import { REELS } from "@/data/reels";
import { topBrandsByStock } from "@/lib/brands";
import { countConcernProducts } from "@/lib/concern-count";
import { productImage } from "@/lib/product-image";
import { formatBDT } from "@/lib/format";
import { faqJsonLd, type FaqEntry } from "@/lib/json-ld";
import {
  getActiveBanners,
  getBestSellers,
  getBrands,
  getCombos,
  getConcernTaxonomyCounts,
  getProducts,
  getProductsBySlugs,
} from "@/server/queries/catalog";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

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

/* Five operational promises, from the design's trust strip. Every one is a
   fact the business can stand behind — no rating, no review count, nothing
   that needs a customer to have said it. */
const TRUST = [
  { title: "100% Authentic", sub: "Imported, batch-verified stock" },
  { title: "Cash on Delivery", sub: "Pay when it reaches your hand" },
  { title: "All 64 Districts", sub: "1–3 days anywhere in Bangladesh" },
  { title: "7-Day Returns", sub: "Unopened items, full refund" },
  { title: "Real Advice", sub: "WhatsApp a routine question" },
] as const;

/* The four-step routine. The argument the section makes is that a ten-step
   routine is why people quit in week three, so the copy stays four steps
   long — adding a fifth would undercut the point it is making. */
const ROUTINE = [
  { no: "01", name: "Cleanse", desc: "Low-pH gel or foam, twice daily" },
  { no: "02", name: "Hydrate", desc: "Toner or essence while damp" },
  { no: "03", name: "Treat", desc: "One serum for one concern" },
  { no: "04", name: "Protect", desc: "SPF50+ every single morning" },
] as const;

/* Operational facts only. This list also led with "4.9★ across 3,400+
   reviews", a second copy of a rating no customer has ever left. */
const WHY = [
  { stat: "0", label: "replicas or grey-market stock" },
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

/** Below this, the order history is too thin for "best seller" to mean
 *  anything, so the section says what it is actually showing instead. */
const MIN_REAL_SALES = 4;

export default async function Home() {
  const [brands, banners, sold, combos, routine, concernProductIds] =
    await Promise.all([
      getBrands(),
      getActiveBanners(),
      getBestSellers(8),
      getCombos(),
      getProductsBySlugs(HERO_ROUTINE_SLUGS),
      getConcernTaxonomyCounts(),
    ]);

  // Ranked by units actually sold once there is enough trade to rank. Until
  // then the same slot shows new arrivals under a heading that says so —
  // an empty grid was what it did before, and a fabricated ranking would be
  // worse than either.
  const hasRealSales = sold.length >= MIN_REAL_SALES;
  const popular = hasRealSales ? sold : await getProducts({ take: 8 });

  // The hero photograph is a routine being applied, so the strip over it shows
  // what that routine is made of — three named flagships from src/data/
  // hero-routine.ts. This used to be popular.slice(0, 3), which with no sales
  // history meant the three newest imports: a body lotion and two minis.
  // If a pick has been unpublished since, fall back rather than show a gap.
  const shopTheShot = routine.length === 3 ? routine : popular.slice(0, 3);

  // All 71 brands used to render here, 15 rows of them on a phone. `brands`
  // stays whole because its length is real copy in two places — the stat block
  // and the section heading — while only these ten get a tile.
  const featuredBrands = topBrandsByStock(brands, 10);

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
              {/* Every figure here has to be one we can stand behind. This
                  row used to lead with "4.9★ / 3,400+ reviews" against a
                  catalogue holding no reviews at all. */}
              {[
                { value: String(brands.length), label: "Korean brands stocked" },
                { value: "64", label: "districts delivered" },
                { value: "100%", label: "authentic, batch-checked" },
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
            {/* Served from ImageKit rather than public/, like the 279 product
                shots — the host is already allow-listed, so next/image
                optimises it the same way and the asset can be swapped without
                a deploy. The source is 1122x1402 (4:5); object-cover crops to
                whatever the column gives it, and object-top keeps her face in
                frame when the viewport is short. */}
            <Image
              src="https://ik.imagekit.io/koreanhive/Hero-image/hero%20section%20image%20before%20and%20after.png"
              alt="A woman applying Korean skincare at her mirror, shown before and after a routine"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-top"
            />

            {/* Shop-the-shot strip, from the design. Real catalogue rows, not
                decoration: each thumbnail is a link to the product page, so
                the photograph becomes a way into the shop rather than
                something to scroll past. Hidden when the catalogue has fewer
                than three products to show. */}
            {shopTheShot.length === 3 ? (
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <div className="flex items-center gap-3 bg-white/95 p-3 shadow-[0_1px_4px_rgba(36,26,36,0.08)] backdrop-blur-[2px] sm:gap-4 sm:p-4">
                  <ul className="flex shrink-0 gap-2 sm:gap-2.5">
                    {shopTheShot.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/product/${product.slug}`}
                          className="group block w-14 sm:w-16"
                          title={product.name}
                        >
                          {/* The packshots are square and shot on pure white,
                              so on a white panel they read as one pale smudge
                              — the border is what makes three separate
                              products, not decoration. The tile is white
                              rather than blush because productImage() pads
                              each photo onto white, and a tinted tile would
                              show that pad as a square. */}
                          <span className="block aspect-square overflow-hidden border border-border bg-white p-1 transition-colors group-hover:border-primary">
                            {product.images[0]?.url ? (
                              <Image
                                src={productImage(product.images[0].url)}
                                alt={product.images[0].alt ?? product.name}
                                width={64}
                                height={64}
                                sizes="64px"
                                className="size-full object-contain"
                              />
                            ) : null}
                          </span>
                          <span className="mt-1 block text-center text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground group-hover:text-primary">
                            {stepForSlug(product.slug) ?? product.brand?.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="eyebrow leading-[1.35] text-primary">
                    Shop the routine
                    <br className="hidden sm:inline" /> in this shot
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- trust strip */}
      {/* Sits directly under the hero because it answers the three things a
          first-time buyer of imported skincare actually worries about —
          is it real, do I pay now, will it reach me — before they scroll. */}
      <section className="border-b border-border bg-blush/40">
        <ul className="container-page grid grid-cols-2 gap-x-6 gap-y-5 py-7 sm:grid-cols-3 lg:grid-cols-5">
          {TRUST.map((item) => (
            <li key={item.title}>
              <p className="text-[13px] font-bold leading-tight">{item.title}</p>
              <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
                {item.sub}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------- concerns */}
      {/* One row of six rather than a 3x2 grid of captioned cards. The old
          tiles carried a line of copy each ("Calm active spots without
          stripping"), which read well but made the section two screens tall on
          a phone and pushed the best sellers below the fold. A concern tile
          only has to answer "is my problem here, and is there stock behind
          it" — the picture and a count do that in a third of the height. */}
      <section className="container-page py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Shop by skin concern</p>
            <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
              Find what your skin is asking for
            </h2>
          </div>
          <Link
            href="/concerns"
            className="border-b border-chip-border pb-1 text-sm font-semibold text-primary"
          >
            All concerns
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CONCERNS.map((concern) => {
            const count = countConcernProducts(
              concernProductIds,
              concern.taxonomy,
            );

            return (
              <li key={concern.slug}>
                <Link
                  href={concern.href}
                  className="group block border border-border bg-card"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-blush">
                    <Image
                      src={concern.image}
                      alt={concern.label}
                      fill
                      sizes="(min-width: 1024px) 17vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="px-3 py-3">
                    <h3 className="text-[13.5px] font-semibold leading-snug group-hover:text-primary">
                      {concern.label}
                    </h3>
                    {/* A real count, deduplicated across the concern's
                        taxonomy values. Omitted entirely at zero rather than
                        printed as "0 products", which reads as a dead end. */}
                    {count > 0 ? (
                      <p className="mt-1 text-[11.5px] text-muted-foreground">
                        {count} {count === 1 ? "product" : "products"}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
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

      {/* ------------------------------------------------- four-step routine */}
      {/* The concrete half of the approach section above it: that one argues
          fewer products, this one names which four and in what order. */}
      <section className="container-page py-14">
        <p className="eyebrow">Start here</p>
        <h2 className="mt-3 max-w-[24ch] font-display text-[30px] leading-[1.18] tracking-[-0.01em] md:text-[38px]">
          Four products, used consistently, beat ten used for three weeks.
        </h2>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">
          Most people start Korean skincare with a ten-step routine they saw
          online, and stop by week three. We do it the other way round: four
          products matched to your skin and Bangladesh&apos;s weather. Add more
          only when your skin asks for it.
        </p>
        <ol className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ROUTINE.map((step) => (
            <li key={step.no} className="border-t border-hairline pt-4">
              <span className="font-display text-[26px] leading-none text-primary">
                {step.no}
              </span>
              <h3 className="mt-3 text-sm font-bold">{step.name}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
        <Button asChild className="mt-9">
          <Link href="/concerns">Build my routine</Link>
        </Button>
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
      {/* Cream ground and no rule, so the white cards are what separates this
          band from the page rather than a border drawn around it. */}
      <section className="container-page py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Shop by Korean brand</p>
            <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
              {brands.length} Korean brands, all authorised
            </h2>
          </div>
          {/* The way out of this section sits beside the heading, not under
              the grid. Ten of 71 brands are shown, so someone who does not
              see their brand needs the escape hatch before they have finished
              reading the tiles — not after scrolling past all of them. */}
          <Link
            href="/brands"
            className="border-b border-chip-border pb-1 text-sm font-semibold text-primary"
          >
            Explore all brands →
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {featuredBrands.map((brand) => (
            <li key={brand.id}>
              {/* Left-aligned, not centred. A centred name and count read as a
                  label on a plaque; ranged left they read as the start of a
                  list the shopper can scan straight down. */}
              <Link
                href={`/brand/${brand.slug}`}
                className="group block h-full border border-border bg-card p-5"
              >
                <span className="block text-[15px] font-semibold leading-snug text-foreground group-hover:text-primary">
                  {brand.name}
                </span>
                <span className="mt-1 block text-[12.5px] text-muted-foreground">
                  {brand._count.products}{" "}
                  {brand._count.products === 1 ? "product" : "products"}
                </span>
                {/* The whole tile is the link; this only says so. Without it
                    a bordered box holding two lines of text does not read as
                    something to click. */}
                <span className="mt-3.5 block text-[12.5px] font-medium text-primary">
                  Shop brand →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------------------- combos
          Real bundles, or nothing at all. This block used to hard-code three
          invented combos — "The Acne Reset", "Glass Skin Starter", "Everyday
          Sun Kit" — with invented savings on the badges, none of which existed
          in the database or anywhere else. */}
      {combos.length > 0 && (
        <section className="container-page py-14">
          <p className="eyebrow">Combo offers</p>
          <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
            Full routines, one price
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {combos.map((combo) => {
              const saving = combo.comparePrice
                ? combo.comparePrice - combo.price
                : 0;

              return (
                <Link
                  key={combo.id}
                  href="/combos"
                  className="group flex flex-col border border-border bg-card p-6"
                >
                  {saving > 0 && (
                    <Badge variant="saleSoft" className="self-start">
                      Save {formatBDT(saving)}
                    </Badge>
                  )}
                  <h3 className="mt-4 font-display text-xl group-hover:text-primary">
                    {combo.name}
                  </h3>
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    {combo.products.map((product) => product.name).join(" · ")}
                  </p>
                  <div className="flex-1" />
                  <span className="mt-5 border-b border-chip-border pb-1 text-sm font-semibold text-primary">
                    See the combo
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- reels */}
      <section className="border-y border-border bg-white">
        <div className="container-page py-14">
          <p className="eyebrow">Watch · discover · shop</p>
          <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
            See it used before you buy it
          </h2>
          {/* Real reels, loaded on click. The five tiles here were mock-up
              frames reading "drop your reel here", each linking to /shop. */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {REELS.map((reel) => (
              <ReelTile key={reel.url} reel={reel} />
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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The Hive Journal</p>
              <h2 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
                Routines that survive Bangladesh weather
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Read the journal →
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {POSTS.map((post) => (
              <PostCard key={post.slug} post={post} showSummary={false} />
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
