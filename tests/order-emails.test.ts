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
  combos: [{ name: "Korean Brightening Glow Combo", sets: 1 }],
  couponCode: null,
  discount: 0,
  shippingCharge: 0,
  total: 3850,
  placedAt: new Date("2026-09-28T10:00:00Z"),
  items: [
    { productName: "The Face Shop Rice Water Bright Cleanser 150ml", quantity: 1, lineTotal: 950 },
    { productName: "Dr.Althea 345 Relief Cream 50ml", quantity: 1, lineTotal: 2200 },
  ],
  ...over,
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

  it("names the combo saving", () => {
    const { text } = customerOrderEmail(order(), "placed");
    assert.ok(text.includes("Combo saving (Korean Brightening Glow Combo): −৳200"), text);
    assert.ok(text.includes("৳3,850"));
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
  });

  it("say who confirmed the order", () => {
    const { text } = shopConfirmedEmail(order(), "staff@koreanhive.com");
    assert.ok(text.includes("Confirmed by staff@koreanhive.com"));
  });
});
