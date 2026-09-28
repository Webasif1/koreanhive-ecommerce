/**
 * Date ranges and chart buckets for the admin dashboard.
 *
 * Every bucket key is computed on the Asia/Dhaka calendar — the same one the
 * Mongo aggregation groups on — so an order placed at 01:00 Dhaka time lands
 * on the day the shop saw it, not the UTC day before.
 */

export const SALES_RANGES = ["7d", "30d", "90d", "12m"] as const;
export type SalesRange = (typeof SALES_RANGES)[number];

export const SALES_RANGE_LABEL: Record<SalesRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  "12m": "12 months",
};

const TZ = "Asia/Dhaka";

export function parseSalesRange(raw: string | undefined): SalesRange {
  return (SALES_RANGES as readonly string[]).includes(raw ?? "")
    ? (raw as SalesRange)
    : "30d";
}

export type RangeWindow = {
  /** start of the current window */
  since: Date;
  /** start of the equal-length window before it, for the trend */
  previousSince: Date;
  /** Mongo $dateToString format the aggregation groups on */
  bucketFormat: "%Y-%m-%d" | "%Y-%m";
  /** ordered bucket keys with their axis labels, oldest first */
  buckets: { key: string; label: string }[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
  }).format(date);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    month: "short",
  }).format(date);
}

export function rangeWindow(range: SalesRange, now = new Date()): RangeWindow {
  if (range === "12m") {
    // twelve calendar months ending with this one; walk back from mid-month
    // so short months never skip or repeat a key
    const buckets: { key: string; label: string }[] = [];
    const [year, month] = dayKey(now).split("-").map(Number);

    for (let i = 11; i >= 0; i--) {
      const probe = new Date(Date.UTC(year, month - 1 - i, 15));
      buckets.push({ key: dayKey(probe).slice(0, 7), label: monthLabel(probe) });
    }

    const [firstYear, firstMonth] = buckets[0].key.split("-").map(Number);
    // midnight Dhaka on the 1st is 18:00 UTC the day before
    const since = new Date(Date.UTC(firstYear, firstMonth - 1, 1) - 6 * 60 * 60 * 1000);
    const previousSince = new Date(
      Date.UTC(firstYear - 1, firstMonth - 1, 1) - 6 * 60 * 60 * 1000,
    );

    return { since, previousSince, bucketFormat: "%Y-%m", buckets };
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const buckets: { key: string; label: string }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * DAY_MS);
    buckets.push({ key: dayKey(date), label: dayLabel(date) });
  }

  const [y, m, d] = buckets[0].key.split("-").map(Number);
  const since = new Date(Date.UTC(y, m - 1, d) - 6 * 60 * 60 * 1000);
  const previousSince = new Date(since.getTime() - days * DAY_MS);

  return { since, previousSince, bucketFormat: "%Y-%m-%d", buckets };
}

/** Percentage change, or null when there is nothing to compare against. */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
