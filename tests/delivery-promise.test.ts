import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  deliveryPromise,
  deliveryWindowsBn,
  toBanglaDigits,
} from "@/lib/delivery-promise";

/**
 * Regression tests for the free-delivery mismatch.
 *
 * The banner on every page read "৳2500+ অর্ডারে সারা বাংলাদেশে FREE DELIVERY"
 * as a hardcoded string. The real thresholds are ৳2,000 inside Dhaka and
 * ৳3,000 outside it, so a ৳2,500 order to Chattogram was promised free
 * delivery and then charged ৳120 at checkout — on cash on delivery, a refused
 * parcel rather than an abandoned cart.
 */
const SEEDED_ZONES = [
  { name: "Inside Dhaka", charge: 60, freeShippingThreshold: 2000 },
  { name: "Outside Dhaka", charge: 120, freeShippingThreshold: 3000 },
];

describe("deliveryPromise", () => {
  it("never claims one nationwide threshold when the zones disagree", () => {
    const { bn, en } = deliveryPromise(SEEDED_ZONES);

    assert.ok(!bn.includes("সারা বাংলাদেশে"), "must not promise nationwide");
    assert.ok(bn.includes("২০০০"), "inside-Dhaka threshold is stated");
    assert.ok(bn.includes("৩০০০"), "outside-Dhaka threshold is stated");
    assert.ok(en.includes("2,000") && en.includes("3,000"));
  });

  it("never advertises a threshold no zone actually offers", () => {
    const { bn } = deliveryPromise(SEEDED_ZONES);
    assert.ok(!bn.includes("২৫০০"), "the old hardcoded ৳2500 must be gone");
  });

  it("collapses to one sentence when every zone shares a threshold", () => {
    const { bn, en } = deliveryPromise([
      { name: "Inside Dhaka", charge: 60, freeShippingThreshold: 2500 },
      { name: "Outside Dhaka", charge: 120, freeShippingThreshold: 2500 },
    ]);

    assert.ok(bn.includes("সারা বাংলাদেশে"));
    assert.ok(bn.includes("২৫০০"));
    assert.equal(en, "Free delivery nationwide over ৳2,500");
  });

  it("makes no free-delivery claim when no zone offers one", () => {
    const { bn, en } = deliveryPromise([
      { name: "Inside Dhaka", charge: 60, freeShippingThreshold: null },
    ]);

    assert.ok(!bn.includes("ফ্রি ডেলিভারি"));
    assert.equal(en, "Cash on delivery nationwide");
  });

  it("does not promise nationwide when only one of several zones qualifies", () => {
    const { bn } = deliveryPromise([
      { name: "Inside Dhaka", charge: 60, freeShippingThreshold: 2000 },
      { name: "Outside Dhaka", charge: 120, freeShippingThreshold: null },
    ]);

    assert.ok(!bn.includes("সারা বাংলাদেশে"));
    assert.ok(bn.includes("ঢাকায়"));
  });
});

describe("toBanglaDigits", () => {
  it("converts every digit", () => {
    assert.equal(toBanglaDigits(2000), "২০০০");
    assert.equal(toBanglaDigits(1234567890), "১২৩৪৫৬৭৮৯০");
  });
});

describe("deliveryWindowsBn", () => {
  it("renders a range per zone", () => {
    const text = deliveryWindowsBn([
      { name: "Inside Dhaka", minDays: 1, maxDays: 2 },
      { name: "Outside Dhaka", minDays: 2, maxDays: 4 },
    ]);

    assert.equal(text, "ঢাকায় ১–২ দিন · ঢাকার বাইরে ২–৪ দিন");
  });

  it("collapses a single-day window", () => {
    const text = deliveryWindowsBn([
      { name: "Inside Dhaka", minDays: 1, maxDays: 1 },
    ]);

    assert.equal(text, "ঢাকায় ১ দিন");
  });
});
