import Image from "next/image";
import Link from "next/link";

import { CardBuyButtons } from "@/components/cart/card-buy-buttons";
import { StarRating } from "@/components/product/star-rating";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Badge } from "@/components/ui/badge";
import { discountPercent, formatBDT } from "@/lib/format";
import type { ProductCardData } from "@/server/queries/catalog";

/**
 * Design system, section 05. The order top to bottom is fixed: image,
 * discount and status badges, brand, name, benefit line, rating, price pair,
 * saving, action, stock note. The price-then-saving sequence is what makes
 * the deal legible, so it must not be reordered.
 */
export function ProductCard({
  product,
  priority = false,
  badge,
}: {
  product: ProductCardData;
  priority?: boolean;
  badge?: string;
}) {
  const image = product.images[0];
  const defaultVariant = product.variants[0] ?? null;
  const price = defaultVariant?.price ?? product.price;
  const off = discountPercent(price, product.comparePrice);
  const saving = product.comparePrice ? product.comparePrice - price : 0;
  const stock = defaultVariant ? defaultVariant.stock : product.stock;
  const outOfStock = stock <= 0;

  return (
    <div className="flex flex-col border border-border bg-card">
      <div className="relative">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-blush">
            {image ? (
              <Image
                src={image.url}
                alt={image.alt ?? product.name}
                fill
                priority={priority}
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">
                No image
              </div>
            )}
          </div>
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {off !== null && <Badge variant="sale">−{off}%</Badge>}
          {badge && (
            <Badge variant="ink" size="sm">
              {badge}
            </Badge>
          )}
          {outOfStock && <Badge variant="muted">Out of stock</Badge>}
        </div>

        <WishlistButton productId={product.id} productName={product.name} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <Link
            href={`/brand/${product.brand.slug}`}
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-mulberry-hover"
          >
            {product.brand.name}
          </Link>
        )}

        <Link href={`/product/${product.slug}`} className="mt-1.5">
          <h3 className="text-sm font-bold leading-snug hover:text-primary">
            {product.name}
          </h3>
        </Link>

        {product.benefit && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {product.benefit}
          </p>
        )}

        {product.ratingCount > 0 && (
          <StarRating
            value={product.ratingAvg}
            count={product.ratingCount}
            className="mt-2.5"
          />
        )}

        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="font-display text-xl">{formatBDT(price)}</span>
          {product.comparePrice && product.comparePrice > price && (
            <span className="text-[12.5px] text-faint line-through">
              {formatBDT(product.comparePrice)}
            </span>
          )}
        </div>

        {saving > 0 && (
          <div className="mt-1 text-[11.5px] font-bold text-sale">
            You save {formatBDT(saving)}
          </div>
        )}

        <div className="flex-1" />

        <CardBuyButtons
          productId={product.id}
          variantId={defaultVariant?.id ?? null}
          disabled={outOfStock}
          productName={product.name}
        />

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {outOfStock
            ? "Back in stock soon"
            : stock <= 5
              ? `Only ${stock} left`
              : "In stock · ships today"}
        </p>
      </div>
    </div>
  );
}
