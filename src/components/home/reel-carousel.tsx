import type { ReactNode } from "react";

import { ReelTile } from "@/components/home/reel-tile";
import { ScrollCarousel } from "@/components/ui/scroll-carousel";
import type { Reel } from "@/data/reels";

/**
 * The home page reels: one per view on a phone, two on a tablet, three on a
 * desktop. With three reels a desktop shows them all and no arrows; they
 * appear on their own once a fourth is added to src/data/reels.ts.
 */
export function ReelCarousel({
  reels,
  heading,
}: {
  reels: Reel[];
  /** The section's eyebrow and title; the arrows sit to its right. */
  heading: ReactNode;
}) {
  return (
    <ScrollCarousel
      heading={heading}
      label="Reels"
      itemLabel="reel"
      slideClassName="basis-full sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]"
    >
      {reels.map((reel) => (
        <ReelTile key={reel.url} reel={reel} />
      ))}
    </ScrollCarousel>
  );
}
