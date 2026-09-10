import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  displayAuthorName,
  EMPTY_REVIEW_SUMMARY,
  summariseReviews,
} from "@/lib/reviews";

/**
 * Every number this produces is a public claim about real customers, so the
 * cases that matter are the ones where a plausible-looking bug still renders:
 * an empty shop, a single review, a rounding boundary, and data that should
 * never have reached the database.
 */
describe("summariseReviews", () => {
  it("returns the empty summary for no reviews", () => {
    assert.deepEqual(summariseReviews([]), EMPTY_REVIEW_SUMMARY);
  });

  it("has a null average rather than a zero when nothing is rated", () => {
    // 0.0 would render as a real score of zero — the worst possible rating,
    // shown to a shopper on a shop that has simply not been reviewed yet.
    assert.equal(summariseReviews([]).average, null);
  });

  it("summarises a single review without pretending to a distribution", () => {
    const summary = summariseReviews([5]);

    assert.equal(summary.count, 1);
    assert.equal(summary.average, 5);
    assert.deepEqual(
      summary.breakdown.map((row) => row.percent),
      [100, 0, 0, 0, 0],
    );
  });

  it("averages to one decimal", () => {
    assert.equal(summariseReviews([5, 4]).average, 4.5);
    assert.equal(summariseReviews([5, 4, 4]).average, 4.3);
    assert.equal(summariseReviews([5, 5, 4]).average, 4.7);
  });

  it("counts every star row, including the empty ones", () => {
    const summary = summariseReviews([5, 5, 5, 4, 1]);

    assert.deepEqual(
      summary.breakdown.map((row) => [row.stars, row.count]),
      [
        [5, 3],
        [4, 1],
        [3, 0],
        [2, 0],
        [1, 1],
      ],
    );
  });

  it("keeps the star rows in descending order", () => {
    assert.deepEqual(
      summariseReviews([3]).breakdown.map((row) => row.stars),
      [5, 4, 3, 2, 1],
    );
  });

  it("drops ratings outside 1-5 instead of clamping them", () => {
    // Clamping a stray 7 to 5 would silently raise the published average.
    const summary = summariseReviews([5, 7, 0, -1, 3.5, 3]);

    assert.equal(summary.count, 2);
    assert.equal(summary.average, 4);
  });

  it("never reports a percentage above 100", () => {
    for (const row of summariseReviews([4, 4, 4, 4]).breakdown) {
      assert.ok(row.percent >= 0 && row.percent <= 100);
    }
  });

  it("keeps count as the sum of the breakdown", () => {
    const summary = summariseReviews([1, 2, 3, 4, 5, 5, 5]);
    const summed = summary.breakdown.reduce((sum, row) => sum + row.count, 0);

    assert.equal(summed, summary.count);
  });
});

describe("displayAuthorName", () => {
  it("keeps the given name and initialises the surname", () => {
    assert.equal(displayAuthorName("Tahmina Rahman"), "Tahmina R.");
  });

  it("handles a middle name", () => {
    assert.equal(displayAuthorName("Farhana Akter Mim"), "Farhana Akter M.");
  });

  it("leaves a single name alone", () => {
    // A full stop after a lone name protects nothing and reads as a typo.
    assert.equal(displayAuthorName("Mehjabin"), "Mehjabin");
  });

  it("tidies stray whitespace", () => {
    assert.equal(displayAuthorName("  Sabrina   Khan  "), "Sabrina K.");
  });

  it("falls back rather than rendering an empty byline", () => {
    assert.equal(displayAuthorName("   "), "Customer");
  });

  it("does not leak the full surname anywhere in the result", () => {
    assert.ok(!displayAuthorName("Nusrat Jahan").includes("Jahan"));
  });
});
