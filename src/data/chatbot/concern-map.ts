import { CONCERNS, type Concern } from "@/data/chatbot/taxonomy";

/**
 * The catalogue sheet's "Skin Concerns Targeted" column, mapped onto the
 * advisor's taxonomy.
 *
 * The sheet writes concerns as shopper-facing sentences and uses a tight
 * vocabulary — eight phrases across all 345 rows, no blanks. That makes it a
 * better source of truth than the hand-written knowledge file it replaces,
 * which covered 51 demo products and could never have been kept current for
 * 345.
 *
 * Keys are matched loosely (lowercased, punctuation stripped) so an edit in
 * the sheet that adds a comma or changes case does not silently drop a
 * product's concerns.
 *
 * A phrase not listed here is ignored rather than guessed at. If the sheet
 * grows a ninth concern, products get the concerns it *does* match and the new
 * one is simply absent until it is added below — the failure mode is a
 * narrower match, never a wrong one.
 */
const SHEET_CONCERNS: { match: string; concerns: Concern[] }[] = [
  {
    match: "dry and dehydrated skin",
    concerns: ["dryness", "dehydration"],
  },
  {
    match: "sensitive and easily irritated skin",
    concerns: ["sensitivity", "redness"],
  },
  {
    match: "dull skin and uneven tone",
    concerns: ["dullness", "uneven-texture"],
  },
  {
    // the sheet's phrasing for barrier damage; "sensitivity" because that is
    // what a shopper with a damaged barrier actually describes
    match: "a weakened moisture barrier",
    concerns: ["sensitivity", "dryness"],
  },
  {
    match: "early signs of ageing (fine lines and firmness)",
    concerns: ["fine-lines"],
  },
  {
    match: "sun damage and pigmentation",
    concerns: ["dark-spots", "sun-protection"],
  },
  {
    match: "enlarged pores and excess oil",
    concerns: ["oiliness", "large-pores"],
  },
  {
    match: "acne-prone and breakout-prone skin",
    concerns: ["acne", "post-acne-marks"],
  },
];

/** Lowercase, collapse whitespace, drop punctuation — so "Dry and Dehydrated
 *  Skin," and "dry and dehydrated skin" are the same key. */
function fold(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9() ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const BY_FOLDED = new Map(
  SHEET_CONCERNS.map((entry) => [fold(entry.match), entry.concerns]),
);

/**
 * Splits a sheet cell into taxonomy concerns.
 *
 * The cell holds several phrases separated by commas — but the phrases
 * themselves contain commas ("early signs of ageing (fine lines and
 * firmness)"), so this matches known phrases within the cell rather than
 * splitting on the delimiter and hoping.
 */
export function concernsFromSheet(cell: string): Concern[] {
  const folded = fold(cell);
  const found = new Set<Concern>();

  for (const [phrase, concerns] of BY_FOLDED) {
    if (folded.includes(phrase)) {
      for (const concern of concerns) found.add(concern);
    }
  }

  return [...found];
}

/** Narrows an untrusted string list to real concerns. Used when reading rows
 *  back out of the database, which the advisor treats as untrusted input like
 *  any other. */
export function toConcerns(values: unknown): Concern[] {
  if (!Array.isArray(values)) return [];

  return values.filter(
    (value): value is Concern =>
      typeof value === "string" && (CONCERNS as readonly string[]).includes(value),
  );
}
