"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Types, type UpdateQuery } from "mongoose";

import { buildPreview, readRows } from "@/lib/import/parse";
import type { ImportFormat, ImportState, ProductFields } from "@/lib/import/types";
import { requireAdmin } from "@/server/admin-guard";
import { connectDb } from "@/server/db";
import { Product, type ProductDoc } from "@/server/models";
import { isGoogleSheetRedirectTarget } from "@/lib/google-sheet";
import { getImportLookups } from "@/server/queries/import";

/**
 * Bulk product import.
 *
 * Two steps over one pipeline: preview decides, apply writes. Both run the
 * same parse-and-validate code over the same text, and nothing is held between
 * them — the client re-submits the file to apply it. That means there is no
 * stored payload to approve and then swap, and no temp file to clean up.
 */

const MAX_BYTES = 4 * 1024 * 1024;
const SHEET_TIMEOUT_MS = 10_000;

/** Google's CSV export endpoint for a link-shared sheet. */
const SHEET_HOST = "docs.google.com";

function fail(message: string): ImportState {
  return { ok: false, message, preview: null, applied: null };
}

/**
 * Parsed fields into a Mongo `$set`.
 *
 * The validator resolves brands and categories to id strings because it is
 * pure and knows nothing about mongoose; the ObjectId conversion belongs here,
 * done explicitly rather than left to Mongoose's implicit cast — an implicit
 * one fails silently on a malformed id.
 */
function toUpdate(fields: Partial<ProductFields>): UpdateQuery<ProductDoc> {
  const { brandId, categoryId, ...rest } = fields;
  const update: UpdateQuery<ProductDoc> = { ...rest };

  // undefined means the column was absent and must not be touched; null means
  // the row deliberately clears the link
  if (brandId !== undefined) {
    update.brandId = brandId ? new Types.ObjectId(brandId) : null;
  }
  if (categoryId !== undefined) {
    update.categoryId = categoryId ? new Types.ObjectId(categoryId) : null;
  }

  return update;
}

async function readUpload(formData: FormData): Promise<
  { text: string; format: ImportFormat } | { error: string }
> {
  const sheetUrl = String(formData.get("sheetUrl") ?? "").trim();

  if (sheetUrl.length > 0) {
    const fetched = await fetchSheet(sheetUrl);
    return "error" in fetched ? fetched : { text: fetched.text, format: "csv" };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV or JSON file, or paste a Google Sheets link." };
  }

  if (file.size > MAX_BYTES) {
    return { error: "That file is over 4MB. Split it and import in batches." };
  }

  const format: ImportFormat = file.name.toLowerCase().endsWith(".json") ? "json" : "csv";

  return { text: await file.text(), format };
}

/**
 * Turns a normal Google Sheets URL into its CSV export and fetches it.
 *
 * The host allowlist is the security control here, not decoration. Without it
 * this is an admin-triggered fetch of any URL — a probe into whatever the
 * server can reach, including cloud metadata endpoints and internal services.
 * Matching on an exact hostname refuses all of that. Google's own 307 to its
 * content CDN is the one hop allowed through, and its destination is checked
 * before the second request goes out.
 */
async function fetchSheet(input: string): Promise<{ text: string } | { error: string }> {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return { error: "That does not look like a URL." };
  }

  if (url.protocol !== "https:" || url.hostname !== SHEET_HOST) {
    return { error: "Only https://docs.google.com sheet links can be synced." };
  }

  const id = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];

  if (!id) {
    return { error: "That is not a Google Sheets link — it needs /spreadsheets/d/…" };
  }

  // The tab id lives in the fragment on a normal share link, and in the query
  // on a "publish to web" one. Left off entirely when the link names no tab:
  // defaulting to gid=0 breaks any sheet whose first tab was renamed or
  // recreated, because there is then no tab 0 and Google answers 400.
  const gid = url.hash.match(/gid=(\d+)/)?.[1] ?? url.searchParams.get("gid");

  const exportUrl =
    `https://${SHEET_HOST}/spreadsheets/d/${id}/export?format=csv` +
    (gid ? `&gid=${gid}` : "");

  try {
    let response = await fetch(exportUrl, {
      // Google answers the export with a 307 to a per-request
      // *.googleusercontent.com host, so "error" here refused every sheet.
      // The hop is taken manually and its destination checked, rather than
      // following redirects freely — that would undo the host allowlist above.
      redirect: "manual",
      signal: AbortSignal.timeout(SHEET_TIMEOUT_MS),
      cache: "no-store",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");

      if (!location || !isGoogleSheetRedirectTarget(location, exportUrl)) {
        return { error: "Google Sheets redirected somewhere unexpected." };
      }

      response = await fetch(new URL(location, exportUrl).toString(), {
        redirect: "error",
        signal: AbortSignal.timeout(SHEET_TIMEOUT_MS),
        cache: "no-store",
      });
    }

    if (!response.ok) {
      return {
        error:
          response.status === 404 || response.status === 403
            ? "Could not read that sheet. Share it as “Anyone with the link can view”."
            : `The sheet could not be read (HTTP ${response.status}).`,
      };
    }

    const text = await response.text();

    if (text.length > MAX_BYTES) {
      return { error: "That sheet is too large to import in one go." };
    }

    // a sheet that is not link-shared returns Google's sign-in page, with a
    // 200, so the status alone does not prove we got a CSV
    if (text.trimStart().startsWith("<")) {
      return { error: "That sheet is not shared publicly — Google returned a login page." };
    }

    return { text };
  } catch {
    return { error: "Could not reach Google Sheets. Check the link and try again." };
  }
}

/** Reads the file and reports what would happen. Writes nothing. */
async function preview(formData: FormData): Promise<ImportState> {

  const source = await readUpload(formData);
  if ("error" in source) return fail(source.error);

  const { rows, error } = readRows(source.text, source.format);
  if (error) return fail(error);
  if (rows.length === 0) return fail("That file has no product rows.");

  const result = buildPreview(rows, await getImportLookups());

  const { create, update, unchanged, error: errors } = result.counts;

  return {
    ok: create + update > 0,
    message: `${create} to create, ${update} to update, ${unchanged} unchanged, ${errors} with errors.`,
    preview: result,
    applied: null,
  };
}

/**
 * Writes the clean rows.
 *
 * Deliberately not a transaction. Checkout uses one because a half-written
 * order is corruption; a half-written import is just a partial import, and
 * because every write is an upsert keyed on slug, re-running the corrected
 * file converges rather than duplicating.
 */
async function apply(formData: FormData): Promise<ImportState> {
  const source = await readUpload(formData);
  if ("error" in source) return fail(source.error);

  const { rows, error } = readRows(source.text, source.format);
  if (error) return fail(error);

  // re-validated rather than trusted: the preview the operator saw is not the
  // payload being written, so the decision is made again from the file itself
  const result = buildPreview(rows, await getImportLookups());

  // Rows that match the catalogue exactly are skipped rather than rewritten.
  // Writing them would bump `updatedAt` on every untouched product, and the
  // sitemap sorts on that (queries/catalog.ts) — so re-importing a full
  // catalogue would churn every lastModified date for no reason.
  const writes = result.rows.filter(
    (row): row is Extract<typeof row, { status: "create" | "update" }> =>
      row.status === "create" || (row.status === "update" && row.changes.length > 0),
  );

  if (writes.length === 0) {
    return {
      ok: false,
      message:
        result.counts.unchanged > 0
          ? "Nothing to apply — every row already matches the catalogue."
          : "Nothing to apply — every row had an error.",
      preview: result,
      applied: null,
    };
  }

  await connectDb();

  const operations = writes.map((row) => ({
    updateOne: {
      filter: { slug: row.slug },
      update: {
        $set: toUpdate(row.fields),
        // only stamped when the row creates the product, so an update never
        // rewrites the slug of one that already exists
        $setOnInsert: { slug: row.slug },
      },
      upsert: true,
    },
  }));

  // ordered:false so one rejected write cannot abort the rest of the file
  const written = await Product.bulkWrite(operations, { ordered: false });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  // search suggestions, cart recommendations and the chat catalogue all read
  // through unstable_cache entries tagged "products"
  revalidateTag("products", "max");

  const created = written.upsertedCount ?? 0;

  return {
    ok: true,
    message: `Imported ${created} new and updated ${writes.length - created}.`,
    preview: result,
    applied: { created, updated: writes.length - created },
  };
}

/**
 * The single endpoint behind the import screen.
 *
 * One action rather than two because every export from a "use server" module
 * is an addressable endpoint in its own right, and "apply" is the one that
 * writes. The submit button that was clicked carries the intent.
 */
export async function importAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireAdmin();

  return String(formData.get("intent") ?? "") === "apply"
    ? apply(formData)
    : preview(formData);
}
