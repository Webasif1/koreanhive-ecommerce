"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { ReelTile } from "@/components/home/reel-tile";
import type { Reel } from "@/data/reels";

/**
 * The home page reels, one per view on a phone, two on a tablet, three on a
 * desktop.
 *
 * Native scroll-snap does the carousel: swiping and trackpad scrolling work
 * with no JavaScript at all, and no slider dependency ships for three videos.
 * Script only drives the arrows and the dots.
 *
 * Nothing moves on its own. A reel that is playing would otherwise be scrolled
 * out from under the person watching it.
 *
 * When every reel already fits — three on a desktop — the arrows and dots are
 * not rendered, so the page never shows a control that does nothing. They
 * appear on their own once a fourth reel is added to src/data/reels.ts.
 */
export function ReelCarousel({
  reels,
  heading,
}: {
  reels: Reel[];
  /** The section's eyebrow and title; the arrows sit to its right. */
  heading: ReactNode;
}) {
  const trackId = useId();
  const trackRef = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({
    overflowing: false,
    canPrev: false,
    canNext: false,
    active: 0,
  });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const slide = track.firstElementChild as HTMLElement | null;
    const step = slide ? slide.offsetWidth + gapOf(track) : clientWidth;
    // sub-pixel widths leave a pixel or two unscrolled at either end
    const slack = 2;

    setState({
      overflowing: scrollWidth - clientWidth > slack,
      canPrev: scrollLeft > slack,
      canNext: scrollLeft + clientWidth < scrollWidth - slack,
      active: step > 0 ? Math.round(scrollLeft / step) : 0,
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // A ResizeObserver reports once as soon as it starts observing, which is
    // what sets the initial state — no setState in the effect body itself.
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    track.addEventListener("scroll", measure, { passive: true });

    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", measure);
    };
  }, [measure]);

  const scrollToSlide = (index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;

    track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
  };

  const scrollByOne = (direction: 1 | -1) => {
    const track = trackRef.current;
    const slide = track?.firstElementChild as HTMLElement | null | undefined;
    if (!track || !slide) return;

    track.scrollBy({
      left: direction * (slide.offsetWidth + gapOf(track)),
      behavior: "smooth",
    });
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Reels">
      <div className="flex items-end justify-between gap-4">
        <div>{heading}</div>

        {state.overflowing ? (
          <div className="flex shrink-0 gap-2">
            <ArrowButton
              label="Previous reel"
              controls={trackId}
              disabled={!state.canPrev}
              onClick={() => scrollByOne(-1)}
              direction="prev"
            />
            <ArrowButton
              label="Next reel"
              controls={trackId}
              disabled={!state.canNext}
              onClick={() => scrollByOne(1)}
              direction="next"
            />
          </div>
        ) : null}
      </div>

      <ul
        id={trackId}
        ref={trackRef}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reels.map((reel, index) => (
          <li
            key={reel.url}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${reels.length}`}
            className="shrink-0 basis-full snap-start sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]"
          >
            <ReelTile reel={reel} />
          </li>
        ))}
      </ul>

      {state.overflowing ? (
        <div className="mt-5 flex justify-center gap-2">
          {reels.map((reel, index) => (
            <button
              key={reel.url}
              type="button"
              aria-label={`Go to reel ${index + 1}`}
              aria-current={index === state.active ? "true" : undefined}
              onClick={() => scrollToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === state.active
                  ? "w-6 bg-primary"
                  : "w-2 bg-border hover:bg-primary/50"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The track's column gap in pixels, so a step is exactly one slide. */
function gapOf(track: HTMLElement) {
  return Number.parseFloat(getComputedStyle(track).columnGap) || 0;
}

function ArrowButton({
  label,
  controls,
  disabled,
  onClick,
  direction,
}: {
  label: string;
  controls: string;
  disabled: boolean;
  onClick: () => void;
  direction: "prev" | "next";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-controls={controls}
      disabled={disabled}
      onClick={onClick}
      className="flex size-10 items-center justify-center border border-ink bg-white text-ink transition-colors hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-border disabled:text-faint disabled:hover:bg-white"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="size-5"
      >
        <path d={direction === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}
