import { runChatTurn } from "@/lib/chatbot";
import { normalize } from "@/lib/chatbot/normalize";
import { resolveProduct } from "@/lib/chatbot/recommend";
import { checkSafety } from "@/lib/chatbot/safety";
import { readSlots } from "@/lib/chatbot/slots";
import {
  EMPTY_SLOTS,
  type ChatCatalogItem,
  type PolicyFacts,
  type Slots,
} from "@/lib/chatbot/types";
import { shopUrl, trackUrl } from "@/lib/email/templates";
import * as copy from "@/lib/whatsapp/copy";
import { detectLanguage, type Lang } from "@/lib/whatsapp/language";
import { looksLikeDetails, readSignals } from "@/lib/whatsapp/signals";

/**
 * One WhatsApp turn, following the shop's inbox sales script.
 *
 * A pure function of (message, conversation state, catalogue, policy), like
 * the site assistant's runChatTurn — which it reuses for everything that is
 * not selling: FAQs, recommendations, ingredient questions, the safety gate.
 *
 * The script, as a stage machine:
 *
 *   idle ──price asked──▶ qualifying ──any answer──▶ offered ──yes──▶ awaiting_details ──details──▶ hand-off
 *                            (script 1)                (script 2)                                      (staff confirm)
 *
 * with "too expensive" answered by script 3 from any stage, and script 4 (the
 * follow-up) sent later by server/whatsapp/follow-ups.ts.
 *
 * Links go to the live shop rather than to whatever host is serving the
 * request: a WhatsApp message sits in the customer's chat for months, like an
 * email does.
 */

export type Stage = "idle" | "qualifying" | "offered" | "awaiting_details";

export type SalesState = {
  language: Lang | null;
  stage: Stage;
  /** The product the conversation is about. */
  focusSlug: string | null;
  /** How many times the price was asked for the focus product. */
  priceAsks: number;
  /** Script 1's question has been answered, so the next price ask is answered. */
  qualified: boolean;
  /** Consecutive messages the bot could not place. Two hands off to a person. */
  misses: number;
  greeted: boolean;
  slots: Slots;
};

export const INITIAL_SALES_STATE: SalesState = {
  language: null,
  stage: "idle",
  focusSlug: null,
  priceAsks: 0,
  qualified: false,
  misses: 0,
  greeted: false,
  slots: EMPTY_SLOTS,
};

export type HandoffReason = "order" | "human" | "complaint" | "order-status" | "unclear";

export type ReplyKind =
  | "greet"
  | "qualify"
  | "offer"
  | "out-of-stock"
  | "objection"
  | "ask-details"
  | "order-received"
  | "human"
  | "complaint"
  | "delivery"
  | "payment"
  | "authenticity"
  | "returns"
  | "order-status"
  | "recommend"
  | "answer"
  | "pick-product"
  | "thanks"
  | "fallback"
  | "safety";

export type LatestOrder = { orderNumber: string; status: string };

export type SalesInput = {
  message: string;
  /** WhatsApp profile name, if the customer has one. */
  name: string | null;
  state: SalesState;
  catalog: ChatCatalogItem[];
  policy: PolicyFacts;
  /**
   * The customer's latest order, looked up by the caller only when
   * `wantsOrderStatus` says the message asks for it. `undefined` means
   * nobody looked; `null` means there is none.
   */
  latestOrder?: LatestOrder | null;
};

export type SalesTurn = {
  reply: string;
  kind: ReplyKind;
  language: Lang;
  state: SalesState;
  handoff: { reason: HandoffReason; details: string | null } | null;
  /** False for wording that is fixed on purpose and must not be rewritten. */
  rephrase: boolean;
};

/** Whether the caller should look the customer's order up before the turn. */
export function wantsOrderStatus(message: string) {
  return readSignals(message).orderStatus;
}

const MAX_BENEFIT = 160;

export function productUrl(slug: string) {
  return shopUrl(`/product/${slug}`);
}

function toFacts(item: ChatCatalogItem): copy.ProductFacts {
  const benefit = item.benefit?.trim() || null;
  return {
    name: item.name,
    price: item.price,
    comparePrice: item.comparePrice,
    inStock: item.inStock,
    benefit:
      benefit && benefit.length > MAX_BENEFIT ? `${benefit.slice(0, MAX_BENEFIT - 1).trimEnd()}…` : benefit,
    url: productUrl(item.slug),
  };
}

/**
 * Products that do the same job. The same kind of product comes first — a
 * toner is only ever swapped for a toner, because a shared concern alone once
 * offered a baby lotion to someone asking about a toner. A shared concern is
 * only the test when the product has no category to go by.
 */
function similar(catalog: ChatCatalogItem[], to: ChatCatalogItem) {
  return catalog.filter(
    (item) =>
      item.slug !== to.slug &&
      item.inStock &&
      (to.categorySlug !== null
        ? item.categorySlug === to.categorySlug
        : item.concerns.some((concern) => to.concerns.includes(concern))),
  );
}

/** A budget option has to be noticeably cheaper to be worth offering. */
const CHEAPER_BY = 0.85;

/** Script 3's budget option: the closest in price below the one discussed. */
function cheaperAlternative(catalog: ChatCatalogItem[], to: ChatCatalogItem) {
  return (
    similar(catalog, to)
      .filter((item) => item.price <= to.price * CHEAPER_BY)
      .sort((a, b) => b.price - a.price || a.slug.localeCompare(b.slug))[0] ?? null
  );
}

/** For an out-of-stock product: the best-rated in-stock one doing the same job. */
function inStockAlternative(catalog: ChatCatalogItem[], to: ChatCatalogItem) {
  return (
    similar(catalog, to).sort(
      (a, b) =>
        b.ratingAvg * Math.log1p(b.ratingCount) - a.ratingAvg * Math.log1p(a.ratingCount) ||
        a.slug.localeCompare(b.slug),
    )[0] ?? null
  );
}

export function runSalesTurn(input: SalesInput): SalesTurn {
  const { message, name, state, catalog, policy } = input;
  const zones = policy.zones;

  const signals = readSignals(message);
  const language = detectLanguage(message, state.language);
  const normalized = normalize(message);
  const { slots, recognized } = readSlots(normalized, state.slots);

  const bySlug = (slug: string | null) =>
    slug ? (catalog.find((item) => item.slug === slug) ?? null) : null;

  // the product this message names, by link (the website button) or by name
  const named = bySlug(signals.productSlug) ?? resolveProduct(catalog, normalized);
  const focus = named ?? bySlug(state.focusSlug);

  const next: SalesState = {
    ...state,
    language,
    slots,
    greeted: true,
    misses: 0,
    focusSlug: focus?.slug ?? null,
  };

  // A new product resets the script for it: its price has not been asked yet.
  if (named && named.slug !== state.focusSlug) {
    next.priceAsks = 0;
    if (state.stage !== "awaiting_details") next.stage = "idle";
  }

  const firstReply = !state.greeted;

  const turn = (
    kind: ReplyKind,
    reply: string,
    extra: Partial<Pick<SalesTurn, "handoff" | "rephrase">> = {},
  ): SalesTurn => {
    // the script opens every conversation with a salam; the replies that
    // carry their own greeting, and the fixed safety wording, are left alone
    const opens = firstReply && !["greet", "qualify", "safety", "fallback"].includes(kind);
    return {
      reply: opens ? `${copy.salam(language, name)} ${reply}` : reply,
      kind,
      language,
      state: next,
      handoff: null,
      rephrase: true,
      ...extra,
    };
  };

  const handoff = (
    kind: ReplyKind,
    reply: string,
    reason: HandoffReason,
    details: string | null = null,
  ) => {
    next.stage = "idle";
    return turn(kind, reply, { handoff: { reason, details } });
  };

  // --------------------------------------------------------------- safety
  // First, whatever else the message looks like — a medical question must
  // never reach the price script or the recommender.
  const verdict = checkSafety(normalized);
  if (verdict) {
    next.stage = state.stage;
    return turn(
      "safety",
      verdict.intent === "SAFETY_CREDENTIALS"
        ? copy.credentialsCopy(language)
        : copy.medicalCopy(language),
      { rephrase: false },
    );
  }

  // ------------------------------------------------------- order details
  if (
    state.stage === "awaiting_details" &&
    !signals.human &&
    !signals.complaint &&
    looksLikeDetails(message)
  ) {
    return handoff("order-received", copy.orderReceivedCopy(language, name), "order", message);
  }

  // --------------------------------------------------- needs a person
  if (signals.complaint) {
    return handoff("complaint", copy.complaintCopy(language), "complaint", message);
  }

  if (signals.human) {
    return handoff("human", copy.humanCopy(language, name), "human", message);
  }

  if (signals.orderStatus && input.latestOrder !== undefined) {
    if (input.latestOrder === null) {
      return handoff("order-status", copy.orderNotFoundCopy(language), "order-status", message);
    }

    return turn(
      "order-status",
      copy.orderStatusCopy(language, input.latestOrder, trackUrl(input.latestOrder.orderNumber)),
    );
  }

  // ------------------------------------------- script 3: "too expensive"
  if (signals.objection) {
    const cheaper = focus ? cheaperAlternative(catalog, focus) : null;
    return turn(
      "objection",
      copy.objectionCopy(
        language,
        focus ? toFacts(focus) : null,
        cheaper ? toFacts(cheaper) : null,
      ),
    );
  }

  // ------------------------------------------------------------- ordering
  const saysYes =
    state.stage === "offered" && (signals.affirm || signals.zone !== null);

  if (signals.wantsOrder || saysYes) {
    if (focus && !focus.inStock) {
      const alternative = inStockAlternative(catalog, focus);
      return turn(
        "out-of-stock",
        copy.outOfStockCopy(language, toFacts(focus), alternative ? toFacts(alternative) : null),
      );
    }

    next.stage = "awaiting_details";
    return turn("ask-details", copy.askDetailsCopy(language, focus ? toFacts(focus) : null, zones));
  }

  // -------------------------------------------------------- policy answers
  const isPrice = signals.priceWord || (signals.howMuch && !signals.delivery);

  // "is it original? how much?" about a named product is a price question —
  // the offer already says it is authentic and cash on delivery
  if (!(isPrice && named)) {
    if (signals.delivery) return turn("delivery", copy.deliveryCopy(language, zones));
    if (signals.payment) return turn("payment", copy.paymentCopy(language));
    if (signals.authenticity) return turn("authenticity", copy.authenticityCopy(language));
    if (signals.returns) {
      return turn("returns", copy.returnsCopy(language, shopUrl("/returns")));
    }
  }

  // ------------------------------------------------- scripts 1 and 2: price
  const offer = (item: ChatCatalogItem) => {
    if (!item.inStock) {
      const alternative = inStockAlternative(catalog, item);
      return turn(
        "out-of-stock",
        copy.outOfStockCopy(language, toFacts(item), alternative ? toFacts(alternative) : null),
      );
    }

    next.stage = "offered";
    next.qualified = true;
    return turn("offer", copy.offerCopy(language, toFacts(item), zones));
  };

  const qualify = (item: ChatCatalogItem) => {
    next.stage = "qualifying";
    return turn(
      "qualify",
      copy.qualifyCopy(language, name, toFacts(item), {
        greet: firstReply,
        knowsSkinType: slots.skinType !== null,
      }),
    );
  };

  // A customer who already said who it is for, or their skin type, has
  // answered script 1 before it was asked.
  const alreadyQualified =
    state.qualified || signals.qualifier || (recognized && slots.skinType !== null);

  if (isPrice) {
    if (!focus) return turn("pick-product", copy.pickProductCopy(language));

    next.priceAsks += 1;

    // Script 1 is asked once. Asking the price twice gets the price —
    // dodging a second time reads as hiding it.
    if (next.priceAsks === 1 && !alreadyQualified && focus.inStock) return qualify(focus);
    return offer(focus);
  }

  // whatever the answer to script 1's question, the next step is the offer
  if (state.stage === "qualifying" && focus && !named) return offer(focus);

  // a product link or name on its own — the website button's prefilled
  // "I have a question about this product" — is interest: start script 1
  if (named) {
    return alreadyQualified || !named.inStock ? offer(named) : qualify(named);
  }

  // --------------------------------------------- everything else: the advisor
  if (signals.thanks) return turn("thanks", copy.thanksCopy(language));

  const response = runChatTurn({ message, slots: state.slots }, catalog, policy);
  next.slots = response.slots;

  if (response.products.length > 0) {
    const top = response.products.slice(0, 3);
    next.focusSlug = top[0].slug;
    next.priceAsks = 0;
    next.stage = "idle";
    // they described their skin, which is what script 1 would have asked
    next.qualified = true;

    return turn(
      "recommend",
      copy.recommendCopy(
        language,
        top.map((item) => ({ name: item.name, price: item.price, url: productUrl(item.slug) })),
      ),
    );
  }

  if (response.intent === "GREETING" || (signals.greeting && response.intent === "UNKNOWN")) {
    return turn("greet", copy.greetCopy(language, name));
  }

  if (response.intent === "UNKNOWN" && !recognized) {
    next.misses = state.misses + 1;

    // Two misses in a row: a person reads it rather than a third "sorry?".
    if (next.misses >= 2) {
      next.misses = 0;
      return handoff("human", copy.humanCopy(language, name), "unclear", message);
    }

    return turn("fallback", copy.fallbackCopy(language));
  }

  // The advisor's own follow-up question ("what's your skin type?") is
  // already a question; an answer gets one added.
  if (response.needsMoreInfo) return turn("answer", response.message);

  const link = response.links[0]?.href;
  return turn("answer", copy.answerCopy(language, response.message, link ? shopUrl(link) : null));
}
