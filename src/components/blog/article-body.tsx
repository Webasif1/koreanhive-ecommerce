import Image from "next/image";

import type { Block } from "@/data/blog";

/**
 * Renders an article's block list.
 *
 * Every branch is exhaustive over the union, so adding a block kind in
 * src/data/blog/types.ts fails the build here until it has a rendering —
 * which is the whole reason the content is blocks rather than an HTML string.
 *
 * No dangerouslySetInnerHTML anywhere: nothing in an article can inject
 * markup, and the product-description problem elsewhere in this codebase
 * (raw ** showing on the page) cannot happen to a journal post.
 */
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div lang="bn" className="mt-8 space-y-5">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "heading":
      return (
        <h2 className="pt-6 font-display text-[24px] leading-tight tracking-[-0.01em] md:text-[28px]">
          {block.text}
        </h2>
      );

    case "subheading":
      return (
        <h3 className="pt-3 text-[17px] font-semibold leading-snug">
          {block.text}
        </h3>
      );

    case "paragraph":
      return (
        <p className="text-[15px] leading-[1.9] text-foreground/85">
          {block.text}
        </p>
      );

    case "image":
      // 800×420 in the source document; the ratio is fixed so the reserved box
      // matches the file and nothing shifts as it loads
      return (
        <figure className="relative my-8 aspect-[800/420] overflow-hidden border border-border bg-blush">
          <Image
            src={block.src}
            alt={block.alt}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
          />
        </figure>
      );

    case "pick":
      return (
        <aside className="border border-border bg-blush p-5">
          <p className="eyebrow">আমাদের Pick</p>
          <ul className="mt-3 space-y-3">
            {block.picks.map((pick) => (
              <li key={pick.product}>
                <p className="text-[15px] font-semibold leading-snug">
                  {pick.product}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {pick.note}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      );

    case "note":
      return (
        <p className="border-l-2 border-primary pl-4 text-[14px] leading-[1.85] text-muted-foreground">
          <span className="font-semibold text-foreground">{block.label}:</span>{" "}
          {block.text}
        </p>
      );

    case "list": {
      const items = block.items.map((item, index) => (
        <li key={index} className="text-[15px] leading-[1.9] text-foreground/85">
          {item.term ? (
            <span className="font-semibold text-foreground">{item.term} </span>
          ) : null}
          {item.text}
        </li>
      ));

      return block.ordered ? (
        <ol className="ml-5 list-decimal space-y-3 marker:text-primary marker:font-semibold">
          {items}
        </ol>
      ) : (
        <ul className="ml-5 list-disc space-y-3 marker:text-primary">{items}</ul>
      );
    }
  }
}
