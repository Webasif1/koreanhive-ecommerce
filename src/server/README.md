# server/

Server-only code. Never imported from a Client Component.

- `queries/` — read paths (Mongoose reads used by Server Components)
- `actions/` — Server Actions that mutate (cart, checkout, admin). Each file starts with `"use server"`.

Rule of thumb: pages read through `queries/`, forms write through `actions/`.

- `db.ts` — cached Mongoose connection; every query path awaits `connectDb()`
- `models/` — Mongoose schemas. Images and variants are embedded in Product,
  items and status history in Order, because they are always read together.
- `serialize.ts` — turns lean documents into plain objects (`_id` → `id`) so
  they can cross the Server/Client Component boundary.
