"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import type { ComboCartLine } from "@/lib/cart-groups";
import { notifyCartChanged } from "@/lib/cart-events";
import { discountPercent, formatBDT } from "@/lib/format";
import { updateComboQuantityAction } from "@/server/actions/cart";

/**
 * A combo in the cart, as one line.
 *
 * The stepper and Remove change whole sets: every product in the combo moves
 * together, so the set can never be half in the cart at the combo price.
 */
export function ComboCartLineRow({ line }: { line: ComboCartLine }) {
  const [isPending, startTransition] = useTransition();
  const off = discountPercent(line.unitPrice, line.comparePrice);

  const setQuantity = (quantity: number) => {
    const data = new FormData();
    data.set("comboSlug", line.slug);
    data.set("quantity", String(quantity));

    startTransition(async () => {
      const result = await updateComboQuantityAction(data);

      if (result.ok) {
        notifyCartChanged();
        if (quantity === 0) toast.success("Removed from cart", { description: line.name });
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <li className="flex gap-3 py-4 sm:gap-4" data-pending={isPending || undefined}>
      <Link
        href={`/combos/${line.slug}`}
        className="relative size-16 shrink-0 overflow-hidden border border-border bg-white sm:size-20"
      >
        {line.imageUrl && (
          <Image
            src={line.imageUrl}
            alt={line.name}
            fill
            sizes="80px"
            className="object-contain"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/combos/${line.slug}`}
          className="text-sm font-bold leading-snug hover:text-primary"
        >
          {line.name}
        </Link>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{formatBDT(line.unitPrice)} each</span>
          {line.comparePrice && (
            <span className="line-through">{formatBDT(line.comparePrice)}</span>
          )}
          {off !== null && (
            <Badge variant="saleSoft" size="sm">
              −{off}%
            </Badge>
          )}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="flex items-center border border-border bg-cream">
            <button
              type="button"
              onClick={() => setQuantity(line.sets - 1)}
              className="grid size-11 place-items-center disabled:opacity-40 lg:size-9"
              disabled={line.sets <= 1 || isPending}
              aria-label={`Decrease quantity of ${line.name}`}
            >
              <Minus className="size-3.5" />
            </button>

            <span className="w-8 text-center text-sm font-bold tabular-nums">
              {line.sets}
            </span>

            <button
              type="button"
              onClick={() => setQuantity(line.sets + 1)}
              className="grid size-11 place-items-center disabled:opacity-40 lg:size-9"
              disabled={line.sets >= line.maxSets || isPending}
              aria-label={`Increase quantity of ${line.name}`}
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setQuantity(0)}
            disabled={isPending}
            className="-mx-2 inline-flex min-h-11 items-center gap-1 px-2 text-xs text-muted-foreground hover:text-destructive disabled:opacity-40 lg:min-h-0"
            aria-label={`Remove ${line.name} from cart`}
          >
            <X className="size-3.5" />
            Remove
          </button>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-display text-sm tabular-nums">{formatBDT(line.lineTotal)}</p>
        {line.comparePrice && (
          <p className="text-xs text-muted-foreground line-through tabular-nums">
            {formatBDT(line.comparePrice * line.sets)}
          </p>
        )}
      </div>
    </li>
  );
}
