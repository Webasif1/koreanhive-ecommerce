import type { FaqDoc } from "@/data/chatbot/faqs";
import {
  BUDGET_QUICK_REPLIES,
  CONCERN_QUICK_REPLIES,
  FALLBACK_QUICK_REPLIES,
  OPENING_QUICK_REPLIES,
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
 * How much the advisor knows that actually changes the answer.
 *
 * Concern and skin type count as one, because "dry skin" fills both from a
 * single phrase and counting them twice would overstate what is known.
 *
 * Only slots the scorer reads count. Use cases used to count here, but nothing
 * scores on them any more — the editorial file that carried per-product use
 * cases was orphaned by the catalogue import — so requiring one meant asking a
 * follow-up whose answer could not affect the result.
 */
function slotDepth(slots: Slots): number {
  return (
    (slots.concerns.length > 0 || slots.skinType ? 1 : 0) +
    (slots.category ? 1 : 0) +
    (slots.budgetMax !== null ? 1 : 0)
  );
}

/**
 * The follow-up question, or null when the advisor knows enough to answer.
 *
 * It asks only when it has nothing to rank on. It used to demand two
 * dimensions before answering, which was right when three of them fed the
 * score; now that concerns carry the ranking, "my skin is oily" is enough, and
 * making someone answer a budget question before seeing a single product reads
 * as an obstacle rather than an assistant. Budget is offered afterwards as a
 * quick reply, so narrowing stays one tap away.
 */
function nextQuestion(slots: Slots): { message: string; quickReplies: string[] } | null {
  if (slotDepth(slots) >= 1) return null;

  return {
    message:
      "Happy to help you find something. What's the main thing you'd like to work on?",
    quickReplies: CONCERN_QUICK_REPLIES,
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

  return {
    ...base("PRODUCT_RECOMMENDATION", slots),
    // The per-product "one note" caution came from the editorial file the
    // catalogue import orphaned. The sheet has no equivalent column, so rather
    // than keep a line that could never fire, cautions are gone until there is
    // real data behind them.
    message: lead,
    products: ranked.map(toProductCard),
    // narrowing offered rather than demanded — the products are already shown
    quickReplies:
      slots.budgetMax === null
        ? [...BUDGET_QUICK_REPLIES.slice(0, 2), "Something else"]
        : ["Something else", "How much is delivery?"],
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
