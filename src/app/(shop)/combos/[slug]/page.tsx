import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CreditCard,
  Globe,
  Layers,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { ComboBuyBox } from "@/components/combo/combo-buy-box";
import {
  comboLeastStock,
  comboTrackItems,
} from "@/components/combo/combo-card";
import { FaqAccordion } from "@/components/home/faq-accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { COMBO_BY_SLUG, COMBOS, type ComboPageSection } from "@/data/combos";
import { discountPercent, formatBDT } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from "@/lib/json-ld";
import { absoluteUrl, withSiteSuffix } from "@/lib/site";
import { getComboBySlug, getDeliveryZones } from "@/server/queries/catalog";

type ComboPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

/** Only combos whose seed carries page copy get a page of their own. */
export function generateStaticParams() {
  return COMBOS.filter((combo) => combo.page).map((combo) => ({
    slug: combo.slug,
  }));
}

export async function generateMetadata({
  params,
}: ComboPageProps): Promise<Metadata> {
  const { slug } = await params;
  const seed = COMBO_BY_SLUG.get(slug);

  if (!seed?.page) return { title: "Combo Not Found" };

  const { page } = seed;

  return {
    title: { absolute: withSiteSuffix(page.metaTitle) },
    description: page.metaDescription,
    alternates: { canonical: `/combos/${slug}` },
    openGraph: {
      type: "website",
      url: absoluteUrl(`/combos/${slug}`),
      title: page.title,
      description: page.shortDescription,
      images: [{ url: seed.imageUrl, alt: seed.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.shortDescription,
      images: [seed.imageUrl],
    },
  };
}

/** One section of the long description, as the body of an accordion item. */
function SectionBody({ section }: { section: ComboPageSection }) {
  const List = section.ordered ? "ol" : "ul";

  return (
    <div className="pb-5 pr-2 text-[14.5px] leading-relaxed text-muted-foreground sm:pr-10">
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="mt-1 first:mt-0">
          {paragraph}
        </p>
      ))}
      {section.items && (
        <List
          className={`space-y-2 pl-5 ${section.ordered ? "list-decimal" : "list-disc"}`}
        >
          {section.items.map((item) => (
            <li key={item.label ?? item.text}>
              {item.label && (
                <span className="font-semibold text-foreground">{item.label}</span>
              )}
              {item.label && " – "}
              {item.text}
            </li>
          ))}
        </List>
      )}
    </div>
  );
}

export default async function ComboDetailPage({ params }: ComboPageProps) {
  const { slug } = await params;
  const seed = COMBO_BY_SLUG.get(slug);

  // no copy, or not published by combos:sync — nothing a shopper can buy here
  if (!seed?.page) notFound();

  const [combo, zones] = await Promise.all([
    getComboBySlug(slug),
    getDeliveryZones(),
  ]);

  if (!combo) notFound();

  const { page } = seed;
  const off = discountPercent(combo.price, combo.comparePrice);

  // Same rule as the /combos cards: free delivery is promised only when the
  // price clears every zone's threshold, not just Dhaka's.
  const thresholds = zones
    .map((zone) => zone.freeShippingThreshold)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const freeDelivery =
    thresholds.length === zones.length &&
    thresholds.length > 0 &&
    combo.price >= Math.max(...thresholds);
  const cheapestCharge = Math.min(...zones.map((zone) => zone.charge));

  const leastStock = comboLeastStock(combo);
  const inStock = leastStock > 0;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Combo Offers", path: "/combos" },
    { name: seed.name, path: `/combos/${slug}` },
  ];

  // the product-page facts, as the design lays them out
  const facts = [
    { icon: Package, label: "In the box", value: `${combo.products.length} full-size products` },
    { icon: Layers, label: "Routine", value: `${combo.products.length}-step · AM & PM` },
    { icon: Globe, label: "Origin", value: "Korea" },
    {
      icon: Truck,
      label: "Delivery",
      value: freeDelivery
        ? "Free all over Bangladesh"
        : Number.isFinite(cheapestCharge)
          ? `From ${formatBDT(cheapestCharge)}`
          : "Nationwide",
    },
    { icon: CreditCard, label: "Payment", value: "Cash on delivery" },
    { icon: ShieldCheck, label: "Status", value: null },
  ];

  return (
    <div className="container-page py-8">
      <JsonLd
        data={productJsonLd({
          name: page.title,
          slug,
          path: `/combos/${slug}`,
          description: page.shortDescription,
          sku: null,
          images: [seed.imageUrl],
          price: combo.price,
          comparePrice: combo.comparePrice,
          inStock,
          brandName: null,
          ratingAvg: 0,
          ratingCount: 0,
          priceRange: null,
        })}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={faqJsonLd(page.faqs)} />

      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/combos" className="hover:text-primary">
              Combo Offers
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{seed.name}</li>
        </ol>
      </nav>

      <section className="mt-4 grid gap-6 border border-border bg-white p-4 sm:mt-6 sm:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 lg:p-8">
        {/* The poster has the name and routine printed on it, so it keeps
            its square, whole — object-contain, never cropped. */}
        <div className="relative lg:sticky lg:top-37.5 lg:self-start">
          <div className="relative aspect-square w-full border border-border bg-blush">
            <Image
              src={seed.imageUrl}
              alt={seed.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-contain"
            />
          </div>
          {off !== null && (
            <span className="absolute right-0 top-0 bg-primary px-3 py-2 text-center text-[13px] font-bold leading-tight text-white">
              {off}%
              <br />
              OFF
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="eyebrow">{seed.concern}</p>
          <h1 className="mt-2.5 font-display text-[24px] leading-tight tracking-[-0.01em] text-primary sm:text-[28px] md:text-[32px]">
            {page.title}
          </h1>

          {/* ---------------------------------------------- the facts grid */}
          <dl className="mt-5 grid grid-cols-2 gap-2 border border-border bg-cream/50 p-2 sm:grid-cols-3">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-2.5 bg-white p-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-mulberry-hover" aria-hidden />
                <div className="min-w-0">
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-1 text-[13px] font-semibold leading-snug">
                    {value ?? (
                      <Badge variant={inStock ? "verified" : "muted"} size="sm">
                        {inStock
                          ? leastStock <= 5
                            ? `Only ${leastStock} left`
                            : "In stock"
                          : "Out of stock"}
                      </Badge>
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          {/* ------------------------------------------------ the buy box */}
          <div className="mt-6">
            <ComboBuyBox
              comboSlug={combo.slug}
              price={combo.price}
              comparePrice={combo.comparePrice}
              maxSets={leastStock}
              trackItems={comboTrackItems(combo)}
            />
          </div>

          <p className="mt-5 text-[14.5px] leading-relaxed text-muted-foreground">
            {page.shortDescription}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Includes:</span>{" "}
            {combo.products.map((product) => product.name).join(" · ")}
          </p>
        </div>
      </section>

      {/* ----------------------------------------------- details, folded */}
      <section className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
        <div>
          <p className="eyebrow">Combo details</p>
          <h2 className="mt-3 font-display text-[26px] leading-tight tracking-[-0.01em] md:text-[34px]">
            Everything about this routine
          </h2>
          <p className="mt-4 border-t border-hairline pt-4 text-[13px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Please note:</span>{" "}
            {seed.note}
          </p>
        </div>

        {/* <details>, like the FAQ: no JavaScript, and the text stays in the
            page for search engines while it is folded. The first is open so
            the page does not land on a wall of closed rows. */}
        <div>
          {page.sections.map((section, index) => (
            <details
              key={section.heading}
              open={index === 0}
              className="group border-t border-hairline last:border-b"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden">
                <h3 className="text-[16px] font-semibold leading-snug">
                  {section.heading}
                </h3>
                <span
                  aria-hidden
                  className="shrink-0 text-[18px] leading-none text-primary transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <SectionBody section={section} />
            </details>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- faq */}
      <section className="mt-10 grid gap-8 lg:mt-16 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
        <div>
          <p className="eyebrow">Combo questions</p>
          <h2 className="mt-3 font-display text-[26px] leading-tight tracking-[-0.01em] md:text-[34px]">
            Before you buy this routine
          </h2>
        </div>
        <FaqAccordion items={page.faqs} />
      </section>
    </div>
  );
}
