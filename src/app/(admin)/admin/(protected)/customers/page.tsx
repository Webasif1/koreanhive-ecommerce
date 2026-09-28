import Link from "next/link";
import { Eye, Pencil, RefreshCw, Repeat, Search, Sparkles, Trash2, Users } from "lucide-react";

import {
  PageHeader,
  Panel,
  adminButton,
  chipClass,
} from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { SubmitButton } from "@/components/admin/submit-button";
import { formatBDT, formatDateTime } from "@/lib/format";
import {
  deleteCustomerAction,
  syncCustomersAction,
} from "@/server/actions/admin/customers";
import {
  CUSTOMER_FILTERS,
  type CustomerFilter,
  getAdminCustomers,
  getCustomerSummary,
} from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Customers" };

const FILTER_LABEL: Record<CustomerFilter, string> = {
  ALL: "All",
  REPEAT: "Repeat buyers",
  NEW: "New (30 days)",
};

function customersHref(params: { filter?: CustomerFilter; q?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.filter && params.filter !== "ALL") search.set("filter", params.filter);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/admin/customers?${query}` : "/admin/customers";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const filter = (CUSTOMER_FILTERS as readonly string[]).includes(params.filter ?? "")
    ? (params.filter as CustomerFilter)
    : "ALL";
  const current = Math.max(1, Number(params.page) || 1);

  const [{ customers, total, totalPages }, summary] = await Promise.all([
    getAdminCustomers({ q: query, filter, page: current }),
    getCustomerSummary(),
  ]);

  const stats = [
    { label: "Customers", value: summary.total, icon: Users },
    { label: "New in 30 days", value: summary.newThisMonth, icon: Sparkles },
    { label: "Repeat buyers", value: summary.repeat, icon: Repeat },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Everyone who has ordered, saved automatically from each new order."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Panel key={stat.label} glass className="flex items-center gap-4 p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush text-primary">
              <stat.icon className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {stat.value.toLocaleString("en-US")}
              </p>
            </div>
          </Panel>
        ))}
      </div>

      {summary.unsynced > 0 && (
        <Panel glass className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm">
            <span className="font-semibold">
              {summary.unsynced.toLocaleString("en-US")}{" "}
              {summary.unsynced === 1 ? "customer" : "customers"}
            </span>{" "}
            from orders placed before this list existed{" "}
            {summary.unsynced === 1 ? "is" : "are"} not on it yet.
          </p>
          <form action={syncCustomersAction}>
            <SubmitButton className={adminButton("primary", "sm")} pendingLabel="Adding…">
              <RefreshCw />
              Add from past orders
            </SubmitButton>
          </form>
        </Panel>
      )}

      <Panel>
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {CUSTOMER_FILTERS.map((value) => (
              <Link
                key={value}
                href={customersHref({ filter: value, q: query })}
                className={chipClass(filter === value)}
              >
                {FILTER_LABEL[value]}
              </Link>
            ))}
          </div>

          <form action="/admin/customers" className="relative">
            {filter !== "ALL" && <input type="hidden" name="filter" value={filter} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Name, phone or email"
              className="h-9 w-full rounded-[10px] border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary md:w-64"
            />
          </form>
        </div>

        {customers.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted-foreground">
            {query
              ? `No customers match “${query}”.`
              : summary.total === 0
                ? "No customers yet. New orders add them here automatically."
                : "No customers in this view."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Phone</th>
                  <th className="px-3 py-3 font-medium">Location</th>
                  <th className="px-3 py-3 text-right font-medium">Orders</th>
                  <th className="px-3 py-3 text-right font-medium">Spent</th>
                  <th className="px-3 py-3 font-medium">Last order</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-blush/30">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="flex items-center gap-3"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush font-display text-sm font-semibold text-primary">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium hover:text-primary">
                            {customer.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {customer.email ?? "No email"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 tabular-nums">{customer.phone}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {[customer.area, customer.district].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {customer.orderCount >= 2 ? (
                        <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs font-semibold text-success">
                          {customer.orderCount}
                        </span>
                      ) : (
                        customer.orderCount
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums">
                      {formatBDT(customer.totalSpent)}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {formatDateTime(customer.lastOrderAt.toISOString())}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className={adminButton("outline", "sm")}
                        >
                          <Eye />
                          View
                        </Link>
                        <Link
                          href={`/admin/customers/${customer.id}/edit`}
                          className={adminButton("outline", "sm")}
                          title="Edit customer"
                        >
                          <Pencil />
                          <span className="sr-only">Edit</span>
                        </Link>
                        <ConfirmAction
                          action={deleteCustomerAction}
                          fields={{ id: customer.id }}
                          trigger={
                            <>
                              <Trash2 />
                              <span className="sr-only">Delete</span>
                            </>
                          }
                          triggerClassName={adminButton("dangerSoft", "sm")}
                          title={`Remove ${customer.name}?`}
                          description="Only the customer record is removed — their orders stay. If they order again, they are added back automatically."
                          confirmLabel="Remove customer"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {totalPages > 1 && (
        <nav aria-label="Customer pages" className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {current} of {totalPages} · {total} customers
          </span>
          <span className="flex gap-2">
            {current > 1 && (
              <Link
                href={customersHref({ filter, q: query, page: current - 1 })}
                className={adminButton("outline", "sm")}
              >
                Previous
              </Link>
            )}
            {current < totalPages && (
              <Link
                href={customersHref({ filter, q: query, page: current + 1 })}
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
