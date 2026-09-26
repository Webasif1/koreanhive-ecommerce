import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { ComboAddButton } from "@/components/combo/combo-add-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ComboSeed } from "@/data/combos";
import { formatBDT } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import { toTrackItem } from "@/lib/tracking/shared";
import type { TrackItem } from "@/lib/tracking/types";

type ComboProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
};

export type ComboCardData = {
  id: string;
  name: string;
  slug: string;
  concern: string | null;
  description: string | null;
  price: number;
  comparePrice: number | null;
  products: ComboProduct[];
};

/** A bundle is only as available as its scarcest member. */
export function comboLeastStock(combo: ComboCardData) {
  return combo.products.reduce(
    (low, product) => Math.min(low, product.stock),
    Number.POSITIVE_INFINITY,
  );
}

export function comboTrackItems(combo: ComboCardData): TrackItem[] {
  return combo.products.map((product) =>
    toTrackItem({
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      price: product.price,
    }),
  );
}

/** A bundle lasts 2.5–3 months at twice-daily use, per the FAQ below the grid. */
const DAYS_IN_ROUTINE = 90;

/** Tablet gets two columns — poster beside the routine, price underneath —
 *  because a whole square poster at full tablet width is 770px tall. */
const CARD_GRID =
  "grid overflow-hidden border border-border bg-card md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)_300px]";

/**
 * The combo's poster and the labels beneath it.
 *
 * The combo images are square posters with the name, price and routine printed
 * on them. Filling a tall column with object-cover cut that text off the sides
 * on desktop and off the top on a phone, and labels laid over it covered the
 * poster's own headline. So the poster keeps its square, whole, and the labels
 * sit beneath it.
 */
function ComboPoster({
  seed,
  children,
}: {
  seed: ComboSeed | undefined;
  /** Labels shown before the seed's own badge. */
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col bg-white">
      <div className="relative aspect-square w-full bg-blush">
        {seed?.imageUrl && (
          <Image
            src={seed.imageUrl}
            alt={seed.imageAlt}
            fill
            sizes="(min-width: 1024px) 340px, (min-width: 768px) 300px, 100vw"
            className="object-contain"
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 empty:hidden">
        {children}
        {seed?.badge && (
          <Badge variant="ink" size="sm">
            {seed.badge}
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * A combo from the client's document that cannot be bought yet.
 *
 * Its products are not all live — some are not in the catalogue, some are
 * drafts waiting for a photo — so combos:sync has not published it. It is
 * still shown, because the client supplied it and a shopper can see what is
 * coming, but with nothing that could start an order: no Add to cart, no
 * product links (they would 404), no saving (that needs live prices for every
 * product), no stock line and no free-delivery promise.
 *
 * It becomes an ordinary ComboCard on its own once its products are stocked
 * and the sync runs.
 */
export function ComboComingSoonCard({ seed }: { seed: ComboSeed }) {
  return (
    <li className={CARD_GRID}>
      <ComboPoster seed={seed}>
        <Badge variant="secondary">COMING SOON</Badge>
      </ComboPoster>

      <div className="border-t border-border p-6 md:border-l md:border-t-0">
        <p className="eyebrow">{seed.concern}</p>
        <h2 className="mt-2 font-display text-[26px] leading-[1.15] tracking-[-0.01em]">
          {seed.name}
        </h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
          {seed.description}
        </p>

        <ol className="mt-5">
          {seed.steps.map((step, index) => (
            <li
              key={step.slug}
              className="flex items-center gap-3.5 border-t border-hairline py-2.5"
            >
              <span className="w-6 shrink-0 font-mono text-[10.5px] font-semibold text-mulberry-hover">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-semibold leading-snug">
                  {step.name}
                </span>
                <span className="block text-[11px] leading-snug text-muted-foreground">
                  {step.role}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col border-t border-border bg-cream/60 p-6 md:col-span-2 lg:col-span-1 lg:border-l lg:border-t-0 lg:p-7">
        {seed.price !== null && (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] font-semibold">Combo price</span>
            <span className="font-display text-[28px] leading-none text-muted-foreground">
              {formatBDT(seed.price)}
            </span>
          </div>
        )}

        <p className="mt-4 text-[11.5px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Best for:</span>{" "}
          {seed.bestFor}
        </p>

        <div className="flex-1" />

        {/* Where the buttons sit on a live card. Not a button: there is
            nothing to press yet, and a disabled button reads as broken. */}
        <p className="mt-5 border border-dashed border-border bg-white px-4 py-4 text-center text-sm font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Coming soon
        </p>
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-muted-foreground">
          Available once every product in this routine is in stock
        </p>
      </div>
    </li>
  );
}

export function ComboCard({
  combo,
  seed,
  freeDeliveryEverywhereAbove,
}: {
  combo: ComboCardData;
  seed: ComboSeed | undefined;
  /**
   * The highest free-delivery threshold across every zone, or null when no
   * zone offers one.
   *
   * The design prints "এই কম্বোতে ডেলিভারি ফ্রি" on every card. Delivery is
   * free per *zone* here — Dhaka clears at a lower basket than the rest of the
   * country — so a blanket badge would promise something checkout then charges
   * for. It only appears when the price clears every zone.
   */
  freeDeliveryEverywhereAbove: number | null;
}) {
  const saving = combo.comparePrice ? combo.comparePrice - combo.price : 0;
  const perDay = Math.round(combo.price / DAYS_IN_ROUTINE);
  const freeDelivery =
    freeDeliveryEverywhereAbove !== null &&
    combo.price >= freeDeliveryEverywhereAbove;

  const leastStock = comboLeastStock(combo);
  const stockLine =
    leastStock <= 0
      ? "Out of stock"
      : leastStock <= 5
        ? `Only ${leastStock} left`
        : "In stock · ships today";

  return (
    <li className={CARD_GRID}>
      <ComboPoster seed={seed}>
        {saving > 0 && <Badge variant="sale">SAVE {formatBDT(saving)}</Badge>}
      </ComboPoster>

      {/* ------------------------------------------------------ the routine */}
      <div className="border-t border-border p-6 md:border-l md:border-t-0">
        {combo.concern && <p className="eyebrow">{combo.concern}</p>}
        <h2 className="mt-2 font-display text-[26px] leading-[1.15] tracking-[-0.01em]">
          {combo.name}
        </h2>
        {combo.description && (
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
            {combo.description}
          </p>
        )}

        <ol className="mt-5">
          {combo.products.map((product, index) => {
            const step = seed?.steps.find(
              (entry) => entry.slug === product.slug,
            );

            return (
              <li
                key={product.slug}
                className="flex items-center gap-3.5 border-t border-hairline py-2.5"
              >
                {/* Picture first, then the step number — the design reads the
                    routine down the column of thumbnails, and the number is
                    the caption to it rather than a bullet before it. */}
                <span className="relative size-[52px] shrink-0 border border-hairline bg-white">
                  {product.imageUrl && (
                    <Image
                      src={productImage(product.imageUrl)}
                      alt=""
                      fill
                      sizes="52px"
                      className="object-contain"
                    />
                  )}
                </span>
                <span className="w-6 shrink-0 font-mono text-[10.5px] font-semibold text-mulberry-hover">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/product/${product.slug}`}
                    className="block text-[12.5px] font-semibold leading-snug hover:text-primary"
                  >
                    {product.name}
                  </Link>
                  {step && (
                    <span className="block text-[11px] leading-snug text-muted-foreground">
                      {step.role}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[12px] text-muted-foreground">
                  {formatBDT(product.price)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* -------------------------------------------------------- the price */}
      <div className="flex flex-col border-t border-border bg-cream/60 p-6 md:col-span-2 lg:col-span-1 lg:border-l lg:border-t-0 lg:p-7">
        {combo.comparePrice && (
          <div className="flex items-baseline justify-between text-[12.5px] text-muted-foreground">
            <span>Bought separately</span>
            <span className="line-through">{formatBDT(combo.comparePrice)}</span>
          </div>
        )}
        {saving > 0 && (
          <div className="mt-2 flex items-baseline justify-between text-[12.5px] font-semibold text-sale">
            <span>Combo saving</span>
            <span>−{formatBDT(saving)}</span>
          </div>
        )}

        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-hairline pt-4">
          <span className="text-[12.5px] font-semibold">Combo price</span>
          <span className="font-display text-[28px] leading-none">
            {formatBDT(combo.price)}
          </span>
        </div>

        {/* Arithmetic, not a claim: the price across the routine's own stated
            life, which the FAQ under this grid puts at 2.5–3 months. */}
        <p className="mt-1.5 text-[11.5px] text-muted-foreground">
          About {formatBDT(perDay)} a day over three months
        </p>

        {freeDelivery && (
          <p
            lang="bn"
            className="mt-3.5 bg-success-bg px-3 py-2.5 text-[12px] font-bold text-success"
          >
            এই কম্বোতে ডেলিভারি ফ্রি
          </p>
        )}

        {seed && (
          <p className="mt-4 text-[11.5px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Best for:</span>{" "}
            {seed.bestFor}
          </p>
        )}

        {/* Buttons sit at the bottom of the panel whatever the card's height,
            so a row of combos lines its calls to action up. */}
        <div className="flex-1" />

        <div className="mt-5 space-y-2">
          <ComboAddButton
            comboSlug={combo.slug}
            comboPrice={combo.price}
            trackItems={comboTrackItems(combo)}
            disabled={leastStock <= 0}
          />
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/product/${combo.products[0]?.slug ?? ""}`}>
              See what&apos;s inside
            </Link>
          </Button>
        </div>

        {/* The design says "Only 9 combos left" here. That number is invented,
            and scarcity a shop cannot prove is the same problem as a review it
            cannot prove. This is the real figure from the member with the
            least stock. */}
        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-muted-foreground">
          {stockLine}
        </p>
      </div>
    </li>
  );
}
