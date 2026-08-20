import { containsPhrase, normalize } from "@/lib/chatbot/normalize";
import { findFaq } from "@/lib/chatbot/faq";
import { detectIntent } from "@/lib/chatbot/intent";
import { resolveProduct } from "@/lib/chatbot/recommend";
import {
  faqReply,
  fallbackReply,
  greetingReply,
  ingredientsReply,
  productInfoReply,
  recommendationReply,
  safetyReply,
} from "@/lib/chatbot/reply";
import { checkSafety } from "@/lib/chatbot/safety";
import { readSlots } from "@/lib/chatbot/slots";
import type {
  ChatCatalogItem,
  ChatResponse,
  ChatTurnInput,
  PolicyFacts,
} from "@/lib/chatbot/types";

export { EMPTY_SLOTS } from "@/lib/chatbot/types";
export type { ChatResponse, ChatCatalogItem, PolicyFacts, Slots } from "@/lib/chatbot/types";

const INGREDIENT_CUES = ["ingredient", "ingredients", "what is inside", "contains"];

/**
 * One conversation turn.
 *
 * A pure function of (input, catalogue, policy) — no database, no clock, no
 * environment, no randomness. Two identical requests produce byte-identical
 * responses, which is what makes the whole engine testable with a fixture
 * array and no Next.js runtime.
 *
 * This is also the seam for a future language model: an `understand()` step
 * could fill slots before the router and a `phrase()` step could reword the
 * message afterwards, without either one choosing a product or a price.
 */
export function runChatTurn(
  input: ChatTurnInput,
  catalog: ChatCatalogItem[],
  policy: PolicyFacts,
): ChatResponse {
  const message = normalize(input.message);

  // before anything else — a medical or credential question must never reach
  // the recommender, whatever else it looks like
  const verdict = checkSafety(message);
  if (verdict) return safetyReply(verdict.intent, verdict.message, input.slots);

  const { intent, faqId } = detectIntent(message);
  const { slots, recognized } = readSlots(message, input.slots);

  switch (intent) {
    case "GREETING":
      return greetingReply(slots);

    case "FAQ_SHIPPING":
    case "FAQ_PAYMENT":
    case "FAQ_RETURNS":
    case "FAQ_AUTHENTICITY":
    case "FAQ_ORDERING":
    case "ORDER_HELP": {
      const faq = findFaq(message, faqId);
      return faq ? faqReply(faq, policy, slots) : fallbackReply(slots);
    }

    case "PRICE_QUERY":
      return productInfoReply(resolveProduct(catalog, message), "price", slots);

    case "AVAILABILITY":
      return productInfoReply(resolveProduct(catalog, message), "stock", slots);

    case "PRODUCT_INFORMATION": {
      const item = resolveProduct(catalog, message);
      const wantsIngredients = INGREDIENT_CUES.some((cue) => containsPhrase(message, cue));
      return wantsIngredients
        ? ingredientsReply(item, slots)
        : productInfoReply(item, "info", slots);
    }

    case "PRODUCT_RECOMMENDATION":
      return recommendationReply({ catalog, slots, message });

    default:
      // "under 1500 taka" on its own classifies as nothing, but it is an
      // answer to the question the advisor just asked — so a turn that filled
      // a slot continues the recommendation rather than falling back
      return recognized
        ? recommendationReply({ catalog, slots, message })
        : fallbackReply(slots);
  }
}
