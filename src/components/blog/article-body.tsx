import Image from "next/image";
import Link from "next/link";

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
export function ArticleBody({
  blocks,
  linkable,
}: {
  blocks: Block[];
  /**
   * Slugs the caller has confirmed resolve to an active product. A pick is
   * only linked if its slug is in here, so an article can name something the
   * shop has stopped selling without shipping a link to a 404.
   */
  linkable?: ReadonlySet<string>;
}) {
  return (
    <div lang="bn" className="mt-8 space-y-5">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} linkable={linkable} />
      ))}
    </div>
  );
}

function BlockView({
  block,
  linkable,
}: {
  block: Block;
  linkable?: ReadonlySet<string>;
}) {
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
            {block.picks.map((pick) => {
              const name = (
                <p className="text-[15px] font-semibold leading-snug">
                  {pick.product}
                </p>
              );
              const note = (
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {pick.note}
                </p>
              );

              // Named but not stocked, or stocked and then delisted: the
              // recommendation still stands, it just has nowhere to go.
              if (!pick.slug || !linkable?.has(pick.slug)) {
                return (
                  <li key={pick.product}>
                    {name}
                    {note}
                  </li>
                );
              }

              return (
                <li key={pick.product}>
                  {/* One link around the whole entry rather than a linked name
                      plus a linked call to action — two links to the same
                      page read as two destinations to a screen reader. */}
                  <Link
                    href={`/product/${pick.slug}`}
                    className="group block"
                    lang="en"
                  >
                    <span className="block text-[15px] font-semibold leading-snug group-hover:text-primary">
                      {pick.product}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">
                      {pick.note}
                    </span>
                    {/* The box has always looked like a callout, not a link.
                        This is the part that says it is one. */}
                    <span className="mt-2 block text-[12.5px] font-medium text-primary">
                      Shop this product →
                    </span>
                  </Link>
                </li>
              );
            })}
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
