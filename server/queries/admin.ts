import "server-only";

import { requireAdmin } from "@/server/admin-guard";
import { db } from "@/server/db";

export async function getDashboardStats() {
  await requireAdmin();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [orderCount, pendingCount, productCount, lowStock, revenue, recent] =
    await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: "PENDING" } }),
      db.product.count({ where: { isActive: true } }),
      db.product.count({ where: { isActive: true, stock: { lte: 5 } } }),
      // cancelled and returned orders never became money
      db.order.aggregate({
        _sum: { total: true },
        where: {
          placedAt: { gte: since },
          status: { notIn: ["CANCELLED", "RETURNED"] },
        },
      }),
      db.order.findMany({
        orderBy: { placedAt: "desc" },
        take: 8,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          status: true,
          placedAt: true,
        },
      }),
    ]);

  return {
    orderCount,
    pendingCount,
    productCount,
    lowStock,
    revenue30d: revenue._sum.total ?? 0,
    recent,
  };
}

export async function getAdminOrders(status?: string) {
  await requireAdmin();

  return db.order.findMany({
    where:
      status && status !== "ALL"
        ? { status: status as "PENDING" }
        : undefined,
    orderBy: { placedAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      district: true,
      total: true,
      status: true,
      paymentStatus: true,
      placedAt: true,
      _count: { select: { items: true } },
    },
  });
}

export async function getAdminOrder(orderNumber: string) {
  await requireAdmin();

  return db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      deliveryZone: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getAdminProducts() {
  await requireAdmin();

  return db.product.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      stock: true,
      isActive: true,
      isFeatured: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
}

export async function getAdminProduct(id: string) {
  await requireAdmin();

  return db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });
}

export async function getProductFormOptions() {
  await requireAdmin();

  const [brands, categories] = await Promise.all([
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, parent: { select: { name: true } } },
    }),
  ]);

  return { brands, categories };
}

export async function getAdminCoupons() {
  await requireAdmin();

  return db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
}

export async function getAdminBanners() {
  await requireAdmin();

  return db.banner.findMany({ orderBy: { position: "asc" } });
}
