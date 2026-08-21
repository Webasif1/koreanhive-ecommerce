/**
 * The column contract.
 *
 * Headers are matched loosely on purpose. A spreadsheet maintained by hand
 * will spell it "Short Description" one week and "short_description" the next,
 * and failing an import over a capital letter helps nobody. Everything is
 * folded to lowercase alphanumerics before lookup, so `Compare Price`,
 * `compare_price` and `COMPAREPRICE` are the same column.
 */

export const CANONICAL_COLUMNS = [
  "slug",
  "name",
  "price",
  "comparePrice",
  "stock",
  "sku",
  "brand",
  "category",
  "shortDescription",
  "description",
  "ingredients",
  "howToUse",
  "images",
  "isActive",
  "isFeatured",
  "metaTitle",
  "metaDescription",
  "variants",
] as const;

export type CanonicalColumn = (typeof CANONICAL_COLUMNS)[number];

/** Extra spellings beyond the canonical name folded to lowercase letters. */
const ALIASES: Record<string, CanonicalColumn> = {
  handle: "slug",
  url: "slug",
  title: "name",
  productname: "name",
  sellingprice: "price",
  mrp: "comparePrice",
  oldprice: "comparePrice",
  regularprice: "comparePrice",
  quantity: "stock",
  qty: "stock",
  inventory: "stock",
  barcode: "sku",
  brandname: "brand",
  categoryname: "category",
  shortdesc: "shortDescription",
  benefit: "shortDescription",
  longdescription: "description",
  details: "description",
  usage: "howToUse",
  directions: "howToUse",
  image: "images",
  imageurl: "images",
  imageurls: "images",
  photo: "images",
  active: "isActive",
  published: "isActive",
  featured: "isFeatured",
  seotitle: "metaTitle",
  seodescription: "metaDescription",
};

function fold(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const CANONICAL_BY_FOLDED = new Map<string, CanonicalColumn>([
  ...CANONICAL_COLUMNS.map((column) => [fold(column), column] as const),
  ...Object.entries(ALIASES).map(([alias, column]) => [fold(alias), column] as const),
]);

export function canonicalColumn(header: string): CanonicalColumn | null {
  return CANONICAL_BY_FOLDED.get(fold(header)) ?? null;
}

/**
 * Rewrites a raw row under canonical keys, dropping columns we do not know.
 *
 * Unknown columns are ignored rather than rejected — a working sheet collects
 * notes, supplier codes and a "done?" tick, and none of that should block an
 * import.
 */
export function canonicalise(values: Record<string, unknown>): Map<CanonicalColumn, string> {
  const out = new Map<CanonicalColumn, string>();

  for (const [key, value] of Object.entries(values)) {
    const column = canonicalColumn(key);
    if (!column) continue;
    if (value === null || value === undefined) continue;

    const text =
      typeof value === "string"
        ? value.trim()
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : // arrays and objects (JSON images/variants) are re-serialised so the
            // one parser downstream handles both file formats identically
            JSON.stringify(value);

    // an empty cell means "no opinion", not "set this to blank" — otherwise a
    // sparse sheet would wipe descriptions across the catalogue
    if (text.length > 0) out.set(column, text);
  }

  return out;
}

const TRUE_VALUES = new Set(["true", "yes", "y", "1", "on", "active", "published"]);
const FALSE_VALUES = new Set(["false", "no", "n", "0", "off", "inactive", "draft"]);

export function parseBoolean(value: string): boolean | null {
  const folded = value.trim().toLowerCase();
  if (TRUE_VALUES.has(folded)) return true;
  if (FALSE_VALUES.has(folded)) return false;
  return null;
}

/**
 * Whole taka, as stored. Tolerates "1,250" and "৳1250" and "1250.00", because
 * that is what a spreadsheet column formatted as currency exports — but
 * refuses real fractions rather than rounding money behind the operator's back.
 */
export function parseMoney(value: string): number | null {
  const cleaned = value.replace(/[,\s৳]/g, "").replace(/^bdt/i, "");
  if (cleaned.length === 0) return null;

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  if (!Number.isInteger(parsed)) return null;

  return parsed;
}

export function parseCount(value: string): number | null {
  const parsed = Number(value.replace(/[,\s]/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) return null;
  return parsed;
}
