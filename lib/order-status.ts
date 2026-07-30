export type OrderStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

/** The happy path a parcel walks through. CANCELLED and RETURNED are
 *  terminal detours and are rendered separately. */
export const ORDER_FLOW: OrderStatusValue[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export const ORDER_STATUS_LABEL: Record<OrderStatusValue, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Packing",
  SHIPPED: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const ORDER_STATUS_HINT: Record<OrderStatusValue, string> = {
  PENDING: "We have your order and will call to confirm.",
  CONFIRMED: "Confirmed over the phone. Getting it ready.",
  PROCESSING: "Your items are being packed.",
  SHIPPED: "Handed to the courier and on its way to you.",
  DELIVERED: "Delivered. Thank you for shopping with Korean Hive!",
  CANCELLED: "This order was cancelled.",
  RETURNED: "This order came back to us.",
};

export function isTerminalDetour(status: OrderStatusValue) {
  return status === "CANCELLED" || status === "RETURNED";
}

/** How far along the flow a status sits; -1 for the detours. */
export function flowIndex(status: OrderStatusValue) {
  return ORDER_FLOW.indexOf(status);
}
