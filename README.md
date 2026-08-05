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
| Auth | Auth.js (guest-first, phone OTP) |
| Search | Meilisearch |
| Media / CDN | ImageKit |
| CMS / Admin | Payload CMS + custom commerce admin |
| Payments | Cash on Delivery → SSLCommerz (planned) |
| Hosting | Vercel · MongoDB Atlas (DB) · Railway/DigitalOcean (search, workers) |

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

## 📁 Project Structure

```
app/         # routes (storefront, account, admin, api)
components/   # UI, product, cart, checkout, layout
server/       # Mongoose models, queries, Server Actions
lib/          # auth, seo, pricing, formatting helpers
scripts/      # seed + admin bootstrap (tsx)
cms/          # Payload config & collections
workers/      # background jobs (order notify, reindex)
docs/         # architecture roadmap & planning docs
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
