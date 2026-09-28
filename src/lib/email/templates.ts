import { comboNames } from "@/lib/combo-pricing";
import { formatBDT } from "@/lib/format";
import {
  ORDER_STATUS_HINT,
  ORDER_STATUS_LABEL,
  type OrderStatusValue,
} from "@/lib/order-status";
import { siteConfig } from "@/lib/site";

/**
 * The order emails, as pure functions.
 *
 * No I/O here: the server module loads the order and sends, this only turns an
 * order into { subject, html, text }. That keeps every template testable and
 * previewable without a database or a Gmail account.
 *
 * The HTML is table-based with inline styles because Gmail strips <style>
 * blocks and ignores most layout CSS. Every string a customer typed — name,
 * address, note — goes through escapeHtml before it reaches the markup.
 */

export type EmailOrder = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  addressLine: string;
  area: string;
  district: string;
  postalCode?: string | null;
  note?: string | null;
  subtotal: number;
  comboDiscount?: number;
  combos?: { name: string; sets: number }[];
  couponCode?: string | null;
  discount: number;
  shippingCharge: number;
  total: number;
  placedAt: Date;
  items: {
    productName: string;
    variantName?: string | null;
    quantity: number;
    lineTotal: number;
  }[];
};

export type Email = { subject: string; html: string; text: string };

export type CustomerEmailKind = "placed" | "confirmed" | "shipped" | "delivered";

/** Which status changes email the customer; everything else stays quiet. */
export function customerEmailKindFor(
  status: OrderStatusValue,
): CustomerEmailKind | null {
  switch (status) {
    case "PENDING":
      return "placed";
    case "CONFIRMED":
      return "confirmed";
    case "SHIPPED":
      return "shipped";
    case "DELIVERED":
      return "delivered";
    default:
      return null;
  }
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * The public shop, always.
 *
 * Not siteConfig.url: that falls back to localhost when NEXT_PUBLIC_SITE_URL
 * is unset, and follows whichever domain a build was made for. An email sits
 * in a customer's inbox for months, so its links go to the real shop.
 */
export const EMAIL_SHOP_URL = "https://koreanhive.com";

export function shopUrl(path = "/") {
  return new URL(path, EMAIL_SHOP_URL).toString();
}

export function trackUrl(orderNumber: string) {
  return shopUrl(`/track?order=${encodeURIComponent(orderNumber)}`);
}

// ------------------------------------------------------------ palette

const MULBERRY = "#7b2a6b";
const INK = "#241a24";
const BLUSH = "#f6eaf1";
const MUTED = "#6b5a66";
const HAIRLINE = "#ecdde6";
const SUCCESS = "#1f7a4d";
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Hind Siliguri', sans-serif";

// ------------------------------------------------------------- copy

const CUSTOMER_COPY: Record<
  CustomerEmailKind,
  { subject: (n: string) => string; headline: string; bangla: string; status: OrderStatusValue }
> = {
  placed: {
    subject: (n) => `We've got your order ${n} 💜`,
    headline: "Thank you for your order!",
    bangla: "Korean Hive-এ অর্ডার করার জন্য অনেক ধন্যবাদ 💜 খুব শীঘ্রই আমরা আপনাকে কল করে অর্ডারটি কনফার্ম করব।",
    status: "PENDING",
  },
  confirmed: {
    subject: (n) => `Your order ${n} is confirmed ✨`,
    headline: "Your order is confirmed",
    bangla: "আপনার অর্ডার কনফার্ম হয়েছে! আমরা যত্ন করে প্যাক করছি ✨",
    status: "CONFIRMED",
  },
  shipped: {
    subject: (n) => `Your order ${n} is on the way 🚚`,
    headline: "Your glow is on the way",
    bangla: "আপনার পার্সেল কুরিয়ারে পাঠানো হয়েছে — শীঘ্রই পৌঁছে যাবে 🚚",
    status: "SHIPPED",
  },
  delivered: {
    subject: (n) => `Order ${n} delivered — thank you for choosing Korean Hive 🌸`,
    headline: "Delivered. Enjoy your routine!",
    bangla: "আপনার অর্ডার পৌঁছে গেছে। Korean Hive-এর সাথে থাকার জন্য ধন্যবাদ 🌸",
    status: "DELIVERED",
  },
};

// ---------------------------------------------------------- pieces

function addressLines(order: EmailOrder) {
  return [
    order.addressLine,
    `${order.area}, ${order.district}${order.postalCode ? ` ${order.postalCode}` : ""}`,
  ];
}

function summaryRows(order: EmailOrder) {
  const rows: { label: string; value: string; tone?: "sale" | "success" }[] = [
    { label: "Subtotal", value: formatBDT(order.subtotal) },
  ];

  if (order.comboDiscount && order.comboDiscount > 0) {
    const names = comboNames(order.combos);
    rows.push({
      label: names.length ? `Combo saving (${names.join(", ")})` : "Combo saving",
      value: `−${formatBDT(order.comboDiscount)}`,
      tone: "sale",
    });
  }
  if (order.discount > 0) {
    rows.push({
      label: order.couponCode ? `Coupon ${order.couponCode}` : "Discount",
      value: `−${formatBDT(order.discount)}`,
      tone: "sale",
    });
  }
  rows.push(
    order.shippingCharge > 0
      ? { label: "Delivery", value: formatBDT(order.shippingCharge) }
      : { label: "Delivery", value: "Free", tone: "success" },
  );

  return rows;
}

function itemsTable(order: EmailOrder) {
  const items = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${HAIRLINE};font-size:14px;color:${INK};">
          ${escapeHtml(item.productName)}${
            item.variantName
              ? `<br><span style="font-size:12px;color:${MUTED};">${escapeHtml(item.variantName)}</span>`
              : ""
          }
          <span style="color:${MUTED};"> × ${item.quantity}</span>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${HAIRLINE};font-size:14px;color:${INK};white-space:nowrap;">
          ${formatBDT(item.lineTotal)}
        </td>
      </tr>`,
    )
    .join("");

  const summary = summaryRows(order)
    .map(
      (row) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:${row.tone === "sale" ? "#b3261e" : row.tone === "success" ? SUCCESS : MUTED};">${escapeHtml(row.label)}</td>
        <td align="right" style="padding:6px 0;font-size:13px;color:${row.tone === "sale" ? "#b3261e" : row.tone === "success" ? SUCCESS : MUTED};white-space:nowrap;">${row.value}</td>
      </tr>`,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${items}
      <tr><td colspan="2" style="height:8px;"></td></tr>
      ${summary}
      <tr>
        <td style="padding:12px 0 0;border-top:2px solid ${INK};font-size:16px;font-weight:700;color:${INK};">Total (cash on delivery)</td>
        <td align="right" style="padding:12px 0 0;border-top:2px solid ${INK};font-size:18px;font-weight:700;color:${INK};white-space:nowrap;">${formatBDT(order.total)}</td>
      </tr>
    </table>`;
}

function button(href: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background:${MULBERRY};border-radius:2px;">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">${label}</a>
        </td>
      </tr>
    </table>`;
}

function contactLine() {
  const parts: string[] = [];
  if (siteConfig.contact.whatsapp) {
    const digits = siteConfig.contact.whatsapp.replace(/\D/g, "");
    parts.push(
      `<a href="https://wa.me/${digits}" style="color:${MULBERRY};text-decoration:none;">WhatsApp ${escapeHtml(siteConfig.contact.whatsapp)}</a>`,
    );
  }
  if (siteConfig.contact.phone) {
    parts.push(`Call ${escapeHtml(siteConfig.contact.phone)}`);
  }
  return parts.length ? `Questions? ${parts.join(" · ")}` : "Questions? Just reply to this email.";
}

/** The frame every email shares: wordmark, white card, footer. */
function layout({ preheader, body }: { preheader: string; body: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${siteConfig.name}</title>
</head>
<body style="margin:0;padding:0;background:${BLUSH};font-family:${FONT};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BLUSH};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:0 0 20px;">
              <a href="${shopUrl("/")}" style="text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:0.02em;color:${MULBERRY};">Korean Hive</a>
              <div style="margin-top:4px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};">Authentic K-beauty · Bangladesh</div>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid ${HAIRLINE};padding:32px 28px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 12px 0;font-size:12px;line-height:1.6;color:${MUTED};">
              ${contactLine()}<br>
              100% authentic, imported directly from Korea · Cash on delivery<br>
              <a href="${shopUrl("/")}" style="color:${MUTED};">koreanhive.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function trackingBox(orderNumber: string) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:${BLUSH};border:1px dashed ${MULBERRY};">
      <tr>
        <td align="center" style="padding:18px 12px;">
          <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Your tracking ID</div>
          <div style="margin-top:6px;font-family:'Courier New',monospace;font-size:24px;font-weight:700;letter-spacing:0.06em;color:${INK};">${escapeHtml(orderNumber)}</div>
        </td>
      </tr>
    </table>`;
}

function textSummary(order: EmailOrder) {
  return [
    ...order.items.map(
      (item) =>
        `- ${item.productName}${item.variantName ? ` (${item.variantName})` : ""} × ${item.quantity}  ${formatBDT(item.lineTotal)}`,
    ),
    ...summaryRows(order).map((row) => `${row.label}: ${row.value}`),
    `Total (cash on delivery): ${formatBDT(order.total)}`,
  ].join("\n");
}

// -------------------------------------------------------- customer

export function customerOrderEmail(
  order: EmailOrder,
  kind: CustomerEmailKind,
): Email {
  const copy = CUSTOMER_COPY[kind];
  const firstName = order.customerName.trim().split(/\s+/)[0] ?? order.customerName;
  const link = trackUrl(order.orderNumber);

  const body = `
    <div style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${MULBERRY};">${ORDER_STATUS_LABEL[copy.status]}</div>
    <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:400;color:${INK};">${copy.headline}</h1>
    <p style="margin:14px 0 0;font-size:15px;line-height:1.6;color:${INK};">Hi ${escapeHtml(firstName)},</p>
    <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:${MUTED};">${ORDER_STATUS_HINT[copy.status]}</p>
    <p lang="bn" style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${MULBERRY};">${copy.bangla}</p>

    ${trackingBox(order.orderNumber)}

    ${button(link, "Track your order")}
    <p style="margin:10px 0 0;text-align:center;font-size:12px;color:${MUTED};">Use your tracking ID and phone number on the tracking page.</p>

    <div style="margin:30px 0 8px;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${MULBERRY};">Order summary</div>
    ${itemsTable(order)}

    <div style="margin:28px 0 6px;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${MULBERRY};">Delivering to</div>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${INK};">
      ${escapeHtml(order.customerName)}<br>
      ${addressLines(order).map(escapeHtml).join("<br>")}<br>
      ${escapeHtml(order.customerPhone)}
    </p>

    <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:${MUTED};">With love from Seoul to your doorstep,<br><strong style="color:${INK};">Team Korean Hive</strong></p>`;

  const text = [
    `${copy.headline}`,
    "",
    `Hi ${firstName},`,
    ORDER_STATUS_HINT[copy.status],
    copy.bangla,
    "",
    `Your tracking ID: ${order.orderNumber}`,
    `Track your order: ${link}`,
    "",
    textSummary(order),
    "",
    "Delivering to:",
    order.customerName,
    ...addressLines(order),
    order.customerPhone,
    "",
    "Team Korean Hive",
  ].join("\n");

  return {
    subject: copy.subject(order.orderNumber),
    html: layout({ preheader: `Tracking ID ${order.orderNumber} · ${formatBDT(order.total)}`, body }),
    text,
  };
}

// ------------------------------------------------------------ shop

function shopDetails(order: EmailOrder) {
  const rows: [string, string][] = [
    ["Name", order.customerName],
    ["Phone", order.customerPhone],
    ["Email", order.customerEmail || "—"],
    ["Address", addressLines(order).join(", ")],
    ["Note", order.note || "—"],
  ];

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:18px;">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding:7px 12px 7px 0;border-bottom:1px solid ${HAIRLINE};font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};vertical-align:top;white-space:nowrap;">${label}</td>
          <td style="padding:7px 0;border-bottom:1px solid ${HAIRLINE};font-size:14px;color:${INK};">${escapeHtml(value)}</td>
        </tr>`,
        )
        .join("")}
    </table>`;
}

function shopEmail({
  order,
  subject,
  eyebrow,
  headline,
  lead,
}: {
  order: EmailOrder;
  subject: string;
  eyebrow: string;
  headline: string;
  lead: string;
}): Email {
  const adminLink = shopUrl(`/admin/orders/${encodeURIComponent(order.orderNumber)}`);

  const body = `
    <div style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${MULBERRY};">${eyebrow}</div>
    <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;font-weight:400;color:${INK};">${escapeHtml(headline)}</h1>
    <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(lead)}</p>
    ${shopDetails(order)}
    <div style="margin:26px 0 8px;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${MULBERRY};">Items</div>
    ${itemsTable(order)}
    <div style="margin-top:28px;">${button(adminLink, "Open in admin")}</div>`;

  const text = [
    headline,
    lead,
    "",
    `Name: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `Email: ${order.customerEmail || "—"}`,
    `Address: ${addressLines(order).join(", ")}`,
    `Note: ${order.note || "—"}`,
    "",
    textSummary(order),
    "",
    `Admin: ${adminLink}`,
  ].join("\n");

  return {
    subject,
    html: layout({ preheader: `${order.customerName} · ${formatBDT(order.total)}`, body }),
    text,
  };
}

export function shopNewOrderEmail(order: EmailOrder): Email {
  return shopEmail({
    order,
    subject: `🛍️ New order ${order.orderNumber} — ${formatBDT(order.total)} · ${order.customerName}`,
    eyebrow: "New order",
    headline: `${order.orderNumber} · ${formatBDT(order.total)}`,
    lead: "A new cash-on-delivery order is waiting. Call the customer to confirm.",
  });
}

export function shopConfirmedEmail(order: EmailOrder, confirmedBy: string): Email {
  return shopEmail({
    order,
    subject: `✅ Order ${order.orderNumber} confirmed — ${formatBDT(order.total)}`,
    eyebrow: "Order confirmed",
    headline: `${order.orderNumber} confirmed`,
    lead: `Confirmed by ${confirmedBy}. Ready to pack.`,
  });
}
