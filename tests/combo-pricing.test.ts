import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyCombos, comboNames, type ComboRule } from "@/lib/combo-pricing";

/**
 * Regression tests for the combo price that was advertised but never charged.
 *
 * "Add combo to cart" put the members in as ordinary products, and nothing in
 * the cart or checkout knew about combos — so Glass Skin Starter, sold as
 * ৳3,990, was charged ৳4,149.
 */

const CLEANSER = { slug: "cleanser", unitPrice: 1100, quantity: 1 };
const ESSENCE = { slug: "essence", unitPrice: 700, quantity: 1 };
const CREAM = { slug: "cream", unitPrice: 999, quantity: 1 };
const SUNSCREEN = { slug: "sunscreen", unitPrice: 1350, quantity: 1 };

const GLASS: ComboRule = {
  slug: "glass-skin-starter",
  name: "Glass Skin Starter",
  price: 3990,
  productSlugs: ["cleanser", "essence", "cream", "sunscreen"],
};
const BREAKOUT: ComboRule = {
  slug: "breakout-basics",
  name: "Breakout Basics",
  price: 3290,
  productSlugs: ["salicylic", "cream", "sunscreen"],
};

describe("applyCombos", () => {
  it("takes a complete set down to the combo price", () => {
    const { comboDiscount, applied } = applyCombos(
      [CLEANSER, ESSENCE, CREAM, SUNSCREEN],
      [GLASS],
    );

    assert.equal(comboDiscount, 4149 - 3990);
    assert.deepEqual(applied, [
      { slug: "glass-skin-starter", name: "Glass Skin Starter", sets: 1, saving: 159 },
    ]);
  });

  it("counts as many sets as the scarcest member allows", () => {
    const { comboDiscount, applied } = applyCombos(
      [
        { ...CLEANSER, quantity: 2 },
        { ...ESSENCE, quantity: 2 },
        { ...CREAM, quantity: 3 },
        { ...SUNSCREEN, quantity: 2 },
      ],
      [GLASS],
    );

    assert.equal(applied[0].sets, 2);
    assert.equal(comboDiscount, 318);
  });

  it("gives nothing for an incomplete set", () => {
    const { comboDiscount, applied } = applyCombos([CLEANSER, CREAM, SUNSCREEN], [GLASS]);

    assert.equal(comboDiscount, 0);
    assert.deepEqual(applied, []);
  });

  it("uses each unit in one combo only, best saving first", () => {
    // Glass and Breakout share the cream and the sunscreen; one of each can
    // complete only one of them
    const salicylic = { slug: "salicylic", unitPrice: 1100, quantity: 1 };
    const { applied } = applyCombos(
      [CLEANSER, ESSENCE, CREAM, SUNSCREEN, salicylic],
      [BREAKOUT, GLASS],
    );

    assert.equal(applied.length, 1);
  });

  it("applies both when the shared members cover both", () => {
    const salicylic = { slug: "salicylic", unitPrice: 1100, quantity: 1 };
    const { applied } = applyCombos(
      [CLEANSER, ESSENCE, { ...CREAM, quantity: 2 }, { ...SUNSCREEN, quantity: 2 }, salicylic],
      [GLASS, BREAKOUT],
    );

    assert.deepEqual(
      applied.map((combo) => combo.slug).sort(),
      ["breakout-basics", "glass-skin-starter"],
    );
  });

  it("ignores a combo that costs as much as its parts", () => {
    const { comboDiscount } = applyCombos(
      [CLEANSER, ESSENCE, CREAM, SUNSCREEN],
      [{ ...GLASS, price: 4149 }],
    );

    assert.equal(comboDiscount, 0);
  });

  it("prices a set at the cheapest line when a member is in twice", () => {
    const { comboDiscount } = applyCombos(
      [CLEANSER, ESSENCE, CREAM, SUNSCREEN, { ...CLEANSER, unitPrice: 1300 }],
      [GLASS],
    );

    assert.equal(comboDiscount, 159);
  });
});

describe("comboNames", () => {
  it("names each combo, with a count only for more than one set", () => {
    assert.deepEqual(
      comboNames([
        { name: "Glass Skin Starter", sets: 1 },
        { name: "Breakout Basics", sets: 2 },
      ]),
      ["Glass Skin Starter", "Breakout Basics × 2"],
    );
    assert.deepEqual(comboNames(undefined), []);
  });
});
