import { Resend } from "resend";
import type { InvoicePayload } from "../types/contracts.js";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function renderInvoiceHtml(invoice: InvoicePayload): string {
  const rows = invoice.line_items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;">${item.label}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.price)}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice from ${invoice.from.business_name}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:32px 16px;color:#1a1a1a;">
  <h1 style="font-size:24px;margin:0 0 4px;">${invoice.from.business_name}</h1>
  <p style="color:#666;margin:0 0 32px;">Invoice for ${invoice.client_name}</p>

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

export async function sendInvoiceEmail(invoice: InvoicePayload): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Demo fallback: log instead of sending when no key is configured
    console.log("[send-invoice] RESEND_API_KEY not set — logging invoice:");
    console.log(JSON.stringify(invoice, null, 2));
    return { id: "mock-" + Date.now() };
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.FROM_EMAIL ?? invoice.from.from_email;

  const { data, error } = await resend.emails.send({
    from: `${invoice.from.business_name} <${fromEmail}>`,
    to: invoice.to_email,
    subject: `Invoice from ${invoice.from.business_name}`,
    html: renderInvoiceHtml(invoice),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return { id: data?.id ?? "unknown" };
}
