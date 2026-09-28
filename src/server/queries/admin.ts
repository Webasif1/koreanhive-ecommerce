import "server-only";

import { isValidObjectId, type Types } from "mongoose";

import { requireAdmin } from "@/server/admin-guard";
import { connectDb } from "@/server/db";
import { comboNames } from "@/lib/combo-pricing";
import { percentChange, rangeWindow, type SalesRange } from "@/lib/sales-range";
import {
  Banner,
  Brand,
  Category,
  Coupon,
  Customer,
  type CustomerDoc,
  DeliveryZone,
  Order,
  type OrderDoc,
  Product,
  Review,
} from "@/server/models";

/** Trashed orders are invisible to every admin read except the Trash view. */
const LIVE = { deletedAt: null };

/** Cancelled and returned orders never became money. */
const NOT_A_SALE = ["CANCELLED", "RETURNED"];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** For the sidebar badge, on every admin page. */
export async function getPendingCount() {
  await requireAdmin();
  await connectDb();

  return Order.countDocuments({ ...LIVE, status: "PENDING" });
}

export async function getDashboardStats(range: SalesRange) {
  await requireAdmin();
  await connectDb();

  const window = rangeWindow(range);
  const current = { $gte: window.since };
  const previous = { $gte: window.previousSince, $lt: window.since };

  const statusCounts = (placedAt: object) =>
    Order.aggregate<{ _id: string; count: number }>([
      { $match: { ...LIVE, placedAt } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

  const revenue = (placedAt: object) =>
    Order.aggregate<{ total: number }>([
      { $match: { ...LIVE, placedAt, status: { $nin: NOT_A_SALE } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

  const [
    nowCounts,
    beforeCounts,
    nowRevenue,
    beforeRevenue,
    series,
    productCount,
    lowStock,
    recent,
    topRows,
  ] = await Promise.all([
    statusCounts(current),
    statusCounts(previous),
    revenue(current),
    revenue(previous),
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { ...LIVE, placedAt: current, status: { $nin: NOT_A_SALE } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: window.bucketFormat,
              date: "$placedAt",
              timezone: "Asia/Dhaka",
            },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
    ]),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
    Order.find(LIVE)
      .select("orderNumber customerName customerPhone total status paymentStatus placedAt items._id")
      .sort({ placedAt: -1 })
      .limit(8)
      .lean(),
    Order.aggregate<{ _id: Types.ObjectId; units: number }>([
      { $match: { ...LIVE, placedAt: current, status: { $nin: NOT_A_SALE } } },
      { $unwind: "$items" },
      { $match: { "items.productId": { $ne: null } } },
      { $group: { _id: "$items.productId", units: { $sum: "$items.quantity" } } },
      { $sort: { units: -1, _id: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const count = (rows: { _id: string; count: number }[], status?: string) =>
    rows
      .filter((row) => !status || row._id === status)
      .reduce((sum, row) => sum + row.count, 0);

  const kpi = (
    rows: [typeof nowCounts, typeof beforeCounts],
    status?: string,
  ) => {
    const value = count(rows[0], status);
    return { value, change: percentChange(value, count(rows[1], status)) };
  };

  const both: [typeof nowCounts, typeof beforeCounts] = [nowCounts, beforeCounts];
  const revenueNow = nowRevenue[0]?.total ?? 0;
  const revenueBefore = beforeRevenue[0]?.total ?? 0;

  const byBucket = new Map(series.map((row) => [row._id, row]));

  const topProducts = await Product.find({
    _id: { $in: topRows.map((row) => row._id) },
  })
    .select("name slug images")
    .lean();
  const productById = new Map(topProducts.map((p) => [p._id.toString(), p]));

  return {
    range,
    orders: kpi(both),
    delivered: kpi(both, "DELIVERED"),
    cancelled: kpi(both, "CANCELLED"),
    pending: count(nowCounts, "PENDING"),
    productCount,
    lowStock,
    revenue: {
      value: revenueNow,
      difference: revenueNow - revenueBefore,
      change: percentChange(revenueNow, revenueBefore),
    },
    chart: window.buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      revenue: byBucket.get(bucket.key)?.revenue ?? 0,
      orders: byBucket.get(bucket.key)?.orders ?? 0,
    })),
    recent: recent.map((order) => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      placedAt: order.placedAt,
      itemCount: order.items.length,
    })),
    topProducts: topRows.flatMap((row) => {
      const product = productById.get(row._id.toString());
      if (!product) return [];
      const image = [...(product.images ?? [])].sort(
        (a, b) => a.position - b.position,
      )[0];
      return [
        {
          id: product._id.toString(),
          name: product.name,
          slug: product.slug,
          imageUrl: image?.url ?? null,
          units: row.units,
        },
      ];
    }),
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
export async function getAdminOrders({
  status,
  page = 1,
  q,
}: {
  /** a status, "ALL", or "TRASH" for the soft-deleted orders */
  status?: string;
  page?: number;
  q?: string;
}) {
  await requireAdmin();
  await connectDb();

  const search = (q ?? "").trim().slice(0, 80);
  const filter: Record<string, unknown> =
    status === "TRASH" ? { deletedAt: { $ne: null } } : { ...LIVE };

  if (status && status !== "ALL" && status !== "TRASH") {
    filter.status = status as OrderDoc["status"];
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { orderNumber: pattern },
      { customerName: pattern },
      // phones are stored normalised, so match on the digits typed
      { customerPhone: new RegExp(escapeRegex(search.replace(/\D/g, "") || search)) },
    ];
  }

  const current = Number.isInteger(page) && page > 0 ? page : 1;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .select(
        "orderNumber customerName customerPhone district total status paymentStatus placedAt deletedAt source items._id",
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
      deletedAt: order.deletedAt ?? null,
      source: order.source ?? "CHECKOUT",
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
    comboDiscount: order.comboDiscount ?? 0,
    comboNames: comboNames(order.combos),
    discount: order.discount,
    couponCode: order.couponCode ?? null,
    shippingCharge: order.shippingCharge,
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    placedAt: order.placedAt,
    deletedAt: order.deletedAt ?? null,
    source: order.source ?? "CHECKOUT",
    items: order.items.map((item) => ({
      id: item._id.toString(),
      productName: item.productName,
      productSlug: item.productSlug,
      imageUrl: item.imageUrl ?? null,
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
    // newest first, like the history above it
    emailLog: [...(order.emailLog ?? [])]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .map((entry) => ({
        kind: entry.kind,
        to: entry.to,
        ok: entry.ok,
        error: entry.error ?? null,
        at: entry.at,
      })),
    deliveryZone: {
      name: zone?.name ?? "Delivery",
      minDays: zone?.minDays ?? 1,
      maxDays: zone?.maxDays ?? 4,
    },
  };
}

export const PRODUCT_FILTERS = ["ALL", "ACTIVE", "HIDDEN", "LOW"] as const;
export type ProductFilter = (typeof PRODUCT_FILTERS)[number];

export async function getAdminProducts({
  q,
  filter = "ALL",
}: { q?: string; filter?: ProductFilter } = {}) {
  await requireAdmin();
  await connectDb();

  const search = (q ?? "").trim().slice(0, 80);
  const where: Record<string, unknown> = {};

  if (filter === "ACTIVE") where.isActive = true;
  if (filter === "HIDDEN") where.isActive = false;
  if (filter === "LOW") Object.assign(where, { isActive: true, stock: { $lte: 5 } });

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    where.$or = [{ name: pattern }, { sku: pattern }, { slug: pattern }];
  }

  const [products, brands, categories] = await Promise.all([
    Product.find(where)
      .select("name slug sku price comparePrice stock isActive isFeatured brandId categoryId images")
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
      sku: product.sku ?? null,
      price: product.price,
      comparePrice: product.comparePrice ?? null,
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

export type OrderFormProduct = {
  /** productId, or productId:variantId for a variant */
  value: string;
  label: string;
  price: number;
  stock: number;
};

/** Everything that can go on a manual order: each active product, and each
 *  of its variants as its own line, with today's price and stock. */
export async function getOrderFormProducts(): Promise<OrderFormProduct[]> {
  await requireAdmin();
  await connectDb();

  const products = await Product.find({ isActive: true })
    .select("name price stock variants")
    .sort({ name: 1 })
    .lean();

  return products.flatMap((product) => {
    const id = product._id.toString();

    if (product.variants?.length) {
      return product.variants.map((variant) => ({
        value: `${id}:${variant._id.toString()}`,
        label: `${product.name} — ${variant.name}`,
        price: variant.price ?? product.price,
        stock: variant.stock,
      }));
    }

    return [{ value: id, label: product.name, price: product.price, stock: product.stock }];
  });
}

export const CUSTOMER_FILTERS = ["ALL", "REPEAT", "NEW"] as const;
export type CustomerFilter = (typeof CUSTOMER_FILTERS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Orders and spend per customer, worked out from the live orders so they
 *  can never drift from what is actually there. */
const customerStatsLookup = [
  {
    $lookup: {
      from: Order.collection.name,
      let: { phone: "$phone" },
      pipeline: [
        { $match: { $expr: { $eq: ["$customerPhone", "$$phone"] }, deletedAt: null } },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            spent: {
              $sum: { $cond: [{ $in: ["$status", NOT_A_SALE] }, 0, "$total"] },
            },
          },
        },
      ],
      as: "stats",
    },
  },
  {
    $addFields: {
      orderCount: { $ifNull: [{ $first: "$stats.orders" }, 0] },
      totalSpent: { $ifNull: [{ $first: "$stats.spent" }, 0] },
    },
  },
];

export async function getAdminCustomers({
  q,
  filter = "ALL",
  page = 1,
}: {
  q?: string;
  filter?: CustomerFilter;
  page?: number;
}) {
  await requireAdmin();
  await connectDb();

  const search = (q ?? "").trim().slice(0, 80);
  const match: Record<string, unknown> = {};

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    const digits = search.replace(/\D/g, "");
    match.$or = [
      { name: pattern },
      { email: pattern },
      { phone: new RegExp(escapeRegex(digits || search)) },
    ];
  }
  if (filter === "NEW") {
    match.firstOrderAt = { $gte: new Date(Date.now() - 30 * DAY_MS) };
  }

  const current = Number.isInteger(page) && page > 0 ? page : 1;

  const [result] = await Customer.aggregate<{
    rows: (CustomerDoc & { orderCount: number; totalSpent: number })[];
    total: { count: number }[];
  }>([
    { $match: match },
    ...customerStatsLookup,
    ...(filter === "REPEAT" ? [{ $match: { orderCount: { $gte: 2 } } }] : []),
    { $sort: { lastOrderAt: -1, _id: -1 } },
    {
      $facet: {
        rows: [
          { $skip: (current - 1) * ADMIN_PAGE_SIZE },
          { $limit: ADMIN_PAGE_SIZE },
          { $project: { stats: 0 } },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const total = result?.total[0]?.count ?? 0;

  return {
    customers: (result?.rows ?? []).map((customer) => ({
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? null,
      district: customer.district ?? null,
      area: customer.area ?? null,
      firstOrderAt: customer.firstOrderAt,
      lastOrderAt: customer.lastOrderAt,
      orderCount: customer.orderCount,
      totalSpent: customer.totalSpent,
      note: customer.note ?? null,
    })),
    page: current,
    total,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

/** The strip above the customer table. */
export async function getCustomerSummary() {
  await requireAdmin();
  await connectDb();

  const [total, newThisMonth, repeatRows, unsyncedRows] = await Promise.all([
    Customer.countDocuments({}),
    Customer.countDocuments({ firstOrderAt: { $gte: new Date(Date.now() - 30 * DAY_MS) } }),
    Order.aggregate<{ count: number }>([
      { $match: LIVE },
      { $group: { _id: "$customerPhone", orders: { $sum: 1 } } },
      { $match: { orders: { $gte: 2 } } },
      { $count: "count" },
    ]),
    // phones in the order history with no customer record yet
    Order.aggregate<{ count: number }>([
      { $group: { _id: "$customerPhone" } },
      {
        $lookup: {
          from: Customer.collection.name,
          localField: "_id",
          foreignField: "phone",
          as: "customer",
        },
      },
      { $match: { customer: { $size: 0 } } },
      { $count: "count" },
    ]),
  ]);

  return {
    total,
    newThisMonth,
    repeat: repeatRows[0]?.count ?? 0,
    unsynced: unsyncedRows[0]?.count ?? 0,
  };
}

export async function getAdminCustomer(id: string) {
  await requireAdmin();
  if (!isValidObjectId(id)) return null;
  await connectDb();

  const customer = await Customer.findById(id).lean();
  if (!customer) return null;

  const orders = await Order.find({ customerPhone: customer.phone, ...LIVE })
    .select("orderNumber total status paymentStatus placedAt items._id source")
    .sort({ placedAt: -1 })
    .limit(200)
    .lean();

  const sales = orders.filter((order) => !NOT_A_SALE.includes(order.status));

  return {
    id: customer._id.toString(),
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? null,
    addressLine: customer.addressLine ?? null,
    area: customer.area ?? null,
    district: customer.district ?? null,
    postalCode: customer.postalCode ?? null,
    note: customer.note ?? null,
    source: customer.source,
    firstOrderAt: customer.firstOrderAt,
    lastOrderAt: customer.lastOrderAt,
    orderCount: orders.length,
    totalSpent: sales.reduce((sum, order) => sum + order.total, 0),
    averageOrder: sales.length
      ? Math.round(sales.reduce((sum, order) => sum + order.total, 0) / sales.length)
      : 0,
    delivered: orders.filter((order) => order.status === "DELIVERED").length,
    cancelled: orders.filter((order) => NOT_A_SALE.includes(order.status)).length,
    orders: orders.map((order) => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      placedAt: order.placedAt,
      itemCount: order.items.length,
      source: order.source ?? "CHECKOUT",
    })),
  };
}

/** For the order page's "View customer" link. */
export async function getCustomerIdByPhone(phone: string) {
  await requireAdmin();
  await connectDb();

  const customer = await Customer.findOne({ phone }).select("_id").lean();
  return customer?._id.toString() ?? null;
}

/** For the manual order form's delivery estimate. */
export async function getDeliveryZonesForForm() {
  await requireAdmin();
  await connectDb();

  const zones = await DeliveryZone.find({ isActive: true })
    .select("slug charge freeShippingThreshold")
    .lean();

  return zones.map((zone) => ({
    slug: zone.slug,
    charge: zone.charge,
    freeShippingThreshold: zone.freeShippingThreshold ?? null,
  }));
}

export async function getAdminCoupons() {
  await requireAdmin();
  await connectDb();

  const [coupons, rows] = await Promise.all([
    Coupon.find({}).sort({ createdAt: -1 }).lean(),
    Order.aggregate<{ _id: unknown; count: number }>([
      { $match: { couponId: { $ne: null }, ...LIVE } },
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
