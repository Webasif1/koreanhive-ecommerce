import Image from "next/image";
import Link from "next/link";

import { formatBDT } from "@/lib/format";
import type { ChatProductCard as ChatProductCardData } from "@/lib/chatbot/types";

/**
 * A recommendation.
 *
 * Every value on this card — name, price, stock — comes from the structured
 * part of the response rather than from parsed prose, so a formatting slip can
 * never turn into a wrong price. The link is built from the slug, never from
 * anything the shopper typed.
 */
export function ChatProductCard({ product }: { product: ChatProductCardData }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="flex gap-3 border border-border bg-white p-2.5 transition-colors hover:border-primary"
    >
      <span className="relative size-16 shrink-0 border border-hairline bg-blush">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="64px"
            className="object-contain p-1"
          />
        )}
      </span>

      <span className="min-w-0 flex-1">
        {product.brand && (
          <span className="block text-[10px] font-semibold tracking-[0.06em] text-faint uppercase">
            {product.brand}
          </span>
        )}

        <span className="block text-[13px] leading-snug font-semibold text-ink">
          {product.name}
        </span>

        <span className="mt-1 flex items-center gap-2">
          <span className="text-[13px] font-bold tabular-nums text-primary">
            {formatBDT(product.price)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-[11px] text-faint line-through tabular-nums">
              {formatBDT(product.comparePrice)}
            </span>
          )}
          {product.ratingCount > 0 && (
            <span className="text-[11px] text-faint tabular-nums">
              ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount})
            </span>
          )}
        </span>

        {product.reason && (
          <span className="mt-1 block text-[11.5px] leading-snug text-muted-foreground">
            {product.reason}
          </span>
        )}
      </span>
    </Link>
  );
}
