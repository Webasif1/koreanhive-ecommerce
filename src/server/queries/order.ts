import "server-only";

import { normalizeBdPhone } from "@/lib/bd-districts";
import type { OrderStatusValue } from "@/lib/order-status";
import { connectDb } from "@/server/db";
import { DeliveryZone, Order } from "@/server/models";

export type TrackedOrder = {
  orderNumber: string;
  status: OrderStatusValue;
  placedAt: string;
  customerName: string;
  area: string;
  district: string;
  zoneName: string;
  minDays: number;
  maxDays: number;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingCharge: number;
  total: number;
  items: {
    id: string;
    productName: string;
    productSlug: string;
    variantName: string | null;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  history: {
    id: string;
    status: OrderStatusValue;
    note: string | null;
    createdAt: string;
  }[];
};

export function normalizeOrderNumber(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

/** Both the order number and the phone must match. Returns null for any
 *  miss, so the caller cannot tell which half was wrong. */
export async function findOrderForTracking(
  orderNumberInput: string,
  phoneInput: string,
): Promise<TrackedOrder | null> {
  const orderNumber = normalizeOrderNumber(orderNumberInput);
  const phone = normalizeBdPhone(phoneInput);

  if (!orderNumber || !phone) return null;

  await connectDb();

  const order = await Order.findOne({
    orderNumber,
    customerPhone: phone,
  }).lean();

  if (!order) return null;

  const zone = await DeliveryZone.findById(order.deliveryZoneId).lean();

  const history = [...order.statusHistory].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.placedAt.toISOString(),
    customerName: order.customerName,
    area: order.area,
    district: order.district,
    zoneName: zone?.name ?? "Delivery",
    minDays: zone?.minDays ?? 1,
    maxDays: zone?.maxDays ?? 4,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode ?? null,
    shippingCharge: order.shippingCharge,
    total: order.total,
    items: order.items.map((item) => ({
      id: item._id.toString(),
      productName: item.productName,
      productSlug: item.productSlug,
      variantName: item.variantName ?? null,
      imageUrl: item.imageUrl ?? null,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    history: history.map((entry) => ({
      id: entry._id.toString(),
      status: entry.status,
      note: entry.note ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

/** Confirmation page: the caller has already proven access via cookie. */
export async function getOrderByNumber(orderNumber: string) {
  await connectDb();

  const order = await Order.findOne({ orderNumber }).lean();
  if (!order) return null;

  const zone = await DeliveryZone.findById(order.deliveryZoneId).lean();

  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    area: order.area,
    district: order.district,
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode ?? null,
    shippingCharge: order.shippingCharge,
    total: order.total,
    items: order.items.map((item) => ({
      id: item._id.toString(),
      productName: item.productName,
      variantName: item.variantName ?? null,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    deliveryZone: {
      name: zone?.name ?? "Delivery",
      minDays: zone?.minDays ?? 1,
      maxDays: zone?.maxDays ?? 4,
    },
  };
}
