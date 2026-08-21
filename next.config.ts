import type { NextConfig } from "next";

// relative, not "@/": this file is loaded before the path alias exists
import { ALLOWED_IMAGE_HOSTS } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server.js and only the
  // node_modules actually traced as reachable — the Docker runtime stage
  // copies that instead of installing dependencies again.
  output: "standalone",
  images: {
    // built from the same list the product importer validates against, so an
    // imported image URL can never be one the storefront refuses to render
    remotePatterns: ALLOWED_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https" as const,
      hostname,
    })),
  },
  experimental: {
    // a product import posts the whole file through a Server Action, and the
    // 1MB default rejects a few hundred rows with an opaque error
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
