import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  customerEmailKindFor,
  customerOrderEmail,
  shopConfirmedEmail,
  shopNewOrderEmail,
  type EmailOrder,
} from "@/lib/email/templates";

/**
 * The order emails: what they must always carry, and what must never slip
 * through into the markup.
 *
 *   npm test
 */

const order = (over: Partial<EmailOrder> = {}): EmailOrder => ({
  orderNumber: "KH-260928-AB2CD",
  customerName: "Nusrat Jahan",
  customerPhone: "01712345678",
  customerEmail: "nusrat@example.com",
  addressLine: "House 12, Road 5",
  area: "Dhanmondi",
  district: "Dhaka",
  postalCode: "1205",
  note: null,
  subtotal: 4050,
  comboDiscount: 200,
  combos: [
    {
      slug: "korean-brightening-glow-combo",
      name: "Korean Brightening Glow Combo",
      sets: 1,
      price: 3850,
      regularPrice: 5049,
      productSlugs: ["cleanser", "ampoule", "cream"],
    },
  ],
  couponCode: null,
  discount: 0,
  shippingCharge: 0,
  total: 3850,
  placedAt: new Date("2026-09-28T10:00:00Z"),
  items: [
    { productName: "The Face Shop Rice Water Bright Cleanser 150ml", productSlug: "cleanser", unitPrice: 950, quantity: 1, lineTotal: 950 },
    { productName: "SKIN1004 Tone Brightening Ampoule 30ml", productSlug: "ampoule", unitPrice: 900, quantity: 1, lineTotal: 900 },
    { productName: "Dr.Althea 345 Relief Cream 50ml", productSlug: "cream", unitPrice: 2200, quantity: 1, lineTotal: 2200 },
  ],
  ...over,
});

/** An order with no combo: two plain products. */
const plainOrder = () =>
  order({
    subtotal: 1850,
    comboDiscount: 0,
    combos: [],
    total: 1850,
    items: [
      { productName: "The Face Shop Rice Water Bright Cleanser 150ml", productSlug: "cleanser", unitPrice: 950, quantity: 1, lineTotal: 950 },
      { productName: "SKIN1004 Tone Brightening Ampoule 30ml", productSlug: "ampoule", unitPrice: 900, quantity: 1, lineTotal: 900 },
    ],
  });

const KINDS = ["placed", "confirmed", "shipped", "delivered"] as const;

describe("customer order emails", () => {
  it("carry the tracking ID and a link to the tracking page", () => {
    for (const kind of KINDS) {
      const email = customerOrderEmail(order(), kind);
      assert.ok(email.subject.includes("KH-260928-AB2CD"), kind);
      assert.ok(email.html.includes("KH-260928-AB2CD"), kind);
      assert.ok(email.html.includes("/track?order=KH-260928-AB2CD"), kind);
      assert.ok(email.text.includes("/track?order=KH-260928-AB2CD"), kind);
    }
  });

  it("links to the real shop, never localhost", () => {
    const emails = [
      ...KINDS.map((kind) => customerOrderEmail(order(), kind)),
      shopNewOrderEmail(order()),
      shopConfirmedEmail(order(), "admin"),
    ];

    for (const email of emails) {
      assert.ok(!email.html.includes("localhost"), email.subject);
      assert.ok(!email.text.includes("localhost"), email.subject);
    }
    assert.ok(
      customerOrderEmail(order(), "placed").html.includes(
        'href="https://koreanhive.com/track?order=KH-260928-AB2CD"',
      ),
    );
  });

  it("escapes whatever the customer typed", () => {
    const email = customerOrderEmail(
      order({ customerName: "<script>alert(1)</script>", addressLine: '"><img src=x>' }),
      "placed",
    );
    assert.ok(!email.html.includes("<script>alert(1)"));
    assert.ok(!email.html.includes('"><img src=x>'));
    assert.ok(email.html.includes("&lt;script&gt;"));
  });

  it("says Free when delivery costs nothing, and the charge when it does", () => {
    assert.ok(customerOrderEmail(order(), "placed").text.includes("Delivery: Free"));
    assert.ok(
      customerOrderEmail(order({ shippingCharge: 120, total: 3970 }), "placed").text.includes(
        "Delivery: ৳120",
      ),
    );
  });

  it("shows a combo as one line at its combo price, not its products", () => {
    const { html, text } = customerOrderEmail(order(), "placed");

    assert.ok(text.includes("Korean Brightening Glow Combo (Combo) × 1  ৳3,850 (regular ৳5,049)"), text);
    assert.ok(text.includes("Subtotal: ৳3,850"), text);
    assert.ok(text.includes("You saved ৳1,199 with the combo"), text);
    for (const product of ["Rice Water Bright Cleanser", "Tone Brightening Ampoule", "345 Relief Cream"]) {
      assert.ok(!html.includes(product), `customer email lists ${product}`);
      assert.ok(!text.includes(product), `customer text lists ${product}`);
    }
    assert.ok(!text.includes("−৳200"), "the combo saving is already in the combo line");
  });

  it("lists products normally when the order has no combo", () => {
    const { text } = customerOrderEmail(plainOrder(), "placed");
    assert.ok(text.includes("The Face Shop Rice Water Bright Cleanser 150ml × 1  ৳950"), text);
    assert.ok(text.includes("Subtotal: ৳1,850"), text);
    assert.ok(!text.includes("You saved"), text);
  });

  it("regroups an older order that has no combo price stored", () => {
    const { text } = customerOrderEmail(
      order({ combos: [{ slug: "korean-brightening-glow-combo", name: "Korean Brightening Glow Combo", sets: 1, productSlugs: ["cleanser", "ampoule", "cream"] }] }),
      "placed",
    );
    assert.ok(text.includes("Korean Brightening Glow Combo (Combo) × 1  ৳3,850"), text);
    assert.ok(!text.includes("Combo saving"), text);
  });

  it("emails the customer only on placed, confirmed, shipped and delivered", () => {
    assert.equal(customerEmailKindFor("PENDING"), "placed");
    assert.equal(customerEmailKindFor("CONFIRMED"), "confirmed");
    assert.equal(customerEmailKindFor("SHIPPED"), "shipped");
    assert.equal(customerEmailKindFor("DELIVERED"), "delivered");
    assert.equal(customerEmailKindFor("PROCESSING"), null);
    assert.equal(customerEmailKindFor("CANCELLED"), null);
    assert.equal(customerEmailKindFor("RETURNED"), null);
  });
});

describe("shop order emails", () => {
  it("give staff everything needed to call and pack", () => {
    const { subject, text } = shopNewOrderEmail(order({ note: "Call after 5pm" }));
    assert.ok(subject.includes("KH-260928-AB2CD"));
    for (const expected of ["Nusrat Jahan", "01712345678", "Dhanmondi", "Call after 5pm", "/admin/orders/KH-260928-AB2CD"]) {
      assert.ok(text.includes(expected), expected);
    }
    // the combo as one line, with what goes in the parcel beside it
    assert.ok(text.includes("Korean Brightening Glow Combo (Combo · Pack:"), text);
    assert.ok(text.includes("Dr.Althea 345 Relief Cream 50ml"), text);
  });

  it("say who confirmed the order", () => {
    const { text } = shopConfirmedEmail(order(), "staff@koreanhive.com");
    assert.ok(text.includes("Confirmed by staff@koreanhive.com"));
  });
});
