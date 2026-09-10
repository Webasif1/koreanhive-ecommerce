import type { Post } from "./types";

const IMAGES = "/blog/korean-skincare-routine-acne-prone-skin";

export const acneProneSkin: Post = {
  slug: "korean-skincare-routine-acne-prone-skin",
  category: "Skin Concern",
  title: "Acne Prone Skin এর জন্য Korean Skincare Routine",
  readingMinutes: 6,
  publishedAt: "2026-09-09",
  description:
    "Acne prone skin এর জন্য complete Korean skincare routine। কোন ingredients কাজ করে, কোনগুলো avoid করবেন, আর step by step guide বাংলাদেশের আবহাওয়া অনুযায়ী।",
  keywords: [
    "acne prone skin korean skincare",
    "korean skincare for acne bangladesh",
    "acne routine k-beauty",
    "ব্রণের জন্য কোরিয়ান স্কিনকেয়ার",
    "acne treatment korean products",
  ],
  cover: `${IMAGES}/feature.webp`,
  coverAlt: "Skin Concern — Acne-Prone Skin Korean Skincare Routine",
  body: [
    { kind: "paragraph", text: "Acne নিয়ে কথা বলা যাক। একদম খোলামেলা।" },
    {
      kind: "paragraph",
      text: "বাংলাদেশে আমাদের সবচেয়ে বড় skin concern হলো acne। ছেলে মেয়ে সবাই ভোগে। Humidity, pollution, stress, ভুল products সব মিলিয়ে acne একটা never ending cycle হয়ে দাঁড়ায়। আপনি হয়তো অনেক কিছু try করেছেন। নিম পাতা বেটে লাগিয়েছেন, ফেয়ার অ্যান্ড লাভলি দিয়েছেন, dermatologist এর কাছে গেছেন, expensive cream কিনেছেন। কিন্তু acne বারবার ফিরে আসে।",
    },
    {
      kind: "paragraph",
      text: "আমি জানি কতটা frustrating এই journey। তো আজ আমি একটা different approach share করবো। Korean skincare approach। এটা কিন্তু শুধু “পিম্পল শুকিয়ে ফেলো” টাইপ না। এটার goal হলো আপনার skin এর overall health এমনভাবে improve করা, যাতে acne হওয়ার পরিবেশটাই তৈরি না হয়। Root cause treat করা, শুধু symptom না।",
    },

    { kind: "heading", text: "বাংলাদেশে Acne কেন এত বেশি?" },
    {
      kind: "image",
      src: `${IMAGES}/acne-causes.webp`,
      alt: "Understanding — Why Acne Is So Common: humidity + pollution + wrong products = breakout cycle",
    },
    {
      kind: "paragraph",
      text: "Acne হওয়ার মূলত 4টা কারণ: excess oil production, dead skin cells জমে pores বন্ধ হওয়া, bacteria বাড়া, আর inflammation।",
    },
    {
      kind: "paragraph",
      text: "এখন বাংলাদেশের context এ এই 4টার সাথে আরো bonus সমস্যা যোগ হয়। High humidity তে skin extra oil produce করে। Air pollution pores এ ময়লা আর toxins জমায়। ঘাম আর humidity মিলে bacteria র পার্টি হয়ে যায়। আর ভুল products ব্যবহার করলে skin আরো বেশি react করে।",
    },
    {
      kind: "paragraph",
      text: "তাহলে আমাদের routine এমন হতে হবে যেটা oil control করবে, pores clean রাখবে, bacteria কমাবে, আর inflammation শান্ত করবে। সব একসাথে, কিন্তু gently, roughly না।",
    },

    { kind: "heading", text: "কোন Ingredients আপনার Best Friend?" },
    {
      kind: "image",
      src: `${IMAGES}/ingredients-good.webp`,
      alt: "Use these — Your Skin's Best Friends: BHA, Niacinamide, Centella, Tea Tree, Snail Mucin",
    },
    { kind: "subheading", text: "এগুলো ব্যবহার করুন" },
    {
      kind: "list",
      items: [
        {
          term: "Salicylic Acid (BHA)",
          text: "এটা oil soluble, মানে pores এর ভেতরে ঢুকে গিয়ে clean করতে পারে। Blackheads, whiteheads, clogged pores এর জন্য gold standard। Acne prone skin এর best friend বলতে পারেন।",
        },
        {
          term: "Niacinamide (Vitamin B3)",
          text: "সবচেয়ে versatile ingredient। Oil production regulate করে, pores ছোট করে, inflammation কমায়, আর acne marks fade করতে help করে। একটা ingredient এ অনেক কিছু!",
        },
        {
          term: "Centella Asiatica (CICA)",
          text: "Anti inflammatory, wound healing, skin barrier repair। Active acne এর inflammation শান্ত করতে আর marks heal করতে excellent। এটা basically আপনার skin এর doctor।",
        },
        {
          term: "Tea Tree",
          text: "Natural antibacterial। Acne causing bacteria কে kill করে। পুরো মুখে না লাগিয়ে spot treatment হিসেবে ব্যবহার করলে সবচেয়ে ভালো কাজ করে।",
        },
        {
          term: "Snail Mucin",
          text: "শুনতে অদ্ভুত? আমি জানি! কিন্তু এটা Korean skincare এর most proven ingredients এর একটা। Skin repair, hydration, texture improvement সব এক product এ।",
        },
      ],
    },

    { kind: "subheading", text: "এগুলো AVOID করুন" },
    {
      kind: "image",
      src: `${IMAGES}/ingredients-avoid.webp`,
      alt: "Avoid these — Ingredients to Avoid: heavy oils, alcohol toners, harsh scrubs, fragrance",
    },
    {
      kind: "paragraph",
      text: "Heavy oils আর butter based products, যেমন coconut oil, shea butter। এগুলো comedogenic মানে pores বন্ধ করে। Acne prone skin এ এগুলো poison।",
    },
    {
      kind: "paragraph",
      text: "Alcohol heavy toners। Short term এ oil কমায় ঠিকই, কিন্তু long term এ skin dehydrate করে। আর dehydrated skin কি করে? আরো বেশি oil produce করে! Rebound oiliness বলে এটাকে।",
    },
    {
      kind: "paragraph",
      text: "Harsh physical scrubs। ওই apricot scrub, walnut scrub টাইপ জিনিস। এগুলো skin এ ছোট ছোট কাটা ছেঁড়া তৈরি করে, inflammation বাড়ায়, acne ছড়ায়। Please এগুলো ডাস্টবিনে ফেলুন।",
    },
    {
      kind: "paragraph",
      text: "Fragrance heavy products। কৃত্রিম সুগন্ধি sensitive আর acne prone skin কে irritate করে। Fragrance free products choose করুন।",
    },

    { kind: "heading", text: "Complete Morning Routine" },
    {
      kind: "image",
      src: `${IMAGES}/routine.webp`,
      alt: "Full routine — Complete AM + PM Routine: gentle, science-backed, designed for acne prone skin",
    },
    { kind: "subheading", text: "Step 1: Low pH Gel Cleanser" },
    {
      kind: "paragraph",
      text: "সকালে gentle cleanser দিয়ে রাতের excess oil পরিষ্কার করুন। খুব বেশি foam হয় এমন cleanser avoid করুন। বেশি foam মানে বেশি surfactant, যেটা skin কে strip করে ফেলে।",
    },
    {
      kind: "pick",
      picks: [
        {
          product: "COSRX Low pH Good Morning Gel Cleanser",
          slug: "cosrx-low-ph-good-morning-gel-cleanser-150ml",
          note: "Tea tree oil আছে, mild antibacterial action দেয়, pH skin friendly।",
        },
      ],
    },

    { kind: "subheading", text: "Step 2: BHA Toner" },
    {
      kind: "paragraph",
      text: "প্রতিদিন ব্যবহারযোগ্য mild BHA toner ব্যবহার করুন। এটা daily level এ pores clean রাখবে আর excess oil control করবে। Full strength BHA exfoliant সপ্তাহে 2 থেকে 3 বার রাতে ব্যবহার করুন, সেটা আলাদা।",
    },

    { kind: "subheading", text: "Step 3: Niacinamide Serum" },
    {
      kind: "paragraph",
      text: "সকালে Niacinamide serum ব্যবহার করুন। Oil control, pore minimizing, আর brightening সারাদিন কাজ করতে থাকবে। 5 থেকে 10 percent concentration ideal।",
    },
    {
      kind: "pick",
      picks: [
        {
          product: "Anua Niacinamide 10% + TXA Serum",
          note: "Niacinamide আর tranexamic acid এর combination dark spots আর acne marks এর জন্য powerful team।",
        },
      ],
    },

    { kind: "subheading", text: "Step 4: Oil Free Gel Moisturizer" },
    {
      kind: "paragraph",
      text: "Acne prone skin এও moisturizer দরকার। Skip করবেন না please! Oil free, non comedogenic gel moisturizer choose করুন। আগেই বলেছি dehydrated skin আরো বেশি oil produce করে। Moisturizer সেটা prevent করে।",
    },

    { kind: "subheading", text: "Step 5: Lightweight Sunscreen SPF 50+" },
    {
      kind: "paragraph",
      text: "Mandatory! Acne marks sunlight এ আরো dark হয়ে যায়। Lightweight, non comedogenic Korean sunscreen choose করুন।",
    },
    {
      kind: "pick",
      picks: [
        {
          product: "Beauty of Joseon Relief Sun Aqua-Fresh (Rice + B5) SPF50+ PA++++",
          slug: "beauty-of-joseon-relief-sun-aqua-fresh-rice-plus-b5-spf50-pa-50ml",
          note: "Rice extract base, matte finish, acne prone skin এ comfortable।",
        },
      ],
    },

    { kind: "heading", text: "Complete Night Routine" },
    { kind: "subheading", text: "Step 1: Oil Cleanser" },
    {
      kind: "paragraph",
      text: "“Acne আছে, আবার oil cleanser?” হ্যাঁ! শুনুন, oil cleanser sunscreen আর impurities dissolve করে। এটা pores clog করে না কারণ আপনি তো ধুয়ে ফেলছেন! Oil cleanser skip করলে সারাদিনের sunscreen residue pores এ থেকে যায়। আর ওটাই acne করে।",
    },

    { kind: "subheading", text: "Step 2: Water Based Cleanser" },
    {
      kind: "paragraph",
      text: "Double cleanse complete করুন। সারাদিনের সব ময়লা gone।",
    },

    {
      kind: "subheading",
      text: "Step 3: Chemical Exfoliant (সপ্তাহে 2 থেকে 3 রাত)",
    },
    {
      kind: "paragraph",
      text: "COSRX BHA Blackhead Power Liquid। Gentle form of BHA। Pores deep clean করে, blackheads prevent করে। Apply করে 20 মিনিট wait করুন, তারপর বাকি routine চালান।",
    },
    {
      kind: "note",
      label: "Important",
      text: "Exfoliant ব্যবহারের রাতে Retinol বা অন্য strong actives ব্যবহার করবেন না। Skin কে overwhelm করবেন না।",
    },

    { kind: "subheading", text: "Step 4: Centella বা CICA Serum" },
    {
      kind: "paragraph",
      text: "রাতে Centella based product ব্যবহার করুন। Inflammation শান্ত করবে, active acne calm করবে, healing speed up করবে। রাতে skin repair mode এ থাকে, তাই Centella তখন সবচেয়ে ভালো কাজ করে।",
    },
    {
      kind: "pick",
      picks: [
        {
          product: "SKIN1004 Madagascar Centella Tea-Trica Relief Ampoule",
          slug: "skin1004-madagascar-centella-tea-trica-relief-ampoule-30ml",
          note: "Lightweight, fast absorbing, proven results।",
        },
      ],
    },

    { kind: "subheading", text: "Step 5: Snail Mucin Essence" },
    {
      kind: "paragraph",
      text: "COSRX Advanced Snail 96 Mucin Power Essence। Skin repair, hydration, আর texture improvement। Acne scars আর rough texture smooth করতে excellent। Centella serum এর উপরে layer করুন।",
    },

    { kind: "subheading", text: "Step 6: Moisturizer" },
    {
      kind: "paragraph",
      text: "Oil free gel বা lightweight cream। Skin কে hydrated রাখুন যাতে repair process properly চলে।",
    },

    { kind: "heading", text: "Spot Treatment: Pimple Emergency তে কি করবেন?" },
    {
      kind: "image",
      src: `${IMAGES}/spot-treatment.webp`,
      alt: "SOS — Pimple Emergency Kit: pimple patches + spot treatment = fast recovery",
    },
    {
      kind: "paragraph",
      text: "হঠাৎ একটা বড় pimple উঠেছে, কাল important event। কি করবেন? পুরো মুখে কিছু লাগানোর দরকার নেই। Targeted spot treatment ব্যবহার করুন।",
    },
    {
      kind: "list",
      items: [
        {
          term: "Option 1: COSRX Acne Pimple Master Patch",
          text: "এটা Korean skincare এর genius invention! Hydrocolloid patch রাতে pimple এর উপরে লাগিয়ে ঘুমান। Pus absorb করে নেবে, bacteria থেকে protect করবে, healing fast হবে। সকালে দেখবেন pimple অনেকটাই flat!",
        },
        {
          term: "Option 2: Tea Tree spot treatment",
          text: "শুধু pimple এর উপরে একটুখানি লাগান, পুরো মুখে না।",
        },
      ],
    },

    { kind: "heading", text: "৫টি Common Mistakes যেগুলো Acne আরো Worse করে" },
    {
      kind: "image",
      src: `${IMAGES}/mistakes.webp`,
      alt: "Stop doing — 5 Mistakes Making Acne Worse: over washing, popping, skipping moisturizer, too many actives",
    },
    {
      kind: "list",
      ordered: true,
      items: [
        {
          term: "মুখ বারবার ধোয়া।",
          text: "দিনে 2 বার enough! বেশি ধুলে skin strip হয়, oil production উল্টো বাড়ে। আমি জানি oily feel হলে ধুয়ে ফেলতে মন চায়, কিন্তু please resist করুন।",
        },
        {
          term: "Pimple pop করা।",
          text: "হাত দেবেন না! আমি জানি temptation অনেক, কিন্তু pop করলে bacteria spread হয়, scarring হয়, infection হতে পারে। Pimple patch লাগান, হাত দূরে রাখুন।",
        },
        {
          term: "Moisturizer skip করা।",
          text: "“Oily skin তে moisturizer লাগবে না” এটা skincare এর সবচেয়ে বড় myth। আগেই বলেছি, dehydrated skin আরো বেশি oil produce করে।",
        },
        {
          term: "একসাথে অনেক active ব্যবহার।",
          text: "BHA + Retinol + Vitamin C সব একসাথে? Skin barrier destroy হবে, irritation বাড়বে, acne worse হবে। Less is more।",
        },
        {
          term: "2 সপ্তাহে result না পেয়ে ছেড়ে দেওয়া।",
          text: "Skin cell turnover cycle 28 দিন। মানে নতুন skin surface এ আসতে almost 1 মাস লাগে। Minimum 6 থেকে 8 সপ্তাহ সময় দিন। ধৈর্য ধরুন, result আসবে।",
        },
      ],
    },

    { kind: "heading", text: "শেষ কথা" },
    {
      kind: "paragraph",
      text: "Acne একটা frustrating journey। কিন্তু right approach এ এটা একদম manageable। Korean skincare এর gentle, science backed approach আপনার skin কে heal করতে দেয়, force করে না। ভালোবাসা দিয়ে treat করে, aggression দিয়ে না।",
    },
    {
      kind: "paragraph",
      text: "মনে রাখবেন: Consistency আর patience এই দুইটা সবচেয়ে important product, যেটা কোনো bottle এ পাওয়া যায় না। আপনাকে নিজের কাছ থেকেই আনতে হবে।",
    },
    {
      kind: "paragraph",
      text: "Acne concern নিয়ে personalized advice চাইলে আমাদের WhatsApp community তে join করুন। Korean Hive এর skincare experts আপনার skin type আর concern অনুযায়ী exact routine recommend করবেন, সম্পূর্ণ FREE। আপনি একা না এই journey তে!",
    },
    {
      kind: "paragraph",
      text: "সব authentic Korean skincare products পাবেন koreanhive.com এ।",
    },
  ],
};
