import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <PageShell
      title="Checkout"
      description="One page, guest by default, cash on delivery. Shipping updates automatically for Inside/Outside Dhaka."
      step="Step 6 (Cart + Checkout)"
    />
  );
}
