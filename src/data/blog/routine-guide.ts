import type { Post } from "./types";

const IMAGES = "/blog/korean-skincare-routine-bangladesh-weather";

export const routineGuide: Post = {
  slug: "korean-skincare-routine-bangladesh-weather",
  category: "Routine Guide",
  title: "বাংলাদেশের আবহাওয়ায় Korean Skincare Routine কীভাবে করবেন?",
  readingMinutes: 7,
  publishedAt: "2026-09-09",
  description:
    "বাংলাদেশের গরম ও আর্দ্র আবহাওয়ায় Korean skincare routine কীভাবে করবেন? Morning ও night routine, product suggestions, এবং climate proof skincare tips — সব এক জায়গায়।",
  keywords: [
    "korean skincare routine bangladesh",
    "korean skincare routine for humid weather",
    "k-beauty routine dhaka",
    "korean skincare bd",
    "বাংলাদেশে কোরিয়ান স্কিনকেয়ার",
  ],
  cover: `${IMAGES}/feature.webp`,
  coverAlt:
    "Routine Guide — Korean Skincare Routine for Bangladesh Climate",
  body: [
    {
      kind: "paragraph",
      text: "Korean skincare নিয়ে তো আমরা সবাই শুনেছি। Glass skin, honey skin, আর সেই বিখ্যাত Korean glow। কিন্তু সত্যি বলতে, আমাদের মনে একটা প্রশ্ন ঘুরপাক খায়: “ভাই, বাংলাদেশের এই গরমে এসব কি আসলেই কাজ করে?”",
    },
    {
      kind: "paragraph",
      text: "আমি বুঝি আপনার সন্দেহটা কোথায়। Korea তে শীতের দেশ, dry weather। আর আমাদের এখানে? সারাবছর ঘাম, humidity তে চুল মুখে লেগে থাকে, আর pollution এর কথা না হয় বাদই দিলাম। তো Korea র routine কি আমাদের এখানে same ভাবে কাজ করবে?",
    },
    {
      kind: "paragraph",
      text: "উত্তর হলো: হ্যাঁ! কিন্তু একটু বুদ্ধি করে। মানে Korean skincare এর philosophy টা follow করবেন, কিন্তু products গুলো বাংলাদেশের climate অনুযায়ী choose করবেন। আর সেটাই আজ আমি আপনাকে দেখাবো।",
    },

    { kind: "heading", text: "আমাদের আবহাওয়া আর Skin এর ঝামেলাটা কোথায়?" },
    {
      kind: "paragraph",
      text: "একটু বুঝে নেওয়া যাক আগে। বাংলাদেশে average humidity 70 থেকে 85 percent। গরমকালে temperature 35 degree plus। আর ঢাকার air quality index এর কথা তো জানেনই। এই তিনটা মিলে আপনার skin এ কি হয় জানেন?",
    },
    {
      kind: "paragraph",
      text: "প্রথমত, skin অতিরিক্ত oil produce করতে থাকে। দ্বিতীয়ত, ঘাম আর pollution মিলে pores বন্ধ হয়ে যায়। তৃতীয়ত, heavy cream বা lotion লাগালে মনে হয় মুখে তেলের আস্তরণ বসে আছে। আর চতুর্থত, সারাবছর UV rays তো আছেই, মেঘলা দিনেও।",
    },
    {
      kind: "paragraph",
      text: "তো solution কি? Lightweight products। যেগুলো skin কে breathe করতে দেয় কিন্তু effectively কাজও করে। আর এটাই Korean skincare এর beauty। তাদের formulations naturally lightweight আর layerable।",
    },

    { kind: "heading", text: "Morning Routine: ৫টি Step, মাত্র ৫ মিনিট" },
    {
      kind: "image",
      src: `${IMAGES}/morning-routine.webp`,
      alt: "Step by step — Morning Routine: 5 Steps, 5 Minutes, Maximum Protection",
    },
    {
      kind: "paragraph",
      text: "সকালের routine টা simple রাখুন। Goal হলো clean, hydrate, protect। ব্যস।",
    },

    { kind: "subheading", text: "Step 1: Gentle Low pH Cleanser" },
    {
      kind: "image",
      src: `${IMAGES}/cleanser.webp`,
      alt: "Cleansing — Step 1: Gentle Cleanser. Low pH, skin friendly, foundation of your routine",
    },
    {
      kind: "paragraph",
      text: "সকালে উঠে প্রথম কাজ মুখ ধোয়া। কিন্তু এখানেই বেশিরভাগ মানুষ ভুল করেন। সাবান বা harsh face wash দিয়ে এমনভাবে ঘষেন যেন মুখের চামড়া তুলে ফেলবেন!",
    },
    {
      kind: "paragraph",
      text: "এটা করবেন না please। আপনার skin এর natural pH 5.5। Harsh cleanser সেটা নষ্ট করে দেয়। ফলে skin dry হয়, irritated হয়, আর মজার ব্যাপার হলো আরো বেশি oil produce করতে থাকে। মানে আপনি oil কমাতে গিয়ে আরো বাড়াচ্ছেন!",
    },
    {
      kind: "paragraph",
      text: "Solution হলো gentle, low pH cleanser। এটা effectively পরিষ্কার করবে কিন্তু skin এর natural balance নষ্ট করবে না।",
    },
    {
      kind: "pick",
      picks: [
        {
          product: "COSRX Low pH Good Morning Gel Cleanser",
          note: "Tea tree আছে, gentle, সব skin type এ কাজ করে।",
        },
      ],
    },
    {
      kind: "note",
      label: "ছোট্ট tip",
      text: "Lukewarm পানি ব্যবহার করুন। গরম পানি skin কে dry করে ফেলে।",
    },

    { kind: "subheading", text: "Step 2: Hydrating Toner" },
    {
      kind: "paragraph",
      text: "“Toner কি আবার? সেই জ্বালাপোড়া করা toner?” না না! Korean toner আর আমাদের দেশে চেনা সেই alcohol ভরা astringent, দুইটা সম্পূর্ণ আলাদা জিনিস।",
    },
    {
      kind: "paragraph",
      text: "Korean toner হলো basically একটা hydration layer। এটা আপনার skin কে ভেতর থেকে hydrate করে আর পরে যে serum বা moisturizer দেবেন সেটা আরো ভালোভাবে absorb হতে সাহায্য করে। মানে এটা আপনার skin কে sponge এর মতো ready করে তোলে।",
    },
    {
      kind: "pick",
      picks: [
        {
          product: "Anua Heartleaf 77% Soothing Toner",
          note: "Lightweight, calming, সব skin type এ safe।",
        },
      ],
    },
    {
      kind: "note",
      label: "কিভাবে লাগাবেন",
      text: "হাতের তালুতে নিন, দুই হাতে ছড়িয়ে নিন, তারপর মুখে আলতো করে press করুন। ঘষবেন না, press করুন।",
    },

    { kind: "subheading", text: "Step 3: Targeted Serum" },
    {
      kind: "paragraph",
      text: "Serum হলো আপনার routine এর hero product। বাকি সব cleansing আর prep করে, কিন্তু actual result দেয় serum। আপনার skin এ যেটা problem, সেটা অনুযায়ী serum choose করুন।",
    },
    {
      kind: "list",
      items: [
        {
          term: "Acne বা breakouts?",
          text: "Niacinamide serum নিন, oil control করবে, pores ছোট করবে।",
        },
        {
          term: "Dark spots বা uneven tone?",
          text: "Vitamin C serum নিন, brightening দেবে।",
        },
        {
          term: "Sensitive বা irritated skin?",
          text: "Centella serum নিন, skin calm করবে।",
        },
        {
          term: "Dehydrated?",
          text: "Hyaluronic Acid serum নিন, moisture boost দেবে।",
        },
      ],
    },
    {
      kind: "note",
      label: "গরমের জন্য important কথা",
      text: "Gel based বা watery serum ব্যবহার করুন। Thick, oily serum avoid করুন। Humidity তে আরো ভারী লাগবে।",
    },

    { kind: "subheading", text: "Step 4: Lightweight Moisturizer" },
    {
      kind: "paragraph",
      text: "এটা শুনে অনেকে বলবেন, “ভাই, এই গরমে আবার moisturizer? মুখে তো এমনিতেই তেল ভাসে!”",
    },
    {
      kind: "paragraph",
      text: "আমি জানি, শুনতে উল্টো লাগে। কিন্তু এটাই সবচেয়ে বড় mistake যেটা আমরা করি। আপনার skin oily মানে কিন্তু hydrated না। Oily আর hydrated দুইটা আলাদা জিনিস। Moisturizer skip করলে কি হয়? Skin মনে করে সে dehydrated, তাই আরো বেশি oil produce করে compensate করতে। Result? আরো বেশি teltele skin!",
    },
    {
      kind: "paragraph",
      text: "তো trick হলো heavy cream এর বদলে gel moisturizer ব্যবহার করুন। Gel moisturizer hydrate করে কিন্তু sticky বা heavy feel দেয় না।",
    },
    {
      kind: "pick",
      picks: [
        {
          product: "iUNIK Beta Glucan Daily Moisture Cream",
          note: "Lightweight, non sticky, সব season এ comfortable।",
        },
      ],
    },

    { kind: "subheading", text: "Step 5: Sunscreen SPF 50+" },
    {
      kind: "image",
      src: `${IMAGES}/sunscreen.webp`,
      alt: "UV protection — Sunscreen SPF 50+. No white cast, humidity proof, non negotiable",
    },
    {
      kind: "paragraph",
      text: "আমি একটু boldly বলি। আপনি যদি সারা routine এর মধ্যে শুধু একটাই product ব্যবহার করেন, সেটা যেন sunscreen হয়। সত্যি বলছি।",
    },
    {
      kind: "paragraph",
      text: "বাংলাদেশে UV index সারাবছর high। মেঘলা দিনেও UV rays আপনার skin এ এসে পৌঁছায়। Sunscreen না লাগালে কি হয়? আপনার serum, moisturizer যতই expensive হোক, তাদের কাজ অর্ধেকের বেশি নষ্ট হয়ে যায়। Dark spots আরো কালো হয়। Acne marks fade হয় না। Premature aging হয়।",
    },
    {
      kind: "paragraph",
      text: "আর Korean sunscreen কেন best? কারণ no white cast! আমাদের skin tone এ local sunscreen লাগালে যে সাদা ছোপ পড়ে, Korean sunscreen এ সেটা হয় না। Plus lightweight, humidity proof, আর অনেকগুলোতে skincare ingredients ও mixed থাকে।",
    },
    {
      kind: "pick",
      picks: [
        {
          product: "Beauty of Joseon Relief Sun (Rice + Probiotics) SPF 50+",
          note: "No white cast, matte finish, oily skin friendly।",
        },
      ],
    },
    {
      kind: "note",
      label: "মনে রাখবেন",
      text: "2 থেকে 3 ঘণ্টা পর পর reapply করুন, especially বাইরে থাকলে।",
    },

    { kind: "heading", text: "Night Routine: ৬টি Step" },
    {
      kind: "image",
      src: `${IMAGES}/night-routine.webp`,
      alt: "Night care — Night Routine: 6 Steps, repair and rejuvenate while you sleep",
    },
    {
      kind: "paragraph",
      text: "রাতের routine টা একটু detailed। কারণ রাতে আপনার skin repair mode এ যায়। সারাদিনের damage ঠিক করে, cells regenerate করে। তো রাতে ভালো products দিলে skin সেটা সবচেয়ে effectively ব্যবহার করতে পারে।",
    },

    { kind: "subheading", text: "Step 1: Oil Cleanser (First Cleanse)" },
    {
      kind: "image",
      src: `${IMAGES}/double-cleanse.webp`,
      alt: "K-beauty secret — Double Cleansing Method: oil cleanser + water cleanser = perfectly clean skin",
    },
    {
      kind: "paragraph",
      text: "এটা Korean skincare এর signature move, double cleansing। শুনতে ভারী মনে হচ্ছে? আসলে super simple।",
    },
    {
      kind: "paragraph",
      text: "প্রথমে oil cleanser দিয়ে makeup, sunscreen, আর সারাদিনের excess oil গলিয়ে ফেলুন। Science হলো oil dissolves oil। Water based cleanser alone sunscreen properly remove করতে পারে না। তাই আগে oil cleanser, তারপর water based cleanser।",
    },
    {
      kind: "note",
      label: "কিভাবে",
      text: "শুকনো মুখে oil cleanser massage করুন 1 মিনিট। তারপর ভেজা হাতে massage করুন, দেখবেন oil milky হয়ে যাচ্ছে। তারপর ধুয়ে ফেলুন।",
    },

    { kind: "subheading", text: "Step 2: Water Based Cleanser (Second Cleanse)" },
    {
      kind: "paragraph",
      text: "Oil cleanser এর পরে আপনার সকালের gentle cleanser দিয়ে আরেকবার ধুয়ে নিন। এটা remaining impurities, sweat, আর dirt পরিষ্কার করবে। দিনশেষে skin তখন একদম ফ্রেশ আর clean।",
    },

    { kind: "subheading", text: "Step 3: Exfoliation (সপ্তাহে 2 থেকে 3 বার)" },
    {
      kind: "paragraph",
      text: "প্রতিদিন exfoliation করার দরকার নেই, বরং করলে ক্ষতি হবে। Over exfoliation skin barrier damage করে, sensitivity বাড়ায়। সপ্তাহে 2 থেকে 3 বার একটা gentle chemical exfoliant ব্যবহার করুন। Physical scrub (ওই দানাদানা ওয়ালা scrub) avoid করুন। ওগুলো skin এ micro tears তৈরি করে।",
    },
    {
      kind: "list",
      items: [
        {
          term: "AHA (Glycolic বা Lactic Acid)",
          text: "surface level dead skin সরায়। Dull skin, uneven texture এর জন্য best।",
        },
        {
          term: "BHA (Salicylic Acid)",
          text: "pores এর ভেতরে গিয়ে clean করে। Oily skin, blackheads, acne এর জন্য best।",
        },
      ],
    },
    {
      kind: "pick",
      picks: [
        {
          product: "COSRX BHA Blackhead Power Liquid",
          note: "oily বা acne prone skin",
        },
        {
          product: "COSRX AHA 7 Whitehead Power Liquid",
          note: "dry বা dull skin",
        },
      ],
    },

    { kind: "subheading", text: "Step 4: Toner + Serum" },
    {
      kind: "paragraph",
      text: "সকালের মতোই। Toner দিয়ে skin prep করুন, তারপর targeted serum। রাতে আপনি stronger actives ব্যবহার করতে পারেন যেমন Retinol বা AHA/BHA (যদি সেদিন exfoliation না করে থাকেন)।",
    },

    { kind: "subheading", text: "Step 5: Eye Cream (Optional)" },
    {
      kind: "paragraph",
      text: "চোখের নিচের skin বাকি মুখের তুলনায় 10 গুণ পাতলা। বয়স 25 plus হলে একটা lightweight eye cream ব্যবহার করা ভালো। Dark circles আর fine lines prevent করতে সাহায্য করবে। কিন্তু beginner হলে এটা skip করতে পারেন, পরে add করলেও হবে।",
    },

    { kind: "subheading", text: "Step 6: Night Moisturizer বা Sleeping Mask" },
    {
      kind: "paragraph",
      text: "রাতে আপনি সকালের তুলনায় একটু richer moisturizer ব্যবহার করতে পারেন। Skin repair mode এ থাকে তো, তাই extra hydration কাজে আসে। আর সপ্তাহে 1 থেকে 2 রাত sleeping mask ব্যবহার করতে পারেন। Overnight intensive hydration দেবে, সকালে উঠে skin bouncy আর plump লাগবে।",
    },
    {
      kind: "pick",
      picks: [
        {
          product: "COSRX Ultimate Nourishing Rice Overnight Spa Mask",
          note: "সকালে উঠে skin literally glow করে!",
        },
      ],
    },

    { kind: "heading", text: "বাংলাদেশের আবহাওয়ায় ৫টি Golden Rules" },
    {
      kind: "image",
      src: `${IMAGES}/golden-rules.webp`,
      alt: "Must know — 5 Golden Rules: Bangladesh climate skincare essentials",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        {
          term: "Lightweight সবকিছু।",
          text: "Heavy creams, thick serums, oily products গরমে এগুলো avoid করুন। Gel, water based, আর lightweight formulations ই আপনার best friend।",
        },
        {
          term: "Sunscreen non negotiable।",
          text: "ঘরে থাকলেও, মেঘলা দিনেও। UV rays window glass ভেদ করে ঢোকে। No excuse, everyday sunscreen।",
        },
        {
          term: "Double cleanse every night।",
          text: "সারাদিনের pollution, sweat, sunscreen সব properly remove না করলে pores বন্ধ হবে, breakout হবে। এটা skip করার কোনো option নেই।",
        },
        {
          term: "একসাথে ১০টা নতুন product শুরু করবেন না।",
          text: "একটা একটা করে introduce করুন, 2 সপ্তাহ gap রেখে। কোনো product react করলে বুঝতে পারবেন কোনটা সমস্যা করছে।",
        },
        {
          term: "ধৈর্য রাখুন।",
          text: "Skincare overnight miracle না। Minimum 4 থেকে 8 সপ্তাহ consistently follow করুন, তারপর judge করুন। Trust the process!",
        },
      ],
    },

    { kind: "heading", text: "শেষ কথা" },
    {
      kind: "paragraph",
      text: "Korean skincare routine বাংলাদেশে absolutely কাজ করে। শুধু right products choose করতে হবে আমাদের climate বুঝে। Lightweight textures, proper sun protection, আর consistent routine এই তিনটাই আপনার healthy, glowing skin এর চাবিকাঠি।",
    },
    {
      kind: "paragraph",
      text: "আপনার skin type অনুযায়ী personalized routine বানাতে চাইলে আমাদের WhatsApp community তে join করুন। সেখানে Korean Hive এর skincare experts আপনাকে FREE guidance দেবেন। একা একা confused হয়ে থাকার দরকার নেই!",
    },
    {
      kind: "paragraph",
      text: "সব authentic Korean skincare products পাবেন koreanhive.com এ। 100% original, direct from Korea।",
    },
  ],
};
