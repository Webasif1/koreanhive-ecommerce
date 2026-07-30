import Link from "next/link";
import { Heart, Search, ShoppingBag } from "lucide-react";

import { CartBadge } from "@/components/cart/cart-badge";

import { Button } from "@/components/ui/button";
import { mainNav } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="bg-ink text-center text-xs text-white">
        <p className="container-page py-2">
          Cash on Delivery all over Bangladesh · Free delivery over ৳2000
        </p>
      </div>

      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
            K
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Korean Hive
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button variant="ghost" size="icon" aria-label="Search products" asChild>
            <Link href="/search">
              <Search />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Wishlist"
            className="hidden sm:inline-flex"
            asChild
          >
            <Link href="/wishlist">
              <Heart />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Cart" asChild>
            <Link href="/cart" className="relative">
              <ShoppingBag />
              <CartBadge />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
