/**
 * Give every product a SKU, following the scheme the catalogue already uses.
 *
 *   npm run sku:backfill -- --dry-run     # report only, writes nothing
 *   npm run sku:backfill                  # assign them
 *
 * The scheme is read out of the data rather than hard-coded: existing SKUs
 * look like `KH-AMP-002`, so the script groups the SKUs already in the
 * database by their middle code, works out which code each category uses, and
 * continues that code's numbering. A catalogue that renames its codes stays
 * consistent without anyone editing this file.
 *
 * Only products with no SKU are touched. Re-running it is a no-op, which
 * matters because it is the natural thing to run after every catalogue import.
 *
 * A category nobody has coded yet — a newly imported one — gets a code derived
 * from its name, checked against the codes already in use so two categories
 * can never share one.
 */
import "dotenv/config";

import mongoose from "mongoose";

import { deriveCode, dominantCode, nextSku, parseSku } from "../src/lib/sku";
import { Category, Product } from "../src/server/models";

const FALLBACK_PREFIX = "KH";
const FALLBACK_WIDTH = 3;

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  await mongoose.connect(uri);

  try {
    const [products, categories] = await Promise.all([
      Product.find({})
        .select("slug name sku categoryId")
        .sort({ createdAt: 1 })
        .lean(),
      Category.find({}).select("name").lean(),
    ]);

    const categoryName = new Map(
      categories.map((category) => [category._id.toString(), category.name]),
    );

    // ---------------------------------------------------- learn the scheme
    const parsedByCategory = new Map<string, string[]>();
    const highestByCode = new Map<string, number>();
    const usedSkus = new Set<string>();

    let prefix = FALLBACK_PREFIX;
    let width = FALLBACK_WIDTH;
    let malformed = 0;

    for (const product of products) {
      const sku = product.sku?.trim();
      if (!sku) continue;

      usedSkus.add(sku.toUpperCase());

      const parsed = parseSku(sku);
      if (!parsed) {
        malformed += 1;
        continue;
      }

      prefix = parsed.prefix;
      width = parsed.width;

      highestByCode.set(
        parsed.code,
        Math.max(highestByCode.get(parsed.code) ?? 0, parsed.number),
      );

      const key = product.categoryId?.toString();
      if (key) {
        const list = parsedByCategory.get(key) ?? [];
        list.push(parsed.code);
        parsedByCategory.set(key, list);
      }
    }

    const codeByCategory = new Map<string, string>();
    const takenCodes = new Set(highestByCode.keys());

    for (const [key, codes] of parsedByCategory) {
      const code = dominantCode(codes);
      if (code) codeByCategory.set(key, code);
    }

    const missing = products.filter((product) => !product.sku?.trim());

    console.log(`\n  products              ${products.length}`);
    console.log(`  already have a SKU    ${products.length - missing.length}`);
    console.log(`  missing a SKU         ${missing.length}`);
    console.log(`  known category codes  ${takenCodes.size}`);
    if (malformed > 0) {
      console.log(`  unparseable SKUs      ${malformed} (left alone)`);
    }

    if (missing.length === 0) {
      console.log("\n  Nothing to do — every product already has a SKU.\n");
      return;
    }

    // ---------------------------------------------------------- assign
    const assignments: { slug: string; name: string; sku: string }[] = [];
    const newCodes: string[] = [];

    for (const product of missing) {
      const key = product.categoryId?.toString() ?? "";
      let code = codeByCategory.get(key);

      if (!code) {
        const name = categoryName.get(key) ?? "General";
        code = deriveCode(name, takenCodes);
        takenCodes.add(code);
        codeByCategory.set(key, code);
        newCodes.push(`${code}  ${name}`);
      }

      const { sku, number } = nextSku({
        prefix,
        code,
        width,
        highest: highestByCode.get(code) ?? 0,
        used: usedSkus,
      });

      highestByCode.set(code, number);
      usedSkus.add(sku);
      assignments.push({ slug: product.slug, name: product.name, sku });
    }

    if (newCodes.length > 0) {
      console.log(`\n  new category codes:\n    ${newCodes.join("\n    ")}`);
    }

    console.log(`\n  ${dryRun ? "would assign" : "assigning"} ${assignments.length} SKU(s):`);
    for (const row of assignments.slice(0, 15)) {
      console.log(`    ${row.sku.padEnd(14)} ${row.name.slice(0, 62)}`);
    }
    if (assignments.length > 15) {
      console.log(`    … and ${assignments.length - 15} more`);
    }

    if (dryRun) {
      console.log("\n  Dry run — nothing was written.\n");
      return;
    }

    const result = await Product.bulkWrite(
      assignments.map((row) => ({
        updateOne: {
          // Guarded on sku still being empty: if something else assigned one
          // between the read and the write, that value wins rather than being
          // overwritten by a number computed from stale data.
          filter: { slug: row.slug, $or: [{ sku: null }, { sku: "" }] },
          update: { $set: { sku: row.sku } },
        },
      })),
      { ordered: false },
    );

    console.log(`\n  wrote ${result.modifiedCount} SKU(s).\n`);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((error: unknown) => {
  console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
