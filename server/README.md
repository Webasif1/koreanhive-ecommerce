# server/

Server-only code. Never imported from a Client Component.

- `queries/` — read paths (Prisma reads used by Server Components, cached where safe)
- `actions/` — Server Actions that mutate (cart, checkout, admin). Each file starts with `"use server"`.

Rule of thumb: pages read through `queries/`, forms write through `actions/`.
Prisma client lives in `server/db.ts` from Step 4 onward.
