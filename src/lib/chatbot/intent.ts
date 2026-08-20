import { FAQS } from "@/data/chatbot/faqs";
import {
  CATEGORY_SYNONYMS,
  CONCERN_SYNONYMS,
  SKIN_TYPE_SYNONYMS,
  USE_CASE_SYNONYMS,
} from "@/data/chatbot/taxonomy";
import {
  containsPhrase,
  normalizePhrase,
  phraseScore,
  type NormalizedMessage,
} from "@/lib/chatbot/normalize";
import type { Intent } from "@/lib/chatbot/types";

/**
 * Scored intent classification.
 *
 * Every intent proposes a score; the highest wins, and must clear a floor or
 * the turn falls back to UNKNOWN. Guessing badly is worse than admitting
 * ignorance — a wrong FAQ reads as if the bot ignored the question, while the
 * fallback at least offers the shopper a working next step.
 */

const GREETINGS = [
  "hi",
  "hello",
  "hey",
  "salam",
  "assalamu alaikum",
  "good morning",
  "good evening",
  "good afternoon",
  "hlw",
];

const RECOMMENDATION_CUES = [
  "recommend",
  "suggest",
  "which product",
  "what product",
  "best for",
  "good for",
  "help me find",
  "looking for",
  "i need",
  "i want",
  "something for",
  "what should i use",
  "which one",
  "best product",
  "suitable for",
];

const PRICE_CUES = [
  "price",
  "how much is",
  "cost of",
  "how much does",
  "what is the price",
  "dam",
];

const AVAILABILITY_CUES = [
  "in stock",
  "available",
  "availability",
  "do you have",
  "out of stock",
  "stock",
];

const INFO_CUES = [
  "what is in",
  "ingredients",
  "ingredient",
  "how to use",
  "how do i use",
  "tell me about",
  "what does it do",
  "details about",
  "more about",
];

/**
 * Every product word the advisor knows, deduplicated by normalised form.
 *
 * Without the dedupe, "serum" and "serums" are two entries that collapse to
 * the same needle, so a single word in the message scores twice and can tip a
 * specific question ("is X in stock") into a vague one.
 */
const VOCABULARY = [
  ...new Set(
    [
      ...Object.values(CONCERN_SYNONYMS),
      ...Object.values(SKIN_TYPE_SYNONYMS),
      ...Object.values(USE_CASE_SYNONYMS),
      ...Object.values(CATEGORY_SYNONYMS),
    ]
      .flat()
      .map(normalizePhrase),
  ),
];

export type IntentResult = {
  intent: Intent;
  score: number;
  /** Set when the winner was an FAQ, so the caller need not match twice. */
  faqId: string | null;
};

/** Below this, nothing is confident enough to answer with. */
const MIN_SCORE = 2;

export function detectIntent(message: NormalizedMessage): IntentResult {
  if (message.tokens.length === 0) {
    return { intent: "UNKNOWN", score: 0, faqId: null };
  }

  const candidates: IntentResult[] = [];

  // A greeting only counts as a greeting when it is the whole message —
  // otherwise "hi, which sunscreen is best?" gets answered with "hello!".
  if (message.tokens.length <= 3 && GREETINGS.some((g) => containsPhrase(message, g))) {
    candidates.push({ intent: "GREETING", score: 6, faqId: null });
  }

  for (const faq of FAQS) {
    // keywords are the phrasings shoppers actually type, so they carry more
    // weight than the full-sentence paraphrases
    const score = phraseScore(message, faq.keywords) * 2 + phraseScore(message, faq.questions);
    if (score > 0) {
      candidates.push({ intent: faq.intent, score, faqId: faq.id });
    }
  }

  // pushed before the recommendation candidate on purpose: ties resolve to
  // whichever was pushed first, and "is the vitamin C serum in stock" mentions
  // enough product words to tie. A specific question deserves a specific
  // answer, so the narrow intents get precedence.
  const price = phraseScore(message, PRICE_CUES) * 2;
  if (price > 0) candidates.push({ intent: "PRICE_QUERY", score: price, faqId: null });

  const availability = phraseScore(message, AVAILABILITY_CUES) * 2;
  if (availability > 0) {
    candidates.push({ intent: "AVAILABILITY", score: availability, faqId: null });
  }

  const info = phraseScore(message, INFO_CUES) * 2;
  if (info > 0) {
    candidates.push({ intent: "PRODUCT_INFORMATION", score: info, faqId: null });
  }

  const recommendation = phraseScore(message, RECOMMENDATION_CUES) * 2;

  // "for dry skin" is a recommendation request even with no verb in front of
  // it, so vocabulary hits count towards the intent as well as the slots
  const vocabulary = phraseScore(message, VOCABULARY);

  if (recommendation + vocabulary > 0) {
    candidates.push({
      intent: "PRODUCT_RECOMMENDATION",
      score: recommendation + vocabulary,
      faqId: null,
    });
  }

  if (candidates.length === 0) {
    return { intent: "UNKNOWN", score: 0, faqId: null };
  }

  // Ties resolve by the order intents were pushed, which is deliberate:
  // greeting, FAQ, then the narrow product questions, and only then the
  // catch-all recommendation.
  const winner = candidates.reduce((best, c) => (c.score > best.score ? c : best));

  return winner.score >= MIN_SCORE
    ? winner
    : { intent: "UNKNOWN", score: winner.score, faqId: null };
}
