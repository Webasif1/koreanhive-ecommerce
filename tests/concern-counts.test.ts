import assert from "node:assert/strict";
import { test } from "node:test";

import { countConcernProducts } from "@/lib/concern-count";
import { CONCERNS } from "@/data/concerns";

/**
 * The count under each concern tile. It is deduplicated because the relation
 * is many-to-one: "Acne & breakouts" covers both `acne` and `large-pores`,
 * and summing the two would double-count every product carrying both — the
 * tile would advertise more stock than the listing behind it can show, which
 * is the one way a count like this actually misleads a shopper.
 */

test("sums the products across a concern's taxonomy values", () => {
  const ids = { acne: ["a", "b"], "large-pores": ["c"] };
  assert.equal(countConcernProducts(ids, ["acne", "large-pores"]), 3);
});

test("counts a product carrying two of the values only once", () => {
  const ids = { acne: ["a", "b"], "large-pores": ["b", "c"] };
  // b is tagged both — 2 + 2 is 4, the honest answer is 3
  assert.equal(countConcernProducts(ids, ["acne", "large-pores"]), 3);
});

test("a taxonomy value with no products contributes nothing", () => {
  const ids = { acne: ["a"] };
  assert.equal(countConcernProducts(ids, ["acne", "large-pores"]), 1);
});

test("returns zero when the concern matches nothing", () => {
  assert.equal(countConcernProducts({}, ["acne"]), 0);
  assert.equal(countConcernProducts({ dryness: ["a"] }, []), 0);
});

test("every shipped concern has at least one taxonomy value to count on", () => {
  for (const concern of CONCERNS) {
    assert.ok(
      concern.taxonomy.length > 0,
      `${concern.slug} has no taxonomy, so its tile could never show a count`,
    );
  }
});

test("every concern image is a percent-encoded ImageKit URL", () => {
  for (const concern of CONCERNS) {
    assert.match(
      concern.image,
      /^https:\/\/ik\.imagekit\.io\/koreanhive\/skin%20concern\/[^ ]+\.webp$/,
      `${concern.slug}: a raw space in the filename 404s on ImageKit`,
    );
  }
});
