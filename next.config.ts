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
  // Deliberately no Content-Security-Policy yet. Next injects inline bootstrap
  // scripts and Tailwind injects inline styles, so any useful policy needs
  // either 'unsafe-inline' (which buys little) or a nonce pipeline. Ship it
  // separately as Report-Only first, and verify Google Fonts, next/image and
  // the chatbot before enforcing. The headers below cannot break the app.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            // HTTPS only, once the domain is served over TLS. Remove `preload`
            // unless you intend to submit the domain to the HSTS preload list,
            // because getting off that list is slow.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // nothing here is meant to be framed; blocks clickjacking of the
          // admin screens and the checkout form
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  experimental: {
    // a product import posts the whole file through a Server Action, and the
    // 1MB default rejects a few hundred rows with an opaque error
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
