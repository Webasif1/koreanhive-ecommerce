import "dotenv/config";

import mongoose from "mongoose";

import { hashPassword } from "../src/lib/password";
import { User } from "../src/server/models";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env first.");

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  await mongoose.connect(uri);

  const passwordHash = await hashPassword(password);

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: { passwordHash, role: "ADMIN" },
      $setOnInsert: { email, name: "Korean Hive Admin" },
    },
    { upsert: true, new: true },
  );

  console.log(`Admin ready: ${user.email}`);
  console.log("Sign in at /admin/login");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
