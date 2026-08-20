import "server-only";

import { unstable_cache } from "next/cache";

import { PRODUCT_KNOWLEDGE } from "@/data/chatbot/knowledge";
import type { ChatCatalogItem, PolicyFacts } from "@/lib/chatbot/types";
import { connectDb } from "@/server/db";
import { Brand, Category, Product } from "@/server/models";
import { getDeliveryZones } from "@/server/queries/catalog";

/**
 * The advisor's window onto the database — and the only one it gets.
 *
 * Nothing under lib/chatbot imports mongoose or this module's dependencies;
 * the engine receives an array and returns a response. That is the isolation
 * boundary the feature is built around:
 *
 *   - the projection below is a fixed whitelist, so adding a field to Product
 *     does not silently widen what a public chat endpoint can reveal;
 *   - there is no filter parameter, so no bug in intent detection can be
 *     turned into a query against users, orders or passwordHash;
 *   - `stock` is collapsed to a boolean, so nobody can poll the endpoint to
 *     read inventory depth.
 *
 * Price and stock come from the live catalogue rather than a snapshot, so the
 * bot cannot quote yesterday's price. The editorial half — what a product is
 * *for* — comes from data/chatbot/knowledge.ts and is joined here by slug.
 */

const CHAT_FIELDS =
  "name slug price comparePrice stock ratingAvg ratingCount shortDescription ingredients howToUse brandId categoryId images";

async function chatCatalog(): Promise<ChatCatalogItem[]> {
  await connectDb();

  const products = await Product.find({ isActive: true })
    .select(CHAT_FIELDS)
    .sort({ _id: 1 })
    .lean();

  // two small lookups rather than a populate per product — the collections are
  // in the low tens of rows and this runs once an hour behind the cache
  const [brands, categories] = await Promise.all([
    Brand.find({}).select("name slug").lean(),
    Category.find({}).select("name slug").lean(),
  ]);

  const brandNames = new Map(brands.map((b) => [b._id.toString(), b.name]));
  const categoryRows = new Map(
    categories.map((c) => [c._id.toString(), { name: c.name, slug: c.slug }]),
  );

  return products.map((product): ChatCatalogItem => {
    const category = product.categoryId
      ? (categoryRows.get(product.categoryId.toString()) ?? null)
      : null;

    const image = [...(product.images ?? [])].sort(
      (a, b) => a.position - b.position,
    )[0];

    return {
      slug: product.slug,
      name: product.name,
      brand: product.brandId ? (brandNames.get(product.brandId.toString()) ?? null) : null,
      categorySlug: category?.slug ?? null,
      categoryName: category?.name ?? null,
      price: product.price,
      comparePrice: product.comparePrice ?? null,
      // a boolean, never the count
      inStock: product.stock > 0,
      ratingAvg: product.ratingAvg,
      ratingCount: product.ratingCount,
      imageUrl: image?.url ?? null,
      benefit: product.shortDescription ?? null,
      ingredients: product.ingredients ?? null,
      howToUse: product.howToUse ?? null,
      knowledge: PRODUCT_KNOWLEDGE[product.slug] ?? null,
    };
  });
}

/**
 * Cached because every message re-reads the whole catalogue, and the catalogue
 * changes when an admin edits a product — not when a shopper types. Tagged
 * "products" alongside the other catalogue caches, so an admin edit clears all
 * of them at once.
 */
const getChatCatalogCached = unstable_cache(chatCatalog, ["chat-catalog"], {
  revalidate: 3600,
  tags: ["products"],
});

export function getChatCatalog(): Promise<ChatCatalogItem[]> {
  return getChatCatalogCached();
}

async function policyFacts(): Promise<PolicyFacts> {
  const zones = await getDeliveryZones();

  // deliberately the same rows checkout charges from, so a delivery answer in
  // chat can never disagree with the cart or the /shipping page
  return {
    zones: zones.map((zone) => ({
      name: zone.name,
      charge: zone.charge,
      freeShippingThreshold: zone.freeShippingThreshold,
      minDays: zone.minDays,
      maxDays: zone.maxDays,
    })),
  };
}

const getPolicyFactsCached = unstable_cache(policyFacts, ["chat-policy"], {
  revalidate: 3600,
  tags: ["delivery-zones"],
});

export function getPolicyFacts(): Promise<PolicyFacts> {
  return getPolicyFactsCached();
}
