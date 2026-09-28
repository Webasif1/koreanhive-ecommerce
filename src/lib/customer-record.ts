import { normalizeBdPhone } from "@/lib/bd-districts";

export type OrderContact = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  addressLine?: string | null;
  area?: string | null;
  district?: string | null;
  postalCode?: string | null;
  placedAt: Date;
  source?: "CHECKOUT" | "ADMIN" | null;
};

/**
 * The Mongo upsert that files an order's contact details under its customer.
 *
 * "latest" is for a new order: the details it carries are the freshest, so
 * they replace what was on file. "backfill" is for syncing old orders: it
 * only fills in a customer that does not exist yet, so re-running the sync
 * never overwrites details staff have since corrected.
 *
 * Either way the first/last order dates only ever widen, and an email or
 * postcode left blank on one order does not erase one given on another.
 */
export function customerUpsert(order: OrderContact, mode: "latest" | "backfill") {
  const phone = normalizeBdPhone(order.customerPhone);

  const details: Record<string, string> = {
    name: order.customerName.trim(),
  };
  for (const key of ["addressLine", "area", "district"] as const) {
    const value = order[key]?.trim();
    if (value) details[key] = value;
  }
  const email = order.customerEmail?.trim().toLowerCase();
  if (email) details.email = email;
  const postalCode = order.postalCode?.trim();
  if (postalCode) details.postalCode = postalCode;

  const source = order.source ?? "CHECKOUT";

  return {
    filter: { phone },
    update:
      mode === "latest"
        ? {
            $set: details,
            $min: { firstOrderAt: order.placedAt },
            $max: { lastOrderAt: order.placedAt },
            $setOnInsert: { source },
          }
        : {
            $setOnInsert: { ...details, source },
            $min: { firstOrderAt: order.placedAt },
            $max: { lastOrderAt: order.placedAt },
          },
  };
}
