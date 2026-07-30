import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "About Korean Hive",
  description:
    "Korean Hive brings 100% authentic Korean beauty and skincare to Bangladesh, with cash on delivery nationwide.",
};

export default function AboutPage() {
  return (
    <PageShell
      title="About Korean Hive"
      description="Authentic K-beauty, sourced direct from Korea, priced for Bangladesh."
      step="a later step"
    />
  );
}
