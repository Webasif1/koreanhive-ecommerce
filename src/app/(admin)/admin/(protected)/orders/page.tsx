import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatBDT, formatDateTime } from "@/lib/format";
import { ORDER_FLOW, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { getAdminOrders } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders" };

const FILTERS = ["ALL", ...ORDER_FLOW, "CANCELLED", "RETURNED"] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status ?? "ALL";
  const orders = await getAdminOrders(active);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Orders
      </h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter}
            href={filter === "ALL" ? "/admin/orders" : `/admin/orders?status=${filter}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active === filter
                ? "border-primary bg-primary/5 text-primary"
                : "border-input text-muted-foreground hover:border-primary/50",
            )}
          >
            {filter === "ALL"
              ? "All"
              : ORDER_STATUS_LABEL[filter as "PENDING"]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-xl border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          No orders with this status.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Placed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.orderNumber}`}
                      className="font-medium hover:text-primary"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {order._count.items}{" "}
                      {order._count.items === 1 ? "item" : "items"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {order.customerName}
                    <p className="text-xs text-muted-foreground">
                      {order.customerPhone} · {order.district}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDateTime(order.placedAt.toISOString())}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="muted">
                      {ORDER_STATUS_LABEL[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        order.paymentStatus === "PAID" ? "success" : "muted"
                      }
                    >
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatBDT(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
