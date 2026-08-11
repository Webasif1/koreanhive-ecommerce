"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { addToCartAction, buyNowAction } from "@/server/actions/cart";

function SubmitButton({
  children,
  variant,
  formAction,
  disabled,
  label,
}: {
  children: React.ReactNode;
  variant: "default" | "dark";
  formAction: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      formAction={formAction}
      disabled={disabled || pending}
      aria-label={label}
      className="h-12 w-full text-[13px]"
    >
      {children}
    </Button>
  );
}

/** Sits below the card link — a form cannot be nested inside an anchor. */
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
  return (
    <form className="mt-3.5 flex flex-col gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variantId ?? ""} />
      <input type="hidden" name="quantity" value={1} />

      <SubmitButton
        formAction={addToCartAction}
        variant="default"
        disabled={disabled}
        label={`Add ${productName} to cart`}
      >
        {disabled ? "Out of stock" : "Add to Cart"}
      </SubmitButton>
      <SubmitButton
        formAction={buyNowAction}
        variant="dark"
        disabled={disabled}
        label={`Buy ${productName} now`}
      >
        Buy Now
      </SubmitButton>
    </form>
  );
}
