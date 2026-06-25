import { Router } from "express";
import type { InvoicePayload } from "../types/contracts.js";
import { sendInvoiceEmail } from "../services/email.js";

export const sendInvoiceRouter = Router();

/**
 * POST /send-invoice — take Contract D, render HTML, send email
 */
sendInvoiceRouter.post("/", async (req, res) => {
  const invoice = req.body as InvoicePayload;

  const errors = validateInvoice(invoice);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Invalid invoice payload", details: errors });
  }

  try {
    const result = await sendInvoiceEmail(invoice);
    return res.json({ ok: true, message_id: result.id });
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
