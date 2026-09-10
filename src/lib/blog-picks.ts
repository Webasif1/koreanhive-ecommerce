import type { Block } from "@/data/blog";

/**
 * Every catalogue slug an article's "আমাদের Pick" boxes refer to, deduplicated
 * and in the order they appear.
 *
 * The article page needs this before it can render: a pick only becomes a link
 * once the slug has been checked against the catalogue, and checking them one
 * box at a time would be a database round trip per recommendation. Collected
 * up front, a post with six picks costs one query.
 *
 * Pure, and separate from the renderer, so the "which products does this
 * article point at" question can be answered — and tested — without rendering
 * anything.
 */
export function pickSlugs(blocks: Block[]): string[] {
  const slugs = new Set<string>();

  for (const block of blocks) {
    if (block.kind !== "pick") continue;

    for (const pick of block.picks) {
      if (pick.slug) slugs.add(pick.slug);
    }
  }

  return [...slugs];
}
