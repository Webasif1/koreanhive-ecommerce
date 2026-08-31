import "server-only";

import type { ImportLookups } from "@/lib/import/types";
import { requireAdmin } from "@/server/admin-guard";
import { connectDb } from "@/server/db";
import { Brand, Category, Product } from "@/server/models";

/**
 * Everything the pure validator needs to know about the database, read once
 * per import rather than per row.
 *
 * Brands and categories are keyed by both name and slug, lowercased, so a
 * sheet can say "Beauty of Joseon" or "beauty-of-joseon" and either resolves.
 */
export async function getImportLookups(): Promise<ImportLookups> {
  await requireAdmin();
  await connectDb();

  const [brands, categories, products] = await Promise.all([
    Brand.find({}).select("name slug").lean(),
    Category.find({}).select("name slug").lean(),
    // Only the fields the preview diffs against. The descriptions are here
    // because they are diffed: comparing on "the column was present" instead
    // marked every row as changed and rewrote the whole catalogue each run.
    // If this projection ever becomes the memory problem the catalogue is
    // large enough to need a stored digest, not a smaller comparison.
    Product.find({})
      .select(
        "slug name price stock brandId categoryId images " +
          "shortDescription description ingredients howToUse",
      )
      .lean(),
  ]);

  const brandIds = new Map<string, string>();
  for (const brand of brands) {
    const id = brand._id.toString();
    brandIds.set(brand.name.toLowerCase(), id);
    brandIds.set(brand.slug.toLowerCase(), id);
  }

  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    const id = category._id.toString();
    categoryIds.set(category.name.toLowerCase(), id);
    categoryIds.set(category.slug.toLowerCase(), id);
  }

  const existing = new Map(
    products.map((product) => [
      product.slug,
      {
        slug: product.slug,
        name: product.name,
        price: product.price,
        stock: product.stock,
        brandId: product.brandId?.toString() ?? null,
        categoryId: product.categoryId?.toString() ?? null,
        imageUrls: [...(product.images ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((image) => image.url),
        text: {
          shortDescription: product.shortDescription ?? null,
          description: product.description ?? null,
          ingredients: product.ingredients ?? null,
          howToUse: product.howToUse ?? null,
        },
      },
    ]),
  );

  return { brandIds, categoryIds, existing };
}
