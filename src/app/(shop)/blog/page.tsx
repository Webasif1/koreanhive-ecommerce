import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Beauty Journal",
  description:
    "Korean skincare routines, ingredient guides and product reviews from Korean Hive.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <PageShell
      title="Beauty Journal"
      description="Routines, ingredient explainers and honest reviews."
      step="a later step"
    />
  );
}
