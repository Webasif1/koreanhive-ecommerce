import type { OrderStatusValue } from "@/lib/order-status";

export type PaymentStatusValue = "UNPAID" | "PAID" | "REFUNDED" | "FAILED";

/** One colour per status, so a glance down the order list reads the queue. */
export const ORDER_STATUS_STYLE: Record<
  OrderStatusValue,
  { badge: string; dot: string }
> = {
  PENDING: { badge: "bg-admin-warn-bg text-admin-warn", dot: "bg-admin-warn" },
  CONFIRMED: { badge: "bg-admin-info-bg text-admin-info", dot: "bg-admin-info" },
  PROCESSING: {
    badge: "bg-admin-violet-bg text-admin-violet",
    dot: "bg-admin-violet",
  },
  SHIPPED: { badge: "bg-admin-teal-bg text-admin-teal", dot: "bg-admin-teal" },
  DELIVERED: { badge: "bg-success-bg text-success", dot: "bg-success" },
  CANCELLED: { badge: "bg-sale-bg text-sale", dot: "bg-sale" },
  RETURNED: { badge: "bg-hairline text-muted-foreground", dot: "bg-light" },
};

export const PAYMENT_STATUS_STYLE: Record<
  PaymentStatusValue,
  { badge: string; dot: string }
> = {
  PAID: { badge: "bg-success-bg text-success", dot: "bg-success" },
  UNPAID: { badge: "bg-admin-warn-bg text-admin-warn", dot: "bg-admin-warn" },
  REFUNDED: { badge: "bg-hairline text-muted-foreground", dot: "bg-light" },
  FAILED: { badge: "bg-sale-bg text-sale", dot: "bg-sale" },
};

export type OrderActionTone =
  | "confirm"
  | "pack"
  | "ship"
  | "deliver"
  | "cancel"
  | "return";

export type OrderQuickAction = {
  to: OrderStatusValue;
  label: string;
  tone: OrderActionTone;
};

/** Button colours for the quick actions — each step has its own. */
export const ORDER_ACTION_TONE: Record<OrderActionTone, string> = {
  confirm: "bg-success text-white hover:bg-success/90",
  pack: "bg-primary text-primary-foreground hover:bg-mulberry-hover",
  ship: "bg-admin-info text-white hover:bg-admin-info/90",
  deliver:
    "border border-success bg-success-bg text-success hover:bg-success hover:text-white",
  cancel:
    "border border-sale-border bg-sale-bg text-sale hover:bg-sale hover:text-white",
  return:
    "border border-border bg-card text-muted-foreground hover:bg-hairline",
};

/**
 * The next sensible moves from each status. The detail page still offers the
 * full status select for anything unusual; these are the everyday clicks.
 * The first entry is the forward step and is what the list shows first.
 */
export function quickActionsFor(status: OrderStatusValue): OrderQuickAction[] {
  const cancel: OrderQuickAction = { to: "CANCELLED", label: "Cancel", tone: "cancel" };

  switch (status) {
    case "PENDING":
      return [{ to: "CONFIRMED", label: "Confirm", tone: "confirm" }, cancel];
    case "CONFIRMED":
      return [{ to: "PROCESSING", label: "Start packing", tone: "pack" }, cancel];
    case "PROCESSING":
      return [{ to: "SHIPPED", label: "Ship", tone: "ship" }, cancel];
    case "SHIPPED":
      return [
        { to: "DELIVERED", label: "Mark delivered", tone: "deliver" },
        { to: "RETURNED", label: "Returned", tone: "return" },
      ];
    case "DELIVERED":
      return [{ to: "RETURNED", label: "Returned", tone: "return" }];
    default:
      return [];
  }
}
