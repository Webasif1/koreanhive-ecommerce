"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { FreeDeliveryBar } from "@/components/cart/free-delivery-bar";
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
  variant,
  formAction,
  disabled,
  className,
}: {
  children: React.ReactNode;
  variant: "default" | "dark";
  formAction: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      variant={variant}
      formAction={formAction}
      disabled={disabled || pending}
      className={className}
    >
      {children}
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
  cartSubtotal,
  freeShippingThreshold,
}: {
  productId: string;
  variants: Variant[];
  basePrice: number;
  comparePrice: number | null;
  baseStock: number;
  cartSubtotal: number;
  freeShippingThreshold: number | null;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const price = selected?.price ?? basePrice;
  const stock = selected ? selected.stock : baseStock;
  const outOfStock = stock <= 0;
  const saving = comparePrice ? comparePrice - price : 0;

  return (
    <form className="border border-border bg-white p-6">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={selectedId} />
      <input type="hidden" name="quantity" value={quantity} />

      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-display text-[34px]">{formatBDT(price)}</span>
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
        <div className="mt-5 flex flex-wrap gap-2.5">
          {variants.map((variant) => {
            const active = variant.id === selectedId;
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
                  "border px-4 py-3 text-left text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  active
                    ? "border-primary bg-blush text-primary"
                    : "border-border bg-white hover:border-primary/50",
                )}
              >
                <span className="block">{variant.name}</span>
                <span className="mt-0.5 block text-[11px] font-medium opacity-70">
                  {variant.stock <= 0
                    ? "Out of stock"
                    : formatBDT(variant.price ?? basePrice)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-stretch gap-3">
        <div className="flex items-center border border-border bg-cream">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-[54px] w-[42px] text-lg text-muted-foreground disabled:opacity-40"
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
            className="h-[54px] w-[42px] text-lg text-muted-foreground disabled:opacity-40"
            disabled={outOfStock || quantity >= stock}
            aria-label="Increase quantity"
          >
            ＋
          </button>
        </div>

        <SubmitButton
          formAction={addToCartAction}
          variant="default"
          disabled={outOfStock}
          className="flex-1"
        >
          {outOfStock ? "Out of stock" : "Add to Cart"}
        </SubmitButton>
      </div>

      <SubmitButton
        formAction={buyNowAction}
        variant="dark"
        disabled={outOfStock}
        className="mt-2.5 w-full"
      >
        Buy Now · Cash on Delivery
      </SubmitButton>

      <FreeDeliveryBar
        subtotal={cartSubtotal + price * quantity}
        threshold={freeShippingThreshold}
        className="mt-4"
      />

      <div className="mt-5 grid grid-cols-2 gap-3">
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
