import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/menu-store";
import type { SendInvoiceResponse } from "@/lib/api";

interface SentPayload {
  to_email: string;
  client_name: string;
  from: { business_name: string; from_email: string };
  currency: string;
  line_items: Array<{ label: string; price: number; quantity: number }>;
  subtotal: number;
  deposit_paid: number;
  total_due: number;
}

export const Route = createFileRoute("/invoice/sent")({
  component: Sent,
});

function Sent() {
  const navigate = useNavigate();
  const [payload, setPayload] = useState<SentPayload | null>(null);
  const [sendResponse, setSendResponse] = useState<SendInvoiceResponse | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("fieldinvoice.sent");
    const rawResponse = sessionStorage.getItem("fieldinvoice.sendResponse");
    if (!raw || !rawResponse) {
      navigate({ to: "/invoice/new", replace: true });
      return;
    }
    setPayload(JSON.parse(raw));
    setSendResponse(JSON.parse(rawResponse));
  }, [navigate]);

  if (!payload || !sendResponse) return null;

  return (
    <PageShell>
      <div className="glass-card rounded-2xl p-7 text-center">
        <div className="mb-3 flex justify-center gap-2 text-4xl">
          <span className="sparkle">🥂</span>
          <span className="sparkle" style={{ animationDelay: "0.4s" }}>✨</span>
        </div>
        <h1 className="font-display text-3xl">Invoice ready</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Prepared for <span className="font-medium text-foreground">{payload.to_email}</span>
        </p>
        {sendResponse.delivery === "preview" && (
          <p className="mt-1 text-xs text-muted-foreground">
            Preview mode — open in Mail to send for real.
          </p>
        )}
      </div>

      {sendResponse.preview_html ? (
        <div className="glass-card mt-4 overflow-hidden rounded-2xl">
          <div
            className="bg-white p-2 text-left text-sm"
            dangerouslySetInnerHTML={{ __html: sendResponse.preview_html }}
          />
        </div>
      ) : (
        <div className="glass-card mt-4 rounded-2xl p-6">
          <div className="mb-4 flex items-start justify-between border-b border-[color:var(--border)] pb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">From</div>
              <div className="font-display text-lg">{payload.from.business_name}</div>
              <div className="text-xs text-muted-foreground">{payload.from.from_email}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">To</div>
              <div className="font-display text-lg">{payload.client_name || "—"}</div>
              <div className="text-xs text-muted-foreground">{payload.to_email}</div>
            </div>
          </div>

          <ul className="divide-y divide-[color:var(--border)]">
            {payload.line_items.map((l, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {l.label}
                  {l.quantity > 1 ? <span className="text-muted-foreground"> × {l.quantity}</span> : null}
                </span>
                <span>{formatMoney(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 border-t border-[color:var(--border)] pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(payload.subtotal)}</span>
            </div>
            {payload.deposit_paid > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Deposit paid</span>
                <span>−{formatMoney(payload.deposit_paid)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[color:var(--border)] pt-3">
              <span className="font-display text-lg">Total due</span>
              <span className="text-gold-gradient font-display text-2xl">
                {formatMoney(payload.total_due)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a href={sendResponse.mailto_url}>
          <Button className="btn-gold h-11 px-6">Open in Mail app</Button>
        </a>
        <Link to="/invoice/new">
          <Button variant="outline" className="h-11 px-6">New invoice</Button>
        </Link>
      </div>
    </PageShell>
  );
}
