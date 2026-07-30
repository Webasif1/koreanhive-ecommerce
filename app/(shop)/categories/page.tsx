import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Cleansers, toners, essences, serums, moisturisers, sunscreen, masks and makeup — shop Korean beauty by category.",
};

export default function CategoriesPage() {
  return (
    <PageShell
      title="Categories"
      description="Browse by routine step and skin concern."
      step="Step 5 (Catalog UI)"
    />
  );
}
