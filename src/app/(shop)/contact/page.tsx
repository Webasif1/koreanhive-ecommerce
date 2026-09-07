import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach the Korean Hive team about an order, a product question or wholesale. Cash on delivery across Bangladesh.",
  alternates: { canonical: "/contact" },
};

/**
 * Only the channels configured in the environment are shown. An unset channel
 * renders nothing rather than a plausible-looking address that reaches no one
 * — a contact page that silently swallows messages is worse than one that
 * points at the routes which do work.
 */
export default function ContactPage() {
  const { email, phone, whatsapp, hours } = siteConfig.contact;
  const hasDirectChannel = Boolean(email || phone || whatsapp);

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Contact Us
        </h1>
        <p className="mt-3 text-muted-foreground">
          Questions about an order, a product, or wholesale — we answer during{" "}
          {hours}.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">
              About an order you placed
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The fastest answer is the tracking page. Enter your order number
              and the phone number you ordered with — no account needed.
            </p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/track">Track your order</Link>
            </Button>
          </div>

          <div className="border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">
              Choosing a product
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The shop assistant, bottom right of every page, recommends from
              our real catalogue and understands Bangla, English and Banglish.
            </p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/concerns">Shop by skin concern</Link>
            </Button>
          </div>
        </div>

        {hasDirectChannel && (
          <div className="mt-4 border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Talk to us</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {phone && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="font-medium text-primary"
                    >
                      {phone}
                    </a>
                  </dd>
                </div>
              )}
              {whatsapp && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-muted-foreground">WhatsApp</dt>
                  <dd>
                    <a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                      className="font-medium text-primary"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {whatsapp}
                    </a>
                  </dd>
                </div>
              )}
              {email && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${email}`}
                      className="font-medium text-primary"
                    >
                      {email}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              We will never ask you for a card number, PIN or OTP. Every order
              is cash on delivery — you pay the courier at your door.
            </p>
          </div>
        )}

        <div className="mt-4 border border-border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">
            Returns and delivery
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Delivery charges and timelines are on the{" "}
            <Link href="/shipping" className="text-primary">
              Shipping &amp; Delivery
            </Link>{" "}
            page, and the 7-day return window is explained under{" "}
            <Link href="/returns" className="text-primary">
              Returns &amp; Refunds
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
