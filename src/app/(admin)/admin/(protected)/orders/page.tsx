import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";

import {
  PageHeader,
  Panel,
  PaymentBadge,
  StatusBadge,
  adminButton,
  chipClass,
} from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { OrderActions } from "@/components/admin/order-actions";
import { emptyTrashAction } from "@/server/actions/admin/orders";
import { ORDER_STATUS_STYLE } from "@/lib/admin-order-style";
import { formatBDT, formatDateTime } from "@/lib/format";
import { ORDER_FLOW, ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import { getAdminOrders } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Orders" };

const STATUSES: OrderStatusValue[] = [...ORDER_FLOW, "CANCELLED", "RETURNED"];

function ordersHref(params: { status?: string; q?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.status && params.status !== "ALL") search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const { status, page, q } = await searchParams;
  const active = status ?? "ALL";
  const query = (q ?? "").trim();
  const current = Math.max(1, Number(page) || 1);
  const trash = active === "TRASH";
  const { orders, total, totalPages } = await getAdminOrders({
    status: active,
    page: current,
    q: query,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description={
          trash
            ? "Orders moved to the trash. Restore one to bring it back."
            : "Confirm, pack, ship and track every order."
        }
        actions={
          <>
            {trash && total > 0 && (
              <ConfirmAction
                action={emptyTrashAction}
                fields={{}}
                trigger={
                  <>
                    <Trash2 />
                    Empty trash
                  </>
                }
                triggerClassName={adminButton("danger")}
                title={`Delete all ${total} trashed ${total === 1 ? "order" : "orders"} forever?`}
                description="Every order in the trash is removed from the database and cannot be recovered. Customer records stay in Customers."
                confirmLabel="Empty trash"
              />
            )}
            <Link href="/admin/orders/new" className={adminButton("primary")}>
              <Plus />
              New order
            </Link>
          </>
        }
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            <Link href={ordersHref({ q: query })} className={chipClass(active === "ALL")}>
              All
            </Link>
            {STATUSES.map((value) => (
              <Link
                key={value}
                href={ordersHref({ status: value, q: query })}
                className={chipClass(active === value)}
              >
                <span
                  className={cn("size-1.5 rounded-full", ORDER_STATUS_STYLE[value].dot)}
                  aria-hidden
                />
                {ORDER_STATUS_LABEL[value]}
              </Link>
            ))}
            <Link
              href={ordersHref({ status: "TRASH", q: query })}
              className={chipClass(trash)}
            >
              <Trash2 className="size-3" />
              Trash
            </Link>
          </div>

          <form action="/admin/orders" className="relative">
            {active !== "ALL" && <input type="hidden" name="status" value={active} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Order no, name or phone"
              className="h-9 w-full rounded-[10px] border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary lg:w-64"
            />
          </form>
        </div>

        {orders.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted-foreground">
            {query
              ? `No orders match “${query}”.`
              : trash
                ? "The trash is empty."
                : "No orders with this status."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-3 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Placed</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Payment</th>
                  <th className="px-3 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-blush/30">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="font-medium hover:text-primary"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {order._count.items} {order._count.items === 1 ? "item" : "items"}
                        {order.source === "ADMIN" && " · by staff"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {order.customerName}
                      <p className="text-xs text-muted-foreground">
                        {order.customerPhone} · {order.district}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {formatDateTime(order.placedAt.toISOString())}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-3">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {formatBDT(order.total)}
                    </td>
                    <td className="px-5 py-3">
                      <OrderActions
                        orderNumber={order.orderNumber}
                        status={order.status}
                        deleted={Boolean(order.deletedAt)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {totalPages > 1 && (
        <nav
          aria-label="Order pages"
          className="flex items-center justify-between text-sm"
        >
          <span className="text-muted-foreground">
            Page {current} of {totalPages} · {total} orders
          </span>
          <span className="flex gap-2">
            {current > 1 && (
              <Link
                href={ordersHref({ status: active, q: query, page: current - 1 })}
                className={adminButton("outline", "sm")}
              >
                Previous
              </Link>
            )}
            {current < totalPages && (
              <Link
                href={ordersHref({ status: active, q: query, page: current + 1 })}
                className={adminButton("outline", "sm")}
              >
                Next
              </Link>
            )}
          </span>
        </nav>
      )}
    </div>
  );
}
