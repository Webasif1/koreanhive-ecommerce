import "server-only";

import { unstable_cache } from "next/cache";
import type { QueryFilter } from "mongoose";

import { connectDb } from "@/server/db";
import {
  Banner,
  Brand,
  Category,
  DeliveryZone,
  Product,
  type ProductDoc,
} from "@/server/models";

/** Shape every product grid renders. Kept tight on purpose — grids should
 *  never pull description/ingredients blobs. */
export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  ratingAvg: number;
  ratingCount: number;
  /** the one-line benefit the design puts under the product name */
  benefit: string | null;
  brand: { name: string; slug: string } | null;
  images: { url: string; alt: string | null }[];
  // the card's Buy Now needs something concrete to put in the cart
  variants: { id: string; name: string; price: number | null; stock: number }[];
};

const CARD_FIELDS =
  "name slug price comparePrice stock ratingAvg ratingCount shortDescription brandId images variants";

export type ProductSort =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "popular"
  | "discount";

function sortFor(sort: ProductSort): Record<string, 1 | -1> {
  switch (sort) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "popular":
      return { ratingCount: -1 };
    // "discount" is a computed ratio, sorted in memory after the fetch
    default:
      return { createdAt: -1 };
  }
}

type LeanProduct = Pick<
  ProductDoc,
  | "_id"
  | "name"
  | "slug"
  | "price"
  | "comparePrice"
  | "stock"
  | "ratingAvg"
  | "ratingCount"
  | "shortDescription"
  | "brandId"
  | "images"
  | "variants"
>;

/** One brand lookup for a whole page of cards rather than a join per row. */
async function brandMapFor(products: LeanProduct[]) {
  const ids = [
    ...new Set(
      products.flatMap((p) => (p.brandId ? [p.brandId.toString()] : [])),
    ),
  ];

  if (ids.length === 0) return new Map<string, { name: string; slug: string }>();

  const brands = await Brand.find({ _id: { $in: ids } })
    .select("name slug")
    .lean();

  return new Map(
    brands.map((b) => [b._id.toString(), { name: b.name, slug: b.slug }]),
  );
}

function toCard(
  product: LeanProduct,
  brands: Map<string, { name: string; slug: string }>,
): ProductCardData {
  const images = [...(product.images ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const defaultVariant = (product.variants ?? []).find((v) => v.isDefault);

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
    brand: product.brandId
      ? (brands.get(product.brandId.toString()) ?? null)
      : null,
    images: images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt ?? null })),
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
}

/** Mongoose 9 renamed FilterQuery to QueryFilter. */
type ProductFilter = QueryFilter<ProductDoc>;

async function findCards(
  filter: ProductFilter,
  sort: ProductSort,
  take?: number,
) {
  await connectDb();

  const query = Product.find(filter).select(CARD_FIELDS).sort(sortFor(sort));
  if (take) query.limit(take);

  const products = (await query.lean()) as unknown as LeanProduct[];
  const brands = await brandMapFor(products);

  return products.map((p) => toCard(p, brands));
}

// ------------------------------------------------------------- filters

export type FacetOption = {
  slug: string;
  name: string;
  count: number;
};

export type CatalogFilters = {
  brands?: string[];
  categories?: string[];
  onSale?: boolean;
  inStock?: boolean;
};

export type CatalogListing = {
  products: ProductCardData[];
  total: number;
  scopeTotal: number;
  facets: {
    categories: FacetOption[];
    brands: FacetOption[];
    onSale: number;
    inStock: number;
  };
};

/** Higher discount first. Computed, so it is applied after the fetch rather
 *  than in the Mongo sort — the result set is capped, so this is cheap. */
function byDiscount(a: ProductCardData, b: ProductCardData) {
  const ratio = (p: ProductCardData) =>
    p.comparePrice && p.comparePrice > p.price
      ? (p.comparePrice - p.price) / p.comparePrice
      : 0;
  return ratio(b) - ratio(a);
}

function saleClause() {
  return { comparePrice: { $ne: null, $gt: 0 } };
}

/**
 * One listing query for /shop, /category, /brand and /deals.
 *
 * `scope` is the part of the URL that is not user-toggleable — the category
 * or brand whose page you are on. Facet counts are computed with every
 * *other* active filter applied, so the numbers next to a checkbox tell you
 * what you would actually get by ticking it.
 */
export async function getCatalogListing({
  scope = {},
  filters = {},
  sort = "newest",
  take = 60,
}: {
  scope?: ProductFilter;
  filters?: CatalogFilters;
  sort?: ProductSort;
  take?: number;
}): Promise<CatalogListing> {
  await connectDb();

  const [allBrands, allCategories] = await Promise.all([
    Brand.find({ isActive: true }).select("name slug").sort({ name: 1 }).lean(),
    Category.find({ isActive: true, parentId: { $ne: null } })
      .select("name slug")
      .sort({ position: 1 })
      .lean(),
  ]);

  const brandIdBySlug = new Map(allBrands.map((b) => [b.slug, b._id]));
  const categoryIdBySlug = new Map(allCategories.map((c) => [c.slug, c._id]));

  // flatMap rather than filter(Boolean): the latter does not narrow away the
  // undefined, and Mongoose's filter types reject it
  const selectedBrandIds = (filters.brands ?? []).flatMap((slug) => {
    const id = brandIdBySlug.get(slug);
    return id ? [id] : [];
  });
  const selectedCategoryIds = (filters.categories ?? []).flatMap((slug) => {
    const id = categoryIdBySlug.get(slug);
    return id ? [id] : [];
  });

  const base: ProductFilter = { isActive: true, ...scope };

  const clauses = {
    brand: selectedBrandIds.length ? { brandId: { $in: selectedBrandIds } } : {},
    category: selectedCategoryIds.length
      ? { categoryId: { $in: selectedCategoryIds } }
      : {},
    onSale: filters.onSale ? saleClause() : {},
    inStock: filters.inStock ? { stock: { $gt: 0 } } : {},
  };

  const fullFilter: ProductFilter = {
    ...base,
    ...clauses.brand,
    ...clauses.category,
    ...clauses.onSale,
    ...clauses.inStock,
  };

  // each facet is counted with the other filters applied but not its own,
  // otherwise ticking one brand would show every other brand as zero
  const brandFacetFilter = {
    ...base,
    ...clauses.category,
    ...clauses.onSale,
    ...clauses.inStock,
  };
  const categoryFacetFilter = {
    ...base,
    ...clauses.brand,
    ...clauses.onSale,
    ...clauses.inStock,
  };

  const [
    docs,
    total,
    scopeTotal,
    brandCounts,
    categoryCounts,
    onSaleCount,
    inStockCount,
  ] = await Promise.all([
    Product.find(fullFilter)
      .select(CARD_FIELDS)
      .sort(sortFor(sort))
      .limit(take)
      .lean() as unknown as Promise<LeanProduct[]>,
    Product.countDocuments(fullFilter),
    Product.countDocuments(base),
    Product.aggregate<{ _id: unknown; count: number }>([
      { $match: brandFacetFilter },
      { $group: { _id: "$brandId", count: { $sum: 1 } } },
    ]),
    Product.aggregate<{ _id: unknown; count: number }>([
      { $match: categoryFacetFilter },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
    Product.countDocuments({
      ...base,
      ...clauses.brand,
      ...clauses.category,
      ...clauses.inStock,
      ...saleClause(),
    }),
    Product.countDocuments({
      ...base,
      ...clauses.brand,
      ...clauses.category,
      ...clauses.onSale,
      stock: { $gt: 0 },
    }),
  ]);

  const brandMap = await brandMapFor(docs);
  let products = docs.map((p) => toCard(p, brandMap));
  if (sort === "discount") products = [...products].sort(byDiscount);

  const brandCountBy = new Map(
    brandCounts.filter((r) => r._id).map((r) => [String(r._id), r.count]),
  );
  const categoryCountBy = new Map(
    categoryCounts.filter((r) => r._id).map((r) => [String(r._id), r.count]),
  );

  return {
    products,
    total,
    scopeTotal,
    facets: {
      // a facet with nothing behind it is noise, so empty options are dropped
      brands: allBrands
        .map((b) => ({
          slug: b.slug,
          name: b.name,
          count: brandCountBy.get(b._id.toString()) ?? 0,
        }))
        .filter((b) => b.count > 0),
      categories: allCategories
        .map((c) => ({
          slug: c.slug,
          name: c.name,
          count: categoryCountBy.get(c._id.toString()) ?? 0,
        }))
        .filter((c) => c.count > 0),
      onSale: onSaleCount,
      inStock: inStockCount,
    },
  };
}

/** Category meta plus the ids a listing on that page should cover — the
 *  category itself and its direct children, so "Skincare" is not empty just
 *  because every product sits on a leaf. */
export async function getCategoryScope(slug: string) {
  await connectDb();

  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) return null;

  const [children, parent] = await Promise.all([
    Category.find({ parentId: category._id, isActive: true })
      .select("name slug")
      .sort({ position: 1 })
      .lean(),
    category.parentId
      ? Category.findById(category.parentId).select("name slug").lean()
      : null,
  ]);

  return {
    category: {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      metaTitle: category.metaTitle ?? null,
      metaDescription: category.metaDescription ?? null,
      parent: parent ? { name: parent.name, slug: parent.slug } : null,
      children: children.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
      })),
    },
    categoryIds: [category._id, ...children.map((c) => c._id)],
  };
}

/** Brand meta for a brand listing page. */
export async function getBrandScope(slug: string) {
  await connectDb();

  const brand = await Brand.findOne({ slug, isActive: true }).lean();
  if (!brand) return null;

  return {
    brand: {
      id: brand._id.toString(),
      name: brand.name,
      slug: brand.slug,
      description: brand.description ?? null,
      countryOfOrigin: brand.countryOfOrigin ?? null,
      metaTitle: brand.metaTitle ?? null,
      metaDescription: brand.metaDescription ?? null,
    },
    brandId: brand._id,
  };
}

/** Slugs + timestamps for sitemap.ts. Deliberately minimal: this runs on a
 *  route search engines hit, not a customer. */
export async function getSitemapEntries() {
  await connectDb();

  const [products, categories, brands] = await Promise.all([
    Product.find({ isActive: true })
      .select("slug updatedAt")
      .sort({ updatedAt: -1 })
      .lean(),
    Category.find({ isActive: true }).select("slug updatedAt").lean(),
    Brand.find({ isActive: true }).select("slug updatedAt").lean(),
  ]);

  return {
    products: products.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })),
    categories: categories.map((c) => ({
      slug: c.slug,
      updatedAt: c.updatedAt,
    })),
    brands: brands.map((b) => ({ slug: b.slug, updatedAt: b.updatedAt })),
  };
}

/** Active banners whose schedule window is open right now. */
export async function getActiveBanners() {
  await connectDb();

  const now = new Date();

  const banners = await Banner.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  })
    .sort({ position: 1 })
    .lean();

  return banners.map((banner) => ({
    id: banner._id.toString(),
    title: banner.title,
    subtitle: banner.subtitle ?? null,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl ?? null,
    ctaLabel: banner.ctaLabel ?? null,
  }));
}

/** Anything currently marked down — drives the Hot Deals page. */
export function getDiscountedProducts(take = 48) {
  return findCards(
    { isActive: true, comparePrice: { $ne: null, $gt: 0 } },
    "newest",
    take,
  );
}

export function getFeaturedProducts(take = 4) {
  return findCards({ isActive: true, isFeatured: true }, "newest", take);
}

/**
 * /shop reads ?sort=, which makes the route dynamic — it cannot be
 * prerendered. Caching the query itself means those requests still avoid a
 * round trip to Atlas in Singapore, which is the part that actually hurts.
 * Keyed by sort so each ordering caches separately.
 */
const getProductsCached = unstable_cache(
  async (sort: ProductSort, take: number) =>
    findCards({ isActive: true }, sort, take),
  ["shop-products"],
  { revalidate: 3600, tags: ["products"] },
);

export function getProducts({
  sort = "newest",
  take = 48,
}: { sort?: ProductSort; take?: number } = {}) {
  return getProductsCached(sort, take);
}

export async function getProductBySlug(slug: string) {
  await connectDb();

  const product = await Product.findOne({ slug, isActive: true }).lean();
  if (!product) return null;

  const [brand, category] = await Promise.all([
    product.brandId
      ? Brand.findById(product.brandId).select("name slug").lean()
      : null,
    product.categoryId
      ? Category.findById(product.categoryId)
          .select("name slug parentId")
          .lean()
      : null,
  ]);

  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription ?? null,
    description: product.description ?? null,
    ingredients: product.ingredients ?? null,
    howToUse: product.howToUse ?? null,
    price: product.price,
    comparePrice: product.comparePrice ?? null,
    sku: product.sku ?? null,
    stock: product.stock,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    metaTitle: product.metaTitle ?? null,
    metaDescription: product.metaDescription ?? null,
    categoryId: product.categoryId?.toString() ?? null,
    brand: brand ? { name: brand.name, slug: brand.slug } : null,
    category: category
      ? {
          name: category.name,
          slug: category.slug,
          parentId: category.parentId?.toString() ?? null,
        }
      : null,
    images: [...product.images]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ id: i._id.toString(), url: i.url, alt: i.alt ?? null })),
    variants: [...product.variants]
      .sort((a, b) => a.position - b.position)
      .map((v) => ({
        id: v._id.toString(),
        name: v.name,
        price: v.price ?? null,
        stock: v.stock,
      })),
  };
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
    ? await findCards(
        { isActive: true, _id: { $ne: productId }, categoryId },
        "popular",
        take,
      )
    : [];

  if (sameCategory.length >= take) return sameCategory;

  const excludeIds = [productId, ...sameCategory.map((p) => p.id)];

  await connectDb();

  const fallbackDocs = (await Product.find({
    isActive: true,
    _id: { $nin: excludeIds },
  })
    .select(CARD_FIELDS)
    .sort({ isFeatured: -1, ratingCount: -1 })
    .limit(take - sameCategory.length)
    .lean()) as unknown as LeanProduct[];

  const brands = await brandMapFor(fallbackDocs);

  return [...sameCategory, ...fallbackDocs.map((p) => toCard(p, brands))];
}

/** Products in a category *and* its direct children, so "Skincare" is not
 *  empty just because every product sits on a leaf category. */
export const getCategoryWithProducts = unstable_cache(
  categoryWithProducts,
  ["category-products"],
  { revalidate: 3600, tags: ["products"] },
);

async function categoryWithProducts(
  slug: string,
  sort: ProductSort = "newest",
) {
  await connectDb();

  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) return null;

  const [children, parent] = await Promise.all([
    Category.find({ parentId: category._id, isActive: true })
      .select("name slug")
      .sort({ position: 1 })
      .lean(),
    category.parentId
      ? Category.findById(category.parentId).select("name slug").lean()
      : null,
  ]);

  const categoryIds = [category._id, ...children.map((c) => c._id)];

  const products = await findCards(
    { isActive: true, categoryId: { $in: categoryIds } },
    sort,
  );

  return {
    category: {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      metaTitle: category.metaTitle ?? null,
      metaDescription: category.metaDescription ?? null,
      parent: parent ? { name: parent.name, slug: parent.slug } : null,
      children: children.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
      })),
    },
    products,
  };
}

export const getBrandWithProducts = unstable_cache(
  brandWithProducts,
  ["brand-products"],
  { revalidate: 3600, tags: ["products"] },
);

async function brandWithProducts(
  slug: string,
  sort: ProductSort = "newest",
) {
  await connectDb();

  const brand = await Brand.findOne({ slug, isActive: true }).lean();
  if (!brand) return null;

  const products = await findCards({ isActive: true, brandId: brand._id }, sort);

  return {
    brand: {
      id: brand._id.toString(),
      name: brand.name,
      slug: brand.slug,
      description: brand.description ?? null,
      countryOfOrigin: brand.countryOfOrigin ?? null,
      metaTitle: brand.metaTitle ?? null,
      metaDescription: brand.metaDescription ?? null,
    },
    products,
  };
}

/** Product counts per category, in one aggregation rather than N queries. */
async function productCountsByCategory() {
  const rows = await Product.aggregate<{ _id: unknown; count: number }>([
    { $match: { isActive: true } },
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);

  return new Map(
    rows.filter((r) => r._id).map((r) => [String(r._id), r.count]),
  );
}

export async function getCategoryTree() {
  await connectDb();

  const [parents, counts] = await Promise.all([
    Category.find({ isActive: true, parentId: null })
      .sort({ position: 1 })
      .lean(),
    productCountsByCategory(),
  ]);

  const children = await Category.find({
    isActive: true,
    parentId: { $in: parents.map((p) => p._id) },
  })
    .sort({ position: 1 })
    .lean();

  return parents.map((parent) => ({
    id: parent._id.toString(),
    name: parent.name,
    slug: parent.slug,
    children: children
      .filter((c) => c.parentId?.toString() === parent._id.toString())
      .map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl ?? null,
        _count: { products: counts.get(c._id.toString()) ?? 0 },
      })),
  }));
}

export async function getBrands() {
  await connectDb();

  const [brands, rows] = await Promise.all([
    Brand.find({ isActive: true }).sort({ name: 1 }).lean(),
    Product.aggregate<{ _id: unknown; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: "$brandId", count: { $sum: 1 } } },
    ]),
  ]);

  const counts = new Map(
    rows.filter((r) => r._id).map((r) => [String(r._id), r.count]),
  );

  return brands.map((brand) => ({
    id: brand._id.toString(),
    name: brand.name,
    slug: brand.slug,
    description: brand.description ?? null,
    _count: { products: counts.get(brand._id.toString()) ?? 0 },
  }));
}

export async function getDeliveryZones() {
  await connectDb();

  const zones = await DeliveryZone.find({ isActive: true })
    .sort({ position: 1 })
    .lean();

  return zones.map((zone) => ({
    id: zone._id.toString(),
    name: zone.name,
    slug: zone.slug,
    charge: zone.charge,
    freeShippingThreshold: zone.freeShippingThreshold ?? null,
    minDays: zone.minDays,
    maxDays: zone.maxDays,
  }));
}
