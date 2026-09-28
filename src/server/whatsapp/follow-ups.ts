import "server-only";

import { followUpCopy } from "@/lib/whatsapp/copy";
import { connectDb } from "@/server/db";
import { Product, WhatsAppChat, type WhatsAppChatDoc } from "@/server/models";
import { sendText } from "@/server/whatsapp/cloud-api";

/**
 * Script 4: one soft follow-up to a customer who went quiet.
 *
 * WhatsApp lets a business send ordinary messages for 24 hours after the
 * customer's last message; after that only paid, pre-approved templates. So
 * the follow-up goes out 18–23 hours after they last wrote — late enough not
 * to nag, early enough to still be free and allowed. A cron job calls this
 * every 30 minutes, so each chat is seen at least once in that window.
 *
 * Sent at most once per silence: a new customer message resets it. Never sent
 * when a person has the chat, when the owner already replied by hand, after an
 * order was handed to staff, or for a product that is out of stock.
 *
 * "Only N left" is said only when it is true — real stock, three or fewer.
 */

const HOUR = 60 * 60 * 1000;
const WINDOW_START = 18 * HOUR;
const WINDOW_END = 23 * HOUR;
const LOW_STOCK = 3;
const BATCH = 200;

export type FollowUpReport = { checked: number; sent: number };

function due(chat: WhatsAppChatDoc, now: Date): boolean {
  const lastCustomer = chat.lastCustomerAt;
  if (!lastCustomer || !chat.focusSlug) return false;

  // the bot spoke last — the customer is the one who went quiet
  if (!chat.lastBotAt || chat.lastBotAt < lastCustomer) return false;

  if (chat.followUpSentAt && chat.followUpSentAt >= lastCustomer) return false;
  if (chat.handoffUntil && chat.handoffUntil > now) return false;
  if (chat.handoffAt && chat.handoffAt >= lastCustomer) return false;
  if (chat.lastStaffAt && chat.lastStaffAt >= lastCustomer) return false;

  return true;
}

export async function sendDueFollowUps(now = new Date()): Promise<FollowUpReport> {
  await connectDb();

  const candidates = await WhatsAppChat.find({
    lastCustomerAt: {
      $gte: new Date(now.getTime() - WINDOW_END),
      $lte: new Date(now.getTime() - WINDOW_START),
    },
    focusSlug: { $ne: null },
  })
    .limit(BATCH)
    .lean<WhatsAppChatDoc[]>();

  let sent = 0;

  for (const chat of candidates) {
    if (!due(chat, now)) continue;

    const product = await Product.findOne({ slug: chat.focusSlug, isActive: true })
      .select("name stock")
      .lean();

    if (!product || product.stock <= 0) continue;

    // Claimed before sending, so two overlapping cron runs cannot both send.
    const claimed = await WhatsAppChat.updateOne(
      {
        _id: chat._id,
        $or: [{ followUpSentAt: null }, { followUpSentAt: { $lt: chat.lastCustomerAt } }],
      },
      { $set: { followUpSentAt: now } },
    );
    if (claimed.modifiedCount === 0) continue;

    const text = followUpCopy(
      chat.language ?? "en",
      chat.name ?? null,
      product.name,
      product.stock <= LOW_STOCK ? product.stock : null,
    );

    const result = await sendText(chat.waId, text);
    if (!result.sent) continue;

    sent += 1;
    await WhatsAppChat.updateOne(
      { _id: chat._id },
      {
        $set: { lastBotAt: new Date() },
        $push: {
          history: { $each: [{ role: "bot", text, at: new Date() }], $slice: -20 },
          ...(result.id ? { sentIds: { $each: [result.id], $slice: -50 } } : {}),
        },
      },
    );
  }

  return { checked: candidates.length, sent };
}
