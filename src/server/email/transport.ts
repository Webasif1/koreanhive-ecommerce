import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { siteConfig } from "@/lib/site";

/**
 * Order email over SMTP.
 *
 * Two setups:
 *
 *   Gmail (the default): GOOGLE_USER_EMAIL + GOOGLE_USER_PASSWORD, where the
 *   password is a Google *app password*. Works from a laptop, but the live
 *   cPanel server's firewall refuses every outbound connection to Gmail
 *   (ECONNREFUSED on 465 and 587), so nothing leaves production this way.
 *
 *   The host's own mail server: SMTP_HOST=localhost with SMTP_USER/SMTP_PASS
 *   for a cPanel mailbox such as orders@koreanhive.com. The firewall allows
 *   it, and the domain's SPF and DKIM already vouch for this server, so the
 *   mail lands in inboxes rather than spam. SMTP_TLS_SERVERNAME names the
 *   certificate to expect, since "localhost" is not on it.
 *
 * Unless SMTP_PORT pins one, a connection failure on 465 (implicit TLS)
 * retries on 587 (STARTTLS). Timeouts are short so a blocked port fails in
 * seconds with a clear reason rather than hanging for minutes.
 */

const transporters = new Map<number, Transporter>();

function credentials() {
  const user = (process.env.SMTP_USER || process.env.GOOGLE_USER_EMAIL)?.trim();
  const pass = (process.env.SMTP_PASS || process.env.GOOGLE_USER_PASSWORD)?.replace(/\s+/g, "");
  return user && pass ? { user, pass } : null;
}

function transporterFor(port: number, auth: { user: string; pass: string }) {
  let transport = transporters.get(port);

  if (!transport) {
    const servername = process.env.SMTP_TLS_SERVERNAME?.trim();
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth,
      ...(servername ? { tls: { servername } } : {}),
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
    return process.env.SMTP_USER
      ? "the mail server rejected the login — check SMTP_USER and SMTP_PASS"
      : "Gmail rejected the login — check GOOGLE_USER_EMAIL and that GOOGLE_USER_PASSWORD is an app password";
  }
  if (code === "ECONNREFUSED" || /ECONNREFUSED/.test(message ?? "")) {
    return `${message?.slice(0, 160)} — this server's firewall blocks the connection; send through the host's own mail server (SMTP_HOST=localhost)`;
  }
  return [code, responseCode, message?.slice(0, 200)].filter(Boolean).join(" · ") || "unknown error";
}

/** Where staff notifications go: the shop inbox unless overridden. */
export function shopInbox() {
  return (
    process.env.ORDER_NOTIFY_EMAIL?.trim() ||
    process.env.GOOGLE_USER_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
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
      error:
        "not configured — set SMTP_USER / SMTP_PASS (or GOOGLE_USER_EMAIL / GOOGLE_USER_PASSWORD) on this server",
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
        // a customer who hits Reply should reach the shop inbox, not the
        // sending mailbox, which nobody may read
        replyTo: message.replyTo ?? shopInbox() ?? undefined,
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
