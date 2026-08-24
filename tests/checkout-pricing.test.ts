import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BD_DISTRICTS,
  INSIDE_DHAKA_SLUG,
  OUTSIDE_DHAKA_SLUG,
  isBdDistrict,
  zoneSlugForDistrict,
} from "@/lib/bd-districts";
import { calcDiscount, calcShipping, calcTotals } from "@/lib/pricing";

/**
 * The money path. These are the two halves that decide what a customer is
 * charged, and both are pure — no database, no Next.js runtime.
 *
 *   npm test
 *
 * The zone tests exist because checkout used to read the delivery zone from a
 * hidden form field. Anyone could post `district=Chattogram` with
 * `zoneSlug=inside-dhaka` and pay half the delivery charge. The zone is now
 * derived from the district on the server; these lock that in.
 */

const INSIDE = { charge: 60, freeShippingThreshold: 2000 };
const OUTSIDE = { charge: 120, freeShippingThreshold: 3000 };

describe("delivery zone derivation", () => {
  it("puts Dhaka inside and everywhere else outside", () => {
    assert.equal(zoneSlugForDistrict("Dhaka"), INSIDE_DHAKA_SLUG);
    assert.equal(zoneSlugForDistrict("Chattogram"), OUTSIDE_DHAKA_SLUG);
    assert.equal(zoneSlugForDistrict("Khulna"), OUTSIDE_DHAKA_SLUG);
  });

  it("ignores casing and stray whitespace", () => {
    assert.equal(zoneSlugForDistrict("  dhaka  "), INSIDE_DHAKA_SLUG);
    assert.equal(zoneSlugForDistrict("DHAKA"), INSIDE_DHAKA_SLUG);
  });

  it("maps every real district to a zone", () => {
    for (const district of BD_DISTRICTS) {
      const slug = zoneSlugForDistrict(district);
      assert.ok(
        slug === INSIDE_DHAKA_SLUG || slug === OUTSIDE_DHAKA_SLUG,
        `${district} produced ${slug}`,
      );
    }
  });
});

describe("district allow-list", () => {
  it("accepts real districts", () => {
    assert.equal(isBdDistrict("Dhaka"), true);
    assert.equal(isBdDistrict("Cox's Bazar"), true);
  });

  it("rejects anything not on the list", () => {
    // an unknown string used to fall through to Outside Dhaka and be stored on
    // the order as the courier's destination
    assert.equal(isBdDistrict("Nowhere"), false);
    assert.equal(isBdDistrict(""), false);
    assert.equal(isBdDistrict("dhaka"), false, "casing must match the list");
  });
});

describe("shipping", () => {
  it("charges the zone rate below the threshold", () => {
    assert.equal(calcShipping(1500, INSIDE), 60);
    assert.equal(calcShipping(1500, OUTSIDE), 120);
  });

  it("is free at and above the threshold", () => {
    assert.equal(calcShipping(2000, INSIDE), 0);
    assert.equal(calcShipping(3000, OUTSIDE), 0);
  });

  it("still charges an outside order at an inside-only subtotal", () => {
    // the exact spread the old hidden field could be abused for
    assert.equal(calcShipping(2500, INSIDE), 0);
    assert.equal(calcShipping(2500, OUTSIDE), 120);
  });
});

describe("discount", () => {
  it("caps a percentage coupon at maxDiscount", () => {
    const coupon = {
      code: "SAVE10",
      type: "PERCENTAGE" as const,
      value: 10,
      minSubtotal: null,
      maxDiscount: 200,
    };

    assert.equal(calcDiscount(1000, coupon), 100);
    assert.equal(calcDiscount(5000, coupon), 200, "cap must bind");
  });

  it("returns nothing below minSubtotal", () => {
    const coupon = {
      code: "BIG",
      type: "FIXED" as const,
      value: 300,
      minSubtotal: 2000,
      maxDiscount: null,
    };

    assert.equal(calcDiscount(1999, coupon), 0);
    assert.equal(calcDiscount(2000, coupon), 300);
  });

  it("never discounts past the subtotal", () => {
    const coupon = {
      code: "HUGE",
      type: "FIXED" as const,
      value: 9999,
      minSubtotal: null,
      maxDiscount: null,
    };

    assert.equal(calcDiscount(500, coupon), 500);
  });
});

describe("totals", () => {
  const lines = [{ unitPrice: 1200, quantity: 2 }];

  it("measures free shipping against the pre-discount subtotal", () => {
    // 2400 clears the inside threshold; a coupon must not push it back into
    // paying delivery
    const totals = calcTotals({
      lines,
      zone: INSIDE,
      coupon: {
        code: "SAVE10",
        type: "PERCENTAGE",
        value: 10,
        minSubtotal: null,
        maxDiscount: null,
      },
    });

    assert.equal(totals.subtotal, 2400);
    assert.equal(totals.discount, 240);
    assert.equal(totals.shippingCharge, 0);
    assert.equal(totals.total, 2160);
  });

  it("adds the outside charge on the same basket", () => {
    const totals = calcTotals({ lines, zone: OUTSIDE, coupon: null });

    assert.equal(totals.shippingCharge, 120);
    assert.equal(totals.total, 2520);
  });
});
