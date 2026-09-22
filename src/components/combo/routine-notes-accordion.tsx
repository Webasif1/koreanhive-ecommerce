import type { ComboSeed } from "@/data/combos";

/**
 * The "Before you buy" suitability notes, collapsed one per combo.
 *
 * Same <details>/<summary> conventions as FaqAccordion (src/components/home)
 * — no JS, content stays in the DOM while collapsed — but a separate
 * component because each row is a name + a note + a routine, not a
 * question/answer pair.
 */
export function RoutineNotesAccordion({ seeds }: { seeds: ComboSeed[] }) {
  return (
    <div className="mt-5">
      {seeds.map((seed) => (
        <details
          key={seed.slug}
          className="group border-t border-hairline last:border-b"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden">
            <span className="text-[13px] font-semibold leading-snug">
              {seed.name}
            </span>
            <span
              aria-hidden
              className="shrink-0 text-[18px] leading-none text-primary transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="pb-5 pr-10">
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              {seed.note}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">
                How to use:
              </span>{" "}
              {seed.routine}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
