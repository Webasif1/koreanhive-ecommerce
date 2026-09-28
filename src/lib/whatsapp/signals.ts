import { asciiDigits } from "@/lib/whatsapp/language";

/**
 * What a WhatsApp message is asking for, in all three languages the shop is
 * written to in.
 *
 * Matching runs on a padded, punctuation-free copy of the message, so a Latin
 * phrase only matches as whole words (" dam " never fires inside "damaged")
 * while a Bangla stem matches anywhere, because Bangla inflects with
 * suffixes — দাম becomes দামটা, অর্ডার becomes অর্ডারটা.
 *
 * Words that mean something else in a skincare chat are deliberately missing.
 * "beshi" alone is not an objection ("amar skin beshi oily"), and "problem" is
 * not a complaint ("acne problem") — only the phrases that cannot be misread
 * are listed.
 */

export type Prepared = string;

export function prepare(message: string): Prepared {
  const text = asciiDigits(message.toLowerCase())
    .replace(/[^a-z0-9ঀ-৿]+/g, " ")
    .trim();
  return ` ${text} `;
}

function has(text: Prepared, latin: readonly string[], bangla: readonly string[] = []) {
  return (
    latin.some((phrase) => text.includes(` ${phrase} `)) ||
    bangla.some((stem) => text.includes(stem))
  );
}

const PRICE_WORDS = [
  "price",
  "prices",
  "prize",
  "pp",
  "cost",
  "how much",
  "rate",
  "dam",
  "daam",
  "dum",
  "price koto",
];
const PRICE_BN = ["দাম", "মূল্য", "প্রাইস", "প্রাইজ"];

/** "koto" / কত alone is "how much" — but also "how many days". */
const HOW_MUCH = ["koto", "kto", "koto taka", "koto tk"];
const HOW_MUCH_BN = ["কত"];

const DELIVERY = [
  "delivery",
  "deliver",
  "shipping",
  "courier",
  "delivery charge",
  "koto din",
  "kobe pabo",
  "how long",
  "how many days",
];
const DELIVERY_BN = ["ডেলিভারি", "ডেলিভারী", "কুরিয়ার", "চার্জ", "কত দিন", "কতদিন", "কবে পাব"];

const PAYMENT = [
  "cod",
  "cash on delivery",
  "bkash",
  "nagad",
  "rocket",
  "payment",
  "advance",
  "pay",
];
const PAYMENT_BN = ["বিকাশ", "নগদ", "পেমেন্ট", "অগ্রিম", "অ্যাডভান্স", "ক্যাশ অন"];

const AUTHENTICITY = [
  "authentic",
  "original",
  "genuine",
  "fake",
  "copy",
  "real product",
  "asol",
  "ashol",
  "nokol",
];
const AUTHENTICITY_BN = ["আসল", "অরিজিনাল", "অথেনটিক", "নকল", "কপি"];

const RETURNS = ["return", "refund", "exchange", "ferot", "change kora", "change korte"];
const RETURNS_BN = ["ফেরত", "রিটার্ন", "রিফান্ড", "এক্সচেঞ্জ"];

const ORDER_WORDS = ["order", "parcel", "percel", "orders"];
const ORDER_WORDS_BN = ["অর্ডার", "পার্সেল"];
const STATUS_WORDS = [
  "where",
  "kothay",
  "kothai",
  "status",
  "obostha",
  "kobe",
  "when",
  "track",
  "tracking",
  "pai nai",
  "paini",
  "asheni",
  "ashe nai",
];
const STATUS_BN = ["কোথায়", "কোথায়", "অবস্থা", "কবে", "পাইনি", "আসেনি", "ট্র্যাক"];

const WANTS_ORDER = [
  "order",
  "order korbo",
  "order dibo",
  "order dite",
  "order korte",
  "nibo",
  "nebo",
  "nite chai",
  "niben",
  "kinbo",
  "kinte chai",
  "buy",
  "purchase",
  "confirm",
  "i want it",
  "i will take",
  "ill take",
  "book",
];
const WANTS_ORDER_BN = [
  "অর্ডার",
  "নিব",
  "নেব",
  "নিতে চাই",
  "কিনব",
  "কিনতে চাই",
  "কনফার্ম",
  "বুক",
];

/** A short yes to "shall I book one for you?". */
const AFFIRM = [
  "yes",
  "yeah",
  "yep",
  "ok",
  "okay",
  "sure",
  "ji",
  "jee",
  "hae",
  "ha",
  "haa",
  "hmm",
  "accha",
  "acha",
  "thik ache",
  "done",
];
const AFFIRM_BN = ["হ্যাঁ", "হ্যা", "জি", "জ্বি", "ঠিক আছে", "আচ্ছা"];

const OBJECTION = [
  "expensive",
  "costly",
  "too much",
  "too high",
  "so much",
  "high price",
  "discount",
  "cheaper",
  "less price",
  "last price",
  "dam beshi",
  "dam besi",
  "beshi dam",
  "besi dam",
  "onek dam",
  "dam onek",
  "dam kom",
  "kom koren",
  "kom hobe",
  "kom kore",
  "komano",
  "komaben",
  "less koren",
];
const OBJECTION_BN = [
  "দাম বেশি",
  "বেশি দাম",
  "অনেক দাম",
  "দাম কম",
  "কম হবে",
  "কমানো",
  "কমাবেন",
  "ছাড়",
  "ডিসকাউন্ট",
  "লাস্ট প্রাইস",
];

const HUMAN = [
  "human",
  "agent",
  "real person",
  "representative",
  "customer care",
  "customer service",
  "call me",
  "call den",
  "call dien",
  "call korun",
  "call diben",
  "talk to",
  "kotha bolte",
  "kotha bolbo",
  "manush",
  "admin",
];
const HUMAN_BN = ["মানুষ", "কথা বলতে", "কথা বলব", "কল দিন", "কল দেন", "কল করুন", "এডমিন"];

const COMPLAINT = [
  "damaged",
  "broken",
  "wrong product",
  "wrong item",
  "leaking",
  "leaked",
  "complain",
  "complaint",
  "vanga",
  "venge",
  "bhanga",
  "nosto",
  "vul product",
  "bhul product",
];
const COMPLAINT_BN = ["ভাঙা", "ভেঙে", "নষ্ট", "ভুল প্রোডাক্ট", "অভিযোগ"];

const QUALIFIER = [
  "gift",
  "present",
  "for myself",
  "for my",
  "for her",
  "for him",
  "nijer",
  "nijer jonno",
  "amar jonno",
  "gift korbo",
];
const QUALIFIER_BN = ["উপহার", "গিফট", "নিজের", "আমার জন্য"];

const GREETING = [
  "hi",
  "hii",
  "hello",
  "helo",
  "hey",
  "hlw",
  "salam",
  "slm",
  "assalamu alaikum",
  "assalamualaikum",
  "asslamualaikum",
  "assalamu alaikom",
  "good morning",
  "good evening",
];
const GREETING_BN = ["আসসালামু", "সালাম", "হ্যালো"];

const THANKS = ["thanks", "thank you", "thank", "tnx", "thx", "dhonnobad", "ty"];
const THANKS_BN = ["ধন্যবাদ"];

const INSIDE_DHAKA = ["inside dhaka", "dhakar vitore", "dhakar bhitore", "dhakar moddhe", "dhaka"];
const INSIDE_DHAKA_BN = ["ঢাকার ভিতরে", "ঢাকার ভেতরে", "ঢাকার মধ্যে", "ঢাকা"];
const OUTSIDE_DHAKA = ["outside dhaka", "dhakar baire", "dhakar bahire"];
const OUTSIDE_DHAKA_BN = ["ঢাকার বাইরে"];

const ADDRESS_WORDS = [
  "road",
  "house",
  "flat",
  "area",
  "thana",
  "district",
  "zilla",
  "sector",
  "block",
  "lane",
  "bari",
  "basha",
  "upazila",
];
const ADDRESS_BN = ["রোড", "বাসা", "বাড়ি", "থানা", "জেলা", "উপজেলা", "সেক্টর", "ব্লক", "গ্রাম"];

export type Signals = {
  priceWord: boolean;
  howMuch: boolean;
  delivery: boolean;
  payment: boolean;
  authenticity: boolean;
  returns: boolean;
  orderStatus: boolean;
  wantsOrder: boolean;
  affirm: boolean;
  objection: boolean;
  human: boolean;
  complaint: boolean;
  qualifier: boolean;
  greeting: boolean;
  thanks: boolean;
  zone: "inside" | "outside" | null;
  productSlug: string | null;
};

/** The product a message links to — the website's WhatsApp button prefills
 *  the page URL, so this is how a chat starts already knowing the product. */
export function linkedProductSlug(message: string): string | null {
  const match = message.match(/\/product\/([a-z0-9-]+)/i);
  return match ? match[1].toLowerCase() : null;
}

export function readSignals(message: string): Signals {
  const text = prepare(message);
  const words = text.trim().split(" ").filter(Boolean);

  const orderWord = has(text, ORDER_WORDS, ORDER_WORDS_BN);
  const orderStatus =
    has(text, ["track", "tracking", "order status", "where is my"], ["ট্র্যাক"]) ||
    (orderWord && has(text, STATUS_WORDS, STATUS_BN));

  const zone = has(text, OUTSIDE_DHAKA, OUTSIDE_DHAKA_BN)
    ? "outside"
    : has(text, INSIDE_DHAKA, INSIDE_DHAKA_BN)
      ? "inside"
      : null;

  return {
    priceWord: has(text, PRICE_WORDS, PRICE_BN),
    howMuch: has(text, HOW_MUCH, HOW_MUCH_BN),
    delivery: has(text, DELIVERY, DELIVERY_BN),
    payment: has(text, PAYMENT, PAYMENT_BN),
    authenticity: has(text, AUTHENTICITY, AUTHENTICITY_BN),
    returns: has(text, RETURNS, RETURNS_BN),
    orderStatus,
    wantsOrder: !orderStatus && has(text, WANTS_ORDER, WANTS_ORDER_BN),
    // only a short message is a plain "yes" — "ok but is it original?" is not
    affirm: words.length <= 4 && has(text, AFFIRM, AFFIRM_BN),
    objection: has(text, OBJECTION, OBJECTION_BN),
    human: has(text, HUMAN, HUMAN_BN),
    complaint: has(text, COMPLAINT, COMPLAINT_BN),
    qualifier: has(text, QUALIFIER, QUALIFIER_BN),
    greeting: has(text, GREETING, GREETING_BN),
    thanks: words.length <= 5 && has(text, THANKS, THANKS_BN),
    zone,
    productSlug: linkedProductSlug(message),
  };
}

/**
 * Whether a message, sent after the bot asked for name and address, is those
 * details rather than another question.
 */
export function looksLikeDetails(message: string): boolean {
  if (/[?？]/.test(message)) return false;

  const text = prepare(message);
  if (has(text, ADDRESS_WORDS, ADDRESS_BN)) return true;

  const compact = message.replace(/\s+/g, " ").trim();
  return /\d/.test(asciiDigits(compact)) || compact.length >= 20;
}
