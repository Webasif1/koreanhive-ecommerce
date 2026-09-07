# Korean Hive — E-commerce

Premium Korean beauty & skincare e-commerce platform for Bangladesh. A fast, SEO-optimized, mobile-first rebuild of [koreanhive.com](https://koreanhive.com) on a modern stack.

> Skincare · Cosmetics · Makeup · Sunscreen · Serums · Toners · Moisturizers — with guest checkout, cash on delivery, and login-free order tracking.

## ✨ Highlights

- **Guest checkout by default** — buy in the fewest possible clicks, no account required
- **Login-free order tracking** — by order number + phone
- **One-page checkout** with auto shipping (Inside / Outside Dhaka)
- **Cash on Delivery** now, SSLCommerz (bKash / Nagad / card) planned
- **SEO-first** — SSR/SSG/ISR, full JSON-LD schema, dynamic sitemap, Core Web Vitals tuned
- **Premium K-beauty UI** — clean, minimal, modern animations, mobile-first

## 🧱 Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| Database | MongoDB + Mongoose |
| Auth | Auth.js v5 — staff only; shoppers never sign in |
| Search | MongoDB regex (Meilisearch remains a future swap) |
| Media / CDN | ImageKit |
| Admin | Hand-built commerce admin |
| Chat | Rule engine, optionally augmented by Google Gemini |
| Payments | Cash on Delivery |
| Hosting | cPanel + Phusion Passenger (Node 22, standalone output) · MongoDB Atlas |

Planned but **not built**: Meilisearch, phone OTP, SSLCommerz. Their
environment variables are stubbed in `.env.example` and unused.

See **[docs/PROJECT.md](docs/PROJECT.md)** for the detailed status — what is
built, the catalogue pipeline, the security posture, and everything still open.

## 🚀 Getting Started

```bash
# install dependencies
npm install

# set environment variables (MONGODB_URI, AUTH_SECRET, ADMIN_*)
cp .env.example .env

# load demo products, categories, brands and the two delivery zones
npm run db:seed

# create the staff login from ADMIN_EMAIL / ADMIN_PASSWORD
npm run admin:create

# start the dev server
npm run dev
```

App runs at `http://localhost:3000`.

## 🚢 Deployment

Production runs on **shared cPanel hosting** behind Phusion Passenger, and
ships from GitHub Actions. There is no container anywhere in the pipeline.

```
push to main
  -> quality   npm ci, lint, tsc --noEmit, 131 tests
  -> build     next build, package .next/standalone as an artifact
  -> deploy    FTPS upload to the cPanel app path, stamp tmp/restart.txt,
               poll /api/health until it answers 200
```

The pipeline lives in [`.github/workflows/ci.yml`](.github/workflows/ci.yml);
the host setup, environment variables and every footgun are written up in
**[docs/DEPLOY-CPANEL.md](docs/DEPLOY-CPANEL.md)**.

Three things worth knowing:

- **The build needs a reachable database.** Six routes are prerendered by
  `next build` and query MongoDB, so `MONGODB_URI` has to be set as a GitHub
  Actions secret and Atlas has to accept connections from the runner.
- **MongoDB must be a replica set.** Checkout writes the order in a
  transaction, which a standalone `mongod` does not support. Atlas is a
  replica set by default; a hand-rolled local `mongod` is not, and will fail
  at checkout and nowhere else.
- **Regenerate the lock file after any `npm install`.** Windows drops the
  platform-gated optional dependencies and `npm ci` on the Linux runner then
  refuses to install. Run `npm run lock:fix` and commit `package-lock.json`.


## 📁 Project Structure

Application code lives under `src/`; the root holds configuration and tooling.

```
src/
  app/          # routes (storefront, account, admin, api)
  components/   # UI, product, cart, checkout, layout
  server/       # Mongoose models, queries, Server Actions
  lib/          # auth, seo, pricing, formatting helpers
  types/        # ambient type declarations
  auth.ts       # Auth.js entry (auth.config.ts is the edge-safe half)
  proxy.ts      # route guard — must sit beside app/, so inside src/
public/         # static assets; Next only serves these from the root
scripts/        # seed + admin bootstrap + image tooling (tsx)
docs/           # architecture roadmap & planning docs
```

## 📄 Documentation

The full architecture, database schema, SEO strategy, and 20-week development
roadmap are in [`docs/KoreanHive-Roadmap.pdf`](docs/KoreanHive-Roadmap.pdf).

## 🗺️ Roadmap

- **v1.0** — Catalog, guest cart, one-page COD checkout, order tracking, admin, blog, SEO
- **v1.1** — SSLCommerz (bKash/Nagad/card), courier API (Pathao/Steadfast), SMS OTP
- **v1.2** — Loyalty points, referral, gift vouchers, abandoned-cart recovery
- **v2.0** — Skin quiz recommender, subscriptions, PWA, multi-language

## License

© 2026 Korean Hive. All rights reserved.
