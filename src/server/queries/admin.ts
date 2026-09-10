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
  Review,
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

export const ADMIN_PAGE_SIZE = 50;

/**
 * Paginated, and projected.
 *
 * The order list was capped at 100 with no way past it, so order 101 was
 * simply unreachable from the admin — a shop that takes fifty orders a week
 * loses sight of its own history in a month. The product list had no limit at
 * all and pulled whole documents, descriptions and images included.
 */
export async function getAdminOrders(status?: string, page = 1) {
  await requireAdmin();
  await connectDb();

  const filter =
    status && status !== "ALL" ? { status: status as OrderDoc["status"] } : {};

  const current = Number.isInteger(page) && page > 0 ? page : 1;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select(
        "orderNumber customerName customerPhone district total status paymentStatus placedAt items._id",
      )
      .sort({ placedAt: -1, _id: -1 })
      .skip((current - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders: orders.map((order) => ({
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
    })),
    page: current,
    total,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
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
    Product.find({})
      .select("name slug price stock isActive isFeatured brandId categoryId images")
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean(),
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

export type AdminReview = {
  id: string;
  productName: string;
  productSlug: string | null;
  authorName: string;
  city: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  isApproved: boolean;
  createdAt: string;
};

/**
 * The moderation queue: everything pending first, then what is already live.
 *
 * Shows the reviewer's full name, unlike every storefront read — the person
 * moderating is deciding whether to publish someone's words and should see who
 * wrote them. The masking happens on the way out to the public pages.
 */
export async function getAdminReviews(): Promise<AdminReview[]> {
  await connectDb();

  const reviews = await Review.find()
    .sort({ isApproved: 1, createdAt: -1 })
    .limit(200)
    .lean();

  if (reviews.length === 0) return [];

  const products = await Product.find({
    _id: { $in: reviews.map((review) => review.productId) },
  })
    .select("name slug")
    .lean();

  const byId = new Map(
    products.map((product) => [
      product._id.toString(),
      { name: product.name, slug: product.slug },
    ]),
  );

  return reviews.map((review) => {
    const product = byId.get(review.productId.toString());

    return {
      id: review._id.toString(),
      productName: product?.name ?? "Product removed",
      productSlug: product?.slug ?? null,
      authorName: review.authorName,
      city: review.city ?? null,
      rating: review.rating,
      title: review.title ?? null,
      body: review.body ?? null,
      isApproved: review.isApproved,
      createdAt: review.createdAt.toISOString(),
    };
  });
}
