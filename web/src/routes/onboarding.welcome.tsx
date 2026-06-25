import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadDraft, saveDraft } from "@/lib/menu-store";

export const Route = createFileRoute("/onboarding/welcome")({
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  useEffect(() => {
    const d = loadDraft();
    setBusinessName(d.business_name);
    setFromEmail(d.from_email);
  }, []);

  function next() {
    const d = loadDraft();
    saveDraft({ ...d, business_name: businessName.trim(), from_email: fromEmail.trim() });
    navigate({ to: "/onboarding/menu" });
  }

  const valid = businessName.trim().length > 0 && /\S+@\S+\.\S+/.test(fromEmail);

  return (
    <PageShell step={1} totalSteps={3}>
      <div className="glass-card rounded-2xl p-7">
        <div className="mb-1 text-sm font-medium text-[color:var(--gold)]">Welcome 🥂</div>
        <h1 className="font-display text-3xl">Tell us about your studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is what appears on every invoice you send.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="bn">Business name</Label>
            <Input
              id="bn"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Nix Hernandez Photography"
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label htmlFor="em">From email</Label>
            <Input
              id="em"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="matt@nixhernandez.com"
              className="mt-1.5 h-11"
            />
          </div>
        </div>

        <div className="mt-7 flex justify-end">
          <Button onClick={next} disabled={!valid} className="btn-gold h-11 px-6">
            Next →
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
