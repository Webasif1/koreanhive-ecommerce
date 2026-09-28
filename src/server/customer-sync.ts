/**
 * Keeps the Customers list filled from orders.
 *
 * No "server-only" guard: scripts/sync-customers.ts runs this from plain Node.
 * Nothing here reads cookies or the session — callers do their own auth.
 */

import { customerUpsert, type OrderContact } from "@/lib/customer-record";
import { Customer, Order } from "@/server/models";

/** Files one order's customer. Never throws: a failed customer save must not
 *  fail the order that triggered it. */
export async function upsertCustomerFromOrder(orderNumber: string) {
  try {
    const order = await Order.findOne({ orderNumber })
      .select(
        "customerName customerPhone customerEmail addressLine area district postalCode placedAt source",
      )
      .lean();
    if (!order) return;

    const { filter, update } = customerUpsert(order as OrderContact, "latest");
    await Customer.updateOne(filter, update, { upsert: true });
  } catch (error) {
    console.error("[customers] could not save the customer for", orderNumber, error);
  }
}

/**
 * Creates a customer for everyone in the order history who is not on file
 * yet, and widens the first/last order dates of those who are. Idempotent,
 * and it never overwrites details staff have edited.
 */
export async function syncCustomersFromOrders() {
  const rows = await Order.aggregate<OrderContact & { _id: string; firstAt: Date }>([
    { $sort: { placedAt: 1 } },
    {
      $group: {
        _id: "$customerPhone",
        customerPhone: { $last: "$customerPhone" },
        customerName: { $last: "$customerName" },
        customerEmail: { $last: "$customerEmail" },
        addressLine: { $last: "$addressLine" },
        area: { $last: "$area" },
        district: { $last: "$district" },
        postalCode: { $last: "$postalCode" },
        source: { $first: "$source" },
        firstAt: { $min: "$placedAt" },
        placedAt: { $max: "$placedAt" },
      },
    },
  ]);

  if (rows.length === 0) return { customers: 0 };

  const operations = rows.flatMap((row) => {
    if (!row.customerPhone || !row.customerName) return [];
    // two passes of dates: $min takes the first order, $max the last
    const first = customerUpsert({ ...row, placedAt: row.firstAt }, "backfill");
    const last = customerUpsert(row, "backfill");
    return [
      {
        updateOne: {
          filter: first.filter,
          update: {
            ...last.update,
            $min: first.update.$min,
            $max: last.update.$max,
          },
          upsert: true,
        },
      },
    ];
  });

  const result = await Customer.bulkWrite(operations, { ordered: false });
  return { customers: operations.length, created: result.upsertedCount };
}
