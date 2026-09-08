import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness, plus an opt-in database probe.
 *
 * The plain response touches nothing and is what CI polls after a deploy —
 * it must stay fast and must never depend on MongoDB, or a database outage
 * would make a healthy deploy look like a failed one.
 *
 * `?db=1` additionally tries to reach MongoDB and reports *why* it could not.
 * This exists because the three causes of an unreachable Atlas — a blocked
 * outbound port, a blocked DNS lookup for a mongodb+srv:// URI, and bad
 * credentials — are indistinguishable from the outside: all three render as
 * an HTTP 500 on every catalogue page. They are trivially distinguishable
 * from the driver's error code, which is what this returns.
 *
 * It reports an error name and code and nothing else: never the URI, the
 * host, the username, or any part of the connection string. It opens its own
 * short-lived connection with a 4s budget and always closes it, so it cannot
 * tie up the pooled connection the app uses or hold a Passenger worker for
 * long.
 */
async function probeDatabase() {
  const started = Date.now();
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return { status: "not-configured", hint: "MONGODB_URI is not set on this server." };
  }

  const scheme = uri.startsWith("mongodb+srv://")
    ? "mongodb+srv"
    : uri.startsWith("mongodb://")
      ? "mongodb"
      : "unrecognised";

  try {
    const { MongoClient } = await import("mongodb");
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });
    try {
      await client.db().admin().command({ ping: 1 });
      return { status: "ok", scheme, ms: Date.now() - started };
    } finally {
      await client.close().catch(() => {});
    }
  } catch (error) {
    const e = error as { name?: string; code?: unknown; codeName?: string; message?: string };
    // The message can embed the host and, on some driver errors, the user.
    // Only the classification is returned.
    const cause = /queryTxt|querySrv|ENOTFOUND|EAI_AGAIN/i.test(e.message ?? "")
      ? "dns-lookup-failed"
      : /ETIMEDOUT|ECONNREFUSED|ServerSelection/i.test(`${e.name} ${e.message}`)
        ? "cannot-reach-server"
        : /Authentication|not authorized|bad auth/i.test(e.message ?? "")
          ? "authentication-failed"
          : "other";
    return {
      status: "unreachable",
      scheme,
      cause,
      errorName: e.name ?? null,
      codeName: e.codeName ?? null,
      ms: Date.now() - started,
      hint:
        cause === "dns-lookup-failed"
          ? "The host cannot resolve the SRV/TXT records a mongodb+srv:// URI needs. Switch MONGODB_URI to the standard mongodb:// connection string from Atlas (Connect > Drivers > older driver version)."
          : cause === "cannot-reach-server"
            ? "DNS resolved but the connection did not complete. Outbound TCP to port 27017 is most likely blocked by the host; ask support to allow it."
            : cause === "authentication-failed"
              ? "Reached the server; the username or password in MONGODB_URI is wrong, or <password> was never substituted."
              : "Unclassified driver error.",
    };
  }
}

export async function GET(request: Request) {
  const base = {
    status: "ok",
    service: "koreanhive-web",
    time: new Date().toISOString(),
  };

  if (new URL(request.url).searchParams.get("db") !== "1") {
    return NextResponse.json(base);
  }

  return NextResponse.json({ ...base, database: await probeDatabase() });
}
