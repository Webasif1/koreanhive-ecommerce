"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Filters below `lg`, as a bottom sheet.
 *
 * They used to open inline above the grid, so every tick of a checkbox
 * refreshed a product list the shopper could not see — it was a screen or two
 * further down, behind the filters they had just opened. The sheet sits over
 * the results instead, and "Show products" closes it on the updated list.
 *
 * Still a `<details>`: it opens before hydration, and the page behind stops
 * scrolling through `html:has(.kh-filter[open])` in globals.css. The client
 * half closes it from the backdrop, the buttons and Escape.
 */
export function MobileFilterSheet({
  total,
  children,
}: {
  total: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current) ref.current.open = false;
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <details
      ref={ref}
      className="kh-filter group lg:hidden"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between border border-border bg-white px-5 py-3.5 text-[13px] font-bold uppercase tracking-[0.1em] [&::-webkit-details-marker]:hidden">
        Filters
        <span className="text-primary" aria-hidden>
          ▾
        </span>
      </summary>

      <div
        className="kh-nav-backdrop fixed inset-0 z-[65] bg-ink/40"
        aria-hidden
        onClick={close}
      />

      <div
        role="dialog"
        aria-label="Filters"
        className="kh-sheet-up fixed inset-x-0 bottom-0 z-[70] flex max-h-[85dvh] flex-col bg-cream"
      >
        {/* no title here: the filter panel below carries its own "Filters"
            heading and Clear all */}
        <div className="relative flex justify-end bg-white">
          <span
            aria-hidden
            className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-hairline"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close filters"
            className="flex size-11 items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-3">
          {children}
        </div>

        <div className="border-t border-border bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={close}
            className="h-12 w-full bg-primary text-[13px] font-semibold text-primary-foreground"
          >
            Show {total} {total === 1 ? "product" : "products"}
          </button>
        </div>
      </div>
    </details>
  );
}
