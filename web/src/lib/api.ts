import type { Extraction, Menu } from "@/lib/menu-store";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export interface Transcript {
  source: "fathom" | "paste";
  text: string;
}

export interface FathomMeeting {
  recording_id: number;
  title: string;
  created_at: string;
  has_summary: boolean;
}

export interface InvoicePayload {
  to_email: string;
  client_name: string;
  from: { business_name: string; from_email: string };
  currency: "USD";
  line_items: Array<{ label: string; price: number; quantity: number }>;
  subtotal: number;
  deposit_paid: number;
  total_due: number;
}

export interface SendInvoiceResponse {
  ok: boolean;
  delivery: "preview" | "smtp" | "resend";
  message_id: string;
  preview_html: string;
  text_body: string;
  mailto_url: string;
  subject: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : res.statusText;
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  health: () => apiFetch<{ ok: boolean }>("/health"),

  listFathomMeetings: () =>
    apiFetch<{ meetings: FathomMeeting[] }>("/transcript?source=fathom"),

  fetchFathomTranscript: (recordingId: number) =>
    apiFetch<Transcript>(`/transcript?source=fathom&recording_id=${recordingId}`),

  pasteTranscript: (text: string) =>
    apiFetch<Transcript>("/transcript", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  extract: (menu: Menu, transcript: Transcript) =>
    apiFetch<Extraction>("/extract", {
      method: "POST",
      body: JSON.stringify({ menu, transcript }),
    }),

  sendInvoice: (invoice: InvoicePayload) =>
    apiFetch<SendInvoiceResponse>("/send-invoice", {
      method: "POST",
      body: JSON.stringify(invoice),
    }),
};
