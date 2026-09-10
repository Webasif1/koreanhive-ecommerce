import assert from "node:assert/strict";
import { describe, it } from "node:test";

import imagekitLoader from "@/lib/image-loader";
import { productImage } from "@/lib/product-image";

const PACKSHOT =
  "https://ik.imagekit.io/koreanhive/Toner/some-by-mi-aha-bha-pha-150ml.webp";

const tr = (src: string) => new URL(src).searchParams.get("tr") ?? "";

/**
 * The bug this fixes was invisible to types and to the build: every URL was
 * valid, every image loaded, and the grid still looked wrong because the
 * products inside those valid images were different sizes. So what is worth
 * pinning is the transformation string itself — it is the whole fix, and both
 * of its failure modes are silent. A comma where ImageKit wants a colon
 * degrades to "last parameter wins"; a missing border step degrades to
 * "product fills the tile edge to edge", which is the mistake this file was
 * written after making.
 */
describe("productImage", () => {
  it("trims, re-pads and borders an ImageKit packshot into a fixed square", () => {
    assert.equal(
      tr(productImage(PACKSHOT)),
      "t-10:w-720,h-720,cm-pad_resize,bg-FFFFFF:b-140_FFFFFF",
    );
    assert.equal(
      new URL(productImage(PACKSHOT)).pathname,
      new URL(PACKSHOT).pathname,
    );
  });

  it("chains its steps with colons, not commas", () => {
    // A comma would fold the pad and the border into one step, where ImageKit
    // keeps the last value it recognises and the margin quietly disappears.
    const steps = tr(productImage(PACKSHOT)).split(":");

    assert.equal(steps.length, 3);
    assert.equal(steps[0], "t-10");
    assert.match(steps[1], /cm-pad_resize/);
    assert.match(steps[2], /^b-\d+_FFFFFF$/);
  });

  it("leaves a margin the pad step cannot eat", () => {
    // cm-pad_resize scales up to fill whatever box it is given, so the margin
    // has to come from the border and nowhere else. This asserts the border
    // exists, is symmetric, and adds up to the square the loader then resizes.
    const [, pad, border] = tr(productImage(PACKSHOT)).split(":");

    const inner = Number(/w-(\d+)/.exec(pad)?.[1]);
    const height = Number(/h-(\d+)/.exec(pad)?.[1]);
    const edge = Number(/b-(\d+)_/.exec(border)?.[1]);

    assert.equal(inner, height, "the pad box must be square");
    assert.ok(edge > 0, "without a border the product fills the tile");
    assert.equal(inner + edge * 2, 1000, "border must complete the square");
    assert.ok(
      inner / 1000 > 0.6 && inner / 1000 < 0.85,
      `product occupies ${inner / 1000} of the tile — too big crowds the border, too small looks lost`,
    );
  });

  it("is idempotent", () => {
    const once = productImage(PACKSHOT);
    assert.equal(productImage(once), once);
  });

  it("leaves images it cannot transform alone", () => {
    for (const src of [
      "/brand/logo.webp",
      "https://picsum.photos/seed/1/1200/1200",
      "not a url at all",
    ]) {
      assert.equal(productImage(src), src);
    }
  });

  it("keeps a transformation the caller already asked for", () => {
    assert.match(tr(productImage(`${PACKSHOT}?tr=e-grayscale`)), /^e-grayscale:t-10:/);
  });
});

/**
 * The loader runs *after* productImage on the same URL, so the two have to
 * compose. Before this change the loader appended its width with a comma,
 * which was harmless only because nothing ever arrived carrying a `tr`.
 */
describe("imagekitLoader composes with productImage", () => {
  it("resizes the finished square instead of overwriting the border step", () => {
    const steps = tr(
      imagekitLoader({ src: productImage(PACKSHOT), width: 400, quality: 75 }),
    ).split(":");

    assert.equal(steps.length, 4);
    assert.equal(steps[3], "w-400,q-75,c-at_max");
    // the border must survive intact — it is the entire margin
    assert.equal(steps[2], "b-140_FFFFFF");
  });

  it("still handles a plain URL with no transformation", () => {
    assert.equal(tr(imagekitLoader({ src: PACKSHOT, width: 256 })), "w-256,q-80,c-at_max");
  });

  it("passes through anything that is not on ImageKit", () => {
    assert.equal(
      imagekitLoader({ src: "/brand/logo.webp", width: 128 }),
      "/brand/logo.webp",
    );
  });
});
