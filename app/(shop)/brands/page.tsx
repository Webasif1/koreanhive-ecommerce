import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Brands",
  description:
    "Authentic Korean beauty brands stocked by Korean Hive, delivered across Bangladesh.",
};

export default function BrandsPage() {
  return (
    <PageShell
      title="Brands"
      description="Every K-beauty house we stock, sourced direct from Korea."
      step="Step 5 (Catalog UI)"
    />
  );
}
