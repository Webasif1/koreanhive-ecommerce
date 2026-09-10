import type { FaqItem } from "@/components/home/faq-accordion";

/**
 * The six Bangla questions come from the design, and they are the ones the
 * shop is actually asked — how to start, what order, what for acne. They lead
 * because a first-time buyer needs them before they need a delivery estimate.
 *
 * The five operational answers below them are kept rather than replaced. They
 * cost one collapsed row each in an accordion, they answer the questions that
 * decide a cash-on-delivery purchase, and they are the half of this list that
 * earns FAQ rich results for "korean skincare delivery bangladesh" and its
 * neighbours. Dropping them to match a mockup would have been paying for the
 * layout with the SEO.
 *
 * Bangla entries carry lang: "bn". Poppins ships no Bengali subset, so the
 * glyphs would otherwise fall through to whatever the device has.
 */
export const FAQS: FaqItem[] = [
  {
    lang: "bn",
    question: "Korean skincare কী?",
    answer:
      "সংক্ষেপে: ধাপে ধাপে হালকা লেয়ারিং করে ত্বকের বাধা (skin barrier) মজবুত করার একটি পদ্ধতি। ভারী ক্রিমের বদলে পাতলা টেক্সচারের কয়েকটি প্রোডাক্ট ব্যবহার করা হয় — cleanser, toner, serum, moisturiser এবং sunscreen।",
  },
  {
    lang: "bn",
    question: "Korean skincare routine কীভাবে শুরু করব?",
    answer:
      "চারটি প্রোডাক্ট দিয়ে শুরু করুন: cleanser, toner, একটি serum এবং sunscreen। ৩–৪ সপ্তাহ একটানা ব্যবহার করুন, তারপর প্রয়োজন হলে নতুন কিছু যোগ করুন।",
  },
  {
    lang: "bn",
    question: "Acne-prone skin-এর জন্য কী ব্যবহার করা উচিত?",
    answer:
      "Low-pH জেল ক্লিনজার, BHA বা salicylic acid টোনার, tea tree বা azelaic acid serum এবং তেলমুক্ত জেল ময়েশ্চারাইজার। একসাথে অনেক active একদিনে ব্যবহার করবেন না।",
  },
  {
    lang: "bn",
    question: "Sunscreen কখন ব্যবহার করতে হয়?",
    answer:
      "প্রতিদিন সকালে, রুটিনের একদম শেষ ধাপে — মেঘলা দিনেও। বাইরে থাকলে ৩–৪ ঘণ্টা পর আবার লাগান।",
  },
  {
    lang: "bn",
    question: "কোন product আগে ব্যবহার করতে হয়?",
    answer:
      "পাতলা থেকে ঘন — cleanser → toner → essence → serum → moisturiser → sunscreen। রাতে sunscreen বাদ।",
  },
  {
    lang: "bn",
    question: "প্রোডাক্ট আসল কিনা বুঝব কীভাবে?",
    answer:
      "প্রতিটি প্রোডাক্ট কোরিয়া থেকে সিল করা অবস্থায় আসে, গায়ে original batch code থাকে। খোলার আগে সিল আর batch code দেখে নিন — brand-এর নিজের সাইটে code মিলিয়েও দেখতে পারেন। আমরা replica বা grey-market স্টক বিক্রি করি না।",
  },
  {
    question: "Are your products authentic?",
    answer:
      "Yes. Everything is imported from Korea and arrives sealed with its original batch code. We do not sell replicas or grey-market stock.",
  },
  {
    question: "Do I need an account to order?",
    answer:
      "No. Korean Hive is guest checkout by default — your name, phone number and address are enough.",
  },
  {
    question: "How do I pay?",
    answer:
      "Cash on delivery. You pay the courier when the parcel reaches you, so nothing leaves your pocket before the products arrive.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Inside Dhaka is 1–2 working days. Outside Dhaka is 2–4 working days, to all 64 districts.",
  },
  {
    question: "Can I track my order without logging in?",
    answer:
      "Yes. Use your order number and the phone number you gave at checkout on the Track Order page.",
  },
];
