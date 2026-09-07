import type { NextConfig } from "next";

// relative, not "@/": this file is loaded before the path alias exists
import { ALLOWED_IMAGE_HOSTS } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server.js and only the
  // node_modules actually traced as reachable — the Docker runtime stage
  // copies that instead of installing dependencies again.
  output: "standalone",
  images: {
    // ImageKit resizes, not our server. Next's built-in optimizer needs
    // `sharp` — a native binary, and the most common thing to fail on shared
    // hosting — and burns CPU and memory doing work a transformation CDN is
    // already there to do. See src/lib/image-loader.ts; remove these two lines
    // to hand the job back to Next.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Kept even though a custom loader bypasses them: the product importer
    // validates against the same list, so leaving it here keeps one source of
    // truth if the loader is ever removed.
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
