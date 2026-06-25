import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadDraft, saveDraft, type MenuItem, type Unit } from "@/lib/menu-store";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/onboarding/menu")({
  component: MenuPage,
});

function MenuPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    setItems(loadDraft().menu);
  }, []);

  function update(idx: number, patch: Partial<MenuItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }
  function add() {
    setItems((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        label: "",
        default_price: 0,
        unit: "flat",
      },
    ]);
  }

  function next() {
    const d = loadDraft();
    const cleaned = items
      .filter((i) => i.label.trim().length > 0)
      .map((i) => ({ ...i, label: i.label.trim(), default_price: Number(i.default_price) || 0 }));
    saveDraft({ ...d, menu: cleaned });
    navigate({ to: "/onboarding/review" });
  }

  return (
    <PageShell step={2} totalSteps={3}>
      <div className="glass-card rounded-2xl p-6 sm:p-7">
        <div className="mb-1 text-sm font-medium text-[color:var(--gold)]">Your price menu ✨</div>
        <h1 className="font-display text-3xl">Build your price list</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These are the only services the AI can auto-fill. Anything off-menu gets flagged for you.
        </p>

        <div className="mt-5 space-y-3">
          {items.map((it, idx) => (
            <div key={it.id} className="rounded-xl border border-[color:var(--border)] bg-white/60 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Label</Label>
                    <Input
                      value={it.label}
                      onChange={(e) => update(idx, { label: e.target.value })}
                      placeholder="e.g. Wedding package (base)"
                      className="mt-1 h-10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Price (USD)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={it.default_price}
                        onChange={(e) => update(idx, { default_price: Number(e.target.value) })}
                        className="mt-1 h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Unit</Label>
                      <Select value={it.unit} onValueChange={(v) => update(idx, { unit: v as Unit })}>
                        <SelectTrigger className="mt-1 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">flat</SelectItem>
                          <SelectItem value="per_hour">per hour</SelectItem>
                          <SelectItem value="per_person">per person</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => remove(idx)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={add}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--gold-soft)] bg-white/40 py-3 text-sm font-medium text-[color:var(--accent-foreground)] hover:bg-white/70"
        >
          <Plus className="h-4 w-4" /> Add another item
        </button>

        <div className="mt-7 flex items-center justify-between">
          <Link to="/onboarding/welcome">
            <Button variant="ghost" className="h-11">← Back</Button>
          </Link>
          <Button onClick={next} className="btn-gold h-11 px-6" disabled={items.length === 0}>
            Review →
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
