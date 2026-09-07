import type { ReactNode } from "react";

import { ChatWidget } from "@/components/chatbot/chat-widget";
import { FirstVisitLoader } from "@/components/layout/first-visit-loader";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WishlistProvider } from "@/components/product/wishlist-provider";
import { JsonLd } from "@/components/seo/json-ld";
import { deliveryPromise } from "@/lib/delivery-promise";
import { organizationJsonLd, websiteJsonLd } from "@/lib/json-ld";
import { getDeliveryZones } from "@/server/queries/catalog";

/** Storefront chrome. Lives here rather than in the root layout so the
 *  admin area can render without a shop header, footer or bottom nav. */
export async function StorefrontShell({ children }: { children: ReactNode }) {
  // Cached for an hour and tagged, so reading it here does not make every
  // storefront route dynamic. One source of truth for the delivery promise:
  // header, footer and /shipping all resolve from these rows.
  const zones = await getDeliveryZones();
  const { bn: deliveryLine } = deliveryPromise(zones);

  return (
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <FirstVisitLoader />

      <WishlistProvider>
        <SiteHeader deliveryLine={deliveryLine} />
        <main className="flex-1">{children}</main>
        <SiteFooter deliveryLine={deliveryLine} />
        <MobileBottomNav />
        <ChatWidget />
      </WishlistProvider>
    </div>
  );
}
