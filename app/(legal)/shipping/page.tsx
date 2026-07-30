import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/json-ld";
import { formatBDT, formatDeliveryWindow } from "@/lib/format";
import { faqJsonLd, type FaqEntry } from "@/lib/json-ld";
import { getDeliveryZones } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description:
    "Delivery charges and timelines for Inside Dhaka and Outside Dhaka, with cash on delivery available nationwide.",
  alternates: { canonical: "/shipping" },
};

export const revalidate = 3600;

export default async function ShippingPage() {
  const zones = await getDeliveryZones();

  // Rates come from the same table checkout charges from, so this page can
  // never quote a price the cart disagrees with.
  const zoneFaqs: FaqEntry[] = zones.map((zone) => ({
    question: `How much is delivery for ${zone.name} orders?`,
    answer: `Delivery for ${zone.name} orders costs ${formatBDT(zone.charge)} and takes ${formatDeliveryWindow(zone.minDays, zone.maxDays)}.${
      zone.freeShippingThreshold
        ? ` Orders over ${formatBDT(zone.freeShippingThreshold)} ship free.`
        : ""
    }`,
  }));

  const faqs: FaqEntry[] = [
    ...zoneFaqs,
    {
      question: "Do I need an account to order?",
      answer:
        "No. Korean Hive is guest checkout by default — you only need your name, phone number and delivery address.",
    },
    {
      question: "How do I pay?",
      answer:
        "Cash on delivery. You pay the courier when your parcel reaches you, so nothing leaves your pocket before the products arrive.",
    },
    {
      question: "How do I track my order?",
      answer:
        "Go to the Track Order page and enter your order number along with the phone number you used at checkout. No login is required.",
    },
    {
      question: "Are your products authentic?",
      answer:
        "Yes. Every product is sourced directly from Korea. We do not sell replicas or grey-market stock.",
    },
  ];

  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />

      <h1>Shipping &amp; Delivery</h1>
      <p>
        We deliver across Bangladesh with cash on delivery. Charges depend on
        whether you are inside or outside Dhaka, and are calculated
        automatically at checkout once you pick your district.
      </p>

      {zones.map((zone) => (
        <section key={zone.id}>
          <h2>{zone.name}</h2>
          <p>
            {formatBDT(zone.charge)} ·{" "}
            {formatDeliveryWindow(zone.minDays, zone.maxDays)}
            {zone.freeShippingThreshold
              ? ` · free over ${formatBDT(zone.freeShippingThreshold)}`
              : ""}
          </p>
        </section>
      ))}

      <h2>Frequently asked questions</h2>
      <dl className="mt-4 space-y-5">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <dt className="font-medium">{faq.question}</dt>
            <dd className="mt-1 text-muted-foreground">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
