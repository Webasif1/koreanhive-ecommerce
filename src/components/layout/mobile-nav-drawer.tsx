"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

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
 * Still a `<details>`, so it opens before hydration and is exposed to
 * assistive tech as a disclosure without ARIA of our own. The client half
 * only closes it: the header lives in a persistent layout, so without this the
 * sheet stayed open over the page after a link was tapped. It also closes on
 * the backdrop, the close button and Escape.
 *
 * It opens as a left sheet over the page rather than a dropdown under the
 * header. The slide-in is one CSS keyframe (globals.css, `.kh-nav-sheet`), and
 * the page behind stops scrolling through `html:has(.kh-nav[open])` — no JS
 * scroll lock and no animation library.
 */
export function MobileNavDrawer() {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  // a link to another page: close once the route has changed
  useEffect(() => close(), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        ref.current?.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <details
      ref={ref}
      className="kh-nav group relative lg:hidden"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        className="flex size-11 cursor-pointer list-none items-center justify-center text-foreground [&::-webkit-details-marker]:hidden"
        aria-label="Browse categories"
      >
        <Menu className="size-5" />
      </summary>

      {/* backdrop — a tap anywhere outside the sheet closes it */}
      <div
        className="kh-nav-backdrop fixed inset-0 z-[65] bg-ink/40"
        aria-hidden
        onClick={close}
      />

      <nav
        aria-label="Categories"
        className="kh-nav-sheet fixed inset-y-0 left-0 z-[70] flex w-[min(20rem,85vw)] flex-col overflow-y-auto overscroll-contain bg-white pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-between border-b border-hairline py-1 pl-4 pr-1">
          <span className="eyebrow">Browse</span>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* every link also closes on click: tapping the page you are already
            on does not change the pathname, so the effect above never fires */}
        <ul className="p-2 text-[15px]" onClick={close}>
          {/* Hot Deals is in mainNav too; here it gets its own styled row below */}
          {mainNav
            .filter((item) => item.href !== "/deals")
            .map((item) => (
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
          <li className="mt-1 border-t border-hairline pt-1">
            <Link
              href="/track"
              className="block px-3 py-3 text-muted-foreground hover:bg-blush"
            >
              Track Order
            </Link>
          </li>
          <li>
            <Link
              href="/wishlist"
              className="block px-3 py-3 text-muted-foreground hover:bg-blush"
            >
              Wishlist
            </Link>
          </li>
        </ul>
      </nav>
    </details>
  );
}
