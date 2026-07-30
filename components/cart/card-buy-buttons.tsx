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
  variant: "default" | "outline";
  formAction: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      variant={variant}
      formAction={formAction}
      disabled={disabled || pending}
      aria-label={label}
      className="w-full"
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
    <form className="grid grid-cols-2 gap-2 px-3 pb-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variantId ?? ""} />
      <input type="hidden" name="quantity" value={1} />

      <SubmitButton
        formAction={addToCartAction}
        variant="outline"
        disabled={disabled}
        label={`Add ${productName} to cart`}
      >
        Add
      </SubmitButton>
      <SubmitButton
        formAction={buyNowAction}
        variant="default"
        disabled={disabled}
        label={`Buy ${productName} now`}
      >
        Buy Now
      </SubmitButton>
    </form>
  );
}
