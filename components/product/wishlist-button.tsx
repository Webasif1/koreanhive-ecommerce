"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/server/actions/wishlist";

/** Sits over the card image. Optimistic so the heart fills instantly rather
 *  than waiting on the round trip. */
export function WishlistButton({
  productId,
  productName,
  saved,
  className,
}: {
  productId: string;
  productName: string;
  saved: boolean;
  className?: string;
}) {
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);
  const [, startTransition] = useTransition();

  return (
    <form
      action={(formData: FormData) => {
        startTransition(async () => {
          setOptimisticSaved(!optimisticSaved);
          await toggleWishlistAction(formData);
        });
      }}
      className={cn("contents", className)}
    >
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        aria-pressed={optimisticSaved}
        aria-label={
          optimisticSaved
            ? `Remove ${productName} from wishlist`
            : `Save ${productName} to wishlist`
        }
        className="absolute right-2.5 top-2.5 grid size-8 place-items-center border border-border bg-white text-primary transition-colors hover:border-primary"
      >
        <Heart
          className={cn("size-3.5", optimisticSaved && "fill-primary")}
        />
      </button>
    </form>
  );
}
