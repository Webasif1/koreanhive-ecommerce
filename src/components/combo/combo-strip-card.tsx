import Image from "next/image";
import Link from "next/link";

import { ComboAddButton } from "@/components/combo/combo-add-button";
import type { ComboCardData } from "@/components/combo/combo-card";
import type { ComboSeed } from "@/data/combos";
import { formatBDT } from "@/lib/format";
import { productImage } from "@/lib/product-image";

/**
 * The home page's combo card: a strip of the products, the routine in a line,
 * the price, and the button.
 *
 * Deliberately lighter than the one on /combos. That page is where a shopper
 * compares routines and reads suitability notes; this is a shelf they are
 * walking past, so it answers three questions — what is in it, what does it
 * cost, can I have it — and sends everything else to the combo page.
 */
export function ComboStripCard({
  combo,
  seed,
}: {
  combo: ComboCardData;
  seed: ComboSeed | undefined;
}) {
  const saving = combo.comparePrice ? combo.comparePrice - combo.price : 0;

  // Three across, as the design draws it. A four-product routine shows its
  // first three: the strip is a glance at the box, not an inventory.
  const strip = combo.products.slice(0, 3);

  const routine = combo.products
    .flatMap((product) => {
      const step = seed?.steps.find((entry) => entry.slug === product.slug);
      return step ? [step.short] : [];
    })
    .join(" · ");

  return (
    <li className="flex flex-col border border-border bg-card">
      <div className="grid grid-cols-3">
        {strip.map((product) => (
          <span
            key={product.slug}
            className="relative aspect-square border-r border-hairline bg-white last:border-r-0"
          >
            {product.imageUrl && (
              <Image
                src={productImage(product.imageUrl)}
                alt=""
                fill
                sizes="(min-width: 768px) 12vw, 33vw"
                className="object-contain"
              />
            )}
          </span>
        ))}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <Link href="/combos" className="group">
          <h3 className="font-display text-[22px] leading-tight tracking-[-0.01em] group-hover:text-primary">
            {combo.name}
          </h3>
        </Link>

        {routine && (
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
            {routine}
          </p>
        )}

        <div className="flex-1" />

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-hairline pt-4">
          <div>
            <div className="font-display text-[26px] leading-none">
              {formatBDT(combo.price)}
            </div>
            {combo.comparePrice && (
              <div className="mt-1.5 text-[12.5px] text-faint line-through">
                {formatBDT(combo.comparePrice)}
              </div>
            )}
          </div>
          {saving > 0 && (
            <span className="bg-sale-bg px-3 py-1.5 text-[12.5px] font-semibold text-sale">
              Save {formatBDT(saving)}
            </span>
          )}
        </div>

        <div className="mt-4">
          <ComboAddButton comboSlug={combo.slug} />
        </div>
      </div>
    </li>
  );
}
