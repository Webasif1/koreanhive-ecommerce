/**
 * Add ৳200 to every product's crossed-out ("was") price.
 *
 *   npx tsx scripts/bump-compare-price.ts                     # dry run
 *   npx tsx scripts/bump-compare-price.ts --apply             # write it
 *   npx tsx scripts/bump-compare-price.ts --restore <file>    # undo
 *
 * The selling price is untouched, so a product selling at ৳1000 with ৳1049
 * crossed out (৳49 off) becomes ৳1249 crossed out (৳249 off). A product with
 * no discount gets its price + ৳200 crossed out.
 *
 * NOT idempotent: every --apply adds another ৳200. Each run first saves the
 * values it replaces to backups/, and --restore puts them back exactly.
 *
 * One-off and database only: the next `npm run catalogue:sync` resets
 * comparePrice to the sheet's Regular Price column.
 */
import "dotenv/config";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import mongoose from "mongoose";

import { isOnSale } from "../src/lib/pricing";
import { Product } from "../src/server/models";

const EXTRA = 200;
const BACKUP_DIR = "backups";

type BackupRow = { slug: string; comparePrice: number | null };

async function restore(file: string) {
  const rows = JSON.parse(readFileSync(file, "utf8")) as BackupRow[];
  console.log(`\n  restoring comparePrice on ${rows.length} product(s) from ${file}`);

  const result = await Product.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: { slug: row.slug },
        update: { $set: { comparePrice: row.comparePrice } },
      },
    })),
    { ordered: false },
  );

  console.log(`  restored ${result.modifiedCount} product(s).\n`);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const restoreAt = process.argv.indexOf("--restore");

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  await mongoose.connect(uri);

  try {
    if (restoreAt !== -1) {
      const file = process.argv[restoreAt + 1];
      if (!file) throw new Error("--restore needs a backup file path.");
      await restore(file);
      return;
    }

    const products = await Product.find({})
      .select("slug name price comparePrice variants")
      .sort({ createdAt: 1 })
      .lean();

    const plan = products.map((product) => {
      const variants = product.variants ?? [];
      const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];
      // the price the card and buy box lead with
      const shown = defaultVariant?.price ?? product.price;
      const old = product.comparePrice ?? null;
      const base = isOnSale(shown, old) ? (old as number) : shown;

      return {
        slug: product.slug,
        name: product.name,
        shown,
        old,
        next: base + EXTRA,
        oldSaving: isOnSale(shown, old) ? (old as number) - shown : 0,
      };
    });

    console.log(`\n  products  ${plan.length}`);
    console.log(`  already discounted  ${plan.filter((row) => row.oldSaving > 0).length}`);
    console.log(`\n  ${apply ? "updating" : "would update"} (sample):`);
    for (const row of plan.slice(0, 10)) {
      console.log(
        `    ${row.name.slice(0, 44).padEnd(44)} ৳${row.shown}  ` +
          `was ৳${row.old ?? "—"} → ৳${row.next}  ` +
          `off ৳${row.oldSaving} → ৳${row.next - row.shown}`,
      );
    }

    if (!apply) {
      console.log("\n  Dry run — nothing was written. Re-run with --apply.\n");
      return;
    }

    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(
      BACKUP_DIR,
      `compare-price-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    );
    writeFileSync(
      backup,
      JSON.stringify(
        plan.map((row): BackupRow => ({ slug: row.slug, comparePrice: row.old })),
        null,
        2,
      ),
    );
    console.log(`\n  backup  ${backup}`);

    const result = await Product.bulkWrite(
      plan.map((row) => ({
        updateOne: {
          // guarded on the value read, so an edit made mid-run is not
          // overwritten with a number computed from stale data
          filter: { slug: row.slug, comparePrice: row.old },
          update: { $set: { comparePrice: row.next } },
        },
      })),
      { ordered: false },
    );

    console.log(`  updated ${result.modifiedCount} of ${plan.length} product(s).`);
    console.log(`  undo with: npx tsx scripts/bump-compare-price.ts --restore ${backup}\n`);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main().catch((error: unknown) => {
  console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
