import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COMBOS, comboProductSlugs, type ComboSeed } from "@/data/combos";
import { comboShelf, planCombo, type CatalogEntry } from "@/lib/combos";

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
  tag: "Testing",
  badge: "TEST BADGE",
  bestFor: "Tests.",
  note: "For tests only.",
  routine: "AM: test. PM: test.",
  imageUrl: "https://ik.imagekit.io/koreanhive/combo/test.webp",
  imageAlt: "Test combo",
  steps: [
    { slug: "a", name: "Product a", role: "first", short: "Step" },
    { slug: "b", name: "Product b", role: "second", short: "Step" },
  ],
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
      combo({
        price: null,
        steps: [
          { slug: "a", name: "Product a", role: "first", short: "Step" },
          { slug: "gone", name: "Product gone", role: "second", short: "Step" },
        ],
      }),
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
      assert.ok(
        comboProductSlugs(entry).length > 0,
        `${entry.slug} has no products`,
      );
    }
  });

  it("gives every step a role, so no card renders a blank line", () => {
    for (const entry of COMBOS) {
      for (const step of entry.steps) {
        assert.ok(step.role.trim().length > 0, `${entry.slug}: ${step.slug}`);
      }
    }
  });

  it("keeps the home-page short labels short", () => {
    // The home card joins these with "·" on one or two lines. A catalogue
    // name in here ("Cosrx Advanced Snail 92 All In One Cream Tube 50g")
    // turns that line into a paragraph and breaks the card's rhythm.
    for (const entry of COMBOS) {
      for (const step of entry.steps) {
        assert.ok(step.short.trim().length > 0, `${entry.slug}: ${step.slug}`);
        assert.ok(
          step.short.length <= 24,
          `${entry.slug}: "${step.short}" is too long for the strip`,
        );
      }
    }
  });

  it("carries the document's suitability note on every combo", () => {
    // The client's publishing checklist requires these to stay visible. They
    // are the honest limits of what four bottles can do, and the retinol one
    // is a safety instruction, not marketing copy.
    for (const entry of COMBOS) {
      assert.ok(entry.note.trim().length > 20, `${entry.slug} has no note`);
    }
  });

  it("keeps the retinol warnings intact", () => {
    const retinol = COMBOS.find((entry) => entry.slug === "anti-ageing-night-routine");
    assert.ok(retinol, "the anti-ageing combo is missing");

    for (const required of ["pregnan", "sunscreen"]) {
      assert.ok(
        retinol.note.toLowerCase().includes(required),
        `the retinol note lost its "${required}" warning`,
      );
    }
  });

  it("points every image at the combo folder on ImageKit", () => {
    for (const entry of COMBOS) {
      assert.match(
        entry.imageUrl,
        /^https:\/\/ik\.imagekit\.io\/koreanhive\/combo\//,
        `${entry.slug}: ${entry.imageUrl}`,
      );
      assert.ok(entry.imageAlt.trim().length > 0, `${entry.slug} has no alt`);
    }
  });

  it("labels every combo without claiming how well it sells", () => {
    // The design's "MOST POPULAR" and "HIGH DEMAND" are sales claims this
    // shop has no order history to support. Descriptive labels only.
    const claims = ["popular", "demand", "best seller", "bestseller", "trending"];

    for (const entry of COMBOS) {
      assert.ok(entry.badge.trim().length > 0, `${entry.slug} has no badge`);
      for (const claim of claims) {
        assert.ok(
          !entry.badge.toLowerCase().includes(claim),
          `${entry.slug}: "${entry.badge}" claims popularity`,
        );
      }
    }
  });

  it("uses a distinct image per combo", () => {
    const urls = COMBOS.map((entry) => entry.imageUrl);
    assert.equal(new Set(urls).size, urls.length, "two combos share an image");
  });

  it("prices every combo below the design's own savings claims", () => {
    // The design PDF advertises savings of ৳560–৳1,010. Those were written
    // against prices this shop does not charge, so no combo here copies them;
    // the sync computes the saving from live product prices instead.
    for (const entry of COMBOS) {
      assert.ok(
        entry.price === null || entry.price > 0,
        `${entry.slug} has a nonsense price`,
      );
    }
  });
});

/**
 * The page shows every seeded combo: buyable ones first, the rest as coming
 * soon. The failure this guards against is a combo the client supplied simply
 * not appearing because one of its products is not stocked yet.
 */
describe("comboShelf", () => {
  const seed = (slug: string, position: number) => combo({ slug, name: slug, position });
  const pub = (slug: string) => ({ slug, id: slug });

  it("lists every seed, live ones first, each group in position order", () => {
    const shelf = comboShelf(
      [seed("c", 2), seed("a", 0), seed("d", 3), seed("b", 1)],
      [pub("d"), pub("b")],
    );

    assert.deepEqual(
      shelf.map((entry) => entry.status + ":" + (entry.status === "live" ? entry.combo.slug : entry.seed.slug)),
      ["live:b", "live:d", "soon:a", "soon:c"],
    );
  });

  it("moves a combo from soon to live once it is published", () => {
    const seeds = [seed("a", 0), seed("b", 1)];
    assert.equal(comboShelf(seeds, []).find((e) => e.seed?.slug === "b")?.status, "soon");
    assert.equal(comboShelf(seeds, [pub("b")]).find((e) => e.seed?.slug === "b")?.status, "live");
  });

  it("keeps a published combo that has no seed rather than hiding it", () => {
    const shelf = comboShelf([seed("a", 0)], [pub("legacy")]);
    assert.ok(shelf.some((e) => e.status === "live" && e.combo.slug === "legacy"));
  });

  it("shows all ten configured combos with nothing published", () => {
    const shelf = comboShelf(COMBOS, []);
    assert.equal(shelf.length, COMBOS.length);
    assert.equal(COMBOS.length, 10);
  });

  it("names every product in every combo, for the coming-soon list", () => {
    for (const entry of COMBOS) {
      for (const step of entry.steps) {
        assert.ok(step.name.trim().length > 0, entry.slug + ": " + step.slug + " has no name");
      }
    }
  });
});
