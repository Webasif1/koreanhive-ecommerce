/**
 * Publish the routine bundles defined in src/data/combos.ts.
 *
 *   npm run combos:sync
 *
 * Validates before it writes. A combo is published only when every one of its
 * products exists, is active, and the combo has a price. Anything else is
 * reported with the reason and left unpublished — a bundle that links to a
 * product a shopper cannot open is worse than one that is not there yet.
 *
 * Safe to re-run: combos are upserted on slug, so this updates in place and
 * a blocked combo publishes itself as soon as its blockers clear.
 */
import "dotenv/config";

import mongoose from "mongoose";

import { COMBOS, type ComboSeed } from "../src/data/combos";
import { planCombo } from "../src/lib/combos";
import { Combo, Product } from "../src/server/models";

type Blocker = string;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  await mongoose.connect(uri);

  const slugs = [...new Set(COMBOS.flatMap((combo) => combo.productSlugs))];

  const products = await Product.find({ slug: { $in: slugs } })
    .select("slug name price isActive")
    .lean();

  const found = new Map(
    products.map((product) => [
      product.slug,
      { name: product.name, price: product.price, isActive: product.isActive },
    ]),
  );

  let published = 0;
  const blocked: { combo: ComboSeed; blockers: Blocker[] }[] = [];

  for (const combo of COMBOS) {
    const plan = planCombo(combo, found);

    if (plan.status === "blocked") {
      blocked.push({ combo, blockers: plan.blockers });
      continue;
    }

    await Combo.findOneAndUpdate(
      { slug: combo.slug },
      {
        $set: {
          name: combo.name,
          concern: combo.concern,
          description: combo.description,
          productSlugs: combo.productSlugs,
          price: plan.price,
          comparePrice: plan.comparePrice,
          position: combo.position,
          isActive: true,
        },
        $setOnInsert: { slug: combo.slug },
      },
      { upsert: true },
    );

    published += 1;

    const saving = (plan.comparePrice ?? plan.price) - plan.price;
    console.log(
      `  published  ${combo.slug.padEnd(24)} ৳${plan.price} ` +
        (saving > 0 ? `(was ৳${plan.comparePrice}, saves ৳${saving})` : ""),
    );
  }

  for (const { combo, blockers } of blocked) {
    console.log(`\n  BLOCKED    ${combo.slug}`);
    for (const blocker of blockers) console.log(`             ${blocker}`);
  }

  console.log(
    `\n  ${published} published, ${blocked.length} blocked, ` +
      `${await Combo.countDocuments({ isActive: true })} live in total\n`,
  );

  if (blocked.length > 0) {
    console.log("  Blocked combos publish themselves on the next run once the");
    console.log("  products above are in the sheet and synced.\n");
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
