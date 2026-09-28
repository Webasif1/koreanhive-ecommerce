"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageOpen } from "lucide-react";

import { cn } from "@/lib/utils";

export type TopProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  units: number;
};

function Thumb({ product, size }: { product: TopProduct; size: number }) {
  return product.imageUrl ? (
    <Image
      src={product.imageUrl}
      alt={product.name}
      fill
      sizes={`${size}px`}
      className="object-contain p-3"
    />
  ) : (
    <PackageOpen className="m-auto size-10 text-light" />
  );
}

/** The period's best sellers, the leader centred and its neighbours peeking. */
export function TopProductsCarousel({ products }: { products: TopProduct[] }) {
  const [index, setIndex] = useState(0);

  if (products.length === 0) {
    return (
      <p className="grid flex-1 place-items-center px-6 pb-8 text-center text-sm text-muted-foreground">
        No sales in this period yet.
      </p>
    );
  }

  const count = products.length;
  const at = (offset: number) => products[(index + offset + count) % count];
  const current = at(0);

  return (
    <div className="flex flex-1 flex-col justify-end px-5 pb-5">
      <div className="relative flex h-48 items-center justify-center">
        {count > 1 && (
          <>
            <div className="absolute left-3 top-1/2 size-28 -translate-y-1/2 overflow-hidden rounded-2xl bg-card/70 opacity-70">
              <div className="relative size-full">
                <Thumb product={at(-1)} size={112} />
              </div>
            </div>
            <div className="absolute right-3 top-1/2 size-28 -translate-y-1/2 overflow-hidden rounded-2xl bg-card/70 opacity-70">
              <div className="relative size-full">
                <Thumb product={at(1)} size={112} />
              </div>
            </div>
          </>
        )}

        <Link
          href={`/admin/products/${current.id}`}
          className="relative z-10 size-44 overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border transition-transform hover:-translate-y-0.5"
        >
          <Thumb product={current} size={176} />
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            #{index + 1}
          </span>
        </Link>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + count) % count)}
              className="absolute left-0 top-1/2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-card shadow-md ring-1 ring-border hover:text-primary"
              aria-label="Previous product"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % count)}
              className="absolute right-0 top-1/2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-card shadow-md ring-1 ring-border hover:text-primary"
              aria-label="Next product"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="line-clamp-1 font-display text-sm font-semibold">{current.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {current.units.toLocaleString("en-US")} sold
        </p>
      </div>

      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {products.map((product, i) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${product.name}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-primary" : "w-1.5 bg-chip-border",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
