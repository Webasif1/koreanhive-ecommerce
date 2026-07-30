import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Your Cart",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <PageShell
      title="Your Cart"
      description="Cookie-based guest cart — no account required."
      step="Step 6 (Cart + Checkout)"
    />
  );
}
