import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your Korean Hive order with your order number and phone number. No login needed.",
};

export default function TrackPage() {
  return (
    <PageShell
      title="Track Your Order"
      description="Enter your order number and phone number. No account, no login."
      step="Step 7 (Order Tracking)"
    />
  );
}
