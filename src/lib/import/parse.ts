import { isAllowedImageHost } from "@/lib/image-hosts";
import { slugify } from "@/lib/slugify";
import { parseCsv, toObjects } from "@/lib/import/csv";
import {
  canonicalise,
  parseBoolean,
  parseCount,
  parseMoney,
  parseRating,
  parseStockStatus,
  type CanonicalColumn,
} from "@/lib/import/columns";
import type {
  ImageInput,
  ImportFormat,
  ImportLookups,
  ImportPreview,
  ProductFields,
  RowOutcome,
  VariantInput,
} from "@/lib/import/types";

/**
 * Reading a file into decided outcomes.
 *
 * Pure: text plus lookups in, outcomes out. No database, no environment, no
 * clock — which is what lets the preview and the apply step run the exact same
 * code, so an operator can never approve one thing and commit another.
 */

const MAX_ROWS = 2000;
const MAX_IMAGES = 8;

export type ParsedRow = { line: number; values: Record<string, unknown> };

export function readRows(
  text: string,
  format: ImportFormat,
): { rows: ParsedRow[]; error: string | null } {
  if (format === "json") return readJson(text);

  const table = parseCsv(text);
  if (!table) return { rows: [], error: "That file has no rows in it." };

  if (table.header.length === 0) {
    return { rows: [], error: "That file has no header row." };
  }

  return { rows: toObjects(table), error: null };
}

function readJson(text: string): { rows: ParsedRow[]; error: string | null } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { rows: [], error: "That file is not valid JSON." };
  }

  // both a bare array and { products: [...] } are natural things to export
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { products?: unknown })?.products)
      ? (parsed as { products: unknown[] }).products
      : null;

  if (!list) {
    return { rows: [], error: "JSON must be an array of products, or { products: [...] }." };
  }

  return {
    rows: list.map((value, index) => ({
      // 1-based and offset past the opening bracket, so the number an operator
      // sees roughly matches what their editor shows
      line: index + 1,
      values: (value ?? {}) as Record<string, unknown>,
    })),
    error: null,
  };
}

/** `alt` is the sheet's own alt text when it has a column for it, falling back
 *  to the product name — never left empty, which is what a screen reader
 *  needs and what the storefront already assumes. */
function readImages(
  raw: string,
  name: string,
  alt?: string,
): { images: ImageInput[]; errors: string[] } {
  // CSV writes "a | b"; JSON may hand over a re-serialised array of strings or
  // of { url, alt } objects
  let urls: string[];

  if (raw.startsWith("[")) {
    try {
      urls = (JSON.parse(raw) as unknown[]).map((entry) =>
        typeof entry === "string" ? entry : String((entry as { url?: string })?.url ?? ""),
      );
    } catch {
      return { images: [], errors: ["images is not a valid list"] };
    }
  } else {
    urls = raw.split("|");
  }

  const cleaned = urls.map((url) => url.trim()).filter((url) => url.length > 0);
  const errors: string[] = [];
  const images: ImageInput[] = [];

  for (const url of cleaned.slice(0, MAX_IMAGES)) {
    if (!isAllowedImageHost(url)) {
      // caught here rather than on the storefront, where it shows as a blank
      // box on a product that is already live
      errors.push(`image host not allowed: ${url}`);
      continue;
    }

    images.push({ url, alt: alt || name || null, position: images.length });
  }

  return { images, errors };
}

function readVariants(raw: string): { variants: VariantInput[]; errors: string[] } {
  let list: unknown;

  try {
    list = JSON.parse(raw);
  } catch {
    return { variants: [], errors: ["variants must be a JSON array"] };
  }

  if (!Array.isArray(list)) return { variants: [], errors: ["variants must be a JSON array"] };

  const errors: string[] = [];
  const variants: VariantInput[] = [];

  list.forEach((entry, index) => {
    const value = (entry ?? {}) as Record<string, unknown>;
    const name = String(value.name ?? "").trim();

    if (name.length === 0) {
      errors.push(`variant ${index + 1} has no name`);
      return;
    }

    const price = value.price === null || value.price === undefined ? null : Number(value.price);

    if (price !== null && (!Number.isInteger(price) || price < 0)) {
      errors.push(`variant "${name}" has an invalid price`);
      return;
    }

    variants.push({
      name,
      sku: value.sku ? String(value.sku) : null,
      price,
      stock: Number.isInteger(Number(value.stock)) ? Number(value.stock) : 0,
      position: index,
      isDefault: value.isDefault === true || index === 0,
    });
  });

  return { variants, errors };
}

/** Reads one row into fields plus whatever went wrong. */
function readRow(
  row: ParsedRow,
  lookups: ImportLookups,
): { slug: string | null; name: string | null; fields: Partial<ProductFields>; errors: string[] } {
  const cells = canonicalise(row.values);
  const errors: string[] = [];
  const fields: Partial<ProductFields> = {};

  const has = (column: CanonicalColumn) => cells.has(column);
  const get = (column: CanonicalColumn) => cells.get(column) ?? "";

  const name = get("name");
  const slug = get("slug") ? slugify(get("slug")) : name ? slugify(name) : null;

  if (name && name.length < 2) errors.push("name must be at least 2 characters");
  if (name) fields.name = name;

  if (!slug) errors.push("needs a slug or a name");

  if (has("price")) {
    const price = parseMoney(get("price"));
    if (price === null) errors.push(`price is not a whole number of taka: "${get("price")}"`);
    else fields.price = price;
  }

  if (has("comparePrice")) {
    const compare = parseMoney(get("comparePrice"));
    if (compare === null) errors.push(`comparePrice is not a whole number: "${get("comparePrice")}"`);
    else fields.comparePrice = compare;
  }

  if (has("stock")) {
    const stock = parseCount(get("stock"));
    if (stock === null) errors.push(`stock is not a whole number: "${get("stock")}"`);
    else fields.stock = stock;
  } else if (has("stockStatus")) {
    // A sheet that tracks availability as words rather than a count. Only used
    // when there is no real number to prefer — an explicit stock column always
    // wins, because it carries information this one cannot.
    const status = parseStockStatus(get("stockStatus"));
    if (status === null) {
      errors.push(`stock status is not in/out of stock: "${get("stockStatus")}"`);
    } else {
      fields.stock = status;
    }
  }

  for (const [column, parse] of [
    ["ratingAvg", parseRating],
    ["ratingCount", parseCount],
  ] as const) {
    if (!has(column)) continue;
    const parsed = parse(get(column));
    if (parsed === null) errors.push(`${column} is not a number: "${get(column)}"`);
    else fields[column] = parsed;
  }

  if (has("sku")) fields.sku = get("sku");
  if (has("shortDescription")) fields.shortDescription = get("shortDescription");
  if (has("description")) fields.description = get("description");
  if (has("ingredients")) fields.ingredients = get("ingredients");
  if (has("howToUse")) fields.howToUse = get("howToUse");
  if (has("metaTitle")) fields.metaTitle = get("metaTitle");
  if (has("metaDescription")) fields.metaDescription = get("metaDescription");

  for (const column of ["isActive", "isFeatured"] as const) {
    if (!has(column)) continue;
    const flag = parseBoolean(get(column));
    if (flag === null) errors.push(`${column} is not a yes/no value: "${get(column)}"`);
    else fields[column] = flag;
  }

  if (has("brand")) {
    const id = lookups.brandIds.get(get("brand").toLowerCase());
    // an unknown brand is an error, not an auto-create: otherwise "Cosrx",
    // "COSRX" and "Cosrx " quietly become three brands in the storefront nav
    if (!id) errors.push(`unknown brand: "${get("brand")}"`);
    else fields.brandId = id;
  }

  if (has("category")) {
    const id = lookups.categoryIds.get(get("category").toLowerCase());
    if (!id) errors.push(`unknown category: "${get("category")}"`);
    else fields.categoryId = id;
  }

  if (has("images")) {
    const result = readImages(get("images"), name || slug || "", get("imageAlt"));
    errors.push(...result.errors);
    if (result.images.length > 0) fields.images = result.images;
  }

  if (has("variants")) {
    const result = readVariants(get("variants"));
    errors.push(...result.errors);
    if (result.variants.length > 0) fields.variants = result.variants;
  } else if (has("size")) {
    // A size column is a one-variant product described the short way: the
    // buy box needs something concrete to put in the cart, and "50ml" is a
    // better label than the product name repeated.
    fields.variants = [
      {
        name: get("size"),
        // the product's own SKU identifies it; a lone variant needs no second one
        sku: null,
        price: null,
        stock: fields.stock ?? 0,
        isDefault: true,
        position: 0,
      },
    ];
  }

  return { slug, name: name || null, fields, errors };
}

function describeChanges(
  fields: Partial<ProductFields>,
  existing: NonNullable<ReturnType<ImportLookups["existing"]["get"]>>,
): string[] {
  const changes: string[] = [];

  if (fields.name !== undefined && fields.name !== existing.name) {
    changes.push(`name "${existing.name}" → "${fields.name}"`);
  }
  if (fields.price !== undefined && fields.price !== existing.price) {
    changes.push(`price ${existing.price} → ${fields.price}`);
  }
  if (fields.stock !== undefined && fields.stock !== existing.stock) {
    changes.push(`stock ${existing.stock} → ${fields.stock}`);
  }
  if (fields.brandId !== undefined && fields.brandId !== existing.brandId) {
    changes.push("brand changes");
  }
  if (fields.categoryId !== undefined && fields.categoryId !== existing.categoryId) {
    changes.push("category changes");
  }
  if (fields.images !== undefined) {
    // compared by URL rather than flagged on presence: most sheets carry an
    // images column on every row, and treating that as a change would rewrite
    // the whole catalogue — and with it every sitemap lastModified date
    const incoming = fields.images.map((image) => image.url);
    const current = existing.imageUrls;

    const differs =
      incoming.length !== current.length ||
      incoming.some((url, index) => url !== current[index]);

    if (differs) changes.push("images replaced");
  }

  // Compared by value, then reported by name: an operator wants to know a row
  // will be written, not to read a wall of prose diffs.
  //
  // This used to flag any row whose file *carried* these columns, changed or
  // not. A sheet with a description on every row therefore reported every row
  // as an update, so each sync rewrote the entire catalogue and moved every
  // sitemap lastModified date — the same trap the image comparison above
  // already avoids.
  const textual = (
    ["shortDescription", "description", "ingredients", "howToUse"] as const
  ).filter(
    (key) => fields[key] !== undefined && fields[key] !== existing.text[key],
  );

  if (textual.length > 0) changes.push(`${textual.join(", ")} updated`);

  return changes;
}

export function buildPreview(rows: ParsedRow[], lookups: ImportLookups): ImportPreview {
  const outcomes: RowOutcome[] = [];
  const seen = new Map<string, number>();

  for (const row of rows.slice(0, MAX_ROWS)) {
    const { slug, name, fields, errors } = readRow(row, lookups);

    if (slug) {
      const first = seen.get(slug);
      // two rows claiming one slug is a mistake to surface, not a last-write
      // race to resolve silently
      if (first !== undefined) {
        errors.push(`duplicate slug "${slug}", already used on row ${first}`);
      } else {
        seen.set(slug, row.line);
      }
    }

    const existing = slug ? lookups.existing.get(slug) : undefined;

    // a new product needs enough to be a product at all; an update inherits
    // everything the row does not mention
    if (!existing && errors.length === 0) {
      if (fields.name === undefined) errors.push("new products need a name");
      if (fields.price === undefined) errors.push("new products need a price");
    }

    if (errors.length > 0 || !slug) {
      outcomes.push({ status: "error", line: row.line, slug, name, errors });
      continue;
    }

    if (existing) {
      outcomes.push({
        status: "update",
        line: row.line,
        slug,
        name: fields.name ?? existing.name,
        fields,
        changes: describeChanges(fields, existing),
      });
    } else {
      outcomes.push({
        status: "create",
        line: row.line,
        slug,
        name: fields.name ?? slug,
        fields,
      });
    }
  }

  if (rows.length > MAX_ROWS) {
    outcomes.push({
      status: "error",
      line: MAX_ROWS + 1,
      slug: null,
      name: null,
      errors: [`file has ${rows.length} rows; only the first ${MAX_ROWS} were read`],
    });
  }

  return {
    rows: outcomes,
    counts: {
      create: outcomes.filter((row) => row.status === "create").length,
      update: outcomes.filter((row) => row.status === "update" && row.changes.length > 0).length,
      unchanged: outcomes.filter((row) => row.status === "update" && row.changes.length === 0)
        .length,
      error: outcomes.filter((row) => row.status === "error").length,
    },
  };
}
