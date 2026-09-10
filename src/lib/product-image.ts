/**
 * One visual size for every product photo.
 *
 * The catalogue's packshots are all 1200x1200, which fixes the frame but not
 * the product inside it. Measured against the live catalogue by trimming each
 * photo down to its actual content, the product occupies anywhere from 21% of
 * its frame (Beauty of Joseon Revive Eye Serum: 93x252 of real ink) to 100%
 * (iUNIK Centella sunscreen: 516x1200). `object-contain` reproduces that
 * faithfully, which is why one bottle rendered nearly five times taller than
 * its neighbour and the grid read as broken.
 *
 * Fixed at the CDN rather than in the photography, since re-shooting the
 * catalogue is not the answer to a framing problem. Three chained ImageKit
 * transformations, colon-separated as chaining requires:
 *
 *   t-10                          trim the near-uniform background, leaving
 *                                 the product's own bounding box
 *   w-720,h-720,cm-pad_resize     scale that box to fill a 720 square and pad
 *   bg-FFFFFF                     the leftover with white, aspect preserved
 *   b-140_FFFFFF                  add a 140px white border on all four sides,
 *                                 taking the square to 1000
 *
 * The border is what creates the margin, and it has to be a separate step:
 * `cm-pad_resize` scales the image up to fill the box it is given, so asking
 * it for a square and hoping the product lands short of the edges does not
 * work — every product comes out edge to edge, which is exactly the "too big"
 * this was meant to avoid. Fitting to a smaller box first does not help
 * either; pad_resize simply scales that result back up. Only a border adds
 * space pad_resize will not eat.
 *
 * So: 720 of product inside 1000 of square, or 72% along the product's longest
 * side, with 14% of breathing room on each edge. Tall bottles stay tall and
 * wide jars stay wide — only the scale is normalised, which is the part that
 * was wrong, and nothing is ever cropped. To make products larger or smaller
 * across the whole site, change SCALE; BORDER follows from it.
 *
 * Trim tolerance is conservative and, on this catalogue, insensitive: t-1,
 * t-10 and t-30 agree to within 8px on the same photo, because the packshots
 * really are on flat white. A photo that is *not* on a uniform background — a
 * brand's designed marketing card, say — trims to itself and is only scaled.
 * Nothing here can crop a product, at any tolerance.
 *
 * The one real cost: a product photographed very small in its frame is now
 * being scaled up rather than shown small, so it is softer than its
 * neighbours. That is a fair trade for a grid that lines up, but the actual
 * fix for those few is a better source photo.
 *
 * Idempotent, so it is safe to call on a URL that has already been through it.
 */

const IMAGEKIT_HOST = "ik.imagekit.io";

/** Side of the normalised square handed to the loader, in pixels. */
const BOX = 1000;

/** Share of that square the product occupies along its longest side. */
const SCALE = 0.72;

const INNER = Math.round(BOX * SCALE);
const BORDER = Math.round((BOX - INNER) / 2);

const NORMALISE =
  `t-10` +
  `:w-${INNER},h-${INNER},cm-pad_resize,bg-FFFFFF` +
  `:b-${BORDER}_FFFFFF`;

export function productImage(src: string): string {
  // relative paths are local files under public/ — no CDN to ask
  if (!src.startsWith("http")) return src;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  // demo/seed imagery and anything else self-hosted has no transformation API
  if (url.hostname !== IMAGEKIT_HOST) return src;

  const existing = url.searchParams.get("tr");
  if (existing?.includes(NORMALISE)) return src;

  const tr = existing ? `${existing}:${NORMALISE}` : NORMALISE;

  // Rebuilt by hand rather than through URLSearchParams for the same reason as
  // the loader: it would percent-encode the commas and colons that ImageKit
  // documents as literal.
  url.searchParams.delete("tr");
  const rest = url.searchParams.toString();

  return `${url.origin}${url.pathname}?${rest ? `${rest}&` : ""}tr=${tr}`;
}
