import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  formatMoney,
  loadExtraction,
  loadMenu,
  saveExtraction,
  type Extraction,
  type Menu,
} from "@/lib/menu-store";
import { addInvoice } from "@/lib/invoices-store";
import { api } from "@/lib/api";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/invoice/review")({
  component: Review,
});

interface TBDState {
  label: string;
  note: string;
  price: string;
  quantity: number;
  selected: boolean;
}

function Review() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [ext, setExt] = useState<Extraction | null>(null);
  const [tbd, setTbd] = useState<TBDState[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [deposit, setDeposit] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const m = loadMenu();
    const e = loadExtraction();
    if (!m || !e) {
      navigate({ to: "/invoice/new", replace: true });
      return;
    }
    setMenu(m);
    setExt(e);
    setClientName(e.client?.name ?? "");
    setClientEmail(e.client?.email ?? "");
    setDeposit(e.deposit_paid != null ? String(e.deposit_paid) : "");
    setTbd(
      (e.tbd_items ?? []).map((t) => ({
        label: t.label,
        note: t.note,
        price: "",
        quantity: 1,
        selected: true,
      }))
    );
  }, [navigate]);

  function updateLine(idx: number, patch: Partial<Extraction["line_items"][number]>) {
    setExt((prev) => {
      if (!prev) return prev;
      const li = prev.line_items.map((l, i) => (i === idx ? { ...l, ...patch } : l));
      return { ...prev, line_items: li };
    });
  }

  function updateTbd(idx: number, patch: Partial<TBDState>) {
    setTbd((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  const selectedLines = useMemo(
    () => (ext?.line_items ?? []).filter((l) => l.selected),
    [ext]
  );

  const tbdResolved = tbd.every((t) => !t.selected || Number(t.price) > 0);

  const subtotal = useMemo(() => {
    const lines = selectedLines.reduce((sum, l) => sum + Number(l.price) * Number(l.quantity || 1), 0);
    const tbds = tbd
      .filter((t) => t.selected && Number(t.price) > 0)
      .reduce((s, t) => s + Number(t.price) * Number(t.quantity || 1), 0);
    return lines + tbds;
  }, [selectedLines, tbd]);

  const depositNum = Number(deposit) || 0;
  const totalDue = Math.max(0, subtotal - depositNum);

  const canSend =
    clientEmail.trim().length > 0 && /\S+@\S+\.\S+/.test(clientEmail) && tbdResolved;

  async function send() {
    if (!menu || !ext || sending) return;
    const payload = {
      to_email: clientEmail.trim(),
      client_name: clientName.trim(),
      from: { business_name: menu.business_name, from_email: menu.from_email },
      currency: menu.currency,
      line_items: [
        ...selectedLines.map((l) => ({
          label: l.label,
          price: Number(l.price),
          quantity: Number(l.quantity || 1),
        })),
        ...tbd
          .filter((t) => t.selected && Number(t.price) > 0)
          .map((t) => ({
            label: t.label,
            price: Number(t.price),
            quantity: Number(t.quantity || 1),
          })),
      ],
      subtotal,
      deposit_paid: depositNum,
      total_due: totalDue,
    };

    setSending(true);
    try {
      const response = await api.sendInvoice(payload);
      sessionStorage.setItem("fieldinvoice.sent", JSON.stringify(payload));
      sessionStorage.setItem("fieldinvoice.sendResponse", JSON.stringify(response));
      saveExtraction({
        ...ext,
        client: { name: clientName.trim(), email: clientEmail.trim() },
        deposit_paid: depositNum,
      });
      const now = new Date().toISOString();
      addInvoice({
        id: `inv_${Date.now()}`,
        client_name: clientName.trim() || "—",
        client_email: clientEmail.trim(),
        total_due: totalDue,
        status: "sent",
        payment_status: "unpaid",
        sent_at: now,
        created_at: now,
      });
      navigate({ to: "/invoice/sent" });
    } catch (e) {
      toast.error("Send failed", { description: (e as Error).message });
    } finally {
      setSending(false);
    }
  }

  if (!menu || !ext) return null;

  return (
    <PageShell>
      <div className="glass-card rounded-2xl p-6 sm:p-7">
        <div className="mb-1 text-sm font-medium text-[color:var(--gold)]">Draft invoice ✨</div>
        <h1 className="font-display text-3xl">Review & send</h1>
        {ext.summary ? (
          <p className="mt-1 text-sm text-muted-foreground">{ext.summary}</p>
        ) : null}

        {/* Client */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Client name</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 h-10 bg-white/70"
              placeholder="Sarah Chen"
            />
          </div>
          <div>
            <Label className="text-xs">Client email</Label>
            <Input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="mt-1 h-10 bg-white/70"
              placeholder="sarah@example.com"
            />
          </div>
        </div>

        {/* Line items */}
        <div className="mt-6">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            Line items
          </div>
          <ul className="divide-y divide-[color:var(--border)] rounded-xl border border-[color:var(--border)] bg-white/70">
            {ext.line_items.map((li, idx) => {
              const menuItem = menu.menu.find((m) => m.id === li.id);
              const unit = menuItem?.unit ?? "flat";
              return (
                <li key={li.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={li.selected}
                      onCheckedChange={(v) => updateLine(idx, { selected: Boolean(v) })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">{li.label}</div>
                        {li.price_source === "quoted" && li.selected ? (
                          <span className="rounded-full bg-[color:var(--gold-soft)]/40 px-2 py-0.5 text-[10px] font-medium text-[color:var(--accent-foreground)]">
                            quoted on call
                          </span>
                        ) : null}
                      </div>
                      {li.selected && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground">Price</Label>
                            <Input
                              type="number"
                              value={li.price}
                              onChange={(e) => updateLine(idx, { price: Number(e.target.value) })}
                              className="mt-0.5 h-9"
                            />
                          </div>
                          {unit !== "flat" && (
                            <div>
                              <Label className="text-[10px] uppercase text-muted-foreground">
                                {unit === "per_hour" ? "Hours" : "People"}
                              </Label>
                              <Input
                                type="number"
                                value={li.quantity}
                                onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                                className="mt-0.5 h-9"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {li.source_quote && li.selected ? (
                        <div className="mt-2 text-xs italic text-muted-foreground">
                          "{li.source_quote}"
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* TBD */}
        {tbd.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-[color:var(--gold)]">
              <AlertTriangle className="h-3.5 w-3.5" /> Needs your input
            </div>
            <ul className="space-y-2">
              {tbd.map((t, idx) => (
                <li
                  key={idx}
                  className={`rounded-xl border-2 bg-white/80 p-3 ${
                    t.selected && !Number(t.price) ? "tbd-blink" : "border-[color:var(--gold-soft)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={t.selected}
                      onCheckedChange={(v) => updateTbd(idx, { selected: Boolean(v) })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{t.label}</div>
                      {t.note && (
                        <div className="text-xs text-muted-foreground">{t.note}</div>
                      )}
                      {t.selected && (
                        <div className="mt-2">
                          <Label className="text-[10px] uppercase text-muted-foreground">
                            Price (required)
                          </Label>
                          <Input
                            type="number"
                            value={t.price}
                            onChange={(e) => updateTbd(idx, { price: e.target.value })}
                            placeholder="Enter price"
                            className="mt-0.5 h-9 border-[color:var(--gold)]"
                            autoFocus={idx === 0}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Totals */}
        <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-white/80 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Deposit paid</span>
            <Input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="0"
              className="h-8 w-28 text-right"
            />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[color:var(--border)] pt-3">
            <span className="font-display text-lg">Total due</span>
            <span className="text-gold-gradient font-display text-2xl">
              {formatMoney(totalDue)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <Button onClick={send} disabled={!canSend || sending} className="btn-gold h-12 px-8 text-base">
            {sending ? "Sending…" : "🥂 Send invoice"}
          </Button>
        </div>
        {!canSend && tbd.some((t) => t.selected && !Number(t.price)) ? (
          <p className="mt-2 text-right text-xs text-[color:var(--accent-foreground)]">
            Fill in the TBD prices to send.
          </p>
        ) : null}
      </div>
    </PageShell>
  );
}
