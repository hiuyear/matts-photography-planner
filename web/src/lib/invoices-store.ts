export type InvoiceStatus = "draft" | "sent";
export type PaymentStatus = "unpaid" | "paid";

export interface InvoiceRecord {
  id: string;
  client_name: string;
  client_email: string;
  total_due: number;
  amount_paid?: number;
  status: InvoiceStatus;
  payment_status: PaymentStatus;
  sent_at: string | null; // ISO
  created_at: string;
}

const KEY = "fieldinvoice.invoices";

export function loadInvoices(): InvoiceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as InvoiceRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveInvoices(list: InvoiceRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addInvoice(rec: InvoiceRecord) {
  const list = loadInvoices();
  list.unshift(rec);
  saveInvoices(list);
}

export function updateInvoice(id: string, patch: Partial<InvoiceRecord>) {
  const list = loadInvoices().map((i) => (i.id === id ? { ...i, ...patch } : i));
  saveInvoices(list);
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
