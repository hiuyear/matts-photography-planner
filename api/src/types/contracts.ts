/** Contract A — canonical price menu */
export interface MenuItem {
  id: string;
  label: string;
  default_price: number;
  unit: "flat" | "per_hour" | "per_person";
}

export interface Menu {
  business_name: string;
  from_email: string;
  currency: "USD";
  menu: MenuItem[];
}

/** Contract B — transcript */
export interface Transcript {
  source: "granola" | "fathom" | "paste";
  text: string;
}

/** Contract C — extraction result */
export interface ExtractionLineItem {
  id: string;
  label: string;
  selected: boolean;
  price: number;
  quantity: number;
  price_source: "default" | "quoted";
  source_quote: string;
}

export interface TbdItem {
  label: string;
  note: string;
  source_quote: string;
}

export interface ExtractionResult {
  client: { name: string | null; email: string | null };
  line_items: ExtractionLineItem[];
  tbd_items: TbdItem[];
  deposit_paid: number | null;
  summary: string;
}

/** Contract D — invoice payload for email */
export interface InvoiceLineItem {
  label: string;
  price: number;
  quantity: number;
}

export interface InvoicePayload {
  to_email: string;
  client_name: string;
  from: { business_name: string; from_email: string };
  currency: "USD";
  line_items: InvoiceLineItem[];
  subtotal: number;
  deposit_paid: number;
  total_due: number;
}

export interface GranolaNoteSummary {
  id: string;
  title: string;
  created_at: string;
  has_summary: boolean;
}
