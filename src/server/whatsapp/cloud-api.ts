import "server-only";

import { META_GRAPH_API_VERSION } from "@/lib/tracking/config";

/**
 * The WhatsApp Cloud API, reduced to the two calls the bot makes.
 *
 * Without WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID nothing is sent:
 * the reply is logged instead, so the whole bot can be exercised locally
 * before the Meta app exists. Errors are logged by status only — a Graph API
 * error body can echo the request, which holds a customer's number.
 */

const TIMEOUT_MS = 10_000;

function config() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  return token && phoneNumberId ? { token, phoneNumberId } : null;
}

export function whatsappConfigured() {
  return config() !== null;
}

/** The parsed response on success, null on any failure. */
async function post(body: object): Promise<Record<string, unknown> | null> {
  const auth = config();
  if (!auth) return null;

  try {
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${auth.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.token}`,
          "content-type": "application/json",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
      },
    );

    if (!response.ok) {
      console.error("[whatsapp] Graph API HTTP", response.status);
      return null;
    }

    return ((await response.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  } catch (error) {
    console.error("[whatsapp]", error instanceof Error ? error.name : "unknown error");
    return null;
  }
}

/** WhatsApp caps a text message at 4096 characters. */
const MAX_TEXT = 4096;

export type SendResult = { sent: boolean; id: string | null };

/**
 * Sends a text message. The returned id is how the bot later recognises its
 * own message if Meta echoes it back, so it is never mistaken for the owner
 * replying by hand.
 */
export async function sendText(to: string, text: string): Promise<SendResult> {
  const body = text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;

  if (!config()) {
    console.info(`[whatsapp] not configured — would send to ${to}:\n${body}`);
    return { sent: false, id: null };
  }

  const response = await post({
    recipient_type: "individual",
    to,
    type: "text",
    text: { body, preview_url: true },
  });

  if (!response) return { sent: false, id: null };

  const first = Array.isArray(response.messages) ? response.messages[0] : null;
  const id = first && typeof first === "object" && typeof (first as { id?: unknown }).id === "string"
    ? (first as { id: string }).id
    : null;

  return { sent: true, id };
}

/** Blue ticks, plus the "typing…" indicator while the reply is prepared. */
export async function markRead(messageId: string): Promise<void> {
  await post({
    status: "read",
    message_id: messageId,
    typing_indicator: { type: "text" },
  });
}
