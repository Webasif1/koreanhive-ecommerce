"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import { ProductPlaceholder } from "@/components/ui/product-placeholder";
import { cn } from "@/lib/utils";
import { productImage } from "@/lib/product-image";

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
};

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const touchStartX = useRef<number | null>(null);

  const active = images[activeIndex];

  if (!active) {
    return (
      <div className="aspect-square overflow-hidden border border-border">
        <ProductPlaceholder />
      </div>
    );
  }

  // hover-zoom follows the pointer; on touch it is a plain tap-to-toggle
  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label={zoomed ? "Zoom out" : "Zoom in"}
        onMouseMove={handleMove}
        // Mouse only. A tap on a phone fires a synthetic mouseenter right
        // before its click, so the old onMouseEnter zoomed in and the click
        // immediately zoomed back out — tap-to-zoom did nothing on touch.
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setZoomed(true);
        }}
        onMouseLeave={() => setZoomed(false)}
        // swipe between photos on a phone (not while zoomed, where a drag
        // is someone looking closer)
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          const end = e.changedTouches[0]?.clientX;
          if (start === null || end === undefined || zoomed) return;
          const dx = end - start;
          if (Math.abs(dx) < 40 || images.length < 2) return;
          setActiveIndex((i) =>
            dx < 0
              ? (i + 1) % images.length
              : (i - 1 + images.length) % images.length,
          );
        }}
        onClick={() => setZoomed((z) => !z)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setZoomed((z) => !z);
          }
        }}
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image
          key={active.id}
          src={productImage(active.url)}
          alt={active.alt ?? productName}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          style={{ transformOrigin: origin }}
          className={cn(
            // contain so the whole product is visible at a consistent scale,
            // matching the grid cards; cover cropped the taller packshots
            "object-contain p-2 transition-transform duration-200",
            zoomed ? "scale-[2]" : "scale-100",
          )}
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-current={i === activeIndex}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg border bg-white transition-colors",
                i === activeIndex
                  ? "border-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <Image
                src={productImage(image.url)}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
