import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

export default function SearchPage() {
  return (
    <PageShell
      title="Search"
      description="Instant product search, powered by Meilisearch."
      step="a later step (Meilisearch)"
    />
  );
}
