import { NextResponse } from "next/server";

import { safeEqual } from "@/lib/whatsapp/signature";
import { sendDueFollowUps } from "@/server/whatsapp/follow-ups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sends the WhatsApp follow-ups that are due. Called every 30 minutes by a
 * cPanel cron job:
 *
 *   curl -s -X POST -H "Authorization: Bearer $WHATSAPP_CRON_SECRET" https://koreanhive.com/api/whatsapp/follow-ups
 *
 * Refuses everyone when the secret is not set, so a forgotten variable means
 * no follow-ups rather than an open endpoint.
 */
async function run(request: Request) {
  const secret = process.env.WHATSAPP_CRON_SECRET?.trim();
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

  if (!secret || !given || !safeEqual(given, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await sendDueFollowUps();
    return NextResponse.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[whatsapp] follow-ups failed", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
