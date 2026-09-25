"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { formatBDT } from "@/lib/format";
import { productImage } from "@/lib/product-image";
import {
  removeCartLineAction,
  updateCartQuantityAction,
} from "@/server/actions/cart";
import type { CartLine } from "@/server/queries/cart";
import { notifyCartChanged } from "@/lib/cart-events";

export function CartLineRow({ line }: { line: CartLine }) {
  const [isPending, startTransition] = useTransition();

  const run = (
    action: (data: FormData) => Promise<{ ok: boolean; message: string }>,
    extra: Record<string, string> = {},
    successMessage?: string,
  ) => {
    const data = new FormData();
    data.set("productId", line.productId);
    data.set("variantId", line.variantId ?? "");
    for (const [key, value] of Object.entries(extra)) data.set(key, value);

    startTransition(async () => {
      const result = await action(data);

      if (result.ok) {
        notifyCartChanged();
        // the action may clamp to available stock and say so — that message
        // matters more than the generic one this call asked for
        if (result.message && result.message !== "Cart updated") {
          toast.info(result.message, { description: line.name });
        } else if (successMessage) {
          toast.success(successMessage, { description: line.name });
        }
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <li className="flex gap-3 py-4 sm:gap-4" data-pending={isPending || undefined}>
      <Link
        href={`/product/${line.slug}`}
        className="relative size-16 shrink-0 overflow-hidden border border-border bg-white sm:size-20"
      >
        {line.imageUrl && (
          <Image
            src={productImage(line.imageUrl)}
            alt={line.name}
            fill
            sizes="80px"
            className="object-contain p-1"
          />
        )}
      </Link>

      {/* min-w-0: without it a long product name refused to shrink and
          pushed the row, and the whole page, sideways at 320px */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/product/${line.slug}`}
          className="text-sm font-bold leading-snug hover:text-primary"
        >
          {line.name}
        </Link>
        {line.variantName && (
          <p className="text-xs text-muted-foreground">{line.variantName}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatBDT(line.unitPrice)} each
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center border border-border bg-cream">
            <button
              type="button"
              onClick={() =>
                run(updateCartQuantityAction, {
                  quantity: String(line.quantity - 1),
                })
              }
              className="grid size-11 place-items-center disabled:opacity-40 lg:size-9"
              disabled={line.quantity <= 1 || isPending}
              aria-label={`Decrease quantity of ${line.name}`}
            >
              <Minus className="size-3.5" />
            </button>

            <span className="w-8 text-center text-sm font-bold tabular-nums">
              {line.quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                run(updateCartQuantityAction, {
                  quantity: String(line.quantity + 1),
                })
              }
              className="grid size-11 place-items-center disabled:opacity-40 lg:size-9"
              disabled={line.quantity >= line.stock || isPending}
              aria-label={`Increase quantity of ${line.name}`}
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => run(removeCartLineAction, {}, "Removed from cart")}
            disabled={isPending}
            className="-mx-2 inline-flex min-h-11 items-center gap-1 px-2 text-xs text-muted-foreground hover:text-destructive disabled:opacity-40 lg:min-h-0"
            aria-label={`Remove ${line.name} from cart`}
          >
            <X className="size-3.5" />
            Remove
          </button>
        </div>
      </div>

      <p className="shrink-0 font-display text-sm tabular-nums">
        {formatBDT(line.lineTotal)}
      </p>
    </li>
  );
}
