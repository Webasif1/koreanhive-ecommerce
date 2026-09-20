/**
 * The catalogue's SKU scheme.
 *
 * SKUs look like `KH-AMP-002`: a house prefix, a category code, and a number
 * that runs per code. Nothing here reads the database — the numbers and codes
 * already in use are passed in, so the rules can be tested without one, and
 * `scripts/backfill-sku.ts` is the only thing that talks to Mongo.
 */

const SKU_PATTERN = /^([A-Z0-9]+)-([A-Z0-9]+)-(\d+)$/;

export type ParsedSku = {
  prefix: string;
  code: string;
  number: number;
  /** Digits as written, so `002` keeps its padding when the sequence grows. */
  width: number;
};

export function parseSku(sku: string): ParsedSku | null {
  const match = SKU_PATTERN.exec(sku.trim().toUpperCase());
  if (!match) return null;

  return {
    prefix: match[1],
    code: match[2],
    number: Number(match[3]),
    width: match[3].length,
  };
}

/**
 * A code for a category that has none yet.
 *
 * A single word gives its first three letters — Ampoule becomes AMP, which is
 * the code the catalogue already uses, so the rule agrees with the scheme it
 * extends rather than inventing a second one. A multi-word name uses initials,
 * because first-three-letters collides on the words categories share:
 * "Cleanser" and "Cleansing Oil" both start CLE, but the second reads as CLO.
 */
export function deriveCode(name: string, taken: ReadonlySet<string>): string {
  const words = name.toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  const letters = words.join("");

  const base =
    words.length >= 3
      ? words.slice(0, 3).map((word) => word[0]).join("")
      : words.length === 2
        ? words[0].slice(0, 2) + words[1][0]
        : letters.slice(0, 3) || "GEN";

  if (!taken.has(base)) return base.padEnd(2, "X");

  // Two categories sharing a code would silently interleave their sequences,
  // so a collision walks the rest of the name for a distinguishing letter and
  // only then falls back to numbering.
  for (const letter of letters.slice(3)) {
    const candidate = base.slice(0, 2) + letter;
    if (!taken.has(candidate)) return candidate;
  }

  for (let n = 2; n < 100; n += 1) {
    const candidate = `${base.slice(0, 2)}${n}`;
    if (!taken.has(candidate)) return candidate;
  }

  throw new Error(`Could not find a free SKU code for category "${name}".`);
}

/** The code a set of SKUs agrees on — the most common one wins. */
export function dominantCode(codes: readonly string[]): string | null {
  if (codes.length === 0) return null;

  const counts = new Map<string, number>();
  for (const code of codes) counts.set(code, (counts.get(code) ?? 0) + 1);

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * The next free SKU for a code.
 *
 * Skips over anything already taken — including a number an unparseable SKU
 * happens to occupy — so a generated SKU can never duplicate one in the
 * catalogue.
 */
export function nextSku({
  prefix,
  code,
  width,
  highest,
  used,
}: {
  prefix: string;
  code: string;
  width: number;
  highest: number;
  used: ReadonlySet<string>;
}): { sku: string; number: number } {
  let number = highest + 1;
  let sku = `${prefix}-${code}-${String(number).padStart(width, "0")}`;

  while (used.has(sku)) {
    number += 1;
    sku = `${prefix}-${code}-${String(number).padStart(width, "0")}`;
  }

  return { sku, number };
}
