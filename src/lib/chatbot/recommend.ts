import {
  CATEGORY_LABELS,
  CONCERN_LABELS,
  SKIN_TYPE_LABELS,
  USE_CASE_LABELS,
  isCategorySlug,
} from "@/data/chatbot/taxonomy";
import type { NormalizedMessage } from "@/lib/chatbot/normalize";
import type { ChatCatalogItem, ChatProductCard, Slots } from "@/lib/chatbot/types";

/**
 * Ranking.
 *
 * The weights below are the whole "intelligence" of the advisor, and they are
 * deliberately legible: you can read why a product was chosen, change a number,
 * and predict what happens. That is the trade this design makes against a
 * language model — less flexibility in exchange for a recommendation that can
 * be explained, tested and corrected.
 */
const WEIGHTS = {
  concern: 40,
  useCase: 20,
  skinType: 15,
  budget: 10,
  category: 8,
  text: 7,
  popularity: 5,
  priority: 5,
} as const;

/**
 * Below this, the engine asks a question instead of answering. A weak best
 * match is not a recommendation, it is a guess dressed as one.
 */
export const CONFIDENCE_FLOOR = 25;

export type ScoredProduct = {
  item: ChatCatalogItem;
  score: number;
  reason: string;
};

/**
 * Budget fit, graded rather than binary.
 *
 * A hard cutoff hides the right answer over a 100 taka difference, so
 * anything up to 20% over budget still scores — and reply.ts labels it as
 * slightly over, so the shopper is never surprised by the price on the card.
 */
export const BUDGET_TOLERANCE = 1.2;

function budgetFit(price: number, budgetMax: number | null): number {
  if (budgetMax === null) return 0;
  if (price <= budgetMax) return 1;

  const ceiling = budgetMax * BUDGET_TOLERANCE;
  if (price >= ceiling) return 0;

  return (ceiling - price) / (ceiling - budgetMax);
}

/**
 * Rating weighted by how many people rated it, so a single five-star review
 * cannot outrank forty at 4.5. Normalised to roughly 0-1 across a catalogue
 * of this size.
 */
function popularityFit(item: ChatCatalogItem): number {
  if (item.ratingCount === 0) return 0;
  const confidence = Math.min(1, Math.log1p(item.ratingCount) / Math.log1p(200));
  return (item.ratingAvg / 5) * confidence;
}

/** Overlap between what the shopper typed and the product's own words. */
function textFit(item: ChatCatalogItem, message: NormalizedMessage | null): number {
  if (!message || message.tokens.length === 0) return 0;

  const haystack = `${item.name} ${item.brand ?? ""} ${item.benefit ?? ""}`.toLowerCase();
  const hits = message.tokens.filter(
    (token) => token.length > 3 && haystack.includes(token),
  ).length;

  return Math.min(1, hits / 3);
}

/**
 * Hard filters. These are not deductions — an out-of-stock product must never
 * be recommended however well it scores, and a product marked `avoidFor` a
 * skin type must never reach that shopper.
 */
function isEligible(item: ChatCatalogItem, slots: Slots): boolean {
  if (!item.inStock) return false;

  if (slots.skinType && item.knowledge?.avoidFor?.includes(slots.skinType)) {
    return false;
  }

  if (slots.budgetMax !== null && item.price > slots.budgetMax * BUDGET_TOLERANCE) {
    return false;
  }

  return true;
}

function buildReason(item: ChatCatalogItem, slots: Slots): string {
  const knowledge = item.knowledge;
  const parts: string[] = [];

  const concerns = knowledge
    ? slots.concerns.filter((concern) => knowledge.concerns.includes(concern))
    : [];

  if (concerns.length > 0) {
    parts.push(`targets ${concerns.map((c) => CONCERN_LABELS[c]).join(" and ")}`);
  }

  const useCases = knowledge
    ? slots.useCases.filter((useCase) => knowledge.useCases.includes(useCase))
    : [];

  if (useCases.length > 0) {
    parts.push(`made for ${useCases.map((u) => USE_CASE_LABELS[u]).join(" and ")}`);
  }

  // "dry skin" is both a concern and a skin type, and fills both slots from
  // one phrase — saying "targets dry skin, suits dry skin" reads like a bug
  const namedConcerns = new Set(concerns.map((c) => CONCERN_LABELS[c]));

  if (
    slots.skinType &&
    knowledge?.skinTypes.includes(slots.skinType) &&
    !namedConcerns.has(SKIN_TYPE_LABELS[slots.skinType])
  ) {
    parts.push(`suits ${SKIN_TYPE_LABELS[slots.skinType]}`);
  }

  if (slots.category && item.categorySlug === slots.category) {
    parts.push(`it's a ${CATEGORY_LABELS[slots.category]}`);
  }

  if (slots.budgetMax !== null && item.price > slots.budgetMax) {
    parts.push("slightly over your budget");
  }

  // never invent a rationale — fall back to the product's own one-liner, and
  // if it has none, say nothing rather than something unsupported
  if (parts.length === 0) return item.benefit ?? "";

  const sentence = parts.join(", ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

export function scoreProduct(
  item: ChatCatalogItem,
  slots: Slots,
  message: NormalizedMessage | null,
): number {
  const knowledge = item.knowledge;
  let score = 0;

  if (knowledge && slots.concerns.length > 0) {
    const hits = slots.concerns.filter((c) => knowledge.concerns.includes(c)).length;
    score += (hits / slots.concerns.length) * WEIGHTS.concern;
  }

  if (knowledge && slots.useCases.length > 0) {
    const hits = slots.useCases.filter((u) => knowledge.useCases.includes(u)).length;
    score += (hits / slots.useCases.length) * WEIGHTS.useCase;
  }

  if (knowledge && slots.skinType && knowledge.skinTypes.includes(slots.skinType)) {
    score += WEIGHTS.skinType;
  }

  score += budgetFit(item.price, slots.budgetMax) * WEIGHTS.budget;

  if (slots.category && item.categorySlug === slots.category) {
    score += WEIGHTS.category;
  }

  score += textFit(item, message) * WEIGHTS.text;
  score += popularityFit(item) * WEIGHTS.popularity;
  score += ((knowledge?.priority ?? 0) / 10) * WEIGHTS.priority;

  return score;
}

export function rankProducts({
  catalog,
  slots,
  message,
  take = 3,
}: {
  catalog: ChatCatalogItem[];
  slots: Slots;
  message?: NormalizedMessage | null;
  take?: number;
}): ScoredProduct[] {
  return catalog
    .filter((item) => isEligible(item, slots))
    .map((item) => ({
      item,
      score: scoreProduct(item, slots, message ?? null),
      reason: buildReason(item, slots),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.item.ratingCount - a.item.ratingCount ||
        // slug is unique, so ties resolve identically on every request — the
        // same reason catalog queries add _id to every sort
        a.item.slug.localeCompare(b.item.slug),
    )
    .slice(0, take);
}

export function toProductCard(scored: ScoredProduct): ChatProductCard {
  const { item } = scored;

  return {
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    price: item.price,
    comparePrice: item.comparePrice,
    imageUrl: item.imageUrl,
    inStock: item.inStock,
    ratingAvg: item.ratingAvg,
    ratingCount: item.ratingCount,
    reason: scored.reason,
  };
}

/**
 * Finds the product a shopper is asking *about* — "how much is the snail
 * essence", "is the dokdo toner in stock".
 *
 * Scores on how much of the product's name the message actually covers, so a
 * two-word overlap on a long name does not beat an exact match. Returns null
 * rather than a weak guess: answering about the wrong product is worse than
 * asking which one they mean.
 */
export function resolveProduct(
  catalog: ChatCatalogItem[],
  message: NormalizedMessage,
): ChatCatalogItem | null {
  const tokens = message.tokens.filter((token) => token.length > 2);
  if (tokens.length === 0) return null;

  let best: { item: ChatCatalogItem; score: number } | null = null;

  for (const item of catalog) {
    const nameTokens = item.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2);

    if (nameTokens.length === 0) continue;

    const hits = nameTokens.filter((token) => tokens.includes(token)).length;
    if (hits === 0) continue;

    // reward covering the name, not merely touching it
    const score = hits / nameTokens.length + (item.brand && tokens.includes(item.brand.toLowerCase()) ? 0.2 : 0);

    if (!best || score > best.score) best = { item, score };
  }

  return best && best.score >= 0.4 ? best.item : null;
}

/** True when a string is one of the seeded category slugs. Re-exported so the
 *  reply layer can narrow a catalog item's category without importing the
 *  taxonomy directly. */
export { isCategorySlug };
