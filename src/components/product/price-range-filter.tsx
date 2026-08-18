"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";

import { Input } from "@/components/ui/input";
import { formatBDT } from "@/lib/format";

/**
 * Dual-thumb range plus the two ৳ boxes, kept in sync.
 *
 * The URL is only updated on commit — pointer release for the slider, blur or
 * Enter for the inputs — so dragging does not fire a navigation per step.
 */
export function PriceRangeFilter({
  bounds,
  value,
  onCommit,
  disabled,
}: {
  bounds: { min: number; max: number };
  value: { min: number; max: number };
  onCommit: (next: { min: number; max: number }) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<[number, number]>([value.min, value.max]);

  // A Clear all, or a facet that shifts the bounds, has to win over the local
  // draft. Adjusted during render rather than in an effect — the effect
  // version re-renders twice and React lints against it.
  const [syncedTo, setSyncedTo] = useState<[number, number]>([
    value.min,
    value.max,
  ]);
  if (syncedTo[0] !== value.min || syncedTo[1] !== value.max) {
    setSyncedTo([value.min, value.max]);
    setDraft([value.min, value.max]);
  }

  const clamp = (n: number) =>
    Math.min(bounds.max, Math.max(bounds.min, Math.round(n)));

  const commit = (next: [number, number]) => {
    // dragging one thumb past the other would otherwise invert the range
    const ordered: [number, number] =
      next[0] <= next[1] ? next : [next[1], next[0]];
    setDraft(ordered);
    onCommit({ min: ordered[0], max: ordered[1] });
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <label className="flex-1">
          <span className="sr-only">Minimum price</span>
          <Input
            inputMode="numeric"
            value={draft[0]}
            disabled={disabled}
            onChange={(e) =>
              setDraft([Number(e.target.value) || 0, draft[1]])
            }
            onBlur={() => commit([clamp(draft[0]), draft[1]])}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit([clamp(draft[0]), draft[1]]);
              }
            }}
            className="h-10 text-center text-[13px]"
            aria-label="Minimum price"
          />
        </label>
        <span className="text-xs text-faint">to</span>
        <label className="flex-1">
          <span className="sr-only">Maximum price</span>
          <Input
            inputMode="numeric"
            value={draft[1]}
            disabled={disabled}
            onChange={(e) =>
              setDraft([draft[0], Number(e.target.value) || 0])
            }
            onBlur={() => commit([draft[0], clamp(draft[1])])}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit([draft[0], clamp(draft[1])]);
              }
            }}
            className="h-10 text-center text-[13px]"
            aria-label="Maximum price"
          />
        </label>
      </div>

      <Slider.Root
        className="relative mt-5 flex h-4 w-full touch-none select-none items-center"
        min={bounds.min}
        max={bounds.max}
        step={50}
        value={draft}
        disabled={disabled}
        minStepsBetweenThumbs={1}
        onValueChange={(next) => setDraft([next[0], next[1]])}
        onValueCommit={(next) => commit([next[0], next[1]])}
      >
        <Slider.Track className="relative h-[3px] w-full grow bg-hairline">
          <Slider.Range className="absolute h-full bg-primary" />
        </Slider.Track>
        {(["Minimum", "Maximum"] as const).map((label) => (
          <Slider.Thumb
            key={label}
            aria-label={`${label} price`}
            className="block size-4 rounded-full border-2 border-primary bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        ))}
      </Slider.Root>

      <p className="mt-2 text-[11px] text-muted-foreground">
        {formatBDT(draft[0])} – {formatBDT(draft[1])}
      </p>
    </div>
  );
}
