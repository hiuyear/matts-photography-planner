import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { PageShell } from "@/components/PageShell";
import { loadMenu, saveExtraction } from "@/lib/menu-store";
import { api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/invoice/processing")({
  component: Processing,
});

function Processing() {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const menu = loadMenu();
    const transcriptText = sessionStorage.getItem("fieldinvoice.transcript");
    const source = sessionStorage.getItem("fieldinvoice.transcriptSource") ?? "paste";

    if (!menu || !transcriptText) {
      navigate({ to: "/invoice/new", replace: true });
      return;
    }

    (async () => {
      try {
        const result = await api.extract(menu, {
          source: source === "fathom" ? "fathom" : "paste",
          text: transcriptText,
        });

        saveExtraction(result);
        navigate({ to: "/invoice/review", replace: true });
      } catch (e) {
        console.error(e);
        toast.error("Extraction failed", { description: (e as Error).message });
        navigate({ to: "/invoice/new", replace: true });
      }
    })();
  }, [navigate]);

  return (
    <PageShell>
      <div className="glass-card mt-12 rounded-2xl p-12 text-center">
        <div className="mb-4 flex justify-center gap-2 text-4xl">
          <span className="sparkle" style={{ animationDelay: "0s" }}>✨</span>
          <span className="sparkle" style={{ animationDelay: "0.3s" }}>🥂</span>
          <span className="sparkle" style={{ animationDelay: "0.6s" }}>✨</span>
        </div>
        <h1 className="shimmer-text font-display text-3xl">Reading the conversation…</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mapping what was agreed against your menu.
        </p>
      </div>
    </PageShell>
  );
}
