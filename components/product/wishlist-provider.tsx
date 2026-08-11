"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type WishlistContextValue = {
  ids: Set<string>;
  isSaved: (productId: string) => boolean;
  toggleLocal: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Fetched once on mount rather than read during the server render, which
 * keeps every listing page statically renderable. One request per session
 * covers all the hearts on the page.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;

    fetch("/api/wishlist/ids")
      .then((res) => (res.ok ? res.json() : { ids: [] }))
      .then((data: { ids?: string[] }) => {
        if (!cancelled) setIds(new Set(data.ids ?? []));
      })
      .catch(() => {
        // a failed wishlist fetch must never break the page
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // keeps the heart in sync immediately; the server action is the source of truth
  const toggleLocal = useCallback((productId: string) => {
    setIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      isSaved: (productId: string) => ids.has(productId),
      toggleLocal,
    }),
    [ids, toggleLocal],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  // rendered outside the provider (e.g. admin) — degrade quietly
  if (!context) {
    return {
      ids: new Set<string>(),
      isSaved: () => false,
      toggleLocal: () => {},
    } satisfies WishlistContextValue;
  }

  return context;
}
