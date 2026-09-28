import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  comboLeastStock,
  comboTrackItems,
} from "@/components/combo/combo-card";
import { ComboAddButton } from "@/components/combo/combo-add-button";
import { FaqAccordion } from "@/components/home/faq-accordion";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { COMBO_BY_SLUG, COMBOS } from "@/data/combos";
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

  const saving = combo.comparePrice ? combo.comparePrice - combo.price : 0;
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

  const leastStock = comboLeastStock(combo);
  const inStock = leastStock > 0;
  const stockLine = !inStock
    ? "Out of stock"
    : leastStock <= 5
      ? `Only ${leastStock} left`
      : "In stock · ships today";

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Combo Offers", path: "/combos" },
    { name: seed.name, path: `/combos/${slug}` },
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

      <section className="mt-4 grid gap-6 sm:mt-6 sm:gap-10 lg:grid-cols-2 lg:gap-14">
        {/* The poster has the name and routine printed on it, so it keeps
            its square, whole — object-contain, never cropped. */}
        <div className="relative lg:sticky lg:top-37.5 lg:self-start">
          <div className="relative aspect-square w-full border border-border bg-blush">
            <Image
              src={seed.imageUrl}
              alt={seed.imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain"
            />
          </div>
          <div className="pointer-events-none absolute left-3.5 top-3.5 z-10 flex flex-col items-start gap-2">
            {off !== null && <Badge variant="sale">−{off}%</Badge>}
          </div>
        </div>

        <div>
          <p className="eyebrow">{seed.concern}</p>
          <h1 className="mt-3 font-display text-[26px] leading-tight tracking-[-0.01em] sm:text-[30px] md:text-[36px]">
            {page.title}
          </h1>
          <p className="mt-3.5 max-w-[560px] text-[15.5px] leading-relaxed text-muted-foreground">
            {page.shortDescription}
          </p>

          {/* ------------------------------------------------ the price */}
          <div className="mt-6 border border-border bg-cream/60 p-6">
            {combo.comparePrice && (
              <div className="flex items-baseline justify-between text-[13px] text-muted-foreground">
                <span>Regular price</span>
                <span className="line-through">
                  {formatBDT(combo.comparePrice)}
                </span>
              </div>
            )}
            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
              <span className="text-[13px] font-semibold">Combo price</span>
              <span className="font-display text-[34px] leading-none">
                {formatBDT(combo.price)}
              </span>
            </div>
            {saving > 0 && (
              <p className="mt-3 text-[13px] font-semibold text-sale">
                You save {formatBDT(saving)}
                {off !== null && ` (${off}% OFF)`}
              </p>
            )}
            {freeDelivery && (
              <p className="mt-3.5 bg-success-bg px-3 py-2.5 text-[12.5px] font-bold text-success">
                FREE delivery all over Bangladesh
              </p>
            )}

            <div className="mt-5">
              <ComboAddButton
                comboSlug={combo.slug}
                comboPrice={combo.price}
                trackItems={comboTrackItems(combo)}
                disabled={!inStock}
              />
            </div>
            <p className="mt-2.5 text-center text-[11.5px] text-muted-foreground">
              {stockLine} · Cash on delivery
            </p>
          </div>

          {/* ------------------------------------------- what's in the box */}
          <div className="mt-6">
            <p className="eyebrow">In this combo</p>
            {/* Names only — the poster already pictures the three products. */}
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] leading-snug">
              {combo.products.map((product) => (
                <li key={product.slug}>{product.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ long description */}
      <section className="mt-10 border border-border bg-white lg:mt-16">
        <div className="max-w-3xl p-8 lg:p-12">
          {page.sections.map((section, index) => {
            const List = section.ordered ? "ol" : "ul";

            return (
              <div key={section.heading} className={index > 0 ? "mt-10" : undefined}>
                <h2 className="font-display text-2xl leading-snug md:text-[28px]">
                  {section.heading}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-3.5 text-[15px] leading-relaxed text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.items && (
                  <List
                    className={`mt-3.5 space-y-2.5 pl-5 text-[15px] leading-relaxed text-muted-foreground ${
                      section.ordered ? "list-decimal" : "list-disc"
                    }`}
                  >
                    {section.items.map((item) => (
                      <li key={item.label ?? item.text}>
                        {item.label && (
                          <span className="font-semibold text-foreground">
                            {item.label}
                          </span>
                        )}
                        {item.label && " – "}
                        {item.text}
                      </li>
                    ))}
                  </List>
                )}
              </div>
            );
          })}

          <p className="mt-10 border-t border-hairline pt-4 text-[13px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Please note:</span>{" "}
            {seed.note}
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- faq */}
      <section className="mt-10 grid gap-8 lg:mt-16 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
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
