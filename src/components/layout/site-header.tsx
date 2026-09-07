import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { CartBadge } from "@/components/cart/cart-badge";
import {
  HeaderSearchInput,
  HeaderSearchInputFallback,
} from "@/components/layout/header-search";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { mainNav } from "@/lib/navigation";

export function SiteHeader({ deliveryLine }: { deliveryLine: string }) {
  return (
    <>
      {/* Bangla carries the offer, English the rest — never mixed in one sentence.
          The threshold comes from the live DeliveryZone rows, so this banner can
          never promise free delivery that checkout then charges for. */}
      <div className="bg-ink text-[12.5px] text-blush">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-7 gap-y-1 py-2.5 text-center">
          {/* deliveryPromise() already ends in "ফ্রি ডেলিভারি" — appending a
              bold "FREE DELIVERY" here said it twice */}
          <span lang="bn" className="font-semibold text-white">
            {deliveryLine}
          </span>
          <span className="opacity-35" aria-hidden>
            ·
          </span>
          <span>Cash on Delivery</span>
          <span className="hidden opacity-35 sm:inline" aria-hidden>
            ·
          </span>
          <span className="hidden sm:inline">
            100% Authentic Korean Products
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="container-page grid grid-cols-[auto_1fr] items-center gap-4 py-4 lg:grid-cols-[220px_1fr_auto] lg:gap-8">
          {/* drawer and logo share the first grid cell, so adding the mobile
              menu does not disturb the desktop three-column layout */}
          <div className="flex items-center gap-1">
            <MobileNavDrawer />

            <Link href="/" className="block">
              <Image
                src="https://ik.imagekit.io/koreanhive/logo.webp"
                alt="Korean Hive — authentic Korean skincare in Bangladesh"
                width={220}
                height={42}
                priority
                className="h-9 w-auto lg:h-[42px]"
              />
            </Link>
          </div>

          {/* Suspense is load-bearing: the box reads useSearchParams, and the
              header is on every page — unbounded, it would opt the whole site
              out of static rendering. The form lives inside the component
              because the suggestions dropdown is positioned against it. */}
          <Suspense fallback={<HeaderSearchInputFallback />}>
            <HeaderSearchInput />
          </Suspense>

          <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground lg:gap-5">
            <Link href="/track" className="hidden hover:text-primary sm:block">
              Track Order
            </Link>
            <Link
              href="/wishlist"
              className="hidden hover:text-primary sm:block"
            >
              Wishlist
            </Link>
            <Link
              href="/cart"
              className="relative flex items-center gap-2 bg-primary px-4 py-3 text-xs font-semibold tracking-[0.04em] text-primary-foreground hover:bg-mulberry-hover"
            >
              CART
              <CartBadge />
            </Link>
          </div>
        </div>

        <nav className="hidden border-t border-hairline lg:block">
          <div className="container-page flex h-[46px] items-center gap-6 text-[13px] font-medium">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <span className="flex-1" />
            <Link
              href="/combos"
              className="border border-chip-border px-3 py-1.5 text-xs font-bold text-primary"
            >
              Combo Offers
            </Link>
            <Link
              href="/deals"
              className="border border-sale-border bg-sale-bg px-3 py-1.5 text-xs font-bold text-sale"
            >
              Hot Deals
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}
