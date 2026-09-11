import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ratingRequestPath, whatsappRatingLink } from "@/lib/rating-request";

/**
 * The link staff send after delivery ends up in chats, family groups and
 * browser histories. The property that matters is that it never carries the
 * phone number — the one detail that, with the order number, opens the order.
 */
describe("ratingRequestPath", () => {
  it("prefills the order number and jumps to the form", () => {
    assert.equal(
      ratingRequestPath("KH-260730-QJNJ"),
      "/reviews?order=KH-260730-QJNJ#rate",
    );
  });

  it("encodes whatever it is given rather than breaking the query", () => {
    assert.equal(ratingRequestPath("a&b=c"), "/reviews?order=a%26b%3Dc#rate");
  });
});

describe("whatsappRatingLink", () => {
  const url = "https://koreanhive.com/reviews?order=KH-260730-QJNJ#rate";

  it("opens a chat with the customer in international form", () => {
    const link = whatsappRatingLink({
      phone: "01712345678",
      customerName: "Tahmina Rahman",
      url,
    });

    assert.ok(link?.startsWith("https://wa.me/8801712345678?"));
  });

  it("accepts a number already written with the country code", () => {
    const link = whatsappRatingLink({ phone: "+880 1712-345678", customerName: "A", url });
    assert.ok(link?.startsWith("https://wa.me/8801712345678?"));
  });

  it("puts the rating link in the message, and the phone nowhere in it", () => {
    const link = whatsappRatingLink({
      phone: "01712345678",
      customerName: "Tahmina Rahman",
      url,
    });
    assert.ok(link);

    const text = new URL(link).searchParams.get("text") ?? "";
    assert.ok(text.includes(url));
    assert.ok(!text.includes("1712345678"), "the phone must not travel inside the message");
  });

  it("greets by first name only", () => {
    const link = whatsappRatingLink({
      phone: "01712345678",
      customerName: "Tahmina Rahman",
      url,
    });
    const text = new URL(link ?? "").searchParams.get("text") ?? "";

    assert.ok(text.includes("Tahmina"));
    assert.ok(!text.includes("Rahman"));
  });

  it("returns null for a number WhatsApp could not reach, not a dead link", () => {
    assert.equal(whatsappRatingLink({ phone: "12345", customerName: "A", url }), null);
    assert.equal(whatsappRatingLink({ phone: "01212345678", customerName: "A", url }), null);
  });
});
