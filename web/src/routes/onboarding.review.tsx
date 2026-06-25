import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { clearDraft, formatMoney, loadDraft, saveMenu, type Menu } from "@/lib/menu-store";

export const Route = createFileRoute("/onboarding/review")({
  component: Review,
});

function Review() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<Menu | null>(null);

  useEffect(() => {
    setMenu(loadDraft());
  }, []);

  function finish() {
    if (!menu) return;
    saveMenu(menu);
    clearDraft();
    navigate({ to: "/invoice/new" });
  }

  if (!menu) return null;

  return (
    <PageShell step={3} totalSteps={3}>
      <div className="glass-card rounded-2xl p-7">
        <div className="mb-1 text-sm font-medium text-[color:var(--gold)]">All set 🥂</div>
        <h1 className="font-display text-3xl">Looks good?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You can come back and tweak this later.
        </p>

        <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-white/70 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Studio</div>
          <div className="mt-0.5 font-display text-xl">{menu.business_name}</div>
          <div className="text-sm text-muted-foreground">{menu.from_email}</div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Menu</div>
          <ul className="divide-y divide-[color:var(--border)] rounded-xl border border-[color:var(--border)] bg-white/70">
            {menu.menu.map((it) => (
              <li key={it.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{it.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {it.unit === "flat" ? "flat" : it.unit === "per_hour" ? "per hour" : "per person"}
                  </div>
                </div>
                <div className="text-gold-gradient font-display text-lg">
                  {formatMoney(it.default_price)}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <Link to="/onboarding/menu">
            <Button variant="ghost" className="h-11">← Back</Button>
          </Link>
          <Button onClick={finish} className="btn-gold h-11 px-6">
            Finish setup →
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
