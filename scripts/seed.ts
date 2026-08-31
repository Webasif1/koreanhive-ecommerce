/**
 * Bootstrap the reference data an empty database needs before it can take an
 * order: delivery zones and the launch coupon.
 *
 *   npm run db:seed
 *
 * It does **not** seed products, brands or categories. Those come from the
 * catalogue sheet via `npm run catalogue:sync`, which is the single source of
 * truth — this script used to carry 51 invented demo products, and having two
 * places that could create a product was how the storefront ended up showing
 * things nobody sells.
 *
 * Everything here is upserted, never replaced. Orders reference delivery zones
 * by id, and a coupon carries a redemption count, so recreating either would
 * corrupt records that already exist. Safe to re-run.
 */
import "dotenv/config";

import mongoose from "mongoose";

import { Coupon, DeliveryZone } from "../src/server/models";

const ZONES = [
  {
    name: "Inside Dhaka",
    slug: "inside-dhaka",
    charge: 60,
    freeShippingThreshold: 2000,
    minDays: 1,
    maxDays: 2,
    position: 0,
  },
  {
    name: "Outside Dhaka",
    slug: "outside-dhaka",
    charge: 120,
    freeShippingThreshold: 3000,
    minDays: 2,
    maxDays: 4,
    position: 1,
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  await mongoose.connect(uri);

  const zones = await Promise.all(
    ZONES.map((zone) =>
      DeliveryZone.findOneAndUpdate(
        { slug: zone.slug },
        { $setOnInsert: zone },
        { upsert: true, returnDocument: "after" },
      ),
    ),
  );

  await Coupon.findOneAndUpdate(
    { code: "WELCOME10" },
    {
      $setOnInsert: {
        code: "WELCOME10",
        description: "10% off your first order, up to ৳200.",
        type: "PERCENTAGE",
        value: 10,
        minSubtotal: 1000,
        maxDiscount: 200,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  console.log("Reference data ready:");
  console.log(`  zones      ${zones.map((zone) => zone?.name).join(", ")}`);
  console.log("  coupon     WELCOME10");
  console.log("\nNext: npm run catalogue:sync to load the product catalogue.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
