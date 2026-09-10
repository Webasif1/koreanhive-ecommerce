import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FAQS } from "@/data/faqs";

/** Any Bengali codepoint. */
const BENGALI = /[ঀ-৿]/;

/**
 * The FAQ list feeds two things at once — the accordion and the FAQPage
 * structured data — so a mistake here is either a font bug nobody notices on
 * a Latin-script machine, or invalid markup Google acts on. Both are quiet.
 */
describe("home page FAQs", () => {
  it("has questions to show", () => {
    assert.ok(FAQS.length >= 6);
  });

  it("marks every Bangla entry with lang so Hind Siliguri applies", () => {
    // Poppins ships no Bengali subset. Without lang="bn" the :lang(bn) rule in
    // globals.css never matches and the glyphs fall through to whatever the
    // device happens to have — which on a cheap Android is often nothing.
    for (const faq of FAQS) {
      if (BENGALI.test(faq.question) || BENGALI.test(faq.answer)) {
        assert.equal(faq.lang, "bn", `not marked as Bangla: ${faq.question}`);
      }
    }
  });

  it("does not mark Latin-only entries as Bangla", () => {
    for (const faq of FAQS) {
      if (faq.lang !== "bn") continue;
      assert.ok(
        BENGALI.test(faq.question) || BENGALI.test(faq.answer),
        `marked bn but has no Bangla: ${faq.question}`,
      );
    }
  });

  it("asks each question once", () => {
    // Two identical questions render as two accordion rows with the same React
    // key and emit a duplicate Question in the FAQPage markup.
    const seen = new Set<string>();
    for (const faq of FAQS) {
      assert.ok(!seen.has(faq.question), `asked twice: ${faq.question}`);
      seen.add(faq.question);
    }
  });

  it("answers every question", () => {
    for (const faq of FAQS) {
      assert.ok(faq.question.trim().length > 0);
      // An empty acceptedAnswer is invalid FAQPage markup, not just an empty
      // row — Google rejects the whole block for it.
      assert.ok(faq.answer.trim().length > 10, `thin answer: ${faq.question}`);
    }
  });

  it("keeps the operational answers a cash-on-delivery buyer needs", () => {
    const text = FAQS.map((faq) => `${faq.question} ${faq.answer}`).join(" ");

    for (const term of ["Cash on delivery", "working days", "batch code"]) {
      assert.ok(text.includes(term), `missing: ${term}`);
    }
  });
});
