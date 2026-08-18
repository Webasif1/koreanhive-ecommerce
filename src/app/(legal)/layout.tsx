import type { ReactNode } from "react";

import { StorefrontShell } from "@/components/layout/storefront-shell";

/**
 * Narrow reading column shared by every policy page.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <StorefrontShell>
      <div className="container-page py-10 md:py-14">
        <div className="mx-auto max-w-3xl [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-muted-foreground">
          {children}
        </div>
      </div>
    </StorefrontShell>
  );
}
