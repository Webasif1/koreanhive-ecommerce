import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

import type { ChatCatalogItem, PolicyFacts } from "@/lib/chatbot/types";
import { acceptRewrite, numbersIn } from "@/lib/whatsapp/guard";
import { detectLanguage } from "@/lib/whatsapp/language";
import { parseWebhook } from "@/lib/whatsapp/payload";
import {
  INITIAL_SALES_STATE,
  runSalesTurn,
  type SalesState,
  type SalesTurn,
} from "@/lib/whatsapp/sales";
import { looksLikeDetails, readSignals } from "@/lib/whatsapp/signals";
import { verifySignature } from "@/lib/whatsapp/signature";

/**
 * The WhatsApp bot's selling logic is pure, like the site assistant's engine:
 * a fixture catalogue and a conversation state are the whole harness. The
 * sales script it follows is pinned here turn by turn.
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
    slug: "anua-heartleaf-toner",
    name: "Anua Heartleaf Soothing Toner",
    brand: "Anua",
    price: 1250,
    comparePrice: 1500,
    categorySlug: "toner",
    concerns: ["redness", "sensitivity"],
    benefit: "Calms and hydrates sensitive skin.",
  }),
  product({
    slug: "budget-calming-toner",
    name: "Budget Calming Toner",
    price: 800,
    categorySlug: "toner",
    concerns: ["redness"],
  }),
  product({
    slug: "cosrx-snail-essence",
    name: "Cosrx Snail Mucin Essence",
    brand: "Cosrx",
    price: 1400,
    comparePrice: null,
    concerns: ["dryness", "dehydration"],
  }),
  product({
    slug: "sold-out-sunscreen",
    name: "Sold Out Sunscreen",
    price: 1100,
    inStock: false,
    categorySlug: "sunscreen",
    concerns: ["sun-protection"],
  }),
  product({
    slug: "daily-sunscreen",
    name: "Daily Sunscreen",
    price: 950,
    categorySlug: "sunscreen",
    concerns: ["sun-protection"],
  }),
];

function say(message: string, state: SalesState = INITIAL_SALES_STATE, name: string | null = "Rina") {
  return runSalesTurn({ message, name, state, catalog: CATALOG, policy: POLICY });
}

/** Plays a conversation and returns every turn. */
function chat(...messages: string[]): SalesTurn[] {
  const turns: SalesTurn[] = [];
  let state = INITIAL_SALES_STATE;
  for (const message of messages) {
    const turn = say(message, state);
    turns.push(turn);
    state = turn.state;
  }
  return turns;
}

describe("language", () => {
  it("tells Bangla, Banglish and English apart", () => {
    assert.equal(detectLanguage("এই টোনারের দাম কত?"), "bn");
    assert.equal(detectLanguage("Anua toner er dam koto?"), "banglish");
    assert.equal(detectLanguage("amar skin oily, ki use korbo"), "banglish");
    assert.equal(detectLanguage("How much is the Anua toner?"), "en");
  });

  it("keeps the conversation's language for a message with nothing to go on", () => {
    assert.equal(detectLanguage("ok", "bn"), "bn");
    assert.equal(detectLanguage("price?", "banglish"), "banglish");
    assert.equal(detectLanguage("👍", "banglish"), "banglish");
    assert.equal(detectLanguage("hi"), "en");
  });

  it("treats a Bangla sentence with an English brand name as Bangla", () => {
    assert.equal(detectLanguage("Anua Heartleaf টোনারটা কি অরিজিনাল?"), "bn");
    assert.equal(detectLanguage("Anua heartleaf toner এর দাম কত?"), "bn");
  });

  it("does not switch to English for an address typed in Latin letters", () => {
    assert.equal(detectLanguage("Rina, House 12, Road 5, Mirpur", "banglish"), "banglish");
  });
});

describe("signals", () => {
  it("does not read 'damaged' as a price word", () => {
    const signals = readSignals("my order came damaged");
    assert.equal(signals.priceWord, false);
    assert.equal(signals.complaint, true);
  });

  it("does not read 'beshi oily' as a price objection", () => {
    assert.equal(readSignals("amar skin beshi oily").objection, false);
    assert.equal(readSignals("dam beshi hoye gelo").objection, true);
    assert.equal(readSignals("দাম বেশি").objection, true);
  });

  it("tells 'where is my order' apart from 'I want to order'", () => {
    assert.equal(readSignals("amar order kothay?").orderStatus, true);
    assert.equal(readSignals("amar order kothay?").wantsOrder, false);
    assert.equal(readSignals("order korbo").wantsOrder, true);
    assert.equal(readSignals("আমার অর্ডার কোথায়").orderStatus, true);
  });

  it("reads the product from the website button's prefilled link", () => {
    const signals = readSignals(
      "Hi Korean Hive! I have a question about this product: https://koreanhive.com/product/anua-heartleaf-toner",
    );
    assert.equal(signals.productSlug, "anua-heartleaf-toner");
  });

  it("recognises an address as order details, and a question as not", () => {
    assert.equal(looksLikeDetails("Rina, House 12, Road 5, Dhanmondi, Dhaka"), true);
    assert.equal(looksLikeDetails("বাসা ১২, রোড ৫, মিরপুর"), true);
    assert.equal(looksLikeDetails("delivery koto din lagbe?"), false);
  });
});

describe("script 1 and 2: price", () => {
  it("asks one qualifying question before the first price", () => {
    const [turn] = chat("Anua heartleaf toner er dam koto?");
    assert.equal(turn.kind, "qualify");
    assert.equal(turn.language, "banglish");
    assert.equal(turn.state.stage, "qualifying");
    assert.ok(!turn.reply.includes("1,250"), "script 1 must not give the price yet");
    assert.ok(turn.reply.startsWith("Assalamu alaikum Rina!"));
  });

  it("gives the price as a value sandwich once they answer", () => {
    const [, turn] = chat("Anua heartleaf toner er dam koto?", "nijer jonno, skin sensitive");
    assert.equal(turn.kind, "offer");
    assert.ok(turn.reply.includes("~৳1,500~"), "real compare price");
    assert.ok(turn.reply.includes("*৳1,250*"), "offer price");
    assert.ok(turn.reply.includes("৳250"), "saving");
    assert.ok(turn.reply.includes("https://koreanhive.com/product/anua-heartleaf-toner"));
    assert.ok(turn.reply.includes("Dhakar bhitore naki baire?"), "closing question");
  });

  it("gives the price straight away the second time it is asked", () => {
    const [, turn] = chat("How much is the Anua heartleaf toner?", "price please");
    assert.equal(turn.kind, "offer");
  });

  it("skips the question when the customer already said who it is for", () => {
    const [turn] = chat("Anua heartleaf toner price? it's a gift for my sister");
    assert.equal(turn.kind, "offer");
  });

  it("never shows a regular price the product does not have", () => {
    const [, turn] = chat("cosrx snail mucin essence price", "for myself");
    assert.equal(turn.kind, "offer");
    assert.ok(!turn.reply.includes("~"), "no strike-through without a compare price");
    assert.ok(turn.reply.includes("*৳1,400*"));
  });

  it("answers in Bangla script when asked in Bangla", () => {
    const [, turn] = chat("Anua heartleaf toner এর দাম কত?", "নিজের জন্য");
    assert.equal(turn.language, "bn");
    assert.ok(turn.reply.includes("নিয়মিত মূল্য"));
  });

  it("starts script 1 from the website button's product link", () => {
    const [turn] = chat(
      "Hi Korean Hive! I have a question about this product: https://koreanhive.com/product/anua-heartleaf-toner",
    );
    assert.equal(turn.kind, "qualify");
    assert.equal(turn.state.focusSlug, "anua-heartleaf-toner");
  });

  it("offers an in-stock alternative for a sold-out product", () => {
    const [turn] = chat("sold out sunscreen price");
    assert.equal(turn.kind, "out-of-stock");
    assert.ok(turn.reply.includes("Daily Sunscreen"));
  });

  it("asks which product when the price is asked about nothing", () => {
    const [turn] = chat("price koto?");
    assert.equal(turn.kind, "pick-product");
  });
});

describe("script 3: too expensive", () => {
  it("answers with value and a real cheaper option", () => {
    const [, , turn] = chat("Anua heartleaf toner price", "for me", "dam beshi");
    assert.equal(turn.kind, "objection");
    assert.ok(turn.reply.includes("Budget Calming Toner"));
    assert.ok(turn.reply.includes("৳800"));
  });

  it("only offers the same kind of product, and only if it is noticeably cheaper", () => {
    const catalog = [
      product({ slug: "big-toner", name: "Big Heartleaf Toner", price: 3500, categorySlug: "toner", concerns: ["sensitivity"] }),
      product({ slug: "baby-lotion", name: "Baby Lotion", price: 3300, categorySlug: "body", concerns: ["sensitivity"] }),
      product({ slug: "nearly-same-toner", name: "Nearly Same Toner", price: 3400, categorySlug: "toner" }),
    ];
    let state = INITIAL_SALES_STATE;
    for (const message of ["big heartleaf toner price", "for me", "too expensive"]) {
      const turn = runSalesTurn({ message, name: null, state, catalog, policy: POLICY });
      state = turn.state;
      if (message === "too expensive") {
        assert.ok(!turn.reply.includes("Baby Lotion"), "different kind of product");
        assert.ok(!turn.reply.includes("Nearly Same Toner"), "not noticeably cheaper");
      }
    }
  });
});

describe("ordering and hand-off", () => {
  it("asks for details after a yes, then hands the order to staff", () => {
    const turns = chat(
      "Anua heartleaf toner price",
      "for myself",
      "yes",
      "Rina Akter, House 12, Road 5, Dhanmondi, Dhaka",
    );

    assert.equal(turns[2].kind, "ask-details");
    assert.equal(turns[2].state.stage, "awaiting_details");
    assert.ok(turns[2].reply.includes("৳60"), "real delivery charge");

    const done = turns[3];
    assert.equal(done.kind, "order-received");
    assert.equal(done.handoff?.reason, "order");
    assert.equal(done.handoff?.details, "Rina Akter, House 12, Road 5, Dhanmondi, Dhaka");
  });

  it("takes 'inside Dhaka' as a yes to the offer", () => {
    const [, , turn] = chat("Anua heartleaf toner price", "gift", "dhakar bhitore");
    assert.equal(turn.kind, "ask-details");
  });

  it("hands a complaint to a person", () => {
    const [turn] = chat("product ta vanga eseche");
    assert.equal(turn.handoff?.reason, "complaint");
  });

  it("hands over after two messages it cannot place", () => {
    const [first, second] = chat("asdf qwer zxcv", "lorem ipsum dolor");
    assert.equal(first.kind, "fallback");
    assert.equal(second.handoff?.reason, "unclear");
  });

  it("reports the customer's latest order", () => {
    const turn = runSalesTurn({
      message: "amar order kothay?",
      name: null,
      state: INITIAL_SALES_STATE,
      catalog: CATALOG,
      policy: POLICY,
      latestOrder: { orderNumber: "KH-1042", status: "SHIPPED" },
    });
    assert.equal(turn.kind, "order-status");
    assert.ok(turn.reply.includes("KH-1042"));
    assert.ok(turn.reply.includes("courier"));
  });
});

describe("safety", () => {
  it("never sells into a medical question", () => {
    const [turn] = chat("Anua toner ki eczema sarabe? dam koto?");
    assert.equal(turn.kind, "safety");
    assert.equal(turn.rephrase, false);
  });

  it("warns about sharing an OTP, in Bangla", () => {
    const [turn] = chat("আমার বিকাশ ওটিপি দিলাম");
    assert.equal(turn.kind, "safety");
    assert.equal(turn.language, "bn");
  });
});

describe("every reply asks something", () => {
  it("holds across a whole conversation", () => {
    const turns = chat(
      "assalamu alaikum",
      "delivery charge koto?",
      "product original to?",
      "Anua heartleaf toner er dam koto?",
      "nijer jonno",
      "dam beshi",
      "ok",
      "Rina, House 12, Road 5, Mirpur, Dhaka",
    );

    for (const turn of turns) {
      assert.ok(/[?？]/.test(turn.reply), `${turn.kind} reply asks nothing:\n${turn.reply}`);
    }
  });
});

describe("rewrite guard", () => {
  const template =
    "Regular price ~৳1,500~, now only *৳1,250*.\n\nhttps://koreanhive.com/product/anua-heartleaf-toner\n\nShall I book one?";

  it("reads Bangla digits and thousands separators", () => {
    assert.deepEqual(numbersIn("৳১,২৫০ আর ৳1,500"), [1250, 1500]);
  });

  it("accepts a rewrite that keeps the facts", () => {
    assert.ok(
      acceptRewrite(
        "Regular dam ৳১,৫০০, ekhon matro ৳1,250! https://koreanhive.com/product/anua-heartleaf-toner Book kore dibo?",
        template,
        [],
      ),
    );
  });

  it("rejects an invented price or stock count", () => {
    assert.ok(
      !acceptRewrite(
        "Only ৳999 today! https://koreanhive.com/product/anua-heartleaf-toner Book?",
        template,
        [],
      ),
    );
    assert.ok(
      !acceptRewrite(
        "৳1,250, only 2 left! https://koreanhive.com/product/anua-heartleaf-toner Book?",
        template,
        [],
      ),
    );
  });

  it("rejects a rewrite that drops the link or the question", () => {
    assert.ok(!acceptRewrite("Now only ৳1,250. Book one?", template, []));
    assert.ok(
      !acceptRewrite("Now only ৳1,250. https://koreanhive.com/product/anua-heartleaf-toner", template, []),
    );
  });

  it("allows numbers the customer wrote", () => {
    assert.ok(acceptRewrite("House 12 noted — anything else?", "Noted — anything else?", ["House 12"]));
  });
});

describe("webhook", () => {
  it("verifies Meta's signature on the raw body", () => {
    const body = '{"entry":[]}';
    const signature = `sha256=${createHmac("sha256", "s3cret").update(body).digest("hex")}`;

    assert.equal(verifySignature(body, signature, "s3cret"), true);
    assert.equal(verifySignature(`${body} `, signature, "s3cret"), false);
    assert.equal(verifySignature(body, signature, "other"), false);
    assert.equal(verifySignature(body, null, "s3cret"), false);
    assert.equal(verifySignature(body, signature, undefined), false);
  });

  it("reads text messages, names and owner echoes", () => {
    const events = parseWebhook({
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              field: "messages",
              value: {
                metadata: { phone_number_id: "123" },
                contacts: [{ wa_id: "8801711111111", profile: { name: "Rina" } }],
                messages: [
                  { id: "wamid.1", from: "8801711111111", type: "text", text: { body: "dam koto?" } },
                  { id: "wamid.2", from: "8801711111111", type: "image", image: {} },
                ],
              },
            },
            { field: "messages", value: { statuses: [{ id: "wamid.0", status: "read" }] } },
            {
              field: "smb_message_echoes",
              value: { message_echoes: [{ id: "wamid.9", from: "8801840830658", to: "8801722222222" }] },
            },
          ],
        },
      ],
    });

    assert.equal(events.messages.length, 2);
    assert.deepEqual(events.messages[0], {
      id: "wamid.1",
      from: "8801711111111",
      name: "Rina",
      text: "dam koto?",
      type: "text",
      phoneNumberId: "123",
    });
    assert.equal(events.messages[1].text, null);
    assert.deepEqual(events.echoes, [{ id: "wamid.9", to: "8801722222222" }]);
  });

  it("ignores a body it does not recognise", () => {
    assert.deepEqual(parseWebhook(null), { messages: [], echoes: [] });
    assert.deepEqual(parseWebhook({ entry: "nope" }), { messages: [], echoes: [] });
  });
});
