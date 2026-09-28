import { asciiDigits } from "@/lib/whatsapp/language";

/**
 * Decides whether Gemini's rewrite of a reply may be sent instead of the
 * template it was given.
 *
 * The template is always correct; the rewrite is only nicer. So the rewrite
 * has to prove it kept every fact and added none, or the template goes out:
 *
 *   - every number in it appears in the template or in what the customer
 *     wrote — a model cannot invent a price, a discount, a delivery time or
 *     "only 2 left". Bangla digits count, so ৳১,২৫০ is checked as 1250;
 *   - every link in the template survives, character for character;
 *   - it still asks a question, which the sales script requires of every
 *     reply;
 *   - it is not wildly longer, which is how a model adding things of its own
 *     usually shows.
 */

const URL = /https?:\/\/[^\s)*~_]+/g;

/** "1. " / "২) " at the start of a line is a list marker, not a fact. */
const LIST_MARKER = /^[ \t]*[0-9০-৯]{1,2}[.)][ \t]/gm;

export function numbersIn(text: string): number[] {
  const clean = asciiDigits(text.replace(URL, " ").replace(LIST_MARKER, ""))
    // thousands separators: 1,250 is one number, not two
    .replace(/(\d),(?=\d{3}(?!\d))/g, "$1");

  return (clean.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

export function urlsIn(text: string): string[] {
  return text.match(URL) ?? [];
}

export function acceptRewrite(
  rewrite: string | null,
  template: string,
  customerTexts: string[],
): boolean {
  const text = rewrite?.trim();
  if (!text) return false;

  if (text.length > Math.max(1200, template.length * 2)) return false;

  if (!/[?？]/.test(text)) return false;

  if (urlsIn(template).some((url) => !text.includes(url))) return false;

  const allowed = new Set([
    ...numbersIn(template),
    ...customerTexts.flatMap(numbersIn),
  ]);

  return numbersIn(text).every((value) => allowed.has(value));
}
