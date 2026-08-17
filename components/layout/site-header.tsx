import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { CartBadge } from "@/components/cart/cart-badge";
import {
  HeaderSearchInput,
  HeaderSearchInputFallback,
} from "@/components/layout/header-search";
import { mainNav } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <>
      {/* Bangla carries the offer, English the rest — never mixed in one sentence */}
      <div className="bg-ink text-[12.5px] text-blush">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-7 gap-y-1 py-2.5 text-center">
          <span lang="bn">
            ৳2500+ অর্ডারে সারা বাংলাদেশে{" "}
            <strong className="text-white">FREE DELIVERY</strong>
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
          <Link href="/" className="block">
            <Image
              src="/brand/logo.webp"
              alt="Korean Hive — authentic Korean skincare in Bangladesh"
              width={220}
              height={42}
              priority
              className="h-9 w-auto lg:h-[42px]"
            />
          </Link>

          {/* Suspense is load-bearing: the box reads useSearchParams, and the
              header is on every page — unbounded, it would opt the whole site
              out of static rendering. The form lives inside the component
              because the suggestions dropdown is positioned against it. */}
          <Suspense fallback={<HeaderSearchInputFallback />}>
            <HeaderSearchInput />
          </Suspense>

          <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground lg:gap-5">
            <Link href="/account" className="hidden hover:text-primary sm:block">
              Account
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
