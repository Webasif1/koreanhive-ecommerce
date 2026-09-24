import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { stripSiteSuffix, withSiteSuffix } from "@/lib/site";

/**
 * Regression test for the doubled title suffix.
 *
 * The catalogue sheet writes its own meta titles and most already end in
 * "| Korean Hive"; the root layout's title template appended the same suffix
 * again, so all 279 product pages were titled
 * "… | Korean Hive | Korean Hive" — wasting the pixels a search snippet gives
 * the product name, and truncating some titles before the name finished.
 */
describe("withSiteSuffix", () => {
  it("leaves a title that already carries the suffix with one copy", () => {
    assert.equal(
      withSiteSuffix("W.skin Laboratory Stop-Aging Peptide 250ml | Korean Hive"),
      "W.skin Laboratory Stop-Aging Peptide 250ml | Korean Hive",
    );
  });

  it("normalises the suffix regardless of case or spacing", () => {
    assert.equal(withSiteSuffix("Anua Toner | korean hive  "), "Anua Toner | Korean Hive");
    assert.equal(withSiteSuffix("Anua Toner |Korean Hive"), "Anua Toner | Korean Hive");
  });

  it("adds the suffix when the sheet left it off", () => {
    assert.equal(
      withSiteSuffix("Purito Oat PDRN Gentle Refining Toner 200ml"),
      "Purito Oat PDRN Gentle Refining Toner 200ml | Korean Hive",
    );
  });

  it('replaces the sheet\'s "| Korean Hive BD" rather than stacking a second brand', () => {
    // the newer sheets end titles this way; it rendered as
    // "… | Korean Hive BD | Korean Hive"
    assert.equal(
      withSiteSuffix("Tenzero Retinol Ampoule 50ml | Korean Hive BD"),
      "Tenzero Retinol Ampoule 50ml | Korean Hive",
    );
  });
});

describe("stripSiteSuffix", () => {
  it("leaves the page part for the layout template to suffix", () => {
    assert.equal(stripSiteSuffix("Toner | Korean Hive BD"), "Toner");
    assert.equal(stripSiteSuffix("Toner | Korean Hive"), "Toner");
    assert.equal(stripSiteSuffix("Toner"), "Toner");
  });

  it("does not touch the brand name mid-title", () => {
    assert.equal(
      stripSiteSuffix("Korean Hive Picks: Toners"),
      "Korean Hive Picks: Toners",
    );
  });
});
