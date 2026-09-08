"use client";

import { useState } from "react";

import { reelEmbedUrl, type Reel } from "@/data/reels";

/**
 * A reel that loads when someone asks for it.
 *
 * Each Facebook embed is ~175KB of HTML before its JavaScript, CSS and video,
 * and it sets tracking cookies the moment it mounts. Three of them loading
 * eagerly would put 1–2MB of third-party code on a statically rendered home
 * page and hand every visitor to Facebook whether they watch or not.
 *
 * So until the click, this is markup we own and Facebook has never been asked
 * for anything. After it, the player replaces the tile in place.
 *
 * There is no poster frame because Facebook does not expose one for a reel
 * without the Graph API — and a stock image dressed up as a video still would
 * be inventing a preview of content we do not have.
 */
export function ReelTile({ reel }: { reel: Reel }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative aspect-9/16 overflow-hidden border border-border bg-ink">
        <iframe
          src={reelEmbedUrl(reel.url)}
          title={reel.label}
          className="absolute inset-0 h-full w-full"
          style={{ border: "none", overflow: "hidden" }}
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          // do not hand Facebook the full URL of the page being browsed
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      // a real <button>, so Tab reaches it and Enter and Space both fire
      className="group relative flex aspect-9/16 w-full flex-col items-center justify-center gap-4 overflow-hidden border border-border bg-ink text-blush transition-colors hover:border-primary"
    >
      <span className="flex size-14 items-center justify-center rounded-full border border-blush/30 bg-blush/10 transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="ml-1 size-6">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
        </svg>
      </span>
      <span className="px-4 text-center text-[11.5px] uppercase tracking-[0.12em] text-light">
        {reel.label}
      </span>
    </button>
  );
}
