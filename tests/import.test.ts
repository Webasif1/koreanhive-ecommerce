import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseCsv, toObjects } from "@/lib/import/csv";
import { parseMoney } from "@/lib/import/columns";
import { buildPreview, readRows } from "@/lib/import/parse";
import type { ImportLookups, RowOutcome } from "@/lib/import/types";

/**
 * The importer's parse-and-validate half is pure, so a fixture string is the
 * whole harness — no database, no Next.js runtime.
 *
 *   npm test
 */

const LOOKUPS: ImportLookups = {
  brandIds: new Map([
    ["cosrx", "b1"],
    ["beauty of joseon", "b2"],
    ["beauty-of-joseon", "b2"],
  ]),
  categoryIds: new Map([
    ["moisturisers", "c1"],
    ["sunscreen", "c2"],
  ]),
  existing: new Map([
    [
      "cosrx-snail-cream",
      {
        slug: "cosrx-snail-cream",
        name: "Snail Cream",
        price: 1650,
        stock: 34,
        brandId: "b1",
        categoryId: "c1",
        imageUrls: [],
        concerns: [],
        text: {
          shortDescription: "A snail cream.",
          description: null,
          ingredients: null,
          howToUse: null,
        },
      },
    ],
  ]),
};

function preview(csv: string) {
  const { rows, error } = readRows(csv, "csv");
  assert.equal(error, null);
  return buildPreview(rows, LOOKUPS);
}

function rowAt(outcome: ReturnType<typeof preview>, index: number): RowOutcome {
  return outcome.rows[index];
}

describe("csv parsing", () => {
  it("keeps commas and newlines inside quoted fields", () => {
    const table = parseCsv('name,description\n"Toner, 200ml","Line one\nLine two"');
    assert.ok(table);
    assert.deepEqual(table.header, ["name", "description"]);
    assert.deepEqual(table.rows[0].values, ["Toner, 200ml", "Line one\nLine two"]);
  });

  it("unescapes doubled quotes", () => {
    const table = parseCsv('name\n"The ""Best"" Serum"');
    assert.equal(table?.rows[0].values[0], 'The "Best" Serum');
  });

  it("survives a UTF-8 BOM, which Excel always writes", () => {
    const table = parseCsv("﻿slug,price\ntoner,100");
    // without BOM handling the first header becomes "﻿slug" and the
    // column silently vanishes
    assert.deepEqual(table?.header, ["slug", "price"]);
  });

  it("handles CRLF line endings", () => {
    const table = parseCsv("slug,price\r\ntoner,100\r\ncream,200\r\n");
    assert.equal(table?.rows.length, 2);
    assert.deepEqual(table?.rows[1].values, ["cream", "200"]);
  });

  it("ignores trailing blank lines", () => {
    const table = parseCsv("slug,price\ntoner,100\n\n\n");
    assert.equal(table?.rows.length, 1);
  });

  it("returns null for an empty file", () => {
    assert.equal(parseCsv(""), null);
  });

  it("pairs short rows with the header without losing columns", () => {
    const table = parseCsv("slug,price,stock\ntoner,100");
    const objects = toObjects(table!);
    assert.equal(objects[0].values.stock, "");
  });
});

describe("money", () => {
  it("accepts what a currency-formatted column exports", () => {
    assert.equal(parseMoney("1,250"), 1250);
    assert.equal(parseMoney("৳1250"), 1250);
    assert.equal(parseMoney("1250.00"), 1250);
  });

  it("refuses fractions rather than rounding money silently", () => {
    assert.equal(parseMoney("1250.50"), null);
    assert.equal(parseMoney("abc"), null);
    assert.equal(parseMoney("-100"), null);
  });
});

describe("preview", () => {
  it("creates a new product and updates an existing one", () => {
    const result = preview(
      [
        "slug,name,price,brand,category",
        "cosrx-snail-cream,Snail Cream,1750,cosrx,moisturisers",
        "new-sunscreen,Relief Sun,1450,beauty of joseon,sunscreen",
      ].join("\n"),
    );

    assert.equal(result.counts.update, 1);
    assert.equal(result.counts.create, 1);
    assert.equal(result.counts.error, 0);

    const updated = rowAt(result, 0);
    assert.equal(updated.status, "update");
    assert.ok(updated.status === "update" && updated.changes.some((c) => c.includes("1650")));
  });

  it("reports an unchanged row as unchanged, not as an update", () => {
    const result = preview("slug,name,price\ncosrx-snail-cream,Snail Cream,1650");
    assert.equal(result.counts.unchanged, 1);
    assert.equal(result.counts.update, 0);
  });

  it("only touches the columns the file contains", () => {
    const result = preview("slug,price\ncosrx-snail-cream,1700");
    const row = rowAt(result, 0);

    assert.equal(row.status, "update");
    // a sheet of slug+price must not blank the description of every product
    assert.ok(row.status === "update" && row.fields.description === undefined);
    assert.ok(row.status === "update" && row.fields.shortDescription === undefined);
  });

  it("matches headers loosely", () => {
    const result = preview("Slug,Product Name,SELLING_PRICE\nnew-toner,Dokdo Toner,1650");
    assert.equal(rowAt(result, 0).status, "create");
  });

  it("ignores columns it does not recognise", () => {
    const result = preview("slug,name,price,supplier note,done?\nnew-toner,Toner,900,call Rahim,yes");
    assert.equal(rowAt(result, 0).status, "create");
  });

  it("derives a slug from the name when the column is missing", () => {
    const result = preview("name,price\nRelief Sun: Rice + Probiotics,1450");
    const row = rowAt(result, 0);
    assert.equal(row.status, "create");
    assert.equal(row.slug, "relief-sun-rice-probiotics");
  });

  it("rejects an unknown brand rather than inventing one", () => {
    const result = preview("slug,name,price,brand\nnew-toner,Toner,900,Cosrxx");
    const row = rowAt(result, 0);
    assert.equal(row.status, "error");
    assert.ok(row.status === "error" && row.errors[0].includes("unknown brand"));
  });

  it("rejects a duplicate slug inside one file", () => {
    const result = preview(
      ["slug,name,price", "new-toner,Toner,900", "new-toner,Toner Again,950"].join("\n"),
    );

    assert.equal(rowAt(result, 0).status, "create");
    const second = rowAt(result, 1);
    assert.equal(second.status, "error");
    assert.ok(second.status === "error" && second.errors[0].includes("duplicate slug"));
  });

  it("rejects an image host next/image cannot load", () => {
    const result = preview(
      "slug,name,price,images\nnew-toner,Toner,900,https://drive.google.com/file/abc.jpg",
    );

    const row = rowAt(result, 0);
    assert.equal(row.status, "error");
    assert.ok(row.status === "error" && row.errors[0].includes("image host not allowed"));
  });

  it("accepts pipe-separated ImageKit URLs", () => {
    const result = preview(
      "slug,name,price,images\nnew-toner,Toner,900,https://ik.imagekit.io/a.jpg | https://ik.imagekit.io/b.jpg",
    );

    const row = rowAt(result, 0);
    assert.equal(row.status, "create");
    assert.equal(row.status === "create" && row.fields.images?.length, 2);
    assert.equal(row.status === "create" && row.fields.images?.[1].position, 1);
  });

  it("does not call a row changed when its description is the same one", () => {
    // The same trap as the images case below, and the one that actually bit:
    // a sheet carries a description on every row, so flagging presence rather
    // than difference reported all 345 products as updates on every sync and
    // moved every sitemap lastModified date.
    const unchanged = preview(
      "slug,name,price,shortDescription\ncosrx-snail-cream,Snail Cream,1650,A snail cream.",
    );

    assert.equal(rowAt(unchanged, 0).status, "update");
    assert.deepEqual(
      (rowAt(unchanged, 0) as Extract<RowOutcome, { status: "update" }>).changes,
      [],
      "an identical description must not count as a change",
    );

    const edited = preview(
      "slug,name,price,shortDescription\ncosrx-snail-cream,Snail Cream,1650,A better snail cream.",
    );

    assert.deepEqual(
      (rowAt(edited, 0) as Extract<RowOutcome, { status: "update" }>).changes,
      ["shortDescription updated"],
    );
  });

  it("does not call a row changed when its images are the same ones", () => {
    // most sheets carry an images column on every row; flagging that as a
    // change would rewrite the catalogue and churn every sitemap date
    const lookups: ImportLookups = {
      ...LOOKUPS,
      existing: new Map([
        [
          "cosrx-snail-cream",
          { ...LOOKUPS.existing.get("cosrx-snail-cream")!, imageUrls: ["https://ik.imagekit.io/a.jpg"] },
        ],
      ]),
    };

    const same = buildPreview(
      readRows(
        "slug,name,price,images\ncosrx-snail-cream,Snail Cream,1650,https://ik.imagekit.io/a.jpg",
        "csv",
      ).rows,
      lookups,
    );
    assert.equal(same.counts.unchanged, 1);

    const different = buildPreview(
      readRows(
        "slug,name,price,images\ncosrx-snail-cream,Snail Cream,1650,https://ik.imagekit.io/b.jpg",
        "csv",
      ).rows,
      lookups,
    );
    assert.equal(different.counts.update, 1);
  });

  it("requires a price for a new product but not for an update", () => {
    const missing = preview("slug,name\nbrand-new-thing,Thing");
    assert.equal(rowAt(missing, 0).status, "error");

    const update = preview("slug,stock\ncosrx-snail-cream,10");
    assert.equal(rowAt(update, 0).status, "update");
  });

  it("flags a bad price without failing the whole file", () => {
    const result = preview(
      ["slug,name,price", "new-toner,Toner,abc", "other-toner,Other,900"].join("\n"),
    );

    assert.equal(result.counts.error, 1);
    assert.equal(result.counts.create, 1);
  });

  it("reads yes/no flags", () => {
    const result = preview("slug,name,price,isActive,featured\nnew-toner,Toner,900,yes,0");
    const row = rowAt(result, 0);
    assert.equal(row.status === "create" && row.fields.isActive, true);
    assert.equal(row.status === "create" && row.fields.isFeatured, false);
  });

  it("handles a header-only file", () => {
    const result = preview("slug,name,price");
    assert.equal(result.rows.length, 0);
  });
});

describe("json", () => {
  it("reads an array of products, including variants", () => {
    const { rows, error } = readRows(
      JSON.stringify([
        {
          slug: "new-essence",
          name: "New Essence",
          price: 1200,
          variants: [{ name: "50ml", stock: 10, isDefault: true }],
        },
      ]),
      "json",
    );

    assert.equal(error, null);

    const result = buildPreview(rows, LOOKUPS);
    const row = rowAt(result, 0);

    assert.equal(row.status, "create");
    assert.equal(row.status === "create" && row.fields.variants?.[0].name, "50ml");
  });

  it("reads a { products: [...] } wrapper", () => {
    const { rows, error } = readRows(
      JSON.stringify({ products: [{ slug: "a-thing", name: "Thing", price: 100 }] }),
      "json",
    );

    assert.equal(error, null);
    assert.equal(rows.length, 1);
  });

  it("reports invalid JSON as a message, not a crash", () => {
    const { error } = readRows("{not json", "json");
    assert.ok(error);
  });
});
