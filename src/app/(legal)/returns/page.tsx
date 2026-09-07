import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { faqJsonLd, type FaqEntry } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description:
    "Korean Hive's 7-day return window for unopened products — what qualifies, who pays return shipping, and how refunds are made.",
  alternates: { canonical: "/returns" },
};

/**
 * The window and the condition here must match what the product page's trust
 * tiles promise ("7-day returns · Unopened products"). They are the same
 * promise; if one changes the other has to.
 */
const faqs: FaqEntry[] = [
  {
    question: "How long do I have to return something?",
    answer:
      "Seven days from the day your parcel is delivered. Contact us within that window to start a return.",
  },
  {
    question: "What condition must the product be in?",
    answer:
      "Unopened and unused, with its seal and any outer packaging intact. Skincare and cosmetics that have been opened cannot be resold and cannot be returned unless they arrived damaged or were the wrong item.",
  },
  {
    question: "Who pays for return delivery?",
    answer:
      "We do, if the fault is ours — a wrong, damaged or expired item. If you simply changed your mind, the return courier charge is yours.",
  },
  {
    question: "How is a refund paid?",
    answer:
      "Because orders are cash on delivery, refunds are sent by bKash or Nagad to the number you give us, within 7 working days of the product reaching us and passing inspection.",
  },
];

export default function ReturnsPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />

      <h1>Returns &amp; Refunds</h1>
      <p>
        Every product we sell is imported sealed and checked before it is
        packed. If something still arrives wrong, we will put it right.
      </p>

      <h2>The window</h2>
      <p>
        You have <strong>7 days</strong> from delivery to tell us you want to
        return something. Contact us through the{" "}
        <Link href="/contact">contact page</Link> with your order number and the
        phone number you ordered with, and a photograph if the item arrived
        damaged.
      </p>

      <h2>What can be returned</h2>
      <p>
        <strong>Unopened products</strong>, with the seal and outer packaging
        intact, within the 7-day window.
      </p>
      <p>
        <strong>Anything we got wrong</strong> — the wrong product, a damaged
        parcel, or an item close to or past its expiry date — opened or not.
      </p>
      <p>
        <strong>What cannot be returned:</strong> opened or used skincare and
        cosmetics, for hygiene reasons, unless they fall into the case above.
        Sale items follow the same rules as everything else.
      </p>

      <h2>Who pays</h2>
      <p>
        If the fault is ours we arrange and pay for the return, and you are out
        of pocket for nothing. If you changed your mind, the return courier
        charge is yours and the original delivery charge is not refunded.
      </p>

      <h2>How refunds work</h2>
      <p>
        Orders are paid in cash at the door, so refunds go back by bKash or
        Nagad to a number you give us. We inspect the returned product first,
        then send the refund within 7 working days. You will get a message when
        it goes out.
      </p>
      <p>
        Where you would rather have a replacement than a refund, say so when
        you contact us and we will send one if we have it in stock.
      </p>

      <h2>Refusing delivery</h2>
      <p>
        You can inspect the outside of the parcel before you pay. If it is
        visibly damaged, refuse it — you pay nothing and we will sort it out
        from our end.
      </p>
    </>
  );
}
