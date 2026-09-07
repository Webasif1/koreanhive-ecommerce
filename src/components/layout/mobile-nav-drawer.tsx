import Link from "next/link";
import { Menu } from "lucide-react";

import { mainNav } from "@/lib/navigation";

/**
 * Category navigation below `lg`.
 *
 * The header's nav row is `lg:block`, and there was no hamburger anywhere in
 * the markup — so on every phone and tablet the whole of Skincare, Makeup,
 * Skin Concerns, Korean Brands, New Arrivals, Journal, Combo Offers and Hot
 * Deals was unreachable from the chrome. The five-item bottom bar does not
 * cover it, and the footer is a long scroll away. On a build described as
 * mobile-first for a mobile-majority market, that is the navigation missing
 * for most of the audience.
 *
 * `<details>` rather than React state, matching the filter sidebar: it opens
 * without JavaScript, closes on Escape, and is exposed to assistive tech as a
 * disclosure without any ARIA of our own.
 */
export function MobileNavDrawer() {
  return (
    <details className="group relative lg:hidden">
      <summary
        className="flex size-11 cursor-pointer list-none items-center justify-center text-foreground"
        aria-label="Browse categories"
      >
        <Menu className="size-5" />
      </summary>

      <div className="absolute left-0 top-full z-50 mt-2 w-60 border border-border bg-white p-2 shadow-lg">
        <ul className="text-sm">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block px-3 py-3 font-medium text-foreground hover:bg-blush hover:text-primary"
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="mt-1 border-t border-hairline pt-1">
            <Link
              href="/combos"
              className="block px-3 py-3 font-semibold text-primary hover:bg-blush"
            >
              Combo Offers
            </Link>
          </li>
          <li>
            <Link
              href="/deals"
              className="block px-3 py-3 font-semibold text-sale hover:bg-sale-bg"
            >
              Hot Deals
            </Link>
          </li>
          <li className="mt-1 border-t border-hairline pt-1 sm:hidden">
            <Link
              href="/track"
              className="block px-3 py-3 text-muted-foreground hover:bg-blush"
            >
              Track Order
            </Link>
          </li>
          <li className="sm:hidden">
            <Link
              href="/wishlist"
              className="block px-3 py-3 text-muted-foreground hover:bg-blush"
            >
              Wishlist
            </Link>
          </li>
        </ul>
      </div>
    </details>
  );
}
