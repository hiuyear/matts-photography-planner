import nodemailer from "nodemailer";
import type { InvoicePayload } from "../types/contracts.js";

export type EmailDeliveryMode = "preview" | "smtp" | "resend";

export interface InvoiceDeliveryResult {
  delivery: EmailDeliveryMode;
  message_id: string;
  preview_html: string;
  text_body: string;
  mailto_url: string;
  subject: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function renderInvoiceHtml(invoice: InvoicePayload): string {
  const rows = invoice.line_items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;">${escapeHtml(item.label)}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.price)}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice from ${escapeHtml(invoice.from.business_name)}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:32px 16px;color:#1a1a1a;">
  <h1 style="font-size:24px;margin:0 0 4px;">${escapeHtml(invoice.from.business_name)}</h1>
  <p style="color:#666;margin:0 0 32px;">Invoice for ${escapeHtml(invoice.client_name)}</p>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="border-bottom:2px solid #1a1a1a;">
        <th style="text-align:left;padding:8px 0;">Service</th>
        <th style="text-align:center;padding:8px 0;">Qty</th>
        <th style="text-align:right;padding:8px 0;">Rate</th>
        <th style="text-align:right;padding:8px 0;">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <table style="width:100%;max-width:280px;margin-left:auto;">
    <tr>
      <td style="padding:6px 0;color:#666;">Subtotal</td>
      <td style="padding:6px 0;text-align:right;">${formatCurrency(invoice.subtotal)}</td>
    </tr>
    ${
      invoice.deposit_paid > 0
        ? `<tr>
      <td style="padding:6px 0;color:#666;">Deposit paid</td>
      <td style="padding:6px 0;text-align:right;">-${formatCurrency(invoice.deposit_paid)}</td>
    </tr>`
        : ""
    }
    <tr style="border-top:2px solid #1a1a1a;">
      <td style="padding:12px 0;font-weight:700;">Total due</td>
      <td style="padding:12px 0;text-align:right;font-weight:700;font-size:18px;">${formatCurrency(invoice.total_due)}</td>
    </tr>
  </table>

  <p style="margin-top:40px;color:#999;font-size:13px;">Sent via FieldInvoice</p>
</body>
</html>`;
}

export function renderInvoiceText(invoice: InvoicePayload): string {
  const lines = invoice.line_items.map(
    (item) =>
      `- ${item.label} x${item.quantity} @ ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.quantity)}`
  );

  return [
    `Invoice from ${invoice.from.business_name}`,
    `For: ${invoice.client_name}`,
    "",
    ...lines,
    "",
    `Subtotal: ${formatCurrency(invoice.subtotal)}`,
    ...(invoice.deposit_paid > 0 ? [`Deposit paid: -${formatCurrency(invoice.deposit_paid)}`] : []),
    `Total due: ${formatCurrency(invoice.total_due)}`,
    "",
    `Reply to: ${invoice.from.from_email}`,
  ].join("\n");
}

function buildMailtoUrl(invoice: InvoicePayload, subject: string, body: string): string {
  const params = new URLSearchParams({
    subject,
    body,
  });

  return `mailto:${encodeURIComponent(invoice.to_email)}?${params.toString()}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getDeliveryMode(): EmailDeliveryMode {
  const mode = process.env.EMAIL_MODE?.toLowerCase();
  if (mode === "smtp" || mode === "resend") return mode;
  return "preview";
}

async function sendViaSmtp(
  invoice: InvoicePayload,
  subject: string,
  html: string,
  text: string
): Promise<string> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASS are required when EMAIL_MODE=smtp");
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  const fromEmail = process.env.SMTP_FROM ?? user;
  const info = await transporter.sendMail({
    from: `${invoice.from.business_name} <${fromEmail}>`,
    to: invoice.to_email,
    replyTo: invoice.from.from_email,
    subject,
    text,
    html,
  });

  return info.messageId;
}

async function sendViaResend(
  invoice: InvoicePayload,
  subject: string,
  html: string
): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required when EMAIL_MODE=resend");
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const fromEmail = process.env.FROM_EMAIL ?? invoice.from.from_email;

  const { data, error } = await resend.emails.send({
    from: `${invoice.from.business_name} <${fromEmail}>`,
    to: invoice.to_email,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return data?.id ?? "unknown";
}

/**
 * Deliver invoice email. Default mode is "preview" — no DNS or API keys needed.
 * Returns rendered HTML + mailto link so the frontend can show or hand off to Mail app.
 */
export async function deliverInvoice(invoice: InvoicePayload): Promise<InvoiceDeliveryResult> {
  const subject = `Invoice from ${invoice.from.business_name}`;
  const preview_html = renderInvoiceHtml(invoice);
  const text_body = renderInvoiceText(invoice);
  const mailto_url = buildMailtoUrl(invoice, subject, text_body);

  const mode = getDeliveryMode();

  if (mode === "preview") {
    console.log("[send-invoice] preview mode — invoice rendered, no external send");
    console.log(text_body);
    return {
      delivery: "preview",
      message_id: `preview-${Date.now()}`,
      preview_html,
      text_body,
      mailto_url,
      subject,
    };
  }

  try {
    const message_id =
      mode === "smtp"
        ? await sendViaSmtp(invoice, subject, preview_html, text_body)
        : await sendViaResend(invoice, subject, preview_html);

    return {
      delivery: mode,
      message_id,
      preview_html,
      text_body,
      mailto_url,
      subject,
    };
  } catch (err) {
    console.warn("[send-invoice] external send failed, falling back to preview:", err);
    return {
      delivery: "preview",
      message_id: `preview-fallback-${Date.now()}`,
      preview_html,
      text_body,
      mailto_url,
      subject,
    };
  }
}
