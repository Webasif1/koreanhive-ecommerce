import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";

import { formatBDT } from "@/lib/format";
import {
  removeCartLineAction,
  updateCartQuantityAction,
} from "@/server/actions/cart";
import type { CartLine } from "@/server/queries/cart";

/** Quantity controls are individual forms, so the cart works without JS. */
export function CartLineRow({ line }: { line: CartLine }) {
  return (
    <li className="flex gap-4 py-4">
      <Link
        href={`/product/${line.slug}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted"
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
          className="text-sm font-medium leading-snug hover:text-primary"
        >
          {line.name}
        </Link>
        {line.variantName && (
          <p className="text-xs text-muted-foreground">{line.variantName}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatBDT(line.unitPrice)} each
        </p>

        <div className="mt-1 flex items-center gap-2">
          <div className="flex items-center rounded-lg border">
            <form action={updateCartQuantityAction}>
              <input type="hidden" name="productId" value={line.productId} />
              <input
                type="hidden"
                name="variantId"
                value={line.variantId ?? ""}
              />
              <input
                type="hidden"
                name="quantity"
                value={line.quantity - 1}
              />
              <button
                type="submit"
                className="grid size-8 place-items-center disabled:opacity-40"
                disabled={line.quantity <= 1}
                aria-label={`Decrease quantity of ${line.name}`}
              >
                <Minus className="size-3.5" />
              </button>
            </form>

            <span className="w-8 text-center text-sm tabular-nums">
              {line.quantity}
            </span>

            <form action={updateCartQuantityAction}>
              <input type="hidden" name="productId" value={line.productId} />
              <input
                type="hidden"
                name="variantId"
                value={line.variantId ?? ""}
              />
              <input
                type="hidden"
                name="quantity"
                value={line.quantity + 1}
              />
              <button
                type="submit"
                className="grid size-8 place-items-center disabled:opacity-40"
                disabled={line.quantity >= line.stock}
                aria-label={`Increase quantity of ${line.name}`}
              >
                <Plus className="size-3.5" />
              </button>
            </form>
          </div>

          <form action={removeCartLineAction}>
            <input type="hidden" name="productId" value={line.productId} />
            <input type="hidden" name="variantId" value={line.variantId ?? ""} />
            <button
              type="submit"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${line.name} from cart`}
            >
              <X className="size-3.5" />
              Remove
            </button>
          </form>
        </div>
      </div>

      <p className="font-display text-sm font-semibold tabular-nums">
        {formatBDT(line.lineTotal)}
      </p>
    </li>
  );
}
