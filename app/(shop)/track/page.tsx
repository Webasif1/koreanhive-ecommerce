import type { Metadata } from "next";

import { TrackForm } from "@/components/track/track-form";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your Korean Hive order with your order number and phone number. No account or login needed.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  // the confirmation page links here with the number prefilled; the phone is
  // never put in the URL, so a shared link cannot expose someone's order
  const { order } = await searchParams;

  return (
    <div className="container-page py-10 md:py-14">
      <header className="max-w-2xl space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Track Your Order
        </h1>
        <p className="text-muted-foreground">
          Enter your order number and the phone number you used at checkout.
          No account, no login.
        </p>
      </header>

      <TrackForm defaultOrderNumber={order} />
    </div>
  );
}
