import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { runChatTurn } from "@/lib/chatbot";
import { normalize } from "@/lib/chatbot/normalize";
import { extractBudget, parseSlots } from "@/lib/chatbot/slots";
import { EMPTY_SLOTS, type ChatCatalogItem, type PolicyFacts, type Slots } from "@/lib/chatbot/types";

/**
 * The engine is a pure function, so these run with no database, no Next.js
 * runtime and no network — a fixture array is the whole test harness.
 *
 *   npm test
 */

const POLICY: PolicyFacts = {
  zones: [
    { name: "Inside Dhaka", charge: 60, freeShippingThreshold: 2000, minDays: 1, maxDays: 2 },
    { name: "Outside Dhaka", charge: 120, freeShippingThreshold: null, minDays: 2, maxDays: 4 },
  ],
};

function product(over: Partial<ChatCatalogItem> & { slug: string }): ChatCatalogItem {
  return {
    name: over.slug,
    brand: null,
    categorySlug: null,
    categoryName: null,
    price: 1000,
    comparePrice: null,
    inStock: true,
    ratingAvg: 4.5,
    ratingCount: 20,
    imageUrl: null,
    benefit: null,
    ingredients: null,
    howToUse: null,
    concerns: [],
    ...over,
  };
}

const CATALOG: ChatCatalogItem[] = [
  product({
    slug: "hydra-essence",
    name: "Deep Hydra Essence",
    price: 1200,
    categorySlug: "essence",
    concerns: ["dryness", "dehydration"],
  }),
  product({
    slug: "rich-repair-oil",
    name: "Rich Repair Facial Oil",
    price: 1400,
    categorySlug: "moisturizer",
    concerns: ["dryness"],
  }),
  product({
    slug: "sold-out-cream",
    name: "Sold Out Dry Skin Cream",
    price: 900,
    inStock: false,
    concerns: ["dryness"],
  }),
  product({
    slug: "acid-toner",
    name: "Clarifying Acid Toner",
    price: 1300,
    categorySlug: "essence",
    concerns: ["acne", "large-pores", "oiliness"],
  }),
  product({
    slug: "luxury-serum",
    name: "Luxury Ceramide Serum",
    price: 6000,
    concerns: ["dryness"],
  }),
];

function turn(message: string, slots: Slots = EMPTY_SLOTS) {
  return runChatTurn({ message, slots }, CATALOG, POLICY);
}

describe("greetings and fallback", () => {
  it("greets", () => {
    const result = turn("hello");
    assert.equal(result.intent, "GREETING");
    assert.ok(result.quickReplies.length > 0);
  });

  it("does not treat a greeting prefix as a greeting", () => {
    const result = turn("hi, which toner is good for oily skin under 1500 taka?");
    assert.notEqual(result.intent, "GREETING");
  });

  it("admits ignorance rather than guessing", () => {
    const result = turn("do you sponsor football teams");
    assert.equal(result.intent, "UNKNOWN");
    assert.equal(result.products.length, 0);
    assert.ok(result.quickReplies.length > 0);
  });
});

describe("FAQs", () => {
  it("quotes delivery charges from the live policy, not a hardcoded number", () => {
    const result = turn("how much is delivery?");
    assert.equal(result.intent, "FAQ_SHIPPING");
    assert.match(result.message, /Inside Dhaka/);
    assert.match(result.message, /60/);
    assert.ok(!result.message.includes("{{"), "placeholder left unfilled");
  });

  it("answers delivery time", () => {
    const result = turn("how long does delivery take?");
    assert.equal(result.intent, "FAQ_SHIPPING");
    assert.match(result.message, /1–2 days/);
  });

  it("answers payment with cash on delivery", () => {
    const result = turn("can i pay by card?");
    assert.equal(result.intent, "FAQ_PAYMENT");
    assert.match(result.message, /[Cc]ash on delivery/);
  });

  it("routes order tracking to the track page without asking for details", () => {
    const result = turn("where is my order");
    assert.equal(result.intent, "ORDER_HELP");
    assert.ok(result.links.some((link) => link.href === "/track"));
  });
});

describe("safety", () => {
  it("never makes a medical claim, and never attaches products", () => {
    const result = turn("can this cure my eczema?");
    assert.equal(result.intent, "SAFETY_MEDICAL");
    assert.equal(result.products.length, 0);
    assert.doesNotMatch(result.message, /\bcures\b|\bwill treat\b/i);
  });

  it("gates medical questions ahead of the recommender", () => {
    // reads as a product request, but the condition must win
    const result = turn("recommend a cream for my eczema, i have dry skin");
    assert.equal(result.intent, "SAFETY_MEDICAL");
    assert.equal(result.products.length, 0);
  });

  it("refuses credential requests and warns about phishing", () => {
    const result = turn("what card number should i give");
    assert.equal(result.intent, "SAFETY_CREDENTIALS");
    assert.match(result.message, /never ask/i);
  });
});

describe("recommendation", () => {
  it("answers on a single named concern, and offers to narrow", () => {
    // It used to demand a second dimension before showing anything. That made
    // sense when skin type and use case also fed the score; now concerns carry
    // the ranking, so making someone answer a budget question before seeing a
    // product is an obstacle, not a conversation.
    const result = turn("i need something for dry skin");

    assert.equal(result.intent, "PRODUCT_RECOMMENDATION");
    assert.deepEqual(result.slots.concerns, ["dryness"]);
    assert.ok(result.products.length > 0, "one concern is enough to answer");
    assert.equal(result.needsMoreInfo, false);
    // narrowing is still one tap away
    assert.ok(result.quickReplies.some((reply) => /taka|budget/i.test(reply)));
  });

  it("asks rather than recommends when nothing is known", () => {
    const result = turn("which product is best for me?");
    assert.equal(result.needsMoreInfo, true);
    assert.equal(result.products.length, 0);
  });

  it("recommends once it knows two things, carrying slots across turns", () => {
    const first = turn("i have dry skin");
    const second = turn("under 1500 taka", first.slots);

    assert.equal(second.needsMoreInfo, false);
    assert.ok(second.products.length > 0);
    assert.ok(second.products.every((p) => p.price <= 1500 * 1.2));
    assert.equal(second.slots.budgetMax, 1500);
    assert.deepEqual(second.slots.concerns, ["dryness"]);
  });

  it("never recommends an out-of-stock product, however well it scores", () => {
    const result = turn("dry skin, hydration, under 1500 taka");
    assert.ok(result.products.length > 0);
    assert.ok(result.products.every((p) => p.slug !== "sold-out-cream"));
    assert.ok(result.products.every((p) => p.inStock));
  });

  it("ranks on the concerns the catalogue records against a product", () => {
    // the question this whole feature exists to answer
    const result = turn("my skin is oily, what should i use");

    assert.ok(result.products.length > 0, "oily skin must return something");
    assert.equal(
      result.products[0].slug,
      "acid-toner",
      "the only product recorded against oiliness must rank first",
    );
  });

  it("does not recommend a product for a concern it is not recorded against", () => {
    const result = turn("my skin is oily, what should i use");

    // rich-repair-oil is a dryness product; nothing marks it for oily skin
    assert.ok(result.products.every((p) => p.slug !== "rich-repair-oil"));
  });

  it("explains why, using only what actually matched", () => {
    const result = turn("dry skin, everyday hydration, under 1500");
    assert.ok(result.products.length > 0);
    assert.match(result.products[0].reason, /dry skin|hydration/i);
  });

  it("does not say the same fact twice when one phrase fills two slots", () => {
    // "dry skin" is both a concern and a skin type
    const result = turn("dry skin, everyday hydration, under 1500 taka");
    assert.doesNotMatch(result.message, /dry skin, dry skin/);
    assert.ok(result.products.length > 0);
    assert.doesNotMatch(result.products[0].reason, /dry skin.*dry skin/);
  });

  it("states a reason the catalogue actually supports", () => {
    const result = turn("oily skin with acne, under 1500 taka");

    assert.ok(result.products.length > 0);
    // the reason may only name concerns recorded against that product
    assert.match(result.products[0].reason, /acne|pores|oil/i);
  });

  it("says so honestly when nothing fits, instead of offering a random product", () => {
    const result = turn("dark circles, anti ageing, under 200 taka");
    assert.equal(result.products.length, 0);
    assert.equal(result.needsMoreInfo, true);
  });

  it("is deterministic — the same request ranks identically", () => {
    const a = turn("dry skin, hydration, under 1500 taka");
    const b = turn("dry skin, hydration, under 1500 taka");
    assert.deepEqual(
      a.products.map((p) => p.slug),
      b.products.map((p) => p.slug),
    );
  });
});

describe("product questions", () => {
  it("answers a price question from the catalogue", () => {
    const result = turn("how much is the Deep Hydra Essence");
    assert.equal(result.intent, "PRICE_QUERY");
    assert.match(result.message, /1,200/);
  });

  it("answers availability", () => {
    const result = turn("is the Clarifying Acid Toner in stock");
    assert.equal(result.intent, "AVAILABILITY");
    assert.match(result.message, /in stock/i);
  });

  it("answers a stock question about a product whose name is full of product words", () => {
    // "vitamin c" and "serum" are both vocabulary, so this used to score as a
    // recommendation request and answer with three unrelated products
    const result = turn("is the Clarifying Acid Toner serum in stock");
    assert.equal(result.intent, "AVAILABILITY");
    assert.equal(result.products.length, 0);
  });

  it("asks which product rather than answering about the wrong one", () => {
    const result = turn("how much is it");
    assert.equal(result.needsMoreInfo, true);
    assert.equal(result.products.length, 0);
  });
});

describe("input handling", () => {
  it("tolerates a misspelling", () => {
    const result = turn("i need a mositurizer for dry skin under 1500 taka");
    assert.ok(result.products.length > 0 || result.needsMoreInfo);
    assert.deepEqual(result.slots.concerns, ["dryness"]);
  });

  it("matches phrases whose plain-English form is mostly stop words", () => {
    // "in stock" normalises to "stock"; the phrase table has to normalise too
    assert.equal(turn("is the Clarifying Acid Toner in stock").intent, "AVAILABILITY");
  });

  it("treats markup as text, never as an instruction", () => {
    const result = turn("<script>alert(1)</script> dry skin under 1500 taka");
    assert.ok(!result.message.includes("<script>"));
  });

  it("reads a budget only from an explicit ceiling", () => {
    assert.equal(extractBudget(normalize("under 1500 taka")), 1500);
    assert.equal(extractBudget(normalize("spf 50 sunscreen")), null);
    assert.equal(extractBudget(normalize("a 50ml bottle")), null);
  });

  it("drops forged slot values rather than trusting them", () => {
    const parsed = parseSlots({
      concerns: ["dryness", "wealth"],
      skinType: "diamond",
      budgetMax: -5,
      category: "../../etc/passwd",
    });

    assert.deepEqual(parsed.concerns, ["dryness"]);
    assert.equal(parsed.skinType, null);
    assert.equal(parsed.budgetMax, null);
    assert.equal(parsed.category, null);
  });

  it("survives an empty message", () => {
    const result = turn("   ");
    assert.equal(result.intent, "UNKNOWN");
  });
});

describe("architecture", () => {
  it("keeps the engine free of the database", () => {
    const dir = join(process.cwd(), "src", "lib", "chatbot");

    for (const file of readdirSync(dir)) {
      const source = readFileSync(join(dir, file), "utf8");

      assert.ok(!source.includes('from "@/server'), `${file} imports from @/server`);
      assert.ok(!source.includes('from "mongoose"'), `${file} imports mongoose`);
      assert.ok(!source.includes("process.env"), `${file} reads process.env`);
    }
  });
});
