import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer loads .env automatically, hence the dotenv import above.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
