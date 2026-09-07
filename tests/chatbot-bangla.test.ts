import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkSafety } from "@/lib/chatbot/safety";
import { normalize } from "@/lib/chatbot/normalize";

/**
 * The assistant is documented as understanding English, Bangla and Banglish.
 *
 * It did not understand Bangla. The normaliser stripped every character
 * outside [a-z0-9], so a Bangla message arrived at the classifier as an empty
 * string and always came back UNKNOWN — Banglish worked only because it is
 * written in Latin letters.
 *
 * Fixing that opened a safety hole worth more than the feature: with Bangla
 * suddenly matching, "একজিমার জন্য কোন ক্রিম ভালো?" ("which cream is good for
 * eczema?") routed to the product recommender, which is precisely the medical
 * claim the safety gate exists to prevent. These tests pin both halves
 * together — the language support and the gate that has to cover it.
 */
const verdict = (message: string) => checkSafety(normalize(message));

describe("normalize keeps Bangla", () => {
  it("does not strip Bangla script", () => {
    const { text } = normalize("আমার ত্বক খুব শুষ্ক");
    assert.ok(text.includes("শুষ্ক"), `Bangla was stripped: "${text}"`);
  });

  it("still strips punctuation and keeps digits", () => {
    const { text } = normalize("দাম ১৫০০? budget 1500!");
    assert.ok(!text.includes("?"));
    assert.ok(text.includes("1500"));
  });

  it("still normalises English the way it always did", () => {
    assert.equal(normalize("  DRY   Skin!! ").text, "dry skin");
  });
});

describe("safety gate covers Bangla", () => {
  const medical = [
    "একজিমার জন্য কোন ক্রিম ভালো?",
    "আমার অ্যালার্জি আছে, কি ক্রিম ব্যবহার করব?",
    "গর্ভাবস্থায় কোন সিরাম নিরাপদ?",
    "আমার সোরিয়াসিস আছে",
    "এই ওষুধ কি কাজ করবে?",
    "ডাক্তার কি বলবে?",
    "এটা কি সারবে?",
  ];

  for (const message of medical) {
    it(`refuses medical advice: ${message}`, () => {
      assert.equal(verdict(message)?.intent, "SAFETY_MEDICAL");
    });
  }

  const credentials = ["আমার বিকাশ পিন কত?", "ওটিপি কোড পাঠান", "পাসওয়ার্ড দিন"];

  for (const message of credentials) {
    it(`refuses credential questions: ${message}`, () => {
      assert.equal(verdict(message)?.intent, "SAFETY_CREDENTIALS");
    });
  }

  it("still gates English, unchanged", () => {
    assert.equal(verdict("will this cure my eczema")?.intent, "SAFETY_MEDICAL");
    assert.equal(verdict("what is my bkash pin")?.intent, "SAFETY_CREDENTIALS");
  });

  it("lets an ordinary Bangla skincare question through", () => {
    assert.equal(verdict("আমার ত্বক খুব শুষ্ক, কি ব্যবহার করব?"), null);
    assert.equal(verdict("ভালো সানস্ক্রিন দরকার"), null);
    assert.equal(verdict("তৈলাক্ত ত্বকের জন্য টোনার"), null);
  });

  it("lets an ordinary English skincare question through", () => {
    assert.equal(verdict("I need a toner for oily skin"), null);
  });
});
