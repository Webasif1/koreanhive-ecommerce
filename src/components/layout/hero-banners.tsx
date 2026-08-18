import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  ctaLabel: string | null;
};

export function HeroBanners({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  return (
    <section className="container-page pt-6">
      <div className="grid gap-4">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className="relative overflow-hidden border border-border"
          >
            <div className="relative aspect-[16/7] sm:aspect-[3/1]">
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                // the first banner is usually the LCP element
                priority={index === 0}
                sizes="(min-width: 1280px) 1280px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/70 to-transparent" />
            </div>

            <div className="absolute inset-0 flex flex-col justify-center gap-2 p-5 sm:p-8">
              <h2 className="max-w-md font-display text-xl font-semibold text-white sm:text-3xl">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="max-w-md text-sm text-white/85">
                  {banner.subtitle}
                </p>
              )}
              {banner.linkUrl && (
                <div className="pt-1">
                  <Button asChild size="sm">
                    <Link href={banner.linkUrl}>
                      {banner.ctaLabel ?? "Shop now"}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
