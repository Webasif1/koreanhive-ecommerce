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
 *
 *   npm run combos:sync -- --dry-run
 *
 * Runs every check and prints the same report without writing anything.
 * This flag did not exist once, and `--dry-run` was silently ignored — the
 * script published three combos to the live database while being asked only
 * to preview. So any argument this script does not recognise is now refused
 * before it connects, and a mistyped flag cannot turn into a write.
 */
import "dotenv/config";

import mongoose from "mongoose";

import { COMBOS, comboProductSlugs, type ComboSeed } from "../src/data/combos";
import { planCombo } from "../src/lib/combos";
import { Combo, Product } from "../src/server/models";

type Blocker = string;

const KNOWN_ARGS = new Set(["--dry-run"]);

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => !KNOWN_ARGS.has(arg));

  // refused before connecting: an unrecognised flag must never become a write
  if (unknown.length > 0) {
    throw new Error(
      `Unknown argument ${unknown.join(", ")}. Supported: ${[...KNOWN_ARGS].join(", ")}`,
    );
  }

  const dryRun = args.includes("--dry-run");

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  await mongoose.connect(uri);

  const slugs = [...new Set(COMBOS.flatMap(comboProductSlugs))];

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

    if (!dryRun) {
      await Combo.findOneAndUpdate(
        { slug: combo.slug },
        {
          $set: {
            name: combo.name,
            concern: combo.concern,
            description: combo.description,
            productSlugs: comboProductSlugs(combo),
            imageUrl: combo.imageUrl,
            price: plan.price,
            comparePrice: plan.comparePrice,
            position: combo.position,
            isActive: true,
          },
          $setOnInsert: { slug: combo.slug },
        },
        { upsert: true },
      );
    }

    published += 1;

    const saving = (plan.comparePrice ?? plan.price) - plan.price;
    console.log(
      `  ${dryRun ? "would publish" : "published"}  ${combo.slug.padEnd(24)} ৳${plan.price} ` +
        (saving > 0 ? `(was ৳${plan.comparePrice}, saves ৳${saving})` : ""),
    );
  }

  for (const { combo, blockers } of blocked) {
    console.log(`\n  BLOCKED    ${combo.slug}`);
    for (const blocker of blockers) console.log(`             ${blocker}`);
  }

  console.log(
    `\n  ${published} ${dryRun ? "would publish" : "published"}, ${blocked.length} blocked, ` +
      `${await Combo.countDocuments({ isActive: true })} live in total\n`,
  );

  if (dryRun) console.log("  dry run — nothing written.\n");

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
