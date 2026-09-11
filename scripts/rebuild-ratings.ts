/**
 * Recompute every product's star rating from its approved reviews.
 *
 *   npm run ratings:rebuild
 *
 * The first run clears the catalogue sheet's placeholder ratings — the same
 * value on every product — which the importer used to write and no longer
 * does. After that it is a repair tool: safe to re-run at any time, and it
 * leaves the catalogue exactly as the Review collection says it should be.
 *
 * Only products that are rated now, or ought to be, are touched. Everything
 * else is already 0/0 and has no approved review, so there is nothing to
 * recompute.
 *
 * Uses recomputeProductRating, the same function the review actions call, so
 * the script and the storefront cannot compute a rating differently.
 *
 * This writes to whatever MONGODB_URI points at.
 */
import "dotenv/config";

import mongoose from "mongoose";

import { Product, Review } from "../src/server/models";
import { recomputeProductRating } from "../src/server/ratings";

/** Parallel updates at once — Atlas is a round trip away, one at a time is slow. */
const CONCURRENCY = 10;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  // src/server/db.ts is server-only, so the script connects itself;
  // recomputeProductRating uses whatever connection is open
  await mongoose.connect(uri);

  const [stale, reviewed] = await Promise.all([
    Product.find({
      $or: [{ ratingCount: { $gt: 0 } }, { ratingAvg: { $gt: 0 } }],
    }).distinct("_id"),
    Review.find({ isApproved: true }).distinct("productId"),
  ]);

  const ids = [
    ...new Set([...stale, ...reviewed].map((id) => id.toString())),
  ];

  console.log(`\n  products to recompute   ${ids.length}`);

  let rated = 0;

  for (let start = 0; start < ids.length; start += CONCURRENCY) {
    const results = await Promise.all(
      ids.slice(start, start + CONCURRENCY).map((id) => recomputeProductRating(id)),
    );
    rated += results.filter((result) => result.ratingCount > 0).length;
  }

  const [total, stillRated] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ ratingCount: { $gt: 0 } }),
  ]);

  console.log(`  rated from reviews      ${rated}`);
  console.log(`  cleared                 ${ids.length - rated}`);
  console.log(`  catalogue now rated     ${stillRated} of ${total}\n`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
