import type { Metadata } from "next";

import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <PageShell
      title="Wishlist"
      description="Products you saved for later."
      step="a later step"
    />
  );
}
