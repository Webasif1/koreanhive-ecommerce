import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Images,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  TicketPercent,
} from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/admin/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Korean Hive Admin" },
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/banners", label: "Banners", icon: Images },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Middleware already redirects, but a layout guard is the authoritative
  // check — it runs even if the matcher is ever misconfigured.
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
              K
            </span>
            <span className="font-display font-semibold">Admin</span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              View shop
            </Link>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut />
                Sign out
              </Button>
            </form>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
            >
              <item.icon className="size-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
