"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { notifyCartChanged } from "@/lib/cart-events";
import { trackEcommerce } from "@/lib/tracking/client";
import type { TrackItem } from "@/lib/tracking/types";
import { addComboToCartAction } from "@/server/actions/cart";

/**
 * "Add combo to cart".
 *
 * Client-side only so the header count can update without a reload — the
 * server action does the work and the transition keeps the button honest while
 * it runs. Four products go into the cart one at a time on the server, which
 * takes a moment; a button that looks idle through that gets clicked twice.
 */
export function ComboAddButton({
  comboSlug,
  comboPrice,
  trackItems,
  disabled = false,
}: {
  comboSlug: string;
  /** What the set costs in the cart once its combo saving applies. */
  comboPrice: number;
  /** The members, reported at their own prices; the event value is the combo price. */
  trackItems: TrackItem[];
  /** A member is out of stock, so the set cannot be added. */
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      className="w-full"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const data = new FormData();
          data.set("comboSlug", comboSlug);

          const result = await addComboToCartAction(data);

          if (result.ok) {
            notifyCartChanged();
            trackEcommerce("add_to_cart", trackItems, { value: comboPrice });
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        })
      }
    >
      {disabled ? "Out of stock" : pending ? "Adding…" : "Add combo to cart"}
    </Button>
  );
}
