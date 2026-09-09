/**
 * The Hive Journal.
 *
 * Articles are data, not MDX and not database rows. They are written once, by
 * hand, in a Google Doc, and change rarely — so a typed module gives static
 * generation for free, keeps the pages in the same `npx tsc --noEmit` net as
 * the rest of the app, and adds no dependency for a markdown parser we would
 * then have to sanitise. `src/data/concerns.ts` and `src/data/reels.ts` are
 * the same shape of decision.
 *
 * Blocks rather than an HTML string for the same reason product descriptions
 * are a known problem: a string means either dangerouslySetInnerHTML or raw
 * asterisks on the page. A block union means the renderer decides how a
 * heading, a product pick or an image looks, and a typo in the data is a
 * compile error rather than broken markup.
 *
 * Copy is the client's own, transcribed from the source document without
 * rewriting. It is mostly Bangla with English technical terms mixed in, which
 * is how the audience actually reads — the article element carries lang="bn"
 * so :lang(bn) in globals.css picks up Hind Siliguri.
 */

export type Block =
  /** Section heading (h2). */
  | { kind: "heading"; text: string }
  /** Step or sub-section heading (h3). */
  | { kind: "subheading"; text: string }
  | { kind: "paragraph"; text: string }
  /** One of the document's own section banners, from public/blog/<slug>/. */
  | { kind: "image"; src: string; alt: string }
  /**
   * "আমাদের Pick" — the products the article recommends by name. Held apart
   * from prose so the recommendation is visible at a glance, and so these can
   * later be resolved against the catalogue and linked.
   */
  | { kind: "pick"; picks: { product: string; note: string }[] }
  /** An aside the document labels: "ছোট্ট tip", "মনে রাখবেন", "Important". */
  | { kind: "note"; label: string; text: string }
  | {
      kind: "list";
      ordered?: boolean;
      items: { term?: string; text: string }[];
    };

export type Post = {
  /** URL segment: /blog/<slug> */
  slug: string;
  /** Category label from the document, shown as the card eyebrow. */
  category: string;
  title: string;
  /** Minutes, as stated in the document. */
  readingMinutes: number;
  /** ISO date the article went live on this site. */
  publishedAt: string;
  /** The document's own meta description; doubles as the card summary. */
  description: string;
  keywords: string[];
  /** 1200×630 feature card, also the Open Graph image. */
  cover: string;
  coverAlt: string;
  body: Block[];
};
