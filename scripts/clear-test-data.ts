/**
 * Wipe every order and customer — for clearing out test data before launch.
 *
 *   npm run data:clear-test            dry run: prints what would happen
 *   npm run data:clear-test -- --yes   does it
 *
 * With --yes it first writes every order and customer to
 * backups/test-data-<timestamp>.json, then, in one transaction:
 *  - puts stock back for each order that has not already returned it
 *    (restockedAt null), the same rule the admin Trash button uses
 *  - takes the deleted orders' uses off their coupons' usedCount
 *  - deletes reviews that came from those orders
 *  - deletes every order and every customer
 * Products, coupons themselves, banners, combos and staff are not touched.
 *
 * This writes to whatever MONGODB_URI points at — the live database.
 */
import "dotenv/config";

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import mongoose from "mongoose";

import { Coupon, Customer, Order, Product, Review } from "../src/server/models";

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== "--yes");
  if (unknown.length > 0) {
    throw new Error(`Unknown argument(s): ${unknown.join(" ")}. Only --yes is accepted.`);
  }
  const write = args.includes("--yes");

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const [orders, customers] = await Promise.all([
    Order.find({}).sort({ placedAt: -1 }).lean(),
    Customer.find({}).lean(),
  ]);
  const orderIds = orders.map((order) => order._id);
  const reviews = await Review.find({ orderId: { $in: orderIds } }).lean();

  console.log(`Orders: ${orders.length} (${orders.filter((o) => o.deletedAt).length} in trash)`);
  for (const order of orders) {
    console.log(
      `  ${order.orderNumber}  ${order.customerName} · ${order.customerPhone}  ` +
        `${order.status}  ৳${order.total}${order.deletedAt ? "  [trash]" : ""}`,
    );
  }
  console.log(`Customers: ${customers.length}`);
  console.log(`Reviews from these orders: ${reviews.length}`);

  // stock each product gets back, keyed by product + variant
  const restock = new Map<string, { productId: string; variantId: string | null; label: string; quantity: number }>();
  for (const order of orders) {
    if (order.restockedAt) continue;
    for (const item of order.items) {
      if (!item.productId) continue;
      const productId = String(item.productId);
      const variantId = item.variantId ? String(item.variantId) : null;
      const key = `${productId}:${variantId ?? ""}`;
      const entry = restock.get(key) ?? {
        productId,
        variantId,
        label: [item.productName, item.variantName].filter(Boolean).join(" — "),
        quantity: 0,
      };
      entry.quantity += item.quantity;
      restock.set(key, entry);
    }
  }
  console.log(`Stock to put back (${restock.size} lines):`);
  for (const entry of restock.values()) console.log(`  +${entry.quantity}  ${entry.label}`);

  const couponUses = new Map<string, number>();
  for (const order of orders) {
    if (!order.couponId) continue;
    const id = String(order.couponId);
    couponUses.set(id, (couponUses.get(id) ?? 0) + 1);
  }
  console.log(`Coupons to give uses back: ${couponUses.size}`);

  if (!write) {
    console.log("\nDry run — nothing changed. Re-run with --yes to delete.");
    return;
  }

  const backupDir = join(process.cwd(), "backups");
  mkdirSync(backupDir, { recursive: true });
  const backupPath = join(
    backupDir,
    `test-data-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(backupPath, JSON.stringify({ orders, customers, reviews }, null, 2));
  console.log(`\nBackup written: ${backupPath}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const entry of restock.values()) {
        if (entry.variantId) {
          await Product.updateOne(
            { _id: entry.productId, "variants._id": entry.variantId },
            { $inc: { "variants.$.stock": entry.quantity } },
            { session },
          );
        } else {
          await Product.updateOne(
            { _id: entry.productId },
            { $inc: { stock: entry.quantity } },
            { session },
          );
        }
      }

      for (const [couponId, uses] of couponUses) {
        const coupon = await Coupon.findById(couponId).session(session).lean();
        if (!coupon) continue;
        await Coupon.updateOne(
          { _id: couponId },
          { $set: { usedCount: Math.max(0, coupon.usedCount - uses) } },
          { session },
        );
      }

      await Review.deleteMany({ orderId: { $in: orderIds } }, { session });
      await Order.deleteMany({}, { session });
      await Customer.deleteMany({}, { session });
    });
  } finally {
    await session.endSession();
  }

  console.log(
    `Done. Deleted ${orders.length} orders, ${customers.length} customers, ` +
      `${reviews.length} reviews; restocked ${restock.size} lines.`,
  );
  if (reviews.length > 0) console.log("Now run: npm run ratings:rebuild");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
