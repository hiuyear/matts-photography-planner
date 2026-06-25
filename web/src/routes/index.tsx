import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { loadMenu } from "@/lib/menu-store";
import {
  daysSince,
  loadInvoices,
  updateInvoice,
  type InvoiceRecord,
} from "@/lib/invoices-store";
import { formatMoney } from "@/lib/menu-store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [hasMenu, setHasMenu] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  useEffect(() => {
    const menu = loadMenu();
    setHasMenu(Boolean(menu));
    setBusinessName(menu?.business_name ?? "");
    setInvoices(loadInvoices());
  }, []);

  function setPaid(inv: InvoiceRecord, amount: number) {
    const clamped = Math.max(0, Math.min(inv.total_due, Math.round(amount)));
    updateInvoice(inv.id, {
      amount_paid: clamped,
      payment_status: clamped >= inv.total_due ? "paid" : "unpaid",
    });
    setInvoices(loadInvoices());
  }

  if (!hasMenu) {
    return (
      <PageShell>
        <div className="glass-card mt-10 rounded-2xl p-8 text-center sm:p-12">
          <div className="mb-3 text-3xl">🥂 ✨</div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            Close the call.<br />
            <span className="text-gold-gradient">Send the invoice.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            A field invoicing tool for wedding photographers. Your consultation call becomes
            a draft invoice — reviewed and sent before you put the camera down.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link to="/onboarding/welcome">
              <Button size="lg" className="btn-gold h-12 px-8 text-base">
                Set up your menu →
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">Takes under a minute.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="glass-card rounded-2xl p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 text-sm font-medium text-[color:var(--gold)]">Your invoices ✨</div>
            <h1 className="font-display text-3xl">{businessName || "Your studio"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track every invoice from the field — mark paid as the deposits land.
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/invoice/new" })}
            className="btn-gold h-11 px-6"
          >
            🥂 New invoice
          </Button>
        </div>

        {invoices.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-[color:var(--border)] bg-white/60 p-8 text-center">
            <div className="text-2xl">🥂</div>
            <div className="mt-2 font-display text-lg">No invoices yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Drop a transcript to create your first one.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-[color:var(--border)] bg-white/70">
            <table className="w-full text-sm">
              <thead className="bg-white/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Payment</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {invoices.map((inv) => {
                  const days = daysSince(inv.sent_at);
                  return (
                    <tr key={inv.id} className="hover:bg-white/80">
                      <td className="px-4 py-3">
                        <div className="font-medium">{inv.client_name}</div>
                        {inv.client_email && (
                          <div className="text-xs text-muted-foreground">{inv.client_email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {inv.status === "draft" ? (
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Draft
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="inline-flex w-fit items-center rounded-full bg-[color:var(--gold-soft)]/40 px-2.5 py-0.5 text-xs font-medium text-[color:var(--accent-foreground)]">
                              Invoice sent
                            </span>
                            <span className="mt-1 text-[11px] text-muted-foreground">
                              {days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const paid = inv.amount_paid ?? (inv.payment_status === "paid" ? inv.total_due : 0);
                          const pct = inv.total_due > 0 ? Math.min(100, (paid / inv.total_due) * 100) : 0;
                          const full = paid >= inv.total_due;
                          return (
                            <div className="min-w-[160px]">
                              <div className="flex items-center justify-between text-xs">
                                <span className={full ? "font-medium text-emerald-700" : "text-muted-foreground"}>
                                  {formatMoney(paid)} <span className="text-muted-foreground">/ {formatMoney(inv.total_due)}</span>
                                </span>
                                <span className="text-[11px] text-muted-foreground">{Math.round(pct)}%</span>
                              </div>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--border)]">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    full
                                      ? "bg-emerald-500"
                                      : "bg-[linear-gradient(90deg,var(--gold),var(--gold-soft))]"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={inv.total_due}
                                  value={paid}
                                  onChange={(e) => setPaid(inv, Number(e.target.value))}
                                  className="h-6 w-20 rounded border border-[color:var(--border)] bg-white/80 px-1.5 text-xs"
                                />
                                <button
                                  onClick={() => setPaid(inv, full ? 0 : inv.total_due)}
                                  className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                >
                                  {full ? "Reset" : "Mark paid"}
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right font-display text-base">
                        {formatMoney(inv.total_due)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
