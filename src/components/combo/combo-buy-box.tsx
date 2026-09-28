"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notifyCartChanged } from "@/lib/cart-events";
import { discountPercent, formatBDT } from "@/lib/format";
import { trackEcommerce } from "@/lib/tracking/client";
import type { TrackItem } from "@/lib/tracking/types";
import {
  addComboToCartAction,
  buyComboNowAction,
} from "@/server/actions/cart";

/** Submits the form, whose action is Buy Now — see ProductActions for why
 *  the action sits on the form rather than on this button. */
function BuyNowButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      variant="dark"
      disabled={disabled || pending}
      className="h-12 flex-1"
    >
      {pending ? "Opening checkout…" : "Buy Now"}
    </Button>
  );
}

/**
 * The combo's buy box: price, quantity, Buy Now and Add to Cart.
 *
 * Quantity is in sets. Both buttons send only the combo slug and the number
 * of sets; the server looks the products up, so the form cannot be edited to
 * name cheaper ones.
 */
export function ComboBuyBox({
  comboSlug,
  price,
  comparePrice,
  maxSets,
  trackItems,
}: {
  comboSlug: string;
  price: number;
  comparePrice: number | null;
  /** the scarcest member's stock */
  maxSets: number;
  trackItems: TrackItem[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, startTransition] = useTransition();

  const outOfStock = maxSets <= 0;
  const saving = comparePrice ? comparePrice - price : 0;
  const off = discountPercent(price, comparePrice);

  const track = () =>
    trackEcommerce("add_to_cart", trackItems, { value: price * quantity });

  const addToCart = () => {
    const data = new FormData();
    data.set("comboSlug", comboSlug);
    data.set("quantity", String(quantity));

    startTransition(async () => {
      const result = await addComboToCartAction(data);

      if (result.ok) {
        notifyCartChanged();
        track();
        toast.success(result.message, { description: `Quantity ${quantity}` });
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    // onSubmit runs before the redirect, so Buy Now is tracked too
    <form action={buyComboNowAction} onSubmit={track}>
      <input type="hidden" name="comboSlug" value={comboSlug} />
      <input type="hidden" name="quantity" value={quantity} />

      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-display text-[32px] leading-none sm:text-[38px]">
          {formatBDT(price)}
        </span>
        {comparePrice && (
          <span className="text-lg text-faint line-through">
            {formatBDT(comparePrice)}
          </span>
        )}
        {saving > 0 && (
          <Badge variant="saleSoft" className="text-[12.5px]">
            You save {formatBDT(saving)}
            {off !== null && ` (${off}% OFF)`}
          </Badge>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-stretch gap-2.5">
        <div className="flex items-center border border-border bg-cream">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-12 w-11 text-lg text-muted-foreground disabled:opacity-40"
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
            onClick={() => setQuantity((q) => Math.min(Math.max(maxSets, 1), q + 1))}
            className="h-12 w-11 text-lg text-muted-foreground disabled:opacity-40"
            disabled={outOfStock || quantity >= maxSets}
            aria-label="Increase quantity"
          >
            ＋
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2.5">
        <BuyNowButton disabled={outOfStock} />
        <Button
          type="button"
          size="lg"
          disabled={outOfStock || isAdding}
          className="h-12 flex-1"
          onClick={addToCart}
        >
          <ShoppingBag className="size-4" aria-hidden />
          {outOfStock ? "Out of stock" : isAdding ? "Adding…" : "Add to Cart"}
        </Button>
      </div>
    </form>
  );
}
