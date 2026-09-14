import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ComboCard } from "@/components/combo/combo-card";
import type { FaqItem } from "@/components/home/faq-accordion";
import { COMBOS } from "@/data/combos";
import { siteConfig } from "@/lib/site";
import { getCombos, getDeliveryZones } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Combo Offers",
  description:
    "Full Korean skincare routines bundled at one price, with cash on delivery across Bangladesh.",
  alternates: { canonical: "/combos" },
};

export const revalidate = 3600;

/**
 * Editorial detail that lives in src/data/combos.ts rather than the database:
 * step roles, the suitability note, the routine order, the badge and the
 * image. The Combo collection holds what a shopper buys — name, price,
 * members — and this holds what the client's content document says about it.
 */
const SEED_BY_SLUG = new Map(COMBOS.map((combo) => [combo.slug, combo]));

const HERO_IMAGE =
  "https://ik.imagekit.io/koreanhive/combo/glass%20skin%20combo.webp";

const ADVICE_IMAGE =
  "https://ik.imagekit.io/koreanhive/skin%20concern/Healthy-looking.webp";

/* The document's own combo questions, in the language they were written in. */
const COMBO_FAQS: FaqItem[] = [
  {
    lang: "bn",
    question: "কম্বোর প্রোডাক্ট বদলানো যাবে?",
    answer:
      "যাবে। WhatsApp-এ মেসেজ দিন — আপনার skin type অনুযায়ী কোনো একটি প্রোডাক্ট বদলে দেওয়া যায়, দাম সেই অনুযায়ী সমন্বয় হবে।",
  },
  {
    lang: "bn",
    question: "একটি কম্বো কত দিন চলে?",
    answer:
      "সাধারণত ২.৫ থেকে ৩ মাস, দিনে দুইবার ব্যবহারে। Sunscreen সাধারণত আগে শেষ হয়।",
  },
  {
    lang: "bn",
    question: "সবগুলো একসাথে ব্যবহার শুরু করব?",
    answer:
      "না। প্রথম সপ্তাহে cleanser ও moisturiser দিয়ে শুরু করুন, তারপর serum বা ampoule যোগ করুন। এতে ত্বকে জ্বালাপোড়ার ঝুঁকি কমে।",
  },
  {
    lang: "bn",
    question: "কম্বো ফেরত দেওয়া যাবে?",
    answer:
      "সিল না খোলা অবস্থায় ডেলিভারির ৭ দিনের মধ্যে সম্পূর্ণ কম্বো ফেরত দেওয়া যাবে।",
  },
];

export default async function CombosPage() {
  const [combos, zones] = await Promise.all([getCombos(), getDeliveryZones()]);

  // The strictest threshold in the country. A combo only carries the free
  // delivery badge when it clears every zone, not just Dhaka.
  const thresholds = zones
    .map((zone) => zone.freeShippingThreshold)
    .filter((value): value is number => typeof value === "number" && value > 0);

  const freeDeliveryEverywhereAbove =
    thresholds.length === zones.length && thresholds.length > 0
      ? Math.max(...thresholds)
      : null;

  // Tabs come from what is actually live. A tab that filters to nothing is a
  // dead end, and combos block themselves when a product goes out of stock.
  const tags = [
    ...new Set(
      combos.flatMap((combo) => {
        const seed = SEED_BY_SLUG.get(combo.slug);
        return seed ? [seed.tag] : [];
      }),
    ),
  ];

  return (
    <div>
      {/* ------------------------------------------------------------ hero */}
      <section className="container-page pt-8">
        <nav className="text-[12px] text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>{" "}
          / <span className="text-foreground">Combo Offers</span>
        </nav>

        <div className="mt-4 grid overflow-hidden border border-border bg-white lg:grid-cols-[1.15fr_1fr]">
          <div className="p-8 lg:p-12">
            <p className="eyebrow">Combo offers</p>
            <h1 className="mt-4 font-display text-[34px] leading-[1.08] tracking-[-0.01em] md:text-[46px]">
              A complete routine, priced as one
            </h1>
            <p className="mt-5 max-w-[46ch] text-[14.5px] leading-relaxed text-muted-foreground">
              Every combo is built in step order — cleanser through sunscreen —
              so the products work together instead of competing. Buying the
              routine costs less than the same products bought separately.
            </p>

            {/* Three claims the page can stand behind: the order is in the
                data, the saving is computed from live prices by the sync, and
                the delivery line is checked against the real zone thresholds
                on each card rather than asserted here. */}
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                {
                  title: "Step order, not discount order",
                  copy: "Each combo is a working routine from cleanser to sunscreen.",
                },
                {
                  title: "Cheaper than buying apart",
                  copy: "Every saving is calculated from our own product prices.",
                },
                {
                  title: "Suitability stated",
                  copy: "Each combo says who it suits, and who should skip it.",
                },
              ].map((item) => (
                <li key={item.title} className="border-t-2 border-primary pt-3">
                  <h2 className="text-[13px] font-bold leading-snug">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                    {item.copy}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative order-first min-h-[240px] bg-blush lg:order-last lg:min-h-full">
            <Image
              src={HERO_IMAGE}
              alt="A Korean skincare routine laid out as one set"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <div className="container-page py-12">
        {combos.length === 0 ? (
          <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No combos running right now — check back soon.
          </p>
        ) : (
          <>
            {tags.length > 1 && (
              /* Labels, not filters. Ten combos fit on one page, and a filter
                 that reloads the page to hide four cards costs more than it
                 saves — so these say what is here rather than pretending to
                 narrow it. */
              <ul className="flex flex-wrap gap-2">
                <li>
                  <span className="inline-block bg-ink px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">
                    All combos
                  </span>
                </li>
                {tags.map((tag) => (
                  <li key={tag}>
                    <span className="inline-block border border-border bg-white px-4 py-2 text-[12px] font-semibold text-foreground">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <ul className="mt-6 space-y-5">
              {combos.map((combo) => (
                <ComboCard
                  key={combo.id}
                  combo={combo}
                  seed={SEED_BY_SLUG.get(combo.slug)}
                  freeDeliveryEverywhereAbove={freeDeliveryEverywhereAbove}
                />
              ))}
            </ul>

            {/* The suitability notes, kept together under the grid rather than
                repeated inside every card. The client's publishing checklist
                requires them visible — for the retinol combo it is a safety
                instruction, not a disclaimer — but eleven of them inline
                turned each card into a wall of small print. */}
            <section className="mt-10 border border-border bg-white p-6 lg:p-8">
              <p className="eyebrow">Before you buy</p>
              <h2 className="mt-3 font-display text-[22px] tracking-[-0.01em]">
                What each routine can and cannot do
              </h2>
              <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                {combos.map((combo) => {
                  const seed = SEED_BY_SLUG.get(combo.slug);
                  if (!seed) return null;

                  return (
                    <div
                      key={combo.id}
                      className="border-t border-hairline pt-3"
                    >
                      <dt className="text-[13px] font-semibold">{combo.name}</dt>
                      <dd className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                        {seed.note}
                      </dd>
                      <dd className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          How to use:
                        </span>{" "}
                        {seed.routine}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          </>
        )}

        {/* ---------------------------------------------------- ask a human */}
        {/* Ink ground with a photograph beside it, as the design draws it.
            It is the one block on the page that is not selling a bundle, and
            the colour flip is what stops it reading as an eleventh combo. */}
        <section className="mt-16 grid overflow-hidden bg-ink text-blush lg:grid-cols-2">
          <div className="p-8 lg:p-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-chip-border">
              Not sure which combo
            </p>
            <h2 className="mt-4 font-display text-[28px] leading-[1.18] tracking-[-0.01em] text-white md:text-[36px]">
              Tell us about your skin and we will pick one for you
            </h2>
            <p className="mt-4 max-w-[44ch] text-[14.5px] leading-relaxed text-light">
              Message our team with your skin type, your main concern, and what
              you already use. We will recommend the right combo — and tell you
              honestly if you only need one product instead of four.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {siteConfig.contact.whatsapp && (
                <a
                  href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white px-6 py-4 text-sm font-bold text-ink"
                >
                  Message on WhatsApp
                </a>
              )}
              <Link
                href="/blog"
                className="border border-blush/35 px-6 py-4 text-sm font-semibold text-blush"
              >
                Read the routine guides
              </Link>
            </div>
          </div>

          <div className="relative order-first min-h-[260px] lg:order-last lg:min-h-full">
            <Image
              src={ADVICE_IMAGE}
              alt="Choosing a Korean skincare routine"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </section>

        {/* ------------------------------------------------------------ faq */}
        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div>
            <p className="eyebrow">Combo questions</p>
            <h2 className="mt-3 font-display text-[26px] leading-tight tracking-[-0.01em] md:text-[34px]">
              Before you buy a routine
            </h2>
          </div>

          {/* Plain list, not the accordion used on the home page: the design
              shows every answer open, and with four short answers there is
              nothing here worth a click to reveal. */}
          <dl>
            {COMBO_FAQS.map((faq) => (
              <div
                key={faq.question}
                lang={faq.lang}
                className="border-t border-hairline py-5"
              >
                <dt className="text-[15px] font-bold leading-snug">
                  {faq.question}
                </dt>
                <dd className="mt-2 text-[13.5px] leading-[1.7] text-muted-foreground">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
