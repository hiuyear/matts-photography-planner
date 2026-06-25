import { Router } from "express";
import type { InvoicePayload } from "../types/contracts.js";
import { deliverInvoice } from "../services/email.js";

export const sendInvoiceRouter = Router();

/**
 * POST /send-invoice — take Contract D, render invoice, deliver
 *
 * Default (EMAIL_MODE=preview): no DNS or email API needed.
 * Returns preview_html + mailto_url for the sent screen / native Mail app.
 */
sendInvoiceRouter.post("/", async (req, res) => {
  const invoice = req.body as InvoicePayload;

  const errors = validateInvoice(invoice);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Invalid invoice payload", details: errors });
  }

  try {
    const result = await deliverInvoice(invoice);
    return res.json({
      ok: true,
      delivery: result.delivery,
      message_id: result.message_id,
      preview_html: result.preview_html,
      text_body: result.text_body,
      mailto_url: result.mailto_url,
      subject: result.subject,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    return res.status(500).json({ error: message });
  }
});

function validateInvoice(invoice: InvoicePayload): string[] {
  const errors: string[] = [];

  if (!invoice.to_email) errors.push("to_email is required");
  if (!invoice.client_name) errors.push("client_name is required");
  if (!invoice.from?.business_name) errors.push("from.business_name is required");
  if (!invoice.from?.from_email) errors.push("from.from_email is required");
  if (!Array.isArray(invoice.line_items) || invoice.line_items.length === 0) {
    errors.push("line_items must be a non-empty array");
  }

  return errors;
}
