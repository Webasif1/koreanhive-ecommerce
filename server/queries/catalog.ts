import "server-only";

import { db } from "@/server/db";

/** Shape every product grid renders. Keep the select list tight — grids
 *  should never pull description/ingredients blobs. */
const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  comparePrice: true,
  stock: true,
  ratingAvg: true,
  ratingCount: true,
  brand: { select: { name: true, slug: true } },
  images: {
    orderBy: { position: "asc" },
    take: 1,
    select: { url: true, alt: true },
  },
  // the card's Buy Now needs something concrete to put in the cart
  variants: {
    where: { isDefault: true },
    take: 1,
    select: { id: true, name: true, price: true, stock: true },
  },
} as const;

export type ProductCardData = Awaited<
  ReturnType<typeof getFeaturedProducts>
>[number];

export type ProductSort = "newest" | "price-asc" | "price-desc" | "popular";

function orderByFor(sort: ProductSort) {
  switch (sort) {
    case "price-asc":
      return { price: "asc" } as const;
    case "price-desc":
      return { price: "desc" } as const;
    case "popular":
      return { ratingCount: "desc" } as const;
    default:
      return { createdAt: "desc" } as const;
  }
}

/** Slugs + timestamps for sitemap.ts. Deliberately minimal: this runs on a
 *  route that search engines hit, not a customer. */
export async function getSitemapEntries() {
  const [products, categories, brands] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    db.brand.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return { products, categories, brands };
}

export function getFeaturedProducts(take = 4) {
  return db.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { createdAt: "desc" },
    take,
    select: productCardSelect,
  });
}

export function getProducts({
  sort = "newest",
  take = 48,
}: { sort?: ProductSort; take?: number } = {}) {
  return db.product.findMany({
    where: { isActive: true },
    orderBy: orderByFor(sort),
    take,
    select: productCardSelect,
  });
}

export function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true, parentId: true } },
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
    },
  });
}

/** Same category first. A category holding a single product would otherwise
 *  render an empty "You may also like", so top up from the wider catalogue. */
export async function getRelatedProducts({
  productId,
  categoryId,
  take = 4,
}: {
  productId: string;
  categoryId: string | null;
  take?: number;
}) {
  const sameCategory = categoryId
    ? await db.product.findMany({
        where: { isActive: true, id: { not: productId }, categoryId },
        orderBy: { ratingCount: "desc" },
        take,
        select: productCardSelect,
      })
    : [];

  if (sameCategory.length >= take) return sameCategory;

  const excludeIds = [productId, ...sameCategory.map((p) => p.id)];

  const fallback = await db.product.findMany({
    where: { isActive: true, id: { notIn: excludeIds } },
    orderBy: [{ isFeatured: "desc" }, { ratingCount: "desc" }],
    take: take - sameCategory.length,
    select: productCardSelect,
  });

  return [...sameCategory, ...fallback];
}

/** Products in a category *and* its direct children, so "Skincare" is not
 *  empty just because every product sits on a leaf category. */
export async function getCategoryWithProducts(
  slug: string,
  sort: ProductSort = "newest",
) {
  const category = await db.category.findFirst({
    where: { slug, isActive: true },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: { id: true, name: true, slug: true },
      },
      parent: { select: { name: true, slug: true } },
    },
  });

  if (!category) return null;

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const products = await db.product.findMany({
    where: { isActive: true, categoryId: { in: categoryIds } },
    orderBy: orderByFor(sort),
    select: productCardSelect,
  });

  return { category, products };
}

export async function getBrandWithProducts(
  slug: string,
  sort: ProductSort = "newest",
) {
  const brand = await db.brand.findFirst({
    where: { slug, isActive: true },
  });

  if (!brand) return null;

  const products = await db.product.findMany({
    where: { isActive: true, brandId: brand.id },
    orderBy: orderByFor(sort),
    select: productCardSelect,
  });

  return { brand, products };
}

export function getCategoryTree() {
  return db.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { position: "asc" },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: { _count: { select: { products: true } } },
      },
    },
  });
}

export function getBrands() {
  return db.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export function getDeliveryZones() {
  return db.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
}
