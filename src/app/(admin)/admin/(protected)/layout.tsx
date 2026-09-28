import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";

import { auth } from "@/auth";
import { adminButton } from "@/components/admin/admin-ui";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getPendingCount } from "@/server/queries/admin";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Korean Hive Admin" },
  robots: { index: false, follow: false },
};

/** The shop runs on Dhaka time, whatever the server's clock says. */
function greeting(now: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Dhaka",
    }).format(now),
  );

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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

  const pendingCount = await getPendingCount();
  const now = new Date();
  const who = session.user.name || session.user.email?.split("@")[0] || "there";
  const initial = who.charAt(0).toUpperCase();
  const today = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(now);

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <AdminSidebar pendingCount={pendingCount} />

            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-semibold sm:text-lg">
                {greeting(now)}, {who}!
              </p>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                Here&apos;s what&apos;s happening with your store today
              </p>
            </div>

            <span className="hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium md:inline-flex">
              <CalendarDays className="size-4 text-muted-foreground" />
              {today}
            </span>

            <Link href="/admin/orders/new" className={adminButton("primary", "md", "hidden sm:inline-flex")}>
              <Plus />
              New order
            </Link>

            <span
              className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-semibold text-white"
              title={session.user.email ?? undefined}
            >
              {initial}
            </span>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
