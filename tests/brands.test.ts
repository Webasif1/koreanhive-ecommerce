import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { topBrandsByStock } from "@/lib/brands";

const brand = (name: string, products: number) => ({
  name,
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  _count: { products },
});

/**
 * The home page shows ten of the 71 brands. Which ten is decided here, so the
 * tiebreak is pinned rather than inherited from whatever order the query
 * happened to return.
 */
describe("topBrandsByStock", () => {
  it("ranks by published product count, most first", () => {
    const ranked = topBrandsByStock(
      [brand("Anua", 12), brand("SKIN1004", 20), brand("COSRX", 17)],
      10,
    );

    assert.deepEqual(
      ranked.map((b) => b.name),
      ["SKIN1004", "COSRX", "Anua"],
    );
  });

  it("breaks a tie on name rather than on input order", () => {
    // both on 8 in the live catalogue; without the explicit tiebreak this
    // depends on sort stability and on how getBrands happened to sort
    const fromCount = topBrandsByStock(
      [brand("Some By Mi", 8), brand("Beauty of Joseon", 8)],
      10,
    );
    const reversed = topBrandsByStock(
      [brand("Beauty of Joseon", 8), brand("Some By Mi", 8)],
      10,
    );

    assert.deepEqual(
      fromCount.map((b) => b.name),
      ["Beauty of Joseon", "Some By Mi"],
    );
    assert.deepEqual(
      reversed.map((b) => b.name),
      fromCount.map((b) => b.name),
    );
  });

  it("takes only the limit", () => {
    const ranked = topBrandsByStock(
      Array.from({ length: 71 }, (_, i) => brand(`Brand ${i}`, i)),
      10,
    );

    assert.equal(ranked.length, 10);
    assert.equal(ranked[0].name, "Brand 70");
  });

  it("returns everything when there are fewer brands than the limit", () => {
    assert.equal(topBrandsByStock([brand("Anua", 12)], 10).length, 1);
    assert.equal(topBrandsByStock([], 10).length, 0);
  });

  it("does not reorder the caller's list", () => {
    // the home page keeps the full list for its own counts
    const brands = [brand("Anua", 12), brand("SKIN1004", 20)];
    topBrandsByStock(brands, 10);

    assert.deepEqual(
      brands.map((b) => b.name),
      ["Anua", "SKIN1004"],
    );
  });

  it("keeps the whole brand object, not just what it ranks on", () => {
    const [top] = topBrandsByStock([brand("SKIN1004", 20)], 10);

    assert.equal(top.slug, "skin1004");
  });
});
