"use client";

import { useState } from "react";
import Image from "next/image";

import { reelEmbedUrl, type Reel } from "@/data/reels";

/**
 * A reel that loads when someone asks for it.
 *
 * Each Facebook embed is ~175KB of HTML before its JavaScript, CSS and video,
 * and it sets tracking cookies the moment it mounts. Three of them loading
 * eagerly would put 1–2MB of third-party code on a statically rendered home
 * page and hand every visitor to Facebook whether they watch or not.
 *
 * So until the click, this is the reel's own cover frame served from our own
 * domain, and Facebook has never been asked for anything. After it, the player
 * replaces the tile in place.
 */
export function ReelTile({ reel, priority }: { reel: Reel; priority?: boolean }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative aspect-9/16 overflow-hidden border border-border bg-ink">
        <iframe
          src={reelEmbedUrl(reel.url)}
          title={reel.title}
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
      aria-label={`Play: ${reel.title}`}
      // a real <button>, so Tab reaches it and Enter and Space both fire
      className="group relative aspect-9/16 w-full overflow-hidden border border-border bg-ink text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Image
        src={reel.cover}
        alt=""
        fill
        priority={priority}
        sizes="(min-width: 640px) 33vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* the title sits on the photograph, so it needs its own contrast rather
          than relying on whatever the frame happens to be */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-ink via-ink/70 to-transparent"
      />

      <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-lg transition-colors group-hover:bg-primary group-hover:text-white">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="ml-1 size-6">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
        </svg>
      </span>

      <span className="absolute inset-x-0 bottom-0 p-4">
        <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">
          {reel.title}
        </span>
        <span className="mt-1 block text-[10.5px] uppercase tracking-[0.12em] text-light">
          Watch on Facebook
        </span>
      </span>
    </button>
  );
}
