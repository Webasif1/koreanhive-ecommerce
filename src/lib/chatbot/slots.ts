import {
  CATEGORY_SYNONYMS,
  CONCERN_SYNONYMS,
  SKIN_TYPE_SYNONYMS,
  USE_CASE_SYNONYMS,
  isCategorySlug,
  isConcern,
  isSkinType,
  isUseCase,
  type CategorySlug,
  type Concern,
  type SkinType,
  type UseCase,
} from "@/data/chatbot/taxonomy";
import { containsPhrase, type NormalizedMessage } from "@/lib/chatbot/normalize";
import { EMPTY_SLOTS, type Slots } from "@/lib/chatbot/types";

/**
 * Slot filling — the conversation's memory.
 *
 * Each turn extracts what it can and merges over what came before, so "I have
 * dry skin" followed by "under 1500" reaches the recommender as both facts at
 * once. State lives on the client and is echoed back each request; nothing is
 * stored server-side, so there is no chat history to leak.
 */

const MAX_BUDGET = 100_000;
const MIN_BUDGET = 100;

/**
 * An explicit clearing of a budget set earlier. Deliberately narrow: "any
 * price" would normalise to the bare token "price" and swallow every price
 * question the shopper asks afterwards.
 */
const BUDGET_RESET_CUES = [
  "no budget",
  "no limit",
  "no maximum",
  "price doesnt matter",
  "price does not matter",
];

/**
 * Reads a budget ceiling.
 *
 * Only fires on an explicit ceiling cue ("under", "below", "within", "max").
 * A bare number is ambiguous — "50ml" and "spf 50" are not budgets — so it is
 * ignored rather than guessed at.
 */
export function extractBudget(message: NormalizedMessage): number | null {
  if (BUDGET_RESET_CUES.some((cue) => containsPhrase(message, cue))) return null;

  const match = message.text.match(
    /(?:under|below|within|less than|upto|up to|max|maximum|budget)\s+(?:taka\s+)?(\d{2,6})/,
  );

  if (!match) return null;

  const value = Number.parseInt(match[1], 10);
  if (!Number.isFinite(value) || value < MIN_BUDGET || value > MAX_BUDGET) return null;

  return value;
}

function matchAll<T extends string>(
  message: NormalizedMessage,
  table: Record<T, string[]>,
): T[] {
  return (Object.keys(table) as T[]).filter((key) =>
    table[key].some((phrase) => containsPhrase(message, phrase)),
  );
}

function matchOne<T extends string>(
  message: NormalizedMessage,
  table: Record<T, string[]>,
): T | null {
  let best: { key: T; length: number } | null = null;

  // longest matching phrase wins, so "combination skin" beats a stray "skin"
  for (const key of Object.keys(table) as T[]) {
    for (const phrase of table[key]) {
      if (!containsPhrase(message, phrase)) continue;
      if (!best || phrase.length > best.length) best = { key, length: phrase.length };
    }
  }

  return best?.key ?? null;
}

/**
 * Reads this turn and merges it over what came before.
 *
 * `recognized` reports whether the turn said anything the advisor understood.
 * It is how a bare answer to the bot's own question — "under 1500", "sensitive
 * skin" — is told apart from a genuine change of subject: both look like
 * nothing to the intent classifier, but only one of them filled a slot.
 */
export function readSlots(
  message: NormalizedMessage,
  prior: Slots,
): { slots: Slots; recognized: boolean } {
  const concerns = matchAll<Concern>(message, CONCERN_SYNONYMS);
  const useCases = matchAll<UseCase>(message, USE_CASE_SYNONYMS);
  const skinType = matchOne<SkinType>(message, SKIN_TYPE_SYNONYMS);
  const category = matchOne<CategorySlug>(message, CATEGORY_SYNONYMS);
  const budgetMax = extractBudget(message);

  const clearsBudget = BUDGET_RESET_CUES.some((cue) => containsPhrase(message, cue));

  return {
    slots: {
      // union rather than replace: a shopper adding "and it's dull too" is
      // adding a concern, not correcting the first one
      concerns: [...new Set([...prior.concerns, ...concerns])].slice(0, 4),
      useCases: [...new Set([...prior.useCases, ...useCases])].slice(0, 4),
      // singular slots overwrite — the newest answer is the true one
      skinType: skinType ?? prior.skinType,
      category: category ?? prior.category,
      budgetMax: clearsBudget ? null : (budgetMax ?? prior.budgetMax),
    },
    recognized:
      concerns.length > 0 ||
      useCases.length > 0 ||
      skinType !== null ||
      category !== null ||
      budgetMax !== null ||
      // "no budget limit" answers the question even though it clears a slot
      clearsBudget,
  };
}

/**
 * Rebuilds slots from an untrusted request body.
 *
 * The client is the only place conversation state lives, so it arrives over
 * the wire and cannot be trusted. Everything is checked against the taxonomy
 * and anything unrecognised is dropped — a forged payload can only ever give
 * the forger a worse recommendation, never an error or a leak.
 */
export function parseSlots(value: unknown): Slots {
  if (!value || typeof value !== "object") return EMPTY_SLOTS;

  const raw = value as Record<string, unknown>;
  const budget = typeof raw.budgetMax === "number" ? raw.budgetMax : null;

  return {
    concerns: (Array.isArray(raw.concerns) ? raw.concerns : []).filter(isConcern).slice(0, 4),
    useCases: (Array.isArray(raw.useCases) ? raw.useCases : []).filter(isUseCase).slice(0, 4),
    skinType: isSkinType(raw.skinType) ? raw.skinType : null,
    category: isCategorySlug(raw.category) ? raw.category : null,
    budgetMax:
      budget !== null && Number.isFinite(budget) && budget >= MIN_BUDGET && budget <= MAX_BUDGET
        ? Math.floor(budget)
        : null,
  };
}

/** Enough to give a recommendation worth reading, rather than a shrug. */
export function hasEnoughToRecommend(slots: Slots): boolean {
  if (slots.concerns.length > 0) return true;
  if (slots.useCases.length > 0) return true;
  // a bare category is not enough — "show me a serum" deserves a follow-up,
  // but "a serum for oily skin" is answerable
  return slots.category !== null && (slots.skinType !== null || slots.budgetMax !== null);
}
