import { FAQS, type FaqDoc } from "@/data/chatbot/faqs";
import { formatBDT, formatDeliveryWindow } from "@/lib/format";
import { phraseScore, type NormalizedMessage } from "@/lib/chatbot/normalize";
import type { PolicyFacts } from "@/lib/chatbot/types";

/**
 * FAQ retrieval and fact interpolation.
 *
 * Answers never hardcode a delivery charge. The placeholders below are filled
 * from the DeliveryZone rows that checkout actually charges from, so the bot
 * cannot quote a rate the cart disagrees with — the same discipline the
 * /shipping page uses.
 */

export function findFaq(message: NormalizedMessage, faqId: string | null): FaqDoc | null {
  if (faqId) return FAQS.find((faq) => faq.id === faqId) ?? null;

  let best: { faq: FaqDoc; score: number } | null = null;

  for (const faq of FAQS) {
    const score = phraseScore(message, faq.keywords) * 2 + phraseScore(message, faq.questions);
    if (score > 0 && (!best || score > best.score)) best = { faq, score };
  }

  return best?.faq ?? null;
}

function ratesSentence(policy: PolicyFacts): string {
  if (policy.zones.length === 0) {
    return "Delivery charges are shown in your cart once you pick a district.";
  }

  const parts = policy.zones.map(
    (zone) => `${zone.name} is ${formatBDT(zone.charge)}`,
  );

  return `Delivery is charged by zone — ${parts.join(", and ")}. The exact charge is added in your cart once you choose your district.`;
}

function timesSentence(policy: PolicyFacts): string {
  if (policy.zones.length === 0) {
    return "Delivery times are on the shipping page.";
  }

  const parts = policy.zones.map(
    (zone) => `${zone.name} takes ${formatDeliveryWindow(zone.minDays, zone.maxDays)}`,
  );

  return `${parts.join(", and ")}.`;
}

function freeShippingSentence(policy: PolicyFacts): string {
  const withThreshold = policy.zones.filter((zone) => zone.freeShippingThreshold !== null);

  if (withThreshold.length === 0) {
    return "We don't run free delivery at the moment — the charge for your zone is added in the cart once you pick your district.";
  }

  const parts = withThreshold.map(
    (zone) =>
      `${zone.name} orders over ${formatBDT(zone.freeShippingThreshold as number)} ship free`,
  );

  return `${parts.join(", and ")}. Below that, the normal zone charge applies.`;
}

/** Replaces every {{placeholder}} in an answer with a live fact. */
export function interpolate(answer: string, policy: PolicyFacts): string {
  return answer
    .replaceAll("{{deliveryRates}}", ratesSentence(policy))
    .replaceAll("{{deliveryTimes}}", timesSentence(policy))
    .replaceAll("{{freeShipping}}", freeShippingSentence(policy));
}
