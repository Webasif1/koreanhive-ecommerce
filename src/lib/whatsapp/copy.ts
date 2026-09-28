import { formatBDT } from "@/lib/format";
import type { PolicyFacts } from "@/lib/chatbot/types";
import type { Lang } from "@/lib/whatsapp/language";

/**
 * Everything the WhatsApp bot says, in English, Banglish and Bangla.
 *
 * These follow the shop's inbox sales script: build rapport, ask one small
 * question before the price, give the price as a value sandwich, answer a
 * price objection with value rather than a discount, and end on a question
 * the customer can answer in a word.
 *
 * Every fact in here — price, compare price, delivery charge, stock — is a
 * parameter read from the database. Nothing is a number typed into a string,
 * so the bot can never quote a price the shop does not charge. When Gemini is
 * configured it rewrites these in a more natural voice; when it is not, or
 * when its rewrite fails the guard, these go out exactly as written.
 */

type Copy = Record<Lang, string>;

export type ProductFacts = {
  name: string;
  price: number;
  comparePrice: number | null;
  inStock: boolean;
  benefit: string | null;
  url: string;
};

export type Zones = PolicyFacts["zones"];

const say = (lang: Lang, copy: Copy) => copy[lang];

export function salam(lang: Lang, name: string | null) {
  const who = name ? ` ${name}` : "";
  return lang === "bn" ? `আসসালামু আলাইকুম${who}!` : `Assalamu alaikum${who}!`;
}

/** Zone names come from the database in English ("Inside Dhaka"). */
function zoneName(lang: Lang, name: string) {
  if (lang === "en") return name;
  if (/inside/i.test(name)) return lang === "bn" ? "ঢাকার ভিতরে" : "Dhakar bhitore";
  if (/outside/i.test(name)) return lang === "bn" ? "ঢাকার বাইরে" : "Dhakar baire";
  return name;
}

function hasDhakaZones(zones: Zones) {
  return (
    zones.some((zone) => /inside/i.test(zone.name)) &&
    zones.some((zone) => /outside/i.test(zone.name))
  );
}

export function deliveryCharges(lang: Lang, zones: Zones) {
  return zones.map((zone) => `${zoneName(lang, zone.name)} ${formatBDT(zone.charge)}`).join(", ");
}

function freeDeliveryLine(lang: Lang, zones: Zones) {
  const free = zones.filter((zone) => zone.freeShippingThreshold);
  if (free.length === 0) return null;

  return free
    .map((zone) => {
      const over = formatBDT(zone.freeShippingThreshold as number);
      const where = zoneName(lang, zone.name);
      return say(lang, {
        en: `🚚 Free delivery on orders over ${over} (${where})`,
        banglish: `🚚 ${over} er upore order e free delivery (${where})`,
        bn: `🚚 ${over}-এর বেশি অর্ডারে ফ্রি ডেলিভারি (${where})`,
      });
    })
    .join("\n");
}

/** Script's closing question: "delivery inside or outside Dhaka?" */
export function zoneQuestion(lang: Lang, zones: Zones) {
  if (!hasDhakaZones(zones)) {
    return say(lang, {
      en: "Which district should we deliver to?",
      banglish: "Kon district e delivery hobe?",
      bn: "কোন জেলায় ডেলিভারি হবে?",
    });
  }

  return say(lang, {
    en: "Is your delivery inside Dhaka or outside Dhaka?",
    banglish: "Delivery ta Dhakar bhitore naki baire?",
    bn: "ডেলিভারি ঢাকার ভিতরে নাকি বাইরে?",
  });
}

const CONCERN_QUESTION: Copy = {
  en: "What's your main skin concern — acne, dryness, oiliness or dark spots?",
  banglish: "Apnar skin er main problem ta ki — acne, dry skin, oily skin naki dark spot?",
  bn: "আপনার স্কিনের মূল সমস্যা কী — ব্রণ, শুষ্কতা, তৈলাক্ত ত্বক নাকি দাগ?",
};

// ---------------------------------------------------------------- opening

export function greetCopy(lang: Lang, name: string | null) {
  return [
    say(lang, {
      en: `${salam(lang, name)} Welcome to Korean Hive 😊 100% authentic Korean skincare, cash on delivery all over Bangladesh.`,
      banglish: `${salam(lang, name)} Korean Hive e apnake shagotom 😊 100% authentic Korean skincare, sara Bangladesh e cash on delivery.`,
      bn: `${salam(lang, name)} Korean Hive-এ আপনাকে স্বাগতম 😊 ১০০% অথেনটিক কোরিয়ান স্কিনকেয়ার, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।`,
    }),
    say(lang, {
      en: "Which product are you looking for? Or tell me your skin concern and I'll suggest the right one — acne, dryness, oiliness or dark spots?",
      banglish: "Apni kon product ta khujchen? Na hole apnar skin er problem ta bolen, ami thik product ta suggest kore dicchi — acne, dry skin, oily skin naki dark spot?",
      bn: "আপনি কোন প্রোডাক্টটি খুঁজছেন? অথবা আপনার স্কিনের সমস্যাটা বলুন, আমি সঠিক প্রোডাক্টটি সাজেস্ট করে দিচ্ছি — ব্রণ, শুষ্কতা, তৈলাক্ত ত্বক নাকি দাগ?",
    }),
  ].join("\n\n");
}

// --------------------------------------------------- script 1: price asked

/**
 * Script 1. The customer asked the price; before answering, one small
 * question — who it is for, and their skin type if we do not know it yet.
 * Asked once. A second price ask always gets the price.
 */
export function qualifyCopy(
  lang: Lang,
  name: string | null,
  product: ProductFacts,
  opts: { greet: boolean; knowsSkinType: boolean },
) {
  const opening = opts.greet ? `${salam(lang, name)} ` : "";

  const skin = opts.knowsSkinType
    ? ""
    : say(lang, {
        en: " And what's your skin type — oily, dry, combination or sensitive?",
        banglish: " Ar apnar skin type ta ki — oily, dry, combination naki sensitive?",
        bn: " আর আপনার স্কিন টাইপ কী — অয়েলি, ড্রাই, কম্বিনেশন নাকি সেনসিটিভ?",
      });

  return [
    say(lang, {
      en: `${opening}Thank you for your interest in ${product.name} ❤️`,
      banglish: `${opening}${product.name} e interest dekhanor jonno dhonnobad ❤️`,
      bn: `${opening}${product.name}-এ আগ্রহ দেখানোর জন্য ধন্যবাদ ❤️`,
    }),
    say(lang, {
      en: `So I can make sure it's the right one for you — are you buying it for yourself or as a gift?${skin}`,
      banglish: `Apnar jonno thik product ta confirm korte ektu jante pari — eta ki nijer jonno naki gift korben?${skin}`,
      bn: `আপনার জন্য সঠিক প্রোডাক্টটি নিশ্চিত করতে একটু জানতে পারি — এটি কি নিজের জন্য নাকি গিফট দেওয়ার জন্য দেখছেন?${skin}`,
    }),
    say(lang, {
      en: "Let me know and I'll send you the offer price and delivery details right away!",
      banglish: "Janale shathe shathe offer price ar delivery details janiye dicchi!",
      bn: "জানিয়ে দিলে সাথে সাথেই অফার প্রাইস ও ডেলিভারি ডিটেইলস জানিয়ে দিচ্ছি!",
    }),
  ].join("\n\n");
}

// ------------------------------------------ script 2: the value sandwich

function priceLine(lang: Lang, product: ProductFacts) {
  const { price, comparePrice } = product;

  // The "regular price" is only ever the product's real compare price. An
  // invented higher price would be a false discount.
  if (comparePrice && comparePrice > price) {
    const saving = formatBDT(comparePrice - price);
    return say(lang, {
      en: `Regular price ~${formatBDT(comparePrice)}~, now only *${formatBDT(price)}* — you save ${saving}!`,
      banglish: `Regular price ~${formatBDT(comparePrice)}~, kintu ekhon paben matro *${formatBDT(price)}* te — ${saving} saving!`,
      bn: `নিয়মিত মূল্য ~${formatBDT(comparePrice)}~, কিন্তু এখন পাচ্ছেন মাত্র *${formatBDT(price)}*-য় — ${saving} সাশ্রয়!`,
    });
  }

  return say(lang, {
    en: `Price: *${formatBDT(price)}*`,
    banglish: `Price: *${formatBDT(price)}*`,
    bn: `মূল্য: *${formatBDT(price)}*`,
  });
}

function trustLines(lang: Lang) {
  return say(lang, {
    en: "✅ 100% authentic, sourced directly from Korea\n✅ Cash on delivery — pay when it reaches you",
    banglish: "✅ 100% authentic, direct Korea theke ana\n✅ Cash on delivery — product hate peye taka diben",
    bn: "✅ ১০০% অথেনটিক, সরাসরি কোরিয়া থেকে আনা\n✅ ক্যাশ অন ডেলিভারি — প্রোডাক্ট হাতে পেয়ে টাকা দিবেন",
  });
}

export function offerCopy(lang: Lang, product: ProductFacts, zones: Zones) {
  const title = product.benefit ? `*${product.name}*\n${product.benefit}` : `*${product.name}*`;

  const delivery = [
    say(lang, {
      en: `🚚 Delivery: ${deliveryCharges(lang, zones)}`,
      banglish: `🚚 Delivery charge: ${deliveryCharges(lang, zones)}`,
      bn: `🚚 ডেলিভারি চার্জ: ${deliveryCharges(lang, zones)}`,
    }),
    freeDeliveryLine(lang, zones),
  ]
    .filter(Boolean)
    .join("\n");

  return [
    say(lang, { en: "Sure! 😊", banglish: "Obosshoi! 😊", bn: "অবশ্যই! 😊" }),
    title,
    priceLine(lang, product),
    zones.length > 0 ? delivery : null,
    trustLines(lang),
    product.url,
    say(lang, {
      en: `Shall I book one for you? ${zoneQuestion(lang, zones)}`,
      banglish: `Apnar jonno ekta book kore rakhbo? ${zoneQuestion(lang, zones)}`,
      bn: `আপনার জন্য একটি বুক করে রাখব? ${zoneQuestion(lang, zones)}`,
    }),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function outOfStockCopy(lang: Lang, product: ProductFacts, alternative: ProductFacts | null) {
  const lead = say(lang, {
    en: `Sorry, ${product.name} is out of stock right now 😔`,
    banglish: `Sorry, ${product.name} ekhon stock e nei 😔`,
    bn: `দুঃখিত, ${product.name} এই মুহূর্তে স্টকে নেই 😔`,
  });

  if (!alternative) {
    return `${lead}\n\n${say(lang, {
      en: "Tell me your skin concern and I'll suggest something similar that's in stock — acne, dryness, oiliness or dark spots?",
      banglish: `Apnar skin er problem ta bolen, ami stock e ache emon similar product suggest kori — acne, dry skin, oily skin naki dark spot?`,
      bn: `আপনার স্কিনের সমস্যাটা বলুন, স্টকে আছে এমন একই ধরনের প্রোডাক্ট সাজেস্ট করছি — ব্রণ, শুষ্কতা, তৈলাক্ত ত্বক নাকি দাগ?`,
    })}`;
  }

  return [
    lead,
    say(lang, {
      en: `A similar one that's in stock: *${alternative.name}* — ${formatBDT(alternative.price)}`,
      banglish: `Stock e ache emon similar product: *${alternative.name}* — ${formatBDT(alternative.price)}`,
      bn: `স্টকে আছে এমন একই ধরনের প্রোডাক্ট: *${alternative.name}* — ${formatBDT(alternative.price)}`,
    }),
    alternative.url,
    say(lang, {
      en: "Would you like this one instead?",
      banglish: "Eta ki nite chan?",
      bn: "এটি কি নিতে চান?",
    }),
  ].join("\n\n");
}

// ------------------------------------------- script 3: "too expensive"

export function objectionCopy(
  lang: Lang,
  product: ProductFacts | null,
  cheaper: ProductFacts | null,
) {
  const parts = [
    say(lang, {
      en: "I completely understand! You can find cheaper skincare in the market, but a lot of it is copies or old stock.",
      banglish: "Apnar bishoy ta ami ekdom bujhte parchi! Bazare kom dameo onek product paben, kintu tar onek gulai copy ba purono stock.",
      bn: "আপনার বিষয়টি আমি একদম বুঝতে পারছি! বাজারে কম দামেও অনেক প্রোডাক্ট পাওয়া যায়, কিন্তু তার অনেকগুলোই কপি বা পুরোনো স্টক।",
    }),
    say(lang, {
      en: "Everything at Korean Hive is 100% authentic, sourced directly from Korea — so you get exactly what the brand made. You pay only when it reaches you, and if anything arrives damaged or wrong we replace it or refund you.",
      banglish: "Korean Hive er protiti product 100% authentic, direct Korea theke ana — tai brand je product banay thik setai paben. Product hate peye taka diben, ar kono product damaged ba bhul ashle amra replace ba refund kori.",
      bn: "Korean Hive-এর প্রতিটি প্রোডাক্ট ১০০% অথেনটিক, সরাসরি কোরিয়া থেকে আনা — তাই ব্র্যান্ড যা বানায় ঠিক সেটাই পাবেন। প্রোডাক্ট হাতে পেয়ে টাকা দিবেন, আর কোনো প্রোডাক্ট ড্যামেজড বা ভুল এলে আমরা রিপ্লেস বা রিফান্ড করি।",
    }),
  ];

  if (cheaper) {
    parts.push(
      say(lang, {
        en: `If you'd like something lighter on the budget, *${cheaper.name}* is ${formatBDT(cheaper.price)}:`,
        banglish: `Budget ektu kom rakhte chaile *${cheaper.name}* ache ${formatBDT(cheaper.price)} te:`,
        bn: `বাজেট একটু কম রাখতে চাইলে *${cheaper.name}* আছে ${formatBDT(cheaper.price)}-য়:`,
      }),
      cheaper.url,
    );
  }

  parts.push(
    product
      ? say(lang, {
          en: `Shall I confirm the original ${product.name} for you?`,
          banglish: `Apnar jonno original ${product.name} ta ki confirm kore dibo?`,
          bn: `আপনার জন্য অরিজিনাল ${product.name}-টি কি কনফার্ম করে দেব?`,
        })
      : say(lang, {
          en: "What's your budget? I'll find the best option for you within it.",
          banglish: "Apnar budget koto? Oi budget er moddhe best option ta khuje dicchi.",
          bn: "আপনার বাজেট কত? সেই বাজেটের মধ্যে সেরা অপশনটি খুঁজে দিচ্ছি।",
        }),
  );

  return parts.join("\n\n");
}

// ------------------------------------------------------------ ordering

export function askDetailsCopy(lang: Lang, product: ProductFacts | null, zones: Zones) {
  const lines = say(lang, {
    en: `${product ? "" : "1. Product name and quantity\n"}${product ? 1 : 2}. Your name\n${product ? 2 : 3}. Full address (house, road, area, district)\n${product ? 3 : 4}. Phone number (if different from this WhatsApp)`,
    banglish: `${product ? "" : "1. Product er nam ar koyta niben\n"}${product ? 1 : 2}. Apnar nam\n${product ? 2 : 3}. Puro address (basha, road, area, district)\n${product ? 3 : 4}. Phone number (ei WhatsApp number na hole)`,
    bn: `${product ? "" : "১. প্রোডাক্টের নাম ও কয়টি নেবেন\n"}${product ? "১" : "২"}. আপনার নাম\n${product ? "২" : "৩"}. পূর্ণ ঠিকানা (বাসা, রোড, এলাকা, জেলা)\n${product ? "৩" : "৪"}. ফোন নম্বর (এই WhatsApp নম্বর না হলে)`,
  });

  const delivery =
    zones.length > 0
      ? say(lang, {
          en: `🚚 Delivery: ${deliveryCharges(lang, zones)}. Cash on delivery — you pay when it arrives.`,
          banglish: `🚚 Delivery charge: ${deliveryCharges(lang, zones)}. Cash on delivery — product hate peye taka diben.`,
          bn: `🚚 ডেলিভারি চার্জ: ${deliveryCharges(lang, zones)}। ক্যাশ অন ডেলিভারি — প্রোডাক্ট হাতে পেয়ে টাকা দিবেন।`,
        })
      : null;

  return [
    say(lang, {
      en: product
        ? `Great choice! 🎉 To confirm your order for *${product.name}*, please send:`
        : "Great! 🎉 To confirm your order, please send:",
      banglish: product
        ? `Darun choice! 🎉 *${product.name}* er order confirm korte please pathan:`
        : "Darun! 🎉 Order confirm korte please pathan:",
      bn: product
        ? `দারুণ চয়েস! 🎉 *${product.name}*-এর অর্ডার কনফার্ম করতে অনুগ্রহ করে পাঠান:`
        : "দারুণ! 🎉 অর্ডার কনফার্ম করতে অনুগ্রহ করে পাঠান:",
    }),
    lines,
    delivery,
    say(lang, {
      en: "Can you send these now?",
      banglish: "Ekhoni pathate parben?",
      bn: "এখনই পাঠাতে পারবেন?",
    }),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function orderReceivedCopy(lang: Lang, name: string | null) {
  const who = name ? ` ${name}` : "";
  return say(lang, {
    en: `Thank you${who}! 🙏 We've got your details. Our team will message you here shortly to confirm your order and the total with delivery. Would you like to add anything else to the order?`,
    banglish: `Dhonnobad${who}! 🙏 Apnar details peyechi. Amader team kichukkhoner moddhei ekhane message kore order ar delivery shoho total confirm korbe. Order e ar kichu add korte chan?`,
    bn: `ধন্যবাদ${who}! 🙏 আপনার তথ্য পেয়েছি। আমাদের টিম কিছুক্ষণের মধ্যেই এখানে মেসেজ করে অর্ডার ও ডেলিভারিসহ মোট দাম কনফার্ম করবে। অর্ডারে আর কিছু যোগ করতে চান?`,
  });
}

// ------------------------------------------------------------- hand-off

export function humanCopy(lang: Lang, name: string | null) {
  const who = name ? ` ${name}` : "";
  return say(lang, {
    en: `Sure${who}! I've let our team know — a team member will reply to you here shortly 🙏 Meanwhile, could you tell me a little more about what you need?`,
    banglish: `Obosshoi${who}! Amader team ke janiye diyechi — kichukkhoner moddhei ekjon team member ekhane reply korbe 🙏 Ei fanke apnar ki dorkar ektu bistarito bolben?`,
    bn: `অবশ্যই${who}! আমাদের টিমকে জানিয়ে দিয়েছি — কিছুক্ষণের মধ্যেই একজন টিম মেম্বার এখানে রিপ্লাই করবেন 🙏 এর মধ্যে আপনার কী দরকার একটু বিস্তারিত বলবেন?`,
  });
}

export function complaintCopy(lang: Lang) {
  return say(lang, {
    en: "I'm really sorry about that 😔 Our team will sort it out for you quickly. Could you send your order number and a photo of the product?",
    banglish: "Eta shune sotti kharap laglo 😔 Amader team druto solve kore dibe. Apnar order number ar product er ekta chobi pathate parben?",
    bn: "বিষয়টি শুনে সত্যিই খারাপ লাগলো 😔 আমাদের টিম দ্রুত সমাধান করে দেবে। আপনার অর্ডার নম্বর আর প্রোডাক্টের একটি ছবি পাঠাতে পারবেন?",
  });
}

// ------------------------------------------------------------- answers

export function deliveryCopy(lang: Lang, zones: Zones) {
  if (zones.length === 0) {
    return say(lang, {
      en: "We deliver all over Bangladesh with cash on delivery. Which product would you like to order?",
      banglish: "Amra sara Bangladesh e cash on delivery te deliver kori. Kon product ta order korte chan?",
      bn: "আমরা সারা বাংলাদেশে ক্যাশ অন ডেলিভারিতে ডেলিভারি দিই। কোন প্রোডাক্টটি অর্ডার করতে চান?",
    });
  }

  const rows = zones
    .map((zone) =>
      say(lang, {
        en: `• ${zone.name}: ${formatBDT(zone.charge)} (${zone.minDays}–${zone.maxDays} days)`,
        banglish: `• ${zoneName(lang, zone.name)}: ${formatBDT(zone.charge)} (${zone.minDays}–${zone.maxDays} din)`,
        bn: `• ${zoneName(lang, zone.name)}: ${formatBDT(zone.charge)} (${zone.minDays}–${zone.maxDays} দিন)`,
      }),
    )
    .join("\n");

  return [
    say(lang, { en: "🚚 Delivery charge:", banglish: "🚚 Delivery charge:", bn: "🚚 ডেলিভারি চার্জ:" }),
    rows,
    freeDeliveryLine(lang, zones),
    say(lang, {
      en: "Cash on delivery all over Bangladesh. Which product would you like to order?",
      banglish: "Sara Bangladesh e cash on delivery. Kon product ta order korte chan?",
      bn: "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি। কোন প্রোডাক্টটি অর্ডার করতে চান?",
    }),
  ]
    .filter(Boolean)
    .join("\n");
}

export function paymentCopy(lang: Lang) {
  return say(lang, {
    en: "We take cash on delivery — you pay the courier when your parcel arrives, no advance payment needed. Which product are you interested in?",
    banglish: "Amader cash on delivery — parcel hate peye courier ke taka diben, kono advance lagbe na. Kon product ta nite chacchen?",
    bn: "আমাদের ক্যাশ অন ডেলিভারি — পার্সেল হাতে পেয়ে কুরিয়ারকে টাকা দিবেন, কোনো অগ্রিম লাগবে না। কোন প্রোডাক্টটি নিতে চাচ্ছেন?",
  });
}

export function authenticityCopy(lang: Lang) {
  return say(lang, {
    en: "Yes, 100% authentic! Every product is sourced directly from Korea — we never sell copies or grey-market stock. Which product would you like to check?",
    banglish: "Ji, 100% authentic! Protiti product direct Korea theke ana — amra kokhono copy ba grey-market product bikri kori na. Kon product ta dekhte chan?",
    bn: "জি, ১০০% অথেনটিক! প্রতিটি প্রোডাক্ট সরাসরি কোরিয়া থেকে আনা — আমরা কখনো কপি বা গ্রে-মার্কেট প্রোডাক্ট বিক্রি করি না। কোন প্রোডাক্টটি দেখতে চান?",
  });
}

export function returnsCopy(lang: Lang, returnsUrl: string) {
  return [
    say(lang, {
      en: "If anything arrives damaged, wrong or faulty, just send us your order number and a photo and we'll replace it or refund you. Full terms:",
      banglish: "Kono product damaged, bhul ba nosto ashle order number ar ekta chobi pathan — amra replace ba refund kore dibo. Puro niyom:",
      bn: "কোনো প্রোডাক্ট ড্যামেজড, ভুল বা নষ্ট এলে অর্ডার নম্বর ও একটি ছবি পাঠান — আমরা রিপ্লেস বা রিফান্ড করে দেব। বিস্তারিত নিয়ম:",
    }),
    returnsUrl,
    say(lang, {
      en: "Is there an order you need help with?",
      banglish: "Kono order niye help lagbe?",
      bn: "কোনো অর্ডার নিয়ে সাহায্য লাগবে?",
    }),
  ].join("\n\n");
}

const STATUS: Record<string, Copy> = {
  PENDING: { en: "placed — we'll call you to confirm it", banglish: "place hoyeche — confirm korte amra call korbo", bn: "প্লেস হয়েছে — কনফার্ম করতে আমরা কল করব" },
  CONFIRMED: { en: "confirmed and being prepared", banglish: "confirm hoyeche, ready kora hocche", bn: "কনফার্ম হয়েছে, প্রস্তুত করা হচ্ছে" },
  PROCESSING: { en: "being packed", banglish: "pack kora hocche", bn: "প্যাক করা হচ্ছে" },
  SHIPPED: { en: "with the courier, on its way to you", banglish: "courier e deya hoyeche, apnar kache ashche", bn: "কুরিয়ারে দেওয়া হয়েছে, আপনার কাছে আসছে" },
  DELIVERED: { en: "delivered", banglish: "deliver hoye geche", bn: "ডেলিভারি হয়ে গেছে" },
  CANCELLED: { en: "cancelled", banglish: "cancel hoyeche", bn: "বাতিল হয়েছে" },
  RETURNED: { en: "returned to us", banglish: "amader kache ferot esheche", bn: "আমাদের কাছে ফেরত এসেছে" },
};

export function orderStatusCopy(lang: Lang, order: { orderNumber: string; status: string }, trackUrl: string) {
  const status = STATUS[order.status]?.[lang] ?? order.status;
  return [
    say(lang, {
      en: `Your latest order *${order.orderNumber}* is ${status}. You can follow it here:`,
      banglish: `Apnar latest order *${order.orderNumber}* ${status}. Ekhane track korte parben:`,
      bn: `আপনার সর্বশেষ অর্ডার *${order.orderNumber}* ${status}। এখানে ট্র্যাক করতে পারবেন:`,
    }),
    trackUrl,
    say(lang, {
      en: "Is there anything else I can help you with?",
      banglish: "Ar kono bishoye help lagbe?",
      bn: "আর কোনো বিষয়ে সাহায্য লাগবে?",
    }),
  ].join("\n\n");
}

export function orderNotFoundCopy(lang: Lang) {
  return say(lang, {
    en: "I couldn't find an order with this WhatsApp number, so I've asked our team to check 🙏 Could you send your order number, or the phone number you used when ordering?",
    banglish: "Ei WhatsApp number diye kono order khuje pelam na, tai amader team ke check korte bolechi 🙏 Apnar order number ba order korar somoy deya phone number ta pathaben?",
    bn: "এই WhatsApp নম্বর দিয়ে কোনো অর্ডার খুঁজে পাইনি, তাই আমাদের টিমকে চেক করতে বলেছি 🙏 আপনার অর্ডার নম্বর বা অর্ডার করার সময় দেওয়া ফোন নম্বরটি পাঠাবেন?",
  });
}

export type ListItem = { name: string; price: number; url: string };

export function recommendCopy(lang: Lang, items: ListItem[]) {
  const list = items
    .map((item, index) => `${index + 1}. *${item.name}* — ${formatBDT(item.price)}\n${item.url}`)
    .join("\n\n");

  return [
    say(lang, {
      en: "Here are some good picks for you 😊",
      banglish: "Apnar jonno kichu bhalo option 😊",
      bn: "আপনার জন্য কিছু ভালো অপশন 😊",
    }),
    list,
    say(lang, {
      en: "Which one would you like to know more about?",
      banglish: "Kon ta niye aro jante chan?",
      bn: "কোনটি সম্পর্কে আরও জানতে চান?",
    }),
  ].join("\n\n");
}

/** Wraps an answer the site assistant wrote (English) with a closing question. */
export function answerCopy(lang: Lang, answer: string, url: string | null) {
  return [
    answer,
    url,
    say(lang, {
      en: "Is there anything else you'd like to know?",
      banglish: "Ar kichu jante chan?",
      bn: "আর কিছু জানতে চান?",
    }),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function pickProductCopy(lang: Lang) {
  return say(lang, {
    en: "Happy to help! Which product are you asking about? Send me the product name or the link from koreanhive.com — or tell me your skin concern and I'll suggest the right one?",
    banglish: "Obosshoi help korbo! Kon product er kotha jiggesh korchen? Product er nam ba koreanhive.com er link ta pathan — na hole skin er problem ta bolen, ami thik product suggest kori?",
    bn: "অবশ্যই সাহায্য করব! কোন প্রোডাক্টের কথা জিজ্ঞেস করছেন? প্রোডাক্টের নাম বা koreanhive.com-এর লিংকটি পাঠান — অথবা স্কিনের সমস্যাটা বলুন, আমি সঠিক প্রোডাক্ট সাজেস্ট করি?",
  });
}

export function thanksCopy(lang: Lang) {
  return say(lang, {
    en: "You're welcome! 😊 Is there anything else I can help you with?",
    banglish: "Apnakeo dhonnobad! 😊 Ar kono bishoye help korte pari?",
    bn: "আপনাকেও ধন্যবাদ! 😊 আর কোনো বিষয়ে সাহায্য করতে পারি?",
  });
}

export function fallbackCopy(lang: Lang) {
  return say(lang, {
    en: `Sorry, I didn't quite catch that 🙏 Which product are you looking for? Or ${CONCERN_QUESTION.en.charAt(0).toLowerCase()}${CONCERN_QUESTION.en.slice(1)}`,
    banglish: `Sorry, thik bujhte parini 🙏 Apni kon product ta khujchen? Na hole bolen, ${CONCERN_QUESTION.banglish.charAt(0).toLowerCase()}${CONCERN_QUESTION.banglish.slice(1)}`,
    bn: `দুঃখিত, ঠিক বুঝতে পারিনি 🙏 আপনি কোন প্রোডাক্টটি খুঁজছেন? অথবা বলুন, ${CONCERN_QUESTION.bn}`,
  });
}

export function nonTextCopy(lang: Lang) {
  return say(lang, {
    en: "Thanks! I can only read text messages — our team will look at this too. Could you type your question for me?",
    banglish: "Dhonnobad! Ami shudhu text message porte pari — amader team eta dekhbe. Apnar proshno ta ki type kore diben?",
    bn: "ধন্যবাদ! আমি শুধু টেক্সট মেসেজ পড়তে পারি — আমাদের টিম এটিও দেখবে। আপনার প্রশ্নটি কি টাইপ করে দেবেন?",
  });
}

// --------------------------------------------------------------- safety

export function medicalCopy(lang: Lang) {
  return say(lang, {
    en: "I can't give medical advice or say that any product treats a condition — that needs a doctor or a dermatologist who can see your skin. I can tell you what's in a product and what it's made for. Would you like a suggestion for a skincare goal instead, like hydration or sun protection?",
    banglish: "Ami medical advice dite pari na, ba kono product kono rog sarabe emon bolte pari na — er jonno doctor ba dermatologist dekhano dorkar. Tobe product e ki ache ar ki jonno banano seta bolte pari. Hydration ba sun protection er moto kono skincare goal er jonno suggestion chan?",
    bn: "আমি মেডিকেল পরামর্শ দিতে পারি না বা কোনো প্রোডাক্ট কোনো রোগ সারাবে এমন বলতে পারি না — এর জন্য ডাক্তার বা চর্মরোগ বিশেষজ্ঞ দেখানো দরকার। তবে প্রোডাক্টে কী আছে আর কীসের জন্য বানানো সেটা বলতে পারি। হাইড্রেশন বা সান প্রোটেকশনের মতো কোনো স্কিনকেয়ার লক্ষ্যের জন্য সাজেশন চান?",
  });
}

export function credentialsCopy(lang: Lang) {
  return say(lang, {
    en: "Please never share a card number, PIN, OTP or password — nobody from Korean Hive will ever ask for it. You don't need any of it: every order is cash on delivery. Which product can I help you with?",
    banglish: "Please kokhono card number, PIN, OTP ba password share korben na — Korean Hive theke keu kokhono eta chaibe na. Eguloi lagbe na: protiti order cash on delivery. Kon product niye help korte pari?",
    bn: "অনুগ্রহ করে কখনো কার্ড নম্বর, পিন, ওটিপি বা পাসওয়ার্ড শেয়ার করবেন না — Korean Hive থেকে কেউ কখনো এটি চাইবে না। এগুলোর দরকারও নেই: প্রতিটি অর্ডার ক্যাশ অন ডেলিভারি। কোন প্রোডাক্ট নিয়ে সাহায্য করতে পারি?",
  });
}

// ----------------------------------------------- script 4: the follow-up

export function followUpCopy(
  lang: Lang,
  name: string | null,
  productName: string,
  stockLeft: number | null,
) {
  const stock =
    stockLeft !== null
      ? say(lang, {
          en: ` Only ${stockLeft} of ${productName} left in stock right now.`,
          banglish: ` ${productName} er stock e ar matro ${stockLeft} ta ache.`,
          bn: ` ${productName}-এর স্টকে আর মাত্র ${stockLeft}টি আছে।`,
        })
      : "";

  return say(lang, {
    en: `${salam(lang, name)} Hope you're doing well 😊${stock}\n\nOur team is ready to help — would you like me to book ${productName} for you, or is there anything else you wanted to know?`,
    banglish: `${salam(lang, name)} Asha kori bhalo achen 😊${stock}\n\nAmader team apnake help korte ready — apnar jonno ${productName} ta ki book kore rakhbo, naki ar kichu jananor baki chilo?`,
    bn: `${salam(lang, name)} আশা করি ভালো আছেন 😊${stock}\n\nআমাদের টিম আপনাকে সাহায্য করতে প্রস্তুত — আপনার জন্য ${productName}-টি কি বুক করে রাখব, নাকি অন্য কোনো তথ্য জানার বাকি ছিল?`,
  });
}
