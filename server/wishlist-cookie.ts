import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

export const WISHLIST_COOKIE = "kh_wishlist";

/** Guests get an opaque token so a wishlist survives without an account —
 *  the same guest-first stance the cart takes. */
export async function readGuestToken() {
  const store = await cookies();
  return store.get(WISHLIST_COOKIE)?.value ?? null;
}

export async function ensureGuestToken() {
  const store = await cookies();
  const existing = store.get(WISHLIST_COOKIE)?.value;
  if (existing) return existing;

  const token = randomUUID();
  store.set(WISHLIST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return token;
}
