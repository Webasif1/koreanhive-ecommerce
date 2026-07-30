"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { cn } from "@/lib/utils";

type Variant = {
  id: string;
  name: string;
  price: number | null;
  stock: number;
};

export function VariantPicker({
  variants,
  basePrice,
  baseStock,
}: {
  variants: Variant[];
  basePrice: number;
  baseStock: number;
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const price = selected?.price ?? basePrice;
  const stock = selected ? selected.stock : baseStock;
  const outOfStock = stock <= 0;

  return (
    <div className="space-y-5">
      <p className="font-display text-2xl font-semibold">{formatBDT(price)}</p>

      {variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Size</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
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

      <div className="space-y-2">
        <Button size="lg" className="w-full" disabled>
          Add to Cart
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Cart and cash-on-delivery checkout arrive in Step 6.
        </p>
      </div>
    </div>
  );
}
