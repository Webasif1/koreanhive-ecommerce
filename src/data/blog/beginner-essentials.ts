import type { Post } from "./types";

const IMAGES = "/blog/korean-skincare-essentials-for-beginners";

export const beginnerEssentials: Post = {
  slug: "korean-skincare-essentials-for-beginners",
  category: "Beginner",
  title: "Beginner দের জন্য Korean Skincare এর ৫টি Essential Product",
  readingMinutes: 5,
  publishedAt: "2026-09-09",
  description:
    "Korean skincare শুরু করতে চান কিন্তু কোথা থেকে শুরু করবেন বুঝছেন না? এই ৫টি essential product দিয়ে শুরু করুন। Simple, effective, budget friendly।",
  keywords: [
    "korean skincare essentials for beginners",
    "k-beauty starter products bangladesh",
    "korean skincare শুরু করতে কি কি লাগবে",
    "beginner korean skincare kit bd",
  ],
  cover: `${IMAGES}/feature.webp`,
  coverAlt: "Beginner — 5 Essential Products to Start Korean Skincare",
  body: [
    {
      kind: "paragraph",
      text: "আপনি Korean skincare শুরু করতে চান। Instagram এ glass skin দেখেছেন, TikTok এ Korean girls এর routine দেখেছেন, মনে হয়েছে “আমিও এরকম skin চাই!” তারপর Google করেছেন, আর দেখেছেন 10 step routine, 20 রকম serum, 15 ধরনের toner। আর ভয় পেয়ে close করে দিয়েছেন।",
    },
    {
      kind: "paragraph",
      text: "আমি আপনাকে বুঝি। সত্যি বলতে, আমিও প্রথমদিকে এরকমই confused ছিলাম!",
    },
    {
      kind: "paragraph",
      text: "তো আজ আমি আপনার life simple করে দিচ্ছি। আপনাকে 10টা product দিয়ে শুরু করতে হবে না। দরকার মাত্র 5টা। হ্যাঁ, মাত্র 5টা essential product দিয়ে একটা complete, effective routine তৈরি হয়ে যায়। বাকি সব পরে ধীরে ধীরে add করবেন, need অনুযায়ী।",
    },

    { kind: "heading", text: "কেন মাত্র 5টা? 10 Step Routine এর দরকার নেই?" },
    {
      kind: "image",
      src: `${IMAGES}/why-five.webp`,
      alt: "Keep it simple — Why Just 5 Products? Simple, effective, budget friendly, no confusion",
    },
    {
      kind: "paragraph",
      text: "Internet এ “10 step Korean skincare routine” বলে যেটা viral, সেটা আসলে একটা marketing concept ছিল। হ্যাঁ, marketing! Real life এ Korean মেয়েরা daily 10টা product ব্যবহার করেন না। তারা mostly 3 থেকে 5টা product ব্যবহার করেন।",
    },
    {
      kind: "paragraph",
      text: "শুরুতে 5টা product রাখার অনেক সুবিধা আছে। কম product মানে skin কে overwhelm করবেন না। কোন product কি করছে সেটা clearly বুঝতে পারবেন। কোনো product react করলে easily identify করতে পারবেন কোনটা সমস্যা করছে। আর সবচেয়ে important, budget friendly! একসাথে 20টা product কেনার দরকার নেই।",
    },
    {
      kind: "paragraph",
      text: "পরে ধীরে ধীরে আপনার routine তে serum, essence, mask যোগ করতে পারবেন। কিন্তু foundation হলো এই 5টা।",
    },

    { kind: "heading", text: "Essential 1: Gentle Cleanser" },
    {
      kind: "image",
      src: `${IMAGES}/cleanser.webp`,
      alt: "Product 1 — Essential 1: Gentle Cleanser. COSRX Low pH Good Morning Gel Cleanser",
    },
    {
      kind: "paragraph",
      text: "Cleanser হলো আপনার পুরো routine এর foundation। যদি foundation ই ভুল হয়, তাহলে উপরে যাই দেন না কেন, result আসবে না।",
    },
    { kind: "subheading", text: "কেন Gentle Cleanser?" },
    {
      kind: "paragraph",
      text: "Harsh cleansers (soap, strong foaming face wash) skin এর natural moisture barrier নষ্ট করে দেয়। ফলে skin dry হয়, irritated হয়, আর paradoxically আরো বেশি oil produce করতে থাকে। কারণ skin মনে করে সে dehydrated, তাই over compensate করে। Gentle, low pH cleanser effectively পরিষ্কার করে কিন্তু skin এর natural balance ঠিক রাখে।",
    },
    { kind: "subheading", text: "Beginner এর জন্য Best Pick" },
    {
      kind: "pick",
      picks: [
        {
          product: "COSRX Low pH Good Morning Gel Cleanser",
          slug: "cosrx-low-ph-good-morning-gel-cleanser-150ml",
          note: "Tea tree oil আছে (mild antibacterial), pH 5.0 থেকে 6.0 (skin friendly), gentle foam, সব skin type এ কাজ করে। এটা Korean skincare এর gateway product। বেশিরভাগ মানুষ এটা দিয়েই K beauty journey শুরু করেন!",
        },
      ],
    },
    {
      kind: "note",
      label: "কিভাবে ব্যবহার করবেন",
      text: "সকালে আর রাতে। ভেজা মুখে অল্প পরিমাণ নিয়ে আলতো করে circular motion এ massage করুন 30 থেকে 60 সেকেন্ড। Lukewarm পানি দিয়ে ধুয়ে ফেলুন। তোয়ালে দিয়ে ঘষবেন না, আলতো করে চেপে চেপে মুছুন।",
    },

    { kind: "heading", text: "Essential 2: Hydrating Toner" },
    {
      kind: "image",
      src: `${IMAGES}/toner.webp`,
      alt: "Product 2 — Essential 2: Hydrating Toner. Anua Heartleaf 77% Soothing Toner",
    },
    {
      kind: "paragraph",
      text: "“Toner? সেই জ্বালাপোড়া করা জিনিস?” একদম না! ওটা ভুলে যান। Korean toner সম্পূর্ণ different জিনিস।",
    },
    { kind: "subheading", text: "Korean Toner আসলে কি করে?" },
    {
      kind: "paragraph",
      text: "Hydration এর প্রথম layer দেয়, skin কে “তৃষ্ণার্ত” অবস্থা থেকে বের করে। পরের products absorb হতে সাহায্য করে, skin কে sponge এর মতো ready করে তোলে। আর cleansing এর পরে skin এর pH balance restore করে।",
    },
    { kind: "subheading", text: "Beginner এর জন্য Best Pick" },
    {
      kind: "pick",
      picks: [
        {
          product: "Anua Heartleaf 77% Soothing Toner",
          slug: "anua-heartleaf-77-percent-soothing-toner-500ml",
          note: "Heartleaf extract, calming, anti inflammatory। সব skin type এ safe, sensitive skin সহ। Lightweight, watery texture। Bangladesh এর humidity তে perfect। Redness কমায়, pores soothe করে।",
        },
      ],
    },
    {
      kind: "note",
      label: "কিভাবে ব্যবহার করবেন",
      text: "Cleansing এর ঠিক পরে, skin এখনো slightly damp থাকা অবস্থায়। হাতের তালুতে অল্প পরিমাণ নিন, দুই হাতে ছড়িয়ে নিন, তারপর মুখে আলতো করে press করুন। ঘষবেন না, press করুন, patting method বলে। 30 সেকেন্ড absorb হতে দিন, তারপর next step।",
    },

    { kind: "heading", text: "Essential 3: All in One Serum" },
    {
      kind: "image",
      src: `${IMAGES}/serum.webp`,
      alt: "Product 3 — Essential 3: Snail Mucin Essence. COSRX Advanced Snail 96 Mucin Power Essence",
    },
    {
      kind: "paragraph",
      text: "Serum হলো routine এর সবচেয়ে “active” product। মানে এটাই actual results deliver করে। কিন্তু beginner হিসেবে আপনাকে 5টা serum কেনার দরকার নেই! একটা versatile, all rounder serum enough।",
    },
    { kind: "subheading", text: "Beginner এর জন্য Best Pick" },
    {
      kind: "pick",
      picks: [
        {
          product: "COSRX Advanced Snail 96 Mucin Power Essence",
          slug: "cosrx-advanced-snail-96-mucin-power-essence-100ml",
          note: "আমি জানি, “snail mucin” শুনে আপনার ভ্রু উঠে গেছে। শামুকের কিছু মুখে দেব? কিন্তু বিশ্বাস করুন, এটা Korean skincare এর single most recommended product worldwide। Millions of people এটা ব্যবহার করেন আর ভালোবাসেন।",
        },
      ],
    },
    {
      kind: "paragraph",
      text: "এটা কি করে? Intense hydration দেয়, damaged skin repair করে, acne scars আর dark spots fade করতে সাহায্য করে, skin texture smooth করে, fine lines reduce করে। সব skin type এ কাজ করে। Oily, dry, sensitive, combination। কোনো irritation করে না। মানে একটা product এ আপনি এত কিছু পাচ্ছেন!",
    },
    {
      kind: "note",
      label: "কিভাবে ব্যবহার করবেন",
      text: "Toner এর পরে। 2 থেকে 3 drops হাতের তালুতে নিন। মুখে আর ঘাড়ে আলতো করে press করে apply করুন। সকালে আর রাতে দুইবেলাই ব্যবহার করা যায়।",
    },

    { kind: "heading", text: "Essential 4: Lightweight Moisturizer" },
    {
      kind: "image",
      src: `${IMAGES}/moisturizer.webp`,
      alt: "Product 4 — Essential 4: Lightweight Moisturizer. iUNIK Beta Glucan Daily Moisture Cream",
    },
    {
      kind: "paragraph",
      text: "Moisturizer আপনার routine এর সব কিছু seal করে। মানে toner আর serum এর hydration কে lock করে রাখে, যাতে সারাদিন বা সারারাত কাজ করতে থাকে। এটা ছাড়া আপনার toner আর serum আস্তে আস্তে evaporate হয়ে যাবে।",
    },
    { kind: "subheading", text: "Beginner দের Common ভুল" },
    {
      kind: "paragraph",
      text: "“আমার skin oily, moisturizer লাগবে না” please please please এই myth টা মাথা থেকে বের করুন! Oily skin এও moisturizer দরকার। Oily মানে hydrated না। Skin oily হতে পারে কিন্তু ভেতরে dehydrated থাকতে পারে। Moisturizer skip করলে skin আরো বেশি oil produce করে compensate করতে। Vicious cycle!",
    },
    { kind: "subheading", text: "Beginner এর জন্য Best Pick" },
    {
      kind: "pick",
      picks: [
        {
          product: "iUNIK Beta Glucan Daily Moisture Cream",
          note: "Beta Glucan, mushroom থেকে আসা ingredient যেটা Hyaluronic Acid এর চেয়েও বেশি hydrating! Lightweight gel cream texture। Bangladesh এর humidity তে comfortable। Non comedogenic, pores বন্ধ করে না। Soothing, sensitive skin এও safe।",
        },
      ],
    },
    {
      kind: "note",
      label: "কিভাবে ব্যবহার করবেন",
      text: "Serum absorb হওয়ার পরে। মটর দানার সমান পরিমাণ নিন, বেশি লাগবে না। পুরো মুখে আর ঘাড়ে আলতো করে massage করুন। সকালে lighter amount, রাতে একটু বেশি।",
    },

    { kind: "heading", text: "Essential 5: Sunscreen SPF 50+" },
    {
      kind: "image",
      src: `${IMAGES}/sunscreen.webp`,
      alt: "Product 5 — Essential 5: Sunscreen SPF 50+. Beauty of Joseon Relief Sun Rice + Probiotics",
    },
    {
      kind: "paragraph",
      text: "এটা বলতে গিয়ে আমি একটু emotional হয়ে যাই। কারণ এটা একটা product যেটা most people skip করেন, অথচ এটা literally সবচেয়ে important product আপনার পুরো routine এ।",
    },
    { kind: "subheading", text: "কেন এত Important?" },
    {
      kind: "paragraph",
      text: "UV damage হলো skin aging এর 90 percent এর কারণ। হ্যাঁ, 90 percent! Genetics না, pollution না, UV rays। Dark spots, acne marks, uneven skin tone সব worse হয় sun exposure এ। Sunscreen ছাড়া আপনার বাকি 4টা product এর কাজ অর্ধেকের বেশি বৃথা যায়। বাংলাদেশে UV index সারাবছর moderate to high। শুধু গরমকালে না।",
    },
    { kind: "subheading", text: "Beginner এর জন্য Best Pick" },
    {
      kind: "pick",
      picks: [
        {
          product: "Beauty of Joseon Relief Sun Aqua-Fresh (Rice + B5) SPF50+ PA++++",
          slug: "beauty-of-joseon-relief-sun-aqua-fresh-rice-plus-b5-spf50-pa-50ml",
          note: "No white cast, সব skin tone এ invisible। Lightweight, non greasy। Humidity তে comfortable। Rice extract, brightening effect দেয়। Vitamin B5, skin barrier strengthen করে। Matte finish, oily skin friendly। এটা globally cult favorite sunscreen আর বাংলাদেশের climate এর জন্য যেন specially তৈরি করা!",
        },
      ],
    },
    {
      kind: "note",
      label: "কিভাবে ব্যবহার করবেন",
      text: "Morning routine এর last step। 2 finger lengths পরিমাণ নিন (index আর middle finger এ লম্বা করে squeeze করুন, এটাই right amount)। পুরো মুখে, ঘাড়ে, আর কানে apply করুন। Makeup এর আগে লাগান, 2 মিনিট absorb হতে দিন তারপর makeup। 2 থেকে 3 ঘণ্টা পর পর reapply করুন বাইরে থাকলে।",
    },

    { kind: "heading", text: "আপনার Complete Beginner Routine" },
    {
      kind: "image",
      src: `${IMAGES}/routine-summary.webp`,
      alt: "Quick look — Your Complete Beginner Routine. AM: 5 steps, 5 min. PM: 4 steps, 4 min",
    },
    {
      kind: "list",
      items: [
        {
          term: "সকাল (5 মিনিট)",
          text: "Cleanser → Toner → Snail Mucin Essence → Moisturizer → Sunscreen",
        },
        {
          term: "রাত (4 মিনিট)",
          text: "Cleanser → Toner → Snail Mucin Essence → Moisturizer",
        },
      ],
    },
    {
      kind: "paragraph",
      text: "ব্যস! এটুকুই! Simple, effective, no confusion।",
    },

    { kind: "heading", text: "Budget কত লাগবে?" },
    {
      kind: "image",
      src: `${IMAGES}/budget.webp`,
      alt: "Affordable — Budget Breakdown: 3,500 to 5,000 BDT, 2-3 months per product, best value",
    },
    {
      kind: "paragraph",
      text: "আমি জানি এটা important question। সত্যি বলতে, এই 5টা product মিলিয়ে approximately 3,500 থেকে 5,000 টাকা investment। আর প্রতিটা product 2 থেকে 3 মাস চলে। মানে monthly cost 1,200 থেকে 1,800 টাকার মতো।",
    },
    {
      kind: "paragraph",
      text: "এখন ভাবুন। একটা “ভালো” face wash আর moisturizer কিনলেও এর কাছাকাছি খরচ হয়। কিন্তু Korean products এ আপনি science backed, targeted, proven results পাচ্ছেন। Value for money এর দিক থেকে এটা excellent deal।",
    },

    { kind: "heading", text: "শেষ কথা" },
    {
      kind: "paragraph",
      text: "Korean skincare complicated হতে হবে এমন কোনো কথা নেই। এই 5টা essential product দিয়ে শুরু করুন, 4 থেকে 8 সপ্তাহ consistently follow করুন। আপনি নিজেই difference দেখবেন। আমি promise করছি।",
    },
    {
      kind: "paragraph",
      text: "পরে ধীরে ধীরে routine তে exfoliant, eye cream, sleeping mask যোগ করতে পারবেন। কিন্তু foundation এই 5টা। আর এগুলো ঠিক থাকলে বাকি সব bonus।",
    },
    {
      kind: "paragraph",
      text: "কোন product আপনার skin type এর জন্য best সেটা নিয়ে confused? একদম normal, আমরা সবাই প্রথমে confused থাকি! আমাদের WhatsApp community তে join করুন। Korean Hive এর skincare experts আপনাকে personally guide করবেন, সম্পূর্ণ FREE। একটা message দিলেই হবে।",
    },
    {
      kind: "paragraph",
      text: "সব authentic Korean skincare products পাবেন koreanhive.com এ। 100% original, direct from Korea। Happy skincare journey!",
    },
  ],
};
