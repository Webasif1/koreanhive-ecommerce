import { containsPhrase, type NormalizedMessage } from "@/lib/chatbot/normalize";
import type { Intent } from "@/lib/chatbot/types";

/**
 * Guard rails, checked before intent classification.
 *
 * Order matters. "Will this cure my eczema?" contains both a skin condition
 * and a request for a product; a classifier that runs first calls it a
 * recommendation and answers with a product card, which is exactly the
 * medical claim we must never make. Gating first makes that impossible rather
 * than unlikely.
 */

const MEDICAL_TERMS = [
  "cure",
  "cures",
  "heal my",
  "treat my",
  "treatment for",
  "disease",
  "eczema",
  "psoriasis",
  "dermatitis",
  "fungal",
  "infection",
  "infected",
  "rash",
  "allergy",
  "allergic",
  "prescription",
  "prescribe",
  "medicine",
  "medical",
  "doctor",
  "dermatologist",
  "pregnant",
  "pregnancy",
  "breastfeeding",
  "steroid",
  "melanoma",
  "cancer",
  "safe during",
];

const CREDENTIAL_TERMS = [
  "card number",
  "credit card",
  "debit card",
  "cvv",
  "card details",
  "otp",
  "one time password",
  "pin number",
  "password",
  "my pin",
  "bkash pin",
];

export const MEDICAL_REPLY =
  "I can't give medical advice or say that any product treats a condition — that needs a doctor or a dermatologist who can actually look at your skin. What I can do is tell you what's in a product and what it's formulated for, so you or your doctor can decide. If you'd like, tell me a skincare goal instead, like hydration or sun protection.";

export const CREDENTIALS_REPLY =
  "I'll never ask for a card number, PIN, OTP or password, and neither will anyone from Korean Hive — if someone does, it isn't us. You don't need any of it here anyway: every order is cash on delivery, so you pay the courier at your door.";

export type SafetyVerdict = { intent: Intent; message: string } | null;

/**
 * Returns a fixed reply when the message must not reach the recommender, or
 * null to continue. A safety reply never carries product cards.
 */
export function checkSafety(message: NormalizedMessage): SafetyVerdict {
  if (CREDENTIAL_TERMS.some((term) => containsPhrase(message, term))) {
    return { intent: "SAFETY_CREDENTIALS", message: CREDENTIALS_REPLY };
  }

  if (MEDICAL_TERMS.some((term) => containsPhrase(message, term))) {
    return { intent: "SAFETY_MEDICAL", message: MEDICAL_REPLY };
  }

  return null;
}
