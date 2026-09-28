/**
 * Which language to answer in.
 *
 * Customers write English, Bangla script, or Banglish — Bangla typed in Latin
 * letters ("dam koto?", "amar skin oily"). The bot answers in whichever the
 * customer used, so this has to tell the three apart from one message.
 *
 * Bangla script is unambiguous. Banglish versus English is decided by a list
 * of words that are Bangla and essentially never English. Words that collide
 * ("ache", "dam", "na") are left out on purpose: one English sentence with
 * "ache" in it must not flip the whole conversation into Banglish.
 *
 * A message with nothing to go on — "ok", "hi", "price?", an emoji — keeps
 * the language the conversation was already in.
 */

export type Lang = "en" | "banglish" | "bn";

const BANGLISH_WORDS = new Set([
  "ami",
  "amar",
  "amake",
  "amra",
  "amader",
  "apni",
  "apnar",
  "apnara",
  "apnake",
  "tumi",
  "tomar",
  "koto",
  "kto",
  "daam",
  "ki",
  "kivabe",
  "kibhabe",
  "kemon",
  "kmn",
  "keno",
  "kno",
  "kothay",
  "kothai",
  "kobe",
  "kon",
  "konta",
  "kono",
  "achhe",
  "ase",
  "asen",
  "achen",
  "acche",
  "nai",
  "nei",
  "hobe",
  "hbe",
  "hoy",
  "hoi",
  "holo",
  "hoye",
  "nibo",
  "nebo",
  "niben",
  "nite",
  "nici",
  "nichi",
  "lagbe",
  "lagche",
  "chai",
  "chacchi",
  "chaichi",
  "dorkar",
  "korbo",
  "korte",
  "koren",
  "korun",
  "kore",
  "korchi",
  "korsi",
  "parbo",
  "parben",
  "diben",
  "deben",
  "den",
  "dite",
  "dien",
  "pathan",
  "pathaben",
  "pathiye",
  "bolen",
  "bolben",
  "bolun",
  "janaben",
  "janan",
  "jante",
  "jana",
  "bhai",
  "vai",
  "vaiya",
  "bhaiya",
  "apu",
  "apa",
  "vabi",
  "bhabi",
  "valo",
  "bhalo",
  "onek",
  "beshi",
  "besi",
  "ektu",
  "shob",
  "sob",
  "jonno",
  "jnno",
  "theke",
  "sathe",
  "tahole",
  "tai",
  "ekhon",
  "akhon",
  "aj",
  "kalke",
  "dhonnobad",
  "thik",
  "accha",
  "acha",
  "ji",
  "jee",
  "taka",
  "tk",
  "tok",
  "ttok",
  "mukh",
  "mukher",
  "brone",
  "bron",
  "daag",
  "dag",
  "shushko",
  "tailakto",
]);

/**
 * English words that carry a sentence. A Latin-letter message with none of
 * these — "Rina, House 12, Road 5, Mirpur", a product name — is not evidence
 * of English, so it does not switch a Banglish conversation to English.
 */
const ENGLISH_WORDS = new Set([
  "i",
  "you",
  "is",
  "are",
  "the",
  "what",
  "how",
  "which",
  "can",
  "do",
  "does",
  "please",
  "want",
  "need",
  "have",
  "much",
  "my",
  "for",
  "it",
  "this",
  "will",
  "would",
  "should",
  "about",
  "with",
  "and",
  "not",
  "any",
  "your",
  "when",
  "where",
  "thanks",
  "thank",
  "hello",
  "yes",
  "no",
]);

/** Bangla script letters and vowel signs, U+0980–U+09FF. */
const BANGLA_CHAR = /[ঀ-৿]/g;

export function detectLanguage(text: string, previous: Lang | null = null): Lang {
  // Any real Bangla in the message makes it Bangla: product and brand names
  // are Latin, so "Anua toner এর দাম কত?" is mostly Latin letters and still a
  // Bangla question.
  const bangla = text.match(BANGLA_CHAR)?.length ?? 0;
  if (bangla >= 3) return "bn";

  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  if (words.filter((word) => BANGLISH_WORDS.has(word)).length > 0) return "banglish";
  if (words.some((word) => ENGLISH_WORDS.has(word))) return "en";

  // "ok", "price?", an address, an emoji — nothing to switch on
  return previous ?? "en";
}

/** Replaces Bangla digits with ASCII ones, so "৳১,২৫০" reads as 1250. */
export function asciiDigits(text: string) {
  return text.replace(/[০-৯]/g, (digit) =>
    String(digit.charCodeAt(0) - 0x09e6),
  );
}
