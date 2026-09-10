import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregate } from "mingo";

import {
  buildListingFacetPipeline,
  clausesWithout,
  readFacetCount,
  saleScope,
  type ListingClauses,
} from "@/lib/listing-facets";

const NO_CLAUSES: ListingClauses = {
  brand: {},
  category: {},
  onSale: {},
  inStock: {},
  inCombo: {},
  rating: {},
  price: {},
};

/**
 * The sidebar's counts used to be ten separate queries. They are now ten
 * sub-pipelines of one $facet, and that swap is invisible when it goes wrong:
 * every number is still a number, just the wrong one. These pin the two things
 * that decide whether the numbers mean anything — which filters each facet
 * excludes, and how an empty result is read.
 */
describe("clausesWithout", () => {
  it("merges every clause when nothing is skipped", () => {
    assert.deepEqual(
      clausesWithout(
        { ...NO_CLAUSES, brand: { brandId: 1 }, price: { price: { $gte: 5 } } },
        null,
      ),
      { brandId: 1, price: { $gte: 5 } },
    );
  });

  it("drops only the named dimension", () => {
    // If the brand facet counted with the brand filter applied, ticking one
    // brand would show every other brand as 0 and the sidebar would look
    // broken the moment anybody used it.
    assert.deepEqual(
      clausesWithout(
        { ...NO_CLAUSES, brand: { brandId: 1 }, inStock: { stock: { $gt: 0 } } },
        "brand",
      ),
      { stock: { $gt: 0 } },
    );
  });

  it("never carries the scope filter, which the pipeline applies once", () => {
    const merged = clausesWithout(NO_CLAUSES, null);
    assert.deepEqual(merged, {});
    assert.ok(!("isActive" in merged));
  });
});

describe("readFacetCount", () => {
  it("reads a count", () => {
    assert.equal(readFacetCount([{ n: 7 }]), 7);
  });

  it("treats an empty array as zero", () => {
    // $count emits no document at all when nothing matches, so the naive read
    // gives undefined and the facet renders blank instead of "0".
    assert.equal(readFacetCount([]), 0);
    assert.equal(readFacetCount(undefined), 0);
  });
});

describe("buildListingFacetPipeline", () => {
  const pipeline = buildListingFacetPipeline({
    base: { isActive: true },
    clauses: NO_CLAUSES,
    comboSlugs: [],
  });

  it("applies the scope once, before the facets", () => {
    assert.deepEqual(pipeline[0], { $match: { isActive: true } });
  });

  it("uses stages $facet actually allows", () => {
    // $facet rejects $out, $merge, $geoNear, $indexStats and nesting.
    const facets = (pipeline[1] as { $facet: Record<string, object[]> }).$facet;
    const banned = ["$out", "$merge", "$geoNear", "$indexStats", "$facet"];

    for (const [name, stages] of Object.entries(facets)) {
      for (const stage of stages) {
        for (const key of Object.keys(stage)) {
          assert.ok(!banned.includes(key), `${name} uses ${key}`);
        }
      }
    }
  });

  it("computes every figure the sidebar renders", () => {
    const facets = (pipeline[1] as { $facet: Record<string, object[]> }).$facet;

    assert.deepEqual(Object.keys(facets).sort(), [
      "brands",
      "categories",
      "inCombo",
      "inStock",
      "onSale",
      "priceRange",
      "rating40",
      "rating45",
      "scopeTotal",
      "total",
    ]);
  });
});

describe("saleScope", () => {
  it("requires comparePrice to actually exceed price", () => {
    // A product whose comparePrice equals its price is not discounted; without
    // the $expr the "On discount" facet matched everything with the field set.
    assert.deepEqual(saleScope(), {
      comparePrice: { $ne: null, $gt: 0 },
      $expr: { $gt: ["$comparePrice", "$price"] },
    });
  });
});

/**
 * The pipeline, executed.
 *
 * mingo is a MongoDB aggregation engine in JavaScript, so these run the real
 * stages over fixtures — no database, no mocks, no assumption that the shape
 * assertions above imply correct numbers. Writing them caught a mistake in my
 * own expected values before it caught anything else, which is the argument
 * for having them: every number here is plausible, and only one is right.
 */
const CATALOGUE = [
  { slug: "a", isActive: true, brandId: "B1", categoryId: "C1", price: 100, comparePrice: 200, stock: 5, ratingAvg: 4.8 },
  { slug: "b", isActive: true, brandId: "B1", categoryId: "C1", price: 300, comparePrice: null, stock: 0, ratingAvg: 4.2 },
  // comparePrice equal to price is not a discount
  { slug: "c", isActive: true, brandId: "B2", categoryId: "C2", price: 500, comparePrice: 500, stock: 2, ratingAvg: 3.9 },
  { slug: "d", isActive: true, brandId: "B2", categoryId: "C1", price: 900, comparePrice: 1200, stock: 7, ratingAvg: 4.6 },
  { slug: "z", isActive: false, brandId: "B1", categoryId: "C1", price: 50, comparePrice: 100, stock: 9, ratingAvg: 5.0 },
];

type Facets = {
  total: { n: number }[];
  scopeTotal: { n: number }[];
  brands: { _id: string; count: number }[];
  categories: { _id: string; count: number }[];
  onSale: { n: number }[];
  inStock: { n: number }[];
  inCombo: { n: number }[];
  rating45: { n: number }[];
  rating40: { n: number }[];
  priceRange: { min: number; max: number }[];
};

function runFacets(clauses: ListingClauses, comboSlugs = ["a", "d"]): Facets {
  const pipeline = buildListingFacetPipeline({
    base: { isActive: true },
    clauses,
    comboSlugs,
  });

  return aggregate(CATALOGUE, pipeline as never)[0] as Facets;
}

const pairs = (rows: { _id: string; count: number }[]) =>
  rows.map((row) => [row._id, row.count]).sort();

describe("the facet pipeline, run", () => {
  it("counts an unfiltered listing", () => {
    const f = runFacets(NO_CLAUSES);

    assert.equal(readFacetCount(f.total), 4, "the inactive product is excluded");
    assert.equal(readFacetCount(f.scopeTotal), 4);
    assert.equal(readFacetCount(f.onSale), 2, "c is not on sale: 500 vs 500");
    assert.equal(readFacetCount(f.inStock), 3, "b has none");
    assert.equal(readFacetCount(f.inCombo), 2);
    assert.equal(readFacetCount(f.rating45), 2);
    assert.equal(readFacetCount(f.rating40), 3);
    assert.deepEqual(pairs(f.brands), [["B1", 2], ["B2", 2]]);
    assert.deepEqual(pairs(f.categories), [["C1", 3], ["C2", 1]]);
    assert.equal(f.priceRange[0].min, 100);
    assert.equal(f.priceRange[0].max, 900);
  });

  it("does not let the brand filter zero the brand facet", () => {
    const f = runFacets({ ...NO_CLAUSES, brand: { brandId: { $in: ["B1"] } } });

    assert.equal(readFacetCount(f.total), 2, "the listing itself narrows");
    assert.deepEqual(
      pairs(f.brands),
      [["B1", 2], ["B2", 2]],
      "every other brand would read 0 and the sidebar would look broken",
    );
    assert.deepEqual(
      pairs(f.categories),
      [["C1", 2]],
      "but the category facet does respect the brand filter",
    );
  });

  it("keeps the price bounds steady while the slider moves", () => {
    const f = runFacets({ ...NO_CLAUSES, price: { price: { $gte: 400 } } });

    assert.equal(readFacetCount(f.total), 2);
    // if the bounds narrowed with the selection, the track would shrink out
    // from under the handles as they were dragged
    assert.equal(f.priceRange[0].min, 100);
    assert.equal(f.priceRange[0].max, 900);
  });

  it("reads a facet that matches nothing as zero", () => {
    const f = runFacets({ ...NO_CLAUSES, brand: { brandId: { $in: ["NOPE"] } } });

    assert.equal(readFacetCount(f.total), 0);
    assert.deepEqual(f.priceRange, [], "$group emits no document either");
  });

  it("excludes only its own dimension when several filters are on", () => {
    const f = runFacets({
      ...NO_CLAUSES,
      inStock: { stock: { $gt: 0 } },
      rating: { ratingAvg: { $gte: 4.5 } },
    });

    assert.equal(readFacetCount(f.total), 2, "a and d");
    // drops the rating filter, keeps inStock — so c (3.9, in stock) is still
    // out on rating, and b (4.2, no stock) is still out on stock
    assert.equal(readFacetCount(f.rating45), 2);
    assert.equal(readFacetCount(f.inStock), 2);
  });
});
