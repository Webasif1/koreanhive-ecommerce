import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  ClipboardCheck,
  Package,
  ReceiptText,
  Search,
  type LucideIcon,
} from "lucide-react";

import { Panel, StatusBadge, adminButton, chipClass } from "@/components/admin/admin-ui";
import { SalesChart } from "@/components/admin/sales-chart";
import { TopProductsCarousel } from "@/components/admin/top-products-carousel";
import { formatBDT, formatDateTime } from "@/lib/format";
import {
  SALES_RANGES,
  SALES_RANGE_LABEL,
  parseSalesRange,
} from "@/lib/sales-range";
import { cn } from "@/lib/utils";
import { getDashboardStats } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

function Trend({
  change,
  /** for counts where going up is bad, e.g. cancellations */
  inverse = false,
}: {
  change: number | null;
  inverse?: boolean;
}) {
  if (change === null) {
    return <span className="text-xs font-medium text-muted-foreground">New</span>;
  }

  const up = change >= 0;
  const good = inverse ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
        change === 0
          ? "bg-hairline text-muted-foreground"
          : good
            ? "bg-success-bg text-success"
            : "bg-sale-bg text-sale",
      )}
    >
      <Icon className="size-3" />
      {up ? "+" : ""}
      {change}%
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: ReactNode;
  hint?: string;
}) {
  return (
    <Panel className="flex items-center gap-4 p-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="font-display text-2xl font-semibold tabular-nums">{value}</span>
          {trend}
        </div>
        {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Panel>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = parseSalesRange((await searchParams).range);
  const stats = await getDashboardStats(range);
  const period = SALES_RANGE_LABEL[range].toLowerCase();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Orders"
          value={stats.orders.value.toLocaleString("en-US")}
          icon={ReceiptText}
          trend={<Trend change={stats.orders.change} />}
          hint={`${stats.pending} awaiting confirmation`}
        />
        <StatCard
          label="Delivered orders"
          value={stats.delivered.value.toLocaleString("en-US")}
          icon={ClipboardCheck}
          trend={<Trend change={stats.delivered.change} />}
          hint={`Placed in the last ${period}`}
        />
        <StatCard
          label="Cancelled orders"
          value={stats.cancelled.value.toLocaleString("en-US")}
          icon={Ban}
          trend={<Trend change={stats.cancelled.change} inverse />}
          hint={`Placed in the last ${period}`}
        />
        <StatCard
          label="Active products"
          value={stats.productCount.toLocaleString("en-US")}
          icon={Package}
          hint={
            stats.lowStock > 0
              ? `${stats.lowStock} low on stock (5 or fewer)`
              : "Stock levels look healthy"
          }
        />
      </div>

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Your sales report</h2>
            <p className="text-xs text-muted-foreground">
              Revenue from orders placed in the last {period}, excluding cancelled
              and returned
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-primary" /> Revenue
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-admin-warn" /> Orders
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[260px_1fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <div>
              <p className="font-display text-4xl font-semibold tracking-tight tabular-nums">
                {formatBDT(stats.revenue.value)}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <Trend change={stats.revenue.change} />
                <span className="text-muted-foreground">
                  {stats.revenue.difference >= 0 ? "+" : "−"}
                  {formatBDT(Math.abs(stats.revenue.difference))} vs previous {period}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SALES_RANGES.map((option) => (
                <Link
                  key={option}
                  href={option === "30d" ? "/admin" : `/admin?range=${option}`}
                  scroll={false}
                  className={chipClass(option === range)}
                >
                  {option}
                </Link>
              ))}
            </div>
          </div>

          <SalesChart data={stats.chart} />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Panel className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
            <h2 className="font-display text-lg font-semibold">Last transactions</h2>
            <div className="flex items-center gap-2">
              <form action="/admin/orders" className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="q"
                  type="search"
                  placeholder="Search orders"
                  className="h-9 w-48 rounded-[10px] border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </form>
              <Link href="/admin/orders" className={adminButton("outline", "sm")}>
                View all
              </Link>
            </div>
          </div>

          {stats.recent.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              No orders yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-y bg-muted/40">
                    <th className="px-5 py-3 font-medium">Order ID</th>
                    <th className="px-3 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.recent.map((order) => (
                    <tr key={order.id} className="hover:bg-blush/40">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="font-medium hover:text-primary"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {order.customerName}
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {formatDateTime(order.placedAt.toISOString())}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums">
                        {formatBDT(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <section className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-chip-border bg-gradient-to-br from-blush to-card">
          <div className="px-5 pt-5">
            <h2 className="font-display text-lg font-semibold">Best sellers 🎉</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your most-bought products in the last {period}
            </p>
          </div>
          <TopProductsCarousel products={stats.topProducts} />
        </section>
      </div>
    </div>
  );
}
