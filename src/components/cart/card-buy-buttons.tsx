"use client";

import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { addToCartAction, buyNowAction } from "@/server/actions/cart";

/** Buy Now redirects to checkout, so it stays a plain form action — a toast
 *  would be replaced by the navigation before anyone read it. */
function BuyNowButton({ disabled, label }: { disabled?: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="dark"
      formAction={buyNowAction}
      disabled={disabled || pending}
      aria-label={label}
      className="h-12 w-full text-[13px]"
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
}: {
  productId: string;
  variantId: string | null;
  disabled?: boolean;
  productName: string;
}) {
  const [isAdding, startTransition] = useTransition();

  return (
    <form className="mt-3.5 flex flex-col gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variantId ?? ""} />
      <input type="hidden" name="quantity" value={1} />

      <Button
        type="button"
        variant="default"
        disabled={disabled || isAdding}
        aria-label={`Add ${productName} to cart`}
        className="h-12 w-full text-[13px]"
        onClick={() => {
          const data = new FormData();
          data.set("productId", productId);
          data.set("variantId", variantId ?? "");
          data.set("quantity", "1");

          startTransition(async () => {
            const result = await addToCartAction(data);

            if (result.ok) {
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
