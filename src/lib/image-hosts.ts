/**
 * Hosts next/image is allowed to load from.
 *
 * next.config.ts builds its `remotePatterns` from this list, and the product
 * importer validates every incoming image URL against it. One source, so an
 * import can never accept a URL that the storefront then refuses to render —
 * which would show as a blank box rather than an error, and only after the
 * product was already live.
 *
 * Imported with a relative path by next.config.ts, which is loaded before the
 * "@/" alias exists. Keep this file dependency-free.
 */
export const ALLOWED_IMAGE_HOSTS = [
  "ik.imagekit.io",
  // demo/seed imagery only — drop once real ImageKit assets land
  "picsum.photos",
] as const;

export function isAllowedImageHost(url: string): boolean {
  try {
    const parsed = new URL(url);

    // http:// would be silently upgraded or blocked depending on the browser,
    // and next/image only matches the protocol it was configured with
    if (parsed.protocol !== "https:") return false;

    return (ALLOWED_IMAGE_HOSTS as readonly string[]).includes(parsed.hostname);
  } catch {
    // not a URL at all
    return false;
  }
}
