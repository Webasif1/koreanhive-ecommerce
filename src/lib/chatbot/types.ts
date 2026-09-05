import type {
  CategorySlug,
  Concern,
  SkinType,
  UseCase,
} from "@/data/chatbot/taxonomy";

/**
 * Contracts for the advisor.
 *
 * Nothing in lib/chatbot imports from @/server or mongoose — the engine is a
 * pure function of (input, catalog). The catalog is handed in by
 * server/queries/chatbot.ts, which is the only file in this feature that
 * talks to the database.
 */

export type Intent =
  | "GREETING"
  | "FAQ_SHIPPING"
  | "FAQ_PAYMENT"
  | "FAQ_RETURNS"
  | "FAQ_AUTHENTICITY"
  | "FAQ_ORDERING"
  | "PRODUCT_RECOMMENDATION"
  | "PRODUCT_INFORMATION"
  | "PRICE_QUERY"
  | "AVAILABILITY"
  | "ORDER_HELP"
  | "SAFETY_MEDICAL"
  | "SAFETY_CREDENTIALS"
  | "UNKNOWN";

/**
 * Exactly what the engine is allowed to see about a product.
 *
 * Note the omissions: no _id, no sku, no variants, no raw stock count. `stock`
 * is narrowed to a boolean on purpose — a public chat endpoint should not let
 * anyone poll inventory depth.
 */
export type ChatCatalogItem = {
  slug: string;
  name: string;
  brand: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  price: number;
  comparePrice: number | null;
  inStock: boolean;
  ratingAvg: number;
  ratingCount: number;
  imageUrl: string | null;
  /** shortDescription — the one-line claim shown under the product name. */
  benefit: string | null;
  /** Quoted verbatim when asked. Never interpreted. */
  ingredients: string | null;
  howToUse: string | null;
  /**
   * Concerns this product targets, imported from the sheet. Replaced a
   * hand-written editorial file keyed by slug, which the catalogue import
   * orphaned wholesale — 51 entries, none matching a live product, so every
   * concern-based weight silently scored zero.
   */
  concerns: Concern[];
};

/** Delivery and policy facts, read from the same tables checkout charges from. */
export type PolicyFacts = {
  zones: {
    name: string;
    charge: number;
    freeShippingThreshold: number | null;
    minDays: number;
    maxDays: number;
  }[];
};

/** What the advisor has learned so far this conversation. */
export type Slots = {
  concerns: Concern[];
  skinType: SkinType | null;
  useCases: UseCase[];
  category: CategorySlug | null;
  /** Whole BDT ceiling the shopper named. */
  budgetMax: number | null;
};

export const EMPTY_SLOTS: Slots = {
  concerns: [],
  skinType: null,
  useCases: [],
  category: null,
  budgetMax: null,
};

export type ChatProductCard = {
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  comparePrice: number | null;
  imageUrl: string | null;
  inStock: boolean;
  ratingAvg: number;
  ratingCount: number;
  /** Why this product, built only from slots that actually matched. */
  reason: string;
};

export type ChatLink = { label: string; href: string };

export type ChatTurnInput = {
  message: string;
  slots: Slots;
};

export type ChatResponse = {
  message: string;
  intent: Intent;
  products: ChatProductCard[];
  quickReplies: string[];
  links: ChatLink[];
  slots: Slots;
  /** True when the bot asked a question instead of answering. */
  needsMoreInfo: boolean;
};
