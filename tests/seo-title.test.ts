import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { withSiteSuffix } from "@/lib/site";

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
  it("leaves a title that already carries the suffix alone", () => {
    assert.equal(
      withSiteSuffix("W.skin Laboratory Stop-Aging Peptide 250ml | Korean Hive"),
      "W.skin Laboratory Stop-Aging Peptide 250ml | Korean Hive",
    );
  });

  it("matches the suffix regardless of case or trailing space", () => {
    assert.equal(withSiteSuffix("Anua Toner | korean hive  "), "Anua Toner | korean hive");
    assert.equal(withSiteSuffix("Anua Toner |Korean Hive"), "Anua Toner |Korean Hive");
  });

  it("adds the suffix when the sheet left it off", () => {
    assert.equal(
      withSiteSuffix("Purito Oat PDRN Gentle Refining Toner 200ml"),
      "Purito Oat PDRN Gentle Refining Toner 200ml | Korean Hive",
    );
  });

  it("does not strip a brand that merely contains the words", () => {
    // "Korean Hive BD" is not the suffix, so the suffix is still appended
    assert.equal(
      withSiteSuffix("Tenzero Retinol Ampoule 50ml | Korean Hive BD"),
      "Tenzero Retinol Ampoule 50ml | Korean Hive BD | Korean Hive",
    );
  });
});
