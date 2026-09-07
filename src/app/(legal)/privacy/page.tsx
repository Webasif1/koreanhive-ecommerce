import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Korean Hive collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

/**
 * Written against what the application actually does, not a generic template:
 * guest orders only, cash on delivery, no customer accounts, no payment
 * credentials, no analytics or advertising trackers in the codebase.
 *
 * If any of that changes — an online payment gateway, a pixel, a newsletter —
 * this page has to change with it.
 */
export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        This policy explains what Korean Hive collects when you shop with us,
        why we collect it, how long we keep it, and how to have it removed. It
        applies to {siteConfig.url.replace(/^https?:\/\//, "")} and to orders
        placed through it.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>When you place an order.</strong> Your name, mobile number,
        delivery address (house and road, area or thana, district, and postal
        code if you give one), an optional email address, and an optional
        delivery note. We also store what you ordered, the price you were
        charged, and the delivery status.
      </p>
      <p>
        <strong>When you browse.</strong> Your cart and wishlist are kept in
        cookies set by our own site. The cart cookie holds product identifiers
        and quantities only — never prices, and never anything about you.
      </p>
      <p>
        <strong>When you use the shop assistant.</strong> Nothing is stored.
        The assistant is stateless: your message is answered and discarded, and
        no conversation history is written to our database.
      </p>
      <p>
        <strong>What we never collect.</strong> Every order is cash on
        delivery, so we never ask for and never hold card numbers, bank
        details, bKash or Nagad PINs, or one-time passwords. Nobody from Korean
        Hive will ever ask you for them.
      </p>

      <h2>Why we collect it</h2>
      <p>
        To pack and deliver your order, to call you to confirm it before
        dispatch, to hand your address to the courier who brings it, to let you
        track it afterwards, and to keep the records a business is required to
        keep. We do not use your details for anything else.
      </p>

      <h2>Who else sees it</h2>
      <p>
        The courier delivering your parcel receives your name, address and
        phone number, because they cannot deliver without them. Our website and
        database are hosted by service providers who process data on our
        instruction and for no purpose of their own. We do not sell, rent or
        trade your information to anyone, and we do not share it for
        advertising.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Order records are kept for as long as we may need them for accounting,
        returns and dispute resolution. Cart and wishlist cookies expire on
        their own — the cart after 30 days, the wishlist after a year — and you
        can clear them at any time from your browser.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us what we hold about you, ask us to correct it, or ask us
        to delete it. Write to{" "}
        <Link href="/contact">our contact page</Link> with your order number and
        the phone number you used, so we can be sure we are talking to the
        right person. We will remove what we are not required to keep. Deleting
        an order that has not yet been delivered will cancel it.
      </p>

      <h2>Children</h2>
      <p>
        Korean Hive is intended for adults. We do not knowingly collect
        information from anyone under 18. If you believe a child has given us
        their details, contact us and we will remove them.
      </p>

      <h2>Security</h2>
      <p>
        The site is served over HTTPS. Staff access to order data requires an
        individual login, and passwords are stored hashed, never in plain text.
        No system is perfect, but we hold no payment credentials at all, which
        removes the most damaging thing a shop can lose.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes we will publish the new version on this page.
        Continuing to use the site after a change means you accept it.
      </p>
    </>
  );
}
