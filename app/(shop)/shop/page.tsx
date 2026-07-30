import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Shop All Korean Skincare & Beauty",
  description:
    "Browse every Korean beauty and skincare product available at Korean Hive, with cash on delivery across Bangladesh.",
};

export default function ShopPage() {
  return (
    <PageShell
      title="Shop"
      description="Every product, filterable by category, brand, skin concern and price."
      step="Step 5 (Catalog UI)"
    />
  );
}
