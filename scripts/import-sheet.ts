/**
 * Load the real catalogue from the Google Sheet.
 *
 *   npm run catalogue:sync
 *
 * The sheet is the source of truth. This script fetches it, makes sure every
 * brand and category it mentions exists, then runs the rows through the same
 * validator the admin import screen uses (src/lib/import) so the two can never
 * disagree about what a valid row is.
 *
 * Safe to re-run: products are matched on slug and updated in place. Rows that
 * already match are skipped rather than rewritten, so re-syncing does not churn
 * `updatedAt` across the catalogue — the sitemap sorts on that field.
 *
 * It never deletes. A product that disappears from the sheet stays in the
 * database, because silently unpublishing stock over a spreadsheet edit is not
 * a safe default.
 *
 *   npm run catalogue:sync -- --fresh
 *
 * `--fresh` first drops every product, brand, category and combo, for the one
 * case that genuinely needs it: replacing a demo catalogue with the real one.
 * Orders are untouched — an order item carries its own name and price snapshot,
 * so deleting a product never rewrites what a customer was charged.
 */
import "dotenv/config";

import mongoose, { Types } from "mongoose";

import { buildPreview, readRows } from "../src/lib/import/parse";
import type { ImportLookups, ProductFields } from "../src/lib/import/types";
import { fetchSheetCsv } from "../src/lib/google-sheet";
import { slugify } from "../src/lib/slugify";
import { Brand, Category, Combo, Product } from "../src/server/models";

/** Columns read directly here rather than through the validator, because they
 *  describe the taxonomy rather than a product field. */
const BRAND_COLUMN = "Brand";
const CATEGORY_COLUMN = "Category";
const COUNTRY_COLUMN = "Country of Origin";

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

/** Minimal RFC 4180 reader, used only for the taxonomy pass. Product rows go
 *  through the shared parser instead. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((cell) => cell.trim() !== ""));
}

async function main() {
  const source = process.env.SHEET_CSV_URL;
  if (!source) fail("Set SHEET_CSV_URL in .env — see .env.example.");

  const uri = process.env.MONGODB_URI;
  if (!uri) fail("Set MONGODB_URI in .env first.");

  console.log("Fetching the catalogue sheet…");

  const fetched = await fetchSheetCsv(source);
  if ("error" in fetched) fail(fetched.error);

  const { text } = fetched;
  const table = parseCsv(text);

  if (table.length < 2) fail("The sheet has no data rows.");

  const header = table[0].map((cell) => cell.trim());
  const body = table.slice(1);
  const columnAt = (name: string) => header.indexOf(name);
  const cell = (row: string[], name: string) =>
    (row[columnAt(name)] ?? "").trim();

  console.log(`  ${body.length} rows, ${header.length} columns`);

  await mongoose.connect(uri);

  if (process.argv.includes("--fresh")) {
    const before = await Product.countDocuments({});
    console.log(`  --fresh: dropping ${before} existing products and taxonomy`);

    await Promise.all([
      Product.deleteMany({}),
      Brand.deleteMany({}),
      Category.deleteMany({}),
      Combo.deleteMany({}),
    ]);
  }

  // ---------------------------------------------------------- taxonomy
  // The validator rejects an unknown brand rather than inventing one, so the
  // taxonomy has to exist before the product rows are read.

  const brandNames = [
    ...new Map(
      body
        .map((row) => cell(row, BRAND_COLUMN))
        .filter(Boolean)
        .map((name) => [name.toLowerCase(), name] as const),
    ).values(),
  ];

  const categoryNames = [
    ...new Map(
      body
        .map((row) => cell(row, CATEGORY_COLUMN))
        .filter(Boolean)
        .map((name) => [name.toLowerCase(), name] as const),
    ).values(),
  ];

  // the sheet records origin per product; a brand's origin is whatever its
  // products agree on, so take the first non-empty one
  const originByBrand = new Map<string, string>();
  for (const row of body) {
    const brand = cell(row, BRAND_COLUMN).toLowerCase();
    const origin = cell(row, COUNTRY_COLUMN);
    if (brand && origin && !originByBrand.has(brand)) {
      originByBrand.set(brand, origin);
    }
  }

  const brandWrites = brandNames.map((name) => ({
    updateOne: {
      filter: { slug: slugify(name) },
      update: {
        $set: {
          name,
          isActive: true,
          countryOfOrigin:
            originByBrand.get(name.toLowerCase()) ?? "South Korea",
        },
        $setOnInsert: { slug: slugify(name) },
      },
      upsert: true,
    },
  }));

  const categoryWrites = categoryNames.map((name, index) => ({
    updateOne: {
      filter: { slug: slugify(name) },
      update: {
        $set: { name, isActive: true, position: index },
        $setOnInsert: { slug: slugify(name) },
      },
      upsert: true,
    },
  }));

  await Brand.bulkWrite(brandWrites, { ordered: false });
  await Category.bulkWrite(categoryWrites, { ordered: false });

  console.log(
    `  brands: ${brandNames.length}   categories: ${categoryNames.length}`,
  );

  // ---------------------------------------------------------- lookups
  // Built here rather than through getImportLookups(), which calls
  // requireAdmin() — there is no session in a CLI script.

  const [brands, categories, products] = await Promise.all([
    Brand.find({}).select("name slug").lean(),
    Category.find({}).select("name slug").lean(),
    Product.find({})
      .select("slug name price stock brandId categoryId images")
      .lean(),
  ]);

  const brandIds = new Map<string, string>();
  for (const brand of brands) {
    brandIds.set(brand.name.toLowerCase(), brand._id.toString());
    brandIds.set(brand.slug.toLowerCase(), brand._id.toString());
  }

  const categoryIds = new Map<string, string>();
  for (const category of categories) {
    categoryIds.set(category.name.toLowerCase(), category._id.toString());
    categoryIds.set(category.slug.toLowerCase(), category._id.toString());
  }

  const lookups: ImportLookups = {
    brandIds,
    categoryIds,
    existing: new Map(
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
        },
      ]),
    ),
  };

  // ---------------------------------------------------------- products
  const { rows, error } = readRows(text, "csv");
  if (error) fail(error);

  const preview = buildPreview(rows, lookups);

  const writes = preview.rows.filter(
    (row): row is Extract<typeof row, { status: "create" | "update" }> =>
      row.status === "create" ||
      (row.status === "update" && row.changes.length > 0),
  );

  const operations = writes.map((row) => {
    const { brandId, categoryId, ...rest } = row.fields as Partial<
      ProductFields
    >;
    const set: Record<string, unknown> = { ...rest };

    if (brandId !== undefined) {
      set.brandId = brandId ? new Types.ObjectId(brandId) : null;
    }
    if (categoryId !== undefined) {
      set.categoryId = categoryId ? new Types.ObjectId(categoryId) : null;
    }

    return {
      updateOne: {
        filter: { slug: row.slug },
        update: { $set: set, $setOnInsert: { slug: row.slug } },
        upsert: true,
      },
    };
  });

  const written =
    operations.length > 0
      ? await Product.bulkWrite(operations, { ordered: false })
      : { upsertedCount: 0, modifiedCount: 0 };

  // A product with no photograph is real data worth keeping and not something
  // to put in front of a shopper, so it is imported unpublished.
  //
  // Decided from what actually landed rather than from the sheet's own slug
  // column: the importer slugifies slugs, so matching sheet text against
  // stored slugs quietly missed the rows whose slug was not already in
  // slugified form. Asking the database "which products have no images" cannot
  // drift that way.
  const hidden = await Product.updateMany(
    { images: { $size: 0 }, isActive: true },
    { $set: { isActive: false } },
  );

  if (hidden.modifiedCount > 0) {
    console.log(`  unpublished ${hidden.modifiedCount} products with no image`);
  }

  // ---------------------------------------------------------- report
  const [total, active, draft, noImages] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: false }),
    Product.countDocuments({ images: { $size: 0 } }),
  ]);

  const rejected = preview.rows.filter((row) => row.status === "error");

  console.log("\n  ── sync report ──────────────────────────────");
  console.log(`  sheet rows            ${body.length}`);
  console.log(`  rows rejected         ${rejected.length}`);
  console.log(`  created               ${written.upsertedCount ?? 0}`);
  console.log(`  updated               ${writes.length - (written.upsertedCount ?? 0)}`);
  console.log(`  unchanged             ${preview.counts.unchanged}`);
  console.log("  ─────────────────────────────────────────────");
  console.log(`  products in database  ${total}`);
  console.log(`    published           ${active}`);
  console.log(`    draft (no image)    ${draft}`);
  console.log(`  products with 0 images ${noImages}`);
  console.log(`  brands                ${await Brand.countDocuments({})}`);
  console.log(`  categories            ${await Category.countDocuments({})}`);
  console.log("  ─────────────────────────────────────────────\n");

  if (rejected.length > 0) {
    console.log("  Rejected rows (not imported):");
    for (const row of rejected.slice(0, 20)) {
      console.log(`    line ${row.line}: ${row.errors.join("; ")}`);
    }
    if (rejected.length > 20) {
      console.log(`    …and ${rejected.length - 20} more`);
    }
    console.log("");
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
