import { NextResponse } from "next/server";

import { runChatTurn } from "@/lib/chatbot";
import { parseSlots } from "@/lib/chatbot/slots";
import { getChatCatalog, getPolicyFacts } from "@/server/queries/chatbot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 500;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

/** Per-instance throttle, the same shape as the order-tracking one in
 *  server/actions/track.ts — memory-local, so a serverless fleet gives each
 *  instance its own budget. Enough for an endpoint that writes nothing. */
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) return false;

  entry.count += 1;
  return true;
}

/**
 * The shop assistant.
 *
 * Stateless by design: conversation memory lives in the client and arrives as
 * `slots`, which parseSlots re-validates against the taxonomy on the way in.
 * Nothing about a shopper is stored, so there is no chat history to leak — and
 * a forged payload can only ever give the forger a worse recommendation.
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  if (typeof raw.message !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // \p{C} is every Unicode "other" character — controls, format characters,
  // unpaired surrogates. Stripped rather than rejected, because they are
  // almost always a paste artefact rather than an attack. The engine only
  // matches on this text; the browser renders its own copy of what was typed.
  const message = raw.message
    .replace(/\p{C}/gu, " ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);

  if (message.length === 0) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const [catalog, policy] = await Promise.all([getChatCatalog(), getPolicyFacts()]);

    const response = runChatTurn({ message, slots: parseSlots(raw.slots) }, catalog, policy);

    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    // never let a database error, a stack trace or a connection string reach
    // the browser
    console.error("[chat]", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
