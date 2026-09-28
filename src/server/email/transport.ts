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
 * Shared cPanel hosts often block one of Gmail's two SMTP ports, so unless
 * SMTP_PORT pins one, a connection failure on 465 (implicit TLS) retries on
 * 587 (STARTTLS). Timeouts are short so a blocked port fails in seconds with
 * a clear reason rather than hanging for minutes.
 */

const transporters = new Map<number, Transporter>();

function credentials() {
  const user = process.env.GOOGLE_USER_EMAIL?.trim();
  const pass = process.env.GOOGLE_USER_PASSWORD?.replace(/\s+/g, "");
  return user && pass ? { user, pass } : null;
}

function transporterFor(port: number, auth: { user: string; pass: string }) {
  let transport = transporters.get(port);

  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    transporters.set(port, transport);
  }

  return transport;
}

/** The ports to try, in order. */
function ports() {
  const pinned = Number(process.env.SMTP_PORT);
  return Number.isFinite(pinned) && pinned > 0 ? [pinned] : [465, 587];
}

/** A connection problem, as opposed to Gmail refusing the message or login. */
function isConnectionError(error: unknown) {
  const code = (error as { code?: string })?.code;
  return (
    code === "ETIMEDOUT" ||
    code === "ECONNECTION" ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ESOCKET" ||
    code === "EHOSTUNREACH" ||
    code === "ENETUNREACH"
  );
}

/** A short, secret-free description of why a send failed. */
export function describeEmailError(error: unknown) {
  const { code, responseCode, message } = (error ?? {}) as {
    code?: string;
    responseCode?: number;
    message?: string;
  };

  if (code === "EAUTH" || responseCode === 535) {
    return "Gmail rejected the login — check GOOGLE_USER_EMAIL and that GOOGLE_USER_PASSWORD is an app password";
  }
  return [code, responseCode, message?.slice(0, 200)].filter(Boolean).join(" · ") || "unknown error";
}

/** Where staff notifications go: the shop inbox unless overridden. */
export function shopInbox() {
  return (
    process.env.ORDER_NOTIFY_EMAIL?.trim() ||
    process.env.GOOGLE_USER_EMAIL?.trim() ||
    null
  );
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendMail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
}): Promise<SendResult> {
  const auth = credentials();

  if (!auth) {
    return {
      ok: false,
      error: "not configured — GOOGLE_USER_EMAIL / GOOGLE_USER_PASSWORD are not set on this server",
    };
  }

  const failures: string[] = [];

  for (const port of ports()) {
    try {
      const info = await transporterFor(port, auth).sendMail({
        from: { name: siteConfig.name, address: auth.user },
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo ?? undefined,
      });

      if (info.rejected.length > 0) {
        return { ok: false, error: `Gmail refused the address ${message.to}` };
      }
      return { ok: true };
    } catch (error) {
      failures.push(`port ${port}: ${describeEmailError(error)}`);
      // only a blocked or dropped connection is worth another port; a bad
      // login fails the same way on both
      if (!isConnectionError(error)) break;
    }
  }

  return { ok: false, error: failures.join(" | ") };
}
