"use client";

import {
  Children,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

/**
 * A one-row, swipeable strip of slides with prev/next arrows and dots.
 *
 * Native scroll-snap does the sliding, so swiping and trackpad scrolling work
 * with no JavaScript and no slider dependency ships. Script only drives the
 * arrows and dots.
 *
 * Nothing moves on its own: a playing reel or a card someone is reading
 * should not be scrolled out from under them.
 *
 * When every slide already fits, the arrows and dots are not rendered, so the
 * page never shows a control that does nothing.
 *
 * Slides are passed as children and can be server-rendered; this component
 * only wraps each one in a snap point sized by `slideClassName`.
 */
export function ScrollCarousel({
  heading,
  label,
  itemLabel,
  slideClassName,
  children,
}: {
  /** Eyebrow and title; the arrows sit to its right. */
  heading: ReactNode;
  /** Accessible name for the whole carousel, e.g. "Reels". */
  label: string;
  /** Singular noun for the controls, e.g. "reel" → "Next reel". */
  itemLabel: string;
  /** Width of one slide per breakpoint, e.g. "basis-full sm:basis-1/2". */
  slideClassName: string;
  children: ReactNode;
}) {
  const slides = Children.toArray(children);
  const trackId = useId();
  const trackRef = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({
    overflowing: false,
    canPrev: false,
    canNext: false,
    active: 0,
    // one dot per place the strip can rest, not per slide: with four cards in
    // view and eight in total there are only five
    positions: 1,
  });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, scrollWidth, clientWidth } = track;
    const slide = track.firstElementChild as HTMLElement | null;
    const step = slide ? slide.offsetWidth + gapOf(track) : clientWidth;
    // sub-pixel widths leave a pixel or two unscrolled at either end
    const slack = 2;

    const inView = step > 0 ? Math.max(1, Math.round((clientWidth + gapOf(track)) / step)) : 1;

    setState({
      positions: Math.max(1, track.children.length - inView + 1),
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
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="flex items-end justify-between gap-4">
        <div>{heading}</div>

        {state.overflowing ? (
          <div className="flex shrink-0 gap-2">
            <ArrowButton
              label={`Previous ${itemLabel}`}
              controls={trackId}
              disabled={!state.canPrev}
              onClick={() => scrollByOne(-1)}
              direction="prev"
            />
            <ArrowButton
              label={`Next ${itemLabel}`}
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
        {slides.map((slide, index) => (
          <li
            key={index}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            className={cn("flex shrink-0 snap-start [&>*]:w-full", slideClassName)}
          >
            {slide}
          </li>
        ))}
      </ul>

      {state.overflowing ? (
        <div className="mt-5 flex justify-center gap-2">
          {Array.from({ length: state.positions }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to ${itemLabel} ${index + 1}`}
              aria-current={index === Math.min(state.active, state.positions - 1) ? "true" : undefined}
              onClick={() => scrollToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === Math.min(state.active, state.positions - 1)
                  ? "w-6 bg-primary"
                  : "w-2 bg-border hover:bg-primary/50",
              )}
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
