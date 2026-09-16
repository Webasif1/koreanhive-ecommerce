"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ComboFilterItem = {
  key: string;
  /** The seed's tag, or null for a combo with no seed behind it. */
  tag: string | null;
  card: ReactNode;
};

const ALL = "All combos";

/**
 * The tag row on /combos, and the list it filters.
 *
 * These tabs used to be `<span>`s — styled like buttons, doing nothing. A
 * control that looks pressable and is not is worse than no control, so they
 * are real buttons now.
 *
 * Filtering happens in the browser rather than through `?tag=` links: ten cards
 * are already on the page, so switching is instant and the page stays
 * statically rendered instead of going dynamic for a filter. With JavaScript
 * off, every combo shows, which is exactly what the page did before.
 *
 * The cards are passed in already rendered, so they stay server components —
 * this file adds the tab row to the client bundle, not the card markup, its
 * images or its prices.
 */
export function ComboFilter({ items }: { items: ComboFilterItem[] }) {
  const [active, setActive] = useState(ALL);

  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.tag) counts.set(item.tag, (counts.get(item.tag) ?? 0) + 1);
  }

  const tabs = [
    { label: ALL, count: items.length },
    ...[...counts].map(([label, count]) => ({ label, count })),
  ];

  // A tag that no longer matches anything would leave an empty page with no way
  // back, so fall back to showing everything.
  const selected = tabs.some((tab) => tab.label === active) ? active : ALL;
  const shown = items.filter(
    (item) => selected === ALL || item.tag === selected,
  );

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter combos by concern">
        {tabs.map((tab) => {
          const isActive = tab.label === selected;

          return (
            <button
              key={tab.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(tab.label)}
              className={cn(
                "inline-block px-4 py-2 text-[12px] font-semibold transition-colors",
                isActive
                  ? "bg-ink uppercase tracking-[0.06em] text-white"
                  : "border border-border bg-white text-foreground hover:border-primary hover:text-primary",
              )}
            >
              {tab.label}{" "}
              <span className={isActive ? "text-light" : "text-muted-foreground"}>
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Announced on change, because the page below a filter row can move by
          several screens without anything being said about it. */}
      <p aria-live="polite" className="sr-only">
        Showing {shown.length} of {items.length} combos
        {selected === ALL ? "" : ` in ${selected}`}
      </p>

      {/* Each card is already an <li>, keyed where it was created, so they go
          straight into the list — wrapping them here would nest li inside li. */}
      <ul className="mt-6 space-y-5">{shown.map((item) => item.card)}</ul>
    </>
  );
}
