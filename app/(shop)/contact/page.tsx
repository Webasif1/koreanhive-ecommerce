import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Reach the Korean Hive team about an order, a product question or a partnership.",
};

export default function ContactPage() {
  return (
    <PageShell
      title="Contact Us"
      description="Questions about an order, a product, or wholesale."
      step="a later step"
    />
  );
}
