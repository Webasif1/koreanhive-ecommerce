import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { POSTS } from "@/data/blog";
import type { Block } from "@/data/blog";
import { pickSlugs } from "@/lib/blog-picks";

const pick = (...picks: { product: string; note: string; slug?: string }[]) =>
  ({ kind: "pick", picks }) satisfies Block;

describe("pickSlugs", () => {
  it("collects every slug an article points at, in order", () => {
    assert.deepEqual(
      pickSlugs([
        { kind: "paragraph", text: "…" },
        pick({ product: "A", note: "", slug: "a" }),
        pick({ product: "B", note: "", slug: "b" }),
      ]),
      ["a", "b"],
    );
  });

  it("deduplicates a product recommended in more than one section", () => {
    // The cleanser is picked in all three articles and twice within one of
    // them; the page must not ask the database for it twice.
    assert.deepEqual(
      pickSlugs([
        pick({ product: "A", note: "", slug: "a" }),
        pick({ product: "A again", note: "", slug: "a" }),
      ]),
      ["a"],
    );
  });

  it("skips picks that name a product the shop does not stock", () => {
    assert.deepEqual(
      pickSlugs([pick({ product: "Not stocked", note: "" })]),
      [],
    );
  });

  it("returns nothing for an article with no picks", () => {
    assert.deepEqual(pickSlugs([{ kind: "paragraph", text: "…" }]), []);
  });
});

/**
 * The slugs are hand-written, and a typo in one is invisible: the pick simply
 * renders unlinked, exactly as an out-of-stock product does. These checks
 * catch the shapes of mistake that do not need the database to detect.
 */
describe("the journal's product picks", () => {
  const picks = POSTS.flatMap((post) =>
    post.body.flatMap((block) => (block.kind === "pick" ? block.picks : [])),
  );

  it("has picks to check", () => {
    assert.ok(picks.length > 0);
  });

  it("uses slug-shaped slugs", () => {
    for (const entry of picks) {
      if (!entry.slug) continue;
      assert.match(
        entry.slug,
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        `${entry.product} → ${entry.slug}`,
      );
    }
  });

  it("gives the same product the same slug everywhere it is recommended", () => {
    const byProduct = new Map<string, string>();

    for (const entry of picks) {
      if (!entry.slug) continue;
      const seen = byProduct.get(entry.product);
      assert.ok(
        seen === undefined || seen === entry.slug,
        `${entry.product} is linked to both ${seen} and ${entry.slug}`,
      );
      byProduct.set(entry.product, entry.slug);
    }
  });

  it("never points two different products at one catalogue page", () => {
    const byslug = new Map<string, string>();

    for (const entry of picks) {
      if (!entry.slug) continue;
      const seen = byslug.get(entry.slug);
      assert.ok(
        seen === undefined || seen === entry.product,
        `${entry.slug} is used for both "${seen}" and "${entry.product}"`,
      );
      byslug.set(entry.slug, entry.product);
    }
  });
});
