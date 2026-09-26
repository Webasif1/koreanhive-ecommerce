import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { productJsonLd } from "@/lib/json-ld";

/**
 * Regression test for the schema price on discounted products.
 *
 * The product page passed product.price to the schema while the buy box led
 * with the first variant's price, so Google (and anything reading the page's
 * JSON-LD) saw ৳150 for a product that sells at ৳100, with no sign of a sale.
 */
const base = {
  name: "Tocobo Collagen Brightening Eye Gel Cream 1ml",
  slug: "tocobo-collagen-brightening-eye-gel-cream-1ml",
  description: "**Tocobo** eye gel",
  sku: "KH-EYE-013",
  images: ["https://ik.imagekit.io/koreanhive/eye.webp"],
  inStock: true,
  brandName: "Tocobo",
  ratingAvg: 0,
  ratingCount: 0,
  priceRange: null,
};

describe("productJsonLd pricing", () => {
  it("leads with the selling price and marks the old one as struck through", () => {
    const offers = productJsonLd({ ...base, price: 100, comparePrice: 150 })
      .offers as Record<string, unknown>;
    assert.equal(offers.price, 100);
    assert.deepEqual(offers.priceSpecification, [
      { "@type": "UnitPriceSpecification", price: 100, priceCurrency: "BDT" },
      {
        "@type": "UnitPriceSpecification",
        priceType: "https://schema.org/StrikethroughPrice",
        price: 150,
        priceCurrency: "BDT",
      },
    ]);
  });

  it("adds no strikethrough when the compare price is not higher", () => {
    for (const comparePrice of [null, 100, 90]) {
      const offers = productJsonLd({ ...base, price: 100, comparePrice })
        .offers as Record<string, unknown>;
      assert.equal(offers.price, 100);
      assert.equal(offers.priceSpecification, undefined);
    }
  });

  it("strips markdown from the description", () => {
    assert.equal(
      productJsonLd({ ...base, price: 100 }).description,
      "Tocobo eye gel",
    );
  });
});
