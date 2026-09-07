import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { truncateBenefit } from "@/lib/format";
import { isOnSale } from "@/lib/pricing";

/**
 * Regression tests for the Hot Deals scope.
 *
 * /deals and the "On discount" facet both tested `comparePrice != null && > 0`
 * and never compared it to the price. `catalogue:verify` only rejects a
 * compare price *below* price, so `comparePrice === price` is a normal row —
 * which meant the whole published catalogue appeared under "Marked down right
 * now — 279 products below their usual price", and the facet filtered nothing.
 */
describe("isOnSale", () => {
  it("is a sale only when the compare price is above the price", () => {
    assert.equal(isOnSale(1900, 2100), true);
  });

  it("is not a sale when the compare price merely exists", () => {
    // the exact row shape that put the entire catalogue on /deals
    assert.equal(isOnSale(2500, 2500), false);
  });

  it("is not a sale with no compare price at all", () => {
    assert.equal(isOnSale(2500, null), false);
    assert.equal(isOnSale(2500, 0), false);
  });

  it("is not a sale when the compare price is below the price", () => {
    assert.equal(isOnSale(2500, 1900), false);
  });
});

describe("truncateBenefit", () => {
  const long =
    "W.skin Laboratory's toner that rebalances your skin right after cleansing and preps it to absorb everything that follows. Formulated for early signs of ageing (fine lines and firmness), dry and dehydrated skin.";

  it("leaves a short blurb untouched", () => {
    assert.equal(truncateBenefit("Calms redness fast."), "Calms redness fast.");
  });

  it("cuts a long blurb down and marks the cut", () => {
    const out = truncateBenefit(long)!;
    assert.ok(out.length <= 151, `expected a short blurb, got ${out.length}`);
    assert.ok(out.endsWith("…"));
  });

  it("cuts on a word boundary, never mid-word", () => {
    const out = truncateBenefit(long)!;
    const body = out.slice(0, -1);
    assert.ok(long.startsWith(body), "the kept text must be a real prefix");
    assert.ok(!/\s$/.test(body), "no trailing space before the ellipsis");
    assert.ok(!/[,;:.]$/.test(body), "no dangling punctuation before the ellipsis");
  });

  it("returns null for nothing to show", () => {
    assert.equal(truncateBenefit(null), null);
    assert.equal(truncateBenefit(""), null);
    assert.equal(truncateBenefit("   "), null);
  });
});
