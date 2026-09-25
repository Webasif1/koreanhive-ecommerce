"use client";

import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { addToCartAction, buyNowAction } from "@/server/actions/cart";
import { notifyCartChanged } from "@/lib/cart-events";
import { trackAddToCart } from "@/lib/tracking/client";
import type { TrackItem } from "@/lib/tracking/types";

/** Buy Now redirects to checkout, so it stays a plain form action — a toast
 *  would be replaced by the navigation before anyone read it.
 *
 *  The action is on the <form>, not on this button's formAction — see the
 *  comment on the form below for why that distinction decides whether the
 *  button works at all. */
function BuyNowButton({ disabled, label }: { disabled?: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="dark"
      disabled={disabled || pending}
      aria-label={label}
      className="h-10 w-full text-[12.5px] sm:h-12 sm:text-[13px]"
    >
      {pending ? "Taking you to checkout…" : "Buy Now"}
    </Button>
  );
}

export function CardBuyButtons({
  productId,
  variantId,
  disabled,
  productName,
  trackItem,
}: {
  productId: string;
  variantId: string | null;
  disabled?: boolean;
  productName: string;
  trackItem: TrackItem;
}) {
  const [isAdding, startTransition] = useTransition();
  const trackAdd = () => trackAddToCart(trackItem);

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
    <form
      action={buyNowAction}
      onSubmit={trackAdd}
      className="mt-3 flex flex-col gap-1.5 sm:mt-3.5 sm:gap-2"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variantId ?? ""} />
      <input type="hidden" name="quantity" value={1} />

      <Button
        type="button"
        variant="default"
        disabled={disabled || isAdding}
        aria-label={`Add ${productName} to cart`}
        className="h-10 w-full text-[12.5px] sm:h-12 sm:text-[13px]"
        onClick={() => {
          const data = new FormData();
          data.set("productId", productId);
          data.set("variantId", variantId ?? "");
          data.set("quantity", "1");

          startTransition(async () => {
            const result = await addToCartAction(data);

            if (result.ok) {
              notifyCartChanged();
              trackAdd();
              toast.success(result.message, { description: productName });
            } else {
              toast.error(result.message);
            }
          });
        }}
      >
        {disabled ? "Out of stock" : isAdding ? "Adding…" : "Add to Cart"}
      </Button>

      <BuyNowButton disabled={disabled} label={`Buy ${productName} now`} />
    </form>
  );
}
