/**
 * Text normalisation.
 *
 * Everything downstream matches against the output of this file, so the
 * matcher only ever has to think about one shape of text: lowercase, no
 * punctuation, single-spaced.
 *
 * Pure and allocation-light. No regex is ever built from user input, so there
 * is no ReDoS surface here.
 */

export type NormalizedMessage = {
  /** Lowercased, punctuation stripped, whitespace collapsed. */
  text: string;
  /** `text` split on spaces, stop words removed. */
  tokens: string[];
};

/**
 * Removed before matching. Kept short on purpose: "no", "not" and "without"
 * are *not* stop words, because they flip meaning ("no fragrance").
 */
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "was",
  "am",
  "be",
  "to",
  "of",
  "in",
  "on",
  "at",
  "it",
  "this",
  "that",
  "and",
  "or",
  "please",
  "pls",
  "hey",
  "just",
  "some",
  "any",
  "my",
  "me",
  "i",
  "you",
  "your",
]);

/** Collapses the spellings shoppers actually type into one form. */
const SPELLING_FIXES: Record<string, string> = {
  moisturizer: "moisturiser",
  moisturizers: "moisturiser",
  moisturisers: "moisturiser",
  mositurizer: "moisturiser",
  moisturiser: "moisturiser",
  moisturize: "moisturise",
  sunblock: "sunscreen",
  suncream: "sunscreen",
  sunscreens: "sunscreen",
  serums: "serum",
  toners: "toner",
  cleansers: "cleanser",
  facewash: "face wash",
  tk: "taka",
  bdt: "taka",
  taka: "taka",
};

export function normalize(input: string): NormalizedMessage {
  const text = input
    .toLowerCase()
    // keep digits: budgets are numbers. Keep nothing else non-alphanumeric.
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = text
    .split(" ")
    .map((token) => SPELLING_FIXES[token] ?? token)
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token));

  // spelling fixes can introduce a space ("facewash" -> "face wash"), so the
  // phrase-matching text is rebuilt from the corrected tokens
  return { text: tokens.join(" "), tokens };
}

/**
 * Levenshtein distance, capped.
 *
 * Bails as soon as the best possible result exceeds `max`, so a long word
 * against a short one costs almost nothing. Only used on tokens over five
 * characters, where a typo is likely and a false match is unlikely.
 */
export function editDistanceWithin(a: string, b: string, max: number): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > max) return false;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let rowMin = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      row.push(value);
      if (value < rowMin) rowMin = value;
    }

    if (rowMin > max) return false;
    prev = row;
  }

  return prev[b.length] <= max;
}

/**
 * Phrase tables elsewhere are written in plain English ("in stock", "my skin
 * is dry") but matched against normalised text, where stop words are gone.
 * Passing each phrase through the same pipeline is what keeps the two in
 * step — otherwise "in stock" would reduce to "stock" in the message and
 * never match the literal it was written as.
 *
 * Cached because the tables are static and re-normalising them on every
 * keystroke-length message would be pure waste.
 */
const phraseCache = new Map<string, string>();

export function normalizePhrase(phrase: string): string {
  const cached = phraseCache.get(phrase);
  if (cached !== undefined) return cached;

  const normalized = normalize(phrase).text;
  phraseCache.set(phrase, normalized);
  return normalized;
}

/**
 * True when `phrase` appears in the message.
 *
 * Multi-word phrases must appear as a contiguous run — matching them token by
 * token would let "dry" and "skin" in unrelated clauses satisfy "dry skin".
 * Single words fall back to a one-character typo tolerance once they are long
 * enough for that to be safe.
 */
export function containsPhrase(message: NormalizedMessage, phrase: string): boolean {
  const needle = normalizePhrase(phrase);

  // a phrase made entirely of stop words carries no signal, and an empty
  // needle would match every message
  if (needle.length === 0) return false;

  if (needle.includes(" ")) {
    return message.text.includes(needle);
  }

  if (message.tokens.includes(needle)) return true;

  if (needle.length <= 5) return false;

  return message.tokens.some(
    (token) => token.length > 5 && editDistanceWithin(token, needle, 1),
  );
}

/** How many of `phrases` appear, weighting multi-word hits above single words. */
export function phraseScore(message: NormalizedMessage, phrases: string[]): number {
  let score = 0;

  for (const phrase of phrases) {
    if (!containsPhrase(message, phrase)) continue;
    // a two-word hit is far stronger evidence than a stray single token
    score += normalizePhrase(phrase).includes(" ") ? 2 : 1;
  }

  return score;
}
