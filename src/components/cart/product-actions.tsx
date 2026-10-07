"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { FreeDeliveryBar } from "@/components/cart/free-delivery-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { siteConfig } from "@/lib/site";
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
      {pending ? (compact ? "Opening…" : "Taking you to checkout…") : "Buy Now"}
    </Button>
  );
}

const WHATSAPP_ICON =
  "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.93.96-3.48-.23-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.9.99 6.68 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44Zm8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.3l5.7-1.5a11.33 11.33 0 0 0 5.77 1.47h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.33-8.03Z";

const MESSENGER_ICON =
  "M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.15.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.09.53-.04.91.25 1.88.38 2.91.38 5.64 0 10-4.13 10-9.7S17.64 2 12 2Zm6 7.46-2.94 4.66a1.5 1.5 0 0 1-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66a1.5 1.5 0 0 1 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63Z";

/**
 * The buy box. Size selection, quantity, both actions and the free-delivery
 * progress bar, which recalculates as the size and quantity change.
 */
export function ProductActions({
  productId,
  productName,
  productUrl,
  variants,
  basePrice,
  comparePrice,
  baseStock,
  freeShippingThreshold,
  trackItem,
}: {
  productId: string;
  productName: string;
  /** absolute, so staff can open it from the chat */
  productUrl: string;
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

  // Order by chat: the message carries the current size and quantity, so
  // staff can take the order without a round of "which one?"
  const orderText = [
    "Hi Korean Hive! I'd like to order:",
    `${productName}${selected ? ` (${selected.name})` : ""}`,
    `Quantity: ${quantity} · ${formatBDT(price * quantity)}`,
    productUrl,
  ].join("\n");
  const whatsappNumber = siteConfig.contact.whatsapp?.replace(/\D/g, "");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?${new URLSearchParams({ text: orderText })}`
    : null;
  const messengerHref = `${siteConfig.social.messenger}?${new URLSearchParams({ text: orderText })}`;

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
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={selectedId} />
      <input type="hidden" name="quantity" value={quantity} />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border pb-5">
        <span className="font-display text-[32px] leading-none text-primary sm:text-[38px]">
          {formatBDT(price)}
        </span>
        {comparePrice && comparePrice > price && (
          <span className="text-lg text-faint line-through">
            {formatBDT(comparePrice)}
          </span>
        )}
        {saving > 0 && (
          <Badge variant="saleSoft" className="rounded-md text-[12.5px]">
            Save {formatBDT(saving)}
          </Badge>
        )}
      </div>

      {variants.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
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

      <div ref={buttonsRef} className="mt-5">
        {/* phones: stepper + Add to Cart, then Buy Now on its own row;
            from sm up all three share one row */}
        <div className="flex flex-wrap items-stretch gap-2.5">
          <div className="flex items-center rounded-md border border-border bg-white">
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

          <BuyNowButton
            disabled={outOfStock}
            className="h-12 basis-full sm:basis-0 sm:flex-1"
          />
        </div>

        <div
          className={cn(
            "mt-2.5 grid gap-2.5",
            whatsappHref && "grid-cols-2",
          )}
        >
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#25D366] px-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 sm:text-sm"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5 shrink-0">
                <path d={WHATSAPP_ICON} />
              </svg>
              <span className="max-[400px]:hidden">Order on</span> WhatsApp
            </a>
          )}
          <a
            href={messengerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-md bg-[#0084FF] px-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 sm:text-sm"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5 shrink-0">
              <path d={MESSENGER_ICON} />
            </svg>
            <span className="max-[400px]:hidden">Order on</span> Messenger
          </a>
        </div>
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
