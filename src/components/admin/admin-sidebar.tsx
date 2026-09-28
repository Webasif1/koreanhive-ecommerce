"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FileUp,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  ReceiptText,
  ShoppingBag,
  Star,
  TicketPercent,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/admin/session";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** only an exact match is active (the dashboard would match everything) */
  exact?: boolean;
};

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-blush text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="size-[18px] shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span className="grid min-w-5 place-items-center rounded-full bg-sale px-1.5 py-0.5 text-[10px] font-bold text-white">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarBody({
  pendingCount,
  onNavigate,
}: {
  pendingCount: number;
  onNavigate?: () => void;
}) {
  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: "Main menu",
      items: [
        { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/admin/orders", label: "Orders", icon: ReceiptText, badge: pendingCount },
        { href: "/admin/products", label: "Products", icon: Package },
        { href: "/admin/reviews", label: "Reviews", icon: Star },
      ],
    },
    {
      title: "Marketing",
      items: [
        { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
        { href: "/admin/banners", label: "Banners", icon: Images },
      ],
    },
    {
      title: "Quick add",
      items: [
        { href: "/admin/orders/new", label: "New order", icon: ShoppingBag, exact: true },
        { href: "/admin/products/new", label: "New product", icon: PackagePlus, exact: true },
        { href: "/admin/products/import", label: "Import products", icon: FileUp, exact: true },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-base font-bold text-primary-foreground">
          K
        </span>
        <span className="leading-tight">
          <span className="block font-display font-semibold">Korean Hive</span>
          <span className="block text-[11px] text-muted-foreground">Admin</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-light">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-[18px]" />
          View shop
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sale-bg hover:text-sale"
          >
            <LogOut className="size-[18px]" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminSidebar({ pendingCount }: { pendingCount: number }) {
  // every link in the drawer closes it via onNavigate
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
        <SidebarBody pendingCount={pendingCount} />
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-xl border bg-card lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-card shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 grid size-9 place-items-center rounded-xl hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <SidebarBody pendingCount={pendingCount} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
