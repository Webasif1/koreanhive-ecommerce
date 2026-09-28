import "server-only";

import { normalizeBdPhone } from "@/lib/bd-districts";
import { parseSlots } from "@/lib/chatbot/slots";
import type { Slots } from "@/lib/chatbot/types";
import { escapeHtml } from "@/lib/email/templates";
import { absoluteUrl } from "@/lib/site";
import { nonTextCopy } from "@/lib/whatsapp/copy";
import type { EchoMessage, InboundMessage } from "@/lib/whatsapp/payload";
import {
  runSalesTurn,
  wantsOrderStatus,
  type HandoffReason,
  type LatestOrder,
  type SalesState,
  type SalesTurn,
} from "@/lib/whatsapp/sales";
import { geminiEnabled, understand } from "@/server/chat/gemini";
import { connectDb } from "@/server/db";
import { sendMail, shopInbox } from "@/server/email/transport";
import { Order, WhatsAppChat, type WhatsAppChatDoc } from "@/server/models";
import { getChatCatalog, getPolicyFacts } from "@/server/queries/chatbot";
import { rateLimit } from "@/server/rate-limit";
import { markRead, sendText } from "@/server/whatsapp/cloud-api";
import { phraseForWhatsApp } from "@/server/whatsapp/phrase";

/**
 * Answers one WhatsApp message. Runs inside after(), once the webhook has
 * already told Meta "200 OK" — Meta retries a webhook that is slow to answer,
 * and a retry would be a second reply.
 *
 * Nothing here throws to the caller: a failed database write or send is
 * logged and the message is dropped, which at worst means the owner answers
 * it by hand from the phone, as they would have without the bot.
 */

/** How long the bot stays quiet once a person has taken over a chat. */
const HANDOFF_MS = 12 * 60 * 60 * 1000;

/** Per customer. A person typing fast sends maybe ten; a loop sends hundreds. */
const RATE_MAX = 20;
const RATE_WINDOW_MS = 5 * 60 * 1000;

const HISTORY_KEEP = 20;
const IDS_KEEP = 50;
const MAX_INBOUND = 1000;

/**
 * One queue per customer. Three messages sent in a burst arrive as three
 * webhooks at once; answered in parallel, they would read the same state and
 * talk over each other. Chained, each turn sees the one before it.
 *
 * In-process, so it holds for one Node process — which is what cPanel's
 * Passenger runs for a site this size.
 */
const queues = new Map<string, Promise<void>>();

function serialize(key: string, task: () => Promise<void>): Promise<void> {
  const previous = queues.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(task);
  queues.set(key, current);

  void current
    .catch(() => undefined)
    .finally(() => {
      if (queues.get(key) === current) queues.delete(key);
    });

  return current;
}

function cleanName(name: string | null): string | null {
  const cleaned = name?.replace(/\p{C}/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
  return cleaned || null;
}

function stateOf(doc: WhatsAppChatDoc | null): SalesState {
  return {
    language: doc?.language ?? null,
    stage: doc?.stage ?? "idle",
    focusSlug: doc?.focusSlug ?? null,
    priceAsks: doc?.priceAsks ?? 0,
    qualified: doc?.qualified ?? false,
    misses: doc?.misses ?? 0,
    greeted: doc?.history?.some((turn) => turn.role === "bot") ?? false,
    slots: parseSlots(doc?.slots),
  };
}

/** Slots the conversation already established, so a model miss keeps them. */
function withoutEmpty(slots: Slots): Partial<Slots> {
  const kept: Partial<Slots> = {};
  if (slots.concerns.length > 0) kept.concerns = slots.concerns;
  if (slots.useCases.length > 0) kept.useCases = slots.useCases;
  if (slots.skinType) kept.skinType = slots.skinType;
  if (slots.category) kept.category = slots.category;
  if (slots.budgetMax !== null) kept.budgetMax = slots.budgetMax;
  return kept;
}

/**
 * The customer's latest order. Their WhatsApp number is verified by WhatsApp
 * itself, so reporting an order placed with that same number tells them
 * nothing they could not already see on /track.
 */
async function latestOrderFor(waId: string): Promise<LatestOrder | null> {
  // Bangladeshi numbers only: 880 + 10 digits
  if (!/^8801\d{9}$/.test(waId)) return null;

  const order = await Order.findOne({
    customerPhone: normalizeBdPhone(waId),
    deletedAt: null,
  })
    .sort({ placedAt: -1 })
    .select("orderNumber status")
    .lean();

  return order ? { orderNumber: order.orderNumber, status: order.status } : null;
}

// ------------------------------------------------------------- hand-off

const REASON_LABEL: Record<HandoffReason, string> = {
  order: "New order request",
  human: "Customer wants to talk to a person",
  complaint: "Complaint",
  "order-status": "Order status — no order found for this number",
  unclear: "The bot could not understand the customer",
};

async function notifyShop(opts: {
  waId: string;
  name: string | null;
  reason: HandoffReason;
  details: string | null;
  focus: string | null;
  history: { role: "customer" | "bot"; text: string }[];
}) {
  const to = shopInbox();
  if (!to) {
    console.warn("[whatsapp] hand-off not emailed: no shop inbox configured");
    return;
  }

  const who = opts.name ? `${opts.name} (+${opts.waId})` : `+${opts.waId}`;
  const chatLink = `https://wa.me/${opts.waId}`;
  const newOrder = absoluteUrl("/admin/orders/new");
  const product = opts.focus ? absoluteUrl(`/product/${opts.focus}`) : null;

  const transcript = opts.history
    .slice(-10)
    .map((turn) => `${turn.role === "customer" ? "Customer" : "Bot"}: ${turn.text}`)
    .join("\n\n");

  const lines = [
    `${REASON_LABEL[opts.reason]} on WhatsApp.`,
    `Customer: ${who}`,
    product ? `Product: ${product}` : null,
    opts.details ? `\nWhat they sent:\n${opts.details}` : null,
    `\nReply on WhatsApp: ${chatLink}`,
    opts.reason === "order" ? `Create the order: ${newOrder}` : null,
    `\nThe bot stays quiet in this chat for the next 12 hours.`,
    `\n--- Recent messages ---\n${transcript}`,
  ].filter((line): line is string => line !== null);

  const text = lines.join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(text)}</div>`;

  const result = await sendMail({
    to,
    subject: `WhatsApp: ${REASON_LABEL[opts.reason]} — ${who}`,
    text,
    html,
  }).catch((error: unknown) => ({ ok: false as const, error: String(error) }));

  if (!result.ok) console.error("[whatsapp] hand-off email failed:", result.error);
}

// ------------------------------------------------------------- inbound

/** Records the id; false if this message was already handled (a retry). */
async function claim(waId: string, messageId: string): Promise<boolean> {
  try {
    const result = await WhatsAppChat.updateOne(
      { waId, processedIds: { $ne: messageId } },
      { $push: { processedIds: { $each: [messageId], $slice: -IDS_KEEP } } },
      { upsert: true },
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  } catch (error) {
    // the id is already in the array, so the filter missed and the upsert
    // collided with the existing chat on the unique waId
    if ((error as { code?: number }).code === 11000) return false;
    throw error;
  }
}

async function answer(message: InboundMessage) {
  const expectedNumber = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (expectedNumber && message.phoneNumberId && message.phoneNumberId !== expectedNumber) return;

  await connectDb();

  if (!(await claim(message.from, message.id))) return;

  if (!rateLimit(`whatsapp:${message.from}`, RATE_MAX, RATE_WINDOW_MS)) return;

  void markRead(message.id);

  const now = new Date();
  const doc = await WhatsAppChat.findOne({ waId: message.from }).lean<WhatsAppChatDoc>();
  const name = cleanName(message.name) ?? doc?.name ?? null;
  const text = message.text?.replace(/\p{C}/gu, " ").trim().slice(0, MAX_INBOUND) || null;

  const customerTurn = {
    role: "customer" as const,
    text: text ?? `[${message.type}]`,
    at: now,
  };

  // A person has the chat: record the message, say nothing.
  if (doc?.handoffUntil && doc.handoffUntil > now) {
    await WhatsAppChat.updateOne(
      { waId: message.from },
      {
        $set: { name, lastCustomerAt: now },
        $push: { history: { $each: [customerTurn], $slice: -HISTORY_KEEP } },
      },
    );
    return;
  }

  const state = stateOf(doc);
  let turn: Pick<SalesTurn, "reply" | "kind" | "language" | "handoff" | "rephrase"> & {
    state: SalesState;
  };

  if (!text) {
    // a photo, voice note or sticker — the owner sees it in the app
    const language = state.language ?? "en";
    turn = {
      reply: nonTextCopy(language),
      kind: "fallback",
      language,
      state,
      handoff: null,
      rephrase: false,
    };
  } else {
    const [catalog, policy] = await Promise.all([getChatCatalog(), getPolicyFacts()]);

    // Gemini's reading of the message is merged under what the conversation
    // already knew, and re-validated like any untrusted input.
    const understood = geminiEnabled() ? await understand(text) : null;
    const slots = understood
      ? { ...parseSlots(understood), ...withoutEmpty(state.slots) }
      : state.slots;

    turn = runSalesTurn({
      message: text,
      name,
      state: { ...state, slots },
      catalog,
      policy,
      latestOrder: wantsOrderStatus(text) ? await latestOrderFor(message.from) : undefined,
    });
  }

  const history = (doc?.history ?? []).map(({ role, text: said }) => ({ role, text: said }));

  const reply =
    turn.rephrase && text
      ? await phraseForWhatsApp({
          draft: turn.reply,
          kind: turn.kind,
          language: turn.language,
          customerMessage: text,
          history,
        })
      : turn.reply;

  const sent = await sendText(message.from, reply);
  const repliedAt = new Date();

  const set: Record<string, unknown> = {
    name,
    language: turn.state.language,
    stage: turn.state.stage,
    focusSlug: turn.state.focusSlug,
    priceAsks: turn.state.priceAsks,
    qualified: turn.state.qualified,
    misses: turn.state.misses,
    slots: turn.state.slots,
    lastCustomerAt: now,
    lastBotAt: repliedAt,
  };

  if (turn.handoff) {
    set.handoffUntil = new Date(repliedAt.getTime() + HANDOFF_MS);
    set.handoffAt = repliedAt;
    set.handoffReason = turn.handoff.reason;
  }

  const push: Record<string, unknown> = {
    history: {
      $each: [customerTurn, { role: "bot", text: reply, at: repliedAt }],
      $slice: -HISTORY_KEEP,
    },
  };
  if (sent.id) push.sentIds = { $each: [sent.id], $slice: -IDS_KEEP };

  await WhatsAppChat.updateOne({ waId: message.from }, { $set: set, $push: push });

  if (turn.handoff) {
    await notifyShop({
      waId: message.from,
      name,
      reason: turn.handoff.reason,
      details: turn.handoff.details,
      focus: turn.state.focusSlug,
      history: [...history, { role: "customer", text: customerTurn.text }, { role: "bot", text: reply }],
    });
  }
}

export function handleInbound(message: InboundMessage): Promise<void> {
  return serialize(message.from, () =>
    answer(message).catch((error) => {
      console.error("[whatsapp] could not answer a message", error);
    }),
  );
}

/**
 * The owner replied by hand from the WhatsApp Business app (coexistence).
 * The bot steps back from that chat so it does not talk over them.
 */
export function handleEcho(echo: EchoMessage): Promise<void> {
  // same queue as the customer's messages, so the bot's own send has been
  // recorded in sentIds before its echo is checked against them
  return serialize(echo.to, async () => {
    try {
      await connectDb();

      const doc = await WhatsAppChat.findOne({ waId: echo.to })
        .select("sentIds")
        .lean<Pick<WhatsAppChatDoc, "sentIds">>();

      if (echo.id && doc?.sentIds?.includes(echo.id)) return;

      const now = new Date();
      await WhatsAppChat.updateOne(
        { waId: echo.to },
        {
          $set: {
            lastStaffAt: now,
            handoffUntil: new Date(now.getTime() + HANDOFF_MS),
            handoffAt: now,
            handoffReason: "staff-replied",
          },
        },
        { upsert: true },
      );
    } catch (error) {
      console.error("[whatsapp] could not record a staff reply", error);
    }
  });
}
