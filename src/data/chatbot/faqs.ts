import type { ChatLink, Intent } from "@/lib/chatbot/types";

/**
 * The advisor's answer book.
 *
 * Answers are written once, here, and never re-typed in the UI. Anything that
 * can change — delivery charges, delivery windows, free-shipping thresholds —
 * is a `{{placeholder}}` filled at reply time from the same DeliveryZone rows
 * checkout charges from (see server/queries/chatbot.ts). That is what stops
 * the bot quoting a rate the cart disagrees with.
 *
 * `keywords` score higher than `questions`, because a shopper types "delivery
 * charge" far more often than a full sentence.
 */
export type FaqDoc = {
  id: string;
  intent: Intent;
  questions: string[];
  keywords: string[];
  answer: string;
  links?: ChatLink[];
};

export const FAQS: FaqDoc[] = [
  {
    id: "delivery-charge",
    intent: "FAQ_SHIPPING",
    questions: [
      "how much is delivery",
      "what is the delivery charge",
      "how much for shipping",
      "delivery cost",
    ],
    keywords: [
      "delivery charge",
      "shipping charge",
      "delivery cost",
      "shipping cost",
      "delivery fee",
      "courier charge",
      "how much delivery",
    ],
    answer: "{{deliveryRates}}",
    links: [{ label: "Shipping & delivery", href: "/shipping" }],
  },
  {
    id: "delivery-time",
    intent: "FAQ_SHIPPING",
    questions: [
      "how long does delivery take",
      "when will i get my order",
      "how many days for delivery",
      "delivery time",
    ],
    keywords: [
      "how long",
      "how many days",
      "delivery time",
      "when will i receive",
      "when will i get",
      "how fast",
      "same day",
    ],
    answer: "{{deliveryTimes}} We ship nationwide across Bangladesh.",
    links: [{ label: "Shipping & delivery", href: "/shipping" }],
  },
  {
    id: "free-delivery",
    intent: "FAQ_SHIPPING",
    questions: ["is delivery free", "do you offer free shipping"],
    keywords: ["free delivery", "free shipping", "delivery free"],
    answer: "{{freeShipping}}",
    links: [{ label: "Shipping & delivery", href: "/shipping" }],
  },
  {
    id: "payment-method",
    intent: "FAQ_PAYMENT",
    questions: [
      "how do i pay",
      "what payment methods do you accept",
      "can i pay by card",
      "do you take bkash",
    ],
    keywords: [
      "payment",
      "pay",
      "cash on delivery",
      "cod",
      "bkash",
      "nagad",
      "card",
      "advance payment",
    ],
    answer:
      "Cash on delivery. You pay the courier when your parcel reaches you, so nothing leaves your pocket before the products arrive. No advance payment and no card details are needed.",
  },
  {
    id: "ordering",
    intent: "FAQ_ORDERING",
    questions: [
      "do i need an account",
      "how do i place an order",
      "can i order without signing up",
    ],
    keywords: ["account", "sign up", "register", "login", "place an order", "how to order"],
    answer:
      "No account needed. Korean Hive is guest checkout by default — add what you want to the cart, then give your name, phone number and delivery address at checkout.",
    links: [{ label: "Shop all products", href: "/shop" }],
  },
  {
    id: "returns",
    intent: "FAQ_RETURNS",
    questions: [
      "what is your return policy",
      "can i return a product",
      "how do refunds work",
      "the product arrived damaged",
    ],
    keywords: ["return", "returns", "refund", "exchange", "damaged", "wrong product", "broken"],
    answer:
      "If something arrives damaged, wrong or sealed-but-faulty, contact us with your order number and a photo and we will sort out a replacement or refund. Full terms are on the returns page.",
    links: [{ label: "Returns & refunds", href: "/returns" }],
  },
  {
    id: "authenticity",
    intent: "FAQ_AUTHENTICITY",
    questions: [
      "are your products authentic",
      "is this original",
      "do you sell fake products",
    ],
    keywords: ["authentic", "original", "genuine", "fake", "replica", "real product"],
    answer:
      "Yes. Every product is sourced directly from Korea. We do not sell replicas or grey-market stock.",
    links: [{ label: "About Korean Hive", href: "/about" }],
  },
  {
    id: "track-order",
    intent: "ORDER_HELP",
    questions: [
      "where is my order",
      "how do i track my order",
      "what is my order status",
    ],
    keywords: ["track", "tracking", "my order", "order status", "where is my parcel"],
    answer:
      "You can check it yourself on the Track Order page — enter your order number and the phone number you used at checkout. No login needed. I do not have access to order records here, so please use that page rather than sharing your details in chat.",
    links: [{ label: "Track your order", href: "/track" }],
  },
  {
    id: "contact",
    intent: "FAQ_ORDERING",
    questions: ["how do i contact you", "can i talk to a human", "customer support number"],
    keywords: ["contact", "phone number", "email you", "customer service", "talk to someone", "human"],
    answer:
      "Our contact page has the ways to reach a person on the team, and they can help with anything I cannot.",
    links: [{ label: "Contact us", href: "/contact" }],
  },
  {
    id: "coupon",
    intent: "FAQ_ORDERING",
    questions: ["do you have a discount code", "how do i use a coupon"],
    keywords: ["coupon", "promo code", "discount code", "voucher", "offer"],
    answer:
      "If you have a coupon code, enter it in the cart before checkout and the discount is applied to your subtotal. Current offers are on the deals page.",
    links: [{ label: "Deals", href: "/deals" }],
  },
];
