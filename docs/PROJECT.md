# Korean Hive — Project Status

A working record of what this application is, what has been built, and what is
still open. Written against the live code and database, not from memory — every
figure below was read off the running system.

_Last updated: 2026-09-07 · post-QA remediation pass_

---

## 1. What this is

A Korean beauty and skincare storefront for the Bangladeshi market, rebuilt on
a modern stack. The commercial shape drives most of the technical decisions:

- **Guest checkout is the default.** No account is required to buy. There is no
  customer login at all — only staff sign in.
- **Cash on delivery.** Nothing is charged online, so the app holds no payment
  credentials and is out of PCI scope.
- **Order tracking without an account**, by order number plus phone.
- **Two delivery zones**, Inside and Outside Dhaka, derived from the district.
- **SEO-first.** Product pages are statically generated; the catalogue is
  crawlable, with JSON-LD, canonicals and a generated sitemap.
- **Bangla and English.** English carries the interface; Bangla carries offers,
  delivery and trust lines. The chat assistant understands both, plus Banglish.

---

## 2. Current state

| | |
|---|---|
| Products in database | **345** |
| — published (live in the shop) | **279** |
| — draft (imported, no image yet) | **66** |
| Brands | **77** |
| Categories | **13** (12 from the sheet + a `Skincare` parent) |
| Prerendered product pages | 279 |
| Tests | **131 passing**, 29 suites |
| Dependency vulnerabilities | **0** (`npm audit --omit=dev`) |
| Orders placed | 3 (test orders) |

Every product has at least one skin concern recorded, and every published
product has an image — both enforced by `npm run catalogue:verify`.

---

## 3. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js **16** — App Router, Server Components, Server Actions |
| UI | React 19.2, Tailwind CSS 4, Radix primitives, `motion` |
| Language | TypeScript 5 (strict) |
| Database | MongoDB Atlas via Mongoose 9 |
| Auth | Auth.js v5 (staff only, JWT, Credentials + scrypt) |
| Images | ImageKit CDN through `next/image` |
| Chat | Rule engine, optionally augmented by Google Gemini |
| Payments | Cash on delivery |
| Container | Docker, `node:24-alpine`, standalone output, non-root |

**Not built, despite appearing in the original brief:** Meilisearch (search is
MongoDB regex), Payload CMS (the admin is hand-built), phone OTP, SSLCommerz.
Their environment variables are stubbed in `.env.example` and unused.

---

## 4. Architecture

```
Shopper (guest — no account)
   │
   ▼
Next.js 16 App Router
   ├── (shop)    storefront, SSG + ISR 1h, paginated listings
   ├── (admin)   staff area, gated by proxy.ts + per-action guard
   ├── (legal)   policy pages, static
   └── (account)
   │
   ├── 6 route handlers  auth · cart/count · chat · health
   │                     search/suggest · wishlist/ids
   └── 10 Server Action modules
   │
   ▼
Auth.js (JWT) ── requireAdmin() on every admin mutation
   │
   ▼
Mongoose 9 → MongoDB Atlas        Cart + coupon → httpOnly cookies
   │
   ▼
Docker: standalone server.js, healthcheck on /api/health
```

**Cart and coupon state live in `httpOnly` cookies, holding ids and quantities
only — never prices.** Every amount shown or charged is recomputed from the
database, so a tampered cookie can change what is in the basket but never what
it costs.

---

## 5. What is built

### Storefront

- **Listings** — `/shop`, `/category/[slug]`, `/brand/[slug]`, `/deals`, all
  sharing one query and one layout. 12 products per page, numbered crawlable
  pagination, sort by newest/popular/price/discount.
- **Faceted filter sidebar** — category, brand, rating, offers, dual-thumb price
  range. Counts are computed with every *other* filter applied, so the number
  beside a checkbox is what you would actually get.
- **Product pages** — gallery with zoom, variants, buy box, related products,
  JSON-LD. Statically generated for all 279 published products.
- **Search** — header typeahead with debounce and request cancellation, plus a
  full results page reusing the listing layout. Matches product name, benefit,
  SKU, slug, brand and category names.
- **Cart and checkout** — one page, guest-only, shipping derived from district,
  coupon support, order confirmation.
- **Order tracking** — order number + phone, rate-limited, deliberately vague
  on failure so it cannot be used to enumerate orders.
- **Wishlist** — cookie-backed for guests, hydrated client-side so it does not
  make listing pages dynamic.
- **Chat assistant** — floating widget, recommends from the real catalogue.

### Catalogue pipeline

The Google Sheet is the source of truth. Nothing invents product data.

```
Google Sheet (345 rows, 28 columns)
      │  npm run catalogue:sync
      ▼
validate → upsert brands & categories → upsert products by slug
      │
      ├─ products with no image import as drafts (hidden, not deleted)
      ├─ concerns mapped onto the advisor's taxonomy
      └─ re-runs are no-ops when nothing changed
      │
      ▼
npm run catalogue:verify  →  fails on anything that would break a page
```

`catalogue:verify` checks duplicate slugs, published products without images,
images on hosts `next/image` would refuse, non-positive prices and compare
prices below price. It exits non-zero, so it works as a deploy gate.

### Chat assistant

- **Rule engine** — intent detection, FAQ matching, slot filling, and a scored
  recommender. Concerns carry the ranking (40 of the weight), sourced from the
  sheet's own column for all 345 products.
- **Safety gate runs first.** Medical questions ("will this cure my eczema")
  and credential questions never reach the recommender or the model, and never
  return product cards.
- **Gemini is optional.** It reads a message into slots and rewrites replies in
  the customer's language — English, Bangla or Banglish. It **never** chooses a
  product, states a price, or answers a medical question. Its output is
  re-validated against the taxonomy exactly like input from a browser.
- **No key, timeout, quota error or malformed JSON falls back to the rule
  engine**, so the assistant works with the integration removed entirely.

### Admin

Products (list, edit, create, bulk import), orders, coupons, banners. The import
screen accepts a CSV/JSON upload or a pasted Google Sheets link and previews
every row before writing.

---

## 6. Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build and serve |
| `npm run lint` / `npx tsc --noEmit` | Lint and typecheck |
| `npm test` | 81 unit tests, no database needed |
| `npm run catalogue:sync` | Pull the sheet into the catalogue |
| `npm run catalogue:sync -- --fresh` | Drop and rebuild the catalogue |
| `npm run catalogue:verify` | Health-check the catalogue, non-zero on failure |
| `npm run combos:sync` | Publish routine bundles, refusing broken ones |
| `npm run db:seed` | Delivery zones and the launch coupon only |
| `npm run admin:create` | Create/update the staff login from `.env` |
| `npm run docker:up` | Regenerate the Linux lockfile, then build and run |

**Always use `npm run docker:up` rather than `docker compose up`.** Installing
packages on Windows silently drops the Linux-only optional dependencies, and
`npm ci` then fails inside Alpine. The wrapper regenerates the lockfile first.

---

## 7. Security

Verified by reading the code, not assumed:

- **Admin authorisation** — `requireAdmin()` on all 12 admin actions, checked
  per function. Server Actions are public endpoints, so this does not rely on
  the proxy having run.
- **Passwords** — scrypt, 16-byte random salt, `timingSafeEqual`.
- **Login** — 5 attempts per 15 minutes, keyed on IP *and* email. The IP half
  needs `TRUSTED_PROXY_HOPS` set; the email half always applies and is what
  bounds a brute force against a known account.
- **Cookies** — `httpOnly`, `sameSite: lax`, `secure` in production.
- **Shipping cost is derived on the server** from the district, which is itself
  validated against an allow-list. It was previously read from a hidden form
  field, which let a crafted request pay ৳60 instead of ৳120.
- **Checkout** runs in a transaction with conditional stock decrements, so
  concurrent orders cannot oversell. Each filled cart also mints a token that
  is stored on the order under a unique index, so two tabs submitting at once
  produce one order and the loser is shown it rather than charged twice.
- **Search input is regex-escaped** — `.*` returns nothing, not the catalogue.
- **Chat endpoint** is rate-limited, length-capped, stateless, and writes
  nothing.
- **Security headers** — HSTS, `nosniff`, `X-Frame-Options: DENY`,
  referrer and permissions policy.
- **Secrets** — only `.env.example` is tracked; `NEXT_PUBLIC_SITE_URL` is the
  sole public variable; no `process.env` read in any client component.

**No CSP yet.** Next's inline bootstrap and Tailwind's inline styles need either
`unsafe-inline` or a nonce pipeline. Ship it as `Report-Only` first.

---

## 8. Open items

### Worth doing first

**Set `TRUSTED_PROXY_HOPS` before going live.** Rate limiting resolves the
caller from `X-Forwarded-For` counted from the right. It defaults to **0 —
trust nothing**, because with no proxy in front the "last hop" of a one-entry
header is whatever the client wrote, and an unconfigured deployment would keep
believing spoofed addresses. While it is 0, per-IP limits are disabled (the
login's per-email limit still applies) and the server logs a warning once. Set
it to 1 behind a single reverse proxy, 2 behind a CDN plus load balancer.

**Configure the contact channels.** `/contact` renders only the channels set in
the environment (`NEXT_PUBLIC_CONTACT_EMAIL`, `_PHONE`, `_WHATSAPP`). Nothing
is published until they exist, so customers currently get the tracking page and
the assistant and no direct route.

### Infrastructure

- **No CI.** Nothing enforces lint, typecheck, tests or build before a deploy.
  This is now the largest remaining gap: the fixes below are covered by tests,
  but nothing stops the next change from undoing them.
- **No error tracking or uptime monitoring.** Three `console.error` calls total.
- **Backups unverified.** Atlas settings are not visible from the repo; on the
  free tier there are none. Orders are the only irreplaceable data.

### Performance and data

- Indexes added for the paths that run: `categoryId`, `brandId`, `price`,
  `ratingCount` and `comparePrice` (each paired with `isActive`), plus
  `placedAt` on orders. **They exist in the schema but Mongoose only builds
  them on connect — confirm they are present in Atlas after the first deploy.**
- Admin lists are paginated (50 per page) and projected.

### Content

- **Product descriptions render raw markdown** — `**bold**` shows its asterisks
  on every product with a full description. Still open.
- **Four spec tiles are hardcoded on all 279 product pages**, including
  "Routine step: After toner, before moisturiser" shown on toners.
- **66 products are drafts** awaiting images.
- **Three routine combos are blocked** pending two products that do not exist in
  the catalogue (Dr. Althea 345 Relief Cream, Anua Niacinamide 10% + TXA 4%
  Serum) and their prices.
- **Ratings are the sheet's own values**, not real customer reviews. Stars and
  the `AggregateRating` structured data are now hidden behind
  `NEXT_PUBLIC_SHOW_RATINGS`, off by default — publishing unearned review markup
  is a manual-action risk for the whole domain. Turn it on when the `Review`
  model is actually in use.

### Untested

- **A live Gemini call has never run** — no API key in the development
  environment. The rule engine, the fallback and the isolation boundary are
  verified end to end; the model round-trip is not.
- **The best-seller ranking path** is verified at the aggregation level only.
  The three existing orders reference demo products deleted during the import,
  so the ranked render has never been exercised with live data.

---

## 9. Deployment

```bash
npm run lock:linux          # required after any npm install on Windows
npm run docker:up
```

Required environment variables: `MONGODB_URI`, `AUTH_SECRET`,
`NEXT_PUBLIC_SITE_URL`, `SHEET_CSV_URL`. Optional: `GEMINI_API_KEY`.
`ADMIN_EMAIL` / `ADMIN_PASSWORD` are read once by `npm run admin:create`.

The build prerenders pages that query MongoDB, so it needs a reachable
database. The URI is passed as a BuildKit **secret**, not a build argument, so
it never lands in `docker history`.

After deploying: `npm run catalogue:sync && npm run catalogue:verify`.

---

## 10. Conventions

- **Nothing about a product is invented.** Prices, stock, descriptions, images
  and concerns all come from the sheet. A missing image makes a product a draft;
  it does not get placeholder artwork passed off as a photograph.
- **No fabricated social proof.** Review counts, ratings, testimonials and
  "best seller" claims must be backed by real data. The homepage previously
  carried an invented "4.9★ / 3,400+ reviews" figure and a named customer
  testimonial; both were removed rather than restyled.
- **Claims are gated on the data supporting them.** The best-seller badge only
  appears when sales exist; the combo saving is computed from live prices; a
  bundle refuses to publish if any product in it is unbuyable.
- **Money is integer taka** everywhere. No floats.
- **Sorts carry a tiebreaker.** Paginated queries append `_id`, because MongoDB
  does not order tied documents deterministically and skip/limit would
  otherwise duplicate and drop rows.
