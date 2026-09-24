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
  trackItems,
}: {
  comboSlug: string;
  /** Each member at its own price, which is what the cart charges. */
  trackItems: TrackItem[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const data = new FormData();
          data.set("comboSlug", comboSlug);

          const result = await addComboToCartAction(data);

          if (result.ok) {
            notifyCartChanged();
            trackEcommerce("add_to_cart", trackItems);
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        })
      }
    >
      {pending ? "Adding…" : "Add combo to cart"}
    </Button>
  );
}
