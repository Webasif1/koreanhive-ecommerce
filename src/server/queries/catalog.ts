import "server-only";

import { unstable_cache } from "next/cache";
import type { QueryFilter } from "mongoose";

import { PER_PAGE } from "@/lib/listing-params";
import { connectDb } from "@/server/db";
import {
  Banner,
  Brand,
  Category,
  Combo,
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

/**
 * The trailing `_id` is not decoration. Every one of these fields has ties —
 * dozens of products share a price, and ratingCount repeats — and MongoDB does
 * not guarantee a stable order between tied documents. Under skip/limit that
 * lets the same product appear on two pages while another never appears at
 * all. `_id` is unique, so it makes the total order deterministic.
 */
function sortFor(sort: ProductSort): Record<string, 1 | -1> {
  switch (sort) {
    case "price-asc":
      return { price: 1, _id: -1 };
    case "price-desc":
      return { price: -1, _id: -1 };
    case "popular":
      return { ratingCount: -1, _id: -1 };
    // "discount" is a computed ratio, sorted by aggregation in findPage()
    default:
      return { createdAt: -1, _id: -1 };
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
  inCombo?: boolean;
  /** 4.5 or 4.0 — "and above" */
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
};

export type CatalogListing = {
  products: ProductCardData[];
  total: number;
  scopeTotal: number;
  /** 1-based, already clamped to at least 1 by parseListingParams */
  page: number;
  perPage: number;
  /** at least 1, so an empty result still renders a single (empty) page */
  totalPages: number;
  facets: {
    categories: FacetOption[];
    brands: FacetOption[];
    onSale: number;
    inStock: number;
    inCombo: number;
    /** "4.5 and above" / "4.0 and above" */
    rating: { value: number; count: number }[];
    /** cheapest and dearest in scope, so the slider knows its ends */
    priceBounds: { min: number; max: number };
  };
};

/**
 * One page of cards.
 *
 * "discount" is a ratio rather than a stored field, so it is computed by the
 * aggregation instead of after the fetch. Sorting in memory would only order
 * the rows already fetched, which is fine for a single capped list but wrong
 * the moment there is a page 2 — the biggest discounts on page 2 would be
 * whatever happened to land in that slice, not the next-biggest overall.
 */
async function findPage(
  filter: ProductFilter,
  sort: ProductSort,
  skip: number,
  limit: number,
) {
  if (sort !== "discount") {
    return Product.find(filter)
      .select(CARD_FIELDS)
      .sort(sortFor(sort))
      .skip(skip)
      .limit(limit)
      .lean() as unknown as Promise<LeanProduct[]>;
  }

  return Product.aggregate<LeanProduct>([
    { $match: filter },
    {
      $addFields: {
        discountRatio: {
          $cond: [
            { $gt: ["$comparePrice", "$price"] },
            {
              $divide: [
                { $subtract: ["$comparePrice", "$price"] },
                "$comparePrice",
              ],
            },
            0,
          ],
        },
      },
    },
    { $sort: { discountRatio: -1, _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: Object.fromEntries(CARD_FIELDS.split(" ").map((f) => [f, 1])) },
  ]);
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
  page = 1,
  perPage = PER_PAGE,
}: {
  scope?: ProductFilter;
  filters?: CatalogFilters;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
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

  // membership comes from the combos themselves, so a product is "in a combo"
  // exactly when some active bundle lists it
  const activeCombos = await Combo.find({ isActive: true })
    .select("productSlugs")
    .lean();
  const comboSlugs = [
    ...new Set(activeCombos.flatMap((combo) => combo.productSlugs)),
  ];

  const priceClause = () => {
    const range: Record<string, number> = {};
    if (typeof filters.minPrice === "number") range.$gte = filters.minPrice;
    if (typeof filters.maxPrice === "number") range.$lte = filters.maxPrice;
    return Object.keys(range).length ? { price: range } : {};
  };

  const clauses = {
    brand: selectedBrandIds.length ? { brandId: { $in: selectedBrandIds } } : {},
    category: selectedCategoryIds.length
      ? { categoryId: { $in: selectedCategoryIds } }
      : {},
    onSale: filters.onSale ? saleClause() : {},
    inStock: filters.inStock ? { stock: { $gt: 0 } } : {},
    inCombo: filters.inCombo ? { slug: { $in: comboSlugs } } : {},
    rating: filters.minRating
      ? { ratingAvg: { $gte: filters.minRating } }
      : {},
    price: priceClause(),
  };

  const fullFilter: ProductFilter = {
    ...base,
    ...clauses.brand,
    ...clauses.category,
    ...clauses.onSale,
    ...clauses.inStock,
    ...clauses.inCombo,
    ...clauses.rating,
    ...clauses.price,
  };

  /** Everything except the named dimension, so a facet never zeroes itself. */
  const without = (skip: keyof typeof clauses) =>
    Object.entries(clauses).reduce<ProductFilter>(
      (acc, [key, clause]) =>
        key === skip ? acc : { ...acc, ...(clause as object) },
      { ...base },
    );

  const brandFacetFilter = without("brand");
  const categoryFacetFilter = without("category");

  const [
    docs,
    total,
    scopeTotal,
    brandCounts,
    categoryCounts,
    onSaleCount,
    inStockCount,
    inComboCount,
    rating45Count,
    rating40Count,
    priceRange,
  ] = await Promise.all([
    findPage(fullFilter, sort, (page - 1) * perPage, perPage),
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
    Product.countDocuments({ ...without("onSale"), ...saleClause() }),
    Product.countDocuments({ ...without("inStock"), stock: { $gt: 0 } }),
    Product.countDocuments({
      ...without("inCombo"),
      slug: { $in: comboSlugs },
    }),
    Product.countDocuments({
      ...without("rating"),
      ratingAvg: { $gte: 4.5 },
    }),
    Product.countDocuments({
      ...without("rating"),
      ratingAvg: { $gte: 4.0 },
    }),
    // bounds ignore the current price selection, so dragging the slider
    // cannot shrink the track out from under the handles
    Product.aggregate<{ min: number; max: number }>([
      { $match: without("price") },
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
    ]),
  ]);

  const brandMap = await brandMapFor(docs);
  const products = docs.map((p) => toCard(p, brandMap));

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
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
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
      inCombo: inComboCount,
      rating: [
        { value: 4.5, count: rating45Count },
        { value: 4.0, count: rating40Count },
      ],
      priceBounds: {
        // round outwards to whole hundreds so the slider lands on tidy numbers
        min: Math.floor((priceRange[0]?.min ?? 0) / 100) * 100,
        max: Math.ceil((priceRange[0]?.max ?? 5000) / 100) * 100,
      },
    },
  };
}

// --------------------------------------------------------------- search

/** The query goes straight into $regex, so every metacharacter has to be
 *  neutralised. Without this, "." matches the whole catalogue and "[" throws. */
function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MAX_TERMS = 6;

/**
 * Turns what somebody typed into a product filter.
 *
 * Terms are ANDed, so "cosrx snail" means both words, not either — matching
 * what people expect from a search box. Each term is then ORed across the
 * fields worth searching, including brand and category names, so "anua" finds
 * Anua's products even though the brand is stored as a reference rather than
 * on the product itself.
 *
 * Returns null for a query with nothing usable in it, which the page treats as
 * "no search performed" rather than "no results".
 */
export async function buildSearchScope(
  q: string,
): Promise<ProductFilter | null> {
  const terms = q
    .trim()
    .split(/\s+/)
    // a single character matches almost everything, so it is not a search
    .filter((term) => term.length > 1)
    .slice(0, MAX_TERMS);

  if (terms.length === 0) return null;

  await connectDb();

  const clauses = await Promise.all(
    terms.map(async (term): Promise<ProductFilter> => {
      const rx = new RegExp(escapeRegex(term), "i");

      const [brands, categories] = await Promise.all([
        Brand.find({ name: rx, isActive: true }).select("_id").lean(),
        Category.find({ name: rx, isActive: true }).select("_id").lean(),
      ]);

      const or: ProductFilter[] = [
        { name: rx },
        { shortDescription: rx },
        { sku: rx },
        { slug: rx },
      ];

      if (brands.length > 0) {
        or.push({ brandId: { $in: brands.map((b) => b._id) } });
      }
      if (categories.length > 0) {
        or.push({ categoryId: { $in: categories.map((c) => c._id) } });
      }

      return { $or: or };
    }),
  );

  return clauses.length === 1 ? clauses[0] : { $and: clauses };
}

export type SearchSuggestion = {
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
};

async function searchSuggestions(
  q: string,
  take: number,
): Promise<SearchSuggestion[]> {
  const scope = await buildSearchScope(q);
  if (!scope) return [];

  // deliberately not CARD_FIELDS — a dropdown row shows a thumbnail, a name
  // and a price, and has no use for variants, stock or ratings
  const products = await Product.find({ isActive: true, ...scope })
    .select("name slug price images")
    .sort({ isFeatured: -1, ratingCount: -1, _id: -1 })
    .limit(take)
    .lean();

  return products.map((product) => ({
    name: product.name,
    slug: product.slug,
    price: product.price,
    imageUrl:
      [...(product.images ?? [])].sort((a, b) => a.position - b.position)[0]
        ?.url ?? null,
  }));
}

const getSearchSuggestionsCached = unstable_cache(
  searchSuggestions,
  ["search-suggestions"],
  { revalidate: 3600, tags: ["products"] },
);

/**
 * Typeahead rows for the header box.
 *
 * Runs off buildSearchScope so the dropdown and /search can never disagree
 * about what matches. Cached because this is the only query in the app that
 * fires on a keystroke — without it, every shopper typing "serum" one letter
 * at a time would be four round trips to Atlas.
 */
export function getSearchSuggestions(q: string, take = 6) {
  return getSearchSuggestionsCached(q.trim().toLowerCase(), take);
}

/** Active bundles with their member products resolved, for /combos. */
export async function getCombos() {
  await connectDb();

  const combos = await Combo.find({ isActive: true })
    .sort({ position: 1 })
    .lean();

  const slugs = [...new Set(combos.flatMap((c) => c.productSlugs))];

  const products = await Product.find({ slug: { $in: slugs }, isActive: true })
    .select("name slug price images")
    .lean();

  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return combos.map((combo) => ({
    id: combo._id.toString(),
    name: combo.name,
    slug: combo.slug,
    description: combo.description ?? null,
    concern: combo.concern ?? null,
    price: combo.price,
    comparePrice: combo.comparePrice ?? null,
    // a member whose product was removed simply drops out
    products: combo.productSlugs.flatMap((slug) => {
      const product = bySlug.get(slug);
      if (!product) return [];

      const image = [...(product.images ?? [])].sort(
        (a, b) => a.position - b.position,
      )[0];

      return [
        {
          name: product.name,
          slug: product.slug,
          price: product.price,
          imageUrl: image?.url ?? null,
        },
      ];
    }),
  }));
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

/**
 * Suggestions for a whole cart rather than a single product.
 *
 * Relatedness comes from the categories the cart already covers, which is what
 * getRelatedProducts treats as related on the product page — keeping the two
 * surfaces consistent. Anything already in the cart is excluded, so the strip
 * never offers something the shopper has picked.
 */
async function cartRecommendations(productIds: string[], take = 4) {
  if (productIds.length === 0) return [];

  await connectDb();

  // getCart selects only the fields a cart line renders, so the categories
  // have to be looked up rather than read off the lines
  const inCart = await Product.find({ _id: { $in: productIds } })
    .select("categoryId")
    .lean();

  const categoryIds = [
    ...new Set(
      inCart.flatMap((p) => (p.categoryId ? [p.categoryId.toString()] : [])),
    ),
  ];

  const sameCategory =
    categoryIds.length > 0
      ? await findCards(
          {
            isActive: true,
            categoryId: { $in: categoryIds },
            _id: { $nin: productIds },
          },
          "popular",
          take,
        )
      : [];

  if (sameCategory.length >= take) return sameCategory;

  // a cart holding the only product in its category would otherwise render a
  // half-empty row, so top up from the wider catalogue
  const excludeIds = [...productIds, ...sameCategory.map((p) => p.id)];

  const fallbackDocs = (await Product.find({
    isActive: true,
    _id: { $nin: excludeIds },
  })
    .select(CARD_FIELDS)
    .sort({ isFeatured: -1, ratingCount: -1, _id: -1 })
    .limit(take - sameCategory.length)
    .lean()) as unknown as LeanProduct[];

  const brands = await brandMapFor(fallbackDocs);

  return [...sameCategory, ...fallbackDocs.map((p) => toCard(p, brands))];
}

/** Keyed by the cart's contents, so two shoppers with the same bag share the
 *  result. Ids are plain strings, so they serialise into the cache key. */
const getCartRecommendationsCached = unstable_cache(
  cartRecommendations,
  ["cart-recommendations"],
  { revalidate: 3600, tags: ["products"] },
);

export function getCartRecommendations(productIds: string[], take = 4) {
  // sorted so the same cart in a different order is the same cache entry
  return getCartRecommendationsCached([...productIds].sort(), take);
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
