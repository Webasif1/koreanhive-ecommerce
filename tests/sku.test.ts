import assert from "node:assert/strict";
import { test } from "node:test";

import { deriveCode, dominantCode, nextSku, parseSku } from "../src/lib/sku";

test("reads the scheme the catalogue already uses", () => {
  assert.deepEqual(parseSku("KH-AMP-002"), {
    prefix: "KH",
    code: "AMP",
    number: 2,
    width: 3,
  });

  // Lower case and stray whitespace are the same SKU.
  assert.deepEqual(parseSku("  kh-amp-002 "), {
    prefix: "KH",
    code: "AMP",
    number: 2,
    width: 3,
  });
});

test("anything that is not a SKU is left alone rather than guessed at", () => {
  for (const value of ["", "KH-AMP", "AMP-002", "KH_AMP_002", "not a sku"]) {
    assert.equal(parseSku(value), null, `should not parse: "${value}"`);
  }
});

test("a one-word category takes its first three letters", () => {
  // Ampoule → AMP is the code already in the catalogue, so the rule extends
  // the existing scheme instead of starting a second one.
  const taken = new Set<string>();
  assert.equal(deriveCode("Ampoule", taken), "AMP");
  assert.equal(deriveCode("Serum", taken), "SER");
  assert.equal(deriveCode("Toner", taken), "TON");
});

test("a multi-word category uses initials, so near-twins stay distinct", () => {
  const taken = new Set<string>();
  const cleanser = deriveCode("Cleanser", taken);
  taken.add(cleanser);
  const oil = deriveCode("Cleansing Oil", taken);

  assert.equal(cleanser, "CLE");
  assert.equal(oil, "CLO");
  assert.notEqual(cleanser, oil);
});

test("every category in the catalogue gets its own code", () => {
  const categories = [
    "Ampoule", "Serum", "Cleanser", "Cleansing Oil", "Toner",
    "Moisturizer", "Essence", "Sunscreen", "Sleeping Mask",
    "Wash-off Mask", "Sheet Mask", "Cushion & Foundation", "Makeup",
  ];

  const taken = new Set<string>();
  for (const name of categories) {
    const code = deriveCode(name, taken);
    assert.ok(!taken.has(code), `duplicate code ${code} for "${name}"`);
    taken.add(code);
  }

  assert.equal(taken.size, categories.length);
});

test("the code a category already uses wins over a derived one", () => {
  assert.equal(dominantCode(["AMP", "AMP", "SER"]), "AMP");
  assert.equal(dominantCode([]), null);
});

test("a generated SKU never duplicates one already in the catalogue", () => {
  const used = new Set(["KH-AMP-003", "KH-AMP-004"]);

  // Highest parsed is 002, but 003 and 004 are taken — by a malformed record,
  // or one whose category was reassigned. The next free number is 005.
  const first = nextSku({ prefix: "KH", code: "AMP", width: 3, highest: 2, used });
  assert.equal(first.sku, "KH-AMP-005");

  used.add(first.sku);
  const second = nextSku({
    prefix: "KH", code: "AMP", width: 3, highest: first.number, used,
  });
  assert.equal(second.sku, "KH-AMP-006");
});

test("padding follows the catalogue rather than the number's own length", () => {
  const used = new Set<string>();
  assert.equal(
    nextSku({ prefix: "KH", code: "SER", width: 3, highest: 0, used }).sku,
    "KH-SER-001",
  );
  // Past 999 the number wins over the padding — better a four-digit SKU than
  // a silently truncated duplicate.
  assert.equal(
    nextSku({ prefix: "KH", code: "SER", width: 3, highest: 999, used }).sku,
    "KH-SER-1000",
  );
});

test("assigning across a whole catalogue produces no duplicates", () => {
  // A realistic run: some products already coded, a new category with none.
  const existing = ["KH-AMP-001", "KH-AMP-002", "KH-SER-001"];
  const used = new Set(existing);
  const highest = new Map([["AMP", 2], ["SER", 1]]);
  const taken = new Set(["AMP", "SER"]);

  const queue = [
    { category: "Ampoule", code: "AMP" },
    { category: "Serum", code: "SER" },
    { category: "Serum", code: "SER" },
    { category: "Sleeping Mask", code: null },
    { category: "Sleeping Mask", code: null },
  ];

  const issued: string[] = [];
  const codeFor = new Map<string, string>([["Ampoule", "AMP"], ["Serum", "SER"]]);

  for (const item of queue) {
    let code = codeFor.get(item.category);
    if (!code) {
      code = deriveCode(item.category, taken);
      taken.add(code);
      codeFor.set(item.category, code);
    }

    const { sku, number } = nextSku({
      prefix: "KH", code, width: 3, highest: highest.get(code) ?? 0, used,
    });
    highest.set(code, number);
    used.add(sku);
    issued.push(sku);
  }

  assert.deepEqual(issued, [
    "KH-AMP-003",
    "KH-SER-002",
    "KH-SER-003",
    "KH-SLM-001",
    "KH-SLM-002",
  ]);

  // Nothing issued collides with what was already there.
  assert.equal(new Set([...existing, ...issued]).size, existing.length + issued.length);
});
