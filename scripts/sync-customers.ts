/**
 * Fill the admin Customers list from the order history.
 *
 *   npm run customers:sync
 *
 * The same sync as the "Add from past orders" button on /admin/customers.
 * Safe to re-run: it only creates customers who are missing and widens the
 * first/last order dates of those already on file — it never overwrites
 * details staff have edited. It takes no flags, and refuses any it is given,
 * so a mistyped "--dry-run" cannot quietly become a write.
 */
import "dotenv/config";

import mongoose from "mongoose";

import { syncCustomersFromOrders } from "../src/server/customer-sync";

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    throw new Error(`Unknown argument(s): ${args.join(" ")}. This script takes none.`);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  await mongoose.connect(uri);

  const result = await syncCustomersFromOrders();
  console.log(
    `Customers checked: ${result.customers}. Newly added: ${result.created ?? 0}.`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
