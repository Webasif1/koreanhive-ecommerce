/**
 * The Facebook reels shown on the home page.
 *
 * Canonical `/reel/<id>` URLs, not the `share/r/…` links they came from. Those
 * are redirects, and Facebook's embed plugin needs the destination — pasting a
 * share link produces an empty player rather than an error, which is the worst
 * kind of broken.
 *
 * Labels are deliberately plain. Writing "glass skin in 4 steps" under a video
 * nobody here has watched would be describing content we have not seen, which
 * is the same mistake the placeholder tiles made. Replace them with real
 * captions whenever you like — this file is the only place they live.
 */

export type Reel = {
  /** Canonical Facebook reel URL, used to build the embed. */
  url: string;
  label: string;
};

export const REELS: Reel[] = [
  {
    url: "https://www.facebook.com/reel/1347230174189917/",
    label: "Watch on Facebook",
  },
  {
    url: "https://www.facebook.com/reel/2838167563219057/",
    label: "Watch on Facebook",
  },
  {
    url: "https://www.facebook.com/reel/1085437190716942/",
    label: "Watch on Facebook",
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
