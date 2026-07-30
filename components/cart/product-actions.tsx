"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addToCartAction, buyNowAction } from "@/server/actions/cart";

type Variant = {
  id: string;
  name: string;
  price: number | null;
  stock: number;
};

function SubmitButton({
  children,
  variant = "default",
  formAction,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
  formAction: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      variant={variant}
      formAction={formAction}
      disabled={disabled || pending}
      className="w-full"
    >
      {children}
    </Button>
  );
}

/** Variant + quantity selection, Add to Cart and Buy Now in one form. Buy Now
 *  posts the same data and redirects to checkout. */
export function ProductActions({
  productId,
  variants,
  basePrice,
  baseStock,
}: {
  productId: string;
  variants: Variant[];
  basePrice: number;
  baseStock: number;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const price = selected?.price ?? basePrice;
  const stock = selected ? selected.stock : baseStock;
  const outOfStock = stock <= 0;

  return (
    <form className="space-y-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={selectedId} />
      <input type="hidden" name="quantity" value={quantity} />

      <p className="font-display text-2xl font-semibold">{formatBDT(price)}</p>

      {variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Size</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setSelectedId(variant.id);
                  setQuantity(1);
                }}
                disabled={variant.stock <= 0}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  variant.id === selectedId
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-input hover:border-primary/50",
                )}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <p className="text-sm font-medium">Quantity</p>
        <div className="flex items-center rounded-lg border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-lg leading-none disabled:opacity-40"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))}
            className="px-3 py-2 text-lg leading-none disabled:opacity-40"
            disabled={outOfStock || quantity >= stock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {outOfStock ? (
          <Badge variant="muted">Out of stock</Badge>
        ) : (
          <Badge variant="success">In stock</Badge>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <SubmitButton
          formAction={addToCartAction}
          variant="outline"
          disabled={outOfStock}
        >
          Add to Cart
        </SubmitButton>
        <SubmitButton formAction={buyNowAction} disabled={outOfStock}>
          Buy Now
        </SubmitButton>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Buy Now takes you straight to checkout. Pay cash when it arrives.
      </p>
    </form>
  );
}
