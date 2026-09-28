import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { siteConfig } from "@/lib/site";

/**
 * Gmail over SMTP, with the shop account's app password.
 *
 * GOOGLE_USER_PASSWORD is a Google *app password* (Account → Security →
 * 2-Step Verification → App passwords), never the account's real password —
 * Gmail refuses a plain password over SMTP.
 *
 * Host and port are overridable because shared cPanel hosts sometimes block
 * outbound 465; SMTP_PORT=587 switches to STARTTLS.
 */

let transporter: Transporter | null = null;
let warned = false;

function credentials() {
  const user = process.env.GOOGLE_USER_EMAIL;
  const pass = process.env.GOOGLE_USER_PASSWORD?.replace(/\s+/g, "");
  return user && pass ? { user, pass } : null;
}

function getTransporter() {
  const auth = credentials();
  if (!auth) return null;

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port,
      secure: port === 465,
      auth,
    });
  }

  return transporter;
}

/** Where staff notifications go: the shop inbox unless overridden. */
export function shopInbox() {
  return process.env.ORDER_NOTIFY_EMAIL || process.env.GOOGLE_USER_EMAIL || null;
}

export async function sendMail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
}) {
  const transport = getTransporter();

  if (!transport) {
    // dev and CI run without Gmail; say so once rather than on every order
    if (!warned) {
      console.warn("[email] GOOGLE_USER_EMAIL / GOOGLE_USER_PASSWORD not set — emails are skipped");
      warned = true;
    }
    return false;
  }

  await transport.sendMail({
    from: { name: siteConfig.name, address: process.env.GOOGLE_USER_EMAIL! },
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo ?? undefined,
  });

  return true;
}
