/**
 * Reads a WhatsApp Cloud API webhook body.
 *
 * Meta posts one shape for everything — customer messages, delivery
 * statuses, and (for a number onboarded with coexistence) "echoes" of
 * messages the owner sent from the WhatsApp Business app on their phone. Only
 * the first and last matter here: a message to answer, and a sign that a
 * person has taken over the chat.
 *
 * The body has already passed the signature check, but it is still parsed
 * defensively: any field can be missing on a message type this code has never
 * seen, and that must mean "skip it", never an exception.
 */

export type InboundMessage = {
  id: string;
  /** The customer's WhatsApp ID — their number in international form, no plus. */
  from: string;
  name: string | null;
  /** Null for images, voice notes, stickers and anything else without text. */
  text: string | null;
  type: string;
  /** The business number it was sent to. */
  phoneNumberId: string | null;
};

/** A message sent from the business number, and who it went to. */
export type EchoMessage = { id: string | null; to: string };

export type WebhookEvents = {
  messages: InboundMessage[];
  /** Messages the owner just sent by hand, from the WhatsApp Business app. */
  echoes: EchoMessage[];
};

type Json = Record<string, unknown>;

const obj = (value: unknown): Json | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : null;
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

/** The words a customer "said", whatever kind of message carried them. */
function textOf(message: Json): string | null {
  switch (message.type) {
    case "text":
      return str(obj(message.text)?.body);
    case "button":
      return str(obj(message.button)?.text);
    case "interactive": {
      const interactive = obj(message.interactive);
      return (
        str(obj(interactive?.button_reply)?.title) ?? str(obj(interactive?.list_reply)?.title)
      );
    }
    default:
      return null;
  }
}

export function parseWebhook(body: unknown): WebhookEvents {
  const events: WebhookEvents = { messages: [], echoes: [] };
  const root = obj(body);
  if (!root) return events;

  for (const entry of arr(root.entry)) {
    for (const change of arr(obj(entry)?.changes)) {
      const field = obj(change)?.field;
      const value = obj(obj(change)?.value);
      if (!value) continue;

      if (field === "messages") {
        const phoneNumberId = str(obj(value.metadata)?.phone_number_id);

        const names = new Map<string, string>();
        for (const contact of arr(value.contacts)) {
          const waId = str(obj(contact)?.wa_id);
          const name = str(obj(obj(contact)?.profile)?.name);
          if (waId && name) names.set(waId, name);
        }

        for (const raw of arr(value.messages)) {
          const message = obj(raw);
          const id = str(message?.id);
          const from = str(message?.from);
          if (!message || !id || !from) continue;

          events.messages.push({
            id,
            from,
            name: names.get(from) ?? null,
            text: textOf(message),
            type: str(message.type) ?? "unknown",
            phoneNumberId,
          });
        }
      }

      if (field === "smb_message_echoes") {
        for (const raw of arr(value.message_echoes)) {
          const to = str(obj(raw)?.to);
          if (to) events.echoes.push({ id: str(obj(raw)?.id), to });
        }
      }
    }
  }

  return events;
}
