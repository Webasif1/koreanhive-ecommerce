import type { FaqDoc } from "@/data/chatbot/faqs";
import {
  BUDGET_QUICK_REPLIES,
  CONCERN_QUICK_REPLIES,
  FALLBACK_QUICK_REPLIES,
  OPENING_QUICK_REPLIES,
  SKIN_TYPE_QUICK_REPLIES,
  USE_CASE_QUICK_REPLIES,
} from "@/data/chatbot/quick-replies";
import {
  CATEGORY_LABELS,
  CONCERN_LABELS,
  SKIN_TYPE_LABELS,
} from "@/data/chatbot/taxonomy";
import { formatBDT } from "@/lib/format";
import { interpolate } from "@/lib/chatbot/faq";
import type { NormalizedMessage } from "@/lib/chatbot/normalize";
import {
  CONFIDENCE_FLOOR,
  rankProducts,
  toProductCard,
} from "@/lib/chatbot/recommend";
import type {
  ChatCatalogItem,
  ChatResponse,
  Intent,
  PolicyFacts,
  Slots,
} from "@/lib/chatbot/types";

/**
 * Response composition.
 *
 * Every sentence here is either a fixed template or a value copied out of the
 * catalogue. Nothing is generated, which is what makes "never invent a price"
 * a property of the code rather than a hope.
 */

function base(intent: Intent, slots: Slots): ChatResponse {
  return {
    message: "",
    intent,
    products: [],
    quickReplies: [],
    links: [],
    slots,
    needsMoreInfo: false,
  };
}

/**
 * How many *independent* things the advisor knows.
 *
 * Concern and skin type count as one, because "dry skin" fills both from a
 * single phrase — counting them separately would make one restated fact look
 * like two and skip the follow-up question entirely.
 */
function slotDepth(slots: Slots): number {
  return (
    (slots.concerns.length > 0 || slots.skinType ? 1 : 0) +
    (slots.useCases.length > 0 ? 1 : 0) +
    (slots.category ? 1 : 0) +
    (slots.budgetMax !== null ? 1 : 0)
  );
}

/**
 * The follow-up question, or null when the advisor knows enough.
 *
 * One dimension is not enough to recommend on. "Something for dry skin" could
 * mean a cleanser, an essence or a night cream at four different price points,
 * and picking one at random is how a bot loses trust. Asking is what makes it
 * read as an assistant rather than a search box.
 */
function nextQuestion(slots: Slots): { message: string; quickReplies: string[] } | null {
  if (slotDepth(slots) >= 2) return null;

  if (slots.concerns.length === 0 && slots.useCases.length === 0) {
    return {
      message:
        "Happy to help you find something. What's the main thing you'd like to work on?",
      quickReplies: CONCERN_QUICK_REPLIES,
    };
  }

  if (slots.concerns.length > 0 && slots.useCases.length === 0) {
    const concern = CONCERN_LABELS[slots.concerns[0]];
    return {
      message: `Got it — ${concern}. Are you after everyday upkeep, repairing it properly, or something targeted?`,
      quickReplies: USE_CASE_QUICK_REPLIES,
    };
  }

  if (!slots.skinType) {
    return {
      message: "And how would you describe your skin overall?",
      quickReplies: SKIN_TYPE_QUICK_REPLIES,
    };
  }

  return {
    message: "One more thing — is there a budget you'd like me to stay within?",
    quickReplies: BUDGET_QUICK_REPLIES,
  };
}

/** A short summary of what the advisor is matching on, so the shopper can correct it. */
function summarise(slots: Slots): string {
  const parts: string[] = [];
  const labels = slots.concerns.map((c) => CONCERN_LABELS[c]);

  if (labels.length > 0) parts.push(labels.join(" and "));

  // "dry skin" fills both the concern and the skin-type slot, so echoing both
  // back would read "dry skin, dry skin"
  if (slots.skinType && !labels.includes(SKIN_TYPE_LABELS[slots.skinType])) {
    parts.push(SKIN_TYPE_LABELS[slots.skinType]);
  }

  if (slots.category) parts.push(`a ${CATEGORY_LABELS[slots.category]}`);
  if (slots.budgetMax !== null) parts.push(`under ${formatBDT(slots.budgetMax)}`);

  return parts.join(", ");
}

export function greetingReply(slots: Slots): ChatResponse {
  return {
    ...base("GREETING", slots),
    message:
      "Hello! I'm the Korean Hive shop assistant. I can help you pick products for your skin, or answer questions about delivery, payment and returns.",
    quickReplies: OPENING_QUICK_REPLIES,
  };
}

export function faqReply(faq: FaqDoc, policy: PolicyFacts, slots: Slots): ChatResponse {
  return {
    ...base(faq.intent, slots),
    message: interpolate(faq.answer, policy),
    links: faq.links ?? [],
    quickReplies: ["Help me find a product"],
  };
}

export function fallbackReply(slots: Slots): ChatResponse {
  return {
    ...base("UNKNOWN", slots),
    message:
      "I'm not sure about that one. I can help you choose products for your skin, and answer questions about delivery, payment, returns and authenticity — or the contact page will reach someone on the team.",
    quickReplies: FALLBACK_QUICK_REPLIES,
    links: [{ label: "Contact us", href: "/contact" }],
    needsMoreInfo: true,
  };
}

export function safetyReply(intent: Intent, message: string, slots: Slots): ChatResponse {
  return {
    // no product cards on a safety reply, ever — that is the whole point
    ...base(intent, slots),
    message,
    quickReplies: ["Help me find a product"],
  };
}

export function recommendationReply({
  catalog,
  slots,
  message,
}: {
  catalog: ChatCatalogItem[];
  slots: Slots;
  message: NormalizedMessage;
}): ChatResponse {
  const question = nextQuestion(slots);

  if (question) {
    return {
      ...base("PRODUCT_RECOMMENDATION", slots),
      message: question.message,
      quickReplies: question.quickReplies,
      needsMoreInfo: true,
    };
  }

  const ranked = rankProducts({ catalog, slots, message });

  if (ranked.length === 0 || ranked[0].score < CONFIDENCE_FLOOR) {
    const summary = summarise(slots);

    return {
      ...base("PRODUCT_RECOMMENDATION", slots),
      message: summary
        ? `I couldn't find a confident match for ${summary} in what's in stock right now. Widening the budget or dropping one requirement usually helps — or browse the full range and I'll answer questions about anything you spot.`
        : "I couldn't find a good match for that in what's in stock right now.",
      quickReplies: ["No budget limit", "Help me find a product"],
      links: [{ label: "Shop all products", href: "/shop" }],
      needsMoreInfo: true,
    };
  }

  const summary = summarise(slots);
  const lead =
    ranked.length === 1
      ? `Based on ${summary}, this is what I'd pick:`
      : `Based on ${summary}, here's what I'd look at:`;

  const cautions = ranked[0].item.knowledge?.cautions ?? [];

  return {
    ...base("PRODUCT_RECOMMENDATION", slots),
    // cautions are factual product notes, not advice — worth surfacing before
    // someone buys an acid or a retinal without realising
    message: cautions.length > 0 ? `${lead}\n\nOne note: ${cautions[0]}` : lead,
    products: ranked.map(toProductCard),
    quickReplies: ["Something else", "How much is delivery?"],
  };
}

export function productInfoReply(
  item: ChatCatalogItem | null,
  kind: "info" | "price" | "stock",
  slots: Slots,
): ChatResponse {
  const intent: Intent =
    kind === "price" ? "PRICE_QUERY" : kind === "stock" ? "AVAILABILITY" : "PRODUCT_INFORMATION";

  if (!item) {
    return {
      ...base(intent, slots),
      message:
        "I'm not sure which product you mean — tell me the name and I'll check, or describe what you're after and I'll suggest something.",
      quickReplies: ["Help me find a product"],
      needsMoreInfo: true,
    };
  }

  const link = { label: `View ${item.name}`, href: `/product/${item.slug}` };

  if (kind === "price") {
    const compare =
      item.comparePrice && item.comparePrice > item.price
        ? ` — down from ${formatBDT(item.comparePrice)}`
        : "";

    return {
      ...base(intent, slots),
      message: `${item.name} is ${formatBDT(item.price)}${compare}.${
        item.inStock ? "" : " It's out of stock at the moment."
      }`,
      links: [link],
    };
  }

  if (kind === "stock") {
    return {
      ...base(intent, slots),
      message: item.inStock
        ? `Yes — ${item.name} is in stock at ${formatBDT(item.price)}.`
        : `${item.name} is out of stock right now. I can suggest something similar if you'd like.`,
      links: [link],
      quickReplies: item.inStock ? [] : ["Help me find a product"],
    };
  }

  // Product facts are quoted from the product's own fields, never paraphrased
  const lines = [item.benefit, item.howToUse ? `How to use: ${item.howToUse}` : null]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");

  return {
    ...base(intent, slots),
    message: lines
      ? `${item.name} — ${formatBDT(item.price)}\n\n${lines}`
      : `${item.name} is ${formatBDT(item.price)}. The product page has the full details.`,
    links: [link],
  };
}

/** Ingredient questions are answered by quoting the label, with no reading of it. */
export function ingredientsReply(item: ChatCatalogItem | null, slots: Slots): ChatResponse {
  if (!item || !item.ingredients) {
    return productInfoReply(item, "info", slots);
  }

  return {
    ...base("PRODUCT_INFORMATION", slots),
    message: `${item.name} lists: ${item.ingredients}\n\nIf you're checking for something you react to, the full list is on the product page and on the box.`,
    links: [{ label: `View ${item.name}`, href: `/product/${item.slug}` }],
  };
}
