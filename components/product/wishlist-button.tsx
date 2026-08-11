"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useWishlist } from "@/components/product/wishlist-provider";
import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/server/actions/wishlist";

/**
 * Saved state comes from the client-side provider rather than a server prop,
 * which is what lets listing pages stay statically rendered. The local toggle
 * fires first so the heart fills instantly; the server action confirms.
 */
export function WishlistButton({
  productId,
  productName,
  className,
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const { isSaved, toggleLocal } = useWishlist();
  const [isPending, startTransition] = useTransition();

  const saved = isSaved(productId);

  return (
    <form
      action={(formData: FormData) => {
        const wasSaved = saved;
        toggleLocal(productId);

        startTransition(async () => {
          const result = await toggleWishlistAction(formData);

          if (!result?.ok) {
            // put the heart back if the server refused
            toggleLocal(productId);
            toast.error(result?.message ?? "Could not update your wishlist.");
            return;
          }

          toast.success(
            wasSaved ? "Removed from wishlist" : "Saved to wishlist",
            { description: productName },
          );
        });
      }}
      className={cn("contents", className)}
    >
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        disabled={isPending}
        aria-pressed={saved}
        aria-label={
          saved
            ? `Remove ${productName} from wishlist`
            : `Save ${productName} to wishlist`
        }
        className="absolute right-2.5 top-2.5 grid size-8 place-items-center border border-border bg-white text-primary transition-colors hover:border-primary disabled:opacity-60"
      >
        <Heart className={cn("size-3.5", saved && "fill-primary")} />
      </button>
    </form>
  );
}
