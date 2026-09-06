import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COMBOS, type ComboSeed } from "@/data/combos";
import { planCombo, type CatalogEntry } from "@/lib/combos";

/**
 * The rule this file exists to protect: a bundle is never published when a
 * shopper could not buy every product in it.
 *
 *   npm test
 */

const live = (price: number): CatalogEntry => ({
  name: "Live product",
  price,
  isActive: true,
});

const draft = (price: number): CatalogEntry => ({
  name: "Draft product",
  price,
  isActive: false,
});

const combo = (over: Partial<ComboSeed> = {}): ComboSeed => ({
  name: "Test Combo",
  slug: "test-combo",
  concern: "Testing",
  description: "A combo for tests.",
  productSlugs: ["a", "b"],
  price: 1500,
  position: 0,
  ...over,
});

const catalog = (entries: Record<string, CatalogEntry>) =>
  new Map(Object.entries(entries));

describe("combo publication", () => {
  it("publishes when every product is live and a price is set", () => {
    const plan = planCombo(
      combo(),
      catalog({ a: live(1000), b: live(800) }),
    );

    assert.equal(plan.status, "publish");
    if (plan.status !== "publish") return;

    assert.equal(plan.price, 1500);
    assert.equal(plan.comparePrice, 1800, "was-price is the members' real sum");
  });

  it("refuses a combo whose product is not in the catalogue", () => {
    const plan = planCombo(combo(), catalog({ a: live(1000) }));

    assert.equal(plan.status, "blocked");
    if (plan.status !== "blocked") return;
    assert.match(plan.blockers.join(" "), /missing from the catalogue: b/);
  });

  it("refuses a combo containing an unpublished draft", () => {
    // the case that matters: a draft has no image and its page will not
    // resolve, so the bundle would send shoppers to a dead end
    const plan = planCombo(
      combo(),
      catalog({ a: live(1000), b: draft(800) }),
    );

    assert.equal(plan.status, "blocked");
    if (plan.status !== "blocked") return;
    assert.match(plan.blockers.join(" "), /unpublished \(needs an image\): b/);
  });

  it("refuses a combo with no price rather than inventing one", () => {
    const plan = planCombo(
      combo({ price: null }),
      catalog({ a: live(1000), b: live(800) }),
    );

    assert.equal(plan.status, "blocked");
    if (plan.status !== "blocked") return;
    assert.match(plan.blockers.join(" "), /no price set/);
  });

  it("reports every blocker at once, not just the first", () => {
    const plan = planCombo(
      combo({ price: null, productSlugs: ["a", "gone"] }),
      catalog({ a: draft(1000) }),
    );

    assert.equal(plan.status, "blocked");
    if (plan.status !== "blocked") return;
    assert.equal(plan.blockers.length, 3, plan.blockers.join(" | "));
  });

  it("shows no saving when the bundle costs its parts or more", () => {
    // a "was" price that is not higher is a fake discount
    const plan = planCombo(
      combo({ price: 1800 }),
      catalog({ a: live(1000), b: live(800) }),
    );

    assert.equal(plan.status, "publish");
    if (plan.status !== "publish") return;
    assert.equal(plan.comparePrice, null);
  });
});

describe("the configured combos", () => {
  it("has unique slugs", () => {
    const slugs = COMBOS.map((entry) => entry.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it("lists products for every combo", () => {
    for (const entry of COMBOS) {
      assert.ok(entry.productSlugs.length > 0, `${entry.slug} has no products`);
    }
  });
});
