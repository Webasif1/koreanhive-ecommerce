import { NextResponse } from "next/server";

import { runChatTurn } from "@/lib/chatbot";
import { parseSlots } from "@/lib/chatbot/slots";
import type { Slots } from "@/lib/chatbot/types";
import {
  geminiEnabled,
  phraseResponse,
  understand,
} from "@/server/chat/gemini";
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
/** Slots the conversation has actually established, so merging keeps them.
 *  An empty list or a null is "not known", not "known to be nothing". */
function withoutEmpty(slots: Slots): Partial<Slots> {
  const kept: Partial<Slots> = {};

  if (slots.concerns.length > 0) kept.concerns = slots.concerns;
  if (slots.useCases.length > 0) kept.useCases = slots.useCases;
  if (slots.skinType) kept.skinType = slots.skinType;
  if (slots.category) kept.category = slots.category;
  if (slots.budgetMax !== null) kept.budgetMax = slots.budgetMax;

  return kept;
}

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

    const carried = parseSlots(raw.slots);

    // Gemini reads the message into slots; the keyword engine reads it too.
    // The model's answer goes through parseSlots exactly like the client's
    // does — it is untrusted input from outside, not a privileged caller — so
    // an invented concern or an injected instruction becomes "nothing
    // recognised" rather than a bad query.
    //
    // Whatever Gemini finds is merged under what the conversation already
    // knew, so a model miss never erases a slot the shopper actually gave us.
    const understood = geminiEnabled() ? await understand(message) : null;

    const slots = understood
      ? { ...parseSlots(understood), ...withoutEmpty(carried) }
      : carried;

    const response = runChatTurn({ message, slots }, catalog, policy);

    // Products, prices, links and intent are already decided. Only the wording
    // is handed to the model, and only when it is not a safety reply.
    const phrased = geminiEnabled()
      ? await phraseResponse(response, message)
      : response;

    return NextResponse.json(phrased, {
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
