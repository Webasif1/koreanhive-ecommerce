import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, MessageCircle, Pencil, Phone, ShoppingBag, Trash2 } from "lucide-react";

import {
  PageHeader,
  Panel,
  PaymentBadge,
  StatusBadge,
  adminButton,
} from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { formatBDT, formatDateTime } from "@/lib/format";
import { deleteCustomerAction } from "@/server/actions/admin/customers";
import { getAdminCustomer } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Customer" };

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getAdminCustomer(id);
  if (!customer) notFound();

  const address = [
    customer.addressLine,
    [customer.area, customer.district].filter(Boolean).join(", "),
    customer.postalCode,
  ].filter(Boolean);

  const stats = [
    { label: "Orders", value: customer.orderCount.toLocaleString("en-US") },
    { label: "Total spent", value: formatBDT(customer.totalSpent) },
    { label: "Average order", value: formatBDT(customer.averageOrder) },
    { label: "Delivered", value: customer.delivered.toLocaleString("en-US") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        back={
          <Link
            href="/admin/customers"
            className="mb-1 inline-block text-sm text-muted-foreground hover:text-primary"
          >
            ← Customers
          </Link>
        }
        title={customer.name}
        description={`Customer since ${formatDateTime(customer.firstOrderAt.toISOString())}`}
        actions={
          <>
            <Link
              href={`/admin/orders/new?customer=${customer.id}`}
              className={adminButton("primary")}
            >
              <ShoppingBag />
              New order
            </Link>
            <Link href={`/admin/customers/${customer.id}/edit`} className={adminButton("outline")}>
              <Pencil />
              Edit
            </Link>
            <ConfirmAction
              action={deleteCustomerAction}
              fields={{ id: customer.id, redirect: "list" }}
              trigger={
                <>
                  <Trash2 />
                  Remove
                </>
              }
              triggerClassName={adminButton("dangerSoft")}
              title={`Remove ${customer.name}?`}
              description="Only the customer record is removed — their orders stay. If they order again, they are added back automatically."
              confirmLabel="Remove customer"
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Panel glass className="space-y-5 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-full bg-primary font-display text-xl font-semibold text-primary-foreground">
              {customer.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold">{customer.name}</p>
              <p className="text-xs text-muted-foreground">
                {customer.orderCount >= 2 ? "Repeat buyer" : "One order"}
                {customer.source === "ADMIN" ? " · first order by staff" : ""}
              </p>
            </div>
          </div>

          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <a href={`tel:${customer.phone}`} className="hover:text-primary">
                {customer.phone}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              {customer.email ? (
                <a href={`mailto:${customer.email}`} className="break-all hover:text-primary">
                  {customer.email}
                </a>
              ) : (
                <span className="text-muted-foreground">No email</span>
              )}
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className={address.length ? "" : "text-muted-foreground"}>
                {address.length ? address.join(" · ") : "No address"}
              </span>
            </li>
          </ul>

          <div className="flex gap-2">
            <a href={`tel:${customer.phone}`} className={adminButton("outline", "sm", "flex-1")}>
              <Phone />
              Call
            </a>
            <a
              href={`https://wa.me/88${customer.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className={adminButton("success", "sm", "flex-1")}
            >
              <MessageCircle />
              WhatsApp
            </a>
          </div>

          <div className="rounded-xl border border-dashed bg-card/60 p-3">
            <p className="text-xs font-semibold text-muted-foreground">Staff note</p>
            <p className="mt-1 whitespace-pre-line text-sm">
              {customer.note ?? (
                <span className="text-muted-foreground">
                  None yet — add one from Edit.
                </span>
              )}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-xs">
            <div>
              <dt className="text-muted-foreground">First order</dt>
              <dd className="mt-0.5 font-medium">
                {formatDateTime(customer.firstOrderAt.toISOString())}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last order</dt>
              <dd className="mt-0.5 font-medium">
                {formatDateTime(customer.lastOrderAt.toISOString())}
              </dd>
            </div>
          </dl>
        </Panel>

        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {stats.map((stat) => (
              <Panel key={stat.label} glass className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-display text-xl font-semibold tabular-nums">
                  {stat.value}
                </p>
              </Panel>
            ))}
          </div>

          <Panel>
            <div className="px-5 pt-5">
              <h2 className="font-display text-lg font-semibold">Order history</h2>
              <p className="text-xs text-muted-foreground">
                Spend excludes cancelled and returned orders.
              </p>
            </div>

            {customer.orders.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                No orders on file — they may have been deleted.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr className="border-y">
                      <th className="px-5 py-3 font-medium">Order</th>
                      <th className="px-3 py-3 font-medium">Placed</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Payment</th>
                      <th className="px-5 py-3 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-blush/30">
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/orders/${order.orderNumber}`}
                            className="font-medium hover:text-primary"
                          >
                            {order.orderNumber}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                            {order.source === "ADMIN" && " · by staff"}
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
        </div>
      </div>
    </div>
  );
}
