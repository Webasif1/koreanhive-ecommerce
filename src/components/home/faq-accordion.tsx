import type { FaqEntry } from "@/lib/json-ld";

export type FaqItem = FaqEntry & {
  /** Marks a Bangla entry so :lang(bn) in globals.css picks up Hind Siliguri. */
  lang?: "bn";
};

/**
 * The FAQ accordion.
 *
 * Built on <details>/<summary> rather than a state hook, so it costs no
 * JavaScript at all — it opens on a shared cPanel host before hydration and
 * still opens if hydration never happens. It also arrives accessible: the
 * summary is focusable, Enter and Space toggle it, and screen readers
 * announce the expanded state without an aria attribute in sight.
 *
 * The content stays in the DOM while collapsed, which is what keeps the
 * FAQPage structured data honest — Google requires the answer to be present
 * on the page, and hiding it behind a fetch would make the markup a claim
 * about content that is not there.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div>
      {items.map((item) => (
        <details
          key={item.question}
          lang={item.lang}
          className="group border-t border-hairline last:border-b"
        >
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden"
          >
            <span className="text-[15px] font-semibold leading-snug">
              {item.question}
            </span>
            {/* One glyph doing both states: a plus that turns 45 degrees into
                a cross. Two icons swapped on open would jump by a pixel or
                two at these sizes; a rotation cannot. */}
            <span
              aria-hidden
              className="shrink-0 text-[18px] leading-none text-primary transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="pb-5 pr-10 text-[13.5px] leading-[1.85] text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
