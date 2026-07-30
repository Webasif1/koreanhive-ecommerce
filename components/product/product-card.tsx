import Image from "next/image";
import Link from "next/link";

import { CardBuyButtons } from "@/components/cart/card-buy-buttons";
import { StarRating } from "@/components/product/star-rating";
import { Badge } from "@/components/ui/badge";
import { discountPercent, formatBDT } from "@/lib/format";
import type { ProductCardData } from "@/server/queries/catalog";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const image = product.images[0];
  const defaultVariant = product.variants[0] ?? null;
  const off = discountPercent(product.price, product.comparePrice);
  const outOfStock = defaultVariant
    ? defaultVariant.stock <= 0
    : product.stock <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <Link
        href={`/product/${product.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt ?? product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs text-muted-foreground">
              No image
            </div>
          )}

          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {off !== null && <Badge>-{off}%</Badge>}
            {outOfStock && <Badge variant="muted">Out of stock</Badge>}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3">
          {product.brand && (
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {product.brand.name}
            </p>
          )}

          <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
            {product.name}
          </h3>

          {product.ratingCount > 0 && (
            <StarRating value={product.ratingAvg} count={product.ratingCount} />
          )}

          <div className="mt-auto flex items-baseline gap-2 pt-1">
            <span className="font-display font-semibold">
              {formatBDT(defaultVariant?.price ?? product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatBDT(product.comparePrice)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <CardBuyButtons
        productId={product.id}
        variantId={defaultVariant?.id ?? null}
        disabled={outOfStock}
        productName={product.name}
      />
    </div>
  );
}
