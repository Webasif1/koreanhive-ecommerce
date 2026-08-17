"use client";

import { useSearchParams } from "next/navigation";

/**
 * The search field, split out purely so it can read the current query.
 *
 * useSearchParams() opts its route out of static rendering unless it sits
 * behind a Suspense boundary — the header renders on every page, so without
 * that boundary this one input would make the entire site dynamic. SiteHeader
 * wraps it; do not render it bare.
 *
 * `key` forces a fresh input when the query changes, so navigating from one
 * result page to another updates the box instead of keeping a stale
 * defaultValue.
 */
export function HeaderSearchInput() {
  const q = useSearchParams().get("q") ?? "";

  return (
    <input
      key={q}
      name="q"
      defaultValue={q}
      placeholder="Search products — serum, sunscreen, Anua, acne care…"
      aria-label="Search products"
      className="w-full bg-transparent text-sm outline-none placeholder:text-faint"
    />
  );
}

/** Rendered while the client component is held back, so the header does not
 *  reflow when it swaps in. */
export function HeaderSearchInputFallback() {
  return (
    <input
      name="q"
      placeholder="Search products — serum, sunscreen, Anua, acne care…"
      aria-label="Search products"
      className="w-full bg-transparent text-sm outline-none placeholder:text-faint"
    />
  );
}
