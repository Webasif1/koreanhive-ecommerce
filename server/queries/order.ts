import "server-only";

import { normalizeBdPhone } from "@/lib/bd-districts";
import type { OrderStatusValue } from "@/lib/order-status";
import { db } from "@/server/db";

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

  const order = await db.order.findFirst({
    where: { orderNumber, customerPhone: phone },
    include: {
      items: true,
      deliveryZone: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) return null;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.placedAt.toISOString(),
    customerName: order.customerName,
    area: order.area,
    district: order.district,
    zoneName: order.deliveryZone.name,
    minDays: order.deliveryZone.minDays,
    maxDays: order.deliveryZone.maxDays,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode,
    shippingCharge: order.shippingCharge,
    total: order.total,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      productSlug: item.productSlug,
      variantName: item.variantName,
      imageUrl: item.imageUrl,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    history: order.statusHistory.map((entry) => ({
      id: entry.id,
      status: entry.status,
      note: entry.note,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}
