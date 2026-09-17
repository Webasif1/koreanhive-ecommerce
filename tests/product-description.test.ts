import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseDescription,
  parseInline,
  takeSection,
  type DescriptionBlock,
} from "@/lib/product-description";

// A live description from the catalogue, trimmed to the parts that matter.
const ANUA = [
  "**Anua Heartleaf 80% Soothing Ampoule 30ml** is a Korean ampoule from Anua. It is formulated for sensitive skin.",
  "",
  "**Key ingredients and what they do**",
  "- **Heartleaf (Houttuynia Cordata)** - calms breakouts and soothes reactive skin.",
  "",
  "**Key benefits**",
  "- Works on sensitive and easily irritated skin",
  "- Lightweight, non-sticky finish that suits Bangladesh's humid weather",
  "",
  "**How to use**",
  "Apply 2-3 drops to clean skin after toner, morning and night.",
  "",
  "**Who it's for**",
  "Best suited to anyone dealing with sensitive and easily irritated skin.",
  "",
  "**Why buy from Korean Hive**",
  "Korean Hive sources Anua products directly.",
  "",
  "**Frequently asked questions**",
  "*Is it suitable for sensitive skin?*",
  "Yes. Patch test on your inner arm for 24 hours first.",
  "",
  "*How long does 30ml last?*",
  "Roughly 6-10 weeks.",
].join("\n");

function allText(blocks: DescriptionBlock[]): string {
  return blocks
    .map((block) => {
      if (block.kind === "paragraph") return block.text.map((r) => r.text).join("");
      if (block.kind === "list") return block.items.flat().map((r) => r.text).join("");
      return block.question + block.answer.map((r) => r.text).join("");
    })
    .join("\n");
}

describe("parseDescription", () => {
  const parsed = parseDescription(ANUA);

  it("keeps the opener as the intro, with its bold product name", () => {
    assert.equal(parsed.intro.length, 1);
    const [intro] = parsed.intro;
    assert.equal(intro.kind, "paragraph");
    assert.deepEqual(intro.kind === "paragraph" && intro.text[0], {
      text: "Anua Heartleaf 80% Soothing Ampoule 30ml",
      bold: true,
    });
  });

  it("splits at every heading, in document order", () => {
    assert.deepEqual(
      parsed.sections.map((s) => s.title),
      [
        "Key ingredients and what they do",
        "Key benefits",
        "How to use",
        "Who it's for",
        "Why buy from Korean Hive",
        "Frequently asked questions",
      ],
    );
  });

  it("turns dash lines into a list", () => {
    const benefits = parsed.sections[1].blocks;
    assert.equal(benefits.length, 1);
    assert.equal(benefits[0].kind, "list");
    assert.equal(benefits[0].kind === "list" && benefits[0].items.length, 2);
  });

  it("pairs FAQ questions with their answers", () => {
    const faq = parsed.sections[5].blocks;
    assert.deepEqual(
      faq.map((b) => (b.kind === "qa" ? b.question : b.kind)),
      ["Is it suitable for sensitive skin?", "How long does 30ml last?"],
    );
    assert.equal(
      faq[1].kind === "qa" && faq[1].answer.map((r) => r.text).join(""),
      "Roughly 6-10 weeks.",
    );
  });

  it("leaves no markdown asterisks in any rendered text", () => {
    const text = [
      allText(parsed.intro),
      ...parsed.sections.map((s) => s.title + allText(s.blocks)),
    ].join("\n");

    assert.equal(text.includes("*"), false);
  });

  it("treats a description with no headings as all intro", () => {
    const plain = parseDescription("A gentle cleanser.\n\nUse it twice a day.");
    assert.equal(plain.sections.length, 0);
    assert.equal(plain.intro.length, 2);
  });

  it("copes with a missing or empty description", () => {
    assert.deepEqual(parseDescription(null), { intro: [], sections: [] });
    assert.deepEqual(parseDescription(""), { intro: [], sections: [] });
  });

  it("drops a heading that has nothing under it", () => {
    const parsed = parseDescription("Intro.\n\n**Empty**\n\n**Full**\nText.");
    assert.deepEqual(parsed.sections.map((s) => s.title), ["Full"]);
  });
});

describe("takeSection", () => {
  it("removes the matching section and leaves the rest in order", () => {
    const { sections } = parseDescription(ANUA);
    const ingredients = takeSection(sections, /^key ingredients/i);

    assert.equal(ingredients?.title, "Key ingredients and what they do");
    assert.equal(sections.length, 5);
    assert.equal(sections[0].title, "Key benefits");
  });

  it("returns null when nothing matches — the ingredients fallback case", () => {
    const { sections } = parseDescription(
      "Intro.\n\n**Key benefits**\n- Soft skin",
    );
    assert.equal(takeSection(sections, /^key ingredients/i), null);
    assert.equal(sections.length, 1);
  });
});

describe("parseInline", () => {
  it("leaves a lone asterisk alone", () => {
    assert.deepEqual(parseInline("SPF 50* rated"), [
      { text: "SPF 50* rated", bold: false },
    ]);
  });
});
