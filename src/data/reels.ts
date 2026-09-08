/**
 * The Facebook reels shown on the home page.
 *
 * Canonical `/reel/<id>` URLs, not the `share/r/…` links they came from. Those
 * are redirects, and Facebook's embed plugin needs the destination — pasting a
 * share link produces an empty player rather than an error, which is the worst
 * kind of broken.
 *
 * Titles and covers are the reels' own. Facebook publishes both as Open Graph
 * tags on the reel page, so nothing here is written on the videos' behalf.
 *
 * The covers are copied into public/ rather than hotlinked. The fbcdn URLs the
 * tags point at are signed and expire, so a linked cover would quietly break;
 * and every visitor would be making a request to Meta on page load, which is
 * the exact thing the click-to-play tile exists to avoid.
 */

export type Reel = {
  /** Canonical Facebook reel URL, used to build the embed. */
  url: string;
  /** The reel's own caption, trimmed of trailing ellipsis. */
  title: string;
  /** Cover frame, taken from the reel's og:image and served from public/. */
  cover: string;
};

export const REELS: Reel[] = [
  {
    url: "https://www.facebook.com/reel/1085437190716942/",
    title: "Skin Brightening Combo for a Healthy Glow",
    cover: "/reels/skin-brightening-combo.jpg",
  },
  {
    url: "https://www.facebook.com/reel/1347230174189917/",
    title: "Skin Repairing Combo",
    cover: "/reels/skin-repairing-combo.jpg",
  },
  {
    url: "https://www.facebook.com/reel/2838167563219057/",
    title: "Acne-prone skin? Save this combo!",
    cover: "/reels/acne-prone-combo.jpg",
  },
];

/**
 * Facebook's video plugin URL for a reel.
 *
 * `show_text=false` drops the caption and post chrome, leaving the video. The
 * width is what the plugin renders at internally; the iframe is stretched to
 * the tile by CSS, so this only sets the source resolution.
 */
export function reelEmbedUrl(url: string) {
  const params = new URLSearchParams({
    href: url,
    show_text: "false",
    width: "360",
  });

  return `https://www.facebook.com/plugins/video.php?${params}`;
}
