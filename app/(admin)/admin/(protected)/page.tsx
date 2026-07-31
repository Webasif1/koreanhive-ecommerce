import Link from "next/link";
import { AlertTriangle, Package, ReceiptText, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatBDT, formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { getDashboardStats } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      label: "Revenue (30 days)",
      value: formatBDT(stats.revenue30d),
      icon: Wallet,
      hint: "Excludes cancelled and returned",
    },
    {
      label: "Orders",
      value: stats.orderCount.toLocaleString("en-US"),
      icon: ReceiptText,
      hint: `${stats.pendingCount} awaiting confirmation`,
    },
    {
      label: "Active products",
      value: stats.productCount.toLocaleString("en-US"),
      icon: Package,
      hint: "Visible in the shop",
    },
    {
      label: "Low stock",
      value: stats.lowStock.toLocaleString("en-US"),
      icon: AlertTriangle,
      hint: "5 or fewer left",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Dashboard
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-5">
            <card.icon className="size-5 text-primary" />
            <p className="mt-3 font-display text-2xl font-semibold">
              {card.value}
            </p>
            <p className="text-sm font-medium">{card.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-display font-semibold">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {stats.recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <ul className="divide-y">
            {stats.recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.orderNumber}`}
                  className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-accent/50"
                >
                  <span className="font-medium">{order.orderNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {order.customerName}
                  </span>
                  <Badge variant="muted">
                    {ORDER_STATUS_LABEL[order.status]}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDateTime(order.placedAt.toISOString())}
                  </span>
                  <span className="w-24 text-right text-sm tabular-nums">
                    {formatBDT(order.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
