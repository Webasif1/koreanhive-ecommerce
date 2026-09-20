import assert from "node:assert/strict";
import { test } from "node:test";

import { canonicalColumn, parseMoney } from "../src/lib/import/columns";

/**
 * The header contract for the catalogue sheets we actually import.
 *
 * An unrecognised header is ignored silently — which is the right default for
 * a working sheet full of notes and tick boxes, and the wrong one for a column
 * that carries a product's name or price. When the 2026 expansion sheet first
 * arrived, three of its headers matched nothing and every row failed with
 * "new products need a name" / "new products need a price"; nothing in the
 * types or the linter could have caught it, because every header is a valid
 * string. So the headers are pinned here instead.
 */

/** Exactly as the expansion sheet spells them. */
const EXPANSION_SHEET_HEADERS: Array<[string, string | null]> = [
  ["Brand", "brand"],
  ["Product Title (English)", "name"],
  ["Size", "size"],
  ["Category", "category"],
  ["SEO Slug", "slug"],
  ["Meta Title", "metaTitle"],
  ["Meta Description", "metaDescription"],
  ["Product Description (Short)", "shortDescription"],
  ["Suggested Korean Hive Price (BDT)", "price"],
  ["Image URL", "images"],

  // Deliberately ignored. Bangla titles have nowhere to go in the product
  // model yet, and the rest are working notes.
  ["Product Title (Bangla)", null],
  ["Source Link", null],
  ["SEO Keywords", null],
  ["image url other site", null],
  ["Status", null],
  ["Error", null],
];

test("the expansion sheet's headers map to the fields they carry", () => {
  for (const [header, expected] of EXPANSION_SHEET_HEADERS) {
    assert.equal(
      canonicalColumn(header),
      expected,
      expected === null
        ? `"${header}" should be ignored, but it now maps to a product field`
        : `"${header}" must map to ${expected} — without it every row is rejected`,
    );
  }
});

test("a competitor's price never becomes our comparePrice", () => {
  // comparePrice renders as a struck-through "was" price beside a "You save X"
  // badge, which asserts that Korean Hive charged that much before. A rival's
  // price is not our old price, and publishing it as one is a false discount
  // claim. If this ever starts mapping, the storefront starts lying.
  assert.equal(canonicalColumn("Competitor Price (BDT)"), null);
});

test("prices survive the sheet's thousands separators", () => {
  assert.equal(parseMoney("1,850"), 1850);
  assert.equal(parseMoney("999"), 999);
  assert.equal(parseMoney("2,250"), 2250);
});

test("a broken image cell is not mistaken for a price or a URL", () => {
  // Seven rows carry the literal text "404 not found" in the Image URL column.
  // They must fail the host check rather than import as a product with a
  // nonsense image.
  assert.equal(parseMoney("404 not found"), null);
});
