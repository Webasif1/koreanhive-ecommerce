import { after } from "next/server";

import { parseWebhook } from "@/lib/whatsapp/payload";
import { safeEqual, verifySignature } from "@/lib/whatsapp/signature";
import { handleEcho, handleInbound } from "@/server/whatsapp/handle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Meta's payloads are a few KB; anything this size is not from Meta. */
const MAX_BODY = 1_000_000;

/**
 * The WhatsApp Cloud API webhook.
 *
 * GET is Meta's one-time check when the callback URL is saved: echo the
 * challenge back if the verify token matches the one set in the Meta app.
 *
 * POST is every customer message. The body is verified against the app
 * secret before anything reads it, the reply is scheduled with after(), and
 * Meta gets its 200 straight away — a slow answer makes Meta retry, and a
 * retry is a duplicate reply.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (mode === "subscribe" && expected && token && challenge && safeEqual(token, expected)) {
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response("Too large", { status: 413 });

  const valid = verifySignature(
    raw,
    request.headers.get("x-hub-signature-256"),
    process.env.WHATSAPP_APP_SECRET?.trim(),
  );
  if (!valid) return new Response("Invalid signature", { status: 401 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages, echoes } = parseWebhook(body);

  if (messages.length > 0 || echoes.length > 0) {
    after(() =>
      Promise.all([...echoes.map(handleEcho), ...messages.map(handleInbound)]).then(() => undefined),
    );
  }

  return new Response("OK", { status: 200 });
}
