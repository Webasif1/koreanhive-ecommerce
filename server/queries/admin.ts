import "server-only";

import { isValidObjectId } from "mongoose";

import { requireAdmin } from "@/server/admin-guard";
import { connectDb } from "@/server/db";
import {
  Banner,
  Brand,
  Category,
  Coupon,
  DeliveryZone,
  Order,
  type OrderDoc,
  Product,
} from "@/server/models";

export async function getDashboardStats() {
  await requireAdmin();
  await connectDb();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [orderCount, pendingCount, productCount, lowStock, revenueRows, recent] =
    await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: "PENDING" }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
      // cancelled and returned orders never became money
      Order.aggregate<{ total: number }>([
        {
          $match: {
            placedAt: { $gte: since },
            status: { $nin: ["CANCELLED", "RETURNED"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.find({})
        .select("orderNumber customerName total status placedAt")
        .sort({ placedAt: -1 })
        .limit(8)
        .lean(),
    ]);

  return {
    orderCount,
    pendingCount,
    productCount,
    lowStock,
    revenue30d: revenueRows[0]?.total ?? 0,
    recent: recent.map((order) => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      total: order.total,
      status: order.status,
      placedAt: order.placedAt,
    })),
  };
}

export async function getAdminOrders(status?: string) {
  await requireAdmin();
  await connectDb();

  const orders = await Order.find(
    status && status !== "ALL"
      ? { status: status as OrderDoc["status"] }
      : {},
  )
    .sort({ placedAt: -1 })
    .limit(100)
    .lean();

  return orders.map((order) => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    district: order.district,
    total: order.total,
    status: order.status,
    paymentStatus: order.paymentStatus,
    placedAt: order.placedAt,
    _count: { items: order.items.length },
  }));
}

export async function getAdminOrder(orderNumber: string) {
  await requireAdmin();
  await connectDb();

  const order = await Order.findOne({ orderNumber }).lean();
  if (!order) return null;

  const zone = await DeliveryZone.findById(order.deliveryZoneId).lean();

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail ?? null,
    addressLine: order.addressLine,
    area: order.area,
    district: order.district,
    postalCode: order.postalCode ?? null,
    note: order.note ?? null,
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: order.couponCode ?? null,
    shippingCharge: order.shippingCharge,
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    placedAt: order.placedAt,
    items: order.items.map((item) => ({
      id: item._id.toString(),
      productName: item.productName,
      variantName: item.variantName ?? null,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    // newest first for the admin log
    statusHistory: [...order.statusHistory]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((entry) => ({
        id: entry._id.toString(),
        status: entry.status,
        note: entry.note ?? null,
        createdBy: entry.createdBy ?? null,
        createdAt: entry.createdAt,
      })),
    deliveryZone: {
      name: zone?.name ?? "Delivery",
      minDays: zone?.minDays ?? 1,
      maxDays: zone?.maxDays ?? 4,
    },
  };
}

export async function getAdminProducts() {
  await requireAdmin();
  await connectDb();

  const [products, brands, categories] = await Promise.all([
    Product.find({}).sort({ updatedAt: -1 }).lean(),
    Brand.find({}).select("name").lean(),
    Category.find({}).select("name").lean(),
  ]);

  const brandNames = new Map(brands.map((b) => [b._id.toString(), b.name]));
  const categoryNames = new Map(
    categories.map((c) => [c._id.toString(), c.name]),
  );

  return products.map((product) => {
    const firstImage = [...(product.images ?? [])].sort(
      (a, b) => a.position - b.position,
    )[0];

    return {
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      brand: product.brandId
        ? { name: brandNames.get(product.brandId.toString()) ?? "—" }
        : null,
      category: product.categoryId
        ? { name: categoryNames.get(product.categoryId.toString()) ?? "—" }
        : null,
      images: firstImage ? [{ url: firstImage.url }] : [],
    };
  });
}

export async function getAdminProduct(id: string) {
  await requireAdmin();

  if (!isValidObjectId(id)) return null;

  await connectDb();

  const product = await Product.findById(id).lean();
  if (!product) return null;

  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    price: product.price,
    comparePrice: product.comparePrice ?? null,
    stock: product.stock,
    sku: product.sku ?? null,
    shortDescription: product.shortDescription ?? null,
    description: product.description ?? null,
    ingredients: product.ingredients ?? null,
    howToUse: product.howToUse ?? null,
    brandId: product.brandId?.toString() ?? null,
    categoryId: product.categoryId?.toString() ?? null,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    metaTitle: product.metaTitle ?? null,
    metaDescription: product.metaDescription ?? null,
    images: [...product.images]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ url: i.url })),
  };
}

export async function getProductFormOptions() {
  await requireAdmin();
  await connectDb();

  const [brands, categories] = await Promise.all([
    Brand.find({}).select("name").sort({ name: 1 }).lean(),
    Category.find({}).select("name parentId").sort({ name: 1 }).lean(),
  ]);

  const byId = new Map(categories.map((c) => [c._id.toString(), c.name]));

  return {
    brands: brands.map((b) => ({ id: b._id.toString(), name: b.name })),
    categories: categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      parent: c.parentId
        ? { name: byId.get(c.parentId.toString()) ?? "—" }
        : null,
    })),
  };
}

export async function getAdminCoupons() {
  await requireAdmin();
  await connectDb();

  const [coupons, rows] = await Promise.all([
    Coupon.find({}).sort({ createdAt: -1 }).lean(),
    Order.aggregate<{ _id: unknown; count: number }>([
      { $match: { couponId: { $ne: null } } },
      { $group: { _id: "$couponId", count: { $sum: 1 } } },
    ]),
  ]);

  const orderCounts = new Map(
    rows.filter((r) => r._id).map((r) => [String(r._id), r.count]),
  );

  return coupons.map((coupon) => ({
    id: coupon._id.toString(),
    code: coupon.code,
    description: coupon.description ?? null,
    type: coupon.type,
    value: coupon.value,
    minSubtotal: coupon.minSubtotal ?? null,
    maxDiscount: coupon.maxDiscount ?? null,
    usageLimit: coupon.usageLimit ?? null,
    usedCount: coupon.usedCount,
    isActive: coupon.isActive,
    endsAt: coupon.endsAt ?? null,
    _count: { orders: orderCounts.get(coupon._id.toString()) ?? 0 },
  }));
}

export async function getAdminBanners() {
  await requireAdmin();
  await connectDb();

  const banners = await Banner.find({}).sort({ position: 1 }).lean();

  return banners.map((banner) => ({
    id: banner._id.toString(),
    title: banner.title,
    subtitle: banner.subtitle ?? null,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl ?? null,
    position: banner.position,
    isActive: banner.isActive,
  }));
}
