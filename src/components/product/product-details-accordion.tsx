import type { ReactNode } from "react";

import type { DescriptionBlock, Inline } from "@/lib/product-description";

export type DetailPanel = {
  title: string;
  content: ReactNode;
  defaultOpen?: boolean;
};

/**
 * The product page's detail panels.
 *
 * Same <details>/<summary> build as the home page FAQ (components/home/
 * faq-accordion.tsx): no JavaScript, keyboard and screen-reader behaviour for
 * free, and the text stays in the HTML while collapsed, so search engines
 * still read every panel. The difference is that a panel holds rich content —
 * lists, Q&A pairs, chips — rather than one string.
 */
export function ProductDetailsAccordion({ panels }: { panels: DetailPanel[] }) {
  return (
    <div>
      {panels.map((panel) => (
        <details
          key={panel.title}
          open={panel.defaultOpen}
          className="group border-t border-hairline last:border-b"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden">
            <span className="text-[15px] font-semibold leading-snug">
              {panel.title}
            </span>
            <span
              aria-hidden
              className="shrink-0 text-[18px] leading-none text-primary transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="space-y-3 pb-5 pr-2 text-[14px] leading-[1.8] text-muted-foreground sm:pr-10">
            {panel.content}
          </div>
        </details>
      ))}
    </div>
  );
}

function Runs({ runs }: { runs: Inline[] }) {
  return runs.map((run, index) =>
    run.bold ? (
      <strong key={index} className="font-semibold text-foreground">
        {run.text}
      </strong>
    ) : (
      <span key={index}>{run.text}</span>
    ),
  );
}

/** Parsed description blocks as markup — never as injected HTML. */
export function DescriptionBlocks({ blocks }: { blocks: DescriptionBlock[] }) {
  return blocks.map((block, index) => {
    if (block.kind === "paragraph") {
      return (
        <p key={index}>
          <Runs runs={block.text} />
        </p>
      );
    }

    if (block.kind === "list") {
      return (
        <ul key={index} className="ml-5 list-disc space-y-1.5 marker:text-primary">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>
              <Runs runs={item} />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div key={index}>
        <p className="font-semibold text-foreground">{block.question}</p>
        {block.answer.length > 0 ? (
          <p className="mt-0.5">
            <Runs runs={block.answer} />
          </p>
        ) : null}
      </div>
    );
  });
}
