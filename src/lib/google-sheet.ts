/**
 * Fetching a link-shared Google Sheet as CSV.
 *
 * Shared by the admin import screen and `npm run catalogue:sync` so both agree
 * on which URLs are acceptable and how the redirect is handled.
 */

const SHEET_HOST = "docs.google.com";

/** Google serves the actual CSV from its own CDN, on a per-request hostname
 *  like `doc-0s-5o-sheets.googleusercontent.com`. */
const CONTENT_HOST_SUFFIX = ".googleusercontent.com";

export type SheetResult = { text: string } | { error: string };

/**
 * Where Google is allowed to redirect an export to.
 *
 * The export endpoint answers 307 with a Location on a per-request CDN host,
 * so a fetch with `redirect: "error"` never returns a sheet. Following
 * redirects blindly would reopen the SSRF hole the host check exists to close,
 * so callers take the hop themselves and check the destination with this.
 */
export function isGoogleSheetRedirectTarget(location: string, base: string) {
  try {
    const next = new URL(location, base);

    return (
      next.protocol === "https:" &&
      (next.hostname === SHEET_HOST ||
        next.hostname.endsWith(CONTENT_HOST_SUFFIX))
    );
  } catch {
    return false;
  }
}

/**
 * Normal sheet URL to its CSV export endpoint.
 *
 * The host check is the security control, not decoration: without it this is a
 * server-side fetch of any URL an admin can type — a probe into whatever the
 * server can reach, including cloud metadata endpoints and internal services.
 */
export function toCsvExportUrl(input: string): { url: string } | { error: string } {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return { error: "That does not look like a URL." };
  }

  if (url.protocol !== "https:" || url.hostname !== SHEET_HOST) {
    return { error: `Paste a https://${SHEET_HOST} spreadsheet link.` };
  }

  if (url.pathname.includes("/export")) return { url: url.toString() };

  // https://docs.google.com/spreadsheets/d/<id>/edit#gid=<gid>
  const id = url.pathname.split("/")[3];
  if (!id) return { error: "Could not find the sheet id in that link." };

  // Only pinned when the link names a tab. Defaulting to gid=0 looks harmless
  // and is not: a sheet whose first tab was renamed or recreated has no tab 0,
  // and Google answers that with a 400 HTML page rather than the CSV. With no
  // gid it serves the first tab, which is what a bare share link means.
  const gid = url.hash.match(/gid=(\d+)/)?.[1] ?? url.searchParams.get("gid");

  return {
    url:
      `https://${SHEET_HOST}/spreadsheets/d/${id}/export?format=csv` +
      (gid ? `&gid=${gid}` : ""),
  };
}

/**
 * Fetch the CSV, following Google's redirect exactly once.
 *
 * The export endpoint answers 307 with a Location on Google's content CDN, so
 * `redirect: "error"` never returns a sheet — it fails every time. Blindly
 * following redirects instead would hand back the SSRF hole the host check
 * exists to close, so the hop is taken manually and the destination is checked
 * before the second request goes out.
 */
export async function fetchSheetCsv(input: string): Promise<SheetResult> {
  const target = toCsvExportUrl(input);
  if ("error" in target) return target;

  let response: Response;

  try {
    response = await fetch(target.url, {
      redirect: "manual",
      headers: { accept: "text/csv,text/plain" },
    });
  } catch {
    return { error: "Could not reach Google Sheets." };
  }

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) return { error: "Google Sheets returned a redirect with no target." };

    let next: URL;
    try {
      next = new URL(location, target.url);
    } catch {
      return { error: "Google Sheets returned an unreadable redirect." };
    }

    if (
      next.protocol !== "https:" ||
      !(
        next.hostname === SHEET_HOST ||
        next.hostname.endsWith(CONTENT_HOST_SUFFIX)
      )
    ) {
      // the one case worth refusing loudly: something told us to go elsewhere
      return { error: `Refused a redirect to ${next.hostname}.` };
    }

    try {
      // "error" on the second hop: one redirect is Google's export handoff,
      // a chain of them is not something to keep following
      response = await fetch(next.toString(), { redirect: "error" });
    } catch {
      return { error: "Could not reach the Google Sheets export." };
    }
  }

  if (response.status === 404) {
    return { error: "That sheet was not found. Check the link." };
  }

  if (!response.ok) {
    return {
      error:
        'Google refused the request. Share the sheet as "anyone with the link can view".',
    };
  }

  const text = await response.text();

  if (text.trimStart().startsWith("<")) {
    // a sign-in page rather than a sheet
    return {
      error: 'That sheet is private. Share it as "anyone with the link can view".',
    };
  }

  return { text };
}
