import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { getCombos } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Combo Offers",
  description:
    "Full Korean skincare routines bundled at one price, with cash on delivery across Bangladesh.",
  alternates: { canonical: "/combos" },
};

export const revalidate = 3600;

export default async function CombosPage() {
  const combos = await getCombos();

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Combo offers</p>
      <h1 className="mt-3 font-display text-[30px] tracking-[-0.01em] md:text-[38px]">
        Full routines, one price
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Products that work together, priced below buying them separately. Cash
        on delivery, same as everything else.
      </p>

      {combos.length === 0 ? (
        <p className="mt-8 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No combos running right now — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => {
            const saving = combo.comparePrice
              ? combo.comparePrice - combo.price
              : 0;

            return (
              <div
                key={combo.id}
                className="flex flex-col border border-border bg-card p-6"
              >
                {saving > 0 && (
                  <Badge variant="saleSoft" className="self-start">
                    Save {formatBDT(saving)}
                  </Badge>
                )}

                <h2 className="mt-4 font-display text-xl">{combo.name}</h2>
                {combo.concern && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {combo.concern}
                  </p>
                )}
                {combo.description && (
                  <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                    {combo.description}
                  </p>
                )}

                <ul className="mt-5 space-y-2.5">
                  {combo.products.map((product) => (
                    <li key={product.slug}>
                      <Link
                        href={`/product/${product.slug}`}
                        className="flex items-center gap-3 text-[13px] hover:text-primary"
                      >
                        <span className="relative size-10 shrink-0 border border-border bg-blush">
                          {product.imageUrl && (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          )}
                        </span>
                        <span className="flex-1 leading-snug">
                          {product.name}
                        </span>
                        <span className="text-faint tabular-nums">
                          {formatBDT(product.price)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-baseline gap-2.5">
                  <span className="font-display text-2xl">
                    {formatBDT(combo.price)}
                  </span>
                  {combo.comparePrice && (
                    <span className="text-[12.5px] text-faint line-through">
                      {formatBDT(combo.comparePrice)}
                    </span>
                  )}
                </div>

                <div className="flex-1" />
                <Button className="mt-5 w-full" asChild>
                  <Link href="/shop?combo=1">Shop these products</Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
