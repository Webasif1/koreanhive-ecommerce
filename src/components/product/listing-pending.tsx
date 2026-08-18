"use client";

import { createContext, useContext, useTransition } from "react";

/**
 * Shared pending flag for a listing page.
 *
 * Paging is a real navigation, so without this Next swaps the whole route for
 * `loading.tsx` and the sidebar and header blink out. Driving the navigation
 * through a transition instead keeps the current page mounted and lets the
 * grid dim in place, which is both calmer and honest about what is happening.
 */
const ListingPendingContext = createContext<{
  isPending: boolean;
  navigate: (run: () => void) => void;
}>({
  isPending: false,
  // no provider means no transition to join, so just run it
  navigate: (run) => run(),
});

export function useListingPending() {
  return useContext(ListingPendingContext);
}

export function ListingPendingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <ListingPendingContext
      value={{ isPending, navigate: (run) => startTransition(run) }}
    >
      {children}
    </ListingPendingContext>
  );
}

/** Dims whatever it wraps while a page change is in flight. */
export function PendingGrid({ children }: { children: React.ReactNode }) {
  const { isPending } = useListingPending();

  return (
    <div className="relative">
      <div
        aria-busy={isPending}
        className={
          isPending
            ? "pointer-events-none opacity-40 transition-opacity duration-200"
            : "transition-opacity duration-200"
        }
      >
        {children}
      </div>

      {isPending && (
        <div className="absolute inset-0 flex items-start justify-center pt-24">
          <span className="sr-only" role="status">
            Loading products
          </span>
          <span
            aria-hidden
            className="size-8 animate-spin rounded-full border-2 border-hairline border-t-primary"
          />
        </div>
      )}
    </div>
  );
}
