"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isValidObjectId, type ClientSession, type Types } from "mongoose";

import type { AdminFormState } from "@/lib/admin-state";
import {
  isBdDistrict,
  isValidBdPhone,
  normalizeBdPhone,
  zoneSlugForDistrict,
} from "@/lib/bd-districts";
import { generateOrderNumber } from "@/lib/order-number";
import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/order-status";
import { calcTotals } from "@/lib/pricing";
import { requireAdmin } from "@/server/admin-guard";
import { connectDb, mongoose } from "@/server/db";
import {
  queueOrderPlacedEmails,
  queueStatusEmails,
} from "@/server/email/order-emails";
import {
  DeliveryZone,
  ORDER_STATUSES,
  Order,
  type OrderDoc,
  Product,
} from "@/server/models";

const RESTOCKING_STATUSES = new Set<OrderStatusValue>(["CANCELLED", "RETURNED"]);
const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;

const MAX_NOTE_LENGTH = 500;
/** A manual order is typed by staff, but still capped like the checkout's. */
const MAX_LENGTHS: Record<string, number> = {
  customerName: 120,
  customerPhone: 20,
  customerEmail: 160,
  addressLine: 300,
  area: 120,
  district: 40,
  postalCode: 10,
  note: 500,
};
const MAX_LINES = 50;

function field(formData: FormData, name: string) {
  const raw = String(formData.get(name) ?? "").trim();
  const cap = MAX_LENGTHS[name];
  return cap ? raw.slice(0, cap) : raw;
}

/** Only a status the app actually knows about may be written. This used to be
 *  a bare `as OrderStatusValue` cast over form input, and the schema carried no
 *  enum either, so any string at all could land on an order — and an order with
 *  an unrecognised status disappears from the admin filters and from the
 *  revenue aggregate, which excludes only the literal CANCELLED and RETURNED. */
function parseOrderStatus(raw: string): OrderStatusValue | null {
  return (ORDER_STATUSES as readonly string[]).includes(raw)
    ? (raw as OrderStatusValue)
    : null;
}

function revalidateOrder(orderNumber: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderNumber}`);
}

/** Puts every line of an order back on the shelf, inside the caller's
 *  transaction. The caller owns the `restockedAt` guard. */
async function restockOrder(
  items: OrderDoc["items"],
  session: ClientSession,
) {
  for (const item of items) {
    if (!item.productId) continue;

    if (item.variantId) {
      await Product.updateOne(
        { _id: item.productId, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": item.quantity } },
        { session },
      );
    } else {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
        { session },
      );
    }
  }
}

/**
 * Moves an order to a new status and records why. Two side effects are
 * deliberate:
 *  - cancelling or returning puts the stock back, once
 *  - marking a COD order delivered marks it paid, because the courier has
 *    collected the cash by then
 */
export async function updateOrderStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  await connectDb();

  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const status = parseOrderStatus(String(formData.get("status") ?? ""));
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, MAX_NOTE_LENGTH);

  if (!orderNumber || !status) return;

  const order = await Order.findOne({ orderNumber, deletedAt: null }).lean();

  if (!order || order.status === status) return;

  /**
   * Stock goes back exactly once per order.
   *
   * The old test was "moving into a restocking status from one that is not",
   * which is true again every time the order re-enters CANCELLED. Since
   * leaving CANCELLED never took the stock back out, a
   * CANCELLED → PENDING → CANCELLED cycle credited the quantity on every
   * lap — letting the shop oversell exactly what the checkout transaction
   * exists to prevent. `restockedAt` records that it has happened.
   */
  const shouldRestock =
    RESTOCKING_STATUSES.has(status) && !order.restockedAt;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (shouldRestock) {
        await restockOrder(order.items, session);
      }

      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            status,
            ...(shouldRestock ? { restockedAt: new Date() } : {}),
            paymentStatus:
              status === "DELIVERED" && order.paymentMethod === "COD"
                ? "PAID"
                : order.paymentStatus,
          },
          $push: {
            statusHistory: {
              status,
              note:
                note ||
                (shouldRestock
                  ? `${ORDER_STATUS_LABEL[status]} — stock returned to inventory.`
                  : null),
              createdBy: admin.email ?? "admin",
              createdAt: new Date(),
            },
          },
        },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  // only after the commit, and at most once per status: saving the status an
  // order already has returned early above
  queueStatusEmails(orderNumber, status, admin.email ?? "admin");

  revalidateOrder(orderNumber);
}

export async function updatePaymentStatusAction(formData: FormData) {
  await requireAdmin();
  await connectDb();

  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const raw = String(formData.get("paymentStatus") ?? "");
  if (!orderNumber) return;

  // reject anything that is not a real status rather than writing junk
  const paymentStatus = PAYMENT_STATUSES.find((status) => status === raw);
  if (!paymentStatus) return;

  await Order.updateOne({ orderNumber }, { $set: { paymentStatus } });

  revalidateOrder(orderNumber);
}

type CustomerFields = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressLine: string;
  area: string;
  district: string;
  postalCode: string;
  note: string;
};

/** The same rules the checkout applies, so staff cannot save an order the
 *  courier could not deliver. */
function readCustomer(formData: FormData) {
  const values: CustomerFields = {
    customerName: field(formData, "customerName"),
    customerPhone: field(formData, "customerPhone"),
    customerEmail: field(formData, "customerEmail"),
    addressLine: field(formData, "addressLine"),
    area: field(formData, "area"),
    district: field(formData, "district"),
    postalCode: field(formData, "postalCode"),
    note: field(formData, "note"),
  };

  const errors: Record<string, string> = {};
  if (values.customerName.length < 2) errors.customerName = "Enter the customer's name.";
  if (!isValidBdPhone(values.customerPhone)) {
    errors.customerPhone = "Enter a valid Bangladeshi mobile number.";
  }
  if (
    values.customerEmail &&
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.customerEmail)
  ) {
    errors.customerEmail = "That email address does not look right.";
  }
  if (values.addressLine.length < 6) errors.addressLine = "Enter the full address.";
  if (values.area.length < 2) errors.area = "Enter the area or thana.";
  if (!isBdDistrict(values.district)) errors.district = "Select a district.";

  return { values, errors };
}

/**
 * A phone or WhatsApp order, typed in by staff.
 *
 * Priced and stocked exactly like the checkout: prices come from the
 * database, delivery from the district, and stock is taken with the same
 * conditional decrement so a manual order cannot oversell either.
 */
export async function createAdminOrderAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const { values, errors } = readCustomer(formData);

  // lines arrive as parallel "line" / "qty" fields, one pair per row
  const picked = formData.getAll("line").map(String);
  const quantities = formData.getAll("qty").map((q) => Math.floor(Number(q)));

  const wanted = new Map<string, number>();
  picked.slice(0, MAX_LINES).forEach((value, index) => {
    const quantity = quantities[index];
    if (!value || !Number.isFinite(quantity) || quantity < 1) return;
    // the same product picked twice becomes one line
    wanted.set(value, (wanted.get(value) ?? 0) + Math.min(quantity, 999));
  });

  if (wanted.size === 0) errors.lines = "Add at least one product.";

  const manualDiscount = Math.max(
    0,
    Math.floor(Number(formData.get("discount") ?? 0)) || 0,
  );

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  await connectDb();

  const zone = await DeliveryZone.findOne({
    slug: zoneSlugForDistrict(values.district),
    isActive: true,
  }).lean();

  if (!zone) {
    return {
      ok: false,
      message: "No delivery zone covers that district.",
      errors: { district: "Unsupported delivery area." },
    };
  }

  const parsed = [...wanted].map(([value, quantity]) => {
    const [productId, variantId = null] = value.split(":");
    return { productId, variantId, quantity };
  });

  if (
    parsed.some(
      (line) =>
        !isValidObjectId(line.productId) ||
        (line.variantId !== null && !isValidObjectId(line.variantId)),
    )
  ) {
    return { ok: false, message: "One of the products could not be found.", errors: {} };
  }

  const products = await Product.find({
    _id: { $in: parsed.map((line) => line.productId) },
    isActive: true,
  })
    .select("name slug sku price images variants")
    .lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lines: {
    productId: Types.ObjectId;
    variantId: Types.ObjectId | null;
    productName: string;
    productSlug: string;
    sku: string | null;
    variantName: string | null;
    imageUrl: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[] = [];

  for (const line of parsed) {
    const product = byId.get(line.productId);
    const variant = line.variantId
      ? (product?.variants.find((v) => v._id.toString() === line.variantId) ?? null)
      : null;

    if (!product || (line.variantId && !variant)) {
      return {
        ok: false,
        message: "One of the products is no longer available.",
        errors: { lines: "Remove the unavailable product." },
      };
    }

    const unitPrice = variant?.price ?? product.price;
    const firstImage = [...(product.images ?? [])].sort(
      (a, b) => a.position - b.position,
    )[0];

    lines.push({
      productId: product._id,
      variantId: variant?._id ?? null,
      productName: product.name,
      productSlug: product.slug,
      sku: product.sku ?? null,
      variantName: variant?.name ?? null,
      imageUrl: firstImage?.url ?? null,
      unitPrice,
      quantity: line.quantity,
      lineTotal: unitPrice * line.quantity,
    });
  }

  const totals = calcTotals({
    lines,
    zone: {
      charge: zone.charge,
      freeShippingThreshold: zone.freeShippingThreshold ?? null,
    },
    coupon: null,
  });
  // a manual discount can take the goods to zero, never below
  const discount = Math.min(manualDiscount, totals.subtotal);
  const total = totals.subtotal - discount + totals.shippingCharge;

  const session = await mongoose.startSession();
  let number: string | null = null;

  try {
    number = await session.withTransaction(async () => {
      for (const line of lines) {
        const result = line.variantId
          ? await Product.updateOne(
              {
                _id: line.productId,
                variants: {
                  $elemMatch: { _id: line.variantId, stock: { $gte: line.quantity } },
                },
              },
              { $inc: { "variants.$.stock": -line.quantity } },
              { session },
            )
          : await Product.updateOne(
              { _id: line.productId, stock: { $gte: line.quantity } },
              { $inc: { stock: -line.quantity } },
              { session },
            );

        if (result.modifiedCount !== 1) {
          throw new Error(`OUT_OF_STOCK:${line.productName}`);
        }
      }

      const created = generateOrderNumber();

      await Order.create(
        [
          {
            orderNumber: created,
            customerName: values.customerName,
            customerPhone: normalizeBdPhone(values.customerPhone),
            customerEmail: values.customerEmail || null,
            addressLine: values.addressLine,
            area: values.area,
            district: values.district,
            postalCode: values.postalCode || null,
            note: values.note || null,
            deliveryZoneId: zone._id,
            subtotal: totals.subtotal,
            comboDiscount: 0,
            discount,
            shippingCharge: totals.shippingCharge,
            total,
            status: "PENDING",
            paymentMethod: "COD",
            paymentStatus: "UNPAID",
            source: "ADMIN",
            items: lines,
            statusHistory: [
              {
                status: "PENDING",
                note: "Order entered by staff — cash on delivery.",
                createdBy: admin.email ?? "admin",
              },
            ],
          },
        ],
        { session },
      );

      return created;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("OUT_OF_STOCK:")) {
      return {
        ok: false,
        message: `Not enough stock for ${message.slice("OUT_OF_STOCK:".length)}.`,
        errors: { lines: "Lower the quantity or pick another product." },
      };
    }

    console.error("createAdminOrderAction failed", error);
    return { ok: false, message: "The order could not be saved. Try again.", errors: {} };
  } finally {
    await session.endSession();
  }

  if (!number) {
    return { ok: false, message: "The order could not be saved. Try again.", errors: {} };
  }

  queueOrderPlacedEmails(number, { notifyShop: false });

  revalidateOrder(number);
  revalidatePath("/admin/products");
  revalidateTag("products", "max");

  redirect(`/admin/orders/${number}`);
}

/** Customer, address and note only — the items and money are a snapshot of
 *  what was sold and stay as they are. */
export async function updateOrderDetailsAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const { values, errors } = readCustomer(formData);

  if (!orderNumber) {
    return { ok: false, message: "That order could not be found.", errors: {} };
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  await connectDb();

  const order = await Order.findOne({ orderNumber, deletedAt: null })
    .select("district")
    .lean();

  if (!order) {
    return { ok: false, message: "That order could not be found.", errors: {} };
  }

  // The delivery charge was worked out from the district. Moving an order
  // across the Dhaka line would leave the wrong charge on it.
  if (zoneSlugForDistrict(values.district) !== zoneSlugForDistrict(order.district)) {
    return {
      ok: false,
      message:
        "That district is in a different delivery zone, so the delivery charge would change. Cancel this order and create a new one instead.",
      errors: { district: "Different delivery zone." },
    };
  }

  await Order.updateOne(
    { orderNumber },
    {
      $set: {
        customerName: values.customerName,
        customerPhone: normalizeBdPhone(values.customerPhone),
        customerEmail: values.customerEmail || null,
        addressLine: values.addressLine,
        area: values.area,
        district: values.district,
        postalCode: values.postalCode || null,
        note: values.note || null,
      },
    },
  );

  console.info(`[admin] ${admin.email ?? "admin"} edited order ${orderNumber}`);

  revalidateOrder(orderNumber);
  redirect(`/admin/orders/${orderNumber}`);
}

/**
 * Soft delete. The order leaves every list, report and customer lookup, and
 * its stock goes back on the shelf — unless it already did, when the order
 * was cancelled or returned. Restoring brings the record back but not the
 * stock decrement: a restored order is kept for the books, not re-shipped.
 */
export async function trashOrderAction(formData: FormData) {
  const admin = await requireAdmin();
  await connectDb();

  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  if (!orderNumber) return;

  const order = await Order.findOne({ orderNumber, deletedAt: null }).lean();
  if (!order) return;

  const shouldRestock = !order.restockedAt;
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (shouldRestock) await restockOrder(order.items, session);

      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            deletedAt: new Date(),
            ...(shouldRestock ? { restockedAt: new Date() } : {}),
          },
          $push: {
            statusHistory: {
              status: order.status,
              note: shouldRestock
                ? "Moved to trash — stock returned to inventory."
                : "Moved to trash.",
              createdBy: admin.email ?? "admin",
              createdAt: new Date(),
            },
          },
        },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }

  revalidateOrder(orderNumber);
  revalidatePath("/admin/products");
  revalidateTag("products", "max");

  if (formData.get("redirect") === "list") redirect("/admin/orders");
}

/**
 * Brings an order back from the trash. If trashing put its stock back and
 * the order is still live (not cancelled or returned), the stock is taken
 * out again so it can ship. When the shelf no longer covers it, the order
 * comes back as Cancelled rather than as a parcel the shop cannot fill.
 */
export async function restoreOrderAction(formData: FormData) {
  const admin = await requireAdmin();
  await connectDb();

  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  if (!orderNumber) return;

  const order = await Order.findOne({ orderNumber, deletedAt: { $ne: null } }).lean();
  if (!order) return;

  const needsStock =
    Boolean(order.restockedAt) && !RESTOCKING_STATUSES.has(order.status);
  const by = admin.email ?? "admin";

  const restoreAs = async (
    set: Record<string, unknown>,
    status: OrderStatusValue,
    note: string,
    session?: ClientSession,
  ) =>
    Order.updateOne(
      { _id: order._id },
      {
        $set: { deletedAt: null, ...set },
        $push: { statusHistory: { status, note, createdBy: by, createdAt: new Date() } },
      },
      { session },
    );

  if (!needsStock) {
    await restoreAs({}, order.status, "Restored from trash.");
  } else {
    const session = await mongoose.startSession();
    let restocked = false;

    try {
      await session.withTransaction(async () => {
        for (const item of order.items) {
          if (!item.productId) continue;

          const result = item.variantId
            ? await Product.updateOne(
                {
                  _id: item.productId,
                  variants: {
                    $elemMatch: { _id: item.variantId, stock: { $gte: item.quantity } },
                  },
                },
                { $inc: { "variants.$.stock": -item.quantity } },
                { session },
              )
            : await Product.updateOne(
                { _id: item.productId, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { session },
              );

          if (result.modifiedCount !== 1) throw new Error("OUT_OF_STOCK");
        }

        await restoreAs(
          { restockedAt: null },
          order.status,
          "Restored from trash — stock taken out again.",
          session,
        );
      });
      restocked = true;
    } catch (error) {
      if (!(error instanceof Error && error.message === "OUT_OF_STOCK")) throw error;
    } finally {
      await session.endSession();
    }

    if (!restocked) {
      // the stock is already back on the shelf, so Cancelled is the honest state
      await restoreAs(
        { status: "CANCELLED" },
        "CANCELLED",
        "Restored from trash as Cancelled — not enough stock to fill it again.",
      );
    }

    revalidatePath("/admin/products");
    revalidateTag("products", "max");
  }

  revalidateOrder(orderNumber);
}
