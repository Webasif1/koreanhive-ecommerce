"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/server/queries/catalog";

const PLACEHOLDER = "Search products — serum, sunscreen, Anua, acne care…";
const INPUT_CLASS =
  "w-full bg-transparent text-sm outline-none placeholder:text-faint";
/** One request per typing pause rather than per keystroke. */
const DEBOUNCE_MS = 200;
/** Matches buildSearchScope, which ignores single characters. */
const MIN_LENGTH = 2;

/** The matched run in bold, the rest normal — so it is obvious why a row is
 *  in the list. Falls back to the plain name when the term is not a literal
 *  substring (a brand or category match, for instance). */
function Highlighted({ text, term }: { text: string; term: string }) {
  const at = text.toLowerCase().indexOf(term.toLowerCase());
  if (term.length === 0 || at === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <span className="font-bold">{text.slice(at, at + term.length)}</span>
      {text.slice(at + term.length)}
    </>
  );
}

export function HeaderSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listId = useId();

  const [value, setValue] = useState(searchParams.get("q") ?? "");
  // the term is stored with its results so they can be discarded on render
  // when they no longer belong to what is in the box
  const [data, setData] = useState<{
    term: string;
    products: SearchSuggestion[];
  }>({ term: "", products: [] });
  const [open, setOpen] = useState(false);
  // -1 means "nothing highlighted", so Enter submits the form instead
  const [active, setActive] = useState(-1);

  // navigating to a new search should show the new query, not the stale one
  const urlQuery = searchParams.get("q") ?? "";
  const [syncedTo, setSyncedTo] = useState(urlQuery);
  if (syncedTo !== urlQuery) {
    setSyncedTo(urlQuery);
    setValue(urlQuery);
    setOpen(false);
  }

  const term = value.trim();

  useEffect(() => {
    if (term.length < MIN_LENGTH) return;

    // Aborting matters more than the saved bandwidth: without it a slow
    // response for "ser" can land after a fast one for "serum" and replace the
    // list with results for a query the shopper has already typed past.
    const controller = new AbortController();

    const timer = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { products: [] }))
        .then((body: { products: SearchSuggestion[] }) => {
          setData({ term, products: body.products });
          setActive(-1);
        })
        // an aborted or failed lookup just means no suggestions; the form
        // still submits and /search still works
        .catch(() => {});
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  // results for an older term are simply not rendered, so there is no state to
  // clear when the query changes
  const results = data.term === term ? data.products : [];
  const loading = data.term !== term && term.length >= MIN_LENGTH;
  const showList = open && term.length >= MIN_LENGTH;
  const rowCount = results.length;

  const goTo = (slug: string) => {
    setOpen(false);
    router.push(`/product/${slug}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      // close, but keep what was typed — clearing it is never what was meant
      setOpen(false);
      return;
    }

    if (!showList || rowCount === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % rowCount);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current <= 0 ? rowCount - 1 : current - 1));
    } else if (event.key === "Enter" && active >= 0) {
      // with a row highlighted, Enter opens it; otherwise the form submits
      event.preventDefault();
      goTo(results[active].slug);
    }
  };

  return (
    <form
      action="/search"
      className="relative order-3 col-span-2 flex h-11 items-center gap-2.5 border border-border bg-cream px-3.5 lg:order-none lg:col-span-1 lg:h-[46px]"
      onBlur={(event) => {
        // without the relatedTarget check, blur fires before a click on a row
        // registers and the navigation is lost
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
        className="size-4 shrink-0 text-faint"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>

      <input
        name="q"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={PLACEHOLDER}
        aria-label="Search products"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          active >= 0 ? `${listId}-option-${active}` : undefined
        }
        autoComplete="off"
        className={INPUT_CLASS}
      />

      <button
        type="submit"
        className="hidden shrink-0 text-[11px] font-semibold tracking-[0.06em] text-primary sm:block"
      >
        SEARCH
      </button>

      {showList && (
        <div
          id={listId}
          role="listbox"
          aria-label="Product suggestions"
          className="absolute inset-x-0 top-full z-50 mt-1 border border-border bg-white shadow-lg"
        >
          <p className="sr-only" role="status">
            {rowCount} {rowCount === 1 ? "suggestion" : "suggestions"}
          </p>

          {results.map((product, index) => (
            <button
              key={product.slug}
              type="button"
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === active}
              onPointerDown={(event) => {
                // fires before blur, so the row survives the focus change
                event.preventDefault();
                goTo(product.slug);
              }}
              onMouseEnter={() => setActive(index)}
              className={cn(
                "flex w-full items-center gap-3 border-b border-hairline px-3 py-2.5 text-left last:border-b-0",
                index === active ? "bg-blush" : "bg-white",
              )}
            >
              <span className="relative size-9 shrink-0 border border-border bg-blush">
                {product.imageUrl && (
                  <Image
                    src={product.imageUrl}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] leading-snug">
                <Highlighted text={product.name} term={term} />
              </span>
              <span className="shrink-0 text-xs text-faint tabular-nums">
                {formatBDT(product.price)}
              </span>
            </button>
          ))}

          {rowCount === 0 ? (
            <p className="px-3 py-3 text-[13px] text-muted-foreground">
              {loading ? "Searching…" : `No products match “${term}”.`}
            </p>
          ) : (
            <button
              type="submit"
              className="block w-full border-t border-border px-3 py-2.5 text-left text-xs font-semibold text-primary hover:bg-blush"
            >
              See all results for “{term}”
            </button>
          )}
        </div>
      )}
    </form>
  );
}

/** Shown while the client component is held back by Suspense. Same box, so
 *  the header does not reflow when the real one swaps in. */
export function HeaderSearchInputFallback() {
  return (
    <form
      action="/search"
      className="order-3 col-span-2 flex h-11 items-center gap-2.5 border border-border bg-cream px-3.5 lg:order-none lg:col-span-1 lg:h-[46px]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
        className="size-4 shrink-0 text-faint"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        name="q"
        placeholder={PLACEHOLDER}
        aria-label="Search products"
        className={INPUT_CLASS}
      />
      <button
        type="submit"
        className="hidden shrink-0 text-[11px] font-semibold tracking-[0.06em] text-primary sm:block"
      >
        SEARCH
      </button>
    </form>
  );
}
