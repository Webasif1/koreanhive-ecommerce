import "server-only";

import { connectDb } from "@/server/db";
import { Product, WishlistItem } from "@/server/models";
import { readGuestToken } from "@/server/wishlist-cookie";

/** Product ids the current guest has saved, for marking hearts as filled. */
export async function getWishlistProductIds() {
  const token = await readGuestToken();
  if (!token) return new Set<string>();

  await connectDb();

  const items = await WishlistItem.find({ guestToken: token })
    .select("productId")
    .lean();

  return new Set(items.map((i) => i.productId.toString()));
}

export async function getWishlist() {
  const token = await readGuestToken();
  if (!token) return [];

  await connectDb();

  const items = await WishlistItem.find({ guestToken: token })
    .sort({ createdAt: -1 })
    .lean();

  if (items.length === 0) return [];

  const products = await Product.find({
    _id: { $in: items.map((i) => i.productId) },
    isActive: true,
  })
    .select(
      "name slug price comparePrice stock ratingAvg ratingCount shortDescription images variants brandId",
    )
    .lean();

  const { Brand } = await import("@/server/models");
  const brands = await Brand.find({
    _id: { $in: products.flatMap((p) => (p.brandId ? [p.brandId] : [])) },
  })
    .select("name slug")
    .lean();
  const brandById = new Map(brands.map((b) => [b._id.toString(), b]));

  // preserve the order items were saved in
  const order = new Map(
    items.map((item, index) => [item.productId.toString(), index]),
  );

  return products
    .map((product) => {
      const images = [...(product.images ?? [])].sort(
        (a, b) => a.position - b.position,
      );
      const defaultVariant = (product.variants ?? []).find((v) => v.isDefault);
      const brand = product.brandId
        ? brandById.get(product.brandId.toString())
        : null;

      return {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        price: product.price,
        comparePrice: product.comparePrice ?? null,
        stock: product.stock,
        ratingAvg: product.ratingAvg,
        ratingCount: product.ratingCount,
        benefit: product.shortDescription ?? null,
        brand: brand ? { name: brand.name, slug: brand.slug } : null,
        images: images
          .slice(0, 1)
          .map((i) => ({ url: i.url, alt: i.alt ?? null })),
        variants: defaultVariant
          ? [
              {
                id: defaultVariant._id.toString(),
                name: defaultVariant.name,
                price: defaultVariant.price ?? null,
                stock: defaultVariant.stock,
              },
            ]
          : [],
      };
    })
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getWishlistCount() {
  const token = await readGuestToken();
  if (!token) return 0;

  await connectDb();
  return WishlistItem.countDocuments({ guestToken: token });
}
