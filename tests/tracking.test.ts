import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { feedImage, toFeedItem, toXml, type FeedProduct } from "@/lib/tracking/feed";
import {
  itemsValue,
  metaCustomFromItems,
  metaPhone,
  toTrackItem,
} from "@/lib/tracking/shared";

describe("metaPhone", () => {
  it("turns every way a Bangladeshi number is written into E.164 digits", () => {
    for (const raw of ["01840830658", "+8801840830658", "008801840830658", "1840830658", "018-4083-0658"]) {
      assert.equal(metaPhone(raw), "8801840830658", raw);
    }
  });

  it("returns empty for no number, so nothing is hashed", () => {
    assert.equal(metaPhone(null), "");
    assert.equal(metaPhone(""), "");
  });
});

describe("toTrackItem", () => {
  it("uses the SKU as item_id, the id the Meta catalogue feed uses", () => {
    const item = toTrackItem({ sku: "KH-TNR-005", slug: "anua", name: "Anua", price: 3500 }, 2);
    assert.equal(item.item_id, "KH-TNR-005");
    assert.equal(item.quantity, 2);
  });

  it("falls back to the slug so a product without a SKU still reports", () => {
    assert.equal(toTrackItem({ sku: null, slug: "anua", name: "Anua", price: 1 }).item_id, "anua");
  });
});

describe("metaCustomFromItems", () => {
  const items = [
    toTrackItem({ sku: "A", name: "Serum", category: "Serum", price: 1850 }, 2),
    toTrackItem({ sku: "B", name: "Mask", price: 1650 }),
  ];

  it("sums price × quantity when no value is given", () => {
    assert.equal(itemsValue(items), 5350);
    assert.equal(metaCustomFromItems(items).value, 5350);
  });

  it("reports contents and item count for Meta", () => {
    const data = metaCustomFromItems(items, 5000);
    assert.equal(data.value, 5000);
    assert.deepEqual(data.content_ids, ["A", "B"]);
    assert.equal(data.num_items, 3);
    assert.equal(data.content_name, undefined); // only for a single item
  });

  it("names the product when there is exactly one", () => {
    const data = metaCustomFromItems([items[0]]);
    assert.equal(data.content_name, "Serum");
    assert.equal(data.content_category, "Serum");
  });
});

describe("meta feed", () => {
  const base: FeedProduct = {
    sku: "KH-SRM-013",
    name: "Medicube TXA Serum",
    slug: "medicube-txa",
    description: "**Fades** dark spots & brightens <skin>",
    shortDescription: null,
    price: 1850,
    comparePrice: 1900,
    inStock: true,
    images: ["https://ik.imagekit.io/koreanhive/a.webp", "https://ik.imagekit.io/koreanhive/b.webp?tr=w-200"],
    brand: "Medicube",
    categoryPath: ["Skincare", "Serum"],
  };
  const link = (path: string) => `https://koreanhive.com${path}`;

  it("puts the regular price in g:price and the selling price in g:sale_price", () => {
    const item = toFeedItem(base, link);
    assert.equal(item.price, 1900);
    assert.equal(item.salePrice, 1850);
  });

  it("has no sale price when there is no genuine discount", () => {
    assert.equal(toFeedItem({ ...base, comparePrice: null }, link).salePrice, null);
    assert.equal(toFeedItem({ ...base, comparePrice: 1500 }, link).salePrice, null);
    assert.equal(toFeedItem({ ...base, comparePrice: 1500 }, link).price, 1850);
  });

  it("asks ImageKit for a JPG once, and leaves an existing transform alone", () => {
    assert.equal(feedImage(base.images[0]), `${base.images[0]}?tr=f-jpg,w-1080`);
    assert.equal(feedImage(base.images[1]), base.images[1]);
  });

  it("escapes XML and strips markdown", () => {
    const xml = toXml([toFeedItem(base, link)], "https://koreanhive.com");
    assert.match(xml, /<g:id>KH-SRM-013<\/g:id>/);
    assert.match(xml, /Fades dark spots &amp; brightens &lt;skin&gt;/);
    assert.match(xml, /<g:sale_price>1850.00 BDT<\/g:sale_price>/);
    assert.match(xml, /<g:product_type>Skincare &gt; Serum<\/g:product_type>/);
    assert.doesNotMatch(xml, /\*\*/);
  });
});
