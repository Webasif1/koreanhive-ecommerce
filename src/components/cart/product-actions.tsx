"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { FreeDeliveryBar } from "@/components/cart/free-delivery-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addToCartAction, buyNowAction } from "@/server/actions/cart";
import { getCartSummary } from "@/lib/cart-count";
import { notifyCartChanged } from "@/lib/cart-events";
import { trackAddToCart } from "@/lib/tracking/client";
import type { TrackItem } from "@/lib/tracking/types";

type Variant = {
  id: string;
  name: string;
  price: number | null;
  stock: number;
};

/** Buy Now redirects, so it stays a plain form action.
 *
 *  The action is on the <form>, not on this button's formAction — see the
 *  comment on the form below for why that distinction decides whether the
 *  button works at all. */
function BuyNowButton({
  disabled,
  className,
  compact = false,
}: {
  disabled?: boolean;
  className?: string;
  /** the short labels, for the sticky bar where the width is a third of a phone */
  compact?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      variant="dark"
      disabled={disabled || pending}
      className={className}
    >
      {pending
        ? compact
          ? "Opening…"
          : "Taking you to checkout…"
        : compact
          ? "Buy Now"
          : "Buy Now · Cash on Delivery"}
    </Button>
  );
}

/**
 * The buy box. Size selection, quantity, both actions and the free-delivery
 * progress bar, which recalculates as the size and quantity change.
 */
export function ProductActions({
  productId,
  variants,
  basePrice,
  comparePrice,
  baseStock,
  freeShippingThreshold,
  trackItem,
}: {
  productId: string;
  variants: Variant[];
  basePrice: number;
  comparePrice: number | null;
  baseStock: number;
  freeShippingThreshold: number | null;
  /** The product as tracking describes it; size, price and quantity are
   *  filled in from the current selection. */
  trackItem: TrackItem;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [isAdding, startTransition] = useTransition();

  // fetched rather than rendered server-side, so this page stays static.
  // Shared with the header badge's request (lib/cart-count), not a second one.
  useEffect(() => {
    let cancelled = false;

    getCartSummary().then((summary) => {
      if (!cancelled) setCartSubtotal(summary.subtotal);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Phones: once the buy buttons scroll out of view, a bar with the same
  // two actions sits above the bottom nav. It is the same form and the same
  // selection, so the size and quantity chosen above carry into it.
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    const target = buttonsRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) =>
      setShowBar(!entry.isIntersecting),
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // lets the chat launcher lift clear of the bar (globals.css)
  useEffect(() => {
    const root = document.documentElement;
    if (showBar) root.dataset.stickyBuy = "";
    else delete root.dataset.stickyBuy;
    return () => {
      delete root.dataset.stickyBuy;
    };
  }, [showBar]);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const price = selected?.price ?? basePrice;
  const stock = selected ? selected.stock : baseStock;
  const outOfStock = stock <= 0;
  const saving = comparePrice ? comparePrice - price : 0;

  const trackAdd = () =>
    trackAddToCart({
      ...trackItem,
      item_variant: selected?.name ?? trackItem.item_variant,
      price,
      quantity,
    });

  // shared by the buy box and the sticky bar
  const addToCart = () => {
    const data = new FormData();
    data.set("productId", productId);
    data.set("variantId", selectedId);
    data.set("quantity", String(quantity));

    startTransition(async () => {
      const result = await addToCartAction(data);

      if (result.ok) {
        notifyCartChanged();
        trackAdd();
        toast.success(result.message, {
          description: `Quantity ${quantity}`,
        });
        // keep the delivery bar honest after the cart changes
        setCartSubtotal((current) => current + price * quantity);
      } else {
        toast.error(result.message);
      }
    });
  };
  const addLabel = outOfStock
    ? "Out of stock"
    : isAdding
      ? "Adding…"
      : "Add to Cart";

  return (
    /* The action lives here rather than on the Buy Now button's formAction.
       React 19 attaches its submit interceptor per form, and only to a form it
       was given an action for: with no `action` here the rendered markup came
       out as `<form>` with `formaction=""` on the button, so the browser did
       its own native submit and the click simply reloaded the page without
       ever reaching the server. Add to Cart survived only because it is a
       type="button" that calls the action directly. Buy Now is the sole submit
       button in this form, so the form can own the action outright — which
       also makes it work with JavaScript disabled. */
    // onSubmit runs before React hands the form to the action, so Buy Now is
    // tracked even though the action redirects straight to checkout.
    <form
      action={buyNowAction}
      onSubmit={trackAdd}
      className="border border-border bg-white p-4 sm:p-5"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={selectedId} />
      <input type="hidden" name="quantity" value={quantity} />

      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-display text-[30px] sm:text-[34px]">
          {formatBDT(price)}
        </span>
        {comparePrice && comparePrice > price && (
          <span className="text-base text-faint line-through">
            {formatBDT(comparePrice)}
          </span>
        )}
        {saving > 0 && (
          <Badge variant="saleSoft" className="text-[12.5px]">
            You save {formatBDT(saving)}
          </Badge>
        )}
      </div>

      {variants.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {variants.map((variant) => {
            const active = variant.id === selectedId;
            // With one size the price is already the big number above; only
            // repeat it on the chip when there are sizes to compare.
            const detail =
              variant.stock <= 0
                ? "Out of stock"
                : variants.length > 1
                  ? formatBDT(variant.price ?? basePrice)
                  : null;

            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setSelectedId(variant.id);
                  setQuantity(1);
                }}
                disabled={variant.stock <= 0}
                className={cn(
                  "min-h-11 border px-3.5 py-2 text-[13px] font-semibold transition-colors lg:min-h-0 disabled:cursor-not-allowed disabled:opacity-40",
                  active
                    ? "border-primary bg-blush text-primary"
                    : "border-border bg-white hover:border-primary/50",
                )}
              >
                {variant.name}
                {detail ? (
                  <span className="font-medium opacity-70"> · {detail}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      <div ref={buttonsRef}>
        <div className="mt-4 flex items-stretch gap-2.5">
          <div className="flex items-center border border-border bg-cream">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-12 w-11 text-lg text-muted-foreground disabled:opacity-40 lg:w-10"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-9 text-center text-[15px] font-bold tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))}
              className="h-12 w-11 text-lg text-muted-foreground disabled:opacity-40 lg:w-10"
              disabled={outOfStock || quantity >= stock}
              aria-label="Increase quantity"
            >
              ＋
            </button>
          </div>

          <Button
            type="button"
            size="lg"
            variant="default"
            disabled={outOfStock || isAdding}
            className="h-12 flex-1"
            onClick={addToCart}
          >
            {addLabel}
          </Button>
        </div>

        <BuyNowButton disabled={outOfStock} className="mt-2.5 h-12 w-full" />
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-2 border-t border-border bg-white px-4 py-2.5 shadow-[0_-4px_14px_rgba(36,26,36,0.08)] transition-[translate,opacity] duration-200 motion-reduce:transition-none lg:hidden",
          showBar
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0",
        )}
        // hidden copies of the buttons stay out of the tab order and the
        // accessibility tree; the originals above are the real ones
        inert={!showBar}
      >
        <div className="min-w-0 shrink-0 pr-1">
          <div className="font-display text-lg leading-none tabular-nums">
            {formatBDT(price)}
          </div>
          {quantity > 1 && (
            <div className="mt-1 text-[11px] text-muted-foreground">
              Qty {quantity}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="default"
          disabled={outOfStock || isAdding}
          className="h-11 min-w-0 flex-1 px-2 text-[13px]"
          onClick={addToCart}
        >
          {addLabel}
        </Button>
        <BuyNowButton
          compact
          disabled={outOfStock}
          className="h-11 min-w-0 flex-1 px-2 text-[13px]"
        />
      </div>

      <FreeDeliveryBar
        subtotal={cartSubtotal + price * quantity}
        threshold={freeShippingThreshold}
        className="mt-4 p-3"
      />

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border pt-4">
        {[
          { title: "100% authentic", sub: "Sealed, imported from Korea" },
          { title: "Cash on delivery", sub: "Pay when it arrives" },
          { title: "1–2 days in Dhaka", sub: "2–4 days nationwide" },
          { title: "7-day returns", sub: "Unopened products" },
        ].map((item) => (
          <div key={item.title} className="flex gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <div>
              <div className="text-[12.5px] font-bold">{item.title}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {item.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}
