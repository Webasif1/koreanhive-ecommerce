/**
 * Read-only health check on the imported catalogue.
 *
 *   npm run catalogue:verify
 *
 * Answers the questions worth asking after a sync: did everything land, is
 * anything unsellable, and is any of it pointing at an image the storefront
 * cannot render. Writes nothing, so it is safe to run against production.
 *
 * Exits non-zero when it finds something that would break a page, which makes
 * it usable as a deployment gate.
 */
import "dotenv/config";

import mongoose from "mongoose";

import { ALLOWED_IMAGE_HOSTS } from "../src/lib/image-hosts";
import { Brand, Category, Product } from "../src/server/models";

type Check = { label: string; count: number; fatal: boolean };

function line(label: string, value: string | number) {
  console.log(`  ${label.padEnd(34)}${value}`);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  await mongoose.connect(uri);

  const [total, published, draft, brands, categories] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: false }),
    Brand.countDocuments({}),
    Category.countDocuments({}),
  ]);

  const [withImages, noImages, withVariant, rated, inStock] = await Promise.all([
    Product.countDocuments({ "images.0": { $exists: true } }),
    Product.countDocuments({ images: { $size: 0 } }),
    Product.countDocuments({ "variants.0": { $exists: true } }),
    Product.countDocuments({ ratingAvg: { $gt: 0 } }),
    Product.countDocuments({ stock: { $gt: 0 } }),
  ]);

  console.log("\n  ── catalogue ────────────────────────────────");
  line("products", total);
  line("  published", published);
  line("  draft", draft);
  line("brands", brands);
  line("categories", categories);
  line("with at least one image", withImages);
  line("without an image", noImages);
  line("with a variant", withVariant);
  line("with a rating", rated);
  line("in stock", inStock);

  // Anything below is a defect, not a statistic.
  const hostPattern = new RegExp(
    `^https://(${ALLOWED_IMAGE_HOSTS.map((host) =>
      host.replace(/\./g, "\\."),
    ).join("|")})/`,
  );

  const duplicateSlugs = await Product.aggregate<{ _id: string }>([
    { $group: { _id: "$slug", n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ]);

  const checks: Check[] = [
    {
      label: "duplicate slugs",
      count: duplicateSlugs.length,
      fatal: true,
    },
    {
      label: "published with no image",
      count: await Product.countDocuments({
        isActive: true,
        images: { $size: 0 },
      }),
      fatal: true,
    },
    {
      // next/image refuses a host outside remotePatterns, and it fails as a
      // blank box on a live product rather than as an error
      label: "images on a disallowed host",
      count: await Product.countDocuments({
        "images.0": { $exists: true },
        "images.url": { $not: hostPattern },
      }),
      fatal: true,
    },
    {
      label: "price missing or not positive",
      count: await Product.countDocuments({
        $or: [{ price: { $lte: 0 } }, { price: null }],
      }),
      fatal: true,
    },
    {
      // a compare price below the price renders as a negative discount
      label: "compare price below price",
      count: await Product.countDocuments({
        comparePrice: { $ne: null },
        $expr: { $lt: ["$comparePrice", "$price"] },
      }),
      fatal: true,
    },
    {
      label: "no brand",
      count: await Product.countDocuments({ brandId: null }),
      fatal: false,
    },
    {
      label: "no category",
      count: await Product.countDocuments({ categoryId: null }),
      fatal: false,
    },
    {
      label: "no SKU",
      count: await Product.countDocuments({
        $or: [{ sku: null }, { sku: "" }],
      }),
      fatal: false,
    },
  ];

  console.log("  ── checks ───────────────────────────────────");

  let failures = 0;

  for (const check of checks) {
    const mark = check.count === 0 ? "ok  " : check.fatal ? "FAIL" : "warn";
    if (check.count > 0 && check.fatal) failures += 1;
    console.log(`  ${mark}  ${check.label.padEnd(30)}${check.count}`);
  }

  console.log("  ─────────────────────────────────────────────\n");

  if (failures > 0) {
    console.error(`  ${failures} check(s) failed.\n`);
    process.exitCode = 1;
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
