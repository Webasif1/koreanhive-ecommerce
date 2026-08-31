"use client";

import { useState } from "react";
import Image from "next/image";

import { ProductPlaceholder } from "@/components/ui/product-placeholder";
import { cn } from "@/lib/utils";

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
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onClick={() => setZoomed((z) => !z)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setZoomed((z) => !z);
          }
        }}
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image
          key={active.id}
          src={active.url}
          alt={active.alt ?? productName}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          style={{ transformOrigin: origin }}
          className={cn(
            "object-cover transition-transform duration-200",
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
                "relative size-16 shrink-0 overflow-hidden rounded-lg border transition-colors",
                i === activeIndex
                  ? "border-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
