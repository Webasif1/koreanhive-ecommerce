/**
 * Custom `next/image` loader — ImageKit does the resizing, not our server.
 *
 * Next's built-in optimizer resizes and re-encodes every image in-process
 * using `sharp`, a native binary. On shared cPanel that is two problems at
 * once: sharp is the single most common native-dependency failure on that
 * kind of host, and the optimizer is CPU and memory hungry on a plan where
 * memory is exactly what is capped.
 *
 * Every product image already lives on ImageKit, which is a transformation
 * CDN — resizing is what it is for, and it does it closer to the shopper than
 * our origin ever will. Pointing the loader at it removes sharp from the
 * deployment entirely and takes image work off the server.
 *
 * Anything that is not an ImageKit URL — the local logo, the demo images —
 * is returned untouched and served as-is. Those are small and fixed-size, so
 * there is nothing to gain from resizing them and a broken URL to lose.
 *
 * To go back to Next's optimizer, delete the `loader` and `loaderFile` lines
 * in next.config.ts. Nothing else depends on this.
 */

const IMAGEKIT_HOST = "ik.imagekit.io";

type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function imagekitLoader({ src, width, quality }: LoaderArgs) {
  // relative paths are local files under public/ — leave them alone
  if (!src.startsWith("http")) return src;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  if (url.hostname !== IMAGEKIT_HOST) return src;

  // ImageKit reads transformations from `tr`. `w` is the target width and
  // `c-at_max` keeps the aspect ratio rather than cropping to it, which is
  // what next/image callers expect.
  const transforms = [`w-${width}`, `q-${quality ?? 80}`, "c-at_max"];

  // Chained with ":", not ",". ImageKit reads a comma as "another parameter in
  // the same step" and a colon as "a new step applied to the previous result".
  // Callers now arrive with a transformation of their own — productImage()
  // trims and re-pads every packshot — and appending to that step would put
  // this width in the same breath as its width, where the last one silently
  // wins. A new step resizes what the first step produced, which is what a
  // next/image caller means by `width`.
  const existing = url.searchParams.get("tr");
  const tr = existing ? `${existing}:${transforms.join(",")}` : transforms.join(",");

  // Built by hand rather than through URLSearchParams, which percent-encodes
  // the separating commas. ImageKit accepts %2C, but its own documented form
  // is a literal comma and that is what shows up in its logs and dashboards.
  url.searchParams.delete("tr");
  const rest = url.searchParams.toString();

  return `${url.origin}${url.pathname}?${rest ? `${rest}&` : ""}tr=${tr}`;
}
