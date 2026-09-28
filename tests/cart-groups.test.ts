import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { groupCartLines, type ComboDisplay } from "@/lib/cart-groups";
import { applyCombos } from "@/lib/combo-pricing";

/**
 * A combo shows as one cart line, and the lines shown always add up to what
 * checkout charges.
 *
 *   npm test
 */

const line = (slug: string, unitPrice: number, quantity: number, stock = 25) => ({
  key: slug,
  slug,
  variantId: null,
  unitPrice,
  quantity,
  lineTotal: unitPrice * quantity,
  stock,
});

const glow: ComboDisplay = {
  slug: "glow",
  name: "Glow Combo",
  price: 3850,
  regularPrice: 5049,
  imageUrl: "https://ik.imagekit.io/koreanhive/combo/01.jpeg",
  productSlugs: ["cleanser", "ampoule", "cream"],
};

function group(lines: ReturnType<typeof line>[], combos = [glow]) {
  const { comboDiscount, applied } = applyCombos(lines, combos);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  return { ...groupCartLines(lines, applied, combos), charged: subtotal - comboDiscount };
}

const shown = (result: ReturnType<typeof group>) =>
  result.comboLines.reduce((sum, l) => sum + l.lineTotal, 0) +
  result.itemLines.reduce((sum, l) => sum + l.lineTotal, 0);

describe("groupCartLines", () => {
  it("shows a complete set as one line at the combo price", () => {
    const result = group([line("cleanser", 950, 1), line("ampoule", 900, 1), line("cream", 2200, 1)]);

    assert.equal(result.comboLines.length, 1);
    assert.equal(result.itemLines.length, 0);
    assert.equal(result.comboLines[0].sets, 1);
    assert.equal(result.comboLines[0].lineTotal, 3850);
    assert.equal(result.comboLines[0].comparePrice, 5049);
    assert.equal(shown(result), result.charged);
  });

  it("keeps extra units beside the combo as their own lines", () => {
    const result = group([line("cleanser", 950, 2), line("ampoule", 900, 1), line("cream", 2200, 1)]);

    assert.equal(result.comboLines[0].sets, 1);
    assert.deepEqual(
      result.itemLines.map((l) => [l.slug, l.quantity, l.lineTotal]),
      [["cleanser", 1, 950]],
    );
    assert.equal(shown(result), result.charged);
  });

  it("counts two sets as quantity two", () => {
    const result = group([line("cleanser", 950, 2), line("ampoule", 900, 2), line("cream", 2200, 2)]);

    assert.equal(result.comboLines[0].sets, 2);
    assert.equal(result.comboLines[0].lineTotal, 7700);
    assert.equal(result.itemLines.length, 0);
    assert.equal(shown(result), result.charged);
  });

  it("leaves an incomplete set as ordinary products", () => {
    const result = group([line("cleanser", 950, 1), line("ampoule", 900, 1)]);

    assert.equal(result.comboLines.length, 0);
    assert.equal(result.itemLines.length, 2);
    assert.equal(shown(result), result.charged);
  });

  it("caps the sets at the scarcest product's stock", () => {
    const result = group([
      line("cleanser", 950, 1, 25),
      line("ampoule", 900, 1, 3),
      line("cream", 2200, 1, 20),
    ]);
    assert.equal(result.comboLines[0].maxSets, 3);
  });

  it("falls back to the members' own prices without a stated regular price", () => {
    const result = group(
      [line("cleanser", 950, 1), line("ampoule", 900, 1), line("cream", 2200, 1)],
      [{ ...glow, regularPrice: null }],
    );
    assert.equal(result.comboLines[0].comparePrice, 4050);
  });
});
