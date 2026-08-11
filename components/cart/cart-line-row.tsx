"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { formatBDT } from "@/lib/format";
import {
  removeCartLineAction,
  updateCartQuantityAction,
} from "@/server/actions/cart";
import type { CartLine } from "@/server/queries/cart";

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
        if (successMessage) {
          toast.success(successMessage, { description: line.name });
        }
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <li className="flex gap-4 py-4" data-pending={isPending || undefined}>
      <Link
        href={`/product/${line.slug}`}
        className="relative size-20 shrink-0 overflow-hidden border border-border bg-blush"
      >
        {line.imageUrl && (
          <Image
            src={line.imageUrl}
            alt={line.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
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

        <div className="mt-1 flex items-center gap-3">
          <div className="flex items-center border border-border bg-cream">
            <button
              type="button"
              onClick={() =>
                run(updateCartQuantityAction, {
                  quantity: String(line.quantity - 1),
                })
              }
              className="grid size-9 place-items-center disabled:opacity-40"
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
              className="grid size-9 place-items-center disabled:opacity-40"
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
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-40"
            aria-label={`Remove ${line.name} from cart`}
          >
            <X className="size-3.5" />
            Remove
          </button>
        </div>
      </div>

      <p className="font-display text-sm tabular-nums">
        {formatBDT(line.lineTotal)}
      </p>
    </li>
  );
}
